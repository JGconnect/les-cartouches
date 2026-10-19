// Qui me connaît ? : la vedette répond en secret, les autres devinent (renderConnait du site).
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { Bouton, Consigne, Lien, Ligne, Puce, Question, Reponse } from '@/components/ui';
import { jeu as trouverJeu, L } from '@/lib/contenu';
import { fraichesDabord, melanger } from '@/lib/cartes';
import { C } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

import { avecTheme } from '../moteur';
import type { ModuleJeu, Options, PropsCarte } from '../types';
import { Cadre, deNom, PaveN, st } from './_commun-a';

function Connait(p: PropsCarte) {
  const nommes = p.joueurs.length >= 2;
  const vedette = nommes ? p.tour : 'la vedette';
  const deV = nommes ? deNom(vedette) : 'de la vedette';
  const q = String(p.carte).split('|');
  const ab = q[0] === 'ab';
  const [etape, setEtape] = useState<1 | 2 | 3>(1);
  const [secret, setSecret] = useState<string | null>(null);
  const [saisie, setSaisie] = useState('');

  // {de} → « de Léa », {v} → Léa en gras ; majuscule en tête de phrase.
  const brut = (q[1] || '').replace(/\{de\}/g, deV);
  const morceaux = brut.split('{v}');
  const maj = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const enonce = (
    <Question>
      {morceaux.map((m, i) => (
        <Text key={i}>
          {m}
          {i < morceaux.length - 1 ? <Text style={{ color: p.jeu.couleur }}>{i === 0 && m === '' ? maj(vedette) : vedette}</Text> : null}
        </Text>
      ))}
    </Question>
  );

  const valider = (v: string | null) => { vibrer.moyen(); setSecret(v); setEtape(2); };

  if (etape === 1) {
    return (
      <Cadre pied={<Lien titre="Terminer la partie" onPress={p.quitter} />}>
        <Puce texte={`💞 Question pour ${vedette}`} couleur={p.jeu.couleur} />
        {enonce}
        <Consigne>📱 Donne le téléphone à <Text style={st.gras}>{vedette}</Text>. Les autres ne regardent pas !</Consigne>
        {ab ? (
          <Ligne>
            <Bouton titre={q[2]} couleur={p.jeu.couleur} onPress={() => valider(q[2])} />
            <Bouton titre={q[3]} couleur={p.jeu.couleur} onPress={() => valider(q[3])} />
          </Ligne>
        ) : (
          <>
            <TextInput
              value={saisie}
              onChangeText={setSaisie}
              maxLength={80}
              placeholder="Ta réponse secrète"
              placeholderTextColor={C.inkFaint}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => valider(saisie.trim() || null)}
              style={st.champ}
            />
            <Bouton titre="🤫 Valider en secret" couleur={p.jeu.couleur} onPress={() => valider(saisie.trim() || null)} style={{ flex: 0 }} />
          </>
        )}
      </Cadre>
    );
  }

  if (etape === 2) {
    return (
      <Cadre pied={<Bouton titre={`Révéler la réponse ${deV}`} couleur={p.jeu.couleur} onPress={() => { vibrer.moyen(); setEtape(3); }} style={{ flex: 0 }} />}>
        <Puce texte="💞 Réponse enregistrée" couleur={p.jeu.couleur} />
        {enonce}
        {ab ? (
          <>
            <Ligne>
              <Reponse titre={`☝️ ${q[2]}`} couleur={p.jeu.couleur} />
              <Reponse titre={`✌️ ${q[3]}`} couleur={p.jeu.couleur} />
            </Ligne>
            <Consigne>Repasse le téléphone. À trois, tout le monde (sauf {vedette}) lève <Text style={st.gras}>1 doigt</Text> ou <Text style={st.gras}>2 doigts</Text> !</Consigne>
          </>
        ) : (
          <Consigne>Repasse le téléphone. Chacun (sauf {vedette}) donne sa réponse à voix haute, ou l'écrit avant de révéler.</Consigne>
        )}
      </Cadre>
    );
  }

  return (
    <Cadre pied={<>
      <Bouton titre="Suivante →" couleur={p.jeu.couleur} onPress={p.suivant} style={{ flex: 0 }} />
      <Lien titre="Terminer la partie" onPress={p.quitter} />
    </>}>
      <Puce texte={`💞 La réponse ${deV}`} couleur={p.jeu.couleur} />
      {enonce}
      <Reponse titre={secret || '🤔 Réponse gardée en tête'} texte={secret ? undefined : `${vedette} la dit maintenant à voix haute.`} etat="ok" />
      <PaveN
        joueurs={nommes ? p.joueurs.filter((x) => x !== vedette) : []}
        scores={p.scores}
        ajouterPoint={p.ajouterPoint}
        libelle={`Qui avait bon ? Touche pour +1${nommes ? ` (pas ${vedette})` : ''}`}
      />
    </Cadre>
  );
}

const module: ModuleJeu = {
  Composant: Connait,
  async preparer(o: Options) {
    const j = trouverJeu('connait')!;
    const tout = melanger(L.CONNAIT as string[]);
    let pioche: unknown[] = await fraichesDabord('connait', tout, Math.min(j.partie || 15, tout.length));
    pioche = avecTheme(j, pioche, o);
    return { pioche };
  },
  fraicheur: () => 'connait',
};

export default module;
