import { useCallback, useEffect, useState } from 'react';
import heroes from '../components/HeroList';
import type { MatchState, Side } from '../shared/types';
import { simulatorAllSlotKeys } from './bpSimulatorModel';

export type SimulatorSlotMap = Record<string,number>;

export interface BpSimulatorState {
  mode: MatchState['draftMode'];
  firstPickSide: Side;
  phaseIndex: number;
  slotHeroes: SimulatorSlotMap;
  emptyBans: string[];
  locked: string[];
  autoPlay: boolean;
  intervalMs: number;
  banSize: number;
  pickSize: number;
}

const STORAGE_KEY='hok-bp-simulator-state-v2';

function defaultAssignments():SimulatorSlotMap {
  const ids=heroes.slice(0,simulatorAllSlotKeys.length).map(hero=>hero.id);
  return Object.fromEntries(simulatorAllSlotKeys.map((key,index)=>[
    key,
    ids[index%Math.max(ids.length,1)] ?? heroes[0]?.id ?? 0,
  ]));
}

export function createDefaultBpSimulatorState():BpSimulatorState {
  return {
    mode:'match',
    firstPickSide:'blue',
    phaseIndex:0,
    slotHeroes:defaultAssignments(),
    emptyBans:[],
    locked:[],
    autoPlay:false,
    intervalMs:1500,
    banSize:38,
    pickSize:72,
  };
}

function clamp(value:number,min:number,max:number) {
  return Math.max(min,Math.min(max,value));
}

function normalizeState(value:Partial<BpSimulatorState>|undefined):BpSimulatorState {
  const defaults=createDefaultBpSimulatorState();
  const source=value??{};
  const slotHeroes={...defaults.slotHeroes,...(source.slotHeroes??{})};
  return {
    mode:source.mode==='normal'?'normal':'match',
    firstPickSide:source.firstPickSide==='red'?'red':'blue',
    phaseIndex:Number.isFinite(source.phaseIndex)?Math.max(0,Math.floor(source.phaseIndex!)):0,
    slotHeroes,
    emptyBans:Array.isArray(source.emptyBans)?source.emptyBans.filter(key=>typeof key==='string'):[],
    locked:Array.isArray(source.locked)?source.locked.filter(key=>typeof key==='string'):[],
    autoPlay:source.autoPlay===true,
    intervalMs:clamp(Number(source.intervalMs)||defaults.intervalMs,400,10000),
    banSize:clamp(Number(source.banSize)||defaults.banSize,24,64),
    pickSize:clamp(Number(source.pickSize)||defaults.pickSize,48,104),
  };
}

function readState() {
  if(typeof window==='undefined') return createDefaultBpSimulatorState();
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')??undefined);
  } catch {
    return createDefaultBpSimulatorState();
  }
}

export function useBpSimulatorState() {
  const [state,setState]=useState<BpSimulatorState>(readState);

  const update=useCallback((updater:BpSimulatorState|((current:BpSimulatorState)=>BpSimulatorState))=>{
    setState(current=>{
      const next=normalizeState(typeof updater==='function'?updater(current):updater);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
      return next;
    });
  },[]);

  useEffect(()=>{
    const listener=(event:StorageEvent)=>{
      if(event.key!==STORAGE_KEY||!event.newValue) return;
      try { setState(normalizeState(JSON.parse(event.newValue))); } catch { /* ignore malformed external state */ }
    };
    window.addEventListener('storage',listener);
    return()=>window.removeEventListener('storage',listener);
  },[]);

  return [state,update] as const;
}
