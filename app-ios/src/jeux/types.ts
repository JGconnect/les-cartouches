// Contrat commun à tous les écrans de jeu de l'appli native.
import type { ComponentType } from 'react';

import type { Jeu, Mode, NiveauHot } from '@/lib/contenu';

export type Scores = Record<string, number>;

/** Réglages de la partie en cours (choisis dans les Réglages et sur l'intro du jeu). */
export type Options = {
  mode: Mode;
  theme: string;
  niveauHot: NiveauHot;
  joueurs: string[];
  /** Options propres au jeu, choisies sur l'écran d'intro (voir OptionJeu). */
  opts: Record<string, string>;
};

/** Ce que reçoit l'écran d'une manche. La partie le recrée à chaque manche (key = idx). */
export type PropsCarte = {
  jeu: Jeu;
  /** Carte de la manche (pioche[idx]). */
  carte: any;
  idx: number;
  total: number;
  /** À qui c'est le tour (prénom, ou « La personne à ta gauche » sans prénoms). */
  tour: string;
  joueurs: string[];
  mode: Mode;
  niveauHot: NiveauHot;
  opts: Record<string, string>;
  scores: Scores;
  pioche: unknown[];
  /** Données en plus, renvoyées par preparer() du module. */
  extra?: any;
  /** Manche suivante (ou fin de partie s'il n'y en a plus). */
  suivant: () => void;
  precedent?: () => void;
  /** Ouvre la feuille de gage / gorgée pour quelqu'un, puis appelle `puis` à la fermeture. */
  donnerGage: (pour: string, puis?: () => void) => void;
  ajouterPoint: (qui: string, n?: number) => void;
  /** Termine la partie (écran de fin avec le classement s'il y a des points). */
  quitter: () => void;
  /** Remplace la carte de la manche en cours. */
  remplacer: (c: unknown) => void;
  /** Marque une carte comme « vue » (pioche jamais vues d'abord) sous une clé donnée. */
  marquerVue: (cle: string, c: unknown) => void;
};

export type OptionJeu = {
  cle: string;
  titre: string;
  choix: { id: string; titre: string; sous?: string }[];
  defaut: string;
};

export type ModuleJeu = {
  Composant: ComponentType<PropsCarte>;
  /** Prépare la pioche (et des données en plus). Sans preparer, la partie a une seule manche. */
  preparer?: (o: Options) => Promise<{ pioche: unknown[]; extra?: any }>;
  /** Options affichées sur l'écran d'intro du jeu. */
  options?: OptionJeu[];
  /** Pas de compteur « 3 / 10 » en haut de l'écran. */
  sansProgression?: boolean;
  /** Clé « déjà vues » pour marquer automatiquement chaque carte affichée (null : le module s'en occupe). */
  fraicheur?: (o: Options) => string | null;
  /** Nombre de prénoms nécessaires (message sur l'intro si pas assez). */
  minJoueurs?: number;
};
