import assert from 'node:assert/strict'
import { archiveProjects, featuredProjects } from '../src/data/projects.ts'
import { buildIsland } from '../src/scene/IslandSculptures.ts'

// Mirrors the scene's destination order: pink island, featured ring, archive ring.
const destinations=[{slug:'about',featured:true},...featuredProjects,...archiveProjects]
let triangles=0
for(const [index,item] of destinations.entries()){
  const geometry=buildIsland(item.slug,index,item.category)
  const repeat=buildIsland(item.slug,index,item.category)
  const position=geometry.getAttribute('position')
  assert.equal(geometry.index,null,'Static island geometry must be merged and nonindexed')
  assert.equal(position.count,geometry.getAttribute('color').count)
  assert.equal(position.count,geometry.getAttribute('normal').count)
  assert.ok(Array.from(position.array).every(Number.isFinite),`${item.slug}: invalid position`)
  assert.deepEqual(position.array,repeat.getAttribute('position').array,`${item.slug}: nondeterministic geometry`)
  geometry.computeBoundingBox()
  const depth=item.featured?5:3.5, height=item.featured?2:1.3
  assert.ok(geometry.boundingBox.min.y < -depth,`${item.slug}: missing deep rock base`)
  assert.ok(geometry.boundingBox.max.y > height,`${item.slug}: missing thematic structures`)
  const count=position.count/3
  if(!item.featured)assert.ok(count<9000,`${item.slug}: archive island over budget (${count})`)
  triangles+=count
  console.log(`${item.slug}: ${count} triangles, finite, deterministic, full rock base`)
  geometry.dispose();repeat.dispose()
}
assert.ok(triangles<230000,'Island sculpture budget exceeded')
console.log(`PASS: ${destinations.length} island sculptures, ${triangles} total triangles (environment excluded).`)
