/**
 * first-visit-refresh.js
 *
 * First-time visitor only (no cache yet):
 *  1. Intercept the splash screen WHILE it is still visible.
 *  2. Freeze all splash animations in place (CSS animation-play-state).
 *  3. Block the splash dismiss classes (hide / bm-ready) with a MutationObserver.
 *  4. Append an Apple-style pill toast INSIDE #bm-splash — no separate background.
 *  5. After the toast, set the localStorage flag and hard-reload to seed the cache.
 */
(function () {
  'use strict';
  try {
    var STORAGE_KEY = 'bm-fv-cached-v1';

    // Already cached on a previous visit — do nothing
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch (e) { return; }

    var intercepted = false;
    var dismissObserver = null;

    // ── Inject styles: freeze class + toast animations ────────────────────────
    function injectStyles() {
      if (document.getElementById('bm-fvr-styles')) return;
      var s = document.createElement('style');
      s.id = 'bm-fvr-styles';
      s.textContent = [
        /* Pause every CSS animation on the splash while we show the toast */
        '#bm-splash.bm-fvr-freeze,',
        '#bm-splash.bm-fvr-freeze *{',
        '  animation-play-state:paused !important;',
        '  transition:none !important;',
        '}',
        /* Toast pop-in */
        '@keyframes bm-fvr-in{',
        '  0%  {opacity:0;transform:translate(-50%,-50%) scale(0.74);}',
        '  60% {opacity:1;transform:translate(-50%,-50%) scale(1.06);}',
        '  100%{opacity:1;transform:translate(-50%,-50%) scale(1);}',
        '}',
        /* Toast pop-out */
        '@keyframes bm-fvr-out{',
        '  0%  {opacity:1;transform:translate(-50%,-50%) scale(1);}',
        '  100%{opacity:0;transform:translate(-50%,-50%) scale(0.82);}',
        '}',
        /* Toast pill — positioned inside the fixed splash container */
        '#bm-fvr-toast{',
        '  position:absolute;',       /* sits inside #bm-splash (fixed, full-screen) */
        '  top:50%;left:50%;',
        '  transform:translate(-50%,-50%) scale(0.74);',
        '  z-index:999990;',           /* high enough for body-level fallback; clipped to splash stacking context when inside #bm-splash */
        '  display:flex;',
        '  align-items:center;',
        '  gap:10px;',
        '  padding:14px 24px;',
        '  border-radius:100px;',
        '  background:rgba(28,28,30,0.90);',
        '  -webkit-backdrop-filter:blur(24px) saturate(1.8);',
        '  backdrop-filter:blur(24px) saturate(1.8);',
        '  box-shadow:0 8px 40px rgba(0,0,0,0.5),0 1px 0 rgba(255,255,255,0.07) inset;',
        '  border:1px solid rgba(255,255,255,0.12);',
        '  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Arial,sans-serif;',
        '  font-size:15px;',
        '  font-weight:500;',
        '  letter-spacing:-0.01em;',
        '  color:#fff;',
        '  white-space:nowrap;',
        '  pointer-events:none;',
        '  user-select:none;',
        '  -webkit-user-select:none;',
        '  will-change:transform,opacity;',
        '  opacity:0;',
        '}',
        '#bm-fvr-toast .bm-fvr-dot{',
        '  width:7px;height:7px;',
        '  border-radius:50%;',
        '  background:#34c759;',
        '  flex-shrink:0;',
        '  box-shadow:0 0 8px #34c759;',
        '}'
      ].join('');
      (document.head || document.documentElement).appendChild(s);
    }

    // ── Block splash dismiss classes while toast is active ────────────────────
    function blockDismiss(splash) {
      try {
        dismissObserver = new MutationObserver(function () {
          // Remove any dismiss trigger class — keeps splash frozen until reload
          if (splash.classList.contains('hide'))     splash.classList.remove('hide');
          if (splash.classList.contains('bm-ready')) splash.classList.remove('bm-ready');
        });
        dismissObserver.observe(splash, { attributes: true, attributeFilter: ['class'] });
      } catch (e) {}
    }

    // ── Core: freeze splash, mount toast inside it, then reload ───────────────
    function interceptSplash() {
      if (intercepted) return;

      var splash = document.getElementById('bm-splash');

      intercepted = true;
      injectStyles();

      var mountInSplash = !!(splash && !splash.classList.contains('hide') && !splash.classList.contains('bm-ready'));

      if (mountInSplash) {
        // Splash still fully visible — freeze it and mount toast inside it
        splash.classList.add('bm-fvr-freeze');
        blockDismiss(splash);
      }
      // If splash is gone/dismissed, fall through and mount on document.body (position:fixed)

      // 3. Build the toast pill and mount it INSIDE the splash
      var toast = document.createElement('div');
      toast.id = 'bm-fvr-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');

      var dot = document.createElement('span');
      dot.className = 'bm-fvr-dot';
      dot.setAttribute('aria-hidden', 'true');

      var text = document.createElement('span');
      text.textContent = 'Data save refresh';

      toast.appendChild(dot);
      toast.appendChild(text);

      if (mountInSplash) {
        // Inside the splash — position:absolute centres within the fixed fullscreen splash
        splash.appendChild(toast);
      } else {
        // Splash already gone — switch to fixed positioning so it floats over the page
        toast.style.position = 'fixed';
        document.body.appendChild(toast);
      }

      // 4. Animate in (double-rAF ensures the initial opacity:0 has painted first)
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          toast.style.animation = 'bm-fvr-in 420ms cubic-bezier(0.34,1.56,0.64,1) both';
        });
      });

      // 5. Hold → fade out → reload
      var isProd = window.location.hostname === 'bullmoney.online' || window.location.hostname === 'www.bullmoney.online';
      var holdMs = isProd ? 2000 : 1000;
      var outMs  = 320;

      setTimeout(function () {
        toast.style.animation = 'bm-fvr-out ' + outMs + 'ms cubic-bezier(0.4,0,1,1) both';

        setTimeout(function () {
          if (dismissObserver) { try { dismissObserver.disconnect(); } catch (e) {} }
          try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
          // Hard reload: fetch the page bypassing cache first, then reload
          try {
            fetch(window.location.href, {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
            }).then(function () {
              window.location.reload();
            }).catch(function () {
              window.location.reload();
            });
          } catch (e) {
            try { window.location.reload(); } catch (e2) {}
          }
        }, outMs + 80);
      }, holdMs);
    }

    // ── Try to intercept as soon as the splash element exists ─────────────────
    // afterInteractive fires after hydration — splash is almost always still
    // visible at this point, but we use two strategies to be safe.

    function tryIntercept() {
      var splash = document.getElementById('bm-splash');
      if (splash && !splash.classList.contains('bm-fvr-freeze')) {
        interceptSplash();
        return true;
      }
      return false;
    }

    // Attempt immediately (double-rAF so React has painted at least one frame)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (!intercepted) tryIntercept();
      });
    });

    // Fast poll as fallback in case rAF fires before #bm-splash is in the DOM
    var pollId = setInterval(function () {
      if (intercepted) { clearInterval(pollId); return; }
      if (tryIntercept()) clearInterval(pollId);
    }, 100);

    // Hard upper limit — if nothing works after 10 s, silently seed cache
    setTimeout(function () {
      clearInterval(pollId);
      if (!intercepted) {
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
        try {
          fetch(window.location.href, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
            .then(function () { window.location.reload(); })
            .catch(function () { window.location.reload(); });
        } catch (e) { try { window.location.reload(); } catch (e2) {} }
      }
    }, 10000);

  } catch (e) {
    // Never block the page for any reason
  }
})();

