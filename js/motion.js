// Movimiento: barra de abajo que se oculta al bajar, imágenes que se aclaran al cargar y deslizar para marcar.
import { $ } from './ui.js';

const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

/* ---------- sin zoom ni selección ----------
   Safari a veces ignora el viewport: se cortan también los gestos de zoom, el doble toque y la selección de texto.
   Los campos de texto siguen funcionando para escribir y pegar. */
export function initLock() {
  const stop = (e) => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((n) => document.addEventListener(n, stop, { passive: false }));
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', stop, { passive: false });
  window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  const field = (t) => { const el = t && t.nodeType === 1 ? t : t && t.parentElement; return !!(el && el.closest && el.closest('input,textarea')); };
  document.addEventListener('contextmenu', (e) => { if (!field(e.target)) e.preventDefault(); });
  document.addEventListener('selectstart', (e) => { if (!field(e.target)) e.preventDefault(); });
}

/* ---------- arrastrar con el mouse las filas que se desplazan de costado ----------
   Con el dedo ya se desplazan solas; con el mouse (la app abierta en una computadora) hay que arrastrar a mano. */
export function initDragScroll() {
  let st = null, block = 0;
  const scroller = (el) => { for (; el && el !== document.body; el = el.parentElement) { const o = getComputedStyle(el).overflowX; if ((o === 'auto' || o === 'scroll') && el.scrollWidth > el.clientWidth + 2) return el; } return null; };
  document.addEventListener('dragstart', (e) => e.preventDefault()); // sin el "fantasma" al arrastrar imágenes y enlaces
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = scroller(e.target); if (!el) return;
    st = { el, x: e.clientX, left: el.scrollLeft, moved: false, id: e.pointerId };
  });
  document.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x;
    if (!st.moved && Math.abs(dx) < 6) return;
    if (!st.moved) { st.moved = true; st.el.style.scrollSnapType = 'none'; st.el.style.cursor = 'grabbing'; try { st.el.setPointerCapture(e.pointerId); } catch (err) { /* nada */ } }
    st.el.scrollLeft = st.left - dx;
  });
  const end = () => {
    if (!st) return; const s = st; st = null;
    if (s.moved) { block = Date.now() + 120; s.el.style.cursor = ''; s.el.style.scrollSnapType = ''; }
  };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  document.addEventListener('click', (e) => { if (Date.now() < block) { e.preventDefault(); e.stopPropagation(); } }, true);
}

/* ---------- barra de abajo: solo íconos; desaparece al bajar y vuelve al subir ---------- */
export function initNav() {
  const root = document.documentElement, view = $('#view');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY, dy = y - lastY; if (Math.abs(dy) < 8) return; lastY = y;
    root.classList.toggle('nv-away', dy > 0 && y > 90);
  }, { passive: true });
  // al cambiar de pantalla la barra vuelve a aparecer
  if (view) new MutationObserver(() => root.classList.remove('nv-away')).observe(view, { childList: true });
}

/* ---------- imágenes que nunca "saltan" ----------
   Las imágenes grandes de TMDB muestran primero su versión mínima (w92), borrosa, y se aclaran al llegar la nítida.
   Si ya está en memoria no se nota nada: el desenfoque solo aparece si tarda más de un instante. */
const BIG = /(image\.tmdb\.org\/t\/p\/)(?:w342|w500|w780|w1280|original)\//;
export function initBlurUp() {
  if (RM.matches) return;
  const handle = (im) => {
    if (im.__bu) return; im.__bu = 1;
    const src = im.getAttribute('src') || ''; if (!BIG.test(src)) return;
    if (im.complete && im.naturalWidth) return;
    im.classList.add('bu'); im.style.backgroundImage = 'url(' + src.replace(BIG, '$1w92/') + ')';
    const ok = () => { clearTimeout(t); im.classList.add('bu-ok'); };
    const t = setTimeout(() => { if (!im.classList.contains('bu-ok')) im.classList.add('bu-show'); }, 90);
    im.addEventListener('load', ok, { once: true }); im.addEventListener('error', ok, { once: true });
  };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    if (n.tagName === 'IMG') handle(n); else if (n.querySelectorAll) n.querySelectorAll('img').forEach(handle);
  }))).observe(document.body, { childList: true, subtree: true });
}

/* ---------- deslizar para marcar ----------
   Derecha marca como visto, izquierda lo quita. Detrás de la fila aparece el color y el tilde; al pasar el umbral se
   confirma. Las filas llevan touch-action: pan-y, así el scroll vertical sigue funcionando. */
export function swipeRows(root, { sel, canMark, canUnmark, on }) {
  const TH = 92;
  let st = null, block = 0;
  const CHK = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 12.5l4.2 4.2L18.5 8"/></svg>';
  const UND = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>';
  const reset = (li) => {
    li.classList.add('rel'); li.style.setProperty('--dx', '0px'); li.style.setProperty('--p', 0); li.removeAttribute('data-c');
    setTimeout(() => { li.classList.remove('swp', 'rel'); li.removeAttribute('data-sd'); }, 380);
  };
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const li = e.target.closest(sel); if (!li || e.target.closest('a,.btn,.eacts')) return;
    st = { li, x: e.clientX, y: e.clientY, id: e.pointerId, lock: null, mark: canMark(li), unmark: canUnmark(li) };
    if (!st.mark && !st.unmark) st = null;
  });
  root.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.lock) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { st = null; return; }
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        st.lock = 'x'; st.li.classList.remove('rel'); st.li.classList.add('swp');
        if (!st.li.querySelector(':scope > .sw')) st.li.insertAdjacentHTML('afterbegin', '<div class="sw" aria-hidden="true"><span class="yy">' + CHK + '</span><span class="nn">' + UND + '<b>Quitar</b></span></div>');
        try { st.li.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
      } else return;
    }
    const dir = dx > 0 ? 'mark' : 'unmark', ok = dir === 'mark' ? st.mark : st.unmark;
    let v = ok ? dx : dx * 0.18; const a = Math.abs(v);
    if (a > TH) v = Math.sign(v) * (TH + (a - TH) * 0.32);
    const p = ok ? Math.min(1, Math.abs(dx) / TH) : 0;
    if (ok) st.li.setAttribute('data-sd', dir); else st.li.removeAttribute('data-sd');
    st.li.style.setProperty('--dx', v + 'px'); st.li.style.setProperty('--p', p.toFixed(3));
    if (ok && Math.abs(dx) >= TH) st.li.setAttribute('data-c', '1'); else st.li.removeAttribute('data-c');
    st.dx = dx; st.ok = ok; st.dir = dir;
    e.preventDefault();
  });
  const end = (e) => {
    if (!st || e.pointerId !== st.id) return;
    const s = st; st = null;
    if (s.lock !== 'x') return;
    block = Date.now() + 350; // el dedo levantado no debe abrir la fila
    if (s.ok && Math.abs(s.dx) >= TH && e.type === 'pointerup') on(s.li, s.dir);
    reset(s.li);
  };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
  root.addEventListener('click', (e) => { if (Date.now() < block) { e.stopPropagation(); e.preventDefault(); } }, true);
}
