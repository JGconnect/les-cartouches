// Racine de l'appli : polices, réglages, puis la pile d'écrans (onglets, intro d'un jeu, partie).
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ReglagesProvider, useReglages } from '@/lib/reglages';
import { C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Pile() {
  const { pret } = useReglages();
  useEffect(() => { if (pret) SplashScreen.hideAsync().catch(() => {}); }, [pret]);
  if (!pret) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(onglets)" />
      <Stack.Screen name="jeu/[id]" options={{ headerShown: true, headerTransparent: true, headerTitle: '', headerTintColor: C.ink, headerBackTitle: 'Jeux' }} />
      <Stack.Screen name="partie/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="reglages" options={{ presentation: 'modal', contentStyle: { backgroundColor: C.bg } }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [polices] = useFonts({
    BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold,
    InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold,
  });
  if (!polices) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <ReglagesProvider>
        <Pile />
      </ReglagesProvider>
    </GestureHandlerRootView>
  );
}
