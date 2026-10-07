# HOK Broadcast 新手教程：从零到完成第一场 BP

> 适用版本：**v2.4.0**
> 如果你第一次接触 Node.js、Git、OBS 或这个项目，按本文顺序操作即可。
> 已经熟悉项目的导播可以直接看 [比赛操作指南](operator-guide.md) 和 [Auto BP 屏幕识别指南](screen-recognition.md)。

---

## 1. 这套程序是做什么的？

HOK Broadcast 是一套给《王者荣耀国际服 / Honor of Kings》社区赛事使用的轻量导播系统。

它主要包含三个页面：

| 页面 | 谁使用 | 用途 |
| --- | --- | --- |
| /control | 导播 / 裁判 | 设置比赛、录入或识别 BP、确认比赛结果 |
| /caster | 解说 | 查看延迟后的 BP 数据和阵容分析 |
| /overlay/draft | OBS | 显示直播用 BP 图形 |

其中 **Control 是你最常操作的页面**。

---

## 2. 第一次安装需要什么？

推荐环境：

- Windows 10 / 11
- Node.js 24
- Chrome 或 Edge
- OBS Studio（如果你要直播）
- Git（推荐，但不是必须）

### 安装 Node.js

到 Node.js 官网安装 **Node.js 24**。

安装完成后打开 PowerShell，输入：

~~~powershell
node -v
npm -v
~~~

只要能看到版本号，就说明 Node.js 已安装成功。

---

## 3. 下载项目

### 方法 A：使用 Git

~~~powershell
git clone https://github.com/EaDen-Cen/Honor-of-Kings-International-Server-Tournament-Broadcasting-System.git
cd Honor-of-Kings-International-Server-Tournament-Broadcasting-System/vite-project
~~~

### 方法 B：不会 Git

在 GitHub 项目页面下载 Source code ZIP，解压后进入：

~~~text
Honor-of-Kings-International-Server-Tournament-Broadcasting-System
└─ vite-project
~~~

然后在这个文件夹里打开 PowerShell。

---

## 4. 第一次安装依赖

在 vite-project 目录运行：

~~~powershell
npm ci
npm run build
~~~

第一次安装会比较久。

如果两条命令最后都没有出现红色 error，就可以继续。

> 平时更新代码后，建议再运行一次 npm ci 和 npm run build。
> 如果只是重新启动程序，不需要每次重新安装依赖。

---

## 5. 启动程序

最简单的方法：

~~~powershell
npm run server
~~~

看到类似：

~~~text
HOK Broadcast server ready on port 3001
~~~

说明服务器已经启动。

然后打开：

- Control：<http://127.0.0.1:3001/control#token=local-control>
- Caster：<http://127.0.0.1:3001/caster#token=local-caster>
- Overlay：<http://127.0.0.1:3001/overlay/draft#token=local-overlay>

这些 local token 只适合本机测试。正式公网比赛必须使用自己的长随机 token。

---

## 6. 第一次设置比赛

打开 **Control** 后：

1. 点 **比赛设置**。
2. 设置蓝方、红方、BO1 / BO3 / BO5、Stage、BP 模式、BP 规则和先手方。
3. 保存。

如果你已经把队伍资料放进 **Team Library**，可以直接载入，不需要每次重新输入五名选手。

### BP 规则怎么选？

新手第一次测试建议选 **Normal BP**。

- **Normal**：每局互相独立，最简单。
- **Player BP**：按选手 ID 记录跨局英雄使用历史。
- **Global BP**：按队伍记录跨局英雄使用历史。

第一次不要一上来就测试复杂跨局规则，先确保基本 BP 流程跑通。

---

## 7. 先用手动 BP 跑一遍

在第一次配置 Auto BP 之前，建议先用手动模式熟悉程序。

右侧英雄列表支持：

- 中文搜索
- 英文搜索
- / 聚焦搜索
- Ctrl + K 聚焦搜索
- Esc 清空
- 唯一合法候选时按 Enter 提交

程序只允许当前合法阶段的 Ban / Pick，并会阻止重复英雄。

如果选错了，点 **Undo**。

---

## 8. 开启 Auto BP 屏幕识别

熟悉手动操作以后，再开启自动识别。

比赛设置中把 **BP 输入模式** 改为：

**Screen recognition / 屏幕识别**

保存后，右侧会变成 Auto BP 工作区。

正常比赛时你主要需要看到：

- 游戏画面
- 当前 BP 阶段
- 当前识别槽
- 英雄候选
- 空 Ban 状态
- 立即识别
- 自动监视

低频设置已经折叠起来，不需要一直占着页面。

---

## 9. 连接游戏画面

在 Auto BP 面板点击 **选择窗口 / 更换窗口**。

浏览器会弹出屏幕共享选择器。推荐选择游戏窗口、模拟器窗口或稳定的 OBS Preview。

不推荐选整个桌面，除非确实需要。

连接后 Auto BP 会在页面里显示捕获预览。

---

## 10. 第一次校准 18 个识别框

展开 **识别框校准与工具**。

系统一共使用 **18 个框**：

- 蓝方 4 个 Ban
- 红方 4 个 Ban
- 蓝方 5 个 Pick
- 红方 5 个 Pick

每个框都是独立的。

点击对应的 B1 / B2 / P1 / P2 等按钮，然后在预览画面上框住那个英雄头像。

### 精细校准

如果普通拖拽不够精确，打开 **全屏精细校准**，可以逐个槽位调整。

原则很简单：

> 框尽量只包含英雄头像本身，不要多框背景、边框、文字或队名。

Pick 位通常是方形头像；Ban 位是圆形头像。程序对 Ban 使用圆形匹配 mask。

---

## 11. 保存识别框预设

18 个框调好以后，不要每次重新来。

展开 **18 框位置预设**，例如保存为：

~~~text
HOK 1920x1080 比赛端
~~~

以后只需要连接同样布局的游戏画面，选择预设并点 **载入预设**。

18 个框的位置和大小会一次恢复。

预设保存在当前浏览器本地，所以关闭浏览器再打开仍然存在；换电脑、换浏览器或清理站点数据后不会自动同步。

---

## 12. Auto BP 应该怎么工作？

### Pick

普通 Pick 不会因为“识别到英雄”就直接提交。

程序会先确认当前英雄稳定，然后等待：

> **对手下一个 Pick 位真正出现预选英雄**

再反推上一轮已经锁定。

如果当前 Pick 后面直接进入 Ban，或已经是最后一手，则使用：

> **当前选手行从选角高亮恢复到正常亮度**

作为锁定信号。

双 Pick 阶段会同时识别两个槽位，并作为一组提交。

### Ban

Ban 会结合圆形英雄头像识别、游戏内 Ban 锁定 cue 和稳定扫描判断结果。

### 空 Ban

空 Ban 不会因为空槽被误匹配成一个 30%～40% 的英雄就直接失败。

目前空 Ban 保护时间大约 **4～5 秒**；保护时间后还需要锁定 cue 和连续稳定检测才会弹出确认。

---

## 13. 自动监视和确认

勾选 **自动监视** 后，程序会持续扫描当前阶段。

识别到可靠结果后会弹出审核窗口。你可以：

- 确认并提交
- 改选候选英雄
- 拒绝并继续监视

这样即使识别偶尔出错，也不会直接污染正式 BP 状态。

如果 Auto BP 临时不可用，展开 **手动英雄选择（备用）** 继续人工录入即可。

---

## 14. BP 完成后的换英雄

王者荣耀 BP 完成后，选手之间可能交换英雄。

系统会继续扫描蓝红双方 10 个最终 Pick 槽，并且每支队伍只在自己已经 Pick 的 5 个英雄里重新匹配。

在最终阵容区域可以：

- 自动检测并同步换英雄
- 点 **立即识别并应用换英雄**
- 手动调整最终英雄归属

换英雄只改变“最终哪个选手拿哪个英雄”，不会改写原始 Pick / Ban 历史。

---

## 15. OBS 怎么接？

OBS Browser Source：

~~~text
http://127.0.0.1:3001/overlay/draft#token=local-overlay
~~~

建议尺寸：

~~~text
1920 × 1080
~~~

Overlay 背景是透明的，可以叠在游戏画面上。

正式直播前一定要测试画面比例、队名和 Logo、选手 ID、Ban / Pick 动画、Panel / Side 布局以及 OBS Browser Source 刷新。

---

## 16. 解说端

Caster：

~~~text
http://127.0.0.1:3001/caster#token=local-caster
~~~

Caster 是只读页面。

如果设置了 180 秒延迟，解说看到的是 180 秒前的 BP 数据，而 Control 和 Overlay 仍然是实时状态。

注意：

> 程序延迟的是 **数据**，不是视频。

直播平台视频延迟仍然要单独测试。

---

## 17. 比赛中出问题怎么办？

### 选错英雄

点 **Undo**。

### Auto BP 一直识别错

1. 先关闭自动监视。
2. 检查当前识别框。
3. 必要时载入正确预设。
4. 仍不行就展开手动英雄选择。

### 页面刷新

比赛状态由服务器保存，正常刷新不会清空比赛。

### Server 关闭了

重新运行：

~~~powershell
npm run server
~~~

默认比赛数据保存在 vite-project/data/。

### 不要做的事

比赛中不要同时启动两个后端写同一个 data 目录；不要删除 match.json；不要随便清浏览器站点数据；也不要在没有彩排的情况下临时改变游戏窗口比例。

---

## 18. 比赛前 10 分钟检查表

- [ ] Server 已启动
- [ ] Control 显示 Connected
- [ ] 两队资料正确
- [ ] BO / Stage / BP Rule 正确
- [ ] 先手方正确
- [ ] Caster Delay 正确
- [ ] OBS Overlay 正常
- [ ] 游戏窗口已连接 Auto BP
- [ ] 18 框预设已载入
- [ ] 至少试一次 Pick
- [ ] 至少试一次 Ban
- [ ] 至少试一次空 Ban
- [ ] 至少试一次双 Pick
- [ ] 测试 BP 完成后的换英雄
- [ ] 手动 Hero Picker 可以随时作为备用
- [ ] data 目录已备份

---

## 19. 下一步看什么？

如果你已经能独立跑完一轮 BP：

- [比赛操作指南](operator-guide.md)：正式赛事流程和规则
- [Auto BP 屏幕识别指南](screen-recognition.md)：18 框、锁定逻辑、空 Ban、换英雄
- [运行与部署指南](getting-started.md)：公网、Caster、OBS、备份
- [Windows 启动器](windows-launcher.md)：一键启动与 Cloudflare
- [系统结构](../design/architecture.md)：想继续开发程序时阅读

最重要的原则只有一个：

> **自动识别是导播助手，不是比赛状态的最终裁判。**
> 屏幕识别异常时，优先保证比赛流程正确，立即切回手动录入。
