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
  {place:"Forêt des murmures",emoji:"🌲",question:"Quel animal est réputé pour hululer la nuit ?",answers:["Le hibou","Le lapin","Le papillon"],correct:0,hint:"Il possède de grands yeux et vit souvent dans les arbres.",reward:"💎 Diamant de la forêt"},
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
      if(data.players.BLYBLY.joined) throw new Error("Cette partie a déjà ses deux joueuses.");
      myRole="BLYBLY";
      tx.update(roomRef,{"players.BLYBLY.uid":user.uid,"players.BLYBLY.joined":true});
    });
    history.replaceState({}, "", "?room="+roomId); enterGame(); listen();
  }catch(e){say("welcomeMessage",friendlyError(e));}
}
function enterGame(){hide("welcome");show("game");}
function listen(){
  if(unsubscribe) unsubscribe();
  unsubscribe=onSnapshot(roomRef,snap=>{
    if(!snap.exists()) return;
    roomData=snap.data(); render();
    say("syncStatus","● Partie synchronisée");
  },e=>say("syncStatus","● Erreur de synchronisation"));
}
function render(){
  const p=roomData.players;
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
  $("stageLabel").textContent=`${s.chapter || "Premiers pas"} · ÉPREUVE ${stage+1} / ${stages.length}`;
  $("stagePlace").textContent=s.emoji+" "+s.place.toUpperCase();
  $("question").textContent=s.question;
  $("answers").innerHTML="";
  s.answers.forEach((a,i)=>{
    const b=document.createElement("button");b.className="answer";b.textContent=a;
    b.disabled=mine.completed.includes(stage);
    if(mine.completed.includes(stage) && i===s.correct)b.classList.add("correct");
    b.addEventListener("click",()=>answer(i,stage));$("answers").appendChild(b);
  });
  $("hint").classList.add("hidden"); $("gameMessage").textContent=mine.completed.includes(stage)?"Épreuve validée ! Ton trésor est dans ta collection.":"À toi de jouer !";
  $("nextBtn").classList.toggle("hidden",!mine.completed.includes(stage)||stage===stages.length-1);
  $("hintBtn").classList.toggle("hidden",mine.completed.includes(stage));
  $("map").innerHTML="";
  stages.forEach((x,i)=>{
    const el=document.createElement("div");el.className="map-stop"+(mine.completed.includes(i)?" done":"")+(i===stage?" current":"");
    el.innerHTML=`<span class="emoji">${mine.completed.includes(i)?"✅":x.emoji}</span><small>${x.place}</small>`;
    $("map").appendChild(el);
  });
  const treasures=mine.completed.map(i=>`<div class="treasure-item">${stages[i].reward}</div>`).join("");
  $("treasures").innerHTML=treasures||'<p class="muted">Tes trésors apparaîtront ici…</p>';
  if(mine.stage>=stages.length) $("modal").classList.remove("hidden");
}

let activeReward = null;
let rewardStyle = localStorage.getItem("bubulleRewardStyle") || "chest";
function playRewardAnimation(){
  if(!activeReward) return;
  const visual=$("rewardVisual");
  visual.className="reward-visual "+rewardStyle;
  // Relance les animations à chaque aperçu.
  const symbol=$("rewardSymbol");
  if(symbol) symbol.remove();
  const span=document.createElement("span");
  span.id="rewardSymbol";span.className="reward-symbol";
  span.textContent=activeReward.reward.split(" ")[0] || "🎁";
  visual.appendChild(span);
  document.querySelectorAll(".reward-style").forEach(b=>b.classList.toggle("active",b.dataset.style===rewardStyle));
}
function showReward(stageIndex){
  const s=stages[stageIndex];
  activeReward={reward:s.reward,owner:myRole==="BUBULLE"?"Bubulle":"Blybly"};
  $("rewardTitle").textContent="Bravo, trésor découvert !";
  $("rewardOwner").textContent=activeReward.owner+" vient de réussir l’épreuve.";
  $("rewardName").textContent=s.reward;
  show("rewardModal");
  playRewardAnimation();
}
document.querySelectorAll(".reward-style").forEach(button=>{
  button.addEventListener("click",()=>{
    rewardStyle=button.dataset.style;
    localStorage.setItem("bubulleRewardStyle",rewardStyle);
    playRewardAnimation();
  });
});
$("replayReward").addEventListener("click",playRewardAnimation);
$("rewardTestBtn").addEventListener("click",()=>{
  activeReward={reward:"💎 Diamant de la forêt",owner:"Aperçu de démonstration — aucun point ne sera ajouté."};
  $("rewardTitle").textContent="Choisis ton effet préféré !";
  $("rewardOwner").textContent=activeReward.owner;
  $("rewardName").textContent=activeReward.reward;
  show("rewardModal");
  playRewardAnimation();
});
$("closeReward").addEventListener("click",()=>hide("rewardModal"));
$("rewardModal").addEventListener("click",e=>{if(e.target.id==="rewardModal")hide("rewardModal");});

async function answer(choice,stageIndex){
  const s=stages[stageIndex];
  if(choice!==s.correct){say("gameMessage","Pas tout à fait ! Essaie encore 😊");return;}
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(roomRef);const data=snap.data();const player={...data.players[myRole]};
      if(player.completed.includes(stageIndex)) return;
      player.completed=[...player.completed,stageIndex];player.score+=10;player.stage=Math.max(player.stage,stageIndex+1);
      tx.update(roomRef,{[`players.${myRole}`]:player});
    });
    showReward(stageIndex);
  }catch(e){say("gameMessage","Impossible d'enregistrer : "+friendlyError(e));}
}
$("avatarBtn").addEventListener("click",()=>{ if(roomId && myRole){ location.href="./avatar.html?room="+encodeURIComponent(roomId); } });
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
boot();
