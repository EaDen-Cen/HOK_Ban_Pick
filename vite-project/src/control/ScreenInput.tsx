import { useEffect, useRef, useState } from 'react';
import heroes from '../components/HeroList';
import { phases, type Action, type MatchState } from '../shared/types';
import { phaseName } from '../shared/display';

export function ScreenInput({ state, revision, token, disabled, send }: { state:MatchState; revision:number; token:string; disabled:boolean; send:(action:Action)=>void }) {
  const zh = state.language === 'zh';
  const [region, setRegion] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hok-capture-region') || 'null') || {x:0,y:0,width:100,height:100}; } catch { return {x:0,y:0,width:100,height:100}; }
  });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [result, setResult] = useState<{ candidates:{heroId:number;confidence:number}[]; preview:string; at:number }>();
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current=true; return () => { mounted.current=false; }; }, []);
  useEffect(() => { if (result) dialog.current?.showModal(); }, [result]);
  const phase = phases(state.draftMode, state.firstPickSide)[state.currentPhase];
  async function capture() {
    setBusy(true); setMessage(''); setResult(undefined);
    try {
      localStorage.setItem('hok-capture-region', JSON.stringify(region));
      const response = await fetch('/api/capture', {method:'POST', headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'}, body:JSON.stringify({region,revision}), signal:AbortSignal.timeout(25000)});
      const data = await response.json();
      if (!response.ok) throw new Error(zh ? '识别不可用：请使用 Windows 本机控制台、启用采集并检查区域。可继续手动选择。' : 'Capture unavailable: use the enabled Windows local console and check the region. Manual selection remains available.');
      if (!mounted.current) return;
      if (!data.candidates?.length || data.candidates[0].confidence < .55) throw new Error(zh ? '未找到可靠候选，请调整区域或手动选择。' : 'No reliable candidate. Adjust the region or select manually.');
      setSelected(data.candidates[0].heroId); setResult({...data,at:Date.now()});
    } catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'Capture failed'); }
    finally { if (mounted.current) setBusy(false); }
  }
  const label = (id:number) => { const h=heroes.find(h=>h.id===id); return zh ? h?.chineseName : h?.englishName; };
  return <section className="panel screen-input">
    <h2>{zh ? '屏幕识别 · 人工审核' : 'Screen recognition · review'}</h2>
    <p>{zh ? '在 Windows 本机填写目标屏幕或可见窗口内当前英雄头像的矩形区域（物理像素）。每次仅读取一个当前 BP 槽位。' : 'On the Windows host, enter the current hero portrait region in a screen or visible window (physical pixels). One current BP slot per capture.'}</p>
    <div className="capture-region">{(['x','y','width','height'] as const).map(key=><label key={key}>{key}<input type="number" value={region[key]} onChange={e=>setRegion({...region,[key]:Number(e.target.value)})} /></label>)}</div>
    <p>{phaseName(state)}</p>
    <button disabled={disabled || busy || !phase || !!state.committedGameId} onClick={()=>void capture()}>{busy ? (zh?'正在识别…':'Recognizing…') : (zh?'读取当前区域':'Read region')}</button>
    <p role="status">{message}</p><small>{zh ? '识别不会自动提交。识别失败可直接使用右侧英雄选择器，或在设置中切回手动模式。' : 'Recognition never submits automatically. Use the hero picker at any time, or switch to manual mode in settings.'}</small>
    {result && <dialog ref={dialog} className="library-dialog capture-review" aria-label={zh?'确认识别结果':'Review recognition'} onCancel={()=>setResult(undefined)}>
      <h2>{zh?'识别到：':'Recognized: '}{label(selected)}</h2><p>{phaseName(state)}</p><img src={result.preview} alt={zh?'截取区域':'Captured region'} />
      <label>{zh?'候选英雄（相似度，不代表准确率）':'Candidates (similarity, not accuracy)'}<select value={selected} onChange={e=>setSelected(Number(e.target.value))}>{result.candidates.map(c=><option key={c.heroId} value={c.heroId}>{label(c.heroId)} · {Math.round(c.confidence*100)}%</option>)}</select></label>
      <button disabled={disabled || !phase} onClick={()=>{
        if (!phase || disabled) return;
        if (Date.now()-result.at>30000) {setResult(undefined);setMessage(zh?'结果已过期，请重新读取。':'Result expired. Capture again.');return;}
        setResult(undefined);send({type:'draft_action',heroId:selected,team:phase.team,action:phase.action});
      }}>{zh?'确认并提交':'Confirm and submit'}</button>
      <button onClick={()=>setResult(undefined)}>{zh?'拒绝 / 手动选择':'Reject / select manually'}</button>
    </dialog>}
  </section>;
}
