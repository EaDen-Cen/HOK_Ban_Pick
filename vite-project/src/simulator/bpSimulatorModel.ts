import { phases, type MatchState, type Side } from '../shared/types.js';

export interface SimulatorPhaseSlot {
  side: Side;
  action: 'ban' | 'pick';
  slotIndex: number;
  phaseIndex: number;
}

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

export function simulatorSlotKey(slot:SimulatorPhaseSlot) {
  return `${slot.side}${slot.action==='ban'?'Ban':'Pick'}${slot.slotIndex+1}`;
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
