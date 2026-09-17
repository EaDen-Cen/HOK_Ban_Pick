import { test, expect } from '@playwright/test';
import { WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import heroes from '../src/components/HeroList';
import { pickRestriction } from '../src/shared/draftRules';
import { phases, type Action, type Snapshot } from '../src/shared/types';

async function harness(baseURL: string | undefined) {
  expect(baseURL).toBe('http://127.0.0.1:3101');
  const ws = new WebSocket('ws://127.0.0.1:3101/ws');
  let snapshot: Snapshot;
  const waiting = new Map<string, { resolve: () => void; reject: (error: Error) => void }>();
  await new Promise<void>((resolve, reject) => {
    ws.on('error', reject);
    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', token: 'e2e-control' })));
    ws.on('message', raw => {
      const message = JSON.parse(raw.toString());
      if (message.type === 'match_state_update') { snapshot = message; resolve(); }
      const pending = waiting.get(message.id);
      if (pending && message.type === 'ack') { waiting.delete(message.id); pending.resolve(); }
      if (pending && message.type === 'error') { waiting.delete(message.id); pending.reject(new Error(message.error)); }
    });
  });
  const send = async (action: Action) => {
    await new Promise(r => setTimeout(r, 50));
    await new Promise<void>((resolve, reject) => {
      const id = randomUUID(), timer = setTimeout(() => { waiting.delete(id); reject(new Error('Action timed out')); }, 10000);
      waiting.set(id, { resolve: () => { clearTimeout(timer); resolve(); }, reject: error => { clearTimeout(timer); reject(error); } });
      ws.send(JSON.stringify({ type: 'action', id, revision: snapshot.revision, action }));
    });
  };
  const fill = async () => {
    while (!snapshot.state.draftComplete) {
      const state = snapshot.state, phase = phases(state.draftMode)[state.currentPhase];
      const used = [...state.blueBans, ...state.redBans, ...state.bluePicks, ...state.redPicks];
      const hero = heroes.find(h => !used.includes(h.id) && (phase.action === 'ban' || !pickRestriction(state, phase.team, state[`${phase.team}Picks`].length, h.id)))!;
      await send({ type: 'draft_action', ...phase, heroId: hero.id });
    }
  };
  return { send, fill, state: () => snapshot.state, close: () => ws.close() };
}

for (const mode of ['normal', 'player', 'global'] as const) {
  test(`${mode} BP: committed history, real picker eligibility, immediate score, delayed caster and side swaps`, async ({ browser, baseURL }) => {
    const h = await harness(baseURL);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    try {
      await h.send({ type: 'reset_match' });
      await h.send({ type: 'settings', settings: { ...h.state(), draftRuleMode: mode, seriesFormat: 'BO5', language: 'eng', stage: 'Semifinal',
        blueTeam: { ...h.state().blueTeam, name: 'NORTHWIND', players: ['Orion', 'Kite', 'Nova', 'Echo', 'River'] },
        redTeam: { ...h.state().redTeam, name: 'CRIMSON FIVE', players: ['Atlas', 'Flare', 'Vex', 'Sage', 'Luna'] },
      } });
      await h.send({ type: 'delay', seconds: 180 });
      const control = await context.newPage(), caster = await context.newPage(), overlay = await context.newPage();
      const pageErrors: string[] = [];
      for (const page of [control, caster, overlay]) page.on('pageerror', error => pageErrors.push(error.message));
      control.on('dialog', dialog => dialog.accept());
      await control.goto('/control#token=e2e-control');
      await caster.goto('/caster#token=e2e-caster');
      await overlay.setViewportSize({ width: 1920, height: 1080 });
      await overlay.goto('/overlay/draft#token=e2e-overlay');
      await expect(control.locator('.status')).toHaveText('Connected');
      await expect(control.getByRole('button', { name: 'Commit game', exact: true })).toBeDisabled();
      await h.fill();
      const first = structuredClone(h.state());
      await expect(overlay.locator('.broadcast-card img')).toHaveCount(10);
      await expect(overlay.locator('.position-icon')).toHaveCount(10);
      await expect(overlay.locator('.card-caption').first()).toContainText('Orion');
      await expect(overlay.locator('.broadcast-meta')).toContainText(`${mode.toUpperCase()} BP`);
      await control.getByRole('button', { name: 'Commit game', exact: true }).click();
      await expect(overlay.locator('.history-game')).toHaveCount(1);
      await expect(caster.locator('.history-game')).toHaveCount(0);
      await expect(control.getByRole('button', { name: 'Game committed', exact: true })).toBeDisabled();
      await control.getByRole('button', { name: 'Match settings', exact: true }).click();
      await expect(control.getByLabel('BP rules', { exact: true })).toBeDisabled();
      const teamName = control.getByLabel('Team name', { exact: true }).first();
      await teamName.fill('Unsaved name');
      await control.locator('.score-control').first().getByRole('button', { name: 'Increase series score', exact: true }).click();
      await expect(overlay.locator('.blue-score')).toHaveText('1');
      await expect(teamName).toHaveValue('Unsaved name');
      await expect(overlay.locator('.broadcast-team.blue h2')).toHaveText('NORTHWIND');
      await expect(caster.locator('.blue header strong')).toHaveText('0');
      await control.getByRole('button', { name: 'Hide match settings', exact: true }).click();
      await control.getByRole('button', { name: 'Start next game', exact: true }).click();
      await expect(overlay.locator('.broadcast-card img')).toHaveCount(0);
      await expect(overlay.locator('.history-game')).toHaveCount(1);
      for (let i = 0; i < 4; i++) await h.send({ type: 'draft_action', ...phases('match')[i], heroId: heroes[85 + i].id });
      const firstHero = heroes.find(hero => hero.id === first.bluePicks[0])!;
      const teammateHero = heroes.find(hero => hero.id === first.bluePicks[1])!;
      const enemyHero = heroes.find(hero => hero.id === first.redPicks[0])!;
      if (mode === 'normal') await expect(control.getByTitle(firstHero.englishName, { exact: true })).toBeEnabled();
      else await expect(control.getByTitle(firstHero.englishName, { exact: true })).toBeDisabled();
      if (mode === 'global') await expect(control.getByTitle(teammateHero.englishName, { exact: true })).toBeDisabled();
      else await expect(control.getByTitle(teammateHero.englishName, { exact: true })).toBeEnabled();
      await expect(control.getByTitle(enemyHero.englishName, { exact: true })).toBeEnabled();
      await h.fill();
      await h.send({ type: 'commit_game' }); await h.send({ type: 'score', team: 'red', delta: 1 }); await h.send({ type: 'next_game' });
      await control.getByRole('button', { name: 'Swap sides', exact: true }).click();
      await expect(overlay.locator('.broadcast-team.blue h2')).toHaveText('CRIMSON FIVE');
      await expect(overlay.locator('.history-game[data-game="1"] .history-team.red img').first()).toHaveAttribute('src', firstHero.imageLink);
      await h.fill();
      await h.send({ type: 'delay', seconds: 0 });
      await expect(caster.locator('.history-game')).toHaveCount(2);
      await expect(caster.locator('.analysis[data-side="blue"] h2')).toHaveText('CRIMSON FIVE');
      await control.reload(); await overlay.reload();
      await expect(control.locator('.status')).toHaveText('Connected');
      await expect(control.locator('.history-game')).toHaveCount(2);
      const score = await overlay.locator('.broadcast-score').boundingBox();
      expect(Math.abs(score!.x + score!.width / 2 - 960)).toBeLessThan(2);
      const cards = await overlay.locator('.broadcast-card').all();
      for (const card of cards) {
        const rect = await card.boundingBox();
        expect(rect!.y).toBeGreaterThan(0); expect(rect!.x).toBeGreaterThanOrEqual(0);
        expect(rect!.x + rect!.width).toBeLessThanOrEqual(1920); expect(rect!.y + rect!.height).toBeLessThanOrEqual(1080);
      }
      expect(await overlay.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
      expect(await overlay.evaluate(() => document.documentElement.scrollWidth)).toBe(1920);
      await overlay.screenshot({ path: `artifacts/v2-${mode}-overlay.png`, omitBackground: true });
      await control.screenshot({ path: `artifacts/v2-${mode}-control.png`, fullPage: true });
      expect(pageErrors).toEqual([]);
    } finally { h.close(); await context.close(); }
  });
}
