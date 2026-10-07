import { useEffect, useMemo, useState } from 'react';
import heroes from '../components/HeroList';
import { phases, type Side } from '../shared/types';
import {
  simulatorAllSlotKeys,
  simulatorSlotForPhase,
  simulatorSlotKey,
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
  const active=simulatorSlotForPhase(state.mode,state.firstPickSide,state.phaseIndex);
  const activeKey=active?simulatorSlotKey(active):'';
  const activeLocked=activeKey?state.locked.includes(activeKey):false;

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
    if(!activeKey) return;
    update(current=>({
      ...current,
      locked:current.locked.includes(activeKey)
        ? current.locked.filter(key=>key!==activeKey)
        : unique([...current.locked,activeKey]),
    }));
  };

  const nextPhase=()=> {
    if(!activeKey||!activeLocked) return;
    update(current=>({
      ...current,
      phaseIndex:Math.min(phases(current.mode,current.firstPickSide).length,current.phaseIndex+1),
    }));
  };

  const previousPhase=()=>update(current=>{
    const next=Math.max(0,current.phaseIndex-1);
    const nextActive=simulatorSlotForPhase(current.mode,current.firstPickSide,next);
    const key=nextActive?simulatorSlotKey(nextActive):'';
    return {
      ...current,
      phaseIndex:next,
      locked:key?current.locked.filter(item=>item!==key):current.locked,
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
    if(!activeKey||activeLocked) return;
    const used=new Set(Object.values(state.slotHeroes));
    const pool=heroes.filter(hero=>!used.has(hero.id));
    const source=pool.length?pool:heroes;
    const hero=source[Math.floor(Math.random()*source.length)];
    if(!hero) return;
    update(current=>({...current,slotHeroes:{...current.slotHeroes,[activeKey]:hero.id}}));
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
    const timer=window.setTimeout(()=>{
      update(current=>{
        const currentSequence=phases(current.mode,current.firstPickSide);
        const currentActive=simulatorSlotForPhase(current.mode,current.firstPickSide,current.phaseIndex);
        if(!currentActive) return {...current,autoPlay:false};
        const key=simulatorSlotKey(currentActive);
        if(!current.locked.includes(key)) {
          return {...current,locked:unique([...current.locked,key])};
        }
        const next=Math.min(currentSequence.length,current.phaseIndex+1);
        return {...current,phaseIndex:next,autoPlay:next<currentSequence.length&&current.autoPlay};
      });
    },state.intervalMs);
    return()=>window.clearTimeout(timer);
  },[sequence.length,state.autoPlay,state.firstPickSide,state.intervalMs,state.mode,state.phaseIndex,update]);

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
        <label>自动脚本间隔
          <select value={state.intervalMs} onChange={event=>patch({intervalMs:Number(event.target.value)})}>
            <option value={600}>0.6 秒</option>
            <option value={1000}>1 秒</option>
            <option value={1500}>1.5 秒</option>
            <option value={2500}>2.5 秒</option>
            <option value={4000}>4 秒</option>
          </select>
        </label>
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
        <strong>{active?(active.side==='blue'?'蓝方':'红方')+' · '+(active.action==='ban'?'BAN':'PICK')+' '+(active.slotIndex+1):'BP 已完成'}</strong>
        <span>Phase {Math.min(state.phaseIndex+1,sequence.length)}/{sequence.length}</span>
        <span>{activeKey||'—'}</span>
        <span className={activeLocked?'locked':'unlocked'}>{activeLocked?'LOCKED':'PRESELECT / UNLOCKED'}</span>
      </div>

      <div className="sim-actions large">
        <button onClick={previousPhase} disabled={state.phaseIndex<=0}>← 上一步</button>
        <button onClick={toggleCurrentLock} disabled={!activeKey}>{activeLocked?'解除锁定':'锁定当前英雄'}</button>
        <button onClick={toggleEmptyBan} disabled={active?.action!=='ban'} className={activeKey&&state.emptyBans.includes(activeKey)?'active':''}>切换空 Ban</button>
        <button onClick={nextPhase} disabled={!activeKey||!activeLocked}>下一阶段 →</button>
        <button onClick={()=>patch({autoPlay:!state.autoPlay})} className={state.autoPlay?'active':''}>{state.autoPlay?'暂停自动脚本':'启动自动脚本'}</button>
        <button onClick={completeDraft}>直接完成 BP（换人测试）</button>
      </div>
    </section>

    <section className="sim-control-panel">
      <h2>当前预选英雄</h2>
      <div className="sim-current-hero-control">
        <label>当前槽位英雄
          <select
            value={activeKey?state.slotHeroes[activeKey]??'':''}
            disabled={!activeKey||activeLocked}
            onChange={event=>activeKey&&update(current=>({
              ...current,
              slotHeroes:{...current.slotHeroes,[activeKey]:Number(event.target.value)},
            }))}
          >
            {heroes.map(hero=><option key={hero.id} value={hero.id}>{hero.chineseName} · {hero.englishName}</option>)}
          </select>
        </label>
        <button onClick={randomizeCurrent} disabled={!activeKey||activeLocked}>随机预选（不锁定）</button>
        <button onClick={randomizeAll}>随机全部英雄</button>
      </div>
      <p className="sim-control-note">预选英雄会立即显示在 BP 画面，但只有点击“锁定当前英雄”后才出现锁定 cue。这样可以直接验证识别器不会在预选阶段提前提交。</p>
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
      <p className="sim-control-note">交换只改变两个玩家槽里的英雄，不解除锁定，也不会推进 BP phase，适合在 BP 完成后测试最终阵容 / 换英雄检测。</p>
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
