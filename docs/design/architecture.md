# 系统结构

[文档索引](../README.md)

| 位置（仓库根目录起） | 职责 |
| --- | --- |
| `vite-project/src/main.tsx` → `BroadcastApp.tsx` | 当前前端入口、Control / Caster / Overlay |
| `vite-project/src/control/` | 导播工作区、Auto BP、Player ID 对齐、最终阵容、设置、照片、队伍库 |
| `vite-project/src/overlay/` | Draft Overlay、MVP Overlay、实验性 Game HUD 与英雄揭示动画 |
| `vite-project/src/shared/` | 类型、BP 规则、显示、语言与比赛连接 |
| `vite-project/src/components/`、`src/data/` | 既有组件与英雄数据；旧单机组件保留 |
| `vite-project/server/server.ts` | HTTP / WebSocket、权限、静态文件与上传入口 |
| `vite-project/server/store.ts` | 比赛状态、修订号、Undo、历史、延迟和落盘 |
| `vite-project/server/teamPresets.ts`、`portraits.ts` | 独立队伍资料库与图片存储 |
| `vite-project/server/*.test.ts`、`e2e/` | 服务端测试及浏览器验收 |
| `vite-project/public/` | 构建时复制的静态资源 |
| `deploy/`、`vite-project/Dockerfile` | Compose、Caddy、容器构建 |
| `research/` | 研究证据 JSON，不是运行时英雄数据库 |

操作台经共享连接提交带修订号的操作，由服务器验证和持久化后确认并广播。Control 与 Overlay 使用实时状态，Caster 从事件时间轴读取延迟快照；延迟的是数据，不是视频。

服务器默认读取 `vite-project/data/match.json`，同级保存 `access.json`、`team-presets.json` 与 `uploads/player-portraits/`。`DATA_FILE` 可改变数据基准位置，`UPLOAD_DIR` 可另指定照片目录；迁移应覆盖全部数据。队伍资料载入比赛时复制阵容并保留稳定身份，现场修改不会自动覆盖资料库。

## 性能与扩展边界

- WebSocket 仍按 200ms 检查延迟事件；各角色按比赛修订号和可见延迟事件版本缓存序列化快照。没有变化时不重新复制或序列化状态。
- 延迟事件查询使用二分查找，避免每轮复制并反转事件数组。
- 识别保留多裁剪算法，去掉中间图片编码，缓存完全一致的证据，最多同时计算 4 个浏览器识别请求。
- 屏幕识别、英雄编辑器和模拟器页面按需加载。
- `server/access.ts` 保存随机角色 token、密码盐和 scrypt 哈希，数据位于 `data/access.json`；环境变量只用于初始配置。
- `server/recognitionProvider.ts` 定义英雄图像识别提供者接口；英雄头像仍使用 `local-template-v1`。Player ID 与赛后数字使用常驻本地 Tesseract，不调用远程 AI。
- `/api/v1/capabilities` 返回识别协议能力；`/api/v1/recognition/frame` 与已有 `/api/recognize-frame` 共用权限、修订号和响应结构。

详细协议见 [API 接口](api.md)，性能复测见 `vite-project/scripts/benchmark-recognition.ts`。

## 英雄视觉数据的三层来源

英雄图片/构图现在明确分为三层：

1. `HeroList + autoSyncedHeroes + heroSyncOverrides`：仓库中的英雄身份、Icon、Full Art 等共享数据；Hero Sync 可以更新。
2. `src/data/heroArtFocusOverrides.ts`：仓库中的 **Panel / Side 公共裁切默认值**，随 Git 和 Release 分发。
3. `MatchState.heroArtOverrides / heroDataOverrides`：导播现场保存的运行时覆盖，持久化到 `data/match.json` 并进入备份，但 `data/` 被 Git 忽略。

运行时裁切优先于共享默认值。需要把现场验证过的 Panel / Side 构图发布给所有用户时，用 `npm run hero:crop-sync` 把第 3 层中的裁切元数据提升到第 2 层，再人工审查 Git diff。这个命令不会导出其他比赛状态，也不会自动 push GitHub。

## Player ID 与实验性 HUD 状态

开局 Player ID 对齐复用 Auto BP 的共享窗口流：Control 一次裁剪双方 10 个 ID，后端使用英文/简中常驻 OCR worker 生成候选，再在每队已知 5 人 roster 中求 120 种一一映射。双方都可信时通过 `set_player_slot_orders` 原子提交；单帧边缘结果可在连续相同排列下做两帧时间一致性复核。人工采用、人工交换、恢复自动和 ID 区域独立预设都不会修改 TeamPreset 本身。

`/overlay/game-hud` 与 `LiveGameStats` 已接入状态、持久化和 OBS Overlay，但 **HUD 仍处于测试阶段**。当前人头、推塔和中立资源主要由 Control 人工维护；自动读取真实游戏 HUD、长时间 OBS 稳定性和版本 UI 变化尚未完成验收，因此架构上将其视为 Experimental 模块，而不是 v1.0.0 的唯一官方比分源。

## 选手对齐、恢复、HUD 与赛后 MVP

已接入每局选手槽位映射、常驻本地 OCR、备份/停机恢复、实验性局内 HUD 和赛后数据草稿/MVP 页面。HUD 仍在测试阶段。参见 [功能与操作说明](../guides/player-alignment-recovery-hud.md) 与 [项目里程碑](../../MILESTONES.md)。
