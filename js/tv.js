// Ver en la TV: si lo activás, al reproducir Hilo pregunta si lo ves en el teléfono o en tu TV.
// Hilo no puede hablarle a la TV por sí mismo (una web en el iPhone no puede buscar equipos de tu red), así que
// le pasa el pedido a algo tuyo: un Atajo de iOS o un webhook https. El pedido lleva el título, la plataforma y el enlace del capítulo.
import * as store from './store.js';
import { openSheet } from './sheet.js';
import { esc, ic, toast } from './ui.js';

export const cfg = () => { const S = store.state(); S.tv = S.tv || {}; return S.tv; };
export const on = () => !!cfg().on;
export const tvName = () => (cfg().name || '').trim() || 'Mi TV';
export const shortcutName = () => (cfg().shortcut || '').trim() || 'Hilo a la TV';

const HOSTS = [['netflix.com', 'Netflix', 'n'], ['disneyplus.com', 'Disney+', 'd'], ['hbomax.com', 'Max', 'h'], ['max.com', 'Max', 'h'], ['primevideo.com', 'Prime Video', 'p'], ['amazon.', 'Prime Video', 'p'], ['tv.apple.com', 'Apple TV+', 'a'], ['paramountplus.com', 'Paramount+', 'c']];
export function platOf(url) { const h = (() => { try { return new URL(url).hostname; } catch (e) { return ''; } })(); const f = HOSTS.find((x) => h.indexOf(x[0]) > -1); return f ? { short: f[1], code: f[2] } : { short: '', code: '' }; }

export const payload = (x) => { const p = platOf(x.url); return { hilo: 1, tipo: x.type, id: +x.id, titulo: x.title || '', plataforma: x.short || p.short, codigo: p.code, url: x.url }; };

const openScheme = (url) => { const a = document.createElement('a'); a.href = url; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500); };
// manda el pedido: al webhook si hay uno, y si no, al Atajo
export function send(x) {
  const c = cfg(), body = JSON.stringify(payload(x)), name = tvName();
  if (c.hook) {
    fetch(c.hook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body }).then(() => toast('Enviado a ' + name), () => toast('No pude enviarlo a ' + name));
    return;
  }
  openScheme('shortcuts://run-shortcut?name=' + encodeURIComponent(shortcutName()) + '&input=text&text=' + encodeURIComponent(body));
  toast('Enviando a ' + name + '…');
}

/* ¿teléfono o TV? */
export function askDest(x, done) {
  const s = openSheet('<h3>¿Dónde lo ves?</h3><div class="ssub">' + esc(x.title) + '</div><div class="tv-dst"><button data-dest="phone">' + ic('phone', 30) + '<b>Este teléfono</b></button><button data-dest="tv">' + ic('tv', 30) + '<b>' + esc(tvName()) + '</b></button></div>', 215);
  s.el.addEventListener('click', (e) => { const b = e.target.closest('[data-dest]'); if (!b) return; s.close(); done(b.dataset.dest); });
}
// si el título está en más de una plataforma, cuál abrir en la TV
export function chooseTv(x, done) {
  const s = openSheet('<h3>¿En cuál app?</h3><div class="ssub">' + esc(x.title) + ' · ' + esc(tvName()) + '</div><div class="ch-list">' + x.opts.map((o, i) => '<button class="ch-r" data-i="' + i + '">' + ic('play', 18) + '<span>' + esc(o.s) + '</span>' + (i === 0 ? '<em>La última que usaste</em>' : '') + '</button>').join('') + '</div>', 215);
  s.el.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (!b) return; s.close(); done(x.opts[+b.dataset.i]); });
}

/* Ajustes → Mi TV */
export const hookOk = (u) => /^https:\/\/[^\s]+$/i.test(u);
export function testRequest() { send({ type: 'tv', id: 0, title: 'Prueba de Hilo', url: 'https://www.netflix.com/' }); }
