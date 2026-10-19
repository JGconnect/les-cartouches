/**
 * Réglages de l'appli native Jozzo. Rien de secret ici.
 */

/** Adresse de l'appli web affichée dans l'appli native. */
export const SITE_URL = "https://myjozzo.fr/";

/**
 * Adresses qui restent dans l'appli. Tout le reste (liens extérieurs) s'ouvre dans Safari.
 * Ce sont aussi les « domaines de l'appli » (WKAppBoundDomains dans app.json) : grâce à eux,
 * le service worker marche dans l'appli et les jeux restent jouables hors ligne.
 */
export const INTERNAL_HOSTS = ["myjozzo.fr", "www.myjozzo.fr", "jgconnect.github.io"];

/** Couleur de fond (celle du manifeste de l'appli web). */
export const BACKGROUND = "#181022";
