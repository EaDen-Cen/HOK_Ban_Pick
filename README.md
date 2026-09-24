# HOK Broadcast · 王者荣耀赛事 BP 导播系统

基于 React、TypeScript、Node.js 与 WebSocket，提供操作台、延迟解说台及 OBS 直播画面。当前 main 包含 V2.3 导播快捷录入、选手照片上传、服务器端队伍资料库及替补快速换人。

## 快速启动

使用 Node.js 24，首次下载并启动：

```powershell
git clone https://github.com/EaDen-Cen/HOK_Ban_Pick.git
cd HOK_Ban_Pick/vite-project
npm ci
npm run build
npm run server
```

本机开发入口：[操作台](http://127.0.0.1:3001/control#token=local-control)、[解说台](http://127.0.0.1:3001/caster#token=local-caster)、[OBS](http://127.0.0.1:3001/overlay/draft#token=local-overlay)。这些口令仅用于本机开发；公网部署按运行指南配置独立口令。

## 文档导航

| 需要做什么 | 文档 |
| --- | --- |
| 安装、三端接入、延迟、备份和部署 | [运行指南](docs/guides/getting-started.md) |
| 比赛流程、快捷 BP、照片、队伍库及替补 | [操作指南](docs/guides/operator-guide.md) |
| Windows 一键启动及 Cloudflare | [启动器说明](docs/guides/windows-launcher.md) |
| 理解源码目录和状态流 | [系统结构](docs/design/architecture.md) |
| 查看项目阶段与未来路线 | [项目里程碑](MILESTONES.md) |
| 查看历次测试及未验收范围 | [验证记录](docs/validation/history.md) |
| 查英雄资料来源 | [研究索引](docs/research/README.md) |\n| 自动检查英雄名单更新 | [英雄数据自动同步](docs/research/hero-sync.md) |
| 查旧交接、旧计划和原项目介绍 | [历史归档](docs/archive/README.md) |
| 查全部文档、旧路径去向及维护规则 | [文档总索引](docs/README.md) |

## 仓库结构

```text
README.md           项目入口
LICENSE.txt         MIT 许可
docs/               当前指南、设计、验证、研究索引、历史归档
research/           英雄研究原始 JSON 证据（保留原路径）
deploy/             Docker Compose / Caddy / 环境变量示例
vite-project/       应用与 npm 命令执行目录
  src/              前端、共享类型与 BP 规则
  server/           状态存储、HTTP/WS、上传与队伍资料库
  e2e/              浏览器测试与测试素材
  public/           静态图片
  data/             运行时比赛、队伍库、上传图片（不入库）
  artifacts/        本机测试截图、日志等（不入库）
```

开发和验证命令见 [应用目录说明](vite-project/README.md)。OBS、跨设备公网和音画同步仍需真实设备彩排；历史自动测试结果不能代替现场验收。

基于 qiqi47 的原项目，保留原英雄数据及 [MIT 许可](LICENSE.txt)。[原中英文 README](docs/archive/legacy/upstream-readme.md) 已完整归档，其旧站点及旧安装说明仅作历史参考。
