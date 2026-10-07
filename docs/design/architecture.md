# 系统结构

[文档索引](../README.md) · 当前说明对应 v1.0.0 Release Candidate。

## 运行组件

| 位置 | 职责 |
| --- | --- |
| `vite-project/src/BroadcastApp.tsx` | Control / Caster / Overlay 主入口 |
| `vite-project/src/control/` | 比赛操作、Auto BP、最终阵容、队伍库、英雄数据编辑 |
| `vite-project/src/simulator/` | 独立 BP Simulator 控制页与采集页 |
| `vite-project/src/overlay/` | OBS 直播图层 |
| `vite-project/src/shared/` | 类型、BP 规则、语言、状态连接与迁移 |
| `vite-project/server/server.ts` | HTTP / WebSocket、鉴权、静态页面和 API 路由 |
| `vite-project/server/store.ts` | authoritative match state、revision、Undo、延迟历史和落盘 |
| `vite-project/server/access.ts` | 远程访问密码、localhost 信任与密码持久化 |
| `vite-project/server/capture.ts` | 本地模板识别、特征缓存、Ban 圆形匹配与识别性能控制 |
| `vite-project/server/teamPresets.ts` | 队伍资料库 |
| `vite-project/server/portraits.ts` | 选手照片上传与读取 |
| `vite-project/server/*.test.ts`、`e2e/` | 单元/服务端测试与浏览器回归 |
| `deploy/` | 域名、Caddy、Docker Compose 的公网部署入口 |

## 比赛状态流

```text
Control
  │ action + revision
  ▼
Node.js / WebSocket server
  │
  ├─ validate draft / lineup / settings
  ├─ durable write
  ├─ realtime snapshot ─────► Control
  ├─ realtime snapshot ─────► Overlay
  └─ delayed event snapshot ─► Caster
```

Control 的写操作只有在服务器验证并持久化后才 ACK。断线不会把未确认操作静默重放。

Caster 的延迟来自服务器事件时间线；这是**赛事数据延迟**，不等同直播视频延迟。

## Auto BP 数据流

```text
Browser-selected BP window
   │
   ├─ 18 normalized capture boxes
   │
   ▼
Control canvas crop (max 256 px, JPEG)
   │
   ▼
POST /api/recognize-frame
   │
   ▼
template-v1 recognition provider
   │
   ├─ primary centered variants
   ├─ difficult-frame fallback variants
   ├─ short-lived frame/result cache
   └─ square / circular matching
   │
   ▼
stability + lock evidence
   │
   ├─ review dialog
   └─ optional high-confidence auto-submit
```

Pick 与 Ban 的“看到英雄”与“确认锁定”是两层判断。高置信度自动录入只跳过审核弹窗，不跳过锁定条件，也不绕过服务器 BP 规则。

最终阵容识别只在各队已经 Pick 的五个英雄内求解。为避免与 OBS 编码争抢 CPU，10 个最终槽位限制为少量并发请求，并使用较低的扫描频率。

## 识别性能策略

默认目标不是把 CPU 跑满，而是给 OBS、游戏/模拟器和浏览器留出稳定余量：

- 浏览器识别截图最大边 256 px；
- 使用高质量 JPEG 减少编码和传输负担；
- 模板匹配先跑 4 个常用中心尺度，只有困难画面再跑偏移 fallback；
- 短时间重复帧直接复用识别结果；
- Sharp 默认限制为 2 个工作线程，可用 `HOK_RECOGNITION_THREADS=1..4` 调整；
- 最终阵容检测限制并发，避免十个槽位同时制造 CPU 峰值。

这些优化不改变 18 个识别框、BP 状态机或服务器校验逻辑。

## 访问与鉴权

本机页面满足以下条件时直接信任：

- 浏览器通过 `localhost` / `127.0.0.1` / `::1` 打开；
- 请求来自 loopback；
- 没有 Cloudflare / X-Forwarded 等转发头。

所以本机 Control、Caster、Overlay 不需要登录密码。

公网访问必须使用各自的远程密码：

- Control password
- Caster password
- Overlay password

三者由本机 Control 的“远程访问密码”面板设置并持久化到：

```text
vite-project/data/access-config.json
```

只保存带盐的 scrypt 哈希，不保存可读明文密码。Overlay 没有 token 时会显示登录页面，不再静默呈现空白/黑屏。

Docker/域名第一次部署可通过环境变量提供三组初始密码，之后再从 Control 轮换。

## 数据目录

默认：

```text
vite-project/data/
├─ match.json
├─ team-presets.json
├─ access-config.json
├─ director-browser-profile/
└─ uploads/player-portraits/
```

`DATA_FILE` 可以改变比赛数据基准路径，`UPLOAD_DIR` 可以单独改变选手图片目录。迁移/备份时应覆盖整个数据目录。

## API 扩展边界

当前识别 provider 为 `template-v1`。服务器已经提供 provider capability 路由，并允许识别请求声明 provider。未来可以在不改变 Control BP 状态机的前提下加入本地模型、GPU 模型或可选 AI provider。

接口约定见 [API 与扩展接口](api.md)。

## 部署边界

同一套前端/服务器既可以：

- 本机 `127.0.0.1:3001` 运行；
- 通过 Cloudflare Quick Tunnel 临时公开；
- 使用 `deploy/` + 自有域名 + Caddy 长期部署。

前端默认同域访问 API 与 WebSocket，因此未来获得域名后不需要重写页面路由。
