import { Share } from "react-native";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

/** Erreur renvoyée à l'appli web, avec un code lisible. */
export class BridgeError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function share(p: Record<string, unknown>): Promise<object> {
  const text = [p.text, p.url].filter(Boolean).join("\n");
  const res = await Share.share({ title: p.title ? String(p.title) : undefined, message: text, url: p.url ? String(p.url) : undefined });
  if (res.action === Share.dismissedAction) throw new BridgeError("cancelled", "Partage annulé");
  return {};
}

/** Liens extérieurs : dans Safari (vue intégrée). */
export async function openExternal(url: string): Promise<object> {
  if (!/^https?:\/\//i.test(url)) throw new BridgeError("bad-url", "Adresse non prise en charge");
  await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  return {};
}

const HAPTICS: Record<string, () => Promise<void>> = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};

/** Répond à une demande de l'appli web. */
export async function handle(type: string, payload: Record<string, unknown>): Promise<unknown> {
  switch (type) {
    case "share":
      return share(payload);
    case "haptic":
      await (HAPTICS[String(payload.style)] ?? HAPTICS.light)();
      return {};
    case "openExternal":
      return openExternal(String(payload.url ?? ""));
    default:
      throw new BridgeError("unknown-type", "Demande inconnue : " + type);
  }
}
