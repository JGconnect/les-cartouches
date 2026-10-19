# Jozzo : l'appli iPhone (Expo)

Ce dossier contient l'appli native Jozzo (Expo SDK 58, React Native 0.88, TypeScript).
C'est une **coque native** qui affiche l'appli web (https://myjozzo.fr) et lui ajoute des
fonctions iPhone. Même méthode que Chekko : d'abord la coque, ensuite des écrans natifs un par un
si besoin. Chaque mise à jour du site (GitHub Pages) arrive aussi dans l'appli, sans repasser par
l'App Store.

Rien de secret dans ce dossier. Le jeton Expo est rangé dans le secret GitHub `EXPO_TOKEN`.

## Ce que l'appli ajoute au site
- **Vraies vibrations iPhone** (chronos, compte à rebours, boutons) : `navigator.vibrate` n'existe pas
  sur iPhone, l'appli le remplace par les vibrations natives.
- **Écran toujours allumé** pendant qu'on joue.
- **Feuille de partage iOS** pour partager ses cartes perso et inviter la bande.
- **Hors ligne** : le site est déclaré « domaine de l'appli » (WKAppBoundDomains), donc son service
  worker marche et les jeux restent jouables sans réseau (sauf Blind test / Paroles).
- Plein écran, sans rebond ni geste retour, écran « Pas de connexion » avec Réessayer, liens
  extérieurs dans Safari.

## Ce que fait chaque fichier
- `App.tsx` : la vue web plein écran, écran hors connexion, écran toujours allumé.
- `src/bridge.ts` : crée `window.JozzoNative` dans la page avant son chargement (`share`, `haptic`,
  `openExternal`) ; remplace `navigator.share` et `navigator.vibrate` ; ajoute la classe
  `in-native-app` sur `<html>`. Le user-agent contient `JozzoApp/1`.
- `src/native.ts` : ce que fait l'iPhone (partage, vibrations, Safari).
- `src/config.ts` : adresse du site, domaines internes, couleur de fond.
- `app.json` : nom « Jozzo », identifiant **`com.jgconnect.jozzo`** (définitif dès que la fiche
  App Store Connect existe), icône « JZ », fond `#181022`.
- `eas.json` : fabrication dans le cloud Expo, envoi sur TestFlight (`ascAppId` à remplir).
- `../.github/workflows/appli-iphone.yml` : action GitHub « Appli iPhone (TestFlight) », lancée à la main.

## Brancher pour la première fois (à faire une fois)

### 1. App Store Connect : créer la fiche
Apps › + › Nouvelle app › iOS, nom « Jozzo », langue français, identifiant `com.jgconnect.jozzo`
(s'il n'apparaît pas : developer.apple.com › Identifiers › +), SKU `jozzo`.
Noter l'**Apple ID** de l'appli (Informations sur l'app) → `ascAppId` dans `eas.json` (Claude peut le faire).

### 2. Expo ↔ GitHub : le jeton
1. expo.dev › compte › Access tokens › Create token (nom : « GitHub jozzo »). Copier le jeton.
2. GitHub › `JGconnect/les-cartouches` › Settings › Secrets and variables › Actions ›
   New repository secret : nom `EXPO_TOKEN`, valeur = le jeton.

### 3. Premier build, depuis un ordinateur (une seule fois)
Il crée le projet Expo et les certificats Apple (connexion au compte Apple Developer).
```
git pull
git checkout appli-iphone   (ou main une fois fusionnée)
cd mobile
npm install
npx eas-cli login
npx eas-cli init          # crée le projet « jozzo » sur Expo et écrit son id dans app.json
npx eas-cli build -p ios --profile production
npx eas-cli submit -p ios --latest
```
Committer ensuite `app.json` (l'id du projet Expo y a été ajouté).

### 4. Ensuite
GitHub › Actions › « Appli iPhone (TestFlight) » › Run workflow : fabrique et envoie une nouvelle
version sur TestFlight. Inutile pour les changements de jeux ou de cartes : ils passent par le site.

## Avant l'App Store (public)
- **Classification d'âge : 17+** (jeux à boire en option, jeux Hot 18+).
- **Politique de confidentialité** (page web) : prénoms seulement sur le téléphone, avis et stats anonymes.
- **Règle 4.2 d'Apple** (« minimum de fonctionnalités ») : une simple coque web peut être refusée.
  Les vibrations, l'écran allumé, le partage et le hors-ligne aident ; prévoir ensuite des
  fonctions natives (sons, notifications « soirée jeux ce soir ? », widgets) ou des écrans natifs.
- **Achats** : si les jeux Hot deviennent payants dans l'appli, passage obligatoire par l'achat
  intégré Apple (15 % avec le Small Business Program), voir `publier-nos-apps-sur-les-stores.md`.
