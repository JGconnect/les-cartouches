// Qui a dit ? : une réplique culte, on crie qui l'a dite (renderQuiadit du site).
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Bouton, Consigne, Lien, Puce, Question, Reponse } from '@/components/ui';
import { L } from '@/lib/contenu';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { C, F } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import type { ModuleJeu, Options, PropsCarte } from '../types';
import { Cadre, PaveN } from './_commun-a';

const NIVEAUX: Record<string, [string, number]> = { f: ['🟢 Facile', 1], m: ['🟠 Moyen', 2], d: ['🔴 Difficile', 3], p: ['✏️ Entre nous', 2] };

function QuiADit(p: PropsCarte) {
  const [vu, setVu] = useState(false);
  const q = String(p.carte).split('|');
  const niv = q.shift() || 'f';
  const lv = NIVEAUX[niv] || NIVEAUX.f;
  // Mémoire « déjà vues » par niveau, comme le site (quiadit_f, quiadit_m, quiadit_d).
  useEffect(() => { if (niv !== 'p') p.marquerVue('quiadit_' + niv, p.carte); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Cadre pied={<>
      {vu ? <Bouton titre="Suivante →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
        : <Bouton titre="Révéler la réponse" couleur={p.jeu.couleur} onPress={() => { vibrer.moyen(); setVu(true); }} style={{ flex: 0 }} />}
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Puce texte={`${lv[0]} · ${lv[1]} point${lv[1] > 1 ? 's' : ''}`} couleur={p.jeu.couleur} />
      <Question>« {q[0]} »</Question>
      {!vu ? (
        <Consigne>Lis la réplique à voix haute. Les autres crient le personnage, la personne ou le film.</Consigne>
      ) : (
        <>
          <Reponse titre={q[1]} texte={[q[2], q[3]].filter(Boolean).join(' · ')} couleur={p.jeu.couleur} />
          {q[4] ? <Text style={{ color: C.inkSoft, fontFamily: F.texte, fontSize: 14.5, lineHeight: 21, textAlign: 'center' }}>📍 {q[4]}</Text> : null}
          <PaveN joueurs={p.joueurs.length >= 2 ? p.joueurs : []} scores={p.scores} ajouterPoint={p.ajouterPoint} n={lv[1]} libelle={`Qui a trouvé ? Touche pour +${lv[1]}`} />
        </>
      )}
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: QuiADit,
  options: [{
    cle: 'niveau', titre: 'Difficulté', defaut: 'mix',
    choix: [
      { id: 'f', titre: '🟢 Facile', sous: '1 point' },
      { id: 'm', titre: '🟠 Moyen', sous: '2 points' },
      { id: 'd', titre: '🔴 Difficile', sous: '3 points' },
      { id: 'mix', titre: '📈 Progressif', sous: 'les trois' },
    ],
  }],
  async preparer(o: Options) {
    const parNiveau = (l: string) => (L.CITATIONS as string[]).filter((c) => c.charAt(0) === l);
    const n = o.opts.niveau || 'mix';
    if (n === 'mix') {
      const f = await fraichesDabord('quiadit_f', melanger(parNiveau('f')), 5);
      const m = await fraichesDabord('quiadit_m', melanger(parNiveau('m')), 5);
      const d = await fraichesDabord('quiadit_d', melanger(parNiveau('d')), 5);
      return { pioche: [...f, ...m, ...d] };
    }
    return { pioche: await fraichesDabord('quiadit_' + n, melanger(parNiveau(n)), 15) };
  },
  fraicheur: () => null,
};

export default module;
