// Inicio: dónde me quedé, mis universos y qué más hay conectado.
import * as store from './store.js';
import * as api from './api.js';
import * as data from './data.js';
import { nextEpisode } from './progress.js';
import { openRecap } from './sheet.js';
import { esc, ic, artHTML, posterCard, ring, animate, normItem, fromMeta, hueOf, img, ago, epLabel, fmtDate, parallax, $, $$ } from './ui.js';

export const tab = 'home';

const sec = (title, sub, inner, i, extra) => '<div class="pad secbox rise" style="--i:' + i + '"><h2 class="sec">' + title + '</h2>' + (sub ? '<div class="secsub">' + sub + '</div>' : '') + '</div>' + inner + (extra || '');

export async function mount(el) {
  const S = store.state();
  if (!S.key) { location.hash = '#/setup'; return; }
  let U; try { U = await data.load(); } catch (e) { U = { universes: [], byKey: {}, byId: {} }; }

  const prog = store.inProgress(), listed = store.listed();
  const tr = [...prog, ...listed, ...store.completed()];
  const offN = Object.keys(S.off).length;
  const online = navigator.onLine;

  /* ---- héroe ---- */
  let hero = null, heroKey = null, kicker = 'Continuar viendo';
  if (prog.length) { heroKey = prog[0]; hero = fromMeta(store.meta(heroKey)); }
  else if (listed.length) { heroKey = listed[0]; hero = fromMeta(store.meta(heroKey)); kicker = 'En tu lista'; }
  else { try { const t = await api.trending(); const r = (t.results || []).find((x) => (x.media_type === 'tv' || x.media_type === 'movie') && x.backdrop_path); if (r) { hero = normItem(r); kicker = 'Tendencia esta semana'; } } catch (e) { /* sin red */ } }
  const hue = hero ? data.hueFor(U, hero.key, hero.g, hero.id) : 215;
  el.style.setProperty('--h', hue);
  document.documentElement.style.setProperty('--h', hue);

  const isTv = hero && hero.type === 'tv', started = heroKey && store.countWatched(heroKey) > 0;
  let out = '<div class="hero" id="hero" data-fade="1"><div class="hero-art">' + (hero ? artHTML(hero) : '') + '</div><div class="hero-blur"></div><div class="hero-shade"></div>' +
    '<div class="top"><div class="brand">' + ic('thread', 22, 2) + 'Hilo</div><a class="offchip' + (online ? '' : ' warn') + '" href="#/settings">' + ic(online ? 'cloud' : 'cloudoff', 17) + '<span>' + (online ? offN + ' sin conexión' : 'Sin conexión') + '</span></a></div>';
  if (hero) {
    const long = hero.title.length > 22 ? ' long' : '';
    out += '<div class="hero-in rise" style="--i:0"><div class="kick">' + kicker + '</div><h1 class="hero-title' + long + '">' + esc(hero.title) + '</h1>' +
      '<div class="hero-ep" id="hep">' + (isTv && heroKey ? '&nbsp;' : esc((hero.type === 'tv' ? 'Serie' : 'Película') + (hero.year ? ' · ' + hero.year : ''))) + '</div>' +
      (heroKey ? '<div class="hero-last">' + (started ? 'Te quedaste ' + ago(S.last[heroKey]) : 'Todavía no empezaste') + '</div><div class="bar"><i data-w="' + Math.max(Math.round(store.frac(heroKey) * 100), 2) + '"></i></div>' : '<div style="height:10px"></div>') +
      '<div class="hero-btns">' + (heroKey && isTv ? '<a class="btn pri" href="#/tv/' + hero.id + '?go=next">' + ic('play', 18) + (started ? 'Retomar' : 'Empezar') + '</a>' + (started ? '<button class="btn glass" data-recap="' + heroKey + '">' + ic('prev', 19) + 'Anteriormente</button>' : '') : '<a class="btn pri" href="#/' + hero.type + '/' + hero.id + '">' + ic('play', 18) + 'Ver ficha</a>') + '</div></div>';
  } else {
    out += '<div class="hero-in"><div class="kick">Hilo</div><h1 class="hero-title">Tu lugar en cada historia</h1></div>';
  }
  out += '</div>';

  if (!tr.length) out += '<div class="pad rise" style="--i:1;margin-top:18px"><div class="note">' + ic('info', 18) + '<span><b>Todavía no seguís nada.</b><br>Buscá una serie o película y tocá el marcador de la ficha para empezar a seguirla.</span></div></div>';

  let i = 1;
  /* ---- Siguiente ---- */
  if (prog.length) {
    out += sec('Siguiente', '', '<div class="row rise" style="--i:' + (i + 1) + '">' + prog.slice(0, 12).map((k) => {
      const m = store.meta(k), n = fromMeta(m), h = data.hueFor(U, k, n.g, n.id);
      return '<a class="lcard" style="--h:' + h + '" href="#/tv/' + m.id + '?go=next"><div class="lthumb">' + artHTML({ ...n, backdrop: n.backdrop }).replace('w1280', 'w780') + '<div class="lname">' + esc(m.t) + '</div><div class="bar"><i data-w="' + Math.max(Math.round(store.frac(k) * 100), 3) + '"></i></div></div><div class="lt" data-nx="' + k + '">&nbsp;</div><div class="ls">' + ago(S.last[k]) + ' · ' + store.countWatched(k) + ' de ' + (m.tot || '?') + ' episodios</div></a>';
    }).join('') + '</div>', i++);
  }
  /* ---- Tu lista ---- */
  const pend = listed.filter((k) => !prog.includes(k) && k !== heroKey);
  if (pend.length) out += sec('Tu lista', 'Lo que guardaste para ver', '<div class="row rise" style="--i:' + (i + 1) + '">' + pend.slice(0, 20).map((k) => posterCard(fromMeta(store.meta(k)), { w: 118 })).join('') + '</div>', i++);

  /* ---- Tus universos ---- */
  const trackedU = new Set(); tr.forEach((k) => (U.byKey[k] || []).forEach((u) => trackedU.add(u)));
  const unis = [...U.universes].sort((a, b) => (trackedU.has(b.id) ? 1 : 0) - (trackedU.has(a.id) ? 1 : 0));
  out += sec(trackedU.size ? 'Tus universos' : 'Universos para descubrir', 'Todo lo conectado, en orden', '<div class="row rise" style="--i:' + (i + 1) + '">' + unis.slice(0, 8).map((u) => {
    const s = data.stats(u), h = hueOf([], u.cover ? u.cover.id : 1);
    return '<a class="ucard" style="--h:' + data.uhue(u) + '" href="#/universe/' + u.id + '">' + (u.cover ? artHTML(fromUniCover(u.cover)).replace('w1280', 'w780') : '') + '<div class="uc-in"><div><div class="uc-t">' + esc(u.title) + '</div><div class="uc-s">' + s.done + ' de ' + s.total + ' vistos' + (s.part ? ' · ' + s.part + ' en curso' : '') + '</div></div><div class="ringwrap">' + ring(s.f, 46, 4) + '<b>' + Math.round(s.f * 100) + '%</b></div></div></a>';
  }).join('') + '</div>', i++);

  /* ---- Hay más de lo que estás viendo ---- */
  const trSet = new Set(tr); let best = null;
  trackedU.forEach((uid) => { const u = U.byId[uid]; const miss = u.items.filter((x) => !trSet.has(x.key) && (!x.d || x.d <= store.today())); if (!best || miss.length > best.miss.length) best = { u, miss }; });
  if (best && best.miss.length) {
    const chips = best.miss.slice(0, 14);
    out += sec('Hay más de lo que estás viendo', esc(best.u.title) + ' tiene ' + best.miss.length + ' títulos más conectados a la historia', '<div class="row rise" style="--i:' + (i + 1) + '">' + chips.map((x) => posterCard({ type: x.k, id: x.id, title: x.t, year: String(x.y), poster: x.p, g: [] }, { w: 118, chip: x.rl ? x.rl.split(':')[0] : best.u.title })).join('') + '</div>', i++);
  } else if (heroKey) {
    out += '<div id="recs"></div>';
  }
  out += '<div id="trend"></div>';
  out += '<div class="pad attr rise" style="--i:' + (i + 3) + ';margin-top:34px">Datos e imágenes de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.</div>';

  el.innerHTML = out;
  animate(el);
  const stop = parallax(el);

  /* ---- relleno asíncrono ---- */
  const fillNext = async (k, target, hero) => {
    try {
      const ne = await nextEpisode(k);
      if (!el.isConnected) return;
      let t = '';
      if (!ne) t = hero ? 'Estás al día' : 'Estás al día';
      else if (ne.upcoming) t = 'Próximo: ' + (ne.e ? epLabel(ne.s, ne.e) : 'T' + ne.s) + (ne.air ? ' · ' + fmtDate(ne.air) : '');
      else t = epLabel(ne.s, ne.e) + ' — ' + ne.name;
      target.textContent = t;
    } catch (e) { target.textContent = e.code === 'offline' ? 'Sin conexión' : ''; }
  };
  if (isTv && heroKey) fillNext(heroKey, $('#hep', el), true);
  $$('[data-nx]', el).forEach((n) => fillNext(n.dataset.nx, n, false));

  if (!best || !best.miss.length) {
    if (heroKey) {
      const { type, id } = store.parse(heroKey);
      api.details(type, id).then((d) => {
        const recs = (d.recommendations && d.recommendations.results || []).filter((r) => r.poster_path).slice(0, 14);
        if (!recs.length || !el.isConnected) return;
        const box = $('#recs', el); if (!box) return;
        box.innerHTML = sec('Porque seguís ' + esc(store.meta(heroKey).t), 'Recomendaciones de TMDB', '<div class="row">' + recs.map((r) => posterCard(normItem(r, type), { w: 118 })).join('') + '</div>', 0);
      }).catch(() => {});
    }
  }
  api.trending().then((t) => {
    if (!el.isConnected) return;
    const items = (t.results || []).filter((r) => (r.media_type === 'tv' || r.media_type === 'movie') && r.poster_path).slice(0, 16);
    $('#trend', el).innerHTML = sec('Tendencias de la semana', '', '<div class="row">' + items.map((r) => posterCard(normItem(r), { w: 118 })).join('') + '</div>', 0);
  }).catch(() => {});

  el.addEventListener('click', (e) => { const b = e.target.closest('[data-recap]'); if (b) openRecap(b.dataset.recap); });
  return stop;
}

export function fromUniCover(c) { return { poster: c.p, backdrop: c.b }; }
