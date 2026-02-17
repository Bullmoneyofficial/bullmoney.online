/**
 * DESKTOP FAST RENDERING OPTIMIZER — BullMoney
 * ═════════════════════════════════════════════
 * Aggressive rendering performance tuning:
 *  • Batch DOM reads/writes to prevent layout thrashing
 *  • Use modern CSS containment for isolated layout
 *  • Optimize image rendering to reduce CPU
 *  • Reduce re-paints with CSS will-change hints
 *  • Enable hardware acceleration for animations
 *  • Optimize font rendering strategy
 *  • Defer non-critical paint operations
 *  • Monitor and report rendering metrics
 *
 * Self-gates to desktop only (>769px, non-mobile UA).
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  var w = window;
  var d = document;
  var html = d.documentElement;

  // Desktop gate
  var width = w.innerWidth || d.documentElement.clientWidth || 0;
  if (width <= 769) return;
  var ua = navigator.userAgent || '';
  if (/mobi|android|iphone|ipad|ipod/i.test(ua) && !/macintosh/i.test(ua)) return;

  /* ═══════════════════════════════════════════════════════════════════
   * 1. RENDERING PERFORMANCE MONITORING
   * ═══════════════════════════════════════════════════════════════════ */

  var paintCount = 0;
  var layoutCount = 0;
  var lastPaintTime = performance.now();
  var lastLayoutTime = performance.now();
  var isHeavyRendering = false;

  function monitorRenderingPerformance() {
    // Monitor Long Tasks (rendering + JS > 50ms)
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        var paintObserver = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (entry.name === 'first-paint' || entry.name === 'first-contentful-paint') {
              console.info('[BM-Render]', entry.name + ':', Math.round(entry.startTime) + 'ms');
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {}

      // Long task detection
      try {
        var longTaskObs = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (entry.duration > 50) {
              console.warn('[BM-Render] Long task detected:', Math.round(entry.duration) + 'ms');
              isHeavyRendering = true;
              html.classList.add('bm-heavy-render');
              
              // Clear heavy render class after 200ms
              setTimeout(function () {
                html.classList.remove('bm-heavy-render');
                isHeavyRendering = false;
              }, 200);
            }
          }
        });
        longTaskObs.observe({ type: 'longtask', buffered: false });
      } catch (e) {}
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 2. CSS CONTAINMENT & LAYOUT OPTIMIZATION
   * ═══════════════════════════════════════════════════════════════════ */

  function optimizeContainment() {
    var style = d.createElement('style');
    style.id = 'bm-fast-render-css';
    style.textContent = [
      '@media (min-width: 769px) {',

      // Content visibility for below-fold
      'section:checked + section, [role="tabpanel"] {',
      '  content-visibility: auto;',
      '  contain-intrinsic-size: auto 400px;',
      '}',

      // Layout containment on cards + components
      '[class*="card"], [class*="Card"],',
      '[role="article"], article,',
      '.component, [data-component] {',
      '  contain: layout style paint;',
      '}',

      // Paint containment on non-interactive containers
      '[class*="container"], .section, .wrapper {',
      '  contain: paint;',
      '}',

      // Strict containment on grid cells
      '.grid-item, [role="gridcell"] {',
      '  contain: strict;',
      '}',

      // Image optimization
      'img {',
      '  image-rendering: crisp-edges;',
      '  image-rendering: -webkit-optimize-contrast;',
      '  backface-visibility: hidden;',
      '  -webkit-font-smoothing: antialiased;',
      '}',

      // Text rendering  
      'body, h1, h2, h3, h4, h5, h6 {',
      '  -webkit-font-smoothing: antialiased;',
      '  -moz-osx-font-smoothing: grayscale;',
      '  text-rendering: optimizeLegibility;',
      '}',

      // Reduce repaints during heavy rendering
      'html.bm-heavy-render * {',
      '  animation-play-state: paused;',
      '  transition: none !important;',
      '}',

      '}'
    ].join('\n');
    d.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 3. BATCH DOM OPERATIONS (Layout Thrash Prevention)
   * ═══════════════════════════════════════════════════════════════════ */

  var readQueue = [];
  var writeQueue = [];
  var isProcessingBatch = false;

  w.__BM_BATCH_READ__ = function (fn) {
    // Queue DOM reads to batch instead of interleaving with writes
    readQueue.push(fn);
    if (!isProcessingBatch) processBatch();
  };

  w.__BM_BATCH_WRITE__ = function (fn) {
    // Queue DOM writes to batch instead of interleaving with reads
    writeQueue.push(fn);
    if (!isProcessingBatch) processBatch();
  };

  function processBatch() {
    if (isProcessingBatch) return;
    isProcessingBatch = true;

    requestAnimationFrame(function () {
      // Process all reads first
      while (readQueue.length > 0) {
        var fn = readQueue.shift();
        try {
          fn();
        } catch (e) {
          console.error('[BM-Render] Batch read error:', e);
        }
      }

      // Then process all writes
      while (writeQueue.length > 0) {
        var fn = writeQueue.shift();
        try {
          fn();
        } catch (e) {
          console.error('[BM-Render] Batch write error:', e);
        }
      }

      isProcessingBatch = false;
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 4. DEFER NON-CRITICAL PAINT OPERATIONS
   * ═══════════════════════════════════════════════════════════════════ */

  w.__BM_DEFER_PAINT__ = function (fn, priority) {
    // Use Scheduler API if available (high-priority = user-blocking)
    if (typeof scheduler !== 'undefined' && scheduler.postTask) {
      return scheduler.postTask(fn, { 
        priority: priority === 'high' ? 'user-blocking' : 'background'
      });
    }

    // Fallback: requestIdleCallback for background work
    if (typeof requestIdleCallback === 'function' && priority !== 'high') {
      return requestIdleCallback(fn, { timeout: 5000 });
    }

    // Final fallback: setTimeout
    return setTimeout(fn, priority === 'high' ? 0 : 100);
  };

  /* ═══════════════════════════════════════════════════════════════════
   * 5. OPTIMIZE IMAGE RENDERING
   * ═══════════════════════════════════════════════════════════════════ */

  function optimizeImages() {
    var images = d.querySelectorAll('img[loading!="lazy"]');
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      
      // Set decoding="async" to decode images off-main-thread
      if (!img.hasAttribute('decoding')) {
        img.decoding = 'async';
      }

      // Add will-change for images in animations
      var parent = img.parentElement;
      if (parent && parent.className.indexOf('animate') !== -1) {
        img.style.willChange = 'transform';
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 6. FONT LOADING OPTIMIZATION
   * ═══════════════════════════════════════════════════════════════════ */

  function optimizeFontLoading() {
    // Ensure fonts load asynchronously without blocking rendering
    if (d.fonts && d.fonts.ready) {
      d.fonts.ready.then(function () {
        html.classList.add('bm-fonts-loaded');
        console.info('[BM-Render] Fonts loaded');
      }).catch(function () {
        // Use fallback fonts if web fonts fail
        html.classList.add('bm-fonts-fallback');
      });
    }

    // Add font-display: swap for all @font-face rules
    var style = d.createElement('style');
    style.textContent = [
      'html.bm-fonts-fallback {',
      '  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;',
      '}'
    ].join('\n');
    d.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 7. RENDERING METRICS EXPORT
   * ═══════════════════════════════════════════════════════════════════ */

  w.__BM_RENDER_METRICS__ = {
    isPaintHeavy: function () { return isHeavyRendering; },
    getReadQueueSize: function () { return readQueue.length; },
    getWriteQueueSize: function () { return writeQueue.length; },
    getMetrics: function () {
      return {
        isHeavy: isHeavyRendering,
        readQueue: readQueue.length,
        writeQueue: writeQueue.length,
        timestamp: performance.now()
      };
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
   * 8. INITIALIZATION
   * ═══════════════════════════════════════════════════════════════════ */

  function init() {
    console.info('[BM-Render] Initializing fast rendering optimizer');

    // Apply optimizations
    optimizeContainment();
    optimizeImages();
    optimizeFontLoading();

    // Start monitoring
    if (d.readyState === 'loading') {
      d.addEventListener('DOMContentLoaded', monitorRenderingPerformance, { once: true });
    } else {
      monitorRenderingPerformance();
    }
  }

  // Initialize after splash finishes
  if (w.__BM_SPLASH_FINISHED__) {
    init();
  } else {
    w.addEventListener('bm-splash-finished', init, { once: true });
    setTimeout(init, 20000); // Fallback
  }

  /* ═══════════════════════════════════════════════════════════════════
   * CLEANUP ON PAGE HIDE
   * ═══════════════════════════════════════════════════════════════════ */

  w.addEventListener('pagehide', function () {
    try {
      readQueue = [];
      writeQueue = [];
      isProcessingBatch = false;
      html.classList.remove('bm-heavy-render');
    } catch (e) {}
  }, { once: true });

  // ========================================
  // ORCHESTRATOR INTEGRATION
  // ========================================
  if (w.__BM_DESKTOP__) {
    w.__BM_DESKTOP__.register('fast-rendering', {
      batchRead: w.__BM_BATCH_READ__,
      batchWrite: w.__BM_BATCH_WRITE__,
      deferPaint: w.__BM_DEFER_PAINT__,
      getMetrics: function() { return w.__BM_RENDER_METRICS__ ? w.__BM_RENDER_METRICS__.getMetrics() : {}; }
    });
    
    // Forward heavy render events to orchestrator
    w.addEventListener('bm-heavy-render', function(e) {
      w.__BM_DESKTOP__.emit('heavy-render', e.detail);
    });
  }

})();
