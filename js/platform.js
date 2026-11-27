// Plataformas de streaming: cuáles tenés y cómo abrir un título en ellas.
// TMDB no da el enlace directo a cada plataforma, así que se abre la búsqueda del título en su sitio.
// En el iPhone, si la app está instalada, el enlace suele abrirse en la app.
import * as store from './store.js';
import * as mon from './mon.js';

// [nombre en TMDB, nombre corto, id de proveedor en TMDB]
export const PLATS = [['Netflix', 'Netflix', 8], ['Disney Plus', 'Disney+', 337], ['Amazon Prime Video', 'Prime Video', 119], ['Max', 'Max', 1899], ['Apple TV Plus', 'Apple TV+', 350], ['Paramount Plus', 'Paramount+', 531]];
const ALIAS = { 'hbo max': 'Max', 'disney+': 'Disney Plus', 'amazon video': 'Amazon Prime Video', 'apple tv+': 'Apple TV Plus', 'paramount+': 'Paramount Plus' };
const canon = (n) => ALIAS[String(n).toLowerCase()] || n;
// tus plataformas; si todavía no elegiste ninguna, se ofrecen todas
export const myPlats = () => { const p = store.state().plat; return p && p.length ? p : PLATS.map((x) => x[0]); };
export const platName = (n) => (PLATS.find((p) => p[0] === n) || [n, n])[1];
export const platId = (n) => (PLATS.find((p) => p[0] === n) || [])[2];

const region = () => String(store.state().region || 'UY');
// Verificadas (la página responde): Netflix, Prime Video, Apple TV y Paramount+.
// Disney+ no tiene una búsqueda que se pueda abrir desde afuera (da 404) y Max redirige y pierde la búsqueda:
// para esas se usa la página "Dónde ver" de TMDB, que lleva con un toque al título exacto en la plataforma.
const URLS = {
  'Netflix': (q) => 'https://www.netflix.com/search?q=' + q,
  'Amazon Prime Video': (q) => 'https://www.primevideo.com/search/?phrase=' + q,
  'Apple TV Plus': (q) => 'https://tv.apple.com/' + region().toLowerCase() + '/search?term=' + q,
  'Paramount Plus': (q) => 'https://www.paramountplus.com/search/?q=' + q
};
// Enlaces directos al título (data/links.json, armado con tools/build-links.py): abren la app en ese título.
// Formato compacto: { prefix: {código: inicio del enlace}, links: { 'tv:1402': { código: resto del enlace } } }
const CODE = { n: 'Netflix', d: 'Disney Plus', h: 'Max', p: 'Amazon Prime Video', a: 'Apple TV Plus', c: 'Paramount Plus' };
let LINKS = null, EPS = null, READY = null;
const j = (u) => fetch(u).then((r) => r.json());
export function initLinks() {
  return READY || (READY = Promise.all([j('data/links.json'), j('data/episodes.json').catch(() => null)]).then(([d, ep]) => {
    LINKS = { region: d.region, by: {} };
    Object.keys(d.links || {}).forEach((k) => { const o = LINKS.by[k] = {}; Object.keys(d.links[k]).forEach((c) => { const v = d.links[k][c]; if (CODE[c]) o[CODE[c]] = v.indexOf('http') === 0 ? v : (d.prefix[c] || '') + v; }); });
    EPS = ep && ep.region === d.region ? ep : null;
  }).catch(() => { LINKS = null; EPS = null; }));
}
// enlace directo a un episodio (T, E) en una plataforma, si existe
const CODE_OF = () => Object.keys(CODE).reduce((m, c) => { m[CODE[c]] = c; return m; }, {});
function epUrl(key, name, ep) {
  if (!ep) return null;
  const c = CODE_OF()[name];
  // 1) los enlaces de los universos (Uruguay); 2) los que pidió la app para las series que seguís
  const a = EPS && EPS.eps[key] && EPS.eps[key][c] && EPS.eps[key][c][String(ep.s)], v = a && a[ep.e - 1];
  if (v) return v.indexOf('http') === 0 ? v : (EPS.prefix[c] || '') + v;
  const mk = mon.epLinks(key), ma = mk && mk[c] && mk[c][String(ep.s)];
  return (ma && ma[ep.e - 1]) || null;
}
// al abrir una ficha: se anotan sus plataformas de tu país y, si ya la seguís, se piden sus enlaces por episodio
export function learn(type, id, d) {
  const S = store.state(), res = ((d && d['watch/providers'] && d['watch/providers'].results) || {})[S.region || 'UY'] || {};
  mon.noteProviders(type + ':' + id, (res.flatrate || []).map((p) => canon(p.provider_name)));
  if (store.tracked(type + ':' + id)) mon.ensure(type, id);
}
export const linksReady = initLinks;
// marca el enlace para que al volver a Hilo se pregunte si lo viste (js/back.js)
export const platAttr = (type, id, title, opts) => ' data-plat="' + type + ':' + id + '" data-pt="' + String(title || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) + '"' + (opts && opts.length > 1 ? ' data-opts="' + encodeURIComponent(JSON.stringify(opts.map((o) => ({ n: o.name, s: o.short, u: o.url })))) + '"' : '');
// todas las formas de ver un título entre tus plataformas: [{ name, short, url }] (la última que usaste, primero)
// Sale del catálogo de enlaces directos y, si hay datos de la ficha (d), de las plataformas que informa TMDB.
export function options(type, id, title, d, ep) {
  const S = store.state(), mineList = myPlats(), out = [], seen = new Set(), key = type + ':' + id;
  const by = LINKS && LINKS.region === region().toUpperCase() && LINKS.by[key];
  if (by) mineList.forEach((n) => { if (by[n]) { seen.add(n); out.push({ name: n, short: platName(n), url: epUrl(key, n, ep) || by[n], ep: !!epUrl(key, n, ep) }); } });
  const res = ((d && d['watch/providers'] && d['watch/providers'].results) || {})[S.region || 'UY'] || {};
  (res.flatrate || []).map((p) => canon(p.provider_name)).forEach((n) => { if (mineList.indexOf(n) > -1 && !seen.has(n)) { seen.add(n); out.push({ name: n, short: platName(n), url: epUrl(key, n, ep) || platUrl(n, title, type, id) }); } });
  // series fuera del catálogo: las plataformas que informó su ficha (Uruguay), con el enlace del episodio que pidió la app
  (mon.providersOf(key) || []).forEach((n) => { if (mineList.indexOf(n) > -1 && !seen.has(n)) { seen.add(n); const c = CODE_OF()[n]; out.push({ name: n, short: platName(n), url: epUrl(key, n, ep) || (mon.titleLinks(key) || {})[c] || platUrl(n, title, type, id), ep: !!epUrl(key, n, ep) }); } });
  const pref = (S.pref || {})[key];
  return out.sort((x, y) => (y.name === pref) - (x.name === pref));
}
export function rememberPref(type, id, name) { const S = store.state(); S.pref = S.pref || {}; S.pref[type + ':' + id] = name; store.save(); }
// compatibilidad: la primera opción, con la cantidad de opciones
export function best(type, id, ep) { const o = options(type, id, '', null, ep); return o.length ? { ...o[0], opts: o } : null; }
const direct = (provider, type, id) => (LINKS && LINKS.region === region().toUpperCase() && LINKS.by[type + ':' + id] && LINKS.by[type + ':' + id][canon(provider)]) || null;
export const platUrl = (provider, title, type, id) => {
  const dl = direct(provider, type, id); if (dl) return dl;
  const f = URLS[canon(provider)];
  if (f) return f(encodeURIComponent(title));
  return type && id ? 'https://www.themoviedb.org/' + type + '/' + id + '/watch?locale=' + region().toUpperCase() : null;
};

// de las plataformas donde está el título, la primera que tenés vos
export function mine(d) {
  const S = store.state(), res = ((d && d['watch/providers'] && d['watch/providers'].results) || {})[S.region || 'UY'] || {};
  const mineList = myPlats(), hit = (res.flatrate || []).map((p) => canon(p.provider_name)).find((n) => mineList.indexOf(n) > -1);
  return hit ? { name: hit, short: platName(hit) } : null;
}
