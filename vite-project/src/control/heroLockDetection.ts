import { fingerprintDistance } from './emptyBanDetection.js';

export interface HeroLockStability {
  phaseKey:string;
  heroId:number|null;
  baseline:string;
  count:number;
}

export interface HeroLockResult {
  stability:HeroLockStability;
  locked:boolean;
  distance:number;
  baselineReady:boolean;
}

export const HERO_LOCK_DISTANCE=10;
export const HERO_LOCK_CONFIRM_SCANS=2;

export const freshHeroLockStability=():HeroLockStability=>({
  phaseKey:'',
  heroId:null,
  baseline:'',
  count:0,
});

/**
 * Hero portraits appear as soon as a player preselects a hero, before the pick
 * is committed. The lock cue must therefore be treated as a second signal.
 *
 * While the hero candidate is still stabilizing we continuously learn the
 * lower-right cue baseline for that exact hero. Once the hero itself is stable,
 * the baseline freezes. A later visual change in the cue area must persist for
 * multiple scans before the hero is considered locked.
 *
 * This avoids treating "empty slot -> preselected hero portrait" as a lock.
 */
export function updateHeroLockStability(
  previous:HeroLockStability,
  input:{
    phaseKey:string;
    heroId?:number;
    lockFingerprint?:string;
    stabilityCount:number;
    requiredScans:number;
    threshold?:number;
    confirmScans?:number;
  },
):HeroLockResult {
  const heroId=input.heroId??null;
  const fingerprint=input.lockFingerprint??'';
  const candidateReady=heroId!==null
    && input.requiredScans>0
    && input.stabilityCount>=input.requiredScans;
  const sameCandidate=previous.phaseKey===input.phaseKey&&previous.heroId===heroId;

  if(!fingerprint||!candidateReady) {
    return {
      stability:{
        phaseKey:input.phaseKey,
        heroId,
        baseline:fingerprint,
        count:0,
      },
      locked:false,
      distance:0,
      baselineReady:!!fingerprint,
    };
  }

  if(!sameCandidate||!previous.baseline) {
    return {
      stability:{
        phaseKey:input.phaseKey,
        heroId,
        baseline:fingerprint,
        count:0,
      },
      locked:false,
      distance:0,
      baselineReady:true,
    };
  }

  const distance=fingerprintDistance(previous.baseline,fingerprint);
  const changed=distance>=(input.threshold??HERO_LOCK_DISTANCE);
  const count=changed?previous.count+1:0;
  const stability={
    phaseKey:input.phaseKey,
    heroId,
    baseline:previous.baseline,
    count,
  };
  return {
    stability,
    locked:count>=(input.confirmScans??HERO_LOCK_CONFIRM_SCANS),
    distance,
    baselineReady:true,
  };
}
