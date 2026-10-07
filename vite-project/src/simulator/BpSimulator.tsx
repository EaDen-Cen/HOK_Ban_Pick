import { useEffect, useMemo, useState } from 'react';
import heroes from '../components/HeroList';
import { phases, type MatchState, type Side } from '../shared/types';
import { simulatorSlotForPhase, simulatorSlotKey } from './bpSimulatorModel';
import './bpSimulator.css';

type SlotMap = Record<string,number>;

const defaultAssignments=():SlotMap=>{
  const ids=heroes.slice(0,18).map(hero=>hero.id);
  const map:SlotMap={};
  const keys=[
    'blueBan1','redBan1','blueBan2','redBan2',
    'bluePick1','redPick1','redPick2','bluePick2','bluePick3','redPick3',
    'redBan3','blueBan3','redBan4','blueBan4',
    'redPick4','bluePick4','bluePick5','redPick5',
  ];
  keys.forEach((key,index)=>{map[key]=ids[index%ids.length];});
  return map;
};

function heroName(id:number|undefined) {
  const hero=heroes.find(item=>item.id===id);
  return hero?.chineseName||hero?.englishName||'—';
}

function heroImage(id:number|undefined) {
  return heroes.find(item=>item.id===id)?.imageLink||'';
}

function slotKeys(side:Side,action:'ban'|'pick',count:number) {
  return Array.from({length:count},(_,index)=>`${side}${action==='ban'?'Ban':'Pick'}${index+1}`);
}

function LockCue() {
  return <span className="sim-lock-cue" aria-label="locked"><span /></span>;
}

export function BpSimulator() {
  const [mode,setMode]=useState<MatchState['draftMode']>('match');
  const [firstPickSide,setFirstPickSide]=useState<Side>('blue');
  const [phaseIndex,setPhaseIndex]=useState(0);
  const [slotHeroes,setSlotHeroes]=useState<SlotMap>(defaultAssignments);
  const [emptyBans,setEmptyBans]=useState<Set<string>>(()=>new Set());
  const [locked,setLocked]=useState<Set<string>>(()=>new Set());
  const [controls,setControls]=useState(true);
  const [autoPlay,setAutoPlay]=useState(false);
  const [intervalMs,setIntervalMs]=useState(2200);
  const [banSize,setBanSize]=useState(38);
  const [pickSize,setPickSize]=useState(72);

  const sequence=useMemo(()=>phases(mode,firstPickSide),[mode,firstPickSide]);
  const active=simulatorSlotForPhase(mode,firstPickSide,phaseIndex);
  const activeKey=active?simulatorSlotKey(active):'';
  const phaseByKey=useMemo(()=>{
    const map=new Map<string,number>();
    sequence.forEach((_,index)=>{
      const slot=simulatorSlotForPhase(mode,firstPickSide,index);
      if(slot) map.set(simulatorSlotKey(slot),index);
    });
    return map;
  },[mode,firstPickSide,sequence]);

  const reset=()=>{
    setPhaseIndex(0);
    setEmptyBans(new Set());
    setLocked(new Set());
    setAutoPlay(false);
  };

  const nextPhase=()=>{
    if(activeKey) setLocked(previous=>new Set(previous).add(activeKey));
    setPhaseIndex(current=>Math.min(sequence.length,current+1));
  };

  const previousPhase=()=>{
    setPhaseIndex(current=>{
      const next=Math.max(0,current-1);
      const nextActive=simulatorSlotForPhase(mode,firstPickSide,next);
      if(nextActive){
        const key=simulatorSlotKey(nextActive);
        setLocked(previous=>{const copy=new Set(previous);copy.delete(key);return copy;});
      }
      return next;
    });
  };

  const toggleCurrentLock=()=>{
    if(!activeKey) return;
    setLocked(previous=>{
      const copy=new Set(previous);
      if(copy.has(activeKey)) copy.delete(activeKey); else copy.add(activeKey);
      return copy;
    });
  };

  const toggleEmptyBan=()=>{
    if(!activeKey||active?.action!=='ban') return;
    setEmptyBans(previous=>{
      const copy=new Set(previous);
      if(copy.has(activeKey)) copy.delete(activeKey); else copy.add(activeKey);
      return copy;
    });
  };

  const randomizeCurrent=()=>{
    if(!activeKey) return;
    const used=new Set(Object.values(slotHeroes));
    const pool=heroes.filter(hero=>!used.has(hero.id));
    const source=pool.length?pool:heroes;
    const hero=source[Math.floor(Math.random()*source.length)];
    if(hero) setSlotHeroes(previous=>({...previous,[activeKey]:hero.id}));
  };

  const randomizeAll=()=>{
    const shuffled=[...heroes].sort(()=>Math.random()-.5).slice(0,18);
    const map:SlotMap={};
    sequence.forEach((_,index)=>{
      const slot=simulatorSlotForPhase(mode,firstPickSide,index);
      if(slot) map[simulatorSlotKey(slot)]=shuffled[index%shuffled.length]?.id??heroes[index%heroes.length].id;
    });
    setSlotHeroes(previous=>({...previous,...map}));
  };

  useEffect(()=>{
    if(!autoPlay||phaseIndex>=sequence.length) return;
    const timer=window.setTimeout(()=>{
      if(activeKey&&!locked.has(activeKey)) toggleCurrentLock();
      else nextPhase();
    },intervalMs);
    return()=>window.clearTimeout(timer);
  },[autoPlay,activeKey,intervalMs,locked,phaseIndex,sequence.length]);

  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{
      if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement) return;
      if(event.key.toLowerCase()==='h') setControls(value=>!value);
      if(event.key.toLowerCase()==='n') nextPhase();
      if(event.key.toLowerCase()==='b') previousPhase();
      if(event.key.toLowerCase()==='e') toggleEmptyBan();
      if(event.key.toLowerCase()==='r') randomizeCurrent();
      if(event.key.toLowerCase()==='a') setAutoPlay(value=>!value);
      if(event.code==='Space'){event.preventDefault();toggleCurrentLock();}
    };
    window.addEventListener('keydown',listener);
    return()=>window.removeEventListener('keydown',listener);
  });

  const visibleState=(key:string)=>{
    const slotPhase=phaseByKey.get(key);
    const visible=slotPhase!==undefined&&slotPhase<=phaseIndex;
    const isCurrent=key===activeKey;
    const isLocked=(slotPhase!==undefined&&slotPhase<phaseIndex)||locked.has(key);
    return {visible,isCurrent,isLocked,empty:emptyBans.has(key)};
  };

  const renderBan=(side:Side,index:number)=>{
    const key=`${side}Ban${index+1}`;
    const state=visibleState(key);
    const id=slotHeroes[key];
    return <div className={`sim-ban-slot ${side} ${state.isCurrent?'active':''} ${state.visible?'visible':''}`} key={key} data-slot={key}>
      <div className="sim-ban-avatar" style={{width:banSize,height:banSize}}>
        {state.visible&&!state.empty&&<img src={heroImage(id)} alt={heroName(id)} />}
        {state.visible&&state.empty&&<span className="sim-empty-ban">∅</span>}
        {state.isLocked&&<LockCue />}
      </div>
      <small>{index+1}</small>
    </div>;
  };

  const renderPick=(side:Side,index:number)=>{
    const key=`${side}Pick${index+1}`;
    const state=visibleState(key);
    const id=slotHeroes[key];
    return <div className={`sim-pick-slot ${side} ${state.isCurrent?'active':''} ${state.visible?'visible':''}`} key={key} data-slot={key} style={{minHeight:pickSize}}>
      <div className="sim-pick-avatar" style={{width:pickSize,height:pickSize}}>
        {state.visible&&<img src={heroImage(id)} alt={heroName(id)} />}
        {state.isLocked&&<LockCue />}
      </div>
      <div className="sim-pick-meta">
        <strong>{state.visible?heroName(id):`PICK ${index+1}`}</strong>
        <span>{side==='blue'?'BLUE':'RED'} · P{index+1}</span>
      </div>
    </div>;
  };

  return <main className={`bp-simulator ${controls?'with-controls':'clean'}`}>
    <section className="bp-simulator-stage" aria-label="BP capture simulator">
      <header className="sim-header">
        <div><b>HOK BP CAPTURE LAB</b><span>SCREEN RECOGNITION TEST HARNESS</span></div>
        <div className="sim-phase-chip">
          {active?<><strong>{active.side.toUpperCase()} · {active.action.toUpperCase()} {active.slotIndex+1}</strong><span>PHASE {phaseIndex+1}/{sequence.length}</span></>:<><strong>DRAFT COMPLETE</strong><span>{sequence.length} PHASES</span></>}
        </div>
      </header>

      <div className="sim-ban-row blue">{slotKeys('blue','ban',4).map((_,index)=>renderBan('blue',index))}</div>
      <div className="sim-ban-row red">{slotKeys('red','ban',4).map((_,index)=>renderBan('red',index))}</div>

      <div className="sim-pick-column blue">{slotKeys('blue','pick',5).map((_,index)=>renderPick('blue',index))}</div>
      <div className="sim-pick-column red">{slotKeys('red','pick',5).map((_,index)=>renderPick('red',index))}</div>

      <div className="sim-center">
        <span className="sim-center-kicker">CAPTURE TARGET</span>
        <h1>{active?heroName(slotHeroes[activeKey]):'DRAFT COMPLETE'}</h1>
        <p>{active?.action==='ban'&&emptyBans.has(activeKey)?'EMPTY BAN TEST':locked.has(activeKey)?'LOCKED':'HOVER / PREVIEW'}</p>
        <div className="sim-timer">{String(Math.max(0,20-(phaseIndex%21))).padStart(2,'0')}</div>
      </div>

      {!controls&&<button className="sim-show-controls" onClick={()=>setControls(true)}>H</button>}
    </section>

    {controls&&<aside className="bp-simulator-controls">
      <header><div><strong>BP Simulator</strong><span>用于测试窗口采集 / 18 槽识别 / 空 Ban 锁定</span></div><button onClick={()=>setControls(false)}>隐藏 H</button></header>

      <div className="sim-control-grid">
        <label>BP 模式<select value={mode} onChange={event=>{setMode(event.target.value as MatchState['draftMode']);reset();}}><option value="match">Match · 4 Ban</option><option value="normal">Normal · 2 Ban</option></select></label>
        <label>先手<select value={firstPickSide} onChange={event=>{setFirstPickSide(event.target.value as Side);reset();}}><option value="blue">蓝方</option><option value="red">红方</option></select></label>
        <label>当前英雄<select value={activeKey?slotHeroes[activeKey]??'':''} disabled={!activeKey} onChange={event=>activeKey&&setSlotHeroes(previous=>({...previous,[activeKey]:Number(event.target.value)}))}>{heroes.map(hero=><option key={hero.id} value={hero.id}>{hero.chineseName} · {hero.englishName}</option>)}</select></label>
        <label>自动步进<select value={intervalMs} onChange={event=>setIntervalMs(Number(event.target.value))}><option value={1200}>1.2 秒</option><option value={2200}>2.2 秒</option><option value={4000}>4 秒</option><option value={7000}>7 秒</option></select></label>
        <label>Ban 头像尺寸<input type="range" min={24} max={64} value={banSize} onChange={event=>setBanSize(Number(event.target.value))}/><span>{banSize}px</span></label>
        <label>Pick 头像尺寸<input type="range" min={48} max={104} value={pickSize} onChange={event=>setPickSize(Number(event.target.value))}/><span>{pickSize}px</span></label>
      </div>

      <div className="sim-actions">
        <button onClick={previousPhase} disabled={phaseIndex<=0}>← 上一步 B</button>
        <button onClick={toggleCurrentLock} disabled={!activeKey}>{activeKey&&locked.has(activeKey)?'解除锁定':'锁定当前'} · Space</button>
        <button onClick={toggleEmptyBan} disabled={active?.action!=='ban'} className={activeKey&&emptyBans.has(activeKey)?'active':''}>空 Ban · E</button>
        <button onClick={nextPhase} disabled={phaseIndex>=sequence.length}>下一步 N →</button>
        <button onClick={randomizeCurrent} disabled={!activeKey}>随机当前 R</button>
        <button onClick={randomizeAll}>随机全部</button>
        <button onClick={()=>setAutoPlay(value=>!value)} className={autoPlay?'active':''}>{autoPlay?'暂停脚本':'自动脚本'} · A</button>
        <button onClick={reset}>重置</button>
      </div>

      <footer>
        <span>当前：{activeKey||'完成'}</span>
        <span>{activeKey&&locked.has(activeKey)?'LOCKED':'UNLOCKED'}</span>
        <span>快捷键：N/B 步进 · Space 锁定 · E 空 Ban · R 随机 · A 自动 · H 隐藏控制</span>
      </footer>
    </aside>}
  </main>;
}
