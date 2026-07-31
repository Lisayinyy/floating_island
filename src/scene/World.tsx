import { ContactShadows, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Group, MathUtils, PerspectiveCamera } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useWorldStore } from '../store/worldStore'
import type { WorldItemId } from '../store/worldStore'
import { Room } from './Room'

const focusViews: Record<
  WorldItemId,
  {
    camera: [number, number, number]
    target: [number, number, number]
  }
> = {
  philosophy: {
    camera: [-7.6, 4.7, 7.4],
    target: [-4, 1.25, 0.5],
  },
  about: {
    camera: [-7.8, 5.2, 8],
    target: [-3.85, 2.9, -2.35],
  },
  experience: {
    camera: [-3.4, 5.7, 6.4],
    target: [0.05, 3.55, -2.35],
  },
  toolkit: {
    camera: [7.5, 4.8, 6.8],
    target: [3, 1.75, -1.7],
  },
  work: {
    camera: [5.2, 5.1, 7],
    target: [0.15, 2.42, -1.52],
  },
  art: {
    camera: [8.7, 4.7, 7.5],
    target: [4.85, 1.58, 1.35],
  },
}

function FloatingWorld({
  children,
  isDragging,
}: {
  children: React.ReactNode
  isDragging: boolean
}) {
  const entranceRef = useRef<Group>(null)
  const floatingRef = useRef<Group>(null)
  const entranceProgress = useRef({ value: 0 })
  const motionStrength = useRef(1)
  const pointerTarget = useRef({ x: 0, y: 0 })
  const pointerCurrent = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches

    if (reduceMotion || isTouchDevice) return

    const handlePointerMove = (event: PointerEvent) => {
      pointerTarget.current.x = MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1)
      pointerTarget.current.y = MathUtils.clamp(-(event.clientY / window.innerHeight) * 2 + 1, -1, 1)
    }
    const resetPointer = () => {
      pointerTarget.current.x = 0
      pointerTarget.current.y = 0
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', resetPointer)
    window.addEventListener('blur', resetPointer)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', resetPointer)
      window.removeEventListener('blur', resetPointer)
    }
  }, [])

  useLayoutEffect(() => {
    if (!entranceRef.current) return

    const group = entranceRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      entranceProgress.current.value = 1
      return
    }

    gsap.set(group.position, { y: -0.62 })
    gsap.set(group.scale, { x: 0.82, y: 0.82, z: 0.82 })
    gsap.set(group.rotation, { x: 0.025, y: -0.055, z: -0.012 })

    const entrance = gsap.timeline({ delay: 0.3 })
    entrance
      .to(group.position, { y: 0, duration: 1.45, ease: 'power3.out' }, 0)
      .to(group.scale, { x: 1, y: 1, z: 1, duration: 1.55, ease: 'power3.out' }, 0)
      .to(
        group.rotation,
        { x: 0, y: 0, z: 0, duration: 1.65, ease: 'power3.out' },
        0,
      )
      .to(entranceProgress.current, { value: 1, duration: 1.2, ease: 'sine.inOut' }, 0.35)

    return () => {
      entrance.kill()
    }
  }, [])

  useFrame((state, delta) => {
    if (!floatingRef.current) return

    motionStrength.current = MathUtils.damp(
      motionStrength.current,
      isDragging ? 0.12 : 1,
      isDragging ? 8 : 2.8,
      delta,
    )

    const elapsed = state.clock.elapsedTime
    const strength = entranceProgress.current.value * motionStrength.current
    pointerCurrent.current.x = MathUtils.damp(
      pointerCurrent.current.x,
      pointerTarget.current.x,
      4.8,
      delta,
    )
    pointerCurrent.current.y = MathUtils.damp(
      pointerCurrent.current.y,
      pointerTarget.current.y,
      4.8,
      delta,
    )

    // Keep pointer-follow secondary to OrbitControls: it gives the island a
    // soft spatial response without changing the camera's drag behavior.
    const pointerStrength = strength * (isDragging ? 0.16 : 1)
    floatingRef.current.position.x = pointerCurrent.current.x * 0.075 * pointerStrength
    floatingRef.current.position.y =
      Math.sin(elapsed * 0.52) * 0.095 * strength + pointerCurrent.current.y * 0.105 * pointerStrength
    floatingRef.current.rotation.x =
      Math.sin(elapsed * 0.31 + 0.8) * 0.006 * strength - pointerCurrent.current.y * 0.026 * pointerStrength
    floatingRef.current.rotation.y =
      Math.sin(elapsed * 0.19) * 0.016 * strength + pointerCurrent.current.x * 0.048 * pointerStrength
    floatingRef.current.rotation.z =
      Math.sin(elapsed * 0.27 + 1.7) * 0.007 * strength - pointerCurrent.current.x * 0.012 * pointerStrength
  })

  return (
    <group ref={entranceRef}>
      <group ref={floatingRef}>{children}</group>
    </group>
  )
}

function Controls({
  resetKey,
  introComplete,
  onIntroComplete,
  onDraggingChange,
}: {
  resetKey: number
  introComplete: boolean
  onIntroComplete: () => void
  onDraggingChange: (isDragging: boolean) => void
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const hasPlayedIntro = useRef(false)
  const onIntroCompleteRef = useRef(onIntroComplete)
  const camera = useThree((state) => state.camera)
  const width = useThree((state) => state.size.width)
  const activeItem = useWorldStore((state) => state.activeItem)

  useEffect(() => {
    onIntroCompleteRef.current = onIntroComplete
  }, [onIntroComplete])

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || !controlsRef.current) return

    const controls = controlsRef.current
    const startIntro = window.setTimeout(() => {
      if (hasPlayedIntro.current) return
      hasPlayedIntro.current = true

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const isMobile = window.innerWidth < 700
      const homeCamera: [number, number, number] = isMobile
        ? [21.5, 7.8, 30.5]
        : [15.8, 5.5, 21.8]
      const homeTarget: [number, number, number] = [
        isMobile ? -0.2 : -0.4,
        isMobile ? -1.15 : -1.4,
        -0.4,
      ]

      if (reduceMotion) {
        camera.position.set(...homeCamera)
        controls.target.set(...homeTarget)
        camera.fov = isMobile ? 52 : 39
        camera.updateProjectionMatrix()
        controls.update()
        onIntroCompleteRef.current()
        return
      }

      const introCamera: [number, number, number] = isMobile
        ? [13.4, 7.9, 17.8]
        : [8.3, 5.3, 11.4]
      const introTarget: [number, number, number] = isMobile
        ? [-0.2, 3.1, -0.4]
        : [-0.3, 2.5, -0.45]

      camera.position.set(...introCamera)
      controls.target.set(...introTarget)
      camera.fov = isMobile ? 34 : 35
      camera.updateProjectionMatrix()
      controls.update()

      const timeline = gsap.timeline({
        delay: 0.28,
        onComplete: () => onIntroCompleteRef.current(),
      })

      timeline
        .to(
          camera.position,
          {
            x: introCamera[0] - 0.28,
            y: introCamera[1] + 0.08,
            z: introCamera[2] + 0.34,
            duration: 1.05,
            ease: 'sine.inOut',
            onUpdate: () => controls.update(),
          },
          0,
        )
        .to(
          controls.target,
          {
            x: introTarget[0] - 0.24,
            y: introTarget[1] + 0.1,
            z: introTarget[2],
            duration: 1.05,
            ease: 'sine.inOut',
            onUpdate: () => controls.update(),
          },
          0,
        )
        .to(
          camera.position,
          {
            x: homeCamera[0],
            y: homeCamera[1],
            z: homeCamera[2],
            duration: 2.45,
            ease: 'power3.inOut',
            onUpdate: () => controls.update(),
          },
          1.12,
        )
        .to(
          controls.target,
          {
            x: homeTarget[0],
            y: homeTarget[1],
            z: homeTarget[2],
            duration: 2.35,
            ease: 'power3.inOut',
            onUpdate: () => controls.update(),
          },
          1.12,
        )
        .to(
          camera,
          {
            fov: isMobile ? 52 : 41,
            duration: 2.2,
            ease: 'power2.inOut',
            onUpdate: () => camera.updateProjectionMatrix(),
          },
          1.2,
        )
    }, 0)

    return () => {
      window.clearTimeout(startIntro)
      gsap.killTweensOf(camera)
      gsap.killTweensOf(camera.position)
      gsap.killTweensOf(controls.target)
    }
  }, [camera])

  useEffect(() => {
    if (!introComplete || !(camera instanceof PerspectiveCamera) || !controlsRef.current) return

    const controls = controlsRef.current
    const isMobile = width < 700
    const homeCamera: [number, number, number] = isMobile ? [21.5, 7.8, 30.5] : [15.8, 5.5, 21.8]
    const homeTarget: [number, number, number] = [
      isMobile ? -0.2 : -0.4,
      isMobile ? -1.15 : -1.4,
      -0.4,
    ]
    const view = activeItem ? focusViews[activeItem] : null
    const cameraPosition = view && !isMobile ? view.camera : homeCamera
    const targetPosition = view && !isMobile ? view.target : homeTarget

    camera.fov = isMobile ? 52 : activeItem ? 33 : 39
    camera.updateProjectionMatrix()

    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)

    const cameraTween = gsap.to(camera.position, {
      x: cameraPosition[0],
      y: cameraPosition[1],
      z: cameraPosition[2],
      duration: 1.05,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    })
    const targetTween = gsap.to(controls.target, {
      x: targetPosition[0],
      y: targetPosition[1],
      z: targetPosition[2],
      duration: 0.95,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    })

    return () => {
      cameraTween.kill()
      targetTween.kill()
    }
  }, [activeItem, camera, introComplete, resetKey, width])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={introComplete}
      target={[0, 0.75, -0.55]}
      enablePan={false}
      minDistance={10}
      maxDistance={Infinity}
      minPolarAngle={0.72}
      maxPolarAngle={1.35}
      minAzimuthAngle={-Math.PI / 4}
      maxAzimuthAngle={Math.PI / 4}
      rotateSpeed={0.82}
      dampingFactor={0.05}
      enableDamping
      onStart={() => {
        document.body.classList.add('is-dragging')
        onDraggingChange(true)
      }}
      onEnd={() => {
        document.body.classList.remove('is-dragging')
        onDraggingChange(false)
      }}
    />
  )
}

export function World({
  resetKey,
  introComplete,
  onIntroComplete,
}: {
  resetKey: number
  introComplete: boolean
  onIntroComplete: () => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const setActiveItem = useWorldStore((state) => state.setActiveItem)
  const theme = useWorldStore((state) => state.theme)
  const isNight = theme === 'night'

  useEffect(
    () => () => {
      document.body.classList.remove('is-dragging')
    },
    [],
  )

  return (
    <>
      {isNight && <color attach="background" args={['#151822']} />}
      <fog attach="fog" args={[isNight ? '#17111d' : '#f1eeee', 90, 900]} />
      <ambientLight intensity={isNight ? 0.42 : 0.92} color={isNight ? '#c9b9d5' : '#fff0eb'} />
      <hemisphereLight
        args={[
          isNight ? '#514868' : '#f3dfe6',
          isNight ? '#100c16' : '#5f4b58',
          isNight ? 0.56 : 1.15,
        ]}
      />
      <directionalLight
        castShadow
        position={[-5, 10, 7]}
        intensity={isNight ? 0.64 : 1.8}
        color={isNight ? '#aaa0d5' : '#ffe6dc'}
        shadow-mapSize={[1536, 1536]}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-9}
      />
      <spotLight
        castShadow
        position={[5.5, 6, 2]}
        angle={0.5}
        penumbra={0.9}
        intensity={isNight ? 28 : 24}
        distance={18}
        color={isNight ? '#ffc38c' : '#f5d0c8'}
      />
      {isNight && (
        <>
          <Stars radius={68} depth={42} count={3600} factor={3.4} saturation={0.2} speed={0.18} />
          <Sparkles
            count={240}
            position={[0, 7, -7]}
            scale={[30, 18, 15]}
            size={1.65}
            speed={0.07}
            opacity={0.88}
            color="#fff1c6"
          />
        </>
      )}
      {isNight && (
        <pointLight
          castShadow
          position={[-1.1, 3.2, -0.75]}
          intensity={18}
          distance={7}
          decay={2}
          color="#ffc27d"
        />
      )}
      <Sparkles
        count={isNight ? 72 : 32}
        scale={[21, 12, 18]}
        size={isNight ? 2.2 : 1.2}
        speed={0.18}
        opacity={isNight ? 0.72 : 0.32}
        color={isNight ? '#f2d9e6' : '#fff7f3'}
      />
      <FloatingWorld isDragging={isDragging}>
        <group
          onClick={(event) => {
            if (event.intersections.length === 0) setActiveItem(null)
          }}
        >
          <Room />
        </group>
        {isNight && (
          <>
            <Sparkles
              count={38}
              position={[0, 2.15, 0.2]}
              scale={[12.5, 4.5, 9.5]}
              size={3.1}
              speed={0.42}
              opacity={0.86}
              color="#ffdfa0"
            />
            <Sparkles
              count={16}
              position={[-2.2, 5.7, -2.4]}
              scale={[10, 4.4, 4.8]}
              size={2.1}
              speed={0.3}
              opacity={0.62}
              color="#ffe9bc"
            />
          </>
        )}
      </FloatingWorld>
      <ContactShadows
        position={[0, 0.54, 0]}
        opacity={isNight ? 0.42 : 0.26}
        scale={11}
        blur={3.2}
        far={5}
        resolution={512}
        color={isNight ? '#0c0910' : '#4b3845'}
      />
      <Controls
        resetKey={resetKey}
        introComplete={introComplete}
        onIntroComplete={onIntroComplete}
        onDraggingChange={setIsDragging}
      />
    </>
  )
}
