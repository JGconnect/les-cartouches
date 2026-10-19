// N'oubliez pas les paroles (version maison) : la musique se coupe d'un coup, la personne au micro continue à chanter.
import { useEffect, useRef, useState } from 'react';

import { Bouton, Consigne, Lien, Ligne, Puce, Question } from '@/components/ui';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { C, melange } from '@/lib/theme';

import type { ModuleJeu, PropsCarte } from '../types';
import { Bandeau, Barre, CarteChanson, Cadre, Chargement, chansons, Credit, Disque, Echec, Quitter, Tableau, useExtrait } from './audio';

type Etape = 'ecoute' | 'chante' | 'verif' | 'resultat';

function Paroles(p: PropsCarte) {
  const nomme = p.joueurs.length >= 2;
  const chanteur = nomme ? p.tour : 'la personne au micro';
  const cat = p.opts.cat || 'mix';
  const x = useExtrait(p, `par_${cat}`);
  const { lecteur, phase, setPhase, piste } = x;
  const [etape, setEtape] = useState<Etape | null>(null);
  const [part, setPart] = useState(0);
  const [reussi, setReussi] = useState(false);
  const coupe = useRef(20);
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null);
  const bord = melange(p.jeu.couleur, 0.4, C.line);

  const arreter = () => { if (minuteur.current) { clearInterval(minuteur.current); minuteur.current = null; } try { lecteur.pause(); } catch {} };
  useEffect(() => () => { if (minuteur.current) clearInterval(minuteur.current); }, []);

  function nouvelleCoupe() {
    const d = lecteur.duration && isFinite(lecteur.duration) ? lecteur.duration : 30;
    coupe.current = Math.round((10 + Math.random() * Math.max(4, d - 20)) * 10) / 10;
  }
  const charger = () => { arreter(); setEtape(null); x.charger(() => { nouvelleCoupe(); setPhase('pret'); }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, []);

  function ecouter() {
    arreter();
    lecteur.seekTo(0).catch(() => {});
    lecteur.play();
    setPart(0);
    setEtape('ecoute');
    minuteur.current = setInterval(() => {
      const c = lecteur.currentTime || 0;
      setPart(c / coupe.current);
      const fini = lecteur.duration > 0 && c >= lecteur.duration - 0.25;
      if (c >= coupe.current || fini) { arreter(); setEtape('chante'); }
    }, 100);
  }
  function verifier() {
    arreter();
    const fin = coupe.current + 9;
    lecteur.seekTo(coupe.current).catch(() => {});
    lecteur.play();
    setEtape('verif');
    minuteur.current = setInterval(() => {
      const c = lecteur.currentTime || 0;
      if (c >= fin || (lecteur.duration > 0 && c >= lecteur.duration - 0.25)) arreter();
    }, 150);
  }
  function resultat(ok: boolean) {
    arreter();
    if (ok && nomme) p.ajouterPoint(chanteur, 2);
    setReussi(ok);
    setEtape('resultat');
  }

  if (phase === 'charge') return <Chargement msg={`On cherche la chanson de ${chanteur}…`} />;
  if (phase === 'echec' || !piste) return <Echec reessayer={charger} quitter={p.quitter} />;

  if (etape === 'ecoute') {
    return (
      <Cadre pied={<Consigne>La musique va s'arrêter toute seule.</Consigne>}>
        <Puce texte="Écoute bien…" couleur={p.jeu.couleur} />
        <CarteChanson t={piste} />
        <Disque emoji="🎵" tourne />
        <Barre part={part} couleur={p.jeu.couleur} />
      </Cadre>
    );
  }

  if (etape === 'chante') {
    return (
      <Cadre pied={<>
        <Bouton titre="▶️ Vérifier (la musique reprend)" couleur={p.jeu.couleur} onPress={verifier} style={{ flex: 0 }} />
        <Bouton titre="Pas de paroles à cet endroit → couper ailleurs" variante="fantome" petit onPress={() => { nouvelleCoupe(); ecouter(); }} style={{ flex: 0 }} />
      </>}>
        <Bandeau emoji="🎤" libelle="À toi de chanter" nom={chanteur} bord={bord} />
        <Disque emoji="🤫" />
        <Question petit>Continue les paroles !</Question>
        <Consigne>Une ou deux phrases, sans la musique. Puis on vérifie.</Consigne>
      </Cadre>
    );
  }

  if (etape === 'verif') {
    return (
      <Cadre pied={<>
        <Ligne>
          <Bouton titre="✅ Réussi" couleur={C.soft} onPress={() => resultat(true)} />
          <Bouton titre="❌ Raté" couleur={C.trash} onPress={() => resultat(false)} />
        </Ligne>
        <Bouton titre="🔁 Réécouter ce passage" variante="fantome" petit onPress={verifier} style={{ flex: 0 }} />
      </>}>
        <Puce texte="Vérification" couleur={p.jeu.couleur} />
        <CarteChanson t={piste} />
        <Disque emoji="🎵" tourne />
        <Consigne>C'étaient bien ces paroles-là ?</Consigne>
        <Credit texte={`Extrait fourni par ${piste.src}`} />
      </Cadre>
    );
  }

  if (etape === 'resultat') {
    return (
      <Cadre pied={<>
        <Bouton titre="Chanson suivante →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
        <Quitter fn={p.quitter} />
      </>}>
        <Puce texte={reussi ? 'Bravo !' : 'Raté…'} couleur={p.jeu.couleur} />
        <CarteChanson t={piste} />
        {nomme ? <Consigne>{reussi ? `${chanteur} marque 2 points.` : 'Pas de point cette fois.'}</Consigne> : null}
        <Tableau scores={p.scores} />
      </Cadre>
    );
  }

  return (
    <Cadre pied={<>
      <Bouton titre="▶️ Lancer la musique" couleur={p.jeu.couleur} onPress={ecouter} style={{ flex: 0 }} />
      <Lien titre="Je ne connais pas cette chanson → une autre" onPress={charger} />
    </>}>
      <Bandeau emoji="🎤" libelle="Au micro" nom={chanteur} bord={bord} />
      <CarteChanson t={piste} />
      <Consigne>{`La musique va s'arrêter d'un coup. ${chanteur} doit continuer à chanter les paroles, seul·e, sans musique. Ensuite, on relance pour vérifier.`}</Consigne>
    </Cadre>
  );
}

const CATS: [string, string][] = [['fr', '🇫🇷 Françaises'], ['intl', '🌍 Internationales'], ['recent', '🆕 Récentes'], ['mix', '🎲 Mélange']];

const module: ModuleJeu = {
  Composant: Paroles,
  sansProgression: true,
  fraicheur: () => null,
  options: [{
    cle: 'cat', titre: 'Choisis tes chansons', defaut: 'mix',
    choix: CATS.map(([id, titre]) => ({ id, titre, sous: `${chansons(id).length} chansons` })),
  }],
  preparer: async (o) => {
    const cat = o.opts.cat || 'mix';
    const pool = chansons(cat);
    return { pioche: await fraichesDabord(`par_${cat}`, melanger(pool), pool.length), extra: { curseur: { n: 0 } } };
  },
};
export default module;
