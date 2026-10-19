// Registre des jeux refaits en natif : à chaque type de jeu (champ `type` du site), son module.
// Un module = l'écran d'une manche, la préparation de la pioche, les options de l'intro.
// Les 10 premiers jeux passent encore par cartes.tsx + moteur.ts ; les suivants ont chacun leur fichier.
import type { Jeu } from '@/lib/contenu';

import type { ModuleJeu, OptionJeu } from './types';

export const MODULES: Record<string, ModuleJeu> = {
};

/** Types de jeux gérés par cartes.tsx / moteur.ts. */
const TYPES_HISTORIQUES = new Set(['deck', 'cascade', 'tribunal', 'dilemme', 'jamais', 'vraifaux', 'avant', 'grill', 'chrono', 'av']);

export function estNatif(j: Jeu): boolean {
  return TYPES_HISTORIQUES.has(j.type) || !!MODULES[j.type];
}

const OPTIONS_HISTORIQUES: Record<string, OptionJeu[]> = {
  grill: [{
    cle: 'ambiance', titre: 'Ambiance', defaut: 'epice',
    choix: [{ id: 'soft', titre: '🟢 Soft', sous: 'Pour chauffer' }, { id: 'epice', titre: '🟡 Épicé', sous: 'Ça pique' }, { id: 'trash', titre: '🔴 Trash', sous: 'Sans pitié' }],
  }],
};

export function optionsDe(j: Jeu): OptionJeu[] {
  return MODULES[j.type]?.options || OPTIONS_HISTORIQUES[j.type] || [];
}
