import heroes from '../components/HeroList';
import { currentGame, seriesFinished } from '../shared/draftRules';
import { translator } from '../shared/i18n';
import type { Action, MatchState } from '../shared/types';

export function DraftLifecycle({ state, disabled, send }: { state: MatchState; disabled: boolean; send: (action: Action) => void }) {
  const t = translator(state.language);
  return <section className="panel lifecycle">
    <div className="toolbar">
      <button className="primary" disabled={disabled || !state.draftComplete || !!state.committedGameId} onClick={() => confirm(t('confirmCommit')) && send({ type: 'commit_game' })}>{t(state.committedGameId ? 'gameCommitted' : 'commitGame')}</button>
      <button disabled={disabled || !state.committedGameId || state.gameNumber !== currentGame(state) + 1 || seriesFinished(state)} onClick={() => confirm(t('confirmNext')) && send({ type: 'next_game' })}>{t('nextGame')}</button>
      <button disabled={disabled || state.currentPhase > 0 || !!state.committedGameId} onClick={() => confirm(t('confirmSwap')) && send({ type: 'swap_sides' })}>{t('swapSides')}</button>
    </div>
    <p className="muted">{t('lifecycleHint')}</p>
    {state.draftComplete && !state.committedGameId && <div className="assignments">
      <h2>{t('assignmentTitle')}</h2><p className="muted">{t('assignmentHint')}</p>
      <div className="assignment-teams">{(['blue', 'red'] as const).map(side => <section key={side} className={`assignment-team ${side}`}>
        <h3>{state[`${side}Team`].name}</h3>
        {state[`${side}Picks`].map((id, index) => <label key={index}>{state[`${side}Team`].players[index] || t('playerNumber', { number: index + 1 })}
          <select value={id} disabled={disabled} onChange={event => send({ type: 'swap_picks', team: side, from: index, to: state[`${side}Picks`].indexOf(Number(event.target.value)) })}>
            {state[`${side}Picks`].map(heroId => {
              const hero = heroes.find(h => h.id === heroId);
              return <option value={heroId} key={heroId}>{state.language === 'zh' ? hero?.chineseName : hero?.englishName}</option>;
            })}
          </select>
        </label>)}
      </section>)}</div>
    </div>}
  </section>;
}
