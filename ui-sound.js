// Tiny synthesized UI sounds (Web Audio, no files). Off until the first user gesture; mute persists in localStorage.
const K = 'vl-sound';
const S = { ctx: null, out: null, noise: null, on: true, last: {}, hoverEl: null };
try { S.on = localStorage.getItem(K) !== '0'; } catch (e) {}

function ctx() {
  if (!S.ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    S.ctx = new C(); S.out = S.ctx.createGain(); S.out.gain.value = .55; S.out.connect(S.ctx.destination);
    const n = S.ctx.sampleRate, b = S.ctx.createBuffer(1, n, n), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    S.noise = b;
  }
  if (S.ctx.state === 'suspended') S.ctx.resume();
  return S.ctx;
}
function env(g, t, a, dur, v) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
function tone(f0, f1, dur, type, v, dl = 0) {
  const c = S.ctx, t = c.currentTime + dl, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  env(g, t, Math.min(.006, dur / 4), dur, v); o.connect(g).connect(S.out); o.start(t); o.stop(t + dur + .02);
}
function air(f0, f1, dur, v, q = 1.2, dl = 0) {
  const c = S.ctx, t = c.currentTime + dl, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = S.noise; f.type = 'bandpass'; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, dur * .35, dur, v); s.connect(f).connect(g).connect(S.out); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
}
const SOUNDS = {
  tap() { tone(1500, 720, .045, 'sine', .11); air(4200, 3800, .014, .025, 2); },
  tapSoft() { tone(1250, 820, .035, 'sine', .045); },
  wheel() { tone(2700, 1900, .012, 'triangle', .06); tone(230, 140, .05, 'sine', .09); },
  play() { tone(523, 523, .08, 'sine', .09); tone(784, 784, .14, 'sine', .08, .06); },
  pause() { tone(784, 784, .08, 'sine', .08); tone(523, 523, .14, 'sine', .07, .06); },
  open() { air(320, 2300, .26, .06, 1.1); tone(440, 660, .14, 'sine', .035, .04); },
  close() { air(2100, 300, .22, .05, 1.1); tone(620, 420, .12, 'sine', .03); },
  select() { tone(600, 1020, .07, 'triangle', .07); },
  flip() { air(700, 2400, .12, .04, 1.4); tone(900, 1300, .05, 'sine', .04, .05); },
  lift() { air(900, 1700, .14, .024, 1.6); tone(520, 660, .09, 'sine', .018, .02); },
  tick() { tone(2600, 2200, .018, 'sine', .035); },
  paper() { air(2400, 3600, .07, .022, .8); },
  slide() { air(600, 1250, .11, .022, 1.2); },
  swipe() { air(1500, 600, .16, .026, 1.3); },
  whoosh() { air(220, 1900, .32, .055, .9); air(1900, 380, .34, .045, .9, .3); tone(110, 70, .3, 'sine', .04); },
  toggle() { tone(880, 880, .05, 'sine', .08); tone(1320, 1320, .07, 'sine', .07, .055); }
};
export function play(name, gap = 45) {
  if (!S.on || !SOUNDS[name]) return;
  const now = performance.now(); if (S.last[name] && now - S.last[name] < gap) return; S.last[name] = now;
  if (!ctx()) return;
  try { SOUNDS[name](); } catch (e) {}
}
export function setSound(on) { S.on = !!on; try { localStorage.setItem(K, on ? '1' : '0'); } catch (e) {} if (on) { ctx(); play('toggle'); } }
export function soundOn() { return S.on; }

function nameFor(t) {
  if (!t || !t.closest) return null;
  const tagged = t.closest('[data-sound]');
  if (tagged) return tagged.dataset.sound === 'none' ? null : tagged.dataset.sound;
  if (t.closest('button, a[href], [role="button"], [data-cursor], [data-proto-step], [data-proto-dot], label, summary, input[type="checkbox"], input[type="radio"]')) return 'tap';
  let el = t;
  for (let k = 0; el && k < 4; k++, el = el.parentElement) { if (el.nodeType === 1 && getComputedStyle(el).cursor === 'pointer') return 'tap'; }
  return null;
}
let wired = false;
export function wireSound() {
  if (wired) return; wired = true;
  document.addEventListener('pointerdown', e => { if (e.button > 0) return; const n = nameFor(e.target); if (n) play(n); }, true);
  document.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const n = nameFor(e.target); if (n) play(n); }, true);
  const GAP = { lift: 220, slide: 90, paper: 80, tick: 60 };
  document.addEventListener('pointerover', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const z = e.target && e.target.closest ? e.target.closest('[data-sound-hover]') : null;
    if (z === S.hoverEl) return; S.hoverEl = z;
    if (z && S.ctx) { const n = z.dataset.soundHover; play(n, GAP[n] || 150); }
  }, true);
}
