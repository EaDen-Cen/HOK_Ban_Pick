# API 接口

所有比赛和识别接口使用 `Authorization: Bearer <角色 token>`。Control 可修改比赛，Caster / Overlay 只读；Caster 的比赛响应保持延迟。

| 接口 | 方法 | 用途 |
| --- | --- | --- |
| `/api/health` | GET | 进程健康检查 |
| `/api/access?role=control\|caster\|overlay` | GET | 连接检查；经验证的本机返回请求角色 token；Control 可获取分享 token |
| `/api/access?role=…` | POST | `{password}` 登录，也支持请求角色的 token |
| `/api/access` | PUT | Control 保存 `{password}`，轮换全部角色 token |
| `/api/match` | GET | 当前角色比赛快照 |
| `/api/heroes` | GET | 基础英雄数据 |
| `/api/v1/capabilities` | GET | 识别版本、提供者、形状与接口位置 |
| `/api/v1/recognition/frame` | POST | Control 上传浏览器头像裁剪；兼容路径 `/api/recognize-frame` |
| `/ws` | WebSocket | 身份认证、修订号动作、ACK 和状态广播 |

识别请求：`{revision, image, allowedHeroIds?, shape?}`。`image` 为 PNG/JPEG/WebP 的 base64 data URL；`shape` 为 square / circle。限制为 4 MiB 请求、3 MiB 解码文件及 400 万像素。显式空英雄池不会回退到全部英雄。响应包含 `preview`、`fingerprint`、`lockFingerprint`、`meanLuma`、`candidates: [{heroId, confidence}]`。confidence 是相似度，不是准确率。陈旧修订号返回 409。

未来 AI 实现 `HeroRecognitionProvider`，保持证据结构、修订号和 BP 校验流程；提供者只识别，不直接修改比赛。当前未提供 AI 模型、云端凭据或 AI 推理功能。

密码 8–256 字符，保存盐和 scrypt 哈希；修改后已连接页面通过 `access_token_update` 获取本角色新 token。离线页面重新登录。密码可取得 Control 权限，只读成员应使用角色分享 token。环境变量 `ACCESS_PASSWORD` 只在尚未配置密码时初始化。

## 选手对齐、恢复、HUD 与赛后 MVP

已接入每局选手槽位映射、常驻本地 OCR、备份/停机恢复、局内 HUD 和赛后数据草稿/MVP 页面。参见 [功能与操作说明](../guides/player-alignment-recovery-hud.md)。真实游戏和 OBS 验收状态见项目里程碑。

新增 Control API：

| 接口 | 行为 |
| --- | --- |
| GET /api/v1/recognition/players | 本地 OCR 就绪状态；Control 专用 |
| POST /api/v1/recognition/players | 十个 ID 裁剪，绑定双方 roster 与 gameNumber，返回两队映射建议；不直接写状态 |
| POST /api/v1/recognition/postgame | 十个数字裁剪 + reportId，返回数值、置信度和原图证据；不直接写草稿 |
| GET /api/recovery | 备份列表、最近自动备份时间与失败状态 |
| POST /api/recovery | 立即创建本机完整备份 |
| GET /api/match-export | 导出比赛/队伍/上传媒体，排除 access.json |

WS Action 新增 `set_player_slot_order`（side/order/expectedPlayers）、`live_game_stats`、`post_game_begin`、`post_game_fields`、`select_mvp`，沿用修订号校验、撤销、持久化及角色权限。选手 OCR 在 BP 并行推进时按阵容/当前局检验上下文，映射写入仍须使用当前 revision。新 OBS 路由 `/overlay/game-hud` 与 `/overlay/mvp` 使用 overlay 角色。
