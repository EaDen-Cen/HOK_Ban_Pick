import heroes from '../components/HeroList';
import { historyForTeam } from './draftRules';
import { translator } from './i18n';
import type { MatchState } from './types';

export function DraftHistory({ state, compact = false }: { state: MatchState; compact?: boolean }) {
  const t = translator(state.language);
  return <section className={`draft-history ${compact ? 'compact' : 'panel'}`}>
    <header><h2>{t('historyTitle')}</h2>{!compact && <p className="muted">{t(({ normal: 'historyNormal', player: 'historyPlayer', global: 'historyGlobal' } as const)[state.draftRuleMode])}</p>}</header>
    {state.draftHistory.length ? state.draftHistory.map(record => <div key={record.id} className="history-game" data-game={record.gameNumber}>
      {(['blue', 'red'] as const).map(side => {
        const entry = historyForTeam(record, state[`${side}Team`].id);
        return <div key={side} className={`history-team ${side}`}>
          {!compact && <strong>{entry?.team.name}</strong>}
          <div className="history-heroes">{entry?.picks.map((id, index) => {
            const hero = heroes.find(h => h.id === id);
            const name = state.language === 'zh' ? hero?.chineseName : hero?.englishName;
            return <img key={index} src={hero?.imageLink} alt={name} title={`${name} · ${entry.team.players[index] || t('playerNumber', { number: index + 1 })}`} />;
          })}</div>
        </div>;
      })}
      <span className="history-game-number">{t('gameNumber', { number: record.gameNumber })}</span>
    </div>) : <p className="history-empty">{t('noHistory')}</p>}
  </section>;
}
