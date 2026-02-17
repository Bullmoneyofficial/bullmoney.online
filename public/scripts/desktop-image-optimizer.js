// ==========================================
// DESKTOP IMAGE OPTIMIZER
// Aggressive image optimization for desktop
// ==========================================

(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (navigator.userAgent.match(/mobile|android|iphone/i)) return; // Desktop only

  var w = window;
  var doc = document;
  var html = doc.documentElement;

  // Configuration
  var config = {
    lazyThreshold: 0.2, // Start loading at 20% before viewport
    highQualityThreshold: 2.0, // Load high quality above 2x density
    maxConcurrentLoads: 4, // Max concurrent image loads
    lqipFadeTime: 300, // LQIP to full image fade-in
    imageOptimizationEnabled: true,
    webpSupport: null // Will be detected
  };

  var state = {
    pendingLoads: 0,
    loadedImages: new Set(),
    observer: null,
    webpSupported: false
  };

  // ========================================
  // WebP Support Detection
  // ========================================
  function detectWebPSupport() {
    return new Promise(function(resolve) {
      var canvas = doc.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      var ctx = canvas.getContext('2d');
      if (!ctx) resolve(false);
      
      var imageData = ctx.createImageData(1, 1);
      imageData.data[3] = 0; // transparent
      ctx.putImageData(imageData, 0, 0);
      
      var dataUrl = canvas.toDataURL('image/webp');
      state.webpSupported = dataUrl.indexOf('webp') === 5;
      resolve(state.webpSupported);
    });
  }

  // ========================================
  // Lazy Image Loading
  // ========================================
  function initLazyLoading() {
    var images = doc.querySelectorAll('img[data-src], img[loading="lazy"]');
    
    var observerOptions = {
      root: null,
      rootMargin: (config.lazyThreshold * 100) + '%',
      threshold: 0
    };

    state.observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        if (state.loadedImages.has(entry.target)) return;

        var img = entry.target;
        loadImage(img);
        state.loadedImages.add(img);
        config.maxConcurrentLoads > 0 && state.observer.unobserve(img);
      });
    }, observerOptions);

    images.forEach(function(img) {
      state.observer.observe(img);
    });
  }

  // ========================================
  // Load Image (with fallback chain)
  // ========================================
  function loadImage(img) {
    if (state.pendingLoads >= config.maxConcurrentLoads) {
      // Defer until a slot opens
      setTimeout(function() { loadImage(img); }, 100);
      return;
    }

    state.pendingLoads++;

    var src = img.getAttribute('data-src') || img.src;
    var alt = img.getAttribute('alt') || 'Image';
    var devicePixelRatio = Math.ceil(w.devicePixelRatio || 1);

    // Try WebP first if supported
    if (state.webpSupported && src && !src.includes('.webp')) {
      var webpSrc = src.replace(/\.[a-z]+$/i, '.webp');
      loadImageWithFallback(img, webpSrc, src, alt);
    } else {
      loadImageWithFallback(img, src, src, alt);
    }
  }

  function loadImageWithFallback(img, primarySrc, fallbackSrc, alt) {
    // Create temp image to preload
    var tempImg = new Image();
    
    tempImg.onload = function() {
      // Image loaded successfully
      img.src = primarySrc;
      img.alt = alt;
      
      // Fade in animation
      img.style.opacity = '0';
      img.offsetHeight; // Trigger reflow
      img.style.transition = 'opacity ' + config.lqipFadeTime + 'ms ease-in-out';
      img.style.opacity = '1';
      
      // Add class for loaded state
      img.classList.add('bm-image-loaded');
      
      state.pendingLoads--;
    };

    tempImg.onerror = function() {
      // WebP failed, try original
      if (primarySrc !== fallbackSrc) {
        var fb = new Image();
        fb.onload = function() {
          img.src = fallbackSrc;
          img.alt = alt;
          img.classList.add('bm-image-loaded');
          state.pendingLoads--;
        };
        fb.onerror = function() {
          console.warn('Failed to load image:', alt);
          state.pendingLoads--;
        };
        fb.src = fallbackSrc;
      } else {
        console.warn('Failed to load image:', alt);
        state.pendingLoads--;
      }
    };

    // Set decoding to async (off-main-thread)
    tempImg.decoding = 'async';
    tempImg.src = primarySrc;
  }

  // ========================================
  // Optimize Responsive Images
  // ========================================
  function optimizeResponsiveImages() {
    var images = doc.querySelectorAll('img[srcset]');
    
    images.forEach(function(img) {
      // Add loading="lazy" if not present
      if (!img.getAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Add decoding="async"
      img.decoding = 'async';

      // Add sizes attribute if missing
      if (!img.getAttribute('sizes')) {
        img.setAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1400px) 90vw, 1200px');
      }
    });
  }

  // ========================================
  // Inline Small Images as Data URLs
  // ========================================
  function optimizeSmallImages() {
    var images = doc.querySelectorAll('img[data-inline="true"], .bm-inline-image');
    
    images.forEach(function(img) {
      var src = img.src;
      if (!src || src.startsWith('data:')) return; // Already inlined or no src

      fetch(src)
        .then(function(r) { return r.blob(); })
        .then(function(blob) {
          if (blob.size > 1024) return; // Only inline if < 1KB
          
          var reader = new FileReader();
          reader.onload = function(e) {
            img.src = e.target.result;
          };
          reader.readAsDataURL(blob);
        })
        .catch(function() { /* Ignore failures */ });
    });
  }

  // ========================================
  // Preload Critical Images
  // ========================================
  function preloadCriticalImages() {
    var criticalImages = doc.querySelectorAll('img[data-critical="true"], .bm-critical-image');
    
    // Use Resource Hints if available
    if ('Beacon' in w) {
      criticalImages.forEach(function(img) {
        var src = img.src || img.getAttribute('data-src');
        if (src) {
          var link = doc.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = src;
          doc.head.appendChild(link);
        }
      });
    }
  }

  // ========================================
  // Blur Placeholder Support (LQIP)
  // ========================================
  function initBlurPlaceholders() {
    var placeholders = doc.querySelectorAll('[data-lqip]');
    
    placeholders.forEach(function(el) {
      var lqipSrc = el.getAttribute('data-lqip');
      var fullSrc = el.getAttribute('data-src') || el.src;
      
      if (!lqipSrc || !fullSrc) return;

      // Load LQIP first
      el.style.backgroundImage = 'url(' + lqipSrc + ')';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      
      // Then load full image
      var img = new Image();
      img.onload = function() {
        el.src = fullSrc;
        
        // Fade out LQIP blur
        setTimeout(function() {
          el.style.backgroundImage = 'none';
        }, config.lqipFadeTime);
      };
      img.src = fullSrc;
    });
  }

  // ========================================
  // Image Compression Detection
  // ========================================
  function useCompressedImages() {
    try {
      var conn = w.navigator.connection || w.navigator.mozConnection || w.navigator.webkitConnection;
      if (!conn) return; // No connection API

      var effectiveType = conn.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      
      if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        // Use smaller, compressed images
        doc.querySelectorAll('img').forEach(function(img) {
          var src = img.src || img.getAttribute('data-src');
          if (!src) return;
          
          // Add ?quality=low parameter (depends on backend support)
          if (!src.includes('quality=')) {
            src = src + (src.includes('?') ? '&' : '?') + 'quality=low';
            img.src = src;
            img.setAttribute('data-src', src);
          }
        });
      }
    } catch (e) {
      // Connection API not available
    }
  }

  // ========================================
  // Cleanup on Page Transitions
  // ========================================
  function setupCleanup() {
    w.addEventListener('pagehide', function() {
      if (state.observer) {
        state.observer.disconnect();
        state.observer = null;
      }
      state.loadedImages.clear();
      state.pendingLoads = 0;
    });
  }

  // ========================================
  // Export API
  // ========================================
  w.__BM_IMAGE_OPTIMIZER__ = {
    enableLazyLoading: function() {
      initLazyLoading();
    },
    preloadCriticalImages: preloadCriticalImages,
    optimizeResponsive: optimizeResponsiveImages,
    inlineSmallImages: optimizeSmallImages,
    getWebPSupport: function() {
      return state.webpSupported;
    },
    optimizeForLowBandwidth: useCompressedImages,
    getStats: function() {
      return {
        webpSupported: state.webpSupported,
        loadedCount: state.loadedImages.size,
        pendingLoads: state.pendingLoads
      };
    }
  };

  // ========================================
  // Initialize
  // ========================================
  if (!config.imageOptimizationEnabled) return;

  // Detect WebP support
  detectWebPSupport().then(function() {
    // Initialize optimizations
    initLazyLoading();
    optimizeResponsiveImages();
    preloadCriticalImages();
    initBlurPlaceholders();
    useCompressedImages();
    setupCleanup();

    // Log if performance tier is available
    if (w.__BM_PERFORMANCE_TIER__ && w.__BM_PERFORMANCE_TIER__ === 1) {
      console.log('[BM Image] Low-end device detected, using optimized images');
    }
  });

})();
