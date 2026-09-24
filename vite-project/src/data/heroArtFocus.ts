export type HeroArtLayout = 'panel' | 'side';

export interface HeroArtCrop {
  /** Horizontal focal point in percent. */
  x: number;
  /** Vertical focal point in percent. */
  y: number;
  /** Additional zoom applied after object-fit: cover. */
  scale: number;
}

const defaults: Record<HeroArtLayout, HeroArtCrop> = {
  // Bottom / panel cards should show head + upper body + some surrounding action.
  panel: { x: 50, y: 31, scale: 1.12 },
  // Side rails are shorter/wider, so push in slightly more toward face + torso.
  side: { x: 50, y: 29, scale: 1.22 },
};

/**
 * Per-hero broadcast framing overrides.
 *
 * Full character art is intentionally kept as a flexible source image. These
 * focal points tell the overlay where the subject is, while the card aspect
 * ratio decides how much surrounding artwork is visible.
 */
const overrides: Record<number, Partial<Record<HeroArtLayout, HeroArtCrop>>> = {
  // Dharma / 达摩: subject sits far on the right side of the official key art.
  19: {
    panel: { x: 80, y: 34, scale: 1.16 },
    side: { x: 83, y: 33, scale: 1.28 },
  },
};

export function heroArtCrop(heroId: number, layout: HeroArtLayout): HeroArtCrop {
  return overrides[heroId]?.[layout] || defaults[layout];
}

export default overrides;
