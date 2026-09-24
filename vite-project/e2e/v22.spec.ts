import { test, expect } from '@playwright/test';
import { harness } from './harness';
import heroes from '../src/components/HeroList';
import { phases } from '../src/shared/types';

for (const layout of ['panel', 'side'] as const) {
  test(`V2.2 ${layout}: portraits, actual layout, color-aware position, red first and isolated animations`, async ({ browser, baseURL }) => {
    const h = await harness(baseURL);
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    try {
      await h.send({ type: 'reset_match' });
      await h.send({ type: 'settings', settings: { ...h.state(), language: 'eng', overlayLayout: layout, sideSwapMode: 'colorsOnly', firstPickSide: 'red', draftRuleMode: 'global', seriesFormat: 'BO5',
        blueTeam: { ...h.state().blueTeam, name: 'NORTHWIND', players: ['Orion', 'Kite', 'Nova', 'Echo', 'River'], playerPortraits: heroes.slice(50,55).map(h => h.imageLink) },
        redTeam: { ...h.state().redTeam, name: 'CRIMSON FIVE', players: ['Atlas', 'Flare', 'Vex', 'Sage', 'Luna'], playerPortraits: heroes.slice(55,60).map(h => h.imageLink) },
      } });
      await h.send({ type: 'score', team: 'blue', delta: 1 });
      await h.send({ type: 'swap_sides' });
      const page = await context.newPage();
      const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto('/overlay/draft#token=e2e-overlay');
      await expect(page.locator('.player-portrait')).toHaveCount(10);
      await expect(page.locator('.broadcast-team.display-left')).toHaveClass(/red/);
      await expect(page.locator('.broadcast-team.display-left h2')).toHaveText('NORTHWIND');
      await expect(page.locator('.broadcast-score strong').first()).toHaveText('1');
      await expect(page.locator('.pick-team.acting')).toHaveClass(/display-left/);
      const header = await page.locator('.broadcast-header').boundingBox();
      const score = await page.locator('.broadcast-score').boundingBox();
      expect(header!.y).toBeLessThan(40); expect(score!.y + score!.height).toBeLessThan(140);
      expect(score!.x + score!.width / 2).toBe(960);
      for (const position of ['left', 'right']) {
        const cards = await page.locator(`.pick-team.display-${position} .broadcast-card`).all();
        expect(cards).toHaveLength(5);
        const boxes = await Promise.all(cards.map(c => c.boundingBox()));
        if (layout === 'panel') {
          expect(boxes.every(b => b!.y > 650 && b!.y === boxes[0]!.y)).toBeTruthy();
          expect(boxes[4]!.x).toBeGreaterThan(boxes[0]!.x);
        } else {
          expect(boxes.every(b => b!.x === boxes[0]!.x)).toBeTruthy();
          expect(boxes[4]!.y).toBeGreaterThan(boxes[0]!.y + 500);
          expect(position === 'left' ? boxes[0]!.x < 100 : boxes[0]!.x > 1600).toBeTruthy();
        }
      }
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
      expect(await page.locator('.card-caption').first().evaluate(e => getComputedStyle(e).writingMode)).toBe('horizontal-tb');
      await page.screenshot({ path: `artifacts/v22-${layout}-portraits.png`, omitBackground: true });
      // Record actual rendered cover/image ordering, and CSS animation directions.
      await page.evaluate(() => {
        const events: object[] = []; (window as unknown as {revealEvents: object[]}).revealEvents = events;
        document.addEventListener('animationstart', event => {
          const e = event as AnimationEvent;
          const el = e.target as HTMLElement;
          events.push({ type: 'animation', name: e.animationName, position: el.closest('.pick-team')?.className });
        });
        const target = document.querySelector('.pick-team.display-left .hero-reveal')!;
        new MutationObserver(() => {
          const cover = target.querySelector('.reveal-white');
          events.push({ type: 'state', hero: target.getAttribute('data-showing-hero'), sequence: target.getAttribute('data-reveal-sequence'), cover: cover ? getComputedStyle(cover).opacity : null, image: !!target.querySelector('.hero-art') });
        }).observe(target, { attributes: true, childList: true, subtree: true });
      });
      for (let i = 0; i < 4; i++) await h.send({ type: 'draft_action', ...phases('match', 'red')[i], heroId: heroes[90+i].id });
      const pick = { type: 'draft_action' as const, team: 'red' as const, action: 'pick' as const, heroId: heroes[0].id };
      await h.send(pick);
      const reveal = page.locator('.pick-team.display-left .hero-reveal').first();
      await expect(reveal).toHaveAttribute('data-reveal-sequence', '1');
      await expect(reveal).toHaveClass('hero-reveal');
      await expect(page.locator('.player-portrait')).toHaveCount(9);
      await expect(page.locator('.hero-reveal[data-reveal-sequence="0"]')).toHaveCount(9);
      const events = await page.evaluate(() => (window as unknown as {revealEvents: {type:string;hero:string;cover:string|null;image:boolean;name:string;position:string}[]}).revealEvents);
      if (layout === 'panel') {
        expect(events.some(e => e.type === 'state' && e.hero === '' && e.cover !== null && !e.image)).toBeTruthy();
        expect(events.some(e => e.type === 'state' && e.hero === String(pick.heroId) && Number(e.cover) >= .98)).toBeTruthy();
        expect(events.some(e => e.name === 'white-wipe')).toBeTruthy();
      } else {
        expect(events.some(e => e.name === 'slide-in-left' && e.position.includes('red'))).toBeTruthy();
        expect(events.some(e => e.name === 'white-wipe')).toBeFalsy();
      }
      await h.send({ type: 'undo' }); await expect(page.locator('.player-portrait')).toHaveCount(10);
      await h.send(pick); await expect(reveal).toHaveAttribute('data-reveal-sequence', '2');
      await expect(reveal).toHaveClass('hero-reveal');
      await h.send({ type: 'settings', settings: { ...h.state(), language: 'zh' } });
      await h.send({ type: 'score', team: 'blue', delta: 1 });
      await expect(page.locator('.broadcast-brand')).toHaveText('王者荣耀国际服');
      await expect(reveal).toHaveAttribute('data-reveal-sequence', '2');
      await expect(page.locator('.hero-reveal[data-reveal-sequence="0"]')).toHaveCount(9);
      await h.send({ type: 'draft_action', ...phases('match', 'red')[5], heroId: heroes[1].id });
      await expect(page.locator('.pick-team.display-right .hero-reveal').first()).toHaveAttribute('data-reveal-sequence','1');
      await expect(page.locator('.pick-team.display-right .hero-reveal').first()).toHaveClass('hero-reveal');
      if (layout === 'side') expect(await page.evaluate(() => (window as unknown as {revealEvents: {name:string;position:string}[]}).revealEvents.some(e => e.name === 'slide-in-right' && e.position.includes('blue')))).toBeTruthy();
      await h.fill(); await h.send({ type: 'commit_game' });
      await expect(page.locator('.history-game')).toHaveCount(1);
      await expect(page.locator('.hero-reveal[class*="reveal-"]')).toHaveCount(0);
      await page.screenshot({ path: `artifacts/v22-${layout}-complete.png`, omitBackground: true });
      expect(errors).toEqual([]);
    } finally { h.close(); await context.close(); }
  });
}

test('V2.2 settings, portrait fallback, mobile, reduced motion and delayed first-pick display', async ({ browser, baseURL }) => {
  const h = await harness(baseURL);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  try {
    await h.send({ type: 'reset_match' });
    await h.send({ type: 'settings', settings: { ...h.state(), language:'eng' } });
    await h.send({ type: 'delay', seconds: 0 });
    const control = await context.newPage(), caster = await context.newPage(), overlay = await context.newPage();
    await control.goto('/control#token=e2e-control'); await caster.goto('/caster#token=e2e-caster');
    await overlay.setViewportSize({width:1920,height:1080}); await overlay.goto('/overlay/draft#token=e2e-overlay');
    await expect(caster.locator('.board .phase')).toHaveClass('phase blue');
    await h.send({ type: 'delay', seconds: 3600 });
    await control.getByRole('button',{name:'Match settings',exact:true}).click();
    await control.getByLabel('Draft starting side',{exact:true}).selectOption('red');
    await control.getByLabel('Side swap behavior',{exact:true}).selectOption('colorsOnly');
    await control.getByLabel('Player portrait URL',{exact:true}).first().fill('/playerImg/missing.png');
    await control.getByLabel('Team logo URL',{exact:true}).first().fill(heroes[30].imageLink);
    await control.getByRole('button',{name:'Save settings',exact:true}).click();
    await expect(overlay.locator('.pick-team.blue .player-portrait')).toHaveCount(5);
    await expect(overlay.locator('.pick-team.blue .player-portrait').first()).toHaveAttribute('src',heroes[30].imageLink);
    await expect(overlay.locator('.pick-team.red .portrait-placeholder')).toHaveCount(5);
    expect(await control.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await control.screenshot({path:'artifacts/v22-mobile-settings.png',fullPage:true});
    for (let i=0;i<5;i++) await h.send({type:'draft_action',...phases('match','red')[i],heroId:heroes[70+i].id});
    await expect(control.getByLabel('Draft starting side',{exact:true})).toBeDisabled();
    await control.getByRole('textbox', { name: 'Player 1', exact: true }).first().fill('Live Substitute');
    await control.getByRole('combobox', { name: 'Lane', exact: true }).first().selectOption('roam');
    await control.getByLabel('Player portrait URL', {exact:true}).first().fill(heroes[31].imageLink);
    await control.getByRole('button', {name:'Save settings',exact:true}).click();
    await expect(overlay.locator('.pick-team.blue .card-caption').first()).toContainText('Live Substitute');
    await expect(overlay.locator('.pick-team.blue .position-icon').first()).toHaveAttribute('aria-label','Roaming');
    await expect(overlay.locator('.pick-team.blue .player-portrait').first()).toHaveAttribute('src',heroes[31].imageLink);
    expect(h.state().currentPhase).toBe(5);

    await expect(overlay.locator('.hero-art')).toHaveCount(1);
    await expect(overlay.locator('.reveal-white')).toHaveCount(0);
    await expect(overlay.locator('.hero-reveal[data-reveal-sequence="0"]')).toHaveCount(10);
    await expect(caster.locator('.picks img')).toHaveCount(0);
    await h.send({type:'delay',seconds:0});
    await expect(caster.locator('.red .picks img')).toHaveCount(1);
    await expect(caster.locator('.board .phase')).toHaveClass('phase blue');
    await control.reload(); await expect(control.locator('.status')).toHaveText('Connected');
    await control.getByRole('button',{name:'Match settings',exact:true}).click();
    await expect(control.getByLabel('Draft starting side',{exact:true})).toHaveValue('red');
    await expect(control.getByLabel('Side swap behavior',{exact:true})).toHaveValue('colorsOnly');
  } finally { h.close(); await context.close(); }
});
