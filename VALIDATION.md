# 第一版本地验证

验证环境：Windows、Node.js 24.14.1、已安装的 Google Chrome。

| 检查 | 结果 |
| --- | --- |
| `npm run build` | 通过，前端与服务器 TypeScript 检查通过，Vite 8.3.0 生产构建成功 |
| `npm run lint` | 通过，0 错误 / 0 警告 |
| `npm test` | 11 项通过 |
| `npm run test:e2e` | 1 个完整三端场景通过，约 44 秒 |
| 安装时 npm audit | 0 个已知漏洞（此次安装检查结果，不代表未来保证） |

服务器测试覆盖两套 BP 顺序、精确延迟边界、元数据/比分/重置延迟、Undo 历史、
双向延迟校准、重复请求幂等、非法操作与过期版本、文件恢复及落盘失败、
HTTP/WS 权限、只读客户端、实时广播、延迟 REST/WS 和重新连接。

Chrome 测试同时打开 Control、Caster、Overlay，完成选禁、刷新、延迟隔离、
撤销和整套 18 步赛事 BP，然后阻断 WebSocket 消息，确认心跳发现故障并自动恢复。
修复了测试中发现的认证超时被误判为无效凭据的问题：认证超时现在允许重试。
测试验证英雄图片无加载失败、无页面运行异常、OBS 画布透明且没有横向溢出。

截图（测试数据，Caster 截图使用 0 秒延迟便于核对；本地正式默认仍为 180 秒）：

- `vite-project/artifacts/control.png`
- `vite-project/artifacts/caster.png`
- `vite-project/artifacts/overlay.png`

尚未验证：VPS/Docker 实际部署、OBS 实际 Browser Source、B站推流延迟、
异地解说音频与 Discord 最终音画同步、整场赛事持续运行及多地区网络条件。
以上需要使用真实账号、设备和服务器进行彩排。
