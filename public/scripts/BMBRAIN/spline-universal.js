// BULLMONEY SPLINE UNIVERSAL v2.0 - coordinated always-render runtime
(function() {
'use strict';

var w=window,d=document,n=navigator;
var B=w.__BM_BRAIN__=w.__BM_BRAIN__||{};
var SU=w.__BM_SPLINE_UNIVERSAL__=w.__BM_SPLINE_UNIVERSAL__||{scenes:{},alwaysRender:true,loaded:false};
var docEl=d.documentElement;

function setAttr(k,v){if(docEl)docEl.setAttribute(k,v);}
function idle(cb,timeout){
  if('requestIdleCallback' in w)return w.requestIdleCallback(cb,{timeout:timeout||1500});
  return setTimeout(function(){cb({didTimeout:true,timeRemaining:function(){return 0;}});},timeout||1500);
}

var mem=n.deviceMemory||4;
var cores=n.hardwareConcurrency||4;
var dpr=w.devicePixelRatio||1;
var isMobile=/iphone|ipad|ipod|android|mobile/i.test(n.userAgent||'');

function computeQuality(){
  var network=(B.network&&B.network.strategy)||'normal';
  var memory=(B.memory&&B.memory.level)||'normal';
  var inApp=!!(B.inApp&&B.inApp.active);
  var quality='high';

  if(network==='minimal'||memory==='critical')quality='low';
  else if(network==='conservative'||memory==='warning')quality='medium';
  else if(mem>=8&&cores>=6&&!isMobile&&!inApp)quality='ultra';
  else if(isMobile&&mem<4)quality='medium';

  SU.quality=quality;
  setAttr('data-spline-quality',quality);
  return quality;
}

function qualityScale(){
  var q=SU.quality||computeQuality();
  if(q==='ultra')return Math.min(dpr,2);
  if(q==='high')return Math.min(dpr,1.5);
  if(q==='medium')return 1;
  return 0.75;
}

function textureLimit(){
  var q=SU.quality||computeQuality();
  if(q==='ultra')return 4096;
  if(q==='high')return 2048;
  if(q==='medium')return 1024;
  return 512;
}

function targetFPS(){
  var q=SU.quality||computeQuality();
  if(q==='ultra'&&!isMobile)return 120;
  if(q==='low')return 45;
  return 60;
}

SU.getCanvasScale=qualityScale;
SU.getMaxTextureSize=textureLimit;
SU.getTargetFPS=targetFPS;

SU.createOptimizedWebGLContext=function(canvas,opts){
  opts=opts||{};
  var q=SU.quality||computeQuality();
  var contextSettings={
    alpha:q!=='low',
    antialias:q==='ultra'||q==='high',
    powerPreference:q==='ultra'?'high-performance':'default',
    preserveDrawingBuffer:false,
    stencil:q!=='low',
    depth:true,
    failIfMajorPerformanceCaveat:false
  };
  for(var k in opts)contextSettings[k]=opts[k];
  return canvas.getContext('webgl2',contextSettings)||canvas.getContext('webgl',contextSettings)||canvas.getContext('experimental-webgl',contextSettings);
};

SU.loadScene=function(container,sceneUrl){
  container.classList.add('spline-loading');
  container.setAttribute('data-spline-quality',SU.quality||computeQuality());
  container.setAttribute('data-spline-scale',String(qualityScale()));
  container.setAttribute('data-spline-max-texture',String(textureLimit()));
  var sceneMeta={url:sceneUrl,container:container,loadStart:performance.now(),quality:SU.quality,visible:true};
  SU.scenes[sceneUrl]=sceneMeta;
  return new Promise(function(resolve){
    var done=function(){
      container.removeEventListener('spline-loaded',done);
      container.classList.remove('spline-loading');
      container.classList.add('spline-loaded');
      sceneMeta.loadTime=Math.round(performance.now()-sceneMeta.loadStart);
      sceneMeta.loaded=true;
      resolve(sceneMeta);
    };
    container.addEventListener('spline-loaded',done,{once:true});
  });
};

SU.cacheScene=function(url){
  if(!url||!('caches' in w)||!w.caches)return Promise.resolve(false);
  return caches.open('bullmoney-spline-universal-v2').then(function(cache){
    return cache.match(url).then(function(hit){
      if(hit)return true;
      return fetch(url,{cache:'force-cache'}).then(function(r){
        if(r&&r.ok){try{cache.put(url,r.clone());}catch(e){}
          return true;
        }
        return false;
      }).catch(function(){return false;});
    });
  }).catch(function(){return false;});
};

SU.preloadScenes=function(sceneUrls){
  if(!Array.isArray(sceneUrls)||sceneUrls.length===0)return;
  var strategy=(B.network&&B.network.strategy)||'normal';
  if(strategy==='minimal')return;
  var run=function(){
    for(var i=0;i<sceneUrls.length;i++){
      var url=sceneUrls[i];
      if(w.__BM_CRASH_SHIELD__&&typeof w.__BM_CRASH_SHIELD__.queueSplineLoad==='function'){
        w.__BM_CRASH_SHIELD__.queueSplineLoad(url,function(){});
      }else{
        SU.cacheScene(url);
      }
    }
  };
  idle(run,3200);
};

if('IntersectionObserver' in w){
  SU.visibilityObserver=new IntersectionObserver(function(entries){
    for(var i=0;i<entries.length;i++){
      var entry=entries[i];
      var container=entry.target;
      var sceneUrl=container.getAttribute('data-spline-url');
      if(sceneUrl&&SU.scenes[sceneUrl])SU.scenes[sceneUrl].visible=entry.isIntersecting;
      try{w.dispatchEvent(new CustomEvent('bullmoney-spline-visibility',{detail:{
        url:sceneUrl,
        visible:entry.isIntersecting,
        targetFPS:entry.isIntersecting?targetFPS():Math.max(15,Math.floor(targetFPS()/3))
      }}));}catch(e){}
    }
  },{rootMargin:'120px',threshold:[0,0.35,0.7,1]});

  if(d.readyState==='loading'){
    d.addEventListener('DOMContentLoaded',observeAll,{once:true});
  }else observeAll();
}

function observeAll(){
  if(!SU.visibilityObserver)return;
  var nodes=d.querySelectorAll('[data-spline-scene], .spline-container');
  for(var i=0;i<nodes.length;i++)SU.visibilityObserver.observe(nodes[i]);
}

var style=d.createElement('style');
style.id='spline-universal-styles';
style.textContent=[
  '.spline-container,.spline-scene-wrapper,[data-spline-scene]{contain:layout style paint;transform:translateZ(0);backface-visibility:hidden;}',
  '.spline-loading::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,215,0,.03),transparent);animation:spline-shimmer 1.5s infinite;pointer-events:none;}',
  '@keyframes spline-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}',
  '.spline-loaded::after{display:none;}',
  '.spline-container canvas{opacity:1!important;visibility:visible!important;pointer-events:auto!important;}',
  '[data-spline-quality="high"] canvas,[data-spline-quality="ultra"] canvas{image-rendering:-webkit-optimize-contrast;image-rendering:crisp-edges;}'
].join('\n');
if(d.head)d.head.appendChild(style);
else d.documentElement.appendChild(style);

function sync(){
  var q=computeQuality();
  var fps=targetFPS();
  setAttr('data-spline-fps',String(fps));
  setAttr('data-spline-ready','true');
  w.__splineOptimize__={quality:q,scale:qualityScale(),maxTexture:textureLimit(),targetFPS:fps,alwaysRender:true};
}

computeQuality();
sync();
w.addEventListener('bm:memory',sync);
w.addEventListener('bm:network-strategy',sync);
w.addEventListener('bm:inapp',sync);

SU.loaded=true;
if(w.location.hostname==='localhost'){
  console.log('[Spline Universal] quality=',SU.quality,'fps=',targetFPS(),'alwaysRender=ON');
}
})();
