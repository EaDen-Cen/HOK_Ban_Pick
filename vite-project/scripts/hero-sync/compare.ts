import type { Hero } from '../../src/data/heroTypes.js';
import { namesForHero, normalizeName } from './normalize.js';
import type { CatalogHero, MatchResult, SourceChange, SourceSnapshot, SyncPlan } from './types.js';

function findMatch(localHeroes: Hero[], remote: CatalogHero): MatchResult | undefined {
  const byCampId = localHeroes.find(hero => hero.campId === remote.campId);
  if (byCampId) return { local: byCampId, remote, matchedBy: 'campId' };

  const remoteName = normalizeName(remote.englishName);
  for (const hero of localHeroes) {
    const names = namesForHero(hero);
    const index = names.indexOf(remoteName);
    if (index >= 0) return { local: hero, remote, matchedBy: index === 0 ? 'name' : 'alias' };
  }
  return undefined;
}

export function compareSource(previous: SourceSnapshot | undefined, remoteHeroes: CatalogHero[]) {
  const changes: SourceChange[] = [];
  if (!previous) return changes;

  const before = new Map(previous.heroes.map(hero => [hero.campId, hero]));
  const after = new Map(remoteHeroes.map(hero => [hero.campId, hero]));

  for (const hero of remoteHeroes) {
    const old = before.get(hero.campId);
    if (!old) {
      changes.push({ campId: hero.campId, field: 'added', after: hero.englishName });
      continue;
    }
    if (old.englishName !== hero.englishName) changes.push({ campId: hero.campId, field: 'englishName', before: old.englishName, after: hero.englishName });
    if (old.occupation !== hero.occupation) changes.push({ campId: hero.campId, field: 'occupation', before: old.occupation, after: hero.occupation });
    if ((old.imageUrl || '') !== (hero.imageUrl || '')) changes.push({ campId: hero.campId, field: 'imageUrl', before: old.imageUrl, after: hero.imageUrl });
  }

  for (const hero of previous.heroes) {
    if (!after.has(hero.campId)) changes.push({ campId: hero.campId, field: 'missing', before: hero.englishName });
  }
  return changes;
}

export function makePlan(localHeroes: Hero[], remoteHeroes: CatalogHero[], previous?: SourceSnapshot): SyncPlan {
  const validLocal = localHeroes.filter(hero => hero.englishName.trim());
  const matches: MatchResult[] = [];
  const additions: CatalogHero[] = [];
  const matchedIds = new Set<number>();

  for (const remote of remoteHeroes) {
    const match = findMatch(validLocal, remote);
    if (match) {
      matches.push(match);
      matchedIds.add(match.local.id);
    } else {
      additions.push(remote);
    }
  }

  const missingLocal = validLocal.filter(hero => !matchedIds.has(hero.id));
  const sourceChanges = compareSource(previous, remoteHeroes);
  const baselineMissing = !previous;
  const changed = baselineMissing || additions.length > 0 || sourceChanges.length > 0;

  return {
    checkedAt: new Date().toISOString(),
    remoteCount: remoteHeroes.length,
    matches,
    additions,
    missingLocal,
    sourceChanges,
    baselineMissing,
    changed,
  };
}

export function nextLocalIds(localHeroes: Hero[], count: number) {
  let next = Math.max(0, ...localHeroes.map(hero => hero.id)) + 1;
  return Array.from({ length: count }, () => next++);
}
