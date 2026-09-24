import type { Hero } from './heroTypes.js';

/**
 * Manually reviewed hero display-source overrides.
 *
 * Keep this file separate from heroSyncOverrides.ts: the sync file is generated
 * automatically and may refresh from a source that is technically valid but
 * visually unsuitable for broadcast. These overrides always win last.
 */
const heroArtSourceOverrides: Record<number, Partial<Hero>> = {
  // Ao'yin / Loong / 敖隐
  // The auto-synced full-art source for camp 519 is not suitable in the broadcast
  // crop editor. Use Tencent's official Ao'yin reveal artwork instead.
  54: {
    artLink: '/heroesArt/ao\'yin.jpg',
  },
};

export default heroArtSourceOverrides;
