// Les écrans de jeu « à cartes » (une carte à la fois), refaits en natif d'après l'appli web.
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Ligne, Puce, Question, Reponse } from '@/components/ui';
import { HOT_NOM, icone, L, t, type Jeu, type Mode } from '@/lib/contenu';
import { marquerVue } from '@/lib/cartes';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

export type { PropsCarte } from './types';
import type { PropsCarte } from './types';

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
      <View style={{ flex: 1 }}>
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


/* ---------------- Oui ou Non (sur le grill) ---------------- */
const NOM_NIVEAU: Record<string, string> = { soft: 'Soft', epice: 'Épicé', trash: 'Trash' };
const COULEUR_NIVEAU: Record<string, string> = { soft: C.soft, epice: C.epice, trash: C.trash };

function Grill(p: PropsCarte) {
  const I = icone(p.mode);
  const q = p.carte as { l: string; c: string; q: string; r: string[]; f?: string };
  const [n, setN] = useState(0);
  const [micro, setMicro] = useState(false);
  const relance = micro ? q.f : n > 0 ? q.r[n - 1] : null;
  const finiPieges = n >= q.r.length;
  function piege() {
    vibrer.choix();
    if (!finiPieges) { setN(n + 1); return; }
    if (q.f && !micro) setMicro(true);
  }
  const titrePiege = !finiPieges ? 'Question piège' : q.f && !micro ? '🎤 Micro ouvert' : micro ? `À elle de jouer, sinon ${I}` : 'Plus de pièges, on enchaîne';
  return (
    <Cadre pied={<>
      <Bouton titre={titrePiege} couleur={p.jeu.couleur} onPress={piege} desactive={micro || (finiPieges && !q.f)} style={{ flex: 0 }} />
      <Ligne><Bouton titre={`A craqué → ${I}`} variante="penalite" onPress={() => p.donnerGage(p.tour)} /><Bouton titre="Suivant →" variante="fantome" onPress={p.suivant} /></Ligne>
      <Precedent fn={p.precedent} libelle="← Question précédente" />
    </>}>
      <Tour jeu={p.jeu} nom={p.tour} />
      <Puce texte={`${q.c} · ${NOM_NIVEAU[q.l] || ''}`} couleur={COULEUR_NIVEAU[q.l] || p.jeu.couleur} />
      <Question>{q.q}</Question>
      <View style={[styles.relance, relance ? { borderStyle: 'solid', borderColor: micro ? C.oui : C.line } : null]}>
        <Text style={[styles.relanceLbl, { color: micro ? C.oui : p.jeu.couleur }]}>
          {micro ? 'MICRO OUVERT · LA RÈGLE DU OUI/NON SAUTE' : `${(p.jeu.relance || 'Question piège').toUpperCase()}${n ? `  ${n}/${q.r.length}` : ''}`}
        </Text>
        <Text style={[styles.relanceTxt, !relance && { color: C.inkFaint }]}>{relance || "Appuie sur « Question piège » pour l'enfoncer un peu plus."}</Text>
      </View>
      <Text style={styles.bande}>Elle ne dit que <Text style={{ color: C.oui }}>OUI</Text> / <Text style={{ color: C.non }}>NON</Text>, sinon {I}</Text>
    </Cadre>
  );
}

/* ---------------- Le Chrono (chacun son tour, 5 secondes) ---------------- */
function parler(texte: string) {
  Speech.stop();
  Speech.speak(texte, { language: 'fr-FR', rate: 1.05 });
}

function Chrono(p: PropsCarte) {
  const I = icone(p.mode);
  const secs = p.jeu.secondes || 5;
  const nommes = p.joueurs.length >= 2;
  const ordre = useRef(nommes ? [...p.joueurs.slice(p.idx % p.joueurs.length), ...p.joueurs.slice(0, p.idx % p.joueurs.length)] : []);
  const qui = (k: number) => (nommes ? ordre.current[k % ordre.current.length] : k === 0 ? 'La personne qui commence' : 'La personne suivante (à gauche)');
  const [tourN, setTourN] = useState(0);
  const [reste, setReste] = useState<number | null>(null);
  const [compte, setCompte] = useState<number | null>(null);
  const [message, setMessage] = useState(nommes ? `${qui(0)} commence.` : "On tourne dans le sens des aiguilles d'une montre.");
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null);
  const tourRef = useRef(0);
  const arreter = () => { if (minuteur.current) clearInterval(minuteur.current); minuteur.current = null; };
  useEffect(() => () => { arreter(); Speech.stop(); }, []);

  function lancerTour(k: number) {
    arreter();
    tourRef.current = k;
    setTourN(k);
    setMessage(nommes ? `À ${qui(k)} !` : k === 0 ? "C'est parti !" : 'Au suivant !');
    if (nommes && k > 0) parler(qui(k));
    setReste(secs);
    minuteur.current = setInterval(() => {
      setReste((r) => {
        const n = (r ?? 1) - 1;
        if (n > 0 && n <= 3) vibrer.leger();
        if (n <= 0) {
          arreter();
          vibrer.fort();
          const perdant = qui(tourRef.current);
          setMessage(`⏰ Temps écoulé : ${perdant} a séché !`);
          setTimeout(() => p.donnerGage(perdant, p.suivant), 700);
          return 0;
        }
        return n;
      });
    }, 1000);
  }
  function demarrer() {
    if (nommes) parler(qui(0));
    let c = 3;
    setCompte(c);
    vibrer.moyen();
    const t = setInterval(() => {
      c -= 1;
      if (c <= 0) { clearInterval(t); setCompte(null); vibrer.fort(); lancerTour(0); return; }
      vibrer.moyen();
      setCompte(c);
    }, 800);
  }
  const enCours = reste !== null && reste > 0;
  return (
    <Cadre pied={<>
      {compte !== null ? null : !enCours && reste === null ? (
        <Bouton titre="▶️ Lancer le chrono" couleur={p.jeu.couleur} onPress={demarrer} style={{ flex: 0 }} />
      ) : enCours ? (
        <Bouton titre="✅ Trouvé ! Au suivant →" couleur={p.jeu.couleur} onPress={() => lancerTour(tourRef.current + 1)} style={{ flex: 0 }} />
      ) : null}
      <Ligne><Bouton titre={`A séché → ${I}`} variante="penalite" onPress={() => { arreter(); p.donnerGage(qui(tourN), p.suivant); }} /><Bouton titre="Autre catégorie →" variante="fantome" onPress={() => { arreter(); p.suivant(); }} /></Ligne>
      <Lien titre="Terminer la partie" onPress={() => { arreter(); p.quitter(); }} />
    </>}>
      <Tour jeu={p.jeu} nom={qui(tourN)} />
      <Puce texte="Catégorie" couleur={p.jeu.couleur} />
      <Question>{p.carte}</Question>
      {compte !== null ? <Text style={[styles.chrono, { color: p.jeu.couleur }]}>{compte}</Text>
        : reste !== null ? <Text style={[styles.chrono, reste <= 2 && { color: C.danger }]}>{reste}</Text> : null}
      <Consigne style={{ fontFamily: F.texteDemi, color: C.ink }}>Chacun son tour, UNE réponse en {secs} secondes. Celui qui sèche ou répète une réponse déjà dite perd.</Consigne>
      <Consigne>{message}</Consigne>
    </Cadre>
  );
}

/* ---------------- Action ou Vérité (Hot) ---------------- */
function ActionVerite(p: PropsCarte) {
  const I = icone(p.mode);
  const [carte, setCarte] = useState<{ k: 'v' | 'a'; c: string } | null>(null);
  const [vide, setVide] = useState(false);
  const pos = useRef<Record<'v' | 'a', number>>({ v: p.idx, a: p.idx });
  function choisir(k: 'v' | 'a') {
    const pool = (k === 'v' ? p.extra?.verites : p.extra?.actions) || [];
    if (!pool.length) { setVide(true); return; }
    vibrer.moyen();
    const c = pool[pos.current[k] % pool.length];
    marquerVue('avpiment', c);
    setCarte({ k, c });
  }
  if (!carte) {
    return (
      <Cadre pied={<Lien titre="Terminer la partie" onPress={p.quitter} />}>
        <Tour jeu={p.jeu} nom={p.tour} />
        <Question>Action ou vérité ?</Question>
        <Consigne>{vide ? 'Plus de cartes à ce niveau : change de niveau.' : `${p.tour} choisit. On peut toujours passer son tour.`}</Consigne>
        <Ligne>
          {(['v', 'a'] as const).map((k) => (
            <Pressable key={k} onPress={() => choisir(k)} style={({ pressed }) => [styles.av, pressed && { transform: [{ scale: 0.97 }] }, { borderColor: melange(p.jeu.couleur, 0.5, C.line) }]}>
              <Text style={{ fontSize: 40 }}>{k === 'v' ? '🙊' : '😈'}</Text>
              <Text style={styles.avTxt}>{k === 'v' ? 'Vérité' : 'Action'}</Text>
            </Pressable>
          ))}
        </Ligne>
      </Cadre>
    );
  }
  return (
    <Cadre pied={<>
      <Ligne><Bouton titre="✅ Fait !" couleur={p.jeu.couleur} onPress={p.suivant} /><Bouton titre={`Je passe → ${I}`} variante="penalite" onPress={() => p.donnerGage(p.tour, p.suivant)} /></Ligne>
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Tour jeu={p.jeu} nom={p.tour} />
      <Puce texte={`${HOT_NOM[carte.c.charAt(0)] || ''} · ${carte.k === 'v' ? 'Vérité' : 'Action'}`} couleur={p.jeu.couleur} />
      <Question>{carte.c.slice(2)}</Question>
    </Cadre>
  );
}

export function CarteJeu(p: PropsCarte) {
  switch (p.jeu.type) {
    case 'grill': return <Grill {...p} />;
    case 'chrono': return <Chrono {...p} />;
    case 'av': return <ActionVerite {...p} />;
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
  relance: { backgroundColor: C.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line, borderRadius: R.md, padding: 15, gap: 6, minHeight: 66, justifyContent: 'center' },
  relanceLbl: { fontFamily: F.texteDemi, fontSize: 11, letterSpacing: 1.8 },
  relanceTxt: { color: C.ink, fontFamily: F.texteMoyen, fontSize: 16, lineHeight: 22 },
  bande: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12.5, letterSpacing: 0.8, textAlign: 'center', textTransform: 'uppercase' },
  av: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 26, borderRadius: R.lg, borderWidth: 1, backgroundColor: C.surface },
  avTxt: { color: C.ink, fontFamily: F.titre, fontSize: 20 },
  pave: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 14, gap: 10 },
  paveLbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase' },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pchip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, paddingRight: 8, paddingVertical: 10, borderRadius: R.pill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  pchipTxt: { color: C.ink, fontFamily: F.texteDemi, fontSize: 15.5 },
  pchipPts: { minWidth: 24, textAlign: 'center', color: C.accent, fontFamily: F.titreGras, fontSize: 14, backgroundColor: C.surface, borderRadius: 10, paddingVertical: 2, overflow: 'hidden' },
});
