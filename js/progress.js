// "Dónde me quedé" y "Anteriormente", con datos oficiales de TMDB.
import * as store from './store.js';
import * as api from './api.js';

/* Próximo capítulo sin ver:
   { s, e, name, still, air, overview } | { upcoming:true, s, e, air } | null (al día / sin datos) */
export async function nextEpisode(k) {
  const { id } = store.parse(k);
  const m = store.meta(k);
  if (!m || !m.seasons) return null;
  const t = store.today();
  for (const [n, count, air] of m.seasons) {
    if (store.seasonCount(k, n) >= count) continue;
    if (!air || air > t) return { upcoming: true, s: n, e: store.seasonCount(k, n) + 1, air };
    const sd = await api.season(id, n);
    const eps = sd.episodes || [];
    const ep = eps.find((x) => !store.epDone(k, n, x.episode_number));
    if (!ep) continue;
    if (!ep.air_date || ep.air_date > t) return { upcoming: true, s: n, e: ep.episode_number, air: ep.air_date, name: ep.name };
    return { s: n, e: ep.episode_number, name: ep.name, still: ep.still_path, air: ep.air_date, overview: ep.overview };
  }
  return null;
}

/* Últimos capítulos vistos (antes del siguiente), con su sinopsis oficial. */
export async function recapEpisodes(k, limit = 4) {
  const { id } = store.parse(k);
  const w = store.state().watched[k];
  if (!w || typeof w !== 'object') return [];
  const pairs = [];
  Object.keys(w).forEach((s) => { if (+s > 0) w[s].forEach((e) => pairs.push([+s, e])); });
  pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const last = pairs.slice(-limit);
  const seasons = [...new Set(last.map((p) => p[0]))];
  const data = {};
  await Promise.all(seasons.map(async (n) => { try { data[n] = (await api.season(id, n)).episodes || []; } catch (e) { data[n] = []; } }));
  return last.map(([s, e]) => { const ep = (data[s] || []).find((x) => x.episode_number === e); return { s, e, name: ep ? ep.name : 'Episodio ' + e, overview: ep ? ep.overview : '', still: ep ? ep.still_path : null }; });
}
