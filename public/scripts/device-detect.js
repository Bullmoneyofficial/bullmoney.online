(function(){
var d=document.documentElement,n=navigator,s=screen,w=window;
var ua=n.userAgent||'',p=n.platform||'';
var R={};

// 1. Device Type Detection
var isMobile=/mobi|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
var isTablet=/ipad|tablet|playbook|silk/i.test(ua)||(isMobile&&Math.min(s.width,s.height)>600);
var isDesktop=!isMobile&&!isTablet;
R.device=isTablet?'tablet':isMobile?'mobile':'desktop';
d.setAttribute('data-device',R.device);

// 2. OS Detection
var os='unknown';
if(/windows/i.test(ua))os='windows';
else if(/harmonyos/i.test(ua))os='harmonyos';
else if(/macintosh|mac os/i.test(ua))os=n.maxTouchPoints>1?'ios':'macos';
else if(/linux/i.test(ua)&&!isMobile)os='linux';
else if(/android/i.test(ua))os='android';
else if(/iphone|ipad|ipod/i.test(ua))os='ios';
else if(/cros/i.test(ua))os='chromeos';
R.os=os;d.setAttribute('data-os',os);

// 3. Browser Detection — Enhanced for worldwide coverage
var browser='other';
if(/samsungbrowser/i.test(ua))browser='samsung';
else if(/ucbrowser|ubrowser/i.test(ua))browser='uc';
else if(/huaweibrowser|hmscore/i.test(ua))browser='huawei';
else if(/miuibrowser/i.test(ua))browser='miui';
else if(/qqbrowser|mqqbrowser/i.test(ua))browser='qq';
else if(/baidu|baidubrowser/i.test(ua))browser='baidu';
else if(/yabrowser/i.test(ua))browser='yandex';
else if(/brave/i.test(ua))browser='brave';
else if(/vivaldi/i.test(ua))browser='vivaldi';
else if(/opera mini/i.test(ua))browser='opera-mini';
else if(/edg\//i.test(ua))browser='edge';
else if(/opr\//i.test(ua)||/opera/i.test(ua))browser='opera';
else if(/fxios/i.test(ua))browser='firefox-ios';
else if(/firefox/i.test(ua))browser='firefox';
else if(/crios/i.test(ua))browser='chrome-ios';
else if(/chrome|chromium/i.test(ua)&&!/edg/i.test(ua))browser='chrome';
else if(/safari/i.test(ua)&&!/chrome/i.test(ua))browser='safari';
else if(/msie|trident/i.test(ua))browser='ie';
R.browser=browser;d.setAttribute('data-browser',browser);
// Add browser-specific classes for CSS targeting
if(browser==='samsung')d.classList.add('samsung-browser');
if(browser==='uc')d.classList.add('uc-browser');
if(browser==='huawei')d.classList.add('huawei-browser');
if(browser==='miui')d.classList.add('miui-browser');
if(browser==='opera-mini'){d.classList.add('opera-mini');d.classList.add('reduce-effects');}
if(browser==='safari'){d.classList.add('is-safari');if(os==='ios')d.classList.add('is-ios-safari');}

// 3b. Mac-Specific Detection (Apple Silicon M1-M6, Chrome/Safari versions)
if(os==='macos'){
  d.classList.add('is-mac');
  // Detect Apple Silicon vs Intel via core count + GPU heuristics
  var macCores=n.hardwareConcurrency||0;
  var macMem=n.deviceMemory||0;
  // M1+ chips have 8+ cores; Intel Macs typically have 2-8
  // Also check WebGL renderer for Apple GPU
  var isAppleSilicon=false;
  try{
    var cv=document.createElement('canvas');
    var gl=cv.getContext('webgl2')||cv.getContext('webgl');
    if(gl){
      var dbg=gl.getExtension('WEBGL_debug_renderer_info');
      if(dbg){
        var renderer=(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)||'').toLowerCase();
        // Apple GPU = Apple Silicon (M1/M2/M3/M4/M5/M6)
        isAppleSilicon=renderer.indexOf('apple')!==-1&&renderer.indexOf('gpu')!==-1;
        R.gpuRenderer=gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
        R.gpuVendor=gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
      }
      // Lose context to free resources
      var lc=gl.getExtension('WEBGL_lose_context');
      if(lc)lc.loseContext();
    }
  }catch(e){}
  // Fallback heuristic: 8+ performance cores + Mac = likely Apple Silicon
  if(!isAppleSilicon&&macCores>=8)isAppleSilicon=true;
  R.isAppleSilicon=isAppleSilicon;
  R.macChip=isAppleSilicon?'apple-silicon':'intel';
  d.setAttribute('data-mac-chip',R.macChip);
  if(isAppleSilicon)d.classList.add('apple-silicon');
  else d.classList.add('intel-mac');

  // Safari version on Mac
  if(browser==='safari'){
    var safariMatch=ua.match(/version\/(\d+\.?\d*)/i);
    R.safariVersion=safariMatch?parseFloat(safariMatch[1]):0;
    d.setAttribute('data-safari-version',R.safariVersion);
    d.classList.add('mac-safari');
  }
  // Chrome version on Mac
  if(browser==='chrome'){
    var chromeMatch=ua.match(/chrome\/(\d+)/i);
    R.chromeVersion=chromeMatch?parseInt(chromeMatch[1],10):0;
    d.setAttribute('data-chrome-version',R.chromeVersion);
    d.classList.add('mac-chrome');
  }
}

// 4. Screen & Display
var dpr=w.devicePixelRatio||1;
var sw=s.width,sh=s.height;
R.dpr=dpr;R.screenW=sw;R.screenH=sh;
d.style.setProperty('--device-dpr',dpr);
d.style.setProperty('--screen-w',sw+'px');
d.style.setProperty('--screen-h',sh+'px');
d.style.setProperty('--vh',(w.innerHeight*0.01)+'px');

var tier=sw>=2560?'4k':sw>=1920?'fhd':sw>=1440?'qhd':sw>=1024?'hd':sw>=768?'tablet':'mobile';
R.displayTier=tier;d.setAttribute('data-display',tier);

// 5. Connection Speed Detection
var conn=n.connection||n.mozConnection||n.webkitConnection;
if(conn){
  R.connType=conn.effectiveType||'unknown';
  R.downlink=conn.downlink||0;
  R.saveData=!!conn.saveData;
  d.setAttribute('data-connection',R.connType);
  if(R.saveData)d.classList.add('save-data');
  if(R.connType==='slow-2g'||R.connType==='2g')d.classList.add('slow-network');
}

// 6. Hardware Capabilities
R.cores=n.hardwareConcurrency||4;
R.memory=n.deviceMemory||4;
R.touch='ontouchstart' in w||n.maxTouchPoints>0;
d.setAttribute('data-cores',R.cores);
d.setAttribute('data-memory',R.memory);
if(R.touch)d.classList.add('touch-device');else d.classList.add('no-touch');

// 6b. Desktop Input Capabilities (pointer precision, hover, keyboard)
R.hasPointer=w.matchMedia?w.matchMedia('(pointer:fine)').matches:!R.touch;
R.hasCoarsePointer=w.matchMedia?w.matchMedia('(pointer:coarse)').matches:R.touch;
R.hasHover=w.matchMedia?w.matchMedia('(hover:hover)').matches:!R.touch;
R.hasAnyHover=w.matchMedia?w.matchMedia('(any-hover:hover)').matches:!R.touch;
R.hasKeyboard=!R.touch||isDesktop;
// Hybrid device detection (e.g. Surface, iPad with keyboard, touchscreen laptop)
R.isHybrid=(R.touch&&R.hasPointer)||(R.hasHover&&R.hasCoarsePointer);
if(R.hasPointer)d.classList.add('pointer-fine');
if(R.hasCoarsePointer)d.classList.add('pointer-coarse');
if(R.hasHover)d.classList.add('has-hover');
if(R.isHybrid)d.classList.add('hybrid-device');
if(isDesktop)d.classList.add('is-desktop');
d.setAttribute('data-pointer',R.hasPointer?'fine':'coarse');
d.setAttribute('data-hover',R.hasHover?'hover':'none');
// Mac trackpad detection heuristic
if(os==='macos'){
  R.hasTrackpad=true; // All modern Macs have trackpads (or Magic Mouse with gesture support)
  d.classList.add('has-trackpad');
}

// 7. Performance Tier (low/mid/high/ultra)
var perfScore=0;
perfScore+=R.cores>=8?3:R.cores>=4?2:1;
perfScore+=R.memory>=8?3:R.memory>=4?2:1;
perfScore+=dpr>=2?2:1;
perfScore+=sw>=1920?2:sw>=1024?1:0;
if(R.connType==='4g'||!R.connType)perfScore+=2;
else if(R.connType==='3g')perfScore+=1;
var perfTier=perfScore>=11?'ultra':perfScore>=8?'high':perfScore>=5?'mid':'low';
R.perfTier=perfTier;d.setAttribute('data-perf',perfTier);

// 8. Feature Detection
R.webgl=!!(function(){try{var c=document.createElement('canvas');return c.getContext('webgl2')||c.getContext('webgl')}catch(e){return false}})();
R.webp=!!(function(){try{var c=document.createElement('canvas');return c.toDataURL('image/webp').indexOf('data:image/webp')===0}catch(e){return false}})();
R.avif=false; // async detection below
if(!R.webgl)d.classList.add('no-webgl');
if(R.webp)d.classList.add('webp-support');

// Store for JS access
w.__BM_DEVICE__=R;

// 8b. Async AVIF detection
var img=new Image();
img.onload=function(){R.avif=true;d.classList.add('avif-support')};
img.src='data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErU42Y=';

// 9. Reduce Motion preference
if(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches){
  d.classList.add('reduce-motion');R.reduceMotion=true;
}

// 10. Dark mode preference
if(w.matchMedia&&w.matchMedia('(prefers-color-scheme: dark)').matches){
  d.classList.add('prefers-dark');
}

// 11. Battery detection (async)
if(n.getBattery){n.getBattery().then(function(b){
  R.battery=Math.round(b.level*100);R.charging=b.charging;
  if(b.level<0.15&&!b.charging){d.classList.add('low-battery');d.setAttribute('data-battery','low');}
  else if(b.level<0.3&&!b.charging){d.setAttribute('data-battery','medium');}
  else{d.setAttribute('data-battery','good');}
});}

// 12. Viewport orientation + desktop resize tracking
var orient=w.innerWidth>w.innerHeight?'landscape':'portrait';
R.orientation=orient;d.setAttribute('data-orient',orient);
R.viewportW=w.innerWidth;R.viewportH=w.innerHeight;
d.style.setProperty('--vw',(w.innerWidth*0.01)+'px');
d.setAttribute('data-viewport-w',w.innerWidth);
d.setAttribute('data-viewport-h',w.innerHeight);

// Viewport change handler — debounced for performance
var resizeTimer=null;
function onViewportChange(){
  if(resizeTimer)clearTimeout(resizeTimer);
  resizeTimer=setTimeout(function(){
    var newW=w.innerWidth,newH=w.innerHeight;
    var o2=newW>newH?'landscape':'portrait';
    d.setAttribute('data-orient',o2);
    d.style.setProperty('--vh',(newH*0.01)+'px');
    d.style.setProperty('--vw',(newW*0.01)+'px');
    d.setAttribute('data-viewport-w',newW);
    d.setAttribute('data-viewport-h',newH);
    R.viewportW=newW;R.viewportH=newH;R.orientation=o2;
    // Update display tier on resize (desktop window resize)
    var newTier=newW>=2560?'4k':newW>=1920?'fhd':newW>=1440?'qhd':newW>=1024?'hd':newW>=768?'tablet':'mobile';
    if(newTier!==R.displayTier){R.displayTier=newTier;d.setAttribute('data-display',newTier);}
    // Dispatch custom event for components to listen to
    try{w.dispatchEvent(new CustomEvent('bm:viewport-change',{detail:{w:newW,h:newH,orient:o2,tier:newTier}}));}catch(e){}
  },100);
}
w.addEventListener('resize',onViewportChange);
if(w.visualViewport){
  w.visualViewport.addEventListener('resize',onViewportChange);
  w.visualViewport.addEventListener('scroll',function(){
    // Track virtual keyboard open/close on mobile
    var vvH=w.visualViewport.height;
    var fullH=w.innerHeight;
    if(vvH<fullH*0.75){
      d.classList.add('keyboard-open');
      d.style.setProperty('--keyboard-height',(fullH-vvH)+'px');
    }else{
      d.classList.remove('keyboard-open');
      d.style.setProperty('--keyboard-height','0px');
    }
  });
}
w.addEventListener('orientationchange',function(){setTimeout(onViewportChange,150);});

// 13. PWA / Standalone detection
R.isPWA=w.navigator.standalone===true||(w.matchMedia&&w.matchMedia('(display-mode:standalone)').matches);
if(R.isPWA){d.classList.add('is-pwa');d.setAttribute('data-pwa','true');}

// 14. In-app browser detection
var inAppBrowser='none';
if(/instagram/i.test(ua))inAppBrowser='instagram';
else if(/fban|fbav|fb_iab|facebook/i.test(ua))inAppBrowser='facebook';
else if(/tiktok|bytedance/i.test(ua))inAppBrowser='tiktok';
else if(/twitter/i.test(ua))inAppBrowser='twitter';
else if(/snapchat/i.test(ua))inAppBrowser='snapchat';
else if(/micromessenger|wechat/i.test(ua))inAppBrowser='wechat';
else if(/line\//i.test(ua))inAppBrowser='line';
else if(/telegram/i.test(ua))inAppBrowser='telegram';
else if(/discord/i.test(ua))inAppBrowser='discord';
else if(/linkedin/i.test(ua))inAppBrowser='linkedin';
else if(/pinterest/i.test(ua))inAppBrowser='pinterest';
else if(/whatsapp/i.test(ua))inAppBrowser='whatsapp';
else if(/gsa\//i.test(ua))inAppBrowser='google-app';
else if(/reddit/i.test(ua))inAppBrowser='reddit';
R.inAppBrowser=inAppBrowser;
if(inAppBrowser!=='none'){d.setAttribute('data-inapp-browser',inAppBrowser);d.classList.add('in-app-detected');}

// 15. Foldable device detection (Samsung Galaxy Z Fold/Flip, Pixel Fold, etc.)
var screenRatio=Math.max(sw,sh)/Math.min(sw,sh);
R.isFoldable=screenRatio>2.1;
if(R.isFoldable)d.classList.add('foldable-device');

// 16. Safe country/locale detection for UI hints
R.language=n.language||n.userLanguage||'en';
R.languages=n.languages||[R.language];
d.setAttribute('data-lang',R.language.split('-')[0]);

// Register with global Brain orchestrator
if(w.__BM_BRAIN__&&w.__BM_BRAIN__.register)w.__BM_BRAIN__.register('device-detect',R);
try{w.dispatchEvent(new CustomEvent('bm:device-detect-ready',{detail:R}));}catch(e){}

})();