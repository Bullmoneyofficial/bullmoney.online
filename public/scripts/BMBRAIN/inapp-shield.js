// BULLMONEY IN-APP SHIELD v4.0 - coordinated with global runtime brain
(function(){
'use strict';

var w=window,d=document,n=navigator;
var ua=n.userAgent||'';
var isIOS=/iphone|ipad|ipod/i.test(ua)||(/macintosh/i.test(ua)&&n.maxTouchPoints>1);
var isIOSWebKit=isIOS&&/applewebkit/i.test(ua)&&!/crios|fxios|edgios|opios/i.test(ua);
var hasVisualViewport=!!(w.visualViewport&&typeof w.visualViewport.addEventListener==='function');
var B=w.__BM_BRAIN__=w.__BM_BRAIN__||{};
var S=w.__BM_INAPP_SHIELD__={active:false,browser:null,fixes:[]};

if(typeof w.CustomEvent!=='function'){
  var CustomEventPolyfill=function(event,params){
    params=params||{bubbles:false,cancelable:false,detail:null};
    var evt=d.createEvent('CustomEvent');
    evt.initCustomEvent(event,params.bubbles,params.cancelable,params.detail);
    return evt;
  };
  CustomEventPolyfill.prototype=w.Event&&w.Event.prototype;
  w.CustomEvent=CustomEventPolyfill;
}

function closestAnchor(node){
  var current=node;
  while(current&&current!==d&&current!==d.body){
    if(current.tagName==='A'&&current.getAttribute&&current.getAttribute('href')) return current;
    current=current.parentNode;
  }
  return null;
}

var detections=[
  {name:'instagram',pattern:/instagram/i},
  {name:'tiktok',pattern:/tiktok|bytedance|musical_ly/i},
  {name:'facebook',pattern:/fban|fbav|fb_iab|facebook/i},
  {name:'twitter',pattern:/twitter/i},
  {name:'snapchat',pattern:/snapchat/i},
  {name:'linkedin',pattern:/linkedin/i},
  {name:'wechat',pattern:/micromessenger|wechat/i},
  {name:'line',pattern:/line\//i},
  {name:'telegram',pattern:/telegram/i},
  {name:'pinterest',pattern:/pinterest/i},
  {name:'reddit',pattern:/reddit/i},
  {name:'discord',pattern:/discord/i},
  {name:'webview-ios',pattern:/iphone|ipad|ipod/i},
  {name:'webview-android',pattern:/\bwv\b/i}
];

for(var i=0;i<detections.length;i++){
  if(detections[i].name==='webview-ios'){
    if(isIOSWebKit&&(/instagram|fban|fbav|line|tiktok|telegram|micromessenger|gsa|snapchat|linkedinapp|webview/i.test(ua)||!/safari/i.test(ua))){
      S.browser=detections[i].name;
      S.active=true;
      break;
    }
    continue;
  }
  if(detections[i].pattern.test(ua)){
    S.browser=detections[i].name;
    S.active=true;
    break;
  }
}
if(!S.active)return;

B.inApp={active:true,browser:S.browser};
try{w.dispatchEvent(new CustomEvent('bm:inapp',{detail:B.inApp}));}catch(e){}

var root=d.documentElement;
root.setAttribute('data-inapp',S.browser);
root.classList.add('in-app-browser','reduce-effects');
S.fixes.push('inapp-detected','keep-3d');

function fixViewport(){
  var h=(hasVisualViewport&&w.visualViewport.height)||w.innerHeight;
  var ww=(hasVisualViewport&&w.visualViewport.width)||w.innerWidth;
  var rs=root.style;
  rs.setProperty('--vh',(h*0.01)+'px');
  rs.setProperty('--app-height',h+'px');
  rs.setProperty('--app-width',ww+'px');
  if(!rs.getPropertyValue('--safe-bottom'))rs.setProperty('--safe-bottom','env(safe-area-inset-bottom,0px)');

  if(isIOS){
    // Normalize iPhone viewport buckets (SE/mini/11-16) for consistent in-app layout.
    var isTinyScreen=ww<=320||h<=640;
    var isCompactScreen=ww<=375||h<=700;
    var isSmallScreen=ww<=430||h<=760;

    var targetWidth=isTinyScreen?340:(isCompactScreen?356:(isSmallScreen?372:390));
    var rawScale=ww>targetWidth?(targetWidth/ww):1;
    // Keep range safe to avoid breaking fixed/sticky layers in webviews.
    var minScale=isTinyScreen?0.80:(isCompactScreen?0.84:(isSmallScreen?0.88:0.90));
    var scale=Math.max(minScale,Math.min(1,rawScale));

    // Use rem scaling for broad, low-risk size normalization across Tailwind layouts.
    rs.setProperty('font-size',(scale*100).toFixed(2)+'%');
    rs.setProperty('--bm-ios-inapp-ui-scale',String(scale));
    rs.setProperty('--bm-ios-inapp-ref-width',targetWidth+'px');

    if(scale<1){
      root.classList.add('ios-inapp-viewport-normalized');
      root.setAttribute('data-ios-inapp-scale',scale.toFixed(3));
      S.scale=scale;
    } else {
      root.classList.remove('ios-inapp-viewport-normalized');
      root.removeAttribute('data-ios-inapp-scale');
      S.scale=1;
    }

    if(isSmallScreen){
      root.classList.add('bm-small-screen');
    }else{
      root.classList.remove('bm-small-screen');
    }
    if(isCompactScreen){
      root.classList.add('bm-compact-screen');
    }else{
      root.classList.remove('bm-compact-screen');
    }
    if(isTinyScreen){
      root.classList.add('bm-tiny-screen');
    }else{
      root.classList.remove('bm-tiny-screen');
    }
  }
}
fixViewport();
w.addEventListener('resize',fixViewport,{passive:true});
if(hasVisualViewport){
  w.visualViewport.addEventListener('resize',fixViewport,{passive:true});
  w.visualViewport.addEventListener('scroll',fixViewport,{passive:true});
}
w.addEventListener('orientationchange',function(){setTimeout(fixViewport,80);},{passive:true});
S.fixes.push('viewport-fix');
if(isIOS)S.fixes.push('ios-viewport-normalize');

function applyScrollFix(){
  if(!d.body)return;
  var isGames=root.hasAttribute('data-games-page')||d.body.hasAttribute('data-games-page')||w.location.pathname.indexOf('/games')===0;
  if(isGames){
    d.body.style.overscrollBehavior='auto';
    root.style.overscrollBehavior='auto';
    d.body.style.touchAction='auto';
    return;
  }
  d.body.style.overscrollBehavior='none';
  root.style.overscrollBehavior='none';
  d.body.style.touchAction='pan-x pan-y';
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',applyScrollFix,{once:true});
else applyScrollFix();
setTimeout(applyScrollFix,600);

var style=d.createElement('style');
style.textContent=[
  '.in-app-browser *:not([role="dialog"]):not([role="dialog"] *):not([data-state="open"]):not([data-state="open"] *):not([data-radix-popper-content-wrapper]):not([data-radix-popper-content-wrapper] *):not(nav):not(nav *):not(button):not([role="menu"]):not([role="menu"] *):not([role="menuitem"]):not(canvas):not(spline-viewer):not([data-spline] *):not([data-spline-scene] *):not([data-spline-hero] *){animation-duration:.16s!important;transition-duration:.12s!important;}',
  '.in-app-browser .particle-container,.in-app-browser .confetti{opacity:0!important;pointer-events:none!important;height:0!important;overflow:hidden!important;}',
  '.in-app-browser .aurora{opacity:.05!important;}',
  '.in-app-browser .glass-effect,.in-app-browser .glassmorphism,.in-app-browser .glass-surface,.in-app-browser .glass-card{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(5,9,21,.86)!important;border-color:rgba(255,255,255,.06)!important;}',
  '.in-app-browser .circular-gallery,.in-app-browser .card-swap{animation:none!important;}',
  '.in-app-browser .color-bends{animation:none!important;opacity:.55!important;}',
  '/* SPLINE 3D PROTECTION: always visible in in-app browsers (Discord, Instagram, etc.) */',
  '.in-app-browser [data-spline]::after,.in-app-browser .spline-container::after,.in-app-browser [data-spline-scene]::after,.in-app-browser [data-spline-hero]::after{display:none!important;}',
  '.in-app-browser [data-spline] canvas,.in-app-browser [data-spline-scene] canvas,.in-app-browser [data-spline-hero] canvas,.in-app-browser spline-viewer,.in-app-browser spline-viewer canvas{display:block!important;visibility:visible!important;opacity:1!important;}',
  '.in-app-browser #bm-open-browser{position:fixed;top:0;left:0;right:0;max-width:100vw;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;background:#000;border-bottom:1px solid rgba(255,255,255,.18);z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;color:#fff;box-sizing:border-box;}',
  '.in-app-browser #bm-open-browser .bm-open-browser__text{color:#fff;font-size:13px;font-weight:500;letter-spacing:.01em;line-height:1.25;}',
  '.in-app-browser #bm-open-browser .bm-open-browser__actions{display:flex;gap:6px;flex-shrink:0;}',
  '.in-app-browser #bm-open-browser .bm-open-browser__dismiss{background:transparent;border:1px solid rgba(255,255,255,.35);color:#fff;padding:5px 11px;border-radius:9999px;font-size:12px;line-height:1;cursor:pointer;}',
  '.in-app-browser #bm-open-browser .bm-open-browser__open{background:#fff;color:#000;padding:5px 12px;border-radius:9999px;font-size:12px;line-height:1;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;}',
  '.in-app-browser body.bm-open-browser-visible{padding-top:var(--bm-open-browser-h,0px)!important;}',
  '@media (max-width:390px),(max-height:700px){.in-app-browser #bm-open-browser{padding:calc(8px + env(safe-area-inset-top,0px)) 10px 8px;gap:8px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-start;}.in-app-browser #bm-open-browser .bm-open-browser__text{font-size:12px;line-height:1.2;max-width:100%;}.in-app-browser #bm-open-browser .bm-open-browser__actions{gap:5px;width:100%;justify-content:flex-end;}.in-app-browser #bm-open-browser .bm-open-browser__dismiss,.in-app-browser #bm-open-browser .bm-open-browser__open{padding:4px 9px;font-size:11px;}}',
  '@media (max-width:340px){.in-app-browser #bm-open-browser .bm-open-browser__actions{justify-content:space-between;}.in-app-browser #bm-open-browser .bm-open-browser__dismiss,.in-app-browser #bm-open-browser .bm-open-browser__open{flex:1;justify-content:center;text-align:center;}}'
].join('\n');
if(d.head)d.head.appendChild(style);
S.fixes.push('css-reduced');

d.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('a[href]'):closestAnchor(e.target);
  if(!a)return;
  var href=a.getAttribute('href')||'';
  if(href.indexOf('http')!==0||href.indexOf(w.location.hostname)!==-1)return;
  if(S.browser==='instagram'||S.browser==='tiktok'){
    e.preventDefault();
    w.open(href,'_system')||w.open(href,'_blank');
  }
},true);
S.fixes.push('safer-links');

var crashKey='bm_inapp_crashes';
var crashes=parseInt(sessionStorage.getItem(crashKey)||'0',10);
if(crashes>0){
  root.classList.add('ultra-light-mode');
  var ultra=d.createElement('style');
  ultra.textContent=[
    '.ultra-light-mode *:not([role="dialog"]):not([role="dialog"] *):not([data-state="open"]):not([data-state="open"] *):not([data-radix-popper-content-wrapper]):not([data-radix-popper-content-wrapper] *):not(nav):not(nav *):not(button):not([role="menu"]):not([role="menu"] *):not([role="menuitem"]):not(canvas):not(spline-viewer):not([data-spline] *):not([data-spline-scene] *):not([data-spline-hero] *){animation:none!important;transition:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
    '.ultra-light-mode *:not(.product-card-premium):not(input):not(button):not(a){box-shadow:none!important;}',
    '.ultra-light-mode .glass-effect,.ultra-light-mode .glassmorphism,.ultra-light-mode .glass-surface,.ultra-light-mode .glass-card{background:rgba(5,9,21,.9)!important;border-color:rgba(255,255,255,.05)!important;}'
  ].join('\n');
  if(d.head)d.head.appendChild(ultra);
  S.fixes.push('crash-recovery');
}
sessionStorage.setItem(crashKey,String(crashes+1));
w.addEventListener('load',function(){setTimeout(function(){sessionStorage.setItem(crashKey,'0');},2500);},{once:true});

if(S.browser==='instagram'||S.browser==='tiktok'||S.browser==='facebook'){
  w.addEventListener('load',function(){
    setTimeout(function(){
      if(d.getElementById('bm-open-browser')||!d.body)return;
      var bar=d.createElement('div');
      bar.id='bm-open-browser';
      bar.innerHTML='<span class="bm-open-browser__text">Open in browser for best performance</span>'+
        '<div class="bm-open-browser__actions">'+
        '<button type="button" class="bm-open-browser__dismiss">Dismiss</button>'+
        '<a href="'+w.location.href+'" target="_blank" class="bm-open-browser__open">Open</a>'+
        '</div>';
      d.body.appendChild(bar);

      function setBannerOffset(){
        if(!bar||!bar.parentNode)return;
        var h=Math.ceil(bar.getBoundingClientRect().height||0);
        root.style.setProperty('--bm-open-browser-h',h+'px');
        d.body.classList.add('bm-open-browser-visible');
      }

      function clearBannerOffset(){
        root.style.removeProperty('--bm-open-browser-h');
        d.body.classList.remove('bm-open-browser-visible');
      }

      var dismissBtn=bar.querySelector('.bm-open-browser__dismiss');
      if(dismissBtn){
        dismissBtn.addEventListener('click',function(){
          clearBannerOffset();
          if(bar&&bar.parentNode)bar.parentNode.removeChild(bar);
        },{once:true});
      }

      setTimeout(setBannerOffset,0);
      w.addEventListener('resize',setBannerOffset,{passive:true});
      w.addEventListener('orientationchange',setBannerOffset,{passive:true});
    },1800);
  },{once:true});
  S.fixes.push('open-banner');
}

if(w.location.hostname==='localhost'){
  console.log('[INAPP] browser=',S.browser,'fixes=',S.fixes.join(', '));
}
})();
