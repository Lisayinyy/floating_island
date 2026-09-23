import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { en } from './en'
import { zh, zhIslands, zhJourney, zhProjects } from './zh'
import { islands as islandsEn, projects as projectsEn } from '../data/projects'
import type { Island, Project } from '../data/projects'
import { journey as journeyEn } from '../data/journey'
import type { JourneyStop } from '../data/journey'
import { posts as postsEn } from '../blog/posts'
import { postsZh } from '../blog/posts.zh'
import type { Post } from '../blog/posts'

export type Lang = 'en' | 'zh'

const STORAGE_KEY = 'lang'

const initialLang = (): Lang => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'zh') return stored
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export type Locale = {
  lang: Lang
  setLang: (lang: Lang) => void
  ui: typeof en
  islands: Island[]
  projects: Project[]
  journey: JourneyStop[]
  posts: Post[]
  postBySlug: Record<string, Post>
}

const LocaleContext = createContext<Locale | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    document.title = lang === 'zh' ? zh.htmlTitle : en.htmlTitle
  }, [lang])

  const value = useMemo<Locale>(() => {
    if (lang === 'en') {
      return { lang, setLang, ui: en, islands: islandsEn, projects: projectsEn, journey: journeyEn, posts: postsEn, postBySlug: Object.fromEntries(postsEn.map((p) => [p.slug, p])) }
    }
    const islands = islandsEn.map((i) => ({ ...i, ...zhIslands[i.id] }))
    const projects = projectsEn.map((p) => ({ ...p, ...zhProjects[p.slug] }))
    return { lang, setLang, ui: zh, islands, projects, journey: zhJourney, posts: postsZh, postBySlug: Object.fromEntries(postsZh.map((p) => [p.slug, p])) }
  }, [lang])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale outside LocaleProvider')
  return ctx
}
