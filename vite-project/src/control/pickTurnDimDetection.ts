export interface PickTurnDimState {
  phaseKey:string;
  baselineLuma:number|null;
  dimCount:number;
}

export const freshPickTurnDimState=():PickTurnDimState=>({
  phaseKey:'',
  baselineLuma:null,
  dimCount:0,
});

export interface PickTurnDimResult {
  state:PickTurnDimState;
  locked:boolean;
  dropRatio:number;
}

/**
 * Highlight-release fallback for HOK Pick turns that cannot be confirmed by an
 * immediately-following opponent Pick (round boundary / final pick).
 *
 * The live client brightens the active player row while selecting. Locking does
 * NOT add a dark overlay; it removes that active highlight and returns the row
 * to its normal brightness. We freeze the highlighted luma once the hero is
 * stable, then require a sustained decrease back toward normal.
 */
export function updatePickTurnDimState(
  previous:PickTurnDimState,
  input:{
    phaseKey:string;
    meanLumas:number[];
    candidatesStable:boolean;
    dropRatio?:number;
    confirmScans?:number;
  },
):PickTurnDimResult {
  const values=input.meanLumas.filter(value=>Number.isFinite(value)&&value>0);
  const current=values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
  const samePhase=previous.phaseKey===input.phaseKey;

  if(!current) {
    return {
      state:{phaseKey:input.phaseKey,baselineLuma:null,dimCount:0},
      locked:false,
      dropRatio:0,
    };
  }

  if(!input.candidatesStable) {
    return {
      state:{phaseKey:input.phaseKey,baselineLuma:current,dimCount:0},
      locked:false,
      dropRatio:0,
    };
  }

  const baseline=samePhase&&previous.baselineLuma ? previous.baselineLuma : current;
  const drop=Math.max(0,(baseline-current)/Math.max(baseline,1));
  const highlightReleased=drop>=(input.dropRatio??.08);
  const dimCount=highlightReleased?(samePhase?previous.dimCount+1:1):0;
  return {
    state:{phaseKey:input.phaseKey,baselineLuma:baseline,dimCount},
    locked:dimCount>=(input.confirmScans??2),
    dropRatio:drop,
  };
}
