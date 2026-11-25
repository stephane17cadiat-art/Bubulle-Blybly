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
  {place:"Château des Besties",emoji:"🏰",question:"Quel objet permet d'ouvrir une porte fermée à clé ?",answers:["Une couronne","Une clé","Une plume"],correct:1,hint:"Elle se glisse dans la serrure.",reward:"👑 Fragment de couronne"}
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
  $("stageLabel").textContent=`ÉPREUVE ${stage+1} / 5`;
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
  $("nextBtn").classList.toggle("hidden",!mine.completed.includes(stage)||stage===4);
  $("hintBtn").classList.toggle("hidden",mine.completed.includes(stage));
  $("map").innerHTML="";
  stages.forEach((x,i)=>{
    const el=document.createElement("div");el.className="map-stop"+(mine.completed.includes(i)?" done":"")+(i===stage?" current":"");
    el.innerHTML=`<span class="emoji">${mine.completed.includes(i)?"✅":x.emoji}</span><small>${x.place}</small>`;
    $("map").appendChild(el);
  });
  const treasures=mine.completed.map(i=>`<div class="treasure-item">${stages[i].reward}</div>`).join("");
  $("treasures").innerHTML=treasures||'<p class="muted">Tes trésors apparaîtront ici…</p>';
  if(mine.stage>=5) $("modal").classList.remove("hidden");
}
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
