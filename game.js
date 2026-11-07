import * as THREE from 'three';

const canvas=document.querySelector('#world');
const scene=new THREE.Scene();
const skyCanvas=document.createElement('canvas');
skyCanvas.width=512;skyCanvas.height=256;
const skyCtx=skyCanvas.getContext('2d'),skyGradient=skyCtx.createLinearGradient(0,0,0,256);
skyGradient.addColorStop(0,'#83a9bf');skyGradient.addColorStop(.58,'#b7c9c4');skyGradient.addColorStop(1,'#e1d8c2');
skyCtx.fillStyle=skyGradient;skyCtx.fillRect(0,0,512,256);
function paintCloud(x,y,rx,ry,opacity){skyCtx.save();skyCtx.translate(x,y);skyCtx.scale(rx,ry);const cloud=skyCtx.createRadialGradient(0,0,.04,0,0,1);cloud.addColorStop(0,`rgba(255,251,239,${opacity})`);cloud.addColorStop(.55,`rgba(255,250,232,${opacity*.62})`);cloud.addColorStop(1,'rgba(255,250,232,0)');skyCtx.fillStyle=cloud;skyCtx.fillRect(-1,-1,2,2);skyCtx.restore()}
for(const [x,y,s] of [[48,68,1],[174,90,.72],[286,58,.82],[420,78,1.05],[510,103,.72]]){
 paintCloud(x,y,74*s,20*s,.2);paintCloud(x-27*s,y+3*s,30*s,25*s,.23);paintCloud(x+3*s,y-9*s,34*s,31*s,.25);paintCloud(x+31*s,y+2*s,32*s,23*s,.21);
}
const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;scene.background=skyTexture;
scene.fog=new THREE.FogExp2('#c9d1c5',.0025);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
scene.add(new THREE.HemisphereLight('#dcebe5','#58614f',1.25));
const sun=new THREE.DirectionalLight('#fff0d3',3.4);sun.position.set(-38,65,32);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;scene.add(sun);
const fill=new THREE.DirectionalLight('#c2d9ec',.8);fill.position.set(45,28,-48);scene.add(fill);
const world=new THREE.Group();scene.add(world);const city=new THREE.Group();world.add(city);const buildGroup=new THREE.Group();world.add(buildGroup);
const mat=(color,rough=.8,extra={})=>new THREE.MeshStandardMaterial({color,roughness:rough,...extra});
function surfaceTexture(base,spread,seed,repeatX=1,repeatY=1){const size=256,data=new Uint8Array(size*size*4),rng=seeded(seed),color=new THREE.Color(base),grid=Array.from({length:4},()=>Array.from({length:4},rng));const smooth=t=>t*t*(3-2*t),noise=(x,y)=>{const gx=x*4,gy=y*4,ix=Math.floor(gx),iy=Math.floor(gy),fx=smooth(gx-ix),fy=smooth(gy-iy),at=(a,b)=>grid[((b%4)+4)%4][((a%4)+4)%4];return THREE.MathUtils.lerp(THREE.MathUtils.lerp(at(ix,iy),at(ix+1,iy),fx),THREE.MathUtils.lerp(at(ix,iy+1),at(ix+1,iy+1),fx),fy)};for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size,n=((noise(u,v)-.5)*.72+(rng()-.5)*.28)*spread,at=(y*size+x)*4;data[at]=Math.max(0,Math.min(255,(color.r+n)*255));data[at+1]=Math.max(0,Math.min(255,(color.g+n)*255));data[at+2]=Math.max(0,Math.min(255,(color.b+n)*255));data[at+3]=255}const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeatX,repeatY);texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture}
const grassMap=surfaceTexture('#87976b',.09,381,68,74),roadMap=surfaceTexture('#555a57',.065,817,24,1.4),plasterMap=surfaceTexture('#eee8da',.035,1234,2.2,2.2);
const mGrass=new THREE.MeshStandardMaterial({color:'#fff',map:grassMap,bumpMap:grassMap,bumpScale:.025,roughness:1}),mRoad=new THREE.MeshStandardMaterial({color:'#fff',map:roadMap,bumpMap:roadMap,bumpScale:.012,roughness:.96}),mLine=mat('#e4d8ae',.65),mCurb=mat('#b9b8a5'),mWater=new THREE.MeshPhysicalMaterial({color:'#71a9a4',roughness:.18,metalness:.08,clearcoat:.6,clearcoatRoughness:.18}),mLeaf=mat('#587a50',.94),mLeaf2=mat('#79955a',.92),mTrunk=mat('#735f49',.95),mWindow=mat('#9dbdc3',.2,{metalness:.22}),mLit=mat('#e8cd91',.24,{emissive:'#d08c41',emissiveIntensity:.28}),mWhite=mat('#e9e2cf'),mWood=mat('#92704b'),mFrame=mat('#e0d9c9',.65),mWindowDark=mat('#435250',.55),mSidewalk=mat('#aaa99f',.94),mLampMetal=mat('#38413d',.56,{metalness:.42}),mLampGlass=mat('#f2d89a',.26,{emissive:'#f2c877',emissiveIntensity:.7});
function meshBox(parent,x,y,z,sx,sy,sz,material,cast=true,receive=true){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=receive;parent.add(o);return o}
function cyl(parent,x,y,z,r1,r2,h,material,seg=9){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function seeded(seed){let n=seed>>>0;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296}}
const rand=seeded(2817);
function addTree(x,z,scale=1,kind=0){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);city.add(g);cyl(g,0,1.2,0,.18,.27,2.4,mTrunk,10);const leaf=kind===1?mLeaf2:mLeaf;for(let b=0;b<3;b++){const limb=cyl(g,(b-1)*.14,1.55+b*.13,0,.055,.1,.95,mTrunk,7);limb.rotation.z=(b-1)*-.42-.2}for(let i=0;i<7;i++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(kind===2?.66+rand()*.16:.72+rand()*.26,2),i%3===0?mLeaf2:leaf);crown.position.set((rand()-.5)*1.12,2.05+i*.2,(rand()-.5)*.95);crown.scale.set(.88+rand()*.36,.82+rand()*.34,.88+rand()*.36);crown.castShadow=true;crown.receiveShadow=true;g.add(crown)}return g}
function addRoad(x,z,w,d){meshBox(city,x,.035,z,w,.08,d,mRoad,false,true);for(const side of [-1,1])meshBox(city,x,.1,z+side*d/2,w,.18,.28,mCurb,false,true);for(let xx=x-w/2+3;xx<x+w/2;xx+=5)meshBox(city,xx,.09,z,2.4,.015,.1,mLine,false,false);if(w>=d){for(const side of [-1,1]){const pathZ=z+side*(d/2+1.55);meshBox(city,x,.095,pathZ,w,.12,2.25,mSidewalk,false,true);for(let xx=x-w/2+2;xx<x+w/2;xx+=3)meshBox(city,xx,.158,pathZ, .025,.008,2.12,mCurb,false,false)}}else for(const side of [-1,1]){const pathX=x+side*(w/2+1.55);meshBox(city,pathX,.095,z,2.25,.12,d,mSidewalk,false,true);for(let zz=z-d/2+2;zz<z+d/2;zz+=3)meshBox(city,pathX,.158,zz,2.12,.008,.025,mCurb,false,false)}}
function addStreetLamp(x,z,rotationY=0){const pole=new THREE.Group();pole.position.set(x,0,z);pole.rotation.y=rotationY;city.add(pole);cyl(pole,0,2.45,0,.085,.11,4.9,mLampMetal,10);cyl(pole,0,.18,0,.2,.16,.34,mLampMetal,10);const arm=meshBox(pole,.43,4.82,0,.92,.075,.075,mLampMetal);arm.rotation.z=-.16;const shade=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),mLampGlass);shade.position.set(.82,4.65,0);shade.castShadow=true;pole.add(shade);const cap=new THREE.Mesh(new THREE.ConeGeometry(.27,.18,12),mLampMetal);cap.position.set(.82,4.84,0);pole.add(cap)}
const mCrosswalk=mat('#d7d2c1',.88);
function addCrosswalk(x,z,acrossZ=false){for(let i=-4;i<=4;i++){const offset=i*.82;if(acrossZ)meshBox(city,x,.091,z+offset,6.1,.022,.48,mCrosswalk,false,false);else meshBox(city,x+offset,.091,z,.48,.022,6.1,mCrosswalk,false,false)}}
function addBuilding(x,z,w,d,h,seed){
 const r=seeded(seed),g=new THREE.Group();g.position.set(x,0,z);city.add(g);
 const pal=['#cbbca6','#bbc6bb','#d8cfbd','#a99d8d','#b4bfba','#dfd8c9','#c0b9a8','#aeb6ab'];
 const facade=new THREE.MeshStandardMaterial({color:pal[Math.floor(r()*pal.length)],map:plasterMap,roughness:.9});
 const trim=mat(r()>.55?'#e1d8c8':'#aaa493',.82),roofMat=mat('#74796f',.9),pipeMat=mat('#666c65',.68);
 meshBox(g,0,h/2,0,w,h,d,facade);meshBox(g,0,.24,0,w+.16,.48,d+.16,mat('#817e70',.9));
 meshBox(g,0,h+.08,0,w+.5,.16,d+.5,roofMat);meshBox(g,0,h+.28,d/2+.1,w+.2,.22,.2,trim);
 for(const side of [-1,1]){meshBox(g,side*(w/2-.07),h*.52,d/2+.08,.14,h*.94,.16,trim,false,false);cyl(g,side*(w/2-.17),h/2,d/2+.19,.035,.035,h,pipeMat,6)}
 const floors=Math.floor(h/2.5),cols=Math.max(2,Math.floor(w/1.65)),ww=Math.min(.92,w/(cols+1)*.52);
 for(let f=0;f<floors;f++){
  const yy=1.12+f*2.35;
  for(let c=0;c<cols;c++){
   const xx=-w/2+(c+1)*w/(cols+1),lit=r()>.83,pane=lit?mLit:mWindow;
   meshBox(g,xx,yy,d/2+.068,ww+.22,1.24,.13,trim,false,true);
   meshBox(g,xx,yy,d/2+.143,ww,1.03,.035,pane,false,true);
   meshBox(g,xx,yy-.02,d/2+.166,.045,.99,.025,trim,false,false);
   meshBox(g,xx,yy-.03,d/2+.17,ww,.045,.028,trim,false,false);
   meshBox(g,xx,yy-.61,d/2+.18,ww+.26,.09,.24,trim,false,false);
   if(f>0&&f%3===1&&c===Math.floor(cols/2)){
    const bz=d/2+.43;meshBox(g,xx,yy-.55,bz,ww+.5,.12,.72,roofMat,false,true);
    meshBox(g,xx,yy-.12,bz+.34,ww+.5,.07,.07,pipeMat,false,false);
    for(const bx of [-ww*.42,0,ww*.42])meshBox(g,xx+bx,yy-.34,bz+.34,.035,.38,.035,pipeMat,false,false);
   }
  }
  if(f>0)meshBox(g,0,yy+1.18,d/2+.12,w+.04,.07,.16,trim,false,false);
  for(let side of [-1,1]){const zz=(side>0?1:-1)*d*.22,lit=r()>.84;meshBox(g,side*(w/2+.035),yy,zz,.09,1.05,.82,trim,false,true);meshBox(g,side*(w/2+.09),yy,zz,.035,.9,.64,lit?mLit:mWindow,false,true);meshBox(g,side*(w/2+.12),yy-.55,zz,.16,.08,.92,trim,false,false)}
 }
 const doorW=Math.min(1.05,w*.22);meshBox(g,-w*.22,1.25,d/2+.08,doorW+.16,2.3,.14,trim,false,true);meshBox(g,-w*.22,1.25,d/2+.17,doorW,2.12,.035,mat('#52665f',.68),false,true);
 meshBox(g,0,1.12,d/2+.2,Math.min(w*.58,4.4),.12,.72,mat('#53645d',.8),false,true);
 meshBox(g,-w*.22,2.48,d/2+.38,doorW+.55,.18,.72,mat(['#687d70','#88745e','#747b79'][Math.floor(r()*3)],.82),false,true);
 if(r()>.42){const hx=(r()-.5)*w*.45,hz=(r()-.5)*d*.35;meshBox(g,hx,h+.42,hz,1.15,.62,.9,mat('#9a9b90',.9));meshBox(g,hx,h+.75,hz,.72,.08,.56,roofMat,false,false)}
}
function buildEnvironment(){meshBox(city,0,-.22,0,240,.42,260,mGrass,false,true);for(let i=0;i<55;i++){const patch=new THREE.Mesh(new THREE.CircleGeometry(2+rand()*5,10),mat(i%2?'#7f955c':'#81965e'));patch.rotation.x=-Math.PI/2;patch.position.set((rand()-.5)*190,.004,-35-rand()*115);city.add(patch)}
 addRoad(0,-15,130,7);addRoad(0,-74,150,8);addRoad(0,-48,7,90);addRoad(-68,-54,8,67);addRoad(34,-51,7,91);
  for(const [x,z] of [[0,-15],[34,-15],[-68,-74],[0,-74],[34,-74]])for(const side of [-1,1]){addCrosswalk(x+side*6.5,z);addCrosswalk(x,z+side*6.5,true)}
 for(const x of [-52,-26,0,26,52]){addStreetLamp(x,-20.05,-Math.PI/2);addStreetLamp(x,-9.95,Math.PI/2)}
 for(const x of [-60,-30,0,30,60]){addStreetLamp(x,-80, -Math.PI/2);addStreetLamp(x,-68,Math.PI/2)}
 for(const z of [-32,-56,-80]){addStreetLamp(-53.05,z,0);addStreetLamp(-42.95,z,Math.PI);addStreetLamp(28.45,z,0);addStreetLamp(39.55,z,Math.PI)}
 for(const z of [-34,-58,-82]){addStreetLamp(-73.05,z,0);addStreetLamp(-62.95,z,Math.PI)}
 meshBox(city,0,.035,-108,166,.1,13,mRoad,false,true);meshBox(city,0,.1,-100.8,166,.18,.35,mCurb,false,true);meshBox(city,0,.1,-115.2,166,.18,.35,mCurb,false,true);for(let x=-78;x<82;x+=7)meshBox(city,x,.1,-108,3.8,.025,.12,mLine,false,false);meshBox(city,0,.1,-108,.14,.02,12,mat('#ded3a6'),false,false);
 const creek=meshBox(city,52,.015,17,13,.08,82,mWater,false,true);creek.rotation.y=-.12;for(let z=-24;z<54;z+=5)cyl(city,46+(rand()-.5)*2,.4,z,.035,.025,.8,mLeaf2,5);
 meshBox(city,52,.35,18,18,.5,4.5,mat('#9c8866'));for(const s of [-1,1])meshBox(city,52,.8,18+s*2.1,18,.12,.14,mWood);
 for(let i=0;i<16;i++){const x=-57+i*7.6,z=-46-(i%3)*7;addBuilding(x,z,5.1+(i%3)*.65,5.6+(i%2),10+(i%5)*3.2,741+i*33)}
 for(let i=0;i<9;i++){const z=-40-i*7.5;addBuilding(-75,z,7,7,15+(i%3)*4,1500+i*19);addBuilding(75,z,7.5,7,18+(i%4)*3,1900+i*21)}
 for(let i=0;i<8;i++)addBuilding(-28+i*8,-26-(i%2)*2,6.6,6.3,7+(i%3)*1.3,2500+i*31);
 for(let i=0;i<120;i++){let x,z;if(i<50){x=(rand()-.5)*125;z=4+rand()*62;if(Math.abs(x)<24&&z<35)continue}else{x=(rand()-.5)*190;z=-31-rand()*89;if(Math.abs(x)<40&&z>-68)continue}addTree(x,z,.72+rand()*.68,Math.floor(rand()*3))}
 for(let i=0;i<80;i++)addTree((i%2?1:-1)*(88+rand()*20),-20-rand()*115,1.3+rand(),Math.floor(rand()*3));
 for(let i=0;i<7;i++){const x=-42+i*5.2;meshBox(city,x,.12,17,3.8,.2,2.1,mat('#927b5e'));meshBox(city,x,.25,17,3.4,.1,1.7,mat(i%2?'#84975d':'#7a8a50'));for(let j=0;j<4;j++){const f=new THREE.Mesh(new THREE.SphereGeometry(.22,7,6),mat(j%2?'#d18b7e':'#f0d484'));f.position.set(x-1.1+j*.72,.62+rand()*.18,17+(rand()-.5)*.7);city.add(f)}}
 for(const [x,z] of [[-14,17],[-8,17],[-14,23],[-8,23]])cyl(city,x,1.8,z,.12,.12,3.6,mat('#816a4e'),8);meshBox(city,-11,3.72,20,7,.28,7,mat('#887657'));meshBox(city,-11,.11,20,7,.18,7,mat('#b8a782'),false,true);
}
buildEnvironment();
const catalog=[];const addItem=(name,category,type,color,extra={})=>catalog.push({id:`${type}-${catalog.length}`,name,category,type,color,...extra});
const woods=[['Oak','#a77b4e'],['Acacia','#bb7046'],['Pale oak','#d2c49f'],['Poplar','#b6ad87'],['Cherry','#955d58'],['Dark oak','#594333'],['Pine','#a78b5e'],['Spruce','#745b43']];for(const [wood,color] of woods)for(const part of ['log','wall','fence','slab','door'])addItem(`${wood} ${part}`,'Timbers',part,color,{wood});
const stones=[['Carved limestone','#c9c4b5','stone'],['Travertine block','#c8b99c','stone'],['Mossed stone','#77836f','stone'],['Ashlar block','#98978c','stone'],['Slate block','#626a6c','stone'],['Limestone thick fence','#c7c1af','stoneFence'],['Slate thick fence','#6d7270','stoneFence'],['Sandstone thick fence','#bd9c6a','stoneFence'],['Marble block · Carrara','#e5e2d9','stone'],['Marble block · Nero','#24282a','stone'],['Marble block · Rose','#b9847e','stone'],['Marble block · Veined','#dedbd1','pattern'],['Marble block · Noir pattern','#272a2d','pattern'],['Marble slab · white','#e8e5de','slab'],['Marble slab · black','#292d30','slab'],['Marble thin slab · white','#e7e2d6','thinSlab'],['Marble thin slab · black','#24282a','thinSlab'],['Marble thin slab · veined','#d4d0c4','patternSlab'],['Marble thin slab · terrazzo','#b8b2a1','patternSlab']];for(const [name,color,type] of stones)addItem(name,'Stone',type,color,{pattern:/pattern|veined|terrazzo/i.test(name)});
const palette=[['Rose','#e68a91'],['Coral','#f28b62'],['Amber','#f4be55'],['Lemon','#e8df77'],['Mint','#8ecb9d'],['Teal','#65b9b2'],['Sky','#78b8df'],['Cobalt','#6686d8'],['Violet','#a783d3'],['Pink','#df8cbd'],['White','#f4f1dc'],['Ice','#c5e8e4']];
for(const [colorName,color] of palette){for(const [form,type] of [['LED stick','ledStick'],['LED plate','ledPlate'],['LED circle','ledCircle']])addItem(`${colorName} ${form}`,'Lights',type,color,{glow:true});for(const [form,type] of [['Colored glass','glass'],['Wool block','wool'],['Concrete block','concrete']])addItem(`${colorName} ${form}`,'Color',type,color)}
for(const [name,color] of [['Warm lamp','#f7d58b'],['Cool lamp','#d5edff'],['Garden lamp','#b7dda1'],['Paper lantern','#f4bca1'],['Bulb · amber','#f8c46f'],['Bulb · pearl','#f6f1dc']])addItem(name,'Lights',name.includes('Bulb')?'bulb':'lamp',color,{glow:true});
for(const [family,color] of [['Glock','#4d5354'],['AR','#58605a'],['AK','#6f6049'],['SMG','#51575a'],['Minigun','#626a68'],['Plasma','#55b8c5']])for(const finish of ['display prop','wall mount'])addItem(`${family} · ${finish}`,'Display props','display',color,{family,glow:family==='Plasma'});
const player=new THREE.Group();world.add(player);player.position.set(0,0,9);
const skinMat=mat('#d7ad86'),shirtMat=mat('#526d5d'),pantsMat=mat('#414a43'),shoeMat=mat('#b9b4a5'),hairMat=mat('#51463a');
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.36,.62,6,12),shirtMat);torso.position.y=1.02;torso.castShadow=true;player.add(torso);
cyl(player,0,1.48,0,.14,.15,.22,skinMat,12);cyl(player,0,1.39,-.015,.19,.2,.08,mat('#d2c4a4'),12);
const head=new THREE.Mesh(new THREE.SphereGeometry(.27,20,16),skinMat);head.position.y=1.72;head.castShadow=true;player.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.275,18,12,0,Math.PI*2,0,Math.PI*.56),hairMat);hair.position.set(0,1.79,.018);hair.castShadow=true;player.add(hair);
for(const x of [-.085,.085]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.027,10,8),mat('#302c27'));eye.position.set(x,1.8,-.211);player.add(eye)}
const nose=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),skinMat);nose.position.set(0,1.73,-.235);player.add(nose);
const arms=[];for(const x of [-1,1]){const arm=new THREE.Group();arm.position.set(x*.37,1.29,0);player.add(arm);arms.push(arm);const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.48,5,10),shirtMat);sleeve.position.set(x*.04,-.3,0);sleeve.rotation.z=x*-.08;sleeve.castShadow=true;arm.add(sleeve);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.108,.11,.08,10),mat('#465a4d'));cuff.position.set(x*.04,-.55,0);arm.add(cuff);const hand=new THREE.Mesh(new THREE.SphereGeometry(.105,12,10),skinMat);hand.position.set(x*.04,-.66,-.005);hand.castShadow=true;arm.add(hand);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.5,5,10),pantsMat);leg.position.set(x*.2,.39,0);leg.castShadow=true;player.add(leg);meshBox(player,x*.2,.09,-.04,.29,.16,.43,shoeMat)}
const camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,420);scene.add(camera);
let yaw=0,pitch=.16,rotation=0,selected=catalog.find(i=>i.name==='Oak wall'),ghost=null,inventoryOpen=false,showFavorites=false,currentCategory='All',toastTimer=0;
const keys=new Set(),buildRay=new THREE.Raycaster(),center=new THREE.Vector2(0,0),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitPoint=new THREE.Vector3(),forward=new THREE.Vector3(),lookTarget=new THREE.Vector3();let joystick={x:0,y:0},dragging=false,lastPointer=null;
const ui=id=>document.getElementById(id);const toast=ui('toast');
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2100)}
const saved=[];try{const data=JSON.parse(localStorage.getItem('evergreen-builds')||'[]');if(Array.isArray(data))saved.push(...data)}catch{}
let buildSerial=0;
function makePlaceable(item,pos,angle=0){const group=new THREE.Group();group.position.copy(pos);group.rotation.y=angle;const color=item.color,type=item.type,base=mat(color,.68,item.glow?{emissive:color,emissiveIntensity:.42}:{}),dark=mat(new THREE.Color(color).multiplyScalar(.68),.76),trim=mat('#d6c6a2',.72);const box=(x,y,z,sx,sy,sz,m=base)=>meshBox(group,x,y,z,sx,sy,sz,m);const post=(x,y,z,r,h,m=base)=>cyl(group,x,y,z,r,r,h,m,8);
 if(type==='log'){post(0,1,0,.26,2,base);const cap=mat(new THREE.Color(color).multiplyScalar(1.13));cyl(group,0,1.91,.001,.21,.21,.025,cap,10)}
 else if(type==='wall'||type==='stone'||type==='pattern'||type==='concrete'||type==='wool'||type==='glass')box(0,1,0,2,2,.28,type==='glass'?mat(color,.16,{transparent:true,opacity:.48,metalness:.12}):base);
 else if(type==='slab')box(0,.5,0,2,1,.28,base);
 else if(type==='thinSlab'||type==='patternSlab')box(0,.13,0,2,.26,2,base);
 else if(type==='fence'||type==='stoneFence'){const thick=type==='stoneFence';for(const x of [-.84,.84])box(x,thick?1:1,.0,thick?.32:.18,2,thick?.34:.22,base);for(const y of [.48,1.48])box(0,y,.0,1.7,thick?.34:.17,thick?.25:.2,base);if(!thick)for(const x of [-.42,0,.42])box(x,1,.0,.08,1.2,.12,base)}
 else if(type==='door'){box(0,1.08,0,1.28,2.16,.16,base);for(const y of [.45,1.05,1.65])box(0,y,-.09,1.12,.045,.025,dark);post(.43,1.05,-.13,.045,.08,trim)}
 else if(type==='ledStick'){box(0,1,0,.18,2,.18,base);post(0,1,0,.23,2,mat(color,.22,{emissive:color,emissiveIntensity:1.2}))}
 else if(type==='ledPlate')box(0,.15,0,2,.3,2,mat(color,.24,{emissive:color,emissiveIntensity:.8}))
 else if(type==='ledCircle'){const disc=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,.18,32),mat(color,.2,{emissive:color,emissiveIntensity:1}));disc.position.y=.2;disc.castShadow=true;group.add(disc)}
 else if(type==='lamp'||type==='bulb'){post(0,.85,0,.07,1.7,dark);const shade=new THREE.Mesh(new THREE.SphereGeometry(.31,12,8),mat(color,.2,{emissive:color,emissiveIntensity:1.1}));shade.position.y=1.82;group.add(shade);if(type==='lamp'){box(0,1.48,0,.72,.08,.72,dark);box(0,2.18,0,.7,.08,.7,dark)}}
 else if(type==='display'){const prop=new THREE.Group();prop.rotation.z=-.12;group.add(prop);const metal=base;box(0,.62,0,item.family==='Minigun'?1.5:1.25,.25,.3,metal);box(-.12,.34,.02,.4,.42,.3,dark);box(.42,.82,0,.54,.11,.14,metal);if(item.family==='Minigun'){for(let i=0;i<4;i++){const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.8,8),metal);barrel.rotation.z=Math.PI/2;barrel.position.set(.9,.62,(i-1.5)*.11);prop.add(barrel)}}else{box(.88,.62,0,.6,.1,.1,metal);if(item.family==='Plasma')post(.25,.62,.18,.11,.44,mat(color,.15,{emissive:color,emissiveIntensity:1}))}box(-.05,.14,0,.38,.06,.34,trim);group.userData.displayProp=true}
 else box(0,.5,0,1,1,1,base);
 const pad=type==='thinSlab'||type==='patternSlab'||type==='ledPlate'?0:.05;group.position.y+=pad;group.userData.itemId=item.id;group.userData.name=item.name;return group}
function addBuild(item,pos,angle=rotation,persist=true,key=null){const obj=makePlaceable(item,pos,angle),saveKey=key||`build-${Date.now()}-${++buildSerial}`;obj.userData.saveKey=saveKey;buildGroup.add(obj);if(persist){saved.push({key:saveKey,id:item.id,x:pos.x,y:pos.y,z:pos.z,rotation:angle});saveBuilds()}return obj}
function updateBuildActions(){const button=ui('undoBtn');if(!button)return;button.disabled=saved.length===0;button.title=saved.length?`Undo last placement · ${saved.length} placed (Ctrl+Z)`:'Nothing to undo'}
function saveBuilds(){try{localStorage.setItem('evergreen-builds',JSON.stringify(saved))}catch{notify('Could not save this build on your device')}updateBuildActions()}
for(const item of saved){const material=catalog.find(i=>i.id===item.id);if(material){item.key||=`build-${++buildSerial}`;addBuild(material,new THREE.Vector3(item.x,item.y,item.z),item.rotation||0,false,item.key)}}
function undoBuild(){if(!saved.length){notify('Nothing to undo yet');return}const item=saved.pop(),obj=buildGroup.children.find(child=>child.userData.saveKey===item.key);if(obj)buildGroup.remove(obj);saveBuilds();notify('Last placement undone')}
function removeBuildAt(clientX,clientY){const rect=canvas.getBoundingClientRect(),pointer=new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-((clientY-rect.top)/rect.height)*2+1);buildRay.setFromCamera(pointer,camera);const hit=buildRay.intersectObjects(buildGroup.children.filter(o=>o!==ghost),true)[0];if(!hit)return false;let obj=hit.object;while(obj.parent&&obj.parent!==buildGroup)obj=obj.parent;if(obj===ghost||!obj.userData.saveKey)return false;const index=saved.findIndex(item=>item.key===obj.userData.saveKey);buildGroup.remove(obj);if(index>=0)saved.splice(index,1);saveBuilds();notify('Placed item removed');return true}
updateBuildActions();
function makeGhost(){if(ghost){buildGroup.remove(ghost);ghost=null}if(!selected)return;ghost=makePlaceable(selected,new THREE.Vector3(player.position.x,0,player.position.z-4),rotation);ghost.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.4;o.material.depthWrite=false;o.material.emissive=new THREE.Color('#a9d986');o.material.emissiveIntensity=.24;o.castShadow=false;o.receiveShadow=false}});ghost.userData.ghost=true;buildGroup.add(ghost)}
makeGhost();
function updateGhost(){if(!ghost||!selected)return;buildRay.setFromCamera(center,camera);const buildHits=buildRay.intersectObjects(buildGroup.children.filter(o=>o!==ghost),true);let y=0;if(buildHits.length&&buildHits[0].distance<45)y=Math.max(0,buildHits[0].point.y);else if(!buildRay.ray.intersectPlane(groundPlane,hitPoint)||hitPoint.distanceTo(camera.position)>50){ghost.visible=false;return}else hitPoint.y=0;ghost.visible=true;const point=buildHits.length&&buildHits[0].distance<45?buildHits[0].point:hitPoint;const gx=Math.round(point.x/2)*2,gz=Math.round(point.z/2)*2;ghost.position.set(gx,Math.max(0,y),gz);ghost.rotation.y=rotation}
function place(){if(!selected||!ghost||!ghost.visible)return;const pos=ghost.position.clone();addBuild(selected,pos,rotation,true);notify(`${selected.name} placed`)}
const categoryNames=['All',...new Set(catalog.map(item=>item.category))];let favorites=new Set();try{favorites=new Set(JSON.parse(localStorage.getItem('evergreen-favorites')||'[]'))}catch{}
function renderCategories(){const host=ui('categories');host.innerHTML='';for(const name of categoryNames){const button=document.createElement('button');button.className=`category${currentCategory===name?' active':''}`;button.textContent=name;button.onclick=()=>{currentCategory=name;renderCategories();renderItems()};host.append(button)}}
function choose(item){selected=item;ui('selectedName').textContent=item.name;ui('selectedHint').textContent='Ready to place · unlimited';ui('equipBtn').disabled=false;ui('chipName').textContent=item.name;ui('selectedChip').querySelector('.chip-swatch').style.background=item.color;makeGhost();renderItems()}
function renderItems(){const term=ui('search').value.trim().toLowerCase();const found=catalog.filter(item=>(currentCategory==='All'||item.category===currentCategory)&&(!showFavorites||favorites.has(item.id))&&(!term||item.name.toLowerCase().includes(term)));ui('itemCount').textContent=found.length;const grid=ui('itemsGrid');grid.innerHTML='';if(!found.length){const empty=document.createElement('p');empty.className='empty-inventory';empty.textContent='No materials match. Try another search or category.';grid.append(empty)}for(const item of found){const card=document.createElement('button');card.className=`item-card${selected?.id===item.id?' selected':''}`;card.title=item.name;const swatch=document.createElement('span');swatch.className='item-swatch';swatch.style.background=item.color;if(item.type==='glass')swatch.style.opacity='.6';const label=document.createElement('b');label.textContent=item.name;const star=document.createElement('em');star.textContent=favorites.has(item.id)?'★':'☆';star.setAttribute('aria-label','Favorite');star.onclick=e=>{e.stopPropagation();favorites.has(item.id)?favorites.delete(item.id):favorites.add(item.id);localStorage.setItem('evergreen-favorites',JSON.stringify([...favorites]));renderItems()};card.append(swatch,label,star);card.onclick=()=>choose(item);grid.append(card)}}
renderCategories();renderItems();choose(selected);
function toggleInventory(force){inventoryOpen=force??!inventoryOpen;ui('inventory').classList.toggle('open',inventoryOpen)}
ui('inventoryToggle').onclick=()=>toggleInventory();ui('closeInventory').onclick=()=>toggleInventory(false);ui('equipBtn').onclick=()=>{toggleInventory(false);notify(`${selected.name} equipped`)};
ui('search').addEventListener('input',renderItems);ui('favoritesBtn').onclick=()=>{showFavorites=!showFavorites;ui('favoritesBtn').classList.toggle('active',showFavorites);renderItems()};
function rotate(){rotation=(rotation+Math.PI/2)%(Math.PI*2);if(ghost)ghost.rotation.y=rotation}
ui('rotateBtn').onclick=rotate;ui('chipRotate').onclick=rotate;ui('placeBtn').onclick=place;ui('eraseBtn').onclick=()=>{const rect=canvas.getBoundingClientRect();if(!removeBuildAt(rect.left+rect.width/2,rect.top+rect.height/2))notify('Aim at one of your placed items to remove it')};ui('undoBtn').onclick=undoBuild;
ui('helpBtn').onclick=()=>ui('helpModal').classList.add('open');ui('closeHelp').onclick=ui('gotIt').onclick=()=>ui('helpModal').classList.remove('open');
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;keys.add(e.code);if(e.code==='KeyB'){toggleInventory();e.preventDefault()}if(e.code==='KeyR')rotate();if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){undoBuild();e.preventDefault()}if(e.code==='Escape'){toggleInventory(false);ui('helpModal').classList.remove('open')}});window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;lastPointer={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging||!lastPointer)return;const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;if(Math.abs(dx)+Math.abs(dy)>3)lastPointer.moved=true;if(lastPointer.moved){yaw-=dx*.006;pitch=THREE.MathUtils.clamp(pitch+dy*.004,-.18,.72)}lastPointer.x=e.clientX;lastPointer.y=e.clientY});
function endCanvasPointer(e,shouldPlace=true){if(!dragging)return;if(shouldPlace&&lastPointer&&!lastPointer.moved)place();dragging=false;lastPointer=null}canvas.addEventListener('pointerup',e=>endCanvasPointer(e));canvas.addEventListener('pointercancel',e=>endCanvasPointer(e,false));canvas.addEventListener('contextmenu',e=>{e.preventDefault();removeBuildAt(e.clientX,e.clientY)});
const zone=ui('stickZone'),knob=ui('stickKnob');let stickPointer=null;
zone.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;zone.setPointerCapture(e.pointerId);updateStick(e)});zone.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e)});
function updateStick(e){const r=zone.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),length=Math.min(43,Math.hypot(dx,dy)),angle=Math.atan2(dy,dx);joystick.x=Math.cos(angle)*length/43;joystick.y=Math.sin(angle)*length/43;knob.style.transform=`translate(calc(-50% + ${joystick.x*32}px),calc(-50% + ${joystick.y*32}px))`}
function resetStick(e){if(e.pointerId!==stickPointer)return;stickPointer=null;joystick={x:0,y:0};knob.style.transform='translate(-50%,-50%)'}zone.addEventListener('pointerup',resetStick);zone.addEventListener('pointercancel',resetStick);
let audio=null,soundOn=false;ui('soundBtn').onclick=()=>{soundOn=!soundOn;ui('soundBtn').setAttribute('aria-pressed',String(soundOn));ui('soundBtn').textContent=soundOn?'♫':'♪';if(soundOn){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=110;gain.gain.value=.012;osc.connect(gain);gain.connect(audio.destination);osc.start();audio.osc=osc}catch{notify('Audio is unavailable in this browser')}}else if(audio?.osc){audio.osc.stop();audio.osc=null}};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight)});
const clock=new THREE.Clock();let walkTime=0;
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);forward.set(Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,Math.sin(yaw));let mx=0,mz=0;if(keys.has('KeyW')||keys.has('ArrowUp')){mx+=forward.x;mz+=forward.z}if(keys.has('KeyS')||keys.has('ArrowDown')){mx-=forward.x;mz-=forward.z}if(keys.has('KeyD')||keys.has('ArrowRight')){mx+=right.x;mz+=right.z}if(keys.has('KeyA')||keys.has('ArrowLeft')){mx-=right.x;mz-=right.z}mx+=right.x*joystick.x-forward.x*joystick.y;mz+=right.z*joystick.x-forward.z*joystick.y;const mag=Math.hypot(mx,mz);if(mag>.01){mx/=Math.max(1,mag);mz/=Math.max(1,mag);player.position.x+=mx*8.2*dt;player.position.z+=mz*8.2*dt;walkTime+=dt*10;player.rotation.y=Math.atan2(-mx,-mz);player.children[0].position.y=1.02+Math.sin(walkTime*2)*.025;arms[0].rotation.x=Math.sin(walkTime)*.38;arms[1].rotation.x=-Math.sin(walkTime)*.38}else{player.children[0].position.y=1.02;arms[0].rotation.x=THREE.MathUtils.damp(arms[0].rotation.x,0,8,dt);arms[1].rotation.x=THREE.MathUtils.damp(arms[1].rotation.x,0,8,dt)}
player.position.x=THREE.MathUtils.clamp(player.position.x,-112,112);player.position.z=THREE.MathUtils.clamp(player.position.z,-126,116);const distance=8.6,cp=Math.cos(pitch);camera.position.set(player.position.x+Math.sin(yaw)*cp*distance,1.5+player.position.y+Math.sin(pitch)*distance,player.position.z+Math.cos(yaw)*cp*distance);lookTarget.set(player.position.x,1.35,player.position.z);camera.lookAt(lookTarget);updateGhost();ui('coords').textContent=`${Math.round(player.position.x)}, ${Math.round(player.position.z)}`;renderer.render(scene,camera)}
ui('loadingCover').classList.add('done');animate();



