#!/usr/bin/env node
/*
 * Jozzo : copie tout le contenu des jeux de l'appli web (site/index.html) vers l'appli iPhone
 * (app-ios/src/data/contenu.json). Le site reste la SEULE source du contenu : on écrit les cartes
 * dans index.html, puis ce script (lancé aussi par l'action « iPhone › TestFlight ») les recopie.
 *
 * Usage : node outils/extraire-contenu.js
 */
const fs = require("fs");
const path = require("path");

const racine = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(racine, "site/index.html"), "utf8");

/** Trouve `var NOM=` puis lit la valeur littérale qui suit (tableau, objet ou fonction auto-appelée). */
function lire(nom) {
  const m = new RegExp("var " + nom + "\\s*=\\s*").exec(html);
  if (!m) throw new Error("Introuvable dans index.html : " + nom);
  let i = m.index + m[0].length;
  const debut = i;
  let prof = 0, guill = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (guill) {
      if (c === "\\") { i++; continue; }
      if (c === guill) guill = null;
      continue;
    }
    if (c === '"' || c === "'") guill = c;
    else if (c === "/" && html[i + 1] === "*") { i = html.indexOf("*/", i) + 1; }
    else if ("[{(".includes(c)) prof++;
    else if ("]})".includes(c)) { prof--; if (prof === 0) { i++; break; } }
  }
  // fonction auto-appelée : on inclut l'appel « () » qui suit
  let src = html.slice(debut, i);
  if (/^\(function/.test(src) && html.slice(i, i + 2) === "()") src += "()";
  else if (/^\(function/.test(src) && html.slice(i, i + 3) === ";()") src += "()";
  return src;
}

const NOMS_LISTES = [
  "OUINON", "NINON", "RELANCES", "MENTEUR", "INTRUS_MOTS", "COUPABLE", "CASCADE", "CHRONO", "TRIBUNAL",
  "DILEMME", "VICTIMS", "GAGES", "GAGES_FAM", "DEVINE", "LISTES", "BAC_CATS", "TABOO", "CHANSONS",
  "CHANSONS2", "CH_INTL", "BT_FILMS", "BT_SERIES", "CITATIONS", "VRAIFAUX", "HIST_DEBUTS", "HIST_MOTS",
  "LIEUX", "AVANT", "AV_VERITES", "AV_ACTIONS", "JAMAIS", "BAROMETRE", "ROUE", "MISSIONS", "QUIDEUX",
  "CONF_PROMPTS", "CONNAIT",
];
const NOMS_OBJETS = ["GAMES", "VOC", "THEMES", "THEME_GAMES", "HUB_FILTERS", "MINE_GAMES"];

const sortie = { genere: new Date().toISOString(), listes: {}, jeux: [] };
for (const nom of NOMS_LISTES) {
  try { sortie.listes[nom] = eval("(" + lire(nom) + ")"); }
  catch (e) { console.warn("⚠️  " + nom + " : " + e.message); }
}
for (const nom of NOMS_OBJETS) {
  try { sortie[nom] = eval("(" + lire(nom) + ")"); }
  catch (e) { console.warn("⚠️  " + nom + " : " + e.message); }
}

// Onglets de chaque jeu (soiree / trajet / famille) : le code du site est rejoué tel quel.
sortie.GAME_TAGS = eval(lire("GAME_TAGS"));
// Les 8 « incontournables » de l'accueil.
const top = /var TOP=(\[[^\]]*\])/.exec(html);
sortie.TOP = top ? eval(top[1]) : [];
// Contenus écartés en mode Famille.
const fam = /var FAM_BAD=(\/.*\/i);/.exec(html);
sortie.FAM_BAD = fam ? fam[1].slice(1, -2) : "";

// Jeux : on garde les champs utiles, et on retire le HTML des textes.
const sansHtml = (s) => String(s ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
sortie.jeux = (sortie.GAMES || []).map((g) => ({
  id: g.id, nom: g.name, emoji: g.em, couleur: g.gc, accroche: sansHtml(g.tg), type: g.type,
  famille: g.cat || "soiree", partie: g.partie || null, secondes: g.secs || null, ordonne: !!g.ordered,
  consigne: g.instr ? sansHtml(g.instr) : null, victime: g.vic || null, relance: g.relLbl || null,
  regles: (g.rules || []).map(sansHtml), reglesMots: g.rulesMots ? g.rulesMots.map(sansHtml) : null,
}));
delete sortie.GAMES;

const cible = path.join(racine, "app-ios/src/data/contenu.json");
fs.mkdirSync(path.dirname(cible), { recursive: true });
fs.writeFileSync(cible, JSON.stringify(sortie));
const nb = Object.values(sortie.listes).reduce((a, l) => a + (Array.isArray(l) ? l.length : 0), 0);
console.log(`Contenu copié : ${sortie.jeux.length} jeux, ${nb} cartes → app-ios/src/data/contenu.json`);
