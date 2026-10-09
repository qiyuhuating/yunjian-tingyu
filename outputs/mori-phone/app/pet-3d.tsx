'use client';
import {useEffect,useRef,useState} from 'react';
import type * as Three from 'three';

export type PetMood='happy'|'angry'|'sad'|'afraid'|'dreamy'|'sleepy';
/** A continuous sculpted cloud with physically shaded details. One canvas is shared
 * by the character's face and body; animation pauses when hidden or inactive. */
export default function Pet3D({mood='happy',active=true}:{mood?:PetMood;active?:boolean}){
 const host=useRef<HTMLSpanElement>(null),current=useRef(mood),enabled=useRef(active),refresh=useRef<(()=>void)|null>(null),[fallback,setFallback]=useState(false);
 current.current=mood;enabled.current=active;
 useEffect(()=>{refresh.current?.();},[mood]);
 useEffect(()=>{
  if(!active)return;
  let cancelled=false,dispose=()=>{};
  void Promise.all([import('three'),import('three/addons/objects/MarchingCubes.js')]).then(([T,{MarchingCubes}])=>{
   if(cancelled||!host.current)return;
   const node=host.current;
   let renderer:Three.WebGLRenderer;
   try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:true});}
   catch{setFallback(true);return;}
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
   renderer.outputColorSpace=T.SRGBColorSpace;
   renderer.toneMapping=T.ACESFilmicToneMapping;
   renderer.toneMappingExposure=1.05;
   renderer.setClearColor(0xffffff,0);
   node.appendChild(renderer.domElement);
   const scene=new T.Scene(),camera=new T.OrthographicCamera(-1.95,1.95,1.95,-1.95,.1,30);
   camera.position.set(0,.3,8);camera.lookAt(0,.08,0);
   scene.add(new T.HemisphereLight(0xeaf5ff,0x98aeca,1.75));
   const key=new T.DirectionalLight(0xfff4dc,2.6);key.position.set(-3,5,6);scene.add(key);
   const fill=new T.DirectionalLight(0xc1dcff,1.25);fill.position.set(4,1,3);scene.add(fill);
   const rim=new T.DirectionalLight(0x9cc3ff,2.7);rim.position.set(2,3,-4);scene.add(rim);
   const bodyMat=new T.MeshPhysicalMaterial({color:0xfffcf6,roughness:.42,metalness:0,clearcoat:.28,clearcoatRoughness:.45});
   const eyeMat=new T.MeshPhysicalMaterial({color:0x302b37,roughness:.12,clearcoat:1,clearcoatRoughness:.05});
   const blushMat=new T.MeshStandardMaterial({color:0xf49cae,roughness:.8,transparent:true,opacity:.46,depthWrite:false});
   const blueMat=new T.MeshPhysicalMaterial({color:0xb5dafa,roughness:.34,clearcoat:.4});
   const peachMat=new T.MeshPhysicalMaterial({color:0xffe5d3,roughness:.38});
   const whiteMat=new T.MeshBasicMaterial({color:0xffffff});
   const goldMat=new T.MeshPhysicalMaterial({color:0xf7c966,roughness:.22,metalness:.28,clearcoat:.8});
   const ink=new T.MeshStandardMaterial({color:0x745765,roughness:.5});
   const materials=[bodyMat,eyeMat,blushMat,blueMat,peachMat,whiteMat,goldMat,ink];
   const cloud=new T.Group();scene.add(cloud);
   // Metaball SDF-style surface: lobes fuse into a seamless, soft, single sculpt.
   // Lower resolution for tiny home/dock thumbnails, higher for the pet room.
   const bounds=node.getBoundingClientRect(),small=bounds.width<120;
   const sculpture=new MarchingCubes(small?29:48,bodyMat,false,false,35000);
   sculpture.isolation=80;
   const lobes:[[number,number,number,number],...[number,number,number,number][]]=[
    [.50,.46,.5,.93],[.30,.43,.5,.77],[.71,.43,.5,.77],
    [.40,.63,.5,.76],[.61,.61,.5,.71],[.50,.35,.5,.65]
   ];
   const refreshSkin=()=>{sculpture.reset();for(const [x,y,z,power] of lobes)sculpture.addBall(x,y,z,power,12);sculpture.update();};
   refreshSkin();
   sculpture.scale.set(2.5,2.05,1.53);sculpture.position.set(-1.25,-1.12,-.7);cloud.add(sculpture);
   const sphere=new T.SphereGeometry(1,small?24:40,small?16:28);
   const ellipsoid=(x:number,y:number,z:number,sx:number,sy:number,sz:number,material:Three.Material,parent:Three.Object3D=cloud)=>{
    const object=new T.Mesh(sphere,material);object.position.set(x,y,z);object.scale.set(sx,sy,sz);parent.add(object);return object;
   };
   // Tiny plush limbs. Creamy feet sit behind the face and give depth in profile.
   const footL=ellipsoid(-.55,-.75,.17,.28,.16,.26,blueMat),footR=ellipsoid(.55,-.75,.17,.28,.16,.26,blueMat);
   const handL=ellipsoid(-1.0,-.3,.23,.23,.20,.23,bodyMat),handR=ellipsoid(1.0,-.3,.23,.23,.20,.23,bodyMat);
   ellipsoid(-.57,-.79,.39,.10,.045,.045,peachMat);
   ellipsoid(.54,-.79,.39,.10,.045,.045,peachMat);
   // Eyes use curved corneas, raised catchlights and a softer, close-fitting smile.
   const face=new T.Group();face.position.set(0,-.02,.77);cloud.add(face);
   const eyeL=ellipsoid(-.37,.16,0,.082,.115,.05,eyeMat,face),eyeR=ellipsoid(.37,.16,0,.082,.115,.05,eyeMat,face);
   for(const x of [-.39,.35]){
    ellipsoid(x,.20,.051,.026,.036,.012,whiteMat,face);
    ellipsoid(x+.037,.12,.049,.009,.012,.008,whiteMat,face);
   }
   ellipsoid(-.65,-.12,-.03,.20,.088,.012,blushMat,face);
   ellipsoid(.65,-.12,-.03,.20,.088,.012,blushMat,face);
   const smileCurve=new T.CatmullRomCurve3([new T.Vector3(-.16,-.07,.04),new T.Vector3(-.10,-.16,.075),new T.Vector3(0,-.19,.09),new T.Vector3(.10,-.16,.075),new T.Vector3(.16,-.07,.04)]);
   const mouth=new T.Mesh(new T.TubeGeometry(smileCurve,28,.017,7,false),ink);face.add(mouth);
   const browL=ellipsoid(-.36,.35,.02,.14,.022,.023,ink,face),browR=ellipsoid(.36,.35,.02,.14,.022,.023,ink,face);
   browL.visible=browR.visible=false;
   // Pastel raindrop and gold star are solid geometry, not flat stickers.
   const tear=ellipsoid(-.5,-.13,.8,.043,.085,.027,blueMat);tear.visible=false;
   const stars=new T.Group();stars.position.set(.38,.82,.15);cloud.add(stars);
   const starShape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.09:.2,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)starShape.lineTo(x,y);else starShape.moveTo(x,y);}starShape.closePath();
   const starGeo=new T.ExtrudeGeometry(starShape,{depth:.045,bevelEnabled:true,bevelThickness:.02,bevelSize:.025,bevelSegments:3,steps:1,curveSegments:6});
   const star=new T.Mesh(starGeo,goldMat);stars.add(star);stars.rotation.z=.15;
   const littleStar=star.clone();littleStar.scale.setScalar(.43);littleStar.position.set(.26,.22,-.04);stars.add(littleStar);
   // Grounding without an opaque background; keeps the small character legible.
   const shadow=new T.Mesh(new T.CircleGeometry(1.13,64),new T.MeshBasicMaterial({color:0x6e99b8,transparent:true,opacity:.12,depthWrite:false}));
   shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-.92,-.3);scene.add(shadow);
   const resize=()=>{const size=node.getBoundingClientRect(),w=Math.max(1,size.width),h=Math.max(1,size.height);renderer.setSize(w,h,false);const aspect=w/h;camera.left=-1.7*aspect;camera.right=1.7*aspect;camera.top=1.7;camera.bottom=-1.7;camera.updateProjectionMatrix();renderer.render(scene,camera);};
   const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(node);resize();
   const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
   let visible=true,frame=0,last=0;
   const tick=(ms:number)=>{
    frame=0;if(!enabled.current||!visible||document.hidden)return;
    if(!motion.matches)frame=requestAnimationFrame(tick);
    if(ms-last<33&&!motion.matches)return;last=ms;
    const t=motion.matches?0:ms/1000,m=current.current,joy=m==='happy';
    cloud.position.y=motion.matches?0:Math.sin(t*(joy?2.1:1.35))*.048;
    cloud.rotation.z=m==='angry'?-.06+Math.sin(t*4)*.025:m==='sad'?-.055:Math.sin(t*.72)*.025;
    cloud.rotation.y=Math.sin(t*.45)*.10;
    stars.rotation.z=.15+Math.sin(t*1.3)*.09;
    handL.rotation.z=Math.sin(t*2)*.11;handR.rotation.z=-Math.sin(t*2+.6)*.14;
    footL.rotation.x=footR.rotation.x=Math.sin(t*1.8)*.07;
    const blink=!motion.matches&&m!=='sleepy'&&((t%4.8)<.13),closed=blink||m==='sleepy'||m==='dreamy';
    eyeL.scale.y=eyeR.scale.y=closed?.025:m==='afraid'?.16:.115;
    browL.visible=browR.visible=m==='angry'||m==='afraid'||m==='sad';
    browL.rotation.z=m==='angry'?.30:-.20;browR.rotation.z=m==='angry'?-.30:.20;
    mouth.scale.y=m==='sad'?-1:m==='angry'?.35:m==='afraid'?1.9:1;
    tear.visible=m==='sad';
    cloud.scale.setScalar(m==='afraid'?.93:1);
    renderer.render(scene,camera);
   };
   const wake=()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=0;if(visible&&!document.hidden)tick(performance.now());};
   const visibility=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;wake();});visibility.observe(node);
   document.addEventListener('visibilitychange',wake);motion.addEventListener('change',wake);
   const lost=(event:Event)=>{event.preventDefault();setFallback(true);if(frame)cancelAnimationFrame(frame);frame=0;};
   renderer.domElement.addEventListener('webglcontextlost',lost,false);
   refresh.current=wake;wake();
   dispose=()=>{refresh.current=null;if(frame)cancelAnimationFrame(frame);resizeObserver.disconnect();visibility.disconnect();document.removeEventListener('visibilitychange',wake);motion.removeEventListener('change',wake);renderer.domElement.removeEventListener('webglcontextlost',lost);sculpture.geometry.dispose();sphere.dispose();mouth.geometry.dispose();starGeo.dispose();shadow.geometry.dispose();for(const m of materials)m.dispose();shadow.material.dispose();renderer.dispose();renderer.domElement.remove();};
  }).catch(()=>setFallback(true));
  return()=>{cancelled=true;dispose();};
 },[active]);
 return <span ref={host} className="pet-model" data-mood={mood} aria-label={`小云，${{happy:'开心',angry:'生气',sad:'难过',afraid:'害怕',dreamy:'沉醉',sleepy:'困倦'}[mood]}`}>{(fallback||!active)&&<img src="/cloud-pet.webp" alt="小云（3D不可用时的插画）"/>}</span>;
}
