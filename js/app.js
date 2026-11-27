// Router por hash, navegación inferior y registro del service worker.
import * as store from './store.js';
import * as home from './home.js';
import * as detail from './detail.js';
import * as uni from './universe.js';
import * as search from './search.js';
import * as settings from './settings.js';
import { ic, toast, $, $$ } from './ui.js';
import { initNav, initBlurUp, initLock, initDragScroll } from './motion.js';
import { initLinks } from './platform.js';
import { initMon } from './mon.js';
import { initBack } from './back.js';
import { initFun } from './fun.js';

const ROUTES = [
  [/^\/?$/, home, 'home'],
  [/^\/search$/, search, 'search'],
  [/^\/universes$/, { tab: 'universes', mount: uni.mountList }, 'universes'],
  [/^\/universe\/([\w-]+)$/, { tab: 'universes', mount: uni.mountCuratedUniverse }, 'universes', ['id']],
  [/^\/collection\/(\d+)$/, { tab: 'universes', mount: uni.mountCollection }, 'universes', ['id']],
  [/^\/(tv|movie)\/(\d+)$/, detail, null, ['type', 'id']],
  [/^\/settings$/, settings, 'settings'],
  [/^\/setup$/, { tab: null, mount: settings.mountSetup, setup: true }, null]
];
const TABS = ['home', 'universes', 'search', 'settings'];
const view = $('#view'), nav = $('.nav'), ind = $('#ind');
let cleanup = null, lastTab = 'home', stack = [];
document.documentElement.dataset.fx = store.state().fx || 'full';
const scrolls = new Map();

$('#pill').innerHTML = '<span class="ind" id="ind"></span>' + [['home', '#/', 'Inicio', 'home'], ['universes', '#/universes', 'Universos', 'uni'], ['search', '#/search', 'Buscar', 'search'], ['settings', '#/settings', 'Ajustes', 'gear']]
  .map((t) => '<a href="' + t[1] + '" data-t="' + t[0] + '">' + ic(t[3], 22) + '<span>' + t[2] + '</span></a>').join('');

function setTab(t) {
  const i = TABS.indexOf(t);
  const indEl = $('#ind'); indEl.style.opacity = i < 0 ? 0 : 1;
  if (i >= 0) indEl.style.transform = 'translateX(' + (i * 100) + '%)';
  $$('.pill a').forEach((a) => a.classList.toggle('on', a.dataset.t === t));
}

async function route() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?'); const query = Object.fromEntries(new URLSearchParams(qs || ''));
  let hit = null;
  for (const [re, mod, , names] of ROUTES) { const m = re.exec(path); if (m) { const params = {}; (names || []).forEach((n, i) => { params[n] = /^\d+$/.test(m[i + 1]) ? +m[i + 1] : m[i + 1]; }); hit = { mod, params }; break; } }
  if (!hit) { location.hash = '#/'; return; }

  /* scroll: recordar al salir, restaurar al volver atrás */
  const prev = stack[stack.length - 1];
  if (prev != null) scrolls.set(prev, window.scrollY);
  let back = false;
  if (stack.length > 1 && stack[stack.length - 2] === raw) { stack.pop(); back = true; } else if (prev !== raw) stack.push(raw);

  if (cleanup) { try { cleanup(); } catch (e) { /* nada */ } cleanup = null; }
  const el = document.createElement('div'); el.className = 'page';
  view.replaceChildren(el);
  document.documentElement.style.setProperty('--h', 215);
  ['--as', '--al', '--h2'].forEach((p) => document.documentElement.style.removeProperty(p));
  const t = hit.mod.tab !== undefined ? hit.mod.tab : null;
  if (t) lastTab = t;
  const setup = !!hit.mod.setup;
  nav.style.display = setup ? 'none' : '';
  setTab(t || lastTab);
  window.scrollTo(0, 0);
  try {
    const mountFn = hit.mod.mount;
    const c = await mountFn(el, { ...hit.params, query });
    if (typeof c === 'function') cleanup = c;
  } catch (e) {
    console.error(e);
    el.innerHTML = '<div class="empty" style="padding-top:140px"><b>Algo salió mal</b>' + (e && e.message ? String(e.message).replace(/</g, '&lt;') : '') + '<div style="margin-top:18px"><a class="btn glass" href="#/">Ir al inicio</a></div></div>';
  }
  if (back && scrolls.has(raw)) { const y = scrolls.get(raw); requestAnimationFrame(() => window.scrollTo(0, y)); setTimeout(() => window.scrollTo(0, y), 250); }
}

initLinks();
initMon();
initBack();
initFun();
initLock();
initDragScroll();
initNav();
initBlurUp();
window.addEventListener('hashchange', route);
window.addEventListener('offline', () => toast('Sin conexión: mostrando lo que está guardado'));
window.addEventListener('online', () => toast('Conexión recuperada'));
route();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
