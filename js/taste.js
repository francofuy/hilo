// Gusto: qué sugerir según lo que seguís, puntuaste y terminaste. Todo se calcula en el teléfono.
// Señales, de más a menos fuerte:
//   1. Recomendaciones de TMDB de los títulos que más pesan en tu historial.
//   2. Lo que te falta de los universos donde ya avanzaste.
//   3. Sin historial todavía: las tendencias de la semana.
// "No me interesa" saca el título para siempre y no se vuelve a sugerir.
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import { img } from './ui.js';

const POP = 7; // candidatos máximos por apertura

function weightOf(k) {
  const S = store.state(), r = S.rate[k] || 0;
  const days = (Date.now() - (S.last[k] || 0)) / 864e5;
  return 0.5 + store.frac(k) + (r >= 4 ? 1.6 : r >= 1 ? 0.2 : 0) + (S.last[k] && days < 45 ? 0.6 : 0);
}

export async function suggestions(U, limit = 3) {
  const S = store.state(); S.hide = S.hide || {};
  const tracked = new Set(Object.keys(S.meta).filter((k) => store.tracked(k)));
  const score = new Map(), why = new Map();
  const add = (key, pts, reason) => { if (tracked.has(key) || S.hide[key]) return; score.set(key, (score.get(key) || 0) + pts); if (!why.has(key) || pts > why.get(key)[0]) why.set(key, [pts, reason]); };

  const top = [...tracked].map((k) => [k, weightOf(k)]).sort((a, b) => b[1] - a[1]).slice(0, 4);
  await Promise.all(top.map(async ([k, w]) => {
    const m = store.meta(k); if (!m) return;
    try { const rs = await api.recsOf(m.type, m.id); rs.slice(0, 10).forEach((r, i) => { if (r.media_type && r.media_type !== 'tv' && r.media_type !== 'movie') return; add((r.media_type || m.type) + ':' + r.id, w * (1 - i * 0.05), 'Porque seguís ' + m.t); }); } catch (e) { /* sin red: quedan los universos */ }
  }));
  U.universes.forEach((u) => {
    const s = data.stats(u); if (!(s.f > 0)) return;
    u.items.forEach((i) => { if (i.d && i.d > store.today()) return; add(i.key, 1.2 + s.f * 2, 'Es parte de ' + u.title); });
  });
  if (!score.size) {
    try { const t = await api.trending(); (t.results || []).filter((r) => r.media_type === 'tv' || r.media_type === 'movie').slice(0, 10).forEach((r, i) => add(r.media_type + ':' + r.id, 1 - i * 0.05, 'Tendencia esta semana')); } catch (e) { /* sin red */ }
  }

  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]);
  const out = [], perReason = {};
  for (const [key] of ranked) {
    if (out.length >= POP) break;
    const why0 = why.get(key)[1];
    if ((perReason[why0] || 0) >= 2) continue; // variedad: como mucho dos por la misma razón
    const [type, id] = [key.split(':')[0], +key.split(':')[1]];
    const [info, a] = await Promise.all([api.discoverInfo(type, id), api.heroAssets(type, id)]);
    if (!info) continue;
    const src = a.poster || img(info.b, 'w1280') || img(info.p, 'w780');
    if (!src) continue; // sin imagen no hay portada
    perReason[why0] = (perReason[why0] || 0) + 1;
    out.push({ key, type, id, info, a, src, reason: why0, pts: score.get(key) });
  }
  // sorteo ponderado: lo más afín sale más seguido, pero no siempre lo mismo
  const pool = out.slice(), pick = [];
  while (pick.length < limit && pool.length) {
    const tot = pool.reduce((s, x) => s + x.pts, 0); let r = Math.random() * tot, j = 0;
    for (; j < pool.length - 1; j++) { r -= pool[j].pts; if (r <= 0) break; }
    pick.push(pool.splice(j, 1)[0]);
  }
  return pick;
}

export function dismiss(key) { const S = store.state(); S.hide = S.hide || {}; S.hide[key] = Date.now(); store.save(); }

/* orden de las portadas: al azar, con un empujón para que lo que tenés en curso salga primero la mayoría de las veces */
export function mixSlides(resume, fresh) {
  const all = [...resume, ...fresh];
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  if (resume.length && Math.random() < 0.65) { const i = all.findIndex((s) => s.kind === 'resume'); if (i > 0) all.unshift(all.splice(i, 1)[0]); }
  return all;
}
