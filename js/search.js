// Búsqueda en todo el catálogo de TMDB.
import * as store from './store.js';
import * as api from './api.js';
import { esc, ic, posterCard, normItem, $ } from './ui.js';

export const tab = 'search';
let lastQ = '';

export async function mount(el) {
  if (!store.state().key) { location.hash = '#/setup'; return; }
  el.style.setProperty('--h', 215); document.documentElement.style.setProperty('--h', 215);
  el.innerHTML = '<div class="pagehead"><h1>Buscar</h1></div><label class="search" for="q">' + ic('search', 20) + '<input id="q" type="search" placeholder="Series y películas" autocomplete="off" autocapitalize="off" enterkeyhint="search" value="' + esc(lastQ) + '"></label><div id="qres" class="grid"></div>';
  const inp = $('#q', el), res = $('#qres', el);
  let seq = 0, timer = 0;
  const show = (arr, note) => {
    const items = arr.filter((r) => (r.media_type === 'tv' || r.media_type === 'movie')).map((r) => normItem(r));
    res.innerHTML = items.length ? items.map((n) => posterCard(n, {})).join('') : '<div class="empty" style="grid-column:1/-1"><b>' + (note || 'Sin resultados') + '</b></div>';
  };
  const run = async (q) => {
    const my = ++seq;
    try {
      if (!q) { res.innerHTML = '<div class="skel" style="grid-column:1/-1"><i></i></div>'; const t = await api.trending(); if (my === seq) { show(t.results || []); const h = document.createElement('div'); h.className = 'secsub'; } return; }
      const r = await api.search(q); if (my === seq) show(r.results || [], 'Sin resultados para “' + esc(q) + '”');
    } catch (e) { if (my === seq) res.innerHTML = '<div class="empty" style="grid-column:1/-1"><b>' + (e.code === 'offline' ? 'Sin conexión' : 'No pude buscar') + '</b>' + (e.code === 'offline' ? 'La búsqueda necesita internet. Lo que guardaste sigue disponible en Inicio.' : esc(e.message || '')) + '</div>'; }
  };
  inp.addEventListener('input', () => { lastQ = inp.value.trim(); clearTimeout(timer); timer = setTimeout(() => run(lastQ), 350); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
  run(lastQ);
}
