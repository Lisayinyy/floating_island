import { RoundedBox } from '@react-three/drei'
import { InteractiveObject } from './InteractiveObject'

const dark = '#272724'
const cream = '#d8d0c2'
const wood = '#9b6749'
const red = '#d85039'

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

function Laptop() {
  return (
    <InteractiveObject id="work" label="SELECTED WORK" position={[0.4, 1.82, -1.52]} scale={0.9}>
      <mesh position={[0, 0.34, 0]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[1.45, 0.86, 0.08]} />
        <meshStandardMaterial color={dark} metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.34, 0.046]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[1.25, 0.66]} />
        <meshStandardMaterial color="#b9d6cf" emissive="#538c83" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, -0.04, 0.34]} rotation={[0.05, 0, 0]} castShadow>
        <boxGeometry args={[1.55, 0.08, 0.92]} />
        <meshStandardMaterial color={dark} metalness={0.2} roughness={0.5} />
      </mesh>
    </InteractiveObject>
  )
}

function PrototypeDeck() {
  return (
    <InteractiveObject id="philosophy" label="HOW I WORK" position={[-3.55, 1.02, -1.66]}>
      <RoundedBox args={[2.25, 0.82, 1.2]} radius={0.04} castShadow>
        <meshStandardMaterial color={dark} roughness={0.75} />
      </RoundedBox>
      <mesh position={[-0.55, 0.48, 0]} castShadow>
        <boxGeometry args={[0.58, 0.08, 0.72]} />
        <meshStandardMaterial color="#d85039" roughness={0.6} />
      </mesh>
      <mesh position={[0.1, 0.48, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.72]} />
        <meshStandardMaterial color="#d6aa58" roughness={0.65} />
      </mesh>
      <mesh position={[0.65, 0.48, 0]} castShadow>
        <boxGeometry args={[0.35, 0.08, 0.72]} />
        <meshStandardMaterial color="#58726b" roughness={0.65} />
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

function Camera() {
  return (
    <InteractiveObject id="about" label="ABOUT LISA" position={[2.35, 2.08, -1.54]} scale={0.75}>
      <RoundedBox args={[1.15, 0.72, 0.58]} radius={0.1} castShadow>
        <meshStandardMaterial color={dark} roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0, 0.34]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.34, 0.38, 32]} />
        <meshStandardMaterial color="#151513" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.19, 32]} />
        <meshStandardMaterial color="#516d72" metalness={0.2} roughness={0.18} />
      </mesh>
      <mesh position={[-0.34, 0.43, 0]}>
        <boxGeometry args={[0.28, 0.18, 0.35]} />
        <meshStandardMaterial color={dark} />
      </mesh>
    </InteractiveObject>
  )
}

function Books() {
  return (
    <InteractiveObject id="experience" label="EXPERIENCE + EDUCATION" position={[-0.6, 3.26, -2.43]} scale={0.8}>
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <boxGeometry args={[2.3, 0.12, 0.58]} />
        <meshStandardMaterial color={wood} roughness={0.7} />
      </mesh>
      {[
        [-0.62, 0.1, '#c85b45'],
        [-0.34, 0.02, '#e0d8c6'],
        [-0.08, 0.13, '#58726b'],
        [0.22, 0.07, '#d6aa58'],
      ].map(([x, tilt, color], index) => (
        <mesh key={index} position={[x as number, 0.02, 0]} rotation={[0, 0, tilt as number]} castShadow>
          <boxGeometry args={[0.23, 0.72 + index * 0.04, 0.42]} />
          <meshStandardMaterial color={color as string} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.72, 0, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.22, 0.55, 18]} />
        <meshStandardMaterial color="#6d8265" roughness={0.85} />
      </mesh>
      <mesh position={[0.72, 0.55, 0]}>
        <sphereGeometry args={[0.38, 18, 12]} />
        <meshStandardMaterial color="#799370" roughness={0.9} />
      </mesh>
    </InteractiveObject>
  )
}

function AICreativeConsole() {
  return (
    <InteractiveObject id="toolkit" label="AI CREATIVE TOOLKIT" position={[3.25, 1.08, -1.72]} scale={0.9}>
      <RoundedBox args={[1.75, 1.85, 0.82]} radius={0.08} castShadow>
        <meshStandardMaterial color={dark} roughness={0.62} metalness={0.12} />
      </RoundedBox>
      <mesh position={[0, 0.28, 0.43]}>
        <planeGeometry args={[1.35, 0.82]} />
        <meshStandardMaterial color="#b9d6cf" emissive="#538c83" emissiveIntensity={0.55} />
      </mesh>
      {[-0.35, 0, 0.35].map((x, index) => (
        <mesh key={x} position={[x, -0.48, 0.46]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.06, 24]} />
          <meshStandardMaterial
            color={index === 0 ? red : index === 1 ? '#d6aa58' : '#6d8265'}
            emissive={index === 0 ? red : '#000000'}
            emissiveIntensity={0.22}
          />
        </mesh>
      ))}
      <mesh position={[-0.52, 1.05, 0.12]} rotation={[0.05, 0, -0.1]} castShadow>
        <boxGeometry args={[0.72, 0.5, 0.04]} />
        <meshStandardMaterial color="#f0e7d8" roughness={0.9} />
      </mesh>
      <mesh position={[0.34, 1.12, 0.08]} rotation={[-0.04, 0, 0.13]} castShadow>
        <boxGeometry args={[0.72, 0.5, 0.04]} />
        <meshStandardMaterial color="#d98f6f" roughness={0.9} />
      </mesh>
    </InteractiveObject>
  )
}

function Chair() {
  return (
    <group position={[0.6, 0.64, 0.4]} rotation={[0, -0.12, 0]}>
      <RoundedBox args={[1.38, 0.25, 1.22]} radius={0.16} position={[0, 0.62, 0]} castShadow>
        <meshStandardMaterial color="#4d514d" roughness={0.78} />
      </RoundedBox>
      <RoundedBox args={[1.32, 1.4, 0.24]} radius={0.16} position={[0, 1.32, 0.48]} rotation={[-0.12, 0, 0]} castShadow>
        <meshStandardMaterial color="#414541" roughness={0.8} />
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

export function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 13]} />
        <meshStandardMaterial color="#d8d4ca" roughness={0.92} />
      </mesh>
      <mesh position={[0, 3.5, -2.7]} receiveShadow>
        <planeGeometry args={[14, 7]} />
        <meshStandardMaterial color="#d6d2c8" roughness={0.95} />
      </mesh>
      <mesh position={[-6.95, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[5.4, 7]} />
        <meshStandardMaterial color="#cbc8bf" roughness={0.95} />
      </mesh>
      <mesh position={[0.2, 0.014, -0.55]} rotation={[-Math.PI / 2, 0, -0.02]} receiveShadow>
        <planeGeometry args={[5.7, 4.1]} />
        <meshStandardMaterial color="#9a6252" roughness={1} />
      </mesh>

      <Desk />
      <Chair />
      <Laptop />
      <PrototypeDeck />
      <Camera />
      <Books />
      <AICreativeConsole />

      <mesh position={[-3.55, 2.74, -2.64]}>
        <boxGeometry args={[1.7, 1.18, 0.08]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      <mesh position={[-3.55, 2.74, -2.59]}>
        <planeGeometry args={[1.48, 0.96]} />
        <meshStandardMaterial color="#d65b47" />
      </mesh>
      <mesh position={[1.05, 3.46, -2.63]}>
        <boxGeometry args={[2.35, 1.45, 0.09]} />
        <meshStandardMaterial color={dark} />
      </mesh>
      <mesh position={[1.05, 3.46, -2.57]}>
        <planeGeometry args={[2.06, 1.17]} />
        <meshStandardMaterial color="#506e68" />
      </mesh>
    </group>
  )
}
