// La roue du piment : la roue tire deux joueurs, puis le défi à relever ensemble.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Bouton, Ligne, Lien, Question } from '@/components/ui';
import { icone, jeu as trouverJeu } from '@/lib/contenu';
import { melanger } from '@/lib/cartes';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import type { ModuleJeu, PropsCarte } from '../types';
import { Cadre, LISTES, piocheHotPartie, PuceHot, texteHot } from './_hot';

const SANS_PRENOMS = ['La personne à ta gauche', 'La personne à ta droite', 'La personne en face', "Celui ou celle qui a lancé l'appli"];

function Roue(p: PropsCarte) {
  const noms = p.joueurs.length >= 2 ? p.joueurs.slice() : SANS_PRENOMS;
  const ex = p.extra as { sac: string[] };
  const c = String(p.carte);
  const I = icone(p.mode);
  const [affiche, setAffiche] = useState<[string, string]>(['?', '?']);
  const [paire, setPaire] = useState<[string, string] | null>(null);
  const [tourne, setTourne] = useState(false);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (minuterie.current) clearInterval(minuterie.current); }, []);

  const tirer = (): [string, string] => {
    if (ex.sac.length < 2) ex.sac = ex.sac.concat(melanger(noms.filter((n) => !ex.sac.includes(n))));
    const a = ex.sac.shift()!;
    let b = ex.sac.shift();
    if (b === undefined || a === b) b = melanger(noms.filter((n) => n !== a))[0];
    return [a, b!];
  };

  const lancer = () => {
    if (tourne || paire) return;
    setTourne(true);
    const choix = tirer();
    let n = 0;
    const hasard = () => noms[Math.floor(Math.random() * noms.length)];
    minuterie.current = setInterval(() => {
      n++;
      vibrer.choix();
      if (n >= 16) {
        if (minuterie.current) clearInterval(minuterie.current);
        setAffiche(choix); setPaire(choix); setTourne(false); vibrer.fort();
        return;
      }
      setAffiche([hasard(), hasard()]);
    }, 70);
  };

  // Le défi, avec les deux prénoms en gras.
  const morceaux = paire ? texteHot(c, p.mode).split(/(\{a\}|\{b\})/g) : [];

  return (
    <Cadre pied={<>
      {paire ? (
        <Ligne>
          <Bouton titre="✅ Défi relevé" couleur={p.jeu.couleur} onPress={p.suivant} />
          <Bouton titre={`On passe → ${I}`} variante="penalite" onPress={() => p.donnerGage(`${paire[0]} et ${paire[1]}`, p.suivant)} />
        </Ligne>
      ) : (
        <Bouton titre="🎡 Lancer la roue" couleur={p.jeu.couleur} desactive={tourne} onPress={lancer} style={{ flex: 0 }} />
      )}
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <PuceHot carte={c} couleur={p.jeu.couleur} />
      <View style={[s.roue, paire && { borderColor: p.jeu.couleur, backgroundColor: melange(p.jeu.couleur, 0.18, C.surface) }]}>
        <Text style={s.nom} numberOfLines={2}>{affiche[0]}</Text>
        <Text style={[s.et, { color: p.jeu.couleur }]}>&</Text>
        <Text style={s.nom} numberOfLines={2}>{affiche[1]}</Text>
      </View>
      <View style={{ minHeight: 110, justifyContent: 'center' }}>
        {paire ? (
          <Question petit>
            {morceaux.map((m, i) => (m === '{a}' || m === '{b}'
              ? <Text key={i} style={{ color: p.jeu.couleur }}>{m === '{a}' ? paire[0] : paire[1]}</Text>
              : <Text key={i}>{m}</Text>))}
          </Question>
        ) : null}
      </View>
    </Cadre>
  );
}

const s = StyleSheet.create({
  roue: { alignSelf: 'stretch', alignItems: 'center', gap: 6, paddingVertical: 24, paddingHorizontal: 16, borderRadius: R.lg, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface },
  nom: { color: C.ink, fontFamily: F.titre, fontSize: 24, textAlign: 'center' },
  et: { fontFamily: F.titre, fontSize: 22 },
});

const module: ModuleJeu = {
  Composant: Roue,
  preparer: async (o) => ({ pioche: await piocheHotPartie(trouverJeu('roue')!, LISTES.ROUE, o), extra: { sac: [] as string[] } }),
  fraicheur: () => 'roue',
};
export default module;
