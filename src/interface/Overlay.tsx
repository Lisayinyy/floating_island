import {
  BookOpen,
  Camera,
  Code2,
  Disc3,
  ExternalLink,
  Laptop,
  Map,
  RotateCcw,
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
  }
> = {
  music: {
    index: '01',
    eyebrow: 'LISTENING ROOM',
    title: 'Sounds for slow afternoons',
    description: 'A rotating shelf of albums, field recordings and songs that currently live in Lisa World.',
    meta: '12 selections · updated monthly',
    action: 'Open playlist',
  },
  photos: {
    index: '02',
    eyebrow: 'PHOTO ARCHIVE',
    title: 'Small scenes worth keeping',
    description: 'Fragments from streets, exhibitions and ordinary days, organized as a visual notebook.',
    meta: 'Shanghai · Chongqing · Elsewhere',
    action: 'Browse archive',
  },
  library: {
    index: '03',
    eyebrow: 'READING NOTES',
    title: 'Books with folded corners',
    description: 'Notes, quotations and unfinished thoughts collected from the books beside the desk.',
    meta: 'Essays · fiction · visual culture',
    action: 'Visit library',
  },
  journeys: {
    index: '04',
    eyebrow: 'FIELD NOTES',
    title: 'Routes taken without a plan',
    description: 'Cycling logs, neighborhood observations and places that deserve a second visit.',
    meta: '34 routes · 418 kilometers',
    action: 'See the map',
  },
  work: {
    index: '05',
    eyebrow: 'SELECTED WORK',
    title: 'Things made with curiosity',
    description: 'A growing collection of experiments across interfaces, visual systems and playful technology.',
    meta: 'Design · code · experiments',
    action: 'View projects',
  },
}

const panelIcons = {
  music: Disc3,
  photos: Camera,
  library: BookOpen,
  journeys: Map,
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
          <button className="panel-action" type="button">
            {panel.action}
            <ExternalLink size={16} />
          </button>
        </aside>
      )}
    </div>
  )
}
