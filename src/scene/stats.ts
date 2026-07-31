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
  /**
   * Meshes carrying an `art:*` canvas texture — the easel, the four photo frames
   * and the pinned board. Counted separately from `screens` so that losing one
   * set cannot be masked by the other still being present.
   */
  artworks: number
  /** The theme these numbers were measured under. */
  theme: 'day' | 'night'
  /** Whether silhouette mode was flattening the scene when measured. */
  silhouette: boolean
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
  /**
   * Fraction of the viewport height the object's projected bounding box covers.
   *
   * `visibleRatio` proves nothing was in the way; this proves the object is
   * actually worth looking at. Both of the framing regressions we hit read as
   * "visible" — the easel was unobstructed, just tiny and adrift — so the size
   * has to be asserted separately from the occlusion.
   */
  fill: number
  /**
   * The same projected box in CSS pixels.
   *
   * `ndc` and `fill` say where the object is and how big it reads; this says it
   * in the same units as the chapter panel's own rectangle, which is the only
   * way to assert the thing a phone visitor actually cares about — that the
   * object is not sitting behind the panel describing it.
   */
  rect: { x: number; y: number; width: number; height: number }
}

declare global {
  interface Window {
    __ISLAND_STATS__?: IslandStats
    __ISLAND_PROBE__?: (
      id: 'philosophy' | 'about' | 'experience' | 'toolkit' | 'work' | 'art',
    ) => FocusProbe | null
    /**
     * Screen position of a named scene object, in CSS pixels, or null when it is
     * not in the graph. Lets a test click a detail without hard-coded pixels.
     */
    __ISLAND_AT__?: (name: string) => { x: number; y: number } | null
    /**
     * Camera flight state: whether a chapter or home tween is currently moving
     * the camera, and how many flights have been started.
     *
     * A test cannot infer either half from the outside. A projection that has
     * stopped changing looks the same as one that has not started, and a bare
     * boolean can be read before the new flight has begun — hence the counter.
     */
    __ISLAND_FLIGHT__?: { flying: boolean; count: number }
  }
}
