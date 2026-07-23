import {
  Cpu,
  Camera,
  Code2,
  ExternalLink,
  GraduationCap,
  Laptop,
  Lightbulb,
  RotateCcw,
  UserRound,
  X,
} from 'lucide-react'
import { useWorldStore } from '../store/worldStore'
import type { WorldItemId } from '../store/worldStore'

const panels: Record<
  WorldItemId,
  {
    index: string
    eyebrow: string
    title: string
    description: string
    meta: string
    action: string
    href: string
  }
> = {
  philosophy: {
    index: '01',
    eyebrow: 'HOW I WORK',
    title: 'Build, don’t just spec',
    description:
      'I prototype with AI-assisted coding, ship quickly, listen to real users and let data—not opinions—decide.',
    meta: 'USER FIRST · DATA OVER OPINIONS · SHIP FAST',
    action: 'Read my product principles',
    href: 'https://lisayinyy.github.io/personal_web/#how',
  },
  about: {
    index: '02',
    eyebrow: 'ABOUT LISA',
    title: 'AI PM who actually builds',
    description:
      'I’m Lisa, also Yuanyuan: data-driven, design-minded and code-capable, from product strategy to working LLM prototypes.',
    meta: 'AI PRODUCT · HCI / UX · VIBE CODING',
    action: 'Meet Lisa',
    href: 'https://lisayinyy.github.io/personal_web/#about',
  },
  experience: {
    index: '03',
    eyebrow: 'EXPERIENCE + EDUCATION',
    title: 'From Michigan CS to AI products',
    description:
      'MiniMax, ZhenFund, Deloitte and AI4ALL shaped a path through product growth, data science, research and hands-on building.',
    meta: 'MICHIGAN CS · HCI MINOR · DEAN’S LIST',
    action: 'See the full timeline',
    href: 'https://lisayinyy.github.io/personal_web/#exp',
  },
  toolkit: {
    index: '04',
    eyebrow: 'AI CREATIVE TOOLKIT',
    title: 'Tools that turn ideas into products',
    description:
      'Claude Code, Cursor, MiniMax, React, Python, Figma and a growing agent stack power the things I imagine and ship.',
    meta: 'AI AGENTS · REACT · PYTHON · FIGMA',
    action: 'Explore my toolkit',
    href: 'https://lisayinyy.github.io/personal_web/#contact',
  },
  work: {
    index: '05',
    eyebrow: 'SELECTED WORK',
    title: 'Products I made real',
    description:
      'PromptAI, Skills Master, a Xiaohongshu sentiment monitor and internal growth tools built from zero to working product.',
    meta: 'PROMPTAI · SKILLS MASTER · SENTIMENT MONITOR',
    action: 'View selected work',
    href: 'https://lisayinyy.github.io/personal_web/#work',
  },
}

const panelIcons = {
  philosophy: Lightbulb,
  about: Camera,
  experience: GraduationCap,
  toolkit: Cpu,
  work: Laptop,
}

export function Overlay({ onReset }: { onReset: () => void }) {
  const activeItem = useWorldStore((state) => state.activeItem)
  const setActiveItem = useWorldStore((state) => state.setActiveItem)
  const panel = activeItem ? panels[activeItem] : null
  const PanelIcon = activeItem ? panelIcons[activeItem] : null

  return (
    <div className="overlay">
      <header className="topbar">
        <div className="identity">
          <span className="identity-mark">L</span>
          <span>
            <b>LISA WORLD</b>
            <small>ROOM 01 · PERSONAL SPACE</small>
          </span>
        </div>
        <div className="topbar-actions">
          <a
            className="icon-control"
            href="https://lisayinyy.github.io/personal_web/"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Lisa's full portfolio"
            title="Full portfolio"
          >
            <UserRound size={18} strokeWidth={1.8} />
          </a>
          <a
            className="icon-control"
            href="https://github.com/Lisayinyy/lisa_world"
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub repository"
            title="GitHub repository"
          >
            <Code2 size={18} strokeWidth={1.8} />
          </a>
        </div>
      </header>

      <div className="scene-index" aria-hidden="true">
        <span>LW / 001</span>
        <i />
        <span>23.07.26</span>
      </div>

      <div className="toolbar">
        <button
          className="icon-control"
          type="button"
          onClick={() => {
            setActiveItem(null)
            onReset()
          }}
          aria-label="Reset camera"
          title="Reset camera"
        >
          <RotateCcw size={18} strokeWidth={1.8} />
        </button>
      </div>

      {panel && activeItem && PanelIcon && (
        <aside className="content-panel" aria-live="polite">
          <div className="panel-head">
            <span className="panel-index">{panel.index}</span>
            <button
              className="panel-close"
              type="button"
              onClick={() => setActiveItem(null)}
              aria-label="Close panel"
              title="Close"
            >
              <X size={19} />
            </button>
          </div>
          <PanelIcon className="panel-icon" size={27} strokeWidth={1.4} />
          <p className="panel-eyebrow">{panel.eyebrow}</p>
          <h1>{panel.title}</h1>
          <p className="panel-description">{panel.description}</p>
          <div className="panel-meta">{panel.meta}</div>
          <a className="panel-action" href={panel.href} target="_blank" rel="noreferrer">
            {panel.action}
            <ExternalLink size={16} />
          </a>
        </aside>
      )}
    </div>
  )
}
