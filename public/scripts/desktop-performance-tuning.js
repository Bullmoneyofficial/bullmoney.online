/**
 * DESKTOP PERFORMANCE TUNING — BullMoney  
 * ═════════════════════════════════════════
 * Adaptive performance management:
 *  • Detects device CPU/RAM constraints
 *  • Disables CPU-heavy features on weak devices (audio, particles, etc.)
 *  • Adjusts animation frame budgets based on device capabilities
 *  • Monitors frame rate in real-time and throttles effects
 *  • Memory monitoring with automatic cache cleanup
 *  • Idle task scheduling to keep main thread responsive
 *
 * Self-gates to desktop only (>769px, non-mobile UA).
 */
(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  var w = window;
  var d = document;
  var nav = navigator || {};
  var ua = String(nav.userAgent || '').toLowerCase();

  // Desktop gate
  var width = w.innerWidth || d.documentElement.clientWidth || 0;
  if (width <= 769) return;
  if (/mobi|android|iphone|ipad|ipod/i.test(ua) && !/macintosh/i.test(ua)) return;

  /* ═══════════════════════════════════════════════════════════════════
   * 1. DEVICE CAPABILITY DETECTION
   * ═══════════════════════════════════════════════════════════════════ */
  var perf = {
    cores: nav.hardwareConcurrency || 4,
    memory: nav.deviceMemory || 4,
    dpr: Math.min(w.devicePixelRatio || 1, 3),
    screenW: w.innerWidth || 0,
    screenH: w.innerHeight || 0
  };

  // Calculate performance tier (1-4, with 4 being strongest)
  var performanceTier = 2; // default to mid-range
  if (perf.cores >= 8 && perf.memory >= 8) {
    performanceTier = 4; // High-end
  } else if (perf.cores >= 4 && perf.memory >= 4) {
    performanceTier = 3; // Mid-high
  } else if (perf.cores >= 2 && perf.memory >= 2) {
    performanceTier = 2; // Mid range
  } else {
    performanceTier = 1; // Low-end
  }

  console.info('[BM-Tuning] Detected tier', performanceTier, '(', perf.cores, 'cores,', perf.memory, 'GB RAM)');

  /* ═══════════════════════════════════════════════════════════════════
   * 2. ADAPTIVE FEATURE GATES
   * ═══════════════════════════════════════════════════════════════════ */
  
  // Disable CPU-intensive audio on weak devices
  if (performanceTier < 3) {
    w.__BM_SFX_ENABLED__ = false;
    console.info('[BM-Tuning] Audio disabled (insufficient CPU cores)');
  }

  // Reduce animation complexity on low-end devices
  if (performanceTier < 2) {
    // Inject CSS to reduce animations
    var style = d.createElement('style');
    style.id = 'bm-low-perf-css';
    style.textContent = [
      '@media (min-width: 769px) {',
      '  * { animation-duration: 0.05s !important; transition-duration: 0.05s !important; }',
      '  [class*="blur"], [class*="shadow"], [class*="gradient"] { filter: none !important; }',
      '}'
    ].join('\n');
    d.head.appendChild(style);
    console.info('[BM-Tuning] Low-perf mode enabled');
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 3. FRAME RATE MONITORING & THROTTLING
   * ═══════════════════════════════════════════════════════════════════ */
  
  var frameDropThreshold = performanceTier === 1 ? 30 : 40; // FPS (lower = more lenient)
  var measuredFPS = 60;
  var droppedFrameCount = 0;

  function measureFrameRate() {
    var samples = [];
    var count = 0;
    var lastTime = performance.now();

    function sampleFrame(now) {
      var delta = now - lastTime;
      lastTime = now;
      
      if (delta > 0 && delta < 100) {
        samples.push(Math.round(1000 / delta));
      }
      count++;

      if (count < 30) {
        requestAnimationFrame(sampleFrame);
      } else {
        // Calculate 25th percentile (worst-case FPS)
        samples.sort(function (a, b) { return a - b; });
        measuredFPS = samples[Math.floor(samples.length / 4)] || 60;
        
        if (measuredFPS < frameDropThreshold) {
          console.warn('[BM-Tuning] Detected frame drops:', Math.round(measuredFPS), 'FPS');
          // Dispatch event for React to throttle effects
          try {
            w.dispatchEvent(new CustomEvent('bm-performance-low', {
              detail: { fps: measuredFPS, tier: performanceTier }
            }));
          } catch (e) {}
        }

        w.__BM_MEASURED_FPS__ = measuredFPS;
        startFrameMonitoring();
      }
    }
    requestAnimationFrame(sampleFrame);
  }

  // Monitor frames periodically and auto-throttle if needed
  var monitoringRAF = null;
  var frameCount = 0;
  var frameDropCounter = 0;

  function startFrameMonitoring() {
    var lastCheck = performance.now();

    function checkFrames(now) {
      frameCount++;
      var elapsed = now - lastCheck;

      // Sample every 3 seconds
      if (elapsed >= 3000) {
        var currentFPS = Math.round((frameCount / elapsed) * 1000);
        if (currentFPS < frameDropThreshold) {
          frameDropCounter++;
          if (frameDropCounter >= 2) {
            // Two consecutive bad measurements
            console.warn('[BM-Tuning] Persistent frame drops detected, entering throttle mode');
            disableExpensiveFeatures();
            frameDropCounter = 0;
          }
        } else {
          frameDropCounter = 0;
        }
        frameCount = 0;
        lastCheck = now;
      }

      monitoringRAF = requestAnimationFrame(checkFrames);
    }
    monitoringRAF = requestAnimationFrame(checkFrames);

    // Cleanup on page hide
    d.addEventListener('pagehide', function () {
      if (monitoringRAF) cancelAnimationFrame(monitoringRAF);
    }, { once: true });
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 4. EXPENSIVE FEATURE DISABLING
   * ═══════════════════════════════════════════════════════════════════ */

  function disableExpensiveFeatures() {
    // Disable audio
    w.__BM_SFX_ENABLED__ = false;

    // Add CSS class for low-perf mode
    d.documentElement.classList.add('bm-low-perf');

    // Inject low-perf CSS if not already added
    if (!d.getElementById('bm-low-perf-css')) {
      var style = d.createElement('style');
      style.id = 'bm-low-perf-css';
      style.textContent = [
        '@media (min-width: 769px) {',
        '  .bm-low-perf * { animation-duration: 0.05s !important; transition-duration: 0.05s !important; }',
        '  .bm-low-perf [class*="blur"] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }',
        '  .bm-low-perf .particle-container, .bm-low-perf .aurora { display: none !important; }',
        '}'
      ].join('\n');
      d.head.appendChild(style);
    }

    // Dispatch event for React components
    try {
      w.dispatchEvent(new CustomEvent('bm-disable-effects'));
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 5. MEMORY OPTIMIZATION — Aggressive cache cleanup
   * ═══════════════════════════════════════════════════════════════════ */

  function setupMemoryManagement() {
    // Clear caches more aggressively on low-end devices
    var cleanupInterval = performanceTier < 2 ? 20000 : 45000;

    var memTimer = setInterval(function () {
      if (d.visibilityState === 'hidden') return;

      try {
        // Trim response cache
        if (w.__BM_RESPONSE_CACHE__) {
          var cache = w.__BM_RESPONSE_CACHE__;
          var keys = Object.keys(cache);
          var maxEntries = performanceTier < 2 ? 10 : 30;
          
          if (keys.length > maxEntries) {
            keys.sort(function (a, b) {
              return (cache[a].time || 0) - (cache[b].time || 0);
            });
            for (var i = 0; i < keys.length - maxEntries; i++) {
              delete cache[keys[i]];
            }
          }
        }

        // Clear old service worker caches
        if ('caches' in w) {
          caches.keys().then(function (names) {
            names.forEach(function (name) {
              if (name.indexOf('v1') < 0 && name.indexOf('v2') < 0) {
                caches.delete(name);
              }
            });
          }).catch(function () {});
        }
      } catch (e) {}
    }, cleanupInterval);

    // Cleanup on page hide
    d.addEventListener('pagehide', function () {
      clearInterval(memTimer);
    }, { once: true });
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 6. IDLE CALLBACK POLYFILL & QUEUE
   * ═══════════════════════════════════════════════════════════════════ */

  // Queue of low-priority tasks to run during idle time
  var idleQueue = [];
  var isProcessing = false;

  w.__BM_QUEUE_IDLE_TASK__ = function (fn, opts) {
    if (typeof fn !== 'function') return;
    var timeout = (opts && opts.timeout) || 0;
    var task = { fn: fn, deadline: Date.now() + timeout };
    idleQueue.push(task);

    if (!isProcessing) {
      processIdleQueue();
    }
  };

  function processIdleQueue() {
    if (isProcessing || idleQueue.length === 0) return;
    isProcessing = true;

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(function (deadline) {
        while (idleQueue.length > 0) {
          var task = idleQueue.shift();
          if (Date.now() < task.deadline) {
            try {
              task.fn();
            } catch (e) {
              console.error('[BM-Tuning] Idle task error:', e);
            }
          }
        }
        isProcessing = false;
      }, { timeout: 10000 });
    } else {
      // Fallback: run tasks with setTimeout after a short delay
      setTimeout(function () {
        while (idleQueue.length > 0) {
          var task = idleQueue.shift();
          try {
            task.fn();
          } catch (e) {
            console.error('[BM-Tuning] Idle task error:', e);
          }
        }
        isProcessing = false;
      }, 1);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 7. ACTIVATION
   * ═══════════════════════════════════════════════════════════════════ */

  // Wait for splash to finish
  function init() {
    console.info('[BM-Tuning] Initializing with tier', performanceTier);
    
    // Start measurements
    if (d.readyState === 'complete' || d.readyState === 'interactive') {
      measureFrameRate();
    } else {
      d.addEventListener('DOMContentLoaded', measureFrameRate, { once: true });
    }

    // Setup memory management
    setupMemoryManagement();

    // Expose API
    w.__BM_PERFORMANCE_TIER__ = performanceTier;
    w.__BM_PERF__ = perf;
  }

  if (w.__BM_SPLASH_FINISHED__) {
    init();
  } else {
    w.addEventListener('bm-splash-finished', init, { once: true });
    setTimeout(init, 20000); // Fallback
  }

  // ========================================
  // ORCHESTRATOR INTEGRATION
  // ========================================
  w.addEventListener('bm-splash-finished', function() {
    // Register module with orchestrator
    if (w.__BM_DESKTOP__) {
      w.__BM_DESKTOP__.register('performance-tuning', {
        tier: performanceTier,
        perf: perf,
        frameRate: frameRate,
        getTier: function() { return performanceTier; },
        getFrameRate: function() { return frameRate; },
        queueIdleTask: queueIdleTask
      });
    }
  }, { once: true });

})();
