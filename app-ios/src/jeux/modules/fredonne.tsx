// Fredonne-moi ça : une personne fredonne une chanson secrète (sans paroles), les autres trouvent le titre.
import { useState } from 'react';
import { View } from 'react-native';

import { Bouton, Consigne, Lien, Puce, Question } from '@/components/ui';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { L } from '@/lib/contenu';
import { C, melange } from '@/lib/theme';

import type { ModuleJeu, PropsCarte } from '../types';
import { AffichageMinuteur, Bandeau, Cadre, ChoixJoueur, prendreSuivant, Quitter, Tableau, useMinuteur } from './audio';

type Phase = 'main' | 'secret' | 'fredonne' | 'qui' | 'resultat';

function Fredonne(p: PropsCarte) {
  const nomme = p.joueurs.length >= 2;
  const qui = nomme ? p.tour : 'la personne qui fredonne';
  const tirer = () => { const s = prendreSuivant<string>(p.pioche, p.extra); p.marquerVue('fredonne', s); return s.split('|'); };
  const [chanson, setChanson] = useState<string[]>(tirer);
  const [phase, setPhase] = useState<Phase>('main');
  const [gagnant, setGagnant] = useState<string | null>(null);
  const [tempsFini, setTempsFini] = useState(false);
  const m = useMinuteur();
  const bord = melange(p.jeu.couleur, 0.4, C.line);

  const Chanson = () => (<><Question>{chanson[0]}</Question><Consigne>{chanson[1]}</Consigne></>);

  if (phase === 'main') {
    return (
      <Cadre pied={<>
        <Bouton titre="Voir la chanson" couleur={p.jeu.couleur} onPress={() => setPhase('secret')} style={{ flex: 0 }} />
        <Quitter fn={p.quitter} />
      </>}>
        <Bandeau emoji={p.jeu.emoji} libelle="Au micro (sans paroles)" nom={qui} bord={bord} />
        <Puce texte={`Manche ${p.idx + 1}`} couleur={p.jeu.couleur} />
        <Question petit>{nomme ? `Passe le téléphone à ${qui}.` : 'Passe le téléphone à celle ou celui qui fredonne.'}</Question>
        <Consigne>Les autres, ne regardez pas l'écran.</Consigne>
      </Cadre>
    );
  }

  if (phase === 'secret') {
    return (
      <Cadre pied={<>
        <Bouton titre="▶️ Je fredonne (30 s)" couleur={p.jeu.couleur} onPress={() => { setPhase('fredonne'); setTempsFini(false); m.lancer(30, () => setTempsFini(true)); }} style={{ flex: 0 }} />
        <Lien titre="Je ne la connais pas → une autre" onPress={() => setChanson(tirer())} />
      </>}>
        <Puce texte="Chanson secrète" couleur={p.jeu.couleur} />
        <Chanson />
        <Consigne>Fredonne-la : « mmm », « lalala » ou en sifflant, mais sans aucune parole. Les autres doivent trouver le titre.</Consigne>
      </Cadre>
    );
  }

  if (phase === 'fredonne') {
    return (
      <Cadre pied={<>
        <Bouton titre="🎉 Trouvé !" couleur={C.soft} onPress={() => { m.arreter(); if (!nomme) { setGagnant(''); setPhase('resultat'); } else setPhase('qui'); }} style={{ flex: 0 }} />
        <Bouton titre={tempsFini ? '⏰ Temps écoulé → révéler' : "😶 Personne n'a trouvé"} variante="fantome" onPress={() => { m.arreter(); setGagnant(null); setPhase('resultat'); }} style={{ flex: 0 }} />
      </>}>
        <Puce texte={`${qui} fredonne`} couleur={p.jeu.couleur} />
        <AffichageMinuteur decompte={m.decompte} reste={m.reste} total={m.total} />
        <Consigne>Le premier qui crie le bon titre marque un point. Téléphone caché !</Consigne>
      </Cadre>
    );
  }

  if (phase === 'qui') {
    const autres = p.joueurs.filter((x) => x !== qui);
    return (
      <Cadre>
        <Puce texte="Bravo !" couleur={p.jeu.couleur} />
        <Chanson />
        <Question petit>Qui a trouvé ?</Question>
        <ChoixJoueur joueurs={autres} choisir={(w) => { p.ajouterPoint(w, 1); p.ajouterPoint(qui, 1); setGagnant(w); setPhase('resultat'); }} />
      </Cadre>
    );
  }

  // Résultat (les points viennent d'être ajoutés : on affiche le classement à jour)
  return (
    <Cadre pied={<>
      <Bouton titre="Chanson suivante →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
      <Quitter fn={p.quitter} />
    </>}>
      <Puce texte={gagnant === null ? "Personne n'a trouvé" : 'Trouvé !'} couleur={p.jeu.couleur} />
      <Chanson />
      {gagnant ? <Consigne>{gagnant} et {qui} marquent chacun 1 point.</Consigne> : null}
      <View><Tableau scores={p.scores} /></View>
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: Fredonne,
  sansProgression: true,
  fraicheur: () => null,
  preparer: async () => {
    const tout = L.CHANSONS as string[];
    return { pioche: await fraichesDabord('fredonne', melanger(tout), tout.length), extra: { curseur: { n: 0 } } };
  },
};
export default module;
