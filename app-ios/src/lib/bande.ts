// Liaison avec la base Supabase « cartouches » (la même que le site, avec sa clé publique) :
// cartes de la bande partagées par un code de groupe (les avis passent par session.ts).
import { ecrire, lire } from './stockage';

const SUPABASE_URL = 'https://gfxpldjnrcoxdodidkze.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aW40Jc0ujRbiuFvm4HC76w_hOSO_LLQ';

function entetes(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...extra };
  if (SUPABASE_KEY.indexOf('sb_') !== 0) h.Authorization = 'Bearer ' + SUPABASE_KEY;
  return h;
}

async function avecDelai(url: string, init: RequestInit, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function rpc<T = unknown>(nom: string, corps: Record<string, unknown>): Promise<T | null> {
  const r = await avecDelai(SUPABASE_URL + '/rest/v1/rpc/' + nom, { method: 'POST', headers: entetes(), body: JSON.stringify(corps) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.status === 204 ? null : ((await r.json()) as T);
}

/* ---------------- cartes de la bande ---------------- */

const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export type CarteBande = { id: number | string; jeu: string; carte: string };
type Cache = { code: string; cards: CarteBande[]; at: number };

let code = '';
let cache: Cache = { code: '', cards: [], at: 0 };
let charge = false;

export async function chargerBande(): Promise<void> {
  if (charge) return;
  const c = await lire<string>('cart_group', '');
  code = typeof c === 'string' && /^[A-Z0-9]{8,16}$/.test(c) ? c : '';
  const o = await lire<Cache | null>('cart_group_cache', null);
  cache = o && o.code === code && Array.isArray(o.cards) ? o : { code, cards: [], at: 0 };
  charge = true;
}

export const codeBande = () => code;
export const cacheBande = () => cache;
export const formatCode = (c: string) => c.replace(/(.{4})(?=.)/g, '$1-');
export const normCode = (c: string) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const codeValide = (c: string) => /^[A-Z0-9]{8,16}$/.test(c);

export function nouveauCode(): string {
  let s = '';
  for (let i = 0; i < 10; i++) s += ALPHA.charAt(Math.floor(Math.random() * ALPHA.length));
  return s;
}

/** Cartes de la bande pour un jeu (textes au format du site). */
export function cartesBande(jeu: string): string[] {
  return code ? cache.cards.filter((c) => c.jeu === jeu && typeof c.carte === 'string').map((c) => c.carte) : [];
}

let enCours = false;
export async function synchroniserBande(): Promise<boolean> {
  await chargerBande();
  const c = code;
  if (!c || enCours) return false;
  enCours = true;
  try {
    const rows = await rpc<{ id: number; jeu: string; carte: string }[]>('cartes_du_groupe', { code: c });
    if (Array.isArray(rows)) {
      cache = { code: c, cards: rows.map((r) => ({ id: r.id, jeu: r.jeu, carte: r.carte })), at: Date.now() };
      ecrire('cart_group_cache', cache);
    }
    return true;
  } catch {
    return false;
  } finally {
    enCours = false;
  }
}

export async function rejoindreBande(c: string): Promise<boolean> {
  code = c;
  cache = { code: c, cards: [], at: 0 };
  charge = true;
  ecrire('cart_group', c);
  ecrire('cart_group_cache', cache);
  return synchroniserBande();
}

export function quitterBande(): void {
  code = '';
  cache = { code: '', cards: [], at: 0 };
  ecrire('cart_group', '');
  ecrire('cart_group_cache', null);
}

export async function ajouterCarteBande(jeu: string, carte: string): Promise<void> {
  await rpc('ajouter_carte_groupe', { code, p_jeu: jeu, p_carte: carte });
  await synchroniserBande();
}

export async function supprimerCarteBande(id: number | string): Promise<void> {
  await rpc('supprimer_carte_groupe', { code, p_id: id });
  await synchroniserBande();
}
