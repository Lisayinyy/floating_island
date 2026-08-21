import {
  ArrowRight,
  BookOpen,
  Cpu,
  Code2,
  Globe2,
  GraduationCap,
  ImageIcon,
  Laptop,
  Lightbulb,
  Menu,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
    object: string
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
    href: 'https://lisayinyy.github.io/Lisa_web/#vibe-coding',
    object: 'PROTOTYPE DECK',
  },
  about: {
    index: '02',
    eyebrow: 'ABOUT LISA',
    title: 'AI PM who actually builds',
    description:
      'I’m Lisa, also Yuanyuan: data-driven, design-minded and code-capable, from product strategy to working LLM prototypes.',
    meta: 'AI PRODUCT · HCI / UX · VIBE CODING',
    action: 'Meet Lisa',
    href: 'https://lisayinyy.github.io/Lisa_web/#home',
    object: 'PINK PORTRAIT',
  },
  experience: {
    index: '03',
    eyebrow: 'EXPERIENCE + EDUCATION',
    title: 'From Michigan CS to AI products',
    description:
      'MiniMax, ZhenFund, Deloitte and AI4ALL shaped a path through product growth, data science, research and hands-on building.',
    meta: 'MICHIGAN CS · HCI MINOR · DEAN’S LIST',
    action: 'See the full timeline',
    href: 'https://lisayinyy.github.io/Lisa_web/#journey',
    object: 'GRADUATION CAP',
  },
  toolkit: {
    index: '04',
    eyebrow: 'AI CREATIVE TOOLKIT',
    title: 'Tools that turn ideas into products',
    description:
      'Claude Code, Cursor, MiniMax, React, Python, Figma and a growing agent stack power the things I imagine and ship.',
    meta: 'AI AGENTS · REACT · PYTHON · FIGMA',
    action: 'Explore my toolkit',
    href: 'https://lisayinyy.github.io/Lisa_web/#vibe-coding',
    object: 'AI CONSOLE',
  },
  work: {
    index: '05',
    eyebrow: 'SELECTED WORK',
    title: 'Products I made real',
    description:
      'PromptAI, Skills Master, a Xiaohongshu sentiment monitor and internal growth tools built from zero to working product.',
    meta: 'PROMPTAI · SKILLS MASTER · SENTIMENT MONITOR',
    action: 'View selected work',
    href: 'https://lisayinyy.github.io/Lisa_web/#projects',
    object: 'LAPTOP',
  },
  art: {
    index: '06',
    eyebrow: 'MY PAINTINGS',
    title: 'A space for the worlds I draw',
    description:
      'This easel will become a changing gallery for my paintings, sketches and visual experiments.',
    meta: 'PAINTING · SKETCHES · VISUAL DIARY',
    action: 'Visit my creative world',
    href: 'https://lisayinyy.github.io/Lisa_web/art.html',
    object: 'PAINTING EASEL',
  },
}

// Menu order follows the printed chapter numbers, so 01 reads before 02.
const itemOrder: WorldItemId[] = ['philosophy', 'about', 'experience', 'toolkit', 'work', 'art']

const menuLabels: Record<WorldItemId, string> = {
  about: 'About Lisa',
  art: 'My Paintings',
  work: 'Selected Work',
  philosophy: 'How I Work',
  experience: 'Experience',
  toolkit: 'Creative Toolkit',
}

const panelIcons = {
  philosophy: Lightbulb,
  about: ImageIcon,
  experience: GraduationCap,
  toolkit: Cpu,
  work: Laptop,
  art: Palette,
}

export function Overlay({
  introComplete,
  onReset,
}: {
  introComplete: boolean
  onReset: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const activeItem = useWorldStore((state) => state.activeItem)
  const theme = useWorldStore((state) => state.theme)
  const setActiveItem = useWorldStore((state) => state.setActiveItem)
  const toggleTheme = useWorldStore((state) => state.toggleTheme)
  const panel = activeItem ? panels[activeItem] : null
  const PanelIcon = activeItem ? panelIcons[activeItem] : null

  useEffect(() => {
    if (!menuOpen && !activeItem) return

    // Escape closes the menu first, then the chapter panel: the topmost thing
    // the reader opened is the thing they expect to dismiss.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (menuOpen) setMenuOpen(false)
      else setActiveItem(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [activeItem, menuOpen, setActiveItem])

  return (
    <div
      className={`overlay ${introComplete ? 'is-ready' : 'is-intro'} ${menuOpen ? 'menu-open' : ''}`}
    >
      {!introComplete && <div className="intro-input-shield" aria-hidden="true" />}
      <header className="topbar">
        <div className="identity">
          <a
            className="identity-mark"
            href="https://lisayinyy.github.io/Lisa_web/"
            aria-label="Open Lisa's portfolio"
          >
            L
          </a>
          <span>
            <b>LISA WORLD</b>
            <small>A FLOATING INNER WORLD</small>
          </span>
        </div>
        <div className="topbar-actions">
          <button
            className="icon-control theme-control"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
            title={theme === 'day' ? 'Night mode' : 'Day mode'}
          >
            {theme === 'day' ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />}
          </button>
          <a
            className="icon-control portfolio-link"
            href="https://lisayinyy.github.io/Lisa_web/"
            aria-label="Open Lisa's full portfolio"
            title="Full portfolio"
          >
            <UserRound size={18} strokeWidth={1.8} />
          </a>
          <a
            className="icon-control"
            href="https://github.com/Lisayinyy/floating_island"
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub repository"
            title="GitHub repository"
          >
            <Code2 size={18} strokeWidth={1.8} />
          </a>
          <button
            className="icon-control"
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? 'Close room menu' : 'Open room menu'}
            aria-expanded={menuOpen}
            title={menuOpen ? 'Close menu' : 'Menu'}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      {introComplete && !activeItem && (
        <section className="scene-intro">
          <p>AI PRODUCT MANAGER · BUILDER · DREAMER</p>
          <h1>Welcome to Lisa&apos;s World</h1>
          <span>
            My real interests, memories and work live together on this floating island.
            Every object opens a chapter of my story.
          </span>
          <a
            className="intro-portal"
            href="https://lisayinyy.github.io/Lisa_web/"
          >
            Enter the full website
            <ArrowRight size={16} />
          </a>
        </section>
      )}

      {menuOpen && (
        <nav
          className="room-menu"
          aria-label="Explore Lisa World"
          onClick={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false)
          }}
        >
          <div className="room-menu-head">
            <span>LISA&apos;S INNER WORLD</span>
            <small>CHOOSE A CHAPTER</small>
          </div>
          <div className="room-menu-links">
            <button
              type="button"
              onClick={() => {
                setActiveItem(null)
                onReset()
                setMenuOpen(false)
              }}
            >
              <span>00</span>
              <b>Home</b>
            </button>
            {itemOrder.map((item) => {
              const itemPanel = panels[item]
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setActiveItem(item)
                    setMenuOpen(false)
                  }}
                >
                  <span>{itemPanel.index}</span>
                  <b>{menuLabels[item]}</b>
                </button>
              )
            })}
          </div>
          <div className="room-menu-socials">
            <a
              href="https://lisayinyy.github.io/Lisa_web/"
              aria-label="Open Lisa's portfolio"
              title="Portfolio"
            >
              <Globe2 size={22} strokeWidth={1.6} />
            </a>
            <a
              href="https://github.com/Lisayinyy"
              target="_blank"
              rel="noreferrer"
              aria-label="Open Lisa's GitHub profile"
              title="GitHub"
            >
              <Code2 size={22} strokeWidth={1.6} />
            </a>
          </div>
        </nav>
      )}

      <div className="scene-index" aria-hidden="true">
        <span>LW / 001</span>
        <i />
        <span>EST. 2026</span>
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
            <span className="panel-index">{panel.index} / {panel.object}</span>
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
          <div className="panel-symbol">
            <PanelIcon size={29} strokeWidth={1.35} />
          </div>
          <p className="panel-eyebrow">{panel.eyebrow}</p>
          <h1>{panel.title}</h1>
          <p className="panel-description">{panel.description}</p>
          <div className="panel-meta">{panel.meta}</div>
          <a className="panel-action" href={panel.href}>
            {panel.action}
            <ArrowRight size={17} />
          </a>
          <p className="panel-footnote">
            <BookOpen size={13} />
            Opens this chapter in Lisa’s full website
          </p>
        </aside>
      )}
    </div>
  )
}
