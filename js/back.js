// Aviso al volver: si abriste algo en una plataforma desde Hilo, al regresar te pregunta si lo viste y lo marca con un toque.
// Solo avisa si pasó el tiempo suficiente como para haberlo mirado (más de un minuto y medio y menos de 12 horas).
import * as store from './store.js';
import * as api from './api.js';
import { nextEpisode } from './progress.js';
import { openSheet } from './sheet.js';
import { rememberPref } from './platform.js';
import { esc, ic, img, epLabel, toast, $ } from './ui.js';

const MIN = 90e3, MAX = 12 * 3600e3;
let busy = false;

const clear = () => { const S = store.state(); delete S.pend; store.save(); const b = $('#bk'); if (b) b.remove(); };

async function ask() {
  const S = store.state(), p = S.pend; if (!p || busy || $('#bk')) return;
  const dt = Date.now() - p.at;
  if (dt > MAX) return clear();
  if (dt < MIN) return;
  busy = true;
  try {
    const k = p.type + ':' + p.id; let m = store.meta(k), ne = null;
    if (!m) { try { store.remember(p.type, await api[p.type](p.id)); m = store.meta(k); } catch (e) { /* sin red */ } }
    if (p.type === 'tv') {
      if (!m) return clear();
      try { ne = await nextEpisode(k); } catch (e) { /* sin red */ }
      if (!ne || ne.upcoming) return clear(); // al día o sin capítulo nuevo: no hay nada que preguntar
    } else if (store.isMovieWatched(k)) return clear();
    const title = (m && m.t) || p.t, poster = m && m.p ? img(m.p, 'w185') : '';
    const q = p.type === 'tv' ? '¿Viste ' + epLabel(ne.s, ne.e) + '?' : '¿Viste la película?';
    const el = document.createElement('div'); el.id = 'bk'; el.className = 'bk'; el.setAttribute('role', 'dialog');
    el.innerHTML = '<div class="bk-in">' + (poster ? '<img src="' + poster + '" alt="">' : '') + '<div><b>' + esc(q) + '</b><small>' + esc(title) + '</small></div></div>' +
      '<div class="bk-a"><button class="btn pri" data-y>' + ic('check', 16, 2.6) + 'Sí, marcarlo</button>' + (p.type === 'tv' ? '<a class="btn glass" data-more href="#/tv/' + p.id + '?go=next">Vi más</a>' : '') + '<button class="btn glass" data-n>No</button></div>';
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-y]')) {
        if (p.type === 'tv') { store.setEp(k, ne.s, ne.e, true); toast('Marcado ' + epLabel(ne.s, ne.e) + ' de ' + title); }
        else { store.rememberItem({ k: 'movie', id: p.id, t: title, p: null, b: null, d: '', y: '', eps: 0 }); store.setMovie(k, true); toast('Marcada como vista: ' + title); }
        clear(); window.dispatchEvent(new HashChangeEvent('hashchange')); // refresca la pantalla actual
      } else if (e.target.closest('[data-more]')) clear();
      else if (e.target.closest('[data-n]')) clear();
    });
  } finally { busy = false; }
}

/* ---------- ¿dónde verlo? ---------- */
const note = (type, id, title) => { const S = store.state(); S.pend = { type, id: +id, t: title || '', at: Date.now() }; store.save(); };

function choose(type, id, title, opts) {
  const sh = openSheet('<h3>¿Dónde lo ves?</h3><div class="ssub">' + esc(title) + '</div><div class="ch-list">' + opts.map((o, i) =>
    '<a class="ch-r" href="' + esc(o.u) + '" target="_blank" rel="noopener" data-plat="' + type + ':' + id + '" data-pt="' + esc(title) + '" data-pn="' + esc(o.n) + '" data-chosen="1" data-close>' + ic('play', 18) + '<span>' + esc(o.s) + '</span>' + (i === 0 && (store.state().pref || {})[type + ':' + id] === o.n ? '<em>La última vez</em>' : '') + '</a>').join('') + '</div>', null);
  return sh;
}

// abre el título en tu plataforma; si hay más de una, pregunta dónde (desde un botón que no es un enlace)
export function launch(type, id, title, opts) {
  if (!opts || !opts.length) return false;
  if (opts.length > 1) { choose(type, id, title, opts.map((o) => ({ n: o.name, s: o.short, u: o.url }))); return true; }
  const a = document.createElement('a'); a.href = opts[0].url; a.target = '_blank'; a.rel = 'noopener'; a.dataset.plat = type + ':' + id; a.dataset.pt = title; a.dataset.pn = opts[0].name; a.dataset.chosen = '1';
  a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500);
  return true;
}

export function initBack() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[data-plat]'); if (!a) return;
    const [type, id] = a.dataset.plat.split(':');
    // más de una plataforma: primero se elige
    if (a.dataset.opts && !a.dataset.chosen) {
      let opts = null; try { opts = JSON.parse(decodeURIComponent(a.dataset.opts)); } catch (err) { /* se abre el primero */ }
      if (opts && opts.length > 1) { e.preventDefault(); e.stopPropagation(); choose(type, id, a.dataset.pt || '', opts); return; }
    }
    // se anota qué era y cuándo, para preguntar si lo viste al volver
    note(type, id, a.dataset.pt);
    if (a.dataset.pn) rememberPref(type, id, a.dataset.pn);
  }, true);
  const check = () => { if (!document.hidden) ask(); };
  document.addEventListener('visibilitychange', check);
  window.addEventListener('pageshow', check);
  setTimeout(check, 1800); // por si iOS cerró la app mientras mirabas
}
