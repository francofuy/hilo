// Service worker de Hilo: la app abre sin conexión y lo que guardaste sigue disponible.
const VERSION = 'hilo-v27';
const SHELL = VERSION + '-shell', API = VERSION + '-api', IMGS = VERSION + '-img', FONTS = VERSION + '-fonts';
const PRECACHE = ['./', 'index.html', 'css/app.css', 'css/theme.css', 'css/design.css', 'css/screens.css', 'css/motion.css', 'css/hmx.css', 'css/fun.css', 'css/lists.css', 'css/tv.css', 'manifest.webmanifest', 'data/universes.json', 'data/orders.json', 'data/links.json', 'data/episodes.json',
  'js/app.js', 'js/api.js', 'js/data.js', 'js/detail.js', 'js/extras.js', 'js/fx.js', 'js/home.js', 'js/progress.js', 'js/search.js', 'js/settings.js', 'js/sheet.js', 'js/store.js', 'js/taste.js', 'js/motion.js', 'js/hmx.js', 'js/back.js', 'js/fun.js', 'js/lists.js', 'js/tv.js', 'js/mon.js', 'js/platform.js', 'js/theme.js', 'js/ui.js', 'js/universe.js',
  'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf(VERSION) !== 0).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(cache, max) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

/* red primero; si no hay red (o tarda), lo guardado */
async function netFirst(req, name, timeout) {
  const cache = await caches.open(name);
  const net = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; });
  const hit = await cache.match(req);
  if (!hit) return net;
  return Promise.race([net.catch(() => hit), new Promise((r) => setTimeout(() => r(hit), timeout))]);
}
async function cacheFirst(req, name, max) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()); trim(cache, max); }
  return res;
}
async function swr(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || net;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      try {
        const cache = await caches.open(SHELL);
        const res = await fetch(req, { cache: 'no-cache' });
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === 'navigate') return (await caches.match('index.html')) || (await caches.match('./'));
        throw err;
      }
    })());
  } else if (url.hostname === 'api.themoviedb.org' || url.hostname.endsWith('wikipedia.org') || url.hostname === 'www.wikidata.org') {
    e.respondWith(netFirst(req, API, 3500));
  } else if (url.hostname === 'image.tmdb.org') {
    e.respondWith(cacheFirst(req, IMGS, 900));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(swr(req, FONTS));
  }
});
