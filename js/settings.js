// Primera configuración (API key) y Ajustes.
import * as store from './store.js';
import * as api from './api.js';
import { esc, ic, toast, $, $$ } from './ui.js';

export const VERSION = '1.0.0';
const REGIONS = [['AR', 'Argentina'], ['MX', 'México'], ['CL', 'Chile'], ['CO', 'Colombia'], ['UY', 'Uruguay'], ['PE', 'Perú'], ['ES', 'España'], ['BR', 'Brasil'], ['US', 'Estados Unidos']];

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

export const tab = 'settings';
export async function mount(el) {
  if (!store.state().key) { location.hash = '#/setup'; return; }
  const S = store.state();
  el.style.setProperty('--h', 215); document.documentElement.style.setProperty('--h', 215);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const offList = Object.keys(S.off).map((k) => S.meta[k]).filter(Boolean);
  el.innerHTML = '<div class="pagehead"><h1>Ajustes</h1></div><div class="form">' +
    (standalone ? '' : '<div class="card"><h3>Instalá Hilo en tu iPhone</h3><p>En Safari tocá <b style="color:var(--fg)">Compartir</b> y después <b style="color:var(--fg)">Agregar a inicio</b>. Instalada se abre a pantalla completa y el teléfono no borra tus datos.</p></div>') +
    '<div class="card"><h3>Conexión con TMDB</h3><p>API key guardada: <b style="color:var(--fg)">••••' + esc(S.key.slice(-4)) + '</b></p><div id="chg" hidden style="margin-top:12px;display:grid;gap:10px"><div class="field"><input id="nk" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Nueva API key"></div><div class="err" id="kerr"></div></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn glass small" data-a="chgkey">Cambiar key</button></div></div>' +
    '<div class="card"><div class="field"><label for="reg">Dónde ver (país)</label><select id="reg">' + REGIONS.map((r) => '<option value="' + r[0] + '"' + (S.region === r[0] ? ' selected' : '') + '>' + r[1] + '</option>').join('') + '</select></div><p style="margin-top:10px">Define qué plataformas se muestran en cada ficha.</p></div>' +
    '<div class="card"><h3>Sin conexión</h3><p>' + (offList.length ? 'Guardados en este teléfono:' : 'Todavía no guardaste nada. Tocá el ícono de descarga en la ficha de una serie o película.') + '</p>' +
    (offList.length ? '<div style="display:grid;gap:8px;margin-top:10px">' + offList.map((m) => '<div class="lk"><div><a href="#/' + m.type + '/' + m.id + '">' + esc(m.t) + '</a></div><button class="linkbtn" data-a="rmoff" data-k="' + m.type + ':' + m.id + '">Quitar</button></div>').join('') + '</div>' : '') + '</div>' +
    '<div class="card"><h3>Respaldo de tu progreso</h3><p>Todo vive en este teléfono. Guardá un respaldo por las dudas (no incluye tu API key).</p><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn glass small" data-a="exp">Copiar respaldo</button><button class="btn glass small" data-a="dl">Descargar archivo</button></div>' +
    '<div class="field" style="margin-top:14px"><label for="imp">Restaurar</label><textarea id="imp" placeholder="Pegá acá el respaldo"></textarea></div><button class="btn glass small" data-a="imp" style="margin-top:10px">Restaurar respaldo</button><div class="err" id="ierr" style="margin-top:6px"></div></div>' +
    '<div class="card"><h3>Borrar mi progreso</h3><p>Quita seguimientos, capítulos vistos, puntuaciones y descargas. No toca tu API key.</p><button class="btn glass small" data-a="reset" style="margin-top:12px">Borrar todo</button></div>' +
    '<div class="attr">Hilo ' + VERSION + '. Datos e imágenes de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. Este producto usa la API de TMDB pero no está respaldado ni certificado por TMDB. Disponibilidad de plataformas: JustWatch.</div></div>';

  $('#reg', el).addEventListener('change', (e) => { store.setRegion(e.target.value); toast('País: ' + e.target.selectedOptions[0].textContent); });
  let armed = 0;
  el.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-a]'); if (!a) return; const act = a.dataset.a;
    if (act === 'chgkey') {
      const box = $('#chg', el);
      if (box.hidden) { box.hidden = false; a.textContent = 'Guardar nueva key'; $('#nk', el).focus(); return; }
      const v = $('#nk', el).value.trim(); if (!v) return;
      a.disabled = true; try { await api.validate(v); store.setKey(v); api.clearMemory(); toast('API key actualizada'); mount(el); } catch (er) { $('#kerr', el).textContent = er.message; a.disabled = false; }
      return;
    }
    if (act === 'rmoff') { delete S.off[a.dataset.k]; store.save(); mount(el); return; }
    if (act === 'exp') { const txt = store.exportJSON(); try { await navigator.clipboard.writeText(txt); toast('Respaldo copiado'); } catch (er) { $('#imp', el).value = txt; toast('Copialo desde el cuadro de abajo'); } return; }
    if (act === 'dl') { const b = new Blob([store.exportJSON()], { type: 'application/json' }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = 'hilo-respaldo.json'; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); return; }
    if (act === 'imp') { try { store.importJSON($('#imp', el).value); toast('Respaldo restaurado'); $('#ierr', el).textContent = ''; mount(el); } catch (er) { $('#ierr', el).textContent = 'Ese texto no es un respaldo de Hilo.'; } return; }
    if (act === 'reset') {
      if (!armed) { armed = 1; a.textContent = 'Tocá de nuevo para confirmar'; setTimeout(() => { armed = 0; if (a.isConnected) a.textContent = 'Borrar todo'; }, 4000); return; }
      store.resetProgress(); toast('Progreso borrado'); mount(el);
    }
  });
}
