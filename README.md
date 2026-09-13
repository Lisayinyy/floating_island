# Lisa’s Islands

An explorable 3D project archipelago built with React, React Three Fiber and Three.js.

Live: https://lisayinyy.github.io/floating_island/

The app is fully disconnected from the old room, the illustrated map and the legacy personal site: no Inner World, no `Lisa_web` navigation. Everything a visitor needs (projects, about, experience, résumé links) lives here.

## Layout

- **00 · pink island**: About and Experience. The experience tab is a real timeline (University of Michigan → AI4ALL → GlobeZ → Deloitte → MiraclePlus / ZhenFund → MiniMax), with résumé, LinkedIn and GitHub links.
- **Inner ring, 01–06**: featured projects, each with a hand-built themed model (Voice Prompt, prompt.ai, Claw Cove, Alpine Rush, Ink Translate, Lisa Trading).
- **Outer ring, 07+**: the archipelago. Smaller islands whose model comes from the project category (arcade for interactive, desk for AI products, easel for creative AI, chart board for finance & research). Currently 17 projects pulled from GitHub, so a new one only needs a data entry.

Drag to orbit, scroll/pinch to zoom, click a model or label to fly closer. "All islands" resets the camera. The project index is a filterable native dialog and works without WebGL. Outer-ring labels hide when the camera is far (phone overview) and return as you zoom in.

## Development

```bash
npm install
npm run dev      # http://localhost:4812 if you pass --port 4812
npm run build    # tsc -b && vite build
npm run lint     # oxlint
node --experimental-strip-types qa/sculpture-check.mjs
```

- `src/data/projects.ts`: every project. `featured` decides the ring; `cover` is optional (archive entries without a real screenshot get a category tile); `liveUrl` is only set when the public page was verified to load; `status` is `Live | Beta | Project | In development`.
- `src/data/journey.ts`: career timeline and profile links.
- `src/interface/IslandPortfolio.tsx`: navigation, detail panel, project index.
- `src/scene/ProjectIslands.tsx`: ring placement, camera, ocean, routes and clouds.
- `src/scene/IslandSculptures.ts`: deterministic vertex-colour sculpture builder. One merged mesh per island; featured islands have slug-keyed models, archive islands use `categoryIsland`.
- `public/projects/`: real covers. The five `Live` archive covers are screenshots of the deployed GitHub Pages builds.
- `qa/sculpture-check.mjs`: geometry check for all islands (finite, deterministic, rock base, per-island and total triangle budget).

### Adding a project

1. Add an entry to `src/data/projects.ts` (set `featured: false` for the outer ring).
2. Optional: drop a real screenshot into `public/projects/` and set `cover`.
3. Optional: give it its own model in `buildIsland` and set `featured: true`.

Island positions, numbering, the index and the count in the footer all derive from the data. GitHub is not synced automatically: only reviewed projects with a readable README and a clear public status go in.

## Verification

See `design-qa.md` for the latest browser checks and known limits. `qa/archipelago/` holds the screenshots from that pass.
