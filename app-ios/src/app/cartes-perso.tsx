// « Vos cartes perso » : vos blagues internes et anecdotes glissées dans les jeux,
// rangées sur ce téléphone ou partagées avec la bande (code de groupe, comme sur le site).
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bouton } from '@/components/ui';
import {
  ajouterCarteBande, cacheBande, cartesBande, chargerBande, codeBande, codeValide, formatCode,
  normCode, nouveauCode, quitterBande, rejoindreBande, supprimerCarteBande, synchroniserBande,
} from '@/lib/bande';
import { jeu as trouverJeu } from '@/lib/contenu';
import { MINE_GAMES, MINE_MAX, mineAll, mineLabel, mineMake, mineSave, type Perso } from '@/lib/perso';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

const SITE = 'https://myjozzo.fr/';

/** Base64 « URL » d'un texte UTF-8 (b64e du site), sans dépendre de btoa. */
function b64e(txt: string): string {
  const octets: number[] = [];
  for (const ch of txt) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) octets.push(c);
    else if (c < 0x800) octets.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) octets.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else { octets.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
  }
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let s = '';
  for (let i = 0; i < octets.length; i += 3) {
    const n = (octets[i] << 16) | ((octets[i + 1] ?? 0) << 8) | (octets[i + 2] ?? 0);
    s += A[(n >> 18) & 63] + A[(n >> 12) & 63];
    if (i + 1 < octets.length) s += A[(n >> 6) & 63];
    if (i + 2 < octets.length) s += A[n & 63];
  }
  return s;
}

export default function CartesPerso() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ jeu?: string }>();
  const depuisJeu = params.jeu && MINE_GAMES[params.jeu] ? params.jeu : null;
  const [sel, setSel] = useState<string>(depuisJeu || 'vraifaux');
  const [perso, setPerso] = useState<Perso | null>(null);
  const [cible, setCible] = useState<'local' | 'group'>('local');
  const [champs, setChamps] = useState<string[]>(['', '', '']);
  const [vf, setVf] = useState<'V' | 'F'>('V');
  const [msg, setMsg] = useState('');
  const [, setTic] = useState(0);
  const rafraichir = useCallback(() => setTic((x) => x + 1), []);

  useEffect(() => {
    let vivant = true;
    (async () => {
      await chargerBande();
      const m = await mineAll();
      if (!vivant) return;
      setPerso(m);
      if (codeBande()) { await synchroniserBande(); if (vivant) rafraichir(); }
    })();
    return () => { vivant = false; };
  }, [rafraichir]);

  if (!perso) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  const gc = codeBande();
  const enBande = !!gc && cible === 'group';
  const cfg = MINE_GAMES[sel];
  const lignesBande = gc ? cacheBande().cards.filter((c) => c.jeu === sel) : [];
  const liste = enBande ? lignesBande.map((c) => c.carte) : perso[sel];
  const compte = (k: string) => (enBande ? cartesBande(k).length : perso[k].length);
  const total = Object.keys(perso).reduce((a, k) => a + perso[k].length, 0);
  const nomJeu = (k: string) => { const g = trouverJeu(k); return g ? g.emoji + ' ' + g.nom : k; };
  const couleur = trouverJeu(sel)?.couleur || C.accent;

  const choisirJeu = (k: string) => { vibrer.choix(); setSel(k); setChamps(['', '', '']); setVf('V'); setMsg(''); };

  const ajouter = async () => {
    const carte = mineMake(sel, [champs[0], champs[1], champs[2], vf]);
    if (!carte) { vibrer.alerte(); setMsg(sel === 'liste' ? 'Il faut un titre et au moins 3 réponses.' : 'Il manque un champ.'); return; }
    if (enBande) {
      setMsg('Envoi à la bande…');
      try {
        await ajouterCarteBande(sel, carte);
        vibrer.succes(); setChamps(['', '', '']); setMsg('✓ Carte ajoutée pour toute la bande'); rafraichir();
      } catch {
        setMsg("⚠️ Pas de réseau : la carte n'a pas pu être envoyée. Réessaie, ou range-la sur ce téléphone.");
      }
      return;
    }
    const mm = { ...perso, [sel]: perso[sel].slice() };
    if (mm[sel].indexOf(carte) >= 0) { setMsg('Cette carte existe déjà.'); return; }
    if (mm[sel].length >= MINE_MAX) { setMsg('Maximum atteint pour ce jeu.'); return; }
    mm[sel].push(carte);
    mineSave(mm); setPerso(mm); vibrer.succes(); setChamps(['', '', '']); setMsg('✓ Carte ajoutée');
  };

  const supprimer = async (i: number) => {
    vibrer.leger();
    if (enBande) {
      const row = lignesBande[i];
      if (!row) return;
      try { await supprimerCarteBande(row.id); rafraichir(); } catch { setMsg("⚠️ Pas de réseau : impossible de supprimer pour l'instant."); }
      return;
    }
    const mm = { ...perso, [sel]: perso[sel].filter((_, k) => k !== i) };
    mineSave(mm); setPerso(mm);
  };

  const partager = () => {
    const o: Perso = {};
    Object.keys(perso).forEach((k) => { if (perso[k].length) o[k] = perso[k]; });
    const url = SITE + '#cartes=' + b64e(JSON.stringify(o));
    Share.share({ message: 'Nos cartes perso pour Jozzo 🎉 Ouvre ce lien pour les ajouter : ' + url }).catch(() => {});
  };

  // Champs : une ligne courte ou un texte sur deux lignes, comme sur le site.
  const court = (i: number) => (i === 1 && sel !== 'vraifaux' && sel !== 'quiadit' && sel !== 'dilemme') || (sel === 'quiadit' && i > 0) || (sel === 'vraifaux' && i === 1);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40, paddingHorizontal: 18, gap: 14 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.retour}>‹ {depuisJeu ? 'Retour au jeu' : 'Retour'}</Text></Pressable>
        <Text style={styles.kicker}>VOS CARTES PERSO</Text>
        <Text style={styles.titre}>✏️ À vous de jouer</Text>
        <Text style={styles.sous}>Vos blagues internes, vos anecdotes, vos répliques cultes : elles se glissent parmi les cartes du jeu.</Text>

        <View style={styles.puces}>
          {Object.keys(MINE_GAMES).map((k) => {
            const on = k === sel;
            const n = compte(k);
            return (
              <Pressable key={k} onPress={() => choisirJeu(k)} style={[styles.puce, on && { borderColor: couleur, backgroundColor: melange(couleur, 0.22, C.surface) }]}>
                <Text style={[styles.puceTxt, on && { color: C.ink }]}>{nomJeu(k)}</Text>
                {n ? <View style={styles.badge}><Text style={styles.badgeTxt}>{n}</Text></View> : null}
              </Pressable>
            );
          })}
        </View>

        {gc ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.lbl}>OÙ RANGER TES CARTES ?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['local', '📱 Ce téléphone', 'rien que pour toi'], ['group', '👥 La bande', 'sur tous les téléphones']] as const).map(([id, t, s]) => (
                <Pressable key={id} onPress={() => { vibrer.choix(); setCible(id); setMsg(''); }} style={[styles.choix, cible === id && { borderColor: couleur, backgroundColor: melange(couleur, 0.22, C.surface) }]}>
                  <Text style={[styles.choixTitre, cible === id && { color: C.ink }]}>{t}</Text>
                  <Text style={styles.choixSous}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.panneau}>
          <Text style={styles.plbl}>{cfg.lbl}</Text>
          {cfg.ph.map((ph, i) => (
            <TextInput
              key={sel + i}
              value={champs[i]}
              onChangeText={(v) => setChamps((c) => c.map((x, k) => (k === i ? v : x)))}
              placeholder={ph}
              placeholderTextColor={C.inkFaint}
              maxLength={sel === 'liste' && i === 1 ? 400 : 160}
              multiline={!court(i)}
              style={[styles.champ, !court(i) && { minHeight: 64, textAlignVertical: 'top' }]}
            />
          ))}
          {cfg.vf ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['V', "✅ C'est vrai"], ['F', "❌ C'est faux"]] as const).map(([v, t]) => (
                <Pressable key={v} onPress={() => { vibrer.choix(); setVf(v); }} style={[styles.choix, vf === v && { borderColor: couleur, backgroundColor: melange(couleur, 0.22, C.surface) }]}>
                  <Text style={[styles.choixTitre, vf === v && { color: C.ink }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {cfg.hint ? <Text style={styles.hint}>{cfg.hint}</Text> : null}
          <Bouton titre="Ajouter la carte" onPress={ajouter} petit couleur={couleur} style={{ flex: 0 }} />
          {msg ? <Text style={styles.hint}>{msg}</Text> : null}
        </View>

        {liste.length ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.section}>{liste.length} carte{liste.length > 1 ? 's' : ''} dans {trouverJeu(sel)?.nom}</Text>
            {liste.map((x, i) => ({ x, i })).reverse().map(({ x, i }) => {
              const l = mineLabel(sel, x);
              return (
                <View key={i + x} style={styles.item}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.itemTitre}>{l.titre}</Text>
                    {l.sous ? <Text style={styles.itemSous}>{l.sous}</Text> : null}
                  </View>
                  <Pressable onPress={() => supprimer(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Supprimer" style={styles.croix}>
                    <Text style={styles.croixTxt}>×</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        <PanneauBande onChange={(enGroupe) => { if (enGroupe) setCible('group'); else setCible('local'); rafraichir(); }} />

        <View style={styles.panneau}>
          <Text style={styles.plbl}>📤 ENVOYER PAR LIEN</Text>
          <Text style={styles.hint}>
            {total
              ? `Envoie un lien : en l'ouvrant, tes amis récupèrent tes ${total} carte${total > 1 ? 's' : ''} rangée${total > 1 ? 's' : ''} sur ce téléphone.`
              : "Les cartes rangées sur ce téléphone peuvent aussi s'envoyer par lien."}
          </Text>
          {total ? <Bouton titre="Partager mes cartes" variante="fantome" onPress={partager} petit style={{ flex: 0 }} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PanneauBande({ onChange }: { onChange: (enGroupe: boolean) => void }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [arme, setArme] = useState(false);
  const gc = codeBande();

  const rejoindre = async (c: string) => {
    setMsg('Connexion…');
    const ok = await rejoindreBande(c);
    setMsg(ok ? '' : '⚠️ Pas de réseau : les cartes de la bande arriveront à la prochaine connexion.');
    onChange(true);
  };

  if (!gc) {
    return (
      <View style={styles.panneau}>
        <Text style={styles.plbl}>👥 CARTES DE LA BANDE</Text>
        <Text style={styles.hint}>Créez un groupe : chacun ajoute ses cartes de son côté et elles arrivent sur tous les téléphones de la bande (il faut internet pour les synchroniser).</Text>
        <Bouton titre="Créer un groupe" onPress={() => rejoindre(nouveauCode())} petit style={{ flex: 0 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Ou entre un code reçu"
            placeholderTextColor={C.inkFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            style={[styles.champ, { flex: 1 }]}
          />
          <Bouton
            titre="Rejoindre"
            variante="fantome"
            petit
            style={{ flex: 0, paddingHorizontal: 16 }}
            onPress={() => {
              const c = normCode(code);
              if (!codeValide(c)) { setMsg('Code incorrect : il fait 10 caractères (ex. K7QM-2XPA-9R).'); return; }
              rejoindre(c);
            }}
          />
        </View>
        {msg ? <Text style={styles.hint}>{msg}</Text> : null}
      </View>
    );
  }

  const c = cacheBande();
  const heure = c.at ? new Date(c.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <View style={styles.panneau}>
      <Text style={styles.plbl}>👥 VOTRE BANDE</Text>
      <Text style={styles.code}>{formatCode(gc)}</Text>
      <Text style={styles.hint}>
        {c.cards.length} carte{c.cards.length > 1 ? 's' : ''} partagée{c.cards.length > 1 ? 's' : ''}{heure ? ' · synchronisé ' + heure : ''}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Bouton
          titre="Inviter la bande"
          petit
          onPress={() => Share.share({ message: `Rejoins notre bande sur Jozzo 🎉 (code ${formatCode(gc)}) : ${SITE}#groupe=${gc}` }).catch(() => {})}
        />
        <Bouton
          titre={arme ? 'Confirmer' : 'Quitter'}
          variante="fantome"
          petit
          onPress={() => {
            if (!arme) { setArme(true); setMsg('Les cartes de la bande ne seront plus utilisées sur ce téléphone (elles restent pour les autres). Garde le code si tu veux revenir.'); return; }
            quitterBande(); setArme(false); setMsg(''); onChange(false);
          }}
        />
      </View>
      {msg ? <Text style={styles.hint}>{msg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  retour: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 15 },
  kicker: { color: C.accent, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 2, marginTop: 6 },
  titre: { color: C.ink, fontFamily: F.titre, fontSize: 34, lineHeight: 38 },
  sous: { color: C.inkSoft, fontFamily: F.texte, fontSize: 15.5, lineHeight: 22 },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  puce: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: R.pill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  puceTxt: { color: C.inkSoft, fontFamily: F.texteDemi, fontSize: 14 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#fff', fontFamily: F.titreGras, fontSize: 11.5 },
  lbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 2 },
  choix: { flex: 1, padding: 12, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 3, alignItems: 'center' },
  choixTitre: { color: C.inkSoft, fontFamily: F.titreGras, fontSize: 14.5, textAlign: 'center' },
  choixSous: { color: C.inkFaint, fontFamily: F.texte, fontSize: 12, textAlign: 'center' },
  panneau: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 },
  plbl: { color: C.inkFaint, fontFamily: F.texteDemi, fontSize: 12, letterSpacing: 1.6 },
  champ: { backgroundColor: C.bg, color: C.ink, fontFamily: F.texte, fontSize: 16, borderRadius: R.md, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingVertical: 12 },
  hint: { color: C.inkFaint, fontFamily: F.texte, fontSize: 13.5, lineHeight: 19 },
  section: { color: C.ink, fontFamily: F.titreGras, fontSize: 18, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: R.md, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingLeft: 14, paddingRight: 8 },
  itemTitre: { color: C.ink, fontFamily: F.texteMoyen, fontSize: 15, lineHeight: 20 },
  itemSous: { color: C.inkFaint, fontFamily: F.texte, fontSize: 13, lineHeight: 18 },
  croix: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  croixTxt: { color: C.inkFaint, fontSize: 24, lineHeight: 26 },
  code: { color: C.ink, fontFamily: F.titre, fontSize: 24, letterSpacing: 1.5 },
});
