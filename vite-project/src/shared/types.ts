export type Side = 'blue' | 'red';
export interface Team { name: string; logo: string }
export interface MatchState {
  blueTeam: Team; redTeam: Team; blueScore: number; redScore: number;
  gameNumber: number; seriesFormat: 'BO1' | 'BO3' | 'BO5'; stage: string;
  draftMode: 'match' | 'normal'; currentPhase: number; draftComplete: boolean;
  blueBans: number[]; redBans: number[]; bluePicks: number[]; redPicks: number[];
}
export type MatchSettings = Pick<MatchState, 'blueTeam' | 'redTeam' | 'blueScore' | 'redScore' | 'gameNumber' | 'seriesFormat' | 'stage' | 'draftMode'>;
export type Action = { type: 'draft_action'; team: Side; action: 'ban' | 'pick'; heroId: number }
  | { type: 'undo' | 'reset_draft' | 'reset_match' }
  | { type: 'settings'; settings: MatchSettings }
  | { type: 'delay'; seconds: number };
export type Role = 'control' | 'caster' | 'overlay';
export interface Snapshot {
  type: 'match_state_update'; state: MatchState; revision: number;
  casterDelaySeconds?: number; canUndo?: boolean;
}
export const initialState = (): MatchState => ({
  blueTeam: { name: 'TEAM BLUE', logo: '' }, redTeam: { name: 'TEAM RED', logo: '' },
  blueScore: 0, redScore: 0, gameNumber: 1, seriesFormat: 'BO3', stage: 'COMMUNITY TOURNAMENT',
  draftMode: 'match', currentPhase: 0, draftComplete: false,
  blueBans: [], redBans: [], bluePicks: [], redPicks: [],
});
export function phases(mode: MatchState['draftMode']) {
  const sequence = mode === 'match'
    ? 'bb rb bb rb bp rp rp bp bp rp rb bb rb bb rp bp bp rp'
    : 'bb bb rb rb bp rp rp bp bp rp rp bp bp rp';
  return sequence.split(' ').map(s => ({ team: (s[0] === 'b' ? 'blue' : 'red') as Side, action: (s[1] === 'b' ? 'ban' : 'pick') as 'ban' | 'pick' }));
}
