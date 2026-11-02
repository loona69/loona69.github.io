// Visual effects engine for Portfolio.dc.html
import { play, setSound, soundOn, wireSound } from './ui-sound.js';
const BAYER = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21].map(v => (v + 0.5) / 64);
const rgbCache = new Map();
function rgb255(h) {
  if (!h) return [169, 203, 255];
  if (rgbCache.has(h)) return rgbCache.get(h);
  let s = String(h).replace('#', '').trim();
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const n = parseInt(s, 16);
  const out = isNaN(n) ? [169, 203, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  rgbCache.set(h, out);
  return out;
}
const rgb01 = h => rgb255(h).map(v => v / 255);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const canHover = () => !window.matchMedia || window.matchMedia('(hover: hover)').matches;

const S = {
  pal: { c: ['#A9CBFF', '#CDB8F7', '#B4EBD3', '#F8C9B4', '#F3EFC9'].map(rgb01), base: rgb01('#0B0B0C') },
  mouse: { x: -9999, y: -9999, active: false, last: 0 },
  meshes: new Set(), shapes: new Set(), photos: new Set(), icons: new Set(), magnets: new Set(), palDirty: true, cur: null, raf: 0
};

/* ---------- WebGL mesh gradient ---------- */
const VERT = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;uniform vec2 r;uniform float t;uniform vec3 c0,c1,c2,c3,c4,base,mo;uniform float mode;
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);}
float sn(vec3 q){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
vec3 i=floor(q+dot(q,C.yyy));vec3 x0=q-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=m289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 nm=1.79284291400159-.85373472095314*vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));p0*=nm.x;p1*=nm.y;p2*=nm.z;p3*=nm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float wt(vec2 a,vec2 b){vec2 d=a-b;return 1./pow(dot(d,d)+.035,1.7);}
void main(){
float a=r.x/r.y;vec2 p=vec2(v.x*a,v.y);float T=t*.07;
vec2 w=p+.3*vec2(sn(vec3(p*1.05,T)),sn(vec3(p*1.05+7.3,T+3.)));
vec2 k0=vec2(a*(.22+.14*sin(T*1.7)),.78+.14*cos(T*1.3));
vec2 k1=vec2(a*(.8+.12*cos(T*1.1)),.72+.18*sin(T*1.9));
vec2 k2=vec2(a*(.52+.22*sin(T*.9+1.)),.3+.16*sin(T*1.4));
vec2 k3=vec2(a*(.14+.1*cos(T*1.3+2.)),.18+.12*cos(T*1.2));
vec2 k4=vec2(a*(.9+.07*sin(T*1.6+3.)),.16+.14*cos(T*.8));
float w0=wt(w,k0),w1=wt(w,k1),w2=wt(w,k2),w3=wt(w,k3),w4=wt(w,k4);
float wm=mo.z*1.6*wt(w,vec2(mo.x*a,mo.y));
vec3 col=(c0*(w0+wm)+c1*w1+c2*w2+c3*w3+c4*w4)/(w0+w1+w2+w3+w4+wm);
col+=.03*sn(vec3(p*3.,T*2.));
if(mode>1.5){float dx=(v.x-.78)*a;float dy=v.y-.04;float d=dx*dx+dy*dy;col=mix(base,col,exp(-d*2.6)*.92);}
else if(mode>.5){
vec2 q=vec2((v.x-.5)*a,v.y);float R=max(a,1.)*1.25;float d=length(q-vec2(0.,.3-R))-R;
float sx=(v.x-.5)*2.4;float sy=(1.-v.y)*1.5;
vec3 sky=base+vec3(.05)*exp(-sx*sx-sy*sy);
vec3 o=mix(sky,col,exp(-max(d,0.)*5.)*.95);
vec3 ic=mix(base*.6,col*.85,exp(min(d,0.)*14.)*.55);
col=mix(ic,o,step(0.,d))+exp(-abs(d)*220.)*.55;}
gl_FragColor=vec4(col,1.);}`;

function fallbackMesh(cv) {
  cv.style.background = 'radial-gradient(60% 80% at 20% 20%, var(--c1,#CDB8F7), transparent 60%), radial-gradient(60% 80% at 80% 30%, var(--c0,#A9CBFF), transparent 60%), radial-gradient(70% 90% at 50% 100%, var(--c2,#B4EBD3), transparent 60%), var(--c4,#F3EFC9)';
}
function initMesh(cv) {
  if (cv.__fx) return; cv.__fx = 1;
  let gl = null;
  try { gl = cv.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, alpha: false }); } catch (e) {}
  if (!gl) { fallbackMesh(cv); return; }
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('[fx] shader', gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, mk(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn('[fx] link', gl.getProgramInfoLog(pr)); fallbackMesh(cv); return; }
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['r', 't', 'c0', 'c1', 'c2', 'c3', 'c4', 'base', 'mo', 'mode'].forEach(n => { U[n] = gl.getUniformLocation(pr, n); });
  const m = { cv, gl, U, mode: { full: 0, horizon: 1, spot: 2 }[cv.dataset.mesh] || 0, mx: .5, my: .5, tx: .5, ty: .5, mz: 0, tz: 0, vis: true, seed: Math.random() * 40, drawn: false };
  const fit = () => { const s = +(cv.dataset.scale || .5); const w = Math.max(2, Math.round(cv.clientWidth * s)), h = Math.max(2, Math.round(cv.clientHeight * s)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; m.drawn = false; } };
  m.ro = new ResizeObserver(fit); m.ro.observe(cv); fit();
  m.io = new IntersectionObserver(es => { m.vis = es[es.length - 1].isIntersecting; }, { rootMargin: '120px' }); m.io.observe(cv);
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); m.dead = true; });
  S.meshes.add(m);
}
function drawMesh(m, t) {
  const { gl, U, cv } = m, P = S.pal;
  m.mx += (m.tx - m.mx) * .07; m.my += (m.ty - m.my) * .07; m.mz += (m.tz - m.mz) * .05;
  gl.viewport(0, 0, cv.width, cv.height);
  gl.uniform2f(U.r, cv.width, cv.height); gl.uniform1f(U.t, t + m.seed);
  gl.uniform3fv(U.c0, P.c[0]); gl.uniform3fv(U.c1, P.c[1]); gl.uniform3fv(U.c2, P.c[2]); gl.uniform3fv(U.c3, P.c[3]); gl.uniform3fv(U.c4, P.c[4]);
  gl.uniform3fv(U.base, P.base); gl.uniform3f(U.mo, m.mx, m.my, m.mz); gl.uniform1f(U.mode, m.mode);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); m.drawn = true;
}
function killMesh(m) {
  try { m.ro.disconnect(); m.io.disconnect(); const ext = m.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) {}
  S.meshes.delete(m);
}

/* ---------- Dithered primitives (role cards) ---------- */
function lit(nx, ny, nz, L, H) {
  const dif = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
  const sp = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]);
  return .05 + dif * .85 + Math.pow(sp, 28) * .5;
}
function inQuad(x, y, q) {
  let sign = 0;
  for (let i = 0; i < 8; i += 2) {
    const x1 = q[i], y1 = q[i + 1], x2 = q[(i + 2) % 8], y2 = q[(i + 3) % 8];
    const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
    if (c !== 0) { const sg = c > 0 ? 1 : -1; if (!sign) sign = sg; else if (sg !== sign) return false; }
  }
  return true;
}
function initShape(cv) {
  if (cv.__fx) return; cv.__fx = 1;
  const d = { cv, ctx: cv.getContext('2d'), kind: cv.dataset.ditherShape, px: +(cv.dataset.px || 3), vis: true, lx: .4, ly: -.6, stars: [], img: null };
  const fit = () => {
    const w = Math.max(8, Math.round(cv.clientWidth / d.px)), h = Math.max(8, Math.round(cv.clientHeight / d.px));
    if (cv.width !== w || cv.height !== h || !d.img) {
      cv.width = w; cv.height = h; d.img = d.ctx.createImageData(w, h); d.stars = [];
      const n = Math.round(w * h * .01);
      for (let i = 0; i < n; i++) d.stars.push([Math.random() * w | 0, Math.random() * h | 0, Math.random() * 6.28, .4 + Math.random() * .6]);
    }
  };
  d.ro = new ResizeObserver(fit); d.ro.observe(cv); fit();
  d.io = new IntersectionObserver(es => { d.vis = es[es.length - 1].isIntersecting; }); d.io.observe(cv);
  S.shapes.add(d);
}
function drawShape(d, t) {
  const { cv, img } = d; if (!img) return;
  const W = cv.width, H = cv.height, A = W / H, px = img.data;
  const r = cv.getBoundingClientRect();
  let tx, ty;
  if (S.mouse.active && performance.now() - S.mouse.last < 4000) {
    tx = clamp((S.mouse.x - (r.left + r.width / 2)) / (r.width * .9), -1.2, 1.2);
    ty = clamp((S.mouse.y - (r.top + r.height / 2)) / (r.height * .9), -1.2, 1.2);
  } else { tx = Math.cos(t * .5) * .9; ty = -.55 + Math.sin(t * .5) * .35; }
  d.lx += (tx - d.lx) * .08; d.ly += (ty - d.ly) * .08;
  let ln = Math.hypot(d.lx, d.ly, .75); const L = [d.lx / ln, d.ly / ln, .75 / ln];
  ln = Math.hypot(L[0], L[1], L[2] + 1); const Hh = [L[0] / ln, L[1] / ln, (L[2] + 1) / ln];
  const tint = rgb255(cv.dataset.tint), kind = d.kind;
  const bob = Math.sin(t * .9) * .03;
  const k = .4 + .07 * Math.sin(t * .7), rot = .22 * Math.sin(t * .35), cr = Math.cos(rot), sr = Math.sin(rot);
  const ex = .13 * Math.sin(t * .6), cs = .66, cc = cs * .866;
  const qT = [-ex, -cs - bob, cc, -cs / 2, ex, 0, -cc, -cs / 2], qL = [-cc, -cs / 2, ex, 0, ex, cs, -cc, cs / 2], qR = [ex, 0, cc, -cs / 2, cc, cs / 2, ex, cs];
  const nT = [-ex * .5, -.86, .5], nL = [-.72 - ex * .9, .3, .62], nR = [.72 - ex * .9, .3, .62];
  [nT, nL, nR].forEach(n => { const l = Math.hypot(n[0], n[1], n[2]); n[0] /= l; n[1] /= l; n[2] /= l; });
  const hs = [.5, .8, 1.12].map((h, i) => h * (.92 + .08 * Math.sin(t * 1.1 + i * 1.7)));
  for (let y = 0; y < H; y++) {
    const ny = (y + .5) / H * 2 - 1;
    for (let x = 0; x < W; x++) {
      const nx = ((x + .5) / W * 2 - 1) * A;
      let s = -1;
      if (kind === 'sphere') {
        const dx = nx / .62, dy = (ny - .04 - bob) / .62, dd = dx * dx + dy * dy;
        if (dd < 1) s = lit(dx, dy, Math.sqrt(1 - dd), L, Hh);
      } else if (kind === 'ring') {
        const yy = ny - bob, X = nx * cr + yy * sr, Y = -nx * sr + yy * cr;
        const py = Y / k, rho = Math.sqrt(X * X + py * py) || 1e-4, q = (rho - .56) / .19;
        if (q > -1 && q < 1) {
          const nz = Math.sqrt(1 - q * q), a = q * X / rho, b = q * (py / rho) * k - (1 - k) * nz * .8;
          const l = Math.hypot(a, b, nz) || 1, ra = a * cr - b * sr, rb = a * sr + b * cr;
          s = lit(ra / l, rb / l, nz / l, L, Hh);
        }
      } else if (kind === 'cube') {
        const yy = ny - bob;
        if (nx > -cc && nx < cc && yy > -cs - .05 && yy < cs) {
          let n = null;
          if (inQuad(nx, yy, qT)) n = nT; else if (inQuad(nx, yy, qL)) n = nL; else if (inQuad(nx, yy, qR)) n = nR;
          if (n) { const ao = .86 + .14 * (1 - Math.min(1, Math.hypot(nx - ex, yy) / cs)); s = lit(n[0], n[1], n[2], L, Hh) * ao; }
        }
      } else if (kind === 'bars') {
        const yb = .66, hw = .17, e = hw * .4;
        for (let i = 0; i < 3; i++) {
          const u = (nx - (i - 1) * .5) / hw;
          if (u <= -1 || u >= 1) continue;
          const yt = yb - hs[i], sq = Math.sqrt(1 - u * u), cy = (ny - yt) / e;
          if (cy * cy + u * u <= 1) { s = lit(u * .25, -.92, .3, L, Hh); break; }
          if (ny >= yt && ny <= yb + e * sq) { s = lit(u, 0, sq, L, Hh); break; }
        }
        if (s < 0 && Math.abs(ny - (yb + .16)) < .014 && Math.abs(nx) < .9) s = .5;
      }
      const i = (y * W + x) * 4;
      if (s < 0) { px[i] = 6; px[i + 1] = 6; px[i + 2] = 8; px[i + 3] = 255; continue; }
      const th = BAYER[((y & 7) << 3) + (x & 7)];
      if (s > th) {
        if (s > .72 + th * .28) { px[i] = tint[0]; px[i + 1] = tint[1]; px[i + 2] = tint[2]; }
        else { px[i] = 236; px[i + 1] = 236; px[i + 2] = 232; }
      } else { px[i] = 6; px[i + 1] = 6; px[i + 2] = 8; }
      px[i + 3] = 255;
    }
  }
  for (const st of d.stars) {
    if ((.5 + .5 * Math.sin(t * 1.6 + st[2])) * st[3] > .6) { const i = (st[1] * W + st[0]) * 4; if (px[i] < 20) { px[i] = px[i + 1] = px[i + 2] = 150; } }
  }
  d.ctx.putImageData(img, 0, 0);
}

/* ---------- Dithered photo with colour lens ---------- */
function cover(ctx, img, w, h, fy) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) * fy, dw, dh);
}
function prepLum(ph) {
  const sw = Math.max(4, Math.ceil(ph.W / ph.px)), sh = Math.max(4, Math.ceil(ph.H / ph.px));
  ph.small.width = sw; ph.small.height = sh;
  const sc = ph.small.getContext('2d');
  cover(sc, ph.img, sw, sh, ph.fy);
  const d = sc.getImageData(0, 0, sw, sh).data, lum = new Float32Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    const l = (.299 * d[i * 4] + .587 * d[i * 4 + 1] + .114 * d[i * 4 + 2]) / 255;
    lum[i] = clamp((l - .5) * 1.3 + .52, 0, 1);
  }
  ph.lum = lum; ph.sw = sw; ph.sh = sh; ph.out = sc.createImageData(sw, sh);
}
function initPhoto(cv) {
  if (cv.__fx) return; cv.__fx = 1;
  const ph = { cv, ctx: cv.getContext('2d'), img: new Image(), ready: false, px: +(cv.dataset.px || 2), px0: +(cv.dataset.px || 2), lens: cv.dataset.lens === '1', invert: cv.dataset.lens === 'invert' || cv.dataset.lens === 'pattern', er: 0, ter: 0, ea: 0, tea: 0, ex: 0, ey: 0, fy: +(cv.dataset.fy || .35), mx: 0, my: 0, lr: 0, tlr: 0, e: 0, te: 0, small: document.createElement('canvas'), dDirty: true, cDirty: true, seen: false, W: 0, H: 0, dpr: 1 };
  const fit = () => {
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); ph.dpr = dpr; ph.W = W; ph.H = H;
    if (ph.invert) ph.px = Math.max(1, Math.round(ph.px0 * dpr)) / dpr;
    const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    if (ph.ready) prepLum(ph);
    ph.fullDirty = true; ph.dDirty = ph.cDirty = true;
  };
  ph.img.onload = () => { ph.ready = true; fit(); };
  ph.img.src = cv.dataset.ditherPhoto;
  ph.ro = new ResizeObserver(fit); ph.ro.observe(cv);
  ph.io = new IntersectionObserver(es => {
    const vis = es[es.length - 1].isIntersecting;
    if (vis && !ph.seen) { ph.seen = true; ph.te = 1; if (reduced()) { ph.e = 1; ph.dDirty = true; } }
  }, { threshold: .15 });
  ph.io.observe(cv);
  if (ph.lens) {
    cv.addEventListener('pointermove', ev => { const r = cv.getBoundingClientRect(); ph.mx = ev.clientX - r.left; ph.my = ev.clientY - r.top; ph.tlr = +(cv.dataset.lensR || Math.min(ph.W, ph.H) * .36); ph.cDirty = true; });
    cv.addEventListener('pointerleave', () => { ph.tlr = 0; ph.cDirty = true; });
  }
  if (ph.invert) {
    ph.e = ph.te = 1; ph.sx = ph.sy = 0;
    const pos = ev => { const r = cv.getBoundingClientRect(); ph.mx = ev.clientX - r.left; ph.my = ev.clientY - r.top; };
    const lensR = () => +(cv.dataset.lensR || Math.min(ph.W, ph.H) * .34);
    const setEnc = on => {
      ph.enc = on; ph.tea = on ? 1 : 0; ph.cDirty = true;
      if (on && (ph.ea < .05 || ph.er < 1)) { ph.ex = ph.mx; ph.ey = ph.my; ph.er = 0; ph.ea = 1; ph.ter = Math.hypot(ph.W, ph.H) * 1.75; }
    };
    const stopDwell = () => { clearTimeout(ph.dwellT); ph.dwellT = 0; };
    cv.addEventListener('pointerenter', ev => {
      pos(ev); if (ev.pointerType !== 'mouse') return;
      if (ph.lr < 1) { ph.sx = ph.mx; ph.sy = ph.my; }
      ph.tlr = ph.lastR = lensR(); ph.cDirty = true;
      if (!ph.enc) { stopDwell(); ph.dwellT = setTimeout(() => { ph.dwellT = 0; setEnc(true); }, 4000); }
    });
    cv.addEventListener('pointermove', ev => { pos(ev); if (ev.pointerType === 'mouse') { ph.tlr = ph.lastR = lensR(); ph.cDirty = true; } });
    cv.addEventListener('pointerleave', ev => { if (ev.pointerType !== 'mouse') return; stopDwell(); ph.tlr = 0; setEnc(false); });
    cv.addEventListener('click', ev => { pos(ev); stopDwell(); setEnc(!ph.enc); });
  }
  S.photos.add(ph);
}
// Portrait: grayscale photo; a colour dither "pattern" (site palette) shows in a soft lens and spreads on 4 s dwell / click
function drawInvert(ph) {
  const rm = reduced(), ez = (c, t, k, eps) => (!rm && Math.abs(t - c) > eps) ? c + (t - c) * k : t;
  if (S.palDirty) ph.dDirty = true;
  const p0 = ph.er, p1 = ph.ea, p2 = ph.lr, p3 = ph.sx, p4 = ph.sy;
  ph.er = ez(ph.er, ph.ter, .05, .5); ph.ea = ez(ph.ea, ph.tea, .07, .004); ph.lr = ez(ph.lr, ph.tlr, .1, .3);
  ph.sx = ez(ph.sx, ph.mx, .2, .2); ph.sy = ez(ph.sy, ph.my, .2, .2);
  if (ph.ea === 0 && ph.tea === 0 && ph.er) ph.er = ph.ter = 0;
  if (p0 !== ph.er || p1 !== ph.ea || p2 !== ph.lr || (ph.lr > 1 && (p3 !== ph.sx || p4 !== ph.sy))) ph.cDirty = true;
  if (!ph.dDirty && !ph.cDirty) return;
  const { cv, ctx, sw, sh } = ph, dpr = ph.dpr, W = cv.width, H = cv.height;
  if (ph.dDirty) {
    const P = S.pal.c.map(v => v.map(x => Math.round(x * 255)));
    const R = [[24, 24, 24], P[1], P[0], P[3], [246, 245, 241]], n = R.length - 1, o = ph.out.data, lum = ph.lum;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const i = y * sw + x, t = clamp(lum[i], 0, .9999) * n, k = t | 0, c = (t - k) > BAYER[((y & 7) << 3) + (x & 7)] ? R[k + 1] : R[k], j = i * 4;
      o[j] = c[0]; o[j + 1] = c[1]; o[j + 2] = c[2]; o[j + 3] = 255;
    }
    ph.small.getContext('2d').putImageData(ph.out, 0, 0);
  }
  const full = ph.full || (ph.full = document.createElement('canvas'));
  if (full.width !== W || full.height !== H || ph.fullDirty !== false) {
    full.width = W; full.height = H;
    const fc = full.getContext('2d'); fc.imageSmoothingEnabled = true; fc.imageSmoothingQuality = 'high';
    cover(fc, ph.img, W, H, ph.fy);
    try {
      const im = fc.getImageData(0, 0, W, H), d = im.data;
      for (let j = 0; j < d.length; j += 4) { const g = clamp((d[j] * .2126 + d[j + 1] * .7152 + d[j + 2] * .0722 - 128) * 1.06 + 128, 0, 255); d[j] = d[j + 1] = d[j + 2] = g; }
      fc.putImageData(im, 0, 0);
    } catch (err) {}
    ph.fullDirty = false;
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(full, 0, 0);
  const lensOn = ph.lr > 1, spreadOn = ph.er > 1 && ph.ea > 0;
  if (lensOn || spreadOn) {
    const mk = ph.mk || (ph.mk = document.createElement('canvas')), lc = ph.lc || (ph.lc = document.createElement('canvas'));
    if (mk.width !== W || mk.height !== H) { mk.width = W; mk.height = H; }
    if (lc.width !== W || lc.height !== H) { lc.width = W; lc.height = H; }
    const m = mk.getContext('2d'); m.clearRect(0, 0, W, H);
    if (lensOn) {
      const x = ph.sx * dpr, y = ph.sy * dpr, R = ph.lr * dpr, a = clamp(ph.lr / (ph.tlr > 0 ? ph.tlr : (ph.lastR || ph.lr)), 0, 1);
      const g = m.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(.45, 'rgba(0,0,0,' + (a * .95) + ')'); g.addColorStop(.75, 'rgba(0,0,0,' + (a * .45) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g; m.fillRect(0, 0, W, H);
    }
    if (spreadOn) {
      const x = ph.ex * dpr, y = ph.ey * dpr, R = ph.er * dpr, g = m.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.62, 'rgba(0,0,0,1)'); g.addColorStop(.86, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.globalAlpha = ph.ea; m.fillStyle = g; m.fillRect(0, 0, W, H); m.globalAlpha = 1;
    }
    const l = lc.getContext('2d');
    l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, W, H);
    l.imageSmoothingEnabled = false; l.drawImage(ph.small, 0, 0, sw * ph.px * dpr, sh * ph.px * dpr);
    l.globalCompositeOperation = 'destination-in'; l.drawImage(mk, 0, 0);
    l.globalCompositeOperation = 'source-over';
    ctx.drawImage(lc, 0, 0);
  }
  ph.dDirty = ph.cDirty = false;
}

/* ---------- Dithered app icon (stack folders) ---------- */
const ICON_INK = [20, 20, 20], ICON_PAPER = [238, 238, 235];
function initIcon(cv) {
  if (cv.__fx) return; cv.__fx = 1;
  const ic = { cv, ctx: cv.getContext('2d'), img: new Image(), small: document.createElement('canvas'), ready: false, px: 1.5, t: 1, on: cv.dataset.on === '1', dirty: true, W: 0, H: 0, dpr: 1 };
  const fit = () => {
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); ic.dpr = dpr; ic.W = W; ic.H = H;
    ic.px = Math.max(1, Math.round(+(cv.dataset.px || 1.5) * dpr)) / dpr;
    const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    if (ic.ready) prepIcon(ic);
    ic.dirty = true;
  };
  ic.img.onload = () => { ic.ready = true; fit(); };
  ic.img.src = cv.dataset.ditherIcon;
  ic.ro = new ResizeObserver(fit); ic.ro.observe(cv);
  S.icons.add(ic);
}
function prepIcon(ic) {
  const sw = Math.max(8, Math.ceil(ic.W / ic.px)), sh = Math.max(8, Math.ceil(ic.H / ic.px));
  const m = document.createElement('canvas'); m.width = sw; m.height = sh;
  const mc = m.getContext('2d'), iw = ic.img.naturalWidth || 48, ih = ic.img.naturalHeight || 48;
  const k = clamp(+(ic.cv.dataset.scale || .5), .2, .9) * Math.min(sw, sh) / Math.max(iw, ih), dw = iw * k, dh = ih * k;
  mc.imageSmoothingEnabled = true; mc.imageSmoothingQuality = 'high';
  mc.drawImage(ic.img, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
  const a = mc.getImageData(0, 0, sw, sh).data, lum = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const u = x / (sw - 1), v = y / (sh - 1), i = y * sw + x, d = Math.min(u, v, 1 - u, 1 - v);
    const bg = .04 + .3 * Math.exp(-((u - .26) * (u - .26) + (v - .18) * (v - .18)) / .1) + (d < .07 ? (.07 - d) / .07 * .2 : 0);
    const lg = 1.03 - .42 * clamp(u * .4 + v * .7 - .3, 0, 1), al = a[i * 4 + 3] / 255;
    lum[i] = bg + (lg - bg) * al;
  }
  ic.small.width = sw; ic.small.height = sh;
  ic.lum = lum; ic.sw = sw; ic.sh = sh; ic.out = ic.small.getContext('2d').createImageData(sw, sh);
}
function drawIcon(ic) {
  if (!ic.ready || !ic.lum) return;
  const on = ic.cv.dataset.on === '1';
  if (on && !ic.on) { ic.t = reduced() ? 1 : 0; ic.dirty = true; }
  ic.on = on;
  if (ic.t < 1) { ic.t = Math.min(1, ic.t + 1 / 50); ic.dirty = true; }
  if (!ic.dirty) return;
  const { sw, sh, lum } = ic, o = ic.out.data, amp = Math.pow(1 - ic.t, 2) * 1.6;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const i = y * sw + x, v = amp ? lum[i] + (Math.random() - .5) * amp : lum[i], c = v < BAYER[((y & 7) << 3) + (x & 7)] ? ICON_INK : ICON_PAPER, j = i * 4;
    o[j] = c[0]; o[j + 1] = c[1]; o[j + 2] = c[2]; o[j + 3] = 255;
  }
  ic.small.getContext('2d').putImageData(ic.out, 0, 0);
  ic.ctx.imageSmoothingEnabled = false;
  ic.ctx.drawImage(ic.small, 0, 0, sw * ic.px * ic.dpr, sh * ic.px * ic.dpr);
  ic.dirty = false;
}
function drawPhoto(ph) {
  if (!ph.ready || !ph.lum) return;
  if (ph.invert) return drawInvert(ph);
  if (Math.abs(ph.te - ph.e) > .002) { ph.e += (ph.te - ph.e) * .045; if (Math.abs(ph.te - ph.e) <= .002) ph.e = ph.te; ph.dDirty = true; }
  if (Math.abs(ph.tlr - ph.lr) > .3) { if (ph.tlr > 0) ph.lastR = ph.tlr; ph.lr += (ph.tlr - ph.lr) * .075; ph.cDirty = true; } else if (ph.lr !== ph.tlr) { ph.lr = ph.tlr; ph.cDirty = true; }
  if (!ph.dDirty && !ph.cDirty) return;
  const { cv, ctx, sw, sh } = ph;
  if (ph.dDirty) {
    const o = ph.out.data, ink = rgb255(cv.dataset.ink || '#161616'), pap = rgb255(cv.dataset.paper || '#EFEFED'), e = ph.e, lum = ph.lum;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      const i = y * sw + x, l = 1 - (1 - lum[i]) * e, c = l < BAYER[((y & 7) << 3) + (x & 7)] ? ink : pap, j = i * 4;
      o[j] = c[0]; o[j + 1] = c[1]; o[j + 2] = c[2]; o[j + 3] = 255;
    }
    ph.small.getContext('2d').putImageData(ph.out, 0, 0);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ph.small, 0, 0, sw * ph.px * ph.dpr, sh * ph.px * ph.dpr);
  if (ph.lr > 1) {
    const dpr = ph.dpr, x = ph.mx * dpr, y = ph.my * dpr, R = ph.lr * dpr, a = ph.tlr > 0 ? Math.min(1, ph.lr / ph.tlr) : Math.min(1, ph.lr / (ph.lastR || 1));
    const full = ph.full || (ph.full = document.createElement('canvas'));
    if (full.width !== cv.width || full.height !== cv.height || ph.fullDirty !== false) {
      full.width = cv.width; full.height = cv.height;
      const fc = full.getContext('2d'); fc.imageSmoothingEnabled = true; fc.imageSmoothingQuality = 'high';
      try { fc.filter = 'saturate(1.18) contrast(1.04)'; } catch (err) {}
      cover(fc, ph.img, full.width, full.height, ph.fy); ph.fullDirty = false;
    }
    const lc = ph.lc || (ph.lc = document.createElement('canvas'));
    if (lc.width !== cv.width || lc.height !== cv.height) { lc.width = cv.width; lc.height = cv.height; }
    const l = lc.getContext('2d');
    l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, lc.width, lc.height); l.drawImage(full, 0, 0);
    const g = l.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(.42, 'rgba(0,0,0,' + (a * .96) + ')'); g.addColorStop(.72, 'rgba(0,0,0,' + (a * .5) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.globalCompositeOperation = 'destination-in'; l.fillStyle = g; l.fillRect(0, 0, lc.width, lc.height);
    ctx.drawImage(lc, 0, 0);
  }
  ph.dDirty = ph.cDirty = false;
}

/* ---------- Reveal / marquee / loops / magnet / grain / counters ---------- */
let revealIO = null;
const RV = {
  up: [{ opacity: 0, transform: 'translateY(36px)' }, { opacity: 1, transform: 'translateY(0)' }],
  fade: [{ opacity: 0 }, { opacity: 1 }],
  deal: [{ opacity: 0, transform: 'translateY(160px) rotate(10deg) scale(.9)' }, { opacity: 1, transform: 'translateY(0) rotate(0deg) scale(1)' }],
  scale: [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }],
  grow: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
  growY: [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
  pop: [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }]
};
function initReveal(el) {
  if (el.__rv) return; el.__rv = 1;
  if (reduced()) return;
  const kind = el.dataset.reveal || 'up';
  const a = el.animate(RV[kind] || RV.up, { duration: +(el.dataset.revealDur || (kind === 'deal' ? 1200 : 1000)), delay: +(el.dataset.revealDelay || 0), easing: 'cubic-bezier(.2,.75,.15,1)', fill: 'both' });
  a.pause(); el.__rva = a; revealIO.observe(el);
}
function rate(a, r) { try { if (a.updatePlaybackRate) a.updatePlaybackRate(r); else a.playbackRate = r; } catch (e) {} }
function initMarquee(el) {
  if (el.__mq) return; const tr = el.querySelector('[data-track]'); if (!tr) return; el.__mq = 1;
  const rev = el.dataset.marquee === 'reverse', dur = +(el.dataset.speed || 40000);
  const a = tr.animate(rev ? [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }] : [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: dur, iterations: Infinity });
  if (reduced()) a.pause();
  el.addEventListener('mouseenter', () => rate(a, .25));
  el.addEventListener('mouseleave', () => rate(a, 1));
}
const KF = {
  spin: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
  pulse: [{ transform: 'scale(1)', opacity: .8 }, { transform: 'scale(3.2)', opacity: 0 }],
  float: [{ transform: 'translateY(0px)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0px)' }],
  blink: [{ opacity: 1 }, { opacity: .2 }, { opacity: 1 }],
  slide: [{ backgroundPosition: '0% 50%' }, { backgroundPosition: '100% 50%' }, { backgroundPosition: '0% 50%' }],
  fill: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
  eq: [{ transform: 'scaleY(.25)' }, { transform: 'scaleY(1)' }, { transform: 'scaleY(.45)' }, { transform: 'scaleY(.8)' }, { transform: 'scaleY(.25)' }],
  cycle4: (() => {
    const o = [];
    for (let i = 0; i < 4; i++) {
      o.push({ transform: `translateX(${i * 100}%)`, offset: i ? i * .25 + .03 : 0, easing: 'cubic-bezier(.7,0,.2,1)' });
      o.push({ transform: `translateX(${i * 100}%)`, offset: i * .25 + .22, easing: 'cubic-bezier(.7,0,.2,1)' });
    }
    o.push({ transform: 'translateX(0%)', offset: 1 });
    return o;
  })()
};
const LINEAR = { spin: 1, fill: 1, slide: 1, cycle4: 1 };
function initAnim(el) {
  if (el.__an) return; const name = el.dataset.anim, k = KF[name]; if (!k) return; el.__an = 1;
  if (reduced()) return;
  const a = el.animate(k, { duration: +(el.dataset.dur || 3000), delay: +(el.dataset.delay || 0), iterations: Infinity, easing: LINEAR[name] ? 'linear' : name === 'pulse' ? 'cubic-bezier(.2,.6,.3,1)' : 'ease-in-out' });
  const hr = +(el.dataset.hoverRate || 0);
  if (hr) { const z = el.closest('[data-hover-zone]') || el; z.addEventListener('mouseenter', () => rate(a, hr)); z.addEventListener('mouseleave', () => rate(a, 1)); }
}
function initMag(el) {
  if (el.__mg) return; el.__mg = 1; el.__tx = 0; el.__ty = 0;
  if (!canHover()) return;
  el.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1)';
  S.magnets.add(el);
}
function magMove(x, y) {
  for (const el of S.magnets) {
    if (!el.isConnected) { S.magnets.delete(el); continue; }
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2 - el.__tx, cy = r.top + r.height / 2 - el.__ty;
    const dx = x - cx, dy = y - cy, pad = 34;
    if (Math.abs(dx) < r.width / 2 + pad && Math.abs(dy) < r.height / 2 + pad) {
      const s = +(el.dataset.magnetic || .3) || .3;
      el.__tx = dx * s; el.__ty = dy * s; el.style.transform = `translate(${el.__tx.toFixed(1)}px, ${el.__ty.toFixed(1)}px)`; el.__on = 1;
    } else if (el.__on) { el.__on = 0; el.__tx = el.__ty = 0; el.style.transform = ''; }
  }
}
let grainURL = '';
function grain() {
  if (grainURL) return grainURL;
  const c = document.createElement('canvas'); c.width = c.height = 140;
  const x = c.getContext('2d'), id = x.createImageData(140, 140);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255 | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  x.putImageData(id, 0, 0); grainURL = c.toDataURL(); return grainURL;
}
function initGrain(el) { if (el.__gr) return; el.__gr = 1; el.style.backgroundImage = `url(${grain()})`; el.style.backgroundSize = '140px 140px'; }
function initCount(el) {
  if (el.__ct) return; el.__ct = 1;
  if (reduced()) return;
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
  const fmt = v => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ru-RU')) + suf;
  const io = new IntersectionObserver(es => {
    if (!es[es.length - 1].isIntersecting) return; io.disconnect();
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, { threshold: .4 });
  io.observe(el);
}

/* ---------- Prototype player (case covers) ---------- */
function initProto(el) {
  if (el.__pr) return;
  const frames = [...el.querySelectorAll('[data-frame]')]; if (frames.length < 2) return; el.__pr = 1;
  const tap = el.querySelector('[data-tap]'), dots = [...el.querySelectorAll('[data-proto-dot]')];
  const steps = [...el.querySelectorAll('[data-proto-step]')].map(s => ({ el: s, ks: s.dataset.protoStep.split(',').map(Number), bar: s.querySelector('[data-proto-bar]'), on: false, ba: null }));
  const base = +(el.dataset.dwell || 2400), D = 580, EZ = 'cubic-bezier(.32,.72,0,1)';
  const dw = k => +(frames[k].dataset.dwell || base);
  let i = 0, z = 10, hold = 0, vis = false, timer = 0, busy = false, started = false;
  const setDots = () => {
    dots.forEach((d, k) => { d.style.width = k === i ? '18px' : '6px'; d.style.opacity = k === i ? '1' : '.4'; });
    steps.forEach(st => {
      const on = st.ks.indexOf(i) >= 0;
      st.el.style.opacity = on ? '1' : (st.el.dataset.dim || '.62');
      if (st.bar) {
        if (on && !st.on && started && !reduced()) {
          if (st.ba) st.ba.cancel();
          const t = st.ks.filter(k => k >= i).reduce((a, k) => a + dw(k) + 400, Math.max(0, hold - performance.now()));
          st.ba = st.bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: t, easing: 'linear', fill: 'forwards' });
        } else if (!on && st.ba) { st.ba.cancel(); st.ba = null; }
      }
      st.on = on;
    });
  };
  const scroll = k => {
    const f = frames[k]; if (!f.dataset.scroll) return; const im = f.querySelector('img'); if (!im) return;
    if (!im.complete) { im.addEventListener('load', () => { if (i === k) scroll(k); }, { once: true }); return; }
    if (f.__sa) { f.__sa.cancel(); f.__sa = null; }
    const off = im.offsetHeight - f.clientHeight; if (off < 4) return;
    const p = f.dataset.scroll.split(',').map(Number), a0 = p.length > 1 ? p[0] : 0, a1 = p.length > 1 ? p[1] : (p[0] || 1);
    const t0 = 'translateY(' + (-off * a0) + 'px)', t1 = 'translateY(' + (-off * a1) + 'px)';
    if (a0 === a1 || reduced()) { f.__sa = im.animate([{ transform: t0 }, { transform: t0 }], { duration: 1, fill: 'forwards' }); return; }
    f.__sa = im.animate([{ transform: t0 }, { transform: t1 }], { duration: Math.max(1200, dw(k) - 1300), delay: D + 350, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'both' });
  };
  const show = (j, how) => {
    if (j === i || busy) return;
    const a = frames[i], b = frames[j];
    if (z > 4000) { frames.forEach(f => { f.style.zIndex = '1'; }); a.style.zIndex = '10'; z = 10; }
    b.style.zIndex = String(++z);
    const T = how || b.dataset.trans || 'push';
    busy = true; setTimeout(() => { busy = false; }, D);
    if (!how && el.matches(':hover') && (T === 'push' || T === 'back')) play('swipe', 200);
    scroll(j);
    if (!reduced()) {
      if (T === 'up') b.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: D, easing: EZ });
      else if (T === 'fade') b.animate([{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'scale(1)' }], { duration: D * .8, easing: 'ease-out' });
      else if (T === 'swap') b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 440, easing: 'ease-out' });
      else if (T === 'xfade') b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.4,0,.2,1)' });
      else if (T === 'sheet' || T === 'modal') {
        const dm = b.querySelector('[data-dim]'), sh = b.querySelector(T === 'sheet' ? '[data-sheet]' : '[data-modal]');
        if (dm) dm.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'linear' });
        if (sh) sh.animate(T === 'sheet' ? [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }] : [{ opacity: 0, transform: 'translateY(14px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: T === 'sheet' ? 620 : 440, easing: EZ });
      }
      else if (T === 'sheetout' || T === 'modalout') {
        a.style.zIndex = String(++z);
        const bs = a.querySelector('[data-base]'), dm = a.querySelector('[data-dim]'), sh = a.querySelector('[data-sheet],[data-modal]'), an = [];
        if (bs) bs.style.opacity = '0';
        if (dm) an.push(dm.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' }));
        if (sh) an.push(sh.animate(T === 'sheetout' ? [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.97)' }], { duration: T === 'sheetout' ? 460 : 320, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }));
        setTimeout(() => { b.style.zIndex = String(++z); an.forEach(x => x.cancel()); if (bs) bs.style.opacity = ''; }, T === 'sheetout' ? 470 : 330);
      }
      else if (T === 'back') {
        a.style.zIndex = String(++z);
        const an = a.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { duration: D, easing: EZ, fill: 'forwards' });
        b.animate([{ transform: 'translateX(-30%)' }, { transform: 'translateX(0)' }], { duration: D, easing: EZ });
        an.onfinish = () => { b.style.zIndex = String(++z); an.cancel(); };
      }
      else { b.animate([{ transform: 'translateX(100%)', boxShadow: '-12px 0 32px rgba(0,0,0,0)' }, { transform: 'translateX(0)', boxShadow: '-12px 0 32px rgba(0,0,0,.08)' }], { duration: D, easing: EZ }); a.animate([{ transform: 'translateX(0)', filter: 'brightness(1)' }, { transform: 'translateX(-26%)', filter: 'brightness(.9)' }], { duration: D, easing: EZ }); }
    }
    i = j; setDots();
  };
  const tapThen = cb => {
    const at = (frames[i].dataset.tapAt || '').split(',');
    if (!tap || at.length < 2) return cb();
    tap.style.left = at[0] + '%'; tap.style.top = at[1] + '%';
    if (el.matches(':hover')) play('tapSoft', 200);
    tap.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.5)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .35 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.45)' }], { duration: 720, easing: 'ease-out' });
    setTimeout(cb, 360);
  };
  const loop = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!el.isConnected) return;
      if (!vis || document.hidden || performance.now() < hold) return loop();
      const j = (i + 1) % frames.length;
      tapThen(() => { show(j, j === 0 ? 'fade' : null); loop(); });
    }, dw(i));
  };
  dots.forEach((d, k) => d.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); hold = performance.now() + 9000; show(k, 'swap'); }));
  steps.forEach(st => st.el.addEventListener('click', e => { e.preventDefault(); if (st.ks.indexOf(i) >= 0) return; hold = performance.now() + 9000; show(st.ks[0], 'swap'); }));
  const start = () => { if (started) return; started = true; steps.forEach(st => { st.on = false; }); setDots(); scroll(i); clearTimeout(timer); if (!reduced()) loop(); };
  new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; if (vis) start(); }, { threshold: .15 }).observe(el);
  setDots();
}

/* ---------- Recreated UI scenes (HTML instead of screenshots) ---------- */
const SEZ = 'cubic-bezier(.32,.72,0,1)';
const rub = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F') + '\u00A0₽';
function mkScene(el, isVis) {
  const $$ = p => [...el.querySelectorAll('[data-p="' + p + '"]')];
  const sleep = ms => new Promise((res, rej) => { let left = ms; const tick = () => { if (!el.isConnected) return rej(0); if (isVis() && !document.hidden) left -= 60; if (left <= 0) res(); else setTimeout(tick, 60); }; setTimeout(tick, 60); });
  const css = (p, o) => $$(p).forEach(e => Object.assign(e.style, o));
  const txt = (p, s, roll) => $$(p).forEach(e => {
    if (e.textContent === s) return;
    if (!roll) { e.textContent = s; return; }
    const a = e.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-55%)', opacity: 0 }], { duration: 130, easing: 'ease-in' });
    a.onfinish = () => { e.textContent = s; e.animate([{ transform: 'translateY(55%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 300, easing: SEZ }); };
  });
  const count = (p, from, to, fmt) => $$(p).forEach(e => {
    const t0 = performance.now(), D = 560;
    const step = now => { const k = Math.min(1, (now - t0) / D), v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); e.textContent = fmt(v); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const pop = p => $$(p).forEach(e => e.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: 'ease-out', fill: 'forwards' }));
  const shake = p => $$(p).forEach(e => e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], { duration: 420, easing: 'ease-out' }));
  const tap = async t => {
    const tg = $$(t); let cur = false;
    const pts = tg.map(e => {
      const scr = e.closest('[data-screen]'); if (!scr) return null;
      const r = scr.getBoundingClientRect(), b = e.getBoundingClientRect(); if (!r.width) return null;
      const x = ((b.left + b.width / 2 - r.left) / r.width * 100).toFixed(2) + '%', y = ((b.top + b.height / 2 - r.top) / r.height * 100).toFixed(2) + '%';
      const c = scr.querySelector('[data-cursor]'); if (c) { cur = true; c.style.left = x; c.style.top = y; }
      return { e, x, y, c, d: scr.querySelector('[data-tapdot]') };
    }).filter(Boolean);
    if (cur) await sleep(640);
    pts.forEach(({ e, x, y, c, d }) => {
      if (c) c.firstElementChild && c.firstElementChild.animate([{ transform: 'scale(1)' }, { transform: 'scale(.8)' }, { transform: 'scale(1)' }], { duration: 260 });
      if (d) { d.style.left = x; d.style.top = y; d.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.4)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .3 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.6)' }], { duration: 680, easing: 'ease-out' }); }
      e.animate([{ transform: 'scale(1)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }], { duration: 240 });
    });
    if (pts.length && el.matches(':hover')) play('tapSoft', 200);
    await sleep(260);
  };
  return { $$, sleep, css, txt, count, pop, shake, tap };
}
const SCENES = {
  'fz-buy': async s => {
    const { sleep, css, txt, count, tap, $$ } = s;
    css('sheet', { transform: 'translateY(100%)' }); css('modal', { opacity: '0', transform: 'translateY(14px) scale(.96)' }); css('dim', { opacity: '0' });
    css('bar', { transform: 'translateY(140%)' }); css('kid-plus', { opacity: '.3' }); css('minus', { opacity: '.3' }); css('svc-ic', { opacity: '0', transform: 'scale(.5)' });
    css('tg-t', { background: '#E6E6E6' }); css('tg-k', { transform: 'translateX(0)', background: '#FFFFFF' });
    txt('cnt-base', '0'); txt('cnt-kid', '0'); txt('bar-n', '1 билет'); txt('sum', '+0\u00A0₽'); $$('total').forEach(e => { e.textContent = rub(0); });
    await sleep(120); css('done', { opacity: '0', transform: 'scale(.985)', pointerEvents: 'none' });
    await sleep(1100);
    await tap('t-plus-base'); txt('cnt-base', '1', 1); css('minus', { opacity: '1' }); css('kid-plus', { opacity: '1' }); css('bar', { transform: 'translateY(0)' }); count('total', 0, 1000, rub);
    await sleep(1150);
    await tap('t-plus-kid'); txt('cnt-kid', '1', 1); txt('bar-n', '2 билета', 1); count('total', 1000, 1600, rub);
    await sleep(1150);
    await tap('t-add'); css('dim', { opacity: '1' }); css('sheet', { transform: 'translateY(0)' }); css('modal', { opacity: '1', transform: 'none' });
    await sleep(1250);
    await tap('t-tg'); css('tg-t', { background: '#B7DFEE' }); css('tg-k', { transform: 'translateX(16px)', background: '#6EBFDD' }); txt('sum', '+320\u00A0₽', 1);
    await sleep(1150);
    await tap('t-close'); css('dim', { opacity: '0' }); css('sheet', { transform: 'translateY(100%)' }); css('modal', { opacity: '0', transform: 'translateY(14px) scale(.96)' }); css('svc-ic', { opacity: '1', transform: 'scale(1)' }); count('total', 1600, 1920, rub);
    await sleep(1250);
    await tap('t-pay'); css('done', { opacity: '1', transform: 'none' });
    await sleep(2800);
  },
  'fz-promo': async s => {
    const { sleep, css, txt, tap, pop, shake } = s;
    css('input', { transform: 'translateY(100%)' }); css('idim', { opacity: '0' });
    css('cond-ok', { opacity: '0', transform: 'scale(.4)' }); css('apply', { background: '#D8EEF6' });
    css('row-def', { opacity: '1', transform: 'none' }); css('row-ok', { opacity: '0', transform: 'translateY(8px)' }); css('err', { opacity: '0' }); css('code', { color: '#1D1D1D' }); css('apply2', { background: '#D8EEF6' }); txt('code', '');
    css('cond-txt', { color: '#5F5F5D' });
    await sleep(1300);
    pop('cond-ok'); css('cond-txt', { color: '#1D1D1D' }); css('apply', { background: '#6EBFDD' });
    await sleep(1500);
    await tap('t-promo'); css('idim', { opacity: '1' }); css('input', { transform: 'translateY(0)' });
    await sleep(800);
    const w1 = 'КАНИКУЛ'; for (let i = 1; i <= w1.length; i++) { txt('code', w1.slice(0, i)); await sleep(110); }
    css('apply2', { background: '#6EBFDD' }); await sleep(500);
    await tap('t-apply2'); css('code', { color: '#D6336C' }); css('err', { opacity: '1' }); css('apply2', { background: '#D8EEF6' }); shake('code');
    await sleep(1400);
    txt('code', 'КАНИКУЛЫ'); css('code', { color: '#1D1D1D' }); css('err', { opacity: '0' }); css('apply2', { background: '#6EBFDD' });
    await sleep(700);
    await tap('t-apply2'); css('idim', { opacity: '0' }); css('input', { transform: 'translateY(100%)' });
    await sleep(380); css('row-def', { opacity: '0', transform: 'translateY(-8px)' }); css('row-ok', { opacity: '1', transform: 'none' }); pop('row-check');
    await sleep(2600);
  },
  'fz-avail': async s => {
    const { sleep, css, txt, pop } = s;
    const seq = [['115 билетов', '42 билета', '5 билетов'], ['64 билета', '12 билетов', '5 билетов']];
    css('c3', { opacity: '1' }); css('c3-sold', { opacity: '0' }); css('c3-badge', { opacity: '1' }); css('pav-a', { boxShadow: 'inset 0 0 0 1.5px #E8E8E8' }); css('pav-b', { boxShadow: 'inset 0 0 0 1.5px #E8E8E8' }); css('chk-a', { opacity: '0' }); css('chk-b', { opacity: '0' });
    txt('b1', '115 билетов'); txt('b2', '64 билета'); txt('b3', '5 билетов'); css('b2w', { background: '#F1F9FC', color: '#4FA9CB' });
    await sleep(1200);
    txt('b1', '98 билетов', 1); txt('b2', '23 билета', 1); txt('b3', '2 билета', 1); await sleep(1300);
    txt('b1', '71 билет', 1); txt('b2', '6 билетов', 1); css('b2w', { background: '#FFF7E6', color: '#F2A31B' }); css('c3-badge', { opacity: '0' }); css('c3', { opacity: '.45' }); css('c3-sold', { opacity: '1' }); await sleep(1500);
    css('pav-a', { boxShadow: 'inset 0 0 0 1.5px #6EBFDD' }); pop('chk-a'); await sleep(1300);
    css('pav-a', { boxShadow: 'inset 0 0 0 1.5px #E8E8E8' }); css('chk-a', { opacity: '0' }); css('pav-b', { boxShadow: 'inset 0 0 0 1.5px #6EBFDD' }); pop('chk-b'); await sleep(2200);
  }
};
function initScene(el) {
  if (el.__sc) return; el.__sc = 1;
  const st = el.querySelector('[data-stage]'); if (!st) return;
  const W = +el.dataset.w || 1280, H = +el.dataset.h || 800, MX = +(el.dataset.max || 1);
  const fit = () => { const w = el.clientWidth, h = el.clientHeight; if (!w) return; const k = Math.min(w / W, h ? h / H : 9, MX); st.style.transform = 'translate(-50%,-50%) scale(' + k.toFixed(4) + ')'; st.style.opacity = '1'; };
  if (window.ResizeObserver) new ResizeObserver(fit).observe(el);
  fit(); requestAnimationFrame(fit);
  const run = SCENES[el.dataset.scene]; if (!run || reduced()) return;
  let vis = false, on = false;
  const api = mkScene(el, () => vis);
  const go = () => { if (on || !el.isConnected) return; on = true; run(api).then(() => { on = false; go(); }, () => { on = false; }); };
  new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; if (vis) go(); }, { threshold: .15 }).observe(el);
}

/* ---------- Cursor label ---------- */
function makeCursor() {
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;left:0;top:0;z-index:10000;pointer-events:none;will-change:transform';
  const i = document.createElement('div');
  i.style.cssText = 'transform:translate(-50%,-50%) scale(0);transition:transform .4s cubic-bezier(.2,.8,.2,1);padding:12px 18px;border-radius:999px;background:var(--c0,#A9CBFF);color:#111;font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;box-shadow:0 10px 30px rgba(0,0,0,.18)';
  o.appendChild(i); document.body.appendChild(o);
  return { o, i, x: -200, y: -200 };
}
function onOver(e) {
  if (!S.cur) return;
  const t = e.target && e.target.closest ? e.target.closest('[data-cursor]') : null;
  const label = t ? t.getAttribute('data-cursor') : '';
  if (label) { S.cur.i.textContent = label; S.cur.i.style.transform = 'translate(-50%,-50%) scale(1)'; }
  else S.cur.i.style.transform = 'translate(-50%,-50%) scale(0)';
}
function onMove(e) {
  const m = S.mouse; m.x = e.clientX; m.y = e.clientY; m.active = true; m.last = performance.now();
  for (const g of S.meshes) {
    const r = g.cv.getBoundingClientRect();
    const ins = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (ins) { g.tx = (e.clientX - r.left) / r.width; g.ty = 1 - (e.clientY - r.top) / r.height; }
    g.tz = ins ? 1 : 0;
  }
  magMove(e.clientX, e.clientY);
}

/* ---------- Page transition ---------- */
function pageTransition(label, mid, done) {
  play('whoosh', 400);
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;clip-path:inset(100% 0 0 0);background:radial-gradient(60% 80% at 18% 22%, var(--c1,#CDB8F7) 0%, transparent 62%), radial-gradient(60% 80% at 82% 28%, var(--c0,#A9CBFF) 0%, transparent 62%), radial-gradient(70% 90% at 50% 105%, var(--c2,#B4EBD3) 0%, transparent 62%), radial-gradient(50% 60% at 92% 92%, var(--c3,#F8C9B4) 0%, transparent 62%), var(--c4,#F3EFC9)';
  const g = document.createElement('div');
  g.style.cssText = `position:absolute;inset:0;opacity:.35;mix-blend-mode:overlay;background-image:url(${grain()});background-size:140px 140px`;
  const tx = document.createElement('div');
  tx.textContent = label;
  tx.style.cssText = 'position:relative;font-family:"Noto Serif Display",Georgia,serif;font-weight:300;font-stretch:66%;font-style:italic;font-size:clamp(72px,13vw,220px);line-height:1;letter-spacing:-.03em;color:#141414;opacity:0';
  ov.append(g, tx); document.body.appendChild(ov);
  const ease = 'cubic-bezier(.76,0,.24,1)';
  if (reduced()) { mid && mid(); ov.remove(); done && done(); return; }
  const a1 = ov.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)' }], { duration: 620, easing: ease, fill: 'forwards' });
  tx.animate([{ transform: 'translateY(70px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 640, delay: 180, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
  a1.finished.then(() => {
    try { mid && mid(); } catch (e) { console.warn(e); }
    setTimeout(() => {
      tx.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-70px)', opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'forwards' });
      const a2 = ov.animate([{ clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 680, delay: 120, easing: ease, fill: 'forwards' });
      a2.finished.then(() => { ov.remove(); done && done(); });
    }, 320);
  });
}

/* ---------- Scan + loop ---------- */
function q(root, sel) { const out = []; if (root.matches && root.matches(sel)) out.push(root); if (root.querySelectorAll) out.push(...root.querySelectorAll(sel)); return out; }
function scan(root) {
  q(root, 'canvas[data-mesh]').forEach(initMesh);
  q(root, 'canvas[data-dither-shape]').forEach(initShape);
  q(root, 'canvas[data-dither-photo]').forEach(initPhoto);
  q(root, 'canvas[data-dither-icon]').forEach(initIcon);
  q(root, '[data-reveal]').forEach(initReveal);
  q(root, '[data-marquee]').forEach(initMarquee);
  q(root, '[data-track]').forEach(t => { const m = t.closest('[data-marquee]'); if (m) initMarquee(m); });
  q(root, '[data-magnetic]').forEach(initMag);
  q(root, '[data-anim]').forEach(initAnim);
  q(root, '[data-grain]').forEach(initGrain);
  q(root, '[data-count]').forEach(initCount);
  q(root, '[data-proto]').forEach(initProto);
  q(root, '[data-scene]').forEach(initScene);
}
let frameN = 0;
function loop(now) {
  S.raf = requestAnimationFrame(loop);
  const rm = reduced(), t = rm ? 12 : now / 1000; frameN++;
  for (const m of S.meshes) {
    if (!m.cv.isConnected || m.dead) { killMesh(m); continue; }
    if (m.vis && (!rm || !m.drawn || S.palDirty)) drawMesh(m, t);
  }
  if (frameN % 2 === 0) for (const d of S.shapes) {
    if (!d.cv.isConnected) { d.ro.disconnect(); d.io.disconnect(); S.shapes.delete(d); continue; }
    if (d.vis) drawShape(d, t);
  }
  for (const p of S.photos) {
    if (!p.cv.isConnected) { p.ro.disconnect(); p.io.disconnect(); S.photos.delete(p); continue; }
    drawPhoto(p);
  }
  for (const ic of S.icons) {
    if (!ic.cv.isConnected) { ic.ro.disconnect(); S.icons.delete(ic); continue; }
    drawIcon(ic);
  }
  S.palDirty = false;
  if (S.cur) { const c = S.cur; c.x += (S.mouse.x - c.x) * .22; c.y += (S.mouse.y - c.y) * .22; c.o.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`; }
}

export function initFX(opts = {}) {
  if (window.__vlFX) { if (opts.palette) window.__vlFX.setPalette(opts.palette); window.__vlFX.rescan(); return window.__vlFX; }
  revealIO = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const a = en.target.__rva; revealIO.unobserve(en.target);
    if (a) { a.play(); a.finished.then(() => a.cancel()).catch(() => {}); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  if (canHover()) S.cur = makeCursor();
  const mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n); });
  mo.observe(document.body, { childList: true, subtree: true });
  scan(document.body);
  wireSound();
  window.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseover', onOver, { passive: true });
  const onLeave = () => { S.mouse.active = false; for (const g of S.meshes) g.tz = 0; if (S.cur) S.cur.i.style.transform = 'translate(-50%,-50%) scale(0)'; };
  document.documentElement.addEventListener('mouseleave', onLeave);
  S.raf = requestAnimationFrame(loop);
  const api = {
    setPalette(p) { S.pal = { c: p.c.map(rgb01), base: rgb01(p.base || '#0B0B0C') }; S.palDirty = true; },
    transition: pageTransition,
    play, setSound, soundOn,
    rescan() { scan(document.body); },
    destroy() {
      cancelAnimationFrame(S.raf); mo.disconnect();
      window.removeEventListener('mousemove', onMove); document.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      S.meshes.forEach(killMesh); if (S.cur) S.cur.o.remove(); window.__vlFX = null;
    }
  };
  if (opts.palette) api.setPalette(opts.palette);
  window.__vlFX = api;
  return api;
}
