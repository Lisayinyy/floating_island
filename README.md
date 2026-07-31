# Lisa World

An interactive personal room built with React, Three.js and React Three Fiber.

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
```

The current room uses lightweight geometry as an interaction prototype. Replace
individual objects with optimized GLB assets as the visual direction develops.
