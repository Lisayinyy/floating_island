// Career timeline. Wording mirrors the public résumé site so both stay consistent.
export type JourneyStop = {
  date: string
  title: string
  summary: string
  tags: string[]
  current?: boolean
}

export const journey: JourneyStop[] = [
  {
    date: 'Now · 2026',
    title: 'Shipping & building',
    summary: 'Vibe coding new tools every week and documenting AI growth methodology. Goal: help more non-technical people build with AI.',
    tags: ['Vibe coding', 'AI growth', 'Content'],
    current: true,
  },
  {
    date: '2025.9 →',
    title: 'MiniMax · AI PM / Growth',
    summary: 'Moved from investing to building. Started vibe coding internal tools: Xiaohongshu sentiment monitoring, growth automation. AI PMs do not just write PRDs; they build.',
    tags: ['MiniMax', 'Product growth', 'OpenClaw'],
  },
  {
    date: '2025.4 – 2025.9',
    title: 'AI investor · MiraclePlus → ZhenFund',
    summary: 'Reviewed 100+ AI startups and learned the investment logic behind LLM infrastructure, multimodal models and vertical applications.',
    tags: ['AI investment', '100+ startups', 'PMF'],
  },
  {
    date: '2025.2',
    title: 'Went all-in on vibe coding',
    summary: 'Karpathy coined “vibe coding”. Embraced it with Claude Code and Cursor: non-engineers can now ship products, and I do.',
    tags: ['Claude Code', 'Cursor'],
  },
  {
    date: '2024.12 – 2025.3',
    title: 'Deloitte · AI agents for finance research',
    summary: 'Built industry-research agents on Coze and Dify for banking, securities and private-equity clients. Modelled credit-card customer satisfaction with NLP.',
    tags: ['Coze / Dify', 'AI agents', 'Finance', 'NLP'],
  },
  {
    date: '2024.4 – 2024.11',
    title: 'GlobeZ startup · first vibe coding',
    summary: 'Built an AI-driven Shopify cross-border platform with Cursor, months before “vibe coding” had a name. A/B tested user flows, clustered user needs (+20% retention), wrote SQL against Google Analytics.',
    tags: ['Cursor', 'Shopify', 'A/B testing', '+20% retention'],
  },
  {
    date: 'Summer 2022',
    title: 'AI4ALL @ BU · AI research',
    summary: 'First hands-on AI research project. Realised AI should not live only in papers; it needs to become products.',
    tags: ['AI research', 'NLP'],
  },
  {
    date: '2020 – 2024',
    title: 'University of Michigan · Data Science',
    summary: 'B.S. in Data Science with a minor in User Experience Design. ML, deep learning, computer vision and SQL, plus the habit of thinking about AI through a user lens.',
    tags: ['Python', 'ML', 'Deep learning', 'UX design'],
  },
]

export const profileLinks = {
  email: 'mailto:lisayyyin@gmail.com',
  github: 'https://github.com/Lisayinyy',
  linkedin: 'https://www.linkedin.com/in/yuanyuan-yin-935186201/',
  resume: 'https://lisayinyy.github.io/Lisa_web/images/Lisa_Yin_Resume_EN_v2.pdf',
}
