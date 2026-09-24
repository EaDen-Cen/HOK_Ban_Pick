import { initialState, type GameDraftRecord, type MatchState, type Side, type Team } from './types.js';

export const playerIdentity = (name: string) => name.normalize('NFKC').trim().toLocaleLowerCase('en-US');
export const seriesWins = (state: MatchState) => (Number(state.seriesFormat.slice(2)) + 1) / 2;
export const seriesFinished = (state: MatchState) => Math.max(state.blueScore, state.redScore) >= seriesWins(state);
export const ruleLocked = (state: MatchState) => state.currentPhase > 0 || state.draftHistory.length > 0;
export const currentGame = (state: MatchState) => state.draftGameNumber ?? state.gameNumber;
export const displaySides = (state: MatchState): [Side, Side] => [state.displayLeftSide, state.displayLeftSide === 'blue' ? 'red' : 'blue'];

export function historyForTeam(record: GameDraftRecord, teamId: string) {
  if (record.blueTeam.id === teamId) return { team: record.blueTeam, picks: record.bluePicks };
  if (record.redTeam.id === teamId) return { team: record.redTeam, picks: record.redPicks };
  return undefined;
}

/** Current-game bans/duplicates are checked separately. History never consumes ban slots. */
export function pickRestriction(state: MatchState, side: Side, playerIndex: number, heroId: number): 'playerMissing' | 'usedByPlayer' | 'usedByTeam' | undefined {
  if (state.draftRuleMode === 'normal') return;
  const team = state[`${side}Team`];
  if (state.draftRuleMode === 'global') {
    if (state.draftHistory.some(record => record.id !== state.committedGameId && historyForTeam(record, team.id)?.picks.includes(heroId))) return 'usedByTeam';
    return;
  }
  const identity = playerIdentity(team.players[playerIndex] || '');
  if (!identity) return 'playerMissing';
  // Identity follows the person when a substitute changes slots or a team changes sides.
  if (state.draftHistory.some(record => record.id !== state.committedGameId && (['blue', 'red'] as const).some(recordSide =>
    record[`${recordSide}Team`].players.some((player, index) => playerIdentity(player) === identity && record[`${recordSide}Picks`][index] === heroId)))) return 'usedByPlayer';
}

/** Avoid spending a ban on a hero the opposing team cannot reuse in Global BP. */
export function banRestriction(state: MatchState, side: Side, heroId: number): 'opponentAlreadyUsed' | undefined {
  if (state.draftRuleMode !== 'global') return;
  const opponent = state[side === 'blue' ? 'redTeam' : 'blueTeam'];
  if (state.draftHistory.some(record => record.id !== state.committedGameId && historyForTeam(record, opponent.id)?.picks.includes(heroId))) return 'opponentAlreadyUsed';
}

export function draftRestriction(state: MatchState, side: Side, action: 'ban' | 'pick', heroId: number) {
  return action === 'ban' ? banRestriction(state, side, heroId) : pickRestriction(state, side, state[`${side}Picks`].length, heroId);
}

/** Upgrade every saved snapshot, including undo and delayed events. Never infer history from picks. */
export function normalizeState(raw: MatchState): MatchState {
  const defaults = initialState();
  const normalizeTeam = (team: Partial<Team> | undefined, side: Side): Team => {
    const fallback = defaults[`${side}Team`];
    return { ...fallback, ...team, id: team?.id || fallback.id,
      players: Array.from({ length: 5 }, (_, i) => team?.players?.[i] ?? ''),
      playerRoles: Array.from({ length: 5 }, (_, i) => team?.playerRoles?.[i] ?? fallback.playerRoles[i]),
      playerPortraits: Array.from({ length: 5 }, (_, i) => team?.playerPortraits?.[i] ?? ''),
    };
  };
  const state = { ...defaults, ...raw,
    blueTeam: normalizeTeam(raw.blueTeam, 'blue'), redTeam: normalizeTeam(raw.redTeam, 'red'),
    draftHistory: (raw.draftHistory ?? []).map(record => ({ ...record,
      firstPickSide: record.firstPickSide ?? 'blue',
      blueTeam: normalizeTeam(record.blueTeam, 'blue'), redTeam: normalizeTeam(record.redTeam, 'red'),
    })),
  };
  // Old archives use independent games. Upgrading must not silently impose Global BP.
  state.draftRuleMode = raw.draftRuleMode ?? 'normal';
  state.displayLeftSide = raw.displayLeftSide ?? 'blue';
  state.firstPickSide = raw.firstPickSide ?? 'blue';
  state.sideSwapMode = raw.sideSwapMode ?? 'moveTeams';
  state.draftGameNumber = raw.draftGameNumber ?? (raw.currentPhase > 0 ? raw.gameNumber : null);
  return state;
}
