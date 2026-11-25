import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBAqdZJGPVCdkNfouhC9lYH51yuYfaw3E",
  authDomain: "bubulle-blybly.firebaseapp.com",
  projectId: "bubulle-blybly",
  storageBucket: "bubulle-blybly.firebasestorage.app",
  messagingSenderId: "61199635297",
  appId: "1:61199635297:web:9c440eaa89b6a94d846b20"
};
const params = new URLSearchParams(location.search);
const roomId = params.get("room");
const $ = id => document.getElementById(id);
const status = message => $("saveStatus").textContent = message;
const defaults = {
  hairStyle:"long",hairColor:"#5b352d",skinColor:"#f3c6a5",
  outfit:"princess",outfitColor:"#d98ab9",wings:"fairy",companion:"none",theme:"forest"
};
let state = {...defaults}, role = null, roomRef = null, saveTimer = null, saving = false;
let scene, camera, renderer, avatarRoot, realisticRoot = null, realisticMixer = null, realisticAction = null, realisticReady = false, realisticVisible = false, leftArm, rightArm, clock, dragging = false, lastX = 0, lastY = 0, danceUntil = 0;

function material(color, roughness=.72, extra={}) {
  return new THREE.MeshStandardMaterial({color,roughness,...extra});
}
function addMesh(parent, geometry, mat, position, scale, rotation) {
  const mesh = new THREE.Mesh(geometry,mat);
  if(position) mesh.position.set(...position);
  if(scale) mesh.scale.set(...scale);
  if(rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}
function sphere(parent, mat, pos, scale) {
  return addMesh(parent,new THREE.SphereGeometry(1,24,18),mat,pos,scale);
}
function cylinderBetween(parent, mat, start, end, radiusTop, radiusBottom) {
  const a=new THREE.Vector3(...start), b=new THREE.Vector3(...end), direction=new THREE.Vector3().subVectors(b,a);
  const mesh=addMesh(parent,new THREE.CylinderGeometry(radiusTop,radiusBottom,direction.length(),16),mat);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  return mesh;
}
function buildAvatar() {
  if(avatarRoot) scene.remove(avatarRoot);
  avatarRoot = new THREE.Group(); scene.add(avatarRoot);
  const skin=material(state.skinColor,.58), hair=material(state.hairColor,.34,{metalness:.04}), dress=material(state.outfitColor,.48), dark=material("#342536");
  const gold=material("#e8c77f",.28,{metalness:.55}), eye=material("#49302d",.22), white=material("#fffaf5",.25);
  const lip=material("#b96e78",.48), blush=material("#d88c91",.72);
  const smooth=(g)=>{g.computeVertexNormals();return g;};
  const curveTube=(points,mat,r=.025)=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return addMesh(avatarRoot,new THREE.TubeGeometry(curve,32,r,8,false),mat);
  };
  // Silhouette plus élancée et proportions proches d'un personnage de jeu vidéo
  cylinderBetween(avatarRoot,skin,[-.105,.25,.015],[-.13,.91,.015],.075,.095);
  cylinderBetween(avatarRoot,skin,[.105,.25,.015],[.13,.91,.015],.075,.095);
  sphere(avatarRoot,dark,[-.14,.17,.11],[.13,.065,.24]);
  sphere(avatarRoot,dark,[.14,.17,.11],[.13,.065,.24]);
  // Robe longue avec volume, taille marquée et plis sculptés
  const profile=[
    new THREE.Vector2(.13,0),new THREE.Vector2(.17,.18),new THREE.Vector2(.16,.42),
    new THREE.Vector2(.22,.62),new THREE.Vector2(.31,.83),new THREE.Vector2(.43,1.08),
    new THREE.Vector2(.53,1.27),new THREE.Vector2(.48,1.34)
  ];
  const gown=addMesh(avatarRoot,smooth(new THREE.LatheGeometry(profile,64)),dress,[0,.43,0]);
  gown.scale.z=.78;
  // Chaque univers possède maintenant sa propre silhouette et ses accessoires.
  const accent=material(state.outfit==="forest"?"#8dbb83":state.outfit==="boho"?"#e8c69b":state.outfit==="magic"?"#b7a4ed":state.outfit==="modern"?"#6f7892":"#f4d7e8",.42,{metalness:.12});
  if(state.outfit==="forest"){
    // Cape courte et feuilles brodées
    const cape=addMesh(avatarRoot,new THREE.SphereGeometry(1,32,24),material("#477b62",.7),[0,1.36,-.17],[.31,.43,.10],[.12,0,0]);
    for(let i=0;i<5;i++){
      const x=(i-2)*.105;
      const leaf=addMesh(avatarRoot,new THREE.SphereGeometry(1,16,12),accent,[x,1.08+Math.abs(i-2)*.055,.25],[.045,.12,.018],[0,0,(i-2)*.22]);
    }
  }else if(state.outfit==="boho"){
    // Étole souple et petits motifs floraux
    curveTube([[-.25,1.66,.08],[-.12,1.78,.18],[0,1.7,.2],[.14,1.78,.16],[.25,1.66,.08]],accent,.035);
    for(let i=0;i<7;i++){
      const a=i*Math.PI*2/7;
      sphere(avatarRoot,accent,[Math.cos(a)*.34,.92+Math.sin(a)*.12,.23],[.035,.045,.018]);
    }
  }else if(state.outfit==="magic"){
    // Col haut, cape d'enchanteresse et gemme centrale
    cylinderBetween(avatarRoot,accent,[-.18,1.72,-.02],[.18,1.72,-.02],.035,.035);
    const cape=addMesh(avatarRoot,new THREE.SphereGeometry(1,32,24),material("#51447e",.55),[0,1.35,-.2],[.34,.5,.08]);
    sphere(avatarRoot,material("#e9d5ff",.2,{emissive:"#8c69c9",emissiveIntensity:.35}),[0,1.58,.205],[.055,.075,.025]);
  }else if(state.outfit==="modern"){
    // Ceinture, petite veste et bottines visibles sous la jupe
    cylinderBetween(avatarRoot,accent,[-.19,1.28,.02],[.19,1.28,.02],.035,.035);
    for(const x of [-.14,.14]){
      sphere(avatarRoot,material("#514d62"),[x,.22,.10],[.105,.13,.13]);
    }
    sphere(avatarRoot,accent,[0,1.31,.205],[.045,.035,.018]);
  }else{
    // Corsage princesse avec épaules délicates
    for(const x of [-.22,.22]) sphere(avatarRoot,accent,[x,1.66,0],[.09,.07,.11]);
  }
  const bodice=sphere(avatarRoot,dress,[0,1.48,0],[.245,.36,.19]);
  sphere(avatarRoot,skin,[0,1.78,0],[.095,.13,.09]);
  // Fine bordure et plis lumineux sur la jupe
  const trim=material("#f3dcae",.38,{metalness:.18});
  const hem=addMesh(avatarRoot,new THREE.TorusGeometry(.49,.018,8,64),trim,[0,.47,0]);hem.scale.z=.78;
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    curveTube([[Math.sin(a)*.19,.58,Math.cos(a)*.15],[Math.sin(a)*.28,.82,Math.cos(a)*.22],[Math.sin(a)*.39,1.12,Math.cos(a)*.29],[Math.sin(a)*.47,1.48,Math.cos(a)*.35]],material(state.outfitColor,.58));
  }
  // Bras fins, épaules et mains
  leftArm=new THREE.Group();leftArm.position.set(-.25,1.62,0);avatarRoot.add(leftArm);
  sphere(leftArm,skin,[0,-.05,0],[.105,.13,.11]);
  cylinderBetween(leftArm,skin,[0,-.08,0],[-.12,-.43,.02],.075,.06);
  cylinderBetween(leftArm,skin,[-.12,-.43,.02],[-.16,-.69,.07],.06,.045);
  sphere(leftArm,skin,[-.16,-.72,.08],[.055,.09,.045]);
  rightArm=new THREE.Group();rightArm.position.set(.25,1.62,0);avatarRoot.add(rightArm);
  sphere(rightArm,skin,[0,-.05,0],[.105,.13,.11]);
  cylinderBetween(rightArm,skin,[0,-.08,0],[.12,-.43,.02],.075,.06);
  cylinderBetween(rightArm,skin,[.12,-.43,.02],[.16,-.69,.07],.06,.045);
  sphere(rightArm,skin,[.16,-.72,.08],[.055,.09,.045]);
  // Visage plus fin : yeux détaillés, nez, bouche, sourcils et oreilles
  // Visage sculpté : mâchoire plus fine et pommettes douces
  const faceGeometry = new THREE.SphereGeometry(1,48,40);
  const facePositions = faceGeometry.attributes.position;
  for(let i=0;i<facePositions.count;i++){
    const y=facePositions.getY(i);
    const taper=0.82+0.18*THREE.MathUtils.smoothstep(y,-.75,.35);
    facePositions.setX(i,facePositions.getX(i)*taper);
  }
  faceGeometry.computeVertexNormals();
  addMesh(avatarRoot,faceGeometry,skin,[0,2.12,.015],[.285,.355,.255]);

  sphere(avatarRoot,skin,[-.285,2.1,0],[.055,.09,.065]);
  sphere(avatarRoot,skin,[.285,2.1,0],[.055,.09,.065]);
  sphere(avatarRoot,white,[-.105,2.15,.245],[.071,.073,.029]);
  sphere(avatarRoot,white,[.105,2.15,.245],[.071,.073,.029]);
  // Cils et paupières pour un regard plus fin
  curveTube([[-.18,2.18,.256],[-.12,2.225,.27],[-.055,2.18,.256]],dark,.009);
  curveTube([[.055,2.18,.256],[.12,2.225,.27],[.18,2.18,.256]],dark,.009);
  for(const side of [-1,1]){
    curveTube([[side*.16,2.18,.26],[side*.20,2.205,.25]],dark,.006);
    curveTube([[side*.14,2.18,.265],[side*.18,2.21,.255]],dark,.006);
  }
  sphere(avatarRoot,material("#7a594b",.22),[-.105,2.15,.269],[.036,.052,.018]);
  sphere(avatarRoot,material("#7a594b",.22),[.105,2.15,.269],[.036,.052,.018]);
  sphere(avatarRoot,material("#17131a",.18),[-.105,2.15,.284],[.018,.033,.01]);
  sphere(avatarRoot,material("#17131a",.18),[.105,2.15,.284],[.018,.033,.01]);
  sphere(avatarRoot,white,[-.116,2.17,.296],[.012,.014,.008]);
  sphere(avatarRoot,white,[.094,2.17,.296],[.012,.014,.008]);
  curveTube([[-.17,2.255,.245],[-.11,2.275,.26],[-.055,2.255,.245]],hair,.012);
  curveTube([[.055,2.255,.245],[.11,2.275,.26],[.17,2.255,.245]],hair,.012);
  sphere(avatarRoot,skin,[0,2.08,.272],[.027,.052,.035]);
  sphere(avatarRoot,lip,[0,1.99,.25],[.052,.018,.018]);
  sphere(avatarRoot,blush,[-.19,2.04,.205],[.045,.022,.012]);
  sphere(avatarRoot,blush,[.19,2.04,.205],[.045,.022,.012]);
  // Chevelure volumineuse avec mèches individuelles
  sphere(avatarRoot,hair,[0,2.38,-.005],[.305,.205,.285]);
  // Frange souple et mèches qui encadrent le visage
  for(let i=0;i<7;i++){
    const x=-.19+i*.063;
    const y=2.40-Math.abs(x)*.20;
    curveTube([[x*.72,2.49,.18],[x,2.43,.255],[x*1.08,y,.275]],hair,.027);
  }
  if(state.hairStyle==="bob"){
    // Carré court arrondi, dégagé au niveau des épaules
    sphere(avatarRoot,hair,[0,2.23,-.045],[.31,.27,.29]);
    for(const side of [-1,1]){
      curveTube([[side*.23,2.36,.12],[side*.30,2.18,.16],[side*.29,1.98,.12],[side*.22,1.91,.08]],hair,.055);
    }
  }
  const hairStrands=state.hairStyle==="braid"?12:state.hairStyle==="bun"?8:state.hairStyle==="bob"?0:18;
  for(let i=0;i<hairStrands;i++){
    const a=(i/hairStrands)*Math.PI*2;
    const x=Math.cos(a),z=Math.sin(a);
    if(state.hairStyle==="bun"){
      const side=i%2===0?-.22:.22;
      sphere(avatarRoot,hair,[side,2.48,-.025],[.13,.14,.13]);
      curveTube([[side*.7,2.48,.12],[side,2.35,.14],[side*1.35,2.2,.08]],hair,.035);
    }else{
      const side=Math.cos(a);
      const front=Math.sin(a);
      curveTube([[x*.22,2.48,z*.20],[x*.29,2.35,z*.24],[x*.32,2.12,z*.24],[x*.34,1.8,z*.18],[x*.3,1.58,z*.12]],hair,state.hairStyle==="braid"?.035:.045);
    }
  }
  if(state.hairStyle==="braid"){
    for(let i=0;i<7;i++) sphere(avatarRoot,hair,[.34,2.02-i*.09,.12],[.065,.09,.07]);
  }
  // Diadème délicat
  curveTube([[-.23,2.43,.13],[0,2.51,.22],[.23,2.43,.13]],gold,.018);
  sphere(avatarRoot,material("#e6a2c5",.25),[0,2.52,.22],[.035,.05,.025]);
  // Corsage et détails précieux
  sphere(avatarRoot,trim,[0,1.52,.17],[.035,.16,.018]);
  for(const x of [-.16,.16]) sphere(avatarRoot,gold,[x,1.54,.16],[.025,.025,.018]);
  // Ailes translucides aux formes plus fines
  if(state.wings!=="none"){
    const wingMat=material(state.wings==="crystal"?"#c7e5ff":state.wings==="butterfly"?"#e9a6d1":"#c6f1df",.22,{transparent:true,opacity:.62,metalness:.12,side:THREE.DoubleSide});
    for(const side of [-1,1]){
      const upper=addMesh(avatarRoot,new THREE.SphereGeometry(1,32,24),wingMat,[side*.39,1.92,-.16],[.22,.43,.045],[0,0,side*-.35]);
      const lower=addMesh(avatarRoot,new THREE.SphereGeometry(1,32,24),wingMat,[side*.47,1.62,-.17],[.16,.29,.04],[0,0,side*.25]);
      curveTube([[side*.28,1.5,-.1],[side*.48,1.85,-.1],[side*.46,2.25,-.1]],gold,.009);
    }
  }
  // Compagnon miniature assorti
  if(state.companion!=="none"){
    const colors={rabbit:"#eee5df",cat:"#8e879d",fox:"#d98443",fawn:"#c99b70",dragon:"#79b99c",unicorn:"#eee0f5"};
    const pet=material(colors[state.companion]||"#eee5df",.55),x=.78;
    sphere(avatarRoot,pet,[x,.55,.1],[.17,.23,.16]);
    sphere(avatarRoot,pet,[x,.82,.12],[.16,.16,.15]);
    sphere(avatarRoot,eye,[x-.055,.84,.25],[.018,.025,.012]);
    sphere(avatarRoot,eye,[x+.055,.84,.25],[.018,.025,.012]);
    if(state.companion==="rabbit"){
      sphere(avatarRoot,pet,[x-.07,1.08,.1],[.045,.19,.045]);
      sphere(avatarRoot,pet,[x+.07,1.08,.1],[.045,.19,.045]);
    }else if(state.companion==="cat"||state.companion==="fox"){
      for(const side of [-1,1])addMesh(avatarRoot,new THREE.ConeGeometry(.065,.15,16),pet,[x+side*.1,.98,.12]);
    }else if(state.companion==="unicorn")addMesh(avatarRoot,new THREE.ConeGeometry(.035,.18,16),gold,[x,1.02,.13]);
    else if(state.companion==="fawn"){
      for(const side of [-1,1]){
        cylinderBetween(avatarRoot,pet,[x+side*.07,.93,.1],[x+side*.14,1.12,.08],.018,.012);
        sphere(avatarRoot,material("#f5e1bd"),[x+side*.14,1.13,.08],[.035,.045,.03]);
      }
      sphere(avatarRoot,material("#f2d5b5"),[x,.78,.25],[.035,.045,.018]);
    }else if(state.companion==="dragon"){
      for(const side of [-1,1]) addMesh(avatarRoot,new THREE.ConeGeometry(.07,.18,12),material("#5f9e85"),[x+side*.11,1.0,-.02],[1,1,1],[0,0,side*.55]);
      sphere(avatarRoot,material("#e6c47c"),[x,.58,.25],[.035,.025,.018]);
    }
  }
  const ring=material("#e5c47b",.28,{metalness:.45});
  addMesh(avatarRoot,new THREE.TorusGeometry(.59,.014,8,64),ring,[0,.12,0],[1,.45,1]);
}
async function loadRealisticCharacter(){
  if(realisticReady || !scene) return;
  status("✨ Chargement du modèle 3D détaillé…");
  const loader=new GLTFLoader();
  try{
    const gltf=await loader.loadAsync("https://grab3d.com/models/characters/elf/elf-rigged.glb");
    realisticRoot=gltf.scene;
    const bounds=new THREE.Box3().setFromObject(realisticRoot);
    const size=bounds.getSize(new THREE.Vector3());
    const center=bounds.getCenter(new THREE.Vector3());
    const targetHeight=2.48;
    realisticRoot.scale.setScalar(targetHeight/size.y);
    realisticRoot.position.set(-center.x*realisticRoot.scale.x,-bounds.min.y*realisticRoot.scale.y,-center.z*realisticRoot.scale.z);
    realisticRoot.visible=false;
    realisticRoot.traverse(obj=>{
      if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        mats.forEach(m=>{if(m && m.name && /tunic|cloth|fabric|shirt|linen/i.test(m.name)){m.color?.set(state.outfitColor);m.needsUpdate=true;}});
      }
    });
    scene.add(realisticRoot);
    if(gltf.animations?.length){realisticMixer=new THREE.AnimationMixer(realisticRoot);realisticAction=realisticMixer.clipAction(gltf.animations[0]);}
    realisticReady=true;
    status("✓ Modèle 3D détaillé chargé — tu peux l’essayer dans le miroir.");
    $("realisticBtn").disabled=false;
  }catch(error){
    console.warn("Le modèle 3D détaillé n’a pas pu être chargé :",error);
    status("Le modèle détaillé n’est pas disponible ici ; le miroir classique reste utilisable.");
    $("realisticBtn").disabled=true;
  }
}
function toggleRealisticCharacter(){
  if(!realisticReady)return;
  realisticVisible=!realisticVisible;
  if(avatarRoot)avatarRoot.visible=!realisticVisible;
  realisticRoot.visible=realisticVisible;
  $("realisticBtn").textContent=realisticVisible?"🌸 Revenir à mon avatar":"✨ Essayer le modèle réaliste";
  if(realisticVisible && realisticAction)realisticAction.reset().fadeIn(.25).play();
  else if(realisticAction)realisticAction.fadeOut(.2);
}
function initScene(){
  const host=$("avatarView");
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,1.55,7.2);camera.lookAt(0,1.45,0);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.innerHTML="";host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffeaff,0x34445a,2.1));
  const key=new THREE.DirectionalLight(0xffe4f3,2.4);key.position.set(-3,5,5);key.castShadow=true;scene.add(key);
  const fill=new THREE.PointLight(0x9edfd0,35,9);fill.position.set(3,2,2);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1.8,48),material("#b6a0ca",.9,{transparent:true,opacity:.15}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.08;scene.add(floor);
  clock=new THREE.Clock();buildAvatar();resize();loadRealisticCharacter();
  const observer=new ResizeObserver(resize);observer.observe(host);
  renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
  renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;avatarRoot.rotation.y+=(e.clientX-lastX)*.012;lastX=e.clientX;lastY=e.clientY});
  renderer.domElement.addEventListener("pointerup",()=>dragging=false);
  renderer.domElement.addEventListener("pointercancel",()=>dragging=false);
  renderer.domElement.addEventListener("wheel",e=>{e.preventDefault();camera.position.z=THREE.MathUtils.clamp(camera.position.z+e.deltaY*.008,4.8,9.5)},{passive:false});
  animate();
}
function resize(){
  if(!renderer)return;const host=$("avatarView");const w=host.clientWidth,h=host.clientHeight||450;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function animate(){
  requestAnimationFrame(animate);if(!renderer)return;
  const delta=clock.getDelta();const t=clock.elapsedTime; if(realisticMixer)realisticMixer.update(delta);
  if(avatarRoot){
    avatarRoot.position.y=Math.sin(t*1.5)*.035;
    if(Date.now()<danceUntil){avatarRoot.rotation.y+=.035;avatarRoot.position.y+=Math.abs(Math.sin(t*9))*.1;leftArm.rotation.z=Math.sin(t*12)*.45-.35;rightArm.rotation.z=-Math.sin(t*12)*.45+.35;}
    else {leftArm.rotation.z=THREE.MathUtils.lerp(leftArm.rotation.z,0,.08);rightArm.rotation.z=THREE.MathUtils.lerp(rightArm.rotation.z,0,.08);}
  }
  renderer.render(scene,camera);
}
function readControls(){
  for(const key of Object.keys(defaults)) state[key]=$(key).value;
}
function fillControls(){
  for(const key of Object.keys(defaults)) $(key).value=state[key]||defaults[key];
  document.body.className="theme-"+state.theme;
}
function changed(){
  readControls();document.body.className="theme-"+state.theme;buildAvatar();scheduleSave();
}
function scheduleSave(){
  status("☁️ Sauvegarde de tes choix…");clearTimeout(saveTimer);
  saveTimer=setTimeout(saveAvatar,650);
}
async function saveAvatar(){
  if(!roomRef||!role)return;
  if(saving){saveTimer=setTimeout(saveAvatar,500);return;}
  saving=true;
  try{
    await updateDoc(roomRef,{[`players.${role}.avatar`]:{...state,updatedAt:new Date().toISOString()}});
    status("✓ Ton personnage est sauvegardé !");
  }catch(error){console.error(error);status("⚠️ Sauvegarde impossible pour le moment.");}
  finally{saving=false;}
}
async function start(){
  if(!roomId){status("⚠️ Reviens dans ta partie pour ouvrir ton atelier.");return;}
  try{
    const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
    const credential=await signInAnonymously(auth);
    roomRef=doc(db,"rooms",roomId);
    const snapshot=await getDoc(roomRef);
    if(!snapshot.exists())throw new Error("Partie introuvable.");
    const players=snapshot.data().players;
    role=players.BUBULLE?.uid===credential.user.uid?"BUBULLE":players.BLYBLY?.uid===credential.user.uid?"BLYBLY":null;
    if(!role)throw new Error("Ce navigateur n'est pas associé à une joueuse de cette partie. Ouvre l'atelier depuis le jeu.");
    const saved=players[role].avatar;
    if(saved)state={...defaults,...saved};
    $("playerName").textContent=role==="BUBULLE"?"Atelier de Bubulle 🌸":"Atelier de Blybly 🌷";
    $("backLink").href="./?room="+encodeURIComponent(roomId);
    fillControls();initScene();status("✓ Atelier prêt — tes choix seront sauvegardés automatiquement.");
  }catch(error){
    console.error(error);status("⚠️ "+(error.message||"Connexion impossible."));
    $("avatarView").innerHTML='<div class="loading">🌙 Ouvre cet atelier depuis ta partie pour retrouver ton personnage.</div>';
  }
}
for(const key of Object.keys(defaults)) $(key).addEventListener("change",changed);
$("saveBtn").addEventListener("click",saveAvatar);
$("poseBtn").addEventListener("click",()=>{danceUntil=Date.now()+2600;if(realisticVisible&&realisticAction){realisticAction.reset().fadeIn(.2).play();}});
$("realisticBtn").addEventListener("click",toggleRealisticCharacter);
$("resetViewBtn").addEventListener("click",()=>{if(avatarRoot)avatarRoot.rotation.y=0;if(camera){camera.position.set(0,1.55,7.2);camera.lookAt(0,1.45,0);}});
start();
