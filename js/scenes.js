// Fondo vivo: escenas reales del título que se cruzan despacio detrás de toda la ficha.
export function mountScenes(urls, fallback) {
  const list = (urls && urls.length ? urls : fallback ? [fallback] : []).filter(Boolean).slice(0, 5);
  if (!list.length) return () => {};
  const root = document.createElement('div'); root.className = 'scenes';
  root.innerHTML = list.map((u) => '<i style="background-image:url(' + u + ')"></i>').join('');
  document.body.appendChild(root);
  const anims = [];
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = root.querySelectorAll('i');
  if (els.length === 1 || reduce) { els[0].style.opacity = '.6'; if (!reduce) anims.push(els[0].animate([{ transform: 'scale(1.1) translate(0,0)' }, { transform: 'scale(1.28) translate(-3%,-2%)' }], { duration: 22000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' })); }
  else {
    const slot = 7000, D = 10500, cycle = els.length * slot;
    els.forEach((el, i) => {
      anims.push(el.animate([
        { opacity: 0, transform: 'scale(1.12) translate(0,0)', offset: 0 },
        { opacity: 0.62, offset: 0.22 },
        { opacity: 0.62, offset: 0.7 },
        { opacity: 0, transform: 'scale(1.32) translate(-3%,-2%)', offset: 1 }
      ], { duration: D, delay: i * slot, endDelay: Math.max(0, cycle - D), iterations: Infinity, easing: 'ease-in-out' }));
    });
  }
  return () => { anims.forEach((a) => a.cancel()); root.remove(); };
}
