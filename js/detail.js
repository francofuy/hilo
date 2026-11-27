// Ficha de serie o película.
import * as store from './store.js';
import * as api from './api.js';
import { swipeRows } from './motion.js';
import { options, platUrl, platAttr } from './platform.js';
import { launch } from './back.js';
import * as data from './data.js';
import { nextEpisode } from './progress.js';
import { openRecap, openSheet } from './sheet.js';
import * as extras from './extras.js';
import { resolveTheme, applyTheme } from './theme.js';
import { esc, ic, artHTML, posterCard, ring, animate, normItem, fromMeta, hueOf, img, epLabel, fmtDate, parallax, toast, $, $$ } from './ui.js';

export const tab = null;
const q = encodeURIComponent;
const BASED = { 'based on comic': 'Basada en un cómic', 'based on comic book': 'Basada en un cómic', 'based on graphic novel': 'Basada en una novela gráfica', 'based on novel or book': 'Basada en una novela o libro', 'based on novel': 'Basada en una novela', 'based on young adult novel': 'Basada en una novela juvenil', 'based on manga': 'Basada en un manga', 'based on video game': 'Basada en un videojuego', 'based on true story': 'Basada en hechos reales', 'based on tv series': 'Basada en una serie', 'based on cartoon': 'Basada en una caricatura', 'based on short story': 'Basada en un cuento', 'based on play or musical': 'Basada en una obra de teatro', 'based on anime': 'Basada en un anime' };

const heroAssetsOf = (d) => api.assetsFrom(d.images);
function scenesOf(d) {
  const bd = (d.images && d.images.backdrops) || [];
  return bd.filter((b) => b.iso_639_1 == null && b.aspect_ratio > 1.7 && b.aspect_ratio < 1.85 && b.file_path !== d.backdrop_path)
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    // las variantes de una misma imagen suelen quedar juntas en la lista: se toman escenas espaciadas
    .filter((_, i, all) => all.length <= 8 || i % Math.min(4, Math.floor(all.length / 6)) === 1).slice(0, 6).map((b) => img(b.file_path, 'w780'));
}
const back = () => { if (history.length > 1) history.back(); else location.hash = '#/'; };
const errHTML = (e) => '<div class="empty" style="padding-top:calc(var(--st) + 120px)"><b>' + (e.code === 'offline' ? 'Sin conexión' : e.code === 'badkey' ? 'La API key no funciona' : 'No pude cargar esto') + '</b>' +
  (e.code === 'offline' ? 'Este título no se guardó para verlo sin internet. Entrá cuando tengas conexión y tocá el ícono de descarga para guardarlo.' : e.code === 'badkey' ? 'Revisala en Ajustes.' : esc(e.message || '')) +
  '<div style="display:flex;gap:10px;justify-content:center;margin-top:20px"><button class="btn glass" data-a="back">Volver</button><button class="btn pri" data-a="retry">Reintentar</button></div></div>';

export async function mount(el, { type, id, query }) {
  const k = store.kid(type, id);
  const isTv = type === 'tv';
  const m0 = store.meta(k);
  el.dataset.fade = '1';
  el.innerHTML = '<div class="dhero"><button class="gbtn backbtn" data-a="back" aria-label="Volver">' + ic('back', 22, 2) + '</button></div><div class="pad" style="margin-top:20px"><div class="skel"><i></i><i></i><i></i></div></div>';
  if (m0) { el.style.setProperty('--h', hueOf(m0.g, id)); document.documentElement.style.setProperty('--h', hueOf(m0.g, id)); }
  const onClickEarly = (e) => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'back') back(); if (a.dataset.a === 'retry') { api.clearMemory(); mount(el, { type, id, query }); } };
  el.addEventListener('click', onClickEarly);

  let d;
  try { d = await api.details(type, id); } catch (e) {
    if (!el.isConnected) return;
    if (e.code === 'badkey') { location.hash = '#/settings'; return; }
    el.innerHTML = errHTML(e); return;
  }
  if (!el.isConnected) return;
  el.removeEventListener('click', onClickEarly);

  let U; try { U = await data.load(); } catch (e) { U = { byKey: {}, byId: {} }; }
  store.remember(type, d);
  const n = normItem(d, type), S = store.state();
  const pal = null; // TMDB no permite leer los colores de sus imágenes: el tono sale del universo o del género
  const T = resolveTheme(k, d, n.g, U, pal), hue = T.h;
  const assets = heroAssetsOf(d), bdSrc = img(d.backdrop_path, 'w1280');
  const posterSrc = assets.poster || bdSrc || img(d.poster_path, 'w780'), textFree = !!(assets.poster || bdSrc);
  const SC = scenesOf(d);
  el.style.setProperty('--h', hue); document.documentElement.style.setProperty('--h', hue);
  const title = n.title, orig = d.original_title || d.original_name || title, t0 = store.today();
  const popts = options(type, id, title, d); // dónde verlo entre tus plataformas

  /* ---------- datos derivados ---------- */
  const GEN = { 'Action & Adventure': 'Acción y aventura', 'Sci-Fi & Fantasy': 'Ciencia ficción y fantasía', 'War & Politics': 'Bélica y política', Kids: 'Infantil', Soap: 'Telenovela', Talk: 'Entrevistas', News: 'Noticias' };
  const genres = (d.genres || []).slice(0, 2).map((g) => GEN[g.name] || g.name);
  const rt = d.runtime ? (d.runtime >= 60 ? Math.floor(d.runtime / 60) + ' h ' + (d.runtime % 60 ? (d.runtime % 60) + ' min' : '') : d.runtime + ' min') : '';
  const metaBits = [isTv ? 'Serie' : 'Película', n.year && (isTv && d.last_air_date && d.last_air_date.slice(0, 4) !== n.year && d.status !== 'Returning Series' ? n.year + '–' + d.last_air_date.slice(0, 4) : n.year),
    isTv ? (d.number_of_seasons ? d.number_of_seasons + (d.number_of_seasons === 1 ? ' temporada' : ' temporadas') : '') : rt, ...genres].filter(Boolean);
  const vote = d.vote_count >= 30 && d.vote_average ? '<span class="vote"><svg width="13" height="13" viewBox="0 0 24 24">' + '<path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6-4.5-4.2 6.1-.7z"/></svg>' + d.vote_average.toFixed(1) + '</span>' : '';
  const seasonsAll = isTv ? (d.seasons || []).filter((s) => s.episode_count > 0) : [];
  const regular = seasonsAll.filter((s) => s.season_number > 0), specials = seasonsAll.find((s) => s.season_number === 0);
  const firstOpen = regular.find((s) => store.seasonCount(k, s.season_number) < s.episode_count);
  let curSeason = (firstOpen || regular[regular.length - 1] || {}).season_number || 1;

  const tabs = [];
  if (isTv) tabs.push(['eps', 'Episodios']);
  tabs.push(['uni', 'Universo']);
  const cast = isTv ? ((d.aggregate_credits && d.aggregate_credits.cast) || []) : ((d.credits && d.credits.cast) || []);
  if (cast.length) tabs.push(['cast', 'Reparto']);
  tabs.push(['com', 'Comunidad']);

  /* ---------- HTML ---------- */
  const longT = title.length > 22 ? ' long' : '';
  const starBtns = [1, 2, 3, 4, 5].map((s) => '<button data-a="rate" data-n="' + s + '" class="' + ((S.rate[k] || 0) >= s ? 'on' : '') + '" aria-label="' + s + ' estrellas"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6-4.5-4.2 6.1-.7z"/></svg></button>').join('');
  let html = newHero();
  tabs.forEach(([p], i) => { html += '<div class="pane" data-pane="' + p + '"' + (i ? ' hidden' : '') + '>' + pane(p) + '</div>'; });
  el.innerHTML = html;
  const TN = { ...T, id: 'clean', deco: '', hero: '', fx: [], bind: null, above: false };
  const stopTheme = applyTheme(el, TN);
  const rootEl = document.documentElement;
  rootEl.classList.add('nd', 'nd-full');
  // la imagen es el fondo de TODA la pantalla: nítida arriba y, al bajar, una copia desenfocada y oscura la reemplaza
  const fsEl = document.createElement('div'); fsEl.className = 'fs-bg';
  fsEl.innerHTML = '<img class="a" src="' + posterSrc + '" alt=""><img class="b" src="' + posterSrc + '" alt=""><i></i>';
  document.body.appendChild(fsEl);
  const fsA = $('.a', fsEl), fsB = $('.b', fsEl); let fsRaf = 0;
  const fsUpd = () => { fsRaf = 0; const hero = $('.fs-hero', el), h = Math.max(1, (hero ? hero.offsetHeight : 600) * 0.62), p = Math.max(0, Math.min(1, window.scrollY / h)); fsB.style.opacity = p; fsA.style.transform = 'scale(' + (1 + p * 0.06) + ')'; };
  const fsFn = () => { if (!fsRaf) fsRaf = requestAnimationFrame(fsUpd); };
  window.addEventListener('scroll', fsFn, { passive: true }); fsUpd();
  animate(el);

  /* ---------- héroe: poco texto y una acción principal ---------- */
  function newHero() {
    const lg = !textFree ? '<h1 class="sr">' + esc(title) + '</h1>' : assets.logo ? '<img class="lg" src="' + assets.logo + '" alt="' + esc(title) + '">' : '<h1 class="dtitle nt' + longT + '">' + esc(title) + '</h1>';
    const rate = d.vote_count >= 30 && d.vote_average ? d.vote_average.toFixed(1) + ' · ' : '';
    const yrs = isTv && d.last_air_date && d.last_air_date.slice(0, 4) !== n.year && d.status !== 'Returning Series' ? n.year + '–' + d.last_air_date.slice(0, 4) : n.year;
    const mt = '<div class="mt">' + esc(rate + [isTv ? 'Serie' : 'Película', yrs, isTv ? (d.number_of_seasons ? d.number_of_seasons + (d.number_of_seasons === 1 ? ' temporada' : ' temporadas') : '') : rt].filter(Boolean).join(' · ')) + '</div>';
    const back = '<button class="gbtn backbtn" data-a="back" aria-label="Volver">' + ic('back', 22, 2) + '</button>';
    const pri = '<div class="pri-row"><button class="btn pri" id="mainbtn" data-a="main"></button></div>';
    // en las series, el botón de Retomar abre la plataforma (o pregunta dónde); en las películas, esta acción
    const openBtn = !isTv && popts.length ? '<a class="ab" href="' + popts[0].url + '" target="_blank" rel="noopener"' + platAttr(type, id, title, popts) + '>' + ic('play', 24) + '<span>Ver' + (popts.length > 1 ? '' : ' en ' + esc(popts[0].short)) + '</span></a>' : '';
    const acts = '<div class="acts3">' + openBtn + '<button class="ab" id="folbtn" data-a="follow" aria-label="Seguir"></button>' + (isTv ? '<button class="ab" id="recapbtn" data-recap="' + k + '" hidden>' + ic('prev', 24) + '<span>Anteriormente</span></button>' : '') + '<button class="ab" id="offbtn" data-a="off" aria-label="Guardar para ver sin conexión"></button></div>';
    const long = (d.overview || '').length > 150;
    const syn = '<p class="syn' + (long ? ' clamp' : '') + '">' + esc(d.overview || 'Sin sinopsis disponible.') + '</p>' + (long ? '<button class="more" data-a="more">Más</button>' : '');
    const tabsH = '<div class="tabs" id="tabs"><button class="gbtn mini" data-a="back" aria-label="Volver">' + ic('back', 20, 2) + '</button><div class="seg" role="tablist">' + tabs.map((t, i) => '<button role="tab" data-a="tab" data-p="' + t[0] + '" class="' + (i === 0 ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div>';
    return '<div class="fs-hero">' + back + '<div class="fs-in">' + lg + mt + pri + acts + '</div></div><div class="pad fs-body">' + syn + '</div>' + tabsH;
  }

  /* ---------- paneles ---------- */
  function pane(p) {
    if (p === 'eps') {
      let o = '<div class="seasons">' + regular.map((s) => '<button data-a="season" data-s="' + s.season_number + '" class="' + (s.season_number === curSeason ? 'on' : '') + '">T' + s.season_number + '</button>').join('') + (specials ? '<button data-a="season" data-s="0">Especiales</button>' : '') + '</div>';
      seasonsAll.forEach((s) => { o += '<div class="season" data-s="' + s.season_number + '"' + (s.season_number === curSeason ? '' : ' hidden') + '><div class="sh"><h3>' + (s.season_number === 0 ? 'Especiales' : 'Temporada ' + s.season_number) + '</h3><span class="sc" data-sc></span></div><div class="bar" style="--n:' + s.episode_count + '"><i></i></div>' + (s.season_number > 0 ? '<div style="text-align:right"><button class="linkbtn" data-a="seasonall" data-s="' + s.season_number + '">Marcar temporada</button></div>' : '') + '<ul class="eps"><li class="skel"><i></i><i></i></li></ul></div>'; });
      return o;
    }
    if (p === 'uni') return uniPane();
    if (p === 'cast') {
      const people = cast.filter((c) => c.name).slice(0, 18);
      const who = isTv ? (d.created_by || []).map((c) => c.name) : ((d.credits && d.credits.crew) || []).filter((c) => c.job === 'Director').map((c) => c.name);
      return (who.length ? '<div class="secsub" style="margin-bottom:14px">' + (isTv ? 'Creada por ' : 'Dirigida por ') + '<b style="color:var(--fg)">' + esc([...new Set(who)].join(', ')) + '</b></div>' : '') +
        '<div class="cast">' + people.map((c) => { const role = isTv ? (c.roles && c.roles[0] && c.roles[0].character) : c.character; const ini = c.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
          return '<div class="pers"><div class="av">' + ini + (c.profile_path ? '<img src="' + img(c.profile_path, 'w185') + '" alt="" loading="lazy" onload="this.classList.add(\'ld\')" onerror="this.remove()">' : '') + '</div><b>' + esc(c.name) + '</b><span>' + esc(role || '') + '</span></div>'; }).join('') + '</div>';
    }
    return '<div id="com-root"><div class="skel"><i></i><i></i><i></i></div></div>';
  }

  function uniPane() {
    let o = '';
    const uids = U.byKey[k] || [];
    uids.forEach((uid, ix) => {
      const u = U.byId[uid], s = data.stats(u);
      o += '<a class="st-r un-link" href="#/universe/' + u.id + '"><span class="l">Parte de ' + esc(u.title) + '</span><span class="v">' + s.done + ' de ' + s.total + '</span>' + ic('chev', 16) + '</a>';
      if (ix === 0) {
        // tira de pósters en orden, centrada en este título
        const pref = data.prefOrder(u, (S.uorder || {})[u.id]), ord = data.sequence(u, pref), i = ord.findIndex((x) => x.key === k);
        if (i > -1 && ord.length > 1) {
          const from = Math.max(0, i - 2), to = Math.min(ord.length, i + 5);
          o += '<div class="sub">' + data.ORDER_LABEL[pref] + (pref === data.metaOf(u).rec ? ' · recomendado' : '') + '</div><div class="un-strip" id="strip">' + ord.slice(from, to).map((x, n) => {
            const j = from + n, here = j === i, cap = here ? 'Esta ficha' : j === i - 1 ? 'Antes' : j === i + 1 ? 'Después' : (data.roleOf(u, x.key) ? data.roleOf(u, x.key).label : String(x.y || ''));
            const nx = ord[j + 1], litc = nx && j < to - 1 && store.isDone(x.key, x.eps) && (store.isDone(nx.key, nx.eps) || j + 1 === i);
            return '<a class="un-pc' + (here ? ' here' : '') + (store.isDone(x.key, x.eps) ? ' done' : '') + (litc ? ' lit' : '') + '" style="--i:' + n + '" href="#/' + x.k + '/' + x.id + '"><i class="nd"></i><span class="im">' + (x.p ? '<img src="' + img(x.p, 'w185') + '" alt="">' : '') + (store.isDone(x.key, x.eps) ? '<u>' + ic('check', 14, 3) + '</u>' : '') + '</span><b>' + esc(x.t) + '</b><small>' + esc(cap) + '</small></a>';
          }).join('') + '</div>';
        }
      }
    });
    const c = d.belongs_to_collection;
    if (c) o += '<a class="st-r un-link" href="#/collection/' + c.id + '"><span class="l">Colección · ' + esc(c.name.replace(/\s*[-–:]?\s*(Collection|Colección|Saga|Trilogía)\s*$/i, '').replace(/\s*[-–:]\s*$/, '')) + '</span>' + ic('chev', 16) + '</a>';
    const recs = ((d.recommendations && d.recommendations.results) || []).filter((r) => r.poster_path).slice(0, 14);
    if (recs.length) o += '<div class="sub">Si te gustó esto</div><div class="row" style="margin:0 calc(-1*var(--gr)) 0 calc(-1*var(--gl))">' + recs.map((r) => posterCard(normItem(r, type), { w: 118 })).join('') + '</div>';
    if (!o) o = '<div class="note">' + ic('info', 18) + '<span>No hay conexiones cargadas para este título todavía.</span></div>';
    return o;
  }

  function starSvg() { return '<svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6-4.5-4.2 6.1-.7z"/></svg>'; }
  let X = null;
  function communityHTML(X0) {
    X = X0;
    const watched = isTv ? store.isDone(k) : store.isMovieWatched(k);
    const gate = (inner, what) => watched ? inner : '<div class="gate"><div class="gated">' + inner + '</div><div class="cover"><b>Puede contar la historia</b><span>' + what + '</span><button class="btn glass small" data-a="reveal">Mostrar igual</button></div></div>';
    let o = '<section class="csec"><h3 class="ch">Tu puntuación</h3><div class="stars" role="group" aria-label="Tu puntuación" style="margin-top:0">' + starBtns + '</div></section>';
    const shots = [d.backdrop_path && img(d.backdrop_path, 'w780'), ...SC].filter(Boolean);
    if (shots.length > 1) o += '<section class="csec"><h3 class="ch">Escenas <small>' + shots.length + ' imágenes</small></h3><div class="gal">' + shots.map((u, i) => '<button data-a="shot" data-i="' + i + '" aria-label="Ver escena ' + (i + 1) + '"><img src="' + u + '" alt="" loading="lazy"></button>').join('') + '</div></section>';
    if (X.trailer) o += '<section class="csec"><h3 class="ch">Tráiler</h3><button class="vid" data-a="play" data-k="' + esc(X.trailer.key) + '" aria-label="Reproducir tráiler">' + (d.backdrop_path ? '<img src="' + img(d.backdrop_path, 'w780') + '" alt="">' : '') + '<span class="pl"><span class="pb">' + ic('play', 26) + '</span></span><span class="vt">' + esc(X.trailer.name) + '</span></button></section>';
    if (X.reviews && X.reviews.length) {
      const cards = X.reviews.map((r, i) => '<div class="rev"><div class="rh"><div class="rav">' + esc((r.a || '?')[0].toUpperCase()) + '</div><div><div class="rn">' + esc(r.a) + '</div><div class="rd">' + esc(fmtDate(r.d)) + '</div></div>' + (r.r != null ? '<div class="rr">' + starSvg() + r.r + '/10</div>' : '') + '</div><p>' + esc(r.tx) + '</p><button class="more" data-a="rev" data-i="' + i + '">Leer reseña completa</button></div>').join('');
      o += '<section class="csec"><h3 class="ch">Lo que dice la gente <small>reseñas de usuarios de TMDB</small></h3>' + gate('<div class="revs">' + cards + '</div>', 'Las reseñas pueden mencionar giros y finales.') + '</section>';
    }
    if (X.wiki) {
      const w = X.wiki, items = (w.sections || []).map((sct) => '<div class="ai"><button data-a="acc" aria-expanded="false"><span>' + esc(sct.t) + (sct.lang !== w.lang ? '<span class="lang">en inglés</span>' : '') + '</span>' + ic('chev', 16) + '</button><div class="ab"><div><p>' + esc(sct.tx) + '</p></div></div></div>').join('');
      o += '<section class="csec"><h3 class="ch">Sobre ' + (isTv ? 'la serie' : 'la película') + ' <small>Wikipedia</small></h3><p class="wsum">' + esc(w.summary) + '</p>' + (items ? gate('<div class="acc">' + items + '</div>', 'El argumento y la recepción cuentan lo que pasa.') : '') +
        '<p class="credit">Texto de Wikipedia (' + esc(w.lang === 'es' ? 'español' : 'inglés') + '), bajo licencia CC BY-SA 4.0.</p></section>';
    }
    const kw = isTv ? ((d.keywords && d.keywords.results) || []) : ((d.keywords && d.keywords.keywords) || []);
    const based = kw.map((x) => x.name.toLowerCase()).filter((x) => x.indexOf('based on') === 0);
    if (based.length) o += '<section class="csec"><h3 class="ch">Obra original</h3><div class="chips">' + based.map((b) => '<span class="src">' + esc(BASED[b] || 'Basada en: ' + b.replace('based on ', '')) + '</span>').join('') + '</div><p class="credit">Próximamente: comparativa con el original (qué cambió y qué no), con spoilers tapados hasta que llegues a ese punto.</p></section>';
    const wp = d['watch/providers'] && d['watch/providers'].results && d['watch/providers'].results[S.region];
    if (wp) {
      const grp = (label, arr) => arr && arr.length ? '<div class="sub">' + label + ' · ' + S.region + '</div><div class="provs">' + arr.map((p) => '<' + (platUrl(p.provider_name, title, type, id) ? 'a href="' + platUrl(p.provider_name, title, type, id) + '" target="_blank" rel="noopener"' : 'div') + ' class="prov" title="' + esc(p.provider_name) + '"><img src="' + img(p.logo_path, 'w92') + '" alt="' + esc(p.provider_name) + '" loading="lazy"></' + (platUrl(p.provider_name, title, type, id) ? 'a' : 'div') + '>').join('') + '</div>' : '';
      const body = grp('Streaming', wp.flatrate) + grp('Alquiler', wp.rent) + grp('Compra', wp.buy);
      if (body) o += '<section class="csec"><h3 class="ch">Dónde verla</h3>' + body + '<p class="credit">Disponibilidad: JustWatch, vía TMDB.</p></section>';
    }
    if (kw.length) o += '<section class="csec"><h3 class="ch">Temas</h3><div class="chips">' + kw.slice(0, 10).map((x) => '<span>' + esc(x.name) + '</span>').join('') + '</div></section>';
    return o || '<div class="note">' + ic('info', 18) + '<span>Todavía no hay contenido de la comunidad para este título.</span></div>';
  }
  let comLoaded = false;
  async function loadCommunity() {
    if (comLoaded) return; comLoaded = true;
    const box = $('#com-root', el); if (!box) return;
    try { const X0 = await extras.community(type, id, d); box.innerHTML = communityHTML(X0); animate(el); }
    catch (e) { box.innerHTML = '<div class="note">' + ic('info', 18) + '<span>' + (e.code === 'offline' ? 'Sin conexión. La comunidad necesita internet.' : 'No pude cargar la comunidad.') + '</span></div>'; comLoaded = false; }
  }

  /* ---------- episodios ---------- */
  const seasonData = {};
  const rowHTML = (s, ep) => {
    const e = ep.episode_number, aired = ep.air_date && ep.air_date <= t0;
    const bits = [aired ? fmtDate(ep.air_date) : (ep.air_date ? 'Estreno ' + fmtDate(ep.air_date) : 'Sin fecha'), ep.runtime ? ep.runtime + ' min' : ''].filter(Boolean).join(' · ');
    const em = T.epMeta ? T.epMeta(s, e) : null;
    return '<li class="ep' + (aired ? '' : ' future') + (em && em[1] === 'bw' ? ' era-bw' : '') + '" data-s="' + s + '" data-e="' + e + '"><button class="ck" data-a="tog" aria-label="Marcar como visto">' + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4.2 4.2L18.5 8"/></svg></button>' +
      '<div class="et" data-a="exp"><div class="still">' + (ep.still_path ? '<img src="' + img(ep.still_path, 'w300') + '" alt="" loading="lazy" onload="this.classList.add(\'ld\')" onerror="this.remove()">' : '') + '</div><div class="tt"><span class="nxb">Siguiente</span>' + (s > 0 ? e + '. ' : '') + esc(ep.name || 'Episodio ' + e) + '<small>' + (em ? '<span class="era">' + esc(em[0]) + '</span>' : '') + esc(bits) + '</small></div>' + ic('chev', 14) + '</div>' +
      '<div class="es"><div>' + (ep.overview ? '<p class="sy" data-a="rv">' + esc(ep.overview) + '</p><span class="spl">Toca para ver igual (spoiler)</span>' : '<p class="nos">Sin sinopsis disponible.</p>') +
      '<div class="eacts">' + (aired && s > 0 ? '<button class="btn glass small" data-a="upto">Marcar hasta acá</button>' : '') + '<a class="btn glass small" href="https://www.reddit.com/search/?q=' + q(orig + ' S' + String(s).padStart(2, '0') + 'E' + String(e).padStart(2, '0')) + '" target="_blank" rel="noopener">Debate ' + ic('ext', 14) + '</a></div></div></div></li>';
  };
  async function loadSeason(s) {
    const box = $('.season[data-s="' + s + '"]', el); if (!box || box.dataset.loaded) return;
    try {
      const sd = await api.season(id, s); if (!el.isConnected) return;
      seasonData[s] = sd.episodes || [];
      $('.eps', box).innerHTML = seasonData[s].map((ep) => rowHTML(s, ep)).join('') || '<li class="note">Sin episodios cargados.</li>';
      box.dataset.loaded = '1'; syncRows();
    } catch (e) { $('.eps', box).innerHTML = '<li class="note">' + ic('info', 18) + '<span>' + (e.code === 'offline' ? 'Sin conexión. Guardá esta serie con el ícono de descarga para verla offline.' : 'No pude cargar la temporada.') + '</span></li>'; }
  }
  let ne = null;
  function syncRows() {
    $$('.ep', el).forEach((li) => { const s = +li.dataset.s, e = +li.dataset.e; li.classList.toggle('done', store.epDone(k, s, e)); li.classList.toggle('next', !!ne && !ne.upcoming && ne.s === s && ne.e === e); });
    $$('.season', el).forEach((box) => { const s = +box.dataset.s, sa = seasonsAll.find((x) => x.season_number === s); if (!sa) return; const c = store.seasonCount(k, s); $('[data-sc]', box).textContent = c + ' / ' + sa.episode_count; const bi = $('.bar i', box); if (bi) bi.style.width = (c / sa.episode_count * 100) + '%'; });
  }
  async function refresh() {
    store.remember(type, d);
    if (isTv) { try { ne = await nextEpisode(k); } catch (e) { ne = null; } syncRows(); }
    syncCta();
  }
  function syncCta() {
    const b = $('#mainbtn', el), fol = $('#folbtn', el), off = $('#offbtn', el);
    if (isTv) {
      const c = store.countWatched(k), done = store.isDone(k);
      if (done) b.innerHTML = ic('check', 18) + 'Serie al día';
      else if (ne && ne.upcoming) b.innerHTML = ic('play', 18) + 'Próximo: ' + (ne.air ? fmtDate(ne.air) : 'sin fecha');
      else if (ne) b.innerHTML = ic('play', 18) + (c ? 'Retomar · ' : 'Empezar · ') + epLabel(ne.s, ne.e);
      else b.innerHTML = ic('play', 18) + (c ? 'Retomar' : 'Empezar');
      $('#recapbtn', el).hidden = !c;
    } else b.innerHTML = store.isMovieWatched(k) ? ic('check', 18) + 'Vista' : 'Marcar como vista';
    fol.classList.toggle('on', store.isFollowed(k)); fol.innerHTML = ic(store.isFollowed(k) ? 'markok' : 'mark', 24) + '<span>' + (store.isFollowed(k) ? 'Siguiendo' : 'Seguir') + '</span>';
    off.classList.toggle('on', !!S.off[k]); off.innerHTML = ic(S.off[k] ? 'dlok' : 'dl', 24) + '<span>' + (S.off[k] ? 'Guardada' : 'Descargar') + '</span>';
    $$('.stars button', el).forEach((s) => s.classList.toggle('on', (S.rate[k] || 0) >= +s.dataset.n));
  }
  if (isTv) { await 0; loadSeason(curSeason); }
  refresh();

  function focusNext() {
    switchTab('eps'); if (!ne || ne.upcoming) return;
    selectSeason(ne.s);
    const go = () => { const row = $('.ep[data-s="' + ne.s + '"][data-e="' + ne.e + '"]', el); if (!row) return false; row.classList.add('open'); window.scrollTo({ top: row.getBoundingClientRect().top + window.scrollY - 200, behavior: 'smooth' }); return true; };
    let tries = 0; const iv = setInterval(() => { if (go() || ++tries > 20) clearInterval(iv); }, 150);
  }
  function selectSeason(s) {
    $$('.seasons button', el).forEach((b) => b.classList.toggle('on', +b.dataset.s === +s));
    $$('.season', el).forEach((x) => { x.hidden = +x.dataset.s !== +s; }); curSeason = +s; loadSeason(s);
  }
  function switchTab(p) {
    $$('.seg button', el).forEach((b) => b.classList.toggle('on', b.dataset.p === p));
    $$('.pane', el).forEach((pn) => { const show = pn.dataset.pane === p; pn.hidden = !show; pn.classList.toggle('show', show); });
    if (p === 'com') loadCommunity();
    if (p === 'uni') requestAnimationFrame(() => { const st = $('#strip', el), h = st && $('.here', st); if (st && h) st.scrollLeft = h.offsetLeft - (st.clientWidth - h.offsetWidth) / 2; });
    animate(el);
  }
  if (query && query.tab) switchTab(query.tab);
  if (query && query.go === 'next' && isTv) setTimeout(focusNext, 400);

  /* ---------- guardar sin conexión ---------- */
  async function saveOffline() {
    const urls = new Set([img(d.poster_path, 'w342'), img(d.backdrop_path, 'w1280'), img(d.backdrop_path, 'w780'), img(d.poster_path, 'w780')]);
    cast.slice(0, 18).forEach((c) => c.profile_path && urls.add(img(c.profile_path, 'w185')));
    ((d.recommendations && d.recommendations.results) || []).slice(0, 14).forEach((r) => r.poster_path && urls.add(img(r.poster_path, 'w342')));
    scenesOf(d).forEach((u) => urls.add(u));
    [assets.poster, assets.logo, posterSrc].forEach((u) => u && urls.add(u));
    toast('Guardando para ver sin conexión…');
    if (isTv) { for (const s of seasonsAll) { try { const sd = await api.season(id, s.season_number); (sd.episodes || []).forEach((ep) => ep.still_path && urls.add(img(ep.still_path, 'w300'))); } catch (e) { /* sigue */ } } }
    const list = [...urls].filter(Boolean); let i = 0, ok = 0;
    await Promise.all(Array.from({ length: 6 }, async () => { while (i < list.length) { const u = list[i++]; try { await fetch(u, { mode: 'no-cors' }); ok++; } catch (e) { /* una imagen menos */ } } }));
    S.off[k] = Date.now(); store.save(); syncCta();
    toast('Listo: ' + title + ' está disponible sin conexión');
  }

  /* ---------- eventos ---------- */
  el.addEventListener('click', async (e) => {
    const rc = e.target.closest('[data-recap]'); if (rc) { openRecap(rc.dataset.recap); return; }
    const a = e.target.closest('[data-a]'); if (!a) return; const act = a.dataset.a;
    if (act === 'back') return back();
    if (act === 'tab') return switchTab(a.dataset.p);
    if (act === 'season') return selectSeason(a.dataset.s);
    if (act === 'more') { const p = $('.syn', el); p.classList.toggle('clamp'); a.textContent = p.classList.contains('clamp') ? 'Más' : 'Menos'; return; }
    if (act === 'follow') { store.follow(k, !store.isFollowed(k)); syncCta(); toast(store.isFollowed(k) ? 'Siguiendo ' + title : 'Dejaste de seguir ' + title); return; }
    if (act === 'rate') { const nn = +a.dataset.n; store.rate(k, S.rate[k] === nn ? 0 : nn); syncCta(); return; }
    if (act === 'off') { if (S.off[k]) { delete S.off[k]; store.save(); syncCta(); toast('Quitado de sin conexión'); } else saveOffline(); return; }
    if (act === 'main') {
      if (!isTv) { store.setMovie(k, !store.isMovieWatched(k)); refresh(); toast(store.isMovieWatched(k) ? 'Marcada como vista' : 'Marcada como pendiente'); return; }
      if (ne && !ne.upcoming) { if (launch(type, id, title, options(type, id, title, d, { s: ne.s, e: ne.e }))) return; return focusNext(); } return switchTab('eps');
    }
    if (act === 'exp') { a.closest('.ep').classList.toggle('open'); return; }
    if (act === 'play') { const box = document.createElement('div'); box.className = 'vid playing real'; box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(a.dataset.k) + '?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="Tráiler" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'; a.replaceWith(box); return; }
    if (act === 'shot') { const list = [d.backdrop_path && img(d.backdrop_path, 'w780'), ...SC].filter(Boolean); const u = list[+a.dataset.i]; if (u) openSheet('<div class="shotv"><img src="' + u + '" alt=""><button class="btn pri" style="width:100%;margin-top:14px" data-close>Cerrar</button></div>', hue); return; }
    if (act === 'reveal') { a.closest('.gate').classList.add('open'); return; }
    if (act === 'acc') { const it = a.closest('.ai'); it.classList.toggle('open'); a.setAttribute('aria-expanded', String(it.classList.contains('open'))); return; }
    if (act === 'rev') {
      const r = X && X.reviews[+a.dataset.i]; if (!r) return;
      openSheet('<div class="rsheet"><h3>Reseña</h3><div class="who"><div class="rav">' + esc((r.a || '?')[0].toUpperCase()) + '</div><div><div class="rn" style="max-width:none">' + esc(r.a) + '</div><div class="rd">' + esc(fmtDate(r.d)) + (r.r != null ? ' · ' + r.r + '/10' : '') + '</div></div></div><div class="body">' + r.tx.split(/\n+/).map((p) => '<p>' + esc(p) + '</p>').join('') + '</div><p class="credit">Reseña de un usuario de TMDB. Puede incluir spoilers.</p><button class="btn pri" style="width:100%;margin-top:10px" data-close>Cerrar</button></div>', hue);
      return;
    }
    if (act === 'rv') { const li = a.closest('.ep'); if (!li.classList.contains('done') && !li.classList.contains('next')) li.classList.add('rev'); return; }
    const li = a.closest('.ep');
    if (act === 'tog' && li) {
      const s = +li.dataset.s, ep = +li.dataset.e, on = !store.epDone(k, s, ep);
      store.setEp(k, s, ep, on); if (on) { li.classList.add('just'); setTimeout(() => li.classList.remove('just'), 600); }
      await refresh(); return;
    }
    if (act === 'upto' && li) { store.markUpTo(k, +li.dataset.s, +li.dataset.e); await refresh(); toast('Marcado hasta ' + epLabel(+li.dataset.s, +li.dataset.e)); return; }
    if (act === 'seasonall') {
      const s = +a.dataset.s, eps = (seasonData[s] || []).filter((x) => x.air_date && x.air_date <= t0).map((x) => x.episode_number);
      if (!eps.length) return;
      const allDone = eps.every((x) => store.epDone(k, s, x)); store.setRange(k, s, eps, !allDone); await refresh(); toast(allDone ? 'Temporada desmarcada' : 'Temporada ' + s + ' marcada'); return;
    }
  });

  /* deslizar un episodio: derecha marca, izquierda quita */
  if (isTv) swipeRows(el, {
    sel: '.ep',
    canMark: (li) => !li.classList.contains('done') && !li.classList.contains('future'),
    canUnmark: (li) => li.classList.contains('done'),
    on: (li, dir) => {
      const s = +li.dataset.s, ep = +li.dataset.e;
      store.setEp(k, s, ep, dir === 'mark');
      if (dir === 'mark') { li.classList.add('just'); setTimeout(() => li.classList.remove('just'), 700); }
      refresh();
    }
  });

  /* pestañas pegajosas + parallax */
  const tabsEl = $('#tabs', el);
  const onScroll = () => tabsEl.classList.toggle('stuck', tabsEl.getBoundingClientRect().top <= 1);
  window.addEventListener('scroll', onScroll, { passive: true });
  const stop = parallax(el);
  return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('scroll', fsFn); stop(); stopTheme(); fsEl.remove(); rootEl.classList.remove('nd', 'nd-full'); };
}
