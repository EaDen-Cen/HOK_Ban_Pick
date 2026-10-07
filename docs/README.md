# HOK Broadcast 文档

[返回项目首页](../README.md)

这里仅维护**当前版本可直接使用的文档入口**。旧交接、旧规划和历史原文统一放在 [archive](archive/README.md)，避免把已经失效的实施备注混进正式使用说明。

| 类别 | 文档 | 用途 |
| --- | --- | --- |
| 第一次使用 | [新手上手教程](guides/beginner-guide.md) | 从安装到跑通 Control、Simulator、Auto BP、OBS |
| 运行与部署 | [运行指南](guides/getting-started.md) | 本机、Quick Tunnel、域名、备份、Caster/Overlay |
| 现场操作 | [比赛操作指南](guides/operator-guide.md) | 比赛设置、手动/Auto BP、队伍库、替补、最终阵容 |
| Auto BP | [屏幕识别指南](guides/screen-recognition.md) | 18 框、锁定、自动录入、空 Ban、Simulator、性能 |
| Windows | [启动器说明](guides/windows-launcher.md) | Broadcast / Simulator 启停、Director app window |
| 系统设计 | [系统结构](design/architecture.md) | 状态流、鉴权、识别链路、性能策略 |
| 扩展接口 | [API 与扩展接口](design/api.md) | HTTP/WS、Recognition Provider、桌面软件/AI 预留 |
| 正式版本 | [v1.0.0 发布说明](releases/v1.0.0.md) | 当前正式版本功能和边界 |
| 验证 | [验证记录](validation/history.md) | CI、回归与仍需人工彩排的范围 |
| 英雄资料 | [研究索引](research/README.md)、[Hero Sync](research/hero-sync.md) | 英雄名单、来源、自动同步 |
| 历史资料 | [归档索引](archive/README.md) | 旧 handoff、旧计划、旧 README，仅供追溯 |

## 当前维护规则

- 用户操作文档只描述当前行为，不保留已经被替换的 UI、兼容模式或临时实现说明。
- 版本演进记录写进 [MILESTONES.md](../MILESTONES.md) 或版本发布说明，不混进日常操作步骤。
- 新功能如果改变 UI、配置、鉴权、API、数据目录或现场流程，应在同一个 PR 更新对应文档。
- Auto BP 算法调整必须同时更新 [屏幕识别指南](guides/screen-recognition.md) 和 [系统结构](design/architecture.md) 中的性能/行为说明。
- API 或未来 Provider 扩展统一维护在 [design/api.md](design/api.md)，不要让外部工具直接依赖内部文件结构。
- 测试数字只写进 [验证记录](validation/history.md)，并明确对应的日期/PR/run，不能把旧测试结果当成当前保证。
- `docs/archive/` 的内容是历史原文，可以保留当时版本号和旧做法；当前使用者不应按归档文档操作。

## 数据与隐私文档边界

当前运行数据默认位于 `vite-project/data/`：

- `match.json`
- `team-presets.json`
- `access-config.json`
- `uploads/player-portraits/`

远程访问密码只以 salt + scrypt hash 保存；本机 loopback 页面免密码，公网/域名访问使用 Control 中配置的独立角色密码。完整说明见 [运行指南](guides/getting-started.md) 与 [系统结构](design/architecture.md)。
