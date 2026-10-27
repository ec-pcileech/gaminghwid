/* ───────────────────────────────────────────────────────────────────────────
   Poster Wall  ·  STARLINE plugin (API 2.3.0)
   Restyles the store in place (the normal app shell stays):
     • grid mode  → tall poster cards with overlay title / price / buttons
     • list mode  → compact rows with thumbnail, genres and action button
     • banner     → cinematic left-aligned layout
     • top bar    → search box centred
   Everything is undone automatically when the plugin is disabled.
   ─────────────────────────────────────────────────────────────────────────── */
const plugin = {
  id: 'poster-wall',
  name: 'Poster Wall',
  version: '1.0.0',
  description: 'Poster-style game cards, compact list rows, a cinematic banner and a centred search box. Pure restyle: no data leaves the app.',
  minApiVersion: '2.3.0',
  permissions: ['appearance', 'dom', 'layout', 'render', 'data'],

  activate(api) {
    const ui = api.ui;

    // 1) Global tokens.
    ui.setCssVars({ '--radius': '16px', '--radius-lg': '22px' });

    // 2) Layout: auto-fill poster columns (grid mode only) and a centred search box.
    ui.layout.grid('#grid:not(.list)', { columns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 18 });
    ui.layout.free('@search', { container: '@topbar', center: 'both', w: 'min(520px,40vw)' });

    // 3) Card shells. The template below fills them.
    ui.rule('#grid:not(.list) .card', { padding: 0, overflow: 'hidden', borderRadius: 20, aspectRatio: '3 / 4', position: 'relative', background: '#000' });
    ui.rule('#grid:not(.list) .card:hover', { transform: 'translateY(-6px) scale(1.02)' });
    ui.rule('#grid.list .card', { borderRadius: 14 });

    const priceText = (g) => g.owned
      ? (g.license ? g.license.text : '')
      : (g.price.discount ? `<s style="opacity:.55">${g.price.oldText}</s> ` : '') + g.price.text;

    const poster = (g, ctx) => `
      <img src="${ctx.esc(g.poster)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 42%,rgba(0,0,0,.9))"></div>
      <button ${ctx.act('wish')} title="Wishlist" style="position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:rgba(0,0,0,.45);color:${g.wished ? '#ff6b81' : '#fff'};cursor:pointer;backdrop-filter:blur(8px)">${g.wished ? '♥' : '♡'}</button>
      <div style="position:absolute;left:14px;right:14px;bottom:14px;color:#fff">
        <div style="font-weight:800;font-size:15px;letter-spacing:-.2px">${ctx.esc(g.title)}</div>
        <div style="opacity:.7;font-size:11.5px;margin:2px 0 10px">${ctx.esc(g.developer)}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span style="font-size:12.5px;font-weight:700">${priceText(g)}</span>
          <button class="btn btn-primary" ${ctx.act(g.owned ? 'launch' : 'buy')} style="height:30px;padding:0 14px">${ctx.esc(ctx.t(g.owned ? 'launch' : 'buy'))}</button>
        </div>
      </div>`;

    const row = (g, ctx) => `
      <div style="display:flex;align-items:center;gap:14px;padding:8px 12px;width:100%">
        <img src="${ctx.esc(g.image)}" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover;flex:none">
        <div style="flex:1;min-width:0">
          <b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ctx.esc(g.title)}</b>
          <span style="opacity:.6;font-size:12px">${ctx.esc(g.developer)} · ${ctx.esc(g.genres.join(', '))}</span>
        </div>
        <span style="font-size:12.5px;font-weight:700">${priceText(g)}</span>
        <button class="btn btn-primary" ${ctx.act(g.owned ? 'launch' : 'buy')} style="height:30px;padding:0 14px">${ctx.esc(ctx.t(g.owned ? 'launch' : 'buy'))}</button>
      </div>`;

    ui.card.render((g, ctx) => (ctx.view === 'list' ? row(g, ctx) : poster(g, ctx)), { layout: 'both' });

    // 4) Banner. The app's own background image is kept; we replace the text block.
    ui.banner.render((g, ctx) => `
      <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.88),transparent 65%)"></div>
      <div style="position:absolute;left:36px;bottom:34px;max-width:46%;color:#fff">
        <div style="font:700 11px var(--font-mono);letter-spacing:2px;color:var(--accent-2)">FEATURED</div>
        <h1 style="margin:6px 0 4px;font-size:34px;letter-spacing:-.8px">${ctx.esc(g.title)}</h1>
        <p style="margin:0 0 16px;opacity:.75">${ctx.esc(g.developer)} · ${ctx.esc(g.genres.join(' · '))}</p>
        <button class="btn btn-primary" ${ctx.act(g.owned ? 'launch' : 'buy')}>${ctx.esc(ctx.t(g.owned ? 'launch' : 'buyNow'))}</button>
      </div>`);
  }
};
