export interface HeroRecognitionStability {
  phaseKey:string;
  heroId:number | null;
  count:number;
}

export interface HeroCandidate {
  heroId:number;
  confidence:number;
}

export interface StableHeroResult {
  stability:HeroRecognitionStability;
  accepted:boolean;
  top?:HeroCandidate;
  margin:number;
}

export const HERO_MIN_CONFIDENCE=.55;
export const HERO_MIN_MARGIN=.035;
export const HERO_STABLE_SCANS=2;

export function updateHeroRecognitionStability(
  previous:HeroRecognitionStability,
  phaseKey:string,
  candidates:HeroCandidate[],
):StableHeroResult {
  const top=candidates[0];
  const second=candidates[1];
  const margin=top ? top.confidence-(second?.confidence ?? 0) : 0;
  const strong=!!top&&top.confidence>=HERO_MIN_CONFIDENCE&&margin>=HERO_MIN_MARGIN;
  if(!strong) {
    return {
      stability:{phaseKey,heroId:null,count:0},
      accepted:false,
      top,
      margin,
    };
  }
  const same=previous.phaseKey===phaseKey&&previous.heroId===top.heroId;
  const stability={
    phaseKey,
    heroId:top.heroId,
    count:same?previous.count+1:1,
  };
  return {
    stability,
    accepted:stability.count>=HERO_STABLE_SCANS,
    top,
    margin,
  };
}
