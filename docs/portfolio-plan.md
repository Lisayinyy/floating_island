# Lisa World 作品集扩展方案

更新日期：2026-09-13

> 当前决定覆盖下方旧方案：本站与 Inner World、Lisa_web 完全断开。实际入口为真实 3D 群岛：内环六座手工建模的重点项目岛，外环按类别自动建模的归档项目岛（当前 17 座，来自 GitHub 公开仓库复核），加一座粉色个人岛。第 3 节的 Tier B 项目已进入外环；Experience 已使用真实时间线。下文为早期方案留档；最新实现、验收与限制以 README.md、design-qa.md 为准。

## 1. 产品定位

Lisa World 不再只是通往旧版 `Lisa_web` 的 3D 封面，而是一套可以持续增加项目的个人作品系统。

- 3D 漂浮岛负责记忆点、个性和探索感。
- 项目索引负责快速浏览、筛选和招聘场景下的信息效率。
- 项目详情负责说明问题、Lisa 的角色、实际构建、证据和复盘。
- 旧版 `Lisa_web` 暂时保留为经历、教育和完整简历的资料页，项目内容迁移完成后再决定是否退役。

无论最终采用哪个视觉方向，都应保留“快速浏览全部项目”的非 3D 路径。访客不应被迫操作 3D 场景才能看到作品。

## 2. 推荐的信息架构

```text
Lisa World
├── Home / World
│   ├── 3D 世界入口
│   ├── Featured Work
│   └── Browse All Projects
├── Projects
│   ├── All
│   ├── AI Products
│   ├── Interactive Experiences
│   ├── Creative AI
│   └── Finance & Research
├── Project Detail
│   ├── Problem
│   ├── My Role
│   ├── What I Built
│   ├── Evidence / Outcome
│   └── What I Learned
├── About / Journey
└── Resume / Contact
```

首选实现原则：一个站点、两种浏览模式、同一份项目数据。不要继续维护两套互相重复的项目卡片。

## 3. GitHub 项目盘点与首批入站建议

### Tier A：首屏重点项目

这些项目近期更新、产品形态清楚，也能共同展示 Lisa 的产品、交互、AI 与工程能力。

| 项目 | 建议分类 | 当前可确认的亮点 | 入站状态 |
| --- | --- | --- | --- |
| [Voice Prompt](https://github.com/Lisayinyy/VoicePrompt) | AI Products | 语音输入、实时识别预览、AI 润色、桌面端与 Agent connector | 可写完整案例；需要挑选封面和结果证据 |
| [Claw Cove](https://github.com/Lisayinyy/claw-cove) | Interactive Experiences | 手机优先的 3D 抓娃娃收集游戏，触控、离线、存档与可选备份 | 可写完整案例；需要公共试玩链接或演示视频 |
| [Alpine Rush](https://github.com/Lisayinyy/ski_game) | Interactive Experiences | 浏览器低多边形双板滑雪，桌面和手机均可通过屏幕按钮完成操作 | 可写完整案例；需要封面、试玩链接和简短玩法视频 |
| [prompt.ai](https://github.com/Lisayinyy/prompt.ai) | AI Products | 从粗略意图到结构化任务、模型推荐与一键启动的 Chrome 扩展 | 可写完整案例；需核对当前线上版本与商店链接 |
| [Wu Guanzhong Ink Translate](https://github.com/Lisayinyy/wgz_painting) | Creative AI | 将实拍照片整幅转译为吴冠中式水墨作品的 Agent skill | 可写视觉案例；仓库已有前后对照素材 |
| [Lisa AI Quantitative Trading Platform](https://github.com/Lisayinyy/lisa-trading) | Finance & Research | 数据、策略、回测、模拟交易记录与 AI 复盘的研究平台 | 适合深度案例；需明确可公开范围和当前完成度 |

### Tier B：项目索引中的探索项目

先以简洁条目展示，材料补齐后可升级为完整案例。

| 项目 | 暂定分类 | 下一步核对 |
| --- | --- | --- |
| [vibe.ai](https://github.com/Lisayinyy/vibe.ai) | AI Learning / Product | README 仍是 Next.js 默认说明，需要补真实产品介绍、截图和用途 |
| [floating_island](https://github.com/Lisayinyy/floating_island) | Interactive Experiences | 把网站本身作为“如何把个人简介变成可探索世界”的 meta case study |
| [reddit_monitor](https://github.com/Lisayinyy/reddit_monitor) | AI Operations | 仓库元数据为空，需要核对是否适合公开展示 |
| [a-share-premarket-skill](https://github.com/Lisayinyy/a-share-premarket-skill) | Finance & Research | 盘前板块扫描 skill，可作为 Agent workflow 小案例 |
| [a-stock-quick-scan](https://github.com/Lisayinyy/a-stock-quick-scan) | Finance & Research | 需要补充 README、截图和与上一个项目的差异 |
| [AI_Product_Day](https://github.com/Lisayinyy/AI_Product_Day) | Experiments | 需要核对内容与公开价值 |
| [vc_llm](https://github.com/Lisayinyy/vc_llm) | Research | 需要核对内容、成果和展示形式 |

### Tier C：暂不自动放入公开作品集

- fork 仓库：除非 Lisa 对其有明确、可解释的独立贡献。
- 空仓库或只有默认模板说明的仓库。
- 重复版本、部署镜像和用途不清楚的仓库。
- 内部工具或可能包含不可公开业务信息的项目。
- 仅凭仓库名无法确认内容的项目，例如 `laBUBU`、`spider`、`finance_test` 等；先人工确认，不猜测。

## 4. 可持续扩展的项目数据模型

页面不应继续把项目文字硬编码在 UI 组件里。建议建立一份独立项目目录，每增加项目只修改数据和素材。

```ts
type Project = {
  slug: string
  title: string
  shortDescription: string
  year: number
  status: 'live' | 'beta' | 'wip' | 'archived'
  categories: Array<'product' | 'interactive' | 'creative-ai' | 'finance-research'>
  featured: boolean
  cover: string
  repoUrl?: string
  liveUrl?: string
  demoUrl?: string
  role: string[]
  stack: string[]
  problem?: string
  build?: string
  evidence?: string[]
  learnings?: string[]
  visibility: 'public' | 'summary-only'
}
```

GitHub 可以帮助发现新仓库和预填更新时间、语言、链接，但不应直接把所有仓库自动发布到个人网站。公开作品仍需经过 `draft -> reviewed -> published` 的内容门槛。

## 5. 与旧版个人网站的拆分策略

推荐采用渐进迁移，而不是一次性断开：

1. 第一阶段：在 Lisa World 内加入新的 Projects 入口与 Tier A 项目，旧站继续承载 About、Journey、Resume。
2. 第二阶段：把 About / Journey 精简迁入 Lisa World，旧站保留兼容链接。
3. 第三阶段：当项目详情、经历和简历都已迁移并验证后，把 `Lisa_web` 改为跳转页或归档页。

这样不会因为新站仍在补内容而丢失现有简历信息，也不会长期维护两个互相矛盾的项目列表。

## 6. 三个视觉方向的实现差异

### 方向 1：双入口世界

风险最低。保留当前单岛，在同一首屏提供 World View 和 Project Index。最适合先上线并持续补项目。

### 方向 2：项目群岛地图

互动性最强。每类项目成为一座岛，选择岛后展开项目故事。品牌记忆点突出，但移动端、性能与内容扩展成本最高。

### 方向 3：编辑部档案

项目表达最强。3D 岛缩成导航中的品牌入口，正文变成可扩展的项目档案与案例页。最利于招聘方快速阅读，也最接近与旧平面简介站真正断开。

## 7. 第一轮实现范围

在视觉方向确定后，第一轮只做能构成完整体验的部分：

- 建立单一项目数据源。
- 加入上述 6 个 Tier A 项目。
- 实现分类筛选、Featured Work 和项目详情展开或路由。
- 保留 3D 与非 3D 两条入口。
- 保留旧站 About / Journey / Resume 链接，但删除“完整作品集只能去旧站看”的依赖。
- 桌面与手机都验证浏览、筛选、键盘焦点、减少动态效果和外链。

## 8. 验收标准

- 首页无需离开 Lisa World 就能看到近期代表项目。
- 访客最多两次操作可以打开任一 Tier A 项目。
- 关闭 WebGL、使用键盘或开启 reduced motion 时仍可浏览全部项目。
- 新项目可通过新增一条数据记录和素材完成，不需要修改多个 UI 组件。
- 所有项目状态、链接和公开描述都经过人工复核。
- 旧版 `Lisa_web` 在迁移期仍可访问，且导航关系清楚，不形成循环或死链。

## 9. 重点项目公开状态核对

以下状态来自 2026-09-13 的 GitHub 仓库元数据和 README。`updated_at` 只表示仓库元数据最近变化，不等于产品发布日期或完成日期，因此页面不应直接显示成 “Launched”。

| 项目 | GitHub Pages | Homepage 字段 | License | 内容发布建议 |
| --- | --- | --- | --- | --- |
| Voice Prompt | 已开启 | 未填写 | MIT | 可标 `Beta`；只有确认可访问的 Pages 地址后才显示 `Live demo` |
| Claw Cove | 未开启 | 未填写 | 未声明 | 标 `Playable build` 或 `Project`；README 明确说当前未部署公共网站 |
| Alpine Rush | 未开启 | 未填写 | 未声明 | 标 `Interactive project`；补公共试玩地址前不写 `Live` |
| prompt.ai | 未开启 | 未填写 | 未声明 | 标 `Chrome extension`；商店和生产站链接需另行验证 |
| Wu Guanzhong Ink Translate | 未开启 | 未填写 | MIT | 标 `Creative AI skill`；以仓库里的前后对照作为首要证据 |
| Lisa AI Quantitative Trading Platform | 未开启 | 未填写 | 未声明 | 标 `Research platform` / `In development`，不要暗示已用于真实资金交易 |

## 10. 首批项目卡片文案草案

这些文案只使用当前公开材料能支持的内容。结果数字、用户量、业务影响或上线状态需要证据后再添加。

### Voice Prompt

- Label: `AI PRODUCT · BETA`
- One-liner: `Turn spoken thoughts into clearer, reviewable tasks for AI agents.`
- 中文：`把随口说出的想法整理成清晰、可确认的 Agent 任务。`
- Detail angle: 从语音捕捉、分段预览、本地识别到 AI 润色与用户确认，重点呈现完整输入体验，而不是只列模型名称。
- 可用素材：本地 `prompt.ai-main/voice/design/` 中已有多版本状态截图，`voice/demo/` 中已有宣传片与教程素材。

### Claw Cove

- Label: `INTERACTIVE GAME · MOBILE FIRST`
- One-liner: `A touch-first 3D claw-machine collection game with persistent play.`
- 中文：`一款触控优先、支持持续收集与本地存档的 3D 抓娃娃游戏。`
- Detail angle: 展示抓取状态机、相机视角、12 个原创伙伴、主题解锁、离线与存档迁移。
- 可用素材：本地 `claw-cove/qa/` 已有桌面、手机、抓取、获胜、收藏与俯视角截图。

### Alpine Rush

- Label: `INTERACTIVE GAME · WEB`
- One-liner: `A low-poly alpine skiing game designed around visible touch controls.`
- 中文：`围绕屏幕触控设计的低多边形高山双板滑雪游戏。`
- Detail angle: 强调手机和桌面统一的按钮控制、不同难度雪道、旗门、刻滑、刹车、跳跃与空中转体。
- 素材缺口：封面图、移动端实机或浏览器截图、15–30 秒玩法视频。

### prompt.ai

- Label: `AI PRODUCT · CHROME EXTENSION`
- One-liner: `Structure rough intent, recommend a model, and launch the task into AI chat.`
- 中文：`把粗略想法整理成可执行任务，匹配模型并启动到 AI 对话。`
- Detail angle: 从单纯 prompt 优化转向 task launcher 的产品判断，突出任务模板、结构化、模型推荐、启动与历史复用。
- 素材缺口：当前版本界面、商店页、真实支持的平台清单与上线状态。

### Wu Guanzhong Ink Translate

- Label: `CREATIVE AI · SKILL`
- One-liner: `Recompose a photograph as an ink-and-color painting instead of applying a filter.`
- 中文：`不是给照片套滤镜，而是以原构图为基础重新组织成水墨作品。`
- Detail angle: 用 3 组前后对照解释白墙留白、墨线、色点和构图转译规则。
- 可用素材：仓库 `assets/examples/` 已有亭、廊、湖三组对照图。

### Lisa AI Quantitative Trading Platform

- Label: `FINANCE & RESEARCH · IN DEVELOPMENT`
- One-liner: `A research stack connecting market data, strategy tests, trade journals, and AI review.`
- 中文：`连接行情、策略测试、交易记录与 AI 复盘的量化研究平台。`
- Detail angle: 以系统架构和安全边界为主，不展示收益承诺；明确研究、回测、模拟交易和真实交易之间的区别。
- 素材缺口：可公开的 dashboard 截图、模块完成度、演示数据说明和隐私审查。

## 11. 素材进入网站前的门槛

每个 Tier A 项目至少要有：

- 一张经过裁切验证的封面，不使用生成图冒充真实产品界面。
- 一个可确认的主链接：公开演示、仓库或案例详情三者至少一个。
- 一句不超过 120 个英文字符的简介。
- Lisa 的角色与实际完成部分。
- 至少一项可核验的证据：真实截图、演示、测试范围、发布记录或公开产物。
- 清楚的状态标签；`Live`、`Beta`、`WIP`、`Archived` 不混用。
