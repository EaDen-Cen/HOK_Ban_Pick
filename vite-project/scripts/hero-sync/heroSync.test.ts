import assert from 'node:assert/strict';
import test from 'node:test';
import type { Hero } from '../../src/data/heroTypes.js';
import { detectImage } from './assets.js';
import { makePlan, nextLocalIds } from './compare.js';
import { mergeOverride } from './generated.js';
import { normalizeName } from './normalize.js';
import type { CatalogHero, SourceSnapshot } from './types.js';

const local = (overrides: Partial<Hero> = {}): Hero => ({
  id: 1,
  englishName: "Ao'yin",
  chineseName: '敖隐',
  imageLink: '/heroesImg/1.png',
  occupation: 'Farm Lane',
  aliases: ['Loong'],
  combo: [2],
  counter: [],
  beCountered: [],
  ...overrides,
});

const remote = (overrides: Partial<CatalogHero> = {}): CatalogHero => ({
  campId: 254,
  englishName: "Ao'yin",
  occupation: 'Farm Lane',
  imageUrl: 'https://camp.honorofkings.com/test.png',
  detailUrl: 'https://wiki.bittopup.com/hok/254',
  source: 'bittopup',
  ...overrides,
});

test('normalization matches historical aliases without creating a duplicate hero', () => {
  assert.equal(normalizeName("Ao'yin"), 'aoyin');
  const plan = makePlan([local()], [remote({ englishName: 'Loong' })]);
  assert.equal(plan.additions.length, 0);
  assert.equal(plan.matches.length, 1);
});

test('a source rename keeps identity through the previous camp snapshot', () => {
  const previous: SourceSnapshot = {
    checkedAt: '2026-01-01T00:00:00Z',
    source: 'test',
    heroes: [remote({ englishName: 'Old Name' })],
  };
  const hero = local({ englishName: 'Old Name', aliases: [] });
  const plan = makePlan([hero], [remote({ englishName: 'New Name' })], previous);
  assert.equal(plan.additions.length, 0);
  assert.equal(plan.matches[0].local.id, hero.id);
  assert.ok(plan.sourceChanges.some(change => change.field === 'englishName'));
});

test('remote omissions never remove local heroes', () => {
  const plan = makePlan([local()], []);
  assert.equal(plan.missingLocal.length, 1);
  assert.equal(plan.missingLocal[0].id, 1);
});

test('new local IDs are append-only and deterministic', () => {
  assert.deepEqual(nextLocalIds([local({ id: 117 })], 3), [118, 119, 120]);
});

test('safe override merge cannot invent relationship fields', () => {
  const result = mergeOverride(
    { aliases: ['Old'] },
    { englishName: 'New', aliases: ['Old', 'Legacy'] },
  );
  assert.deepEqual(result.aliases, ['Old', 'Legacy']);
  assert.equal(result.englishName, 'New');
  assert.equal('counter' in result, false);
});

test('image magic validation supports PNG/JPEG/WebP and rejects text', () => {
  assert.equal(detectImage(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))?.extension, 'png');
  assert.equal(detectImage(Uint8Array.from([0xff,0xd8,0xff,0x00]))?.extension, 'jpg');
  assert.equal(detectImage(Uint8Array.from([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50]))?.extension, 'webp');
  assert.equal(detectImage(new TextEncoder().encode('not an image')), undefined);
});
