/* Audio Pulse — 界面跟着电脑正在播放的声音动：光标粒子轨迹 / 节拍冲击波 / 边缘辉光 / 底部频谱 */
const plugin = {
  id: 'audio-pulse',
  name: 'Audio Pulse',
  version: '1.0.0',
  author: 'Starline',
  description: 'Cursor trails, beat shockwaves, edge glow and a spectrum that react to the sound playing on your PC. Also works with a local audio file.',
  permissions: ['audio', 'storage'],

  activate(api) {
    API = api;
    load(api);
    boot();
    startSource();
  },

  render(container, api) {
    API = api;
    load(api);
    container.textContent = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;max-width:620px';

    function row(label, control, hint) {
      const r = document.createElement('div');
      r.className = 'ui-row plugin-set-row';
      const l = document.createElement('div');
      l.className = 'ui-row-label plugin-set-label';
      l.textContent = label;
      if (hint) {
        const h = document.createElement('div');
        h.style.cssText = 'font-size:11px;color:var(--text-3);font-weight:400;margin-top:2px';
        h.textContent = hint;
        l.appendChild(h);
      }
      const c = document.createElement('div');
      c.className = 'ui-controls';
      c.appendChild(control);
      r.append(l, c);
      return r;
    }
    function toggle(key, after) {
      const label = document.createElement('label');
      label.className = 'bg-switch';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.checked = !!cfg[key];
      input.addEventListener('change', () => { cfg[key] = input.checked; api.setConfig('settings.' + key, cfg[key]); if (after) after(); });
      label.append(input, document.createElement('span'));
      return label;
    }

    /* 状态 */
    statusEl = document.createElement('div');
    statusEl.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:var(--surface-2);font-size:12.5px;color:var(--text-2);margin-bottom:8px';
    paintStatus();

    /* 来源 */
    const src = document.createElement('select');
    src.className = 'ui-input';
    [['system', 'System audio (what you hear)'], ['file', 'Local audio file']].forEach(([v, t]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = t; src.appendChild(o);
    });
    src.value = cfg.source;
    const fileBox = document.createElement('div');
    fileBox.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin:4px 0 8px';
    function paintFileBox() {
      fileBox.textContent = '';
      fileBox.style.display = cfg.source === 'file' ? 'flex' : 'none';
      if (cfg.source !== 'file') return;
      const pick = document.createElement('input');
      pick.type = 'file'; pick.accept = 'audio/*';
      pick.addEventListener('change', () => { if (pick.files && pick.files[0]) loadFile(pick.files[0]); paintFileBox(); });
      fileBox.appendChild(pick);
      if (fileState.audio) { fileState.audio.controls = true; fileState.audio.style.cssText = 'width:100%'; fileBox.appendChild(fileState.audio); }
    }
    src.addEventListener('change', () => {
      cfg.source = src.value; api.setConfig('settings.source', cfg.source);
      paintFileBox(); startSource();
    });

    /* 强度 / 帧率 */
    const inBox = document.createElement('div');
    inBox.style.cssText = 'display:flex;align-items:center;gap:10px;min-width:220px';
    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = 0.3; inp.max = 2; inp.step = 0.1; inp.value = cfg.intensity; inp.style.flex = '1';
    const inOut = document.createElement('span');
    inOut.style.cssText = 'min-width:40px;text-align:right;font:600 12px var(--font-mono,monospace);color:var(--text-2)';
    inOut.textContent = '×' + Number(cfg.intensity).toFixed(1);
    inp.addEventListener('input', () => { cfg.intensity = Number(inp.value); inOut.textContent = '×' + cfg.intensity.toFixed(1); api.setConfig('settings.intensity', cfg.intensity); });
    inBox.append(inp, inOut);

    const fps = document.createElement('select');
    fps.className = 'ui-input';
    [[30, '30 FPS (light)'], [60, '60 FPS (smooth)']].forEach(([v, t]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = t; fps.appendChild(o);
    });
    fps.value = String(cfg.fps);
    fps.addEventListener('change', () => { cfg.fps = Number(fps.value); api.setConfig('settings.fps', cfg.fps); });

    const prev = document.createElement('button');
    prev.type = 'button'; prev.className = 'btn btn-ghost'; prev.textContent = 'Preview (6 s)';
    prev.addEventListener('click', () => preview());

    wrap.append(
      statusEl,
      row('Audio source', src),
      fileBox,
      row('Intensity', inBox),
      row('Frame rate', fps, 'Lower is lighter while gaming'),
      row('Cursor trail', toggle('trail')),
      row('Beat shockwave', toggle('wave')),
      row('Edge glow', toggle('glow')),
      row('Spectrum bars', toggle('bars')),
      row('Try the effects', prev, 'Plays a built-in demo pattern')
    );
    container.appendChild(wrap);
    paintFileBox();
  },

  deactivate(api) {
    shutdown();
    API = null;
  }
};

/* ═════════ 配置 / 状态 ═════════ */
const DEF = { source: 'system', intensity: 1, fps: 60, trail: true, wave: true, glow: true, bars: true };
const cfg = Object.assign({}, DEF);
let API = null, canvas = null, ctx = null, W = 0, H = 0, dpr = 1;
let raf = 0, lastTs = 0, lastDraw = 0, hooks = [], colorTimer = 0, stopFn = null, fileTimer = 0, demoTimer = 0;
let statusEl = null, status = 'idle', statusErr = '';
const bandsT = new Float32Array(32), bandsV = new Float32Array(32);
const S = { level: 0, bass: 0, mid: 0, treble: 0, lastFrameAt: 0, avgBass: 0, beatAt: 0 };
const mouse = { x: -1, y: -1, t: 0 };
let particles = [], waves = [];
let colors = { a: [59, 130, 246], b: [96, 165, 250], c: [147, 197, 253] };
const fileState = { audio: null, ctx: null, analyser: null, srcNode: null, url: '', arr: null };

function load(api) {
  Object.keys(DEF).forEach(k => { cfg[k] = api.getConfig('settings.' + k, DEF[k]); });
}

/* ═════════ 状态文字 ═════════ */
function setStatus(s, e) { status = s; statusErr = e || ''; paintStatus(); }
function paintStatus() {
  if (!statusEl || !statusEl.isConnected) return;
  const map = {
    idle: ['#9ca3af', 'Idle'],
    waiting: ['#fbbf24', 'Connecting to system audio…'],
    live: ['#34d399', cfg.source === 'file' ? 'Playing local file' : 'Listening to system audio'],
    unsupported: ['#f87171', 'This version of the app has no system-audio capture. Update the app, or use a local audio file.'],
    error: ['#f87171', statusErr === 'NODEVICE' ? 'No audio output device found.' : 'Audio error: ' + statusErr]
  };
  const m = map[status] || map.idle;
  statusEl.textContent = '';
  const dot = document.createElement('i');
  dot.style.cssText = 'width:8px;height:8px;border-radius:50%;flex:0 0 auto;background:' + m[0] + ';box-shadow:0 0 8px ' + m[0];
  const t = document.createElement('span');
  t.textContent = m[1];
  statusEl.append(dot, t);
}

/* ═════════ 画布 ═════════ */
function boot() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.setAttribute('data-audio-pulse', '1');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147482000';
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  on(window, 'resize', resize);
  on(document, 'pointermove', onPointer, { passive: true });
  on(document, 'visibilitychange', () => { if (document.hidden) stopLoop(); else wake(); });
  readColors();
  colorTimer = setInterval(readColors, 1500);        /* 主题 / 皮肤切换后跟着换色 */
}

function shutdown() {
  stopSource();
  stopFile(true);
  clearInterval(demoTimer); demoTimer = 0;
  clearInterval(colorTimer); colorTimer = 0;
  stopLoop();
  hooks.forEach(h => h.t.removeEventListener(h.n, h.f, h.o));
  hooks = [];
  if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  canvas = null; ctx = null;
  particles = []; waves = [];
  statusEl = null;
}

function on(t, n, f, o) { t.addEventListener(n, f, o); hooks.push({ t, n, f, o }); }

function resize() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function parseColor(v) {
  v = String(v || '').trim();
  let m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
  m = /^#([0-9a-f]{3})$/i.exec(v);
  if (m) return m[1].split('').map(c => parseInt(c + c, 16));
  m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(v);
  if (m) return [+m[1], +m[2], +m[3]];
  return null;
}
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const a = parseColor(cs.getPropertyValue('--accent')), b = parseColor(cs.getPropertyValue('--accent-2')), c = parseColor(cs.getPropertyValue('--accent-3'));
  if (a) colors.a = a;
  colors.b = b || colors.a;
  colors.c = c || colors.b;
}
const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';

/* ═════════ 音频来源 ═════════ */
function startSource() {
  stopSource();
  if (cfg.source === 'file') { startFile(); return; }
  stopFile(false);
  if (!API || !API.audio || typeof API.audio.start !== 'function') { setStatus('unsupported'); return; }
  try {
    stopFn = API.audio.start(onFrame, { onStatus: (s, e) => setStatus(s, e) });
  } catch (e) {
    setStatus('error', e && e.message ? e.message : 'failed');
  }
}
function stopSource() {
  if (stopFn) { try { stopFn(); } catch (e) {} stopFn = null; }
  setStatus('idle');
}

/* 一帧到达（系统音频或本地文件共用）：f = {bands(0..255)[32], level, bass, mid, treble, beat} */
function onFrame(f) {
  for (let i = 0; i < 32; i++) bandsT[i] = (f.bands[i] || 0) / 255;
  S.level = f.level; S.bass = f.bass; S.mid = f.mid; S.treble = f.treble;
  S.lastFrameAt = performance.now();
  if (f.beat) onBeat();
  wake();
}

function shapeFrame(bands255, level) {          /* 本地文件 / 预览：自己算 bass/mid/treble 和节拍 */
  let b = 0, m = 0, t = 0, i;
  for (i = 0; i < 6; i++) b += bands255[i]; b /= 6 * 255;
  for (i = 6; i < 19; i++) m += bands255[i]; m /= 13 * 255;
  for (i = 19; i < 32; i++) t += bands255[i]; t /= 13 * 255;
  const now = performance.now();
  S.avgBass += (b - S.avgBass) * 0.08;
  const beat = b > 0.22 && b > S.avgBass * 1.35 && now - S.beatAt > 180;
  if (beat) S.beatAt = now;
  return { bands: bands255, level: level, bass: b, mid: m, treble: t, beat: beat };
}

/* ── 本地文件 ── */
function loadFile(file) {
  if (fileState.url) URL.revokeObjectURL(fileState.url);
  fileState.url = URL.createObjectURL(file);
  if (!fileState.audio) {
    fileState.audio = document.createElement('audio');
    fileState.audio.addEventListener('play', () => { if (cfg.source === 'file') startFile(); });
  }
  fileState.audio.src = fileState.url;
  fileState.audio.load();
}
function startFile() {
  if (!fileState.audio) { setStatus('idle'); return; }
  try {
    if (!fileState.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      fileState.ctx = new AC();
      fileState.analyser = fileState.ctx.createAnalyser();
      fileState.analyser.fftSize = 2048;
      fileState.analyser.smoothingTimeConstant = 0.6;
      fileState.arr = new Uint8Array(fileState.analyser.frequencyBinCount);
      fileState.srcNode = fileState.ctx.createMediaElementSource(fileState.audio);
      fileState.srcNode.connect(fileState.analyser);
      fileState.analyser.connect(fileState.ctx.destination);
    }
    if (fileState.ctx.state === 'suspended') fileState.ctx.resume();
  } catch (e) { setStatus('error', e.message); return; }
  clearInterval(fileTimer);
  const sr = fileState.ctx.sampleRate, binHz = sr / fileState.analyser.fftSize;
  const edges = [];
  for (let i = 0; i <= 32; i++) edges.push(40 * Math.pow(16000 / 40, i / 32));
  fileTimer = setInterval(() => {
    if (!fileState.audio || fileState.audio.paused) { onFrame(shapeFrame(new Uint8Array(32), 0)); return; }
    fileState.analyser.getByteFrequencyData(fileState.arr);
    const out = new Uint8Array(32);
    let sum = 0;
    for (let i = 0; i < 32; i++) {
      const lo = Math.max(1, Math.floor(edges[i] / binHz)), hi = Math.max(lo, Math.floor(edges[i + 1] / binHz));
      let m = 0;
      for (let k = lo; k <= hi && k < fileState.arr.length; k++) if (fileState.arr[k] > m) m = fileState.arr[k];
      out[i] = m; sum += m;
    }
    onFrame(shapeFrame(out, Math.min(1, sum / (32 * 255) * 1.6)));
  }, 33);
  setStatus('live');
}
function stopFile(full) {
  clearInterval(fileTimer); fileTimer = 0;
  if (full && fileState.audio) { try { fileState.audio.pause(); } catch (e) {} }
}

/* ── 预览：合成一段带鼓点的频谱，6 秒 ── */
function preview() {
  clearInterval(demoTimer);
  const t0 = performance.now();
  demoTimer = setInterval(() => {
    const t = (performance.now() - t0) / 1000;
    if (t > 6) { clearInterval(demoTimer); demoTimer = 0; return; }
    const kick = Math.pow(Math.max(0, Math.cos((t % 0.5) / 0.5 * Math.PI)), 6);        /* 120 BPM 的鼓点 */
    const out = new Uint8Array(32);
    let sum = 0;
    for (let i = 0; i < 32; i++) {
      const low = Math.exp(-i / 6) * kick;
      const wob = 0.25 + 0.25 * Math.sin(t * 3 + i * 0.5) + 0.2 * Math.sin(t * 7.3 + i * 1.3);
      const v = Math.max(0, Math.min(1, low * 0.95 + wob * (0.25 + i / 60)));
      out[i] = Math.round(v * 255); sum += out[i];
    }
    onFrame(shapeFrame(out, sum / (32 * 255) * 1.8));
  }, 33);
}

/* ═════════ 事件：节拍 / 鼠标 ═════════ */
function onBeat() {
  if (!cfg.wave) return;
  const now = performance.now();
  const hasMouse = mouse.x >= 0 && now - mouse.t < 4000;
  const x = hasMouse ? mouse.x : W / 2, y = hasMouse ? mouse.y : H * 0.8;
  waves.push({ x, y, r: 6, max: (110 + S.bass * 190) * cfg.intensity, a: 0.55 });
  if (waves.length > 8) waves.shift();
  burst(x, y, 12);
}

function onPointer(e) {
  const now = performance.now();
  if (mouse.x >= 0 && cfg.trail && now - S.lastFrameAt < 800 && S.level > 0.02) {
    const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 3) spawn(e.clientX, e.clientY, dist);
  }
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = now;
}

function pickColor() {
  const r = Math.random();
  return r < 0.5 ? colors.a : (r < 0.8 ? colors.b : colors.c);
}
function spawn(x, y, dist) {
  const n = Math.min(6, 1 + Math.floor(dist / 12) + Math.floor(S.level * 3 * cfg.intensity));
  for (let k = 0; k < n; k++) {
    if (particles.length > 260) particles.shift();
    const ang = Math.random() * Math.PI * 2, sp = 18 + Math.random() * 70 * (0.5 + S.treble * 2);
    particles.push({
      x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 10,
      life: 0.55 + Math.random() * 0.7, max: 1.25, size: 1.4 + Math.random() * 2 + S.bass * 4 * cfg.intensity, col: pickColor()
    });
  }
}
function burst(x, y, n) {
  for (let k = 0; k < n; k++) {
    if (particles.length > 260) particles.shift();
    const ang = (k / n) * Math.PI * 2 + Math.random() * 0.4, sp = 90 + Math.random() * 150 * cfg.intensity;
    particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.5 + Math.random() * 0.5, max: 1, size: 2 + Math.random() * 2.5, col: pickColor() });
  }
}

/* ═════════ 渲染循环：只在有内容要画时才跑 ═════════ */
function wake() {
  if (!raf && canvas && !document.hidden) raf = requestAnimationFrame(tick);
}
function stopLoop() {
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  if (ctx) ctx.clearRect(0, 0, W, H);
}
function isActive() {
  const now = performance.now();
  return particles.length > 0 || waves.length > 0 || (now - S.lastFrameAt < 1500 && (S.level > 0.015 || bandsV.some(v => v > 0.02)));
}

function tick(ts) {
  raf = 0;
  if (!canvas || document.hidden) return;
  const minGap = cfg.fps <= 30 ? 30 : 0;
  if (ts - lastDraw < minGap) { raf = requestAnimationFrame(tick); return; }
  const dt = Math.min(0.05, (ts - (lastTs || ts)) / 1000) || 0.016;
  lastTs = ts; lastDraw = ts;

  const k = Math.min(1, dt * 14);
  for (let i = 0; i < 32; i++) bandsV[i] += (bandsT[i] - bandsV[i]) * k;
  if (performance.now() - S.lastFrameAt > 400) {           /* 没有新帧（暂停 / 静音）：让频谱自然落下去 */
    for (let i = 0; i < 32; i++) bandsT[i] *= 0.9;
    S.level *= 0.9; S.bass *= 0.9; S.treble *= 0.9;
  }

  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  const I = cfg.intensity;

  if (cfg.glow) {                                           /* 边缘辉光：低频越强越亮 */
    const a = (0.03 + S.bass * 0.3) * I;
    if (a > 0.01) {
      const r0 = Math.min(W, H) * 0.5, r1 = Math.sqrt(W * W + H * H) * 0.5;
      const g = ctx.createRadialGradient(W / 2, H / 2, r0, W / 2, H / 2, r1);
      g.addColorStop(0, rgba(colors.a, 0));
      g.addColorStop(1, rgba(colors.a, a));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  if (cfg.bars) {                                           /* 底部 32 段频谱 */
    const bw = W / 32, maxH = H * 0.2 * I;
    for (let i = 0; i < 32; i++) {
      const v = bandsV[i];
      if (v < 0.02) continue;
      const h = Math.pow(v, 1.15) * maxH;
      const g = ctx.createLinearGradient(0, H, 0, H - h);
      g.addColorStop(0, rgba(i < 16 ? colors.a : colors.c, 0.5));
      g.addColorStop(1, rgba(colors.b, 0));
      ctx.fillStyle = g;
      ctx.fillRect(i * bw + 2, H - h, bw - 4, h);
    }
  }

  for (let i = waves.length - 1; i >= 0; i--) {             /* 节拍冲击波 */
    const w = waves[i];
    w.r += (w.max - w.r) * Math.min(1, dt * 5) + 40 * dt;
    w.a -= dt * 0.95;
    if (w.a <= 0.01 || w.r >= w.max * 0.99) { waves.splice(i, 1); continue; }
    ctx.lineWidth = 2 + w.a * 5;
    ctx.strokeStyle = rgba(colors.b, w.a);
    ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.stroke();
  }

  for (let i = particles.length - 1; i >= 0; i--) {         /* 粒子 */
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.965; p.vy *= 0.965;
    const a = Math.min(1, p.life / p.max * 1.4);
    ctx.fillStyle = rgba(p.col, a * 0.9);
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  if (isActive()) raf = requestAnimationFrame(tick);
  else ctx.clearRect(0, 0, W, H);                           /* 没有声音时完全停止，不占 CPU / GPU */
}

return plugin;
