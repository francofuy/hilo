// Listas para maratonear: armás las tuyas, las ordenás y las ves de corrido.
// Se guardan en el teléfono (S.lists) y entran solas en el respaldo.
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import { openSheet } from './sheet.js';
import { best, platAttr } from './platform.js';
import { nextSync } from './progress.js';
import { esc, ic, img, toast, epLabel } from './ui.js';

const HUES = [350, 32, 48, 130, 195, 215, 280, 320];
const RT = { movie: 125, ep: 45 };
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dur = (m) => { m = Math.round(m / 5) * 5; return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min'; };
const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

/* ---------- datos ---------- */
export const all = () => { const S = store.state(); S.lists = S.lists || []; return S.lists; };
export const byId = (id) => all().find((l) => l.id === id);
const uid = () => 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
export function create(name, keys, hue) {
  const l = { id: uid(), n: (name || '').trim() || 'Nueva lista', h: hue != null ? hue : HUES[all().length % HUES.length], k: [...new Set(keys || [])], t: Date.now() };
  all().unshift(l); store.save(); return l;
}
export function rename(id, name) { const l = byId(id); if (l && name.trim()) { l.n = name.trim().slice(0, 40); store.save(); } }
export function remove(id) { const S = store.state(); S.lists = all().filter((l) => l.id !== id); store.save(); }
export const has = (id, k) => { const l = byId(id); return !!l && l.k.indexOf(k) > -1; };
export const inAny = (k) => all().some((l) => l.k.indexOf(k) > -1);
export function toggle(id, k) { const l = byId(id); if (!l) return false; const i = l.k.indexOf(k); if (i > -1) l.k.splice(i, 1); else l.k.push(k); store.save(); return i < 0; }
export function move(id, from, to) { const l = byId(id); if (!l) return; l.k.splice(to, 0, l.k.splice(from, 1)[0]); store.save(); }

/* lo que hace falta para dibujar un título: sale de lo guardado o, si no está, de los universos */
let U = null; data.load().then((d) => { U = d; }).catch(() => {});
function meta(k) {
  const m = store.meta(k); if (m) return m;
  const { type, id } = store.parse(k), it = U && (U.byKey[k] || []).length ? U.byId[U.byKey[k][0]].items.find((x) => x.key === k) : null;
  return it ? { type, id, t: it.t, p: it.p, y: it.y, tot: it.eps || 0, d: it.d } : { type, id, t: k, p: null };
}
const nextEp = (k) => (meta(k).type === 'tv' ? nextSync(k) : null);
const frac = (k) => store.frac(k, meta(k).tot);
const total = (k) => { const m = meta(k); return m.type === 'movie' ? 1 : (m.tot || (m.seasons ? m.seasons.reduce((a, s) => a + s[1], 0) : 8)); };
const left = (k) => { const m = meta(k); if (m.type === 'movie') return store.isMovieWatched(k) ? 0 : (m.rt || RT.movie); return Math.max(0, total(k) - store.countWatched(k)) * RT.ep; };
export function stats(l) {
  const done = l.k.filter((k) => frac(k) >= 0.999).length, min = l.k.reduce((a, k) => a + left(k), 0);
  const next = l.k.find((k) => frac(k) < 0.999) || null;
  return { n: l.k.length, done, min, next, f: l.k.length ? l.k.reduce((a, k) => a + Math.min(1, frac(k)), 0) / l.k.length : 0 };
}
// abre el título (o el capítulo que sigue) en tu plataforma; si hay más de una, la app pregunta dónde
function goFor(k) {
  const m = meta(k), ep = m.type === 'tv' ? nextEp(k) : null, g = best(m.type, m.id, ep);
  return g ? { url: g.url, short: g.short, attr: platAttr(m.type, m.id, m.t, g.opts), many: g.opts.length > 1 } : null;
}

/* ---------- piezas de dibujo ---------- */
const fan = (l, cls) => { const ks = l.k.map((k) => meta(k)).filter((m) => img(m.p)).slice(0, 3); return '<span class="ls-fan' + (cls ? ' ' + cls : '') + (ks.length < 3 ? ' n' + ks.length : '') + '">' + (ks.length ? ks.map((m, i) => '<i style="background-image:url(' + img(m.p, 'w185') + ');--j:' + i + '"></i>').join('') : '<i class="empty">' + ic('plus', 22) + '</i>') + '</span>'; };
const ring = (f) => f >= 0.999 ? '<svg class="ls-ring ok" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7 12.5l3.4 3.4L17.5 9"/></svg>' : '<svg class="ls-ring" viewBox="0 0 24 24"><circle class="bg" cx="12" cy="12" r="9.5"/><circle class="fg" cx="12" cy="12" r="9.5" style="stroke-dashoffset:' + (60 * (1 - f)).toFixed(1) + '"/></svg>';
const tick = () => '<svg class="ls-tk" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7 12.5l3.4 3.4L17.5 9"/></svg>';

/* ---------- inicio: la pestaña "Maratones" ---------- */
export function shelfHTML() {
  const cards = all().map((l, i) => { const s = stats(l); return '<button class="ls-card" data-list="' + l.id + '" style="--h:' + l.h + ';--i:' + i + '">' + fan(l) + '<b>' + esc(l.n) + '</b><small>' + (s.n ? plural(s.n, 'título', 'títulos') + (s.min ? ' · ' + (s.min >= 90 ? Math.round(s.min / 60) + ' h' : dur(s.min)) : ' · lista') : 'Vacía') + '</small>' + (s.done && s.n ? '<u class="ls-pb"><i style="width:' + Math.round(s.f * 100) + '%"></i></u>' : '') + '</button>'; });
  cards.push('<button class="ls-card new" data-newlist style="--i:' + all().length + '"><span class="ls-fan n0"><i class="empty">' + ic('plus', 24) + '</i></span><b>Nueva lista</b><small>Para maratonear</small></button>');
  return cards.join('');
}
export function bindShelf(root, redraw) {
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-list]'); if (c) { openList(c.dataset.list, redraw); return; }
    if (e.target.closest('[data-newlist]')) openNew(redraw);
  });
}

/* ---------- agregar un título a una lista (desde la ficha) ---------- */
export function openAddTo(key, title) {
  const S = store.state(), s = openSheet('', 215);
  const draw = () => {
    s.el.innerHTML = '<div class="grab"></div><h3>Agregar a una lista</h3><div class="ssub">' + esc(title) + '</div>' +
      '<div class="ls-pick">' + all().map((l, i) => '<button class="ls-pr' + (has(l.id, key) ? ' on' : '') + '" data-lk="' + l.id + '" style="--h:' + l.h + ';--i:' + i + '">' + fan(l, 'sm') + '<span class="tx"><b>' + esc(l.n) + '</b><small>' + plural(l.k.length, 'título', 'títulos') + '</small></span>' + tick() + '</button>').join('') +
      '<div class="ls-nw" id="lsnw"><button class="ls-pr plus" data-nw><span class="ls-pl">' + ic('plus', 18, 2.4) + '</span><span class="tx"><b>Nueva lista</b></span></button></div></div>' +
      '<button class="btn pri" data-close style="width:100%;margin-top:14px">Listo</button>';
  };
  draw();
  s.el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-lk]');
    if (t) { const on = toggle(t.dataset.lk, key); t.classList.toggle('on', on); t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); const l = byId(t.dataset.lk); t.querySelector('small').textContent = plural(l.k.length, 'título', 'títulos'); document.querySelectorAll('[data-addlist="' + key + '"]').forEach((b) => b.classList.toggle('on', inAny(key))); toast(on ? 'Agregado a ' + l.n : 'Quitado de ' + l.n); return; }
    if (e.target.closest('[data-nw]')) {
      const box = s.el.querySelector('#lsnw'); box.innerHTML = '<div class="ls-in"><input id="lsnn" type="text" maxlength="40" placeholder="Nombre de la lista" autocomplete="off"><button class="ls-ok" data-mk aria-label="Crear">' + ic('check', 18, 2.4) + '</button></div>';
      const inp = box.querySelector('input'); inp.focus({ preventScroll: true });
      const mk = () => { const v = inp.value.trim(); if (!v) { inp.focus({ preventScroll: true }); return; } const l = create(v, [key]); document.querySelectorAll('[data-addlist="' + key + '"]').forEach((b) => b.classList.add('on')); toast('Lista creada: ' + l.n); draw(); const n = s.el.querySelector('[data-lk="' + l.id + '"]'); if (n) n.classList.add('pop'); };
      box.querySelector('[data-mk]').onclick = mk; inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') mk(); });
    }
  });
}

/* ---------- lista nueva (desde el inicio) ---------- */
export function openNew(after, keys, name) {
  const s = openSheet('<h3>Nueva lista</h3><div class="ssub">Dale un nombre y después sumale títulos.</div><div class="ls-in"><input id="lsnn" type="text" maxlength="40" placeholder="Ej.: Noche de terror" autocomplete="off" value="' + esc(name || '') + '"><button class="ls-ok" data-mk aria-label="Crear">' + ic('check', 18, 2.4) + '</button></div>', 215);
  const inp = s.el.querySelector('input'); setTimeout(() => inp.focus({ preventScroll: true }), 350);
  const mk = () => { const v = inp.value.trim(); if (!v) { inp.focus({ preventScroll: true }); return; } const l = create(v, keys || []); s.close(); if (after) after(); setTimeout(() => openList(l.id, after, !(keys && keys.length)), 380); };
  s.el.querySelector('[data-mk]').onclick = mk; inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') mk(); });
}

/* ---------- desde un universo: una lista con lo que falta ---------- */
export function openFromUniverse(Un) {
  const S = store.state(), items = Un.items;
  const pend = items.filter((i) => (!i.d || i.d <= store.today()) && store.frac(i.key, i.eps) < 0.999), core = pend.filter((i) => !i.o);
  const opts = [['Lo que te falta', pend], ['Sin lo opcional', core], ['Todo el universo', items.filter((i) => !i.d || i.d <= store.today())]].filter((o, i, a) => o[1].length && (i === 0 || o[1].length !== a[i - 1][1].length));
  let pick = 0;
  const s = openSheet('<h3>Maratón de ' + esc(Un.title) + '</h3><div class="ssub">Se arma con los títulos en el orden que tengas elegido.</div><div class="ls-in"><input id="lsnn" type="text" maxlength="40" value="Maratón de ' + esc(Un.title) + '" autocomplete="off"></div>' +
    '<div class="ls-seg" id="lsseg">' + opts.map((o, i) => '<button class="' + (i ? '' : 'on') + '" data-o="' + i + '"><b>' + esc(o[0]) + '</b><small>' + plural(o[1].length, 'título', 'títulos') + '</small></button>').join('') + '</div><button class="btn pri" data-mk style="width:100%;margin-top:14px">Crear lista</button>', Un.hue != null ? Un.hue : 215);
  s.el.addEventListener('click', (e) => {
    const o = e.target.closest('[data-o]'); if (o) { pick = +o.dataset.o; s.el.querySelectorAll('[data-o]').forEach((x) => x.classList.toggle('on', x === o)); return; }
    if (!e.target.closest('[data-mk]')) return;
    const ord = data.sequence(Un, data.prefOrder(Un, (S.uorder || {})[Un.id])), set = new Set(opts[pick][1].map((i) => i.key)), keys = ord.filter((i) => set.has(i.key)).map((i) => { store.rememberItem(i); return i.key; });
    const l = create(s.el.querySelector('input').value, keys); s.close(); toast('Lista creada: ' + l.n); setTimeout(() => openList(l.id), 380);
  });
}

/* ---------- la lista ---------- */
export function openList(id, redraw, autoFind) {
  let l = byId(id); if (!l) return;
  const s = openSheet('', l.h); let edit = false, menu = false, armed = false;
  const sub = (k) => { const m = meta(k), f = frac(k), ne = m.type === 'tv' ? nextEp(k) : null; return f >= 0.999 ? 'Vista' : m.type === 'movie' ? 'Película · ' + dur(m.rt || RT.movie) : (store.countWatched(k) ? store.countWatched(k) + ' de ' + total(k) + ' caps' : plural(total(k), 'capítulo', 'capítulos')) + (ne ? ' · sigue ' + epLabel(ne.s, ne.e) : ''); };
  const rowHTML = (k, i) => { const m = meta(k), f = frac(k); return '<div class="ls-r' + (f >= 0.999 ? ' done' : '') + '" data-k="' + k + '" style="--i:' + i + '"><button class="ls-hd" aria-label="Mover" data-hd>' + ic('grip', 18) + '</button><a class="ls-im" href="#/' + m.type + '/' + m.id + '" data-close>' + (img(m.p) ? '<img src="' + img(m.p, 'w185') + '" alt="">' : '<span></span>') + '</a><span class="ls-tx"><b>' + esc(m.t) + '</b><small>' + esc(sub(k)) + '</small></span><span class="ls-st">' + ring(f) + '</span><button class="ls-x" data-rm aria-label="Quitar de la lista">' + ic('minus', 16, 2.4) + '</button></div>'; };
  const head = () => {
    const st = stats(l), next = st.next, g = next && goFor(next), m = next && meta(next), ne = next && m.type === 'tv' ? nextEp(next) : null;
    const meta_ = !st.n ? 'Todavía no tiene títulos' : st.min ? plural(st.n, 'título', 'títulos') + ' · ' + dur(st.min) + ' por ver' + (st.done ? ' · ' + st.done + ' vistos' : '') : 'Completada · ' + plural(st.n, 'título', 'títulos');
    const go = !st.n ? '' : !next ? '<div class="ls-fin">' + ic('check', 18, 2.4) + 'Lista completa</div>'
      : '<a class="ls-go" ' + (g ? 'href="' + g.url + '" target="_blank" rel="noopener"' + g.attr : 'href="#/' + m.type + '/' + m.id + '" data-close') + '><span class="pb">' + ic('play', 18) + '</span><span class="tx"><b>Maratonear</b><small>' + esc(m.t) + (ne ? ' · ' + epLabel(ne.s, ne.e) : '') + (g && !g.many ? ' · ' + esc(g.short) : '') + '</small></span></a>';
    return { meta_, go, f: st.f };
  };
  const shell = () => {
    const h = head();
    s.el.style.setProperty('--h', l.h);
    s.el.innerHTML = '<div class="grab"></div><div class="ls-hdr"><h3 class="ls-name" id="lsname" tabindex="0">' + esc(l.n) + '</h3><button class="ls-ico" data-edit aria-label="Editar orden">' + ic('grip', 18) + '</button><button class="ls-ico" data-more aria-label="Más opciones">' + ic('dots', 18) + '</button></div>' +
      '<div class="ssub" id="lsmeta">' + esc(h.meta_) + '</div><div id="lsgo">' + h.go + '</div>' +
      '<div class="ls-menu" id="lsmenu"><div class="in"><div class="hues">' + HUES.map((x) => '<button class="' + (x === l.h ? 'on' : '') + '" data-hue="' + x + '" style="--c:' + x + '" aria-label="Color"></button>').join('') + '</div><div class="acts"><button data-sort="rel">Por estreno</button><button data-sort="mix">Mezclar</button><button data-del>Eliminar</button></div></div></div>' +
      '<div class="ls-rows" id="lsrows">' + (l.k.length ? l.k.map(rowHTML).join('') : '<p class="ls-none">Agregá películas o series con el botón de abajo, o desde la ficha de cualquier título.</p>') + '</div>' +
      '<div class="ls-foot"><button class="ls-add" data-find>' + ic('plus', 16, 2.4) + 'Agregar títulos</button></div>';
  };
  const refreshHead = () => { const h = head(); s.el.querySelector('#lsmeta').textContent = h.meta_; s.el.querySelector('#lsgo').innerHTML = h.go; };
  shell();
  const rows = () => s.el.querySelector('#lsrows');
  // FLIP: los que no se tocaron se deslizan a su lugar nuevo
  const flip = (fn) => { const el = [...rows().children].filter((x) => x.dataset.k && !x.classList.contains('drag')), before = new Map(el.map((x) => [x, x.getBoundingClientRect().top])); fn(); el.forEach((x) => { if (!x.isConnected) return; const d = before.get(x) - x.getBoundingClientRect().top; if (d) x.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' }); }); };
  const setEdit = (on) => { edit = on; rows().classList.toggle('edit', on); s.el.querySelector('[data-edit]').classList.toggle('on', on); };
  // nombre: se toca y se escribe
  const nm = s.el.querySelector('#lsname');
  nm.addEventListener('click', () => { nm.contentEditable = 'true'; nm.focus({ preventScroll: true }); const r = document.createRange(); r.selectNodeContents(nm); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); });
  nm.addEventListener('blur', () => { nm.contentEditable = 'false'; const v = nm.textContent.trim(); if (v) { rename(l.id, v); l = byId(id); } nm.textContent = l.n; if (redraw) redraw(); });
  nm.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nm.blur(); } });
  s.el.addEventListener('click', (e) => {
    if (e.target.closest('[data-edit]')) { setEdit(!edit); return; }
    if (e.target.closest('[data-more]')) { menu = !menu; s.el.querySelector('#lsmenu').classList.toggle('open', menu); armed = false; s.el.querySelector('[data-del]').textContent = 'Eliminar'; return; }
    const hue = e.target.closest('[data-hue]'); if (hue) { l.h = +hue.dataset.hue; store.save(); s.el.style.setProperty('--h', l.h); s.el.querySelectorAll('[data-hue]').forEach((x) => x.classList.toggle('on', x === hue)); if (redraw) redraw(); return; }
    const so = e.target.closest('[data-sort]'); if (so) {
      flip(() => { if (so.dataset.sort === 'rel') l.k.sort((a, b) => (meta(a).d || '9').localeCompare(meta(b).d || '9')); else for (let i = l.k.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l.k[i], l.k[j]] = [l.k[j], l.k[i]]; } store.save(); const box = rows(), by = new Map([...box.children].map((x) => [x.dataset.k, x])); l.k.forEach((k) => box.appendChild(by.get(k))); refreshHead(); });
      toast(so.dataset.sort === 'rel' ? 'Ordenada por estreno' : 'Lista mezclada'); if (redraw) redraw(); return;
    }
    const del = e.target.closest('[data-del]'); if (del) { if (!armed) { armed = true; del.textContent = 'Tocá de nuevo'; del.classList.add('arm'); setTimeout(() => { armed = false; del.textContent = 'Eliminar'; del.classList.remove('arm'); }, 2600); return; } remove(l.id); s.close(); toast('Lista eliminada'); if (redraw) redraw(); return; }
    const rm = e.target.closest('[data-rm]'); if (rm) {
      const r = rm.closest('.ls-r'), k = r.dataset.k, at = l.k.indexOf(k); toggle(l.id, k);
      r.style.height = r.offsetHeight + 'px'; r.getBoundingClientRect(); r.classList.add('out'); setTimeout(() => { r.remove(); refreshHead(); if (!l.k.length) { rows().innerHTML = '<p class="ls-none">Agregá películas o series con el botón de abajo.</p>'; } }, 300);
      if (redraw) redraw(); toast('Quité ' + meta(k).t, () => { l.k.splice(at, 0, k); store.save(); shell(); setEdit(edit); if (redraw) redraw(); }); return;
    }
    if (e.target.closest('[data-find]')) { openFind(l.id, () => { shell(); setEdit(edit); if (redraw) redraw(); }); return; }
  });
  // reordenar arrastrando el agarrador
  s.el.addEventListener('pointerdown', (e) => {
    const hd = e.target.closest('[data-hd]'); if (!hd || !edit) return;
    e.preventDefault(); const row = hd.closest('.ls-r'), box = rows(); let y0 = e.clientY, base = 0; row.classList.add('drag'); box.setPointerCapture(e.pointerId); // la captura va en la caja: la fila cambia de lugar en el DOM mientras se arrastra
    const mv = (ev) => {
      const dy = ev.clientY - y0 + base; row.style.transform = 'translateY(' + dy + 'px)';
      const sib = [...box.children].filter((x) => x.dataset.k && x !== row), r = row.getBoundingClientRect(), mid = r.top + r.height / 2, cy = (x) => { const b = x.getBoundingClientRect(); return b.top + b.height / 2; };
      const down = sib.filter((x) => (row.compareDocumentPosition(x) & 4) && mid > cy(x)), up_ = sib.filter((x) => !(row.compareDocumentPosition(x) & 4) && mid < cy(x));
      const over = down.length ? down[down.length - 1] : up_.length ? up_[0] : null;
      if (over) {
        const before = row.getBoundingClientRect().top;
        flip(() => { const after = row.compareDocumentPosition(over) & 4; if (after) over.after(row); else over.before(row); });
        base -= row.getBoundingClientRect().top - before; row.style.transform = 'translateY(' + (ev.clientY - y0 + base) + 'px)';
      }
    };
    const up = () => { box.removeEventListener('pointermove', mv); box.removeEventListener('pointerup', up); box.removeEventListener('pointercancel', up); row.classList.remove('drag'); row.animate([{ transform: row.style.transform }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' }); row.style.transform = '';
      l.k = [...box.children].filter((x) => x.dataset.k).map((x) => x.dataset.k); store.save(); refreshHead(); if (redraw) redraw(); };
    box.addEventListener('pointermove', mv); box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  });
  if (autoFind) setTimeout(() => openFind(l.id, () => { shell(); if (redraw) redraw(); }), 420);
}

/* ---------- buscar y sumar títulos ---------- */
export function openFind(id, done) {
  const l = byId(id), s = openSheet('<h3>Agregar títulos</h3><div class="ssub">Buscá por nombre o elegí algo que ya seguís.</div><div class="ls-in"><input id="lsq" type="search" placeholder="Buscar películas y series" autocomplete="off"></div><div class="ls-res" id="lsres"></div><button class="btn pri" data-close data-fin style="width:100%;margin-top:12px">Listo</button>', l.h);
  const box = s.el.querySelector('#lsres'), inp = s.el.querySelector('input'); setTimeout(() => inp.focus({ preventScroll: true }), 350);
  const S = store.state();
  const rowOf = (x, i) => '<div class="ls-fr' + (has(id, x.key) ? ' on' : '') + '" data-key="' + x.key + '" style="--i:' + i + '"><span class="im">' + (x.p ? '<img src="' + img(x.p, 'w185') + '" alt="">' : '') + '</span><span class="tx"><b>' + esc(x.t) + '</b><small>' + esc((x.type === 'tv' ? 'Serie' : 'Película') + (x.y ? ' · ' + x.y : '')) + '</small></span><button class="ls-tg" data-add aria-label="Agregar">' + ic('plus', 16, 2.4) + tick() + '</button></div>';
  const sugg = () => { const ks = [...new Set([...store.inProgress(), ...store.listed(), ...Object.keys(S.watched)])].filter((k) => store.meta(k)).slice(0, 8); box.innerHTML = ks.length ? '<div class="ls-k">Lo que ya seguís</div>' + ks.map((k, i) => { const m = store.meta(k); return rowOf({ key: k, type: m.type, id: m.id, t: m.t, p: m.p, y: m.y }, i); }).join('') : ''; };
  sugg();
  let t = null;
  inp.addEventListener('input', () => { clearTimeout(t); const q = inp.value.trim(); if (q.length < 2) { sugg(); return; } t = setTimeout(async () => { let r = []; try { r = ((await api.search(q)).results || []).filter((x) => x.poster_path || x.media_type).slice(0, 8); } catch (e) { /* sin red */ } box.innerHTML = r.length ? r.map((x, i) => { const type = x.media_type || (x.title ? 'movie' : 'tv'); return rowOf({ key: type + ':' + x.id, type, id: x.id, t: x.title || x.name, p: x.poster_path, y: ((x.release_date || x.first_air_date) || '').slice(0, 4) }, i); }).join('') : '<p class="ls-none">No encontré nada con ese nombre.</p>'; }, 220); });
  s.el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return; const row = b.closest('.ls-fr'), key = row.dataset.key, { type, id: tid } = store.parse(key);
    if (!store.meta(key)) { try { store.remember(type, await api.details(type, tid)); } catch (er) { const it = U && (U.byKey[key] || []).length && U.byId[U.byKey[key][0]].items.find((x) => x.key === key); if (it) store.rememberItem(it); } }
    const on = toggle(id, key); row.classList.toggle('on', on); row.classList.remove('pop'); void row.offsetWidth; row.classList.add('pop');
  });
  s.el.addEventListener('click', (e) => { if (e.target.closest('[data-fin]') && done) setTimeout(done, 80); });
}

/* ---------- un solo oyente para el botón de la ficha ---------- */
export function initLists() {
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-addlist]'); if (b) { e.preventDefault(); openAddTo(b.dataset.addlist, b.dataset.lt); } });
}
