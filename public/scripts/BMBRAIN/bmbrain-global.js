// ═══════════════════════════════════════════════════════════════
// BULLMONEY BRAIN — Global Runtime Orchestrator v1.0
// Coordinates ALL BMBRAIN scripts into a unified global API
// Ensures correct load order, shared state, and cross-script events
// Loads: afterInteractive (right after compat-layer.js)
// ═══════════════════════════════════════════════════════════════
(function(){
'use strict';
var w=window,d=document,n=navigator,docEl=d.documentElement;

// ── Global Brain Namespace ──
// All BMBRAIN scripts register into this object
var B=w.__BM_BRAIN__=w.__BM_BRAIN__||{};
B.version='1.0';
B.ready=false;
B.modules={};
B.moduleOrder=[];

// Track which modules have loaded
var loaded={};
var pending=[];

// ═══════════════════════════════════════════════════════════
// 1. MODULE REGISTRATION — scripts call this to join the Brain
// ═══════════════════════════════════════════════════════════
B.register=function(name,api){
  if(loaded[name])return;
  loaded[name]=true;
  B.modules[name]=api||{};
  B.moduleOrder.push(name);

  // Dispatch per-module event
  try{w.dispatchEvent(new CustomEvent('bm:module-loaded',{detail:{name:name,api:api}}));}catch(e){}

  // Check if all expected modules are loaded
  checkAllReady();
};

// ═══════════════════════════════════════════════════════════
// 2. DEPENDENCY WAITING — scripts can wait for other modules
// ═══════════════════════════════════════════════════════════
B.whenReady=function(moduleName,callback){
  if(loaded[moduleName]){
    try{callback(B.modules[moduleName]);}catch(e){}
    return;
  }
  pending.push({module:moduleName,fn:callback});
};

B.whenAllReady=function(callback){
  if(B.ready){
    try{callback(B);}catch(e){}
    return;
  }
  pending.push({module:'__ALL__',fn:callback});
};

function checkAllReady(){
  // Process pending callbacks for loaded modules
  var stillPending=[];
  for(var i=0;i<pending.length;i++){
    var p=pending[i];
    if(p.module==='__ALL__'){
      if(B.ready){try{p.fn(B);}catch(e){}}
      else stillPending.push(p);
    }else if(loaded[p.module]){
      try{p.fn(B.modules[p.module]);}catch(e){}
    }else{
      stillPending.push(p);
    }
  }
  pending=stillPending;
}

// ═══════════════════════════════════════════════════════════
// 3. GLOBAL EVENT BUS — cross-script communication
// ═══════════════════════════════════════════════════════════
var listeners={};

B.on=function(event,handler){
  if(!listeners[event])listeners[event]=[];
  listeners[event].push(handler);
  return function(){B.off(event,handler);};
};

B.off=function(event,handler){
  if(!listeners[event])return;
  listeners[event]=listeners[event].filter(function(h){return h!==handler;});
};

B.emit=function(event,data){
  // Internal listeners
  if(listeners[event]){
    for(var i=0;i<listeners[event].length;i++){
      try{listeners[event][i](data);}catch(e){}
    }
  }
  // Also dispatch as DOM CustomEvent for React/other frameworks
  try{w.dispatchEvent(new CustomEvent('bm:'+event,{detail:data}));}catch(e){}
};

// ═══════════════════════════════════════════════════════════
// 4. SHARED STATE — unified global state for all scripts
// ═══════════════════════════════════════════════════════════
B.state={
  // Device info (populated by device-detect + device-capabilities)
  device:w.__BM_DEVICE__||{},
  platform:w.__BM_PLATFORM__||{},
  features:w.__BM_FEATURES__||{},
  // Runtime state
  memory:null,
  network:null,
  input:null,
  push:null
};

// Update state when modules load
B.setState=function(key,value){
  B.state[key]=value;
  B.emit('state-change',{key:key,value:value});
};

// ═══════════════════════════════════════════════════════════
// 5. GLOBAL CONVENIENCE API — one-stop access to everything
// ═══════════════════════════════════════════════════════════
// These getters lazily resolve so they work regardless of load order

Object.defineProperty(B,'haptic',{get:function(){return w.__BM_HAPTIC__||{supported:false,light:function(){},medium:function(){},heavy:function(){},success:function(){},error:function(){},notification:function(){},pattern:function(){}};}});
Object.defineProperty(B,'push',{get:function(){return w.__BM_PUSH__||{supported:false,subscribe:function(){return Promise.resolve({ok:false});},getState:function(){return{supported:false};}};}});
Object.defineProperty(B,'input',{get:function(){return w.__BM_INPUT__||{keyboardActive:function(){return false;},gamepadConnected:function(){return false;}};}});
Object.defineProperty(B,'storage',{get:function(){return w.__BM_SAFE_STORAGE__||{getItem:function(){return null;},setItem:function(){},removeItem:function(){}};}});
Object.defineProperty(B,'compat',{get:function(){return w.__BM_COMPAT__||{ready:false};}});
Object.defineProperty(B,'crash',{get:function(){return w.__BM_CRASH_SHIELD__||{active:false};}});
Object.defineProperty(B,'network',{get:function(){return w.__BM_NETWORK__||{};}});
Object.defineProperty(B,'wakeLock',{get:function(){return w.__BM_WAKE_LOCK__||{supported:false,acquire:function(){return Promise.resolve(false);},release:function(){}};}});

// ═══════════════════════════════════════════════════════════
// 6. SCRIPT LOADER — load remaining BMBRAIN scripts in order
// ═══════════════════════════════════════════════════════════
var SCRIPTS_AFTER_INTERACTIVE=[
  '/scripts/BMBRAIN/mobile-crash-shield.js',
  '/scripts/BMBRAIN/inapp-shield.js'
];

var SCRIPTS_ON_IDLE=[
  '/scripts/device-detect.js',
  '/scripts/BMBRAIN/device-capabilities.js',
  '/scripts/BMBRAIN/input-controller.js',
  '/scripts/BMBRAIN/push-manager.js',
  '/scripts/BMBRAIN/network-optimizer.js',
  '/scripts/BMBRAIN/offline-detect.js'
];

function loadScript(src,callback){
  var s=d.createElement('script');
  s.src=src;
  s.async=true;
  if(callback){
    s.onload=function(){callback(null);};
    s.onerror=function(){callback(new Error('Failed: '+src));};
  }
  (d.head||d.documentElement).appendChild(s);
}

function loadSequential(scripts,idx,done){
  if(idx>=scripts.length){if(done)done();return;}
  loadScript(scripts[idx],function(){
    loadSequential(scripts,idx+1,done);
  });
}

function loadOnIdle(scripts){
  var idx=0;
  function next(){
    if(idx>=scripts.length){
      // All scripts loaded — mark brain as ready
      B.ready=true;
      B.emit('ready',B);
      try{w.dispatchEvent(new CustomEvent('bm:brain-ready',{detail:B}));}catch(e){}
      checkAllReady();
      return;
    }
    var src=scripts[idx++];
    // Skip network-optimizer if route prefetch is disabled
    if(src.indexOf('network-optimizer')!==-1&&w.__BM_ENABLE_ROUTE_PREFETCH__===false){
      next();
      return;
    }
    loadScript(src,function(){
      // Use requestIdleCallback between scripts to not block main thread
      if(w.requestIdleCallback){
        w.requestIdleCallback(next,{timeout:800});
      }else{
        setTimeout(next,50);
      }
    });
  }
  next();
}

// ═══════════════════════════════════════════════════════════
// 7. AUTO-REGISTER EXISTING MODULES
// Scripts that loaded before the orchestrator
// ═══════════════════════════════════════════════════════════
if(w.__BM_COMPAT__&&w.__BM_COMPAT__.ready)B.register('compat',w.__BM_COMPAT__);
if(w.__BM_CRASH_SHIELD__&&w.__BM_CRASH_SHIELD__.active)B.register('crash-shield',w.__BM_CRASH_SHIELD__);
if(w.__BM_INAPP_SHIELD__)B.register('inapp-shield',w.__BM_INAPP_SHIELD__);
if(w.__BM_DEVICE__&&w.__BM_DEVICE__.os)B.register('device-detect',w.__BM_DEVICE__);
if(w.__BM_DEVICE_INFO__)B.register('device-capabilities',w.__BM_DEVICE_INFO__);
if(w.__BM_INPUT__)B.register('input-controller',w.__BM_INPUT__);
if(w.__BM_PUSH__)B.register('push-manager',w.__BM_PUSH__);
if(w.__BM_NETWORK__&&w.__BM_NETWORK__.strategy)B.register('network-optimizer',w.__BM_NETWORK__);
if(w.__BM_HAPTIC__)B.register('haptic',w.__BM_HAPTIC__);

// ═══════════════════════════════════════════════════════════
// 8. LISTEN FOR MODULE READY EVENTS (from late-loading scripts)
// ═══════════════════════════════════════════════════════════
var eventMap={
  'bm:compat-ready':function(e){B.register('compat',e.detail);B.state.features=w.__BM_FEATURES__||{};B.state.platform=w.__BM_PLATFORM__||{};},
  'bm:device-caps-ready':function(e){B.register('device-capabilities',e.detail);B.state.device=w.__BM_DEVICE__||{};},
  'bm:input-ready':function(e){B.register('input-controller',e.detail);B.state.input=e.detail;},
  'bm:push-ready':function(e){B.register('push-manager',e.detail);B.state.push=e.detail;},
  'bm:memory':function(e){B.state.memory=e.detail;},
  'bm:network-strategy':function(e){B.state.network=e.detail;B.register('network-optimizer',w.__BM_NETWORK__);}
};
for(var ev in eventMap){
  w.addEventListener(ev,eventMap[ev]);
}

// ═══════════════════════════════════════════════════════════
// 9. START LOADING — begin sequential then idle loading
// ═══════════════════════════════════════════════════════════
// Only auto-load if scripts aren't already loaded via Next.js <Script> tags
// Check if the scripts are being managed by layout.tsx
B._autoLoad=false;
if(!w.__BM_SCRIPTS_VIA_NEXTJS__){
  B._autoLoad=true;
  // Phase 1: Critical scripts (afterInteractive equivalent)
  loadSequential(SCRIPTS_AFTER_INTERACTIVE,0,function(){
    // Phase 2: Non-critical scripts (idle loading)
    if(w.requestIdleCallback){
      w.requestIdleCallback(function(){loadOnIdle(SCRIPTS_ON_IDLE);},{timeout:2000});
    }else{
      w.addEventListener('load',function(){
        setTimeout(function(){loadOnIdle(SCRIPTS_ON_IDLE);},300);
      },{once:true});
    }
  });
}else{
  // Scripts loaded via Next.js — just wait for their ready events
  // Mark brain ready after a reasonable timeout
  var readyCheck=setInterval(function(){
    var essentials=['compat','device-capabilities','input-controller','push-manager'];
    var count=0;
    for(var i=0;i<essentials.length;i++){
      if(loaded[essentials[i]])count++;
    }
    // Ready when at least compat + 2 others are loaded, or after 10s
    if(count>=3||(Date.now()-startTime>10000)){
      clearInterval(readyCheck);
      if(!B.ready){
        B.ready=true;
        B.emit('ready',B);
        try{w.dispatchEvent(new CustomEvent('bm:brain-ready',{detail:B}));}catch(e){}
        checkAllReady();
      }
    }
  },500);
  var startTime=Date.now();
}

// ═══════════════════════════════════════════════════════════
// 10. REACT BRIDGE — expose hooks for React components
// ═══════════════════════════════════════════════════════════
// React components can use: window.__BM_BRAIN__.on('ready', fn)
// Or: window.__BM_BRAIN__.whenReady('push-manager', fn)
// Or access: window.__BM_BRAIN__.haptic.light()
// Or: window.__BM_BRAIN__.push.subscribe()

// ═══════════════════════════════════════════════════════════
// 11. DEBUG / DEVTOOLS
// ═══════════════════════════════════════════════════════════
if(w.location.hostname==='localhost'){
  console.log('[BM Brain] v1.0 — Orchestrator ready, auto-load:',B._autoLoad,', pre-registered:',B.moduleOrder.join(', ')||'(none yet)');

  // Expose debug helper
  B.debug=function(){
    console.group('[BM Brain] Debug');
    console.log('Ready:',B.ready);
    console.log('Modules:',Object.keys(loaded));
    console.log('State:',JSON.parse(JSON.stringify(B.state)));
    console.log('Haptic:',B.haptic.supported);
    console.log('Push:',B.push.supported||B.push.getState().supported);
    console.log('Input:',B.input.keyboardActive(),'(keyboard)',B.input.gamepadConnected(),'(gamepad)');
    console.log('Storage:',!!w.__BM_SAFE_STORAGE__);
    console.groupEnd();
  };
}
})();
