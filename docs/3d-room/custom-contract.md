# Lisa's project archipelago — custom outdoor prototype

## Scope and status

Requested on 2026-09-13: replace the illustrated category map with actual explorable 3D project islands. Disconnect the running site from Inner World and Lisa_web. No deployment is authorized by this implementation step.

Build 3D Game Rooms custom adapter used. This is a local procedural interaction prototype, not an approved final room package. Function, Form, and Runtime human gates remain pending. No Meshy calls, generated meshes, purchases, texture-tier exports, or GLB exports were made.

## Function

- Hero: pink personal island at [0, 0.5, 0], with blossom tree, bench, books and portrait frame; its reserved envelope is 6.2 × 7 × 6.2 meters.
- Six project islands around a 10-meter-radius ring. Each top is a closed 6.16-meter faceted cylinder, supported by a thick tapered closed underside.
- Themes: microphone / prompt workstation / claw machine / alpine peaks / ink pavilion / research screen. Themes are keyed by project slug, not array index.
- Each new project receives a destination and ring position from the data source. New themes should be explicitly designed; unrecognized projects currently use a workstation fallback.
- No avatar or walkable route. Circulation means camera orbit, zoom, pan and destination selection. The 3.84-meter minimum gap between neighboring platforms is intentional open sky, not a traversable bridge.
- Production desktop camera: [19,23,29], target [0,0,0], 39-degree vertical FOV. Narrow view multiplies distance by 1.65. Detail cameras target the selected island; phone reserves a separate area above the scrollable details.
- Orbit starts cancel camera flight; click motion over five pixels does not select. Escape exits detail or the native project-index dialog. Reduced motion disables bobbing and snaps camera flights.

## Form and collision

This is an outdoor, floating-space exception: no enclosing shell, ceiling, doorway, player collision body, or lightmap. Geometric surfaces are independently closed primitives. Floor-plan/ceiling/door-opening indoor validation is not silently counted as passed. Pavilion is intentionally open on all sides. Scene support and proportions were visually reviewed in the browser; manifold unions and export topology have not been certified.

Current geometry has a stylized toy scale; project models represent the project, not architectural survey dimensions. Platforms remain solid; no background image substitutes for 3D scenery. Project-cover images exist only in HTML detail cards.

## Runtime and budget

Target: 150,000 triangles, one shadow-casting light, device pixel ratio capped at 1.6, no 3D texture downloads, zero paid-generation credits. These are targets, not measured performance certification. Geometry and materials are generated in React Three Fiber. Browser readiness is scene mount plus verified visible rendering; production device frame-rate testing remains pending.

Evidence from repository root: qa/archipelago/3d-desktop-overview.png, qa/archipelago/3d-claw-detail.png, qa/archipelago/3d-mobile-about.png.

## Gate exceptions and next review

The supplied validator requires Meshy pricing/positive credit allocation and indoor room artifacts even for this zero-credit outdoor procedural case. Its failure is retained, not bypassed or rewritten. Human layout/form/runtime approval also remains absent. Review the live prototype first; if proceeding to final exported assets, fulfill the plugin's complete artifact and human-review gates before export/deployment.
