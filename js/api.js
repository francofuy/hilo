// Capa de datos: TMDB. Todo se pide en español (es-MX) y, si falta la sinopsis,
// se completa con la versión en inglés.
import { state } from './store.js';

const BASE = 'https://api.themoviedb.org/3';
const mem = new Map();

class ApiError extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }

function call(path, params = {}, lang) {
  const key = state().key;
  if (!key) return Promise.reject(new ApiError('nokey'));
  const u = new URL(BASE + path);
  const headers = {};
  if (key.length > 40) headers.Authorization = 'Bearer ' + key; else u.searchParams.set('api_key', key);
  u.searchParams.set('language', lang || 'es-MX');
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const id = u.toString();
  if (mem.has(id)) return mem.get(id);
  const p = fetch(u, { headers }).then(async (r) => {
    if (r.status === 401) throw new ApiError('badkey', 'La API key no es válida');
    if (r.status === 404) throw new ApiError('notfound', 'No se encontró');
    if (!r.ok) throw new ApiError('http', 'TMDB respondió ' + r.status);
    return r.json();
  }, () => { throw new ApiError('offline', 'Sin conexión'); });
  mem.set(id, p);
  p.catch(() => mem.delete(id));
  return p;
}

export async function validate(key) {
  const u = new URL(BASE + '/configuration');
  const headers = {};
  if (key.length > 40) headers.Authorization = 'Bearer ' + key; else u.searchParams.set('api_key', key);
  let r;
  try { r = await fetch(u, { headers }); } catch (e) { throw new ApiError('offline', 'No pude conectar con TMDB. Revisá tu conexión.'); }
  if (r.status === 401) throw new ApiError('badkey', 'TMDB dice que esa key no es válida.');
  if (!r.ok) throw new ApiError('http', 'TMDB respondió ' + r.status);
  return true;
}

const APPEND_TV = 'aggregate_credits,recommendations,external_ids,keywords,watch/providers,content_ratings,images,videos';
const APPEND_MOVIE = 'credits,recommendations,external_ids,keywords,watch/providers,release_dates,images,videos';

async function withOverview(type, id, d) {
  if (d.overview) return d;
  try { const en = await call('/' + type + '/' + id, {}, 'en-US'); if (en.overview) { d.overview = en.overview; d._en = true; } } catch (e) { /* sin sinopsis */ }
  return d;
}
const MEDIA = { include_image_language: 'null', include_video_language: 'es,en,null' };
export async function tv(id) { return withOverview('tv', id, await call('/tv/' + id, { append_to_response: APPEND_TV, ...MEDIA })); }
export async function movie(id) { return withOverview('movie', id, await call('/movie/' + id, { append_to_response: APPEND_MOVIE, ...MEDIA })); }
export const reviews = (type, id) => call('/' + type + '/' + id + '/reviews', {}, 'en-US');
export async function details(type, id) { return type === 'tv' ? tv(id) : movie(id); }

export async function season(id, n) {
  const s = await call('/tv/' + id + '/season/' + n);
  if ((s.episodes || []).some((e) => !e.overview)) {
    try {
      const en = await call('/tv/' + id + '/season/' + n, {}, 'en-US');
      const by = new Map((en.episodes || []).map((e) => [e.episode_number, e]));
      s.episodes.forEach((e) => { const x = by.get(e.episode_number); if (x && !e.overview && x.overview) { e.overview = x.overview; e._en = true; } });
    } catch (e) { /* sin traducción */ }
  }
  return s;
}
export async function collection(id) {
  const c = await call('/collection/' + id);
  if (!c.overview) { try { const en = await call('/collection/' + id, {}, 'en-US'); c.overview = en.overview || ''; } catch (e) { /* ok */ } }
  return c;
}
export const search = (q) => call('/search/multi', { query: q, include_adult: 'false' });
export const trending = () => call('/trending/all/week');
export const clearMemory = () => mem.clear();
