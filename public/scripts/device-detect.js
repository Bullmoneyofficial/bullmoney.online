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
else if(/macintosh|mac os/i.test(ua))os='macos';
else if(/linux/i.test(ua)&&!isMobile)os='linux';
else if(/android/i.test(ua))os='android';
else if(/iphone|ipad|ipod/i.test(ua))os='ios';
else if(/cros/i.test(ua))os='chromeos';
R.os=os;d.setAttribute('data-os',os);

// 3. Browser Detection
var browser='other';
if(/edg\//i.test(ua))browser='edge';
else if(/opr\//i.test(ua)||/opera/i.test(ua))browser='opera';
else if(/firefox/i.test(ua))browser='firefox';
else if(/chrome/i.test(ua)&&!/edg/i.test(ua))browser='chrome';
else if(/safari/i.test(ua)&&!/chrome/i.test(ua))browser='safari';
else if(/msie|trident/i.test(ua))browser='ie';
R.browser=browser;d.setAttribute('data-browser',browser);

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

// 12. Viewport orientation
var orient=w.innerWidth>w.innerHeight?'landscape':'portrait';
R.orientation=orient;d.setAttribute('data-orient',orient);
w.addEventListener('resize',function(){
  var o2=w.innerWidth>w.innerHeight?'landscape':'portrait';
  d.setAttribute('data-orient',o2);
  d.style.setProperty('--vh',(w.innerHeight*0.01)+'px');
});

})();