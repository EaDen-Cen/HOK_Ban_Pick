import heroes from '../components/HeroList';
import { currentGame } from '../shared/draftRules';
import { DraftHistory } from '../shared/DraftHistory';
import { draftRuleName, phaseName, stageName } from '../shared/display';
import { translator } from '../shared/i18n';
import { phases, type MatchState, type PlayerRole, type Side } from '../shared/types';

const rolePaths: Record<PlayerRole, string> = {
  clash: 'M7 4 20 17l-3 3L4 7V4h3Zm13 0h-3L4 17l3 3L20 7V4ZM3 21l4-4m10 0 4 4',
  jungle: 'M12 22C4 16 3 10 4 4l6 6L12 2l2 8 6-6c1 6 0 12-8 18ZM12 11v9',
  mid: 'm3 17 14-14 4 4L7 21l-4-4Zm0-9V3h5m8 18h5v-5',
  farm: 'M5 3c15 1 15 17 0 18l8-9L5 3Zm0 0v18M3 12h18m-3-3 3 3-3 3',
  roam: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm0 4v11m-4-7h8',
};
export function PositionIcon({ role, label }: { role: PlayerRole; label: string }) {
  return <svg className="position-icon" viewBox="0 0 24 24" role="img" aria-label={label}><title>{label}</title><path d={rolePaths[role]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function PickCard({ state, side, index }: { state: MatchState; side: Side; index: number }) {
  const t = translator(state.language), team = state[`${side}Team`];
  const id = state[`${side}Picks`][index], hero = heroes.find(h => h.id === id);
  const heroName = hero ? (state.language === 'zh' ? hero.chineseName : hero.englishName) : t('emptyPick');
  const player = team.players[index] || t('playerNumber', { number: index + 1 });
  const role = team.playerRoles[index];
  return <article className={`broadcast-card ${hero ? 'filled' : ''}`} data-slot={index}>
    <div className="hero-slot broadcast-art" key={id || 'empty'}>{hero ? <img src={hero.imageLink} alt={heroName} /> : <span className="empty">{String(index + 1).padStart(2, '0')}</span>}</div>
    <div className="card-caption"><strong title={heroName}>{heroName}</strong><span title={player}>{player}</span></div>
    <div className="position-bar"><PositionIcon role={role} label={t(role)} /></div>
  </article>;
}
export function DraftOverlay({ state }: { state: MatchState }) {
  const t = translator(state.language), phase = phases(state.draftMode)[state.currentPhase];
  return <section className={`broadcast-overlay broadcast-${state.overlayLayout}`}>
    <header className="broadcast-header">
      <div className="broadcast-brand">{t('gameTitle')}</div>
      <div className="broadcast-meta">{stageName(state.stage, state.language)} · {state.seriesFormat} · {t('gameNumber', { number: currentGame(state) })} · {draftRuleName(state)}</div>
      <div className="broadcast-team blue">{state.blueTeam.logo && <img src={state.blueTeam.logo} alt="" />}<h2>{state.blueTeam.name}</h2></div>
      <div className="broadcast-score" aria-label={t('seriesScore')}><strong className="blue-score">{state.blueScore}</strong><span>:</span><strong className="red-score">{state.redScore}</strong></div>
      <div className="broadcast-team red"><h2>{state.redTeam.name}</h2>{state.redTeam.logo && <img src={state.redTeam.logo} alt="" />}</div>
    </header>
    <DraftHistory state={state} compact />
    <div className="broadcast-bans">{(['blue', 'red'] as const).map(side => <div className={`ban-team ${side}`} key={side}><span>{t(side === 'blue' ? 'blueSide' : 'redSide')} · {t('ban')}</span><div className="bans">
      {Array.from({ length: state.draftMode === 'match' ? 4 : 2 }, (_, index) => {
        const hero = heroes.find(h => h.id === state[`${side}Bans`][index]);
        const label = hero ? (state.language === 'zh' ? hero.chineseName : hero.englishName) : t('ban');
        return <div className="hero-slot ban" key={index} title={label}>{hero ? <><img src={hero.imageLink} alt={label} /><b className="ban-mark">╱</b></> : <span className="empty">—</span>}</div>;
      })}</div></div>)}</div>
    <div className="broadcast-picks">{(['blue', 'red'] as const).map(side => <div key={side} className={`pick-team ${side} ${phase?.team === side ? 'acting' : ''}`}>{Array.from({ length: 5 }, (_, index) => <PickCard key={index} state={state} side={side} index={index} />)}</div>)}</div>
    <footer className={`phase ${phase?.team || ''}`}>{state.committedGameId ? t('gameCommitted') : phaseName(state)}</footer>
  </section>;
}
