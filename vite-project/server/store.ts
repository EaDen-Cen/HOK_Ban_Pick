import { existsSync, mkdirSync, readFileSync, renameSync, openSync, writeSync, fsyncSync, closeSync } from 'node:fs';
import { dirname } from 'node:path';
import heroes from '../src/components/HeroList.js';
import { initialState, phases, type Action, type MatchState, type Role, type Snapshot } from '../src/shared/types.js';

interface Event { id: string; timestamp: number; type: string; resultingState: MatchState; revision: number }
interface Data { version: 1; state: MatchState; events: Event[]; history: MatchState[]; revision: number; delay: number; ids: string[] }
const copy = <T>(v: T): T => structuredClone(v);
function integer(v: unknown, min: number, max: number): asserts v is number {
  if (!Number.isInteger(v) || Number(v) < min || Number(v) > max) throw new Error(`Expected integer ${min}–${max}`);
}
function shortText(v: unknown, max: number): asserts v is string {
  if (typeof v !== 'string' || v.length > max) throw new Error('Invalid text');
}
export class Store {
  data: Data;
  constructor(private file?: string, private clock = Date.now) {
    this.data = file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {
      version: 1, state: initialState(), events: [], history: [], revision: 0, delay: 180, ids: [],
    };
    if (this.data.version !== 1 || !Array.isArray(this.data.events) || !Array.isArray(this.data.history)) throw new Error('Invalid store: restore a valid backup');
  }
  snapshot(role: Role): Snapshot {
    if (role === 'caster') {
      const cutoff = this.clock() - this.data.delay * 1000;
      const event = this.data.events.findLast(e => e.timestamp <= cutoff);
      return { type: 'match_state_update', state: copy(event?.resultingState ?? initialState()), revision: event?.revision ?? 0, casterDelaySeconds: this.data.delay };
    }
    return { type: 'match_state_update', state: copy(this.data.state), revision: this.data.revision,
      ...(role === 'control' ? { casterDelaySeconds: this.data.delay, canUndo: this.data.history.length > 0 } : {}) };
  }
  apply(id: string, revision: number, action: Action) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(id)) throw new Error('Invalid action ID');
    if (this.data.ids.includes(id)) return;
    if (revision !== this.data.revision) throw new Error('State changed: review the updated board and try again');
    if (!action || typeof action !== 'object') throw new Error('Invalid action');
    const next = copy(this.data);
    const state = next.state;
    switch (action.type) {
    case 'draft_action': {
      const phase = phases(state.draftMode)[state.currentPhase];
      if (!phase || phase.team !== action.team || phase.action !== action.action) throw new Error('Wrong draft phase');
      if (!heroes.some(h => h.id === action.heroId)) throw new Error('Unknown hero');
      if ([...state.blueBans, ...state.redBans, ...state.bluePicks, ...state.redPicks].includes(action.heroId)) throw new Error('Hero already selected');
      next.history.push(copy(state));
      state[`${phase.team}${phase.action === 'ban' ? 'Bans' : 'Picks'}`].push(action.heroId);
      state.currentPhase++;
      state.draftComplete = state.currentPhase === phases(state.draftMode).length;
      break;
    }
    case 'undo': {
      const previous = next.history.pop();
      if (!previous) throw new Error('Nothing to undo');
      next.state = previous;
      break;
    }
    case 'reset_draft':
      next.history.push(copy(state));
      Object.assign(state, { blueBans: [], redBans: [], bluePicks: [], redPicks: [], currentPhase: 0, draftComplete: false });
      break;
    case 'reset_match':
      next.history.push(copy(state)); next.state = initialState(); break;
    case 'settings': {
      const s = action.settings;
      if (!s || !['BO1', 'BO3', 'BO5'].includes(s.seriesFormat) || !['match', 'normal'].includes(s.draftMode)) throw new Error('Invalid match settings');
      integer(s.blueScore, 0, 3); integer(s.redScore, 0, 3); integer(s.gameNumber, 1, 5);
      const wins = (Number(s.seriesFormat.slice(2)) + 1) / 2;
      if (s.blueScore > wins || s.redScore > wins || (s.blueScore === wins && s.redScore === wins) || s.gameNumber > Number(s.seriesFormat.slice(2))) throw new Error('Score/game exceeds series format');
      shortText(s.stage, 80);
      for (const team of [s.blueTeam, s.redTeam]) {
        if (!team) throw new Error('Missing team');
        shortText(team.name, 60); shortText(team.logo, 1000);
        if (!team.name.trim()) throw new Error('Team name is required');
        if (team.logo && !/^https:\/\//.test(team.logo) && !/^\/(?!\/)/.test(team.logo)) throw new Error('Logo must be HTTPS or a local /path');
      }
      if (state.currentPhase > 0 && s.draftMode !== state.draftMode) throw new Error('Reset draft before changing mode');
      next.history.push(copy(state));
      Object.assign(state, { blueTeam: { name: s.blueTeam.name, logo: s.blueTeam.logo }, redTeam: { name: s.redTeam.name, logo: s.redTeam.logo },
        blueScore: s.blueScore, redScore: s.redScore, gameNumber: s.gameNumber, seriesFormat: s.seriesFormat, stage: s.stage, draftMode: s.draftMode });
      break;
    }
    case 'delay': integer(action.seconds, 0, 3600); next.delay = action.seconds; break;
    default: throw new Error('Unknown action');
    }
    next.revision++;
    if (action.type !== 'delay') next.events.push({ id, timestamp: Math.max(this.clock(), next.events.at(-1)?.timestamp ?? 0), type: action.type, resultingState: copy(next.state), revision: next.revision });
    next.ids = [...next.ids.slice(-999), id];
    // Commit durable state before acknowledging or broadcasting. Failure leaves memory unchanged.
    if (this.file) {
      mkdirSync(dirname(this.file), { recursive: true });
      const temporary = `${this.file}.tmp`;
      const fd = openSync(temporary, 'w');
      try { writeSync(fd, JSON.stringify(next)); fsyncSync(fd); } finally { closeSync(fd); }
      renameSync(temporary, this.file);
    }
    this.data = next;
  }
}
