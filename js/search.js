// Buscar: al abrir, una tendencia al azar ocupa toda la pantalla; al escribir, la imagen del primer
// resultado queda de fondo, desenfocada, y los resultados van en filas.
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import * as taste from './taste.js';
import { esc, ic, img, normItem, $ } from './ui.js';

export const tab = 'search';
let lastQ = '', lastF = 'all';
const typeName = (t) => (t === 'tv' ? 'Serie' : 'Película');
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function status(n) {
  const f = store.frac(n.key);
  if (f >= 0.999) return 'Visto';
  if (f > 0) return Math.round(f * 100) + '%';
  return store.isFollowed(n.key) ? 'En tu lista' : '';
}
const row = (n) => '<a class="se-row" href="#/' + n.type + '/' + n.id + '" data-q="1"><span class="th">' + (n.poster ? '<img src="' + img(n.poster, 'w185') + '" alt="" loading="lazy">' : '') + '</span><div><b>' + esc(n.title) + '</b><small>' + esc([typeName(n.type), n.year].filter(Boolean).join(' · ')) + '</small></div><em>' + esc(status(n)) + '</em></a>';
const pcard = (n) => '<a class="hm-p" href="#/' + n.type + '/' + n.id + '">' + (n.poster ? '<img src="' + img(n.poster, 'w342') + '" alt="" loading="lazy">' : '') + '<span>' + esc(n.title) + '</span></a>';
const filters = () => '<div class="se-f">' + [['all', 'Todo'], ['tv', 'Series'], ['movie', 'Películas']].map((f) => '<button data-f="' + f[0] + '" class="' + (lastF === f[0] ? 'on' : '') + '">' + f[1] + '</button>').join('') + '</div>';
const field = () => '<label class="se-field glass" for="q">' + ic('search', 20) + '<input id="q" type="search" placeholder="Series, películas y universos" autocomplete="off" autocapitalize="off" enterkeyhint="search" value="' + esc(lastQ) + '"><button type="button" class="se-x" data-clear aria-label="Borrar" hidden>' + ic('plus', 18).replace('<svg', '<svg style="transform:rotate(45deg)"') + '</button></label>';

export async function mount(el) {
  if (!store.state().key) { location.hash = '#/setup'; return; }
  const S = store.state(), root = document.documentElement;
  let U; try { U = await data.load(); } catch (e) { U = { universes: [], byKey: {}, byId: {} }; }
  const [tr, fresh] = await Promise.all([
    api.trending().then((t) => (t.results || []).filter((r) => r.media_type === 'tv' || r.media_type === 'movie').map((r) => normItem(r))).catch(() => []),
    taste.suggestions(U, 5).catch(() => [])
  ]);
  if (!el.isConnected) return;
  root.classList.add('nd', 'nd-full'); el.style.setProperty('--h', 215); root.style.setProperty('--h', 215);
  S.recent = S.recent || [];
  const artOf = async (n) => { const a = await api.heroAssets(n.type, n.id); return { a, src: a.poster || img(n.backdrop, 'w1280') || img(n.poster, 'w780') }; };

  // tendencia destacada: una al azar que tenga imagen buena
  let feat = null, featArt = null;
  for (const n of [...tr].sort(() => Math.random() - 0.5).slice(0, 6)) { const x = await artOf(n); if (x.a.poster || n.backdrop) { feat = n; featArt = x; break; } }
  if (!feat && tr[0]) { feat = tr[0]; featArt = await artOf(feat); }
  if (!el.isConnected) return;

  const recent = () => S.recent.length ? '<div class="se-h">Recientes <button data-clr>Borrar</button></div><div class="se-rec">' + S.recent.map((q) => '<button data-rq="' + esc(q) + '">' + ic('prev', 18) + '<span>' + esc(q) + '</span></button>').join('') + '</div>' : '';
  const forYou = fresh.length ? '<h2 class="hm-h">Para vos</h2><div class="hm-row">' + fresh.map((f) => '<a class="hm-p" href="#/' + f.type + '/' + f.id + '"><img src="' + f.src + '" alt="" loading="lazy"><span>' + esc(f.info.t) + '</span></a>').join('') + '</div>' : '';
  const idle = '<div class="se-hero"><div class="fs-in">' + (feat ? '<div class="kk">Tendencia esta semana</div><a href="#/' + feat.type + '/' + feat.id + '">' + (featArt.a.logo ? '<img class="lg" src="' + featArt.a.logo + '" alt="' + esc(feat.title) + '">' : '<h2 class="dtitle nt">' + esc(feat.title) + '</h2>') + '</a><div class="mt">' + esc([typeName(feat.type), feat.year].filter(Boolean).join(' · ')) + '</div><div class="pri-row"><a class="btn pri" href="#/' + feat.type + '/' + feat.id + '">Ver ficha</a></div>' : '') + '</div></div>' +
    '<div class="pad se-below">' + forYou + (tr.length ? '<h2 class="hm-h">Tendencias</h2><div class="hm-row">' + tr.slice(0, 12).map(pcard).join('') + '</div>' : '') + recent() + '</div>';
  el.innerHTML = '<div class="se-top">' + field() + '</div><div id="idle">' + idle + '</div><div id="res" hidden></div>';

  /* ---------- fondo ---------- */
  const fsEl = document.createElement('div'); fsEl.className = 'fs-bg';
  const src0 = featArt ? featArt.src : '';
  fsEl.innerHTML = '<img class="a" src="' + src0 + '" alt=""><img class="b" src="' + src0 + '" alt=""><i></i>'; document.body.appendChild(fsEl);
  const fsA = $('.a', fsEl), fsB = $('.b', fsEl); let raf = 0;
  const setArt = (src) => { if (src && fsA.getAttribute('src') !== src) { fsA.setAttribute('src', src); fsB.setAttribute('src', src); } };
  const upd = () => { raf = 0; if (fsEl.classList.contains('dim')) { fsB.style.opacity = 0; return; } const h = $('.se-hero', el), p = Math.max(0, Math.min(1, window.scrollY / Math.max(1, (h ? h.offsetHeight : 600) * 0.62))); fsB.style.opacity = p; };
  const fsFn = () => { if (!raf) raf = requestAnimationFrame(upd); }; window.addEventListener('scroll', fsFn, { passive: true }); upd();

  /* ---------- búsqueda ---------- */
  const inp = $('#q', el), clr = $('[data-clear]', el), resEl = $('#res', el), idleEl = $('#idle', el);
  let seq = 0, timer = 0, last = [];
  const paint = () => {
    const list = last.filter((n) => lastF === 'all' || n.type === lastF);
    const body = !list.length ? '<p class="se-none">' + (last.length ? 'No hay ' + (lastF === 'tv' ? 'series' : 'películas') + ' con ese nombre.' : 'Sin resultados para “' + esc(lastQ) + '”.') + '</p>' : '<div class="se-list">' + list.map(row).join('') + '</div>';
    resEl.innerHTML = '<div class="pad">' + filters() + '</div><div class="pad">' + body + '</div>';
  };
  const run = async (q) => {
    const my = ++seq;
    if (!q) { last = []; resEl.hidden = true; idleEl.hidden = false; clr.hidden = true; fsEl.classList.remove('dim'); if (featArt) setArt(featArt.src); return; }
    clr.hidden = false;
    let r; try { r = await api.search(q); } catch (e) { if (my !== seq) return; resEl.hidden = false; idleEl.hidden = true; resEl.innerHTML = '<p class="se-none pad">' + (e.code === 'offline' ? 'Sin conexión. La búsqueda necesita internet.' : 'No pude buscar.') + '</p>'; return; }
    if (my !== seq) return;
    last = (r.results || []).filter((x) => x.media_type === 'tv' || x.media_type === 'movie').map((x) => normItem(x));
    idleEl.hidden = true; resEl.hidden = false; paint();
    fsEl.classList.add('dim');
    if (last[0]) { const x = await artOf(last[0]); if (my === seq) setArt(x.src); }
    window.scrollTo(0, 0);
  };
  inp.addEventListener('input', () => { lastQ = inp.value.trim(); clearTimeout(timer); timer = setTimeout(() => run(lastQ), 300); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear]')) { inp.value = ''; lastQ = ''; run(''); inp.focus(); return; }
    const f = e.target.closest('[data-f]'); if (f) { lastF = f.dataset.f; paint(); return; }
    const rq = e.target.closest('[data-rq]'); if (rq) { inp.value = rq.dataset.rq; lastQ = rq.dataset.rq; run(lastQ); return; }
    if (e.target.closest('[data-clr]')) { S.recent = []; store.save(); const h = $('.se-h', idleEl); if (h) h.remove(); const rc = $('.se-rec', idleEl); if (rc) rc.remove(); return; }
    if (e.target.closest('a[data-q]') && lastQ) { S.recent = [lastQ, ...S.recent.filter((x) => norm(x) !== norm(lastQ))].slice(0, 5); store.save(); }
  });
  if (lastQ) run(lastQ);
  return () => { clearTimeout(timer); window.removeEventListener('scroll', fsFn); fsEl.remove(); root.classList.remove('nd', 'nd-full'); };
}
