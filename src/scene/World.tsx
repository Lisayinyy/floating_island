import { ContactShadows, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Group, MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useWorldStore } from '../store/worldStore'
import type { WorldItemId } from '../store/worldStore'
import { objectGroups } from './InteractiveObject'
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
    camera: [6.7, 4.7, 6.45],
    target: [1.95, 1.52, -0.2],
  },
  work: {
    camera: [5.2, 5.1, 7],
    target: [0.15, 2.42, -1.52],
  },
  art: {
    camera: [8.55, 4.65, 7.45],
    target: [4.45, 1.48, 1.62],
  },
}

type Framing = {
  camera: [number, number, number]
  target: [number, number, number]
  fov: number
}

// On a phone the content panel owns the bottom of the screen, so a chapter
// framed dead centre lands behind it. Pull the camera back a little and drop the
// orbit target along the camera's own screen-up axis, which lifts the object
// into the free band at the top by an exact fraction of the view height. Using
// world Y instead would be compressed differently for every chapter, because
// each one is viewed from a different elevation.
const MOBILE_FOCUS_PULLBACK = 1.16
const MOBILE_FOCUS_LIFT = 0.5

const homeFramings: Record<'desktop' | 'mobile', Framing> = {
  desktop: { camera: [15.8, 5.5, 21.8], target: [-0.4, -1.4, -0.4], fov: 39 },
  mobile: { camera: [21.5, 7.8, 30.5], target: [-0.2, -1.15, -0.4], fov: 52 },
}

const introFramings: Record<'desktop' | 'mobile', Framing> = {
  desktop: { camera: [8.3, 5.3, 11.4], target: [-0.3, 2.5, -0.45], fov: 35 },
  mobile: { camera: [13.4, 7.9, 17.8], target: [-0.2, 3.1, -0.4], fov: 34 },
}

const FOCUS_FOV = { desktop: 33, mobile: 46 }

function toTriple(vector: Vector3): [number, number, number] {
  return [vector.x, vector.y, vector.z]
}

function homeFraming(isMobile: boolean): Framing {
  return homeFramings[isMobile ? 'mobile' : 'desktop']
}

function introFraming(isMobile: boolean): Framing {
  return introFramings[isMobile ? 'mobile' : 'desktop']
}

function framingFor(item: WorldItemId | null, isMobile: boolean): Framing {
  if (!item) return homeFraming(isMobile)

  const view = focusViews[item]
  const fov = isMobile ? FOCUS_FOV.mobile : FOCUS_FOV.desktop

  if (!isMobile) return { camera: view.camera, target: view.target, fov }

  const object = new Vector3(...view.target)
  const offset = new Vector3(...view.camera).sub(object)
  const distance = offset.length() * MOBILE_FOCUS_PULLBACK
  const forward = offset.clone().normalize()
  const camera = object.clone().add(forward.clone().multiplyScalar(distance))
  // The camera's screen-up axis, so the shift below is a pure vertical move on
  // screen no matter how steeply this chapter is viewed from.
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize()
  const up = new Vector3().crossVectors(right, forward).normalize()
  const halfHeight = Math.tan((fov * Math.PI) / 360) * distance
  const target = object.clone().addScaledVector(up, -halfHeight * MOBILE_FOCUS_LIFT)

  return { camera: toTriple(camera), target: toTriple(target), fov }
}

// Only the scene knows whether the camera is still moving, so it publishes it.
// A fixed sleep is not a substitute: under software rendering a 1s tween can
// take several seconds of wall clock.
type FlightState = { flying: boolean; count: number }

function flight(): FlightState {
  const globals = window as unknown as { __LW_FLIGHT__?: FlightState }
  if (!globals.__LW_FLIGHT__) globals.__LW_FLIGHT__ = { flying: false, count: 0 }
  return globals.__LW_FLIGHT__
}

function flightStarted() {
  flight().flying = true
}

function flightEnded() {
  const state = flight()
  state.flying = false
  state.count += 1
}

function SceneProbe() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useEffect(() => {
    const probe = (id: string) => {
      const group = objectGroups.get(id as WorldItemId)
      if (!group) return null
      const point = group.getWorldPosition(new Vector3())
      point.project(camera)
      return {
        x: ((point.x + 1) / 2) * size.width,
        y: ((1 - point.y) / 2) * size.height,
        width: size.width,
        height: size.height,
      }
    }

    const globals = window as unknown as Record<string, unknown>
    globals.__LW_AT__ = probe
    return () => {
      delete globals.__LW_AT__
    }
  }, [camera, size])

  return null
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
      const home = homeFraming(isMobile)
      const homeCamera = home.camera
      const homeTarget = home.target

      if (reduceMotion) {
        camera.position.set(...homeCamera)
        controls.target.set(...homeTarget)
        camera.fov = home.fov
        camera.updateProjectionMatrix()
        controls.update()
        flightEnded()
        onIntroCompleteRef.current()
        return
      }

      const intro = introFraming(isMobile)
      const introCamera = intro.camera
      const introTarget = intro.target

      camera.position.set(...introCamera)
      controls.target.set(...introTarget)
      camera.fov = intro.fov
      camera.updateProjectionMatrix()
      controls.update()

      flightStarted()
      const timeline = gsap.timeline({
        delay: 0.28,
        onComplete: () => {
          flightEnded()
          onIntroCompleteRef.current()
        },
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
            fov: home.fov,
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
    const view = framingFor(activeItem, isMobile)

    gsap.killTweensOf(camera.position)
    gsap.killTweensOf(controls.target)
    gsap.killTweensOf(camera)

    // A cut, not a flight: gsap's duration 0 never fires onUpdate, so the
    // controls would keep the old target and the camera would drift back.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      camera.position.set(...view.camera)
      controls.target.set(...view.target)
      camera.fov = view.fov
      camera.updateProjectionMatrix()
      controls.update()
      flightEnded()
      return
    }

    flightStarted()

    const cameraTween = gsap.to(camera.position, {
      x: view.camera[0],
      y: view.camera[1],
      z: view.camera[2],
      duration: 1.05,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
      onComplete: flightEnded,
    })
    const targetTween = gsap.to(controls.target, {
      x: view.target[0],
      y: view.target[1],
      z: view.target[2],
      duration: 0.95,
      ease: 'power3.inOut',
      onUpdate: () => controls.update(),
    })
    const fovTween = gsap.to(camera, {
      fov: view.fov,
      duration: 1.05,
      ease: 'power2.inOut',
      onUpdate: () => camera.updateProjectionMatrix(),
    })

    return () => {
      cameraTween.kill()
      targetTween.kill()
      fovTween.kill()
    }
  }, [activeItem, camera, introComplete, resetKey, width])

  const isMobile = width < 700

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={introComplete}
      target={[0, 0.75, -0.55]}
      enablePan={false}
      minDistance={10}
      // Home already sits at ~28 (desktop) and ~39 (mobile) units out; anything
      // looser than this let the wheel shrink the island to a speck.
      maxDistance={isMobile ? 46 : 36}
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
      <fog attach="fog" args={[isNight ? '#17111d' : '#f5eff2', 90, 900]} />
      <ambientLight intensity={isNight ? 0.42 : 0.98} color={isNight ? '#c9b9d5' : '#fff5ef'} />
      <hemisphereLight
        args={[
          isNight ? '#514868' : '#f0e7ef',
          isNight ? '#100c16' : '#75616d',
          isNight ? 0.56 : 1.05,
        ]}
      />
      <directionalLight
        castShadow
        position={[-5, 10, 7]}
        intensity={isNight ? 0.64 : 1.55}
        color={isNight ? '#aaa0d5' : '#fff0e9'}
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
        <>
          {/* A point light's shadow is a cube map: six full-scene passes every
              frame. Splitting the lamp's two jobs — glow everywhere, shadow
              downward — keeps the look and costs one pass. */}
          <pointLight
            position={[-1.1, 3.2, -0.75]}
            intensity={17}
            distance={7}
            decay={2}
            color="#ffc27d"
          />
          <spotLight
            castShadow
            position={[-1.1, 3.3, -0.75]}
            target-position={[-1.1, 0, -0.75]}
            angle={1.02}
            penumbra={0.92}
            intensity={9}
            distance={7.5}
            decay={2}
            color="#ffc27d"
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.4}
            shadow-camera-far={8}
          />
        </>
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
        opacity={isNight ? 0.42 : 0.19}
        scale={11}
        blur={3.8}
        far={5}
        resolution={512}
        color={isNight ? '#0c0910' : '#6b5866'}
      />
      <SceneProbe />
      <Controls
        resetKey={resetKey}
        introComplete={introComplete}
        onIntroComplete={onIntroComplete}
        onDraggingChange={setIsDragging}
      />
    </>
  )
}
