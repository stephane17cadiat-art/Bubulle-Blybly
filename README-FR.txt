BUBULLE & BLYBLY — LA FORÊT DES TRÉSORS
========================================

Ce dossier contient une première version jouable du site.
Elle fonctionne dans Safari (iPhone) et Chrome (Samsung/Android).
Chaque joueuse garde sa propre progression et son score. Les changements
sont synchronisés en temps réel via Firebase.

IMPORTANT : le site n'est pas encore publié et ne peut pas fonctionner
tant que Firebase n'est pas configuré et que le dossier n'est pas hébergé.

ÉTAPE 1 — CRÉER LE PROJET FIREBASE
1. Sur un ordinateur si possible, ouvre https://console.firebase.google.com/
2. Clique sur "Ajouter un projet" et appelle-le bubulle-blybly.
3. Dans le projet, clique sur l'icône Web </> pour ajouter une application Web.
4. Copie l'objet firebaseConfig affiché par Firebase.
5. Ouvre app.js et remplace les six valeurs REMPLACER... par celles de ton projet.

ÉTAPE 2 — ACTIVER LA CONNEXION ANONYME
1. Firebase > Authentication > Get started.
2. Sign-in method > Anonymous > Enable > Save.

ÉTAPE 3 — CRÉER FIRESTORE
1. Firebase > Firestore Database > Create database.
2. Choisis un emplacement européen proche (par exemple europe-west).
3. Crée la base.
4. Ouvre l'onglet Rules.
5. Remplace les règles par le contenu de firestore.rules puis clique Publish.

NOTE DE SÉCURITÉ
Cette version est un prototype privé par lien : l'identifiant aléatoire de la
partie sert de secret d'invitation. Les règles Firestore sont volontairement
simples pour faciliter le premier test. Elles ne conviennent pas à un jeu
public ou à des données sensibles. Avant une diffusion large, faire valider
des règles strictes ou ajouter des Cloud Functions.

ÉTAPE 4 — PUBLIER LE SITE AVEC FIREBASE HOSTING
1. Installe Node.js sur un ordinateur : https://nodejs.org/
2. Ouvre un terminal dans ce dossier.
3. Lance : npm install -g firebase-tools
4. Lance : firebase login
5. Lance : firebase init hosting
   - Choisis "Use an existing project" puis ton projet.
   - Public directory : . (un point)
   - Configure as a single-page app : No
   - Set up automatic builds : No
   - Si Firebase demande d'écraser index.html, réponds No.
6. Lance : firebase deploy --only hosting
7. Firebase affiche une adresse https://....web.app : c'est le lien du jeu.

ÉTAPE 5 — JOUER À DEUX
1. Ouvre le lien sur ton iPhone.
2. Appuie sur "Créer une aventure".
3. Appuie sur "Inviter" et envoie le lien obtenu à Blybly.
4. Blybly ouvre le lien sur son Samsung et rejoint la partie.
5. Chacune joue à son rythme : ses réponses et ses points sont sauvegardés.

FICHIERS
- index.html : structure du jeu
- style.css : univers graphique responsive
- app.js : jeu, Firebase et synchronisation
- firestore.rules : règles d'accès Firestore

AIDE
Si Firebase affiche une erreur, vérifie en priorité :
- que la configuration copiée dans app.js est exacte ;
- que la connexion anonyme est activée ;
- que Firestore est créé et que les règles sont publiées ;
- que le site est ouvert depuis l'adresse HTTPS hébergée, pas en ouvrant
  directement index.html depuis les fichiers du téléphone.
