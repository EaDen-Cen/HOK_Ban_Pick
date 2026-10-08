# HOK Broadcast · 王者荣耀赛事 BP 导播系统

基于 React、TypeScript、Node.js 与 WebSocket 的社区赛事导播系统，提供 Control 操作台、延迟 Caster 解说台、OBS Overlay、Auto BP 屏幕识别、18 槽位校准预设、选手 P1–P5 自动对齐、最终阵容换英雄同步、备份恢复、赛后 MVP 页面与独立 BP Simulator。当前发布目标为 **v1.0.0**。

> **发布状态（2026-10-08）**：核心 BP / Auto BP / Player ID / 换英雄链路已进入 Release Candidate 状态。Simulator 中 BP 极限测试在约 **1.5–2 秒**选角窗口下可稳定出结果，选手顺序核查最佳实测约 **1.8 秒**；这些是当前测试环境成绩，不等于真实比赛设备 SLA。**局内 HUD 仍处于测试阶段**：可用于彩排和 OBS 预览，但在真实比赛、自动数据采集与长时间运行完成验收前，不应作为唯一官方比分来源。

## 低配置导播优化

- 比赛状态按角色/版本缓存；延迟事件二分查询，避免重复复制与序列化。
- 识别保留全部多裁剪方案，减少中间图片编码并复用完全相同画面的证据。
- 重型编辑器与模拟器按需加载；Overlay / Simulator 画布等比适配窗口。
- Simulator 随机选角共用 Control 的 BP 规则；可随机切换预选英雄，最终预选保留稳定窗口，锁定 cue 默认约 1.1 秒并可调。
- 识别高级项可设置 50%–100% 自动输入阈值；英雄高级数据默认收起。
- 本机免登录，远程密码及角色 token 在“访问与网站设置”管理；Overlay 缺少凭据时显示登录。

API 与未来 AI 提供者接口见 [协议文档](docs/design/api.md)，软件打包计划见 [里程碑](MILESTONES.md)。

## 英雄数据与广播裁切同步

英雄数据同步已补上 **Wang Wei / 王维（release-order ID 119，Camp ID 138）**。此前同步器已经从远端目录发现 Wang Wei，但辅助目录的英雄详情页返回 HTTP 502，旧逻辑因此跳过。当前人工整理后的标准小头像继续使用 `/heroesImg/120.png`；这里的 120 只是历史资产文件名，已经与程序 hero ID 解耦。

Panel（底部横排）和 Side（左右竖排）的裁切有两层存储：

- Control 中点击“保存英雄图片”后，当前机器的调整仍保存在 `data/match.json -> state.heroArtOverrides`，会进入本机备份，但 `data/` 被 Git 忽略，**不会自己上传 GitHub**。
- 可共享的默认裁切现在单独保存在 Git 跟踪文件 `src/data/heroArtFocusOverrides.ts`。在实际做过裁切的导播电脑上运行 `sync-hero-crops.bat`，或在 `vite-project/` 执行 `npm run hero:crop-sync`，会把运行时 Panel/Side 裁切提升到这个文件。检查 diff 后正常 commit/push，即可随 GitHub、Release 和其他电脑同步。

同步命令只导出 `panel/side` 的 x/y/scale，不会把比赛、队伍、密码、选手资料或 `useLegacyImage` 一并提交。程序也不会在后台擅自推送 GitHub。

## 快速启动

第一次使用建议先看 [新手上手教程](docs/guides/beginner-guide.md)。

使用 Node.js 24，从源码启动：

```powershell
git clone https://github.com/EaDen-Cen/Honor-of-Kings-International-Server-Tournament-Broadcasting-System.git
cd Honor-of-Kings-International-Server-Tournament-Broadcasting-System/vite-project
npm ci
npm run build
npm run server
```

Windows 现场使用可直接双击 `vite-project/start-broadcast.bat`；启动器会准备依赖、构建网页、启动服务器和 Cloudflare Quick Tunnel。结束时双击 `stop-broadcast.bat`。

本机开发入口：[操作台](http://127.0.0.1:3001/control)、[解说台](http://127.0.0.1:3001/caster)、[OBS](http://127.0.0.1:3001/overlay/draft)。本机连接由服务器验证后免登录；远程密码在导播的“访问与网站设置”中配置。

<!-- HERO-SYNC:ROSTER:START -->
## 程序内英雄池

当前 `main` 分支程序内共有 **119 个有效英雄条目**。英雄 ID 现在按国际服官网 **Launch Time 从旧到新连续编号**：ID 越大代表越晚上架；“上线时间（新→旧）”排序可直接使用 ID，不再依赖缺失的 releaseDate 数据。

> 本表由 Hero Data Synchronizer 自动生成。头像文件路径与英雄 ID 已解耦，因此你刚整理好的 `public/heroesImg/` 不需要为了这次编号迁移重新命名。

| ID | 中文名 | English |
| ---: | --- | --- |
| 1 | 杨戬 | Yang Jian |
| 2 | 干将莫邪 | Gan & Mo |
| 3 | 猪八戒 | Ata |
| 4 | 云樱 | Ying |
| 5 | 镜 | Jing |
| 6 | 澜 | Lam |
| 7 | 孙策 | Sun Ce |
| 8 | 李信 | Li Xin |
| 9 | 瑶 | Yaria |
| 10 | 米莱狄 | Milady |
| 11 | 裴擒虎 | Pei |
| 12 | 公孙离 | Arli |
| 13 | 凯 | Kaizer |
| 14 | 诸葛亮 | Kongming |
| 15 | 东皇太一 | Donghuang |
| 16 | 蔡文姬 | Cai Yan |
| 17 | 雅典娜 | Athena |
| 18 | 女娲 | Nuwa |
| 19 | 钟馗 | Kui |
| 20 | 虞姬 | Consort Yu |
| 21 | 李元芳 | Fang |
| 22 | 张飞 | Zhang Fei |
| 23 | 后羿 | Hou Yi |
| 24 | 孙悟空 | Wukong |
| 25 | 亚瑟 | Arthur |
| 26 | 花木兰 | Mulan |
| 27 | 兰陵王 | Gao Changgong |
| 28 | 王昭君 | Wang Zhaojun |
| 29 | 韩信 | Han Xin |
| 30 | 安琪拉 | Angela |
| 31 | 貂蝉 | Diaochan |
| 32 | 老夫子 | Fuzi |
| 33 | 项羽 | Xiang Yu |
| 34 | 狄仁杰 | Di Renjie |
| 35 | 马可波罗 | Marco Polo |
| 36 | 李白 | Li Bai |
| 37 | 宫本武藏 | Musashi |
| 38 | 典韦 | Dian Wei |
| 39 | 周瑜 | Zhou Yu |
| 40 | 吕布 | Lu Bu |
| 41 | 扁鹊 | Dr Bian |
| 42 | 孙膑 | Sun Bin |
| 43 | 钟无艳 | Wuyan |
| 44 | 高渐离 | Gao |
| 45 | 刘禅 | Liu Shan |
| 46 | 庄周 | Zhuangzi |
| 47 | 鲁班七号 | Luban No.7 |
| 48 | 孙尚香 | Lady Sun |
| 49 | 妲己 | Daji |
| 50 | 墨子 | Mozi |
| 51 | 赵云 | Zilong |
| 52 | 小乔 | Xiao Qiao |
| 53 | 廉颇 | Lian Po |
| 54 | 不知火舞 | Mai Shiranui |
| 55 | 娜可露露 | Nakoruru |
| 56 | 梦奇 | Menki |
| 57 | 云中君 | Cirrus |
| 58 | 关羽 | Guan Yu |
| 59 | 莱西奥 | Alessio |
| 60 | 甄姬 | Lady Zhen |
| 61 | 橘右京 | Ukyo Tachibana |
| 62 | 夏洛特 | Charlotte |
| 63 | 大乔 | Da Qiao |
| 64 | 狂铁 | Biron |
| 65 | 姬小满 | Mayene |
| 66 | 张良 | Liang |
| 67 | 达摩 | Dharma |
| 68 | 明世隐 | Ming |
| 69 | 百里守约 | Shouyue |
| 70 | 露娜 | Luna |
| 71 | 亚连 | Allain |
| 72 | 阿古朵 | Agudo |
| 73 | 艾琳 | Erin |
| 74 | 司马懿 | Sima Yi |
| 75 | 夏侯惇 | Dun |
| 76 | 朵莉亚 | Dolia |
| 77 | 海诺 | Heino |
| 78 | 刀锋宝贝 | Butterfly |
| 79 | 上官婉儿 | Shangguan |
| 80 | 黄忠 | Huang Zhong |
| 81 | 刘备 | Liu Bei |
| 82 | 鬼谷子 | Guiguzi |
| 83 | 伽罗 | Garo |
| 84 | 杨玉环 | Yuhuan |
| 85 | 哪吒 | Nezha |
| 86 | 劳拉 | Luara |
| 87 | 曜 | Yao |
| 88 | 敖隐 | Ao'yin |
| 89 | 大司命 | Augran |
| 90 | 姜子牙 | Ziya |
| 91 | 刘邦 | Liu Bang |
| 92 | 少司缘 | Dyadia |
| 93 | 蒙犽 | Meng Ya |
| 94 | 西施 | Shi |
| 95 | 芈月 | Mi Yue |
| 96 | 弈星 | Yixing |
| 97 | 百里玄策 | Xuance |
| 98 | 阿轲 | Arke |
| 99 | 桑启 | Sakeer |
| 100 | 暃 | Feyd |
| 101 | 苍 | Chano |
| 102 | 白起 | Bai Qi |
| 103 | 法提赫 | Fatih |
| 104 | 元流之子（坦克） | Flowborn (Tank) |
| 105 | 元流之子（法师） | Flowborn (Mage) |
| 106 | 元流之子（刺客） | Flowborn (Assassin) |
| 107 | 元流之子（射手） | Flowborn (Marksman) |
| 108 | 元流之子（辅助） | Flowborn (Roamer) |
| 109 | 影 | Umbrosa |
| 110 | 迦楼罗 | Garuda |
| 111 | 拉普拉普 | Lapulapu |
| 112 | 蚩奼 | Chicha |
| 113 | 海月 | Haya |
| 114 | 元歌 | Yango |
| 115 | 安奈特 | Annette |
| 116 | 弗洛伦 | Florentino |
| 117 | 洛里昂 | Lorion |
| 118 | 谛梵罗 | Devara |
| 119 | 王维 | Wang Wei |
<!-- HERO-SYNC:ROSTER:END -->

## BP 屏幕采集模拟器

为了测试 Auto BP，不必每次进入真实游戏房间。仓库提供一套与正式比赛状态完全隔离的 **BP Simulator**：

```powershell
cd vite-project
npm run simulator
```

Windows 推荐直接运行：

```text
vite-project/start-bp-simulator.bat
```

启动器会把 Simulator 放到后台运行并自动关闭命令窗口。测试结束后运行：

```text
vite-project/stop-bp-simulator.bat
```

控制台与采集画面分别为：

```text
http://127.0.0.1:5173/tools/bp-simulator-control
http://127.0.0.1:5173/tools/bp-simulator
```

模拟器分为 **BP 识别、换英雄同步、选手 ID 排序** 三个独立测试模式，可复现 Pick、双选、圆形 Ban、空 Ban、蓝/红先手、预选英雄随机切换、换英雄与完整 BP phase 顺序；还可调整 Pick 头像/Ban 位尺寸并记录 Player ID 核查耗时。控制页新增 **“从 Control 同步模拟器数据”**：BP 模式读取当前 Ban/Pick 进度，换英雄模式直接读取当前最终 assignments 作为测试基线，Player ID 模式读取双方名单与 P1–P5 顺序；该按钮只读 Control，不会反向修改比赛。然后在 HOK Control 的 Auto BP 中选择 Simulator 的采集画面窗口即可。

LoL 项目中值得移植的功能优化及已移植内容见 [HOK / LoL 功能对照审计](docs/research/lol-feature-parity-audit-2026-10-06.md)。

## 文档导航

| 需要做什么 | 文档 |
| --- | --- |
| 第一次使用，从下载安装到完成一轮测试 | [新手上手教程](docs/guides/beginner-guide.md) |
| 安装、三端接入、延迟、备份和部署 | [运行指南](docs/guides/getting-started.md) |
| 比赛流程、快捷 BP、照片、队伍库及替补 | [操作指南](docs/guides/operator-guide.md) |
| Windows 一键启动、Simulator 启停及 Cloudflare | [启动器说明](docs/guides/windows-launcher.md) |
| Auto BP、18 框校准、Player ID、预设、锁定与换英雄 | [屏幕识别指南](docs/guides/screen-recognition.md) |
| v1.0.0 功能与已知边界 | [v1.0.0 发布说明](docs/releases/v1.0.0.md) |
| 理解源码目录和状态流 | [系统结构](docs/design/architecture.md) |
| 查看项目阶段与未来路线 | [项目里程碑](MILESTONES.md) |
| 查看历次测试及未验收范围 | [验证记录](docs/validation/history.md) |
| 查英雄资料来源 | [研究索引](docs/research/README.md) |
| 自动检查英雄名单更新 | [英雄数据自动同步](docs/research/hero-sync.md) |
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

## 选手对齐、恢复、HUD 与赛后 MVP

已接入每局选手槽位映射、常驻本地 OCR、双队原子顺序更新、两帧边缘结果复核、ID 区域独立预设、备份/停机恢复，以及赛后数据草稿/MVP 页面。局内 HUD 已有可用的人工统计与 OBS Overlay，但**仍属于测试功能**；在真实 HOK HUD、OBS 长时间运行和自动数据采集完成验收前，请保留人工比分/官方观战 UI 作为兜底。参见 [功能与操作说明](docs/guides/player-alignment-recovery-hud.md)。真实游戏和 OBS 验收状态见 [项目里程碑](MILESTONES.md)。
