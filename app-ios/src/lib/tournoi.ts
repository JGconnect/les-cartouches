// Tournoi du trajet (clé cart_tour, comme le site) : chaque quiz terminé rapporte 3, 2, 1 points au podium.
import { ecrire, lire } from './stockage';

export type Tournoi = { on: boolean; done?: boolean; pts: Record<string, number>; log: { g: string; w: Record<string, number> }[] };

export const TOUR_PTS = [3, 2, 1];

export async function lireTournoi(): Promise<Tournoi | null> {
  const v = await lire<Tournoi | null>('cart_tour', null);
  return v && typeof v === 'object' && v.pts ? v : null;
}

export function ecrireTournoi(v: Tournoi | null) {
  ecrire('cart_tour', v);
}

export function nouveauTournoi(joueurs: string[]): Tournoi | null {
  if (joueurs.length < 2) return null;
  const pts: Record<string, number> = {};
  joueurs.forEach((p) => { pts[p] = 0; });
  return { on: true, pts, log: [] };
}

export type Rang = { n: string; p: number; r: number };
export function classement(pts: Record<string, number>): Rang[] {
  const ks = Object.keys(pts).sort((a, b) => pts[b] - pts[a]);
  return ks.map((k) => ({ n: k, p: pts[k], r: 1 + ks.filter((x) => pts[x] > pts[k]).length }));
}

/**
 * À la fin d'un quiz : donne 3 / 2 / 1 points de tournoi au podium (tourAward du site).
 * Renvoie le tournoi mis à jour et les points gagnés, ou null si rien à compter.
 */
export async function attribuerTournoi(jeu: string, scores: Record<string, number>): Promise<{ t: Tournoi; gagnes: Record<string, number> } | null> {
  const T = await lireTournoi();
  if (!T || !T.on) return null;
  const ks = Object.keys(scores).filter((k) => Object.prototype.hasOwnProperty.call(T.pts, k) && scores[k] > 0);
  if (!ks.length) return null;
  const gagnes: Record<string, number> = {};
  ks.forEach((k) => {
    const r = 1 + ks.filter((x) => scores[x] > scores[k]).length;
    if (r <= TOUR_PTS.length) { gagnes[k] = TOUR_PTS[r - 1]; T.pts[k] += TOUR_PTS[r - 1]; }
  });
  T.log.push({ g: jeu, w: gagnes });
  ecrireTournoi(T);
  return { t: T, gagnes };
}
