import { useEffect, useMemo, useState } from 'react';
import heroes from '../components/HeroList';
import { useAccess } from '../shared/access';
import { useMatch } from '../shared/useMatch';
import { initialState, phases, type MatchSettings, type MatchState, type Side } from '../shared/types';
import {
  simulatorAllSlotKeys,
  randomizeSimulatorSlots,
  simulatorPlayerOrdersMatch,
  simulatorPlayerTestRoster,
  simulatorRandomPlayerOrder,
  type SimulatorPlayerProfile,
  type SimulatorTestMode,
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

function sameNumbers(a:readonly (number|null)[],b:readonly number[]) {
  return a.length===b.length&&a.every((value,index)=>value===b[index]);
}

function settingsWithPlayers(state:MatchState,bluePlayers:string[],redPlayers:string[]):MatchSettings {
  return {
    blueTeam:{...state.blueTeam,players:[...bluePlayers]},
    redTeam:{...state.redTeam,players:[...redPlayers]},
    blueScore:state.blueScore,
    redScore:state.redScore,
    gameNumber:state.gameNumber,
    seriesFormat:state.seriesFormat,
    stage:state.stage,
    draftMode:state.draftMode,
    draftRuleMode:state.draftRuleMode,
    flowbornFormsIndependent:state.flowbornFormsIndependent,
    firstPickSide:state.firstPickSide,
    sideSwapMode:state.sideSwapMode,
    language:state.language,
    overlayLayout:state.overlayLayout,
    scoreDisplay:state.scoreDisplay,
    bpInputMode:'screen',
    recognitionAutoAccept:state.recognitionAutoAccept,
    recognitionThreshold:state.recognitionThreshold,
    showHeroName:state.showHeroName,
    artSourceMode:state.artSourceMode,
  };
}

export function BpSimulatorControl() {
  const [state,update]=useBpSimulatorState();
  const access=useAccess('control');
  const {snapshot,status:controlStatus,error:controlError,pending:controlPending,send:sendControl,acknowledged}=useMatch('control',access.token,access.saveToken);
  const rules=snapshot?.state ?? initialState();
  const [ruleError,setRuleError]=useState('');
  const randomize=(current:typeof state, keys:string[],autoPlay=current.autoPlay)=>{
    try { const slotHeroes=randomizeSimulatorSlots(current.slotHeroes,current.mode,current.firstPickSide,rules,new Set(keys),current.emptyBans); setRuleError(''); return {...current,slotHeroes,autoPlay}; }
    catch(error){setRuleError(error instanceof Error?error.message:'No legal candidates');return {...current,autoPlay:false};}
  };
  const [swapSide,setSwapSide]=useState<Side>('blue');
  const [swapA,setSwapA]=useState(0);
  const [swapB,setSwapB]=useState(1);

  const [controlLink,setControlLink]=useState(()=>localStorage.getItem('hok-simulator-control-link')==='1');
  const [integrationMessage,setIntegrationMessage]=useState('');
  const [setup,setSetup]=useState<{step:'resetting'|'syncing';blue:string[];red:string[]}>();
  const [swapStartedAt,setSwapStartedAt]=useState<number|null>(null);
  const [swapCompletedAt,setSwapCompletedAt]=useState<number|null>(null);
  const [clock,setClock]=useState(Date.now());

  const sequence=useMemo(()=>phases(state.mode,state.firstPickSide),[state.mode,state.firstPickSide]);
  const activeSlots=simulatorSlotsForTurn(state.mode,state.firstPickSide,state.phaseIndex);
  const active=activeSlots[0];
  const activeKeys=activeSlots.map(simulatorSlotKey);
  const activeKey=activeKeys[0]??'';
  const activeLocked=activeKeys.length>0&&activeKeys.every(key=>state.locked.includes(key));

  const controlRosterMatches=!!snapshot
    && snapshot.state.blueTeam.players.every((value,index)=>value===state.bluePlayers[index])
    && snapshot.state.redTeam.players.every((value,index)=>value===state.redPlayers[index]);
  const playerOrderMatched=!!snapshot&&controlRosterMatches
    && simulatorPlayerOrdersMatch(snapshot.state.bluePlayerSlotOrder,state.bluePlayerOrder)
    && simulatorPlayerOrdersMatch(snapshot.state.redPlayerSlotOrder,state.redPlayerOrder);
  const swapExpected=[0,1,2,3,4].map(index=>state.slotHeroes[swapSide+'Pick'+(index+1)]).filter((value):value is number=>Number.isInteger(value));
  const swapMatched=!!snapshot&&swapExpected.length===5&&sameNumbers(snapshot.state[`${swapSide}Assignments`],swapExpected);

  const patch=(partial:Partial<typeof state>)=>update(current=>({...current,...partial}));

  const resetProgress=()=>{
    update(current=>({
      ...current,
      phaseIndex:0,
      emptyBans:[],
      locked:[],
      autoPlay:false,
      scene:current.testMode==='player-order'?'lobby':'draft',
      bluePlayerOrder:current.testMode==='player-order'?[0,1,2,3,4]:current.bluePlayerOrder,
      redPlayerOrder:current.testMode==='player-order'?[0,1,2,3,4]:current.redPlayerOrder,
      playerOrderTestStartedAt:null,
      playerOrderTestCompletedAt:null,
    }));
    if(controlLink&&snapshot&&!snapshot.state.committedGameId&&!controlPending&&controlStatus==='Connected') {
      sendControl({type:'reset_draft'});
      setIntegrationMessage('已同时发送 Control BP 重置；英雄/选手结果仍由屏幕识别重新写入。');
    }
  };

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

  const randomizeCurrent=()=>update(current=>randomize(current,
    simulatorSlotsForTurn(current.mode,current.firstPickSide,current.phaseIndex).map(simulatorSlotKey)));
  const randomizeAll=()=>update(current=>randomize(current,
    simulatorAllSlotKeys.filter(key=>!current.locked.includes(key))));

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

  const swapPicks=()=>{
    update(current=>({
      ...current,
      testMode:'lineup',
      scene:'draft',
      slotHeroes:swapSimulatorPickHeroes(current.slotHeroes,swapSide,swapA,swapB),
    }));
    setSwapStartedAt(Date.now());
    setSwapCompletedAt(null);
  };

  const setTestMode=(testMode:SimulatorTestMode)=>update(current=>({
    ...current,
    testMode,
    scene:testMode==='player-order'?'lobby':'draft',
    autoPlay:false,
    playerOrderTestStartedAt:null,
    playerOrderTestCompletedAt:null,
  }));

  const preparePlayerOrderTest=()=>{
    const roster=simulatorPlayerTestRoster(state.playerProfile);
    update(current=>({
      ...current,
      testMode:'player-order',
      scene:'lobby',
      bluePlayers:roster.blue,
      redPlayers:roster.red,
      bluePlayerOrder:[0,1,2,3,4],
      redPlayerOrder:[0,1,2,3,4],
      playerRosterPrepared:!controlLink,
      playerOrderTestStartedAt:null,
      playerOrderTestCompletedAt:null,
      phaseIndex:0,
      locked:[],
      emptyBans:[],
      autoPlay:false,
    }));
    setIntegrationMessage('');
    if(!controlLink) return;
    if(!snapshot||controlStatus!=='Connected'||controlPending) {
      setIntegrationMessage('Control 尚未准备好，无法同步测试名单。');
      return;
    }
    if(snapshot.state.committedGameId) {
      setIntegrationMessage('当前 Control 已提交本局；请进入下一局或重置比赛后再准备玩家排序测试。');
      return;
    }
    setSetup({step:'resetting',blue:roster.blue,red:roster.red});
    sendControl({type:'reset_draft'});
    setIntegrationMessage('正在重置 Control，并准备同步 10 个测试 Player ID…');
  };

  const startPlayerOrderTest=()=>update(current=>{
    if(!current.playerRosterPrepared) return current;
    return {
      ...current,
      testMode:'player-order',
      scene:'draft',
      phaseIndex:0,
      locked:[],
      emptyBans:[],
      autoPlay:false,
      bluePlayerOrder:simulatorRandomPlayerOrder(),
      redPlayerOrder:simulatorRandomPlayerOrder(),
      playerOrderTestStartedAt:Date.now(),
      playerOrderTestCompletedAt:null,
    };
  });

  useEffect(()=>{
    if(!setup||setup.step!=='resetting'||acknowledged?.action.type!=='reset_draft'||controlPending) return;
    sendControl({type:'settings',settings:settingsWithPlayers(rules,setup.blue,setup.red)});
    setSetup({...setup,step:'syncing'});
    setIntegrationMessage('Control 已重置，正在同步测试队伍名单…');
  },[acknowledged,controlPending,rules,sendControl,setup]);

  useEffect(()=>{
    if(!setup||setup.step!=='syncing'||!snapshot) return;
    const blueOk=snapshot.state.blueTeam.players.every((value,index)=>value===setup.blue[index]);
    const redOk=snapshot.state.redTeam.players.every((value,index)=>value===setup.red[index]);
    if(!blueOk||!redOk) return;
    update(current=>({...current,playerRosterPrepared:true}));
    setSetup(undefined);
    setIntegrationMessage('测试名单已同步到 Control。现在可在采集页按 START。');
  },[setup,snapshot,update]);

  useEffect(()=>{
    if(!state.playerOrderTestStartedAt||state.playerOrderTestCompletedAt||!playerOrderMatched) return;
    update(current=>({...current,playerOrderTestCompletedAt:Date.now()}));
  },[playerOrderMatched,state.playerOrderTestCompletedAt,state.playerOrderTestStartedAt,update]);

  useEffect(()=>{
    if(!swapStartedAt||swapCompletedAt||!swapMatched) return;
    setSwapCompletedAt(Date.now());
  },[swapCompletedAt,swapMatched,swapStartedAt]);

  useEffect(()=>{
    if((state.playerOrderTestStartedAt&&!state.playerOrderTestCompletedAt)||(swapStartedAt&&!swapCompletedAt)) {
      const timer=window.setInterval(()=>setClock(Date.now()),50);
      return()=>window.clearInterval(timer);
    }
    setClock(Date.now());
  },[state.playerOrderTestStartedAt,state.playerOrderTestCompletedAt,swapStartedAt,swapCompletedAt]);

  useEffect(()=>{
    if(!state.autoPlay||state.phaseIndex>=sequence.length) return;
    const delay=activeLocked ? 120 : simulatorRandomDelayMs(state.intervalMinMs,state.intervalMaxMs);
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
    activeLocked,
    state.autoPlay,
    state.firstPickSide,
    state.intervalMaxMs,
    state.intervalMinMs,
    state.locked,
    state.mode,
    state.phaseIndex,
    update,
  ]);

  const playerElapsed=state.playerOrderTestStartedAt
    ? (state.playerOrderTestCompletedAt??clock)-state.playerOrderTestStartedAt
    : null;
  const swapElapsed=swapStartedAt?(swapCompletedAt??clock)-swapStartedAt:null;

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

    <section className="sim-test-suite">
      <div className="sim-test-tabs" role="tablist" aria-label="Simulator test mode">
        <button className={state.testMode==='bp'?'active':''} onClick={()=>setTestMode('bp')}>BP 识别</button>
        <button className={state.testMode==='lineup'?'active':''} onClick={()=>setTestMode('lineup')}>换英雄同步</button>
        <button className={state.testMode==='player-order'?'active':''} onClick={()=>setTestMode('player-order')}>选手 ID 排序</button>
      </div>
      <div className="sim-integration-bar">
        <label><input type="checkbox" checked={controlLink} onChange={event=>{
          const enabled=event.target.checked;
          setControlLink(enabled);
          localStorage.setItem('hok-simulator-control-link',enabled?'1':'0');
          setIntegrationMessage(enabled?'已启用 Control 联动测试；请确保 Control 正在采集 Simulator 页面。':'已关闭 Control 联动；Simulator 不会主动修改 Control。');
        }} /> Control 联动测试</label>
        <span className={controlStatus==='Connected'?'ok':'warn'}>{controlStatus}</span>
        <small>只有开启后，Simulator 才会同步测试名单或发送 BP 重置；英雄和玩家顺序结果仍必须由 Control 从采集画面识别。</small>
      </div>
      {(integrationMessage||controlError)&&<p className="sim-integration-message" role="status">{integrationMessage||controlError}</p>}
    </section>

    {state.testMode==='player-order'&&<section className="sim-control-panel sim-player-order-test">
      <h2>选手 ID 排序 · 自定义房间 → BP</h2>
      <p className="sim-control-note">先生成双方各 5 个赛前 ID，再同步给 Control。按 START 时蓝、红分别只在本队内部随机位置；Simulator 保存真实顺序，等待 Control OCR 更新 PlayerSlotOrder 后自动停止计时。</p>
      <div className="sim-player-test-toolbar">
        <label>ID 压力测试集
          <select value={state.playerProfile} onChange={event=>patch({playerProfile:event.target.value as SimulatorPlayerProfile,playerRosterPrepared:false,scene:'lobby'})}>
            <option value="mixed">混合：英文 + 简中 + 日文</option>
            <option value="latin">英文 / 数字 / 符号</option>
            <option value="zh">简体中文</option>
            <option value="confusable">OCR 易混淆：O/0、I/l/1、S/5</option>
            <option value="ja">日文假名（需额外 jpn OCR 模型）</option>
          </select>
        </label>
        <button disabled={controlLink&&(controlPending||controlStatus!=='Connected')} onClick={preparePlayerOrderTest}>① 随机 10 个 ID / 准备房间</button>
        <button disabled={!state.playerRosterPrepared||state.scene!=='lobby'} onClick={startPlayerOrderTest}>② START：随机队内位置并计时</button>
        <button onClick={()=>window.open('/tools/bp-simulator','hok-bp-simulator-stage')}>打开房间 / BP 采集页</button>
      </div>
      <div className="sim-player-ground-truth">
        <div className="blue"><b>BLUE · Ground truth</b>{state.bluePlayerOrder.map((rosterIndex,slot)=><div key={slot}><span>P{slot+1}</span><strong>{state.bluePlayers[rosterIndex]}</strong><small>roster #{rosterIndex+1}</small></div>)}</div>
        <div className="red"><b>RED · Ground truth</b>{state.redPlayerOrder.map((rosterIndex,slot)=><div key={slot}><span>P{slot+1}</span><strong>{state.redPlayers[rosterIndex]}</strong><small>roster #{rosterIndex+1}</small></div>)}</div>
      </div>
      <div className={'sim-test-result '+(state.playerOrderTestCompletedAt?'success':'')}>
        <strong>{!state.playerOrderTestStartedAt?'等待 START':state.playerOrderTestCompletedAt?'✓ Control 顺序已完全同步':'识别计时中…'}</strong>
        <span>{playerElapsed===null?'—':(playerElapsed/1000).toFixed(3)+' s'}</span>
        <small>{controlRosterMatches?'测试名单一致':'Control 名单尚未同步'} · {playerOrderMatched?'P1–P5 匹配':'等待 P1–P5'}</small>
      </div>
      {state.playerProfile==='ja'&&<p className="sim-control-note">默认 Player OCR 为 eng + chi_sim。日文用于扩展压力测试；配置 HOK_OCR_MODEL_DIR / HOK_OCR_LANGUAGES 的 jpn traineddata 后再把它当作正式通过项。</p>}
    </section>}

    <section className="sim-control-panel">
      <h2>比赛与阶段</h2>
      <p className="sim-control-note">{snapshot?'已连接 Control，随机选角遵循当前比赛 BP 历史与元流之子规则。':'未连接 Control，按普通 BP 规则模拟。'}</p>
      <button disabled={!snapshot} onClick={()=>{if(snapshot) update(current=>randomize({...current,mode:rules.draftMode,firstPickSide:rules.firstPickSide,phaseIndex:0,locked:[],emptyBans:[],autoPlay:false},[...simulatorAllSlotKeys]));}}>读取 Control 模式并重置模拟</button>
      {ruleError&&<p role="alert">{ruleError}</p>}
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
        <button onClick={()=>update(current=>current.autoPlay?{...current,autoPlay:false}:randomize(current,simulatorAllSlotKeys.filter(key=>!current.locked.includes(key)),true))} className={state.autoPlay?'active':''}>{state.autoPlay?'暂停自动脚本':'启动自动脚本'}</button>
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

    {state.testMode==='lineup'&&<section className="sim-control-panel">
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
      <p className="sim-control-note">交换只改变模拟画面的最终玩家槽英雄，不直接写 Control；若 Control 已完成 BP 且正在采集 Simulator，现有换英雄识别会自动同步。</p>
      <div className={'sim-test-result '+(swapCompletedAt?'success':'')}>
        <strong>{!swapStartedAt?'等待交换':swapCompletedAt?'✓ Control assignments 已同步':'等待 Control 识别换英雄…'}</strong>
        <span>{swapElapsed===null?'—':(swapElapsed/1000).toFixed(3)+' s'}</span>
        <small>{snapshot?.state.draftComplete?'Control BP 已完成':'Control 尚未完成 BP'} · {swapMatched?'英雄归属一致':'等待匹配'}</small>
      </div>
    </section>}

    <section className="sim-control-panel">
      <h2>10 个 Pick 槽实时状态</h2>
      <div className="sim-roster-editors">
        <div>{[0,1,2,3,4].map(index=>renderPickEditor('blue',index))}</div>
        <div>{[0,1,2,3,4].map(index=>renderPickEditor('red',index))}</div>
      </div>
    </section>
  </main>;
}
