// Enlaces directos por episodio para CUALQUIER serie que sigas, con la API de Movie of the Night
// (https://developers.movieofthenight.com). Necesita tu propia clave, gratis: 1.000 consultas por mes.
// La clave vive solo en este teléfono y no entra en el respaldo. Cada serie se consulta una vez y se guarda 30 días.
// Uruguay no está entre sus países: se piden los de Argentina, y Hilo filtra con tus plataformas de Uruguay.
import * as store from './store.js';

const BASE = 'https://api.movieofthenight.com/v4';
const CACHE = 'hilo:mon', TTL = 30 * 864e5, MAXM = 900, MAXN = 80;
const SERVICE = { netflix: 'n', disney: 'd', hbo: 'h', prime: 'p', apple: 'a', paramount: 'c' };
let C = null, busy = false;
const queue = [], pending = new Set(), failed = new Set();

const load = () => C || (C = (() => { try { return JSON.parse(localStorage.getItem(CACHE) || '{}'); } catch (e) { return {}; } })());
const save = () => {
  const keys = Object.keys(C).filter((k) => k !== '_u');
  if (keys.length > MAXN) keys.sort((a, b) => C[a].t - C[b].t).slice(0, keys.length - MAXN).forEach((k) => delete C[k]);
  try { localStorage.setItem(CACHE, JSON.stringify(C)); } catch (e) { /* sin espacio: queda en memoria */ }
};
const month = () => new Date().toISOString().slice(0, 7);
const clean = (u) => String(u || '').replace(/[?&]utm_[a-z]+=[^&]*/g, '');

export const hasKey = () => !!store.state().mkey;
export const country = () => store.state().mcountry || 'ar';
export const used = () => { const m = store.state().mon; return m && m.m === month() ? m.n : 0; };
export const limit = MAXM;

/* lo que ya se sabe de una serie: { códigoDePlataforma: { temporada: [enlace|null, ...] } } y, para películas, { código: enlace } */
export const epLinks = (key) => { const e = load()[key]; return e ? e.p : null; };
export const titleLinks = (key) => { const e = load()[key]; return e ? e.m : null; };
// plataformas de tu país donde está el título (las informa TMDB al abrir la ficha): sirve para las portadas del Inicio
export function noteProviders(key, names) { const c = load(); c._u = c._u || {}; c._u[key] = names; save(); }
export const providersOf = (key) => ((load()._u || {})[key]) || null;

/* comprueba la clave y elige el país: Uruguay si la API lo ofrece y, si no, Argentina */
export async function validate(k) {
  let r; try { r = await fetch(BASE + '/countries', { headers: { 'X-API-Key': k } }); } catch (e) { throw new Error('Sin conexión'); }
  if (r.status === 401 || r.status === 403) throw new Error('La clave no es válida');
  if (!r.ok) throw new Error('La API respondió ' + r.status);
  let d = null; try { d = await r.json(); } catch (e) { /* respuesta inesperada */ }
  const codes = Array.isArray(d) ? d.map((x) => String((x && (x.countryCode || x.code || x.id)) || x).toLowerCase()) : d && typeof d === 'object' ? Object.keys(d.countries || d).map((x) => x.toLowerCase()) : [];
  return codes.indexOf('uy') > -1 ? 'uy' : 'ar';
}

async function fetchShow(type, id) {
  const S = store.state(), m = month();
  if (!S.mon || S.mon.m !== m) S.mon = { m, n: 0 };
  if (S.mon.n >= MAXM) throw new Error('límite del mes');
  S.mon.n++; store.save();
  const c = country();
  const r = await fetch(BASE + '/shows/' + type + '/' + id + '?country=' + c + '&series_granularity=episode&output_language=es', { headers: { 'X-API-Key': S.mkey } });
  if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
  const d = await r.json();
  const pick = (so) => { const o = {}; ((so || {})[c] || []).forEach((x) => { const code = SERVICE[x.service && x.service.id]; if (code && x.type === 'subscription' && !o[code]) o[code] = clean(x.videoLink || x.link); }); return o; };
  const entry = { t: Date.now(), m: pick(d.streamingOptions), p: {} };
  (d.seasons || []).forEach((s, si) => {
    const mm = /(\d+)\s*$|season\s*(\d+)|temporada\s*(\d+)/i.exec(s.title || ''), sn = mm ? +(mm[1] || mm[2] || mm[3]) : si + 1;
    (s.episodes || []).forEach((e, ei) => { const o = pick(e.streamingOptions); Object.keys(o).forEach((code) => { const a = ((entry.p[code] = entry.p[code] || {})[sn] = entry.p[code][sn] || []); while (a.length < ei) a.push(null); a[ei] = o[code]; }); });
  });
  load()[type + ':' + id] = entry; save();
}

async function pump() {
  if (busy) return; busy = true;
  while (queue.length) {
    const [type, id, k] = queue.shift();
    try { await fetchShow(type, id); } catch (e) { failed.add(k); if (e.status === 401 || e.status === 403) { queue.length = 0; } }
    pending.delete(k); await new Promise((r) => setTimeout(r, 700));
  }
  busy = false;
}

// pide los enlaces de una serie si hace falta (una vez por mes)
export function ensure(type, id) {
  if (!hasKey() || type !== 'tv') return;
  const k = type + ':' + id, e = load()[k];
  if ((e && Date.now() - e.t < TTL) || pending.has(k) || failed.has(k)) return;
  pending.add(k); queue.push([type, id, k]); pump();
}

// al seguir o marcar una serie, se piden sus enlaces
export function initMon() {
  window.addEventListener('hilo:track', (e) => { const [t, i] = String(e.detail).split(':'); ensure(t, +i); });
}
