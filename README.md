# Lisa's Floating Island

An interactive personal world: a low-poly island floating in a soft sky, with a
cutaway cabin on top. Every object in the cabin opens a chapter of Lisa's story.
Built with React, TypeScript, Three.js and React Three Fiber — all geometry is
generated in code, so there are no model files to download.

Live: <https://lisayinyy.github.io/floating_island/>

| Day | Night |
| --- | --- |
| ![The island in the day theme](docs/preview-day.png) | ![The island in the night theme](docs/preview-night.png) |

## What it does

- **One scene, six chapters.** Clicking the laptop, easel, photo wall, console,
  graduation cap or prototype deck opens that chapter and leans the camera in on
  the object.
- **Day and night.** Not just a palette swap: at night the campfire, hanging
  lantern, desk lamp, candle, two cabin windows and the lit screens become the
  only real light sources, and the sky turns navy-into-teal with stars and
  drifting embers.
- **Cinematic entrance.** The camera starts close on the cabin and pulls back to
  the home framing, then the island keeps a slow idle float that also reacts to
  the pointer.
- **Respects the visitor.** It opens in the theme their operating system asks
  for and remembers the one they pick. `prefers-reduced-motion` skips the
  entrance and the float, orbit angles are clamped so the scene can never be
  turned inside out, and the layout has a dedicated phone framing.
- **Usable without a mouse.** Each 3D object owns a real focusable button, so
  tabbing raises its label and Enter opens the chapter; Escape closes the menu
  sheet, then the panel.
- **Screens that show something.** The laptop and the AI console are painted with
  Canvas2D textures — an editor mid-edit and a generation dashboard — because the
  chapter views fly close enough that a blank pane was the least finished surface
  on the island.
- **Painted artwork, not placeholder shapes.** The easel carries a painting of the
  island itself, the photo wall holds four different pictures, and the board above
  the desk is a working moodboard. All six are Canvas2D textures for the same
  reason as the screens: a circle and two bars stood in for a painting, and the
  chapter close-up showed it.
- **Things that reward poking.** The campfire flares when you click it, the
  hanging lantern can be snuffed out and relit, and the tree leans away from your
  pointer on top of its own idle wind. None of it is announced, none of it is a
  setting, and all of it goes still under `prefers-reduced-motion`.
- **A silhouette hidden behind one key.** Pressing `S` flattens the whole island
  to a single dark tone while every flame, candle, lit window and screen keeps
  burning — the reference site's silhouette, borrowed as an easter egg instead of
  a default. It is never saved, because it is a thing you do, not a mode you keep.
- **Framing is measured, never hand-written.** Chapter cameras are derived from a
  live bounding-sphere measurement of the object plus a frame-relative target
  (`fill`, `ndcX`, `ndcY`), and floating labels sit at the measured top of each
  object. Hand-written tables drifted twice — the easel's aim point ended up 1.85
  units off the easel, and the laptop's label floated up beside the graduation cap
  on the shelf above it.

## Design language

The visual direction is a study of [plantpot.studio](https://www.plantpot.studio)
by Akira Haga, adapted to a site that has to keep interactive content readable:

| Borrowed | How it is applied here |
| --- | --- |
| Island fully inside the frame, never cropped | One `homeFraming` table in `src/scene/World.tsx` sizes desktop and phone framing; every tween reads from it |
| Silhouette-first lighting: a dark mass against a soft sky | Ambient and hemisphere fill are kept low in *both* themes; warm light only exists at the fire, lantern and desk lamp |
| Irregular rock, not a turned cone | `src/scene/islandGeometry.ts` generates a flat-shaded, deterministic, asymmetric rock mass with boulders breaking the outline |
| A cabin silhouette | A cutaway shed roof with rafters and posts (`CabinShell`), open at the front so every object stays visible |
| Layered pastel sky plus vignette | Stacked CSS radial gradients on `.app-shell`, with an alpha WebGL canvas in front of them |
| Foreground bokeh dust | A CSS `.dust` layer of blurred drifting motes, on top of the in-world sparkles |
| Full-screen frosted navigation | `.menu-sheet` blurs the island behind big handwritten chapter links |
| One handwritten accent face | `Shadows Into Light Two` for the wordmark, chapter list and signature; `IBM Plex Mono` for interface text; `Instrument Serif` for headlines |
| Custom loading screen | Two counter-rotating dotted rings with a mono caption, painted from a ~17 kB entry chunk so it appears before three.js has downloaded |
| A single warm window in a dark mass | The right end wall is framed timber around two real openings (`WindowWall`); after dark the panes are the island's brightest note |
| Theme follows the system, then the visitor | `resolveInitialTheme()` reads `localStorage` first and `prefers-color-scheme` second; an inline script in `index.html` applies it before React mounts, so night visitors never see a white flash |
| A near-black island silhouette | Available on demand: `S` swaps every material for one flat dark tone, skipping anything genuinely emissive, so the mass reads as a shape with a few warm points inside it |

Where it deliberately differs: plantpot's island is a near-black silhouette,
which works because its home page carries no content. This island has six
clickable objects, so the default view keeps the interior lit and legible while
the exterior mass carries the silhouette — and the full silhouette lives behind
the `S` key for anyone who wants it. Flattening the scene with a single
`scene.overrideMaterial` was tried first and rejected: it turned the open-fronted
cabin into one solid black rectangle and the sparkles into black specks.

## Performance notes

`three` is ~725 kB minified and cannot be split, so the fix was to stop it
blocking first paint. `src/scene/Stage.tsx` is behind `React.lazy` and
`vite.config.ts` groups vendors into `react` / `three` / `r3f` / `gsap` chunks,
which leaves a ~17 kB entry that renders the shell and loading rings immediately.
Group order in that config is load-bearing — a group also absorbs the
dependencies of what it matches, so listing `r3f` first pulled react *and* three
into one 1.1 MB chunk.

Lights are counted, not sprinkled: the day theme uses 9 and night 13, and the
screen-glow lights only exist at night, because a forward renderer pays for every
light on every lit fragment.

## Development

```bash
npm install
npm run dev      # vite dev server
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Visual regression pass

The scene has no DOM to assert against, so QA renders it in headless Chromium
with software WebGL and checks the failures that have actually happened here:

- the entrance never finishing, or the loading screen never lifting (procedural
  scenes never report `progress === 100`, so this one is a real trap)
- a canvas that draws nothing but sky, or a menu or chapter panel that will not
  open
- **a chapter that frames the wrong thing.** `window.__ISLAND_PROBE__` raycasts
  from the live camera to points sampled on the object a chapter claims to show.
  This caught the AI console sitting in a pocket of the room the camera could
  never see into: every visit to that chapter framed a blank wall.
- **a chapter that frames its object badly.** The same probe reports the object's
  screen position and the fraction of the frame it covers, and both are asserted.
  "Visible" was never the whole requirement — the easel was perfectly
  unobstructed, it was just a speck floating in empty sky.
- **a scene that quietly stopped building.** `window.__ISLAND_STATS__` reports
  mesh, triangle, light, painted-screen and painted-artwork counts, so a blank
  laptop pane or a missing window light fails a check rather than a screenshot
  review.
- theme persistence, a dark OS preference, and keyboard-only chapter access
- **the hidden things still being there.** The silhouette key, the campfire poke
  and the lantern toggle are each asserted by sampling the colour spread and mean
  brightness of a region before and after — silhouette has to collapse the tone
  count (235 → 56 distinct buckets), poking the fire has to make its corner
  brighter, and snuffing the lantern has to make its corner darker. Clicks are
  aimed with `window.__ISLAND_AT__(name)`, which projects a named object to CSS
  pixels, because the island floats and any hard-coded coordinate is only correct
  until something moves.
- **lists that agree with each other.** The menu sheet has to read `00`–`06` in
  order. It ran `00 02 06 05 01 03 04` for three rounds, because the order was a
  second hand-written list that had drifted from the chapter numbers.
- **the link's own presentation.** The favicon resolving under the project
  subpath, and a `summary_large_image` card at the right dimensions. Both fail
  silently and neither appears in any screenshot of the page — the favicon
  shipped for a while was a scaffold's purple lightning bolt.

114 checks at the time of writing, across desktop and phone, day and night.

```bash
npm run build
python qa/verify.py qa/shots     # writes screenshots + qa/shots/qa-results.json
```

Requirements: a Python environment with `playwright` (plus `playwright install
chromium`) and `pillow`. Chromium is launched with
`--use-angle=swiftshader --enable-unsafe-swiftshader`; without those flags a
headless browser cannot create a WebGL context and only captures the loading
state. `qa/shot.py` is the lighter variant that just captures day/night frames
on desktop and phone.

## Structure

```text
src/
├── App.tsx                    Shell, theme wiring and the loading screen
├── interface/Overlay.tsx      HTML layer: topbar, hero, menu sheet, chapter panels
├── scene/
│   ├── Stage.tsx              The Canvas, lazy-loaded so three.js is off the entry path
│   ├── World.tsx              Lighting, framing tables, entrance, orbit, QA probes
│   ├── Room.tsx               The cabin shell, its windows and everything inside
│   ├── FloatingIsland.tsx     Island body, tree, lantern, campfire, signage
│   ├── islandGeometry.ts      Deterministic island geometry generators
│   ├── screenTexture.ts       Canvas2D screens and painted artwork
│   ├── objectRegistry.ts      Chapter id → group, plus live object measurement
│   ├── motion.ts              One place that reads prefers-reduced-motion
│   ├── stats.ts               Types for the window debug hooks
│   └── InteractiveObject.tsx  Hover, keyboard access and floating labels
├── store/worldStore.ts        Active chapter, theme resolution, silhouette toggle
└── App.css                    Sky gradients, dust, menu sheet, panels, loader
qa/
├── verify.py                  Headless WebGL regression pass
├── share_card.py              Captures public/share-card.png from the real scene
└── shot.py                    Quick day/night screenshots
```

Geometry is intentionally procedural and deterministic — fixed trigonometric
harmonics rather than `Math.random`, so the island is identical on every load and
can be diffed from a screenshot.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages. `vite.config.ts` uses `base: './'` so the
bundle works from a project subpath.

## Credits

Design study of [plantpot.studio](https://www.plantpot.studio) (Akira Haga).
Built by [Lisa](https://lisayinyy.github.io/personal_web/).
