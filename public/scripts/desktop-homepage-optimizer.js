// ═════════════════════════════════════════════════════════════════
// DESKTOP HOMEPAGE OPTIMIZER — Fast home page loading for desktop
// Optimizes hero, preloads critical assets, defers heavy components
// Works with orchestrator for coordinated performance management
// ═════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (navigator.userAgent.match(/mobile|android|iphone/i)) return; // Desktop only

  var w = window;
  var doc = document;

  // Wait for orchestrator
  var DESKTOP = w.__BM_DESKTOP__;
  if (!DESKTOP) {
    w.addEventListener('bm-desktop:ready', init);
    return;
  }

  function init() {
    console.log('[HOME_OPT] Initializing homepage optimizations...');

    var isHomePage = w.location.pathname === '/' || w.location.pathname === '';
    if (!isHomePage) {
      console.log('[HOME_OPT] Not on homepage, skipping');
      return;
    }

    var metrics = {
      heroLoadTime: 0,
      splineLoadTime: 0,
      firstInteraction: 0,
      sectionsLoaded: 0,
      imagesPreloaded: 0
    };

    var state = {
      heroReady: false,
      splineReady: false,
      belowFoldVisible: false,
      tier: w.__BM_PERFORMANCE_TIER__ || 1
    };

    // ═══════════════════════════════════════════════════════════════════
    // 1. HERO OPTIMIZATION — Fastest possible hero rendering
    // ═══════════════════════════════════════════════════════════════════
    
    function optimizeHero() {
      var heroStart = performance.now();
      
      // Find hero element
      var hero = doc.querySelector('.hero-wrapper');
      if (!hero) {
        setTimeout(optimizeHero, 100);
        return;
      }

      console.log('[HOME_OPT] Hero element found, optimizing...');

      // Prioritize hero images for LCP
      var heroImages = hero.querySelectorAll('img');
      heroImages.forEach(function(img) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
      });

      // Reduce animations on tier 1-2 for faster perceived performance
      if (state.tier <= 2) {
        hero.style.setProperty('--hero-animation-duration', '0.3s');
      }

      // Defer non-critical hero elements (buttons, secondary content)
      var cta = hero.querySelector('.cta-group');
      if (cta && state.tier <= 2) {
        // Show CTA after hero is visible (reduces work during initial render)
        cta.style.opacity = '0';
        setTimeout(function() {
          cta.style.transition = 'opacity 0.3s ease';
          cta.style.opacity = '1';
        }, 200);
      }

      state.heroReady = true;
      metrics.heroLoadTime = performance.now() - heroStart;
      
      console.log('[HOME_OPT] ✓ Hero optimized in ' + metrics.heroLoadTime.toFixed(1) + 'ms');
      
      DESKTOP.emit('homepage:hero-ready', { time: metrics.heroLoadTime });
      DESKTOP.recordMetric('homepage:hero-load', metrics.heroLoadTime);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. SPLINE CONTROL — Coordinate with hero-controller
    // ═══════════════════════════════════════════════════════════════════
    
    function optimizeSpline() {
      // Tier 1: No Spline at all on homepage (too heavy)
      if (state.tier <= 1) {
        console.log('[HOME_OPT] Tier 1 — Spline disabled for homepage');
        DESKTOP.emit('homepage:spline-blocked', { reason: 'tier-limited' });
        return;
      }

      // Tier 2: Spline loads only after hero is ready + 500ms delay
      if (state.tier === 2) {
        console.log('[HOME_OPT] Tier 2 — Delaying Spline for hero priority');
        setTimeout(function() {
          if (state.heroReady) {
            DESKTOP.emit('homepage:spline-allowed', {});
            console.log('[HOME_OPT] ✓ Spline allowed (delayed for hero)');
          }
        }, 500);
        return;
      }

      // Tier 3+: Spline loads in parallel with hero
      console.log('[HOME_OPT] Tier 3+ — Spline allowed immediately');
      DESKTOP.emit('homepage:spline-allowed', {});
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. BELOW-FOLD LAZY LOADING — Progressive content loading
    // ═══════════════════════════════════════════════════════════════════
    
    function setupBelowFoldLoading() {
      if (typeof IntersectionObserver === 'undefined') return;

      // Find sections below the fold
      var sections = doc.querySelectorAll('[data-section]');
      if (sections.length === 0) return;

      var sectionObserver = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting && !entry.target.dataset.loaded) {
              var section = entry.target;
              section.dataset.loaded = 'true';
              
              // Trigger any lazy-loaded images in this section
              var lazyImages = section.querySelectorAll('img[loading="lazy"]');
              lazyImages.forEach(function(img) {
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  delete img.dataset.src;
                }
              });

              metrics.sectionsLoaded++;
              console.log('[HOME_OPT] ✓ Section loaded:', section.id || 'unnamed');
              
              DESKTOP.recordMetric('homepage:section-loaded', 1);
            }
          });
        },
        { rootMargin: '100px' } // Start loading 100px before visible
      );

      sections.forEach(function(section) {
        sectionObserver.observe(section);
      });

      console.log('[HOME_OPT] ✓ Observing ' + sections.length + ' sections');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. PRELOAD CRITICAL ASSETS — Based on tier and connection speed
    // ═══════════════════════════════════════════════════════════════════
    
    function preloadCriticalAssets() {
      var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      var effectiveType = connection ? connection.effectiveType : '4g';
      
      // Only preload on fast connections (4g or faster)
      if (effectiveType !== '4g' && effectiveType !== '5g') {
        console.log('[HOME_OPT] Slow connection detected, skipping preload');
        return;
      }

      var assetsToPreload = [];

      // Tier 3+: Preload next likely navigation (store, games)
      if (state.tier >= 3) {
        assetsToPreload.push('/store');
        assetsToPreload.push('/games');
      }

      // Preload logo variants (used across site)
      assetsToPreload.push('/bullmoney-logo.png');

      // Prefetch critical scripts
      if (state.tier >= 2) {
        assetsToPreload.push('/scripts/BMBRAIN/spline-universal.js');
      }

      assetsToPreload.forEach(function(asset) {
        var link = doc.createElement('link');
        link.rel = asset.endsWith('.js') ? 'prefetch' : 'dns-prefetch';
        link.href = asset;
        doc.head.appendChild(link);
        metrics.imagesPreloaded++;
      });

      console.log('[HOME_OPT] ✓ Preloaded ' + assetsToPreload.length + ' assets');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. OPTIMIZE PAGE SECTIONS — Defer/prioritize based on visibility
    // ═══════════════════════════════════════════════════════════════════
    
    function optimizePageSections() {
      // Use content-visibility for off-screen sections (CSS containment)
      var sections = doc.querySelectorAll('[data-section]');
      sections.forEach(function(section, idx) {
        // First 2 sections: render immediately
        if (idx < 2) {
          section.style.contentVisibility = 'visible';
          return;
        }

        // Remaining sections: auto-render when scrolled into view
        section.style.contentVisibility = 'auto';
        section.style.containIntrinsicSize = 'auto 400px'; // Estimate height
      });

      console.log('[HOME_OPT] ✓ Optimized ' + sections.length + ' sections with content-visibility');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. INTERACTION READINESS — Track when page is ready for user input
    // ═══════════════════════════════════════════════════════════════════
    
    function trackInteractionReadiness() {
      var startTime = performance.now();
      
      // Check if main interactive elements are ready
      var checkReady = function() {
        var hero = doc.querySelector('.hero-wrapper');
        var cta = doc.querySelector('.cta-group');
        
        if (hero && cta) {
          metrics.firstInteraction = performance.now() - startTime;
          console.log('[HOME_OPT] ✓ Page interactive in ' + metrics.firstInteraction.toFixed(1) + 'ms');
          
          DESKTOP.emit('homepage:interactive', { time: metrics.firstInteraction });
          DESKTOP.recordMetric('homepage:tti', metrics.firstInteraction);
          
          // Emit ready event for other scripts
          try {
            w.dispatchEvent(new CustomEvent('bm-homepage:ready'));
          } catch (e) {}
        } else {
          setTimeout(checkReady, 50);
        }
      };
      
      checkReady();
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. SCROLL PERFORMANCE — Optimize scroll animations/transitions
    // ═══════════════════════════════════════════════════════════════════
    
    function optimizeScrollPerformance() {
      var scrolling = false;
      var scrollTimeout = null;

      w.addEventListener('scroll', function() {
        if (!scrolling) {
          scrolling = true;
          
          // Pause heavy animations during scroll (coordinated via orchestrator)
          DESKTOP.emit('homepage:scroll-start', {});
          
          // Reduce hero effects during scroll
          var hero = doc.querySelector('.hero-wrapper');
          if (hero) {
            hero.classList.add('scrolling');
          }
        }

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
          scrolling = false;
          
          DESKTOP.emit('homepage:scroll-end', {});
          
          var hero = doc.querySelector('.hero-wrapper');
          if (hero) {
            hero.classList.remove('scrolling');
          }
        }, 150);
      }, { passive: true });

      // Add CSS for scroll optimization
      var style = doc.createElement('style');
      style.textContent = `
        .hero-wrapper.scrolling .cycling-bg-item {
          will-change: auto !important;
          animation-play-state: paused !important;
        }
        .hero-wrapper.scrolling canvas {
          visibility: hidden !important;
        }
      `;
      doc.head.appendChild(style);

      console.log('[HOME_OPT] ✓ Scroll performance optimizations active');
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. MEMORY MANAGEMENT — Clean up unused resources
    // ═══════════════════════════════════════════════════════════════════
    
    function setupMemoryManagement() {
      // Listen for page hide (user navigates away)
      w.addEventListener('pagehide', function() {
        console.log('[HOME_OPT] Page hidden, cleaning up...');
        
        // Clear any cached data specific to homepage
        try {
          sessionStorage.removeItem('hero-animation-state');
          sessionStorage.removeItem('hero-bg-index');
        } catch (e) {}
        
        DESKTOP.emit('homepage:cleanup', {});
      });

      // Listen for memory pressure from orchestrator
      DESKTOP.on('memory-warning', function(data) {
        if (data.percentUsed > 80) {
          console.warn('[HOME_OPT] Memory pressure, reducing quality...');
          
          // Disable heavy hero effects
          var hero = doc.querySelector('.hero-wrapper');
          if (hero) {
            hero.classList.add('memory-constrained');
          }
          
          // Tell hero controller to suspend Spline
          DESKTOP.emit('homepage:force-lite-mode', {});
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. METRICS & DEBUGGING
    // ═══════════════════════════════════════════════════════════════════
    
    function reportMetrics() {
      setTimeout(function() {
        console.group('[HOME_OPT] Performance Report');
        console.log('Hero Load:', metrics.heroLoadTime.toFixed(1) + 'ms');
        console.log('Time to Interactive:', metrics.firstInteraction.toFixed(1) + 'ms');
        console.log('Sections Loaded:', metrics.sectionsLoaded);
        console.log('Assets Preloaded:', metrics.imagesPreloaded);
        console.log('Performance Tier:', state.tier);
        console.groupEnd();

        // Report to orchestrator
        DESKTOP.recordMetric('homepage:hero-load', metrics.heroLoadTime);
        DESKTOP.recordMetric('homepage:tti', metrics.firstInteraction);
      }, 3000);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════
    
    var api = {
      getMetrics: function() { return metrics; },
      getState: function() { return state; },
      forceOptimize: function() {
        optimizeHero();
        optimizeSpline();
        optimizePageSections();
      },
      debug: function() {
        console.group('[HOME_OPT] Debug');
        console.log('Metrics:', metrics);
        console.log('State:', state);
        console.groupEnd();
      }
    };

    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZE ALL OPTIMIZATIONS
    // ═══════════════════════════════════════════════════════════════════
    
    function runOptimizations() {
      // Wait for DOM to be interactive
      if (doc.readyState === 'loading') {
        doc.addEventListener('DOMContentLoaded', runOptimizations);
        return;
      }

      console.log('[HOME_OPT] Running optimizations (Tier ' + state.tier + ')...');

      // Run optimizations in priority order
      optimizeHero();              // P0: Critical for LCP
      optimizeSpline();            // P1: Coordinate 3D loading
      preloadCriticalAssets();     // P2: Preload next navigation
      optimizePageSections();      // P3: Below-fold optimization
      setupBelowFoldLoading();     // P3: Progressive loading
      trackInteractionReadiness(); // P4: Measure TTI
      optimizeScrollPerformance(); // P5: Smooth scroll
      setupMemoryManagement();     // P6: Resource cleanup
      reportMetrics();             // P7: Analytics

      // Register with orchestrator
      DESKTOP.register('homepage-optimizer', api, 90);
      console.log('[HOME_OPT] ✓ Registered with orchestrator');

      // Global debug access
      w.__HOME_OPT__ = api;
    }

    // Start optimizations
    runOptimizations();
  }

  // If orchestrator is already ready, init immediately
  if (DESKTOP && DESKTOP.ready) {
    init();
  }
})();
