# HOK Broadcast · 王者荣耀赛事 BP 导播系统

基于 React、TypeScript、Node.js 与 WebSocket 的社区赛事导播系统，提供 Control 操作台、延迟 Caster 解说台、OBS Overlay、Auto BP 屏幕识别、18 槽位校准预设、最终阵容换英雄同步与独立 BP Simulator。当前版本面向首个正式版本 **v1.0.0**。

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

本机入口：[操作台](http://127.0.0.1:3001/control)、[解说台](http://127.0.0.1:3001/caster)、[OBS Overlay](http://127.0.0.1:3001/overlay/draft)。通过 `localhost` / `127.0.0.1` 打开的本机页面会自动信任，不需要密码。需要公网访问时，在本机 Control 的 **远程访问密码** 面板分别设置 Control / Caster / Overlay 密码；Overlay 未认证时会显示登录页。

<!-- HERO-SYNC:ROSTER:START -->
## 程序内英雄池

当前 `main` 分支程序内共有 **118 个有效英雄条目**。英雄 ID 与程序持久化数据直接关联，因此旧 ID 不会复用；**ID 29 为历史保留空位**，不属于当前英雄池。

> 本表由 Hero Data Synchronizer 自动生成，用于快速核对程序当前实际包含的英雄。请勿手工维护表格；英雄同步 PR 会自动刷新这里。

| ID | 中文名 | English |
| ---: | --- | --- |
| 1 | 阿古朵 | Agudo |
| 2 | 莱西奥 | Alessio |
| 3 | 亚连 | Allain |
| 4 | 安琪拉 | Angela |
| 5 | 公孙离 | Arli |
| 6 | 亚瑟 | Arthur |
| 7 | 猪八戒 | Ata |
| 8 | 雅典娜 | Athena |
| 9 | 大司命 | Augran |
| 10 | 狂铁 | Biron |
| 11 | 刀锋宝贝 | Butterfly |
| 12 | 蔡文姬 | Cai Yan |
| 13 | 西施 | Shi |
| 14 | 夏洛特 | Charlotte |
| 15 | 云中君 | Cirrus |
| 16 | 虞姬 | Consort Yu |
| 17 | 大乔 | Da Qiao |
| 18 | 妲己 | Daji |
| 19 | 达摩 | Dharma |
| 20 | 狄仁杰 | Di Renjie |
| 21 | 典韦 | Dian Wei |
| 22 | 貂蝉 | Diaochan |
| 23 | 朵莉亚 | Dolia |
| 24 | 东皇太一 | Donghuang |
| 25 | 扁鹊 | Dr Bian |
| 26 | 夏侯惇 | Dun |
| 27 | 少司缘 | Dyadia |
| 28 | 艾琳 | Erin |
| 30 | 老夫子 | Fuzi |
| 31 | 干将莫邪 | Gan & Mo |
| 32 | 高渐离 | Gao |
| 33 | 伽罗 | Garo |
| 34 | 关羽 | Guan Yu |
| 35 | 鬼谷子 | Guiguzi |
| 36 | 韩信 | Han Xin |
| 37 | 海诺 | Heino |
| 38 | 后羿 | Hou Yi |
| 39 | 黄忠 | Huang Zhong |
| 40 | 镜 | Jing |
| 41 | 凯 | Kaizer |
| 42 | 诸葛亮 | Kongming |
| 43 | 钟馗 | Kui |
| 44 | 孙尚香 | Lady Sun |
| 45 | 甄姬 | Lady Zhen |
| 46 | 澜 | Lam |
| 47 | 李白 | Li Bai |
| 48 | 李信 | Li Xin |
| 49 | 廉颇 | Lian Po |
| 50 | 张良 | Liang |
| 51 | 刘邦 | Liu Bang |
| 52 | 刘备 | Liu Bei |
| 53 | 刘禅 | Liu Shan |
| 54 | 敖隐 | Ao'yin |
| 55 | 吕布 | Lu Bu |
| 56 | 劳拉 | Luara |
| 57 | 鲁班七号 | Luban No.7 |
| 58 | 露娜 | Luna |
| 59 | 不知火舞 | Mai Shiranui |
| 60 | 马可波罗 | Marco Polo |
| 61 | 姬小满 | Mayene |
| 62 | 蒙犽 | Meng Ya |
| 63 | 梦奇 | Menki |
| 64 | 米莱狄 | Milady |
| 65 | 明世隐 | Ming |
| 66 | 墨子 | Mozi |
| 67 | 花木兰 | Mulan |
| 68 | 宫本武藏 | Musashi |
| 69 | 娜可露露 | Nakoruru |
| 70 | 哪吒 | Nezha |
| 71 | 女娲 | Nuwa |
| 72 | 裴擒虎 | Pei |
| 73 | 兰陵王 | Gao Changgong |
| 74 | 王昭君 | Wang Zhaojun |
| 75 | 上官婉儿 | Shangguan |
| 76 | 百里守约 | Shouyue |
| 77 | 司马懿 | Sima Yi |
| 78 | 孙膑 | Sun Bin |
| 79 | 孙策 | Sun Ce |
| 80 | 橘右京 | Ukyo Tachibana |
| 81 | 孙悟空 | Wukong |
| 82 | 钟无艳 | Wuyan |
| 83 | 项羽 | Xiang Yu |
| 84 | 小乔 | Xiao Qiao |
| 85 | 杨戬 | Yang Jian |
| 86 | 曜 | Yao |
| 87 | 瑶 | Yaria |
| 88 | 杨玉环 | Yuhuan |
| 89 | 李元芳 | Fang |
| 90 | 张飞 | Zhang Fei |
| 91 | 周瑜 | Zhou Yu |
| 92 | 庄周 | Zhuangzi |
| 93 | 赵云 | Zilong |
| 94 | 姜子牙 | Ziya |
| 95 | 云樱 | Ying |
| 96 | 芈月 | Mi Yue |
| 97 | 元歌 | Yango |
| 98 | 元流之子（坦克） | Flowborn (Tank) |
| 99 | 迦楼罗 | Garuda |
| 100 | 阿轲 | Arke |
| 101 | 白起 | Bai Qi |
| 102 | 法提赫 | Fatih |
| 103 | 影 | Umbrosa |
| 104 | 元流之子（射手） | Flowborn (Marksman) |
| 105 | 拉普拉普 | Lapulapu |
| 106 | 苍 | Chano |
| 107 | 百里玄策 | Xuance |
| 108 | 安奈特 | Annette |
| 109 | 弈星 | Yixing |
| 110 | 桑启 | Sakeer |
| 111 | 海月 | Haya |
| 112 | 谛梵罗 | Devara |
| 113 | 暃 | Feyd |
| 114 | 蚩奼 | Chicha |
| 115 | 弗洛伦 | Florentino |
| 116 | 洛里昂 | Lorion |
| 117 | 元流之子（法师） | Flowborn (Mage) |
| 118 | 元流之子（刺客） | Flowborn (Assassin) |
| 119 | 元流之子（辅助） | Flowborn (Roamer) |
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

模拟器可复现 Pick、双选、圆形 Ban、空 Ban、蓝/红先手、换英雄与完整 BP phase 顺序。随机选角会避开当前 BP 已用英雄，并可从 Control 同步 Normal / Player / Global 规则与跨局历史；自动脚本的随机等待只模拟选手思考/预选时间，锁定后会快速切到下一轮。然后在 HOK Control 的 Auto BP 中选择 Simulator 的采集画面窗口即可。

Auto BP 默认采用“轻量优先”的识别策略：浏览器只上传最高 256px 的头像裁切、使用 JPEG、先尝试少量中心尺度，低置信度时才运行偏移 fallback，并缓存短时间内完全相同的帧。Sharp 默认只使用 2 个工作线程，尽量给 OBS 编码和游戏/模拟器留出 CPU 余量。比赛设置里还可开启 **高置信度自动录入**，阈值可在 50%–100% 之间设置；它只跳过审核弹窗，不会绕过锁定判断和 BP 规则。

LoL 项目中值得移植的功能优化及本次实际移植内容见 [HOK / LoL 功能对照审计](docs/research/lol-feature-parity-audit-2026-10-06.md)。

## 文档导航

| 需要做什么 | 文档 |
| --- | --- |
| 第一次使用，从下载安装到完成一轮测试 | [新手上手教程](docs/guides/beginner-guide.md) |
| 安装、三端接入、延迟、备份和部署 | [运行指南](docs/guides/getting-started.md) |
| 比赛流程、快捷 BP、照片、队伍库及替补 | [操作指南](docs/guides/operator-guide.md) |
| Windows 一键启动、Simulator 启停及 Cloudflare | [启动器说明](docs/guides/windows-launcher.md) |
| Auto BP、18 框校准、自动录入阈值、锁定与换英雄 | [屏幕识别指南](docs/guides/screen-recognition.md) |
| v1.0.0 功能与已知边界 | [v1.0.0 发布说明](docs/releases/v1.0.0.md) |
| 理解源码目录和状态流 | [系统结构](docs/design/architecture.md) |
| 接入桌面软件或未来识别 Provider | [API 与扩展接口](docs/design/api.md) |
| 查看项目阶段与未来路线 | [项目里程碑](MILESTONES.md) |
| 查看历次测试及未验收范围 | [验证记录](docs/validation/history.md) |
| 查英雄资料来源 | [研究索引](docs/research/README.md) || 自动检查英雄名单更新 | [英雄数据自动同步](docs/research/hero-sync.md) |
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
