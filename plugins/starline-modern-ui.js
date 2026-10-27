const plugin = {
  id: 'starline-modern-ui',
  name: 'Modern UI',
  version: '1.0.0',
  description: 'Graphite dark design system: restyled sidebar, top bar, cards, forms, dialogs and toasts, with density, radius, accent and glass options.',
  permissions: ['appearance', 'storage'],
  minApiVersion: '2.2.0',

  /* ------------------------------------------------------------------ *
   * Everything this plugin changes goes through one of three channels,  *
   * all of which are undone on disable / uninstall:                     *
   *   1. api.ui.injectCSS   -> one <style> element (updated in place)   *
   *   2. api.ui.setCssVars  -> design tokens on <html>                  *
   *   3. data-slm* attributes on <html> (removed in deactivate)         *
   * No existing DOM node is moved, renamed or re-bound, so every inline *
   * handler, data binding and shortcut of the host keeps working.       *
   * ------------------------------------------------------------------ */
  activate(api) {
    const ROOT = document.documentElement;
    const DEFAULTS = {
      palette: 'graphite',   // graphite | inherit
      accent: 'auto',        // auto | blue | violet | emerald | amber | rose
      radius: 'soft',        // sharp | soft | round
      density: 'comfortable',// comfortable | compact
      glass: 'balanced',     // balanced | solid
      motion: 'normal'       // normal | reduced
    };
    const ACCENTS = {
      blue:    ['#3b82f6', '#60a5fa', '#93c5fd'],
      violet:  ['#8b5cf6', '#a78bfa', '#c4b5fd'],
      emerald: ['#10b981', '#34d399', '#6ee7b7'],
      amber:   ['#f59e0b', '#fbbf24', '#fcd34d'],
      rose:    ['#f43f5e', '#fb7185', '#fda4af']
    };
    const RADII = {
      sharp: ['5px', '8px', '11px', '14px'],
      soft:  ['8px', '11px', '16px', '22px'],
      round: ['10px', '14px', '20px', '28px']
    };
    const ATTRS = ['data-slm', 'data-slm-palette', 'data-slm-density', 'data-slm-glass', 'data-slm-motion', 'data-slm-page'];

    const state = {
      cfg: Object.assign({}, DEFAULTS),
      css: null,
      vars: null,
      stopPage: null,
      previous: {}
    };
    api.__slm = state;

    /* ---------- persisted settings ---------- */
    function load() {
      let saved = null;
      try { saved = api.getConfig('settings', null); } catch (e) { saved = null; }
      const cfg = Object.assign({}, DEFAULTS);
      if (saved && typeof saved === 'object') {
        Object.keys(DEFAULTS).forEach(function (k) {
          if (typeof saved[k] === 'string') cfg[k] = saved[k];
        });
      }
      if (!ACCENTS[cfg.accent] && cfg.accent !== 'auto') cfg.accent = DEFAULTS.accent;
      if (!RADII[cfg.radius]) cfg.radius = DEFAULTS.radius;
      state.cfg = cfg;
    }

    /* ---------- root attributes (remembered so we can restore them) ---------- */
    function setAttr(name, value) {
      if (!(name in state.previous)) {
        state.previous[name] = ROOT.hasAttribute(name) ? ROOT.getAttribute(name) : null;
      }
      ROOT.setAttribute(name, value);
    }
    function restoreAttrs() {
      ATTRS.forEach(function (name) {
        if (!(name in state.previous)) return;
        if (state.previous[name] === null) ROOT.removeAttribute(name);
        else ROOT.setAttribute(name, state.previous[name]);
      });
      state.previous = {};
    }

    function hexToRgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }

    /* ---------- design tokens ---------- */
    function applyTokens() {
      const c = state.cfg;
      const r = RADII[c.radius] || RADII.soft;
      const vars = {
        '--radius-sm': r[0], '--radius': r[1], '--radius-lg': r[2], '--radius-xl': r[3],
        '--slm-gap': c.density === 'compact' ? '14px' : '20px',
        '--slm-pad': c.density === 'compact' ? '16px' : '22px',
        '--slm-gutter': c.density === 'compact' ? '20px' : '28px',
        '--slm-ctl': c.density === 'compact' ? '34px' : '40px',
        '--slm-nav-y': c.density === 'compact' ? '7px' : '9px'
      };
      if (ACCENTS[c.accent]) {
        const a = ACCENTS[c.accent];
        vars['--accent'] = a[0];
        vars['--accent-2'] = a[1];
        vars['--accent-3'] = a[2];
        vars['--accent-glow'] = hexToRgba(a[0], 0.32);
        vars['--accent-soft'] = hexToRgba(a[0], 0.14);
      }
      if (state.vars) state.vars.remove();
      state.vars = api.ui.setCssVars(vars);
    }

    function applyAttrs() {
      const c = state.cfg;
      setAttr('data-slm', '1');
      setAttr('data-slm-palette', c.palette);
      setAttr('data-slm-density', c.density);
      setAttr('data-slm-glass', c.glass);
      setAttr('data-slm-motion', c.motion);
      setAttr('data-slm-page', api.getPage());
    }

    function applyAll() {
      applyAttrs();
      applyTokens();
    }
    state.defaults = DEFAULTS;
    state.apply = applyAll;

    /* ---------- stylesheet ---------- */
    const CSS = `
/* ===== Palette: graphite dark (dark theme only, light theme is untouched) ===== */
html[data-slm][data-slm-palette="graphite"][data-theme="dark"]{
  --bg:#0b0c0f;--bg-2:#101217;--bg-rgb:11,12,15;
  --surface:rgba(20,21,26,.78);--surface-2:rgba(28,30,37,.92);
  --surface-3:rgba(38,40,49,.96);--surface-solid:#14151a;
  --text:#f2f3f5;--text-2:#aeb1bb;--text-3:#6f7380;
  --border:rgba(255,255,255,.065);--border-2:rgba(255,255,255,.12);
  --overlay:rgba(8,9,12,.78);
  --shadow-1:0 1px 2px rgba(0,0,0,.45);
  --shadow-2:0 8px 24px rgba(0,0,0,.5);
  --shadow-3:0 18px 48px rgba(0,0,0,.62);
}
html[data-slm][data-slm-glass="solid"]{
  --surface:color-mix(in srgb,var(--surface-solid) 94%,#fff 6%);
  --surface-2:color-mix(in srgb,var(--surface-solid) 88%,#fff 12%);
}
html[data-slm]{--slm-card:var(--surface);--slm-hair:var(--border);-webkit-font-smoothing:antialiased}
html[data-slm] ::selection{background:var(--accent-soft);color:var(--text)}

/* ===== Focus: one consistent keyboard ring ===== */
html[data-slm] :focus-visible{outline:2px solid var(--accent-2);outline-offset:2px}
html[data-slm] input:focus-visible,html[data-slm] textarea:focus-visible,html[data-slm] select:focus-visible{outline:0}

/* ===== Scrollbars ===== */
html[data-slm] ::-webkit-scrollbar{width:10px;height:10px}
html[data-slm] ::-webkit-scrollbar-track{background:transparent}
html[data-slm] ::-webkit-scrollbar-thumb{background:var(--border-2);border-radius:999px;border:3px solid transparent;background-clip:content-box}
html[data-slm] ::-webkit-scrollbar-thumb:hover{background:var(--text-3);background-clip:content-box;border:3px solid transparent}

/* ===== Sidebar ===== */
html[data-slm] .sidebar{background:var(--surface-solid);backdrop-filter:none;-webkit-backdrop-filter:none;border-right:1px solid var(--slm-hair)}
html[data-slm][data-slm-glass="balanced"] .sidebar{background:color-mix(in srgb,var(--surface-solid) 82%,transparent);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%)}
html[data-slm][data-layout="rail-r"] .sidebar{border-right:0;border-left:1px solid var(--slm-hair)}
html[data-slm] .sb-brand{padding:18px 16px 14px}
html[data-slm] .sb-logo{width:32px;height:32px;border-radius:var(--radius);animation:none;box-shadow:0 4px 14px -4px var(--accent-glow)}
html[data-slm] .sb-brand-text b{font-size:15px;letter-spacing:-.2px}
html[data-slm] .sb-nav{padding:6px 10px;gap:1px}
html[data-slm] .sb-item,html[data-slm] .sb-tab,html[data-slm] .sb-sub-item{
  padding-top:var(--slm-nav-y);padding-bottom:var(--slm-nav-y);border-radius:var(--radius-sm);
  font-size:13px;font-weight:550;color:var(--text-2);box-shadow:none;transform:none}
html[data-slm] .sb-item:hover,html[data-slm] .sb-tab:hover,html[data-slm] .sb-sub-item:hover{background:var(--surface-2);color:var(--text);transform:none}
html[data-slm] .sb-item.active,html[data-slm] .sb-sub-item.active{background:var(--accent-soft);color:var(--text);box-shadow:none}
html[data-slm] .sb-item.active svg,html[data-slm] .sb-sub-item.active .sb-sub-ico{color:var(--accent-2)}
html[data-slm] .sb-item.active::before{left:-10px;width:3px;height:16px;box-shadow:none}
html[data-slm][data-layout="rail-r"] .sb-item.active::before{left:auto;right:-10px;border-radius:3px 0 0 3px}
html[data-slm] .sb-section{padding:16px 12px 6px;font-size:11.5px;font-weight:600;letter-spacing:.2px;text-transform:none;color:var(--text-3)}
html[data-slm] .sb-foot{padding:10px;border-top:1px solid var(--slm-hair)}
html[data-slm] .sb-task{border-radius:var(--radius);background:var(--surface-2)}
html[data-slm] .sb-badge{background:var(--accent-soft);color:var(--accent-2)}

/* ===== Top bar ===== */
html[data-slm] .topbar{height:56px;padding:0 var(--slm-gutter);gap:10px;border-bottom:1px solid var(--slm-hair);background:color-mix(in srgb,var(--bg) 60%,transparent)}
html[data-slm][data-slm-glass="balanced"] .topbar{backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
html[data-slm] .topbar-search input{height:36px;border-radius:var(--radius);background:var(--surface-2);border-color:var(--slm-hair)}
html[data-slm] .topbar-search input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
html[data-slm] .tb-actions{gap:4px}
html[data-slm] .tb-btn,html[data-slm] .world-map-btn{width:34px;height:34px;flex-basis:34px;border-radius:var(--radius-sm);background:transparent;border-color:transparent;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;transform:none}
html[data-slm] .tb-btn:hover,html[data-slm] .world-map-btn:hover{background:var(--surface-2);border-color:var(--slm-hair);color:var(--text);transform:none;box-shadow:none}
html[data-slm] .tb-btn.close:hover{background:rgba(239,68,68,.14);border-color:transparent;color:var(--err)}
html[data-slm] .tb-avatar{width:30px;height:30px;border-width:1px;margin:0 4px}

/* ===== Pages: consistent gutters, content centred on wide windows ===== */
html[data-slm] .page{padding:20px max(var(--slm-gutter),calc((100% - 1320px) / 2)) 56px}
html[data-slm][data-slm-page="profile"] .profile-wrap{max-width:880px;margin-inline:auto}
html[data-slm] .hero{margin-bottom:calc(var(--slm-gap) + 8px);border-radius:var(--radius-lg);box-shadow:var(--shadow-2)}
html[data-slm] .grid{grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:var(--slm-gap)}

/* ===== Cards and panels ===== */
html[data-slm] .card{border:1px solid var(--slm-hair);border-radius:var(--radius-lg);box-shadow:none;transition:border-color var(--tr),transform var(--tr),box-shadow var(--tr)}
html[data-slm] .card:hover{border-color:var(--border-2);transform:translateY(-2px);box-shadow:var(--shadow-2)}
html[data-slm] .card-body{padding:14px 16px 16px}
html[data-slm] .card-panel{padding:var(--slm-pad);margin-bottom:var(--slm-gap);background:var(--slm-card);border-radius:var(--radius-lg);backdrop-filter:none;-webkit-backdrop-filter:none}
html[data-slm] .panel-head{margin-bottom:calc(var(--slm-pad) - 6px);padding-bottom:12px}
html[data-slm] .panel-ico{width:32px;height:32px;border-radius:var(--radius-sm)}
html[data-slm] .panel-title{font-size:14.5px;font-weight:650}
html[data-slm] .field{gap:7px;margin-bottom:16px}
html[data-slm] .field-label{font-size:12px;font-weight:600;letter-spacing:.1px;text-transform:none;color:var(--text-2)}
html[data-slm] .plugin-item,html[data-slm] .plugin-card,html[data-slm] .plugins-stat,html[data-slm] .ui-card{backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none}
html[data-slm] .plugin-item:hover{transform:none;box-shadow:var(--shadow-1)}

/* ===== Controls ===== */
html[data-slm] .input,html[data-slm] .ui-input{height:var(--slm-ctl);border-radius:var(--radius);background:var(--surface-2);border-color:var(--slm-hair)}
html[data-slm] .input:focus,html[data-slm] .ui-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);outline:0}
html[data-slm] .btn{height:var(--slm-ctl);padding:0 18px;border-radius:var(--radius);font-size:13.5px;font-weight:600}
html[data-slm] .btn-primary{background:var(--accent);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 6px 16px -8px var(--accent-glow)}
html[data-slm] .btn-primary:hover{filter:brightness(1.08);transform:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 8px 20px -8px var(--accent-glow)}
html[data-slm] .btn-primary:active{filter:brightness(.96);transform:none}
html[data-slm] .card-panel .btn-secondary,html[data-slm] .modal .btn-secondary,html[data-slm] .btn-ghost{background:var(--surface-2);border:1px solid var(--slm-hair);color:var(--text);backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none}
html[data-slm] .card-panel .btn-secondary:hover,html[data-slm] .modal .btn-secondary:hover,html[data-slm] .btn-ghost:hover{background:var(--surface-3);border-color:var(--border-2);transform:none}
html[data-slm] .ui-btn{height:var(--slm-ctl);border-radius:var(--radius)}
html[data-slm] .admin-tabs{gap:2px;padding:3px;width:fit-content;max-width:100%;overflow-x:auto;border:1px solid var(--slm-hair);border-radius:calc(var(--radius) + 3px);background:var(--surface)}
html[data-slm] .admin-tab{border-color:transparent;background:transparent;border-radius:var(--radius);padding:7px 14px}
html[data-slm] .admin-tab.active{background:var(--surface-3);color:var(--text);box-shadow:var(--shadow-1)}
html[data-slm] .progress{height:4px;border-radius:999px}

/* ===== Overlays: dialogs, menus, toasts ===== */
html[data-slm] .overlay{background:rgba(6,7,10,.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
html[data-slm] .modal{border-radius:var(--radius-lg);border-color:var(--border-2);box-shadow:var(--shadow-3)}
html[data-slm] .modal-head{padding:18px 22px}
html[data-slm] .modal-close{border-radius:var(--radius-sm)}
html[data-slm] .lg-pop,html[data-slm] .tb-more-pop,html[data-slm] .sk-pop{border-radius:var(--radius-lg);border-color:var(--border-2);box-shadow:var(--shadow-3)}
html[data-slm] .toast{border-radius:var(--radius);box-shadow:var(--shadow-2)}

/* ===== Settings screen (uses --ui-* tokens, which already follow the tokens above) ===== */
html[data-slm] .ui-card{padding:var(--slm-pad);margin-bottom:var(--slm-gap)}

/* ===== Solid glass: no blur anywhere ===== */
html[data-slm][data-slm-glass="solid"] .sidebar,html[data-slm][data-slm-glass="solid"] .topbar,
html[data-slm][data-slm-glass="solid"] .card-panel,html[data-slm][data-slm-glass="solid"] .card,
html[data-slm][data-slm-glass="solid"] .modal,html[data-slm][data-slm-glass="solid"] .overlay,
html[data-slm][data-slm-glass="solid"] .toast,html[data-slm][data-slm-glass="solid"] .lg-pop,
html[data-slm][data-slm-glass="solid"] .tb-more-pop,html[data-slm][data-slm-glass="solid"] .sk-pop{backdrop-filter:none;-webkit-backdrop-filter:none}

/* ===== Reduced motion (setting or OS preference) ===== */
html[data-slm][data-slm-motion="reduced"] .card:hover,html[data-slm][data-slm-motion="reduced"] .plugin-item:hover{transform:none}
html[data-slm][data-slm-motion="reduced"] *,html[data-slm][data-slm-motion="reduced"] *::before,html[data-slm][data-slm-motion="reduced"] *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
@media (prefers-reduced-motion:reduce){
  html[data-slm] .card:hover,html[data-slm] .plugin-item:hover{transform:none}
}

/* ===== Narrow windows ===== */
@media (max-width:1000px){
  html[data-slm]{--slm-gutter:16px}
  html[data-slm] .topbar-search{min-width:140px}
  html[data-slm] .grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
}

/* ===== This plugin's own settings panel ===== */
.slm-panel{display:flex;flex-direction:column;gap:2px;max-width:640px}
.slm-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px solid var(--border)}
.slm-row:last-of-type{border-bottom:0}
.slm-label{min-width:0}
.slm-label b{display:block;font-size:13.5px;font-weight:600;color:var(--text)}
.slm-label span{display:block;margin-top:2px;font-size:12px;line-height:1.5;color:var(--text-3)}
.slm-seg{display:inline-flex;flex-wrap:wrap;gap:2px;padding:3px;border:1px solid var(--border);border-radius:calc(var(--radius) + 3px);background:var(--surface-2)}
.slm-seg button{height:28px;padding:0 12px;border:0;border-radius:var(--radius-sm);background:transparent;color:var(--text-2);font:550 12px var(--font);cursor:pointer;transition:background var(--tr-fast),color var(--tr-fast)}
.slm-seg button:hover{color:var(--text)}
.slm-seg button[aria-pressed="true"]{background:var(--accent);color:#fff}
.slm-swatch{width:14px;height:14px;display:inline-block;margin-right:6px;border-radius:50%;vertical-align:-2px;border:1px solid rgba(255,255,255,.25)}
.slm-actions{display:flex;justify-content:flex-end;padding-top:14px}
.slm-reset{height:32px;padding:0 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface-2);color:var(--text);font:550 12px var(--font);cursor:pointer}
.slm-reset:hover{border-color:var(--border-2);background:var(--surface-3)}
`;

    /* ---------- bootstrap ---------- */
    load();
    state.css = api.ui.injectCSS(CSS, { tag: 'modern-ui' });
    applyAll();

    // Keep the page attribute in sync (per-page layout rules use it).
    // onPage's observer is torn down automatically by api.ui.reset().
    state.stopPage = api.ui.onPage(function (page) {
      setAttr('data-slm-page', page);
    });

    // Another plugin or the theme engine may append stylesheets after ours;
    // move ours to the end again whenever the host re-applies the theme.
    api.onApp('themechange', function () {
      if (state.css && state.css.raise) state.css.raise();
    });
  },

  deactivate(api) {
    // api.ui.reset() (run by the host) already removes the stylesheet,
    // the CSS variables and the page observer. Only the root attributes,
    // which we set ourselves, need restoring here.
    const ROOT = document.documentElement;
    ['data-slm', 'data-slm-palette', 'data-slm-density', 'data-slm-glass', 'data-slm-motion', 'data-slm-page'].forEach(function (n) {
      const s = api.__slm;
      if (s && s.previous && n in s.previous && s.previous[n] !== null) ROOT.setAttribute(n, s.previous[n]);
      else ROOT.removeAttribute(n);
    });
    delete api.__slm;
  },

  /* ---------- settings panel (shown on the plugin's own page) ---------- */
  render(container, api) {
    const T = {
      en: {
        title: 'Modern UI settings',
        palette: ['Surface palette', 'Graphite replaces the dark theme backgrounds. Inherit keeps your current theme colours.', ['Graphite', 'Inherit']],
        accent: ['Accent colour', 'Auto keeps the accent from your current theme.', ['Auto', 'Blue', 'Violet', 'Emerald', 'Amber', 'Rose']],
        radius: ['Corner radius', 'Applies to every card, button, input and dialog.', ['Sharp', 'Soft', 'Round']],
        density: ['Density', 'Compact fits more on screen.', ['Comfortable', 'Compact']],
        glass: ['Glass effect', 'Solid turns off blur, which helps on slower GPUs.', ['Balanced', 'Solid']],
        motion: ['Motion', 'Reduced removes hover lift and long animations.', ['Normal', 'Reduced']],
        reset: 'Restore defaults'
      },
      zh: {
        title: '现代界面设置',
        palette: ['背景配色', '石墨色会替换深色主题的背景；沿用则保留当前主题配色。', ['石墨', '沿用主题']],
        accent: ['强调色', '自动会保留当前主题的强调色。', ['自动', '蓝', '紫', '绿', '琥珀', '玫红']],
        radius: ['圆角', '作用于所有卡片、按钮、输入框和弹窗。', ['锐利', '柔和', '圆润']],
        density: ['密度', '紧凑可以在屏幕上显示更多内容。', ['舒适', '紧凑']],
        glass: ['毛玻璃', '实色会关闭模糊，低性能显卡上更流畅。', ['平衡', '实色']],
        motion: ['动效', '减弱会取消悬停上浮和较长的动画。', ['正常', '减弱']],
        reset: '恢复默认'
      }
    };
    const SWATCH = { blue: '#3b82f6', violet: '#8b5cf6', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e' };
    const KEYS = {
      palette: ['graphite', 'inherit'],
      accent: ['auto', 'blue', 'violet', 'emerald', 'amber', 'rose'],
      radius: ['sharp', 'soft', 'round'],
      density: ['comfortable', 'compact'],
      glass: ['balanced', 'solid'],
      motion: ['normal', 'reduced']
    };

    function strings() {
      const lang = String(api.getLanguage() || 'en').toLowerCase();
      return T[lang.slice(0, 2)] || T.en;
    }
    function current() {
      const s = api.__slm;
      return s ? s.cfg : null;
    }
    function change(key, value) {
      const s = api.__slm;
      if (!s) return;
      s.cfg[key] = value;
      try { api.setConfig('settings', s.cfg); } catch (e) { api.warn(e); }
      api.emit('modern-ui:changed', { key: key, value: value });
    }

    function draw() {
      const cfg = current();
      container.textContent = '';
      if (!cfg) return;
      const L = strings();
      const wrap = document.createElement('div');
      wrap.className = 'slm-panel';

      Object.keys(KEYS).forEach(function (key) {
        const row = document.createElement('div');
        row.className = 'slm-row';
        const label = document.createElement('div');
        label.className = 'slm-label';
        const b = document.createElement('b'); b.textContent = L[key][0];
        const sp = document.createElement('span'); sp.textContent = L[key][1];
        label.append(b, sp);

        const seg = document.createElement('div');
        seg.className = 'slm-seg';
        seg.setAttribute('role', 'group');
        seg.setAttribute('aria-label', L[key][0]);
        KEYS[key].forEach(function (value, i) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('aria-pressed', String(cfg[key] === value));
          if (key === 'accent' && SWATCH[value]) {
            const dot = document.createElement('i');
            dot.className = 'slm-swatch';
            dot.style.background = SWATCH[value];
            btn.appendChild(dot);
          }
          btn.appendChild(document.createTextNode(L[key][2][i]));
          btn.addEventListener('click', function () {
            change(key, value);
            apply();
            draw();
          });
          seg.appendChild(btn);
        });
        row.append(label, seg);
        wrap.appendChild(row);
      });

      const actions = document.createElement('div');
      actions.className = 'slm-actions';
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'slm-reset';
      reset.textContent = L.reset;
      reset.addEventListener('click', function () {
        const s = api.__slm;
        if (!s) return;
        Object.assign(s.cfg, s.defaults);
        try { api.setConfig('settings', s.cfg); } catch (e) { api.warn(e); }
        apply();
        draw();
      });
      actions.appendChild(reset);
      wrap.appendChild(actions);
      container.appendChild(wrap);
    }

    // Re-apply attributes and tokens through the logic owned by activate().
    function apply() {
      const s = api.__slm;
      if (s) s.apply();
    }

    draw();
    api.on('languagechange', function () { if (container.isConnected) draw(); });
  }
};
return plugin;
