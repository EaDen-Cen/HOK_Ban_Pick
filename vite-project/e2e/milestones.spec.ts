import { initialState } from '../src/shared/types';
import { test,expect } from '@playwright/test';
import { harness } from './harness';
test('player mapping renders correct owner, HUD reconnects, MVP switches and recovery exports omit secrets',async({page,baseURL})=>{
  const h=await harness(baseURL);
  try{
    await h.send({type:'reset_match'});
    const base=h.state();base.blueTeam.players=['Alpha','Bravo','Charlie','Delta','Echo'];base.redTeam.players=['Fox','Golf','Hotel','India','Juliet'];
    await h.send({type:'settings',settings:base});
    await h.send({type:'set_player_slot_order',side:'blue',order:[4,3,2,1,0],expectedPlayers:base.blueTeam.players});
    await page.goto('/overlay/draft');
    await expect(page.locator('.broadcast-card[data-team-id="team-a"][data-slot="0"] .player-id')).toHaveText('Echo');
    await h.send({type:'live_game_stats',stats:{...h.state().liveGameStats,blueKills:8,redKills:5,blueTowers:3,redTowers:2}});
    await page.goto('/overlay/game-hud');await expect(page.locator('.game-hud')).toBeVisible();await expect(page.locator('.game-hud-stats')).toContainText('8');
    await page.reload();await expect(page.locator('.game-hud-stats')).toContainText('8');
    await page.setViewportSize({width:1920,height:1080});await page.screenshot({path:'artifacts/game-hud.png',omitBackground:true});
    await h.fill();await h.send({type:'commit_game'});await h.send({type:'post_game_begin'});
    const report=h.state().postGameReports[0],player=report.players[0];
    await h.send({type:'post_game_fields',reportId:report.id,updates:['kills','deaths','assists','rating','damageShare','gold','totalDamage'].map((metric,index)=>({rowId:player.rowId,metric:metric as 'kills',field:{value:[8,2,10,12.5,35,14000,72000][index],sourcePage:'overview',confidence:1,manual:true}}))});
    await page.goto('/overlay/mvp');await expect(page.locator('.mvp-card')).toHaveCount(0);
    await h.send({type:'select_mvp',reportId:report.id,rowId:player.rowId});await expect(page.locator('.mvp-card h1')).toHaveText('Echo');
    await page.screenshot({path:'artifacts/mvp.png',omitBackground:true});
    await h.send({type:'select_mvp',reportId:report.id,rowId:report.players[5].rowId});await expect(page.locator('.mvp-card.red h1')).toHaveText('Fox');
    const exportResult=await page.request.get('/api/match-export',{headers:{Authorization:'Bearer e2e-control'}});expect(exportResult.ok()).toBe(true);const exported=await exportResult.json();expect(exported.entries.some((entry:{path:string})=>entry.path==='access.json')).toBe(false);
    expect((await page.request.get('/api/recovery',{headers:{Authorization:'Bearer e2e-caster'}})).status()).toBe(403);
    await page.goto('/control');await expect(page.locator('.player-slot-alignment')).toBeVisible();await page.screenshot({path:'artifacts/control-milestones.png',fullPage:true});
  }finally{await h.send({type:'reset_match'});await h.send({type:'settings',settings:initialState()});h.close();}
});

test('shared capture auto-aligns both teams once and manual correction remains authoritative',async({page,baseURL})=>{
  const h=await harness(baseURL);
  try{
    await h.send({type:'reset_match'});const base=h.state();base.bpInputMode='screen';base.language='eng';base.blueTeam.players=['Alpha','Bravo','Charlie','Delta','Echo'];base.redTeam.players=['Fox','Golf','Hotel','India','Juliet'];await h.send({type:'settings',settings:base});
    await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{value:async()=>{const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,1920,1080);return canvas.captureStream(10);}});});
    await page.route('**/api/v1/recognition/players',async route=>{if(route.request().method()==='GET')return route.fulfill({json:{status:'ready'}});const solution={order:[4,3,2,1,0],confidence:[.95,.95,.95,.95,.95],average:.95,margin:.2,automatic:true,anomalies:[]};await route.fulfill({json:{texts:['Echo','Delta','Charlie','Bravo','Alpha','Juliet','India','Hotel','Golf','Fox'],blue:solution,red:solution,elapsedMs:200}});});
    await page.goto('/control');await page.getByRole('button',{name:'Choose game window',exact:true}).click();
    await expect.poll(()=>h.state().bluePlayerSlotOrder.join(',')).toBe('4,3,2,1,0');await expect.poll(()=>h.state().redPlayerSlotOrder.join(',')).toBe('4,3,2,1,0');
    await page.getByRole('combobox',{name:'blue P1 player',exact:true}).selectOption('0');await expect.poll(()=>h.state().bluePlayerSlotOrder.join(',')).toBe('0,3,2,1,4');
    await expect(page.locator('.player-slot-alignment input[type=checkbox]')).not.toBeChecked();
  }finally{await h.send({type:'reset_match'});await h.send({type:'settings',settings:initialState()});h.close();}
});
