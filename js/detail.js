// Ficha de serie o película.
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import { nextEpisode } from './progress.js';
import { openRecap } from './sheet.js';
import { esc, ic, artHTML, posterCard, ring, animate, normItem, fromMeta, hueOf, img, epLabel, fmtDate, parallax, toast, $, $$ } from './ui.js';

export const tab = null;
const q = encodeURIComponent;
const BASED = { 'based on comic': 'Basada en un cómic', 'based on comic book': 'Basada en un cómic', 'based on graphic novel': 'Basada en una novela gráfica', 'based on novel or book': 'Basada en una novela o libro', 'based on novel': 'Basada en una novela', 'based on young adult novel': 'Basada en una novela juvenil', 'based on manga': 'Basada en un manga', 'based on video game': 'Basada en un videojuego', 'based on true story': 'Basada en hechos reales', 'based on tv series': 'Basada en una serie', 'based on cartoon': 'Basada en una caricatura', 'based on short story': 'Basada en un cuento', 'based on play or musical': 'Basada en una obra de teatro', 'based on anime': 'Basada en un anime' };

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
  const n = normItem(d, type), hue = data.hueFor(U, k, n.g, id), S = store.state();
  el.style.setProperty('--h', hue); document.documentElement.style.setProperty('--h', hue);
  const title = n.title, orig = d.original_title || d.original_name || title, t0 = store.today();

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
  tabs.push(['deb', 'Debate']);

  /* ---------- HTML ---------- */
  const longT = title.length > 22 ? ' long' : '';
  const starBtns = [1, 2, 3, 4, 5].map((s) => '<button data-a="rate" data-n="' + s + '" class="' + ((S.rate[k] || 0) >= s ? 'on' : '') + '" aria-label="' + s + ' estrellas"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6-4.5-4.2 6.1-.7z"/></svg></button>').join('');
  let html = '<div class="dhero"><div class="hero-art">' + artHTML(n) + '</div><div class="hero-blur"></div><div class="hero-shade"></div>' +
    '<button class="gbtn backbtn" data-a="back" aria-label="Volver">' + ic('back', 22, 2) + '</button>' +
    '<div class="toprt"><button class="gbtn" id="folbtn" data-a="follow" aria-label="Seguir">' + ic('mark', 20) + '</button><button class="gbtn" id="offbtn" data-a="off" aria-label="Guardar para ver sin conexión">' + ic('dl', 22) + '</button></div>' +
    '<div class="hero-in"><div class="kick">' + (U.byKey[k] ? 'Universo ' + esc(U.byId[U.byKey[k][0]].title) : isTv ? 'Serie' : 'Película') + '</div><h1 class="dtitle' + longT + '">' + esc(title) + '</h1>' +
    '<div class="dmeta">' + vote + '<span>' + esc(metaBits.join(' · ')) + '</span></div><div class="stars" role="group" aria-label="Tu puntuación">' + starBtns + '</div></div></div>' +
    '<div class="pad">' + (d.tagline ? '<p class="tag">“' + esc(d.tagline) + '”</p>' : '') + '<p class="syn">' + esc(d.overview || 'Sin sinopsis disponible.') + (d._en ? ' <span style="color:var(--fg3)">(sinopsis en inglés)</span>' : '') + '</p>' +
    '<div class="cta"><button class="btn pri" id="mainbtn" data-a="main"></button>' + (isTv ? '<button class="btn glass" id="recapbtn" data-recap="' + k + '" hidden>' + ic('prev', 19) + 'Anteriormente</button>' : '') + '</div></div>' +
    '<div class="tabs" id="tabs"><button class="gbtn mini" data-a="back" aria-label="Volver">' + ic('back', 20, 2) + '</button><div class="seg" role="tablist">' + tabs.map((t, i) => '<button role="tab" data-a="tab" data-p="' + t[0] + '" class="' + (i === 0 ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div>';
  tabs.forEach(([p], i) => { html += '<div class="pane" data-pane="' + p + '"' + (i ? ' hidden' : '') + '>' + pane(p) + '</div>'; });
  el.innerHTML = html;
  animate(el);

  /* ---------- paneles ---------- */
  function pane(p) {
    if (p === 'eps') {
      let o = '<div class="seasons">' + regular.map((s) => '<button data-a="season" data-s="' + s.season_number + '" class="' + (s.season_number === curSeason ? 'on' : '') + '">T' + s.season_number + '</button>').join('') + (specials ? '<button data-a="season" data-s="0">Especiales</button>' : '') + '</div>';
      seasonsAll.forEach((s) => { o += '<div class="season" data-s="' + s.season_number + '"' + (s.season_number === curSeason ? '' : ' hidden') + '><div class="sh"><h3>' + (s.season_number === 0 ? 'Especiales' : 'Temporada ' + s.season_number) + '</h3><span class="sc" data-sc></span></div><div class="bar"><i></i></div>' + (s.season_number > 0 ? '<div style="text-align:right"><button class="linkbtn" data-a="seasonall" data-s="' + s.season_number + '">Marcar temporada</button></div>' : '') + '<ul class="eps"><li class="skel"><i></i><i></i></li></ul></div>'; });
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
    return debPane();
  }

  function uniPane() {
    let o = '';
    const uids = U.byKey[k] || [];
    uids.forEach((uid, ix) => {
      const u = U.byId[uid], s = data.stats(u);
      o += '<a class="pcard" href="#/universe/' + u.id + '" style="--h:' + data.uhue(u) + '"><div class="poster">' + (u.cover && u.cover.p ? '<img class="ld" src="' + img(u.cover.p, 'w185') + '" alt="">' : '') + '</div><div><small>Parte de</small><b>' + esc(u.title) + '</b><i>' + s.done + ' de ' + s.total + ' vistos</i></div><div class="ringwrap">' + ring(s.f, 40, 4) + '<b>' + Math.round(s.f * 100) + '%</b></div></a>';
      if (ix === 0) {
        const ord = data.ordered(u, 'chrono'), i = ord.findIndex((x) => x.key === k);
        const nb = [i - 1, i + 1].filter((j) => j >= 0 && j < ord.length);
        if (nb.length) o += '<div class="sub">' + (u.modes ? 'En el orden de la historia' : 'Series conectadas') + '</div>' + nb.map((j) => { const x = ord[j]; return '<a class="pcard" href="#/' + x.k + '/' + x.id + '"><div class="poster">' + (x.p ? '<img class="ld" src="' + img(x.p, 'w185') + '" alt="">' : '') + '</div><div><small>' + (j < i ? 'Antes' : 'Después') + '</small><b>' + esc(x.t) + '</b><i>' + esc(x.rl || String(x.y)) + '</i></div><span>' + (store.isDone(x.key, x.eps) ? ic('check', 20) : '') + '</span></a>'; }).join('');
      }
    });
    const c = d.belongs_to_collection;
    if (c) o += '<a class="pcard" href="#/collection/' + c.id + '"><div class="poster">' + (c.poster_path ? '<img class="ld" src="' + img(c.poster_path, 'w185') + '" alt="">' : '') + '</div><div><small>Colección</small><b>' + esc(c.name) + '</b><i>Todas las películas, en orden de estreno</i></div><span>' + ic('chev', 18) + '</span></a>';
    const recs = ((d.recommendations && d.recommendations.results) || []).filter((r) => r.poster_path).slice(0, 14);
    if (recs.length) o += '<div class="sub">Si te gustó esto</div><div class="row" style="margin:0 calc(-1*var(--gr)) 0 calc(-1*var(--gl))">' + recs.map((r) => posterCard(normItem(r, type), { w: 118 })).join('') + '</div>';
    if (!o) o = '<div class="note">' + ic('info', 18) + '<span>No hay conexiones cargadas para este título todavía.</span></div>';
    return o;
  }

  function debPane() {
    const kw = isTv ? ((d.keywords && d.keywords.results) || []) : ((d.keywords && d.keywords.keywords) || []);
    const based = kw.map((x) => x.name.toLowerCase()).filter((x) => x.indexOf('based on') === 0);
    const imdb = d.external_ids && d.external_ids.imdb_id;
    const links = [
      ['Teorías en Reddit', 'Hilos que hablan de ' + orig, 'https://www.reddit.com/search/?q=' + q(orig + ' theories')],
      ['Explicaciones en YouTube', 'Análisis y finales explicados', 'https://www.youtube.com/results?search_query=' + q(orig + ' explicado')],
      ['Wikipedia', 'Argumento, personajes y producción', 'https://es.wikipedia.org/w/index.php?search=' + q(title)]
    ];
    if (imdb) links.push(['IMDb', 'Puntajes y reseñas', 'https://www.imdb.com/title/' + imdb + '/']);
    if (!isTv) links.push(['Letterboxd', 'Reseñas de la comunidad', 'https://letterboxd.com/tmdb/' + id + '/']);
    let o = '<div class="links">' + links.map((l) => '<a class="lk" href="' + l[2] + '" target="_blank" rel="noopener"><div>' + l[0] + '<span>' + l[1] + '</span></div>' + ic('ext', 18) + '</a>').join('') + '</div>';
    if (based.length) {
      o += '<div class="sub">Obra original</div><div class="chips" style="margin-bottom:12px">' + based.map((b) => '<span class="src">' + esc(BASED[b] || 'Basada en: ' + b.replace('based on ', '')) + '</span>').join('') + '</div><div class="links">' +
        '<a class="lk" href="https://es.wikipedia.org/w/index.php?search=' + q(orig + ' adaptación obra original') + '" target="_blank" rel="noopener"><div>Buscar el original<span>Libro, cómic o juego en el que se basa</span></div>' + ic('ext', 18) + '</a></div>' +
        '<p class="credit">Próximamente: comparativa con el original (qué cambió y qué no), con spoilers tapados hasta que llegues a ese punto.</p>';
    }
    const wp = d['watch/providers'] && d['watch/providers'].results && d['watch/providers'].results[S.region];
    if (wp) {
      const grp = (label, arr) => arr && arr.length ? '<div class="sub">' + label + ' · ' + S.region + '</div><div class="provs">' + arr.map((p) => '<a class="prov" href="' + esc(wp.link) + '" target="_blank" rel="noopener" title="' + esc(p.provider_name) + '"><img src="' + img(p.logo_path, 'w92') + '" alt="' + esc(p.provider_name) + '" loading="lazy"></a>').join('') + '</div>' : '';
      o += grp('Streaming', wp.flatrate) + grp('Alquiler', wp.rent) + grp('Compra', wp.buy) + '<p class="credit">Disponibilidad: JustWatch, vía TMDB.</p>';
    }
    if (kw.length) o += '<div class="sub">Temas</div><div class="chips">' + kw.slice(0, 10).map((x) => '<span>' + esc(x.name) + '</span>').join('') + '</div>';
    return o;
  }

  /* ---------- episodios ---------- */
  const seasonData = {};
  const rowHTML = (s, ep) => {
    const e = ep.episode_number, aired = ep.air_date && ep.air_date <= t0;
    const bits = [aired ? fmtDate(ep.air_date) : (ep.air_date ? 'Estreno ' + fmtDate(ep.air_date) : 'Sin fecha'), ep.runtime ? ep.runtime + ' min' : ''].filter(Boolean).join(' · ');
    return '<li class="ep' + (aired ? '' : ' future') + '" data-s="' + s + '" data-e="' + e + '"><button class="ck" data-a="tog" aria-label="Marcar como visto">' + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4.2 4.2L18.5 8"/></svg></button>' +
      '<div class="et" data-a="exp"><div class="still">' + (ep.still_path ? '<img src="' + img(ep.still_path, 'w300') + '" alt="" loading="lazy" onload="this.classList.add(\'ld\')" onerror="this.remove()">' : '') + '</div><div class="tt"><span class="nxb">Siguiente</span>' + (s > 0 ? e + '. ' : '') + esc(ep.name || 'Episodio ' + e) + '<small>' + esc(bits) + '</small></div>' + ic('chev', 14) + '</div>' +
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
    $$('.season', el).forEach((box) => { const s = +box.dataset.s, sa = seasonsAll.find((x) => x.season_number === s); if (!sa) return; const c = store.seasonCount(k, s); $('[data-sc]', box).textContent = c + ' / ' + sa.episode_count; $('.bar i', box).style.width = (c / sa.episode_count * 100) + '%'; });
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
    fol.classList.toggle('on', store.isFollowed(k)); fol.innerHTML = ic(store.isFollowed(k) ? 'markok' : 'mark', 20);
    off.classList.toggle('on', !!S.off[k]); off.innerHTML = ic(S.off[k] ? 'dlok' : 'dl', 22);
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
    animate(el);
  }
  if (query && query.go === 'next' && isTv) setTimeout(focusNext, 400);

  /* ---------- guardar sin conexión ---------- */
  async function saveOffline() {
    const urls = new Set([img(d.poster_path, 'w342'), img(d.backdrop_path, 'w1280'), img(d.backdrop_path, 'w780'), img(d.poster_path, 'w780')]);
    cast.slice(0, 18).forEach((c) => c.profile_path && urls.add(img(c.profile_path, 'w185')));
    ((d.recommendations && d.recommendations.results) || []).slice(0, 14).forEach((r) => r.poster_path && urls.add(img(r.poster_path, 'w342')));
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
    if (act === 'follow') { store.follow(k, !store.isFollowed(k)); syncCta(); toast(store.isFollowed(k) ? 'Siguiendo ' + title : 'Dejaste de seguir ' + title); return; }
    if (act === 'rate') { const nn = +a.dataset.n; store.rate(k, S.rate[k] === nn ? 0 : nn); syncCta(); return; }
    if (act === 'off') { if (S.off[k]) { delete S.off[k]; store.save(); syncCta(); toast('Quitado de sin conexión'); } else saveOffline(); return; }
    if (act === 'main') {
      if (!isTv) { store.setMovie(k, !store.isMovieWatched(k)); refresh(); toast(store.isMovieWatched(k) ? 'Marcada como vista' : 'Marcada como pendiente'); return; }
      if (ne && !ne.upcoming) return focusNext(); return switchTab('eps');
    }
    if (act === 'exp') { a.closest('.ep').classList.toggle('open'); return; }
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

  /* pestañas pegajosas + parallax */
  const tabsEl = $('#tabs', el);
  const onScroll = () => tabsEl.classList.toggle('stuck', tabsEl.getBoundingClientRect().top <= 1);
  window.addEventListener('scroll', onScroll, { passive: true });
  const stop = parallax(el);
  return () => { window.removeEventListener('scroll', onScroll); stop(); };
}
