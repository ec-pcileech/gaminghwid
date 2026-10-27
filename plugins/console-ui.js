/* ───────────────────────────────────────────────────────────────────────────
   Console UI  ·  STARLINE plugin (API 2.3.0)
   A complete replacement of the launcher interface (no sidebar, no top bar of
   the original). Everything on screen is built here from api.data and wired
   to the real app through api.actions / data-sl-action, so buying, licences
   and launching keep working exactly as before.
     • top dock (drag the window by it) with search, world, settings, profile, close
     • auto-rotating cinematic featured carousel
     • "Continue" shelf with your owned games
     • filterable discover wall
   Opening a built-in page (game detail, profile …) pauses this UI and shows a
   "Back" pill; closing the detail returns here. Disable the plugin to get the
   original interface back.
   ─────────────────────────────────────────────────────────────────────────── */
const plugin = {
  id: 'console-ui',
  name: 'Console UI',
  version: '1.0.0',
  description: 'Replaces the whole launcher UI with a console-style layout: top dock, featured carousel, Continue shelf and a filterable discover wall. Disable to restore the original UI.',
  minApiVersion: '2.3.0',
  permissions: ['render', 'data', 'appearance'],

  activate(api) {
    const state = { q: '', genre: 'all', idx: 0 };
    let handle = null;
    let ready = false;
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const css = `
      .ck-dock{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;height:60px;padding:0 22px;
        background:rgba(var(--bg-rgb),.72);backdrop-filter:blur(18px);border-bottom:1px solid var(--border)}
      .ck-logo{font:800 15px var(--font);letter-spacing:3px;margin-right:14px;background:linear-gradient(90deg,var(--accent),var(--accent-3));-webkit-background-clip:text;background-clip:text;color:transparent}
      .ck-search{width:min(380px,34vw);height:36px;padding:0 16px;border:1px solid var(--border-2);border-radius:999px;background:var(--surface);color:var(--text);font:13px var(--font);outline:none}
      .ck-search:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
      .ck-sp{flex:1}
      .ck-ico{width:36px;height:36px;border:1px solid var(--border);border-radius:50%;background:var(--surface);color:var(--text);cursor:pointer;font-size:15px}
      .ck-ico:hover{border-color:var(--accent)}
      .ck-main{padding:22px 28px 60px;max-width:1500px;margin:0 auto}
      .ck-hero{position:relative;height:min(46vh,420px);border-radius:28px;overflow:hidden;background:#000 center/cover;box-shadow:var(--shadow-2);animation:ckIn .5s ease}
      .ck-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.9),transparent 70%)}
      .ck-hero-body{position:absolute;z-index:1;left:40px;bottom:38px;max-width:50%;color:#fff}
      .ck-hero-body h1{margin:8px 0 6px;font-size:40px;letter-spacing:-1px}
      .ck-hero-body p{margin:0 0 18px;opacity:.75}
      .ck-dots{position:absolute;z-index:1;right:28px;bottom:24px;display:flex;gap:7px}
      .ck-dots i{width:8px;height:8px;border-radius:50%;background:#fff5;cursor:pointer}.ck-dots i.on{width:24px;border-radius:6px;background:var(--accent)}
      .ck-sec{display:flex;align-items:baseline;gap:12px;margin:30px 0 12px}.ck-sec h2{margin:0;font-size:18px;letter-spacing:-.3px}.ck-sec span{color:var(--text-3);font-size:12px}
      .ck-row{display:flex;gap:14px;overflow-x:auto;padding-bottom:8px}
      .ck-mini{flex:none;width:220px;display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:16px;background:var(--surface);cursor:pointer}
      .ck-mini:hover{border-color:var(--accent)}.ck-mini img{width:48px;height:48px;border-radius:12px;object-fit:cover}.ck-mini small{display:block;color:var(--text-3)}
      .ck-chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
      .ck-chip{height:30px;padding:0 14px;border:1px solid var(--border);border-radius:999px;background:var(--surface);color:var(--text-2);font:600 12px var(--font);cursor:pointer}
      .ck-chip.on{background:var(--accent);border-color:var(--accent);color:#fff}
      .ck-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px}
      .ck-tile{position:relative;aspect-ratio:3/4;border-radius:18px;overflow:hidden;background:#000;cursor:pointer;transition:transform .2s}
      .ck-tile:hover{transform:translateY(-5px)}.ck-tile img{width:100%;height:100%;object-fit:cover}
      .ck-tile::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.88))}
      .ck-tile-info{position:absolute;z-index:1;left:12px;right:12px;bottom:11px;color:#fff;font-size:12.5px}.ck-tile-info b{display:block;font-size:14px}
      .ck-heart{position:absolute;z-index:2;top:9px;right:9px;width:30px;height:30px;border:0;border-radius:50%;background:#0008;color:#fff;cursor:pointer}
      @keyframes ckIn{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}`;

    const T = (k) => api.data.t(k);
    const mainBtn = (g) => `<button class="btn btn-primary" data-sl-action="${g.owned ? 'launch' : 'buy'}:${g.id}">${esc(T(g.owned ? 'launch' : 'buyNow'))}</button>`;

    const paintHero = (root) => {
      const feat = api.data.featured();
      const el = root.querySelector('.ck-hero');
      if (!feat.length) { el.style.display = 'none'; return; }
      el.style.display = '';
      const g = feat[state.idx % feat.length];
      el.style.backgroundImage = `url("${g.poster}")`;
      el.innerHTML = `
        <div class="ck-hero-body">
          <div style="font:700 11px var(--font-mono);letter-spacing:2px;color:var(--accent-2)">FEATURED</div>
          <h1>${esc(g.title)}</h1><p>${esc(g.developer)} · ${esc(g.genres.join(' · '))}</p>
          ${mainBtn(g)}
          <button class="btn btn-secondary" data-sl-action="wish:${g.id}">${esc(T(g.wished ? 'wishlisted' : 'wishlist'))}</button>
        </div>
        <div class="ck-dots">${feat.map((_, i) => `<i data-idx="${i}" class="${i === state.idx % feat.length ? 'on' : ''}"></i>`).join('')}</div>`;
    };

    const paintShelf = (root) => {
      const owned = api.data.games().filter((g) => g.owned);
      root.querySelector('.ck-shelf').style.display = owned.length ? '' : 'none';
      root.querySelector('.ck-row').innerHTML = owned.map((g) => `
        <div class="ck-mini" data-sl-action="launch:${g.id}">
          <img src="${esc(g.image)}" alt=""><div><b>${esc(g.title)}</b><small>${esc(g.license ? g.license.text : '')}</small></div>
        </div>`).join('');
    };

    const paintChips = (root) => {
      const all = ['all'].concat(api.data.genres());
      root.querySelector('.ck-chips').innerHTML = all.map((g) =>
        `<button class="ck-chip ${state.genre === g ? 'on' : ''}" data-genre="${esc(g)}">${esc(g === 'all' ? T('fAll') : g)}</button>`).join('');
    };

    const paintWall = (root) => {
      const q = state.q.trim().toLowerCase();
      const list = api.data.games().filter((g) =>
        (state.genre === 'all' || g.genres.includes(state.genre)) &&
        (!q || g.title.toLowerCase().includes(q) || g.developer.toLowerCase().includes(q)));
      root.querySelector('.ck-wall').innerHTML = list.map((g) => `
        <div class="ck-tile" data-sl-action="open:${g.id}">
          <img src="${esc(g.poster)}" alt="">
          <button class="ck-heart" data-sl-action="wish:${g.id}">${g.wished ? '♥' : '♡'}</button>
          <div class="ck-tile-info"><b>${esc(g.title)}</b>${g.owned ? esc(T('ownNow')) : esc(g.price.text)}</div>
        </div>`).join('');
    };

    // One-time skeleton (so the search box keeps focus while the content repaints).
    const init = (root) => {
      root.innerHTML = `
        <div class="ck-dock" data-sl-drag>
          <div class="ck-logo">STARLINE</div>
          <input class="ck-search" placeholder="${esc(T('searchGames'))}" autocomplete="off" spellcheck="false">
          <div class="ck-sp"></div>
          <button class="ck-ico" data-sl-action="nav:world" title="World">🌐</button>
          <button class="ck-ico" data-sl-action="nav:settings" title="Settings">⚙</button>
          <button class="ck-ico" data-sl-action="nav:profile" title="Profile">${esc((api.data.state().user.name || 'S').charAt(0).toUpperCase())}</button>
          <button class="ck-ico" data-sl-action="nav:close" title="Close">✕</button>
        </div>
        <div class="ck-main">
          <section class="ck-hero"></section>
          <section class="ck-shelf"><div class="ck-sec"><h2>${esc(T('launch'))}</h2></div><div class="ck-row"></div></section>
          <div class="ck-sec"><h2>${esc(T('allGames'))}</h2></div>
          <div class="ck-chips"></div><div class="ck-wall"></div>
        </div>`;
      root.querySelector('.ck-search').addEventListener('input', (e) => { state.q = e.target.value; paintWall(root); });
      root.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-genre]');
        if (chip) { state.genre = chip.getAttribute('data-genre'); paintChips(root); paintWall(root); return; }
        const dot = e.target.closest('[data-idx]');
        if (dot) { state.idx = Number(dot.getAttribute('data-idx')) || 0; paintHero(root); }
      });
      // Carousel auto-advance (api.setInterval is cleaned up automatically).
      api.setInterval(() => {
        if (handle && !handle.isPaused() && !document.hidden) { state.idx += 1; paintHero(root); }
      }, 7000);
    };

    api.ui.takeover({
      css,
      render(root, _api, h) {
        handle = h;
        if (!ready) { init(root); ready = true; }
        paintHero(root); paintShelf(root); paintChips(root); paintWall(root);
      }
    });
  }
};
