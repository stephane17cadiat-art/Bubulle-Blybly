import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
,
  {"place":"Clairière des fougères","emoji":"🌿","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Quelle plante est célèbre pour ses feuilles en forme de cœur ?","answers":["Le lierre","Le cactus","Le pin"],"correct":0,"hint":"Ses tiges grimpent souvent le long des murs.","reward":"🍃 Feuille de lierre"},
  {"place":"Ruisseau chantant","emoji":"💧","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Combien de côtés possède un hexagone ?","answers":["Six","Huit","Cinq"],"correct":0,"hint":"Le préfixe hexa signifie six.","reward":"💎 Galet hexagonal"},
  {"place":"Nid des mésanges","emoji":"🐦","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Quel oiseau ne peut pas voler ?","answers":["L'hirondelle","L'autruche","La mésange"],"correct":1,"hint":"C'est un grand oiseau coureur.","reward":"🪶 Plume d'autruche"},
  {"place":"Tronc des devinettes","emoji":"🪵","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Je grandis sans être vivant et je disparais quand on me verse de l'eau. Qui suis-je ?","answers":["Une ombre","Une flamme","Une pierre"],"correct":1,"hint":"Je peux danser dans une cheminée.","reward":"🔥 Étincelle de feu"},
  {"place":"Mare aux nénuphars","emoji":"🪷","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Une grenouille avance de 2 nénuphars par bond. Combien de bonds pour avancer de 8 ?","answers":["4","6","8"],"correct":0,"hint":"Divise 8 par 2.","reward":"🪷 Nénuphar brillant"},
  {"place":"Champ des papillons","emoji":"🦋","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Quel est le contraire de nocturne ?","answers":["Souterrain","Diurne","Silencieux"],"correct":1,"hint":"Cela concerne la journée.","reward":"🌼 Aile de papillon"},
  {"place":"Pierre des saisons","emoji":"🍂","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Quelle saison vient après le printemps ?","answers":["L'été","L'automne","L'hiver"],"correct":0,"hint":"Elle commence généralement en juin dans l'hémisphère nord.","reward":"☀️ Rayon d'été"},
  {"place":"Cabane du garde","emoji":"🛖","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Vrai ou faux : une araignée possède six pattes.","answers":["Vrai","Faux","Cela dépend de sa taille"],"correct":1,"hint":"Compte ses quatre paires de pattes.","reward":"🕷️ Fil de soie"},
  {"place":"Sentier des noisettes","emoji":"🌰","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Tu as 12 noisettes et tu en donnes un tiers. Combien t'en reste-t-il ?","answers":["4","8","9"],"correct":1,"hint":"Un tiers de 12 vaut 4.","reward":"🌰 Noisette d'or"},
  {"place":"Arbre des mots","emoji":"🌳","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Quel mot est un palindrome ?","answers":["Radar","Forêt","Lumière"],"correct":0,"hint":"Il se lit de la même façon dans les deux sens.","reward":"📜 Mot enchanté"},
  {"place":"Roc du renard","emoji":"🦊","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Un renard voit 3 lapins. Chacun voit 2 autres lapins. Combien de lapins sont forcément présents au minimum ?","answers":["3","5","6"],"correct":0,"hint":"Les lapins aperçus peuvent être les mêmes.","reward":"🦊 Médaillon du renard"},
  {"place":"Pont des saisons","emoji":"🌈","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Combien de mois comptent au moins 28 jours ?","answers":["Un seul","Deux","Les douze"],"correct":2,"hint":"Tous les mois ont au moins 28 jours.","reward":"🌈 Arc-en-ciel secret"},
  {"place":"Grotte des échos","emoji":"🪨","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Quel son se répète après avoir rebondi sur une paroi ?","answers":["Un murmure","Un écho","Un sifflet"],"correct":1,"hint":"Tu l'entends parfois en montagne.","reward":"🔔 Perle d'écho"},
  {"place":"Racines anciennes","emoji":"🌱","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Quelle partie de la plante absorbe principalement l'eau du sol ?","answers":["Les fleurs","Les feuilles","Les racines"],"correct":2,"hint":"Elles se trouvent sous la terre.","reward":"🌱 Racine magique"},
  {"place":"Porte de la forêt","emoji":"🚪","chapter":"Chapitre 5 · Les secrets de la forêt","question":"Quelle valeur vient ensuite : 1, 1, 2, 3, 5… ?","answers":["6","8","10"],"correct":1,"hint":"Chaque terme est la somme des deux précédents.","reward":"🗝️ Clé de la forêt"},
  {"place":"Roseraie des couleurs","emoji":"🌹","chapter":"Chapitre 6 · Les jardins enchantés","question":"En mélangeant du bleu et du jaune en peinture, quelle couleur obtient-on ?","answers":["Vert","Violet","Orange"],"correct":0,"hint":"C'est la couleur de nombreuses feuilles.","reward":"🌹 Rose émeraude"},
  {"place":"Bassin des reflets","emoji":"🪞","chapter":"Chapitre 6 · Les jardins enchantés","question":"Combien de minutes y a-t-il dans 2 heures et demie ?","answers":["120","150","180"],"correct":1,"hint":"Deux heures font 120 minutes, ajoute une demi-heure.","reward":"🫧 Bulle de temps"},
  {"place":"Allée des tulipes","emoji":"🌷","chapter":"Chapitre 6 · Les jardins enchantés","question":"Quelle fleur est particulièrement associée aux Pays-Bas ?","answers":["La tulipe","Le coquelicot","La lavande"],"correct":0,"hint":"Elle colore les champs au printemps.","reward":"🌷 Tulipe royale"},
  {"place":"Serre aux parfums","emoji":"🌺","chapter":"Chapitre 6 · Les jardins enchantés","question":"Quel sens permet de reconnaître un parfum ?","answers":["Le toucher","L'odorat","L'ouïe"],"correct":1,"hint":"Il utilise le nez.","reward":"🌸 Pétale parfumé"},
  {"place":"Fontaine des fées","emoji":"🧚","chapter":"Chapitre 6 · Les jardins enchantés","question":"Vrai ou faux : l'eau pure bout autour de 100 °C au niveau de la mer.","answers":["Vrai","Faux","Seulement en hiver"],"correct":0,"hint":"C'est son point d'ébullition habituel à pression normale.","reward":"💧 Goutte de fée"},
  {"place":"Labyrinthe fleuri","emoji":"🌼","chapter":"Chapitre 6 · Les jardins enchantés","question":"Un jardinier plante 4 rangées de 6 fleurs. Combien de fleurs plante-t-il ?","answers":["20","24","26"],"correct":1,"hint":"Multiplie le nombre de rangées par le nombre de fleurs.","reward":"🌼 Bouquet lumineux"},
  {"place":"Banc des souvenirs","emoji":"📖","chapter":"Chapitre 6 · Les jardins enchantés","question":"Quel est le féminin de heureux ?","answers":["Heureuse","Heureuxse","Heureuxe"],"correct":0,"hint":"Le mot se termine par euse au féminin.","reward":"📚 Page de poésie"},
  {"place":"Pergola des oiseaux","emoji":"🐝","chapter":"Chapitre 6 · Les jardins enchantés","question":"Quel insecte contribue fortement à la pollinisation ?","answers":["La fourmi","L'abeille","Le moustique"],"correct":1,"hint":"Il transporte du pollen en butinant.","reward":"🐝 Goutte de miel"},
  {"place":"Carré des roses","emoji":"🌹","chapter":"Chapitre 6 · Les jardins enchantés","question":"Quel nombre est pair ?","answers":["17","23","38"],"correct":2,"hint":"Un nombre pair est divisible par deux.","reward":"🌹 Rose argentée"},
  {"place":"Kiosque à musique","emoji":"🎵","chapter":"Chapitre 6 · Les jardins enchantés","question":"Combien de notes principales compte la gamme de do majeur ?","answers":["Sept","Huit","Neuf"],"correct":0,"hint":"Do, ré, mi, fa, sol, la, si.","reward":"🎼 Clé de sol"},
  {"place":"Allée des statues","emoji":"🗿","chapter":"Chapitre 6 · Les jardins enchantés","question":"Quel matériau est naturellement une roche ?","answers":["Le verre","Le granite","Le plastique"],"correct":1,"hint":"On le trouve dans les montagnes et les carrières.","reward":"🪨 Éclat de granite"},
  {"place":"Verger enchanté","emoji":"🍎","chapter":"Chapitre 6 · Les jardins enchantés","question":"Tu cueilles 5 pommes, puis 3, puis tu en manges 2. Combien t'en reste-t-il ?","answers":["6","8","10"],"correct":0,"hint":"Additionne les pommes cueillies puis retire celles mangées.","reward":"🍎 Pomme d'argent"},
  {"place":"Balcon des étoiles","emoji":"⭐","chapter":"Chapitre 6 · Les jardins enchantés","question":"Quel instrument sert à observer les astres lointains ?","answers":["Un microscope","Un télescope","Un thermomètre"],"correct":1,"hint":"Il rapproche visuellement les objets du ciel.","reward":"🔭 Lentille céleste"},
  {"place":"Pavillon des énigmes","emoji":"🎀","chapter":"Chapitre 6 · Les jardins enchantés","question":"Quel mot complète la suite : lundi, mardi, mercredi… ?","answers":["Vendredi","Jeudi","Dimanche"],"correct":1,"hint":"C'est le quatrième jour de la semaine.","reward":"🎀 Ruban du jardin"},
  {"place":"Grande serre","emoji":"🌿","chapter":"Chapitre 6 · Les jardins enchantés","question":"Un carré a 4 côtés égaux. Quel est son périmètre si un côté mesure 7 cm ?","answers":["14 cm","21 cm","28 cm"],"correct":2,"hint":"Additionne ses quatre côtés.","reward":"📐 Règle enchantée"},
  {"place":"Portail des fleurs","emoji":"🌺","chapter":"Chapitre 6 · Les jardins enchantés","question":"Vrai ou faux : une douzaine correspond à 12 objets.","answers":["Vrai","Faux","Cela dépend"],"correct":0,"hint":"C'est une quantité utilisée pour compter les œufs.","reward":"🌺 Sceau floral"},
  {"place":"Salle des portraits","emoji":"🖼️","chapter":"Chapitre 7 · Le château des mystères","question":"Quel peintre a réalisé La Joconde ?","answers":["Claude Monet","Léonard de Vinci","Pablo Picasso"],"correct":1,"hint":"C'était un artiste italien de la Renaissance.","reward":"🖼️ Cadre de maître"},
  {"place":"Escalier des nombres","emoji":"🔢","chapter":"Chapitre 7 · Le château des mystères","question":"Quel est le résultat de 9 × 7 ?","answers":["56","63","72"],"correct":1,"hint":"C'est 10 × 7 moins 7.","reward":"🔢 Chiffre royal"},
  {"place":"Bibliothèque des ombres","emoji":"📚","chapter":"Chapitre 7 · Le château des mystères","question":"Quel est le pluriel de un cheval ?","answers":["Des chevals","Des chevaux","Des chevaus"],"correct":1,"hint":"Le pluriel change al en aux pour ce mot.","reward":"📖 Grimoire grammatical"},
  {"place":"Salle des énigmes","emoji":"🧩","chapter":"Chapitre 7 · Le château des mystères","question":"Plus tu en prends, plus tu en laisses derrière toi. Que sont-elles ?","answers":["Des photos","Des empreintes de pas","Des pièces"],"correct":1,"hint":"Elles marquent le sol quand tu marches.","reward":"👣 Pas mystérieux"},
  {"place":"Galerie des cartes","emoji":"🗺️","chapter":"Chapitre 7 · Le château des mystères","question":"Quelle est la capitale de l'Italie ?","answers":["Rome","Milan","Venise"],"correct":0,"hint":"La ville est célèbre pour le Colisée.","reward":"🏛️ Carte romaine"},
  {"place":"Chambre des balances","emoji":"⚖️","chapter":"Chapitre 7 · Le château des mystères","question":"Un kilo de plumes et un kilo de pierres : lequel est le plus lourd ?","answers":["Les plumes","Les pierres","Ils pèsent pareil"],"correct":2,"hint":"Un kilogramme reste un kilogramme.","reward":"⚖️ Balance d'or"},
  {"place":"Salle des miroirs","emoji":"🪞","chapter":"Chapitre 7 · Le château des mystères","question":"Quel nombre romain représente 50 ?","answers":["L","C","X"],"correct":0,"hint":"C'est la lettre utilisée pour cinquante.","reward":"🪞 Miroir antique"},
  {"place":"Tour de l'horloge","emoji":"🕰️","chapter":"Chapitre 7 · Le château des mystères","question":"Il est 10 h 40. Quelle heure sera-t-il dans 35 minutes ?","answers":["11 h 05","11 h 15","11 h 25"],"correct":1,"hint":"Ajoute 20 minutes pour atteindre 11 h, puis 15.","reward":"⏰ Rouage précieux"},
  {"place":"Cabinet des curiosités","emoji":"🧪","chapter":"Chapitre 7 · Le château des mystères","question":"Quel état de l'eau correspond à la vapeur ?","answers":["Solide","Liquide","Gazeux"],"correct":2,"hint":"C'est l'état de l'eau sous forme de vapeur.","reward":"🧪 Fiole de brume"},
  {"place":"Salle des passages","emoji":"🚪","chapter":"Chapitre 7 · Le château des mystères","question":"Trois portes : rouge, bleue et verte. La clé n'est ni rouge ni verte. Quelle porte ouvre-t-elle ?","answers":["Rouge","Bleue","Verte"],"correct":1,"hint":"Élimine les deux couleurs impossibles.","reward":"🗝️ Passe-partout"},
  {"place":"Salle des énigmes doubles","emoji":"🧠","chapter":"Chapitre 7 · Le château des mystères","question":"Si tous les flurps sont bleus et que Nino est un flurp, que sait-on ?","answers":["Nino est bleu","Nino est rouge","On ne sait rien"],"correct":0,"hint":"Applique la règle à Nino.","reward":"🧠 Cristal de logique"},
  {"place":"Salle des livres perdus","emoji":"📕","chapter":"Chapitre 7 · Le château des mystères","question":"Quel auteur a écrit Les Misérables ?","answers":["Victor Hugo","Émile Zola","Molière"],"correct":0,"hint":"C'est un grand écrivain français du XIXe siècle.","reward":"📕 Livre légendaire"},
  {"place":"Salle des constellations","emoji":"🌌","chapter":"Chapitre 7 · Le château des mystères","question":"Quelle planète est surnommée la planète rouge ?","answers":["Vénus","Mars","Jupiter"],"correct":1,"hint":"Sa surface contient beaucoup d'oxydes de fer.","reward":"🔴 Poussière martienne"},
  {"place":"Salle des tapisseries","emoji":"🧵","chapter":"Chapitre 7 · Le château des mystères","question":"Combien de côtés possède un octogone ?","answers":["Six","Sept","Huit"],"correct":2,"hint":"Le préfixe octo signifie huit.","reward":"🧵 Fil d'or"},
  {"place":"Salle du trône","emoji":"👑","chapter":"Chapitre 7 · Le château des mystères","question":"Un roi a 3 fils. Chaque fils a une sœur. Combien d'enfants a-t-il au minimum ?","answers":["4","6","7"],"correct":0,"hint":"Les trois fils peuvent avoir la même sœur.","reward":"👑 Joyau du trône"},
  {"place":"Grande porte royale","emoji":"🏰","chapter":"Chapitre 7 · Le château des mystères","question":"Quel mot est correctement orthographié ?","answers":["Acceuillir","Accueillir","Acueillir"],"correct":1,"hint":"Il contient deux c et deux l.","reward":"🏰 Sceau du château"},
  {"place":"Caverne des cristaux","emoji":"💎","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quel minéral est le plus dur sur l'échelle de Mohs ?","answers":["Le quartz","Le diamant","Le talc"],"correct":1,"hint":"Il peut rayer presque tous les autres minéraux.","reward":"💎 Diamant brut"},
  {"place":"Lac miroir","emoji":"🌊","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quelle est la formule chimique de l'eau ?","answers":["CO₂","H₂O","O₂"],"correct":1,"hint":"Elle contient deux atomes d'hydrogène et un d'oxygène.","reward":"🌊 Goutte cristalline"},
  {"place":"Galerie des planètes","emoji":"🪐","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quelle planète est la plus proche du Soleil ?","answers":["Mercure","Terre","Saturne"],"correct":0,"hint":"C'est la première planète du système solaire.","reward":"🪐 Anneau de Mercure"},
  {"place":"Pont des probabilités","emoji":"🎲","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Avec un dé équilibré à six faces, quelle est la probabilité d'obtenir un 6 ?","answers":["1 sur 2","1 sur 3","1 sur 6"],"correct":2,"hint":"Une seule face sur les six porte ce nombre.","reward":"🎲 Dé porte-bonheur"},
  {"place":"Salle des suites","emoji":"🔮","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quel nombre vient ensuite : 3, 6, 12, 24… ?","answers":["36","48","42"],"correct":1,"hint":"Chaque nombre est multiplié par deux.","reward":"🔮 Cristal double"},
  {"place":"Faille du temps","emoji":"⌛","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Combien de secondes y a-t-il dans 3 minutes ?","answers":["120","180","240"],"correct":1,"hint":"Une minute contient 60 secondes.","reward":"⌛ Sablier de cristal"},
  {"place":"Canyon des couleurs","emoji":"🌈","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quelle couleur obtient-on en mélangeant du rouge et du bleu en peinture ?","answers":["Violet","Vert","Orange"],"correct":0,"hint":"C'est une couleur secondaire.","reward":"🌈 Prisme violet"},
  {"place":"Grotte des sons","emoji":"🎶","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quel instrument possède généralement 88 touches ?","answers":["Le violon","Le piano","La flûte"],"correct":1,"hint":"Il comporte des touches noires et blanches.","reward":"🎹 Touche enchantée"},
  {"place":"Observatoire polaire","emoji":"❄️","chapter":"Chapitre 8 · Le royaume des cristaux","question":"À quelle température l'eau pure gèle-t-elle habituellement ?","answers":["0 °C","10 °C","100 °C"],"correct":0,"hint":"C'est le point de congélation à pression normale.","reward":"❄️ Flocon éternel"},
  {"place":"Pont des équilibres","emoji":"⚖️","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Si 5 pierres identiques pèsent 20 kg au total, combien pèse une pierre ?","answers":["2 kg","4 kg","5 kg"],"correct":1,"hint":"Partage 20 en cinq parts égales.","reward":"⚖️ Pierre d'équilibre"},
  {"place":"Salle des atomes","emoji":"⚛️","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quelle particule porte une charge électrique négative ?","answers":["Le proton","Le neutron","L'électron"],"correct":2,"hint":"Elle se trouve autour du noyau de l'atome.","reward":"⚛️ Étincelle atomique"},
  {"place":"Dôme des étoiles","emoji":"🌠","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Combien de planètes compte le système solaire ?","answers":["7","8","9"],"correct":1,"hint":"Pluton est classée comme planète naine.","reward":"🌠 Étoile filante"},
  {"place":"Escalier fractal","emoji":"🌀","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quel est le quart de 100 ?","answers":["20","25","40"],"correct":1,"hint":"Divise 100 en quatre parts égales.","reward":"🌀 Spirale des nombres"},
  {"place":"Prisme des formes","emoji":"🔷","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Quelle figure possède exactement trois côtés ?","answers":["Un triangle","Un losange","Un pentagone"],"correct":0,"hint":"Son nom commence par tri.","reward":"🔷 Éclat triangulaire"},
  {"place":"Cœur de la montagne","emoji":"⛰️","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Vrai ou faux : le magma qui atteint la surface est appelé lave.","answers":["Vrai","Faux","Seulement la nuit"],"correct":0,"hint":"Le terme change lorsqu'il sort du volcan.","reward":"🌋 Pierre de lave"},
  {"place":"Sortie des cristaux","emoji":"💠","chapter":"Chapitre 8 · Le royaume des cristaux","question":"Un cristal vaut 8 points. Combien valent 7 cristaux ?","answers":["48","54","56"],"correct":2,"hint":"Calcule 8 × 7.","reward":"💠 Grand cristal"},
  {"place":"Sanctuaire des Besties","emoji":"💗","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Quelle qualité aide le plus à résoudre une énigme à deux ?","answers":["Écouter les idées de l'autre","Parler plus fort","Répondre sans réfléchir"],"correct":0,"hint":"La coopération commence par l'écoute.","reward":"💗 Cœur de confiance"},
  {"place":"Jardin des promesses","emoji":"🌷","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Vrai ou faux : un siècle dure 100 ans.","answers":["Vrai","Faux","Un siècle dure 10 ans"],"correct":0,"hint":"Le mot désigne une période de cent années.","reward":"🌷 Fleur du temps"},
  {"place":"Salle des souvenirs","emoji":"📸","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Quel appareil sert principalement à prendre des photographies ?","answers":["Un microscope","Un appareil photo","Un compas"],"correct":1,"hint":"Il capture une image.","reward":"📸 Instant précieux"},
  {"place":"Pont de l'amitié","emoji":"🤝","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Blybly avance de 4 cases et Bubulle de 6. Combien de cases ont-elles parcourues ensemble ?","answers":["8","10","12"],"correct":1,"hint":"Additionne les deux déplacements.","reward":"🤝 Lien indestructible"},
  {"place":"Coffre des mots","emoji":"🔤","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Quel mot désigne une peur intense et irrationnelle ?","answers":["Une phobie","Une mélodie","Une énigme"],"correct":0,"hint":"Le terme se termine par phobie.","reward":"🔤 Lettre mystérieuse"},
  {"place":"Observatoire du duo","emoji":"🔭","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Si aujourd'hui est mercredi, quel jour sera-t-on dans 10 jours ?","answers":["Vendredi","Samedi","Dimanche"],"correct":1,"hint":"Sept jours plus tard, c'est mercredi ; ajoute trois jours.","reward":"🔭 Étoile du duo"},
  {"place":"Allée des décisions","emoji":"🧭","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Tu as 3 chemins. Chacun se divise en 2 chemins. Combien de chemins finaux y a-t-il ?","answers":["5","6","9"],"correct":1,"hint":"Chaque chemin initial donne deux possibilités.","reward":"🧭 Boussole des choix"},
  {"place":"Salle des énigmes secrètes","emoji":"🗝️","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Je peux être cassé sans être touché. Qui suis-je ?","answers":["Un secret","Un miroir","Un verre"],"correct":0,"hint":"On peut le révéler à quelqu'un.","reward":"🗝️ Secret précieux"},
  {"place":"Balcon des rêves","emoji":"🌙","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Quel est le résultat de 15 + 27 ?","answers":["40","42","44"],"correct":1,"hint":"15 + 20 = 35, puis ajoute 7.","reward":"🌙 Lueur des rêves"},
  {"place":"Galerie des héroïnes","emoji":"🦸","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Quelle déesse grecque est associée à la sagesse et à la chouette ?","answers":["Athéna","Aphrodite","Artémis"],"correct":0,"hint":"C'est une déesse grecque.","reward":"🦉 Sceau d'Athéna"},
  {"place":"Salle du grand partage","emoji":"🎁","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"On partage 36 gemmes équitablement entre 4 coffres. Combien par coffre ?","answers":["8","9","12"],"correct":1,"hint":"36 divisé par 4.","reward":"🎁 Gemme généreuse"},
  {"place":"Passage des contraires","emoji":"☯️","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Quel est l'antonyme de généreux ?","answers":["Altruiste","Avare","Bienveillant"],"correct":1,"hint":"Ce mot désigne quelqu'un qui donne peu.","reward":"☯️ Balance du cœur"},
  {"place":"Tour des énigmes","emoji":"🗼","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Je suis un nombre. Mon double vaut 18. Qui suis-je ?","answers":["8","9","12"],"correct":1,"hint":"Divise 18 par deux.","reward":"🗼 Clé des nombres"},
  {"place":"Jardin des constellations","emoji":"✨","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Quelle étoile est au centre de notre système solaire ?","answers":["Sirius","La Lune","Le Soleil"],"correct":2,"hint":"Elle nous apporte lumière et chaleur.","reward":"✨ Éclat solaire"},
  {"place":"Dernier portail","emoji":"🚪","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Quel nombre complète la suite : 10, 20, 30, 40… ?","answers":["45","50","60"],"correct":1,"hint":"La suite augmente de dix à chaque fois.","reward":"🚪 Clé du dernier portail"},
  {"place":"Coffre légendaire","emoji":"👑","chapter":"Chapitre 9 · Le sanctuaire des Besties","question":"Bubulle et Blybly ont chacune 100 épreuves. Combien de validations individuelles représentent leurs 100 réussites chacune ?","answers":["100","150","200"],"correct":2,"hint":"Il faut compter les 100 réussites de chacune.","reward":"👑 Couronne des Besties"}
];
const $ = id => document.getElementById(id);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let user, roomId, roomRef, unsubscribe, myRole, roomData;
let selectedRole = (() => { const saved=localStorage.getItem("bbSelectedRole"); return saved==="BUBULLE"||saved==="BLYBLY" ? saved : ""; })();

const inviteCode = () => crypto.randomUUID().replaceAll("-","").slice(0,18).toUpperCase();
const roomParams = new URLSearchParams(location.search);
const roomFromUrl = roomParams.get("room");
const roleFromUrl = roomParams.get("player");
const say = (id,msg) => $(id).textContent = msg;
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");


/* Playlist partagée Bubulle & Blybly : fichiers intégrés au site. */
const songAudio = $("bestiesSong");
const songButton = $("songToggleBtn");
const songNextButton = $("songNextBtn");
const songStatus = $("songStatus");
const songTitle = $("songTitle");
const songPlayer = songAudio ? songAudio.closest(".song-player") : null;
const songProgressFill = $("songProgressFill");
const songTime = $("songTime");
const formatSongTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return mins + ":" + secs;
};
const songPlaylist = [
  { title: "Lorie — Sur un air latino", file: "Lorie - Sur un air Lotino.mp3" },
  { title: "Britney Spears — Do You Wanna Come Over?", file: "Britney Spears Glory - 07 Do You Wanna Come Over.mp3" },
  { title: "Fatal Bazooka — J’aime trop ton boule", file: "Fatal Bazooka - Jaime trop ton boule (Clip officiel).mp3" },
  { title: "Britney Spears — The Answer", file: "Britney Spears - The Answer.mp3" },
  { title: "Lorie — Je serai (ta meilleure amie)", file: "Lorie - Je serai (ta meilleure amie) (Clip officiel).mp3" }
];
let songIndex = 0;
let songStarted = false;
let songWantsPlayback = false;
const loadPlaylistTrack = (index, autoplay = false) => {
  if (!songAudio || !songPlaylist.length) return;
  songIndex = (index + songPlaylist.length) % songPlaylist.length;
  const track = songPlaylist[songIndex];
  songAudio.src = "assets/music/" + encodeURIComponent(track.file).replace(/%2F/g, "/");
  songAudio.load();
  if (songTitle) songTitle.textContent = track.title;
  if (songStatus) songStatus.textContent = "Piste " + (songIndex + 1) + " sur " + songPlaylist.length + " · prête à écouter 💗";
  if (autoplay) {
    songWantsPlayback = true;
    songAudio.play().then(() => {
      songStarted = true;
      if (songButton) songButton.textContent = "⏸ Mettre en pause";
      if (songStatus) songStatus.textContent = "Lecture en cours · " + (songIndex + 1) + "/" + songPlaylist.length + " 💗";
    }).catch(() => {
      songWantsPlayback = false;
      if (songButton) songButton.textContent = "▶️ Écouter la playlist";
      if (songStatus) songStatus.textContent = "Appuie sur écouter pour lancer la musique 💗";
    });
  } else if (songButton) {
    songButton.textContent = songStarted ? "▶️ Reprendre la playlist" : "▶️ Écouter la playlist";
  }
};
if (songAudio && songButton && songNextButton) {
  loadPlaylistTrack(0);
  songAudio.addEventListener("canplay", () => {
    if (songWantsPlayback && songAudio.paused) {
      songAudio.play().then(() => {
        songStarted = true;
        songWantsPlayback = false;
        songButton.textContent = "⏸ Mettre en pause";
      }).catch(() => { songWantsPlayback = false; });
    }
  });
  songAudio.addEventListener("error", () => {
    if (songStatus) songStatus.textContent = "Impossible de charger cette piste. Vérifie ta connexion et réessaie.";
  });
  songButton.addEventListener("click", async () => {
    if (songAudio.paused) {
      try {
        await songAudio.play();
        songStarted = true;
        songButton.textContent = "⏸ Mettre en pause";
        songStatus.textContent = "Lecture en cours · " + (songIndex + 1) + "/" + songPlaylist.length + " 💗";
      } catch {
        songStatus.textContent = "La lecture n’a pas pu démarrer. Réessaie.";
      }
    } else {
      songAudio.pause();
      songButton.textContent = "▶️ Reprendre la playlist";
      songStatus.textContent = "Musique en pause";
    }
  });
  songNextButton.addEventListener("click", () => loadPlaylistTrack(songIndex + 1, songStarted && !songAudio.paused));
  songAudio.addEventListener("ended", () => loadPlaylistTrack(songIndex + 1, true));
  songAudio.addEventListener("play", () => {
    if (songPlayer) songPlayer.classList.add("is-playing");
  });
  songAudio.addEventListener("pause", () => {
    if (songPlayer) songPlayer.classList.remove("is-playing");
  });
  songAudio.addEventListener("timeupdate", () => {
    if (songProgressFill && Number.isFinite(songAudio.duration) && songAudio.duration > 0) {
      songProgressFill.style.width = (songAudio.currentTime / songAudio.duration * 100) + "%";
    }
    if (songTime) songTime.textContent = formatSongTime(songAudio.currentTime) + " / " + formatSongTime(songAudio.duration);
  });
  songAudio.addEventListener("loadedmetadata", () => {
    if (songTime) songTime.textContent = "0:00 / " + formatSongTime(songAudio.duration);
    if (songProgressFill) songProgressFill.style.width = "0%";
  });
}
async function boot(){
  $("createBtn").disabled = true; $("joinBtn").disabled = true;
  say("welcomeMessage","Connexion sécurisée au royaume… un instant 💗");
  if(firebaseConfig.apiKey.startsWith("REMPLACER")) {
    say("welcomeMessage","Le site est prêt à configurer : ajoute d'abord les clés Firebase dans app.js (guide fourni).");
    $("createBtn").disabled = true; $("joinBtn").disabled = true; return;
  }
  try { await setPersistence(auth, browserLocalPersistence); const cred = await signInAnonymously(auth); user = cred.user; $("createBtn").disabled = false; $("joinBtn").disabled = false; say("welcomeMessage","Connexion prête ! Tu peux créer ou rejoindre votre aventure."); say("syncStatus","● Connecté"); 
    if(roomFromUrl) {
      $("inviteInput").value = roomFromUrl;
      hide("welcome"); show("connection");
      if(roleFromUrl==="BUBULLE" || roleFromUrl==="BLYBLY") {
        selectedRole=roleFromUrl;
        localStorage.setItem("bbSelectedRole",selectedRole);
        updateProfileChoice();
        await joinRoom(roomFromUrl);
      } else {
        updateProfileChoice();
        say("welcomeMessage","Choisis Bubulle ou Blybly pour retrouver le bon profil.");
      }
    } else updateProfileChoice();
  } catch(e) { $("createBtn").disabled = true; $("joinBtn").disabled = true; say("welcomeMessage","Connexion impossible pour le moment : "+friendlyError(e)); }
}
function friendlyError(e){ console.error(e); return e.code==="auth/operation-not-allowed"?"Active la connexion anonyme dans Firebase.":e.message||"vérifie la configuration Firebase."; }

async function createRoom(){
  if(!user) { say("welcomeMessage","La connexion au royaume se prépare encore. Attends quelques secondes puis réessaie 💗"); return; }
  if(selectedRole!=="BUBULLE"){say("welcomeMessage","Choisis Bubulle pour créer une nouvelle aventure.");return;}
  const code=inviteCode(); roomId=code; myRole="BUBULLE"; roomRef=doc(db,"rooms",roomId);
  const data={createdAt:serverTimestamp(),players:{
    BUBULLE:{uid:user.uid,score:0,stage:0,completed:[],joined:true},
    BLYBLY:{uid:null,score:0,stage:0,completed:[],joined:false}
  }};
  try { await setDoc(roomRef,data); history.replaceState({}, "", "?room="+code+"&player=BUBULLE"); enterGame(); listen(); }
  catch(e){say("welcomeMessage","Impossible de créer la partie : "+friendlyError(e));}
}
async function joinRoom(code){
  // Secours : si l'utilisateur anonyme n'est pas encore prêt sur cet appareil,
  // terminer la connexion avant de tenter de lire le salon partagé.
  if(!user){
    say("welcomeMessage","Connexion à votre royaume… 💗");
    try {
      if(auth.currentUser) user=auth.currentUser;
      else { const credential=await signInAnonymously(auth); user=credential.user; }
    } catch(error) {
      say("welcomeMessage","La connexion Firebase a échoué : "+friendlyError(error)+" Réessaie avec une connexion Internet stable.");
      return;
    }
  }
  if(selectedRole!=="BUBULLE" && selectedRole!=="BLYBLY"){say("welcomeMessage","Choisis d’abord ton profil : Bubulle ou Blybly.");return;}
  const rawInvite=String(code||"").trim();
  if(!rawInvite) {say("welcomeMessage","Colle le code ou le lien complet que Bubulle t’a envoyé.");return;}
  let normalizedInvite=rawInvite;
  try {
    if(rawInvite.startsWith("http://") || rawInvite.startsWith("https://")) normalizedInvite=new URL(rawInvite).searchParams.get("room")||"";
  } catch {}
  roomId=normalizedInvite.replace(/\s+/g,"").toUpperCase();
  if(!/^[A-F0-9]{18}$/.test(roomId)) {say("welcomeMessage","Ce code ou ce lien ne semble pas valide. Essaie de coller le lien complet d’invitation.");return;}
  roomRef=doc(db,"rooms",roomId);
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(roomRef); if(!snap.exists()) throw new Error("Cette invitation est introuvable ou expirée.");
      const data=snap.data();
      // Validate room structure before accessing either player profile.
      const players=data && data.players && typeof data.players==="object" ? data.players : null;
      const bubulle=players && players.BUBULLE && typeof players.BUBULLE==="object" ? players.BUBULLE : null;
      const blybly=players && players.BLYBLY && typeof players.BLYBLY==="object" ? players.BLYBLY : null;
      if(!bubulle || !blybly || !("uid" in bubulle) || !("uid" in blybly)){
        throw new Error("Cette salle existe, mais les profils Bubulle et Blybly sont incomplets. Aucune donnée n'a été modifiée. Vérifions la salle dans Firebase avant toute réparation.");
      }
      // Le profil est choisi explicitement. Aucun UID, score ou élément de progression n’est remplacé.
      if(selectedRole==="BUBULLE" || selectedRole==="BLYBLY"){myRole=selectedRole;return;}
      if(bubulle.uid===user.uid){myRole="BUBULLE";return;}
      if(blybly.uid===user.uid){myRole="BLYBLY";return;}
      if(bubulle.joined && bubulle.uid!==user.uid) {
        const recoverBubulle = window.confirm("Ce navigateur n'est plus reconnu.\n\nVeux-tu retrouver le profil BUBULLE et sa progression ?\n\nOK = retrouver BUBULLE. Annuler = choisir BLYBLY.");
        if(recoverBubulle) {myRole="BUBULLE";tx.update(roomRef,{"players.BUBULLE.uid":user.uid,"players.BUBULLE.joined":true});return;}
      }
      if(data.players.BLYBLY.joined && data.players.BLYBLY.uid!==user.uid) {
        const takeover = window.confirm("Veux-tu retrouver le profil BLYBLY et sa progression sur cet appareil ?\n\nSes points seront conservés. L'autre appareil ne doit pas jouer en même temps.");
        if(!takeover) throw new Error("Connexion annulée. Aucun profil n'a été modifié.");
      }
      myRole="BLYBLY";tx.update(roomRef,{"players.BLYBLY.uid":user.uid,"players.BLYBLY.joined":true});
    });
    history.replaceState({}, "", "?room="+roomId+"&player="+myRole); enterGame(); listen();
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


const gardenBeds = [{"title":"Les premiers pas","subtitle":"La graine de votre complicité","start":0,"end":9,"flower":"🌷","name":"Tulipe de l’amitié"},{"title":"La forêt des secrets","subtitle":"Les lucioles vous guident","start":10,"end":19,"flower":"🌻","name":"Tournesol de lumière"},{"title":"Le sentier des murmures","subtitle":"Les secrets prennent racine","start":20,"end":29,"flower":"🍃","name":"Feuille des secrets"},{"title":"Les jardins enchantés","subtitle":"Un bouquet de merveilles","start":30,"end":39,"flower":"🌹","name":"Rose des souvenirs"},{"title":"La roseraie magique","subtitle":"La beauté des découvertes","start":40,"end":49,"flower":"🌼","name":"Marguerite enchantée"},{"title":"Le château mystérieux","subtitle":"Les portes du royaume","start":50,"end":59,"flower":"🏵️","name":"Fleur du château"},{"title":"La galerie des énigmes","subtitle":"La curiosité vous éclaire","start":60,"end":69,"flower":"💠","name":"Fleur de cristal"},{"title":"Le royaume des cristaux","subtitle":"La magie scintille","start":70,"end":79,"flower":"🔮","name":"Orchidée de cristal"},{"title":"Le sanctuaire des Besties","subtitle":"Votre complicité grandit","start":80,"end":89,"flower":"💗","name":"Fleur du cœur"},{"title":"La légende des Besties","subtitle":"La dernière page de votre quête","start":90,"end":99,"flower":"👑","name":"Couronne des Besties"}];
function buildAdventureEvents(beforePlayers,afterPlayers,role,stageIndex){
  const now=Date.now();
  const roleName=role==="BUBULLE"?"Bubulle":"Blybly";
  const events=[{type:"riddle",icon:role==="BUBULLE"?"🧭":"🌷",title:roleName+" a résolu une épreuve",detail:"Épreuve "+(stageIndex+1)+" · "+stages[stageIndex].place,at:now}];
  const beforeBub=new Set(beforePlayers.BUBULLE.completed||[]),beforeBly=new Set(beforePlayers.BLYBLY.completed||[]);
  const afterBub=new Set(afterPlayers.BUBULLE.completed||[]),afterBly=new Set(afterPlayers.BLYBLY.completed||[]);
  if(!(beforeBub.has(stageIndex)&&beforeBly.has(stageIndex))&&afterBub.has(stageIndex)&&afterBly.has(stageIndex))
    events.push({type:"shared",icon:"💗",title:"Une épreuve réussie à deux",detail:"Vous avez découvert ensemble : "+stages[stageIndex].place,at:now+1});
  gardenBeds.forEach(bed=>{
    const ids=Array.from({length:bed.end-bed.start+1},(_,n)=>bed.start+n);
    const was=ids.every(i=>beforeBub.has(i)&&beforeBly.has(i)),is=ids.every(i=>afterBub.has(i)&&afterBly.has(i));
    if(!was&&is)events.push({type:"flower",icon:bed.flower,title:bed.name+" a éclos",detail:"Vous avez terminé « "+bed.title+" » toutes les deux.",at:now+2});
  });
  const wasLegend=stages.every((stage,i)=>beforeBub.has(i)&&beforeBly.has(i));
  const isLegend=stages.every((stage,i)=>afterBub.has(i)&&afterBly.has(i));
  if(!wasLegend&&isLegend)events.push({type:"crown",icon:"👑",title:"La légende des Besties est complète",detail:"Les 100 épreuves ont été résolues par Bubulle et Blybly.",at:now+3});
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
  $("gardenMessage").textContent=bloomed===gardenBeds.length
    ?"Votre jardin est en pleine floraison… tout comme votre belle complicité. 👑💗"
    :bloomed===0
      ?"Votre jardin attend vos premières victoires partagées… 💗"
      :bloomed+" jolie"+(bloomed>1?"s fleurs":" fleur")+" a"+(bloomed>1?"nt":"")+" déjà éclos grâce à vous deux. Continuez à faire grandir votre jardin ! ✨";
}


function renderRealmAtlas(completed){
  const atlas=$("realmAtlas");
  if(!atlas)return;
  const regions=[{"name":"La forêt enchantée","subtitle":"Le réveil des lucioles","emoji":"🌳","start":0,"end":35,"theme":"forest","guardian":"🦉","guardianName":"Luna","title":"Gardienne des lucioles","friends":["🧚","🦋","🦌"],"whisper":"Les lucioles connaissent le chemin des cœurs courageux."},{"name":"Les jardins enchantés","subtitle":"Le jardin des merveilles","emoji":"🌷","start":36,"end":51,"theme":"flowers","guardian":"🦄","guardianName":"Pétalia","title":"Gardienne des pétales","friends":["🧚","🐇","🐝"],"whisper":"Chaque fleur garde un souvenir heureux."},{"name":"Le château mystérieux","subtitle":"Les portes du royaume","emoji":"🏰","start":52,"end":67,"theme":"castle","guardian":"🦊","guardianName":"Auréline","title":"Gardienne des clés","friends":["🐈","🕊️","🧚"],"whisper":"Les plus belles portes s'ouvrent avec la curiosité."},{"name":"Le royaume des cristaux","subtitle":"Le sanctuaire des étoiles","emoji":"🌙","start":68,"end":83,"theme":"stars","guardian":"🐉","guardianName":"Astréa","title":"Gardienne des cristaux","friends":["🧚","🦋","🦉"],"whisper":"Une étoile brille pour celles et ceux qui n'abandonnent pas."},{"name":"Le sanctuaire des Besties","subtitle":"Le cœur de votre légende","emoji":"💗","start":84,"end":99,"theme":"heart","guardian":"🦢","guardianName":"Célestine","title":"Gardienne du cœur","friends":["🧚","🕊️","🦄"],"whisper":"Votre amitié est le plus précieux des sortilèges."}];
  const found=new Set(completed);
  let previousComplete=true;
  atlas.innerHTML=regions.map((region,index)=>{
    const total=region.end-region.start+1;
    const count=Array.from({length:total},(_,n)=>region.start+n).filter(i=>found.has(i)).length;
    const complete=count===total;
    const unlocked=previousComplete;
    const state=complete?"COMPLÈTE":unlocked?(count?"EN ÉVEIL":"À EXPLORER"):"SCELLÉE";
    const inhabitants=unlocked
      ? '<div class="realm-inhabitants"><div class="realm-friends" aria-label="Les petits habitants">'+region.friends.map((friend,i)=>'<span class="realm-friend friend-'+i+'">'+friend+'</span>').join("")+'</div><button type="button" class="realm-guardian" data-whisper="'+region.whisper+'" aria-label="Écouter '+region.guardianName+', '+region.title+'"><span class="guardian-creature">'+region.guardian+'</span><span><b>'+region.guardianName+'</b><small>'+region.title+'</small></span><i>✦</i></button><p class="realm-whisper" aria-live="polite"></p></div>'
      : '<div class="realm-sleeping">✧ Les habitants dorment encore… ✧</div>';
    const card='<article class="realm-card '+region.theme+' '+(complete?"realm-complete":unlocked?"realm-open":"realm-locked")+'">'+
      '<div class="realm-art" aria-hidden="true"><span class="realm-orbit"></span><span class="realm-symbol">'+(unlocked?region.emoji:"🔒")+'</span><span class="realm-spark">✦</span></div>'+
      '<div class="realm-copy"><span class="realm-state">'+state+'</span><h4>'+region.name+'</h4><p>'+region.subtitle+'</p>'+
      '<div class="realm-meter"><i style="width:'+(count/total*100)+'%"></i></div><small>'+count+' / '+total+' trésors découverts</small></div>'+
      inhabitants+(complete?'<span class="realm-seal">✧ Éclose ✧</span>':"")+'</article>';
    previousComplete=previousComplete&&complete;
    return card;
  }).join("");
  atlas.onclick=event=>{
    const button=event.target.closest(".realm-guardian");
    if(!button||!atlas.contains(button))return;
    const note=button.parentElement.querySelector(".realm-whisper");
    if(!note)return;
    note.textContent=button.dataset.whisper;
    note.classList.remove("whisper-visible");
    void note.offsetWidth;
    note.classList.add("whisper-visible");
  };
  const finished=regions.filter(r=>Array.from({length:r.end-r.start+1},(_,n)=>r.start+n).every(i=>found.has(i))).length;
  const status=$("realmAtlasStatus");
  if(status)status.textContent=finished+" / 5 régions éveillées";
}
function render(){
  const p=roomData.players;
  // Rafraîchir aussi la Fontaine à chaque snapshot Firestore :
  // les choix de l'autre appareil deviennent visibles sans fermer/réouvrir le panneau.
  renderFountainSharedState();
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
  const realm=stage>=84?"treasure":stage>=68?"crystals":stage>=52?"castle":stage>=36?"flowers":"forest";
  document.body.classList.remove("realm-forest","realm-flowers","realm-castle","realm-crystals","realm-treasure");
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
  renderRealmAtlas(mine.completed||[]);
  renderFountainSharedState();

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
  5:"Premier grand cap franchi ! La forêt entière célèbre ta persévérance. 🌟",
  10:"Dix trésors déjà ! Ton courage fait fleurir le royaume. 🌷",
  15:"Quinze découvertes ! Les gardiennes t'ouvrent un nouveau passage. 🏰",
  21:"Les 21 premières épreuves sont derrière toi : la grande quête commence ! 👑",
  40:"Quarante trésors ! Les jardins enchantés brillent de mille couleurs. 🌸",
  60:"Soixante épreuves ! Le château reconnaît ta bravoure. 🏰",
  80:"Quatre-vingts découvertes ! Les cristaux chantent ton nom. 💎",
  100:"CENT ÉPREUVES ACCOMPLIES ! La légende des Besties est éternelle. 👑💗"
};

let finalePreview = false;
function replayFinaleAnimation(){
  const chest=$("modal").querySelector(".finale-chest");
  if(!chest) return;
  chest.classList.remove("opening");
  void chest.offsetWidth;
  chest.classList.add("opening");
  startFinaleHearts();
}
function startFinaleHearts(){
  const layer=$("finaleHearts");
  if(!layer) return;
  layer.innerHTML="";
  const love=document.createElement("div");
  love.className="finale-love-message";
  love.setAttribute("aria-hidden","true");
  love.innerHTML='<span class="love-pink">L’AMOUR</span> <span class="love-white">DE</span> <span class="love-pink">MA</span> <span class="love-white">VIE</span>';
  layer.appendChild(love);
  for(let i=0;i<156;i++){
    const heart=document.createElement("span");
    const wave=Math.floor(i/26);
    const angle=(Math.PI*2*(i%26)/26)+(Math.random()-.5)*.34;
    const distance=175+Math.random()*285;
    heart.className="finale-heart";
    heart.textContent="♥";
    heart.style.color=i%2===0?"#f3a4cf":"#ffffff";
    heart.style.left="50%";
    heart.style.top="48%";
    heart.style.setProperty("--burst-x",(Math.cos(angle)*distance)+"px");
    heart.style.setProperty("--burst-y",(Math.sin(angle)*distance)+"px");
    heart.style.setProperty("--burst-rotate",(Math.random()*120-60)+"deg");
    heart.style.setProperty("--burst-size",(0.82+Math.random()*.58).toFixed(2));
    heart.style.animationDelay=(wave*.92+Math.random()*.16)+"s";
    heart.style.animationDuration=(5+Math.random()*.4)+"s";
    layer.appendChild(heart);
  }
}
function openFinale(preview=false){
  finalePreview=preview;
  $("finalePreviewNote").classList.toggle("hidden",!preview);
  const wasHidden=$("modal").classList.contains("hidden");
  $("modal").classList.remove("hidden");
  if(wasHidden) startFinaleHearts();
  replayFinaleAnimation();
}

$("finaleReplayBtn").addEventListener("click",replayFinaleAnimation);

$("finaleCelebrateBtn").addEventListener("click",()=>{$("modal").classList.add("hidden");});
const albumGroups = [{"title":"Les premiers pas","subtitle":"Les dix premières découvertes","start":0,"end":9},{"title":"La forêt des secrets","subtitle":"Les murmures et les lucioles","start":10,"end":19},{"title":"Le sentier des merveilles","subtitle":"Les secrets de la forêt profonde","start":20,"end":29},{"title":"Les jardins enchantés","subtitle":"Les fleurs et les surprises","start":30,"end":39},{"title":"La roseraie magique","subtitle":"Les couleurs du royaume","start":40,"end":49},{"title":"Le château mystérieux","subtitle":"Les portes et les énigmes","start":50,"end":59},{"title":"La galerie des mystères","subtitle":"Les salles secrètes du château","start":60,"end":69},{"title":"Le royaume des cristaux","subtitle":"Les défis de la lumière","start":70,"end":79},{"title":"Le sanctuaire des Besties","subtitle":"La force du duo","start":80,"end":89},{"title":"La légende des Besties","subtitle":"Le chemin vers la couronne","start":90,"end":99}];
function openAlbum(){
  if(!roomData) return;
  const players=roomData.players;
  $("albumProgress").innerHTML=[
    {key:"BUBULLE",name:"Bubulle",portrait:"./assets/bubulle.jpg"},
    {key:"BLYBLY",name:"Blybly",portrait:"./assets/blybly.jpg?v=20261126-blybly-princess"}
  ].map(player=>{
    const data=players[player.key];
    const count=(data.completed||[]).length;
    return `<article class="album-stat"><img class="album-stat-portrait" src="${player.portrait}" alt="Portrait de ${player.name}"><div><b>${player.name}</b><strong>${count} <small>/ 100</small></strong><em>${data.score||0} points</em></div><div class="album-progress-track"><i style="width:${Math.min(100,count/100*100)}%"></i></div></article>`;
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
  $("albumDuoPhrase").textContent=discoveredCount===100
    ?"Les 100 secrets ont été révélés : votre légende est complète !"
    :sharedCount>0
      ? "Chaque énigme partagée ajoute une nouvelle page à votre belle histoire."
      : "Votre album attend ses premiers souvenirs : l’aventure ne fait que commencer.";
  const officialChapters=albumGroups.slice(1);
  const memoryCards=officialChapters.map((group,index)=>{
    const complete=Array.from({length:group.end-group.start+1},(_,offset)=>group.start+offset)
      .every(stageIndex=>bubulleDone.has(stageIndex)&&blyblyDone.has(stageIndex));
    const flowers=["🌸","🌷","🌼","🌺","🌹","🏵️","💠","🔮","💗"];
    return {icon:flowers[index],title:group.title.replace(/^Chapitre \d+ · /,""),detail:complete?"Souvenir révélé à deux":"À révéler en terminant ce chapitre ensemble",unlocked:complete,kind:"flower"};
  });
  memoryCards.push({icon:"💗",title:"Le cœur des Besties",detail:sharedCount>0?sharedCount+" énigme(s) réussie(s) ensemble":"À débloquer avec votre première énigme commune",unlocked:sharedCount>0,kind:"heart",count:sharedCount});
  const crownUnlocked=stages.every((stage,index)=>bubulleDone.has(index)&&blyblyDone.has(index));
  memoryCards.push({icon:"👑",title:"La couronne légendaire",detail:crownUnlocked?"Les 100 épreuves terminées par vous deux !":"Le trésor ultime : les 100 épreuves terminées à deux",unlocked:crownUnlocked,kind:"crown"});
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
    {key:"crown",icon:"👑",title:"La couronne légendaire",detail:"Le grand trésor apparaît lorsque les 100 épreuves sont terminées à deux.",unlocked:crownUnlocked,art:"crown"}
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
      {at:1,icon:"✨",label:"Première étincelle",detail:"Réussir une première épreuve"},
      {at:10,icon:"🌱",label:"Première floraison",detail:"Réussir 10 épreuves"},
      {at:21,icon:"🌲",label:"Exploratrice",detail:"Réussir 21 épreuves"},
      {at:40,icon:"🌷",label:"Jardinière royale",detail:"Réussir 40 épreuves"},
      {at:60,icon:"🏰",label:"Gardienne du château",detail:"Réussir 60 épreuves"},
      {at:80,icon:"💎",label:"Maîtresse des cristaux",detail:"Réussir 80 épreuves"},
      {at:100,icon:"👑",label:"Légende du royaume",detail:"Réussir les 100 épreuves"}
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
      <div class="kingdom-scoreline"><strong>${score}</strong><span>points gagnés</span><b>${count} / 100</b></div>
      <div class="kingdom-progress"><i style="width:${percent}%"></i></div>
      <p class="kingdom-next">${next}</p>
      <div class="kingdom-achievements"><b>Ses badges personnels · ${earned.length}/${milestones.length}</b><div class="kingdom-badge-grid">${milestones.map(m=>'<article class="kingdom-badge '+(count>=m.at?'earned':'locked')+'"><span>'+m.icon+'</span><b>'+m.label+'</b><small>'+(count>=m.at?'Débloqué':m.detail)+'</small></article>').join("")}</div></div>
      <div class="kingdom-treasures"><b>Sa collection de trésors <small>(${count})</small></b><ul>${treasures}</ul></div>
      <p class="kingdom-presence">${data.joined?"✦ Présente dans l’aventure":"✧ Attend de rejoindre le royaume"}</p>
    </article>`;
  }).join("");
  const sharedCompleted=[...(roomData.players.BUBULLE.completed||[])].filter(i=>(roomData.players.BLYBLY.completed||[]).includes(i));
  const sharedCount=sharedCompleted.length;
  const sharedBadges=[
    {at:1,icon:"💗",title:"Premier secret à deux",detail:"Réussir ensemble une même épreuve"},
    {at:10,icon:"🌷",title:"Duo en fleurs",detail:"Réussir 10 épreuves ensemble"},
    {at:25,icon:"🦋",title:"Complices légendaires",detail:"Réussir 25 épreuves ensemble"},
    {at:50,icon:"🌟",title:"Étoiles jumelles",detail:"Réussir 50 épreuves ensemble"},
    {at:75,icon:"💎",title:"Âmes aventurières",detail:"Réussir 75 épreuves ensemble"},
    {at:100,icon:"👑",title:"Légende des Besties",detail:"Terminer les 100 épreuves toutes les deux"}
  ];
  const sharedRoot=$("kingdomSharedBadges");
  if(sharedRoot) sharedRoot.innerHTML='<div class="kingdom-shared-heading"><span>♡</span><div><b>Les badges du duo</b><small>'+sharedCount+' énigme(s) réussie(s) ensemble</small></div><span>♡</span></div><div class="kingdom-shared-grid">'+sharedBadges.map(b=>'<article class="kingdom-badge '+(sharedCount>=b.at?'earned':'locked')+'"><span>'+b.icon+'</span><b>'+b.title+'</b><small>'+(sharedCount>=b.at?'Débloqué à deux':b.detail)+'</small></article>').join("")+'</div>';
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



/* Bibliothèque des secrets — contenu autonome, sans sauvegarde ni écriture Firebase */
const secretLibraryBooks = [
{id:"douceur",category:"Mots doux",icon:"💗",title:"La douceur des petites choses",pages:["Il existe des présences qui rendent les journées plus légères sans même avoir besoin de faire de grands gestes. Un mot, un sourire ou une pensée peuvent devenir de véritables trésors.","Que ce grimoire rappelle à Bubulle et Blybly que les petites attentions ont parfois la plus grande magie. Les plus beaux liens se nourrissent de douceur, un instant après l’autre."]},
{id:"etoile",category:"Mots doux",icon:"🌟",title:"Une étoile rien qu’à toi",pages:["Même lorsque le ciel semble immense, chaque étoile trouve sa place. Certaines brillent doucement, d’autres illuminent tout un paysage.","Et puis il y a ces étoiles particulières : celles dont la lumière donne envie de sourire. Puisses-tu toujours te souvenir de la belle lumière que tu apportes autour de toi."]},
{id:"fleur",category:"Mots doux",icon:"🌷",title:"Fleurir à son rythme",pages:["Une fleur ne se presse jamais pour éclore. Elle prend le temps qu’il lui faut, traverse les saisons et s’ouvre quand le moment est venu.","Alors, n’oublie jamais : tu as le droit d’avancer à ton rythme, de te reposer, de recommencer et de fleurir à ta manière."]},
{id:"foret",category:"Petites légendes",icon:"🌲",title:"La forêt des deux lumières",pages:["On raconte qu’au cœur d’une forêt vivaient deux petites lumières. Chacune suivait son sentier, mais leurs éclats se reconnaissaient au loin.","Un soir, elles découvrirent qu’en éclairant le même chemin, elles faisaient apparaître des merveilles invisibles jusque-là. Depuis, la forêt garde la trace de leurs pas lumineux."]},
{id:"cle",category:"Petites légendes",icon:"🗝️",title:"La clé du château",pages:["Dans une tour oubliée reposait une clé dorée. Elle n’ouvrait ni coffre ni porte ordinaire : elle révélait les endroits où se cachaient les plus beaux souvenirs.","La clé ne choisissait pas les plus courageux, mais ceux qui savaient regarder avec le cœur. Et chaque fois qu’elle tournait, une nouvelle page s’écrivait."]},
{id:"lucioles",category:"Petites légendes",icon:"✨",title:"Le secret des lucioles",pages:["Les lucioles de la vallée avaient un drôle de pouvoir : elles recueillaient les rires, les vœux et les pensées que l’on n’osait pas toujours prononcer.","Quand la nuit tombait, elles se rassemblaient pour former un ciel miniature. Les anciens disaient que chaque lumière était un petit bonheur qui refusait de s’éteindre."]},
{id:"courage",category:"Confidences enchantées",icon:"🦋",title:"Les jours sans soleil",pages:["Il y aura parfois des jours plus lourds, des moments où l’on doute ou où l’on manque d’élan. Cela ne retire rien à la valeur de la personne que l’on est.","Même les ailes les plus délicates ont besoin de repos. Tu n’as pas à être forte à chaque instant : tu peux souffler, demander de la douceur et reprendre ton envol quand tu le souhaites."]},
{id:"merci",category:"Confidences enchantées",icon:"🕊️",title:"Un merci tout simple",pages:["Merci pour les instants spontanés, les conversations qui s’étirent, les fous rires inattendus et ces petits détails qui rendent une journée différente.","Ce livre ne cherche pas à enfermer les souvenirs dans des phrases parfaites. Il veut simplement leur offrir une place, pour qu’ils puissent être retrouvés avec tendresse."]},
{id:"voeu",category:"Confidences enchantées",icon:"👑",title:"Le vœu des Besties",pages:["Si la bibliothèque pouvait exaucer un seul vœu, elle choisirait de préserver les instants précieux, de faire grandir les projets qui font sourire et d’apporter de la lumière aux jours gris.","Et sur la dernière page, elle écrirait ceci : que Bubulle et Blybly continuent de découvrir, d’imaginer et de rire, chacune à sa façon, avec toujours un peu de magie dans les poches. 💗"]}
];
let openedLibraryBook=null,libraryPageIndex=0;
function renderLibraryShelves(){
[["Mots doux","libraryBooksSweet"],["Petites légendes","libraryBooksLegends"],["Confidences enchantées","libraryBooksWhispers"]].forEach(([category,target])=>{$(target).innerHTML=secretLibraryBooks.filter(book=>book.category===category).map(book=>'<button class="library-book" type="button" data-library-book="'+book.id+'"><span class="library-book-icon">'+book.icon+'</span><strong>'+book.title+'</strong><small>Ouvrir le grimoire</small></button>').join("");});
}
function showLibraryPage(){
if(!openedLibraryBook)return;
$("libraryBookCategory").textContent=openedLibraryBook.category.toUpperCase();$("libraryBookIcon").textContent=openedLibraryBook.icon;$("libraryBookTitle").textContent=openedLibraryBook.title;$("libraryBookText").textContent=openedLibraryBook.pages[libraryPageIndex];$("libraryPageCount").textContent="Page "+(libraryPageIndex+1)+" / "+openedLibraryBook.pages.length;$("libraryPreviousPage").disabled=libraryPageIndex===0;$("libraryNextPage").textContent=libraryPageIndex===openedLibraryBook.pages.length-1?"Revenir aux étagères":"Tourner la page →";
}
function closeSecretLibraryBook(){openedLibraryBook=null;$("libraryReading").classList.add("hidden");$("libraryShelves").classList.remove("hidden");}
function openSecretLibraryBook(bookId){openedLibraryBook=secretLibraryBooks.find(book=>book.id===bookId)||null;if(!openedLibraryBook)return;libraryPageIndex=0;$("libraryShelves").classList.add("hidden");$("libraryReading").classList.remove("hidden");showLibraryPage();}
const secretLibraryModal=$("secretLibraryModal");
$("secretLibraryBtn").addEventListener("click",()=>{renderLibraryShelves();closeSecretLibraryBook();secretLibraryModal.classList.remove("hidden");});
$("secretLibraryClose").addEventListener("click",()=>secretLibraryModal.classList.add("hidden"));
secretLibraryModal.addEventListener("click",event=>{if(event.target===secretLibraryModal)secretLibraryModal.classList.add("hidden");});
$("libraryShelves").addEventListener("click",event=>{const book=event.target.closest("[data-library-book]");if(book)openSecretLibraryBook(book.dataset.libraryBook);});
$("libraryBackToShelves").addEventListener("click",closeSecretLibraryBook);
$("libraryPreviousPage").addEventListener("click",()=>{if(!openedLibraryBook||libraryPageIndex<=0)return;libraryPageIndex--;showLibraryPage();});
$("libraryNextPage").addEventListener("click",()=>{if(!openedLibraryBook)return;if(libraryPageIndex<openedLibraryBook.pages.length-1){libraryPageIndex++;showLibraryPage();}else closeSecretLibraryBook();});


/* Observatoire des Besties — expérience visuelle autonome, sans sauvegarde ni écriture Firebase */
const observatoryMessages = {
  bubulle:{icon:"💗",title:"L’étoile de Bubulle",text:"Une lumière qui avance avec son propre éclat. Cette étoile rappelle que même les plus beaux royaumes commencent par une étincelle de curiosité."},
  blybly:{icon:"🌷",title:"L’étoile de Blybly",text:"Une lumière douce et singulière. Elle rappelle qu’une présence peut embellir le ciel autour d’elle, simplement en restant elle-même."},
  duo:{icon:"♡",title:"La constellation des Besties",text:"Deux étoiles n’ont pas besoin de se ressembler pour dessiner ensemble une constellation unique. Leur lien devient un chemin lumineux dans la nuit."}
};
const observatoryModal=$("observatoryModal");
$("observatoryOpenBtn").addEventListener("click",()=>observatoryModal.classList.remove("hidden"));
$("observatoryCloseBtn").addEventListener("click",()=>observatoryModal.classList.add("hidden"));
observatoryModal.addEventListener("click",event=>{if(event.target===observatoryModal)observatoryModal.classList.add("hidden");});
observatoryModal.querySelector(".observatory-constellation").addEventListener("click",event=>{
  const star=event.target.closest("[data-observatory-note]");
  if(!star)return;
  const note=observatoryMessages[star.dataset.observatoryNote];
  if(!note)return;
  observatoryModal.querySelectorAll(".constellation-star").forEach(item=>item.classList.toggle("selected",item===star));
  spawnObservatoryBurst(star, 15);
  $("observatoryNoteIcon").textContent=note.icon;
  $("observatoryNoteTitle").textContent=note.title;
  $("observatoryNoteText").textContent=note.text;
});
const observatoryWishes=[
  "Que les jours à venir vous réservent de belles surprises et de grands éclats de rire. ✨",
  "Que vos projets trouvent leur chemin et que vos petites victoires brillent longtemps. 🌟",
  "Que la douceur vous accompagne, même lorsque le ciel se couvre. 💗",
  "Que votre imagination ne manque jamais d’étoiles où accrocher ses rêves. 🌙",
  "Que chaque nouveau chapitre apporte son lot de magie et de merveilleux souvenirs. 🌷"
];
function spawnObservatoryBurst(origin, count=18) {
  const sky=observatoryModal.querySelector(".observatory-sky");
  const skyRect=sky.getBoundingClientRect();
  const rect=origin.getBoundingClientRect();
  const x=rect.left+rect.width/2-skyRect.left;
  const y=rect.top+rect.height/2-skyRect.top;
  for(let i=0;i<count;i++){
    const particle=document.createElement("span");
    particle.className="observatory-burst-particle";
    particle.textContent=["✦","✧","·","♡","✴"][i%5];
    particle.style.setProperty("--burst-x",(Math.cos(i/count*Math.PI*2)*(24+Math.random()*65))+"px");
    particle.style.setProperty("--burst-y",(Math.sin(i/count*Math.PI*2)*(24+Math.random()*65))+"px");
    particle.style.left=x+"px";
    particle.style.top=y+"px";
    particle.style.animationDelay=(Math.random()*.18)+"s";
    sky.appendChild(particle);
    particle.addEventListener("animationend",()=>particle.remove(),{once:true});
  }
}
$("observatoryWishBtn").addEventListener("click",()=>{
  const message=observatoryWishes[Math.floor(Math.random()*observatoryWishes.length)];
  $("observatoryWishMessage").textContent=message;
  $("observatoryWishMessage").classList.remove("wish-reveal");
  void $("observatoryWishMessage").offsetWidth;
  $("observatoryWishMessage").classList.add("wish-reveal");
  spawnObservatoryBurst($("observatoryWishBtn"),26);
});


/* Fontaine des vœux — choix synchronisés entre les deux profils */
const fountainModal=$("fountainModal");
const fountainWishTexts={
  duo:["Que votre complicité garde toujours une place pour les rires, les surprises et les petits bonheurs inattendus. 💗","Que deux chemins continuent de se croiser sous les plus belles étoiles, avec douceur et confiance. ✨","Que votre amitié reste un refuge lumineux, même lorsque les saisons changent. 🌷","Que vos souvenirs deviennent des trésors qui réchauffent le cœur, même à distance. 💞","Que rien n’efface cette magie rare qui rend votre duo si précieux. 🫶"],
  bonheur:["Que les journées ordinaires se remplissent de petits instants extraordinaires. 🌸","Que la joie trouve toujours une fenêtre ouverte pour entrer dans votre vie. ☀️","Que chaque matin apporte une raison nouvelle de sourire. 🦋","Que les éclats de rire arrivent souvent sans prévenir et durent longtemps. 🎀","Que la douceur vous accompagne jusque dans les jours les plus simples. 🌼"],
  reve:["Qu’un rêve longtemps gardé dans le cœur trouve enfin son chemin vers la lumière. 🌟","Que l’audace accompagne vos envies et que chaque étape vous rapproche de ce qui vous fait vibrer. ✨","Que l’imagination ouvre des portes là où l’on ne voyait que des murs. 🌙","Qu’une aventure inattendue vous mène vers un endroit dont vous n’osiez même pas rêver. 🗝️","Que vos projets les plus fous trouvent le courage de devenir réalité. 💫"],
  courage:["Que la force revienne doucement, un pas après l’autre, chaque fois que vous en avez besoin. 🦋","Que les jours difficiles n’éteignent jamais la petite lumière qui vous guide. 💜","Que la confiance grandisse à chaque victoire, même la plus discrète. 🌷","Que vous trouviez en vous la force de recommencer autant de fois qu’il le faudra. 🌱","Que chaque épreuve révèle un peu plus la force que vous portez déjà. 🕊️"]
};
const fountainCategories=[
  {id:"duo",title:"Pour votre duo",icon:"💗",hint:"Une pensée pour votre belle complicité"},
  {id:"bonheur",title:"Pour le bonheur",icon:"🌷",hint:"Invitez la joie dans vos journées"},
  {id:"reve",title:"Pour un rêve",icon:"✨",hint:"Ouvrez une porte vers demain"},
  {id:"courage",title:"Pour le courage",icon:"🦋",hint:"Une lumière pour les jours plus difficiles"}
];
const fountainChoices=$("fountainWishChoices");
const fountainReleaseBtn=$("fountainWishBtn");
const fountainResetBtn=$("fountainResetBtn");
const fountainOwnCount=$("fountainSelectionCount");
const fountainReveal=$("fountainWishReveal");
let fountainRevealing=false;
let fountainLastChoicesSignature=null,fountainLastRevealToken=null;
function fountainRoleName(role){return role==="BUBULLE"?"Bubulle":"Blybly";}
function fountainRoleCount(role){
  const chosen=roomData?.fountainWishes?.[role]||{};
  return fountainCategories.filter(category=>Number.isInteger(chosen[category.id])&&chosen[category.id]>=0&&chosen[category.id]<fountainWishTexts[category.id].length).length;
}
function renderFountainChoices(){
  fountainChoices.innerHTML=fountainCategories.map(category=>`
    <section class="fountain-choice-group" data-category="${category.id}">
      <div class="fountain-choice-heading"><span>${category.icon}</span><div><h4>${category.title}</h4><p>${category.hint}</p></div><small>1 vœu</small></div>
      <div class="fountain-choice-options">${fountainWishTexts[category.id].map((wish,index)=>`
        <button type="button" class="fountain-choice-option" data-wish-kind="${category.id}" data-wish-index="${index}" aria-pressed="false"><span class="choice-star">✧</span><span>${wish}</span></button>
      `).join("")}</div>
    </section>`).join("");
}
renderFountainChoices();
function renderFountainSharedState(){
  if(!roomData||!myRole||!fountainChoices)return;
  const all=roomData.fountainWishes||{};
  const signature=["BUBULLE","BLYBLY"].map(role=>fountainCategories.map(category=>all[role]?.[category.id]??"-").join(",")).join("|");
  if(fountainLastChoicesSignature!==null&&signature!==fountainLastChoicesSignature){
    fountainRevealing=false;
    fountainReveal.innerHTML='<span class="fountain-reveal-icon">💧</span><p>Les choix ont changé. La révélation attend que vous soyez prêtes à nouveau. 💗</p>';
    fountainReleaseBtn.innerHTML='<span>✧</span> Révéler nos huit vœux <span>✧</span>';
  }
  fountainLastChoicesSignature=signature;
  const mine=all[myRole]||{};
  const ownCount=fountainRoleCount(myRole);
  fountainChoices.querySelectorAll("[data-wish-kind]").forEach(button=>{
    const selected=Number(mine[button.dataset.wishKind])===Number(button.dataset.wishIndex);
    button.classList.toggle("selected",selected);
    button.setAttribute("aria-pressed",String(selected));
  });
  fountainOwnCount.textContent=ownCount+" / 4 vœux choisis par "+fountainRoleName(myRole);
  fountainResetBtn.disabled=ownCount===0;
  const otherRole=myRole==="BUBULLE"?"BLYBLY":"BUBULLE";
  const bothReady=fountainRoleCount("BUBULLE")===4&&fountainRoleCount("BLYBLY")===4;
  $("fountainSharedStatus").textContent=bothReady
    ?"Les huit vœux sont réunis ! La révélation peut commencer. ✨"
    :fountainRoleName("BUBULLE")+" : "+fountainRoleCount("BUBULLE")+"/4 · "+fountainRoleName("BLYBLY")+" : "+fountainRoleCount("BLYBLY")+"/4";
  $("fountainSharedPreview").innerHTML=["BUBULLE","BLYBLY"].map(role=>{
    const chosen=all[role]||{};
    return '<section class="fountain-player-wishes '+(role===myRole?"is-mine":"")+'"><h4>'+ (role==="BUBULLE"?"💗 Bubulle":"🌷 Blybly")+(role===myRole?" · Moi":"")+'</h4><ul>'+
      fountainCategories.map(category=>{
        const index=chosen[category.id];
        const valid=Number.isInteger(index)&&index>=0&&index<fountainWishTexts[category.id].length;
        return '<li><b>'+category.icon+' '+category.title+'</b><span>'+(valid?fountainWishTexts[category.id][index]:"En attente de son choix…")+'</span></li>';
      }).join("")+'</ul></section>';
  }).join("");
  fountainReleaseBtn.disabled=!bothReady||fountainRevealing;
  const revealToken=roomData.fountainRevealAt||null;
  if(revealToken&&revealToken!==fountainLastRevealToken){
    fountainLastRevealToken=revealToken;
    if(bothReady)showFountainReveal();
  }
}
$("fountainOpenBtn").addEventListener("click",()=>{renderFountainSharedState();fountainModal.classList.remove("hidden");});
$("fountainCloseBtn").addEventListener("click",()=>fountainModal.classList.add("hidden"));
fountainModal.addEventListener("click",event=>{if(event.target===fountainModal)fountainModal.classList.add("hidden");});
fountainChoices.addEventListener("click",async event=>{
  const choice=event.target.closest("[data-wish-kind]");if(!choice||!roomRef||!myRole)return;
  const kind=choice.dataset.wishKind,index=Number(choice.dataset.wishIndex);
  if(!fountainWishTexts[kind]||!Number.isInteger(index)||index<0||index>=fountainWishTexts[kind].length)return;
  fountainChoices.querySelectorAll(`[data-wish-kind="${kind}"]`).forEach(item=>{
    const active=item===choice;item.classList.toggle("selected",active);item.setAttribute("aria-pressed",String(active));
  });
  fountainReveal.innerHTML='<span class="fountain-reveal-icon">💧</span><p>Enregistrement du vœu dans votre partie…</p>';
  fountainRevealing=false;
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(roomRef);
      if(!snap.exists())throw new Error("La partie est introuvable.");
      const data=snap.data();
      if(data.players?.[myRole]?.uid!==user?.uid)throw new Error("Ce profil n’est plus associé à cet appareil. Reconnecte-toi à la bonne place.");
      const current=data.fountainWishes||{};
      const own={...(current[myRole]||{}),[kind]:index};
      tx.update(roomRef,{fountainWishes:{...current,[myRole]:own}});
    });
    say("fountainSharedStatus","✓ Vœu enregistré dans Firebase pour "+fountainRoleName(myRole)+" · Partie "+roomId+" ✨");
  }catch(error){
    console.error("Fontaine — enregistrement impossible",error);
    say("fountainSharedStatus","ÉCHEC de synchronisation : "+(error.message||"réessaie."));
    fountainReveal.innerHTML='<span class="fountain-reveal-icon">⚠️</span><p>Ce vœu n’a pas été enregistré. Vérifie la connexion et réessaie.</p>';
    renderFountainSharedState();
  }
});
$("fountainResetBtn").addEventListener("click",async()=>{
  if(!roomRef||!myRole)return;
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(roomRef);
      if(!snap.exists())throw new Error("La partie est introuvable.");
      const data=snap.data();
      if(data.players?.[myRole]?.uid!==user?.uid)throw new Error("Ce profil n’est plus associé à cet appareil.");
      const current=data.fountainWishes||{};
      const own={...(current[myRole]||{})};
      fountainCategories.forEach(category=>delete own[category.id]);
      tx.update(roomRef,{fountainWishes:{...current,[myRole]:own},fountainRevealAt:null});
    });
    fountainRevealing=false;
    fountainLastRevealToken=null;
    fountainReveal.innerHTML='<span class="fountain-reveal-icon">💧</span><p>Tes quatre choix ont été effacés. Tu peux recommencer quand tu veux. 💗</p>';
    $("fountainWishBtn").innerHTML='<span>✧</span> Révéler nos huit vœux <span>✧</span>';
    say("fountainSharedStatus","Tes choix ont été réinitialisés dans la partie. 💗");
  }catch(error){
    console.error("Fontaine — réinitialisation impossible",error);
    say("fountainSharedStatus","ÉCHEC de réinitialisation : "+(error.message||"réessaie."));
  }
});

function fountainWishBurst(){
  const scene=$("fountainScene"),rect=scene.getBoundingClientRect(),originX=rect.width/2,originY=rect.height*.68;
  scene.classList.remove("fountain-casting");void scene.offsetWidth;scene.classList.add("fountain-casting");
  const flash=document.createElement("span");flash.className="fountain-cast-flash";scene.appendChild(flash);
  flash.addEventListener("animationend",()=>flash.remove(),{once:true});
  for(let ring=0;ring<5;ring++){
    const ripple=document.createElement("span");ripple.className="fountain-cast-ring";
    ripple.style.left=originX+"px";ripple.style.top=originY+"px";ripple.style.animationDelay=(ring*.16)+"s";
    scene.appendChild(ripple);ripple.addEventListener("animationend",()=>ripple.remove(),{once:true});
  }
  const symbols=["✦","✧","♡","✿","·","💫","🌸","✨","❋","⋆"];
  for(let i=0;i<110;i++){
    const angle=(i/110)*Math.PI*2+(Math.random()-.5)*.22,distance=65+Math.random()*210;
    const particle=document.createElement("span");particle.className="fountain-wish-particle";particle.textContent=symbols[i%symbols.length];
    particle.style.left=originX+"px";particle.style.top=originY+"px";
    particle.style.setProperty("--particle-x",(Math.cos(angle)*distance)+"px");
    particle.style.setProperty("--particle-y",(Math.sin(angle)*distance*.72-35)+"px");
    particle.style.animationDelay=(Math.random()*.55)+"s";scene.appendChild(particle);
    particle.addEventListener("animationend",()=>particle.remove(),{once:true});
  }
  window.setTimeout(()=>scene.classList.remove("fountain-casting"),3200);
}
function showFountainReveal(){
  if(fountainRoleCount("BUBULLE")!==4||fountainRoleCount("BLYBLY")!==4||fountainRevealing)return;
  fountainRevealing=true;fountainReleaseBtn.disabled=true;
  const all=roomData.fountainWishes||{};
  const scene=$("fountainScene");
  scene.classList.remove("fountain-grand-finale");
  scene.querySelector(".fountain-heart-sky")?.remove();
  fountainReveal.innerHTML='<div class="fountain-reveal-heading">✧ LE GRAND RITUEL DES HUIT VŒUX ✧</div><p class="fountain-ceremony-intro">La fontaine ouvre ses eaux… vos huit lumières vont rejoindre le ciel.</p><div class="fountain-revealed-list"></div><p class="fountain-final-blessing">Deux cœurs, huit souhaits… que la magie vous accompagne. 💗</p>';
  const list=fountainReveal.querySelector(".fountain-revealed-list");
  fountainReveal.classList.remove("revealed");void fountainReveal.offsetWidth;fountainReveal.classList.add("revealed");
  fountainWishBurst();
  const sequence=["BUBULLE","BLYBLY"].flatMap(role=>fountainCategories.map(category=>({role,category,index:all[role][category.id]})));
  sequence.forEach((entry,index)=>{
    window.setTimeout(()=>{
      const item=document.createElement("article");item.className="fountain-revealed-wish";
      item.innerHTML='<span class="fountain-revealed-category"></span><p></p>';
      item.querySelector(".fountain-revealed-category").textContent=(entry.role==="BUBULLE"?"💗 Bubulle":"🌷 Blybly")+" · "+entry.category.icon+" "+entry.category.title;
      item.querySelector("p").textContent=fountainWishTexts[entry.category.id][entry.index];
      list.appendChild(item);
      if(index===sequence.length-1){
        const scene=$("fountainScene");
        const heart=document.createElement("div");
        heart.className="fountain-heart-sky";
        heart.innerHTML='<span class="fountain-heart-symbol">♥</span><span class="fountain-heart-star star-a">✦</span><span class="fountain-heart-star star-b">✧</span><span class="fountain-heart-star star-c">✧</span><p>DEUX CŒURS, HUIT VŒUX…</p>';
        scene.appendChild(heart);
        window.setTimeout(()=>scene.classList.add("fountain-grand-finale"),350);
        fountainReveal.querySelector(".fountain-final-blessing").textContent="Une seule constellation. Que vos rêves trouvent toujours leur chemin vers la lumière. 💗";
        fountainReleaseBtn.innerHTML='<span>✧</span> Revoir le rituel des huit vœux <span>✧</span>';
      }
    },950+index*1500);
  });
  window.setTimeout(()=>{fountainRevealing=false;renderFountainSharedState();},20500);
}
fountainReleaseBtn.addEventListener("click",async()=>{
  if(fountainRoleCount("BUBULLE")!==4||fountainRoleCount("BLYBLY")!==4||fountainRevealing)return;
  fountainReleaseBtn.disabled=true;
  try{await updateDoc(roomRef,{fountainRevealAt:Date.now()});}
  catch(error){fountainRevealing=false;renderFountainSharedState();say("fountainSharedStatus","La révélation n’a pas pu démarrer : "+(error.message||"réessaie."));}
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
  if(stages.every((stage,index)=>bubulle.has(index)&&blybly.has(index))) unlocked.push({id:"crown",title:"Votre légende est complète !",message:"Les 100 épreuves sont terminées par vous deux. La couronne légendaire vous appartient ! 👑"});
  return unlocked;
}

const chapterGateways = {
  5:{icon:"🌲",message:"Les lucioles éclairent le sentier et les arbres murmurent vos premiers secrets. Ouvrez grand les yeux : la forêt vous attend."},
  9:{icon:"🏰",message:"Au bout du sentier, les portes du château s’entrouvrent. De nouveaux mystères et de belles surprises vous attendent derrière ses murs."},
  13:{icon:"🔮",message:"Une lueur rose et violette traverse le royaume. Les cristaux enchantés vous appellent : suivez leur lumière pour poursuivre votre quête."},
  17:{icon:"👑",message:"Le dernier chemin s’illumine. Le trésor des Besties se rapproche… Encore quelques énigmes avant votre grande légende."},
  21:{icon:"🌲",message:"La forêt profonde vous ouvre ses chemins secrets. Soixante-dix-neuf nouvelles épreuves vous attendent !"},
  36:{icon:"🌷",message:"Les jardins enchantés s'éveillent. Écoutez les fleurs et suivez les papillons !"},
  52:{icon:"🏰",message:"Les portes du château des mystères s'ouvrent devant vous. À vous les énigmes royales !"},
  68:{icon:"🔮",message:"Le royaume des cristaux vous appelle. Les défis deviennent étincelants !"},
  84:{icon:"💗",message:"Bienvenue au sanctuaire des Besties. Votre grande légende approche !"}
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
      const snap=await tx.get(roomRef);
      if(!snap.exists()) throw new Error("La partie est introuvable.");
      const data=snap.data();
      const beforePlayers=data.players||{};
      const player={...(beforePlayers[myRole]||{})};
      player.completed=Array.isArray(player.completed)?player.completed:[];
      player.score=Number(player.score)||0;
      player.stage=Number(player.stage)||0;
      if(player.completed.includes(stageIndex))return;
      const before=getUnlockedMemories(beforePlayers);
      player.completed=[...player.completed,stageIndex];
      player.score+=10;
      player.stage=Math.max(player.stage,stageIndex+1);
      const updatedPlayers={...beforePlayers,[myRole]:player};
      const after=getUnlockedMemories(updatedPlayers);
      newlyUnlocked=after.filter(item=>!before.some(old=>old.id===item.id));
      const newEvents=buildAdventureEvents(beforePlayers,updatedPlayers,myRole,stageIndex);
      const adventureLog=[...(data.adventureLog||[]),...newEvents].slice(-100);
      tx.update(roomRef,{players:updatedPlayers,adventureLog});
    });
    pendingMemoryCelebrations.push(...newlyUnlocked);
    const nextStage=stageIndex+1;
    if(chapterGateways[nextStage]){
      const gatewayEnds={5:8,9:12,13:16,17:20,21:35,36:51,52:67,68:83,84:99};
      const groupEnd=gatewayEnds[nextStage]??Math.min(nextStage+9,stages.length-1);
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
async function saveGame(){
  const button=$("saveGameBtn");
  if(!user||!roomRef||!myRole){
    say("syncStatus","● Aucune partie active à sauvegarder");
    return;
  }
  const original=button.textContent;
  button.disabled=true;
  button.textContent="⏳ Sauvegarde…";
  try{
    const verified=await runTransaction(db,async tx=>{
      const snap=await tx.get(roomRef);
      if(!snap.exists())throw new Error("La partie est introuvable.");
      const data=snap.data();
      const player=data.players?.[myRole];
      if(!player)throw new Error("Le profil de cette partie est introuvable.");
      tx.update(roomRef,{lastSavedAt:serverTimestamp(),lastSavedBy:myRole});
      return {score:Number(player.score)||0,stage:Number(player.stage)||0,completed:Array.isArray(player.completed)?player.completed.length:0};
    });
    button.textContent="✓ Progression vérifiée";
    say("syncStatus","● Progression confirmée : "+verified.score+" points · "+verified.completed+" épreuve(s) validée(s) 💗");
  }catch(e){
    button.textContent=original;
    say("syncStatus","● Sauvegarde impossible : "+friendlyError(e));
  }finally{
    button.disabled=false;
  }
}
$("saveGameBtn").addEventListener("click",saveGame);

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
  },3400);
});
$("backHomeBtn").addEventListener("click",()=>{hide("connection");show("welcome");});
$("createBtn").addEventListener("click",createRoom);
$("joinBtn").addEventListener("click",()=>joinRoom($("inviteInput").value));
function updateProfileChoice(){
  document.querySelectorAll(".profile-choice-button").forEach(button=>{
    const active=button.dataset.role===selectedRole;
    button.classList.toggle("selected",active);
    button.setAttribute("aria-pressed",active?"true":"false");
  });
  const status=$("profileChoiceStatus");
  if(status) status.textContent=selectedRole==="BUBULLE"?"Profil sélectionné : Bubulle.":selectedRole==="BLYBLY"?"Profil sélectionné : Blybly.":"Sélectionne un profil pour continuer.";
}
function chooseProfile(role){
  if(role!=="BUBULLE" && role!=="BLYBLY") return;
  selectedRole=role;
  localStorage.setItem("bbSelectedRole",role);
  updateProfileChoice();
  if(roomId) joinRoom(roomId);
  else if(roomFromUrl) joinRoom(roomFromUrl);
}
$("chooseBubulle").addEventListener("click",()=>chooseProfile("BUBULLE"));
$("chooseBlybly").addEventListener("click",()=>chooseProfile("BLYBLY"));
$("inviteInput").addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom($("inviteInput").value)});
$("copyInviteBtn").addEventListener("click",async()=>{
  const url=location.origin+location.pathname+"?room="+roomId+"&player="+(myRole||selectedRole||"BUBULLE");
  try{await navigator.clipboard.writeText(url);say("syncStatus","Invitation copiée ! Envoie-la à Blybly.");}
  catch{prompt("Copie ce lien et envoie-le à Blybly :",url);}
});
$("hintBtn").addEventListener("click",()=>{const stage=Math.min(roomData.players[myRole].stage,stages.length-1);$("hint").textContent="💡 "+stages[stage].hint;show("hint")});
$("nextBtn").addEventListener("click",()=>render());
$("profileSwitchBtn").addEventListener("click",()=>{
  if(unsubscribe){unsubscribe();unsubscribe=null;}
  myRole=null;
  history.replaceState({},"","?room="+roomId);
  hide("game");show("connection");
  say("welcomeMessage","Choisis le profil que tu souhaites utiliser sur cet appareil.");
  updateProfileChoice();
});
$("leaveBtn").addEventListener("click",()=>{if(unsubscribe)unsubscribe();history.replaceState({},"",location.pathname);location.reload()});
$("closeModal").addEventListener("click",()=>hide("modal"));
$("modal").addEventListener("click",e=>{if(e.target.id==="modal") hide("modal");});

/* Salle des cérémonies — animations locales, sans écriture Firebase ni progression */
const ceremonyModal=$("ceremonyModal");
const ceremonyStage=$("ceremonyStage");
const ceremonyLaunch=$("ceremonyLaunchBtn");
const ceremonyMessage=$("ceremonyStageMessage");
const ceremonyTexts={
 birthday:{title:"Joyeux anniversaire !",text:"Aujourd’hui, le royaume entier célèbre une lumière de plus dans votre histoire. Que cette journée soit remplie de douceur, de rires et de merveilles. 🎂"},
 success:{title:"Une victoire à célébrer !",text:"Chaque effort mérite d’être honoré. Que cette réussite ouvre la porte à de nouvelles aventures et à mille belles fiertés. 🏆"},
 friendship:{title:"À votre belle amitié",text:"Deux personnalités, deux chemins, et des instants qui deviennent précieux. Que votre constellation continue de briller. 💗"},
 justbecause:{title:"Juste parce que…",text:"Pas besoin d’une date spéciale pour célébrer les petits bonheurs. Aujourd’hui, la magie existe simplement parce que vous êtes là. ✨"}
};
let ceremonySelected=null;
function resetCeremony(){
 ceremonyStage.classList.remove("is-celebrating");
 ceremonyMessage.innerHTML="<span>✧</span><h3>Chaque instant mérite sa lumière</h3><p>Choisissez une occasion et ouvrez le bal.</p>";
 ceremonyLaunch.textContent="✧ Lancer la cérémonie ✧";
 ceremonyModal.querySelectorAll("[data-ceremony]").forEach(button=>button.classList.toggle("selected",button.dataset.ceremony===ceremonySelected));
}
$("ceremonyOpenBtn").addEventListener("click",()=>{resetCeremony();ceremonyModal.classList.remove("hidden");});
$("ceremonyCloseBtn").addEventListener("click",()=>ceremonyModal.classList.add("hidden"));
ceremonyModal.addEventListener("click",event=>{if(event.target===ceremonyModal)ceremonyModal.classList.add("hidden");});
ceremonyModal.querySelector(".ceremony-occasions").addEventListener("click",event=>{
 const button=event.target.closest("[data-ceremony]");if(!button)return;
 ceremonySelected=button.dataset.ceremony;
 ceremonyModal.querySelectorAll("[data-ceremony]").forEach(item=>item.classList.toggle("selected",item===button));
 ceremonyLaunch.disabled=false;
});
function launchCeremony(){
 if(!ceremonySelected)return;
 const data=ceremonyTexts[ceremonySelected];
 ceremonyStage.classList.remove("is-celebrating");void ceremonyStage.offsetWidth;ceremonyStage.classList.add("is-celebrating");
 ceremonyMessage.innerHTML="<span>✧</span><h3></h3><p></p>";
 ceremonyMessage.querySelector("h3").textContent=data.title;
 ceremonyMessage.querySelector("p").textContent=data.text;
 const confetti=ceremonyStage.querySelector(".ceremony-confetti");
 confetti.innerHTML="";
 const colors=["#ffe4a6","#ffd0e9","#d7caff","#ffffff","#f4b6ce"];
 for(let i=0;i<46;i++){
  const bit=document.createElement("i");bit.textContent=["✦","✧","❀","·","♡"][i%5];
  bit.style.setProperty("--x",(Math.random()*100)+"%");
  bit.style.setProperty("--c",colors[i%colors.length]);
  bit.style.setProperty("--s",(9+Math.random()*15)+"px");
  bit.style.setProperty("--d",(3.2+Math.random()*2.4)+"s");
  bit.style.setProperty("--delay",(Math.random()*1.8)+"s");
  bit.style.setProperty("--drift",(Math.random()*130-65)+"px");
  confetti.appendChild(bit);
 }
 ceremonyLaunch.textContent="↻ Rejouer la cérémonie";
}
ceremonyLaunch.addEventListener("click",launchCeremony);

boot();
