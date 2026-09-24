# HOK Broadcast 项目里程碑

> 本文记录项目从原始 BP 网页演进到当前赛事导播系统的主要阶段，以及后续规划。  
> 当前状态以仓库 `main` 分支为准；测试数量和验收结论均以对应时期的验证记录为依据。

## 当前状态

**当前主要版本：V2.3**

HOK Broadcast 已从单纯的英雄 BP 页面发展为一套包含 **导播操作台、延迟解说端、OBS Overlay、服务器状态同步、跨局 BP 规则、队伍资料库与选手素材管理** 的赛事系统。

当前核心架构：

```text
Control
   │
   ├── Match / Team / BP 操作
   ├── 快捷英雄录入
   └── 队伍与选手资料管理
   │
   ▼
Node.js + WebSocket Server
   │
   ├── Authoritative Match State
   ├── Undo / Persistence
   ├── Draft History
   ├── Caster Delay Timeline
   ├── Team Presets
   └── Player Portrait Uploads
   │
   ├──────────────► Caster
   │
   └──────────────► OBS Overlay
```

---

# 已完成里程碑

## M0 — 原始 BP 工具基础

项目基于 qiqi47 的原项目继续开发。

这一阶段保留了原有：

- Honor of Kings 英雄数据
- 基础英雄选择界面
- Ban / Pick 展示
- 原项目 MIT License
- 原始网页版本的核心思路

原项目 README 已归档至：

```text
docs/archive/legacy/upstream-readme.md
```

---

## M1 — 从单机页面升级为赛事状态系统

**状态：✅ 已完成**

项目开始脱离纯前端单机工具，建立 Node.js + WebSocket Server。

主要完成：

- Control / Caster / Overlay 三种角色
- 服务器 authoritative state
- WebSocket 实时同步
- REST 初始状态读取
- Control 写入、Caster / Overlay 只读
- revision 防止旧状态覆盖
- 单条 pending action 防重复提交
- Undo
- Reset Draft
- Reset Match
- 比赛状态持久化至 `match.json`
- 断线重连与 heartbeat

这一阶段奠定了后续所有赛事功能的基础。

---

## M2 — 延迟解说与正式赛事 BP 流程

**状态：✅ 已完成**

系统开始针对远程赛事工作流设计。

主要完成：

- Caster Delay
- 延迟比赛状态时间线
- Control / Overlay 实时状态
- Caster 延迟状态
- BO1 / BO3 / BO5
- Stage
- 自动 Game Number
- 比分即时同步
- 当前 BP Phase
- 2 Ban / 4 Ban 两套 Draft Format
- 完整有效局提交：
  - Complete Draft
  - Commit Game
  - Update Score
  - Next Game
- 无效 BP 可重置而不污染历史

---

## M3 — Normal / Player / Global BP

**状态：✅ 已完成**

跨局 BP 规则正式成为独立系统。

新增：

### Normal BP

- 每局独立
- 历史选角不限制下一局

### Player BP

- 按选手 ID 追踪历史英雄
- 换位置后仍识别同一选手
- 替补拥有独立历史

### Global BP

- 按稳定 Team ID 追踪历史英雄
- 同一队伍已用英雄后续不可再次 Pick
- 换边后历史继续跟随队伍
- 对手使用过的英雄不影响本队
- 防止浪费 Ban：不能 Ban 对手此前有效局已经使用过的英雄

同时加入：

- `draftHistory`
- Stable Team Identity
- Game Draft Record
- 规则锁定
- 旧存档自动 migration

2026-09-17 的 V2 验证已覆盖三种规则的多局流程。

---

## M4 — 队伍、选手与赛事信息完善

**状态：✅ 已完成**

Team State 从简单队名扩展为完整赛事资料：

- Team Name
- Team Logo
- 5 名 Player ID
- Player Role
  - Clash Lane
  - Jungling
  - Mid Lane
  - Farm Lane
  - Roaming
- 中文 / English 全局语言
- Series Score
- Stage
- First Pick Side
- Side Swap Mode

新增两种换边逻辑：

### Move Teams

队伍、选手、比分一起交换左右/蓝红位置。

### Colors Only

队伍在屏幕左右位置保持不变，仅交换 Blue / Red 身份与配色。

Global BP 仍通过稳定 Team ID 保持正确历史归属。

---

## M5 — Broadcast Overlay V2

**状态：✅ 已实现，仍需更多实机彩排**

OBS Overlay 重构为真正的赛事图形。

当前包含：

- 顶部赛事信息
- 居中比分
- 队名 / Logo
- Series / Game / BP Rule
- Current Bans
- Previous Draft History
- 5v5 Pick Cards
- Hero Name
- Player ID
- Position Icon
- 透明游戏区域

支持两套布局：

### Panel

```text
Top Scoreboard

      Transparent Gameplay Area

History / Bans
5 Blue Picks        5 Red Picks
```

### Side

```text
Top Scoreboard

Blue Picks      Transparent Gameplay      Red Picks
   x5                                          x5

History / Bans
```

英雄出现动画：

- Panel：选手图 → 白色覆盖 → Hero Art → 白块上移揭示
- Side：左右英雄卡向画面内部滑入
- Reduced Motion 支持

---

## M6 — 远程赛事访问

**状态：✅ Quick Tunnel 已实测；固定部署仍在规划**

已经通过 Cloudflare Tunnel 实现公网访问：

```text
/control
/caster
/overlay/draft
```

特点：

- 不需要路由器端口转发
- HTTPS
- WebSocket 正常工作
- 手机蜂窝网络可远程访问
- 异地 Caster 可以直接连接赛事 Server

同时完成 Windows 一键启动流程：

```text
停止旧进程
↓
启动 Server
↓
确认 3001 Ready
↓
启动 cloudflared
↓
抓取公网 URL
↓
生成 Control / Caster / Overlay 地址
↓
打开本地 Control
```

当前 Quick Tunnel 地址每次启动会变化；固定域名 / Named Tunnel 属后续部署里程碑。

---

## M7 — V2.3 导播工作台

**状态：✅ 已完成**

真实测试发现原 Control 页面不适合高节奏 BP 后，Control 重新设计为 Operator Cockpit。

主要完成：

- Desktop 双栏工作区
- 左侧比赛监视 / 操作
- 右侧英雄选择
- Compact Board
- Sticky 当前 Phase
- Hero Grid 独立滚动
- Settings 改为弹窗
- Tablet / Mobile 响应式布局

快捷录入：

- `/` 聚焦英雄搜索
- `Ctrl+K` 聚焦英雄搜索
- `Esc` 清空搜索
- 唯一合法搜索结果时 `Enter` 直接提交
- Server ACK 后才清空并重新聚焦
- 输入法组合输入保护
- 保留 revision / pending 防重复机制

目标是让程序追上实际游戏 BP 节奏，而不是人为让 BP 变慢。

---

## M8 — 选手照片与运行时上传

**状态：✅ 已完成**

V2.2 已有 Player Portrait 数据结构，但真实赛事流程缺乏上传功能。

V2.3 新增：

- PNG / JPEG / WebP 上传
- 单张最大 5 MB
- Control-only 上传权限
- 服务端格式与大小验证
- UUID 随机文件名
- 运行时静态图片服务
- 图片加载状态预览
- URL fallback
- Hero 未选择时展示 Player Portrait
- Hero Pick 后进入 Reveal Animation

运行时文件：

```text
vite-project/data/uploads/player-portraits/
```

无需为了新增选手照片重新 Build 前端。

---

## M9 — Team Library / 队伍资料库

**状态：✅ 已完成**

比赛准备流程从“每次重新输入所有队伍资料”升级为可复用资料库。

每个 Team Preset 保存：

- Stable Team ID
- Team Name
- Logo
- 5 名首发
- Roles
- Portraits
- Created / Updated time

资料库存储：

```text
vite-project/data/team-presets.json
```

支持：

- 创建
- 搜索
- 编辑
- 删除
- 载入 Blue
- 载入 Red
- Save as New Team
- Update Saved Team

载入比赛后使用独立副本：

```text
Team Library
↓ copy
Current Match
```

临时修改当前比赛不会自动覆盖长期资料。

Stable Team ID 同时保证 Global BP 在换边后仍然正确。

---

## M10 — 替补与快速换人

**状态：✅ 已完成**

Team Library 进一步加入替补名单。

当前支持：

- 每队最多 20 名替补
- Substitute Player ID
- Role
- Portrait
- 首发与替补共同作为快速换人来源
- 比赛进行中修改当前阵容
- 不替换 Team Identity
- Global BP 继续跟 Team
- Player BP 继续跟 Player ID
- 临时换人不自动覆盖资料库
- 可显式更新 Saved Team

2026-09-23 的增量验证记录中，服务端 42 项测试通过，队伍库 / 替补专项浏览器场景也已通过。

---

## M11 — 文档与仓库整理

**状态：✅ 已完成**

随着版本迭代，根目录曾积累大量：

- Handoff
- Validation
- Workflow
- Production Status
- Hero Research

现已整理为：

```text
docs/
├── guides/
├── design/
├── validation/
├── research/
└── archive/
```

根目录只保留项目主要入口和核心文件。

历史交接文档没有直接删除，而是统一归档，避免丢失开发背景。

---

# 当前验证基线

最近记录的主要自动验证包括：

- TypeScript / Vite Build
- ESLint
- Server Tests
- Playwright Browser E2E
- Normal / Player / Global BP
- Blue / Red First Pick
- Move Teams / Colors Only
- Draft History
- Undo / Delay / Reconnect
- Panel / Side Overlay
- Mobile Layout
- Player Portrait Upload
- Team Library
- Substitute / Quick Substitution

在 2026-09-23 的最近功能回归记录中：

- **42 项服务端测试通过**
- **15 组浏览器场景覆盖现有流程**

这些属于当时的验证结果，不替代未来每次改动后的重新测试。

完整记录：

[docs/validation/history.md](docs/validation/history.md)

---

# 下一阶段里程碑

## M12 — 真实赛事彩排

**状态：🚧 下一优先级**

自动测试已经覆盖大量逻辑，但真正赛事仍需要完整实机彩排。

计划验证：

- OBS Browser Source
- Panel Layout
- Side Layout
- 10 张真实选手照片
- Cloudflare 公网 Control / Caster / Overlay
- 真实 Caster Delay
- B站推流链路
- Discord / 异地解说
- 长时间运行
- 网络断线恢复
- 完整 BO3 / BO5
- 实际游戏 BP 节奏

完成标准：

> 至少完成一次从赛前准备 → BP → 比赛 → 换边 → 下一局 → Series 结束的完整模拟赛事。

---

## M13 — 固定公网部署

**状态：📋 规划中**

当前 Quick Tunnel 已可用，但地址每次启动都会变化。

计划评估：

- Cloudflare Named Tunnel
- 固定域名
- HTTPS
- Production Tokens
- Allowed Origins
- Docker / Caddy 部署
- VPS 或长期 Server

目标：

```text
https://<fixed-domain>/control
https://<fixed-domain>/caster
https://<fixed-domain>/overlay/draft
```

比赛工作人员无需每次重新接收随机 URL。

---

## M14 — Hero Database 持续维护

**状态：🔁 长期任务**

英雄数据已经经过一次较大的 Global roster 补齐和审计。

未来需要持续维护：

- 新英雄
- 英雄改名
- 国际服正式名称
- 中文名称
- Hero Portrait
- Lane / Occupation
- Counter
- Combo
- Be Countered
- Alias

研究依据保留在：

```text
research/
docs/research/
```

不要用国服英雄表直接覆盖国际服数据。

---

## M15 — Production Reliability

**状态：📋 规划中**

当系统真正承担正式比赛后，需要从“能运行”继续升级到“事故可恢复”。

候选工作：

- 自动备份 `data/`
- Match State 快照
- Team Library 备份
- Upload 文件备份
- Crash Recovery
- 更清晰的 Server Log
- Match Export / Import
- Event Audit Log
- 健康状态 Dashboard
- 一键恢复上一次比赛

---

## M16 — Desktop Director App

**状态：💡 可选未来方向**

当前 Windows 一键启动已经覆盖大部分“桌面程序”的实用价值，因此桌面打包不是当前必要任务。

如果未来希望让其他赛事组织者无需安装 Node / npm / cloudflared 即可使用，可以考虑：

```text
HOK Broadcast Director.exe
```

潜在功能：

- Start / Stop Server
- Tunnel Status
- Public URL
- Copy Caster URL
- Copy OBS URL
- Server Logs
- Open Control
- Backup / Restore
- App Update

当前技术栈以 Node.js 为核心，因此若进入桌面化阶段，Electron 是较直接的候选方案。

在真实赛事工作流稳定之前，不建议把桌面打包作为最高优先级。

---

# 长期目标

项目长期方向不是单纯做一个“BP 网页”，而是一套可以被社区赛事反复使用的轻量赛事导播系统：

```text
Team Management
      +
Draft Administration
      +
Caster Intelligence
      +
Broadcast Graphics
      +
Remote Synchronization
      +
Match Persistence
      =
HOK Broadcast System
```

核心原则：

1. **比赛状态由 Server 统一管理。**
2. **规则逻辑与视觉 UI 分离。**
3. **真实赛事操作效率优先。**
4. **历史状态不可因 UI 重构而丢失。**
5. **自动测试不能代替真实赛事彩排。**
6. **新增功能优先复用现有数据模型，而不是堆积平行状态。**

---

# 版本路线摘要

| 阶段 | 核心内容 | 状态 |
| --- | --- | --- |
| M0 | 原始 BP 网页基础 | ✅ |
| M1 | Server / WebSocket / 三端架构 | ✅ |
| M2 | 延迟解说 / 正式比赛流程 | ✅ |
| M3 | Normal / Player / Global BP | ✅ |
| M4 | 队伍 / 选手 / 换边 / 先手 | ✅ |
| M5 | Panel / Side Broadcast Overlay | ✅ |
| M6 | Cloudflare 远程访问 / 一键启动 | ✅ |
| M7 | V2.3 Operator Cockpit / 快捷 BP | ✅ |
| M8 | Player Portrait Runtime Upload | ✅ |
| M9 | Team Library | ✅ |
| M10 | Substitute / Quick Substitution | ✅ |
| M11 | 文档与仓库整理 | ✅ |
| M12 | 真实赛事完整彩排 | 🚧 |
| M13 | 固定公网部署 | 📋 |
| M14 | Hero Database 持续维护 | 🔁 |
| M15 | Production Reliability | 📋 |
| M16 | Desktop Director App | 💡 |

