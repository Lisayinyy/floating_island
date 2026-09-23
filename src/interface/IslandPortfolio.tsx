import { Canvas } from '@react-three/fiber'
import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { profileLinks } from '../data/journey'
import type { Island, IslandId, Project } from '../data/projects'
import { postBySlug as postBySlugEn } from '../blog/posts'
import { useLocale } from '../i18n'
import type { Locale } from '../i18n'
import './IslandPortfolio.css'

type BlogRoute = 'index' | string | null

const readBlogHash = (): BlogRoute => {
  const m = window.location.hash.match(/^#blog(?:\/([\w-]+))?$/)
  if (!m) return null
  return m[1] && postBySlugEn[m[1]] ? m[1] : 'index'
}

const Islands = lazy(() => import('../scene/ProjectIslands'))

class SceneBoundary extends Component<{ children: ReactNode; fallback: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <p className="scene-fallback">{this.props.fallback}</p>
      : this.props.children
  }
}

function Cover({ project, island, ui, compact = false }: { project: Project; island: Island; ui: Locale['ui']; compact?: boolean }) {
  const className = compact ? 'card-cover' : ''
  if (project.cover) {
    return <img className={`island-cover ${className} ${project.slug === 'prompt-ai' ? 'icon-cover' : ''}`} src={project.cover} alt={compact ? '' : ui.coverAlt(project.title)} loading="lazy" />
  }
  return (
    <div className={`island-cover cover-tile tile-${project.island} ${className}`} role="img" aria-label={`${project.title}: ${island.title}`}>
      <span>{compact ? island.title.toUpperCase() : project.kicker}</span>
    </div>
  )
}

function ProjectLinks({ project, ui }: { project: Project; ui: Locale['ui'] }) {
  return <div className="project-links">
    {project.liveUrl && <a className="live-link" href={project.liveUrl} target="_blank" rel="noreferrer">{project.status === 'Design' ? ui.viewDesign : ui.openLive}</a>}
    {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer">{ui.github}</a>}
  </div>
}

export default function IslandPortfolio() {
  const { lang, setLang, ui, islands, projects, journey, posts, postBySlug } = useLocale()
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

  const islandById = Object.fromEntries(islands.map((i) => [i.id, i])) as Record<IslandId, Island>
  const islandIndex = islands.findIndex((island) => island.id === selection)
  const island = islandIndex >= 0 ? islands[islandIndex] : undefined
  const overview = () => { setSelection(null); setOpenProject(null); setReset((v) => v + 1) }
  const select = (id: string, project: string | null = null) => { setSelection(id); setOpenProject(project); setArchive(false) }
  const openBio = (tab: 'about' | 'experience') => { setBioTab(tab); select('about') }
  const sceneLabels = { about: ui.aboutIsland, ...Object.fromEntries(islands.map((i) => [i.id, i.shortTitle])) }

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
  const post = blog && blog !== 'index' ? postBySlug[blog] : null

  return <main className={`islands-app lang-${lang} ${selection ? 'has-selection' : ''}`}>
    <header className="island-nav">
      <button className="island-brand" onClick={overview}><span className="brand-flower">✳</span> {ui.brand}<span className="brand-caption">{ui.brandCaption}</span></button>
      <nav aria-label="Main navigation">
        <button onClick={overview}>{ui.nav.explore}</button>
        <button onClick={() => setArchive(true)}>{ui.nav.projects} <sup>{projects.length}</sup></button>
        <button onClick={() => openBio('about')}>{ui.nav.about}</button>
        <button className="experience-nav" onClick={() => openBio('experience')}>{ui.nav.experience}</button>
        <button onClick={() => setBlog('index')}>{ui.nav.blog}</button>
        <button className="lang-toggle" lang={lang === 'en' ? 'zh-CN' : 'en'} onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>{ui.nav.lang}</button>
        <a className="contact-link" href={profileLinks.email}>{ui.nav.hello}</a>
      </nav>
    </header>

    {!selection && <section className="island-intro">
      <p className="island-eyebrow">{ui.introEyebrow}</p>
      <h1>{ui.introTitle[0]}<br />{ui.introTitle[1]}<em>{ui.introTitle[2]}</em></h1>
      <p>{ui.introBody[0]}<br />{ui.introBody[1]}</p>
    </section>}

    <div className="island-scene" aria-label={ui.sceneLabel}>
      <SceneBoundary fallback={ui.sceneUnavailable}>
        <Canvas shadows dpr={[1, 1.6]} camera={{ position: [24, 28, 35], fov: 39, near: 0.1, far: 250 }} gl={{ antialias: true, alpha: true }} fallback={<p className="scene-fallback">{ui.sceneNeedsWebgl}</p>}>
          <Suspense fallback={null}><Islands selection={selection} reset={reset} labels={sceneLabels} onSelect={select} onReady={readyScene} /></Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
    {!ready && <p className="scene-status" role="status">{ui.preparing} <button onClick={() => setArchive(true)}>{ui.browseProjects}</button></p>}

    {selection && <aside className="island-detail" key={selection} aria-label={island ? ui.islandProjects(island.title) : ui.aboutLabel}>
      <div className="detail-top">
        <span>{island ? ui.islandHeading(String(islandIndex + 1).padStart(2, '0'), island.title) : ui.pinkIsland}</span>
        <button aria-label={ui.closeIsland} onClick={overview}>×</button>
      </div>
      {island ? <>
        <p className="island-eyebrow">{island.kicker}</p>
        <h2>{island.title}</h2>
        <p className="detail-summary">{island.tagline}</p>
        <p className="island-intro-text">{island.intro}</p>
        <ul className="project-list" aria-label={ui.islandProjects(island.title)}>
          {projects.filter((p) => p.island === island.id).map((p) => {
            const open = openProject === p.slug
            return <li key={p.slug} id={`project-${p.slug}`} className={open ? 'open' : ''}>
              <button className="project-row" aria-expanded={open} onClick={() => setOpenProject(open ? null : p.slug)}>
                <Cover project={p} island={islandById[p.island]} ui={ui} compact />
                <span className="project-row-text">
                  <span className="island-eyebrow">{p.kicker} · <b className={`status-${p.status.replace(/\s+/g, '-').toLowerCase()}`}>{ui.status[p.status]}</b></span>
                  <strong>{p.title}</strong>
                  <span>{p.shortDescription}</span>
                </span>
                <span className="project-row-caret" aria-hidden="true">{open ? '–' : '+'}</span>
              </button>
              {open && <div className="project-body">
                {p.cover && <Cover project={p} island={islandById[p.island]} ui={ui} />}
                {p.problem && <section><h3>{ui.idea}</h3><p>{p.problem}</p></section>}
                {p.build && <section><h3>{ui.built}</h3><p>{p.build}</p></section>}
                {p.outcome && <section><h3>{ui.experienceSection}</h3><p>{p.outcome}</p></section>}
                <div className="island-tags">{p.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <ProjectLinks project={p} ui={ui} />
              </div>}
            </li>
          })}
        </ul>
        <div className="detail-actions">
          <button onClick={() => select(islands[(islandIndex + 1) % islands.length].id)}>{ui.nextIsland}</button>
        </div>
      </> : <>
        <p className="island-eyebrow">{ui.aboutEyebrow}</p>
        <h2>{ui.hello}</h2>
        <p className="detail-summary">{ui.aboutSummary[0]}<br />{ui.aboutSummary[1]}</p>
        <div className="bio-tabs">
          <button aria-pressed={bioTab === 'about'} onClick={() => setBioTab('about')}>{ui.tabAbout}</button>
          <button aria-pressed={bioTab === 'experience'} onClick={() => setBioTab('experience')}>{ui.tabExperience}</button>
        </div>
        {bioTab === 'about' ? <>
          <div className="pink-note">{ui.pinkNote[0]}<br /><em>{ui.pinkNote[1]}<br />{ui.pinkNote[2]}</em></div>
          <section><h3>{ui.togetherTitle}</h3><p>{ui.togetherBody}</p></section>
          <section><h3>{ui.fromTitle}</h3><p>{ui.fromBody}</p></section>
          <p className="bio-small">{ui.name}</p>
        </> : <>
          <ol className="journey">
            {journey.map((stop) => <li key={stop.date} className={stop.current ? 'current' : ''}>
              <span className="journey-date">{stop.date}</span>
              <h3>{stop.title}</h3>
              <p>{stop.summary}</p>
              <div className="island-tags">{stop.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </li>)}
          </ol>
          <p className="bio-small"><a href={profileLinks.resume} target="_blank" rel="noreferrer">{ui.resume}</a> · <a href={profileLinks.linkedin} target="_blank" rel="noreferrer">{ui.linkedin}</a> · <a href={profileLinks.github} target="_blank" rel="noreferrer">{ui.githubLink}</a></p>
        </>}
        <div className="detail-actions"><a href={profileLinks.email}>{ui.talk}</a><button onClick={() => select(islands[0].id)}>{ui.exploreWork}</button></div>
      </>}
    </aside>}

    <footer className="island-footer">
      <div className="world-controls"><button onClick={overview}>↺ <span>{ui.allIslands}</span></button><button onClick={() => setArchive(true)}>☷ <span>{ui.projectIndex}</span></button></div>
      <p>{ui.footerHint[0]} <span>·</span> {ui.footerHint[1]}</p>
      <span className="island-count">{ui.count(islands.length + 1, projects.length)}</span>
    </footer>

    <dialog ref={dialog} className="project-dialog" onCancel={() => setArchive(false)} onClose={() => setArchive(false)} onClick={(e) => { if (e.target === e.currentTarget) setArchive(false) }}>
      <div className="archive-content">
        <div className="detail-top"><span>{ui.indexHeading(projects.length)}</span><button aria-label={ui.closeIndex} onClick={() => setArchive(false)}>×</button></div>
        <h2>{ui.indexTitle}</h2>
        <p>{ui.indexBody}</p>
        <div className="archive-filters">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{ui.allProjects}</button>
          {islands.map((i) => <button key={i.id} aria-pressed={filter === i.id} onClick={() => setFilter(i.id)}>{i.title}</button>)}
        </div>
        <div className="archive-grid">
          {visible.map((p) => <button key={p.slug} className="archive-card" onClick={() => select(p.island, p.slug)}>
            <Cover project={p} island={islandById[p.island]} ui={ui} compact />
            <span className="island-eyebrow">{p.kicker}{p.status === 'Live' && <b className="live-dot"> · {ui.live}</b>}</span>
            <strong>{p.title} ↗</strong>
            <span>{p.shortDescription}</span>
          </button>)}
        </div>
      </div>
    </dialog>

    <dialog ref={blogDialog} className="project-dialog blog-dialog" onCancel={() => setBlog(null)} onClose={() => setBlog(null)} onClick={(e) => { if (e.target === e.currentTarget) setBlog(null) }}>
      {blog && (post === null ? <div className="archive-content" tabIndex={-1} autoFocus>
        <div className="detail-top"><span>{ui.blogHeading(posts.length)}</span><button aria-label={ui.closeBlog} onClick={() => setBlog(null)}>×</button></div>
        <h2>{ui.blogTitle}</h2>
        <p>{ui.blogBody}</p>
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
          <button className="back-link" onClick={() => setBlog('index')}>{ui.allPosts}</button>
          <button aria-label={ui.closePost} onClick={() => setBlog(null)}>×</button>
        </div>
        <p className="island-eyebrow">{ui.readMeta(post.date, post.readTime)}</p>
        <h2>{post.title}</h2>
        <div className="island-tags">{post.tags.map((t) => <span key={t}>{t}</span>)}</div>
        {post.body}
        <div className="detail-actions"><button onClick={() => setBlog('index')}>{ui.allPosts}</button><a href={profileLinks.email}>{ui.discuss}</a></div>
      </article>)}
    </dialog>
  </main>
}
