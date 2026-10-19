import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import { Accueil } from '@/components/accueil';
import { useReglages } from '@/lib/reglages';
import { demarrerSuivi } from '@/lib/session';

export default function Onglet() {
  const { pret, bienvenue, joueurs } = useReglages();
  const vu = useRef(false);
  useEffect(() => { demarrerSuivi(); }, []);
  // Premier lancement : l'écran de bienvenue (comme le site : seulement si aucun prénom n'est encore enregistré).
  useEffect(() => {
    if (!pret || vu.current) return;
    vu.current = true;
    if (!bienvenue && !joueurs.length) router.push('/bienvenue');
  }, [pret, bienvenue, joueurs.length]);
  return <Accueil onglet="tous" />;
}
