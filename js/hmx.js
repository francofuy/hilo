// Inicio: lo que va debajo de las portadas, compacto y con imágenes.
//   Lo que viene · Seguir viendo · Para vos · (Plataformas | Tu lista | Tendencias)
// "¿Qué veo ahora?" vive en las portadas. Cada sección aparece solo si tiene algo útil.
import * as store from './store.js';
import * as api from './api.js';
import * as taste from './taste.js';
import { nextEpisode, nextSync } from './progress.js';
import { openSheet } from './sheet.js';
import { stats } from './data.js';
import { PLATS, platName, platId, platUrl, mine, best, platAttr } from './platform.js';
import { esc, ic, img, ago, daysUntil, epLabel } from './ui.js';

const RT = { movie: 125, ep: 45 }; // estimaciones cuando TMDB no da la duración
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dur = (m) => { m = Math.round(m / 5) * 5; return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min'; };
// botón de play sobre una portada: abre el título en tu plataforma (o, si no hay enlace, el que le des de respaldo)
const goBtn = (cls, go, fallback, type, id, title) => go ? '<a class="' + cls + '" href="' + go.url + '" target="_blank" rel="noopener"' + platAttr(type, id, title, go.opts) + ' aria-label="Abrir en ' + esc(go.short) + '">' + ic('play', 15) + '</a>' : (fallback ? '<a class="' + cls + ' off" href="' + fallback + '" aria-label="Ver ficha">' + ic('play', 15) + '</a>' : '');
const rowTitle = (t, sub) => '<h2 class="hm-h">' + t + (sub ? '<small>' + sub + '</small>' : '') + '</h2>';

function context(U) {
  const S = store.state(), t0 = store.today();
  const tracked = new Set(Object.keys(S.meta).filter((k) => store.tracked(k)));
  const uniTracked = new Set(); tracked.forEach((k) => (U.byKey[k] || []).forEach((u) => uniTracked.add(u)));
  return { S, t0, tracked, uniTracked, prog: store.inProgress() };
}

/* ---------- ¿Qué veo ahora? (se abre desde las portadas) ---------- */
export async function openWhat(U, hue) {
  const { t0, tracked, uniTracked, prog } = context(U);
  const cand = async (limit) => {
    const out = [];
    if (limit >= 50) for (const k of prog) { const m = store.meta(k); if (!m || !m.p) continue; try { const ne = await nextEpisode(k); if (ne && !ne.upcoming) out.push({ k, type: 'tv', id: m.id, title: m.t, sub: 'Un capítulo · ' + epLabel(ne.s, ne.e) + ' · ' + dur(RT.ep), href: '#/tv/' + m.id + '?go=next', p: img(m.p, 'w342'), ep: { s: ne.s, e: ne.e } }); } catch (e) { /* nada */ } }
    const pool = new Set(store.listed());
    tracked.forEach((k) => { if (store.frac(k) < 0.999) pool.add(k); });
    uniTracked.forEach((uid) => U.byId[uid].items.forEach((i) => { if (i.k === 'movie' && (!i.d || i.d <= t0) && store.frac(i.key) < 0.999) pool.add(i.key); }));
    const all = [...U.universes].flatMap((u) => u.items);
    for (const k of pool) {
      const { type, id } = store.parse(k); if (type !== 'movie') continue;
      let m = store.meta(k); if (!m) { const it = all.find((x) => x.key === k); if (!it) continue; m = { type, id, t: it.t, p: it.p, rt: 0 }; }
      if (m.d && m.d > t0 || !m.p) continue;
      const rt = m.rt || RT.movie; if (rt > limit) continue;
      out.push({ k, type, id, title: m.t, sub: 'Película · ' + dur(rt) + (m.rt ? '' : ' aprox.'), href: '#/movie/' + id, p: img(m.p, 'w342') });
    }
    return out;
  };
  const OPTS = [['1 hora', 60], ['2 horas', 130], ['Toda la noche', 230]];
  const s = openSheet('', hue);
  s.el.innerHTML = '<div class="grab"></div><h3>¿Qué veo ahora?</h3><div class="ssub">Elegí cuánto tiempo tenés y te propongo algo de lo tuyo.</div><div class="hx-t">' + OPTS.map((o) => '<button data-lim="' + o[1] + '">' + o[0] + '</button>').join('') + '</div><div id="hxr"></div>';
  const seen = []; let lim = 0;
  const render = async () => {
    const box = s.el.querySelector('#hxr'), all = await cand(lim), pool = all.filter((x) => seen.indexOf(x.k) < 0), from = pool.length ? pool : all, pick = from[Math.floor(Math.random() * from.length)];
    if (!pick) { box.innerHTML = '<p class="hx-none">Todavía no tengo nada tuyo que entre en ese tiempo. Seguí algunas series o películas y volvé a probar.</p>'; return; }
    seen.push(pick.k);
    const go = best(pick.type, pick.id, pick.ep);
    box.innerHTML = '<a class="hx-pick" href="' + pick.href + '" data-close><img src="' + pick.p + '" alt=""><span><b>' + esc(pick.title) + '</b><small>' + esc(pick.sub) + '</small></span></a><div class="hx-pa" id="hxpa">' +
      (go ? '<a class="btn pri" href="' + go.url + '" target="_blank" rel="noopener"' + platAttr(pick.type, pick.id, pick.title, go.opts) + '>' + ic('play', 16) + 'Abrir' + (go.opts.length > 1 ? '' : ' en ' + esc(go.short)) + '</a><a class="btn glass" href="' + pick.href + '" data-close>Ver ficha</a>' : '<a class="btn pri" href="' + pick.href + '" data-close>Ver ficha</a>') +
      (all.length > 1 ? '<button class="btn glass" data-otra>Otra</button>' : '') + '</div>';
    // si no hay enlace directo pero está en una de tus plataformas, se agrega el botón cuando llegan los datos
    if (!go) try { const d = await api.details(pick.type, pick.id), m = mine(d), pa = s.el.querySelector('#hxpa'); if (m && pa && pa.isConnected && s.el.querySelector('.hx-pick').getAttribute('href') === pick.href) pa.insertAdjacentHTML('afterbegin', '<a class="btn glass" href="' + platUrl(m.name, pick.title, pick.type, pick.id) + '" target="_blank" rel="noopener"' + platAttr(pick.type, pick.id, pick.title) + '>' + ic('play', 16) + 'Abrir en ' + m.short + '</a>'); } catch (e) { /* sin plataforma */ }
  };
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-lim]');
    if (b) { lim = +b.dataset.lim; s.el.querySelectorAll('[data-lim]').forEach((x) => x.classList.toggle('on', x === b)); seen.length = 0; await render(); return; }
    if (e.target.closest('[data-otra]')) await render();
  });
}

export async function build(U, hue) {
  const { S, t0, tracked, uniTracked, prog } = context(U);
  const parts = [], binds = [];

  /* ---- lo que viene: cuenta regresiva + estrenos, en una sola fila de imágenes ---- */
  const up = [];
  const returning = [...tracked].filter((k) => { const m = store.meta(k); return m && m.type === 'tv' && /Returning|Production|Planned/i.test(m.st || ''); }).slice(0, 10);
  await Promise.all(returning.map(async (k) => {
    const m = store.meta(k);
    try { const d = await api.tv(m.id), n = d.next_episode_to_air; if (n && n.air_date && n.air_date >= t0) up.push({ date: n.air_date, title: m.t, sub: epLabel(n.season_number, n.episode_number), type: 'tv', id: m.id, b: m.b }); } catch (e) { /* sin red */ }
  }));
  tracked.forEach((k) => { const m = store.meta(k); if (m && m.type === 'movie' && m.d && m.d > t0 && daysUntil(m.d) <= 200) up.push({ date: m.d, title: m.t, sub: 'Película', type: 'movie', id: m.id, b: m.b }); });
  uniTracked.forEach((uid) => U.byId[uid].items.forEach((i) => { if (i.d && i.d > t0 && daysUntil(i.d) <= 200 && !up.some((x) => x.type === i.k && x.id === i.id)) up.push({ date: i.d, title: i.t, sub: (i.k === 'movie' ? 'Película' : 'Serie') + ' · ' + U.byId[uid].title, type: i.k, id: i.id, b: i.b }); }));
  up.sort((a, b) => a.date.localeCompare(b.date));

  let cd = null;
  uniTracked.forEach((uid) => {
    const u = U.byId[uid], fut = u.items.filter((i) => i.d && i.d > t0).sort((a, b) => a.d.localeCompare(b.d))[0]; if (!fut) return;
    const s = stats(u); if (!(s.f > 0)) return; if (!cd || s.f > cd.s.f) cd = { u, fut, s };
  });
  const tiles = [];
  if (cd) {
    const days = Math.max(1, daysUntil(cd.fut.d));
    let min = 0, left = 0;
    cd.u.items.forEach((i) => { if (i === cd.fut || (i.d && i.d > t0)) return; const f = store.frac(i.key, i.eps); if (f >= 0.999) return; left++; const m = store.meta(i.key) || {}; min += (1 - f) * (i.k === 'movie' ? (m.rt || RT.movie) : (i.eps || m.tot || 8) * RT.ep); });
    const per = min / days, bg = img(cd.fut.b, 'w780');
    tiles.push('<a class="hx-e hx-cd" href="#/universe/' + cd.u.id + '">' + (bg ? '<img class="bg" src="' + bg + '" alt="">' : '') + '<span class="bd">Cuenta regresiva</span><span class="tx"><span class="big"><b>' + days + '</b><i>' + (days === 1 ? 'día' : 'días') + ' para</i></span><strong>' + esc(cd.fut.t) + '</strong>' +
      '<span class="thr"><u style="width:' + Math.round(cd.s.f * 100) + '%"></u></span><small>' + (left ? left + (left === 1 ? ' título' : ' títulos') + ' · ' + dur(min) + ' · ' + dur(per) + '/día' : 'Todo lo anterior, visto') + '</small></span></a>');
  }
  up.filter((x) => !cd || !(x.type === cd.fut.k && x.id === cd.fut.id)).slice(0, 5).forEach((x) => {
    const dd = daysUntil(x.date), mo = x.date.split('-')[1], d = x.date.split('-')[2], bg = img(x.b, 'w780');
    tiles.push('<a class="hx-e" href="#/' + x.type + '/' + x.id + '">' + (bg ? '<img class="bg" src="' + bg + '" alt="">' : '') + '<span class="bd"><b>' + (+d) + '</b> ' + MES[+mo - 1] + '</span><span class="tx"><strong>' + esc(x.title) + '</strong><small>' + esc(x.sub) + ' · ' + (dd === 0 ? 'hoy' : dd === 1 ? 'mañana' : 'en ' + dd + ' días') + '</small></span></a>');
  });
  if (tiles.length) parts.push(rowTitle('Lo que viene') + '<div class="hm-row hx-rail">' + tiles.join('') + '</div>');

  /* ---- seguir viendo ---- */
  const wk = store.weekStats();
  if (prog.length) {
    const week = wk.n ? 'Esta semana: ' + (wk.eps ? wk.eps + (wk.eps === 1 ? ' cap.' : ' caps.') : '') + (wk.eps && wk.movies ? ' + ' : '') + (wk.movies ? wk.movies + (wk.movies === 1 ? ' peli' : ' pelis') : '') + ' · ' + dur(wk.mins) : '';
    const cards = prog.slice(0, 8).map((k) => {
      const m = store.meta(k), f = store.frac(k), days = (Date.now() - (S.last[k] || 0)) / 864e5;
      const fh = '#/' + m.type + '/' + m.id + '?go=next';
      return '<div class="hx-c"><a class="im" href="' + fh + '">' + (m.b ? '<img src="' + img(m.b, 'w780') + '" alt="">' : '') + '<div class="pb"><u style="width:' + Math.round(f * 100) + '%"></u></div></a>' + goBtn('pl', best(m.type, m.id, nextSync(k)), fh, m.type, m.id, m.t) + '<a class="tt" href="' + fh + '">' +
        '<b>' + esc(m.t) + '</b><small><span data-hxnx="' + k + '">&nbsp;</span></small><small class="ago' + (days >= 14 ? ' stale' : '') + '">' + (days >= 14 ? 'Hace ' + Math.floor(days) + ' días que no la ves' : S.last[k] ? 'La viste ' + ago(S.last[k]) : '') + '</small></a></div>';
    }).join('');
    parts.push(rowTitle('Seguir viendo', week) + '<div class="hm-row">' + cards + '</div>');
  }

  /* ---- para vos: una sola fila, con el motivo bajo cada título ---- */
  try {
    const picks = (await taste.suggestions(U, 12)).filter((f) => f.info.p);
    if (picks.length) parts.push(rowTitle('Para vos') + '<div class="hm-row">' + picks.map((f) => '<div class="hx-pt"><a class="im" href="#/' + f.type + '/' + f.id + '"><img src="' + img(f.info.p, 'w342') + '" alt="" loading="lazy"></a>' + goBtn('go', best(f.type, f.id), null, f.type, f.id, f.info.t) + '<a class="nm" href="#/' + f.type + '/' + f.id + '">' + esc(f.info.t) + '</a><small class="why">' + esc(f.reason.replace(/^Porque seguís /, 'Por ').replace(/^Es parte de /, 'De ')) + '</small></div>').join('') + '</div>');
  } catch (e) { /* sin sugerencias */ }

  /* ---- una sola fila con tres pestañas: plataformas · tu lista · tendencias ---- */
  const my = S.plat || [], region = S.region || 'UY';
  const tab = { plat: [], list: [], trend: [] }, seen = new Set();
  await Promise.all([
    api.trending().then((r) => { (r.results || []).forEach((x) => { const type = x.media_type || (x.title ? 'movie' : 'tv'), k = type + ':' + x.id; if (!x.poster_path || store.frac(k) >= 0.999 || (S.hide || {})[k] || tab.trend.length >= 10) return; tab.trend.push({ type, id: x.id, t: x.title || x.name, p: img(x.poster_path, 'w342') }); }); }).catch(() => {}),
    ...my.flatMap((name) => ['tv', 'movie'].map((type) => api.discover(type, platId(name), region).then((r) => { (r.results || []).slice(0, 8).forEach((x) => { const k = type + ':' + x.id; if (!x.poster_path || seen.has(k) || store.frac(k) >= 0.999) return; seen.add(k); tab.plat.push({ type, id: x.id, t: x.title || x.name, p: img(x.poster_path, 'w342'), plat: { name, short: platName(name) }, pop: x.popularity || 0 }); }); }).catch(() => {})))
  ]);
  tab.plat.sort((a, b) => b.pop - a.pop); tab.plat = tab.plat.slice(0, 14);
  store.listed().slice(0, 12).forEach((k) => { const m = store.meta(k); if (m && m.p) tab.list.push({ type: m.type, id: m.id, t: m.t, p: img(m.p, 'w342'), y: m.y }); });
  const NAMES = { plat: 'Plataformas', list: 'Tu lista', trend: 'Tendencias' };
  const order = ['plat', 'list', 'trend'].filter((k) => tab[k].length || (k === 'plat' && !my.length));
  if (order.length) {
    const tile = (k, x) => '<div class="hx-pt"><a class="im" href="#/' + x.type + '/' + x.id + '"><img src="' + x.p + '" alt="" loading="lazy"></a>' + goBtn('go', k === 'plat' ? { url: platUrl(x.plat.name, x.t, x.type, x.id), short: x.plat.short } : best(x.type, x.id), null, x.type, x.id, x.t) + '<a class="nm" href="#/' + x.type + '/' + x.id + '">' + esc(x.t) + '</a>' + (k === 'plat' ? '<small>' + esc(x.plat.short) + '</small>' : k === 'list' && x.y ? '<small>' + esc(x.y) + '</small>' : '') + '</div>';
    parts.push('<div class="hx-shelf"><div class="hx-tabs" role="tablist">' + order.map((k, i) => '<button role="tab" data-tab="' + k + '" class="' + (i ? '' : 'on') + '">' + NAMES[k] + '</button>').join('') + '<button class="hx-act" data-hxp>' + (my.length ? 'Cambiar' : 'Elegir') + '</button></div><div class="hm-row" id="hxsh"></div></div>');
    binds.push((el) => {
      const row = el.querySelector('#hxsh'), act = el.querySelector('[data-hxp]');
      const draw = (k) => { row.innerHTML = tab[k].length ? tab[k].map((x) => tile(k, x)).join('') : '<p class="hx-none">' + (k === 'plat' ? (my.length ? 'Nada nuevo en tus plataformas por ahora.' : 'Elegí tus plataformas para ver lo que ya tenés.') : 'Nada por ahora.') + '</p>'; act.hidden = k !== 'plat'; };
      draw(order[0]);
      el.querySelector('.hx-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; el.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === b)); draw(b.dataset.tab); });
      act.addEventListener('click', () => {
        const s = openSheet('<h3>Tus plataformas</h3><div class="ssub">Para mostrarte lo que ya podés ver y abrirlo directo. Se aplica la próxima vez que abras el inicio.</div><div class="hx-chips">' + PLATS.map((p) => '<button class="' + (my.indexOf(p[0]) > -1 ? 'on' : '') + '" data-pl="' + p[0] + '">' + p[1] + '</button>').join('') + '</div><button class="btn pri" style="width:100%;margin-top:14px" data-close>Listo</button>', hue);
        s.el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-pl]'); if (!b) return; const i = my.indexOf(b.dataset.pl); if (i > -1) my.splice(i, 1); else my.push(b.dataset.pl); S.plat = my; store.save(); b.classList.toggle('on'); act.textContent = my.length ? 'Cambiar' : 'Elegir'; });
      });
    });
  }

  return {
    html: parts.join(''),
    bind(el) {
      binds.forEach((f) => f(el));
      // "T2 · E5 · título" de cada serie en curso; si hay imagen del capítulo, reemplaza al fondo
      el.querySelectorAll('[data-hxnx]').forEach(async (n) => {
        try {
          const ne = await nextEpisode(n.dataset.hxnx); if (!n.isConnected) return;
          n.textContent = !ne ? 'Al día' : ne.upcoming ? 'Próximo ' + epLabel(ne.s, ne.e) : epLabel(ne.s, ne.e) + (ne.name ? ' · ' + ne.name : '');
          const still = ne && ne.still ? img(ne.still, 'w300') : '', im = still && n.closest('.hx-c').querySelector('.im img'); if (im) im.src = still;
        } catch (e) { n.textContent = ''; }
      });
    }
  };
}
