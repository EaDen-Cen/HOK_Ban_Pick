import type { HeroArtCrop, HeroArtLayout, HeroArtOverride } from '../shared/types';

const defaults: Record<HeroArtLayout, HeroArtCrop> = {
  panel: { x: 50, y: 31, scale: 1.12 },
  side: { x: 50, y: 29, scale: 1.22 },
};

const overrides: Record<number, Partial<Record<HeroArtLayout, HeroArtCrop>>> = {
  19: {
    panel: { x: 80, y: 34, scale: 1.16 },
    side: { x: 83, y: 33, scale: 1.28 },
  },
};

export function heroArtCrop(heroId: number, layout: HeroArtLayout, runtime?: HeroArtOverride): HeroArtCrop {
  return runtime?.[layout] || overrides[heroId]?.[layout] || defaults[layout];
}

export function defaultHeroArtCrop(layout: HeroArtLayout): HeroArtCrop {
  return { ...defaults[layout] };
}

export default overrides;
