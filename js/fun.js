// Extras útiles y divertidos: Hoy toca, ¿de dónde lo conozco?, Tu año, calendario, compartir, racha y descubrir deslizando.
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import * as taste from './taste.js';
import { openSheet } from './sheet.js';
import { stats } from './data.js';
import { best, platAttr } from './platform.js';
import { nextSync } from './progress.js';
import { esc, ic, img, daysUntil, epLabel, toast } from './ui.js';

const RT = { movie: 125, ep: 45 }; // estimaciones cuando TMDB no da la duración
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'], DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const dur = (m) => { m = Math.round(m / 5) * 5; return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min'; };
const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const pic = (p) => { const a = img(p, 'w185'); return a ? '<img src="' + a + '" alt="" loading="lazy">' : '<span class="pl-np"></span>'; };

/* ---------- racha: días seguidos mirando algo ---------- */
export function streak() {
  const days = new Set((store.state().log || []).map((x) => ymd(new Date(x.t))));
  const d = new Date(); let n = 0;
  if (!days.has(ymd(d))) d.setDate(d.getDate() - 1); // si hoy todavía no miraste, la racha de ayer sigue viva
  while (days.has(ymd(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- Hoy toca: un plan para cualquier universo o serie, con o sin estreno ---------- */
const EASY = 60; // minutos por día cuando no hay apuro

function blocksOf(c, t0) {
  const S = store.state(), out = [];
  c.order.forEach((i0) => {
    if (i0.d && i0.d > t0) return; const f = store.frac(i0.key, i0.eps); if (f >= 0.999 || (i0.o && f === 0)) return; /* lo opcional que no empezaste queda afuera del plan */ const i = Object.assign({}, i0, { u: c.uid ? [c.uid] : [] }), m = store.meta(i.key) || {};
    if (i.k === 'movie') out.push({ i, min: m.rt || RT.movie });
    else { const eps = i.eps || m.tot || 8, left = Math.max(1, eps - store.countWatched(i.key)); out.push({ i, tv: 1, eps: left, from: nextSync(i.key) || { s: 1, e: store.countWatched(i.key) + 1 } }); }
  });
  return out;
}
/* lo que podés planear: universos donde ya hay algo tuyo + series sueltas en curso */
export function candidates(U) {
  const S = store.state(), t0 = store.today(), out = [], inUni = new Set();
  const lastOf = (keys) => keys.reduce((a, k) => Math.max(a, S.last[k] || 0), 0);
  U.universes.forEach((u) => {
    const keys = u.items.map((i) => i.key); keys.forEach((k) => inUni.add(k));
    if (!keys.some((k) => store.tracked(k))) return;
    const c = { id: u.id, uid: u.id, title: u.title, items: u.items, order: data.sequence(u, data.prefOrder(u, (S.uorder || {})[u.id])), last: lastOf(keys), fut: u.items.filter((i) => i.d && i.d > t0).sort((a, b) => a.d.localeCompare(b.d))[0] || null };
    c.blocks = blocksOf(c, t0); if (c.blocks.length) out.push(c);
  });
  store.inProgress().forEach((k) => {
    if (inUni.has(k)) return; const m = store.meta(k); if (!m || m.type !== 'tv') return;
    const it = { k: 'tv', id: m.id, t: m.t, p: m.p, b: m.b, key: k, eps: m.tot || 0, d: '' };
    const c = { id: 's:' + k, uid: null, title: m.t, items: [it], order: [it], last: S.last[k] || 0, fut: null }; c.blocks = blocksOf(c, t0); if (c.blocks.length) out.push(c);
  });
  return out;
}
export const PACE = { min: 30, max: 480, step: 15 };
export function planFor(U, ov) {
  ov = ov || {}; const S = store.state(), cs = candidates(U); if (!cs.length) return null;
  const c = cs.find((x) => x.id === (ov.focus || S.focus)) || cs.slice().sort((a, b) => b.last - a.last)[0];
  S.goal = S.goal || {}; let goal = ov.goal !== undefined ? ov.goal : S.goal[c.id]; if (!goal || (goal === 'rel' && !c.fut)) goal = c.fut ? 'rel' : { p: EASY };
  const total = c.blocks.reduce((a, b) => a + (b.tv ? b.eps * RT.ep : b.min), 0), dRel = c.fut ? Math.max(1, daysUntil(c.fut.d)) : 0;
  const cap = goal === 'rel' ? Math.max(30, Math.ceil(total / dRel / 5) * 5) : goal.p, lim = cap * 1.25;
  const plan = []; let day = { min: 0, items: [] };
  const push = () => { if (day.items.length) plan.push(day); day = { min: 0, items: [] }; };
  c.blocks.forEach((b) => {
    if (!b.tv) { if (day.min > 0 && day.min + b.min > lim) push(); day.items.push({ i: b.i, label: 'Película', min: b.min }); day.min += b.min; if (day.min >= cap * 0.9) push(); return; }
    let left = b.eps, first = true;
    while (left > 0) {
      const room = Math.floor((lim - day.min) / RT.ep); if (room < 1) { push(); continue; }
      const n = Math.min(left, room);
      day.items.push({ i: b.i, label: (n === 1 ? '1 capítulo' : n + ' capítulos') + (first ? ' · desde ' + epLabel(b.from.s, b.from.e) : ' más'), min: n * RT.ep, from: first ? b.from : null });
      day.min += n * RT.ep; left -= n; first = false; if (day.min >= cap * 0.9) push();
    }
  });
  push();
  if (!plan.length) return null;
  plan.forEach((d, n) => { const dt = new Date(); dt.setDate(dt.getDate() + n); d.label = n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : DIA[dt.getDay()] + ' ' + dt.getDate() + ' ' + MES[dt.getMonth()]; d.date = dt; });
  const end = plan[plan.length - 1].date, endTxt = end.getDate() + ' ' + MES[end.getMonth()] + (end.getFullYear() !== new Date().getFullYear() ? ' ' + end.getFullYear() : '');
  const margin = c.fut ? dRel - plan.length : null;
  const line = margin === null ? 'Lo terminás el ' + endTxt : margin >= 0 ? 'Llegás a tiempo' : 'Vas tarde para el estreno';
  const detail = margin === null ? 'Lo terminás el ' + endTxt : margin === 0 ? 'Terminás justo el día del estreno' : margin > 0 ? 'Lo terminás el ' + endTxt + ', ' + margin + (margin === 1 ? ' día' : ' días') + ' antes del estreno' : 'Lo terminás el ' + endTxt + ', ' + (-margin) + (margin === -1 ? ' día' : ' días') + ' después del estreno';
  return { c, cs, goal, cap, total, plan, line, detail, margin, endTxt, fut: c.fut, relPace: dRel ? Math.max(30, Math.ceil(total / dRel / 5) * 5) : 0 };
}

export function planCard(pl) {
  const it = pl.plan[0].items[0], i = it.i, g = best(i.k, i.id, it.from), more = pl.plan[0].items.length - 1;
  return '<div class="hx-today"><a class="im" href="#/' + i.k + '/' + i.id + '">' + pic(i.p) + '</a>' +
    '<button class="tx" data-plan><span class="fu-k">Hoy toca · ' + esc(pl.c.title) + '</span><b>' + esc(i.t) + '</b><small>' + esc(it.label) + ' · ' + dur(it.min) + (more > 0 ? ' + ' + more + ' más' : '') + '</small><small class="ok">' + esc(pl.line) + ' · ver plan</small></button>' +
    (g ? '<a class="go" href="' + g.url + '" target="_blank" rel="noopener"' + platAttr(i.k, i.id, i.t, g.opts) + ' aria-label="Abrir en ' + esc(g.short) + '">' + ic('play', 16) + '</a>' : '<a class="go off" href="#/' + i.k + '/' + i.id + '" aria-label="Ver ficha">' + ic('play', 16) + '</a>') + '</div>';
}

export function openPlan(U, onChange) {
  let pl = planFor(U); if (!pl) return;
  const s = openSheet('', 215), S = store.state(), N = 6;
  const fan = (c) => { const ps = c.items.filter((x) => x.p).slice(0, 3); return '<span class="pl-fan' + (ps.length < 3 ? ' n' + ps.length : '') + '">' + ps.map((x) => '<i style="background-image:url(' + img(x.p, 'w185') + ')"></i>').join('') + '</span>'; };
  const det = (p) => '<p class="pl-det' + (p.margin !== null && p.margin < 0 ? ' late' : '') + '">' + esc(p.detail) + '</p>';
  const row = (it) => '<a class="pl-r" href="#/' + it.i.k + '/' + it.i.id + '" data-close>' + pic(it.i.p) + '<span><b>' + esc(it.i.t) + '</b><small>' + esc(it.label) + ' · ' + dur(it.min) + '</small></span></a>';
  const thread = (p) => {
    const nodes = p.plan.slice(0, N).map((d) => '<div class="pl-tn"><span class="pl-dt">' + d.label + '</span><span class="pl-dot"></span><div class="pl-ct">' + d.items.map(row).join('') + '<span class="pl-mn">' + dur(d.min) + '</span></div></div>').join('');
    const gap = p.plan.length > N ? '<div class="pl-tn"><span class="pl-dt"></span><span class="pl-dot dim"></span><div class="pl-ct"><span class="pl-dots">· · ·</span><span class="pl-mn">' + (p.plan.length - N) + ' días más</span></div></div>' : '';
    const end = p.fut ? '<div class="pl-tn end"><span class="pl-dt">' + (+p.fut.d.slice(8)) + ' ' + MES[+p.fut.d.slice(5, 7) - 1] + '</span><span class="pl-dot"></span><div class="pl-ct"><b>' + esc(p.fut.t) + '</b><small>' + (p.margin >= 0 ? 'Estreno · te sobran ' + p.margin + (p.margin === 1 ? ' día' : ' días') : 'Estreno · llegás ' + (-p.margin) + (p.margin === -1 ? ' día' : ' días') + ' tarde') + '</small></div></div>'
      : '<div class="pl-tn end"><span class="pl-dt">' + p.endTxt.replace(/ \d{4}$/, '') + '</span><span class="pl-dot"></span><div class="pl-ct"><b>Terminás ' + esc(p.c.title) + '</b><small>' + esc(p.endTxt) + '</small></div></div>';
    return nodes + gap + end;
  };
  const paint = (p) => {
    s.el.querySelector('#plnum').textContent = dur(p.cap); s.el.querySelector('#pldet').innerHTML = det(p); s.el.querySelector('#plth').innerHTML = thread(p);
    const b = s.el.querySelector('[data-rel]'); if (b) b.classList.toggle('on', p.goal === 'rel');
  };
  const shell = () => {
    s.el.innerHTML = '<div class="grab"></div><h3>Plan de ' + esc(pl.c.title) + '</h3>' +
      (pl.cs.length > 1 ? '<div class="pl-us">' + pl.cs.map((x) => '<button class="pl-fn' + (x.id === pl.c.id ? ' on' : '') + '" data-focus="' + esc(x.id) + '">' + fan(x) + '<small>' + esc(x.title) + '</small></button>').join('') + '</div>' : '') +
      '<div class="pl-stp"><button data-st="-1" aria-label="Menos tiempo por día">−</button><div><div class="pl-big" id="plnum"></div><span>por día</span></div><button data-st="1" aria-label="Más tiempo por día">+</button></div><div id="pldet"></div>' +
      (pl.fut ? '<div class="pl-flag"><button class="pl-pill" data-rel>' + ic('cal', 14) + 'Hasta ' + esc(pl.fut.t.length > 22 ? 'el estreno' : pl.fut.t) + '</button></div>' : '') + '<div class="pl-th" id="plth"></div>';
    paint(pl);
    let t = null, iv = null; const stop = () => { clearTimeout(t); clearInterval(iv); };
    const step = (d) => {
      const base = pl.goal === 'rel' ? pl.cap : pl.goal.p, p0 = Math.max(PACE.min, Math.min(PACE.max, Math.round((base + d * PACE.step) / PACE.step) * PACE.step));
      const p = planFor(U, { focus: pl.c.id, goal: { p: p0 } }); if (!p) return;
      pl = p; S.goal = S.goal || {}; S.goal[p.c.id] = { p: p0 }; store.save(); paint(p); if (onChange) onChange(p);
    };
    s.el.querySelectorAll('[data-st]').forEach((b) => {
      const d = +b.dataset.st;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); step(d); t = setTimeout(() => { iv = setInterval(() => step(d), 90); }, 380); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stop));
    });
  };
  shell();
  s.el.addEventListener('click', (e) => {
    const f = e.target.closest('[data-focus]'), rel = e.target.closest('[data-rel]'); if (!f && !rel) return;
    S.goal = S.goal || {};
    if (f) S.focus = f.dataset.focus; else S.goal[pl.c.id] = 'rel';
    store.save(); pl = planFor(U); shell(); if (onChange) onChange(pl);
  });
}

/* ---------- ¿De dónde lo conozco? ---------- */
export async function openPerson(pid, name, key) {
  const S = store.state(), s = openSheet('<h3>' + esc(name) + '</h3><div class="ssub">Buscando en lo que viste…</div><div class="skel"><i></i><i></i></div>', 215);
  const mine = new Set(Object.keys(S.watched).concat(Object.keys(S.follow))); mine.delete(key);
  let found = [], err = '';
  try {
    const r = await api.personCredits(pid), seen = new Set();
    (r.cast || []).forEach((c) => { const k = c.media_type + ':' + c.id; if (!mine.has(k) || seen.has(k)) return; seen.add(k); const m = store.meta(k) || {}; found.push({ type: c.media_type, id: c.id, t: m.t || c.title || c.name, p: m.p || c.poster_path, y: m.y || (c.release_date || c.first_air_date || '').slice(0, 4), role: c.character, f: store.frac(k) }); });
    found.sort((a, b) => b.f - a.f);
  } catch (e) { err = e.code === 'offline' ? 'Necesito conexión para buscarlo.' : 'No pude buscarlo ahora.'; }
  s.el.innerHTML = '<div class="grab"></div><h3>' + esc(name) + '</h3><div class="ssub">' + (err || (found.length ? 'También lo viste en' : 'No lo reconozco en lo que seguís o viste.')) + '</div>' +
    found.map((f) => '<a class="pl-r" href="#/' + f.type + '/' + f.id + '" data-close>' + pic(f.p) + '<span><b>' + esc(f.t) + '</b><small>' + esc([f.role, f.y].filter(Boolean).join(' · ')) + '</small></span></a>').join('');
}

/* ---------- Tu año en Hilo ---------- */
const GENRES = { 28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia', 14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música', 9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficción', 53: 'Suspense', 10752: 'Bélica', 37: 'Western', 10759: 'Acción y aventura', 10765: 'Ciencia ficción y fantasía', 10768: 'Guerra y política' };
const UGEN = { alien: [27, 878], starwars: [878], dune: [878], wizarding: [14], middleearth: [14], got: [10765, 18], breakingbad: [80, 18], theboys: [10765, 10759], marvel: [28, 878], twd: [10759, 18] };
export function yearStats(U) {
  const S = store.state(); let eps = 0, movies = 0, mins = 0, topS = null; const gc = {};
  Object.keys(S.watched).forEach((k) => {
    const { type } = store.parse(k), m = S.meta[k] || {};
    if (type === 'movie') { movies++; mins += m.rt || RT.movie; } else { const n = store.countWatched(k); eps += n; mins += n * RT.ep; if (!topS || n > topS.n) topS = { k, n }; }
    const g = (m.g && m.g.length ? m.g : (U.byKey[k] || []).flatMap((u) => UGEN[u] || [])); g.forEach((x) => { if (GENRES[x]) gc[x] = (gc[x] || 0) + 1; });
  });
  const genre = Object.entries(gc).sort((a, b) => b[1] - a[1])[0];
  const uni = U.universes.map((u) => ({ u, s: stats(u) })).sort((a, b) => b.s.f - a.s.f)[0];
  return { year: new Date().getFullYear(), eps, movies, mins, done: store.completed().length, genre: genre ? GENRES[genre[0]] : '', uni: uni && uni.s.f > 0 ? uni : null, topS, streak: streak() };
}
async function drawCard(st, posterSrc) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
  x.fillStyle = '#08080b'; x.fillRect(0, 0, 1080, 1920);
  if (posterSrc) { try { const im = await new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = posterSrc; }); const k = Math.max(1080 / im.width, 1920 / im.height); x.globalAlpha = 0.55; x.drawImage(im, (1080 - im.width * k) / 2, (1920 - im.height * k) / 2, im.width * k, im.height * k); x.globalAlpha = 1; } catch (e) { /* sin imagen */ } }
  const g = x.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, 'rgba(8,8,11,.55)'); g.addColorStop(.45, 'rgba(8,8,11,.78)'); g.addColorStop(1, 'rgba(8,8,11,.96)'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  const font = (w, s) => w + ' ' + s + 'px Archivo, system-ui, sans-serif';
  x.fillStyle = '#f3f1ec'; x.textBaseline = 'alphabetic';
  x.font = font(800, 54); x.fillStyle = 'rgba(243,241,236,.7)'; x.fillText('HILO', 90, 150);
  x.font = font(900, 120); x.fillStyle = '#f3f1ec'; x.fillText('Tu año', 90, 420); x.fillText('en Hilo ' + st.year, 90, 550);
  x.font = font(900, 300); x.fillStyle = '#ffb454'; const h = Math.round(st.mins / 60); x.fillText(h + ' h', 90, 930);
  x.font = font(600, 54); x.fillStyle = 'rgba(243,241,236,.85)'; x.fillText('mirando series y películas', 90, 1010);
  let y = 1180; const line = (a, b) => { x.font = font(700, 40); x.fillStyle = 'rgba(243,241,236,.55)'; x.fillText(a.toUpperCase(), 90, y); x.font = font(800, 72); x.fillStyle = '#f3f1ec'; x.fillText(String(b).slice(0, 26), 90, y + 82); y += 190; };
  line('Capítulos y películas', st.eps + ' caps · ' + st.movies + (st.movies === 1 ? ' peli' : ' pelis'));
  if (st.genre) line('Lo que más viste', st.genre);
  if (st.uni) line('Universo en el que más avanzaste', st.uni.u.title);
  if (st.streak > 1) line('Racha actual', st.streak + ' días seguidos');
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
export function openYear(U) {
  const st = yearStats(U), h = Math.round(st.mins / 60);
  const topM = st.topS && store.meta(st.topS.k), uit = st.uni && st.uni.u.items.find((x) => x.p), poster = (topM && img(topM.p, 'w500')) || (uit && img(uit.p, 'w500')) || '';
  const row = (a, b) => b ? '<div class="yr-r"><span>' + a + '</span><b>' + esc(b) + '</b></div>' : '';
  const s = openSheet('<h3>Tu año en Hilo</h3><div class="ssub">' + st.year + ' · calculado con lo que marcaste</div><div class="yr-big"><b>' + h + '</b><span>horas<br>mirando</span></div>' +
    row('Capítulos vistos', st.eps) + row('Películas vistas', st.movies) + row('Terminaste', st.done + (st.done === 1 ? ' título' : ' títulos')) + row('Lo que más viste', st.genre) +
    row('Universo en el que más avanzaste', st.uni ? st.uni.u.title + ' · ' + st.uni.s.done + ' de ' + st.uni.s.total : '') + row('La que más maratoneaste', topM ? topM.t + ' · ' + st.topS.n + ' caps' : '') + (st.streak > 1 ? row('Racha actual', st.streak + ' días') : '') +
    '<button class="btn pri" data-yshare style="width:100%;margin-top:14px">Compartir imagen</button><div id="yprev"></div>', 215);
  s.el.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-yshare]')) return;
    const blob = await drawCard(st, poster), file = new File([blob], 'mi-anio-en-hilo.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Mi año en Hilo' }); return; } catch (er) { if (er && er.name === 'AbortError') return; } }
    $prev(s, URL.createObjectURL(blob));
  });
}
const $prev = (s, url) => { const p = s.el.querySelector('#yprev'); p.innerHTML = '<p class="yr-hint">Mantené apretada la imagen para guardarla o compartirla.</p><img class="yr-img" src="' + url + '" alt="Tu año en Hilo">'; };

/* ---------- Agregar al calendario ---------- */
const icsDate = (d) => d.replace(/-/g, '');
function ics(ev) {
  const next = new Date(ev.d + 'T00:00:00'); next.setDate(next.getDate() + 1);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hilo//ES', 'BEGIN:VEVENT', 'UID:hilo-' + icsDate(ev.d) + '-' + encodeURIComponent(ev.t) + '@hilo', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]|\.\d{3}/g, ''), 'DTSTART;VALUE=DATE:' + icsDate(ev.d), 'DTEND;VALUE=DATE:' + icsDate(ymd(next)),
    'SUMMARY:Estreno: ' + ev.t.replace(/[,;]/g, ' '), 'DESCRIPTION:' + (ev.s || '').replace(/[,;]/g, ' ') + ' (desde Hilo)', 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Mañana se estrena ' + ev.t.replace(/[,;]/g, ' '), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
export function openCal(ev) {
  const [y, mo, d] = ev.d.split('-'), dd = daysUntil(ev.d);
  const s = openSheet('<h3>Agregar al calendario</h3><div class="ssub">Se guarda con un aviso el día anterior.</div><div class="cal-ev"><span class="cal-d"><b>' + (+d) + '</b><i>' + MES[+mo - 1] + '</i></span><span><b>' + esc(ev.t) + '</b><small>' + esc(ev.s || 'Estreno') + ' · ' + (dd === 1 ? 'mañana' : 'en ' + dd + ' días') + '</small></span></div><button class="btn pri" data-ics style="width:100%;margin-top:6px">Agregar</button><p class="cal-n" id="caln"></p>', 215);
  s.el.querySelector('[data-ics]').addEventListener('click', () => {
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics(ev)], { type: 'text/calendar' })); a.download = 'hilo-estreno.ics'; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 800); } catch (e) { /* sandbox */ }
    s.el.querySelector('#caln').textContent = 'En el iPhone se abre el Calendario para confirmar el evento.';
  });
}

/* ---------- compartir ---------- */
export async function share(key, title) {
  const { type, id } = store.parse(key), url = 'https://www.themoviedb.org/' + type + '/' + id, text = 'Mirá ' + title + ' (' + (type === 'tv' ? 'serie' : 'película') + ')';
  if (navigator.share) { try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(text + ' ' + url); toast('Enlace copiado'); } catch (e) { toast(url); }
}

/* ---------- descubrir deslizando ---------- */
export async function openDiscover(U) {
  if (document.getElementById('dsc')) return;
  const root = document.createElement('div'); root.id = 'dsc'; root.className = 'dsc';
  root.innerHTML = '<button class="dsc-x" data-x aria-label="Cerrar">' + ic('plus', 22) + '</button><div class="dsc-st"><p class="dsc-e">Buscando para vos…</p></div><div class="dsc-a"><button class="no" data-no aria-label="No me interesa"><span class="xx">' + ic('plus', 26) + '</span></button><a class="fi" data-fi href="#/">Ficha</a><button class="yes" data-yes aria-label="Mi lista">' + ic('mark', 26) + '</button></div><p class="dsc-h">Deslizá a la derecha para sumarla a tu lista y a la izquierda para descartarla</p>';
  document.body.appendChild(root); document.documentElement.classList.add('lock'); requestAnimationFrame(() => root.classList.add('in'));
  const close = () => { root.classList.remove('in'); document.documentElement.classList.remove('lock'); setTimeout(() => { root.remove(); window.dispatchEvent(new HashChangeEvent('hashchange')); }, 300); };
  let picks = []; try { picks = (await taste.suggestions(U, 12)).filter((f) => f.info.p); } catch (e) { /* sin sugerencias */ }
  const st = root.querySelector('.dsc-st'); let added = 0, dropped = 0;
  const card = (f) => '<div class="dsc-c" data-key="' + f.key + '"><img src="' + img(f.info.p, 'w780') + '" alt=""><i></i><span class="tag yes">Sumar</span><span class="tag no">No</span><div class="tx"><span class="fu-k">' + esc(f.reason) + '</span><b>' + esc(f.info.t) + '</b><small>' + (f.type === 'tv' ? 'Serie' : 'Película') + (f.info.y ? ' · ' + f.info.y : '') + '</small></div></div>';
  const top = () => st.querySelector('.dsc-c:last-child');
  const render = () => {
    if (!picks.length) { st.innerHTML = '<div class="dsc-e"><b>Listo por ahora</b>' + (added ? added + (added === 1 ? ' sumada' : ' sumadas') + ' a tu lista' : 'No sumaste ninguna') + (dropped ? ' · ' + dropped + ' descartadas' : '') + '<br><button class="btn pri" data-x style="margin-top:16px">Volver</button></div>'; root.querySelector('.dsc-a').style.display = 'none'; root.querySelector('.dsc-h').style.display = 'none'; return; }
    st.innerHTML = picks.slice(0, 3).reverse().map(card).join(''); const t = top(); if (t) { bind(t); root.querySelector('[data-fi]').setAttribute('href', '#/' + picks[0].type + '/' + picks[0].id); }
  };
  const decide = (yes) => {
    const f = picks.shift(), t = top(); if (!f || !t) return;
    if (yes) { api.details(f.type, f.id).then((d) => { store.remember(f.type, d); store.follow(f.key, true); }).catch(() => {}); added++; } else { taste.dismiss(f.key); dropped++; }
    t.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1),opacity .35s'; t.style.transform = 'translateX(' + (yes ? 130 : -130) + '%) rotate(' + (yes ? 18 : -18) + 'deg)'; t.style.opacity = '0';
    setTimeout(render, 280);
  };
  function bind(t) {
    let x0 = 0, dx = 0, on = false;
    t.addEventListener('pointerdown', (e) => { on = true; x0 = e.clientX; dx = 0; t.setPointerCapture(e.pointerId); t.style.transition = 'none'; });
    t.addEventListener('pointermove', (e) => { if (!on) return; dx = e.clientX - x0; t.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 22 + 'deg)'; t.style.setProperty('--y', Math.max(0, Math.min(1, dx / 110))); t.style.setProperty('--n', Math.max(0, Math.min(1, -dx / 110))); });
    const end = () => { if (!on) return; on = false; if (Math.abs(dx) > 100) return decide(dx > 0); t.style.transition = 'transform .35s cubic-bezier(.22,1,.36,1)'; t.style.transform = ''; t.style.setProperty('--y', 0); t.style.setProperty('--n', 0); };
    t.addEventListener('pointerup', end); t.addEventListener('pointercancel', end);
  }
  render();
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-x]')) return close();
    if (e.target.closest('[data-yes]')) return decide(true);
    if (e.target.closest('[data-no]')) return decide(false);
    if (e.target.closest('[data-fi]')) { close(); }
  });
}

/* ---------- un solo oyente para lo que se dibuja en cualquier pantalla ---------- */
export function initFun() {
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-person]'); if (p) { openPerson(+p.dataset.person, p.dataset.pn, p.dataset.pk); return; }
    const s = e.target.closest('[data-share]'); if (s) share(s.dataset.share, s.dataset.st);
  });
}
