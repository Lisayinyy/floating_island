import { create } from 'zustand'

export type WorldItemId = 'philosophy' | 'about' | 'experience' | 'toolkit' | 'work'

type WorldState = {
  activeItem: WorldItemId | null
  setActiveItem: (item: WorldItemId | null) => void
}

export const useWorldStore = create<WorldState>((set) => ({
  activeItem: null,
  setActiveItem: (activeItem) => set({ activeItem }),
}))
