# 文档总索引

[返回项目首页](../README.md)

| 类别 | 入口 | 用途 |
| --- | --- | --- |
| 当前操作 | [新手上手](guides/beginner-guide.md)、[运行指南](guides/getting-started.md)、[操作指南](guides/operator-guide.md)、[Auto BP](guides/screen-recognition.md)、[Windows 启动器](guides/windows-launcher.md) | 第一次使用、安装部署、现场操作与屏幕识别 |
| 当前设计 | [系统结构](design/architecture.md)、[API 接口](design/api.md) | 代码职责、状态流与存储边界 |
| 发布说明 | [v1.0.0](releases/v1.0.0.md) | 正式版本功能、升级和已知边界 |
| 验证记录 | [历次验证](validation/history.md) | 按日期/版本保留结果和未验收范围 |
| 研究资料 | [研究索引](research/README.md)、[英雄自动同步](research/hero-sync.md) | 英雄核查、自动同步与原始 JSON 证据 |
| 历史交接 | [归档索引](archive/README.md) | 版本交接、旧计划与原始说明 |

## 命名和维护规则

- 根目录仅放项目 README（许可证保持原位）；应用目录 README 仅说明执行入口。
- 当前指南使用稳定的小写英文连字符名称，更新原文，不为每次会话新增交接文件。
- 版本交接归入 `archive/handoffs/`，历史计划归入 `archive/planning/`；日期使用 YYYY-MM-DD。
- 测试结果写入验证记录并注明日期、环境、实际执行和未验证范围，不能混入当前操作步骤。
- 研究叙述放在 `docs/research/`，原始证据继续放在根目录 `research/`。
- 新增或移动文档同步修改本索引及相对链接；旧资料保留，不把历史需求当现状。
- 文中源码、运行数据和产物路径默认以仓库根目录为基准；npm 命令在 `vite-project/` 执行。历史原文的路径仍按其注明的原上下文理解。

## 选手对齐、恢复、HUD 与赛后 MVP

已接入每局选手槽位映射、常驻本地 OCR、备份/停机恢复、局内 HUD 和赛后数据草稿/MVP 页面。参见 [功能与操作说明](guides/player-alignment-recovery-hud.md)。真实游戏和 OBS 验收状态见项目里程碑。
