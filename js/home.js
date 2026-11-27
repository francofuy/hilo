// Inicio: portadas a pantalla completa que rotan al azar. Mezclan lo que tenés en curso (con Retomar y
// Anteriormente) y sugerencias según tu gusto (con Ver ficha, Mi lista y No me interesa).
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import * as taste from './taste.js';
import * as hmx from './hmx.js';
import { nextEpisode } from './progress.js';
import { openRecap } from './sheet.js';
import { esc, ic, img, epLabel, fmtDate, hueOf, $, $$ } from './ui.js';

export const tab = 'home';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const typeName = (t) => (t === 'tv' ? 'Serie' : 'Película');
const route = (m) => '#/' + m.type + '/' + m.id;
const logoOrTitle = (a, title) => (a.logo ? '<img class="lg" src="' + a.logo + '" alt="' + esc(title) + '">' : '<h2 class="dtitle nt">' + esc(title) + '</h2>');

export async function mount(el) {
  const S = store.state();
  if (!S.key) { location.hash = '#/setup'; return; }
  let U; try { U = await data.load(); } catch (e) { U = { universes: [], byKey: {}, byId: {} }; }
  const keys = (store.inProgress().length ? store.inProgress() : store.listed()).slice(0, 3);
  const [items, fresh] = await Promise.all([
    Promise.all(keys.map(async (k) => {
      const m = store.meta(k), a = await api.heroAssets(m.type, m.id);
      if (!a.poster && m.tp) a.poster = img(m.tp, 'w780'); // lo recordado sirve cuando no hay red
      if (!a.logo && m.lg) a.logo = img(m.lg, 'w500');
      return { k, m, a, ps: a.poster || img(m.b, 'w1280') || img(m.p, 'w780') };
    })),
    taste.suggestions(U, 3).catch(() => [])
  ]);
  if (!el.isConnected) return;
  const root = document.documentElement;
  root.classList.add('nd', 'nd-full');
  const hue = items[0] ? hueOf(items[0].m.g, items[0].m.id) : 215;
  el.style.setProperty('--h', hue); root.style.setProperty('--h', hue);

  /* ---------- portadas ---------- */
  const slidesData = taste.mixSlides(
    items.filter((x) => x.ps).map((x) => ({ kind: 'resume', key: x.k, m: x.m, a: x.a, ps: x.ps })),
    fresh.map((f) => ({ kind: 'new', key: f.key, f, a: f.a, ps: f.src })));
  const slides = slidesData.map((s) => {
    if (s.kind === 'resume') {
      return '<div class="hm-sl" data-key="' + s.key + '"><div class="fs-in"><div class="kk">Seguir viendo</div><a href="' + route(s.m) + '?go=next">' + logoOrTitle(s.a, s.m.t) + '</a><div class="mt" data-nx="' + s.key + '">&nbsp;</div>' +
        '<div class="pri-row"><a class="btn pri" href="' + route(s.m) + '?go=next">' + ic('play', 18) + 'Retomar</a></div>' +
        '<div class="acts3"><button class="ab" data-recap="' + s.key + '">' + ic('prev', 24) + '<span>Anteriormente</span></button><button class="ab" data-hxwhat>' + ic('shuffle', 24) + '<span>¿Qué veo?</span></button></div></div></div>';
    }
    const f = s.f, href = '#/' + f.type + '/' + f.id;
    return '<div class="hm-sl" data-key="' + s.key + '"><div class="fs-in"><div class="kk">' + esc(f.reason) + '</div><a href="' + href + '">' + logoOrTitle(f.a, f.info.t) + '</a><div class="mt">' + esc([typeName(f.type), f.info.y].filter(Boolean).join(' · ')) + '</div>' +
      '<div class="pri-row"><a class="btn pri" href="' + href + '">Ver ficha</a></div>' +
      '<div class="acts3"><button class="ab" data-add="' + s.key + '">' + ic('mark', 24) + '<span>Mi lista</span></button><button class="ab" data-hide="' + s.key + '"><span class="x">' + ic('plus', 24) + '</span><span>No me interesa</span></button><button class="ab" data-hxwhat>' + ic('shuffle', 24) + '<span>¿Qué veo?</span></button></div></div></div>';
  }).join('');

  /* ---------- debajo: universos ---------- */
  const uniItems = U.universes.map((u) => ({ u, s: data.stats(u) })).sort((a, b) => (b.s.f > 0 ? 1 : 0) - (a.s.f > 0 ? 1 : 0) || b.s.f - a.s.f).slice(0, 6);
  const uniRow = '<h2 class="hm-h">Universos</h2><div class="hm-row">' + uniItems.map(({ u, s }) => '<a class="hm-u" href="#/universe/' + u.id + '"><div class="th">' + (u.cover && u.cover.b ? '<img src="' + img(u.cover.b, 'w780') + '" alt="" loading="lazy">' : '') + '</div><span>' + esc(u.title) + '</span><em>' + (s.done || s.part ? s.done + ' de ' + s.total : s.total + ' títulos') + '</em></a>').join('') + '</div>';
  const empty = '<div class="hm-empty"><b>Todavía no hay nada para mostrar</b>Buscá una serie o película y tocá Seguir para empezar.</div>';
  const attr = '<p class="hm-attr">Datos e imágenes de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.</p>';
  const brand = '<div class="hm-brand">' + ic('thread', 20, 2) + '<span>Hilo</span>' + (navigator.onLine ? '' : '<em class="off">Sin conexión</em>') + '</div>';

  el.innerHTML = '<div class="hm-hero">' + brand + (slidesData.length > 1 ? '<div class="hm-dots">' + slidesData.map((_, i) => '<i class="' + (i ? '' : 'on') + '"></i>').join('') + '</div>' : '') +
    '<div class="hm-pager" id="pg">' + (slides || '<div class="hm-sl"><div class="fs-in">' + empty + '</div></div>') + '</div></div><div class="pad hm-body"><div class="hx-slot" id="hxslot"></div>' + uniRow + attr + '</div>';

  /* ---------- fondo de pantalla completa ---------- */
  const fsEl = document.createElement('div'); fsEl.className = 'fs-bg';
  fsEl.innerHTML = slidesData.map((x, i) => '<div class="sl' + (i ? '' : ' on') + '" data-key="' + x.key + '"><img class="a" src="' + x.ps + '" alt=""><img class="b" src="' + x.ps + '" alt=""></div>').join('') + '<i></i>';
  document.body.appendChild(fsEl);
  let sl = $$('.sl', fsEl), dots = $$('.hm-dots i', el); const pg = $('#pg', el);
  let act = 0, raf = 0, idle = 0;
  const upd = () => {
    raf = 0; const w = pg.clientWidth || 1; act = clamp(Math.round(pg.scrollLeft / w), 0, Math.max(0, sl.length - 1));
    const hero = $('.hm-hero', el), p = clamp(window.scrollY / Math.max(1, (hero ? hero.offsetHeight : 600) * 0.62), 0, 1);
    sl.forEach((s, i) => { s.classList.toggle('on', i === act); $('.b', s).style.opacity = i === act ? p : 0; $('.a', s).style.transform = 'scale(' + (1 + (i === act ? p * 0.06 : 0)) + ')'; });
    dots.forEach((d, i) => d.classList.toggle('on', i === act));
  };
  const fn = () => { if (!raf) raf = requestAnimationFrame(upd); };
  window.addEventListener('scroll', fn, { passive: true }); pg.addEventListener('scroll', fn, { passive: true }); upd();

  // cambia sola cada pocos segundos; se detiene cuando tocás o cuando la portada no se ve
  const touch = () => { idle = Date.now() + 14000; };
  pg.addEventListener('pointerdown', touch); pg.addEventListener('touchstart', touch, { passive: true });
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timer = reduce ? 0 : setInterval(() => {
    if (document.hidden || Date.now() < idle || window.scrollY > 160 || sl.length < 2) return;
    pg.scrollTo({ left: ((act + 1) % sl.length) * pg.clientWidth, behavior: 'smooth' });
  }, 7500);

  /* ---------- acciones ---------- */
  el.addEventListener('click', (e) => {
    const rc = e.target.closest('[data-recap]'); if (rc) { e.preventDefault(); openRecap(rc.dataset.recap); return; }
    const add = e.target.closest('[data-add]'), hide = e.target.closest('[data-hide]');
    if (e.target.closest('[data-hxwhat]')) { hmx.openWhat(U, hue); touch(); return; }
    if (add) {
      const key = add.dataset.add, f = fresh.find((x) => x.key === key); if (!f) return;
      const on = !store.isFollowed(key);
      store.rememberItem({ k: f.type, id: f.id, t: f.info.t, p: f.info.p, b: f.info.b, d: '', y: f.info.y, eps: 0 }); store.follow(key, on);
      add.classList.toggle('on', on); $('span', add).textContent = on ? 'En tu lista' : 'Mi lista'; add.firstElementChild.outerHTML = ic(on ? 'markok' : 'mark', 24); touch();
    }
    if (hide) {
      const key = hide.dataset.hide; taste.dismiss(key);
      const s = $('.hm-sl[data-key="' + key + '"]', el), bg = $('.sl[data-key="' + key + '"]', fsEl);
      if (s) s.remove(); if (bg) bg.remove();
      sl = $$('.sl', fsEl); const di = $$('.hm-dots i', el); if (di.length) di[di.length - 1].remove(); dots = $$('.hm-dots i', el);
      pg.scrollTo({ left: 0, behavior: 'instant' }); upd();
    }
  });

  /* las secciones de abajo llegan sin frenar las portadas */
  hmx.build(U, hue).then((hx) => { const slot = $('#hxslot', el); if (!slot || !el.isConnected) return; slot.innerHTML = hx.html; hx.bind(el); }).catch(() => {});

  /* "T2 · E5 — título" del próximo capítulo */
  $$('[data-nx]', el).forEach(async (n) => {
    try { const ne = await nextEpisode(n.dataset.nx); if (!el.isConnected) return; n.textContent = !ne ? 'Estás al día' : ne.upcoming ? 'Próximo: ' + (ne.air ? fmtDate(ne.air) : 'sin fecha') : epLabel(ne.s, ne.e) + ' — ' + ne.name; } catch (e) { n.textContent = e.code === 'offline' ? 'Sin conexión' : ''; }
  });
  return () => { window.removeEventListener('scroll', fn); clearInterval(timer); fsEl.remove(); root.classList.remove('nd', 'nd-full'); };
}
