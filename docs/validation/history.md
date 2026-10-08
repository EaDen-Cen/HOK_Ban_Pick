> [文档索引](../README.md) · 除特别注明外，文件路径以仓库根目录为基准，npm 命令在 `vite-project/` 中执行。

## 2026-10-08：Wang Wei 方形头像风格二次修正

- 用户对比现有英雄头像后确认：把横向 Key Art 直接 `object-fit: cover` 成方图虽然去掉了金色圆框，但人物比例和背景复杂度仍与现有近景方形 Icon 差异明显。
- 新方案改用官方 HERO DATA 人物肖像作为临时 `imageLink`，新增 `Hero.iconCrop`，王维使用 `62% 36% / 1.65x` 近景裁切以去掉圆框并放大到头肩构图。
- `artLink` 继续保留横向 Key Art，`recognitionImageLink` 继续作为识别模板；三种用途不再互相污染。
- Hero Sync 新增 HERO DATA portrait 解析；辅助目录 Icon 缺失时只允许“官方人物肖像 + iconCrop”作为临时 UI 方案，**不再把横向 Key Art 当 Picker / Ban 图标**。
- Control Hero Picker、英雄图片编辑器网格、Broadcast Ban/Board、Draft History、Simulator 等主要头像入口统一应用 `iconCrop`。
## 2026-10-08：Wang Wei 小头像来源修正

- 现场截图确认 Wang Wei 的 `imageLink` 指向官网带装饰圆框的人物肖像，导致 Hero Picker / Ban 小头像直接显示金色圆框。
- UI 展示源改为官方横向 Key Art，由现有 `object-fit: cover` 自动裁成方形；原圆框肖像移到新的 `recognitionImageLink`，只供 Auto BP 模板识别使用。
- `Hero` 数据模型因此明确区分展示图片和识别模板，避免以后为了识别效果把不适合 UI 的素材暴露给用户。
- 新增回归测试，确保 Wang Wei 的 UI 图片不再等于圆框识别肖像，并验证远程识别模板只能来自受信任的 HOK 官方域名。

## 2026-10-08：Wang Wei / Hero Art 公共裁切同步

- PR #51 修复新英雄同步的一个来源故障边界：此前辅助目录已列出 Wang Wei（Camp 138），但英雄详情页返回 HTTP 502，旧流程因此跳过。现在新英雄先由官方 HOK 英雄页确认身份；辅助详情临时不可用时，可用已确认的官方 Key Art 作为临时图片来源。
- 程序内英雄增至 **119 个有效条目**；新增本地 ID 120：**Wang Wei / 王维 / Mid Lane / Camp 138**。Counter / Combo 保持未验证状态，不自动抓取。
- Wang Wei 当前使用官方 HOK 远程 portrait/key art 作为过渡素材。模板识别只信任 `world.honorofkings.com` / `camp.honorofkings.com`；远程素材不可达时只跳过该临时模板，不拖垮其余 Auto BP。后续 Hero Sync 取得稳定 Icon 后应转为本地 `/heroesImg`。
- Panel / Side 裁切公共默认值从 `heroArtFocus.ts` 拆到 Git 跟踪的 `src/data/heroArtFocusOverrides.ts`。Control 保存的现场覆盖仍在 `data/match.json -> state.heroArtOverrides`，不会自动提交到仓库。
- 新增 `npm run hero:crop-sync` 与 Windows `sync-hero-crops.bat`：只提升已知英雄的 Panel / Side x/y/scale，不导出比赛、队伍、选手、访问凭据、heroDataOverrides 或 `useLegacyImage`，并且只生成本地 Git diff，不自动 push。
- GitHub Actions `validate-pr`（run 37758535671）通过：Hero data validation、Build、158 项测试流程（含平台跳过项）与 ESLint 全部成功。第一次运行暴露了“所有 portrait 必须本地文件”的旧假设，随后改为只允许新未验证英雄使用受信任的官方临时远程图，并保持本地 portrait 回归测试离线执行。

## 2026-10-08：v1.0.0 发布前识别稳定性与文档冻结

基线：main `4d8f052`（PR #49 合并后）。

- PR #49 的 GitHub Actions `validate-pr` 已通过：Hero data validation、TypeScript/Vite production build、服务器/单元测试、ESLint 全部成功。
- Player ID 链路已覆盖：英文/简中独立常驻 OCR worker、soft 首轮快速识别、未通过队伍追加 threshold 170/190、120 种全局一一映射、双队原子更新、人工采用建议、恢复自动识别、ID 区域独立预设与两帧时间一致性复核。
- 新增 E2E 覆盖“连续两帧顺序相同，但两帧分别有不同弱槽位”的情况；只有合并后仍满足每槽 `.80`、平均 `.90`、margin `.06` 才自动通过。
- 当前 Simulator 现场测试观察：Player ID 完整核查最佳约 **1.8 秒**；BP 自动脚本在约 **1.5–2 秒**随机选角窗口下可稳定出结果。上述为当前测试环境观察值，不是所有赛事机/真实 HOK/OBS 并发环境的性能保证。
- BP Simulator 已拆分为 BP 识别、换英雄同步、Player ID 排序三个独立测试，并支持随机切换预选英雄、可调锁定 cue、Pick/Ban 尺寸。
- **M19 Game HUD 仍为 Experimental / 测试阶段**：当前人工统计与 Overlay 可用，但自动读取真实游戏 HUD、OBS 长时间稳定性和正式比分兜底尚未完成验证。发布文档不得把 HUD 描述为已正式验收功能。
- M20 赛后 MVP 基础采集/展示链路可用；自动判页、真实结算页全覆盖仍待实机验收。
- 仍需发布前人工 smoke test：真实 HOK BP、赛事机 + OBS 并发、录制音画稳定性、Quick Tunnel/远程解说、Game HUD（若启用）和 MVP 结算流程。

## 2026-10-07：性能、规则与访问流程

环境：Linux，Node.js 24.19.0；基线提交 5850b83。

- `npm test`：138 项，137 通过，1 项 Windows 原生采集测试因平台跳过。
- `npm run lint`：通过，无错误或警告。
- `npm run build`：前端及服务端 TypeScript 检查与生产构建通过。
- 回归覆盖本机凭据、代理免登录拒绝、密码持久化、三角色轮换、旧 token 失效、WS 同步、角色只读权限、缓存隔离、空英雄池、Global BP/元流之子随机选角和延迟事件到期。
- 新增 Overlay 登录及 1920×1080、1280×720、390×844 视口浏览器测试。当前环境没有浏览器，Chromium 下载未得到有效安装包，因此未执行浏览器测试；窗口视觉与真实 OBS 尚未验收。

性能对比使用 `HOK_BASELINE_PATH` 指向基线应用目录，运行 `npm run benchmark:recognition`。12 个不同英雄头像、不同尺寸/亮度，保留全部圆形多裁剪方案；另测 30 次相同头像证据请求，均排除首次模板初始化：

| 样本 | 基线平均 | 优化平均 |
| --- | ---: | ---: |
| 不同画面头像匹配 | 83.32ms | 24.25ms |
| 完全相同画面的证据请求 | 101.64ms | 0.089ms |

12 个样本的前五候选英雄顺序相同，最大分数差为 0。这是识别函数微基准，不是导播电脑整机 CPU、直播成功率或 OBS 掉帧率的测量。重复画面快路径只有在画面、形状和允许英雄池完全相同时生效。


> 本文是历次验证记录，测试通过数量及本机服务状态属于记录当时，不能视为本次整理已重新验证。截图与存档通常是本机未入库产物。

# 验证记录

## v1.0.0 Release Candidate 自动验证（2026-10-07）

- 分支：`release/v1.0.0`，PR #35。
- GitHub Actions `validate-pr` 已通过：
  - Install dependencies
  - Hero validation
  - TypeScript / Vite production build
  - Server / unit tests
  - ESLint
- 本次自动测试包含新增的 Simulator 随机等待区间 helper；既有 BP、Auto BP、存储与规则测试继续通过。
- 本次 RC 还包含现场操作相关修改：Auto BP“手动确认当前最高候选”、英雄数据编辑器头像网格、Simulator 后台启停、换英雄自动同步重试与文档重写。
- 上述浏览器/Windows 启动脚本与真实游戏画面仍建议在合并/打 tag 前做一次人工 smoke test。自动 CI 不能代替真实 HOK、浏览器窗口采集、OBS 与 Windows BAT/PowerShell 的现场验收。

## 文档目录整理验证（2026-09-23）

- 基线：main `bbcf24807596c75046ebb3e8a82d775c760c4dd6`；提交前再次核对远端 main 未变化。
- 环境：Windows、Node.js 24.14.1、npm 11.11.0。
- 本次实际执行：`npm run build`、`npm run lint`、`npm test` 全部通过，42 项服务器测试通过。
- 89 个仓库内 Markdown 文件链接目标存在；7 份历史归档正文保留，仅增加归档说明和调整文档引用。
- 211 个非 Markdown 已跟踪文件内容保持不变（比较时考虑 Git 的 Windows 换行转换）；包括源码、配置、锁文件、启动脚本、图片及研究 JSON。
- 本次只改文档，未运行浏览器 E2E、OBS、Cloudflare 或现场音画彩排，也未启动正式比赛实例。下文的历史测试结果不算作本次执行结果。

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
- 使用与备份说明见 [V2.3-IMPLEMENTATION.md](../guides/operator-guide.md)。


## V2 验证（2026-09-17）

构建及代码检查通过；服务端测试包含 Normal / Player / Global 三套独立逻辑，
验证有效局提交、重赛重置、历史锁定、换人换位置换边、即时比分、延迟快照和旧存档迁移。
6 组浏览器场景通过，三种规则各完成三局流程，核对实际 Hero Picker 禁用与可用状态、
未保存队名不随比分提交、语言切换、刷新恢复、历史归属和 1920×1080 Overlay。

截图：`vite-project/artifacts/v2-normal-overlay.png`、`v2-player-overlay.png`、`v2-global-overlay.png`。
实际 OBS 内置浏览器验收仍待完成；测试实例启动未成功，不将 Chromium 验收等同 OBS 验收。
详见 [V2-HANDOFF.md](../archive/handoffs/v2-handoff.md)。以下为第一阶段历史验证记录。

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

## 2026-10-08：M12A / M15 / M19 与 M20 基础链路

- `npm run build`、`npm run lint`：通过。
- `npm test`：148 项，147 通过，1 项 Windows 原生采集测试按平台跳过。
- 针对性 Playwright：选手身份绑定、共享窗口自动对齐及人工修正保护、HUD 刷新恢复、MVP 蓝红模板切换、Overlay 登录/缩放、导出凭据隔离通过。
- 本地英文/简体中文常驻模型的十区域合成英文 ID 测试：预加载约 484 ms，批量 OCR 约 212–276 ms；英雄模板识别基准：不同画面平均约 43.6 ms，重复证据缓存约 0.11 ms。这些数值不代表 Windows 导播电脑上游戏与 OBS 并发时的整条链路性能。
- Hero Sync：本地 118、远端 119；Wang Wei 详情源返回 502，保留人工审核，未强行新增。关系引用与本地图片验证通过。
- 全量旧 Playwright 脚本未全绿：旧识别测试仍查找当前 UI 已移除的 `Read region` 按钮。该超时在原始 main（0eb89e0）独立复现；部分旧脚本还依赖前一测试留下的语言/设置状态。没有将这些失败标记为通过。
- M12 实机 BP/录制验收、M13 实际托管、M16 安装包及 M19/M20 自动判页/稳定帧实机采集尚未完成。
