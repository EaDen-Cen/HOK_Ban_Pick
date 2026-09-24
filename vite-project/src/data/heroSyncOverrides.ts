import type { Hero } from './heroTypes.js';

/**
 * Safe metadata overrides produced by the automated hero-data synchronizer.
 *
 * Relationship fields (combo/counter/beCountered) are never generated here.
 */
const heroSyncOverrides: Record<number, Partial<Hero>> = {};

export default heroSyncOverrides;
