// Écran « Donner mon avis » sur un jeu (paramètre ?jeu=<id>) ; le même bloc s'affiche aussi en fin de partie.
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlocAvis } from '@/components/avis';
import { jeu as trouverJeu } from '@/lib/contenu';
import { C, F } from '@/lib/theme';

export default function EcranAvis() {
  const insets = useSafeAreaInsets();
  const { jeu } = useLocalSearchParams<{ jeu?: string }>();
  const j = jeu ? trouverJeu(String(jeu)) : undefined;
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={styles.entete}>
          <Text style={styles.grandTitre}>Ton avis</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.ok}>OK</Text></Pressable>
        </View>
        {j ? (
          <>
            <Text style={styles.jeu}>{j.emoji} {j.nom}</Text>
            <BlocAvis jeu={j.id} />
          </>
        ) : (
          <Text style={styles.jeu}>Termine une partie pour donner ton avis sur ce jeu.</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTitre: { color: C.ink, fontFamily: F.titre, fontSize: 34 },
  ok: { color: C.accent, fontFamily: F.titreGras, fontSize: 17 },
  jeu: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 17 },
});
