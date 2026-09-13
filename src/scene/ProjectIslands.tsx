import { ContactShadows, Html, Line, OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DoubleSide, Group, ShaderMaterial, Vector3 } from 'three'
import type { OrbitControls as OrbitType } from 'three-stdlib'
import { archiveProjects, featuredProjects } from '../data/projects'
import type { Project } from '../data/projects'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { buildBoat, buildIsland, buildRoute, buildSatellites, buildWake } from './IslandSculptures'

type V=[number,number,number]
type Destination=Pick<Project,'slug'|'title'>&Partial<Pick<Project,'category'|'featured'>>
// Index 0 is the pink island. Featured islands fill the inner ring, the archive the outer one.
const destinations:Destination[]=[{slug:'about',title:'About Lisa',featured:true},...featuredProjects,...archiveProjects]
const featuredCount=featuredProjects.length
const archiveCount=archiveProjects.length
const INNER_RADIUS=12.5,OUTER_RADIUS=24
const shortTitles:Record<string,string>={'wu-guanzhong-ink':'Ink Translate','lisa-trading':'Lisa Trading','3d-letter-gallery':'Letter Gallery',temple:'Voxel Palace','xiaohongshu-monitor':'XHS Monitor','vc-llm':'LLM Investors','quant-jargon-compiler':'Quant Jargon','a-share-premarket':'Pre-market Scan','a-stock-quick-scan':'Quick Scan','serenity-skill':'Serenity Skills','video-quote-cards':'Quote Cards'}
function islandPosition(i:number):V {
  if(!i)return [0,.8,0]
  if(i<=featuredCount){const angle=(i-1)/featuredCount*Math.PI*2+Math.PI/6;return [Math.cos(angle)*INNER_RADIUS,Math.sin(i*2)*.6,Math.sin(angle)*INNER_RADIUS]}
  const k=i-featuredCount-1;const angle=(k+.5)/archiveCount*Math.PI*2+Math.PI/6
  return [Math.cos(angle)*OUTER_RADIUS,-1.1+Math.sin(k*1.7)*.5,Math.sin(angle)*OUTER_RADIUS]
}
function Sculpture({index,selected,quiet,onSelect}:{index:number;selected:boolean;quiet:boolean;onSelect:(slug:string)=>void}){
  const anchor=useRef<Group>(null)
  const reduced=useReducedMotion()
  const p=islandPosition(index)
  const item=destinations[index]
  const archive=!item.featured
  const geometry=useMemo(()=>buildIsland(item.slug,index,item.category),[item.slug,index,item.category])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  useFrame(({clock})=>{if(anchor.current)anchor.current.position.y=p[1]+(reduced?0:Math.sin(clock.elapsedTime*.45+index)*.08)})
  return <group ref={anchor} position={p} onClick={e=>{if(e.delta>5)return;e.stopPropagation();onSelect(item.slug)}}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.88} side={DoubleSide}/></mesh>
    <ContactShadows position={[0,.18,0]} scale={archive?6.4:8.6} opacity={.33} blur={1.8} far={7} resolution={128} frames={1} color="#8e765e"/>
    <Html position={[0,-.18,archive?2.7:3.65]} center zIndexRange={[15,1]}><button className={`world-island-label ${archive?'archive':''} ${selected?'selected':''} ${archive&&quiet&&!selected?'quiet':''}`} onClick={e=>{e.stopPropagation();onSelect(item.slug)}} aria-pressed={selected}><span>{String(index).padStart(2,'0')}</span>{shortTitles[item.slug]??item.title}</button></Html>
  </group>
}
function Ocean(){
  const material=useRef<ShaderMaterial>(null)
  const reduced=useReducedMotion()
  const uniforms=useMemo(()=>({uTime:{value:0}}),[])
  useFrame(({clock})=>{if(material.current&&!reduced)material.current.uniforms.uTime.value=clock.elapsedTime*.07})
  return <mesh position={[0,-7,0]} rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[220,220]}/>
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={`varying vec2 vPosition; void main(){vPosition=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`
      varying vec2 vPosition; uniform float uTime;
      vec2 hash(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
      void main(){vec2 p=vPosition*.8+vec2(uTime*.25,uTime*.11);p+=vec2(sin(p.y*2.+uTime),sin(p.x*1.7+uTime))*.17;vec2 cell=floor(p),f=fract(p);float d1=9.,d2=9.;
      for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 q=vec2(float(i),float(j));vec2 o=hash(cell+q);o=.5+.36*sin(uTime+6.2831*o);float d=length(q+o-f);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}
      float edge=1.-smoothstep(.01,.055,d2-d1);float ripple=sin(p.x*2.+sin(p.y*1.5)+uTime)*.5+.5;
      vec3 water=mix(vec3(.81,.86,.86),vec3(.88,.9,.87),ripple*.4);water=mix(water,vec3(.97,.97,.94),edge*.22);
      float mist=smoothstep(12.,40.,length(vPosition));gl_FragColor=vec4(mix(water,vec3(.974,.958,.925),mist),1.);}
    `}/>
  </mesh>
}
function Surroundings(){
  const satellites=useMemo(()=>buildSatellites(),[])
  const boat=useMemo(()=>buildBoat(),[])
  const wake=useMemo(()=>buildWake(),[])
  const boatGroup=useRef<Group>(null)
  const reduced=useReducedMotion()
  useEffect(()=>()=>{satellites.dispose();boat.dispose();wake.dispose()},[satellites,boat,wake])
  useFrame(({clock})=>{if(boatGroup.current&&!reduced){boatGroup.current.position.y=-6.8+Math.sin(clock.elapsedTime*.7)*.06;boatGroup.current.rotation.z=Math.sin(clock.elapsedTime*.6)*.025}})
  const routes=useMemo(()=>{
    const ring=(from:number,count:number,drop:number)=>Array.from({length:count},(_,i)=>{const a=islandPosition(from+i),b=islandPosition(from+(i+1)%count);return buildRoute([a[0],a[1]-.1,a[2]],[b[0],b[1]-.1,b[2]],drop).getPoints(48)})
    return [...ring(1,featuredCount,1.6),...ring(featuredCount+1,archiveCount,.9)]
  },[])
  return <>
    <mesh geometry={satellites} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>
    {routes.map((points,i)=><Line key={i} points={points} color="#fffcf0" lineWidth={1.3} dashed dashSize={.22} gapSize={.16} transparent opacity={.6}/>)}
    <group ref={boatGroup} position={[6,-6.8,7]} rotation={[0,.65,0]}><mesh geometry={boat}><meshStandardMaterial vertexColors roughness={.85} side={DoubleSide}/></mesh><mesh geometry={wake} position={[0,-.07,0]}><meshBasicMaterial color="#fff9e9" transparent opacity={.65}/></mesh></group>
    {Array.from({length:24},(_,i)=>{const a=i*2.399,r=34+i%3*8;return <group key={i} position={[Math.cos(a)*r,-4+i%3*.5,Math.sin(a)*r]}>{[0,1,2].map(j=><mesh key={j} position={[j*2,j%2*.4,0]} scale={[4.5,2+j*.35,3.5]}><sphereGeometry args={[1,16,12]}/><shaderMaterial transparent depthWrite={false} vertexShader={`varying vec3 n; varying vec3 view; void main(){vec4 p=modelViewMatrix*vec4(position,1.);view=-p.xyz;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`} fragmentShader={`varying vec3 n; varying vec3 view;void main(){float alpha=pow(max(dot(normalize(n),normalize(view)),0.),1.5)*.55;gl_FragColor=vec4(1.,.985,.96,alpha);}`}/></mesh>)}</group>})}
  </>
}
// Beyond this camera distance the outer ring's labels collide on a phone, so they step back to the model only.
const QUIET_DISTANCE=95
function Camera({selection,reset,onReady,onFar}:{selection:string|null;reset:number;onReady:()=>void;onFar:(far:boolean)=>void}){
  const controls=useRef<OrbitType>(null)
  const {camera,size,gl,scene}=useThree()
  const reduced=useReducedMotion()
  const moving=useRef(true),ready=useRef(false)
  const desired=useRef({position:new Vector3(),target:new Vector3()})
  const far=useRef(false)
  useEffect(()=>{const i=destinations.findIndex(d=>d.slug===selection),mobile=size.width<700
    if(i<0){const s=(mobile?1.6:1)*(archiveCount?1.62:1);desired.current.position.set(16*s,27*s,31*s);desired.current.target.set(mobile?0:-2.5,-.5,mobile?0:-1.5)}
    else{const [x,y,z]=islandPosition(i);desired.current.position.set(x+9.5,y+8.8,z+15.5);desired.current.target.set(x+(mobile?0:3),y+1.1,z)}
    moving.current=true
  },[selection,reset,size.width])
  useFrame((_,delta)=>{
    if(controls.current&&moving.current){const a=reduced?1:1-Math.exp(-delta*3.5);camera.position.lerp(desired.current.position,a);controls.current.target.lerp(desired.current.target,a);controls.current.update();if(camera.position.distanceTo(desired.current.position)<.025)moving.current=false}
    if(controls.current){const isFar=camera.position.distanceTo(controls.current.target)>QUIET_DISTANCE;if(isFar!==far.current){far.current=isFar;onFar(isFar)}}
    if(!ready.current&&gl.info.render.frame>2){ready.current=true;let triangles=0;scene.traverse(obj=>{if('geometry'in obj){const g=obj.geometry as {index?:{count:number};attributes:{position:{count:number}}};triangles+=(g.index?.count??g.attributes.position.count)/3}});gl.domElement.dataset.sceneTriangles=String(Math.round(triangles));gl.domElement.dataset.sceneReady='true';onReady()}
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} minDistance={7} maxDistance={160} minPolarAngle={.18} maxPolarAngle={Math.PI*.47} onStart={()=>{moving.current=false}}/>
}
export default function ProjectIslands({selection,reset,onSelect,onReady}:{selection:string|null;reset:number;onSelect:(slug:string)=>void;onReady:()=>void}){
  const [far,setFar]=useState(false)
  return <>
    <fog attach="fog" args={['#f8f4ec',75,170]}/>
    <ambientLight intensity={.7}/><hemisphereLight args={['#fff3df','#a3aea4',1.1]}/>
    <directionalLight position={[-12,24,12]} intensity={2.3} color="#fff0da" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={34} shadow-camera-bottom={-34} shadow-camera-far={95} shadow-normalBias={.018} shadow-bias={-.00015}/>
    <directionalLight position={[14,12,-18]} intensity={.8} color="#e4e8e9"/>
    <Ocean/><Surroundings/>
    {destinations.map((d,i)=><Sculpture key={d.slug} index={i} selected={selection===d.slug} quiet={far} onSelect={onSelect}/>)}
    <Camera selection={selection} reset={reset} onReady={onReady} onFar={setFar}/>
  </>
}
