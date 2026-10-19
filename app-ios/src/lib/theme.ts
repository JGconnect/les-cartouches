// Couleurs, polices et formes de Jozzo : les mêmes que l'appli web (site/index.html, :root).

export const C = {
  bg: '#181022',
  surface: '#291a3a',
  surface2: '#33224a',
  ink: '#f4ecff',
  inkSoft: '#c3b3d8',
  inkFaint: '#8b7aa5',
  line: '#3d2b54',
  accent: '#ff4d8d',
  oui: '#f5b700',
  ouiInk: '#241a00',
  non: '#7c6cff',
  soft: '#3ddc97',
  epice: '#f5b700',
  trash: '#ff4d6d',
  danger: '#ff4d6d',
} as const;

// Noms des polices chargées dans app/_layout.tsx (@expo-google-fonts).
export const F = {
  titre: 'BricolageGrotesque_800ExtraBold',
  titreGras: 'BricolageGrotesque_700Bold',
  titreDemi: 'BricolageGrotesque_600SemiBold',
  texte: 'InstrumentSans_400Regular',
  texteMoyen: 'InstrumentSans_500Medium',
  texteDemi: 'InstrumentSans_600SemiBold',
} as const;

export const R = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

/** Mélange une couleur avec le fond (équivalent de color-mix du site). */
export function melange(hex: string, part: number, fond: string = C.surface2): string {
  const a = parseInt(hex.slice(1), 16), b = parseInt(fond.slice(1), 16);
  const m = (s: number) => Math.round(((a >> s) & 255) * part + ((b >> s) & 255) * (1 - part));
  return '#' + ((m(16) << 16) | (m(8) << 8) | m(0)).toString(16).padStart(6, '0');
}
