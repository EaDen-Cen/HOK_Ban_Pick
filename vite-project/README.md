# 应用目录

这是 HOK Broadcast 的前端、后端和测试执行目录。项目概览见 [根 README](../README.md)，全部说明见 [文档索引](../docs/README.md)。

使用 Node.js 24，以下命令在本目录执行：

```powershell
npm ci
npm run build
npm run server
```

开发时保持后端运行，在另一个终端执行 `npm run dev`。验证命令为 `npm test`、`npm run lint`、`npm run build`、`npm run test:e2e`；浏览器测试需要 Chrome，可通过 `CHROME_PATH` 指定路径。

- [第一次使用教程](../docs/guides/beginner-guide.md)
- [运行、部署与备份](../docs/guides/getting-started.md)
- [比赛操作及队伍资料库](../docs/guides/operator-guide.md)
- [Auto BP / 屏幕识别](../docs/guides/screen-recognition.md)
- [Windows 启动器](../docs/guides/windows-launcher.md)
- [v1.0.0 发布说明](../docs/releases/v1.0.0.md)
- [系统结构](../docs/design/architecture.md)

启动器、配置、源码、图片和测试素材保持原位置。`data/` 和 `artifacts/` 是本机生成目录；备份应覆盖比赛、队伍资料库及上传图片。原 Vite 模板说明见 [历史归档](../docs/archive/legacy/vite-template-readme.md)。


## Windows 快捷入口

- `start-broadcast.bat`：准备依赖、构建、启动 Broadcast 和 Quick Tunnel。
- `stop-broadcast.bat`：停止 Broadcast 与 tunnel。
- `start-bp-simulator.bat`：后台启动 BP Simulator，启动窗口完成后自动关闭。
- `stop-bp-simulator.bat`：停止 BP Simulator。
