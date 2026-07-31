import { create } from 'zustand'

export type WorldItemId = 'philosophy' | 'about' | 'experience' | 'toolkit' | 'work' | 'art'
export type WorldTheme = 'day' | 'night'

export const THEME_STORAGE_KEY = 'lisa-world:theme'

// The inline bootstrap in index.html has already written this attribute before
// the first paint, so reading it back avoids a second source of truth.
function readStoredTheme(): WorldTheme {
  if (typeof document !== 'undefined') {
    const marked = document.documentElement.dataset.theme
    if (marked === 'day' || marked === 'night') return marked
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'day' || stored === 'night') return stored
  } catch {
    // Private mode and blocked storage are fine: fall through to the default.
  }

  return 'day'
}

function storeTheme(theme: WorldTheme) {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Nothing to do; the session simply will not be remembered.
  }
}

type WorldState = {
  activeItem: WorldItemId | null
  theme: WorldTheme
  setActiveItem: (item: WorldItemId | null) => void
  toggleTheme: () => void
}

export const useWorldStore = create<WorldState>((set) => ({
  activeItem: null,
  theme: readStoredTheme(),
  setActiveItem: (activeItem) => set({ activeItem }),
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'day' ? 'night' : 'day'
      storeTheme(theme)
      return { theme }
    }),
}))
