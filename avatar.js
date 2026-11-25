import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
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
  eyeColor:"#8b6049",eyeShape:"almond",lipColor:"#b96e78",makeup:"soft",freckles:"none",
  outfit:"princess",outfitColor:"#d98ab9",wings:"fairy",magicEffect:"petals",magicColor:"rose",magicMotion:"orbit",magicPower:"petalBurst",companion:"none",theme:"forest"
};
let state = {...defaults}, role = null, roomRef = null, saveTimer = null, saving = false;
let companionMotion = null, magicParticles = [], magicAura = null, powerBurstGroup = null, powerStarted = 0, faceBlinkMeshes = [], faceGazeMeshes = [], faceBrowMeshes = [], hairMotionMesh = null, faceSmileMesh = null, kissPucker = null, surpriseMouth = null, faceAction = "smile", faceActionUntil = 0;
let scene, camera, renderer, avatarRoot, realisticRoot = null, realisticExtras = null, realisticMixer = null, realisticAction = null, realisticReady = false, realisticVisible = false, leftArm, rightArm, clock, dragging = false, lastX = 0, lastY = 0, danceUntil = 0, poseMode = "idle", poseUntil = 0;

function material(color, roughness=.72, extra={}) {
  return new THREE.MeshPhysicalMaterial({
    color,roughness,clearcoat:.12,clearcoatRoughness:.5,
    sheen:.12,sheenRoughness:.72,...extra
  });
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
  faceBlinkMeshes = []; faceGazeMeshes = []; faceBrowMeshes = []; hairMotionMesh = null; faceSmileMesh = null; kissPucker = null; surpriseMouth = null; powerBurstGroup = null; powerStarted = 0;
  if(avatarRoot) scene.remove(avatarRoot);
  avatarRoot = new THREE.Group(); scene.add(avatarRoot);
  const skin=material(state.skinColor,.68,{sheen:.28,sheenColor:"#f6cbb9",sheenRoughness:.82});
  const hair=material(state.hairColor,.38,{metalness:.025,clearcoat:.32,clearcoatRoughness:.36});
  const dress=material(state.outfitColor,.42,{metalness:.035,sheen:.32,sheenColor:"#fff0f5",sheenRoughness:.58});
  const dark=material("#342536");
  const gold=material("#e8c77f",.28,{metalness:.55}), eye=material("#49302d",.22), white=material("#fffaf5",.25);
  const lip=material(state.lipColor||"#b96e78",.48), blush=material(state.makeup==="none"?"#d99a91":state.makeup==="fairy"?"#d98cb8":"#d88c91",.72);
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
    // Silhouette moderne épurée, sans chaussures ni accessoires ajoutés.
  }else{
    // Corsage princesse avec épaules délicates
    for(const x of [-.22,.22]) sphere(avatarRoot,accent,[x,1.66,0],[.09,.07,.11]);
  }
  const bodice=sphere(avatarRoot,dress,[0,1.48,0],[.245,.36,.19]);
  sphere(avatarRoot,skin,[0,1.78,0],[.095,.13,.09]);
  // Robe volontairement épurée : pas de broderies, galons ou détails scintillants.
  // Bras fins, épaules et mains
  leftArm=new THREE.Group();leftArm.position.set(-.25,1.62,0);avatarRoot.add(leftArm);
  sphere(leftArm,skin,[0,-.05,0],[.105,.13,.11]);
  cylinderBetween(leftArm,skin,[0,-.08,0],[-.12,-.43,.02],.075,.06);
  cylinderBetween(leftArm,skin,[-.12,-.43,.02],[-.16,-.69,.07],.06,.045);
  sphere(leftArm,skin,[-.16,-.72,.08],[.055,.09,.045]);
  for(let finger=0;finger<3;finger++)cylinderBetween(leftArm,skin,[-.18+finger*.018,-.75,.105],[-.19+finger*.018,-.79,.105],.009,.007);
  rightArm=new THREE.Group();rightArm.position.set(.25,1.62,0);avatarRoot.add(rightArm);
  sphere(rightArm,skin,[0,-.05,0],[.105,.13,.11]);
  cylinderBetween(rightArm,skin,[0,-.08,0],[.12,-.43,.02],.075,.06);
  cylinderBetween(rightArm,skin,[.12,-.43,.02],[.16,-.69,.07],.06,.045);
  sphere(rightArm,skin,[.16,-.72,.08],[.055,.09,.045]);
  for(let finger=0;finger<3;finger++)cylinderBetween(rightArm,skin,[.14+finger*.018,-.75,.105],[.13+finger*.018,-.79,.105],.009,.007);
  // Cou délicat pour une transition plus naturelle entre la tête et le buste.
  cylinderBetween(avatarRoot,skin,[0,1.68,.005],[0,1.91,.005],.075,.082);
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

  for(const side of [-1,1]){
    sphere(avatarRoot,skin,[side*.275,2.1,.005],[.045,.075,.052]);
    sphere(avatarRoot,material("#c88978",.78),[side*.292,2.1,.043],[.018,.038,.012]);
  }
  // Yeux brillants en plusieurs couches : iris, anneau, pupille et reflets.
  const irisMat=material(state.eyeColor||"#8b6049",.24), irisRing=material("#c99a6b",.3), pupilMat=material("#211923",.16);
  const eyeY=state.eyeShape==="round"?1.14:state.eyeShape==="soft"?0.92:1;
  for(const side of [-1,1]){
    const eyeWhite=sphere(avatarRoot,white,[side*.105,2.15,.245],[.073,.076*eyeY,.031]);
    eyeWhite.userData.baseScaleY=.076*eyeY;
    faceBlinkMeshes.push(eyeWhite);
    const iris=sphere(avatarRoot,irisRing,[side*.105,2.15,.271],[.041,.052*eyeY,.015]);
    const irisCore=sphere(avatarRoot,irisMat,[side*.105,2.15,.281],[.034,.045*eyeY,.012]);
    const pupil=sphere(avatarRoot,pupilMat,[side*.105,2.15,.291],[.018,.031*eyeY,.008]);
    faceGazeMeshes.push(iris,irisCore,pupil);
    sphere(avatarRoot,white,[side*.105-.012,2.17,.299],[.011,.014,.006]);
    sphere(avatarRoot,white,[side*.105+.014,2.135,.299],[.005,.007,.004]);
    // Paupière supérieure et cils fins.
    curveTube([[side*.18,2.15,.259],[side*.14,2.205,.27],[side*.105,2.218,.27],[side*.07,2.205,.27],[side*.03,2.15,.259]],dark,.008);
    for(let k=0;k<3;k++){
      const ex=side*(.145+k*.012);
      curveTube([[ex,2.196,.269],[ex+side*.018,2.215,.264]],dark,.0045);
    }
    const brow=curveTube([[side*.17,2.255,.245],[side*.11,2.275,.26],[side*.055,2.255,.245]],hair,.012);
    faceBrowMeshes.push(brow);
    curveTube([[side*.17,2.105,.257],[side*.135,2.085,.27],[side*.105,2.081,.274],[side*.075,2.085,.27],[side*.04,2.105,.257]],material("#b98578",.72),.0045);
    // Reflet doux sur la pommette.
    sphere(avatarRoot,material("#f7d8c9",.7),[side*.19,2.075,.218],[.035,.012,.009]);
  }
  // Nez délicat et sourire discret, plutôt qu'une simple pastille.
  sphere(avatarRoot,skin,[0,2.09,.268],[.018,.052,.028]);
  sphere(avatarRoot,material("#d99a91",.65),[-.014,2.055,.294],[.008,.006,.005]);
  sphere(avatarRoot,material("#d99a91",.65),[.014,2.055,.294],[.008,.006,.005]);
  faceSmileMesh=curveTube([[-.052,1.995,.259],[-.028,1.982,.269],[0,1.98,.271],[.028,1.982,.269],[.052,1.995,.259]],lip,.009);
  kissPucker=sphere(avatarRoot,lip,[0,1.985,.278],[.001,.001,.001]);
  surpriseMouth=sphere(avatarRoot,material("#713d4b",.55),[0,1.985,.277],[.001,.001,.001]);
  curveTube([[-.035,1.977,.268],[0,1.972,.273],[.035,1.977,.268]],material("#f3c2b8",.6),.004);
  if(state.makeup!=="none"){
    const blushSize=state.makeup==="fairy"?1.35:1;
    sphere(avatarRoot,blush,[-.19,2.04,.205],[.045*blushSize,.022*blushSize,.012]);
    sphere(avatarRoot,blush,[.19,2.04,.205],[.045*blushSize,.022*blushSize,.012]);
  }
  if(state.makeup==="fairy"){
    const shimmer=material("#d8a9e8",.3,{metalness:.18,emissive:"#8e5ca8",emissiveIntensity:.12});
    for(const side of [-1,1])sphere(avatarRoot,shimmer,[side*.105,2.225,.249],[.061,.012,.009]);
  }
  if(state.freckles==="light"||state.freckles==="many"){
    const freckle=material("#a86f58",.9);
    const dots=state.freckles==="many"?5:3;
    for(const side of [-1,1])for(let i=0;i<dots;i++){
      const x=side*(.145+(i%3)*.025),y=2.045-Math.floor(i/3)*.018;
      sphere(avatarRoot,freckle,[x,y,.224],[.005,.005,.003]);
    }
  }
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
  // Petits effets magiques personnalisables, attachés au personnage.
  magicParticles=[];
  if(state.magicEffect && state.magicEffect!=="none"){
    const effect=state.magicEffect;
    const effectPalette=effect==="stars"?["#fff1a8","#d9c8ff","#b9e7ff"]:effect==="butterflies"?["#f7a9d2","#b9a7f5","#ffe3a3"]:effect==="aura"||effect==="aurora"?["#a8f0df","#d8b7ff","#fff0c2"]:effect==="fireflies"?["#fff0a6","#f7d77b","#d5f4b2"]:effect==="hearts"?["#ff9fc8","#f7c4df","#e8a9e8"]:effect==="crystals"?["#b9e7ff","#d9c8ff","#fff1d1"]:["#f6b5d1","#f4d89a","#d8c5ff"];
    const magicPalettes={rose:["#ff9fc8","#f7c4df","#e8a9e8"],violet:["#b9a7f5","#d9c8ff","#eee5ff"],turquoise:["#8debdc","#b4fff0","#d5f4ee"],gold:["#ffe28a","#f7c86a","#fff0b5"],blue:["#9bcfff","#c6e7ff","#e0f4ff"]};
    const palette=magicPalettes[state.magicColor]||effectPalette;
    const glowMats=palette.map(c=>material(c,.28,{emissive:c,emissiveIntensity:effect==="fireflies"?1.35:.7,transparent:true,opacity:.92}));
    const heartShape=new THREE.Shape();
    heartShape.moveTo(0,-.035);heartShape.bezierCurveTo(-.075,.02,-.075,.075,-.025,.075);heartShape.bezierCurveTo(0,.075,.018,.045,0,.025);heartShape.bezierCurveTo(.035,.09,.09,.065,.075,.015);heartShape.bezierCurveTo(.065,-.005,.025,-.03,0,-.035);
    for(let i=0;i<24;i++){
      const angle=i*2.399, y=.48+(i%8)*.255, radius=.38+(i%3)*.055;
      const geo=effect==="stars"||effect==="crystals"?new THREE.OctahedronGeometry(effect==="crystals"?.052:.038,0):effect==="hearts"?new THREE.ShapeGeometry(heartShape):new THREE.SphereGeometry(effect==="fireflies"?.027:.035,12,10);
      const scale=effect==="petals"?[.48,1.25,.42]:effect==="butterflies"?[1.25,.72,.35]:effect==="hearts"?[1.25,1.25,.35]:effect==="crystals"?[.8,1.35,.8]:[1,1,.65];
      const particle=addMesh(avatarRoot,geo,glowMats[i%glowMats.length],[Math.cos(angle)*radius,y,Math.sin(angle)*.20+.23],scale);
      particle.userData={angle,baseY:y,radius,phase:i*.71,kind:effect,baseScale:particle.scale.clone()};
      magicParticles.push(particle);
    }
    if(effect==="aura"||effect==="aurora"){
      const colors=magicPalettes[state.magicColor]||effectPalette;
      const auraMat=material(colors[0],.32,{emissive:colors[0],emissiveIntensity:.62,transparent:true,opacity:effect==="aurora"?.12:.16,depthWrite:false,side:THREE.DoubleSide});
      magicAura=addMesh(avatarRoot,new THREE.SphereGeometry(1,32,24),auraMat,[0,1.24,-.10],[effect==="aurora"?.72:.58,1.18,.34]);
      magicAura.renderOrder=1;
      if(effect==="aurora"){
        const veilMat=auraMat.clone();veilMat.color.set(colors[1]);veilMat.emissive.set(colors[1]);veilMat.opacity=.075;
        const veil=addMesh(avatarRoot,new THREE.SphereGeometry(1,32,24),veilMat,[0,1.28,-.13],[.82,1.28,.39]);
        veil.renderOrder=1;magicAura.userData.veil=veil;
      }
    }else magicAura=null;
  }else magicAura=null;
  powerBurstGroup=new THREE.Group();avatarRoot.add(powerBurstGroup);powerBurstGroup.visible=false;
  // Pas d'anneau au pied du personnage pour garder le miroir épuré.
}
function buildRealisticLook(g){
  const hairMat=new THREE.MeshPhysicalMaterial({color:state.hairColor||defaults.hairColor,roughness:.38,clearcoat:.25});
  const cloth=new THREE.MeshPhysicalMaterial({color:state.outfitColor||defaults.outfitColor,roughness:.42,sheen:.3,side:THREE.DoubleSide});
  const gold=new THREE.MeshPhysicalMaterial({color:"#e8c77f",metalness:.6,roughness:.3});
  const cap=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),hairMat);cap.scale.set(.205,.22,.19);cap.position.set(0,2.105,-.015);g.add(cap);
  const lock=(pts,r)=>{const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(c,22,r,9,false),hairMat);m.castShadow=true;g.add(m);};
  const h=state.hairStyle||"long";
  if(h==="bun"||h==="doublebun"){for(const x of (h==="bun"?[0]:[-.16,.16])){const b=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),hairMat);b.scale.y=.8;b.position.set(x,2.22,-.04);g.add(b);}}
  else if(h==="bob"){const b=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),hairMat);b.scale.set(.23,.34,.21);b.position.set(0,1.94,-.02);g.add(b);}
  else if(h==="curly"){for(let i=0;i<14;i++){const side=i%2?1:-1;const b=new THREE.Mesh(new THREE.SphereGeometry(.105,12,10),hairMat);b.position.set(side*(.14+(i%3)*.03),1.98-Math.floor(i/2)*.085,.02);g.add(b);}}
  else if(h==="braid"){lock([[.1,2.08,-.1],[.2,1.9,-.1],[.2,1.65,-.05],[.12,1.4,0]],.06);for(let i=0;i<8;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.05,12,10),hairMat);b.position.set(.2+Math.sin(i*1.5)*.035,1.94-i*.065,-.04);g.add(b);}}
  else {for(const side of [-1,1]){lock([[side*.15,2.08,.08],[side*.22,1.9,.1],[side*.23,1.65,.08],[side*.17,1.4,.04]],.055);if(h==="ponytail")lock([[side*.1,2.1,-.12],[side*.18,1.95,-.2],[side*.2,1.7,-.2]],.065);}}
  if(h==="halfup"){const tie=new THREE.Mesh(new THREE.TorusGeometry(.075,.018,8,24),gold);tie.position.set(0,2.12,-.08);g.add(tie);}
  const outfit=state.outfit||"princess", top=1.17;
  const bottom=outfit==="princess"?.62:outfit==="boho"?.53:outfit==="magic"?.58:outfit==="forest"?.42:.34;
  const radius=outfit==="princess"?.56:outfit==="boho"?.48:outfit==="magic"?.51:outfit==="forest"?.36:.30;
  const skirt=new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(.19,top),new THREE.Vector2(.23,.98),new THREE.Vector2(radius*.72,.72),new THREE.Vector2(radius,bottom)],48),cloth);skirt.castShadow=true;g.add(skirt);
  const belt=new THREE.Mesh(new THREE.TorusGeometry(.205,.016,8,48),gold);belt.rotation.x=Math.PI/2;belt.position.y=1.13;g.add(belt);
  const buckle=new THREE.Mesh(new THREE.OctahedronGeometry(.045,1),gold);buckle.position.set(0,1.13,.205);g.add(buckle);
  const gem=new THREE.MeshPhysicalMaterial({color:state.outfitColor||"#d98ab9",metalness:.18,roughness:.2,emissive:state.outfitColor||"#d98ab9",emissiveIntensity:.12});
  const jewel=new THREE.Mesh(new THREE.SphereGeometry(.027,12,10),gem);jewel.position.set(0,1.13,.244);g.add(jewel);
  if(outfit==="forest"||outfit==="magic"){for(const side of [-1,1]){const cape=new THREE.Mesh(new THREE.ConeGeometry(.22,.8,14,1,true),cloth);cape.position.set(side*.14,.9,-.2);cape.rotation.z=-side*.1;cape.scale.z=.25;g.add(cape);}}
  if(outfit==="princess"||outfit==="boho"||outfit==="magic"){for(let i=0;i<3;i++){const trim=new THREE.Mesh(new THREE.TorusGeometry(radius*(.45+i*.2),.009,6,48),gold);trim.rotation.x=Math.PI/2;trim.position.y=bottom+.07+i*.1;g.add(trim);}}
}

function buildRealisticAccessories(){
  if(!realisticRoot)return;
  if(realisticExtras){realisticRoot.remove(realisticExtras);realisticExtras=null;}
  const g=new THREE.Group();realisticExtras=g;realisticRoot.add(g);buildRealisticLook(g);
  const gold=new THREE.MeshPhysicalMaterial({color:'#e8c77f',metalness:.7,roughness:.25});
  const gem=new THREE.MeshPhysicalMaterial({color:state.outfitColor||'#d98ab9',roughness:.22,metalness:.15,emissive:state.outfitColor||'#d98ab9',emissiveIntensity:.1});
  const wc={fairy:'#d9a8ef',butterfly:'#8bd9ce',crystal:'#b7d8ff'}[state.wings];
  if(wc){const wm=new THREE.MeshPhysicalMaterial({color:wc,transparent:true,opacity:.76,side:THREE.DoubleSide,roughness:.25,emissive:wc,emissiveIntensity:.12});const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(.12,.24,.42,.55,.66,.52);sh.bezierCurveTo(.62,.28,.43,.03,.16,-.12);sh.bezierCurveTo(.34,-.04,.38,-.27,.12,-.32);sh.bezierCurveTo(.06,-.22,-.02,-.12,0,0);const geo=new THREE.ShapeGeometry(sh,20);for(const side of [-1,1]){const w=new THREE.Mesh(geo,wm);w.position.set(side*.12,1.55,-.16);w.scale.x=side;w.rotation.z=side*.08;g.add(w);}}
  if(state.hairAccessory==='crown'||state.accessoryStyle==='tiara'||state.accessoryStyle==='set'){const c=new THREE.Group();c.position.set(0,2.18,.11);g.add(c);const b=new THREE.Mesh(new THREE.TorusGeometry(.19,.018,8,48,Math.PI),gold);b.rotation.x=Math.PI/2;c.add(b);for(let i=-2;i<=2;i++){const x=new THREE.Mesh(new THREE.SphereGeometry(i===0?.045:.028,12,10),gem);x.position.set(i*.075,.045+.09-Math.abs(i)*.025,0);c.add(x);}}
  else if(state.hairAccessory==='flower'||state.hairAccessory==='bow'){const o=new THREE.Group();o.position.set(.19,2.12,.13);g.add(o);for(let i=0;i<5;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.05,12,10),gem);p.scale.set(.75,1.2,.4);p.position.set(Math.cos(i*Math.PI*2/5)*.055,Math.sin(i*Math.PI*2/5)*.055,0);o.add(p);}}
  if(['earrings','necklace','set'].includes(state.accessoryStyle)){const n=new THREE.Mesh(new THREE.TorusGeometry(.17,.012,8,48,Math.PI),gold);n.position.set(0,1.55,.145);n.rotation.x=Math.PI/2;g.add(n);const p=new THREE.Mesh(new THREE.OctahedronGeometry(.05),gem);p.position.set(0,1.39,.16);g.add(p);}
}
async function applyRealisticStyle(){
  if(!realisticRoot)return;
  const colors={
    skin:(state.skinColor||defaults.skinColor),
    hair:(state.hairColor||defaults.hairColor),
    cloth:(state.outfitColor||defaults.outfitColor)
  };
  realisticRoot.traverse(obj=>{
    if(!obj.isMesh)return;
    const label=((obj.name||"")+" "+(Array.isArray(obj.material)?obj.material: [obj.material]).map(m=>m?.name||"").join(" ")).toLowerCase();
    const target=/hair|braid|ponytail|beard/.test(label)?"hair":
      /skin|face|body|hand|arm|leg|head|ear/.test(label)?"skin":
      /cloth|fabric|tunic|dress|shirt|skirt|sleeve|cape|衣/.test(label)?"cloth":null;
    if(!target)return;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    mats.forEach(m=>{
      if(!m)return;
      if(m.color)m.color.set(colors[target]);
      if("roughness" in m)m.roughness=target==="hair"?.42:target==="skin"?.72:.48;
      if("metalness" in m)m.metalness=target==="cloth"?.04:.015;
      if("clearcoat" in m)m.clearcoat=target==="hair"?.28:target==="skin"?.04:.14;
      m.needsUpdate=true;
    });
  });
}
async function loadRealisticCharacter(){
  if(realisticReady || !scene) return;
  status("✨ Chargement du modèle humain réaliste…");
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
        mats.forEach(m=>{if(m){m.roughness=Math.max(m.roughness??.45,.38);m.needsUpdate=true;}});
      }
    });
    scene.add(realisticRoot);
    applyRealisticStyle();buildRealisticAccessories();
    if(gltf.animations?.length){realisticMixer=new THREE.AnimationMixer(realisticRoot);realisticAction=realisticMixer.clipAction(gltf.animations[0]);}
    realisticReady=true;
    status("✓ Modèle humain 3D chargé — tu peux l’essayer dans le miroir.");
    $("realisticBtn").disabled=false;
  }catch(error){
    console.warn("Le modèle 3D détaillé n’a pas pu être chargé :",error);
    status("Échec du chargement 3D : "+(error?.message||error?.target?.statusText||"erreur réseau ou CORS")+". Ton avatar actuel reste intact.");
    $("realisticBtn").disabled=true;
  }
}
function toggleRealisticCharacter(){
  if(!realisticReady)return;
  realisticVisible=!realisticVisible;
  if(avatarRoot)avatarRoot.visible=!realisticVisible;
  realisticRoot.visible=realisticVisible;
  $("realisticBtn").textContent=realisticVisible?"🌸 Revenir à mon avatar":"✨ Essayer le modèle humain";
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
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  host.innerHTML="";host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffeaff,0x34445a,2.1));
  const key=new THREE.DirectionalLight(0xffe8dc,3.1);key.position.set(-3.5,5.5,4.5);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=.5;key.shadow.camera.far=12;key.shadow.bias=-.00018;scene.add(key);
  const fill=new THREE.PointLight(0xa9e8df,22,8);fill.position.set(3,2.3,2.4);scene.add(fill);
  const rim=new THREE.PointLight(0xd4b7ff,18,7);rim.position.set(-2.5,2.7,-2.5);scene.add(rim);
  buildForestDecor();
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1.8,48),material("#b6a0ca",.9,{transparent:true,opacity:.15}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.08;scene.add(floor);
  clock=new THREE.Clock();buildAvatar();resize();loadRealisticCharacter();
  const observer=new ResizeObserver(resize);observer.observe(host);
  renderer.domElement.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
  renderer.domElement.addEventListener("pointermove",e=>{if(!dragging)return;const turn=(e.clientX-lastX)*.012;if(avatarRoot)avatarRoot.rotation.y+=turn;if(realisticRoot&&realisticVisible)realisticRoot.rotation.y+=turn;lastX=e.clientX;lastY=e.clientY});
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
  if(realisticRoot&&realisticVisible){realisticRoot.position.y=Math.sin(t*1.35)*.018;realisticRoot.rotation.z=Math.sin(t*.82)*.008;}
  for(const f of forestFireflies){f.mesh.position.y=f.baseY+Math.sin(t*1.25+f.phase)*.10;f.mesh.position.x=f.baseX+Math.sin(t*.7+f.phase)*.055;const pulse=.75+.45*(.5+.5*Math.sin(t*2+f.phase));f.mesh.scale.setScalar(.025*pulse);}
  if(hairMotionMesh){hairMotionMesh.rotation.z=Math.sin(t*1.15)*.012;hairMotionMesh.rotation.y=Math.sin(t*.8)*.018;}
  const powerElapsed=powerStarted?Date.now()-powerStarted:9999;
  const powerActive=powerBurstGroup&&powerElapsed>=0&&powerElapsed<1900;
  const powerProgress=powerActive?powerElapsed/1900:1;
  const powerPulse=powerActive?Math.sin(Math.PI*powerProgress):0;
  if(powerBurstGroup){
    powerBurstGroup.visible=!!powerActive;
    if(powerActive){
      for(const particle of powerBurstGroup.children){
        const d=particle.userData;
        const progress=THREE.MathUtils.clamp((powerProgress-d.delay)/(1-d.delay),0,1);
        const ease=1-Math.pow(1-progress,2);
        if(state.magicPower==="heartShield"){
          const a=d.angle+t*.9;
          particle.position.set(Math.cos(a)*(.48+progress*.12),1.12+Math.sin(a)*.58,.22+Math.sin(a)*.12);
          particle.rotation.z=-a*.18;
          particle.scale.copy(d.baseScale).multiplyScalar(.25+.8*Math.sin(Math.PI*progress));
        }else{
          particle.position.set(Math.cos(d.angle)*(.12+ease*.88),1.22+ease*(d.rise||.5),.22+Math.sin(d.angle)*(.12+ease*.18));
          particle.rotation.z=d.spin+progress*2.4;
          particle.scale.copy(d.baseScale).multiplyScalar(Math.sin(Math.PI*progress)*1.15+.08);
        }
        particle.material.opacity=(1-progress)*.95;
      }
    }else if(powerStarted){powerBurstGroup.visible=false;}
  }
  for(const p of magicParticles){
    const d=p.userData, motion=state.magicMotion||"orbit";
    const baseSpeed=motion==="swirl"?.82:motion==="gentle"?.2:(d.kind==="butterflies"?.62:.34);
    const speed=baseSpeed*(powerActive&&state.magicPower==="fireflyDance"?2.8:1);
    const bob=motion==="swirl"?.12:motion==="gentle"?.045:.075;
    const wobble=motion==="swirl"?.75:motion==="gentle"?.18:.45;
    const a=d.angle+t*speed;
    const burst=powerActive&&state.magicPower==="petalBurst"?1+powerPulse*1.35:1;
    const shield=powerActive&&state.magicPower==="heartShield"?1+powerPulse*.45:1;
    p.position.set(Math.cos(a)*d.radius*burst*shield,d.baseY+Math.sin(t*(motion==="swirl"?2.6:1.7)+d.phase)*bob+(powerActive&&state.magicPower==="petalBurst"?powerPulse*.22:0),Math.sin(a)*.20+.23);
    p.rotation.z=Math.sin(t*(motion==="swirl"?3:2)+d.phase)*wobble+(powerActive&&state.magicPower==="crystalWave"?powerPulse*1.7:0);
    const pulse=.82+.24*(.5+.5*Math.sin(t*2.5+d.phase));
    const powerScale=powerActive&&state.magicPower==="starPulse"?1+powerPulse*1.8:powerActive&&state.magicPower==="crystalWave"?1+powerPulse*.8:1;
    p.scale.copy(d.baseScale).multiplyScalar(pulse*powerScale);
  }
  if(magicAura){magicAura.rotation.z=t*(state.magicMotion==="swirl"?.55:state.magicMotion==="gentle"?.12:.22);magicAura.material.opacity=.48+.22*(.5+.5*Math.sin(t*(state.magicMotion==="swirl"?3:2)));}
  if(faceBlinkMeshes.length){
    const blinkPhase=(t%4.7);const blink=blinkPhase>4.48&&blinkPhase<4.62?Math.sin((blinkPhase-4.48)/.14*Math.PI):0;
    for(let i=0;i<faceBlinkMeshes.length;i++){
      const wink=faceAction==="wink"&&Date.now()<faceActionUntil&&i===1?1:0;
      faceBlinkMeshes[i].scale.y=(faceBlinkMeshes[i].userData.baseScaleY||.076)*(1-.88*Math.max(blink,wink));
    }
  }
  const expressionActive=Date.now()<faceActionUntil;
  if(faceSmileMesh){
    const laughing=faceAction==="laugh"&&expressionActive;
    const surprised=faceAction==="surprise"&&expressionActive;
    faceSmileMesh.visible=!surprised;
    faceSmileMesh.scale.set(laughing?1.45:1,laughing?1.7:1,1);
  }
  if(faceGazeMeshes.length){
    const gazeX=Math.sin(t*.72)*.008, gazeY=Math.sin(t*.95)*.004;
    for(const part of faceGazeMeshes){if(part.userData.baseX===undefined){part.userData.baseX=part.position.x;part.userData.baseY=part.position.y;}part.position.x=part.userData.baseX+gazeX;part.position.y=part.userData.baseY+gazeY;}
  }
  if(faceBrowMeshes.length){const lift=faceAction==="surprise"&&expressionActive?.045:0;for(const brow of faceBrowMeshes)brow.position.y=lift;}
  if(surpriseMouth){const surprised=faceAction==="surprise"&&expressionActive;surpriseMouth.scale.set(surprised?.028:.001,surprised?.038:.001,surprised?.012:.001);}
  if(kissPucker){
    const kissing=faceAction==="kiss"&&expressionActive;
    kissPucker.scale.set(kissing ? 0.028 : 0.001,kissing ? 0.022 : 0.001,kissing ? 0.012 : 0.001);
  }
  if(companionMotion){const p=companionMotion; p.head.rotation.z=Math.sin(t*2.1)*.035; for(let i=0;i<p.ears.length;i++){const side=i===0?-1:1;p.ears[i].rotation.z=side*(.10+Math.sin(t*3+i)*.07);} for(let i=0;i<p.wings.length;i++){p.wings[i].rotation.y=Math.sin(t*10+i)*.48;} for(let i=0;i<p.tailParts.length;i++){p.tailParts[i].rotation.x=Math.sin(t*2.4+i)*.13;p.tailParts[i].rotation.z=Math.sin(t*1.8+i)*.12;} p.petRoot.position.y=Math.sin(t*2)*.018;}
  if(avatarRoot){
    avatarRoot.position.y=Math.sin(t*1.5)*.035;
    if(faceAction==="laugh"&&Date.now()<faceActionUntil){avatarRoot.position.y+=Math.abs(Math.sin(t*13))*.035;avatarRoot.rotation.z=Math.sin(t*12)*.018;}
    else avatarRoot.rotation.z=THREE.MathUtils.lerp(avatarRoot.rotation.z,0,.12);
    if(Date.now()<danceUntil){
      avatarRoot.rotation.y+=.025;avatarRoot.position.y+=Math.abs(Math.sin(t*9))*.075;
      leftArm.rotation.z=Math.sin(t*10)*.42-.28;rightArm.rotation.z=-Math.sin(t*10)*.42+.28;
    } else if(Date.now()<poseUntil){
      const p=Math.min(1,(poseUntil-Date.now())/450), wave=Math.sin(t*9)*.20;
      if(poseMode==="wave"){rightArm.rotation.z=-2.18+wave;leftArm.rotation.z=.08; }
      else if(poseMode==="princess"){rightArm.rotation.z=-.82;leftArm.rotation.z=.82; }
      else if(poseMode==="curtsy"){rightArm.rotation.z=-.55;leftArm.rotation.z=.55;avatarRoot.rotation.z=-.045*p;avatarRoot.position.y-=.09*p;}
      else if(poseMode==="blowkiss"){rightArm.rotation.z=-1.65+Math.sin(t*5)*.06;leftArm.rotation.z=.12; }
    } else {
      leftArm.rotation.z=THREE.MathUtils.lerp(leftArm.rotation.z,0,.09);
      rightArm.rotation.z=THREE.MathUtils.lerp(rightArm.rotation.z,0,.09);
     }
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
  readControls();document.body.className="theme-"+state.theme;buildAvatar();applyRealisticStyle();buildRealisticAccessories();scheduleSave();
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
    await setPersistence(auth,browserLocalPersistence);
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
function playPose(mode){
  poseMode=mode;poseUntil=Date.now()+(mode==="wave"?2600:mode==="curtsy"?2100:2400);
  if(realisticVisible&&realisticAction)realisticAction.reset().fadeIn(.2).play();
}
$("poseBtn").addEventListener("click",()=>{danceUntil=Date.now()+2600;if(realisticVisible&&realisticAction){realisticAction.reset().fadeIn(.2).play();}});
$("waveBtn").addEventListener("click",()=>playPose("wave"));
$("princessBtn").addEventListener("click",()=>playPose("princess"));
$("curtsyBtn").addEventListener("click",()=>playPose("curtsy"));
$("blowkissBtn").addEventListener("click",()=>{playPose("blowkiss");playFace("kiss");});
$("powerBtn").addEventListener("click",()=>{
  if(!avatarRoot||!powerBurstGroup)return;
  while(powerBurstGroup.children.length){
    const old=powerBurstGroup.children[0];powerBurstGroup.remove(old);
    old.geometry.dispose();old.material.dispose();
  }
  const colors={rose:["#ff9fc8","#f7c4df","#e8a9e8"],violet:["#b9a7f5","#d9c8ff","#eee5ff"],turquoise:["#8debdc","#b4fff0","#d5f4ee"],gold:["#ffe28a","#f7c86a","#fff0b5"],blue:["#9bcfff","#c6e7ff","#e0f4ff"]};
  const palette=colors[state.magicColor]||["#ffb9df","#e4d4ff","#fff0b5"];
  const power=state.magicPower||"petalBurst";
  let shape;
  if(power==="starPulse"){
    shape=new THREE.Shape();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2===0?.12:.052,x=Math.cos(a)*r,y=Math.sin(a)*r;i===0?shape.moveTo(x,y):shape.lineTo(x,y);}shape.closePath();
  }else if(power==="heartShield"){
    shape=new THREE.Shape();shape.moveTo(0,-.12);shape.bezierCurveTo(-.22,.02,-.16,.2,0,.1);shape.bezierCurveTo(.16,.2,.22,.02,0,-.12);
  }
  const count=power==="heartShield"?12:22;
  for(let i=0;i<count;i++){
    const angle=i*Math.PI*2/count+(Math.random()-.5)*.12;
    let geometry,scale;
    if(power==="petalBurst"){geometry=new THREE.SphereGeometry(1,12,10);scale=[.045,.105,.025];}
    else if(power==="starPulse"){geometry=new THREE.ShapeGeometry(shape);scale=[1,1,1];}
    else if(power==="heartShield"){geometry=new THREE.ShapeGeometry(shape);scale=[.72,.72,.72];}
    else if(power==="crystalWave"){geometry=new THREE.OctahedronGeometry(.095,0);scale=[1,1.35,.8];}
    else{geometry=new THREE.SphereGeometry(.045,12,10);scale=[1,1,1];}
    const color=palette[i%palette.length];
    const mat=material(color,.22,{emissive:color,emissiveIntensity:1.65,transparent:true,opacity:1,side:THREE.DoubleSide});
    const particle=addMesh(powerBurstGroup,geometry,mat,[0,1.22,.22],scale);
    particle.userData={angle,delay:(i%4)*.045,rise:.25+(i%5)*.13,spin:(i%2?1:-1)*(.5+(i%3)*.35),baseScale:particle.scale.clone()};
  }
  powerStarted=Date.now();powerBurstGroup.visible=true;
});
function playFace(action){
  faceAction=action;faceActionUntil=Date.now()+(action==="smile"?2600:action==="wink"?1100:action==="laugh"?2100:action==="surprise"?1800:1500);
  if(action==="kiss"&&avatarRoot)avatarRoot.rotation.y+=.08;
}
$("smileBtn").addEventListener("click",()=>playFace("smile"));
$("winkBtn").addEventListener("click",()=>playFace("wink"));
$("laughBtn").addEventListener("click",()=>playFace("laugh"));
$("kissBtn").addEventListener("click",()=>playFace("kiss"));
if($("surpriseBtn"))$("surpriseBtn").addEventListener("click",()=>playFace("surprise"));
$("realisticBtn").addEventListener("click",toggleRealisticCharacter);
$("resetViewBtn").addEventListener("click",()=>{if(avatarRoot)avatarRoot.rotation.y=0;if(camera){camera.position.set(0,1.55,7.2);camera.lookAt(0,1.45,0);}});
start();
