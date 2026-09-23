import type { ReactNode } from 'react'

export type Post = {
  slug: string
  title: string
  date: string
  readTime: string
  summary: string
  tags: string[]
  body: ReactNode
}

const Src = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>

export const posts: Post[] = [
  {
    slug: 'which-model-for-agents',
    title: 'Which model do agents actually run on?',
    date: '2026-09-23',
    readTime: '12 min',
    summary: 'A research log on how agentic systems pick their LLM, and what each model family costs an enterprise once it leaves the demo: share of spend, tool-calling reliability, cache pricing, residency, licences.',
    tags: ['Agents', 'LLM selection', 'Enterprise', 'Research log'],
    body: <>
      <p className="lede">Every agent framework lets you swap the model with one line. Almost nobody does it casually in production. This is my attempt to write down, with sources, what enterprises are actually choosing for agentic workloads in 2026 and why the choice looks different from the chatbot era.</p>

      <h3>1. What an agent needs from a model that a chatbot never did</h3>
      <p>A chatbot makes one call and shows the answer. An agent makes twenty to two hundred calls per task, re-sends the same system prompt and tool schema every time, and takes actions whose failures are visible (a wrong API call, a deleted row, a half-finished PR). That changes the ranking criteria:</p>
      <ul>
        <li><b>Tool-calling reliability under load</b>, not one-shot answer quality. Choosing the wrong tool or emitting malformed arguments on step 40 wastes the previous 39.</li>
        <li><b>Long-horizon coherence.</b> Can the model keep a plan across a 200K-token trajectory without drifting?</li>
        <li><b>Effective cost per task</b>, not per token. Cached-input price dominates once the same 30–50K tokens of instructions are re-sent on every step.</li>
        <li><b>Latency per step</b>, because it multiplies by the step count.</li>
        <li><b>Where the data goes</b>: region, residency, and whether the vendor is one your procurement team will sign with.</li>
      </ul>
      <p>Menlo Ventures’ enterprise survey is a useful reality check on how far along this is: only <b>16% of enterprise deployments and 27% of startup deployments qualify as true agents</b> (LLM plans, acts, observes, adapts). Most “agents” are still routing logic wrapped around a single call. <Src href="https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/">Menlo, Dec 2025</Src>. The model choice below matters most for that 16–27%.</p>

      <h3>2. Who is choosing what (the money view)</h3>
      <table>
        <thead><tr><th>Provider</th><th>Enterprise LLM API share, 2025</th><th>Trend since 2023</th></tr></thead>
        <tbody>
          <tr><td>Anthropic (Claude)</td><td>40%</td><td>12% → 24% → 40%</td></tr>
          <tr><td>OpenAI (GPT)</td><td>27%</td><td>50% → 34% → 27%</td></tr>
          <tr><td>Google (Gemini)</td><td>21%</td><td>7% → … → 21%</td></tr>
          <tr><td>Open-weight, all</td><td>11%</td><td>19% → 11%</td></tr>
          <tr><td>Chinese open-weight</td><td>~1%</td><td>≈10% of the open-source slice</td></tr>
        </tbody>
      </table>
      <p className="table-note">Source: Menlo Ventures, ~500 US enterprise decision-makers, Dec 2025. Coding is the wedge: Anthropic holds an estimated <b>54%</b> of the coding market vs 21% for OpenAI, and coding was the single largest application category at $4B.</p>
      <p>Two things I keep in mind when reading this. First, it is a US survey; APAC procurement is shaped by different vendors and different availability (more on that in section 6). Second, the developer view looks nothing like the procurement view: by May 2026, <b>Chinese-origin models were ~61% of tokens routed through OpenRouter</b>, while the same families sat at ~1% of enterprise spend. Same models, two buyers. <Src href="https://zandigital.in/open-weights-production-comparison">Zan Digital, Aug 2026</Src>.</p>
      <p>Anthropic’s own survey of 500+ technical leaders adds the workload shape: <b>57%</b> of organisations already run agents on multi-stage workflows, <b>86%</b> deploy coding agents for production code, and the top non-coding use cases are data analysis / report generation (60%) and internal process automation (48%). Integration with existing systems (46%) and data quality (42%) are the top blockers, not model quality. <Src href="https://resources.anthropic.com/hubfs/The%202026%20State%20of%20AI%20Agents%20Report.pdf">Anthropic, State of AI Agents 2026</Src>.</p>

      <h3>3. Model families, and what each one costs you in production</h3>
      <p>Prices below are list prices per 1M tokens as collected from official pricing pages on 21 Sep 2026 by <Src href="https://www.jsonhouse.com/posts/llm-api-pricing-2026/">Json House’s weekly tracker</Src>. They will move; the structural points are what matter.</p>

      <h4>Claude (Anthropic)</h4>
      <ul>
        <li><b>Why agents pick it:</b> the default for coding agents (Claude Code, Cursor) and the leader on SWE-bench-style multi-step tasks for most of the last two years. Menlo’s coding share number above is the demand signal.</li>
        <li><b>Pricing shape:</b> Sonnet 5 at $2 / $10, Opus 5 at $5 / $25, Fable 5.1 at $10 / $50. Anthropic is the <b>only major vendor still billing its 1M context flat</b>: a 900K-token request costs the same per token as a 9K one. For agents whose context balloons unpredictably, that predictability is worth real money.</li>
        <li><b>Cache is where the bill lives.</b> Standard cache read is 10% of input; Fable 5.1 drops to 2.5%. If your agent re-sends 50K tokens of tools and instructions every step, the cache-read column is your real input price.</li>
        <li><b>Gotcha:</b> Claude 4.7 and later use a tokenizer that produces ~30% more tokens for the same English text. A price that holds and a token count that rises still means a bill that rises. Compare cost per task, not per token.</li>
        <li><b>Enterprise fit:</b> available direct, on AWS Bedrock and Google Vertex; Novo Nordisk’s NovoScribe (Claude on Bedrock) is the reference case in Anthropic’s report. Distribution through hyperscalers is why regulated industries can buy it.</li>
      </ul>

      <h4>GPT (OpenAI)</h4>
      <ul>
        <li><b>Why agents pick it:</b> broadest ecosystem, the Agents / Responses API, Codex, and the largest installed base of enterprise ChatGPT seats, which makes “stay on OpenAI” the low-friction choice for IT.</li>
        <li><b>Pricing shape:</b> a wide ladder from GPT-5.4-nano ($0.20 / $1.25) through GPT-5.4 ($2.50 / $15) up to pro tiers at $30 / $180. Note that OpenAI <b>added a long-context tier</b> in Aug 2026 (GPT-5.6-sol doubles above 200K tokens) and its flagship rate is promotional with an expiry date. Budget the sticker price as temporary.</li>
        <li><b>Enterprise fit:</b> Azure OpenAI is the route most large enterprises use for residency and contract terms; a 10% surcharge applies for US-only routing on the direct API.</li>
        <li><b>Watch:</b> share has fallen for two years straight in Menlo’s data while seat-based products grew. Enterprises are buying OpenAI apps and Anthropic APIs.</li>
      </ul>

      <h4>Gemini (Google)</h4>
      <ul>
        <li><b>Why agents pick it:</b> price-performance at the Flash tier, native 1M context, multimodal by default, and the tightest fit with Google Cloud (Vertex AI, ADK, Agent Engine) and Workspace data. If the enterprise already runs on GCP, Gemini is the path of least resistance.</li>
        <li><b>Pricing shape:</b> Gemini 2.5 Flash-Lite at $0.10 / $0.40 is the floor of the whole market; 3.x Flash at $0.75 / $3.75 is promotional through 2026-12-31 and doubles on 1 Jan 2027; 3.1 Pro at $2 / $12. Google bills a <b>higher tier above 200K tokens</b>, so long-context agent traces need an architecture decision (summarise or pay).</li>
        <li><b>Enterprise fit in APAC:</b> Gemini web became directly available in Hong Kong in early 2026 without VPN, and Google Cloud partners sell enterprise-controlled deployments on top. For a HK or SEA enterprise this often matters more than a benchmark point. <Src href="https://www.linkedin.com/posts/master-concept_gemini-googleai-hongkong-activity-7439210279198097409-1OuK">Master Concept, Mar 2026</Src>.</li>
      </ul>

      <h4>Open-weight: Qwen, DeepSeek, GLM, Kimi</h4>
      <ul>
        <li><b>Quality gap is small, price gap is huge.</b> On the Artificial Analysis index read 28 Aug 2026: Claude Opus 5 at 63; Kimi K3 60, Qwen3.8 2.4T 58, GLM-5.3-Flash 57. Blended price: $3.85 vs $0.10 for GLM-5.3-Flash, a 38x gap for 6 points. <Src href="https://zandigital.in/open-weights-production-comparison">Zan Digital</Src>.</li>
        <li><b>Where they still lose:</b> the same source is honest that long-horizon agent runs, tool calling under load and unusual output formats are where frontier closed models “still earn their price”. For single-turn extraction and classification the premium buys nothing.</li>
        <li><b>Licences differ more than benchmarks.</b> Qwen is Apache 2.0; DeepSeek and GLM are MIT. Llama 4 is a bespoke community licence (700M MAU threshold, “Built with Llama” attribution, naming rule on derivatives, California jurisdiction). Treat it as a zero-dollar commercial contract, not open source.</li>
        <li><b>Self-hosting rarely wins on cost.</b> One 8×H100 node at list rates is ~$23K/month; against a $0.10 API you need ~230B tokens/month to break even. Self-hosting is a control decision (data never leaves your estate), not a cost decision.</li>
        <li><b>DeepSeek specifics:</b> $0.15 / $0.60 off-peak with a 98% cache discount, 1M context, peak-hour pricing is exactly double, and in Sep 2026 the model behind an existing API name was swapped. Cheap, but you must re-run your evals when the name stays and the model changes.</li>
        <li><b>Procurement reality:</b> Menlo’s respondents cited a 9–12 month performance lag, deployment complexity, and reluctance to send data to Chinese-run APIs. Downloading MIT weights and running them yourself removes the third objection entirely; the Italian regulator’s 2025 DeepSeek order targeted the hosted service, not the weights.</li>
      </ul>

      <h4>Llama (Meta) and Mistral</h4>
      <ul>
        <li>Llama remains the most widely adopted open-weight model <i>inside enterprises</i> (brand safety, Western vendor), but its enterprise share fell as releases stalled after Llama 4, and it dropped out of OpenRouter’s top rankings.</li>
        <li>Mistral matters for EU residency and for a European counterparty; Mistral Medium 3.5 at $1.50 / $7.50, Small 4 at $0.15 / $0.60. It does not publish cache-read pricing, which makes it hard to compare for agent workloads, and it retired four coding models in 2026 without much notice.</li>
      </ul>

      <h3>4. The cost model that actually predicts your invoice</h3>
      <p>Four things I did not appreciate until I read the fine print:</p>
      <ol>
        <li><b>Rank by cache-read price for agents.</b> Cheapest cached input: DeepSeek flash $0.003, Gemini 2.5 Flash-Lite $0.01, GPT-5.4-nano $0.02, Claude Haiku 4.5 $0.10. A vendor with a higher base price and a deeper cache discount can win on real invoices.</li>
        <li><b>Output tokens are 3–6× input, and reasoning models generate more of them.</b> Opus 5 produced ~100M tokens across one evaluation suite vs a 72M median for peers. A 40% more verbose model is a 40% increase on the expensive half of the bill.</li>
        <li><b>The 200K cliff is an architectural forcing function.</b> Google, xAI and now OpenAI roughly double per-token rates above 200K. Anthropic does not. Whether your agent summarises its trace or carries it depends on which vendor you are on.</li>
        <li><b>Tokens are not a stable unit across vendors or even versions.</b> Measure cost per completed task on your own eval set. It is the only number that survives a model swap.</li>
      </ol>

      <h3>5. A decision rule I would actually use</h3>
      <table>
        <thead><tr><th>Workload</th><th>What I would run</th><th>Why</th></tr></thead>
        <tbody>
          <tr><td>High-volume classification, extraction, routing between tools</td><td>Cheapest strong model: Gemini Flash-Lite, DeepSeek flash, GLM, Qwen small</td><td>Quality is saturated; price is the only variable left.</td></tr>
          <tr><td>Planner / orchestrator step of a multi-agent system</td><td>Frontier closed model (Claude Sonnet/Opus, GPT-5.x, Gemini Pro)</td><td>One bad plan wastes every downstream call.</td></tr>
          <tr><td>Coding agents, long autonomous runs</td><td>Claude first, GPT/Gemini as second opinion</td><td>Demand-side evidence: 54% coding share, flat 1M context, deep cache.</td></tr>
          <tr><td>Customer-facing agents with visible failures</td><td>Closed frontier, with an eval gate</td><td>Reliability at the edges is what the premium buys.</td></tr>
          <tr><td>Data that legally cannot leave the estate</td><td>Self-hosted MIT/Apache weights (Qwen, DeepSeek, GLM)</td><td>Removes the transfer question instead of papering over it.</td></tr>
          <tr><td>GCP-native enterprise</td><td>Gemini via Vertex + ADK, with Claude on Vertex for coding</td><td>Residency, IAM, and billing already solved; partners can deploy it.</td></tr>
        </tbody>
      </table>
      <p>The pattern that falls out of this is <b>routing, not picking</b>: a frontier model for the 5% of calls that plan or touch the customer, a cheap model for the 95% that classify, extract and format, and a documented eval set that lets you swap either without a committee. Menlo’s data says most teams are still on one model behind an if-then; the ones at the 16% mark are already multi-model.</p>

      <h3>6. Notes for Hong Kong / APAC deployments</h3>
      <ul>
        <li><b>Availability is the first filter, not benchmarks.</b> Gemini only became directly usable in HK in 2026. Claude and GPT reach HK enterprises mostly through Bedrock, Vertex and Azure rather than direct APIs. Chinese models are available direct but hit the procurement objection above; hosting the weights yourself in a HK region is the workaround.</li>
        <li><b>Identity and access to AI agents is becoming a security control layer</b>, not just a model question. HK integrators are already selling Okta + Google Cloud packages for governing which agents can touch which data. Budget for it.</li>
        <li><b>Language matters for the cheap tier.</b> For Cantonese / Traditional Chinese classification and extraction, evaluate Qwen and GLM against Gemini Flash; the price floor is the same, and quality on local text is not something a US benchmark will tell you.</li>
      </ul>

      <h3>7. What I still want to verify</h3>
      <ul>
        <li>Head-to-head <b>tool-calling error rates</b> on τ-bench / BFCL for the current generation of models; I could not reach the live leaderboards while writing this, so this post has no first-party tool-calling numbers.</li>
        <li>Actual cache hit rates in production agent loops (not the list discount). If the cache misses because the prompt prefix drifts, the discount is theoretical.</li>
        <li>Cost per task on a fixed eval set across Sonnet 5, GPT-5.4, Gemini 3.1 Pro and Qwen3.8 — the number every table above keeps pointing at and nobody publishes.</li>
      </ul>

      <h3>Sources</h3>
      <ul className="sources">
        <li><Src href="https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/">Menlo Ventures, 2025: The State of Generative AI in the Enterprise</Src> (Dec 2025). Market share, coding share, agent architecture mix, open-source share.</li>
        <li><Src href="https://resources.anthropic.com/hubfs/The%202026%20State%20of%20AI%20Agents%20Report.pdf">Anthropic × Material, The 2026 State of AI Agents Report</Src>. Workload shape, blockers, Novo Nordisk case.</li>
        <li><Src href="https://www.jsonhouse.com/posts/llm-api-pricing-2026/">Json House, LLM API Pricing 2026</Src> (collected 21 Sep 2026). All list prices, cache multipliers, tokenizer and long-context notes.</li>
        <li><Src href="https://zandigital.in/open-weights-production-comparison">Zan Digital, Open Weights in Production: Qwen, DeepSeek, Llama, GLM</Src> (29 Aug 2026). Index scores, licences, self-hosting break-even, OpenRouter share.</li>
        <li><Src href="https://www.linkedin.com/posts/master-concept_gemini-googleai-hongkong-activity-7439210279198097409-1OuK">Master Concept, Gemini launches in Hong Kong</Src> (Mar 2026).</li>
      </ul>
      <p className="table-note">Research log, not advice. Prices and rankings are dated snapshots and will be wrong by the time you read this; the structure of the decision is what I expect to hold.</p>
    </>,
  },
]

export const postBySlug = Object.fromEntries(posts.map((p) => [p.slug, p])) as Record<string, Post>
