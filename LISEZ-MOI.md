# Les Cartouches

Huit jeux de soirée entre amis qui se jouent **avec un seul téléphone** que l'on
se passe autour de la table. Aucun matériel, aucune installation : c'est une
simple page web.

> Nom de travail : **Les Cartouches** (chaque jeu = une cartouche). Pas encore
> définitif.

---

## Les 8 jeux

| Jeu | En deux mots |
|---|---|
| 🔥 Oui ou Non | Une personne sur le grill ne répond que par oui ou non. Réglage Soft / Épicé / Trash. |
| 🤐 Ni oui ni non | L'inverse : répondre en rafale sans jamais dire oui ni non. |
| 🃏 Le Menteur | « J'ai déjà… » : vrai ou bluff ? La table vote. |
| 👉 Le Coupable | « Qui est le plus susceptible de… » : tout le monde pointe. |
| 🌊 La Cascade | Des vérités de plus en plus intimes : répondre ou esquiver. |
| ⏱️ Le Chrono | Une catégorie, 5 secondes par personne (vrai chrono à l'écran). |
| ⚖️ Le Tribunal | Accusé·e d'un travers, 30 s de plaidoirie, verdict de la table. |
| 🤔 Le Dilemme | Choix impossible A ou B : trancher et défendre son choix. |

**Pénalités** : 🎯 gages (sans alcool, par défaut) ou 🍺 gorgées (mention 18+).
Les prénoms des joueurs sont mémorisés **sur le téléphone uniquement**, jamais
envoyés.

---

## Contenu du dossier

```
Les Cartouches/
├── site/
│   └── index.html        ← le jeu complet (une seule page, branchée sur Supabase)
├── supabase/
│   └── retours.sql        ← la table des avis + sécurité + vue de classement
└── LISEZ-MOI.md           ← ce fichier
```

- `site/index.html` est **autonome** : tout le code, les contenus et le design
  sont dedans. Aucune dépendance à installer.
- La configuration Supabase est déjà renseignée en haut du `<script>` (URL du
  projet + clé publique). Laissées vides, les avis resteraient sur le téléphone.

---

## Mise en ligne (GitHub Pages)

Le jeu est en ligne sur **https://jgconnect.github.io/les-cartouches/**

- Hébergement **gratuit et illimité** sur GitHub Pages (dépôt public `JGconnect/les-cartouches`).
- **Automatique** : chaque modification poussée sur la branche `main` remet le site en ligne toute seule
  (fichier `.github/workflows/pages.yml`, onglet **Actions** du dépôt pour suivre).
- Le dossier publié est `site/`.
- **Netlify n'est plus utilisé** (chaque mise en ligne y coûtait 15 crédits sur 300 par mois).
  La règle `ignore = "exit 0"` dans `netlify.toml` y bloque toute nouvelle mise en ligne.

## Vérifier que les avis remontent bien

1. Ouvrir https://jgconnect.github.io/les-cartouches/ sur un téléphone.
2. Jouer une partie, puis donner un 👍 ou 👎 à la fin.
3. Dans Supabase → projet **cartouches** → **Table Editor** → table `retours` :
   une nouvelle ligne doit apparaître.
4. La vue **`classement_jeux`** donne le classement des jeux (👍 / 👎 / score).

---

## Supabase (rappel technique)

- Projet : **cartouches** — `https://gfxpldjnrcoxdodidkze.supabase.co`
- Table **`retours`** : `id`, `created_at`, `jeu`, `vote` (-1/1),
  `commentaire` (≤ 200 caractères), `mode` (gages/alcool), `nb_joueurs` (0-16).
- Sécurité : les visiteurs peuvent **uniquement ajouter** un avis. Lecture,
  modification et suppression refusées depuis le site public (RLS).
- ⚠️ Le projet **« US. Project »** du même compte Supabase contient une **autre
  appli avec des données réelles** : ne pas y toucher.

---

## Pour la suite

1. Partager l'adresse à quelques groupes d'amis pour tester.
2. Lire les retours (vue `classement_jeux`) et enrichir les jeux qui marchent.
3. Choisir le nom définitif et l'identité visuelle.
4. Relier le projet à GitHub (historique + redéploiement automatique Netlify).
5. Plus tard : appli native pour les stores (Capacitor/Xcode), même code réutilisé.
