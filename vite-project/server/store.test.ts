import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store } from './store.js';
import { initialState, phases, type Action } from '../src/shared/types.js';
import heroes from '../src/components/HeroList.js';
const apply = (store: Store, action: Action) => store.apply(randomUUID(), store.data.revision, action);
const pick = (store: Store, heroId: number) => apply(store, { type: 'draft_action', ...phases(store.data.state.draftMode)[store.data.state.currentPhase], heroId });

test('both draft modes complete with exactly five picks and the expected bans', () => {
  for (const mode of ['match', 'normal'] as const) {
    const s = new Store(); apply(s, { type: 'settings', settings: { ...initialState(), draftMode: mode } });
    phases(mode).forEach((_, i) => pick(s, heroes[i].id));
    assert.equal(s.data.state.bluePicks.length, 5); assert.equal(s.data.state.redPicks.length, 5);
    assert.equal(s.data.state.blueBans.length, mode === 'match' ? 4 : 2); assert.equal(s.data.state.draftComplete, true);
    assert.throws(() => pick(s, 80));
  }
});
test('caster sees picks only at the exact delay boundary, and no realtime revision', () => {
  let now = 1000000; const s = new Store(undefined, () => now); pick(s, 46);
  assert.equal(s.snapshot('overlay').state.blueBans[0], 46);
  now += 179999; assert.equal(s.snapshot('caster').state.blueBans.length, 0); assert.equal(s.snapshot('caster').revision, 0);
  now++; assert.deepEqual(s.snapshot('caster').state.blueBans, [46]);
});
test('all metadata and next-game resets follow the same delayed timeline', () => {
  let now = 1000000; const s = new Store(undefined, () => now);
  apply(s, {
    type: 'settings',
    settings: {
      ...initialState(),
      blueTeam: {
        ...initialState().blueTeam,
        name: 'Secret finalist',
        logo: '/logo.png',
      },
      blueScore: 1,
      gameNumber: 2,
    },
  });
  assert.equal(s.snapshot('caster').state.blueScore, 0); assert.equal(s.snapshot('caster').state.gameNumber, 1);
  assert.equal(s.snapshot('caster').state.blueTeam.name, initialState().blueTeam.name);
  now += 180000; assert.equal(s.snapshot('caster').state.blueScore, 1);
  apply(s, { type: 'reset_match' }); assert.equal(s.snapshot('caster').state.blueScore, 1);
  now += 180000; assert.equal(s.snapshot('caster').state.blueScore, 0);
});
test('undo is a new delayed event, preserving the earlier timeline', () => {
  let now = 1000000; const s = new Store(undefined, () => now); pick(s, 46);
  now += 10000; apply(s, { type: 'undo' }); assert.deepEqual(s.data.state.blueBans, []);
  now = 1180000; assert.deepEqual(s.snapshot('caster').state.blueBans, [46]);
  now += 10000; assert.deepEqual(s.snapshot('caster').state.blueBans, []);
});
test('delay calibration recalculates historical state in both directions', () => {
  let now = 1000000; const s = new Store(undefined, () => now); pick(s, 46); now += 10000;
  apply(s, { type: 'delay', seconds: 5 }); assert.deepEqual(s.snapshot('caster').state.blueBans, [46]);
  apply(s, { type: 'delay', seconds: 20 }); assert.deepEqual(s.snapshot('caster').state.blueBans, []);
  now += 10000; assert.deepEqual(s.snapshot('caster').state.blueBans, [46]);
});
test('reset draft preserves match metadata and undo restores draft', () => {
  const s = new Store(); apply(s, { type: 'settings', settings: { ...initialState(), blueScore: 1, stage: 'Final' } });
  pick(s, 46); apply(s, { type: 'reset_draft' }); assert.equal(s.data.state.stage, 'Final'); assert.equal(s.data.state.blueScore, 1);
  assert.equal(s.data.state.currentPhase, 0); apply(s, { type: 'undo' }); assert.deepEqual(s.data.state.blueBans, [46]);
});
test('reject duplicate hero, invalid hero, wrong turn, stale revision, malformed settings', () => {
  const s = new Store();
  assert.throws(() => apply(s, { type: 'draft_action', team: 'red', action: 'pick', heroId: 46 }));
  assert.throws(() => pick(s, 9999)); pick(s, 46); assert.throws(() => pick(s, 46));
  assert.throws(() => s.apply(randomUUID(), 0, { type: 'reset_match' }));
  assert.throws(() => apply(s, { type: 'delay', seconds: -1 }));
  assert.throws(() => apply(s, { type: 'settings', settings: { ...initialState(), blueScore: 3 } }));
  assert.equal(s.data.revision, 1);
});
test('duplicate request ID is idempotent even after revision changes', () => {
  const s = new Store(); const id = randomUUID();
  s.apply(id, 0, { type: 'draft_action', team: 'blue', action: 'ban', heroId: 46 });
  s.apply(id, 0, { type: 'draft_action', team: 'blue', action: 'ban', heroId: 46 });
  assert.equal(s.data.revision, 1); assert.equal(s.data.events.length, 1);
});
test('restart recovers realtime state, event queue, delay, deduplication and undo history', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'hok-store-')), 'match.json');
  let now = 1000000; const s = new Store(file, () => now); pick(s, 46); apply(s, { type: 'delay', seconds: 90 });
  const restored = new Store(file, () => now); assert.deepEqual(restored.data, s.data);
  now += 90000; assert.deepEqual(restored.snapshot('caster').state.blueBans, [46]);
  apply(restored, { type: 'undo' }); assert.equal(restored.data.state.currentPhase, 0);
  assert.equal(JSON.parse(readFileSync(file, 'utf8')).revision, 3);
});
test('disk failure never advances authoritative state', () => {
  const folder = mkdtempSync(join(tmpdir(), 'hok-failure-'));
  const s = new Store(join(folder, 'missing', 'state.json'));
  // A file in place of the intended parent directory makes persistence fail.
  const original = structuredClone(s.data);
  Object.defineProperty(s, 'file', { value: join(folder, 'unavailable\0', 'state.json') });
  assert.throws(() => pick(s, 46)); assert.deepEqual(s.data, original);
});


test('director hero art overrides persist, reset safely, and survive match reset', () => {
  const s = new Store();
  const heroId = heroes[0].id;
  apply(s, {
    type: 'hero_art_override',
    heroId,
    override: {
      useLegacyImage: true,
      panel: { x: 42, y: 28, scale: 1.35 },
      side: { x: 61, y: 31, scale: 1.18 },
    },
  });
  assert.equal(s.data.state.heroArtOverrides[String(heroId)].useLegacyImage, true);
  assert.deepEqual(s.data.state.heroArtOverrides[String(heroId)].panel, { x: 42, y: 28, scale: 1.35 });

  apply(s, { type: 'reset_hero_art_override', heroId, layout: 'panel' });
  assert.equal(s.data.state.heroArtOverrides[String(heroId)].panel, undefined);
  assert.equal(s.data.state.heroArtOverrides[String(heroId)].useLegacyImage, true);

  apply(s, { type: 'reset_match' });
  assert.equal(s.data.state.heroArtOverrides[String(heroId)].useLegacyImage, true);
});

test('director artwork settings validate crop ranges and presentation settings', () => {
  const s = new Store();
  const heroId = heroes[0].id;
  assert.throws(() => apply(s, {
    type: 'hero_art_override',
    heroId,
    override: { panel: { x: 101, y: 50, scale: 1 } },
  }));
  assert.throws(() => apply(s, {
    type: 'hero_art_override',
    heroId,
    override: { side: { x: 50, y: 50, scale: 4 } },
  }));

  apply(s, {
    type: 'settings',
    settings: { ...initialState(), showHeroName: false, artSourceMode: 'legacy' },
  });
  assert.equal(s.data.state.showHeroName, false);
  assert.equal(s.data.state.artSourceMode, 'legacy');
});
