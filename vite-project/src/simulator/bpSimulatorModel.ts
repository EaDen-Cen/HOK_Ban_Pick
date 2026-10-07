import heroes from '../components/HeroList.js';
import { initialState, phases, type MatchState, type Side } from '../shared/types.js';
import { draftHeroUsed, draftRestriction, normalizeState } from '../shared/draftRules.js';
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

export interface SimulatorRuleSnapshot {
  mode: MatchState['draftMode'];
  firstPickSide: Side;
  phaseIndex: number;
  slotHeroes: Record<string,number>;
  emptyBans: string[];
}

export function simulatorRuleState(
  simulator: SimulatorRuleSnapshot,
  baseState?: MatchState,
  throughPhase = simulator.phaseIndex,
) {
  const state=normalizeState(baseState ? structuredClone(baseState) : initialState());
  state.draftMode=simulator.mode;
  state.firstPickSide=simulator.firstPickSide;
  state.currentPhase=0;
  state.draftComplete=false;
  state.committedGameId=null;
  state.draftGameNumber=state.gameNumber;
  state.blueBans=[];
  state.redBans=[];
  state.bluePicks=[];
  state.redPicks=[];
  state.blueAssignments=[null,null,null,null,null];
  state.redAssignments=[null,null,null,null,null];

  const sequence=phases(simulator.mode,simulator.firstPickSide);
  for(let index=0;index<Math.min(throughPhase,sequence.length);index++){
    const slot=simulatorSlotForPhase(simulator.mode,simulator.firstPickSide,index);
    if(!slot) continue;
    const key=simulatorSlotKey(slot);
    if(slot.action==='ban'){
      state[`${slot.side}Bans`].push(simulator.emptyBans.includes(key)?null:simulator.slotHeroes[key]);
    }else{
      const heroId=simulator.slotHeroes[key];
      state[`${slot.side}Picks`].push(heroId);
      state[`${slot.side}Assignments`][state[`${slot.side}Picks`].length-1]=heroId;
    }
    state.currentPhase=index+1;
  }
  return state;
}

function shuffledHeroIds(random:()=>number) {
  return heroes.map(hero=>hero.id)
    .map(id=>({id,key:random()}))
    .sort((a,b)=>a.key-b.key)
    .map(item=>item.id);
}

export function randomLegalHeroesForSimulatorTurn(
  simulator: SimulatorRuleSnapshot,
  baseState?: MatchState,
  random:()=>number=Math.random,
) {
  const slots=simulatorSlotsForTurn(simulator.mode,simulator.firstPickSide,simulator.phaseIndex);
  const state=simulatorRuleState(simulator,baseState);
  const result:Record<string,number>={};
  for(const slot of slots){
    const key=simulatorSlotKey(slot);
    const heroId=shuffledHeroIds(random).find(id=>
      !draftHeroUsed(state,id)
      && !draftRestriction(state,slot.side,slot.action,id));
    if(heroId===undefined) continue;
    result[key]=heroId;
    if(slot.action==='ban') state[`${slot.side}Bans`].push(heroId);
    else {
      state[`${slot.side}Picks`].push(heroId);
      state[`${slot.side}Assignments`][state[`${slot.side}Picks`].length-1]=heroId;
    }
    state.currentPhase++;
  }
  return result;
}

export function randomLegalSimulatorDraft(
  simulator: SimulatorRuleSnapshot,
  baseState?: MatchState,
  random:()=>number=Math.random,
) {
  const working:SimulatorRuleSnapshot={
    ...simulator,
    phaseIndex:0,
    slotHeroes:{...simulator.slotHeroes},
    emptyBans:[],
  };
  const sequence=phases(simulator.mode,simulator.firstPickSide);
  while(working.phaseIndex<sequence.length){
    const turn=randomLegalHeroesForSimulatorTurn(working,baseState,random);
    Object.assign(working.slotHeroes,turn);
    const next=simulatorNextTurnPhase(working.mode,working.firstPickSide,working.phaseIndex);
    if(next<=working.phaseIndex) break;
    working.phaseIndex=next;
  }
  return working.slotHeroes;
}

export function simulatorRandomDelayMs(
  minMs:number,
  maxMs:number,
  random:()=>number=Math.random,
) {
  const min=Math.max(0,Math.min(minMs,maxMs));
  const max=Math.max(min,Math.max(minMs,maxMs));
  if(max===min) return Math.round(min);
  return Math.round(min+(max-min)*Math.min(1,Math.max(0,random())));
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
