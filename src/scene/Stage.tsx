import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { World } from './World'

/**
 * The WebGL half of the site, isolated behind a dynamic import.
 *
 * three.js plus react-three-fiber is over a megabyte, and while it downloaded
 * nothing at all was on screen — not even the loading rings, because they lived
 * in the same bundle. Keeping the canvas in its own chunk lets the shell paint
 * from a small entry file and turns that wait into an intentional beat instead
 * of a white page.
 */
export default function Stage({
  resetKey,
  introComplete,
  onIntroComplete,
  onSceneReady,
}: {
  resetKey: number
  introComplete: boolean
  onIntroComplete: () => void
  onSceneReady: () => void
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [8.6, 5.4, 11.8], fov: 35, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={onSceneReady}
      onPointerMissed={() => document.body.classList.remove('is-interacting')}
    >
      <Suspense fallback={null}>
        <World
          resetKey={resetKey}
          introComplete={introComplete}
          onIntroComplete={onIntroComplete}
        />
      </Suspense>
    </Canvas>
  )
}
