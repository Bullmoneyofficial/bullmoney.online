(function(){
  var swEnabled = window.__BM_SW_ENABLED__;
  var vapidKey = window.__BM_VAPID_KEY__ || '';
  
  if (swEnabled && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function(reg) {
        console.log('[SW] Registered:', reg.scope);
        setTimeout(function() {
          if (!('PushManager' in window) || !('Notification' in window)) return;
          if (Notification.permission !== 'granted') return;
          navigator.serviceWorker.ready.then(function(swReg) {
            swReg.pushManager.getSubscription().then(function(sub) {
              if (sub) {
                fetch('/api/notifications/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscription: sub.toJSON(), userAgent: navigator.userAgent, reason: 'page_load_refresh' }),
                }).catch(function() {});
              } else {
                if (!vapidKey) return;
                var padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
                var b64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
                var raw = atob(b64);
                var arr = new Uint8Array(raw.length);
                for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
                swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: arr })
                  .then(function(newSub) {
                    fetch('/api/notifications/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subscription: newSub.toJSON(), userAgent: navigator.userAgent, reason: 'auto_resubscribe' }),
                    }).catch(function() {});
                  }).catch(function(e) { console.warn('[Push] Re-subscribe failed:', e.message); });
              }
            });
          });
        }, 3000);
      })
      .catch(function(e) { console.error('[SW] Failed:', e); });
  }
  var touchStartY = 0;
  document.addEventListener('touchstart', function(e) { touchStartY = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) return;
    var deltaY = e.touches[0].clientY - touchStartY;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop <= 0 && deltaY > 10) {
      var target = e.target;
      if (!(target && target.closest && target.closest('.fixed[style*="z-index"]'))) e.preventDefault();
    }
  }, { passive: false });
})();
