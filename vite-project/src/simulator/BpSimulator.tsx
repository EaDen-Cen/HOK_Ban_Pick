import { ViewportCanvas } from '../shared/ViewportCanvas';
import { useEffect, useMemo } from 'react';
import heroes from '../components/HeroList';
import { phases, type Side } from '../shared/types';
import { simulatorBanVisualKeys, simulatorSlotForPhase, simulatorSlotKey, simulatorSlotsForTurn } from './bpSimulatorModel';
import { useBpSimulatorState } from './bpSimulatorState';
import './bpSimulator.css';

const roles=['Roaming','Jungling','Mid Lane','Clash Lane','Farm Lane'];

function heroName(id:number|undefined) {
  const hero=heroes.find(item=>item.id===id);
  return hero?.chineseName||hero?.englishName||'—';
}

function heroImage(id:number|undefined) {
  return heroes.find(item=>item.id===id)?.imageLink||'';
}

function LockCue() {
  return <span className="sim-lock-cue" aria-label="locked"><span /></span>;
}

export function BpSimulator() {
  const [state]=useBpSimulatorState();
  const sequence=useMemo(()=>phases(state.mode,state.firstPickSide),[state.mode,state.firstPickSide]);
  const activeSlots=simulatorSlotsForTurn(state.mode,state.firstPickSide,state.phaseIndex);
  const active=activeSlots[0];
  const activeKeys=useMemo(()=>new Set(activeSlots.map(simulatorSlotKey)),[activeSlots]);
  const activeKey=active?simulatorSlotKey(active):'';
  const activeLocked=activeSlots.length>0&&activeSlots.every(slot=>state.locked.includes(simulatorSlotKey(slot)));

  const phaseByKey=useMemo(()=>{
    const map=new Map<string,number>();
    sequence.forEach((_,index)=>{
      const slot=simulatorSlotForPhase(state.mode,state.firstPickSide,index);
      if(slot) map.set(simulatorSlotKey(slot),index);
    });
    return map;
  },[sequence,state.firstPickSide,state.mode]);

  const visibleState=(key:string)=>{
    const slotPhase=phaseByKey.get(key);
    const visible=slotPhase!==undefined&&(slotPhase<state.phaseIndex||activeKeys.has(key));
    const isLocked=(slotPhase!==undefined&&slotPhase<state.phaseIndex)||state.locked.includes(key);
    const isCurrent=activeKeys.has(key)&&!state.locked.includes(key);
    return {visible,isCurrent,isLocked,empty:state.emptyBans.includes(key)};
  };

  const activeHeroId=activeKey?state.slotHeroes[activeKey]:undefined;
  const heroPool=useMemo(()=>{
    const base=heroes.slice(0,28);
    if(activeHeroId===undefined||base.some(hero=>hero.id===activeHeroId)) return base;
    const activeHero=heroes.find(hero=>hero.id===activeHeroId);
    return activeHero?[activeHero,...base.slice(1)]:base;
  },[activeHeroId]);

  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{
      if(event.key.toLowerCase()==='f'){
        event.preventDefault();
        if(document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen();
      }
      if(event.key.toLowerCase()==='c'){
        event.preventDefault();
        window.open('/tools/bp-simulator-control','hok-bp-simulator-control');
      }
    };
    window.addEventListener('keydown',listener);
    return()=>window.removeEventListener('keydown',listener);
  },[]);

  const renderBan=(key:string)=>{
    const side=key.startsWith('blue')?'blue':'red';
    const stateForSlot=visibleState(key);
    const id=state.slotHeroes[key];
    return <div
      className={'sim-ban-slot '+side+' '+(stateForSlot.isCurrent?'active ':'')+(stateForSlot.visible?'visible ':'')+(stateForSlot.isLocked?'locked':'')}
      key={key}
      data-slot={key}
    >
      <div className="sim-ban-avatar" style={{width:state.banSize,height:state.banSize}}>
        {stateForSlot.visible&&!stateForSlot.empty&&<img src={heroImage(id)} alt={heroName(id)} />}
        {stateForSlot.visible&&stateForSlot.empty&&<span className="sim-empty-ban">∅</span>}
        {stateForSlot.isLocked&&<LockCue />}
      </div>
    </div>;
  };

  const renderPlayer=(side:Side,index:number)=>{
    const key=side+'Pick'+(index+1);
    const stateForSlot=visibleState(key);
    const id=state.slotHeroes[key];
    return <div
      className={'sim-player-row '+side+' '+(stateForSlot.isCurrent?'active ':'')+(stateForSlot.visible?'visible ':'')+(stateForSlot.isLocked?'locked':'')}
      key={key}
      data-slot={key}
    >
      <div className="sim-pick-avatar" style={{width:state.pickSize,height:state.pickSize}}>
        {stateForSlot.visible&&<img src={heroImage(id)} alt={heroName(id)} />}
        {!stateForSlot.visible&&<span className="sim-player-placeholder">{index+1}</span>}
      </div>
      <div className="sim-player-copy">
        <strong>{side==='blue'?'BLUE':'RED'}.P{index+1}</strong>
        <span>{roles[index]}</span>
        {stateForSlot.visible&&<small>{heroName(id)}</small>}
      </div>
    </div>;
  };

  const actionLabel=active?.action==='ban'?'Ban':active?.action==='pick'?'Pick':'Complete';

  return <main className="bp-simulator-stage-page" aria-label="HOK BP capture simulator">
    <ViewportCanvas width={1600} height={900} className="bp-simulator-stage">
      <div className="sim-side-wash blue" />
      <div className="sim-side-wash red" />

      <div className="sim-ban-row blue">
        {simulatorBanVisualKeys('blue').map(renderBan)}
      </div>
      <div className="sim-ban-row red">
        {simulatorBanVisualKeys('red').map(renderBan)}
      </div>

      <div className="sim-pick-column blue">
        {[0,1,2,3,4].map(index=>renderPlayer('blue',index))}
      </div>
      <div className="sim-pick-column red">
        {[0,1,2,3,4].map(index=>renderPlayer('red',index))}
      </div>

      <section className="sim-game-center">
        <header className="sim-game-title">
          <span>Phase</span>
          <strong>{actionLabel}</strong>
          <small>{active?((active.side==='blue'?'BLUE':'RED')+' · '+activeSlots.map(slot=>'P'+(slot.slotIndex+1)).join(' + ')):'DRAFT COMPLETE'}</small>
        </header>

        <nav className="sim-role-tabs" aria-hidden="true">
          <span>ALL</span><span>CLASH</span><span>JUNGLE</span><span>MID</span><span>FARM</span><span>ROAM</span>
        </nav>

        <div className="sim-hero-grid">
          {heroPool.map(hero=>{
            const selected=activeHeroId===hero.id&&!!active;
            return <div className={'sim-hero-cell '+(selected?'selected':'')} key={hero.id}>
              <img src={hero.imageLink} alt="" />
              <span>{hero.englishName}</span>
            </div>;
          })}
        </div>

        <div className="sim-game-actions">
          <button className="ghost">REQUEST</button>
          <button className={'primary '+(activeLocked?'locked':'')}>
            {activeLocked?'LOCKED':actionLabel.toUpperCase()}
          </button>
          <button className="ghost">PRESELECT</button>
        </div>
      </section>

      <div className="sim-bottom-status">
        <span>{activeSlots.length?activeSlots.map(simulatorSlotKey).join(' + '):'DRAFT COMPLETE'}</span>
        <strong>{activeLocked?'LOCKED / TRANSITIONED':'PRESELECT'}</strong>
        <small>F: FULLSCREEN · C: CONTROL</small>
      </div>
    </ViewportCanvas>
  </main>;
}
