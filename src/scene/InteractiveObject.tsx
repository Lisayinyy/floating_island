import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { Group, MathUtils } from 'three'
import { useWorldStore } from '../store/worldStore'
import { measureLocalTop, registerWorldObject } from './objectRegistry'
import type { ThreeEvent } from '@react-three/fiber'
import type { PropsWithChildren } from 'react'
import type { WorldItemId } from '../store/worldStore'

type InteractiveObjectProps = PropsWithChildren<{
  id: WorldItemId
  label: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  /** Clearance between the top of the object and its floating label. */
  labelGap?: number
}>

/**
 * A clickable object on the island, wrapped so that it also works without a
 * mouse.
 *
 * Pointer users get a hover lift plus a label. Keyboard users get a real
 * `<button>` living in the DOM at the object's projected position: tabbing to it
 * raises the same highlight, so the label they see is the object they will open.
 * The button keeps `pointer-events: none` — that still allows focus and Enter,
 * while making sure six invisible hit areas never steal clicks from the canvas.
 */
export function InteractiveObject({
  id,
  label,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  labelGap = 0.34,
  children,
}: InteractiveObjectProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [labelY, setLabelY] = useState(labelGap)
  const setActiveItem = useWorldStore((state) => state.setActiveItem)
  const isActive = useWorldStore((state) => state.activeItem === id)
  const highlighted = hovered || focused || isActive

  // Publish this group so the focus probe can verify the camera really sees it,
  // and measure it so the label sits just above it rather than at a fixed height.
  useEffect(() => {
    if (!groupRef.current) return
    const unregister = registerWorldObject(id, groupRef.current)
    setLabelY(measureLocalTop(groupRef.current) + labelGap)
    return unregister
  }, [id, labelGap])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const targetScale = highlighted ? scale * 1.045 : scale
    group.scale.setScalar(MathUtils.damp(group.scale.x, targetScale, 9, delta))
    // A small lift reads more clearly than scale alone on the wall-mounted
    // objects, whose growth is mostly hidden against the plane behind them.
    const targetY = position[1] + (highlighted ? 0.07 : 0)
    group.position.y = MathUtils.damp(group.position.y, targetY, 8, delta)
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
      <Html
        center
        position={[0, labelY, 0]}
        distanceFactor={9}
        zIndexRange={[8, 2]}
        style={{ pointerEvents: 'none' }}
      >
        <button
          type="button"
          className={`object-label ${highlighted ? 'is-visible' : ''}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onClick={() => setActiveItem(id)}
          aria-label={`Open chapter: ${label}`}
        >
          {label}
        </button>
      </Html>
    </group>
  )
}
