// Helpers de interfaz compartidos.
import { today } from './store.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const IMG = 'https://image.tmdb.org/t/p/';
export const img = (p, size) => (p ? IMG + size + p : '');

const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  uni: '<circle cx="12" cy="12" r="2.4"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(30 12 12)"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  dl: '<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>',
  dlok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  check: '<path d="M5.5 12.5l4.2 4.2L18.5 8"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  prev: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2"/>',
  star: '<path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6-4.5-4.2 6.1-.7z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10a4 4 0 0 1 0 8z"/><path d="M9.5 13.5l2 2 3.5-4"/>',
  cloudoff: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10a4 4 0 0 1 0 8z"/><path d="M4 4l16 16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  mark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  markok: '<path d="M6 3h12v18l-6-4-6 4z"/><path d="M9.5 9l2 2 3.5-4"/>',
  thread: '<path d="M5 19c0-6 14-4 14-14"/><circle cx="5" cy="19" r="1.6"/><circle cx="19" cy="5" r="1.6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4M12 13v4M10 15h4"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'
};
export const ic = (n, s, sw) => '<svg class="ic" width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>';

/* ---------- color por género (TMDB no permite leer los colores de sus imágenes) ---------- */
const GH = { 27: 8, 53: 355, 80: 0, 28: 14, 10759: 20, 12: 34, 16: 300, 35: 48, 99: 170, 18: 215, 10751: 150, 14: 280, 10765: 190, 36: 30, 10402: 320, 9648: 262, 10749: 340, 878: 195, 10752: 100, 10768: 100, 37: 28, 10762: 150, 10764: 320 };
const PRIORITY = [27, 53, 878, 10765, 14, 28, 10759, 80, 9648, 16, 35, 10749, 18, 12, 36, 10752, 99, 10751];
export function hueOf(g, id) {
  const list = g || [];
  for (const p of PRIORITY) if (list.indexOf(p) > -1 && GH[p] != null) return GH[p];
  return ((id || 7) * 47) % 360;
}

/* ---------- normalizadores a una forma común ---------- */
export function normItem(r, type) {
  const t = r.media_type || type || 'movie';
  return { type: t, id: r.id, key: t + ':' + r.id, title: r.title || r.name || '', year: (r.release_date || r.first_air_date || '').slice(0, 4),
    date: r.release_date || r.first_air_date || '', poster: r.poster_path || null, backdrop: r.backdrop_path || null,
    g: r.genre_ids || (r.genres || []).map((x) => x.id) || [], vote: r.vote_average || 0 };
}
export const fromMeta = (m) => ({ type: m.type, id: m.id, key: m.type + ':' + m.id, title: m.t, year: m.y, date: m.d, poster: m.p, backdrop: m.b, g: m.g || [], vote: 0 });
export const fromUni = (i) => ({ type: i.k, id: i.id, key: i.key || i.k + ':' + i.id, title: i.t, year: String(i.y || ''), date: i.d || '', poster: i.p, backdrop: i.b, g: [], vote: 0, rl: i.rl });

/* ---------- piezas de arte ---------- */
export function artHTML(n) {
  if (n.backdrop) return '<img class="aimg" src="' + img(n.backdrop, 'w1280') + '" alt="" decoding="async" onload="this.classList.add(\'ld\')">';
  if (n.poster) return '<img class="aimg pz" src="' + img(n.poster, 'w780') + '" alt="" decoding="async" onload="this.classList.add(\'ld\')">';
  return '';
}
export function posterImg(n, size) {
  const h = hueOf(n.g, n.id);
  return '<div class="poster" style="--h:' + h + '"><span class="ph">' + esc(n.title) + '</span>' +
    (n.poster ? '<img src="' + img(n.poster, size || 'w342') + '" alt="" loading="lazy" decoding="async" onload="this.classList.add(\'ld\')" onerror="this.remove()">' : '') + '</div>';
}
export function posterCard(n, o) {
  o = o || {};
  return '<a class="pc" href="#/' + n.type + '/' + n.id + '"' + (o.w ? ' style="width:' + o.w + 'px"' : '') + '>' +
    '<div class="pw">' + posterImg(n) + (o.chip ? '<span class="chip">' + esc(o.chip) + '</span>' : '') + (o.check ? '<span class="pcheck">' + ic('check', 14, 3) + '</span>' : '') + '</div>' +
    '<div class="pt">' + esc(n.title) + '</div><div class="ps">' + esc(o.sub != null ? o.sub : (n.type === 'tv' ? 'Serie' : 'Película') + (n.year ? ' · ' + n.year : '')) + '</div></a>';
}

export function ring(f, size, sw) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, h = size / 2;
  return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle cx="' + h + '" cy="' + h + '" r="' + r + '" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="' + sw + '"/><circle class="rfg" data-f="' + f + '" data-c="' + c + '" cx="' + h + '" cy="' + h + '" r="' + r + '" fill="none" stroke="var(--a)" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c + '" transform="rotate(-90 ' + h + ' ' + h + ')"/></svg>';
}
export function animate(root) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('.rfg', root).forEach((el) => { el.style.strokeDashoffset = +el.dataset.c * (1 - +el.dataset.f); });
    $$('[data-w]', root).forEach((el) => { el.style.width = el.dataset.w + '%'; });
  }));
}

/* ---------- fechas y textos ---------- */
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function fmtDate(d) { if (!d) return ''; const [y, m, dd] = d.split('-'); return (+dd) + ' ' + MES[+m - 1] + ' ' + y; }
export function daysUntil(d) { if (!d) return null; const a = new Date(today() + 'T00:00:00'), b = new Date(d + 'T00:00:00'); return Math.round((b - a) / 864e5); }
export function ago(ts) {
  if (!ts) return '';
  const d = (Date.now() - ts) / 864e5;
  if (d < 1) return 'hoy'; if (d < 2) return 'ayer'; if (d < 14) return 'hace ' + Math.floor(d) + ' días';
  if (d < 60) return 'hace ' + Math.round(d / 7) + ' semanas'; return 'hace ' + Math.round(d / 30) + ' meses';
}
export const epLabel = (s, e) => 'T' + s + ' · E' + e;

/* ---------- aviso flotante ---------- */
let tt;
export function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('in'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('in'), 2400);
}

/* ---------- parallax del héroe ---------- */
export function parallax(root) {
  const art = $('.hero-art', root), txt = $('.hero-in', root), layers = $$('[data-depth]', root); let raf = 0;
  if (!art) return () => {};
  const fn = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const y = Math.min(window.scrollY, 600);
    art.style.transform = 'translateY(' + (y * 0.28) + 'px) scale(' + (1 + y / 1800) + ')';
    layers.forEach((l) => { l.style.transform = 'translateY(' + (y * +l.dataset.depth) + 'px)'; });
    if (txt && root.dataset.fade) txt.style.opacity = Math.max(0, 1 - y / 360); }); };
  window.addEventListener('scroll', fn, { passive: true });
  return () => window.removeEventListener('scroll', fn);
}
