import React, { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { WebView, type WebViewMessageEvent, type WebViewNavigation, type WebViewProps } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { BACKGROUND, INTERNAL_HOSTS, SITE_URL } from "./src/config";
import { INJECTED_BEFORE_LOAD, replyScript, type BridgeMessage } from "./src/bridge";
import { BridgeError, handle, openExternal } from "./src/native";
import { useKeepAwake } from "expo-keep-awake";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Les types de react-native-webview n'acceptent pas `ref` avec React 19 : on le leur dit.
const WebViewWithRef = WebView as unknown as React.ComponentType<WebViewProps & { ref?: React.Ref<WebView> }>;

function hostOf(url: string): string {
  const m = /^https?:\/\/([^/:?#]+)/i.exec(url);
  return m ? m[1].toLowerCase() : "";
}

/** Adresses qui restent dans l'appli (le reste part dans Safari). */
function staysInside(url: string): boolean {
  if (/^(about:|blob:|data:)/i.test(url)) return true;
  const h = hostOf(url);
  if (!h) return false;
  return INTERNAL_HOSTS.includes(h);
}

export default function App() {
  // Pendant une partie, l'écran ne s'éteint pas tout seul.
  useKeepAwake();
  const web = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);

  const hideSplash = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Filet de sécurité : l'écran de démarrage ne reste jamais bloqué.
  useEffect(() => {
    const t = setTimeout(hideSplash, 6000);
    return () => clearTimeout(t);
  }, [hideSplash]);

  // Android : le bouton retour revient en arrière dans l'appli web.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack.current) {
        web.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback(async (ev: WebViewMessageEvent) => {
    let msg: BridgeMessage;
    try {
      msg = JSON.parse(ev.nativeEvent.data);
    } catch {
      return;
    }
    if (!msg || typeof msg.id !== "number" || typeof msg.type !== "string") return;
    try {
      const value = await handle(msg.type, msg.payload ?? {});
      web.current?.injectJavaScript(replyScript(msg.id, true, value));
    } catch (e) {
      const err = e instanceof BridgeError ? { code: e.code, message: e.message } : { code: "error", message: String((e as Error)?.message ?? e) };
      web.current?.injectJavaScript(replyScript(msg.id, false, err));
    }
  }, []);

  const onShouldStart = useCallback((req: ShouldStartLoadRequest) => {
    if (staysInside(req.url)) return true;
    if (/^https?:\/\//i.test(req.url)) openExternal(req.url).catch(() => {});
    return false;
  }, []);

  const onNav = useCallback((nav: WebViewNavigation) => {
    canGoBack.current = nav.canGoBack;
  }, []);

  if (failed) {
    return (
      <View style={styles.offline}>
        <StatusBar style="light" />
        <Text style={styles.title}>Pas de connexion</Text>
        <Text style={styles.text}>La première ouverture a besoin d\u2019internet. Vérifie ta connexion, puis réessaie.</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
          onPress={() => {
            setFailed(false);
            setKey((k) => k + 1);
          }}
        >
          <Text style={styles.btnText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WebViewWithRef
        key={key}
        ref={web}
        source={{ uri: SITE_URL }}
        style={styles.web}
        originWhitelist={["https://*", "about:*", "blob:*", "data:*"]}
        injectedJavaScriptBeforeContentLoaded={INJECTED_BEFORE_LOAD}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={onNav}
        onLoadEnd={hideSplash}
        onError={() => {
          hideSplash();
          setFailed(true);
        }}
        onContentProcessDidTerminate={() => web.current?.reload()}
        onRenderProcessGone={() => web.current?.reload()}
        applicationNameForUserAgent="JozzoApp/1"
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        limitsNavigationsToAppBoundDomains
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures={false}
        allowsLinkPreview={false}
        bounces={false}
        overScrollMode="never"
        pullToRefreshEnabled={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        keyboardDisplayRequiresUserAction={false}
        setSupportMultipleWindows={false}
        textInteractionEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BACKGROUND },
  web: { flex: 1, backgroundColor: BACKGROUND },
  offline: { flex: 1, backgroundColor: BACKGROUND, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { fontSize: 22, fontWeight: "700", color: "#F4ECFF", marginBottom: 8 },
  text: { fontSize: 16, color: "#C3B3D8", textAlign: "center", marginBottom: 24 },
  btn: { backgroundColor: "#FF4D8D", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
