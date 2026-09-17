import type { Language } from './types';

const messages = {
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
    "zh": "选禁模式",
    "eng": "Draft mode"
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
    "zh": "信息面板",
    "eng": "Panel"
  },
  "sideLayout": {
    "zh": "左右侧栏",
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
