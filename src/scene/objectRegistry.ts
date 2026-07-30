import type { Group } from 'three'
import type { WorldItemId } from '../store/worldStore'

/**
 * Live map of every interactive object's group, keyed by chapter id.
 *
 * It exists so the focus probe in `World.tsx` can raycast at the *actual* object
 * a chapter claims to be showing. Camera framing is derived arithmetic, and
 * arithmetic that looks right in the code can still put the cabin roof between
 * the camera and the graduation cap — a DOM-only test never notices.
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
