// Primera configuración (API key) y Ajustes: una lista corta de filas; cada una abre una hoja con el detalle.
import * as store from './store.js';
import * as api from './api.js';
import { openSheet } from './sheet.js';
import { esc, ic, img, toast, $ } from './ui.js';

export const VERSION = '1.6.2';
const REGIONS = [['AR', 'Argentina'], ['MX', 'México'], ['CL', 'Chile'], ['CO', 'Colombia'], ['UY', 'Uruguay'], ['PE', 'Perú'], ['ES', 'España'], ['BR', 'Brasil'], ['US', 'Estados Unidos']];
const regionName = (c) => (REGIONS.find((r) => r[0] === c) || [c, c])[1];

export const setupTab = null;
export async function mountSetup(el) {
  el.style.setProperty('--h', 215); document.documentElement.style.setProperty('--h', 215);
  el.innerHTML = '<div class="setup"><div><div class="kick">Bienvenido a</div><h1>Hi<em>lo</em></h1></div>' +
    '<p>Hilo sigue tus series y películas, te dice dónde te quedaste y conecta cada historia con todo su universo.</p>' +
    '<p>Para traer portadas, sinopsis y capítulos reales necesita una <b style="color:var(--fg)">API key gratuita de TMDB</b>. Se pega una sola vez y queda guardada solo en este teléfono.</p>' +
    '<div class="field"><label for="k">API key de TMDB</label><input id="k" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Pegá tu API key"></div><div class="err" id="err" role="alert"></div>' +
    '<button class="btn pri" id="go" style="width:100%">Guardar y empezar</button>' +
    '<p style="font-size:13.5px">¿No tenés una? <a class="lnk" href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">Pedila gratis en TMDB</a> (Configuración → API).</p>' +
    '<div class="attr">Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.</div></div>';
  const inp = $('#k', el), err = $('#err', el), go = $('#go', el);
  const submit = async () => {
    const v = inp.value.trim(); if (!v) { err.textContent = 'Pegá tu key primero.'; return; }
    go.disabled = true; go.textContent = 'Comprobando…'; err.textContent = '';
    try { await api.validate(v); store.setKey(v); api.clearMemory(); location.hash = '#/'; }
    catch (e) { err.textContent = e.message; go.disabled = false; go.textContent = 'Guardar y empezar'; }
  };
  go.addEventListener('click', submit);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
}

/* ---------- hojas de detalle ---------- */
const SH = {
  region(S, re) {
    return { html: '<h3>País</h3><div class="ssub">Define qué plataformas se muestran en cada ficha.</div><div class="st-opts">' + REGIONS.map((r) => '<button class="st-opt' + (S.region === r[0] ? ' on' : '') + '" data-v="' + r[0] + '"><span>' + r[1] + '</span>' + ic('check', 18, 2.6) + '</button>').join('') + '</div>',
      bind(s) { s.el.addEventListener('click', (e) => { const b = e.target.closest('.st-opt'); if (!b) return; store.setRegion(b.dataset.v); toast('País: ' + regionName(b.dataset.v)); s.close(); re(); }); } };
  },
  key(S, re) {
    return { html: '<h3>API key de TMDB</h3><div class="ssub">Guardada en este teléfono: <b style="color:var(--fg)">••••' + esc(S.key.slice(-4)) + '</b>. Pegá una nueva para cambiarla.</div><div class="field"><input id="nk" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Nueva API key"></div><div class="err" id="kerr" role="alert"></div><button class="btn pri" data-act="save" style="width:100%;margin-top:10px">Guardar</button>',
      bind(s) { s.el.addEventListener('click', async (e) => { const b = e.target.closest('[data-act="save"]'); if (!b) return; const v = $('#nk', s.el).value.trim(); if (!v) return; b.disabled = true; b.textContent = 'Comprobando…'; try { await api.validate(v); store.setKey(v); api.clearMemory(); toast('API key actualizada'); s.close(); re(); } catch (er) { $('#kerr', s.el).textContent = er.message; b.disabled = false; b.textContent = 'Guardar'; } }); } };
  },
  off(S, re) {
    const list = Object.keys(S.off).map((k) => S.meta[k]).filter(Boolean);
    return { html: '<h3>Sin conexión</h3><div class="ssub">' + (list.length ? 'Guardados en este teléfono.' : 'Todavía no guardaste nada. Tocá Descargar en la ficha de una serie o película.') + '</div>' + (list.length ? '<div class="st-opts">' + list.map((m) => '<div class="st-opt"><a href="#/' + m.type + '/' + m.id + '" data-close>' + esc(m.t) + '</a><button data-rm="' + m.type + ':' + m.id + '">Quitar</button></div>').join('') + '</div>' : ''),
      bind(s) { s.el.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (!b) return; delete S.off[b.dataset.rm]; store.save(); b.closest('.st-opt').remove(); re(); }); } };
  },
  backup(S, re) {
    return { html: '<h3>Respaldo</h3><div class="ssub">Todo vive en este teléfono. Copiá un respaldo para guardarlo donde quieras. No incluye tu API key.</div><button class="btn pri" data-act="exp" style="width:100%">Copiar respaldo</button><div class="field" style="margin-top:16px"><label for="imp">Restaurar</label><textarea id="imp" placeholder="Pegá acá un respaldo"></textarea></div><div class="err" id="ierr" role="alert"></div><button class="btn glass" data-act="imp" style="width:100%;margin-top:6px">Restaurar</button>',
      bind(s) {
        s.el.addEventListener('click', async (e) => {
          const a = e.target.closest('[data-act]'); if (!a) return;
          if (a.dataset.act === 'exp') { const t = store.exportJSON(); try { await navigator.clipboard.writeText(t); toast('Respaldo copiado'); } catch (er) { $('#imp', s.el).value = t; $('#imp', s.el).select(); toast('Copialo desde el cuadro'); } }
          if (a.dataset.act === 'imp') { try { store.importJSON($('#imp', s.el).value); toast('Respaldo restaurado'); s.close(); re(); } catch (er) { $('#ierr', s.el).textContent = 'Ese texto no es un respaldo de Hilo.'; } }
        });
      } };
  },
  install() {
    return { html: '<h3>Instalar en tu iPhone</h3><div class="ssub">Instalada, Hilo se abre a pantalla completa y el teléfono no borra tus datos.</div><ol class="st-steps"><li>En Safari tocá <b>Compartir</b>.</li><li>Elegí <b>Agregar a inicio</b>.</li><li>Abrí Hilo desde el ícono nuevo.</li></ol><button class="btn pri" data-close style="width:100%">Listo</button>' };
  },
  reset(S, re) {
    return { html: '<h3>Borrar mi progreso</h3><div class="ssub">Quita seguimientos, capítulos vistos, puntuaciones y descargas. No toca tu API key. No se puede deshacer.</div><button class="btn danger" data-act="go" style="width:100%">Borrar todo</button><button class="btn glass" data-close style="width:100%;margin-top:8px">Cancelar</button>',
      bind(s) { s.el.addEventListener('click', (e) => { if (!e.target.closest('[data-act="go"]')) return; store.resetProgress(); toast('Progreso borrado'); s.close(); re(); }); } };
  },
  about() {
    return { html: '<h3>Acerca de</h3><div class="ssub">Hilo ' + VERSION + '</div><p class="st-p">Datos e imágenes de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.</p><p class="st-p">Dónde ver: JustWatch, vía TMDB. Textos de Wikipedia bajo licencia CC BY-SA 4.0. Las imágenes pertenecen a sus titulares.</p><button class="btn glass" data-close style="width:100%">Cerrar</button>' };
  }
};

export const tab = 'settings';
export async function mount(el) {
  if (!store.state().key) { location.hash = '#/setup'; return; }
  const S = store.state(), root = document.documentElement;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  root.classList.add('nd', 'nd-full'); el.style.setProperty('--h', 215); root.style.setProperty('--h', 215);

  // fondo: tu último título, muy desenfocado
  const lastKey = Object.keys(S.last || {}).sort((a, b) => S.last[b] - S.last[a])[0], m = lastKey && S.meta[lastKey];
  let src = ''; if (m) { const a = await api.heroAssets(m.type, m.id); src = a.poster || (m.tp && img(m.tp, 'w780')) || img(m.b, 'w1280') || img(m.p, 'w780'); }
  if (!el.isConnected) return;
  const fsEl = document.createElement('div'); fsEl.className = 'fs-bg dim'; fsEl.innerHTML = (src ? '<img class="a" src="' + src + '" alt="">' : '') + '<i></i>'; document.body.appendChild(fsEl);

  const draw = () => {
    const off = Object.keys(S.off).length, prog = store.inProgress().length, done = store.completed().length, fol = store.listed().length;
    const sum = [prog ? prog + ' en curso' : '', done ? done + ' terminadas' : '', fol ? fol + ' en tu lista' : ''].filter(Boolean).join(' · ') || 'Todavía no seguís nada';
    const groups = [
      [['region', 'País', regionName(S.region)], ['key', 'API key de TMDB', '••••' + S.key.slice(-4)]],
      [['off', 'Sin conexión', off ? off + (off === 1 ? ' guardada' : ' guardadas') : 'Nada guardado'], ['backup', 'Respaldo', '']],
      [...(standalone ? [] : [['install', 'Instalar en tu iPhone', '']]), ['about', 'Acerca de', 'v' + VERSION]],
      [['reset', 'Borrar mi progreso', '', 1]]
    ];
    const row = (r) => '<button class="st-r' + (r[3] ? ' danger' : '') + '" data-s="' + r[0] + '"><span class="l">' + r[1] + '</span><span class="v">' + esc(r[2]) + '</span>' + (r[3] ? '' : ic('chev', 16)) + '</button>';
    el.innerHTML = '<div class="st-top"><h1 class="st-title">Ajustes</h1><div class="mt">' + esc(sum) + '</div></div><div class="pad st-list">' + groups.map((g) => '<div class="st-g">' + g.map(row).join('') + '</div>').join('') +
      '<p class="st-foot">Datos e imágenes de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB.</p></div>';
  };
  draw();
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    const sh = SH[b.dataset.s](S, draw), s = openSheet(sh.html, 215); if (sh.bind) sh.bind(s);
  });
  return () => { fsEl.remove(); root.classList.remove('nd', 'nd-full'); };
}
