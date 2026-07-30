import { CircleGeometry, Color, Float32BufferAttribute, SphereGeometry } from 'three'

/**
 * Deterministic island silhouette helpers.
 *
 * The first version of the island was a `latheGeometry` cone, which read as a
 * spinning top: perfectly circular rim, perfectly smooth taper. Reference
 * boards (plantpot.studio) show the opposite — an irregular rock mass whose
 * silhouette is doing most of the storytelling. Everything here is generated
 * from fixed trigonometric harmonics so the shape is identical on every load
 * (no `Math.random`, so the scene never "flickers" between reloads).
 */

/**
 * One segment count for the ground disc, the cliff band and the rock body, so
 * all three resolve `rimNoise` at exactly the same angles and share a single
 * continuous outline. Deliberately low: the island is flat-shaded low-poly, and
 * chunky facets are what make it read as rock rather than as a smooth fruit.
 */
export const ISLAND_SEGMENTS = 52

/** Horizontal wobble of the rim, shared by the top surface and the rock body. */
export function rimNoise(theta: number) {
  return (
    1 +
    0.052 * Math.sin(theta * 3 + 0.7) +
    0.038 * Math.sin(theta * 5 - 1.3) +
    0.024 * Math.sin(theta * 8 + 2.15) +
    0.014 * Math.sin(theta * 13 - 0.4)
  )
}

/** Extra lumps that only affect the hanging rock, growing towards the bottom. */
function bodyNoise(theta: number, t: number) {
  // Amplitudes are fractions of the rim radius (~8 units), so 0.18 is a ~1.4
  // unit dent — big enough to survive being projected into a 900px viewport.
  // Low frequencies dominate on purpose: high-frequency wobble reads as noise,
  // low-frequency dents read as rock.
  return (
    0.175 * Math.sin(theta * 2 - 0.35) * t +
    0.115 * Math.sin(theta * 3 + 1.9) * t +
    0.082 * Math.sin(theta * 5 - 2.4) * t +
    0.058 * Math.sin(theta * 8 + 0.6) * t * t +
    0.07 * Math.sin(t * 4.1 + theta * 2) * t
  )
}

/** The mass leans as it descends, so the outline is never mirror-symmetric. */
function bodyLean(t: number): [number, number] {
  const fall = Math.pow(t, 1.55)
  return [1.55 * fall, -1.05 * fall]
}

type BodyOptions = {
  rimRadius?: number
  depth?: number
  segments?: number
}

/**
 * The rock mass hanging under the island.
 *
 * Built from a bottom-half `SphereGeometry` so the triangle winding (and
 * therefore the normals) stay correct — hand-rolled indices are the classic way
 * to end up with an island lit from the inside. Vertex colours carry a
 * top-to-bottom darkening ramp so the mass falls into shadow without needing a
 * second material.
 *
 * Height segments are kept very low (`segments * 0.2`) because the mesh is
 * flat-shaded: a handful of tall facets reads as a chiselled rock, while a dense
 * mesh reads as a smooth piece of fruit no matter how much noise is applied.
 */
export function createIslandBodyGeometry({
  rimRadius = 8.04,
  depth = 7.6,
  segments = ISLAND_SEGMENTS,
}: BodyOptions = {}) {
  const geometry = new SphereGeometry(
    1,
    segments,
    Math.max(6, Math.round(segments * 0.2)),
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2,
  )
  const position = geometry.attributes.position
  const shade: number[] = []
  const rimTint = new Color('#ffffff')
  const deepTint = new Color('#241d29')
  const tint = new Color()

  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index)
    const z = position.getZ(index)
    const x = position.getX(index)
    const theta = Math.atan2(z, x)
    // 0 at the rim, 1 at the bottom tip.
    const t = Math.min(1, Math.max(0, -y))
    // Full belly just under the rim, then a fast taper into a blunt tip.
    const bulge = Math.pow(Math.max(0, 1 - Math.pow(t, 1.5)), 0.58)
    const horizontal = rimRadius * bulge * (rimNoise(theta) + bodyNoise(theta, t))
    const verticalWobble = 1 + 0.11 * Math.sin(theta * 3 + 1.1)
    const py = -depth * Math.pow(t, 0.78) * verticalWobble
    const [leanX, leanZ] = bodyLean(t)

    position.setXYZ(
      index,
      Math.cos(theta) * horizontal + leanX,
      py,
      Math.sin(theta) * horizontal + leanZ,
    )

    tint.copy(rimTint).lerp(deepTint, Math.pow(t, 0.5))
    shade.push(tint.r, tint.g, tint.b)
  }

  geometry.setAttribute('color', new Float32BufferAttribute(shade, 3))
  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * The walkable top of the island: a disc whose edge follows the exact same
 * `rimNoise`, so the ground and the rock below share one continuous outline.
 */
export function createIslandTopGeometry({
  rimRadius = 8.04,
  segments = ISLAND_SEGMENTS,
}: {
  rimRadius?: number
  segments?: number
} = {}) {
  const geometry = new CircleGeometry(1, segments)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const z = position.getZ(index)
    const radius = Math.hypot(x, z)
    if (radius < 0.0001) continue
    const theta = Math.atan2(z, x)
    const scaled = rimRadius * rimNoise(theta) * radius
    position.setXYZ(index, Math.cos(theta) * scaled, 0, Math.sin(theta) * scaled)
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * A short cliff band that hides the seam between the ground disc and the rock
 * mass, and gives the rim a bit of thickness when seen from a low angle.
 */
export function createIslandRimGeometry({
  rimRadius = 8.04,
  height = 0.62,
  segments = ISLAND_SEGMENTS,
}: {
  rimRadius?: number
  height?: number
  segments?: number
} = {}) {
  const geometry = new SphereGeometry(1, segments, 6, 0, Math.PI * 2, Math.PI / 2, 0.32)
  const position = geometry.attributes.position

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const y = position.getY(index)
    const z = position.getZ(index)
    const theta = Math.atan2(z, x)
    const t = Math.min(1, Math.max(0, -y / Math.sin(0.32)))
    const horizontal = rimRadius * rimNoise(theta) * (1 - 0.035 * t)
    position.setXYZ(index, Math.cos(theta) * horizontal, -height * t, Math.sin(theta) * horizontal)
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

export type RockLump = {
  position: [number, number, number]
  scale: [number, number, number]
  rotation: [number, number, number]
  tone: number
}

/**
 * Boulders clamped onto the hanging rock so the silhouette gets bumps instead
 * of a clean mathematical curve.
 */
export function createRockLumps({
  rimRadius = 8.04,
  depth = 7.6,
}: {
  rimRadius?: number
  depth?: number
} = {}): RockLump[] {
  const seeds: Array<[number, number, number]> = [
    // [theta, t (0 rim → 1 tip), size]
    [0.35, 0.22, 1.35],
    [1.45, 0.36, 1.05],
    [2.5, 0.16, 1.2],
    [3.35, 0.4, 0.9],
    [4.2, 0.26, 1.12],
    [5.15, 0.48, 0.8],
    [5.85, 0.18, 1.0],
    [2.05, 0.62, 0.66],
    [4.75, 0.72, 0.56],
  ]

  return seeds.map(([theta, t, size], index) => {
    const bulge = Math.pow(Math.max(0, 1 - Math.pow(t, 1.5)), 0.58)
    // 0.92 keeps each boulder half-buried in the rock while still breaking the
    // outline; fully embedded boulders were invisible in the rendered frame.
    const horizontal = rimRadius * bulge * (rimNoise(theta) + bodyNoise(theta, t)) * 0.92
    const y = -depth * Math.pow(t, 0.78)
    const [leanX, leanZ] = bodyLean(t)

    return {
      position: [Math.cos(theta) * horizontal + leanX, y, Math.sin(theta) * horizontal + leanZ],
      scale: [size, size * (0.62 + 0.22 * Math.sin(theta * 3)), size * 0.92],
      rotation: [theta * 0.6, theta, index * 0.37],
      tone: index % 3,
    }
  })
}
