/* 3D Card Tilt — Tilt cards in 3D following the mouse + moving glare */
const plugin = {
  id: 'card-tilt-3d',
  name: '3D Card Tilt',
  version: '1.1.0',
  author: 'Starline',
  description: 'Game cards and plugin cards tilt in 3D toward your cursor with a moving highlight.',
  permissions: ['storage', 'appearance'],

  activate(api) {
    loadConfig(api);
    start(api);
  },

  render(container, api) {
    loadConfig(api);
    container.textContent = '';
    
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;max-width:560px';

    // Helper to create a setting row
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

    // Helper to create a slider
    function slider(key, min, max, step, fmt) {
      const box = document.createElement('div');
      box.style.cssText = 'display:flex;align-items:center;gap:10px;min-width:220px';
      const input = document.createElement('input');
      input.type = 'range'; input.min = min; input.max = max; input.step = step;
      input.value = cfg[key]; input.style.flex = '1';
      const out = document.createElement('span');
      out.style.cssText = 'min-width:44px;text-align:right;font:600 12px var(--font-mono,monospace);color:var(--text-2)';
      out.textContent = fmt(cfg[key]);
      
      input.addEventListener('input', () => {
        cfg[key] = Number(input.value);
        out.textContent = fmt(cfg[key]);
        api.setConfig('settings.' + key, cfg[key]);
        applyVars();
      });
      box.append(input, out);
      return box;
    }

    // Helper to create a toggle switch
    function toggle(key) {
      const label = document.createElement('label');
      label.className = 'bg-switch';
      const input = document.createElement('input');
      input.type = 'checkbox'; input.checked = !!cfg[key];
      input.addEventListener('change', () => {
        cfg[key] = input.checked;
        api.setConfig('settings.' + key, cfg[key]);
        reset();
      });
      label.append(input, document.createElement('span'));
      return label;
    }

    wrap.append(
      // Enhanced custom range: 5 to 45 degrees. Default is 15.
      row('Tilt strength', slider('max', 5, 1000, 1, v => v + '°')),
      row('Hover zoom', slider('scale', 1, 2.00, 0.01, v => '×' + Number(v).toFixed(2))),
      row('Shine highlight', toggle('glare')),
      row('Game cards', toggle('gameCards')),
      row('Plugin cards', toggle('pluginCards'))
    );
    container.appendChild(wrap);
  },

  deactivate(api) {
    stop();
  }
};

/* ───────── State ───────── */
// Increased default tilt strength from 9 to 15 for a more pronounced 3D effect
const DEF = { max: 15, scale: 1.05, glare: true, gameCards: true, pluginCards: true };
const cfg = Object.assign({}, DEF);
let cssHandle = null, cur = null, last = null, raf = 0, running = false;
let hooks = [];

function loadConfig(api) {
  Object.keys(DEF).forEach(k => { cfg[k] = api.getConfig('settings.' + k, DEF[k]); });
}

function getSelector() {
  const s = [];
  if (cfg.gameCards) s.push('#storePage .card');
  if (cfg.pluginCards) s.push('.plugin-item');
  return s.join(',');
}

function applyVars() {
  document.documentElement.style.setProperty('--slt-s', String(cfg.scale));
}

function start(api) {
  if (running) return;
  running = true;
  try {
    cssHandle = api.ui.injectCSS(`
      .slt-on{
        /* Decreased perspective from 900px to 600px to enhance the 3D depth effect */
        transform: perspective(600px) rotateX(var(--slt-rx,0deg)) rotateY(var(--slt-ry,0deg)) scale(var(--slt-s,1.05)) !important;
        transition: transform .09s linear, box-shadow .25s ease !important;
        will-change: transform; z-index: 4; position: relative;
        box-shadow: 0 14px 34px rgba(0,0,0,.34), 0 0 0 1px var(--border-2, rgba(255,255,255,.12)) !important;
      }
      .slt-glare{
        position:absolute; inset:0; z-index:6; pointer-events:none; border-radius:inherit; opacity:0;
        transition: opacity .2s ease;
        background: radial-gradient(380px circle at var(--slt-gx,50%) var(--slt-gy,50%), rgba(255,255,255,.26), rgba(255,255,255,0) 58%);
        mix-blend-mode: soft-light;
      }
      .slt-on > .slt-glare{ opacity:1; }
      @media (prefers-reduced-motion: reduce){ .slt-on{ transform:none !important; } }
    `);
  } catch (e) {
    api.warn('Needs the "appearance" permission for styling.');
  }
  applyVars();
  on(document, 'pointermove', onMove, { passive: true });
  on(document, 'pointerdown', reset, true);                 /* Reset immediately when dragging cards */
  on(document, 'scroll', reset, true);
  on(document.documentElement, 'mouseleave', reset);
  on(window, 'blur', reset);
}

function stop() {
  running = false;
  reset();
  hooks.forEach(h => h.t.removeEventListener(h.n, h.f, h.o));
  hooks = [];
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  if (cssHandle && cssHandle.remove) { try { cssHandle.remove(); } catch (e) {} }
  cssHandle = null;
  document.querySelectorAll('.slt-glare').forEach(n => n.remove());
  document.documentElement.style.removeProperty('--slt-s');
}

function on(t, n, f, o) {
  t.addEventListener(n, f, o);
  hooks.push({ t, n, f, o });
}

function onMove(e) {
  if (e.pointerType === 'touch' || e.buttons) { reset(); return; }
  const s = getSelector();
  if (!s) { reset(); return; }
  const el = e.target && e.target.closest ? e.target.closest(s) : null;
  if (el !== cur) {
    reset();
    cur = el;
    if (cur) enter(cur);
  }
  if (!cur) return;
  last = e;
  if (!raf) raf = requestAnimationFrame(applyTransform);
}

function enter(el) {
  el.classList.add('slt-on');
  if (cfg.glare && !el.querySelector(':scope > .slt-glare')) {
    const g = document.createElement('i');
    g.className = 'slt-glare';
    el.appendChild(g);
  }
}

function applyTransform() {
  raf = 0;
  if (!cur || !last) return;
  const r = cur.getBoundingClientRect();
  if (!r.width || !r.height) return;
  
  // Normalize coordinates (0 to 1)
  const x = Math.min(1, Math.max(0, (last.clientX - r.left) / r.width));
  const y = Math.min(1, Math.max(0, (last.clientY - r.top) / r.height));
  
  // Calculate rotation based on custom strength (m)
  const m = cfg.max;
  cur.style.setProperty('--slt-rx', ((0.5 - y) * 2 * m).toFixed(2) + 'deg');
  cur.style.setProperty('--slt-ry', ((x - 0.5) * 2 * m).toFixed(2) + 'deg');
  
  // Update glare position
  cur.style.setProperty('--slt-gx', (x * 100).toFixed(1) + '%');
  cur.style.setProperty('--slt-gy', (y * 100).toFixed(1) + '%');
}

function reset() {
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  if (cur) {
    const el = cur;
    el.classList.remove('slt-on');
    el.style.removeProperty('--slt-rx'); el.style.removeProperty('--slt-ry');
    el.style.removeProperty('--slt-gx'); el.style.removeProperty('--slt-gy');
    const g = el.querySelector(':scope > .slt-glare');
    if (g && !cfg.glare) g.remove();
  }
  cur = null; last = null;
}

return plugin;