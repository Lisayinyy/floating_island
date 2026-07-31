import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Group, MathUtils } from 'three'
import { useWorldStore } from '../store/worldStore'
import type { ThreeEvent } from '@react-three/fiber'
import type { PropsWithChildren } from 'react'
import type { WorldItemId } from '../store/worldStore'

type InteractiveObjectProps = PropsWithChildren<{
  id: WorldItemId
  label: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}>

export function InteractiveObject({
  id,
  label,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  children,
}: InteractiveObjectProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const setActiveItem = useWorldStore((state) => state.setActiveItem)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const targetScale = hovered ? scale * 1.035 : scale
    const nextScale = MathUtils.damp(groupRef.current.scale.x, targetScale, 9, delta)
    groupRef.current.scale.setScalar(nextScale)
  })

  const handleHover = (event: ThreeEvent<PointerEvent>, isHovered: boolean) => {
    event.stopPropagation()
    setHovered(isHovered)
    document.body.classList.toggle('is-interacting', isHovered)
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={(event) => handleHover(event, true)}
      onPointerOut={(event) => handleHover(event, false)}
      onClick={(event) => {
        event.stopPropagation()
        setActiveItem(id)
      }}
    >
      {children}
      {hovered && (
        <Html center position={[0, 1.45, 0]} distanceFactor={9}>
          <span className="object-label">{label}</span>
        </Html>
      )}
    </group>
  )
}
