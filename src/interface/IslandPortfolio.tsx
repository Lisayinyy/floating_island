import { Canvas } from '@react-three/fiber'
import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { journey, profileLinks } from '../data/journey'
import { islandById, islands, projects } from '../data/projects'
import type { IslandId, Project } from '../data/projects'
import { postBySlug, posts } from '../blog/posts'
import './IslandPortfolio.css'

type BlogRoute = 'index' | string | null

const readBlogHash = (): BlogRoute => {
  const m = window.location.hash.match(/^#blog(?:\/([\w-]+))?$/)
  if (!m) return null
  return m[1] && postBySlug[m[1]] ? m[1] : 'index'
}

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
    return <img className={`island-cover ${className} ${project.slug === 'prompt-ai' ? 'icon-cover' : ''}`} src={project.cover} alt={compact ? '' : `${project.title} project preview`} loading="lazy" />
  }
  return (
    <div className={`island-cover cover-tile tile-${project.island} ${className}`} role="img" aria-label={`${project.title}: ${islandById[project.island].title}`}>
      <span>{compact ? islandById[project.island].title.toUpperCase() : project.kicker}</span>
    </div>
  )
}

function ProjectLinks({ project }: { project: Project }) {
  return <div className="project-links">
    {project.liveUrl && <a className="live-link" href={project.liveUrl} target="_blank" rel="noreferrer">{project.status === 'Design' ? 'View design ↗' : 'Open live ↗'}</a>}
    {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer">GitHub ↗</a>}
  </div>
}

export default function IslandPortfolio() {
  const [selection, setSelection] = useState<string | null>(null)
  const [openProject, setOpenProject] = useState<string | null>(null)
  const [reset, setReset] = useState(0)
  const [ready, setReady] = useState(false)
  const [archive, setArchive] = useState(false)
  const [filter, setFilter] = useState<IslandId | 'all'>('all')
  const [bioTab, setBioTab] = useState<'about' | 'experience'>('about')
  const [blog, setBlog] = useState<BlogRoute>(readBlogHash)
  const dialog = useRef<HTMLDialogElement>(null)
  const blogDialog = useRef<HTMLDialogElement>(null)
  const readyScene = useCallback(() => setReady(true), [])

  const islandIndex = islands.findIndex((island) => island.id === selection)
  const island = islandIndex >= 0 ? islands[islandIndex] : undefined
  const overview = () => { setSelection(null); setOpenProject(null); setReset((v) => v + 1) }
  const select = (id: string, project: string | null = null) => { setSelection(id); setOpenProject(project); setArchive(false) }
  const openBio = (tab: 'about' | 'experience') => { setBioTab(tab); select('about') }

  useEffect(() => { if (archive) dialog.current?.showModal(); else dialog.current?.close() }, [archive])
  useEffect(() => {
    if (blog) blogDialog.current?.showModal(); else blogDialog.current?.close()
    const hash = blog === null ? '' : blog === 'index' ? '#blog' : `#blog/${blog}`
    if (window.location.hash !== hash) history.replaceState(null, '', hash || window.location.pathname)
    blogDialog.current?.scrollTo({ top: 0 })
  }, [blog])
  useEffect(() => {
    const onHash = () => setBlog(readBlogHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape' && !dialog.current?.open && !blogDialog.current?.open) { setSelection(null); setOpenProject(null) } }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])
  useEffect(() => {
    if (openProject) document.getElementById(`project-${openProject}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [openProject])

  const visible = projects.filter((p) => filter === 'all' || p.island === filter)

  return <main className={`islands-app ${selection ? 'has-selection' : ''}`}>
    <header className="island-nav">
      <button className="island-brand" onClick={overview}><span className="brand-flower">✳</span> Lisa’s islands<span className="brand-caption">A WORLD OF THINGS I MAKE</span></button>
      <nav aria-label="Main navigation">
        <button onClick={overview}>Explore</button>
        <button onClick={() => setArchive(true)}>Projects <sup>{projects.length}</sup></button>
        <button onClick={() => openBio('about')}>About</button>
        <button className="experience-nav" onClick={() => openBio('experience')}>Experience</button>
        <button onClick={() => setBlog('index')}>Blog</button>
        <a className="contact-link" href={profileLinks.email}>Say hello ↗</a>
      </nav>
    </header>

    {!selection && <section className="island-intro">
      <p className="island-eyebrow">INDEPENDENT IDEAS. CONNECTED BY CURIOSITY.</p>
      <h1>A little world,<br />always <em>growing.</em></h1>
      <p>Five islands, one for each kind of thing I make.<br />Pick a place. See where curiosity takes you.</p>
    </section>}

    <div className="island-scene" aria-label="Interactive 3D archipelago. Drag to orbit, scroll or pinch to zoom. Select island labels to visit.">
      <SceneBoundary>
        <Canvas shadows dpr={[1, 1.6]} camera={{ position: [24, 28, 35], fov: 39, near: 0.1, far: 250 }} gl={{ antialias: true, alpha: true }} fallback={<p className="scene-fallback">3D needs WebGL. All projects are available in the Projects menu.</p>}>
          <Suspense fallback={null}><Islands selection={selection} reset={reset} onSelect={select} onReady={readyScene} /></Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
    {!ready && <p className="scene-status" role="status">Preparing your islands… <button onClick={() => setArchive(true)}>Browse projects</button></p>}

    {selection && <aside className="island-detail" key={selection} aria-label={island ? `${island.title} projects` : 'About Lisa'}>
      <div className="detail-top">
        <span>{island ? `${String(islandIndex + 1).padStart(2, '0')} / ${island.title.toUpperCase()} ISLAND` : '00 / THE PINK ISLAND'}</span>
        <button aria-label="Close island details" onClick={overview}>×</button>
      </div>
      {island ? <>
        <p className="island-eyebrow">{island.kicker}</p>
        <h2>{island.title}</h2>
        <p className="detail-summary">{island.tagline}</p>
        <p className="island-intro-text">{island.intro}</p>
        <ul className="project-list" aria-label={`${island.title} projects`}>
          {projects.filter((p) => p.island === island.id).map((p) => {
            const open = openProject === p.slug
            return <li key={p.slug} id={`project-${p.slug}`} className={open ? 'open' : ''}>
              <button className="project-row" aria-expanded={open} onClick={() => setOpenProject(open ? null : p.slug)}>
                <Cover project={p} compact />
                <span className="project-row-text">
                  <span className="island-eyebrow">{p.kicker} · <b className={`status-${p.status.replace(/\s+/g, '-').toLowerCase()}`}>{p.status}</b></span>
                  <strong>{p.title}</strong>
                  <span>{p.shortDescription}</span>
                </span>
                <span className="project-row-caret" aria-hidden="true">{open ? '–' : '+'}</span>
              </button>
              {open && <div className="project-body">
                {p.cover && <Cover project={p} />}
                {p.problem && <section><h3>The idea</h3><p>{p.problem}</p></section>}
                {p.build && <section><h3>What I built</h3><p>{p.build}</p></section>}
                {p.outcome && <section><h3>The experience</h3><p>{p.outcome}</p></section>}
                <div className="island-tags">{p.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <ProjectLinks project={p} />
              </div>}
            </li>
          })}
        </ul>
        <div className="detail-actions">
          <button onClick={() => select(islands[(islandIndex + 1) % islands.length].id)}>Next island →</button>
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
          <section><h3>What brings these islands together</h3><p>I explore AI interactions, creative tools, games, finance and research through hands-on projects. This is my evolving collection: a place to try things, keep learning, and share what I build.</p></section>
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
        <div className="detail-actions"><a href={profileLinks.email}>Let’s talk ↗</a><button onClick={() => select(islands[0].id)}>Explore my work →</button></div>
      </>}
    </aside>}

    <footer className="island-footer">
      <div className="world-controls"><button onClick={overview}>↺ <span>All islands</span></button><button onClick={() => setArchive(true)}>☷ <span>Project index</span></button></div>
      <p>DRAG TO EXPLORE <span>·</span> SCROLL / PINCH TO ZOOM</p>
      <span className="island-count">{islands.length + 1} islands · {projects.length} projects</span>
    </footer>

    <dialog ref={dialog} className="project-dialog" onCancel={() => setArchive(false)} onClose={() => setArchive(false)} onClick={(e) => { if (e.target === e.currentTarget) setArchive(false) }}>
      <div className="archive-content">
        <div className="detail-top"><span>THE PROJECT INDEX · {projects.length} PROJECTS</span><button aria-label="Close project index" onClick={() => setArchive(false)}>×</button></div>
        <h2>Pick your next island.</h2>
        <p>Different experiments. One curious mind.</p>
        <div className="archive-filters">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All projects</button>
          {islands.map((i) => <button key={i.id} aria-pressed={filter === i.id} onClick={() => setFilter(i.id)}>{i.title}</button>)}
        </div>
        <div className="archive-grid">
          {visible.map((p) => <button key={p.slug} className="archive-card" onClick={() => select(p.island, p.slug)}>
            <Cover project={p} compact />
            <span className="island-eyebrow">{p.kicker}{p.status === 'Live' && <b className="live-dot"> · LIVE</b>}</span>
            <strong>{p.title} ↗</strong>
            <span>{p.shortDescription}</span>
          </button>)}
        </div>
      </div>
    </dialog>

    <dialog ref={blogDialog} className="project-dialog blog-dialog" onCancel={() => setBlog(null)} onClose={() => setBlog(null)} onClick={(e) => { if (e.target === e.currentTarget) setBlog(null) }}>
      {blog && (blog === 'index' ? <div className="archive-content" tabIndex={-1} autoFocus>
        <div className="detail-top"><span>THE BLOG · {posts.length} {posts.length === 1 ? 'POST' : 'POSTS'}</span><button aria-label="Close blog" onClick={() => setBlog(null)}>×</button></div>
        <h2>Research logs.</h2>
        <p>Notes I write while figuring things out. Sources included, opinions dated.</p>
        <ul className="post-list">
          {posts.map((p) => <li key={p.slug}>
            <button className="post-row" onClick={() => setBlog(p.slug)}>
              <span className="island-eyebrow">{p.date} · {p.readTime}</span>
              <strong>{p.title}</strong>
              <span>{p.summary}</span>
              <span className="island-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</span>
            </button>
          </li>)}
        </ul>
      </div> : <article className="archive-content blog-article" tabIndex={-1} autoFocus>
        <div className="detail-top">
          <button className="back-link" onClick={() => setBlog('index')}>← All posts</button>
          <button aria-label="Close post" onClick={() => setBlog(null)}>×</button>
        </div>
        <p className="island-eyebrow">{postBySlug[blog].date.toUpperCase()} · {postBySlug[blog].readTime.toUpperCase()} READ</p>
        <h2>{postBySlug[blog].title}</h2>
        <div className="island-tags">{postBySlug[blog].tags.map((t) => <span key={t}>{t}</span>)}</div>
        {postBySlug[blog].body}
        <div className="detail-actions"><button onClick={() => setBlog('index')}>← All posts</button><a href={profileLinks.email}>Discuss this ↗</a></div>
      </article>)}
    </dialog>
  </main>
}
