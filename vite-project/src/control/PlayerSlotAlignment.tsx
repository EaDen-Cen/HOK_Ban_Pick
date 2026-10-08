import { useEffect, useRef, useState } from 'react';
import type { Action, MatchState, Side } from '../shared/types';
import { playerAtSlot, type PlayerSlotSolution } from '../shared/playerSlots';
import { defaultCaptureSlots, normalizeCaptureSlots, type CaptureSlots, type CaptureSlotKey } from './bpCaptureLayout';
import { regionToPixels, type NormalizedCaptureRegion } from './windowCaptureGeometry';
import { getSharedWindowCaptureStream, subscribeSharedWindowCapture } from './sharedWindowCapture';
const storage='hok-window-capture-slots-v3';
function readSlots(): CaptureSlots {try{return normalizeCaptureSlots(JSON.parse(localStorage.getItem(storage)||'null')??defaultCaptureSlots);}catch{return normalizeCaptureSlots(defaultCaptureSlots);}}
function idRegion(slots: CaptureSlots, side: Side, index: number): NormalizedCaptureRegion {
  const key=`${side}${index+1}`;
  if(slots.playerIds?.[key]) return slots.playerIds[key];
  const pick=slots[`${side}Pick${index+1}` as CaptureSlotKey];
  const width=Math.min(.18,1-pick.x-pick.width);
  return {x:side==='blue'?pick.x+pick.width:Math.max(0,pick.x-.18),y:pick.y+pick.height*.65,width:side==='blue'?Math.max(.02,width):.18,height:Math.max(.02,pick.height*.3)};
}
interface Scan { texts:string[]; blue?:PlayerSlotSolution; red?:PlayerSlotSolution; elapsedMs:number }
export function PlayerSlotAlignment({state,token,disabled,send}:{state:MatchState;token:string;disabled:boolean;send:(action:Action)=>void}) {
  const zh=state.language==='zh';
  const [ready,setReady]=useState(false), [status,setStatus]=useState(''), [scan,setScan]=useState<Scan>(), [busy,setBusy]=useState(false);
  const [auto,setAuto]=useState(()=>localStorage.getItem('hok-player-slot-auto')!=='0');
  const [slots,setSlots]=useState(readSlots), [selected,setSelected]=useState('blue1'), [preview,setPreview]=useState(''), [calibrationOpen,setCalibrationOpen]=useState(false);
  const video=useRef<HTMLVideoElement>(null), latest=useRef({state,disabled,send}), inFlight=useRef(false), generation=useRef(0);
  const accepted=useRef<Partial<Record<Side,string>>>({});
  latest.current={state,disabled,send};
  const context=JSON.stringify([state.blueTeam.players,state.redTeam.players,state.gameNumber]);
  const contextRef=useRef(context); contextRef.current=context;
  useEffect(()=>{accepted.current={};setScan(undefined);setStatus('');generation.current++;},[context,state.committedGameId]);
  useEffect(()=>{
    const refresh=()=>setSlots(readSlots());
    window.addEventListener('hok-capture-slots-changed',refresh);
    return()=>window.removeEventListener('hok-capture-slots-changed',refresh);
  },[]);
  useEffect(()=>{
    let active=true;
    const attach=async(stream:MediaStream|undefined)=>{
      if(!video.current) return;
      video.current.srcObject=stream??null;setReady(false);
      if(stream) try {await video.current.play();if(active)setReady(true);} catch { /* capture not ready */ }
    };
    void attach(getSharedWindowCaptureStream());
    const unsubscribe=subscribeSharedWindowCapture(stream=>void attach(stream));
    return()=>{active=false;unsubscribe();};
  },[]);
  function apply(side:Side,solution:PlayerSlotSolution) {
    const current=latest.current;
    if(current.disabled||current.state.committedGameId) return;
    current.send({type:'set_player_slot_order',side,order:solution.order,expectedPlayers:[...current.state[`${side}Team`].players]});
  }
  useEffect(()=>{
    if(state.bpInputMode!=='screen'||state.committedGameId) return;
    let active=true;
    const api=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
    const headers={Authorization:`Bearer ${token}`};
    async function run() {
      const current=latest.current;
      if(inFlight.current || (accepted.current.blue && accepted.current.red)) return;
      inFlight.current=true;
      const epoch=generation.current;
      try {
        const health=await fetch(`${api}/api/v1/recognition/players`,{headers}).then(r=>r.json());
        if(!active)return;
        if(health.status!=='ready'){setStatus(zh?`选手 OCR 未就绪：${health.error||health.status}`:`Player OCR not ready: ${health.error||health.status}`);return;}
        if(!auto||!ready||current.disabled||current.state.committedGameId||!video.current?.videoWidth) return;
        // A single captured frame feeds all ten crops; OCR runs independently of Auto BP.
        const source=video.current, frame=document.createElement('canvas');
        frame.width=source.videoWidth;frame.height=source.videoHeight;
        frame.getContext('2d')!.drawImage(source,0,0);
        const regions=readSlots();
        const capturedContext=contextRef.current;
        const images=(['blue','red'] as const).flatMap(side=>Array.from({length:5},(_,index)=>{
          const pixels=regionToPixels(idRegion(regions,side,index),frame.width,frame.height);
          const crop=document.createElement('canvas');crop.width=Math.min(640,pixels.width*2);crop.height=Math.min(128,pixels.height*2);
          crop.getContext('2d')!.drawImage(frame,pixels.x,pixels.y,pixels.width,pixels.height,0,0,crop.width,crop.height);
          return crop.toDataURL('image/png');
        }));
        setBusy(true);setStatus(zh?'选手顺序识别中…':'Recognizing player order…');
        const response=await fetch(`${api}/api/v1/recognition/players`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({images,players:[current.state.blueTeam.players,current.state.redTeam.players],gameNumber:current.state.gameNumber}),signal:AbortSignal.timeout(8000)});
        const result=await response.json();
        if(!active||epoch!==generation.current||capturedContext!==contextRef.current)return;
        if(!response.ok)throw new Error(result.error);
        setScan(result);
        setStatus(zh?`本地识别 ${Math.round(result.elapsedMs)} ms；歧义槽位保留原顺序。`:`Local OCR ${Math.round(result.elapsedMs)} ms; ambiguous slots keep their current order.`);
      } catch(error){if(active)setStatus(error instanceof Error?error.message:'OCR failed');}
      finally {inFlight.current=false;if(active)setBusy(false);}
    }
    const timer=setInterval(()=>void run(),450);void run();
    return()=>{active=false;clearInterval(timer);};
  },[auto,ready,state.bpInputMode,state.committedGameId,token,zh]);
  // Reuse a scan after BP acknowledgement; never send two actions into the single pending WS slot.
  useEffect(()=>{
    if(!auto||disabled||!scan||state.committedGameId) return;
    for(const side of ['blue','red'] as const){
      const solution=scan[side];if(!solution?.automatic)continue;
      const signature=solution.order.join(',');
      if(state[`${side}PlayerSlotOrder`].join(',')===signature){accepted.current[side]=signature;continue;}
      if(accepted.current[side]===signature)continue;
      apply(side,solution);break;
    }
  },[auto,disabled,scan,state]);
  const region=idRegion(slots,selected.startsWith('blue')?'blue':'red',Number(selected.slice(-1))-1);
  useEffect(()=>{
    if(!calibrationOpen||!ready)return;
    const render=()=>{if(!video.current?.videoWidth)return;const source=video.current,cropRegion=idRegion(slots,selected.startsWith('blue')?'blue':'red',Number(selected.slice(-1))-1),pixels=regionToPixels(cropRegion,source.videoWidth,source.videoHeight),canvas=document.createElement('canvas');canvas.width=Math.min(640,pixels.width*2);canvas.height=Math.min(128,pixels.height*2);canvas.getContext('2d')!.drawImage(source,pixels.x,pixels.y,pixels.width,pixels.height,0,0,canvas.width,canvas.height);setPreview(canvas.toDataURL('image/png'));};
    render();const timer=setInterval(render,500);return()=>clearInterval(timer);
  },[calibrationOpen,ready,slots,selected]);
  return <section className="panel player-slot-alignment">
    <video className="lineup-capture-video" ref={video} muted playsInline />
    <div className="toolbar"><strong>{zh?'选手顺序 / P1–P5':'Player order / P1–P5'}</strong>
      {state.bpInputMode==='screen'&&<label><input type="checkbox" checked={auto} onChange={e=>{setAuto(e.target.checked);localStorage.setItem('hok-player-slot-auto',e.target.checked?'1':'0');}} />{zh?'自动识别':'Auto align'}</label>}
    </div>
    <p role="status">{state.bpInputMode==='screen'?(status||(ready?(zh?'等待本地 OCR…':'Waiting for local OCR…'):(zh?'等待 Auto BP 连接采集窗口':'Waiting for Auto BP capture'))):(zh?'按游戏画面从上到下设置顺序':'Set players in screen order, top to bottom')}</p>
    <div className="lineup-team-grid">{(['blue','red'] as const).map(side=><div key={side}>
      <b>{state[`${side}Team`].name} · {scan?.[side]?.automatic?(zh?'识别已确认':'Recognized'):(zh?'当前顺序':'Current order')}</b>
      {state[`${side}PlayerSlotOrder`].map((roster,index)=><div className="lineup-player-row" key={index}>
        <span>P{index+1}</span><select aria-label={`${side} P${index+1} player`} value={roster} disabled={disabled||!!state.committedGameId} onChange={e=>{
          const order=[...state[`${side}PlayerSlotOrder`]], other=order.indexOf(Number(e.target.value));
          [order[index],order[other]]=[order[other],order[index]];
          setAuto(false);localStorage.setItem('hok-player-slot-auto','0');
          send({type:'set_player_slot_order',side,order,expectedPlayers:[...state[`${side}Team`].players]});
        }}>{state[`${side}Team`].players.map((name,i)=><option key={i} value={i}>{name||`${zh?'选手':'Player'} ${i+1}`}</option>)}</select>
        <span className={scan?.[side]?.anomalies.includes(index)?'error':'muted'} title={scan?.texts[(side==='blue'?0:5)+index]}>{scan?.[side]?`${Math.round(scan[side]!.confidence[index]*100)}%`:'—'}</span>
      </div>)}
      {scan?.[side]&&!scan[side]!.automatic&&<button disabled={disabled||!!state.committedGameId||busy} onClick={()=>apply(side,scan[side]!)}>{zh?'采用建议顺序':'Use suggested order'}</button>}
      <small>{Array.from({length:5},(_,i)=>playerAtSlot(state,side,i).id||'—').join(' → ')}</small>
    </div>)}</div>
    {state.bpInputMode==='screen'&&<details onToggle={e=>setCalibrationOpen(e.currentTarget.open)}><summary>{zh?'选手 ID 区域校准':'Player ID region calibration'}</summary>
      <p className="muted">{zh?'文字区域默认位于 Pick 头像旁；按源画面百分比微调。随 BP 区域预设保存。':'ID regions default next to pick portraits. Adjust source percentages; saved with BP presets.'}</p>
      <select aria-label="Player ID region" value={selected} onChange={e=>setSelected(e.target.value)}>{(['blue','red'] as const).flatMap(side=>Array.from({length:5},(_,i)=><option key={`${side}${i+1}`} value={`${side}${i+1}`}>{side} P{i+1}</option>))}</select>
      {(['x','y','width','height'] as const).map(key=><label key={key}>{key} % <input type="number" min={0} max={100} step={.1} value={Math.round(region[key]*1000)/10} onChange={e=>{
        const next=readSlots();next.playerIds={...next.playerIds,[selected]:{...region,[key]:Number(e.target.value)/100}};
        const normalized=normalizeCaptureSlots(next);localStorage.setItem(storage,JSON.stringify(normalized));setSlots(normalized);
        window.dispatchEvent(new Event('hok-capture-slots-changed'));accepted.current={};setScan(undefined);generation.current++;
      }} /></label>)}
      {preview&&<img style={{maxWidth:'100%',imageRendering:'pixelated'}} src={preview} alt={zh?'实际选手 ID 裁剪':'Actual player ID crop'}/>}
      <button onClick={()=>{accepted.current={};setScan(undefined);generation.current++;}}>{zh?'重新识别':'Rescan'}</button>
    </details>}
  </section>;
}
