# 第一版本地验证

## 替补快速换人增量验证（2026-09-23）

- 构建、lint 和 42 项服务器测试通过。
- 完整浏览器回归中，原有 13 组通过；新增下拉框标签修复后，队伍库/替补专项两组通过，合计覆盖 15 组场景。
- 实际验证保存替补照片、快速填入阵容、显式更新队伍不丢替补、BP 开始后换人、手工创建比赛调用其他已保存资料源且不替换队伍身份。
- 旧资料无替补字段可正常重载；运行时替补修改支持撤销和解说延迟。
- 本机 3001 服务已重新启动，比赛存档保持原有数据。

## V2.3 与队伍资料库验证（2026-09-23）

- 构建与 lint 通过。
- 40 项服务端测试全部通过：既有三种 BP 规则、延迟、换边与存档，以及新增照片上传权限/格式检查、队伍库 CRUD、重载恢复、独立副本、稳定身份、开赛锁定、禁止同队占双方和保留历史。
- 14 组 Chrome E2E 全部通过（约 2.9 分钟）：原有三端流程、语言切换、三种规则、两种 Overlay、移动端；新增两种桌面尺寸同屏、平板/手机固定阶段栏、蓝红先手各 18 步快捷录入、ACK 与输入法保护、真实 PNG/JPEG/WebP 上传、图片预览及撤销恢复、队伍库操作。
- 已查看桌面、900px 平板、390px 手机及队伍库截图。截图保存在 vite-project/artifacts/。
- 3001 本机新版服务已启动；health、Control、资料库接口返回 200。正式比赛存档未用于自动化测试，浏览器测试使用独立 3101 实例。
- 实际 OBS、Cloudflare 跨设备链路、10 张实际参赛选手照片仍需赛前实机彩排。
- 使用与备份说明见 [V2.3-IMPLEMENTATION.md](V2.3-IMPLEMENTATION.md)。


## V2 验证（2026-09-17）

构建及代码检查通过；服务端测试包含 Normal / Player / Global 三套独立逻辑，
验证有效局提交、重赛重置、历史锁定、换人换位置换边、即时比分、延迟快照和旧存档迁移。
6 组浏览器场景通过，三种规则各完成三局流程，核对实际 Hero Picker 禁用与可用状态、
未保存队名不随比分提交、语言切换、刷新恢复、历史归属和 1920×1080 Overlay。

截图：`vite-project/artifacts/v2-normal-overlay.png`、`v2-player-overlay.png`、`v2-global-overlay.png`。
实际 OBS 内置浏览器验收仍待完成；测试实例启动未成功，不将 Chromium 验收等同 OBS 验收。
详见 [V2-HANDOFF.md](V2-HANDOFF.md)。以下为第一阶段历史验证记录。

验证环境：Windows、Node.js 24.14.1、已安装的 Google Chrome。

| 检查 | 结果 |
| --- | --- |
| `npm run build` | 通过，前端与服务器 TypeScript 检查通过，Vite 8.3.0 生产构建成功 |
| `npm run lint` | 通过，0 错误 / 0 警告 |
| `npm test` | 15 项通过，含新增英雄数据与全部本地头像完整性检查 |
| `npm run test:e2e` | 3 个三端场景通过，约 2 分钟，含完整语言切换与刷新恢复 |
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
2026-09-17 复测通过，并补齐左右侧栏排版：确认全部英雄槽位于 1920×1080 画布内，
中间游戏窗口透明且不被两侧选手卡片覆盖；已核对修复后的英文直播截图。

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
