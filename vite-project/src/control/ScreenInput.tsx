import { useCallback, useEffect, useRef, useState } from 'react';
import heroes from '../components/HeroList';
import { detectEmptyBan, type EmptyBanStability } from './emptyBanDetection';
import { phaseName } from '../shared/display';
import { translator } from '../shared/i18n';
import { phases, type Action, type MatchState } from '../shared/types';

type CaptureResult = {
  kind: 'hero' | 'empty-ban';
  candidates: { heroId:number; confidence:number }[];
  preview: string;
  at: number;
};

const freshStability = (): EmptyBanStability => ({ phaseKey:'', fingerprint:'', count:0 });

export function ScreenInput({ state, revision, token, disabled, send }: { state:MatchState; revision:number; token:string; disabled:boolean; send:(action:Action)=>void }) {
  const zh = state.language === 'zh';
  const t = translator(state.language);
  const [region, setRegion] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hok-capture-region') || 'null') || {x:0,y:0,width:100,height:100}; } catch { return {x:0,y:0,width:100,height:100}; }
  });
  const [autoWatch,setAutoWatch]=useState(()=>localStorage.getItem('hok-capture-auto-watch')==='1');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [result, setResult] = useState<CaptureResult>();
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(true);
  const busyRef = useRef(false);
  const stability = useRef<EmptyBanStability>(freshStability());
  const phase = phases(state.draftMode, state.firstPickSide)[state.currentPhase];
  const phaseKey = `${state.draftGameNumber ?? state.gameNumber}:${state.currentPhase}:${phase?.team ?? 'done'}:${phase?.action ?? 'done'}`;

  useEffect(() => { mounted.current=true; return () => { mounted.current=false; }; }, []);
  useEffect(() => {
    stability.current=freshStability();
    setResult(undefined);
    setMessage('');
  }, [phaseKey]);
  useEffect(() => {
    if (!result || !dialog.current || dialog.current.open) return;
    dialog.current.showModal();
  }, [result]);

  const capture = useCallback(async () => {
    if (busyRef.current || disabled || !phase || state.committedGameId) return;
    busyRef.current=true;
    setBusy(true); setMessage('');
    try {
      localStorage.setItem('hok-capture-region', JSON.stringify(region));
      const response = await fetch('/api/capture', {
        method:'POST',
        headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'},
        body:JSON.stringify({region,revision}),
        signal:AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(zh ? '识别不可用：请使用 Windows 本机控制台、启用采集并检查区域。可继续手动选择。' : 'Capture unavailable: use the enabled Windows local console and check the region. Manual selection remains available.');
      if (!mounted.current) return;

      const top = data.candidates?.[0] as {heroId:number;confidence:number}|undefined;
      const empty = detectEmptyBan(stability.current,{
        phaseKey,
        isBan:phase.action==='ban',
        fingerprint:data.fingerprint,
        topConfidence:top?.confidence,
      });
      stability.current=empty.stability;

      if (top && top.confidence >= .55) {
        setSelected(top.heroId);
        setResult({kind:'hero',candidates:data.candidates,preview:data.preview,at:Date.now()});
        return;
      }
      if (empty.suspected) {
        setResult({kind:'empty-ban',candidates:data.candidates||[],preview:data.preview,at:Date.now()});
        setMessage(t('emptyBanSuspected',{count:3}));
        return;
      }
      if (phase.action==='ban' && (top?.confidence ?? 0) < .35) {
        setMessage(t('emptyBanSuspected',{count:empty.stability.count}));
      } else {
        setMessage(zh ? '没有可靠候选；自动监视会继续读取，或可直接手动选择。' : 'No reliable candidate yet. Auto-watch will keep reading, or select manually.');
      }
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'Capture failed');
    } finally {
      busyRef.current=false;
      if (mounted.current) setBusy(false);
    }
  },[disabled,phase,phaseKey,region,revision,state.committedGameId,t,token,zh]);

  useEffect(()=>{
    if(!autoWatch||result||disabled||!phase||state.committedGameId) return;
    const timer=setTimeout(()=>{void capture();},busy ? 800 : 1400);
    return()=>clearTimeout(timer);
  },[autoWatch,busy,capture,disabled,phase,result,state.committedGameId]);

  const label = (id:number) => {
    const h=heroes.find(hero=>hero.id===id);
    return zh ? h?.chineseName : h?.englishName;
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

  return <section className="panel screen-input">
    <h2>{zh ? '屏幕识别 · 人工审核' : 'Screen recognition · review'}</h2>
    <p>{zh ? '读取当前 BP 槽位。英雄候选需要人工确认；空 Ban 只有在连续 3 次稳定画面都没有可靠英雄时才会被提示。' : 'Reads the current BP slot. Hero candidates require review; an empty ban is suggested only after 3 stable low-confidence frames.'}</p>
    <div className="capture-region">{(['x','y','width','height'] as const).map(key=><label key={key}>{key}<input type="number" value={region[key]} onChange={e=>setRegion({...region,[key]:Number(e.target.value)})} /></label>)}</div>
    <p>{phaseName(state)}</p>
    <div className="screen-input-actions">
      <button disabled={disabled || busy || !phase || !!state.committedGameId} onClick={()=>void capture()}>{busy ? (zh?'正在识别…':'Recognizing…') : (zh?'读取当前区域':'Read region')}</button>
      {phase?.action==='ban' && <button className="empty-ban-button" disabled={disabled || !!state.committedGameId} onClick={()=>send({type:'skip_ban',team:phase.team})}>{t('emptyBanButton')}</button>}
      <label className="auto-watch-toggle"><input type="checkbox" checked={autoWatch} onChange={event=>{
        setAutoWatch(event.target.checked);
        localStorage.setItem('hok-capture-auto-watch',event.target.checked?'1':'0');
      }}/>{t('autoCaptureWatch')}</label>
    </div>
    <small>{t('autoCaptureWatchHint')}</small>
    <p role="status">{message}</p>
    {result && <dialog ref={dialog} className="library-dialog capture-review" aria-label={result.kind==='empty-ban'?t('emptyBanReviewTitle'):(zh?'确认识别结果':'Review recognition')} onCancel={event=>{event.preventDefault();closeReview();}}>
      {result.kind==='empty-ban' ? <>
        <h2>{t('emptyBanReviewTitle')}</h2>
        <p>{t('emptyBanReviewHint')}</p>
      </> : <>
        <h2>{zh?'识别到：':'Recognized: '}{label(selected)}</h2>
        <label>{zh?'候选英雄（相似度，不代表准确率）':'Candidates (similarity, not accuracy)'}<select value={selected} onChange={e=>setSelected(Number(e.target.value))}>{result.candidates.map(candidate=><option key={candidate.heroId} value={candidate.heroId}>{label(candidate.heroId)} · {Math.round(candidate.confidence*100)}%</option>)}</select></label>
      </>}
      <p>{phaseName(state)}</p>
      <img src={result.preview} alt={zh?'截取区域':'Captured region'} />
      <div className="capture-review-actions">
        <button disabled={disabled || !phase} onClick={submitReview}>{result.kind==='empty-ban'?t('emptyBanConfirm'):(zh?'确认并提交':'Confirm and submit')}</button>
        <button onClick={closeReview}>{zh?'拒绝 / 手动选择':'Reject / select manually'}</button>
      </div>
    </dialog>}
  </section>;
}
