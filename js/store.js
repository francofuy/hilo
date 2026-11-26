// Estado de Hilo: todo vive en el teléfono (localStorage). La API key también,
// así el repositorio público nunca contiene secretos.
const KEY = 'hilo:v1';
const DEF = () => ({ v: 1, key: '', region: 'AR', follow: {}, watched: {}, last: {}, rate: {}, off: {}, meta: {}, unis: {}, uorder: {}, fx: 'full' });

let S;
try { S = { ...DEF(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { S = DEF(); }

export const state = () => S;
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* modo privado o sin espacio */ } }
export const kid = (type, id) => type + ':' + id;
export const parse = (k) => { const [type, id] = k.split(':'); return { type, id: +id }; };
export const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* ---------- ajustes ---------- */
export function setKey(k) { S.key = k.trim(); save(); }
export function setRegion(r) { S.region = r; save(); }
export function setFx(v) { S.fx = v; save(); }

/* ---------- metadatos mínimos (para dibujar el inicio sin red) ---------- */
export function remember(type, d) {
  const k = kid(type, d.id);
  const im = d.images || {};
  const lgs = (im.logos || []).filter((l) => /\.png$/.test(l.file_path)).sort((a, b) => ({ es: 0, en: 1 }[a.iso_639_1] ?? 2) - ({ es: 0, en: 1 }[b.iso_639_1] ?? 2) || (b.vote_average || 0) - (a.vote_average || 0));
  const tps = (im.posters || []).filter((p) => p.iso_639_1 == null && p.width >= 1000).sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  const m = { type, id: d.id, t: d.title || d.name, p: d.poster_path || null, b: d.backdrop_path || null, lg: lgs[0] ? lgs[0].file_path : null, tp: tps[0] ? tps[0].file_path : null,
    d: d.release_date || d.first_air_date || '', g: (d.genres || []).map((x) => x.id) };
  m.y = m.d.slice(0, 4);
  if (type === 'tv') {
    const t = today();
    const ss = (d.seasons || []).filter((s) => s.season_number > 0 && s.episode_count > 0);
    m.seasons = ss.map((s) => [s.season_number, s.episode_count, s.air_date || '']);
    m.tot = ss.filter((s) => s.air_date && s.air_date <= t).reduce((a, s) => a + s.episode_count, 0) || d.number_of_episodes || 0;
    m.st = d.status || '';
  } else {
    m.rt = d.runtime || 0;
    m.coll = d.belongs_to_collection ? { id: d.belongs_to_collection.id, name: d.belongs_to_collection.name, p: d.belongs_to_collection.poster_path, b: d.belongs_to_collection.backdrop_path } : null;
  }
  S.meta[k] = m; save();
  return m;
}
export const meta = (k) => S.meta[k] || null;
/* metadatos mínimos desde un ítem de universo (para marcar sin abrir la ficha) */
export function rememberItem(i) {
  const k = kid(i.k, i.id);
  if (!S.meta[k]) { S.meta[k] = { type: i.k, id: i.id, t: i.t, p: i.p, b: i.b, d: i.d || '', y: String(i.y || ''), g: [], tot: i.eps || 0 }; save(); }
  return S.meta[k];
}

/* ---------- seguimiento ---------- */
export const isFollowed = (k) => !!S.follow[k];
export const tracked = (k) => !!S.follow[k] || !!S.watched[k];
export function follow(k, on) { if (on) S.follow[k] = Date.now(); else delete S.follow[k]; save(); }
export function touch(k) { S.last[k] = Date.now(); }

export function epDone(k, s, e) { const w = S.watched[k]; return !!(w && typeof w === 'object' && w[s] && w[s].indexOf(e) > -1); }
export function setEp(k, s, e, on) {
  let w = S.watched[k];
  if (!w || typeof w !== 'object') w = S.watched[k] = {};
  const a = w[s] || (w[s] = []), i = a.indexOf(e);
  if (on && i < 0) { a.push(e); a.sort((x, y) => x - y); }
  if (!on && i > -1) a.splice(i, 1);
  tidy(k); if (on) { touch(k); if (!S.follow[k]) S.follow[k] = Date.now(); } save();
}
export function setRange(k, s, eps, on) {
  let w = S.watched[k];
  if (!w || typeof w !== 'object') w = S.watched[k] = {};
  const set = new Set(w[s] || []);
  eps.forEach((e) => (on ? set.add(e) : set.delete(e)));
  w[s] = [...set].sort((x, y) => x - y);
  tidy(k); if (on) { touch(k); if (!S.follow[k]) S.follow[k] = Date.now(); } save();
}
function tidy(k) {
  const w = S.watched[k]; if (!w || typeof w !== 'object') return;
  Object.keys(w).forEach((s) => { if (!w[s].length) delete w[s]; });
  if (!Object.keys(w).length) delete S.watched[k];
}
export const seasonCount = (k, s) => { const w = S.watched[k]; return w && typeof w === 'object' && w[s] ? w[s].length : 0; };
export function countWatched(k) {
  const w = S.watched[k]; if (!w) return 0;
  if (typeof w !== 'object') return 1;
  return Object.keys(w).reduce((a, s) => a + (+s > 0 ? w[s].length : 0), 0);
}
export function isMovieWatched(k) { return !!S.watched[k]; }
export function setMovie(k, on) { if (on) { S.watched[k] = Date.now(); touch(k); if (!S.follow[k]) S.follow[k] = Date.now(); } else delete S.watched[k]; save(); }

export function frac(k, fallbackTot) {
  const { type } = parse(k);
  if (type === 'movie') return S.watched[k] ? 1 : 0;
  const tot = (S.meta[k] && S.meta[k].tot) || fallbackTot || 0;
  return tot ? Math.min(1, countWatched(k) / tot) : (countWatched(k) ? 0.01 : 0);
}
export const isDone = (k, fb) => frac(k, fb) >= 0.999;

/* marcar en bloque, usando los conteos de temporada (no hace falta bajar los capítulos) */
export function markUpTo(k, upS, upE) {
  const m = S.meta[k]; if (!m || !m.seasons) return;
  m.seasons.forEach(([n, count, air]) => {
    if (n > upS) return;
    const top = n === upS ? upE : count;
    const eps = []; for (let i = 1; i <= top; i++) eps.push(i);
    setRange(k, n, eps, true);
  });
}
export function markAll(k) {
  const m = S.meta[k]; if (!m || !m.seasons) return;
  const t = today();
  m.seasons.forEach(([n, count, air]) => {
    if (!air || air > t) return;
    const eps = []; for (let i = 1; i <= count; i++) eps.push(i);
    setRange(k, n, eps, true);
  });
}
export function unmarkAll(k) { delete S.watched[k]; save(); }

export function rate(k, n) { if (n) S.rate[k] = n; else delete S.rate[k]; save(); }

/* ---------- listas derivadas ---------- */
const keys = () => Object.keys(S.meta).filter((k) => tracked(k));
export function inProgress() {
  return keys().filter((k) => parse(k).type === 'tv' && countWatched(k) > 0 && frac(k) < 0.999)
    .sort((a, b) => (S.last[b] || 0) - (S.last[a] || 0));
}
export function listed() {
  return keys().filter((k) => !S.watched[k] && S.follow[k]).sort((a, b) => (S.follow[b] || 0) - (S.follow[a] || 0));
}
export function completed() {
  return keys().filter((k) => frac(k) >= 0.999).sort((a, b) => (S.last[b] || 0) - (S.last[a] || 0));
}

/* ---------- universos guardados ----------
   Guardar un universo agrega a la lista todos sus títulos de una vez. Se recuerda cuáles agregó esa acción,
   para que al quitarlo salgan solo esos (y nunca algo que ya viste o que otro universo guardado también usa). */
export const uniSaved = (id) => !!(S.unis && S.unis[id]);
export function saveUni(id, items) {
  S.unis = S.unis || {};
  const added = [];
  items.forEach((i) => { const k = kid(i.k, i.id); rememberItem(i); if (!S.follow[k] && !S.watched[k]) { S.follow[k] = Date.now(); added.push(k); } });
  S.unis[id] = { t: Date.now(), added };
  save();
  return added.length;
}
export function unsaveUni(id) {
  const u = S.unis && S.unis[id]; if (!u) return 0;
  delete S.unis[id];
  const keep = new Set(); Object.values(S.unis).forEach((x) => (x.added || []).forEach((k) => keep.add(k)));
  let n = 0;
  (u.added || []).forEach((k) => { if (!S.watched[k] && !keep.has(k) && S.follow[k]) { delete S.follow[k]; n++; } });
  save();
  return n;
}

/* ---------- respaldo ---------- */
export function exportJSON() {
  const { key, ...rest } = S; // la key nunca sale en el respaldo
  return JSON.stringify(rest);
}
export function importJSON(txt) {
  const d = JSON.parse(txt);
  if (!d || typeof d !== 'object' || !d.watched) throw new Error('Archivo inválido');
  ['follow', 'watched', 'last', 'rate', 'off', 'meta', 'unis', 'uorder'].forEach((f) => { S[f] = { ...S[f], ...(d[f] || {}) }; });
  if (d.region) S.region = d.region;
  save();
}
export function resetProgress() { S.follow = {}; S.watched = {}; S.last = {}; S.rate = {}; S.off = {}; S.meta = {}; save(); }
