> [文档索引](../README.md) · 除特别注明外，文件路径以仓库根目录为基准，npm 命令在 `vite-project/` 中执行。

# Windows one-click broadcast launcher

From `vite-project`, double-click `start-broadcast.bat`.

首次使用或更新源码后可以直接运行启动器：它会根据 `package-lock.json` 检查依赖并执行生产构建。下文 `artifacts/` 路径均相对于 `vite-project/`。

It will:
1. stop any old process listening on port 3001 and any old `cloudflared.exe`;
2. verify Node/npm/cloudflared;
3. start `npm run server`;
4. wait until the local Control page responds;
5. start a Cloudflare Quick Tunnel;
6. capture the new `trycloudflare.com` address;
7. save the public, Control, Caster, and Overlay URLs to `artifacts/current-public-url.txt`;
8. open the local Control in a dedicated Director app window (Edge/Chrome app mode with its own local profile).

Keep the server and tunnel windows running during the event. Double-click `stop-broadcast.bat` when finished.

The local operator intentionally uses `http://127.0.0.1:3001/control`; loopback pages are trusted without a password. Remote Control/Caster/Overlay clients use the generated HTTPS URL and the user-defined passwords configured from local Control.

If startup fails, inspect `artifacts/cloudflared.log` and `artifacts/server.log`. Remote passwords are not hard-coded by the launcher: after first local startup, use Control → **Remote access passwords** to configure or rotate them.


## BP Simulator 一键启动

双击：

```text
start-bp-simulator.bat
```

启动器会检查 Node/npm、准备依赖、清理旧的 5173 端口进程，然后通过隐藏 PowerShell 后台启动 Vite Simulator。页面就绪后自动打开 Simulator Control，启动命令窗口随后关闭。

后台日志：

```text
artifacts/bp-simulator.log
```

测试结束后双击：

```text
stop-bp-simulator.bat
```

它会停止监听 5173 端口的 Simulator。正常使用不再需要一直保留一个 CMD/PowerShell 窗口。

## Director app window

`start-broadcast.bat` now calls `vite-project/open-director.ps1` for the local operator.

The launcher prefers Microsoft Edge, then Chrome, and opens Control with `--app=` rather than as a normal browser tab. A dedicated profile is stored under:

```text
vite-project/data/director-browser-profile/
```

This keeps Control isolated from the operator's normal browser profile and avoids inheriting a saved per-site zoom level. The Auto BP calibration UI also blocks Ctrl/Cmd zoom shortcuts and Ctrl+wheel while it is mounted.

This is the first desktopization step, not the final distributable EXE. It deliberately reuses the existing server and browser engine while the Auto BP workflow is still being validated. The planned Electron package can later bundle the same Control UI, server lifecycle, tunnel status and logs without changing match-state APIs.


## 公网域名预留

当前前端默认使用同域 `/api` 和 `/ws`，因此 Quick Tunnel、反向代理和未来固定域名使用同一套页面。仓库已经保留 `deploy/compose.yaml` 与 Caddy 配置；获得域名后只需要配置域名、HTTPS origin 和首次启动的三组远程密码，不需要改写 Control/Caster/Overlay 路由。

## 未来桌面软件

当前 Edge/Chrome `--app` 是轻量 Director 窗口。里程碑中保留了正式打包阶段：未来可以用 Electron 等桌面壳统一接管 Server 启停、原生窗口采集、Tunnel/域名状态、日志、备份和更新，同时继续复用现有 HTTP/WebSocket API，而不是重新写比赛规则。
