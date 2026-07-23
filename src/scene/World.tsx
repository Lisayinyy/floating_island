import { ContactShadows, OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { PerspectiveCamera } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useWorldStore } from '../store/worldStore'
import { Room } from './Room'

function Controls({ resetKey }: { resetKey: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)
  const width = useThree((state) => state.size.width)

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov = width < 700 ? 46 : 38
      camera.updateProjectionMatrix()
    }
    if (width < 700) {
      camera.position.set(10.2, 6.5, 12.6)
    } else {
      camera.position.set(8.6, 5.8, 9.8)
    }
    controlsRef.current?.target.set(width < 700 ? 0.35 : 0, 1.45, -0.8)
    controlsRef.current?.update()
  }, [camera, resetKey, width])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0, 1.45, -0.8]}
      enablePan={false}
      minDistance={8}
      maxDistance={20}
      minPolarAngle={0.82}
      maxPolarAngle={1.42}
      minAzimuthAngle={-0.72}
      maxAzimuthAngle={0.72}
      dampingFactor={0.06}
      enableDamping
    />
  )
}

export function World({ resetKey }: { resetKey: number }) {
  const setActiveItem = useWorldStore((state) => state.setActiveItem)

  return (
    <>
      <color attach="background" args={['#d8d4ca']} />
      <fog attach="fog" args={['#d8d4ca', 19, 32]} />
      <ambientLight intensity={1.15} color="#fff8ea" />
      <hemisphereLight args={['#f7f2e7', '#6e716e', 1.1]} />
      <directionalLight
        castShadow
        position={[-4, 8, 6]}
        intensity={2.4}
        color="#fff2d9"
        shadow-mapSize={[1536, 1536]}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-5}
      />
      <spotLight
        castShadow
        position={[5.5, 6, 2]}
        angle={0.5}
        penumbra={0.9}
        intensity={35}
        distance={18}
        color="#f5ddbb"
      />
      <group
        onClick={(event) => {
          if (event.intersections.length === 0) setActiveItem(null)
        }}
      >
        <Room />
      </group>
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.34}
        scale={15}
        blur={2.8}
        far={7}
        resolution={512}
        color="#4b453e"
      />
      <Controls resetKey={resetKey} />
    </>
  )
}
