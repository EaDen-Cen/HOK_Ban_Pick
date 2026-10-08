# 系统结构

[文档索引](../README.md)

| 位置（仓库根目录起） | 职责 |
| --- | --- |
| `vite-project/src/main.tsx` → `BroadcastApp.tsx` | 当前前端入口、Control / Caster / Overlay |
| `vite-project/src/control/` | 导播工作区、设置、照片、队伍库 |
| `vite-project/src/overlay/` | OBS 布局和英雄揭示动画 |
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
- `server/recognitionProvider.ts` 定义未来 AI 提供者的请求/证据接口。当前只有 `local-template-v1`；没有调用 AI 服务。
- `/api/v1/capabilities` 返回识别协议能力；`/api/v1/recognition/frame` 与已有 `/api/recognize-frame` 共用权限、修订号和响应结构。

详细协议见 [API 接口](api.md)，性能复测见 `vite-project/scripts/benchmark-recognition.ts`。

## 选手对齐、恢复、HUD 与赛后 MVP

已接入每局选手槽位映射、常驻本地 OCR、备份/停机恢复、局内 HUD 和赛后数据草稿/MVP 页面。参见 [功能与操作说明](../guides/player-alignment-recovery-hud.md)。真实游戏和 OBS 验收状态见项目里程碑。
