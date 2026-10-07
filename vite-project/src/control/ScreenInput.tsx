import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { heroForState } from '../shared/heroData';
import {
  captureProbeForNextTurn,
  captureSlotKeys,
  captureTargetForState,
  captureTargetsForCurrentTurn,
  defaultCaptureSlots,
  normalizeCaptureSlots,
  slotMeta,
  slotsFromLegacyZones,
  type CaptureSlotKey,
  type CaptureSlots,
  type LegacyCaptureZones,
} from './bpCaptureLayout';
import { detectEmptyBan, EMPTY_BAN_GRACE_MS, fingerprintDistance, type EmptyBanStability } from './emptyBanDetection';
import { updateHeroRecognitionStability, type HeroRecognitionStability } from './heroRecognitionStability';
import { freshHeroLockStability, updateHeroLockStability, type HeroLockStability } from './heroLockDetection';
import { freshPickTurnDimState, updatePickTurnDimState, type PickTurnDimState } from './pickTurnDimDetection';
import { regionFromDrag, regionToPixels, type NormalizedCaptureRegion } from './windowCaptureGeometry';
import { nextCaptureSlotKey, nudgeCaptureRegion, type CalibrationDelta } from './precisionCalibration';
import { phaseName } from '../shared/display';
import { translator } from '../shared/i18n';
import { phases, type Action, type MatchState } from '../shared/types';

type HeroCandidate = { heroId:number; confidence:number };

type SingleCaptureResult = {
  kind: 'hero' | 'empty-ban';
  candidates: HeroCandidate[];
  preview: string;
  at: number;
};

type PickGroupCaptureResult = {
  kind: 'pick-group';
  team:'blue'|'red';
  entries:Array<{
    key:CaptureSlotKey;
    candidates:HeroCandidate[];
    preview:string;
  }>;
  at:number;
};

type CaptureResult = SingleCaptureResult | PickGroupCaptureResult;

type CaptureMode = 'window' | 'native';

type WindowInfo = {
  label:string;
  surface:string;
  width:number;
  height:number;
};

type RecognitionResponse = {
  candidates?: HeroCandidate[];
  preview:string;
  fingerprint?:string;
  lockFingerprint?:string;
  meanLuma?:number;
};

const freshEmptyStability = (): EmptyBanStability => ({ phaseKey:'', fingerprint:'', count:0 });
const freshHeroStability = (): HeroRecognitionStability => ({ phaseKey:'', heroId:null, count:0 });
const nativeDefault = {x:0,y:0,width:100,height:100};
const SLOTS_STORAGE='hok-window-capture-slots-v3';
const LEGACY_ZONES_STORAGE='hok-window-capture-zones-v2';

function readCaptureSlots() {
  try {
    const value=JSON.parse(localStorage.getItem(SLOTS_STORAGE)||'null');
    if(value&&typeof value==='object') return normalizeCaptureSlots(value);
  } catch { /* use migration/defaults */ }

  try {
    const legacy=JSON.parse(localStorage.getItem(LEGACY_ZONES_STORAGE)||'null') as LegacyCaptureZones|null;
    if(legacy&&typeof legacy==='object'&&legacy.bluePick&&legacy.redPick&&legacy.blueBan&&legacy.redBan) {
      return normalizeCaptureSlots(slotsFromLegacyZones(legacy));
    }
  } catch { /* use defaults */ }

  return normalizeCaptureSlots(defaultCaptureSlots);
}

function pointInElement(event:React.PointerEvent<HTMLElement>) {
  const rect=event.currentTarget.getBoundingClientRect();
  return {
    x:Math.min(1,Math.max(0,(event.clientX-rect.left)/Math.max(rect.width,1))),
    y:Math.min(1,Math.max(0,(event.clientY-rect.top)/Math.max(rect.height,1))),
  };
}

function percentageStyle(region:{x:number;y:number;width:number;height:number}) {
  return {
    left:`${region.x*100}%`,
    top:`${region.y*100}%`,
    width:`${region.width*100}%`,
    height:`${region.height*100}%`,
  };
}

export function ScreenInput({ state, revision, token, disabled, send }: { state:MatchState; revision:number; token:string; disabled:boolean; send:(action:Action)=>void }) {
  const zh=state.language==='zh';
  const t=translator(state.language);
  const [captureMode,setCaptureMode]=useState<CaptureMode>(()=>{
    const saved=localStorage.getItem('hok-capture-mode');
    return saved==='native'?'native':'window';
  });
  const [nativeRegion,setNativeRegion]=useState(()=>{
    try { return JSON.parse(localStorage.getItem('hok-capture-region')||'null')||nativeDefault; } catch { return nativeDefault; }
  });
  const [slots,setSlots]=useState<CaptureSlots>(readCaptureSlots);
  const [autoWatch,setAutoWatch]=useState(()=>localStorage.getItem('hok-capture-auto-watch')==='1');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [candidateStatus,setCandidateStatus]=useState('');
  const [result,setResult]=useState<CaptureResult>();
  const [selected,setSelected]=useState(0);
  const [groupSelected,setGroupSelected]=useState<Record<string,number>>({});
  const [windowInfo,setWindowInfo]=useState<WindowInfo>();
  const [calibratingSlot,setCalibratingSlot]=useState<CaptureSlotKey>();
  const [videoReady,setVideoReady]=useState(false);
  const [precisionMode,setPrecisionMode]=useState(false);
  const [calibrationZoom,setCalibrationZoom]=useState(2);
  const [calibrationPreview,setCalibrationPreview]=useState('');

  const dialog=useRef<HTMLDialogElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const precisionWorkspace=useRef<HTMLDivElement>(null);
  const streamRef=useRef<MediaStream>();
  const mounted=useRef(true);
  const busyRef=useRef(false);
  const dragStart=useRef<{x:number;y:number}|null>(null);
  const emptyStability=useRef<EmptyBanStability>(freshEmptyStability());
  const heroStability=useRef<HeroRecognitionStability>(freshHeroStability());
  const heroLockStability=useRef<HeroLockStability>(freshHeroLockStability());
  const pickSlotStability=useRef<Record<string,HeroRecognitionStability>>({});
  const nextTurnStability=useRef<HeroRecognitionStability>(freshHeroStability());
  const pickTurnDimState=useRef<PickTurnDimState>(freshPickTurnDimState());
  const phaseStartedAt=useRef(Date.now());
  const emptyPromptedPhase=useRef('');
  const lockBaseline=useRef<{phaseKey:string;fingerprint:string}>({phaseKey:'',fingerprint:''});

  const phase=phases(state.draftMode,state.firstPickSide)[state.currentPhase];
  const phaseKey=`${state.draftGameNumber ?? state.gameNumber}:${state.currentPhase}:${phase?.team ?? 'done'}:${phase?.action ?? 'done'}`;
  const target=useMemo(()=>captureTargetForState(state,slots),[state,slots]);
  const turnTargets=useMemo(()=>captureTargetsForCurrentTurn(state,slots),[state,slots]);
  const nextTurnProbe=useMemo(()=>captureProbeForNextTurn(state,slots),[state,slots]);
  const activeTargetKeys=useMemo(()=>new Set(turnTargets.map(item=>item.key)),[turnTargets]);

  const label=useCallback((id:number)=>{
    const hero=heroForState(state,id);
    return zh?hero?.chineseName??String(id):hero?.englishName??String(id);
  },[state,zh]);

  const captureSlotLabel=useCallback((key:CaptureSlotKey)=>{
    const meta=slotMeta(key);
    return t('captureExplicitSlot',{
      side:t(meta.side==='blue'?'blueSide':'redSide'),
      action:t(meta.action==='ban'?'banAction':'pickAction'),
      number:meta.index+1,
    });
  },[t]);

  const buildCalibrationPreview=useCallback((region:NormalizedCaptureRegion)=>{
    const video=videoRef.current;
    if(!videoReady||!video||!video.videoWidth||!video.videoHeight) return '';
    const pixels=regionToPixels(region,video.videoWidth,video.videoHeight);
    const maxSide=260;
    const scale=Math.min(1,maxSide/Math.max(pixels.width,pixels.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(pixels.width*scale));
    canvas.height=Math.max(1,Math.round(pixels.height*scale));
    const context=canvas.getContext('2d');
    if(!context) return '';
    context.imageSmoothingEnabled=false;
    context.drawImage(video,pixels.x,pixels.y,pixels.width,pixels.height,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/png');
  },[videoReady]);

  const persistCalibrationSlot=useCallback((key:CaptureSlotKey,region:NormalizedCaptureRegion)=>{
    const updated={...slots,[key]:region};
    setSlots(updated);
    localStorage.setItem(SLOTS_STORAGE,JSON.stringify(updated));
    setCalibrationPreview(buildCalibrationPreview(region));
    return updated;
  },[buildCalibrationPreview,slots]);

  const selectCalibrationSlot=useCallback((key:CaptureSlotKey)=>{
    setCalibratingSlot(key);
    setCalibrationPreview(buildCalibrationPreview(slots[key]));
  },[buildCalibrationPreview,slots]);

  const enterPrecisionCalibration=useCallback(async()=>{
    if(!videoReady) return;
    const key=calibratingSlot??target?.key??captureSlotKeys[0];
    selectCalibrationSlot(key);
    setCalibrationZoom(2);
    setPrecisionMode(true);
    try{
      const workspace=precisionWorkspace.current;
      if(workspace?.requestFullscreen&&document.fullscreenElement!==workspace) await workspace.requestFullscreen();
    }catch{
      // The fixed-position precision workspace still works when Fullscreen API is unavailable.
    }
  },[calibratingSlot,selectCalibrationSlot,target?.key,videoReady]);

  const exitPrecisionCalibration=useCallback(async()=>{
    setPrecisionMode(false);
    if(document.fullscreenElement===precisionWorkspace.current){
      try{ await document.exitFullscreen(); }catch{ /* already leaving fullscreen */ }
    }
  },[]);

  const adjustCalibration=useCallback((delta:CalibrationDelta)=>{
    const key=calibratingSlot;
    const video=videoRef.current;
    if(!key||!videoReady||!video?.videoWidth||!video.videoHeight) return;
    const region=nudgeCaptureRegion(slots[key],video.videoWidth,video.videoHeight,delta);
    persistCalibrationSlot(key,region);
  },[calibratingSlot,persistCalibrationSlot,slots,videoReady]);

  const moveCalibrationSelection=useCallback((direction:1|-1)=>{
    const current=calibratingSlot??target?.key??captureSlotKeys[0];
    selectCalibrationSlot(nextCaptureSlotKey(current,direction));
  },[calibratingSlot,selectCalibrationSlot,target?.key]);

  const stopWindowCapture=useCallback(()=>{
    const stream=streamRef.current;
    streamRef.current=undefined;
    if(stream) stream.getTracks().forEach(track=>track.stop());
    if(videoRef.current) videoRef.current.srcObject=null;
    setVideoReady(false);
    setWindowInfo(undefined);
    setCalibratingSlot(undefined);
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
    const preventZoomKeys=(event:KeyboardEvent)=>{
      if(!(event.ctrlKey||event.metaKey)) return;
      if(['+','=','-','0'].includes(event.key)) event.preventDefault();
    };
    const preventZoomWheel=(event:WheelEvent)=>{
      if(event.ctrlKey||event.metaKey) event.preventDefault();
    };
    window.addEventListener('keydown',preventZoomKeys,{capture:true});
    window.addEventListener('wheel',preventZoomWheel,{capture:true,passive:false});
    return()=>{
      window.removeEventListener('keydown',preventZoomKeys,{capture:true});
      window.removeEventListener('wheel',preventZoomWheel,{capture:true});
    };
  },[]);

  useEffect(()=>{
    const onFullscreenChange=()=>{
      if(document.fullscreenElement!==precisionWorkspace.current&&precisionMode) setPrecisionMode(false);
    };
    document.addEventListener('fullscreenchange',onFullscreenChange);
    return()=>document.removeEventListener('fullscreenchange',onFullscreenChange);
  },[precisionMode]);

  useEffect(()=>{
    if(!precisionMode) return;
    const onKeyDown=(event:KeyboardEvent)=>{
      const element=event.target;
      if(element instanceof HTMLInputElement||element instanceof HTMLSelectElement||element instanceof HTMLTextAreaElement) return;

      if(event.key==='Escape'){
        event.preventDefault();
        void exitPrecisionCalibration();
        return;
      }
      if(event.key==='Enter'){
        event.preventDefault();
        moveCalibrationSelection(1);
        return;
      }
      if(event.key==='['){
        event.preventDefault();
        moveCalibrationSelection(-1);
        return;
      }
      if(event.key===']'){
        event.preventDefault();
        moveCalibrationSelection(1);
        return;
      }
      if(event.key==='+'||event.key==='='){
        event.preventDefault();
        setCalibrationZoom(value=>Math.min(4,Math.round((value+.25)*100)/100));
        return;
      }
      if(event.key==='-'){
        event.preventDefault();
        setCalibrationZoom(value=>Math.max(1,Math.round((value-.25)*100)/100));
        return;
      }

      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if(event.shiftKey){
        if(event.key==='ArrowLeft') adjustCalibration({dw:-1});
        if(event.key==='ArrowRight') adjustCalibration({dw:1});
        if(event.key==='ArrowUp') adjustCalibration({dh:-1});
        if(event.key==='ArrowDown') adjustCalibration({dh:1});
      }else{
        if(event.key==='ArrowLeft') adjustCalibration({dx:-1});
        if(event.key==='ArrowRight') adjustCalibration({dx:1});
        if(event.key==='ArrowUp') adjustCalibration({dy:-1});
        if(event.key==='ArrowDown') adjustCalibration({dy:1});
      }
    };
    window.addEventListener('keydown',onKeyDown);
    return()=>window.removeEventListener('keydown',onKeyDown);
  },[adjustCalibration,exitPrecisionCalibration,moveCalibrationSelection,precisionMode]);


  useEffect(()=>{
    emptyStability.current=freshEmptyStability();
    heroStability.current=freshHeroStability();
    heroLockStability.current=freshHeroLockStability();
    pickSlotStability.current={};
    nextTurnStability.current=freshHeroStability();
    pickTurnDimState.current=freshPickTurnDimState();
    phaseStartedAt.current=Date.now();
    emptyPromptedPhase.current='';
    lockBaseline.current={phaseKey,fingerprint:''};
    setResult(undefined);
    setGroupSelected({});
    setMessage('');
    setCandidateStatus('');
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
      setWindowInfo({
        label:track.label||t('windowCaptureConnected'),
        surface:String(settings.displaySurface||'window'),
        width:video.videoWidth||settings.width||0,
        height:video.videoHeight||settings.height||0,
      });
      setVideoReady(true);
      track.addEventListener('ended',()=>{
        if(!mounted.current) return;
        streamRef.current=undefined;
        setVideoReady(false);
        setWindowInfo(undefined);
        setCalibratingSlot(undefined);
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
    if(!target) throw new Error(t('captureNoActiveSlot'));
    const pixels=regionToPixels(target.region,video.videoWidth,video.videoHeight);
    const maxSide=384;
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
    return canvas.toDataURL('image/png');
  },[target,t,videoReady]);

  const capture=useCallback(async()=>{
    if(busyRef.current||disabled||!phase||state.committedGameId) return;
    busyRef.current=true;
    setBusy(true);
    setMessage('');
    try{
      let data:RecognitionResponse;
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

      const candidates=data.candidates??[];
      const heroEvidence=updateHeroRecognitionStability(heroStability.current,phaseKey,candidates);
      heroStability.current=heroEvidence.stability;
      const top=heroEvidence.top;
      const heroLock=updateHeroLockStability(heroLockStability.current,{
        phaseKey,
        heroId:top?.heroId,
        lockFingerprint:data.lockFingerprint,
        stabilityCount:heroEvidence.stability.count,
        requiredScans:heroEvidence.requiredScans,
      });
      heroLockStability.current=heroLock.stability;
      const elapsedMs=Date.now()-phaseStartedAt.current;

      if(phase.action==='ban' && data.lockFingerprint && !lockBaseline.current.fingerprint){
        lockBaseline.current={phaseKey,fingerprint:data.lockFingerprint};
      }
      const lockCueDistance=phase.action==='ban' && data.lockFingerprint && lockBaseline.current.fingerprint
        ? fingerprintDistance(lockBaseline.current.fingerprint,data.lockFingerprint)
        : undefined;

      const empty=detectEmptyBan(emptyStability.current,{
        phaseKey,
        isBan:phase.action==='ban',
        fingerprint:data.fingerprint,
        topConfidence:top?.confidence,
        elapsedMs,
        suppressed:emptyPromptedPhase.current===phaseKey,
        lockCueDistance,
      });
      emptyStability.current=empty.stability;

      if(heroEvidence.accepted&&top&&heroLock.locked){
        setSelected(top.heroId);
        setCandidateStatus(t('captureHeroStable',{
          hero:label(top.heroId),
          confidence:Math.round(top.confidence*100),
          count:heroEvidence.stability.count,
          required:heroEvidence.requiredScans,
        }));
        setResult({kind:'hero',candidates,preview:data.preview,at:Date.now()});
        return;
      }

      if(top){
        if(heroEvidence.accepted&&!heroLock.locked){
          setCandidateStatus(zh
            ? label(top.heroId)+' · '+Math.round(top.confidence*100)+'% · 英雄已稳定，等待锁定'
            : label(top.heroId)+' · '+Math.round(top.confidence*100)+'% · stable, waiting for lock');
        }else{
          setCandidateStatus(t('captureHeroCandidate',{
            hero:label(top.heroId),
            confidence:Math.round(top.confidence*100),
            count:heroEvidence.stability.count,
            required:heroEvidence.requiredScans || '—',
          }));
        }
      }else{
        setCandidateStatus(t('captureNoCandidate'));
      }

      if(heroEvidence.accepted&&top&&!heroLock.locked){
        setMessage(zh?'英雄已稳定，等待游戏内锁定标记。':'Hero stable; waiting for the in-game lock cue.');
        return;
      }else if(empty.suspected){
        emptyPromptedPhase.current=phaseKey;
        setResult({kind:'empty-ban',candidates,preview:data.preview,at:Date.now()});
        setMessage(t('emptyBanSuspected',{count:3}));
        return;
      }

      if(phase.action==='ban'&&empty.waitingForGracePeriod){
        const remaining=Math.max(0,Math.ceil((EMPTY_BAN_GRACE_MS-elapsedMs)/1000));
        setMessage(t('emptyBanGraceWaiting',{seconds:remaining}));
      }else if(phase.action==='ban'&&emptyPromptedPhase.current===phaseKey){
        setMessage(t('emptyBanSuppressed'));
      }else if(phase.action==='ban'&&empty.lockCueDetected&&(top?.confidence??0)<.34){
        setMessage(t('emptyBanLockCueWaiting',{count:empty.stability.count}));
      }else if(phase.action==='ban'){
        setMessage(t('emptyBanAwaitLockCue'));
      }else{
        setMessage(t('captureWaitingForStableHero'));
      }
    }catch(error){
      if(mounted.current) setMessage(error instanceof Error?error.message:'Capture failed');
    }finally{
      busyRef.current=false;
      if(mounted.current) setBusy(false);
    }
  },[captureMode,captureWindowFrame,disabled,label,nativeRegion,phase,phaseKey,revision,state.committedGameId,t,token,zh]);

  useEffect(()=>{
    if(!autoWatch||result||disabled||!phase||state.committedGameId||busy) return;
    if(captureMode==='window'&&!videoReady) return;
    const timer=setTimeout(()=>{void capture();},350);
    return()=>clearTimeout(timer);
  },[autoWatch,busy,capture,captureMode,disabled,phase,result,state.committedGameId,videoReady]);

  const setMode=(mode:CaptureMode)=>{
    setCaptureMode(mode);
    localStorage.setItem('hok-capture-mode',mode);
    emptyStability.current=freshEmptyStability();
    heroStability.current=freshHeroStability();
    heroLockStability.current=freshHeroLockStability();
    setResult(undefined);
    setMessage('');
    setCandidateStatus('');
  };

  const pointerDown=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!calibratingSlot||!videoReady) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current=pointInElement(event);
  };

  const pointerMove=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!calibratingSlot||!dragStart.current) return;
    const next=regionFromDrag(dragStart.current,pointInElement(event));
    setSlots(previous=>({...previous,[calibratingSlot]:next}));
  };

  const pointerUp=(event:React.PointerEvent<HTMLDivElement>)=>{
    if(!calibratingSlot||!dragStart.current) return;
    const next=regionFromDrag(dragStart.current,pointInElement(event));
    dragStart.current=null;
    persistCalibrationSlot(calibratingSlot,next);
    setMessage(t('captureExplicitSlotSaved',{slot:captureSlotLabel(calibratingSlot)}));
    if(!precisionMode) setCalibratingSlot(undefined);
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

  const currentSlotText=target
    ? t('captureCurrentSlot',{
      side:t(target.side==='blue'?'blueSide':'redSide'),
      action:t(target.action==='ban'?'banAction':'pickAction'),
      current:target.slotIndex+1,
      total:target.slotCount,
    })
    : t('draftComplete');

  const renderSlotButtons=(side:'blue'|'red',action:'ban'|'pick')=>{
    const count=action==='ban'?4:5;
    return <div className={`explicit-slot-group ${side} ${action}`}>
      <strong>{t(side==='blue'?'blueSide':'redSide')} · {t(action==='ban'?'banAction':'pickAction')}</strong>
      <div className="explicit-slot-buttons">{Array.from({length:count},(_,index)=>{
        const key=`${side}${action==='ban'?'Ban':'Pick'}${index+1}` as CaptureSlotKey;
        return <button
          type="button"
          key={key}
          disabled={!videoReady}
          className={[
            calibratingSlot===key?'selected':'',
            target?.key===key?'active':'',
          ].filter(Boolean).join(' ')}
          onClick={()=>calibratingSlot===key&&!precisionMode?setCalibratingSlot(undefined):selectCalibrationSlot(key)}
        >{action==='ban'?'B':'P'}{index+1}</button>;
      })}</div>
    </div>;
  };

  return <section className="panel screen-input">
    <div className="screen-input-heading">
      <div>
        <h2>{zh?'自动 BP · 屏幕识别':'Auto BP · screen recognition'}</h2>
        <p>{t('captureExplicitSlotsHint')}</p>
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

      <div ref={precisionWorkspace} className={`precision-calibration-workspace ${precisionMode?'active':''}`}>
        {precisionMode&&<div className="precision-calibration-toolbar">
          <div className="precision-calibration-title">
            <span>{t('precisionCalibrationTitle')}</span>
            <strong>{calibratingSlot?captureSlotLabel(calibratingSlot):t('captureNoActiveSlot')}</strong>
          </div>
          <div className="precision-zoom-controls" role="group" aria-label={t('precisionZoom')}>
            <button type="button" onClick={()=>setCalibrationZoom(value=>Math.max(1,Math.round((value-.25)*100)/100))}>−</button>
            <button type="button" onClick={()=>setCalibrationZoom(1)}>{t('precisionFit')}</button>
            {[1.5,2,3,4].map(value=><button type="button" key={value} className={calibrationZoom===value?'selected':''} onClick={()=>setCalibrationZoom(value)}>{Math.round(value*100)}%</button>)}
            <button type="button" onClick={()=>setCalibrationZoom(value=>Math.min(4,Math.round((value+.25)*100)/100))}>+</button>
          </div>
          <div className="precision-calibration-nav">
            <button type="button" onClick={()=>moveCalibrationSelection(-1)}>← {t('precisionPreviousSlot')}</button>
            <button type="button" className="primary" onClick={()=>moveCalibrationSelection(1)}>{t('precisionNextSlot')} →</button>
            <button type="button" onClick={()=>void exitPrecisionCalibration()}>{t('precisionExit')}</button>
          </div>
        </div>}

        <div className="precision-preview-scroll">
          <div
            className={`window-capture-preview ${videoReady?'ready':''} ${calibratingSlot?'calibrating':''}`}
            style={{
              ...(videoReady&&windowInfo?.width&&windowInfo?.height?{aspectRatio:`${windowInfo.width}/${windowInfo.height}`}:{}),
              ...(precisionMode?{width:`${calibrationZoom*100}%`}:{}),
            }}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={()=>{dragStart.current=null;}}
          >
            <video ref={videoRef} playsInline muted />
            {videoReady&&captureSlotKeys.map(key=><div
              key={key}
              className={`capture-explicit-slot ${key.startsWith('blue')?'blue':'red'} ${key.includes('Ban')?'ban':'pick'} ${target?.key===key?'active':''} ${calibratingSlot===key?'editing':''}`}
              style={percentageStyle(slots[key])}
            ><span>{captureSlotLabel(key)}</span></div>)}
            {!videoReady&&<div className="window-capture-placeholder">{t('windowCaptureChooseHint')}</div>}
          </div>
        </div>

        {precisionMode&&<div className="precision-calibration-footer">
          <div className="precision-slot-strip">
            {captureSlotKeys.map(key=><button
              type="button"
              key={key}
              className={[calibratingSlot===key?'selected':'',target?.key===key?'active':''].filter(Boolean).join(' ')}
              onClick={()=>selectCalibrationSlot(key)}
            >{captureSlotLabel(key)}</button>)}
          </div>
          <div className="precision-calibration-help">
            <span>{t('precisionKeyboardHint')}</span>
            {calibrationPreview&&<figure className="precision-crop-preview">
              <figcaption>{t('precisionActualInput')}</figcaption>
              <img src={calibrationPreview} alt={t('precisionActualInput')} />
            </figure>}
          </div>
        </div>}
      </div>

      <div className="explicit-slot-calibration">
        <div className="explicit-slot-calibration-heading">
          <div>
            <strong>{t('captureCalibrateExplicitSlots')}</strong>
            <p className="muted">{calibratingSlot?t('captureDragSelectedSlot',{slot:captureSlotLabel(calibratingSlot)}):t('captureExplicitCalibrationHint')}</p>
          </div>
          <div className="explicit-slot-calibration-actions">
            <button type="button" className="primary" disabled={!videoReady} onClick={()=>void enterPrecisionCalibration()}>{t('precisionOpenFullscreen')}</button>
            <button type="button" disabled={!videoReady} onClick={()=>{
              const next=normalizeCaptureSlots(defaultCaptureSlots);
              setSlots(next);
              localStorage.setItem(SLOTS_STORAGE,JSON.stringify(next));
              setCalibratingSlot(undefined);
              setCalibrationPreview('');
              setMessage(t('captureExplicitSlotsReset'));
            }}>{t('captureResetAllSlots')}</button>
          </div>
        </div>

        <div className="explicit-slot-groups">
          {renderSlotButtons('blue','ban')}
          {renderSlotButtons('red','ban')}
          {renderSlotButtons('blue','pick')}
          {renderSlotButtons('red','pick')}
        </div>
      </div>

      <p className="muted">{videoReady&&windowInfo?`${windowInfo.width}×${windowInfo.height} · ${windowInfo.surface} · ${t('windowCaptureRelativeHint')}`:t('windowCaptureRelativeHint')}</p>
    </div>:<details className="native-capture-settings" open>
      <summary>{t('nativeCaptureAdvanced')}</summary>
      <p className="muted">{t('nativeCaptureHint')}</p>
      <div className="capture-region">{(['x','y','width','height'] as const).map(key=><label key={key}>{key}<input type="number" value={nativeRegion[key]} onChange={event=>setNativeRegion({...nativeRegion,[key]:Number(event.target.value)})}/></label>)}</div>
    </details>}

    <div className="capture-live-status">
      <div><span>{t('capturePhaseLabel')}</span><strong>{phaseName(state)}</strong></div>
      <div><span>{t('captureSlotLabel')}</span><strong>{currentSlotText}</strong></div>
      <div><span>{t('captureCandidateLabel')}</span><strong>{candidateStatus||t('captureWaiting')}</strong></div>
      <div><span>{t('captureEmptyBanLabel')}</span><strong>{
        phase?.action!=='ban'
          ? t('captureNotApplicable')
          : emptyPromptedPhase.current===phaseKey
            ? t('capturePromptedOnce')
            : t('captureGraceThenCheck',{seconds:Math.max(0,Math.ceil((EMPTY_BAN_GRACE_MS-(Date.now()-phaseStartedAt.current))/1000))})
      }</strong></div>
    </div>

    <div className="screen-input-actions">
      <button disabled={disabled||busy||!phase||!!state.committedGameId||(captureMode==='window'&&!videoReady)} onClick={()=>void capture()}>{busy?(zh?'正在识别…':'Recognizing…'):t('captureNow')}</button>
      {phase?.action==='ban'&&<button className="empty-ban-button" disabled={disabled||!!state.committedGameId} onClick={()=>send({type:'skip_ban',team:phase.team})}>{t('emptyBanButton')}</button>}
      <label className="auto-watch-toggle"><input type="checkbox" checked={autoWatch} onChange={event=>{
        setAutoWatch(event.target.checked);
        localStorage.setItem('hok-capture-auto-watch',event.target.checked?'1':'0');
      }}/>{t('autoCaptureWatch')}</label>
    </div>
    <small>{captureMode==='window'?t('captureExplicitAutoHint'):t('autoCaptureWatchHint')}</small>
    <p role="status">{message}</p>

    {result&&<dialog ref={dialog} className="library-dialog capture-review" aria-label={result.kind==='empty-ban'?t('emptyBanReviewTitle'):(zh?'确认识别结果':'Review recognition')} onCancel={event=>{event.preventDefault();closeReview();}}>
      {result.kind==='empty-ban'?<>
        <h2>{t('emptyBanReviewTitle')}</h2>
        <p>{t('emptyBanReviewHintOnce')}</p>
      </>:<>
        <h2>{zh?'识别到：':'Recognized: '}{label(selected)}</h2>
        <label>{zh?'候选英雄（相似度，不代表准确率）':'Candidates (similarity, not accuracy)'}<select value={selected} onChange={event=>setSelected(Number(event.target.value))}>{result.candidates.map(candidate=><option key={candidate.heroId} value={candidate.heroId}>{label(candidate.heroId)} · {Math.round(candidate.confidence*100)}%</option>)}</select></label>
      </>}
      <p>{currentSlotText}</p>
      <img src={result.preview} alt={zh?'当前槽位截图':'Current slot capture'}/>
      <div className="capture-review-actions">
        <button disabled={disabled||!phase} onClick={submitReview}>{result.kind==='empty-ban'?t('emptyBanConfirm'):(zh?'确认并提交':'Confirm and submit')}</button>
        <button onClick={closeReview}>{zh?'拒绝 / 继续监视':'Reject / keep watching'}</button>
      </div>
    </dialog>}
  </section>;
}
