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
 *   · a real Downloads page: live launch/download task, queue, history, progress graphs
 *   · game detail = centred popup (like the new launcher), profile page in the Epic style
 *   · Collections (create / rename / delete, add games, add from the game popup)
 *   · list view = selectable list on the left + big detail pane on the right (trailer plays right in the pane)
 *   · works with API 2.3; uses api.ui.pin (host API 2.4) when present and falls back to api.ui.move
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
  accent: '#26bbff', accentHi: '#5ccaff', violet: '#5aa9ff'
};

const FONT = "'Inter','Noto Sans','Microsoft YaHei UI','Microsoft YaHei','Segoe UI',system-ui,sans-serif";

const MSG = {
  en: {
    'menu.settings': 'Settings', 'menu.account': 'Account', 'menu.plugins': 'My plugins', 'menu.faq': 'FAQ',
    'menu.logout': 'Sign out', 'menu.exit': 'Exit',
    'recent': 'Recent', 'downloads': 'Downloads', 'back': 'Back', 'forward': 'Forward',
    'dl.title': 'Downloads',
    'col.tab': 'Collections', 'col.games': 'Games', 'col.fav': 'Favorites', 'col.search': 'Search collections',
    'col.new': 'New collection', 'col.items': '{n} items', 'col.item1': '1 item', 'col.rename': 'Rename', 'col.add': 'Add games',
    'col.delete': 'Delete collection', 'col.namePrompt': 'Name your collection', 'col.renamePrompt': 'New name',
    'col.deleteConfirm': 'Delete "{name}"? The games themselves are not affected.', 'col.empty': 'This collection is empty',
    'col.emptySub': 'Add games to start building it.', 'col.done': 'Done', 'col.searchGames': 'Search games',
    'col.back': 'Back', 'col.remove': 'Remove from collection', 'col.addTo': 'Add to collection', 'col.noGames': 'No games found',
    'col.noMatch': 'No collections match your search', 'col.addedTo': 'Added to "{name}"', 'col.removedFrom': 'Removed from "{name}"',
    'col.addGamesTitle': 'Add games to "{name}"',
    'pane.launch': 'Launch', 'pane.buy': 'Buy now', 'pane.launching': 'Launching…', 'pane.more': 'More',
    'pane.activity': 'Activity', 'pane.details': 'Details', 'pane.week': 'Launches this week', 'pane.total': 'Total launches',
    'pane.dev': 'Developer', 'pane.pub': 'Publisher', 'pane.rel': 'Release', 'pane.plat': 'Platform', 'pane.genres': 'Genres',
    'pane.lastRun': 'Last launch', 'pane.never': 'Not launched in this session', 'pane.wishAdd': 'Add to wishlist', 'pane.wishRemove': 'Remove from wishlist',
    'pane.open': 'Open game page', 'dl.upnext': 'Up next', 'dl.ready': 'Ready to launch', 'dl.done': 'Completed',
    'dl.emptyT': 'No active tasks', 'dl.emptyS': 'Launching a game downloads, unpacks and starts it here.',
    'dl.waiting': 'Waiting for current launch', 'dl.launch': 'Launch', 'dl.queue': 'Queue', 'dl.cancel': 'Cancel',
    'dl.remove': 'Remove', 'dl.clear': 'Clear', 'dl.more': 'Show all ({n})', 'dl.less': 'Show less',
    'dl.okChip': 'Launched', 'dl.errChip': 'Failed', 'dl.cancelledChip': 'Cancelled', 'dl.readySub': 'Ready',
    'dl.eta': 'about {t} left', 'dl.elapsed': 'Elapsed {t}', 'dl.running': 'Working…', 'dl.extracting': 'Extracting…',
    'dl.activity': 'Launch activity', 'dl.progress': 'Progress', 'dl.rate': 'Rate',
    'dl.summary': 'Summary', 'dl.today': 'Completed today', 'dl.failedToday': 'Failed today',
    'dl.week': 'Launches this week', 'dl.total': 'Launches all time', 'dl.owned': 'Owned games',
    'dl.paused': 'Subscription paused', 'dl.updating': 'Updating', 'dl.outdated': 'Outdated',
    'dl.queued': '{name} added to the queue', 'dl.settings': 'Settings', 'dl.unavailable': 'Launching is not available right now',
    'dl.justNow': 'just now', 'dl.minAgo': '{n} min ago', 'dl.hrAgo': '{n} h ago', 'dl.dayAgo': '{n} d ago',
    'about': 'Epic Launcher Style is active. Disable the plugin to go back to the normal STARLINE look.',
    'settings.title': 'Epic Launcher Style', 'settings.poster': 'Poster cards (3:4)'
  },
  zh: {
    'menu.settings': '设置', 'menu.account': '账户', 'menu.plugins': '我的插件', 'menu.faq': '常见问题',
    'menu.logout': '登出', 'menu.exit': '退出',
    'recent': '最近', 'downloads': '下载', 'back': '后退', 'forward': '前进',
    'dl.title': '下载',
    'col.tab': '合集', 'col.games': '游戏', 'col.fav': '收藏', 'col.search': '搜索合集',
    'col.new': '新建合集', 'col.items': '{n} 个项目', 'col.item1': '1 个项目', 'col.rename': '重命名', 'col.add': '添加游戏',
    'col.delete': '删除合集', 'col.namePrompt': '给合集起个名字', 'col.renamePrompt': '新名称',
    'col.deleteConfirm': '删除“{name}”？游戏本身不会受影响。', 'col.empty': '这个合集还是空的',
    'col.emptySub': '添加一些游戏开始整理吧。', 'col.done': '完成', 'col.searchGames': '搜索游戏',
    'col.back': '返回', 'col.remove': '从合集中移除', 'col.addTo': '添加到合集', 'col.noGames': '没有找到游戏',
    'col.noMatch': '没有匹配的合集', 'col.addedTo': '已添加到“{name}”', 'col.removedFrom': '已从“{name}”移除',
    'col.addGamesTitle': '添加游戏到“{name}”',
    'pane.launch': '启动', 'pane.buy': '立即购买', 'pane.launching': '启动中…', 'pane.more': '更多',
    'pane.activity': '活动', 'pane.details': '详情', 'pane.week': '本周启动次数', 'pane.total': '累计启动次数',
    'pane.dev': '开发商', 'pane.pub': '发行商', 'pane.rel': '发售日期', 'pane.plat': '平台', 'pane.genres': '类型',
    'pane.lastRun': '最近启动', 'pane.never': '本次运行中尚未启动', 'pane.wishAdd': '加入愿望单', 'pane.wishRemove': '移出愿望单',
    'pane.open': '打开游戏页面', 'dl.upnext': '即将开始', 'dl.ready': '可启动', 'dl.done': '已完成',
    'dl.emptyT': '没有正在进行的任务', 'dl.emptyS': '启动游戏时会在这里下载、解压并运行。',
    'dl.waiting': '等待当前任务完成', 'dl.launch': '启动', 'dl.queue': '加入队列', 'dl.cancel': '取消',
    'dl.remove': '移除', 'dl.clear': '清空', 'dl.more': '显示全部（{n}）', 'dl.less': '收起',
    'dl.okChip': '已启动', 'dl.errChip': '失败', 'dl.cancelledChip': '已取消', 'dl.readySub': '就绪',
    'dl.eta': '约剩余 {t}', 'dl.elapsed': '已用时 {t}', 'dl.running': '处理中…', 'dl.extracting': '正在解压…',
    'dl.activity': '启动活动', 'dl.progress': '进度', 'dl.rate': '速率',
    'dl.summary': '概览', 'dl.today': '今日完成', 'dl.failedToday': '今日失败',
    'dl.week': '本周启动次数', 'dl.total': '累计启动次数', 'dl.owned': '已拥有游戏',
    'dl.paused': '订阅已暂停', 'dl.updating': '更新中', 'dl.outdated': '版本过旧',
    'dl.queued': '已将 {name} 加入队列', 'dl.settings': '设置', 'dl.unavailable': '当前无法启动',
    'dl.justNow': '刚刚', 'dl.minAgo': '{n} 分钟前', 'dl.hrAgo': '{n} 小时前', 'dl.dayAgo': '{n} 天前',
    'about': 'Epic Launcher 风格已启用。停用插件即可恢复 STARLINE 原来的样子。',
    'settings.title': 'Epic Launcher 风格', 'settings.poster': '海报卡片（3:4）'
  }
};

const PAGEFN = { store: 'showStore', profile: 'showProfile', plugins: 'showPlugins', wheel: 'showWheel', admin: 'showAdmin', community: 'showCommunity' };

const S = { api: null, menu: null, modal: null, recentBtn: null, brand: null, css: null, page: null, colPage: null, openDl: null, openCol: null, undo: [] };

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


/* ─────────────────────  Downloads page (= game launch tasks)  ─────────────────────
   "Downloading" in STARLINE means: the host downloads the game package, unpacks it and runs / injects it.
   The host reports it with TASK_BEGIN / TASK_PROG / TASK_STAGE / INJECT_OK / INJECT_ERR messages, and the
   UI keeps LAUNCHING[code]. This module listens to both, keeps a live task + queue + history, and
   starts launches through the app's own doInject(), so licences and status checks still apply. */
const T = { active: null, queue: [], history: [], pcts: [], rate: [], lastMsg: 0, lastSample: 0, nextStart: 0, showAll: false, root: null, sig: {}, onMsg: null };
const A = () => S.api;
const GM = () => (window.GAMES && typeof window.GAMES === 'object') ? window.GAMES : {};
const gmeta = c => GM()[c] || {};
const gtitle = c => { const m = gmeta(c); return m.title || m.short || c; };
const gimg = c => gmeta(c).img || '';
const isOwned = c => { try { return typeof window.hasLic === 'function' && !!window.hasLic(c); } catch (e) { return false; } };
const appT = k => { try { const v = typeof window.uiT === 'function' ? window.uiT(k) : ''; return v && v !== k ? String(v) : ''; } catch (e) { return ''; } };
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDur = ms => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function fmtAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return A().t('dl.justNow');
  const m = Math.round(s / 60); if (m < 60) return A().t('dl.minAgo', { n: m });
  const h = Math.round(m / 60); if (h < 24) return A().t('dl.hrAgo', { n: h });
  return A().t('dl.dayAgo', { n: Math.round(h / 24) });
}
function errText(r) {
  if (!r) return '';
  try { if (typeof window.uiErrText === 'function') { const t = String(window.uiErrText(r) || '').replace(/^[\s:：]+/, ''); if (t) return t; } } catch (e) {}
  return r;
}
function persist() { try { A().setConfig('dlHistory', T.history); } catch (e) {} }
function sbTaskState() {
  const box = document.getElementById('sbTask');
  const txt = id => { const n = document.getElementById(id); return n ? n.textContent.trim() : ''; };
  const pct = parseInt(txt('sbTaskPct'), 10);
  return { visible: !!box && !box.hidden && !box.classList.contains('closing'), name: txt('sbTaskName'), stat: txt('sbTaskStat'), pct: isFinite(pct) ? pct : 0 };
}
function curPct(a) {
  const e = sbTaskState();
  return (e.visible && e.name === gtitle(a.code)) ? e.pct : (a.pct || 0);
}
function stageText(a) {
  if (a.stage === 'extract') return appT('extracting') || A().t('dl.extracting');
  const e = sbTaskState();
  if (e.visible && e.name === gtitle(a.code) && e.stat) return e.stat;
  return appT('injecting') || A().t('dl.running');
}
function avgRate() {
  const r = T.rate.slice(-8); if (!r.length) return 0;
  return r.reduce((x, y) => x + y, 0) / r.length;
}

function begin(code) {
  if (!code) return null;
  if (T.active && T.active.code === code) return T.active;
  if (T.active) finish(T.active.code, 'cancelled');
  T.active = { code, startedAt: Date.now(), pct: 0, stage: 'run' };
  T.pcts = []; T.rate = []; T.lastSample = 0;
  return T.active;
}
function finish(code, status, reason) {
  const a = (T.active && T.active.code === code) ? T.active : { startedAt: Date.now() };
  T.history.unshift({ code, title: gtitle(code), status, reason: reason || '', startedAt: a.startedAt, finishedAt: Date.now() });
  T.history = T.history.slice(0, 40);
  if (T.active && T.active.code === code) T.active = null;
  persist();
}
function onHostMsg(e) {
  const m = e && e.data;
  if (typeof m !== 'string') return;
  let p, a;
  if (m.indexOf('TASK_BEGIN:') === 0) { begin(m.slice(11)); T.lastMsg = Date.now(); }
  else if (m.indexOf('TASK_PROG:') === 0) {
    p = m.slice(10).split(':'); a = begin(p[0]); const v = parseInt(p[1], 10);
    if (a && isFinite(v)) a.pct = v;
    T.lastMsg = Date.now();
  }
  else if (m.indexOf('TASK_STAGE:') === 0) { p = m.slice(11).split(':'); a = begin(p[0]); if (a) a.stage = p[1] || 'run'; T.lastMsg = Date.now(); }
  else if (m.indexOf('INJECT_OK:') === 0) { finish(m.slice(10), 'done'); }
  else if (m.indexOf('INJECT_ERR:') === 0) {
    p = m.split(':');
    finish(p[1] || (T.active && T.active.code) || '', 'err', p.slice(2).join(':'));
  } else return;
  refresh();
}

function launch(code) {
  if (!isOwned(code)) return false;
  if (typeof window.doInject !== 'function') { A().toast(A().t('dl.unavailable')); return false; }
  try { window.CURRENT_GAME = code; window.doInject(); } catch (e) { A().error(e); return false; }
  if (window.LAUNCHING && window.LAUNCHING[code]) begin(code);   /* doInject refuses outdated / paused games with its own toast */
  return true;
}
function act(code) {
  if (T.active && T.active.code === code) return;
  if (T.active) {
    if (T.queue.indexOf(code) < 0) { T.queue.push(code); A().toast(A().t('dl.queued', { name: gtitle(code) })); }
  } else launch(code);
  refresh(true);
}
function cancelActive() {
  const a = T.active; if (!a) return;
  try {
    if (window.CURRENT_GAME !== a.code) window.CURRENT_GAME = a.code;   /* cancelInject() works on the current game */
    if (typeof window.cancelInject === 'function') window.cancelInject();
    if (window.LAUNCHING) window.LAUNCHING[a.code] = false;
  } catch (e) {}
  finish(a.code, 'cancelled');
  refresh(true);
}

function tick() {
  const L = window.LAUNCHING || {};
  const live = Object.keys(L).filter(k => L[k]);
  if (!T.active && live.length) begin(live[0]);
  const a = T.active;
  if (a) {
    const now = Date.now(), pct = curPct(a);
    if (now - T.lastSample >= 1000) {
      const prev = T.pcts.length ? T.pcts[T.pcts.length - 1] : 0;
      T.pcts.push(pct); T.rate.push(Math.max(0, pct - prev));
      if (T.pcts.length > 120) { T.pcts.shift(); T.rate.shift(); }
      T.lastSample = now;
    }
    const e = sbTaskState(), mine = e.visible && e.name === gtitle(a.code);
    /* the user pressed Cancel in the detail page: no OK / ERR will come */
    if (!L[a.code] && now - a.startedAt > 1500 && now - T.lastMsg > 4000 && !mine) finish(a.code, 'cancelled');
  }
  if (!T.active && T.queue.length && Date.now() > T.nextStart) {
    const next = T.queue.shift(); T.nextStart = Date.now() + 1500;
    if (!launch(next)) A().warn('queued launch refused', next);
  }
  refresh();
  try { renderEpicPane(); } catch (e) {}
  if (C.root && !C.root.hidden) refreshCol();
}

/* ── page ── */
const SVG = {
  x:   '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  dl:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v7M9 11.5l3 3 3-3"/></svg>',
  cog: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  play:'<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>'
};

function renderPage(root) {
  const t = k => A().t(k);
  T.root = root; T.sig = {};
  root.classList.add('epic-dlp');
  root.innerHTML =
    '<div class="dlp-head"><h1>' + esc(t('dl.title')) + '</h1><div class="dlp-head-actions">' +
      '<button type="button" class="dlp-icon" data-a="settings" title="' + esc(t('dl.settings')) + '">' + SVG.cog + '</button></div></div>' +
    '<div class="dlp-cols"><section class="dlp-main">' +
      '<div class="dlp-active"></div><div data-sec="queue"></div><div data-sec="ready"></div><div data-sec="done"></div></section>' +
    '<aside class="dlp-side">' +
      '<div class="dlp-panel"><div class="dlp-ph">' + esc(t('dl.activity')) + '</div>' +
        '<div class="dlp-graph"><div class="dlp-gl"><b>' + esc(t('dl.progress')) + '</b><span class="g-prog">0%</span></div><svg class="g1" viewBox="0 0 280 46" preserveAspectRatio="none"></svg>' +
        '<div class="dlp-gl"><b>' + esc(t('dl.rate')) + '</b><span class="g-rate">0.0 %/s</span></div><svg class="g2" viewBox="0 0 280 46" preserveAspectRatio="none"></svg></div></div>' +
      '<div class="dlp-panel"><div class="dlp-ph">' + esc(t('dl.summary')) + '</div><div class="dlp-stats"></div></div>' +
    '</aside></div>';
  root.addEventListener('click', onPageClick);
  refresh(true);
}
function onPageClick(e) {
  const b = e.target.closest('[data-a]');
  if (!b || !T.root || !T.root.contains(b) || b.disabled) return;
  const a = b.dataset.a, c = b.dataset.code;
  if (a === 'launch') act(c);
  else if (a === 'cancel') cancelActive();
  else if (a === 'unqueue') { T.queue = T.queue.filter(x => x !== c); refresh(true); }
  else if (a === 'clear') { T.history = []; persist(); refresh(true); }
  else if (a === 'more') { T.showAll = !T.showAll; refresh(true); }
  else if (a === 'settings') { try { if (typeof window.uiOpenSettings === 'function') window.uiOpenSettings(); } catch (err) {} }
}
function rowHtml(code, sub, btns) {
  return '<div class="dlp-row"><div class="dlp-ico" style="background-image:url(\'' + esc(gimg(code)) + '\')"></div>' +
    '<div class="dlp-rt"><div class="dlp-title">' + esc(gtitle(code)) + '</div><div class="dlp-sub">' + sub + '</div></div>' +
    '<div class="dlp-btns">' + btns + '</div></div>';
}
function setSec(name, html) {
  if (T.sig[name] === html) return;
  T.sig[name] = html;
  const n = T.root.querySelector('[data-sec="' + name + '"]');
  if (n) n.innerHTML = html;
}
function blockReason(code) {
  const m = gmeta(code), st = String(m.status || '').trim().toLowerCase();
  if (st === 'updating') return A().t('dl.updating');
  if (st === 'outdated') return A().t('dl.outdated');
  try { const l = typeof window.licOf === 'function' ? window.licOf(code) : null; if (l && l.paused) return A().t('dl.paused'); } catch (e) {}
  return '';
}
function queueHtml() {
  if (!T.queue.length) return '';
  return '<div class="dlp-h"><span>' + esc(A().t('dl.upnext')) + '</span></div>' +
    T.queue.map(c => rowHtml(c, esc(A().t('dl.waiting')),
      '<button type="button" class="dlp-sq" data-a="unqueue" data-code="' + esc(c) + '" title="' + esc(A().t('dl.remove')) + '">' + SVG.x + '</button>')).join('');
}
function readyHtml() {
  const skip = {}; if (T.active) skip[T.active.code] = 1; T.queue.forEach(c => { skip[c] = 1; });
  const codes = Object.keys(GM()).filter(c => !skip[c] && isOwned(c));
  if (!codes.length) return '';
  const LIM = 6, shown = T.showAll ? codes : codes.slice(0, LIM);
  const label = T.active ? A().t('dl.queue') : A().t('dl.launch');
  let h = '<div class="dlp-h"><span>' + esc(A().t('dl.ready')) + '</span>' +
    (codes.length > LIM ? '<button type="button" class="dlp-link" data-a="more">' + esc(T.showAll ? A().t('dl.less') : A().t('dl.more', { n: codes.length })) + '</button>' : '') + '</div>';
  h += shown.map(c => {
    const why = blockReason(c);
    return rowHtml(c, esc(why || A().t('dl.readySub')),
      '<button type="button" class="dlp-btn" data-a="launch" data-code="' + esc(c) + '"' + (why ? ' disabled' : '') + '>' + SVG.play + '<span>' + esc(label) + '</span></button>');
  }).join('');
  return h;
}
function doneHtml() {
  if (!T.history.length) return '';
  let h = '<div class="dlp-h"><span>' + esc(A().t('dl.done')) + '</span><button type="button" class="dlp-link" data-a="clear">' + esc(A().t('dl.clear')) + '</button></div>';
  h += T.history.slice(0, 12).map(r => {
    const chip = r.status === 'done' ? '<span class="dlp-chip ok">' + esc(A().t('dl.okChip')) + '</span>'
      : r.status === 'err' ? '<span class="dlp-chip err">' + esc(A().t('dl.errChip')) + (r.reason ? ': ' + esc(errText(r.reason)) : '') + '</span>'
      : '<span class="dlp-chip mut">' + esc(A().t('dl.cancelledChip')) + '</span>';
    const can = isOwned(r.code) && !(T.active && T.active.code === r.code);
    return rowHtml(r.code, chip + ' · ' + esc(fmtAgo(r.finishedAt)),
      can ? '<button type="button" class="dlp-btn" data-a="launch" data-code="' + esc(r.code) + '">' + SVG.play + '<span>' + esc(T.active ? A().t('dl.queue') : A().t('dl.launch')) + '</span></button>' : '');
  }).join('');
  return h;
}
function renderActive() {
  const box = T.root.querySelector('.dlp-active'), a = T.active;
  const key = a ? 'a:' + a.code : 'empty';
  if (box.dataset.key !== key) {
    box.dataset.key = key;
    box.innerHTML = a
      ? '<div class="dlp-card"><div class="dlp-art" style="background-image:url(\'' + esc(gimg(a.code)) + '\')"></div><div class="dlp-body">' +
        '<div class="dlp-title">' + esc(gtitle(a.code)) + '</div><div class="dlp-bar"><i></i></div><div class="dlp-stat"></div><div class="dlp-stat2"></div></div>' +
        '<div class="dlp-btns"><button type="button" class="dlp-sq" data-a="cancel" title="' + esc(A().t('dl.cancel')) + '">' + SVG.x + '</button></div></div>'
      : '<div class="dlp-empty">' + SVG.dl + '<div><b>' + esc(A().t('dl.emptyT')) + '</b><div class="dlp-sub">' + esc(A().t('dl.emptyS')) + '</div></div></div>';
  }
  if (!a) return;
  const pct = curPct(a), rate = avgRate();
  const eta = rate > 0.05 && pct < 100 ? A().t('dl.eta', { t: fmtDur((100 - pct) / rate * 1000) }) : '';
  box.querySelector('.dlp-bar i').style.width = pct + '%';
  box.querySelector('.dlp-stat').textContent = [stageText(a), pct + '%', eta].filter(Boolean).join(' · ');
  box.querySelector('.dlp-stat2').textContent = A().t('dl.elapsed', { t: fmtDur(Date.now() - a.startedAt) });
}
function spark(vals, w, h, max) {
  if (!vals.length) return '';
  const n = Math.max(vals.length, 2), m = max || Math.max(1, Math.max.apply(null, vals));
  const pts = vals.map((v, i) => [(i / (n - 1)) * w, h - 3 - (Math.min(v, m) / m) * (h - 8)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1], first = pts[0];
  return '<path class="fill" d="' + line + ' L' + last[0].toFixed(1) + ' ' + h + ' L' + first[0].toFixed(1) + ' ' + h + ' Z"/><path class="line" d="' + line + '"/>';
}
function renderSide() {
  const r = T.root, a = T.active, pct = a ? curPct(a) : 0;
  r.querySelector('.g1').innerHTML = spark(T.pcts.slice(-90), 280, 46, 100);
  r.querySelector('.g2').innerHTML = spark(T.rate.slice(-90), 280, 46);
  r.querySelector('.g-prog').textContent = pct + '%';
  r.querySelector('.g-rate').textContent = (a ? avgRate() : 0).toFixed(1) + ' %/s';
  const day0 = new Date().setHours(0, 0, 0, 0);
  const okToday = T.history.filter(h => h.status === 'done' && h.finishedAt >= day0).length;
  const errToday = T.history.filter(h => h.status === 'err' && h.finishedAt >= day0).length;
  const own = Object.keys(GM()).filter(isOwned);
  const sum = k => own.reduce((n, c) => n + (parseInt(gmeta(c)[k], 10) || 0), 0);
  const rows = [['dl.today', okToday], ['dl.failedToday', errToday], ['dl.week', sum('runsWeek')], ['dl.total', sum('runs')], ['dl.owned', own.length]];
  const html = rows.map(x => '<div class="dlp-stat-row"><span>' + esc(A().t(x[0])) + '</span><b>' + x[1] + '</b></div>').join('');
  const box = r.querySelector('.dlp-stats');
  if (T.sig.stats !== html) { T.sig.stats = html; box.innerHTML = html; }
}
function refresh(force) {
  const root = T.root;
  if (!root || !root.isConnected) return;
  if (root.hidden && !force) return;
  renderActive();
  setSec('queue', queueHtml()); setSec('ready', readyHtml()); setSec('done', doneHtml());
  renderSide();
}


/* ─────────────────────  shared pop-up menu + icons  ───────────────────── */
const SV = {
  x:     '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  imgs:  '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="14" height="14" rx="2"/><path d="M3 17V5a2 2 0 0 1 2-2h12"/><circle cx="12" cy="12" r="1.6"/><path d="M21 17l-4-4-6 6"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  addcol:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg>',
  dots:  '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
  play:  '<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
  pad:   '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="5"/><path d="M7 12h4M9 10v4"/><circle cx="16" cy="11" r=".9"/><circle cx="18" cy="13" r=".9"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
  plus:  '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  back:  '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><polygon points="3 9 7 9 12 5 12 19 7 15 3 15 3 9"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  muted: '<svg viewBox="0 0 24 24"><polygon points="3 9 7 9 12 5 12 19 7 15 3 15 3 9"/><line x1="17" y1="9" x2="22" y2="14"/><line x1="22" y1="9" x2="17" y2="14"/></svg>'
};

/* items: { label, run, check?, danger? } or '-' */
function popMenu(anchor, items) {
  closeMenu();
  const m = el('div', 'epic-menu epic-menu-pop');
  items.forEach(it => {
    if (it === '-') { m.appendChild(el('hr')); return; }
    const b = el('button', it.danger ? 'danger' : '');
    b.type = 'button';
    b.innerHTML = (it.check === undefined ? '' : '<i class="chk">' + (it.check ? '✓' : '') + '</i>') + '<span>' + esc(it.label) + '</span>';
    b.addEventListener('click', e => { e.stopPropagation(); closeMenu(); try { it.run(); } catch (err) { A().warn(err); } });
    m.appendChild(b);
  });
  document.body.appendChild(m);
  S.menu = m;
  const r = anchor.getBoundingClientRect(), w = 240;
  m.style.width = w + 'px';
  m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
  const top = r.bottom + 6;
  m.style.top = top + 'px';
  requestAnimationFrame(() => {
    const h = m.offsetHeight;
    if (top + h > window.innerHeight - 8) m.style.top = Math.max(8, r.top - h - 6) + 'px';
    m.classList.add('on');
  });
}
function closeModal() { if (S.modal) { S.modal.remove(); S.modal = null; } }

/* ─────────────────────────  Collections  ─────────────────────────
   Stored with api.setConfig('collections') -> [{ id, name, codes:[gameCode…], created }]  */
const C = { list: [], view: '', q: '', root: null, sig: '' };
const loadCols = () => { const v = A().getConfig('collections', []); C.list = Array.isArray(v) ? v.filter(c => c && c.id && Array.isArray(c.codes)) : []; };
const saveCols = () => { try { A().setConfig('collections', C.list); } catch (e) {} };
const colById = id => C.list.find(c => c.id === id);
const nid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const poster = c => { const m = gmeta(c); return m.poster || m.img || ''; };
const inCol = (c, code) => c.codes.indexOf(code) >= 0;
function allCodes() {
  const keys = Object.keys(GM()), o = window.GRID_ORDER;
  if (!Array.isArray(o)) return keys;
  return o.filter(c => GM()[c]).concat(keys.filter(k => o.indexOf(k) < 0));
}
function nItems(n) { return n === 1 ? A().t('col.item1') : A().t('col.items', { n }); }

async function askName(msgKey, def) {
  let v = null;
  try { v = await A().promptAsync(A().t(msgKey), { title: A().t(def ? 'col.rename' : 'col.new'), defaultValue: def || '' }); } catch (e) {}
  if (v == null) return '';
  return String(v).trim().slice(0, 40);
}
async function newCollection() {
  const name = await askName('col.namePrompt', '');
  if (!name) return null;
  const c = { id: nid(), name, codes: [], created: Date.now() };
  C.list.unshift(c); saveCols(); refreshCol(true);
  return c;
}
async function renameCollection(id) {
  const c = colById(id); if (!c) return;
  const name = await askName('col.renamePrompt', c.name);
  if (!name) return;
  c.name = name; saveCols(); refreshCol(true);
}
async function deleteCollection(id) {
  const c = colById(id); if (!c) return;
  let ok = false;
  try { ok = await A().confirmAsync(A().t('col.deleteConfirm', { name: c.name }), { title: A().t('col.delete') }); } catch (e) {}
  if (!ok) return;
  C.list = C.list.filter(x => x.id !== id);
  if (C.view === id) C.view = '';
  saveCols(); refreshCol(true);
}
function toggleMember(id, code, quiet) {
  const c = colById(id); if (!c) return;
  const i = c.codes.indexOf(code);
  if (i >= 0) { c.codes.splice(i, 1); if (!quiet) A().toast(A().t('col.removedFrom', { name: c.name })); }
  else { c.codes.push(code); if (!quiet) A().toast(A().t('col.addedTo', { name: c.name })); }
  saveCols(); refreshCol(true);
}
/* the "add to collection" menu used by the game popup and the list pane */
function colPicker(anchor, code) {
  const items = C.list.map(c => ({ label: c.name, check: inCol(c, code), run: () => toggleMember(c.id, code) }));
  if (items.length) items.push('-');
  items.push({ label: A().t('col.new'), run: async () => { const c = await newCollection(); if (c) toggleMember(c.id, code); } });
  popMenu(anchor, items);
}
/* modal: tick the games that belong in a collection */
function openPicker(id) {
  const c = colById(id); if (!c) return;
  closeModal();
  const wrap = el('div', 'epic-modal');
  wrap.innerHTML = '<div class="epic-modal-card"><div class="pk-head"><b>' + esc(A().t('col.addGamesTitle', { name: c.name })) + '</b>' +
    '<button type="button" class="pk-x" data-pk="close">' + SV.x + '</button></div>' +
    '<div class="pk-search">' + SV.search + '<input type="text" placeholder="' + esc(A().t('col.searchGames')) + '"></div>' +
    '<div class="pk-list"></div><div class="pk-foot"><button type="button" class="dlp-btn pri" data-pk="close">' + esc(A().t('col.done')) + '</button></div></div>';
  const list = wrap.querySelector('.pk-list'), input = wrap.querySelector('input');
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const codes = allCodes().filter(k => !q || gtitle(k).toLowerCase().indexOf(q) >= 0);
    list.innerHTML = codes.length ? codes.map(k =>
      '<div class="pk-row' + (inCol(c, k) ? ' on' : '') + '" data-code="' + esc(k) + '"><div class="pk-ico" style="background-image:url(\'' + esc(poster(k)) + '\')"></div>' +
      '<span>' + esc(gtitle(k)) + '</span><i class="pk-chk">' + (inCol(c, k) ? '✓' : '') + '</i></div>').join('')
      : '<div class="pk-none">' + esc(A().t('col.noGames')) + '</div>';
  };
  wrap.addEventListener('click', e => {
    if (e.target === wrap || e.target.closest('[data-pk="close"]')) { closeModal(); return; }
    const row = e.target.closest('.pk-row'); if (!row) return;
    toggleMember(id, row.dataset.code, true);
    row.classList.toggle('on', inCol(c, row.dataset.code));
    row.querySelector('.pk-chk').textContent = inCol(c, row.dataset.code) ? '✓' : '';
  });
  input.addEventListener('input', draw);
  document.body.appendChild(wrap);
  S.modal = wrap; draw(); input.focus();
}

/* page */
function renderColPage(root) {
  C.root = root; C.sig = '';
  root.classList.add('epic-colp');
  root.innerHTML =
    '<div class="col-head"><div class="col-tabs">' +
      '<button type="button" data-a="tab-games">' + esc(A().t('col.games')) + '</button>' +
      '<button type="button" data-a="tab-fav">' + esc(A().t('col.fav')) + '</button>' +
      '<button type="button" class="on" data-a="tab-col">' + esc(A().t('col.tab')) + '</button></div>' +
      '<div class="col-search">' + SV.search + '<input type="text" placeholder="' + esc(A().t('col.search')) + '"></div></div>' +
    '<div class="col-body"></div>';
  root.addEventListener('click', onColClick);
  root.querySelector('.col-search input').addEventListener('input', e => { C.q = e.target.value.trim().toLowerCase(); refreshCol(true); });
  refreshCol(true);
}
function colThumbs(c) {
  let h = '';
  for (let i = 0; i < 4; i++) h += c.codes[i] ? '<i style="background-image:url(\'' + esc(poster(c.codes[i])) + '\')"></i>' : '<i class="empty"></i>';
  return h;
}
function colListHtml() {
  const q = C.q;
  const shown = C.list.filter(c => !q || c.name.toLowerCase().indexOf(q) >= 0);
  let h = '<div class="col-grid">';
  if (!q) h += '<button type="button" class="col-new" data-a="new"><span class="plus">' + SV.plus + '</span><b>' + esc(A().t('col.new')) + '</b></button>';
  h += shown.map(c =>
    '<div class="col-card" data-a="open" data-id="' + esc(c.id) + '"><div class="col-card-head"><div><b class="col-name">' + esc(c.name) + '</b>' +
    '<div class="col-count">' + esc(nItems(c.codes.length)) + '</div></div>' +
    '<button type="button" class="col-more" data-a="menu" data-id="' + esc(c.id) + '">' + SV.dots + '</button></div>' +
    '<div class="col-thumbs">' + colThumbs(c) + '</div></div>').join('');
  h += '</div>';
  if (q && !shown.length) h = '<div class="dlp-empty"><div><b>' + esc(A().t('col.noMatch')) + '</b></div></div>';
  return h;
}
function colViewHtml() {
  const c = colById(C.view);
  if (!c) { C.view = ''; return colListHtml(); }
  let h = '<div class="cv-head"><button type="button" class="dlp-sq" data-a="back" title="' + esc(A().t('col.back')) + '">' + SV.back + '</button>' +
    '<div class="cv-title"><b>' + esc(c.name) + '</b><div class="col-count">' + esc(nItems(c.codes.length)) + '</div></div>' +
    '<div class="cv-btns"><button type="button" class="dlp-btn pri" data-a="addgames" data-id="' + esc(c.id) + '">' + SV.plus + '<span>' + esc(A().t('col.add')) + '</span></button>' +
    '<button type="button" class="col-more" data-a="menu" data-id="' + esc(c.id) + '">' + SV.dots + '</button></div></div>';
  if (!c.codes.length) return h + '<div class="dlp-empty"><div><b>' + esc(A().t('col.empty')) + '</b><div class="dlp-sub">' + esc(A().t('col.emptySub')) + '</div></div></div>';
  h += '<div class="cv-grid">' + c.codes.filter(k => GM()[k]).map(k =>
    '<div class="cv-item" data-a="game" data-code="' + esc(k) + '"><div class="cv-poster" style="background-image:url(\'' + esc(poster(k)) + '\')">' +
    '<button type="button" class="cv-x" data-a="rm" data-code="' + esc(k) + '" data-id="' + esc(c.id) + '" title="' + esc(A().t('col.remove')) + '">' + SV.x + '</button></div>' +
    '<div class="cv-name">' + esc(gtitle(k)) + '</div></div>').join('') + '</div>';
  return h;
}
function refreshCol(force) {
  const r = C.root;
  if (!r || !r.isConnected) return;
  const html = C.view ? colViewHtml() : colListHtml();
  if (!force && html === C.sig) return;
  C.sig = html;
  r.querySelector('.col-body').innerHTML = html;
  r.querySelector('.col-search').style.visibility = C.view ? 'hidden' : '';
}
function onColClick(e) {
  const b = e.target.closest('[data-a]');
  if (!b || !C.root || !C.root.contains(b)) return;
  const a = b.dataset.a, id = b.dataset.id, code = b.dataset.code;
  if (a === 'tab-games' || a === 'tab-fav') {
    try { if (typeof window.showStore === 'function') window.showStore(); if (typeof window.setFilter === 'function') window.setFilter(a === 'tab-fav' ? 'wish' : 'all'); } catch (err) {}
  }
  else if (a === 'new') newCollection();
  else if (a === 'open') { C.view = id; refreshCol(true); }
  else if (a === 'back') { C.view = ''; refreshCol(true); }
  else if (a === 'addgames') openPicker(id);
  else if (a === 'rm') { e.stopPropagation(); toggleMember(id, code, true); }
  else if (a === 'game') { try { if (typeof window.openDetail === 'function') window.openDetail(code); } catch (err) {} }
  else if (a === 'menu') {
    e.stopPropagation();
    popMenu(b, [
      { label: A().t('col.rename'), run: () => renameCollection(id) },
      { label: A().t('col.add'), run: () => openPicker(id) },
      '-',
      { label: A().t('col.delete'), danger: true, run: () => deleteCollection(id) }
    ]);
  }
}

/* ─────────  list view: Epic-style selectable list + large detail pane  ───────── */
const P = { sel: '', node: null, sig: '', items: [], idx: 0, muted: true, want: true, autoPaused: false, video: null, mediaFor: '' };
const listMode = () => { const g = document.getElementById('grid'); return !!g && g.classList.contains('list'); };
const isWishedGame = c => { try { return typeof window.isWished === 'function' && !!window.isWished(c); } catch (e) { return false; } };
const isVid = u => (typeof window.isVideoUrl === 'function') ? !!window.isVideoUrl(u) : /\.(mp4|webm|ogv|m4v|mov)(\?.*)?$/i.test(String(u || ''));
function lastRun(code) { return T.history.find(h => h.code === code && h.status === 'done'); }
function paneSignature(code) {
  const L = window.LAUNCHING || {};
  return [code, isOwned(code), isWishedGame(code), !!L[code], (T.active && T.active.code === code) ? curPct(T.active) : '', lastRun(code) ? lastRun(code).finishedAt : ''].join('|');
}
/* media of the selected game; the trailer goes first and plays by itself, like in the launcher */
function paneItems(code) {
  let m = [];
  try { m = ((typeof window.mediaItems === 'function' ? window.mediaItems(code) : []) || []).slice(); } catch (e) {}
  if (!m.length) { const f = gmeta(code).poster || gmeta(code).img; if (f) m = [f]; }
  const v = m.findIndex(isVid);
  if (v > 0) m.unshift(m.splice(v, 1)[0]);
  return m;
}
function paneMediaHtml(n) {
  return '<div class="ep-media"><div class="ep-stage" data-pa="toggle"></div>' +
    '<button type="button" class="ep-play" data-pa="toggle" aria-label="Play / pause">' + SV.play + '</button>' +
    (n > 1 ? '<button type="button" class="ep-count" data-pa="next">' + SV.imgs + '<span>' + n + '</span></button>' : '') +
    '<button type="button" class="ep-mute" data-pa="mute" hidden>' + SV.muted + '</button>' +
    '<div class="ep-prog" hidden><i></i></div></div>';
}
function stopPaneVideo() {
  const v = P.video;
  if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }
  P.video = null; P.autoPaused = false;
}
function pausePaneVideo() { const v = P.video; if (v && !v.paused) { try { v.pause(); } catch (e) {} P.autoPaused = true; } }
function resumePaneVideo() {
  const v = P.video;
  if (v && P.autoPaused) { P.autoPaused = false; if (P.want) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } }
}
function showPaneItem(i) {
  const wrap = P.node && P.node.querySelector('.ep-media');
  if (!wrap || !P.items.length) return;
  P.idx = (i + P.items.length) % P.items.length;
  const stage = wrap.querySelector('.ep-stage'), url = P.items[P.idx];
  const mute = wrap.querySelector('.ep-mute'), prog = wrap.querySelector('.ep-prog');
  stopPaneVideo();
  stage.innerHTML = ''; stage.style.backgroundImage = '';
  wrap.classList.remove('paused', 'is-video');
  if (isVid(url)) {
    const v = document.createElement('video');
    v.className = 'ep-video'; v.muted = P.muted; v.defaultMuted = P.muted; v.loop = true; v.autoplay = true;
    v.setAttribute('playsinline', ''); if (P.muted) v.setAttribute('muted', ''); v.preload = 'auto';
    v.addEventListener('timeupdate', () => { if (v.duration) prog.firstElementChild.style.width = (v.currentTime / v.duration * 100) + '%'; });
    v.addEventListener('play', () => wrap.classList.remove('paused'));
    v.addEventListener('pause', () => wrap.classList.add('paused'));
    v.src = url; stage.appendChild(v); P.video = v;
    wrap.classList.add('is-video');
    mute.hidden = false; prog.hidden = false; prog.firstElementChild.style.width = '0';
    mute.innerHTML = P.muted ? SV.muted : SV.sound;
    if (P.want) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => wrap.classList.add('paused')); }
    else wrap.classList.add('paused');
  } else {
    mute.hidden = true; prog.hidden = true;
    const pre = new Image(), done = () => { stage.style.backgroundImage = "url('" + String(url).replace(/'/g, '%27') + "')"; };
    pre.onload = done; pre.onerror = done; pre.src = url;
  }
}
function paneRestHtml(code) {
  const m = gmeta(code), t = k => A().t(k);
  const owned = isOwned(code), L = window.LAUNCHING || {}, busy = !!L[code];
  let main;
  if (!owned) main = '<button type="button" class="ep-main buy" data-pa="buy">' + esc(appT('buyNow') || t('pane.buy')) + '</button>';
  else if (busy) main = '<button type="button" class="ep-main" disabled>' + esc(t('pane.launching')) + (T.active && T.active.code === code ? ' ' + curPct(T.active) + '%' : '') + '</button>';
  else main = '<button type="button" class="ep-main" data-pa="launch">' + SV.play + '<span>' + esc(appT('launch') || t('pane.launch')) + '</span></button>';
  const wk = Math.max(0, Number(m.runsWeek) || 0), tt = Math.max(0, Number(m.runs) || 0);
  const lr = lastRun(code);
  const rel = m.rel ? (typeof window.relT === 'function' ? window.relT(m.rel) : m.rel) : '';
  const gens = (m.gen || []).map(x => typeof window.tagT === 'function' ? window.tagT(x) : x).join(', ');
  const kv = (k, v) => v ? '<div class="ep-kv"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>' : '';
  return '<div class="ep-actions">' + main +
      '<button type="button" class="ep-ico' + (isWishedGame(code) ? ' on' : '') + '" data-pa="wish" title="' + esc(t(isWishedGame(code) ? 'pane.wishRemove' : 'pane.wishAdd')) + '">' + SV.heart + '</button>' +
      '<button type="button" class="ep-ico" data-pa="col" title="' + esc(t('col.addTo')) + '">' + SV.addcol + '</button>' +
      '<button type="button" class="ep-ico" data-pa="more" title="' + esc(t('pane.open')) + '">' + SV.dots + '</button>' +
      '<div class="ep-stats"><div class="ep-stat"><span>' + esc(t('pane.week')) + '</span><b>' + wk + '</b></div>' +
      '<div class="ep-stat"><span>' + esc(t('pane.total')) + '</span><b>' + tt + '</b></div></div></div>' +
    '<div class="ep-cols"><section><h3>' + esc(t('pane.activity')) + '</h3><div class="ep-card">' +
      '<div class="ep-row"><div class="ic">' + SV.pad + '</div><div><b>' + esc(t('pane.total')) + '</b><div class="sub">' + SV.clock + '<span>' + tt + '</span></div></div></div>' +
      '<div class="ep-row"><div class="ic">' + SV.clock + '</div><div><b>' + esc(t('pane.lastRun')) + '</b><div class="sub">' + esc(lr ? fmtAgo(lr.finishedAt) : t('pane.never')) + '</div></div></div>' +
    '</div></section><section><h3>' + esc(t('pane.details')) + '</h3><div class="ep-card">' +
      kv(t('pane.plat'), 'Windows') + kv(t('pane.dev'), m.dev) + kv(t('pane.pub'), m.pub) + kv(t('pane.rel'), rel) + kv(t('pane.genres'), gens) +
    '</div></section></div>';
}
function renderEpicPane(force) {
  const node = P.node;
  if (!node) return;
  if (!listMode() || !node.offsetParent) { pausePaneVideo(); return; }   /* grid view / another page: stop the trailer */
  resumePaneVideo();
  const cards = [].slice.call(document.querySelectorAll('#grid .card[data-game]'));
  const codes = cards.map(c => c.getAttribute('data-game'));
  if (!codes.length) { stopPaneVideo(); node.innerHTML = ''; P.sig = ''; P.mediaFor = ''; return; }
  if (!P.sel || codes.indexOf(P.sel) < 0) { P.sel = codes[0]; force = true; }
  cards.forEach(c => c.classList.toggle('epic-sel', c.getAttribute('data-game') === P.sel));
  if (!node.querySelector('.ep-mediawrap')) { node.innerHTML = '<div class="ep-mediawrap"></div><div class="ep-rest"></div>'; P.mediaFor = ''; }
  if (P.mediaFor !== P.sel) {                                           /* new selection: rebuild the player */
    P.items = paneItems(P.sel); P.mediaFor = P.sel; P.idx = 0; P.want = true;
    node.querySelector('.ep-mediawrap').innerHTML = paneMediaHtml(P.items.length);
    showPaneItem(0); force = true;
  }
  const sig = paneSignature(P.sel);
  if (!force && sig === P.sig) return;                                  /* only the buttons / stats change: the video keeps playing */
  P.sig = sig;
  node.querySelector('.ep-rest').innerHTML = paneRestHtml(P.sel);
}
function onPaneClick(e) {
  const b = e.target.closest('[data-pa]');
  if (!b || b.disabled) return;
  const a = b.dataset.pa;
  if (a === 'toggle') {
    const v = P.video;
    if (v) { if (v.paused) { P.want = true; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } else { P.want = false; v.pause(); } }
    return;
  }
  if (a === 'next') { showPaneItem(P.idx + 1); return; }
  if (a === 'mute') {
    P.muted = !P.muted;
    if (P.video) { P.video.muted = P.muted; P.video.defaultMuted = P.muted; }
    b.innerHTML = P.muted ? SV.muted : SV.sound;
    return;
  }
  const code = P.sel; if (!code) return;
  const w = window;
  try {
    if (a === 'launch') act(code);
    else if (a === 'buy') { if (typeof w.renewGame === 'function') w.renewGame(e, code); }
    else if (a === 'wish') { if (typeof w.toggleWish === 'function') w.toggleWish(e, code); A().setTimeout(() => renderEpicPane(true), 60); }
    else if (a === 'col') colPicker(b, code);
    else if (a === 'more') { if (typeof w.openDetail === 'function') w.openDetail(code); }
  } catch (err) { A().warn(err); }
  renderEpicPane(true);
}

/* ─────────────────────────────  CSS  ───────────────────────────── */
function buildCss() {
  return `
@E{
  --ep-bg:#0e0e10; --ep-panel:#141416; --ep-panel-2:#1c1c20; --ep-hover:#242429; --ep-active:#2d2d33;
  --ep-line:rgba(255,255,255,.07); --ep-line-2:rgba(255,255,255,.14);
  --ep-text:#f5f5f7; --ep-dim:#a8a8b2; --ep-blue:#26bbff; --ep-blue-hi:#5ccaff;
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

/* window close, top right (moved into the tab bar by the plugin) */
@E .sidebar>.tb-btn.close{position:absolute;top:0;bottom:0;right:10px;margin:auto 0;z-index:5;width:44px;height:38px;border-radius:8px;
  background:transparent;border:0;color:#d8d8de;-webkit-app-region:no-drag}
@E .sidebar>.tb-btn.close:hover{background:#c42b1c;color:#fff}

/* ── bottom bar (the old sidebar footer) ── */
@E .sb-foot{position:fixed;left:0;right:0;bottom:0;height:48px;z-index:200;margin:0;padding:0 22px;border:0;background:var(--ep-bg);
  display:grid;grid-template-columns:1fr auto 1fr;grid-template-rows:48px;align-items:center}
@E .sb-foot>*{grid-row:1}
@E .sb-foot>.sb-item{grid-column:3;justify-self:end;height:34px;padding:0 12px;font-size:13px;color:var(--ep-dim)}
@E .epic-recent,@E .epic-dl{display:flex;align-items:center;gap:9px;height:34px;padding:0 12px;border:0;border-radius:9px;background:transparent;
  color:#d0d0d7;font:600 13px/1 var(--font);cursor:pointer}
@E .epic-recent{grid-column:1;justify-self:start}
@E .epic-recent:hover,@E.epic-recent-open .epic-recent{background:var(--ep-hover);color:#fff}
@E .epic-dl{grid-column:2;color:var(--ep-dim)}
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
@E .tb-avatar{width:34px;height:34px;border:0;background:linear-gradient(135deg,#26bbff,#5aa9ff)}
@E .tb-more.open{background:var(--ep-active);border:0;color:#fff}

/* ── store page ── */
@E .page{padding:4px 28px 40px}
@E .hero{height:clamp(300px,46vh,460px);border-radius:18px;box-shadow:none;margin-bottom:30px}
@E .hero-ctrl{background:rgba(20,20,22,.7);border:0}
@E .sec-head{display:flex;align-items:center;margin-bottom:22px;gap:14px}
@E .sec-title,@E .sec-count,@E .sec-spacer{display:none}
@E .sec-tools{display:flex;align-items:center;flex:1;gap:10px;min-width:0}
@E .sec-filter{order:-1;margin-right:auto}
@E .epic-col-tab{cursor:pointer}
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
@E .card-badge.owned{background:rgba(38,187,255,.9);color:#06131b}
@E .card-wish,@E .card-sublen{border:0;background:rgba(14,14,16,.78)}
@E .grid .card .card-body{padding:10px 2px 0}
@E .grid .card .card-title{font-size:14px;font-weight:600;letter-spacing:0}
@E .grid .card .card-sub{font-size:12px;margin-bottom:8px}
@E .card-price .new{font-size:14px;font-weight:600}
@E .card-cta{height:34px;padding:0 14px;border-radius:8px;background:#fff!important;color:#111!important;box-shadow:none!important;font-weight:700}
@E .card-cta svg{stroke:currentColor}
@E .card-cta.owned{background:var(--ep-blue)!important;color:#06131b!important}
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
@E .game-pane{display:none!important}
@E #storePage:has(.grid.list) .hero,@E #storePage:has(.grid.list) .fest-strip{display:none}
@E .epic-pane{display:none}
@E .grid-wrap:has(.grid.list){display:grid;grid-template-columns:minmax(260px,36%) minmax(0,1fr);gap:28px;align-items:start}
@E .grid-wrap:has(.grid.list) .epic-pane{display:block;position:sticky;top:0;max-height:calc(100vh - 215px);overflow-y:auto;padding:0 6px 20px 0}
@E .grid.list .card{min-height:46px;padding:4px 10px;border-radius:8px}
@E .grid.list .card.epic-sel{background:var(--ep-active)}
@E .grid.list .card.epic-sel .card-title{color:#fff}
@E .grid.list .card-foot{display:none}
@E .epic-pane .ep-mediawrap{margin-bottom:0}
@E .ep-media{position:relative;aspect-ratio:16/9;border-radius:20px;border:1px solid rgba(255,255,255,.16);background:#111;overflow:hidden}
@E .ep-stage{position:absolute;inset:0;background:#111 center/cover no-repeat;cursor:pointer}
@E .ep-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
@E .ep-play{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:76px;height:76px;border:0;border-radius:50%;
  background:rgba(60,60,66,.78);color:#fff;place-items:center;cursor:pointer;transition:background .15s,transform .15s}
@E .ep-media.is-video.paused .ep-play{display:grid}
@E .ep-play:hover{background:rgba(90,90,98,.85);transform:translate(-50%,-50%) scale(1.06)}
@E .ep-play svg{width:28px;height:28px;fill:currentColor;stroke:none;margin-left:3px}
@E .ep-count{position:absolute;left:14px;bottom:14px;z-index:2;height:34px;padding:0 12px;border:0;border-radius:8px;background:rgba(38,38,42,.9);color:#fff;
  display:flex;align-items:center;gap:8px;font:600 13px/1 var(--font);cursor:pointer}
@E .ep-count svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
@E .ep-mute{position:absolute;right:14px;bottom:14px;z-index:2;width:36px;height:34px;border:0;border-radius:8px;background:rgba(38,38,42,.9);color:#fff;
  display:grid;place-items:center;cursor:pointer}
@E .ep-mute[hidden],@E .ep-prog[hidden]{display:none}
@E .ep-mute svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
@E .ep-prog{position:absolute;left:0;right:0;bottom:0;z-index:2;height:3px;background:rgba(255,255,255,.2)}
@E .ep-prog i{display:block;height:100%;width:0;background:#fff}
@E .detail-scroll>.detail-ann{margin:0;padding:16px 20px 0}
@E .ep-actions{display:flex;align-items:center;gap:10px;margin:18px 0 28px}
@E .ep-main{flex:0 1 330px;height:46px;border:0;border-radius:10px;background:var(--ep-blue);color:#06131b;font:700 15px/1 var(--font);
  display:inline-flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;transition:background .15s}
@E .ep-main svg{width:15px;height:15px;fill:currentColor;stroke:none}
@E .ep-main:hover:not(:disabled){background:var(--ep-blue-hi)}
@E .ep-main:disabled{opacity:.6;cursor:default}
@E .ep-main.buy{background:#fff;color:#111}
@E .ep-ico{width:46px;height:46px;flex-shrink:0;border:0;border-radius:10px;background:#26262b;color:#fff;display:grid;place-items:center;cursor:pointer}
@E .ep-ico:hover{background:#33333a}
@E .ep-ico svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@E .ep-ico[data-pa="more"] svg{fill:currentColor;stroke:none}
@E .ep-ico.on{color:#ff7d99}
@E .ep-ico.on svg{fill:currentColor}
@E .ep-stats{display:flex;margin-left:auto}
@E .ep-stat{padding:2px 20px;border-left:1px solid rgba(255,255,255,.14)}
@E .ep-stat:first-child{border-left:0}
@E .ep-stat span{display:block;margin-bottom:4px;font-size:13px;color:var(--ep-dim);white-space:nowrap}
@E .ep-stat b{font-size:20px;font-weight:700;color:#fff}
@E .ep-cols{display:grid;grid-template-columns:1fr 1fr;gap:26px}
@E .ep-cols h3{margin:0 0 14px;font-size:18px;font-weight:700;color:#fff}
@E .ep-card{padding:6px 18px;border-radius:14px;background:#17171a}
@E .ep-row{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.07)}
@E .ep-row:last-child{border-bottom:0}
@E .ep-row .ic{flex:0 0 46px;height:46px;border-radius:50%;background:#26262b;display:grid;place-items:center;color:#fff}
@E .ep-row .ic svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
@E .ep-row b{font-size:15px;color:#fff}
@E .ep-row .sub{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:13px;color:var(--ep-dim)}
@E .ep-row .sub svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2}
@E .ep-kv{display:flex;gap:18px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:14px}
@E .ep-kv:last-child{border-bottom:0}
@E .ep-kv span{flex:0 0 92px;color:var(--ep-dim)}
@E .ep-kv b{font-weight:500;color:#fff;min-width:0;overflow-wrap:anywhere}

/* ── Downloads page ── */
@E .epic-dlp{padding-top:4px}
@E .dlp-head{display:flex;align-items:center;justify-content:space-between;margin:4px 0 22px}
@E .dlp-head h1{font-size:26px;font-weight:700;letter-spacing:-.3px;color:#fff}
@E .dlp-icon{width:38px;height:38px;border:0;border-radius:10px;background:transparent;color:#d5d5db;display:grid;place-items:center;cursor:pointer}
@E .dlp-icon:hover{background:var(--ep-hover);color:#fff}
@E .dlp-icon svg,@E .dlp-sq svg,@E .dlp-empty>svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@E .dlp-cols{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:start}
@media (max-width:980px){@E .dlp-cols{grid-template-columns:1fr}}
@E .dlp-card,@E .dlp-row{display:flex;align-items:center;gap:16px;padding:14px 16px}
@E .dlp-card{min-height:104px;border-radius:10px;border:1px solid var(--ep-line);background:linear-gradient(90deg,#28211f,#1b1b1e 45%)}
@E .dlp-art{flex:0 0 100px;height:76px;border-radius:8px;background:#222 center/cover no-repeat}
@E .dlp-body,@E .dlp-rt{flex:1;min-width:0}
@E .dlp-title{font-size:15px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@E .dlp-bar{height:5px;margin:10px 0 8px;border-radius:5px;background:#3a3a40;overflow:hidden}
@E .dlp-bar i{display:block;height:100%;width:0;border-radius:5px;background:linear-gradient(90deg,#ff8a5b,#f0553d);transition:width .5s linear}
@E .dlp-stat{font-size:13px;color:#d6d6dc}
@E .dlp-stat2,@E .dlp-sub{font-size:12.5px;color:var(--ep-dim);margin-top:3px}
@E .dlp-btns{display:flex;align-items:center;gap:8px;flex-shrink:0}
@E .dlp-sq{width:36px;height:36px;border:1px solid #3a3a41;border-radius:8px;background:transparent;color:#e6e6ea;display:grid;place-items:center;cursor:pointer}
@E .dlp-sq:hover{background:var(--ep-hover)}
@E .dlp-btn{height:36px;padding:0 16px;border:0;border-radius:8px;background:#2b2b31;color:#fff;font:600 13px/1 var(--font);cursor:pointer;display:inline-flex;align-items:center;gap:8px}
@E .dlp-btn svg{width:13px;height:13px;fill:currentColor;stroke:none}
@E .dlp-btn:hover:not(:disabled){background:#3a3a41}
@E .dlp-btn:disabled{opacity:.4;cursor:not-allowed}
@E .dlp-row{border-top:1px solid var(--ep-line)}
@E .dlp-ico{flex:0 0 52px;height:52px;border-radius:8px;background:#222 center/cover no-repeat}
@E .dlp-h{display:flex;align-items:center;justify-content:space-between;margin:26px 0 8px;font-size:15px;font-weight:700;color:#fff}
@E .dlp-link{border:0;background:none;color:var(--ep-dim);font:600 13px/1 var(--font);cursor:pointer}
@E .dlp-link:hover{color:#fff}
@E .dlp-chip{display:inline-flex;align-items:center;gap:6px}
@E .dlp-chip::before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor}
@E .dlp-chip.ok{color:#34d399}
@E .dlp-chip.err{color:#f87171}
@E .dlp-chip.mut{color:#9a9aa5}
@E .dlp-empty{display:flex;align-items:center;gap:16px;padding:22px 20px;border-radius:10px;background:#18181b;border:1px dashed var(--ep-line-2);color:var(--ep-dim)}
@E .dlp-empty>svg{width:34px;height:34px;stroke-width:1.5}
@E .dlp-empty b{color:#fff;font-size:15px}
@E .dlp-panel{margin-bottom:14px;background:#1a1a1d;border:1px solid var(--ep-line);border-radius:10px;overflow:hidden;padding-bottom:6px}
@E .dlp-ph{padding:12px 16px;font-size:13px;color:var(--ep-dim);border-bottom:1px solid var(--ep-line)}
@E .dlp-gl{display:flex;justify-content:space-between;padding:12px 16px 4px;font-size:13px;color:#fff}
@E .dlp-gl span{color:var(--ep-dim)}
@E .dlp-graph svg{display:block;width:100%;height:46px}
@E .dlp-graph .g1 .fill{fill:rgba(99,102,241,.3)}
@E .dlp-graph .g1 .line{fill:none;stroke:#7c83ff;stroke-width:1.5}
@E .dlp-graph .g2 .fill{fill:rgba(236,72,153,.24)}
@E .dlp-graph .g2 .line{fill:none;stroke:#ec4899;stroke-width:1.5}
@E .dlp-stat-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:13px;color:#cfcfd6}
@E .dlp-stat-row b{color:#fff}
@E .epic-dl{cursor:pointer}
@E .epic-dl:hover{background:var(--ep-hover);color:#fff}
@E .sb-foot .sb-task{cursor:pointer}

/* ───────── game detail page (Epic style) ───────── */
@E .btn{border-radius:10px;box-shadow:none;transition:background .15s,filter .15s}
@E .btn-primary{background:var(--ep-blue);color:#06131b;box-shadow:none}
@E .btn-primary::before{display:none}
@E .btn-primary:hover:not(:disabled){background:var(--ep-blue-hi);transform:none;box-shadow:none}
@E .btn-primary[onclick^="renewGame"]{background:#fff;color:#111}
@E .btn-primary[onclick^="renewGame"]:hover:not(:disabled){background:#e4e4e8}
@E .btn-secondary,@E .btn-ghost{background:#26262b;border:0;color:#fff;backdrop-filter:none;-webkit-backdrop-filter:none}
@E .btn-secondary:hover:not(:disabled),@E .btn-ghost:hover:not(:disabled){background:#33333a;transform:none}
@E .btn-secondary.wished{background:#3a1d28;color:#ff7d99;animation:none}
@E .btn:disabled{opacity:.45}

/* detail = popup in the middle of the window, library stays visible behind it */
@E .detail{inset:0;z-index:300;padding:28px;background:rgba(6,6,8,.62);border:0;border-radius:0;overflow:hidden;
  backdrop-filter:none;-webkit-backdrop-filter:none;animation:none}
@E .detail.open{flex-direction:row;align-items:center;justify-content:center}
@E .detail-top{display:none}
@E .detail-scroll{flex:0 1 auto;width:min(860px,100%);max-height:100%;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  align-content:start;padding:0 0 26px;overflow-y:auto;background:#1b1b1f;border:1px solid var(--ep-line);border-radius:16px;
  box-shadow:0 30px 90px rgba(0,0,0,.7);animation:epicPop .2s cubic-bezier(.2,.9,.3,1)}
@keyframes epicPop{from{opacity:0;transform:translateY(12px) scale(.98)}}
@E .detail-scroll>*{grid-column:1/-1;min-width:0}
@E .detail-scroll>.section{margin:0 28px 24px}
@E .detail-scroll>#subSection,@E .detail-scroll>#injectSection{grid-column:1;margin-right:12px}
@E .detail-scroll>.section:not([id]){grid-column:2;grid-row:2/span 2;margin-left:12px}
@E .detail-scroll:not(:has(#subSection:not([hidden]),#injectSection:not([hidden])))>.section:not([id]){grid-column:1/-1;grid-row:auto;margin-left:28px}

@E .detail-hero{position:relative;display:block;height:auto;margin:0 0 22px;border-radius:0;overflow:visible;box-shadow:none;animation:none}
@E .detail-hero::after{display:none}
@E .detail-slides{position:relative;inset:auto;aspect-ratio:16/9;border-radius:16px 16px 0 0;overflow:hidden;background:#111}
@E .detail-slides::after{content:'';position:absolute;inset:auto 0 0 0;height:90px;z-index:1;pointer-events:none;background:linear-gradient(transparent,rgba(0,0,0,.45))}
@E .detail-hero-body{position:static;height:82px;box-sizing:border-box;padding:0 28px;display:flex;flex-direction:row-reverse;align-items:center;justify-content:space-between;gap:20px;pointer-events:auto}
@E .detail-hero-info{max-width:40%;text-align:right}
@E .detail-hero-title{font-size:17px;font-weight:700;letter-spacing:-.2px;line-height:1.2;text-shadow:none;margin:0 0 4px;white-space:nowrap}
@E .detail-hero-meta{justify-content:flex-end;flex-wrap:wrap;gap:8px;color:var(--ep-dim);font-size:12.5px}
@E .detail-hero-meta .sep{background:rgba(255,255,255,.25)}
@E .detail-nav{display:none}
@E .detail-ctrl{top:calc(50% - 41px);background:rgba(20,20,22,.72);border:0}
@E .detail-vui{top:16px;left:22px;right:70px}
@E .detail-vui-fill,@E .detail-vol-fill{background:#fff;box-shadow:none}
@E .detail-back.epic-x{position:absolute;top:14px;right:14px;z-index:6;width:40px;height:40px;border:0;border-radius:50%;
  background:rgba(20,20,24,.78);color:#fff;display:grid;place-items:center;transform:none}
@E .detail-back.epic-x:hover{background:rgba(50,50,56,.92)}
@E .detail-back.epic-x svg{width:18px;height:18px}
@E .epic-count{position:absolute;left:16px;bottom:calc(82px + 16px);z-index:4;height:34px;padding:0 12px;border:0;border-radius:8px;
  background:rgba(30,30,34,.88);color:#fff;display:flex;align-items:center;gap:8px;font:600 13px/1 var(--font);cursor:pointer}
@E .epic-count[hidden]{display:none}
@E .epic-count svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
@E .detail-hero-btns{gap:10px;align-items:center;flex:0 0 auto}
@E .detail-hero-btns .btn{height:46px;padding:0 20px;font-size:14px;font-weight:700}
@E .detail-hero-btns .btn-primary{order:-1;min-width:230px}
@E #detailWish,@E .epic-addcol,@E .epic-more{width:46px;padding:0;order:0}
@E #detailWish span{display:none}
@E .detail-hero-btns .btn-secondary:not(#detailWish):not(.epic-addcol):not(.epic-more){order:3}
@E .epic-addcol{order:1}
@E .epic-more{order:2}
@E .epic-addcol svg,@E .epic-more svg{width:19px;height:19px;stroke-width:2}
@E .epic-more svg{fill:currentColor;stroke:none}

@E .section{margin-bottom:28px}
@E .section h2{font-size:16px;font-weight:700;letter-spacing:0;margin-bottom:14px}
@E .section h2::before{display:none}
@E .sub-bar,@E .inject-panel,@E .meta-grid,@E .rev-card{background:#17171a;border:1px solid var(--ep-line);border-radius:14px;
  backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none}
@E .sub-bar,@E .inject-panel{flex-wrap:wrap;gap:16px;padding:16px 18px}
@E .sub-icon{width:44px;height:44px;border-radius:50%;background:#26262b;box-shadow:none;color:#fff}
@E .sub-label{letter-spacing:.4px}
@E .sub-time{font-size:20px;font-weight:700}
@E .inject-panel.active{border-color:var(--ep-blue);box-shadow:none}
@E .inject-thumb{width:112px;height:64px;border-radius:8px}
@E .inject-title{font-size:15px;font-weight:700}
@E .progress{height:5px;background:#3a3a40}
@E .progress-fill{background:linear-gradient(90deg,#ff8a5b,#f0553d);box-shadow:none}
@E .progress-fill::after{display:none}
@E .meta-grid{grid-template-columns:1fr}
@E .meta-row{padding:14px 20px;border-right:0!important;border-bottom:1px solid var(--ep-line)!important}
@E .meta-row:last-child{border-bottom:0!important}
@E .meta-k{color:var(--ep-dim)}
@E .rev-list{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
@E .rev-stars-line{color:#e8e8ec}

/* ───────── profile page (Epic account-settings style) ───────── */
@E .profile-wrap{max-width:880px;margin:0 auto;padding:6px 0 24px}
@E .profile-hero{height:120px;border-radius:18px;margin-bottom:-52px;box-shadow:none;background:linear-gradient(120deg,#16283f,#141416 70%)}
@E .profile-hero::before{opacity:.25}
@E .profile-header{padding:0 28px;margin-bottom:28px;gap:20px}
@E .profile-avatar{width:104px;height:104px;border:4px solid var(--ep-panel);font-size:34px;font-weight:700}
@E .profile-name{font-size:26px;font-weight:700;letter-spacing:-.4px}
@E .profile-badge{border-radius:6px;background:#2d2d33;color:#fff;font-size:10.5px}
@E .profile-badge.pro{background:var(--ep-blue);color:#06131b}
@E .profile-group.admin{background:#c42b1c;border-radius:6px}
@E .profile-logout{width:40px;height:40px;border:0;border-radius:10px;background:#26262b;color:#e6e6ea;display:grid;place-items:center;
  backdrop-filter:none;box-shadow:none}
@E .profile-logout:hover{background:#c42b1c;color:#fff;transform:none}
@E .card-panel{background:#17171a;border:1px solid var(--ep-line);border-radius:14px;padding:20px 24px;margin-bottom:14px;
  backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none}
@E .card-panel:has(#profileRailOpts){display:none}   /* the rail position choice makes no sense with the top-tab layout */
@E .panel-head{padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid var(--ep-line)}
@E .panel-ico{border-radius:50%;background:#26262b;color:#fff}
@E .panel-title{font-size:15px;font-weight:700}
@E .field-label{letter-spacing:.3px}
@E .layout-opt,@E .bg-tile,@E .cols-chip,@E .lang-option,@E .dpi-preset{background:#202024;border:1px solid transparent;border-radius:10px;box-shadow:none}
@E .layout-opt:hover,@E .bg-tile:hover,@E .cols-chip:hover,@E .lang-option:hover,@E .dpi-preset:hover{background:#2a2a30;transform:none}
@E .layout-opt.active,@E .bg-tile.active,@E .cols-chip.active,@E .lang-option.active,@E .dpi-preset.active{
  border-color:var(--ep-blue);background:rgba(38,187,255,.14);color:#fff;box-shadow:none}
@E .layout-opt.active .layout-prev i{background:var(--ep-blue-hi)}
@E .avatar-option{border-width:3px}
@E .avatar-option.active{border-color:var(--ep-blue);box-shadow:none}
@E .dpi-slider{background:#3a3a40}
@E .dpi-slider::-webkit-slider-thumb{background:#fff;box-shadow:none}
@E .dpi-value{color:#fff}
@E .bg-switch span{background:#3a3a40;border-color:transparent}
@E .card-panel .btn-secondary{background:#26262b;border:0;border-radius:10px}

/* ── Collections page ── */
@E .epic-colp{padding-top:2px}
@E .col-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:2px 0 22px}
@E .col-tabs{display:flex;gap:24px}
@E .col-tabs button{padding:8px 2px;border:0;border-bottom:3px solid transparent;background:none;color:var(--ep-dim);font:600 14px/1.2 var(--font);cursor:pointer}
@E .col-tabs button:hover{color:#fff}
@E .col-tabs button.on{color:#fff;border-bottom-color:#fff}
@E .col-search,@E .pk-search{display:flex;align-items:center;gap:10px;height:40px;padding:0 16px;border-radius:999px;background:var(--ep-panel-2);color:var(--ep-dim)}
@E .col-search{width:min(320px,40%)}
@E .col-search svg,@E .pk-search svg{width:17px;height:17px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
@E .col-search input,@E .pk-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;font:14px var(--font)}
@E .col-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:18px}
@E .col-new{min-height:238px;border:2px dashed rgba(255,255,255,.16);border-radius:14px;background:transparent;color:#fff;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font:600 15px var(--font);cursor:pointer}
@E .col-new:hover{background:rgba(255,255,255,.04)}
@E .col-new .plus{width:42px;height:42px;border-radius:50%;background:#2b2b31;display:grid;place-items:center}
@E .col-new .plus svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
@E .col-card{padding:18px 18px 16px;border-radius:14px;background:#17171a;border:1px solid var(--ep-line);cursor:pointer;transition:background .15s}
@E .col-card:hover{background:#1d1d21}
@E .col-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px}
@E .col-name{display:block;font-size:15px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px}
@E .col-count{margin-top:4px;font-size:13px;color:var(--ep-dim)}
@E .col-more{width:34px;height:34px;flex-shrink:0;border:0;border-radius:8px;background:transparent;color:#d8d8de;display:grid;place-items:center;cursor:pointer}
@E .col-more:hover{background:var(--ep-hover);color:#fff}
@E .col-more svg{width:18px;height:18px;fill:currentColor}
@E .col-thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
@E .col-thumbs i{display:block;aspect-ratio:3/4;border-radius:6px;background:#24242a center/cover no-repeat}
@E .col-thumbs i.empty{background:#202024}
@E .cv-head{display:flex;align-items:center;gap:16px;margin-bottom:22px}
@E .cv-title{flex:1;min-width:0}
@E .cv-title b{font-size:22px;font-weight:700;color:#fff}
@E .cv-btns{display:flex;align-items:center;gap:8px}
@E .cv-btns .dlp-btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.4}
@E .cv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:22px 16px}
@E .cv-item{cursor:pointer}
@E .cv-poster{position:relative;aspect-ratio:3/4;border-radius:12px;background:#24242a center/cover no-repeat;transition:box-shadow .15s}
@E .cv-item:hover .cv-poster{box-shadow:0 0 0 2px rgba(255,255,255,.3)}
@E .cv-name{margin-top:9px;font-size:13.5px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@E .cv-x{position:absolute;top:8px;right:8px;width:28px;height:28px;border:0;border-radius:50%;background:rgba(14,14,16,.82);color:#fff;
  display:none;place-items:center;cursor:pointer}
@E .cv-x svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
@E .cv-item:hover .cv-x{display:grid}

/* modal + popup menu (appended to <body>) */
@E .epic-modal{position:fixed;inset:0;z-index:2147482000;background:rgba(6,6,8,.62);display:grid;place-items:center}
@E .epic-modal-card{width:min(520px,calc(100% - 48px));max-height:80vh;display:flex;flex-direction:column;background:#1c1c20;color:#f2f2f5;
  border:1px solid var(--ep-line-2);border-radius:16px;box-shadow:0 30px 90px rgba(0,0,0,.7);animation:epicPop .18s ease-out}
@E .pk-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px 12px;font-size:16px}
@E .pk-x{width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:#d8d8de;display:grid;place-items:center;cursor:pointer}
@E .pk-x:hover{background:var(--ep-hover)}
@E .pk-x svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}
@E .pk-search{margin:0 20px 10px}
@E .pk-list{flex:1;min-height:120px;overflow-y:auto;padding:0 12px}
@E .pk-row{display:flex;align-items:center;gap:12px;padding:8px;border-radius:10px;cursor:pointer;font-size:14px}
@E .pk-row:hover{background:var(--ep-hover)}
@E .pk-ico{flex:0 0 36px;height:48px;border-radius:6px;background:#24242a center/cover no-repeat}
@E .pk-row span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@E .pk-chk{width:22px;height:22px;border-radius:50%;border:2px solid #4a4a52;display:grid;place-items:center;font-style:normal;font-size:12px;color:#06131b}
@E .pk-row.on .pk-chk{background:var(--ep-blue);border-color:var(--ep-blue)}
@E .pk-none{padding:30px;text-align:center;color:var(--ep-dim)}
@E .pk-foot{display:flex;justify-content:flex-end;padding:14px 20px 18px}
.epic-menu-pop{top:auto;left:auto}
.epic-menu .chk{display:inline-block;width:20px;font-style:normal;color:#5ccaff}
.epic-menu button.danger{color:#ff7a7a}

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
  version: '1.4.0',
  description: 'Re-skins STARLINE like the new Epic Games Launcher: top tab bar, rounded dark panel, poster grid, bottom bar, Downloads page, game detail and profile pages.',
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

    /* 4. back / forward arrows with a small page history (also remembers the Downloads page) */
    let hist = [], idx = -1, navigating = false;
    const pageKey = () => (S.page && S.page.isOpen()) ? 'downloads' : (S.colPage && S.colPage.isOpen()) ? 'collections' : api.getPage();
    const cur = pageKey();
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
    const track = k => {
      if (navigating) { navigating = false; sync(); return; }
      if (!k || hist[idx] === k) return;
      hist = hist.slice(0, idx + 1); hist.push(k); idx = hist.length - 1; sync();
    };
    const go = d => {
      const n = idx + d;
      if (n < 0 || n >= hist.length) return;
      const k = hist[n];
      if (k === 'downloads' || k === 'collections') {
        const open = k === 'downloads' ? S.openDl : S.openCol;
        if (!open) return;
        navigating = true; idx = n; sync();
        api.setTimeout(() => { navigating = false; }, 500);
        open(true);
        return;
      }
      const fn = PAGEFN[k] || ('show' + String(k).charAt(0).toUpperCase() + String(k).slice(1));
      if (typeof window[fn] !== 'function') return;
      navigating = true; idx = n; sync();
      api.setTimeout(() => { navigating = false; }, 500);
      try { window[fn](); } catch (e) { api.warn(e); navigating = false; }
    };
    api.ui.onPage(() => track(pageKey()));
    S.openDl = silent => {
      if (!S.page) return;
      S.page.open();
      document.querySelectorAll('.sb-item.active').forEach(n => n.classList.remove('active'));
      if (!silent) track('downloads');
    };
    S.openCol = silent => {
      if (!S.colPage) return;
      S.colPage.open();
      document.querySelectorAll('.sb-item.active').forEach(n => n.classList.remove('active'));
      if (!silent) track('collections');
    };
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
    const dlBtn = el('button', 'epic-dl', ICON.dl + '<span>' + api.t('downloads') + '</span>');
    dlBtn.type = 'button';
    dlBtn.addEventListener('click', () => S.openDl && S.openDl());
    api.ui.insert('#sbTask', dlBtn, { position: 'after' });
    const taskCard = api.getElement('#sbTask');           /* the running-task card opens the page too */
    if (taskCard) {
      const onTask = () => S.openDl && S.openDl();
      taskCard.addEventListener('click', onTask);
      S.undo.push(() => taskCard.removeEventListener('click', onTask));
    }

    /* 6. close popups on outside click / Esc */
    const onDoc = e => {
      if (S.menu && !S.menu.contains(e.target)) closeMenu();
      const zone = document.getElementById('qpZone');
      if (document.documentElement.classList.contains('epic-recent-open') &&
          !(zone && zone.contains(e.target)) && !(S.recentBtn && S.recentBtn.contains(e.target)))
        document.documentElement.classList.remove('epic-recent-open');
    };
    const onKey = e => {
      if (e.key !== 'Escape') return;
      const hadMenu = !!S.menu, hadModal = !!S.modal;
      closeMenu(); closeModal();
      document.documentElement.classList.remove('epic-recent-open');
      const d = document.getElementById('detail');
      if (!hadMenu && !hadModal && d && d.classList.contains('open') && typeof window.closeDetail === 'function') window.closeDetail();
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

    /* 7b. the hero "Launch" button starts the launch directly instead of only scrolling to the Launch panel */
    if (typeof window.jumpToInject === 'function') {
      const orig = window.jumpToInject;
      const wrapped = function () {
        const st = document.getElementById('injectStart'), sec = document.getElementById('injectSection');
        if (st && sec && !sec.hidden && !st.hidden && !st.disabled && typeof window.doInject === 'function') {
          try { window.doInject(); return; } catch (e) { api.warn(e); }
        }
        return orig.apply(this, arguments);
      };
      window.jumpToInject = wrapped;
      S.undo.push(() => { if (window.jumpToInject === wrapped) window.jumpToInject = orig; });
    }

    /* 8. Downloads page + launch/download task tracker */
    const saved = api.getConfig('dlHistory', []);
    T.history = Array.isArray(saved) ? saved.filter(x => x && x.code).slice(0, 40) : [];
    S.page = api.ui.addPage({ id: 'downloads', render: root => renderPage(root), onOpen: () => refresh(true) });
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.addEventListener('message', onHostMsg);
      S.undo.push(() => window.chrome.webview.removeEventListener('message', onHostMsg));
    }
    api.setInterval(tick, 500);

    /* a failing step must not take the other features down with it */
    const guard = (name, fn) => { try { fn(); } catch (e) { api.warn('Epic Launcher Style: "' + name + '" failed -', e && e.message ? e.message : e); } };

    /* 9. close button -> top tab bar, vertically centred with the tabs (host API 2.4 has ui.pin, older hosts only ui.move) */
    guard('close button', () => {
      const place = typeof api.ui.pin === 'function' ? api.ui.pin : api.ui.move;
      place.call(api.ui, '.tb-actions > .tb-btn.close', '.sidebar', { position: 'append' });
    });

    /* 10. Collections: page, "Collections" tab in the library header */
    guard('collections', () => {      loadCols();
      S.colPage = api.ui.addPage({ id: 'collections', render: root => renderColPage(root), onOpen: () => refreshCol(true) });
      if (api.getElement('#secFilter')) {
        const tab = el('button', 'epic-col-tab');
        tab.type = 'button'; tab.textContent = api.t('col.tab');
        tab.addEventListener('click', e => { e.stopPropagation(); S.openCol && S.openCol(); });   /* stop: #secFilter would call setFilter(null) */
        api.ui.insert('#secFilter', tab, { position: 'append' });
      }
    });

    /* 11. game detail = popup: X inside the media, click outside closes, image counter, "add to collection" + "..." buttons */
    guard('game popup', () => {      const det = api.getElement('#detail'), backBtn = api.getElement('.detail-back'), heroEl = api.getElement('.detail-hero');
      if (det && backBtn && heroEl) {
        const origHtml = backBtn.innerHTML;
        api.ui.move('.detail-back', '.detail-hero', { position: 'append' });
        backBtn.classList.add('epic-x');
        backBtn.innerHTML = SV.x;
        const onBackdrop = e => { if (e.target === det && typeof window.closeDetail === 'function') window.closeDetail(); };
        det.addEventListener('click', onBackdrop);
        S.undo.push(() => { det.removeEventListener('click', onBackdrop); backBtn.classList.remove('epic-x'); backBtn.innerHTML = origHtml; });

        const badge = el('button', 'epic-count', SV.imgs + '<span>0</span>');
        badge.type = 'button'; badge.hidden = true;
        badge.addEventListener('click', e => { e.stopPropagation(); if (typeof window.detailNext === 'function') window.detailNext({ stopPropagation() {}, preventDefault() {} }); });
        api.ui.insert('.detail-hero', badge, { position: 'append' });
        const slides = api.getElement('#detailSlides');
        const upd = () => { const n = document.querySelectorAll('#detailSlides .detail-slide').length; badge.hidden = n < 2; badge.querySelector('span').textContent = String(n); };
        if (slides) { const mo = new MutationObserver(upd); mo.observe(slides, { childList: true }); S.undo.push(() => mo.disconnect()); }
        upd();
      }
    });

    /* 11b. extra buttons in the popup */
    guard('popup buttons', () => {      const hb = api.getElement('#detailHeroBtns');
      if (hb) {
        const ensure = () => {          /* renderDetailHeroButtons() rewrites the whole box, so re-add ours every time */
          if (hb.querySelector('.epic-addcol')) return;
          const add = el('button', 'btn btn-secondary epic-addcol', SV.addcol);
          add.type = 'button'; add.title = api.t('col.addTo');
          add.addEventListener('click', e => { e.stopPropagation(); const c = window.CURRENT_GAME; if (c) colPicker(add, c); });
          const more = el('button', 'btn btn-secondary epic-more', SV.dots);
          more.type = 'button'; more.title = api.t('pane.more');
          more.addEventListener('click', e => {
            e.stopPropagation();
            const c = window.CURRENT_GAME; if (!c) return;
            popMenu(more, [
              { label: api.t(isWishedGame(c) ? 'pane.wishRemove' : 'pane.wishAdd'), run: () => { if (typeof window.toggleWish === 'function') window.toggleWish(null, c); } },
              { label: api.t('col.addTo'), run: () => colPicker(more, c) }
            ]);
          });
          hb.appendChild(add); hb.appendChild(more);
        };
        const mo2 = new MutationObserver(ensure); mo2.observe(hb, { childList: true });
        S.undo.push(() => { mo2.disconnect(); hb.querySelectorAll('.epic-addcol,.epic-more').forEach(n => n.remove()); });
        ensure();
      }
    });

    /* 12. list view: click a row to select it, the big pane on the right shows that game */
    guard('list pane', () => {      const grid = api.getElement('#grid');
      if (grid && api.getElement('#gridWrap')) {
        P.node = el('aside', 'epic-pane');
        P.node.addEventListener('click', onPaneClick);
        P.node.addEventListener('dblclick', e => { if (e.target.closest && e.target.closest('.ep-media') && typeof window.openDetail === 'function' && P.sel) window.openDetail(P.sel); });
        api.ui.insert('#gridWrap', P.node, { position: 'append' });
        const onGridClick = e => {
          if (!listMode()) return;
          const card = e.target.closest && e.target.closest('.card[data-game]');
          if (!card || e.target.closest('.card-wish')) return;
          e.stopPropagation(); e.preventDefault();
          P.sel = card.getAttribute('data-game');
          renderEpicPane(true);
        };
        const onGridDbl = e => {
          if (!listMode()) return;
          const card = e.target.closest && e.target.closest('.card[data-game]');
          if (card && typeof window.openDetail === 'function') window.openDetail(card.getAttribute('data-game'));
        };
        grid.addEventListener('click', onGridClick, true);
        grid.addEventListener('dblclick', onGridDbl);
        const mo3 = new MutationObserver(() => { try { renderEpicPane(); } catch (e) {} });
        mo3.observe(grid, { childList: true, attributes: true, attributeFilter: ['class'] });
        S.undo.push(() => { grid.removeEventListener('click', onGridClick, true); grid.removeEventListener('dblclick', onGridDbl); mo3.disconnect(); });
        renderEpicPane(true);
      }
    });
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
    closeModal(); stopPaneVideo();
    document.querySelectorAll('#grid .card.epic-sel').forEach(c => c.classList.remove('epic-sel'));
    S.recentBtn = null; S.brand = null; S.css = null; S.page = null; S.openDl = null; S.colPage = null; S.openCol = null;
    C.root = null; C.view = ''; C.q = ''; C.sig = ''; P.node = null; P.sel = ''; P.sig = ''; P.mediaFor = ''; P.items = [];
    T.active = null; T.queue = []; T.pcts = []; T.rate = []; T.root = null; T.sig = {};
    /* theme, layout, stylesheet, moved nodes and inserted nodes are reverted by the host */
  }
};
return plugin;
