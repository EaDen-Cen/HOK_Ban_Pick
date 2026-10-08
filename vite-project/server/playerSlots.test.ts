import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Store } from './store.js';
import { initialState, phases, type Action } from '../src/shared/types.js';
import { normalizeState, pickRestriction } from '../src/shared/draftRules.js';
import { playerAtSlot, solvePlayerSlots } from '../src/shared/playerSlots.js';
import { createCaptureSlotPreset, readCaptureSlotPresets } from '../src/control/captureSlotPresets.js';
import { defaultCaptureSlots } from '../src/control/bpCaptureLayout.js';
import heroes from '../src/components/HeroList.js';
const apply=(s:Store,a:Action)=>s.apply(randomUUID(),s.data.revision,a);
const ids=['Alpha','Bravo','Charlie','Delta','Echo'];
const permutations=(v:number[]):number[][]=>v.length<=1?[v]:v.flatMap((x,i)=>permutations(v.filter((_,j)=>i!==j)).map(r=>[x,...r]));
test('all 120 player permutations resolve globally without duplicate identities',()=>{
  for(const order of permutations([0,1,2,3,4])){
    const result=solvePlayerSlots(order.map(i=>ids[i]),ids)!;
    assert.deepEqual(result.order,order);assert.equal(result.automatic,true);
  }
});
test('case, whitespace, NFKC and OCR confusion normalize; close IDs and substitutes never auto apply',()=>{
  assert.equal(solvePlayerSlots([' ＡＬＰＨＡ ','b r a v o','CHARLIE','Delta','Echo'],ids)!.automatic,true);
  assert.equal(solvePlayerSlots(['AOpha','Bravo','Charlie','Delta','Echo'],ids)!.automatic,false);
  const similar=['Den1','Denl','Charlie','Delta','Echo'];
  assert.equal(solvePlayerSlots(['DenI','Denl','Charlie','Delta','Echo'],similar)!.automatic,false);
  assert.equal(solvePlayerSlots(['Unknown','Bravo','Charlie','Delta','Echo'],ids)!.automatic,false);
  assert.equal(solvePlayerSlots(ids,ids,[.1,1,1,1,1])!.automatic,false);
  assert.equal(solvePlayerSlots(ids,ids,[1,1,1,1,1])!.automatic,true);
  assert.equal(solvePlayerSlots(['Alpha Roaming','Bravo Jungling','Charlie Mid','Delta Clash','Echo Farm'],ids)!.automatic,true);
  assert.equal(solvePlayerSlots(ids,['','','','','']),undefined);
});
test('mapping controls player/portrait/role, saves history, follows identity in Player BP and resets next game',()=>{
  const s=new Store(), base=initialState();
  base.blueTeam.players=[...ids];base.redTeam.players=ids.map(p=>'Red'+p);base.blueTeam.playerPortraits=ids.map(p=>'/'+p+'.png');base.draftRuleMode='player';
  apply(s,{type:'settings',settings:base});
  apply(s,{type:'set_player_slot_order',side:'blue',order:[4,3,2,1,0],expectedPlayers:ids});
  assert.equal(playerAtSlot(s.data.state,'blue',0).id,'Echo');
  assert.equal(playerAtSlot(s.data.state,'blue',0).portrait,'/Echo.png');
  assert.equal(playerAtSlot(s.data.state,'blue',0).role,'roam');
  assert.deepEqual(s.data.state.blueTeam.players,ids);
  phases('match').forEach((phase,i)=>apply(s,{type:'draft_action',...phase,heroId:heroes[i].id}));
  const echoHero=s.data.state.blueAssignments[0]!;
  apply(s,{type:'commit_game'});
  assert.deepEqual(s.data.state.draftHistory[0].bluePlayerSlotOrder,[4,3,2,1,0]);
  assert.throws(()=>apply(s,{type:'set_player_slot_order',side:'blue',order:[0,1,2,3,4],expectedPlayers:ids}));
  apply(s,{type:'score',team:'blue',delta:1});apply(s,{type:'next_game'});
  assert.deepEqual(s.data.state.bluePlayerSlotOrder,[0,1,2,3,4]);
  assert.equal(pickRestriction(s.data.state,'blue',4,echoHero),'usedByPlayer');
  assert.equal(pickRestriction(s.data.state,'blue',0,echoHero),undefined);
  apply(s,{type:'set_player_slot_order',side:'blue',order:[4,0,1,2,3],expectedPlayers:ids});
  assert.equal(pickRestriction(s.data.state,'blue',0,echoHero),'usedByPlayer');
  apply(s,{type:'undo'});assert.deepEqual(s.data.state.bluePlayerSlotOrder,[0,1,2,3,4]);
});
test('invalid permutations and stale rosters are atomic; legacy state upgrades; preset ID crops roundtrip',()=>{
  const s=new Store();
  for(const order of [[0,0,1,2,3],[0,1,2,3,5],[0,1,2,3]]){
    assert.throws(()=>apply(s,{type:'set_player_slot_order',side:'blue',order,expectedPlayers:s.data.state.blueTeam.players}));
    assert.equal(s.data.revision,0);
  }
  assert.throws(()=>apply(s,{type:'set_player_slot_order',side:'blue',order:[4,3,2,1,0],expectedPlayers:ids}));
  const state=initialState();delete (state as Partial<typeof state>).bluePlayerSlotOrder;
  assert.deepEqual(normalizeState(state).bluePlayerSlotOrder,[0,1,2,3,4]);
  const slots={...defaultCaptureSlots,playerIds:{blue1:{x:.1,y:.2,width:.2,height:.03}}};
  const preset=createCaptureSlotPreset({id:'test',name:'Test',slots});
  assert.deepEqual(readCaptureSlotPresets(JSON.stringify([preset]))[0].slots.playerIds,slots.playerIds);
  const legacy={...preset,playerIdLayoutVersion:undefined};
  assert.equal(readCaptureSlotPresets(JSON.stringify([legacy]))[0].slots.playerIds,undefined);
});
