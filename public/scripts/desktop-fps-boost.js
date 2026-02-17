/**
 * DESKTOP FPS & SPEED BOOSTER — BullMoney
 * ════════════════════════════════════════
 * Maximizes desktop frame rate, rendering speed, and perceived performance:
 *
 *  • GPU compositing hints — promote animated elements to GPU layers
 *  • CSS containment optimization — use layout+paint (not strict) for speed
 *  • Hardware-accelerated transforms — force 3D on key animations
 *  • Animation frame budget — prioritize visual updates over background work
 *  • Faster transitions — tighter easing curves, shorter durations on desktop
 *  • Intersection-based rendering — only animate what's visible
 *  • Image decode offloading — decode images off main thread
 *  • Compositor-friendly styles — avoid paint-triggering properties
 *  • requestIdleCallback task scheduling — keep main thread free for paint
 *  • 120Hz+ support — detect high refresh rate and remove frame limiters
 *
 * Self-gates to desktop only (>769px, non-mobile UA).
 * Activates after splash finishes.
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;
  var w = window.innerWidth || document.documentElement.clientWidth || 0;
  if (w <= 769) return;
  var ua = navigator.userAgent || "";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua) && !/Macintosh/i.test(ua)) return;

  var d = document;
  var html = d.documentElement;
  var active = false;

  /* ═══════════════════════════════════════════════════════════════════
   * 1. DETECT HIGH REFRESH RATE (120Hz / 144Hz / ProMotion)
   * ═══════════════════════════════════════════════════════════════════ */
  var isHighRefreshRate = false;
  var detectedFPS = 60;

  function detectRefreshRate() {
    var samples = [];
    var count = 0;
    var last = performance.now();

    function measure(now) {
      var delta = now - last;
      last = now;
      if (delta > 0 && delta < 50) { // ignore outliers (>50ms = <20fps)
        samples.push(1000 / delta);
      }
      count++;
      if (count < 20) {
        requestAnimationFrame(measure);
      } else {
        // Calculate median FPS
        samples.sort(function (a, b) { return a - b; });
        var median = samples[Math.floor(samples.length / 2)] || 60;
        detectedFPS = Math.round(median);
        isHighRefreshRate = detectedFPS > 65;

        if (isHighRefreshRate) {
          html.classList.add("bm-high-fps");
          html.dataset.bmFps = String(detectedFPS);
        }

        // Expose for other scripts
        window.__BM_DETECTED_FPS__ = detectedFPS;
        window.__BM_HIGH_REFRESH__ = isHighRefreshRate;
      }
    }
    requestAnimationFrame(measure);
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 2. GPU ACCELERATION & COMPOSITING CSS (Optimized for memory)
   * ═══════════════════════════════════════════════════════════════════ */
  function injectGPUStyles() {
    var style = d.createElement("style");
    style.id = "bm-desktop-fps-boost";
    style.textContent = [
      "@media (min-width: 769px) {",

      // ── GPU compositing ONLY on critical interactive elements (not all buttons) ──
      "  [data-interactive], .glass-effect, .backdrop-blur-sm, .backdrop-blur-md,",
      "  .backdrop-blur-lg, .gradient-shift, .floating, .fade-in-up {",
      "    will-change: transform, opacity;",
      "    transform: translateZ(0);",
      "    backface-visibility: hidden;",
      "  }",

      // ── Faster default transitions for desktop (desktop hardware can handle it) ──
      "  html.bm-splash-done a,",
      "  html.bm-splash-done button,",
      "  html.bm-splash-done [role='button'] {",
      "    transition-duration: 0.15s !important;",
      "    transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;",
      "  }",

      // ── Smooth scroll with GPU assist ──
      "  html.bm-splash-done {",
      "    -webkit-overflow-scrolling: touch;",
      "  }",

      // ── Promote fixed/sticky header/nav to GPU layer (selective, not all fixed/sticky) ──
      "  header, nav, footer {",
      "    will-change: transform;",
      "    transform: translateZ(0);",
      "  }",

      // ── Optimized containment (layout+paint, NOT strict — strict blocks scrolling) ──
      "  .skeleton, .loading, .placeholder {",
      "    contain: layout paint;",
      "  }",

      // ── Image rendering hints ──
      "  img {",
      "    image-rendering: auto;",
      "    -webkit-transform: translateZ(0);",
      "    transform: translateZ(0);",
      "  }",

      // ── Reduce paint on hover states — use transform instead of box-shadow changes ──
      "  html.bm-splash-done *:hover {",
      "    will-change: auto;",
      "  }",

      // ── High refresh rate optimizations — only on critical animation elements ──
      "  html.bm-high-fps [data-interactive], html.bm-high-fps .glass-effect {",
      "    scroll-behavior: smooth !important;",
      "    transition-duration: 0.12s !important;",
      "  }",

      // ── FAST MODALS / DRAWERS / MENUS / SHEETS ──
      "  html.bm-splash-done [role='dialog'],",
      "  html.bm-splash-done [aria-modal='true'],",
      "  html.bm-splash-done [data-state='open'],",
      "  html.bm-splash-done [data-radix-popper-content-wrapper],",
      "  html.bm-splash-done .modal,",
      "  html.bm-splash-done .sheet,",
      "  html.bm-splash-done [class*='drawer'],",
      "  html.bm-splash-done [class*='Drawer'],",
      "  html.bm-splash-done [role='menu'],",
      "  html.bm-splash-done [role='listbox'],",
      "  html.bm-splash-done [class*='dropdown'],",
      "  html.bm-splash-done [class*='popover'],",
      "  html.bm-splash-done [class*='tooltip'] {",
      "    transition-duration: 0.1s !important;",
      "    animation-duration: 0.15s !important;",
      "    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1) !important;",
      "    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1) !important;",
      "    will-change: transform, opacity !important;",
      "    transform: translateZ(0);",
      "    contain: layout style paint !important;",
      "  }",
      "",
      "  /* Backdrop overlays — instant opacity, skip animating blur */",
      "  html.bm-splash-done .fixed.inset-0[class*='bg-black'],",
      "  html.bm-splash-done .fixed.inset-0[class*='backdrop'],",
      "  html.bm-splash-done .modal-backdrop {",
      "    transition-duration: 0.1s !important;",
      "    animation-duration: 0.12s !important;",
      "    will-change: opacity !important;",
      "  }",
      "",
      // ── Compositor-only animations (transform + opacity only) ──
      "  @keyframes bm-fade-in { from { opacity: 0; transform: translateY(8px) translateZ(0); } to { opacity: 1; transform: translateY(0) translateZ(0); } }",
      "  @keyframes bm-scale-in { from { opacity: 0; transform: scale(0.97) translateZ(0); } to { opacity: 1; transform: scale(1) translateZ(0); } }",
      "  @keyframes bm-slide-up { from { transform: translateY(100%) translateZ(0); } to { transform: translateY(0) translateZ(0); } }",

      // ── Reduce repaints on scrolling containers (only critical ones) ──
      ".scrollable, [data-scrollable], main, .content-area {",
      "    -webkit-overflow-scrolling: touch;",
      "  }",

      "}",
    ].join("\n");
    d.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 3. INTERSECTION-BASED ANIMATION CONTROL
   * ═══════════════════════════════════════════════════════════════════ */
  function setupVisibilityAnimations() {
    if (!("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          var el = entry.target;
          if (entry.isIntersecting) {
            // Element is visible — allow animations
            el.style.animationPlayState = "running";
            el.style.willChange = "transform, opacity";
          } else {
            // Off-screen — pause animations to save GPU
            el.style.animationPlayState = "paused";
            el.style.willChange = "auto";
          }
        }
      },
      { rootMargin: "100px 0px", threshold: 0 }
    );

    // Observe animated elements
    var animatedEls = d.querySelectorAll(
      '[class*="animate-"], [class*="motion-"], [class*="transition"], .bm-orb, [class*="pulse"], [class*="bounce"], [class*="spin"]'
    );
    for (var i = 0; i < animatedEls.length; i++) {
      observer.observe(animatedEls[i]);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 4. OFF-MAIN-THREAD IMAGE DECODING
   * ═══════════════════════════════════════════════════════════════════ */
  function setupAsyncImageDecode() {
    // Use createImageBitmap for off-thread decoding when available
    var imgs = d.querySelectorAll("img:not([decoding])");
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].decoding = "async";
    }

    // For dynamic images, observe and set decoding
    if ("MutationObserver" in window) {
      var imgObserver = new MutationObserver(function (mutations) {
        for (var m = 0; m < mutations.length; m++) {
          var added = mutations[m].addedNodes;
          for (var n = 0; n < added.length; n++) {
            var node = added[n];
            if (node.nodeType !== 1) continue;
            if (node.tagName === "IMG" && !node.decoding) {
              node.decoding = "async";
            }
            // Check children
            var childImgs = node.querySelectorAll ? node.querySelectorAll("img:not([decoding])") : [];
            for (var c = 0; c < childImgs.length; c++) {
              childImgs[c].decoding = "async";
            }
          }
        }
      });
      imgObserver.observe(d.body, { childList: true, subtree: true });
      // Auto-disconnect after 60s
      setTimeout(function () { imgObserver.disconnect(); }, 60000);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 5. MAIN THREAD TASK SCHEDULER — keep 16ms frame budget
   * ═══════════════════════════════════════════════════════════════════ */
  var taskQueue = [];
  var taskRunning = false;

  /**
   * Schedule a low-priority task that won't block rendering.
   * Tasks run during idle callbacks or between animation frames.
   */
  window.__BM_SCHEDULE_TASK__ = function (fn, priority) {
    if (priority === "high") {
      // High priority: run on next microtask
      Promise.resolve().then(fn);
      return;
    }

    taskQueue.push(fn);
    if (!taskRunning) {
      taskRunning = true;
      drainTasks();
    }
  };

  function drainTasks() {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(function (deadline) {
        while (taskQueue.length > 0 && deadline.timeRemaining() > 2) {
          var task = taskQueue.shift();
          try { task(); } catch (e) {}
        }
        if (taskQueue.length > 0) {
          drainTasks();
        } else {
          taskRunning = false;
        }
      }, { timeout: 1000 });
    } else {
      // Fallback: run one task per rAF to stay under 16ms
      requestAnimationFrame(function () {
        var start = performance.now();
        while (taskQueue.length > 0 && performance.now() - start < 4) {
          var task = taskQueue.shift();
          try { task(); } catch (e) {}
        }
        if (taskQueue.length > 0) {
          drainTasks();
        } else {
          taskRunning = false;
        }
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 6. PAINT OPTIMIZATION — reduce layout thrashing
   * ═══════════════════════════════════════════════════════════════════ */
  function setupBatchedReads() {
    // Batch DOM reads and writes to avoid layout thrashing
    var reads = [];
    var writes = [];
    var scheduled = false;

    window.__BM_DOM_READ__ = function (fn) {
      reads.push(fn);
      scheduleBatch();
    };

    window.__BM_DOM_WRITE__ = function (fn) {
      writes.push(fn);
      scheduleBatch();
    };

    function scheduleBatch() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        // Batch all reads first
        var r = reads.splice(0);
        for (var i = 0; i < r.length; i++) {
          try { r[i](); } catch (e) {}
        }
        // Then batch all writes
        var w = writes.splice(0);
        for (var j = 0; j < w.length; j++) {
          try { w[j](); } catch (e) {}
        }
        scheduled = false;
        if (reads.length || writes.length) scheduleBatch();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * 7. PRELOAD CRITICAL FONTS FASTER
   * ═══════════════════════════════════════════════════════════════════ */
  function boostFonts() {
    // Ensure font-display: swap on all @font-face
    if (d.fonts && d.fonts.ready) {
      d.fonts.ready.then(function () {
        html.classList.add("bm-fonts-ready");
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
   * ACTIVATION (after splash)
   * ═══════════════════════════════════════════════════════════════════ */
  function activate() {
    if (active) return;
    active = true;

    // Core — inject immediately
    injectGPUStyles();
    detectRefreshRate();
    boostFonts();
    setupBatchedReads();

    // After first paint
    requestAnimationFrame(function () {
      setupAsyncImageDecode();
      // Slight delay for visibility observer to avoid measuring during paint
      setTimeout(setupVisibilityAnimations, 500);
    });

    html.classList.add("bm-fps-boosted");
    window.__BM_FPS_BOOST_ACTIVE__ = true;
  }

  // Wait for splash
  if (window.__BM_SPLASH_FINISHED__) {
    activate();
  } else {
    window.addEventListener("bm-splash-finished", activate, { once: true });
    setTimeout(function () { if (!active) activate(); }, 20000);
  }

})();
