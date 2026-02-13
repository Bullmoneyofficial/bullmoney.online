// BULLMONEY NETWORK OPTIMIZER v4.0 - shared brain edition
(function(){
'use strict';
var w=window,d=document,n=navigator;
var docEl=d.documentElement;
var conn=n.connection||n.mozConnection||n.webkitConnection||{};
var B=w.__BM_BRAIN__=w.__BM_BRAIN__||{};
var NW=w.__BM_NETWORK__=w.__BM_NETWORK__||{prefetched:new Set(),priorities:{}};
var routePrefetchEnabled = typeof w.__BM_ENABLE_ROUTE_PREFETCH__ === 'boolean' ? w.__BM_ENABLE_ROUTE_PREFETCH__ : true;

function onReady(fn){
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',fn,{once:true});
  else fn();
}
function onIdle(fn,timeout){
  if('requestIdleCallback' in w)return w.requestIdleCallback(fn,{timeout:timeout||1200});
  return setTimeout(function(){fn({didTimeout:true,timeRemaining:function(){return 0;}});},timeout||1200);
}
function emit(name,detail){
  try{w.dispatchEvent(new CustomEvent(name,{detail:detail}));}catch(e){}
}

function computeStrategy(){
  var type=conn.effectiveType||'4g';
  var saveData=!!conn.saveData;
  var downlink=conn.downlink||10;
  var mem=n.deviceMemory||4;
  var inApp=!!(B.inApp&&B.inApp.active);

  var strategy='normal';
  if(saveData||type==='2g'||type==='slow-2g') strategy='minimal';
  else if(type==='3g'||downlink<1.5||mem<=2) strategy='conservative';
  else if(type==='4g'&&downlink>=5&&mem>=6) strategy='aggressive';

  if(inApp&&strategy==='aggressive') strategy='normal';
  if(B.memory&&B.memory.level==='critical') strategy='minimal';

  NW.strategy=strategy;
  NW.effectiveType=type;
  NW.downlinkMbps=downlink;
  NW.saveData=saveData;
  B.network={strategy:strategy,type:type,downlink:downlink,saveData:saveData};

  if(docEl){
    docEl.setAttribute('data-network-strategy',strategy);
    docEl.style.setProperty('--img-quality',String(NW.getImageQuality()));
  }
  emit('bm:network-strategy',B.network);
}

NW.getImageQuality=function(){
  if(NW.strategy==='minimal')return 45;
  if(NW.strategy==='conservative')return 62;
  if(NW.strategy==='aggressive')return 88;
  return 75;
};

NW._doLoad=function(url,type,asPriority){
  if(!url||d.querySelector('link[href="'+url+'"]'))return Promise.resolve(url||null);
  var link=d.createElement('link');
  if(type==='style'){link.rel='preload';link.as='style';}
  else if(type==='script'){link.rel='preload';link.as='script';}
  else if(type==='image'){link.rel='preload';link.as='image';}
  else if(type==='font'){link.rel='preload';link.as='font';link.crossOrigin='anonymous';}
  else{link.rel='prefetch';}
  if(asPriority)link.fetchPriority=asPriority;
  link.href=url;
  (d.head||d.documentElement).appendChild(link);
  return Promise.resolve(url);
};

NW.loadResource=function(url,type,priority){
  priority=priority||'low';
  NW.priorities[url]=priority;
  if(NW.strategy==='minimal'&&priority==='low')return Promise.resolve(null);
  if(NW.strategy==='conservative'&&priority==='low'){
    return new Promise(function(resolve){
      onIdle(function(){resolve(NW._doLoad(url,type));},2500);
    });
  }
  return NW._doLoad(url,type,priority==='high'?'high':undefined);
};

var inflight=new Map();
NW.fetch=function(url,opts){
  opts=opts||{};
  var retries=typeof opts.retries==='number'?opts.retries:1;
  var timeout=typeof opts.timeout==='number'?opts.timeout:9000;
  function attempt(rem){
    var controller,timer;
    if('AbortController' in w){
      controller=new AbortController();
      timer=setTimeout(function(){controller.abort();},timeout);
    }
    return fetch(url,Object.assign({},opts,controller?{signal:controller.signal}:{}))
      .finally(function(){if(timer)clearTimeout(timer);})
      .catch(function(err){
        if(rem<=0)throw err;
        return new Promise(function(resolve){setTimeout(function(){resolve(attempt(rem-1));},700);});
      });
  }
  return attempt(retries);
};
NW.deduplicatedFetch=function(url,opts){
  var key=url+JSON.stringify(opts||{});
  if(inflight.has(key))return inflight.get(key);
  var p=NW.fetch(url,opts).finally(function(){inflight.delete(key);});
  inflight.set(key,p);
  return p;
};

function prefetchPredictedRoutes(){
  if(!routePrefetchEnabled)return;
  var predictions={
    '/':['/about','/store','/Blogs','/community'],
    '/about':['/community','/recruit'],
    '/Blogs':['/community','/'],
    '/store':['/products','/shop'],
    '/community':['/socials','/course'],
    '/course':['/Prop','/community']
  };
  if(NW.strategy==='minimal')return;
  var current=w.location.pathname;
  var predicted=predictions[current]||[];
  var limit=NW.strategy==='aggressive'?3:NW.strategy==='normal'?2:1;
  predicted.slice(0,limit).forEach(function(route){
    if(NW.prefetched.has(route))return;
    NW.prefetched.add(route);
    var link=d.createElement('link');
    link.rel='prefetch';
    link.href=route;
    (d.head||d.documentElement).appendChild(link);
  });
}

function watchHeroImages(){
  if(!('IntersectionObserver' in w))return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting)return;
      var img=entry.target;
      if(img.getAttribute('loading')==='lazy')img.removeAttribute('loading');
      img.setAttribute('fetchpriority','high');
      io.unobserve(img);
    });
  },{rootMargin:'120px',threshold:0});

  onReady(function(){
    var imgs=d.querySelectorAll('.hero img, [data-hero] img, section:first-of-type img');
    for(var i=0;i<imgs.length;i++)io.observe(imgs[i]);
  });
}

function estimateBandwidthOnce(){
  onIdle(function(){
    var start=performance.now();
    fetch('/build-info.json',{cache:'no-store'})
      .then(function(r){return r.text();})
      .then(function(txt){
        var elapsed=Math.max((performance.now()-start)/1000,0.05);
        var kbps=Math.round((new Blob([txt]).size/elapsed)/1024);
        NW.measuredBandwidthKBps=kbps;
        B.network=Object.assign({},B.network,{measuredKBps:kbps});
      })
      .catch(function(){});
  },3500);
}

computeStrategy();
if(conn.addEventListener)conn.addEventListener('change',computeStrategy);
else if('onchange' in conn)conn.onchange=computeStrategy;

w.addEventListener('bm:memory',computeStrategy);
w.addEventListener('bm:inapp',computeStrategy);

onIdle(prefetchPredictedRoutes,2200);
watchHeroImages();
w.addEventListener('load',estimateBandwidthOnce,{once:true});

if(w.location.hostname==='localhost'){
  console.log('[NETWORK] strategy=',NW.strategy,'type=',NW.effectiveType,'downlink=',NW.downlinkMbps);
}
})();
