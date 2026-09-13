# Lisa’s Islands

An explorable 3D archipelago built with React, React Three Fiber and Three.js. Six islands: a pink About island in the middle and five family islands around it, each holding every project of that kind.

Live: https://lisayinyy.github.io/floating_island/

The app is fully disconnected from the old room, the illustrated map and the legacy personal site: no Inner World, no `Lisa_web` navigation. Projects, about, experience and résumé links all live here.

## Islands

| # | Island | Model | Holds |
| --- | --- | --- | --- |
| 00 | About Lisa | pink studio + cherry tree | About me, Experience timeline, résumé / LinkedIn / GitHub |
| 01 | AI Toolkits | cabin + microphone | Voice Prompt, prompt.ai, Skills Master, Xiaohongshu Monitor, Web Summary Assistant, Threadly, VoiceMeeting, Video Quote Cards, vibe.ai, Influencer Management System |
| 02 | 3D & Games | claw machine + arcade + palms | Claw Cove, Alpine Rush, Forbidden City Voxel, 3D Letter Gallery, Labubu Garden, Live Spider Suit, this site |
| 03 | Fintech | columned research terrace | Lisa Trading, Monkey AI, A-share pre-market scan, A-stock quick scan, Quant Jargon Compiler, LLM Investor Graph, Serenity skills |
| 04 | Taste | pavilion + easel | Wu Guanzhong Ink, Qiaopi Creator, Life K-Line, Reading Case, Xiaoju’s Wardrobe, MiLastBite design, BLICK accessibility |
| 05 | Data Science | alpine peaks + chart board | Collision Warning (YOLO), Sentiment SVM, CNN classification, K-Means |

Click an island (or its label) to fly to it. The panel lists that island's projects; each row expands to the story, cover, tags and links. The project index (dialog) lists all 35 across islands, filterable, and works without WebGL. Selecting a project there flies to its island with that row open.

## Development

```bash
npm install
npm run dev -- --port 4812
npm run build    # tsc -b && vite build
npm run lint     # oxlint
node --experimental-strip-types qa/sculpture-check.mjs
```

- `src/data/projects.ts`: `islands` (order = ring order) and `projects`. A project needs `island`, `status` (`Live | Beta | Project | In development | Internal | Design`), `tags`; `cover`, `repoUrl`, `liveUrl` and the three story fields are optional. `liveUrl` is only set when the URL was verified to load.
- `src/data/journey.ts`: career timeline and profile links.
- `src/interface/IslandPortfolio.tsx`: navigation, island panel with expandable project rows, project index.
- `src/scene/ProjectIslands.tsx`: ring placement, radial fly-in camera, ocean, routes, clouds.
- `src/scene/IslandSculptures.ts`: deterministic vertex-colour sculpture builder, one merged mesh per island, models keyed by island id.
- `public/projects/`: real covers only (screenshots, product art, design boards).
- `qa/sculpture-check.mjs`: geometry check for the six islands.

### Adding a project

Add an entry to `src/data/projects.ts` with the right `island`. Optionally drop a real screenshot into `public/projects/`. Nothing else changes: the island panel, index, counts and filters derive from the data. Adding a whole new family means one `islands` entry plus a model branch in `buildIsland`.

## Verification

See `design-qa.md` for the latest browser checks and known limits. `qa/archipelago/` holds the screenshots from that pass.
