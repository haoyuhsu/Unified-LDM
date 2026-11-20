/* UNIFIED project page. No dependencies. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ───────── reveal on scroll ───────── */
function reveal() {
  const els = $$('.rv');
  if (!('IntersectionObserver' in window) || reduced) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
}

/* ───────── nav ───────── */
function nav() {
  const btn = $('#navMenu'), menu = $('#navLinks');
  if (!btn || !menu) return;
  const set = open => { menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); };
  btn.addEventListener('click', () => set(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

/* ───────── highlights carousel ───────── */
function highlights() {
  const track = $('#hlTrack'), pager = $('#hlPager');
  if (!track || !pager) return;
  const cards = $$('.hcard', track);
  const dots = cards.map((card, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Highlight ${i + 1} of ${cards.length}`);
    b.addEventListener('click', () => track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2,
      behavior: reduced ? 'auto' : 'smooth'
    }));
    pager.appendChild(b);
    return b;
  });
  const mark = i => dots.forEach((d, j) => d.setAttribute('aria-current', j === i));
  mark(0);
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) mark(cards.indexOf(e.target));
  }), { root: track, threshold: 0.6 });
  cards.forEach(c => io.observe(c));
}

/* ───────── highlight card: three networks fuse pairwise into one ─────────
   Each box is drawn twice, a dark outer shape and a lighter inner one, and both layers pass
   through a blur-and-threshold filter, so boxes that come close grow a neck and fuse. */
function mergeAnim() {
  const svg = $('.merge');
  if (!svg) return;
  const Y = 50, BH = 104, RX = 22, SW = 2.5, TOTAL = 10;
  const BAND = [245, 245, 247], FILL = [232, 232, 237], INK = [29, 29, 31];
  const lerp = (a, b, t) => a + (b - a) * t;
  const io3 = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const seg = (T, a, b) => clamp((T - a) / (b - a));
  const mix = (c1, c2, t) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(',')})`;
  const three = fn => [0, 1, 2].map(fn).join('');
  svg.innerHTML = `<defs><filter id="hlGoo" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/>
      <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"/>
    </filter></defs>
    <g class="mz-all">
      <g filter="url(#hlGoo)">${three(() => `<rect class="mz-o" y="${Y - SW}" height="${BH + 2 * SW}" rx="${RX + SW}"/>`)}</g>
      <g filter="url(#hlGoo)">${three(() => `<rect class="mz-i" y="${Y}" height="${BH}" rx="${RX}"/>`)}</g>
      <text class="mz-t" data-k="enc" x="135" y="${Y + BH / 2}">Enc.</text>
      <text class="mz-t" data-k="gen" x="320" y="${Y + BH / 2}">Gen.</text>
      <text class="mz-t" data-k="dec" x="505" y="${Y + BH / 2}">Dec.</text>
      <text class="mz-t" data-k="ge" x="227.5" y="${Y + BH / 2}">Generative Enc.</text>
      <text class="mz-t mz-w" data-k="uni" x="320" y="${Y + BH / 2}">UNIFIED (Enc./Gen./Dec.)</text>
      <text class="st-lab" data-k="n3" x="320" y="212">Latent diffusion · 3 networks</text>
      <text class="st-lab" data-k="n2" x="320" y="212">UNITE · 2 networks</text>
      <text class="st-lab" data-k="n1" x="320" y="212">UNIFIED · 1 network</text>
    </g>`;
  const all = $('.mz-all', svg), outer = $$('.mz-o', svg), inner = $$('.mz-i', svg);
  const txt = Object.fromEntries($$('text', svg).map(n => [n.dataset.k, n]));
  const box = (i, x0, x1) => {
    outer[i].setAttribute('x', x0 - SW); outer[i].setAttribute('width', x1 - x0 + 2 * SW);
    inner[i].setAttribute('x', x0); inner[i].setAttribute('width', x1 - x0);
  };

  function render(T) {
    T = ((T % TOTAL) + TOTAL) % TOTAL;
    const a = io3(seg(T, 2.2, 3.5));   // Enc. and Gen. fuse
    const b = io3(seg(T, 5.7, 7.0));   // Generative Enc. and Dec. fuse
    // the two boxes reach across their gap; once they overlap, both take the fused extent
    if (b >= 1) { box(0, 60, 580); box(1, 60, 580); box(2, 60, 580); }
    else {
      const right = lerp(395, 425, b);
      if (a >= 1) { box(0, 60, right); box(1, 60, right); }
      else { box(0, 60, lerp(210, 240, a)); box(1, lerp(245, 215, a), 395); }
      box(2, lerp(430, 400, b), 580);
    }
    const dark = seg(T, 6.4, 7.1), tint = seg(T, 2.9, 3.6);
    const cAB = mix(INK.map((v, i) => lerp(BAND[i], FILL[i], tint)), INK, dark);
    inner[0].setAttribute('fill', cAB); inner[1].setAttribute('fill', cAB);
    inner[2].setAttribute('fill', mix(BAND, INK, dark));
    const o = {
      enc: 1 - seg(T, 2.2, 2.8), gen: 1 - seg(T, 2.2, 2.8), dec: 1 - seg(T, 5.7, 6.3),
      ge: seg(T, 3.0, 3.6) * (1 - seg(T, 5.7, 6.3)), uni: seg(T, 6.8, 7.4),
      n3: 1 - seg(T, 2.6, 3.1), n2: seg(T, 3.1, 3.6) * (1 - seg(T, 6.1, 6.6)), n1: seg(T, 6.6, 7.1)
    };
    for (const k in o) txt[k].style.opacity = o[k];
    all.style.opacity = Math.min(seg(T, 0, 0.4), 1 - seg(T, 9.4, TOTAL));
  }

  window.UNIFIED_MERGE = { render, duration: TOTAL };
  if (reduced) { render(8.5); return; }
  let T = 0, raf = 0, last = 0, visible = false;
  const tick = now => {
    raf = 0;
    if (!visible) return;
    T += Math.min(0.1, (now - last) / 1000); last = now;
    render(T);
    raf = requestAnimationFrame(tick);
  };
  render(0.4);
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }, { threshold: 0.3 }).observe(svg);
}

/* ───────── play / pause / tabs, shared by both animations ───────── */
const ICON = {
  pause: '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2" width="3.5" height="14" rx="1"/><rect x="8.5" width="3.5" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1l10 6-10 6z"/></svg>'
};
function player({ watch, btn, tabs, starts, durs, render }) {
  let T = 0, playing = !reduced, visible = false, raf = 0, last = 0;
  const paint = () => {
    btn.innerHTML = playing ? ICON.pause : ICON.play;
    btn.setAttribute('aria-label', playing ? 'Pause the animation' : 'Play the animation');
  };
  const tick = now => {
    raf = 0;
    if (!playing || !visible) return;
    T += Math.min(0.1, (now - last) / 1000); last = now;
    render(T);
    raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (playing && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  btn.addEventListener('click', () => { playing = !playing; paint(); kick(); });
  tabs.forEach((b, j) => b.addEventListener('click', () => {
    T = starts[j] + (playing ? 0 : durs[j] * 0.9);
    render(T); kick();
  }));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }, { threshold: 0.25 }).observe(watch);
  } else { visible = true; }
  // ?t=<seconds> shows one fixed frame, for stills and frame-by-frame export
  const fixed = parseFloat(new URLSearchParams(location.search).get('t'));
  if (!Number.isNaN(fixed)) { playing = false; T = fixed; }
  else T = playing ? 0 : durs[0] * 0.9;
  paint(); render(T); kick();
}

/* ───────── how it works: the three passes ─────────
   render(T) is a pure function of time, so the same code can later be stepped
   frame by frame to export an MP4 (window.UNIFIED_ANIM). */
function layoutAnim() {
  const host = $('#layoutStage');
  if (!host) return;
  const W = 960, H = 510, N = 9, S = 56, PITCH = 88, X0 = 124;
  const yIn = 92, yOut = 440, bbY = 156, bbH = 220;
  const COL = ['#D64C4E', '#C43D46', '#DFC0BB', '#AB6160', '#8F7773', '#B29E98', '#632E2E', '#6A6F61', '#9DA196'];
  const IMG = 'static/img/patch_source.jpg';
  const cx = i => X0 + PITCH * i;
  const R = S / 2 - 2;

  const patch = (i, y, cls) => {
    const k = i - 1, col = k % 3, row = Math.floor(k / 3), x = cx(i) - S / 2;
    return `<g class="${cls}"><svg x="${x}" y="${y - S / 2}" width="${S}" height="${S}" viewBox="${col * S} ${row * S} ${S} ${S}"><image href="${IMG}" width="${S * 3}" height="${S * 3}" preserveAspectRatio="none"/></svg><rect class="ls-tok" x="${x}" y="${y - S / 2}" width="${S}" height="${S}" rx="3" fill="none"/></g>`;
  };
  const lat = (i, y, cls) => `<circle class="ls-tok ${cls}" cx="${cx(i)}" cy="${y}" r="${R}" fill="${COL[i - 1]}"/>`;
  const noise = (i, y, cls) => `<circle class="ls-tok ${cls}" cx="${cx(i)}" cy="${y}" r="${R}" fill="url(#lsHatch)"/>`;

  const blkH = (bbH - 28 - 3 * 8) / 4;
  let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <defs><pattern id="lsHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#ececf0"/><rect width="3" height="7" fill="#a1a1a6"/></pattern></defs>
    <text class="ls-lab" x="14" y="${yIn - S / 2 - 16}">Position</text>
    <text class="ls-lab" x="14" y="${yIn + 4}">Input</text>
    <text class="ls-lab" x="14" y="${bbY + bbH / 2 - 6}">Shared</text>
    <text class="ls-lab" x="14" y="${bbY + bbH / 2 + 10}">backbone</text>
    <text class="ls-lab" x="14" y="${yOut + 4}">Output</text>
    <rect class="ls-bb" x="86" y="${bbY}" width="${W - 86 - 8}" height="${bbH}" rx="24"/>`;
  for (let b = 0; b < 4; b++) s += `<rect class="ls-blk" data-b="${b}" x="98" y="${bbY + 14 + b * (blkH + 8)}" width="${W - 98 - 20}" height="${blkH}" rx="12"/>`;
  for (let i = 0; i <= N; i++) {
    const y0 = yIn + S / 2 + 5, y1 = yOut - S / 2 - 13;
    s += `<text class="ls-idx" x="${cx(i)}" y="${yIn - S / 2 - 16}">${i}</text>`;
    s += `<path class="ls-lane" data-i="${i}" d="M${cx(i)} ${y0}V${y1}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`;
    s += `<path class="ls-head" data-i="${i}" d="M${cx(i) - 6} ${y1 - 1}h12l-6 9z" opacity="0"/>`;
  }
  s += `<g class="in-mode"><circle class="ls-mode" cx="${cx(0)}" cy="${yIn}" r="${R + 1}"/><text class="ls-modet" x="${cx(0)}" y="${yIn}">Enc</text></g>`;
  s += `<g class="out-ghost"><circle class="ls-ghost" cx="${cx(0)}" cy="${yOut}" r="${R}"/><text class="ls-idx" x="${cx(0)}" y="${yOut + S / 2 + 20}">discarded</text></g>`;
  for (let i = 1; i <= N; i++) {
    s += patch(i, yIn, 'in-patch') + lat(i, yIn, 'in-lat') + noise(i, yIn, 'in-noise');
    s += lat(i, yOut, 'out-lat') + patch(i, yOut, 'out-patch');
  }
  s += '</svg>';
  host.innerHTML = s;

  const svg = $('svg', host);
  const q = c => $$('.' + c, svg);
  const el = {
    lanes: q('ls-lane'), heads: q('ls-head'), blks: q('ls-blk'),
    inPatch: q('in-patch'), inLat: q('in-lat'), inNoise: q('in-noise'),
    outLat: q('out-lat'), outPatch: q('out-patch'),
    mode: $('.in-mode', svg), modeT: $('.ls-modet', svg), ghost: $('.out-ghost', svg)
  };
  const ui = {
    tabs: $$('#player .ptabs button'), play: $('#playBtn'), cap: $('#pCap'),
    cMode: $('#cMode'), cT: $('#cT'), cC: $('#cC')
  };
  const PH = [
    { k: 'enc', d: 4.5, lab: 'Enc', color: 'var(--enc)',
      cap: '<b>Encode.</b> Image patches follow the mode token, and latents come out at the same positions. The input is fully observed, so the timestep is 1.' },
    { k: 'gen', d: 6.5, lab: 'Gen', color: 'var(--gen)',
      cap: '<b>Generate.</b> Noisy latents take the same positions. Repeated passes integrate the flow from noise at <i>t</i> = 0 to the clean latent at <i>t</i> = 1, conditioned on the class label.' },
    { k: 'dec', d: 4.5, lab: 'Dec', color: 'var(--dec)',
      cap: '<b>Decode.</b> The clean latent goes in and pixel patches come out, position for position. Decoding has its own learned timestep, written −1.' }
  ];
  const TOTAL = PH.reduce((a, p) => a + p.d, 0);
  const starts = PH.map((p, i) => PH.slice(0, i).reduce((a, x) => a + x.d, 0));
  const setO = (list, fn) => list.forEach((n, j) => { n.style.opacity = fn(j); });
  let shown = -1;

  function render(T) {
    T = ((T % TOTAL) + TOTAL) % TOTAL;
    let idx = PH.length - 1;
    for (let i = 0; i < PH.length; i++) if (T < starts[i] + PH[i].d) { idx = i; break; }
    const ph = PH[idx], u = (T - starts[idx]) / ph.d, k = ph.k;
    const aIn = ease(clamp(u / 0.1));
    const fade = 1 - clamp((u - 0.94) / 0.06);
    let flow, aOut, t = 1, done;
    if (k === 'gen') {
      const p = clamp((u - 0.1) / 0.7);
      t = p; done = p >= 1;
      flow = done ? 1 : (p * 4) % 1;
      aOut = ease(clamp((p - 0.2) / 0.12));
    } else {
      flow = clamp((u - 0.1) / 0.45); done = flow >= 1;
      aOut = ease(clamp((u - 0.5) / 0.15));
    }

    if (shown !== idx) {
      shown = idx;
      svg.style.setProperty('--mode', ph.color);
      el.modeT.textContent = ph.lab;
      ui.cap.innerHTML = ph.cap;
      ui.cMode.textContent = ph.lab;
      ui.cC.textContent = k === 'gen' ? 'class' : '∅';
      ui.tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === idx));
    }
    ui.cT.textContent = k === 'gen' ? t.toFixed(2) : (k === 'dec' ? '−1' : '1');
    ui.tabs.forEach((b, j) => b.style.setProperty('--p', j < idx ? 1 : j === idx ? u : 0));

    const stag = j => ease(clamp((u - j * 0.008) / 0.1)) * fade;
    el.mode.style.opacity = aIn * fade;
    setO(el.inPatch, j => k === 'enc' ? stag(j) : 0);
    setO(el.inLat, j => k === 'enc' ? 0 : stag(j));
    setO(el.inNoise, j => k === 'gen' ? stag(j) * (1 - t) : 0);
    setO(el.outLat, () => k === 'dec' ? 0 : aOut * fade);
    setO(el.outPatch, () => k === 'dec' ? aOut * fade : 0);
    el.ghost.style.opacity = (0.35 + 0.65 * aOut) * fade;
    el.lanes.forEach(n => { n.style.strokeDashoffset = 1 - flow; n.style.opacity = fade * (n.dataset.i === '0' ? 0.35 : 1); });
    el.heads.forEach(n => { n.style.opacity = (flow > 0.97 ? 1 : 0) * fade * (n.dataset.i === '0' ? 0.35 : 1); });
    el.blks.forEach((n, b) => n.classList.toggle('on', flow > 0 && flow < 1 && Math.floor(flow * 4) === b));
  }

  player({ watch: host, btn: ui.play, tabs: ui.tabs, starts, durs: PH.map(p => p.d), render });
  window.UNIFIED_ANIM = { render, duration: TOTAL };
}

/* ───────── readout layout against aligned layout ───────── */
function routeAnim() {
  const fig = $('#duo'), A = $('#duoA'), B = $('#duoB');
  if (!fig || !A || !B) return;
  const W = 520, H = 318, S = 38, P = 54, yIn = 46, yOut = 272, bbY = 88, bbH = 142;
  const COL = ['#C14E51', '#C59291', '#75524D', '#909287'];
  const IMG = 'static/img/patch_source.jpg';
  const R = S / 2 - 1.5;
  const G = {
    mode: (x, y, lab) => `<circle class="ls-mode" cx="${x}" cy="${y}" r="${R + 1}"/><text class="ls-modet rt-modet" x="${x}" y="${y}">${lab}</text>`,
    patch: (x, y, k) => `<svg x="${x - S / 2}" y="${y - S / 2}" width="${S}" height="${S}" viewBox="${(k % 2) * S} ${Math.floor(k / 2) * S} ${S} ${S}"><image href="${IMG}" width="${S * 2}" height="${S * 2}" preserveAspectRatio="none"/></svg><rect class="ls-tok" x="${x - S / 2}" y="${y - S / 2}" width="${S}" height="${S}" rx="3" fill="none"/>`,
    lat: (x, y, k) => `<circle class="ls-tok" cx="${x}" cy="${y}" r="${R}" fill="${COL[k]}"/>`,
    read: (x, y, hid) => `<rect class="ls-tok" x="${x - 13}" y="${y - 13}" width="26" height="26" rx="3" fill="url(#${hid})" transform="rotate(45 ${x} ${y})"/>`,
    ghost: (x, y) => `<circle class="ls-ghost" cx="${x}" cy="${y}" r="${R - 2}"/>`
  };
  const build = (aligned, hid) => {
    const n = aligned ? 5 : 9, X0 = (W - (n - 1) * P) / 2, cx = i => X0 + P * i;
    const yT = yIn + S / 2 + 4, yB = yOut - S / 2 - 11, mid = bbY + bbH / 2;
    const lane = (xs, xt, cls = '') => {
      const d = xs === xt ? `M${xs} ${yT}V${yB}` : `M${xs} ${yT}V${bbY + 16}C${xs} ${mid + 18} ${xt} ${mid - 18} ${xt} ${bbY + bbH - 16}V${yB}`;
      return `<path class="ls-lane r-lane ${cls}" d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`;
    };
    const head = x => `<path class="ls-head r-head" d="M${x - 5} ${yB - 1}h10l-5 8z"/>`;
    const pass = k => {
      const src = k === 'enc' ? G.patch : G.lat, dst = k === 'enc' ? G.lat : G.patch;
      let ins = G.mode(cx(0), yIn, k === 'enc' ? 'Enc' : 'Dec'), lanes = lane(cx(0), cx(0), 'dim'), outs = G.ghost(cx(0), yOut);
      for (let j = 0; j < 4; j++) {
        if (aligned) {
          const x = cx(1 + j);
          ins += src(x, yIn, j); lanes += lane(x, x) + head(x); outs += dst(x, yOut, j);
        } else {
          // encode: latent readouts at 1..4, patches at 5..8. decode: latents at 1..4, pixel readouts at 5..8.
          const xr = k === 'enc' ? cx(1 + j) : cx(5 + j), xs = k === 'enc' ? cx(5 + j) : cx(1 + j);
          ins += G.read(xr, yIn, hid) + src(xs, yIn, j);
          lanes += lane(xr, xr, 'dim') + lane(xs, xr) + head(xr);
          outs += dst(xr, yOut, j) + G.ghost(xs, yOut);
        }
      }
      return `<g class="r-pass" data-k="${k}"><g class="r-in">${ins}</g>${lanes}<g class="r-out">${outs}</g></g>`;
    };
    const x0 = cx(0) - S / 2 - 12, bw = cx(n - 1) + S / 2 + 12 - x0, blk = (bbH - 24 - 12) / 3;
    let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><pattern id="${hid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><rect width="6" height="2.4" fill="#a1a1a6"/></pattern></defs>`;
    s += `<rect class="ls-bb" x="${x0}" y="${bbY}" width="${bw}" height="${bbH}" rx="18"/>`;
    for (let b = 0; b < 3; b++) s += `<rect class="ls-blk" x="${x0 + 10}" y="${bbY + 12 + b * (blk + 6)}" width="${bw - 20}" height="${blk}" rx="9"/>`;
    return s + pass('enc') + pass('dec') + '</svg>';
  };
  A.innerHTML = build(false, 'rtHatchA');
  B.innerHTML = build(true, 'rtHatchB');

  const PH = [
    { k: 'enc', d: 5, color: 'var(--enc)' },
    { k: 'dec', d: 5, color: 'var(--dec)' }
  ];
  const TOTAL = 10, starts = [0, 5];
  const tabs = $$('.ptabs button', fig), passes = $$('.r-pass', fig);
  let shown = -1;
  function render(T) {
    T = ((T % TOTAL) + TOTAL) % TOTAL;
    const idx = T < 5 ? 0 : 1, ph = PH[idx], u = (T - starts[idx]) / ph.d;
    const aIn = ease(clamp(u / 0.1)), flow = clamp((u - 0.1) / 0.5), aOut = ease(clamp((u - 0.6) / 0.15));
    const fade = 1 - clamp((u - 0.94) / 0.06);
    if (shown !== idx) {
      shown = idx;
      fig.style.setProperty('--mode', ph.color);
      tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === idx));
    }
    tabs.forEach((b, j) => b.style.setProperty('--p', j < idx ? 1 : j === idx ? u : 0));
    passes.forEach(g => {
      const on = g.dataset.k === ph.k;
      g.style.opacity = on ? fade : 0;
      if (!on) return;
      $('.r-in', g).style.opacity = aIn;
      $('.r-out', g).style.opacity = aOut;
      $$('.r-lane', g).forEach(n => { n.style.strokeDashoffset = 1 - flow; });
      $$('.r-head', g).forEach(n => { n.style.opacity = flow > 0.97 ? 1 : 0; });
    });
  }
  player({ watch: fig, btn: $('#duoPlay'), tabs, starts, durs: PH.map(p => p.d), render });
  window.UNIFIED_ROUTE = { render, duration: TOTAL };
}

/* ───────── design path: five steps, each drawn as three forward passes ─────────
   Left: the steps from UNITE to UNIFIED. Right: encode, generate and decode, played in a loop,
   drawn for the selected step, with only gFID and rFID compared to the previous step. */
function designAnim() {
  const root = $('#design');
  if (!root) return;
  const stepsEl = $('#dSteps'), stage = $('#dStage'), condEl = $('#dCond'), metEl = $('#dMetrics'), descEl = $('#dDesc');
  const tabs = $$('.ptabs button', root);
  const W = 560, H = 318, S = 38, P = 54, yIn = 46, yOut = 272, bbY = 88, bbH = 142;
  const COL = ['#C14E51', '#C59291', '#75524D', '#909287'];
  const IMG = 'static/img/patch_source.jpg';
  const R = S / 2 - 1.5;

  // A pass layout: input slots left to right, the lanes that carry content down through
  // the network, and what comes out where. Kinds: m mode token, x patch, z latent, n noisy latent, r readout.
  // span: number of slot positions to lay the pass out on (defaults to its own length), so a shorter
  // pass can sit at the same positions as a longer one in the same step.
  function layout(kind, withMode, span) {
    const s = [], lanes = [], outs = [], ghosts = [];
    const add = (t, k) => s.push({ t, k }) - 1;
    if (withMode) { const mi = add('m'); lanes.push({ a: mi, b: mi, dim: true }); ghosts.push(mi); }
    const four = [0, 1, 2, 3];
    if (kind === 'encR' || kind === 'decR') {
      const enc = kind === 'encR';
      // encode: readouts, then patches. decode: latents, then pixel readouts.
      const A = four.map(k => add(enc ? 'r' : 'z', k)), B = four.map(k => add(enc ? 'x' : 'r', k));
      const reads = enc ? A : B, src = enc ? B : A;
      four.forEach(k => {
        lanes.push({ a: reads[k], b: reads[k], dim: true });
        lanes.push({ a: src[k], b: reads[k] });
        outs.push({ slot: reads[k], t: enc ? 'z' : 'x', k });
        ghosts.push(src[k]);
      });
    } else {
      const src = { encA: 'x', gen: 'n', decA: 'z', decS: 'z' }[kind], dst = { encA: 'z', gen: 'z', decA: 'x', decS: 'x' }[kind];
      four.forEach(k => { const i = add(src, k); lanes.push({ a: i, b: i }); outs.push({ slot: i, t: dst, k }); });
    }
    return { s, lanes, outs, ghosts, span: span || s.length };
  }
  const pass = (lay, o) => ({ lay, net: 'shared', chg: [], ...o });
  const STEPS = [
    { name: 'UNITE', newMode: false,
      desc: '<b>The starting point.</b> One network encodes and generates. Its encoder reads readout tokens drawn from noise beside the image patches, at <i>t</i> = 0. A separate network decodes.',
      alt: 'UNITE. Encode: image patches are routed to readout tokens, where latents come out. Generate: noisy latents map to clean latents. Decode: a separate network maps latents to patches.',
      enc: pass(layout('encR', false), { t: '0', len: 'K + N' }),
      gen: pass(layout('gen', false, 8), { t: 'live', len: 'K' }),
      dec: pass(layout('decS', false), { net: 'separate', t: 'n/a', len: 'n/a' }),
      v: { gfid: 2.23, rfid: 1.41 } },
    { name: 'Fold the decoder in', newMode: true,
      desc: '<b>UNITE++, the naive way to share everything.</b> A mode token selects the pass, and pixel readouts let the same backbone decode at <i>t</i> = 1. Generation holds, but reconstruction is the worst of all models: every image location must be routed through attention to tokens with no fixed position.',
      alt: 'UNITE++. A mode token is added to every pass. Decode now runs in the shared backbone: latents are routed to pixel readout tokens, where patches come out.',
      enc: pass(layout('encR', true), { t: '0', len: '1 + K + N', chg: ['len'] }),
      gen: pass(layout('gen', true, 9), { t: 'live', len: '1 + K', chg: ['len'] }),
      dec: pass(layout('decR', true), { t: '1', len: '1 + K + N', chg: ['net', 't', 'len'] }),
      v: { gfid: 2.24, rfid: 2.20 } },
    { name: 'Align positions', newMode: false,
      desc: '<b>Drop the readout tokens.</b> A patch, its latent, and its noisy latent share one index. Nothing else changes, and reconstruction recovers. gFID gets worse: <i>t</i> = 0 now labels clean image patches as pure noise.',
      alt: 'Aligned positions. Every pass maps each token straight down: patches to latents, noisy latents to latents, latents to patches.',
      enc: pass(layout('encA', true), { t: '0', len: 'N + 1', chg: ['len'] }),
      gen: pass(layout('gen', true), { t: 'live', len: 'N + 1' }),
      dec: pass(layout('decA', true), { t: '1', len: 'N + 1', chg: ['len'] }),
      v: { gfid: 2.31, rfid: 1.39, single: true } },
    { name: 'Encode at t = 1', newMode: false,
      desc: '<b>Match the timestep to what the encoder reads.</b> The patches are fully observed, so encoding belongs at the clean endpoint. Both metrics improve and now beat UNITE.',
      alt: 'Encode at t = 1. Same aligned layout; the encoding pass now runs at the clean endpoint.',
      enc: pass(layout('encA', true), { t: '1', len: 'N + 1', chg: ['t'] }),
      gen: pass(layout('gen', true), { t: 'live', len: 'N + 1' }),
      dec: pass(layout('decA', true), { t: '1', len: 'N + 1' }),
      v: { gfid: 2.15, rfid: 0.97 } },
    { name: 'Learn the decoding timestep', newMode: false,
      desc: '<b>This is UNIFIED.</b> At <i>t</i> = 1, generation outputs a latent and decoding outputs pixels from nearly the same input. Giving decoding its own learned embedding removes the conflict.',
      alt: 'UNIFIED. Same aligned layout; the decoding pass now uses its own learned timestep, written minus one.',
      enc: pass(layout('encA', true), { t: '1', len: 'N + 1' }),
      gen: pass(layout('gen', true), { t: 'live', len: 'N + 1' }),
      dec: pass(layout('decA', true), { t: '−1, learned', len: 'N + 1', chg: ['t'] }),
      v: { gfid: 2.08, rfid: 0.95 } }
  ];
  const PH = [{ k: 'enc', d: 3.6, color: 'var(--enc)' }, { k: 'gen', d: 5, color: 'var(--gen)' }, { k: 'dec', d: 3.6, color: 'var(--dec)' }];
  const TOTAL = PH.reduce((a, p) => a + p.d, 0);
  const starts = PH.map((p, i) => PH.slice(0, i).reduce((a, x) => a + x.d, 0));

  // drawing, in the style of the readout-against-aligned panels
  const tok = {
    m: (x, y, chg, lab) => `<circle class="ls-mode${chg ? ' chg' : ''}" cx="${x}" cy="${y}" r="${R + 1}"/><text class="ls-modet rt-modet" x="${x}" y="${y}">${lab}</text>`,
    x: (x, y, k) => `<svg x="${x - S / 2}" y="${y - S / 2}" width="${S}" height="${S}" viewBox="${(k % 2) * S} ${Math.floor(k / 2) * S} ${S} ${S}"><image href="${IMG}" width="${S * 2}" height="${S * 2}" preserveAspectRatio="none"/></svg><rect class="ls-tok" x="${x - S / 2}" y="${y - S / 2}" width="${S}" height="${S}" rx="3" fill="none"/>`,
    z: (x, y, k) => `<circle class="ls-tok" cx="${x}" cy="${y}" r="${R}" fill="${COL[k]}"/>`,
    n: (x, y, k) => `<circle class="ls-tok" cx="${x}" cy="${y}" r="${R}" fill="${COL[k]}"/><circle class="ls-tok r-noise" cx="${x}" cy="${y}" r="${R}" fill="url(#dHatchN)"/>`,
    r: (x, y) => `<rect class="ls-tok" x="${x - 13}" y="${y - 13}" width="26" height="26" rx="3" fill="url(#dHatchR)" transform="rotate(45 ${x} ${y})"/>`,
    ghost: (x, y) => `<circle class="ls-ghost" cx="${x}" cy="${y}" r="${R - 2}"/>`
  };
  const yT = yIn + S / 2 + 4, yB = yOut - S / 2 - 11, mid = bbY + bbH / 2;
  const lane = (xs, xt, dim) => {
    const d = xs === xt ? `M${xs} ${yT}V${yB}` : `M${xs} ${yT}V${bbY + 16}C${xs} ${mid + 18} ${xt} ${mid - 18} ${xt} ${bbY + bbH - 16}V${yB}`;
    return `<path class="ls-lane r-lane${dim ? ' dim' : ''}" d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`;
  };
  const head = x => `<path class="ls-head r-head" d="M${x - 5} ${yB - 1}h10l-5 8z"/>`;
  const blocks = (x0, w) => {
    const bh = (bbH - 24 - 12) / 3;
    return [0, 1, 2].map(b => `<rect class="ls-blk" x="${x0 + 10}" y="${bbY + 12 + b * (bh + 6)}" width="${w - 20}" height="${bh}" rx="9"/>`).join('');
  };
  function drawPass(st, k) {
    const p = st[k], { s, lanes, outs, ghosts, span } = p.lay, n = s.length;
    const X0 = (W - (span - 1) * P) / 2, cx = i => X0 + P * i;
    let box;
    if (p.net === 'separate') {
      const x0 = cx(0) - S / 2 - 14, w = cx(n - 1) + S / 2 + 14 - x0;
      box = `<rect class="ls-bb sep" x="${x0}" y="${bbY}" width="${w}" height="${bbH}" rx="18"/>${blocks(x0, w)}
        <text class="ls-seplab" x="${x0 - 12}" y="${mid - 6}">Separate</text><text class="ls-seplab" x="${x0 - 12}" y="${mid + 12}">decoder</text>`;
    } else {
      box = `<rect class="ls-bb" x="16" y="${bbY}" width="${W - 32}" height="${bbH}" rx="18"/>${blocks(16, W - 32)}`;
    }
    const lab = { enc: 'Enc', gen: 'Gen', dec: 'Dec' }[k];
    const ins = s.map((o, i) => o.t === 'm' ? tok.m(cx(i), yIn, st.newMode, lab) : tok[o.t](cx(i), yIn, o.k)).join('');
    const ln = lanes.map(l => lane(cx(l.a), cx(l.b), l.dim) + (l.dim ? '' : head(cx(l.b)))).join('');
    const out = outs.map(o => tok[o.t](cx(o.slot), yOut, o.k)).join('') + ghosts.map(i => tok.ghost(cx(i), yOut)).join('');
    return `<g class="r-pass" data-k="${k}">${box}<g class="r-in">${ins}</g>${ln}<g class="r-out">${out}</g></g>`;
  }

  let step = STEPS.length - 1, shown = -1, lastT = 0, passes = [];
  const chip = (label, val, on, id) => `<span class="cchip${on ? ' chg' : ''}"><small>${label}</small><b${id ? ` id="${id}"` : ''}>${val}</b></span>`;
  function paintCond(idx) {
    const k = PH[idx].k, p = STEPS[step][k], c = p.chg;
    condEl.innerHTML = chip('network', p.net === 'separate' ? 'separate decoder' : 'shared', c.includes('net'))
      + chip('<i>t</i>', p.t === 'live' ? '0.00' : p.t, c.includes('t'), p.t === 'live' ? 'dT' : '')
      + chip('length', p.len.replace(/([KN])/g, '<i>$1</i>'), c.includes('len'));
  }
  const delta = (cur, prev, single) => {
    const note = single ? ' · single run' : '';
    if (prev == null) return `<span class="dv">starting point${note}</span>`;
    const d = Math.round((cur - prev) * 100) / 100;
    if (d === 0) return `<span class="dv">no change${note}</span>`;
    const better = d < 0;
    return `<span class="dv ${better ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}, ${better ? 'better' : 'worse'}${note}</span>`;
  };
  function paintMetrics() {
    const v = STEPS[step].v, pv = step ? STEPS[step - 1].v : {};
    metEl.innerHTML = `
      <div class="vm"><small>gFID, lower is better</small><b>${v.gfid.toFixed(2)}</b>${delta(v.gfid, pv.gfid, v.single)}</div>
      <div class="vm"><small>rFID, lower is better</small><b>${v.rfid.toFixed(2)}</b>${delta(v.rfid, pv.rfid)}</div>`;
  }
  function build() {
    const st = STEPS[step];
    stage.innerHTML = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>
        <pattern id="dHatchR" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><rect width="6" height="2.4" fill="#a1a1a6"/></pattern>
        <pattern id="dHatchN" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#ececf0"/><rect width="3" height="7" fill="#a1a1a6"/></pattern>
      </defs>${drawPass(st, 'enc')}${drawPass(st, 'gen')}${drawPass(st, 'dec')}</svg>`;
    stage.setAttribute('aria-label', 'Animated diagram. ' + st.alt);
    passes = $$('.r-pass', stage).map(g => ({
      g, k: g.dataset.k, inn: $('.r-in', g), out: $('.r-out', g), lanes: $$('.r-lane', g), heads: $$('.r-head', g),
      noise: $$('.r-noise', g), blks: $$('.ls-blk', g)
    }));
    descEl.innerHTML = st.desc;
    paintMetrics();
    shown = -1;
  }

  function render(T) {
    lastT = T;
    T = ((T % TOTAL) + TOTAL) % TOTAL;
    let idx = PH.length - 1;
    for (let i = 0; i < PH.length; i++) if (T < starts[i] + PH[i].d) { idx = i; break; }
    const ph = PH[idx], u = (T - starts[idx]) / ph.d;
    const aIn = ease(clamp(u / 0.1)), fade = 1 - clamp((u - 0.94) / 0.06);
    let flow, aOut, t = 1;
    if (ph.k === 'gen') {
      const p = clamp((u - 0.1) / 0.7);
      t = p; flow = p >= 1 ? 1 : (p * 3) % 1;
      aOut = ease(clamp((p - 0.2) / 0.12));
    } else {
      flow = clamp((u - 0.1) / 0.45);
      aOut = ease(clamp((u - 0.55) / 0.15));
    }
    if (shown !== idx) {
      shown = idx;
      stage.style.setProperty('--mode', ph.color);
      tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === idx));
      paintCond(idx);
    }
    tabs.forEach((b, j) => b.style.setProperty('--p', j < idx ? 1 : j === idx ? u : 0));
    const live = $('#dT', condEl);
    if (live) live.textContent = t.toFixed(2);
    passes.forEach(p => {
      const on = p.k === ph.k;
      p.g.style.opacity = on ? fade : 0;
      if (!on) return;
      p.inn.style.opacity = aIn;
      p.out.style.opacity = aOut;
      p.noise.forEach(n => { n.style.opacity = 1 - t; });
      p.lanes.forEach(n => { n.style.strokeDashoffset = 1 - flow; });
      p.heads.forEach(n => { n.style.opacity = flow > 0.97 ? 1 : 0; });
      p.blks.forEach((n, b) => n.classList.toggle('on', flow > 0 && flow < 1 && Math.floor(flow * 3) === b));
    });
  }

  const items = STEPS.map((st, i) => {
    const d = document.createElement('div');
    d.className = 'chip';
    d.innerHTML = `<button type="button" aria-pressed="false"><span class="n">${i + 1}</span>${st.name}</button><p>${st.desc}</p>`;
    $('button', d).addEventListener('click', () => setStep(i));
    stepsEl.appendChild(d);
    return d;
  });
  function setStep(i) {
    step = i;
    items.forEach((d, j) => { d.classList.toggle('on', j === i); $('button', d).setAttribute('aria-pressed', j === i); });
    stepsEl.scrollLeft = items[i].offsetLeft - (stepsEl.clientWidth - items[i].clientWidth) / 2; // keeps the active step in view on phones
    build();
    render(lastT);
  }
  setStep(step);
  player({ watch: stage, btn: $('#dPlay'), tabs, starts, durs: PH.map(p => p.d), render });
  window.UNIFIED_DESIGN = { render, duration: TOTAL, setStep };
}

/* ───────── design path viewer ───────── */
function pathViewer() {
  const chips = $('#chips'), rowsEl = $('#vRows'), metEl = $('#vMetrics');
  if (!chips || !rowsEl || !metEl) return;
  const g = (t, chg) => ({ t, chg: !!chg });
  const m = (text, chg) => ({ text, chg: !!chg });
  const NAMES = { m: 'mode', x: 'img', z: 'lat', n: 'noisy', r: 'read' };
  const STEPS = [
    { name: 'UNITE',
      desc: '<b>The starting point.</b> One network encodes and generates. Its encoder reads readout tokens drawn from noise beside the image patches, at <i>t</i> = 0. A separate network decodes.',
      enc: { in: [g('r'), g('x')], out: 'z', meta: [m('t = 0'), m('length K + N')] },
      gen: { in: [g('n')], out: 'z', meta: [m('t from 0 to 1'), m('length K')] },
      dec: { in: [g('z')], out: 'x', meta: [m('separate decoder network')] },
      v: { gfid: 2.23, rfid: 1.41, is: 282.1 } },
    { name: 'Fold the decoder in',
      desc: '<b>UNITE++, the naive way to share everything.</b> A mode token selects the pass, and pixel readouts let the same backbone decode at <i>t</i> = 1. Generation holds, but reconstruction is the worst of all models: every image location must be routed through attention to tokens with no fixed position.',
      enc: { in: [g('m', 1), g('r'), g('x')], out: 'z', meta: [m('t = 0'), m('length 1 + K + N')] },
      gen: { in: [g('m', 1), g('n')], out: 'z', meta: [m('t from 0 to 1'), m('length 1 + K')] },
      dec: { in: [g('m', 1), g('z'), g('r', 1)], out: 'x', meta: [m('t = 1', 1), m('length 1 + K + N', 1)] },
      v: { gfid: 2.24, rfid: 2.20, is: 327.1 } },
    { name: 'Align positions',
      desc: '<b>Drop the readout tokens.</b> A patch, its latent, and its noisy latent share one index. Nothing else changes, and rFID recovers from 2.20 to 1.39. gFID gets worse: <i>t</i> = 0 now labels clean image patches as pure noise.',
      enc: { in: [g('m'), g('x', 1)], out: 'z', meta: [m('t = 0'), m('length N + 1', 1)] },
      gen: { in: [g('m'), g('n')], out: 'z', meta: [m('t from 0 to 1'), m('length N + 1')] },
      dec: { in: [g('m'), g('z', 1)], out: 'x', meta: [m('t = 1'), m('length N + 1', 1)] },
      v: { gfid: 2.31, rfid: 1.39, is: 300.0, single: true } },
    { name: 'Encode at t = 1',
      desc: '<b>Match the timestep to what the encoder reads.</b> The patches are fully observed, so encoding belongs at the clean endpoint. gFID improves from 2.31 to 2.15 and rFID from 1.39 to 0.97, both now better than UNITE.',
      enc: { in: [g('m'), g('x')], out: 'z', meta: [m('t = 1', 1), m('length N + 1')] },
      gen: { in: [g('m'), g('n')], out: 'z', meta: [m('t from 0 to 1'), m('length N + 1')] },
      dec: { in: [g('m'), g('z')], out: 'x', meta: [m('t = 1'), m('length N + 1')] },
      v: { gfid: 2.15, rfid: 0.97, is: 312.8 } },
    { name: 'Learn the decoding timestep',
      desc: '<b>This is UNIFIED.</b> At <i>t</i> = 1, generation outputs a latent and decoding outputs pixels from nearly the same input. Giving decoding its own learned embedding removes the conflict.',
      enc: { in: [g('m'), g('x')], out: 'z', meta: [m('t = 1'), m('length N + 1')] },
      gen: { in: [g('m'), g('n')], out: 'z', meta: [m('t from 0 to 1'), m('length N + 1')] },
      dec: { in: [g('m'), g('z')], out: 'x', meta: [m('t = −1, learned', 1), m('length N + 1')] },
      v: { gfid: 2.08, rfid: 0.95, is: 314.4 } }
  ];
  const toks = (t, n) => `<i class="tk tk-${NAMES[t]}"></i>`.repeat(n);
  const grp = o => `<span class="vgrp${o.chg ? ' chg' : ''}">${toks(o.t, o.t === 'm' ? 1 : 4)}</span>`;
  const row = (label, dot, r) => `<div class="vrow">
      <span class="vrow-name"><i class="dot dot-${dot}"></i>${label}</span>
      <span class="vseq">${r.in.map(grp).join('')}<span class="varrow" aria-hidden="true">→</span><span class="vgrp">${toks(r.out, 4)}</span></span>
      <span class="vmeta">${r.meta.map(x => `<span class="${x.chg ? 'chg' : ''}">${x.text}</span>`).join('')}</span>
    </div>`;
  const delta = (cur, prev, digits) => {
    if (prev == null) return 'starting point';
    const d = cur - prev, sign = d > 0 ? '+' : d < 0 ? '−' : '±';
    return `${sign}${Math.abs(d).toFixed(digits)} from previous`;
  };

  const desc = document.createElement('p');
  desc.className = 'vdesc'; desc.id = 'vDesc';
  rowsEl.before(desc);

  const items = STEPS.map((st, i) => {
    const d = document.createElement('div');
    d.className = 'chip';
    d.innerHTML = `<button type="button" aria-pressed="false"><span class="n">${i + 1}</span>${st.name}</button><p>${st.desc}</p>`;
    $('button', d).addEventListener('click', () => show(i));
    chips.appendChild(d);
    return d;
  });

  function show(i) {
    const st = STEPS[i], pv = i ? STEPS[i - 1].v : {};
    items.forEach((d, j) => { d.classList.toggle('on', j === i); $('button', d).setAttribute('aria-pressed', j === i); });
    chips.scrollLeft = items[i].offsetLeft - (chips.clientWidth - items[i].clientWidth) / 2; // keeps the active step in view on phones
    desc.innerHTML = st.desc;
    rowsEl.innerHTML = row('Encode', 'enc', st.enc) + row('Generate', 'gen', st.gen) + row('Decode', 'dec', st.dec);
    metEl.innerHTML = `
      <div class="vm"><small>gFID, lower is better</small><b>${st.v.gfid.toFixed(2)}</b><span>${st.v.single ? 'single run · ' : ''}${delta(st.v.gfid, pv.gfid, 2)}</span></div>
      <div class="vm"><small>rFID, lower is better</small><b>${st.v.rfid.toFixed(2)}</b><span>${delta(st.v.rfid, pv.rfid, 2)}</span></div>
      <div class="vm"><small>Inception Score, higher is better</small><b>${st.v.is.toFixed(1)}</b><span>${delta(st.v.is, pv.is, 1)}</span></div>`;
  }
  show(STEPS.length - 1);
}

/* ───────── charts ───────── */
const tip = {
  el: null,
  show(html, x, y) {
    this.el = this.el || $('#tip');
    this.el.innerHTML = html; this.el.hidden = false;
    this.el.style.left = clamp(x, 130, innerWidth - 130) + 'px';
    this.el.style.top = y + 'px';
  },
  hide() { if (this.el) this.el.hidden = true; }
};
const onResize = (el, fn) => {
  let w = 0;
  const run = () => { const nw = el.clientWidth; if (nw && nw !== w) { w = nw; fn(nw); } };
  if ('ResizeObserver' in window) new ResizeObserver(run).observe(el); else addEventListener('resize', run);
  run();
};

function chartSizes() {
  const el = $('#chartSizes');
  if (!el) return;
  const ROWS = [
    { k: 'Tiny',  a: 3.00, sa: 0.030, pa: '61M',  b: 2.78, sb: 0.025, pb: '62M' },
    { k: 'Small', a: 2.76, sa: 0.020, pa: '117M', b: 2.43, sb: 0.012, pb: '116M' },
    { k: 'Base',  a: 2.23, sa: 0.019, pa: '217M', b: 2.08, sb: 0.025, pb: '215M' }
  ];
  const TICKS = [2, 2.25, 2.5, 2.75, 3];
  const cA = css('--s-unite'), cB = css('--s-unified');
  onResize(el, w => {
    const small = w < 520, padL = small ? 62 : 132, padR = 46, top = 6, rowH = 66;
    const h = top + ROWS.length * rowH + 30, x0 = padL, x1 = w - padR;
    const sx = v => x0 + (v - 1.95) / (3.1 - 1.95) * (x1 - x0);
    let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    TICKS.forEach(t => {
      s += `<line class="grid" x1="${sx(t)}" x2="${sx(t)}" y1="${top}" y2="${h - 26}"/><text x="${sx(t)}" y="${h - 8}" text-anchor="middle">${t.toFixed(2)}</text>`;
    });
    ROWS.forEach((r, i) => {
      const y = top + rowH * i + rowH / 2, xa = sx(r.a), xb = sx(r.b);
      s += `<text class="rowlab" x="0" y="${y - 2}">${r.k}</text><text x="0" y="${y + 15}">${small ? r.pb : 'about ' + r.pb}</text>`;
      s += `<line x1="${xb}" x2="${xa}" y1="${y}" y2="${y}" stroke="${css('--hair')}" stroke-width="4" stroke-linecap="round"/>`;
      s += `<text x="${(xa + xb) / 2}" y="${y - 12}" text-anchor="middle">−${(r.a - r.b).toFixed(2)}</text>`;
      s += `<circle cx="${xa}" cy="${y}" r="7" fill="${cA}" stroke="#fff" stroke-width="2"/><text class="val" x="${xa + 13}" y="${y + 4}">${r.a.toFixed(2)}</text>`;
      s += `<circle cx="${xb}" cy="${y}" r="7" fill="${cB}" stroke="#fff" stroke-width="2"/><text class="val" x="${xb - 13}" y="${y + 4}" text-anchor="end">${r.b.toFixed(2)}</text>`;
      s += `<circle class="hit" data-t="<b>UNITE, ${r.pa}</b><span>gFID ${r.a.toFixed(2)} ± ${r.sa.toFixed(3)}, five seeds</span>" cx="${xa}" cy="${y}" r="18" fill="transparent"/>`;
      s += `<circle class="hit" data-t="<b>UNIFIED, ${r.pb}</b><span>gFID ${r.b.toFixed(2)} ± ${r.sb.toFixed(3)}, five seeds</span>" cx="${xb}" cy="${y}" r="18" fill="transparent"/>`;
    });
    el.innerHTML = s + '</svg>';
    $$('.hit', el).forEach(c => {
      c.addEventListener('pointerenter', () => { const b = c.getBoundingClientRect(); tip.show(c.dataset.t, b.left + b.width / 2, b.top + 8); });
      c.addEventListener('pointerleave', () => tip.hide());
    });
  });
}

function lineChart(el, getCfg) {
  let width = 0;
  const draw = () => {
    const cfg = getCfg(), w = width, h = cfg.h || 320, mg = cfg.mg || { l: 38, r: 46, t: 12, b: 46 };
    const rad = cfg.r || 4.5, yName = cfg.yName || 'gFID';
    const x0 = mg.l, x1 = w - mg.r, y0 = h - mg.b, y1 = mg.t;
    const tx = v => cfg.log ? Math.log2(v) : v;
    const sx = v => x0 + (tx(v) - tx(cfg.xDomain[0])) / (tx(cfg.xDomain[1]) - tx(cfg.xDomain[0])) * (x1 - x0);
    const sy = v => y0 + (v - cfg.yDomain[0]) / (cfg.yDomain[1] - cfg.yDomain[0]) * (y1 - y0);
    let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
    cfg.yTicks.forEach(t => { s += `<line class="grid" x1="${x0}" x2="${x1}" y1="${sy(t)}" y2="${sy(t)}"/><text x="${x0 - 8}" y="${sy(t) + 4}" text-anchor="end">${t}</text>`; });
    s += `<line class="axis" x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}"/>`;
    cfg.xTicks.forEach(t => { s += `<text x="${sx(t)}" y="${y0 + 18}" text-anchor="middle">${t}</text>`; });
    s += `<text x="${(x0 + x1) / 2}" y="${h - 4}" text-anchor="middle">${cfg.xLabel}</text>`;
    const pts = [];
    cfg.series.forEach(se => {
      const p = se.pts.filter(d => d[1] != null);
      s += `<path d="${p.map((d, i) => (i ? 'L' : 'M') + sx(d[0]).toFixed(1) + ' ' + sy(d[1]).toFixed(1)).join('')}" fill="none" stroke="${se.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      p.forEach(d => {
        s += `<circle cx="${sx(d[0])}" cy="${sy(d[1])}" r="${rad}" fill="${se.color}" stroke="#fff" stroke-width="${rad > 4 ? 2 : 1.5}"/>`;
        pts.push({ x: sx(d[0]), y: sy(d[1]), d, se });
      });
    });
    cfg.series.filter(se => se.label).forEach(se => {
      const d = se.pts.filter(v => v[1] != null).pop();
      s += `<text class="val halo" x="${sx(d[0]) + 9}" y="${sy(d[1]) + 4}">${d[1].toFixed(2)}</text>`;
    });
    s += `<circle class="hl" r="7.5" fill="none" stroke="${css('--ink')}" stroke-width="2" opacity="0"/>`;
    s += `<rect class="hover" x="0" y="0" width="${w}" height="${h}" fill="transparent"/></svg>`;
    el.innerHTML = s;
    const hl = $('.hl', el), hov = $('.hover', el);
    hov.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect(), px = e.clientX - b.left, py = e.clientY - b.top;
      let best = null, bd = 1e9;
      pts.forEach(p => { const dd = (p.x - px) ** 2 + (p.y - py) ** 2; if (dd < bd) { bd = dd; best = p; } });
      if (!best || bd > 60 * 60) { hl.setAttribute('opacity', 0); tip.hide(); return; }
      hl.setAttribute('cx', best.x); hl.setAttribute('cy', best.y); hl.setAttribute('opacity', 1);
      tip.show(`<b>${best.se.name}</b><span>${cfg.xFmt(best.d[0])} · ${yName} ${best.d[1].toFixed(2)}</span>`, b.left + best.x, b.top + best.y);
    });
    hov.addEventListener('pointerleave', () => { hl.setAttribute('opacity', 0); tip.hide(); });
  };
  onResize(el, w => { width = w; draw(); });
  return () => { if (width) draw(); };
}

function budgetCharts() {
  const C = { u: css('--s-unified'), u2: css('--s-unified2'), unite: css('--s-unite'), pp: css('--s-unitepp') };
  // Same data as the paper's budget figures (utils/draw_train_budget.py, utils/draw_nfe_flops.py).
  const EPOCHS = [40, 80, 100, 120, 160, 200];
  const U = 'UNIFIED, t_dec = −1', U2 = 'UNIFIED, t_dec = 1';
  const LEVELS = {
    tiny: {
      sub: 'Tiny, about 62M parameters',
      yDomain: [2.6, 4.7], yTicks: [3, 3.5, 4, 4.5], fDomain: [20, 310], fTicks: [100, 200, 300],
      series: [
        { name: 'UNITE (2:1)', color: C.unite, ef: 1.09, y: [4.49, 3.57, 3.42, 3.30, 3.14, 3.00], label: true },
        { name: U2, color: C.u2, ef: 1.47, y: [4.15, 3.40, 3.08, 3.06, 2.94, 2.75] },
        { name: U, color: C.u, ef: 1.47, y: [4.16, 3.27, 3.11, 3.03, 2.91, 2.78], label: true }
      ]
    },
    small: {
      sub: 'Small, about 116M parameters',
      yDomain: [2.28, 4.25], yTicks: [2.5, 3, 3.5, 4], fDomain: [30, 540], fTicks: [100, 200, 300, 400, 500],
      series: [
        { name: 'UNITE', color: C.unite, ef: 1.48, y: [4.06, 3.29, 3.16, 3.06, 2.91, 2.76], label: true },
        { name: U2, color: C.u2, ef: 2.54, y: [3.48, 2.83, 2.69, 2.59, 2.49, 2.41] },
        { name: U, color: C.u, ef: 2.54, y: [3.71, 2.97, 2.78, 2.65, 2.55, 2.43], label: true }
      ]
    },
    base: {
      sub: 'Base, about 215M parameters',
      yDomain: [1.98, 3.32], yTicks: [2, 2.25, 2.5, 2.75, 3, 3.25], fDomain: [60, 1100], fTicks: [300, 600, 900],
      series: [
        { name: 'UNITE++', color: C.pp, ef: 5.17, y: [2.83, 2.46, null, 2.42, 2.35, 2.24] },
        { name: 'UNITE', color: C.unite, ef: 3.04, y: [2.96, 2.46, null, 2.26, 2.23, 2.23], label: true },
        { name: U2, color: C.u2, ef: 4.55, y: [3.24, 2.73, 2.46, 2.42, 2.24, 2.15] },
        { name: U, color: C.u, ef: 4.55, y: [2.89, 2.35, 2.26, 2.22, 2.15, 2.08], label: true }
      ]
    }
  };
  const NFE = [16, 32, 64, 128, 256];
  const SAMPLE = [
    { name: 'UNITE++', color: C.pp, g: 81.7, y: [3.13, 2.57, 2.38, 2.316, 2.28] },
    { name: 'UNITE', color: C.unite, g: 50.1, y: [3.858, 2.856, 2.497, 2.349, 2.265], label: true },
    { name: U2, color: C.u2, g: 81.7, y: [3.319, 2.455, 2.197, 2.108, 2.086] },
    { name: U, color: C.u, g: 81.7, y: [3.396, 2.504, 2.23, 2.137, 2.12], label: true }
  ];
  const state = { chartTrain: { x: 'epoch', level: 'base' }, chartSample: { x: 'nfe' } };
  const cfgTrain = () => {
    const L = LEVELS[state.chartTrain.level], flops = state.chartTrain.x === 'flops';
    return {
      xDomain: flops ? L.fDomain : [30, 210], xTicks: flops ? L.fTicks : [40, 80, 120, 160, 200],
      xLabel: flops ? 'Training EFLOPs (10¹⁸ FLOPs)' : 'Training epochs',
      xFmt: flops ? v => `${Math.round(v)} EFLOPs` : v => `epoch ${v}`,
      yDomain: L.yDomain, yTicks: L.yTicks,
      series: L.series.map(s => ({ ...s, pts: EPOCHS.map((e, i) => [flops ? e * s.ef : e, s.y[i]]) }))
    };
  };
  const cfgSample = () => state.chartSample.x === 'nfe' ? {
    log: true, xDomain: [13, 310], xTicks: NFE, xLabel: 'Sampling steps (NFE)', xFmt: v => `${v} steps`,
    yDomain: [1.95, 4], yTicks: [2, 2.5, 3, 3.5, 4],
    series: SAMPLE.map(s => ({ ...s, pts: NFE.map((n, i) => [n, s.y[i]]) }))
  } : {
    log: true, xDomain: [0.65, 27], xTicks: [1, 2, 4, 8, 16], xLabel: 'Sampling TFLOPs per image', xFmt: v => `${v.toFixed(1)} TFLOPs`,
    yDomain: [1.95, 4], yTicks: [2, 2.5, 3, 3.5, 4],
    series: SAMPLE.map(s => ({ ...s, pts: NFE.map((n, i) => [n * s.g / 1000, s.y[i]]) }))
  };
  const redraw = {};
  const a = $('#chartTrain'), b = $('#chartSample'), sub = $('#trainSub');
  if (a) redraw.chartTrain = lineChart(a, cfgTrain);
  if (b) redraw.chartSample = lineChart(b, cfgSample);
  $$('.seg[data-for]').forEach(seg => {
    const id = seg.dataset.for, key = seg.dataset.key || 'x';
    $$('button', seg).forEach(btn => btn.addEventListener('click', () => {
      state[id][key] = btn.dataset.v;
      $$('button', seg).forEach(o => o.setAttribute('aria-pressed', o === btn));
      if (key === 'level' && sub) sub.textContent = LEVELS[btn.dataset.v].sub;
      redraw[id] && redraw[id]();
    }));
  });
}

/* ───────── CKA small multiples ───────── */
function ckaCharts() {
  const grid = $('#ckaGrid');
  if (!grid) return;
  const C = { u: css('--s-unified'), u2: css('--s-unified2'), unite: css('--s-unite'), pp: css('--s-unitepp') };
  // Debiased per-image CKA, encoding pass against generation pass, blocks 1 to 12
  // (exp_results/cka_multiview_v3.csv; the same series as the paper's figure, without the separate baseline).
  const D = {"0.7":{"unite":[0.096,0.08,0.069,0.082,0.077,0.437,0.415,0.645,0.651,0.771,0.838,0.881],"pp":[0.075,0.09,0.084,0.149,0.076,0.334,0.305,0.335,0.46,0.51,0.584,0.866],"u2":[0.482,0.543,0.658,0.711,0.686,0.687,0.72,0.747,0.763,0.813,0.838,0.779],"u":[0.482,0.53,0.624,0.707,0.712,0.735,0.752,0.766,0.789,0.809,0.84,0.875]},"0.9":{"unite":[0.093,0.073,0.057,0.061,0.059,0.409,0.374,0.613,0.608,0.743,0.883,0.918],"pp":[0.07,0.081,0.073,0.095,0.047,0.309,0.266,0.269,0.366,0.541,0.564,0.898],"u2":[0.493,0.53,0.644,0.687,0.672,0.666,0.693,0.715,0.726,0.782,0.809,0.807],"u":[0.484,0.518,0.609,0.691,0.696,0.717,0.745,0.759,0.775,0.785,0.823,0.928]},"0.99":{"unite":[0.093,0.07,0.053,0.054,0.053,0.401,0.363,0.603,0.599,0.734,0.882,0.922],"pp":[0.08,0.098,0.081,0.099,0.054,0.321,0.275,0.278,0.348,0.509,0.547,0.635],"u2":[0.504,0.53,0.637,0.683,0.672,0.664,0.691,0.711,0.723,0.778,0.806,0.81],"u":[0.508,0.518,0.592,0.676,0.684,0.705,0.734,0.749,0.761,0.766,0.816,0.929]},"0.995":{"unite":[0.093,0.07,0.053,0.053,0.053,0.4,0.362,0.602,0.598,0.733,0.882,0.922],"pp":[0.081,0.1,0.082,0.101,0.056,0.324,0.278,0.281,0.35,0.506,0.544,0.582],"u2":[0.517,0.554,0.669,0.717,0.7,0.694,0.718,0.74,0.748,0.816,0.88,0.369],"u":[0.534,0.537,0.602,0.686,0.696,0.716,0.738,0.752,0.761,0.765,0.818,0.921]}};
  const S = [['pp', 'UNITE++', C.pp], ['unite', 'UNITE', C.unite], ['u2', 'UNIFIED, t_dec = 1', C.u2, true], ['u', 'UNIFIED, t_dec = −1', C.u, true]];
  Object.keys(D).forEach(t => {
    const box = document.createElement('div');
    box.className = 'cka-p';
    box.innerHTML = `<p class="cka-t">t = ${t}</p><div class="cx"></div>`;
    grid.appendChild(box);
    lineChart($('.cx', box), () => ({
      h: 236, mg: { l: 30, r: 34, t: 8, b: 42 }, r: 3.5, yName: 'CKA',
      xDomain: [0.4, 12.6], xTicks: [2, 4, 6, 8, 10, 12], xLabel: 'Block', xFmt: v => `block ${v}`,
      yDomain: [0, 1], yTicks: [0, 0.25, 0.5, 0.75, 1],
      series: S.map(([k, name, color, label]) => ({ name, color, label, pts: D[t][k].map((v, i) => [i + 1, v]) }))
    }));
  });
}

/* ───────── faq, bibtex ───────── */
function faq() {
  const all = $('#faqAll'), items = $$('#faqList details');
  if (!all) return;
  all.addEventListener('click', () => {
    const open = all.getAttribute('aria-expanded') !== 'true';
    items.forEach(d => { d.open = open; });
    all.setAttribute('aria-expanded', open);
    all.textContent = open ? 'Collapse all' : 'Expand all';
  });
}
function bib() {
  const btn = $('#bibCopy'), pre = $('#bibText');
  if (!btn || !pre) return;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(pre.textContent); btn.textContent = 'Copied'; }
    catch { btn.textContent = 'Select and copy'; }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
  });
}

/* ───────── 512×512 table: match the 256×256 table's column widths ───────── */
function t2iCols() {
  const src = $('.t2i-t'), dst = $('.t2i-512');
  if (!src || !dst) return;
  const cols = dst.querySelectorAll('col');
  const run = () => {
    const cells = src.tBodies[0].rows[0].cells;
    let total = 0;
    cols.forEach((c, i) => { const w = cells[i].getBoundingClientRect().width; c.style.width = w + 'px'; total += w; });
    dst.style.tableLayout = 'fixed';
    dst.style.width = total + 'px';
  };
  run();
  if ('ResizeObserver' in window) new ResizeObserver(run).observe(src); else addEventListener('resize', run);
}

const boot = () => [reveal, nav, highlights, mergeAnim, layoutAnim, routeAnim, designAnim, pathViewer, chartSizes, budgetCharts, ckaCharts, t2iCols, faq, bib].forEach(f => {
  try { f(); } catch (err) { console.error(f.name, err); }
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
