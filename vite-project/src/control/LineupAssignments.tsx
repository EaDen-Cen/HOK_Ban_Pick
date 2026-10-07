import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { heroForState } from '../shared/heroData';
import type { Action, MatchState, Side } from '../shared/types';
import {
  defaultCaptureSlots,
  normalizeCaptureSlots,
  type CaptureSlotKey,
  type CaptureSlots,
} from './bpCaptureLayout';
import { regionToPixels, type NormalizedCaptureRegion } from './windowCaptureGeometry';
import {
  getSharedWindowCaptureStream,
  setSharedWindowCaptureStream,
  subscribeSharedWindowCapture,
} from './sharedWindowCapture';

interface Candidate { heroId:number; confidence:number }
interface SlotResult {
  side: Side;
  playerIndex: number;
  preview: string;
  candidates: Candidate[];
}
interface SolvedTeam {
  heroes: number[];
  confidence: number[];
  average: number;
  minimum: number;
}

const SLOTS_STORAGE='hok-window-capture-slots-v3';

function readCaptureSlots():CaptureSlots {
  try {
    const stored=JSON.parse(localStorage.getItem(SLOTS_STORAGE)||'null');
    if(stored&&typeof stored==='object') return normalizeCaptureSlots(stored);
  } catch { /* use defaults */ }
  return normalizeCaptureSlots(defaultCaptureSlots);
}

function permutations(values:number[]):number[][] {
  if(values.length<=1) return [values];
  return values.flatMap((value,index)=>
    permutations([...values.slice(0,index),...values.slice(index+1)]).map(rest=>[value,...rest]));
}

function solveTeam(slots:SlotResult[],picks:number[]):SolvedTeam|undefined {
  if(slots.length!==5||picks.length!==5) return;
  let best:SolvedTeam|undefined;
  for(const order of permutations(picks)) {
    const confidence=order.map((heroId,index)=>
      slots[index].candidates.find(candidate=>candidate.heroId===heroId)?.confidence ?? -1);
    if(confidence.some(value=>value<0)) continue;
    const average=confidence.reduce((sum,value)=>sum+value,0)/confidence.length;
    const minimum=Math.min(...confidence);
    if(!best||average>best.average) best={heroes:order,confidence,average,minimum};
  }
  return best;
}

function sameLineup(a:Array<number|null>,b:number[]) {
  return a.length===b.length&&a.every((value,index)=>value===b[index]);
}

function label(state:MatchState,id:number|null|undefined) {
  if(!id) return '—';
  const hero=heroForState(state,id);
  return state.language==='zh'?hero?.chineseName??'—':hero?.englishName??'—';
}

function pickKey(side:Side,index:number) {
  return `${side}Pick${index+1}` as CaptureSlotKey;
}

function captureFrame(video:HTMLVideoElement,region:NormalizedCaptureRegion) {
  const pixels=regionToPixels(region,video.videoWidth,video.videoHeight);
  const maxSide=384;
  const scale=Math.min(1,maxSide/Math.max(pixels.width,pixels.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(32,Math.round(pixels.width*scale));
  canvas.height=Math.max(32,Math.round(pixels.height*scale));
  const context=canvas.getContext('2d');
  if(!context) throw new Error('Canvas unavailable');
  context.imageSmoothingEnabled=true;
  context.imageSmoothingQuality='high';
  context.drawImage(video,pixels.x,pixels.y,pixels.width,pixels.height,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/png');
}

export function LineupAssignments({
  state,revision,token,disabled,send,
}:{
  state:MatchState;
  revision:number;
  token:string;
  disabled:boolean;
  send:(action:Action)=>void;
}) {
  const zh=state.language==='zh';
  const [auto,setAuto]=useState(()=>localStorage.getItem('hok-lineup-auto')!=='0');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [results,setResults]=useState<SlotResult[]>([]);
  const [videoReady,setVideoReady]=useState(false);
  const [streamLabel,setStreamLabel]=useState('');
  const videoRef=useRef<HTMLVideoElement>(null);
  const streamRef=useRef<MediaStream>();
  const mounted=useRef(true);
  const applying=useRef('');
  const stableRef=useRef({signature:'',count:0});
  const busyRef=useRef(false);

  const slots=useMemo(()=>readCaptureSlots(),[state.draftComplete]);
  const blueResults=results.filter(slot=>slot.side==='blue').sort((a,b)=>a.playerIndex-b.playerIndex);
  const redResults=results.filter(slot=>slot.side==='red').sort((a,b)=>a.playerIndex-b.playerIndex);
  const blueSolved=useMemo(()=>solveTeam(blueResults,state.bluePicks),[blueResults,state.bluePicks]);
  const redSolved=useMemo(()=>solveTeam(redResults,state.redPicks),[redResults,state.redPicks]);

  const attachStream=useCallback(async(stream:MediaStream|undefined)=>{
    streamRef.current=stream;
    const video=videoRef.current;
    if(!stream||!video){
      if(video) video.srcObject=null;
      setVideoReady(false);
      setStreamLabel('');
      return;
    }
    video.srcObject=stream;
    video.muted=true;
    try {
      await video.play();
      const track=stream.getVideoTracks()[0];
      setStreamLabel(track?.label||'BP window');
      setVideoReady(!!video.videoWidth&&!!video.videoHeight);
      if(video.readyState<1) {
        video.addEventListener('loadedmetadata',()=>{
          if(mounted.current) setVideoReady(true);
        },{once:true});
      }
    } catch {
      setVideoReady(false);
    }
  },[]);

  useEffect(()=>{
    mounted.current=true;
    void attachStream(getSharedWindowCaptureStream());
    const unsubscribe=subscribeSharedWindowCapture(stream=>{void attachStream(stream);});
    return()=>{
      mounted.current=false;
      unsubscribe();
    };
  },[attachStream]);

  const connectWindow=useCallback(async()=>{
    if(!navigator.mediaDevices?.getDisplayMedia) {
      setMessage(zh?'当前浏览器不支持窗口采集。':'Window capture is not supported by this browser.');
      return;
    }
    try {
      const stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
      if(!mounted.current){stream.getTracks().forEach(track=>track.stop());return;}
      setSharedWindowCaptureStream(stream);
      const track=stream.getVideoTracks()[0];
      track?.addEventListener('ended',()=>{
        if(getSharedWindowCaptureStream()===stream) setSharedWindowCaptureStream(undefined);
      },{once:true});
    } catch {
      setMessage(zh?'未连接 BP 窗口，换英雄仍可手动修改。':'BP window was not connected; hero swaps can still be adjusted manually.');
    }
  },[zh]);

  const applyLineups=useCallback((blue:number[],red:number[])=>{
    if(disabled||state.committedGameId) return;
    send({type:'set_lineup_assignments',blue,red});
  },[disabled,state.committedGameId,send]);

  const recognizeSlot=useCallback(async(side:Side,index:number)=>{
    const video=videoRef.current;
    if(!videoReady||!video||!video.videoWidth||!video.videoHeight) throw new Error(zh?'BP 窗口未连接。':'BP window is not connected.');
    const key=pickKey(side,index);
    const image=captureFrame(video,slots[key]);
    const response=await fetch('/api/recognize-frame',{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        image,
        revision,
        allowedHeroIds:state[`${side}Picks`],
        shape:'square',
      }),
      signal:AbortSignal.timeout(25000),
    });
    const data=await response.json();
    if(!response.ok) throw new Error(zh?'换英雄识别失败。':'Hero-swap recognition failed.');
    return {
      side,
      playerIndex:index,
      preview:data.preview as string,
      candidates:(data.candidates??[]) as Candidate[],
    } satisfies SlotResult;
  },[revision,slots,state,token,videoReady,zh]);

  const scan=useCallback(async()=>{
    if(busyRef.current||disabled||!state.draftComplete||state.committedGameId||state.bpInputMode!=='screen'||!videoReady) return;
    busyRef.current=true;
    setBusy(true);
    try {
      const scanned=await Promise.all((['blue','red'] as const).flatMap(side=>
        Array.from({length:5},(_,index)=>recognizeSlot(side,index))));
      if(!mounted.current) return;
      setResults(scanned);

      const blue=solveTeam(scanned.filter(slot=>slot.side==='blue').sort((a,b)=>a.playerIndex-b.playerIndex),state.bluePicks);
      const red=solveTeam(scanned.filter(slot=>slot.side==='red').sort((a,b)=>a.playerIndex-b.playerIndex),state.redPicks);
      if(!blue||!red){
        stableRef.current={signature:'',count:0};
        setMessage(zh?'暂时无法唯一确认 10 个英雄，继续监视。':'Could not uniquely resolve all ten heroes yet; continuing to watch.');
        return;
      }

      const signature=`${blue.heroes.join(',')}|${red.heroes.join(',')}`;
      const previous=stableRef.current;
      const count=previous.signature===signature?previous.count+1:1;
      stableRef.current={signature,count};
      const changed=!sameLineup(state.blueAssignments,blue.heroes)||!sameLineup(state.redAssignments,red.heroes);
      const highConfidence=blue.minimum>=.62&&red.minimum>=.62&&blue.average>=.75&&red.average>=.75;

      setMessage(zh
        ? `换英雄检测运行中 · 蓝均值 ${Math.round(blue.average*100)}% · 红均值 ${Math.round(red.average*100)}% · 稳定 ${count}/2${changed?' · 检测到阵容变化':''}`
        : `Hero-swap detection active · blue avg ${Math.round(blue.average*100)}% · red avg ${Math.round(red.average*100)}% · stable ${count}/2${changed?' · lineup change detected':''}`);

      if(auto&&changed&&highConfidence&&count>=2&&applying.current!==signature){
        applying.current=signature;
        applyLineups(blue.heroes,red.heroes);
      }
    } catch(error) {
      if(mounted.current) setMessage(error instanceof Error?error.message:'Capture failed');
    } finally {
      busyRef.current=false;
      if(mounted.current) setBusy(false);
    }
  },[applyLineups,auto,disabled,recognizeSlot,state,videoReady,zh]);

  useEffect(()=>{
    if(!auto||!videoReady||state.bpInputMode!=='screen'||!state.draftComplete||state.committedGameId||disabled) return;
    const timer=setInterval(()=>{void scan();},1000);
    void scan();
    return()=>clearInterval(timer);
  },[auto,disabled,scan,state.bpInputMode,state.committedGameId,state.draftComplete,videoReady]);

  const draftReady=state.draftComplete&&!state.committedGameId;

  const current=(side:Side)=>state[`${side}Assignments`] as Array<number|null>;
  const picked=(side:Side)=>state[`${side}Picks`];
  const change=(side:Side,index:number,heroId:number)=>{
    const blue=[...state.blueAssignments] as Array<number|null>;
    const red=[...state.redAssignments] as Array<number|null>;
    const assignments=side==='blue'?blue:red;
    const other=assignments.indexOf(heroId);
    if(other<0||assignments[index]===heroId) return;
    [assignments[index],assignments[other]]=[assignments[other],assignments[index]];
    if(blue.some(value=>value===null)||red.some(value=>value===null)) return;
    applyLineups(blue as number[],red as number[]);
  };
  const resultFor=(side:Side,index:number)=>results.find(result=>result.side===side&&result.playerIndex===index);

  return <section className="panel lineup-sync">
    <video ref={videoRef} className="lineup-capture-video" playsInline muted />
    {draftReady&&<>
    <div className="lineup-sync-head">
      <div>
        <h2>{zh?'最终阵容归属 / 换英雄检测':'Final lineup ownership / hero-swap detection'}</h2>
        <p className="muted">{zh?'Pick/Ban 历史保持不变；这里根据最终 10 个玩家槽位持续检测英雄互换。':'Pick/Ban history stays immutable; this continuously watches the ten final player slots for hero swaps.'}</p>
      </div>
      <button disabled={disabled} onClick={()=>applyLineups([...state.bluePicks],[...state.redPicks])}>{zh?'按选角顺序重置':'Reset to pick order'}</button>
    </div>

    <div className="lineup-team-grid">
      {(['blue','red'] as const).map(side=><section className={`lineup-team ${side}`} key={side}>
        <h3>{state[`${side}Team`].name}</h3>
        {state[`${side}Team`].players.map((player,index)=>{
          const detected=resultFor(side,index);
          const top=detected?.candidates[0];
          return <div className="lineup-player-row" key={index}>
            <span className="lineup-player-name">{player||`${zh?'选手':'Player'} ${index+1}`}</span>
            <select aria-label={`${player||`Player ${index+1}`} hero`} disabled={disabled} value={current(side)[index]??''} onChange={event=>change(side,index,Number(event.target.value))}>
              {picked(side).map(heroId=><option key={heroId} value={heroId}>{label(state,heroId)}</option>)}
            </select>
            <span className="lineup-detected">{top?`${label(state,top.heroId)} ${Math.round(top.confidence*100)}%`:'—'}</span>
          </div>;
        })}
      </section>)}
    </div>

    {state.bpInputMode==='screen'&&<div className="lineup-auto">
      <div className="lineup-auto-toolbar">
        <label><input type="checkbox" checked={auto} onChange={event=>{
          setAuto(event.target.checked);
          localStorage.setItem('hok-lineup-auto',event.target.checked?'1':'0');
        }} /> {zh?'自动检测并同步换英雄':'Automatically detect and sync hero swaps'}</label>
        {!videoReady&&<button disabled={disabled} onClick={()=>void connectWindow()}>{zh?'连接 BP 窗口':'Connect BP window'}</button>}
        <button disabled={disabled||busy||!videoReady} onClick={()=>void scan()}>{busy?(zh?'正在扫描…':'Scanning…'):(zh?'立即扫描 10 个 Pick 槽':'Scan all 10 Pick slots')}</button>
        {blueSolved&&redSolved&&<button disabled={disabled} onClick={()=>applyLineups(blueSolved.heroes,redSolved.heroes)}>{zh?'应用本次识别':'Apply this scan'}</button>}
      </div>
      <p role="status" className="lineup-status">
        {message||(videoReady
          ? (zh?`已复用 BP 屏幕采集：${streamLabel||'窗口'}。阵容变化连续稳定 2 次后自动更新。`:`Reusing BP capture: ${streamLabel||'window'}. A changed lineup auto-applies after 2 stable scans.`)
          : (zh?'尚未连接 BP 窗口。若上方 Auto BP 已连接，会自动复用同一采集流；否则可在这里连接。':'No BP window connected. The existing Auto BP stream is reused automatically, or connect one here.'))}
      </p>
      <p className="muted">{zh?'换英雄检测直接复用 Auto BP 的蓝/红 P1–P5 校准框，不再使用 Windows 物理坐标兼容模式。':'Hero-swap detection reuses the calibrated blue/red P1–P5 boxes from Auto BP; the old Windows physical-coordinate compatibility path is no longer used.'}</p>
    </div>}
    </>}
  </section>;
}
