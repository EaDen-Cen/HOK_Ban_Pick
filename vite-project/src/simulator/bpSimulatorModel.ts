import { phases, type MatchState, type Side } from '../shared/types.js';
import { draftTurnAtPhase, previousDraftTurnStart } from '../shared/draftTurns.js';

export interface SimulatorPhaseSlot {
  side: Side;
  action: 'ban' | 'pick';
  slotIndex: number;
  phaseIndex: number;
}

export const simulatorAllSlotKeys = [
  'blueBan1','blueBan2','blueBan3','blueBan4',
  'redBan1','redBan2','redBan3','redBan4',
  'bluePick1','bluePick2','bluePick3','bluePick4','bluePick5',
  'redPick1','redPick2','redPick3','redPick4','redPick5',
] as const;

export function simulatorSlotForPhase(
  mode: MatchState['draftMode'],
  firstPickSide: Side,
  phaseIndex: number,
): SimulatorPhaseSlot | undefined {
  const sequence=phases(mode,firstPickSide);
  const phase=sequence[phaseIndex];
  if(!phase) return undefined;
  const slotIndex=sequence
    .slice(0,phaseIndex)
    .filter(item=>item.team===phase.team&&item.action===phase.action)
    .length;
  return {side:phase.team,action:phase.action,slotIndex,phaseIndex};
}


export function simulatorSlotsForTurn(
  mode:MatchState['draftMode'],
  firstPickSide:Side,
  phaseIndex:number,
) {
  const turn=draftTurnAtPhase(mode,firstPickSide,phaseIndex);
  if(!turn) return [];
  return turn.phaseIndexes
    .map(index=>simulatorSlotForPhase(mode,firstPickSide,index))
    .filter((slot):slot is SimulatorPhaseSlot=>!!slot);
}

export function simulatorNextTurnPhase(
  mode:MatchState['draftMode'],
  firstPickSide:Side,
  phaseIndex:number,
) {
  return draftTurnAtPhase(mode,firstPickSide,phaseIndex)?.endPhaseExclusive ?? phases(mode,firstPickSide).length;
}

export function simulatorPreviousTurnPhase(
  mode:MatchState['draftMode'],
  firstPickSide:Side,
  phaseIndex:number,
) {
  return previousDraftTurnStart(mode,firstPickSide,phaseIndex);
}

export function simulatorSlotKey(slot:SimulatorPhaseSlot) {
  return `${slot.side}${slot.action==='ban'?'Ban':'Pick'}${slot.slotIndex+1}`;
}

/**
 * Physical left-to-right order on the screen.
 * Blue fills B1 -> B4 from left to right. Red is axis-mirrored, so B1 is
 * physically the right-most circle and the visible order is B4 -> B1.
 */
export function simulatorBanVisualKeys(side:Side) {
  const keys=Array.from({length:4},(_,index)=>`${side}Ban${index+1}`);
  return side==='blue'?keys:keys.reverse();
}

export function swapSimulatorPickHeroes(
  assignments:Record<string,number>,
  side:Side,
  firstIndex:number,
  secondIndex:number,
) {
  if(firstIndex===secondIndex) return {...assignments};
  const firstKey=`${side}Pick${firstIndex+1}`;
  const secondKey=`${side}Pick${secondIndex+1}`;
  return {
    ...assignments,
    [firstKey]:assignments[secondKey],
    [secondKey]:assignments[firstKey],
  };
}

export function completedSimulatorSlots(
  mode:MatchState['draftMode'],
  firstPickSide:Side,
  phaseIndex:number,
) {
  return phases(mode,firstPickSide)
    .slice(0,Math.max(0,phaseIndex))
    .map((_,index)=>simulatorSlotForPhase(mode,firstPickSide,index)!)
    .filter(Boolean);
}
