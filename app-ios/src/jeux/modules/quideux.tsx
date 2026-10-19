// Qui de nous deux ? — les deux amoureux pointent, la table arbitre. À la fin : le score de complicité.
import { useState } from 'react';
import { Text } from 'react-native';

import { Bouton, Consigne, Ligne, Lien, Puce, Question } from '@/components/ui';
import { icone, jeu as trouverJeu } from '@/lib/contenu';
import { vibrer } from '@/lib/vibrer';

import type { ModuleJeu, PropsCarte } from '../types';
import { Cadre, LISTES, piocheHotPartie, PuceHot, st, texteHot } from './_hot';

function QuiDeux(p: PropsCarte) {
  const [bilan, setBilan] = useState(false);
  const c = String(p.carte);
  const ex = p.extra as { accord: number };
  const I = icone(p.mode);

  const ensuite = () => {
    if (p.idx + 1 >= p.total) { vibrer.succes(); setBilan(true); return; }
    p.suivant();
  };

  if (bilan) {
    const pc = Math.round((100 * ex.accord) / p.total);
    return (
      <Cadre pied={<Bouton titre="Terminer" couleur={p.jeu.couleur} onPress={p.quitter} style={{ flex: 0 }} />}>
        <Puce texte="Votre complicité" couleur={p.jeu.couleur} />
        <Text style={st.gros}>💞 {pc} %</Text>
        <Consigne>D'accord sur {ex.accord} question{ex.accord > 1 ? 's' : ''} sur {p.total}.</Consigne>
      </Cadre>
    );
  }

  return (
    <Cadre pied={<>
      <Ligne>
        <Bouton titre="🤝 D'accord" couleur={p.jeu.couleur} onPress={() => { ex.accord++; ensuite(); }} />
        <Bouton titre={`😬 Pas d'accord → ${I}`} variante="penalite" onPress={() => p.donnerGage('les deux amoureux', ensuite)} />
      </Ligne>
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <PuceHot carte={c} couleur={p.jeu.couleur} />
      <Question>{texteHot(c, p.mode)}</Question>
      <Consigne>À trois, les deux amoureux pointent la personne qui correspond. Le reste de la table arbitre !</Consigne>
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: QuiDeux,
  preparer: async (o) => ({ pioche: await piocheHotPartie(trouverJeu('quideux')!, LISTES.QUIDEUX, o), extra: { accord: 0 } }),
  fraicheur: () => 'quideux',
};
export default module;
