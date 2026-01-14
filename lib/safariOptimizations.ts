/**
 * Safari Optimization Module - 2026
 * 
 * Comprehensive Safari-specific fixes for:
 * - WebGL rendering issues
 * - Cache invalidation problems
 * - CSS rendering bugs
 * - Memory management
 * - Animation performance
 * 
 * Safari (especially mobile Safari) has unique issues that require specific handling.
 */

export interface SafariInfo {
  isSafari: boolean;
  isMobileSafari: boolean;
  isIOSSafari: boolean;
  safariVersion: number;
  iosVersion: number;
  hasServiceWorkerSupport: boolean;
  hasCSSContainSupport: boolean;
  hasBackdropFilterSupport: boolean;
  hasWebGLSupport: boolean;
  hasWebGL2Support: boolean;
  needsPolyfills: boolean;
  needsCacheFix: boolean;
}

let cachedSafariInfo: SafariInfo | null = null;

/**
 * Detect Safari browser and version with all its quirks
 */
export function detectSafari(): SafariInfo {
  if (cachedSafariInfo) return cachedSafariInfo;

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return getDefaultSafariInfo();
  }

  const ua = navigator.userAgent;
  const uaLower = ua.toLowerCase();
  
  // Safari detection (must exclude Chrome which also contains 'Safari')
  const isSafari = /^((?!chrome|android|crios|fxios|opera|opr|edge|edg).)*safari/i.test(ua);
  
  // iOS detection
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  
  // iOS Safari specifically
  const isIOSSafari = isIOS && isSafari;
  
  // Mobile Safari (includes iPadOS in mobile mode)
  const isMobileSafari = isIOSSafari || (uaLower.includes('mobile') && isSafari);
  
  // Safari version extraction
  let safariVersion = 0;
  const safariMatch = ua.match(/Version\/(\d+(\.\d+)?)/);
  if (safariMatch) {
    safariVersion = parseFloat(safariMatch[1]);
  }
  
  // iOS version extraction
  let iosVersion = 0;
  const iosMatch = ua.match(/OS (\d+)_/);
  if (iosMatch) {
    iosVersion = parseInt(iosMatch[1], 10);
  }
  
  // Feature detection
  let hasServiceWorkerSupport = 'serviceWorker' in navigator;
  let hasCSSContainSupport = CSS.supports?.('contain', 'layout') ?? false;
  let hasBackdropFilterSupport = CSS.supports?.('backdrop-filter', 'blur(10px)') ?? false;
  
  // WebGL detection
  let hasWebGLSupport = false;
  let hasWebGL2Support = false;
  try {
    const canvas = document.createElement('canvas');
    hasWebGLSupport = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    hasWebGL2Support = !!canvas.getContext('webgl2');
    canvas.remove();
  } catch (e) {
    hasWebGLSupport = false;
    hasWebGL2Support = false;
  }
  
  // Safari < 15 needs polyfills for many features
  const needsPolyfills = isSafari && safariVersion < 15;
  
  // Safari has known cache invalidation issues, especially on iOS
  const needsCacheFix = isSafari || isIOS;
  
  cachedSafariInfo = {
    isSafari,
    isMobileSafari,
    isIOSSafari,
    safariVersion,
    iosVersion,
    hasServiceWorkerSupport,
    hasCSSContainSupport,
    hasBackdropFilterSupport,
    hasWebGLSupport,
    hasWebGL2Support,
    needsPolyfills,
    needsCacheFix,
  };
  
  if (isSafari) {
    console.log('[SafariOptimizations] Safari detected:', cachedSafariInfo);
  }
  
  return cachedSafariInfo;
}

function getDefaultSafariInfo(): SafariInfo {
  return {
    isSafari: false,
    isMobileSafari: false,
    isIOSSafari: false,
    safariVersion: 0,
    iosVersion: 0,
    hasServiceWorkerSupport: true,
    hasCSSContainSupport: true,
    hasBackdropFilterSupport: true,
    hasWebGLSupport: true,
    hasWebGL2Support: true,
    needsPolyfills: false,
    needsCacheFix: false,
  };
}

/**
 * Apply Safari-specific CSS fixes
 */
export function applySafariCSSFixes(): void {
  if (typeof document === 'undefined') return;
  
  const info = detectSafari();
  if (!info.isSafari) return;
  
  const root = document.documentElement;
  
  // Add Safari class for CSS targeting
  root.classList.add('is-safari');
  if (info.isMobileSafari) {
    root.classList.add('is-mobile-safari');
  }
  if (info.isIOSSafari) {
    root.classList.add('is-ios-safari');
  }
  
  // Version-specific classes
  if (info.safariVersion < 15) {
    root.classList.add('safari-legacy');
  }
  if (info.safariVersion >= 16) {
    root.classList.add('safari-modern');
  }
  
  // Inject Safari-specific styles
  const styleId = 'safari-optimizations-css';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* ================================================================
       SAFARI-SPECIFIC CSS FIXES
       ================================================================ */
    
    /* Fix Safari backdrop-filter performance */
    html.is-safari .backdrop-blur-2xl,
    html.is-safari .backdrop-blur-xl {
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    
    /* Safari needs explicit -webkit prefixes for some animations */
    html.is-safari .shimmer-spin {
      -webkit-animation: unified-spin 4s linear infinite;
      animation: unified-spin 4s linear infinite;
    }
    
    /* Fix Safari transform compositing */
    html.is-safari [class*="translate"],
    html.is-safari [class*="rotate"],
    html.is-safari [class*="scale"] {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
    }
    
    /* Safari mobile scrolling fixes */
    html.is-mobile-safari body {
      -webkit-overflow-scrolling: touch;
    }
    
    html.is-mobile-safari main {
      -webkit-overflow-scrolling: touch;
      overflow-y: auto;
    }
    
    /* Safari position: fixed issues in iOS */
    html.is-ios-safari .fixed {
      -webkit-transform: translate3d(0, 0, 0);
      transform: translate3d(0, 0, 0);
    }
    
    /* Fix Safari canvas rendering */
    html.is-safari canvas {
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    
    /* Safari legacy fixes (< 15) */
    html.safari-legacy .backdrop-blur-2xl,
    html.safari-legacy .backdrop-blur-xl,
    html.safari-legacy .backdrop-blur-lg {
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      background-color: rgba(0, 0, 0, 0.8);
    }
    
    /* Fix Safari CSS contain support */
    html.safari-legacy [style*="contain"] {
      contain: unset;
    }
    
    /* Safari gradient rendering fix */
    html.is-safari .bg-gradient-to-r,
    html.is-safari .bg-gradient-to-l,
    html.is-safari .bg-gradient-to-t,
    html.is-safari .bg-gradient-to-b {
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
    }
    
    /* Safari text rendering */
    html.is-safari {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Safari touch-action fix */
    html.is-mobile-safari [data-allow-scroll] {
      touch-action: pan-y !important;
      -webkit-touch-callout: none;
    }
    
    /* Safari z-index stacking context fix */
    html.is-safari .isolate {
      isolation: isolate;
      -webkit-transform: translateZ(0);
    }
    
    /* Safari animation will-change optimization */
    html.is-safari .shimmer-line,
    html.is-safari .shimmer-spin,
    html.is-safari .shimmer-pulse {
      will-change: transform, opacity;
      -webkit-will-change: transform, opacity;
    }
    
    /* Safari-specific viewport height fix */
    html.is-ios-safari {
      min-height: -webkit-fill-available;
    }
    
    html.is-ios-safari body {
      min-height: -webkit-fill-available;
    }
    
    /* Prevent Safari from breaking layouts with empty space at bottom */
    html.is-ios-safari main {
      min-height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
    }
  `;
  
  document.head.appendChild(style);
  console.log('[SafariOptimizations] CSS fixes applied');
}

/**
 * Force Safari to reload assets by adding cache-busting parameter
 */
export function safariCacheBust(): void {
  const info = detectSafari();
  if (!info.needsCacheFix) return;
  
  // Check if we've already done a cache bust this session
  const bustKey = 'bullmoney_safari_cache_bust';
  const lastBust = sessionStorage.getItem(bustKey);
  const now = Date.now();
  
  // Only bust once per session or if it's been more than 1 hour
  if (lastBust && (now - parseInt(lastBust, 10)) < 3600000) {
    return;
  }
  
  console.log('[SafariOptimizations] Running Safari cache bust...');
  
  // Clear caches via Cache API
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log('[SafariOptimizations] Deleted cache:', name);
      });
    }).catch(e => {
      console.warn('[SafariOptimizations] Cache delete failed:', e);
    });
  }
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('[SafariOptimizations] Unregistered SW:', registration.scope);
      });
    }).catch(e => {
      console.warn('[SafariOptimizations] SW unregister failed:', e);
    });
  }
  
  // Mark as done
  sessionStorage.setItem(bustKey, now.toString());
}

/**
 * Fix Safari WebGL context loss issues
 */
export function setupSafariWebGLFix(): void {
  if (typeof window === 'undefined') return;
  
  const info = detectSafari();
  if (!info.isSafari) return;
  
  // Safari can lose WebGL context under memory pressure
  // Listen for context loss and attempt recovery
  window.addEventListener('webglcontextlost', (event) => {
    console.warn('[SafariOptimizations] WebGL context lost, preventing default');
    event.preventDefault();
    
    // Notify the app to reduce 3D load
    window.dispatchEvent(new CustomEvent('bullmoney-reduce-3d', {
      detail: { reason: 'webgl-context-lost' }
    }));
  }, true);
  
  window.addEventListener('webglcontextrestored', () => {
    console.log('[SafariOptimizations] WebGL context restored');
    
    // Notify the app that 3D is available again
    window.dispatchEvent(new CustomEvent('bullmoney-restore-3d'));
  }, true);
}

/**
 * Apply Safari memory optimizations
 */
export function applySafariMemoryOptimizations(): void {
  if (typeof window === 'undefined') return;
  
  const info = detectSafari();
  if (!info.isSafari) return;
  
  // Safari has aggressive memory limits, especially on iOS
  // Reduce animation complexity preemptively
  const root = document.documentElement;
  
  if (info.isMobileSafari) {
    // On mobile Safari, be more aggressive with optimizations
    root.classList.add('reduce-blur');
    root.style.setProperty('--blur-amount', '4px');
    
    // Reduce animation duration
    root.style.setProperty('--animation-duration-multiplier', '0.8');
    
    console.log('[SafariOptimizations] Mobile Safari memory optimizations applied');
  }
  
  // Listen for memory warnings (iOS 15+)
  // @ts-ignore - This API exists on iOS Safari
  if ('onmemorywarning' in window) {
    // @ts-ignore
    window.onmemorywarning = () => {
      console.warn('[SafariOptimizations] Memory warning received, reducing quality');
      root.classList.add('shimmer-quality-low', 'reduce-animations', 'reduce-blur', 'reduce-shadows');
      
      // Dispatch event for components to respond
      window.dispatchEvent(new CustomEvent('bullmoney-memory-warning'));
    };
  }
}

/**
 * Initialize all Safari optimizations
 * Call this early in app initialization
 */
export function initSafariOptimizations(): SafariInfo {
  const info = detectSafari();
  
  if (!info.isSafari) {
    return info;
  }
  
  console.log('[SafariOptimizations] Initializing Safari optimizations...');
  
  // Apply CSS fixes
  applySafariCSSFixes();
  
  // Set up WebGL fix
  setupSafariWebGLFix();
  
  // Apply memory optimizations
  applySafariMemoryOptimizations();
  
  // Run cache bust if needed (for stale deployments)
  safariCacheBust();
  
  console.log('[SafariOptimizations] Initialization complete');
  
  return info;
}

/**
 * Force a hard reload for Safari users
 * Use this when you detect stale assets
 */
export function safariForceReload(): void {
  if (typeof window === 'undefined') return;
  
  // Clear all caches first
  safariCacheBust();
  
  // Clear localStorage version to force fresh state
  try {
    localStorage.removeItem('bullmoney_app_version');
    localStorage.removeItem('bullmoney_build_id');
    localStorage.removeItem('bullmoney_build_timestamp');
  } catch (e) {}
  
  // Force reload with cache bypass
  setTimeout(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.replace(url.toString());
  }, 100);
}

/**
 * Check if Safari needs a force reload due to stale assets
 */
export function checkSafariStaleBuild(): boolean {
  if (typeof window === 'undefined') return false;
  
  const info = detectSafari();
  if (!info.isSafari) return false;
  
  // Check for Next.js build ID mismatch
  const buildId = (window as any).__NEXT_DATA__?.buildId;
  const storedBuildId = localStorage.getItem('bullmoney_build_id');
  
  if (storedBuildId && buildId && storedBuildId !== buildId) {
    console.log('[SafariOptimizations] Stale build detected:', storedBuildId, '->', buildId);
    return true;
  }
  
  // Update stored build ID
  if (buildId) {
    localStorage.setItem('bullmoney_build_id', buildId);
  }
  
  return false;
}

export default initSafariOptimizations;
