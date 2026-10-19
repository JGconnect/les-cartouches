// Tout le contenu des jeux, recopié depuis l'appli web par outils/extraire-contenu.js.
// Le site (site/index.html) reste la seule source : ne pas modifier contenu.json à la main.
import brut from '@/data/contenu.json';

export type Mode = 'gages' | 'alcool' | 'famille';
export type Onglet = 'tous' | 'soiree' | 'trajet' | 'famille' | 'plus';
export type NiveauHot = 'flirt' | 'chaud' | 'brulant';

export type Jeu = {
  id: string;
  nom: string;
  emoji: string;
  couleur: string;
  accroche: string;
  type: string;
  famille: 'soiree' | 'hot' | 'quiz';
  partie: number | null;
  secondes: number | null;
  ordonne: boolean;
  consigne: string | null;
  victime: string | null;
  relance: string | null;
  regles: string[];
  reglesMots: string[] | null;
};

type Theme = { lbl: string; ico: string; adult?: boolean; cards: Record<string, string[]> };

const data = brut as unknown as {
  listes: Record<string, any[]>;
  jeux: Jeu[];
  VOC: Record<Mode, Record<string, string>>;
  THEMES: Record<string, Theme>;
  THEME_GAMES: Record<string, number>;
  GAME_TAGS: Record<string, string[]>;
  TOP: string[];
  FAM_BAD: string;
};

export const L = data.listes;
export const JEUX: Jeu[] = data.jeux;
export const THEMES = data.THEMES;
export const THEME_GAMES = data.THEME_GAMES;
export const TOP = data.TOP;

export function jeu(id: string): Jeu | undefined {
  return JEUX.find((j) => j.id === id);
}

export function tags(id: string): string[] {
  return data.GAME_TAGS[id] || [];
}

/** Remplace {pen}, {boit}… selon les pénalités choisies (gages, gorgées ou famille). */
export function t(texte: string, mode: Mode): string {
  const v = data.VOC[mode];
  return String(texte).replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
}

export function icone(mode: Mode): string {
  return data.VOC[mode].ICO;
}

const FAM_BAD = new RegExp(data.FAM_BAD, 'i');
/** En mode Famille, on écarte les cartes qui ne conviennent pas aux enfants. */
export function famOK(texte: unknown, mode: Mode): boolean {
  if (mode !== 'famille') return true;
  const s = typeof texte === 'string' ? texte : JSON.stringify(texte);
  if (/cocktail/i.test(s) && !/sans alcool/i.test(s)) return false;
  return !FAM_BAD.test(s);
}

export const HOT_NIVEAUX: Record<NiveauHot, string[]> = { flirt: ['f'], chaud: ['f', 'c'], brulant: ['f', 'c', 'b'] };
export const HOT_NOM: Record<string, string> = { f: '💋 Flirt', c: '🔥 Chaud', b: '🌶️ Brûlant' };

/** Jeux visibles dans un onglet donné (comme l'accueil du site). */
export function jeuxVisibles(onglet: Onglet, mode: Mode): Jeu[] {
  return JEUX.filter((j) => {
    if (mode === 'famille' && !(tags(j.id).includes('famille'))) return false;
    if (onglet === 'tous' || onglet === 'plus') return true;
    return tags(j.id).includes(onglet);
  });
}
