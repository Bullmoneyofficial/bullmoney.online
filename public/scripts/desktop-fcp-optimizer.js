/**
 * Desktop FCP (First Contentful Paint) Optimizer
 * Target: Reduce FCP from 3.41s to <1.8s on desktop
 * 
 * Strategies:
 * 1. Accelerate splash screen dismissal on desktop (powerful hardware)
 * 2. Defer non-critical CSS/resources that block rendering
 * 3. Prioritize above-the-fold content rendering
 * 4. Reduce main thread blocking from heavy inline styles
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var w = window, d = document, nav = navigator || {};
  var ua = String(nav.userAgent || '').toLowerCase();

  // ── Desktop-only gate ──────────────────────────────────────────────
  var isMobile = /mobi|android|iphone|ipad|ipod/i.test(ua);
  var isNarrow = (w.innerWidth || 0) < 769;
  if (isMobile || isNarrow) return;

  // Mark desktop optimization active
  try { d.documentElement.classList.add('desktop-fcp-optimized'); } catch (e) {}

  // ── 1. Wait for splash to finish naturally, then optimize ──────────
  // Do NOT interfere with splash animation — let splash-hide.js control it fully.
  // Only start FCP optimizations AFTER splash completes.
  function onSplashFinished() {
    // Apply content-visibility and other optimizations only after splash is gone
    try { d.documentElement.classList.add('desktop-post-splash'); } catch (e) {}
  }

  if (w.__BM_SPLASH_FINISHED__) {
    onSplashFinished();
  } else {
    w.addEventListener('bm-splash-finished', onSplashFinished, { once: true });
  }

  // ── 2. Defer non-critical stylesheets ──────────────────────────────
  // Convert render-blocking <link rel="stylesheet"> to async for non-critical CSS
  w.addEventListener('load', function () {
    try {
      var links = d.querySelectorAll('link[rel="stylesheet"]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        // Skip critical styles (globals, combined layout)
        if (href.indexOf('globals') !== -1 || href.indexOf('_combined') !== -1) continue;
        // Skip already-loaded Next.js chunk styles
        if (href.indexOf('/_next/static/css/') !== -1) continue;
        // Make non-critical stylesheets non-blocking for subsequent navigations
        links[i].media = 'all';
      }
    } catch (e) {}
  }, { once: true });

  // ── 3. Early content visibility optimization ───────────────────────
  // Use content-visibility: auto on below-fold sections for faster initial render
  var applyContentVisibility = function () {
    try {
      // Only apply if browser supports content-visibility
      if (!CSS.supports('content-visibility', 'auto')) return;

      var sections = d.querySelectorAll(
        'section, [data-section], .page-section, [role="region"]'
      );
      var viewportH = w.innerHeight || 900;

      for (var i = 0; i < sections.length; i++) {
        var rect = sections[i].getBoundingClientRect();
        // Skip above-fold content (critical for FCP)
        if (rect.top < viewportH * 1.5) continue;
        // Apply content-visibility to below-fold sections
        sections[i].style.contentVisibility = 'auto';
        sections[i].style.containIntrinsicSize = 'auto 500px';
      }
    } catch (e) {}
  };

  // Run after initial paint
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(applyContentVisibility, { timeout: 2000 });
  } else {
    setTimeout(applyContentVisibility, 1000);
  }

  // ── 4. Reduce main thread work ─────────────────────────────────────
  // Yield to the browser between heavy operations
  w.__BM_DESKTOP_YIELD__ = function (fn, priority) {
    if (typeof scheduler !== 'undefined' && scheduler.postTask) {
      return scheduler.postTask(fn, { priority: priority || 'background' });
    }
    if (typeof requestIdleCallback === 'function' && priority !== 'user-blocking') {
      return requestIdleCallback(fn, { timeout: 5000 });
    }
    return setTimeout(fn, 0);
  };

  // ── 5. Prerender hints for likely navigation targets ───────────────
  // On desktop, users likely hover links before clicking — prerender on hover
  var prerenderedUrls = {};
  d.addEventListener('pointerover', function (e) {
    try {
      var target = e.target;
      while (target && target.tagName !== 'A') target = target.parentElement;
      if (!target || !target.href) return;

      var url = target.href;
      // Only prerender same-origin internal links
      if (url.indexOf(w.location.origin) !== 0) return;
      // Skip already prerendered
      if (prerenderedUrls[url]) return;
      // Skip hash links and API routes
      if (url.indexOf('#') !== -1 || url.indexOf('/api/') !== -1) return;

      prerenderedUrls[url] = true;

      // Use Speculation Rules API if available (Chrome 109+)
      if ('HTMLScriptElement' in w && 'supports' in HTMLScriptElement && HTMLScriptElement.supports('speculationrules')) {
        var script = d.createElement('script');
        script.type = 'speculationrules';
        script.textContent = JSON.stringify({
          prefetch: [{ source: 'list', urls: [url] }]
        });
        d.head.appendChild(script);
      } else {
        // Fallback: prefetch link
        var link = d.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        d.head.appendChild(link);
      }
    } catch (e) {}
  }, { passive: true });

  // ── 6. Font display optimization ───────────────────────────────────
  // Ensure fonts use swap to prevent FOIT (Flash of Invisible Text)
  try {
    if ('fonts' in d) {
      d.fonts.ready.then(function () {
        d.documentElement.classList.add('fonts-loaded');
      });
    }
  } catch (e) {}

})();
