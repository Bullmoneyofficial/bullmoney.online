// BULLMONEY MOBILE CRASH SHIELD v2.0 - coordinated runtime brain
(function(){
'use strict';

var w=window,d=document,n=navigator,p=performance;
var B=w.__BM_BRAIN__=w.__BM_BRAIN__||{};
var DEBUG=(w.location&&w.location.hostname==='localhost')||/[?&]bm_debug=1/.test(w.location.search||'');
function log(){if(DEBUG)try{console.log.apply(console,arguments);}catch(e){}}

var ua=n.userAgent||'';
var mem=n.deviceMemory||4;
var isMobile=/mobi|android|iphone|ipad|ipod/i.test(ua);
var isIOS=/iphone|ipad|ipod/i.test(ua)||(/macintosh/i.test(ua)&&n.maxTouchPoints>1);
var isAndroid=/android/i.test(ua);
var isInApp=!!(B.inApp&&B.inApp.active)||/instagram|fban|fbav|tiktok|wechat|line\/|telegram|pinterest|reddit|whatsapp|discord|snapchat|gsa\//i.test(ua);
var isSamsungBrowser=/samsungbrowser/i.test(ua);
var isUCBrowser=/ucbrowser|ubrowser/i.test(ua);
var isHuaweiBrowser=/huaweibrowser|hmscore/i.test(ua);

function memoryBudget(){
  if(isIOS) return isInApp?50:(mem>=4?110:75);
  if(isAndroid){
    // Samsung Internet and UC Browser use extra memory for their UI chrome
    var overhead=(isSamsungBrowser||isUCBrowser||isHuaweiBrowser)?0.8:1;
    return Math.round((isInApp?85:(mem>=8?300:mem>=6?230:mem>=4?170:110))*overhead);
  }
  if(isMobile) return mem>=6?220:mem>=4?160:95;
  return 500;
}

var Shield=w.__BM_CRASH_SHIELD__={
  active:true,
  memoryBudget:memoryBudget(),
  currentMemoryMB:0,
  cleanupCount:0,
  isMobile:isMobile,
  isInApp:isInApp,
  deviceMem:mem,
  deferredComponents:0,
  queueSplineLoad:queueSplineLoad,
  shouldReduceQuality:function(){return currentLevel()!=='normal';},
  shouldSkipHeavyEffect:function(){
    var level=currentLevel();
    return level==='critical'||(isMobile&&level==='warning');
  }
};

function emit(detail){
  B.memory={level:detail.level,memoryMB:detail.memoryMB,budgetMB:Shield.memoryBudget};
  try{w.dispatchEvent(new CustomEvent('bm:memory',{detail:B.memory}));}catch(e){}
  try{w.dispatchEvent(new CustomEvent('bullmoney-performance-hint',{detail:{
    skipHeavy:Shield.shouldSkipHeavyEffect(),
    reduceQuality:Shield.shouldReduceQuality(),
    memoryMB:detail.memoryMB,
    budgetMB:Shield.memoryBudget
  }}));}catch(e){}
}

function currentLevel(){
  if(!p||!p.memory){
    // Safari/Firefox/Samsung Internet: no performance.memory
    // Use DOM heuristic for memory pressure estimation
    if(isMobile){
      try{
        var domCount=d.querySelectorAll('*').length;
        var canvasCount=d.querySelectorAll('canvas').length;
        var iframeCount=d.querySelectorAll('iframe:not([src="about:blank"])').length;
        var heuristicMB=(domCount/500)+(iframeCount*10)+(canvasCount*5);
        Shield.currentMemoryMB=Math.round(heuristicMB);
        var pct=(heuristicMB/Math.max(Shield.memoryBudget,1))*100;
        if(pct>=85)return 'critical';
        if(pct>=65)return 'warning';
      }catch(e){}
      return (mem<=2)?'warning':'normal';
    }
    return 'normal';
  }
  var used=Math.round((p.memory.usedJSHeapSize||0)/1048576);
  Shield.currentMemoryMB=used;
  var pct=(used/Math.max(Shield.memoryBudget,1))*100;
  if(pct>=88)return 'critical';
  if(pct>=72)return 'warning';
  return 'normal';
}

var lastCleanup=0;
function cleanup(level){
  var cooldown=level==='critical'?9000:15000;
  var now=Date.now();
  if(now-lastCleanup<cooldown)return;
  lastCleanup=now;
  Shield.cleanupCount++;

  var images=d.querySelectorAll('img[loading="lazy"]');
  for(var i=0;i<images.length;i++){
    var img=images[i],r=img.getBoundingClientRect();
    if(r.bottom<-420||r.top>w.innerHeight+420){
      if(img.dataset&&img.dataset.lazyOriginal)continue;
      if(img.src&&img.src.indexOf('data:')!==0){
        img.dataset.lazyOriginal=img.src;
        img.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      }
    }
  }

  var canvases=d.querySelectorAll('canvas');
  for(var j=0;j<canvases.length;j++){
    var c=canvases[j],cr=c.getBoundingClientRect();
    var keep=c.closest('[data-spline],[data-spline-scene],[data-keep-canvas],[data-spline-hero]');
    if(keep)continue;
    if(cr.bottom<-420||cr.top>w.innerHeight+420){
      var ctx=c.getContext&&c.getContext('2d');
      if(ctx)ctx.clearRect(0,0,c.width,c.height);
      c.width=1;c.height=1;
    }
  }

  var vids=d.querySelectorAll('video');
  for(var k=0;k<vids.length;k++){
    var v=vids[k],vr=v.getBoundingClientRect();
    if(vr.bottom<-320||vr.top>w.innerHeight+320){
      if(!v.paused){v.pause();v.dataset.wasAutoPlaying='1';}
    }
  }

  if(level==='critical'){try{if(w.gc)w.gc();}catch(e){}}
}

function monitor(){
  var level=currentLevel();
  if(level==='critical')cleanup('critical');
  else if(level==='warning')cleanup('warning');
  emit({level:level,memoryMB:Shield.currentMemoryMB});
}

function smartCacheCleanup(){
  try{
    if(!('caches' in w)||!w.caches)return;
    caches.keys().then(function(names){
    var keep=/spline|critical|static-v|next-data/i;
    var maxDelete=4;
    for(var i=0;i<names.length&&maxDelete>0;i++){
      if(keep.test(names[i]))continue;
      maxDelete--;
      caches.delete(names[i]);
    }
  }).catch(function(){});
  }catch(e){}
}

var queue=[];
var active=0;
function queueSplineLoad(sceneUrl,callback){
  if(!sceneUrl){if(callback)callback();return;}
  queue.push({url:sceneUrl,cb:callback||function(){}});
  pump();
}
function pump(){
  var strategy=(B.network&&B.network.strategy)||'normal';
  var max=isMobile?1:(strategy==='aggressive'?3:2);
  if(active>=max||queue.length===0)return;
  var next=queue.shift();
  active++;
  fetch(next.url,{cache:'force-cache',priority:strategy==='aggressive'?'high':'low'})
    .catch(function(){})
    .finally(function(){
      try{next.cb();}catch(e){}
      active--;
      setTimeout(pump,120);
    });
}

function deferHeavyComponent(selector,loadCallback,opts){
  opts=opts||{};
  var margin=opts.margin||'350px';
  var start=function(){
    var el=d.querySelector(selector);
    if(!el)return;
    if(!('IntersectionObserver' in w)){
      // Fallback: load after delay for browsers without IO (older Samsung, UC)
      setTimeout(function(){loadCallback();Shield.deferredComponents++;},800);
      return;
    }
    var io=new IntersectionObserver(function(entries){
      for(var i=0;i<entries.length;i++){
        if(entries[i].isIntersecting){
          loadCallback();
          Shield.deferredComponents++;
          io.disconnect();
          break;
        }
      }
    },{rootMargin:margin,threshold:0.01});
    io.observe(el);
  };
  if('requestIdleCallback' in w)requestIdleCallback(start,{timeout:1800});
  else setTimeout(start,220);
}
w.deferHeavyComponent=deferHeavyComponent;

var interval=isMobile?4500:9000;
setInterval(monitor,interval);
setTimeout(monitor,1200);
setTimeout(smartCacheCleanup,6000);
setInterval(smartCacheCleanup,12*60*1000);

d.addEventListener('visibilitychange',function(){
  if(d.visibilityState==='hidden')cleanup('critical');
  else setTimeout(monitor,800);
});
w.addEventListener('pagehide',function(){cleanup('critical');},{once:true});
w.addEventListener('bm:network-strategy',function(){pump();});

w.__BM_SHOULD_SKIP_HEAVY__=Shield.shouldSkipHeavyEffect;
w.__BM_SHOULD_REDUCE_QUALITY__=Shield.shouldReduceQuality;
d.documentElement.setAttribute('data-crash-shield','active');

if(w.location.hostname==='localhost'){
  log('[Mobile Crash Shield] budget=',Shield.memoryBudget,'mobile=',isMobile,'inApp=',isInApp);
}
})();
