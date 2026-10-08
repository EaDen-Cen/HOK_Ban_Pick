import type { HeroArtCrop, HeroArtLayout, HeroArtOverride } from '../../src/shared/types.js';
import type { SharedHeroArtFocusOverrides } from '../../src/data/heroArtFocusOverrides.js';

const layouts: HeroArtLayout[] = ['panel', 'side'];

function cleanCrop(crop: HeroArtCrop | undefined): HeroArtCrop | undefined {
  if (!crop) return undefined;
  if (![crop.x, crop.y, crop.scale].every(Number.isFinite)) return undefined;
  return {
    x: Math.min(100, Math.max(0, crop.x)),
    y: Math.min(100, Math.max(0, crop.y)),
    scale: Math.min(3, Math.max(1, crop.scale)),
  };
}

export function mergeRuntimeHeroArtFocus(
  base: SharedHeroArtFocusOverrides,
  runtime: Record<string, HeroArtOverride> | undefined,
  validHeroIds: ReadonlySet<number>,
): SharedHeroArtFocusOverrides {
  const merged: SharedHeroArtFocusOverrides = structuredClone(base);
  if (!runtime) return merged;

  for (const [idText, override] of Object.entries(runtime)) {
    const heroId = Number(idText);
    if (!Number.isInteger(heroId) || !validHeroIds.has(heroId) || !override || typeof override !== 'object') continue;

    const next = { ...(merged[heroId] || {}) };
    for (const layout of layouts) {
      const crop = cleanCrop(override[layout]);
      if (crop) next[layout] = crop;
    }
    if (next.panel || next.side) merged[heroId] = next;
  }
  return merged;
}

export function renderHeroArtFocusOverrides(overrides: SharedHeroArtFocusOverrides) {
  const ordered = Object.fromEntries(
    Object.entries(overrides)
      .map(([id, value]) => [Number(id), value] as const)
      .sort((a, b) => a[0] - b[0]),
  );

  return `import type { HeroArtCrop, HeroArtLayout } from '../shared/types.js';

export type SharedHeroArtFocusOverrides = Record<number, Partial<Record<HeroArtLayout, HeroArtCrop>>>;

/**
 * Version-controlled broadcast framing defaults.
 *
 * These values are shared by every clone/release. Runtime adjustments made in
 * Control remain in data/match.json until promoted with:
 *
 *   npm run hero:crop-sync
 *
 * Keep only reusable crop metadata here. Per-match useLegacyImage choices stay
 * in runtime state and are intentionally not exported.
 */
const heroArtFocusOverrides: SharedHeroArtFocusOverrides = ${JSON.stringify(ordered, null, 2)};

export default heroArtFocusOverrides;
`;
}
