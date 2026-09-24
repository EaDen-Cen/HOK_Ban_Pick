# 英雄数据自动同步

[文档索引](../README.md) · [研究索引](README.md)

## 目的

英雄名单不再依赖偶尔手工比对。仓库提供独立的 **Hero Data Synchronizer**，用于定期发现国际服英雄名单变化、验证候选数据并生成需要人工确认的 GitHub Pull Request。

它**不会在比赛启动时运行**，也不会让远端网页成为比赛当天的实时依赖。

## 数据源与信任边界

同步器使用两类公开来源：

1. **Honor of Kings 官方 IP 页面 / 官方资源域名**
   - 英文详情：\`world.honorofkings.com/zlkdatasys/ip/hero/en/{campId}.html\`
   - 繁中详情：\`world.honorofkings.com/zlkdatasys/ip/hero/zh-Hant/{campId}.html\`
   - 英雄图片只接受 \`camp.honorofkings.com\` HTTPS 资源。
2. **BitTopup 国际服英雄目录**
   - \`https://wiki.bittopup.com/hok\`
   - 用于发现完整名单候选、Camp ID 和推荐分路。
   - 它是辅助目录，不作为赛事资格或版本规则的唯一权威来源。

2026-09-16 的核查已经确认官网首页的展示 JSON 当时只有部分英雄，因此同步器**不会用该展示 JSON 覆盖本地完整名单**。历史证据见 [英雄数据核查](hero-data-audit-2026-09-16.md)。

## 安全规则

同步器必须遵守：

- 本项目 \`Hero.id\` 是稳定的本地 ID；绝不拿 Camp ID / 官网 ID 覆盖。
- 新英雄只会分配 \`max(localId) + 1\` 之后的新 ID。
- 优先按 \`campId\` 匹配；否则按英文名和 aliases 匹配。
- 名称变化会利用上一份来源快照保持身份，不因改名制造重复英雄。
- 远端暂时找不到本地英雄时只记录 Warning，**不会自动删除**。
- 来源数量异常下降时直接失败，避免把半页/故障响应当成完整名单。
- \`counter\`、\`combo\`、\`beCountered\` 从不自动抓取或覆盖。
- 新英雄关系字段保持空数组并标记 \`relationshipStatus: "unverified"\`。
- 第三方目录的分路变化只进入人工复核，不自动改生产数据。
- 英雄图下载后检查真实 PNG/JPEG/WebP 文件头、大小并记录 SHA-256。
- 自动任务只开 PR，不自动合并到 \`main\`。

## 本地命令

在 \`vite-project/\` 中：

\`\`\`powershell
npm run hero:check
\`\`\`

只访问来源并打印差异，不修改仓库文件。

机器可读模式：

\`\`\`powershell
npm --silent run hero:check -- --json
\`\`\`

准备候选更新：

\`\`\`powershell
npm run hero:sync
\`\`\`

这一步可能更新：

\`\`\`text
src/data/autoSyncedHeroes.ts
src/data/heroSyncOverrides.ts
public/heroesImg/
../research/hero-sync/catalog-snapshot.json
../research/hero-sync/YYYY-MM-DD.json
\`\`\`

完成后执行：

\`\`\`powershell
npm run hero:validate
npm run build
npm test
npm run lint
\`\`\`

## 自动任务

\`.github/workflows/hero-data-sync.yml\` 每周运行一次，也可以在 GitHub Actions 中手动触发。

流程：

\`\`\`text
Fetch catalog
    ↓
Compare with local roster + previous source snapshot
    ↓
No change ──────────────→ End
    ↓
Change detected
    ↓
Generate candidate data/assets/audit
    ↓
Validate → Build → Tests → Lint
    ↓
Open/update automation/hero-data-sync PR
    ↓
Human review
    ↓
Merge
\`\`\`

第一次运行如果还没有 \`catalog-snapshot.json\`，会把建立来源基线本身视为一次变化并创建 PR。合并该基线后，后续任务才能准确识别目录中的改名、分路和图片变化。

## 生成文件的职责

- \`additionalHeroes.ts\`：保留 2026-09-16 人工核验过的历史新增记录。
- \`autoSyncedHeroes.ts\`：今后同步器发现并加入的新英雄。
- \`heroSyncOverrides.ts\`：对既有英雄进行安全的名称/图片等显示元数据覆盖。
- \`HeroList.tsx\`：组合历史英雄、人工新增英雄、自动新增英雄与安全 override。
- \`research/hero-sync/*.json\`：来源快照和每次候选更新的审计证据。

即使 override 更新了英雄名称或图片，人工维护的关系数组仍由原记录提供，不被自动同步器替换。

## 仍需人工判断的内容

自动化不能证明：

- 某英雄是否允许进入当前赛事自定义房；
- AoV 联动英雄是否在特定比赛规则下可用；
- Flowborn 不同形态在实际赛事房间中的互斥规则；
- Counter / Combo 是否仍适用于当前版本；
- 第三方目录给出的分路是否应成为赛事默认分路。

这些变化会保留为审计信息或 PR 警告，由赛事管理员确认。
