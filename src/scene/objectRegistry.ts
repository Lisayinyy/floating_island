import { Box3, Matrix4, Sphere, Vector3 } from 'three'
import type { Group, Mesh } from 'three'
import type { WorldItemId } from '../store/worldStore'

/**
 * Live map of every interactive object's group, keyed by chapter id.
 *
 * It exists so the camera can be aimed at where an object *actually is*, and so
 * the focus probe in `World.tsx` can raycast at the object a chapter claims to
 * be showing. Hand-written coordinates for either job drift the moment the scene
 * moves: the chapter aim point for the easel had wandered 1.85 units off it, and
 * the AI console had ended up behind a wall.
 */
const registry = new Map<WorldItemId, Group>()

export function registerWorldObject(id: WorldItemId, group: Group): () => void {
  registry.set(id, group)
  return () => {
    if (registry.get(id) === group) registry.delete(id)
  }
}

export function getWorldObject(id: WorldItemId): Group | undefined {
  return registry.get(id)
}

export type WorldObjectMeasure = {
  centre: Vector3
  /** Bounding-sphere radius, used to size the chapter framing. */
  radius: number
}

/**
 * Measure an object in world space, right now.
 *
 * Measured live rather than cached because the island keeps a slow float and a
 * pointer-follow tilt; the amplitudes are small, but reading the real matrix is
 * free and means the aim point can never be stale.
 */
export function measureWorldObject(id: WorldItemId): WorldObjectMeasure | null {
  const group = registry.get(id)
  if (!group) return null
  const box = new Box3().setFromObject(group)
  if (box.isEmpty()) return null
  const sphere = box.getBoundingSphere(new Sphere())
  return { centre: sphere.center, radius: Math.max(sphere.radius, 0.35) }
}

/**
 * Top of an object's own geometry, expressed in the frame its children live in.
 *
 * Used to park the floating label just above whatever the object happens to be.
 * A single hand-picked height cannot work across a knee-high laptop and a
 * head-high photo wall: at 1.45 units the laptop's "SELECTED WORK" pill floated
 * up beside the graduation cap on the shelf above it, which read as a label on
 * the wrong object.
 *
 * The group's own matrix is divided back out, so the result is in the same space
 * as a child's `position` — including the group's `scale`, which is what the
 * label's own offset is measured in.
 */
export function measureLocalTop(group: Group): number {
  group.updateWorldMatrix(true, true)
  const toLocal = group.matrixWorld.clone().invert()
  const bounds = new Box3()
  const child = new Box3()
  const matrix = new Matrix4()

  group.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    mesh.geometry.computeBoundingBox()
    if (!mesh.geometry.boundingBox) return
    child.copy(mesh.geometry.boundingBox)
    matrix.multiplyMatrices(toLocal, mesh.matrixWorld)
    bounds.union(child.applyMatrix4(matrix))
  })

  return bounds.isEmpty() ? 0 : bounds.max.y
}
