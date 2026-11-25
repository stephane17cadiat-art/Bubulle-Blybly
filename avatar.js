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
let companionMotion = null, faceBlinkMeshes = [], hairMotionMesh = null;
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
  faceBlinkMeshes = []; hairMotionMesh = null;
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
  // Yeux brillants en plusieurs couches : iris, anneau, pupille et reflets.
  const irisMat=material("#8b6049",.24), irisRing=material("#c99a6b",.3), pupilMat=material("#211923",.16);
  for(const side of [-1,1]){
    const eyeWhite=sphere(avatarRoot,white,[side*.105,2.15,.245],[.073,.076,.031]);
    faceBlinkMeshes.push(eyeWhite);
    sphere(avatarRoot,irisRing,[side*.105,2.15,.271],[.041,.052,.015]);
    sphere(avatarRoot,irisMat,[side*.105,2.15,.281],[.034,.045,.012]);
    sphere(avatarRoot,pupilMat,[side*.105,2.15,.291],[.018,.031,.008]);
    sphere(avatarRoot,white,[side*.105-.012,2.17,.299],[.011,.014,.006]);
    sphere(avatarRoot,white,[side*.105+.014,2.135,.299],[.005,.007,.004]);
    // Paupière supérieure et cils fins.
    curveTube([[side*.18,2.15,.259],[side*.14,2.205,.27],[side*.105,2.218,.27],[side*.07,2.205,.27],[side*.03,2.15,.259]],dark,.008);
    for(let k=0;k<3;k++){
      const ex=side*(.145+k*.012);
      curveTube([[ex,2.196,.269],[ex+side*.018,2.215,.264]],dark,.0045);
    }
    curveTube([[side*.17,2.255,.245],[side*.11,2.275,.26],[side*.055,2.255,.245]],hair,.012);
    // Reflet doux sur la pommette.
    sphere(avatarRoot,material("#f7d8c9",.7),[side*.19,2.075,.218],[.035,.012,.009]);
  }
  // Nez délicat et sourire discret, plutôt qu'une simple pastille.
  sphere(avatarRoot,skin,[0,2.085,.273],[.025,.043,.032]);
  sphere(avatarRoot,material("#d99a91",.65),[0,2.055,.297],[.012,.008,.006]);
  curveTube([[-.052,1.995,.259],[-.028,1.982,.269],[0,1.98,.271],[.028,1.982,.269],[.052,1.995,.259]],lip,.009);
  curveTube([[-.035,1.977,.268],[0,1.972,.273],[.035,1.977,.268]],material("#f3c2b8",.6),.004);
  sphere(avatarRoot,blush,[-.19,2.04,.205],[.045,.022,.012]);
  sphere(avatarRoot,blush,[.19,2.04,.205],[.045,.022,.012]);
  // Chevelure sculptée : volume doux, mèches séparées et silhouettes propres à chaque coiffure.
  hairMotionMesh = new THREE.Group(); hairMotionMesh.position.set(0,2.2,0); avatarRoot.add(hairMotionMesh);
  const crownCap=sphere(hairMotionMesh,hair,[0,.18,-.005],[.305,.205,.285]);
  // The crown pivots at the top of the head for a very subtle sway.
  // Reflets fins qui donnent du relief aux mèches sans changer les coiffures choisies.
  const hairShine=material("#f0c99b",.42,{metalness:.08});
  const hairShade=material("#2d1c25",.55);
  for(let side of [-1,1]){
    for(let k=0;k<3;k++){
      const x=side*(.075+k*.045);
      curveTube([[x*.6,2.49,.19],[x*.85,2.43,.255],[x,2.31,.278],[x+side*.012,2.20,.27]],k===1?hairShine:hair,.009-k*.001);
    }
  }
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
      // Collier replacé à la base du cou, sur le haut du buste et sous le visage.
      curveTube([[-.17,1.80,.14],[-.11,1.73,.205],[0,1.69,.225],[.11,1.73,.205],[.17,1.80,.14]],jewel,.016);
      sphere(avatarRoot,gem,[0,1.66,.23],[.029,.038,.02]);
    }
  }
  // Compagnon 3D détaillé : volumes doux, museau, yeux brillants et petits mouvements.
  companionMotion=null;
  if(state.companion!=="none"){
    const x=.78, petRoot=new THREE.Group();petRoot.position.set(x,0,.1);avatarRoot.add(petRoot);
    const colors={rabbit:"#eee5df",cat:"#9690a8",fox:"#d98443",fawn:"#c99b70",dragon:"#79b99c",unicorn:"#eee0f5"};
    const coat=material(colors[state.companion]||"#eee5df",.72), lightCoat=material(state.companion==="fox"?"#fff0dc":state.companion==="dragon"?"#c5ead7":"#fff7ef",.82);
    const darkEye=material("#302637",.18), nose=material(state.companion==="fox"?"#3a2830":"#9d6878",.28);
    const inner=material("#d99eae",.65), goldPet=material("#f0d58d",.25,{metalness:.35});
    const petBall=(mat,pos,scale)=>sphere(petRoot,mat,pos,scale);
    const petTube=(points,mat,r,parent=petRoot)=>{const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return addMesh(parent,new THREE.TubeGeometry(c,24,r,8,false),mat);};
    // Corps, poitrail et tête avec proportions de petit animal.
    petBall(coat,[0,.52,0],[.17,.22,.15]);
    petBall(lightCoat,[0,.49,.128],[.105,.15,.045]);
    const head=new THREE.Group();head.position.set(0,.79,.015);petRoot.add(head);
    sphere(head,coat,[0,0,0],[.155,.15,.14]);
    sphere(head,lightCoat,[0,-.055,.115],[.105,.075,.055]);
    for(const side of [-1,1]){
      sphere(head,darkEye,[side*.058,.025,.132],[.022,.03,.014]);
      sphere(head,material("#ffffff",.2),[side*.064,.037,.145],[.007,.009,.006]);
      sphere(head,inner,[side*.112,-.045,.105],[.035,.028,.018]);
      cylinderBetween(petRoot,coat,[side*.09,.38,.02],[side*.105,.20,.07],.045,.035);
      sphere(petRoot,coat,[side*.105,.19,.09],[.052,.045,.07]);
    }
    sphere(head,nose,[0,-.055,.174],[.023,.017,.014]);
    petTube([[-.025,-.095,.17],[0,-.11,.18],[.025,-.095,.17]],darkEye,.005);
    const ears=[],wings=[],tailParts=[];
    if(state.companion==="rabbit"){
      for(const side of [-1,1]){
        const ear=new THREE.Group();ear.position.set(side*.075,.105,0);head.add(ear);ears.push(ear);
        sphere(ear,coat,[0,.105,0],[.045,.145,.038]);
        sphere(ear,inner,[0,.11,.032],[.024,.105,.012]);
        ear.rotation.z=side*.10;
      }
      sphere(petRoot,lightCoat,[0,.37,.14],[.075,.07,.045]);
    }else if(state.companion==="cat"){
      for(const side of [-1,1]){
        const ear=new THREE.Group();ear.position.set(side*.095,.105,0);head.add(ear);ears.push(ear);
        addMesh(ear,new THREE.ConeGeometry(.065,.16,20),coat,[0,.065,0]);
        addMesh(ear,new THREE.ConeGeometry(.034,.105,16),inner,[0,.067,.035]);
      }
      petTube([[0,.43,-.08],[.18,.48,-.12],[.24,.68,-.08],[.18,.78,-.02]],coat,.035);
      sphere(petRoot,coat,[.18,.78,-.02],[.045,.045,.045]);
      for(let side of [-1,1])petTube([[side*.07,.75,.14],[side*.18,.73,.13]],lightCoat,.004);
    }else if(state.companion==="fox"){
      for(const side of [-1,1]){
        const ear=new THREE.Group();ear.position.set(side*.095,.10,0);head.add(ear);ears.push(ear);
        addMesh(ear,new THREE.ConeGeometry(.065,.17,20),coat,[0,.065,0]);
        addMesh(ear,new THREE.ConeGeometry(.032,.105,16),inner,[0,.065,.035]);
      }
      // Museau allongé et masque clair caractéristique du renard.
      sphere(head,lightCoat,[0,-.065,.14],[.085,.055,.09]);
      const tail=new THREE.Group();tail.position.set(0,.43,-.10);petRoot.add(tail);tailParts.push(tail);
      petTube([[0,0,0],[.12,.08,-.08],[.20,.23,-.12],[.12,.34,-.12]],coat,.075,tail);
      sphere(tail,lightCoat,[.12,.34,-.12],[.065,.07,.07]);
    }else if(state.companion==="fawn"){
      for(const side of [-1,1]){
        const ear=new THREE.Group();ear.position.set(side*.12,.025,0);head.add(ear);ears.push(ear);
        sphere(ear,coat,[side*.045,.015,0],[.09,.045,.035]);
        sphere(ear,inner,[side*.045,.018,.03],[.06,.027,.012]);
        petTube([[side*.09,.13,-.02],[side*.12,.23,-.04],[side*.10,.28,-.04]],goldPet,.012);
        sphere(head,material("#fff0d9"),[side*.07,-.02,.129],[.018,.018,.01]);
      }
      for(let i=0;i<5;i++)sphere(petRoot,lightCoat,[(i-2)*.045,.60,.14],[.018,.022,.012]);
      sphere(head,lightCoat,[0,-.07,.14],[.08,.05,.07]);
    }else if(state.companion==="dragon"){
      for(const side of [-1,1]){
        const wing=new THREE.Group();wing.position.set(side*.10,.02,-.08);petRoot.add(wing);wings.push(wing);
        const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(side*.13,.12);shape.lineTo(side*.28,.19);shape.lineTo(side*.22,.04);shape.lineTo(side*.12,-.04);shape.closePath();
        addMesh(wing,new THREE.ShapeGeometry(shape),material("#5f9e85",.35,{side:THREE.DoubleSide}),[0,.12,0]);
        petTube([[0,.12,0],[side*.13,.23,0],[side*.28,.31,0]],lightCoat,.009);
      }
      for(const side of [-1,1])addMesh(head,new THREE.ConeGeometry(.035,.11,12),goldPet,[side*.09,.12,-.015],[1,1,1],[0,0,side*.5]);
      const tail=new THREE.Group();tail.position.set(0,.44,-.1);petRoot.add(tail);tailParts.push(tail);
      petTube([[0,0,0],[.10,-.05,-.10],[.18,.03,-.15],[.22,.15,-.15]],coat,.035,tail);
      addMesh(tail,new THREE.ConeGeometry(.045,.13,12),goldPet,[.22,.19,-.15],[1,1,1],[0,0,-.7]);
    }else if(state.companion==="unicorn"){
      const horn=addMesh(head,new THREE.ConeGeometry(.027,.19,20),goldPet,[0,.19,.015],[1,1,1],[0,0,0]);
      horn.rotation.z=-.12;
      petTube([[-.12,.61,-.04],[-.17,.50,-.02],[-.15,.40,0]],material("#d7a3d0",.4),.025);
      petTube([[.12,.61,-.04],[.17,.50,-.02],[.15,.40,0]],material("#a9b9e8",.4),.025);
      for(let side of [-1,1])sphere(head,material("#f5c4de"),[side*.10,-.09,.10],[.03,.025,.018]);
    }
    companionMotion={head,ears,wings,tailParts,petRoot,kind:state.companion};
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

// Petit décor 3D : arbres féeriques, champignons et fleurs lumineuses.
let forestFireflies=[];
function buildForestDecor(){
  const decor=new THREE.Group();scene.add(decor);forestFireflies=[];
  const bark=material("#765344",.9),leafA=material("#477d62",.78),leafB=material("#6e9c70",.75);
  const glow=material("#f8e6a4",.22,{emissive:"#f4c95d",emissiveIntensity:1.5});
  const cap=material("#d879a9",.38),cap2=material("#b89ae8",.35),stem=material("#f4e8d4",.8);
  for(const side of [-1,1]){
    const x=side*1.42;
    cylinderBetween(decor,bark,[x,.12,-.72],[x,1.18,-.72],.075,.11);
    sphere(decor,leafA,[x,1.34,-.72],[.39,.48,.31]);
    sphere(decor,leafB,[x-side*.18,1.55,-.68],[.28,.34,.27]);
    sphere(decor,leafA,[x+side*.18,1.12,-.66],[.29,.35,.25]);
    // Champignons au pied des arbres
    for(let i=0;i<2;i++){
      const mx=x+side*(.20+i*.12), my=.18+i*.035, mz=-.18;
      cylinderBetween(decor,stem,[mx,my,mz],[mx,my+.18,mz],.045,.055);
      sphere(decor,i?cap2:cap,[mx,my+.21,mz],[.14,.075,.14]);
      for(let d=0;d<3;d++)sphere(decor,glow,[mx+(d-1)*.065,my+.245,mz+.105],[.014,.014,.012]);
    }
    // Petites fleurs au premier plan
    for(let i=0;i<3;i++){
      const fx=x+side*(i*.12-.12), fy=.16, fz=.18+i*.06;
      cylinderBetween(decor,leafB,[fx,fy,fz],[fx,fy+.27,fz],.012,.018);
      sphere(decor,glow,[fx,fy+.29,fz],[.045,.045,.035]);
      const petal=material(i===1?"#f4c8df":"#d9c8ff",.4,{emissive:"#8c6aab",emissiveIntensity:.22});
      for(let k=0;k<5;k++){const a=k*Math.PI*2/5;sphere(decor,petal,[fx+Math.cos(a)*.065,fy+.29+Math.sin(a)*.055,fz],[.038,.035,.025]);}
    }
  }
  // Lucioles en suspension, animées doucement autour du miroir.
  for(let i=0;i<12;i++){
    const x=(Math.sin(i*2.4)*1.55),y=.65+(i%4)*.43,z=.15-(i%3)*.18;
    const dot=sphere(decor,glow,[x,y,z],[.025,.025,.025]);
    forestFireflies.push({mesh:dot,baseY:y,phase:i*.83,baseX:x});
  }
  return decor;
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
  buildForestDecor();
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
  for(const f of forestFireflies){f.mesh.position.y=f.baseY+Math.sin(t*1.25+f.phase)*.10;f.mesh.position.x=f.baseX+Math.sin(t*.7+f.phase)*.055;const pulse=.75+.45*(.5+.5*Math.sin(t*2+f.phase));f.mesh.scale.setScalar(.025*pulse);}
  if(hairMotionMesh){hairMotionMesh.rotation.z=Math.sin(t*1.15)*.012;hairMotionMesh.rotation.y=Math.sin(t*.8)*.018;}
  if(faceBlinkMeshes.length){const blinkPhase=(t%4.7);const blink=blinkPhase>4.48&&blinkPhase<4.62?Math.sin((blinkPhase-4.48)/.14*Math.PI):0;for(const eyeMesh of faceBlinkMeshes)eyeMesh.scale.y=.076*(1-.88*blink);}
  if(companionMotion){const p=companionMotion; p.head.rotation.z=Math.sin(t*2.1)*.035; for(let i=0;i<p.ears.length;i++){const side=i===0?-1:1;p.ears[i].rotation.z=side*(.10+Math.sin(t*3+i)*.07);} for(let i=0;i<p.wings.length;i++){p.wings[i].rotation.y=Math.sin(t*10+i)*.48;} for(let i=0;i<p.tailParts.length;i++){p.tailParts[i].rotation.x=Math.sin(t*2.4+i)*.13;p.tailParts[i].rotation.z=Math.sin(t*1.8+i)*.12;} p.petRoot.position.y=Math.sin(t*2)*.018;}
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
