// Briques communes aux jeux Hot refaits en natif (baromètre, roue, mission, qui de nous deux, confessions).
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Puce, Question } from '@/components/ui';
import { famOK, HOT_NOM, L, t, type Jeu, type Mode, type NiveauHot } from '@/lib/contenu';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { C, F, R } from '@/lib/theme';

import { avecTheme, piocheHot } from '../moteur';
import type { Options } from '../types';

/** Mise en page commune : le contenu au centre, les boutons en bas. */
export function Cadre({ children, pied }: { children: ReactNode; pied: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={st.corps} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      <View style={st.pied}>{pied}</View>
    </View>
  );
}

/** Puce du niveau (💋 Flirt, 🔥 Chaud, 🌶️ Brûlant) d'une carte « f|… ». */
export function PuceHot({ carte, couleur, en_plus }: { carte: string; couleur: string; en_plus?: string }) {
  return <Puce texte={(HOT_NOM[carte.charAt(0)] || 'Hot') + (en_plus ? ' · ' + en_plus : '')} couleur={couleur} />;
}

/** Texte d'une carte Hot sans son niveau. */
export function texteHot(carte: string, mode: Mode): string {
  return t(String(carte).slice(2), mode);
}

/** Écran « Passe le téléphone à … ». */
export function Passe({ jeu, nom, message, bouton, onPress, quitter }: { jeu: Jeu; nom: string; message?: string; bouton: string; onPress: () => void; quitter?: () => void }) {
  return (
    <Cadre pied={<>
      <Bouton titre={bouton} couleur={jeu.couleur} onPress={onPress} style={{ flex: 0 }} />
      {quitter ? <Lien titre="Terminer la partie" onPress={quitter} /> : null}
    </>}>
      <Text style={{ fontSize: 54, textAlign: 'center' }}>📱</Text>
      <Question>Passe le téléphone à {nom}</Question>
      {message ? <Consigne>{message}</Consigne> : null}
    </Cadre>
  );
}

/** Écran « Il faut des prénoms » (au cas où on arrive ici sans assez de joueurs). */
export function IlFautDesPrenoms({ jeu, n }: { jeu: Jeu; n: number }) {
  return (
    <Cadre pied={<Bouton titre="⚙️ Ajouter des prénoms" couleur={jeu.couleur} onPress={() => router.push('/reglages')} style={{ flex: 0 }} />}>
      <Puce texte="Il faut des prénoms" couleur={jeu.couleur} />
      <Question>Ajoute au moins {n} prénoms pour jouer à ce jeu.</Question>
      <Consigne>Le jeu a besoin de savoir qui joue pour faire tourner le téléphone.</Consigne>
    </Cadre>
  );
}

/** Pioche d'un jeu Hot à cartes : niveau choisi, mode famille, cartes jamais vues d'abord, thème. */
export async function piocheHotPartie(j: Jeu, liste: string[], o: Options): Promise<unknown[]> {
  let p: unknown[] = melanger(piocheHot(liste, o.niveauHot as NiveauHot)).filter((c) => famOK(c, o.mode));
  if (j.partie) p = await fraichesDabord(j.id, p, Math.min(j.partie, p.length));
  return avecTheme(j, p, o);
}

export const LISTES = L as Record<string, string[]>;

export const st = StyleSheet.create({
  corps: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 16, gap: 18 },
  pied: { paddingHorizontal: 18, paddingTop: 8, gap: 6 },
  panneau: { alignSelf: 'stretch', backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 },
  panneauLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  panneauTxt: { color: C.ink, fontFamily: F.texteMoyen, fontSize: 16, lineHeight: 22 },
  gros: { color: C.ink, fontFamily: F.titre, fontSize: 48, textAlign: 'center' },
  aide: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 13, textAlign: 'center' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  pchip: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: R.pill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line, minWidth: '42%', alignItems: 'center' },
  pchipTxt: { color: C.ink, fontFamily: F.texteDemi, fontSize: 16.5 },
});
