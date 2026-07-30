import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // three.js core is ~725 kB minified and cannot be split further, so the
    // threshold sits just above it: any *new* chunk crossing 500 kB still trips
    // the warning. What this config actually fixes is the entry point — it used
    // to be one 1.23 MB bundle, so nothing at all could paint until three.js had
    // finished downloading. `src/scene/Stage.tsx` is now behind `React.lazy`,
    // leaving a ~17 kB entry that renders the shell and the loading rings
    // immediately.
    chunkSizeWarningLimit: 760,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // Order is load-bearing: a group also absorbs the dependencies of
          // whatever it matches. With `r3f` first, react-three-fiber dragged
          // react *and* three into a single 1.1 MB chunk and the other groups
          // came out empty. Narrow, leaf-most libraries have to be claimed
          // before the packages that depend on them.
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler|use-sync-external-store|zustand)[\\/]/,
            },
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'gsap', test: /node_modules[\\/]gsap[\\/]/ },
            { name: 'r3f', test: /node_modules[\\/](@react-three|three-stdlib)[\\/]/ },
          ],
        },
      },
    },
  },
})
