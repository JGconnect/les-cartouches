// Statistiques anonymes (table « parties ») et avis de fin de partie (table « retours »),
// comme l'appli web : même projet Supabase, même clé publique, mêmes clés cart_*.
// Tout part en tâche de fond ; sans réseau, ça reste sur le téléphone et repart plus tard.
import { AppState } from 'react-native';

import type { Mode, NiveauHot } from './contenu';
import { ecrire, lire } from './stockage';

const SUPABASE_URL = 'https://gfxpldjnrcoxdodidkze.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aW40Jc0ujRbiuFvm4HC76w_hOSO_LLQ';

function entetes(): Record<string, string> {
  const h: Record<string, string> = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  if (SUPABASE_KEY.indexOf('sb_') !== 0) h.Authorization = 'Bearer ' + SUPABASE_KEY;
  return h;
}

async function poster(table: string, corps: unknown): Promise<void> {
  const ctrl = new AbortController();
  const minuterie = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + table, { method: 'POST', headers: entetes(), body: JSON.stringify(corps), signal: ctrl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  } finally {
    clearTimeout(minuterie);
  }
}

/* ---------- identifiant anonyme du téléphone ---------- */
async function appareil(): Promise<string> {
  let d = await lire<string>('cart_dev', '');
  if (!d || !/^[a-z0-9]{8,24}$/.test(d)) {
    d = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).replace(/[^a-z0-9]/g, '').slice(0, 16);
    if (d.length < 8) d = (d + '00000000').slice(0, 8);
    ecrire('cart_dev', d);
  }
  return d;
}

/* ---------- parties ---------- */
type Sess = { g: string; t0: number; last: number; n: number; m: Mode; lv: NiveauHot | null; v: string | null };
type PartieLocale = { k: string; jeu: string; duree_s: number; fini: boolean; nb_joueurs: number; mode: string; niveau: string | null; variante: string | null; appareil: string; sent: boolean };

let sess: Sess | null = null;
let envoiParties = false;

async function enregistrer(o: Sess, fini: boolean, dur: number) {
  if (!o || !/^[a-z]{2,30}$/.test(o.g)) return;
  if (dur < 5) return; // ouvert puis refermé aussitôt : on ne compte pas
  const a = await lire<PartieLocale[]>('cart_parties', []);
  a.push({
    k: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    jeu: o.g, duree_s: Math.min(36000, Math.round(dur)), fini: !!fini, nb_joueurs: o.n || 0,
    mode: o.m || 'gages', niveau: o.lv || null, variante: o.v || null, appareil: await appareil(), sent: false,
  });
  ecrire('cart_parties', a.slice(-200));
  envoyerParties();
}

export async function envoyerParties() {
  if (envoiParties) return;
  const todo = (await lire<PartieLocale[]>('cart_parties', [])).filter((x) => !x.sent);
  if (!todo.length) return;
  envoiParties = true;
  try {
    await poster('parties', todo.map((x) => ({ jeu: x.jeu, duree_s: x.duree_s, fini: x.fini, nb_joueurs: x.nb_joueurs, mode: x.mode, niveau: x.niveau, variante: x.variante || null, appareil: x.appareil })));
    const ks = todo.map((x) => x.k);
    ecrire('cart_parties', (await lire<PartieLocale[]>('cart_parties', [])).filter((x) => !ks.includes(x.k)));
  } catch {
    // pas de réseau : on réessaiera
  } finally {
    envoiParties = false;
  }
}

/** Début d'une partie (à appeler au lancement de l'écran de jeu). */
export function debutPartie(jeu: { id: string; famille: string }, o: { joueurs: string[]; mode: Mode; niveauHot: NiveauHot; variante?: string | null }) {
  if (sess) finPartie(false);
  sess = { g: jeu.id, t0: Date.now(), last: Date.now(), n: Math.min(o.joueurs.length, 16), m: o.mode, lv: jeu.famille === 'hot' ? o.niveauHot : null, v: o.variante || null };
  ecrire('cart_sess', sess);
}

/** Fin d'une partie : fini = arrivée à l'écran de fin ; false = abandon (retour en arrière). */
export function finPartie(fini: boolean) {
  if (!sess) return;
  const o = sess;
  sess = null;
  ecrire('cart_sess', null);
  enregistrer(o, fini, (Date.now() - o.t0) / 1000);
}

/** À l'ouverture de l'appli : une partie restée ouverte compte comme abandonnée, et on vide la file d'envoi. */
export async function demarrerSuivi() {
  const o = await lire<Sess | null>('cart_sess', null);
  if (o && o.t0 && !sess) {
    ecrire('cart_sess', null);
    await enregistrer(o, false, ((o.last || o.t0) - o.t0) / 1000);
  }
  envoyerParties();
  envoyerAvisEnAttente();
}

setInterval(() => { if (sess) { sess.last = Date.now(); ecrire('cart_sess', sess); } }, 30000);
AppState.addEventListener('change', (etat) => {
  if (sess) { sess.last = Date.now(); ecrire('cart_sess', sess); }
  if (etat === 'active') { envoyerParties(); envoyerAvisEnAttente(); }
});

/* ---------- avis (« Ce jeu vous a plu ? ») ---------- */
type Avis = { g: string; v: 1 | -1; note: string; mode: Mode; n: number; at: string; sent: boolean; card?: boolean };
let envoiAvis = false;

function corpsAvis(a: Avis) {
  return { jeu: a.g, vote: a.v, commentaire: a.note || null, mode: a.mode === 'alcool' ? 'alcool' : 'gages', nb_joueurs: a.n };
}

/** Enregistre l'avis et tente l'envoi. Renvoie true si parti, false s'il attend le réseau. */
export async function envoyerAvis(jeu: string, vote: 1 | -1, note: string, mode: Mode, nbJoueurs: number, carte = false): Promise<boolean> {
  const rec: Avis = { g: jeu, v: vote, note: note.trim().slice(0, 200), mode, n: Math.min(nbJoueurs, 16), at: new Date().toISOString(), sent: false, ...(carte ? { card: true } : {}) };
  const tous = await lire<Avis[]>('cart_votes', []);
  tous.push(rec);
  ecrire('cart_votes', tous.slice(-300));
  try {
    await poster('retours', corpsAvis(rec));
    const maj = await lire<Avis[]>('cart_votes', []);
    const i = maj.findIndex((x) => x.at === rec.at && x.g === rec.g && !x.sent);
    if (i >= 0) { maj[i].sent = true; ecrire('cart_votes', maj); }
    return true;
  } catch {
    return false;
  }
}

export async function envoyerAvisEnAttente() {
  if (envoiAvis) return;
  envoiAvis = true;
  try {
    const tous = await lire<Avis[]>('cart_votes', []);
    let change = false;
    for (const a of tous) {
      if (a.sent || Date.now() - Date.parse(a.at) < 30000) continue; // un envoi tout récent est peut-être encore en cours
      try { await poster('retours', corpsAvis(a)); a.sent = true; change = true; } catch { /* plus tard */ }
    }
    if (change) ecrire('cart_votes', tous);
  } finally {
    envoiAvis = false;
  }
}
