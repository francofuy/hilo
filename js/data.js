// Universos curados (data/universes.json, generado con tools/build-universes.mjs).
import { kid, frac, today } from './store.js';
import { hueOf } from './ui.js';

let cache = null;
const COVER = { marvel: 'movie:299534', twd: 'tv:1402', starwars: 'movie:11', breakingbad: 'tv:1396', got: 'tv:1399',
  wizarding: 'movie:671', middleearth: 'movie:120', dune: 'movie:438631', theboys: 'tv:76479', alien: 'movie:348' };

export function load() {
  if (cache) return cache;
  cache = Promise.all([fetch('data/universes.json').then((r) => r.json()), fetch('data/orders.json').then((r) => r.json()).catch(() => ({}))]).then(([d, ord]) => {
    d.byId = {}; d.byKey = {};
    d.universes.forEach((u) => {
      d.byId[u.id] = u; u.meta = ord[u.id] || null;
      u.items.forEach((i) => { i.key = kid(i.k, i.id); (d.byKey[i.key] = d.byKey[i.key] || []).push(u.id); });
      const c = u.items.find((i) => i.key === COVER[u.id] && i.b) || u.items.find((i) => i.b) || u.items[0];
      u.cover = c;
    });
    return d;
  }).catch((e) => { cache = null; throw e; });
  return cache;
}

/* ---------- órdenes de visionado ----------
   Sirve para cualquier universo o colección. Con curaduría (data/orders.json) ofrece estreno, orden de la historia y
   tipo de historia, con el motivo de cada uno; sin curaduría (p. ej. una colección de TMDB) solo estreno, que es lo
   único que se puede afirmar. */
export const ROLES = { main: 'Historia principal', sequel: 'Continúa la historia', prequel: 'Precuela', spinoff: 'Spin-off', parallel: 'En paralelo', anthology: 'Antología', epilogue: 'Epílogo' };
const ROLE_ORDER = Object.keys(ROLES);
export const ORDER_LABEL = { release: 'Por estreno', story: 'Orden de la historia', role: 'Por tipo de historia' };
const WHY_REL = 'Es el orden en que se estrenó cada título. En una saga suele ser también el orden en que se pensó para contarse, y no te adelanta nada de lo que viene después.';
const WHY_ROLE = 'Agrupa los títulos según qué cuentan: la historia principal, sus continuaciones, las precuelas, los spin-offs y lo que transcurre en paralelo. Dentro de cada grupo van por fecha de estreno.';
const NO_STORY = 'No hay datos confiables para ordenar la historia de punta a punta, así que solo se ofrece el orden de estreno.';
const byDate = (a, b) => (a.d || '9').localeCompare(b.d || '9');

export const roleOf = (u, key) => { const r = u.meta && u.meta.roles && u.meta.roles[key]; return r ? { id: r, label: ROLES[r] } : null; };
export const noteOf = (u, key) => (u.meta && u.meta.notes && u.meta.notes[key]) || '';

// Opciones de orden de un universo: [{id, label, why, rec}] y los que no se pueden ofrecer, con su motivo.
export function metaOf(u) {
  const m = u.meta || {}, hasRoles = !!(m.roles && Object.keys(m.roles).length), rec = m.rec || 'release';
  const opts = [{ id: 'release', why: (m.release && m.release.why) || WHY_REL }];
  if (m.story) opts.push({ id: 'story', why: m.story.why });
  if (hasRoles) opts.push({ id: 'role', why: (m.role && m.role.why) || WHY_ROLE });
  opts.forEach((o) => { o.label = ORDER_LABEL[o.id]; o.rec = o.id === rec; });
  opts.sort((a, b) => (b.rec ? 1 : 0) - (a.rec ? 1 : 0));
  const no = [];
  if (!m.story) no.push({ id: 'story', label: ORDER_LABEL.story, why: (m.no && m.no.story) || NO_STORY });
  return { opts, no, rec };
}
export const prefOrder = (u, saved) => { const mo = metaOf(u); return mo.opts.some((o) => o.id === saved) ? saved : mo.rec; };

export function sequence(u, id) {
  const items = u.items, m = u.meta || {};
  if (id === 'release') return [...items].sort(byDate);
  if (id === 'role') { const r = (i) => { const x = roleOf(u, i.key); return x ? ROLE_ORDER.indexOf(x.id) : 99; }; return [...items].sort((a, b) => r(a) - r(b) || byDate(a, b)); }
  const keys = m.story && m.story.keys;
  if (!keys) return items; // el orden del archivo es el orden de la historia
  const by = new Map(items.map((i) => [i.key, i]));
  const seq = keys.map((k) => by.get(k)).filter(Boolean);
  return seq.concat(items.filter((i) => seq.indexOf(i) < 0));
}
// compatibilidad con el código anterior
export const ordered = (u, mode) => sequence(u, mode === 'release' ? 'release' : 'story');


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
