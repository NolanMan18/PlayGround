import * as THREE from 'three';

const canvas = document.querySelector('#view');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc4cf);
scene.fog = new THREE.Fog(0x9bc4cf, 42, 116);
const camera = new THREE.PerspectiveCamera(67, innerWidth / innerHeight, .1, 180);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(innerWidth, innerHeight);
scene.add(new THREE.HemisphereLight(0xc5efff, 0x45513b, 1.35));
const sun = new THREE.DirectionalLight(0xffebce, 3.1);
sun.position.set(-25, 38, 17); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -48; sun.shadow.camera.right = 48; sun.shadow.camera.top = 48; sun.shadow.camera.bottom = -48;
sun.shadow.bias = -.00035; scene.add(sun);
const fill = new THREE.DirectionalLight(0x7dc7ff, .55); fill.position.set(17, 15, -28); scene.add(fill);
const mats = {
  grass: new THREE.MeshStandardMaterial({ color: 0x578552, roughness: 1 }),
  grassLight: new THREE.MeshStandardMaterial({ color: 0x709a58, roughness: 1 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0x765844, roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x87989a, roughness: .88 }),
  darkStone: new THREE.MeshStandardMaterial({ color: 0x36464b, roughness: .7 }),
  road: new THREE.MeshStandardMaterial({ color: 0x292f34, roughness: .86 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe9e5d8, roughness: .55 }),
  bark: new THREE.MeshStandardMaterial({ color: 0x705038, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x356647, roughness: 1 }),
  leaf2: new THREE.MeshStandardMaterial({ color: 0x528356, roughness: 1 }),
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function cube(parent, x, y, z, sx, sy, sz, material, cast = true) {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = cast; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function emissive(color, intensity = 2.2) { return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: .28 }); }
function addInstanced(material, items, size=1) {
  const mesh = new THREE.InstancedMesh(boxGeo, material, items.length);
  mesh.castShadow = true; mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  items.forEach((v, i) => { dummy.position.set(v[0], v[1], v[2]); dummy.scale.set(v[3] ?? size, v[4] ?? size, v[5] ?? size); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); });
  mesh.instanceMatrix.needsUpdate = true; scene.add(mesh); return mesh;
}

// A wide grassland and the stone lane that leads into the neon garage.
const grassCells = [], dirtCells = [];
for (let x = -24; x < 24; x++) for (let z = -31; z < 31; z++) {
  const roadZone = Math.abs(x) < 3.5 && z > -32 && z < 17;
  const plazaZone = Math.abs(x) < 18.5 && z > -10 && z < 2;
  if (roadZone || plazaZone) continue;
  const y = (Math.abs(x) > 20 && z < -15 && Math.random() > .35) ? .45 : 0;
  grassCells.push([x, -.5 + y, z, 1, 1 + y, 1]);
  dirtCells.push([x, -1.5 + y, z, 1, 1, 1]);
}
const grassInstances=addInstanced(mats.grass, grassCells); const dirtInstances=addInstanced(mats.dirt, dirtCells);
const voxelTargets=[grassInstances,dirtInstances], placedBlocks=[];
// Asphalt approach, segmented lane marks, block-built garage apron.
cube(scene, 0, -.035, -6.5, 7, .12, 49, mats.road, false);
cube(scene, 0, -.09, -6.5, 7.22, .08, 49.2, mats.darkStone, false);
for (let z = -29; z < 15; z += 5) cube(scene, 0, .035, z, .13, .025, 2.5, mats.white, false);
cube(scene, 0, -.015, -4.5, 39, .16, 13, mats.stone, false);
for (let x=-19; x<=19; x+=1) {
  cube(scene, x, .09, -11.1, .84, .19, .84, (x%2===0 ? mats.darkStone : mats.stone), false);
  cube(scene, x, .09, 2.1, .84, .19, .84, (x%2===0 ? mats.stone : mats.darkStone), false);
}
for (const x of [-18.8,18.8]) for (let z=-10;z<=1;z+=1) cube(scene,x,.09,z,.84,.19,.84,mats.darkStone,false);
// Distant voxel berms frame the horizon.
for(let i=0;i<19;i++){const x=-23+i*2.6; const h=2+Math.random()*5; cube(scene,x,h/2-0.05,-34-Math.random()*5,2.7,h,3.8,i%3?mats.grassLight:mats.grass);}
// Blocky grove on either side of the road.
for(let i=0;i<37;i++){
  const side=Math.random()<.5?-1:1, x=side*(7+Math.random()*16), z=-28+Math.random()*49;
  if(z>-12&&z<3&&Math.abs(x)<20)continue;
  const h=2.4+Math.random()*2.2, trunk=cube(scene,x,h*.45,z,.65,h*.9,.65,mats.bark);
  const leafMat=Math.random()<.5?mats.leaf:mats.leaf2;
  cube(scene,x,h+1,z,2.5,2.2,2.5,leafMat); cube(scene,x,h+2.35,z,1.65,1.5,1.65,leafMat);
  if(i%3===0) cube(scene,x+.9,h+.45,z-.4,1.2,1.15,1.2,leafMat);
}
// LED light towers and low color rails around the showroom.
const palette=[0xff3f86,0x6a66ff,0x28ddff,0x69ffc8,0xffd24a,0xff6238,0xca5cff];
const ledMaterials=palette.map(c=>emissive(c,3.4));
for(let x=-17;x<=17;x+=5.65){
  cube(scene,x,2.35,-10.65,.18,4.7,.18,mats.darkStone);
  cube(scene,x,4.74,-10.65,.28,.13,.28,ledMaterials[(Math.round((x+17)/5.65))%7]);
  cube(scene,x,2.35,1.7,.18,4.7,.18,mats.darkStone);
  cube(scene,x,4.74,1.7,.28,.13,.28,ledMaterials[(Math.round((x+17)/5.65)+3)%7]);
}
for(let z=-10;z<=1;z+=2){cube(scene,-18.3,1.25,z,.13,.14,.13,ledMaterials[(z+12)%7]);cube(scene,18.3,1.25,z,.13,.14,.13,ledMaterials[(z+17)%7]);}
for(let s of [-1,1]){
  cube(scene,s*18.3,.65,-4.5,.18,.18,12,ledMaterials[s<0?2:4],false);
  const glow=new THREE.PointLight(s<0?0x38ddff:0xff3888,9,13,2);glow.position.set(s*17.5,2,-5);scene.add(glow);
}
// A block-built welcome arch.
for(const x of [-5.8,5.8]){cube(scene,x,2.35,-10.9,.45,4.7,.45,mats.darkStone);cube(scene,x,4.8,-10.9,.5,.18,.5,emissive(0x27e8e4,3));}
cube(scene,0,4.65,-10.9,12,.32,.5,mats.darkStone);
for(let x=-5.3;x<=5.4;x+=.42)cube(scene,x,4.65,-10.61,.3,.2,.08,ledMaterials[Math.floor((x+6)*.6)%7],false);

const carSpecs=[
 {name:'Lamborghini',tag:'V12 · SUPERCAR',color:0xc7e63b,top:326,accel:8.6,shape:'wedge'},
 {name:'Ferrari',tag:'V8 · BERLINETTA',color:0xd92d38,top:315,accel:8.2,shape:'sport'},
 {name:'Civic Hatchback',tag:'TURBO · HATCH',color:0x10171c,top:248,accel:6.4,shape:'hatch'},
 {name:'Everyday Sedan',tag:'2.0L · COMFORT',color:0xc6cbd0,top:205,accel:5.2,shape:'sedan'},
 {name:'NOVA X',tag:'ELECTRIC · CONCEPT',color:0x40d8e6,top:292,accel:10,shape:'future'},
 {name:'Camaro',tag:'V8 · MUSCLE',color:0xe9a323,top:288,accel:7.1,shape:'muscle'},
 {name:'Corvette',tag:'V8 · GRAND TOURER',color:0x3179d7,top:308,accel:8.1,shape:'corvette'},
];
const cars=[];
const rubber=new THREE.MeshStandardMaterial({color:0x141719,roughness:.92});
const tireSide=new THREE.MeshStandardMaterial({color:0x292d30,roughness:.62,metalness:.16});
const glass=new THREE.MeshStandardMaterial({color:0x14252d,metalness:.48,roughness:.2});
const chrome=new THREE.MeshStandardMaterial({color:0xaebbc0,metalness:.82,roughness:.2});
const darkTrim=new THREE.MeshStandardMaterial({color:0x101518,metalness:.26,roughness:.48});
const wheelGeo=new THREE.CylinderGeometry(.52,.52,.34,20,1);
const rimGeo=new THREE.CylinderGeometry(.29,.29,.355,12,1);
const headlamp=emissive(0xdff7ff,3.8), tailLamp=emissive(0xff2439,3.1);
function addCar(spec,index){
  const root=new THREE.Group(); scene.add(root);
  const paint=new THREE.MeshStandardMaterial({color:spec.color,metalness:.72,roughness:.25});
  const body=cube(root,0,.78,0,3.55,.72,4.15,paint);
  body.castShadow=true;
  cube(root,0,1.2,1.43,3.28,.44,1.08,paint);
  // hood, trunk, and recognizable cabin silhouettes vary by model.
  const cabSize=spec.shape==='hatch'?[2.72,.92,1.95]:spec.shape==='sedan'?[2.66,.86,1.8]:spec.shape==='muscle'?[2.72,.78,1.78]:spec.shape==='future'?[2.68,.7,1.85]:[2.62,.82,1.77];
  const cabZ=spec.shape==='hatch'?-.62:-.58;
  cube(root,0,1.48,cabZ,...cabSize,paint);
  cube(root,0,1.34,-1.69,3.28,.35,.92,paint);
  // Windshield and rear glass are angled only by their tapered scale, keeping the voxel aesthetic.
  const windshield=cube(root,0,1.52,.47,2.52,.53,.065,glass); windshield.rotation.x=-.28;
  const rearGlass=cube(root,0,1.51,-1.43,2.38,.49,.065,glass); rearGlass.rotation.x=.25;
  for(const s of [-1,1]){
    cube(root,s*1.345,1.48,-.55,.06,.61,1.42,glass);
    cube(root,s*1.79,1.2,.23,.09,.13,.61,chrome);
    cube(root,s*1.79,.58,1.5,.1,.15,.46,headlamp);
    cube(root,s*1.79,.59,-1.92,.1,.14,.48,tailLamp);
    cube(root,s*1.2,.39,0,.06,.055,3.5,darkTrim,false);
  }
  cube(root,0,.55,2.105,2.7,.16,.12,darkTrim,false);
  cube(root,0,.53,-2.085,2.65,.17,.13,darkTrim,false);
  for(const x of [-1.76,1.76])for(const z of [-1.34,1.34]){
    const tire=new THREE.Mesh(wheelGeo,rubber);tire.rotation.z=Math.PI/2;tire.position.set(x,.53,z);tire.castShadow=true;root.add(tire);
    const rim=new THREE.Mesh(rimGeo,chrome);rim.rotation.z=Math.PI/2;rim.position.set(x*1.025,.53,z);root.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.37,12),darkTrim);hub.rotation.z=Math.PI/2;hub.position.set(x*1.04,.53,z);root.add(hub);
  }
  if(spec.shape==='wedge'||spec.shape==='corvette'){
    cube(root,0,.48,1.72,3.4,.15,.55,paint);cube(root,0,1.94,-.52,1.3,.07,1.05,paint);
  } else if(spec.shape==='muscle'){
    cube(root,0,1.94,-.65,2.18,.09,.14,paint);
    cube(root,0,1.2,1.89,2.85,.1,.3,darkTrim);
  } else if(spec.shape==='future'){
    cube(root,0,1.93,-.62,2.7,.07,.07,emissive(0x55efff,2));
    cube(root,0,.48,0,3.68,.055,2.8,emissive(0x26dff0,.75),false);
  } else if(spec.shape==='hatch'){
    cube(root,0,1.97,-1.28,2.15,.12,.12,paint);
    cube(root,0,.46,1.92,2.5,.1,.3,darkTrim);
  }
  const plate=cube(root,0,.77,2.18,.6,.23,.045,new THREE.MeshStandardMaterial({color:0xe1e7de,roughness:.48}),false);
  const underglow=new THREE.PointLight(new THREE.Color().setHex(palette[index]),1.8,5.5,2.2);underglow.position.set(0,.27,0);root.add(underglow);
  const frontGlow=new THREE.PointLight(0xbdeeff,2.3,11,2);frontGlow.position.set(0,.75,2.55);root.add(frontGlow);
  root.position.set((index-3)*5.25,.04,-4.55);
  root.userData={spec,index,wheels:root.children.filter(c=>c.geometry===wheelGeo),underglow,baseX:root.position.x,baseZ:root.position.z};
  cars.push(root);
}
carSpecs.forEach(addCar);
// Floating voxel sign at the end of the forecourt.
for(let i=0;i<15;i++)cube(scene,-3.5+i*.5,3.45,-11.1,.42,.13,.1,ledMaterials[i%7],false);

const carList=document.querySelector('#carList'), carDetail=document.querySelector('#carDetail');
let selected=0, activeCar=null, started=false, locked=false, yaw=0, pitch=-.025, speed=0, ledStep=0;
const player=new THREE.Vector3(0,1.72,17.5), keys={};
const raycaster=new THREE.Raycaster();raycaster.far=7;
const colorHex=c=>'#'+c.toString(16).padStart(6,'0');
function selectCar(index){selected=index;document.querySelectorAll('.car-option').forEach((el,i)=>el.classList.toggle('active',i===index));const s=carSpecs[index];carDetail.innerHTML=`<strong>${s.tag}</strong><span>TOP SPEED&nbsp; ${s.top} KM/H</span>`;}
carSpecs.forEach((s,i)=>{const b=document.createElement('button');b.className='car-option';b.innerHTML=`<i class="car-swatch" style="background:${colorHex(s.color)};color:${colorHex(s.color)}"></i><strong>${s.name}</strong><small>${String(i+1).padStart(2,'0')}</small>`;b.addEventListener('click',()=>selectCar(i));carList.appendChild(b);});selectCar(0);
const toastEl=document.querySelector('#toast');let toastTimer;
function toast(text){toastEl.textContent=text;toastEl.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2100);}
function startGame(){started=true;document.body.classList.add('started','playing');document.querySelector('#intro').style.opacity='0';document.querySelector('#intro').style.pointerEvents='none';lockPointer();}
function lockPointer(){if(started&&!activeCar&&canvas.requestPointerLock&&!/Android|iPhone|iPad/i.test(navigator.userAgent))canvas.requestPointerLock();}
document.querySelector('#startBtn').addEventListener('click',startGame);
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;});
document.addEventListener('mousemove',e=>{if(locked&&!activeCar){yaw-=e.movementX*.0022;pitch=THREE.MathUtils.clamp(pitch-e.movementY*.0018,-.52,.42);}});
document.addEventListener('keydown',e=>{const key=e.key.toLowerCase();keys[key]=true;if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))e.preventDefault();if(key==='e'){toggleCar();}if(key==='r'){cycleLeds();}if(key==='escape'&&locked){document.body.classList.add('playing');}});
document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener('click',e=>{
 if(!started){startGame();return;}
 if(e.target!==canvas)return;
 if(!locked&&!activeCar){lockPointer();return;}
 if(activeCar)return;
 if(!e.shiftKey&&e.button!==0)return;
 raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
 const hits=raycaster.intersectObjects([...voxelTargets,...placedBlocks],false).filter(h=>h.distance<6.5);
 if(!hits.length)return;const hit=hits[0];
 if(e.shiftKey){const p=hit.point.clone().add(hit.face.normal.clone().multiplyScalar(.51));p.set(Math.round(p.x),Math.round(p.y),Math.round(p.z));const block=cube(scene,p.x,p.y,p.z,1,1,1,mats.grass);placedBlocks.push(block);voxelTargets.push(block);toast('BLOCK PLACED');}
 else if(hit.object.isInstancedMesh){const obj=hit.object,m=new THREE.Matrix4();obj.getMatrixAt(hit.instanceId,m);const pos=new THREE.Vector3().setFromMatrixPosition(m);const zero=new THREE.Object3D();zero.position.copy(pos);zero.scale.setScalar(0);zero.updateMatrix();obj.setMatrixAt(hit.instanceId,zero.matrix);obj.instanceMatrix.needsUpdate=true;toast('BLOCK BROKEN');}
 else{const object=hit.object;scene.remove(object);const a=voxelTargets.indexOf(object);if(a>=0)voxelTargets.splice(a,1);const b=placedBlocks.indexOf(object);if(b>=0)placedBlocks.splice(b,1);toast('BLOCK BROKEN');}
});
function cycleLeds(){ledStep=(ledStep+1)%palette.length;for(let i=0;i<ledMaterials.length;i++){const c=palette[(i+ledStep)%palette.length];ledMaterials[i].color.setHex(c);ledMaterials[i].emissive.setHex(c);}cars.forEach((car,i)=>{const c=palette[(i+ledStep)%palette.length];car.userData.underglow.color.setHex(c);});document.documentElement.style.setProperty('--aqua',colorHex(palette[ledStep]));toast(`LED SPECTRUM · ${['PINK','VIOLET','ICE','MINT','GOLD','EMBER','ULTRA'][ledStep]}`);}
document.querySelector('#ledBtn').addEventListener('click',cycleLeds);
let soundOn=false;document.querySelector('#soundBtn').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.querySelector('span').textContent=soundOn?'SOUND ON':'SOUND OFF';toast(soundOn?'AMBIENCE ON':'AMBIENCE OFF');});
function toggleCar(){
 if(activeCar){activeCar.position.set(activeCar.position.x,activeCar.position.y,activeCar.position.z);player.set(activeCar.position.x,1.72,activeCar.position.z-4);activeCar=null;speed=0;document.body.classList.remove('in-car');document.querySelector('#modeLabel').textContent='ON FOOT';document.querySelector('#speedBox').style.display='none';document.querySelector('#crosshair').style.display='';toast('BACK ON FOOT');return;}
 if(!started){startGame();return;}const car=cars[selected];
 const d=Math.hypot(player.x-car.position.x,player.z-car.position.z);
 if(d>5.3){toast('WALK CLOSER TO THE SELECTED CAR');return;}
 activeCar=car;speed=0;yaw=car.rotation.y;document.exitPointerLock?.();document.body.classList.add('in-car');document.querySelector('#modeLabel').textContent='IN VEHICLE';document.querySelector('#crosshair').style.display='none';document.querySelector('#speedBox').style.display='flex';toast(`YOU'RE IN THE ${carSpecs[selected].name.toUpperCase()}`);
}
document.querySelector('#mobileEnter').addEventListener('click',toggleCar);
document.querySelectorAll('.dpad button').forEach(button=>{const k=button.dataset.key;button.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;});for(const evt of ['pointerup','pointerleave','pointercancel'])button.addEventListener(evt,()=>keys[k]=false);});
let touchLook=null;canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&started&&!activeCar){touchLook={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(touchLook&&e.pointerType==='touch'){yaw-=(e.clientX-touchLook.x)*.006;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-touchLook.y)*.005,-.52,.42);touchLook={x:e.clientX,y:e.clientY};}});
canvas.addEventListener('pointerup',()=>touchLook=null);

const clock=new THREE.Clock();let frame=0;
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.045);frame+=dt;
 if(!activeCar){
  if(started){const forward=Number(!!(keys.w||keys.arrowup))-Number(!!(keys.s||keys.arrowdown));const side=Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft));const move=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw)).multiplyScalar(forward).add(new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw)).multiplyScalar(side));if(move.lengthSq()>0){move.normalize().multiplyScalar(5.1*dt);player.add(move);player.x=THREE.MathUtils.clamp(player.x,-28,28);player.z=THREE.MathUtils.clamp(player.z,-29,26);}}
  camera.position.copy(player);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
 }else{
  const car=activeCar,spec=car.userData.spec;const accelerate=Number(!!(keys.w||keys.arrowup)),reverse=Number(!!(keys.s||keys.arrowdown)),steer=Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft));
  if(accelerate)speed=Math.min(spec.top,speed+spec.accel*10*dt);else if(reverse)speed=Math.max(-48,speed-spec.accel*7*dt);else speed*=Math.max(0,1-dt*.72);
  const turn=steer*(.72+Math.min(Math.abs(speed)/95,1)*1.5)*Math.sign(speed||1);car.rotation.y+=turn*dt;
  car.position.x+=Math.sin(car.rotation.y)*speed*.027*dt;car.position.z+=Math.cos(car.rotation.y)*speed*.027*dt;
  car.position.x=THREE.MathUtils.clamp(car.position.x,-31,31);car.position.z=THREE.MathUtils.clamp(car.position.z,-30,25);
  car.userData.wheels.forEach(w=>{w.rotation.x+=speed*dt*.04;});
  const behind=new THREE.Vector3(-Math.sin(car.rotation.y)*8,3.8,-Math.cos(car.rotation.y)*8);const target=car.position.clone().add(behind);camera.position.lerp(target,1-Math.exp(-4.3*dt));camera.lookAt(car.position.x,car.position.y+1.05,car.position.z);
  document.querySelector('#speed').textContent=String(Math.round(Math.abs(speed))).padStart(3,'0');
 }
 const nearest=cars[selected],distance=Math.hypot(player.x-nearest.position.x,player.z-nearest.position.z);
 document.querySelector('#prompt').classList.toggle('visible',started&&!activeCar&&distance<5.3);
 document.querySelector('#coords').textContent=`X ${Math.round(activeCar?activeCar.position.x:player.x)} · Z ${Math.round(activeCar?activeCar.position.z:player.z)}`;
 renderer.render(scene,camera);
}
function onResize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);}
window.addEventListener('resize',onResize);
setTimeout(()=>document.querySelector('#loading').classList.add('done'),700);
setTimeout(()=>document.querySelector('#loading').remove(),1450);
animate();
