/* Windows 11 Controls — 把界面里的控件改成 Windows 11 (Fluent) 风格：
   Toggle 开关 / CheckBox / Slider / ComboBox（自绘下拉弹层，替换原生 <select>）
   放进 程序目录\plugins\ → 我的插件 → 重新加载插件 → 启用。需要 API 2.2.0+。
   强调色：深色主题 #60cdff，浅色主题 #0067c0（Windows 11 默认）。
   想换强调色：在插件里调用 api.setConfig('accent', '#ff4081') 或改下面的 ACCENT_OVERRIDE。 */
const plugin = {
  id: 'windows11-controls',
  name: 'Windows 11 Controls',
  version: '1.0.0',
  description: 'Fluent / Windows 11 style toggle, checkbox, slider and combo box with a popup list.',
  minApiVersion: '2.2.0',
  permissions: ['appearance', 'dom', 'storage'],

  activate(api) {
    const ACCENT_OVERRIDE = '';                       // 例如 '#0078d4'；留空 = 跟随 Windows 11 默认
    const accent = api.getConfig('accent', '') || ACCENT_OVERRIDE;
    if (accent && /^#[0-9a-f]{6}$/i.test(accent)) api.ui.setCssVars({ '--w11-accent': accent });

    const CHECK_DARK = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.4 6.6 11.5 12.5 4.8' fill='none' stroke='%23000' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")";
    const CHECK_LIGHT = CHECK_DARK.replace('%23000', '%23fff');

    api.ui.injectCSS(`
/* ───────── 变量 ───────── */
html{--w11-accent:#60cdff;--w11-on-accent:#000;--w11-fill:rgba(255,255,255,.0605);--w11-fill-hover:rgba(255,255,255,.0837);--w11-fill-press:rgba(255,255,255,.0326);
  --w11-stroke:rgba(255,255,255,.0698);--w11-strong:rgba(255,255,255,.5442);--w11-track:rgba(255,255,255,.5442);--w11-knob:rgba(255,255,255,.7860);
  --w11-text:#fff;--w11-text-2:rgba(255,255,255,.7864);--w11-pop:#2c2c2c;--w11-pop-stroke:rgba(0,0,0,.4);--w11-thumb:#454545;--w11-check:${CHECK_DARK}}
html[data-theme="light"]{--w11-accent:#0067c0;--w11-on-accent:#fff;--w11-fill:rgba(255,255,255,.7);--w11-fill-hover:rgba(249,249,249,.5);--w11-fill-press:rgba(249,249,249,.3);
  --w11-stroke:rgba(0,0,0,.0578);--w11-strong:rgba(0,0,0,.4458);--w11-track:rgba(0,0,0,.4458);--w11-knob:#5f5f5f;
  --w11-text:#1a1a1a;--w11-text-2:rgba(0,0,0,.6063);--w11-pop:#fcfcfc;--w11-pop-stroke:rgba(0,0,0,.1);--w11-thumb:#fff;--w11-check:${CHECK_LIGHT}}

/* ───────── Toggle Switch（.bg-switch） ───────── */
.bg-switch{width:40px!important;height:20px!important}
.bg-switch span{border-radius:10px!important;background:transparent!important;border:1px solid var(--w11-strong)!important;
  transition:background .15s,border-color .15s!important}
.bg-switch:hover span{background:var(--w11-fill-hover)!important}
.bg-switch span::after{left:4px!important;top:4px!important;width:12px!important;height:12px!important;border-radius:6px!important;background:var(--w11-knob)!important;
  transition:left .17s cubic-bezier(.1,.9,.2,1),top .12s,width .12s,height .12s,transform .17s cubic-bezier(.1,.9,.2,1),background .15s!important}
.bg-switch:hover span::after{left:3px!important;top:3px!important;width:14px!important;height:14px!important}
.bg-switch:active span::after{width:17px!important;height:14px!important}
.bg-switch input:checked + span{background:var(--w11-accent)!important;border-color:var(--w11-accent)!important}
.bg-switch:hover input:checked + span{background:var(--w11-accent)!important;filter:brightness(.92)}
.bg-switch input:checked + span::after{transform:translateX(20px)!important;background:var(--w11-on-accent)!important}
.bg-switch:hover input:checked + span::after{transform:translateX(19px)!important}
.bg-switch:active input:checked + span::after{transform:translateX(16px)!important}
.bg-switch input:focus-visible + span{outline:2px solid var(--w11-text);outline-offset:2px}

/* ───────── CheckBox ───────── */
input[type="checkbox"]:not(.bg-switch input):not(.cc-check input){-webkit-appearance:none;appearance:none;flex:0 0 auto;margin:0;width:20px;height:20px;border-radius:4px;
  border:1px solid var(--w11-strong);background:var(--w11-fill) center/16px 16px no-repeat;cursor:pointer;vertical-align:middle;
  transition:background-color .1s,border-color .1s}
input[type="checkbox"]:not(.bg-switch input):not(.cc-check input):hover{background-color:var(--w11-fill-hover)}
input[type="checkbox"]:not(.bg-switch input):not(.cc-check input):active{background-color:var(--w11-fill-press)}
input[type="checkbox"]:not(.bg-switch input):not(.cc-check input):checked{background-color:var(--w11-accent);background-image:var(--w11-check);border-color:var(--w11-accent)}
input[type="checkbox"]:not(.bg-switch input):not(.cc-check input):checked:hover{filter:brightness(.92)}
input[type="checkbox"]:not(.bg-switch input):not(.cc-check input):focus-visible{outline:2px solid var(--w11-text);outline-offset:2px}
.cc-box{width:20px!important;height:20px!important;border-radius:4px!important;border:1px solid var(--w11-strong)!important;background:var(--w11-fill)!important}
.cc-check:hover .cc-box{background:var(--w11-fill-hover)!important;border-color:var(--w11-strong)!important}
.cc-check input:checked + .cc-box{background:var(--w11-accent)!important;border-color:var(--w11-accent)!important}
.cc-box svg{stroke:var(--w11-on-accent)!important;stroke-width:2.6!important}
.cc-check input:focus-visible + .cc-box{box-shadow:0 0 0 2px var(--w11-text)!important}

/* ───────── Slider ───────── */
input[type="range"]:not(.cp-sl input){-webkit-appearance:none;appearance:none;height:4px!important;border-radius:2px!important;outline:none;cursor:pointer;
  background:linear-gradient(90deg,var(--w11-accent) var(--w11-p,50%),var(--w11-track) var(--w11-p,50%))!important}
input[type="range"]:not(.cp-sl input)::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px!important;height:20px!important;border-radius:50%!important;cursor:pointer;
  border:1px solid var(--w11-stroke)!important;transform:none!important;box-shadow:0 1px 3px rgba(0,0,0,.25)!important;
  background:radial-gradient(circle,var(--w11-accent) 0 5px,var(--w11-thumb) 5.5px)!important;transition:none}
input[type="range"]:not(.cp-sl input):hover::-webkit-slider-thumb{background:radial-gradient(circle,var(--w11-accent) 0 7px,var(--w11-thumb) 7.5px)!important}
input[type="range"]:not(.cp-sl input):active::-webkit-slider-thumb{background:radial-gradient(circle,var(--w11-accent) 0 4px,var(--w11-thumb) 4.5px)!important}
input[type="range"]:not(.cp-sl input):focus-visible::-webkit-slider-thumb{outline:2px solid var(--w11-text);outline-offset:2px}

/* ───────── ComboBox（自绘，替换原生 select） ───────── */
select[data-w11]{display:none!important}
.ui-select-wrap .ui-select-chev{display:none!important}
.w11-combo{display:inline-flex;vertical-align:middle;min-width:140px}
.w11-combo-btn{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:32px;padding:5px 12px;border-radius:4px;cursor:pointer;
  border:1px solid var(--w11-stroke);border-bottom-color:var(--w11-strong);background:var(--w11-fill);color:var(--w11-text);font:400 14px/20px var(--font,'Segoe UI',sans-serif);text-align:left;
  transition:background .1s}
.w11-combo-btn:hover{background:var(--w11-fill-hover)}
.w11-combo-btn:active{background:var(--w11-fill-press);color:var(--w11-text-2)}
.w11-combo-btn:focus-visible,.w11-combo-btn[aria-expanded="true"]{border-bottom:2px solid var(--w11-accent);padding-bottom:4px;outline:none}
.w11-combo-btn[disabled]{opacity:.4;cursor:default}
.w11-combo-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.w11-combo-btn svg{width:12px;height:12px;flex:0 0 auto;fill:none;stroke:var(--w11-text-2);stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;transition:transform .15s}
.w11-combo-btn[aria-expanded="true"] svg{transform:translateY(1px) rotate(180deg)}
.w11-pop{position:fixed;z-index:2147483200;box-sizing:border-box;max-height:320px;overflow:auto;padding:4px;border-radius:8px;
  background:var(--w11-pop);border:1px solid var(--w11-pop-stroke);box-shadow:0 8px 16px rgba(0,0,0,.26),0 0 2px rgba(0,0,0,.2);
  transform-origin:top center;animation:w11PopIn .14s cubic-bezier(.1,.9,.2,1)}
.w11-pop[hidden]{display:none}
.w11-pop.up{transform-origin:bottom center}
@keyframes w11PopIn{from{opacity:0;transform:scaleY(.92) translateY(-4px)}to{opacity:1;transform:none}}
.w11-item{position:relative;display:block;width:100%;box-sizing:border-box;padding:6px 12px 6px 14px;margin:0 0 2px;border:0;border-radius:4px;background:transparent;
  color:var(--w11-text);font:400 14px/20px var(--font,'Segoe UI',sans-serif);text-align:left;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.w11-item:last-child{margin-bottom:0}
.w11-item:hover,.w11-item.hot{background:var(--w11-fill-hover)}
.w11-item:active{background:var(--w11-fill-press)}
.w11-item.sel{background:var(--w11-fill)}
.w11-item.sel::before{content:"";position:absolute;left:4px;top:50%;width:3px;height:16px;margin-top:-8px;border-radius:2px;background:var(--w11-accent)}
`, { tag: 'w11' });

    const cleanups = [];
    const on = (t, e, f, o) => { t.addEventListener(e, f, o); cleanups.push(() => t.removeEventListener(e, f, o)); };

    /* ── Slider：填充进度由 --w11-p 驱动（程序改 value 时也会同步） ── */
    const ranges = new Set();
    const paint = (r) => {
      const min = +r.min || 0, max = r.max === '' ? 100 : +r.max, v = +r.value;
      r.style.setProperty('--w11-p', (max > min ? Math.max(0, Math.min(100, (v - min) / (max - min) * 100)) : 0) + '%');
    };
    api.ui.onElement('input[type="range"]', (r) => {
      if (r.closest('.cp-sl')) return;
      ranges.add(r); paint(r); on(r, 'input', () => paint(r));
    });
    api.setInterval(() => { ranges.forEach(r => { if (r.isConnected) paint(r); else ranges.delete(r); }); }, 250);

    /* ── ComboBox + 弹层 ── */
    const combos = new Set();
    let openCombo = null;
    function enhance(sel) {
      if (sel.hasAttribute('data-w11') || sel.multiple || sel.size > 1) return;
      sel.setAttribute('data-w11', '1');
      const wrap = document.createElement('div'); wrap.className = 'w11-combo';
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'w11-combo-btn';
      btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span class="w11-combo-txt"></span><svg viewBox="0 0 12 12"><path d="M2.2 4.4 6 8.2l3.8-3.8"/></svg>';
      wrap.appendChild(btn);
      const pop = document.createElement('div'); pop.className = 'w11-pop'; pop.hidden = true; pop.setAttribute('role', 'listbox');
      api.ui.insert(sel, wrap, { position: 'after' });
      api.ui.insert(document.body, pop, { position: 'append' });
      let items = [], hot = -1;

      const c = {
        sel, btn, pop,
        sync() {
          const o = sel.options[sel.selectedIndex];
          btn.firstChild.textContent = o ? o.text : '';
          btn.disabled = !!sel.disabled;
        },
        close() {
          if (pop.hidden) return;
          pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (openCombo === c) openCombo = null;
        },
        choose(i) {
          if (i < 0 || i >= sel.options.length || sel.options[i].disabled) return;
          const changed = sel.selectedIndex !== i;
          sel.selectedIndex = i;
          if (changed) { sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
          c.sync(); c.close(); btn.focus();
        },
        setHot(i) {
          hot = i; items.forEach((el, k) => el.classList.toggle('hot', k === i));
          if (items[i] && items[i].scrollIntoView) items[i].scrollIntoView({ block: 'nearest' });
        },
        open() {
          if (btn.disabled) return;
          if (openCombo && openCombo !== c) openCombo.close();
          pop.textContent = ''; items = [];
          Array.prototype.forEach.call(sel.options, (o, i) => {
            const it = document.createElement('button'); it.type = 'button'; it.className = 'w11-item' + (i === sel.selectedIndex ? ' sel' : '');
            it.setAttribute('role', 'option'); it.textContent = o.text; it.disabled = o.disabled;
            it.addEventListener('click', () => c.choose(i));
            pop.appendChild(it); items.push(it);
          });
          const r = btn.getBoundingClientRect();
          pop.style.minWidth = Math.max(r.width, 140) + 'px'; pop.style.left = Math.round(r.left) + 'px';
          pop.hidden = false; pop.classList.remove('up');
          const h = pop.offsetHeight, below = innerHeight - r.bottom - 8, above = r.top - 8;
          if (h > below && above > below) { pop.classList.add('up'); pop.style.maxHeight = Math.min(320, above) + 'px'; pop.style.top = Math.round(Math.max(8, r.top - Math.min(h, above) - 4)) + 'px'; }
          else { pop.style.maxHeight = Math.min(320, below) + 'px'; pop.style.top = Math.round(r.bottom + 4) + 'px'; }
          pop.style.left = Math.round(Math.min(r.left, innerWidth - pop.offsetWidth - 8)) + 'px';
          btn.setAttribute('aria-expanded', 'true'); openCombo = c; c.setHot(sel.selectedIndex);
        }
      };
      btn.addEventListener('click', () => (pop.hidden ? c.open() : c.close()));
      btn.addEventListener('keydown', (e) => {
        const n = sel.options.length;
        if (pop.hidden) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.open(); }
          else if (e.key === 'ArrowDown' && sel.selectedIndex < n - 1) { e.preventDefault(); c.choose(sel.selectedIndex + 1); }
          else if (e.key === 'ArrowUp' && sel.selectedIndex > 0) { e.preventDefault(); c.choose(sel.selectedIndex - 1); }
          return;
        }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); c.close(); }
        else if (e.key === 'Tab') c.close();
        else if (e.key === 'ArrowDown') { e.preventDefault(); c.setHot(Math.min(n - 1, hot + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); c.setHot(Math.max(0, hot - 1)); }
        else if (e.key === 'Home') { e.preventDefault(); c.setHot(0); }
        else if (e.key === 'End') { e.preventDefault(); c.setHot(n - 1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.choose(hot); }
      });
      on(sel, 'change', c.sync);
      c.sync(); combos.add(c);
    }
    api.ui.onElement('select', enhance);
    on(document, 'pointerdown', (e) => { if (openCombo && !openCombo.pop.contains(e.target) && !openCombo.btn.contains(e.target)) openCombo.close(); }, true);
    on(window, 'resize', () => openCombo && openCombo.close());
    on(window, 'scroll', (e) => { if (openCombo && !openCombo.pop.contains(e.target)) openCombo.close(); }, true);
    api.setInterval(() => combos.forEach(c => { if (c.sel.isConnected) c.sync(); else combos.delete(c); }), 300);

    this._undo = () => {
      cleanups.splice(0).forEach(f => { try { f(); } catch (e) {} });
      ranges.forEach(r => r.style.removeProperty('--w11-p'));
      combos.forEach(c => c.sel.removeAttribute('data-w11'));
    };
  },
  deactivate() { if (this._undo) this._undo(); }
  // api.ui 插入的 combo / 弹层 / 样式、CSS 变量会在停用时自动还原
};
return plugin;

