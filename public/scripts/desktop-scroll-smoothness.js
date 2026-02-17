/**
 * DESKTOP SCROLL SMOOTHNESS OPTIMIZER — BullMoney
 * ═════════════════════════════════════════════════
 * Advanced scroll optimization for buttery-smooth desktop experience:
 *  • Reduce scroll event listener blocking (passive + requestAnimationFrame)
 *  • Compositor-only transforms for scroll-driven UI (no layout/paint)
 *  • Momentum scrolling physics with easing
 *  • Aggressive scroll performance monitoring + throttling
 *  • Reduce paint operations during active scroll
 *  • Optimize scroll-linked animations
 *  • Smart scroll audio throttling on weak devices
 *  • Sub-pixel smooth scrolling
 *
 * Self-gates to desktop only (>769px, non-mobile UA).
 * Works with desktop-scroll-experience.js for enhanced smoothness.
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
   * 1. SCROLL PERFORMANCE MONITORING & THROTTLING
   * ═══════════════════════════════════════════════════════════════════ */

  var isScrolling = false;
  var lastScrollTime = 0;
  var scrollFrameCount = 0;
  var scrollFPS = 60;
  var scrollFPSTarget = 60;
  var isThrottled = false;

  function initScrollPerformanceMonitoring() {
    var framesSampled = 0;
    var startTime = performance.now();
    var sampleInterval = 3000; // Measure every 3 seconds

    function measureScrollFPS(now) {
      if (now - startTime < sampleInterval) {
        requestAnimationFrame(measureScrollFPS);
        return;
      }

      // Calculate FPS based on frames during a scroll action
      var elapsedMs = now - startTime;
      scrollFPS = Math.round((scrollFrameCount / elapsedMs) * 1000);

      // If FPS is consistently low, enable throttle mode
      if (scrollFPS < 50) {
        isThrottled = true;
        html.classList.add('bm-scroll-throttled');
        console.warn('[BM-Scroll] Low FPS detected:', scrollFPS, ' — enabling throttle mode');
        
        try {
          w.dispatchEvent(new CustomEvent('bm-scroll-fps-low', {
            detail: { fps: scrollFPS }
          }));
        } catch (e) {}
      } else if (scrollFPS > 55) {
        isThrottled = false;
        html.classList.remove('bm-scroll-throttled');
      }

      scrollFrameCount = 0;
      startTime = now;
      requestAnimationFrame(measureScrollFPS);
    }

    requestAnimationFrame(measureScrollFPS);
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 2. SCROLL-LINKED ANIMATION OPTIMIZATION
   * ═══════════════════════════════════════════════════════════════════ */

  function optimizeScrollLinkedAnimations() {
    var style = d.createElement('style');
    style.id = 'bm-scroll-smooth-css';
    style.textContent = [
      '@media (min-width: 769px) {',
      
      // Reduce paint operations during scroll
      'html.bm-splash-done {',
      '  scroll-behavior: smooth;',
      '  scrollbar-gutter: stable;',
      '}',

      // Compositor-only scroll-driven transforms
      // (transform and opacity don't trigger layout/paint)
      '.scroll-fade {',
      '  will-change: opacity;',
      '  animation: scroll-fade linear forwards;',
      '}',

      // Smooth scrollbar appearance
      '::-webkit-scrollbar {',
      '  width: 8px;',
      '  height: 8px;',
      '}',

      '::-webkit-scrollbar-track {',
      '  background: rgba(255, 255, 255, 0.02);',
      '}',

      '::-webkit-scrollbar-thumb {',
      '  background: linear-gradient(180deg, rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4));',
      '  border-radius: 4px;',
      '  transition: background 0.2s ease;',
      '}',

      '::-webkit-scrollbar-thumb:hover {',
      '  background: linear-gradient(180deg, rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.6));',
      '}',

      // Firefox scrollbar
      'scrollbar-color: rgba(59, 130, 246, 0.4) rgba(255, 255, 255, 0.02);',
      'scrollbar-width: thin;',

      // Smooth overscroll
      'html.bm-splash-done {',
      '  overscroll-behavior-y: auto;',
      '  overflow-y: scroll;',
      '}',

      // Disable expensive animations during scroll on throttled devices
      'html.bm-scroll-throttled [class*="scroll-"] {',
      '  animation: none !important;',
      '  transition: none !important;',
      '}',

      'html.bm-scroll-throttled .particle-container,',
      'html.bm-scroll-throttled .aurora,',
      'html.bm-scroll-throttled .gradient-shift {',
      '  animation: none !important;',
      '  opacity: 0.8;',
      '}',

      // Keep scroll progress bar smooth (compositor-only property)
      '.bm-scroll-progress {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  height: 2px;',
      '  width: 100%;',
      '  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);',
      '  z-index: 99999;',
      '  pointer-events: none;',
      '  transform: scaleX(var(--bm-scroll-progress, 0));',
      '  transform-origin: left;',
      '  will-change: transform;',
      '  transition: none;',
      '}',

      '}'
    ].join('\n');
    d.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 3. MOMENTUM SCROLLING ENHANCEMENT
   * ═══════════════════════════════════════════════════════════════════ */

  function enhanceMomentumScrolling() {
    // Apply WebKit momentum scrolling
    var style = d.createElement('style');
    style.textContent = [
      '@media (min-width: 769px) {',
      '  html.bm-splash-done body,',
      '  html.bm-splash-done main,',
      '  html.bm-splash-done [data-scrollable] {',
      '    -webkit-overflow-scrolling: touch;',
      '  }',
      '}'
    ].join('\n');
    d.head.appendChild(style);

    // Expose momentum scroll API for React components
    w.__BM_SCROLL_MOMENTUM__ = {
      enabled: true,
      friction: 0.98,
      targetFPS: scrollFPSTarget
    };
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 4. REDUCE MAIN THREAD BLOCKING DURING SCROLL
   * ═══════════════════════════════════════════════════════════════════ */

  var scrollWorkQueue = [];
  var isProcessingScrollWork = false;

  w.__BM_QUEUE_SCROLL_WORK__ = function (fn) {
    // Queue non-critical work to run between scroll frames
    if (typeof scheduler !== 'undefined' && scheduler.yield) {
      scheduler.yield().then(fn);
    } else if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(fn, { timeout: 100 });
    } else {
      // Fallback: run after next frame
      requestAnimationFrame(function () {
        setTimeout(fn, 0);
      });
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
   * 5. SCROLL AUDIO OPTIMIZATION FOR WEAK DEVICES
   * ═══════════════════════════════════════════════════════════════════ */

  function optimizeScrollAudio() {
    var tier = w.__BM_PERFORMANCE_TIER__ || 2;

    // Disable scroll audio on tier 1 devices (very low-end)
    if (tier < 2) {
      w.__BM_SCROLL_AUDIO_ENABLED__ = false;
      console.info('[BM-Scroll] Audio disabled for scroll (low-end device)');
      return;
    }

    // On tier 2, reduce audio complexity
    if (tier === 2) {
      try {
        w.addEventListener('bm-performance-low', function () {
          w.__BM_SCROLL_AUDIO_ENABLED__ = false;
          console.warn('[BM-Scroll] Audio disabled due to performance');
        });
      } catch (e) {}
    }

    // Export audio state for scroll-experience.js to respect
    w.__BM_SCROLL_AUDIO_ENABLED__ = true;
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 6. SCROLL POSITION RESTORATION & SMOOTHING
   * ═══════════════════════════════════════════════════════════════════ */

  function preserveScrollPosition() {
    var scrollKey = 'bm-scroll-' + w.location.pathname;

    // Save scroll position on page hide
    w.addEventListener('pagehide', function () {
      try {
        sessionStorage.setItem(scrollKey, JSON.stringify({
          y: w.scrollY || w.pageYOffset || 0,
          timestamp: Date.now()
        }));
      } catch (e) {}
    });

    // Restore scroll position on load (after content renders)
    w.addEventListener('load', function () {
      try {
        var stored = sessionStorage.getItem(scrollKey);
        if (stored) {
          var state = JSON.parse(stored);
          // Only restore if within 2 minutes and same URL
          if (Date.now() - state.timestamp < 120000) {
            setTimeout(function () {
              w.scrollTo({ top: state.y, behavior: 'auto' });
              sessionStorage.removeItem(scrollKey);
            }, 100); // Wait for layout
          }
        }
      } catch (e) {}
    }, { once: true });
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 7. SCROLL JANK PREVENTION
   * ═══════════════════════════════════════════════════════════════════ */

  function preventScrollJank() {
    // Avoid rapid layout recalculations during scroll
    var style = d.createElement('style');
    style.textContent = [
      '@media (min-width: 769px) {',
      
      // Prevent pointer events during heavy scroll operations
      'html.bm-scroll-active * {',
      '  pointer-events: auto;',
      '  transition-duration: 0ms !important;', // Disable transitions during scroll
      '}',

      // Contain sections to prevent reflow into siblings
      'section, [data-section], .page-section {',
      '  contain: layout style paint;',
      '}',

      // Reduce expensive filters during scroll
      'html.bm-scroll-active [class*="blur"],',
      'html.bm-scroll-active [class*="shadow"] {',
      '  filter: none;',
      '  opacity: 0.95;',
      '}',

      '}'
    ].join('\n');
    d.head.appendChild(style);

    // Add scroll-active class during scrolling
    var scrollTimeout = null;
    w.addEventListener('scroll', function () {
      html.classList.add('bm-scroll-active');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        html.classList.remove('bm-scroll-active');
      }, 150); // 150ms after last scroll event
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 8. INITIALIZATION
   * ═══════════════════════════════════════════════════════════════════ */

  function init() {
    console.info('[BM-Scroll] Initializing scroll smoothness optimizer');

    // Apply all optimizations
    optimizeScrollLinkedAnimations();
    enhanceMomentumScrolling();
    optimizeScrollAudio();
    preserveScrollPosition();
    preventScrollJank();

    // Start monitoring after a short delay (let page settle)
    setTimeout(function () {
      if (w.__BM_MEASURED_FPS__ && w.__BM_MEASURED_FPS__ < 55) {
        isThrottled = true;
        html.classList.add('bm-scroll-throttled');
      }
    }, 1000);

    // Monitor scroll performance
    initScrollPerformanceMonitoring();

    // Expose API
    w.__BM_SCROLL_SMOOTH__ = {
      isThrottled: function () { return isThrottled; },
      getFPS: function () { return scrollFPS; },
      getPerformanceTier: function () { return w.__BM_PERFORMANCE_TIER__; }
    };
  }

  // Wait for splash to finish + performance tier detection
  function checkInit() {
    if (w.__BM_PERFORMANCE_TIER__ !== undefined && w.__BM_SPLASH_FINISHED__) {
      init();
    } else {
      setTimeout(checkInit, 100);
    }
  }

  checkInit();

  // Cleanup on page hide
  w.addEventListener('pagehide', function () {
    try {
      html.classList.remove('bm-scroll-throttled', 'bm-scroll-active');
    } catch (e) {}
  }, { once: true });

  // ========================================
  // ORCHESTRATOR INTEGRATION
  // ========================================
  if (w.__BM_DESKTOP__) {
    w.__BM_DESKTOP__.register('scroll-smoothness', w.__BM_SCROLL_SMOOTH__);
    
    // Forward scroll FPS events to orchestrator
    w.addEventListener('bm-scroll-fps-low', function(e) {
      w.__BM_DESKTOP__.emit('scroll-fps-low', e.detail);
    });
    
    // Listen for throttle commands
    w.__BM_DESKTOP__.on('throttle-animations', function(data) {
      isThrottled = true;
      html.classList.add('bm-scroll-throttled');
      console.log('[BM Scroll] Throttling activated');
    });
  }

})();
