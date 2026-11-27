// Plataformas de streaming: cuáles tenés y cómo abrir un título en ellas.
// TMDB no da el enlace directo a cada plataforma, así que se abre la búsqueda del título en su sitio.
// En el iPhone, si la app está instalada, el enlace suele abrirse en la app.
import * as store from './store.js';

// [nombre en TMDB, nombre corto, id de proveedor en TMDB]
export const PLATS = [['Netflix', 'Netflix', 8], ['Disney Plus', 'Disney+', 337], ['Amazon Prime Video', 'Prime Video', 119], ['Max', 'Max', 1899], ['Apple TV Plus', 'Apple TV+', 350], ['Paramount Plus', 'Paramount+', 531]];
const ALIAS = { 'hbo max': 'Max', 'disney+': 'Disney Plus', 'amazon video': 'Amazon Prime Video', 'apple tv+': 'Apple TV Plus', 'paramount+': 'Paramount Plus' };
const canon = (n) => ALIAS[String(n).toLowerCase()] || n;
export const platName = (n) => (PLATS.find((p) => p[0] === n) || [n, n])[1];
export const platId = (n) => (PLATS.find((p) => p[0] === n) || [])[2];

const region = () => String(store.state().region || 'AR');
// Verificadas (la página responde): Netflix, Prime Video, Apple TV y Paramount+.
// Disney+ no tiene una búsqueda que se pueda abrir desde afuera (da 404) y Max redirige y pierde la búsqueda:
// para esas se usa la página "Dónde ver" de TMDB, que lleva con un toque al título exacto en la plataforma.
const URLS = {
  'Netflix': (q) => 'https://www.netflix.com/search?q=' + q,
  'Amazon Prime Video': (q) => 'https://www.primevideo.com/search/?phrase=' + q,
  'Apple TV Plus': (q) => 'https://tv.apple.com/' + region().toLowerCase() + '/search?term=' + q,
  'Paramount Plus': (q) => 'https://www.paramountplus.com/search/?q=' + q
};
export const platUrl = (provider, title, type, id) => {
  const f = URLS[canon(provider)];
  if (f) return f(encodeURIComponent(title));
  return type && id ? 'https://www.themoviedb.org/' + type + '/' + id + '/watch?locale=' + region().toUpperCase() : null;
};

// de las plataformas donde está el título, la primera que tenés vos
export function mine(d) {
  const S = store.state(), res = ((d && d['watch/providers'] && d['watch/providers'].results) || {})[S.region || 'AR'] || {};
  const mineList = S.plat || [], hit = (res.flatrate || []).map((p) => canon(p.provider_name)).find((n) => mineList.indexOf(n) > -1);
  return hit ? { name: hit, short: platName(hit) } : null;
}
