// Universos: cada saga en orden, con "estoy aquí" y marcado en bloque.
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import { esc, ic, artHTML, posterImg, ring, animate, hueOf, fmtDate, daysUntil, parallax, toast, $, $$ } from './ui.js';

export const tab = 'universes';
const asNode = (i) => ({ poster: i.p, backdrop: i.b, title: i.t, g: [], id: i.id });

/* ---------- vista de un universo ---------- */
export async function mountCuratedUniverse(el, { id }) {
  let D; try { D = await data.load(); } catch (e) { el.innerHTML = '<div class="empty" style="padding-top:140px"><b>No pude cargar los universos</b>Probá de nuevo en un rato.</div>'; return; }
  const u = D.byId[id];
  if (!u) { el.innerHTML = '<div class="empty" style="padding-top:140px"><b>Universo no encontrado</b><a class="btn glass" href="#/universes">Ver universos</a></div>'; return; }
  return render(el, { id: u.id, title: u.title, sub: u.sub, modes: u.modes, items: u.items, cover: u.cover, hue: data.uhue(u) });
}

export async function mountCollection(el, { id }) {
  el.innerHTML = '<div class="uhero"><a class="gbtn backbtn" href="#/universes" aria-label="Volver">' + ic('back', 22, 2) + '</a></div><div class="pad" style="margin-top:20px"><div class="skel"><i></i><i></i><i></i></div></div>';
  let c; try { c = await api.collection(id); } catch (e) { el.innerHTML = '<div class="empty" style="padding-top:140px"><b>' + (e.code === 'offline' ? 'Sin conexión' : 'No pude cargar la colección') + '</b><a class="btn glass" href="#/universes">Volver</a></div>'; return; }
  if (!el.isConnected) return;
  const items = (c.parts || []).map((p) => ({ key: 'movie:' + p.id, k: 'movie', id: p.id, t: p.title, y: (p.release_date || '').slice(0, 4), d: p.release_date || null, p: p.poster_path, b: p.backdrop_path }))
    .sort((a, b) => (a.d || '9').localeCompare(b.d || '9'));
  const cover = items.find((i) => i.b) || items[0];
  return render(el, { id: 'c' + id, title: c.name.replace(/ (Collection|Colección)$/i, ''), sub: 'Colección de TMDB · en orden de estreno', modes: false, items, cover, hue: cover ? hueOf([], cover.id) : 215, overview: c.overview });
}

async function render(el, U) {
  let mode = U.modes ? 'chrono' : 'release', filter = 'all', open = null;
  const t0 = store.today();
  const hue = U.hue; el.style.setProperty('--h', hue); document.documentElement.style.setProperty('--h', hue);
  const ovCache = {};
  const locked = (i) => !!(i.d && i.d > t0);
  const items = () => (mode === 'release' ? [...U.items].sort((a, b) => (a.d || '9').localeCompare(b.d || '9')) : U.items);
  const frac = (i) => store.frac(i.key, i.eps);

  const stats = () => { const rel = U.items.filter((i) => !locked(i)); let done = 0, part = 0, sum = 0; rel.forEach((i) => { const f = frac(i); sum += f; if (f >= 0.999) done++; else if (f > 0) part++; }); return { done, part, total: rel.length, f: rel.length ? sum / rel.length : 0 }; };
  const soonItem = () => U.items.filter(locked).sort((a, b) => a.d.localeCompare(b.d))[0];

  const head = () => {
    const s = stats(), soon = soonItem(), dd = soon ? daysUntil(soon.d) : null;
    return '<div class="uhero" data-fade="1"><div class="hero-art">' + (U.cover ? artHTML({ backdrop: U.cover.b, poster: U.cover.p }) : '') + '</div><div class="hero-blur"></div><div class="hero-shade"></div>' +
      '<a class="gbtn backbtn" href="#/universes" aria-label="Universos">' + ic('back', 22, 2) + '</a>' +
      '<div class="hero-in"><div class="kick">Universo</div><h1 class="utitle">' + esc(U.title) + '</h1><div class="dmeta">' + esc(U.sub || '') + '</div>' +
      '<div class="uprog"><div class="ringwrap">' + ring(s.f, 58, 5) + '<b style="font-size:13px">' + Math.round(s.f * 100) + '%</b></div><div><big>' + s.done + '<small> / ' + s.total + '</small></big><span>vistos' + (s.part ? ' · ' + s.part + ' en curso' : '') + '</span></div></div>' +
      (soon && dd != null && dd >= 0 ? '<div class="soon">' + ic('lock', 14) + (dd === 0 ? 'Se estrena hoy' : dd === 1 ? 'Se estrena mañana' : 'Faltan ' + dd + ' días') + ' · ' + esc(soon.t) + '</div>' : '') + '</div></div>';
  };
  const ctrls = () => '<div class="ctrls">' + (U.modes ? '<div class="modes" role="tablist"><span class="ind" style="transform:translateX(' + (mode === 'release' ? '100%' : '0') + ')"></span><button data-a="mode" data-m="chrono" class="' + (mode === 'chrono' ? 'on' : '') + '">Orden de la historia</button><button data-a="mode" data-m="release" class="' + (mode === 'release' ? 'on' : '') + '">Por estreno</button></div>' : '') +
    '<div class="chips">' + [['all', 'Todo'], ['movie', 'Películas'], ['tv', 'Series'], ['pend', 'Pendientes']].map((f) => '<button data-a="filter" data-f="' + f[0] + '" class="' + (filter === f[0] ? 'on' : '') + '">' + f[1] + '</button>').join('') + '</div></div>';

  const list = (anim) => {
    const ord = items(); let here = null;
    ord.forEach((i) => { if (here === null && !locked(i) && frac(i) < 0.999) here = i.key; });
    let o = '<ul class="tl">', n = 0;
    ord.forEach((i) => {
      if (filter === 'movie' && i.k !== 'movie') return; if (filter === 'tv' && i.k !== 'tv') return;
      const f = frac(i); if (filter === 'pend' && f >= 0.999) return;
      const lk = locked(i); const cls = lk ? 'lock' : f >= 0.999 ? 'done' : f > 0 ? 'part' : '';
      const cnt = store.countWatched(i.key), tot = (store.meta(i.key) && store.meta(i.key).tot) || i.eps;
      const prog = i.k === 'tv' && f > 0 && f < 0.999 ? ' · ' + cnt + ' / ' + tot + ' episodios' : '';
      const meta = lk ? 'Estreno ' + fmtDate(i.d) : (i.k === 'movie' ? 'Película' : 'Serie') + ' · ' + (i.rl || i.y) + prog;
      const dot = lk ? ic('lock', 13, 2.2) : f >= 0.999 ? ic('check', 14, 3) : f > 0 ? ring(f, 24, 3) : '';
      o += '<li class="node ' + cls + (i.key === here ? ' here' : '') + (open === i.key ? ' open' : '') + (anim ? ' rise' : '') + '" data-key="' + i.key + '"' + (anim ? ' style="--i:' + Math.min(n++, 12) + '"' : '') + '>' +
        '<div class="rail"><button class="dot" data-a="dot" aria-label="' + (f >= 0.999 ? 'Marcar como no visto' : 'Marcar como visto') + '"' + (lk ? ' disabled' : '') + '>' + dot + '</button></div>' +
        '<div class="nc"><button class="nhead" data-a="node" aria-expanded="' + (open === i.key) + '">' + posterImg({ title: i.t, poster: i.p, g: [], id: i.id }, 'w154') + '<div><div class="nm">' + esc(i.t) + '</div><div class="nmeta">' + esc(meta) + '</div>' + (i.key === here ? '<span class="badge">Estoy aquí</span>' : '') + '</div></button>' +
        '<div class="nx"><div><p data-ov>' + esc(ovCache[i.key] || '') + '</p><div class="acts">' + (lk ? '' : '<button class="btn glass small" data-a="upto">Marcar hasta acá</button>') + '<a class="btn glass small" href="#/' + i.k + '/' + i.id + '">Ver ficha</a></div></div></div></div></li>';
    });
    return o + '</ul>';
  };

  el.innerHTML = '<div id="uh">' + head() + '</div><div id="uc">' + ctrls() + '</div>' + (U.overview ? '<div class="pad" style="margin-top:6px"><p class="secsub">' + esc(U.overview) + '</p></div>' : '') + '<div id="ul">' + list(true) + '</div>' +
    '<div class="pad attr" style="margin-top:26px">' + (U.modes ? 'El orden de la historia es una curaduría y puede discutirse. Cambiá a “Por estreno” si preferís el orden de salida.' : '') + '</div>';
  animate(el);
  const stop = parallax(el);

  const redraw = (parts) => { if (parts.head) $('#uh', el).innerHTML = head(); if (parts.ctrls) $('#uc', el).innerHTML = ctrls(); $('#ul', el).innerHTML = list(false); animate(el); };
  const byKey = (k) => U.items.find((i) => i.key === k);

  async function setDone(i, on) {
    if (i.k === 'movie') { store.rememberItem(i); store.setMovie(i.key, on); return; }
    if (!on) { store.unmarkAll(i.key); return; }
    try { const d = await api.tv(i.id); store.remember('tv', d); store.markAll(i.key); } catch (e) { toast('Sin conexión: no pude marcar ' + i.t); }
  }

  el.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-a]'); if (!a) return; const act = a.dataset.a;
    if (act === 'mode') { mode = a.dataset.m; $('.modes .ind', el).style.transform = 'translateX(' + (mode === 'release' ? '100%' : '0') + ')'; $$('.modes button', el).forEach((b) => b.classList.toggle('on', b === a)); return redraw({}); }
    if (act === 'filter') { filter = a.dataset.f; $$('.chips button', el).forEach((b) => b.classList.toggle('on', b === a)); return redraw({}); }
    const node = a.closest('.node'); if (!node) return; const i = byKey(node.dataset.key);
    if (act === 'node') {
      open = open === i.key ? null : i.key;
      $$('.node', el).forEach((n) => { n.classList.toggle('open', n.dataset.key === open); const h = $('.nhead', n); if (h) h.setAttribute('aria-expanded', String(n.dataset.key === open)); });
      if (open && ovCache[i.key] == null) { try { const d = await api.details(i.k, i.id); ovCache[i.key] = d.overview || 'Sin sinopsis disponible.'; } catch (err) { ovCache[i.key] = 'Sin conexión: la sinopsis no está disponible ahora.'; } const p = $('[data-ov]', node); if (p) p.textContent = ovCache[i.key]; }
      return;
    }
    if (act === 'dot') { await setDone(i, frac(i) < 0.999); return redraw({ head: 1 }); }
    if (act === 'upto') {
      const ord = items(), stopAt = ord.indexOf(i); toast('Marcando…');
      await Promise.all(ord.slice(0, stopAt + 1).filter((x) => !locked(x) && frac(x) < 0.999).map((x) => setDone(x, true)));
      redraw({ head: 1 }); toast('Marcado todo hasta “' + i.t + '”'); return;
    }
  });
  return stop;
}

/* ---------- pestaña Universos ---------- */
export async function mountList(el) {
  if (!store.state().key) { location.hash = '#/setup'; return; }
  let D; try { D = await data.load(); } catch (e) { D = { universes: [], byKey: {} }; }
  const S = store.state();
  el.style.setProperty('--h', 215); document.documentElement.style.setProperty('--h', 215);
  const tr = Object.keys(S.meta).filter((k) => store.tracked(k));
  const tU = new Set(); tr.forEach((k) => (D.byKey[k] || []).forEach((u) => tU.add(u)));
  const unis = [...D.universes].sort((a, b) => (tU.has(b.id) ? 1 : 0) - (tU.has(a.id) ? 1 : 0));
  const colls = {};
  tr.forEach((k) => { const m = S.meta[k]; if (m.type === 'movie' && m.coll && !(D.byKey[k] || []).length) colls[m.coll.id] = m.coll; });
  let o = '<div class="pagehead"><h1>Universos</h1><div class="secsub">Cada historia con su orden y por dónde vas</div></div><div class="pad" style="display:grid;gap:14px;margin-top:20px">';
  unis.forEach((u, ix) => {
    const s = data.stats(u);
    o += '<a class="ucard big rise" style="--h:' + data.uhue(u) + ';--i:' + Math.min(ix, 8) + '" href="#/universe/' + u.id + '">' + (u.cover ? artHTML({ backdrop: u.cover.b, poster: u.cover.p }).replace('w1280', 'w780') : '') + '<div class="uc-in"><div><div class="uc-t" style="font-size:32px">' + esc(u.title) + '</div><div class="uc-s">' + esc(u.sub) + ' · ' + s.done + ' de ' + s.total + ' vistos</div></div><div class="ringwrap">' + ring(s.f, 52, 4) + '<b>' + Math.round(s.f * 100) + '%</b></div></div></a>';
  });
  const cl = Object.values(colls);
  if (cl.length) {
    o += '</div><div class="pad secbox"><h2 class="sec">Colecciones detectadas</h2><div class="secsub">Películas que viste y tienen secuelas o precuelas</div></div><div class="pad" style="display:grid;gap:14px">';
    cl.forEach((c, ix) => { o += '<a class="ucard big rise" style="--h:' + ((c.id * 47) % 360) + ';--i:' + ix + '" href="#/collection/' + c.id + '">' + artHTML({ backdrop: c.b, poster: c.p }).replace('w1280', 'w780') + '<div class="uc-in"><div><div class="uc-t" style="font-size:28px">' + esc(c.name.replace(/ (Collection|Colección)$/i, '')) + '</div><div class="uc-s">Colección de TMDB</div></div>' + ic('chev', 22) + '</div></a>'; });
  }
  o += '</div><div class="pad" style="margin-top:14px"><div class="addcard">' + ic('plus', 24) + '<b style="color:var(--fg)">Más universos</b><span>Cuando una película que seguís pertenece a una saga de TMDB, aparece acá sola. Podés sumar más universos curados cuando quieras.</span></div></div>';
  el.innerHTML = o; animate(el);
}
