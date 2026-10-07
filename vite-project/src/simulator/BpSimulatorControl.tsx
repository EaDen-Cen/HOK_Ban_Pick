import { useEffect, useMemo, useState } from 'react';
import heroes from '../components/HeroList';
import { phases, type Side } from '../shared/types';
import {
  simulatorAllSlotKeys,
  simulatorNextTurnPhase,
  simulatorPreviousTurnPhase,
  simulatorRandomDelayMs,
  simulatorSlotForPhase,
  simulatorSlotKey,
  simulatorSlotsForTurn,
  swapSimulatorPickHeroes,
} from './bpSimulatorModel';
import { useBpSimulatorState } from './bpSimulatorState';
import './bpSimulator.css';

function heroName(id:number|undefined) {
  const hero=heroes.find(item=>item.id===id);
  return hero?.chineseName||hero?.englishName||'—';
}

function unique<T>(values:T[]) {
  return [...new Set(values)];
}

export function BpSimulatorControl() {
  const [state,update]=useBpSimulatorState();
  const [swapSide,setSwapSide]=useState<Side>('blue');
  const [swapA,setSwapA]=useState(0);
  const [swapB,setSwapB]=useState(1);

  const sequence=useMemo(()=>phases(state.mode,state.firstPickSide),[state.mode,state.firstPickSide]);
  const activeSlots=simulatorSlotsForTurn(state.mode,state.firstPickSide,state.phaseIndex);
  const active=activeSlots[0];
  const activeKeys=activeSlots.map(simulatorSlotKey);
  const activeKey=activeKeys[0]??'';
  const activeLocked=activeKeys.length>0&&activeKeys.every(key=>state.locked.includes(key));

  const patch=(partial:Partial<typeof state>)=>update(current=>({...current,...partial}));

  const resetProgress=()=>update(current=>({
    ...current,
    phaseIndex:0,
    emptyBans:[],
    locked:[],
    autoPlay:false,
  }));

  const setDraftMode=(mode:typeof state.mode)=>update(current=>({
    ...current,
    mode,
    phaseIndex:0,
    emptyBans:[],
    locked:[],
    autoPlay:false,
  }));

  const setFirstPickSide=(firstPickSide:Side)=>update(current=>({
    ...current,
    firstPickSide,
    phaseIndex:0,
    emptyBans:[],
    locked:[],
    autoPlay:false,
  }));

  const toggleCurrentLock=()=> {
    if(!activeKeys.length) return;
    update(current=>{
      const currentKeys=simulatorSlotsForTurn(current.mode,current.firstPickSide,current.phaseIndex).map(simulatorSlotKey);
      const allLocked=currentKeys.length>0&&currentKeys.every(key=>current.locked.includes(key));
      return {
        ...current,
        locked:allLocked
          ? current.locked.filter(key=>!currentKeys.includes(key))
          : unique([...current.locked,...currentKeys]),
      };
    });
  };

  const nextPhase=()=> {
    if(!activeKeys.length||!activeLocked) return;
    update(current=>({
      ...current,
      phaseIndex:Math.min(
        phases(current.mode,current.firstPickSide).length,
        simulatorNextTurnPhase(current.mode,current.firstPickSide,current.phaseIndex),
      ),
    }));
  };

  const previousPhase=()=>update(current=>{
    const next=simulatorPreviousTurnPhase(current.mode,current.firstPickSide,current.phaseIndex);
    const previousKeys=simulatorSlotsForTurn(current.mode,current.firstPickSide,next).map(simulatorSlotKey);
    return {
      ...current,
      phaseIndex:next,
      locked:current.locked.filter(item=>!previousKeys.includes(item)),
      autoPlay:false,
    };
  });

  const toggleEmptyBan=()=> {
    if(!activeKey||active?.action!=='ban') return;
    update(current=>({
      ...current,
      emptyBans:current.emptyBans.includes(activeKey)
        ? current.emptyBans.filter(key=>key!==activeKey)
        : unique([...current.emptyBans,activeKey]),
    }));
  };

  const randomizeCurrent=()=> {
    if(!activeKeys.length||activeLocked) return;
    update(current=>{
      const currentKeys=simulatorSlotsForTurn(current.mode,current.firstPickSide,current.phaseIndex).map(simulatorSlotKey);
      const used=new Set(Object.entries(current.slotHeroes)
        .filter(([key])=>!currentKeys.includes(key))
        .map(([,heroId])=>heroId));
      const pool=[...heroes].filter(hero=>!used.has(hero.id)).sort(()=>Math.random()-.5);
      const slotHeroes={...current.slotHeroes};
      currentKeys.forEach((key,index)=>{
        const hero=pool[index]??heroes[index%heroes.length];
        if(hero) slotHeroes[key]=hero.id;
      });
      return {...current,slotHeroes};
    });
  };

  const randomizeAll=()=> {
    const shuffled=[...heroes].sort(()=>Math.random()-.5);
    const slotHeroes={...state.slotHeroes};
    simulatorAllSlotKeys.forEach((key,index)=>{
      const hero=shuffled[index%shuffled.length];
      if(hero) slotHeroes[key]=hero.id;
    });
    patch({slotHeroes});
  };

  const completeDraft=()=>update(current=>{
    const currentSequence=phases(current.mode,current.firstPickSide);
    const completedKeys=currentSequence
      .map((_,index)=>simulatorSlotForPhase(current.mode,current.firstPickSide,index))
      .filter(Boolean)
      .map(slot=>simulatorSlotKey(slot!));
    return {
      ...current,
      phaseIndex:currentSequence.length,
      locked:unique([...current.locked,...completedKeys]),
      autoPlay:false,
    };
  });

  const swapPicks=()=>update(current=>({
    ...current,
    slotHeroes:swapSimulatorPickHeroes(current.slotHeroes,swapSide,swapA,swapB),
  }));

  useEffect(()=>{
    if(!state.autoPlay||state.phaseIndex>=sequence.length) return;
    const delay=simulatorRandomDelayMs(state.intervalMinMs,state.intervalMaxMs);
    const timer=window.setTimeout(()=>{
      update(current=>{
        const currentSequence=phases(current.mode,current.firstPickSide);
        const currentSlots=simulatorSlotsForTurn(current.mode,current.firstPickSide,current.phaseIndex);
        if(!currentSlots.length) return {...current,autoPlay:false};
        const keys=currentSlots.map(simulatorSlotKey);
        const allLocked=keys.every(key=>current.locked.includes(key));
        if(!allLocked) {
          return {...current,locked:unique([...current.locked,...keys])};
        }
        const next=Math.min(
          currentSequence.length,
          simulatorNextTurnPhase(current.mode,current.firstPickSide,current.phaseIndex),
        );
        return {...current,phaseIndex:next,autoPlay:next<currentSequence.length&&current.autoPlay};
      });
    },delay);
    return()=>window.clearTimeout(timer);
  },[
    sequence.length,
    state.autoPlay,
    state.firstPickSide,
    state.intervalMaxMs,
    state.intervalMinMs,
    state.locked,
    state.mode,
    state.phaseIndex,
    update,
  ]);

  const renderPickEditor=(side:Side,index:number)=>{
    const key=side+'Pick'+(index+1);
    const locked=state.locked.includes(key);
    return <label className="sim-roster-editor" key={key}>
      <span>{side==='blue'?'蓝':'红'} P{index+1}</span>
      <select
        value={state.slotHeroes[key]??''}
        onChange={event=>update(current=>({
          ...current,
          slotHeroes:{...current.slotHeroes,[key]:Number(event.target.value)},
        }))}
      >
        {heroes.map(hero=><option key={hero.id} value={hero.id}>{hero.chineseName} · {hero.englishName}</option>)}
      </select>
      <em>{locked?'LOCKED':'未锁定'}</em>
    </label>;
  };

  return <main className="bp-simulator-control-page">
    <header className="sim-control-page-header">
      <div>
        <h1>HOK BP Simulator 控制台</h1>
        <p>采集画面与控制完全分离。控制页的每次改动会实时同步到 BP 画面。</p>
      </div>
      <div className="sim-control-page-links">
        <button onClick={()=>window.open('/tools/bp-simulator','hok-bp-simulator-stage')}>打开 / 聚焦 BP 采集画面</button>
        <button onClick={resetProgress}>重置进度</button>
      </div>
    </header>

    <section className="sim-control-panel">
      <h2>比赛与阶段</h2>
      <div className="sim-control-grid separated">
        <label>BP 模式
          <select value={state.mode} onChange={event=>setDraftMode(event.target.value as typeof state.mode)}>
            <option value="match">Match · 4 Ban</option>
            <option value="normal">Normal · 2 Ban</option>
          </select>
        </label>
        <label>先手方
          <select value={state.firstPickSide} onChange={event=>setFirstPickSide(event.target.value as Side)}>
            <option value="blue">蓝方</option>
            <option value="red">红方</option>
          </select>
        </label>
        <div className="sim-interval-range">
          <span>自动脚本随机等待</span>
          <label>最短
            <input
              type="number"
              min={0.3}
              max={15}
              step={0.1}
              value={(state.intervalMinMs/1000).toFixed(1)}
              onChange={event=>patch({intervalMinMs:Math.round(Number(event.target.value)*1000)})}
            />
            <small>秒</small>
          </label>
          <span className="sim-range-separator">—</span>
          <label>最长
            <input
              type="number"
              min={0.3}
              max={15}
              step={0.1}
              value={(state.intervalMaxMs/1000).toFixed(1)}
              onChange={event=>patch({intervalMaxMs:Math.round(Number(event.target.value)*1000)})}
            />
            <small>秒</small>
          </label>
        </div>
        <label>Ban 头像尺寸
          <input type="range" min={24} max={64} value={state.banSize} onChange={event=>patch({banSize:Number(event.target.value)})}/>
          <span>{state.banSize}px</span>
        </label>
        <label>Pick 头像尺寸
          <input type="range" min={48} max={104} value={state.pickSize} onChange={event=>patch({pickSize:Number(event.target.value)})}/>
          <span>{state.pickSize}px</span>
        </label>
      </div>

      <div className="sim-phase-readout">
        <strong>{active?(active.side==='blue'?'蓝方':'红方')+' · '+(active.action==='ban'?'BAN ':'PICK ')+activeSlots.map(slot=>(active.action==='ban'?'B':'P')+(slot.slotIndex+1)).join(' + '):'BP 已完成'}</strong>
        <span>Phase {Math.min(state.phaseIndex+1,sequence.length)}/{sequence.length}</span>
        <span>{activeKeys.join(' + ')||'—'}</span>
        <span className={activeLocked?'locked':'unlocked'}>{activeLocked?'LOCKED / 等待下一轮':'PRESELECT / UNLOCKED'}</span>
      </div>

      <div className="sim-actions large">
        <button onClick={previousPhase} disabled={state.phaseIndex<=0}>← 上一步</button>
        <button onClick={toggleCurrentLock} disabled={!activeKeys.length}>{activeLocked?'解除当前组锁定':'锁定当前组'}</button>
        <button onClick={toggleEmptyBan} disabled={active?.action!=='ban'} className={activeKey&&state.emptyBans.includes(activeKey)?'active':''}>切换空 Ban</button>
        <button onClick={nextPhase} disabled={!activeKeys.length||!activeLocked}>让下一轮开始选人 →</button>
        <button onClick={()=>patch({autoPlay:!state.autoPlay})} className={state.autoPlay?'active':''}>{state.autoPlay?'暂停自动脚本':'启动自动脚本'}</button>
        <button onClick={completeDraft}>直接完成 BP（换人测试）</button>
      </div>
    </section>

    <section className="sim-control-panel">
      <h2>当前预选英雄</h2>
      <div className="sim-current-pick-group">
        {activeSlots.map(slot=>{
          const key=simulatorSlotKey(slot);
          return <label key={key}>{slot.action==='ban'?'B':'P'}{slot.slotIndex+1}
            <select
              value={state.slotHeroes[key]??''}
              disabled={activeLocked}
              onChange={event=>update(current=>({
                ...current,
                slotHeroes:{...current.slotHeroes,[key]:Number(event.target.value)},
              }))}
            >
              {heroes.map(hero=><option key={hero.id} value={hero.id}>{hero.chineseName} · {hero.englishName}</option>)}
            </select>
          </label>;
        })}
        <button onClick={randomizeCurrent} disabled={!activeKeys.length||activeLocked}>随机当前组预选</button>
        <button onClick={randomizeAll}>随机全部英雄</button>
      </div>
      <p className="sim-control-note">双选阶段可同时编辑两个 Pick 位；锁定当前组后即可推进到下一轮。</p>
    </section>

    <section className="sim-control-panel">
      <h2>选手互换英雄测试</h2>
      <div className="sim-swap-row">
        <label>队伍
          <select value={swapSide} onChange={event=>setSwapSide(event.target.value as Side)}>
            <option value="blue">蓝方</option>
            <option value="red">红方</option>
          </select>
        </label>
        <label>选手 A
          <select value={swapA} onChange={event=>setSwapA(Number(event.target.value))}>
            {[0,1,2,3,4].map(index=><option key={index} value={index}>P{index+1} · {heroName(state.slotHeroes[swapSide+'Pick'+(index+1)])}</option>)}
          </select>
        </label>
        <span className="sim-swap-arrow">⇄</span>
        <label>选手 B
          <select value={swapB} onChange={event=>setSwapB(Number(event.target.value))}>
            {[0,1,2,3,4].map(index=><option key={index} value={index}>P{index+1} · {heroName(state.slotHeroes[swapSide+'Pick'+(index+1)])}</option>)}
          </select>
        </label>
        <button onClick={swapPicks} disabled={swapA===swapB}>立即交换英雄</button>
      </div>
      <p className="sim-control-note">交换只改变最终玩家槽的英雄，不改写 BP 历史。</p>
    </section>

    <section className="sim-control-panel">
      <h2>10 个 Pick 槽实时状态</h2>
      <div className="sim-roster-editors">
        <div>{[0,1,2,3,4].map(index=>renderPickEditor('blue',index))}</div>
        <div>{[0,1,2,3,4].map(index=>renderPickEditor('red',index))}</div>
      </div>
    </section>
  </main>;
}
