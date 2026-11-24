// Motor de partículas liviano: un solo <canvas> fijo, pocas partículas, se pausa solo.
// Tipos: ash, embers, motes, sparks, stars, rain, confetti, petals, sparkle, static, fog, dust.
const rnd = (a, b) => a + Math.random() * (b - a);
const sprites = {};
function sprite(rgb, size) {
  const key = rgb + '|' + size;
  if (sprites[key]) return sprites[key];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(0.35, 'rgba(' + rgb + ',.55)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return (sprites[key] = c);
}
const PALETTE = ['255,90,110', '255,200,80', '110,200,255', '150,255,170', '200,140,255'];

export function startFx(canvas, specs) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, raf = 0, last = 0, run = true;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = () => { w = window.innerWidth; h = window.innerHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); window.addEventListener('resize', size);

  const noise = document.createElement('canvas'); noise.width = noise.height = 160;
  const nctx = noise.getContext('2d');
  let nAcc = 0;

  const make = (sp, i, init) => {
    const t = sp.t, c = sp.c || '255,255,255', p = { sp, t, c, x: rnd(0, w), y: init ? rnd(0, h) : rnd(-20, 0) };
    switch (t) {
      case 'ash': Object.assign(p, { vx: rnd(-6, 10), vy: rnd(14, 34), r: rnd(0.7, 2.2), a: rnd(0.12, 0.42), ph: rnd(0, 6.3), sw: rnd(8, 22) }); break;
      case 'dust': Object.assign(p, { y: rnd(0, h), vx: rnd(18, 50), vy: rnd(-4, 4), r: rnd(0.6, 1.6), a: rnd(0.1, 0.35) }); break;
      case 'embers': Object.assign(p, { y: init ? rnd(0, h) : h + 10, vx: rnd(-10, 10), vy: -rnd(24, 70), r: rnd(1.2, 3.2), a: rnd(0.4, 0.9), ph: rnd(0, 6.3), sw: rnd(6, 18), life: rnd(0.55, 1) }); break;
      case 'motes': Object.assign(p, { y: rnd(0, h), vx: rnd(-8, 8), vy: rnd(-14, 6), r: rnd(1.6, 4), a: rnd(0.25, 0.8), ph: rnd(0, 6.3), sp2: rnd(0.8, 2) }); break;
      case 'sparks': Object.assign(p, { x: w * rnd(0.55, 1), y: h * rnd(0.55, 0.95), vx: rnd(-90, 60), vy: -rnd(80, 260), g: 340, life: 0, max: rnd(0.8, 1.7), r: rnd(1, 2) }); p.life = rnd(0, p.max); break;
      case 'stars': Object.assign(p, { y: rnd(0, h), r: rnd(0.5, 1.6), ph: rnd(0, 6.3), sp2: rnd(0.6, 2.4), a: rnd(0.3, 0.9) }); break;
      case 'rain': Object.assign(p, { y: rnd(-h, h), vx: -120, vy: rnd(620, 900), len: rnd(10, 22), a: rnd(0.1, 0.32) }); break;
      case 'confetti': Object.assign(p, { c: PALETTE[i % PALETTE.length], vx: rnd(-14, 14), vy: rnd(40, 100), w: rnd(4, 8), hh: rnd(6, 12), rot: rnd(0, 6.3), vr: rnd(-3, 3), ph: rnd(0, 6.3), a: rnd(0.55, 0.9) }); break;
      case 'petals': Object.assign(p, { vx: rnd(-10, 22), vy: rnd(22, 52), r: rnd(3, 6), rot: rnd(0, 6.3), vr: rnd(-1.5, 1.5), ph: rnd(0, 6.3), a: rnd(0.35, 0.75) }); break;
      case 'sparkle': Object.assign(p, { x: rnd(0, w), y: rnd(0, h), age: rnd(0, 3), max: rnd(1.6, 3.4), r: rnd(4, 9) }); break;
      case 'fog': Object.assign(p, { x: rnd(-100, w), y: rnd(h * 0.25, h), r: rnd(160, 320), vx: rnd(6, 16) * (Math.random() < 0.5 ? -1 : 1), a: rnd(0.05, 0.11) }); break;
      default: break;
    }
    return p;
  };
  const ps = [];
  specs.forEach((sp, si) => { if (sp.t === 'static') return; for (let i = 0; i < sp.n; i++) ps.push(make(sp, i, true)); });
  const staticSpec = specs.find((s) => s.t === 'static');
  let shoot = null, shootT = rnd(2, 6);

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (!run) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    ctx.clearRect(0, 0, w, h);
    const tm = now / 1000;
    for (const p of ps) {
      switch (p.t) {
        case 'ash':
          p.y += p.vy * dt; p.x += (p.vx + Math.sin(tm + p.ph) * p.sw * 0.4) * dt;
          if (p.y > h + 6) { p.y = -6; p.x = rnd(0, w); } if (p.x > w + 6) p.x = -6; if (p.x < -6) p.x = w + 6;
          ctx.globalAlpha = p.a; ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); break;
        case 'dust':
          p.x += p.vx * dt; p.y += p.vy * dt; if (p.x > w + 4) { p.x = -4; p.y = rnd(0, h); }
          ctx.globalAlpha = p.a; ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.fillRect(p.x, p.y, p.r * 1.6, p.r); break;
        case 'embers': {
          p.y += p.vy * dt; p.x += (p.vx + Math.sin(tm * 1.7 + p.ph) * p.sw) * dt; p.life -= dt * 0.12;
          if (p.y < -12 || p.life <= 0) Object.assign(p, make(p.sp, 0, false), { y: h + 8, x: rnd(0, w) });
          const fl = 0.6 + 0.4 * Math.sin(tm * 9 + p.ph);
          ctx.globalAlpha = p.a * fl * Math.min(1, p.life * 2); const s = p.r * 7; ctx.drawImage(sprite(p.c, 32), p.x - s / 2, p.y - s / 2, s, s); break; }
        case 'motes': {
          p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10; if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
          ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(tm * p.sp2 + p.ph)); const s = p.r * 6; ctx.drawImage(sprite(p.c, 32), p.x - s / 2, p.y - s / 2, s, s); break; }
        case 'sparks':
          p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.life > p.max || p.y > h + 10) Object.assign(p, make(p.sp, 0, false));
          ctx.globalAlpha = Math.max(0, 1 - p.life / p.max); ctx.strokeStyle = 'rgb(' + p.c + ')'; ctx.lineWidth = p.r; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke(); break;
        case 'stars':
          ctx.globalAlpha = p.a * (0.4 + 0.6 * Math.abs(Math.sin(tm * p.sp2 + p.ph))); ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); break;
        case 'rain':
          p.y += p.vy * dt; p.x += p.vx * dt; if (p.y > h + 20) { p.y = -20; p.x = rnd(0, w + 120); }
          ctx.globalAlpha = p.a; ctx.strokeStyle = 'rgb(' + p.c + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 0.02, p.y - p.len); ctx.stroke(); break;
        case 'confetti':
          p.y += p.vy * dt; p.x += (p.vx + Math.sin(tm * 2 + p.ph) * 16) * dt; p.rot += p.vr * dt; if (p.y > h + 14) { p.y = -14; p.x = rnd(0, w); }
          ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.abs(Math.cos(p.rot * 1.3)) * 0.8 + 0.2); ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.fillRect(-p.w / 2, -p.hh / 2, p.w, p.hh); ctx.restore(); break;
        case 'petals':
          p.y += p.vy * dt; p.x += (p.vx + Math.sin(tm * 1.3 + p.ph) * 22) * dt; p.rot += p.vr * dt; if (p.y > h + 10) { p.y = -10; p.x = rnd(0, w); }
          ctx.save(); ctx.globalAlpha = p.a; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.283); ctx.fill(); ctx.restore(); break;
        case 'sparkle': {
          p.age += dt; if (p.age > p.max) { p.age = 0; p.x = rnd(0, w); p.y = rnd(0, h); p.max = rnd(1.6, 3.4); }
          const k = Math.sin((p.age / p.max) * Math.PI), s = p.r * k;
          ctx.globalAlpha = 0.6 * k; ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.beginPath();
          ctx.moveTo(p.x, p.y - s); ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s); ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s); ctx.fill(); break; }
        case 'fog': {
          p.x += p.vx * dt; if (p.x > w + p.r) p.x = -p.r; if (p.x < -p.r) p.x = w + p.r;
          ctx.globalAlpha = p.a; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, 'rgba(' + p.c + ',1)'); g.addColorStop(1, 'rgba(' + p.c + ',0)'); ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); break; }
        default: break;
      }
    }
    if (specs.some((s) => s.t === 'stars')) {
      shootT -= dt;
      if (shootT <= 0 && !shoot) { shoot = { x: rnd(w * 0.2, w), y: rnd(0, h * 0.3), vx: -rnd(380, 560), vy: rnd(160, 260), life: 0 }; shootT = rnd(4, 9); }
      if (shoot) { shoot.life += dt; shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; ctx.globalAlpha = Math.max(0, 1 - shoot.life / 0.8); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * 0.08, shoot.y - shoot.vy * 0.08); ctx.stroke(); if (shoot.life > 0.8) shoot = null; }
    }
    if (staticSpec) {
      nAcc += dt;
      if (nAcc > 0.09) { nAcc = 0; const id = nctx.createImageData(160, 160), d = id.data; for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } nctx.putImageData(id, 0, 0); }
      ctx.globalAlpha = staticSpec.a || 0.04; ctx.drawImage(noise, 0, 0, w, h);
    }
    ctx.globalAlpha = 1;
  };
  raf = requestAnimationFrame(frame);
  const vis = () => { run = !document.hidden; };
  document.addEventListener('visibilitychange', vis);
  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis); };
}
