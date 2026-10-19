// « Ce jeu vous a plu ? » : pouce en haut / en bas + un mot facultatif (table retours, comme le site).
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Bouton } from '@/components/ui';
import { useReglages } from '@/lib/reglages';
import { envoyerAvis } from '@/lib/session';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

export function BlocAvis({ jeu }: { jeu: string }) {
  const { mode, joueurs } = useReglages();
  const [choix, setChoix] = useState<0 | 1 | -1>(0);
  const [note, setNote] = useState('');
  const [etat, setEtat] = useState<'' | 'envoi' | 'ok' | 'attente'>('');
  const fige = etat !== '';

  const envoyer = async () => {
    if (!choix || fige) return;
    vibrer.succes();
    setEtat('envoi');
    setEtat((await envoyerAvis(jeu, choix, note, mode, joueurs.length)) ? 'ok' : 'attente');
  };

  const Vote = ({ v, titre }: { v: 1 | -1; titre: string }) => (
    <Pressable
      disabled={fige}
      onPress={() => { vibrer.choix(); setChoix(v); }}
      style={[styles.vote, choix === v && { borderColor: C.accent, backgroundColor: melange(C.accent, 0.18, C.surface) }, fige && choix !== v && { opacity: 0.5 }]}
    >
      <Text style={[styles.voteTxt, choix === v && { color: C.ink }]}>{titre}</Text>
    </Pressable>
  );

  return (
    <View style={styles.panneau}>
      <Text style={styles.lbl}>CE JEU VOUS A PLU ?</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Vote v={1} titre="👍 On a aimé" />
        <Vote v={-1} titre="👎 Bof" />
      </View>
      <TextInput
        value={note}
        onChangeText={setNote}
        editable={!fige}
        maxLength={200}
        placeholder="Un mot sur ce qui a marché ou pas (facultatif)"
        placeholderTextColor={C.inkFaint}
        style={[styles.champ, fige && { opacity: 0.6 }]}
        returnKeyType="done"
      />
      <Bouton titre={fige ? 'Avis enregistré' : "Enregistrer l'avis"} petit desactive={!choix || fige} onPress={envoyer} style={{ flex: 0 }} />
      {etat ? (
        <Text style={styles.msg}>
          {etat === 'envoi' ? 'Envoi…' : etat === 'ok' ? 'Merci ! Avis envoyé.' : 'Enregistré. Il partira tout seul dès que le téléphone aura du réseau.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panneau: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 12 },
  lbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.6 },
  vote: { flex: 1, paddingVertical: 13, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface2, alignItems: 'center' },
  voteTxt: { color: C.inkSoft, fontFamily: F.titreGras, fontSize: 15.5 },
  champ: { backgroundColor: C.bg, borderRadius: R.md, borderWidth: 1, borderColor: C.line, color: C.ink, fontFamily: F.texte, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  msg: { color: C.inkSoft, fontFamily: F.texte, fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
});
