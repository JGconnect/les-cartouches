// Barre d'onglets native d'iOS : Tous · Soirée · Trajet · Famille · Plus (comme l'appli web).
// En mode Famille, Soirée et Famille disparaissent (tout est déjà « famille »).
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useReglages } from '@/lib/reglages';
import { C } from '@/lib/theme';

export default function OngletsLayout() {
  const { mode } = useReglages();
  const famille = mode === 'famille';
  return (
    <NativeTabs tintColor={C.accent} labelStyle={{ color: C.inkFaint }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Tous</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'die.face.5', selected: 'die.face.5.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="soiree" hidden={famille}>
        <NativeTabs.Trigger.Label>Soirée</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'wineglass', selected: 'wineglass.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trajet">
        <NativeTabs.Trigger.Label>Trajet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bus', selected: 'bus.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="famille" hidden={famille}>
        <NativeTabs.Trigger.Label>Famille</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'figure.2.and.child.holdinghands', selected: 'figure.2.and.child.holdinghands' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plus">
        <NativeTabs.Trigger.Label>Plus</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
