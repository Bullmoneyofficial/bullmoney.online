// Desktop-optimized splash - minimal animations, fast LCP
(function(){
  function run() {
    var splash = document.getElementById('bm-splash');
    if (!splash) return false;
    if (window.__BM_SPLASH_STARTED__) return true;
    window.__BM_SPLASH_STARTED__ = true;

  var raf = window.requestAnimationFrame || function(cb){ return setTimeout(cb, 16); };
  var caf = window.cancelAnimationFrame || function(id){ clearTimeout(id); };
  
  function forceHide() {
    if (!splash || splash.classList.contains('hide')) return;
    splash.classList.add('hide');
    document.documentElement.classList.add('bm-splash-done');
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
    setTimeout(function() {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 300);
    window.__BM_SPLASH_FINISHED__ = true;
    try { window.dispatchEvent(new Event('bm-splash-finished')); } catch (e) {}
  }

  // Simplified progress tracking
  var progress = 0;
  var visualProgress = 0;
  var targetPct = 0;
  var progressEl = document.getElementById('bm-splash-pct');
  var barEl = document.getElementById('bm-splash-bar');
  var animFrame;
  var startTime = Date.now();

  // Desktop: Skip all animations, go straight to minimal mode
  splash.classList.add('bm-splash-lite');

  function updateProgress(pct) {
    progress = Math.max(0, Math.min(pct, 100));
    var display = Math.floor(progress);
    if (display < 10) display = '0' + display;
    if (progressEl) progressEl.textContent = display + '%';
    if (barEl) barEl.style.width = progress + '%';
  }

  // Fast progress animation - no easing complexity
  function animateProgress() {
    if (progress < targetPct) {
      var delta = (targetPct - progress) * 0.15;
      if (delta < 0.5) delta = 0.5;
      updateProgress(progress + delta);
    }
    if (progress < 100) {
      animFrame = raf(animateProgress);
    } else {
      setTimeout(hide, 200);
    }
  }
  animFrame = raf(animateProgress);

  // Fast phase progression
  targetPct = 30;

  function onDomReady() {
    targetPct = 60;
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, {once: true});
    }
  }

  function onLoad() {
    targetPct = 85;
    waitForHydration(function() {
      targetPct = 100;
    });
  }

  // Simplified hydration check
  function waitForHydration(cb) {
    var checks = 0;
    var maxChecks = 60; // 3s max
    
    function check() {
      try {
        checks++;
        var hydrated = false;
        
        if (!document.body) {
          if (checks >= maxChecks) cb();
          else setTimeout(check, 50);
          return;
        }

        var reactRoot = document.querySelector('[data-reactroot]') || document.getElementById('__next');
        if (reactRoot && reactRoot.children && reactRoot.children.length > 0) hydrated = true;
        if (window.__BM_HYDRATED__) hydrated = true;

        if (hydrated || checks >= maxChecks) {
          cb();
        } else {
          if (targetPct < 80) targetPct += 1;
          setTimeout(check, 50);
        }
      } catch (e) {
        cb();
      }
    }
    check();
  }

  window.addEventListener('bm-hydrated', function() {
    window.__BM_HYDRATED__ = true;
  }, {once: true});

  // Simple, fast hide - no finale animations
  function hide() {
    var elapsed = Date.now() - startTime;
    // Desktop: minimal display time (100ms)
    if (elapsed < 100) {
      setTimeout(hide, 100 - elapsed);
      return;
    }
    caf(animFrame);
    splash.classList.add('hide');
    document.documentElement.classList.add('bm-splash-done');
    // Force unlock scroll
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.body.style.overflow = '';
    document.body.style.height = '';
    setTimeout(function() {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
      window.__BM_SPLASH_FINISHED__ = true;
      try { window.dispatchEvent(new Event('bm-splash-finished')); } catch (e) {}
    }, 300);
  }

  // Start
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDomReady, {once: true});
    } else {
      onDomReady();
    }

    // Desktop: aggressive timeout (4s max)
    setTimeout(forceHide, 4000);
  } catch (e) {
    forceHide();
  }
  return true;
  }

  // Quick retry mechanism
  if (run()) return;
  var tries = 0;
  var timer = setInterval(function() {
    tries += 1;
    if (run() || tries >= 40) clearInterval(timer);
  }, 50);
})();
