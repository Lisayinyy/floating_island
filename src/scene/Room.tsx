import { RoundedBox } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { useWorldStore } from '../store/worldStore'
import { FloatingIsland } from './FloatingIsland'
import { InteractiveObject } from './InteractiveObject'
import { createConsoleScreenTexture, createLaptopScreenTexture } from './screenTexture'
import type { CanvasTexture } from 'three'

const dark = '#5b5254'
const cream = '#eee7df'
const wood = '#c8b4aa'
const red = '#c47d90'

/**
 * Paint a screen once and release its GPU memory when the object unmounts.
 * The factories are module-level constants, so the memo never re-runs.
 */
function useScreenTexture(create: () => CanvasTexture) {
  const texture = useMemo(create, [create])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function Desk() {
  return (
    <group position={[0.4, 0, -1.55]}>
      <RoundedBox args={[4.6, 0.16, 1.65]} radius={0.05} position={[0, 1.68, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={cream} roughness={0.72} />
      </RoundedBox>
      {[-1.95, 1.95].flatMap((x) =>
        [-0.62, 0.62].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.83, z]} castShadow>
            <boxGeometry args={[0.13, 1.68, 0.13]} />
            <meshStandardMaterial color={wood} roughness={0.6} />
          </mesh>
        )),
      )}
    </group>
  )
}

function Laptop({ isNight }: { isNight: boolean }) {
  const screen = useScreenTexture(createLaptopScreenTexture)

  return (
    <InteractiveObject id="work" label="SELECTED WORK" position={[0.4, 1.82, -1.52]} scale={0.9}>
      <mesh position={[0, 0.34, 0]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[1.45, 0.86, 0.08]} />
        <meshStandardMaterial color={dark} metalness={0.25} roughness={0.45} />
      </mesh>
      {/* The screen carries a painted editor rather than a flat swatch: every
          chapter view flies close enough that an empty pane became the least
          finished surface on the island. */}
      <mesh position={[0, 0.34, 0.046]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[1.25, 0.66]} />
        <meshStandardMaterial
          map={screen}
          emissiveMap={screen}
          emissive="#ffffff"
          emissiveIntensity={isNight ? 0.92 : 0.5}
          roughness={0.32}
          toneMapped={false}
        />
      </mesh>
      {/* Backlight spill, so the lit screen actually affects the desk. Night
          only: by day it is invisible, and every extra light costs a forward
          render pass on every lit fragment. */}
      {isNight && (
        <pointLight position={[0, 0.42, 0.55]} intensity={2.6} distance={2.4} decay={2} color="#cfd8ea" />
      )}
      <mesh position={[0, -0.04, 0.34]} rotation={[0.05, 0, 0]} castShadow>
        <boxGeometry args={[1.55, 0.08, 0.92]} />
        <meshStandardMaterial color={dark} metalness={0.2} roughness={0.5} />
      </mesh>
    </InteractiveObject>
  )
}

function PrototypeDeck() {
  return (
    <InteractiveObject id="philosophy" label="HOW I WORK" position={[-4.18, 0.76, 1.42]} scale={0.82}>
      <RoundedBox args={[2.25, 0.82, 1.2]} radius={0.04} castShadow>
        <meshStandardMaterial color="#e6ddd7" roughness={0.75} />
      </RoundedBox>
      <mesh position={[-0.55, 0.48, 0]} castShadow>
        <boxGeometry args={[0.58, 0.08, 0.72]} />
        <meshStandardMaterial color="#bd4b68" roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 0.48, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.72]} />
        <meshStandardMaterial color="#c79a61" roughness={0.65} />
      </mesh>
      <mesh position={[0.65, 0.48, 0]} castShadow>
        <boxGeometry args={[0.35, 0.08, 0.72]} />
        <meshStandardMaterial color="#708d80" roughness={0.65} />
      </mesh>
      {[-0.55, 0.1, 0.65].map((x) => (
        <mesh key={x} position={[x, 0.58, 0]}>
          <sphereGeometry args={[0.08, 18, 12]} />
          <meshStandardMaterial color={cream} emissive={cream} emissiveIntensity={0.18} />
        </mesh>
      ))}
    </InteractiveObject>
  )
}

function PhotoWall() {
  const photos: Array<{
    position: [number, number, number]
    rotation: [number, number, number]
    size: [number, number]
    frame: string
    photo: string
  }> = [
    {
      position: [-0.48, 0.22, 0],
      rotation: [0, 0, -0.06],
      size: [0.78, 0.98],
      frame: '#c2708c',
      photo: '#efd2dc',
    },
    {
      position: [0.38, 0.34, 0.025],
      rotation: [0, 0, 0.08],
      size: [0.72, 0.82],
      frame: '#8b687b',
      photo: '#d8b2c2',
    },
    {
      position: [-0.3, -0.62, 0.035],
      rotation: [0, 0, 0.04],
      size: [0.68, 0.58],
      frame: '#a98491',
      photo: '#e8c8cf',
    },
    {
      position: [0.5, -0.48, 0.05],
      rotation: [0, 0, -0.08],
      size: [0.82, 0.66],
      frame: '#d18ba1',
      photo: '#f0d7df',
    },
  ]

  return (
    <InteractiveObject
      id="about"
      label="ABOUT LISA"
      position={[-3.72, 2.82, -2.51]}
      scale={0.88}
    >
      {photos.map(({ position, rotation, size, frame, photo }, index) => (
        <group key={index} position={position} rotation={rotation}>
          <RoundedBox args={[size[0], size[1], 0.12]} radius={0.035} castShadow>
            <meshStandardMaterial color={frame} roughness={0.72} />
          </RoundedBox>
          <mesh position={[0, 0, 0.068]}>
            <planeGeometry args={[size[0] - 0.14, size[1] - 0.14]} />
            <meshStandardMaterial
              color={photo}
              emissive="#a95575"
              emissiveIntensity={0.1}
              roughness={0.9}
            />
          </mesh>
          <mesh position={[0, 0.06, 0.078]}>
            <circleGeometry args={[Math.min(size[0], size[1]) * 0.13, 24]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#f7e8ed' : '#bc7188'} />
          </mesh>
          <mesh position={[0, -size[1] * 0.22, 0.079]}>
            <capsuleGeometry args={[0.1, 0.14, 5, 12]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#bc7188' : '#f7e8ed'} />
          </mesh>
        </group>
      ))}
    </InteractiveObject>
  )
}

function GraduationCap() {
  return (
    <InteractiveObject
      id="experience"
      label="EDUCATION"
      position={[0.34, 3.12, -2.34]}
      rotation={[0, -0.12, -0.04]}
      scale={0.68}
    >
      <mesh position={[0, 0.2, 0]} rotation={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[1.22, 0.1, 1.02]} />
        <meshStandardMaterial color="#5a3d50" roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.06, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.48, 0.42, 4]} />
        <meshStandardMaterial color="#6c4b60" roughness={0.8} />
      </mesh>
      <mesh position={[0.03, 0.28, 0]}>
        <sphereGeometry args={[0.07, 16, 10]} />
        <meshStandardMaterial color="#d29a62" roughness={0.7} />
      </mesh>
      <mesh position={[0.53, -0.04, 0.05]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.62, 10]} />
        <meshStandardMaterial color="#d29a62" roughness={0.65} />
      </mesh>
      <mesh position={[0.58, -0.38, 0.05]}>
        <capsuleGeometry args={[0.05, 0.22, 5, 10]} />
        <meshStandardMaterial color="#d29a62" roughness={0.7} />
      </mesh>
    </InteractiveObject>
  )
}

function Books() {
  return (
    <group position={[-0.78, 3.26, -2.43]} scale={0.8}>
      <mesh position={[0.18, -0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.45, 0.14, 0.62]} />
        <meshStandardMaterial color={wood} roughness={0.7} />
      </mesh>
      {[
        [-0.62, 0.1, '#bc4f6c'],
        [-0.34, 0.02, '#eadfdb'],
        [-0.08, 0.13, '#765c70'],
        [0.22, 0.07, '#c79a61'],
      ].map(([x, tilt, color], index) => (
        <mesh key={index} position={[x as number, 0.02, 0]} rotation={[0, 0, tilt as number]} castShadow>
          <boxGeometry args={[0.23, 0.72 + index * 0.04, 0.42]} />
          <meshStandardMaterial color={color as string} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function CandleSconce({ isNight }: { isNight: boolean }) {
  return (
    <group position={[-5.04, 3.28, -1.18]} rotation={[0, Math.PI / 2, 0]} scale={0.82}>
      <RoundedBox args={[0.16, 0.92, 0.62]} radius={0.06} castShadow>
        <meshStandardMaterial color="#725766" roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, -0.18, 0.48]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.78, 12]} />
        <meshStandardMaterial color="#b88a78" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.14, 0.77]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.56, 18]} />
        <meshStandardMaterial color="#f2dfd2" roughness={0.9} />
      </mesh>
      {isNight ? (
        <mesh position={[0, 0.57, 0.77]} scale={[0.72, 1.18, 0.72]}>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshStandardMaterial
            color="#ffd79a"
            emissive="#ff9d4d"
            emissiveIntensity={3.8}
            roughness={0.45}
          />
        </mesh>
      ) : (
        <mesh position={[0, 0.45, 0.77]}>
          <cylinderGeometry args={[0.018, 0.022, 0.18, 8]} />
          <meshStandardMaterial color="#5b4b49" roughness={1} />
        </mesh>
      )}
      {isNight && (
        <pointLight
          position={[0, 0.58, 0.9]}
          intensity={9}
          distance={4.2}
          decay={2}
          color="#ffbd78"
        />
      )}
    </group>
  )
}

function FutureArtwork() {
  return (
    <group position={[2.65, 3.42, -2.53]} rotation={[0, 0, 0.025]}>
      <RoundedBox args={[2.45, 1.52, 0.11]} radius={0.045} castShadow>
        <meshStandardMaterial color="#8b7580" roughness={0.72} />
      </RoundedBox>
      <mesh position={[0, 0, 0.062]}>
        <planeGeometry args={[2.12, 1.2]} />
        <meshStandardMaterial color="#98aa9f" roughness={0.94} />
      </mesh>
      <mesh position={[-0.72, 0.42, 0.073]}>
        <circleGeometry args={[0.045, 16]} />
        <meshStandardMaterial color="#d7899d" />
      </mesh>
      <mesh position={[-0.56, 0.42, 0.073]}>
        <circleGeometry args={[0.045, 16]} />
        <meshStandardMaterial color="#d0a369" />
      </mesh>
    </group>
  )
}

function PaintingEasel() {
  return (
    <InteractiveObject
      id="art"
      label="MY PAINTINGS"
      position={[4.05, 0.72, 1.48]}
      rotation={[0, -0.22, 0]}
      scale={0.78}
    >
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 0.2, -0.08]} rotation={[0, 0, x * -0.08]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 2.65, 10]} />
          <meshStandardMaterial color="#aa8270" roughness={0.82} />
        </mesh>
      ))}
      <mesh position={[0, -0.3, -0.42]} rotation={[0.36, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2.2, 10]} />
        <meshStandardMaterial color="#9a7467" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.1, 0.04]} castShadow>
        <boxGeometry args={[2.22, 0.12, 0.34]} />
        <meshStandardMaterial color="#aa8270" roughness={0.78} />
      </mesh>
      <RoundedBox args={[2.3, 1.5, 0.14]} radius={0.04} position={[0, 1.02, 0]} castShadow>
        <meshStandardMaterial color="#d9cbc5" roughness={0.88} />
      </RoundedBox>
      <mesh position={[0, 1.02, 0.081]}>
        <planeGeometry args={[2.04, 1.24]} />
        <meshStandardMaterial color="#f5efea" roughness={0.94} />
      </mesh>
      <mesh position={[-0.42, 1.08, 0.095]} rotation={[0, 0, -0.32]}>
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial color="#b96d86" roughness={0.86} />
      </mesh>
      <mesh position={[0.38, 0.85, 0.098]} rotation={[0, 0, 0.22]}>
        <planeGeometry args={[0.76, 0.2]} />
        <meshStandardMaterial color="#789487" roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 1.3, 0.1]} rotation={[0, 0, -0.1]}>
        <planeGeometry args={[0.62, 0.16]} />
        <meshStandardMaterial color="#d3a25e" roughness={0.86} />
      </mesh>
      <mesh position={[-0.88, 1.52, 0.1]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#d98788" />
      </mesh>
      <mesh position={[-0.76, 1.52, 0.1]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#d3a25e" />
      </mesh>
      <mesh position={[-0.64, 1.52, 0.1]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial color="#789487" />
      </mesh>
    </InteractiveObject>
  )
}

function AICreativeConsole({ isNight }: { isNight: boolean }) {
  const screen = useScreenTexture(createConsoleScreenTexture)

  return (
    /* Front-left of the rug, not tucked against the right end wall. From there
       the derived chapter camera had the window ledge and the porch post in the
       way, so opening this chapter framed timber instead of the console. */
    <InteractiveObject
      id="toolkit"
      label="AI CREATIVE TOOLKIT"
      position={[-1.95, 1.08, 1.05]}
      rotation={[0, 0.5, 0]}
      scale={0.9}
    >
      <RoundedBox args={[1.75, 1.85, 0.82]} radius={0.08} castShadow>
        <meshStandardMaterial color="#ddd3ce" roughness={0.62} metalness={0.06} />
      </RoundedBox>
      <mesh position={[0, 0.28, 0.43]}>
        <planeGeometry args={[1.35, 0.82]} />
        <meshStandardMaterial
          map={screen}
          emissiveMap={screen}
          emissive="#ffffff"
          emissiveIntensity={isNight ? 0.95 : 0.55}
          roughness={0.34}
          toneMapped={false}
        />
      </mesh>
      {isNight && (
        <pointLight position={[0, 0.32, 0.95]} intensity={2.2} distance={2.2} decay={2} color="#b9d6c4" />
      )}
      {[-0.35, 0, 0.35].map((x, index) => (
        <mesh key={x} position={[x, -0.48, 0.46]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 24]} />
          <meshStandardMaterial
            color={index === 0 ? red : index === 1 ? '#c79a61' : '#708d80'}
            emissive={index === 0 ? red : '#000000'}
            emissiveIntensity={0.22}
          />
        </mesh>
      ))}
      <mesh position={[-0.52, 1.05, 0.12]} rotation={[0.05, 0, -0.1]} castShadow>
        <boxGeometry args={[0.72, 0.5, 0.04]} />
        <meshStandardMaterial color="#f2e2df" roughness={0.9} />
      </mesh>
      <mesh position={[0.34, 1.12, 0.08]} rotation={[-0.04, 0, 0.13]} castShadow>
        <boxGeometry args={[0.72, 0.5, 0.04]} />
        <meshStandardMaterial color="#d98788" roughness={0.9} />
      </mesh>
    </InteractiveObject>
  )
}

function Chair() {
  return (
    <group position={[0.6, 0.64, 0.4]} rotation={[0, -0.12, 0]}>
      <RoundedBox args={[1.38, 0.25, 1.22]} radius={0.16} position={[0, 0.62, 0]} castShadow>
        <meshStandardMaterial color="#b9aaa8" roughness={0.78} />
      </RoundedBox>
      <RoundedBox args={[1.32, 1.4, 0.24]} radius={0.16} position={[0, 1.32, 0.48]} rotation={[-0.12, 0, 0]} castShadow>
        <meshStandardMaterial color="#aa9b9c" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.9, 16]} />
        <meshStandardMaterial color={dark} metalness={0.25} />
      </mesh>
      <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.65, 12]} />
        <meshStandardMaterial color={dark} />
      </mesh>
    </group>
  )
}

function DeskLamp({ isNight }: { isNight: boolean }) {
  // Low by day on purpose: a strong emissive washed the shade to a flat white
  // patch that read as folded paper rather than a lit lampshade.
  const glow = isNight ? 2.8 : 0.42

  return (
    <group position={[-1.15, 1.78, -1.25]} rotation={[0, 0.18, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.32, 0.4, 0.12, 28]} />
        <meshStandardMaterial color={dark} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, -0.18]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 1.45, 18]} />
        <meshStandardMaterial color={wood} metalness={0.2} roughness={0.45} />
      </mesh>
      <mesh position={[0.18, 1.38, 0.02]} rotation={[0, 0, -0.42]} castShadow>
        <coneGeometry args={[0.42, 0.58, 28, 1, true]} />
        <meshStandardMaterial
          color="#d88b9f"
          emissive="#ffbd76"
          emissiveIntensity={glow}
          side={2}
        />
      </mesh>
      {/* The lamp keeps a warm pool on the desk in both themes, so the cabin
          interior never falls completely flat under the new roof. */}
      <pointLight
        position={[0.3, 1.1, 0.24]}
        intensity={isNight ? 9 : 5.2}
        distance={isNight ? 6 : 4.6}
        decay={2}
        color="#ffc98d"
      />
    </group>
  )
}

function FlowerVase() {
  return (
    <group position={[-1.72, 1.83, -1.62]} scale={0.72}>
      <mesh castShadow>
        <cylinderGeometry args={[0.23, 0.34, 0.72, 24]} />
        <meshStandardMaterial color="#f0d9dc" roughness={0.55} />
      </mesh>
      {[-0.22, 0, 0.22].map((x, index) => (
        <group key={x} rotation={[0, 0, x * 0.7]}>
          <mesh position={[x, 0.72 + index * 0.12, 0]}>
            <cylinderGeometry args={[0.018, 0.024, 1, 10]} />
            <meshStandardMaterial color="#657e6f" roughness={0.8} />
          </mesh>
          <mesh position={[x * 1.8, 1.22 + index * 0.12, 0]} castShadow>
            <sphereGeometry args={[0.18, 16, 12]} />
            <meshStandardMaterial
              color={index === 1 ? '#f2c9d2' : '#c85f7d'}
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Headphones() {
  return (
    <group position={[1.58, 1.9, -1.18]} rotation={[Math.PI / 2, 0.05, -0.25]} scale={0.72}>
      <mesh castShadow>
        <torusGeometry args={[0.44, 0.07, 14, 32, Math.PI]} />
        <meshStandardMaterial color="#4a3644" roughness={0.5} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <RoundedBox key={x} args={[0.18, 0.38, 0.2]} radius={0.07} position={[x, 0, 0]} castShadow>
          <meshStandardMaterial color="#b95a78" roughness={0.62} />
        </RoundedBox>
      ))}
    </group>
  )
}

function SketchbookCorner() {
  return (
    <group position={[1.55, 0.08, 1.28]} rotation={[0, -0.22, 0]}>
      <mesh position={[-0.42, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0.05]} castShadow>
        <boxGeometry args={[0.78, 1.02, 0.07]} />
        <meshStandardMaterial color="#f4eee8" roughness={0.9} />
      </mesh>
      <mesh position={[0.42, 0.03, 0]} rotation={[-Math.PI / 2, 0, -0.05]} castShadow>
        <boxGeometry args={[0.78, 1.02, 0.07]} />
        <meshStandardMaterial color="#f0e7e1" roughness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.12, 0.12]} rotation={[0, 0, Math.PI / 2.6]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 1.08, 10]} />
        <meshStandardMaterial color="#b66f83" roughness={0.65} />
      </mesh>
      <mesh position={[-0.44, 0.1, 0.12]} rotation={[-Math.PI / 2, 0, 0.05]}>
        <planeGeometry args={[0.48, 0.08]} />
        <meshStandardMaterial color="#c8a070" />
      </mesh>
      <mesh position={[0.38, 0.1, -0.08]} rotation={[-Math.PI / 2, 0, -0.05]}>
        <planeGeometry args={[0.42, 0.08]} />
        <meshStandardMaterial color="#9aae9f" />
      </mesh>
    </group>
  )
}

/**
 * The right-hand end wall, built as framing timber around two real openings.
 *
 * A boolean cut is not available here, so the wall is assembled from a bottom
 * strip, a top strip and three columns; the gaps between them *are* the windows.
 * This is the only face of the cabin whose outside is turned towards the camera,
 * so two lit panes do most of the work of making the island read as inhabited
 * after dark — the reference site gets the same effect from a single warm
 * rectangle in an otherwise black silhouette.
 *
 * It deliberately stops short of the open front (`FRONT_X`). A full-depth slab
 * turned the right third of the room into a pocket the camera can never see
 * into, and the AI console was parked in it: opening that chapter framed a blank
 * wall. The focus probe in `World.tsx` now asserts this stays fixed.
 *
 * Local axes inside this group: +x runs along the wall (world −z), +z points
 * outward, away from the room (world +x).
 */
function WindowWall({ isNight }: { isNight: boolean }) {
  const frame = isNight ? '#241a2b' : '#b39481'
  const wall = isNight ? '#2c2131' : '#c2a695'

  // Wall extent along its own length. BACK_X meets the back wall; FRONT_X is
  // where it stops so the sight line into the right of the room stays open.
  const BACK_X = 2.275
  const FRONT_X = -1.35
  const width = BACK_X - FRONT_X
  const midX = (BACK_X + FRONT_X) / 2

  const openingY = 0.4
  const openingH = 1.9
  const openingW = 1.2
  // Two openings with a narrow mullion column between them.
  const centres = [FRONT_X + 0.35 + openingW / 2, BACK_X - 0.575 - openingW / 2]
  const gapStart = centres[0] + openingW / 2
  const gapEnd = centres[1] - openingW / 2

  const panels: Array<{ key: string; args: [number, number, number]; pos: [number, number, number] }> = [
    { key: 'sill-course', args: [width, 1.85, 0.18], pos: [midX, -1.475, 0] },
    { key: 'header-course', args: [width, 1.05, 0.18], pos: [midX, 1.875, 0] },
    {
      key: 'post-front',
      args: [centres[0] - openingW / 2 - FRONT_X, openingH, 0.18],
      pos: [(FRONT_X + centres[0] - openingW / 2) / 2, openingY, 0],
    },
    {
      key: 'post-mid',
      args: [gapEnd - gapStart, openingH, 0.18],
      pos: [(gapStart + gapEnd) / 2, openingY, 0],
    },
    {
      key: 'post-back',
      args: [BACK_X - (centres[1] + openingW / 2), openingH, 0.18],
      pos: [(BACK_X + centres[1] + openingW / 2) / 2, openingY, 0],
    },
  ]

  return (
    <group position={[5.12, 2.65, -0.52]} rotation={[0, Math.PI / 2, 0]}>
      {panels.map(({ key, args, pos }) => (
        <mesh key={key} name={`wall-${key}`} position={pos} receiveShadow castShadow>
          <boxGeometry args={args} />
          <meshStandardMaterial color={wall} roughness={0.95} />
        </mesh>
      ))}

      {centres.map((cx) => (
        <group key={cx} position={[cx, openingY, 0]}>
          {/* Glass. Warm and self-lit after dark; a cool sky reflection by day. */}
          <mesh name="window-glass">
            <planeGeometry args={[openingW, openingH]} />
            <meshStandardMaterial
              color={isNight ? '#ffd8a2' : '#cfdce2'}
              emissive={isNight ? '#ff9f4f' : '#9fb6c4'}
              emissiveIntensity={isNight ? 2.4 : 0.34}
              roughness={0.3}
              side={2}
            />
          </mesh>

          {/* Mullions split each opening into four panes. */}
          <mesh name="window-mullion-v" position={[0, 0, 0.05]} castShadow>
            <boxGeometry args={[0.06, openingH, 0.07]} />
            <meshStandardMaterial color={frame} roughness={0.9} />
          </mesh>
          <mesh name="window-mullion-h" position={[0, 0.05, 0.05]} castShadow>
            <boxGeometry args={[openingW, 0.06, 0.07]} />
            <meshStandardMaterial color={frame} roughness={0.9} />
          </mesh>

          {/* Casing around the opening. */}
          {(
            [
              [[openingW + 0.16, 0.11, 0.09], [0, openingH / 2 + 0.05, 0.06]],
              [[openingW + 0.16, 0.11, 0.09], [0, -openingH / 2 - 0.05, 0.06]],
              [[0.11, openingH, 0.09], [-openingW / 2 - 0.05, 0, 0.06]],
              [[0.11, openingH, 0.09], [openingW / 2 + 0.05, 0, 0.06]],
            ] as Array<[[number, number, number], [number, number, number]]>
          ).map(([args, pos], index) => (
            <mesh key={index} name={`window-casing-${index}`} position={pos} castShadow>
              <boxGeometry args={args} />
              <meshStandardMaterial color={frame} roughness={0.9} />
            </mesh>
          ))}

          {/* Outside ledge, to catch the low sun and cast a small shadow. */}
          <mesh name="window-ledge" position={[0, -openingH / 2 - 0.13, 0.14]} castShadow>
            <boxGeometry args={[openingW + 0.42, 0.1, 0.4]} />
            <meshStandardMaterial color={frame} roughness={0.92} />
          </mesh>
        </group>
      ))}

      {/* One shared spill light for both openings rather than one each: the
          glow has to be a light source and not a sticker, but a forward renderer
          pays for every light on every lit fragment. */}
      <pointLight
        position={[(centres[0] + centres[1]) / 2, openingY, -0.75]}
        intensity={isNight ? 8 : 1.8}
        distance={isNight ? 5.2 : 3}
        decay={2}
        color="#ffc287"
      />
    </group>
  )
}

/**
 * A cutaway cabin shell: a shed roof, its beams and two front posts.
 *
 * The room used to be two bare floating wall planes, which read as "furniture
 * on a disc" rather than a place. A roof gives the island a recognisable
 * silhouette (the plantpot.studio cabin does the same job) while the open front
 * keeps every interactive object visible — the camera sits low enough that the
 * sight line to the desk passes far below the roof edge.
 */
function CabinShell({ isNight }: { isNight: boolean }) {
  const beam = isNight ? '#3a2b39' : '#a58779'
  const shingle = isNight ? '#332634' : '#96786d'
  const slope = Math.atan2(1.05, 3.55)

  return (
    <group>
      {/* Roof slab: high at the back wall, lower over the open front. */}
      <group position={[0, 5.12, -1.05]} rotation={[-slope, 0, 0]}>
        <RoundedBox name="roof-slab" args={[11.35, 0.2, 4.15]} radius={0.06} castShadow receiveShadow>
          <meshStandardMaterial color={shingle} roughness={0.95} />
        </RoundedBox>
        {/* Shingle rows for a little texture in raking light. */}
        {[-1.35, -0.3, 0.75].map((z) => (
          <mesh key={z} name={`roof-shingle-${z}`} position={[0, 0.12, z]} receiveShadow>
            <boxGeometry args={[11.1, 0.06, 0.9]} />
            <meshStandardMaterial color={isNight ? '#3b2c3c' : '#a2857a'} roughness={0.98} />
          </mesh>
        ))}
        {/* Fascia along the front edge. */}
        <mesh name="roof-fascia" position={[0, -0.02, 2.14]} castShadow>
          <boxGeometry args={[11.35, 0.3, 0.16]} />
          <meshStandardMaterial color={beam} roughness={0.9} />
        </mesh>
      </group>

      {/* Exposed rafters under the slab. */}
      {[-4.6, -2.3, 0, 2.3, 4.6].map((x) => (
        <mesh
          key={x}
          name={`roof-rafter-${x}`}
          position={[x, 5.0, -1.05]}
          rotation={[-slope, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.16, 0.14, 4.05]} />
          <meshStandardMaterial color={beam} roughness={0.9} />
        </mesh>
      ))}

      {/* Front posts holding the low edge of the roof. */}
      {[-5.12, 5.12].map((x) => (
        <mesh key={x} name={`cabin-post-${x}`} position={[x, 2.3, 0.86]} castShadow>
          <cylinderGeometry args={[0.14, 0.17, 4.6, 12]} />
          <meshStandardMaterial color={beam} roughness={0.92} />
        </mesh>
      ))}

      {/* Header beam tying the two posts together. */}
      <mesh name="cabin-header-beam" position={[0, 4.52, 0.86]} castShadow>
        <boxGeometry args={[10.6, 0.22, 0.22]} />
        <meshStandardMaterial color={beam} roughness={0.9} />
      </mesh>

      {/* Right-hand end wall so the cabin is not open on three sides. It carries
          the two windows, which is why it is framed rather than a single slab. */}
      <WindowWall isNight={isNight} />
    </group>
  )
}

export function Room() {
  const isNight = useWorldStore((state) => state.theme === 'night')

  return (
    <group>
      <FloatingIsland isNight={isNight} />

      <group position={[-1.05, 0.42, 0]}>
        <mesh name="wall-back" position={[0, 2.65, -2.7]} receiveShadow castShadow>
          <boxGeometry args={[10.4, 4.8, 0.18]} />
          <meshStandardMaterial color={isNight ? '#3d2c3e' : '#d5c0ae'} roughness={0.95} />
        </mesh>
        <mesh name="wall-left" position={[-5.12, 2.65, -0.52]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.55, 4.8, 0.18]} />
          <meshStandardMaterial color={isNight ? '#2c2131' : '#c2a695'} roughness={0.95} />
        </mesh>
        <mesh name="cabin-floor" position={[0.2, -0.08, -0.55]} rotation={[-Math.PI / 2, 0, -0.02]} receiveShadow>
          <planeGeometry args={[5.7, 4.1]} />
          <meshStandardMaterial color={isNight ? '#633b50' : '#c9a7ae'} roughness={1} />
        </mesh>

        <CabinShell isNight={isNight} />

        <Desk />
        <Chair />
        <DeskLamp isNight={isNight} />
        <FlowerVase />
        <Headphones />
        <SketchbookCorner />
        <Laptop isNight={isNight} />
        <PrototypeDeck />
        <PhotoWall />
        <GraduationCap />
        <Books />
        <PaintingEasel />
        <AICreativeConsole isNight={isNight} />
        <CandleSconce isNight={isNight} />
        <FutureArtwork />
      </group>
    </group>
  )
}
