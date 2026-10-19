// Accueil d'un onglet : titre, réglages, « Surprends-moi », favoris, puis les jeux en tuiles.
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { icone, jeuxVisibles, t, THEMES, TOP, type Jeu, type Onglet } from '@/lib/contenu';
import { useReglages } from '@/lib/reglages';
import { C, F, melange, R } from '@/lib/theme';
import { vibrer } from '@/lib/vibrer';

const ENTETES: Record<Onglet, string> = {
  tous: '',
  soiree: 'Pénalités, vérités et mauvaise foi',
  trajet: 'Assis, sans bouger, un téléphone pour tout le monde',
  famille: 'Pour tous les âges, sans rien de gênant',
  plus: '',
};

function titreDuMoment(): string {
  const h = new Date().getHours();
  return h >= 18 || h < 4 ? 'Ce soir, on joue à quoi ?' : 'On joue à quoi ?';
}

export function Tuile({ jeu, large }: { jeu: Jeu; large?: boolean }) {
  const { favoris, basculerFavori, mode } = useReglages();
  const fav = favoris.includes(jeu.id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={jeu.nom}
      onPress={() => { vibrer.leger(); router.push({ pathname: '/jeu/[id]', params: { id: jeu.id } }); }}
      style={({ pressed }) => [
        styles.tuile,
        large && styles.tuileLarge,
        { backgroundColor: melange(jeu.couleur, 0.16, C.surface), borderColor: melange(jeu.couleur, 0.35, C.line) },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[styles.emojiBoite, { backgroundColor: melange(jeu.couleur, 0.28) }]}>
        <Text style={styles.emoji}>{jeu.emoji}</Text>
      </View>
      <Text style={styles.nom} numberOfLines={2}>{jeu.nom}</Text>
      <Text style={styles.accroche} numberOfLines={3}>{t(jeu.accroche, mode)}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        hitSlop={10}
        onPress={() => { vibrer.choix(); basculerFavori(jeu.id); }}
        style={styles.etoile}
      >
        <Text style={[styles.etoileTxt, fav && { color: '#ffd23f' }]}>{fav ? '★' : '☆'}</Text>
      </Pressable>
    </Pressable>
  );
}

function Section({ titre, sous, jeux, rangee }: { titre: string; sous?: string; jeux: Jeu[]; rangee?: boolean }) {
  if (!jeux.length) return null;
  return (
    <View style={{ marginTop: 26 }}>
      <Text style={styles.sectionTitre}>{titre}</Text>
      {sous ? <Text style={styles.sectionSous}>{sous}</Text> : null}
      {rangee ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 18, paddingTop: 12 }} style={{ marginHorizontal: -18 }}>
          {jeux.map((j) => <Tuile key={j.id} jeu={j} large />)}
        </ScrollView>
      ) : (
        <View style={styles.grille}>{jeux.map((j) => <Tuile key={j.id} jeu={j} />)}</View>
      )}
    </View>
  );
}

export function Accueil({ onglet }: { onglet: Onglet }) {
  const insets = useSafeAreaInsets();
  const { joueurs, mode, theme, favoris } = useReglages();
  const jeux = jeuxVisibles(onglet, mode).filter((j) => mode !== 'famille' || j.famille !== 'hot');
  const favs = favoris.map((id) => jeux.find((j) => j.id === id)).filter(Boolean) as Jeu[];
  const top = onglet === 'tous' && !favs.length ? TOP.map((id) => jeux.find((j) => j.id === id)).filter(Boolean) as Jeu[] : [];
  const reste = jeux.filter((j) => !top.includes(j));
  const resume = [
    joueurs.length ? joueurs.slice(0, 3).join(', ') + (joueurs.length > 3 ? '…' : '') : 'Sans prénoms',
    icone(mode) + ' ' + (mode === 'alcool' ? 'Gorgées' : mode === 'famille' ? 'Famille' : 'Gages'),
    theme && THEMES[theme] ? THEMES[theme].ico + ' ' + THEMES[theme].lbl.replace(/^\S+\s/, '') : '',
  ].filter(Boolean).join(' · ');

  function surprise() {
    if (!jeux.length) return;
    vibrer.moyen();
    const j = jeux[Math.floor(Math.random() * jeux.length)];
    router.push({ pathname: '/jeu/[id]', params: { id: j.id } });
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 18, paddingBottom: 120 }}>
      <View style={styles.barre}>
        <Text style={styles.marque}>JO<Text style={{ color: C.accent }}>ZZ</Text>O</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Réglages" onPress={() => router.push('/reglages')} hitSlop={10} style={styles.engrenage}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </Pressable>
      </View>
      <Text style={styles.grandTitre}>{onglet === 'tous' ? titreDuMoment() : onglet === 'soiree' ? '🍻 Soirée' : onglet === 'trajet' ? '🚌 Trajet' : '👨‍👩‍👧 En famille'}</Text>
      {ENTETES[onglet] ? <Text style={styles.sousTitre}>{ENTETES[onglet]}</Text> : null}

      <Pressable onPress={() => router.push('/reglages')} style={styles.resume}>
        <Text style={styles.resumeTxt} numberOfLines={1}>⚙️  {resume}</Text>
        <Text style={styles.resumeLien}>Modifier ›</Text>
      </Pressable>

      <Pressable onPress={surprise} style={({ pressed }) => [styles.surprise, pressed && { transform: [{ scale: 0.98 }] }]}>
        <Text style={{ fontSize: 30 }}>🎲</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.surpriseTitre}>Surprends-moi</Text>
          <Text style={styles.surpriseSous}>Un jeu au hasard</Text>
        </View>
        <Text style={styles.surpriseFleche}>›</Text>
      </Pressable>

      <Section titre="⭐ Tes favoris" jeux={favs} rangee />
      <Section titre="🏆 Les incontournables" sous="Pour bien commencer · touche ☆ pour épingler tes jeux préférés ici" jeux={top} rangee />
      {onglet === 'tous' || onglet === 'soiree' ? (
        <>
          <Section titre={mode === 'famille' ? "🎉 Jeux d'ambiance" : '🔥 Soirée'} sous={mode === 'famille' ? 'Pour rire ensemble' : 'Que la soirée commence'} jeux={reste.filter((j) => j.famille === 'soiree')} />
          <Section titre="🌶️ Hot" sous="18+ · trois niveaux, du flirt au brûlant" jeux={reste.filter((j) => j.famille === 'hot')} />
          <Section titre="🧠 Quiz & devinettes" sous="Jeux à points, sans pénalité" jeux={reste.filter((j) => j.famille === 'quiz')} />
        </>
      ) : (
        <Section titre="Les jeux" jeux={reste} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  marque: { color: C.ink, fontFamily: F.titre, fontSize: 16, letterSpacing: 2.5 },
  engrenage: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  grandTitre: { color: C.ink, fontFamily: F.titre, fontSize: 34, lineHeight: 38, letterSpacing: -0.6 },
  sousTitre: { color: C.inkSoft, fontFamily: F.texte, fontSize: 15, marginTop: 6 },
  resume: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  resumeTxt: { flex: 1, color: C.inkSoft, fontFamily: F.texteMoyen, fontSize: 14.5 },
  resumeLien: { color: C.accent, fontFamily: F.texteDemi, fontSize: 14 },
  surprise: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: R.lg, backgroundColor: '#5a2a6e', borderWidth: 1, borderColor: '#7a3f8e' },
  surpriseTitre: { color: C.ink, fontFamily: F.titre, fontSize: 19 },
  surpriseSous: { color: C.inkSoft, fontFamily: F.texte, fontSize: 13.5, marginTop: 2 },
  surpriseFleche: { color: C.inkSoft, fontSize: 28, fontFamily: F.titreGras },
  sectionTitre: { color: C.ink, fontFamily: F.titre, fontSize: 22 },
  sectionSous: { color: C.inkFaint, fontFamily: F.texte, fontSize: 13.5, marginTop: 3 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  tuile: { width: '48%', flexGrow: 1, maxWidth: '48.5%', minHeight: 176, borderRadius: R.lg, borderWidth: 1, padding: 14, gap: 6 },
  tuileLarge: { width: 168, maxWidth: 168, flexGrow: 0 },
  emojiBoite: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emoji: { fontSize: 24 },
  nom: { color: C.ink, fontFamily: F.titre, fontSize: 17, lineHeight: 20 },
  accroche: { color: C.inkSoft, fontFamily: F.texte, fontSize: 13, lineHeight: 17 },
  etoile: { position: 'absolute', top: 10, right: 12 },
  etoileTxt: { color: C.inkFaint, fontSize: 20 },
});
