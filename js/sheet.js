// Hoja inferior y la hoja "Anteriormente".
import * as store from './store.js';
import { nextEpisode, recapEpisodes } from './progress.js';
import { esc, ic, epLabel } from './ui.js';

export function openSheet(html, hue) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  if (hue != null) sh.style.setProperty('--h', hue);
  sh.innerHTML = '<div class="grab"></div>' + html;
  document.body.append(scrim, sh);
  document.documentElement.classList.add('lock');
  requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('in'); sh.classList.add('in'); }));
  let closed = false;
  const close = () => { if (closed) return; closed = true; scrim.classList.remove('in'); sh.classList.remove('in'); document.documentElement.classList.remove('lock'); setTimeout(() => { scrim.remove(); sh.remove(); }, 600); };
  scrim.addEventListener('click', close);
  sh.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  return { el: sh, close };
}

export async function openRecap(k) {
  const m = store.meta(k); if (!m) return;
  const s = openSheet('<h3>Anteriormente</h3><div class="ssub">' + esc(m.t) + '</div><div class="skel"><i></i><i></i><i></i></div>', null);
  s.el.style.setProperty('--h', hueFromMeta(m));
  try {
    const [ne, eps] = await Promise.all([nextEpisode(k), recapEpisodes(k, 4)]);
    const sub = esc(m.t) + (ne && ne.s ? ' · antes de ' + epLabel(ne.s, ne.e) : '');
    const list = eps.length
      ? eps.map((x) => '<div class="rc"><em>' + epLabel(x.s, x.e) + '</em><div><b>' + esc(x.name) + '</b><p>' + esc(x.overview || 'Sin sinopsis disponible.') + '</p></div></div>').join('')
      : '<div class="rc" style="grid-template-columns:1fr"><p>Todavía no marcaste capítulos como vistos. Cuando lo hagas, acá vas a ver un repaso de los últimos.</p></div>';
    const go = ne && !ne.upcoming ? '<a class="btn pri" style="width:100%;margin-top:6px" href="#/tv/' + m.id + '?go=next" data-close>' + ic('play', 18) + 'Retomar ' + epLabel(ne.s, ne.e) + '</a>' : '<button class="btn pri" style="width:100%;margin-top:6px" data-close>Listo</button>';
    s.el.innerHTML = '<div class="grab"></div><h3>Anteriormente</h3><div class="ssub">' + sub + '. Sin spoilers de lo que sigue.</div>' + list +
      '<div class="note" style="margin:14px 0">' + ic('info', 18) + '<span>Son las sinopsis oficiales de TMDB de tus últimos capítulos vistos.</span></div>' + go;
  } catch (e) {
    s.el.innerHTML = '<div class="grab"></div><h3>Anteriormente</h3><div class="ssub">No pude cargar el repaso. ' + (e.code === 'offline' ? 'Estás sin conexión y este título no se guardó para verlo offline.' : 'Probá de nuevo en un rato.') + '</div><button class="btn pri" style="width:100%" data-close>Cerrar</button>';
  }
}
function hueFromMeta(m) {
  const PR = { 27: 8, 53: 355, 878: 195, 10765: 250, 14: 280, 28: 14, 10759: 20, 80: 0, 9648: 262, 16: 300, 35: 48, 10749: 340, 18: 215 };
  for (const g of m.g || []) if (PR[g] != null) return PR[g];
  return (m.id * 47) % 360;
}
