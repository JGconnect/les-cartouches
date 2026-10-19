// L'histoire à la chaîne : chacun ajoute une ou deux phrases en y casant un mot imposé.
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, Consigne, Ligne, Puce } from '@/components/ui';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { L } from '@/lib/contenu';
import { C, F, R } from '@/lib/theme';

import type { ModuleJeu, PropsCarte } from '../types';
import { Cadre, Quitter, st } from './audio';

/** Mots imposés : on les mélange une fois, et on remélange quand on a fait le tour (comme hWords sur le site). */
function motSuivant(extra: any): string {
  const e = extra || {};
  if (!e.mots || !e.mots.length) { e.mots = melanger(L.HIST_MOTS as string[]); e.n = 0; }
  const w = e.mots[e.n % e.mots.length];
  e.n += 1;
  if (e.n % e.mots.length === 0) e.mots = melanger(L.HIST_MOTS as string[]);
  return w;
}

function Histoire(p: PropsCarte) {
  const nomme = p.joueurs.length >= 2;
  const [tour, setTour] = useState(p.idx);
  const [mot, setMot] = useState(() => motSuivant(p.extra));
  const conteur = nomme ? p.joueurs[tour % p.joueurs.length] : 'La personne suivante';

  return (
    <Cadre pied={<>
      <Bouton titre="Phrase dite → au suivant" couleur={p.jeu.couleur} onPress={() => { setTour(tour + 1); setMot(motSuivant(p.extra)); }} style={{ flex: 0 }} />
      <Ligne>
        <Bouton titre="🔄 Autre mot" variante="fantome" petit onPress={() => setMot(motSuivant(p.extra))} />
        <Bouton titre="📖 Nouvelle histoire" variante="fantome" petit onPress={p.suivant} />
      </Ligne>
      <Quitter fn={p.quitter} />
    </>}>
      <Puce texte={`Histoire ${p.idx + 1}`} couleur={p.jeu.couleur} />
      <Text style={debut}>{p.carte as string}</Text>
      <View style={[st.indices, { alignItems: 'center', gap: 6 }]}>
        <Text style={st.lbl}>AU TOUR DE</Text>
        <Text style={{ color: C.ink, fontFamily: F.titre, fontSize: 24 }}>{conteur}</Text>
        <Text style={[st.lbl, { marginTop: 8 }]}>TON MOT IMPOSÉ</Text>
        <Text style={{ color: p.jeu.couleur, fontFamily: F.titre, fontSize: 32, textAlign: 'center' }}>{mot}</Text>
      </View>
      <Consigne>Continue l'histoire en une ou deux phrases, en y casant ce mot. Hésitation de plus de cinq secondes : la table peut te huer.</Consigne>
    </Cadre>
  );
}

const debut = { color: C.ink, fontFamily: F.texteMoyen, fontSize: 19, lineHeight: 27, textAlign: 'center' as const, fontStyle: 'italic' as const, backgroundColor: C.surface, borderRadius: R.lg, padding: 16 };

const module: ModuleJeu = {
  Composant: Histoire,
  sansProgression: true,
  fraicheur: () => 'histoire',
  preparer: async () => {
    const tout = L.HIST_DEBUTS as string[];
    return { pioche: await fraichesDabord('histoire', melanger(tout), tout.length), extra: {} };
  },
};
export default module;
