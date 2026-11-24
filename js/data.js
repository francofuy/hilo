// Universos curados (data/universes.json, generado con tools/build-universes.mjs).
import { kid, frac, today } from './store.js';
import { hueOf } from './ui.js';

let cache = null;
const COVER = { marvel: 'movie:299534', twd: 'tv:1402', starwars: 'movie:11', breakingbad: 'tv:1396', got: 'tv:1399',
  wizarding: 'movie:671', middleearth: 'movie:120', dune: 'movie:438631', theboys: 'tv:76479', alien: 'movie:348' };

export function load() {
  if (cache) return cache;
  cache = fetch('data/universes.json').then((r) => r.json()).then((d) => {
    d.byId = {}; d.byKey = {};
    d.universes.forEach((u) => {
      d.byId[u.id] = u;
      u.items.forEach((i) => { i.key = kid(i.k, i.id); (d.byKey[i.key] = d.byKey[i.key] || []).push(u.id); });
      const c = u.items.find((i) => i.key === COVER[u.id] && i.b) || u.items.find((i) => i.b) || u.items[0];
      u.cover = c;
    });
    return d;
  }).catch((e) => { cache = null; throw e; });
  return cache;
}
export const ordered = (u, mode) => (mode === 'release' ? [...u.items].sort((a, b) => (a.d || '9').localeCompare(b.d || '9')) : u.items);

/* progreso de un universo (solo cuenta lo ya estrenado) */
export function stats(u) {
  const t = today();
  const items = u.items.filter((i) => !i.d || i.d <= t);
  let done = 0, part = 0, sum = 0;
  items.forEach((i) => { const f = frac(i.key, i.eps); sum += f; if (f >= 0.999) done++; else if (f > 0) part++; });
  return { done, part, total: items.length, f: items.length ? sum / items.length : 0 };
}

const UHUE = { marvel: 215, twd: 28, starwars: 48, breakingbad: 130, got: 12, wizarding: 280, middleearth: 150, dune: 34, theboys: 352, alien: 195 };
export const uhue = (u) => (UHUE[u.id] != null ? UHUE[u.id] : (u.cover ? (u.cover.id * 47) % 360 : 215));

/* tono de un título: el de su universo si pertenece a uno, si no el de su género */
export function hueFor(D, key, g, id) {
  const ids = D && D.byKey && D.byKey[key];
  if (ids && ids.length) return uhue(D.byId[ids[0]]);
  return hueOf(g, id);
}
