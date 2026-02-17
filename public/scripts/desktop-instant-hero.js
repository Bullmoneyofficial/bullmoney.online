// ═════════════════════════════════════════════════════════════════
// DESKTOP INSTANT HERO — Ultra-fast hero rendering (blocking init)
// Runs BEFORE React hydration to optimize critical rendering path
// Must be tiny (<2KB) and execute in <5ms for minimal blocking
// ═════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  if (typeof window === 'undefined') return;
  if (typeof document === 'undefined') return;
  if (navigator.userAgent.match(/mobile|android|iphone/i)) return; // Desktop only

  var w = window;
  var doc = document;
  var html = doc.documentElement;

  // Only run on homepage
  var isHomePage = w.location.pathname === '/' || w.location.pathname === '';
  if (!isHomePage) return;

  var startTime = performance.now();
  console.log('[INSTANT_HERO] Starting ultra-fast hero optimization...');

  // ═══════════════════════════════════════════════════════════════════
  // 1. INJECT CRITICAL CSS — Hero-specific styles
  // ═══════════════════════════════════════════════════════════════════
  var criticalCSS = `
    /* DESKTOP HERO CRITICAL STYLES - Injected for instant render */
    .hero-wrapper {
      will-change: auto !important;
      backface-visibility: hidden;
      transform: translateZ(0);
      -webkit-font-smoothing: antialiased;
      contain: layout style paint;
    }
    
    /* Reduce motion on low-tier devices */
    @media (min-width: 769px) and (prefers-reduced-motion: no-preference) {
      .hero-wrapper.tier-1 *,
      .hero-wrapper.tier-2 * {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
      }
      
      .hero-wrapper.tier-1 canvas,
      .hero-wrapper.tier-1 .cycling-bg-item.spline {
        display: none !important;
      }
    }

    /* Optimize for scrolling */
    .hero-wrapper.scrolling .cycling-bg-item {
      animation-play-state: paused !important;
    }

    /* Memory constrained mode */
    .hero-wrapper.memory-constrained canvas,
    .hero-wrapper.memory-constrained .cycling-bg-item:not(.active) {
      visibility: hidden !important;
      pointer-events: none !important;
    }

    /* Fast fade transitions */
    .cycling-bg-item {
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    /* Prevent layout shift during load */
    .hero-content-overlay {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  `;

  var style = doc.createElement('style');
  style.id = 'desktop-hero-critical';
  style.textContent = criticalCSS;
  doc.head.appendChild(style);

  // ═══════════════════════════════════════════════════════════════════
  // 2. DETECT PERFORMANCE TIER — Fast heuristic-based detection
  // ═══════════════════════════════════════════════════════════════════
  function detectTier() {
    var nav = navigator;
    var mem = nav.deviceMemory || 8;
    var cores = nav.hardwareConcurrency || 4;
    var connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    var effectiveType = connection ? connection.effectiveType : '4g';
    
    var ua = navigator.userAgent.toLowerCase();
    var platform = navigator.platform?.toLowerCase() || '';
    var isAppleSilicon = (ua.includes('mac') && platform.includes('arm')) || ua.includes('apple m');

    // Apple Silicon: Always tier 3+ (8 cores, 16GB unified memory)
    if (isAppleSilicon && cores >= 8) {
      return mem >= 16 ? 4 : 3;
    }

    // Tier 1 (Low): < 4GB RAM, < 4 cores, slow connection
    if (mem < 4 || cores < 4 || effectiveType === '3g' || effectiveType === '2g') {
      return 1;
    }

    // Tier 2 (Medium): 4-8GB RAM, 4-8 cores, moderate connection
    if (mem <= 8 || cores <= 8 || effectiveType === '3g') {
      return 2;
    }

    // Tier 3+ (High): > 8GB RAM, > 8 cores, fast connection
    return 3;
  }

  var tier = detectTier();
  w.__BM_HERO_TIER__ = tier;
  html.classList.add('tier-' + tier);
  
  console.log('[INSTANT_HERO] Detected tier:', tier);

  // ═══════════════════════════════════════════════════════════════════
  // 3. PRECONNECT TO CRITICAL ORIGINS — DNS/TLS early setup
  // ═══════════════════════════════════════════════════════════════════
  function preconnectOrigins() {
    var origins = [];
    
    // Tier 3: Preconnect to Spline CDN
    if (tier >= 3) {
      origins.push('https://prod.spline.design');
      origins.push('https://cdn.spline.design');
    }

    origins.forEach(function(origin) {
      var link = doc.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      doc.head.appendChild(link);
    });

    if (origins.length > 0) {
      console.log('[INSTANT_HERO] Preconnected to ' + origins.length + ' origins');
    }
  }

  preconnectOrigins();

  // ═══════════════════════════════════════════════════════════════════
  // 4. PREFETCH CRITICAL ASSETS — Based on tier
  // ═══════════════════════════════════════════════════════════════════
  function prefetchAssets() {
    // Only prefetch on tier 2+ with fast connection
    if (tier < 2) return;

    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var effectiveType = connection ? connection.effectiveType : '4g';
    
    if (effectiveType !== '4g' && effectiveType !== '5g') return;

    var assets = [];

    // Tier 2+: Prefetch logo
    assets.push({ href: '/bullmoney-logo.png', as: 'image' });

    // Tier 3: Prefetch default Spline scene
    if (tier >= 3) {
      assets.push({ href: '/scene1.splinecode', as: 'fetch' });
    }

    assets.forEach(function(asset) {
      var link = doc.createElement('link');
      link.rel = 'prefetch';
      link.href = asset.href;
      link.as = asset.as;
      if (asset.as === 'fetch') {
        link.crossOrigin = 'anonymous';
      }
      doc.head.appendChild(link);
    });

    if (assets.length > 0) {
      console.log('[INSTANT_HERO] Prefetched ' + assets.length + ' assets');
    }
  }

  prefetchAssets();

  // ═══════════════════════════════════════════════════════════════════
  // 5. OPTIMIZE IMAGE LOADING — Priority hints for hero images
  // ═══════════════════════════════════════════════════════════════════
  function optimizeImageLoading() {
    // Wait for DOM ready
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', optimizeImageLoading);
      return;
    }

    // Find hero images and set high priority
    var hero = doc.querySelector('.hero-wrapper');
    if (!hero) {
      setTimeout(optimizeImageLoading, 50);
      return;
    }

    var heroImages = hero.querySelectorAll('img');
    heroImages.forEach(function(img) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
      img.decoding = 'sync'; // Block to avoid layout shift
    });

    console.log('[INSTANT_HERO] Optimized ' + heroImages.length + ' hero images');
  }

  optimizeImageLoading();

  // ═══════════════════════════════════════════════════════════════════
  // 6. INSTANT FEEDBACK — Show loading state immediately
  // ═══════════════════════════════════════════════════════════════════
  function showInstantFeedback() {
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', showInstantFeedback);
      return;
    }

    var hero = doc.querySelector('.hero-wrapper');
    if (!hero) {
      setTimeout(showInstantFeedback, 50);
      return;
    }

    // Add instant-ready class for CSS transitions
    hero.classList.add('instant-ready');
    
    console.log('[INSTANT_HERO] Hero marked as instant-ready');
  }

  showInstantFeedback();

  // ═══════════════════════════════════════════════════════════════════
  // 7. PERFORMANCE REPORTING
  // ═══════════════════════════════════════════════════════════════════
  var endTime = performance.now();
  var duration = endTime - startTime;
  
  console.log('[INSTANT_HERO] ✓ Completed in ' + duration.toFixed(2) + 'ms');

  // Store metrics for later reporting
  w.__BM_INSTANT_HERO_TIME__ = duration;

  // Emit ready event
  try {
    w.dispatchEvent(new CustomEvent('bm-instant-hero:ready', {
      detail: { tier: tier, duration: duration }
    }));
  } catch (e) {}

})();
