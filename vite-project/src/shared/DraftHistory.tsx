import { heroForState } from './heroData';
import { displaySides, historyForTeam } from './draftRules';
import { translator } from './i18n';
import type { MatchState } from './types';
import { heroIconStyle } from './heroIcon';

export function DraftHistory({ state, compact = false }: { state: MatchState; compact?: boolean }) {
  const t = translator(state.language);
  if (!state.draftHistory.length) return null;
  return <section className={`draft-history ${compact ? 'compact' : 'panel'}`}>
    <header><h2>{t('historyTitle')}</h2>{!compact && <p className="muted">{t(({ normal: 'historyNormal', player: 'historyPlayer', global: 'historyGlobal' } as const)[state.draftRuleMode])}</p>}</header>
    {state.draftHistory.length ? state.draftHistory.map(record => <div key={record.id} className="history-game" data-game={record.gameNumber}>
      {displaySides(state).map((side, position) => {
        const entry = historyForTeam(record, state[`${side}Team`].id);
        return <div key={side} className={`history-team ${side} display-${position === 0 ? 'left' : 'right'}`}>
          {!compact && <strong>{entry?.team.name}</strong>}
          <div className="history-heroes">{entry?.assignments.map((id, index) => {
            const hero = heroForState(state, id);
            const name = state.language === 'zh' ? hero?.chineseName : hero?.englishName;
            const title = `${name} · ${entry.team.players[entry.playerSlotOrder[index]] || t('playerNumber', { number: index + 1 })}`;
            return <span key={index} className="history-hero-icon" title={title}><img src={hero?.imageLink} alt={name} style={heroIconStyle(hero)} /></span>;
          })}</div>
        </div>;
      })}
      <span className="history-game-number">{t('gameNumber', { number: record.gameNumber })}</span>
    </div>) : <p className="history-empty">{t('noHistory')}</p>}
  </section>;
}
