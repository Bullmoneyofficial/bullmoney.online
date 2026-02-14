// BULLMONEY COMPATIBILITY LAYER v1.0
// Universal polyfills + feature detection for ALL devices worldwide
// MUST load BEFORE any other BMBRAIN script
// Targets: iOS Safari 12+, Android 5+ WebViews, Samsung Internet 7+,
//          UC Browser, Huawei Browser, Opera Mini, Firefox Android,
//          Instagram/TikTok/Facebook/WeChat in-app browsers,
//          Chrome, Edge, Safari Desktop, Firefox Desktop
(function(){
'use strict';

var w=window,d=document,n=navigator;

// ═══════════════════════════════════════════════════════════════
// 1. CORE POLYFILLS — needed by ALL BMBRAIN scripts
// ═══════════════════════════════════════════════════════════════

// CustomEvent polyfill (IE11, older Android WebViews, UC Browser)
if(typeof w.CustomEvent!=='function'){
  var CE=function(event,params){
    params=params||{bubbles:false,cancelable:false,detail:null};
    var evt;
    try{
      evt=d.createEvent('CustomEvent');
      evt.initCustomEvent(event,params.bubbles,params.cancelable,params.detail);
    }catch(e){
      evt=d.createEvent('Event');
      evt.initEvent(event,params.bubbles,params.cancelable);
      evt.detail=params.detail;
    }
    return evt;
  };
  CE.prototype=w.Event.prototype;
  w.CustomEvent=CE;
}

// Element.closest polyfill (Android <5, Samsung Internet <6, UC Browser <12)
if(!Element.prototype.closest){
  Element.prototype.closest=function(sel){
    var el=this;
    while(el&&el.nodeType===1){
      try{if(el.matches(sel))return el;}
      catch(e){if(el.msMatchesSelector&&el.msMatchesSelector(sel))return el;}
      el=el.parentElement||el.parentNode;
    }
    return null;
  };
}

// Element.matches polyfill (older WebViews)
if(!Element.prototype.matches){
  Element.prototype.matches=
    Element.prototype.msMatchesSelector||
    Element.prototype.webkitMatchesSelector||
    function(sel){
      var nodes=(this.document||this.ownerDocument).querySelectorAll(sel);
      var i=nodes.length;
      while(--i>=0&&nodes[i]!==this){}
      return i>-1;
    };
}

// Element.remove polyfill (IE11, older WebViews)
if(!Element.prototype.remove){
  Element.prototype.remove=function(){
    if(this.parentNode)this.parentNode.removeChild(this);
  };
}

// Object.assign polyfill (Android <5, UC Browser <11)
if(typeof Object.assign!=='function'){
  Object.assign=function(target){
    if(target==null)throw new TypeError('Cannot convert undefined or null to object');
    var to=Object(target);
    for(var i=1;i<arguments.length;i++){
      var src=arguments[i];
      if(src!=null)for(var key in src){
        if(Object.prototype.hasOwnProperty.call(src,key))to[key]=src[key];
      }
    }
    return to;
  };
}

// Array.from polyfill (Android <5, Samsung Internet <5, UC Browser <11)
if(!Array.from){
  Array.from=function(arrayLike,mapFn){
    var arr=[];
    for(var i=0,len=arrayLike.length;i<len;i++){
      arr.push(mapFn?mapFn(arrayLike[i],i):arrayLike[i]);
    }
    return arr;
  };
}

// Array.prototype.find polyfill
if(!Array.prototype.find){
  Array.prototype.find=function(predicate){
    for(var i=0;i<this.length;i++){
      if(predicate(this[i],i,this))return this[i];
    }
    return undefined;
  };
}

// Array.prototype.includes polyfill (Android <7, UC Browser <12)
if(!Array.prototype.includes){
  Array.prototype.includes=function(search,start){
    start=start||0;
    if(start<0)start=Math.max(0,this.length+start);
    for(var i=start;i<this.length;i++){
      if(this[i]===search||(search!==search&&this[i]!==this[i]))return true;
    }
    return false;
  };
}

// String.prototype.includes polyfill
if(!String.prototype.includes){
  String.prototype.includes=function(search,start){
    return this.indexOf(search,start||0)!==-1;
  };
}

// String.prototype.startsWith polyfill
if(!String.prototype.startsWith){
  String.prototype.startsWith=function(search,pos){
    pos=pos||0;
    return this.substr(pos,search.length)===search;
  };
}

// String.prototype.endsWith polyfill
if(!String.prototype.endsWith){
  String.prototype.endsWith=function(search,len){
    if(len===undefined||len>this.length)len=this.length;
    return this.substring(len-search.length,len)===search;
  };
}

// NodeList.forEach polyfill (Samsung Internet <9, UC Browser)
if(w.NodeList&&!NodeList.prototype.forEach){
  NodeList.prototype.forEach=Array.prototype.forEach;
}

// Promise polyfill detection — if missing, load a minimal shim
// (Ultra-old Android WebViews <4.4.4, UC Browser <10)
if(typeof w.Promise==='undefined'){
  // Minimal synchronous promise shim — enough for our scripts
  w.Promise=function(executor){
    var self=this;self._state=0;self._value=undefined;self._handlers=[];
    function resolve(val){if(self._state!==0)return;self._state=1;self._value=val;self._handlers.forEach(function(h){h.onFulfilled(val);});}
    function reject(val){if(self._state!==0)return;self._state=2;self._value=val;self._handlers.forEach(function(h){h.onRejected(val);});}
    try{executor(resolve,reject);}catch(e){reject(e);}
  };
  w.Promise.prototype.then=function(onF,onR){
    var self=this;
    return new w.Promise(function(resolve,reject){
      function handle(){
        try{
          var val=self._state===1?(onF?onF(self._value):self._value):(onR?onR(self._value):self._value);
          resolve(val);
        }catch(e){reject(e);}
      }
      if(self._state!==0)setTimeout(handle,0);
      else self._handlers.push({onFulfilled:function(){handle();},onRejected:function(){handle();}});
    });
  };
  w.Promise.prototype['catch']=function(onR){return this.then(null,onR);};
  w.Promise.prototype['finally']=function(fn){return this.then(function(v){fn();return v;},function(e){fn();throw e;});};
  w.Promise.resolve=function(v){return new w.Promise(function(res){res(v);});};
  w.Promise.reject=function(v){return new w.Promise(function(_,rej){rej(v);});};
  w.Promise.all=function(arr){
    return new w.Promise(function(resolve,reject){
      var results=[],count=arr.length;
      if(!count){resolve(results);return;}
      arr.forEach(function(p,i){
        w.Promise.resolve(p).then(function(v){results[i]=v;if(--count===0)resolve(results);},reject);
      });
    });
  };
}

// Promise.finally polyfill (Chrome <63, Safari <11.1, Samsung Internet <8)
if(w.Promise&&!w.Promise.prototype['finally']){
  w.Promise.prototype['finally']=function(fn){
    return this.then(
      function(value){return w.Promise.resolve(fn()).then(function(){return value;});},
      function(reason){return w.Promise.resolve(fn()).then(function(){throw reason;});}
    );
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. SAFE STORAGE ACCESS — handles private/incognito mode
// Some browsers throw on ANY localStorage/sessionStorage access
// in private mode (iOS Safari <15, older Samsung Internet, UC Browser)
// ═══════════════════════════════════════════════════════════════
var _ls=null,_ss=null;
try{_ls=w.localStorage;_ls.setItem('__bm_test__','1');_ls.removeItem('__bm_test__');}
catch(e){_ls=null;}
try{_ss=w.sessionStorage;_ss.setItem('__bm_test__','1');_ss.removeItem('__bm_test__');}
catch(e){_ss=null;}

// In-memory fallback when storage is blocked
var memStore={};
var SafeStorage={
  getItem:function(key){try{return(_ls||_ss)?(_ls||_ss).getItem(key):(memStore[key]||null);}catch(e){return memStore[key]||null;}},
  setItem:function(key,val){try{if(_ls)_ls.setItem(key,val);else if(_ss)_ss.setItem(key,val);else memStore[key]=val;}catch(e){memStore[key]=val;}},
  removeItem:function(key){try{if(_ls)_ls.removeItem(key);else if(_ss)_ss.removeItem(key);delete memStore[key];}catch(e){delete memStore[key];}},
  session:{
    getItem:function(key){try{return _ss?_ss.getItem(key):(memStore['_s_'+key]||null);}catch(e){return memStore['_s_'+key]||null;}},
    setItem:function(key,val){try{if(_ss)_ss.setItem(key,val);else memStore['_s_'+key]=val;}catch(e){memStore['_s_'+key]=val;}},
    removeItem:function(key){try{if(_ss)_ss.removeItem(key);delete memStore['_s_'+key];}catch(e){delete memStore['_s_'+key];}}
  }
};
w.__BM_SAFE_STORAGE__=SafeStorage;

// ═══════════════════════════════════════════════════════════════
// 3. CSS FEATURE DETECTION — apply classes for CSS fallbacks
// ═══════════════════════════════════════════════════════════════
var docEl=d.documentElement;

// Safe CSS.supports wrapper
function cssSupports(prop,val){
  try{return w.CSS&&w.CSS.supports&&w.CSS.supports(prop,val);}
  catch(e){return false;}
}

// Detect features and add classes
var features={
  'backdrop-filter':cssSupports('backdrop-filter','blur(1px)')||cssSupports('-webkit-backdrop-filter','blur(1px)'),
  'dvh':cssSupports('height','100dvh'),
  'svh':cssSupports('height','100svh'),
  'container-queries':cssSupports('container-type','inline-size'),
  'has-selector':(function(){try{return d.querySelector(':has(*)'),true;}catch(e){return false;}})(),
  'content-visibility':cssSupports('content-visibility','auto'),
  'env-safe-area':(function(){
    // Test if env() works (iOS 11.2+, Android Chrome 69+)
    var t=d.createElement('div');
    t.style.paddingTop='env(safe-area-inset-top, 0px)';
    var works=t.style.paddingTop!=='';
    // Also test constant() for iOS 11.0-11.1
    if(!works){t.style.paddingTop='constant(safe-area-inset-top, 0px)';works=t.style.paddingTop!=='';}
    return works;
  })(),
  'webgl2':(function(){try{var c=d.createElement('canvas');return !!(c.getContext('webgl2'));}catch(e){return false;}})(),
  'webgl':(function(){try{var c=d.createElement('canvas');return !!(c.getContext('webgl')||c.getContext('experimental-webgl'));}catch(e){return false;}})(),
  'intersection-observer':'IntersectionObserver' in w,
  'resize-observer':'ResizeObserver' in w,
  'visual-viewport':!!(w.visualViewport),
  'touch':'ontouchstart' in w||n.maxTouchPoints>0,
  'passive-events':(function(){var s=false;try{var o=Object.defineProperty({},'passive',{get:function(){s=true;return true;}});w.addEventListener('__bm_test__',null,o);w.removeEventListener('__bm_test__',null,o);}catch(e){}return s;})(),
  'abort-controller':'AbortController' in w,
  'fetch':'fetch' in w,
  'service-worker':'serviceWorker' in n,
  'push-api':'PushManager' in w,
  'notification':'Notification' in w,
  'web-share':n.share!==undefined,
  'idle-callback':'requestIdleCallback' in w,
  'performance-memory':!!(w.performance&&w.performance.memory),
  'performance-observer':'PerformanceObserver' in w,
  'connection-api':!!(n.connection||n.mozConnection||n.webkitConnection)
};

// Apply feature classes to <html>
for(var feat in features){
  if(features[feat])docEl.classList.add('has-'+feat);
  else docEl.classList.add('no-'+feat);
}

// Store for JS access
w.__BM_FEATURES__=features;

// ═══════════════════════════════════════════════════════════════
// 4. SAFE-AREA / VIEWPORT NORMALIZATION — works on ALL devices
// Handles: iOS notch, Android punch-hole cameras, Dynamic Island,
// foldable phones, tablets, desktop
// ═══════════════════════════════════════════════════════════════

// Set --vh for mobile viewport (100vh bug on iOS/Android)
function setVH(){
  var vh=w.innerHeight*0.01;
  docEl.style.setProperty('--vh',vh+'px');
  docEl.style.setProperty('--app-height',w.innerHeight+'px');
  docEl.style.setProperty('--app-width',w.innerWidth+'px');
  // Dynamic viewport height (fallback for browsers without dvh)
  if(!features.dvh){
    docEl.style.setProperty('--dvh',vh+'px');
  }
}
setVH();
w.addEventListener('resize',setVH,features['passive-events']?{passive:true}:false);
if(features['visual-viewport']){
  w.visualViewport.addEventListener('resize',setVH,features['passive-events']?{passive:true}:false);
}
w.addEventListener('orientationchange',function(){setTimeout(setVH,100);},features['passive-events']?{passive:true}:false);

// Safe area fallbacks for devices without env() support
if(!features['env-safe-area']){
  docEl.style.setProperty('--safe-top','0px');
  docEl.style.setProperty('--safe-bottom','0px');
  docEl.style.setProperty('--safe-left','0px');
  docEl.style.setProperty('--safe-right','0px');
} else {
  // Set safe area CSS custom properties using env() with constant() fallback
  var safeAreaCSS=d.createElement('style');
  safeAreaCSS.id='bm-safe-area';
  safeAreaCSS.textContent=[
    ':root{',
    '  --safe-top:env(safe-area-inset-top,constant(safe-area-inset-top,0px));',
    '  --safe-bottom:env(safe-area-inset-bottom,constant(safe-area-inset-bottom,0px));',
    '  --safe-left:env(safe-area-inset-left,constant(safe-area-inset-left,0px));',
    '  --safe-right:env(safe-area-inset-right,constant(safe-area-inset-right,0px));',
    '}'
  ].join('');
  if(d.head)d.head.appendChild(safeAreaCSS);
}

// ═══════════════════════════════════════════════════════════════
// 5. CROSS-BROWSER EVENT LISTENER OPTIONS
// Older browsers don't support passive/once options
// ═══════════════════════════════════════════════════════════════
w.__BM_PASSIVE__=features['passive-events']?{passive:true}:false;
w.__BM_PASSIVE_ONCE__=features['passive-events']?{passive:true,once:true}:false;

// ═══════════════════════════════════════════════════════════════
// 6. INTERSECTION OBSERVER POLYFILL — lightweight fallback
// For iOS <12.2, Android <5.1, UC Browser <12.0
// Instead of full polyfill, provide a simple scroll-based fallback
// ═══════════════════════════════════════════════════════════════
if(!features['intersection-observer']){
  w.IntersectionObserver=function(callback,options){
    this._callback=callback;
    this._elements=[];
    this._rootMargin=options&&options.rootMargin||'0px';
    this._threshold=options&&options.threshold||0;
    var self=this;
    this._check=function(){
      var entries=[];
      for(var i=0;i<self._elements.length;i++){
        var el=self._elements[i];
        var rect=el.getBoundingClientRect();
        var viewH=w.innerHeight||d.documentElement.clientHeight;
        var viewW=w.innerWidth||d.documentElement.clientWidth;
        var isIntersecting=rect.top<viewH&&rect.bottom>0&&rect.left<viewW&&rect.right>0;
        entries.push({
          target:el,
          isIntersecting:isIntersecting,
          boundingClientRect:rect,
          intersectionRatio:isIntersecting?1:0,
          time:Date.now()
        });
      }
      if(entries.length)callback(entries,self);
    };
    this._timer=setInterval(this._check,300);
    w.addEventListener('scroll',this._check,w.__BM_PASSIVE__);
  };
  w.IntersectionObserver.prototype.observe=function(el){
    this._elements.push(el);
    this._check();
  };
  w.IntersectionObserver.prototype.unobserve=function(el){
    this._elements=this._elements.filter(function(e){return e!==el;});
  };
  w.IntersectionObserver.prototype.disconnect=function(){
    this._elements=[];
    clearInterval(this._timer);
    w.removeEventListener('scroll',this._check);
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. FETCH POLYFILL — for very old WebViews
// ═══════════════════════════════════════════════════════════════
if(!features.fetch){
  w.fetch=function(url,opts){
    opts=opts||{};
    return new w.Promise(function(resolve,reject){
      var xhr=new XMLHttpRequest();
      xhr.open(opts.method||'GET',url,true);
      if(opts.headers){
        var hdr=opts.headers;
        for(var key in hdr){
          if(Object.prototype.hasOwnProperty.call(hdr,key))xhr.setRequestHeader(key,hdr[key]);
        }
      }
      xhr.onload=function(){
        resolve({
          ok:xhr.status>=200&&xhr.status<300,
          status:xhr.status,
          statusText:xhr.statusText,
          text:function(){return w.Promise.resolve(xhr.responseText);},
          json:function(){return w.Promise.resolve(JSON.parse(xhr.responseText));},
          blob:function(){return w.Promise.resolve(new Blob([xhr.response]));},
          headers:{get:function(name){return xhr.getResponseHeader(name);}},
          clone:function(){return this;}
        });
      };
      xhr.onerror=function(){reject(new TypeError('Network request failed'));};
      xhr.ontimeout=function(){reject(new TypeError('Network request timed out'));};
      if(opts.signal&&opts.signal.addEventListener){
        opts.signal.addEventListener('abort',function(){xhr.abort();reject(new DOMException('Aborted','AbortError'));});
      }
      xhr.send(opts.body||null);
    });
  };
}

// ═══════════════════════════════════════════════════════════════
// 8. GLOBAL ERROR BOUNDARY — catch uncaught errors that crash the page
// Critical for in-app browsers that have quirky JS engines
// ═══════════════════════════════════════════════════════════════
var errorCount=0;
var MAX_ERRORS=15; // Stop logging after 15 to prevent log spam
w.addEventListener('error',function(e){
  if(errorCount>=MAX_ERRORS)return;
  errorCount++;
  // Don't crash the whole app for non-critical errors
  var msg=e.message||'';
  var src=e.filename||'';
  // Suppress known non-critical errors
  if(msg.indexOf('ResizeObserver')!==-1)return; // ResizeObserver loop — benign
  if(msg.indexOf('Script error')!==-1)return; // Cross-origin script errors — can't fix
  if(msg.indexOf('Loading chunk')!==-1||msg.indexOf('ChunkLoadError')!==-1){
    // Next.js chunk loading failure — try reload once
    var reloaded=SafeStorage.session.getItem('bm_chunk_reload');
    if(!reloaded){
      SafeStorage.session.setItem('bm_chunk_reload','1');
      w.location.reload();
    }
    return;
  }
  // Log for debugging in development
  if(w.location.hostname==='localhost'){
    console.warn('[BM Compat] Caught error:',msg,'from:',src);
  }
},true);

// Unhandled promise rejection handler
w.addEventListener('unhandledrejection',function(e){
  if(errorCount>=MAX_ERRORS)return;
  errorCount++;
  var reason=e.reason||{};
  var msg=typeof reason==='string'?reason:(reason.message||'');
  // Suppress chunk loading errors
  if(msg.indexOf('Loading chunk')!==-1||msg.indexOf('ChunkLoadError')!==-1){
    e.preventDefault();
    var reloaded=SafeStorage.session.getItem('bm_chunk_reload');
    if(!reloaded){
      SafeStorage.session.setItem('bm_chunk_reload','1');
      w.location.reload();
    }
    return;
  }
  // Suppress Firebase/Supabase auth errors (non-critical)
  if(msg.indexOf('auth')!==-1&&msg.indexOf('token')!==-1){
    e.preventDefault();
    return;
  }
});

// Clear chunk reload flag on successful load
w.addEventListener('load',function(){
  setTimeout(function(){SafeStorage.session.removeItem('bm_chunk_reload');},3000);
},w.__BM_PASSIVE_ONCE__||false);

// ═══════════════════════════════════════════════════════════════
// 9. CSS COMPATIBILITY INJECTION
// Fix known cross-browser CSS issues
// ═══════════════════════════════════════════════════════════════
var compatCSS=d.createElement('style');
compatCSS.id='bm-compat-css';
var cssRules=[];

// iOS Safari: Fix 100vh bug (address bar counts in vh)
cssRules.push(
  '/* iOS 100vh fix */',
  '.h-screen,.min-h-screen{height:100vh;height:calc(var(--vh,1vh) * 100);height:100dvh;}',
  '.min-h-screen{min-height:100vh;min-height:calc(var(--vh,1vh) * 100);min-height:100dvh;}'
);

// Fix -webkit-fill-available (not supported on Android/Firefox)
cssRules.push(
  '/* Safe height fallbacks */',
  '@supports not (-webkit-touch-callout:none){',
  '  .min-h-screen{min-height:100vh!important;}',
  '}'
);

// Fix backdrop-filter for browsers that need -webkit prefix
cssRules.push(
  '/* Backdrop-filter prefix fallback */',
  '@supports not (backdrop-filter:blur(1px)){',
  '  .backdrop-blur-sm,.backdrop-blur-md,.backdrop-blur-lg,.backdrop-blur-xl{',
  '    -webkit-backdrop-filter:blur(8px);',
  '    background-color:rgba(0,0,0,0.7)!important;',
  '  }',
  '}'
);

// Fix for Samsung Internet scrollbar issues
cssRules.push(
  '/* Samsung Internet scroll fix */',
  '@media screen and (-webkit-min-device-pixel-ratio:0){',
  '  html,body{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;}',
  '}'
);

// Fix for Firefox Android touch-action
cssRules.push(
  '/* Firefox touch-action fix */',
  '@-moz-document url-prefix(){',
  '  html,body{touch-action:pan-y pan-x!important;overflow-y:auto!important;}',
  '  a,button,[role="button"]{touch-action:manipulation!important;}',
  '}'
);

// Ensure visibility on all devices
cssRules.push(
  '/* Universal visibility */',
  'body{opacity:1!important;visibility:visible!important;}',
  '#__next,#root,[data-nextjs-scroll-focus-boundary]{min-height:100vh;min-height:calc(var(--vh,1vh)*100);}',
  '/* Prevent content flash */',
  '.hydrating{opacity:0;animation:bm-reveal .3s ease-out .1s forwards;}',
  '@keyframes bm-reveal{to{opacity:1;}}'
);

// Fix for Huawei browser font rendering
cssRules.push(
  '/* Huawei/HarmonyOS font fix */',
  'body{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue","HarmonyOS Sans",Arial,sans-serif!important;}'
);

// Mac Safari / Mac Chrome desktop fixes
cssRules.push(
  '/* ═══ Mac Desktop Fixes ═══ */',
  '/* Retina text rendering (M1-M6 Apple Silicon + Intel Mac) */',
  'html[data-os="macos"] body{',
  '  -webkit-font-smoothing:antialiased;',
  '  -moz-osx-font-smoothing:grayscale;',
  '  text-rendering:optimizeLegibility;',
  '}',
  '/* Mac Safari: fix elastic overscroll bleed on edges */',
  'html.mac-safari body{',
  '  overscroll-behavior-y:contain;',
  '  overscroll-behavior-x:none;',
  '}',
  '/* Mac Safari: fix backdrop-filter jitter during trackpad scroll */',
  'html.mac-safari .backdrop-blur-sm,html.mac-safari .backdrop-blur-md,html.mac-safari .backdrop-blur-lg,html.mac-safari .backdrop-blur-xl{',
  '  transform:translateZ(0);',
  '  -webkit-transform:translateZ(0);',
  '  will-change:transform;',
  '}',
  '/* Mac Safari smooth scrollbar appearance */',
  '@supports (-webkit-touch-callout:none){',
  '  ::-webkit-scrollbar{width:8px;height:8px;}',
  '  ::-webkit-scrollbar-track{background:transparent;}',
  '  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px;}',
  '  ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.25);}',
  '}',
  '/* Mac Chrome: GPU acceleration for glass effects */',
  'html.mac-chrome .glass-effect,html.mac-chrome .glassmorphism{',
  '  transform:translateZ(0);',
  '  backface-visibility:hidden;',
  '}',
  '/* Apple Silicon: can handle more effects */',
  'html.apple-silicon .particle-container,html.apple-silicon .aurora{',
  '  will-change:transform,opacity;',
  '}',
  '/* Intel Mac: reduce GPU load on older machines */',
  'html.intel-mac .particle-container{will-change:auto;}',
  'html.intel-mac .aurora{animation-duration:8s!important;}'
);

// Desktop scroll normalization
cssRules.push(
  '/* ═══ Desktop Scroll Normalization ═══ */',
  '/* Smooth scollbar for all desktop browsers */',
  'html.is-desktop{',
  '  scrollbar-width:thin;',
  '  scrollbar-color:rgba(255,255,255,0.15) transparent;',
  '  scroll-behavior:auto;',
  '}',
  'html.is-desktop::-webkit-scrollbar{width:8px;height:8px;}',
  'html.is-desktop::-webkit-scrollbar-track{background:transparent;}',
  'html.is-desktop::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px;border:2px solid transparent;background-clip:content-box;}',
  'html.is-desktop::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.3);background-clip:content-box;}',
  '/* Desktop viewport change: prevent layout shift */',
  'html.is-desktop body{',
  '  overflow-y:scroll;',
  '  overflow-x:hidden;',
  '}',
  '/* Desktop: ensure click targets are accessible */',
  'html.is-desktop a,html.is-desktop button,html.is-desktop [role="button"]{',
  '  cursor:pointer;',
  '}',
  '/* Desktop hover effects only when pointer is fine */',
  '@media (hover:hover) and (pointer:fine){',
  '  a:hover,button:hover,[role="button"]:hover{transition:all .15s ease;}',
  '  .hover-scale:hover{transform:scale(1.02);}',
  '  .hover-glow:hover{box-shadow:0 0 20px rgba(255,255,255,0.1);}',
  '}',
  '/* Hybrid devices (touch laptops): increase touch targets */'
);

// Enhanced touch/scroll for all devices
cssRules.push(
  '/* ═══ Universal Touch & Scroll Enhancements ═══ */',
  '/* Prevent text selection on interactive elements */',
  'button,[role="button"],a,.no-select{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}',
  '/* Allow text selection on content areas */',
  'p,article,span,.selectable,[contenteditable]{-webkit-user-select:text;user-select:text;}',
  '/* Smooth momentum scrolling everywhere */',
  '.scroll-container,[data-scroll],[role="listbox"],[role="menu"]{',
  '  -webkit-overflow-scrolling:touch;',
  '  overflow-scrolling:touch;',
  '  overscroll-behavior:contain;',
  '}',
  '/* Horizontal scroll containers */',
  '.scroll-x,.overflow-x-auto,.overflow-x-scroll{',
  '  -webkit-overflow-scrolling:touch;',
  '  scroll-snap-type:x mandatory;',
  '  scrollbar-width:none;',
  '}',
  '.scroll-x::-webkit-scrollbar{display:none;}',
  '/* Virtual keyboard compensation */',
  'html.keyboard-open body{',
  '  padding-bottom:var(--keyboard-height,0px);',
  '}',
  'html.keyboard-open input:focus,html.keyboard-open textarea:focus{',
  '  scroll-margin-bottom:calc(var(--keyboard-height,0px) + 20px);',
  '}',
  '/* Tap highlight removal for all webkit browsers */',
  'html{-webkit-tap-highlight-color:transparent;-webkit-tap-highlight-color:rgba(0,0,0,0);}'
);

// Fix for Opera Mini rendering
cssRules.push(
  '/* Opera Mini graceful degradation */',
  '@media all and (-o-min-device-pixel-ratio:0/1){',
  '  .glass-effect,.glassmorphism{backdrop-filter:none!important;background:rgba(5,9,21,.9)!important;}',
  '  .particle-container,.confetti,.aurora{display:none!important;}',
  '}'
);

compatCSS.textContent=cssRules.join('\n');
if(d.head)d.head.appendChild(compatCSS);
else d.addEventListener('DOMContentLoaded',function(){d.head.appendChild(compatCSS);},{once:true});

// ═══════════════════════════════════════════════════════════════
// 10. PLATFORM DETECTION — Enhanced for worldwide device coverage
// ═══════════════════════════════════════════════════════════════
var ua=n.userAgent||'';
var platform={
  // OS
  isIOS:/iphone|ipad|ipod/i.test(ua)||(/macintosh/i.test(ua)&&n.maxTouchPoints>1),
  isAndroid:/android/i.test(ua),
  isWindows:/windows/i.test(ua),
  isMac:/macintosh|mac os/i.test(ua)&&!(n.maxTouchPoints>1),
  isLinux:/linux/i.test(ua)&&!/android/i.test(ua),
  isChromeOS:/cros/i.test(ua),
  isHarmonyOS:/harmonyos/i.test(ua),
  
  // Device type
  isMobile:/mobi|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua),
  isTablet:/ipad|tablet|playbook|silk/i.test(ua)||((/mobi|android/i.test(ua))&&Math.min(screen.width||0,screen.height||0)>600),
  isFoldable:screen.width>0&&screen.height>0&&(screen.width/screen.height>2.1||screen.height/screen.width>2.1),

  // Browser
  isSafari:/safari/i.test(ua)&&!/chrome|chromium|edg|opr|opera|brave|vivaldi|samsung/i.test(ua),
  isChrome:/chrome|chromium/i.test(ua)&&!/edg|opr|opera|brave|vivaldi|samsung/i.test(ua),
  isFirefox:/firefox|fxios/i.test(ua),
  isEdge:/edg\//i.test(ua),
  isSamsungInternet:/samsungbrowser/i.test(ua),
  isUCBrowser:/ucbrowser|ubrowser/i.test(ua),
  isOperaMini:/opera mini/i.test(ua),
  isOpera:/opr\//i.test(ua)||/opera/i.test(ua),
  isBrave:/brave/i.test(ua),
  isVivaldi:/vivaldi/i.test(ua),
  isHuaweiBrowser:/huaweibrowser|hmscore/i.test(ua),
  isYandex:/yabrowser/i.test(ua),
  isQQBrowser:/qqbrowser|mqqbrowser/i.test(ua),
  isBaidu:/baidu|baidubrowser/i.test(ua),
  isMIUI:/miuibrowser/i.test(ua),
  
  // WebView / In-app
  isWebView:/\bwv\b/i.test(ua)||(/iphone|ipad|ipod/i.test(ua)&&!/safari/i.test(ua)),
  isInstagram:/instagram/i.test(ua),
  isTikTok:/tiktok|bytedance|musical_ly/i.test(ua),
  isFacebook:/fban|fbav|fb_iab|facebook/i.test(ua),
  isTwitterX:/twitter/i.test(ua),
  isSnapchat:/snapchat/i.test(ua),
  isWeChat:/micromessenger|wechat/i.test(ua),
  isLine:/line\//i.test(ua),
  isTelegram:/telegram/i.test(ua),
  isDiscord:/discord/i.test(ua),
  isLinkedin:/linkedin/i.test(ua),
  isPinterest:/pinterest/i.test(ua),
  isReddit:/reddit/i.test(ua),
  isWhatsApp:/whatsapp/i.test(ua),
  isGoogleApp:/gsa\//i.test(ua),

  // Capabilities
  hasTouch:'ontouchstart' in w||n.maxTouchPoints>0,
  hasHover:w.matchMedia?w.matchMedia('(hover:hover)').matches:true,
  hasPointer:w.matchMedia?w.matchMedia('(pointer:fine)').matches:false,
  prefersReducedMotion:w.matchMedia?w.matchMedia('(prefers-reduced-motion:reduce)').matches:false,
  prefersDark:w.matchMedia?w.matchMedia('(prefers-color-scheme:dark)').matches:true,
  isStandalone:w.matchMedia?w.matchMedia('(display-mode:standalone)').matches:false,
  isPWA:w.navigator.standalone===true||(w.matchMedia?w.matchMedia('(display-mode:standalone)').matches:false),
  
  // Hardware
  memory:n.deviceMemory||4,
  cores:n.hardwareConcurrency||4,
  dpr:Math.min(w.devicePixelRatio||1,3),
  screenW:screen.width||0,
  screenH:screen.height||0
};

// Any in-app browser at all?
platform.isInApp=platform.isInstagram||platform.isTikTok||platform.isFacebook||
  platform.isTwitterX||platform.isSnapchat||platform.isWeChat||platform.isLine||
  platform.isTelegram||platform.isDiscord||platform.isLinkedin||platform.isPinterest||
  platform.isReddit||platform.isWhatsApp||platform.isGoogleApp||platform.isWebView;

// Desktop?
platform.isDesktop=!platform.isMobile&&!platform.isTablet;

// Safari on iOS specifically
platform.isIOSSafari=platform.isIOS&&platform.isSafari;

// Apply data attributes for CSS targeting
docEl.setAttribute('data-platform-os',
  platform.isIOS?'ios':platform.isAndroid?'android':platform.isWindows?'windows':
  platform.isMac?'macos':platform.isChromeOS?'chromeos':platform.isHarmonyOS?'harmonyos':
  platform.isLinux?'linux':'unknown'
);
docEl.setAttribute('data-platform-device',
  platform.isTablet?'tablet':platform.isMobile?'mobile':'desktop'
);

// Browser-specific class
if(platform.isSamsungInternet)docEl.classList.add('samsung-browser','samsung-scroll');
if(platform.isUCBrowser)docEl.classList.add('uc-browser');
if(platform.isOperaMini)docEl.classList.add('opera-mini','reduce-effects');
if(platform.isHuaweiBrowser)docEl.classList.add('huawei-browser');
if(platform.isMIUI)docEl.classList.add('miui-browser');
if(platform.isIOSSafari){docEl.classList.add('is-safari','is-ios-safari','safari-browser','safari-scroll');}
if(platform.isChrome){docEl.classList.add('chrome-browser','chrome-scroll');}
if(platform.isFirefox)docEl.classList.add('firefox-browser');
if(platform.isInApp){docEl.classList.add('inapp-browser','inapp-scroll');}
if(platform.isFoldable)docEl.classList.add('foldable-device');
if(platform.isPWA)docEl.classList.add('is-pwa');
if(platform.prefersReducedMotion)docEl.classList.add('reduce-motion','reduce-effects');
if(platform.isStandalone)docEl.classList.add('standalone-mode');

// Store globally
w.__BM_PLATFORM__=platform;

// ═══════════════════════════════════════════════════════════════
// 11. REQUESTIDLECALLBACK POLYFILL
// Missing on: Safari (all), iOS Safari, Samsung Internet <14
// ═══════════════════════════════════════════════════════════════
if(!features['idle-callback']){
  w.requestIdleCallback=function(cb,opts){
    var timeout=(opts&&opts.timeout)||50;
    var start=Date.now();
    return setTimeout(function(){
      cb({
        didTimeout:Date.now()-start>=timeout,
        timeRemaining:function(){return Math.max(0,50-(Date.now()-start));}
      });
    },1);
  };
  w.cancelIdleCallback=function(id){clearTimeout(id);};
}

// ═══════════════════════════════════════════════════════════════
// READY
// ═══════════════════════════════════════════════════════════════
w.__BM_COMPAT__={
  version:'1.1',
  features:features,
  platform:platform,
  SafeStorage:SafeStorage,
  ready:true
};

// Register with global Brain orchestrator (if already loaded)
if(w.__BM_BRAIN__&&w.__BM_BRAIN__.register){
  w.__BM_BRAIN__.register('compat',w.__BM_COMPAT__);
}

try{w.dispatchEvent(new CustomEvent('bm:compat-ready',{detail:w.__BM_COMPAT__}));}catch(e){}

if(w.location.hostname==='localhost'){
  console.log('[BM Compat] v1.1 ready —',
    'OS:',platform.isIOS?'iOS':platform.isAndroid?'Android':platform.isMac?'macOS':platform.isWindows?'Windows':'Other',
    '| Browser:',platform.isSamsungInternet?'Samsung':platform.isUCBrowser?'UC':platform.isChrome?'Chrome':platform.isSafari?'Safari':platform.isFirefox?'Firefox':'Other',
    '| InApp:',platform.isInApp,
    '| Desktop:',platform.isDesktop,
    '| Features:',Object.keys(features).filter(function(k){return features[k];}).length+'/'+Object.keys(features).length
  );
}
})();
