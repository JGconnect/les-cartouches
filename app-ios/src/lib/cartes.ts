// Pioche des cartes : les cartes jamais vues d'abord (mémoire cart_seen, comme sur le site).
import { lire, ecrire } from './stockage';

export function melanger<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const cleCarte = (c: unknown) => (typeof c === 'string' ? c : JSON.stringify(c));

let vues: Record<string, string[]> | null = null;
async function chargerVues() {
  if (!vues) vues = await lire<Record<string, string[]>>('cart_seen', {});
  return vues;
}

/** Les cartes pas encore vues passent devant ; quand tout a été vu, on recommence. */
export async function fraichesDabord<T>(id: string, cartes: T[], n: number): Promise<T[]> {
  const toutes = await chargerVues();
  const vu = new Set(toutes[id] || []);
  let neuves = cartes.filter((c) => !vu.has(cleCarte(c)));
  let vieilles = cartes.filter((c) => vu.has(cleCarte(c)));
  if (!neuves.length && cartes.length) {
    delete toutes[id];
    ecrire('cart_seen', toutes);
    neuves = cartes;
    vieilles = [];
  }
  return neuves.concat(vieilles).slice(0, n);
}

/** Marque une carte comme vue quand elle s'affiche. */
export async function marquerVue(id: string | null, c: unknown) {
  if (!id || c === undefined || c === null) return;
  const toutes = await chargerVues();
  const liste = toutes[id] || [];
  const k = cleCarte(c);
  if (liste.includes(k)) return;
  liste.push(k);
  toutes[id] = liste.slice(-3000);
  ecrire('cart_seen', toutes);
}
