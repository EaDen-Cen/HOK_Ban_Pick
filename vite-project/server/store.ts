import { existsSync, mkdirSync, readFileSync, renameSync, openSync, writeSync, fsyncSync, closeSync } from 'node:fs';
import type { TeamPresetStore } from './teamPresets.js';
import { dirname } from 'node:path';
import heroes from '../src/components/HeroList.js';
import { initialState, phases, type Action, type MatchState, type Role, type Snapshot } from '../src/shared/types.js';
import { currentGame, draftRestriction, normalizeState, pickRestriction, playerIdentity, ruleLocked, seriesFinished } from '../src/shared/draftRules.js';

interface Event { id: string; timestamp: number; type: string; resultingState: MatchState; revision: number }
interface Data { version: 1; state: MatchState; events: Event[]; history: MatchState[]; revision: number; delay: number; ids: string[] }
const copy = <T>(v: T): T => structuredClone(v);
function integer(v: unknown, min: number, max: number): asserts v is number {
  if (!Number.isInteger(v) || Number(v) < min || Number(v) > max) throw new Error(`请输入 ${min} 至 ${max} 之间的整数`);
}
function shortText(v: unknown, max: number): asserts v is string {
  if (typeof v !== 'string' || v.length > max) throw new Error(`文字格式不正确，最多可输入 ${max} 个字符`);
}
function validateArtCrop(crop: unknown) {
  if (!crop || typeof crop !== 'object') throw new Error('heroArtCropInvalid');
  const value = crop as { x?: unknown; y?: unknown; scale?: unknown };
  if (typeof value.x !== 'number' || !Number.isFinite(value.x) || value.x < 0 || value.x > 100) throw new Error('heroArtCropInvalid');
  if (typeof value.y !== 'number' || !Number.isFinite(value.y) || value.y < 0 || value.y > 100) throw new Error('heroArtCropInvalid');
  if (typeof value.scale !== 'number' || !Number.isFinite(value.scale) || value.scale < 1 || value.scale > 3) throw new Error('heroArtCropInvalid');
}
function portraitURL(value: unknown): asserts value is string {
  shortText(value, 1000);
  if (!value) return;
  if (/\s|\\/.test(value) || [...value].some(char => char.charCodeAt(0) < 32)) throw new Error('portraitInvalid');
  if (/^\/(?!\/)/.test(value)) return;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.hostname && !url.username && !url.password) return;
  } catch { /* Reject invalid URLs below. */ }
  throw new Error('portraitInvalid');
}
function clearDraft(state: MatchState) {
  Object.assign(state, { blueBans: [], redBans: [], bluePicks: [], redPicks: [], currentPhase: 0, draftComplete: false, draftGameNumber: null, committedGameId: null });
}
function validateScores(blue: number, red: number, format: MatchState['seriesFormat']) {
  integer(blue, 0, 3); integer(red, 0, 3);
  const wins = (Number(format.slice(2)) + 1) / 2;
  if (blue > wins || red > wins || (blue === wins && red === wins)) throw new Error('比分或局数不符合当前赛制');
}
function validatePicks(state: MatchState) {
  for (const side of ['blue', 'red'] as const) {
    for (const [index, heroId] of state[`${side}Picks`].entries()) {
      const reason = pickRestriction(state, side, index, heroId);
      if (reason) throw new Error(reason);
    }
  }
}
export class Store {
  data: Data;
  constructor(private file?: string, private clock = Date.now, private presets?: TeamPresetStore) {
    this.data = file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {
      version: 1, state: initialState(), events: [], history: [], revision: 0, delay: 180, ids: [],
    };
    if (this.data.version !== 1 || !Array.isArray(this.data.events) || !Array.isArray(this.data.history)) throw new Error('比赛存档无效，请恢复有效备份');
    this.data.state = normalizeState(this.data.state);
    this.data.history = this.data.history.map(normalizeState);
    this.data.events = this.data.events.map(event => ({ ...event, resultingState: normalizeState(event.resultingState) }));
  }
  snapshot(role: Role): Snapshot {
    if (role === 'caster') {
      const cutoff = this.clock() - this.data.delay * 1000;

      const event = [...this.data.events]
        .reverse()
        .find(e => e.timestamp <= cutoff);

      return {
        type: 'match_state_update',
        state: copy(event?.resultingState ?? initialState()),
        revision: event?.revision ?? 0,
        casterDelaySeconds: this.data.delay,
      };
    }

    return {
      type: 'match_state_update',
      state: copy(this.data.state),
      revision: this.data.revision,
      ...(role === 'control'
        ? {
          casterDelaySeconds: this.data.delay,
          canUndo: this.data.history.length > 0,
        }
        : {}),
    };
  }
  apply(id: string, revision: number, action: Action) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(id)) throw new Error('操作编号无效，请刷新页面后重试');
    if (this.data.ids.includes(id)) return;
    if (revision !== this.data.revision) throw new Error('比赛状态已更新，请确认当前选禁结果后重试');
    if (!action || typeof action !== 'object') throw new Error('操作无效');
    const next = copy(this.data);
    const state = next.state;
    switch (action.type) {
    case 'load_team_preset': {
      if (state.currentPhase !== 0 || state.draftHistory.length || state.committedGameId) throw new Error('presetLocked');
      if (!['blue', 'red'].includes(action.side)) throw new Error('presetInvalid');
      const preset = this.presets?.get(action.presetId);
      if (!preset) throw new Error('presetMissing');
      const other = state[action.side === 'blue' ? 'redTeam' : 'blueTeam'];
      if (other.id === preset.id) throw new Error('presetDuplicate');
      if (state.draftRuleMode === 'player') {
        const ids = [...other.players, ...preset.players].map(playerIdentity).filter(Boolean);
        if (new Set(ids).size !== ids.length) throw new Error('duplicatePlayerIds');
      }
      next.history.push(copy(state));
      state[action.side === 'blue' ? 'blueTeam' : 'redTeam'] = { id: preset.id, name: preset.name, logo: preset.logo, players: [...preset.players], playerRoles: [...preset.playerRoles], playerPortraits: [...preset.playerPortraits] };
      break;
    }
    case 'draft_action': {
      if (state.committedGameId) throw new Error('gameAlreadyCommitted');
      if (state.draftRuleMode === 'player' && [...state.blueTeam.players, ...state.redTeam.players].some(player => !playerIdentity(player))) throw new Error('playerMissing');
      if (state.currentPhase === 0 && (seriesFinished(state) || state.draftHistory.some(game => game.gameNumber >= state.gameNumber))) throw new Error('updateScoreBeforeNext');
      const phase = phases(state.draftMode, state.firstPickSide)[state.currentPhase];
      if (!phase || phase.team !== action.team || phase.action !== action.action) throw new Error('当前选禁阶段不支持此操作，请确认轮次和队伍');
      if (!heroes.some(h => h.id === action.heroId)) throw new Error('找不到该英雄');
      if ([...state.blueBans, ...state.redBans, ...state.bluePicks, ...state.redPicks].includes(action.heroId)) throw new Error('该英雄已被选择或禁用');
      const reason = draftRestriction(state, phase.team, phase.action, action.heroId);
      if (reason) throw new Error(reason);
      next.history.push(copy(state));
      state.draftGameNumber ??= state.gameNumber;
      state[`${phase.team}${phase.action === 'ban' ? 'Bans' : 'Picks'}`].push(action.heroId);
      state.currentPhase++;
      state.draftComplete = state.currentPhase === phases(state.draftMode, state.firstPickSide).length;
      break;
    }
    case 'commit_game': {
      if (state.committedGameId || state.draftHistory.some(game => game.gameNumber === currentGame(state))) throw new Error('gameAlreadyCommitted');
      if (!state.draftComplete || state.bluePicks.length !== 5 || state.redPicks.length !== 5) throw new Error('completeDraftFirst');
      validatePicks(state);
      next.history.push(copy(state));
      state.draftHistory.push({ id, firstPickSide: state.firstPickSide, gameNumber: currentGame(state), committedAt: this.clock(), blueTeam: copy(state.blueTeam), redTeam: copy(state.redTeam), bluePicks: [...state.bluePicks], redPicks: [...state.redPicks] });
      state.committedGameId = id;
      break;
    }
    case 'next_game': {
      if (!state.committedGameId) throw new Error('commitBeforeNext');
      if (seriesFinished(state)) throw new Error('seriesHasEnded');
      if (state.gameNumber !== currentGame(state) + 1) throw new Error('updateScoreBeforeNext');
      next.history.push(copy(state)); clearDraft(state); break;
    }
    case 'swap_sides': {
      if (state.currentPhase > 0 || state.committedGameId) throw new Error('swapOnlyBetweenGames');
      next.history.push(copy(state));
      [state.blueTeam, state.redTeam] = [state.redTeam, state.blueTeam];
      [state.blueScore, state.redScore] = [state.redScore, state.blueScore];
      if (state.sideSwapMode === 'colorsOnly') state.displayLeftSide = state.displayLeftSide === 'blue' ? 'red' : 'blue';
      break;
    }
    case 'swap_picks': {
      if (state.committedGameId) throw new Error('gameAlreadyCommitted');
      if (!state.draftComplete) throw new Error('completeDraftFirst');
      if (!['blue', 'red'].includes(action.team)) throw new Error('操作无效');
      integer(action.from, 0, 4); integer(action.to, 0, 4);
      next.history.push(copy(state));
      const picks = state[`${action.team}Picks`];
      [picks[action.from], picks[action.to]] = [picks[action.to], picks[action.from]];
      validatePicks(state);
      break;
    }
    case 'score': {
      if (!['blue', 'red'].includes(action.team) || ![1, -1].includes(action.delta)) throw new Error('操作无效');
      next.history.push(copy(state));
      state[`${action.team}Score`] += action.delta;
      validateScores(state.blueScore, state.redScore, state.seriesFormat);
      state.gameNumber = Math.min(state.blueScore + state.redScore + 1, Number(state.seriesFormat.slice(2)));
      break;
    }
    case 'undo': {
      const previous = next.history.pop();
      if (!previous) throw new Error('没有可以撤销的操作');
      next.state = previous;
      break;
    }
    case 'reset_draft':
      if (state.committedGameId) throw new Error('committedDraftReset');
      next.history.push(copy(state));
      clearDraft(state);
      break;
    case 'reset_match': {
      next.history.push(copy(state));
      const reset = initialState();
      reset.heroArtOverrides = copy(state.heroArtOverrides || {});
      reset.showHeroName = state.showHeroName ?? true;
      reset.artSourceMode = state.artSourceMode ?? 'auto';
      next.state = reset;
      break;
    }
    case 'settings': {
      const s = action.settings;
      if (
        !s ||
        !['BO1', 'BO3', 'BO5'].includes(s.seriesFormat) ||
        !['match', 'normal'].includes(s.draftMode) ||
        !['normal', 'player', 'global'].includes(s.draftRuleMode ?? state.draftRuleMode) ||
        !['blue', 'red'].includes(s.firstPickSide ?? state.firstPickSide) ||
        !['moveTeams', 'colorsOnly'].includes(s.sideSwapMode ?? state.sideSwapMode) ||
        !['zh', 'eng'].includes(s.language) ||
        !['panel', 'side'].includes(s.overlayLayout) ||
        !['number', 'boxes'].includes(s.scoreDisplay ?? state.scoreDisplay ?? 'number') ||
        !['manual', 'screen'].includes(s.bpInputMode ?? state.bpInputMode ?? 'manual') ||
        typeof (s.showHeroName ?? state.showHeroName) !== 'boolean' ||
        !['auto', 'legacy'].includes(s.artSourceMode ?? state.artSourceMode ?? 'auto')
      ) {
        throw new Error('比赛设置无效，请检查赛制、语言和画面布局');
      }
      integer(s.blueScore, 0, 3); integer(s.redScore, 0, 3); integer(s.gameNumber, 1, 5);
      const wins = (Number(s.seriesFormat.slice(2)) + 1) / 2;
      if (s.blueScore > wins || s.redScore > wins || (s.blueScore === wins && s.redScore === wins) || s.gameNumber > Number(s.seriesFormat.slice(2))) throw new Error('比分或局数不符合当前赛制');
      shortText(s.stage, 80);
      const draftRuleMode = s.draftRuleMode ?? state.draftRuleMode;
      const firstPickSide = s.firstPickSide ?? state.firstPickSide;
      if (state.currentPhase > 0 && firstPickSide !== state.firstPickSide) throw new Error('firstPickLocked');
      if (ruleLocked(state) && draftRuleMode !== state.draftRuleMode) throw new Error('rulesLocked');
      if (state.draftHistory.length && s.seriesFormat !== state.seriesFormat) throw new Error('rulesLocked');
      for (const team of [s.blueTeam, s.redTeam]) {
        if (!team) throw new Error('请填写队伍信息');

        shortText(team.name, 60);
        shortText(team.logo, 1000);

        if (!Array.isArray(team.players) || team.players.length !== 5) {
          throw new Error('每支队伍必须填写 5 个选手位置');
        }

        if (!Array.isArray(team.playerRoles) || team.playerRoles.length !== 5) {
          throw new Error('每支队伍必须设置 5 个选手分路');
        }
        if (team.playerPortraits !== undefined) {
          if (!Array.isArray(team.playerPortraits) || team.playerPortraits.length !== 5) throw new Error('portraitsInvalid');
          team.playerPortraits.forEach(portraitURL);
        }

        const validRoles = ['clash', 'jungle', 'mid', 'farm', 'roam'];

        for (const role of team.playerRoles) {
          if (!validRoles.includes(role)) {
            throw new Error('选手分路无效');
          }
        }

        for (const player of team.players) {
          shortText(player, 40);
        }

        if (!team.name.trim()) {
          throw new Error('队伍名称不能为空');
        }

        if (
          team.logo &&
          !/^https:\/\//.test(team.logo) &&
          !/^\/(?!\/)/.test(team.logo)
        ) {
          throw new Error('队标地址须使用加密网页链接，或以单个斜线开头的本地路径');
        }
      }
      if (draftRuleMode === 'player') {
        const identities = [...s.blueTeam.players, ...s.redTeam.players].map(playerIdentity).filter(Boolean);
        if (new Set(identities).size !== identities.length) throw new Error('duplicatePlayerIds');
      }
      if (state.currentPhase > 0 && s.draftMode !== state.draftMode) throw new Error('请先重置选禁，再修改选禁赛制');
      next.history.push(copy(state));
      Object.assign(state, {
        blueTeam: {
          id: state.blueTeam.id,
          name: s.blueTeam.name,
          logo: s.blueTeam.logo,
          players: [...s.blueTeam.players],
          playerRoles: [...s.blueTeam.playerRoles],
          playerPortraits: [...(s.blueTeam.playerPortraits ?? state.blueTeam.playerPortraits)],
        },
        redTeam: {
          id: state.redTeam.id,
          name: s.redTeam.name,
          logo: s.redTeam.logo,
          players: [...s.redTeam.players],
          playerRoles: [...s.redTeam.playerRoles],
          playerPortraits: [...(s.redTeam.playerPortraits ?? state.redTeam.playerPortraits)],
        },

        blueScore: s.blueScore,
        redScore: s.redScore,

        gameNumber: Math.min(
          s.blueScore + s.redScore + 1,
          Number(s.seriesFormat.slice(2))
        ),
        seriesFormat: s.seriesFormat,
        stage: s.stage,

        language: s.language,
        overlayLayout: s.overlayLayout,
        scoreDisplay: s.scoreDisplay ?? state.scoreDisplay ?? 'number',
        bpInputMode: s.bpInputMode ?? state.bpInputMode ?? 'manual',
        showHeroName: s.showHeroName ?? state.showHeroName ?? true,
        artSourceMode: s.artSourceMode ?? state.artSourceMode ?? 'auto',

        draftMode: s.draftMode,
        draftRuleMode,
        firstPickSide,
        sideSwapMode: s.sideSwapMode ?? state.sideSwapMode,
      });
      // Live roster corrections must respect the incoming player’s previous picks.
      // Committed records remain immutable snapshots of the game already played.
      if (state.currentPhase > 0 && !state.committedGameId) {
        if (state.draftRuleMode === 'player' && [...state.blueTeam.players, ...state.redTeam.players].some(player => !playerIdentity(player))) throw new Error('playerMissing');
        validatePicks(state);
      }
      break;
    }
    case 'hero_art_override': {
      if (!heroes.some(hero => hero.id === action.heroId)) throw new Error('找不到该英雄');
      const override = action.override;
      if (!override || typeof override !== 'object') throw new Error('heroArtOverrideInvalid');
      if (override.useLegacyImage !== undefined && typeof override.useLegacyImage !== 'boolean') throw new Error('heroArtOverrideInvalid');
      if (override.panel !== undefined) validateArtCrop(override.panel);
      if (override.side !== undefined) validateArtCrop(override.side);
      next.history.push(copy(state));
      state.heroArtOverrides = { ...(state.heroArtOverrides || {}), [String(action.heroId)]: copy(override) };
      break;
    }
    case 'reset_hero_art_override': {
      if (!heroes.some(hero => hero.id === action.heroId)) throw new Error('找不到该英雄');
      next.history.push(copy(state));
      const key = String(action.heroId);
      const current = { ...(state.heroArtOverrides?.[key] || {}) };
      if (action.layout) {
        if (!['panel', 'side'].includes(action.layout)) throw new Error('heroArtOverrideInvalid');
        delete current[action.layout];
        if (current.useLegacyImage === undefined && current.panel === undefined && current.side === undefined) {
          const map = { ...(state.heroArtOverrides || {}) };
          delete map[key];
          state.heroArtOverrides = map;
        } else {
          state.heroArtOverrides = { ...(state.heroArtOverrides || {}), [key]: current };
        }
      } else {
        const map = { ...(state.heroArtOverrides || {}) };
        delete map[key];
        state.heroArtOverrides = map;
      }
      break;
    }
    case 'delay': integer(action.seconds, 0, 3600); next.delay = action.seconds; break;
    default: throw new Error('不支持此操作');
    }
    next.revision++;
    if (action.type !== 'delay') next.events.push({ id, timestamp: Math.max(this.clock(), next.events.at(-1)?.timestamp ?? 0), type: action.type, resultingState: copy(next.state), revision: next.revision });
    next.ids = [...next.ids.slice(-999), id];
    // Commit durable state before acknowledging or broadcasting. Failure leaves memory unchanged.
    if (this.file) {
      try {
        mkdirSync(dirname(this.file), { recursive: true });
        const temporary = `${this.file}.tmp`;
        const fd = openSync(temporary, 'w');
        try { writeSync(fd, JSON.stringify(next)); fsyncSync(fd); } finally { closeSync(fd); }
        renameSync(temporary, this.file);
      } catch (cause) {
        throw new Error('比赛状态保存失败，本次操作未生效，请联系导播检查服务器存储后重试', { cause });
      }
    }
    this.data = next;
  }
}
