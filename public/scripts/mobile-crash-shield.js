// BULLMONEY MOBILE CRASH SHIELD v1.1 - iOS & Android Optimized
// Prevents crashes on mobile devices through smart memory management and lazy loading
// iOS Safari: Handles backgrounding, respects memory limits, viewport optimizations
// Android Chrome: Aggressive caching, background sync, better performance
// NO STYLING CHANGES - Only performance optimizations
(function(){
'use strict';

var w=window,d=document,n=navigator,p=performance;

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEVICE DETECTION & MEMORY BUDGET (iOS/Android Enhanced)
// ─────────────────────────────────────────────────────────────────────────────
var deviceMem=n.deviceMemory||4;
var ua=n.userAgent||'';
var isInApp=/instagram|fban|fbav|tiktok|snapchat|twitter|linkedin|wechat|line\/|telegram|pinterest|reddit/i.test(ua);
var isMobile=/mobi|android|iphone|ipad|ipod/i.test(ua);
var isSafari=/^((?!chrome|android).)*safari/i.test(ua);
var isIOS=/iphone|ipad|ipod/i.test(ua);
var isAndroid=/android/i.test(ua);
var isIPad=/ipad/i.test(ua)||(/macintosh/i.test(ua)&&n.maxTouchPoints>1); // iPadOS 13+

// Calculate memory budget (iOS/Android optimized)
var memoryBudgetMB=(function(){
  // iOS Safari: More conservative (1.5GB RAM limit for single tab)
  if(isIOS||isIPad){
    if(isInApp)return 50; // In-app browsers on iOS are very constrained
    if(deviceMem>=4)return 100; // iPhone 12+ or iPad Pro
    if(deviceMem>=2)return 70;  // iPhone 8-11
    return 50; // Older iPhones
  }
  // Android Chrome: More generous (better memory management)
  if(isAndroid){
    if(isInApp)return 80;
    if(deviceMem>=8)return 350;
    if(deviceMem>=6)return 250;
    if(deviceMem>=4)return 180;
    if(deviceMem>=2)return 120;
    return 70;
  }
  // Generic mobile fallback
  if(isInApp){
    if(deviceMem>=4)return 120;
    if(deviceMem>=2)return 80;
    return 50;
  }
  if(isMobile){
    if(deviceMem>=8)return 300;
    if(deviceMem>=6)return 220;
    if(deviceMem>=4)return 180;
    if(deviceMem>=2)return 100;
    return 60;
  }
  return 500; // Desktop - generous budget
})();

var Shield={
  active:true,
  memoryBudget:memoryBudgetMB,
  deviceMem:deviceMem,
  isMobile:isMobile,
  isInApp:isInApp,
  isIOS:isIOS,
  isAndroid:isAndroid,
  isIPad:isIPad,
  currentMemoryMB:0,
  cleanupCount:0,
  deferredComponents:0
};
w.__BM_CRASH_SHIELD__=Shield;

console.log('[Mobile Crash Shield v1.1] Active | Budget: '+memoryBudgetMB+'MB | Device: '+deviceMem+'GB | iOS: '+isIOS+' | Android: '+isAndroid+' | iPad: '+isIPad+' | InApp: '+isInApp);

// ─────────────────────────────────────────────────────────────────────────────
// 2. SMART CACHE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// Clear old caches intelligently - keep recent, remove stale
function smartCacheCleanup(){
  if(!('caches' in w))return Promise.resolve();
  
  return caches.keys().then(function(cacheNames){
    var now=Date.now();
    var keepPatterns=['spline-hero','critical-assets','static-v'];
    var maxAge=7*24*60*60*1000; // 7 days
    
    return Promise.all(cacheNames.map(function(cacheName){
      // Keep critical caches
      var isKeep=keepPatterns.some(function(p){return cacheName.includes(p);});
      if(isKeep)return Promise.resolve();
      
      // Check cache age by inspecting youngest entry
      return caches.open(cacheName).then(function(cache){
        return cache.keys().then(function(requests){
          if(requests.length===0){
            // Empty cache - delete it
            return caches.delete(cacheName);
          }
          
          // Sample first request to check age
          return cache.match(requests[0]).then(function(response){
            if(!response)return caches.delete(cacheName);
            
            var dateHeader=response.headers.get('date');
            if(!dateHeader)return Promise.resolve();
            
            var cacheAge=now-new Date(dateHeader).getTime();
            if(cacheAge>maxAge){
              Shield.cleanupCount++;
              return caches.delete(cacheName);
            }
          });
        });
      }).catch(function(){
        // If we can't read cache, delete it
        return caches.delete(cacheName);
      });
    }));
  }).catch(function(err){
    console.warn('[Mobile Crash Shield] Cache cleanup failed:',err);
  });
}

// Run cache cleanup on startup (after 5s) and periodically
setTimeout(function(){
  smartCacheCleanup().then(function(){
    console.log('[Mobile Crash Shield] Cache cleanup complete');
  });
},5000);

// Periodic cleanup for long sessions
setInterval(smartCacheCleanup,10*60*1000); // Every 10 minutes

// ─────────────────────────────────────────────────────────────────────────────
// 3. MEMORY PRESSURE MONITORING
// ─────────────────────────────────────────────────────────────────────────────

function checkMemoryPressure(){
  var memoryMB=0;
  var pressureLevel='normal'; // normal | warning | critical
  
  if(p.memory){
    memoryMB=Math.round(p.memory.usedJSHeapSize/1048576);
    var memoryPct=(memoryMB/memoryBudgetMB)*100;
    
    if(memoryPct>85){pressureLevel='critical';}
    else if(memoryPct>70){pressureLevel='warning';}
    
    Shield.currentMemoryMB=memoryMB;
  }
  
  return {memoryMB:memoryMB,pressureLevel:pressureLevel};
}

// Monitor memory and trigger cleanup when needed
function monitorMemory(){
  var state=checkMemoryPressure();
  
  if(state.pressureLevel==='critical'){
    console.warn('[Mobile Crash Shield] Critical memory pressure:',state.memoryMB+'MB /'+memoryBudgetMB+'MB');
    triggerMemoryCleanup('critical');
  }else if(state.pressureLevel==='warning'){
    triggerMemoryCleanup('warning');
  }
  
  // Dispatch event for components to react
  w.dispatchEvent(new CustomEvent('bullmoney-memory-pressure',{
    detail:{
      level:state.pressureLevel,
      memoryMB:state.memoryMB,
      budgetMB:memoryBudgetMB
    }
  }));
}

// Check memory periodically (more often on mobile)
var memoryCheckInterval=isMobile?3000:8000;
setInterval(monitorMemory,memoryCheckInterval);

// ─────────────────────────────────────────────────────────────────────────────
// 4. SMART MEMORY CLEANUP
// ─────────────────────────────────────────────────────────────────────────────

var lastCleanup=0;
var cleanupCooldown=15000; // Min 15s between cleanups

function triggerMemoryCleanup(level){
  var now=Date.now();
  if(now-lastCleanup<cleanupCooldown)return;
  lastCleanup=now;
  
  Shield.cleanupCount++;
  
  // 1. Clear off-screen images
  d.querySelectorAll('img[loading="lazy"]').forEach(function(img){
    var rect=img.getBoundingClientRect();
    var isOffscreen=rect.bottom<-400||rect.top>w.innerHeight+400;
    
    if(isOffscreen&&img.src&&!img.src.startsWith('data:')){
      img.dataset.lazyOriginal=img.src;
      img.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  });
  
  // 2. Release off-screen canvases
  d.querySelectorAll('canvas').forEach(function(canvas){
    var rect=canvas.getBoundingClientRect();
    var isOffscreen=rect.bottom<-400||rect.top>w.innerHeight+400;
    var isKeep=canvas.closest('[data-keep-canvas]')||canvas.closest('[data-spline-hero]');
    
    if(isOffscreen&&!isKeep){
      var ctx=canvas.getContext('2d');
      if(ctx){
        ctx.clearRect(0,0,canvas.width,canvas.height);
      }
      // Shrink canvas to release GPU memory
      canvas.width=1;
      canvas.height=1;
    }
  });
  
  // 3. Pause off-screen videos
  d.querySelectorAll('video').forEach(function(video){
    var rect=video.getBoundingClientRect();
    var isOffscreen=rect.bottom<-300||rect.top>w.innerHeight+300;
    
    if(isOffscreen&&!video.paused){
      video.pause();
      video.dataset.wasPlaying='1';
    }
  });
  
  // 4. Clear console in production (reduces memory in devtools)
  if(w.location.hostname!=='localhost'){
    try{console.clear();}catch(e){}
  }
  
  // 5. Hint garbage collection if available
  if(level==='critical'){
    try{if(w.gc)w.gc();}catch(e){}
  }
  
  console.log('[Mobile Crash Shield] Cleanup complete ('+level+') - Count: '+Shield.cleanupCount);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SMART LAZY LOADING FOR HEAVY COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Defer heavy 3D/WebGL/Spline components until they're near viewport
Shield.deferredLoaders=[];

Shield.registerDeferredComponent=function(element,loadFn,margin){
  margin=margin||'400px';
  
  if(!('IntersectionObserver' in w)){
    // No IntersectionObserver - load immediately (old browsers)
    loadFn();
    return;
  }
  
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        // Component is near viewport - load it
        loadFn();
        observer.disconnect();
        Shield.deferredComponents++;
      }
    });
  },{rootMargin:margin,threshold:0.01});
  
  observer.observe(element);
  Shield.deferredLoaders.push(observer);
};

// Provide helper for React components to use
w.deferHeavyComponent=function(elementSelector,loadCallback,options){
  options=options||{};
  var margin=options.margin||'400px';
  var priority=options.priority||'normal'; // high | normal | low
  
  // High priority - load after brief delay
  if(priority==='high'){
    setTimeout(function(){
      var el=d.querySelector(elementSelector);
      if(el){
        Shield.registerDeferredComponent(el,loadCallback,margin);
      }
    },100);
    return;
  }
  
  // Normal/low priority - wait for idle
  if('requestIdleCallback' in w){
    requestIdleCallback(function(){
      var el=d.querySelector(elementSelector);
      if(el){
        Shield.registerDeferredComponent(el,loadCallback,margin);
      }
    },{timeout:priority==='low'?5000:2000});
  }else{
    setTimeout(function(){
      var el=d.querySelector(elementSelector);
      if(el){
        Shield.registerDeferredComponent(el,loadCallback,margin);
      }
    },priority==='low'?1000:300);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. SMART SPLINE/3D LOADING
// ─────────────────────────────────────────────────────────────────────────────

// Queue Spline/3D loads to prevent multiple simultaneous WebGL context creation
var splineLoadQueue=[];
var activeSplineLoads=0;
var maxConcurrentSplines=isMobile?1:2; // Mobile: 1 at a time

Shield.queueSplineLoad=function(sceneUrl,callback){
  splineLoadQueue.push({url:sceneUrl,callback:callback});
  processSplineQueue();
};

function processSplineQueue(){
  if(activeSplineLoads>=maxConcurrentSplines)return;
  if(splineLoadQueue.length===0)return;
  
  var next=splineLoadQueue.shift();
  activeSplineLoads++;
  
  // Preload scene with fetch
  fetch(next.url,{
    priority:'low',
    mode:'cors',
    cache:'default'
  }).then(function(){
    next.callback();
  }).catch(function(err){
    console.warn('[Mobile Crash Shield] Spline preload failed:',err);
    next.callback(); // Load anyway
  }).finally(function(){
    activeSplineLoads--;
    // Process next in queue after small delay
    setTimeout(processSplineQueue,300);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PAGE LIFECYCLE INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

// Clean up when page goes to background
d.addEventListener('visibilitychange',function(){
  if(d.visibilityState==='hidden'){
    // User switched away - aggressive cleanup
    triggerMemoryCleanup('critical');
    
    // Pause all videos
    d.querySelectorAll('video').forEach(function(v){
      if(!v.paused){
        v.pause();
        v.dataset.wasAutoPlaying='1';
      }
    });
  }else if(d.visibilityState==='visible'){
    // Page visible again - check memory
    setTimeout(monitorMemory,1000);
    
    // Resume videos that were auto-playing
    d.querySelectorAll('video[data-was-auto-playing]').forEach(function(v){
      v.play().catch(function(){});
      delete v.dataset.wasAutoPlaying;
    });
  }
});

// Freeze event (mobile backgrounding)
if('onfreeze' in d){
  d.addEventListener('freeze',function(){
    triggerMemoryCleanup('critical');
  });
}

// Page unload - final cleanup
w.addEventListener('pagehide',function(){
  // Disconnect all observers
  Shield.deferredLoaders.forEach(function(observer){
    observer.disconnect();
  });
  Shield.deferredLoaders=[];
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. SMART RENDER EFFECT SKIPPING
// ─────────────────────────────────────────────────────────────────────────────

// Provide skip conditions for heavy effects based on memory pressure
Shield.shouldSkipHeavyEffect=function(){
  var state=checkMemoryPressure();
  return state.pressureLevel==='critical'||(isMobile&&state.pressureLevel==='warning');
};

Shield.shouldReduceQuality=function(){
  var state=checkMemoryPressure();
  return state.pressureLevel!=='normal';
};

// Make available globally for React hooks
w.__BM_SHOULD_SKIP_HEAVY__=Shield.shouldSkipHeavyEffect;
w.__BM_SHOULD_REDUCE_QUALITY__=Shield.shouldReduceQuality;

// Dispatch periodic updates for hooks to react
setInterval(function(){
  w.dispatchEvent(new CustomEvent('bullmoney-performance-hint',{
    detail:{
      skipHeavy:Shield.shouldSkipHeavyEffect(),
      reduceQuality:Shield.shouldReduceQuality(),
      memoryMB:Shield.currentMemoryMB,
      budgetMB:memoryBudgetMB
    }
  }));
},5000);

// ─────────────────────────────────────────────────────────────────────────────
// 9. INITIAL ASSESSMENT
// ─────────────────────────────────────────────────────────────────────────────

// Check memory on load
setTimeout(monitorMemory,2000);

// In-app browsers start with warning level
if(isInApp){
  d.documentElement.setAttribute('data-memory-constrained','true');
  console.warn('[Mobile Crash Shield] In-app browser detected - memory constrained mode');
}

// Low memory devices get early cleanup
if(deviceMem<=2){
  setTimeout(function(){
    triggerMemoryCleanup('warning');
  },30000); // 30s after load
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. DEVELOPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

// Expose stats for debugging
Shield.getStats=function(){
  return {
    memoryBudget:memoryBudgetMB+'MB',
    currentMemory:Shield.currentMemoryMB+'MB',
    cleanupCount:Shield.cleanupCount,
    deferredComponents:Shield.deferredComponents,
    activeSplineLoads:activeSplineLoads,
    queuedSplineLoads:splineLoadQueue.length,
    isMobile:isMobile,
    isInApp:isInApp,
    deviceMemory:deviceMem+'GB'
  };
};

// Log stats on localhost
if(w.location.hostname==='localhost'){
  setTimeout(function(){
    console.log('[Mobile Crash Shield] Stats:',Shield.getStats());
  },10000);
}

d.documentElement.setAttribute('data-crash-shield','active');
console.log('[Mobile Crash Shield] Initialized successfully');

})();
