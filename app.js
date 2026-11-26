import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

/*
  ÉTAPE OBLIGATOIRE :
  1) Crée un projet Firebase sur https://console.firebase.google.com/
  2) Ajoute une application Web et copie sa configuration ci-dessous.
  3) Active Authentication > Sign-in method > Anonymous.
  4) Crée une base Firestore en mode production et publie firestore.rules.
*/
const firebaseConfig = {
    apiKey: "AIzaSyBBAqdZJGPVCdkNfouhC9lYH51yuYfaw3E",
    authDomain: "bubulle-blybly.firebaseapp.com",
    projectId: "bubulle-blybly",
    storageBucket: "bubulle-blybly.firebasestorage.app",
    messagingSenderId: "61199635297",
    appId: "1:61199635297:web:9c440eaa89b6a94d846b20"
  };

const stages = [
  {place:"Forêt des murmures",emoji:"🌲",question:"Quel animal est réputé pour hululer la nuit ?",answers:["Le hibou","Le lapin","Le papillon"],correct:0,hint:"Il possède de grands yeux et vit souvent dans les arbres.",reward:"💗 Cœur enchanté au nœud rose"},
  {place:"Village des champignons",emoji:"🍄",question:"Combien font 3 champignons + 2 champignons ?",answers:["4","5","7"],correct:1,hint:"Compte-les sur tes doigts !",reward:"🍄 Champignon magique"},
  {place:"Pont des énigmes",emoji:"🌉",question:"Je suis toujours devant toi, mais tu ne peux jamais me voir. Qui suis-je ?",answers:["Ton ombre","Le futur","Ton reflet"],correct:1,hint:"Je représente ce qui va arriver.",reward:"🔑 Clé enchantée"},
  {place:"Grotte des cristaux",emoji:"🔮",question:"Quelle pierre précieuse est traditionnellement violette ?",answers:["Le rubis","L'émeraude","L'améthyste"],correct:2,hint:"Son nom commence par A.",reward:"🔮 Cristal magique"},
  {place:"Château des Besties",emoji:"🏰",question:"Quel objet permet d'ouvrir une porte fermée à clé ?",answers:["Une couronne","Une clé","Une plume"],correct:1,hint:"Elle se glisse dans la serrure.",reward:"👑 Fragment de couronne"},

  {place:"Forêt des murmures",emoji:"🌲",chapter:"Chapitre 1 · La forêt des secrets",question:"Trois lanternes sont allumées. Le vent en éteint une. Combien restent allumées ?",answers:["Deux","Trois","Une"],correct:0,hint:"Une lanterne éteinte ne brille plus, mais elle est toujours là.",reward:"🕯️ Lanterne ancienne"},
  {place:"Sentier des empreintes",emoji:"🐾",chapter:"Chapitre 1 · La forêt des secrets",question:"Un animal laisse quatre empreintes à chaque pas. Après deux pas, combien d'empreintes vois-tu ?",answers:["4","6","8"],correct:2,hint:"Quatre empreintes par pas : fais 4 + 4.",reward:"🐾 Trace mystérieuse"},
  {place:"Arbre aux chiffres",emoji:"🌳",chapter:"Chapitre 1 · La forêt des secrets",question:"Trouve le nombre suivant : 2, 6, 12, 20, ...",answers:["28","30","32"],correct:1,hint:"Les écarts augmentent : +4, +6, +8…",reward:"🍃 Feuille runique"},
  {place:"Clairière des lucioles",emoji:"✨",chapter:"Chapitre 1 · La forêt des secrets",question:"Une luciole clignote toutes les 3 secondes, dès le départ. Combien de clignotements vois-tu en 12 secondes ?",answers:["3","4","5"],correct:2,hint:"Compte 0, 3, 6, 9 et 12 : le premier est au départ.",reward:"✨ Luciole dorée"},
  {place:"Bibliothèque secrète",emoji:"📚",chapter:"Chapitre 2 · Le château mystérieux",question:"Un livre est placé entre le tome 4 et le tome 6. Quel est son numéro ?",answers:["5","7","3"],correct:0,hint:"Il s'agit du nombre entier entre 4 et 6.",reward:"📖 Page enchantée"},
  {place:"Galerie des portraits",emoji:"🖼️",chapter:"Chapitre 2 · Le château mystérieux",question:"Léa est plus grande que Mia. Mia est plus grande que Zoé. Qui est la plus petite ?",answers:["Léa","Mia","Zoé"],correct:2,hint:"Range-les de la plus grande à la plus petite.",reward:"🪞 Éclat de miroir"},
  {place:"Escalier secret",emoji:"🗝️",chapter:"Chapitre 2 · Le château mystérieux",question:"Un code est formé de deux chiffres. Le premier est 3, le second vaut le double du premier. Quel est le code ?",answers:["36","33","39"],correct:0,hint:"Le double de 3 est 6.",reward:"🗝️ Clé du donjon"},
  {place:"Salle des horloges",emoji:"⏳",chapter:"Chapitre 2 · Le château mystérieux",question:"Une horloge avance de 15 minutes. Il est 14 h 50. Quelle heure indique-t-elle ?",answers:["15 h 05","14 h 65","15 h 15"],correct:0,hint:"Ajoute 10 minutes pour arriver à 15 h, puis encore 5.",reward:"⏰ Sablier royal"},
  {place:"Grotte des cristaux",emoji:"🔮",chapter:"Chapitre 3 · Les cristaux enchantés",question:"Quatre cristaux rouges valent chacun 2 points et trois bleus valent chacun 3 points. Quel est le total ?",answers:["14","17","18"],correct:1,hint:"Calcule 4 × 2, puis 3 × 3 et additionne.",reward:"💠 Cristal bicolore"},
  {place:"Pont de cristal",emoji:"🌉",chapter:"Chapitre 3 · Les cristaux enchantés",question:"Tu dépasses la personne qui est deuxième dans une course. À quelle place es-tu ?",answers:["Première","Deuxième","Troisième"],correct:1,hint:"Tu prends exactement la place de la personne dépassée.",reward:"🌈 Fragment d'arc-en-ciel"},
  {place:"Labyrinthe miroir",emoji:"🪞",chapter:"Chapitre 3 · Les cristaux enchantés",question:"Dans un miroir, ta main droite semble être de quel côté pour ton reflet ?",answers:["À sa droite","À sa gauche","En haut"],correct:1,hint:"Le miroir inverse l'impression de gauche et de droite.",reward:"🪞 Miroir magique"},
  {place:"Salle des potions",emoji:"🧪",chapter:"Chapitre 3 · Les cristaux enchantés",question:"Une potion nécessite 2 gouttes de lune pour 1 goutte d'étoile. Pour 3 gouttes d'étoile, combien faut-il de gouttes de lune ?",answers:["5","6","9"],correct:1,hint:"Double la quantité de gouttes d'étoile.",reward:"🧪 Potion scintillante"},
  {place:"Antichambre du trésor",emoji:"🚪",chapter:"Chapitre 4 · Le trésor des besties",question:"Le coffre est dans une pièce. La porte porte le symbole du soleil. Le soleil est associé à l'est. Quelle direction faut-il chercher ?",answers:["Est","Ouest","Nord"],correct:0,hint:"Le soleil se lève à l'est.",reward:"☀️ Sceau solaire"},
  {place:"Énigme des gardiennes",emoji:"🛡️",chapter:"Chapitre 4 · Le trésor des besties",question:"Deux gardiennes disent : « Le trésor n'est pas sous la table » et « Le trésor est dans le coffre ». Si la première phrase est vraie et la seconde aussi, où est le trésor ?",answers:["Sous la table","Dans le coffre","Dans la porte"],correct:1,hint:"Les deux affirmations sont vraies : suis la deuxième.",reward:"🛡️ Bouclier des besties"},
  {place:"Cadran des étoiles",emoji:"🌟",chapter:"Chapitre 4 · Le trésor des besties",question:"Le code suit cette règle : 1 → 3, 2 → 6, 3 → 9. Que vaut 5 ?",answers:["12","15","18"],correct:1,hint:"Chaque nombre est multiplié par 3.",reward:"🌟 Étoile de victoire"},
  {place:"Coffre des besties",emoji:"🎁",chapter:"Chapitre 4 · Le trésor des besties",question:"Pour ouvrir le coffre, il faut le plus petit nombre à trois chiffres dont la somme des chiffres vaut 3. Quel est-il ?",answers:["102","111","300"],correct:0,hint:"Commence par 1 aux centaines, puis cherche la plus petite dizaine possible.",reward:"💖 Cadeau secret pour Blybly"}

];
const $ = id => document.getElementById(id);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let user, roomId, roomRef, unsubscribe, myRole, roomData;

const inviteCode = () => crypto.randomUUID().replaceAll("-","").slice(0,18).toUpperCase();
const roomFromUrl = new URLSearchParams(location.search).get("room");
const say = (id,msg) => $(id).textContent = msg;
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");


/* Lecture locale : le fichier choisi reste sur l'appareil et n'est pas téléversé. */
const songAudio = $("bestiesSong");
const songButton = $("songToggleBtn");
const songStatus = $("songStatus");
const songChooseButton = $("songChooseBtn");
const songFileInput = $("songFileInput");
let localSongUrl = null;
if (songAudio && songButton && songChooseButton && songFileInput) {
  songChooseButton.addEventListener("click", () => songFileInput.click());
  songFileInput.addEventListener("change", () => {
    const file = songFileInput.files && songFileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      songStatus.textContent = "Choisis un fichier audio, de préférence au format MP3.";
      return;
    }
    if (localSongUrl) URL.revokeObjectURL(localSongUrl);
    localSongUrl = URL.createObjectURL(file);
    songAudio.src = localSongUrl;
    songAudio.load();
    songButton.disabled = true;
    songButton.textContent = "⏳ Préparation de la chanson…";
    songStatus.textContent = "« " + file.name + " » est sélectionné sur cet appareil.";
  });
  songAudio.addEventListener("canplay", () => {
    songButton.disabled = false;
    songButton.textContent = "▶️ Écouter notre chanson";
    songStatus.textContent = "Votre chanson est prête 💗";
  });
  songAudio.addEventListener("error", () => {
    if (!songAudio.src) return;
    songButton.disabled = true;
    songButton.textContent = "💗 Choisis d’abord le MP3";
    songStatus.textContent = "Impossible de lire ce fichier. Essaie de sélectionner à nouveau le MP3.";
  });
  songButton.addEventListener("click", async () => {
    if (songAudio.paused) {
      try {
        await songAudio.play();
        songButton.textContent = "⏸ Mettre en pause";
        songStatus.textContent = "Votre chanson accompagne l’aventure 💗";
      } catch {
        songStatus.textContent = "La lecture n’a pas pu démarrer. Réessaie.";
      }
    } else {
      songAudio.pause();
      songButton.textContent = "▶️ Reprendre la chanson";
      songStatus.textContent = "Musique en pause";
    }
  });
  songAudio.addEventListener("ended", () => {
    songButton.textContent = "▶️ Réécouter la chanson";
    songStatus.textContent = "À vous de rejouer 💗";
  });
}
async function boot(){
  if(firebaseConfig.apiKey.startsWith("REMPLACER")) {
    say("welcomeMessage","Le site est prêt à configurer : ajoute d'abord les clés Firebase dans app.js (guide fourni).");
    $("createBtn").disabled = true; $("joinBtn").disabled = true; return;
  }
  try { await setPersistence(auth, browserLocalPersistence); const cred = await signInAnonymously(auth); user = cred.user; say("syncStatus","● Connecté"); 
    if(roomFromUrl) { $("inviteInput").value = roomFromUrl; await joinRoom(roomFromUrl); }
  } catch(e) { say("welcomeMessage","Connexion impossible : "+friendlyError(e)); }
}
function friendlyError(e){ console.error(e); return e.code==="auth/operation-not-allowed"?"Active la connexion anonyme dans Firebase.":e.message||"vérifie la configuration Firebase."; }

async function createRoom(){
  if(!user) return;
  const code=inviteCode(); roomId=code; myRole="BUBULLE"; roomRef=doc(db,"rooms",roomId);
  const data={createdAt:serverTimestamp(),players:{
    BUBULLE:{uid:user.uid,score:0,stage:0,completed:[],joined:true},
    BLYBLY:{uid:null,score:0,stage:0,completed:[],joined:false}
  }};
  try { await setDoc(roomRef,data); history.replaceState({}, "", "?room="+code); enterGame(); listen(); }
  catch(e){say("welcomeMessage","Impossible de créer la partie : "+friendlyError(e));}
}
async function joinRoom(code){
  if(!user || !code) {say("welcomeMessage","Entre un code d'invitation valide.");return;}
  roomId=code.trim().toUpperCase(); roomRef=doc(db,"rooms",roomId);
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(roomRef); if(!snap.exists()) throw new Error("Cette invitation est introuvable ou expirée.");
      const data=snap.data();
      if(data.players.BUBULLE.uid===user.uid){myRole="BUBULLE";return;}
      if(data.players.BLYBLY.uid===user.uid){myRole="BLYBLY";return;}
      if(data.players.BLYBLY.joined && data.players.BLYBLY.uid!==user.uid) {
        const takeover = window.confirm("Le profil Blybly est déjà associé à un autre appareil. Pour les tests, veux-tu connecter cette tablette au profil Blybly ?\n\nSes points et sa progression seront conservés. L'autre appareil ne doit pas jouer en même temps.");
        if(!takeover) throw new Error("Connexion annulée. Le profil Blybly reste sur son appareil actuel.");
      }
      myRole="BLYBLY";
      tx.update(roomRef,{"players.BLYBLY.uid":user.uid,"players.BLYBLY.joined":true});
    });
    history.replaceState({}, "", "?room="+roomId); enterGame(); listen();
  }catch(e){say("welcomeMessage",friendlyError(e));}
}
function enterGame(){hide("welcome");hide("connection");show("game");}
function listen(){
  if(unsubscribe) unsubscribe();
  unsubscribe=onSnapshot(roomRef,snap=>{
    if(!snap.exists()) return;
    roomData=snap.data(); render();
    say("syncStatus","● Partie synchronisée");
  },e=>say("syncStatus","● Erreur de synchronisation"));
}

function drawLivingMapRoute(){
  const map=$("map");
  if(!map)return;
  map.querySelector(".map-route-svg")?.remove();
  const stops=[...map.querySelectorAll(".map-stop")];
  if(stops.length<2)return;
  const bounds=map.getBoundingClientRect();
  const width=map.clientWidth,height=map.clientHeight;
  if(!width||!height)return;
  const points=stops.map(stop=>{
    const r=stop.getBoundingClientRect();
    return {x:r.left-bounds.left+r.width/2,y:r.top-bounds.top+r.height/2};
  });
  let d="M "+points[0].x+" "+points[0].y;
  for(let i=1;i<points.length;i++){
    const prev=points[i-1],cur=points[i];
    const midX=(prev.x+cur.x)/2,midY=(prev.y+cur.y)/2;
    d+=i===1?" L "+midX+" "+midY:" Q "+prev.x+" "+prev.y+" "+midX+" "+midY;
  }
  const last=points[points.length-1];
  d+=" L "+last.x+" "+last.y;
  const ns="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(ns,"svg");
  svg.setAttribute("class","map-route-svg");
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio","none");
  svg.setAttribute("aria-hidden","true");
  const glow=document.createElementNS(ns,"path");
  glow.setAttribute("d",d);glow.setAttribute("class","map-route-glow");
  const base=document.createElementNS(ns,"path");
  base.setAttribute("d",d);base.setAttribute("class","map-route-base");
  const progress=document.createElementNS(ns,"path");
  progress.setAttribute("d",d);progress.setAttribute("class","map-route-progress");
  svg.append(glow,base,progress);
  map.insertBefore(svg,map.firstChild);
  const total=progress.getTotalLength();
  const mine=roomData?.players?.[myRole];
  let contiguous=0;
  while(mine?.completed?.includes(contiguous))contiguous++;
  progress.style.strokeDasharray=total+" "+total;
  progress.style.strokeDashoffset=String(total-total*(contiguous/Math.max(1,stops.length-1)));
  const marker=document.createElementNS(ns,"circle");
  const currentIndex=Math.min(mine?.stage??0,points.length-1);
  marker.setAttribute("cx",points[currentIndex].x);
  marker.setAttribute("cy",points[currentIndex].y);
  marker.setAttribute("r","3.2");
  marker.setAttribute("class","map-route-marker");
  svg.appendChild(marker);
}
window.addEventListener("resize",()=>drawLivingMapRoute());


const gardenBeds = [
  {title:"Les premiers pas",subtitle:"La graine de votre complicité",start:0,end:4,flower:"🌷",name:"Tulipe de l’amitié"},
  {title:"La forêt des secrets",subtitle:"La douceur prend racine",start:5,end:8,flower:"🌻",name:"Tournesol de lumière"},
  {title:"Le château mystérieux",subtitle:"Les souvenirs s’épanouissent",start:9,end:12,flower:"🌹",name:"Rose des souvenirs"},
  {title:"Les cristaux enchantés",subtitle:"La magie fleurit",start:13,end:16,flower:"🌼",name:"Marguerite enchantée"},
  {title:"Le trésor des Besties",subtitle:"Votre belle légende",start:17,end:20,flower:"🌸",name:"Fleur du cœur"}
];
function buildAdventureEvents(beforePlayers,afterPlayers,role,stageIndex){
  const now=Date.now();
  const roleName=role==="BUBULLE"?"Bubulle":"Blybly";
  const events=[{type:"riddle",icon:role==="BUBULLE"?"🧭":"🌷",title:roleName+" a résolu une énigme",detail:"Épreuve "+(stageIndex+1)+" · "+stages[stageIndex].place,at:now}];
  const beforeBub=new Set(beforePlayers.BUBULLE.completed||[]),beforeBly=new Set(beforePlayers.BLYBLY.completed||[]);
  const afterBub=new Set(afterPlayers.BUBULLE.completed||[]),afterBly=new Set(afterPlayers.BLYBLY.completed||[]);
  if(!(beforeBub.has(stageIndex)&&beforeBly.has(stageIndex))&&afterBub.has(stageIndex)&&afterBly.has(stageIndex))
    events.push({type:"shared",icon:"💗",title:"Une énigme réussie à deux",detail:"Vous avez découvert ensemble : "+stages[stageIndex].place,at:now+1});
  gardenBeds.forEach(bed=>{
    const ids=Array.from({length:bed.end-bed.start+1},(_,n)=>bed.start+n);
    const was=ids.every(i=>beforeBub.has(i)&&beforeBly.has(i)),is=ids.every(i=>afterBub.has(i)&&afterBly.has(i));
    if(!was&&is)events.push({type:"flower",icon:bed.flower,title:bed.name+" a éclos",detail:"Vous avez terminé « "+bed.title+" » toutes les deux.",at:now+2});
  });
  const wasLegend=stages.every((stage,i)=>beforeBub.has(i)&&beforeBly.has(i));
  const isLegend=stages.every((stage,i)=>afterBub.has(i)&&afterBly.has(i));
  if(!wasLegend&&isLegend)events.push({type:"crown",icon:"👑",title:"La légende des Besties est complète",detail:"Les 21 énigmes ont été résolues par Bubulle et Blybly.",at:now+3});
  return events;
}

function renderBestiesGarden(players){
  const garden=$("bestiesGarden");
  if(!garden||!players)return;
  const bubulle=new Set(players.BUBULLE.completed||[]);
  const blybly=new Set(players.BLYBLY.completed||[]);
  let bloomed=0;
  garden.innerHTML=gardenBeds.map((bed,index)=>{
    const shared=Array.from({length:bed.end-bed.start+1},(_,n)=>bed.start+n)
      .every(stageIndex=>bubulle.has(stageIndex)&&blybly.has(stageIndex));
    if(shared)bloomed++;
    return `<article class="garden-flowerbed ${shared?"bloomed":"waiting"}" aria-label="${bed.title} : ${shared?"fleur éclose":"fleur en bouton, à débloquer"}">
      <div class="garden-plant" aria-hidden="true"><span class="garden-stem"></span><span class="garden-leaves">❧</span><span class="garden-blossom">${shared?bed.flower:"✿"}</span><span class="garden-glow"></span></div>
      <div class="garden-bed-copy"><b>${bed.title}</b><small>${shared?bed.name:bed.subtitle}</small><em>${shared?"✦ Fleur éclose":"🔒 À faire éclore à deux"}</em></div>
    </article>`;
  }).join("");
  $("gardenProgress").textContent=bloomed+" / "+gardenBeds.length;
  $("gardenMessage").textContent=bloomed===5
    ?"Votre jardin est en pleine floraison… tout comme votre belle complicité. 👑💗"
    :bloomed===0
      ?"Votre jardin attend vos premières victoires partagées… 💗"
      :bloomed+" jolie"+(bloomed>1?"s fleurs":" fleur")+" a"+(bloomed>1?"nt":"")+" déjà éclos grâce à vous deux. Continuez à faire grandir votre jardin ! ✨";
}

function render(){
  const p=roomData.players;
  if(!$("kingdomsModal").classList.contains("hidden")) renderKingdoms();
  // Chaque appareil affiche uniquement le profil de la joueuse connectée.
  $("bubulleCard").style.display = myRole === "BUBULLE" ? "" : "none";
  $("blyblyCard").style.display = myRole === "BLYBLY" ? "" : "none";
  $("bubulleScore").textContent=p.BUBULLE.score+" pts";
  $("blyblyScore").textContent=p.BLYBLY.score+" pts";
  $("bubulleStatus").textContent=p.BUBULLE.joined?"Dans l'aventure":"En attente";
  $("blyblyStatus").textContent=p.BLYBLY.joined?"Dans l'aventure":"En attente";
  $("bubulleCard").classList.toggle("active",myRole==="BUBULLE");
  $("blyblyCard").classList.toggle("active",myRole==="BLYBLY");
  const mine=p[myRole], stage=Math.min(mine.stage,stages.length-1), s=stages[stage];
  // Le décor suit le chapitre actuellement découvert par le joueur.
  const realm=stage>=17?"treasure":stage>=13?"crystals":stage>=9?"castle":"forest";
  document.body.classList.remove("realm-forest","realm-castle","realm-crystals","realm-treasure");
  document.body.classList.add("realm-"+realm);
  $("stageLabel").textContent=`${s.chapter || "Premiers pas"} · ÉPREUVE ${stage+1} / ${stages.length}`;
  $("stagePlace").textContent=s.emoji+" "+s.place.toUpperCase();
  $("question").textContent=s.question;
  $("answers").innerHTML="";
  s.answers.forEach((a,i)=>{
    const b=document.createElement("button");b.className="answer";b.textContent=a;
    b.disabled=mine.completed.includes(stage);
    if(mine.completed.includes(stage) && i===s.correct)b.classList.add("correct");
    b.addEventListener("click",()=>answer(i,stage,b));$("answers").appendChild(b);
  });
  $("hint").classList.add("hidden"); $("gameMessage").textContent=mine.completed.includes(stage)?"Épreuve validée ! Ton trésor est dans ta collection.":"À toi de jouer !";
  $("nextBtn").classList.toggle("hidden",!mine.completed.includes(stage)||stage===stages.length-1);
  $("hintBtn").classList.toggle("hidden",mine.completed.includes(stage));
  $("map").innerHTML="";
  $("map").setAttribute("aria-label","Chemin du royaume : "+mine.completed.length+" énigmes validées sur "+stages.length);
  const mapStatus=$("mapJourneyStatus");
  if(mapStatus) mapStatus.textContent=mine.completed.length+" / "+stages.length+" trésors";
  stages.forEach((x,i)=>{
    const done=mine.completed.includes(i), current=i===stage, locked=!done&&!current;
    const el=document.createElement("div");
    el.className="map-stop"+(done?" done":"")+(current?" current":"")+(locked?" locked":"");
    const row=Math.floor(i/5), position=i%5;
    el.style.setProperty("--map-row",String(row+1));
    el.style.setProperty("--map-column",String(row%2===0?position+1:5-position));
    el.setAttribute("aria-label",done?"Énigme "+(i+1)+" validée : "+x.place:current?"Prochaine étape : "+x.place:"Énigme "+(i+1)+", secret à découvrir");
    el.innerHTML=done
      ? `<span class="map-number">${i+1}</span><span class="emoji">${x.emoji}</span><small>${x.place}</small><span class="map-state">✓ Trésor trouvé</span>`
      : current
        ? `<span class="map-number">${i+1}</span><span class="emoji">${x.emoji}</span><small>${x.place}</small><span class="map-state">✦ À toi !</span>`
        : `<span class="map-number">${i+1}</span><span class="emoji">✧</span><small>Secret à découvrir</small><span class="map-state">🔒</span>`;
    $("map").appendChild(el);
  });
  drawLivingMapRoute();
  renderBestiesGarden(p);
  const treasures=mine.completed.map(i=>`<div class="treasure-item">${stages[i].reward}</div>`).join("");
  $("treasures").innerHTML=treasures||'<p class="muted">Tes trésors apparaîtront ici…</p>';
  if(mine.stage>=stages.length) openFinale(false);
  // Si l’album est ouvert, actualiser ses deux profils à chaque nouvelle synchro Firebase.
  if(!$("albumModal").classList.contains("hidden")) openAlbum();
}

let activeReward = null;
const rewardStyle = "parchment";
const surpriseMessages = [
  "Une étoile vient de choisir ta lumière. Continue de briller ! ✨",
  "Le royaume te réserve encore de jolies merveilles… 🌷",
  "Un petit sortilège de chance vient de se poser sur ton chemin. 🍀",
  "Ton courage fait scintiller toute la forêt enchantée. 💗",
  "Un trésor se gagne avec l’esprit… et se garde avec le cœur. 🎀",
  "Les lucioles applaudissent ta belle victoire ! ✨",
  "Un papillon magique t’apporte une pensée toute douce. 🦋",
  "Chaque énigme révèle un peu plus ta magie. 🔮"
];
const milestoneMessages = {
  5: "Premier grand cap franchi ! La forêt entière célèbre ta persévérance. 🌟",
  10: "Dix trésors déjà ! Le château ouvre un nouveau passage secret. 🏰",
  15: "Tu approches du grand secret… Les étoiles sont de ton côté. 💫",
  21: "Le trésor légendaire est à portée de main : quelle belle aventure ! 👑"
};

let finalePreview = false;
function replayFinaleAnimation(){
  const chest=$("modal").querySelector(".finale-chest");
  if(!chest) return;
  chest.classList.remove("opening");
  void chest.offsetWidth;
  chest.classList.add("opening");
}
function openFinale(preview=false){
  finalePreview=preview;
  $("finalePreviewNote").classList.toggle("hidden",!preview);
  $("modal").classList.remove("hidden");
  replayFinaleAnimation();
}

$("finaleReplayBtn").addEventListener("click",replayFinaleAnimation);
$("finaleCelebrateBtn").addEventListener("click",()=>{$("modal").classList.add("hidden");});
const albumGroups = [
  {title:"Les premiers pas",subtitle:"Les cinq premières découvertes",start:0,end:4},
  {title:"Chapitre 1 · La forêt des secrets",subtitle:"Là où la magie commence",start:5,end:8},
  {title:"Chapitre 2 · Le château mystérieux",subtitle:"Les secrets derrière les portes",start:9,end:12},
  {title:"Chapitre 3 · Les cristaux enchantés",subtitle:"Quatre éclats à réunir",start:13,end:16},
  {title:"Chapitre 4 · Le trésor des besties",subtitle:"Le dernier chemin vers la couronne",start:17,end:20}
];
function openAlbum(){
  if(!roomData) return;
  const players=roomData.players;
  $("albumProgress").innerHTML=[
    {key:"BUBULLE",name:"Bubulle",portrait:"./assets/bubulle.jpg"},
    {key:"BLYBLY",name:"Blybly",portrait:"./assets/blybly.jpg?v=20261126-blybly-princess"}
  ].map(player=>{
    const data=players[player.key];
    const count=(data.completed||[]).length;
    return `<article class="album-stat"><img class="album-stat-portrait" src="${player.portrait}" alt="Portrait de ${player.name}"><div><b>${player.name}</b><strong>${count} <small>/ 21</small></strong><em>${data.score||0} points</em></div><div class="album-progress-track"><i style="width:${Math.min(100,count/21*100)}%"></i></div></article>`;
  }).join("");
  const bubulleDone=new Set(players.BUBULLE.completed||[]);
  const blyblyDone=new Set(players.BLYBLY.completed||[]);
  const sharedCount=[...bubulleDone].filter(index=>blyblyDone.has(index)).length;
  const discoveredCount=new Set([...bubulleDone,...blyblyDone]).size;
  const soloCount=discoveredCount-sharedCount;
  const waitingCount=stages.length-discoveredCount;
  $("albumDuoSummary").innerHTML=[
    {symbol:"✦",value:sharedCount,label:"Énigmes partagées"},
    {symbol:"♡",value:discoveredCount,label:"Trésors découverts"},
    {symbol:"✧",value:soloCount,label:"Défis en solo"},
    {symbol:"◇",value:waitingCount,label:"Secrets à découvrir"}
  ].map(item=>`<article class="album-duo-stat"><span>${item.symbol}</span><strong>${item.value}</strong><small>${item.label}</small></article>`).join("");
  $("albumDuoPhrase").textContent=discoveredCount===21
    ?"Les 21 secrets ont été révélés : votre légende est complète !"
    :sharedCount>0
      ? "Chaque énigme partagée ajoute une nouvelle page à votre belle histoire."
      : "Votre album attend ses premiers souvenirs : l’aventure ne fait que commencer.";
  const officialChapters=albumGroups.slice(1);
  const memoryCards=officialChapters.map((group,index)=>{
    const complete=Array.from({length:group.end-group.start+1},(_,offset)=>group.start+offset)
      .every(stageIndex=>bubulleDone.has(stageIndex)&&blyblyDone.has(stageIndex));
    const flowers=["🌸","🌷","🌼","🌺"];
    return {icon:flowers[index],title:group.title.replace(/^Chapitre \d+ · /,""),detail:complete?"Souvenir révélé à deux":"À révéler en terminant ce chapitre ensemble",unlocked:complete,kind:"flower"};
  });
  memoryCards.push({icon:"💗",title:"Le cœur des Besties",detail:sharedCount>0?sharedCount+" énigme(s) réussie(s) ensemble":"À débloquer avec votre première énigme commune",unlocked:sharedCount>0,kind:"heart",count:sharedCount});
  const crownUnlocked=stages.every((stage,index)=>bubulleDone.has(index)&&blyblyDone.has(index));
  memoryCards.push({icon:"👑",title:"La couronne légendaire",detail:crownUnlocked?"Les 21 énigmes terminées par vous deux !":"Le trésor ultime : les 21 énigmes terminées à deux",unlocked:crownUnlocked,kind:"crown"});
  $("albumMemories").innerHTML=memoryCards.map(memory=>`<article class="album-memory ${memory.unlocked?"unlocked":"locked"} ${memory.kind}">
    <div class="album-memory-icon">${memory.icon}</div><div class="album-memory-copy"><b>${memory.title}</b><small>${memory.detail}</small></div>
    <span class="album-memory-state">${memory.unlocked?"Souvenir débloqué":"À découvrir"}</span>
    ${memory.kind==="heart"&&memory.unlocked?`<span class="album-heart-count">${memory.count} ♥</span>`:""}
  </article>`).join("");
  const adventureLog=[...(roomData.adventureLog||[])].sort((a,b)=>(b.at||0)-(a.at||0));
  const illustrationMilestones=[
    {key:"flower",icon:"🌷",title:"Le jardin s'éveille",detail:"Vos chapitres terminés font fleurir le royaume.",unlocked:officialChapters.some((group,index)=>Array.from({length:group.end-group.start+1},(_,n)=>group.start+n).every(i=>bubulleDone.has(i)&&blyblyDone.has(i))),art:"flower"},
    {key:"heart",icon:"♡",title:"Le cœur des Besties",detail:"Chaque énigme partagée rapproche vos deux chemins.",unlocked:sharedCount>0,art:"heart"},
    {key:"castle",icon:"🏰",title:"Les portes du château",detail:"Les secrets du royaume se dévoilent chapitre après chapitre.",unlocked:officialChapters.slice(0,2).every(group=>Array.from({length:group.end-group.start+1},(_,n)=>group.start+n).every(i=>bubulleDone.has(i)&&blyblyDone.has(i))),art:"castle"},
    {key:"crown",icon:"👑",title:"La couronne légendaire",detail:"Le grand trésor apparaît lorsque les 21 énigmes sont terminées à deux.",unlocked:crownUnlocked,art:"crown"}
  ];
  const illustrationSvg={
    flower:'<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M60 54 Q57 76 61 94" fill="none" stroke="#57966d" stroke-width="5" stroke-linecap="round"/><path d="M59 77 Q35 60 32 79 Q45 91 59 77 M62 84 Q82 62 91 79 Q78 94 62 84" fill="#91c99b"/><g fill="#f39bc9" stroke="#fff0f8" stroke-width="2"><ellipse cx="60" cy="26" rx="12" ry="22"/><ellipse cx="60" cy="26" rx="12" ry="22" transform="rotate(72 60 38)"/><ellipse cx="60" cy="26" rx="12" ry="22" transform="rotate(144 60 38)"/><ellipse cx="60" cy="26" rx="12" ry="22" transform="rotate(216 60 38)"/><ellipse cx="60" cy="26" rx="12" ry="22" transform="rotate(288 60 38)"/></g><circle cx="60" cy="38" r="9" fill="#f7d58b"/></svg>',
    heart:'<svg viewBox="0 0 120 100" aria-hidden="true"><defs><linearGradient id="illHeart" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd9ef"/><stop offset="1" stop-color="#d45b9e"/></linearGradient></defs><path d="M60 84 C46 71 17 52 17 31 C17 8 47 3 60 26 C73 3 103 8 103 31 C103 52 74 71 60 84Z" fill="url(#illHeart)" stroke="#fff6fb" stroke-width="4"/><path d="M34 27 Q41 14 53 27" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="M60 85 Q49 95 38 91 M60 85 Q72 95 83 91" fill="none" stroke="#d4a0c6" stroke-width="2"/></svg>',
    castle:'<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M19 88 V42 H40 V88 M80 88 V42 H101 V88 M39 88 V54 H81 V88" fill="#c7a7d8" stroke="#fff0fa" stroke-width="3"/><path d="M14 43 L29 12 L45 43Z M75 43 L91 12 L106 43Z M47 55 L60 28 L73 55Z" fill="#e98fc1" stroke="#fff0fa" stroke-width="3"/><path d="M52 88 V72 Q60 58 68 72 V88" fill="#6b4b78"/><path d="M29 51 V63 M91 51 V63 M60 60 V69" stroke="#ffe6a5" stroke-width="5" stroke-linecap="round"/><path d="M60 15 V5 M55 10 H65" stroke="#f7d58b" stroke-width="3" stroke-linecap="round"/></svg>',
    crown:'<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M15 30 L37 52 L52 13 L68 52 L88 13 L94 53 L108 30 L99 83 Q60 96 21 83Z" fill="#e8bc5e" stroke="#fff2c2" stroke-width="4" stroke-linejoin="round"/><path d="M22 72 Q60 84 101 72 L99 86 Q60 99 21 86Z" fill="#b87b3c"/><circle cx="15" cy="30" r="7" fill="#ef9bc8"/><circle cx="52" cy="13" r="7" fill="#ef9bc8"/><circle cx="88" cy="13" r="7" fill="#ef9bc8"/><circle cx="108" cy="30" r="6" fill="#ef9bc8"/><path d="M48 63 Q60 55 72 63" fill="none" stroke="#fff6d9" stroke-width="3" stroke-linecap="round"/></svg>'
  };
  $("albumIllustrations").innerHTML=illustrationMilestones.map(item=>`<article class="album-illustration-card ${item.unlocked?"revealed":"sealed"}"><div class="album-illustration-art">${illustrationSvg[item.art]}</div><b>${item.title}</b><p>${item.unlocked?item.detail:"Cette illustration se révélera au fil de votre aventure."}</p><small>${item.unlocked?"✦ Souvenir révélé":"◇ Encore un secret"}</small></article>`).join("");
  $("albumTimeline").innerHTML=adventureLog.length
    ? adventureLog.map(event=>{
        const date=event.at?new Date(event.at).toLocaleString("fr-FR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Souvenir";
        return `<article class="album-timeline-entry"><span class="album-timeline-icon">${event.icon||"✦"}</span><div><b>${event.title}</b><p>${event.detail}</p><time>${date}</time></div></article>`;
      }).join("")
    : '<p class="album-timeline-empty">Votre chronique commence ici… La prochaine énigme résolue écrira sa première page. 💗</p>';
  $("albumChapters").innerHTML=albumGroups.map(group=>{
    const groupStages=stages.slice(group.start,group.end+1);
    const doneCount=groupStages.filter((stage,offset)=>bubulleDone.has(group.start+offset)||blyblyDone.has(group.start+offset)).length;
    const items=groupStages.map((stage,offset)=>{
      const index=group.start+offset;
      const bubulle=bubulleDone.has(index);
      const blybly=blyblyDone.has(index);
      const status=bubulle&&blybly?"Validée à deux":bubulle?"Validée par Bubulle":blybly?"Validée par Blybly":"À découvrir";
      const mark=bubulle&&blybly?"✦":bubulle||blybly?"✧":"◇";
      return `<li class="${bubulle&&blybly?"both-done":bubulle||blybly?"one-done":""}"><span class="album-check">${mark}</span><span>${stage.place}</span><small>${status}</small></li>`;
    }).join("");
    return `<section class="album-chapter"><header><div><h3>${group.title}</h3><p>${group.subtitle}</p></div><span>${doneCount}/${groupStages.length} découvertes</span></header><div class="album-chapter-track"><i style="width:${doneCount/groupStages.length*100}%"></i></div><ol>${items}</ol></section>`;
  }).join("");
  const album=$("albumModal");
  if(!album.querySelector(".album-living-sky")){
    const sky=document.createElement("div");
    sky.className="album-living-sky";
    sky.innerHTML=Array.from({length:30},(_,i)=>{
      const style=`--x:${(i*37+11)%96}%;--y:${(i*23+7)%94}%;--delay:-${(i%9)*.7}s;--duration:${5+(i%7)}s`;
      return i%4===0
        ? `<button type="button" class="album-firefly firefly-${i%6} album-secret-firefly" style="${style}" data-secret-firefly aria-label="Découvrir un message secret"></button>`
        : `<i class="album-firefly firefly-${i%6}" style="${style}" aria-hidden="true"></i>`;
    }).join("")+
      '<span class="album-orbit-glow" aria-hidden="true"></span><span class="album-floating-petal petal-one" aria-hidden="true">✿</span><span class="album-floating-petal petal-two" aria-hidden="true">✧</span><span class="album-floating-petal petal-three" aria-hidden="true">✿</span><button type="button" class="album-hidden-chest chest-one" data-secret-chest="0" aria-label="Ouvrir le coffre rose">🎁</button><button type="button" class="album-hidden-chest chest-two" data-secret-chest="1" aria-label="Ouvrir le coffre doré">🧰</button><button type="button" class="album-hidden-chest chest-three" data-secret-chest="2" aria-label="Ouvrir le coffre violet">🎁</button>';
    album.prepend(sky);
    const secretNote=document.createElement("div");
    secretNote.className="album-secret-note";
    secretNote.setAttribute("role","status");
    secretNote.setAttribute("aria-live","polite");
    album.append(secretNote);
  }
  album.classList.remove("is-opening");
  album.classList.remove("hidden");
  void album.offsetWidth;
  album.classList.add("is-opening");
  window.setTimeout(()=>album.classList.remove("is-opening"),3600);
}
function renderKingdoms(){
  if(!roomData?.players)return;
  const profiles=[
    {key:"BUBULLE",name:"Bubulle",portrait:"./assets/bubulle.jpg",realm:"Le royaume des lucioles",accent:"rose",symbol:"🌷"},
    {key:"BLYBLY",name:"Blybly",portrait:"./assets/blybly.jpg?v=20261126-blybly-princess",realm:"Le château des fleurs",accent:"lilac",symbol:"🦋"}
  ];
  $("kingdomProfiles").innerHTML=profiles.map(profile=>{
    const data=roomData.players[profile.key]||{};
    const completed=[...new Set((data.completed||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<stages.length))].sort((x,y)=>x-y);
    const count=completed.length;
    const score=Number(data.score)||0;
    const percent=Math.round(count/stages.length*100);
    const next=data.stage>=stages.length?"Toutes les épreuves sont terminées !":"Prochaine épreuve : "+(Math.max(0,Number(data.stage)||0)+1)+" / "+stages.length;
    const milestones=[
      {at:5,label:"🌱 Première floraison"},
      {at:10,label:"🏰 Gardienne du château"},
      {at:15,label:"💎 Maîtresse des cristaux"},
      {at:21,label:"👑 Légende des Besties"}
    ];
    const earned=milestones.filter(m=>count>=m.at);
    const treasures=completed.length
      ?completed.map(i=>'<li><span>'+stages[i].emoji+'</span><span>'+stages[i].reward+'</span><small>Énigme '+(i+1)+'</small></li>').join("")
      :'<li class="kingdom-empty">Les premiers trésors attendent leur gardienne… ✨</li>';
    return `<article class="kingdom-profile ${profile.accent}">
      <div class="kingdom-profile-top">
        <img src="${profile.portrait}" alt="Portrait de ${profile.name}">
        <div><span class="kingdom-role">${profile.symbol} GARDIENNE DU ROYAUME</span><h3>${profile.name}</h3><p>${profile.realm}</p></div>
      </div>
      <div class="kingdom-scoreline"><strong>${score}</strong><span>points gagnés</span><b>${count} / 21</b></div>
      <div class="kingdom-progress"><i style="width:${percent}%"></i></div>
      <p class="kingdom-next">${next}</p>
      <div class="kingdom-achievements"><b>Ses distinctions</b><div>${earned.length?earned.map(m=>'<span>'+m.label+'</span>').join(""):'<small>Les premiers badges se dévoileront au fil des victoires.</small>'}</div></div>
      <div class="kingdom-treasures"><b>Sa collection de trésors <small>(${count})</small></b><ul>${treasures}</ul></div>
      <p class="kingdom-presence">${data.joined?"✦ Présente dans l’aventure":"✧ Attend de rejoindre le royaume"}</p>
    </article>`;
  }).join("");
}
$("kingdomsOpenBtn").addEventListener("click",()=>{
  renderKingdoms();
  $("kingdomsModal").classList.remove("hidden");
});
$("kingdomsCloseBtn").addEventListener("click",()=>hide("kingdomsModal"));
$("kingdomsModal").addEventListener("click",event=>{
  if(event.target.id==="kingdomsModal")hide("kingdomsModal");
});
$("albumOpenBtn").addEventListener("click",openAlbum);
$("albumCloseBtn").addEventListener("click",()=>hide("albumModal"));
$("albumModal").addEventListener("click",event=>{if(event.target.id==="albumModal")hide("albumModal");});
const albumSecretMessages=[
  "Même les plus petites lumières peuvent illuminer une grande histoire. ✨",
  "Un souvenir partagé devient un trésor que le temps ne peut faner. 🌷",
  "Dans cette forêt, chaque éclat de lumière porte un peu de votre magie. 💗",
  "Deux chemins, deux princesses… et mille aventures à écrire. 👑",
  "La plus belle magie est celle qui grandit quand on la partage. 🦋",
  "Une fleur, un sourire, un souvenir : le royaume s’éveille. 🌸",
  "Les lucioles gardent vos secrets avec douceur. 🤫",
  "Votre histoire n’a pas besoin d’être parfaite pour être précieuse. 💞"
];
let albumSecretIndex=0;
$("albumModal").addEventListener("click",event=>{
  const chest=event.target.closest("[data-secret-chest]");
  const firefly=event.target.closest("[data-secret-firefly]");
  if(!chest&&!firefly)return;
  const note=$("albumModal").querySelector(".album-secret-note");
  if(!note)return;
  if(chest){
    if(chest.dataset.opened==="true")return;
    const rewards=[
      {title:"Badge : Gardienne des lucioles",message:"Vous avez trouvé le trésor des lumières ! Un badge imaginaire scintillant rejoint votre collection. ✨"},
      {title:"Poussière d’étoiles",message:"Une pluie de poussière d’étoiles pour Bubulle & Blybly : que vos prochaines aventures brillent encore plus fort. 🌟"},
      {title:"Le vœu des Besties",message:"Votre coffre renfermait un vœu précieux : que votre complicité continue de faire fleurir ce royaume. 💗"}
    ];
    const reward=rewards[Number(chest.dataset.secretChest)]||rewards[0];
    chest.dataset.opened="true";
    chest.classList.add("opened");
    chest.textContent="✨";
    note.innerHTML="<strong>"+reward.title+"</strong><br>"+reward.message;
  }else{
    note.textContent=albumSecretMessages[albumSecretIndex%albumSecretMessages.length];
    albumSecretIndex++;
  }
  note.classList.remove("visible");
  void note.offsetWidth;
  note.classList.add("visible");
  window.clearTimeout(window.albumSecretNoteTimer);
  window.albumSecretNoteTimer=window.setTimeout(()=>note.classList.remove("visible"),5200);
});


function playRewardAnimation(){
  if(!activeReward) return;
  const visual=$("rewardVisual");
  visual.className="reward-visual "+rewardStyle;
  visual.querySelectorAll(".reward-spark").forEach(node=>node.remove());
  const symbol=$("rewardSymbol");
  if(symbol) symbol.remove();
  const span=document.createElement("span");
  span.id="rewardSymbol";
  span.className="reward-symbol"+(activeReward.reward.startsWith("💗")?" heart-bow":"");
  span.textContent=activeReward.reward.split(" ")[0] || "🎁";
  visual.appendChild(span);
  ["✦","✧","✨","💫","✦","🌸"].forEach((spark,index)=>{
    const particle=document.createElement("span");
    particle.className="reward-spark spark-"+index;
    particle.textContent=spark;
    particle.setAttribute("aria-hidden","true");
    visual.appendChild(particle);
  });
}
function showReward(stageIndex){
  const s=stages[stageIndex];
  const owner=myRole==="BUBULLE"?"Bubulle":"Blybly";
  const completedCount=stageIndex+1;
  const milestone=milestoneMessages[completedCount];
  activeReward={reward:s.reward,owner};
  $("rewardTitle").textContent=milestone?"✨ Une surprise spéciale !":"Bravo, trésor découvert !";
  $("rewardOwner").textContent=owner+" vient de réussir l’épreuve.";
  $("rewardName").textContent=s.reward;
  $("rewardMessage").textContent=milestone || surpriseMessages[Math.floor(Math.random()*surpriseMessages.length)];
  $("rewardModal").style.display="grid";
  show("rewardModal");
  playRewardAnimation();
}
$("replayReward").addEventListener("click",playRewardAnimation);
$("closeReward").addEventListener("click",()=>{hide("rewardModal");$("rewardModal").style.display="none";if(pendingChapterTransition)showChapterTransition();else launchNextMemoryCelebration();});
$("rewardModal").addEventListener("click",e=>{if(e.target.id==="rewardModal"){hide("rewardModal");$("rewardModal").style.display="none";if(pendingChapterTransition)showChapterTransition();else launchNextMemoryCelebration();}});

function getUnlockedMemories(players){
  const bubulle=new Set(players.BUBULLE?.completed||[]);
  const blybly=new Set(players.BLYBLY?.completed||[]);
  const unlocked=[];
  albumGroups.slice(1).forEach((group,index)=>{
    const complete=Array.from({length:group.end-group.start+1},(_,offset)=>group.start+offset).every(stageIndex=>bubulle.has(stageIndex)&&blybly.has(stageIndex));
    if(complete) unlocked.push({id:"flower-"+index,title:"Une fleur vient d’éclore !",message:"Vous avez terminé "+group.title.replace(/^Chapitre \d+ · /,"")+" toutes les deux. Un nouveau souvenir fleurit dans votre album. 🌸"});
  });
  const shared=[...bubulle].filter(index=>blybly.has(index)).length;
  if(shared>0) unlocked.push({id:"heart",title:"Le cœur des Besties s’illumine !",message:"Une nouvelle énigme réussie ensemble… Votre complicité fait battre le cœur enchanté. 💗"});
  if(stages.every((stage,index)=>bubulle.has(index)&&blybly.has(index))) unlocked.push({id:"crown",title:"Votre légende est complète !",message:"Les 21 énigmes sont terminées par vous deux. La couronne légendaire vous appartient ! 👑"});
  return unlocked;
}

const chapterGateways = {
  5:{icon:"🌲",message:"Les lucioles éclairent le sentier et les arbres murmurent vos premiers secrets. Ouvrez grand les yeux : la forêt vous attend."},
  9:{icon:"🏰",message:"Au bout du sentier, les portes du château s’entrouvrent. De nouveaux mystères et de belles surprises vous attendent derrière ses murs."},
  13:{icon:"🔮",message:"Une lueur rose et violette traverse le royaume. Les cristaux enchantés vous appellent : suivez leur lumière pour poursuivre votre quête."},
  17:{icon:"👑",message:"Le dernier chemin s’illumine. Le trésor des Besties se rapproche… Encore quelques énigmes avant votre grande légende."}
};
let pendingChapterTransition=null;
function showChapterTransition(){
  if(!pendingChapterTransition)return;
  const chapter=pendingChapterTransition;
  pendingChapterTransition=null;
  const overlay=$("chapterTransition");
  const icon=overlay.querySelector(".chapter-gateway-icon");
  icon.textContent=chapter.icon;
  $("chapterTransitionTitle").textContent=chapter.title;
  $("chapterTransitionMessage").textContent=chapter.message;
  const stops=[...$("map").children];
  stops.forEach((stop,index)=>stop.classList.toggle("chapter-highlight",index>=chapter.start&&index<=chapter.end));
  overlay.classList.remove("hidden");
}
function closeChapterTransition(){
  $("chapterTransition").classList.add("hidden");
  $("map").querySelectorAll(".chapter-highlight").forEach(stop=>stop.classList.remove("chapter-highlight"));
  launchNextMemoryCelebration();
}
$("chapterTransitionContinue").addEventListener("click",closeChapterTransition);

let pendingMemoryCelebrations=[];
function showMemoryCelebration(item){
  const overlay=$("memoryCelebration");
  $("memoryCelebrationTitle").textContent=item.title;
  $("memoryCelebrationMessage").textContent=item.message;
  const fireworks=overlay.querySelector(".memory-fireworks");
  fireworks.innerHTML="";
  const mobile=window.matchMedia("(max-width: 600px)").matches;
  const positions=mobile?[[12,22],[42,15],[78,23],[22,58],[68,66],[48,88],[91,48]]:[[8,20],[27,13],[50,19],[76,14],[93,31],[15,48],[84,51],[28,78],[57,69],[76,86]];
  positions.forEach(([x,y],burstIndex)=>{
    const burst=document.createElement("div");burst.className="memory-firework";burst.style.left=x+"%";burst.style.top=y+"%";
    const delay=burstIndex*235+Math.random()*110;
    const flash=document.createElement("em");flash.className="memory-firework-flash";flash.style.setProperty("--delay",delay+"ms");burst.appendChild(flash);
    const count=mobile?30:36;
    for(let i=0;i<count;i++){
      const spark=document.createElement("i");
      spark.style.setProperty("--angle",(i*360/count+(Math.random()-.5)*7)+"deg");
      spark.style.setProperty("--delay",(delay+Math.random()*75)+"ms");
      spark.style.setProperty("--distance",(mobile?95:125)+Math.random()*(mobile?75:100)+"px");
      spark.style.setProperty("--spark-size",(2+Math.random()*2.2)+"px");
      burst.appendChild(spark);
    }
    fireworks.appendChild(burst);
  });
  overlay.classList.remove("hidden");
}
function launchNextMemoryCelebration(){if(!pendingMemoryCelebrations.length)return;showMemoryCelebration(pendingMemoryCelebrations.shift());}
function closeMemoryCelebration(){$("memoryCelebration").classList.add("hidden");if(pendingMemoryCelebrations.length)launchNextMemoryCelebration();}
$("memoryCelebrationContinue").addEventListener("click",closeMemoryCelebration);
async function answer(choice,stageIndex,button){
  const s=stages[stageIndex];
  const feedback=$("gameMessage");
  if(choice!==s.correct){
    if(button){
      button.classList.remove("answer-wrong");
      void button.offsetWidth;
      button.classList.add("answer-wrong");
      window.setTimeout(()=>button.classList.remove("answer-wrong"),650);
    }
    feedback.classList.remove("answer-feedback-success");
    feedback.classList.add("answer-feedback-wrong");
    say("gameMessage","Pas tout à fait ! Essaie encore 😊");
    window.setTimeout(()=>feedback.classList.remove("answer-feedback-wrong"),1150);
    return;
  }
  const challenge=document.querySelector(".challenge");
  challenge.classList.remove("answer-success-flash");
  void challenge.offsetWidth;
  challenge.classList.add("answer-success-flash");
  if(button){
    button.disabled=true;
    button.classList.add("answer-correct-burst");
    for(let i=0;i<10;i++){
      const spark=document.createElement("span");
      spark.className="answer-spark";
      spark.textContent=i%3===0?"✦":i%3===1?"✧":"·";
      spark.style.setProperty("--spark-angle",(i*36)+"deg");
      spark.style.setProperty("--spark-distance",(34+(i%3)*13)+"px");
      button.appendChild(spark);
    }
  }
  feedback.classList.remove("answer-feedback-wrong");
  feedback.classList.add("answer-feedback-success");
  say("gameMessage","✨ Bonne réponse ! La magie s’éveille…");
  try{
    let newlyUnlocked=[];
    await runTransaction(db,async tx=>{
      const snap=await tx.get(roomRef);const data=snap.data();const player={...data.players[myRole]};
      if(player.completed.includes(stageIndex))return;
      const before=getUnlockedMemories(data.players);
      const beforePlayers=data.players;
      player.completed=[...player.completed,stageIndex];player.score+=10;player.stage=Math.max(player.stage,stageIndex+1);
      const updatedPlayers={...data.players,[myRole]:player};
      const after=getUnlockedMemories(updatedPlayers);
      newlyUnlocked=after.filter(item=>!before.some(old=>old.id===item.id));
      const newEvents=buildAdventureEvents(beforePlayers,updatedPlayers,myRole,stageIndex);
      const adventureLog=[...(data.adventureLog||[]),...newEvents].slice(-100);
      tx.update(roomRef,{[`players.${myRole}`]:player,adventureLog});
    });
    pendingMemoryCelebrations.push(...newlyUnlocked);
    const nextStage=stageIndex+1;
    if(chapterGateways[nextStage]){
      const groupEnd=nextStage+3;
      pendingChapterTransition={...chapterGateways[nextStage],title:stages[nextStage].chapter,start:nextStage,end:groupEnd};
    }
    showReward(stageIndex);
  }catch(e){
    if(button)button.disabled=false;
    feedback.classList.remove("answer-feedback-success");
    say("gameMessage","Impossible d’enregistrer : "+friendlyError(e));
  }
}
async function resetGame(){
  const confirmed=window.confirm("Réinitialiser toute l’aventure ? Les scores de Bubulle et Blybly, les énigmes validées et la progression seront remis à zéro sur les deux appareils. Cette action est définitive.");
  if(!confirmed) return;
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(roomRef);
      if(!snap.exists()) throw new Error("La partie est introuvable.");
      const data=snap.data();
      const players={};
      for(const role of ["BUBULLE","BLYBLY"]){
        const player=data.players[role]||{};
        players[role]={...player,score:0,stage:0,completed:[]};
      }
      tx.update(roomRef,{players});
    });
    hide("modal");
    hide("rewardModal");
    $("rewardModal").style.display="none";
    say("syncStatus","● Aventure réinitialisée sur les deux appareils");
  }catch(e){
    say("syncStatus","Réinitialisation impossible : "+friendlyError(e));
  }
}
$("resetGameBtn").addEventListener("click",resetGame);

const avatarOverlay = $("avatarWorkshopOverlay");
const avatarFrame = $("avatarWorkshopFrame");
function closeAvatarWorkshop(){
  if(!avatarOverlay) return;
  avatarOverlay.classList.add("hidden");
  if(avatarFrame) avatarFrame.src = "about:blank";
  document.body.classList.remove("avatar-workshop-open");
}
$("avatarBtn").addEventListener("click",()=>{
  if(roomId && myRole && avatarOverlay && avatarFrame){
    avatarFrame.src="./avatar.html?room="+encodeURIComponent(roomId)+"&embedded=1";
    avatarOverlay.classList.remove("hidden");
    document.body.classList.add("avatar-workshop-open");
  }
});
$("closeAvatarWorkshop")?.addEventListener("click",closeAvatarWorkshop);
window.addEventListener("message",event=>{
  if(event.origin!==location.origin || event.data?.type!=="BUBULLE_CLOSE_AVATAR") return;
  closeAvatarWorkshop();
});
$("goConnectionBtn").addEventListener("click",()=>{
  if(document.body.classList.contains("portal-leaving")) return;
  const overlay=$("portalTransition");
  document.body.classList.add("portal-leaving");
  show("portalTransition");
  window.setTimeout(()=>{
    hide("welcome");
    show("connection");
    $("connection").classList.remove("portal-entering");
    void $("connection").offsetWidth;
    $("connection").classList.add("portal-entering");
    document.body.classList.remove("portal-leaving");
    hide("portalTransition");
    window.setTimeout(()=>$("connection").classList.remove("portal-entering"),520);
  },1350);
});
$("backHomeBtn").addEventListener("click",()=>{hide("connection");show("welcome");});
$("createBtn").addEventListener("click",createRoom);
$("joinBtn").addEventListener("click",()=>joinRoom($("inviteInput").value));
$("inviteInput").addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom($("inviteInput").value)});
$("copyInviteBtn").addEventListener("click",async()=>{
  const url=location.origin+location.pathname+"?room="+roomId;
  try{await navigator.clipboard.writeText(url);say("syncStatus","Invitation copiée ! Envoie-la à Blybly.");}
  catch{prompt("Copie ce lien et envoie-le à Blybly :",url);}
});
$("hintBtn").addEventListener("click",()=>{const stage=Math.min(roomData.players[myRole].stage,4);$("hint").textContent="💡 "+stages[stage].hint;show("hint")});
$("nextBtn").addEventListener("click",()=>render());
$("leaveBtn").addEventListener("click",()=>{if(unsubscribe)unsubscribe();history.replaceState({},"",location.pathname);location.reload()});
$("closeModal").addEventListener("click",()=>hide("modal"));
$("modal").addEventListener("click",e=>{if(e.target.id==="modal") hide("modal");});
boot();
