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
  /**
   * Draw calls in the last rendered frame.
   *
   * The counts above describe what is in the scene; this describes what it costs
   * to show it, which is a different number once shadow maps, a contact-shadow
   * pass and four particle systems are involved. It is also the honest thing to
   * assert: the frame rate a harness measures under software rasterisation is a
   * fact about the harness, while a draw call is the same number everywhere.
   */
  drawCalls: number
  /** Triangles actually submitted last frame, shadow and helper passes included. */
  drawnTriangles: number
  /** Compiled shader programs; each one is a compile stall the first time it runs. */
  programs: number
  /** Live GPU textures and geometries, as the renderer counts them. */
  textures: number
  geometries: number
  /**
   * Extra full-scene passes the shadow maps cost, weighted by kind: a directional
   * or spot light is one, a point light is six — one per cube face. A single
   * `castShadow` prop is the cheapest way to make a scene several times more
   * expensive, and it changes no other number here.
   */
  shadowPasses: number
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
   * How solid the middle of the object is: the fraction of a 5×5 ray grid over
   * the central quarter of the projected box that lands on the object itself.
   *
   * The question `visibleRatio` and `fill` both fail to ask is whether there is
   * anything *where a finger aims*. The photo wall is four frames with gaps, and
   * the gap was in the middle — so the one chapter of six that a real tap could
   * not open was the one whose box measured healthiest.
   */
  core: number
  /**
   * A point, in CSS pixels, that is certainly on the object: the sampled hit with
   * the most room around it, or null when the middle is entirely gaps.
   *
   * A test points here rather than at the box centre. The centre can sit on a
   * seam, and the first version of this aimed at the hit nearest the centre —
   * which on the easel is a pixel from the gap beside the crossbar, so with the
   * island gently bobbing one tap in four missed a target the probe had just
   * called solid. Nobody points at the edge of a thing.
   */
  aim: { x: number; y: number } | null
  /**
   * How much room there is around `aim`, in CSS pixels: the distance from it to
   * the nearest sampled place the object is not.
   *
   * The honest measure of whether an object can be pointed at with a finger. A
   * tall thin thing can have a healthy `core` and still offer nowhere with any
   * clearance.
   */
  margin: number
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
    /**
     * The order the island's self-introduction actually ran in, on a device
     * without hover. Published because a 900ms step is easily swallowed by one
     * slow frame, so sampling the labels from outside drops entries and reports
     * a working tour as a broken one.
     */
    __ISLAND_TOUR__?: string[]
  }
}
