(function(){
  var w = window, d = document, n = navigator, docEl = d.documentElement;
  var swEnabled = w.__BM_SW_ENABLED__;
  var vapidKey = w.__BM_VAPID_KEY__ || '';
  
  // ═══════════════════════════════════════════════════════════════
  // 1. SERVICE WORKER REGISTRATION
  // ═══════════════════════════════════════════════════════════════
  if (swEnabled && 'serviceWorker' in n) {
    n.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function(reg) {
        console.log('[SW] Registered:', reg.scope);

        // Register periodic background sync for push keepalive (Chrome 80+, Edge 80+)
        // This fires approx every 12 hours even when browser is closed
        if ('periodicSync' in reg) {
          reg.periodicSync.register('push-keepalive', {
            minInterval: 12 * 60 * 60 * 1000 // 12 hours
          }).then(function() {
            console.log('[SW] Periodic sync registered: push-keepalive');
          }).catch(function(e) {
            console.log('[SW] Periodic sync not available:', e.message);
          });
        }

        setTimeout(function() {
          if (!('PushManager' in w) || !('Notification' in w)) return;
          if (Notification.permission !== 'granted') return;
          n.serviceWorker.ready.then(function(swReg) {
            swReg.pushManager.getSubscription().then(function(sub) {
              if (sub) {
                fetch('/api/notifications/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscription: sub.toJSON(), userAgent: n.userAgent, reason: 'page_load_refresh' }),
                }).catch(function() {});
              } else {
                if (!vapidKey) return;
                try {
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
                        body: JSON.stringify({ subscription: newSub.toJSON(), userAgent: n.userAgent, reason: 'auto_resubscribe' }),
                      }).catch(function() {});
                    }).catch(function(e) { console.warn('[Push] Re-subscribe failed:', e.message); });
                } catch(e) { console.warn('[Push] VAPID key decode failed:', e.message); }
              }
            }).catch(function() {});
          }).catch(function() {});
        }, 3000);
      })
      .catch(function(e) { console.error('[SW] Failed:', e); });
  }

  // ═══════════════════════════════════════════════════════════════
  // SHARED: Passive event listener detection
  // ═══════════════════════════════════════════════════════════════
  var supportsPassive = false;
  try { var opts = Object.defineProperty({}, 'passive', { get: function() { supportsPassive = true; } }); w.addEventListener('__bm_test__', null, opts); w.removeEventListener('__bm_test__', null, opts); } catch (e) {}
  var PASSIVE = supportsPassive ? { passive: true } : false;
  var PASSIVE_ONCE = supportsPassive ? { passive: true, once: true } : false;
  var NOT_PASSIVE = supportsPassive ? { passive: false } : false;

  // Helper: safe closest()
  function safeClosest(el, sel) {
    if (!el || typeof el.closest !== 'function') return null;
    try { return el.closest(sel); } catch(e) { return null; }
  }

  // Is games page?
  function isGamesPage() { return docEl.hasAttribute('data-games-page'); }

  // ═══════════════════════════════════════════════════════════════
  // 2. TOUCH HANDLING — enhanced for ALL touch devices
  // Samsung Internet, UC Browser, Huawei, iOS, Android, in-app
  // ═══════════════════════════════════════════════════════════════
  var touchStartY = 0;
  var touchStartX = 0;
  var touchStartTime = 0;
  var isSwiping = false;
  var swipeDirection = null; // 'horizontal' | 'vertical' | null

  d.addEventListener('touchstart', function(e) {
    if (!e.touches || e.touches.length === 0) return;
    var t = e.touches[0];
    touchStartY = t.clientY;
    touchStartX = t.clientX;
    touchStartTime = Date.now();
    isSwiping = false;
    swipeDirection = null;
  }, PASSIVE);

  d.addEventListener('touchmove', function(e) {
    // Skip on games page — games handle their own touch
    if (isGamesPage()) return;
    if (!e.touches || e.touches.length > 1) return;

    var t = e.touches[0];
    var deltaY = t.clientY - touchStartY;
    var deltaX = t.clientX - touchStartX;

    // Determine swipe direction on first significant movement
    if (!swipeDirection) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        swipeDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
        isSwiping = true;
      }
    }

    // Prevent pull-to-refresh when scrolling down at top of page
    var scrollTop = w.pageYOffset || docEl.scrollTop || 0;
    if (scrollTop <= 0 && deltaY > 10 && swipeDirection === 'vertical') {
      var target = e.target;
      // Never block touches inside game iframes, carousels, or sliders
      if (safeClosest(target, '[data-game-iframe],[data-game-frame],[data-swiper],[data-carousel],.swiper,.carousel,.slider')) return;
      // Never block fixed elements (modals, nav bars)
      if (safeClosest(target, '.fixed[style*="z-index"],[role="dialog"],.modal')) return;
      // Allow scrollable containers to scroll
      if (safeClosest(target, '.overflow-y-auto,.overflow-y-scroll,.scroll-container,[data-scroll]')) return;
      try { e.preventDefault(); } catch(err) {}
    }
  }, NOT_PASSIVE);

  d.addEventListener('touchend', function(e) {
    if (!isSwiping) return;
    var deltaTime = Date.now() - touchStartTime;
    // Quick swipe detection (for components that listen)
    if (deltaTime < 300 && isSwiping) {
      var changedTouch = e.changedTouches && e.changedTouches[0];
      if (changedTouch) {
        var finalDeltaX = changedTouch.clientX - touchStartX;
        var finalDeltaY = changedTouch.clientY - touchStartY;
        if (Math.abs(finalDeltaX) > 50 || Math.abs(finalDeltaY) > 50) {
          try {
            w.dispatchEvent(new CustomEvent('bm:swipe', {
              detail: {
                direction: swipeDirection,
                deltaX: finalDeltaX,
                deltaY: finalDeltaY,
                velocity: Math.max(Math.abs(finalDeltaX), Math.abs(finalDeltaY)) / deltaTime,
                startX: touchStartX,
                startY: touchStartY
              }
            }));
          } catch(e) {}
        }
      }
    }
    isSwiping = false;
    swipeDirection = null;
  }, PASSIVE);

  // ═══════════════════════════════════════════════════════════════
  // 3. DESKTOP CLICK & SCROLL HANDLING
  // Mac trackpad, mouse wheel, right-click, middle-click
  // ═══════════════════════════════════════════════════════════════

  // 3a. Scroll position restoration across navigations
  var SCROLL_KEY = '_bm_scroll_pos';
  function saveScrollPos() {
    try {
      var pos = w.pageYOffset || docEl.scrollTop || 0;
      if (pos > 0) {
        sessionStorage.setItem(SCROLL_KEY + '_' + w.location.pathname, String(pos));
      }
    } catch(e) {}
  }
  function restoreScrollPos() {
    try {
      var saved = sessionStorage.getItem(SCROLL_KEY + '_' + w.location.pathname);
      if (saved) {
        var pos = parseInt(saved, 10);
        if (pos > 0 && !isNaN(pos)) {
          // Wait for content to render
          setTimeout(function() { w.scrollTo(0, pos); }, 100);
        }
        sessionStorage.removeItem(SCROLL_KEY + '_' + w.location.pathname);
      }
    } catch(e) {}
  }
  // Save on navigation/unload
  w.addEventListener('beforeunload', saveScrollPos);
  w.addEventListener('pagehide', saveScrollPos);
  // Restore on load
  if (d.readyState === 'complete') restoreScrollPos();
  else w.addEventListener('load', restoreScrollPos, PASSIVE_ONCE);

  // 3b. Desktop wheel normalization (Mac trackpad vs mouse wheel)
  // Mac trackpads generate many small deltaY values; mouse wheels generate larger ones
  // This dispatches a normalized event for components
  var lastWheelTime = 0;
  var wheelAccumX = 0, wheelAccumY = 0;
  var wheelFlushTimer = null;
  d.addEventListener('wheel', function(e) {
    var now = Date.now();
    var dt = now - lastWheelTime;
    lastWheelTime = now;

    // Detect Mac trackpad: small delta, high frequency, deltaMode === 0
    var isTrackpad = e.deltaMode === 0 && Math.abs(e.deltaY) < 50 && dt < 60;

    // Accumulate for batched dispatch
    wheelAccumX += e.deltaX;
    wheelAccumY += e.deltaY;

    if (wheelFlushTimer) clearTimeout(wheelFlushTimer);
    wheelFlushTimer = setTimeout(function() {
      try {
        w.dispatchEvent(new CustomEvent('bm:scroll', {
          detail: {
            deltaX: wheelAccumX,
            deltaY: wheelAccumY,
            isTrackpad: isTrackpad,
            isMouse: !isTrackpad,
            direction: wheelAccumY > 0 ? 'down' : 'up'
          }
        }));
      } catch(e2) {}
      wheelAccumX = 0;
      wheelAccumY = 0;
    }, 16); // ~1 frame
  }, PASSIVE);

  // 3c. Desktop scroll direction class (for showing/hiding nav)
  var lastScrollY = w.pageYOffset || 0;
  var scrollDir = 'none';
  var scrollTicking = false;
  function onScroll() {
    var currentY = w.pageYOffset || docEl.scrollTop || 0;
    var newDir = currentY > lastScrollY ? 'down' : currentY < lastScrollY ? 'up' : scrollDir;
    if (newDir !== scrollDir) {
      scrollDir = newDir;
      docEl.setAttribute('data-scroll-dir', scrollDir);
      if (scrollDir === 'down') {
        docEl.classList.add('scroll-down');
        docEl.classList.remove('scroll-up');
      } else {
        docEl.classList.add('scroll-up');
        docEl.classList.remove('scroll-down');
      }
    }
    // At top of page
    if (currentY <= 0) {
      docEl.classList.add('at-top');
      docEl.classList.remove('scrolled');
    } else {
      docEl.classList.remove('at-top');
      docEl.classList.add('scrolled');
    }
    // At bottom of page
    var scrollHeight = d.body ? d.body.scrollHeight : docEl.scrollHeight;
    if (currentY + w.innerHeight >= scrollHeight - 100) {
      docEl.classList.add('at-bottom');
    } else {
      docEl.classList.remove('at-bottom');
    }
    lastScrollY = currentY;
    scrollTicking = false;
  }
  w.addEventListener('scroll', function() {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScroll);
    }
  }, PASSIVE);
  // Initial state
  onScroll();

  // 3d. Viewport change tracking (window resize, fullscreen, DevTools open/close)
  var lastVW = w.innerWidth, lastVH = w.innerHeight;
  var viewportTimer = null;
  function handleViewportChange() {
    var newW = w.innerWidth, newH = w.innerHeight;
    if (newW === lastVW && newH === lastVH) return;

    // Detect significant vs small change
    var dw = Math.abs(newW - lastVW);
    var dh = Math.abs(newH - lastVH);
    var isSignificant = dw > 100 || dh > 100;

    // Update CSS custom properties
    docEl.style.setProperty('--vh', (newH * 0.01) + 'px');
    docEl.style.setProperty('--vw', (newW * 0.01) + 'px');
    docEl.style.setProperty('--app-height', newH + 'px');
    docEl.style.setProperty('--app-width', newW + 'px');

    // Orientation
    var orient = newW > newH ? 'landscape' : 'portrait';
    docEl.setAttribute('data-orient', orient);

    // Breakpoint classes for responsive CSS
    docEl.classList.toggle('vp-mobile', newW < 640);
    docEl.classList.toggle('vp-tablet', newW >= 640 && newW < 1024);
    docEl.classList.toggle('vp-desktop', newW >= 1024);
    docEl.classList.toggle('vp-wide', newW >= 1440);
    docEl.classList.toggle('vp-ultrawide', newW >= 2560);

    lastVW = newW;
    lastVH = newH;

    try {
      w.dispatchEvent(new CustomEvent('bm:viewport-resize', {
        detail: { w: newW, h: newH, orient: orient, significant: isSignificant }
      }));
    } catch(e) {}
  }
  function debouncedViewport() {
    if (viewportTimer) clearTimeout(viewportTimer);
    viewportTimer = setTimeout(handleViewportChange, 80);
  }
  w.addEventListener('resize', debouncedViewport, PASSIVE);
  if (w.visualViewport) {
    w.visualViewport.addEventListener('resize', debouncedViewport, PASSIVE);
  }
  w.addEventListener('orientationchange', function() { setTimeout(handleViewportChange, 150); }, PASSIVE);
  // Set initial breakpoint classes
  handleViewportChange();

  // 3e. Focus/blur detection (tab switching, window minimizing)
  var isPageVisible = true;
  function handleVisibility() {
    var hidden = d.hidden || d.webkitHidden || d.msHidden;
    if (hidden && isPageVisible) {
      isPageVisible = false;
      docEl.classList.add('page-hidden');
      docEl.classList.remove('page-visible');
      try { w.dispatchEvent(new CustomEvent('bm:page-hidden')); } catch(e) {}
    } else if (!hidden && !isPageVisible) {
      isPageVisible = true;
      docEl.classList.remove('page-hidden');
      docEl.classList.add('page-visible');
      try { w.dispatchEvent(new CustomEvent('bm:page-visible')); } catch(e) {}
    }
  }
  d.addEventListener('visibilitychange', handleVisibility);
  d.addEventListener('webkitvisibilitychange', handleVisibility); // Safari <14
  w.addEventListener('focus', function() {
    if (!isPageVisible) { isPageVisible = true; docEl.classList.add('page-visible'); docEl.classList.remove('page-hidden'); }
  }, PASSIVE);
  w.addEventListener('blur', function() {
    docEl.classList.add('page-blurred');
    setTimeout(function() { docEl.classList.remove('page-blurred'); }, 100);
  }, PASSIVE);

  // 3f. Mac-specific: detect pinch-to-zoom on trackpad
  if (docEl.classList.contains('is-mac') || docEl.classList.contains('mac-safari') || docEl.classList.contains('mac-chrome')) {
    d.addEventListener('wheel', function(e) {
      if (e.ctrlKey && e.deltaMode === 0) {
        // Pinch-to-zoom gesture detected
        var zoomIn = e.deltaY < 0;
        try {
          w.dispatchEvent(new CustomEvent('bm:pinch-zoom', {
            detail: { delta: e.deltaY, zoomIn: zoomIn, scale: 1 + (e.deltaY * -0.01) }
          }));
        } catch(e2) {}
      }
    }, PASSIVE);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. UNIVERSAL SCROLL FIX — ensure scrolling works after hydration
  // Fixes stuck scroll on iOS Safari, Samsung Internet, Firefox Android
  // ═══════════════════════════════════════════════════════════════
  function ensureScrollable() {
    // Remove any scroll-blocking styles that might be left over from splash/modals
    if (!d.querySelector('[role="dialog"]:not([data-state="closed"])')) {
      d.body.style.removeProperty('overflow');
      d.body.style.removeProperty('position');
      d.body.style.removeProperty('height');
      docEl.style.removeProperty('overflow');
      docEl.classList.remove('modal-open');
      d.body.classList.remove('modal-open');
    }
  }
  // Run after hydration (Next.js typically hydrates within 2-5 seconds)
  setTimeout(ensureScrollable, 3000);
  setTimeout(ensureScrollable, 6000);
  // Also run when splash hides
  var splashObs = null;
  try {
    var splashEl = d.getElementById('bm-splash');
    if (splashEl && 'MutationObserver' in w) {
      splashObs = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (splashEl.classList.contains('hide')) {
            setTimeout(ensureScrollable, 500);
            splashObs.disconnect();
            break;
          }
        }
      });
      splashObs.observe(splashEl, { attributes: true, attributeFilter: ['class'] });
    }
  } catch(e) {}

  // ═══════════════════════════════════════════════════════════════
  // 5. BACK/FORWARD CACHE (bfcache) SUPPORT
  // Ensures proper state restoration on back/forward navigation
  // Critical for Safari on Mac and iOS
  // ═══════════════════════════════════════════════════════════════
  w.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      // Page was restored from bfcache
      handleViewportChange();
      onScroll();
      ensureScrollable();
      try { w.dispatchEvent(new CustomEvent('bm:bfcache-restore')); } catch(e2) {}
    }
  }, PASSIVE);

})();
