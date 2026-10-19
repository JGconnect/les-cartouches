// Le baromètre : vote secret, le téléphone tourne, puis les résultats en barres.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton, Consigne, Ligne, Lien, Puce, Question } from '@/components/ui';
import { icone, jeu as trouverJeu } from '@/lib/contenu';
import { melanger } from '@/lib/cartes';
import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import type { ModuleJeu, PropsCarte } from '../types';
import { Cadre, IlFautDesPrenoms, LISTES, piocheHotPartie, PuceHot, st, texteHot } from './_hot';

function Barometre(p: PropsCarte) {
  const [ordre] = useState(() => melanger(p.joueurs));
  const [vi, setVi] = useState(0);
  const [vote, setVote] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const c = String(p.carte);
  const q = texteHot(c, p.mode);
  const I = icone(p.mode);
  if (p.joueurs.length < 3) return <IlFautDesPrenoms jeu={p.jeu} n={3} />;

  if (vi >= ordre.length) {
    const ks = Object.keys(votes).sort((a, b) => votes[b] - votes[a]);
    const max = votes[ks[0]] || 1;
    const top = ks.filter((k) => votes[k] === max);
    return (
      <Cadre pied={<>
        <Ligne>
          <Bouton titre={`${top.join(' et ')} → ${I}`} variante="penalite" onPress={() => p.donnerGage(top.join(' et '), p.suivant)} />
          <Bouton titre="Suivante →" variante="fantome" onPress={p.suivant} />
        </Ligne>
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        <PuceHot carte={c} couleur={p.jeu.couleur} />
        <Question petit>{q}</Question>
        <View style={st.panneau}>
          {ks.map((k) => (
            <View key={k} style={s.ligne}>
              <Text style={s.nom} numberOfLines={1}>{k}</Text>
              <View style={s.piste}><View style={[s.barre, { width: `${Math.round((100 * votes[k]) / ordre.length)}%`, backgroundColor: p.jeu.couleur }]} /></View>
              <Text style={s.val}>{votes[k]}</Text>
            </View>
          ))}
        </View>
        <Consigne>🏆 {top.join(' et ')} l'emporte{top.length > 1 ? 'nt' : ''} !</Consigne>
      </Cadre>
    );
  }

  const v = ordre[vi];
  if (vote) {
    return (
      <Cadre pied={null}>
        <Puce texte={`Vote secret de ${v}`} couleur={p.jeu.couleur} />
        <Question petit>{q}</Question>
        <View style={st.grille}>
          {p.joueurs.filter((x) => x !== v).map((x) => (
            <Pressable key={x} style={({ pressed }) => [st.pchip, pressed && { borderColor: p.jeu.couleur }]}
              onPress={() => {
                vibrer.choix();
                setVotes((o) => ({ ...o, [x]: (o[x] || 0) + 1 }));
                setVote(false);
                if (vi + 1 >= ordre.length) vibrer.succes();
                setVi(vi + 1);
              }}>
              <Text style={st.pchipTxt}>{x}</Text>
            </Pressable>
          ))}
        </View>
      </Cadre>
    );
  }

  return (
    <Cadre pied={<>
      <Bouton titre={`Je suis ${v} → voter`} couleur={p.jeu.couleur} onPress={() => setVote(true)} style={{ flex: 0 }} />
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <PuceHot carte={c} couleur={p.jeu.couleur} />
      <Question>{q}</Question>
      <Consigne>{vi ? 'Vote enregistré 🤫 ' : ''}Chacun vote en secret. Passe le téléphone à {v}.</Consigne>
      <Text style={st.aide}>{vi} / {ordre.length} votes</Text>
    </Cadre>
  );
}

const s = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nom: { width: 92, color: C.ink, fontFamily: F.texteDemi, fontSize: 15 },
  piste: { flex: 1, height: 14, borderRadius: R.pill, backgroundColor: C.surface2, overflow: 'hidden' },
  barre: { height: '100%', borderRadius: R.pill },
  val: { width: 22, textAlign: 'right', color: C.ink, fontFamily: F.titreGras, fontSize: 15 },
});

const module: ModuleJeu = {
  Composant: Barometre,
  preparer: async (o) => ({ pioche: await piocheHotPartie(trouverJeu('barometre')!, LISTES.BAROMETRE, o) }),
  fraicheur: () => 'barometre',
  minJoueurs: 3,
};
export default module;
