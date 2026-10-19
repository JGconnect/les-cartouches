// Le Mot interdit : faire deviner un maximum de mots à son équipe sans dire les mots interdits.
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Ligne, Puce, Question } from '@/components/ui';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { famOK, jeu, L } from '@/lib/contenu';
import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import { avecTheme } from '../moteur';
import type { ModuleJeu, PropsCarte } from '../types';
import { Bandeau, Cadre, Classement, Decompte, nomEquipe, parler, s, TeteChrono, useChrono } from './_outils-quiz';

type Extra = { cartes: string[]; pos: number };

function Taboo(p: PropsCarte) {
  const x = p.extra as Extra;
  const nbEq = Number(p.opts.equipes || 2);
  const duree = Number(p.opts.duree || 60);
  const equipe = nomEquipe(p.idx % nbEq);
  const [phase, setPhase] = useState<'main' | 'jeu' | 'fin'>('main');
  const [carte, setCarte] = useState<string[]>([]);
  const [points, setPoints] = useState(0);
  const [trouves, setTrouves] = useState(0);
  const pointsRef = useRef(0);
  const fini = useRef(false);

  function piocher() {
    if (!x.cartes.length) return;
    const c = x.cartes[x.pos % x.cartes.length];
    x.pos++;
    p.marquerVue('taboo', c);
    setCarte(c.split('|'));
  }
  const chrono = useChrono(duree, () => terminer());
  function terminer() {
    if (fini.current) return;
    fini.current = true;
    chrono.arreter();
    vibrer.alerte();
    parler('Temps écoulé !');
    p.ajouterPoint(equipe, pointsRef.current);
    setPhase('fin');
  }
  const marquer = (n: number) => { pointsRef.current += n; setPoints(pointsRef.current); };
  const pl = (n: number) => `${n} pt${Math.abs(n) > 1 ? 's' : ''}`;

  if (phase === 'main') {
    return (
      <Cadre pied={<>
        <Bouton titre="▶️ C'est parti" couleur={p.jeu.couleur} onPress={() => { piocher(); setPhase('jeu'); chrono.lancer(); }} style={{ flex: 0 }} />
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        <Bandeau jeu={p.jeu} lbl="Au tour de" nom={equipe} />
        <Puce texte={`Manche ${p.idx + 1} · ${duree} s`} couleur={p.jeu.couleur} />
        <Question>Qui fait deviner ?</Question>
        <Consigne>Une personne de {equipe} prend le téléphone et fait deviner un maximum de mots à son équipe, sans dire le mot ni les mots interdits. Un adversaire regarde l'écran par-dessus son épaule pour surveiller.</Consigne>
      </Cadre>
    );
  }
  if (phase === 'jeu') {
    return (
      <View style={{ flex: 1 }}>
        <Cadre
          haut={<TeteChrono titre={equipe} reste={chrono.reste} total={duree} couleur={p.jeu.couleur} infos={[pl(points)]} />}
          pied={<>
            <Ligne>
              <Bouton titre="✅ Trouvé" couleur={C.soft} onPress={() => { vibrer.succes(); marquer(1); setTrouves((n) => n + 1); piocher(); }} />
              <Bouton titre="⏭ Passer" variante="fantome" onPress={() => { vibrer.choix(); piocher(); }} />
            </Ligne>
            <Bouton titre="🚫 Mot interdit dit (−1)" couleur={C.trash} petit onPress={() => { vibrer.alerte(); marquer(-1); piocher(); }} style={{ flex: 0 }} />
          </>}
        >
          <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.xl, paddingVertical: 24, paddingHorizontal: 18, gap: 12, alignItems: 'center' }}>
            <Text style={{ color: p.jeu.couleur, fontFamily: F.titre, fontSize: 44, lineHeight: 48, textAlign: 'center' }}>{carte[0]}</Text>
            <Text style={s.lbl}>Interdit de dire</Text>
            {carte.slice(1).map((w) => (
              <Text key={w} style={{ color: C.trash, fontFamily: F.texteDemi, fontSize: 19, textDecorationLine: 'line-through' }}>{w}</Text>
            ))}
          </View>
        </Cadre>
        <Decompte n={chrono.decompte} couleur={p.jeu.couleur} />
      </View>
    );
  }
  return (
    <Cadre pied={<>
      <Bouton titre={`Au tour de ${nomEquipe((p.idx + 1) % nbEq)} →`} couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Puce texte="Temps écoulé" couleur={p.jeu.couleur} />
      <Question>{equipe} : {points} point{Math.abs(points) > 1 ? 's' : ''}</Question>
      <Consigne>{trouves} mot{trouves > 1 ? 's' : ''} trouvé{trouves > 1 ? 's' : ''}. Le dernier mot était « {carte[0]} ».</Consigne>
      <Classement scores={p.scores} />
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: Taboo,
  sansProgression: true,
  fraicheur: () => null,
  options: [
    { cle: 'equipes', titre: "Nombre d'équipes", defaut: '2', choix: [2, 3, 4].map((n) => ({ id: String(n), titre: `${n} équipes` })) },
    { cle: 'duree', titre: 'Chrono', defaut: '60', choix: [45, 60, 90].map((n) => ({ id: String(n), titre: `${n} s` })) },
  ],
  async preparer(o) {
    const tout = L.TABOO as string[];
    let cartes = (await fraichesDabord('taboo', melanger(tout), tout.length)).filter((c) => famOK(c, o.mode));
    const j = jeu('taboo');
    if (j) cartes = avecTheme(j, cartes, o) as string[];
    const extra: Extra = { cartes, pos: 0 };
    return { pioche: Array.from({ length: 200 }, (_, i) => i), extra };
  },
};
export default module;
