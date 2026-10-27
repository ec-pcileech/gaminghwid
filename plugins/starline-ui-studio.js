/* STARLINE UI Studio library (plugin API 2.3.0)
   Put this file in the "plugins" folder next to the app. It is loaded automatically as a LIBRARY
   (it does not appear in the plugin list) and adds api.ui.layout / rule / pin / hook / card / banner /
   takeover / edit / apply and api.data / api.actions for every plugin. Without this file those APIs
   are simply absent and the app behaves exactly as before. */
/* ═══════════════════════════════════════════════════════════════════════════
   STARLINE UI Studio  (plugin API 2.3.0)
   Extends `api.ui` with everything needed to rebuild the whole interface:
     api.ui.parts / part / rule / layout.* / pin / hook / card / banner / takeover / edit / apply
     api.data.*  (read-only game / user / view state)      permission: data
     api.actions.* (open, buy, wish, filter, nav, …)       permission: data
   New permissions:
     layout  – absolute / grid / flex layout, pin, visual layout editor
     render  – replace card / banner templates, wrap render functions, full takeover
     data    – read game data and trigger app actions
   Every change a plugin makes is undone automatically when it is disabled,
   uninstalled, destroyed, or when api.ui.reset() is called.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';
if(window.SLStudio)return;

/* ───────────── i18n (en zh ru de ja es tr pt) ───────────── */
var TX={
  slEditTitle:['Layout editor','布局编辑器','Редактор макета','Layout-Editor','レイアウトエディター','Editor de diseño','Düzen düzenleyici','Editor de layout'],
  slEditDone:['Done','完成','Готово','Fertig','完了','Hecho','Bitti','Concluir'],
  slEditUndo:['Undo','撤销','Отменить','Rückgängig','元に戻す','Deshacer','Geri al','Desfazer'],
  slEditResetAll:['Reset all','全部重置','Сбросить всё','Alles zurücksetzen','すべてリセット','Restablecer todo','Tümünü sıfırla','Redefinir tudo'],
  slEditData:['Export / Import','导出 / 导入','Экспорт / Импорт','Export / Import','エクスポート / インポート','Exportar / Importar','Dışa / İçe aktar','Exportar / Importar'],
  slEditApply:['Apply','应用','Применить','Anwenden','適用','Aplicar','Uygula','Aplicar'],
  slEditHint:['Click an element to select it. Drag to move, use the handles to resize, arrow keys to nudge.','点击选中元素；拖动移动，拖拽手柄缩放，方向键微调。','Нажмите на элемент, чтобы выбрать. Перетаскивайте для перемещения, маркеры — для размера, стрелки — для сдвига.','Element anklicken zum Auswählen. Ziehen zum Verschieben, Griffe zum Skalieren, Pfeiltasten zum Feinjustieren.','要素をクリックして選択。ドラッグで移動、ハンドルでサイズ変更、矢印キーで微調整。','Haz clic en un elemento para seleccionarlo. Arrastra para mover, usa los tiradores para cambiar el tamaño y las flechas para ajustar.','Seçmek için bir öğeye tıklayın. Taşımak için sürükleyin, yeniden boyutlandırmak için tutamaçları, ince ayar için ok tuşlarını kullanın.','Clique num elemento para selecioná-lo. Arraste para mover, use as alças para redimensionar e as setas para ajustar.'],
  slEditHide:['Hide','隐藏','Скрыть','Ausblenden','非表示','Ocultar','Gizle','Ocultar'],
  slEditParent:['Parent','上一级','Родитель','Übergeordnet','親要素','Elemento padre','Üst öğe','Pai'],
  slEditScopeAll:['All similar','所有同类','Все похожие','Alle ähnlichen','同種すべて','Todos los similares','Tüm benzerler','Todos semelhantes'],
  slEditScopeOne:['Only this','仅此元素','Только этот','Nur dieses','これのみ','Solo este','Yalnızca bu','Somente este'],
  slEditClearEl:['Reset element','重置此元素','Сбросить элемент','Element zurücksetzen','要素をリセット','Restablecer elemento','Öğeyi sıfırla','Redefinir elemento'],
  slTakeBack:['Back to custom UI','返回自定义界面','Назад к своему интерфейсу','Zurück zur eigenen Oberfläche','カスタムUIに戻る','Volver a la interfaz personalizada','Özel arayüze dön','Voltar à interface personalizada']
};
try{if(typeof window.uiAddT==='function')window.uiAddT(TX);}catch(e){}
function T(k,fb){try{var v=typeof window.uiT==='function'?window.uiT(k):k;return(v&&v!==k)?v:(fb||(TX[k]&&TX[k][0])||k);}catch(e){return fb||k;}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fn(name){var f=window[name];return typeof f==='function'?f:null;}
function callG(name){var f=fn(name);if(!f)return undefined;return f.apply(window,[].slice.call(arguments,1));}

/* ───────────── named parts: stable selectors for every region of the app ───────────── */
var PARTS={
  app:'.app',sidebar:'.sidebar',brand:'.sb-brand',nav:'.sb-nav',navItems:'.sb-nav .sb-item',quickplay:'#sbQuick',downloads:'#sbDown',
  task:'#sbTask',sidebarFoot:'.sb-foot',main:'.main',topbar:'.topbar',search:'.topbar-search',searchInput:'#searchInput',
  worldBtn:'#worldMapOpen',actions:'.tb-actions',langBtn:'#tbLang',moreBtn:'#tbMore',inboxBtn:'#tbInbox',annBtn:'#tbAnn',
  faqBtn:'#tbFaq',avatar:'#tbAvatar',closeBtn:'.tb-btn.close',topbarButtons:'.tb-actions .tb-btn',
  store:'#storePage',hero:'#hero',heroCarousel:'#heroCarousel',heroPanel:'#hero .hero-panel',heroPrev:'#hero .hero-ctrl.prev',
  heroNext:'#hero .hero-ctrl.next',heroDots:'#heroNav',heroTitle:'#hero .hero-title',heroButtons:'#hero .hero-actions .btn',
  festStrip:'#festStrip',sectionHead:'.sec-head',sectionTitle:'.sec-title',gameCount:'#gameCount',viewSwitch:'#storeViewSwitch',
  genre:'#genreWrap',genreBtn:'#genreBtn',filter:'#secFilter',gridWrap:'#gridWrap',grid:'#grid',card:'#grid .card',
  cardImage:'#grid .card-img',cardBody:'#grid .card-body',cardTitle:'#grid .card-title',cardPrice:'#grid .card-price',
  cardButton:'#grid .card-cta',cardWish:'#grid .card-wish',cardBadges:'#grid .card-badges',gamePane:'#gamePane',
  profile:'#profilePage',plugins:'#pluginsPage',detail:'#detail',
  buttons:'button,.btn,.tb-btn,.ui-btn,.sb-item,.card-cta,.hero-ctrl',primaryButtons:'.btn-primary'
};
function splitTop(s){var out=[],d=0,cur='';for(var i=0;i<s.length;i++){var c=s.charAt(i);if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;if(c===','&&d===0){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;}
/* "@card:hover" -> "#grid .card:hover"; multi-part bases are wrapped in :is() so descendants/suffixes stay correct */
function resolve(sel){
  if(typeof sel!=='string')return sel;
  return splitTop(sel).map(function(part){
    return part.trim().replace(/(^|[\s>+~(])@([a-zA-Z0-9_-]+)((?:[:.#\[][^\s>+~,]*)?)/g,function(m,pre,name,suffix){
      var base=PARTS[name];if(!base)return m;
      var b=splitTop(base).length>1?':is('+base+')':base;return pre+b+(suffix||'');
    });
  }).join(',');
}
function okSel(s){return typeof s==='string'&&s.length>0&&s.length<=800&&!/[{}<>]/.test(s);}
function validSel(s){if(!okSel(s))return false;try{document.createDocumentFragment().querySelector(s);return true;}catch(e){return false;}}
function q1(s,r){if(s&&s.nodeType===1)return s;s=resolve(s);if(!okSel(s))return null;try{return(r||document).querySelector(s);}catch(e){return null;}}
function qa(s,r){if(s&&s.nodeType===1)return[s];s=resolve(s);if(!okSel(s))return[];try{return[].slice.call((r||document).querySelectorAll(s));}catch(e){return[];}}

/* ───────────── CSS helpers ───────────── */
var UNITLESS=/^(opacity|z-index|flex|flex-grow|flex-shrink|order|font-weight|line-height|scale|aspect-ratio|grid-row|grid-column|zoom|--.*)$/;
function kebab(k){return String(k).replace(/[A-Z]/g,function(m){return'-'+m.toLowerCase();});}
function clean(s){return String(s).replace(/[{}<>]/g,'').slice(0,4000);}
function decl(styles,imp){
  if(typeof styles==='string')return clean(styles);
  var out=[];
  Object.keys(styles||{}).forEach(function(k){
    var v=styles[k];if(v==null||v===false||v==='')return;
    var p=kebab(k);if(!/^-{0,2}[a-z][a-z0-9-]*$/.test(p))return;
    if(typeof v==='number'&&!UNITLESS.test(p))v=v+'px';
    v=clean(String(v));if(!v)return;
    out.push(p+':'+v+(imp&&!/!important/i.test(v)?' !important':'')+';');
  });
  return out.join('');
}
function len(v){return typeof v==='number'?v+'px':String(v);}
function makeSheet(host){
  var st=document.createElement('style');st.setAttribute('data-plugin-style',host.rec.id);st.setAttribute('data-plugin-ui','studio');
  (document.body||document.documentElement).appendChild(st);host.trackedNode(st);
  var items=[],seq=0;
  function flush(){st.textContent=items.map(function(i){return i.css;}).join('\n');}
  host.cu(function(){host.removeNode(st);});
  return{
    add:function(css){var it={css:String(css||''),id:++seq};items.push(it);flush();
      return{update:function(c){it.css=String(c||'');flush();},remove:function(){var i=items.indexOf(it);if(i>=0){items.splice(i,1);flush();}}};},
    raise:function(){(document.body||document.documentElement).appendChild(st);}
  };
}

/* ───────────── shared hook table (wrap any global render function, safely and reversibly) ───────────── */
var HOOKABLE=/^(render|show|hero|pane|gpop|open|close|toggle|set|apply|update|build|ui|faq|sk|wish|detail|renew|search|filter|genre|quick)[A-Za-z0-9_$]*$/;
var HK={};
function hkCall(e,self,args){
  var hs=e.list.slice();
  hs.forEach(function(h){if(h.before){try{h.before(args);}catch(x){h.err(x);}}});
  var call=function(a){return e.orig.apply(self,a);};
  hs.forEach(function(h){
    if(!h.around)return;
    var prev=call;
    call=function(a){
      var called=false;
      var next=function(a2){called=true;return prev(a2||a);};
      try{return h.around(next,a);}catch(x){h.err(x);if(called)return undefined;return prev(a);}
    };
  });
  var res=call(args);
  hs.forEach(function(h){if(h.after){try{h.after(res,args);}catch(x){h.err(x);}}});
  return res;
}
function hkAdd(name,spec,onError){
  name=String(name||'');
  if(!HOOKABLE.test(name)||typeof window[name]!=='function')throw new Error('Cannot hook "'+name+'"');
  var e=HK[name];
  if(!e){
    e=HK[name]={orig:window[name],list:[],wrapper:null};
    e.wrapper=function(){return hkCall(e,this,arguments);};
    window[name]=e.wrapper;
  }
  var h={before:spec.before,around:spec.around,after:spec.after,err:onError||function(){}};
  e.list.push(h);
  var gone=false;
  return function(){
    if(gone)return;gone=true;
    var i=e.list.indexOf(h);if(i>=0)e.list.splice(i,1);
    if(!e.list.length&&window[name]===e.wrapper){window[name]=e.orig;delete HK[name];}
  };
}

/* ───────────── data model ───────────── */
function ids(){return(window.ORDER&&window.ORDER.slice)?window.ORDER.slice():Object.keys(window.GAMES||{});}
function G(id){
  var m=window.GAMES&&window.GAMES[id];if(!m)return null;
  var o={id:id,title:m.title||m.short||id,short:m.short||'',developer:m.dev||'',genres:(m.gen||[]).slice(),image:m.img||'',poster:m.poster||m.img||'',raw:m};
  var f;
  try{o.owned=!!(f=fn('hasLic'))&&!!f(id);}catch(e){o.owned=false;}
  try{o.wished=!!(f=fn('isWished'))&&!!f(id);}catch(e){o.wished=false;}
  o.license=null;
  try{if(o.owned&&(f=fn('licOf'))){var l=f(id);if(l){var sec=Number(l.seconds);o.license={seconds:sec,paused:!!l.paused,text:fn('fmtDuration')?window.fmtDuration(sec):String(sec),expiring:sec>=0&&sec<3*86400,expired:sec===0};}}}catch(e){}
  var pr={free:false,text:'',oldText:'',discount:0,value:null};
  try{pr.free=!!fn('isFreeGame')&&window.isFreeGame(id);pr.text=fn('fmtPrice')?window.fmtPrice(id):'';pr.discount=fn('discOf')?(window.discOf(id)||0):0;pr.oldText=pr.discount&&fn('fmtOldPrice')?window.fmtOldPrice(id):'';pr.value=fn('salePriceOf')?window.salePriceOf(id):null;}catch(e){}
  o.price=pr;
  try{o.statusHtml=fn('gameStatusChip')?window.gameStatusChip(m):'';}catch(e){o.statusHtml='';}
  return o;
}
function viewState(){
  var u=window.USER||{};
  return{view:window.LAYOUT||'grid',filter:window.FILTER||'all',search:window.SEARCH||'',genre:window.GENRE||'',
    theme:document.documentElement.getAttribute('data-theme')||'dark',language:document.documentElement.getAttribute('lang')||'en',
    user:{name:u.name||'',avatar:u.avatar||''}};
}

/* ───────────── change notifications (games / banner / wish / quickplay) ───────────── */
var SUBS=[],subOff=[];
function notify(kind){SUBS.slice().forEach(function(s){try{s.cb(kind);}catch(e){try{console.error('[studio]',e);}catch(x){}}});}
function subsStart(){
  if(subOff.length)return;
  [['renderGrid','games'],['renderHero','banner'],['toggleWish','wish'],['renderQuickplay','quickplay'],['renderDownloads','downloads']].forEach(function(p){
    try{subOff.push(hkAdd(p[0],{after:function(){notify(p[1]);}}));}catch(e){}
  });
}
function subsStop(){while(subOff.length){try{subOff.pop()();}catch(e){}}}

/* ───────────── actions (used by api.actions and by data-sl-action="name:arg" attributes) ───────────── */
var PERMS={};   /* pluginId -> hasPermission(name) */
var TAKEOVERS=[];
function activeTakeover(){return TAKEOVERS.length?TAKEOVERS[TAKEOVERS.length-1]:null;}
function clickSel(sel){var b=document.querySelector(sel);if(b)b.click();return !!b;}
function run(name,arg,ev){
  name=String(name||'');arg=arg==null?'':String(arg);
  var tk=activeTakeover(),pause=false;
  switch(name){
    case'open':callG('openDetail',arg);pause=true;break;
    case'buy':if(fn('renewGame'))callG('renewGame',null,arg);else callG('openDetail',arg);pause=true;break;
    case'launch':
      if(fn('hasLic')&&window.hasLic(arg)){callG('openDetail',arg);setTimeout(function(){callG('jumpToInject');},300);}
      else if(fn('renewGame'))callG('renewGame',null,arg);
      pause=true;break;
    case'wish':callG('toggleWish',ev||{stopPropagation:function(){}},arg);break;
    case'view':callG('setLayout',arg==='list'?'list':'grid');break;
    case'filter':clickSel('#secFilter [data-filter="'+arg.replace(/[^a-z]/g,'')+'"]');break;
    case'search':{var inp=document.getElementById('searchInput');if(inp){inp.value=arg;inp.dispatchEvent(new Event('input',{bubbles:true}));}break;}
    case'genre':window.GENRE=arg;callG('renderGenreBtn');callG('renderGrid');break;
    case'hero':if(arg==='next')callG('heroNext');else if(arg==='prev')callG('heroPrev');else callG('heroGo',parseInt(arg,10)||0);break;
    case'nav':
      switch(arg){
        case'home':if(tk)tk.resume();break;
        case'store':callG('showStore');pause=true;break;
        case'profile':callG('showProfile');pause=true;break;
        case'plugins':callG('showPlugins');pause=true;break;
        case'settings':callG('uiOpenSettings');break;
        case'inbox':callG('openInbox');break;
        case'faq':callG('faqOpen');break;
        case'announcements':callG('toggleAnn',ev||{stopPropagation:function(){}});break;
        case'theme':callG('uiToggleTheme');break;
        case'world':clickSel('#worldMapOpen');break;
        case'language':clickSel('#tbLang');break;
        case'close':callG('uiRequestClose');break;
      }
      break;
    case'close':callG('uiRequestClose');break;
    default:return false;
  }
  if(pause&&tk&&tk.autoPause)tk.pause(true);
  return true;
}
/* Delegated handlers: only elements that live inside a plugin-owned container whose plugin holds `data` may trigger actions */
document.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('[data-sl-action]'):null;if(!t)return;
  var own=t.closest('[data-sl-owner],[data-plugin-ui-node]'),pid=own&&(own.getAttribute('data-sl-owner')||own.getAttribute('data-plugin-ui-node'));
  var chk=pid&&PERMS[pid];if(!chk||!chk('data'))return;
  if(!t.hasAttribute('data-sl-pass'))ev.stopPropagation();
  ev.preventDefault();
  var a=String(t.getAttribute('data-sl-action')),i=a.indexOf(':');
  run(i<0?a:a.slice(0,i),i<0?'':a.slice(i+1),ev);
},true);
document.addEventListener('mousedown',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('[data-sl-drag]'):null;if(!t||ev.button!==0)return;
  if(!t.closest('[data-sl-owner],[data-plugin-ui-node]'))return;
  if(ev.target.closest('button,a,input,select,textarea,[data-nodrag]'))return;
  if(fn('uiDrag'))window.uiDrag(ev);
},true);

/* ───────────── per-plugin attachment ───────────── */
function attach(api,host){
  var ui=api.ui,need=host.need,err=host.err,safe=host.safeCall,cu=host.cu,rec=host.rec;
  PERMS[rec.id]=function(n){return api.hasPermission(n);};
  cu(function(){delete PERMS[rec.id];});
  var sheet=makeSheet(host),log=[];
  function perr(e){try{api.error(e);}catch(x){}}

  /* ── generic "managed rule": one handle, update(), remove(), JSON export ── */
  function mk(kind,sel,opts,build,norm){
    var cur=opts,h=sheet.add(build(sel,cur)),entry={fn:kind,args:[sel,opts]},done=false;
    log.push(entry);
    var handle={
      update:function(next){if(done)return false;cur=norm?norm(next,cur):next;entry.args[1]=cur;h.update(build(sel,cur));return true;},
      remove:function(){if(done)return true;done=true;h.remove();var i=log.indexOf(entry);if(i>=0)log.splice(i,1);return true;}
    };
    cu(handle.remove);return handle;
  }
  function checkSel(sel){var s=resolve(sel);if(!validSel(s))throw err('BadSelector','Invalid selector: '+String(sel).slice(0,80));return s;}

  /* ── builders ── */
  function bRule(sel,c){
    var s=checkSel(sel),css=s+'{'+decl(c.s,(c.o||{}).important!==false)+'}';
    if(c.o&&c.o.media)css='@media '+clean(c.o.media)+'{'+css+'}';return css;
  }
  function bFree(sel,o){
    o=o||{};var s=checkSel(sel),d={position:o.fixed?'fixed':(o.position||'absolute')};
    var map={x:'left',left:'left',y:'top',top:'top',right:'right',bottom:'bottom',w:'width',width:'width',h:'height',height:'height',
      minW:'min-width',minH:'min-height',maxW:'max-width',maxH:'max-height',z:'z-index',rotate:'rotate',scale:'scale',origin:'transform-origin',opacity:'opacity',margin:'margin'};
    Object.keys(map).forEach(function(k){if(o[k]!=null)d[map[k]]=(k==='z'||k==='opacity'||k==='rotate'||k==='scale'||k==='origin')?o[k]:len(o[k]);});
    if(o.center){
      var cx=o.center==='x'||o.center==='both',cy=o.center==='y'||o.center==='both';
      if(cx)d.left='50%';if(cy)d.top='50%';d.translate=(cx?'-50%':'0')+' '+(cy?'-50%':'0');
    }
    var css=s+'{'+decl(d,o.important!==false)+'}';
    if(o.container){
      var c=q1(o.container);
      if(c&&getComputedStyle(c).position==='static')css+='\n'+resolve(o.container)+'{position:relative !important}';
    }
    return css;
  }
  function bNudge(sel,o){o=o||{};var d={translate:len(o.x||0)+' '+len(o.y||0)};if(o.rotate!=null)d.rotate=o.rotate;if(o.scale!=null)d.scale=o.scale;return checkSel(sel)+'{'+decl(d,true)+'}';}
  function bGrid(sel,o){
    o=o||{};var s=checkSel(sel),d={display:'grid'};
    function tracks(v){return typeof v==='number'?'repeat('+v+',minmax(0,1fr))':Array.isArray(v)?v.map(len).join(' '):String(v);}
    if(o.columns!=null)d['grid-template-columns']=tracks(o.columns);
    if(o.rows!=null)d['grid-template-rows']=tracks(o.rows);
    if(o.areas)d['grid-template-areas']=o.areas.map(function(r){return'"'+String(r).replace(/"/g,'')+'"';}).join(' ');
    if(o.gap!=null)d.gap=len(o.gap);if(o.rowGap!=null)d['row-gap']=len(o.rowGap);if(o.columnGap!=null)d['column-gap']=len(o.columnGap);
    if(o.autoFlow)d['grid-auto-flow']=o.autoFlow;if(o.autoRows)d['grid-auto-rows']=len(o.autoRows);
    if(o.justify)d['justify-content']=o.justify;if(o.align)d['align-items']=o.align;if(o.padding!=null)d.padding=len(o.padding);
    var css=s+'{'+decl(d,o.important!==false)+'}';
    Object.keys(o.place||{}).forEach(function(child){
      var p=o.place[child],cd={};
      if(typeof p==='string')cd['grid-area']=p;else{if(p.area)cd['grid-area']=p.area;if(p.column)cd['grid-column']=p.column;if(p.row)cd['grid-row']=p.row;if(p.justify)cd['justify-self']=p.justify;if(p.align)cd['align-self']=p.align;}
      var cs=resolve(child);if(!validSel(cs))return;
      css+='\n'+s+' > '+cs+','+s+' '+cs+'{'+decl(cd,true)+'}';
    });
    return css;
  }
  function bFlex(sel,o){
    o=o||{};var d={display:'flex'};
    if(o.direction)d['flex-direction']=o.direction;if(o.wrap!=null)d['flex-wrap']=o.wrap===true?'wrap':o.wrap;
    if(o.gap!=null)d.gap=len(o.gap);if(o.justify)d['justify-content']=o.justify;if(o.align)d['align-items']=o.align;if(o.padding!=null)d.padding=len(o.padding);
    return checkSel(sel)+'{'+decl(d,o.important!==false)+'}';
  }
  function bOrder(sel,list){
    var s=checkSel(sel),css='';
    (list||[]).forEach(function(c,i){var cs=resolve(c);if(validSel(cs))css+=s+' > '+cs+'{order:'+i+' !important}\n';});
    return css;
  }

  /* ── api.ui.rule : persistent CSS rule (survives re-renders, unlike setStyle) ── */
  ui.rule=function(selector,styles,opts){need('appearance');return mk('rule',selector,{s:styles,o:opts||{}},bRule,function(next,cur){return{s:next,o:cur.o};});};

  /* ── api.ui.parts / part ── */
  ui.parts=function(){var o={};Object.keys(PARTS).forEach(function(k){o[k]=PARTS[k];});return o;};
  ui.part=function(name){return PARTS[String(name)]||null;};

  /* ── api.ui.layout : free / nudge / grid / flex / order + export / import ── */
  var L=ui.layout={
    free:function(sel,o){need('layout');return mk('free',sel,o||{},bFree);},
    nudge:function(sel,o){need('layout');return mk('nudge',sel,o||{},bNudge);},
    grid:function(sel,o){need('layout');return mk('grid',sel,o||{},bGrid);},
    flex:function(sel,o){need('layout');return mk('flex',sel,o||{},bFlex);},
    order:function(sel,list){need('layout');return mk('order',sel,list||[],bOrder);},
    export:function(){need('layout');return JSON.parse(JSON.stringify({v:1,items:log.map(function(e){return{fn:e.fn,args:e.args};})}));},
    import:function(data){
      need('layout');var d=typeof data==='string'?JSON.parse(data):data;if(!d||!Array.isArray(d.items))return 0;
      var n=0;
      d.items.forEach(function(it){
        try{
          if(it.fn==='rule'){ui.rule(it.args[0],it.args[1].s,it.args[1].o);n++;}
          else if(L[it.fn]&&it.fn!=='export'&&it.fn!=='import'){L[it.fn](it.args[0],it.args[1]);n++;}
        }catch(e){perr(e);}
      });
      return n;
    }
  };

  /* ── api.ui.pin : persistent DOM move (re-applied whenever the UI re-renders) ── */
  ui.pin=function(selector,target,opts){
    need('dom');opts=opts||{};var pos=String(opts.position||'append'),orig=null,mo,busy=false,burst=0,burstT=0,stopped=false;
    function placeOk(el,dest){
      if(pos==='prepend')return el.parentNode===dest&&dest.firstElementChild===el;
      if(pos==='before')return el.nextElementSibling===dest;
      if(pos==='after')return el.previousElementSibling===dest;
      return el.parentNode===dest&&dest.lastElementChild===el;
    }
    function apply(){
      if(busy||stopped)return;var el=q1(selector),dest=q1(target);if(!el||!dest||el===dest||el.contains(dest))return;
      if(!orig)orig={parent:el.parentNode,next:el.nextSibling,el:el};
      if(placeOk(el,dest))return;
      var now=Date.now();if(now-burstT>1000){burstT=now;burst=0;}
      if(++burst>40){stopped=true;api.warn('ui.pin: "'+selector+'" keeps being moved by another script; pin stopped.');return;}
      busy=true;
      if(pos==='prepend')dest.insertBefore(el,dest.firstChild);
      else if(pos==='before'&&dest.parentNode)dest.parentNode.insertBefore(el,dest);
      else if(pos==='after'&&dest.parentNode)dest.parentNode.insertBefore(el,dest.nextSibling);
      else dest.appendChild(el);
      if(mo)mo.takeRecords();busy=false;
    }
    var raf=0;
    mo=new MutationObserver(function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;apply();});});
    mo.observe(document.body,{childList:true,subtree:true});apply();
    var done=false;
    function remove(){
      if(done)return true;done=true;mo.disconnect();
      try{if(orig&&orig.parent)orig.parent.insertBefore(orig.el,orig.next&&orig.next.parentNode===orig.parent?orig.next:null);}catch(e){}
      return true;
    }
    cu(remove);return{remove:remove,apply:apply};
  };

  /* ── api.ui.hook : wrap any global render / show / open function ──
        spec: { before(args), around(next,args), after(result,args) } */
  ui.hook=function(name,spec){
    need('render');spec=spec||{};
    var off=hkAdd(name,spec,perr);cu(off);return{remove:function(){off();return true;}};
  };

  /* ── api.ui.card : replace or decorate every game card (grid AND list mode) ── */
  function cardCtx(id,i,mode){
    return{id:id,index:i,view:mode,esc:esc,t:T,state:viewState(),
      act:function(n,a){return'data-sl-action="'+esc(n+':'+(a==null?id:a))+'"';},
      actions:{open:function(){return run('open',id);},buy:function(){return run('buy',id);},wish:function(e){return run('wish',id,e);},launch:function(){return run('launch',id);}}};
  }
  function put(el,out,keepKids){
    if(out==null||out===false)return;
    if(!keepKids)el.textContent='';
    if(out&&out.nodeType===1)el.appendChild(out);
    else el.insertAdjacentHTML('beforeend',String(out));
  }
  var cardOff=null,cardCfg=null;
  function cardPass(){
    if(!cardCfg)return;var grid=document.getElementById('grid');if(!grid)return;
    var mode=grid.classList.contains('list')?'list':'grid',c=cardCfg;
    if(c.opts.layout&&c.opts.layout!=='both'&&c.opts.layout!==mode)return;
    [].slice.call(grid.children).forEach(function(el,i){
      if(!el.classList||!el.classList.contains('card')||!el.hasAttribute('data-game'))return;
      var id=el.getAttribute('data-game'),game=G(id);if(!game)return;
      var ctx=cardCtx(id,i,mode);
      try{
        if(c.kind==='decorate'){c.fn(el,game,ctx);return;}
        var out=c.fn(game,ctx,el);if(out==null||out===false)return;
        el.setAttribute('data-sl-owner',rec.id);
        if(c.opts.mode==='outer'){
          var node=out&&out.nodeType===1?out:(function(){var t=document.createElement('template');t.innerHTML=String(out).trim();return t.content.firstElementChild;})();
          if(!node)return;node.setAttribute('data-game',id);node.setAttribute('data-sl-owner',rec.id);
          if(c.opts.clickable!==false&&!node.hasAttribute('data-sl-action'))node.setAttribute('data-sl-action','open:'+id);
          el.replaceWith(node);
        }else put(el,out);
      }catch(e){perr(e);}
    });
  }
  function cardSet(kind,f,opts){
    need('render');if(typeof f!=='function')throw err('BadArgument','card renderer must be a function');
    cardCfg={kind:kind,fn:f,opts:opts||{}};
    if(!cardOff){cu(function(){cardCfg=null;if(fn('renderGrid'))try{window.renderGrid();}catch(e){}});cardOff=ui.hook('renderGrid',{after:cardPass});}
    if(fn('renderGrid'))window.renderGrid();
    return{remove:function(){if(cardOff){cardOff.remove();cardOff=null;cardCfg=null;if(fn('renderGrid'))window.renderGrid();}return true;},refresh:function(){if(fn('renderGrid'))window.renderGrid();}};
  }
  ui.card={
    render:function(f,o){return cardSet('render',f,o);},     /* f(game, ctx, el) -> html string | Element | null (null keeps the built-in card) */
    decorate:function(f,o){return cardSet('decorate',f,o);}, /* f(el, game, ctx): tweak the built-in card in place */
    refresh:function(){if(fn('renderGrid'))window.renderGrid();return true;}
  };

  /* ── api.ui.banner : replace / decorate the featured banner, change its games ── */
  var banOff=null,banCfg=null;
  function banPass(res,args){
    if(!banCfg)return;var el=args[0],id=args[1],game=G(id);if(!el||!game)return;
    var c=banCfg,ctx={id:id,index:window.HERO_POS|0,count:(window.HERO_ORDER||[]).length,esc:esc,t:T,state:viewState(),
      act:function(n,a){return'data-sl-action="'+esc(n+':'+(a==null?id:a))+'"';},
      actions:{open:function(){return run('open',id);},buy:function(){return run('buy',id);},wish:function(e){return run('wish',id,e);},next:function(){return run('hero','next');},prev:function(){return run('hero','prev');},go:function(i){return run('hero',i);}}};
    try{
      if(c.kind==='decorate'){c.fn(el,game,ctx);return;}
      var out=c.fn(game,ctx,el);if(out==null||out===false)return;
      el.setAttribute('data-sl-owner',rec.id);
      if(c.opts.keepBackground===false)el.textContent='';
      else[].slice.call(el.querySelectorAll(':scope > .hero-overlay,:scope > .hero-body,:scope > .hero-badge')).forEach(function(n){n.remove();});
      put(el,out,true);
    }catch(e){perr(e);}
  }
  function banSet(kind,f,opts){
    need('render');if(typeof f!=='function')throw err('BadArgument','banner renderer must be a function');
    banCfg={kind:kind,fn:f,opts:opts||{}};
    if(!banOff){cu(function(){banCfg=null;if(fn('renderHero'))try{window.renderHero();}catch(e){}});banOff=ui.hook('heroSetPanel',{after:banPass});}
    if(fn('renderHero'))window.renderHero();
    return{remove:function(){if(banOff){banOff.remove();banOff=null;banCfg=null;if(fn('renderHero'))window.renderHero();}return true;},refresh:function(){if(fn('renderHero'))window.renderHero();}};
  }
  var heroSaved=null;
  ui.banner={
    render:function(f,o){return banSet('render',f,o);},     /* f(game, ctx, panelEl) -> html | Element | null */
    decorate:function(f,o){return banSet('decorate',f,o);}, /* f(panelEl, game, ctx) */
    setGames:function(list){                                /* choose which games are featured, in order; null restores */
      need('render');
      if(!heroSaved)heroSaved={order:window.HERO_ORDER,pos:window.HERO_POS};
      window.HERO_ORDER=Array.isArray(list)?list.filter(function(g){return window.GAMES&&window.GAMES[g];}):heroSaved.order;
      window.HERO_POS=0;if(fn('renderHero'))window.renderHero();return true;
    },
    refresh:function(){if(fn('renderHero'))window.renderHero();return true;}
  };
  cu(function(){if(heroSaved){window.HERO_ORDER=heroSaved.order;window.HERO_POS=heroSaved.pos||0;heroSaved=null;if(fn('renderHero'))try{window.renderHero();}catch(e){}}});

  /* ── api.data / api.actions ── */
  api.data={
    games:function(){need('data');return ids().map(G).filter(Boolean);},
    game:function(id){need('data');return G(String(id));},
    featured:function(){need('data');return((window.HERO_ORDER)||[]).map(G).filter(Boolean);},
    genres:function(){need('data');var s={};ids().forEach(function(i){var m=window.GAMES[i];(m&&m.gen||[]).forEach(function(g){s[g]=1;});});return Object.keys(s);},
    state:function(){need('data');var st=viewState();st.page=api.getPage();return st;},
    t:function(key){need('data');return T(key,key);},
    onChange:function(cb){
      need('data');if(typeof cb!=='function')return function(){};
      var s={cb:cb};SUBS.push(s);subsStart();
      var off=function(){var i=SUBS.indexOf(s);if(i>=0)SUBS.splice(i,1);if(!SUBS.length)subsStop();};cu(off);return off;
    }
  };
  api.actions={run:function(name,arg){need('data');return run(name,arg);}};
  ['open','buy','launch','wish','view','filter','search','genre'].forEach(function(n){api.actions[n]=function(a){need('data');return run(n,a);};});
  api.actions.hero=function(a){need('data');return run('hero',a);};
  api.actions.nav=function(a){need('data');return run('nav',a);};

  /* ── api.ui.takeover : replace the whole app UI with your own, driven by api.data ── */
  var tkCur=null;
  ui.takeover=function(spec){
    need('render');spec=spec||{};if(tkCur)tkCur.remove();
    var root=document.createElement('div');root.id='slTakeover';root.className='sl-takeover';root.setAttribute('data-sl-owner',rec.id);
    root.style.cssText='position:fixed;inset:0;z-index:'+(Number(spec.z)||300)+';overflow:auto;background:var(--bg);color:var(--text);font-family:var(--font)';
    document.body.appendChild(root);host.trackedNode(root);document.body.classList.add('sl-takeover-on');
    var hideCss='.app{visibility:hidden !important;pointer-events:none !important}',hideH=sheet.add(hideCss),cssH=spec.css?sheet.add(String(spec.css)):null;
    var paused=false,pill=null,offData=null,t=0,gone=false;
    var h={
      root:root,autoPause:spec.autoPause!==false,
      isPaused:function(){return paused;},
      pause:function(withPill){
        if(paused||gone)return false;paused=true;root.style.display='none';hideH.remove();
        if(withPill!==false){
          pill=document.createElement('button');pill.type='button';pill.className='sl-take-back';pill.textContent='← '+T('slTakeBack','Back to custom UI');
          pill.setAttribute('data-sl-owner',rec.id);pill.addEventListener('click',function(){h.resume();});document.body.appendChild(pill);host.trackedNode(pill);
        }
        return true;
      },
      resume:function(){
        if(!paused||gone)return false;paused=false;root.style.display='';hideH=sheet.add(hideCss);
        if(pill){host.removeNode(pill);pill=null;}
        callG('showStore');h.render();return true;
      },
      render:function(){if(gone||paused)return false;try{if(typeof spec.render==='function')spec.render(root,api,h);}catch(e){perr(e);}return true;},
      remove:function(){
        if(gone)return true;gone=true;var ti=TAKEOVERS.indexOf(h);if(ti>=0)TAKEOVERS.splice(ti,1);
        if(offData)offData();clearTimeout(t);hideH.remove();if(cssH)cssH.remove();if(pill)host.removeNode(pill);host.removeNode(root);
        if(!TAKEOVERS.length)document.body.classList.remove('sl-takeover-on');if(tkCur===h)tkCur=null;
        if(spec.onRemove)safe(spec.onRemove,[api]);return true;
      }
    };
    TAKEOVERS.push(h);tkCur=h;cu(h.remove);
    if(spec.html!=null)root.innerHTML=String(spec.html);
    if(typeof spec.mount==='function')safe(spec.mount,[root,api,h]);
    h.render();
    if(typeof spec.render==='function'&&api.hasPermission('data')&&spec.live!==false){
      offData=api.data.onChange(function(){clearTimeout(t);t=setTimeout(function(){h.render();},60);});
    }
    /* when the built-in detail page closes after an auto-pause, come back to the custom UI */
    if(h.autoPause&&fn('closeDetail')){try{var off=hkAdd('closeDetail',{after:function(){if(paused)setTimeout(function(){if(paused)h.resume();},0);}},perr);cu(off);}catch(e){}}
    return h;
  };

  /* ── api.ui.edit : visual layout editor (drag / resize / hide / restyle ANY element, persisted) ── */
  ui.edit=makeEditor(api,host,sheet,perr);

  /* ── api.ui.apply : one-call "skin" ── */
  ui.apply=function(pack){
    pack=pack||{};var hs=[];
    function add(h){if(h)hs.push(h);return h;}
    if(pack.vars)add(ui.setCssVars(pack.vars));
    if(pack.css)add(ui.injectCSS(pack.css,{tag:'pack'}));
    if(pack.rules)Object.keys(pack.rules).forEach(function(s){add(ui.rule(s,pack.rules[s]));});
    if(pack.hide)[].concat(pack.hide).forEach(function(s){add(ui.hide(s));});
    if(pack.layout){
      ['free','nudge','grid','flex','order'].forEach(function(k){
        var m=pack.layout[k];if(m)Object.keys(m).forEach(function(s){add(L[k](s,m[s]));});
      });
    }
    if(pack.pin)Object.keys(pack.pin).forEach(function(s){var p=pack.pin[s];add(ui.pin(s,p.to||p.target,p));});
    if(typeof pack.card==='function')add(ui.card.render(pack.card,pack.cardOptions));
    if(typeof pack.banner==='function')add(ui.banner.render(pack.banner,pack.bannerOptions));
    if(pack.takeover)add(ui.takeover(pack.takeover));
    return{remove:function(){while(hs.length){try{hs.pop().remove();}catch(e){}}return true;}};
  };
}

/* ───────────── visual layout editor ───────────── */
var EDITOR_CSS=
'#slEditRoot{position:fixed;inset:0;z-index:2147483100;pointer-events:none;font:12px var(--font,system-ui,sans-serif);color:var(--text,#fff)}'+
'#slEditRoot *{box-sizing:border-box}'+
'.sle-box{position:fixed;pointer-events:none;border:1.5px dashed var(--accent,#3b82f6);background:rgba(59,130,246,.08);border-radius:3px;display:none}'+
'.sle-sel{border-style:solid;background:transparent;box-shadow:0 0 0 1px rgba(0,0,0,.35)}'+
'.sle-tag{position:absolute;left:-1.5px;top:-22px;padding:2px 7px;border-radius:5px 5px 5px 0;background:var(--accent,#3b82f6);color:#fff;font:600 10.5px var(--font-mono,monospace);white-space:nowrap;max-width:360px;overflow:hidden;text-overflow:ellipsis}'+
'.sle-h{position:absolute;width:10px;height:10px;background:#fff;border:1.5px solid var(--accent,#3b82f6);border-radius:3px;pointer-events:auto}'+
'.sle-bar,.sle-panel{position:fixed;pointer-events:auto;background:var(--surface-solid,#17171b);border:1px solid var(--border-2,rgba(255,255,255,.15));border-radius:14px;box-shadow:var(--shadow-3,0 20px 60px rgba(0,0,0,.6));backdrop-filter:blur(18px)}'+
'.sle-bar{left:50%;top:12px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:8px 10px;max-width:calc(100vw - 24px)}'+
'.sle-bar b{font-size:12.5px;margin:0 6px 0 4px}.sle-bar span.sle-hint{color:var(--text-3,#8a8a94);max-width:380px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
'.sle-btn{height:28px;padding:0 12px;border:1px solid var(--border,rgba(255,255,255,.1));border-radius:8px;background:var(--surface-2,#222);color:var(--text,#fff);font:600 11.5px var(--font,system-ui);cursor:pointer}'+
'.sle-btn:hover{border-color:var(--accent,#3b82f6)}.sle-btn.pri{background:var(--accent,#3b82f6);border-color:var(--accent,#3b82f6);color:#fff}'+
'.sle-panel{right:12px;bottom:12px;width:300px;max-height:calc(100vh - 90px);overflow:auto;padding:12px}'+
'.sle-panel h4{margin:0 0 6px;font:700 11px var(--font-mono,monospace);color:var(--text-2,#bbb);overflow-wrap:anywhere}'+
'.sle-row{display:flex;gap:6px;margin:6px 0}.sle-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}'+
'.sle-panel label{display:grid;gap:2px;font-size:10.5px;color:var(--text-3,#8a8a94)}'+
'.sle-panel input,.sle-panel textarea{width:100%;height:26px;padding:0 7px;border:1px solid var(--border,rgba(255,255,255,.1));border-radius:7px;background:var(--surface-2,#222);color:var(--text,#fff);font:11.5px var(--font-mono,monospace);outline:none}'+
'.sle-panel input:focus,.sle-panel textarea:focus{border-color:var(--accent,#3b82f6)}.sle-panel textarea{height:120px;padding:6px 7px;resize:vertical}'+
'.sl-take-back{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483000;height:36px;padding:0 18px;border:1px solid var(--border-2,rgba(255,255,255,.15));border-radius:999px;background:var(--surface-solid,#17171b);color:var(--text,#fff);font:600 12.5px var(--font,system-ui);cursor:pointer;box-shadow:var(--shadow-3,0 20px 60px rgba(0,0,0,.6))}'+
'.sl-take-back:hover{border-color:var(--accent,#3b82f6)}';
(function(){var s=document.createElement('style');s.id='slStudioCss';s.textContent=EDITOR_CSS;(document.head||document.documentElement).appendChild(s);})();

var STABLE_SKIP=/^(active|on|off|open|closed|hidden|show|shown|loaded|loading|hover|selected|focus|focused|disabled|expanded|collapsed|wished|owned|expiring|expired|paused|list|closing|sl-.*|plg-.*)$/;
function classesOf(el){return[].slice.call(el.classList||[]).filter(function(c){return!STABLE_SKIP.test(c)&&/^[A-Za-z_][\w-]*$/.test(c);});}
function cssId(id){return/^[A-Za-z_][\w-]*$/.test(id)?'#'+id:'[id="'+String(id).replace(/"/g,'')+'"]';}
function similarSel(el){var c=classesOf(el).slice(0,3);return c.length?el.tagName.toLowerCase()+'.'+c.join('.'):'';}
function exactSel(el){
  if(el.id&&document.querySelectorAll(cssId(el.id)).length===1)return cssId(el.id);
  var parts=[],cur=el;
  while(cur&&cur.nodeType===1&&cur!==document.documentElement){
    if(cur.id&&document.querySelectorAll(cssId(cur.id)).length===1){parts.unshift(cssId(cur.id));break;}
    var p=cur.parentNode,tag=cur.tagName.toLowerCase(),part=tag;
    if(cur===document.body){parts.unshift('body');break;}
    var c=classesOf(cur).slice(0,2);if(c.length)part+='.'+c.join('.');
    if(p){var same=[].filter.call(p.children,function(x){return x.tagName===cur.tagName;});if(same.length>1||!c.length)part+=':nth-of-type('+(same.indexOf(cur)+1)+')';}
    parts.unshift(part);
    var sel=parts.join(' > ');
    try{if(document.querySelectorAll(sel).length===1&&document.querySelector(sel)===el)return sel;}catch(e){}
    cur=cur.parentNode;
  }
  return parts.join(' > ');
}
var POSITIONAL=/^(width|height|translate|display|order|z-index|margin|position|top|left|right|bottom|box-sizing|flex|grid-column|grid-row)$/;
var PROP_ROWS=[['width','height'],['translate','order'],['background','color'],['border-radius','opacity'],['font-size','font-weight'],['padding','margin'],['border','box-shadow'],['display','z-index']];

function makeEditor(api,host,sheet,perr){
  var need=host.need,cu=host.cu,rec=host.rec;
  var rules={},hist=[],sh=null,on=false,root,hoverBox,selBox,selTag,bar,panel,selEl=null,drag=null,scopeAll=true,listeners=[],cbs=[],cfgKey='studio.layout';
  function toCss(){var o=[];Object.keys(rules).forEach(function(s){var d=decl(rules[s],true);if(d)o.push(s+'{'+d+'}');});return o.join('\n');}
  function flush(){if(!sh)sh=sheet.add('');sh.update(toCss());}
  function save(){if(api.hasPermission('storage')){try{api.setConfig(cfgKey,{v:1,rules:rules});}catch(e){}}cbs.slice().forEach(function(f){try{f(rules);}catch(e){}});}
  function snap(){hist.push(JSON.stringify(rules));if(hist.length>100)hist.shift();}
  function commit(sel,props){
    if(!sel||!validSel(sel))return;snap();
    var r=rules[sel]||(rules[sel]={});
    Object.keys(props).forEach(function(k){var v=props[k];if(v==null||v==='')delete r[k];else r[k]=v;});
    if(!Object.keys(r).length)delete rules[sel];
    flush();save();place();
  }
  function undo(){if(!hist.length)return false;rules=JSON.parse(hist.pop());flush();save();place();fillPanel();return true;}
  function clearAll(){snap();rules={};flush();save();place();fillPanel();}
  function mkEl(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
  function inside(t){return t&&t.closest&&t.closest('#slEditRoot');}
  function pick(t){return(!t||inside(t)||t===document.documentElement||t===document.body)?null:t;}
  function box(el,b){
    if(!el||!document.contains(el)){b.style.display='none';return;}
    var r=el.getBoundingClientRect();b.style.display='block';b.style.left=r.left+'px';b.style.top=r.top+'px';b.style.width=r.width+'px';b.style.height=r.height+'px';
  }
  function place(){requestAnimationFrame(function(){box(selEl,selBox);});}
  function tr(el){var m=/^(-?[\d.]+)px\s*(-?[\d.]+)?/.exec(getComputedStyle(el).translate||'');return m?[parseFloat(m[1])||0,parseFloat(m[2])||0]:[0,0];}
  function label(el){return el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+classesOf(el).slice(0,2).map(function(c){return'.'+c;}).join('');}

  function select(el){
    selEl=el;
    if(!el){selBox.style.display='none';fillPanel();return;}
    selTag.textContent=label(el);box(el,selBox);fillPanel();
  }
  function fillPanel(){
    panel.textContent='';
    if(!selEl||!document.contains(selEl)){panel.style.display='none';return;}
    panel.style.display='block';
    var ex=exactSel(selEl),sim=similarSel(selEl);
    panel.appendChild(mkEl('h4',null,ex));
    var row=mkEl('div','sle-row');
    function btn(txt,cls,f){var b=mkEl('button','sle-btn'+(cls?' '+cls:''),txt);b.type='button';b.addEventListener('click',f);row.appendChild(b);return b;}
    btn(T('slEditParent'),'',function(){if(selEl.parentElement&&!inside(selEl.parentElement))select(pick(selEl.parentElement)||selEl);});
    btn(T('slEditHide'),'',function(){commit(ex,{display:'none'});select(null);});
    btn(T('slEditClearEl'),'',function(){snap();delete rules[ex];if(sim)delete rules[sim];flush();save();place();fillPanel();});
    panel.appendChild(row);
    if(sim){
      var sc=mkEl('div','sle-row'),sb=mkEl('button','sle-btn',scopeAll?T('slEditScopeAll')+'  ('+sim+')':T('slEditScopeOne'));sb.type='button';
      sb.addEventListener('click',function(){scopeAll=!scopeAll;fillPanel();});sc.appendChild(sb);panel.appendChild(sc);
    }
    var cs=getComputedStyle(selEl);
    PROP_ROWS.forEach(function(pair){
      var g=mkEl('div','sle-grid');
      pair.forEach(function(p){
        var l=mkEl('label',null,p),i=mkEl('input');i.type='text';i.setAttribute('data-prop',p);
        var tgt=(!POSITIONAL.test(p)&&scopeAll&&sim)?sim:ex;
        i.value=(rules[tgt]&&rules[tgt][p])||'';i.placeholder=String(cs.getPropertyValue(p)||'').slice(0,40);
        i.addEventListener('change',function(){var o={};o[p]=i.value.trim();commit(tgt,o);});
        i.addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter')i.blur();});
        l.appendChild(i);g.appendChild(l);
      });
      panel.appendChild(g);
    });
  }

  /* ── pointer interaction ── */
  function on_(t,ev,f,cap){var c=cap!==false;t.addEventListener(ev,f,c);listeners.push([t,ev,f,c]);}
  function swallow(e){if(!inside(e.target)){e.preventDefault();e.stopPropagation();}}
  function onDown(e){
    if(inside(e.target)||e.button!==0)return;
    e.preventDefault();e.stopPropagation();
    var el=pick(e.target);if(!el)return;
    if(el!==selEl)select(el);
    var ex=exactSel(el),t0=tr(el),r=el.getBoundingClientRect();
    drag={mode:'move',el:el,sel:ex,x:e.clientX,y:e.clientY,t:t0,w:r.width,h:r.height,moved:false};
  }
  function onHandleDown(dir){
    return function(e){
      e.preventDefault();e.stopPropagation();if(!selEl)return;
      var r=selEl.getBoundingClientRect();
      drag={mode:'resize',dir:dir,el:selEl,sel:exactSel(selEl),x:e.clientX,y:e.clientY,t:tr(selEl),w:r.width,h:r.height,moved:false};
    };
  }
  function onMove(e){
    if(drag){
      var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<3)return;drag.moved=true;
      var s=drag.el.style;
      if(drag.mode==='move'){s.setProperty('translate',(drag.t[0]+dx)+'px '+(drag.t[1]+dy)+'px','important');}
      else{
        var d=drag.dir,w=drag.w,h=drag.h,tx=drag.t[0],ty=drag.t[1];
        if(d.indexOf('e')>=0)w=Math.max(8,drag.w+dx);if(d.indexOf('w')>=0){w=Math.max(8,drag.w-dx);tx=drag.t[0]+(drag.w-w);}
        if(d.indexOf('s')>=0)h=Math.max(8,drag.h+dy);if(d.indexOf('n')>=0){h=Math.max(8,drag.h-dy);ty=drag.t[1]+(drag.h-h);}
        s.setProperty('box-sizing','border-box','important');s.setProperty('width',w+'px','important');s.setProperty('height',h+'px','important');s.setProperty('translate',tx+'px '+ty+'px','important');
      }
      box(drag.el,selBox);e.preventDefault();return;
    }
    var t=pick(e.target);if(!t){hoverBox.style.display='none';return;}
    if(t===selEl){hoverBox.style.display='none';return;}box(t,hoverBox);
  }
  function onUp(){
    if(!drag)return;var d=drag;drag=null;if(!d.moved)return;
    var s=d.el.style,props={translate:s.getPropertyValue('translate')};
    if(d.mode==='resize'){props.width=s.getPropertyValue('width');props.height=s.getPropertyValue('height');props['box-sizing']='border-box';}
    s.removeProperty('translate');s.removeProperty('width');s.removeProperty('height');s.removeProperty('box-sizing');
    commit(d.sel,props);fillPanel();
  }
  function onKey(e){
    if(e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName)&&inside(e.target))return;
    var k=e.key;
    if(k==='Escape'){e.preventDefault();e.stopPropagation();if(selEl)select(null);else ed.stop();return;}
    if((e.ctrlKey||e.metaKey)&&k.toLowerCase()==='z'){e.preventDefault();e.stopPropagation();undo();return;}
    if(!selEl)return;
    if(k==='Delete'||k==='Backspace'){e.preventDefault();e.stopPropagation();commit(exactSel(selEl),{display:'none'});select(null);return;}
    if(e.altKey&&k==='ArrowUp'){e.preventDefault();var p=selEl.parentElement;if(p&&!inside(p))select(pick(p)||selEl);return;}
    if(e.altKey&&k==='ArrowDown'){e.preventDefault();var c=selEl.firstElementChild;if(c)select(c);return;}
    var step=e.shiftKey?10:1,dx=0,dy=0;
    if(k==='ArrowLeft')dx=-step;else if(k==='ArrowRight')dx=step;else if(k==='ArrowUp')dy=-step;else if(k==='ArrowDown')dy=step;else return;
    e.preventDefault();e.stopPropagation();var t=tr(selEl);
    commit(exactSel(selEl),{translate:(t[0]+dx)+'px '+(t[1]+dy)+'px'});
  }

  function buildUi(){
    root=mkEl('div');root.id='slEditRoot';root.setAttribute('data-plugin-ui-node',rec.id);
    hoverBox=mkEl('div','sle-box');selBox=mkEl('div','sle-box sle-sel');selTag=mkEl('div','sle-tag');selBox.appendChild(selTag);
    ['nw','n','ne','e','se','s','sw','w'].forEach(function(d){
      var h=mkEl('div','sle-h');h.style.cursor=d+'-resize';
      var pos={n:['50%','0'],s:['50%','100%'],e:['100%','50%'],w:['0','50%'],nw:['0','0'],ne:['100%','0'],sw:['0','100%'],se:['100%','100%']}[d];
      h.style.left=pos[0];h.style.top=pos[1];h.style.marginLeft='-5px';h.style.marginTop='-5px';h.addEventListener('pointerdown',onHandleDown(d));selBox.appendChild(h);
    });
    bar=mkEl('div','sle-bar');bar.appendChild(mkEl('b',null,T('slEditTitle')));bar.appendChild(mkEl('span','sle-hint',T('slEditHint')));
    function bb(txt,cls,f){var b=mkEl('button','sle-btn'+(cls?' '+cls:''),txt);b.type='button';b.addEventListener('click',f);bar.appendChild(b);return b;}
    bb(T('slEditUndo'),'',undo);bb(T('slEditResetAll'),'',clearAll);
    var dataPanel=null;
    bb(T('slEditData'),'',function(){
      if(dataPanel){dataPanel.remove();dataPanel=null;return;}
      dataPanel=mkEl('div','sle-panel');dataPanel.style.cssText='left:50%;top:60px;right:auto;bottom:auto;transform:translateX(-50%);width:420px';
      var ta=mkEl('textarea');ta.value=JSON.stringify({v:1,rules:rules},null,2);ta.addEventListener('keydown',function(e){e.stopPropagation();});
      var ap=mkEl('button','sle-btn pri',T('slEditApply'));ap.type='button';ap.style.marginTop='8px';
      ap.addEventListener('click',function(){try{ed.import(ta.value);dataPanel.remove();dataPanel=null;}catch(e){perr(e);}});
      dataPanel.append(ta,ap);root.appendChild(dataPanel);
    });
    bb(T('slEditDone'),'pri',function(){ed.stop();});
    panel=mkEl('div','sle-panel');panel.style.display='none';
    root.append(hoverBox,selBox,bar,panel);document.body.appendChild(root);
  }

  var ed={
    isActive:function(){return on;},
    load:function(opts){
      need('layout');if(opts&&opts.key)cfgKey=String(opts.key);
      var d=null;if(api.hasPermission('storage')){try{d=api.getConfig(cfgKey,null);}catch(e){}}
      if(d&&d.rules&&typeof d.rules==='object'){rules=d.rules;flush();}
      return Object.keys(rules).length;
    },
    start:function(opts){
      need('layout');if(on)return true;if(opts&&opts.key)cfgKey=String(opts.key);
      on=true;ed.load();buildUi();
      on_(document,'pointerdown',onDown);on_(document,'pointermove',onMove);on_(document,'pointerup',onUp);
      ['mousedown','mouseup','click','dblclick','auxclick','contextmenu','dragstart','submit'].forEach(function(n){on_(document,n,swallow);});
      on_(document,'keydown',onKey);on_(window,'resize',place,false);
      on_(document,'scroll',place,true);
      return true;
    },
    stop:function(){
      if(!on)return false;on=false;
      listeners.splice(0).forEach(function(l){l[0].removeEventListener(l[1],l[2],l[3]);});
      if(root)host.removeNode(root);root=null;selEl=null;drag=null;return true;
    },
    toggle:function(){return on?!ed.stop():ed.start();},
    export:function(){need('layout');return JSON.parse(JSON.stringify({v:1,rules:rules}));},
    import:function(data){
      need('layout');var d=typeof data==='string'?JSON.parse(data):data;if(!d||typeof d.rules!=='object')throw new Error('Invalid layout JSON');
      snap();rules={};Object.keys(d.rules).forEach(function(s){var rs=resolve(s);if(validSel(rs)&&d.rules[s]&&typeof d.rules[s]==='object')rules[rs]=d.rules[s];});
      flush();save();place();fillPanel();return Object.keys(rules).length;
    },
    clear:function(){need('layout');clearAll();return true;},
    getRules:function(){return JSON.parse(JSON.stringify(rules));},
    onChange:function(cb){if(typeof cb!=='function')return function(){};cbs.push(cb);return function(){var i=cbs.indexOf(cb);if(i>=0)cbs.splice(i,1);};}
  };
  cu(function(){ed.stop();});
  return ed;
}

var CATALOG=[{"cat": "Studio", "name": "ui.parts() / ui.part(name)  ·  \"@name\" selectors", "sig": "api.ui.parts() -> { name: selector }; api.ui.part(\"card\"); any selector may start with @name, e.g. \"@card:hover\", \"@heroButtons\"", "desc": "Stable names for every region of the app (sidebar, topbar, hero, grid, card, cardTitle, cardButton, buttons, …). Use \"@name\" anywhere a selector is accepted by the Studio APIs so plugins do not depend on raw class names.", "zh": "为界面的每个区域提供稳定名称（sidebar、topbar、hero、grid、card、cardTitle、cardButton、buttons…）。Studio 各接口的选择器里都可以写 \"@名称\"，不必依赖具体 class。", "example": "console.table(api.ui.parts());\napi.ui.rule('@cardTitle', { fontSize: 15, letterSpacing: '.4px' });"}, {"cat": "Studio", "name": "ui.rule(selector, styles, opts?)", "sig": "api.ui.rule(selector, { prop: value } | \"css text\", { important?: true, media? }) -> { update(styles), remove() }", "desc": "Requires appearance. A persistent CSS rule. Unlike setStyle it also applies to elements created later (cards, banner panels and lists are rebuilt often). Declarations are !important by default; numbers become px. update() replaces the styles, remove() deletes the rule.", "zh": "需要 appearance 权限。持久化 CSS 规则：与 setStyle 不同，它同样作用于之后重新生成的元素（卡片、横幅、列表经常重建）。默认带 !important，数字自动加 px。update() 替换样式，remove() 删除规则。", "example": "const r = api.ui.rule('@card', { borderRadius: 22, background: 'rgba(0,0,0,.35)' });\napi.ui.rule('@card:hover', { transform: 'translateY(-6px) scale(1.02)' });\n// r.update({ borderRadius: 4 });"}, {"cat": "Studio", "name": "ui.layout.free / nudge", "sig": "api.ui.layout.free(sel, { x, y, right, bottom, w, h, z, rotate, scale, center:\"x|y|both\", fixed?, container? }); api.ui.layout.nudge(sel, { x, y, rotate?, scale? })", "desc": "Requires layout. free() takes an element out of the flow and places it absolutely (numbers are px, strings may be %, vw, calc(…)); pass container to make that ancestor the positioning context. nudge() shifts an element with CSS translate and leaves the flow untouched. Both return { update(opts), remove() }.", "zh": "需要 layout 权限。free() 让元素脱离文档流并绝对定位（数字为 px，字符串可写 %、vw、calc(…)）；container 指定定位参照的祖先。nudge() 用 CSS translate 平移元素，不影响文档流。都返回 { update(opts), remove() }。", "example": "api.ui.layout.free('@search', { container: '@main', x: 24, y: 12, w: 420 });\napi.ui.layout.free('@avatar', { fixed: true, right: 18, bottom: 18, z: 50 });\napi.ui.layout.nudge('@worldBtn', { x: -12, y: 4 });"}, {"cat": "Studio", "name": "ui.layout.grid / flex / order", "sig": "api.ui.layout.grid(sel, { columns, rows, areas:[…], gap, autoFlow, place:{ child: \"area\" | {column,row} } }); api.ui.layout.flex(sel, { direction, wrap, gap, justify, align }); api.ui.layout.order(sel, [child, …])", "desc": "Requires layout. Turn any container into a CSS grid or flexbox, assign children to named areas, or reorder direct children with CSS order (no DOM moves, so it survives re-renders). columns:3 means repeat(3, 1fr).", "zh": "需要 layout 权限。把任意容器变成 CSS grid 或 flex，把子元素分配到命名区域，或用 CSS order 重排直接子元素（不移动 DOM，重绘后依然有效）。columns:3 即 repeat(3, 1fr)。", "example": "api.ui.layout.grid('@main', {\n  columns: ['1fr', '320px'], rows: 'auto 1fr', gap: 16,\n  areas: ['top top', 'store side'],\n  place: { '.topbar': 'top', '#storePage': 'store', '#gamePane': 'side' }\n});\napi.ui.layout.grid('@grid', { columns: 5, gap: 10 });"}, {"cat": "Studio", "name": "ui.layout.export() / import(json)", "sig": "api.ui.layout.export() -> { v, items }; api.ui.layout.import(jsonOrObject) -> count", "desc": "Requires layout. Serialises every free / nudge / grid / flex / order / rule call this plugin made into plain JSON and replays it later — store it with api.setConfig or ship it as a \"theme pack\".", "zh": "需要 layout 权限。把本插件做过的 free / nudge / grid / flex / order / rule 调用导出为纯 JSON，之后可重放；可用 api.setConfig 保存，或作为\"主题包\"分享。", "example": "const pack = api.ui.layout.export();\napi.setConfig('layout', pack);\n// later\napi.ui.layout.import(api.getConfig('layout'));"}, {"cat": "Studio", "name": "ui.pin(selector, target, opts?)", "sig": "api.ui.pin(sel, target, { position: \"append|prepend|before|after\" }) -> { apply(), remove() }", "desc": "Requires dom. Like ui.move, but persistent: whenever the UI re-renders and the element is recreated or displaced, it is moved back to the target. Stops itself if another script keeps fighting over the element. remove() puts the element back where it was.", "zh": "需要 dom 权限。与 ui.move 类似，但是持久的：界面重新渲染、元素被重建或挪位后会自动再移回目标位置。如果有别的脚本一直在抢这个元素，会自动停止。remove() 会把元素放回原处。", "example": "api.ui.pin('@search', '@actions', { position: 'prepend' });\napi.ui.pin('@viewSwitch', '@topbar');"}, {"cat": "Studio", "name": "ui.hook(name, { before, around, after })", "sig": "api.ui.hook(\"renderGrid\", { before(args), around(next, args), after(result, args) }) -> { remove() }", "desc": "Requires render. Wraps any global render / show / open / close / toggle function of the app (renderGrid, renderHero, renderQuickplay, renderDownloads, heroSetPanel, openDetail, showStore, toggleWish …) so you can run code before it, after it, or replace it. Several plugins can hook the same function; removal is order-independent.", "zh": "需要 render 权限。包装程序里任意全局的 render / show / open / close / toggle 函数（renderGrid、renderHero、renderQuickplay、renderDownloads、heroSetPanel、openDetail、showStore、toggleWish…），可在其前、其后运行代码或整个替换。多个插件可以钩同一个函数，移除顺序无关。", "example": "api.ui.hook('renderQuickplay', { after() {\n  api.ui.queryAll('#sbQuick .sb-item').forEach(el => el.style.borderRadius = '20px');\n}});\napi.ui.hook('openDetail', { around(next, [id]) { api.toast('Opening ' + id); return next(); } });"}, {"cat": "Studio", "name": "ui.card.render / decorate / refresh", "sig": "api.ui.card.render((game, ctx, el) => html | Element | null, { mode:\"inner|outer\", layout:\"grid|list|both\", clickable? }); api.ui.card.decorate((el, game, ctx) => …)", "desc": "Requires render. render() replaces the content of every game card (return null to keep the built-in card for that game). mode \"inner\" (default) keeps the built-in card element and its click behaviour; \"outer\" swaps the whole element. layout limits it to grid or list mode, so cards and list rows can be completely different. decorate() edits the built-in card in place. Use ctx.act(\"wish\") inside templates to get a working data-sl-action attribute (needs data).", "zh": "需要 render 权限。render() 替换每张游戏卡片的内容（返回 null 则保留该游戏的原卡片）。mode 为 \"inner\"（默认）时保留原卡片元素及其点击行为，\"outer\" 则整个替换。layout 可限定仅网格或仅列表模式，因此卡片与列表行可以完全不同。decorate() 就地修改原卡片。模板里用 ctx.act(\"wish\") 生成可用的 data-sl-action 属性（需要 data 权限）。", "example": "api.ui.card.render((g, ctx) => `\n  <div style=\"position:relative;aspect-ratio:3/4;background:url(${g.poster}) center/cover;border-radius:18px\">\n    <b style=\"position:absolute;left:12px;bottom:40px;color:#fff\">${ctx.esc(g.title)}</b>\n    <button ${ctx.act('buy')}>${g.owned ? ctx.t('launch') : g.price.text}</button>\n  </div>`, { layout: 'grid' });"}, {"cat": "Studio", "name": "ui.banner.render / decorate / setGames", "sig": "api.ui.banner.render((game, ctx, panel) => html | Element | null, { keepBackground?: true }); api.ui.banner.setGames(ids | null)", "desc": "Requires render. Replaces the banner (hero) panel content. The background image the app builds is kept unless keepBackground is false. ctx.actions has open / buy / wish / next / prev / go. setGames() chooses which games are featured and in what order (null restores). The prev / next arrows and dots are normal elements: move or restyle them with rule / layout / pin.", "zh": "需要 render 权限。替换横幅（hero）面板的内容。默认保留程序生成的背景图，keepBackground 为 false 时一并清除。ctx.actions 提供 open / buy / wish / next / prev / go。setGames() 指定横幅展示哪些游戏及顺序（传 null 还原）。左右箭头和圆点是普通元素，可用 rule / layout / pin 移动或改样式。", "example": "api.ui.banner.render((g, ctx) => `\n  <div style=\"position:absolute;inset:auto 0 0 0;padding:28px;background:linear-gradient(transparent,#000c)\">\n    <h1 style=\"margin:0\">${ctx.esc(g.title)}</h1>\n    <button ${ctx.act('buy')}>${g.owned ? 'Launch' : g.price.text}</button>\n  </div>`);\napi.ui.banner.setGames(api.data.games().slice(0, 3).map(g => g.id));"}, {"cat": "Studio", "name": "ui.takeover(spec)", "sig": "api.ui.takeover({ render(root, api, handle), html?, css?, mount?, z?, autoPause?: true, live?: true }) -> { root, pause(), resume(), render(), remove() }", "desc": "Requires render. Hides the whole built-in interface and gives you a full-window root element: build a completely different app from api.data and api.actions. render() is called again (debounced) whenever games, wishlist or licences change. Elements with data-sl-drag drag the window; data-sl-action=\"open:ID\" etc. trigger actions. When an action opens a built-in page (game detail, profile, plugins) the takeover pauses and a \"Back\" pill appears; closing the detail returns automatically. Settings, Renew and dialogs always show on top.", "zh": "需要 render 权限。隐藏整套内置界面，给你一个全窗口根元素：用 api.data 和 api.actions 做出完全不同的程序。游戏、愿望单或授权变化时会（防抖后）再次调用 render()。带 data-sl-drag 的元素可拖动窗口；data-sl-action=\"open:ID\" 等属性可触发操作。操作打开内置页面（游戏详情、个人资料、插件）时，自定义界面会暂停并出现\"返回\"按钮；关闭详情后自动返回。设置、续费和对话框始终显示在最上层。", "example": "api.ui.takeover({\n  css: '.wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;padding:70px 24px}',\n  render(root, api) {\n    root.innerHTML = '<div data-sl-drag style=\"position:fixed;inset:0 0 auto;height:56px\"></div><div class=\"wall\">' +\n      api.data.games().map(g => `<div data-sl-action=\"open:${g.id}\"><img src=\"${g.image}\" width=\"100%\"><b>${g.title}</b></div>`).join('') + '</div>';\n  }\n});"}, {"cat": "Studio", "name": "data-sl-action / data-sl-drag attributes", "sig": "<button data-sl-action=\"open:ID | buy:ID | launch:ID | wish:ID | view:grid|list | filter:all|owned|available|wish | search:text | genre:name | hero:next|prev|N | nav:home|store|profile|settings|inbox|faq|theme|world|language|close\">", "desc": "Requires data. Declarative actions for HTML you insert through card / banner / takeover / ui.insert: no event code needed. Clicks are intercepted before the app's own handlers (add data-sl-pass to let them through). data-sl-drag turns an element into a window drag handle (takeover / insert only).", "zh": "需要 data 权限。给通过 card / banner / takeover / ui.insert 插入的 HTML 使用的声明式操作，无需写事件代码。点击会先于程序自带的处理器被拦截（加 data-sl-pass 可放行）。data-sl-drag 把元素变成窗口拖动区（仅限 takeover / insert 的内容）。", "example": "api.ui.insert('@actions', '<button class=\"tb-btn\" data-sl-action=\"view:list\">≡</button>', { position: 'prepend' });"}, {"cat": "Studio", "name": "data.games() / game(id) / featured() / genres() / state() / onChange(cb) / t(key)", "sig": "api.data.games() -> Game[]; api.data.game(id); api.data.featured(); api.data.genres(); api.data.state(); api.data.onChange(kind => …) -> unsubscribe; api.data.t(key)", "desc": "Requires data. Read-only data: Game = { id, title, short, developer, genres, image, poster, owned, wished, license:{seconds,paused,text,expiring,expired}|null, price:{free,text,oldText,discount,value}, statusHtml, raw }. state() = { view, filter, search, genre, page, theme, language, user:{name,avatar} }. onChange fires with \"games\" | \"banner\" | \"wish\" | \"quickplay\" | \"downloads\". t(key) reads the app's own translation table.", "zh": "需要 data 权限。只读数据：Game = { id, title, short, developer, genres, image, poster, owned, wished, license:{seconds,paused,text,expiring,expired}|null, price:{free,text,oldText,discount,value}, statusHtml, raw }。state() = { view, filter, search, genre, page, theme, language, user:{name,avatar} }。onChange 的参数为 \"games\" | \"banner\" | \"wish\" | \"quickplay\" | \"downloads\"。t(key) 读取程序自带的翻译表。", "example": "const owned = api.data.games().filter(g => g.owned);\nconst off = api.data.onChange(kind => kind === 'games' && api.log('re-rendered', api.data.state().view));"}, {"cat": "Studio", "name": "actions.open / buy / launch / wish / view / filter / search / genre / hero / nav / run", "sig": "api.actions.open(id); buy(id); launch(id); wish(id); view(\"grid\"|\"list\"); filter(\"owned\"); search(text); genre(name); hero(\"next\"|\"prev\"|n); nav(\"profile\"); run(name, arg)", "desc": "Requires data. Triggers the same code paths as the built-in buttons, so purchases, licences and the host bridge keep working no matter how the UI looks. Returns false for unknown actions.", "zh": "需要 data 权限。触发与内置按钮相同的代码路径，所以无论界面长什么样，购买、授权和宿主通信都照常工作。未知操作返回 false。", "example": "api.actions.view('list');\napi.actions.filter('owned');\napi.actions.nav('profile');"}, {"cat": "Studio", "name": "ui.edit.start / stop / toggle / load / export / import / clear", "sig": "api.ui.edit.start({ key? }); stop(); toggle(); load() -> ruleCount; export(); import(jsonOrObject); clear(); getRules(); onChange(cb)", "desc": "Requires layout. A built-in visual editor for ANY element: click to select, drag to move, handles to resize, arrow keys to nudge (Shift = 10px), Delete to hide, Alt+↑/↓ to select parent / child, Ctrl+Z to undo, and an inspector for colour, radius, font, padding, shadow, z-index… Changes are stored as CSS rules and saved with setConfig (needs storage). Call load() in activate() to restore the user's layout on every start. Esc leaves the editor.", "zh": "需要 layout 权限。内置的可视化编辑器，可编辑任意元素：点击选中、拖动移动、拖拽手柄缩放、方向键微调（Shift = 10px）、Delete 隐藏、Alt+↑/↓ 选父/子元素、Ctrl+Z 撤销，侧边检查器可改颜色、圆角、字体、边距、阴影、层级等。改动以 CSS 规则保存，并通过 setConfig 持久化（需要 storage 权限）。在 activate() 里调用 load() 即可在每次启动时恢复用户的布局。按 Esc 退出编辑。", "example": "activate(api) {\n  api.ui.edit.load();                       // restore saved layout\n  api.ui.addTopbarButton({ title: 'Edit layout', icon: '<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/>',\n    onClick: () => api.ui.edit.toggle() });\n}"}, {"cat": "Studio", "name": "ui.apply(pack)", "sig": "api.ui.apply({ vars, css, rules, hide, layout:{free,grid,flex,nudge,order}, pin, card, banner, takeover }) -> { remove() }", "desc": "One call to apply a whole skin: CSS variables, extra CSS, persistent rules, hidden elements, layout, pins, card / banner templates and an optional takeover. Each part needs the permission of the API it uses. remove() undoes the whole pack.", "zh": "一次调用应用整套皮肤：CSS 变量、附加 CSS、持久规则、隐藏元素、布局、pin、卡片/横幅模板以及可选的 takeover。每一部分需要对应接口的权限。remove() 撤销整套皮肤。", "example": "const skin = api.ui.apply({\n  vars: { '--accent': '#ff4d6d' },\n  rules: { '@card': { borderRadius: 24 } },\n  layout: { grid: { '@grid': { columns: 4, gap: 18 } } },\n  hide: ['@festStrip']\n});\n// skin.remove();"}];
window.SLStudio={attach:attach,parts:PARTS,resolve:resolve,version:'2.3.0',catalog:CATALOG};
})();
