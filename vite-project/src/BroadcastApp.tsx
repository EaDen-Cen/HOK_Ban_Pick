import { useEffect, useState } from 'react';
import './BroadcastApp.css';
import heroes from './components/HeroList';
import {
  phases,
  type Action,
  type Language,
  type MatchSettings,
  type MatchState,
  type Role,
  type Side,
} from './shared/types';
import { useMatch } from './shared/useMatch';
import { connectionLabel, lanes, laneName, phaseName, seriesName, stageName, teamName, draftRuleName } from './shared/display';
import { translator } from './shared/i18n';
import { errorMessage } from './shared/errorMessages';
import { currentGame, normalizeState, pickRestriction, ruleLocked, seriesWins } from './shared/draftRules';
import { DraftHistory } from './shared/DraftHistory';
import { DraftLifecycle } from './control/DraftLifecycle';
import { DraftOverlay } from './overlay/DraftOverlay';
import './broadcast.css';
const hero = (id: number) => heroes.find(h => h.id === id);
const name = (id: number, lang: Language) => { const h = hero(id); return h ? (lang === 'zh' ? h.chineseName : h.englishName) : '—'; };
function HeroSlot({ id, ban = false, lang }: { id?: number; ban?: boolean; lang: Language }) {
  const t = translator(lang);
  return <div className={`hero-slot ${ban ? 'ban' : ''} ${id ? 'filled' : ''}`} key={id || 'empty'}>{id ? <><img src={hero(id)?.imageLink} alt={name(id, lang)} /><span>{name(id, lang)}</span>{ban && <b className="ban-mark">╱</b>}</> : <span className="empty">{t(ban ? 'ban' : 'emptyPick')}</span>}</div>;
}
function Board({ state, lang }: { state: MatchState; lang: Language }) {
  const t = translator(lang);
  const phase = phases(state.draftMode)[state.currentPhase];
  return <section className="board"><div className="match-strip"><span>{t('gameTitle')}</span><span>{stageName(state.stage, lang)} · {t('gameNumber', { number: currentGame(state) })} · {seriesName(state.seriesFormat, lang)} · {draftRuleName(state, lang)}</span></div>
    <div className="team-grid">{(['blue', 'red'] as const).map(side => <section key={side} className={`team ${side} ${phase?.team === side ? 'active' : ''}`}><header>{state[`${side}Team`].logo && <img className="logo" src={state[`${side}Team`].logo} alt="" />}<h2>{teamName(state, side)}</h2><strong>{state[`${side}Score`]}</strong></header><div className="picks">{Array.from({ length: 5 }, (_, i) => <HeroSlot key={i} id={state[`${side}Picks`][i]} lang={lang} />)}</div><div className="bans"><small>{t('ban')}</small>{Array.from({ length: state.draftMode === 'match' ? 4 : 2 }, (_, i) => <HeroSlot key={i} id={state[`${side}Bans`][i]} ban lang={lang} />)}</div></section>)}</div>
    <footer className={`phase ${phase?.team || ''}`} key={state.currentPhase}>{phase ? `${phaseName(state, lang)} · ${t('phaseStep', { step: state.currentPhase + 1, total: phases(state.draftMode).length })}` : t('draftComplete')}</footer></section>;
}
function TeamAnalysis({
  state,
  lang,
  side,
}: {
  state: MatchState;
  lang: Language;
  side: Side;
}) {
  const t = translator(lang);
  const picks = state[`${side}Picks`], enemy = state[`${side === 'blue' ? 'red' : 'blue'}Picks`];
  const selected = [...state.bluePicks, ...state.redPicks];
  const groups = [
    { title: t('synergy'), sources: picks, field: 'combo' as const },
    { title: t('ourCounters'), sources: picks, field: 'counter' as const },
    { title: t('counteredBy'), sources: picks, field: 'beCountered' as const },
    { title: t('enemyCounters'), sources: enemy, field: 'beCountered' as const },
  ];
  return <section className={`panel analysis analysis-${side}`} data-side={side}>
    <header className="analysis-team-header">
      {state[`${side}Team`].logo && <img className="analysis-logo" src={state[`${side}Team`].logo} alt="" />}
      <div><span className="analysis-side">{t(side === 'blue' ? 'blueAnalysis' : 'redAnalysis')}</span><h2>{teamName(state, side)}</h2></div>
      <span className="analysis-opponent">{t('opponent', { team: teamName(state, side === 'blue' ? 'red' : 'blue') })}</span>
    </header>
    <small>{t('relationshipHint')}</small><div className="analysis-grid">{groups.map(g => {
      const ids = [...new Set(g.sources.flatMap(id => hero(id)?.[g.field] || []))].filter(id => hero(id) && !state.blueBans.includes(id) && !state.redBans.includes(id));
      return <article key={g.title}><h3>{g.title}</h3>{ids.length ? <div className="recommendations">{ids.map(id => <div className="recommendation" key={id}><img src={hero(id)?.imageLink} alt="" /><div><b>{name(id, lang)}{selected.includes(id) ? ' ✓' : ''}</b><small>{g.sources.filter(s => hero(s)?.[g.field]?.includes(id)).map(s => name(s, lang)).join(' · ')}</small></div></div>)}</div> : <p className="muted">{t('noRelationships')}</p>}</article>;
    })}</div></section>;
}
function Analysis({
  state,
  lang,
}: {
  state: MatchState;
  lang: Language;
}) {
  return (
    <section className="dual-analysis">
      <TeamAnalysis
        state={state}
        lang={lang}
        side="blue"
      />

      <TeamAnalysis
        state={state}
        lang={lang}
        side="red"
      />
    </section>
  );
}
function Settings({ state, send, disabled }: { state: MatchState; send: (a: Action) => void; disabled: boolean }) {
  const t = translator(state.language);
  const [form, setForm] = useState<MatchSettings>(() => ({
    blueTeam: state.blueTeam, redTeam: state.redTeam, blueScore: state.blueScore, redScore: state.redScore,
    gameNumber: state.gameNumber, seriesFormat: state.seriesFormat, stage: state.stage,
    draftMode: state.draftMode, draftRuleMode: state.draftRuleMode, language: state.language, overlayLayout: state.overlayLayout,
  }));
  const maxWins = seriesWins(state);
  const rosterLocked = state.currentPhase > 0;
  return <form className="panel settings" onSubmit={event => {
    event.preventDefault();
    send({ type: 'settings', settings: { ...form, blueScore: state.blueScore, redScore: state.redScore, gameNumber: state.gameNumber } });
  }}>
    <h2>{t('matchSettings')}</h2>
    <div className="settings-grid">
      {(['blue', 'red'] as const).map(side => {
        const teamKey = side === 'blue' ? 'blueTeam' : 'redTeam';
        const scoreKey = side === 'blue' ? 'blueScore' : 'redScore';
        const otherScore = side === 'blue' ? state.redScore : state.blueScore;
        const updateTeam = (patch: Partial<MatchState['blueTeam']>) => setForm({ ...form, [teamKey]: { ...form[teamKey], ...patch } });
        return <section key={side}>
          <h3>{t(teamKey)}</h3>
          <label>{t('teamName')}<input required maxLength={60} value={form[teamKey].name} onChange={e => updateTeam({ name: e.target.value })} /></label>
          <label>{t('logoAddress')}<input maxLength={1000} placeholder={t('logoPlaceholder')} value={form[teamKey].logo} onChange={e => updateTeam({ logo: e.target.value })} /></label>
          <b>{t('players')}</b>
          {form[teamKey].players.map((player, index) => <div className="player-setting-row" key={index}>
            <label>{t('playerNumber', { number: index + 1 })}<input maxLength={40} disabled={rosterLocked} value={player} onChange={e => updateTeam({ players: form[teamKey].players.map((p, i) => i === index ? e.target.value : p) })} /></label>
            <label>{t('lane')}<select disabled={rosterLocked} value={form[teamKey].playerRoles[index]} onChange={e => updateTeam({ playerRoles: form[teamKey].playerRoles.map((r, i) => i === index ? e.target.value as typeof r : r) })}>
              {(['clash', 'jungle', 'mid', 'farm', 'roam'] as const).map(role => <option key={role} value={role}>{t(role)}</option>)}
            </select></label>
          </div>)}
          <div className="score-setting"><p>{t('seriesScore')}</p><div className="score-control">
            <button type="button" aria-label={t('decreaseScore')} disabled={disabled || state[scoreKey] <= 0} onClick={() => send({ type: 'score', team: side, delta: -1 })}>−</button>
            <strong>{state[scoreKey]}</strong>
            <button type="button" aria-label={t('increaseScore')} disabled={disabled || state[scoreKey] >= maxWins || (otherScore === maxWins && state[scoreKey] + 1 === maxWins)} onClick={() => send({ type: 'score', team: side, delta: 1 })}>+</button>
          </div></div>
        </section>;
      })}
      <section><h3>{t('matchDisplay')}</h3>
        <label>{t('stage')}<input maxLength={80} value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} /></label>
        <label>{t('seriesFormat')}<select disabled={state.draftHistory.length > 0} value={form.seriesFormat} onChange={e => setForm({ ...form, seriesFormat: e.target.value as MatchSettings['seriesFormat'] })}>
          {(['BO1', 'BO3', 'BO5'] as const).map(format => <option key={format} value={format}>{seriesName(format, state.language)}</option>)}
        </select></label>
        <label>{t('currentGame')}<div className="readonly-field">{t('gameNumber', { number: state.gameNumber })} · {t('automatic')}</div></label>
        <label>{t('draftMode')}<select disabled={state.currentPhase > 0} value={form.draftMode} onChange={e => setForm({ ...form, draftMode: e.target.value as MatchSettings['draftMode'] })}>
          <option value="match">{t('matchMode')}</option><option value="normal">{t('normalMode')}</option>
        </select></label>
        <label>{t('draftRules')}<select aria-label={t('draftRules')} disabled={ruleLocked(state)} value={form.draftRuleMode} onChange={e => setForm({ ...form, draftRuleMode: e.target.value as MatchSettings['draftRuleMode'] })}>
          <option value="normal">{t('ruleNormal')}</option><option value="player">{t('rulePlayer')}</option><option value="global">{t('ruleGlobal')}</option>
        </select></label>
        {ruleLocked(state) && <p className="muted">{t('rulesLocked')}</p>}
        <label>{t('language')}<select aria-label={t('language')} value={form.language} onChange={e => setForm({ ...form, language: e.target.value as Language })}>
          <option value="zh">{t('chinese')}</option><option value="eng">{t('english')}</option>
        </select><small>{t('languageHint')}</small></label>
        <label>{t('overlayLayout')}<select value={form.overlayLayout} onChange={e => setForm({ ...form, overlayLayout: e.target.value as MatchSettings['overlayLayout'] })}>
          <option value="panel">{t('panelLayout')}</option><option value="side">{t('sideLayout')}</option>
        </select></label>
      </section>
    </div>
    <button disabled={disabled} className="primary">{t('saveSettings')}</button><p className="muted">{t('scoreImmediate')}</p>
  </form>;
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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [delayInput, setDelayInput] = useState(180);
  const [lastLanguage, setLastLanguage] = useState<Language>(() => sessionStorage.getItem(`hok-language-${role}`) === 'eng' ? 'eng' : 'zh');
  const { snapshot, status, error, pending, send } = useMatch(role, token);
  const connected = status === 'Connected';
  const compatible = !!snapshot?.state && Array.isArray(snapshot.state.draftHistory) && !!snapshot.state.draftRuleMode;
  const disabled = !connected || pending || !compatible;
  const state = snapshot?.state ? normalizeState(snapshot.state) : undefined;
  const lang: Language = token && !['Invalid token', 'Access rejected'].includes(status) ? state?.language ?? lastLanguage : lastLanguage;
  const t = translator(lang);
  useEffect(() => {
    document.documentElement.lang = lang === 'eng' ? 'en' : 'zh-CN';
    document.title = translator(lang)('appName');
    sessionStorage.setItem(`hok-language-${role}`, lang);
    setLastLanguage(lang);
  }, [lang, role]);
  if (role === 'overlay') {
    return <main className="overlay">{state && <DraftOverlay state={state} />}</main>;
  }
  if (!token || status === 'Invalid token' || status === 'Access rejected') {
    return <main className="login panel">
      <p>{t('appName')}</p><h1>{t(role === 'caster' ? 'casterLogin' : 'controlLogin')}</h1>
      <form onSubmit={e => { e.preventDefault(); sessionStorage.setItem(`hok-${role}`, tokenInput); setToken(tokenInput); }}>
        <label>{t('accessToken')}<input type="password" required value={tokenInput} onChange={e => setTokenInput(e.target.value)} /></label>
        <button className="primary">{t('connect')}</button>
      </form><p>{connectionLabel(status, lang)}</p>
    </main>;
  }
  const phase = state && phases(state.draftMode)[state.currentPhase];
  const used = state ? [...state.blueBans, ...state.redBans, ...state.bluePicks, ...state.redPicks] : [];
  return <main className="workspace">
    <header className="topbar">
      <div><span className="eyebrow">{t(role === 'caster' ? 'casterEyebrow' : 'controlEyebrow')}</span><h1>{t('brandTitle')} <span>{t('brandSubtitle')}</span></h1></div>
      <div className="toolbar">
        <b className={connected ? 'status live' : 'status'}>{connectionLabel(status, lang)}</b>
        <span>{role === 'caster' ? t('delayedFeed', { seconds: snapshot?.casterDelaySeconds ?? '—' }) : t('controlRealtime')}</span>
        <button onClick={() => { sessionStorage.removeItem(`hok-${role}`); setToken(''); }}>{t('logout')}</button>
      </div>
    </header>
    {!connected && <p className="notice">{t('disconnectedNotice')}</p>}
    {connected && !compatible && <p className="notice">{t('backendUpgrade')}</p>}
    {error && <p role="alert" className="error">{errorMessage(error, lang)}</p>}
    {state ? <>
      <Board state={state} lang={lang} />
      {role === 'control' && <>
        <section className="operator-bar panel">
          <div className="toolbar">
            <button disabled={disabled || !snapshot?.canUndo} onClick={() => send({ type: 'undo' })}>{t('undo')}</button>
            <button disabled={disabled} onClick={() => confirm(t('confirmResetDraft')) && send({ type: 'reset_draft' })}>{t('resetDraft')}</button>
            <button className="danger" disabled={disabled} onClick={() => confirm(t('confirmResetMatch')) && send({ type: 'reset_match' })}>{t('resetMatch')}</button>
            <button onClick={() => setShowSettings(!showSettings)}>{t(showSettings ? 'hideSettings' : 'matchSettings')}</button>
          </div>
          <div className="delay-controls">
            <b>{t('casterDelay', { seconds: snapshot?.casterDelaySeconds ?? '—' })}</b>
            {[-10, -5, -1, 1, 5, 10].map(n => <button key={n}
              aria-label={t(n > 0 ? 'increaseDelay' : 'decreaseDelay', { seconds: Math.abs(n) })}
              disabled={disabled || (snapshot?.casterDelaySeconds || 0) + n < 0 || (snapshot?.casterDelaySeconds || 0) + n > 3600}
              onClick={() => send({ type: 'delay', seconds: (snapshot?.casterDelaySeconds || 0) + n })}>{n > 0 ? '+' : ''}{n} {t('secondsShort')}</button>)}
            <input aria-label={t('delayInput')} type="number" min={0} max={3600} value={delayInput} onChange={e => setDelayInput(Number(e.target.value))} />
            <button disabled={disabled} onClick={() => send({ type: 'delay', seconds: delayInput })}>{t('setDelay')}</button>
          </div>
        </section>
        {showSettings && <Settings key={JSON.stringify([state.blueTeam, state.redTeam, state.seriesFormat, state.stage, state.draftMode, state.draftRuleMode, state.language, state.overlayLayout])} state={state} send={send} disabled={disabled} />}
        <DraftLifecycle state={state} send={send} disabled={disabled} />
        <section className="panel">
          <div className="section-head">
            <h2>{phaseName(state, lang)}{phase && <small> · {t('selectHero')}</small>}</h2>
            <input aria-label={t('searchHeroes')} placeholder={t('searchHeroes')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {phase?.action === 'pick' && <p className="picking-for">{t('pickingFor', { player: state[`${phase.team}Team`].players[state[`${phase.team}Picks`].length] || t('playerNumber', { number: state[`${phase.team}Picks`].length + 1 }), slot: state[`${phase.team}Picks`].length + 1 })}</p>}
          <div className="filters">{lanes.map(r => <button key={r} className={filter === r ? 'selected' : ''} onClick={() => setFilter(r)}>{laneName(r, lang)}</button>)}</div>
          <p className="muted">{t('availabilityHint')}</p>
          <div className="hero-grid">{heroes.filter(h => (filter === 'all' || h.occupation === filter || h.altOccupation === filter)
            && `${h.englishName} ${h.chineseName} ${(h.aliases || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())).map(h => <button
            key={h.id} title={name(h.id, lang)} disabled={disabled || !phase || used.includes(h.id) || !!state.committedGameId || (phase.action === 'pick' && !!pickRestriction(state, phase.team, state[`${phase.team}Picks`].length, h.id))}
            onClick={() => phase && send({ type: 'draft_action', ...phase, heroId: h.id })}>
            <img src={h.imageLink} alt="" /><span>{name(h.id, lang)}</span>{phase?.action === 'pick' && pickRestriction(state, phase.team, state[`${phase.team}Picks`].length, h.id) && <small className="eligibility-reason">{t(pickRestriction(state, phase.team, state[`${phase.team}Picks`].length, h.id)!)}</small>}
          </button>)}</div>
        </section>
      </>}
      <DraftHistory state={state} />
      <Analysis state={state} lang={lang} />
    </> : <section className="panel"><h2>{t('connectingServer')}</h2></section>}
    <footer className="page-footer">{t('communitySystem')} · {t(role === 'caster' ? 'readOnlyFooter' : 'serverFooter')} · {t('rosterUpdated', { date: '2026-09-16' })}</footer>
  </main>;
}
