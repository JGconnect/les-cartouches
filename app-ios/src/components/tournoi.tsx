// Morceaux d'écran du Tournoi du trajet : bandeau de l'accueil, tableau, bloc de l'écran de fin.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { attribuerTournoi, classement, lireTournoi, type Tournoi } from '@/lib/tournoi';
import { C, F, melange, R } from '@/lib/theme';

export const OR = '#ffd23f';

export function manches(n: number) {
  return n + ' manche' + (n > 1 ? 's' : '');
}

/** Tableau des points (avec médailles une fois le tournoi terminé). */
export function TableauTournoi({ t, medailles }: { t: Tournoi; medailles?: boolean }) {
  return (
    <View style={{ gap: 8 }}>
      {classement(t.pts).map((o) => (
        <View key={o.n} style={styles.rang}>
          <Text style={styles.rangN}>{medailles ? (['🥇', '🥈', '🥉'][o.r - 1] || o.r + '.') : o.r + '.'}</Text>
          <Text style={styles.rangNom}>{o.n}</Text>
          <Text style={styles.rangPts}>{o.p} pt{o.p > 1 ? 's' : ''}</Text>
        </View>
      ))}
    </View>
  );
}

/** Bandeau « 🏆 Tournoi en cours » en haut de l'accueil (rien si pas de tournoi). */
export function BandeauTournoi() {
  const [t, setT] = useState<Tournoi | null>(null);
  useFocusEffect(useCallback(() => { lireTournoi().then(setT); }, []));
  if (!t || !t.on) return null;
  const top = classement(t.pts)[0];
  return (
    <Pressable onPress={() => router.push('/tournoi')} style={({ pressed }) => [styles.bandeau, pressed && { opacity: 0.85 }]}>
      <Text style={styles.bandeauTxt}>
        🏆 Tournoi en cours · {manches(t.log.length)}
        {top && top.p > 0 ? <Text>{' · '}<Text style={{ fontFamily: F.texteDemi, color: C.ink }}>{top.n}</Text> mène ({top.p} pt{top.p > 1 ? 's' : ''})</Text> : null}
      </Text>
      <Text style={styles.bandeauGo}>Voir →</Text>
    </Pressable>
  );
}

/**
 * Bloc de l'écran de fin d'un quiz : compte la partie pour le tournoi (une seule fois) et affiche le tableau.
 * Ne rend rien hors quiz, sans tournoi en cours ou sans points marqués.
 */
export function BlocTournoiFin({ jeu, quiz, scores }: { jeu: string; quiz: boolean; scores: Record<string, number> }) {
  const [res, setRes] = useState<{ t: Tournoi; gagnes: Record<string, number> } | null>(null);
  const fait = useRef(false);
  useEffect(() => {
    if (fait.current || !quiz || jeu === 'histoire') return;
    fait.current = true;
    attribuerTournoi(jeu, scores).then(setRes);
  }, [jeu, quiz, scores]);
  if (!res) return null;
  const gl = Object.keys(res.gagnes).sort((a, b) => res.gagnes[b] - res.gagnes[a]).map((k) => k + ' +' + res.gagnes[k]).join(' · ');
  return (
    <View style={styles.panneau}>
      <Text style={styles.lbl}>🏆 TOURNOI DU TRAJET · MANCHE {res.t.log.length}</Text>
      {gl ? <Text style={styles.indice}>{gl}</Text> : null}
      <TableauTournoi t={res.t} />
    </View>
  );
}

export const styles = StyleSheet.create({
  panneau: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: melange(OR, 0.4, C.line), padding: 16, gap: 10 },
  lbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.6 },
  indice: { color: C.inkSoft, fontFamily: F.texte, fontSize: 14.5, lineHeight: 21 },
  rang: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rangN: { width: 28, textAlign: 'center', color: C.ink, fontFamily: F.titreGras, fontSize: 16 },
  rangNom: { flex: 1, color: C.ink, fontFamily: F.texteDemi, fontSize: 16 },
  rangPts: { color: OR, fontFamily: F.titreGras, fontSize: 16 },
  bandeau: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, paddingHorizontal: 16, borderRadius: R.lg,
    borderWidth: 1, borderColor: melange(OR, 0.45, C.line), backgroundColor: melange(OR, 0.1, C.surface),
  },
  bandeauTxt: { flex: 1, color: C.inkSoft, fontFamily: F.texte, fontSize: 14.5, lineHeight: 20 },
  bandeauGo: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 13 },
});
