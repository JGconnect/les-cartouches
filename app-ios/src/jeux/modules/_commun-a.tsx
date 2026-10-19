// Briques communes à Ni oui ni non, Le Menteur, Qui a dit ? et Qui me connaît ?
import * as Speech from 'expo-speech';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Question } from '@/components/ui';
import type { Jeu } from '@/lib/contenu';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

/** Mise en page commune : le contenu au centre, les boutons en bas. */
export function Cadre({ children, pied }: { children: ReactNode; pied: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={st.corps} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      <View style={st.pied}>{pied}</View>
    </View>
  );
}

/** Bandeau « Au tour de … ». */
export function Tour({ jeu, nom, libelle }: { jeu: Jeu; nom: string; libelle?: string }) {
  return (
    <View style={[st.tour, { borderColor: melange(jeu.couleur, 0.4, C.line) }]}>
      <Text style={{ fontSize: 22 }}>{jeu.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={st.tourLbl}>{(libelle || jeu.victime || 'Au tour de').toUpperCase()}</Text>
        <Text style={st.tourNom}>{nom}</Text>
      </View>
    </View>
  );
}

/** Écran « Passe le téléphone à … ». */
export function Passe({ jeu, nom, message, bouton, onPress, quitter }: { jeu: Jeu; nom: string; message?: ReactNode; bouton: string; onPress: () => void; quitter?: () => void }) {
  return (
    <Cadre pied={<>
      <Bouton titre={bouton} couleur={jeu.couleur} onPress={onPress} style={{ flex: 0 }} />
      {quitter ? <Lien titre="Terminer la partie" onPress={quitter} /> : null}
    </>}>
      <Text style={{ fontSize: 54, textAlign: 'center' }}>📱</Text>
      <Question>Passe le téléphone à {nom}</Question>
      {message ? <Consigne>{message}</Consigne> : null}
    </Cadre>
  );
}

/** Compte à rebours plein écran « 3, 2, 1, … » puis fin(). */
export function Decompte({ dernier = "C'est parti !", couleur, fin }: { dernier?: string; couleur: string; fin: () => void }) {
  const etapes = ['3', '2', '1', dernier];
  const [i, setI] = useState(0);
  const finRef = useRef(fin);
  finRef.current = fin;
  useEffect(() => {
    if (i === 3) vibrer.fort(); else vibrer.moyen();
    const tm = setTimeout(() => { if (i + 1 < etapes.length) setI(i + 1); else finRef.current(); }, 800);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
      <Text style={[st.decompte, { color: i === 3 ? couleur : C.ink, fontSize: i === 3 ? 46 : 110 }]}>{etapes[i]}</Text>
    </View>
  );
}

/** Pavé des points avec un nombre de points au choix par toucher. */
export function PaveN({ joueurs, scores, ajouterPoint, libelle, n = 1 }: { joueurs: string[]; scores: Record<string, number>; ajouterPoint: (q: string, n?: number) => void; libelle: string; n?: number }) {
  const hist = useRef<string[]>([]);
  if (joueurs.length < 1) return null;
  return (
    <View style={st.pave}>
      <Text style={st.paveLbl}>{libelle}</Text>
      <View style={st.puces}>
        {joueurs.map((p) => (
          <Pressable key={p} onPress={() => { vibrer.choix(); hist.current.push(p); ajouterPoint(p, n); }} style={({ pressed }) => [st.pchip, pressed && { borderColor: C.accent }]}>
            <Text style={st.pchipTxt}>{p}</Text>
            <Text style={st.pchipPts}>{scores[p] || 0}</Text>
          </Pressable>
        ))}
      </View>
      <Lien titre="Annuler le dernier point" onPress={() => { const p = hist.current.pop(); if (p) ajouterPoint(p, -n); }} />
    </View>
  );
}

/** Liste de prénoms à toucher (vote). */
export function ChoixPrenom({ noms, choisir }: { noms: string[]; choisir: (p: string) => void }) {
  return (
    <View style={[st.puces, { justifyContent: 'center' }]}>
      {noms.map((p) => (
        <Pressable key={p} onPress={() => { vibrer.choix(); choisir(p); }} style={({ pressed }) => [st.pchip, st.vote, pressed && { borderColor: C.accent }]}>
          <Text style={st.pchipTxt}>{p}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Sélecteur segmenté (dans le jeu). */
export function Segment<T extends string>({ titre, choix, valeur, changer, couleur }: { titre: string; choix: { id: T; titre: string; sous?: string }[]; valeur: T; changer: (v: T) => void; couleur: string }) {
  return (
    <View style={{ alignSelf: 'stretch', gap: 8 }}>
      <Text style={st.segLbl}>{titre.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {choix.map((c) => {
          const on = c.id === valeur;
          return (
            <Pressable key={c.id} onPress={() => { vibrer.choix(); changer(c.id); }} style={[st.seg, on && { borderColor: couleur, backgroundColor: melange(couleur, 0.22, C.surface) }]}>
              <Text style={[st.segTitre, on && { color: C.ink }]}>{c.titre}</Text>
              {c.sous ? <Text style={st.segSous}>{c.sous}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Grand chiffre de minuteur. */
export function Chiffre({ n, alerte }: { n: number; alerte?: boolean }) {
  return <Text style={[st.chrono, alerte && { color: C.danger }]}>{n}</Text>;
}

/** Minuteur simple : reste (null tant qu'il n'est pas lancé), lancer(), arreter(). */
export function useMinuteur(secs: number, fini?: () => void) {
  const [reste, setReste] = useState<number | null>(null);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const finRef = useRef(fini);
  finRef.current = fini;
  const arreter = () => { if (ref.current) clearInterval(ref.current); ref.current = null; };
  useEffect(() => arreter, []);
  function lancer() {
    arreter();
    setReste(secs);
    ref.current = setInterval(() => {
      setReste((r) => {
        const n = (r ?? 1) - 1;
        if (n > 0 && n <= 3) vibrer.leger();
        if (n <= 0) { arreter(); vibrer.alerte(); setTimeout(() => finRef.current?.(), 0); return 0; }
        return n;
      });
    }, 1000);
  }
  return { reste, lancer, arreter };
}

/** « de Léa » / « d'Inès ». */
export function deNom(v: string): string {
  return (/^[aeiouyhàâéèêëîïôûüœ]/i.test(v) ? "d'" : 'de ') + v;
}

/** Mot sans accents ni ponctuation, pour comparer une proposition. */
export function normMot(w: string): string {
  return String(w || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

/** Fait parler le téléphone (fr-FR), puis rappelle `fini` (même sans son, au bout d'un délai). */
export function dire(texte: string, fini?: () => void) {
  const propre = String(texte).replace(/·[a-zà-ÿ]+/gi, '');
  let fait = false;
  const fin = () => { if (fait) return; fait = true; fini?.(); };
  try {
    Speech.stop();
    Speech.speak(propre, { language: 'fr-FR', rate: 1.05, onDone: fin, onError: fin, onStopped: fin });
  } catch {
    setTimeout(fin, 1600);
    return;
  }
  setTimeout(fin, Math.min(12000, 2000 + texte.length * 110));
}

export function taire() {
  try { Speech.stop(); } catch { /* rien */ }
}

export const st = StyleSheet.create({
  corps: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 16, gap: 18 },
  pied: { paddingHorizontal: 18, paddingTop: 8, gap: 6 },
  tour: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, borderRadius: R.lg, borderWidth: 1, backgroundColor: C.surface },
  tourLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 11, letterSpacing: 2 },
  tourNom: { color: C.ink, fontFamily: F.titre, fontSize: 19, marginTop: 2 },
  decompte: { fontFamily: F.titre, textAlign: 'center' },
  chrono: { color: C.ink, fontFamily: F.titre, fontSize: 64, textAlign: 'center' },
  pave: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14, gap: 10 },
  paveLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pchip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 8, paddingVertical: 10, borderRadius: R.pill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  vote: { paddingHorizontal: 18, paddingVertical: 13 },
  pchipTxt: { color: C.ink, fontFamily: F.texteDemi, fontSize: 15.5 },
  pchipPts: { minWidth: 24, textAlign: 'center', color: C.accent, fontFamily: F.titreGras, fontSize: 14, backgroundColor: C.surface, borderRadius: 10, paddingVertical: 2, overflow: 'hidden' },
  segLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 2, textAlign: 'center' },
  seg: { flex: 1, padding: 11, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 2, alignItems: 'center' },
  segTitre: { color: C.inkSoft, fontFamily: F.titreGras, fontSize: 14.5 },
  segSous: { color: C.inkFaint, fontFamily: F.texte, fontSize: 11.5 },
  champ: { alignSelf: 'stretch', backgroundColor: C.surface2, borderRadius: R.md, borderWidth: 1, borderColor: C.line, color: C.ink, fontFamily: F.texteMoyen, fontSize: 17, paddingHorizontal: 14, paddingVertical: 13 },
  bande: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12.5, letterSpacing: 0.8, textAlign: 'center', textTransform: 'uppercase' },
  gras: { fontFamily: F.texteDemi, color: C.ink },
});
