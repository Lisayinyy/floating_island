# Lisa World

An interactive personal room built with React, Three.js and React Three Fiber.
Every object on the floating island opens a chapter.

Live: https://lisayinyy.github.io/floating_island/

## Development

```bash
npm install
npm run dev
```

## Structure

```text
src/
├── interface/   HTML interface layered above the 3D canvas
├── scene/       Room, camera controls and interactive objects
├── store/       Shared world interaction state
└── App.tsx      Canvas and application shell
qa/              Browser checks and the share card generator
```

The current room uses lightweight geometry as an interaction prototype. Replace
individual objects with optimized GLB assets as the visual direction develops.

## Design notes

- **Chapter framing is derived, not hand-placed on phones.** The panel owns the
  bottom of a small screen, so the orbit target is shifted along the camera's own
  screen-up axis by a fraction of the view height. Shifting along world Y instead
  gets compressed differently for every chapter, because each is viewed from a
  different elevation.
- **A label is interface, not scenery.** No `distanceFactor`, so it keeps one
  readable size however far the camera is, and it stays up while its chapter is
  open — which is the only way a touch device ever sees it.
- **The lamp's two jobs are two lights.** A shadowed point light is a cube shadow
  map: six full-scene passes every frame. An unshadowed point light for the glow
  plus one downward shadowed spot light keeps the look for one pass.
- **Fonts are self-hosted and declared in `index.html`.** A pending
  `<link rel=stylesheet>` — or worse, an `@import` inside CSS — delays the page's
  own scripts. Measured here: DOMContentLoaded 290ms → 41ms. Vite also cannot
  rewrite `public/` URLs found inside bundled CSS when `base` is `'./'`.
- **The theme is written before the first paint.** An inline bootstrap in
  `index.html` sets `data-theme`, which the store reads back, so a remembered
  night mode never flashes the day gradient.

## Checks

```bash
npm run build
../.venv-playwright/bin/python qa/verify.py qa/shots 4801
```

57 assertions across desktop and mobile: menu order, chapter framing measured
against the panel's real rectangle, panel paint, Escape, theme persistence
across a reload, and no third-party requests. The scene publishes
`window.__LW_FLIGHT__` (`{flying, count}`) and `window.__LW_AT__(id)` so the
checks can wait for a real flight to land and ask where an object actually
ended up, instead of sleeping and guessing.

```bash
../.venv-playwright/bin/python qa/share_card.py 4811
```

Regenerates `public/share-card.png` from the live scene and prints the first
paint timings.
