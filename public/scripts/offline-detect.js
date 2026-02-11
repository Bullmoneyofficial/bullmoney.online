// BOOST: Enhanced offline detection (auto-generated)
(function(){
  var wasOffline=false;
  function ensureBar(){
    if(document.getElementById('bm-offline-bar'))return;
    if(!document.body)return;
    var d=document.createElement('div');
    d.id='bm-offline-bar';
    d.style.cssText='position:fixed;top:0;left:0;right:0;padding:4px;background:#f59e0b;color:#000;text-align:center;font-size:12px;z-index:99999;font-family:system-ui';
    d.textContent='You are offline. Some features may be limited.';
    document.body.appendChild(d);
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
    var online=navigator.onLine;
    if(online)setOnline();
    else setOffline();
  }
  window.addEventListener('online',check);
  window.addEventListener('offline',check);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',check,{once:true});
  }else{
    check();
  }
  
  // Periodic background sync check
  setInterval(function(){
    if(!navigator.onLine)return;
    if(!('fetch' in window))return;
    fetch('/build-info.json',{cache:'no-store',method:'HEAD'})
      .then(function(r){
        if(!r.ok)throw new Error('bad-status');
        setOnline();
      })
      .catch(function(){
        setOffline();
      });
  },30000);
})();
