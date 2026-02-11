(function(){
  'use strict';
  try {
    var qs = window.location.search || '';
    var enabled = qs.indexOf('bm_debug=1') !== -1;
    if (!enabled) {
      try { enabled = localStorage.getItem('bm_debug') === '1'; } catch (e) {}
    }
    if (!enabled) {
      enabled = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
    if (!enabled) return;

    function ensureBanner(){
      var existing = document.getElementById('bm-debug-banner');
      if (existing) return existing;
      var el = document.createElement('div');
      el.id = 'bm-debug-banner';
      el.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:2147483647 !important;background:rgba(0,0,0,0.9);color:#fff;padding:8px 10px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;font:12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;max-width:260px;pointer-events:none;white-space:pre-wrap;opacity:1;visibility:visible;isolation:isolate;mix-blend-mode:normal;';
      if (document.body) document.body.appendChild(el);
      else document.documentElement.appendChild(el);
      return el;
    }

    function getSplashState(){
      var el = document.getElementById('bm-splash');
      if (!el) return 'missing';
      if (el.classList.contains('hide')) return 'hidden';
      var style = window.getComputedStyle(el);
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) return 'hidden';
      return 'visible';
    }

    function tick(){
      var banner = ensureBanner();
      if (document.body && banner.parentNode !== document.body) {
        document.body.appendChild(banner);
      }
      banner.style.opacity = '1';
      banner.style.visibility = 'visible';
      var root = document.documentElement;
      var mem = root.getAttribute('data-memory-level') || 'none';
      var inApp = root.classList.contains('in-app-browser') ? 'yes' : 'no';
      var emergency = root.classList.contains('memory-emergency') ? 'yes' : 'no';
      var boost = root.getAttribute('data-boost') || 'off';
      var splash = getSplashState();
      banner.textContent = 'bm_debug\n' +
        'splash: ' + splash + '\n' +
        'memory: ' + mem + '\n' +
        'emergency: ' + emergency + '\n' +
        'in-app: ' + inApp + '\n' +
        'boost: ' + boost;
    }

    tick();
    setInterval(tick, 1000);
  } catch (e) {}
})();
