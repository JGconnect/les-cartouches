/**
 * Pont entre l'appli web Jozzo et l'appli native.
 *
 * Le script ci-dessous est injecté AVANT le chargement de la page. Il crée
 * `window.JozzoNative` : chaque appel envoie un message à l'appli native
 * (`window.ReactNativeWebView.postMessage`) et renvoie une promesse, résolue
 * quand l'appli native répond (voir `replyScript`).
 *
 * Il remplace aussi, sans toucher à l'appli web :
 *  - `navigator.share` → feuille de partage iOS (partage des cartes perso, invitation de la bande) ;
 *  - `navigator.vibrate` → vraies vibrations de l'iPhone (chronos, compte à rebours, boutons).
 */

export type BridgeMessage = {
  id: number;
  type: string;
  payload?: Record<string, unknown>;
};

export const INJECTED_BEFORE_LOAD = `
(function () {
  if (window.JozzoNative) return;
  var seq = 0, waiting = {};
  function call(type, payload) {
    return new Promise(function (resolve, reject) {
      var id = ++seq;
      waiting[id] = { resolve: resolve, reject: reject };
      window.ReactNativeWebView.postMessage(JSON.stringify({ id: id, type: type, payload: payload || {} }));
    });
  }
  window.__jozzoReply = function (id, ok, value) {
    var w = waiting[id]; if (!w) return; delete waiting[id];
    if (ok) w.resolve(value);
    else { var e = new Error((value && value.message) || "Erreur"); e.code = value && value.code; w.reject(e); }
  };
  window.JozzoNative = {
    version: 1,
    share: function (data) { return call("share", data); },
    haptic: function (style) { return call("haptic", { style: style || "light" }).catch(function () {}); },
    openExternal: function (url) { return call("openExternal", { url: String(url) }); }
  };

  // Partage : navigator.share passe par la feuille de partage iOS.
  try {
    var shareFn = function (data) {
      data = data || {};
      return window.JozzoNative.share({ title: data.title, text: data.text, url: data.url });
    };
    Object.defineProperty(navigator, "share", { value: shareFn, configurable: true, writable: true });
    Object.defineProperty(navigator, "canShare", { value: function () { return true; }, configurable: true, writable: true });
  } catch (e) {}

  // Vibrations : navigator.vibrate n'existe pas sur iPhone ; on le remplace par les vibrations natives.
  try {
    var vib = function (p) {
      var ms = Array.isArray(p) ? p.reduce(function (a, b) { return a + (+b || 0); }, 0) : (+p || 0);
      if (ms <= 0) return true;
      window.JozzoNative.haptic(ms >= 150 ? "heavy" : ms >= 40 ? "medium" : "light");
      return true;
    };
    Object.defineProperty(navigator, "vibrate", { value: vib, configurable: true, writable: true });
  } catch (e) {}

  function mark() { if (document.documentElement) document.documentElement.classList.add("in-native-app"); }
  mark();
  document.addEventListener("DOMContentLoaded", mark);
})();
true;
`;

/** Script qui renvoie la réponse de l'appli native à la page. */
export function replyScript(id: number, ok: boolean, value: unknown): string {
  return `window.__jozzoReply && window.__jozzoReply(${JSON.stringify(id)}, ${ok ? "true" : "false"}, ${JSON.stringify(value ?? null)}); true;`;
}
