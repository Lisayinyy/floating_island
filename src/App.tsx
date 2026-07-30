import { useProgress } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { Overlay } from './interface/Overlay'
import { World } from './scene/World'
import { useWorldStore } from './store/worldStore'
import './App.css'

/**
 * Full-bleed loading screen: two dotted rings counter-rotating over a flat
 * theme-coloured field. It replaces drei's default progress bar so the very
 * first frame already belongs to this site rather than to a library.
 *
 * The reveal cannot be driven by `progress === 100` alone. Every object in this
 * scene is procedural geometry, so three's loading manager may never receive a
 * single item: `total` stays 0 and `progress` stays 0 forever. The screen
 * therefore reveals when nothing is in flight, and a hard cap guarantees the
 * visitor is never trapped behind the rings.
 */
function LoadingScreen({ isNight }: { isNight: boolean }) {
  const { progress, active, total } = useProgress()
  const [done, setDone] = useState(false)
  const settled = !active && (total === 0 || progress >= 100)

  useEffect(() => {
    if (done) return
    // Short beat once settled so the scene has a frame to draw; otherwise a
    // ceiling so a stalled manager still lets the island through.
    const timer = window.setTimeout(() => setDone(true), settled ? 460 : 4000)
    return () => window.clearTimeout(timer)
  }, [done, settled])

  return (
    <div
      className={`loading-screen ${isNight ? 'is-night-loader' : ''} ${done ? 'is-done' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div>
        <div className="loading-rings" aria-hidden="true">
          <span />
          <span />
        </div>
        <p>ENTERING LISA&apos;S WORLD {Math.round(total === 0 ? 100 : progress)}%</p>
      </div>
    </div>
  )
}

function App() {
  const [resetKey, setResetKey] = useState(0)
  const [introComplete, setIntroComplete] = useState(false)
  const theme = useWorldStore((state) => state.theme)

  return (
    <main className={`app-shell ${theme === 'night' ? 'is-night' : 'is-day'}`}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [8.6, 5.4, 11.8], fov: 35, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => document.body.classList.remove('is-interacting')}
      >
        <Suspense fallback={null}>
          <World
            resetKey={resetKey}
            introComplete={introComplete}
            onIntroComplete={() => setIntroComplete(true)}
          />
        </Suspense>
      </Canvas>
      <Overlay introComplete={introComplete} onReset={() => setResetKey((value) => value + 1)} />
      <LoadingScreen isNight={theme === 'night'} />
    </main>
  )
}

export default App
