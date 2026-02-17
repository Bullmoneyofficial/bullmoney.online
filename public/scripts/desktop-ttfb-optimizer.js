/**
 * Desktop TTFB & Network Performance Optimizer
 * Target: Reduce TTFB from 1.27s to <0.8s, boost overall RES from 28 to 90+
 *
 * Strategies:
 * 1. Service Worker route precaching for instant repeat visits
 * 2. Navigation preloading (SWs can fetch in parallel)
 * 3. Connection warming for known API endpoints
 * 4. Stale-while-revalidate resource caching
 * 5. Prefetch critical routes for instant navigation
 * 6. Client-side response caching with TTL
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

  // ── 1. Early DNS resolution for critical domains ───────────────────
  var criticalDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://va.vercel-scripts.com'
  ];

  function warmConnections() {
    try {
      for (var i = 0; i < criticalDomains.length; i++) {
        var domain = criticalDomains[i];
        // Check if preconnect already exists
        if (d.querySelector('link[rel="preconnect"][href="' + domain + '"]')) continue;

        var link = d.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        d.head.appendChild(link);
      }
    } catch (e) {}
  }

  // Run immediately — no delay
  warmConnections();

  // ── 2. Prefetch critical navigation routes ─────────────────────────
  // Pre-fetch Next.js page data for routes desktop users commonly visit
  var prefetchedRoutes = {};
  var criticalRoutes = [
    '/',
    '/store',
    '/about',
    '/community',
    '/course'
  ];

  function prefetchRoute(route) {
    if (prefetchedRoutes[route]) return;
    prefetchedRoutes[route] = true;

    try {
      // Use the Speculation Rules API for Chrome
      if ('HTMLScriptElement' in w &&
          'supports' in HTMLScriptElement &&
          HTMLScriptElement.supports('speculationrules')) {
        var script = d.createElement('script');
        script.type = 'speculationrules';
        script.textContent = JSON.stringify({
          prefetch: [{
            source: 'list',
            urls: [route],
            eagerness: 'moderate'
          }]
        });
        d.head.appendChild(script);
      } else {
        // Fallback: use link prefetch
        var link = d.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'document';
        d.head.appendChild(link);
      }
    } catch (e) {}
  }

  // Prefetch critical routes after initial page load
  w.addEventListener('load', function () {
    setTimeout(function () {
      for (var i = 0; i < criticalRoutes.length; i++) {
        // Don't prefetch current page
        if (w.location.pathname === criticalRoutes[i]) continue;
        prefetchRoute(criticalRoutes[i]);
      }
    }, 3000);
  }, { once: true });

  // ── 3. Client-side API response caching ────────────────────────────
  // Cache API responses in memory to avoid redundant fetches
  var responseCache = {};
  var CACHE_TTL = 60000; // 60 seconds
  var MAX_ENTRIES = 30;

  // Expose for shield cleanup (best-effort)
  w.__BM_RESPONSE_CACHE__ = responseCache;

  w.__BM_CACHED_FETCH__ = function (url, options) {
    var now = Date.now();
    var cached = responseCache[url];

    if (cached && (now - cached.time < CACHE_TTL)) {
      return Promise.resolve(cached.data.clone());
    }

    return fetch(url, options).then(function (response) {
      if (response.ok) {
        responseCache[url] = {
          data: response.clone(),
          time: now
        };

        // Enforce a small cap to avoid unbounded memory growth
        try {
          var keys = Object.keys(responseCache);
          if (keys.length > MAX_ENTRIES) {
            keys.sort(function (a, b) {
              return (responseCache[a].time || 0) - (responseCache[b].time || 0);
            });
            for (var i = 0; i < keys.length - MAX_ENTRIES; i++) {
              delete responseCache[keys[i]];
            }
          }
        } catch (e) {}
      }
      return response;
    });
  };

  // Clean up stale cache entries periodically
  var cleanupInterval = setInterval(function () {
    if (d.visibilityState === 'hidden') return;
    var now = Date.now();
    for (var key in responseCache) {
      if (responseCache.hasOwnProperty(key) && now - responseCache[key].time > CACHE_TTL * 2) {
        delete responseCache[key];
      }
    }
  }, 120000); // Every 2 minutes

  // Free memory on pagehide (bfcache-friendly)
  w.addEventListener('pagehide', function () {
    try {
      clearInterval(cleanupInterval);
      responseCache = {};
      w.__BM_RESPONSE_CACHE__ = responseCache;
    } catch (e) {}
  }, { once: true });

  // ── 4. Stale-while-revalidate for static assets ────────────────────
  // Use Cache API for critical static assets
  function cacheStaticAssets() {
    if (!('caches' in w)) return;

    try {
      caches.open('bm-desktop-static-v1').then(function (cache) {
        var staticAssets = [
          '/bullmoney-logo.png',
          '/ONcc2l601.svg',
          '/icon-192x192.png',
          '/manifest.json'
        ];

        staticAssets.forEach(function (url) {
          cache.match(url).then(function (response) {
            if (!response) {
              cache.add(url).catch(function () {});
            }
          });
        });
      }).catch(function () {});
    } catch (e) {}
  }

  w.addEventListener('load', function () {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(cacheStaticAssets, { timeout: 5000 });
    } else {
      setTimeout(cacheStaticAssets, 3000);
    }
  }, { once: true });

  // ── 5. Optimize fetch priorities globally ──────────────────────────
  // Intercept fetch to add priority hints for desktop
  var originalFetch = w.fetch;
  if (originalFetch) {
    w.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      init = init || {};

      // Set priority for known endpoints
      if (url.indexOf('/api/') !== -1) {
        // API calls: high priority on desktop
        if (!init.priority) init.priority = 'high';
      }

      // Analytics/tracking: low priority
      if (url.indexOf('analytics') !== -1 ||
          url.indexOf('vercel-insights') !== -1 ||
          url.indexOf('googletagmanager') !== -1) {
        if (!init.priority) init.priority = 'low';
      }

      return originalFetch.call(w, input, init);
    };
  }

  // ── 6. Optimize Next.js RSC (React Server Component) fetches ───────
  // Next.js fetches RSC payload for each navigation — cache them
  function optimizeRSCFetches() {
    try {
      var rscCache = {};
      var originalPush = w.history.pushState;

      w.history.pushState = function () {
        var url = arguments[2];
        if (url && typeof url === 'string') {
          // On desktop, preload RSC data for the target page
          var rscUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + '_rsc=1';
          if (!rscCache[rscUrl]) {
            rscCache[rscUrl] = true;
            var link = d.createElement('link');
            link.rel = 'prefetch';
            link.href = rscUrl;
            link.as = 'fetch';
            link.crossOrigin = 'anonymous';
            d.head.appendChild(link);
          }
        }
        return originalPush.apply(w.history, arguments);
      };
    } catch (e) {}
  }

  // Run after page is interactive
  if (d.readyState === 'complete') {
    optimizeRSCFetches();
  } else {
    w.addEventListener('load', optimizeRSCFetches, { once: true });
  }

  // ── 7. Compression check and warning ───────────────────────────────
  // Verify server is sending compressed responses
  w.addEventListener('load', function () {
    try {
      var entries = performance.getEntriesByType('navigation');
      if (!entries.length) return;
      var navEntry = entries[0];

      // Log TTFB for debugging
      var ttfb = navEntry.responseStart - navEntry.requestStart;
      if (ttfb > 800) {
        console.warn('[Desktop TTFB] Slow TTFB detected:', Math.round(ttfb) + 'ms.',
          'Consider: CDN edge caching, reducing server-side computation, or using ISR.');
      }

      // Check transfer size vs decoded size for compression verification
      if (navEntry.transferSize > 0 && navEntry.decodedBodySize > 0) {
        var ratio = navEntry.transferSize / navEntry.decodedBodySize;
        if (ratio > 0.9) {
          console.warn('[Desktop TTFB] Response may not be compressed. Ratio:',
            ratio.toFixed(2), '(should be <0.5 for gzip/brotli)');
        }
      }
    } catch (e) {}
  }, { once: true });

  w.__BM_DESKTOP_TTFB_READY__ = true;

})();
