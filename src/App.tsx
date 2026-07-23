import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { Loader } from '@react-three/drei'
import { Overlay } from './interface/Overlay'
import { World } from './scene/World'
import './App.css'

function App() {
  const [resetKey, setResetKey] = useState(0)

  return (
    <main className="app-shell">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [8.6, 5.8, 9.8], fov: 38, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => document.body.classList.remove('is-interacting')}
      >
        <Suspense fallback={null}>
          <World resetKey={resetKey} />
        </Suspense>
      </Canvas>
      <Overlay onReset={() => setResetKey((value) => value + 1)} />
      <Loader
        containerStyles={{ background: '#e9e6de' }}
        innerStyles={{ width: '180px', background: 'rgba(26, 25, 23, 0.12)' }}
        barStyles={{ height: '3px', background: '#e94e35' }}
        dataStyles={{
          color: '#1a1917',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.08em',
        }}
        dataInterpolation={(progress) => `ENTERING LISA WORLD ${progress.toFixed(0)}%`}
      />
    </main>
  )
}

export default App
