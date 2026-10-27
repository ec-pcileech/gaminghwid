/**
 * Epic Launcher Style  —  STARLINE style plugin (API 2.3)
 *
 * Re-skins the whole STARLINE window like the new Epic Games Launcher:
 *   · top tab bar (logo menu, back / forward, pill tabs, window close)
 *   · near-black canvas with one big rounded panel
 *   · pill search box + ghost icon buttons
 *   · text tabs with a white underline for the All / Owned / ... filter
 *   · 3:4 poster grid, white "Buy" / blue "Launch" buttons
 *   · compact icon list with a big detail pane in list mode
 *   · bottom bar with "Recent" (Quickplay + Subscriptions) and "Downloads"
 *
 * Install: Plugins page -> Import -> choose this file -> Enable.
 * Everything is undone automatically when the plugin is disabled.
 */
const LAYOUT = 'epic-launcher';
const E = 'html[data-layout="' + LAYOUT + '"]';

const COLORS = {
  bg: '#0e0e10', surface: '#161618', surface2: '#1d1d21', surface3: '#26262b', surface4: '#303036',
  border: '#232327', borderStrong: '#35353b',
  text: '#f5f5f7', textDim: '#b0b0b9', textMute: '#7b7b85',
  accent: '#0078f2', accentHi: '#3395ff', violet: '#5aa9ff'
};

const FONT = "'Inter','Noto Sans','Microsoft YaHei UI','Microsoft YaHei','Segoe UI',system-ui,sans-serif";

const MSG = {
  en: {
    'menu.settings': 'Settings', 'menu.account': 'Account', 'menu.plugins': 'My plugins', 'menu.faq': 'FAQ',
    'menu.logout': 'Sign out', 'menu.exit': 'Exit',
    'recent': 'Recent', 'downloads': 'Downloads', 'back': 'Back', 'forward': 'Forward',
    'about': 'Epic Launcher Style is active. Disable the plugin to go back to the normal STARLINE look.',
    'settings.title': 'Epic Launcher Style', 'settings.poster': 'Poster cards (3:4)'
  },
  zh: {
    'menu.settings': '设置', 'menu.account': '账户', 'menu.plugins': '我的插件', 'menu.faq': '常见问题',
    'menu.logout': '登出', 'menu.exit': '退出',
    'recent': '最近', 'downloads': '下载', 'back': '后退', 'forward': '前进',
    'about': 'Epic Launcher 风格已启用。停用插件即可恢复 STARLINE 原来的样子。',
    'settings.title': 'Epic Launcher 风格', 'settings.poster': '海报卡片（3:4）'
  }
};

const PAGEFN = { store: 'showStore', profile: 'showProfile', plugins: 'showPlugins', wheel: 'showWheel', admin: 'showAdmin', community: 'showCommunity' };

const S = { api: null, menu: null, recentBtn: null, brand: null, css: null, undo: [] };

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
const ICON = {
  back:  '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
  fwd:   '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
  chev:  '<svg class="chev" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>',
  dl:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v7M9 11.5l3 3 3-3"/></svg>'
};

/* ─────────────────────────────  CSS  ───────────────────────────── */
function buildCss() {
  return `
@E{
  --ep-bg:#0e0e10; --ep-panel:#141416; --ep-panel-2:#1c1c20; --ep-hover:#242429; --ep-active:#2d2d33;
  --ep-line:rgba(255,255,255,.07); --ep-line-2:rgba(255,255,255,.14);
  --ep-text:#f5f5f7; --ep-dim:#a8a8b2; --ep-blue:#0078f2; --ep-blue-hi:#2b94ff;
}
@E [hidden]{display:none!important}
@E body{background:var(--ep-bg)}
@E body::before{display:none!important}
@E *:focus-visible{outline:2px solid #fff!important;outline-offset:2px}
@E ::-webkit-scrollbar{width:8px;height:8px}
@E ::-webkit-scrollbar-track{background:transparent}
@E ::-webkit-scrollbar-thumb{background:#34343a;border-radius:8px}
@E ::-webkit-scrollbar-thumb:hover{background:#4a4a52}

/* ── frame ── */
@E .app{flex-direction:column;padding:0 10px 48px;background:var(--ep-bg)}
@E .main{flex:1;min-height:0;margin-bottom:6px;background:var(--ep-panel);border:1px solid var(--ep-line);border-radius:16px;overflow:hidden}

/* ── top tab bar (the old sidebar) ── */
@E .sidebar{width:auto!important;height:62px!important;flex-direction:row!important;align-items:center;gap:6px;padding:0 54px 0 6px;
  background:transparent;border:0;backdrop-filter:none;-webkit-backdrop-filter:none;flex-shrink:0;position:relative}
@E .sb-brand{padding:0 10px 0 8px;gap:0;height:44px;border-radius:10px;cursor:pointer;flex-shrink:0;-webkit-app-region:no-drag}
@E .sb-brand:hover{background:var(--ep-hover)}
@E .sb-brand-text{display:none}
@E .sb-logo{width:34px;height:36px;border-radius:7px 7px 15px 15px;background:#fff;color:#111;box-shadow:none;animation:none}
@E .sb-logo svg{width:18px;height:18px;stroke-width:2.6}
@E .sb-brand::after{content:'';width:7px;height:7px;margin:-4px 2px 0 9px;border-right:2px solid #c6c6cf;border-bottom:2px solid #c6c6cf;transform:rotate(45deg)}
@E .epic-arrows{display:flex;gap:2px;margin:0 8px 0 2px;flex-shrink:0}
@E .epic-arrow{width:36px;height:36px;border:0;border-radius:10px;background:transparent;color:#d8d8de;display:grid;place-items:center;cursor:pointer;transition:background .15s}
@E .epic-arrow svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@E .epic-arrow:hover:not(:disabled){background:var(--ep-hover);color:#fff}
@E .epic-arrow:disabled{opacity:.3;cursor:default}

@E .sb-nav{flex:1;flex-direction:row!important;align-items:center;gap:4px;padding:0;overflow:visible;min-width:0}
@E .sb-item{height:40px;padding:0 15px;border-radius:10px;gap:9px;font-size:14px;font-weight:600;white-space:nowrap;
  color:#cfcfd6;background:transparent;transform:none!important;box-shadow:none}
@E .sb-item:hover{background:var(--ep-hover);color:#fff}
@E .sb-item.active{background:var(--ep-active);color:#fff}
@E .sb-item.active::before{display:none}
@E .sb-item svg{width:18px;height:18px;flex-shrink:0}
@E .sb-comm{margin-left:2px}
@E .sb-badge{border-radius:99px}
@E .dz-strip{position:fixed;top:66px;left:50%;transform:translateX(-50%);flex-direction:row;z-index:300;margin:0!important}
@E .dz-strip.show{margin:0!important}

/* plugin tab group -> dropdown */
@E .sb-sub{position:relative;margin:0;padding:0;border:0;display:block}
@E .sb-tab{width:auto;height:40px;padding:0 14px;border-radius:10px;font-size:14px;font-weight:600;color:#cfcfd6;transform:none!important}
@E .sb-tab:hover{background:var(--ep-hover);color:#fff}
@E .sb-sub-body{display:none;position:absolute;top:calc(100% + 6px);left:0;min-width:250px;z-index:350;
  background:#1e1e22;border:1px solid var(--ep-line-2);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.6)}
@E .sb-sub.open .sb-sub-body{display:block}
@E .sb-sub-body>div{visibility:visible!important;overflow:auto;max-height:60vh;padding:6px}
@E .sb-sub-item{border-radius:8px;transform:none!important}
@E .sb-sub-item:hover{background:var(--ep-hover)}
@E .sb-sub-item.active{background:var(--ep-active);box-shadow:none;color:#fff}
@E .sb-sub-item.active::before{display:none}

/* window close, top right */
@E .tb-btn.close{position:fixed;top:12px;right:10px;z-index:400;width:44px;height:38px;border-radius:8px;
  background:transparent;border:0;color:#d8d8de}
@E .tb-btn.close:hover{background:#c42b1c;color:#fff}

/* ── bottom bar (the old sidebar footer) ── */
@E .sb-foot{position:fixed;left:0;right:0;bottom:0;height:48px;z-index:200;margin:0;padding:0 22px;border:0;background:var(--ep-bg);
  display:grid;grid-template-columns:1fr auto 1fr;grid-template-rows:48px;align-items:center}
@E .sb-foot>*{grid-row:1}
@E .sb-foot>.sb-item{grid-column:3;justify-self:end;height:34px;padding:0 12px;font-size:13px;color:var(--ep-dim)}
@E .epic-recent,@E .epic-dl{display:flex;align-items:center;gap:9px;height:34px;padding:0 12px;border:0;border-radius:9px;background:transparent;
  color:#d0d0d7;font:600 13px/1 var(--font);cursor:pointer}
@E .epic-recent{grid-column:1;justify-self:start}
@E .epic-recent:hover,@E.epic-recent-open .epic-recent{background:var(--ep-hover);color:#fff}
@E .epic-dl{grid-column:2;cursor:default;color:var(--ep-dim)}
@E .epic-recent svg,@E .epic-dl svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
@E .epic-recent .chev{width:13px;height:13px}
@E .sb-foot .sb-task{grid-column:2;margin:0;width:340px;padding:7px 12px;background:var(--ep-panel-2);border:1px solid var(--ep-line)}
@E .sb-foot .sb-task:not([hidden])~.epic-dl{display:none}

/* "Recent" popup = Quickplay + Subscriptions */
@E .qp-zone{display:none}
@E.epic-recent-open .qp-zone{display:block;position:fixed;left:14px;bottom:54px;z-index:420;width:300px;max-height:62vh;overflow:auto;
  padding:8px;background:#1c1c20;border:1px solid var(--ep-line-2);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.65)}
@E .qp-zone .sb-section{padding:12px 10px 6px;font-size:11px;letter-spacing:.6px}
@E #storeBackTop{bottom:62px}

/* ── logo dropdown ── */
.epic-menu{position:fixed;top:58px;left:14px;z-index:2147483000;width:268px;padding:8px;background:#1c1c20;color:#f2f2f5;
  border:1px solid rgba(255,255,255,.1);border-radius:14px;box-shadow:0 22px 60px rgba(0,0,0,.65);
  font:500 14px/1.2 var(--font);opacity:0;transform:translateY(-6px);transition:opacity .14s,transform .16s}
.epic-menu.on{opacity:1;transform:none}
.epic-menu button{display:block;width:100%;height:42px;padding:0 14px;border:0;border-radius:8px;background:transparent;color:inherit;
  text-align:left;font:inherit;cursor:pointer}
.epic-menu button:hover{background:#2b2b31}
.epic-menu hr{height:1px;margin:6px 8px;border:0;background:rgba(255,255,255,.09)}

/* ── second row: search + icons ── */
@E .topbar{height:64px;padding:0 22px 0 26px;gap:10px}
@E .topbar-search{max-width:340px;min-width:220px}
@E .topbar-search input{height:40px;border-radius:999px;background:var(--ep-panel-2);border:1px solid transparent;font-size:14px;
  backdrop-filter:none;-webkit-backdrop-filter:none}
@E .topbar-search input:focus{background:var(--ep-hover);border-color:rgba(255,255,255,.22);box-shadow:none}
@E .tb-btn:not(.close),@E .world-map-btn{width:40px;height:40px;border:0;border-radius:10px;background:transparent;color:#d5d5db;
  box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;margin-left:0}
@E .tb-btn:not(.close):hover,@E .world-map-btn:hover{background:var(--ep-hover);color:#fff;transform:none;box-shadow:none;border:0}
@E .tb-avatar{width:34px;height:34px;border:0;background:linear-gradient(135deg,#0078f2,#5aa9ff)}
@E .tb-more.open{background:var(--ep-active);border:0;color:#fff}

/* ── store page ── */
@E .page{padding:4px 28px 40px}
@E .hero{height:clamp(300px,46vh,460px);border-radius:18px;box-shadow:none;margin-bottom:30px}
@E .hero-ctrl{background:rgba(20,20,22,.7);border:0}
@E .sec-head{margin-bottom:22px;gap:14px}
@E .sec-title{font-size:20px;font-weight:700;letter-spacing:-.2px}
@E .sec-title::before{display:none}
@E .sec-count{background:var(--ep-panel-2);color:var(--ep-dim);border:0}
@E .sec-filter{gap:24px;padding:0;background:none;border:0;border-radius:0;backdrop-filter:none;-webkit-backdrop-filter:none}
@E .sec-filter button{padding:8px 2px;border-radius:0;background:transparent!important;box-shadow:none!important;color:var(--ep-dim);
  font-size:14px;font-weight:600;border-bottom:3px solid transparent}
@E .sec-filter button:hover{color:#fff}
@E .sec-filter button.active{color:#fff;border-bottom-color:#fff}
@E .store-view-switch{padding:3px;background:var(--ep-panel-2);border:0;border-radius:999px;backdrop-filter:none}
@E .store-view-btn{width:34px;height:34px;border-radius:999px}
@E .store-view-btn.active{background:var(--ep-active);color:#fff;box-shadow:none}
@E .genre-btn{height:40px;padding:0 16px;border:0;border-radius:999px;background:var(--ep-panel-2);color:#e8e8ec;box-shadow:none;backdrop-filter:none}
@E .genre-btn:hover{background:var(--ep-hover)}
@E .genre-pop{background:#1e1e22;border:1px solid var(--ep-line-2);border-radius:12px}

/* poster grid */
@E:not(.epic-landscape) .grid:not(.list):not(.cols-n){grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:24px 18px}
@E:not(.epic-landscape) .grid:not(.list) .card-img{aspect-ratio:3/4}
@E .card{background:transparent;border:0;box-shadow:none;border-radius:12px;backdrop-filter:none;-webkit-backdrop-filter:none}
@E .card:hover{transform:translateY(-4px);box-shadow:none;border:0}
@E .card-img{border-radius:12px;background:var(--ep-panel-2);transition:box-shadow .18s}
@E .card:hover .card-img{box-shadow:0 0 0 2px rgba(255,255,255,.28)}
@E .card-img::after{opacity:.35}
@E .card-badge,@E .card-status{border-radius:6px;font-size:10px;padding:3px 7px;background:rgba(14,14,16,.82);border:0}
@E .card-badge.owned{background:rgba(0,120,242,.9)}
@E .card-wish,@E .card-sublen{border:0;background:rgba(14,14,16,.78)}
@E .grid .card .card-body{padding:10px 2px 0}
@E .grid .card .card-title{font-size:14px;font-weight:600;letter-spacing:0}
@E .grid .card .card-sub{font-size:12px;margin-bottom:8px}
@E .card-price .new{font-size:14px;font-weight:600}
@E .card-cta{height:34px;padding:0 14px;border-radius:8px;background:#fff!important;color:#111!important;box-shadow:none!important;font-weight:700}
@E .card-cta svg{stroke:currentColor}
@E .card-cta.owned{background:var(--ep-blue)!important;color:#fff!important}
@E .card:hover .card-cta{filter:brightness(.93)}

/* list mode: icon rows + big detail pane */
@E .grid.list{gap:2px}
@E .grid.list .card{padding:5px 10px;border-radius:10px;gap:14px;background:transparent}
@E .grid.list .card:hover{background:var(--ep-hover);transform:none}
@E .grid.list .card-img{flex:0 0 40px;width:40px;min-width:40px;aspect-ratio:1/1;border-radius:8px}
@E .grid.list .card:hover .card-img{box-shadow:none}
@E .grid.list .card-body{padding:0}
@E .grid.list .card-sub,@E .grid.list .card-badges,@E .grid.list .card-wish,@E .grid.list .card-sublen,@E .grid.list .card-price{display:none}
@E .grid.list .card-title{font-size:14px;margin:0}
@E .grid.list .card-cta{width:32px;height:32px;padding:0;border-radius:50%;justify-content:center}
@E .grid.list .card-cta span{display:none}
@E .grid.list .card:not(:hover) .card-foot{opacity:0}
@E .game-pane{flex-basis:340px;width:340px;padding:0;background:transparent;border:0;backdrop-filter:none;-webkit-backdrop-filter:none}
@E .game-pane-title{font-size:20px;font-weight:700}
@E .game-pane-media .m{border-radius:14px}

/* misc surfaces */
@E .card-panel,@E .ui-card{background:var(--ep-panel-2);border:1px solid var(--ep-line);border-radius:14px;backdrop-filter:none}
@E .ui-view{background:var(--ep-panel)}
@E .btn,@E .ui-btn{border-radius:8px}
`.replace(/@E/g, E);
}

/* ─────────────────────────────  helpers  ───────────────────────────── */
function closeMenu() {
  if (S.menu) { S.menu.remove(); S.menu = null; }
}
function openMenu(api) {
  closeMenu();
  const m = el('div', 'epic-menu');
  const items = [
    ['menu.settings', 'uiOpenSettings'], ['menu.account', 'showProfile'], ['menu.plugins', 'showPlugins'], ['menu.faq', 'faqOpen'],
    '-', ['menu.logout', 'doLogout'], ['menu.exit', 'uiRequestClose']
  ];
  items.forEach(it => {
    if (it === '-') { m.appendChild(el('hr')); return; }
    const b = el('button'); b.type = 'button'; b.textContent = api.t(it[0]);
    b.addEventListener('click', () => {
      closeMenu();
      api.setTimeout(() => { try { if (typeof window[it[1]] === 'function') window[it[1]](); } catch (e) { api.warn(e); } }, 0);
    });
    m.appendChild(b);
  });
  document.body.appendChild(m);
  S.menu = m;
  requestAnimationFrame(() => m.classList.add('on'));
}

function applyOptions(api) {
  const poster = api.getConfig('poster', true) !== false;
  document.documentElement.classList.toggle('epic-landscape', !poster);
}

/* ─────────────────────────────  plugin  ───────────────────────────── */
const plugin = {
  id: 'epic-launcher-style',
  name: 'Epic Launcher Style',
  version: '1.0.0',
  description: 'Re-skins STARLINE like the new Epic Games Launcher: top tab bar, rounded dark panel, poster grid and a bottom status bar.',
  permissions: ['appearance', 'dom', 'ui', 'storage'],
  minApiVersion: '2.3.0',

  activate(api) {
    if (!api.requireApiVersion('>=2.3.0')) { api.toast('Epic Launcher Style needs STARLINE API 2.3+'); return; }
    S.api = api;
    api.registerMessages(MSG);

    /* 1. colours, font, radii — all restored automatically on disable */
    api.ui.applyTheme({ base: 'dark', colors: COLORS, fx: 'none', deco: 'none' });
    api.ui.setFont(FONT, 14);
    api.ui.setCssVars({ '--radius': '10px', '--radius-lg': '14px', '--radius-xl': '18px' });

    /* 2. layout switch + stylesheet */
    api.ui.registerLayout(LAYOUT, { css: '/* Epic Launcher layout - rules live in the injected stylesheet */' });
    api.ui.setLayout(LAYOUT);
    S.css = api.ui.injectCSS(buildCss());
    applyOptions(api);
    S.undo.push(() => document.documentElement.classList.remove('epic-landscape', 'epic-recent-open'));
    api.onApp('plugin-settings-changed', () => applyOptions(api));

    /* 3. logo dropdown menu (Settings / Account / ... / Sign out / Exit) */
    S.brand = api.getElement('.sb-brand');
    if (S.brand) {
      const onBrand = e => { e.stopPropagation(); S.menu ? closeMenu() : openMenu(api); };
      S.brand.addEventListener('click', onBrand);
      S.undo.push(() => S.brand && S.brand.removeEventListener('click', onBrand));
    }

    /* 4. back / forward arrows with a small page history */
    let hist = [], idx = -1, navigating = false;
    const cur = api.getPage();
    if (cur) { hist = [cur]; idx = 0; }
    const arrows = el('div', 'epic-arrows');
    const mk = (title, icon, d) => {
      const b = el('button', 'epic-arrow', icon); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title);
      b.addEventListener('click', () => go(d));
      return b;
    };
    const bBack = mk(api.t('back'), ICON.back, -1);
    const bFwd = mk(api.t('forward'), ICON.fwd, 1);
    arrows.appendChild(bBack); arrows.appendChild(bFwd);
    const sync = () => { bBack.disabled = idx <= 0; bFwd.disabled = idx >= hist.length - 1; };
    const go = d => {
      const n = idx + d;
      if (n < 0 || n >= hist.length) return;
      const p = hist[n];
      const fn = PAGEFN[p] || ('show' + String(p).charAt(0).toUpperCase() + String(p).slice(1));
      if (typeof window[fn] !== 'function') return;
      navigating = true; idx = n; sync();
      api.setTimeout(() => { navigating = false; }, 500);
      try { window[fn](); } catch (e) { api.warn(e); navigating = false; }
    };
    api.ui.onPage(p => {
      if (!p) return;
      if (navigating) { navigating = false; sync(); return; }
      if (hist[idx] === p) return;
      hist = hist.slice(0, idx + 1); hist.push(p); idx = hist.length - 1; sync();
    });
    sync();
    api.ui.insert('.sb-brand', arrows, { position: 'after' });

    /* 5. bottom bar: "Recent" opens Quickplay + Subscriptions, "Downloads" label */
    api.ui.move('.sb-section[data-ui="downloads"]', '#qpZone', { position: 'append' });
    api.ui.move('#sbDown', '#qpZone', { position: 'append' });

    const recent = el('button', 'epic-recent', ICON.clock + '<span>' + api.t('recent') + '</span>' + ICON.chev);
    recent.type = 'button';
    recent.addEventListener('click', e => { e.stopPropagation(); document.documentElement.classList.toggle('epic-recent-open'); });
    S.recentBtn = recent;
    api.ui.insert('.sb-foot', recent, { position: 'prepend' });
    api.ui.insert('#sbTask', el('div', 'epic-dl', ICON.dl + '<span>' + api.t('downloads') + '</span>'), { position: 'after' });

    /* 6. close popups on outside click / Esc */
    const onDoc = e => {
      if (S.menu && !S.menu.contains(e.target)) closeMenu();
      const zone = document.getElementById('qpZone');
      if (document.documentElement.classList.contains('epic-recent-open') &&
          !(zone && zone.contains(e.target)) && !(S.recentBtn && S.recentBtn.contains(e.target)))
        document.documentElement.classList.remove('epic-recent-open');
    };
    const onKey = e => {
      if (e.key === 'Escape') { closeMenu(); document.documentElement.classList.remove('epic-recent-open'); }
    };
    document.addEventListener('mousedown', onDoc, true);
    document.addEventListener('keydown', onKey, true);
    S.undo.push(() => { document.removeEventListener('mousedown', onDoc, true); document.removeEventListener('keydown', onKey, true); });

    /* 7. drag the window by the empty part of the top bar */
    const sb = api.getElement('.sidebar'), nav = api.getElement('.sb-nav');
    if (sb) {
      const onDrag = e => {
        if (e.button === 0 && (e.target === sb || e.target === nav) && typeof window.uiDrag === 'function') window.uiDrag(e);
      };
      sb.addEventListener('mousedown', onDrag);
      S.undo.push(() => sb.removeEventListener('mousedown', onDrag));
    }
  },

  render(container, api) {
    container.textContent = '';
    const p = document.createElement('p');
    p.textContent = api.t('about');
    container.appendChild(p);
    try {
      api.addSettings({
        title: api.t('settings.title'),
        fields: [{ key: 'poster', type: 'switch', label: api.t('settings.poster'), default: true }]
      });
    } catch (e) { api.warn('settings panel unavailable', e); }
  },

  deactivate(api) {
    closeMenu();
    while (S.undo.length) { try { S.undo.pop()(); } catch (e) {} }
    S.recentBtn = null; S.brand = null; S.css = null;
    /* theme, layout, stylesheet, moved nodes and inserted nodes are reverted by the host */
  }
};
return plugin;
