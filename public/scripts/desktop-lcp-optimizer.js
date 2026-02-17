/**
 * Desktop LCP (Largest Contentful Paint) Optimizer
 * Target: Reduce LCP from 7.26s to <2.5s on desktop
 *
 * Strategies:
 * 1. Identify and prioritize LCP element loading
 * 2. Preload critical above-fold images
 * 3. Lazy-load offscreen images aggressively
 * 4. Defer heavy third-party resources
 * 5. Optimize resource loading priority
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

  // ── 1. LCP Element Observer & Prioritizer ──────────────────────────
  // Observe what the browser considers the LCP element and boost it
  try {
    if ('PerformanceObserver' in w) {
      var lcpElement = null;
      var lcpObserver = new PerformanceObserver(function (list) {
        var entries = list.getEntries();
        if (!entries.length) return;
        var last = entries[entries.length - 1];
        lcpElement = last.element;

        // If LCP is an image, ensure it has fetchpriority=high
        if (lcpElement && lcpElement.tagName === 'IMG') {
          lcpElement.fetchPriority = 'high';
          lcpElement.loading = 'eager';
          lcpElement.decoding = 'sync';
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    }
  } catch (e) {}

  // ── 2. Preload critical hero images ────────────────────────────────
  // Inject <link rel="preload"> for likely LCP candidates
  var preloadedImages = {};
  function preloadImage(src, type) {
    if (!src || preloadedImages[src]) return;
    preloadedImages[src] = true;
    var link = d.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    if (type) link.type = type;
    link.fetchPriority = 'high';
    d.head.appendChild(link);
  }

  // Preload known hero/logo images that are LCP candidates
  preloadImage('/bullmoney-logo.png', 'image/png');

  // ── 3. Aggressive lazy-loading for offscreen images ────────────────
  function optimizeImages() {
    try {
      var images = d.querySelectorAll('img');
      var viewportH = w.innerHeight || 900;

      for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var rect = img.getBoundingClientRect();

        if (rect.top < viewportH * 1.2) {
          // Above fold: make eager, high priority
          if (!img.complete) {
            img.loading = 'eager';
            img.decoding = 'async';
          }
          // Ensure fetchPriority for hero images
          if (rect.top < viewportH * 0.5) {
            img.fetchPriority = 'high';
          }
        } else {
          // Below fold: lazy load
          if (img.loading !== 'lazy') {
            img.loading = 'lazy';
          }
          img.decoding = 'async';
          img.fetchPriority = 'low';
        }
      }
    } catch (e) {}
  }

  // Run after first paint
  if (d.readyState === 'complete' || d.readyState === 'interactive') {
    requestAnimationFrame(optimizeImages);
  } else {
    d.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(optimizeImages);
    }, { once: true });
  }

  // ── 4. Defer heavy non-critical resources ──────────────────────────
  // Pause loading of offscreen iframes and heavy media until needed
  function deferHeavyResources() {
    try {
      // Defer iframes (Spline, embeds, etc.)
      var iframes = d.querySelectorAll('iframe');
      var viewportH = w.innerHeight || 900;

      for (var i = 0; i < iframes.length; i++) {
        var iframe = iframes[i];
        var rect = iframe.getBoundingClientRect();
        if (rect.top > viewportH * 2) {
          iframe.loading = 'lazy';
        }
      }

      // Defer video elements
      var videos = d.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) {
        var video = videos[v];
        var vrect = video.getBoundingClientRect();
        if (vrect.top > viewportH * 2) {
          video.preload = 'none';
        }
      }
    } catch (e) {}
  }

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(deferHeavyResources, { timeout: 3000 });
  } else {
    w.addEventListener('load', deferHeavyResources, { once: true });
  }

  // ── 5. Resource loading priority manager ───────────────────────────
  // Dynamically adjust fetch priorities based on viewport position
  function prioritizeResources() {
    try {
      // Lower priority of scripts that aren't critical
      var scripts = d.querySelectorAll('script[src]');
      for (var s = 0; s < scripts.length; s++) {
        var src = scripts[s].getAttribute('src') || '';
        // Skip critical scripts
        if (src.indexOf('/_next/') !== -1) continue;
        if (src.indexOf('splash-') !== -1) continue;
        // Lower priority for non-essential scripts
        if (src.indexOf('detect-120hz') !== -1 ||
            src.indexOf('device-detect') !== -1 ||
            src.indexOf('spline-') !== -1 ||
            src.indexOf('push-manager') !== -1 ||
            src.indexOf('offline-detect') !== -1) {
          scripts[s].fetchPriority = 'low';
        }
      }
    } catch (e) {}
  }

  if (d.readyState === 'complete') {
    prioritizeResources();
  } else {
    w.addEventListener('load', prioritizeResources, { once: true });
  }

  // ── 6. Next.js Image component optimization ───────────────────────
  // Detect Next.js Image placeholders and speed up reveal
  function optimizeNextImages() {
    try {
      // Find Next.js Image wrapper divs with blur placeholders
      var blurPlaceholders = d.querySelectorAll('[data-nimg], img[data-nimg]');
      for (var i = 0; i < blurPlaceholders.length; i++) {
        var img = blurPlaceholders[i];
        if (img.complete && img.naturalWidth > 0) {
          // Image already loaded — remove placeholder immediately
          var parent = img.parentElement;
          if (parent) {
            var placeholder = parent.querySelector('[aria-hidden="true"]');
            if (placeholder) placeholder.style.opacity = '0';
          }
        }
      }
    } catch (e) {}
  }

  // Run image optimization periodically during load
  var imageOptTimer = setInterval(function () {
    optimizeNextImages();
  }, 500);

  w.addEventListener('load', function () {
    optimizeNextImages();
    clearInterval(imageOptTimer);
  }, { once: true });

  // ── 7. Preconnect to critical API origins ──────────────────────────
  function addPreconnect(origin) {
    try {
      var existing = d.querySelector('link[rel="preconnect"][href="' + origin + '"]');
      if (existing) return;
      var link = d.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      d.head.appendChild(link);
    } catch (e) {}
  }

  // Warm connections to likely API endpoints
  var baseUrl = w.location.origin;
  addPreconnect(baseUrl);

  // ── 8. Critical rendering path: unblock main thread ────────────────
  // Break up long tasks to allow browser to paint sooner
  w.__BM_DESKTOP_LCP_READY__ = true;

})();
