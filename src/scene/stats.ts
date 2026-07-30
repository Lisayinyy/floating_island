/**
 * Shapes of the debug hooks published by `SceneProbes` in
 * `src/scene/World.tsx` and asserted against by `qa/verify.py`.
 */
export type IslandStats = {
  /** Meshes actually present in the render graph. */
  meshes: number
  /** Triangle count, summed from geometry indices. */
  triangles: number
  /** Lights in the graph; the night theme adds several. */
  lights: number
  /** Meshes carrying a `screen:*` canvas texture. Should be 2. */
  screens: number
  /** The theme these numbers were measured under. */
  theme: 'day' | 'night'
}

export type FocusProbe = {
  /** Fraction of sampled points on the object that the camera can actually see. */
  visibleRatio: number
  /** How many points were sampled. */
  samples: number
  /** Name or type of the first thing found in the way, when something is. */
  blockedBy: string | null
  /** Normalised device coordinates of the object's centre. */
  ndc: { x: number; y: number }
}

declare global {
  interface Window {
    __ISLAND_STATS__?: IslandStats
    __ISLAND_PROBE__?: (
      id: 'philosophy' | 'about' | 'experience' | 'toolkit' | 'work' | 'art',
    ) => FocusProbe | null
  }
}
