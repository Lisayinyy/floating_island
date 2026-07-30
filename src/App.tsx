import { Suspense, lazy, useEffect, useState } from 'react'
import { Overlay } from './interface/Overlay'
import { syncDocumentTheme, useWorldStore, watchSystemTheme } from './store/worldStore'
import './App.css'

/**
 * The renderer lives in its own chunk. Nothing above this line imports three.js,
 * which is what lets the loading screen appear while the scene is still on the
 * wire.
 */
const Stage = lazy(() => import('./scene/Stage'))

/**
 * Full-bleed loading screen: two dotted rings counter-rotating over a flat
 * theme-coloured field. It replaces drei's default progress bar so the very
 * first frame already belongs to this site rather than to a library.
 *
 * The reveal is deliberately not driven by a loading percentage. Every object in
 * this scene is procedural geometry, so three's loading manager may never
 * receive a single item — `progress` sits at 0 forever and the visitor stays
 * trapped behind the rings. Instead the screen lifts once the renderer reports
 * itself created, with a hard cap in case that never arrives either.
 */
function LoadingScreen({ isNight, sceneReady }: { isNight: boolean; sceneReady: boolean }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    const timer = window.setTimeout(() => setDone(true), sceneReady ? 460 : 6000)
    return () => window.clearTimeout(timer)
  }, [done, sceneReady])

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
        <p>ENTERING LISA&apos;S WORLD</p>
      </div>
    </div>
  )
}

function App() {
  const [resetKey, setResetKey] = useState(0)
  const [introComplete, setIntroComplete] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const theme = useWorldStore((state) => state.theme)

  // Follow the operating system until the visitor picks a side themselves.
  useEffect(() => watchSystemTheme(), [])
  // Keep <html data-theme> honest even when the store was seeded by localStorage.
  useEffect(() => syncDocumentTheme(theme), [theme])

  return (
    <main className={`app-shell ${theme === 'night' ? 'is-night' : 'is-day'}`}>
      <Suspense fallback={null}>
        <Stage
          resetKey={resetKey}
          introComplete={introComplete}
          onIntroComplete={() => setIntroComplete(true)}
          onSceneReady={() => setSceneReady(true)}
        />
      </Suspense>
      <Overlay introComplete={introComplete} onReset={() => setResetKey((value) => value + 1)} />
      <LoadingScreen isNight={theme === 'night'} sceneReady={sceneReady} />
    </main>
  )
}

export default App
