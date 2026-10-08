import { readFile, writeFile } from 'node:fs/promises';
import { resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import heroes from '../../src/components/HeroList.js';
import sharedHeroArtFocusOverrides from '../../src/data/heroArtFocusOverrides.js';
import type { HeroArtOverride } from '../../src/shared/types.js';
import { mergeRuntimeHeroArtFocus, renderHeroArtFocusOverrides } from './artFocusSync.js';

interface RuntimeData {
  state?: {
    heroArtOverrides?: Record<string, HeroArtOverride>;
  };
}

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const outputPath = resolve(projectRoot, 'src/data/heroArtFocusOverrides.ts');

function runtimeFile() {
  const configured = process.env.DATA_FILE?.trim();
  if (!configured) return resolve(projectRoot, 'data/match.json');
  return isAbsolute(configured) ? configured : resolve(projectRoot, configured);
}

async function main() {
  const inputPath = runtimeFile();
  let parsed: RuntimeData;
  try {
    parsed = JSON.parse(await readFile(inputPath, 'utf8')) as RuntimeData;
  } catch (error) {
    throw new Error(
      `Unable to read runtime match data from ${inputPath}. Start/save Broadcast first, or set DATA_FILE to the active match.json.`,
      { cause: error },
    );
  }

  const runtime = parsed.state?.heroArtOverrides;
  if (!runtime || Object.keys(runtime).length === 0) {
    console.log('No runtime hero crop overrides found; shared defaults were not changed.');
    return;
  }

  const validHeroIds = new Set(heroes.map(hero => hero.id));
  const merged = mergeRuntimeHeroArtFocus(sharedHeroArtFocusOverrides, runtime, validHeroIds);
  await writeFile(outputPath, renderHeroArtFocusOverrides(merged), 'utf8');

  const promoted = Object.entries(runtime).filter(([id, value]) => {
    const heroId = Number(id);
    return validHeroIds.has(heroId) && Boolean(value?.panel || value?.side);
  }).length;

  console.log(
    `Promoted crop metadata for ${promoted} runtime hero override(s) into src/data/heroArtFocusOverrides.ts. Review the diff, then commit/push it normally.`,
  );
}

await main();
