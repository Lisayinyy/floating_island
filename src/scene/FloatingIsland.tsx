import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  PointLight,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from 'three'
import {
  createIslandBodyGeometry,
  createIslandRimGeometry,
  createIslandTopGeometry,
  createRockLumps,
} from './islandGeometry'

type FloatingIslandProps = {
  isNight: boolean
}

const dayStone = ['#fffaf4', '#ead9cd', '#d5bca8']
const nightStone = ['#5b4b5a', '#493b4c', '#392e40']
const dayTreeLeaves = ['#eee7e2', '#e4d6dc', '#d7e1d8']
const nightTreeLeaves = ['#8e7d89', '#9b808c', '#718479']

type TreeBranch = {
  points: Array<[number, number, number]>
  startRadius: number
  endRadius: number
}

const treeBranches: TreeBranch[] = [
  {
    points: [
      [0, 0, 0],
      [0.18, 1.12, 0.02],
      [0.02, 2.38, 0.04],
      [-0.38, 3.55, -0.02],
      [-0.18, 4.52, 0.05],
    ],
    startRadius: 0.78,
    endRadius: 0.28,
  },
  {
    points: [
      [-0.34, 3.52, -0.02],
      [-1.18, 4.18, 0.02],
      [-2.52, 4.72, 0.08],
      [-4.12, 5.02, 0.1],
      [-5.75, 5, 0.06],
      [-7.18, 4.72, -0.02],
    ],
    startRadius: 0.44,
    endRadius: 0.095,
  },
  {
    points: [
      [-0.2, 4.24, 0.04],
      [-0.88, 5.08, 0.02],
      [-2.08, 5.76, -0.06],
      [-3.52, 6.12, -0.12],
      [-4.78, 6.08, -0.14],
    ],
    startRadius: 0.36,
    endRadius: 0.085,
  },
  {
    points: [
      [-0.22, 3.82, 0.04],
      [0.72, 4.38, 0.08],
      [1.92, 4.78, 0.12],
      [3.32, 4.7, 0.1],
    ],
    startRadius: 0.34,
    endRadius: 0.082,
  },
  {
    points: [
      [-0.16, 4.42, 0.04],
      [0.48, 5.16, -0.04],
      [1.5, 5.64, -0.1],
      [2.68, 5.5, -0.14],
    ],
    startRadius: 0.26,
    endRadius: 0.068,
  },
  {
    points: [
      [-2.46, 4.7, 0.08],
      [-3.18, 5.3, 0.5],
      [-4.08, 5.62, 0.82],
      [-5.04, 5.68, 0.96],
    ],
    startRadius: 0.2,
    endRadius: 0.052,
  },
  {
    points: [
      [-3.82, 5, 0.08],
      [-4.5, 5.48, -0.36],
      [-5.42, 5.72, -0.64],
      [-6.28, 5.66, -0.72],
    ],
    startRadius: 0.16,
    endRadius: 0.045,
  },
  {
    points: [
      [-5.42, 4.98, 0.04],
      [-6.12, 5.38, 0.28],
      [-6.86, 5.48, 0.42],
      [-7.52, 5.34, 0.48],
    ],
    startRadius: 0.13,
    endRadius: 0.036,
  },
  {
    points: [
      [-2.02, 5.72, -0.04],
      [-2.5, 6.22, 0.28],
      [-3.2, 6.54, 0.46],
      [-3.94, 6.58, 0.52],
    ],
    startRadius: 0.14,
    endRadius: 0.038,
  },
  {
    points: [
      [-0.86, 5.08, 0.02],
      [-0.72, 5.68, 0.38],
      [-0.82, 6.18, 0.64],
      [-1.14, 6.52, 0.76],
    ],
    startRadius: 0.13,
    endRadius: 0.036,
  },
  {
    points: [
      [0.7, 4.38, 0.08],
      [1.08, 4.9, 0.5],
      [1.52, 5.28, 0.82],
      [2.08, 5.4, 0.94],
    ],
    startRadius: 0.15,
    endRadius: 0.042,
  },
  {
    points: [
      [1.78, 4.76, 0.1],
      [2.28, 5.08, -0.3],
      [2.88, 5.2, -0.54],
      [3.52, 5.08, -0.6],
    ],
    startRadius: 0.12,
    endRadius: 0.034,
  },
  {
    points: [
      [0.08, 1.72, 0.06],
      [0.52, 2.02, 0.42],
      [0.88, 2.22, 0.7],
      [1.12, 2.34, 0.86],
    ],
    startRadius: 0.32,
    endRadius: 0.22,
  },
]

type LeafInstance = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  colorIndex: number
}

type LeafSpray = {
  points: Array<[number, number, number]>
  count: number
  spread: number
  scale: number
  colorBase: number
}

const leafSprays: LeafSpray[] = [
  { points: [[-7.55, 5.2, 0], [-6.4, 5.38, 0.06], [-5.2, 5.34, 0.02]], count: 15, spread: 0.62, scale: 1.18, colorBase: 0 },
  { points: [[-6.65, 5.82, -0.28], [-5.5, 5.94, -0.12], [-4.4, 5.82, 0]], count: 14, spread: 0.58, scale: 1.12, colorBase: 1 },
  { points: [[-5.3, 6.24, 0.18], [-4.2, 6.42, 0.12], [-3.1, 6.38, 0.02]], count: 15, spread: 0.62, scale: 1.16, colorBase: 2 },
  { points: [[-4.35, 6.68, -0.18], [-3.25, 6.85, -0.08], [-2.15, 6.7, 0.04]], count: 14, spread: 0.56, scale: 1.12, colorBase: 0 },
  { points: [[-3.15, 6.22, 0.58], [-2.1, 6.5, 0.7], [-1.05, 6.45, 0.72]], count: 14, spread: 0.56, scale: 1.08, colorBase: 1 },
  { points: [[-2.15, 5.82, -0.5], [-1.15, 6.02, -0.36], [-0.12, 5.88, -0.2]], count: 13, spread: 0.55, scale: 1.08, colorBase: 2 },
  { points: [[-1.12, 5.55, 0.18], [-0.2, 5.82, 0.2], [0.72, 5.72, 0.14]], count: 13, spread: 0.54, scale: 1.08, colorBase: 0 },
  { points: [[0.05, 5.18, -0.48], [1.08, 5.42, -0.42], [2.08, 5.34, -0.34]], count: 14, spread: 0.58, scale: 1.1, colorBase: 1 },
  { points: [[1.18, 5.8, 0.18], [2.15, 5.92, 0.1], [3.15, 5.74, 0.02]], count: 14, spread: 0.58, scale: 1.12, colorBase: 2 },
  { points: [[2.28, 5.14, 0.52], [3.15, 5.3, 0.42], [4.02, 5.14, 0.28]], count: 13, spread: 0.56, scale: 1.14, colorBase: 0 },
  { points: [[-6.9, 4.72, 0.5], [-5.85, 4.94, 0.62], [-4.8, 4.86, 0.58]], count: 12, spread: 0.52, scale: 1.08, colorBase: 2 },
  { points: [[-4.65, 5.34, -0.84], [-3.62, 5.54, -0.9], [-2.62, 5.42, -0.74]], count: 12, spread: 0.5, scale: 1.04, colorBase: 1 },
  { points: [[0.8, 4.78, 0.76], [1.72, 5, 0.86], [2.62, 4.92, 0.82]], count: 12, spread: 0.5, scale: 1.06, colorBase: 0 },
  { points: [[2.6, 4.62, -0.52], [3.35, 4.82, -0.58], [4.12, 4.68, -0.62]], count: 12, spread: 0.48, scale: 1.08, colorBase: 1 },
]

function createTaperedBranchGeometry({
  points,
  startRadius,
  endRadius,
}: TreeBranch) {
  const geometry = new BufferGeometry()
  const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)))
  const tubularSegments = 30
  const radialSegments = 9
  const frames = curve.computeFrenetFrames(tubularSegments, false)
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  const vertex = new Vector3()
  const normal = new Vector3()

  for (let ring = 0; ring <= tubularSegments; ring += 1) {
    const t = ring / tubularSegments
    const point = curve.getPointAt(t)
    const radius = startRadius + (endRadius - startRadius) * Math.pow(t, 0.82)

    for (let side = 0; side < radialSegments; side += 1) {
      const angle = (side / radialSegments) * Math.PI * 2
      normal
        .copy(frames.normals[ring])
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(frames.binormals[ring], Math.sin(angle))
        .normalize()
      vertex.copy(point).addScaledVector(normal, radius)
      positions.push(vertex.x, vertex.y, vertex.z)
      normals.push(normal.x, normal.y, normal.z)
    }
  }

  for (let ring = 0; ring < tubularSegments; ring += 1) {
    for (let side = 0; side < radialSegments; side += 1) {
      const nextSide = (side + 1) % radialSegments
      const a = ring * radialSegments + side
      const b = (ring + 1) * radialSegments + side
      const c = (ring + 1) * radialSegments + nextSide
      const d = ring * radialSegments + nextSide
      indices.push(a, b, d, b, c, d)
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

function createAlmondLeafGeometry() {
  const geometry = new BufferGeometry()
  const lengthSegments = 12
  const radialSegments = 8
  const positions: number[] = []
  const indices: number[] = []

  for (let ring = 0; ring <= lengthSegments; ring += 1) {
    const t = ring / lengthSegments
    const profile = Math.max(0.001, Math.pow(Math.sin(Math.PI * t), 0.82))
    const y = (t - 0.5)
    const centerZ = Math.sin(Math.PI * t) * 0.055

    for (let side = 0; side < radialSegments; side += 1) {
      const angle = (side / radialSegments) * Math.PI * 2
      positions.push(
        Math.cos(angle) * 0.22 * profile,
        y,
        centerZ + Math.sin(angle) * 0.035 * profile,
      )
    }
  }

  for (let ring = 0; ring < lengthSegments; ring += 1) {
    for (let side = 0; side < radialSegments; side += 1) {
      const nextSide = (side + 1) % radialSegments
      const a = ring * radialSegments + side
      const b = (ring + 1) * radialSegments + side
      const c = (ring + 1) * radialSegments + nextSide
      const d = ring * radialSegments + nextSide
      indices.push(a, b, d, b, c, d)
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

function createLeafInstances() {
  let seed = 42719
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  return leafSprays.flatMap(({ points, count, spread, scale, colorBase }) => {
    const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)))

    return Array.from({ length: count }, (_, index): LeafInstance => {
      const t = count === 1 ? 0.5 : index / (count - 1)
      const center = curve.getPointAt(t)
      const tangent = curve.getTangentAt(t).normalize()
      const sideSign = index % 2 === 0 ? 1 : -1
      const sideLength = spread * (0.52 + random() * 0.48) * sideSign
      const sideX = -tangent.y
      const sideY = tangent.x
      const branchAngle = Math.atan2(tangent.y, tangent.x) - Math.PI / 2
      const outwardAngle =
        branchAngle + sideSign * (0.3 + random() * 0.16)
      const size = scale * (0.84 + random() * 0.3)

      return {
        position: [
          center.x + sideX * sideLength + (random() - 0.5) * 0.18,
          center.y + sideY * sideLength + (random() - 0.5) * 0.16,
          center.z + (random() - 0.5) * 0.72,
        ],
        rotation: [
          -0.08 + (random() - 0.5) * 0.48,
          (random() - 0.5) * 0.62,
          outwardAngle + (random() - 0.5) * 0.28,
        ],
        scale: [
          size * (0.92 + random() * 0.16),
          size,
          0.58 + random() * 0.18,
        ],
        colorIndex: (colorBase + index) % 3,
      }
    })
  })
}

function CurvedBranch({
  points,
  startRadius,
  endRadius,
  color,
}: TreeBranch & {
  color: string
}) {
  const curve = useMemo(
    () => createTaperedBranchGeometry({ points, startRadius, endRadius }),
    [endRadius, points, startRadius],
  )

  return (
    <mesh geometry={curve} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.96} />
    </mesh>
  )
}

function LeafInstances({
  geometry,
  instances,
  color,
  isNight,
}: {
  geometry: BufferGeometry
  instances: LeafInstance[]
  color: string
  isNight: boolean
}) {
  const meshRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!meshRef.current) return
    const leaf = new Object3D()

    instances.forEach((instance, index) => {
      leaf.position.set(...instance.position)
      leaf.rotation.set(...instance.rotation)
      leaf.scale.set(...instance.scale)
      leaf.updateMatrix()
      meshRef.current?.setMatrixAt(index, leaf.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.computeBoundingSphere()
  }, [instances])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instances.length]}
      castShadow
      receiveShadow
    >
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color={color}
        emissive={isNight ? color : '#000000'}
        emissiveIntensity={isNight ? 0.1 : 0}
        roughness={0.92}
      />
    </instancedMesh>
  )
}

function IslandPlant({
  position,
  rotation = 0,
  scale = 1,
  isNight,
}: {
  position: [number, number, number]
  rotation?: number
  scale?: number
  isNight: boolean
}) {
  const leaf = isNight ? '#4c685d' : '#c8d1c8'

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {[-0.34, 0, 0.34].map((x, index) => (
        <mesh
          key={x}
          position={[x, 0.34 + index * 0.09, 0]}
          rotation={[0, 0, x * -1.5]}
          castShadow
        >
          <capsuleGeometry args={[0.12, 0.52, 5, 10]} />
          <meshStandardMaterial color={leaf} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.12, 0]} castShadow>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color={isNight ? '#574151' : '#d8bdc4'} roughness={0.95} />
      </mesh>
    </group>
  )
}

function MemoryTree({ isNight }: FloatingIslandProps) {
  const trunk = isNight ? '#745b68' : '#c9b9b1'
  const leaves = isNight ? nightTreeLeaves : dayTreeLeaves
  const leafGeometry = useMemo(() => createAlmondLeafGeometry(), [])
  const leafInstances = useMemo(() => createLeafInstances(), [])
  const leavesByColor = useMemo(
    () => [0, 1, 2].map((colorIndex) =>
      leafInstances.filter((leaf) => leaf.colorIndex === colorIndex),
    ),
    [leafInstances],
  )

  return (
    <group
      position={[4.78, 0.1, -2.92]}
      rotation={[0, -0.08, 0]}
      scale={[0.95, 1.04, 0.95]}
    >
      {treeBranches.map((branch, index) => (
        <CurvedBranch
          key={index}
          {...branch}
          color={trunk}
        />
      ))}

      <mesh
        position={[1.12, 2.34, 0.86]}
        rotation={[0.15, -0.42, -0.28]}
        scale={[0.25, 0.25, 0.09]}
        castShadow
      >
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial
          color={isNight ? '#8b7280' : '#ded0c9'}
          roughness={0.98}
        />
      </mesh>

      {leavesByColor.map((instances, colorIndex) => (
        <LeafInstances
          key={leaves[colorIndex]}
          geometry={leafGeometry}
          instances={instances}
          color={leaves[colorIndex]}
          isNight={isNight}
        />
      ))}
    </group>
  )
}

function IslandCloud({
  position,
  scale,
  isNight,
}: {
  position: [number, number, number]
  scale: number
  isNight: boolean
}) {
  const color = isNight ? '#312b3d' : '#eee5e7'

  return (
    <group position={position} scale={scale}>
      {[
        [-0.65, 0, 0, 0.72],
        [0, 0.14, 0, 1],
        [0.72, -0.02, 0.04, 0.68],
      ].map(([x, y, z, size], index) => (
        <mesh key={index} position={[x, y, z]} scale={[1.35, 0.62, 0.72]}>
          <sphereGeometry args={[size, 20, 12]} />
          <meshStandardMaterial color={color} transparent opacity={isNight ? 0.38 : 0.72} />
        </mesh>
      ))}
    </group>
  )
}

function WelcomeSign({ isNight }: FloatingIslandProps) {
  const labelTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 160
    const context = canvas.getContext('2d')

    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = isNight ? '#f4dde3' : '#674351'
      context.font = '600 62px Georgia, serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('welcome', canvas.width / 2, canvas.height / 2)
    }

    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [isNight])

  useEffect(() => () => labelTexture.dispose(), [labelTexture])

  return (
    <group
      position={[-0.78, 0.3, 4.78]}
      rotation={[0, 0.12, 0]}
      scale={0.86}
    >
      {[-0.43, 0.43].map((x) => (
        <mesh key={x} position={[x, 0.05, -0.04]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.58, 10]} />
          <meshStandardMaterial
            color={isNight ? '#76545f' : '#b88f82'}
            roughness={0.9}
          />
        </mesh>
      ))}
      <RoundedBox
        args={[1.2, 0.42, 0.09]}
        radius={0.045}
        position={[0, 0.34, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={isNight ? '#6c5261' : '#e1c7bd'}
          roughness={0.88}
        />
      </RoundedBox>
      <mesh position={[0, 0.34, 0.052]}>
        <planeGeometry args={[0.88, 0.27]} />
        <meshBasicMaterial map={labelTexture} transparent toneMapped={false} />
      </mesh>
    </group>
  )
}

function ArrivalPath({ isNight }: FloatingIslandProps) {
  const color = isNight ? '#765f70' : '#e7ddd8'

  return (
    <group>
      {[
        [-0.48, 0.045, 4.02, 0.74, 0.4, -0.08],
        [-0.24, 0.04, 3.36, 0.68, 0.38, 0.06],
        [0.06, 0.035, 2.74, 0.62, 0.35, -0.05],
        [0.32, 0.03, 2.18, 0.56, 0.32, 0.04],
      ].map(([x, y, z, width, depth, rotation], index) => (
        <RoundedBox
          key={index}
          args={[width, 0.055, depth]}
          radius={0.05}
          position={[x, y, z]}
          rotation={[0, rotation, 0]}
          receiveShadow
        >
          <meshStandardMaterial color={color} roughness={0.96} />
        </RoundedBox>
      ))}
    </group>
  )
}

function Campfire({ isNight }: FloatingIslandProps) {
  const flameRef = useRef<Group>(null)
  const glowRef = useRef<PointLight>(null)
  const emberRef = useRef<Group>(null)

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime
    const flicker =
      Math.sin(elapsed * 8.2) * 0.06 +
      Math.sin(elapsed * 13.7 + 0.8) * 0.035

    if (flameRef.current) {
      flameRef.current.scale.set(
        1 - flicker * 0.35,
        1 + flicker,
        1 - flicker * 0.25,
      )
      flameRef.current.rotation.z = Math.sin(elapsed * 4.6) * 0.035
    }

    if (glowRef.current) {
      // The fire stays lit in daylight too: it is the one warm anchor that
      // keeps the pastel day scene from flattening out.
      const base = isNight ? 24 : 10
      glowRef.current.intensity =
        base +
        Math.sin(elapsed * 9.1) * base * 0.13 +
        Math.sin(elapsed * 15.4 + 0.5) * base * 0.07
    }

    if (emberRef.current) {
      emberRef.current.position.y = 0.06 + ((elapsed * 0.18) % 0.28)
      emberRef.current.rotation.y = elapsed * 0.45
    }
  })

  return (
    <group position={[3.18, 0.4, 4.2]} scale={0.78}>
      {[0, Math.PI / 2, Math.PI / 4].map((rotation, index) => (
        <mesh
          key={rotation}
          position={[0, 0.08 + index * 0.025, 0]}
          rotation={[Math.PI / 2, 0, rotation]}
          castShadow
        >
          <cylinderGeometry args={[0.12, 0.15, 1.28, 8]} />
          <meshStandardMaterial
            color={index === 1 ? '#5a3940' : '#70454a'}
            roughness={0.96}
          />
        </mesh>
      ))}

      <group ref={flameRef} position={[0, 0.72, 0]}>
        <mesh scale={[0.58, 1.05, 0.58]}>
          <sphereGeometry args={[0.48, 10, 8]} />
          <meshStandardMaterial
            color="#f49a56"
            emissive="#ff6d32"
            emissiveIntensity={2.8}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0.03, -0.06, 0.08]} scale={[0.3, 0.68, 0.3]}>
          <sphereGeometry args={[0.48, 10, 8]} />
          <meshStandardMaterial
            color="#ffe6a6"
            emissive="#ffc55f"
            emissiveIntensity={4.2}
            roughness={0.42}
          />
        </mesh>
        <mesh position={[-0.08, 0.45, -0.03]} scale={[0.28, 0.62, 0.28]}>
          <coneGeometry args={[0.44, 1.15, 9]} />
          <meshStandardMaterial
            color="#ffb363"
            emissive="#ff7d38"
            emissiveIntensity={3.2}
            roughness={0.48}
          />
        </mesh>
      </group>

      <group ref={emberRef} visible={isNight}>
        {[
          [-0.27, 1.2, 0.03, 0.035],
          [0.18, 1.42, -0.08, 0.045],
          [0.04, 1.66, 0.1, 0.028],
        ].map(([x, y, z, size], index) => (
          <mesh key={index} position={[x, y, z]}>
            <sphereGeometry args={[size, 8, 6]} />
            <meshBasicMaterial color={index === 1 ? '#fff0b5' : '#ffb458'} />
          </mesh>
        ))}
      </group>

      <pointLight
        ref={glowRef}
        position={[0, 1.12, 0]}
        intensity={isNight ? 24 : 10}
        distance={isNight ? 6.6 : 5.4}
        decay={2}
        color="#ffad62"
      />
    </group>
  )
}

function HangingLantern({ isNight }: FloatingIslandProps) {
  const flameRef = useRef<PointLight>(null)
  const bodyColor = isNight ? '#3c2f3c' : '#6d5762'

  useFrame((state) => {
    if (!flameRef.current) return
    const elapsed = state.clock.elapsedTime
    const base = isNight ? 11 : 3.4
    flameRef.current.intensity =
      base + Math.sin(elapsed * 5.3) * base * 0.09 + Math.sin(elapsed * 11.7 + 0.7) * base * 0.05
  })

  return (
    <group position={[-6.55, 0.2, 2.05]} rotation={[0, 0.42, 0]}>
      {/* Post + curved arm. */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.11, 3.1, 12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.42, 3.02, 0]} rotation={[0, 0, -Math.PI / 2.35]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 1.02, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.86, 2.86, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.36, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.9} />
      </mesh>

      {/* Lantern cage. */}
      <group position={[0.86, 2.44, 0]}>
        <mesh position={[0, 0.29, 0]} castShadow>
          <coneGeometry args={[0.29, 0.22, 4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.42, 0.34]} />
          <meshStandardMaterial
            color={isNight ? '#ffe0a8' : '#f6e3cd'}
            emissive="#ffb163"
            emissiveIntensity={isNight ? 2.6 : 0.85}
            roughness={0.4}
            transparent
            opacity={0.94}
          />
        </mesh>
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.035, 0.44, 0.36]} />
            <meshStandardMaterial color={bodyColor} roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.38, 0.08, 0.38]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} />
        </mesh>
        <pointLight
          ref={flameRef}
          position={[0, 0, 0]}
          intensity={isNight ? 11 : 3.4}
          distance={isNight ? 8.5 : 5.2}
          decay={2}
          color="#ffb977"
        />
      </group>
    </group>
  )
}

export function FloatingIsland({ isNight }: FloatingIslandProps) {
  const stone = isNight ? nightStone : dayStone
  const bodyGeometry = useMemo(() => createIslandBodyGeometry(), [])
  const topGeometry = useMemo(() => createIslandTopGeometry(), [])
  const rimGeometry = useMemo(() => createIslandRimGeometry(), [])
  const rockLumps = useMemo(() => createRockLumps(), [])

  return (
    <group>
      {/* Ground: an irregular disc, not a perfect circle. */}
      <mesh geometry={topGeometry} position={[0, 0.2, 0]} receiveShadow>
        <meshStandardMaterial color={isNight ? '#5f4d5c' : '#d2bba9'} roughness={0.97} />
      </mesh>

      {/* Cliff band that thickens the rim from a low camera angle. */}
      <mesh geometry={rimGeometry} position={[0, 0.2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={isNight ? '#4a3a4a' : '#c3a692'} roughness={0.99} flatShading />
      </mesh>

      {/* The hanging rock mass — carries the whole silhouette. */}
      <mesh geometry={bodyGeometry} position={[0, -0.2, 0]} receiveShadow castShadow>
        <meshStandardMaterial
          color={isNight ? '#4e3f50' : '#c0a290'}
          roughness={0.99}
          vertexColors
          flatShading
          side={DoubleSide}
        />
      </mesh>

      {/* Boulders clamped on the underside so the outline gets real bumps. */}
      {rockLumps.map((lump, index) => (
        <mesh
          key={index}
          position={[lump.position[0], lump.position[1] - 0.2, lump.position[2]]}
          rotation={lump.rotation}
          scale={lump.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={isNight ? nightStone[lump.tone] : ['#b39482', '#a88b7c', '#bd9f8d'][lump.tone]}
            roughness={1}
          />
        </mesh>
      ))}

      <RoundedBox
        args={[11.55, 0.18, 6.35]}
        radius={0.12}
        position={[-0.05, 0.27, -0.12]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color={isNight ? '#6a5665' : '#ead9c8'} roughness={0.88} />
      </RoundedBox>

      {[
        [-5.72, 0.4, 3.12, 0.62],
        [-4.72, 0.34, 3.65, 0.4],
        [5.18, 0.34, 2.72, 0.5],
        [5.75, 0.32, 1.88, 0.34],
      ].map(([x, y, z, scale], index) => (
        <mesh
          key={index}
          position={[x, y, z]}
          rotation={[index * 0.2, index * 0.42, index * 0.1]}
          scale={scale}
          castShadow
        >
          <dodecahedronGeometry args={[0.82, 0]} />
          <meshStandardMaterial color={stone[index % stone.length]} roughness={1} />
        </mesh>
      ))}

      <IslandPlant position={[-5.78, 0.45, 2.3]} rotation={0.35} scale={0.85} isNight={isNight} />
      <IslandPlant position={[5.45, 0.42, 1.2]} rotation={-0.5} scale={0.72} isNight={isNight} />
      <IslandPlant position={[4.18, 0.42, 3.02]} rotation={0.2} scale={0.58} isNight={isNight} />
      <ArrivalPath isNight={isNight} />
      <WelcomeSign isNight={isNight} />
      <MemoryTree isNight={isNight} />
      <HangingLantern isNight={isNight} />
      <Campfire isNight={isNight} />

      <IslandCloud position={[-7.1, -1.2, -1.1]} scale={0.82} isNight={isNight} />
      <IslandCloud position={[7.25, -0.65, -2.2]} scale={0.68} isNight={isNight} />
    </group>
  )
}
