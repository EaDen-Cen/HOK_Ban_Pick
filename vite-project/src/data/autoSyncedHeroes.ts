import type { Hero } from './heroTypes.js';

/**
 * Heroes discovered by the automated hero-data synchronizer.
 *
 * This file is intentionally kept separate from the historical/manual roster so
 * the synchronizer never has to rewrite legacy relationship data.
 */
const autoSyncedHeroes: Hero[] = [];

export default autoSyncedHeroes;
