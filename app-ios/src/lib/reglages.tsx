// Réglages gardés sur le téléphone : prénoms, pénalités, thème, favoris… (mêmes clés que le site).
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Mode, NiveauHot } from './contenu';
import { ecrire, lire } from './stockage';

type Reglages = {
  pret: boolean;
  joueurs: string[];
  mode: Mode;
  theme: string;
  favoris: string[];
  adulte: boolean;
  niveauHot: NiveauHot;
  bienvenue: boolean;
  setJoueurs: (j: string[]) => void;
  setMode: (m: Mode) => void;
  setTheme: (t: string) => void;
  basculerFavori: (id: string) => void;
  setAdulte: (v: boolean) => void;
  setNiveauHot: (n: NiveauHot) => void;
  finirBienvenue: () => void;
};

const Ctx = createContext<Reglages | null>(null);

export function ReglagesProvider({ children }: { children: ReactNode }) {
  const [pret, setPret] = useState(false);
  const [joueurs, setJ] = useState<string[]>([]);
  const [mode, setM] = useState<Mode>('gages');
  const [theme, setT] = useState('');
  const [favoris, setF] = useState<string[]>([]);
  const [adulte, setA] = useState(false);
  const [niveauHot, setN] = useState<NiveauHot>('chaud');
  const [bienvenue, setB] = useState(false);

  useEffect(() => {
    (async () => {
      setJ(await lire<string[]>('cart_players', []));
      const m = await lire<string>('cart_mode', 'gages');
      setM(m === 'alcool' || m === 'famille' ? m : 'gages');
      setT(await lire<string>('cart_theme', ''));
      setF(await lire<string[]>('cart_favs', []));
      setA((await lire<string>('cart_adult', '')) === '1');
      const n = await lire<string>('cart_hot', 'chaud');
      setN(n === 'flirt' || n === 'brulant' ? n : 'chaud');
      setB((await lire<string>('cart_welcome', '')) === '1');
      setPret(true);
    })();
  }, []);

  const valeur = useMemo<Reglages>(
    () => ({
      pret, joueurs, mode, theme, favoris, adulte, niveauHot, bienvenue,
      setJoueurs: (j) => { setJ(j); ecrire('cart_players', j); },
      setMode: (m) => { setM(m); ecrire('cart_mode', m); },
      setTheme: (t) => { setT(t); ecrire('cart_theme', t); },
      basculerFavori: (id) => {
        setF((f) => {
          const n = f.includes(id) ? f.filter((x) => x !== id) : [id, ...f];
          ecrire('cart_favs', n);
          return n;
        });
      },
      setAdulte: (v) => { setA(v); ecrire('cart_adult', v ? '1' : ''); },
      setNiveauHot: (n) => { setN(n); ecrire('cart_hot', n); },
      finirBienvenue: () => { setB(true); ecrire('cart_welcome', '1'); },
    }),
    [pret, joueurs, mode, theme, favoris, adulte, niveauHot, bienvenue],
  );
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useReglages(): Reglages {
  const v = useContext(Ctx);
  if (!v) throw new Error('useReglages hors du ReglagesProvider');
  return v;
}
