import { useState } from 'react';
import heroes from './components/HeroList';
import { phases, type Action, type MatchSettings, type MatchState, type Role, type Side } from './shared/types';
import { useMatch } from './shared/useMatch';
import './broadcast.css';
type Language = 'eng' | 'zh';
const hero = (id: number) => heroes.find(h => h.id === id);
const name = (id: number, lang: Language) => { const h = hero(id); return h ? (lang === 'zh' ? h.chineseName : h.englishName) : '—'; };
function HeroSlot({ id, ban = false, lang }: { id?: number; ban?: boolean; lang: Language }) {
  return <div className={`hero-slot ${ban ? 'ban' : ''} ${id ? 'filled' : ''}`} key={id || 'empty'}>{id ? <><img src={`/heroesImg/${id}.png`} alt={name(id, lang)} /><span>{name(id, lang)}</span>{ban && <b className="ban-mark">╱</b>}</> : <span className="empty">{ban ? 'BAN' : 'PICK'}</span>}</div>;
}
function Board({ state, lang }: { state: MatchState; lang: Language }) {
  const phase = phases(state.draftMode)[state.currentPhase];
  return <section className="board"><div className="match-strip"><span>HONOR OF KINGS</span><span>{state.stage} · GAME {state.gameNumber} · {state.seriesFormat}</span></div>
    <div className="team-grid">{(['blue', 'red'] as const).map(side => <section key={side} className={`team ${side} ${phase?.team === side ? 'active' : ''}`}><header>{state[`${side}Team`].logo && <img className="logo" src={state[`${side}Team`].logo} alt="" />}<h2>{state[`${side}Team`].name}</h2><strong>{state[`${side}Score`]}</strong></header><div className="picks">{Array.from({ length: 5 }, (_, i) => <HeroSlot key={i} id={state[`${side}Picks`][i]} lang={lang} />)}</div><div className="bans"><small>BANS</small>{Array.from({ length: state.draftMode === 'match' ? 4 : 2 }, (_, i) => <HeroSlot key={i} id={state[`${side}Bans`][i]} ban lang={lang} />)}</div></section>)}</div>
    <footer className={`phase ${phase?.team || ''}`} key={state.currentPhase}>{phase ? `${phase.team.toUpperCase()} ${phase.action.toUpperCase()} · ${state.currentPhase + 1} / ${phases(state.draftMode).length}` : 'DRAFT COMPLETE'}</footer></section>;
}
function Analysis({ state, lang }: { state: MatchState; lang: Language }) {
  const [side, setSide] = useState<Side>('blue');
  const picks = state[`${side}Picks`], enemy = state[`${side === 'blue' ? 'red' : 'blue'}Picks`];
  const selected = [...state.bluePicks, ...state.redPicks];
  const groups = [
    { title: 'Synergy / Combo · 搭配', sources: picks, field: 'combo' as const },
    { title: 'Our picks counter · 我方克制', sources: picks, field: 'counter' as const },
    { title: 'Potential enemy counters · 我方被克制', sources: picks, field: 'beCountered' as const },
    { title: 'Counters enemy picks · 克制敌方推荐', sources: enemy, field: 'beCountered' as const },
  ];
  return <section className="panel analysis"><div className="section-head"><h2>Draft intelligence</h2><select aria-label="Analysis team" value={side} onChange={e => setSide(e.target.value as Side)}><option value="blue">Blue / 蓝方</option><option value="red">Red / 红方</option></select></div><small>Original hero relationship data · 原项目数据，供解说参考</small><div className="analysis-grid">{groups.map(g => {
    const ids = [...new Set(g.sources.flatMap(id => hero(id)?.[g.field] || []))].filter(id => hero(id) && !state.blueBans.includes(id) && !state.redBans.includes(id));
    return <article key={g.title}><h3>{g.title}</h3>{ids.length ? <div className="recommendations">{ids.map(id => <div className="recommendation" key={id}><img src={`/heroesImg/${id}.png`} alt="" /><div><b>{name(id, lang)}{selected.includes(id) ? ' ✓' : ''}</b><small>{g.sources.filter(s => hero(s)?.[g.field]?.includes(id)).map(s => name(s, lang)).join(' · ')}</small></div></div>)}</div> : <p className="muted">No relationships yet / 暂无数据</p>}</article>;
  })}</div></section>;
}
function Settings({ state, send, disabled }: { state: MatchState; send: (a: Action) => void; disabled: boolean }) {
  const [form, setForm] = useState<MatchSettings>(state);
  return <form className="panel settings" onSubmit={e => { e.preventDefault(); send({ type: 'settings', settings: form }); }}><h2>Match settings / 比赛设置</h2><div className="settings-grid">{(['blue', 'red'] as const).map(side => <div key={side}>
    <label>{side.toUpperCase()} TEAM<input maxLength={60} required value={form[`${side}Team`].name} onChange={e => setForm({ ...form, [`${side}Team`]: { ...form[`${side}Team`], name: e.target.value } })} /></label>
    <label>Logo URL<input placeholder="https://… or /teamLogo/blue.png" value={form[`${side}Team`].logo} onChange={e => setForm({ ...form, [`${side}Team`]: { ...form[`${side}Team`], logo: e.target.value } })} /></label>
    <label>Series score<input type="number" min={0} max={3} value={form[`${side}Score`]} onChange={e => setForm({ ...form, [`${side}Score`]: Number(e.target.value) })} /></label></div>)}<div>
    <label>Stage / 阶段<input value={form.stage} maxLength={80} onChange={e => setForm({ ...form, stage: e.target.value })} /></label>
    <label>Series<select value={form.seriesFormat} onChange={e => setForm({ ...form, seriesFormat: e.target.value as MatchSettings['seriesFormat'] })}>{['BO1', 'BO3', 'BO5'].map(s => <option key={s}>{s}</option>)}</select></label>
    <label>Game<input type="number" min={1} max={5} value={form.gameNumber} onChange={e => setForm({ ...form, gameNumber: Number(e.target.value) })} /></label>
    <label>BP mode<select value={form.draftMode} onChange={e => setForm({ ...form, draftMode: e.target.value as MatchSettings['draftMode'] })}><option value="match">Match · 4 bans</option><option value="normal">Normal · 2 bans</option></select></label></div></div><button disabled={disabled} className="primary">Save settings / 保存</button></form>;
}
function initialToken(role: Role) {
  const fragment = new URLSearchParams(location.hash.slice(1)).get('token');
  if (fragment) { sessionStorage.setItem(`hok-${role}`, fragment); history.replaceState(null, '', location.pathname); }
  return fragment || sessionStorage.getItem(`hok-${role}`) || (import.meta.env.DEV ? `local-${role}` : '');
}
export default function BroadcastApp() {
  const role: Role = location.pathname === '/caster' ? 'caster' : location.pathname === '/overlay/draft' ? 'overlay' : 'control';
  const [token, setToken] = useState(() => initialToken(role));
  const [tokenInput, setTokenInput] = useState('');
  const [lang, setLang] = useState<Language>('eng');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [delayInput, setDelayInput] = useState(180);
  const { snapshot, status, error, pending, send } = useMatch(role, token);
  const connected = status === 'Connected', disabled = !connected || pending, state = snapshot?.state;
  if (role === 'overlay') return <main className="overlay">{state && <Board state={state} lang={lang} />}</main>;
  if (!token || status === 'Invalid token' || status === 'Access rejected') return <main className="login panel"><p>HOK BROADCAST SYSTEM</p><h1>{role.toUpperCase()} ACCESS</h1><form onSubmit={e => { e.preventDefault(); sessionStorage.setItem(`hok-${role}`, tokenInput); setToken(tokenInput); }}><label>Access token<input type="password" required value={tokenInput} onChange={e => setTokenInput(e.target.value)} /></label><button className="primary">Connect</button></form><p>{status}</p></main>;
  const phase = state && phases(state.draftMode)[state.currentPhase];
  const used = state ? [...state.blueBans, ...state.redBans, ...state.bluePicks, ...state.redPicks] : [];
  return <main className="workspace"><header className="topbar"><div><span className="eyebrow">COMMUNITY ESPORTS / PRODUCTION</span><h1>HOK <span>Broadcast</span></h1></div><div className="toolbar"><b className={connected ? 'status live' : 'status'}>{status}</b><span>{role === 'caster' ? `DELAYED · ${snapshot?.casterDelaySeconds ?? '—'}s` : 'CONTROL · REALTIME'}</span><button onClick={() => setLang(lang === 'eng' ? 'zh' : 'eng')}>English / 中文</button><button onClick={() => { sessionStorage.removeItem(`hok-${role}`); setToken(''); }}>Disconnect</button></div></header>
    {!connected && <p className="notice">连接未就绪，操作已禁用。现有画面保留，正在恢复服务器状态。</p>}{error && <p role="alert" className="error">{error}</p>}
    {state ? <><Board state={state} lang={lang} />{role === 'control' && <><section className="operator-bar panel"><div className="toolbar"><button disabled={disabled || !snapshot?.canUndo} onClick={() => send({ type: 'undo' })}>Undo / 撤销上次比赛操作</button><button disabled={disabled} onClick={() => confirm('Reset draft? Team settings and scores are preserved. 清空当前 BP？') && send({ type: 'reset_draft' })}>Reset draft</button><button className="danger" disabled={disabled} onClick={() => confirm('Reset the entire match, teams and scores? 重置整场比赛？') && send({ type: 'reset_match' })}>Reset match</button><button onClick={() => setShowSettings(!showSettings)}>Match settings</button></div>
      <div className="delay-controls"><b>Caster delay · {snapshot?.casterDelaySeconds}s</b>{[-10, -5, -1, 1, 5, 10].map(n => <button key={n} disabled={disabled || (snapshot?.casterDelaySeconds || 0) + n < 0 || (snapshot?.casterDelaySeconds || 0) + n > 3600} onClick={() => send({ type: 'delay', seconds: (snapshot?.casterDelaySeconds || 0) + n })}>{n > 0 ? '+' : ''}{n}</button>)}<input aria-label="Caster delay seconds" type="number" min={0} max={3600} value={delayInput} onChange={e => setDelayInput(Number(e.target.value))} /><button disabled={disabled} onClick={() => send({ type: 'delay', seconds: delayInput })}>Set seconds</button></div></section>
    {showSettings && <Settings key={JSON.stringify([state.blueTeam, state.redTeam, state.blueScore, state.redScore, state.gameNumber, state.seriesFormat, state.stage, state.draftMode])} state={state} send={send} disabled={disabled} />}
    <section className="panel"><div className="section-head"><h2>{phase ? `${phase.team.toUpperCase()} ${phase.action.toUpperCase()}` : 'DRAFT COMPLETE'} <small> · Select one hero</small></h2><input aria-label="Search heroes" placeholder="Search hero / 搜索英雄" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="filters">{['all', 'Clash Lane', 'Jungling', 'Mid Lane', 'Farm Lane', 'Roaming'].map(r => <button key={r} className={filter === r ? 'selected' : ''} onClick={() => setFilter(r)}>{r === 'all' ? 'All / 全部' : r}</button>)}</div><div className="hero-grid">{heroes.filter(h => (filter === 'all' || h.occupation === filter || h.altOccupation === filter) && `${h.englishName} ${h.chineseName}`.toLowerCase().includes(search.toLowerCase())).map(h => <button key={h.id} title={`${h.englishName} / ${h.chineseName}`} disabled={disabled || !phase || used.includes(h.id)} onClick={() => phase && send({ type: 'draft_action', ...phase, heroId: h.id })}><img src={`/heroesImg/${h.id}.png`} alt="" /><span>{name(h.id, lang)}</span></button>)}</div></section></>}<Analysis state={state} lang={lang} /></> : <section className="panel"><h2>Connecting to match server…</h2></section>}
    <footer className="page-footer">HOK BROADCAST SYSTEM · {role === 'caster' ? 'READ ONLY / DELAYED TIMELINE' : 'SERVER AUTHORITATIVE'} · Hero data: qiqi47/HOK_Ban_Pick</footer></main>;
}
