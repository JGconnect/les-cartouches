// Feuille du bas qui annonce un gage (ou une gorgée) pour quelqu'un.
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/ui';
import { icone, type Mode } from '@/lib/contenu';
import { C, F, R } from '@/lib/theme';

export type Penalite = { pour: string; texte: string; ensuite?: () => void } | null;

export function FeuillePenalite({ penalite, mode, fermer }: { penalite: Penalite; mode: Mode; fermer: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!penalite} transparent animationType="slide" onRequestClose={fermer}>
      <Pressable style={styles.voile} onPress={fermer} />
      {penalite ? (
        <View style={[styles.feuille, { paddingBottom: insets.bottom + 18 }]}>
          <Text style={styles.emoji}>{icone(mode)}</Text>
          <Text style={styles.pour}>{(mode === 'alcool' ? 'Gorgée pour ' : 'Gage pour ') + penalite.pour}</Text>
          <Text style={styles.texte}>{penalite.texte}</Text>
          <Bouton titre={penalite.ensuite ? "C'est fait, on continue" : "C'est fait"} onPress={fermer} style={{ flex: 0, alignSelf: 'stretch' }} />
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: { flex: 1, backgroundColor: 'rgba(8,4,14,.55)' },
  feuille: { backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, borderWidth: 1, borderColor: C.line, padding: 24, gap: 14, alignItems: 'center' },
  emoji: { fontSize: 44 },
  pour: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase' },
  texte: { color: C.ink, fontFamily: F.titreGras, fontSize: 24, lineHeight: 30, textAlign: 'center', marginBottom: 8 },
});
