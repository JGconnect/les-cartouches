// Le Menteur : variante « Histoires » (un menteur invente) et « Mots » façon Undercover, avec Mr White
// (renderMenteur + renderIntrus du site).
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Bouton, Consigne, Lien, Ligne, Puce, Question, Reponse } from '@/components/ui';
import { icone, jeu as trouverJeu, L } from '@/lib/contenu';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { C, F } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import { avecTheme } from '../moteur';
import type { ModuleJeu, Options, PropsCarte } from '../types';
import { Cadre, ChoixPrenom, Chiffre, Decompte, normMot, Passe, PaveN, st, Tour, useMinuteur } from './_commun-a';

/** Le menteur de la manche précédente (pour ne pas tomber deux fois de suite sur la même personne). */
let dernierMenteur: string | null = null;

/* ======================= Variante Histoires ======================= */

function Raconte({ p, nom, theme, puce, premier, suivantNom, fini }: { p: PropsCarte; nom: string; theme: string; puce: string; premier: boolean; suivantNom: string | null; fini: () => void }) {
  const m = useMinuteur(30);
  return (
    <Cadre pied={<>
      <Bouton titre={m.reste === 0 ? '⏰ Temps écoulé !' : '⏱️ Lancer les 30 secondes'} variante="fantome" desactive={m.reste !== null} onPress={m.lancer} style={{ flex: 0 }} />
      <Bouton titre={suivantNom ? `Au suivant : ${suivantNom} →` : 'Tout le monde a raconté → voter'} couleur={p.jeu.couleur} onPress={() => { m.arreter(); fini(); }} style={{ flex: 0 }} />
      <Lien titre="Terminer la partie" onPress={() => { m.arreter(); p.quitter(); }} />
    </>}>
      <Tour jeu={p.jeu} nom={nom} />
      <Puce texte={puce} couleur={p.jeu.couleur} />
      <Question>{theme}</Question>
      <Chiffre n={m.reste ?? 30} alerte={m.reste !== null && m.reste <= 5} />
      <Consigne>{premier ? 'Chacun son tour. ' : ''}<Text style={st.gras}>{nom}</Text> raconte son histoire en 30 secondes. Les autres peuvent poser une question.</Consigne>
    </Cadre>
  );
}

type PhaseH = { k: 'roles'; ri: number; vu: boolean } | { k: 'tell'; ti: number } | { k: 'vote' } | { k: 'decompte' } | { k: 'pick' } | { k: 'reveal'; acc: string };

function Histoires(p: PropsCarte) {
  const I = icone(p.mode);
  const brut = String(p.carte);
  const epice = brut.indexOf('épicé|') === 0;
  const theme = epice ? brut.slice(6) : brut;
  const puce = `${epice ? '🌶️ ' : ''}Thème de la manche`;
  const [menteur] = useState(() => {
    const cand = p.joueurs.filter((x) => x !== dernierMenteur);
    const m = cand[Math.floor(Math.random() * cand.length)];
    dernierMenteur = m;
    return m;
  });
  const [ordre] = useState(() => melanger(p.joueurs));
  const [conteurs] = useState(() => melanger(p.joueurs));
  const [ph, setPh] = useState<PhaseH>({ k: 'roles', ri: 0, vu: false });

  if (ph.k === 'roles') {
    const qui = ordre[ph.ri];
    if (!ph.vu) {
      return (
        <Passe jeu={p.jeu} nom={qui} quitter={p.quitter}
          message={<>{ph.ri ? 'Rôle caché 🙈 ' : ''}Chacun découvre son rôle <Text style={st.gras}>en secret</Text>. Les autres, ne regardez pas !</>}
          bouton={`Je suis ${qui} → voir mon rôle`} onPress={() => { vibrer.moyen(); setPh({ ...ph, vu: true }); }} />
      );
    }
    const estM = qui === menteur;
    return (
      <Cadre pied={<Bouton titre="🙈 Cacher et passer" couleur={p.jeu.couleur} onPress={() => setPh(ph.ri + 1 < ordre.length ? { k: 'roles', ri: ph.ri + 1, vu: false } : { k: 'tell', ti: 0 })} style={{ flex: 0 }} />}>
        <Puce texte={puce} couleur={p.jeu.couleur} />
        <Question>{theme}</Question>
        <Reponse
          titre={estM ? '🤥 Tu es le MENTEUR' : '🤫 Raconte une VRAIE histoire'}
          texte={estM ? 'Invente une histoire crédible sur ce thème. Ne te fais pas griller !' : 'Une histoire vraie, la tienne. Le menteur se cache parmi vous…'}
          etat={estM ? 'ko' : 'ok'}
        />
      </Cadre>
    );
  }

  if (ph.k === 'tell') {
    const ti = ph.ti;
    return (
      <Raconte key={ti} p={p} nom={conteurs[ti]} theme={theme} puce={puce} premier={ti === 0}
        suivantNom={ti + 1 < conteurs.length ? conteurs[ti + 1] : null}
        fini={() => setPh(ti + 1 < conteurs.length ? { k: 'tell', ti: ti + 1 } : { k: 'vote' })} />
    );
  }

  if (ph.k === 'vote') {
    return (
      <Cadre pied={<>
        <Bouton titre="👉 Lancer le 3, 2, 1" couleur={p.jeu.couleur} onPress={() => setPh({ k: 'decompte' })} style={{ flex: 0 }} />
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        <Puce texte={puce} couleur={p.jeu.couleur} />
        <Question>Qui a menti ?</Question>
        <Consigne>Tout le monde se prépare… À <Text style={st.gras}>trois</Text>, chacun <Text style={st.gras}>pointe du doigt</Text> le menteur en même temps (le menteur aussi, pour brouiller les pistes !).</Consigne>
      </Cadre>
    );
  }

  if (ph.k === 'decompte') return <Decompte dernier="Pointez ! 👉" couleur={p.jeu.couleur} fin={() => setPh({ k: 'pick' })} />;

  if (ph.k === 'pick') {
    return (
      <Cadre pied={<Lien titre="Terminer la partie" onPress={p.quitter} />}>
        <Puce texte={puce} couleur={p.jeu.couleur} />
        <Question>Qui a été le plus pointé ?</Question>
        <Consigne>Touchez la personne que la table a désignée.</Consigne>
        <ChoixPrenom noms={p.joueurs} choisir={(acc) => {
          const pris = acc === menteur;
          if (!pris) { p.ajouterPoint(menteur, 2); vibrer.succes(); } else vibrer.fort();
          setPh({ k: 'reveal', acc });
        }} />
      </Cadre>
    );
  }

  const pris = ph.acc === menteur;
  return (
    <Cadre pied={<>
      <Ligne>
        <Bouton titre={`${pris ? menteur : 'Les trompés'} → ${I}`} variante="penalite" onPress={() => p.donnerGage(pris ? menteur : `tous ceux qui ont pointé ${ph.acc}`, p.suivant)} />
        <Bouton titre={p.idx + 1 < p.total ? 'Manche suivante →' : 'Voir le classement'} variante="fantome" onPress={p.suivant} />
      </Ligne>
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Puce texte={puce} couleur={p.jeu.couleur} />
      <Question petit>{theme}</Question>
      <Consigne>La table a désigné <Text style={st.gras}>{ph.acc}</Text>…</Consigne>
      <Reponse titre={`🤥 Le menteur : ${menteur}`} texte={pris ? "Démasqué ! Touchez ceux qui l'avaient pointé (+1 point chacun)." : `${menteur} s'en sort : +2 points !`} etat={pris ? 'ok' : 'ko'} />
      {pris ? <PaveN joueurs={p.joueurs.filter((x) => x !== menteur)} scores={p.scores} ajouterPoint={p.ajouterPoint} libelle={`Qui avait pointé ${menteur} ? Touche pour +1`} /> : null}
    </Cadre>
  );
}

/* ======================= Variante Mots (l'intrus) ======================= */

type Role = 'civil' | 'intrus' | 'white';
const NOM_ROLE: Record<Role, string> = { civil: '🙂 Civil', intrus: '🎭 Intrus', white: '👻 Mr White' };

type PhaseI =
  | { k: 'dist'; ri: number; vu: boolean }
  | { k: 'parler'; ordre: string[] }
  | { k: 'decompte' }
  | { k: 'pick' }
  | { k: 'white'; qui: string }
  | { k: 'apres'; qui: string; role: Role; extra: string }
  | { k: 'fin'; gagnant: Role; dernier: string };

function Intrus(p: PropsCarte) {
  const I = icone(p.mode);
  const [mots] = useState(() => {
    const pair = String(p.carte).split('|');
    if (Math.random() < 0.5) pair.reverse();
    return { civil: pair[0], intrus: pair[1] };
  });
  const [roles] = useState<Record<string, Role>>(() => {
    const avecWhite = p.opts.white === 'oui' && p.joueurs.length >= 5;
    const r: Record<string, Role> = {};
    melanger(p.joueurs).forEach((x, i) => { r[x] = i === 0 ? 'intrus' : avecWhite && i === 1 ? 'white' : 'civil'; });
    return r;
  });
  const [ordre] = useState(() => melanger(p.joueurs));
  const [enJeu, setEnJeu] = useState<string[]>(p.joueurs);
  const [tourN, setTourN] = useState(1);
  const [ph, setPh] = useState<PhaseI>({ k: 'dist', ri: 0, vu: false });
  const [prop, setProp] = useState('');

  const puce = <Puce texte={`Manche ${p.idx + 1} · tour ${tourN} · ${enJeu.length} en jeu`} couleur={p.jeu.couleur} />;
  const intrus = p.joueurs.find((x) => roles[x] === 'intrus')!;
  const white = p.joueurs.find((x) => roles[x] === 'white');

  function aParler(vivants: string[]) {
    const so = melanger(vivants);
    if (roles[so[0]] === 'white' && so.length > 1) so.push(so.shift()!);
    setPh({ k: 'parler', ordre: so });
  }
  function terminer(g: Role, dernier: string) {
    if (g === 'civil') p.joueurs.forEach((x) => { if (roles[x] === 'civil') p.ajouterPoint(x, 1); });
    if (g === 'intrus') p.ajouterPoint(intrus, 3);
    if (g === 'white') p.ajouterPoint(dernier, 3);
    vibrer.succes();
    setPh({ k: 'fin', gagnant: g, dernier });
  }
  function apres(qui: string, role: Role, extra: string, vivants: string[]) {
    const mechants = vivants.filter((x) => roles[x] !== 'civil').length;
    const civils = vivants.filter((x) => roles[x] === 'civil').length;
    if (!mechants) return terminer('civil', qui);
    if (civils <= 1) return terminer('intrus', qui);
    vibrer.moyen();
    setPh({ k: 'apres', qui, role, extra });
  }
  function eliminer(qui: string) {
    const vivants = enJeu.filter((x) => x !== qui);
    setEnJeu(vivants);
    const r = roles[qui];
    if (r === 'white') { setProp(''); setPh({ k: 'white', qui }); return; }
    apres(qui, r, '', vivants);
  }

  if (ph.k === 'dist') {
    const qui = ordre[ph.ri];
    if (!ph.vu) {
      return (
        <Passe jeu={p.jeu} nom={qui} quitter={p.quitter}
          message={<>{ph.ri ? 'Mot caché 🙈 ' : ''}Chacun découvre son mot <Text style={st.gras}>en secret</Text>.</>}
          bouton={`Je suis ${qui} → voir mon mot`} onPress={() => { vibrer.moyen(); setPh({ ...ph, vu: true }); }} />
      );
    }
    const r = roles[qui];
    return (
      <Cadre pied={<Bouton titre="🙈 Cacher et passer" couleur={p.jeu.couleur} onPress={() => (ph.ri + 1 < ordre.length ? setPh({ k: 'dist', ri: ph.ri + 1, vu: false }) : aParler(enJeu))} style={{ flex: 0 }} />}>
        <Puce texte={`Rien que pour ${qui}`} couleur={p.jeu.couleur} />
        {r === 'white' ? (
          <>
            <Question>👻 Tu es Mr White</Question>
            <Consigne>Tu n'as <Text style={st.gras}>pas de mot</Text>. Écoute bien les autres et bluffe ! Si tu es éliminé·e, tu pourras gagner en devinant le mot des civils.</Consigne>
          </>
        ) : (
          <>
            <Consigne>Ton mot :</Consigne>
            <Text style={{ color: C.ink, fontFamily: F.titre, fontSize: 44, lineHeight: 50, textAlign: 'center' }}>{r === 'intrus' ? mots.intrus : mots.civil}</Text>
            <Consigne>Attention : un joueur a un mot <Text style={st.gras}>proche mais différent</Text>… et c'est peut-être toi !</Consigne>
          </>
        )}
      </Cadre>
    );
  }

  if (ph.k === 'parler') {
    return (
      <Cadre pied={<>
        <Bouton titre="👉 Tout le monde a parlé → on vote" couleur={p.jeu.couleur} onPress={() => setPh({ k: 'decompte' })} style={{ flex: 0 }} />
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        {puce}
        <Question>Chacun dit UN mot</Question>
        <Consigne>Dans cet ordre, chacun donne <Text style={st.gras}>un seul mot</Text> en rapport avec son mot secret. Ni trop précis (l'intrus devinerait), ni trop vague (on vous soupçonnerait) !</Consigne>
        <View style={{ gap: 8, alignSelf: 'center' }}>
          {ph.ordre.map((x, i) => (
            <Text key={x} style={{ color: C.ink, fontFamily: F.titreGras, fontSize: 18 }}>{i + 1}. {x}</Text>
          ))}
        </View>
      </Cadre>
    );
  }

  if (ph.k === 'decompte') return <Decompte dernier="Pointez ! 👉" couleur={p.jeu.couleur} fin={() => setPh({ k: 'pick' })} />;

  if (ph.k === 'pick') {
    return (
      <Cadre pied={<Lien titre="Terminer la partie" onPress={p.quitter} />}>
        {puce}
        <Question>Qui est éliminé ?</Question>
        <Consigne>Touchez la personne la plus pointée. En cas d'égalité, revotez entre les ex æquo.</Consigne>
        <ChoixPrenom noms={enJeu} choisir={eliminer} />
      </Cadre>
    );
  }

  if (ph.k === 'white') {
    const proposer = () => {
      if (normMot(prop) === normMot(mots.civil)) { terminer('white', ph.qui); return; }
      apres(ph.qui, 'white', `Raté ! Le mot était « ${mots.civil} ».`, enJeu);
    };
    return (
      <Cadre pied={<Bouton titre="Proposer" couleur={p.jeu.couleur} onPress={proposer} style={{ flex: 0 }} />}>
        {puce}
        <Question>{ph.qui} était 👻 Mr White !</Question>
        <Consigne>Dernière chance : quel est le mot des civils ?</Consigne>
        <TextInput value={prop} onChangeText={setProp} maxLength={40} placeholder="Le mot des civils" placeholderTextColor={C.inkFaint}
          autoFocus autoCorrect={false} returnKeyType="done" onSubmitEditing={proposer} style={st.champ} />
      </Cadre>
    );
  }

  if (ph.k === 'apres') {
    return (
      <Cadre pied={<>
        <Bouton titre="Tour suivant →" couleur={p.jeu.couleur} onPress={() => { setTourN(tourN + 1); aParler(enJeu); }} style={{ flex: 0 }} />
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        {puce}
        <Question>{ph.qui} était {NOM_ROLE[ph.role]}</Question>
        {ph.extra ? <Consigne>{ph.extra}</Consigne> : null}
        <Consigne>{ph.role === 'civil' ? "Raté, c'était un civil ! L'intrus court toujours…" : 'Encore un imposteur en jeu…'}</Consigne>
      </Cadre>
    );
  }

  const g = ph.gagnant;
  const titre = { civil: '🙂 Les civils gagnent !', intrus: "🎭 L'intrus gagne !", white: '👻 Mr White gagne !' }[g];
  return (
    <Cadre pied={<>
      <Ligne>
        <Bouton titre={`${g === 'civil' ? intrus : 'Les civils'} → ${I}`} variante="penalite" onPress={() => p.donnerGage(g === 'civil' ? intrus : 'les civils', p.suivant)} />
        <Bouton titre={p.idx + 1 < p.total ? 'Manche suivante →' : 'Voir le classement'} variante="fantome" onPress={p.suivant} />
      </Ligne>
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Puce texte={`Fin de la manche ${p.idx + 1}`} couleur={p.jeu.couleur} />
      <Question>{titre}</Question>
      <Reponse titre={`Civils : « ${mots.civil} »`} texte={`Intrus : ${intrus} avec « ${mots.intrus} »${white ? ` · Mr White : ${white}` : ''}`} etat={g === 'civil' ? 'ok' : 'ko'} />
      <Consigne>{g === 'civil' ? '+1 point pour chaque civil.' : g === 'intrus' ? `+3 points pour ${intrus} !` : `+3 points pour ${ph.dernier} !`}</Consigne>
    </Cadre>
  );
}

function Menteur(p: PropsCarte) {
  return p.opts.variante === 'mots' ? <Intrus {...p} /> : <Histoires {...p} />;
}

const module: ModuleJeu = {
  Composant: Menteur,
  minJoueurs: 3,
  options: [
    { cle: 'variante', titre: 'Variante', defaut: 'histoires', choix: [{ id: 'histoires', titre: '📖 Histoires', sous: 'un menteur invente' }, { id: 'mots', titre: '🎭 Mots', sous: 'façon Undercover' }] },
    { cle: 'themes', titre: 'Thèmes (variante Histoires)', defaut: 'doux', choix: [{ id: 'doux', titre: '😇 Tout public', sous: 'anecdotes de vie' }, { id: 'epice', titre: '🌶️ Avec du piquant', sous: 'amours et dates' }] },
    { cle: 'white', titre: 'Mr White (variante Mots, 5 joueurs et +)', defaut: 'non', choix: [{ id: 'non', titre: 'Sans', sous: 'un intrus' }, { id: 'oui', titre: '👻 Avec', sous: 'un joueur sans mot' }] },
  ],
  async preparer(o: Options) {
    dernierMenteur = null;
    const j = trouverJeu('menteur')!;
    const n = j.partie || 6;
    if (o.opts.variante === 'mots') {
      const tout = L.INTRUS_MOTS as string[];
      const pioche = await fraichesDabord('intrus', melanger(tout), tout.length);
      return { pioche: pioche.slice(0, n) };
    }
    const tout = (L.MENTEUR as string[]).filter((x) => o.opts.themes === 'epice' || x.indexOf('épicé|') !== 0);
    let pioche: unknown[] = await fraichesDabord('menteur', melanger(tout), Math.min(n, tout.length));
    pioche = avecTheme(j, pioche, o);
    return { pioche };
  },
  fraicheur: (o) => (o.opts.variante === 'mots' ? 'intrus' : 'menteur'),
};

export default module;
