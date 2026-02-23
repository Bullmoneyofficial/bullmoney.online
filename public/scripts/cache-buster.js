(function() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var cfg = window.__BM_CACHE_BUSTER__ || {};
  var APP_VERSION = String(cfg.APP_VERSION || '');
  var PRESERVED_KEYS = Array.isArray(cfg.PRESERVED_KEYS) ? cfg.PRESERVED_KEYS : [];

  function safeGet(key){ try { return localStorage.getItem(key); } catch(e) { return null; } }
  function safeSet(key,val){ try { localStorage.setItem(key,val); } catch(e) { /* ignore */ } }
  function safeRemove(key){ try { localStorage.removeItem(key); } catch(e) { /* ignore */ } }
  function safeSessionGet(key){ try { return sessionStorage.getItem(key); } catch(e) { return null; } }
  function safeSessionSet(key,val){ try { sessionStorage.setItem(key,val); } catch(e) { /* ignore */ } }
  function safeSessionRemove(key){ try { sessionStorage.removeItem(key); } catch(e) { /* ignore */ } }

  var storedVersion = safeGet('bullmoney_app_version');

  if (storedVersion && storedVersion !== APP_VERSION) {
    if (typeof console !== 'undefined' && console.log) {
      console.log('[CacheBuster] Version mismatch:', storedVersion, '->', APP_VERSION);
    }

    if ('caches' in window) {
      try { caches.keys().then(function(names) { names.forEach(function(name) { caches.delete(name); }); }).catch(function(){}); } catch(e) {}
    }
    if ('serviceWorker' in navigator) {
      try { navigator.serviceWorker.getRegistrations().then(function(regs) { regs.forEach(function(r) { r.unregister(); }); }).catch(function(){}); } catch(e) {}
    }

    var keysToKeep = ['bullmoney_app_version'].concat(PRESERVED_KEYS);
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var key = localStorage.key(i);
        if (!key) continue;
        if (keysToKeep.indexOf(key) !== -1) continue;
        if (key.indexOf('sb-') === 0 || key.indexOf('supabase') === 0) continue;
        if (key.indexOf('bm_auth') === 0) continue;
        if (key.indexOf('bullmoney_cache') === 0 || key.indexOf('bullmoney_temp') === 0 || key.indexOf('bullmoney_spline') === 0 || key.indexOf('bullmoney_image') === 0 || key.indexOf('bullmoney_api') === 0 || key.indexOf('bullmoney_playlist') === 0 || key.indexOf('bullmoney_component') === 0) {
          safeRemove(key);
        }
      }
    } catch(e) {}

    safeSet('bullmoney_app_version', APP_VERSION);
  }

  if (!storedVersion) {
    safeSet('bullmoney_app_version', APP_VERSION);
  }

  var failedLoads = 0;
  var hasReloaded = safeSessionGet('_bm_reloaded');
  var isDev = window.location.hostname === 'localhost' || window.location.hostname.indexOf('192.168.') === 0 || window.location.hostname === '127.0.0.1';

  window.addEventListener('error', function(e) {
    var target = e.target || e.srcElement;
    if (!target || !target.tagName) return;

    var tag = target.tagName.toLowerCase();
    var src = target.src || target.href || '';

    if (src && src.indexOf('/assets/') !== -1) return;
    if (isDev && (src.indexOf('/_vercel/') !== -1 || src.indexOf('vercel-insights') !== -1 || src.indexOf('vercel-analytics') !== -1)) return;
    if (src && (src.indexOf('cal.com') !== -1 || src.indexOf('plausible.io') !== -1 || src.indexOf('google-analytics') !== -1 || src.indexOf('googletagmanager') !== -1 || src.indexOf('cdn.') !== -1 || (!src.includes(window.location.hostname) && src.indexOf('http') === 0))) return;

    if ((tag === 'script' || tag === 'link') && (src.indexOf('/_next/static/') !== -1 || src.indexOf('.js') !== -1 || src.indexOf('.css') !== -1)) {
      failedLoads += 1;
      if (console && console.error) console.error('[CacheBuster] Asset failed to load:', src);

      var isSafari = document.documentElement.classList.contains('is-safari');
      var threshold = isSafari ? 1 : 2;

      if (!hasReloaded && failedLoads >= threshold) {
        if (console && console.log) console.log('[CacheBuster] Stale cache detected, clearing and reloading...');
        safeSessionSet('_bm_reloaded', '1');

        if ('caches' in window) {
          try { caches.keys().then(function(names) { names.forEach(function(name) { caches.delete(name); }); }); } catch(e) {}
        }
        if ('serviceWorker' in navigator) {
          try { navigator.serviceWorker.getRegistrations().then(function(regs) { regs.forEach(function(r) { r.unregister(); }); }); } catch(e) {}
        }

        safeRemove('bullmoney_build_id');

        setTimeout(function() {
          window.location.href = window.location.href.split('?')[0] + '?_cache_bust=' + Date.now();
        }, 100);
      }
    }
  }, true);

  window.addEventListener('load', function() {
    setTimeout(function() { safeSessionRemove('_bm_reloaded'); }, 5000);
  });
})();
