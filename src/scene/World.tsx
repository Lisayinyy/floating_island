import { ContactShadows, OrbitControls, Sparkles, Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box3, Group, MathUtils, PerspectiveCamera, Raycaster, Vector3 } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useWorldStore } from '../store/worldStore'
import type { Light, Mesh, MeshStandardMaterial, Object3D } from 'three'
import type { WorldItemId } from '../store/worldStore'
import { getWorldObject, measureWorldObject } from './objectRegistry'
import type { WorldObjectMeasure } from './objectRegistry'
import { Room } from './Room'
import './stats'

/**
 * Publish what the renderer actually built, plus a probe that answers "can the
 * camera currently see the object this chapter is about?".
 *
 * A screenshot proves "something drew"; it cannot tell a painted laptop screen
 * from a blank plane, and it certainly cannot tell that the cabin roof is
 * between the camera and the graduation cap. Both of those shipped at some point
 * and both are now assertable from `qa/verify.py`.
 */
function SceneProbes() {
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const theme = useWorldStore((state) => state.theme)

  useEffect(() => {
    const raycaster = new Raycaster()
    const centre = new Vector3()
    const direction = new Vector3()
    const box = new Box3()

    const isDescendantOf = (object: Object3D, ancestor: Group) => {
      for (let node: Object3D | null = object; node; node = node.parent) {
        if (node === ancestor) return true
      }
      return false
    }

    /**
     * Sample points on the object, not just its bounding-box centre. The photo
     * wall is four frames with air between them, so a single centre ray sailed
     * straight through the gap and hit the wall behind — a false report of
     * "occluded" for an object that was perfectly visible.
     */
    const samplePoints = (group: Group) => {
      const points: Vector3[] = [box.setFromObject(group).getCenter(new Vector3())]
      group.traverse((object) => {
        if (points.length >= 14) return
        const mesh = object as Mesh
        if (!mesh.isMesh || !mesh.geometry) return
        mesh.geometry.computeBoundingBox()
        const local = mesh.geometry.boundingBox?.getCenter(new Vector3())
        if (local) points.push(mesh.localToWorld(local))
      })
      return points
    }

    window.__ISLAND_PROBE__ = (id: WorldItemId) => {
      const group = getWorldObject(id)
      if (!group) return null

      const points = samplePoints(group)
      let seen = 0
      let blockedBy: string | null = null

      for (const point of points) {
        direction.copy(point).sub(camera.position).normalize()
        raycaster.set(camera.position, direction)
        const hit = raycaster
          .intersectObject(scene, true)
          .find(
            (intersection) =>
              (intersection.object as Mesh).isMesh && intersection.object.visible,
          )
        if (hit && isDescendantOf(hit.object, group)) seen += 1
        else if (hit && !blockedBy) {
          // Report where the blocker is, not just that it exists: these meshes
          // are anonymous primitives, so a position is the only usable clue.
          const at = hit.object.getWorldPosition(new Vector3())
          blockedBy = `${hit.object.name || hit.object.type} @ ${at.x.toFixed(2)},${at.y.toFixed(2)},${at.z.toFixed(2)}`
        }
      }

      box.setFromObject(group).getCenter(centre)
      const ndc = centre.clone().project(camera)

      // Screen size from the projected corners rather than the analytic
      // `radius / distance` form: the bounding sphere of a wide flat object like
      // the photo wall is much larger than the object reads on screen, and it is
      // the on-screen reading we care about.
      let minY = Infinity
      let maxY = -Infinity
      for (let i = 0; i < 8; i += 1) {
        const corner = new Vector3(
          i & 1 ? box.max.x : box.min.x,
          i & 2 ? box.max.y : box.min.y,
          i & 4 ? box.max.z : box.min.z,
        ).project(camera)
        minY = Math.min(minY, corner.y)
        maxY = Math.max(maxY, corner.y)
      }

      return {
        visibleRatio: Number((seen / points.length).toFixed(3)),
        samples: points.length,
        blockedBy,
        ndc: { x: Number(ndc.x.toFixed(3)), y: Number(ndc.y.toFixed(3)) },
        // NDC spans -1..1, so a full-height object spans 2.
        fill: Number(((maxY - minY) / 2).toFixed(3)),
      }
    }

    return () => {
      delete window.__ISLAND_PROBE__
    }
  }, [scene, camera])

  useEffect(() => {
    // A beat, so conditional night-only lights and shadows have mounted.
    const timer = window.setTimeout(() => {
      let meshes = 0
      let triangles = 0
      let lights = 0
      let screens = 0
      let artworks = 0

      scene.traverse((object) => {
        if ((object as Light).isLight) lights += 1
        const mesh = object as Mesh
        if (!mesh.isMesh || !mesh.geometry) return
        meshes += 1
        const index = mesh.geometry.index
        const position = mesh.geometry.getAttribute('position')
        if (index) triangles += index.count / 3
        else if (position) triangles += position.count / 3
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        const textureName = materials
          .map((material) => (material as MeshStandardMaterial).map?.name)
          .find((name) => name)
        if (textureName?.startsWith('screen:')) screens += 1
        if (textureName?.startsWith('art:')) artworks += 1
      })

      window.__ISLAND_STATS__ = {
        meshes,
        triangles: Math.round(triangles),
        lights,
        screens,
        artworks,
        theme,
      }
    }, 450)

    return () => window.clearTimeout(timer)
  }, [scene, theme])

  return null
}

/**
 * How a chapter is framed.
 *
 * Nothing here is a world coordinate. Chapter aim points used to be a
 * hand-written table, and it drifted from the scene twice: adding the cabin roof
 * put several cameras inside a wall, and the easel's aim point ended up 1.85
 * units off the easel, so its chapter showed a small object adrift in empty sky.
 * The object is now measured live from `objectRegistry`, and everything below is
 * expressed relative to the frame instead:
 *
 * - `fill` — how much of the frame height the object's bounding sphere should
 *   cover, so a graduation cap and a photo wall read at a comparable size.
 * - `ndcX`/`ndcY` — where the object should sit on screen. On desktop the
 *   content panel is docked right, so the object is placed left of centre; on a
 *   phone the panel is docked bottom, so the object is lifted into the top half.
 * - the distance clamps keep the camera out of the furniture for tiny objects
 *   and stop it retreating to orbit for big ones.
 */
type FocusFrame = {
  fov: number
  fill: number
  ndcX: number
  ndcY: number
  minDistance: number
  maxDistance: number
}

const focusFraming: Record<'desktop' | 'mobile', FocusFrame> = {
  // The floor on distance is what keeps the camera outside the cabin shell; it
  // used to be 9.5, which was high enough to clamp *every* chapter and so made
  // `fill` inert — the graduation cap covered 15% of the frame while the easel
  // covered 41%. It is a deliberate floor rather than a formality: the smallest
  // objects would need to be viewed from under 4 units to reach `fill`, which
  // puts the camera inside the cabin and crops away the shelf that gives the cap
  // its context. So the two small objects still clamp, they just clamp closer.
  desktop: { fov: 34, fill: 0.46, ndcX: -0.36, ndcY: 0.0, minDistance: 6.2, maxDistance: 17 },
  mobile: { fov: 42, fill: 0.5, ndcX: 0.0, ndcY: 0.3, minDistance: 6.6, maxDistance: 19 },
}

const UP = new Vector3(0, 1, 0)

function focusViewFor(
  object: WorldObjectMeasure,
  home: Framing,
  frame: FocusFrame,
  aspect: number,
): { camera: [number, number, number]; target: [number, number, number] } {
  const direction = new Vector3(
    home.camera[0] - home.target[0],
    home.camera[1] - home.target[1],
    home.camera[2] - home.target[2],
  ).normalize()
  // `right` matches three's camera x-axis: cross(up, eye - target); `screenUp`
  // is the camera's own y-axis, so the vertical nudge is a screen shift rather
  // than a world-Y shift that a 3/4 view would read as "aim at the floor".
  const right = new Vector3().crossVectors(UP, direction).normalize()
  const screenUp = new Vector3().crossVectors(direction, right).normalize()

  // Distance that makes the bounding sphere cover `fill` of the frame height.
  const halfAngle = MathUtils.degToRad(frame.fov * frame.fill) / 2
  const distance = MathUtils.clamp(
    object.radius / Math.sin(halfAngle),
    frame.minDistance,
    frame.maxDistance,
  )

  // Moving the aim point right slides the object left on screen, hence the
  // negative signs: these are the offsets that land it on the requested slot.
  const halfHeight = distance * Math.tan(MathUtils.degToRad(frame.fov) / 2)
  const halfWidth = halfHeight * aspect
  const target = object.centre
    .clone()
    .addScaledVector(right, -frame.ndcX * halfWidth)
    .addScaledVector(screenUp, -frame.ndcY * halfHeight)

  return {
    target: [target.x, target.y, target.z],
    camera: [
      target.x + direction.x * distance,
      target.y + direction.y * distance,
      target.z + direction.z * distance,
    ],
  }
}

type Framing = {
  camera: [number, number, number]
  target: [number, number, number]
  fov: number
}

/**
 * Framing lives in one place on purpose.
 *
 * The intro tween and the "return home" tween used to carry their own copies of
 * these numbers, which is how the tree crown ended up cropped by the top of the
 * viewport: one copy was retuned, the other was not. `homeFraming` is sized so
 * the whole island — hanging rock at the bottom, tree crown at the top right —
 * stays inside the frame with breathing room, the way the reference board keeps
 * its island fully visible and centred.
 */
const homeFraming: Record<'desktop' | 'mobile', Framing> = {
  desktop: { camera: [20.8, 7.6, 28.6], target: [-0.3, 0.45, -0.45], fov: 40 },
  mobile: { camera: [27.8, 10.6, 38.4], target: [-0.2, 0.9, -0.45], fov: 48 },
}

const introFraming: Record<'desktop' | 'mobile', Framing> = {
  desktop: { camera: [8.6, 5.4, 11.8], target: [-0.3, 2.5, -0.45], fov: 35 },
  mobile: { camera: [13.4, 7.9, 17.8], target: [-0.2, 3.1, -0.45], fov: 34 },
}

const framingFor = (set: Record<'desktop' | 'mobile', Framing>, isMobile: boolean) =>
  set[isMobile ? 'mobile' : 'desktop']

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
      const home = framingFor(homeFraming, isMobile)
      const intro = framingFor(introFraming, isMobile)
      const homeCamera = home.camera
      const homeTarget = home.target

      if (reduceMotion) {
        camera.position.set(...homeCamera)
        controls.target.set(...homeTarget)
        camera.fov = home.fov
        camera.updateProjectionMatrix()
        controls.update()
        onIntroCompleteRef.current()
        return
      }

      const introCamera = intro.camera
      const introTarget = intro.target

      camera.position.set(...introCamera)
      controls.target.set(...introTarget)
      camera.fov = intro.fov
      camera.updateProjectionMatrix()
      controls.update()

      const timeline = gsap.timeline({
        delay: 0.2,
        onComplete: () => onIntroCompleteRef.current(),
      })

      timeline
        .to(
          camera.position,
          {
            x: introCamera[0] - 0.28,
            y: introCamera[1] + 0.08,
            z: introCamera[2] + 0.34,
            duration: 0.85,
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
            duration: 0.85,
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
            duration: 1.95,
            ease: 'power3.inOut',
            onUpdate: () => controls.update(),
          },
          0.9,
        )
        .to(
          controls.target,
          {
            x: homeTarget[0],
            y: homeTarget[1],
            z: homeTarget[2],
            duration: 1.9,
            ease: 'power3.inOut',
            onUpdate: () => controls.update(),
          },
          0.9,
        )
        .to(
          camera,
          {
            fov: home.fov,
            duration: 1.8,
            ease: 'power2.inOut',
            onUpdate: () => camera.updateProjectionMatrix(),
          },
          0.95,
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
    const home = framingFor(homeFraming, isMobile)
    const frame = focusFraming[isMobile ? 'mobile' : 'desktop']
    const measured = activeItem ? measureWorldObject(activeItem) : null
    const focus = measured ? focusViewFor(measured, home, frame, camera.aspect) : null
    const targetPosition = focus?.target ?? home.target
    const cameraPosition = focus?.camera ?? home.camera

    camera.fov = focus ? frame.fov : home.fov
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
      /* Must stay below the closest chapter distance
         (`focusFraming.minDistance`). At 16 the controls shoved the camera back
         out of every chapter view; at 8 they still clamped the two smallest
         objects, which both shrank them and slid them back toward the centre of
         the frame — the aim offset only lands where intended at the distance the
         framing was solved for. */
      minDistance={5}
      maxDistance={Infinity}
      minPolarAngle={0.72}
      maxPolarAngle={1.45}
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
      {/*
        No `<color attach="background">` on purpose. The canvas is alpha, and the
        night sky is a layered CSS gradient on `.app-shell`; painting a solid
        WebGL background covered it and flattened the night theme back to one
        dead navy tone.
      */}
      <fog attach="fog" args={[isNight ? '#17111d' : '#f1eeee', 90, 900]} />
      {/*
        Lighting follows one rule borrowed from the reference board: the island
        is a dark mass read against a soft sky, and warm light only exists where
        the story is (fire, lantern, desk lamp). Daylight fill is therefore kept
        deliberately low — a bright ambient wash was what made the first version
        look like flat beige mush.
      */}
      <ambientLight intensity={isNight ? 0.4 : 0.52} color={isNight ? '#c9b9d5' : '#fff0eb'} />
      <hemisphereLight
        args={[
          isNight ? '#514868' : '#f0e2ea',
          isNight ? '#100c16' : '#4a3947',
          isNight ? 0.5 : 0.66,
        ]}
      />
      <directionalLight
        castShadow
        position={[-5, 10, 7]}
        intensity={isNight ? 0.6 : 1.32}
        color={isNight ? '#aaa0d5' : '#ffe6dc'}
        shadow-mapSize={[1536, 1536]}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-11}
      />
      {/* Cool rim light from behind so the silhouette separates from the sky. */}
      <directionalLight
        position={[9.5, 6.5, -11]}
        intensity={isNight ? 0.5 : 0.78}
        color={isNight ? '#8f9ad8' : '#dfe7f3'}
      />
      <spotLight
        castShadow
        position={[5.5, 6, 2]}
        angle={0.5}
        penumbra={0.9}
        intensity={isNight ? 26 : 12}
        distance={18}
        color={isNight ? '#ffc38c' : '#f7d3c4'}
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
      <SceneProbes />
    </>
  )
}
