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
  hairStyle:"long",hairColor:"#5b352d",hairAccessory:"none",accessoryStyle:"none",skinColor:"#f3c6a5",
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
  // Robe longue : ourlet arrondi et évasé, hanches douces, taille marquée, buste ajusté.
  // LatheGeometry lit le profil du bas vers le haut : l'ourlet doit donc être le plus large.
  const profile=[
    new THREE.Vector2(.39,0),new THREE.Vector2(.395,.07),new THREE.Vector2(.37,.16),
    new THREE.Vector2(.32,.30),new THREE.Vector2(.255,.48),new THREE.Vector2(.205,.66),
    new THREE.Vector2(.165,.82),new THREE.Vector2(.15,.98),new THREE.Vector2(.16,1.12),
    new THREE.Vector2(.19,1.27),new THREE.Vector2(.205,1.34)
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
  // Aucun trait tubulaire sur la jupe : la robe reste lisse et nette.
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
  // Chevelure sculptée : volume doux, mèches séparées et silhouettes propres à chaque coiffure.
  sphere(avatarRoot,hair,[0,2.38,-.005],[.305,.205,.285]);
  // Frange en mèches souples qui encadrent le front.
  for(let i=0;i<9;i++){
    const x=-.205+i*.051;
    const y=2.405-Math.abs(x)*.19;
    curveTube([[x*.72,2.49,.17],[x*.94,2.445,.245],[x*1.04,y,.275],[x*1.02,y-.045,.255]],hair,.025);
  }
  // Masse arrière pour donner une vraie épaisseur aux coiffures longues.
  if(!["bob","doublebun","curly"].includes(state.hairStyle)){
    sphere(avatarRoot,hair,[0,2.12,-.205],[.265,.39,.115]);
  }
  if(state.hairStyle==="long"){
    // Grandes mèches ondulées, de longueurs légèrement différentes.
    for(let side of [-1,1]){
      for(let k=0;k<4;k++){
        const x=side*(.13+k*.045);
        curveTube([[side*.18,2.30,-.19],[x,2.12,-.27],[x+side*.035,1.91,-.28],[x-side*.015,1.70,-.25],[x+side*.025,1.52+k*.025,-.20]],hair,.038-k*.003);
      }
    }
  }else if(state.hairStyle==="braid"){
    // Tresse épaisse en maillons alternés, posée sur l'épaule.
    curveTube([[.19,2.28,-.18],[.28,2.12,-.12],[.34,1.98,.015],[.34,1.78,.08]],hair,.055);
    for(let i=0;i<10;i++){
      const y=2.12-i*.075, x=.29+Math.sin(i*.9)*.055, z=.105+Math.cos(i*.9)*.018;
      sphere(avatarRoot,hair,[x,y,z],[.065,.075,.052]);
    }
    sphere(avatarRoot,gold,[.34,1.39,.10],[.045,.035,.035]);
  }else if(state.hairStyle==="bun"){
    for(const side of [-1,1]){
      sphere(avatarRoot,hair,[side*.17,2.49,-.04],[.145,.15,.14]);
      curveTube([[side*.12,2.48,.06],[side*.23,2.39,.12],[side*.26,2.29,.08]],hair,.035);
    }
  }else if(state.hairStyle==="bob"){
    sphere(avatarRoot,hair,[0,2.22,-.035],[.31,.27,.28]);
    for(const side of [-1,1]){
      curveTube([[side*.24,2.37,.11],[side*.30,2.20,.15],[side*.29,2.02,.12],[side*.22,1.94,.09]],hair,.062);
      sphere(avatarRoot,hair,[side*.245,1.98,.09],[.065,.085,.06]);
    }
  }else if(state.hairStyle==="ponytail"){
    sphere(avatarRoot,hair,[0,2.37,-.27],[.16,.14,.13]);
    sphere(avatarRoot,gold,[0,2.32,-.35],[.085,.045,.045]);
    for(let k=0;k<4;k++){
      curveTube([[.02,2.30,-.34],[.07+k*.018,2.12,-.43],[.02+k*.025,1.91,-.48],[.10-k*.025,1.68,-.43],[.04,1.48+k*.025,-.36]],hair,.04);
    }
  }else if(state.hairStyle==="doublebun"){
    for(const side of [-1,1]){
      sphere(avatarRoot,hair,[side*.235,2.48,-.035],[.145,.15,.14]);
      for(let k=0;k<3;k++){
        const a=k*Math.PI*2/3;
        sphere(avatarRoot,hair,[side*.235+Math.cos(a)*.09,2.48+Math.sin(a)*.075,.045],[.065,.07,.06]);
      }
    }
  }else if(state.hairStyle==="halfup"){
    sphere(avatarRoot,hair,[0,2.49,-.17],[.17,.13,.13]);
    sphere(avatarRoot,gold,[0,2.43,-.285],[.075,.045,.035]);
    for(const side of [-1,1]){
      curveTube([[side*.19,2.28,-.18],[side*.25,2.05,-.22],[side*.27,1.82,-.20],[side*.22,1.62,-.16]],hair,.042);
    }
  }else if(state.hairStyle==="curly"){
    // Boucles en spirales souples de chaque côté du visage.
    for(const side of [-1,1]){
      for(let i=0;i<7;i++){
        const y=2.28-i*.085, x=side*(.245+(i%2)*.018);
        const pts=[];
        for(let k=0;k<9;k++){
          const a=k*Math.PI/2;
          pts.push([x+Math.cos(a)*.045,y-k*.012+Math.sin(a)*.045,.12+Math.sin(a)*.018]);
        }
        curveTube(pts,hair,.026);
      }
    }
  }
  // Accessoire choisi : fleurs, nœud ou couronne.
  if(state.hairAccessory==="flower"){
    for(const x of [-.19,0,.19]){
      const center=[x,2.47,.205];
      sphere(avatarRoot,material("#e6a2c5",.3),center,[.035,.035,.025]);
      for(let k=0;k<5;k++){
        const a=k*Math.PI*2/5;
        sphere(avatarRoot,material("#f7dce8",.35),[x+Math.cos(a)*.045,2.47+Math.sin(a)*.045,.205],[.028,.035,.018]);
      }
    }
  }else if(state.hairAccessory==="bow"){
    sphere(avatarRoot,material("#d879a9",.35),[-.2,2.44,.19],[.075,.045,.025]);
    sphere(avatarRoot,material("#d879a9",.35),[-.29,2.47,.19],[.065,.045,.025],[0,0,-.45]);
    sphere(avatarRoot,material("#d879a9",.35),[-.11,2.47,.19],[.065,.045,.025],[0,0,.45]);
  }else if(state.hairAccessory==="crown"){
    curveTube([[-.25,2.42,.13],[-.18,2.52,.17],[0,2.57,.2],[.18,2.52,.17],[.25,2.42,.13]],gold,.025);
    for(const x of [-.18,0,.18])sphere(avatarRoot,material("#e6a2c5",.25),[x,2.54+(.18-Math.abs(x))*.15,.2],[.025,.04,.02]);
  }else{
    curveTube([[-.23,2.43,.13],[0,2.51,.22],[.23,2.43,.13]],gold,.018);
    sphere(avatarRoot,material("#e6a2c5",.25),[0,2.52,.22],[.035,.05,.025]);
  }
  // Corsage et détails précieux
  sphere(avatarRoot,trim,[0,1.52,.17],[.035,.16,.018]);
  for(const x of [-.16,.16]) sphere(avatarRoot,gold,[x,1.54,.16],[.025,.025,.018]);
  // Ailes féeriques sculptées, avec contours et nervures visibles.
  if(state.wings!=="none"){
    const wingColor=state.wings==="crystal"?"#c7e5ff":state.wings==="butterfly"?"#e9a6d1":"#c6f1df";
    const wingMat=material(wingColor,.2,{transparent:true,opacity:.76,metalness:state.wings==="crystal"?.32:.12,side:THREE.DoubleSide});
    const veinMat=material(state.wings==="crystal"?"#f5fbff":state.wings==="butterfly"?"#fff0f8":"#f1fff7",.3,{metalness:.18});
    for(const side of [-1,1]){
      const shape=new THREE.Shape();
      if(state.wings==="fairy"){
        shape.moveTo(0,0);shape.bezierCurveTo(.03,.22,.12,.49,.28,.57);
        shape.bezierCurveTo(.36,.60,.37,.48,.31,.37);
        shape.bezierCurveTo(.25,.23,.15,.10,0,0);
      }else if(state.wings==="butterfly"){
        shape.moveTo(0,0);shape.bezierCurveTo(.02,.25,.10,.53,.30,.55);
        shape.bezierCurveTo(.43,.55,.39,.34,.29,.25);
        shape.bezierCurveTo(.40,.20,.39,.02,.23,-.04);
        shape.bezierCurveTo(.13,-.07,.07,-.01,0,0);
      }else{
        shape.moveTo(0,0);shape.lineTo(.12,.25);shape.lineTo(.31,.51);
        shape.lineTo(.34,.31);shape.lineTo(.24,.08);shape.lineTo(.08,-.08);shape.closePath();
      }
      const wing=addMesh(avatarRoot,new THREE.ShapeGeometry(shape,20),wingMat,[side*.29,1.78,-.205],[side,1,1]);
      wing.rotation.z=side*.08;
      const root=[side*.29,1.78,-.185];
      if(state.wings==="butterfly"){
        curveTube([root,[side*.40,2.00,-.17],[side*.58,2.28,-.17],[side*.63,2.32,-.17]],veinMat,.012);
        curveTube([root,[side*.43,1.88,-.17],[side*.57,1.79,-.17],[side*.52,1.72,-.17]],veinMat,.01);
      }else if(state.wings==="crystal"){
        curveTube([root,[side*.41,2.02,-.17],[side*.60,2.29,-.17],[side*.63,2.09,-.17]],veinMat,.014);
        curveTube([root,[side*.43,1.83,-.17],[side*.52,1.72,-.17]],veinMat,.012);
        for(const [x,y] of [[.41,2.02],[.60,2.29],[.63,2.09]]) sphere(avatarRoot,veinMat,[side*x,y,-.17],[.022,.022,.022]);
      }else{
        curveTube([root,[side*.38,1.99,-.17],[side*.53,2.22,-.17],[side*.57,2.30,-.17]],veinMat,.012);
        curveTube([root,[side*.39,1.91,-.17],[side*.48,2.02,-.17]],veinMat,.009);
      }
      sphere(avatarRoot,gold,[side*.30,1.78,-.16],[.035,.035,.025]);
    }
  }
  // Bijoux et ornements au choix.
  if(state.accessoryStyle!=="none"){
    const jewel=material("#f3d58d",.2,{metalness:.62});
    const gem=material("#e9a6d1",.18,{metalness:.25});
    if(["tiara","set"].includes(state.accessoryStyle)){
      curveTube([[-.25,2.39,.17],[-.18,2.49,.19],[0,2.55,.21],[.18,2.49,.19],[.25,2.39,.17]],jewel,.025);
      for(const x of [-.18,0,.18]) sphere(avatarRoot,gem,[x,2.51+(.18-Math.abs(x))*.18,.21],[.027,.04,.02]);
    }
    if(["earrings","set"].includes(state.accessoryStyle)){
      for(const side of [-1,1]){
        sphere(avatarRoot,jewel,[side*.285,2.12,.16],[.025,.035,.022]);
        sphere(avatarRoot,gem,[side*.285,2.06,.17],[.025,.035,.02]);
      }
    }
    if(["necklace","set"].includes(state.accessoryStyle)){
      curveTube([[-.16,1.93,.14],[-.10,1.87,.19],[0,1.84,.205],[.10,1.87,.19],[.16,1.93,.14]],jewel,.018);
      sphere(avatarRoot,gem,[0,1.82,.21],[.035,.045,.022]);
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
  // Pas d'anneau au pied du personnage pour garder le miroir épuré.
}
async function loadRealisticCharacter(){
  if(realisticReady || !scene) return;
  status("✨ Chargement du modèle 3D détaillé…");
  const loader=new GLTFLoader();
  try{
    const gltf=await loader.loadAsync("https://grab3d.com/dl/elf-rigged/elf-rigged.glb");
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
