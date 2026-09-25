import { useCallback, useEffect, useRef, useState } from 'react';
import heroes from '../components/HeroList';
import { detectEmptyBan, type EmptyBanStability } from './emptyBanDetection';
import {
  defaultNormalizedCaptureRegion,
  normalizeCaptureRegion,
  regionFromDrag,
  regionToPixels,
  type NormalizedCaptureRegion,
} from './windowCaptureGeometry';
import { phaseName } from '../shared/display';
import { translator } from '../shared/i18n';
import { phases, type Action, type MatchState } from '../shared/types';

type CaptureResult = {
  kind: 'hero' | 'empty-ban';
  candidates: { heroId:number; confidence:number }[];
  preview: string;
  at: number;
};

type CaptureMode = 'window' | 'native';

type WindowInfo = {
  label:string;
  surface:string;
  width:number;
  height:number;
};

const freshStability = (): EmptyBanStability => ({ phaseKey:'', fingerprint:'', count:0 });
const nativeDefault = {x:0,y:0,width:100,height:100};

function readNormalizedRegion() {
  try {
    const value=JSON.parse(localStorage.getItem('hok-window-capture-roi')||'null');
    if(value&&typeof value==='object') return normalizeCaptureRegion(value);
  } catch { /* use default */ }
  return defaultNormalizedCaptureRegion;
}

function pointInElement(event:React.PointerEvent<HTMLElement>) {
  const rect=event.currentTarget.getBoundingClientRect();
  return {
    x:Math.min(1,Math.max(0,(event.clientX-rect.left)/Math.max(rect.width,1))),
    y:Math.min(1,Math.max(0,(event.clientY-rect.top)/Math.max(rect.height,1))),
  };
}

export function ScreenInput({ state, revision, token, disabled, send }: { state:MatchState; revision:number; token:string; disabled:boolean; send:(action:Action)=>void }) {
  const zh = state.language === 'zh';
  const t = translator(state.language);
  const [captureMode,setCaptureMode]=useState<CaptureMode>(()=>{
    const saved=localStorage.getItem('hok-capture-mode');
    return saved==='native'?'native':'window';
  });
  const [nativeRegion,setNativeRegion]=useState(()=>{
    try { return JSON.parse(localStorage.getItem('hok-capture-region')||'null')||nativeDefault; } catch { return nativeDefault; }
  });
  const [roi,setRoi]=useState<NormalizedCaptureRegion>(readNormalizedRegion);
  const [autoWatch,setAutoWatch]=useState(()=>localStorage.getItem('hok-capture-auto-watch')==='1');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [result,setResult]=useState<CaptureResult>();
  const [selected,setSelected]=useState(0);
  const [windowInfo,setWindowInfo]=useState<WindowInfo>();
  const [calibrating,setCalibrating]=useState(false);
  const [videoReady,setVideoReady]=useState(false);

  const dialog=useRef<HTMLDialogElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const streamRef=useRef<MediaStream>();
  const mounted=useRef(true);
  const busyRef=useRef(false);
  const dragStart=useRef<{x:number;y:number}|null>(null);
  const stability=useRef<EmptyBanStability>(freshStability());
  const phase=phases(state.draftMode,state.firstPickSide)[state.currentPhase];
  const phaseKey=`${state.draftGameNumber ?? state.gameNumber}:${state.currentPhase}:${phase?.team ?? 'done'}:${phase?.action ?? 'done'}`;

  const stopWindowCapture=useCallback(()=>{
    const stream=streamRef.current;
    streamRef.current=undefined;
    if(stream) stream.getTracks().forEach(track=>track.stop());
    if(videoRef.current) videoRef.current.srcObject=null;
    setVideoReady(false);
    setWindowInfo(undefined);
    setCalibrating(false);
  },[]);

  useEffect(()=>{
    mounted.current=true;
    return()=>{
      mounted.current=false;
      const stream=streamRef.current;
      if(stream) stream.getTracks().forEach(track=>track.stop());
    };
  },[]);

  useEffect(()=>{
    stability.current=freshStability();
    setResult(undefined);
    setMessage('');
  },[phaseKey]);

  useEffect(()=>{
    if(!result||!dialog.current||dialog.current.open) return;
    dialog.current.showModal();
  },[result]);

  const connectWindow=useCallback(async()=>{
    if(!navigator.mediaDevices?.getDisplayMedia){
      setMessage(t('windowCaptureUnsupported'));
      return;
    }
    try{
      stopWindowCapture();
      setMessage('');
      const stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
      if(!mounted.current){
        stream.getTracks().forEach(track=>track.stop());
        return;
      }
      streamRef.current=stream;
      const video=videoRef.current;
      if(!video) throw new Error('Preview unavailable');
      video.srcObject=stream;
      video.muted=true;
      await video.play();
      if(video.readyState<1){
        await new Promise<void>((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new Error('Capture metadata timeout')),5000);
          video.addEventListener('loadedmetadata',()=>{clearTimeout(timer);resolve();},{once:true});
        });
      }
      const track=stream.getVideoTracks()[0];
      const settings=track.getSettings();
      const refreshInfo=()=>setWindowInfo({
        label:track.label||t('windowCaptureConnected'),
        surface:String(settings.displaySurface||'window'),
        width:video.videoWidth||settings.width||0,
        height:video.videoHeight||settings.height||0,
      });
      refreshInfo();
      setVideoReady(true);
      track.addEventListener('ended',()=>{
        if(!mounted.current) return;
        streamRef.current=undefined;
        setVideoReady(false);
        setWindowInfo(undefined);
        setCalibrating(false);
        setMessage(t('windowCaptureEnded'));
      },{once:true});
      setMessage(t('windowCaptureConnected'));
    }catch(error){
      stopWindowCapture();
      if(!mounted.current) return;
      const denied=error instanceof DOMException&&['NotAllowedError','AbortError'].includes(error.name);
      setMessage(denied?t('windowCaptureCancelled'):t('windowCaptureFailed'));
    }
  },[stopWindowCapture,t]);

  const captureWindowFrame=useCallback(()=>{
    const video=videoRef.current;
    if(!videoReady||!video||!video.videoWidth||!video.videoHeight) throw new Error(t('windowCaptureNotConnected'));
    const pixels=regionToPixels(roi,video.videoWidth,video.videoHeight);
    const maxSide=640;
    const scale=Math.min(1,maxSide/Math.max(pixels.width,pixels.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(32,Math.round(pixels.width*scale));
    canvas.height=Math.max(32,Math.round(pixels.height*scale));
    const context=canvas.getContext('2d');
    if(!context) throw new Error('Canvas unavailable');
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.drawImage(
      video,
      pixels.x,pixels.y,pixels.width,pixels.height,
      0,0,canvas.width,canvas.height,
    );
    return canvas.toDataURL('image/jpeg',.88);
  },[roi,t,videoReady]);

  const capture=useCallback(async()=>{
    if(busyRef.current||disabled||!phase||state.committedGameId) return;
    busyRef.current=true;
    setBusy(true);
    setMessage('');
    try{
      let data:any;
      if(captureMode==='window'){
        const image=captureWindowFrame();
        const response=await fetch('/api/recognize-frame',{
          method:'POST',
          headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({image,revision}),
          signal:AbortSignal.timeout(25000),
        });
        data=await response.json();
        if(!response.ok) throw new Error(t('windowCaptureRecognitionFailed'));
      }else{
        localStorage.setItem('hok-capture-region',JSON.stringify(nativeRegion));
        const response=await fetch('/api/capture',{
          method:'POST',
          headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({region:nativeRegion,revision}),
          signal:AbortSignal.timeout(25000),
        });
        data=await response.json();
        if(!response.ok) throw new Error(zh?'识别不可用：请使用 Windows 本机控制台、启用采集并检查区域。可继续手动选择。':'Capture unavailable: use the enabled Windows local console and check the region. Manual selection remains available.');
      }
      if(!mounted.current) return;

      const top=data.candidates?.[0] as {heroId:number;confidence:number}|undefined;
      const empty=detectEmptyBan(stability.current,{
        phaseKey,
        isBan:phase.action==='ban',
        fingerprint:data.fingerprint,
        topConfidence:top?.confidence,
      });
      stability.current=empty.stability;

      if(top&&top.confidence>=.55){
        setSelected(top.heroId);
        setResult({kind:'hero',candidates:data.candidates,preview:data.preview,at:Date.now()});
        return;
      }
      if(empty.suspected){
        setResult({kind:'empty-ban',candidates:data.candidates||[],preview:data.preview,at:Date.now()});
        setMessage(t('emptyBanSuspected',{count:3}));
        return;
      }
      if(phase.action==='ban'&&(top?.confidence??0)<.35){
        setMessage(t('emptyBanSuspected',{count:empty.stability.count}));
      }else{
        setMessage(zh?'没有可靠候选；自动监视会继续读取，或可直接手动选择。':'No reliable candidate yet. Auto-watch will keep reading, or select manually.');
      }
    }catch(error){
      if(mounted.current) setMessage(error instanceof Error?error.message:'Capture failed');
    }finally{
      busyRef.current=false;
      if(mounted.current) setBusy(false);
    }
  },[captureMode,captureWindowFrame,disabled,nativeRegion,phase,phaseKey,revision,state.committedGameId,t,token,zh]);

  useEffect(()=>{
    if(!autoWatch||result||disabled||!phase||state.committedGameId) return;
    if(captureMode==='window'&&!videoReady) return;
    const timer=setTimeout(()=>{void capture();},busy?800:1400);
    return()=>clearTimeout(timer);
  },[autoWatch,busy,capture,captureMode,disabled,phase,result,state.committedGameId,videoReady]);

  const setMode=(mode:CaptureMode)=>{
    setCaptureMode(mode);
    localStorage.setItem('hok-capture-mode',mode);
    stability.current=freshStability();
    setResult(undefined);
    setMessage('');
  };

  const pointerDown=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!calibrating||!videoReady) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start=pointInElement(event);
    dragStart.current=start;
    setRoi({...start,width:.02,height:.02});
  };
  const pointerMove=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!calibrating||!dragStart.current) return;
    setRoi(regionFromDrag(dragStart.current,pointInElement(event)));
  };
  const pointerUp=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!calibrating||!dragStart.current) return;
    const next=regionFromDrag(dragStart.current,pointInElement(event));
    dragStart.current=null;
    setRoi(next);
    localStorage.setItem('hok-window-capture-roi',JSON.stringify(next));
    setCalibrating(false);
    setMessage(t('windowCaptureRegionSaved'));
  };

  const label=(id:number)=>{
    const hero=heroes.find(item=>item.id===id);
    return zh?hero?.chineseName:hero?.englishName;
  };
  const closeReview=()=>{
    if(dialog.current?.open) dialog.current.close();
    setResult(undefined);
  };
  const submitReview=()=>{
    if(!phase||disabled||!result) return;
    if(Date.now()-result.at>30000){
      closeReview();
      setMessage(zh?'结果已过期，请重新读取。':'Result expired. Capture again.');
      return;
    }
    closeReview();
    if(result.kind==='empty-ban') send({type:'skip_ban',team:phase.team});
    else send({type:'draft_action',heroId:selected,team:phase.team,action:phase.action});
  };

  const roiStyle={
    left:`${roi.x*100}%`,
    top:`${roi.y*100}%`,
    width:`${roi.width*100}%`,
    height:`${roi.height*100}%`,
  };

  return <section className="panel screen-input">
    <div className="screen-input-heading">
      <div>
        <h2>{zh?'自动 BP · 屏幕识别':'Auto BP · screen recognition'}</h2>
        <p>{zh?'推荐直接连接游戏窗口，不再填写桌面像素坐标。英雄候选与空 Ban 仍保留人工审核。':'Connect the game window directly instead of entering desktop pixel coordinates. Hero candidates and empty bans still use human review.'}</p>
      </div>
      <div className="capture-mode-switch" role="group" aria-label={t('captureSource')}>
        <button type="button" className={captureMode==='window'?'selected':''} onClick={()=>setMode('window')}>{t('windowCaptureMode')}</button>
        <button type="button" className={captureMode==='native'?'selected':''} onClick={()=>setMode('native')}>{t('nativeCaptureMode')}</button>
      </div>
    </div>

    {captureMode==='window'?<div className="window-capture">
      <div className="window-capture-toolbar">
        <button type="button" className="primary" disabled={disabled} onClick={()=>void connectWindow()}>{videoReady?t('windowCaptureChange'):t('windowCaptureChoose')}</button>
        {videoReady&&<button type="button" onClick={stopWindowCapture}>{t('windowCaptureDisconnect')}</button>}
        <span className={videoReady?'window-capture-status connected':'window-capture-status'}>{videoReady?'●':'○'} {windowInfo?.label||t('windowCaptureDisconnected')}</span>
      </div>

      <div
        className={`window-capture-preview ${videoReady?'ready':''} ${calibrating?'calibrating':''}`}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={()=>{dragStart.current=null;}}
      >
        <video ref={videoRef} playsInline muted />
        {videoReady&&<div className="capture-roi" style={roiStyle}><span>{t('windowCaptureRecognitionArea')}</span></div>}
        {!videoReady&&<div className="window-capture-placeholder">{t('windowCaptureChooseHint')}</div>}
      </div>

      <div className="window-capture-calibration">
        <button type="button" disabled={!videoReady} className={calibrating?'selected':''} onClick={()=>setCalibrating(value=>!value)}>{calibrating?t('windowCaptureDragNow'):t('windowCaptureCalibrate')}</button>
        <button type="button" disabled={!videoReady} onClick={()=>{
          const next=defaultNormalizedCaptureRegion;
          setRoi(next);
          localStorage.setItem('hok-window-capture-roi',JSON.stringify(next));
        }}>{t('windowCaptureResetArea')}</button>
        <span className="muted">{videoReady&&windowInfo?`${windowInfo.width}×${windowInfo.height} · ${windowInfo.surface}`:t('windowCaptureRelativeHint')}</span>
      </div>
      <p className="muted">{t('windowCaptureRelativeHint')}</p>
    </div>:<details className="native-capture-settings" open>
      <summary>{t('nativeCaptureAdvanced')}</summary>
      <p className="muted">{t('nativeCaptureHint')}</p>
      <div className="capture-region">{(['x','y','width','height'] as const).map(key=><label key={key}>{key}<input type="number" value={nativeRegion[key]} onChange={event=>setNativeRegion({...nativeRegion,[key]:Number(event.target.value)})}/></label>)}</div>
    </details>}

    <p className="screen-input-phase">{phaseName(state)}</p>
    <div className="screen-input-actions">
      <button disabled={disabled||busy||!phase||!!state.committedGameId||(captureMode==='window'&&!videoReady)} onClick={()=>void capture()}>{busy?(zh?'正在识别…':'Recognizing…'):t('captureNow')}</button>
      {phase?.action==='ban'&&<button className="empty-ban-button" disabled={disabled||!!state.committedGameId} onClick={()=>send({type:'skip_ban',team:phase.team})}>{t('emptyBanButton')}</button>}
      <label className="auto-watch-toggle"><input type="checkbox" checked={autoWatch} onChange={event=>{
        setAutoWatch(event.target.checked);
        localStorage.setItem('hok-capture-auto-watch',event.target.checked?'1':'0');
      }}/>{t('autoCaptureWatch')}</label>
    </div>
    <small>{captureMode==='window'?t('windowCaptureAutoHint'):t('autoCaptureWatchHint')}</small>
    <p role="status">{message}</p>

    {result&&<dialog ref={dialog} className="library-dialog capture-review" aria-label={result.kind==='empty-ban'?t('emptyBanReviewTitle'):(zh?'确认识别结果':'Review recognition')} onCancel={event=>{event.preventDefault();closeReview();}}>
      {result.kind==='empty-ban'?<>
        <h2>{t('emptyBanReviewTitle')}</h2>
        <p>{t('emptyBanReviewHint')}</p>
      </>:<>
        <h2>{zh?'识别到：':'Recognized: '}{label(selected)}</h2>
        <label>{zh?'候选英雄（相似度，不代表准确率）':'Candidates (similarity, not accuracy)'}<select value={selected} onChange={event=>setSelected(Number(event.target.value))}>{result.candidates.map(candidate=><option key={candidate.heroId} value={candidate.heroId}>{label(candidate.heroId)} · {Math.round(candidate.confidence*100)}%</option>)}</select></label>
      </>}
      <p>{phaseName(state)}</p>
      <img src={result.preview} alt={zh?'截取区域':'Captured region'}/>
      <div className="capture-review-actions">
        <button disabled={disabled||!phase} onClick={submitReview}>{result.kind==='empty-ban'?t('emptyBanConfirm'):(zh?'确认并提交':'Confirm and submit')}</button>
        <button onClick={closeReview}>{zh?'拒绝 / 手动选择':'Reject / select manually'}</button>
      </div>
    </dialog>}
  </section>;
}
