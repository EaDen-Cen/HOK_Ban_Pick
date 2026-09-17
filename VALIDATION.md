# 第一版本地验证

验证环境：Windows、Node.js 24.14.1、已安装的 Google Chrome。

| 检查 | 结果 |
| --- | --- |
| `npm run build` | 通过，前端与服务器 TypeScript 检查通过，Vite 8.3.0 生产构建成功 |
| `npm run lint` | 通过，0 错误 / 0 警告 |
| `npm test` | 15 项通过，含新增英雄数据与全部本地头像完整性检查 |
| `npm run test:e2e` | 3 个三端场景通过，约 1.9 分钟，含完整语言切换与刷新恢复 |
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
- `vite-project/artifacts/updated-heroes-overlay.png`

## 2026-09-16 英雄补齐验证

已验证全部 21 条新记录与头像可用、旧 95 个有效 ID 保留、无重复 ID/空白名称、
关系引用有效且无自身引用、本地 PNG/JPEG/WebP 资源有效。
浏览器逐项加载新增头像，检查旧名 Loong 可检索 Ao'yin、Feyd/Haya 位置筛选，
并将 Yango、Umbrosa、Annette、Flowborn (Mage)、Feyd 输入 BP，验证操作页、
解说页和 Overlay 一致，且新增英雄仍遵守解说延迟。完整 18 步 BP、刷新与断线恢复测试也通过。

中文名称补齐后，已重新构建并重启本地服务，确认 `/api/heroes` 的全部 21 条新增记录
均含中文显示名；9 条英文占位已替换，中英文搜索与本地头像继续可用。
中文名及其来源保存在 `research/new-hero-chinese-names.json`。

## 完整中英文切换与队伍关系分析

比赛设置中的“界面语言”统一切换控制台、解说页、两种直播布局、设置表单、
登录、错误提示及英雄名称，每处只显示当前语言。选择后保存生效，刷新仍保留。
解说页的语言设置随延迟比赛快照更新，不读取实时比赛信息。
两队关系分析分别显示蓝方/红方、实际队名、队徽和对手，英雄名称悬停提示只显示所选语言。
构建、代码检查、15 项服务器/数据测试和 3 组三端浏览器场景通过。
三端测试新增动态改队名检查：实时端立即更新，解说延迟 180 秒时不泄漏新队名，
调到 0 秒后各队分析标题正确对应。另已只读检查本地设置页及解说页，确认中文标签和蓝红标识正常。
完整语言场景检查了保存前后、三端英文文案、标题/悬停/输入提示、英文比分校验错误、
中文检索英文英雄名、英文位置筛选、刷新保持、两种直播布局，以及切回中文。
另外检查了本地登录页语言切换与无效口令的英文提示，未修改本地比赛状态。

- `vite-project/artifacts/settings-zh.png`
- `vite-project/artifacts/caster-teams-zh.png`
- `vite-project/artifacts/settings-en.png`
- `vite-project/artifacts/control-en.png`
- `vite-project/artifacts/caster-en.png`
- `vite-project/artifacts/overlay-en.png`
- `vite-project/artifacts/overlay-side-en.png`

尚未验证：VPS/Docker 实际部署、OBS 实际 Browser Source、B站推流延迟、
异地解说音频与 Discord 最终音画同步、整场赛事持续运行及多地区网络条件。
以上需要使用真实账号、设备和服务器进行彩排。
