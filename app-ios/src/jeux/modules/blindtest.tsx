// Blind test : un extrait officiel de 30 s, le premier qui reconnaît crie le titre (et l'artiste ou l'œuvre).
import { useEffect, useRef, useState } from 'react';

import { Bouton, Consigne, Lien, Puce } from '@/components/ui';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { C } from '@/lib/theme';

import { PavePoints } from '../cartes';
import type { ModuleJeu, PropsCarte } from '../types';
import { Barre, CarteChanson, Cadre, Chargement, Credit, Disque, Echec, morceauxBlindTest, Quitter, useExtrait } from './audio';

function BlindTest(p: PropsCarte) {
  const cat = p.opts.cat || 'mix';
  const x = useExtrait(p, `bt_${cat}`);
  const { lecteur, phase, setPhase, piste } = x;
  const [part, setPart] = useState(0);
  const [enPause, setEnPause] = useState(true);
  const minuteur = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => { if (minuteur.current) { clearInterval(minuteur.current); minuteur.current = null; } try { lecteur.pause(); } catch {} setEnPause(true); };
  useEffect(() => () => { if (minuteur.current) clearInterval(minuteur.current); }, []);

  const charger = () => { stop(); x.charger(() => setPhase('pret')); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { charger(); }, []);

  function jouer() {
    lecteur.seekTo(0).catch(() => {});
    lecteur.play();
    setEnPause(false);
    setPart(0);
    setPhase('ecoute');
    if (minuteur.current) clearInterval(minuteur.current);
    minuteur.current = setInterval(() => {
      const d = lecteur.duration || 30;
      const c = lecteur.currentTime || 0;
      setPart(c / d);
      if (lecteur.duration > 0 && c >= lecteur.duration - 0.25) { stop(); setPhase('revele'); }
    }, 250);
  }

  if (phase === 'charge') return <Chargement msg="On cherche le prochain extrait…" />;
  if (phase === 'echec' || !piste) return <Echec reessayer={charger} quitter={p.quitter} />;

  if (phase === 'pret') {
    return (
      <Cadre pied={<>
        <Bouton titre="▶️ Lancer l'extrait" couleur={p.jeu.couleur} onPress={jouer} style={{ flex: 0 }} />
        <Lien titre="Passer cette chanson" onPress={charger} />
      </>}>
        <Puce texte={`Extrait ${p.idx + 1}`} couleur={p.jeu.couleur} />
        <Disque emoji="🎧" />
        <Consigne>
          {`${piste.k || '🎵 Musique'} · Monte le son. `}
          {piste.a
            ? "Dès que tu reconnais, crie le titre du film ou de la série (1 point, 2 si tu trouves aussi le compositeur ou l'interprète)."
            : "Dès que tu reconnais, crie le titre (1 point) et l'artiste (1 point de plus)."}
        </Consigne>
      </Cadre>
    );
  }

  if (phase === 'ecoute') {
    return (
      <Cadre pied={<>
        <Bouton titre="✋ Stop, on a une réponse !" couleur={C.soft} onPress={() => { stop(); setPhase('revele'); }} style={{ flex: 0 }} />
        <Bouton titre="Personne ne trouve → révéler" variante="fantome" petit onPress={() => { stop(); setPhase('revele'); }} style={{ flex: 0 }} />
      </>}>
        <Puce texte="Écoutez !" couleur={p.jeu.couleur} />
        <Disque emoji="🎧" tourne />
        <Barre part={part} couleur={p.jeu.couleur} />
        <Consigne>Quelqu'un a trouvé ? Touche « Stop ».</Consigne>
      </Cadre>
    );
  }

  return (
    <Cadre pied={<>
      <Bouton
        titre={enPause ? '🔁 Réécouter' : '⏸ Pause'}
        variante="fantome"
        petit
        onPress={() => { if (enPause) { lecteur.play(); setEnPause(false); } else { lecteur.pause(); setEnPause(true); } }}
        style={{ flex: 0 }}
      />
      <Bouton titre="Extrait suivant →" couleur={p.jeu.couleur} onPress={() => { stop(); p.suivant(); }} style={{ flex: 0 }} />
      <Quitter fn={() => { stop(); p.quitter(); }} />
    </>}>
      <Puce texte="C'était…" couleur={p.jeu.couleur} />
      <CarteChanson t={piste} />
      <PavePoints joueurs={p.joueurs} scores={p.scores} ajouterPoint={p.ajouterPoint} libelle={piste.a ? 'Qui a trouvé ? +1 le titre, +1 le bonus' : "Qui a trouvé ? +1 le titre, +1 l'artiste"} />
      <Credit texte={`Extrait fourni par ${piste.src}`} />
    </Cadre>
  );
}

const CATS: [string, string][] = [['musique', '🎵 Musique'], ['films', '🎬 Films'], ['series', '📺 Séries'], ['mix', '🎲 Mélange']];

const module: ModuleJeu = {
  Composant: BlindTest,
  sansProgression: true,
  fraicheur: () => null,
  options: [{
    cle: 'cat', titre: 'Choisis ta catégorie', defaut: 'mix',
    choix: CATS.map(([id, titre]) => ({ id, titre, sous: `${morceauxBlindTest(id).length} extraits` })),
  }],
  preparer: async (o) => {
    const cat = o.opts.cat || 'mix';
    const pool = morceauxBlindTest(cat);
    return { pioche: await fraichesDabord(`bt_${cat}`, melanger(pool), pool.length), extra: { curseur: { n: 0 } } };
  },
};
export default module;
