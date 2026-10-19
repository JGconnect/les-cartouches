// Les écrans de jeu « à cartes » (une carte à la fois), refaits en natif d'après l'appli web.
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Ligne, Puce, Question, Reponse } from '@/components/ui';
import { HOT_NOM, icone, L, t, type Jeu, type Mode } from '@/lib/contenu';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

export type PropsCarte = {
  jeu: Jeu;
  carte: any;
  idx: number;
  total: number;
  tour: string;
  joueurs: string[];
  mode: Mode;
  scores: Record<string, number>;
  pioche: unknown[];
  suivant: () => void;
  precedent?: () => void;
  donnerGage: (pour: string, puis?: () => void) => void;
  ajouterPoint: (qui: string, n?: number) => void;
  quitter: () => void;
  remplacer: (c: unknown) => void;
};

/** Mise en page commune : le contenu au centre, les boutons en bas. */
function Cadre({ children, pied }: { children: React.ReactNode; pied: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.corps}>{children}</ScrollView>
      <View style={styles.pied}>{pied}</View>
    </View>
  );
}

function Tour({ jeu, nom }: { jeu: Jeu; nom: string }) {
  return (
    <View style={[styles.tour, { borderColor: melange(jeu.couleur, 0.4, C.line) }]}>
      <Text style={{ fontSize: 22 }}>{jeu.emoji}</Text>
      <View>
        <Text style={styles.tourLbl}>{(jeu.victime || 'Au tour de').toUpperCase()}</Text>
        <Text style={styles.tourNom}>{nom}</Text>
      </View>
    </View>
  );
}

/** Pavé des points : on touche le prénom de qui a marqué (avec annulation). */
export function PavePoints({ joueurs, scores, ajouterPoint, libelle }: { joueurs: string[]; scores: Record<string, number>; ajouterPoint: (q: string, n?: number) => void; libelle?: string }) {
  const hist = useRef<string[]>([]);
  if (joueurs.length < 2) return null;
  return (
    <View style={styles.pave}>
      <Text style={styles.paveLbl}>{libelle || 'Qui a marqué ? Touche pour +1'}</Text>
      <View style={styles.puces}>
        {joueurs.map((p) => (
          <Pressable key={p} onPress={() => { vibrer.choix(); hist.current.push(p); ajouterPoint(p, 1); }} style={({ pressed }) => [styles.pchip, pressed && { borderColor: C.accent }]}>
            <Text style={styles.pchipTxt}>{p}</Text>
            <Text style={styles.pchipPts}>{scores[p] || 0}</Text>
          </Pressable>
        ))}
      </View>
      <Lien titre="Annuler le dernier point" onPress={() => { const p = hist.current.pop(); if (p) ajouterPoint(p, -1); }} />
    </View>
  );
}

function Precedent({ fn, libelle = '← Précédent' }: { fn?: () => void; libelle?: string }) {
  return fn ? <Lien titre={libelle} onPress={fn} /> : null;
}

/* ---------------- Le Coupable ---------------- */
function Coupable(p: PropsCarte) {
  const I = icone(p.mode);
  return (
    <Cadre pied={<>
      <Ligne><Bouton titre={`Le coupable → ${I}`} variante="penalite" onPress={() => p.donnerGage('le ou la plus désigné·e')} /><Bouton titre="Suivant →" variante="fantome" onPress={p.suivant} /></Ligne>
      <Precedent fn={p.precedent} />
    </>}>
      <Puce texte="Qui est le plus susceptible de…" couleur={p.jeu.couleur} />
      <Question>{p.carte}</Question>
      {p.jeu.consigne ? <Consigne>{t(p.jeu.consigne, p.mode)}</Consigne> : null}
    </Cadre>
  );
}

/* ---------------- La Cascade ---------------- */
function Cascade(p: PropsCarte) {
  const I = icone(p.mode);
  return (
    <Cadre pied={<>
      <Ligne><Bouton titre={`Esquive → ${I}`} variante="penalite" onPress={() => p.donnerGage('qui esquive')} /><Bouton titre="Palier suivant →" variante="fantome" onPress={p.suivant} /></Ligne>
      <Precedent fn={p.precedent} libelle="← Palier précédent" />
    </>}>
      <Puce texte={`Palier ${p.idx + 1} / ${p.total}`} couleur={p.jeu.couleur} />
      <Question>{p.carte}</Question>
      {p.jeu.consigne ? <Consigne>{t(p.jeu.consigne, p.mode)}</Consigne> : null}
    </Cadre>
  );
}

/* ---------------- Le Tribunal ---------------- */
function Tribunal(p: PropsCarte) {
  const I = icone(p.mode);
  const secs = p.jeu.secondes || 30;
  const [phase, setPhase] = useState<'designer' | 'proces'>('designer');
  const [reste, setReste] = useState<number | null>(null);
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (minuteur.current) clearInterval(minuteur.current); }, []);

  function plaidoirie() {
    if (minuteur.current) clearInterval(minuteur.current);
    setReste(secs);
    minuteur.current = setInterval(() => {
      setReste((r) => {
        const n = (r ?? 1) - 1;
        if (n <= 3 && n > 0) vibrer.leger();
        if (n <= 0) { vibrer.alerte(); if (minuteur.current) clearInterval(minuteur.current); return 0; }
        return n;
      });
    }, 1000);
  }
  function autre() {
    const libres = (L.TRIBUNAL as string[]).filter((x) => !p.pioche.includes(x));
    if (!libres.length) { p.suivant(); return; }
    vibrer.choix();
    p.remplacer(libres[Math.floor(Math.random() * libres.length)]);
  }
  const verdict = (qui: string) => { if (minuteur.current) clearInterval(minuteur.current); p.donnerGage(qui, p.suivant); };

  return (
    <Cadre pied={phase === 'designer' ? <>
      <Bouton titre="L'accusé·e est désigné·e →" couleur={p.jeu.couleur} onPress={() => setPhase('proces')} style={{ flex: 0 }} />
      <Lien titre="Personne ne correspond → autre accusation" onPress={autre} />
    </> : <>
      <Bouton titre={reste === null ? `Lancer la plaidoirie (${secs} s)` : 'Relancer la plaidoirie'} variante="fantome" onPress={plaidoirie} style={{ flex: 0 }} />
      <Ligne><Bouton titre={`Coupable → ${I}`} variante="penalite" onPress={() => verdict("l'accusé·e")} /><Bouton titre={`Acquitté·e → accusateurs ${I}`} couleur={p.jeu.couleur} onPress={() => verdict('les accusateurs')} /></Ligne>
    </>}>
      <Puce texte="Chef d'accusation" couleur={p.jeu.couleur} />
      <Question>Qui ici est coupable {p.carte}{'\u00a0'}?</Question>
      {phase === 'designer' ? (
        <Consigne>À trois, tout le monde pointe le ou la coupable. La personne la plus désignée passe au tribunal.</Consigne>
      ) : (
        <>
          <Consigne>{reste === 0 ? 'Temps écoulé, au vote !' : "L'accusé·e a trente secondes pour plaider non coupable. Puis la table vote."}</Consigne>
          {reste !== null ? <Text style={[styles.chrono, reste <= 5 && { color: C.danger }]}>{reste}</Text> : null}
        </>
      )}
    </Cadre>
  );
}

/* ---------------- Le Dilemme ---------------- */
function Dilemme(p: PropsCarte) {
  const I = icone(p.mode);
  const [choix, setChoix] = useState<'A' | 'B' | null>(null);
  const d = p.carte as { a: string; b: string; ctx?: string };
  return (
    <Cadre pied={<>
      <Ligne><Bouton titre={`Refuse de trancher → ${I}`} variante="penalite" onPress={() => p.donnerGage(p.tour)} /><Bouton titre="Suivant →" variante="fantome" onPress={p.suivant} /></Ligne>
      <Precedent fn={p.precedent} />
    </>}>
      <Tour jeu={p.jeu} nom={p.tour} />
      {d.ctx ? <Consigne>{d.ctx}</Consigne> : null}
      {(['A', 'B'] as const).map((k) => {
        const on = choix === k;
        return (
          <Pressable key={k} onPress={() => { vibrer.choix(); setChoix(k); }} style={[styles.option, on && { borderColor: p.jeu.couleur, backgroundColor: melange(p.jeu.couleur, 0.16, C.surface) }]}>
            <View style={[styles.optionK, on && { backgroundColor: p.jeu.couleur }]}><Text style={[styles.optionKTxt, on && { color: '#fff' }]}>{k}</Text></View>
            <Text style={styles.optionTxt}>{k === 'A' ? d.a : d.b}</Text>
          </Pressable>
        );
      })}
    </Cadre>
  );
}

/* ---------------- Qui a déjà… ? (Hot) ---------------- */
function Jamais(p: PropsCarte) {
  const c = String(p.carte);
  return (
    <Cadre pied={<>
      <Bouton titre="Suivante →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
      <Precedent fn={p.precedent} libelle="← Précédente" />
    </>}>
      <Puce texte={HOT_NOM[c.charAt(0)] || 'Hot'} couleur={p.jeu.couleur} />
      <Question>{c.slice(2)}</Question>
      <Consigne>{t("Ceux qui l'ont déjà fait lèvent la main et {boivent}. Les plus courageux racontent !", p.mode)}</Consigne>
    </Cadre>
  );
}

/* ---------------- Vrai ou faux ? ---------------- */
function VraiFaux(p: PropsCarte) {
  const [vu, setVu] = useState(false);
  const q = String(p.carte).split('|');
  const vrai = q[0] === 'V';
  return (
    <Cadre pied={<>
      {vu ? <Bouton titre="Suivante →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
        : <Bouton titre="Révéler" couleur={p.jeu.couleur} onPress={() => { vibrer.moyen(); setVu(true); }} style={{ flex: 0 }} />}
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Puce texte="Vrai ou faux ?" couleur={p.jeu.couleur} />
      <Question>{q[1]}</Question>
      {!vu ? <Consigne>À trois, tout le monde vote : pouce en l'air = vrai, pouce en bas = faux.</Consigne> : (
        <>
          <Reponse titre={vrai ? '✅ VRAI' : '❌ FAUX'} texte={q[2]} etat={vrai ? 'ok' : 'ko'} />
          <PavePoints joueurs={p.joueurs} scores={p.scores} ajouterPoint={p.ajouterPoint} libelle="Qui avait bon ? Touche pour +1" />
        </>
      )}
    </Cadre>
  );
}

/* ---------------- C'était mieux avant ? ---------------- */
function Avant(p: PropsCarte) {
  const [vu, setVu] = useState(false);
  const q = String(p.carte).split('|');
  const vieux = q[0] === 'avant';
  return (
    <Cadre pied={<>
      {vu ? <Bouton titre="Suivant →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
        : <Bouton titre="Révéler la réponse" couleur={p.jeu.couleur} onPress={() => { vibrer.moyen(); setVu(true); }} style={{ flex: 0 }} />}
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Puce texte={vieux ? "📼 Objet d'avant" : '📱 Mot des jeunes'} couleur={p.jeu.couleur} />
      <Consigne>{vieux ? "Qu'est-ce que c'est ?" : "Qu'est-ce que ça veut dire ?"}</Consigne>
      <Question petit={vieux}>{q[1]}</Question>
      {!vu ? (
        <Consigne>{vieux ? "Les plus jeunes ont la parole en premier : les anciens n'aident qu'au bout de 30 secondes !" : "Les plus âgés ont la parole en premier : les jeunes n'aident qu'au bout de 30 secondes !"}</Consigne>
      ) : (
        <>
          <Reponse titre={q[2]} texte={q[3]} couleur={p.jeu.couleur} />
          <PavePoints joueurs={p.joueurs} scores={p.scores} ajouterPoint={p.ajouterPoint} libelle="Qui a trouvé ? Touche pour +1" />
        </>
      )}
    </Cadre>
  );
}

export function CarteJeu(p: PropsCarte) {
  switch (p.jeu.type) {
    case 'deck': return <Coupable {...p} />;
    case 'cascade': return <Cascade {...p} />;
    case 'tribunal': return <Tribunal {...p} />;
    case 'dilemme': return <Dilemme {...p} />;
    case 'jamais': return <Jamais {...p} />;
    case 'vraifaux': return <VraiFaux {...p} />;
    case 'avant': return <Avant {...p} />;
    default: return <Cadre pied={<Bouton titre="Retour" variante="fantome" onPress={p.quitter} style={{ flex: 0 }} />}><Consigne>Ce jeu arrive bientôt dans l'appli.</Consigne></Cadre>;
  }
}

const styles = StyleSheet.create({
  corps: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 16, gap: 18 },
  pied: { paddingHorizontal: 18, paddingTop: 8, gap: 6 },
  tour: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, borderRadius: R.lg, borderWidth: 1, backgroundColor: C.surface },
  tourLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 11, letterSpacing: 2 },
  tourNom: { color: C.ink, fontFamily: F.titre, fontSize: 19, marginTop: 2 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  optionK: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  optionKTxt: { color: C.inkSoft, fontFamily: F.titre, fontSize: 16 },
  optionTxt: { flex: 1, color: C.ink, fontFamily: F.titreGras, fontSize: 17, lineHeight: 21 },
  chrono: { color: C.ink, fontFamily: F.titre, fontSize: 64, textAlign: 'center' },
  pave: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14, gap: 10 },
  paveLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pchip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 8, paddingVertical: 10, borderRadius: R.pill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  pchipTxt: { color: C.ink, fontFamily: F.texteDemi, fontSize: 15.5 },
  pchipPts: { minWidth: 24, textAlign: 'center', color: C.accent, fontFamily: F.titreGras, fontSize: 14, backgroundColor: C.surface, borderRadius: 10, paddingVertical: 2, overflow: 'hidden' },
});
