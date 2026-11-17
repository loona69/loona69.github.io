/* About-page intro.
   The six "about me" cards hang in the air around the greeting, drift for a beat,
   then fly along shallow arcs into their slots while the greeting moves to its place
   and the rest of the column comes in.

   Everything is baked into linear WAAPI keyframes (transform + opacity only), so the
   whole sequence runs on the compositor and stays smooth while the page is still booting.
   Marked up in index.html with data-intro="card|title|text". */

const T_FLOAT = 1850;   // cards hang until here
const D_FLY = 1150;     // one card's flight
const STEP = 1000 / 60;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const expoOut = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const TAU = Math.PI * 2;

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const fx = t => ((ax * t + bx) * t + cx) * t, fy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (fx(t) - x) / d; }
    return fy(clamp(t, 0, 1));
  };
}
const fly = bezier(.62, 0, .12, 1);     // leaves the hover slowly, lands softly
const settle = bezier(.16, 1, .3, 1);

/* where each card hangs (viewport fractions), its tilt and its depth */
const WIDE = {
  photo: [.14, .29], playlist: [.40, .22], map: [.66, .23],
  books: [.88, .52], stack: [.64, .80], offscreen: [.29, .79]
};
const TALL = {
  photo: [.19, .21], map: [.52, .27], books: [.82, .20],
  offscreen: [.20, .77], stack: [.52, .74], playlist: [.82, .79]
};
const TILT = { photo: -8, playlist: 6, map: -5, books: 7, stack: -6, offscreen: 9 };
const DEPTH = { photo: 1.06, playlist: .92, map: 1, books: .97, stack: 1.04, offscreen: .9 };

const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/* take the element away from the scroll-reveal system in portfolio-fx.js */
function own(el) { el.__rv = 1; if (el.__rva) { try { el.__rva.cancel(); } catch (e) {} el.__rva = null; } }

function ready() {
  return new Promise(res => {
    let n = 0;
    const tick = () => {
      if (document.querySelector('[data-intro="card"]') || ++n > 90) res(); else requestAnimationFrame(tick);
    };
    tick();
  }).then(() => Promise.race([
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 700))
  ])).then(() => new Promise(r => requestAnimationFrame(() => r())));
}

function textRect(el) {
  try { const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect(); if (b.width > 0) return b; } catch (e) {}
  return el.getBoundingClientRect();
}

export async function playIntro() {
  const root = document.documentElement;
  const release = () => root.classList.remove('vl-intro-wait');
  try {
    await ready();
    /* the 4s failsafe already showed the page (very slow boot): don't yank it away again */
    if (!root.classList.contains('vl-intro-wait')) return;
    const cards = [...document.querySelectorAll('[data-intro="card"]')];
    const title = document.querySelector('[data-intro="title"]');
    const texts = [...document.querySelectorAll('[data-intro="text"]')];
    if (!cards.length || !title || window.scrollY > 80 || document.hidden) { release(); return; }
    const all = [title, ...texts, ...cards];
    all.forEach(own);

    if (reduced()) {
      const fades = all.map(el => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out', fill: 'backwards' }));
      release();
      await Promise.allSettled(fades.map(a => a.finished));
      return;
    }
    await run(cards, title, texts, release);
  } catch (e) {
    console.warn('[portfolio] intro', e);
    release();
  }
}

function run(cards, title, texts, release) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const wide = vw / vh >= 1.15;
  const C = { x: vw / 2, y: vh * .52 };

  /* greeting: centred and enlarged */
  const tb = title.getBoundingClientRect(), tt = textRect(title);
  const tO = { x: tb.left + tb.width / 2, y: tb.top + tb.height / 2 };   // transform origin
  const tP = { x: tt.left + tt.width / 2, y: tt.top + tt.height / 2 };   // centre of the words
  const tS = clamp(Math.min(1.5, (vw * .84) / tt.width, (vh * .28) / tt.height), .85, 1.5);
  const tBox = { x: C.x, y: C.y, w: tt.width * tS + 36, h: tt.height * tS + 28 };

  /* cards: hanging pose */
  const slots = wide ? WIDE : TALL;
  const items = cards.map((el, i) => {
    const r = el.getBoundingClientRect(), id = el.dataset.introId;
    const slot = slots[id] || [.2 + .6 * (i % 3) / 2, i < 3 ? .22 : .78];
    const s = clamp(Math.min((wide ? .165 : .3) * vw / r.width, (wide ? .34 : .2) * vh / r.height), .16, .62) * (DEPTH[id] || 1);
    const it = {
      el, id, i,
      F: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      P: { x: slot[0] * vw, y: slot[1] * vh },
      w: r.width * s, h: r.height * s, s, top: r.top, left: r.left,
      rot: TILT[id] != null ? TILT[id] : (i % 2 ? 6 : -6)
    };
    /* keep it clear of the greeting, and mostly on screen */
    let ux = it.P.x - C.x, uy = it.P.y - C.y; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    if (Math.abs(uy) < .35) { uy = uy < 0 ? -.35 : .35; }
    for (let k = 0; k < 80; k++) {
      const hit = Math.abs(it.P.x - tBox.x) < (it.w + tBox.w) / 2 && Math.abs(it.P.y - tBox.y) < (it.h + tBox.h) / 2;
      if (!hit) break;
      it.P.x += ux * 6; it.P.y += uy * 6;
    }
    it.P.x = clamp(it.P.x, it.w * .34, vw - it.w * .34);
    it.P.y = clamp(it.P.y, it.h * .5 + 14, vh - it.h * .5 - 14);
    return it;
  });

  /* flight order: top of the page first */
  [...items].sort((a, b) => (a.top - b.top) || (a.left - b.left)).forEach((it, k) => { it.t0 = T_FLOAT + 90 + k * 65; });
  items.forEach((it, k) => {
    const dx = it.F.x - it.P.x, dy = it.F.y - it.P.y, d = Math.hypot(dx, dy) || 1;
    const side = k % 2 ? 1 : -1;
    it.nx = -dy / d * side; it.ny = dx / d * side;          // normal to the path
    it.arc = Math.min(96, d * .16);
    it.twist = side * 5;
    it.pop = 80 + k * 60;                                    // entrance stagger
    it.out = { x: (it.P.x - C.x) * .14, y: (it.P.y - C.y) * .14 + 46 };
    it.bob = { ax: 5 + (k * 3) % 5, ay: 11 + (k * 5) % 7, ar: 1.4 + (k % 3) * .5, px: 3.1 + (k % 3) * .45, py: 2.5 + (k % 4) * .3, pr: 3.4 + (k % 2) * .6, ph: k * 1.37 };
    it.drift = { x: side * (18 + (k % 3) * 7), y: -12 - (k % 2) * 12 };
  });

  const tTitle = { t0: T_FLOAT, d: 1100 };
  const textT0 = T_FLOAT + 760, textD = 820, textGap = 80;
  const T = Math.ceil(Math.max(...items.map(it => it.t0 + D_FLY), textT0 + (texts.length - 1) * textGap + textD) + 40);
  const frames = Math.ceil(T / STEP);

  const cardKF = items.map(() => []), titleKF = [], textKF = texts.map(() => []);
  for (let f = 0; f <= frames; f++) {
    const t = Math.min(T, f * STEP), offset = f / frames, sec = t / 1000;

    items.forEach((it, k) => {
      const pin = clamp((t - it.pop) / 760, 0, 1), ep = expoOut(pin);
      const e = fly(clamp((t - it.t0) / D_FLY, 0, 1)), air = 1 - e, b = it.bob;
      const live = clamp((t - it.pop) / 500, 0, 1);            // bob fades in with the card
      const dr = clamp(t / T_FLOAT, 0, 1.4) - .5;
      const px = it.P.x + it.out.x * (1 - ep) + (Math.sin(TAU * sec / b.px + b.ph) * b.ax + it.drift.x * dr) * live;
      const py = it.P.y + it.out.y * (1 - ep) + (Math.sin(TAU * sec / b.py + b.ph * 1.7) * b.ay + it.drift.y * dr) * live;
      const bend = Math.sin(Math.PI * e) * it.arc;
      const x = lerp(px, it.F.x, e) + it.nx * bend - it.F.x;
      const y = lerp(py, it.F.y, e) + it.ny * bend - it.F.y;
      const rot = (it.rot * (1 + .7 * (1 - ep)) + Math.sin(TAU * sec / b.pr + b.ph) * b.ar * live) * air + Math.sin(Math.PI * e) * it.twist;
      const sc = Math.pow(it.s * (.62 + .38 * ep), air);
      cardKF[k].push({ offset, opacity: clamp(pin * 2.4, 0, 1), transform: `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})` });
    });

    {
      const ep = settle(clamp(t / 760, 0, 1)), e = fly(clamp((t - tTitle.t0) / tTitle.d, 0, 1));
      const s = Math.pow(tS * (.94 + .06 * ep), 1 - e);
      const cx = lerp(C.x, tP.x, e), cy = lerp(C.y + 26 * (1 - ep) + Math.sin(TAU * sec / 3.2) * 4 * (1 - e), tP.y, e);
      const x = cx - tO.x - s * (tP.x - tO.x), y = cy - tO.y - s * (tP.y - tO.y);
      titleKF.push({ offset, opacity: clamp(t / 420, 0, 1), transform: `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${s.toFixed(4)})` });
    }

    texts.forEach((el, j) => {
      const p = clamp((t - textT0 - j * textGap) / textD, 0, 1), e = settle(p);
      textKF[j].push({ offset, opacity: clamp(p * 2.2, 0, 1), transform: `translate3d(0,${(28 * (1 - e)).toFixed(2)}px,0)` });
    });
  }

  /* the air: the palette wash the page transitions use, draining as the cards land */
  const wash = document.createElement('div');
  wash.setAttribute('aria-hidden', 'true');
  wash.style.cssText = 'position:fixed;inset:-12%;z-index:-1;pointer-events:none;background:radial-gradient(60% 80% at 18% 22%, var(--c1,#CDB8F7) 0%, transparent 62%), radial-gradient(60% 80% at 82% 28%, var(--c0,#A9CBFF) 0%, transparent 62%), radial-gradient(70% 90% at 50% 105%, var(--c2,#B4EBD3) 0%, transparent 62%), radial-gradient(50% 60% at 92% 92%, var(--c3,#F8C9B4) 0%, transparent 62%), var(--c4,#F3EFC9)';
  document.body.appendChild(wash);

  const opt = { duration: T, easing: 'linear', fill: 'both' };
  const anims = [];
  const wA = T_FLOAT / T, wB = Math.min(1, (T_FLOAT + 1050) / T);
  anims.push(wash.animate([
    { offset: 0, opacity: 0, transform: 'scale(1.14) rotate(5deg)' },
    { offset: Math.min(wA * .3, .12), opacity: .92 },
    { offset: wA, opacity: .92, easing: 'cubic-bezier(.5,0,.3,1)' },
    { offset: wB, opacity: 0 },
    { offset: 1, opacity: 0, transform: 'scale(1) rotate(0deg)' }
  ], opt));
  items.forEach((it, k) => {
    anims.push(it.el.animate(cardKF[k], opt));
    /* lifted off the page while in the air */
    const a = it.t0 / T, b = Math.min(1, (it.t0 + D_FLY) / T);
    const up = '0 44px 80px -24px rgba(20,20,30,.34)', down = '0 0px 0px 0px rgba(20,20,30,0)';
    anims.push(it.el.animate([
      { offset: 0, boxShadow: up }, { offset: a, boxShadow: up, easing: 'cubic-bezier(.6,0,.2,1)' },
      { offset: b, boxShadow: down }, { offset: 1, boxShadow: down }
    ], { duration: T, fill: 'both' }));
  });
  anims.push(title.animate(titleKF, opt));
  texts.forEach((el, j) => anims.push(el.animate(textKF[j], opt)));
  release();

  /* any input fast-forwards: nobody has to wait for it */
  const hurry = () => anims.forEach(a => { try { a.updatePlaybackRate(7); } catch (e) {} });
  const evs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  evs.forEach(n => window.addEventListener(n, hurry, { passive: true, once: true }));

  let over = false;
  const end = () => {
    if (over) return; over = true;
    evs.forEach(n => window.removeEventListener(n, hurry));
    anims.forEach(a => { try { a.cancel(); } catch (e) {} });
    wash.remove();
  };
  setTimeout(end, T + 2500);
  return Promise.allSettled(anims.map(a => a.finished)).then(end);
}
