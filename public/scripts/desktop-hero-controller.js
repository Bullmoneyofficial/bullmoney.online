// ═════════════════════════════════════════════════════════════════
// DESKTOP HERO CONTROLLER — Manages 3D/Spline Rendering Performance
// Prevents lag, memory issues, and ensures smooth scrolling
// Registers with desktop-orchestrator and emits hero-specific events
// ═════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (navigator.userAgent.match(/mobile|android|iphone/i)) return; // Desktop only

  var w = window;
  var doc = document;

  // Wait for orchestrator to be ready
  var DESKTOP = w.__BM_DESKTOP__;
  if (!DESKTOP) {
    console.warn('[HERO_CTRL] Desktop orchestrator not ready, deferring...');
    w.addEventListener('bm-desktop:ready', initHeroController);
    return;
  }

  function initHeroController() {
    // ═══════════════════════════════════════════════════════════════════
    // HERO CONTROLLER STATE
    // ═══════════════════════════════════════════════════════════════════
    var state = {
      splineEnabled: true,           // Is Spline rendering active?
      splineQuality: 'high',          // 'high' | 'medium' | 'low'
      isScrolling: false,             // Currently scrolling?
      lastScrollTime: 0,
      scrollTimeout: null,
      memoryPressured: false,
      lowFPS: false,
      tier: w.__BM_PERFORMANCE_TIER__ || 1
    };

    var metrics = {
      heroVisible: false,
      splineLoadTime: 0,
      lastRenderTime: Date.now(),
      renderCount: 0
    };

    // ═══════════════════════════════════════════════════════════════════
    // FEATURE: LAZY LOAD SPLINE ON HERO VISIBILITY
    // Only load 3D assets when hero becomes visible in viewport
    // ═══════════════════════════════════════════════════════════════════
    function setupIntersectionObserver() {
      if (typeof IntersectionObserver === 'undefined') return;

      var heroEl = doc.querySelector('.hero-wrapper');
      if (!heroEl) {
        console.log('[HERO_CTRL] Hero element not found yet, will retry');
        setTimeout(setupIntersectionObserver, 500);
        return;
      }

      var observer = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            var wasVisible = metrics.heroVisible;
            metrics.heroVisible = entry.isIntersecting;

            if (entry.isIntersecting && !wasVisible) {
              console.log('[HERO_CTRL] ✓ Hero visible, enabling Spline');
              enableSpline();
            } else if (!entry.isIntersecting && wasVisible) {
              console.log('[HERO_CTRL] ✗ Hero hidden, suspending Spline');
              suspendSpline('hero-offscreen');
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(heroEl);
      console.log('[HERO_CTRL] Intersection observer set up');
    }

    // ═══════════════════════════════════════════════════════════════════
    // FEATURE: PAUSE SPLINE DURING SCROLLING
    // Freeze 3D rendering while user scrolls for smoother 60fps
    // ═══════════════════════════════════════════════════════════════════
    function setupScrollListener() {
      w.addEventListener('scroll', function() {
        if (!metrics.heroVisible) return; // Only if hero is visible

        state.isScrolling = true;
        state.lastScrollTime = Date.now();

        // Suspend during active scroll
        suspendSpline('scrolling');

        // Debounce scroll end (100ms is sweet spot for smooth resume)
        clearTimeout(state.scrollTimeout);
        state.scrollTimeout = setTimeout(function() {
          if (state.splineEnabled && metrics.heroVisible) {
            console.log('[HERO_CTRL] ✓ Scroll ended, resuming Spline');
            resumeSpline();
          }
          state.isScrolling = false;
        }, 100);
      }, { passive: true });

      console.log('[HERO_CTRL] Scroll listener set up');
    }

    // ═══════════════════════════════════════════════════════════════════
    // FEATURE: RESPOND TO MEMORY PRESSURE
    // Reduce 3D quality or suspend rendering when memory is tight
    // ═══════════════════════════════════════════════════════════════════
    function setupMemoryWatcher() {
      DESKTOP.on('memory-warning', function(data) {
        console.warn('[HERO_CTRL] Memory pressure:', data.percentUsed + '%');
        state.memoryPressured = true;

        if (data.percentUsed > 85) {
          // Critical memory: suspend Spline entirely
          suspendSpline('memory-critical');
        } else if (data.percentUsed > 75) {
          // High memory: reduce quality
          reduceSplineQuality();
        }
      });

      DESKTOP.on('memory-recovered', function(data) {
        console.log('[HERO_CTRL] Memory recovered:', data.percentUsed + '%');
        state.memoryPressured = false;

        if (metrics.heroVisible && state.splineEnabled) {
          restoreSplineQuality();
        }
      });

      console.log('[HERO_CTRL] Memory watcher set up');
    }

    // ═══════════════════════════════════════════════════════════════════
    // FEATURE: RESPOND TO LOW SCROLL FPS
    // If scroll performance degrades, disable heavy 3D rendering
    // ═══════════════════════════════════════════════════════════════════
    function setupFPSWatcher() {
      DESKTOP.on('scroll-fps-low', function(data) {
        if (data.fps < 50) {
          console.warn('[HERO_CTRL] Scroll FPS low:', data.fps, '- suspending Spline');
          state.lowFPS = true;
          suspendSpline('low-scroll-fps');
        }
      });

      DESKTOP.on('scroll-fps-recovered', function(data) {
        if (data.fps >= 55 && !state.lowFPS) return;

        console.log('[HERO_CTRL] Scroll FPS recovered:', data.fps);
        state.lowFPS = false;

        if (metrics.heroVisible && state.splineEnabled) {
          resumeSpline();
        }
      });

      console.log('[HERO_CTRL] FPS watcher set up');
    }

    // ═══════════════════════════════════════════════════════════════════
    // FEATURE: TIER-AWARE RENDERING
    // Lower tiers don't load 3D at all; higher tiers get full quality
    // ═══════════════════════════════════════════════════════════════════
    function setupTierWatcher() {
      DESKTOP.on('tier-changed', function(data) {
        console.log('[HERO_CTRL] Performance tier changed to:', data.tier);
        state.tier = data.tier;

        // Tier 1 (low): No 3D
        if (data.tier <= 1) {
          suspendSpline('tier-limited');
        }
        // Tier 2 (medium): 3D on demand, reduced quality
        else if (data.tier === 2) {
          if (state.splineQuality !== 'medium') {
            reduceSplineQuality();
          }
        }
        // Tier 3+ (high): Full 3D with all effects
        else {
          restoreSplineQuality();
          if (metrics.heroVisible && !state.splineEnabled) {
            enableSpline();
          }
        }
      });

      // Set initial tier based on window.__BM_PERFORMANCE_TIER__
      state.tier = w.__BM_PERFORMANCE_TIER__ || 1;
      
      // Apple Silicon gets enhanced defaults
      if (w.__BM_UNIFIED_MEMORY__ && state.tier >= 3) {
        console.log('[HERO_CTRL] Apple Silicon detected - enabling enhanced 3D');
        state.splineQuality = 'ultra';
      }
      
      if (state.tier <= 1) {
        suspendSpline('tier-limited');
      }

      console.log('[HERO_CTRL] Tier watcher set up, initial tier:', state.tier);
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTROL: Enable Spline Rendering
    // ═══════════════════════════════════════════════════════════════════
    function enableSpline() {
      if (state.splineEnabled) return;
      if (state.tier <= 1) return; // Don't enable on low tiers

      state.splineEnabled = true;
      console.log('[HERO_CTRL] → Enabling Spline (quality: ' + state.splineQuality + ')');

      DESKTOP.emit('hero-3d:enable', { quality: state.splineQuality });

      // Also dispatch React-friendly event
      try {
        w.dispatchEvent(new CustomEvent('bm-hero:spline-enable', {
          detail: { quality: state.splineQuality }
        }));
      } catch (e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTROL: Suspend Spline Rendering
    // Reason: 'scrolling', 'low-fps', 'memory-critical', 'hero-offscreen', 'tier-limited'
    // ═══════════════════════════════════════════════════════════════════
    function suspendSpline(reason) {
      if (!state.splineEnabled) return;

      state.splineEnabled = false;
      console.log('[HERO_CTRL] ↻ Suspending Spline (' + reason + ')');

      DESKTOP.emit('hero-3d:suspend', { reason: reason });

      // Also dispatch React-friendly event
      try {
        w.dispatchEvent(new CustomEvent('bm-hero:spline-suspend', {
          detail: { reason: reason }
        }));
      } catch (e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTROL: Resume Spline Rendering (if suspended)
    // ═══════════════════════════════════════════════════════════════════
    function resumeSpline() {
      if (state.splineEnabled) return;
      if (state.tier <= 1) return; // Don't resume on low tiers

      state.splineEnabled = true;
      console.log('[HERO_CTRL] ↻ Resuming Spline');

      DESKTOP.emit('hero-3d:resume', {});

      // Also dispatch React-friendly event
      try {
        w.dispatchEvent(new CustomEvent('bm-hero:spline-resume', {}));
      } catch (e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTROL: Reduce Spline Quality
    // Used when memory is high or FPS is low
    // ═══════════════════════════════════════════════════════════════════
    function reduceSplineQuality() {
      if (state.splineQuality === 'low') return;

      state.splineQuality = 'low';
      console.log('[HERO_CTRL] ↓ Reducing Spline quality to LOW');

      DESKTOP.emit('hero-3d:quality-changed', { quality: 'low' });

      try {
        w.dispatchEvent(new CustomEvent('bm-hero:spline-quality-low', {}));
      } catch (e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // CONTROL: Restore Spline Quality
    // Called when memory/FPS recovers
    // ═══════════════════════════════════════════════════════════════════
    function restoreSplineQuality() {
      if (state.splineQuality === 'high') return;

      state.splineQuality = 'high';
      console.log('[HERO_CTRL] ↑ Restoring Spline quality to HIGH');

      DESKTOP.emit('hero-3d:quality-changed', { quality: 'high' });

      try {
        w.dispatchEvent(new CustomEvent('bm-hero:spline-quality-high', {}));
      } catch (e) {}
    }

    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC API — exposed via DESKTOP.modules.hero-controller
    // ═══════════════════════════════════════════════════════════════════
    var api = {
      getState: function() { return state; },
      getMetrics: function() { return metrics; },
      isSplineEnabled: function() { return state.splineEnabled; },
      getQuality: function() { return state.splineQuality; },
      setQuality: function(q) {
        if (q === 'low') reduceSplineQuality();
        else if (q === 'high') restoreSplineQuality();
      },
      forceEnable: function() { enableSpline(); },
      forceSuspend: function(reason) { suspendSpline(reason || 'manual'); },
      debug: function() {
        console.group('[HERO_CTRL] State & Metrics');
        console.log('State:', state);
        console.log('Metrics:', metrics);
        console.groupEnd();
      },
      printStatus: function() {
        console.log(
          '[HERO_CTRL]',
          state.splineEnabled ? '✓ ENABLED' : '✗ SUSPENDED',
          '(Quality: ' + state.splineQuality + ', Tier: ' + state.tier + ')'
        );
      }
    };

    // ═══════════════════════════════════════════════════════════════════
    // INIT — Set up all listeners and register module
    // ═══════════════════════════════════════════════════════════════════
    function initModule() {
      console.log('[HERO_CTRL] Initializing...');

      // Check performance tier first
      setupTierWatcher();

      // Only set up interactive features if tier > 1
      if (state.tier > 1) {
        setupIntersectionObserver();
        setupScrollListener();
        setupMemoryWatcher();
        setupFPSWatcher();
      } else {
        console.log('[HERO_CTRL] Tier 1 detected, skipping 3D features');
      }

      // Register with orchestrator
      DESKTOP.register('hero-controller', api, 100);
      console.log('[HERO_CTRL] ✓ Registered with orchestrator');

      // Debug shortcut: window.__HERO_CTRL for console access
      w.__HERO_CTRL__ = api;
    }

    initModule();
  }

  // If orchestrator is already ready, init immediately
  if (DESKTOP && DESKTOP.ready) {
    initHeroController();
  }
})();
