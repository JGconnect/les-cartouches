// La Liste : une équipe cite un maximum de réponses d'une catégorie avant la fin du chrono, l'arbitre coche.
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Bouton, Consigne, Lien, Puce, Question } from '@/components/ui';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { famOK, L } from '@/lib/contenu';
import { C, F, melange } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import type { ModuleJeu, PropsCarte } from '../types';
import { Bandeau, Cadre, Classement, Decompte, nomEquipe, parler, s, TeteChrono, useChrono } from './_outils-quiz';

type Cat = { c: string; a: string; h?: string };
type Item = { t: string; p: number; x?: boolean };

/** 10 réponses en grand (5 incontournables + tirage, dont 3 difficiles), les autres comptent en bonus. */
function construire(cat: Cat): { items: Item[]; main: number } {
  const aa = cat.a.split('|');
  const hh = cat.h ? cat.h.split('|') : [];
  const ea = aa.slice(0, 5).concat(melanger(aa.slice(5, 15)), melanger(aa.slice(15)));
  const eh = melanger(hh);
  let nh = Math.min(3, eh.length);
  const na = Math.min(10 - nh, ea.length);
  if (na + nh < 10) nh = Math.min(eh.length, 10 - na);
  const items: Item[] = ea.slice(0, na).map((t) => ({ t, p: 1 })).concat(eh.slice(0, nh).map((t) => ({ t, p: 2 })));
  items.sort((a, b) => a.t.localeCompare(b.t, 'fr'));
  const main = items.length;
  const dans = items.map((i) => i.t);
  aa.forEach((t) => { if (!dans.includes(t)) items.push({ t, p: 1, x: true }); });
  hh.forEach((t) => { if (!dans.includes(t)) items.push({ t, p: 2, x: true }); });
  return { items, main };
}

function Puce2({ it, on, manque, petit, onPress }: { it: Item; on: boolean; manque?: boolean; petit?: boolean; onPress: () => void }) {
  const coul = it.p > 1 ? C.epice : C.soft;
  return (
    <Pressable
      onPress={() => { vibrer.choix(); onPress(); }}
      style={[s.chip, petit && s.chipSm, it.p > 1 && { borderStyle: 'dashed' }, on && { backgroundColor: melange(coul, 0.3, C.surface), borderColor: coul, borderStyle: 'solid' }, manque && { opacity: 0.55, borderStyle: 'dotted' }]}
    >
      <Text style={[s.chipTxt, petit && { fontSize: 13 }, on && { color: C.ink }]}>{it.p > 1 ? '⭐ ' : ''}{it.t}</Text>
    </Pressable>
  );
}

function Liste(p: PropsCarte) {
  const nbEq = Number(p.opts.equipes || 2);
  const duree = Number(p.opts.duree || 60);
  const equipe = nomEquipe(p.idx % nbEq);
  const cat = p.carte as Cat;
  const { items, main } = useMemo(() => construire(cat), [cat]);
  const [phase, setPhase] = useState<'main' | 'pret' | 'jeu' | 'fin'>('main');
  const [got, setGot] = useState<Record<number, boolean>>({});
  const [plus, setPlus] = useState(false);
  const enregistre = useRef(false);

  const score = Object.keys(got).reduce((n, k) => n + (got[+k] ? items[+k].p : 0), 0);
  const nb = Object.keys(got).filter((k) => got[+k]).length;
  const nbMain = Object.keys(got).filter((k) => got[+k] && +k < main).length;
  const bonus = nb - nbMain;
  const trouves = `${nbMain} / ${main}${bonus ? ` · +${bonus}` : ''}`;

  const chrono = useChrono(duree, () => terminer());
  function terminer() {
    chrono.arreter();
    vibrer.alerte();
    parler('Temps écoulé !');
    setPhase('fin');
  }
  function basculer(i: number) {
    setGot((g) => {
      const n = { ...g, [i]: !g[i] };
      if (phase === 'jeu' && Object.values(n).filter(Boolean).length >= items.length) setTimeout(terminer, 600);
      return n;
    });
  }
  function valider(apres: () => void) {
    if (!enregistre.current) { enregistre.current = true; p.ajouterPoint(equipe, score); }
    apres();
  }
  function autre() {
    const toutes = (L.LISTES as Cat[]).filter((x) => famOK(x.c, p.mode));
    const libres = toutes.filter((x) => !p.pioche.includes(x));
    const pool = libres.length ? libres : toutes.filter((x) => x !== cat);
    if (!pool.length) return;
    vibrer.choix();
    p.remplacer(pool[Math.floor(Math.random() * pool.length)]);
  }

  if (phase === 'main') {
    return (
      <Cadre pied={<>
        <Bouton titre="Je suis l'arbitre → voir la catégorie" couleur={p.jeu.couleur} onPress={() => setPhase('pret')} style={{ flex: 0 }} />
        <Lien titre="Terminer la partie" onPress={p.quitter} />
      </>}>
        <Bandeau jeu={p.jeu} lbl="Au tour de" nom={equipe} />
        <Puce texte={`Manche ${p.idx + 1}`} couleur={p.jeu.couleur} />
        <Question>Passe le téléphone à l'arbitre.</Question>
        <Consigne>Une personne d'une autre équipe. Elle seule regarde l'écran et coche les bonnes réponses.</Consigne>
      </Cadre>
    );
  }
  if (phase === 'pret') {
    return (
      <Cadre pied={<>
        <Bouton titre="▶️ Top chrono" couleur={p.jeu.couleur} onPress={() => { setPhase('jeu'); chrono.lancer(); }} style={{ flex: 0 }} />
        <Lien titre="Autre catégorie" onPress={autre} />
      </>}>
        <Puce texte={`${equipe} · ${duree} secondes`} couleur={p.jeu.couleur} />
        <Question>{cat.c}</Question>
        <Consigne>
          Lis la catégorie à voix haute. Au top, {equipe} cite un maximum de réponses. Toutes les bonnes réponses comptent ({items.length} possibles) : 1 point chacune, 2 pour les ⭐ difficiles.
          {items.length > main ? ` L'écran en montre ${main} en grand pour cocher vite ; les autres s'ajoutent en bonus à la fin.` : ''}
        </Consigne>
      </Cadre>
    );
  }
  if (phase === 'jeu') {
    const bonusOn = items.map((it, i) => ({ it, i })).filter(({ i }) => i >= main && got[i]);
    return (
      <View style={{ flex: 1 }}>
        <Cadre
          haut={<TeteChrono titre={cat.c} reste={chrono.reste} total={duree} couleur={p.jeu.couleur} infos={[trouves, `${score} pt${score > 1 ? 's' : ''}`]} />}
          pied={<Bouton titre="⏹ Stop" petit couleur={p.jeu.couleur} onPress={terminer} style={{ flex: 0 }} />}
        >
          <View style={s.grille}>
            {items.slice(0, main).map((it, i) => <Puce2 key={i} it={it} on={!!got[i]} onPress={() => basculer(i)} />)}
          </View>
          {bonusOn.length ? (
            <View style={{ gap: 8 }}>
              <Text style={s.lbl}>Bonus hors des {main}</Text>
              <View style={s.grille}>{bonusOn.map(({ it, i }) => <Puce2 key={i} it={it} on petit onPress={() => basculer(i)} />)}</View>
            </View>
          ) : null}
        </Cadre>
        <Decompte n={chrono.decompte} couleur={p.jeu.couleur} />
      </View>
    );
  }

  // Vérification
  return (
    <Cadre pied={<>
      <Bouton titre={`Valider → au tour de ${nomEquipe((p.idx + 1) % nbEq)}`} couleur={p.jeu.couleur} onPress={() => valider(p.suivant)} style={{ flex: 0 }} />
      <Lien titre="Valider et terminer la partie" onPress={() => valider(p.quitter)} />
    </>}>
      <Puce texte="Temps écoulé · vérification" couleur={p.jeu.couleur} />
      <Question petit>{equipe} : {score} point{score > 1 ? 's' : ''} · {trouves}</Question>
      <Consigne>Une réponse oubliée ou mal entendue ? L'arbitre la touche pour la cocher (ou la décocher). Les réponses en pointillé n'ont pas été trouvées.</Consigne>
      <View style={s.grille}>
        {items.slice(0, main).map((it, i) => <Puce2 key={i} it={it} on={!!got[i]} manque={!got[i]} onPress={() => basculer(i)} />)}
      </View>
      {items.length > main ? (
        <View style={{ gap: 8 }}>
          <Text style={s.lbl}>Bonus hors des {main} · touche pour ajouter ou retirer</Text>
          <View style={s.grille}>
            {items.map((it, i) => (i < main || !got[i] ? null : <Puce2 key={i} it={it} on petit onPress={() => basculer(i)} />))}
          </View>
          <Pressable onPress={() => setPlus((v) => !v)} style={{ alignSelf: 'center', padding: 8 }}>
            <Text style={{ color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 14 }}>{plus ? '▾' : '➕'} Ajouter une autre bonne réponse ({items.length - main} possibles)</Text>
          </Pressable>
          {plus ? (
            <View style={s.grille}>
              {items.map((it, i) => (i < main || got[i] ? null : <Puce2 key={i} it={it} on={false} manque petit onPress={() => basculer(i)} />))}
            </View>
          ) : null}
        </View>
      ) : null}
      {Object.keys(p.scores).length ? <><Text style={s.lbl}>Classement avant cette manche</Text><Classement scores={p.scores} /></> : null}
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: Liste,
  sansProgression: true,
  fraicheur: () => 'liste',
  options: [
    { cle: 'equipes', titre: "Nombre d'équipes", defaut: '2', choix: [2, 3, 4].map((n) => ({ id: String(n), titre: `${n} équipes` })) },
    { cle: 'duree', titre: 'Chrono', defaut: '60', choix: [45, 60, 90].map((n) => ({ id: String(n), titre: `${n} s` })) },
  ],
  async preparer(o) {
    const lf = (L.LISTES as Cat[]).filter((x) => famOK(x.c, o.mode));
    return { pioche: await fraichesDabord('liste', melanger(lf), lf.length) };
  },
};
export default module;
