// Vos cartes perso (cart_mine), cartes de la bande et cartes signalées « nulles » (cart_banned),
// mélangées à la pioche au lancement d'une partie, comme mineMix / notBanned du site.
import data from '@/data/contenu.json';

import { cartesBande, chargerBande } from './bande';
import { cleCarte, melanger } from './cartes';
import { famOK, type Jeu, type Mode } from './contenu';
import { envoyerAvis } from './session';
import { ecrire, lire } from './stockage';

export type ConfigPerso = { lbl: string; ph: string[]; hint?: string; vf?: boolean };
export const MINE_GAMES = data.MINE_GAMES as Record<string, ConfigPerso>;
export const MINE_MAX = 200;
export type Perso = Record<string, string[]>;

export async function mineAll(): Promise<Perso> {
  const o = await lire<Record<string, unknown>>('cart_mine', {});
  const r: Perso = {};
  Object.keys(MINE_GAMES).forEach((k) => {
    const v = o && o[k];
    r[k] = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length <= 400).slice(0, MINE_MAX) : [];
  });
  return r;
}

export function mineSave(o: Perso): void {
  ecrire('cart_mine', o);
}

/** Nombre de cartes perso d'un jeu (les siennes + celles de la bande, sans doublon). */
export async function mineCount(id: string): Promise<number> {
  await chargerBande();
  const m = (await mineAll())[id] || [];
  return m.length + cartesBande(id).filter((x) => m.indexOf(x) < 0).length;
}

const nettoyer = (v: string) => String(v || '').replace(/[|\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

/** Fabrique la carte au format du jeu à partir des champs saisis (mineMake du site). f[3] = 'V' | 'F'. */
export function mineMake(id: string, f: string[]): string | null {
  let a = nettoyer(f[0]);
  const b = nettoyer(f[1]);
  const c = nettoyer(f[2]);
  if (!a) return null;
  switch (id) {
    case 'coupable':
      a = a.replace(/^(…|\.\.\.)\s*/, '').replace(/^(qui est le plus susceptible )?(de |d')/i, '');
      if (!/[?!.]$/.test(a)) a += ' ?';
      return '…' + a;
    case 'tribunal':
      if (!/^(de |d'|du |des )/i.test(a)) a = 'de ' + a;
      return a;
    case 'dilemme':
      if (!b) return null;
      return a + '|' + b;
    case 'chrono':
      return a;
    case 'vraifaux':
      return (f[3] === 'F' ? 'F' : 'V') + '|' + a + '|' + (b || (f[3] === 'F' ? "C'était faux !" : "Eh oui, c'est vrai !"));
    case 'quiadit':
      if (!b) return null;
      return 'p|' + a.replace(/^«\s*|\s*»$/g, '') + '|' + b + '|Entre nous||' + c;
    case 'liste': {
      const ans = b.split(/\s*[,;]\s*/).filter(Boolean).map((x) => x.slice(0, 40));
      if (ans.length < 3) return null;
      return a + '|' + ans.slice(0, 30).join(';');
    }
    case 'taboo': {
      const ban = b.split(/\s*[,;]\s*/).filter(Boolean).slice(0, 5);
      if (!ban.length) return null;
      return a + '|' + ban.join('|');
    }
  }
  return null;
}

/** Libellé d'une carte perso dans la liste : titre + sous-titre éventuel. */
export function mineLabel(id: string, x: string): { titre: string; sous?: string } {
  const p = x.split('|');
  switch (id) {
    case 'dilemme': return { titre: p[0] + ' ou ' + p[1] };
    case 'vraifaux': return { titre: (p[0] === 'V' ? '✅ ' : '❌ ') + p[1], sous: p[2] };
    case 'quiadit': return { titre: '« ' + p[1] + ' »', sous: '— ' + p[2] + (p[5] ? ' · ' + p[5] : '') };
    case 'liste': return { titre: p[0], sous: (p[1] || '').split(';').join(', ') };
    case 'taboo': return { titre: p[0], sous: 'Interdit : ' + p.slice(1).join(', ') };
  }
  return { titre: x };
}

/** Les cartes perso + de la bande, converties au format de la pioche du jeu. */
export async function mineCards(id: string, mode: Mode): Promise<unknown[]> {
  await chargerBande();
  const loc = (await mineAll())[id] || [];
  const tout = loc.concat(cartesBande(id).filter((x) => loc.indexOf(x) < 0));
  return tout.filter((x) => famOK(x, mode)).map((x) => {
    const p = x.split('|');
    if (id === 'dilemme') return { a: p[0], b: p[1] };
    if (id === 'liste') return { c: p[0], a: (p[1] || '').split(';').join('|'), h: '', mine: true };
    return x;
  });
}

function melangerPerso(j: Jeu, pioche: unknown[], mc: unknown[], seulement: boolean): unknown[] {
  if (!mc.length) return pioche;
  if (seulement) return melanger(mc);
  let m = melanger(mc);
  if (j.partie) m = m.slice(0, Math.max(3, Math.ceil(j.partie / 2)));
  const out = pioche.slice();
  let span = Math.min(out.length, Math.max(m.length * 2, 8));
  m.forEach((c) => { out.splice(Math.floor(Math.random() * (span + 1)), 0, c); span++; });
  return out;
}

export async function bannies(id: string): Promise<Set<string>> {
  const b = await lire<Record<string, string[]>>('cart_banned', {});
  return new Set((b && Array.isArray(b[id]) ? b[id] : []) as string[]);
}

/**
 * Appliqué juste après la préparation d'une partie : cartes perso / de la bande mélangées
 * (ou seules si opts.perso = 'only'), puis retrait des cartes signalées « nulles ».
 */
export async function appliquerPerso(
  j: Jeu,
  r: { pioche: unknown[]; extra?: any },
  o: { mode: Mode; opts: Record<string, string> },
): Promise<{ pioche: unknown[]; extra?: any }> {
  let pioche = r.pioche;
  const extra = r.extra;
  if (MINE_GAMES[j.id]) {
    const mc = await mineCards(j.id, o.mode);
    const seulement = o.opts.perso === 'only';
    if (j.id === 'taboo' && extra && Array.isArray(extra.cartes)) {
      extra.cartes = melangerPerso(j, extra.cartes, mc, seulement);
      extra.pos = 0;
    } else {
      pioche = melangerPerso(j, pioche, mc, seulement);
    }
  }
  const ban = await bannies(j.id);
  if (ban.size) {
    const ok = (c: unknown) => !ban.has(cleCarte(c));
    pioche = pioche.filter(ok);
    if (extra) {
      for (const k of ['verites', 'actions', 'cartes']) if (Array.isArray(extra[k])) extra[k] = extra[k].filter(ok);
    }
  }
  return { pioche, extra };
}

/* ---------------- « 👎 Carte nulle » ---------------- */

/** Texte lisible d'une carte, pour le signalement (cardText du site). */
export function texteCarte(c: unknown): string {
  const o = c as Record<string, string> | null;
  const x = typeof c === 'string' ? c : o && o.a && o.b ? o.a + ' / ' + o.b : (o && (o.q || o.c)) || JSON.stringify(c);
  return String(x).replace(/<[^>]+>/g, '').replace(/^[a-z]+\|/, '').replace(/\|/g, ' · ').slice(0, 180);
}

/** Ne remontre plus la carte sur ce téléphone et envoie le signalement (avis -1 marqué « carte », comme le site). */
export async function signalerCarte(id: string, carte: unknown, mode: Mode, nbJoueurs: number): Promise<void> {
  const all = await lire<Record<string, string[]>>('cart_banned', {});
  all[id] = (all[id] || []).concat([cleCarte(carte)]).slice(-500);
  ecrire('cart_banned', all);
  await envoyerAvis(id, -1, ('CARTE NULLE : ' + texteCarte(carte)).slice(0, 200), mode, nbJoueurs, true);
}
