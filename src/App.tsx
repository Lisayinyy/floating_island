import { Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { Overlay } from './interface/Overlay'
import { World } from './scene/World'
import { useWorldStore } from './store/worldStore'
import './App.css'

function App() {
  const [resetKey, setResetKey] = useState(0)
  const [introComplete, setIntroComplete] = useState(false)
  const theme = useWorldStore((state) => state.theme)

  return (
    <main className={`app-shell ${theme === 'night' ? 'is-night' : 'is-day'}`}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [15.2, 5.4, 20.8], fov: 39, near: 0.1, far: 100 }}
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
      <Loader
        containerStyles={{ background: '#c9b7bf' }}
        innerStyles={{ width: '180px', background: 'rgba(40, 29, 36, 0.12)' }}
        barStyles={{ height: '3px', background: '#d46987' }}
        dataStyles={{
          color: '#2d222a',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.08em',
        }}
        dataInterpolation={(progress) => `ENTERING LISA'S WORLD ${progress.toFixed(0)}%`}
      />
    </main>
  )
}

export default App
