/**
 * Manually curated focal points for full-width official hero art.
 *
 * Values are CSS object-position coordinates. The same focal point works across
 * portrait, square and wide cards because object-fit: cover expands the crop
 * around this anchor as the card aspect ratio changes.
 *
 * Only add overrides when the default 50% 30% misses the hero's face / upper body.
 */
const heroArtFocus: Record<number, string> = {
  // Dharma's official key art places the character far to the right.
  19: '82% 32%',
};

export default heroArtFocus;
