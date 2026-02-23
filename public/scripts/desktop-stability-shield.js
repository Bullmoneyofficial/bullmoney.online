/**
 * DESKTOP STABILITY SHIELD — BullMoney
 * ═════════════════════════════════════
 * Hardened desktop runtime for the strongest, most stable build:
 *  • Global error boundary — catches uncaught errors, prevents white screens
 *  • Memory pressure monitoring — warns and takes action above thresholds
 *  • Performance watchdog — detects long tasks, logs slow frames
 *  • Network resilience — offline detection, auto-retry on reconnect
 *  • Crash recovery — saves scroll position, restores on reload
 *  • Resource monitoring — detects failed script/style loads, retries
 *  • Graceful degradation — disables heavy features under pressure
 *
 * Self-gates to desktop only (>769px, non-mobile UA).
 * Waits for splash to finish before heavy monitoring kicks in.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;
  var w = window.innerWidth || document.documentElement.clientWidth || 0;
  if (w <= 769) return;
  var ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua) && !/Macintosh/i.test(ua)) return;

  var LOG_PREFIX = "[BM-Shield]";
  var active = false;

  /* ═══════════════════════════════════════════════════════════════════
   * 1. GLOBAL ERROR BOUNDARY — prevent white-screen crashes
   * ═══════════════════════════════════════════════════════════════════ */
  var errorCount = 0;
  var ERROR_THRESHOLD = 10; // per 60s
  var errorResetTimer = null;

  window.addEventListener("error", function (e) {
    errorCount++;
    console.warn(LOG_PREFIX, "Uncaught error:", e.message, "at", e.filename, ":", e.lineno);

    // Reset counter every 60s
    if (!errorResetTimer) {
      errorResetTimer = setTimeout(function () {
        errorCount = 0;
        errorResetTimer = null;
      }, 60000);
    }

    // If too many errors in a short period, try soft recovery
    if (errorCount >= ERROR_THRESHOLD) {
      console.error(LOG_PREFIX, "Error threshold reached. Attempting recovery.");
      saveState();
      // Don't auto-reload — let the app try to self-heal
      // Just disable non-essential features
      enterDegradedMode();
    }
  });

  window.addEventListener("unhandledrejection", function (e) {
    errorCount++;
    console.warn(LOG_PREFIX, "Unhandled promise rejection:", e.reason);
  });

  /* ═══════════════════════════════════════════════════════════════════
   * 2. CRASH RECOVERY — save & restore scroll position + app state
   * ═══════════════════════════════════════════════════════════════════ */
  var STATE_KEY = "bm-shield-state";

  function saveState() {
    try {
      var state = {
        scrollY: window.scrollY || window.pageYOffset || 0,
        url: location.pathname + location.search,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function restoreState() {
    try {
      var raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return;
      var state = JSON.parse(raw);
      // Only restore if same URL and within 60s
      if (state.url === location.pathname + location.search && Date.now() - state.timestamp < 60000) {
        // Restore scroll position after a brief delay to let content render
        setTimeout(function () {
          window.scrollTo({ top: state.scrollY, behavior: "instant" });
        }, 500);
        console.info(LOG_PREFIX, "Restored scroll position to", state.scrollY);
      }
      sessionStorage.removeItem(STATE_KEY);
    } catch (e) {}
  }

  // Save state periodically and before unload
  var saveInterval = null;
  function startStateSaving() {
    window.addEventListener("beforeunload", saveState);
    window.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") saveState();
    });
    // Save every 10s
    saveInterval = setInterval(saveState, 10000);
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 3. MEMORY PRESSURE MONITORING
   * ═══════════════════════════════════════════════════════════════════ */
  var degradedMode = false;
  var memoryIntervalId = null;

  function checkMemory() {
    if (!performance.memory) return; // Chrome only
    var used = performance.memory.usedJSHeapSize;
    var limit = performance.memory.jsHeapSizeLimit;
    var pct = used / limit;

    if (pct > 0.85) {
      console.warn(LOG_PREFIX, "Memory pressure HIGH:", Math.round(pct * 100) + "% of heap used");
      enterDegradedMode();
    } else if (pct > 0.7) {
      console.info(LOG_PREFIX, "Memory usage elevated:", Math.round(pct * 100) + "%");
      // Hint GC by releasing caches
      cleanupCaches();
    }
  }

  function cleanupCaches() {
    try {
      // Clear any BM fetch cache that's grown large
      if (window.__BM_RESPONSE_CACHE__) {
        var cache = window.__BM_RESPONSE_CACHE__;
        var keys = Object.keys(cache);
        if (keys.length > 50) {
          // Remove oldest half
          keys.sort(function (a, b) {
            return (cache[a]._ts || 0) - (cache[b]._ts || 0);
          });
          for (var i = 0; i < Math.floor(keys.length / 2); i++) {
            delete cache[keys[i]];
          }
          console.info(LOG_PREFIX, "Trimmed response cache from", keys.length, "to", Object.keys(cache).length);
        }
      }

      // Clear in-memory Spline preload buffers (they can be multiple MB)
      if (window.__SPLINE_MEMORY_CACHE__) {
        window.__SPLINE_MEMORY_CACHE__ = {};
      }
    } catch (e) {}
  }

  function enterDegradedMode() {
    if (degradedMode) return;
    degradedMode = true;
    console.warn(LOG_PREFIX, "Entering degraded mode — disabling non-essential features");

    // Dispatch event so React providers can react
    try {
      window.dispatchEvent(new CustomEvent("bm-degraded-mode", { detail: { reason: "stability" } }));
    } catch (e) {}

    // Disable scroll audio to save CPU
    window.__BM_SFX_ENABLED__ = false;

    // Reduce animation frames
    document.documentElement.classList.add("bm-degraded");

    // Inject degraded CSS
    var style = document.createElement("style");
    style.id = "bm-degraded-css";
    style.textContent = [
      // Clamp non-3D UI motion without disabling Spline/WebGL canvases.
      ".bm-degraded body *:not(canvas):not(spline-viewer):not(.spline-container):not([data-spline-scene]) { animation-duration: 80ms !important; animation-iteration-count: 1 !important; transition-duration: 80ms !important; }",
      ".bm-degraded .bm-scroll-progress { display: none; }",
    ].join("\n");
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 4. PERFORMANCE WATCHDOG — detect long tasks, frozen frames
   * ═══════════════════════════════════════════════════════════════════ */
  function startPerformanceWatchdog() {
    // Long Task API
    if (typeof PerformanceObserver !== "undefined") {
      try {
        var longTaskObs = new PerformanceObserver(function (list) {
          var entries = list.getEntries();
          for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            if (entry.duration > 100) {
              console.warn(LOG_PREFIX, "Long task detected:", Math.round(entry.duration) + "ms", entry.name);
            }
          }
        });
        longTaskObs.observe({ type: "longtask", buffered: false });
      } catch (e) {}
    }

    // Frame drop detector — lenient for fast desktop hardware
    var lastFrameTime = performance.now();
    var droppedFrames = 0;
    var frameCheckRAF = null;

    function checkFrame() {
      var now = performance.now();
      var delta = now - lastFrameTime;
      // If more than 80ms between frames (<12.5fps), count as dropped
      // 50ms was too aggressive — normal GC pauses and layout recalcs
      // exceed 50ms on complex pages without actual perf issues
      if (delta > 80) {
        droppedFrames++;
        if (droppedFrames > 60 && !degradedMode) {
          console.warn(LOG_PREFIX, "Excessive frame drops detected. Enabling degraded mode.");
          enterDegradedMode();
        }
      } else if (droppedFrames > 0) {
        droppedFrames = Math.max(0, droppedFrames - 1); // recover faster
      }
      lastFrameTime = now;
      frameCheckRAF = requestAnimationFrame(checkFrame);
    }
    frameCheckRAF = requestAnimationFrame(checkFrame);

    // Clean up on hide
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        if (frameCheckRAF) cancelAnimationFrame(frameCheckRAF);
      } else {
        lastFrameTime = performance.now();
        droppedFrames = 0;
        frameCheckRAF = requestAnimationFrame(checkFrame);
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 5. NETWORK RESILIENCE — offline detection, auto-retry
   * ═══════════════════════════════════════════════════════════════════ */
  function setupNetworkResilience() {
    var wasOffline = false;

    window.addEventListener("offline", function () {
      wasOffline = true;
      console.info(LOG_PREFIX, "Network offline detected");
      document.documentElement.classList.add("bm-offline");
    });

    window.addEventListener("online", function () {
      console.info(LOG_PREFIX, "Network restored");
      document.documentElement.classList.remove("bm-offline");

      if (wasOffline) {
        wasOffline = false;
        // Clear stale caches
        cleanupCaches();
        // Dispatch event for React to refresh data
        try {
          window.dispatchEvent(new CustomEvent("bm-network-restored"));
        } catch (e) {}
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 6. RESOURCE MONITORING — detect and retry failed loads
   * ═══════════════════════════════════════════════════════════════════ */
  function setupResourceMonitoring() {
    var retryCount = {};
    var MAX_RETRIES = 2;

    window.addEventListener("error", function (e) {
      var target = e.target;
      if (!target) return;
      var tagName = (target.tagName || "").toLowerCase();

      // Only handle resource load failures (script, link, img)
      if (tagName === "script" || tagName === "link" || tagName === "img") {
        var src = target.src || target.href || "";
        if (!src) return;

        var key = src;
        retryCount[key] = (retryCount[key] || 0) + 1;

        if (retryCount[key] <= MAX_RETRIES) {
          console.warn(LOG_PREFIX, "Resource failed, retrying (" + retryCount[key] + "/" + MAX_RETRIES + "):", src);

          // Retry after brief delay
          setTimeout(function () {
            if (tagName === "script") {
              var s = document.createElement("script");
              s.src = src + (src.indexOf("?") > -1 ? "&" : "?") + "_retry=" + retryCount[key];
              s.async = true;
              document.head.appendChild(s);
            } else if (tagName === "link") {
              var l = document.createElement("link");
              l.rel = target.rel || "stylesheet";
              l.href = src + (src.indexOf("?") > -1 ? "&" : "?") + "_retry=" + retryCount[key];
              document.head.appendChild(l);
            } else if (tagName === "img") {
              target.src = src + (src.indexOf("?") > -1 ? "&" : "?") + "_retry=" + retryCount[key];
            }
          }, 1000 * retryCount[key]); // exponential backoff
        }
      }
    }, true); // capture phase for resource errors
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 7. VIEWPORT STABILITY — prevent layout shift on resize
   * ═══════════════════════════════════════════════════════════════════ */
  function setupViewportStability() {
    // Set CSS custom property for viewport height (fix 100vh issue)
    function setVH() {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", vh + "px");
    }
    setVH();

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      // Debounced resize to prevent thrashing
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setVH, 100);
    });

    // Prevent content reflow when virtual keyboard or dev-tools open
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () {
        setVH();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * ACTIVATION
   * ═══════════════════════════════════════════════════════════════════ */
  function activate() {
    if (active) return;
    active = true;

    // Restore crash state first
    restoreState();

    // Start all subsystems
    startStateSaving();
    startPerformanceWatchdog();
    setupNetworkResilience();
    setupResourceMonitoring();
    setupViewportStability();

    // Memory check every 30s (Chrome only)
    if (performance.memory) {
      memoryIntervalId = setInterval(checkMemory, 30000);
    }

    // Inject offline/degraded indicator CSS
    var style = document.createElement("style");
    style.id = "bm-shield-css";
    style.textContent = [
      "html.bm-offline::after { content: 'OFFLINE'; position: fixed; top: 8px; right: 8px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; z-index: 999999; pointer-events: none; animation: bm-pulse 2s ease-in-out infinite; }",
      "@keyframes bm-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }",
    ].join("\n");
    document.head.appendChild(style);

    console.info(LOG_PREFIX, "Desktop stability shield active");
  }

  // Wait for splash to finish
  if (window.__BM_SPLASH_FINISHED__) {
    activate();
  } else {
    window.addEventListener("bm-splash-finished", activate, { once: true });
    setTimeout(function () {
      if (!active) activate();
    }, 20000);
  }

  /* ── Expose for debugging ───────────────────────────────────────── */
  window.__BM_SHIELD__ = {
    isDegraded: function () { return degradedMode; },
    forceDegrade: enterDegradedMode,
    errorCount: function () { return errorCount; },
  };

})();
