// Intro d'un jeu : règles, options (niveau pour les jeux Hot), puis « On joue ».
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/ui';
import { jeu as trouverJeu, t, type NiveauHot } from '@/lib/contenu';
import { useReglages } from '@/lib/reglages';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';
import { estNatif, MODULES, optionsDe } from '@/jeux/registre';
import { useCallback, useState } from 'react';
import { MINE_GAMES, mineCount } from '@/lib/perso';

const NIVEAUX: { id: NiveauHot; titre: string; sous: string }[] = [
  { id: 'flirt', titre: '💋 Flirt', sous: 'Taquin' },
  { id: 'chaud', titre: '🔥 Chaud', sous: 'Ça monte' },
  { id: 'brulant', titre: '🌶️ Brûlant', sous: 'Sans filtre' },
];

export default function IntroJeu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const j = trouverJeu(String(id));
  const insets = useSafeAreaInsets();
  const { mode, adulte, setAdulte, niveauHot, setNiveauHot, joueurs } = useReglages();
  const [opts, setOpts] = useState<Record<string, string>>({});
  const [nbPerso, setNbPerso] = useState(0);
  useFocusEffect(useCallback(() => {
    let vivant = true;
    if (j && MINE_GAMES[j.id]) mineCount(j.id).then((n) => { if (vivant) setNbPerso(n); });
    return () => { vivant = false; };
  }, [j]));
  if (!j) return null;
  const hot = j.famille === 'hot';
  const pret = estNatif(j);
  const options = optionsDe(j);
  const valeur = (cle: string, defaut: string) => opts[cle] ?? defaut;
  const minJ = MODULES[j.type]?.minJoueurs || 0;

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

      {options.map((o) => (
        <View key={o.cle} style={{ alignSelf: 'stretch', gap: 10 }}>
          <Text style={styles.lbl}>{o.titre.toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {o.choix.map((c) => {
              const on = valeur(o.cle, o.defaut) === c.id;
              return (
                <Pressable key={c.id} onPress={() => { vibrer.choix(); setOpts((x) => ({ ...x, [o.cle]: c.id })); }} style={[styles.choix, { minWidth: '30%' }, on && { borderColor: j.couleur, backgroundColor: melange(j.couleur, 0.22, C.surface) }]}>
                  <Text style={[styles.choixTitre, on && { color: C.ink }]}>{c.titre}</Text>
                  {c.sous ? <Text style={styles.choixSous}>{c.sous}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {j && MINE_GAMES[j.id] ? (
        <View style={{ alignSelf: 'stretch', gap: 10 }}>
          {nbPerso ? (
            <>
              <Text style={styles.lbl}>{`VOS CARTES PERSO (${nbPerso})`}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { id: 'mix', titre: '🔀 Mélangées', sous: 'avec celles du jeu' },
                  { id: 'only', titre: '✏️ Seulement les nôtres', sous: `${nbPerso} carte${nbPerso > 1 ? 's' : ''}` },
                ].map((c) => {
                  const on = (opts.perso || 'mix') === c.id;
                  return (
                    <Pressable key={c.id} onPress={() => { vibrer.choix(); setOpts((x) => ({ ...x, perso: c.id })); }} style={[styles.choix, on && { borderColor: j.couleur, backgroundColor: melange(j.couleur, 0.22, C.surface) }]}>
                      <Text style={[styles.choixTitre, on && { color: C.ink }]}>{c.titre}</Text>
                      <Text style={styles.choixSous}>{c.sous}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
          <Pressable onPress={() => router.push({ pathname: '/cartes-perso', params: { jeu: j.id } })} hitSlop={8} style={{ alignSelf: 'center', padding: 6 }}>
            <Text style={styles.lienPerso}>✏️ {nbPerso ? 'Modifier vos cartes' : 'Ajouter vos propres cartes à ce jeu'}</Text>
          </Pressable>
        </View>
      ) : null}

      {minJ && joueurs.length < minJ ? (
        <Pressable onPress={() => router.push('/reglages')} style={styles.bientot}>
          <Text style={styles.bientotTitre}>👥 Il faut au moins {minJ} prénoms</Text>
          <Text style={styles.bientotTxt}>Ajoute les joueurs dans les Réglages (touche ici).</Text>
        </Pressable>
      ) : null}

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
        {pret && !(minJ && joueurs.length < minJ) ? (
          <Bouton titre="On joue !" couleur={j.couleur} onPress={() => router.push({ pathname: '/partie/[id]', params: { id: j.id, opts: JSON.stringify({ ...Object.fromEntries(options.map((o) => [o.cle, valeur(o.cle, o.defaut)])), ...(opts.perso ? { perso: opts.perso } : {}) }) } })} style={{ flex: 0 }} />
        ) : !pret ? (
          <View style={styles.bientot}>
            <Text style={styles.bientotTitre}>🛠️ Bientôt dans l'appli</Text>
            <Text style={styles.bientotTxt}>Ce jeu est en train d'être refait pour l'iPhone. En attendant, il se joue sur myjozzo.fr.</Text>
          </View>
        ) : null}
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
  lienPerso: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 14.5, textDecorationLine: 'underline' },
  bientot: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 18, gap: 6 },
  bientotTitre: { color: C.ink, fontFamily: F.titreGras, fontSize: 17, textAlign: 'center' },
  bientotTxt: { color: C.inkSoft, fontFamily: F.texte, fontSize: 14.5, lineHeight: 20, textAlign: 'center' },
});
