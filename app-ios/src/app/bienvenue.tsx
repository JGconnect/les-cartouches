// Écran de bienvenue (premier lancement) : qui joue, quelle ambiance, trois astuces. Clé cart_welcome.
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton, Lien } from '@/components/ui';
import { useReglages } from '@/lib/reglages';
import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

type Onglet = 'index' | 'soiree' | 'trajet' | 'famille';

const AMBIANCES: { id: 'soiree' | 'trajet' | 'famille'; e: string; titre: string; sous: string }[] = [
  { id: 'soiree', e: '🍻', titre: 'Soirée entre adultes', sous: 'Vérités, défis et mauvaise foi, avec des gages (ou des gorgées).' },
  { id: 'trajet', e: '🚌', titre: 'Trajet', sous: 'Quiz et devinettes à faire assis, en voiture, en car ou en train.' },
  { id: 'famille', e: '👨‍👩‍👧', titre: 'En famille', sous: 'Tout public : gages doux et jeux adaptés aux enfants.' },
];

const ASTUCES: { e: string; txt: React.ReactNode }[] = [
  { e: '☆', txt: <>Touche l'<B>étoile</B> d'un jeu pour l'épingler en haut. <B>🎲 Surprends-moi</B> en lance un au hasard.</> },
  { e: '✏️', txt: <>Ajoute <B>vos propres cartes</B> : anecdotes, répliques cultes, blagues internes, et partagez-les avec la bande.</> },
  { e: '🏆', txt: <>Lance un <B>tournoi</B> : chaque quiz rapporte des points jusqu'à l'arrivée.</> },
];

function B({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontFamily: F.texteDemi, color: C.ink }}>{children}</Text>;
}

export default function Bienvenue() {
  const insets = useSafeAreaInsets();
  const { joueurs, setJoueurs, mode, setMode, finirBienvenue } = useReglages();
  const [etape, setEtape] = useState(1);
  const [nom, setNom] = useState('');
  const [onglet, setOnglet] = useState<Onglet>('index');

  const ajouterNom = (): string[] => {
    const v = nom.trim().replace(/\s+/g, ' ').slice(0, 18);
    if (v && joueurs.length < 16 && !joueurs.includes(v)) {
      const n = [...joueurs, v];
      setJoueurs(n);
      setNom('');
      vibrer.leger();
      return n;
    }
    return joueurs;
  };

  const finir = (o: Onglet = onglet) => {
    finirBienvenue();
    vibrer.succes();
    if (router.canGoBack()) router.back();
    router.navigate(o === 'index' ? '/' : `/${o}`);
  };

  const points = (
    <View style={styles.points}>
      {[1, 2, 3].map((i) => <View key={i} style={[styles.point, i === etape && styles.pointOn]} />)}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: 22, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        {etape === 1 ? (
          <>
            <Text style={styles.em}>🎉</Text>
            <Text style={styles.titre}>Bienvenue sur{'\n'}Jozzo</Text>
            <Text style={styles.sous}>Des jeux pour la soirée, le trajet ou la famille. Un seul téléphone suffit, il passe de main en main.</Text>
            <View style={styles.panneau}>
              <Text style={styles.lbl}>QUI JOUE ? {joueurs.length ? <Text style={{ color: C.accent }}>{joueurs.length}</Text> : null}</Text>
              {joueurs.length ? (
                <View style={styles.puces}>
                  {joueurs.map((j) => (
                    <Pressable key={j} accessibilityLabel={'Retirer ' + j} onPress={() => { vibrer.choix(); setJoueurs(joueurs.filter((x) => x !== j)); }} style={styles.puce}>
                      <Text style={styles.puceTxt}>{j}  ✕</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  value={nom}
                  onChangeText={setNom}
                  onSubmitEditing={() => ajouterNom()}
                  placeholder="Ajouter un prénom"
                  placeholderTextColor={C.inkFaint}
                  maxLength={18}
                  returnKeyType="done"
                  submitBehavior="submit"
                  style={styles.champ}
                />
                <Bouton titre="Ajouter" petit onPress={() => ajouterNom()} style={{ flex: 0, paddingHorizontal: 18 }} />
              </View>
              <Text style={styles.indice}>Facultatif, mais avec les prénoms le jeu désigne les joueurs et compte les points.</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Bouton titre="Suivant" onPress={() => { ajouterNom(); setEtape(2); }} style={{ flex: 0 }} />
            <Lien titre="Passer" onPress={() => finir('index')} />
          </>
        ) : etape === 2 ? (
          <>
            <Text style={styles.em}>🎭</Text>
            <Text style={styles.titre}>Quelle ambiance ?</Text>
            <Text style={styles.sous}>Tu pourras changer à tout moment depuis l'accueil.</Text>
            <View style={{ gap: 10 }}>
              {AMBIANCES.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    vibrer.choix();
                    if (a.id === 'famille') { setMode('famille'); setOnglet('index'); }
                    else { if (mode === 'famille') setMode('gages'); setOnglet(a.id); }
                    setEtape(3);
                  }}
                  style={({ pressed }) => [styles.choix, pressed && { opacity: 0.85 }]}
                >
                  <Text style={{ fontSize: 30 }}>{a.e}</Text>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.choixTitre}>{a.titre}</Text>
                    <Text style={styles.choixSous}>{a.sous}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <Lien titre="Passer" onPress={() => finir('index')} />
          </>
        ) : (
          <>
            <Text style={styles.em}>💡</Text>
            <Text style={styles.titre}>Trois astuces</Text>
            <Text style={styles.sous}>Et c'est parti.</Text>
            <View style={[styles.panneau, { gap: 16 }]}>
              {ASTUCES.map((a, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{a.e}</Text>
                  <Text style={[styles.indice, { flex: 1, fontSize: 15.5, lineHeight: 22 }]}>{a.txt}</Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <Bouton titre="C'est parti !" onPress={() => finir()} style={{ flex: 0 }} />
          </>
        )}
        {points}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  em: { fontSize: 54, textAlign: 'center' },
  titre: { color: C.ink, fontFamily: F.titre, fontSize: 38, lineHeight: 42, textAlign: 'center', letterSpacing: -0.6 },
  sous: { color: C.inkSoft, fontFamily: F.texte, fontSize: 16.5, lineHeight: 24, textAlign: 'center', maxWidth: 340, alignSelf: 'center' },
  panneau: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 12 },
  lbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.6 },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  puce: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  puceTxt: { color: C.ink, fontFamily: F.texteDemi, fontSize: 14.5 },
  champ: { flex: 1, backgroundColor: C.bg, borderRadius: R.md, borderWidth: 1, borderColor: C.line, color: C.ink, fontFamily: F.texte, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
  indice: { color: C.inkSoft, fontFamily: F.texte, fontSize: 13.5, lineHeight: 19 },
  choix: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: R.lg, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  choixTitre: { color: C.ink, fontFamily: F.titreGras, fontSize: 17 },
  choixSous: { color: C.inkSoft, fontFamily: F.texte, fontSize: 14, lineHeight: 19 },
  points: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  point: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.line },
  pointOn: { backgroundColor: C.accent, width: 22 },
});
