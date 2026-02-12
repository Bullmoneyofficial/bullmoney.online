// BOOST: Enhanced offline detection + branded offline bar
(function(){
  var wasOffline=false;

  function isStorePage(){
    return /^\/store(\/|$)/.test(window.location.pathname||'');
  }

  function isMobile(){
    return window.matchMedia&&window.matchMedia('(max-width: 768px)').matches;
  }

  function getHeaderOffset(){
    if(!(isStorePage()&&isMobile()))return 0;
    var selectors=[
      '[data-store-header]',
      '.store-header',
      'header[role="banner"]',
      'header'
    ];
    for(var i=0;i<selectors.length;i++){
      var el=document.querySelector(selectors[i]);
      if(!el)continue;
      var r=el.getBoundingClientRect();
      if(r.height<=0)continue;
      if(r.bottom<=0)continue;
      return Math.max(0,Math.round(r.bottom));
    }
    return 56;
  }

  function styleBar(bar){
    var topOffset=getHeaderOffset();
    bar.style.cssText=[
      'position:fixed',
      'left:10px',
      'right:10px',
      'top:'+topOffset+'px',
      'padding:8px 10px',
      'background:#000',
      'color:#fff',
      'border:1px solid rgba(255,255,255,0.35)',
      'border-radius:10px',
      'font-size:12px',
      'z-index:100001',
      'font-family:system-ui,-apple-system,sans-serif',
      'display:flex',
      'align-items:center',
      'gap:8px',
      'box-shadow:0 6px 20px rgba(0,0,0,0.45)'
    ].join(';');
  }

  function ensureBar(){
    if(!document.body)return;
    var existing=document.getElementById('bm-offline-bar');
    if(existing){
      styleBar(existing);
      return existing;
    }
    var bar=document.createElement('div');
    bar.id='bm-offline-bar';
    bar.innerHTML=''
      +'<img src="/ONcc2l601.svg" alt="BullMoney" width="16" height="16" '
      +'style="display:block;filter:grayscale(1) brightness(0) invert(1);opacity:.95" />'
      +'<span style="font-weight:600;letter-spacing:.01em">Offline mode</span>'
      +'<span style="opacity:.82">Some features may be limited.</span>';
    styleBar(bar);
    document.body.appendChild(bar);
    return bar;
  }

  function setOffline(){
    document.documentElement.setAttribute('data-online','false');
    if(!wasOffline){
      wasOffline=true;
      document.documentElement.classList.add('is-offline');
      ensureBar();
    }
  }

  function setOnline(){
    document.documentElement.setAttribute('data-online','true');
    if(wasOffline){
      wasOffline=false;
      document.documentElement.classList.remove('is-offline');
      var bar=document.getElementById('bm-offline-bar');
      if(bar)bar.remove();
    }
  }

  function check(){
    if(navigator.onLine)setOnline();
    else setOffline();
  }

  window.addEventListener('online',check);
  window.addEventListener('offline',check);
  window.addEventListener('resize',function(){
    var bar=document.getElementById('bm-offline-bar');
    if(bar)styleBar(bar);
  },{passive:true});

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});
  else check();

  setInterval(function(){
    if(!navigator.onLine)return;
    if(!('fetch' in window))return;
    fetch('/build-info.json',{cache:'no-store',method:'HEAD'})
      .then(function(r){ if(!r.ok)throw new Error('bad-status'); setOnline(); })
      .catch(function(){ setOffline(); });
  },45000);
})();
