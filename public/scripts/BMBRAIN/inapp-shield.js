// BULLMONEY IN-APP SHIELD v4.0 - coordinated with global runtime brain
(function(){
'use strict';

var w=window,d=document,n=navigator;
var ua=n.userAgent||'';
var B=w.__BM_BRAIN__=w.__BM_BRAIN__||{};
var S=w.__BM_INAPP_SHIELD__={active:false,browser:null,fixes:[]};

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
  {name:'webview-ios',pattern:/\bwv\b.*safari/i},
  {name:'webview-android',pattern:/\bwv\b/i}
];

for(var i=0;i<detections.length;i++){
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
  var h=(w.visualViewport&&w.visualViewport.height)||w.innerHeight;
  var ww=(w.visualViewport&&w.visualViewport.width)||w.innerWidth;
  var rs=root.style;
  rs.setProperty('--vh',(h*0.01)+'px');
  rs.setProperty('--app-height',h+'px');
  rs.setProperty('--app-width',ww+'px');
  if(!rs.getPropertyValue('--safe-bottom'))rs.setProperty('--safe-bottom','env(safe-area-inset-bottom,0px)');
}
fixViewport();
w.addEventListener('resize',fixViewport,{passive:true});
if(w.visualViewport&&w.visualViewport.addEventListener){
  w.visualViewport.addEventListener('resize',fixViewport,{passive:true});
}
S.fixes.push('viewport-fix');

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
  '.in-app-browser *{animation-duration:.16s!important;transition-duration:.12s!important;}',
  '.in-app-browser .particle-container,.in-app-browser .confetti{opacity:0!important;pointer-events:none!important;height:0!important;overflow:hidden!important;}',
  '.in-app-browser .aurora{opacity:.05!important;}',
  '.in-app-browser .glass-effect,.in-app-browser .glassmorphism,.in-app-browser .glass-surface,.in-app-browser .glass-card{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(5,9,21,.86)!important;border-color:rgba(255,255,255,.06)!important;}',
  '.in-app-browser .circular-gallery,.in-app-browser .card-swap{animation:none!important;}',
  '.in-app-browser .color-bends{animation:none!important;opacity:.55!important;}'
].join('\n');
if(d.head)d.head.appendChild(style);
S.fixes.push('css-reduced');

d.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
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
    '.ultra-light-mode *{animation:none!important;transition:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
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
      bar.style.cssText='position:fixed;top:0;left:0;right:0;padding:12px 16px;background:#000;border-bottom:1px solid rgba(255,255,255,.18);z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;color:#fff;';
      bar.innerHTML='<span style="color:#fff;font-size:13px;font-weight:500;letter-spacing:.01em;">Open in browser for best performance</span>'+
        '<div style="display:flex;gap:6px;">'+
        '<button onclick="this.parentElement.parentElement.remove()" style="background:transparent;border:1px solid rgba(255,255,255,.35);color:#fff;padding:5px 11px;border-radius:9999px;font-size:12px;line-height:1;cursor:pointer;">Dismiss</button>'+
        '<a href="'+w.location.href+'" target="_blank" style="background:#fff;color:#000;padding:5px 12px;border-radius:9999px;font-size:12px;line-height:1;text-decoration:none;font-weight:600;">Open</a>'+
        '</div>';
      d.body.appendChild(bar);
    },1800);
  },{once:true});
  S.fixes.push('open-banner');
}

if(w.location.hostname==='localhost'){
  console.log('[INAPP] browser=',S.browser,'fixes=',S.fixes.join(', '));
}
})();
