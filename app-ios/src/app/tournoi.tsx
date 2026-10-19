// Tournoi du trajet : on enchaîne les quiz, chaque partie rapporte 3, 2 ou 1 points au podium.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { manches, OR, TableauTournoi } from '@/components/tournoi';
import { Bouton } from '@/components/ui';
import { useReglages } from '@/lib/reglages';
import { C, F, melange, R } from '@/lib/theme';
import { classement, ecrireTournoi, lireTournoi, nouveauTournoi, type Tournoi } from '@/lib/tournoi';
import { vibrer } from '@/lib/vibrer';

export default function EcranTournoi() {
  const insets = useSafeAreaInsets();
  const { joueurs } = useReglages();
  const [t, setT] = useState<Tournoi | null>(null);
  const [charge, setCharge] = useState(false);
  const [arme, setArme] = useState(false);

  useEffect(() => { lireTournoi().then((v) => { setT(v); setCharge(true); }); }, []);

  const changer = (v: Tournoi | null) => { ecrireTournoi(v); setT(v); setArme(false); };
  const lancer = () => { vibrer.succes(); changer(nouveauTournoi(joueurs)); };
  const terminer = () => {
    if (!arme) { vibrer.choix(); setArme(true); return; }
    if (t) { vibrer.succes(); changer({ ...t, on: false, done: true }); }
  };

  let contenu: React.ReactNode = null;
  if (t && t.done) {
    const champions = classement(t.pts).filter((o) => o.r === 1).map((o) => o.n).join(' & ');
    contenu = (
      <View style={styles.panneau}>
        <Text style={styles.lbl}>🏁 TOURNOI TERMINÉ</Text>
        <Text style={styles.champ}>👑 {champions}</Text>
        <Text style={styles.indice}>Après {manches(t.log.length)}</Text>
        <TableauTournoi t={t} medailles />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
          <Bouton titre="Nouveau tournoi" petit couleur={OR} onPress={() => { vibrer.succes(); changer(nouveauTournoi(joueurs)); }} />
          <Bouton titre="Fermer" petit variante="fantome" onPress={() => changer(null)} />
        </View>
      </View>
    );
  } else if (t && t.on) {
    contenu = (
      <View style={styles.panneau}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.lbl}>🏆 TOURNOI EN COURS</Text>
          <Text style={styles.cnt}>{manches(t.log.length)}</Text>
        </View>
        <TableauTournoi t={t} />
        <Text style={styles.indice}>Chaque quiz terminé rapporte 3, 2 et 1 points au podium.</Text>
        <Bouton titre={arme ? 'Confirmer : afficher le podium' : 'Terminer le tournoi'} petit couleur={OR} onPress={terminer} style={{ flex: 0 }} />
      </View>
    );
  } else if (charge) {
    contenu = (
      <View style={styles.panneau}>
        <Text style={styles.lbl}>🏆 TOURNOI DU TRAJET</Text>
        <Text style={styles.indice}>Enchaînez les quiz : chaque partie rapporte 3, 2 ou 1 points au podium, et on désigne le ou la champion·ne à l'arrivée.</Text>
        {joueurs.length >= 2 ? (
          <Bouton titre="Lancer un tournoi" petit couleur={OR} onPress={lancer} style={{ flex: 0 }} />
        ) : (
          <Pressable onPress={() => router.push('/reglages')}>
            <Text style={[styles.indice, { textDecorationLine: 'underline' }]}>Ajoute au moins 2 prénoms pour lancer un tournoi.</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: 20, gap: 18 }}>
      <View style={styles.entete}>
        <Text style={styles.grandTitre}>🏆 Tournoi</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.ok}>OK</Text></Pressable>
      </View>
      {contenu}
      {t && (t.on || t.done) ? (
        <Bouton titre="Choisir un quiz" variante="fantome" onPress={() => router.dismissTo('/trajet')} style={{ flex: 0 }} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTitre: { color: C.ink, fontFamily: F.titre, fontSize: 34 },
  ok: { color: C.accent, fontFamily: F.titreGras, fontSize: 17 },
  panneau: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: melange(OR, 0.4, C.line), padding: 18, gap: 12 },
  lbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.6 },
  cnt: { color: OR, fontFamily: F.texteDemi, fontSize: 13 },
  indice: { color: C.inkSoft, fontFamily: F.texte, fontSize: 15, lineHeight: 22 },
  champ: { color: C.ink, fontFamily: F.titre, fontSize: 26 },
});
