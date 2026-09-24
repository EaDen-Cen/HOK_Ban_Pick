import { useEffect, useRef, useState } from 'react';
import heroes from '../components/HeroList';
import { draftRestriction } from '../shared/draftRules';
import { lanes, laneName, phaseName } from '../shared/display';
import { translator } from '../shared/i18n';
import { phases, type Action, type MatchState } from '../shared/types';

export function ControlHeroPicker({ state, disabled, active, send, acknowledged }: {
  state: MatchState; disabled: boolean; active: boolean; send: (action: Action) => void;
  acknowledged?: { id: string; action: Action };
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [recorded, setRecorded] = useState<Extract<Action, {type:'draft_action'}>>();
  const searchInput = useRef<HTMLInputElement>(null);
  const activeRef = useRef(active); activeRef.current = active;
  const t = translator(state.language), phase = phases(state.draftMode, state.firstPickSide)[state.currentPhase];
  const used = [...state.blueBans, ...state.redBans, ...state.bluePicks, ...state.redPicks];
  const visible = heroes.filter(h => (filter === 'all' || h.occupation === filter || h.altOccupation === filter)
    && `${h.englishName} ${h.chineseName} ${(h.aliases || []).join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
  const unavailable = (id: number) => disabled || !phase || !!state.committedGameId || used.includes(id) || !!draftRestriction(state, phase.team, phase.action, id);
  const eligible = visible.filter(h => !unavailable(h.id));
  useEffect(() => {
    if (acknowledged?.action.type !== 'draft_action') { setRecorded(undefined); return; }
    setSearch(''); setRecorded(acknowledged.action);
    const frame = requestAnimationFrame(() => { if (activeRef.current) searchInput.current?.focus({ preventScroll: true }); });
    const timer = setTimeout(() => setRecorded(undefined), 1000);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [acknowledged]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (!active || event.isComposing || event.repeat || document.querySelector('dialog[open]')) return;
      const target = event.target as HTMLElement;
      const editing = target.closest('input, textarea, select, [contenteditable="true"]');
      if (editing && target !== searchInput.current) return;
      if ((!event.ctrlKey && !event.metaKey && event.key === '/') || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault(); searchInput.current?.focus({ preventScroll: true }); searchInput.current?.select();
      }
      if (event.key === 'Escape') { event.preventDefault(); setSearch(''); }
    }
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, [active]);
  const recordedHero = recorded && heroes.find(h => h.id === recorded.heroId);
  return <section className="panel control-hero-picker">
    <div className={`picker-heading side-${phase?.team || 'none'}`}>
      <div className="current-phase" aria-live="polite">
        <h2>{phaseName(state, state.language)}</h2>
        {phase && <span>{phase.action === 'ban' ? t('banCount', {number:state[`${phase.team}Bans`].length + 1,total:state.draftMode === 'match' ? 4 : 2}) : t('pickingFor', {player:state[`${phase.team}Team`].players[state[`${phase.team}Picks`].length] || t('playerNumber',{number:state[`${phase.team}Picks`].length + 1}),slot:state[`${phase.team}Picks`].length + 1})}</span>}
        {phase && <small>{t('phaseStep',{step:state.currentPhase+1,total:phases(state.draftMode,state.firstPickSide).length})}</small>}
      </div>
      <input ref={searchInput} aria-label={t('searchHeroes')} placeholder={t('searchHeroes')} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => {
        if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229 || e.repeat) return;
        e.preventDefault();
        if (active && phase && eligible.length === 1) send({type:'draft_action',...phase,heroId:eligible[0].id});
      }} />
      <p className="quick-input-hint">{t('quickInputHint')}</p>
      <div className="record-feedback" role="status">{recorded && recordedHero && t('recordAccepted',{side:t(recorded.team === 'blue' ? 'blueSide' : 'redSide'),action:t(recorded.action === 'ban' ? 'banAction' : 'pickAction'),hero:state.language === 'zh' ? recordedHero.chineseName : recordedHero.englishName})}</div>
      <div className="filters">{lanes.map(r => <button key={r} className={filter === r ? 'selected' : ''} onClick={() => setFilter(r)}>{laneName(r,state.language)}</button>)}</div>
    </div>
    <div className="hero-grid-scroll"><div className="hero-grid">{visible.map(h => {
      const reason = phase && draftRestriction(state,phase.team,phase.action,h.id);
      const label = state.language === 'zh' ? h.chineseName : h.englishName;
      return <button key={h.id} title={label} disabled={unavailable(h.id)} onClick={() => phase && send({type:'draft_action',...phase,heroId:h.id})}>
        <img src={h.imageLink} alt=""/><span>{label}</span>{reason && <small className="eligibility-reason">{t(reason)}</small>}
      </button>;
    })}</div>{!visible.length && <p className="muted">{t('noMatchingHeroes')}</p>}</div>
    <small className="picker-note">{t('availabilityHint')}</small>
  </section>;
}
