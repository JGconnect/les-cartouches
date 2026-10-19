// Outils communs aux jeux musicaux et quiz « à manches libres » (Fredonne, Blind test, Paroles, Où suis-je, Histoire) :
// extraits de 30 s (Deezer, sinon Apple Music), minuteur avec 3-2-1, classement, choix du gagnant, mise en page.
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Puce, Question } from '@/components/ui';
import type { PropsCarte } from '../types';
import { L } from '@/lib/contenu';
import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

/* ---------------- Mise en page ---------------- */

export function Cadre({ children, pied }: { children: ReactNode; pied?: ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={st.corps}>{children}</ScrollView>
      {pied ? <View style={st.pied}>{pied}</View> : null}
    </View>
  );
}

/** Bandeau « Au micro : Léa ». */
export function Bandeau({ emoji, libelle, nom, bord }: { emoji: string; libelle: string; nom: string; bord?: string }) {
  return (
    <View style={[st.tour, { borderColor: bord || C.line }]}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={st.tourLbl}>{libelle.toUpperCase()}</Text>
        <Text style={st.tourNom}>{nom}</Text>
      </View>
    </View>
  );
}

/** Classement de la partie (comme boardHTML du site). */
export function Tableau({ scores }: { scores: Record<string, number> }) {
  const ks = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  if (!ks.length) return null;
  return (
    <View style={st.tableau}>
      <Text style={st.lbl}>CLASSEMENT</Text>
      {ks.map((k, i) => (
        <View key={k} style={st.rang}>
          <Text style={st.rangN}>{i === 0 ? '🏆' : `${i + 1}.`}</Text>
          <Text style={st.rangNom}>{k}</Text>
          <Text style={st.rangPts}>{scores[k]} pt{scores[k] > 1 ? 's' : ''}</Text>
        </View>
      ))}
    </View>
  );
}

/** Choix de qui a trouvé (une puce par prénom). */
export function ChoixJoueur({ joueurs, choisir }: { joueurs: string[]; choisir: (qui: string) => void }) {
  return (
    <View style={st.puces}>
      {joueurs.map((p) => (
        <Pressable key={p} onPress={() => { vibrer.choix(); choisir(p); }} style={({ pressed }) => [st.pchip, pressed && { borderColor: C.accent }]}>
          <Text style={st.pchipTxt}>{p}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Disque({ emoji, tourne }: { emoji: string; tourne?: boolean }) {
  return (
    <View style={[st.disque, tourne && { borderColor: C.accent }]}>
      <Text style={{ fontSize: 52 }}>{emoji}</Text>
    </View>
  );
}

export function Barre({ part, couleur = C.accent }: { part: number; couleur?: string }) {
  return (
    <View style={st.barreFond}>
      <View style={[st.barre, { width: `${Math.max(0, Math.min(100, part * 100))}%`, backgroundColor: couleur }]} />
    </View>
  );
}

export function Credit({ texte }: { texte: string }) {
  return <Text style={st.credit}>{texte}</Text>;
}

export function Quitter({ fn }: { fn: () => void }) {
  return <Lien titre="Terminer la partie" onPress={fn} />;
}

/* ---------------- Minuteur avec 3-2-1 ---------------- */

/** Minuteur : décompte 3-2-1 (sauf sansDecompte), puis secondes restantes ; onZero à la fin. */
export function useMinuteur() {
  const [decompte, setDecompte] = useState<number | null>(null);
  const [reste, setReste] = useState<number | null>(null);
  const [total, setTotal] = useState(1);
  const t = useRef<ReturnType<typeof setInterval> | null>(null);
  const arreter = () => { if (t.current) { clearInterval(t.current); t.current = null; } };
  useEffect(() => arreter, []);

  function lancer(secs: number, onZero?: () => void, sansDecompte?: boolean) {
    arreter();
    setTotal(secs);
    setReste(secs);
    const partir = () => {
      setDecompte(null);
      let left = secs;
      t.current = setInterval(() => {
        left -= 1;
        if (left <= 3 && left > 0) vibrer.leger();
        if (left <= 0) { arreter(); setReste(0); vibrer.alerte(); if (onZero) onZero(); return; }
        setReste(left);
      }, 1000);
    };
    if (sansDecompte) { partir(); return; }
    let d = 3;
    setDecompte(3);
    vibrer.moyen();
    t.current = setInterval(() => {
      d -= 1;
      if (d <= 0) { arreter(); vibrer.fort(); partir(); return; }
      vibrer.moyen();
      setDecompte(d);
    }, 1000);
  }
  return { decompte, reste, total, lancer, arreter };
}

export function AffichageMinuteur({ decompte, reste, total }: { decompte: number | null; reste: number | null; total: number }) {
  if (decompte !== null) return <Text style={[st.chrono, { color: C.accent }]}>{decompte}</Text>;
  if (reste === null) return null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={[st.chrono, reste <= 5 && { color: C.danger }]}>{reste}</Text>
      <Barre part={reste / total} couleur={reste <= 5 ? C.danger : C.accent} />
    </View>
  );
}

/* ---------------- Extraits musicaux ---------------- */

export type Morceau = { q: string; a: string | null; k: string; fr?: boolean; y?: number };
export type Extrait = { url: string; title: string; artist?: string; cover?: string; src: string; a?: string | null; k?: string };

const ANNEES: Record<number, number> = { 3: 2021, 4: 2018, 5: 2019, 27: 2018, 28: 2017, 33: 2015, 42: 2016, 65: 2017, 66: 2014, 86: 2014, 87: 2017, 94: 2019, 95: 2019 };

export function requeteChanson(s: string): string {
  const p = s.split('|');
  let art = p[1] || '';
  if (/^(Chant|Hymne|Générique|Roméo|Notre-Dame|La Reine|Le Roi|Le Livre|La Petite|Aladdin)/.test(art)) art = '';
  return (p[0].replace(/[…!?]/g, ' ') + ' ' + art).trim();
}

/** Chansons de « N'oubliez pas les paroles » et du blind test : fr, intl, recent ou mix. */
export function chansons(cat: string): Morceau[] {
  const intl: number[] = L.CH_INTL;
  const a: Morceau[] = (L.CHANSONS as string[]).map((x, i) => ({ q: requeteChanson(x), a: null, k: '🎵 Musique', fr: intl.indexOf(i) < 0, y: ANNEES[i] || 0 }))
    .concat((L.CHANSONS2 as string[]).map((x) => { const p = x.split('|'); return { q: requeteChanson(p[0] + '|' + p[1]), a: null, k: '🎵 Musique', fr: p[3] === 'fr', y: +p[2] }; }));
  return a.filter((o) => (cat === 'fr' ? o.fr : cat === 'intl' ? !o.fr : cat === 'recent' ? (o.y || 0) >= 2014 : true));
}

export function morceauxBlindTest(cat: string): Morceau[] {
  const mus = chansons('mix');
  const fil = (L.BT_FILMS as string[]).map((x) => { const p = x.split('|'); return { q: p[0], a: p[1], k: '🎬 Film' }; });
  const ser = (L.BT_SERIES as string[]).map((x) => { const p = x.split('|'); return { q: p[0], a: p[1], k: '📺 Série' }; });
  return cat === 'musique' ? mus : cat === 'films' ? fil : cat === 'series' ? ser : mus.concat(fil, ser);
}

async function lireJson(url: string): Promise<any> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

/** Aperçu officiel de 30 s : Deezer d'abord, sinon Apple Music. */
export async function chercherExtrait(m: Morceau): Promise<Extrait | null> {
  const q = encodeURIComponent(m.q);
  const d = await lireJson(`https://api.deezer.com/search?q=${q}&limit=5`);
  const t = d?.data?.filter((x: any) => x.preview)[0];
  if (t) return { url: t.preview, title: t.title, artist: t.artist?.name, cover: t.album?.cover_medium, src: 'Deezer', a: m.a, k: m.k };
  const d2 = await lireJson(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=5&country=fr`);
  const r = d2?.results?.filter((x: any) => x.previewUrl)[0];
  if (r) return { url: r.previewUrl, title: r.trackName, artist: r.artistName, cover: r.artworkUrl100, src: 'Apple Music', a: m.a, k: m.k };
  return null;
}

let modeAudioFait = false;
/** Lecteur pour une manche : libéré tout seul quand l'écran se démonte ; son même en mode silencieux. */
export function useLecteur(): AudioPlayer {
  const lecteur = useAudioPlayer(null, { updateInterval: 100 });
  useEffect(() => {
    if (!modeAudioFait) { modeAudioFait = true; setAudioModeAsync({ playsInSilentMode: true }).catch(() => {}); }
    return () => { try { lecteur.pause(); } catch {} };
  }, [lecteur]);
  return lecteur;
}

/** Prend le morceau suivant de la pioche (curseur partagé entre les manches, comme aPos sur le site). */
export function prendreSuivant<T>(pioche: unknown[], extra: any): T {
  const c = extra?.curseur || { n: 0 };
  const s = pioche[c.n % Math.max(1, pioche.length)] as T;
  c.n += 1;
  return s;
}

export function CarteChanson({ t }: { t: Extrait }) {
  return (
    <View style={{ gap: 10 }}>
      {t.a ? (
        <View style={st.reponse}>
          <Text style={st.reponseSous}>{t.k}</Text>
          <Text style={st.reponseTitre}>{t.a}</Text>
        </View>
      ) : null}
      <View style={st.chanson}>
        {t.cover ? <Image source={{ uri: t.cover }} style={st.pochette} /> : <View style={[st.pochette, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 26 }}>🎵</Text></View>}
        <View style={{ flex: 1 }}>
          <Text style={st.chansonTitre}>{t.title}</Text>
          <Text style={st.chansonArtiste}>{t.artist || ''}</Text>
        </View>
      </View>
    </View>
  );
}

/* ---------------- Manche avec extrait (chargement, échec) ---------------- */

export type PhaseExtrait = 'charge' | 'echec' | 'pret' | 'ecoute' | 'revele';

export function useExtrait(p: PropsCarte, cle: string) {
  const lecteur = useLecteur();
  const [phase, setPhase] = useState<PhaseExtrait>('charge');
  const [piste, setPiste] = useState<Extrait | null>(null);
  const vivant = useRef(true);
  useEffect(() => () => { vivant.current = false; }, []);

  async function charger(apres: (t: Extrait) => void) {
    try { lecteur.pause(); } catch {}
    setPhase('charge');
    const m = prendreSuivant<Morceau>(p.pioche, p.extra);
    p.marquerVue(cle, m);
    const t = await chercherExtrait(m);
    if (!vivant.current) return;
    if (!t) { setPhase('echec'); return; }
    lecteur.replace({ uri: t.url });
    setPiste(t);
    apres(t);
  }
  return { lecteur, phase, setPhase, piste, charger, vivant };
}

export function Chargement({ msg }: { msg: string }) {
  return (
    <Cadre>
      <Puce texte="Chargement" />
      <Question petit>{msg}</Question>
      <Consigne>Il faut une connexion internet pour les extraits.</Consigne>
    </Cadre>
  );
}

export function Echec({ reessayer, quitter }: { reessayer: () => void; quitter: () => void }) {
  return (
    <Cadre pied={<>
      <Bouton titre="🔄 Réessayer avec une autre chanson" onPress={reessayer} style={{ flex: 0 }} />
      <Quitter fn={quitter} />
    </>}>
      <Puce texte="Pas d'extrait" />
      <Question petit>Impossible de charger la musique.</Question>
      <Consigne>Vérifie la connexion internet, puis réessaie.</Consigne>
    </Cadre>
  );
}

export const st = StyleSheet.create({
  corps: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 16, gap: 18 },
  pied: { paddingHorizontal: 18, paddingTop: 8, gap: 6 },
  tour: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, borderRadius: R.lg, borderWidth: 1, backgroundColor: C.surface },
  tourLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 11, letterSpacing: 2 },
  tourNom: { color: C.ink, fontFamily: F.titre, fontSize: 19, marginTop: 2 },
  chrono: { color: C.ink, fontFamily: F.titre, fontSize: 64, textAlign: 'center' },
  tableau: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 },
  lbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 2 },
  rang: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rangN: { width: 28, textAlign: 'center', color: C.ink, fontFamily: F.titreGras, fontSize: 16 },
  rangNom: { flex: 1, color: C.ink, fontFamily: F.texteDemi, fontSize: 16 },
  rangPts: { color: C.accent, fontFamily: F.titreGras, fontSize: 16 },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pchip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: R.pill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  pchipTxt: { color: C.ink, fontFamily: F.texteDemi, fontSize: 15.5 },
  disque: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: C.surface, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  barreFond: { height: 8, borderRadius: 4, backgroundColor: C.surface2, overflow: 'hidden' },
  barre: { height: 8, borderRadius: 4 },
  credit: { color: C.inkFaint, fontFamily: F.texte, fontSize: 12, textAlign: 'center' },
  reponse: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent, borderRadius: R.md, padding: 14, gap: 4 },
  reponseSous: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.2 },
  reponseTitre: { color: C.ink, fontFamily: F.titre, fontSize: 22 },
  chanson: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 12 },
  pochette: { width: 64, height: 64, borderRadius: 12, backgroundColor: C.surface2 },
  chansonTitre: { color: C.ink, fontFamily: F.titreGras, fontSize: 18 },
  chansonArtiste: { color: C.inkSoft, fontFamily: F.texte, fontSize: 14.5, marginTop: 2 },
  indices: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 },
  indice: { color: C.inkSoft, fontFamily: F.texte, fontSize: 16, lineHeight: 23 },
  indiceN: { color: C.ink, fontFamily: F.texteDemi },
});
