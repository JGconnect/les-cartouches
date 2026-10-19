// Petit Bac : une lettre, cinq catégories, un chrono ; correction avec le pavé des points.
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Puce, Question } from '@/components/ui';
import { melanger } from '@/lib/cartes';
import { L } from '@/lib/contenu';
import { C, F } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import { PavePoints } from '../cartes';
import type { ModuleJeu, PropsCarte } from '../types';
import { Cadre, Decompte, parler, s, useChrono } from './_outils-quiz';

const BAC_LETTRES = 'ABCDEFGHIJLMNOPRSTV'.split('');
/** Dernières lettres tirées (pas deux fois la même de suite). */
const dernieres: string[] = [];

function tirer(): { lettre: string; cats: string[] } {
  const pool = BAC_LETTRES.filter((x) => !dernieres.includes(x));
  const lettre = pool[Math.floor(Math.random() * pool.length)];
  dernieres.push(lettre);
  if (dernieres.length > 6) dernieres.shift();
  return { lettre, cats: melanger(L.BAC_CATS as string[]).slice(0, 5) };
}

function Bac(p: PropsCarte) {
  const duree = Number(p.opts.duree || 90);
  const [tirage, setTirage] = useState(tirer);
  const [phase, setPhase] = useState<'pret' | 'jeu' | 'correction'>('pret');
  const [aZero, setAZero] = useState(false);
  const chrono = useChrono(duree, () => { parler('Stop ! Stylos levés !'); setAZero(true); setPhase('correction'); });

  const lettre = (petit?: boolean) => (
    <Text style={{ color: p.jeu.couleur, fontFamily: F.titre, fontSize: petit ? 72 : 110, lineHeight: petit ? 78 : 116, textAlign: 'center' }}>{tirage.lettre}</Text>
  );
  const categories = (
    <View style={[s.boite, { alignSelf: 'center', width: '100%', maxWidth: 380, gap: 7 }]}>
      {tirage.cats.map((c, i) => (
        <Text key={c} style={{ color: C.ink, fontFamily: F.texteDemi, fontSize: 16 }}>
          <Text style={{ color: p.jeu.couleur, fontFamily: F.titre }}>{i + 1}.  </Text>{c}
        </Text>
      ))}
    </View>
  );

  if (phase === 'pret') {
    return (
      <View style={{ flex: 1 }}>
        <Cadre pied={<>
          <Bouton titre={`▶️ Top chrono (${duree} s)`} couleur={p.jeu.couleur} onPress={() => { setPhase('jeu'); chrono.lancer(); }} style={{ flex: 0 }} />
          <Bouton titre="🔄 Autre tirage" variante="fantome" petit onPress={() => { vibrer.choix(); setTirage(tirer()); }} style={{ flex: 0 }} />
          <Lien titre="Terminer la partie" onPress={p.quitter} />
        </>}>
          <Puce texte={`Manche ${p.idx + 1}`} couleur={p.jeu.couleur} />
          {lettre()}
          {categories}
          <Consigne>Trouvez un mot qui commence par {tirage.lettre} pour chaque catégorie. Sur papier, sur son téléphone, ou à l'oral : le premier qui trouve marque.</Consigne>
        </Cadre>
      </View>
    );
  }
  if (phase === 'jeu') {
    return (
      <View style={{ flex: 1 }}>
        <Cadre pied={<Bouton titre="✋ Stop ! J'ai tout rempli" couleur={p.jeu.couleur} onPress={() => { chrono.arreter(); vibrer.alerte(); setAZero(false); setPhase('correction'); }} style={{ flex: 0 }} />}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
            {lettre(true)}
            <Text style={[s.chiffre, chrono.reste <= 10 && { color: C.trash }]}>{chrono.reste}</Text>
          </View>
          {categories}
        </Cadre>
        <Decompte n={chrono.decompte} couleur={p.jeu.couleur} />
      </View>
    );
  }
  return (
    <Cadre pied={<>
      <Bouton titre="Manche suivante →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Puce texte={aZero ? 'Temps écoulé' : 'Stop !'} couleur={p.jeu.couleur} />
      <Question>Correction</Question>
      {categories}
      <Consigne>Chacun lit ses réponses avec la lettre {tirage.lettre}. Réponse valable : 1 point. Réponse que personne d'autre n'a trouvée : 2 points (touche deux fois).</Consigne>
      <PavePoints joueurs={p.joueurs} scores={p.scores} ajouterPoint={p.ajouterPoint} libelle="Points de la manche · touche pour +1" />
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: Bac,
  sansProgression: true,
  fraicheur: () => null,
  options: [{ cle: 'duree', titre: 'Chrono', defaut: '90', choix: [60, 90, 120].map((n) => ({ id: String(n), titre: `${n} s` })) }],
  preparer: async () => ({ pioche: Array.from({ length: 200 }, (_, i) => i) }),
};
export default module;
