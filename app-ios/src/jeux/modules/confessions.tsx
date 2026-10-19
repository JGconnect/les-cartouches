// Confessions anonymes : chacun écrit en secret, puis on devine l'auteur de chaque confession.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';

import { Bouton, Consigne, Lien, Puce, Question, Reponse } from '@/components/ui';
import { t } from '@/lib/contenu';
import { melanger } from '@/lib/cartes';
import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import type { ModuleJeu, PropsCarte } from '../types';
import { Cadre, IlFautDesPrenoms, LISTES, Passe } from './_hot';

type Conf = { a: string; t: string };
const idee = () => LISTES.CONF_PROMPTS[Math.floor(Math.random() * LISTES.CONF_PROMPTS.length)];

function Confessions(p: PropsCarte) {
  const [ordre] = useState(() => melanger(p.joueurs));
  const [wi, setWi] = useState(0);
  const [ecrit, setEcrit] = useState(false);
  const [texte, setTexte] = useState('');
  const [piste, setPiste] = useState(idee);
  const [conf, setConf] = useState<Conf[]>([]);
  const [liste, setListe] = useState<Conf[] | null>(null);
  const [ri, setRi] = useState(0);
  const [vu, setVu] = useState(false);
  if (p.joueurs.length < 3) return <IlFautDesPrenoms jeu={p.jeu} n={3} />;

  // Révélation
  if (liste) {
    const c = liste[ri];
    const dernier = ri + 1 >= liste.length;
    return (
      <Cadre pied={<>
        {vu ? <Bouton titre={dernier ? 'Terminer' : 'Confession suivante →'} couleur={p.jeu.couleur} style={{ flex: 0 }}
          onPress={() => { if (dernier) { p.quitter(); return; } setRi(ri + 1); setVu(false); }} />
          : <Bouton titre="Révéler l'auteur" couleur={p.jeu.couleur} style={{ flex: 0 }} onPress={() => { vibrer.moyen(); setVu(true); }} />}
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        <Puce texte={`Confession ${ri + 1} / ${liste.length}`} couleur={p.jeu.couleur} />
        <Question>« {c.t} »</Question>
        <Consigne>{vu ? `Ceux qui se sont trompés ${t('{boivent}', p.mode)} !` : 'Qui a écrit ça ? À trois, tout le monde pointe un suspect !'}</Consigne>
        {vu ? <Reponse titre={`✍️ ${c.a}`} etat="ok" /> : null}
      </Cadre>
    );
  }

  const w = ordre[wi];
  if (!ecrit) {
    return (
      <Passe jeu={p.jeu} nom={w} bouton={`Je suis ${w} → écrire`} onPress={() => { setTexte(''); setPiste(idee()); setEcrit(true); }} quitter={p.quitter}
        message={`${wi ? 'Confession enregistrée 🤫 ' : ''}Chacun écrit une confession en secret. Personne ne regarde !`} />
    );
  }

  const valider = () => {
    const v = texte.trim();
    if (!v) return;
    vibrer.succes();
    const toutes = conf.concat({ a: w, t: v.slice(0, 200) });
    setConf(toutes);
    setEcrit(false);
    if (wi + 1 >= ordre.length) setListe(melanger(toutes));
    setWi(wi + 1);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={60}>
      <Cadre pied={<Bouton titre="🤫 Valider en secret" couleur={p.jeu.couleur} desactive={!texte.trim()} onPress={valider} style={{ flex: 0 }} />}>
        <Puce texte={`Confession de ${w}`} couleur={p.jeu.couleur} />
        <Consigne>Idée : {piste}</Consigne>
        <Lien titre="🎲 Autre idée" onPress={() => setPiste(idee())} />
        <TextInput
          value={texte}
          onChangeText={setTexte}
          placeholder="Écris ta confession…"
          placeholderTextColor={C.inkFaint}
          multiline
          maxLength={200}
          autoFocus
          style={s.champ}
        />
      </Cadre>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  champ: { minHeight: 120, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 14, color: C.ink, fontFamily: F.texte, fontSize: 17, lineHeight: 23, textAlignVertical: 'top' },
});

const module: ModuleJeu = {
  Composant: Confessions,
  preparer: async () => ({ pioche: [0] }),
  sansProgression: true,
  fraicheur: () => null,
  minJoueurs: 3,
};
export default module;
