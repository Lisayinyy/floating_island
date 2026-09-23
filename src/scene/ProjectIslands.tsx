import { ContactShadows, Html, Line, OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { DoubleSide, Group, ShaderMaterial, Vector3 } from 'three'
import type { OrbitControls as OrbitType } from 'three-stdlib'
import { islands } from '../data/projects'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { buildBoat, buildIsland, buildRoute, buildSatellites, buildWake } from './IslandSculptures'

type V=[number,number,number]
// Index 0 is the pink island in the middle; the five family islands ring it.
const destinations=[{id:'about'},...islands]
const RING=islands.length,RADIUS=12.5
function islandPosition(i:number):V {
  if(!i)return [0,.8,0]
  const angle=(i-1)/RING*Math.PI*2+Math.PI/6
  return [Math.cos(angle)*RADIUS,Math.sin(i*2)*.6,Math.sin(angle)*RADIUS]
}
function Sculpture({index,label,selected,onSelect}:{index:number;label:string;selected:boolean;onSelect:(id:string)=>void}){
  const anchor=useRef<Group>(null)
  const reduced=useReducedMotion()
  const p=islandPosition(index)
  const item=destinations[index]
  const geometry=useMemo(()=>buildIsland(item.id,index),[item.id,index])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  useFrame(({clock})=>{if(anchor.current)anchor.current.position.y=p[1]+(reduced?0:Math.sin(clock.elapsedTime*.45+index)*.08)})
  return <group ref={anchor} position={p} onClick={e=>{if(e.delta>5)return;e.stopPropagation();onSelect(item.id)}}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.88} side={DoubleSide}/></mesh>
    <ContactShadows position={[0,.18,0]} scale={8.6} opacity={.33} blur={1.8} far={7} resolution={128} frames={1} color="#8e765e"/>
    <Html position={[0,-.18,3.65]} center zIndexRange={[15,1]}><button className={`world-island-label ${selected?'selected':''}`} onClick={e=>{e.stopPropagation();onSelect(item.id)}} aria-pressed={selected}><span>{String(index).padStart(2,'0')}</span>{label}</button></Html>
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
  const routes=useMemo(()=>Array.from({length:RING},(_,i)=>{const a=islandPosition(i+1),b=islandPosition((i+1)%RING+1);return buildRoute([a[0],a[1]-.1,a[2]],[b[0],b[1]-.1,b[2]]).getPoints(48)}),[])
  return <>
    <mesh geometry={satellites} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={1}/></mesh>
    {routes.map((points,i)=><Line key={i} points={points} color="#fffcf0" lineWidth={1.3} dashed dashSize={.22} gapSize={.16} transparent opacity={.6}/>)}
    <group ref={boatGroup} position={[6,-6.8,7]} rotation={[0,.65,0]}><mesh geometry={boat}><meshStandardMaterial vertexColors roughness={.85} side={DoubleSide}/></mesh><mesh geometry={wake} position={[0,-.07,0]}><meshBasicMaterial color="#fff9e9" transparent opacity={.65}/></mesh></group>
    {Array.from({length:24},(_,i)=>{const a=i*2.399,r=22+i%3*8;return <group key={i} position={[Math.cos(a)*r,-4+i%3*.5,Math.sin(a)*r]}>{[0,1,2].map(j=><mesh key={j} position={[j*2,j%2*.4,0]} scale={[4.5,2+j*.35,3.5]}><sphereGeometry args={[1,16,12]}/><shaderMaterial transparent depthWrite={false} vertexShader={`varying vec3 n; varying vec3 view; void main(){vec4 p=modelViewMatrix*vec4(position,1.);view=-p.xyz;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`} fragmentShader={`varying vec3 n; varying vec3 view;void main(){float alpha=pow(max(dot(normalize(n),normalize(view)),0.),1.5)*.55;gl_FragColor=vec4(1.,.985,.96,alpha);}`}/></mesh>)}</group>})}
  </>
}
function Camera({selection,reset,onReady}:{selection:string|null;reset:number;onReady:()=>void}){
  const controls=useRef<OrbitType>(null)
  const {camera,size,gl,scene}=useThree()
  const reduced=useReducedMotion()
  const moving=useRef(true),ready=useRef(false)
  const desired=useRef({position:new Vector3(),target:new Vector3()})
  useEffect(()=>{const i=destinations.findIndex(d=>d.id===selection),mobile=size.width<700
    if(i<0){const s=mobile?1.8:1;desired.current.position.set(21*s,19*s,36*s);desired.current.target.set(0,.2,0)}
    else{
      // Approach each island from outside the ring, looking inward, so no neighbour sits between camera and island.
      const [x,y,z]=islandPosition(i);const away=i?new Vector3(x,0,z).normalize():new Vector3(.52,0,.85)
      const right=new Vector3(away.z,0,-away.x)
      desired.current.position.set(x,y+8.8,z).addScaledVector(away,18.2)
      desired.current.target.set(x,y+1.1,z).addScaledVector(right,mobile?0:3)
    }
    moving.current=true
  },[selection,reset,size.width])
  useFrame((_,delta)=>{
    if(controls.current&&moving.current){const a=reduced?1:1-Math.exp(-delta*3.5);camera.position.lerp(desired.current.position,a);controls.current.target.lerp(desired.current.target,a);controls.current.update();if(camera.position.distanceTo(desired.current.position)<.025)moving.current=false}
    if(!ready.current&&gl.info.render.frame>2){ready.current=true;let triangles=0;scene.traverse(obj=>{if('geometry'in obj){const g=obj.geometry as {index?:{count:number};attributes:{position:{count:number}}};triangles+=(g.index?.count??g.attributes.position.count)/3}});gl.domElement.dataset.sceneTriangles=String(Math.round(triangles));gl.domElement.dataset.sceneReady='true';onReady()}
  })
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.08} minDistance={7} maxDistance={130} minPolarAngle={.18} maxPolarAngle={Math.PI*.47} onStart={()=>{moving.current=false}}/>
}
export default function ProjectIslands({selection,reset,labels,onSelect,onReady}:{selection:string|null;reset:number;labels:Record<string,string>;onSelect:(id:string)=>void;onReady:()=>void}){
  return <>
    <fog attach="fog" args={['#f8f4ec',55,135]}/>
    <ambientLight intensity={.7}/><hemisphereLight args={['#fff3df','#a3aea4',1.1]}/>
    <directionalLight position={[-12,24,12]} intensity={2.3} color="#fff0da" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={85} shadow-normalBias={.018} shadow-bias={-.00015}/>
    <directionalLight position={[14,12,-18]} intensity={.8} color="#e4e8e9"/>
    <Ocean/><Surroundings/>
    {destinations.map((d,i)=><Sculpture key={d.id} index={i} label={labels[d.id]} selected={selection===d.id} onSelect={onSelect}/>)}
    <Camera selection={selection} reset={reset} onReady={onReady}/>
  </>
}
