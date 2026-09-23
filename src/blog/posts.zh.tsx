import type { ReactNode } from 'react'
import type { Post } from './posts'

const Src = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>

export const postsZh: Post[] = [
  {
    slug: 'which-model-for-agents',
    title: '智能体到底跑在哪个模型上？',
    date: '2026-09-23',
    readTime: '12 min',
    summary: '一篇研究笔记：智能体系统怎么选大模型，以及每个模型家族离开 Demo、进入企业真实落地后的代价——支出份额、工具调用可靠性、缓存定价、数据驻留和许可证。',
    tags: ['智能体', '模型选型', '企业落地', '研究笔记'],
    body: <>
      <p className="lede">每个智能体框架都允许你用一行代码换模型。但在生产环境里几乎没有人会随手换。这是我试着带着来源写下来的：2026 年企业在智能体工作负载上到底选了什么，以及为什么这个选择和聊天机器人时代看起来不一样。</p>

      <h3>1. 智能体对模型的要求，聊天机器人从来没有过</h3>
      <p>聊天机器人调用一次、展示答案。智能体每个任务调用二十到两百次，每一步都重新发送同样的系统提示词和工具定义，并且会采取失败后果可见的动作（一次错误的 API 调用、一行被删掉的数据、一个做了一半的 PR）。排名标准因此改变：</p>
      <ul>
        <li><b>高负载下的工具调用可靠性</b>，而不是单次回答质量。第 40 步选错工具或吐出格式错误的参数，前 39 步就白费了。</li>
        <li><b>长程一致性。</b>模型能否在 20 万 token 的轨迹里保持计划不漂移？</li>
        <li><b>每个任务的有效成本</b>，而不是每个 token。一旦同样的 3–5 万 token 指令在每一步都重发，缓存输入价格就成了主导。</li>
        <li><b>每一步的延迟</b>，因为它要乘以步数。</li>
        <li><b>数据去哪儿</b>：区域、驻留，以及这个供应商是不是你采购团队愿意签字的那种。</li>
      </ul>
      <p>Menlo Ventures 的企业调研提供了一个有用的现实检验：<b>只有 16% 的企业部署和 27% 的创业公司部署算得上真正的智能体</b>（由大模型规划、行动、观察、调整）。大多数「智能体」仍然是包着一次模型调用的路由逻辑。<Src href="https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/">Menlo，2025 年 12 月</Src>。下面的模型选择对这 16–27% 最重要。</p>

      <h3>2. 谁在选什么（看钱的视角）</h3>
      <table>
        <thead><tr><th>供应商</th><th>2025 年企业 LLM API 份额</th><th>2023 年以来的趋势</th></tr></thead>
        <tbody>
          <tr><td>Anthropic（Claude）</td><td>40%</td><td>12% → 24% → 40%</td></tr>
          <tr><td>OpenAI（GPT）</td><td>27%</td><td>50% → 34% → 27%</td></tr>
          <tr><td>Google（Gemini）</td><td>21%</td><td>7% → … → 21%</td></tr>
          <tr><td>开源权重，全部</td><td>11%</td><td>19% → 11%</td></tr>
          <tr><td>中国开源权重</td><td>约 1%</td><td>约占开源份额的 10%</td></tr>
        </tbody>
      </table>
      <p className="table-note">来源：Menlo Ventures，约 500 位美国企业决策者，2025 年 12 月。编程是楔子：Anthropic 在编程市场估计占 <b>54%</b>，OpenAI 占 21%；编程是最大的单一应用类别，规模 40 亿美元。</p>
      <p>读这张表时我记住两件事。第一，这是美国的调研；亚太的采购受不同供应商和不同可用性的影响（第 6 节再说）。第二，开发者视角和采购视角完全不同：到 2026 年 5 月，<b>中国来源的模型占了 OpenRouter 路由 token 的约 61%</b>，而同一批模型家族在企业支出里只有约 1%。同样的模型，两种买家。<Src href="https://zandigital.in/open-weights-production-comparison">Zan Digital，2026 年 8 月</Src>。</p>
      <p>Anthropic 对 500+ 位技术负责人的调研补充了工作负载的形状：<b>57%</b> 的组织已经在多阶段工作流上运行智能体，<b>86%</b> 用编程智能体写生产代码，编程之外最常见的用例是数据分析 / 报告生成（60%）和内部流程自动化（48%）。与现有系统集成（46%）和数据质量（42%）是最大障碍，不是模型质量。<Src href="https://resources.anthropic.com/hubfs/The%202026%20State%20of%20AI%20Agents%20Report.pdf">Anthropic，2026 State of AI Agents</Src>。</p>

      <h3>3. 各模型家族，以及它们在生产环境里各自的代价</h3>
      <p>下面的价格是每百万 token 的标价，由 <Src href="https://www.jsonhouse.com/posts/llm-api-pricing-2026/">Json House 的每周追踪</Src>于 2026 年 9 月 21 日从官方定价页采集。价格会变，结构性的要点才是重点。</p>

      <h4>Claude（Anthropic）</h4>
      <ul>
        <li><b>智能体为什么选它：</b>编程智能体（Claude Code、Cursor）的默认选择，过去两年大部分时间在 SWE-bench 类多步任务上领先。上面 Menlo 的编程份额就是需求侧信号。</li>
        <li><b>定价形状：</b>Sonnet 5 为 $2 / $10，Opus 5 为 $5 / $25，Fable 5.1 为 $10 / $50。Anthropic 是<b>唯一仍对 1M 上下文按统一费率计费的主要供应商</b>：90 万 token 的请求和 9 千 token 的请求每 token 价格相同。对于上下文会不可预测地膨胀的智能体，这种可预测性值真金白银。</li>
        <li><b>账单住在缓存里。</b>标准缓存读取是输入价的 10%；Fable 5.1 降到 2.5%。如果你的智能体每一步都重发 5 万 token 的工具和指令，缓存读取那一列才是你真实的输入价格。</li>
        <li><b>坑：</b>Claude 4.7 及之后的模型使用的分词器，对同样的英文文本会产出约 30% 更多的 token。价格没动但 token 数涨了，账单照样涨。要比较每个任务的成本，而不是每个 token。</li>
        <li><b>企业适配：</b>可直接调用，也在 AWS Bedrock 和 Google Vertex 上提供；诺和诺德的 NovoScribe（Bedrock 上的 Claude）是 Anthropic 报告里的参考案例。通过超大规模云商分发，正是受监管行业能买它的原因。</li>
      </ul>

      <h4>GPT（OpenAI）</h4>
      <ul>
        <li><b>智能体为什么选它：</b>最广的生态、Agents / Responses API、Codex，以及最大的企业 ChatGPT 席位存量，这让「留在 OpenAI」成为 IT 部门摩擦最小的选择。</li>
        <li><b>定价形状：</b>从 GPT-5.4-nano（$0.20 / $1.25）、GPT-5.4（$2.50 / $15）到 pro 层级（$30 / $180）的宽阶梯。注意 OpenAI 在 2026 年 8 月<b>新增了长上下文层级</b>（GPT-5.6-sol 超过 20 万 token 后翻倍），旗舰价格是带截止日期的促销价。把标价当作临时的来做预算。</li>
        <li><b>企业适配：</b>大多数大企业通过 Azure OpenAI 解决驻留和合同条款；直接 API 的美国专属路由要加收 10%。</li>
        <li><b>关注点：</b>在 Menlo 的数据里份额连续两年下滑，而席位型产品在增长。企业在买 OpenAI 的应用，买 Anthropic 的 API。</li>
      </ul>

      <h4>Gemini（Google）</h4>
      <ul>
        <li><b>智能体为什么选它：</b>Flash 层级的性价比、原生 1M 上下文、默认多模态，以及与 Google Cloud（Vertex AI、ADK、Agent Engine）和 Workspace 数据最紧密的结合。如果企业已经跑在 GCP 上，Gemini 就是阻力最小的路径。</li>
        <li><b>定价形状：</b>Gemini 2.5 Flash-Lite 的 $0.10 / $0.40 是全市场的地板价；3.x Flash 的 $0.75 / $3.75 是促销价，到 2026-12-31 为止，2027 年 1 月 1 日翻倍；3.1 Pro 为 $2 / $12。Google 对<b>超过 20 万 token 的部分按更高层级计费</b>，所以长上下文的智能体轨迹需要一个架构决策（压缩摘要，还是付钱）。</li>
        <li><b>亚太的企业适配：</b>Gemini 网页版 2026 年初在香港无需 VPN 直接可用，Google Cloud 合作伙伴在此之上销售企业可控的部署。对香港或东南亚企业来说，这往往比基准测试上的一个百分点更重要。<Src href="https://www.linkedin.com/posts/master-concept_gemini-googleai-hongkong-activity-7439210279198097409-1OuK">Master Concept，2026 年 3 月</Src>。</li>
      </ul>

      <h4>开源权重：Qwen、DeepSeek、GLM、Kimi</h4>
      <ul>
        <li><b>质量差距很小，价格差距巨大。</b>按 2026 年 8 月 28 日读取的 Artificial Analysis 指数：Claude Opus 5 为 63；Kimi K3 为 60，Qwen3.8 2.4T 为 58，GLM-5.3-Flash 为 57。混合价格：$3.85 对 GLM-5.3-Flash 的 $0.10，6 分差距对应 38 倍价差。<Src href="https://zandigital.in/open-weights-production-comparison">Zan Digital</Src>。</li>
        <li><b>它们仍然输在哪里：</b>同一来源坦率地指出，长程智能体运行、高负载下的工具调用和不常见的输出格式，是前沿闭源模型「仍然配得上溢价」的地方。对于单轮抽取和分类，溢价什么都买不到。</li>
        <li><b>许可证的差别比基准测试大。</b>Qwen 是 Apache 2.0；DeepSeek 和 GLM 是 MIT。Llama 4 是一份定制的社区许可证（7 亿月活门槛、「Built with Llama」署名、衍生模型命名规则、加州司法管辖）。把它当成一份零元的商业合同，而不是开源。</li>
        <li><b>自托管很少在成本上赢。</b>一台 8×H100 节点按标价约 2.3 万美元/月；对比 $0.10 的 API，需要每月约 2300 亿 token 才能打平。自托管是一个控制权决策（数据永远不离开你的领地），不是成本决策。</li>
        <li><b>DeepSeek 的细节：</b>非高峰 $0.15 / $0.60，98% 的缓存折扣，1M 上下文，高峰时段价格正好翻倍；2026 年 9 月，一个已有 API 名称背后的模型被换掉了。便宜，但名字不变、模型变了的时候，你必须重跑评测。</li>
        <li><b>采购现实：</b>Menlo 的受访者提到 9–12 个月的性能差距、部署复杂度，以及不愿把数据发给中国公司运营的 API。下载 MIT 权重自己运行可以完全消除第三个顾虑；意大利监管机构 2025 年针对 DeepSeek 的命令针对的是托管服务，不是权重。</li>
      </ul>

      <h4>Llama（Meta）与 Mistral</h4>
      <ul>
        <li>Llama 仍然是<i>企业内部</i>采用最广的开源权重模型（品牌安全、西方供应商），但 Llama 4 之后发布停滞，企业份额下滑，并且跌出了 OpenRouter 的头部排名。</li>
        <li>Mistral 对欧盟数据驻留和欧洲合同方有意义；Mistral Medium 3.5 为 $1.50 / $7.50，Small 4 为 $0.15 / $0.60。它不公布缓存读取价格，这让智能体工作负载很难比较；2026 年它还几乎没有预告地下线了四个编程模型。</li>
      </ul>

      <h3>4. 真正能预测你账单的成本模型</h3>
      <p>四件我读细则之前没有意识到的事：</p>
      <ol>
        <li><b>智能体要按缓存读取价格排序。</b>最便宜的缓存输入：DeepSeek flash $0.003、Gemini 2.5 Flash-Lite $0.01、GPT-5.4-nano $0.02、Claude Haiku 4.5 $0.10。基础价更高但缓存折扣更深的供应商，可以在真实账单上赢。</li>
        <li><b>输出 token 是输入的 3–6 倍，而推理模型产出更多输出。</b>Opus 5 在一套评测里产出约 1 亿 token，同类中位数是 7200 万。一个啰嗦 40% 的模型，就是账单里贵的那一半涨了 40%。</li>
        <li><b>20 万 token 的悬崖是一个架构上的强制函数。</b>Google、xAI 和现在的 OpenAI 在 20 万以上大致把单价翻倍。Anthropic 不会。你的智能体是压缩轨迹还是带着走，取决于你在哪家供应商上。</li>
        <li><b>token 在供应商之间、甚至版本之间都不是稳定的单位。</b>在你自己的评测集上测每个完成任务的成本。这是唯一能在换模型后幸存的数字。</li>
      </ol>

      <h3>5. 一条我真的会用的决策规则</h3>
      <table>
        <thead><tr><th>工作负载</th><th>我会跑什么</th><th>为什么</th></tr></thead>
        <tbody>
          <tr><td>高频分类、抽取、工具间路由</td><td>最便宜的强模型：Gemini Flash-Lite、DeepSeek flash、GLM、小尺寸 Qwen</td><td>质量已饱和；价格是唯一剩下的变量。</td></tr>
          <tr><td>多智能体系统的规划 / 编排步骤</td><td>前沿闭源模型（Claude Sonnet/Opus、GPT-5.x、Gemini Pro）</td><td>一个坏计划会浪费掉下游的每一次调用。</td></tr>
          <tr><td>编程智能体、长时间自主运行</td><td>Claude 优先，GPT/Gemini 作为第二意见</td><td>需求侧证据：54% 编程份额、统一费率的 1M 上下文、深度缓存。</td></tr>
          <tr><td>失败可见的面向客户的智能体</td><td>闭源前沿模型，加评测门禁</td><td>溢价买的就是边缘处的可靠性。</td></tr>
          <tr><td>法律上不能离开领地的数据</td><td>自托管的 MIT/Apache 权重（Qwen、DeepSeek、GLM）</td><td>消除数据传输问题，而不是掩盖它。</td></tr>
          <tr><td>GCP 原生的企业</td><td>通过 Vertex + ADK 用 Gemini，编程用 Vertex 上的 Claude</td><td>驻留、IAM 和计费已经解决；合作伙伴能部署。</td></tr>
        </tbody>
      </table>
      <p>从这里落出来的模式是<b>路由，而不是挑选</b>：前沿模型给那 5% 做规划或触达客户的调用，便宜模型给那 95% 做分类、抽取和格式化的调用，再加一套有文档的评测集，让你不开委员会就能换掉任何一个。Menlo 的数据说大多数团队仍然是一个 if-then 后面接一个模型；到了 16% 那一档的团队已经是多模型了。</p>

      <h3>6. 香港 / 亚太部署的备注</h3>
      <ul>
        <li><b>可用性是第一道过滤器，不是基准测试。</b>Gemini 2026 年才在香港直接可用。Claude 和 GPT 到达香港企业主要通过 Bedrock、Vertex 和 Azure，而不是直接 API。中国模型可以直接用，但会撞上上面那个采购顾虑；在香港区域自己托管权重是解法。</li>
        <li><b>AI 智能体的身份与访问控制正在成为一个安全控制层</b>，不只是模型问题。香港的集成商已经在卖 Okta + Google Cloud 的套餐，用来管控哪些智能体能碰哪些数据。要为它做预算。</li>
        <li><b>语言对便宜层级很重要。</b>粤语 / 繁体中文的分类和抽取，要拿 Qwen 和 GLM 与 Gemini Flash 对比评测；价格地板一样，本地文本上的质量不是美国基准测试能告诉你的。</li>
      </ul>

      <h3>7. 我还想验证的事</h3>
      <ul>
        <li>当前一代模型在 τ-bench / BFCL 上的<b>工具调用错误率</b>正面对比；写这篇时我打不开在线榜单，所以本文没有第一手的工具调用数据。</li>
        <li>生产环境智能体循环里的真实缓存命中率（不是标价折扣）。如果提示词前缀漂移导致缓存未命中，折扣就只是理论上的。</li>
        <li>在固定评测集上对比 Sonnet 5、GPT-5.4、Gemini 3.1 Pro 和 Qwen3.8 的每任务成本——上面每张表都指向这个数字，却没人公布。</li>
      </ul>

      <h3>来源</h3>
      <ul className="sources">
        <li><Src href="https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/">Menlo Ventures，2025: The State of Generative AI in the Enterprise</Src>（2025 年 12 月）。市场份额、编程份额、智能体架构构成、开源份额。</li>
        <li><Src href="https://resources.anthropic.com/hubfs/The%202026%20State%20of%20AI%20Agents%20Report.pdf">Anthropic × Material，The 2026 State of AI Agents Report</Src>。工作负载形状、障碍、诺和诺德案例。</li>
        <li><Src href="https://www.jsonhouse.com/posts/llm-api-pricing-2026/">Json House，LLM API Pricing 2026</Src>（2026 年 9 月 21 日采集）。全部标价、缓存倍率、分词器和长上下文备注。</li>
        <li><Src href="https://zandigital.in/open-weights-production-comparison">Zan Digital，Open Weights in Production: Qwen, DeepSeek, Llama, GLM</Src>（2026 年 8 月 29 日）。指数分数、许可证、自托管盈亏平衡、OpenRouter 份额。</li>
        <li><Src href="https://www.linkedin.com/posts/master-concept_gemini-googleai-hongkong-activity-7439210279198097409-1OuK">Master Concept，Gemini 登陆香港</Src>（2026 年 3 月）。</li>
      </ul>
      <p className="table-note">研究笔记，不是建议。价格和排名是带日期的快照，等你读到时大概已经不对了；我预期能站得住的是这个决策的结构。</p>
    </>,
  },
]
