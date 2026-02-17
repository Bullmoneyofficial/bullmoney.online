/**
 * Desktop CLS (Cumulative Layout Shift) Prevention
 * Target: Reduce CLS from 0.63 to <0.1 on desktop
 *
 * Strategies:
 * 1. Reserve space for dynamically loaded content
 * 2. Stabilize font loading (prevent FOUT shifts)
 * 3. Lock dimensions on images/videos before load
 * 4. Prevent layout shifts from lazy-loaded components
 * 5. Stabilize navigation bar during scroll
 * 6. Prevent shifts from dynamic component insertion
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var w = window, d = document, nav = navigator || {};
  var ua = String(nav.userAgent || '').toLowerCase();

  // ── Desktop-only gate ──────────────────────────────────────────────
  var isMobile = /mobi|android|iphone|ipad|ipod/i.test(ua);
  var isNarrow = (w.innerWidth || 0) < 769;
  if (isMobile || isNarrow) return;

  d.documentElement.classList.add('desktop-cls-optimized');

  // ── 1. Reserve space for images without explicit dimensions ────────
  function reserveImageSpace() {
    try {
      var images = d.querySelectorAll('img:not([width]):not([height])');
      for (var i = 0; i < images.length; i++) {
        var img = images[i];
        // Skip images that already have explicit CSS dimensions
        var style = w.getComputedStyle(img);
        var hasWidth = style.width && style.width !== 'auto' && style.width !== '0px';
        var hasHeight = style.height && style.height !== 'auto' && style.height !== '0px';
        if (hasWidth && hasHeight) continue;

        // Skip tiny images (icons, avatars)
        if (img.naturalWidth > 0 && img.naturalWidth < 32) continue;

        // Apply aspect-ratio containment
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          img.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
        } else {
          // Not yet loaded: set a default aspect ratio and contain
          if (!img.style.aspectRatio) {
            img.style.aspectRatio = '16 / 9';
          }
          img.style.contain = 'layout';

          // Update once loaded
          img.addEventListener('load', function () {
            if (this.naturalWidth && this.naturalHeight) {
              this.style.aspectRatio = this.naturalWidth + ' / ' + this.naturalHeight;
            }
          }, { once: true });
        }
      }
    } catch (e) {}
  }

  // ── 2. Font loading stabilization ──────────────────────────────────
  // Prevent layout shifts when web fonts load by using font-display: swap
  // and pre-computing metrics
  function stabilizeFonts() {
    try {
      // Add CSS to prevent font-swap layout shift
      var style = d.createElement('style');
      style.textContent = [
        '/* CLS Prevention: Font stabilization for desktop */',
        '@media (min-width: 769px) {',
        '  /* Ensure consistent line heights during font swap */',
        '  body { text-rendering: optimizeSpeed; }',
        '  ',
        '  /* Pre-set font metrics to match Inter fallback sizing */',
        '  :root {',
        '    --font-fallback-ascent: 0.934;',
        '    --font-fallback-descent: -0.234;',
        '    --font-fallback-lineGap: 0;',
        '  }',
        '  ',
        '  /* Smooth font swap: fade in instead of jarring swap */',
        '  .fonts-loaded body {',
        '    text-rendering: optimizeLegibility;',
        '  }',
        '  ',
        '  /* Prevent reflow from scrollbar appearance */',
        '  /* Only apply after splash is done to avoid conflicting with splash scroll-lock */',
        '  html.bm-splash-done {',
        '    overflow-y: scroll;',
        '    scrollbar-gutter: stable;',
        '  }',
        '}'
      ].join('\n');
      d.head.appendChild(style);
    } catch (e) {}
  }

  // ── 3. Navigation bar dimension locking ────────────────────────────
  // Fix nav height to prevent shift when content loads underneath
  function stabilizeNavbar() {
    try {
      var navbars = d.querySelectorAll(
        'nav, header, [role="banner"], .fixed.top-0, [class*="StoreHeader"], [class*="Navbar"]'
      );
      for (var i = 0; i < navbars.length; i++) {
        var nav = navbars[i];
        var rect = nav.getBoundingClientRect();
        if (rect.height > 0 && rect.height < 200) {
          // Lock the nav height to prevent CLS
          nav.style.minHeight = rect.height + 'px';
          nav.style.contain = 'layout style';
        }
      }
    } catch (e) {}
  }

  // ── 4. Dynamic content insertion observer ──────────────────────────
  // Watch for DOM insertions that could cause layout shifts and contain them
  function watchForShifts() {
    try {
      if (!('MutationObserver' in w)) return;

      var observer = new MutationObserver(function (mutations) {
        for (var m = 0; m < mutations.length; m++) {
          var mutation = mutations[m];
          if (mutation.type !== 'childList' || !mutation.addedNodes.length) continue;

          for (var n = 0; n < mutation.addedNodes.length; n++) {
            var node = mutation.addedNodes[n];
            if (node.nodeType !== 1) continue; // Element nodes only

            // Skip splash screen nodes
            if (node.id === 'bm-splash') continue;

            // Check if this is a dynamically inserted component that could shift layout
            var tag = node.tagName;
            if (tag === 'DIV' || tag === 'SECTION' || tag === 'ASIDE') {
              // If it's inserted above the fold and doesn't have fixed positioning
              var style = w.getComputedStyle(node);
              var position = style.position;
              if (position === 'static' || position === 'relative') {
                var rect = node.getBoundingClientRect();
                // If inserted within viewport, contain it
                if (rect.top < w.innerHeight && rect.height > 0) {
                  node.style.contain = 'layout';
                }
              }
            }

            // Handle dynamically inserted images
            if (tag === 'IMG' && !node.getAttribute('width') && !node.getAttribute('height')) {
              if (!node.style.aspectRatio && !node.complete) {
                node.style.aspectRatio = '16 / 9';
                node.addEventListener('load', function () {
                  if (this.naturalWidth && this.naturalHeight) {
                    this.style.aspectRatio = this.naturalWidth + ' / ' + this.naturalHeight;
                  }
                }, { once: true });
              }
            }
          }
        }
      });

      // Only observe body children, not deep subtree (perf-safe)
      observer.observe(d.body, { childList: true, subtree: false });

      // Also observe main content area
      var main = d.querySelector('main, [role="main"], #__next > div');
      if (main && main !== d.body) {
        observer.observe(main, { childList: true, subtree: false });
      }

      // Auto-disconnect after 30s to save memory
      setTimeout(function () { observer.disconnect(); }, 30000);
    } catch (e) {}
  }

  // ── 5. Skeleton placeholder stability ──────────────────────────────
  // Ensure skeleton loaders maintain exact dimensions during transitions
  function stabilizeSkeletons() {
    try {
      var style = d.createElement('style');
      style.textContent = [
        '@media (min-width: 769px) {',
        '  /* Skeleton placeholders: prevent collapse */  ',
        '  [class*="skeleton"], [class*="Skeleton"],',
        '  [class*="loading"], [class*="placeholder"],',
        '  .bm-shell-pulse {',
        '    contain: strict;',
        '    content-visibility: visible;',
        '  }',
        '  ',
        '  /* Dynamic import wrappers: prevent collapse */  ',
        '  [data-nextjs-scroll-focus-boundary] {',
        '    min-height: 1px;',
        '  }',
        '  ',
        '  /* Prevent ad / banner insertion shifts */  ',
        '  .banner-container, .ad-container, .promo-container,',
        '  [class*="cookie"], [class*="Cookie"],',
        '  [class*="notification"], [class*="Notification"] {',
        '    position: fixed !important;',
        '    contain: layout style;',
        '  }',
        '  ',
        '  /* Keep modal overlays from shifting page */',
        '  [role="dialog"], [data-radix-portal],',
        '  [class*="modal"], [class*="Modal"] {',
        '    position: fixed !important;',
        '  }',
        '  ',
        '  /* Prevent footer shift from late-loading content */',
        '  footer, [role="contentinfo"] {',
        '    contain: layout;',
        '  }',
        '}'
      ].join('\n');
      d.head.appendChild(style);
    } catch (e) {}
  }

  // ── 6. Existing element dimension locking ──────────────────────────
  // Lock known widget dimensions to prevent shift
  function lockWidgetDimensions() {
    try {
      var style = d.createElement('style');
      style.textContent = [
        '@media (min-width: 769px) {',
        '  /* Lock header height */',
        '  .fixed.top-0, header[class*="fixed"] {',
        '    min-height: 64px;',
        '    contain: layout style;',
        '  }',
        '  ',
        '  /* Lock hero section to prevent shift */',
        '  .min-h-screen:first-of-type,',
        '  [class*="hero"], [class*="Hero"] {',
        '    min-height: 100vh;',
        '    min-height: 100dvh;',
        '    contain: layout;',
        '  }',
        '  ',
        '  /* Prevent sidebar / floating widget shifts */',
        '  [class*="AppSupportButton"],',
        '  [class*="UltimateHub"],',
        '  [class*="floating"] {',
        '    position: fixed !important;',
        '    contain: layout style;',
        '  }',
        '}'
      ].join('\n');
      d.head.appendChild(style);
    } catch (e) {}
  }

  // ── Execute in priority order ──────────────────────────────────────
  // Critical: run immediately
  stabilizeFonts();
  lockWidgetDimensions();
  stabilizeSkeletons();

  // After DOM ready — but only AFTER splash is done
  function startAfterSplash() {
    reserveImageSpace();
    stabilizeNavbar();
    watchForShifts();
  }

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', function () {
      // Wait for splash to finish before touching DOM
      if (w.__BM_SPLASH_FINISHED__) {
        startAfterSplash();
      } else {
        w.addEventListener('bm-splash-finished', startAfterSplash, { once: true });
      }
    }, { once: true });
  } else {
    if (w.__BM_SPLASH_FINISHED__) {
      startAfterSplash();
    } else {
      w.addEventListener('bm-splash-finished', startAfterSplash, { once: true });
    }
  }

  // Re-check after dynamic content loads
  w.addEventListener('load', function () {
    requestAnimationFrame(function () {
      reserveImageSpace();
      stabilizeNavbar();
    });
  }, { once: true });

  w.__BM_DESKTOP_CLS_READY__ = true;

})();
