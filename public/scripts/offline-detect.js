// BOOST: Enhanced offline detection (auto-generated)
(function(){
  var wasOffline=false;
  function check(){
    var online=navigator.onLine;
    document.documentElement.setAttribute('data-online',online?'true':'false');
    if(!online&&!wasOffline){
      wasOffline=true;
      document.documentElement.classList.add('is-offline');
      // Show subtle offline indicator
      var d=document.createElement('div');
      d.id='bm-offline-bar';
      d.style.cssText='position:fixed;top:0;left:0;right:0;padding:4px;background:#f59e0b;color:#000;text-align:center;font-size:12px;z-index:99999;font-family:system-ui';
      d.textContent='You are offline. Some features may be limited.';
      document.body.appendChild(d);
    } else if(online&&wasOffline){
      wasOffline=false;
      document.documentElement.classList.remove('is-offline');
      var bar=document.getElementById('bm-offline-bar');
      if(bar)bar.remove();
    }
  }
  window.addEventListener('online',check);
  window.addEventListener('offline',check);
  check();
  
  // Periodic background sync check
  setInterval(function(){
    if(navigator.onLine){
      fetch('/build-info.json',{cache:'no-store',method:'HEAD'}).catch(function(){
        document.documentElement.setAttribute('data-online','false');
      });
    }
  },30000);
})();