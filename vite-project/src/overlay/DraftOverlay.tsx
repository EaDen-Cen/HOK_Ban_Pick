import heroes from '../components/HeroList';
import { Score } from '../shared/Score';
import { HeroReveal } from './HeroReveal';
import { PlayerPortrait } from '../shared/PlayerPortrait';
import { currentGame, displaySides } from '../shared/draftRules';
import { DraftHistory } from '../shared/DraftHistory';
import { draftRuleName, phaseName, stageName } from '../shared/display';
import { translator } from '../shared/i18n';
import { phases, type MatchState, type PlayerRole, type Side } from '../shared/types';
import { heroArtCrop } from '../data/heroArtFocus';

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

function HeroArtwork({ hero, alt, layout }: { hero: (typeof heroes)[number]; alt: string; layout: MatchState['overlayLayout'] }) {
  const primary = hero.artLink || hero.imageLink;
  const crop = heroArtCrop(hero.id, layout);
  const position = hero.artPosition || `${crop.x}% ${crop.y}%`;
  return <img
    className={`hero-art ${hero.artLink ? 'hero-art-full' : 'hero-art-icon'}`}
    src={primary}
    alt={alt}
    style={{
      objectPosition: position,
      transform: hero.artLink ? `scale(${crop.scale})` : undefined,
      transformOrigin: position,
    }}
    onError={event => {
      // Full official art is intentionally remote to avoid shipping hundreds of
      // megabytes in the repo. If the CDN is unavailable during a match, fall
      // back to the small local icon rather than leaving a blank card.
      if (event.currentTarget.src.endsWith(hero.imageLink)) return;
      event.currentTarget.src = hero.imageLink;
      event.currentTarget.classList.remove('hero-art-full');
      event.currentTarget.classList.add('hero-art-icon');
      event.currentTarget.style.objectPosition = '50% 50%';
      event.currentTarget.style.transform = 'none';
      event.currentTarget.style.transformOrigin = '50% 50%';
    }}
  />;
}
function PickCard({ state, side, index, position }: { state: MatchState; side: Side; index: number; position: 'left' | 'right' }) {
  const t = translator(state.language), team = state[`${side}Team`];
  const id = state[`${side}Picks`][index], hero = heroes.find(h => h.id === id);
  const heroName = hero ? (state.language === 'zh' ? hero.chineseName : hero.englishName) : t('emptyPick');
  const player = team.players[index] || t('playerNumber', { number: index + 1 });
  const role = team.playerRoles[index];
  return <article className={`broadcast-card ${hero ? 'filled' : ''}`} data-slot={index} data-team-id={team.id}>
    <HeroReveal heroId={id} layout={state.overlayLayout} position={position} renderArt={shownId => {
      const shown = heroes.find(h => h.id === shownId);
      return shown ? <HeroArtwork hero={shown} alt={state.language === 'zh' ? shown.chineseName : shown.englishName} layout={state.overlayLayout} /> :
        <PlayerPortrait key={team.playerPortraits[index] + team.logo} portrait={team.playerPortraits[index]} logo={team.logo} label={player} slot={index} />;
    }} caption={<><strong title={heroName}>{heroName}</strong><span title={player}>{player}</span></>} />
    <div className="position-bar"><PositionIcon role={role} label={t(role)} /></div>
  </article>;
}
export function DraftOverlay({ state }: { state: MatchState }) {
  const t = translator(state.language), phase = phases(state.draftMode, state.firstPickSide)[state.currentPhase];
  const sides = displaySides(state), [left, right] = sides;
  return <section className={`broadcast-overlay broadcast-${state.overlayLayout}`}>
    <div className="broadcast-top"><header className="broadcast-header">
      <div className="broadcast-brand">{t('gameTitle')}</div>
      <div className="broadcast-meta">{stageName(state.stage, state.language)} · {state.seriesFormat} · {t('gameNumber', { number: currentGame(state) })} · {draftRuleName(state)}</div>
      {sides.map((side, position) => <div key={state[`${side}Team`].id} className={`broadcast-team ${side} display-${position === 0 ? 'left' : 'right'}`}>
        {state[`${side}Team`].logo && <img src={state[`${side}Team`].logo} alt="" />}
        <h2>{state[`${side}Team`].name}</h2><small className="color-label">{t(side === 'blue' ? 'blueSide' : 'redSide')}</small>
      </div>)}
      <div className="broadcast-score" aria-label={t('seriesScore')}><Score state={state} side={left} /><span>:</span><Score state={state} side={right} /></div>
    </header></div>
    <div className="broadcast-center" aria-hidden="true" />
    <div className="broadcast-bottom">
      {state.draftHistory.length > 0 && <DraftHistory state={state} compact />}
      <div className="broadcast-bans">{sides.map((side, position) => <div className={`ban-team ${side} display-${position === 0 ? 'left' : 'right'}`} key={state[`${side}Team`].id}><span>{t(side === 'blue' ? 'blueSide' : 'redSide')} · {t('ban')}</span><div className="bans">
        {Array.from({ length: state.draftMode === 'match' ? 4 : 2 }, (_, index) => {
          const hero = heroes.find(h => h.id === state[`${side}Bans`][index]);
          const label = hero ? (state.language === 'zh' ? hero.chineseName : hero.englishName) : t('ban');
          return <div className="hero-slot ban" key={index} title={label}>{hero ? <><img src={hero.imageLink} alt={label} /><b className="ban-mark">╱</b><span className="ban-name">{label}</span></> : <span className="empty">—</span>}</div>;
        })}</div></div>)}</div>
      <div className="broadcast-picks">{sides.map((side, position) => <div key={state[`${side}Team`].id} className={`pick-team ${side} display-${position === 0 ? 'left' : 'right'} ${phase?.team === side ? 'acting' : ''}`}>
        {Array.from({ length: 5 }, (_, index) => <PickCard key={index} state={state} side={side} index={index} position={position === 0 ? 'left' : 'right'} />)}
      </div>)}</div>
      <footer className={`phase ${phase?.team || ''}`}>{state.committedGameId ? t('gameCommitted') : phaseName(state)}</footer>
    </div>
  </section>;
}
