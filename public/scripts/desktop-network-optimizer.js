// ==========================================
// DESKTOP NETWORK & ASSET OPTIMIZER
// Intelligent resource loading & caching
// ==========================================

(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (navigator.userAgent.match(/mobile|android|iphone/i)) return; // Desktop only

  var w = window;
  var doc = document;

  // ========================================
  // Configuration
  // ========================================
  var config = {
    enableResourceHints: true,
    enableSmartPreload: true,
    enableCaching: true,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    enableNetworkAwareLoading: true,
    criticalResourceTimeout: 3000,
    deferNonCriticalScripts: true
  };

  var state = {
    cache: new Map(),
    cacheSize: 0,
    resourceTiming: [],
    networkSpeed: 'fast', // fast, slow, unknown
    preloadedResources: new Set()
  };

  // ========================================
  // Detect Network Speed
  // ========================================
  function detectNetworkSpeed() {
    try {
      var conn = w.navigator.connection || w.navigator.mozConnection || w.navigator.webkitConnection;
      if (!conn) return 'unknown';

      var type = conn.effectiveType;
      if (type === '4g') return 'fast';
      if (type === '3g') return 'slow';
      if (type === '2g' || type === 'slow-2g') return 'very-slow';

      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  state.networkSpeed = detectNetworkSpeed();

  // ========================================
  // Resource Hints (DNS-Prefetch, Preconnect, Prefetch)
  // ========================================
  function addResourceHints() {
    if (!config.enableResourceHints) return;

    // Common third-party domains to prefetch
    var domainsToPrefetch = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://api.bullmoney.online'
    ];

    var domainsToPreconnect = [
      'https://fonts.googleapis.com',
      'https://api.bullmoney.online'
    ];

    // Add DNS-prefetch
    domainsToPrefetch.forEach(function(domain) {
      var link = doc.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      doc.head.appendChild(link);
    });

    // Add preconnect (includes DNS, TCP, TLS)
    domainsToPreconnect.forEach(function(domain) {
      var link = doc.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'true';
      doc.head.appendChild(link);
    });
  }

  // ========================================
  // Smart Prefetch Strategy
  // ========================================
  function initSmartPrefetch() {
    if (!config.enableSmartPreload) return;

    // Prefetch next page's critical resources
    var links = doc.querySelectorAll('a[href]');
    var visited = new Set();

    links.forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href || href.startsWith('#') || visited.has(href)) return;
      visited.add(href);

      // Only prefetch internal navigation links
      if (href.startsWith('/') || href.includes(w.location.hostname)) {
        var prefetchLink = doc.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = href;
        prefetchLink.as = 'document';
        
        // Lower priority for slow networks
        if (state.networkSpeed === 'slow' || state.networkSpeed === 'very-slow') {
          return; // Skip prefetch on slow networks
        }

        doc.head.appendChild(prefetchLink);
      }
    });
  }

  // ========================================
  // Intelligent Resource Caching
  // ========================================
  function cacheResource(url, content, metadata) {
    if (!config.enableCaching) return;

    // Check cache size
    var contentSize = new Blob([content]).size;
    if (state.cacheSize + contentSize > config.maxCacheSize) {
      // Evict oldest entry
      var oldest = null;
      var oldestTime = Infinity;

      state.cache.forEach(function(value, key) {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldest = key;
        }
      });

      if (oldest) {
        var evicted = state.cache.get(oldest);
        state.cacheSize -= new Blob([evicted.content]).size;
        state.cache.delete(oldest);
      }
    }

    state.cache.set(url, {
      content: content,
      metadata: metadata || {},
      timestamp: Date.now(),
      expiry: Date.now() + config.cacheExpiry
    });

    state.cacheSize += contentSize;
  }

  function getCachedResource(url) {
    if (!config.enableCaching) return null;

    var cached = state.cache.get(url);
    if (!cached) return null;

    // Check if expired
    if (cached.expiry < Date.now()) {
      state.cacheSize -= new Blob([cached.content]).size;
      state.cache.delete(url);
      return null;
    }

    return cached.content;
  }

  // ========================================
  // Defer Non-Critical Scripts
  // ========================================
  function deferNonCriticalScripts() {
    if (!config.deferNonCriticalScripts) return;

    var scripts = doc.querySelectorAll('script[src]');
    var criticalPatterns = ['vendor', 'polyfill', 'core', 'main'];

    scripts.forEach(function(script) {
      var src = script.src || '';
      var isCritical = criticalPatterns.some(function(pattern) {
        return src.includes(pattern);
      });

      if (!isCritical && !script.hasAttribute('defer') && !script.hasAttribute('async')) {
        script.defer = true;
      }
    });
  }

  // ========================================
  // Network-Aware Loading
  // ========================================
  function initNetworkAwareLoading() {
    if (!config.enableNetworkAwareLoading) return;

    // Listen for connection changes
    try {
      var conn = w.navigator.connection || w.navigator.mozConnection || w.navigator.webkitConnection;
      if (!conn) return;

      conn.addEventListener('change', function() {
        var newSpeed = detectNetworkSpeed();
        if (newSpeed !== state.networkSpeed) {
          state.networkSpeed = newSpeed;
          w.dispatchEvent(new CustomEvent('bm-network-speed-change', {
            detail: { speed: newSpeed }
          }));

          // Adjust loading strategy
          if (newSpeed === 'slow' || newSpeed === 'very-slow') {
            // Disable non-critical prefetching
            doc.querySelectorAll('link[rel="prefetch"]').forEach(function(link) {
              link.parentNode.removeChild(link);
            });
          }
        }
      });
    } catch (e) {
      // Connection API not available
    }
  }

  // ========================================
  // Optimize Font Loading
  // ========================================
  function optimizeFontLoading() {
    // Use font-display: swap for faster text rendering
    var fontLinks = doc.querySelectorAll('link[rel="stylesheet"][href*="fonts"]');
    fontLinks.forEach(function(link) {
      if (!link.href.includes('?displaying=swap')) {
        link.href += (link.href.includes('?') ? '&' : '?') + 'display=swap';
      }
    });

    // Wait for fonts to load, then cache
    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(function() {
        console.log('[BM Assets] Custom fonts loaded');
        // Can trigger re-render or animations here
        w.dispatchEvent(new CustomEvent('bm-fonts-loaded'));
      });
    }
  }

  // ========================================
  // Preload Critical Resources
  // ========================================
  function preloadCriticalResources() {
    // Preload critical CSS
    var criticalCSS = doc.querySelectorAll('link[data-critical="true"], link[data-critical-css]');
    criticalCSS.forEach(function(link) {
      if (!link.href.startsWith('data:')) {
        link.setAttribute('rel', 'preload');
        link.setAttribute('as', 'style');
      }
    });

    // Preload critical fonts
    var criticalFonts = doc.querySelectorAll('link[data-critical-font]');
    criticalFonts.forEach(function(link) {
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'font');
      link.setAttribute('type', 'font/woff2');
      link.setAttribute('crossOrigin', 'true');
    });
  }

  // ========================================
  // Monitor Resource Timing
  // ========================================
  function initResourceMonitoring() {
    if (!(w.PerformanceObserver)) return;

    try {
      var observer = new PerformanceObserver(function(list) {
        var entries = list.getEntries();
        entries.forEach(function(entry) {
          state.resourceTiming.push({
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize || 0,
            timestamp: entry.startTime
          });

          // Warn if resource takes too long
          if (entry.duration > config.criticalResourceTimeout) {
            console.warn('[BM Assets] Slow resource:', entry.name, entry.duration + 'ms');
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });

      // Cleanup on page hide
      w.addEventListener('pagehide', function() {
        observer.disconnect();
      });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  // ========================================
  // CSS Optimization
  // ========================================
  function optimizeCSS() {
    // Remove unused CSS selectors (heuristic-based)
    var styleSheets = doc.querySelectorAll('style, link[rel="stylesheet"]');

    styleSheets.forEach(function(sheet) {
      try {
        if (sheet.sheet && sheet.sheet.cssRules) {
          var rules = sheet.sheet.cssRules;
          var unusedCount = 0;

          for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            if (!rule.selectorText) continue;

            // Check if selector is in DOM
            try {
              if (doc.querySelectorAll(rule.selectorText).length === 0) {
                unusedCount++;
              }
            } catch (e) {
              // Invalid selector, skip
            }
          }

          if (unusedCount > 0) {
            console.log('[BM Assets] Found', unusedCount, 'potentially unused CSS rules');
          }
        }
      } catch (e) {
        // CORS restriction or inline style
      }
    });
  }

  // ========================================
  // Export Public API
  // ========================================
  w.__BM_ASSET_OPTIMIZER__ = {
    getNetworkSpeed: function() {
      return state.networkSpeed;
    },
    cacheResource: cacheResource,
    getCachedResource: getCachedResource,
    getResourceStats: function() {
      return {
        networkSpeed: state.networkSpeed,
        cachedResources: state.cache.size,
        cacheSize: state.cacheSize,
        resourceTiming: state.resourceTiming.slice(-10) // Last 10
      };
    },
    preloadResources: function(urls) {
      urls.forEach(function(url) {
        if (state.preloadedResources.has(url)) return;
        
        var link = doc.createElement('link');
        link.rel = 'preload';
        link.href = url;
        
        // Determine asset type
        if (url.endsWith('.js')) {
          link.as = 'script';
        } else if (url.endsWith('.css')) {
          link.as = 'style';
        } else if (url.match(/\.(woff|woff2|ttf|otf)$/)) {
          link.as = 'font';
          link.crossOrigin = 'true';
        } else if (url.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
          link.as = 'image';
        }
        
        doc.head.appendChild(link);
        state.preloadedResources.add(url);
      });
    },
    optimizeForNetwork: initNetworkAwareLoading
  };

  // ========================================
  // Initialize
  // ========================================
  addResourceHints();
  initSmartPrefetch();
  deferNonCriticalScripts();
  optimizeFontLoading();
  preloadCriticalResources();
  initResourceMonitoring();
  initNetworkAwareLoading();
  optimizeCSS();

  console.log('[BM Assets] Network optimizer initialized, detected speed:', state.networkSpeed);
  // ═════════════════════════════════════════════════════════════
  // ORCHESTRATOR INTEGRATION
  // ═════════════════════════════════════════════════════════════
  if (w.__BM_DESKTOP__) {
    w.__BM_DESKTOP__.register('network-optimizer', w.__BM_ASSET_OPTIMIZER__);
    
    // Emit network speed changes to orchestrator
    w.addEventListener('bm-network-speed-change', function(e) {
      w.__BM_DESKTOP__.emit('network-speed-changed', { speed: e.detail.speed });
    });
  }
})();
