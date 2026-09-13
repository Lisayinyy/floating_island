import { Canvas } from '@react-three/fiber'
import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { journey, profileLinks } from '../data/journey'
import { categoryLabels, projects } from '../data/projects'
import type { Project } from '../data/projects'
import './IslandPortfolio.css'

const Islands = lazy(() => import('../scene/ProjectIslands'))

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <p className="scene-fallback">3D is unavailable in this browser. Open Projects to explore every project.</p>
      : this.props.children
  }
}

function Cover({ project, compact = false }: { project: Project; compact?: boolean }) {
  const className = compact ? 'card-cover' : ''
  if (project.cover) {
    return <img className={`island-cover ${className} ${project.slug === 'prompt-ai' ? 'icon-cover' : ''}`} src={project.cover} alt={compact ? '' : `${project.title} project preview`} />
  }
  return (
    <div className={`island-cover cover-tile tile-${project.category} ${className}`} role="img" aria-label={`${project.title}: ${categoryLabels[project.category]}`}>
      {compact ? <span>{categoryLabels[project.category].toUpperCase()}</span> : <><span>{project.kicker}</span><strong>{project.title}</strong></>}
    </div>
  )
}
export default function IslandPortfolio() {
  const [selection, setSelection] = useState<string | null>(null)
  const [reset, setReset] = useState(0)
  const [ready, setReady] = useState(false)
  const [archive, setArchive] = useState(false)
  const [filter, setFilter] = useState('all')
  const [bioTab, setBioTab] = useState<'about' | 'experience'>('about')
  const dialog = useRef<HTMLDialogElement>(null)
  const readyScene = useCallback(() => setReady(true), [])

  const projectIndex = projects.findIndex((p) => p.slug === selection)
  const project = projectIndex >= 0 ? projects[projectIndex] : undefined
  const overview = () => { setSelection(null); setReset((v) => v + 1) }
  const select = (slug: string) => { setSelection(slug); setArchive(false) }
  const openBio = (tab: 'about' | 'experience') => { setBioTab(tab); select('about') }
  const nextProject = () => select(projects[(projectIndex + 1) % projects.length].slug)

  useEffect(() => { if (archive) dialog.current?.showModal(); else dialog.current?.close() }, [archive])
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape' && !dialog.current?.open) setSelection(null) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

  const visible = projects.filter((p) => filter === 'all' || p.category === filter)

  return <main className={`islands-app ${selection ? 'has-selection' : ''}`}>
    <header className="island-nav">
      <button className="island-brand" onClick={overview}><span className="brand-flower">✳</span> Lisa’s islands<span className="brand-caption">A WORLD OF THINGS I MAKE</span></button>
      <nav aria-label="Main navigation">
        <button onClick={overview}>Explore</button>
        <button onClick={() => setArchive(true)}>Projects <sup>{projects.length}</sup></button>
        <button onClick={() => openBio('about')}>About</button>
        <button className="experience-nav" onClick={() => openBio('experience')}>Experience</button>
        <a className="contact-link" href={profileLinks.email}>Say hello ↗</a>
      </nav>
    </header>

    {!selection && <section className="island-intro">
      <p className="island-eyebrow">INDEPENDENT IDEAS. CONNECTED BY CURIOSITY.</p>
      <h1>A little world,<br />always <em>growing.</em></h1>
      <p>Each island is something I’ve made.<br />Pick a place. See where curiosity takes you.</p>
    </section>}

    <div className="island-scene" aria-label="Interactive 3D project archipelago. Drag to orbit, scroll or pinch to zoom. Select island labels to visit.">
      <SceneBoundary>
        <Canvas shadows dpr={[1, 1.6]} camera={{ position: [24, 28, 35], fov: 39, near: 0.1, far: 250 }} gl={{ antialias: true, alpha: true }} fallback={<p className="scene-fallback">3D needs WebGL. All projects are available in the Projects menu.</p>}>
          <Suspense fallback={null}><Islands selection={selection} reset={reset} onSelect={select} onReady={readyScene} /></Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
    {!ready && <p className="scene-status" role="status">Preparing your islands… <button onClick={() => setArchive(true)}>Browse projects</button></p>}

    {selection && <aside className="island-detail" key={selection} aria-label={project ? `${project.title} details` : 'About Lisa'}>
      <div className="detail-top">
        <span>{project ? `${String(projectIndex + 1).padStart(2, '0')} / ${project.featured ? 'PROJECT ISLAND' : 'ARCHIPELAGO'}` : '00 / THE PINK ISLAND'}</span>
        <button aria-label="Close island details" onClick={overview}>×</button>
      </div>
      {project ? <>
        <p className="island-eyebrow">{project.kicker}</p>
        <h2>{project.title}</h2>
        <p className="detail-summary">{project.shortDescription}</p>
        <Cover project={project} />
        <div className="project-meta"><span>{categoryLabels[project.category]}</span><span className={`status-${project.status.replace(/\s+/g, '-').toLowerCase()}`}>{project.status}</span></div>
        <section><h3>The idea</h3><p>{project.problem}</p></section>
        <section><h3>What I built</h3><p>{project.build}</p></section>
        <section><h3>The experience</h3><p>{project.outcome}</p></section>
        <div className="island-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="detail-actions">
          {project.liveUrl && <a className="live-link" href={project.liveUrl} target="_blank" rel="noreferrer">Open live ↗</a>}
          <a href={project.repoUrl} target="_blank" rel="noreferrer">View on GitHub ↗</a>
          <button onClick={nextProject}>Next island →</button>
        </div>
      </> : <>
        <p className="island-eyebrow">A HOME FOR THE PERSON BEHIND THE PROJECTS</p>
        <h2>Hello, I’m Lisa.</h2>
        <p className="detail-summary">AI product manager who builds. Curious about how technology feels,<br />happiest when turning an idea into something you can try.</p>
        <div className="bio-tabs">
          <button aria-pressed={bioTab === 'about'} onClick={() => setBioTab('about')}>About me</button>
          <button aria-pressed={bioTab === 'experience'} onClick={() => setBioTab('experience')}>Experience</button>
        </div>
        {bioTab === 'about' ? <>
          <div className="pink-note">A builder’s little corner.<br /><em>AI products, playful interfaces,<br />and ideas that become real.</em></div>
          <section><h3>What brings these islands together</h3><p>I explore AI interactions, creative tools, games, and research through hands-on projects. This is my evolving collection: a place to try things, keep learning, and share what I build.</p></section>
          <section><h3>Where I come from</h3><p>Data science and UX design at the University of Michigan, then AI research, a cross-border startup, consulting, venture investing, and now product growth at MiniMax. The full timeline is under Experience.</p></section>
          <p className="bio-small">Yuanyuan (Lisa) Yin</p>
        </> : <>
          <ol className="journey">
            {journey.map((stop) => <li key={stop.date} className={stop.current ? 'current' : ''}>
              <span className="journey-date">{stop.date}</span>
              <h3>{stop.title}</h3>
              <p>{stop.summary}</p>
              <div className="island-tags">{stop.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </li>)}
          </ol>
          <p className="bio-small"><a href={profileLinks.resume} target="_blank" rel="noreferrer">Résumé (PDF) ↗</a> · <a href={profileLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a> · <a href={profileLinks.github} target="_blank" rel="noreferrer">GitHub ↗</a></p>
        </>}
        <div className="detail-actions"><a href={profileLinks.email}>Let’s talk ↗</a><button onClick={() => select(projects[0].slug)}>Explore my work →</button></div>
      </>}
    </aside>}

    <footer className="island-footer">
      <div className="world-controls"><button onClick={overview}>↺ <span>All islands</span></button><button onClick={() => setArchive(true)}>☷ <span>Project index</span></button></div>
      <p>DRAG TO EXPLORE <span>·</span> SCROLL / PINCH TO ZOOM</p>
      <span className="island-count">{projects.length + 1} islands · always growing</span>
    </footer>

    <dialog ref={dialog} className="project-dialog" onCancel={() => setArchive(false)} onClose={() => setArchive(false)} onClick={(e) => { if (e.target === e.currentTarget) setArchive(false) }}>
      <div className="archive-content">
        <div className="detail-top"><span>THE PROJECT INDEX · {projects.length} PROJECTS</span><button aria-label="Close project index" onClick={() => setArchive(false)}>×</button></div>
        <h2>Pick your next island.</h2>
        <p>Different experiments. One curious mind.</p>
        <div className="archive-filters">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All projects</button>
          {Object.entries(categoryLabels).map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
        </div>
        <div className="archive-grid">
          {visible.map((p) => <button key={p.slug} className="archive-card" onClick={() => select(p.slug)}>
            <Cover project={p} compact />
            <span className="island-eyebrow">{p.kicker}{p.status === 'Live' && <b className="live-dot"> · LIVE</b>}</span>
            <strong>{p.title} ↗</strong>
            <span>{p.shortDescription}</span>
          </button>)}
        </div>
      </div>
    </dialog>
  </main>
}
