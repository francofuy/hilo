// Temas por título: paleta, partículas y decoración propia de cada serie o película.
//
// Reglas de diseño de los efectos (para que nunca se vea un corte):
//  1. Los efectos de pantalla completa viven en una capa fija al viewport: sus bordes son los de la pantalla.
//  2. Lo que está dentro de la portada entra desde los costados o se funde con máscaras, y se desvanece con el scroll.
//  3. Todo lo posible sigue el scroll (el reloj gira, la línea de tiempo crece, el HUD se desplaza).
import { startFx } from './fx.js';
import { state } from './store.js';

const ticks = (n, r1, r2, c = 100) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 6.2832, x1 = c + Math.sin(a) * r1, y1 = c - Math.cos(a) * r1, x2 = c + Math.sin(a) * r2, y2 = c - Math.cos(a) * r2; return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>'; }).join('');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- The Walking Dead ---------- */
const ZA = 'M36 20C34 9 42 3 51 6C59 9 60 19 55 26C53 29 50 31 49 34C53 37 58 40 63 44L86 56L84 63L62 54L83 70L80 77L58 62C58 74 57 86 56 98C60 120 62 148 66 178L50 178C47 152 44 128 41 108C38 130 34 152 28 178L12 178C19 150 24 120 25 96C24 78 25 58 30 44C33 38 38 34 42 33C40 31 38 26 36 20Z';
const ZB = 'M40 24C38 12 46 6 54 9C61 12 61 22 57 28C55 31 52 33 51 36C54 39 57 44 58 50L66 30L72 31L65 56C64 70 62 84 60 98C64 122 64 150 68 178L52 178C49 152 47 130 44 110C41 132 36 154 30 178L14 178C21 150 27 122 28 98C27 80 29 62 33 48C35 42 40 38 44 36C42 33 41 28 40 24Z';
const ZC = 'M30 34C28 24 35 17 43 19C50 21 52 29 48 35C46 38 44 40 43 43C48 45 53 49 57 55L76 74L72 80L54 66C54 78 53 90 52 100C54 122 54 150 56 178L40 178C38 154 36 132 34 112C32 134 28 156 22 178L7 178C14 150 20 122 22 98C21 82 23 66 27 54C28 48 31 45 35 43C32 40 31 37 30 34Z';
const zw = (d, h, dur, dl, rtl, o, lift) => '<svg class="zw' + (rtl ? ' r' : '') + '" viewBox="0 0 90 180" style="--h:' + h + 'px;--dur:' + dur + 's;--dl:-' + dl + 's;--o:' + o + ';bottom:' + lift + 'px"><path d="' + d + '" style="animation-delay:-' + (dl % 4) + 's"/></svg>';
const heroTwd = () => '<div class="tw-hero"><div class="tw-mist"></div><div class="tw-walkers">' +
  zw(ZA, 176, 96, 24, false, 0.94, 0) + zw(ZB, 146, 122, 74, true, 0.9, 6) + zw(ZC, 116, 150, 112, false, 0.78, 22) + zw(ZA, 128, 138, 40, true, 0.82, 14) + zw(ZB, 100, 172, 140, false, 0.66, 30) + '</div></div>';
const fixTwd = () => '<div class="tw-fix"><div class="tw-vig"></div><div class="tw-fog f1"></div><div class="tw-fog f2"></div></div>';
const bindTwd = (fx, hero) => { const wk = hero && hero.querySelector('.tw-walkers'); return (y) => { if (!wk) return; wk.style.transform = 'translateY(' + (-y * 0.2) + 'px) scale(' + (1 + y / 1100) + ')'; wk.style.opacity = clamp(1 - y / 360, 0, 1); }; };

/* ---------- Loki ---------- */
const clockSvg = (cls) => '<svg class="lk-clock ' + cls + '" viewBox="0 0 200 200"><g class="lk-r1"><circle cx="100" cy="100" r="94"/><circle cx="100" cy="100" r="86" stroke-dasharray="2 5"/><g>' + ticks(60, 80, 86) + '</g></g><g class="lk-r2"><circle cx="100" cy="100" r="68"/><g>' + ticks(12, 56, 68) + '</g></g><g class="lk-hand"><path d="M100 100 L100 34"/><path d="M100 100 L132 112"/><circle cx="100" cy="100" r="4" fill="currentColor"/></g></svg>';
const fixLoki = () => '<div class="lk-fix">' + clockSvg('c1') + clockSvg('c2') +
  '<svg class="lk-tl" viewBox="0 0 36 1000" preserveAspectRatio="none"><path class="tl-t" pathLength="1" d="M10 -10 C11 150 14 250 10 400 S6 700 12 1010"/><path class="tl-p" pathLength="1" d="M10 -10 C11 150 14 250 10 400 S6 700 12 1010"/>' +
  '<path class="tl-b" data-y="180" pathLength="1" d="M11 180 C22 190 30 202 35 232"/><path class="tl-b" data-y="380" pathLength="1" d="M10 380 C20 392 29 406 34 444"/><path class="tl-b" data-y="560" pathLength="1" d="M9 560 C19 576 26 592 34 642"/><path class="tl-b" data-y="800" pathLength="1" d="M11 800 C22 813 30 826 35 872"/>' +
  '<circle class="tl-n" data-y="180" cx="11" cy="180" r="3"/><circle class="tl-n" data-y="380" cx="10" cy="380" r="3"/><circle class="tl-n" data-y="560" cx="9" cy="560" r="3"/><circle class="tl-n" data-y="800" cx="11" cy="800" r="3"/></svg><div class="lk-glitch"></div></div>';
const bindLoki = (fx) => {
  const trunk = fx.querySelector('.tl-t'), brs = [...fx.querySelectorAll('.tl-b')], nds = [...fx.querySelectorAll('.tl-n')], hands = [...fx.querySelectorAll('.lk-hand')];
  return (y, p) => {
    const prog = clamp(0.16 + p * 0.95, 0, 1); trunk.style.strokeDashoffset = 1 - prog; const yy = prog * 1000;
    brs.forEach((b) => { b.style.strokeDashoffset = 1 - clamp((yy - +b.dataset.y) / 130, 0, 1); });
    nds.forEach((n) => { n.style.opacity = yy > +n.dataset.y ? 1 : 0; });
    hands.forEach((h, i) => { h.style.transform = 'rotate(' + (y * (i ? -0.25 : 0.4)) + 'deg)'; });
  };
};

/* ---------- WandaVision ---------- */
const fixWanda = () => '<div class="wv-fix"><div class="wv-burst"></div><div class="wv-chaos c1"></div><div class="wv-chaos c2"></div><div class="wv-scan"></div><div class="wv-vig"></div><div class="wv-roll"></div></div>';
const bindWanda = (fx) => { const b = fx.querySelector('.wv-burst'), c1 = fx.querySelector('.c1'), c2 = fx.querySelector('.c2'); return (y) => { b.style.transform = 'translateX(-50%) rotate(' + (y * 0.07) + 'deg)'; c1.style.translate = (y * 0.03) + 'px ' + (y * 0.05) + 'px'; c2.style.translate = (-y * 0.03) + 'px ' + (-y * 0.04) + 'px'; }; };

/* ---------- Iron Man ---------- */
const heroIron = () => '<svg class="im-ret" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="92" stroke-dasharray="3 7"/><circle class="rt1" cx="100" cy="100" r="76" stroke-dasharray="40 12 8 12"/><circle cx="100" cy="100" r="50" stroke-dasharray="1 5"/><path d="M100 4 V22 M100 178 V196 M4 100 H22 M178 100 H196"/><g>' + ticks(36, 86, 91) + '</g></svg>';
const fixIron = () => '<div class="im-fix"><div class="im-corners"><i></i><i></i><i></i><i></i></div><div class="im-ruler"></div>' +
  '<svg class="im-arc" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="34"/><g class="spin">' + Array.from({ length: 10 }, (_, i) => '<rect x="47" y="12" width="6" height="14" rx="1.5" transform="rotate(' + i * 36 + ' 50 50)"/>').join('') + '</g><circle cx="50" cy="50" r="12" fill="currentColor"/></svg>' +
  '<div class="im-hud h1">SISTEMA EN LÍNEA<br>STARK IND. // MARK I</div><div class="im-hud h2" id="hudnum">ARC 100%  ·  0000</div><div class="im-sweep"></div></div>';
const bindIron = (fx, hero) => { const r = fx.querySelector('.im-ruler'), ret = hero && hero.querySelector('.im-ret'); return (y) => { r.style.backgroundPositionY = (-y * 0.5) + 'px'; if (ret) ret.style.opacity = clamp(1 - y / 420, 0, 1); }; };

/* ---------- por género (capas fijas, sin bordes) ---------- */
const G = {
  horror: '<div class="deco g-horror"><div class="vig"></div><div class="fogb f1"></div><div class="fogb f2"></div></div>',
  scifi: '<div class="deco g-scifi"><div class="grid"></div><div class="scan"></div></div>',
  fantasy: '<div class="deco g-fantasy"><svg class="runes" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="78" stroke-dasharray="3 8"/><g>' + ticks(24, 62, 74) + '</g><circle cx="100" cy="100" r="50" stroke-dasharray="14 6"/></svg><div class="glow"></div></div>',
  crime: '<div class="deco g-crime"><div class="blinds"></div><div class="vig"></div></div>',
  fun: '<div class="deco g-fun"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>',
  romance: '<div class="deco g-romance"><div class="glow"></div></div>',
  action: '<div class="deco g-action"><div class="rays"></div><div class="flash"></div></div>',
  dust: '<div class="deco g-dust"><div class="sun"></div><div class="haze"></div></div>',
  drama: '<div class="deco g-drama"><i class="bk b1"></i><i class="bk b2"></i><i class="bk b3"></i><i class="bk b4"></i></div>',
  hex: '<div class="deco g-hex"><div class="hexgrid"></div><div class="shine"></div></div>'
};

/* ---------- registro ---------- */
const BESPOKE = {
  twd: { id: 'twd', h: 6, h2: 92, as: '76%', al: '56%', fx: [{ t: 'ash', n: 48, c: '226,222,210' }, { t: 'embers', n: 12, c: '255,120,50' }], hero: heroTwd, deco: fixTwd, bind: bindTwd },
  loki: { id: 'loki', h: 44, h2: 150, as: '88%', al: '62%', fx: [{ t: 'motes', n: 34, c: '255,214,110' }, { t: 'motes', n: 10, c: '120,230,170' }], deco: fixLoki, bind: bindLoki },
  wanda: { id: 'wanda', h: 356, h2: 46, as: '84%', al: '60%', fx: [{ t: 'sparkle', n: 9, c: '255,205,100' }, { t: 'sparkle', n: 6, c: '255,90,100' }, { t: 'static', a: 0.03 }], deco: fixWanda, bind: bindWanda },
  ironman: { id: 'ironman', h: 6, h2: 44, as: '90%', al: '58%', fx: [{ t: 'sparks', n: 24, c: '255,176,64' }], hero: heroIron, deco: fixIron, bind: bindIron }
};
const OF_KEY = { 'tv:1402': 'twd', 'tv:62286': 'twd', 'tv:194583': 'twd', 'tv:84958': 'loki', 'tv:85271': 'wanda', 'movie:1726': 'ironman' };
const WANDA_ERA = { 1: ['1950s', 'bw'], 2: ['1960s', 'bw'], 3: ['1970s', ''], 4: ['Actualidad', ''], 5: ['1980s', ''], 6: ['1990s', ''], 7: ['2000s', ''], 8: ['Flashback', ''], 9: ['Actualidad', ''] };

const GENERIC = {
  horror: { h: 6, fx: [{ t: 'fog', n: 4, c: '120,130,120' }, { t: 'embers', n: 8, c: '255,70,50' }], deco: 'horror' },
  scifi: { h: 195, fx: [{ t: 'stars', n: 70, c: '200,235,255' }], deco: 'scifi' },
  fantasy: { h: 275, fx: [{ t: 'motes', n: 36, c: '255,226,150' }], deco: 'fantasy' },
  crime: { h: 215, fx: [{ t: 'rain', n: 70, c: '170,200,255' }], deco: 'crime' },
  fun: { h: 330, fx: [{ t: 'confetti', n: 34 }], deco: 'fun' },
  romance: { h: 340, fx: [{ t: 'petals', n: 24, c: '255,150,180' }], deco: 'romance' },
  action: { h: 22, fx: [{ t: 'sparks', n: 22, c: '255,170,70' }, { t: 'dust', n: 20, c: '240,200,150' }], deco: 'action' },
  dust: { h: 34, fx: [{ t: 'dust', n: 44, c: '235,200,150' }], deco: 'dust' },
  drama: { h: 215, fx: [{ t: 'motes', n: 26, c: '255,235,200' }], deco: 'drama' },
  hex: { h: 215, fx: [{ t: 'sparks', n: 16, c: '255,205,100' }, { t: 'motes', n: 14, c: '150,200,255' }], deco: 'hex' }
};
const GKEY = [[27, 'horror'], [53, 'crime'], [80, 'crime'], [9648, 'crime'], [878, 'scifi'], [10765, 'scifi'], [14, 'fantasy'], [16, 'fun'], [10751, 'fun'], [35, 'fun'], [10749, 'romance'], [28, 'action'], [10759, 'action'], [12, 'action'], [10752, 'dust'], [37, 'dust'], [36, 'dust'], [18, 'drama']];

export function resolveTheme(k, d, g, U, pal) {
  let b = OF_KEY[k];
  const uids = (U && U.byKey && U.byKey[k]) || [];
  if (!b && uids.indexOf('twd') > -1) b = 'twd';
  if (b) { const T = BESPOKE[b]; return { ...T, bespoke: true, above: true, hero: T.hero ? T.hero() : '', deco: T.deco(), epMeta: b === 'wanda' ? (s, e) => (s === 1 ? WANDA_ERA[e] : null) : null }; }
  let key = uids.indexOf('marvel') > -1 ? 'hex' : null;
  if (!key) for (const [id, name] of GKEY) if ((g || []).indexOf(id) > -1) { key = name; break; }
  key = key || 'drama';
  const T = GENERIC[key];
  const h = pal ? pal.h : T.h, h2 = pal ? pal.h2 : (T.h + 40) % 360;
  return { id: 'g-' + key, h, h2, as: '88%', al: '64%', fx: T.fx, deco: G[T.deco], hero: '', above: false, bespoke: false, epMeta: null };
}

/* ---------- aplicar ---------- */
export function applyTheme(el, T) {
  const root = document.documentElement;
  const level = state().fx || 'full';
  root.dataset.fx = level;
  el.classList.add('th', 'th-' + T.id);
  root.style.setProperty('--h', T.h); root.style.setProperty('--h2', T.h2); root.style.setProperty('--as', T.as); root.style.setProperty('--al', T.al);
  el.style.setProperty('--h', T.h);
  const hero = el.querySelector('.dhero');
  let heroLayer = null;
  if (hero && T.hero) { hero.insertAdjacentHTML('beforeend', '<div class="deco">' + T.hero + '</div>'); heroLayer = hero.querySelector(':scope > .deco'); }
  const fixed = document.createElement('div'); fixed.className = 'decof th-' + T.id + (T.above ? ' above' : ''); fixed.innerHTML = T.deco || ''; document.body.appendChild(fixed);

  let stopFx = () => {}, cv = null;
  if (level !== 'off' && (T.fx || []).length) {
    const scale = level === 'soft' ? 0.5 : 1;
    cv = document.createElement('canvas'); cv.className = 'fxc'; document.body.appendChild(cv);
    stopFx = startFx(cv, (T.fx || []).map((s) => ({ ...s, n: s.n != null ? Math.max(1, Math.round(s.n * scale)) : s.n })));
  }
  const update = T.bind ? T.bind(fixed, heroLayer) : null;
  let raf = 0;
  const onScroll = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; if (!update) return; const y = Math.max(0, window.scrollY), max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); update(y, clamp(y / max, 0, 1)); }); };
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
  onScroll();
  let iv = 0;
  const hud = fixed.querySelector('#hudnum');
  if (hud) iv = setInterval(() => { hud.textContent = 'ARC ' + (96 + Math.floor(Math.random() * 5)) + '%  ·  ' + String(Math.floor(Math.random() * 9999)).padStart(4, '0'); }, 900);
  return () => {
    stopFx(); if (cv) cv.remove(); fixed.remove(); clearInterval(iv); cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll);
    ['--as', '--al', '--h2'].forEach((p) => root.style.removeProperty(p));
  };
}
