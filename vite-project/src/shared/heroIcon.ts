import type { CSSProperties } from 'react';
import type { Hero } from '../data/heroTypes.js';

export function heroIconStyle(hero: Hero | undefined): CSSProperties | undefined {
  const crop = hero?.iconCrop;
  if (!crop) return undefined;
  // A runtime or later sync may replace the temporary portrait with a proper
  // square icon while leaving recognitionImageLink intact. Never carry the
  // temporary portrait crop onto that replacement image.
  if (hero.recognitionImageLink && hero.imageLink !== hero.recognitionImageLink) return undefined;
  const x = Math.min(100, Math.max(0, crop.x));
  const y = Math.min(100, Math.max(0, crop.y));
  const scale = Math.min(3, Math.max(1, crop.scale));
  const origin = `${x}% ${y}%`;
  return {
    objectFit: 'cover',
    objectPosition: origin,
    transform: `scale(${scale})`,
    transformOrigin: origin,
  };
}
