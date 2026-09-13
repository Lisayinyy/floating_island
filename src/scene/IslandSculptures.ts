import { BoxGeometry, BufferGeometry, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, Euler, Float32BufferAttribute, IcosahedronGeometry, Matrix4, Quaternion, TorusGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

type V = [number,number,number]
// Static sculpture parts are baked into one vertex-coloured mesh per island.
// Hundreds of small leaves/boards therefore do not become hundreds of draw calls.
class Workshop {
  parts:BufferGeometry[]=[]
  seed:number
  constructor(seed:number){this.seed=seed}
  random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296}
  add(source:BufferGeometry,at:V,color:string,scale:V=[1,1,1],rotation:V=[0,0,0],variation=0.035){
    const geometry=source.index?source.toNonIndexed():source.clone();source.dispose()
    geometry.deleteAttribute('uv')
    geometry.applyMatrix4(new Matrix4().compose(new Vector3(...at),new Quaternion().setFromEuler(new Euler(...rotation)),new Vector3(...scale)))
    const colors:number[]=[];const base=new Color(color)
    for(let i=0;i<geometry.attributes.position.count;i+=3){const c=base.clone().offsetHSL(0,0,(this.random()-.5)*variation);for(let j=0;j<3;j++)colors.push(c.r,c.g,c.b)}
    geometry.setAttribute('color',new Float32BufferAttribute(colors,3));this.parts.push(geometry)
  }
  box(at:V,size:V,color:string,rotation:V=[0,0,0]){this.add(new BoxGeometry(...size),at,color,[1,1,1],rotation)}
  rock(at:V,size:V,color:string,detail=0){this.add(new IcosahedronGeometry(1,detail),at,color,size,[this.random(),this.random()*6,this.random()],.1)}
  cylinder(at:V,r:number,h:number,color:string,top=r,segments=8){this.add(new CylinderGeometry(top,r,h,segments),at,color)}
  beam(a:V,b:V,r:number,color:string,end=r*.6){const start=new Vector3(...a),target=new Vector3(...b);const delta=target.clone().sub(start);const geo=new CylinderGeometry(end,r,delta.length(),7);geo.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),delta.normalize()));this.add(geo,start.add(target).multiplyScalar(.5).toArray() as V,color)}
  finish(){const merged=mergeGeometries(this.parts,false);this.parts.forEach(p=>p.dispose());return merged}
}

function terrain(w:Workshop,color:string,seed:number,radius=4,depth=5.2){
  const n=17, rings:V[][]=[]
  const radii=[radius*.72,radius,radius*.88,radius*.52,.08]
  const ys=[.14,-.06,-1.35,-3.15,-depth]
  for(let r=0;r<5;r++)rings.push(Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2;const noise=.91+w.random()*.19;return [Math.cos(a)*radii[r]*noise+(r===4?.25:0),ys[r]+(r===0?0:(w.random()-.5)*.45),Math.sin(a)*radii[r]*noise] as V}))
  const points:number[]=[],colors:number[]=[];const base=new Color(color)
  const tri=(a:V,b:V,c:V,top=false)=>{points.push(...a,...b,...c);const shade=base.clone().offsetHSL(0,top?-.025:0,(top?.12:0)+(w.random()-.5)*.18);for(let j=0;j<3;j++)colors.push(shade.r,shade.g,shade.b)}
  for(let i=0;i<n;i++){const next=(i+1)%n;tri([0,.14,0],rings[0][next],rings[0][i],true);for(let r=0;r<4;r++){tri(rings[r][i],rings[r][next],rings[r+1][i],r===0);tri(rings[r][next],rings[r+1][next],rings[r+1][i],r===0)}tri(rings[4][i],rings[4][next],[.25,-depth-.05,0])}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.computeVertexNormals();w.parts.push(g)
  // Small ledges break the silhouette; no separate uniform platform disc.
  for(let i=0;i<7;i++){const a=i*2.399+seed;w.rock([Math.sin(a)*radius*.9,-.15,Math.cos(a)*radius*.9],[.48,.24,.36],color)}
}
function fir(w:Workshop,x:number,z:number,h=2.7,snow=false){
  w.beam([x,.15,z],[x+.035,h*.9,z],.12,'#806549',.04)
  for(let k=0;k<5;k++){const y=.55+k*h*.15;const r=(1-k*.14)*h*.27;w.add(new ConeGeometry(r,h*.42,7),[x,y+h*.18,z],['#77876a','#8b9a77','#a3ad8b'][k%3],[1,1,1],[0,k*.8,0],.065);for(let j=0;j<3;j++){const a=j*2.094+k*.9;w.add(new ConeGeometry(r*.42,h*.23,5),[x+Math.sin(a)*r*.47,y+h*.06,z+Math.cos(a)*r*.47],snow&&j===0?'#dce1d2':'#8f9e7c',[1,1,1],[.08,k*.8,.1],.06)}}
}
// density scales the leaf clusters: featured islands use 1, archive islands ~.2 to stay cheap.
function tree(w:Workshop,x:number,z:number,pink=true,scale=1,density=1){
  const wood='#8f6c50';const center:V=[x+.22*scale,3.9*scale,z]
  w.beam([x,.14,z],[x-.22*scale,2.5*scale,z],.28*scale,wood,.19*scale)
  w.beam([x-.22*scale,2.5*scale,z],center,.2*scale,wood,.09*scale)
  const colors=pink?['#ffc0a7','#ef9b86','#f5b7a3','#da866c','#ffd3b7']:['#b7bd8c','#a8ad7f','#c6c79b','#959b71','#d2cfab']
  for(let b=0;b<10;b++){
    const a=b*2.399;const reach=(1.3+w.random()*.75)*scale
    const base:V=[x-.12*scale,(1.85+b*.15)*scale,z]
    const tip:V=[x+Math.cos(a)*reach,(3.7+w.random()*.85)*scale,z+Math.sin(a)*reach]
    const elbow:V=[(base[0]+tip[0])*.5,tip[1]-.6*scale,(base[2]+tip[2])*.5]
    w.beam(base,elbow,.13*scale,wood,.07*scale);w.beam(elbow,tip,.07*scale,wood,.025*scale)
    for(let t=0;t<4;t++){const aa=a+t*1.6;w.beam(elbow,[tip[0]+Math.cos(aa)*.5*scale,tip[1]+.15*scale,tip[2]+Math.sin(aa)*.5*scale],.04*scale,wood,.012*scale)}
    for(let f=0;f<Math.round(56*density);f++){const aa=w.random()*Math.PI*2,rr=Math.sqrt(w.random())*.95*scale;w.rock([tip[0]+Math.cos(aa)*rr,tip[1]+(w.random()-.25)*.65*scale,tip[2]+Math.sin(aa)*rr],[scale*(.11+w.random()*.12),scale*(.08+w.random()*.10),scale*(.12+w.random()*.12)],colors[Math.floor(w.random()*colors.length)])}
  }
  for(let f=0;f<Math.round(200*density);f++){const a=w.random()*Math.PI*2,r=Math.sqrt(w.random())*1.65;w.rock([x+Math.cos(a)*r*scale,(4.65+.45*(1-r/1.65)+(w.random()-.5)*.3)*scale,z+Math.sin(a)*r*scale],[scale*(.12+w.random()*.12),scale*(.08+w.random()*.08),scale*(.12+w.random()*.12)],colors[Math.floor(w.random()*colors.length)])}
  for(let i=0;i<6;i++){const a=i*Math.PI/3;w.beam([x,.35,z],[x+Math.cos(a)*.6*scale,.16,z+Math.sin(a)*.6*scale],.13*scale,wood,.035*scale)}
}
function palm(w:Workshop,x:number,z:number,h=3){
  const top:V=[x+.42,h,z];w.beam([x,.15,z],[x+.2,h*.55,z],.13,'#b39568',.09);w.beam([x+.2,h*.55,z],top,.09,'#b39568',.055)
  for(let i=0;i<10;i++){const a=i*Math.PI/5;const vertices:number[]=[];const p0=new Vector3(...top);for(let k=0;k<5;k++){const t=k/4;const p=new Vector3(x+.42+Math.cos(a)*t*1.35,h+Math.sin(t*Math.PI)*.38-t*.42,z+Math.sin(a)*t*1.35);const width=Math.sin(t*Math.PI)*.26;vertices.push(p.x-Math.sin(a)*width,p.y,p.z+Math.cos(a)*width,p.x+Math.sin(a)*width,p.y,p.z-Math.cos(a)*width);if(k===0)p.copy(p0)}const idx:number[]=[];for(let k=0;k<4;k++)idx.push(k*2,k*2+1,k*2+2,k*2+1,k*2+3,k*2+2);const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setIndex(idx.concat(idx.map((_,j)=>idx[Math.floor(j/3)*3+2-j%3])));g.computeVertexNormals();w.add(g,[0,0,0],i%2?'#8d9e76':'#a8b68d')}
  for(let i=0;i<3;i++)w.rock([x+.4+i*.08,h-.12,z+.1],[.14,.17,.14],'#9c8660')
}
function pot(w:Workshop,x:number,z:number,y=.14,scale=.65){
  w.cylinder([x,y+.22*scale,z],.23*scale,.44*scale,'#c69071',.29*scale)
  w.cylinder([x,y+.45*scale,z],.3*scale,.09*scale,'#e2af8a')
  for(let i=0;i<7;i++){const a=i*2.4;w.beam([x,y+.44*scale,z],[x+Math.sin(a)*.32*scale,y+(.75+i%3*.12)*scale,z+Math.cos(a)*.3*scale],.022*scale,'#7d895c');w.rock([x+Math.sin(a)*.32*scale,y+(.8+i%3*.12)*scale,z+Math.cos(a)*.3*scale],[.11*scale,.3*scale,.1*scale],i%2?'#9ea877':'#b4b990')}
}
function garden(w:Workshop,theme:string,radius=2.65){
  const green=theme==='snow'?'#bac5af':theme==='pink'?'#b8be92':'#aab489'
  const count=Math.round(28*radius/2.65)
  for(let i=0;i<count;i++){const a=i*2.399,r=radius+w.random()*.7;const x=Math.cos(a)*r,z=Math.sin(a)*r;w.rock([x,.18,z],[.22+w.random()*.16,.13+w.random()*.16,.22+w.random()*.14],i%3?'#d5cbb0':'#b8b59d');if(i%2===0)for(let k=0;k<4;k++)w.rock([x+(w.random()-.5)*.5,.32+w.random()*.12,z+(w.random()-.5)*.5],[.15,.22,.16],green)}
  for(let i=0;i<7;i++)w.rock([-.7+Math.sin(i)*.12,.19,(1+i*.27)*radius/2.65],[.24,.065,.15],'#e6ddc7')
}
function dock(w:Workshop,x:number,z:number,angle=0){
  // Local pieces are transformed as one pier, so rail and piles stay aligned.
  const temp=new Workshop(41);for(let i=0;i<11;i++)temp.box([0,.12,i*.18],[1.15,.1,.155],i%2?'#b88759':'#c99969')
  for(const xx of [-.48,.48]){temp.box([xx,-.05,.88],[.1,.14,2.1],'#9a704f');for(const zz of [0,1.8]){temp.cylinder([xx,-.22,zz],.07,1.8,'#9c7452');temp.beam([xx,.55,zz],[xx,.55,zz===0?1.8:0],.025,'#ab9570')}}
  const g=temp.finish();g.rotateY(angle);g.translate(x,.15,z);w.parts.push(g)
}
function windowFrame(w:Workshop,x:number,y:number,z:number,width=.6,height=.85){
  w.box([x,y,z],[width,height,.06],'#dfb780');w.box([x,y,z+.045],[width-.12,height-.12,.03],'#f9dfaa')
  for(const xx of [-1,1])w.box([x+xx*width/2,y,z+.08],[.07,height+.12,.12],'#79583d')
  for(const yy of [-1,1])w.box([x,y+yy*height/2,z+.08],[width+.14,.07,.12],'#79583d')
  w.box([x,y,z+.09],[.045,height,.08],'#95704d');w.box([x,y,z+.09],[width,.045,.08],'#95704d');w.box([x,y-height/2-.07,z+.17],[width+.2,.09,.3],'#c19565')
}
function cabin(w:Workshop,x:number,z:number,scale=1,snow=false){
  const c=new Workshop(128)
  c.box([0,.28,0],[2.7,.22,2.15],'#a77c53')
  c.box([0,1.15,-.8],[2.25,1.6,.16],'#b6804f');c.box([-1.08,1.15,0],[.15,1.6,1.6],'#bb8859');c.box([1.08,1.15,0],[.15,1.6,1.6],'#bb8859')
  // Closed cabin door is framed at a real inset and meets a threshold.
  c.box([-.78,1.15,.8],[.6,1.6,.14],'#bb8859');c.box([.72,1.15,.8],[.75,1.6,.14],'#bb8859');c.box([-.08,1.85,.8],[.8,.22,.14],'#bb8859')
  c.box([-.08,1.04,.74],[.67,1.3,.1],'#80583c');c.box([-.08,1.28,.81],[.43,.5,.035],'#eed1a0');c.rock([.15,.94,.85],[.035,.035,.035],'#d3b37e')
  for(let i=0;i<11;i++){const xx=-1.02+i*.2;c.box([xx,1.15,-.89],[.025,1.62,.03],'#9e704a');if(Math.abs(xx)>.45)c.box([xx,1.15,.89],[.025,1.6,.03],'#9e704a')}
  for(const xx of [-1,1]){c.box([xx*.61,2.24,0],[1.52,.14,2.22],snow?'#eeece2':'#dfac68',[0,0,xx*-.58]);for(let i=0;i<13;i++)c.box([xx*.61,2.32,-1.04+i*.17],[1.53,.035,.03],snow?'#e0e2d8':'#c99658',[0,0,xx*-.58])}
  c.beam([-1.28,1.85,1.08],[0,2.68,1.08],.07,'#dfbb83');c.beam([0,2.68,1.08],[1.28,1.85,1.08],.07,'#dfbb83')
  c.box([0,2.04,0],[.13,.13,2.28],'#cf9b61')
  windowFrame(c,.69,1.22,.9,.55,.75);windowFrame(c,-.78,1.22,.9,.42,.65)
  const side=new Workshop(96);windowFrame(side,0,1.22,0,.8,.83);const sideGeometry=side.finish();sideGeometry.rotateY(Math.PI/2);sideGeometry.translate(1.18,0,-.08);c.parts.push(sideGeometry)
  for(let i=0;i<9;i++)c.box([1.164,1.15,-.72+i*.18],[.025,1.58,.025],'#a2754e')
  c.box([.72,2.52,-.5],[.32,.83,.36],'#b9a28a');c.box([.72,2.95,-.5],[.43,.1,.47],'#d6c4a9')
  for(let i=0;i<7;i++)c.box([0,.3,1.06+i*.14],[2.55,.12,.12],i%2?'#b28a60':'#c39a6b')
  for(const xx of [-1.18,1.18]){c.cylinder([xx,.69,1.9],.05,.82,'#916947');c.beam([xx,1.06,.8],[xx,1.06,1.9],.04,'#a77d54')}
  for(let i=0;i<3;i++)c.box([0,.23-i*.06,2+i*.17],[.9,.12,.28],'#b18a63')
  const g=c.finish();g.scale(scale,scale,scale);g.translate(x,.14,z);w.parts.push(g)
}
function studio(w:Workshop){
  w.box([-.65,.24,-.6],[3.25,.18,2.65],'#e9d9c0')
  w.box([-.65,1.46,-1.86],[3.25,2.5,.13],'#e1cfb5');w.box([-2.25,1.46,-.9],[.14,2.5,2.05],'#e7d7bd')
  w.box([-.6,.96,-.78],[1.9,.11,.75],'#d1a773');for(const x of [-1.4,.2])for(const z of [-1.06,-.49])w.box([x,.62,z],[.065,.65,.065],'#b88b60')
  w.box([-.55,1.39,-.94],[.75,.49,.075],'#696b60');w.box([-.55,1.39,-.89],[.65,.38,.02],'#f3f0dd');w.box([-.55,1.08,-.86],[.07,.17,.07],'#7f8074');w.box([-.55,1.04,-.76],[.45,.035,.22],'#7f8074');w.box([-.6,1.035,-.52],[.65,.025,.22],'#ebe5d4')
  for(let i=0;i<3;i++)w.box([-.68,1.32+i*.08,-.873],[.38-i*.06,.018,.01],'#b3bcb1')
  w.box([-.68,.8,.12],[.65,.14,.62],'#c1b4ba');w.box([-.68,1.22,.35],[.66,.78,.1],'#c1b4ba');w.cylinder([-.68,.44,.12],.045,.6,'#8c8a80');for(let i=0;i<5;i++){const a=i*1.257;w.beam([-.68,.24,.12],[-.68+Math.sin(a)*.4,.2,.12+Math.cos(a)*.4],.03,'#8c8a80')}
  w.box([.14,1.99,-1.75],[1.01,.77,.07],'#a97e53');w.box([.14,1.99,-1.699],[.87,.63,.025],'#94aea0')
  w.box([-1.35,1.95,-1.6],[.72,.06,.4],'#c29969');for(let i=0;i<6;i++)w.box([-1.62+i*.105,2.1,-1.63],[.07,.26+i%2*.09,.18],['#c07f68','#93a49b','#debd83'][i%3])
  for(let i=0;i<4;i++){w.box([-2.16,1.65+i%2*.47,-1.4+Math.floor(i/2)*.4],[.035,.3,.23],'#ac8e70');w.box([-2.13,1.65+i%2*.47,-1.4+Math.floor(i/2)*.4],[.012,.23,.16],i%2?'#d8ac97':'#a4b6a3')}
  w.box([.83,.61,-.64],[.6,.73,.63],'#ead8b8');for(let i=0;i<3;i++)w.box([.83,.4+i*.22,-.31],[.49,.17,.03],'#d4b593')
  pot(w,.85,-.65,1,.6);pot(w,-2.7,-.9,.14,.9);pot(w,1.2,1.05,.14,.9)
  tree(w,1.55,-1.35,true,1.15)
  for(let i=0;i<6;i++)w.box([.82,.6,1.2+i*.1],[.78,.05,.06],'#bb8d62')
  for(const x of [.5,1.1])w.box([x,.37,1.46],[.06,.42,.43],'#bb8d62')
}
function mountains(w:Workshop){
  const peaks:V[]=[[-.5,2.35,-1.65],[1,1.65,-1.6],[-1.65,1.5,-1.2]]
  peaks.forEach((p,i)=>{
    const n=9,r=1.4-i*.13,h=p[1]*2,rows:V[][]=[]
    for(let layer=0;layer<4;layer++)rows.push(Array.from({length:n},(_,j)=>{const a=j/n*Math.PI*2+i*.7;const radius=r*[1,.64,.34,0][layer]*(.75+w.random()*.5);return [p[0]+Math.cos(a)*radius+layer*.075,.15+h*[0,.39,.7,1][layer]+(layer===0||layer===3?0:(w.random()-.5)*h*.16),p[2]+Math.sin(a)*radius] as V}))
    const pos:number[]=[],col:number[]=[]
    for(let layer=0;layer<3;layer++)for(let j=0;j<n;j++){const next=(j+1)%n;for(const tri of [[rows[layer][j],rows[layer][next],rows[layer+1][j]],[rows[layer][next],rows[layer+1][next],rows[layer+1][j]]]){pos.push(...tri.flat());const c=new Color(layer>0?'#eeeee4':'#a9b4b0').offsetHSL(0,0,(w.random()-.5)*.14);for(let k=0;k<3;k++)col.push(c.r,c.g,c.b)}}
    const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(pos,3));geo.setAttribute('color',new Float32BufferAttribute(col,3));geo.computeVertexNormals();w.parts.push(geo)
  })
  cabin(w,-.2,1,.62,true)
  for(const [x,z,h] of [[-2.5,-.3,2.9],[2.35,-.4,2.5],[-1.9,1.7,1.7],[2,1.5,2],[-2.3,-1.8,1.9],[1.8,-2,2.2]])fir(w,x,z,h,true)
  for(let i=0;i<7;i++)w.rock([-.65+i*.15,.18,2+i*.12],[.45,.04,.21],'#f2efe1')
  dock(w,2.5,1.4,-.75)
}
function temple(w:Workshop){
  w.box([0,.28,-.25],[4.2,.24,2.9],'#e1d8c4');w.box([0,.47,-.25],[3.8,.14,2.5],'#f2e9d7')
  for(const x of [-1.6,1.6])for(const z of [-1.2,.8]){
    w.box([x,.64,z],[.68,.2,.68],'#e7dbc5');w.box([x,.8,z],[.53,.14,.53],'#f3e9d8');w.cylinder([x,1.74,z],.21,1.8,'#eee5d3',.18,12)
    for(let i=0;i<8;i++){const a=i*Math.PI/4;w.cylinder([x+Math.sin(a)*.193,1.72,z+Math.cos(a)*.193],.025,1.62,'#d2c6b1',.022,5)}
    w.box([x,2.69,z],[.56,.18,.56],'#ede3d1');w.box([x,2.85,z],[.72,.14,.72],'#e4d7c0')
  }
  w.box([0,2.9,-1.2],[3.5,.23,.54],'#ede3d0');w.box([0,1.6,-1.3],[2.65,1.5,.16],'#decfb6');w.box([0,1.6,-1.2],[2.4,1.23,.025],'#f8f0df')
  for(let i=0;i<9;i++){const h=.27+(i%4)*.17;w.box([-1+i*.25,1.18+h/2,-1.17],[.11,h,.035],i%3?'#92a38b':'#c8977d')}
  w.box([-.3,.82,.25],[1.4,.15,.57],'#b48b5d');w.box([-.3,.66,.25],[1.1,.26,.4],'#d7be92');pot(w,1.1,.55,.54,.58)
  tree(w,.8,-2,false,.8)
  fir(w,-2.65,.7,1.25);fir(w,2.6,.4,1.6);dock(w,-2.8,1.3,.9)
}
function microphone(w:Workshop,x:number,z:number){
  w.cylinder([x,.35,z],.37,.15,'#756f76');w.cylinder([x,.85,z],.045,.95,'#8d8790');w.cylinder([x,1.55,z],.22,.75,'#9992a2',.22,12)
  w.rock([x,1.95,z],[.22,.14,.22],'#a69eaf',1);for(let i=0;i<7;i++)w.box([x,1.32+i*.085,z+.215],[.29,.023,.02],'#706c79')
}
function claw(w:Workshop,x:number,z:number){
  w.box([x,.61,z],[1.22,.8,1.05],'#d9b766');w.box([x,2.12,z],[1.35,.25,1.14],'#eaca83')
  for(const xx of [-.55,.55])for(const zz of [-.46,.46])w.box([x+xx,1.43,z+zz],[.055,1.2,.055],'#f6e4b9')
  w.box([x,1.45,z-.49],[1.05,1.08,.035],'#c1d5c7');w.beam([x,1.99,z],[x,1.62,z],.025,'#858f83');for(const s of [-1,1])w.beam([x,1.64,z],[x+s*.14,1.41,z],.024,'#858f83')
  for(let i=0;i<3;i++){const xx=x-.34+i*.34;w.rock([xx,1.09,z+.09],[.18,.19,.18],['#e6b5b2','#bacb9e','#e9d5a3'][i],1);for(const s of [-1,1]){w.rock([xx+s*.1,1.23,z+.09],[.07,.08,.07],'#e6c8a3');w.rock([xx+s*.065,1.13,z+.25],[.018,.022,.018],'#665748')}}
  w.box([x,.72,z+.6],[.92,.1,.35],'#ebcf8b');w.cylinder([x-.25,.87,z+.61],.025,.21,'#ad8060');w.rock([x-.25,.99,z+.61],[.075,.075,.075],'#bc8270');w.box([x,.4,z+.54],[.45,.21,.03],'#887f61')
}

function pavilion(w:Workshop){
  w.box([-.1,.35,-.5],[2.7,.22,2.4],'#d9cdb5');for(const x of [-1.2,1])for(const z of [-1.5,.5])w.cylinder([x,1.42,z],.07,2,'#8c7d60');w.add(new ConeGeometry(2.08,.93,4),[-.1,2.88,-.5],'#919a7d',[1,1,1],[0,Math.PI/4,0]);w.box([-.1,1.43,-1.43],[1.5,1.4,.06],'#f1e8cc');for(let i=0;i<5;i++)w.beam([-.65+i*.2,.94,-1.385],[-.25+i*.17,1.65+i%2*.25,-1.385],.018,'#6b725f');w.box([-.1,.85,.1],[1.5,.13,.55],'#ad9270');for(const x of [-.7,.5])w.box([x,.6,.1],[.06,.4,.4],'#ad9270');tree(w,2,-1.1,false,.64);tree(w,-2,-.7,true,.5);pot(w,1.4,1.4);dock(w,-2.4,1.65,.5)
}
// Props shared between islands.
function arcade(w:Workshop,x:number,z:number){
  w.box([x,.72,z],[.9,1.16,.7],'#cf9484');w.box([x,1.4,z],[.98,.22,.78],'#e8b7a4');w.box([x,1.4,z+.4],[.7,.12,.02],'#fbe6c9')
  w.add(new BoxGeometry(.72,.5,.05),[x,1.06,z+.35],'#bfd6cf',[1,1,1],[-.32,0,0]);w.add(new BoxGeometry(.5,.3,.02),[x,1.07,z+.39],'#6fa39a',[1,1,1],[-.32,0,0])
  w.box([x,.62,z+.42],[.8,.08,.32],'#e0c9a0');w.cylinder([x-.2,.72,z+.45],.03,.14,'#7c6a5a');w.rock([x-.2,.82,z+.45],[.06,.06,.06],'#d95f5f',1)
  w.rock([x+.1,.67,z+.46],[.05,.03,.05],'#6f9fc6',1);w.rock([x+.24,.67,z+.42],[.05,.03,.05],'#e0b64f',1)
  w.box([x+.75,.36,z+.2],[.5,.12,.5],'#c9a276');w.cylinder([x+.75,.2,z+.2],.06,.22,'#a58559')
}
function easel(w:Workshop,x:number,z:number){
  w.beam([x-.3,.14,z+.2],[x-.02,1.65,z-.04],.03,'#a07b52');w.beam([x+.3,.14,z+.2],[x+.02,1.65,z-.04],.03,'#a07b52');w.beam([x,.14,z-.32],[x,1.5,z-.05],.03,'#a07b52')
  w.add(new BoxGeometry(.7,.06,.16),[x,.62,z+.1],'#a07b52',[1,1,1],[-.16,0,0])
  w.add(new BoxGeometry(.78,.92,.04),[x,1.1,z+.07],'#f5efe0',[1,1,1],[-.16,0,0])
  const paint=['#d98c78','#8fa98b','#e2b96c','#8ba3c4'];for(let i=0;i<7;i++){const a=i*2.399;w.rock([x+Math.cos(a)*.2,1.1+Math.sin(a)*.24,z+.1],[.08+i%3*.03,.06+i%2*.04,.02],paint[i%4],1)}
  w.box([x+.62,.3,z+.2],[.44,.32,.3],'#b9a28a');for(let i=0;i<4;i++){w.cylinder([x+.5+i%2*.22,.52,z+.12+Math.floor(i/2)*.16],.045,.11,paint[i],.04)}
  w.rock([x-.6,.2,z+.3],[.16,.09,.14],'#c1b4ba');w.box([x-.62,.32,z+.3],[.3,.02,.2],'#e8d9b5')
}
function chartBoard(w:Workshop,x:number,z:number){
  for(const dx of [-.55,.55])w.cylinder([x+dx,.72,z],.045,1.2,'#8c7d60');w.box([x,1.02,z],[1.36,.86,.06],'#f1e8cc');w.box([x,1.02,z],[1.44,.94,.03],'#bfa77f')
  for(let i=0;i<6;i++){const h=.16+(i*7%5)*.09;w.box([x-.5+i*.2,.68+h/2,z+.04],[.1,h,.02],i%2?'#92a38b':'#c8977d')}
  for(let i=0;i<5;i++)w.beam([x-.5+i*.2,.9+(i*3%4)*.1,z+.05],[x-.3+i*.2,.9+((i+1)*3%4)*.1,z+.05],.012,'#6b725f')
  w.box([x,.36,z+.8],[1,.1,.32],'#ad9270');for(const dx of [-.4,.4])w.box([x+dx,.24,z+.8],[.06,.16,.3],'#ad9270')
  w.cylinder([x+1,.24,z-.4],.16,.2,'#8c8a80');w.beam([x+1,.34,z-.4],[x+1,.95,z-.4],.025,'#8c8a80');w.add(new CylinderGeometry(.05,.035,.42,8),[x+1.1,1.05,z-.4],'#6b6a70',[1,1,1],[0,0,-1.1])
}

export function buildIsland(id:string,index:number){
  const w=new Workshop(819+index*127)
  const colors:Record<string,string>={about:'#e09c7b','ai-toolkits':'#bbb4b4','3d-games':'#e1c9a0',fintech:'#d0c6b5',taste:'#bcc1a6','data-science':'#a6b29a'}
  terrain(w,colors[id]??'#d8c29a',index)
  if(id==='about')studio(w)
  else if(id==='ai-toolkits'){cabin(w,.3,-1,.9);tree(w,-2,-1.1,true,.55);microphone(w,-.6,1.3);w.box([.65,.46,1.5],[1.1,.18,.65],'#d5bf9b');for(let i=0;i<5;i++)w.box([.25+i*.2,.65+(i%3)*.09,1.5],[.075,.2+(i%3)*.18,.1],'#a899ae');fir(w,2,-.1,1.9);pot(w,1.8,1.1);dock(w,2.5,1.4,-.7)}
  else if(id==='3d-games'){cabin(w,-.55,-.65,.77);claw(w,1.15,.95);arcade(w,1.9,-.9);palm(w,2.4,-2,3.2);palm(w,-2.3,-.5,3);dock(w,-.4,2.9,0);pot(w,-1.8,1.2);for(let i=0;i<3;i++)w.rock([-2+i*.17,.6,1.1+i*.18],[.12,.5,.07],['#b6c9ba','#e5bfa0','#d2c5a0'][i])}
  else if(id==='fintech')temple(w)
  else if(id==='taste'){pavilion(w);easel(w,1.7,1.1)}
  else if(id==='data-science'){mountains(w);chartBoard(w,1.2,.2)}
  garden(w,id==='about'?'pink':id==='data-science'?'snow':'green')
  return w.finish()
}

export function buildSatellites(){const w=new Workshop(843);for(let i=0;i<22;i++){const a=i*2.399,r=7+i%5*2.7;const x=Math.sin(a)*r,z=Math.cos(a)*r,y=-2.1-i%4*.45;w.rock([x,y,z],[.43+i%3*.12,.7,.48],i%2?'#d8c3a4':'#b9bea3');w.rock([x,y+.48,z],[.5,.15,.48],'#c7c9a4');for(let j=0;j<3;j++)w.rock([x+(j-1)*.16,y+.62,z],[.1,.15,.1],'#a8b585')}return w.finish()}

export function buildBoat(){const w=new Workshop(631);w.rock([0,0,0],[.48,.19,1.16],'#ba895d',1);w.box([0,.13,0],[.6,.05,1.25],'#dab489');w.beam([0,.17,0],[0,2.35,0],.03,'#997c59');w.beam([0,.35,-.85],[0,.35,.85],.025,'#997c59');const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([0,2.25,0,0,.46,-.8,0,.46,0, 0,2.25,0,0,.46,0,0,.46,.88],3));g.computeVertexNormals();w.add(g,[0,0,0],'#f5e7ca');return w.finish()}

export function buildRoute(from:V,to:V,drop=1.6){const a=new Vector3(...from),b=new Vector3(...to);const middle=a.clone().add(b).multiplyScalar(.5);middle.y-=drop;return new CatmullRomCurve3([a,middle,b])}
export function buildWake(){const w=new Workshop(14);for(let i=0;i<3;i++){const g=new TorusGeometry(.8+i*.55,.012,3,64);g.rotateX(-Math.PI/2);g.scale(1,1,.55);w.add(g,[0,0,0],'#f2eee1')}return w.finish()}
