import { LANES, type CatalogHero, type Lane } from './types.js';

export const CATALOG_URL = 'https://wiki.bittopup.com/hok';

const headers = {
  'user-agent': 'HOK-Broadcast-Hero-Sync/1.0 (+https://github.com/EaDen-Cen/HOK_Ban_Pick)',
  accept: 'text/html,application/xhtml+xml',
};

function decodeHtml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  ).trim();
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? decodeHtml(match[1]) : undefined;
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function heroIds(indexHtml: string) {
  const ids = new Set<number>();
  const expression = /href\s*=\s*["'](?:https:\/\/wiki\.bittopup\.com)?\/hok\/(\d+)(?:[/?#][^"']*)?["']/gi;
  for (const match of indexHtml.matchAll(expression)) ids.add(Number(match[1]));
  return [...ids].filter(Number.isInteger).sort((a, b) => a - b);
}

export function parseCatalogHero(html: string, campId: number): CatalogHero {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1) throw new Error(`Catalog hero ${campId} has no H1 title`);
  const englishName = stripTags(h1[1]);
  if (!englishName) throw new Error(`Catalog hero ${campId} has an empty name`);

  const h1Index = h1.index || 0;
  const nearby = stripTags(html.slice(h1Index, h1Index + 6000));
  const occupation = LANES.find(lane => nearby.includes(lane)) as Lane | undefined;
  if (!occupation) throw new Error(`Catalog hero ${englishName} (${campId}) has no recognized lane`);

  let imageUrl: string | undefined;
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  const targetName = englishName.toLowerCase();
  for (const tag of tags) {
    const src = attr(tag, 'src') || attr(tag, 'data-src');
    if (!src || !/^https:\/\/camp\.honorofkings\.com\//i.test(src)) continue;
    const alt = (attr(tag, 'alt') || '').toLowerCase();
    if (alt.includes(targetName)) {
      imageUrl = src;
      break;
    }
    if (!imageUrl) imageUrl = src;
  }

  return {
    campId,
    englishName,
    occupation,
    imageUrl,
    detailUrl: `${CATALOG_URL}/${campId}`,
    source: 'bittopup',
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export async function fetchCatalogHeroDetail(campId: number) {
  const html = await fetchText(`${CATALOG_URL}/${campId}`);
  return parseCatalogHero(html, campId);
}

export async function fetchCatalog(): Promise<CatalogHero[]> {
  const index = await fetchText(CATALOG_URL);
  let heroes = parseIndexCards(index);

  // Prefer the index page to keep the scheduled check polite and lightweight.
  // If the site changes its card markup, fall back to detail pages instead of
  // silently treating a partial extraction as a complete roster.
  if (heroes.length < 80) {
    const ids = heroIds(index);
    if (ids.length < 80) {
      throw new Error(`Catalog extraction returned only ${ids.length} hero links; refusing a likely partial page`);
    }
    heroes = await mapLimit(ids, 4, fetchCatalogHeroDetail);
  }

  const names = new Set<string>();
  for (const hero of heroes) {
    const key = hero.englishName.toLowerCase();
    if (names.has(key)) throw new Error(`Catalog contains duplicate hero name: ${hero.englishName}`);
    names.add(key);
  }
  return heroes;
}
