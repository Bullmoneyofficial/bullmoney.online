// BULLMONEY MEMORY MANAGER v3.0 — hardened memory + load-time + compile boosters
// Targets: iOS tab-kill, Android jank, SPA leak pruning, tab-switch release, LOAD SPEED
// Coordinates with __BM_BRAIN__, __BM_CRASH_SHIELD__, __BM_NETWORK__
(function(){
'use strict';

var w=window,d=document,n=navigator,p=performance;
var B=w.__BM_BRAIN__=w.__BM_BRAIN__||{};
var DEBUG=(w.location&&w.location.hostname==='localhost')||/[?&]bm_debug=1/.test(w.location.search||'');
function log(){if(DEBUG)try{console.log.apply(console,['[MemManager]'].concat([].slice.call(arguments)));}catch(e){}}

// ─── Device classification ───────────────────────────────────────────────────
var ua=n.userAgent||'';
var mem=n.deviceMemory||4;        // GB (Chrome/Edge only, others default 4)
var cores=n.hardwareConcurrency||4;
var isMobile=/mobi|android|iphone|ipad|ipod/i.test(ua);
var isIOS=/iphone|ipad|ipod/i.test(ua)||(/macintosh/i.test(ua)&&n.maxTouchPoints>1);
var isAndroid=/android/i.test(ua);
var isInApp=!!(B.inApp&&B.inApp.active);
var dpr=Math.min(w.devicePixelRatio||1,3);

// Tier: 'ultra-low' (≤1GB), 'low' (≤2GB), 'mid' (≤4GB), 'high' (>4GB)
// Safari doesn't expose deviceMemory, so use heuristics for iOS
function detectActualMemory(){
  // deviceMemory is Chrome/Edge only; Safari returns undefined
  if(n.deviceMemory) return n.deviceMemory;
  // iOS heuristic: older/SE devices have ≤3GB, detect via screen size + cores
  if(isIOS){
    var screenW=w.screen&&w.screen.width||375;
    var screenH=w.screen&&w.screen.height||667;
    var maxDim=Math.max(screenW,screenH);
    // iPhone SE/6/7/8 class (small screen + low cores)
    if(maxDim<=667&&cores<=2) return 2;
    // iPhone X/11/12 mini class
    if(maxDim<=812&&cores<=4) return 3;
    // Modern iPhones typically 6GB
    if(maxDim>=926) return 6;
    return 4;
  }
  // Android: low-core devices are likely low-RAM
  if(isAndroid){
    if(cores<=2) return 2;
    if(cores<=4) return 3;
  }
  return 4; // safe default
}
mem=detectActualMemory();

function deviceTier(){
  if(mem<=1) return 'ultra-low';
  if(mem<=2) return 'low';
  if(mem<=4) return 'mid';
  return 'high';
}

var tier=deviceTier();
var isLowEnd=tier==='ultra-low'||tier==='low';
var isUltraLow=tier==='ultra-low';

// ─── Public handle ───────────────────────────────────────────────────────────
var MM=w.__BM_MEMORY_MANAGER__={
  active:true,
  tier:tier,
  isLowEnd:isLowEnd,
  deviceMemoryGB:mem,
  gcCycles:0,
  domNodesRecycled:0,
  imagesUnloaded:0,
  iframesUnloaded:0,
  listenersThrottled:0,
  lastGC:0,
  stats:{}
};

// ─── Thresholds per tier ─────────────────────────────────────────────────────
var THRESHOLDS={
  'ultra-low':{ maxDOMNodes:800,  maxImages:12, maxCanvases:2, maxIframes:1, gcIntervalMs:3000,  heapWarnPct:55, heapCritPct:70, maxEventListeners:80,  maxTimers:8,  imgViewportMargin:200 },
  'low':      { maxDOMNodes:1500, maxImages:25, maxCanvases:3, maxIframes:2, gcIntervalMs:4500,  heapWarnPct:62, heapCritPct:78, maxEventListeners:150, maxTimers:15, imgViewportMargin:350 },
  'mid':      { maxDOMNodes:3000, maxImages:50, maxCanvases:6, maxIframes:4, gcIntervalMs:8000,  heapWarnPct:72, heapCritPct:85, maxEventListeners:300, maxTimers:30, imgViewportMargin:500 },
  'high':     { maxDOMNodes:6000, maxImages:100,maxCanvases:12,maxIframes:8, gcIntervalMs:12000, heapWarnPct:80, heapCritPct:90, maxEventListeners:600, maxTimers:60, imgViewportMargin:700 }
};
var T=THRESHOLDS[tier];
MM.thresholds=T;

// ─── DOM node count ──────────────────────────────────────────────────────────
function countDOM(){
  return d.querySelectorAll('*').length;
}

// ─── Heap memory (Chrome/Edge only via performance.memory) ───────────────────
function heapInfo(){
  if(!p||!p.memory) return {usedMB:0,totalMB:0,pct:0,available:false};
  var used=Math.round((p.memory.usedJSHeapSize||0)/1048576);
  var total=Math.round((p.memory.jsHeapSizeLimit||1)/1048576);
  return {usedMB:used,totalMB:total,pct:total?Math.round(used/total*100):0,available:true};
}

// ═══════════════════════════════════════════════════════════════════════════════
// AREA 1: iOS TAB-KILL PREVENTION
// iOS Safari kills tabs using >80-120MB (varies by device generation).
// Key targets: TradingView iframes (15+ in UnifiedHubPanel), Spline 3D scenes,
// decoded image bitmaps, offscreen canvas buffers.
// ═══════════════════════════════════════════════════════════════════════════════

// iOS-specific memory ceiling (MB) — based on real Safari limits
var iosMemoryCeiling=isIOS?(mem<=3?80:(mem<=4?120:200)):0;
MM.iosMemoryCeiling=iosMemoryCeiling;

// Track total iframe byte estimate (each TradingView iframe ≈ 8-15MB)
var iframeMemEstimateMB=0;

function unloadOffscreenImages(margin){
  margin=(typeof margin==='number')?margin:T.imgViewportMargin;
  var viewH=w.innerHeight||0;
  // On iOS, also target ALL images (not just lazy) when under pressure
  var selector=isIOS&&MM.stats.level==='critical'
    ?'img:not([data-mm-protected])'
    :'img[loading="lazy"],img[data-src],img.lazy,img[srcset]';
  var imgs=d.querySelectorAll(selector);
  var count=0;
  for(var i=0;i<imgs.length;i++){
    var img=imgs[i];
    if(img.dataset.mmProtected) continue;
    // Skip tiny icons (logo, favicon) — not worth the layout shift
    if(img.width<40&&img.height<40&&img.width>0) continue;
    var r=img.getBoundingClientRect();
    if(r.bottom<-margin||r.top>viewH+margin){
      if(img.src&&img.src.indexOf('data:')!==0&&!img.dataset.mmOrigSrc){
        img.dataset.mmOrigSrc=img.src;
        // Also save srcset to fully release decoded bitmaps
        if(img.srcset){img.dataset.mmOrigSrcset=img.srcset;img.srcset='';}
        img.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        count++;
      }
    }
  }
  MM.imagesUnloaded+=count;
  return count;
}

function restoreNearbyImages(margin){
  margin=(typeof margin==='number')?margin:T.imgViewportMargin;
  var viewH=w.innerHeight||0;
  var imgs=d.querySelectorAll('img[data-mm-orig-src]');
  for(var i=0;i<imgs.length;i++){
    var img=imgs[i],r=img.getBoundingClientRect();
    if(r.bottom>=-margin&&r.top<=viewH+margin){
      img.src=img.dataset.mmOrigSrc;
      delete img.dataset.mmOrigSrc;
      // Restore srcset
      if(img.dataset.mmOrigSrcset){
        img.srcset=img.dataset.mmOrigSrcset;
        delete img.dataset.mmOrigSrcset;
      }
    }
  }
}

// ─── Iframe management (targets TradingView, Spline, embeds) ─────────────────
// UnifiedHubPanel loads 15+ TradingView iframes — each costs ~8-15MB
// On iOS this alone can trigger a tab kill
function unloadOffscreenIframes(margin){
  margin=(typeof margin==='number')?margin:T.imgViewportMargin;
  var viewH=w.innerHeight||0;
  var iframes=d.querySelectorAll('iframe:not([data-mm-protected])');
  var count=0;
  iframeMemEstimateMB=0;
  // On iOS low-end, limit total active iframes
  var maxActive=isIOS?(isLowEnd?2:4):(isLowEnd?4:T.maxIframes);
  var activeCount=0;

  // Sort by distance from viewport — keep closest ones alive
  var iframeArr=[];
  for(var i=0;i<iframes.length;i++){
    var ifr=iframes[i],r=ifr.getBoundingClientRect();
    var dist=Math.max(0,r.top>viewH?r.top-viewH:(r.bottom<0?-r.bottom:0));
    iframeArr.push({el:ifr,rect:r,dist:dist,isActive:ifr.src&&ifr.src!=='about:blank'&&!ifr.dataset.mmOrigSrc});
  }
  iframeArr.sort(function(a,b){return a.dist-b.dist;});

  for(var j=0;j<iframeArr.length;j++){
    var item=iframeArr[j];
    var offscreen=item.rect.bottom<-margin||item.rect.top>viewH+margin;
    
    if(offscreen||activeCount>=maxActive){
      if(item.el.src&&item.el.src!=='about:blank'&&!item.el.dataset.mmOrigSrc){
        item.el.dataset.mmOrigSrc=item.el.src;
        item.el.src='about:blank';
        count++;
      }
    } else {
      // Restore if it was unloaded but now near viewport and under limit
      if(item.el.dataset.mmOrigSrc&&item.el.src==='about:blank'&&activeCount<maxActive){
        item.el.src=item.el.dataset.mmOrigSrc;
        delete item.el.dataset.mmOrigSrc;
      }
      if(item.el.src&&item.el.src!=='about:blank') activeCount++;
    }
    // Estimate memory for active iframes
    if(item.el.src&&item.el.src!=='about:blank'){
      iframeMemEstimateMB+=/tradingview/i.test(item.el.src)?12:6;
    }
  }
  MM.iframesUnloaded+=count;
  MM.activeIframes=activeCount;
  MM.iframeMemEstimateMB=iframeMemEstimateMB;
  return count;
}

// ─── iOS memory pressure detection (no performance.memory in Safari) ─────────
// Use a combination of DOM heuristics + iframe count + canvas count
function estimateIOSMemoryPressure(){
  if(!isIOS) return 'normal';
  var domCount=countDOM();
  var canvasCount=d.querySelectorAll('canvas').length;
  var activeIframes=d.querySelectorAll('iframe:not([src="about:blank"])').length;
  // Rough estimate: each 1000 DOM nodes ≈ 2MB, each iframe ≈ 10MB, each canvas ≈ 5MB
  var estimatedMB=(domCount/500) + (activeIframes*10) + (canvasCount*5);
  MM.iosEstimatedMB=Math.round(estimatedMB);
  if(estimatedMB>iosMemoryCeiling*0.9) return 'critical';
  if(estimatedMB>iosMemoryCeiling*0.7) return 'warning';
  return 'normal';
}

// ─── Shrink offscreen canvases ───────────────────────────────────────────────
function shrinkOffscreenCanvases(){
  var viewH=w.innerHeight||0;
  var canvases=d.querySelectorAll('canvas');
  for(var i=0;i<canvases.length;i++){
    var c=canvases[i],r=c.getBoundingClientRect();
    // Skip protected (Spline, games, etc.)
    if(c.closest('[data-spline],[data-spline-scene],[data-keep-canvas],[data-spline-hero],[data-game]')) continue;
    if(c.dataset.mmProtected) continue;
    if(r.bottom<-300||r.top>viewH+300){
      if(c.width>2||c.height>2){
        c.dataset.mmOrigW=c.width;
        c.dataset.mmOrigH=c.height;
        var ctx=c.getContext&&c.getContext('2d');
        if(ctx) ctx.clearRect(0,0,c.width,c.height);
        c.width=1; c.height=1;
      }
    } else if(c.dataset.mmOrigW){
      c.width=parseInt(c.dataset.mmOrigW,10);
      c.height=parseInt(c.dataset.mmOrigH,10);
      delete c.dataset.mmOrigW;
      delete c.dataset.mmOrigH;
    }
  }
}

// ─── Pause offscreen videos + release buffers ────────────────────────────────
function pauseOffscreenVideos(){
  var viewH=w.innerHeight||0;
  var videos=d.querySelectorAll('video');
  for(var i=0;i<videos.length;i++){
    var v=videos[i],r=v.getBoundingClientRect();
    if(r.bottom<-200||r.top>viewH+200){
      if(!v.paused){v.pause();v.dataset.mmPaused='1';}
      // On iOS critical: fully release video buffer
      if(isIOS&&MM.stats.level==='critical'&&v.src&&!v.dataset.mmOrigVideoSrc){
        v.dataset.mmOrigVideoSrc=v.src;
        v.removeAttribute('src');
        v.load(); // forces buffer release
      }
    } else {
      // Restore video source if it was stripped
      if(v.dataset.mmOrigVideoSrc){
        v.src=v.dataset.mmOrigVideoSrc;
        delete v.dataset.mmOrigVideoSrc;
      }
      if(v.dataset.mmPaused==='1'){
        try{v.play();}catch(e){}
        delete v.dataset.mmPaused;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AREA 3: SPA MEMORY LEAK PRUNING
// Targets: orphaned portals, stale modals, zombie event listeners,
// dangling WebSocket refs, unbounded store arrays, detached DOM subtrees
// ═══════════════════════════════════════════════════════════════════════════════

function pruneDetachedNodes(){
  var count=0;

  // 1. Orphaned Radix portals/popper wrappers
  var radix=d.querySelectorAll(
    '[data-radix-popper-content-wrapper]:empty,'+
    '[data-state="closed"][data-radix-portal],'+
    '[data-radix-portal]:empty'
  );
  for(var i=0;i<radix.length;i++){
    try{radix[i].parentNode&&radix[i].parentNode.removeChild(radix[i]);count++;}catch(e){}
  }

  // 2. Stale tooltips, toasts, dropdowns
  var stale=d.querySelectorAll(
    '.tippy-box:not(:visible),'+
    '[role="tooltip"]:empty,'+
    '.toast-container:empty,'+
    '[data-dismissed="true"],'+
    '[data-sonner-toast][data-removed="true"],'+
    '[data-sonner-toast][data-dismissing="true"]'
  );
  for(var j=0;j<stale.length;j++){
    try{stale[j].parentNode&&stale[j].parentNode.removeChild(stale[j]);count++;}catch(e){}
  }

  // 3. Orphaned modal backdrops (custom modals without Radix — common in this codebase)
  var backdrops=d.querySelectorAll(
    '.modal-backdrop:not(.active),'+
    '[data-overlay="true"]:not(.active),'+
    '.fixed.inset-0.z-50:empty,'+
    '[class*="modal"][aria-hidden="true"]:empty'
  );
  for(var k=0;k<backdrops.length;k++){
    try{backdrops[k].parentNode&&backdrops[k].parentNode.removeChild(backdrops[k]);count++;}catch(e){}
  }

  // 4. Zombie script tags from dynamic widget loading
  var scripts=d.querySelectorAll('script[data-widget-cleanup]');
  for(var s=0;s<scripts.length;s++){
    try{scripts[s].parentNode&&scripts[s].parentNode.removeChild(scripts[s]);count++;}catch(e){}
  }

  // 5. Empty portals created by createPortal (FilterSheet, etc.)
  var portals=d.querySelectorAll('[data-portal]:empty,[data-react-portal]:empty');
  for(var m=0;m<portals.length;m++){
    try{portals[m].parentNode&&portals[m].parentNode.removeChild(portals[m]);count++;}catch(e){}
  }

  MM.domNodesRecycled+=count;
  return count;
}

// ─── WebSocket leak detection & cleanup ──────────────────────────────────────
// MultiStepLoader, LiveMiniPreview create Binance WebSocket connections
// that may not close on route change
var trackedWebSockets=[];
var _origWebSocket=w.WebSocket;

if(_origWebSocket){
  w.WebSocket=function(url,protocols){
    var ws=protocols?new _origWebSocket(url,protocols):new _origWebSocket(url);
    trackedWebSockets.push({ws:ws,url:url,created:Date.now(),closed:false});
    var origClose=ws.close.bind(ws);
    ws.close=function(){
      for(var i=0;i<trackedWebSockets.length;i++){
        if(trackedWebSockets[i].ws===ws) trackedWebSockets[i].closed=true;
      }
      return origClose();
    };
    // Auto-prune tracking list
    if(trackedWebSockets.length>20){
      trackedWebSockets=trackedWebSockets.filter(function(t){return !t.closed;});
    }
    return ws;
  };
  // Preserve prototype for instanceof checks
  w.WebSocket.prototype=_origWebSocket.prototype;
  w.WebSocket.CONNECTING=_origWebSocket.CONNECTING;
  w.WebSocket.OPEN=_origWebSocket.OPEN;
  w.WebSocket.CLOSING=_origWebSocket.CLOSING;
  w.WebSocket.CLOSED=_origWebSocket.CLOSED;
}

function closeStaleWebSockets(){
  var now=Date.now();
  var maxAge=isLowEnd?30000:60000; // 30s or 60s
  var closedCount=0;
  for(var i=trackedWebSockets.length-1;i>=0;i--){
    var t=trackedWebSockets[i];
    if(t.closed) continue;
    // Close if tab is hidden or socket is old and page isn't visible
    var isOld=now-t.created>maxAge;
    var isHidden=d.visibilityState==='hidden';
    var ws=t.ws;
    if((isHidden||isOld)&&ws.readyState===1){
      try{ws.close();t.closed=true;closedCount++;}catch(e){}
    }
    // Clean up already-closed references
    if(ws.readyState===3) t.closed=true;
  }
  if(closedCount>0) log('Closed',closedCount,'stale WebSocket(s)');
  // Prune closed entries
  trackedWebSockets=trackedWebSockets.filter(function(t){return !t.closed;});
  return closedCount;
}
MM.getActiveWebSockets=function(){return trackedWebSockets.filter(function(t){return !t.closed&&t.ws.readyState<=1;}).length;};

// ─── Unbounded store/array pruning ───────────────────────────────────────────
// feedStore.analyses[] can grow without bound during long sessions
function pruneStoreArrays(){
  try{
    // Check if zustand stores expose their state
    if(w.__BM_FEED_STORE__&&w.__BM_FEED_STORE__.getState){
      var state=w.__BM_FEED_STORE__.getState();
      var maxItems=isLowEnd?20:50;
      if(state.analyses&&state.analyses.length>maxItems){
        w.__BM_FEED_STORE__.setState({analyses:state.analyses.slice(-maxItems)});
        log('Pruned feed store to',maxItems,'items');
      }
    }
  }catch(e){}
}

// ─── Route-change cleanup ────────────────────────────────────────────────────
// SPA route changes leave orphaned DOM, listeners, timers from previous page
var lastPathname=w.location.pathname;
function checkRouteChange(){
  var current=w.location.pathname;
  if(current===lastPathname) return;
  lastPathname=current;
  log('Route change detected →',current);
  // Aggressive cleanup on route change
  _origSetTimeout.call(w,function(){
    pruneDetachedNodes();
    closeStaleWebSockets();
    unloadOffscreenImages();
    unloadOffscreenIframes();
    shrinkOffscreenCanvases();
    revokeStaleBlobs();
    if(isLowEnd) pruneStoreArrays();
  },500);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AREA 2: ANDROID JANK ELIMINATION
// Cheap Androids have weak GPUs that choke on: backdrop-filter, large box-shadows,
// CSS animations on many elements, will-change, parallax transforms.
// Also targets iOS SE/mini class devices.
// ═══════════════════════════════════════════════════════════════════════════════

var cssInjected=false;
function injectLowEndCSS(){
  if(cssInjected) return;
  cssInjected=true;
  var s=d.createElement('style');
  s.id='bm-memory-manager-css';
  var rules=[];

  if(isUltraLow){
    // ULTRA-LOW (≤1GB): strip everything animated — EXCEPT modals/menus/buttons
    rules.push(
      '/* Ultra-low: kill animations (modals/menus excluded) */',
      '*:not([role="dialog"]):not([role="dialog"] *):not([data-state="open"]):not([data-state="open"] *):not([data-radix-popper-content-wrapper]):not([data-radix-popper-content-wrapper] *):not(nav):not(nav *):not(button):not([role="menu"]):not([role="menu"] *):not([role="menuitem"]){animation-duration:0.01s!important;animation-delay:0s!important;transition-duration:0.05s!important;}',
      '.particle-container,.confetti,.aurora,.floating-particles,.bg-particles,.color-bends,.circular-gallery{display:none!important;}',
      '.parallax,[data-parallax]{transform:none!important;}',
      // Kill all transforms except essential UI (menus, modals)
      '*:not([data-modal]):not([role="dialog"]):not([data-menu]){transform:none!important;perspective:none!important;}'
    );
  } else if(isLowEnd){
    // LOW (≤2GB): heavy reduction — EXCEPT modals/menus/buttons
    rules.push(
      '/* Low-end: reduce animations (modals/menus excluded) */',
      '*:not([role="dialog"]):not([role="dialog"] *):not([data-state="open"]):not([data-state="open"] *):not([data-radix-popper-content-wrapper]):not([data-radix-popper-content-wrapper] *):not(nav):not(nav *):not(button):not([role="menu"]):not([role="menu"] *):not([role="menuitem"]){animation-duration:0.1s!important;transition-duration:0.1s!important;}',
      '.particle-container,.confetti{opacity:0!important;pointer-events:none!important;height:0!important;overflow:hidden!important;}',
      // Reduce Spline/3D canvas DPR
      'canvas{image-rendering:optimizeSpeed!important;}'
    );
  }

  if(isLowEnd){
    rules.push(
      // BACKDROP-FILTER — single biggest GPU jank source on cheap Androids
      // Targets: glass-effect, glassmorphism, glass-surface, glass-card (used throughout app)
      '/* Backdrop-filter removal — GPU saver */',
      '.glass-effect,.glassmorphism,.glass-surface,.glass-card,.glass-panel{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(5,9,21,.92)!important;}',
      '.blur-bg,.blur-overlay,[class*="backdrop-blur"]{filter:none!important;-webkit-filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',

      // BOX-SHADOWS — compositing cost on weak GPUs
      '/* Shadow reduction */',
      '[class*="shadow-lg"],[class*="shadow-xl"],[class*="shadow-2xl"]{box-shadow:0 1px 3px rgba(0,0,0,.3)!important;}',
      '[class*="shadow-inner"]{box-shadow:inset 0 1px 2px rgba(0,0,0,.2)!important;}',

      // WILL-CHANGE — each `will-change` promotes to compositor layer, eating GPU RAM
      '/* will-change removal — prevents GPU memory bloat */',
      '*{will-change:auto!important;}',

      // GRADIENTS — complex gradients cause repaint storms
      '/* Gradient simplification */',
      '[class*="bg-gradient"]{background-image:none!important;background-color:rgba(5,9,21,.95)!important;}',

      // SCROLLBAR STYLING — smooth scrollbar CSS causes jank on Android Chrome
      '/* Remove custom scrollbar styling */',
      '::-webkit-scrollbar{display:none!important;}',
      '*{scrollbar-width:none!important;}',

      // TOUCH OPTIMIZATIONS — prevent 300ms delay, improve scroll responsiveness
      '/* Touch optimizations */',
      'a,button,[role="button"]{touch-action:manipulation!important;}',

      // TEXT RENDERING — subpixel antialiasing is expensive
      '/* Text rendering optimization */',
      'body{text-rendering:optimizeSpeed!important;-webkit-font-smoothing:antialiased!important;}'
    );
  }

  // Android-specific paint optimizations
  if(isAndroid&&isLowEnd){
    rules.push(
      '/* Android GPU paint fixes */',
      // Force hardware compositing off for non-essential elements
      '.bg-fixed{background-attachment:scroll!important;}',
      // Reduce opacity layers (each opacity<1 creates a new stacking context)
      '[class*="opacity-"][class*="hover:"]{opacity:1!important;}',
      // Kill pointer-events on decorative elements
      '.aurora,.color-bends,.bg-particles{pointer-events:none!important;opacity:0!important;}'
    );
  }

  // iOS-specific compositing fixes
  if(isIOS&&isLowEnd){
    rules.push(
      '/* iOS compositing fixes */',
      // Safari promotes too many layers with transform3d
      '*{-webkit-transform:translateZ(0)!important;}',
      '.overflow-scroll,.overflow-auto{-webkit-overflow-scrolling:touch!important;}'
    );
  }

  s.textContent=rules.join('\n');
  (d.head||d.documentElement).appendChild(s);
}

// ─── Dynamic jank detector ───────────────────────────────────────────────────
// Even mid-tier devices can jank if too much is on screen. Detect + adapt.
var longFrameCount=0;
var frameSamples=0;
function monitorFrameRate(){
  if(!w.requestAnimationFrame) return;
  var lastTime=0;
  var raf;
  function tick(now){
    if(lastTime>0){
      var delta=now-lastTime;
      frameSamples++;
      if(delta>50) longFrameCount++; // >50ms = below 20fps = jank
      // After 60 samples (~1s), decide
      if(frameSamples>=60){
        var jankRatio=longFrameCount/frameSamples;
        if(jankRatio>0.3&&!cssInjected){
          // Device is janking >30% of frames — inject low-end CSS even if tier says mid
          log('Jank detected (',Math.round(jankRatio*100)+'% slow frames) — forcing low-end CSS');
          isLowEnd=true;
          tier='low';
          MM.tier=tier;
          MM.isLowEnd=true;
          d.documentElement.setAttribute('data-memory-tier',tier);
          d.documentElement.classList.add('low-memory-device');
          injectLowEndCSS();
        }
        // Reset
        longFrameCount=0;
        frameSamples=0;
      }
    }
    lastTime=now;
    raf=w.requestAnimationFrame(tick);
  }
  // Run for first 5 seconds only, then stop monitoring
  raf=w.requestAnimationFrame(tick);
  _origSetTimeout.call(w,function(){w.cancelAnimationFrame(raf);},5000);
}

// ─── Timer/Interval throttling ───────────────────────────────────────────────
// Wrap setInterval to enforce minimum intervals on low-end devices
var _origSetInterval=w.setInterval;
var _origSetTimeout=w.setTimeout;
var activeTimers=new Set();

function throttledSetInterval(fn,ms){
  var minMs=isUltraLow?2000:(isLowEnd?1000:100);
  var actual=Math.max(ms||0,minMs);
  var id=_origSetInterval.call(w,fn,actual);
  activeTimers.add(id);
  // Auto-limit total active intervals
  if(activeTimers.size>T.maxTimers){
    var oldest=activeTimers.values().next().value;
    clearInterval(oldest);
    activeTimers.delete(oldest);
    MM.listenersThrottled++;
  }
  return id;
}

var _origClearInterval=w.clearInterval;
w.clearInterval=function(id){
  activeTimers.delete(id);
  return _origClearInterval.call(w,id);
};

// Only override on low-end to avoid breaking 3rd-party scripts on capable devices
// Expose original for scripts that need precise timing (analytics, etc.)
w.__BM_ORIG_SET_INTERVAL__=_origSetInterval;
if(isLowEnd){
  w.setInterval=throttledSetInterval;
}

// ─── Lazy-load DPR reduction ─────────────────────────────────────────────────
function reduceDPR(){
  if(!isLowEnd) return;
  // Tell CSS to use lower resolution rendering
  var maxDPR=isUltraLow?1:Math.min(dpr,1.5);
  d.documentElement.style.setProperty('--bm-dpr',String(maxDPR));
  d.documentElement.style.setProperty('--bm-img-scale',String(1/maxDPR));
}

// ─── Blob/ObjectURL cleanup ──────────────────────────────────────────────────
var trackedBlobs=[];
var _origCreateObjectURL=w.URL&&w.URL.createObjectURL;
var _origRevokeObjectURL=w.URL&&w.URL.revokeObjectURL;

if(_origCreateObjectURL&&isLowEnd){
  w.URL.createObjectURL=function(blob){
    var url=_origCreateObjectURL.call(w.URL,blob);
    trackedBlobs.push({url:url,created:Date.now()});
    // Auto-prune old blobs
    if(trackedBlobs.length>20){
      var old=trackedBlobs.shift();
      try{_origRevokeObjectURL.call(w.URL,old.url);}catch(e){}
    }
    return url;
  };
}

function revokeStaleBlobs(){
  var now=Date.now();
  var cutoff=isUltraLow?15000:30000; // 15s or 30s
  var remaining=[];
  for(var i=0;i<trackedBlobs.length;i++){
    if(now-trackedBlobs[i].created>cutoff){
      try{if(_origRevokeObjectURL) _origRevokeObjectURL.call(w.URL,trackedBlobs[i].url);}catch(e){}
    } else {
      remaining.push(trackedBlobs[i]);
    }
  }
  trackedBlobs=remaining;
}

// ─── Cache pruning (smarter than crash-shield) ──────────────────────────────
function pruneOldCaches(){
  if(!('caches' in w)||!w.caches) return;
  w.caches.keys().then(function(names){
    // Keep essential caches, delete the rest on low-end
    var essential=/spline|critical|static-v|next-data|sw-precache|workbox/i;
    var maxKeep=isUltraLow?2:(isLowEnd?4:8);
    var kept=0;
    for(var i=0;i<names.length;i++){
      if(essential.test(names[i])){kept++;continue;}
      if(kept>=maxKeep){
        w.caches.delete(names[i]);
      } else {
        kept++;
      }
    }
  }).catch(function(){});
}

// ─── localStorage/sessionStorage cleanup ────────────────────────────────────
function pruneStorage(){
  if(!isLowEnd) return;
  try{
    var maxItems=isUltraLow?15:30;
    var keys=[];
    for(var i=0;i<sessionStorage.length;i++) keys.push(sessionStorage.key(i));
    // Remove oldest items beyond limit (simple FIFO by key order)
    if(keys.length>maxItems){
      var toRemove=keys.slice(0,keys.length-maxItems);
      for(var j=0;j<toRemove.length;j++) sessionStorage.removeItem(toRemove[j]);
    }
  }catch(e){}
}

// ─── Main GC cycle ──────────────────────────────────────────────────────────
function gcCycle(){
  var now=Date.now();
  if(now-MM.lastGC<T.gcIntervalMs) return;
  MM.lastGC=now;
  MM.gcCycles++;

  var heap=heapInfo();
  var domCount=countDOM();
  var level='normal';

  // Chrome/Edge: use real heap data
  if(heap.available){
    if(heap.pct>=T.heapCritPct) level='critical';
    else if(heap.pct>=T.heapWarnPct) level='warning';
  }

  // Safari/iOS: use heuristic estimation (no performance.memory)
  if(isIOS){
    var iosLevel=estimateIOSMemoryPressure();
    // Take the worse of the two signals
    if(iosLevel==='critical') level='critical';
    else if(iosLevel==='warning'&&level==='normal') level='warning';
  }

  // DOM-based pressure detection (works on all browsers)
  if(domCount>T.maxDOMNodes*1.3) level='critical';
  else if(domCount>T.maxDOMNodes&&level==='normal') level='warning';

  // WebSocket count pressure (too many open connections)
  var wsCount=MM.getActiveWebSockets();
  if(wsCount>6&&level==='normal') level='warning';
  if(wsCount>10) level='critical';

  MM.stats={
    heapMB:heap.usedMB,
    heapPct:heap.pct,
    domNodes:domCount,
    level:level,
    tier:tier,
    gcCycles:MM.gcCycles,
    timestamp:now,
    activeWebSockets:wsCount,
    activeIframes:MM.activeIframes||0,
    iosEstimatedMB:MM.iosEstimatedMB||0
  };

  // Update brain
  B.memoryManager={level:level,tier:tier,stats:MM.stats};

  // Always run lightweight cleanup
  restoreNearbyImages();
  pauseOffscreenVideos();
  checkRouteChange();

  // Low-end: always do proactive cleanup (don't wait for warning)
  if(isLowEnd){
    unloadOffscreenImages();
    unloadOffscreenIframes();
  }

  // Warning level: medium cleanup
  if(level==='warning'||level==='critical'){
    unloadOffscreenImages();
    unloadOffscreenIframes();
    shrinkOffscreenCanvases();
    pruneDetachedNodes();
    revokeStaleBlobs();
    closeStaleWebSockets();
  }

  // Critical level: aggressive cleanup
  if(level==='critical'){
    unloadOffscreenImages(50);  // very tight margin
    unloadOffscreenIframes(50);
    pruneStorage();
    pruneOldCaches();
    pruneStoreArrays();
    closeStaleWebSockets(); // force close all when hidden
    // Request browser GC if available
    try{if(w.gc) w.gc();}catch(e){}
    log('CRITICAL memory cleanup — heap:',heap.usedMB+'MB','DOM:',domCount,'WS:',wsCount);
  }

  // Emit event for other BMBRAIN modules
  try{
    w.dispatchEvent(new CustomEvent('bm:memory-gc',{detail:MM.stats}));
  }catch(e){}

  log('GC #'+MM.gcCycles,' lvl:',level,' heap:',heap.usedMB+'MB DOM:',domCount,' WS:',wsCount,' iframes:',MM.activeIframes||0);
}

// ─── Scroll-based image management (passive, debounced) ─────────────────────
var scrollTimer=null;
function onScroll(){
  if(scrollTimer) return;
  scrollTimer=_origSetTimeout.call(w,function(){
    scrollTimer=null;
    restoreNearbyImages();
    if(isLowEnd) unloadOffscreenImages();
  },isLowEnd?150:300);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AREA 4: TAB-SWITCH MEMORY RELEASE
// When user switches away, aggressively free everything.
// When they come back, lazily restore only what's in viewport.
// Also handles iOS backgrounding (Safari kills bg tabs aggressively).
// ═══════════════════════════════════════════════════════════════════════════════

var tabHiddenAt=0;
var wasHiddenLong=false;

function onVisibilityChange(){
  if(d.visibilityState==='hidden'){
    tabHiddenAt=Date.now();

    // ── STEP 1: Unload ALL offscreen media ──
    unloadOffscreenImages(0);
    unloadOffscreenIframes(0);
    shrinkOffscreenCanvases();
    pauseOffscreenVideos();

    // ── STEP 2: Close WebSocket connections ──
    // Binance WS connections burn battery + memory in background
    closeStaleWebSockets();

    // ── STEP 3: Release caches & blobs ──
    revokeStaleBlobs();
    pruneOldCaches();
    if(isLowEnd) pruneStorage();

    // ── STEP 4: Prune DOM leaks ──
    pruneDetachedNodes();

    // ── STEP 5: Pause all RAF-based animations ──
    // Signal components to stop their animation loops
    try{w.dispatchEvent(new CustomEvent('bm:pause-animations',{detail:{reason:'tab-hidden'}}));}catch(e){}

    // ── STEP 6: iOS-specific — downsize remaining canvases ──
    if(isIOS){
      var canvases=d.querySelectorAll('canvas');
      for(var i=0;i<canvases.length;i++){
        var c=canvases[i];
        if(c.dataset.mmProtected) continue;
        if(c.width>2&&!c.dataset.mmOrigW){
          c.dataset.mmOrigW=c.width;
          c.dataset.mmOrigH=c.height;
          c.width=1;c.height=1;
        }
      }
    }

    log('Tab hidden — full memory release (images, iframes, WS, canvases)');

  } else {
    // ── TAB VISIBLE AGAIN ──
    var hiddenDuration=Date.now()-tabHiddenAt;
    wasHiddenLong=hiddenDuration>30000; // >30s

    // Resume animations
    try{w.dispatchEvent(new CustomEvent('bm:resume-animations',{detail:{hiddenMs:hiddenDuration}}));}catch(e){}

    // Gradual restore — don't slam everything back at once
    _origSetTimeout.call(w,function(){
      // First: restore just viewport images
      restoreNearbyImages(100); // tight margin — only immediate viewport
    },200);

    _origSetTimeout.call(w,function(){
      // Then: restore canvases
      var canvases=d.querySelectorAll('canvas[data-mm-orig-w]');
      for(var i=0;i<canvases.length;i++){
        var c=canvases[i],r=c.getBoundingClientRect();
        if(r.bottom>-200&&r.top<w.innerHeight+200){
          c.width=parseInt(c.dataset.mmOrigW,10);
          c.height=parseInt(c.dataset.mmOrigH,10);
          delete c.dataset.mmOrigW;
          delete c.dataset.mmOrigH;
        }
      }
    },600);

    _origSetTimeout.call(w,function(){
      // Then: restore wider viewport images and nearby iframes
      restoreNearbyImages();
      gcCycle();
    },wasHiddenLong?1200:800);

    // If hidden for >2min, do a full GC on return
    if(hiddenDuration>120000){
      _origSetTimeout.call(w,function(){
        pruneDetachedNodes();
        pruneStoreArrays();
        log('Long absence (',Math.round(hiddenDuration/1000)+'s) — deep cleanup on return');
      },2000);
    }
  }
}

// ─── iOS freeze/resume events ────────────────────────────────────────────────
// Safari fires 'pagehide'/'pageshow' instead of visibilitychange in some cases
function onPageHide(){
  // Treat same as tab hidden but more aggressive
  unloadOffscreenImages(0);
  unloadOffscreenIframes(0);
  closeStaleWebSockets();
  pauseOffscreenVideos();
  pruneDetachedNodes();
  revokeStaleBlobs();
  try{if(w.gc) w.gc();}catch(e){}
  log('pagehide — emergency memory release');
}

function onPageShow(e){
  if(e.persisted){
    // Page restored from bfcache — needs fresh GC
    _origSetTimeout.call(w,function(){
      restoreNearbyImages(100);
      gcCycle();
    },500);
  }
}

// ─── Low-memory event ────────────────────────────────────────────────────────
function onLowMemory(){
  log('LOW MEMORY — emergency cleanup');
  // Nuclear option: free everything possible
  unloadOffscreenImages(0);
  unloadOffscreenIframes(0);
  shrinkOffscreenCanvases();
  pruneDetachedNodes();
  closeStaleWebSockets();
  revokeStaleBlobs();
  pruneOldCaches();
  pruneStorage();
  pruneStoreArrays();
  pauseOffscreenVideos();
  try{if(w.gc) w.gc();}catch(e){}
  // Signal app components to enter low-memory mode
  try{w.dispatchEvent(new CustomEvent('bm:low-memory',{detail:{tier:tier,emergency:true,stats:MM.stats}}));}catch(e){}
}

// ═══════════════════════════════════════════════════════════════════════════════
// AREA 5: LOAD-TIME BOOSTERS
// Speed up initial page load, LCP, FID, and perceived performance.
// Works on ALL devices — not just low-end.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 5A: Prioritize above-fold images (boost LCP) ────────────────────────────
// Next.js Image has priority prop, but many <img> tags miss it.
// This finds the largest above-fold image and gives it fetchpriority=high.
function boostLCP(){
  var viewH=w.innerHeight||0;
  var imgs=d.querySelectorAll('img:not([fetchpriority])');
  var largest=null,largestArea=0;
  for(var i=0;i<imgs.length;i++){
    var img=imgs[i],r=img.getBoundingClientRect();
    // Only above-fold images
    if(r.top>=viewH||r.bottom<=0) continue;
    var area=(r.width||0)*(r.height||0);
    if(area>largestArea){largestArea=area;largest=img;}
  }
  if(largest&&largestArea>10000){
    largest.setAttribute('fetchpriority','high');
    largest.loading='eager';
    // If it has srcset, ensure the browser picks the right one fast
    if(largest.sizes===''){largest.sizes='100vw';}
    log('LCP boost: fetchpriority=high on',largest.src&&largest.src.substring(0,60));
  }
}

// ─── 5B: Defer below-fold images aggressively ───────────────────────────────
// Force loading=lazy on ALL images below the fold that don't already have it.
function deferBelowFoldImages(){
  var viewH=w.innerHeight||0;
  var imgs=d.querySelectorAll('img:not([loading])');
  for(var i=0;i<imgs.length;i++){
    var r=imgs[i].getBoundingClientRect();
    if(r.top>viewH+100){
      imgs[i].loading='lazy';
      // Also set decoding=async so decode doesn't block main thread
      imgs[i].decoding='async';
    }
  }
}

// ─── 5C: Smart resource hints (prefetch next-likely pages) ───────────────────
// Prefetch pages the user is likely to navigate to based on current page.
var prefetchedUrls=new Set();
function smartPrefetch(){
  if(isUltraLow) return; // Don't waste bandwidth on ultra-low devices
  var conn=n.connection||n.mozConnection||n.webkitConnection||{};
  if(conn.saveData||conn.effectiveType==='2g'||conn.effectiveType==='slow-2g') return;

  var path=w.location.pathname;
  var hints=[];

  // Homepage → most likely next pages
  if(path==='/'||path==='/home'){
    hints=['/store','/games','/community','/about'];
  }
  // Store → checkout flow
  else if(path.startsWith('/store')&&!path.includes('/checkout')){
    hints=['/store/checkout','/store/account'];
  }
  // Games → individual games
  else if(path==='/games'){
    hints=['/games/flappy-bull'];
  }

  // Prefetch as low-priority
  for(var i=0;i<hints.length&&i<3;i++){
    if(prefetchedUrls.has(hints[i])) continue;
    prefetchedUrls.add(hints[i]);
    var link=d.createElement('link');
    link.rel='prefetch';
    link.href=hints[i];
    link.as='document';
    (d.head||d.documentElement).appendChild(link);
  }
}

// ─── 5D: Intersection-based lazy hydration helper ────────────────────────────
// Heavy components below fold can defer their own hydration.
// Components can register: window.__BM_DEFER_HYDRATE__(selector, callback)
w.__BM_DEFER_HYDRATE__=function(selector,callback,opts){
  opts=opts||{};
  var margin=opts.margin||(isLowEnd?'100px':'300px');
  var run=function(){
    var el=d.querySelector(selector);
    if(!el) return;
    if(!('IntersectionObserver' in w)){callback();return;}
    var io=new IntersectionObserver(function(entries){
      for(var i=0;i<entries.length;i++){
        if(entries[i].isIntersecting){
          callback();
          io.disconnect();
          break;
        }
      }
    },{rootMargin:margin,threshold:0.01});
    io.observe(el);
  };
  if('requestIdleCallback' in w) requestIdleCallback(run,{timeout:2000});
  else _origSetTimeout.call(w,run,300);
};

// ─── 5E: Idle-time preload of critical next-page JS chunks ──────────────────
// After page is idle, preload JS chunks for likely navigation targets.
function idlePreloadChunks(){
  if(isLowEnd) return; // Skip on weak devices
  var conn=n.connection||n.mozConnection||n.webkitConnection||{};
  if(conn.saveData) return;

  // Find all <a> tags visible above fold and prefetch their destinations
  if('requestIdleCallback' in w){
    requestIdleCallback(function(){
      var links=d.querySelectorAll('a[href^="/"]');
      var count=0;
      for(var i=0;i<links.length&&count<5;i++){
        var href=links[i].getAttribute('href');
        if(!href||href==='#'||href===w.location.pathname) continue;
        if(prefetchedUrls.has(href)) continue;
        var r=links[i].getBoundingClientRect();
        // Only prefetch links visible above fold
        if(r.top<w.innerHeight&&r.bottom>0&&r.width>0){
          prefetchedUrls.add(href);
          var link=d.createElement('link');
          link.rel='prefetch';
          link.href=href;
          (d.head||d.documentElement).appendChild(link);
          count++;
        }
      }
    },{timeout:5000});
  }
}

// ─── 5F: Font display optimization ──────────────────────────────────────────
// Ensure all font-face rules use font-display: swap to prevent FOIT (Flash of Invisible Text).
function optimizeFontDisplay(){
  try{
    var sheets=d.styleSheets;
    for(var i=0;i<sheets.length;i++){
      try{
        var rules=sheets[i].cssRules||sheets[i].rules;
        if(!rules) continue;
        for(var j=0;j<rules.length;j++){
          if(rules[j].type===5){ // CSSFontFaceRule
            var style=rules[j].style;
            if(!style.fontDisplay||style.fontDisplay==='auto'||style.fontDisplay==='block'){
              style.fontDisplay='swap';
            }
          }
        }
      }catch(e){} // CORS blocks cross-origin stylesheets, skip them
    }
  }catch(e){}
}

// ─── 5G: Preconnect to frequently-used origins ──────────────────────────────
// Layout already has Google Fonts preconnect, but add runtime ones based on page.
function smartPreconnect(){
  var origins=[];
  var path=w.location.pathname;
  
  // TradingView
  if(path==='/'||path.startsWith('/community')||path.startsWith('/trading')){
    origins.push('https://s3.tradingview.com','https://www.tradingview.com');
  }
  // Binance
  if(path==='/'||path.startsWith('/community')){
    origins.push('https://api.binance.com','wss://stream.binance.com');
  }
  // Supabase
  origins.push('https://'+((w.__NEXT_DATA__&&w.__NEXT_DATA__.props&&w.__NEXT_DATA__.props.pageProps&&w.__NEXT_DATA__.props.pageProps.supabaseUrl)||'supabase.co'));
  // Spline
  if(path==='/'||path==='/about'||path==='/design'){
    origins.push('https://prod.spline.design');
  }

  for(var i=0;i<origins.length;i++){
    if(d.querySelector('link[rel="preconnect"][href="'+origins[i]+'"]')) continue;
    var link=d.createElement('link');
    link.rel='preconnect';
    link.href=origins[i];
    link.crossOrigin='anonymous';
    (d.head||d.documentElement).appendChild(link);
  }
}

// ─── 5H: Script execution deferral manager ──────────────────────────────────
// Queue non-critical scripts to run during idle time rather than immediately.
var idleQueue=[];
w.__BM_IDLE_RUN__=function(fn,priority){
  priority=priority||'low';
  if(priority==='high'){
    if('requestIdleCallback' in w) requestIdleCallback(fn,{timeout:1000});
    else _origSetTimeout.call(w,fn,100);
  } else {
    idleQueue.push(fn);
  }
};

function drainIdleQueue(){
  if(idleQueue.length===0) return;
  if('requestIdleCallback' in w){
    requestIdleCallback(function(deadline){
      while(idleQueue.length>0&&(deadline.timeRemaining()>5||deadline.didTimeout)){
        var fn=idleQueue.shift();
        try{fn();}catch(e){}
      }
      if(idleQueue.length>0) drainIdleQueue(); // Keep draining
    },{timeout:3000});
  } else {
    // Fallback: run one per frame
    var fn=idleQueue.shift();
    try{fn();}catch(e){}
    if(idleQueue.length>0) _origSetTimeout.call(w,drainIdleQueue,16);
  }
}

// ─── 5I: Reduce initial DOM parse time ──────────────────────────────────────
// Hide offscreen sections with content-visibility:auto for faster initial layout.
function applyContentVisibility(){
  // Only if browser supports it
  if(!CSS||!CSS.supports||!CSS.supports('content-visibility','auto')) return;
  var sections=d.querySelectorAll('section,article,[data-section],[role="region"]');
  var viewH=w.innerHeight||0;
  for(var i=0;i<sections.length;i++){
    var r=sections[i].getBoundingClientRect();
    if(r.top>viewH*1.5){
      sections[i].style.contentVisibility='auto';
      sections[i].style.containIntrinsicSize='auto 500px';
    }
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────
function init(){
  // Set data attributes for CSS targeting
  d.documentElement.setAttribute('data-memory-tier',tier);
  d.documentElement.setAttribute('data-memory-manager','active');
  if(isLowEnd) d.documentElement.classList.add('low-memory-device');
  if(isUltraLow) d.documentElement.classList.add('ultra-low-memory');

  // Inject CSS optimizations for low-end devices
  if(isLowEnd) injectLowEndCSS();

  // DPR reduction
  reduceDPR();

  // Start GC loop
  var gcInterval=_origSetInterval.call(w,gcCycle,T.gcIntervalMs);

  // Initial run after page settles
  _origSetTimeout.call(w,gcCycle,isLowEnd?1500:3000);

  // Event listeners
  w.addEventListener('scroll',onScroll,{passive:true});
  d.addEventListener('visibilitychange',onVisibilityChange);
  w.addEventListener('pagehide',onPageHide);
  w.addEventListener('pageshow',onPageShow);

  // iOS: listen for memory warnings via Safari's experimental API
  if(isIOS&&w.PerformanceObserver){
    try{
      var perfObs=new PerformanceObserver(function(list){
        var entries=list.getEntries();
        for(var i=0;i<entries.length;i++){
          if(entries[i].name==='self'||entries[i].entryType==='longtask'){
            // Long tasks correlate with memory pressure on iOS
            if(entries[i].duration>200) onLowMemory();
          }
        }
      });
      perfObs.observe({entryTypes:['longtask']});
    }catch(e){}
  }

  // Chrome/Edge: accurate memory measurement
  if(p&&p.measureUserAgentSpecificMemory){
    _origSetInterval.call(w,function(){
      try{
        p.measureUserAgentSpecificMemory().then(function(result){
          var totalMB=Math.round((result.bytes||0)/1048576);
          if(totalMB>0){
            MM.stats.accurateHeapMB=totalMB;
            if(isLowEnd&&totalMB>mem*600) onLowMemory();
          }
        }).catch(function(){});
      }catch(e){}
    },isLowEnd?8000:20000);
  }

  // Listen for crash shield signals
  w.addEventListener('bm:memory',function(e){
    var detail=e.detail||{};
    if(detail.level==='critical') onLowMemory();
  });

  // Frame rate jank detection (runs for first 5s after load)
  _origSetTimeout.call(w,monitorFrameRate,2000);

  // ─── LOAD-TIME BOOSTERS ─────────────────────────────────────────────────
  // Run immediately: preconnect to origins we'll need
  smartPreconnect();

  // Run after first paint: boost LCP image, defer below-fold images
  _origSetTimeout.call(w,function(){
    boostLCP();
    deferBelowFoldImages();
    optimizeFontDisplay();
    applyContentVisibility();
  },50);

  // Run after interactive: smart prefetch and idle chunk preload
  _origSetTimeout.call(w,function(){
    smartPrefetch();
    idlePreloadChunks();
    drainIdleQueue();
  },isLowEnd?4000:2000);

  // After full load: initial sweep + load-time cleanup
  w.addEventListener('load',function(){
    _origSetTimeout.call(w,function(){
      gcCycle();
      if(isLowEnd){
        pruneOldCaches();
        pruneDetachedNodes();
        closeStaleWebSockets();
      }
    },2000);
  },{once:true});

  // Periodic route-change check (for SPA navigation)
  _origSetInterval.call(w,checkRouteChange,2000);

  log('Memory Manager v3.0 active — tier:',tier,'mem:',mem+'GB','cores:',cores,'iOS:',isIOS,'android:',isAndroid);
}

// Kick off
if(d.readyState==='loading'){
  d.addEventListener('DOMContentLoaded',init,{once:true});
} else {
  init();
}

})();
