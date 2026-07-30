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
    href: 'https://lisayinyy.github.io/personal_web/#how',
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
    href: 'https://lisayinyy.github.io/personal_web/#about',
    object: 'PHOTO WALL',
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
    href: 'https://lisayinyy.github.io/personal_web/#contact',
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
    href: 'https://lisayinyy.github.io/personal_web/#work',
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
    href: 'https://lisayinyy.github.io/personal_web/#art',
    object: 'PAINTING EASEL',
  },
}

const itemOrder: WorldItemId[] = ['about', 'art', 'work', 'philosophy', 'experience', 'toolkit']

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

    // Escape unwinds one layer at a time: the menu sheet sits above the chapter
    // panel, so it closes first.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (menuOpen) setMenuOpen(false)
      else setActiveItem(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen, activeItem, setActiveItem])

  return (
    <div
      className={`overlay ${introComplete ? 'is-ready' : 'is-intro'} ${menuOpen ? 'menu-open' : ''}`}
    >
      {!introComplete && <div className="intro-input-shield" aria-hidden="true" />}
      <div className="dust" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
      <header className="topbar">
        <div className="identity">
          <a
            className="identity-mark"
            href="https://lisayinyy.github.io/personal_web/"
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
            href="https://github.com/Lisayinyy/floating_island"
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub repository"
            title="GitHub repository"
          >
            <Code2 size={18} strokeWidth={1.8} />
          </a>
          <button
            className="icon-control menu-control"
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
          <h1>
            Welcome to
            <em>Lisa&apos;s world</em>
          </h1>
          <span>
            My interests, memories and work all live on this floating island.
            Every object opens a chapter.
          </span>
          <a className="intro-portal" href="https://lisayinyy.github.io/personal_web/">
            Enter the full website
            <ArrowRight size={16} />
          </a>
        </section>
      )}

      {/* A full-screen frosted sheet rather than a dropdown: the island stays
          visible through the blur, and the chapter list gets room to breathe. */}
      <nav className="menu-sheet" aria-label="Explore Lisa World" aria-hidden={!menuOpen}>
        <div className="menu-sheet-inner">
          <p className="menu-kicker">choose a chapter</p>
          <ul className="menu-links">
            <li>
              <button
                type="button"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => {
                  setActiveItem(null)
                  onReset()
                  setMenuOpen(false)
                }}
              >
                <i>00</i>
                Home
              </button>
            </li>
            {itemOrder.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={() => {
                    setActiveItem(item)
                    setMenuOpen(false)
                  }}
                >
                  <i>{panels[item].index}</i>
                  {menuLabels[item]}
                </button>
              </li>
            ))}
          </ul>
          <div className="menu-socials">
            <a
              href="https://lisayinyy.github.io/personal_web/"
              target="_blank"
              rel="noreferrer"
              tabIndex={menuOpen ? 0 : -1}
              aria-label="Open Lisa's portfolio"
              title="Portfolio"
            >
              <Globe2 size={24} strokeWidth={1.6} />
            </a>
            <a
              href="https://github.com/Lisayinyy"
              target="_blank"
              rel="noreferrer"
              tabIndex={menuOpen ? 0 : -1}
              aria-label="Open Lisa's GitHub profile"
              title="GitHub"
            >
              <Code2 size={24} strokeWidth={1.6} />
            </a>
          </div>
        </div>
      </nav>

      <div className="scene-index" aria-hidden="true">
        <span>LW / 001</span>
        <i />
        <span>EST. 2026</span>
      </div>

      <p className="scene-signature" aria-hidden="true">
        © 2026 lisa&apos;s floating island
      </p>

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
