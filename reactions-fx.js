const reduce = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
let layer = null;

function getLayer() {
  if (layer && layer.isConnected) return layer;
  layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(layer);
  return layer;
}

function fly(L, el, frames, T, easing) {
  L.appendChild(el);
  const a = el.animate(frames, { duration: T, easing: easing || 'linear', fill: 'forwards' });
  a.onfinish = () => el.remove();
  a.oncancel = () => el.remove();
}

export function pop(el) {
  if (!el || !el.animate || reduce()) return;
  el.animate([
    { transform: 'scale(1) rotate(0deg)' },
    { transform: 'scale(.7) rotate(-14deg)', offset: .2 },
    { transform: 'scale(1.34) rotate(10deg)', offset: .52 },
    { transform: 'scale(.94) rotate(-4deg)', offset: .76 },
    { transform: 'scale(1) rotate(0deg)' }
  ], { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

export function roll(el) {
  if (!el || !el.animate || reduce()) return;
  el.animate([{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)' });
}

// Pixel confetti from the reaction icon: squares, fluttering strips and mini icons (CSS-masked SVG).
export function burst(btn, opts = {}) {
  if (!btn || reduce()) return;
  const colors = opts.colors && opts.colors.length ? opts.colors : ['#A9CBFF'];
  const big = opts.big !== false, mask = opts.mask || '';
  const anchor = btn.querySelector('[data-rx-icon]') || btn;
  const r = anchor.getBoundingClientRect();
  const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
  const L = getLayer();

  const ring = document.createElement('i');
  ring.style.cssText = `position:absolute;left:${ox - 32}px;top:${oy - 32}px;width:64px;height:64px;border-radius:50%;border:3px solid ${colors[0]};box-sizing:border-box`;
  fly(L, ring, [{ transform: 'scale(.35)', opacity: .9 }, { transform: 'scale(2.5)', opacity: 0 }], 650, 'cubic-bezier(.2,.8,.2,1)');

  const N = big ? 40 : 14;
  for (let i = 0; i < N; i++) {
    const q = Math.random();
    const icon = !!mask && q < (big ? .2 : .32);
    const strip = !icon && q > .76;
    const w = icon ? Math.round(rnd(14, 24)) : pick([4, 5, 6, 7, 8]);
    const h = icon ? w : strip ? Math.round(w * 2.4) : w;
    const p = document.createElement('i');
    let css = `position:absolute;left:${(ox - w / 2).toFixed(1)}px;top:${(oy - h / 2).toFixed(1)}px;width:${w}px;height:${h}px;background:${pick(colors)};will-change:transform,opacity`;
    if (icon) css += `;-webkit-mask:url("${mask}") center/contain no-repeat;mask:url("${mask}") center/contain no-repeat`;
    p.style.cssText = css;

    const ang = rnd(-Math.PI * .94, -Math.PI * .06);
    const sp = rnd(5, big ? 14 : 9);
    let x = 0, y = 0, vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp - (big ? 2 : 1);
    const g = rnd(.3, .46), drag = .968, spin = rnd(-14, 14) * (icon ? .35 : 1), wob = rnd(.15, .35);
    const T = rnd(1050, 1700), ticks = Math.round(T / 16.7), every = Math.max(1, Math.round(ticks / 22));
    const frames = [];
    for (let k = 0; k <= ticks; k++) {
      if (k % every === 0 || k === ticks) {
        const life = k / ticks, s = icon ? 1 - life * .25 : 1, f = strip ? Math.cos(k * wob) : 1;
        frames.push({ offset: life, transform: `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(spin * k).toFixed(0)}deg) scale(${s.toFixed(2)},${(s * f).toFixed(2)})`, opacity: life < .72 ? 1 : Math.max(0, 1 - (life - .72) / .28) });
      }
      vx *= drag; vy = vy * drag + g; x += vx; y += vy;
    }
    fly(L, p, frames, T);
  }

  if (opts.plus) {
    const t = document.createElement('span');
    t.textContent = '+1';
    t.style.cssText = `position:absolute;left:${ox}px;top:${oy - 40}px;font:500 16px 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.04em;color:${colors[0]};white-space:nowrap`;
    fly(L, t, [{ transform: 'translate(-50%,10px)', opacity: 0 }, { transform: 'translate(-50%,-6px)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-52px)', opacity: 0 }], 1150, 'cubic-bezier(.2,.8,.2,1)');
  }
}
