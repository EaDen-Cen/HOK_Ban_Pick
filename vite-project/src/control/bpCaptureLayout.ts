import { phases, type MatchState, type Side } from '../shared/types.js';
import { normalizeCaptureRegion, type NormalizedCaptureRegion } from './windowCaptureGeometry.js';

export type CaptureZoneKey = 'bluePick' | 'redPick' | 'blueBan' | 'redBan';

export type CaptureZones = Record<CaptureZoneKey, NormalizedCaptureRegion>;

export interface CaptureTarget {
  key: CaptureZoneKey;
  side: Side;
  action: 'ban' | 'pick';
  slotIndex: number;
  slotCount: number;
  zone: NormalizedCaptureRegion;
  slot: NormalizedCaptureRegion;
}

export const defaultCaptureZones: CaptureZones = {
  bluePick: { x:.035, y:.18, width:.105, height:.68 },
  redPick: { x:.86, y:.18, width:.105, height:.68 },
  blueBan: { x:.035, y:.035, width:.28, height:.11 },
  redBan: { x:.685, y:.035, width:.28, height:.11 },
};

export const captureZoneKeys: CaptureZoneKey[] = ['bluePick','redPick','blueBan','redBan'];

export function normalizeCaptureZones(value: Partial<CaptureZones> | undefined): CaptureZones {
  return Object.fromEntries(captureZoneKeys.map(key => [
    key,
    normalizeCaptureRegion(value?.[key] ?? defaultCaptureZones[key]),
  ])) as CaptureZones;
}

export function zoneLabelKey(key: CaptureZoneKey) {
  return ({
    bluePick:'captureZoneBluePick',
    redPick:'captureZoneRedPick',
    blueBan:'captureZoneBlueBan',
    redBan:'captureZoneRedBan',
  } as const)[key];
}

function countPreviousSlots(state: Pick<MatchState,'draftMode'|'firstPickSide'|'currentPhase'>, side:Side, action:'ban'|'pick') {
  return phases(state.draftMode,state.firstPickSide)
    .slice(0,state.currentPhase)
    .filter(phase=>phase.team===side&&phase.action===action)
    .length;
}

export function slotCountFor(state: Pick<MatchState,'draftMode'>, action:'ban'|'pick') {
  if(action==='pick') return 5;
  return state.draftMode==='match' ? 4 : 2;
}

function inset(region:NormalizedCaptureRegion, ratio=.06):NormalizedCaptureRegion {
  const xPad=region.width*ratio;
  const yPad=region.height*ratio;
  return normalizeCaptureRegion({
    x:region.x+xPad,
    y:region.y+yPad,
    width:Math.max(.02,region.width-xPad*2),
    height:Math.max(.02,region.height-yPad*2),
  });
}

export function slotInsideZone(
  zone:NormalizedCaptureRegion,
  action:'ban'|'pick',
  slotIndex:number,
  slotCount:number,
):NormalizedCaptureRegion {
  const safeIndex=Math.max(0,Math.min(slotCount-1,slotIndex));
  if(action==='pick') {
    return inset({
      x:zone.x,
      y:zone.y+zone.height*(safeIndex/slotCount),
      width:zone.width,
      height:zone.height/slotCount,
    },.08);
  }
  return inset({
    x:zone.x+zone.width*(safeIndex/slotCount),
    y:zone.y,
    width:zone.width/slotCount,
    height:zone.height,
  },.08);
}

export function captureTargetForState(
  state:Pick<MatchState,'draftMode'|'firstPickSide'|'currentPhase'>,
  zones:CaptureZones,
):CaptureTarget | undefined {
  const phase=phases(state.draftMode,state.firstPickSide)[state.currentPhase];
  if(!phase) return undefined;
  const slotIndex=countPreviousSlots(state,phase.team,phase.action);
  const slotCount=slotCountFor(state,phase.action);
  const key=`${phase.team}${phase.action==='pick'?'Pick':'Ban'}` as CaptureZoneKey;
  const zone=zones[key];
  return {
    key,
    side:phase.team,
    action:phase.action,
    slotIndex,
    slotCount,
    zone,
    slot:slotInsideZone(zone,phase.action,slotIndex,slotCount),
  };
}
