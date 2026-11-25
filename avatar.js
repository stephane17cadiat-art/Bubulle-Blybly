import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
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
let scene, camera, renderer, avatarRoot, leftArm, rightArm, clock, dragging = false, lastX = 0, lastY = 0, danceUntil = 0;

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
  const skin=material(state.skinColor), hair=material(state.hairColor), dress=material(state.outfitColor), dark=material("#39243b");
  const gold=material("#f6d995",.35,{metalness:.45});
  const eye=material("#34243b",.35), white=material("#fff8f2");
  // Jambes, chaussures et tenue
  cylinderBetween(avatarRoot,skin,[-.13,.38,0],[-.15,.83,0],.085,.105);
  cylinderBetween(avatarRoot,skin,[.13,.38,0],[.15,.83,0],.085,.105);
  sphere(avatarRoot,dark,[-.17,.28,.08],[.16,.09,.23]);
  sphere(avatarRoot,dark,[.17,.28,.08],[.16,.09,.23]);
  sphere(avatarRoot,dress,[0,1.15,0],[.42,.43,.27]);
  if(state.outfit==="princess" || state.outfit==="boho") {
    addMesh(avatarRoot,new THREE.ConeGeometry(.57,.72,32),dress,[0,.83,0],null,[0,0,0]);
    sphere(avatarRoot,material("#ffffff",.6,{transparent:true,opacity:.75}),[0,1.38,.02],[.43,.12,.27]);
  } else if(state.outfit==="forest") {
    addMesh(avatarRoot,new THREE.ConeGeometry(.48,.55,24),dress,[0,.84,0]);
    sphere(avatarRoot,material("#e7c58b"),[0,1.3,.03],[.18,.09,.27]);
  } else {
    addMesh(avatarRoot,new THREE.CylinderGeometry(.31,.4,.65,24),dress,[0,.9,0]);
    sphere(avatarRoot,material("#f4d5b5"),[0,1.38,.02],[.38,.1,.25]);
  }
  // Bras articulés
  leftArm=new THREE.Group(); leftArm.position.set(-.34,1.43,0); avatarRoot.add(leftArm);
  cylinderBetween(leftArm,skin,[0,0,0],[-.1,-.38,.02],.09,.075);
  sphere(leftArm,skin,[-.1,-.4,.02],[.085,.09,.085]);
  rightArm=new THREE.Group(); rightArm.position.set(.34,1.43,0); avatarRoot.add(rightArm);
  cylinderBetween(rightArm,skin,[0,0,0],[.1,-.38,.02],.09,.075);
  sphere(rightArm,skin,[.1,-.4,.02],[.085,.09,.085]);
  // Cou et visage
  cylinderBetween(avatarRoot,skin,[0,1.62,0],[0,1.82,0],.105,.105);
  sphere(avatarRoot,skin,[0,2.12,.02],[.39,.43,.34]);
  sphere(avatarRoot,white,[-.14,2.16,.316],[.075,.095,.035]);
  sphere(avatarRoot,white,[.14,2.16,.316],[.075,.095,.035]);
  sphere(avatarRoot,eye,[-.13,2.15,.347],[.037,.052,.02]);
  sphere(avatarRoot,eye,[.13,2.15,.347],[.037,.052,.02]);
  sphere(avatarRoot,material("#e99cae"),[-.25,2.02,.29],[.07,.035,.025]);
  sphere(avatarRoot,material("#e99cae"),[.25,2.02,.29],[.07,.035,.025]);
  // Chevelure, avec silhouettes différentes
  sphere(avatarRoot,hair,[0,2.43,0],[.43,.25,.38]);
  if(state.hairStyle==="long") {
    sphere(avatarRoot,hair,[-.34,1.96,-.01],[.14,.56,.19]);
    sphere(avatarRoot,hair,[.34,1.96,-.01],[.14,.56,.19]);
    for(let i=0;i<3;i++){
      sphere(avatarRoot,hair,[-.37+i*.07,1.62+i*.08,-.015],[.11,.18,.13]);
      sphere(avatarRoot,hair,[.37-i*.07,1.62+i*.08,-.015],[.11,.18,.13]);
    }
  } else if(state.hairStyle==="braid") {
    sphere(avatarRoot,hair,[-.34,2.0,.04],[.13,.38,.17]);
    sphere(avatarRoot,hair,[.34,2.0,.04],[.13,.38,.17]);
    for(let i=0;i<5;i++) sphere(avatarRoot,hair,[.37,1.82-i*.13,.11],[.105,.13,.11]);
    for(let i=0;i<3;i++) sphere(avatarRoot,material("#e6a7c9"),[-.22+i*.12,2.48,.28],[.045,.07,.04]);
  } else if(state.hairStyle==="bun") {
    sphere(avatarRoot,hair,[-.28,2.47,-.02],[.2,.2,.2]);
    sphere(avatarRoot,hair,[.28,2.47,-.02],[.2,.2,.2]);
    sphere(avatarRoot,hair,[-.35,2.05,0],[.13,.28,.16]);
    sphere(avatarRoot,hair,[.35,2.05,0],[.13,.28,.16]);
  } else {
    sphere(avatarRoot,hair,[-.34,2.14,.02],[.13,.28,.16]);
    sphere(avatarRoot,hair,[.34,2.14,.02],[.13,.28,.16]);
    sphere(avatarRoot,hair,[0,2.48,.02],[.4,.13,.34]);
  }
  // Petit diadème
  addMesh(avatarRoot,new THREE.TorusGeometry(.25,.025,8,28),gold,[0,2.48,.12],[1,1,.6]);
  sphere(avatarRoot,material("#f4a9d0"),[0,2.62,.28],[.07,.09,.05]);
  // Ailes féeriques
  if(state.wings!=="none") {
    const wingMat=material(state.wings==="crystal"?"#b9d9ff":state.wings==="butterfly"?"#e9a6d1":"#b9f0e1",.25,{transparent:true,opacity:.72,metalness:.12});
    for(const side of [-1,1]){
      sphere(avatarRoot,wingMat,[side*.43,1.82,-.17],[state.wings==="butterfly"?.34:.27,.48,.07]);
      sphere(avatarRoot,wingMat,[side*.52,2.08,-.18],[.22,.3,.06]);
      if(state.wings==="crystal") cylinderBetween(avatarRoot,gold,[side*.42,1.48,-.1],[side*.52,2.4,-.1],.012,.012);
    }
  }
  // Compagnon miniature à côté de l'aventurière
  if(state.companion!=="none") {
    const colors={rabbit:"#eee5df",cat:"#8e879d",fox:"#d98443",fawn:"#c99b70",dragon:"#79b99c",unicorn:"#eee0f5"};
    const pet=material(colors[state.companion]||"#eee5df");
    const x=.82;
    sphere(avatarRoot,pet,[x,.56,.12],[.24,.28,.2]);
    sphere(avatarRoot,pet,[x,.87,.13],[.22,.21,.2]);
    sphere(avatarRoot,eye,[x-.08,.9,.31],[.025,.035,.02]);
    sphere(avatarRoot,eye,[x+.08,.9,.31],[.025,.035,.02]);
    if(state.companion==="rabbit"){
      sphere(avatarRoot,pet,[x-.1,1.15,.1],[.07,.23,.07]);
      sphere(avatarRoot,pet,[x+.1,1.15,.1],[.07,.23,.07]);
    } else if(state.companion==="cat" || state.companion==="fox"){
      for(const side of [-1,1]) addMesh(avatarRoot,new THREE.ConeGeometry(.09,.22,12),pet,[x+side*.13,1.08,.12]);
    } else if(state.companion==="unicorn"){
      addMesh(avatarRoot,new THREE.ConeGeometry(.055,.25,12),gold,[x,1.14,.14]);
    } else if(state.companion==="dragon"){
      sphere(avatarRoot,material("#e7a3bb"),[x,.82,-.05],[.3,.1,.07]);
    }
  }
  // Socle magique
  const ring=material("#e5c47b",.3,{metalness:.35});
  addMesh(avatarRoot,new THREE.TorusGeometry(.65,.018,8,48),ring,[0,.12,0],[1,.48,1]);
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
  clock=new THREE.Clock();buildAvatar();resize();
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
  const t=clock.getElapsedTime();
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
$("poseBtn").addEventListener("click",()=>{danceUntil=Date.now()+2600;});
$("resetViewBtn").addEventListener("click",()=>{if(avatarRoot)avatarRoot.rotation.y=0;if(camera){camera.position.set(0,1.55,7.2);camera.lookAt(0,1.45,0);}});
start();
