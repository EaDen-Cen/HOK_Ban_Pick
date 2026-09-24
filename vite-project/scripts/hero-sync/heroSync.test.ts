import assert from 'node:assert/strict';
import test from 'node:test';
import type { Hero } from '../../src/data/heroTypes.js';
import { detectImage } from './assets.js';
import { makePlan, nextLocalIds } from './compare.js';
import { mergeOverride } from './generated.js';
import { normalizeName } from './normalize.js';
import { extractOfficialHeroArt } from './fetchOfficial.js';
import { heroArtCrop } from '../../src/data/heroArtFocus.js';
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

test('official artwork parser prefers main hero key art and ignores skins/icons', () => {
  const html = `
    <img class="site-logo" src="https://world.honorofkings.com/logo.png" alt="logo">
    <img class="hero-kv character-cover" src="https://camp.honorofkings.com/art/heino-1920x1080.jpg" alt="HEINO" width="1920" height="1080">
    <img class="hero-icon" src="https://camp.honorofkings.com/icon/heino.png" alt="HEINO icon">
    <section>SKIN APPRECIATION</section>
    <img src="https://camp.honorofkings.com/skins/heino-skin.jpg" alt="SKIN APPRECIATION-Temporal Agent">
  `;
  assert.equal(
    extractOfficialHeroArt(html, 'https://world.honorofkings.com/zlkdatasys/ip/hero/en/563.html', 'Heino'),
    'https://camp.honorofkings.com/art/heino-1920x1080.jpg',
  );
});

test('official artwork parser accepts trusted relative official assets and rejects third-party images', () => {
  const html = `
    <img class="hero-cover" src="https://untrusted.example.com/heino.jpg" alt="HEINO">
    <img class="hero-cover" src="/assets/hero/heino-poster.webp" alt="HEINO">
  `;
  assert.equal(
    extractOfficialHeroArt(html, 'https://world.honorofkings.com/zlkdatasys/ip/hero/en/563.html', 'HEINO'),
    'https://world.honorofkings.com/assets/hero/heino-poster.webp',
  );
});

test('safe override merge supports artwork metadata without touching relationships', () => {
  const result = mergeOverride(undefined, {
    artLink: 'https://camp.honorofkings.com/art/hero.jpg',
    artPosition: '50% 22%',
    campId: 563,
  });
  assert.equal(result.artLink, 'https://camp.honorofkings.com/art/hero.jpg');
  assert.equal(result.artPosition, '50% 22%');
  assert.equal(result.campId, 563);
  assert.equal('combo' in result, false);
});


test('broadcast artwork uses layout-specific crop presets and per-hero overrides', () => {
  assert.deepEqual(heroArtCrop(1, 'panel'), { x: 50, y: 31, scale: 1.12 });
  assert.deepEqual(heroArtCrop(1, 'side'), { x: 50, y: 29, scale: 1.22 });
  assert.deepEqual(heroArtCrop(19, 'panel'), { x: 80, y: 34, scale: 1.16 });
  assert.deepEqual(heroArtCrop(19, 'side'), { x: 83, y: 33, scale: 1.28 });
});


test('runtime director crop overrides static and default artwork framing', () => {
  assert.deepEqual(
    heroArtCrop(19, 'side', { side: { x: 44, y: 23, scale: 1.41 } }),
    { x: 44, y: 23, scale: 1.41 },
  );
  assert.deepEqual(heroArtCrop(19, 'panel'), { x: 80, y: 34, scale: 1.16 });
  assert.deepEqual(heroArtCrop(1, 'side'), { x: 50, y: 29, scale: 1.22 });
});


test('hero art crop never shrinks an already-cover-cropped source image', () => {
  assert.deepEqual(
    heroArtCrop(1, 'panel', { panel: { x: 47, y: 0, scale: 0.6 } }),
    { x: 47, y: 0, scale: 1 },
  );
});
