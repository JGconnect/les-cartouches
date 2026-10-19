// Réglages de l'appli iPhone Jozzo (générés en projet natif par EAS au moment du build).
import type { ExpoConfig } from 'expo/config';

// Identifiant du projet Expo « jozzo » (public) : créé sur expo.dev, à recopier ici.
const projectId = process.env.EAS_PROJECT_ID || '';

const config: ExpoConfig = {
  name: 'Jozzo',
  slug: 'jozzo',
  owner: 'jgconnect',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'jozzo',
  userInterfaceStyle: 'dark',
  backgroundColor: '#181022',
  ios: {
    bundleIdentifier: 'fr.myjozzo.app',
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDevelopmentRegion: 'fr',
    },
  },
  android: { package: 'fr.myjozzo.app' },
  plugins: [
    'expo-router',
    ['expo-splash-screen', { backgroundColor: '#181022', image: './assets/images/splash-icon.png', imageWidth: 150 }],
    'expo-font',
    ['expo-audio', { microphonePermission: false }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: projectId ? { eas: { projectId } } : {},
};

export default config;
