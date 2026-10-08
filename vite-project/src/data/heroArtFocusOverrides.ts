import type { HeroArtCrop, HeroArtLayout } from '../shared/types.js';

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
const heroArtFocusOverrides: SharedHeroArtFocusOverrides = {
  19: {
    panel: { x: 80, y: 34, scale: 1.16 },
    side: { x: 83, y: 33, scale: 1.28 },
  },
};

export default heroArtFocusOverrides;
