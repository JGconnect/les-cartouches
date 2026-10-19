// Briques communes aux jeux quiz « par équipes / au chrono » (Devine qui, La Liste, Petit Bac, Mot interdit).
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Jeu } from '@/lib/contenu';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

export function parler(texte: string) {
  try { Speech.stop(); Speech.speak(texte, { language: 'fr-FR', rate: 1.05 }); } catch { /* sans voix */ }
}

export const nomEquipe = (i: number) => `Équipe ${i + 1}`;
export const mmss = (s: number) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`;
export const pts = (n: number) => `${n} point${Math.abs(n) > 1 ? 's' : ''}`;

/** Mise en page : contenu au centre (défilant), boutons en bas. */
export function Cadre({ children, pied, haut }: { children: ReactNode; pied: ReactNode; haut?: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      {haut ? <View style={{ paddingHorizontal: 18 }}>{haut}</View> : null}
      <ScrollView contentContainerStyle={s.corps}>{children}</ScrollView>
      <View style={s.pied}>{pied}</View>
    </View>
  );
}

/** Bandeau « Au tour de … ». */
export function Bandeau({ jeu, lbl, nom, emoji }: { jeu: Jeu; lbl: string; nom: string; emoji?: string }) {
  return (
    <View style={[s.tour, { borderColor: melange(jeu.couleur, 0.4, C.line) }]}>
      <Text style={{ fontSize: 22 }}>{emoji || jeu.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.tourLbl}>{lbl.toUpperCase()}</Text>
        <Text style={s.tourNom}>{nom}</Text>
      </View>
    </View>
  );
}

/** Classement à partir des scores de la partie. */
export function Classement({ scores }: { scores: Record<string, number> }) {
  const ks = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  if (!ks.length) return null;
  return (
    <View style={s.board}>
      <Text style={s.boardLbl}>CLASSEMENT</Text>
      {ks.map((k, i) => (
        <View key={k} style={s.brow}>
          <Text style={s.bk}>{i === 0 ? '🏆' : `${i + 1}.`}</Text>
          <Text style={s.bn}>{k}</Text>
          <Text style={s.bp}>{scores[k]} pt{scores[k] > 1 ? 's' : ''}</Text>
        </View>
      ))}
    </View>
  );
}

/** Bandeau du chrono en cours : titre, temps, compteurs, barre. */
export function TeteChrono({ titre, reste, total, couleur, infos }: { titre: string; reste: number; total: number; couleur: string; infos: string[] }) {
  return (
    <View style={s.lhead}>
      <Text style={s.lcat}>{titre}</Text>
      <View style={s.lnums}>
        <Text style={[s.lnum, { color: reste <= 10 ? C.trash : couleur }]}>{reste} s</Text>
        {infos.map((x, i) => <Text key={i} style={s.lnum}>{x}</Text>)}
      </View>
      <View style={s.lbarw}><View style={[s.lbar, { width: `${(100 * reste) / total}%`, backgroundColor: couleur }]} /></View>
    </View>
  );
}

/** Grand chiffre du décompte 3-2-1. */
export function Decompte({ n, couleur }: { n: number | string | null; couleur: string }) {
  if (n === null) return null;
  return (
    <View style={[StyleSheet.absoluteFill, s.decompte]} pointerEvents="none">
      <Text style={[s.decompteTxt, { color: couleur }]}>{n}</Text>
    </View>
  );
}

/**
 * Chrono : 3-2-1 « C'est parti ! » puis compte à rebours d'une seconde.
 * Vibre sur les 3 dernières secondes et à zéro, appelle `fin` à zéro.
 */
export function useChrono(total: number, fin: () => void) {
  const [reste, setReste] = useState(total);
  const [decompte, setDecompte] = useState<number | string | null>(null);
  const [actif, setActif] = useState(false);
  const t = useRef<ReturnType<typeof setInterval> | null>(null);
  const finRef = useRef(fin);
  finRef.current = fin;
  const arreter = () => { if (t.current) clearInterval(t.current); t.current = null; setActif(false); };
  useEffect(() => () => { if (t.current) clearInterval(t.current); }, []);

  function lancer(sansDecompte?: boolean) {
    arreter();
    setReste(total);
    const tourner = () => {
      setActif(true);
      let r = total;
      t.current = setInterval(() => {
        r -= 1;
        if (r > 0 && r <= 3) vibrer.leger();
        if (r <= 0) { r = 0; setReste(0); arreter(); vibrer.fort(); finRef.current(); return; }
        setReste(r);
      }, 1000);
    };
    if (sansDecompte) { tourner(); return; }
    const etapes: (number | string)[] = [3, 2, 1, "C'est parti !"];
    let i = 0;
    setDecompte(etapes[0]);
    vibrer.moyen();
    t.current = setInterval(() => {
      i += 1;
      if (i >= etapes.length) { if (t.current) clearInterval(t.current); t.current = null; setDecompte(null); tourner(); return; }
      if (i === 3) vibrer.fort(); else vibrer.moyen();
      setDecompte(etapes[i]);
    }, 800);
  }
  return { reste, decompte, actif, lancer, arreter };
}

export const s = StyleSheet.create({
  corps: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 16, gap: 16 },
  pied: { paddingHorizontal: 18, paddingTop: 8, gap: 8 },
  tour: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, borderRadius: R.lg, borderWidth: 1, backgroundColor: C.surface },
  tourLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 11, letterSpacing: 2 },
  tourNom: { color: C.ink, fontFamily: F.titre, fontSize: 19, marginTop: 2 },
  board: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14, gap: 8 },
  boardLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 2 },
  brow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bk: { width: 28, textAlign: 'center', color: C.ink, fontFamily: F.titreGras, fontSize: 15 },
  bn: { flex: 1, color: C.ink, fontFamily: F.texteDemi, fontSize: 15.5 },
  bp: { color: C.accent, fontFamily: F.titreGras, fontSize: 15 },
  lhead: { paddingVertical: 8, gap: 8 },
  lcat: { color: C.ink, fontFamily: F.titre, fontSize: 20, lineHeight: 24, textAlign: 'center' },
  lnums: { flexDirection: 'row', justifyContent: 'space-between' },
  lnum: { color: C.ink, fontFamily: F.titreGras, fontSize: 17, fontVariant: ['tabular-nums'] },
  lbarw: { height: 6, borderRadius: 6, backgroundColor: C.surface2, overflow: 'hidden' },
  lbar: { height: '100%' },
  decompte: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(24,16,34,0.88)', zIndex: 10 },
  decompteTxt: { fontFamily: F.titre, fontSize: 96, textAlign: 'center' },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 13, paddingVertical: 10, borderRadius: R.pill },
  chipSm: { paddingHorizontal: 11, paddingVertical: 7 },
  chipTxt: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 14.5 },
  chiffre: { color: C.ink, fontFamily: F.titre, fontSize: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  lbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', textAlign: 'center' },
  boite: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 8 },
});
