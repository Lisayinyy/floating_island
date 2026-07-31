import { create } from 'zustand'

export type WorldItemId = 'philosophy' | 'about' | 'experience' | 'toolkit' | 'work' | 'art'
export type WorldTheme = 'day' | 'night'

/** Shared with the inline bootstrap script in `index.html`. Keep both in sync. */
export const THEME_STORAGE_KEY = 'floating-island:theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function isTheme(value: unknown): value is WorldTheme {
  return value === 'day' || value === 'night'
}

function readStoredTheme(): WorldTheme | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : null
  } catch {
    // Private browsing or a blocked storage partition: fall back to the OS hint.
    return null
  }
}

function writeStoredTheme(theme: WorldTheme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Persisting is a nicety, never a requirement.
  }
}

function systemTheme(): WorldTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'day'
  return window.matchMedia(DARK_QUERY).matches ? 'night' : 'day'
}

/**
 * The theme the visitor should see on the very first frame.
 *
 * Priority: a choice they made on an earlier visit > their operating-system
 * preference > day. Resolving this *before* React renders matters because the
 * loading screen paints a full-bleed field of the theme colour — picking the
 * wrong one flashes a bright page at someone who asked their machine for dark.
 */
export function resolveInitialTheme(): WorldTheme {
  return readStoredTheme() ?? systemTheme()
}

/**
 * Mirror the theme onto `<html data-theme>` so the document background matches
 * the canvas even in the gaps (overscroll, first paint, canvas re-creation).
 */
export function syncDocumentTheme(theme: WorldTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'night' ? '#101822' : '#f6f2e8')
}

type WorldState = {
  activeItem: WorldItemId | null
  theme: WorldTheme
  /** True once the visitor picks a theme themselves; stops OS follow-along. */
  themeIsExplicit: boolean
  /**
   * Silhouette mode: the reference site's near-black island, as an easter egg.
   *
   * Not the default, because plantpot's home page carries no content while this
   * one has six clickable objects that have to stay findable. Deliberately not
   * persisted either — it is a thing you do, not a setting you keep, and a
   * returning visitor should get the island back.
   */
  silhouette: boolean
  setActiveItem: (item: WorldItemId | null) => void
  setTheme: (theme: WorldTheme) => void
  /** Applies an OS-level change; ignored after an explicit choice. */
  applySystemTheme: (theme: WorldTheme) => void
  toggleTheme: () => void
  toggleSilhouette: () => void
}

export const useWorldStore = create<WorldState>((set, get) => ({
  activeItem: null,
  theme: resolveInitialTheme(),
  themeIsExplicit: readStoredTheme() !== null,
  silhouette: false,
  setActiveItem: (activeItem) => set({ activeItem }),
  setTheme: (theme) => {
    writeStoredTheme(theme)
    syncDocumentTheme(theme)
    set({ theme, themeIsExplicit: true })
  },
  applySystemTheme: (theme) => {
    if (get().themeIsExplicit) return
    syncDocumentTheme(theme)
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'day' ? 'night' : 'day'),
  toggleSilhouette: () => set({ silhouette: !get().silhouette }),
}))

/**
 * Keep following the OS while the visitor has not made a choice of their own.
 * Returns an unsubscribe function.
 */
export function watchSystemTheme(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia(DARK_QUERY)
  const handle = (event: MediaQueryListEvent) => {
    useWorldStore.getState().applySystemTheme(event.matches ? 'night' : 'day')
  }
  media.addEventListener('change', handle)
  return () => media.removeEventListener('change', handle)
}
