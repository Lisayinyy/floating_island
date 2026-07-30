import { create } from 'zustand'

export type WorldItemId = 'philosophy' | 'about' | 'experience' | 'toolkit' | 'work' | 'art'
export type WorldTheme = 'day' | 'night'

type WorldState = {
  activeItem: WorldItemId | null
  theme: WorldTheme
  setActiveItem: (item: WorldItemId | null) => void
  toggleTheme: () => void
}

export const useWorldStore = create<WorldState>((set) => ({
  activeItem: null,
  theme: 'day',
  setActiveItem: (activeItem) => set({ activeItem }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'day' ? 'night' : 'day' })),
}))
