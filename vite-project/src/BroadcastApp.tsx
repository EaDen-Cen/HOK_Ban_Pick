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
import { connectionLabel, lanes, laneName, phaseName, seriesName, stageName, teamName } from './shared/display';
import { translator } from './shared/i18n';
import { errorMessage } from './shared/errorMessages';
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
  return <section className="board"><div className="match-strip"><span>{t('gameTitle')}</span><span>{stageName(state.stage, lang)} · {t('gameNumber', { number: state.gameNumber })} · {seriesName(state.seriesFormat, lang)}</span></div>
    <div className="team-grid">{(['blue', 'red'] as const).map(side => <section key={side} className={`team ${side} ${phase?.team === side ? 'active' : ''}`}><header>{state[`${side}Team`].logo && <img className="logo" src={state[`${side}Team`].logo} alt="" />}<h2>{teamName(state, side, lang)}</h2><strong>{state[`${side}Score`]}</strong></header><div className="picks">{Array.from({ length: 5 }, (_, i) => <HeroSlot key={i} id={state[`${side}Picks`][i]} lang={lang} />)}</div><div className="bans"><small>{t('ban')}</small>{Array.from({ length: state.draftMode === 'match' ? 4 : 2 }, (_, i) => <HeroSlot key={i} id={state[`${side}Bans`][i]} ban lang={lang} />)}</div></section>)}</div>
    <footer className={`phase ${phase?.team || ''}`} key={state.currentPhase}>{phase ? `${phaseName(state, lang)} · ${t('phaseStep', { step: state.currentPhase + 1, total: phases(state.draftMode).length })}` : t('draftComplete')}</footer></section>;
}
function SideOverlay({
  state,
  lang,
}: {
  state: MatchState;
  lang: Language;
}) {
  const t = translator(lang);
  const phase = phases(state.draftMode)[state.currentPhase];

  return (
    <section className="side-overlay">

      <header className="side-overlay-header">
        <div className="side-team blue">
          {state.blueTeam.logo && (
            <img src={state.blueTeam.logo} alt="" />
          )}

          <strong>{teamName(state, 'blue', lang)}</strong>
          <b>{state.blueScore}</b>
        </div>

        <div className="side-match-info">
          <span>{stageName(state.stage, lang)}</span>
          <strong>
            {t('gameNumber', { number: state.gameNumber })} · {seriesName(state.seriesFormat, lang)}
          </strong>
        </div>

        <div className="side-team red">
          <b>{state.redScore}</b>
          <strong>{teamName(state, 'red', lang)}</strong>

          {state.redTeam.logo && (
            <img src={state.redTeam.logo} alt="" />
          )}
        </div>
      </header>

      <div className="side-ban-row">
        <div className="side-bans blue">
          {Array.from(
            { length: state.draftMode === 'match' ? 4 : 2 },
            (_, i) => (
              <HeroSlot
                key={i}
                id={state.blueBans[i]}
                ban
                lang={lang}
              />
            ),
          )}
        </div>

        <div />

        <div className="side-bans red">
          {Array.from(
            { length: state.draftMode === 'match' ? 4 : 2 },
            (_, i) => (
              <HeroSlot
                key={i}
                id={state.redBans[i]}
                ban
                lang={lang}
              />
            ),
          )}
        </div>
      </div>

      <div className="side-picks">

        <div className="side-pick-column blue">
          {Array.from({ length: 5 }, (_, i) => (
            <div className="side-player" key={i}>
              <HeroSlot
                id={state.bluePicks[i]}
                lang={lang}
              />

              <span>
                {state.blueTeam.players[i] ||
                  t('playerNumber', { number: i + 1 })}
              </span>
            </div>
          ))}
        </div>

        {/* 中间故意什么都不放。
            OBS 下方的游戏画面会从这里透出来。 */}
        <div className="game-window" />

        <div className="side-pick-column red">
          {Array.from({ length: 5 }, (_, i) => (
            <div className="side-player" key={i}>
              <span>
                {state.redTeam.players[i] ||
                  t('playerNumber', { number: i + 1 })}
              </span>

              <HeroSlot
                id={state.redPicks[i]}
                lang={lang}
              />
            </div>
          ))}
        </div>

      </div>

      {phase && (
        <div className={`side-phase ${phase.team}`}>
          {phaseName(state, lang)}
        </div>
      )}

    </section>
  );
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
      <div><span className="analysis-side">{t(side === 'blue' ? 'blueAnalysis' : 'redAnalysis')}</span><h2>{teamName(state, side, lang)}</h2></div>
      <span className="analysis-opponent">{t('opponent', { team: teamName(state, side === 'blue' ? 'red' : 'blue', lang) })}</span>
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
function Settings({
  state,
  send,
  disabled,
}: {
  state: MatchState;
  send: (a: Action) => void;
  disabled: boolean;
}) {
  const lang = state.language ?? 'zh';
  const t = translator(lang);
  const [form, setForm] = useState<MatchSettings>(() => ({
    ...state,
    blueTeam: { ...state.blueTeam, name: teamName(state, 'blue', lang) },
    redTeam: { ...state.redTeam, name: teamName(state, 'red', lang) },
    stage: stageName(state.stage, lang),
  }));

  const maxWins =
    (Number(form.seriesFormat.slice(2)) + 1) / 2;

  return (
    <form
      className="panel settings"
      onSubmit={e => {
        e.preventDefault();
        send({
          type: 'settings',
          settings: form,
        });
      }}
    >
      <h2>
        {t('matchSettings')}
      </h2>

      <div className="settings-grid">
        {(['blue', 'red'] as const).map(side => {
          const teamKey = `${side}Team` as const;
          const scoreKey = `${side}Score` as const;

          return (
            <div key={side}>
              <h3>
                {t(side === 'blue' ? 'blueTeam' : 'redTeam')}
              </h3>

              <label>
                {t('teamName')}

                <input
                  maxLength={60}
                  required
                  value={form[teamKey].name}
                  onChange={e =>
                    setForm({
                      ...form,
                      [teamKey]: {
                        ...form[teamKey],
                        name: e.target.value,
                      },
                    })
                  }
                />
              </label>

              <label>
                {t('logoAddress')}

                <input
                  placeholder={t('logoPlaceholder')}
                  value={form[teamKey].logo}
                  onChange={e =>
                    setForm({
                      ...form,
                      [teamKey]: {
                        ...form[teamKey],
                        logo: e.target.value,
                      },
                    })
                  }
                />
              </label>

              <div className="player-settings">
                <b>{t('players')}</b>

                {form[teamKey].players.map((player, index) => (
                  <div className="player-setting-row" key={index}>
                    <label>
                      {t('playerNumber', { number: index + 1 })}

                      <input
                        maxLength={40}
                        placeholder={t('playerNumber', { number: index + 1 })}
                        value={player}
                        onChange={e => {
                          const players = [...form[teamKey].players];
                          players[index] = e.target.value;

                          setForm({
                            ...form,
                            [teamKey]: {
                              ...form[teamKey],
                              players,
                            },
                          });
                        }}
                      />
                    </label>

                    <label>
                      {t('lane')}

                      <select
                        value={
                          form[teamKey].playerRoles?.[index] ??
                          (['clash', 'jungle', 'mid', 'farm', 'roam'] as const)[index]
                        }
                        onChange={e => {
                          const playerRoles = [
                            ...(form[teamKey].playerRoles ??
                              ['clash', 'jungle', 'mid', 'farm', 'roam']),
                          ];

                          playerRoles[index] =
                            e.target.value as typeof playerRoles[number];

                          setForm({
                            ...form,
                            [teamKey]: {
                              ...form[teamKey],
                              playerRoles,
                            },
                          });
                        }}
                      >
                        <option value="clash">{t('clash')}</option>
                        <option value="jungle">{t('jungle')}</option>
                        <option value="mid">{t('mid')}</option>
                        <option value="farm">{t('farm')}</option>
                        <option value="roam">{t('roam')}</option>
                      </select>
                    </label>
                  </div>
                ))}
              </div>

              <label>
                {t('seriesScore')}

                <div className="score-control">
                  <button
                    type="button"
                    aria-label={t('decreaseScore')}
                    disabled={form[scoreKey] <= 0}
                    onClick={() =>
                      setForm({
                        ...form,
                        [scoreKey]:
                          form[scoreKey] - 1,
                      })
                    }
                  >
                    −
                  </button>

                  <strong>
                    {form[scoreKey]}
                  </strong>

                  <button
                    type="button"
                    aria-label={t('increaseScore')}
                    disabled={
                      form[scoreKey] >= maxWins
                    }
                    onClick={() =>
                      setForm({
                        ...form,
                        [scoreKey]:
                          form[scoreKey] + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </label>
            </div>
          );
        })}

        <div>
          <h3>
            {t('matchDisplay')}
          </h3>

          <label>
            {t('stage')}

            <input
              value={form.stage}
              maxLength={80}
              onChange={e =>
                setForm({
                  ...form,
                  stage: e.target.value,
                })
              }
            />
          </label>

          <label>
            {t('seriesFormat')}

            <select
              value={form.seriesFormat}
              onChange={e => {
                const seriesFormat =
                  e.target
                    .value as MatchSettings['seriesFormat'];

                const newMaxWins =
                  (Number(
                    seriesFormat.slice(2),
                  ) +
                    1) /
                  2;

                setForm({
                  ...form,
                  seriesFormat,

                  blueScore: Math.min(
                    form.blueScore,
                    newMaxWins,
                  ),

                  redScore: Math.min(
                    form.redScore,
                    newMaxWins,
                  ),
                });
              }}
            >
              <option value="BO1">
                {t('bo1')}
              </option>

              <option value="BO3">
                {t('bo3')}
              </option>

              <option value="BO5">
                {t('bo5')}
              </option>
            </select>
          </label>

          <label>
            {t('currentGame')}
            <div className="readonly-field">
              {t('gameNumber', { number: Math.min(form.blueScore + form.redScore + 1, Number(form.seriesFormat.slice(2))) })}<span> · {t('automatic')}</span>
            </div>
          </label>

          <label>
            {t('draftMode')}

            <select
              value={form.draftMode}
              onChange={e =>
                setForm({
                  ...form,
                  draftMode:
                    e.target
                      .value as MatchSettings['draftMode'],
                })
              }
            >
              <option value="match">
                {t('matchMode')}
              </option>

              <option value="normal">
                {t('normalMode')}
              </option>
            </select>
          </label>

          <label>
            {t('language')}

            <select
              aria-label={t('language')}
              value={form.language}
              onChange={e =>
                setForm({
                  ...form,
                  language:
                    e.target
                      .value as MatchSettings['language'],
                })
              }
            >
              <option value="zh">
                {t('chinese')}
              </option>

              <option value="eng">
                {t('english')}
              </option>
            </select>
            <small>{t('languageHint')}</small>
          </label>

          <label>
            {t('overlayLayout')}

            <select
              value={form.overlayLayout}
              onChange={e =>
                setForm({
                  ...form,
                  overlayLayout:
                    e.target
                      .value as MatchSettings['overlayLayout'],
                })
              }
            >
              <option value="panel">
                {t('panelLayout')}
              </option>

              <option value="side">
                {t('sideLayout')}
              </option>
            </select>
          </label>
        </div>
      </div>

      <button
        disabled={disabled}
        className="primary"
      >
        {t('saveSettings')}
      </button>
    </form>
  );
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
  const connected = status === 'Connected', disabled = !connected || pending, state = snapshot?.state;
  const lang: Language = token && !['Invalid token', 'Access rejected'].includes(status) ? state?.language ?? lastLanguage : lastLanguage;
  const t = translator(lang);
  useEffect(() => {
    document.documentElement.lang = lang === 'eng' ? 'en' : 'zh-CN';
    document.title = translator(lang)('appName');
    sessionStorage.setItem(`hok-language-${role}`, lang);
    setLastLanguage(lang);
  }, [lang, role]);
  if (role === 'overlay') {
    return <main className="overlay">{state && (
      state.overlayLayout === 'side'
        ? <SideOverlay state={state} lang={lang} />
        : <Board state={state} lang={lang} />
    )}</main>;
  }
  if (!token || status === 'Invalid token' || status === 'Access rejected') {
    return <main className="login panel">
      <p>{t('appName')}</p><h1>{t(role === 'caster' ? 'casterLogin' : 'controlLogin')}</h1>
      <label>{t('language')}<select aria-label={t('language')} value={lang} onChange={e => setLastLanguage(e.target.value as Language)}>
        <option value="zh">{t('chinese')}</option><option value="eng">{t('english')}</option>
      </select></label>
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
        {showSettings && <Settings key={JSON.stringify([state.blueTeam, state.redTeam, state.blueScore, state.redScore, state.gameNumber, state.seriesFormat, state.stage, state.draftMode, state.language, state.overlayLayout])} state={state} send={send} disabled={disabled} />}
        <section className="panel">
          <div className="section-head">
            <h2>{phaseName(state, lang)}{phase && <small> · {t('selectHero')}</small>}</h2>
            <input aria-label={t('searchHeroes')} placeholder={t('searchHeroes')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filters">{lanes.map(r => <button key={r} className={filter === r ? 'selected' : ''} onClick={() => setFilter(r)}>{laneName(r, lang)}</button>)}</div>
          <p className="muted">{t('availabilityHint')}</p>
          <div className="hero-grid">{heroes.filter(h => (filter === 'all' || h.occupation === filter || h.altOccupation === filter)
            && `${h.englishName} ${h.chineseName} ${(h.aliases || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())).map(h => <button
            key={h.id} title={name(h.id, lang)} disabled={disabled || !phase || used.includes(h.id)}
            onClick={() => phase && send({ type: 'draft_action', ...phase, heroId: h.id })}>
            <img src={h.imageLink} alt="" /><span>{name(h.id, lang)}</span>
          </button>)}</div>
        </section>
      </>}
      <Analysis state={state} lang={lang} />
    </> : <section className="panel"><h2>{t('connectingServer')}</h2></section>}
    <footer className="page-footer">{t('communitySystem')} · {t(role === 'caster' ? 'readOnlyFooter' : 'serverFooter')} · {t('rosterUpdated', { date: '2026-09-16' })}</footer>
  </main>;
}
