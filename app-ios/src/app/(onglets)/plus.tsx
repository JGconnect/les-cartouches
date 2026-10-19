// Onglet « Plus » : réglages et à-côtés de l'appli.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F, R } from '@/lib/theme';

function Ligne({ emoji, titre, sous, onPress }: { emoji: string; titre: string; sous: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.ligne, pressed && { opacity: 0.8 }, !onPress && { opacity: 0.55 }]}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.titre}>{titre}</Text>
        <Text style={styles.sous}>{sous}</Text>
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

export default function Plus() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 120, gap: 12 }}>
      <Text style={styles.grandTitre}>✨ Plus</Text>
      <Ligne emoji="⚙️" titre="Réglages" sous="Joueurs, pénalités, thème de la soirée" onPress={() => router.push('/reglages')} />
      <Ligne emoji="✏️" titre="Vos cartes perso" sous="Vos blagues internes, et les cartes de la bande" onPress={() => router.push('/cartes-perso')} />
      <Ligne emoji="🏆" titre="Tournoi du trajet" sous="Enchaînez les quiz, champion·ne à l'arrivée" onPress={() => router.push('/tournoi')} />
      <Text style={styles.version}>Jozzo · version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grandTitre: { color: C.ink, fontFamily: F.titre, fontSize: 34, marginBottom: 8 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: R.lg, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  titre: { color: C.ink, fontFamily: F.titreGras, fontSize: 17 },
  sous: { color: C.inkFaint, fontFamily: F.texte, fontSize: 13.5, marginTop: 2 },
  chevron: { color: C.inkFaint, fontSize: 26 },
  version: { color: C.inkFaint, fontFamily: F.texte, fontSize: 12.5, textAlign: 'center', marginTop: 20 },
});
