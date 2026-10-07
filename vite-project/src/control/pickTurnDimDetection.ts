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
 * Final-pick fallback for HOK: there is no next draft slot to probe after P5.
 * Once every current pick candidate is stable, freeze the slot brightness and
 * treat a sustained darkening of the portrait(s) as the lock transition.
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
  const dimmed=drop>=(input.dropRatio??.10);
  const dimCount=dimmed?(samePhase?previous.dimCount+1:1):0;
  return {
    state:{phaseKey:input.phaseKey,baselineLuma:baseline,dimCount},
    locked:dimCount>=(input.confirmScans??2),
    dropRatio:drop,
  };
}
