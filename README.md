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
  lantern and desk lamp become the only real light sources, and the sky turns
  navy-into-teal with stars and drifting embers.
- **Cinematic entrance.** The camera starts close on the cabin and pulls back to
  the home framing, then the island keeps a slow idle float that also reacts to
  the pointer.
- **Respects the visitor.** `prefers-reduced-motion` skips the entrance and the
  float, orbit angles are clamped so the scene can never be turned inside out,
  and the layout has a dedicated phone framing.

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
| Custom loading screen | Two counter-rotating dotted rings with a mono progress line |

Where it deliberately differs: plantpot's island is a near-black silhouette,
which works because its home page carries no content. This island has six
clickable objects, so the interior stays lit and legible while the exterior mass
carries the silhouette.

## Development

```bash
npm install
npm run dev      # vite dev server
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Visual regression pass

The scene has no DOM to assert against, so QA renders it in headless Chromium
with software WebGL and checks the failures that have actually happened before:
the entrance never finishing, the loading screen never lifting (procedural
scenes never report `progress === 100`), a canvas that draws nothing but sky,
and a menu or chapter panel that will not open.

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
├── App.tsx                    Canvas, shell and the loading screen
├── interface/Overlay.tsx      HTML layer: topbar, hero, menu sheet, chapter panels
├── scene/
│   ├── World.tsx              Lighting, framing tables, entrance and orbit controls
│   ├── Room.tsx               The cabin shell and everything inside it
│   ├── FloatingIsland.tsx     Island body, tree, lantern, campfire, signage
│   ├── islandGeometry.ts      Deterministic island geometry generators
│   └── InteractiveObject.tsx  Hover/click behaviour and floating labels
├── store/worldStore.ts        Active chapter + theme
└── App.css                    Sky gradients, dust, menu sheet, panels, loader
qa/
├── verify.py                  Headless WebGL regression pass
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
