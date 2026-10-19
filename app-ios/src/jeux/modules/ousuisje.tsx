// Où suis-je ? : un lieu mystère, jusqu'à cinq indices ; moins il en faut, plus ça rapporte.
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, Lien, Ligne, Consigne, Puce, Question } from '@/components/ui';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { L } from '@/lib/contenu';
import { C, melange } from '@/lib/theme';

import type { ModuleJeu, PropsCarte } from '../types';
import { Bandeau, Cadre, ChoixJoueur, Quitter, st, Tableau } from './audio';

const lieux = (c: string) => (L.LIEUX as string[][]).filter((l) => c === 'mix' || l[1] === c);

function Indices({ lieu, n }: { lieu: string[]; n: number }) {
  return (
    <View style={st.indices}>
      {lieu.slice(2, 2 + n).map((c, i) => (
        <Text key={i} style={st.indice}><Text style={st.indiceN}>Indice {i + 1}  </Text>{c}</Text>
      ))}
    </View>
  );
}

function OuSuisJe(p: PropsCarte) {
  const nomme = p.joueurs.length >= 2;
  const lecteur = nomme ? p.tour : 'le lecteur';
  const lieu = p.carte as string[];
  const [vus, setVus] = useState(1);
  const [voir, setVoir] = useState(false);
  const [phase, setPhase] = useState<'jeu' | 'qui' | 'resultat'>('jeu');
  const [gagnant, setGagnant] = useState<string | null>(null);
  const pts = 6 - vus;
  const bord = melange(p.jeu.couleur, 0.4, C.line);

  if (phase === 'qui') {
    const autres = p.joueurs.filter((x) => x !== lecteur);
    return (
      <Cadre pied={<Lien titre="← Fausse alerte" onPress={() => setPhase('jeu')} />}>
        <Puce texte="Bravo !" couleur={p.jeu.couleur} />
        <Question>{lieu[0]}</Question>
        <Question petit>Qui a trouvé ?</Question>
        <Consigne>{`${pts} point${pts > 1 ? 's' : ''} (${vus} indice${vus > 1 ? 's' : ''})`}</Consigne>
        <ChoixJoueur joueurs={autres} choisir={(w) => { p.ajouterPoint(w, pts); setGagnant(w); setPhase('resultat'); }} />
      </Cadre>
    );
  }

  if (phase === 'resultat') {
    return (
      <Cadre pied={<>
        <Bouton titre="Lieu suivant →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
        <Quitter fn={p.quitter} />
      </>}>
        <Puce texte={gagnant === null ? "Personne n'a trouvé" : 'Trouvé !'} couleur={p.jeu.couleur} />
        <Consigne>C'était…</Consigne>
        <Question>{lieu[0]}</Question>
        <Indices lieu={lieu} n={lieu.length - 2} />
        {gagnant ? <Consigne>{`${gagnant} marque ${pts} point${pts > 1 ? 's' : ''}.`}</Consigne> : null}
        <Tableau scores={p.scores} />
      </Cadre>
    );
  }

  return (
    <Cadre pied={<>
      {vus < 5 ? <Bouton titre="💡 Indice suivant" couleur={p.jeu.couleur} onPress={() => setVus(vus + 1)} style={{ flex: 0 }} /> : null}
      <Ligne>
        <Bouton titre="🎉 Trouvé !" couleur={C.soft} onPress={() => { if (!nomme) { setGagnant(''); setPhase('resultat'); } else setPhase('qui'); }} />
        <Bouton titre="Révéler" variante="fantome" onPress={() => { setGagnant(null); setPhase('resultat'); }} />
      </Ligne>
      <Lien titre={voir ? '🙈 Cacher la réponse' : '👁 Voir la réponse (lecteur seulement)'} onPress={() => setVoir(!voir)} />
      <Quitter fn={p.quitter} />
    </>}>
      <Bandeau emoji="🗺️" libelle={nomme ? 'Lit les indices' : 'Lieu mystère'} nom={lecteur} bord={bord} />
      <Puce texte={`${lieu[1] === 'france' ? '🇫🇷 En France' : '🌍 Dans le monde'} · ${pts} point${pts > 1 ? 's' : ''} en jeu`} couleur={p.jeu.couleur} />
      <Question petit>Où suis-je ?</Question>
      <Indices lieu={lieu} n={vus} />
      <Consigne>{`${nomme ? `${lecteur} lit l'indice à voix haute (et ne joue pas cette manche). ` : ''}Le premier qui trouve gagne. Moins il y a d'indices, plus ça rapporte.`}</Consigne>
      {voir ? <View style={st.reponse}><Text style={st.reponseTitre}>{lieu[0]}</Text></View> : null}
    </Cadre>
  );
}

const CATS: [string, string][] = [['france', '🇫🇷 France'], ['monde', '🌍 Monde'], ['mix', '🎲 Les deux']];

const module: ModuleJeu = {
  Composant: OuSuisJe,
  sansProgression: true,
  fraicheur: (o) => `ou_${o.opts.cat || 'mix'}`,
  options: [{
    cle: 'cat', titre: 'Lieux', defaut: 'mix',
    choix: CATS.map(([id, titre]) => ({ id, titre, sous: `${lieux(id).length} lieux` })),
  }],
  preparer: async (o) => {
    const cat = o.opts.cat || 'mix';
    const pool = lieux(cat);
    return { pioche: await fraichesDabord(`ou_${cat}`, melanger(pool), pool.length) };
  },
};
export default module;
