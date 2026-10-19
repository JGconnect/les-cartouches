// Mission secrète : chacun découvre sa mission en secret, puis on révèle (même plus tard dans la soirée).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Bouton, Consigne, Puce, Question } from '@/components/ui';
import { famOK, icone, t } from '@/lib/contenu';
import { melanger } from '@/lib/cartes';
import { ecrire, lire } from '@/lib/stockage';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import { piocheHot } from '../moteur';
import type { ModuleJeu, PropsCarte } from '../types';
import { Cadre, IlFautDesPrenoms, LISTES, Passe, st, texteHot } from './_hot';

type Item = { p: string; m: string; ok: boolean | null };
type Missions = { list: Item[]; at: number };
const CLE = 'cart_missions';

function Mission(p: PropsCarte) {
  const ex = p.extra as { enCours: Missions | null; nouvelles: Item[] };
  const [phase, setPhase] = useState<'distribution' | 'attente' | 'revelation' | 'bilan'>(ex.enCours ? 'revelation' : 'distribution');
  const [M, setM] = useState<Missions | null>(ex.enCours);
  const [di, setDi] = useState(0);
  const [voit, setVoit] = useState(false);
  const I = icone(p.mode);
  if (p.joueurs.length < 3 && !ex.enCours) return <IlFautDesPrenoms jeu={p.jeu} n={3} />;

  if (phase === 'distribution') {
    const list = ex.nouvelles;
    const it = list[di];
    if (!voit) {
      return (
        <Passe jeu={p.jeu} nom={it.p} bouton={`Je suis ${it.p} → voir ma mission`} onPress={() => setVoit(true)} quitter={p.quitter}
          message={`${di ? 'Mission cachée 🙈 ' : ''}Chacun découvre sa mission en secret.`} />
      );
    }
    return (
      <Cadre pied={<Bouton titre="🙈 Cacher et passer" couleur={p.jeu.couleur} style={{ flex: 0 }} onPress={() => {
        setVoit(false);
        if (di + 1 >= list.length) {
          const m = { list, at: Date.now() };
          ecrire(CLE, m); setM(m); vibrer.succes(); setPhase('attente');
          return;
        }
        setDi(di + 1);
      }} />}>
        <Puce texte={`Mission de ${it.p} · top secret`} couleur={p.jeu.couleur} />
        <Question>{it.m}</Question>
        <Consigne>Mémorise-la bien. Tu as toute la soirée pour la réussir sans te faire griller !</Consigne>
      </Cadre>
    );
  }

  if (phase === 'attente') {
    return (
      <Cadre pied={<>
        <Bouton titre="← Retour aux jeux" couleur={p.jeu.couleur} onPress={() => router.dismissAll()} style={{ flex: 0 }} />
        <Bouton titre="Révéler maintenant" variante="fantome" onPress={() => setPhase('revelation')} style={{ flex: 0 }} />
      </>}>
        <Text style={{ fontSize: 54, textAlign: 'center' }}>🕶️</Text>
        <Question>Missions en cours</Question>
        <Consigne>Jouez normalement, lancez d'autres jeux… Quand vous voulez, revenez dans « Mission secrète » pour tout révéler.</Consigne>
      </Cadre>
    );
  }

  const liste = M?.list || [];
  if (phase === 'bilan') {
    const win = liste.filter((x) => x.ok === true).map((x) => x.p);
    const lose = liste.filter((x) => x.ok === false).map((x) => x.p);
    return (
      <Cadre pied={<Bouton titre="Terminer" couleur={p.jeu.couleur} onPress={p.quitter} style={{ flex: 0 }} />}>
        <Puce texte="Bilan des missions" couleur={p.jeu.couleur} />
        <View style={st.panneau}>
          {win.length ? <Text style={st.panneauTxt}>🏆 Réussies : {win.join(', ')}</Text> : null}
          {lose.length ? <Text style={st.panneauTxt}>{I} Ratées : {lose.join(', ')} → {t('{pen}', p.mode)} chacun·e !</Text> : null}
          {!win.length && !lose.length ? <Text style={st.panneauTxt}>Personne n'a été noté. À la prochaine mission !</Text> : null}
        </View>
      </Cadre>
    );
  }

  const noter = (i: number, ok: boolean) => {
    vibrer.choix();
    const m = { ...M!, list: liste.map((x, k) => (k === i ? { ...x, ok } : x)) };
    setM(m); ecrire(CLE, m);
  };

  return (
    <Cadre pied={<Bouton titre="Terminer" couleur={p.jeu.couleur} style={{ flex: 0 }} onPress={() => {
      AsyncStorage.removeItem(CLE).catch(() => {});
      vibrer.succes(); setPhase('bilan');
    }} />}>
      <Puce texte="Révélation des missions" couleur={p.jeu.couleur} />
      <Question>Mission réussie ?</Question>
      {liste.map((it, i) => (
        <View key={i} style={st.panneau}>
          <Text style={st.panneauLbl}>{it.p}</Text>
          <Text style={st.panneauTxt}>{it.m}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[true, false].map((v) => {
              const on = it.ok === v;
              return (
                <Pressable key={String(v)} onPress={() => noter(i, v)} style={[s.seg, on && { borderColor: p.jeu.couleur, backgroundColor: melange(p.jeu.couleur, 0.22, C.surface) }]}>
                  <Text style={[s.segTxt, on && { color: C.ink }]}>{v ? '✅ Réussie' : '❌ Ratée'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Cadre>
  );
}

const s = StyleSheet.create({
  seg: { flex: 1, paddingVertical: 11, borderRadius: R.md, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface2, alignItems: 'center' },
  segTxt: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 15 },
});

const module: ModuleJeu = {
  Composant: Mission,
  preparer: async (o) => {
    const enCours = await lire<Missions | null>(CLE, null);
    if (enCours && Array.isArray(enCours.list)) return { pioche: [0], extra: { enCours, nouvelles: [] } };
    const pool = melanger(piocheHot(LISTES.MISSIONS, o.niveauHot)).filter((c) => famOK(c, o.mode));
    const nouvelles: Item[] = o.joueurs.map((joueur, i) => {
      const autres = o.joueurs.filter((x) => x !== joueur);
      const x = autres[Math.floor(Math.random() * autres.length)] || '';
      return { p: joueur, m: texteHot(String(pool[i % pool.length] || ''), o.mode).replace(/\{x\}/g, x), ok: null };
    });
    return { pioche: [0], extra: { enCours: null, nouvelles } };
  },
  sansProgression: true,
  fraicheur: () => null,
  minJoueurs: 3,
};
export default module;
