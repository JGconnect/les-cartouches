// Préparation d'une partie : la pioche de chaque jeu, comme startGame() de l'appli web.
import { famOK, HOT_NIVEAUX, L, THEME_GAMES, THEMES, type Jeu, type Mode, type NiveauHot } from '@/lib/contenu';
import { fraichesDabord, melanger } from '@/lib/cartes';

/** Jeux déjà refaits en natif (les autres arrivent écran par écran). */
export const JEUX_NATIFS = new Set(['coupable', 'cascade', 'tribunal', 'dilemme', 'jamais', 'vraifaux', 'avant']);

export type Options = { mode: Mode; theme: string; niveauHot: NiveauHot; joueurs: string[] };

/** Clé de mémoire « déjà vues » utilisée par le site pour ce jeu (cart_seen). */
export function cleFraicheur(j: Jeu): string | null {
  const speciales: Record<string, string> = { cascade: 'cascade', avant: 'av_tout' };
  return speciales[j.id] ?? (j.partie ? j.id : null);
}

function cartesDuTheme(id: string, o: Options): unknown[] {
  const th = THEMES[o.theme];
  if (!th || (th.adult && o.mode === 'famille')) return [];
  const brut = (th.cards[id] || []).filter((x) => famOK(x, o.mode));
  return brut.map((x) => {
    if (id === 'dilemme') { const p = x.split('|'); return { a: p[0], b: p[1] }; }
    return x;
  });
}

/** Les cartes du thème de la soirée passent en priorité (themeMix du site). */
function avecTheme(j: Jeu, pioche: unknown[], o: Options): unknown[] {
  if (!THEME_GAMES[j.id]) return pioche;
  let tc = melanger(cartesDuTheme(j.id, o));
  if (!tc.length) return pioche;
  const n = pioche.length;
  if (j.partie) tc = tc.slice(0, Math.ceil(j.partie * 0.6));
  const moitie = Math.ceil(tc.length / 2);
  const tete = melanger(tc.concat(pioche.slice(0, moitie)));
  const tout = tete.concat(pioche.slice(moitie));
  return j.partie ? tout.slice(0, Math.max(n, tc.length)) : tout;
}

function piocheHot(liste: string[], niveau: NiveauHot): string[] {
  const ok = HOT_NIVEAUX[niveau] || HOT_NIVEAUX.chaud;
  return liste.filter((x) => ok.includes(x.charAt(0)));
}

export async function preparerPioche(j: Jeu, o: Options): Promise<unknown[]> {
  let pioche: unknown[] = [];
  switch (j.type) {
    case 'deck': pioche = melanger(L.COUPABLE); break;
    case 'tribunal': pioche = melanger(L.TRIBUNAL); break;
    case 'dilemme': pioche = melanger(L.DILEMME); break;
    case 'vraifaux': pioche = melanger(L.VRAIFAUX); break;
    case 'jamais': pioche = melanger(piocheHot(L.JAMAIS, o.niveauHot)); break;
    case 'cascade': {
      const choix = await fraichesDabord('cascade', melanger(L.CASCADE), Math.min(j.partie || 8, L.CASCADE.length));
      return choix.sort((a, b) => L.CASCADE.indexOf(a) - L.CASCADE.indexOf(b));
    }
    case 'avant': {
      const tout = L.AVANT as string[];
      return fraichesDabord('av_tout', melanger(tout), tout.length);
    }
    default: return [];
  }
  pioche = pioche.filter((c) => famOK(c, o.mode));
  if (j.partie) pioche = await fraichesDabord(j.id, pioche, Math.min(j.partie, pioche.length));
  return avecTheme(j, pioche, o);
}

/** Un gage (ou une gorgée) tiré au hasard, selon les pénalités choisies. */
export function tirerGage(mode: Mode): string {
  if (mode === 'alcool') return "Une gorgée, et on repart. Un verre d'eau de temps en temps, c'est permis.";
  const liste: string[] = mode === 'famille' ? L.GAGES_FAM : L.GAGES;
  return liste[Math.floor(Math.random() * liste.length)];
}
