import { fingerprintDistance } from './emptyBanDetection.js';

export interface PickSlotActivationState {
  phaseKey:string;
  slotKey:string;
  baselineFingerprint:string;
  heroId:number|null;
  count:number;
}

export const freshPickSlotActivationState=():PickSlotActivationState=>({
  phaseKey:'',
  slotKey:'',
  baselineFingerprint:'',
  heroId:null,
  count:0,
});

export interface PickSlotActivationResult {
  state:PickSlotActivationState;
  active:boolean;
  distance:number;
}

/**
 * Detect that the next opponent Pick slot actually started preselecting.
 * A hero-like false match on the empty player row is not enough: the slot must
 * also change visually away from the empty baseline and the same strong hero
 * candidate must persist for consecutive scans.
 */
export function updatePickSlotActivation(
  previous:PickSlotActivationState,
  input:{
    phaseKey:string;
    slotKey:string;
    fingerprint?:string;
    heroId?:number;
    confidence?:number;
    minConfidence?:number;
    minDistance?:number;
    confirmScans?:number;
  },
):PickSlotActivationResult {
  const fingerprint=input.fingerprint??'';
  const sameContext=previous.phaseKey===input.phaseKey&&previous.slotKey===input.slotKey;
  if(!sameContext||!previous.baselineFingerprint){
    return {
      state:{
        phaseKey:input.phaseKey,
        slotKey:input.slotKey,
        baselineFingerprint:fingerprint,
        heroId:null,
        count:0,
      },
      active:false,
      distance:0,
    };
  }

  const distance=fingerprintDistance(previous.baselineFingerprint,fingerprint);
  const strong=Number.isInteger(input.heroId)
    && (input.confidence??0)>=(input.minConfidence??.72)
    && distance>=(input.minDistance??10);
  const sameHero=strong&&previous.heroId===input.heroId;
  const count=strong?(sameHero?previous.count+1:1):0;

  return {
    state:{
      phaseKey:input.phaseKey,
      slotKey:input.slotKey,
      baselineFingerprint:previous.baselineFingerprint,
      heroId:strong?(input.heroId??null):null,
      count,
    },
    active:count>=(input.confirmScans??2),
    distance:Number.isFinite(distance)?distance:0,
  };
}
