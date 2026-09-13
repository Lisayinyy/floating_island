# Six-island archipelago — 2026-09-14

Status: local build verified in a headless Chromium at desktop and phone sizes. Not deployed by this pass; pushing `main` triggers the Pages workflow.

## Implemented

- Layout reduced from 24 project islands to 6: About in the middle, five family islands (AI Toolkits, 3D & Games, Fintech, Taste, Data Science) on one ring. Each island's panel lists its projects as expandable rows.
- 35 projects: everything from the old `Lisa_web` projects section (Skills Master, Xiaohongshu Monitor, PromptAI, Web Summary Assistant, Influencer Management System, MonkeyAI, vibe.ai, MiLastBite, BLICK, Collision Warning, Sentiment SVM, CNN, K-Means), the 23 GitHub projects from the previous pass, Xiaoju’s Wardrobe (local WeChat mini-program teaching case) and this site.
- External links verified with HTTP 200: prompt-ai.work, skills-master.space, the ClawHub skill page, all GitHub Pages builds. Four old-site repo links (web_summary_assistant, Car-Collision-Warning-System, SentimentAnalysis_SVM, K-Means_Clustering) return 404 and are left without a repo link.
- Fly-in camera approaches each island radially from outside the ring, so a neighbour's tree never sits between camera and target.
- Project index selection flies to the island and opens that project's row.

## Browser evidence (`qa/archipelago/`)

- `desktop-overview.png`: 1440 × 1024, six islands, 35 projects in the footer count.
- `desktop-fintech-project.png`: Fintech island with Quant Jargon Compiler expanded.
- `desktop-experience.png`: pink island, Experience timeline.
- `desktop-index.png`: project index dialog; selecting Collision Warning from it opened the Data Science island with that row expanded, dialog closed.
- `mobile-overview.png`, `mobile-island.png`: 390 × 844, no horizontal overflow, panel scrolls the opened row into view.

## Build checks

`tsc -b`, `oxlint` (0 warnings) and `vite build` pass. `qa/sculpture-check.mjs` passes for six islands: 115,538 sculpture triangles; whole scene 144,428 as measured in the browser. The Three.js large-bundle warning remains.

## Limits

No measured low-end-device frame rate and no touch-hardware pinch test. Old-site project copy was carried over as written; new copy for the GitHub projects is derived from READMEs and should be re-read before publishing. Xiaoju’s Wardrobe has no public link yet.
