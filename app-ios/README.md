# Jozzo — appli iPhone native (Expo SDK 57)

Vraie appli native de Jozzo, refaite écran par écran à partir de l'appli web (`site/index.html`),
avec les gestes et l'allure d'iOS (onglets natifs, feuilles, vibrations, écran toujours allumé).
Même méthode que Miamio (`appli-recette/app-ios`).

- `src/app/` : écrans (Expo Router). Onglets natifs : Tous · Soirée · Trajet · Famille · Plus ;
  `jeu/[id]` = intro d'un jeu ; `partie/[id]` = la partie ; `reglages` = joueurs, pénalités, thème.
- `src/jeux/` : la pioche de chaque jeu (`moteur.ts`, comme `startGame()` du site) et les écrans de jeu.
- `src/lib/` : thème (couleurs et polices du site), contenu, réglages, pioche « jamais vues d'abord », vibrations.
- `src/data/contenu.json` : **tout le contenu des jeux, recopié depuis le site** par
  `node ../outils/extraire-contenu.js` (lancé aussi par l'action GitHub avant chaque compilation).
  On n'écrit jamais de cartes ici : on les écrit dans `site/index.html`.

## Jeux déjà refaits
Le Coupable, La Cascade, Le Tribunal, Le Dilemme, Qui a déjà… ?, Vrai ou faux ?, C'était mieux avant ?
(liste dans `JEUX_NATIFS`, `src/jeux/moteur.ts`). Les autres affichent « Bientôt dans l'appli ».

## Vérifier avant chaque envoi
`npm ci && node ../outils/extraire-contenu.js && npx tsc --noEmit && npx expo export --platform ios`

## Envoyer sur TestFlight
GitHub › Actions › « iPhone › TestFlight » › Run workflow. Secrets nécessaires dans le dépôt
(saisis par Florine ou Julien, jamais dans le code) : `EXPO_TOKEN`, `ASC_API_KEY_P8`, `ASC_KEY_ID`,
`ASC_ISSUER_ID`, `APPLE_TEAM_ID` (les mêmes valeurs que pour Miamio, à recoller dans ce dépôt).
Avant le premier envoi : créer le projet « jozzo » sur expo.dev (compte jgconnect) et recopier son
identifiant dans `app.config.ts` (`projectId`).

Identifiant de l'appli : `fr.myjozzo.app` · App Store Connect : Apple ID 6824656228.
