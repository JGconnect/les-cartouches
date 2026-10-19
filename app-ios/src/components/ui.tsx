// Briques d'interface de Jozzo (mêmes styles que l'appli web : boutons, puces, réponses…).
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

type BoutonProps = {
  titre: string;
  onPress: () => void;
  variante?: 'plein' | 'fantome' | 'penalite';
  couleur?: string;
  desactive?: boolean;
  style?: StyleProp<ViewStyle>;
  petit?: boolean;
};

export function Bouton({ titre, onPress, variante = 'plein', couleur = C.accent, desactive, style, petit }: BoutonProps) {
  const fond = variante === 'plein' ? couleur : variante === 'penalite' ? C.oui : 'transparent';
  const texte = variante === 'penalite' ? C.ouiInk : variante === 'fantome' ? C.inkSoft : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={desactive}
      onPress={() => { vibrer.leger(); onPress(); }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: fond, opacity: desactive ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        variante === 'fantome' && styles.fantome,
        petit && styles.petit,
        style,
      ]}
    >
      <Text style={[styles.btnTxt, { color: texte }, variante === 'fantome' && styles.fantomeTxt, petit && { fontSize: 15 }]}>{titre}</Text>
    </Pressable>
  );
}

export function Lien({ titre, onPress }: { titre: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ alignSelf: 'center', padding: 8 }}>
      <Text style={styles.lien}>{titre}</Text>
    </Pressable>
  );
}

export function Puce({ texte, couleur = C.accent }: { texte: string; couleur?: string }) {
  return (
    <View style={styles.puce}>
      <View style={[styles.point, { backgroundColor: couleur }]} />
      <Text style={styles.puceTxt}>{texte.toUpperCase()}</Text>
    </View>
  );
}

export function Question({ children, petit }: { children: ReactNode; petit?: boolean }) {
  return <Text style={[styles.question, petit && { fontSize: 24, lineHeight: 30 }]}>{children}</Text>;
}

export function Consigne({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.consigne, style]}>{children}</Text>;
}

export function Reponse({ titre, texte, etat, couleur = C.accent }: { titre: string; texte?: string; etat?: 'ok' | 'ko'; couleur?: string }) {
  const c = etat === 'ok' ? '#2bb673' : etat === 'ko' ? '#e5484d' : couleur;
  return (
    <View style={[styles.reponse, { borderColor: c }]}>
      <Text style={[styles.reponseTitre, { color: c }]}>{titre}</Text>
      {texte ? <Text style={styles.reponseTxt}>{texte}</Text> : null}
    </View>
  );
}

export function Ligne({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', gap: 10 }, style]}>{children}</View>;
}

export const styles = StyleSheet.create({
  btn: {
    flex: 1,
    borderRadius: R.lg,
    paddingVertical: 17,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  btnTxt: { fontFamily: F.titreGras, fontSize: 18, letterSpacing: 0.3, textAlign: 'center' },
  fantome: { borderWidth: 1, borderColor: C.line, shadowOpacity: 0, paddingVertical: 14 },
  fantomeTxt: { fontFamily: F.texteDemi, fontSize: 15 },
  petit: { paddingVertical: 12 },
  lien: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 14, textDecorationLine: 'underline' },
  puce: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: R.pill,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  point: { width: 8, height: 8, borderRadius: 4 },
  puceTxt: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.6 },
  question: { color: C.ink, fontFamily: F.titreGras, fontSize: 30, lineHeight: 36, textAlign: 'center', letterSpacing: -0.3 },
  consigne: { color: C.inkSoft, fontFamily: F.texte, fontSize: 15.5, lineHeight: 23, textAlign: 'center', maxWidth: 330, alignSelf: 'center' },
  reponse: { backgroundColor: C.surface, borderWidth: 1, borderRadius: R.md, padding: 16, gap: 6 },
  reponseTitre: { fontFamily: F.titre, fontSize: 22 },
  reponseTxt: { color: C.inkSoft, fontFamily: F.texte, fontSize: 15, lineHeight: 22 },
});
