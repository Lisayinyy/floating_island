# 3D project archipelago — 2026-09-13 (second pass)

Status: local build verified in a headless Chromium at desktop and phone sizes. Not yet deployed by this pass; pushing `main` triggers the Pages workflow.

## Implemented

- Two rings: six featured islands with themed models on the inner ring, seventeen archive islands with category models on the outer ring, plus the pink About island. 24 islands, 23 projects.
- Projects sourced from the public GitHub account and reviewed against each README. Five archive projects have verified live GitHub Pages builds (`Live` status, real screenshots as covers, "Open live" link). Entries without a public build show a category tile instead of a fake cover.
- Experience tab replaced the placeholder text with the real timeline and résumé / LinkedIn / GitHub links.
- Outer-ring labels fade out when the camera is farther than 95 units (phone overview) so 24 labels never collide; they return on zoom or selection.
- Legacy room, image-map experience, Zustand store, GSAP, lucide icons, old QA scripts and old screenshots removed. `share-card.png` regenerated from the new scene.

## Browser evidence (`qa/archipelago/`)

- `desktop-overview.png`: 1440 × 1024, both rings, all labels readable, nothing overlapping the intro copy.
- `desktop-archive-detail.png`: Qiaopi Creator (outer ring) selected; easel model, real cover, `Live` badge, Open live / GitHub / Next island actions.
- `desktop-experience.png`: pink island, Experience tab timeline.
- `desktop-index.png`: project index dialog; Finance & Research filter returned exactly the seven finance entries. Escape closed the dialog.
- `mobile-overview.png`: 390 × 844, outer labels hidden, no horizontal overflow.
- `mobile-detail.png`: Voice Prompt selected on a phone; scene above, scrollable detail below.

## Build checks

`tsc -b`, `oxlint` (0 warnings) and `vite build` pass. `qa/sculpture-check.mjs` passes for all 24 islands: 193,774 sculpture triangles; every archive island under 9,000; whole scene 222,808 triangles as measured in the browser. The Three.js large-bundle warning remains.

## Limits

No measured low-end-device frame rate, no touch-hardware pinch test, no public deployment performed in this pass. Category models are shared, so two archive projects in the same category look alike apart from terrain seed. Archive copy is derived from READMEs and should be re-read by Lisa before publishing.
