import { currentGame, displaySides, seriesFinished } from '../shared/draftRules';
import { translator } from '../shared/i18n';
import type { Action, MatchState } from '../shared/types';

export function DraftLifecycle({ state, disabled, send }: { state: MatchState; disabled: boolean; send: (action: Action) => void }) {
  const t = translator(state.language);
  return <section className="panel lifecycle">
    <p className="side-summary">{displaySides(state).map((side, index) => <span key={side} className={side}>{t(index === 0 ? 'screenLeft' : 'screenRight')}: {state[`${side}Team`].name} · {t(side === 'blue' ? 'blueSide' : 'redSide')}</span>)}<span>{t('firstPickSide')}: {t(state.firstPickSide === 'blue' ? 'blueSide' : 'redSide')}</span><span>{t('sideSwapMode')}: {t(state.sideSwapMode)}</span></p>
    <div className="toolbar">
      <button className="primary" disabled={disabled || !state.draftComplete || !!state.committedGameId} onClick={() => confirm(t('confirmCommit')) && send({ type: 'commit_game' })}>{t(state.committedGameId ? 'gameCommitted' : 'commitGame')}</button>
      <button disabled={disabled || !state.committedGameId || state.gameNumber !== currentGame(state) + 1 || seriesFinished(state)} onClick={() => confirm(t('confirmNext')) && send({ type: 'next_game' })}>{t('nextGame')}</button>
      <button disabled={disabled || state.currentPhase > 0 || !!state.committedGameId} onClick={() => confirm(t(state.sideSwapMode === 'colorsOnly' ? 'confirmColorsSwap' : 'confirmSwap')) && send({ type: 'swap_sides' })}>{t('swapSides')}</button>
    </div>
    <p className="muted">{t('lifecycleHint')}</p>
  </section>;
}
