// Universos: un universo por pantalla; adentro, la lista arranca en "Estoy aquí" y los anteriores quedan plegados.
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import { openSheet } from './sheet.js';
import { esc, ic, img, fmtDate, daysUntil, hueOf, toast, $, $$ } from './ui.js';

export const tab = 'universes';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const locked = (i) => !!(i.d && i.d > store.today());
const frac = (i) => store.frac(i.key, i.eps);
const hereOf = (ord) => ord.find((i) => !locked(i) && frac(i) < 0.999);
function stats(items) { const rel = items.filter((i) => !locked(i)); let done = 0, part = 0, sum = 0; rel.forEach((i) => { const f = frac(i); sum += f; if (f >= 0.999) done++; else if (f > 0) part++; }); return { done, part, total: rel.length, f: rel.length ? sum / rel.length : 0 }; }
const meta = (i, role) => (locked(i) ? 'Estreno ' + fmtDate(i.d) : [i.k === 'movie' ? 'Película' : 'Serie', role ? role.label : (i.rl || ''), i.o ? 'Opcional' : '', i.y].filter(Boolean).join(' · '));
const firstSentence = (t) => { const m = /^.*?[.!?](\s|$)/.exec(t || ''); return (m ? m[0] : t || '').trim(); };
const checkSvg = ic('check', 16, 3);
const goBack = () => { if (history.length > 1) history.back(); else location.hash = '#/universes'; };

// Imagen vertical sin texto del título de portada; si no hay, el fondo horizontal.
async function artOf(cover) {
  if (!cover) return '';
  const a = await api.heroAssets(cover.k, cover.id);
  return a.poster || img(cover.b, 'w1280') || img(cover.p, 'w780') || '';
}
// Guardar / quitar un universo entero de la lista
function toggleUni(id, items) {
  if (store.uniSaved(id)) { const n = store.unsaveUni(id); toast(n ? 'Quité ' + n + ' títulos de tu lista' : 'Universo quitado'); return false; }
  const n = store.saveUni(id, items); toast(n ? 'Guardé el universo: ' + n + ' títulos en tu lista' : 'Universo guardado'); return true;
}
async function setDone(i, on) {
  if (i.k === 'movie') { store.rememberItem(i); store.setMovie(i.key, on); return; }
  if (!on) { store.unmarkAll(i.key); return; }
  try { const d = await api.tv(i.id); store.remember('tv', d); store.markAll(i.key); } catch (e) { toast('Sin conexión: no pude marcar ' + i.t); }
}

/* ---------- hoja rápida de un título del universo ---------- */
function openItem(U, i, ord, refresh) {
  const done = frac(i) >= 0.999, role = data.roleOf(U, i.key), note = data.noteOf(U, i.key);
  const s = openSheet('<div class="us"><div class="us-h">' + (i.p ? '<img src="' + img(i.p, 'w342') + '" alt="">' : '<span></span>') + '<div><h3>' + esc(i.t) + '</h3><div class="usm">' + esc(meta(i, role)) + '</div></div></div>' + (note ? '<p class="us-n">' + esc(note) + '</p>' : '') + '<p class="us-s" id="uss">&nbsp;</p>' +
    '<a class="btn pri" href="#/' + i.k + '/' + i.id + '" data-close style="width:100%;margin-top:6px">Ver ficha</a>' +
    (locked(i) ? '' : '<button class="btn glass" data-act="upto" style="width:100%;margin-top:8px">Marcar todo hasta acá</button><button class="btn glass" data-act="tog" style="width:100%;margin-top:8px">' + (done ? 'Marcar como no visto' : 'Marcar como visto') + '</button>') + '</div>', U.hue);
  api.details(i.k, i.id).then((d) => { const p = $('#uss', s.el); if (p) p.textContent = d.overview || 'Sin sinopsis disponible.'; }).catch((e) => { const p = $('#uss', s.el); if (p) p.textContent = e.code === 'offline' ? 'Sin conexión: la sinopsis no está disponible ahora.' : 'Sin sinopsis disponible.'; });
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'tog') { await setDone(i, !done); s.close(); refresh(); }
    if (b.dataset.act === 'upto') {
      toast('Marcando…'); const stop = ord.indexOf(i);
      await Promise.all(ord.slice(0, stop + 1).filter((x) => !locked(x) && frac(x) < 0.999).map((x) => setDone(x, true)));
      s.close(); refresh(); toast('Marcado todo hasta “' + i.t + '”');
    }
  });
}

/* ---------- hoja "Cómo verlo": los órdenes disponibles y por qué ---------- */
function openOrders(U, cur, pick) {
  const mo = data.metaOf(U);
  const opts = mo.opts.map((o) => '<button class="og' + (o.id === cur ? ' on' : '') + '" data-o="' + o.id + '"><div><b>' + o.label + (o.rec ? '<em>Recomendado</em>' : '') + '</b><small>' + esc(o.why) + '</small></div>' + ic('check', 18, 2.6) + '</button>').join('');
  const no = mo.no.map((o) => '<div class="og no"><div><b>' + o.label + '<em class="gr">No disponible</em></b><small>' + esc(o.why) + '</small></div></div>').join('');
  const s = openSheet('<h3>Cómo verlo</h3><div class="ssub">Elegí el orden. Las recomendaciones están armadas a mano y pueden discutirse.</div><div class="ogs">' + opts + no + '</div>', U.hue);
  s.el.addEventListener('click', (e) => { const b = e.target.closest('[data-o]'); if (!b) return; pick(b.dataset.o); s.close(); });
}

/* ---------- detalle de un universo ---------- */
export async function mountCuratedUniverse(el, { id }) {
  let D; try { D = await data.load(); } catch (e) { el.innerHTML = '<div class="empty" style="padding-top:140px"><b>No pude cargar los universos</b>Probá de nuevo en un rato.</div>'; return; }
  const u = D.byId[id];
  if (!u) { el.innerHTML = '<div class="empty" style="padding-top:140px"><b>Universo no encontrado</b><a class="btn glass" href="#/universes">Ver universos</a></div>'; return; }
  return render(el, { id: u.id, title: u.title, sub: u.sub, modes: u.modes, meta: u.meta, items: u.items, cover: u.cover, hue: data.uhue(u) });
}

export async function mountCollection(el, { id }) {
  el.innerHTML = '<div class="empty" style="padding-top:140px"><div class="skel"><i></i><i></i></div></div>';
  let c; try { c = await api.collection(id); } catch (e) { el.innerHTML = '<div class="empty" style="padding-top:140px"><b>' + (e.code === 'offline' ? 'Sin conexión' : 'No pude cargar la colección') + '</b><a class="btn glass" href="#/universes">Volver</a></div>'; return; }
  if (!el.isConnected) return;
  const items = (c.parts || []).map((p) => ({ key: 'movie:' + p.id, k: 'movie', id: p.id, t: p.title, y: (p.release_date || '').slice(0, 4), d: p.release_date || null, p: p.poster_path, b: p.backdrop_path }))
    .sort((a, b) => (a.d || '9').localeCompare(b.d || '9'));
  const cover = items.find((i) => i.b) || items[0];
  return render(el, { id: 'c' + id, title: c.name.replace(/ (Collection|Colección)$/i, ''), sub: 'Colección de TMDB · en orden de estreno', modes: false, meta: null, items, cover, hue: cover ? hueOf([], cover.id) : 215 });
}

async function render(el, U) {
  const root = document.documentElement;
  const S = store.state(); S.uorder = S.uorder || {};
  let mode = data.prefOrder(U, S.uorder[U.id]), pend = false, openPrev = false;
  const art = await artOf(U.cover); if (!el.isConnected) return;
  root.classList.add('nd', 'nd-full'); el.style.setProperty('--h', U.hue); root.style.setProperty('--h', U.hue);
  const order = () => data.sequence(U, mode);
  const soon = () => U.items.filter(locked).sort((a, b) => a.d.localeCompare(b.d))[0];

  el.innerHTML = '<div id="top"></div><div id="body"></div><p class="hm-attr pad" style="margin-top:20px">' + (U.meta ? 'Los órdenes y los tipos de historia son una curaduría y pueden discutirse.' : '') + '</p>';
  const topEl = $('#top', el), bodyEl = $('#body', el);
  const back = '<button class="gbtn backbtn" data-a="back" aria-label="Volver">' + ic('back', 22, 2) + '</button>';

  // el hilo: qué tramos están encendidos (un título visto y el siguiente visto o actual)
  let lit = {}, idx = new Map(), firstI = null, lastI = null;
  const row = (i, here) => {
    const f = frac(i), lk = locked(i), role = data.roleOf(U, i.key);
    const node = lk ? '<span class="un-ck lk">' + ic('lock', 16, 2) + '</span>' : '<button class="un-ck" data-a="ck" data-key="' + i.key + '" aria-label="' + (f >= 0.999 ? 'Marcar como no visto' : 'Marcar como visto') + '">' + (f >= 0.999 ? checkSvg : '') + '</button>';
    return '<div class="un-row' + (f >= 0.999 ? ' done' : '') + (here ? ' here' : '') + (lit[i.key + 'u'] ? ' tu' : '') + (lit[i.key + 'd'] ? ' td' : '') + (i === firstI ? ' t0' : '') + (i === lastI ? ' t1' : '') + '" style="--i:' + Math.min(idx.get(i.key) || 0, 14) + '" data-key="' + i.key + '">' + node + '<button class="un-it" data-a="item" data-key="' + i.key + '">' + (i.p ? '<img src="' + img(i.p, 'w185') + '" alt="" loading="lazy">' : '<span class="np"></span>') +
      '<div><b>' + esc(i.t) + '</b><small>' + esc(meta(i, role)) + (i.k === 'tv' && f > 0 && f < 0.999 ? ' · ' + store.countWatched(i.key) + ' / ' + (((store.meta(i.key) || {}).tot) || i.eps || '?') : '') + '</small>' + (here ? '<em>Estoy aquí</em>' : '') + '</div></button></div>';
  };

  // en "Por tipo de historia" cada grupo lleva su título
  const rows = (arr, here) => { let last = null; return arr.map((i) => { const r = mode === 'role' ? data.roleOf(U, i.key) : null; const h = r && r.id !== last ? '<h3 class="un-gh">' + r.label + '</h3>' : ''; last = r ? r.id : last; return h + row(i, i === here); }).join(''); };
  function draw() {
    const ord = order(), here = hereOf(ord), s = stats(U.items), sn = soon(), dd = sn ? daysUntil(sn.d) : null;
    const mt = s.done + ' de ' + s.total + ' vistos' + (sn && dd != null && dd >= 0 ? ' · ' + (dd === 0 ? 'hoy' : dd === 1 ? 'mañana' : 'en ' + dd + ' días') + ' llega ' + sn.t : '');
    const cont = here ? '<div class="pri-row"><button class="btn pri" data-a="cont">' + ic('play', 18) + '<span class="ell">Seguir · ' + esc(here.t) + '</span></button></div>' : '<div class="pri-row"><button class="btn pri" disabled>Al día</button></div>';
    const modeBtn = '<button class="ab" data-a="mode">' + ic('uni', 24) + '<span>' + data.ORDER_LABEL[mode] + '</span></button>';
    const mo = data.metaOf(U), curOpt = mo.opts.find((o) => o.id === mode) || mo.opts[0];
    const pendBtn = '<button class="ab' + (pend ? ' on' : '') + '" data-a="pend">' + ic('check', 24) + '<span>' + (pend ? 'Solo pendientes' : 'Todos') + '</span></button>';
    const shown = pend ? ord.filter((i) => frac(i) < 0.999) : ord;
    lit = {}; idx = new Map(); firstI = shown[0] || null; lastI = shown[shown.length - 1] || null;
    shown.forEach((x, n) => { idx.set(x.key, n); const nx = shown[n + 1]; if (nx && frac(x) >= 0.999 && (frac(nx) >= 0.999 || nx === here)) { lit[x.key + 'd'] = 1; lit[nx.key + 'u'] = 1; } });
    const hi = here ? shown.indexOf(here) : -1;
    const sv = store.uniSaved(U.id), saveBtn = '<button class="ab sv' + (sv ? ' on' : '') + '" data-a="save">' + ic('mark', 24) + '<span>' + (sv ? 'Guardado' : 'Guardar') + '</span></button>';
    topEl.innerHTML = '<div class="un-hero">' + back + '<div class="fs-in"><div class="kk">' + (U.id[0] === 'c' && /^c\d+$/.test(U.id) ? 'Colección' : 'Universo') + '</div><h1 class="un-title">' + esc(U.title) + '</h1><div class="mt">' + esc(mt) + '</div>' + cont + '<div class="acts3">' + modeBtn + pendBtn + saveBtn + '</div></div></div>';
    const before = hi > 0 ? shown.slice(0, hi) : [], after = hi >= 0 ? shown.slice(hi) : shown;
    bodyEl.innerHTML = '<div class="pad un-list"><button class="un-why" data-a="mode"><span>' + (curOpt.rec ? '<b>Orden recomendado.</b> ' : '<b>' + curOpt.label + '.</b> ') + esc(firstSentence(curOpt.why)) + '</span>' + ic('chev', 16) + '</button>' +
      (before.length ? '<button class="un-prev" data-a="prev"><span>' + (openPrev ? 'Ocultar' : 'Ver') + ' los ' + before.length + ' anteriores</span>' + ic('chev', 16) + '</button>' + (openPrev ? rows(before, null) : '') : '') + rows(after, here) + '</div>';
  }
  draw();

  // la imagen es el fondo de TODA la pantalla: nítida arriba y, al bajar, una copia desenfocada y oscura la reemplaza
  const fsEl = document.createElement('div'); fsEl.className = 'fs-bg'; fsEl.innerHTML = '<img class="a" src="' + art + '" alt=""><img class="b" src="' + art + '" alt=""><i></i>'; document.body.appendChild(fsEl);
  const A = $('.a', fsEl), B = $('.b', fsEl); let raf = 0;
  const upd = () => { raf = 0; const hero = $('.un-hero', el), p = clamp(window.scrollY / Math.max(1, (hero ? hero.offsetHeight : 600) * 0.62), 0, 1); B.style.opacity = p; A.style.transform = 'scale(' + (1 + p * 0.06) + ')'; };
  const fsFn = () => { if (!raf) raf = requestAnimationFrame(upd); }; window.addEventListener('scroll', fsFn, { passive: true }); upd();

  el.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-a]'); if (!a) return; const act = a.dataset.a, ord = order();
    if (act === 'back') return goBack();
    if (act === 'mode') return openOrders(U, mode, (id) => { mode = id; S.uorder[U.id] = id; store.save(); draw(); });
    if (act === 'pend') { pend = !pend; return draw(); }
    if (act === 'save') { toggleUni(U.id, U.items); return draw(); }
    if (act === 'prev') { openPrev = !openPrev; return draw(); }
    const i = U.items.find((x) => x.key === a.dataset.key);
    if (act === 'cont') { const h = hereOf(ord); if (h) location.hash = '#/' + h.k + '/' + h.id + '?go=next'; return; }
    if (act === 'item' && i) return openItem(U, i, ord, draw);
    if (act === 'ck' && i) { await setDone(i, frac(i) < 0.999); return draw(); }
  });
  return () => { window.removeEventListener('scroll', fsFn); fsEl.remove(); root.classList.remove('nd', 'nd-full'); };
}

/* ---------- pestaña Universos: un universo por pantalla ---------- */
export async function mountList(el) {
  if (!store.state().key) { location.hash = '#/setup'; return; }
  let D; try { D = await data.load(); } catch (e) { D = { universes: [], byKey: {} }; }
  const S = store.state(), root = document.documentElement;
  const panels = D.universes.map((u) => ({ href: '#/universe/' + u.id, title: u.title, sub: u.sub, id: u.id, items: u.items, here: hereOf(data.sequence(u, data.prefOrder(u, (S.uorder || {})[u.id]))), s: stats(u.items), cover: u.cover, hue: data.uhue(u) }));
  // colecciones de TMDB que se detectan solas (películas que seguís y tienen secuelas)
  const known = new Set(); D.universes.forEach((u) => u.items.forEach((i) => known.add(i.key)));
  const colls = {};
  Object.keys(S.meta).filter((k) => store.tracked(k)).forEach((k) => { const m = S.meta[k]; if (m.type === 'movie' && m.coll && !known.has(k)) colls[m.coll.id] = m.coll; });
  Object.values(colls).forEach((c) => panels.push({ id: 'c' + c.id, coll: c.id, href: '#/collection/' + c.id, title: c.name.replace(/ (Collection|Colección)$/i, ''), sub: 'Colección de TMDB', here: null, s: null, art: img(c.b, 'w1280') || img(c.p, 'w780'), hue: (c.id * 47) % 360 }));
  // primero lo que ya empezaste o guardaste
  const hot = (p) => ((p.s && p.s.f > 0) || store.uniSaved(p.id) ? 1 : 0);
  panels.sort((a, b) => hot(b) - hot(a) || ((b.s ? b.s.f : 0) - (a.s ? a.s.f : 0)));
  await Promise.all(panels.map(async (p) => { if (!p.art) p.art = await artOf(p.cover); }));
  if (!el.isConnected) return;
  root.classList.add('nd', 'nd-full', 'snapy'); el.style.setProperty('--h', panels[0] ? panels[0].hue : 215); root.style.setProperty('--h', panels[0] ? panels[0].hue : 215);
  const sub = (p) => (store.uniSaved(p.id) ? 'Guardado · ' : '') + (!p.s ? p.sub : p.s.done || p.s.part ? p.s.done + ' de ' + p.s.total + ' vistos' : p.s.total + ' títulos');

  el.innerHTML = '<div class="hm-brand">' + ic('uni', 20, 2) + '<span>Universos</span></div>' + panels.map((p, i) => '<section class="un-pan" data-i="' + i + '"><div class="fs-in"><div class="kk">' + esc(sub(p)) + '</div><h2 class="un-title">' + esc(p.title) + '</h2><div class="mt">' + (p.here ? 'Sigue: ' + esc(p.here.t) : esc(p.sub || '')) + '</div><div class="pri-row"><a class="btn pri" href="' + p.href + '">Abrir</a></div><div class="acts3"><button class="ab sv' + (store.uniSaved(p.id) ? ' on' : '') + '" data-a="save" data-i="' + i + '">' + ic('mark', 24) + '<span>' + (store.uniSaved(p.id) ? 'Guardado' : 'Guardar universo') + '</span></button></div></div></section>').join('');
  // guardar un universo entero desde la lista (las colecciones de TMDB se bajan en ese momento)
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a="save"]'); if (!b) return; const p = panels[+b.dataset.i]; if (!p) return;
    let items = p.items;
    if (!items && !store.uniSaved(p.id)) {
      try { const c = await api.collection(p.coll); items = (c.parts || []).map((x) => ({ key: 'movie:' + x.id, k: 'movie', id: x.id, t: x.title, y: (x.release_date || '').slice(0, 4), d: x.release_date || null, p: x.poster_path, b: x.backdrop_path })); } catch (err) { toast('Sin conexión: no pude guardar la colección'); return; }
    }
    const on = toggleUni(p.id, items || []);
    b.classList.toggle('on', on); b.querySelector('span').textContent = on ? 'Guardado' : 'Guardar universo';
    const kk = b.closest('.fs-in').querySelector('.kk'); if (kk) kk.textContent = sub(p);
  });
  const fsEl = document.createElement('div'); fsEl.className = 'fs-bg';
  fsEl.innerHTML = panels.map((p, i) => '<div class="sl' + (i ? '' : ' on') + '"><img class="a" data-src="' + p.art + '" alt=""></div>').join('') + '<i></i>'; document.body.appendChild(fsEl);
  const sl = $$('.sl', fsEl); let raf = 0, k0 = -1;
  // las imágenes se cargan de a poco: la actual y las vecinas
  const warm = (k) => { [k - 1, k, k + 1].forEach((j) => { const im = sl[j] && $('.a', sl[j]); if (im && !im.getAttribute('src')) im.setAttribute('src', im.dataset.src); }); };
  const upd = () => { raf = 0; const k = clamp(Math.round(window.scrollY / Math.max(1, window.innerHeight)), 0, sl.length - 1); if (k === k0) return; k0 = k; warm(k); sl.forEach((s, i) => s.classList.toggle('on', i === k)); };
  const fn = () => { if (!raf) raf = requestAnimationFrame(upd); }; window.addEventListener('scroll', fn, { passive: true }); upd();
  return () => { window.removeEventListener('scroll', fn); fsEl.remove(); root.classList.remove('nd', 'nd-full', 'snapy'); };
}
