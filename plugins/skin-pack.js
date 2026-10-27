/* Skin Pack — 一键换整套外观：配色 + 特效 + 圆角 + 字体 + 侧栏布局 */
const plugin = {
  id: 'skin-pack',
  name: 'Skin Pack',
  version: '1.0.0',
  author: 'Starline',
  description: 'Eight complete skins (Cyberpunk, Aurora Glass, Terminal, Sakura, Mono Ink, Sunset, Nord Frost, Gold Noir) with accent, corner and layout tweaks.',
  permissions: ['storage', 'appearance'],

  activate(api) {
    load(api);
    apply(api);
  },

  render(container, api) {
    load(api);
    container.textContent = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:16px;max-width:760px';

    /* ── 皮肤卡片 ── */
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px';
    const cards = {};
    function card(id, name, colors, sub) {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = 'text-align:left;padding:10px;border-radius:12px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:transform .15s,border-color .15s';
      const strip = document.createElement('div');
      strip.style.cssText = 'display:flex;height:34px;border-radius:8px;overflow:hidden;border:1px solid rgba(127,127,127,.25)';
      colors.forEach(c => {
        const s = document.createElement('i');
        s.style.cssText = 'flex:1;background:' + c;
        strip.appendChild(s);
      });
      const t = document.createElement('div');
      t.style.cssText = 'font-weight:700;font-size:13px';
      t.textContent = name;
      const d = document.createElement('div');
      d.style.cssText = 'font-size:11px;color:var(--text-3)';
      d.textContent = sub;
      b.append(strip, t, d);
      b.addEventListener('mouseenter', () => { b.style.transform = 'translateY(-2px)'; });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
      b.addEventListener('click', () => {
        cfg.skin = id;
        api.setConfig('settings.skin', id);
        apply(api);
        mark();
      });
      cards[id] = b;
      grid.appendChild(b);
    }
    card('none', 'Original', ['#0a0a0c', '#131316', '#3b82f6', '#60a5fa', '#93c5fd'], 'Restore the app look');
    SKINS.forEach(s => card(s.id, s.name, [s.colors.bg, s.colors.surface2, s.colors.accent, s.colors.accentHi, s.colors.violet], s.base === 'light' ? 'Light' : 'Dark'));
    function mark() {
      Object.keys(cards).forEach(k => {
        const on = k === cfg.skin;
        cards[k].style.borderColor = on ? 'var(--accent)' : 'var(--border)';
        cards[k].style.boxShadow = on ? '0 0 0 1px var(--accent), 0 8px 24px var(--accent-glow)' : 'none';
      });
    }
    mark();

    /* ── 微调 ── */
    function row(label, control) {
      const r = document.createElement('div');
      r.className = 'ui-row plugin-set-row';
      const l = document.createElement('div');
      l.className = 'ui-row-label plugin-set-label';
      l.textContent = label;
      const c = document.createElement('div');
      c.className = 'ui-controls';
      c.appendChild(control);
      r.append(l, c);
      return r;
    }
    const layout = document.createElement('select');
    layout.className = 'ui-input';
    [['default', 'Default sidebar'], ['rail-l', 'Compact rail (left)'], ['rail-r', 'Compact rail (right)']].forEach(([v, t]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = t; layout.appendChild(o);
    });
    layout.value = cfg.layout;
    layout.addEventListener('change', () => { cfg.layout = layout.value; api.setConfig('settings.layout', cfg.layout); apply(api); });

    const radBox = document.createElement('div');
    radBox.style.cssText = 'display:flex;align-items:center;gap:10px;min-width:240px';
    const rad = document.createElement('input');
    rad.type = 'range'; rad.min = -1; rad.max = 24; rad.step = 1; rad.value = cfg.radius; rad.style.flex = '1';
    const radOut = document.createElement('span');
    radOut.style.cssText = 'min-width:52px;text-align:right;font:600 12px var(--font-mono,monospace);color:var(--text-2)';
    const radTxt = v => (Number(v) < 0 ? 'skin' : v + 'px');
    radOut.textContent = radTxt(cfg.radius);
    rad.addEventListener('input', () => { radOut.textContent = radTxt(rad.value); });
    rad.addEventListener('change', () => { cfg.radius = Number(rad.value); api.setConfig('settings.radius', cfg.radius); apply(api); });
    radBox.append(rad, radOut);

    const accBox = document.createElement('div');
    accBox.style.cssText = 'display:flex;align-items:center;gap:10px';
    const acc = document.createElement('input');
    acc.type = 'color'; acc.value = cfg.accent || '#3b82f6';
    acc.style.cssText = 'width:44px;height:30px;border:0;background:none;padding:0;cursor:pointer';
    const accOn = document.createElement('label');
    accOn.className = 'bg-switch';
    const accChk = document.createElement('input');
    accChk.type = 'checkbox'; accChk.checked = !!cfg.accent;
    accOn.append(accChk, document.createElement('span'));
    function setAccent() {
      cfg.accent = accChk.checked ? acc.value : '';
      api.setConfig('settings.accent', cfg.accent);
      apply(api);
    }
    acc.addEventListener('change', () => { accChk.checked = true; setAccent(); });
    accChk.addEventListener('change', setAccent);
    accBox.append(acc, accOn);

    wrap.append(grid, row('Sidebar layout', layout), row('Corner radius', radBox), row('Custom accent colour', accBox));
    container.appendChild(wrap);
  },

  deactivate(api) {
    cssHandle = null;
    try { api.ui.reset(); } catch (e) {}
  }
};

/* ───────── 配置 ───────── */
const DEF = { skin: 'none', layout: 'default', radius: -1, accent: '' };
const cfg = Object.assign({}, DEF);
let cssHandle = null;

function load(api) {
  Object.keys(DEF).forEach(k => { cfg[k] = api.getConfig('settings.' + k, DEF[k]); });
}

function mixHex(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

function radiusVars(px) {
  return {
    '--radius-sm': Math.max(0, Math.round(px * 0.6)) + 'px',
    '--radius': px + 'px',
    '--radius-lg': Math.round(px * 1.4) + 'px',
    '--radius-xl': Math.round(px * 1.8) + 'px'
  };
}

/* 每次都「先还原本插件的全部改动，再整套重新应用」：切换皮肤不会残留上一套的字体 / 样式 */
function apply(api) {
  try { api.ui.reset(); } catch (e) {}
  cssHandle = null;
  const skin = SKINS.find(s => s.id === cfg.skin);
  if (skin) {
    const colors = Object.assign({}, skin.colors);
    if (cfg.accent && /^#[0-9a-fA-F]{6}$/.test(cfg.accent)) {
      colors.accent = cfg.accent;
      colors.accentHi = mixHex(cfg.accent, '#ffffff', 0.28);
    }
    try {
      api.ui.applyTheme({ base: skin.base, colors, fx: skin.fx || 'none', deco: skin.deco || 'none' });
      if (skin.css) cssHandle = api.ui.injectCSS(skin.css);
      const px = cfg.radius >= 0 ? cfg.radius : skin.radius;
      if (px != null) api.ui.setCssVars(radiusVars(px));
      if (skin.font) api.ui.setFont(skin.font);
    } catch (e) {
      api.warn('Skin could not be applied: ' + e.message);
    }
  } else if (cfg.accent && /^#[0-9a-fA-F]{6}$/.test(cfg.accent)) {
    try { api.ui.setCssVars({ '--accent': cfg.accent, '--accent-2': mixHex(cfg.accent, '#ffffff', 0.28), '--accent-hi': mixHex(cfg.accent, '#ffffff', 0.28) }); } catch (e) {}
  }
  if (cfg.radius >= 0 && !skin) { try { api.ui.setCssVars(radiusVars(cfg.radius)); } catch (e) {} }
  if (cfg.layout && cfg.layout !== 'default') {
    try { api.ui.setLayout(cfg.layout); } catch (e) { api.warn('Layout unavailable: ' + e.message); }
  }
}

/* ───────── 皮肤数据 ───────── */
const SKINS = [
  {
    id: 'cyberpunk', name: 'Cyberpunk', base: 'dark', fx: 'bloom', radius: 4,
    colors: { bg: '#07040f', surface: '#100a1f', surface2: '#170f2c', surface3: '#1f1438', surface4: '#281a46', border: '#2a1d4d', borderStrong: '#4a2f86', text: '#f5f0ff', textDim: '#c0aee6', textMute: '#7d6aa6', accent: '#ff2e97', accentHi: '#ff6ec0', violet: '#00e5ff' },
    css: `
      .card:hover,.plugin-item:hover{ box-shadow: 0 0 0 1px var(--accent), 0 0 26px var(--accent-glow) !important; }
      body::after{ content:''; position:fixed; inset:0; pointer-events:none; z-index:2147483000;
        background: repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 1px, transparent 1px 3px); mix-blend-mode: overlay; }
      .sec-title{ text-transform: uppercase; letter-spacing: 2px; }
    `
  },
  {
    id: 'aurora-glass', name: 'Aurora Glass', base: 'dark', fx: 'aurora', radius: 16,
    colors: { bg: '#060b16', surface: '#0d1626', surface2: '#12203a', surface3: '#182b4b', surface4: '#1f3660', border: '#1b2c4a', borderStrong: '#2f4a78', text: '#eaf2ff', textDim: '#a9bddb', textMute: '#6b83a8', accent: '#38bdf8', accentHi: '#7dd3fc', violet: '#a78bfa' },
    css: `
      .card,.card-panel,.plugin-item{ backdrop-filter: blur(28px) saturate(200%) !important; -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
        border-color: rgba(255,255,255,.10) !important; }
      .card:hover,.plugin-item:hover{ box-shadow: 0 18px 44px rgba(56,189,248,.18) !important; }
    `
  },
  {
    id: 'terminal', name: 'Terminal', base: 'dark', fx: 'none', radius: 0, font: 'Cascadia Mono, Consolas, monospace',
    colors: { bg: '#020a04', surface: '#06130a', surface2: '#0a1c0f', surface3: '#0f2816', surface4: '#14341d', border: '#123119', borderStrong: '#1e5a2e', text: '#b9f5c4', textDim: '#7fcf8f', textMute: '#4a8a58', accent: '#22c55e', accentHi: '#4ade80', violet: '#86efac' },
    css: `
      .card,.plugin-item,.card-panel,.btn{ border-radius: 0 !important; }
      .sec-title::before{ content:'> '; color: var(--accent); }
    `
  },
  {
    id: 'sakura', name: 'Sakura', base: 'light', fx: 'petal', deco: 'petal', radius: 14,
    colors: { bg: '#fff5f8', surface: '#ffffff', surface2: '#fff0f4', surface3: '#ffe4ec', surface4: '#ffd6e2', border: '#f6d3de', borderStrong: '#eeb6c8', text: '#3b1f2b', textDim: '#7a4c5f', textMute: '#b08698', accent: '#ec4899', accentHi: '#f472b6', violet: '#c084fc' },
    css: `.card:hover,.plugin-item:hover{ box-shadow: 0 14px 34px rgba(236,72,153,.18) !important; }`
  },
  {
    id: 'mono-ink', name: 'Mono Ink', base: 'light', fx: 'none', radius: 2,
    colors: { bg: '#fafafa', surface: '#ffffff', surface2: '#f4f4f5', surface3: '#e4e4e7', surface4: '#d4d4d8', border: '#d4d4d8', borderStrong: '#a1a1aa', text: '#09090b', textDim: '#3f3f46', textMute: '#71717a', accent: '#111111', accentHi: '#3f3f46', violet: '#52525b' },
    css: `.card,.plugin-item,.card-panel{ border-color: #18181b !important; box-shadow: 3px 3px 0 #18181b !important; }
      .card:hover,.plugin-item:hover{ box-shadow: 5px 5px 0 #18181b !important; }`
  },
  {
    id: 'sunset', name: 'Sunset', base: 'dark', fx: 'bloom', radius: 12,
    colors: { bg: '#120a0c', surface: '#1c1013', surface2: '#26161a', surface3: '#311c21', surface4: '#3d2328', border: '#3a2227', borderStrong: '#5a343b', text: '#fff1ec', textDim: '#e0b7ab', textMute: '#9c7468', accent: '#f97316', accentHi: '#fb923c', violet: '#f43f5e' },
    css: `.card:hover,.plugin-item:hover{ box-shadow: 0 16px 40px rgba(249,115,22,.22) !important; }`
  },
  {
    id: 'nord-frost', name: 'Nord Frost', base: 'dark', fx: 'none', radius: 8,
    colors: { bg: '#0e1218', surface: '#151b24', surface2: '#1b2330', surface3: '#222c3c', surface4: '#2b374a', border: '#263042', borderStrong: '#3a4a63', text: '#e5ecf5', textDim: '#aab8cc', textMute: '#6c7d96', accent: '#88c0d0', accentHi: '#a3d5e3', violet: '#b48ead' },
    css: ''
  },
  {
    id: 'gold-noir', name: 'Gold Noir', base: 'dark', fx: 'none', radius: 6,
    colors: { bg: '#070707', surface: '#0f0f0f', surface2: '#161616', surface3: '#1e1e1e', surface4: '#272727', border: '#262626', borderStrong: '#3d3a2c', text: '#f7f3e6', textDim: '#cbc3a6', textMute: '#8a8266', accent: '#d4af37', accentHi: '#f0cf68', violet: '#e8d28a' },
    css: `.card:hover,.plugin-item:hover{ border-color: var(--accent) !important; box-shadow: 0 0 0 1px var(--accent), 0 14px 36px rgba(212,175,55,.16) !important; }
      .sec-title{ letter-spacing: 1.5px; }`
  }
];

return plugin;
