// Resuelve los universos curados (tools/universes-data.mjs) contra TMDB y genera data/universes.json y data/orders.json.
// Uso:  TMDB_KEY=xxxx node tools/build-universes.mjs
// La key se usa solo durante esta ejecución y no se guarda en ningún archivo.
// Si Node no usa el proxy del entorno:  NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/ruta/ca.pem node tools/build-universes.mjs
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { UNIVERSES } from './universes-data.mjs';

const KEY = process.env.TMDB_KEY;
if (!KEY) { console.error('Falta TMDB_KEY'); process.exit(1); }
const BASE = 'https://api.themoviedb.org/3';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(path, params = {}) {
  const u = new URL(BASE + path);
  u.searchParams.set('api_key', KEY);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (let i = 0; i < 3; i++) {
    const r = await fetch(u);
    if (r.ok) return r.json();
    if (r.status === 429) { await sleep(1500); continue; }
    throw new Error(path + ' → ' + r.status);
  }
  throw new Error(path + ' → reintentos agotados');
}
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const cache = new Map();
async function resolve([k, q, y, o]) {
  const opt = typeof o === 'string' ? { rl: o } : (o || {});
  const ck = k + '|' + q + '|' + y + '|' + (opt.id || '');
  let base = cache.get(ck);
  if (!base) {
    let best = null;
    if (opt.id) best = await get('/' + k + '/' + opt.id, { language: 'en-US' });
    else {
      const key = k === 'movie' ? 'primary_release_year' : 'first_air_date_year';
      let res = (await get('/search/' + k, { query: q, [key]: y, language: 'en-US' })).results || [];
      if (!res.length) res = (await get('/search/' + k, { query: q, language: 'en-US' })).results || [];
      const nq0 = norm(q), dt = (r) => r.release_date || r.first_air_date || '';
      best = res.find((r) => norm(r.title || r.name || '') === nq0 && Math.abs(+dt(r).slice(0, 4) - y) <= 1)
          || res.find((r) => Math.abs(+dt(r).slice(0, 4) - y) <= 1)
          || res[0];
    }
    if (!best) return null;
    const date = (r) => r.release_date || r.first_air_date || '';
    const es = await get('/' + k + '/' + best.id, { language: 'es-MX' });
    base = { k, id: best.id, t: es.title || es.name || best.title || best.name, y: +date(best).slice(0, 4) || y,
      d: date(best) || null, p: es.poster_path || best.poster_path || null, b: es.backdrop_path || best.backdrop_path || null };
    if (k === 'tv') base.eps = es.number_of_episodes || 0;
    base._match = !!opt.id || norm(best.title || best.name || '') === norm(q);
    cache.set(ck, base);
  }
  // lo que depende del universo (nota, tipo de historia, opcional) se aplica sobre una copia
  const item = { ...base };
  if (opt.rl) item.rl = opt.rl;
  if (opt.opt) item.o = 1;
  item._role = opt.role; item._note = opt.note;
  return item;
}

const out = [], warn = [], orders = JSON.parse(readFileSync(new URL('../data/orders.json', import.meta.url), 'utf8'));
for (const U of UNIVERSES) {
  const items = [], roles = {}, notes = {};
  for (const spec of U.items) {
    try {
      const it = await resolve(spec);
      if (!it) { warn.push(`SIN RESULTADO  [${U.id}] ${spec[1]} (${spec[2]})`); continue; }
      if (!it._match) warn.push(`REVISAR  [${U.id}] "${spec[1]}" (${spec[2]}) → "${it.t}" (${it.y}) id ${it.id}`);
      if (items.some((x) => x.k === it.k && x.id === it.id)) { warn.push(`REPETIDO  [${U.id}] ${spec[1]} → ${it.t}`); continue; }
      const key = it.k + ':' + it.id;
      if (it._role) roles[key] = it._role;
      if (it._note) notes[key] = it._note;
      delete it._match; delete it._role; delete it._note;
      items.push(it);
    } catch (e) { warn.push(`ERROR  [${U.id}] ${spec[1]}: ${e.message}`); }
  }
  out.push({ id: U.id, title: U.title, sub: U.sub, modes: U.modes, items });
  // orden de visionado: se parte de lo que ya estaba curado a mano y se suma lo de este archivo
  const prev = orders[U.id] || null, o = prev ? { ...prev } : {};
  if (U.order) Object.assign(o, U.order);
  if (Object.keys(notes).length) o.notes = { ...(o.notes || {}), ...notes };
  // "tipo de historia" solo se ofrece si TODOS los títulos tienen uno; con roles a medias el orden quedaría desparejo
  const allRoles = { ...(o.roles || {}), ...roles };
  if (Object.keys(roles).length) {
    const miss = items.filter((i) => !allRoles[i.k + ':' + i.id]);
    if (miss.length) { warn.push(`ROLES A MEDIAS  [${U.id}] faltan ${miss.length} (${miss.slice(0, 3).map((i) => i.t).join(', ')}): no se ofrece "tipo de historia"`); if (!prev || !prev.roles) delete o.roles; }
    else o.roles = allRoles;
  } else if (o.roles) {
    const miss = items.filter((i) => !o.roles[i.k + ':' + i.id]);
    if (miss.length) { warn.push(`ROLES VIEJOS INCOMPLETOS  [${U.id}] faltan ${miss.length} (${miss.slice(0, 3).map((i) => i.t).join(', ')})`); delete o.roles; }
  }
  if (Object.keys(o).length) { if (!o.rec) o.rec = 'release'; orders[U.id] = o; }
  console.log(`${U.id}: ${items.length}/${U.items.length}`);
}
mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../data/universes.json', import.meta.url), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), universes: out }));
writeFileSync(new URL('../data/orders.json', import.meta.url), JSON.stringify(orders));
if (warn.length) console.log('\n' + warn.join('\n'));
