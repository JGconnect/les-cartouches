// Ni oui ni non : le téléphone mitraille de questions à voix haute, interdit de dire oui ou non
// (renderTrap du site). Mode survivant (élimination) ou libre, trois rythmes.
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Ligne, Puce, Question } from '@/components/ui';
import { icone, L } from '@/lib/contenu';
import { melanger } from '@/lib/cartes';
import { C, F, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import type { ModuleJeu, PropsCarte } from '../types';
import { Cadre, dire, Segment, st, taire, Tour } from './_commun-a';

type Vitesse = 'lent' | 'moyen' | 'rapide';
const VITESSES: Record<Vitesse, number> = { lent: 4200, moyen: 2800, rapide: 1700 };
type Item = { t: string; r: boolean };

function Trap(p: PropsCarte) {
  const I = icone(p.mode);
  const peutSurvivre = p.joueurs.length >= 2;
  const [survivant, setSurvivant] = useState(peutSurvivre);
  const [vitesse, setVitesse] = useState<Vitesse>('moyen');
  const [enCours, setEnCours] = useState(false);
  const [lance, setLance] = useState(false);
  const [gagne, setGagne] = useState(false);
  const [qui, setQui] = useState('—');
  const [question, setQuestion] = useState('Choisis un rythme, puis lance.');
  const [statut, setStatut] = useState('');
  const [, rafraichir] = useState(0);

  // État de la boucle (lu par les minuteurs) : dans des refs pour éviter les valeurs figées.
  const r = useRef({
    roster: melanger(peutSurvivre ? p.joueurs : (L.VICTIMS as string[])),
    vivants: [] as string[],
    sortis: [] as string[],
    sac: [] as string[],
    cur: null as string | null,
    proch: null as string | null,
    dernierN: 0,
    pool: [] as string[], pi: 0, derniereQ: null as string | null,
    rpool: [] as string[], rpi: 0,
    gen: 0,
    tm: null as ReturnType<typeof setTimeout> | null,
    run: false,
    surv: peutSurvivre,
    vitesse: 'moyen' as Vitesse,
  }).current;
  if (!r.vivants.length && !r.sortis.length) r.vivants = r.roster.slice();
  r.surv = survivant;
  r.vitesse = vitesse;

  const msgAttente = () => (r.surv
    ? "L'appli appelle quelqu'un au hasard et le mitraille de questions. Un oui ou un non : éliminé·e. Dernier debout gagne."
    : peutSurvivre ? 'Mode libre : pas d\'élimination, juste des pénalités.' : 'Ajoute au moins 2 prénoms dans les Réglages pour pouvoir jouer en mode survivant.');
  useEffect(() => { if (!lance) setStatut(msgAttente()); }, [survivant]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { r.gen++; r.run = false; if (r.tm) clearTimeout(r.tm); taire(); }, [r]);

  const propre = (s: string) => String(s).replace(/·/g, '');
  function tirerQ(): string {
    const deck = L.NINON as string[];
    if (r.pi >= r.pool.length) {
      r.pool = melanger(deck); r.pi = 0;
      if (r.pool.length > 1 && r.pool[0] === r.derniereQ) r.pool.push(r.pool.shift()!);
    }
    r.derniereQ = r.pool[r.pi++];
    return r.derniereQ;
  }
  function tirerR(): string {
    if (r.rpi >= r.rpool.length) { r.rpool = melanger(L.RELANCES as string[]); r.rpi = 0; }
    return r.rpool[r.rpi++];
  }
  /** Personne suivante : chacun passe avant qu'on recommence, jamais deux fois de suite. */
  function personneSuivante(): string {
    r.sac = r.sac.filter((x) => r.vivants.includes(x));
    if (!r.sac.length) r.sac = melanger(r.vivants);
    if (r.vivants.length > 1 && r.sac[0] === r.cur) {
      if (r.sac.length > 1) r.sac.push(r.sac.shift()!);
      else r.sac = melanger(r.vivants.filter((x) => x !== r.cur)).concat([r.cur!]);
    }
    return r.sac.shift()!;
  }
  /** Rafale de 1 à 4 questions, jamais la même longueur deux fois de suite. */
  function rafale(): Item[] {
    const poids = ([[1, 25], [2, 30], [3, 25], [4, 20]] as const).filter((x) => x[0] !== r.dernierN);
    const tot = poids.reduce((s, x) => s + x[1], 0);
    let a = 0, n: number = poids[0][0];
    const tirage = Math.random() * tot;
    for (const x of poids) { a += x[1]; if (tirage < a) { n = x[0]; break; } }
    r.dernierN = n;
    const liste: Item[] = [{ t: tirerQ(), r: false }];
    for (let i = 1; i < n; i++) {
      if (!liste[i - 1].r && Math.random() < 0.5) liste.push({ t: tirerR(), r: true });
      else liste.push({ t: tirerQ(), r: false });
    }
    return liste;
  }

  function etape() {
    if (!r.run) return;
    if (r.surv && r.vivants.length <= 1) { victoire(); return; }
    r.cur = r.proch || personneSuivante(); r.proch = null;
    setQui(r.cur); rafraichir((x) => x + 1);
    const g = ++r.gen;
    jouer(rafale(), 0, g);
  }
  function jouer(liste: Item[], i: number, g: number) {
    if (!r.run || g !== r.gen) return;
    const it = liste[i];
    setQuestion(it.t);
    dire((i === 0 ? propre(r.cur || '') + '. ' : '') + it.t, () => {
      if (!r.run || g !== r.gen) return;
      const dernier = i >= liste.length - 1;
      const pause = dernier ? VITESSES[r.vitesse] : Math.round(VITESSES[r.vitesse] * (liste[i + 1].r ? 0.55 : 0.8));
      r.tm = setTimeout(() => { if (dernier) etape(); else jouer(liste, i + 1, g); }, pause);
    });
  }
  function demarrer() {
    r.run = true; setEnCours(true); setLance(true);
    setStatut('Réponds vite… sans « oui » ni « non » !');
    etape();
  }
  function pause() {
    r.run = false; r.gen++; if (r.tm) { clearTimeout(r.tm); r.tm = null; } taire();
    setEnCours(false);
    setStatut('En pause. Reprends quand tu veux.');
  }
  function victoire() {
    r.run = false; r.gen++; if (r.tm) { clearTimeout(r.tm); r.tm = null; }
    vibrer.succes();
    const w = r.vivants[0];
    r.cur = w; setQui(w); setEnCours(false); setGagne(true);
    setQuestion(`🏆 ${w} gagne la manche !`);
    setStatut('Dernier·ère debout. Nouvelle manche ?');
    rafraichir((x) => x + 1);
    dire(`${propre(w)} gagne la manche ! Bravo.`);
  }
  function remettre() {
    r.vivants = r.roster.slice(); r.sortis = []; r.sac = []; r.cur = null; r.proch = null; r.dernierN = 0;
  }
  function craque() {
    const perdant = r.cur;
    if (!perdant || r.sortis.includes(perdant)) return;
    const tournait = r.run;
    if (r.run) pause();
    p.donnerGage(perdant, () => {
      if (r.surv) {
        const k = r.vivants.indexOf(perdant);
        if (k >= 0) { r.vivants.splice(k, 1); r.sortis.push(perdant); }
        r.cur = null; setQui('…'); rafraichir((x) => x + 1);
        if (r.vivants.length <= 1) { victoire(); return; }
        setStatut(`${perdant} est éliminé·e. Plus que ${r.vivants.length} en jeu.`);
        dire(`${propre(perdant)} est éliminé. Au suivant !`, () => {
          if (tournait && !r.run) { r.run = true; setEnCours(true); etape(); }
        });
      } else if (tournait) {
        r.run = true; setEnCours(true); setStatut('Réponds vite… sans « oui » ni « non » !'); etape();
      }
    });
  }
  function passer() {
    taire(); r.gen++; if (r.tm) { clearTimeout(r.tm); r.tm = null; }
    if (r.run) etape();
    else { r.proch = personneSuivante(); r.cur = r.proch; setQui(r.cur); rafraichir((x) => x + 1); }
  }
  function nouvelleManche() {
    r.roster = melanger(r.roster); remettre();
    setGagne(false); setQui('—'); setQuestion('Nouvelle manche ! Tout le monde revient.');
    demarrer();
  }
  function changerMode(m: 'surv' | 'libre') {
    const veut = m === 'surv';
    if (veut === survivant) return;
    r.surv = veut; setSurvivant(veut);
    remettre(); setGagne(false); setQui(r.run ? qui : '—');
    rafraichir((x) => x + 1);
  }

  return (
    <Cadre pied={<>
      {gagne ? (
        <Bouton titre="🔁 Nouvelle manche" couleur={p.jeu.couleur} onPress={nouvelleManche} style={{ flex: 0 }} />
      ) : (
        <Bouton titre={enCours ? '⏸ Pause' : lance ? '▶️ Reprendre' : "▶️ Lancer l'interrogatoire"} couleur={p.jeu.couleur} onPress={() => (enCours ? pause() : demarrer())} style={{ flex: 0 }} />
      )}
      <Ligne>
        <Bouton titre={survivant ? 'A craqué → éliminé·e' : `Mot interdit → ${I}`} variante="penalite" desactive={gagne} onPress={craque} />
        <Bouton titre="Passer →" variante="fantome" desactive={gagne} onPress={passer} />
      </Ligne>
      <Lien titre="Terminer la partie" onPress={() => { pause(); p.quitter(); }} />
    </>}>
      <Tour jeu={p.jeu} nom={qui} libelle="Sur la sellette" />
      <Puce texte={survivant ? 'Mode survivant' : peutSurvivre ? 'Mode libre' : 'Interrogatoire'} couleur={p.jeu.couleur} />
      <Question>{question}</Question>
      <Consigne>{statut}</Consigne>
      {survivant ? (
        <View style={[st.puces, { justifyContent: 'center' }]}>
          {r.roster.map((x) => {
            const sorti = r.sortis.includes(x);
            const actuel = x === r.cur && !sorti;
            return (
              <View key={x} style={[st.pchip, { paddingRight: 14 }, actuel && { borderColor: p.jeu.couleur, backgroundColor: p.jeu.couleur }, sorti && { opacity: 0.35 }]}>
                <Text style={[st.pchipTxt, sorti && { textDecorationLine: 'line-through' }, actuel && { color: '#fff' }]}>{x}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
      {peutSurvivre ? (
        <Segment titre="Mode" couleur={p.jeu.couleur} valeur={survivant ? 'surv' : 'libre'} changer={changerMode}
          choix={[{ id: 'surv', titre: '🏆 Survivant', sous: 'élimination' }, { id: 'libre', titre: '🎲 Libre', sous: 'sans élimination' }]} />
      ) : null}
      <Segment titre="Rythme" couleur={p.jeu.couleur} valeur={vitesse} changer={setVitesse}
        choix={[{ id: 'lent', titre: 'Lent' }, { id: 'moyen', titre: 'Moyen' }, { id: 'rapide', titre: 'Rapide' }]} />
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Lien titre="🔊 Tester la voix" onPress={() => dire('Bonjour ! Je vais vous poser des questions. Interdit de dire oui ou non.')} />
        <Text style={{ color: C.inkFaint, fontFamily: F.texte, fontSize: 12.5, lineHeight: 18, textAlign: 'center', maxWidth: 320 }}>Pas de son ? Désactive le mode silencieux de ton iPhone (bouton sur le côté) et monte le volume.</Text>
      </View>
      <View style={{ alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, backgroundColor: C.surface }}>
        <Text style={st.bande}>Interdit de dire <Text style={{ color: C.oui }}>OUI</Text> / <Text style={{ color: C.non }}>NON</Text> sinon {I}</Text>
      </View>
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: Trap,
  preparer: async () => ({ pioche: [0] }),
  sansProgression: true,
  fraicheur: () => null,
};

export default module;
