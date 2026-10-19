// Intro d'un jeu : règles, options (niveau pour les jeux Hot), puis « On joue ».
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/ui';
import { jeu as trouverJeu, t, type NiveauHot } from '@/lib/contenu';
import { useReglages } from '@/lib/reglages';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';
import { JEUX_NATIFS } from '@/jeux/moteur';

const NIVEAUX: { id: NiveauHot; titre: string; sous: string }[] = [
  { id: 'flirt', titre: '💋 Flirt', sous: 'Taquin' },
  { id: 'chaud', titre: '🔥 Chaud', sous: 'Ça monte' },
  { id: 'brulant', titre: '🌶️ Brûlant', sous: 'Sans filtre' },
];

export default function IntroJeu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const j = trouverJeu(String(id));
  const insets = useSafeAreaInsets();
  const { mode, adulte, setAdulte, niveauHot, setNiveauHot } = useReglages();
  if (!j) return null;
  const hot = j.famille === 'hot';
  const pret = JEUX_NATIFS.has(j.id);

  if (hot && !adulte) {
    return (
      <View style={[styles.page, { paddingTop: insets.top + 70, justifyContent: 'center' }]}>
        <Text style={styles.gros}>🔞</Text>
        <Text style={styles.titre}>Réservé aux adultes</Text>
        <Text style={styles.texte}>Les jeux Hot parlent de séduction et de sujets intimes. Ils sont réservés aux plus de 18 ans, entre adultes consentants. On peut toujours passer une carte.</Text>
        <View style={{ gap: 10, marginTop: 24, alignSelf: 'stretch' }}>
          <Bouton titre="J'ai plus de 18 ans" onPress={() => setAdulte(true)} couleur={j.couleur} style={{ flex: 0 }} />
          <Bouton titre="Retour" variante="fantome" onPress={() => router.back()} style={{ flex: 0 }} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={[styles.page, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30 }]}>
      <View style={[styles.emojiBoite, { backgroundColor: melange(j.couleur, 0.28) }]}>
        <Text style={{ fontSize: 40 }}>{j.emoji}</Text>
      </View>
      <Text style={styles.titre}>{j.nom}</Text>
      <Text style={styles.texte}>{t(j.accroche, mode)}</Text>

      <View style={styles.regles}>
        {j.regles.map((r, i) => (
          <View key={i} style={styles.regle}>
            <View style={styles.num}><Text style={styles.numTxt}>{i + 1}</Text></View>
            <Text style={styles.regleTxt}>{t(r, mode)}</Text>
          </View>
        ))}
      </View>

      {hot ? (
        <View style={{ alignSelf: 'stretch', gap: 10 }}>
          <Text style={styles.lbl}>NIVEAU</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {NIVEAUX.map((n) => (
              <Pressable key={n.id} onPress={() => { vibrer.choix(); setNiveauHot(n.id); }} style={[styles.choix, niveauHot === n.id && { borderColor: j.couleur, backgroundColor: melange(j.couleur, 0.22, C.surface) }]}>
                <Text style={[styles.choixTitre, niveauHot === n.id && { color: C.ink }]}>{n.titre}</Text>
                <Text style={styles.choixSous}>{n.sous}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ alignSelf: 'stretch', marginTop: 10, gap: 10 }}>
        {pret ? (
          <Bouton titre="On joue !" couleur={j.couleur} onPress={() => router.push({ pathname: '/partie/[id]', params: { id: j.id } })} style={{ flex: 0 }} />
        ) : (
          <View style={styles.bientot}>
            <Text style={styles.bientotTitre}>🛠️ Bientôt dans l'appli</Text>
            <Text style={styles.bientotTxt}>Ce jeu est en train d'être refait pour l'iPhone. En attendant, il se joue sur myjozzo.fr.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: C.bg, paddingHorizontal: 22, alignItems: 'center', gap: 16 },
  gros: { fontSize: 54, textAlign: 'center' },
  emojiBoite: { width: 82, height: 82, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  titre: { color: C.ink, fontFamily: F.titre, fontSize: 40, lineHeight: 44, textAlign: 'center', letterSpacing: -0.6 },
  texte: { color: C.inkSoft, fontFamily: F.texte, fontSize: 16.5, lineHeight: 24, textAlign: 'center', maxWidth: 340 },
  regles: { alignSelf: 'stretch', backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 18, gap: 14 },
  regle: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  numTxt: { color: C.ink, fontFamily: F.titreGras, fontSize: 13 },
  regleTxt: { flex: 1, color: C.inkSoft, fontFamily: F.texte, fontSize: 15, lineHeight: 21 },
  lbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 2, textAlign: 'center' },
  choix: { flex: 1, padding: 12, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 3, alignItems: 'center' },
  choixTitre: { color: C.inkSoft, fontFamily: F.titreGras, fontSize: 15 },
  choixSous: { color: C.inkFaint, fontFamily: F.texte, fontSize: 12 },
  bientot: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 18, gap: 6 },
  bientotTitre: { color: C.ink, fontFamily: F.titreGras, fontSize: 17, textAlign: 'center' },
  bientotTxt: { color: C.inkSoft, fontFamily: F.texte, fontSize: 14.5, lineHeight: 20, textAlign: 'center' },
});
