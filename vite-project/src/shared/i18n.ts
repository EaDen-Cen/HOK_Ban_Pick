import type { Language } from './types';

const messages = {
  portrait: { zh: '选手形象地址', eng: 'Player portrait URL' },
  portraitHint: { zh: 'HTTPS 图片链接或 /playerImg/ 本地路径；留空使用队徽。', eng: 'HTTPS image URL or /playerImg/ local path. Leave blank to use the team logo.' },
  portraitInvalid: { zh: '选手形象须为 HTTPS 图片链接或单斜线开头的本地路径', eng: 'Use an HTTPS portrait URL or a local path starting with one slash.' },
  portraitsInvalid: { zh: '每支队伍必须设置 5 个选手形象位置', eng: 'Each team must have 5 portrait slots.' },
  firstPickSide: { zh: 'BP 先手方', eng: 'Draft starting side' },
  firstPickLocked: { zh: '选禁开始后先手方锁定，请重置选禁或进入下一局后修改', eng: 'The starting side locks once drafting begins. Reset the draft or start the next game to change it.' },
  sideSwapMode: { zh: '换边方式', eng: 'Side swap behavior' },
  moveTeams: { zh: '交换队伍显示位置', eng: 'Move teams between screen sides' },
  colorsOnly: { zh: '队伍位置不变，仅交换蓝红方', eng: 'Keep screen positions, swap colors' },
  confirmColorsSwap: { zh: '两队显示位置保持不变，交换蓝红方归属？比分、选手和历史仍跟随原队伍，先手方不变。', eng: 'Keep team screen positions and swap blue/red sides? Scores, players and history follow each team. The starting side stays unchanged.' },
  screenLeft: { zh: '画面左侧', eng: 'Screen left' },
  screenRight: { zh: '画面右侧', eng: 'Screen right' },

  backendUpgrade: { zh: '当前连接的是旧版服务。请停止旧进程并重新启动服务器，V2 操作将在连接新版服务后启用。', eng: 'Connected to an older server. Stop it and restart the server to enable V2 controls.' },
  draftRules: { zh: 'BP 规则', eng: 'BP rules' },
  ruleNormal: { zh: '普通 BP', eng: 'NORMAL BP' },
  rulePlayer: { zh: '选手 BP', eng: 'PLAYER BP' },
  ruleGlobal: { zh: '全局 BP', eng: 'GLOBAL BP' },
  historyTitle: { zh: '有效局历史', eng: 'COMMITTED GAMES' },
  noHistory: { zh: '尚无已确认的有效局', eng: 'No committed games yet' },
  historyNormal: { zh: '仅供回顾，不限制下一局英雄。', eng: 'For reference only. Previous picks remain available.' },
  historyPlayer: { zh: '按选手 ID 限制重复英雄，队友可使用；换人时请填写新选手自己的 ID。', eng: 'Restrictions follow player IDs. Teammates may reuse heroes. Enter each substitute’s own ID.' },
  historyGlobal: { zh: '同一队伍已使用的英雄不可再次选择；换边、换人不清空历史。', eng: 'A team cannot reuse its committed picks. History follows teams across side swaps and substitutions.' },
  commitGame: { zh: '确认本局有效', eng: 'Commit game' },
  nextGame: { zh: '开始下一局', eng: 'Start next game' },
  swapSides: { zh: '交换蓝红方', eng: 'Swap sides' },
  confirmCommit: { zh: '确认本局比赛有效、英雄归属正确？提交后将计入跨局历史；比分请单独更新。', eng: 'Confirm this game is valid and player assignments are correct? Its picks will enter history. Update the score separately.' },
  confirmNext: { zh: '确认进入下一局？当前选禁画面将清空，已提交历史保留。', eng: 'Start the next game? Clear the current draft and retain committed history.' },
  confirmSwap: { zh: '交换两队、选手和比分的蓝红位置？历史将继续跟随原队伍。', eng: 'Swap teams, players and scores between blue and red? History will follow each team.' },
  gameCommitted: { zh: '本局已提交', eng: 'Game committed' },
  lifecycleHint: { zh: '比赛结束后确认本局有效 → 更新比分 → 开始下一局。原 BP 重开无需重复提交；无效 BP 在提交前重置。', eng: 'After play: commit the valid game → update score → start the next game. Replays with the same draft need no second commit; reset invalid drafts before committing.' },
  assignmentTitle: { zh: '英雄归属校对', eng: 'Review player assignments' },
  assignmentHint: { zh: '每个位置对应选手 ID。选择另一位英雄会交换两名选手的英雄，服务器会重新检查资格。', eng: 'Each slot belongs to its player ID. Choosing another hero swaps assignments; the server rechecks eligibility.' },
  pickingFor: { zh: '当前为 {player} 选择英雄（第 {slot} 位）', eng: 'Picking for {player} (slot {slot})' },
  playerMissing: { zh: '请先填写该位置的选手 ID', eng: 'Enter this slot’s player ID first.' },
  usedByPlayer: { zh: '该选手在此前有效局已使用此英雄', eng: 'This player used this hero in a committed game.' },
  usedByTeam: { zh: '该队伍在此前有效局已使用此英雄', eng: 'This team used this hero in a committed game.' },
  gameAlreadyCommitted: { zh: '本局已提交，不能重复提交或修改英雄归属', eng: 'This game is committed. It cannot be committed again or reassigned.' },
  completeDraftFirst: { zh: '请先完成本局选禁', eng: 'Complete the current draft first.' },
  commitBeforeNext: { zh: '请先确认本局有效', eng: 'Commit the current game first.' },
  updateScoreBeforeNext: { zh: '请核对系列赛比分，再进入对应的下一局', eng: 'Check the series score before starting the corresponding next game.' },
  seriesHasEnded: { zh: '系列赛已结束，请重置整场比赛开始新系列赛', eng: 'The series has ended. Reset the match to start a new series.' },
  swapOnlyBetweenGames: { zh: '仅可在两局之间、选禁开始前交换蓝红方', eng: 'Swap sides between games, before the draft starts.' },
  committedDraftReset: { zh: '本局已提交，请使用“开始下一局”；若提交有误，可撤销至提交前', eng: 'This draft is committed. Start the next game, or undo to before the commit if it was invalid.' },
  rulesLocked: { zh: '选禁开始后规则锁定；存在有效局历史时需重置整场比赛才能修改规则或赛制', eng: 'Rules lock when drafting starts. Reset the match to change rules or series format after a committed game.' },
  duplicatePlayerIds: { zh: '选手 BP 要求每位选手 ID 唯一', eng: 'Player BP requires a unique ID for every player.' },
  rosterLocked: { zh: '选禁开始后选手及分路锁定，请在下一局开始前修改', eng: 'Players and roles lock during the draft. Change them before the next draft.' },
  scoreImmediate: { zh: '比分直接同步；其他设置需保存。', eng: 'Score changes sync immediately. Save other settings separately.' },
  "appName": {
    "zh": "王者荣耀赛事转播系统",
    "eng": "HOK Broadcast System"
  },
  "gameTitle": {
    "zh": "王者荣耀国际服",
    "eng": "HONOR OF KINGS"
  },
  "brandTitle": {
    "zh": "王者荣耀",
    "eng": "HOK"
  },
  "brandSubtitle": {
    "zh": "赛事转播",
    "eng": "Broadcast"
  },
  "communitySystem": {
    "zh": "社区赛事转播系统",
    "eng": "Community Broadcast System"
  },
  "casterEyebrow": {
    "zh": "社区赛事 · 解说工作台",
    "eng": "COMMUNITY ESPORTS · CASTER DESK"
  },
  "controlEyebrow": {
    "zh": "社区赛事 · 导播控制台",
    "eng": "COMMUNITY ESPORTS · PRODUCTION"
  },
  "casterLogin": {
    "zh": "解说工作台登录",
    "eng": "Caster access"
  },
  "controlLogin": {
    "zh": "赛事控制台登录",
    "eng": "Control access"
  },
  "accessToken": {
    "zh": "访问口令",
    "eng": "Access token"
  },
  "connect": {
    "zh": "连接",
    "eng": "Connect"
  },
  "logout": {
    "zh": "退出登录",
    "eng": "Sign out"
  },
  "controlRealtime": {
    "zh": "控制台 · 实时状态",
    "eng": "CONTROL · REALTIME"
  },
  "delayedFeed": {
    "zh": "解说画面 · 延迟 {seconds} 秒",
    "eng": "CASTER · DELAYED {seconds}s"
  },
  "disconnectedNotice": {
    "zh": "连接未就绪，操作已禁用。现有画面保留，正在恢复服务器状态。",
    "eng": "Connection unavailable. Controls are disabled while the current picture is held and server state reloads."
  },
  "connectingServer": {
    "zh": "正在连接比赛服务器…",
    "eng": "Connecting to match server…"
  },
  "readOnlyFooter": {
    "zh": "只读解说视图 · 延迟时间轴",
    "eng": "Read-only caster view · Delayed timeline"
  },
  "serverFooter": {
    "zh": "比赛数据由服务器统一同步",
    "eng": "Match data synchronized by the server"
  },
  "rosterUpdated": {
    "zh": "英雄资料更新于 {date}",
    "eng": "Hero roster updated {date}"
  },
  "ban": {
    "zh": "禁用",
    "eng": "BAN"
  },
  "emptyPick": {
    "zh": "待选",
    "eng": "PICK"
  },
  "draftComplete": {
    "zh": "选禁完成",
    "eng": "DRAFT COMPLETE"
  },
  "banHero": {
    "zh": "{team}禁用英雄",
    "eng": "{team} BANNING"
  },
  "pickHero": {
    "zh": "{team}选择英雄",
    "eng": "{team} PICKING"
  },
  "phaseStep": {
    "zh": "第 {step} 步，共 {total} 步",
    "eng": "STEP {step} OF {total}"
  },
  "gameNumber": {
    "zh": "第 {number} 局",
    "eng": "GAME {number}"
  },
  "playerNumber": {
    "zh": "选手 {number}",
    "eng": "Player {number}"
  },
  "blueSide": {
    "zh": "蓝方",
    "eng": "Blue"
  },
  "redSide": {
    "zh": "红方",
    "eng": "Red"
  },
  "blueTeam": {
    "zh": "蓝方队伍",
    "eng": "TEAM BLUE"
  },
  "redTeam": {
    "zh": "红方队伍",
    "eng": "TEAM RED"
  },
  "blueAnalysis": {
    "zh": "蓝方阵容分析",
    "eng": "Blue draft analysis"
  },
  "redAnalysis": {
    "zh": "红方阵容分析",
    "eng": "Red draft analysis"
  },
  "opponent": {
    "zh": "对手：{team}",
    "eng": "Opponent: {team}"
  },
  "synergy": {
    "zh": "搭配推荐",
    "eng": "Synergy / Combo"
  },
  "ourCounters": {
    "zh": "我方克制",
    "eng": "Our picks counter"
  },
  "counteredBy": {
    "zh": "我方被克制",
    "eng": "Threats to our picks"
  },
  "enemyCounters": {
    "zh": "克制对手的推荐",
    "eng": "Counters to enemy picks"
  },
  "relationshipHint": {
    "zh": "结合双方已选英雄展示关系，原有数据供解说参考。",
    "eng": "Relationships based on both teams' picks. Original data for caster reference."
  },
  "noRelationships": {
    "zh": "暂无关系数据",
    "eng": "No relationship data"
  },
  "matchSettings": {
    "zh": "比赛设置",
    "eng": "Match settings"
  },
  "hideSettings": {
    "zh": "收起比赛设置",
    "eng": "Hide match settings"
  },
  "teamName": {
    "zh": "队伍名称",
    "eng": "Team name"
  },
  "logoAddress": {
    "zh": "队徽图片地址",
    "eng": "Team logo URL"
  },
  "logoPlaceholder": {
    "zh": "填写图片链接或本地资源路径",
    "eng": "Enter an image URL or local asset path"
  },
  "players": {
    "zh": "选手名单",
    "eng": "Players"
  },
  "lane": {
    "zh": "分路",
    "eng": "Lane"
  },
  "clash": {
    "zh": "对抗路",
    "eng": "Clash Lane"
  },
  "jungle": {
    "zh": "打野",
    "eng": "Jungling"
  },
  "mid": {
    "zh": "中路",
    "eng": "Mid Lane"
  },
  "farm": {
    "zh": "发育路",
    "eng": "Farm Lane"
  },
  "roam": {
    "zh": "游走",
    "eng": "Roaming"
  },
  "all": {
    "zh": "全部",
    "eng": "All"
  },
  "seriesScore": {
    "zh": "系列赛比分",
    "eng": "Series score"
  },
  "decreaseScore": {
    "zh": "减少系列赛比分",
    "eng": "Decrease series score"
  },
  "increaseScore": {
    "zh": "增加系列赛比分",
    "eng": "Increase series score"
  },
  "matchDisplay": {
    "zh": "赛制与显示",
    "eng": "Match and display"
  },
  "stage": {
    "zh": "比赛阶段",
    "eng": "Match stage"
  },
  "seriesFormat": {
    "zh": "系列赛赛制",
    "eng": "Series format"
  },
  "bo1": {
    "zh": "一局定胜负",
    "eng": "Best of 1"
  },
  "bo3": {
    "zh": "三局两胜",
    "eng": "Best of 3"
  },
  "bo5": {
    "zh": "五局三胜",
    "eng": "Best of 5"
  },
  "currentGame": {
    "zh": "当前局",
    "eng": "Current game"
  },
  "automatic": {
    "zh": "自动计算",
    "eng": "Calculated automatically"
  },
  "draftMode": {
    "zh": "BP 形式",
    "eng": "BP format"
  },
  "matchMode": {
    "zh": "赛事模式 · 每队禁用 4 位",
    "eng": "Match · 4 bans per team"
  },
  "normalMode": {
    "zh": "普通模式 · 每队禁用 2 位",
    "eng": "Normal · 2 bans per team"
  },
  "language": {
    "zh": "界面语言",
    "eng": "Interface language"
  },
  "chinese": {
    "zh": "中文",
    "eng": "Chinese"
  },
  "english": {
    "zh": "英文",
    "eng": "English"
  },
  "languageHint": {
    "zh": "保存后，界面与英雄名称将一起切换。",
    "eng": "Save to switch the entire interface and hero names."
  },
  "overlayLayout": {
    "zh": "直播布局",
    "eng": "Overlay layout"
  },
  "panelLayout": {
    "zh": "底部横排",
    "eng": "Bottom panel"
  },
  "sideLayout": {
    "zh": "左右竖排",
    "eng": "Side columns"
  },
  "saveSettings": {
    "zh": "保存设置",
    "eng": "Save settings"
  },
  "undo": {
    "zh": "撤销上次操作",
    "eng": "Undo last action"
  },
  "resetDraft": {
    "zh": "重置选禁",
    "eng": "Reset draft"
  },
  "resetMatch": {
    "zh": "重置整场比赛",
    "eng": "Reset match"
  },
  "confirmResetDraft": {
    "zh": "确定清空当前选禁？队伍设置和比分将保留。",
    "eng": "Reset this draft? Team settings and scores will be kept."
  },
  "confirmResetMatch": {
    "zh": "确定重置整场比赛？队伍、比分和选禁都会清空。",
    "eng": "Reset the entire match? Teams, scores and draft will be cleared."
  },
  "casterDelay": {
    "zh": "解说延迟 · {seconds} 秒",
    "eng": "Caster delay · {seconds}s"
  },
  "increaseDelay": {
    "zh": "增加解说延迟 {seconds} 秒",
    "eng": "Increase caster delay by {seconds} seconds"
  },
  "decreaseDelay": {
    "zh": "减少解说延迟 {seconds} 秒",
    "eng": "Decrease caster delay by {seconds} seconds"
  },
  "secondsShort": {
    "zh": "秒",
    "eng": "s"
  },
  "delayInput": {
    "zh": "解说延迟秒数",
    "eng": "Caster delay seconds"
  },
  "setDelay": {
    "zh": "设置延迟",
    "eng": "Set delay"
  },
  "selectHero": {
    "zh": "点击一位英雄确认",
    "eng": "Select one hero to confirm"
  },
  "searchHeroes": {
    "zh": "搜索英雄",
    "eng": "Search heroes"
  },
  "availabilityHint": {
    "zh": "元流之子按形态录入；形态及联动英雄的可用范围，以本场游戏房间为准。",
    "eng": "Enter Flowborn by form. Form and crossover eligibility follows the current game lobby."
  },
  "statusConnecting": {
    "zh": "正在连接",
    "eng": "Connecting"
  },
  "statusConnected": {
    "zh": "已连接",
    "eng": "Connected"
  },
  "statusReconnecting": {
    "zh": "正在重连",
    "eng": "Reconnecting"
  },
  "statusTokenRequired": {
    "zh": "请输入访问口令",
    "eng": "Access token required"
  },
  "statusInvalidToken": {
    "zh": "访问口令无效",
    "eng": "Invalid token"
  },
  "statusRejected": {
    "zh": "无访问权限",
    "eng": "Access rejected"
  },
  "statusUnavailable": {
    "zh": "连接未就绪",
    "eng": "Connection unavailable"
  },
  "stageCommunity": {
    "zh": "社区赛事",
    "eng": "COMMUNITY TOURNAMENT"
  },
  "stageGroup": {
    "zh": "小组赛",
    "eng": "Group Stage"
  },
  "stageQuarter": {
    "zh": "四分之一决赛",
    "eng": "Quarterfinal"
  },
  "stageSemi": {
    "zh": "半决赛",
    "eng": "Semifinal"
  },
  "stageFinal": {
    "zh": "决赛",
    "eng": "Final"
  },
  "stageGrandFinal": {
    "zh": "总决赛",
    "eng": "Grand Final"
  }
} as const;

export type MessageKey = keyof typeof messages;
export function translate(lang: Language, key: MessageKey, params: Record<string, string | number> = {}) {
  return messages[key][lang].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}
export const translator = (lang: Language) => (key: MessageKey, params?: Record<string, string | number>) => translate(lang, key, params);
