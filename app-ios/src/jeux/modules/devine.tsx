// Devine qui : le maître du jeu incarne un personnage secret, les autres posent des questions oui/non.
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Ligne, Puce, Question } from '@/components/ui';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { L } from '@/lib/contenu';
import { C, F } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import type { ModuleJeu, PropsCarte } from '../types';
import { Bandeau, Cadre, Classement, mmss, s } from './_outils-quiz';

type Perso = [string, string, string, string, string];

const DEV_CATS: Record<string, string> = { celeb: 'Célébrités', musique: 'Musique', sport: 'Sport', fiction: 'Films & séries', anim: 'Dessins animés', bd: 'BD, comics & manga', jeux: 'Jeux vidéo', histoire: 'Histoire' };
const HINT_AT = [300, 420, 540];

type Extra = { persos: Perso[]; pos: number; vus: (nom: string) => void };

/** Personnage suivant (jamais vus d'abord), en évitant `eviter`. */
function suivantPerso(x: Extra, eviter?: string): Perso {
  for (let k = 0; k < x.persos.length; k++) {
    const d = x.persos[x.pos % x.persos.length];
    x.pos++;
    if (d[0] !== eviter || x.persos.length === 1) { x.vus(d[0]); return d; }
  }
  return x.persos[0];
}

function Devine(p: PropsCarte) {
  const x = p.extra as Extra;
  x.vus = (nom) => p.marquerVue('devine', nom);
  const nommes = p.joueurs.length >= 2;
  const maitre = nommes ? p.tour : 'le maître du jeu';
  const devineurs = nommes ? (() => { const mi = p.joueurs.indexOf(maitre); return p.joueurs.slice(mi + 1).concat(p.joueurs.slice(0, mi)); })() : [];

  const [phase, setPhase] = useState<'main' | 'secret' | 'jeu' | 'qui' | 'fin'>('main');
  const [ch, setCh] = useState<Perso>(() => suivantPerso(x));
  const [gi, setGi] = useState(0);
  const [nq, setNq] = useState(0);
  const [indices, setIndices] = useState(0);
  const [secs, setSecs] = useState(0);
  const [voir, setVoir] = useState(false);
  const [msg, setMsg] = useState('');
  const [resultat, setResultat] = useState<{ qui: string | null; pts: number } | null>(null);
  const t = useRef<ReturnType<typeof setInterval> | null>(null);
  const indRef = useRef(0);
  const stop = () => { if (t.current) clearInterval(t.current); t.current = null; };
  useEffect(() => stop, []);

  const qui = () => (nommes ? devineurs[gi % devineurs.length] : 'La personne suivante');

  function donnerIndice(auto: boolean) {
    if (indRef.current >= 3) return;
    indRef.current++;
    setIndices(indRef.current);
    vibrer.alerte();
    setMsg(`${auto ? '⏰ Ça bloque ! ' : ''}${maitre} lit l'indice ${indRef.current} à voix haute.`);
  }
  function jouer(message?: string) {
    setPhase('jeu');
    setMsg(message || `${nommes ? `${maitre} garde le téléphone et répond. ` : ''}Oui : la même personne rejoue. Non : au suivant.`);
    stop();
    t.current = setInterval(() => {
      setSecs((v) => {
        const n = v + 1;
        if (indRef.current < 3 && n >= HINT_AT[indRef.current]) setTimeout(() => donnerIndice(true), 0);
        return n;
      });
    }, 1000);
  }
  function trouve() {
    stop();
    const pts = Math.max(1, 3 - indRef.current);
    vibrer.succes();
    if (!nommes) { setResultat({ qui: '', pts }); setPhase('fin'); return; }
    setPhase('qui');
  }
  function gagnant(w: string) {
    const pts = Math.max(1, 3 - indRef.current);
    p.ajouterPoint(w, pts);
    setResultat({ qui: w, pts });
    setPhase('fin');
  }
  function abandon() {
    stop();
    if (nommes) p.ajouterPoint(maitre, 2);
    setResultat({ qui: null, pts: 0 });
    setPhase('fin');
  }

  const listeIndices = (n: number) => (
    <View style={s.boite}>
      {[2, 3, 4].slice(0, n).map((i, k) => (
        <Text key={i} style={{ color: C.ink, fontFamily: F.texte, fontSize: 15, lineHeight: 21 }}>
          <Text style={{ color: p.jeu.couleur, fontFamily: F.texteDemi, fontSize: 11, letterSpacing: 1.5 }}>INDICE {k + 1}  </Text>{ch[i]}
        </Text>
      ))}
    </View>
  );

  if (phase === 'main') {
    return (
      <Cadre pied={<>
        <Bouton titre={nommes ? `Je suis ${maitre}, voir mon personnage` : 'Voir le personnage secret'} couleur={p.jeu.couleur} onPress={() => setPhase('secret')} style={{ flex: 0 }} />
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        <Bandeau jeu={p.jeu} lbl="Maître du jeu" nom={maitre} />
        <Puce texte={`Manche ${p.idx + 1}`} couleur={p.jeu.couleur} />
        <Question>{nommes ? `Passe le téléphone à ${maitre}.` : 'Passe le téléphone au maître du jeu.'}</Question>
        <Consigne>Les autres, ne regardez pas l'écran : un personnage secret va s'afficher.</Consigne>
      </Cadre>
    );
  }
  if (phase === 'secret') {
    return (
      <Cadre pied={<>
        <Bouton titre="C'est mémorisé → lancer la manche" couleur={p.jeu.couleur} onPress={() => jouer()} style={{ flex: 0 }} />
        <Lien titre="Je ne connais pas ce personnage → un autre" onPress={() => { vibrer.choix(); setCh(suivantPerso(x, ch[0])); }} />
      </>}>
        <Puce texte={DEV_CATS[ch[1]] || ch[1]} couleur={p.jeu.couleur} />
        <Text style={{ color: C.ink, fontFamily: F.titre, fontSize: 42, lineHeight: 46, textAlign: 'center' }}>{ch[0]}</Text>
        {listeIndices(3)}
        <Consigne>Mémorise-le. Tu réponds aux questions par oui ou non (ou « je ne sais pas »). Les indices ne sont à lire que quand l'appli te le dit.</Consigne>
      </Cadre>
    );
  }
  if (phase === 'qui') {
    const pts = Math.max(1, 3 - indices);
    return (
      <Cadre pied={<Lien titre="← Fausse alerte, on reprend" onPress={() => jouer(`On reprend. Au tour de ${qui()}.`)} />}>
        <Puce texte="Bravo !" couleur={p.jeu.couleur} />
        <Question>Qui a trouvé ?</Question>
        <Consigne>{pts} point{pts > 1 ? 's' : ''} pour la bonne réponse ({indices ? `${indices} indice${indices > 1 ? 's' : ''} donné${indices > 1 ? 's' : ''}` : 'sans indice'}).</Consigne>
        <View style={s.grille}>
          {devineurs.map((g) => (
            <Pressable key={g} onPress={() => { vibrer.choix(); gagnant(g); }} style={s.chip}><Text style={[s.chipTxt, { color: C.ink }]}>{g}</Text></Pressable>
          ))}
        </View>
      </Cadre>
    );
  }
  if (phase === 'fin' && resultat) {
    const { qui: w, pts } = resultat;
    return (
      <Cadre pied={<>
        <Bouton titre="Manche suivante →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        <Puce texte={w === null ? "Personne n'a trouvé" : 'Trouvé !'} couleur={p.jeu.couleur} />
        <Consigne>Le personnage était</Consigne>
        <Text style={{ color: C.ink, fontFamily: F.titre, fontSize: 42, lineHeight: 46, textAlign: 'center' }}>{ch[0]}</Text>
        <Consigne>{mmss(secs)} · {nq} question{nq > 1 ? 's' : ''} · {indices} indice{indices > 1 ? 's' : ''}</Consigne>
        {w === null
          ? (nommes ? <Consigne>{maitre} gagne 2 points pour avoir tenu bon.</Consigne> : null)
          : <Consigne>{w ? `${w} marque ${pts} point${pts > 1 ? 's' : ''}.` : `${pts} point${pts > 1 ? 's' : ''} pour la table.`}</Consigne>}
        <Classement scores={p.scores} />
      </Cadre>
    );
  }

  const prochain = indices < 3 ? HINT_AT[indices] : null;
  return (
    <Cadre
      haut={<>
        <Bandeau jeu={p.jeu} emoji="❓" lbl="Pose ta question" nom={qui()} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 10 }}>
          <Text style={[s.lnum, { color: C.inkSoft, fontSize: 15 }]}>{mmss(secs)}</Text>
          <Text style={[s.lnum, { color: C.inkSoft, fontSize: 15 }]}>{nq} question{nq > 1 ? 's' : ''}</Text>
        </View>
      </>}
      pied={<>
        <Ligne>
          <Bouton titre="✅ Oui" couleur={C.soft} onPress={() => { setNq((n) => n + 1); setMsg(`Oui ! ${qui()} repose une question.`); }} />
          <Bouton titre="❌ Non" couleur={C.non} onPress={() => { setNq((n) => n + 1); const ng = gi + 1; setGi(ng); setMsg(`Non. Au tour de ${nommes ? devineurs[ng % devineurs.length] : 'La personne suivante'}.`); }} />
        </Ligne>
        <Bouton titre="🤷 Je ne sais pas / ça dépend" variante="fantome" petit onPress={() => setMsg(`Pas de réponse claire : ${qui()} reformule ou pose une autre question.`)} style={{ flex: 0 }} />
        <Bouton titre="🎉 Trouvé !" couleur={p.jeu.couleur} onPress={trouve} style={{ flex: 0 }} />
        <Ligne>
          <Bouton titre="💡 Indice" variante="fantome" petit desactive={indices >= 3} onPress={() => donnerIndice(false)} />
          <Bouton titre={voir ? '🙈 Cacher' : '👁 Revoir'} variante="fantome" petit onPress={() => setVoir((v) => !v)} />
        </Ligne>
        <Lien titre="On abandonne → révéler" onPress={abandon} />
      </>}
    >
      <Consigne>{msg}</Consigne>
      {indices ? listeIndices(indices) : null}
      <Text style={[s.lbl, { textTransform: 'none', letterSpacing: 0.3 }]}>
        {prochain === null ? 'Tous les indices sont donnés' : secs >= prochain ? '' : `Indice ${indices + 1} dans ${mmss(prochain - secs)}`}
      </Text>
      {voir ? <View style={s.boite}><Text style={{ color: C.ink, fontFamily: F.texteDemi, fontSize: 16, textAlign: 'center' }}>{ch[0]} · {DEV_CATS[ch[1]] || ch[1]}</Text></View> : null}
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: Devine,
  sansProgression: true,
  fraicheur: () => null,
  options: [{
    cle: 'cat', titre: 'Catégories de personnages', defaut: 'tout',
    choix: [{ id: 'tout', titre: '🎲 Toutes' }, ...Object.keys(DEV_CATS).map((k) => ({ id: k, titre: DEV_CATS[k] }))],
  }],
  async preparer(o) {
    const cat = o.opts.cat || 'tout';
    const tous = L.DEVINE as Perso[];
    const pool = cat === 'tout' ? tous : tous.filter((d) => d[1] === cat);
    const noms = await fraichesDabord('devine', melanger(pool.map((d) => d[0])), pool.length);
    const persos = noms.map((n) => pool.find((d) => d[0] === n)!).filter(Boolean);
    const extra: Extra = { persos: persos.length ? persos : tous, pos: 0, vus: () => {} };
    return { pioche: Array.from({ length: 200 }, (_, i) => i), extra };
  },
};
export default module;
