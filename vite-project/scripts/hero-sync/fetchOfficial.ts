import type { OfficialHeroEvidence } from './types.js';
import { normalizeName } from './normalize.js';

const BASE = 'https://world.honorofkings.com/zlkdatasys/ip/hero';
const headers = {
  'user-agent': 'HOK-Broadcast-Hero-Sync/1.0 (+https://github.com/EaDen-Cen/HOK_Ban_Pick)',
  accept: 'text/html,application/xhtml+xml',
};

function stripTags(value: string) {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleFromHtml(html: string) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) {
    const value = stripTags(h1[1]).replace(/^Champion\s+Deatails\s+/i, '').trim();
    if (value) return value;
  }
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title ? stripTags(title[1]).replace(/^Champion\s+Deatails\s+/i, '').trim() : undefined;
}

async function optionalPage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
    if (!response.ok) return undefined;
    return await response.text();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchOfficialHeroEvidence(campId: number, expectedEnglishName: string): Promise<OfficialHeroEvidence> {
  const englishUrl = `${BASE}/en/${campId}.html`;
  const chineseUrl = `${BASE}/zh-Hant/${campId}.html`;
  const [englishHtml, chineseHtml] = await Promise.all([optionalPage(englishUrl), optionalPage(chineseUrl)]);
  const englishName = englishHtml ? titleFromHtml(englishHtml) : undefined;
  const chineseName = chineseHtml ? titleFromHtml(chineseHtml) : undefined;
  const confirmed = Boolean(englishName && normalizeName(englishName) === normalizeName(expectedEnglishName));
  return { campId, englishName, chineseName, englishUrl, chineseUrl, confirmed };
}
