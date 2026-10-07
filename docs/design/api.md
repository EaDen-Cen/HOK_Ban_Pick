# API 与扩展接口

[系统结构](architecture.md) · 当前接口版本用于 v1.0.0。

## 目标

服务器 API 分成两类：

1. **比赛 API**：Control/Caster/Overlay 当前已经使用。
2. **扩展 API**：为后续桌面软件、自动化工具和新的英雄识别 provider 预留稳定入口。

当前不对外承诺长期兼容所有内部字段；扩展工具应优先使用本文列出的入口。

## 鉴权

远程请求使用：

```http
Authorization: Bearer <role-password>
X-HOK-Role: control | caster | overlay
```

本机可信页面可以省略密码，但仍建议发送 `X-HOK-Role` 让服务器明确返回哪种视图。

远程角色权限：

- `control`：可读写比赛状态及 Control-only API。
- `caster`：只读延迟状态。
- `overlay`：只读实时 Overlay 状态。

## 当前比赛状态

```http
GET /api/match
```

返回当前角色可见的 snapshot，包括 `state` 与 `revision`。

实时操作仍通过 `/ws` 发送带 revision 的 action。外部程序不要直接修改 `match.json`。

## 英雄数据

```http
GET /api/heroes
```

返回当前服务器使用的英雄基础数据。

## 远程访问密码

```http
GET  /api/access-config
POST /api/access-config
```

仅 Control 可使用。POST 只需要提交要修改的角色，留空/省略的角色保持不变。

例如：

```json
{
  "caster": "new-caster-password"
}
```

服务器只持久化密码哈希。

## Recognition Provider Capability

```http
GET /api/recognition/providers
```

当前返回：

```json
{
  "apiVersion": 1,
  "activeProvider": "template-v1",
  "providers": [
    {
      "id": "template-v1",
      "kind": "local-template",
      "shapes": ["square", "circle"],
      "externalNetwork": false
    }
  ]
}
```

这个入口用于让未来的桌面软件或 Control 判断服务器支持哪些识别 provider。

## 单帧英雄识别

```http
POST /api/recognize-frame
```

当前请求核心字段：

```json
{
  "provider": "template-v1",
  "image": "data:image/jpeg;base64,...",
  "revision": 123,
  "allowedHeroIds": [1, 2, 3],
  "shape": "square"
}
```

- `provider` 当前可以省略；省略时使用 `template-v1`。
- `allowedHeroIds` 可用于把匹配范围缩小到合法候选。
- `shape` 为 `square` 或 `circle`。
- 服务器会拒绝 stale revision。

返回包含候选、相似度和用于锁定/稳定判断的画面特征。

## 未来 AI provider

未来加入 AI 不需要改 BP action 或 MatchState。推荐新增 provider，例如：

```text
template-v1
local-model-v1
ai-assisted-v1
```

新 provider 应遵循相同输出结构：

- `heroId`
- `confidence`
- 必要的画面/锁定特征

Control 的后续逻辑继续负责：

- 稳定性；
- Pick/Ban phase；
- 锁定判断；
- 人工审核；
- 高置信度自动录入；
- 服务器规则验证。

这样即使将来使用 AI，模型也只负责“看图给候选”，不会直接拥有修改比赛状态的权限。

## 桌面软件

未来打包为桌面软件时，可以复用同一组 HTTP / WebSocket 接口：

```text
Desktop shell
├─ embedded Control UI
├─ server lifecycle
├─ OBS/tunnel status
└─ same /api + /ws contract
```

因此桌面化不需要重新实现 BP 规则和比赛存储。
