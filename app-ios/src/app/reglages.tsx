// Réglages : prénoms des joueurs, pénalités, thème de la soirée (gardés sur le téléphone).
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Bouton } from '@/components/ui';
import { THEMES, type Mode } from '@/lib/contenu';
import { useReglages } from '@/lib/reglages';
import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

const MODES: { id: Mode; titre: string; sous: string }[] = [
  { id: 'gages', titre: '🎯 Gages', sous: 'Sans alcool' },
  { id: 'alcool', titre: '🍺 Gorgées', sous: '18+ · avec modération' },
  { id: 'famille', titre: '🧸 Famille', sous: 'Jeux tout public' },
];

export default function Reglages() {
  const { joueurs, setJoueurs, mode, setMode, theme, setTheme } = useReglages();
  const [nom, setNom] = useState('');

  function ajouter() {
    const n = nom.trim().replace(/\s+/g, ' ').slice(0, 20);
    if (!n || joueurs.includes(n) || joueurs.length >= 16) return;
    vibrer.leger();
    setJoueurs([...joueurs, n]);
    setNom('');
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 22 }} keyboardShouldPersistTaps="handled">
        <View style={styles.entete}>
          <Text style={styles.grandTitre}>Réglages</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.ok}>OK</Text></Pressable>
        </View>

        <View style={styles.bloc}>
          <Text style={styles.lbl}>Qui joue ?</Text>
          <Text style={styles.aide}>Les prénoms restent sur ce téléphone. Sans prénoms, on dit « la personne à ta gauche ».</Text>
          <View style={styles.puces}>
            {joueurs.map((j) => (
              <Pressable key={j} onPress={() => { vibrer.choix(); setJoueurs(joueurs.filter((x) => x !== j)); }} style={styles.puce}>
                <Text style={styles.puceTxt}>{j}  ✕</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={nom}
              onChangeText={setNom}
              onSubmitEditing={ajouter}
              placeholder="Un prénom"
              placeholderTextColor={C.inkFaint}
              returnKeyType="done"
              submitBehavior="submit"
              maxLength={20}
              style={styles.champ}
            />
            <Bouton titre="Ajouter" onPress={ajouter} petit style={{ flex: 0, paddingHorizontal: 18 }} />
          </View>
        </View>

        <View style={styles.bloc}>
          <Text style={styles.lbl}>Pénalités</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {MODES.map((m) => (
              <Pressable key={m.id} onPress={() => { vibrer.choix(); setMode(m.id); }} style={[styles.choix, mode === m.id && styles.choixOn]}>
                <Text style={[styles.choixTitre, mode === m.id && { color: C.ink }]}>{m.titre}</Text>
                <Text style={styles.choixSous}>{m.sous}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.bloc}>
          <Text style={styles.lbl}>🎭 Thème de la soirée</Text>
          <Text style={styles.aide}>Des cartes spéciales passent en premier dans plusieurs jeux.</Text>
          <View style={styles.puces}>
            <Pressable onPress={() => setTheme('')} style={[styles.puce, !theme && styles.puceOn]}><Text style={styles.puceTxt}>Aucun</Text></Pressable>
            {Object.entries(THEMES).filter(([, th]) => !(th.adult && mode === 'famille')).map(([k, th]) => (
              <Pressable key={k} onPress={() => { vibrer.choix(); setTheme(k); }} style={[styles.puce, theme === k && styles.puceOn]}>
                <Text style={styles.puceTxt}>{th.lbl}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  grandTitre: { color: C.ink, fontFamily: F.titre, fontSize: 30 },
  ok: { color: C.accent, fontFamily: F.titreGras, fontSize: 18 },
  bloc: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 12 },
  lbl: { color: C.ink, fontFamily: F.titreGras, fontSize: 18 },
  aide: { color: C.inkFaint, fontFamily: F.texte, fontSize: 13.5, lineHeight: 19 },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  puce: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  puceOn: { borderColor: C.accent, backgroundColor: '#4a2347' },
  puceTxt: { color: C.ink, fontFamily: F.texteDemi, fontSize: 14.5 },
  champ: { flex: 1, backgroundColor: C.surface2, borderRadius: R.md, borderWidth: 1, borderColor: C.line, color: C.ink, fontFamily: F.texteMoyen, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  choix: { flex: 1, padding: 12, borderRadius: R.md, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line, gap: 4 },
  choixOn: { borderColor: C.accent, backgroundColor: '#4a2347' },
  choixTitre: { color: C.inkSoft, fontFamily: F.titreGras, fontSize: 15 },
  choixSous: { color: C.inkFaint, fontFamily: F.texte, fontSize: 11.5 },
});
