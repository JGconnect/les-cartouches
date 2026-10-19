// Mémoire du téléphone (mêmes clés que l'appli web : cart_*).
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function lire<T>(cle: string, defaut: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(cle);
    if (v === null) return defaut;
    return JSON.parse(v) as T;
  } catch {
    return defaut;
  }
}

export function ecrire(cle: string, valeur: unknown): void {
  AsyncStorage.setItem(cle, JSON.stringify(valeur)).catch(() => {});
}
