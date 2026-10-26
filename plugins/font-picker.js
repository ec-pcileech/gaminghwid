/* Font Picker — 字体选择卡片：出现在「个人资料」页，以及本插件自己的面板里（我的插件 → Font Picker），不写进插件列表页，可选本机已安装的字体（改整个界面的字体）
   放进 程序目录\plugins\ → 我的插件 → 重新加载插件 → 启用。需要 API 2.2.0+ 和新版 Main.cpp。
   「Refresh fonts」：让宿主用系统接口重新读取本机字体（不弹权限）；老宿主 / 失败时回退到 queryLocalFonts，再回退到内置清单检测。
   选择会保存到 plugins\plugins.json，下次启动自动应用；停用插件即恢复原字体。 */
const plugin = {
  id: 'font-picker',
  name: 'Font Picker',
  version: '1.0.0',
  description: 'Choose any installed font for the whole interface — from the Profile page or from this plugin\'s own panel.',
  minApiVersion: '2.2.0',
  permissions: ['appearance', 'dom', 'storage'],

  activate(api) {
    const EN = {
      title: 'Font', sub: 'Pick an installed font for the whole interface', search: 'Search fonts…',
      custom: 'Use typed name', scan: 'Refresh fonts', reset: 'Default font',
      count: '{n} fonts', none: 'No matching font', current: 'Current: {f}', def: 'default',
      denied: 'Could not read local fonts — showing common fonts', scanned: 'Found {n} installed fonts', src: 'source: {s}'
    };
    const T = (k, p) => String(EN[k] || k).replace(/\{(\w+)\}/g, (_, x) => (p && p[x] !== undefined ? p[x] : ''));

    /* ── 应用 / 还原字体 ── */
    const originalStack = api.ui.getCssVar('--font') || "system-ui,'Segoe UI',sans-serif";
    let varHandle = null, cssHandle = null, current = api.getConfig('font', '') || '';
    function clearFont() {
      if (varHandle) { varHandle.remove(); varHandle = null; }
      if (cssHandle) { cssHandle.remove(); cssHandle = null; }
    }
    function applyFont(name) {
      clearFont();
      current = String(name || '').replace(/["'\\;{}<>]/g, '').trim().slice(0, 80);
      api.setConfig('font', current);
      if (!current) return;
      varHandle = api.ui.setCssVars({ '--font': '"' + current + '", ' + originalStack });
      cssHandle = api.ui.injectCSS('html,body,button,input,select,textarea{font-family:var(--font)}', { tag: 'font' });
    }
    const views = new Set();
    const renderAll = () => views.forEach(v => (v.card.isConnected ? v.render() : views.delete(v)));
    if (current) applyFont(current);

    /* ── 字体清单 ── */
    const COMMON = ['Segoe UI', 'Segoe UI Variable', 'Microsoft YaHei', 'Microsoft YaHei UI', 'Microsoft JhengHei', 'SimSun', 'NSimSun', 'SimHei', 'KaiTi', 'FangSong', 'DengXian', 'Yu Gothic', 'Yu Mincho', 'Meiryo', 'MS Gothic', 'Malgun Gothic', 'Nirmala UI', 'Leelawadee UI', 'Arial', 'Arial Black', 'Arial Narrow', 'Bahnschrift', 'Calibri', 'Cambria', 'Candara', 'Century Gothic', 'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Ebrima', 'Franklin Gothic Medium', 'Gabriola', 'Gadugi', 'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe Print', 'Segoe Script', 'Sitka Text', 'Sylfaen', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', 'Fira Code', 'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Noto Sans', 'Noto Sans SC', 'Noto Serif', 'Source Sans Pro', 'Source Han Sans SC', 'Ubuntu', 'Helvetica', 'Helvetica Neue', 'SF Pro Display', 'Rajdhani', 'Orbitron', 'Oswald', 'Raleway', 'Nunito', 'Rubik', 'PT Sans', 'Bebas Neue', 'Playfair Display', 'Merriweather', '微软雅黑', '宋体', '黑体', '楷体', '仿宋', '等线', '华文细黑', '华文楷体', '华文宋体', '方正舒体'];
    function detectInstalled(list) {
      let ctx = null;
      try { ctx = document.createElement('canvas').getContext('2d'); } catch (e) {}
      if (!ctx) return list.slice();
      const bases = ['monospace', 'serif', 'sans-serif'], txt = 'mmmmmmmmmmlliWWiiOo0一二三あ', w0 = {};
      bases.forEach(b => { ctx.font = '72px ' + b; w0[b] = ctx.measureText(txt).width; });
      return list.filter(f => bases.some(b => { ctx.font = '72px "' + f + '",' + b; return ctx.measureText(txt).width !== w0[b]; }));
    }
    let fonts = detectInstalled(COMMON).sort((a, b) => a.localeCompare(b)), source = 'common list';
    /* 读取本机字体：宿主 GDI 枚举 → queryLocalFonts → 内置清单检测 */
    let refreshing = false;
    async function refreshFonts(manual) {
      if (refreshing) return;
      refreshing = true;
      let list = null, src = '';
      try { if (typeof api.listFonts === 'function') { list = await api.listFonts(); src = 'system'; } } catch (e) {}
      if ((!list || !list.length) && typeof window.queryLocalFonts === 'function' && manual) {
        try { list = Array.from(new Set((await window.queryLocalFonts()).map(f => f.family))); src = 'browser'; } catch (e) {}
      }
      refreshing = false;
      if (list && list.length) {
        fonts = Array.from(new Set(list)).sort((a, b) => a.localeCompare(b)); source = src;
        if (manual) api.toast(T('scanned', { n: fonts.length }));
      } else {
        fonts = detectInstalled(COMMON).sort((a, b) => a.localeCompare(b)); source = 'common list';
        if (manual) api.toast(T('denied'));
      }
      renderAll();
    }

    /* ── 卡片界面（沿用 card-panel 样式）；个人资料页和插件页各放一张，状态共用 ── */
    function makeCard(where) {
      const card = document.createElement('div');
      card.className = 'card-panel';
      card.setAttribute('data-font-picker', where);
      card.innerHTML =
        '<div class="panel-head"><div class="panel-ico"><svg viewBox="0 0 24 24"><path d="M4 20 10 4h2l6 16M6.5 14h7M16 20h4M18 20V9"/></svg></div>' +
        '<div><div class="panel-title" data-r="title"></div><div class="panel-sub" data-r="sub"></div></div></div>' +
        '<div class="field">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
        '<input class="ui-input" data-r="search" style="flex:1;min-width:160px" type="text" spellcheck="false">' +
        '<button type="button" class="btn btn-secondary" data-act="custom"></button></div>' +
        '<div data-r="list" style="max-height:240px;overflow:auto;border:1px solid var(--border);border-radius:12px;padding:4px"></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px">' +
        '<button type="button" class="btn btn-secondary" data-act="scan"></button>' +
        '<button type="button" class="btn btn-secondary" data-act="reset"></button>' +
        '<span data-r="status" style="margin-left:auto;font-size:12px;color:var(--text-3)"></span></div></div>';

      const $ = s => card.querySelector(s);
      const search = $('[data-r=search]'), list = $('[data-r=list]'), status = $('[data-r=status]');

      function label() {
        $('[data-r=title]').textContent = T('title');
        $('[data-r=sub]').textContent = T('sub');
        search.placeholder = T('search');
        $('[data-act=custom]').textContent = T('custom');
        $('[data-act=scan]').textContent = T('scan');
        $('[data-act=reset]').textContent = T('reset');
      }
      function render() {
        const q = search.value.trim().toLowerCase();
        const shown = fonts.filter(f => !q || f.toLowerCase().indexOf(q) >= 0).slice(0, 250);
        list.textContent = '';
        shown.forEach(f => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = f;
          b.style.cssText = 'display:block;width:100%;text-align:left;padding:8px 12px;border:0;border-radius:8px;background:' + (f === current ? 'var(--accent-soft)' : 'transparent') + ';color:var(--text);cursor:pointer;font-size:15px;font-family:"' + f.replace(/"/g, '') + '",sans-serif';
          b.addEventListener('mouseenter', () => { if (f !== current) b.style.background = 'var(--surface-2)'; });
          b.addEventListener('mouseleave', () => { b.style.background = f === current ? 'var(--accent-soft)' : 'transparent'; });
          b.addEventListener('click', () => { applyFont(f); renderAll(); });
          list.appendChild(b);
        });
        if (!shown.length) { const n = document.createElement('div'); n.style.cssText = 'padding:12px;color:var(--text-3)'; n.textContent = T('none'); list.appendChild(n); }
        status.textContent = T('count', { n: fonts.length }) + ' · ' + T('src', { s: source }) + ' · ' + T('current', { f: current || T('def') });
      }

      search.addEventListener('input', render);
      $('[data-act=custom]').addEventListener('click', () => { const v = search.value.trim(); if (v) { applyFont(v); renderAll(); } });
      $('[data-act=reset]').addEventListener('click', () => { applyFont(''); renderAll(); });
      $('[data-act=scan]').addEventListener('click', () => refreshFonts(true));

      label(); render();
      views.add({ card, render });
      return card;
    }
    /* 个人资料页：插在最后一个面板后面 */
    function build(page) {
      if (page.querySelector('[data-font-picker]')) return;
      const panels = page.querySelectorAll('.card-panel'), target = panels[panels.length - 1];
      if (!target) return;
      api.ui.insert(target, makeCard('profile'), { position: 'after' });
    }
    /* 「我的插件」里这个插件自己的面板（plugin.render 调用它）——字体选择 UI 画在这里，不写进插件列表页 */
    this._renderPanel = (container) => { container.textContent = ''; container.appendChild(makeCard('panel')); };

    /* 个人资料页是常驻的，onElement 兜底：页面被重新渲染时卡片会自动补回来 */
    api.ui.onElement('#profilePage', build);
    refreshFonts(false);   // 启动时静默读取一次本机字体
  },

  // 插件详情页（点「我的插件」里的这个插件）显示的面板
  render(container) { if (this._renderPanel) this._renderPanel(container); },
  // 不需要 deactivate：api.ui 的改动（CSS 变量、样式、插入的卡片）在停用时自动还原
};
return plugin;
