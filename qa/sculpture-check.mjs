import assert from 'node:assert/strict'
import { islands } from '../src/data/projects.ts'
import { buildIsland } from '../src/scene/IslandSculptures.ts'

// Mirrors the scene's destination order: pink island first, then the family ring.
const ids=['about',...islands.map((island)=>island.id)]
let triangles=0
for(const [index,id] of ids.entries()){
  const geometry=buildIsland(id,index)
  const repeat=buildIsland(id,index)
  const position=geometry.getAttribute('position')
  assert.equal(geometry.index,null,'Static island geometry must be merged and nonindexed')
  assert.equal(position.count,geometry.getAttribute('color').count)
  assert.equal(position.count,geometry.getAttribute('normal').count)
  assert.ok(Array.from(position.array).every(Number.isFinite),`${id}: invalid position`)
  assert.deepEqual(position.array,repeat.getAttribute('position').array,`${id}: nondeterministic geometry`)
  geometry.computeBoundingBox()
  assert.ok(geometry.boundingBox.min.y < -5,`${id}: missing deep rock base`)
  assert.ok(geometry.boundingBox.max.y > 2,`${id}: missing thematic structures`)
  triangles+=position.count/3
  console.log(`${id}: ${position.count/3} triangles, finite, deterministic, full rock base`)
  geometry.dispose();repeat.dispose()
}
assert.ok(triangles<150000,'Island sculpture budget exceeded')
console.log(`PASS: ${ids.length} distinct island sculptures, ${triangles} total triangles (environment excluded).`)
