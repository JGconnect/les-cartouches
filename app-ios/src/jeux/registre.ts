// Registre des jeux refaits en natif : à chaque type de jeu (champ `type` du site), son module.
// Un module = l'écran d'une manche, la préparation de la pioche, les options de l'intro.
// Les 10 premiers jeux passent encore par cartes.tsx + moteur.ts ; les suivants ont chacun leur fichier.
import type { Jeu } from '@/lib/contenu';

import type { ModuleJeu, OptionJeu } from './types';
import m_trap from './modules/trap';
import m_menteur from './modules/menteur';
import m_quiadit from './modules/quiadit';
import m_connait from './modules/connait';
import m_barometre from './modules/barometre';
import m_roue from './modules/roue';
import m_mission from './modules/mission';
import m_quideux from './modules/quideux';
import m_confessions from './modules/confessions';
import m_devine from './modules/devine';
import m_liste from './modules/liste';
import m_bac from './modules/bac';
import m_taboo from './modules/taboo';
import m_fredonne from './modules/fredonne';
import m_blindtest from './modules/blindtest';
import m_paroles from './modules/paroles';
import m_ousuisje from './modules/ousuisje';
import m_histoire from './modules/histoire';

export const MODULES: Record<string, ModuleJeu> = {
  trap: m_trap,
  menteur: m_menteur,
  quiadit: m_quiadit,
  connait: m_connait,
  barometre: m_barometre,
  roue: m_roue,
  mission: m_mission,
  quideux: m_quideux,
  confessions: m_confessions,
  devine: m_devine,
  liste: m_liste,
  bac: m_bac,
  taboo: m_taboo,
  fredonne: m_fredonne,
  blindtest: m_blindtest,
  paroles: m_paroles,
  ousuisje: m_ousuisje,
  histoire: m_histoire,
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
