/**
 * Morrow Glass · 明隙玻璃 —— STARLINE style plugin (API 2.5)
 *
 * Re-skins the whole app (login page, store, game popup, profile, plugins, dialogs…) as frosted / ultra-clear / liquid glass,
 * inspired by the "Morrow" inspiration workbench: five glass materials with a depth slider, a colour compass for the theme colour,
 * image / GIF / video backgrounds (URL or local file) and a floating music player with lyrics.
 *
 * Needs host API 2.5 (ui.txt 2026-11-07 or newer): ui.setSkin makes the login page and the main window start with the skin
 * already applied, api.blob stores local backgrounds and songs. On an older host the colours and glass still apply to the main
 * window, but not to the login page, and local files are unavailable.
 *
 * Install: Plugins page -> Import -> choose this file -> Enable. Open the settings with the glass button in the top bar
 * (or Plugins -> Morrow Glass). Do not run it together with other full-window style plugins (e.g. Epic Launcher Style).
 */
const ID = 'morrow-glass';
const CLS = 'mw';

const DEFAULTS = {
  material: 'frosted',        /* frosted | clear | liquid | solid | grain */
  depth: 60,                  /* 0..100: blur strength + how opaque the glass is */
  base: 'dark',               /* dark | light | auto (follow the system) */
  hue: 215, sat: 82, light: 60,   /* theme colour (colour compass) */
  radius: 22,                 /* corner radius of panels, px */
  perf: false,                /* lighter blur on cards (many cards = heavy for weak GPUs) */
  motion: true,               /* slow drifting aurora when there is no media background */
  bg: { mode: 'aurora', type: 'image', source: 'url', url: '', key: '', fileName: '', dim: 28, blur: 0, sat: 115 },
  player: { on: true, vol: 0.7, loop: 'all', lyric: true, open: false, x: null, y: null, list: [] }
};

const MATERIALS = {
  frosted: { blur: [12, 42], sat: 1.30, fill: [.22, .55], line: .13, hi: .20, sheen: .07, ctl: .07, bri: 1.00, grain: 0 },
  clear:   { blur: [3, 16],  sat: 1.20, fill: [.035, .17], line: .26, hi: .40, sheen: .16, ctl: .06, bri: 1.02, grain: 0 },
  liquid:  { blur: [16, 36], sat: 1.85, fill: [.07, .28], line: .32, hi: .60, sheen: .34, ctl: .10, bri: 1.08, grain: 0 },
  solid:   { blur: [0, 0],   sat: 1.00, fill: [.86, .97], line: .10, hi: .07, sheen: 0,   ctl: .06, bri: 1.00, grain: 0 },
  grain:   { blur: [12, 40], sat: 1.25, fill: [.26, .60], line: .15, hi: .18, sheen: .05, ctl: .07, bri: 1.00, grain: 1 }
};

/* ───────── helpers ───────── */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const num = (v, d) => { v = Number(v); return isFinite(v) ? v : d; };
const r3 = v => Math.round(v * 1000) / 1000;
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}
const hex = rgb => '#' + rgb.map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');
const rgba = (rgb, a) => 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + r3(clamp(a, 0, 1)) + ')';
function hexToHsl(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let hh = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh *= 60; if (hh < 0) hh += 360;
  }
  return { h: Math.round(hh), s: Math.round(s * 100), l: Math.round(l * 100) };
}
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* merge saved config over the defaults and clamp everything (a hand-edited plugins.json must not break the UI) */
function normCfg(raw) {
  raw = (raw && typeof raw === 'object') ? raw : {};
  const d = DEFAULTS, bg = raw.bg || {}, pl = raw.player || {};
  const c = {
    material: MATERIALS[raw.material] ? raw.material : d.material,
    depth: clamp(num(raw.depth, d.depth), 0, 100),
    base: /^(dark|light|auto)$/.test(raw.base) ? raw.base : d.base,
    hue: ((num(raw.hue, d.hue) % 360) + 360) % 360,
    sat: clamp(num(raw.sat, d.sat), 0, 100),
    light: clamp(num(raw.light, d.light), 25, 80),
    radius: clamp(num(raw.radius, d.radius), 8, 36),
    perf: !!raw.perf,
    motion: raw.motion === undefined ? d.motion : !!raw.motion,
    bg: {
      mode: bg.mode === 'media' ? 'media' : 'aurora',
      type: bg.type === 'video' ? 'video' : 'image',
      source: bg.source === 'file' ? 'file' : 'url',
      url: String(bg.url || '').slice(0, 1500),
      key: /^[\w.:-]{1,60}$/.test(String(bg.key || '')) ? String(bg.key) : '',
      fileName: String(bg.fileName || '').slice(0, 120),
      dim: clamp(num(bg.dim, d.bg.dim), 0, 90), blur: clamp(num(bg.blur, d.bg.blur), 0, 40), sat: clamp(num(bg.sat, d.bg.sat), 40, 220)
    },
    player: {
      on: pl.on === undefined ? d.player.on : !!pl.on,
      vol: clamp(num(pl.vol, d.player.vol), 0, 1),
      loop: /^(all|one|shuffle|off)$/.test(pl.loop) ? pl.loop : d.player.loop,
      lyric: pl.lyric === undefined ? d.player.lyric : !!pl.lyric,
      open: !!pl.open,
      x: pl.x == null ? null : num(pl.x, null), y: pl.y == null ? null : num(pl.y, null),
      list: (Array.isArray(pl.list) ? pl.list : []).filter(t => t && /^[\w-]{1,40}$/.test(String(t.id || ''))).slice(0, 300)
        .map(t => ({ id: String(t.id), name: String(t.name || '').slice(0, 160), lrc: !!t.lrc }))
    }
  };
  return c;
}

/* ───────── design tokens ───────── */
function effectiveDark(cfg, systemDark) { return cfg.base === 'auto' ? !!systemDark : cfg.base !== 'light'; }

function tokens(cfg, dark) {
  const m = MATERIALS[cfg.material] || MATERIALS.frosted, t = clamp(cfg.depth, 0, 100) / 100;
  const blur = Math.round(lerp(m.blur[0], m.blur[1], t)), fa = lerp(m.fill[0], m.fill[1], t);
  const h = cfg.hue, S = cfg.sat, L = cfg.light, k = dark ? 1 : 1.2;
  const acc = hsl2rgb(h, S, L), accHi = hsl2rgb(h, S, clamp(L + 12, 0, 92)), acc3 = hsl2rgb(h, clamp(S - 10, 0, 100), clamp(L + 26, 0, 94));
  const tint = dark ? hsl2rgb(h, 28, 12) : hsl2rgb(h, 55, 97), tint2 = dark ? hsl2rgb(h, 28, 17) : hsl2rgb(h, 45, 100);
  const ink = dark ? [244, 246, 255] : [20, 24, 42];
  const sheenA = m.sheen * (dark ? 1 : 1.5);
  const v = {
    '--mw-r': Math.round(cfg.radius) + 'px',
    '--mw-blur': blur + 'px',
    '--mw-sat': String(m.sat),
    '--mw-bri': String(m.bri),
    '--mw-fill': rgba(tint, fa * k),
    '--mw-fill-2': rgba(tint2, Math.min(.97, fa * k + .10)),
    '--mw-fill-3': rgba(tint, Math.min(.97, fa * k + .34)),
    '--mw-ctl': dark ? 'rgba(255,255,255,' + r3(m.ctl) + ')' : 'rgba(30,40,80,' + r3(m.ctl * .8) + ')',
    '--mw-ctl-hi': dark ? 'rgba(255,255,255,' + r3(m.ctl + .08) + ')' : 'rgba(30,40,80,' + r3(m.ctl * .8 + .06) + ')',
    '--mw-line': dark ? 'rgba(255,255,255,' + r3(m.line) + ')' : 'rgba(255,255,255,' + r3(Math.min(.9, m.line * 3.4)) + ')',
    '--mw-line-2': dark ? 'rgba(255,255,255,' + r3(m.line + .14) + ')' : 'rgba(30,40,80,' + r3(.16 + m.line * .2) + ')',
    '--mw-hi': dark
      ? 'inset 0 1px 0 rgba(255,255,255,' + r3(m.hi) + '),inset 0 -1px 0 rgba(255,255,255,' + r3(m.hi * .22) + '),inset 1px 0 0 rgba(255,255,255,' + r3(m.hi * .34) + '),inset -1px 0 0 rgba(255,255,255,' + r3(m.hi * .2) + ')'
      : 'inset 0 1px 0 rgba(255,255,255,' + r3(Math.min(1, m.hi * 2.2)) + '),inset 0 -1px 0 rgba(255,255,255,' + r3(Math.min(1, m.hi * 1.1)) + '),inset 1px 0 0 rgba(255,255,255,.6),inset -1px 0 0 rgba(255,255,255,.45)',
    '--mw-shadow': dark ? '0 18px 50px rgba(4,6,18,.42),0 3px 10px rgba(4,6,18,.24)' : '0 18px 44px rgba(40,60,110,.20),0 2px 8px rgba(40,60,110,.10)',
    '--mw-sheen': sheenA > 0 ? 'linear-gradient(135deg,rgba(255,255,255,' + r3(sheenA * 2) + '),rgba(255,255,255,' + r3(sheenA * .25) + ') 42%,rgba(255,255,255,' + r3(sheenA) + '))' : 'linear-gradient(#0000,#0000)',
    '--mw-grain': m.grain ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/><feColorMatrix values=\'0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\' opacity=\'' + (dark ? '.10' : '.16') + '\'/></svg>")' : 'linear-gradient(#0000,#0000)',
    '--mw-text': hex(ink),
    '--mw-text-2': rgba(ink, .72),
    '--mw-text-3': rgba(ink, .46),
    '--mw-base': hex(dark ? hsl2rgb(h, 38, 7) : hsl2rgb(h, 60, 93)),
    '--mw-mesh': [
      'radial-gradient(52% 46% at 14% 10%,' + rgba(hsl2rgb(h, 85, dark ? 52 : 78), dark ? .42 : .55) + ',transparent 70%)',
      'radial-gradient(46% 44% at 88% 16%,' + rgba(hsl2rgb(h + 55, 80, dark ? 55 : 80), dark ? .34 : .50) + ',transparent 70%)',
      'radial-gradient(56% 50% at 80% 96%,' + rgba(hsl2rgb(h - 60, 80, dark ? 50 : 78), dark ? .30 : .46) + ',transparent 70%)',
      'radial-gradient(44% 40% at 6% 92%,' + rgba(hsl2rgb(h + 150, 70, dark ? 48 : 80), dark ? .24 : .40) + ',transparent 70%)'].join(','),
    '--mw-acc': hex(acc), '--mw-acc-hi': hex(accHi), '--mw-acc-3': hex(acc3),
    '--mw-acc-glow': rgba(acc, .42), '--mw-acc-soft': rgba(acc, .16)
  };
  return { vars: v, blur, acc, accHi, acc3, tint, dark, ink };
}

const decl = o => Object.keys(o).map(k => k + ':' + o[k]).join(';');
const sel = (list, pre) => list.map(s => (pre || 'html.mw ') + s).join(',\n');

/* ───────── selector groups (every surface of the app) ───────── */
const PANELS = ['.sidebar', '.topbar', '.detail-top', '.card-panel', '.meta-grid', '.inject-panel', '.sub-bar', '.rev-card', '.game-pane', '.plugin-card',
  '.plugin-item', '.plugin-guide', '.plugins-stat', '.plugin-render-area:not(:empty)', '.ann-item', '.fest-strip', '.renew-card', '.ct-view', '.ct-card',
  '.req-box', '.wh-card', '.ui-card', '.ui-view', '.ui-topbar', '#storeRecentPanel', '.world-map-panel', '.world-side-panel', '.world-detail', '.plugin-api-item', '.sk-det', '.ui-log-rail'];
const POPUPS = ['.genre-pop', '.tb-more-pop', '.ui-pop', '.ui-select', '.iosp', '.cp', '.faq', '.sk-pop', '.lg-pop', '.toast', '.sl-tip', '.plugin-dialog', '.modal',
  '.upd-card', '.cc-card', '.gate-card', '.wh-pop', '.qp-picker', '.world-country-tip', '.detail-vol-panel', '.renew-key-help-pop', '.status-msg', '.s-meta'];
const SCRIMS = ['.overlay', '.cp-scrim', '.gate-ovl', '.success-ovl', '.upd-ovl', '.cc-ovl', '.plugin-dialog-overlay', '.req-modal', '.wh-modal', '.detail'];
const CONTROLS = ['.tb-btn', '.btn-secondary', '.btn-ghost', '.hero-ctrl', '.hero-badge', '.sec-filter', '.store-view-switch', '.genre-btn', '.topbar-search input',
  '.world-map-btn', '.input', '.segmented', '.dpi-preset', '.lang-option', '.avatar-option', '.layout-opt', '.cols-chip', '.bg-tile', '.dz-zone', '.sb-ghost',
  '.inject-method', '.card-badge', '.card-status', '.card-wish', '.card-sublen', '.profile-logout', '.sec-count', '#storeBackTop', '#storeRecentToggle', '.detail-vui', '.detail-ctrl',
  '.plugin-host input:not([class])', '.plugin-host select:not([class])', '.plugin-host textarea:not([class])', '.plugin-host button:not([class])'];
const PRIMARY = ['.btn-primary', '.act-btn', '.card-cta:not(.owned)'];

const GLASS = 'background:var(--mw-grain),var(--mw-sheen),var(--mw-fill)!important;border:1px solid var(--mw-line)!important;border-radius:var(--mw-r);' +
  'box-shadow:var(--mw-hi),var(--mw-shadow)!important;-webkit-backdrop-filter:blur(var(--mw-blur)) saturate(var(--mw-sat)) brightness(var(--mw-bri));' +
  'backdrop-filter:blur(var(--mw-blur)) saturate(var(--mw-sat)) brightness(var(--mw-bri))';
const GLASS_POP = 'background:var(--mw-grain),var(--mw-sheen),var(--mw-fill-3)!important;border:1px solid var(--mw-line-2)!important;border-radius:calc(var(--mw-r)*.9);' +
  'box-shadow:var(--mw-hi),0 28px 80px rgba(2,4,14,.5)!important;-webkit-backdrop-filter:blur(calc(var(--mw-blur)*1.15)) saturate(var(--mw-sat));' +
  'backdrop-filter:blur(calc(var(--mw-blur)*1.15)) saturate(var(--mw-sat))';
const CTL = 'background:var(--mw-ctl)!important;border:1px solid var(--mw-line)!important;color:var(--mw-text);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)';
const PRIM = 'background:linear-gradient(180deg,rgba(255,255,255,.34),rgba(255,255,255,0) 52%),var(--mw-acc)!important;border:1px solid rgba(255,255,255,.35)!important;' +
  'color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 10px 28px var(--mw-acc-glow)!important';

/* accent + surface variables the app already understands: setting them here recolours everything that uses them */
function appVars(T) {
  const dark = T.dark, c = T;
  return {
    '--accent': '#' + c.acc.map(x => x.toString(16).padStart(2, '0')).join(''), '--accent-2': hex(c.accHi), '--accent-3': hex(c.acc3),
    '--accent-glow': rgba(c.acc, .42), '--accent-soft': rgba(c.acc, .16),
    '--surface': 'var(--mw-fill)', '--surface-2': 'var(--mw-fill-2)', '--surface-3': 'var(--mw-fill-3)', '--surface-solid': hex(c.tint),
    '--text': 'var(--mw-text)', '--text-2': 'var(--mw-text-2)', '--text-3': 'var(--mw-text-3)',
    '--border': 'var(--mw-line)', '--border-2': 'var(--mw-line-2)', '--overlay': rgba(c.tint, .5),
    '--radius-sm': 'max(8px,calc(var(--mw-r)*.45))', '--radius': 'calc(var(--mw-r)*.62)', '--radius-lg': 'var(--mw-r)', '--radius-xl': 'calc(var(--mw-r)*1.25)',
    '--shadow-1': dark ? '0 2px 8px rgba(4,6,18,.4)' : '0 2px 8px rgba(40,60,110,.12)', '--shadow-2': 'var(--mw-shadow)', '--shadow-3': '0 28px 80px rgba(2,4,14,.5)',
    '--lq-pop': 'var(--mw-fill-3)', '--lq-mesh': 'var(--mw-mesh)', '--lq-hi': 'var(--mw-hi)', '--lq-drop': 'var(--mw-shadow)',
    'color-scheme': dark ? 'dark' : 'light'
  };
}
function loginVars(T) {
  const dark = T.dark;
  return {
    '--lg-bg': 'transparent', '--lg-glow-a': 'transparent', '--lg-glow-b': 'transparent', '--lg-glow-c': 'transparent', '--lg-vig': 'transparent', '--lg-vg': 'transparent',
    '--lg-card-a': 'var(--mw-fill-2)', '--lg-card-b': 'var(--mw-fill)',
    '--lg-ring-a': dark ? 'rgba(255,255,255,.42)' : 'rgba(255,255,255,.95)', '--lg-ring-b': dark ? 'rgba(255,255,255,.08)' : 'rgba(20,25,45,.06)', '--lg-ring-c': 'var(--mw-line-2)',
    '--lg-field': 'var(--mw-ctl)', '--lg-field-hi': 'var(--mw-ctl-hi)', '--lg-field-line': 'var(--mw-line-2)',
    '--lg-btn-a': 'var(--mw-ctl-hi)', '--lg-btn-b': 'var(--mw-ctl)', '--lg-btn-line': 'var(--mw-line)', '--lg-btn-hover': 'var(--mw-ctl-hi)',
    '--lg-fg': 'var(--mw-text)', '--lg-fg2': 'var(--mw-text-2)', '--lg-fg3': 'var(--mw-text-3)',
    '--lg-card-shadow': 'var(--mw-shadow)', '--lg-star': dark ? '255,255,255' : '40,50,90',
    '--lg-tile-fill': 'var(--mw-ctl)', '--lg-tile-line': 'var(--mw-line)', '--lg-deco-line': 'var(--mw-line-2)',
    '--accent': hex(T.acc), '--accent-2': hex(T.accHi), '--accent-3': hex(T.acc3), '--accent-glow': rgba(T.acc, .42), '--accent-soft': rgba(T.acc, .16),
    'color-scheme': dark ? 'dark' : 'light'
  };
}

/* ───────── css: main window ───────── */
const rootBlock = (T, extra) => 'html.mw{' + decl(Object.assign({}, T.vars, extra || {})) + '}';

function appCss(cfg, T) {
  const R = [rootBlock(T, appVars(T))];
  R.push('html.mw{background:var(--mw-mesh),var(--mw-base)!important;background-attachment:fixed!important}');
  R.push('html.mw body{background:transparent!important;color:var(--mw-text)}', 'html.mw body::before{display:none!important}',
    'html.mw .app,html.mw .main{background:transparent!important}', 'html.mw .app{padding:12px;gap:12px}');
  R.push(sel(PANELS) + '{' + GLASS + '}');
  R.push(sel(POPUPS) + '{' + GLASS_POP + '}');
  R.push(sel(SCRIMS) + '{background:' + rgba(T.tint, T.dark ? .38 : .30) + '!important;-webkit-backdrop-filter:blur(calc(var(--mw-blur)*.55)) saturate(1.1);backdrop-filter:blur(calc(var(--mw-blur)*.55)) saturate(1.1)}');
  R.push(sel(CONTROLS) + '{' + CTL + '}');
  R.push(sel(CONTROLS.filter(s => /^\.(tb-btn|btn-secondary|btn-ghost|genre-btn|world-map-btn|hero-ctrl|detail-ctrl|sb-ghost)$/.test(s)), 'html.mw ').replace(/(,\n|$)/g, ':hover$1').replace(/:hover$/, ':hover') +
    '{background:var(--mw-ctl-hi)!important;border-color:var(--mw-line-2)!important}');
  R.push(sel(PRIMARY) + '{' + PRIM + '}', sel(PRIMARY.map(s => s + ':hover:not(:disabled)')) + '{filter:brightness(1.08)}');
  R.push('html.mw .topbar-search input{border-radius:999px!important}', 'html.mw .tb-btn{border-radius:calc(var(--mw-r)*.6)!important}');
  /* cards */
  R.push('html.mw .card{' + GLASS.replace(/blur\(var\(--mw-blur\)\)/g, 'blur(calc(var(--mw-blur)*.7))') + ';transition:transform .25s var(--lg-sp,ease),box-shadow .25s,border-color .25s}');
  if (cfg.perf) R.push('html.mw .card{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:var(--mw-fill-2)!important}');
  R.push('html.mw .card:hover{border-color:var(--mw-line-2)!important;box-shadow:var(--mw-hi),0 26px 64px rgba(2,4,14,.46)!important}',
    'html.mw .grid.list .card{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:var(--mw-ctl)!important;box-shadow:none!important}',
    'html.mw .grid.list .card:hover{background:var(--mw-ctl-hi)!important}',
    'html.mw .card-img{background-color:transparent}');
  /* shell */
  R.push('html.mw .sb-item{border-radius:calc(var(--mw-r)*.62)}', 'html.mw .sb-item:hover{background:var(--mw-ctl-hi)}',
    'html.mw .sb-item.active{background:linear-gradient(135deg,var(--mw-acc-soft),rgba(255,255,255,.07))!important;box-shadow:var(--mw-hi)}',
    'html.mw .hero{border-radius:var(--mw-r)!important;box-shadow:var(--mw-shadow)!important;overflow:hidden}',
    'html.mw .sec-filter button.active{background:var(--mw-acc)!important;color:#fff!important;box-shadow:0 6px 18px var(--mw-acc-glow)}',
    'html.mw .detail{background:' + rgba(T.tint, T.dark ? .46 : .36) + '!important}',
    'html.mw .progress-fill,html.mw .sb-task-bar i{background:linear-gradient(90deg,var(--mw-acc),var(--mw-acc-hi))!important}',
    'html.mw .toast{border-radius:999px!important}');
  /* scrollbars / selection / focus */
  R.push('html.mw ::-webkit-scrollbar{width:10px;height:10px}', 'html.mw ::-webkit-scrollbar-track{background:transparent}',
    'html.mw ::-webkit-scrollbar-thumb{background:var(--mw-line-2);border-radius:10px;border:3px solid transparent;background-clip:padding-box}',
    'html.mw ::-webkit-scrollbar-thumb:hover{background:var(--mw-acc);background-clip:padding-box}',
    'html.mw ::selection{background:var(--mw-acc-glow)}', 'html.mw *:focus-visible{outline:2px solid var(--mw-acc-hi)!important;outline-offset:2px}');
  return R.join('\n');
}

/* ───────── css: login page ───────── */
function loginCss(cfg, T) {
  const R = [rootBlock(T, loginVars(T))];
  R.push('html.mw{background:var(--mw-mesh),var(--mw-base)!important;background-attachment:fixed!important}',
    'html.mw body{background:transparent!important;color:var(--mw-text)}', 'html.mw body::before{display:none!important}',
    'html.mw .bgfx,html.mw #lgSky,html.mw .lg-sky,html.mw .lg-deco,html.mw .lg-vg{display:none!important}');
  R.push('html.mw .right{' + GLASS.replace('var(--mw-r)', 'calc(var(--mw-r) + 10px)').replace(/blur\(var\(--mw-blur\)\)/g, 'blur(calc(var(--mw-blur)*1.2))') + '}');
  R.push(sel(['.gate-card', '.s-meta', '.status-msg', '.toast', '.world-map-panel', '.world-side-panel', '.world-detail', '.ui-log-rail', '.faq', '.cp', '.ui-pop', '.ui-card', '.ui-view', '.modal', '.upd-card']) + '{' + GLASS_POP + '}');
  R.push(sel(['.gate-ovl', '.success-ovl', '.cp-scrim', '.overlay', '.upd-ovl', '.cc-ovl']) + '{background:' + rgba(T.tint, T.dark ? .38 : .30) + '!important;-webkit-backdrop-filter:blur(calc(var(--mw-blur)*.55));backdrop-filter:blur(calc(var(--mw-blur)*.55))}');
  R.push(sel(['.field-wrap', '.foot-btn', '.acc-tabs', '.rem-row', '.paste-btn']) + '{background:var(--mw-ctl)!important;border:1px solid var(--mw-line)!important;color:var(--mw-text)}',
    sel(['.field-wrap input', '.key-input']) + '{color:var(--mw-text)!important;background:transparent!important}',
    sel(['.field-wrap:focus-within']) + '{border-color:var(--mw-acc-hi)!important;box-shadow:0 0 0 3px var(--mw-acc-soft)!important}',
    sel(['.act-btn']) + '{' + PRIM + ';border-radius:calc(var(--mw-r)*.7)}',
    sel(['.acc-tab.active']) + '{color:#fff!important}', sel(['.acc-ink']) + '{background:var(--mw-acc)!important;box-shadow:0 6px 18px var(--mw-acc-glow)!important}',
    sel(['.lg-title']) + '{text-shadow:0 2px 18px var(--mw-acc-glow)}');
  R.push('html.mw ::selection{background:var(--mw-acc-glow)}');
  return R.join('\n');
}

/* ───────── css owned by the plugin: aurora, settings page, player, lyrics ───────── */
function uiCss(cfg, T) {
  const h = cfg.hue, a1 = hex(hsl2rgb(h, 85, T.dark ? 55 : 70)), a2 = hex(hsl2rgb(h + 55, 80, T.dark ? 58 : 72)), a3 = hex(hsl2rgb(h - 60, 80, T.dark ? 52 : 70));
  return [
    '.mw-aurora{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}',
    '.mw-aurora i{position:absolute;width:56vmax;height:56vmax;border-radius:50%;filter:blur(70px);opacity:' + (T.dark ? '.5' : '.55') + '}',
    '.mw-aurora i:nth-child(1){left:-14vmax;top:-20vmax;background:radial-gradient(circle,' + a1 + ',transparent 66%);animation:mw-d1 42s ease-in-out infinite alternate}',
    '.mw-aurora i:nth-child(2){right:-18vmax;top:-8vmax;background:radial-gradient(circle,' + a2 + ',transparent 66%);animation:mw-d2 50s ease-in-out infinite alternate}',
    '.mw-aurora i:nth-child(3){left:18vmax;bottom:-30vmax;background:radial-gradient(circle,' + a3 + ',transparent 66%);animation:mw-d3 46s ease-in-out infinite alternate}',
    '@keyframes mw-d1{to{transform:translate3d(16vmax,12vmax,0) scale(1.15)}}', '@keyframes mw-d2{to{transform:translate3d(-14vmax,16vmax,0) scale(.9)}}', '@keyframes mw-d3{to{transform:translate3d(-12vmax,-14vmax,0) scale(1.2)}}',
    'html.mw.mw-still .mw-aurora i{animation:none}',
    /* settings page */
    '.mw-ui{display:flex;flex-direction:column;gap:16px;color:var(--mw-text);font-family:var(--font)}',
    '.mw-sec{padding:18px 20px;border-radius:var(--mw-r);background:var(--mw-ctl);border:1px solid var(--mw-line)}',
    '.mw-sec h3{margin:0 0 14px;font-size:15px;font-weight:700}', '.mw-hint{margin:-8px 0 14px;color:var(--mw-text-2);font-size:12.5px;line-height:1.5}',
    '.mw-row{display:flex;align-items:center;gap:14px;margin:12px 0;flex-wrap:wrap}', '.mw-row>label{flex:0 0 112px;color:var(--mw-text-2);font-size:13px}',
    '.mw-mats{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:12px}',
    '.mw-mat{position:relative;height:98px;border-radius:14px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .15s,transform .15s}',
    '.mw-mat:hover{transform:translateY(-2px)}', '.mw-mat.on{border-color:var(--mw-acc-hi)}',
    '.mw-mat .glass{position:absolute;left:14px;right:14px;top:14px;bottom:30px;border-radius:10px}',
    '.mw-mat span{position:absolute;left:12px;bottom:8px;font-size:12.5px;font-weight:700;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.55)}',
    '.mw-seg{display:inline-flex;padding:3px;border-radius:999px;background:var(--mw-ctl);border:1px solid var(--mw-line)}',
    '.mw-seg button{border:0;background:transparent;color:var(--mw-text-2);padding:7px 15px;border-radius:999px;font:600 12.5px var(--font);cursor:pointer}',
    '.mw-seg button.on{background:var(--mw-acc);color:#fff;box-shadow:0 4px 14px var(--mw-acc-glow)}',
    '.mw-range{display:flex;align-items:center;gap:12px;flex:1;min-width:220px}', '.mw-range input{flex:1;accent-color:var(--mw-acc)}', '.mw-range b{flex:0 0 52px;text-align:right;font-size:12.5px;color:var(--mw-text-2);font-weight:600}',
    '.mw-switch{position:relative;width:44px;height:26px;flex:0 0 44px;border-radius:999px;border:1px solid var(--mw-line);background:var(--mw-ctl-hi);cursor:pointer;transition:background .2s}',
    '.mw-switch::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4);transition:transform .2s}',
    '.mw-switch.on{background:var(--mw-acc);border-color:transparent}', '.mw-switch.on::after{transform:translateX(18px)}',
    '.mw-btn{border:1px solid var(--mw-line);background:var(--mw-ctl);color:var(--mw-text);padding:8px 16px;border-radius:999px;font:600 12.5px var(--font);cursor:pointer;transition:background .15s}',
    '.mw-btn:hover{background:var(--mw-ctl-hi)}', '.mw-btn.pri{background:var(--mw-acc);border-color:transparent;color:#fff;box-shadow:0 6px 18px var(--mw-acc-glow)}', '.mw-btn.danger{color:#ff8a8a}',
    '.mw-input{flex:1;min-width:200px;padding:9px 14px;border-radius:999px;border:1px solid var(--mw-line);background:var(--mw-ctl);color:var(--mw-text);font:13px var(--font);outline:0}',
    '.mw-input:focus{border-color:var(--mw-acc-hi)}',
    '.mw-compass{display:flex;gap:26px;align-items:center;flex-wrap:wrap}', '.mw-wheelbox{position:relative;width:180px;height:180px;flex:0 0 180px}',
    '.mw-wheel{width:180px;height:180px;border-radius:50%;cursor:crosshair;display:block;box-shadow:0 10px 34px rgba(0,0,0,.35),inset 0 0 0 1px var(--mw-line)}',
    '.mw-knob{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.55);pointer-events:none}',
    '.mw-swatches{display:flex;gap:9px;flex-wrap:wrap;max-width:260px}', '.mw-sw{width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.55);cursor:pointer;transition:transform .15s}',
    '.mw-sw:hover{transform:scale(1.14)}', '.mw-chip{display:inline-block;padding:3px 10px;border-radius:999px;background:var(--mw-ctl-hi);font-size:12px;color:var(--mw-text-2)}',
    '.mw-tracks{display:flex;flex-direction:column;gap:4px;max-height:260px;overflow:auto;margin-top:10px}',
    '.mw-track{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:12px;background:var(--mw-ctl);font-size:13px}',
    '.mw-track.cur{background:var(--mw-acc-soft)}', '.mw-track>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.mw-track button{border:0;background:transparent;color:var(--mw-text-2);cursor:pointer;padding:4px 8px;border-radius:8px;font:600 12px var(--font)}',
    '.mw-track button:hover{background:var(--mw-ctl-hi);color:var(--mw-text)}', '.mw-empty{padding:16px;text-align:center;color:var(--mw-text-3);font-size:13px}',
    /* player */
    '.mw-player{position:fixed;z-index:2147480000;right:22px;bottom:22px;width:310px;padding:12px;border-radius:calc(var(--mw-r)*1.1);display:flex;align-items:center;gap:12px;color:var(--mw-text);font-family:var(--font);' + GLASS_POP + '}',
    '.mw-player[data-open="0"]{width:auto;padding:8px}', '.mw-player[data-open="0"] .mw-pl-main{display:none}',
    '.mw-disc{flex:0 0 46px;width:46px;height:46px;border:0;border-radius:50%;position:relative;cursor:grab;display:grid;place-items:center;background:conic-gradient(var(--mw-acc),var(--mw-acc-hi),var(--mw-acc-3),var(--mw-acc));box-shadow:0 6px 20px var(--mw-acc-glow)}',
    '.mw-disc::after{content:"";width:14px;height:14px;border-radius:50%;background:var(--mw-base);border:2px solid rgba(255,255,255,.55)}',
    'html.mw:not(.mw-still) .mw-player.playing .mw-disc{animation:mw-spin 6s linear infinite}', '@keyframes mw-spin{to{transform:rotate(360deg)}}',
    '.mw-pl-main{flex:1;min-width:0}', '.mw-pl-title{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mw-pl-sub{min-height:16px;font-size:12px;color:var(--mw-text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mw-pl-bar{position:relative;height:5px;margin:9px 0 7px;border-radius:5px;background:var(--mw-ctl-hi);cursor:pointer}',
    '.mw-pl-bar::before{content:"";position:absolute;inset:-8px 0}', '.mw-pl-bar i{display:block;height:100%;width:0;border-radius:5px;background:linear-gradient(90deg,var(--mw-acc),var(--mw-acc-hi))}',
    '.mw-pl-ctl{display:flex;align-items:center;gap:2px}',
    '.mw-pl-ctl button{width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;display:grid;place-items:center}',
    '.mw-pl-ctl button:hover{background:var(--mw-ctl-hi)}', '.mw-pl-ctl .go{width:38px;height:38px;background:var(--mw-acc);color:#fff;box-shadow:0 6px 16px var(--mw-acc-glow)}',
    '.mw-pl-ctl .grow{flex:1;pointer-events:none}', '.mw-pl-ctl svg{width:17px;height:17px;fill:currentColor;stroke:none}',
    '.mw-pl-ctl .ln svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.mw-pl-ctl input[type=range]{width:62px;accent-color:var(--mw-acc)}',
    '.mw-pl-list{position:absolute;right:0;bottom:calc(100% + 10px);width:310px;max-height:300px;overflow:auto;padding:6px;display:none;border-radius:calc(var(--mw-r)*.9);' + GLASS_POP + '}',
    '.mw-player.list .mw-pl-list{display:block}', '.mw-pl-item{display:flex;gap:8px;padding:8px 10px;border-radius:10px;font-size:13px;cursor:pointer}',
    '.mw-pl-item:hover{background:var(--mw-ctl-hi)}', '.mw-pl-item.cur{background:var(--mw-acc-soft);font-weight:700}',
    '.mw-lyric{position:fixed;left:50%;bottom:36px;transform:translateX(-50%);z-index:2147479000;max-width:70vw;padding:10px 24px;border-radius:999px;font:700 18px var(--font);color:#fff;text-align:center;' +
      'text-shadow:0 2px 14px rgba(0,0,0,.55);background:rgba(10,12,24,.34);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);pointer-events:none;opacity:0;transition:opacity .35s}',
    '.mw-lyric.on{opacity:1}'
  ].join('\n').replace(/(^|\n)(?!html\.mw|@keyframes|\})([.])/g, '$1html.mw $2');
}

/* ═════════════════════════  runtime  ═════════════════════════ */
const S = { api: null, cfg: null, T: null, dark: true, skin: null, styleH: null, aurora: null, applyTimer: 0, saveTimer: 0, themeSig: '', onSys: null, mq: null, ui: null, undo: [] };
const A = () => S.api;
const sysDark = () => { try { return !!window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return true; } };
const isVideoName = s => /\.(mp4|webm|ogv|m4v|mov)(\?.*)?$/i.test(String(s || ''));

/* what the skin loader should draw behind the app (null = just the aurora / mesh) */
function bgSpec(cfg) {
  const b = cfg.bg;
  if (b.mode !== 'media') return null;
  const src = b.source === 'file' ? (b.key ? 'idb:' + b.key : '') : b.url;
  if (!src) return null;
  return { kind: b.type, src, dim: b.dim / 100, blur: b.blur, saturate: b.sat / 100, brightness: 1 };
}

function syncAurora() {
  if (!S.aurora) return;
  S.aurora.style.display = bgSpec(S.cfg) ? 'none' : '';
}

function applyAll() {
  const api = S.api, cfg = S.cfg;
  S.dark = effectiveDark(cfg, sysDark());
  S.T = tokens(cfg, S.dark);
  const appText = appCss(cfg, S.T) + '\n' + uiCss(cfg, S.T), loginText = loginCss(cfg, S.T);
  if (typeof api.ui.setSkin === 'function') {
    const spec = { cls: CLS, theme: S.dark ? 'dark' : 'light', css: { app: appText, login: loginText }, bg: bgSpec(cfg) };
    if (S.skin) S.skin.update(spec); else S.skin = api.ui.setSkin(spec);
  } else {                                           /* host older than 2.5: main window only */
    if (S.styleH) S.styleH.update(appText); else S.styleH = api.ui.injectCSS(appText);
    document.documentElement.classList.add(CLS);
  }
  document.documentElement.classList.toggle('mw-still', !cfg.motion);
  /* the app's own theme engine, so built-in widgets that read its tokens follow the colour too (only when it really changed) */
  const sig = (S.dark ? 'd' : 'l') + '|' + hex(S.T.acc);
  if (sig !== S.themeSig) {
    S.themeSig = sig;
    try { api.ui.applyTheme({ base: S.dark ? 'dark' : 'light', colors: { accent: hex(S.T.acc), accentHi: hex(S.T.accHi) }, fx: 'none', deco: 'none' }); }
    catch (e) { api.warn('applyTheme failed:', e && e.message ? e.message : e); }
  }
  syncAurora();
  if (S.ui && S.ui.refreshPreview) S.ui.refreshPreview();
}
function scheduleApply(ms) {
  clearTimeout(S.applyTimer);
  S.applyTimer = setTimeout(() => { try { applyAll(); } catch (e) { A().warn('apply failed:', e && e.message ? e.message : e); } }, ms == null ? 60 : ms);
}
function saveCfg() {
  clearTimeout(S.saveTimer);
  S.saveTimer = setTimeout(() => { try { A().setConfig('cfg', S.cfg); } catch (e) {} }, 350);
}
/* patch = partial config; nested objects (bg / player) are merged one level deep */
function setCfg(patch, opts) {
  opts = opts || {};
  const cur = S.cfg, next = Object.assign({}, cur, patch);
  if (patch.bg) next.bg = Object.assign({}, cur.bg, patch.bg);
  if (patch.player) next.player = Object.assign({}, cur.player, patch.player);
  S.cfg = normCfg(next);
  saveCfg();
  if (!opts.noApply) scheduleApply(opts.delay);
}
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ═════════════════════════  music player ("随身听")  ═════════════════════════ */
function parseLrc(text) {
  const out = [], src = String(text || ''), om = /\[offset:\s*([+-]?\d+)\]/i.exec(src), off = om ? Number(om[1]) / 1000 : 0;
  src.split(/\r?\n/).forEach(line => {
    const tags = [];
    let rest = line.replace(/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g, (m, mm, ss, ms) => { tags.push(Number(mm) * 60 + Number(ss) + (ms ? Number(ms) / Math.pow(10, ms.length) : 0)); return ''; });
    rest = rest.replace(/<\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?>/g, '').trim();
    tags.forEach(t => out.push({ t: Math.max(0, t - off), text: rest }));
  });
  out.sort((a, b) => a.t - b.t);
  return out;
}
function lineAt(lines, time) {
  let lo = 0, hi = lines.length - 1, ans = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (lines[mid].t <= time + 0.15) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans;
}
function splitTitle(name) {
  const stem = String(name || '').replace(/\.[A-Za-z0-9]{2,5}$/, '').replace(/_/g, ' ').trim();
  const m = /^(.{1,60}?)\s+[-–—]\s+(.+)$/.exec(stem);
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { artist: '', title: stem };
}
/* mode: 'ended' (song finished by itself) | 'next' | 'prev' (the user pressed a button) */
function nextIndex(n, cur, loop, mode, rnd) {
  if (n <= 0) return -1;
  if (loop === 'shuffle' && n > 1) { let i, guard = 0; do { i = Math.floor((rnd || Math.random)() * n); } while (i === cur && ++guard < 20); return i; }
  if (mode === 'ended' && loop === 'one') return cur;
  if (mode === 'prev') return cur <= 0 ? n - 1 : cur - 1;
  const i = cur + 1;
  if (i >= n) return (mode === 'ended' && loop === 'off') ? -1 : 0;
  return i;
}
const isAudioFile = f => /^audio\//.test(f.type || '') || /\.(mp3|flac|wav|ogg|oga|m4a|aac|opus|wma|ape)$/i.test(f.name || '');
const isLrcFile = f => /\.lrc$/i.test(f.name || '');
const stemOf = n => String(n || '').replace(/\.[A-Za-z0-9]{2,5}$/, '').trim().toLowerCase();
async function decodeText(blob) {
  const buf = await blob.arrayBuffer();
  let t = new TextDecoder('utf-8').decode(buf);
  if ((t.match(/\uFFFD/g) || []).length > 3) { try { t = new TextDecoder('gbk').decode(buf); } catch (e) {} }
  return t.replace(/^\uFEFF/, '');
}

const SVP = {
  play: '<svg viewBox="0 0 24 24"><polygon points="7 4 20 12 7 20 7 4"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4.5" height="16" rx="1.2"/><rect x="13.5" y="4" width="4.5" height="16" rx="1.2"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="2.6" height="14" rx="1"/><polygon points="19 5 9 12 19 19 19 5"/></svg>',
  next: '<svg viewBox="0 0 24 24"><rect x="16.4" y="5" width="2.6" height="14" rx="1"/><polygon points="5 5 15 12 5 19 5 5"/></svg>',
  list: '<svg viewBox="0 0 24 24" class="ln"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg>',
  all: '<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  one: '<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="12" y="15.2" font-size="8" font-weight="800" text-anchor="middle" fill="currentColor" stroke="none">1</text></svg>',
  shuffle: '<svg viewBox="0 0 24 24"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  off: '<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};
const LOOP_ORDER = ['all', 'one', 'shuffle', 'off'];

const PL = { el: null, lyricEl: null, audio: null, idx: -1, lines: [], li: -1, url: '', loading: 0, refs: {}, drag: null, raf: 0 };

function plTitle(t) { return splitTitle(t.name); }

function buildPlayer() {
  const api = S.api, cfg = S.cfg.player;
  const el = document.createElement('div');
  el.className = 'mw-player'; el.setAttribute('data-open', cfg.open ? '1' : '0');
  el.innerHTML = '<button type="button" class="mw-disc" aria-label="Music"></button>' +
    '<div class="mw-pl-main"><div class="mw-pl-title"></div><div class="mw-pl-sub"></div><div class="mw-pl-bar"><i></i></div>' +
    '<div class="mw-pl-ctl"><button type="button" data-a="prev">' + SVP.prev + '</button><button type="button" class="go" data-a="toggle">' + SVP.play + '</button>' +
    '<button type="button" data-a="next">' + SVP.next + '</button><span class="grow"></span><button type="button" data-a="loop"></button>' +
    '<input type="range" min="0" max="1" step="0.01" data-a="vol"><button type="button" data-a="list">' + SVP.list + '</button></div></div>' +
    '<div class="mw-pl-list"></div>';
  const r = PL.refs = { disc: el.querySelector('.mw-disc'), title: el.querySelector('.mw-pl-title'), sub: el.querySelector('.mw-pl-sub'), bar: el.querySelector('.mw-pl-bar'),
    fill: el.querySelector('.mw-pl-bar i'), go: el.querySelector('[data-a="toggle"]'), loop: el.querySelector('[data-a="loop"]'), vol: el.querySelector('[data-a="vol"]'), list: el.querySelector('.mw-pl-list') };
  r.vol.value = cfg.vol;
  document.body.appendChild(el);
  PL.el = el;
  const ly = document.createElement('div'); ly.className = 'mw-lyric'; document.body.appendChild(ly); PL.lyricEl = ly;
  placePlayer();

  el.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) { const it = e.target.closest('.mw-pl-item'); if (it) plLoad(Number(it.dataset.i), true); return; }
    const a = b.dataset.a;
    if (a === 'toggle') plToggle(); else if (a === 'next') plStep('next'); else if (a === 'prev') plStep('prev');
    else if (a === 'loop') { const i = LOOP_ORDER.indexOf(S.cfg.player.loop); setCfg({ player: { loop: LOOP_ORDER[(i + 1) % LOOP_ORDER.length] } }, { noApply: true }); plRefresh(); }
    else if (a === 'list') { el.classList.toggle('list'); plDrawList(); }
  });
  r.vol.addEventListener('input', () => { PL.audio.volume = Number(r.vol.value); setCfg({ player: { vol: Number(r.vol.value) } }, { noApply: true }); });
  r.bar.addEventListener('click', e => {
    const a = PL.audio; if (!a || !a.duration) return;
    const b = r.bar.getBoundingClientRect(); a.currentTime = clamp((e.clientX - b.left) / b.width, 0, 1) * a.duration;
  });
  /* the disc opens / closes the player; dragging it moves the whole thing */
  r.disc.addEventListener('pointerdown', e => {
    PL.drag = { sx: e.clientX, sy: e.clientY, moved: false, ox: el.offsetLeft, oy: el.offsetTop };
    try { r.disc.setPointerCapture(e.pointerId); } catch (x) {}
  });
  r.disc.addEventListener('pointermove', e => {
    const d = PL.drag; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    if (d.moved) { el.style.left = clamp(d.ox + dx, 6, window.innerWidth - el.offsetWidth - 6) + 'px'; el.style.top = clamp(d.oy + dy, 6, window.innerHeight - el.offsetHeight - 6) + 'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; }
  });
  r.disc.addEventListener('pointerup', () => {
    const d = PL.drag; PL.drag = null; if (!d) return;
    if (d.moved) setCfg({ player: { x: el.offsetLeft, y: el.offsetTop } }, { noApply: true });
    else { const o = el.getAttribute('data-open') !== '1'; el.setAttribute('data-open', o ? '1' : '0'); if (!o) el.classList.remove('list'); setCfg({ player: { open: o } }, { noApply: true }); placePlayer(); }
  });
  window.addEventListener('resize', placePlayer);
  S.undo.push(() => window.removeEventListener('resize', placePlayer));

  const au = PL.audio = new Audio(); au.preload = 'metadata'; au.volume = cfg.vol;
  au.addEventListener('timeupdate', plTick); au.addEventListener('play', plRefresh); au.addEventListener('pause', plRefresh);
  au.addEventListener('ended', () => plStep('ended'));
  au.addEventListener('error', () => { if (PL.idx >= 0) { A().toast(A().t('pl.broken', { name: plTitle(S.cfg.player.list[PL.idx] || {}).title })); } });
  if (navigator.mediaSession) {
    const ms = navigator.mediaSession, h = (n, f) => { try { ms.setActionHandler(n, f); } catch (e) {} };
    h('play', () => plToggle(true)); h('pause', () => plToggle(false)); h('previoustrack', () => plStep('prev')); h('nexttrack', () => plStep('next'));
  }
  plRefresh();
}
function placePlayer() {
  const el = PL.el; if (!el) return;
  const c = S.cfg.player;
  if (c.x != null && c.y != null) {
    el.style.left = clamp(c.x, 6, Math.max(6, window.innerWidth - el.offsetWidth - 6)) + 'px'; el.style.top = clamp(c.y, 6, Math.max(6, window.innerHeight - el.offsetHeight - 6)) + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
  }
}
function plDrawList() {
  const r = PL.refs, list = S.cfg.player.list; if (!r.list) return;
  r.list.innerHTML = list.length ? list.map((t, i) => '<div class="mw-pl-item' + (i === PL.idx ? ' cur' : '') + '" data-i="' + i + '"><span>' + esc(plTitle(t).title) + '</span>' + (t.lrc ? '<span class="mw-chip">LRC</span>' : '') + '</div>').join('')
    : '<div class="mw-empty">' + esc(A().t('pl.empty')) + '</div>';
}
function plRefresh() {
  const r = PL.refs, list = S.cfg.player.list, t = list[PL.idx], au = PL.audio; if (!r.title) return;
  const meta = t ? plTitle(t) : null;
  r.title.textContent = meta ? meta.title : A().t('pl.idle');
  if (!PL.lines.length) r.sub.textContent = meta ? (meta.artist || '') : A().t('pl.hint');
  const playing = !!au && !au.paused;
  r.go.innerHTML = playing ? SVP.pause : SVP.play;
  PL.el.classList.toggle('playing', playing);
  const lp = S.cfg.player.loop; r.loop.innerHTML = SVP[lp] || SVP.all; r.loop.title = A().t('pl.loop.' + lp);
  PL.el.style.display = S.cfg.player.on ? '' : 'none'; PL.lyricEl.style.display = S.cfg.player.on ? '' : 'none';
  if (navigator.mediaSession && meta) { try { navigator.mediaSession.metadata = new MediaMetadata({ title: meta.title, artist: meta.artist || 'Morrow Glass' }); navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch (e) {} }
  plDrawList();
}
function plTick() {
  const au = PL.audio; if (!au) return;
  if (au.duration) PL.refs.fill.style.width = (au.currentTime / au.duration * 100) + '%';
  if (!PL.lines.length) return;
  const i = lineAt(PL.lines, au.currentTime);
  if (i === PL.li) return;
  PL.li = i;
  const txt = i >= 0 ? PL.lines[i].text : '';
  PL.refs.sub.textContent = txt || (S.cfg.player.list[PL.idx] ? plTitle(S.cfg.player.list[PL.idx]).artist : '');
  PL.lyricEl.textContent = txt; PL.lyricEl.classList.toggle('on', !!txt && S.cfg.player.lyric && !au.paused);
}
async function plLoad(i, autoplay) {
  const api = A(), list = S.cfg.player.list, t = list[i]; if (!t) return;
  const token = ++PL.loading;
  PL.idx = i; PL.lines = []; PL.li = -1; PL.lyricEl.textContent = ''; PL.lyricEl.classList.remove('on'); PL.refs.fill.style.width = '0';
  const url = await api.blob.url('mu:' + t.id);
  if (token !== PL.loading) return;
  if (!url) { api.toast(api.t('pl.broken', { name: plTitle(t).title })); return; }
  PL.audio.src = url;
  if (t.lrc) { try { const b = await api.blob.get('lrc:' + t.id); if (b && token === PL.loading) PL.lines = parseLrc(await decodeText(b)); } catch (e) {} }
  plRefresh();
  if (autoplay) { try { await PL.audio.play(); } catch (e) {} }
  plRefresh();
}
function plToggle(force) {
  const au = PL.audio, list = S.cfg.player.list; if (!au || !list.length) return;
  if (PL.idx < 0) { plLoad(0, true); return; }
  const want = force === undefined ? au.paused : !!force;
  if (want) { const p = au.play(); if (p && p.catch) p.catch(() => {}); } else au.pause();
}
function plStep(mode) {
  const list = S.cfg.player.list, n = list.length, i = nextIndex(n, PL.idx, S.cfg.player.loop, mode);
  if (i < 0) { PL.audio.pause(); PL.audio.currentTime = 0; plRefresh(); return; }
  if (i === PL.idx && mode === 'ended') { PL.audio.currentTime = 0; PL.audio.play().catch(() => {}); return; }
  plLoad(i, true);
}
/* add songs (+ .lrc files with the same name); also attaches new .lrc files to songs that are already in the list */
async function plAdd(files) {
  const api = A(), pl = S.cfg.player, list = pl.list.slice();
  const lrcs = {}; files.filter(isLrcFile).forEach(f => { lrcs[stemOf(f.name)] = f; });
  let added = 0, attached = 0;
  for (const f of files.filter(isAudioFile)) {
    const id = newId(), lrc = lrcs[stemOf(f.name)];
    await api.blob.put('mu:' + id, f, { name: f.name });
    if (lrc) await api.blob.put('lrc:' + id, lrc, { name: lrc.name });
    list.push({ id, name: f.name, lrc: !!lrc }); added++; if (lrc) delete lrcs[stemOf(f.name)];
  }
  for (const t of list) {
    const lrc = lrcs[stemOf(t.name)];
    if (lrc && !t.lrc) { await api.blob.put('lrc:' + t.id, lrc, { name: lrc.name }); t.lrc = true; attached++; }
  }
  setCfg({ player: { list } }, { noApply: true });
  plRefresh();
  return { added, attached };
}
async function plRemove(id) {
  const api = A(), list = S.cfg.player.list, i = list.findIndex(t => t.id === id); if (i < 0) return;
  const wasCur = i === PL.idx;
  try { await api.blob.remove('mu:' + id); await api.blob.remove('lrc:' + id); } catch (e) {}
  const nl = list.filter(t => t.id !== id);
  if (wasCur) { PL.audio.pause(); PL.audio.removeAttribute('src'); PL.idx = -1; PL.lines = []; PL.lyricEl.textContent = ''; PL.lyricEl.classList.remove('on'); }
  else if (i < PL.idx) PL.idx--;
  setCfg({ player: { list: nl } }, { noApply: true });
  plRefresh();
}
async function plClear() {
  const api = A(), list = S.cfg.player.list;
  for (const t of list) { try { await api.blob.remove('mu:' + t.id); await api.blob.remove('lrc:' + t.id); } catch (e) {} }
  if (PL.audio) { PL.audio.pause(); PL.audio.removeAttribute('src'); }
  PL.idx = -1; PL.lines = [];
  if (PL.lyricEl) { PL.lyricEl.textContent = ''; PL.lyricEl.classList.remove('on'); }
  setCfg({ player: { list: [] } }, { noApply: true });
  plRefresh();
}
function destroyPlayer() {
  if (PL.audio) { try { PL.audio.pause(); PL.audio.removeAttribute('src'); PL.audio.load(); } catch (e) {} }
  if (PL.el) PL.el.remove();
  if (PL.lyricEl) PL.lyricEl.remove();
  if (navigator.mediaSession) { ['play', 'pause', 'previoustrack', 'nexttrack'].forEach(n => { try { navigator.mediaSession.setActionHandler(n, null); } catch (e) {} }); }
  PL.el = PL.lyricEl = PL.audio = null; PL.idx = -1; PL.lines = []; PL.refs = {};
}

/* ═════════════════════════  settings page  ═════════════════════════ */
function h(tag, attrs) {
  const e = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(k => {
    const v = attrs[k];
    if (v === false || v == null) return;
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  });
  for (let i = 2; i < arguments.length; i++) [].concat(arguments[i]).forEach(c => { if (c == null || c === false) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}
const SWATCHES = ['#4f8cff', '#7a6cff', '#c15bff', '#ff5fa2', '#ff6b5e', '#ffa23b', '#43c978', '#2cc4c9'];

function buildSettings(container) {
  const api = S.api, t = k => api.t(k);
  const UI = { refreshPreview() {} };
  const mats = {};
  const root = h('div', { class: 'mw-ui' });

  const section = (title, hint) => { const s = h('div', { class: 'mw-sec' }, h('h3', null, title)); if (hint) s.appendChild(h('div', { class: 'mw-hint' }, hint)); return s; };
  const row = (label, ...kids) => h('div', { class: 'mw-row' }, label ? h('label', null, label) : null, ...kids);
  const seg = (opts, get, pick) => {
    const el = h('div', { class: 'mw-seg' });
    opts.forEach(o => el.appendChild(h('button', { type: 'button', class: get() === o.v ? 'on' : '', onclick: () => { pick(o.v); [].forEach.call(el.children, (b, i) => b.classList.toggle('on', opts[i].v === o.v)); } }, o.l)));
    return el;
  };
  const range = (min, max, step, get, set, fmt) => {
    const out = h('b', null, fmt(get())), inp = h('input', { type: 'range', min, max, step, value: get() });
    inp.addEventListener('input', () => { const v = Number(inp.value); set(v); out.textContent = fmt(v); });
    return h('div', { class: 'mw-range' }, inp, out);
  };
  const toggle = (get, set) => { const el = h('div', { class: 'mw-switch' + (get() ? ' on' : ''), role: 'switch', tabindex: '0' }); const f = () => { const v = !el.classList.contains('on'); el.classList.toggle('on', v); set(v); }; el.addEventListener('click', f); el.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); f(); } }); return el; };
  const btn = (label, fn, kind) => h('button', { type: 'button', class: 'mw-btn' + (kind ? ' ' + kind : ''), onclick: fn }, label);
  const rebuild = () => { container.textContent = ''; const u = buildSettings(container); S.ui = u; };

  /* 1 · material */
  const sMat = section(t('mat.title'), t('mat.hint'));
  const grid = h('div', { class: 'mw-mats' });
  Object.keys(MATERIALS).forEach(k => {
    const glass = h('div', { class: 'glass' }), card = h('div', { class: 'mw-mat' + (S.cfg.material === k ? ' on' : ''), onclick: () => { setCfg({ material: k }); Object.keys(mats).forEach(x => mats[x].card.classList.toggle('on', x === k)); } }, glass, h('span', null, t('mat.' + k)));
    mats[k] = { card, glass }; grid.appendChild(card);
  });
  UI.refreshPreview = () => {
    const cfg = S.cfg, hh = cfg.hue;
    Object.keys(mats).forEach(k => {
      const T = tokens(Object.assign({}, cfg, { material: k }), true), v = T.vars;
      mats[k].card.style.background = 'linear-gradient(135deg,hsl(' + hh + ',80%,52%),hsl(' + (hh + 60) + ',75%,58%) 55%,hsl(' + (hh - 55) + ',80%,48%))';
      mats[k].glass.style.cssText = 'background:' + v['--mw-grain'] + ',' + v['--mw-sheen'] + ',' + v['--mw-fill'] + ';border:1px solid ' + v['--mw-line'] + ';box-shadow:' + v['--mw-hi'] +
        ';-webkit-backdrop-filter:blur(' + v['--mw-blur'] + ') saturate(' + v['--mw-sat'] + ');backdrop-filter:blur(' + v['--mw-blur'] + ') saturate(' + v['--mw-sat'] + ')';
    });
  };
  sMat.appendChild(grid);
  sMat.appendChild(row(t('mat.depth'), range(0, 100, 1, () => S.cfg.depth, v => setCfg({ depth: v }), v => Math.round(v) + '%')));
  sMat.appendChild(row(t('mat.radius'), range(8, 36, 1, () => S.cfg.radius, v => setCfg({ radius: v }), v => Math.round(v) + ' px')));
  sMat.appendChild(row(t('base.title'), seg([{ v: 'dark', l: t('base.dark') }, { v: 'light', l: t('base.light') }, { v: 'auto', l: t('base.auto') }], () => S.cfg.base, v => setCfg({ base: v }))));
  sMat.appendChild(row(t('mat.motion'), toggle(() => S.cfg.motion, v => setCfg({ motion: v }))));
  sMat.appendChild(row(t('mat.perf'), toggle(() => S.cfg.perf, v => setCfg({ perf: v })), h('span', { class: 'mw-hint', style: 'margin:0' }, t('mat.perfHint'))));
  root.appendChild(sMat);

  /* 2 · colour compass */
  const sCol = section(t('col.title'), t('col.hint'));
  const SIZE = 180, R = SIZE / 2, cv = h('canvas', { class: 'mw-wheel', width: SIZE, height: SIZE }), knob = h('div', { class: 'mw-knob' });
  const box = h('div', { class: 'mw-wheelbox' }, cv, knob);
  const hexIn = h('input', { class: 'mw-input', style: 'max-width:130px;flex:0 0 130px', maxlength: '7', spellcheck: 'false' });
  let wheelL = -1;
  const drawWheel = () => {
    if (wheelL === S.cfg.light) return; wheelL = S.cfg.light;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const img = ctx.createImageData(SIZE, SIZE), L = S.cfg.light;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const dx = x + .5 - R, dy = y + .5 - R, r = Math.sqrt(dx * dx + dy * dy), i = (y * SIZE + x) * 4;
      if (r > R) continue;
      const rgb = hsl2rgb((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360, r / R * 100, L);
      img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2]; img.data[i + 3] = r > R - 1 ? Math.round((R - r) * 255) : 255;
    }
    ctx.putImageData(img, 0, 0);
  };
  const place = () => {
    const a = S.cfg.hue * Math.PI / 180, r = S.cfg.sat / 100 * (R - 2);
    knob.style.left = (R + Math.sin(a) * r) + 'px'; knob.style.top = (R - Math.cos(a) * r) + 'px';
    knob.style.background = hex(hsl2rgb(S.cfg.hue, S.cfg.sat, S.cfg.light));
    hexIn.value = hex(hsl2rgb(S.cfg.hue, S.cfg.sat, S.cfg.light));
  };
  const pick = e => {
    const b = cv.getBoundingClientRect(), dx = (e.clientX - b.left) / b.width * SIZE - R, dy = (e.clientY - b.top) / b.height * SIZE - R;
    const r = Math.min(Math.sqrt(dx * dx + dy * dy), R - 2);
    setCfg({ hue: Math.round((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360), sat: Math.round(r / (R - 2) * 100) });
    place();
  };
  let down = false;
  cv.addEventListener('pointerdown', e => { down = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} pick(e); });
  cv.addEventListener('pointermove', e => { if (down) pick(e); });
  cv.addEventListener('pointerup', () => { down = false; });
  hexIn.addEventListener('change', () => { const c = hexToHsl(hexIn.value); if (c) { setCfg({ hue: c.h, sat: c.s, light: clamp(c.l, 25, 80) }); drawWheel(); } place(); });
  const sw = h('div', { class: 'mw-swatches' });
  SWATCHES.forEach(c => sw.appendChild(h('div', { class: 'mw-sw', style: 'background:' + c, title: c, onclick: () => { const q = hexToHsl(c); setCfg({ hue: q.h, sat: q.s, light: clamp(q.l, 25, 80) }); drawWheel(); place(); } })));
  const right = h('div', { style: 'display:flex;flex-direction:column;gap:14px;flex:1;min-width:220px' },
    row(t('col.hex'), hexIn), row(t('col.light'), range(25, 80, 1, () => S.cfg.light, v => { setCfg({ light: v }); place(); clearTimeout(drawWheel.t); drawWheel.t = setTimeout(drawWheel, 80); }, v => Math.round(v) + '%')), sw);
  sCol.appendChild(h('div', { class: 'mw-compass' }, box, right));
  root.appendChild(sCol);
  drawWheel(); place();

  /* 3 · background */
  const sBg = section(t('bg.title'), t('bg.hint'));
  const hasBlob = !!api.blob;
  const bgInfo = h('span', { class: 'mw-chip' });
  const updInfo = () => { const b = S.cfg.bg; bgInfo.textContent = b.mode !== 'media' ? t('bg.aurora') : (b.source === 'file' ? b.fileName || t('bg.media') : b.url); };
  updInfo();
  sBg.appendChild(row(null, seg([{ v: 'aurora', l: t('bg.aurora') }, { v: 'media', l: t('bg.media') }], () => S.cfg.bg.mode, v => { if (v === 'media' && !bgSpec(Object.assign({}, S.cfg, { bg: Object.assign({}, S.cfg.bg, { mode: 'media' }) }))) { api.toast(t('bg.none')); rebuild(); return; } setCfg({ bg: { mode: v } }); updInfo(); }), bgInfo));
  const urlIn = h('input', { class: 'mw-input', placeholder: 'https://… .jpg / .gif / .webp / .mp4 / .webm', value: S.cfg.bg.source === 'url' ? S.cfg.bg.url : '' });
  sBg.appendChild(row(null,
    btn(t('bg.choose'), async () => {
      if (!hasBlob) { api.toast(t('warn.oldHost')); return; }
      const files = await api.pickFile({ accept: 'image/*,video/*,.gif,.webp,.mp4,.webm', maxSize: 500 * 1024 * 1024 });
      if (!files || !files[0]) return;
      const f = files[0], isV = /^video\//.test(f.type) || isVideoName(f.name), key = 'bg-' + newId(), old = S.cfg.bg.key;
      try { await api.blob.put(key, f, { name: f.name }); } catch (e) { api.toast(String(e && e.message || e)); return; }
      setCfg({ bg: { mode: 'media', source: 'file', type: isV ? 'video' : 'image', key, fileName: f.name } });
      if (old && old !== key) api.blob.remove(old).catch(() => {});
      rebuild();
    }, 'pri'),
    urlIn,
    btn(t('bg.apply'), () => {
      const u = urlIn.value.trim();
      if (!/^https?:\/\/\S+$/i.test(u)) { api.toast(t('bg.badUrl')); return; }
      setCfg({ bg: { mode: 'media', source: 'url', url: u, type: isVideoName(u) ? 'video' : 'image' } }); rebuild();
    })));
  sBg.appendChild(row(t('bg.dim'), range(0, 90, 1, () => S.cfg.bg.dim, v => setCfg({ bg: { dim: v } }), v => Math.round(v) + '%')));
  sBg.appendChild(row(t('bg.blur'), range(0, 40, 1, () => S.cfg.bg.blur, v => setCfg({ bg: { blur: v } }), v => Math.round(v) + ' px')));
  sBg.appendChild(row(t('bg.sat'), range(40, 220, 1, () => S.cfg.bg.sat, v => setCfg({ bg: { sat: v } }), v => Math.round(v) + '%')));
  sBg.appendChild(row(null, btn(t('bg.remove'), async () => {
    const old = S.cfg.bg.key; setCfg({ bg: { mode: 'aurora', key: '', fileName: '', url: '' } });
    if (old && hasBlob) { try { await api.blob.remove(old); } catch (e) {} }
    rebuild();
  }, 'danger')));
  root.appendChild(sBg);

  /* 4 · music */
  const sMu = section(t('mu.title'), t('mu.hint'));
  const pl = S.cfg.player, tracks = h('div', { class: 'mw-tracks' });
  const drawTracks = () => {
    tracks.textContent = '';
    if (!S.cfg.player.list.length) { tracks.appendChild(h('div', { class: 'mw-empty' }, t('mu.none'))); return; }
    S.cfg.player.list.forEach((tr, i) => tracks.appendChild(h('div', { class: 'mw-track' + (i === PL.idx ? ' cur' : '') },
      h('span', null, plTitle(tr).title + (plTitle(tr).artist ? ' · ' + plTitle(tr).artist : '')), tr.lrc ? h('span', { class: 'mw-chip' }, 'LRC') : null,
      h('button', { type: 'button', onclick: () => { if (PL.audio) { plLoad(i, true); setTimeout(drawTracks, 300); } } }, t('mu.play')),
      h('button', { type: 'button', onclick: async () => { await plRemove(tr.id); drawTracks(); } }, t('mu.remove')))));
  };
  sMu.appendChild(row(t('mu.on'), toggle(() => S.cfg.player.on, v => { setCfg({ player: { on: v } }, { noApply: true }); if (!v && PL.audio) PL.audio.pause(); plRefresh(); })));
  sMu.appendChild(row(null,
    btn(t('mu.add'), async () => {
      if (!hasBlob || !PL.audio) { api.toast(t('warn.oldHost')); return; }
      const files = await api.pickFile({ accept: 'audio/*,.mp3,.flac,.wav,.ogg,.m4a,.aac,.opus,.lrc', multiple: true, maxSize: 300 * 1024 * 1024 });
      if (!files) return;
      try { const r = await plAdd(files); api.toast(t('mu.added', { n: r.added, m: r.attached })); } catch (e) { api.toast(String(e && e.message || e)); }
      drawTracks();
    }, 'pri'),
    btn(t('mu.clear'), async () => { const ok = await api.confirmAsync(t('mu.confirmClear'), { title: t('mu.title') }); if (ok) { await plClear(); drawTracks(); } }, 'danger')));
  sMu.appendChild(row(t('mu.vol'), range(0, 1, 0.01, () => S.cfg.player.vol, v => { setCfg({ player: { vol: v } }, { noApply: true }); if (PL.audio) PL.audio.volume = v; if (PL.refs.vol) PL.refs.vol.value = v; }, v => Math.round(v * 100) + '%')));
  sMu.appendChild(row(t('mu.loop'), seg(LOOP_ORDER.map(k => ({ v: k, l: t('pl.loop.' + k) })), () => S.cfg.player.loop, v => { setCfg({ player: { loop: v } }, { noApply: true }); plRefresh(); })));
  sMu.appendChild(row(t('mu.lyric'), toggle(() => S.cfg.player.lyric, v => { setCfg({ player: { lyric: v } }, { noApply: true }); if (!v && PL.lyricEl) PL.lyricEl.classList.remove('on'); })));
  sMu.appendChild(tracks); drawTracks();
  root.appendChild(sMu);

  /* 5 · data */
  const sData = section(t('data.title'));
  const usage = h('span', { class: 'mw-chip' }, '…');
  if (hasBlob) api.blob.usage().then(n => { usage.textContent = t('data.usage') + ' ' + (n / 1048576).toFixed(1) + ' MB'; }).catch(() => { usage.textContent = ''; });
  const exportable = () => { const c = S.cfg; return { v: 1, cfg: { material: c.material, depth: c.depth, base: c.base, hue: c.hue, sat: c.sat, light: c.light, radius: c.radius, perf: c.perf, motion: c.motion,
    bg: { mode: c.bg.source === 'url' ? c.bg.mode : 'aurora', type: c.bg.type, source: 'url', url: c.bg.source === 'url' ? c.bg.url : '', dim: c.bg.dim, blur: c.bg.blur, sat: c.bg.sat } } }; };
  sData.appendChild(row(null,
    btn(t('data.export'), () => api.downloadText('morrow-glass.json', JSON.stringify(exportable(), null, 2), 'application/json')),
    btn(t('data.import'), async () => {
      const files = await api.pickFile({ accept: '.json,application/json', maxSize: 1024 * 1024 }); if (!files || !files[0]) return;
      try { const j = JSON.parse(await files[0].text()); if (!j || !j.cfg) throw new Error('bad'); const keep = S.cfg; setCfg(Object.assign({}, j.cfg, { player: keep.player, bg: Object.assign({}, j.cfg.bg || {}, { key: '', fileName: '' }) })); api.toast(t('data.imported')); rebuild(); }
      catch (e) { api.toast(t('data.badFile')); }
    }),
    btn(t('data.reset'), async () => { const ok = await api.confirmAsync(t('data.confirmReset'), { title: t('data.title') }); if (!ok) return; const keep = S.cfg.player; setCfg(Object.assign(normCfg({}), { player: keep })); api.toast(t('data.resetDone')); rebuild(); }, 'danger'),
    usage));
  root.appendChild(sData);

  container.appendChild(root);
  UI.rebuild = rebuild;
  UI.refreshPreview();
  return UI;
}

/* ═════════════════════════  texts  ═════════════════════════ */
const MSG = {
  en: {
    'mat.title': 'Glass material', 'mat.hint': 'How the panels look. Depth controls how strong the blur is and how opaque the glass is.',
    'mat.frosted': 'Frosted', 'mat.clear': 'Ultra clear', 'mat.liquid': 'Liquid glass', 'mat.solid': 'Solid', 'mat.grain': 'Grain',
    'mat.depth': 'Depth', 'mat.radius': 'Corner radius', 'mat.motion': 'Moving aurora', 'mat.perf': 'Light blur on cards', 'mat.perfHint': 'Turn on if scrolling feels heavy.',
    'base.title': 'Brightness', 'base.dark': 'Dark', 'base.light': 'Light', 'base.auto': 'Follow system',
    'col.title': 'Colour compass', 'col.hint': 'Turn the knob: the angle is the hue, the distance from the centre is the saturation. The whole app (and the login page) follows.', 'col.hex': 'Colour', 'col.light': 'Lightness',
    'bg.title': 'Background', 'bg.hint': 'An image, GIF or video behind the glass. Local files are kept on this PC and also used on the login page.',
    'bg.aurora': 'Aurora', 'bg.media': 'Image / video', 'bg.choose': 'Choose file…', 'bg.apply': 'Use link', 'bg.none': 'Choose a file or paste a link first.', 'bg.badUrl': 'The link must start with http:// or https://',
    'bg.dim': 'Dim', 'bg.blur': 'Blur', 'bg.sat': 'Saturation', 'bg.remove': 'Remove background',
    'mu.title': 'Music player', 'mu.hint': 'Local songs with lyrics. Pick the songs together with their .lrc files (same file name) to get lyrics.',
    'mu.on': 'Show the player', 'mu.add': 'Add songs…', 'mu.clear': 'Remove all', 'mu.confirmClear': 'Remove every song from the player?', 'mu.vol': 'Volume', 'mu.loop': 'Play mode', 'mu.lyric': 'Floating lyrics',
    'mu.none': 'No songs yet.', 'mu.added': 'Added {n} song(s), {m} lyric file(s) attached.', 'mu.play': 'Play', 'mu.remove': 'Remove',
    'pl.idle': 'Morrow player', 'pl.hint': 'Add songs in the plugin settings', 'pl.empty': 'No songs yet - add some in the plugin settings.', 'pl.broken': 'Could not play "{name}".',
    'pl.loop.all': 'List loop', 'pl.loop.one': 'Single loop', 'pl.loop.shuffle': 'Shuffle', 'pl.loop.off': 'No loop',
    'data.title': 'Backup & reset', 'data.export': 'Export look', 'data.import': 'Import look', 'data.reset': 'Reset look', 'data.usage': 'Stored media:',
    'data.imported': 'Look imported.', 'data.badFile': 'That file is not a Morrow Glass look.', 'data.resetDone': 'Back to the default look.', 'data.confirmReset': 'Reset every appearance setting? Songs and the background file are kept.',
    'warn.epic': 'Morrow Glass: please disable "Epic Launcher Style" - two full-window styles fight each other.',
    'warn.oldHost': 'Morrow Glass: this UI build is older than API 2.5, so the login page skin, local backgrounds and the player are unavailable. Update ui.txt.'
  },
  zh: {
    'mat.title': '玻璃材质', 'mat.hint': '决定面板的质感。深度控制模糊强度和玻璃的不透明程度。',
    'mat.frosted': '磨砂', 'mat.clear': '超透', 'mat.liquid': '液体玻璃', 'mat.solid': '纯色', 'mat.grain': '纹理',
    'mat.depth': '深度', 'mat.radius': '圆角', 'mat.motion': '流动极光', 'mat.perf': '卡片轻量模糊', 'mat.perfHint': '滚动有点卡时打开。',
    'base.title': '明暗', 'base.dark': '深色', 'base.light': '浅色', 'base.auto': '跟随系统',
    'col.title': '彩色罗盘', 'col.hint': '转动圆点：角度是色相，离圆心越远饱和度越高。整个程序（包括登录页）都会跟着变色。', 'col.hex': '颜色', 'col.light': '明度',
    'bg.title': '背景', 'bg.hint': '玻璃后面可以放图片、GIF 或视频。本地文件保存在这台电脑上，登录页也会用同一个背景。',
    'bg.aurora': '极光', 'bg.media': '图片 / 视频', 'bg.choose': '选择文件…', 'bg.apply': '使用链接', 'bg.none': '请先选择文件或粘贴链接。', 'bg.badUrl': '链接必须以 http:// 或 https:// 开头',
    'bg.dim': '压暗', 'bg.blur': '模糊', 'bg.sat': '饱和度', 'bg.remove': '移除背景',
    'mu.title': '随身听', 'mu.hint': '本地音乐和歌词。选歌时把同名的 .lrc 歌词文件一起选上就会有歌词。',
    'mu.on': '显示播放器', 'mu.add': '添加歌曲…', 'mu.clear': '全部移除', 'mu.confirmClear': '把播放器里的歌曲全部移除？', 'mu.vol': '音量', 'mu.loop': '播放模式', 'mu.lyric': '悬浮歌词',
    'mu.none': '还没有歌曲。', 'mu.added': '已添加 {n} 首歌曲，关联了 {m} 个歌词文件。', 'mu.play': '播放', 'mu.remove': '移除',
    'pl.idle': '明隙随身听', 'pl.hint': '在插件设置里添加歌曲', 'pl.empty': '还没有歌曲，请在插件设置里添加。', 'pl.broken': '无法播放“{name}”。',
    'pl.loop.all': '列表循环', 'pl.loop.one': '单曲循环', 'pl.loop.shuffle': '随机播放', 'pl.loop.off': '顺序播放',
    'data.title': '备份与重置', 'data.export': '导出外观', 'data.import': '导入外观', 'data.reset': '重置外观', 'data.usage': '已存媒体：',
    'data.imported': '外观已导入。', 'data.badFile': '这不是 Morrow Glass 的外观文件。', 'data.resetDone': '已恢复默认外观。', 'data.confirmReset': '重置所有外观设置？歌曲和背景文件会保留。',
    'warn.epic': 'Morrow Glass：请先停用“Epic Launcher Style”，两个全窗口风格会互相冲突。',
    'warn.oldHost': 'Morrow Glass：当前界面版本低于 API 2.5，登录页皮肤、本地背景和播放器不可用，请更新 ui.txt。'
  }
};

/* ═════════════════════════  the plugin  ═════════════════════════ */
const plugin = {
  id: ID,
  name: 'Morrow Glass',
  version: '1.0.0',
  description: 'Frosted / ultra-clear / liquid glass for the whole app and the login page: colour compass, image / GIF / video background, floating music player with lyrics.',
  permissions: ['appearance', 'dom', 'ui', 'storage', 'navigation', 'download'],
  minApiVersion: '2.3.0',

  activate(api) {
    S.api = api;
    api.registerMessages(MSG);
    if (document.documentElement.getAttribute('data-layout') === 'epic-launcher') api.toast(api.t('warn.epic'));
    if (!api.ui.setSkin || !api.blob) api.toast(api.t('warn.oldHost'));
    S.cfg = normCfg(api.getConfig('cfg', null));

    const aur = document.createElement('div');
    aur.className = 'mw-aurora'; aur.setAttribute('aria-hidden', 'true'); aur.innerHTML = '<i></i><i></i><i></i>';
    document.body.insertBefore(aur, document.body.firstChild);
    S.aurora = aur; S.undo.push(() => aur.remove());

    applyAll();

    try {
      S.mq = window.matchMedia('(prefers-color-scheme: dark)');
      S.onSys = () => { if (S.cfg.base === 'auto') scheduleApply(0); };
      if (S.mq.addEventListener) S.mq.addEventListener('change', S.onSys);
    } catch (e) {}

    try {
      api.ui.addTopbarButton({ title: 'Morrow Glass', icon: '<path d="M12 3l2.4 5.2 5.6.7-4.1 3.9 1.1 5.6L12 15.6 7 18.4l1.1-5.6L4 8.9l5.6-.7L12 3z"/>', onClick: () => api.navigate('plugin') });
    } catch (e) { api.warn('top bar button:', e && e.message ? e.message : e); }

    if (api.blob) { try { buildPlayer(); } catch (e) { api.warn('player:', e && e.message ? e.message : e); } }
  },

  render(container, api) {
    if (!S.api) { container.textContent = ''; return; }
    S.ui = buildSettings(container);
  },

  deactivate(api) {
    clearTimeout(S.applyTimer); clearTimeout(S.saveTimer);
    try { api.setConfig('cfg', S.cfg); } catch (e) {}
    destroyPlayer();
    if (S.mq && S.onSys && S.mq.removeEventListener) S.mq.removeEventListener('change', S.onSys);
    while (S.undo.length) { try { S.undo.pop()(); } catch (e) {} }
    document.documentElement.classList.remove('mw-still', CLS);
    /* the skin, the theme and the injected css are removed by the host */
    S.skin = null; S.styleH = null; S.aurora = null; S.ui = null; S.themeSig = ''; S.mq = null; S.onSys = null;
  }
};
return plugin;
