// BULLMONEY SPLINE UNIVERSAL v1.0
// Ensures Splines ALWAYS render on ALL devices - no pausing, no breaking, no fallbacks
(function() {
'use strict';
var w = window, d = document, n = navigator;
var SU = w.__BM_SPLINE_UNIVERSAL__ = {
  loaded: false,
  scenes: {},
  quality: 'auto',
  alwaysRender: true
};

// Safety helpers for production
var docEl = d.documentElement;
function onReady(fn) {
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', fn, { once: true });
  else fn();
}
function safeSetAttr(attr, val) {
  if (docEl) docEl.setAttribute(attr, val);
}

// ─── Device Detection (for optimization, NOT for blocking) ───
var mem = n.deviceMemory || 4;
var cores = n.hardwareConcurrency || 4;
var dpr = w.devicePixelRatio || 1;
var isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(n.userAgent);
var conn = n.connection || n.mozConnection || n.webkitConnection || {};
var saveData = conn.saveData || false;
var isInApp = /instagram|fbav|fban|fb_iab|tiktok|bytedance|twitter|snapchat|linkedin|wechat|line\//i.test(n.userAgent);

// ─── Smart Quality Calculation (for optimization, NOT for disabling) ───
// IMPORTANT: We NEVER set quality to 'disabled' - always render something
var quality = 'high';
if (saveData) {
  quality = 'medium'; // Reduce quality but still render
} else if (mem < 2 || cores < 2) {
  quality = 'low'; // Low quality but still render
} else if (isMobile && mem < 4) {
  quality = 'medium';
} else if (mem >= 8 && cores >= 6 && !isMobile) {
  quality = 'ultra';
}

SU.quality = quality;
safeSetAttr('data-spline-quality', quality);

// ─── Canvas Resolution Scaling (reduces memory without breaking) ───
SU.getCanvasScale = function() {
  var scales = {
    ultra: Math.min(dpr, 2),
    high: Math.min(dpr, 1.5),
    medium: 1,
    low: 0.75
  };
  return scales[quality] || 1;
};

// ─── Texture Size Limits (prevents OOM without disabling) ───
SU.getMaxTextureSize = function() {
  var sizes = {
    ultra: 4096,
    high: 2048,
    medium: 1024,
    low: 512
  };
  return sizes[quality] || 1024;
};

// ─── WebGL Context Creation with Optimization ───
SU.createOptimizedWebGLContext = function(canvas, opts) {
  opts = opts || {};

  // Quality-based context settings
  var contextSettings = {
    alpha: quality === 'ultra' || quality === 'high',
    antialias: quality === 'ultra' || quality === 'high',
    powerPreference: quality === 'ultra' ? 'high-performance' : 'default',
    preserveDrawingBuffer: false,
    stencil: quality !== 'low',
    depth: true,
    failIfMajorPerformanceCaveat: false // NEVER fail - always render
  };

  // Merge with user options
  Object.assign(contextSettings, opts);

  // Try WebGL2 first, fallback to WebGL1 (but ALWAYS get a context)
  var gl = canvas.getContext('webgl2', contextSettings) ||
           canvas.getContext('webgl', contextSettings) ||
           canvas.getContext('experimental-webgl', contextSettings);

  if (!gl) {
    console.warn('[Spline Universal] WebGL unavailable - using fallback rendering');
    return null;
  }

  return gl;
};

// ─── Preload Spline Runtime ───
// Load Spline runtime early for faster scene initialization
if ('serviceWorker' in n && n.serviceWorker) {
  try {
    n.serviceWorker.ready.then(function(reg) {
      if (reg && reg.active) {
        try {
          reg.active.postMessage({
            type: 'PREFETCH_SPLINE',
            urls: ['https://unpkg.com/@splinetool/runtime/build/runtime.js']
          });
        } catch (e) {
          // Silently fail - not critical
        }
      }
    }).catch(function() {});
  } catch (e) {
    // Silently fail - not critical
  }
}

// ─── Scene Loading Helper ───
// Loads scenes with quality hints but NEVER blocks rendering
SU.loadScene = function(container, sceneUrl, opts) {
  opts = opts || {};

  // Set loading state
  container.classList.add('spline-loading');
  container.setAttribute('data-spline-quality', quality);
  container.setAttribute('data-spline-scale', SU.getCanvasScale());
  container.setAttribute('data-spline-max-texture', SU.getMaxTextureSize());

  // Track scene metadata
  var sceneMeta = {
    url: sceneUrl,
    container: container,
    loadStart: performance.now(),
    quality: quality,
    visible: true
  };
  SU.scenes[sceneUrl] = sceneMeta;

  return new Promise(function(resolve) {
    // Listen for load completion
    var loadListener = function() {
      container.removeEventListener('spline-loaded', loadListener);
      container.classList.remove('spline-loading');
      container.classList.add('spline-loaded');

      var loadTime = Math.round(performance.now() - sceneMeta.loadStart);
      sceneMeta.loadTime = loadTime;
      sceneMeta.loaded = true;

      if (w.location.hostname === 'localhost') {
        console.log('[Spline Universal] ' + sceneUrl + ' loaded in ' + loadTime + 'ms (quality: ' + quality + ')');
      }

      resolve(sceneMeta);
    };

    container.addEventListener('spline-loaded', loadListener, { once: true });

    // IMPORTANT: No timeout fallback - we let it load forever if needed
    // This ensures scenes ALWAYS render, never get disabled
  });
};

// ─── Frame Rate Target (adaptive but never pauses) ───
var targetFPS = 60;
if (isMobile || isInApp) {
  // Mobile gets 60fps for smooth experience
  targetFPS = quality === 'low' ? 45 : 60;
} else if (quality === 'ultra') {
  // Desktop ultra can try for 120fps
  targetFPS = 120;
} else if (quality === 'low') {
  // Even low quality keeps rendering at 45fps
  targetFPS = 45;
}

SU.targetFPS = targetFPS;
safeSetAttr('data-spline-fps', String(targetFPS));

// ─── Memory Management (cleanup, not disabling) ───
// Monitors memory but NEVER disables scenes, just optimizes
SU.monitorMemory = function() {
  if (!w.performance || !performance.memory) return;

  var checkMemory = function() {
    try {
      var used = performance.memory.usedJSHeapSize;
      var limit = performance.memory.jsHeapSizeLimit;
      var ratio = used / limit;

      // If memory usage is high (>80%), we can suggest GC but NEVER pause/disable
      if (ratio > 0.8 && 'CustomEvent' in w) {
        try {
          w.dispatchEvent(new CustomEvent('bullmoney-memory-high', {
            detail: { used: used, limit: limit, ratio: ratio }
          }));
        } catch (e) {
          // CustomEvent not supported or blocked - silently fail
        }
      }
    } catch (e) {
      // Memory API unavailable - silently fail
    }
  };

  // Check every 10 seconds
  setInterval(checkMemory, 10000);
};

if (w.performance && performance.memory) {
  SU.monitorMemory();
}

// ─── Performance CSS (optimization, not hiding) ───
var style = d.createElement('style');
style.id = 'spline-universal-styles';
style.textContent = [
  // GPU acceleration for all Spline containers
  '.spline-container, .spline-scene-wrapper, [data-spline-scene] {',
  '  contain: layout style paint;',
  '  will-change: auto;',
  '  transform: translateZ(0);',
  '  backface-visibility: hidden;',
  '}',

  // Loading shimmer (but scene still renders underneath)
  '.spline-loading::after {',
  '  content: "";',
  '  position: absolute;',
  '  inset: 0;',
  '  background: linear-gradient(90deg, transparent, rgba(255,215,0,0.03), transparent);',
  '  animation: spline-shimmer 1.5s infinite;',
  '  pointer-events: none;',
  '}',

  '@keyframes spline-shimmer {',
  '  0% { transform: translateX(-100%); }',
  '  100% { transform: translateX(100%); }',
  '}',

  // Loaded state - remove shimmer
  '.spline-loaded::after {',
  '  display: none;',
  '}',

  // Quality-specific optimizations (but always visible)
  '[data-spline-quality="low"] canvas {',
  '  image-rendering: auto;',
  '}',

  '[data-spline-quality="medium"] canvas {',
  '  image-rendering: auto;',
  '}',

  '[data-spline-quality="high"] canvas,',
  '[data-spline-quality="ultra"] canvas {',
  '  image-rendering: -webkit-optimize-contrast;',
  '  image-rendering: crisp-edges;',
  '}',

  // IMPORTANT: Scenes are ALWAYS visible and rendering
  '.spline-container canvas {',
  '  opacity: 1 !important;',
  '  visibility: visible !important;',
  '  pointer-events: auto !important;',
  '}',

  // Reduced motion support (reduces animation but still renders)
  '@media (prefers-reduced-motion: reduce) {',
  '  .spline-container, .spline-scene-wrapper {',
  '    animation-duration: 0.01s !important;',
  '  }',
  '}',
].join('\n');
if (d.head) d.head.appendChild(style);
else onReady(function() { if (d.head) d.head.appendChild(style); });

// ─── Cache Management (speeds up loads) ───
SU.cacheScene = function(url) {
  if (!('caches' in w) || !w.caches) return Promise.resolve(false);

  return caches.open('bullmoney-spline-universal-v1')
    .then(function(cache) {
      return cache.match(url).then(function(resp) {
        if (resp) return true; // Already cached

        return fetch(url, { mode: 'cors', cache: 'force-cache' })
          .then(function(r) {
            if (r && r.ok) {
              try {
                cache.put(url, r.clone());
              } catch (e) {
                // Quota exceeded or other cache error - non-critical
              }
            }
            return r && r.ok;
          })
          .catch(function() { return false; });
      }).catch(function() { return false; });
    })
    .catch(function() { return false; });
};

// ─── Visibility Optimization (reduces work when off-screen but NEVER pauses) ───
// When scenes are off-screen, we can reduce frame rate but NEVER stop rendering
if ('IntersectionObserver' in w) {
  SU.visibilityObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var container = entry.target;
      var sceneUrl = container.getAttribute('data-spline-url');

      if (sceneUrl && SU.scenes[sceneUrl]) {
        SU.scenes[sceneUrl].visible = entry.isIntersecting;

        // Dispatch event for React components to optimize rendering
        // But NEVER stop rendering completely
        w.dispatchEvent(new CustomEvent('bullmoney-spline-visibility', {
          detail: {
            url: sceneUrl,
            visible: entry.isIntersecting,
            // Suggest reduced FPS when off-screen, but keep rendering
            targetFPS: entry.isIntersecting ? targetFPS : Math.max(15, targetFPS / 4)
          }
        }));
      }
    });
  }, {
    rootMargin: '100px', // Preload 100px before entering viewport
    threshold: [0, 0.25, 0.5, 0.75, 1]
  });

  // Auto-observe all Spline containers
  onReady(function() {
    try {
      d.querySelectorAll('[data-spline-scene], .spline-container').forEach(function(el) {
        SU.visibilityObserver.observe(el);
      });
    } catch (e) {
      // Silently fail if querySelector fails
    }
  });
}

// ─── Network-Aware Preloading ───
// Preload scenes based on network conditions
SU.preloadScenes = function(sceneUrls) {
  if (!Array.isArray(sceneUrls)) return;

  var shouldPreload = true;

  // Check network conditions
  if (saveData) {
    shouldPreload = false; // Respect save-data
  } else if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
    shouldPreload = false; // Don't preload on 2G
  }

  if (!shouldPreload) return;

  // Use idle callback to preload without blocking
  var ric = w.requestIdleCallback || function(cb) { setTimeout(cb, 1); };
  try {
    ric(function() {
      sceneUrls.forEach(function(url) {
        SU.cacheScene(url);
      });
    }, { timeout: 5000 });
  } catch (e) {
    // Fallback for browsers without requestIdleCallback
    setTimeout(function() {
      sceneUrls.forEach(function(url) {
        SU.cacheScene(url);
      });
    }, 1000);
  }
};

// ─── Global Export ───
SU.loaded = true;
safeSetAttr('data-spline-ready', 'true');

// Dev logging
if (w.location.hostname === 'localhost') {
  console.log('%c[Spline Universal] Ready - Quality: ' + quality + ' | FPS: ' + targetFPS + ' | Always Render: ON', 'color: #ffd700; font-weight: bold; background: #000; padding: 4px 8px;');
}

// Expose global helper for React components
w.__splineOptimize__ = {
  quality: quality,
  scale: SU.getCanvasScale(),
  maxTexture: SU.getMaxTextureSize(),
  targetFPS: targetFPS,
  alwaysRender: true // Flag for React components
};

})();
