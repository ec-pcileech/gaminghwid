// plugins/sidebar-collapse.js
const plugin = {
  id: 'sidebar-collapse',
  name: 'Sidebar Collapse',
  version: '1.5.0',
  description: 'Collapse / expand the left navigation sidebar via a handle on its right edge (25% from the top). While collapsed, the plugin tree is replaced by a hover popup with an arrow. Ctrl+B shortcut, remembers state.',
  // Both permissions are optional: without them only persistence / the command palette entry are skipped.
  permissions: ['storage', 'ui'],

  activate(api) {
    // ===== Tunables =====
    const SEL = {
      sidebar: '.sidebar',
      items: '.sb-item, .sb-brand',   // These elements are never hidden as a whole
    };
    const W_COLLAPSED = 68;        // Collapsed sidebar width (px)
    const W_FALLBACK = 68;         // Used for positioning if the sidebar rect is unusable
    const BTN_SIZE = 24;           // Handle diameter (px)
    const BTN_TOP_RATIO = 0.25;    // Handle vertical position as a fraction of sidebar height

    // STARLINE plugin tree: <div class="sb-sub" id="sbPluginGroup"> ... <button class="sb-sub-item"> ...
    const TREE_SELECTORS = ['#sbPluginGroup'];
    // Clickable entries shown inside the popup (empty string = auto-detect clickable leaves)
    const ENTRY_SELECTOR = '.sb-sub-item';
    // Optional class / id fallback pattern for trees not listed above (kept strict on purpose)
    const TREE_CLASS_RE = /(^|[-_\s])(tree|subnav|submenu|sub-menu|children|plugin-tree|plugin-list)([-_\s]|$)/i;
    // Extra selectors hidden while collapsed
    const EXTRA_HIDE = [];

    const HTML_ATTR = 'data-sl-sb';
    const BTN_ID = 'slSbToggle';
    const POP_ID = 'slSbPop';
    const POP_GAP = 12;            // Distance between sidebar edge and popup (px)
    const POP_HIDE_DELAY = 200;    // ms before the popup closes after the pointer leaves
    // ====================

    const root = document.documentElement;
    const safeGet = (k, d) => { try { return api.getConfig(k, d); } catch (e) { return d; } };
    const safeSet = (k, v) => { try { api.setConfig(k, v); } catch (e) {} };

    // ---------- i18n ----------
    try {
      api.registerMessages({
        en: {
          tipCollapse: 'Collapse sidebar (Ctrl+B)',
          tipExpand: 'Expand sidebar (Ctrl+B)',
          cmdToggle: 'Toggle sidebar collapse',
          popTitle: 'Plugins',
          info: 'Use the round handle on the sidebar edge to collapse / expand the navigation bar. Shortcut: Ctrl+B.',
          btnToggle: 'Toggle sidebar',
          btnDump: 'Export sidebar structure (debug)',
          btnDiag: 'Diagnose button'
        },
        zh: {
          tipCollapse: '收缩侧边栏 (Ctrl+B)',
          tipExpand: '展开侧边栏 (Ctrl+B)',
          cmdToggle: '切换侧边栏收缩',
          popTitle: '插件',
          info: '使用侧边栏边缘的圆形按钮收缩/展开导航栏,快捷键 Ctrl+B。',
          btnToggle: '切换侧边栏',
          btnDump: '导出侧边栏结构(排查用)',
          btnDiag: '诊断按钮'
        }
      });
    } catch (e) {}
    const T = (k) => { try { return api.t(k); } catch (e) { return k; } };

    const state = {
      collapsed: !!safeGet('collapsed', false),
      mo: null, ro: null, roTarget: null,
      onKey: null, onResize: null, onOver: null, onLeave: null, onBlur: null,
      styleHandle: null,
      raf: 0, trackRaf: 0, trackUntil: 0,
      hideT: 0, curTrig: null
    };
    this._state = state;

    // ---------- Styles ----------
    const itemSel = SEL.items
      .split(',')
      .map(s => `html[${HTML_ATTR}="1"] ${s.trim()}`)
      .join(', ');
    const extraHideCss = EXTRA_HIDE.length
      ? EXTRA_HIDE.map(s => `html[${HTML_ATTR}="1"] ${s}`).join(', ') + '{display:none !important;}'
      : '';

    state.styleHandle = api.addStyle(`
      html ${SEL.sidebar}{
        transition: width .25s ease, min-width .25s ease, max-width .25s ease, flex-basis .25s ease;
      }
      html[${HTML_ATTR}="1"] ${SEL.sidebar}{
        width:${W_COLLAPSED}px !important;
        min-width:${W_COLLAPSED}px !important;
        max-width:${W_COLLAPSED}px !important;
        flex-basis:${W_COLLAPSED}px !important;
        overflow-x:hidden !important;
        box-sizing:border-box;
      }
      /* Keep fixed-width children from overflowing the narrow sidebar */
      html[${HTML_ATTR}="1"] ${SEL.sidebar} *{min-width:0;}
      html[${HTML_ATTR}="1"] ${SEL.sidebar} > *{
        max-width:100% !important;
        box-sizing:border-box;
        overflow-x:hidden;
      }
      ${itemSel}{
        justify-content:center !important;
        padding-left:0 !important;
        padding-right:0 !important;
        gap:0 !important;
      }
      /* Labels and the plugin tree are hidden while collapsed */
      html[${HTML_ATTR}="1"] .sl-hide,
      html[${HTML_ATTR}="1"] .sl-hide-t,
      html[${HTML_ATTR}="1"] .sl-tree{display:none !important;}
      ${extraHideCss}

      /* Toggle handle: fixed, attached to <html>, always on top */
      html #${BTN_ID}{
        position:fixed !important;
        z-index:2147483000 !important;
        visibility:visible !important;
        opacity:1 !important;
        pointer-events:auto !important;
        width:${BTN_SIZE}px;height:${BTN_SIZE}px;
        align-items:center;justify-content:center;
        padding:0;margin:0;
        border-radius:50%;
        border:1px solid var(--border, rgba(120,130,160,.35));
        background:var(--surface-solid, var(--card, #fff));
        color:var(--text, #556);
        box-shadow:0 2px 8px rgba(0,0,0,.18);
        cursor:pointer;
        font-size:0;
        transition:background .15s, border-color .15s, transform .15s;
      }
      html #${BTN_ID}:hover{
        background:var(--accent-soft, #eef);
        border-color:var(--accent, #88f);
      }
      html #${BTN_ID}:active{transform:scale(.9);}
      html #${BTN_ID} svg{
        width:14px;height:14px;
        stroke:currentColor;fill:none;stroke-width:2.6;
        stroke-linecap:round;stroke-linejoin:round;
        transition:transform .25s ease;
      }
      /* Left sidebar: "<" when expanded, ">" when collapsed. Right sidebar: reversed. */
      html[${HTML_ATTR}="1"] #${BTN_ID}[data-side="left"] svg{transform:rotate(180deg);}
      html #${BTN_ID}[data-side="right"] svg{transform:rotate(180deg);}
      html[${HTML_ATTR}="1"] #${BTN_ID}[data-side="right"] svg{transform:rotate(0deg);}

      /* Hover popup with arrow */
      html #${POP_ID}{
        position:fixed;
        z-index:2147483001;
        display:none;
        opacity:0;
        transform:translateX(-4px);
        transition:opacity .12s ease, transform .12s ease;
        font-size:13px;
        line-height:1.4;
        color:var(--text, #334);
      }
      html #${POP_ID}[data-side="right"]{transform:translateX(4px);}
      html #${POP_ID}.show{opacity:1;transform:none;}
      /* Invisible bridge so the pointer can cross the gap between trigger and popup */
      html #${POP_ID}::before{
        content:'';position:absolute;top:0;bottom:0;width:${POP_GAP + 6}px;
      }
      html #${POP_ID}[data-side="left"]::before{left:-${POP_GAP + 6}px;}
      html #${POP_ID}[data-side="right"]::before{right:-${POP_GAP + 6}px;}
      html #${POP_ID} .sl-pop-body{
        position:relative;z-index:1;
        min-width:176px;max-width:280px;
        padding:6px;
        background:var(--surface-solid, var(--card, #fff));
        border:1px solid var(--border, rgba(120,130,160,.35));
        border-radius:12px;
        box-shadow:0 8px 28px rgba(0,0,0,.22);
      }
      html #${POP_ID} .sl-pop-title{
        padding:6px 10px 4px;
        font-size:11px;
        letter-spacing:.04em;
        opacity:.6;
      }
      html #${POP_ID} .sl-pop-list{max-height:60vh;overflow-y:auto;}
      html #${POP_ID} .sl-pop-item{
        display:flex;align-items:center;gap:10px;
        padding:7px 10px;
        border-radius:8px;
        cursor:pointer;
        user-select:none;
      }
      html #${POP_ID} .sl-pop-item:hover{background:var(--surface-2, rgba(120,130,200,.14));}
      html #${POP_ID} .sl-pop-item.active{color:var(--accent-2, var(--accent, #5b7cff));}
      /* Bare icons are sized here; the app's own .sb-sub-ico tile keeps its native size */
      html #${POP_ID} .sl-pop-item > svg,
      html #${POP_ID} .sl-pop-item > img{width:16px;height:16px;flex:none;object-fit:contain;}
      html #${POP_ID} .sl-pop-item > span:not(.sb-sub-ico){overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      /* Arrow: a rotated square whose two outer borders form the tip */
      html #${POP_ID} .sl-pop-arrow{
        position:absolute;z-index:2;
        width:10px;height:10px;
        background:var(--surface-solid, var(--card, #fff));
        transform:rotate(45deg);
      }
      html #${POP_ID}[data-side="left"] .sl-pop-arrow{
        left:-6px;
        border-left:1px solid var(--border, rgba(120,130,160,.35));
        border-bottom:1px solid var(--border, rgba(120,130,160,.35));
      }
      html #${POP_ID}[data-side="right"] .sl-pop-arrow{
        right:-6px;
        border-top:1px solid var(--border, rgba(120,130,160,.35));
        border-right:1px solid var(--border, rgba(120,130,160,.35));
      }
    `);

    // ---------- Handle button ----------
    // Attached to <html> (not <body>) so that transforms / filters / backdrop-filter
    // on body can never turn position:fixed into position relative to body.
    const ensureBtn = () => {
      let btn = document.getElementById(BTN_ID);
      if (!btn) {
        btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.type = 'button';
        btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
        btn.addEventListener('click', () => toggle());
      }
      if (btn.parentNode !== root) root.appendChild(btn); // (re)attach if the host removed it
      return btn;
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    // Position the handle on the sidebar edge, BTN_TOP_RATIO down the sidebar height
    const place = () => {
      const btn = ensureBtn();
      const sb = document.querySelector(SEL.sidebar);
      if (!sb) { btn.style.setProperty('display', 'none', 'important'); return; }

      const r = sb.getBoundingClientRect();
      if (r.height < 8) { btn.style.setProperty('display', 'none', 'important'); return; }

      const width = r.width >= 8 ? r.width : W_FALLBACK;
      const isLeft = (r.left + width / 2) < window.innerWidth / 2;
      const edge = isLeft ? (r.left + width) : r.left;

      const left = clamp(edge - BTN_SIZE / 2, 2, window.innerWidth - BTN_SIZE - 2);
      const top = clamp(r.top + r.height * BTN_TOP_RATIO - BTN_SIZE / 2, 2, window.innerHeight - BTN_SIZE - 2);

      btn.dataset.side = isLeft ? 'left' : 'right';
      btn.style.setProperty('left', Math.round(left) + 'px', 'important');
      btn.style.setProperty('top', Math.round(top) + 'px', 'important');
      btn.style.setProperty('display', 'flex', 'important');
    };

    // Follow the sidebar frame by frame while its width animates
    const track = (ms) => {
      state.trackUntil = performance.now() + ms;
      if (state.trackRaf) return;
      const loop = () => {
        place();
        if (performance.now() < state.trackUntil) state.trackRaf = requestAnimationFrame(loop);
        else state.trackRaf = 0;
      };
      state.trackRaf = requestAnimationFrame(loop);
    };

    // ---------- Hover popup (replaces the plugin tree while collapsed) ----------
    const hidePop = () => {
      clearTimeout(state.hideT);
      state.curTrig = null;
      const pop = document.getElementById(POP_ID);
      if (pop) {
        pop.classList.remove('show');
        pop.style.display = 'none';
      }
    };
    const scheduleHide = () => {
      clearTimeout(state.hideT);
      state.hideT = setTimeout(hidePop, POP_HIDE_DELAY);
    };

    const entryLabel = (el) =>
      ((el.textContent || '').replace(/\s+/g, ' ').trim()) ||
      el.getAttribute('title') || el.getAttribute('aria-label') || '';

    // Collect the clickable entries of a tree
    const collectEntries = (tree) => {
      if (ENTRY_SELECTOR) {
        return Array.from(tree.querySelectorAll(ENTRY_SELECTOR)).filter(el => entryLabel(el));
      }
      // Generic fallback: innermost clickable element that has a label
      const cands = Array.from(tree.querySelectorAll(
        'button, a, [role="button"], [role="treeitem"], .sb-item, li, [onclick]'
      ));
      return cands.filter(el =>
        entryLabel(el) &&
        !cands.some(o => o !== el && el.contains(o) && entryLabel(o))
      );
    };

    const ensurePop = () => {
      let pop = document.getElementById(POP_ID);
      if (!pop) {
        pop = document.createElement('div');
        pop.id = POP_ID;
        root.appendChild(pop);
      }
      if (pop.parentNode !== root) root.appendChild(pop);
      return pop;
    };

    const showPop = (trig) => {
      const tree = trig.__slTree;
      const sb = document.querySelector(SEL.sidebar);
      if (!tree || !sb || !tree.isConnected) return;
      const entries = collectEntries(tree);
      if (!entries.length) { hidePop(); return; }

      const pop = ensurePop();
      pop.textContent = '';

      const arrow = document.createElement('div');
      arrow.className = 'sl-pop-arrow';
      const body = document.createElement('div');
      body.className = 'sl-pop-body';

      const title = document.createElement('div');
      title.className = 'sl-pop-title';
      title.textContent = trig.dataset.slLabel || T('popTitle');
      body.appendChild(title);

      const list = document.createElement('div');
      list.className = 'sl-pop-list';
      entries.forEach(src => {
        const row = document.createElement('div');
        row.className = 'sl-pop-item';
        if (src.matches('.active, .is-active, .on, .selected, [aria-current], [aria-selected="true"]')) {
          row.classList.add('active');
        }
        // Prefer the app's own icon tile (.sb-sub-ico) so it looks identical to the sidebar tree
        const icon = src.querySelector('.sb-sub-ico') || src.querySelector('svg, img');
        if (icon) row.appendChild(icon.cloneNode(true));
        const label = document.createElement('span');
        label.textContent = entryLabel(src);
        row.appendChild(label);
        // Forward the click to the original (hidden) tree node
        row.addEventListener('click', () => {
          hidePop();
          try { src.click(); } catch (e) {}
        });
        list.appendChild(row);
      });
      body.appendChild(list);
      pop.appendChild(arrow);
      pop.appendChild(body);

      // Measure, then position next to the sidebar edge, arrow aligned with the trigger
      const sbr = sb.getBoundingClientRect();
      const tr = trig.getBoundingClientRect();
      const isLeft = (sbr.left + sbr.width / 2) < window.innerWidth / 2;
      pop.dataset.side = isLeft ? 'left' : 'right';
      pop.style.visibility = 'hidden';
      pop.style.display = 'block';
      const pw = pop.offsetWidth;
      const ph = pop.offsetHeight;
      const centerY = tr.top + tr.height / 2;
      const top = clamp(centerY - 24, 8, Math.max(8, window.innerHeight - ph - 8));
      const left = isLeft ? (sbr.right + POP_GAP) : (sbr.left - POP_GAP - pw);
      arrow.style.top = clamp(centerY - top - 5, 12, Math.max(12, ph - 22)) + 'px';
      pop.style.left = Math.round(clamp(left, 4, window.innerWidth - pw - 4)) + 'px';
      pop.style.top = Math.round(top) + 'px';
      pop.style.visibility = 'visible';
      requestAnimationFrame(() => pop.classList.add('show'));
      state.curTrig = trig;
    };

    // ---------- Collapse state ----------
    const apply = () => {
      if (state.collapsed) root.setAttribute(HTML_ATTR, '1');
      else root.removeAttribute(HTML_ATTR);

      const btn = ensureBtn();
      const tip = T(state.collapsed ? 'tipExpand' : 'tipCollapse');
      btn.title = tip;
      btn.setAttribute('aria-label', tip);
      btn.setAttribute('aria-expanded', String(!state.collapsed));

      hidePop();
      place();
      track(450);
    };

    const toggle = (force) => {
      state.collapsed = typeof force === 'boolean' ? force : !state.collapsed;
      safeSet('collapsed', state.collapsed);
      apply();
      try { api.emit('toggled', { collapsed: state.collapsed }); } catch (e) {}
    };
    this._toggle = toggle;

    // ---------- Auto-detect what to hide while collapsed ----------
    const isButtonLike = (el) => el.matches('button, [role="button"], a');
    const isProtected = (el, sb) => el === sb || el.matches(SEL.items) || isButtonLike(el);

    // Find plugin tree containers (outermost only, and only if they contain entries)
    const findTrees = (sb) => {
      const found = new Set();
      TREE_SELECTORS.forEach(s => {
        try { sb.querySelectorAll(s).forEach(e => found.add(e)); } catch (e) {}
      });
      sb.querySelectorAll('*').forEach(e => {
        if (e === sb || typeof e.className !== 'string') return;
        if (TREE_CLASS_RE.test(e.className + ' ' + (e.id || ''))) found.add(e);
      });
      const cand = Array.from(found).filter(e => e !== sb && !isProtected(e, sb));
      const outer = cand.filter(e => !cand.some(o => o !== e && o.contains(e)));
      return outer.filter(t => collectEntries(t).length > 0);
    };

    const processTrees = (sb) => {
      const trees = findTrees(sb);

      // Clear stale marks left over from a previous render
      sb.querySelectorAll('.sl-tree').forEach(e => { if (!trees.includes(e)) e.classList.remove('sl-tree'); });
      sb.querySelectorAll('[data-sl-trig]').forEach(e => {
        if (!trees.some(t => t.previousElementSibling === e || t.parentElement === e)) {
          e.removeAttribute('data-sl-trig');
          delete e.__slTree;
        }
      });

      trees.forEach(tree => {
        tree.classList.add('sl-tree');
        // The trigger is the nav item right above the tree (#navPlugins, "My plugins")
        let trig = tree.previousElementSibling;
        while (trig && trig.classList.contains('sl-hide')) trig = trig.previousElementSibling;
        if (!trig && tree.parentElement && tree.parentElement !== sb && tree.parentElement.matches(SEL.items)) {
          trig = tree.parentElement;
        }
        if (!trig) return;
        trig.setAttribute('data-sl-trig', '1');
        trig.__slTree = tree;
        if (!trig.dataset.slLabel) {
          const lbl = (trig.getAttribute('title') || entryLabel(trig) || '').trim();
          if (lbl) trig.dataset.slLabel = lbl;
        }
        trig.removeAttribute('title'); // avoid a native tooltip fighting with the popup
      });
    };

    const processSidebar = (sb) => {
      processTrees(sb);

      // A) Text nodes: mixed content -> wrap in a span; pure-text leaf -> mark the element itself
      const walker = document.createTreeWalker(sb, NodeFilter.SHOW_TEXT, null);
      const texts = [];
      let n;
      while ((n = walker.nextNode())) {
        if (n.nodeValue && n.nodeValue.trim()) texts.push(n);
      }

      const leafParents = new Set();
      texts.forEach(tn => {
        const p = tn.parentElement;
        if (!p || p.classList.contains('sl-hide-t') || p.classList.contains('sl-hide')) return;
        if (p.matches('script, style, textarea')) return;
        if (p.children.length === 0) {
          leafParents.add(p);                       // pure-text leaf (labels, section titles)
        } else {
          const span = document.createElement('span');
          span.className = 'sl-hide-t';
          p.insertBefore(span, tn);
          span.appendChild(tn);                     // bare text next to icons
          if (!p.title && !p.hasAttribute('data-sl-trig')) p.title = span.textContent.trim();
        }
      });

      leafParents.forEach(el => {
        const row = el.parentElement;
        // Icon + label item: keep the item, show the label as a tooltip
        if (row && row !== sb && !row.title && !row.hasAttribute('data-sl-trig')) {
          row.title = el.textContent.trim();
        }
        el.classList.add('sl-hide');
      });

      // B) Section rows that only contain a hidden title plus action buttons (e.g. "+") are hidden entirely
      const rows = new Set();
      sb.querySelectorAll('.sl-hide').forEach(h => { if (h.parentElement) rows.add(h.parentElement); });
      rows.forEach(row => {
        if (isProtected(row, sb)) return;
        if (row.querySelector('img, canvas, svg:not(button svg)')) return;
        const onlyActions = Array.from(row.children).every(c =>
          c.classList.contains('sl-hide') ||
          c.classList.contains('sl-hide-t') ||
          (isButtonLike(c) && !c.querySelector('img'))
        );
        if (onlyActions) row.classList.add('sl-hide');
      });
    };

    const scan = () => {
      state.raf = 0;
      const sb = document.querySelector(SEL.sidebar);
      if (sb) {
        processSidebar(sb);
        // Re-attach the ResizeObserver if the sidebar element was re-created
        if (state.roTarget !== sb) {
          if (state.ro) state.ro.disconnect();
          if (typeof ResizeObserver !== 'undefined') {
            state.ro = new ResizeObserver(() => place());
            state.ro.observe(sb);
          }
          state.roTarget = sb;
        }
      }
      place();
    };
    const schedule = () => { if (!state.raf) state.raf = requestAnimationFrame(scan); };

    // Observe the whole document so a removed handle / re-rendered sidebar is repaired
    state.mo = new MutationObserver(schedule);
    state.mo.observe(root, { childList: true, subtree: true });

    state.onResize = () => { place(); hidePop(); };
    window.addEventListener('resize', state.onResize);

    // ---------- Hover handling (delegated, survives sidebar re-renders) ----------
    state.onOver = (e) => {
      if (!state.collapsed) return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      const trig = t.closest('[data-sl-trig]');
      const inPop = t.closest('#' + POP_ID);
      if (trig || inPop) {
        clearTimeout(state.hideT);
        if (trig && state.curTrig !== trig) showPop(trig);
      } else if (state.curTrig) {
        scheduleHide();
      }
    };
    document.addEventListener('mouseover', state.onOver, true);

    state.onLeave = () => { if (state.curTrig) scheduleHide(); };
    root.addEventListener('mouseleave', state.onLeave);

    state.onBlur = () => hidePop();
    window.addEventListener('blur', state.onBlur);

    // ---------- Keyboard: Ctrl+B toggles, Esc closes the popup ----------
    state.onKey = (e) => {
      if (e.key === 'Escape') { hidePop(); return; }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
        const t = e.target;
        const tag = (t && t.tagName) || '';
        if (/INPUT|TEXTAREA|SELECT/.test(tag) || (t && t.isContentEditable)) return;
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', state.onKey);

    // ---------- Command palette (needs "ui" permission; silently skipped otherwise) ----------
    try {
      api.addCommand(api.pluginId + '.toggle', {
        title: T('cmdToggle'),
        run: () => toggle()
      });
    } catch (e) {}

    scan();
    apply();
    api.log('sidebar-collapse activated, collapsed =', state.collapsed);
  },

  // Plugin panel: toggle button + debug helpers
  render(container, api) {
    const T = (k) => { try { return api.t(k); } catch (e) { return k; } };
    container.textContent = '';
    container.appendChild(api.createElement('p', { text: T('info') }));
    api.addButton(T('btnToggle'), () => this._toggle && this._toggle(), container);

    const ta = document.createElement('textarea');
    ta.readOnly = true;
    ta.style.cssText = 'width:100%;height:180px;margin-top:12px;font:12px/1.4 Consolas,monospace;';
    container.appendChild(ta);

    // Dump the sidebar DOM tree so layout issues can be diagnosed
    api.addButton(T('btnDump'), () => {
      try {
        ta.value = JSON.stringify(api.ui.describe('.sidebar', 6), null, 1);
      } catch (e) {
        const sb = document.querySelector('.sidebar');
        ta.value = sb ? sb.outerHTML.slice(0, 8000) : 'no .sidebar found';
      }
    }, container);

    // Report handle position, overlap, and which tree / trigger elements were detected
    api.addButton(T('btnDiag'), () => {
      const btn = document.getElementById('slSbToggle');
      const sb = document.querySelector('.sidebar');
      const desc = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
        (typeof e.className === 'string' && e.className ? '.' + e.className.trim().replace(/\s+/g, '.') : '');
      const info = { collapsed: document.documentElement.hasAttribute('data-sl-sb') };
      if (sb) { const r = sb.getBoundingClientRect(); info.sidebarRect = { l: r.left, t: r.top, w: r.width, h: r.height }; }
      info.trees = Array.from(document.querySelectorAll('.sl-tree')).map(desc);
      info.triggers = Array.from(document.querySelectorAll('[data-sl-trig]')).map(desc);
      if (btn) {
        const r = btn.getBoundingClientRect();
        const cs = getComputedStyle(btn);
        info.button = {
          rect: { l: r.left, t: r.top, w: r.width, h: r.height },
          display: cs.display, visibility: cs.visibility, opacity: cs.opacity, zIndex: cs.zIndex,
          parent: btn.parentNode && btn.parentNode.nodeName
        };
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        info.elementAtCenter = top ? (top.id || top.className || top.nodeName) : null;
        info.coveredByOther = !!top && top !== btn && !btn.contains(top);
      } else {
        info.button = 'not found';
      }
      ta.value = JSON.stringify(info, null, 1);
    }, container);
  },

  deactivate(api) {
    const s = this._state;
    if (s) {
      clearTimeout(s.hideT);
      if (s.mo) s.mo.disconnect();
      if (s.ro) s.ro.disconnect();
      if (s.raf) cancelAnimationFrame(s.raf);
      if (s.trackRaf) cancelAnimationFrame(s.trackRaf);
      if (s.onKey) window.removeEventListener('keydown', s.onKey);
      if (s.onResize) window.removeEventListener('resize', s.onResize);
      if (s.onBlur) window.removeEventListener('blur', s.onBlur);
      if (s.onOver) document.removeEventListener('mouseover', s.onOver, true);
      if (s.onLeave) document.documentElement.removeEventListener('mouseleave', s.onLeave);
      if (s.styleHandle && s.styleHandle.remove) { try { s.styleHandle.remove(); } catch (e) {} }
    }
    ['slSbToggle', 'slSbPop'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    document.documentElement.removeAttribute('data-sl-sb');
    document.querySelectorAll('.sl-hide').forEach(el => el.classList.remove('sl-hide'));
    document.querySelectorAll('.sl-tree').forEach(el => el.classList.remove('sl-tree'));
    document.querySelectorAll('[data-sl-trig]').forEach(el => {
      el.removeAttribute('data-sl-trig');
      delete el.__slTree;
    });
    // Restore wrapped text nodes
    document.querySelectorAll('.sl-hide-t').forEach(span => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    });
  }
};
return plugin;