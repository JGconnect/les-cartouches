// Une partie : pioche, carte en cours, pénalités, points, puis l'écran de fin.
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeuillePenalite, type Penalite } from '@/components/feuille-penalite';
import { Bouton } from '@/components/ui';
import { marquerVue, melanger } from '@/lib/cartes';
import { jeu as trouverJeu, L } from '@/lib/contenu';
import { useReglages } from '@/lib/reglages';
import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';
import { CarteJeu } from '@/jeux/cartes';
import { cleFraicheur, preparerPartie, SANS_PROGRESSION, tirerGage, type Ambiance, type Extra } from '@/jeux/moteur';

export type Scores = Record<string, number>;

export default function Partie() {
  useKeepAwake();
  const { id, ambiance } = useLocalSearchParams<{ id: string; ambiance?: Ambiance }>();
  const j = trouverJeu(String(id))!;
  const insets = useSafeAreaInsets();
  const { mode, theme, niveauHot, joueurs } = useReglages();
  const [pioche, setPioche] = useState<unknown[] | null>(null);
  const [extra, setExtra] = useState<Extra>({});
  const [idx, setIdx] = useState(0);
  const [fini, setFini] = useState(false);
  const [penalite, setPenalite] = useState<Penalite>(null);
  const [scores, setScores] = useState<Scores>({});
  const victimes = useMemo(() => (joueurs.length >= 2 ? melanger(joueurs) : melanger(L.VICTIMS as string[])), [joueurs]);
  const ensuite = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    preparerPartie(j, { mode, theme, niveauHot, joueurs, ambiance }).then((r) => { setExtra(r.extra); setPioche(r.pioche); });
    // la pioche se prépare une fois, au lancement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carte = pioche?.[idx];
  useEffect(() => { if (carte !== undefined) marquerVue(cleFraicheur(j), carte); }, [carte, j]);

  if (!pioche) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  const suivant = () => {
    if (idx + 1 >= pioche.length) { vibrer.succes(); setFini(true); return; }
    setIdx(idx + 1);
  };
  const precedent = idx > 0 ? () => setIdx(idx - 1) : undefined;
  const donnerGage = (pour: string, puis?: () => void) => {
    vibrer.alerte();
    ensuite.current = puis;
    setPenalite({ pour, texte: tirerGage(mode), ensuite: puis });
  };
  const ajouterPoint = (qui: string, n = 1) => setScores((s) => ({ ...s, [qui]: (s[qui] || 0) + n }));
  const quitter = () => { vibrer.succes(); setFini(true); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 6, paddingBottom: insets.bottom + 12 }}>
      <View style={styles.barre}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.retour}>‹ {j.nom}</Text></Pressable>
        {!fini && !SANS_PROGRESSION.has(j.id) ? <Text style={styles.prog}>{idx + 1} / {pioche.length}</Text> : null}
      </View>

      {fini || !pioche.length ? (
        <Fin jeu={j.nom} emoji={j.emoji} quiz={j.famille === 'quiz'} scores={scores} vide={!pioche.length} rejouer={() => router.replace({ pathname: '/partie/[id]', params: { id: j.id, ...(ambiance ? { ambiance } : {}) } })} />
      ) : (
        <CarteJeu
          key={idx}
          jeu={j}
          carte={carte}
          idx={idx}
          total={pioche.length}
          tour={victimes[idx % victimes.length]}
          joueurs={joueurs}
          mode={mode}
          scores={scores}
          suivant={suivant}
          precedent={precedent}
          donnerGage={donnerGage}
          ajouterPoint={ajouterPoint}
          quitter={quitter}
          remplacer={(c) => setPioche((p) => (p ? p.map((x, i) => (i === idx ? c : x)) : p))}
          pioche={pioche}
          extra={extra}
        />
      )}

      <FeuillePenalite
        penalite={penalite}
        mode={mode}
        fermer={() => { setPenalite(null); const f = ensuite.current; ensuite.current = undefined; if (f) f(); }}
      />
    </View>
  );
}

function Fin({ jeu, emoji, quiz, scores, vide, rejouer }: { jeu: string; emoji: string; quiz: boolean; scores: Scores; vide: boolean; rejouer: () => void }) {
  const classement = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, gap: 16, justifyContent: 'center' }}>
      <Text style={{ fontSize: 54, textAlign: 'center' }}>{emoji}</Text>
      <Text style={styles.finTitre}>{vide ? 'Plus de cartes pour ces réglages.' : 'Partie terminée.'}</Text>
      <Text style={styles.finTxt}>
        {vide ? 'Essaie un autre niveau ou un autre mode.' : `Fin de cette partie de « ${jeu} ». ${quiz ? 'Une nouvelle partie remet les scores à zéro.' : "Une nouvelle donne pioche d'autres cartes."}`}
      </Text>
      {classement.length ? (
        <View style={styles.tableau}>
          <Text style={styles.tableauLbl}>CLASSEMENT</Text>
          {classement.map(([n, p], i) => (
            <View key={n} style={styles.rang}>
              <Text style={styles.rangN}>{i === 0 ? '🏆' : `${i + 1}.`}</Text>
              <Text style={styles.rangNom}>{n}</Text>
              <Text style={styles.rangPts}>{p} pt{p > 1 ? 's' : ''}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ gap: 10, marginTop: 10 }}>
        {!vide ? <Bouton titre="Nouvelle partie" onPress={rejouer} style={{ flex: 0 }} /> : null}
        <Bouton titre="Retour aux jeux" variante="fantome" onPress={() => router.dismissAll()} style={{ flex: 0 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 },
  retour: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 15 },
  prog: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 13, letterSpacing: 1.2 },
  finTitre: { color: C.ink, fontFamily: F.titre, fontSize: 34, textAlign: 'center' },
  finTxt: { color: C.inkSoft, fontFamily: F.texte, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  tableau: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 },
  tableauLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 2 },
  rang: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rangN: { width: 28, textAlign: 'center', color: C.ink, fontFamily: F.titreGras, fontSize: 16 },
  rangNom: { flex: 1, color: C.ink, fontFamily: F.texteDemi, fontSize: 16 },
  rangPts: { color: C.accent, fontFamily: F.titreGras, fontSize: 16 },
});
