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
  isIOSWebKit: boolean;
  isInAppBrowser: boolean;
  isLegacyIOS: boolean;
  supportsIOS16Plus: boolean;
  supportsIOS17Plus: boolean;
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
let gpuMemoryManagerStarted = false;

type ManagedElement = {
  el: HTMLElement;
  visibility: string;
  contentVisibility: string;
  pointerEvents: string;
};

const managedElements = new Map<HTMLElement, ManagedElement>();

function isLikelyMapElement(element: Element): boolean {
  const iframe = element as HTMLIFrameElement;
  const src = (iframe?.src || '').toLowerCase();
  const className = (element as HTMLElement).className?.toString().toLowerCase() || '';
  const id = ((element as HTMLElement).id || '').toLowerCase();
  return (
    src.includes('google.com/maps') ||
    src.includes('mapbox') ||
    src.includes('openstreetmap') ||
    className.includes('map') ||
    id.includes('map')
  );
}

function shouldManageElementForGpu(element: Element, mode: 'hidden' | 'idle'): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.closest('[data-bullmoney-overlay]')) return false;
  if (element.hasAttribute('data-gpu-keepalive')) return false;

  const isCanvas = element.tagName === 'CANVAS';
  const isSpline = element.tagName === 'SPLINE-VIEWER' || !!element.closest('spline-viewer') || element.hasAttribute('data-spline-scene');
  const isMap = isLikelyMapElement(element) || element.hasAttribute('data-map') || !!element.closest('[data-map]');

  if (!isCanvas && !isSpline && !isMap) return false;
  if (mode === 'hidden') return true;

  const rect = element.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const offscreen = rect.bottom < -200 || rect.top > vh + 200 || rect.right < -200 || rect.left > vw + 200;
  return offscreen;
}

function pauseGpuElements(reason: 'hidden' | 'idle'): void {
  if (typeof document === 'undefined') return;

  const selector = [
    'canvas',
    'spline-viewer',
    '[data-spline-scene]',
    '[data-spline]',
    '[data-map]',
    'iframe',
  ].join(',');

  const candidates = Array.from(document.querySelectorAll(selector));
  let pausedCount = 0;

  candidates.forEach((element) => {
    if (!shouldManageElementForGpu(element, reason)) return;
    const el = element as HTMLElement;

    if (!managedElements.has(el)) {
      managedElements.set(el, {
        el,
        visibility: el.style.visibility,
        contentVisibility: (el.style as any).contentVisibility || '',
        pointerEvents: el.style.pointerEvents,
      });
    }

    el.style.visibility = 'hidden';
    (el.style as any).contentVisibility = 'hidden';
    el.style.pointerEvents = 'none';

    if (el.tagName === 'SPLINE-VIEWER') {
      const viewer = el as any;
      try {
        viewer.pause?.();
        viewer.stop?.();
      } catch {}
    }

    pausedCount += 1;
  });

  if (pausedCount > 0) {
    document.documentElement.classList.add('bullmoney-gpu-paused');
    window.dispatchEvent(new CustomEvent('bullmoney-gpu-pause', { detail: { reason, count: pausedCount } }));
  }
}

function resumeGpuElements(): void {
  if (typeof document === 'undefined') return;

  let resumedCount = 0;
  managedElements.forEach((managed, el) => {
    if (!document.contains(el)) {
      managedElements.delete(el);
      return;
    }

    el.style.visibility = managed.visibility;
    (el.style as any).contentVisibility = managed.contentVisibility;
    el.style.pointerEvents = managed.pointerEvents;

    if (el.tagName === 'SPLINE-VIEWER') {
      const viewer = el as any;
      try {
        viewer.play?.();
      } catch {}
    }

    resumedCount += 1;
  });

  managedElements.clear();
  document.documentElement.classList.remove('bullmoney-gpu-paused');

  if (resumedCount > 0) {
    window.dispatchEvent(new CustomEvent('bullmoney-gpu-resume', { detail: { count: resumedCount } }));
  }
}

function setupSafariGpuMemoryManager(): void {
  if (typeof window === 'undefined' || gpuMemoryManagerStarted) return;

  gpuMemoryManagerStarted = true;
  const root = document.documentElement;

  let idleTimer: number | null = null;
  const ua = navigator.userAgent;
  const isAndroidFamily = /Android|SamsungBrowser/i.test(ua);
  const IDLE_MS = (detectSafari().isMobileSafari || isAndroidFamily) ? 60_000 : 90_000;

  const queueIdlePause = () => {
    const task = () => pauseGpuElements('idle');
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(task, { timeout: 1500 });
    } else {
      window.setTimeout(task, 120);
    }
  };

  const scheduleIdlePause = () => {
    if (document.hidden) return;
    if (idleTimer) window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      queueIdlePause();
    }, IDLE_MS);
  };

  const onUserActivity = () => {
    if (root.classList.contains('bullmoney-gpu-paused')) {
      resumeGpuElements();
    }
    scheduleIdlePause();
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      if (idleTimer) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }
      pauseGpuElements('hidden');
    } else {
      resumeGpuElements();
      scheduleIdlePause();
    }
  };

  const activityEvents: Array<keyof WindowEventMap> = [
    'mousemove',
    'mousedown',
    'pointerdown',
    'touchstart',
    'keydown',
    'scroll',
  ];

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, onUserActivity, { passive: true });
  });
  window.addEventListener('focus', onUserActivity, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Treat existing memory warnings as signals to trim GPU workload without context loss
  window.addEventListener('bullmoney-memory-warning', () => {
    queueIdlePause();
  });

  scheduleIdlePause();
}

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
  
  // iOS detection (includes iPadOS desktop-mode UA)
  const isIPadOSDesktopMode = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || isIPadOSDesktopMode;

  // In-app browser detection (social/search app webviews)
  const isInAppBrowser = /Instagram|FBAN|FBAV|TikTok|musical_ly|Line\/|GSA|Twitter|Snapchat|LinkedInApp|wv\)/i.test(ua);
  
  // iOS Safari specifically
  const isIOSSafari = isIOS && isSafari;

  // iOS WebKit engine browsers/webviews (Safari + in-app + other iOS wrappers on WebKit)
  const isIOSWebKit = isIOS && /AppleWebKit/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  
  // Mobile Safari (includes iPadOS in mobile mode)
  const isMobileSafari = isIOSSafari || (uaLower.includes('mobile') && isSafari) || (isIOSWebKit && isInAppBrowser);
  
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

  const supportsIOS16Plus = iosVersion >= 16;
  const supportsIOS17Plus = iosVersion >= 17;
  const isLegacyIOS = iosVersion > 0 && iosVersion < 16;
  
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
  const needsPolyfills = (isSafari && safariVersion < 15) || isLegacyIOS;
  
  // Safari has known cache invalidation issues, especially on iOS
  const needsCacheFix = isSafari || isIOS || isInAppBrowser;
  
  cachedSafariInfo = {
    isSafari,
    isMobileSafari,
    isIOSSafari,
    isIOSWebKit,
    isInAppBrowser,
    isLegacyIOS,
    supportsIOS16Plus,
    supportsIOS17Plus,
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
    isIOSWebKit: false,
    isInAppBrowser: false,
    isLegacyIOS: false,
    supportsIOS16Plus: false,
    supportsIOS17Plus: false,
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
  if (!info.isSafari && !info.isIOSWebKit) return;
  
  const root = document.documentElement;
  
  // Add Safari class for CSS targeting
  root.classList.add('is-safari');
  if (info.isIOSWebKit) {
    root.classList.add('is-ios-webkit');
  }
  if (info.isMobileSafari) {
    root.classList.add('is-mobile-safari');
  }
  if (info.isIOSSafari) {
    root.classList.add('is-ios-safari');
  }
  if (info.isInAppBrowser) {
    root.classList.add('is-in-app-browser');
  }
  if (info.isLegacyIOS) {
    root.classList.add('ios-legacy');
  }
  if (info.supportsIOS16Plus) {
    root.classList.add('ios-16-plus');
  }
  if (info.supportsIOS17Plus) {
    root.classList.add('ios-17-plus');
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
    
    /* Keep blur parity with other browsers on modern Safari */
    html.is-safari .backdrop-blur-2xl {
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
    }

    html.is-safari .backdrop-blur-xl {
      -webkit-backdrop-filter: blur(16px);
      backdrop-filter: blur(16px);
    }
    
    /* Safari needs explicit -webkit prefixes for some animations */
    html.is-safari .shimmer-spin {
      -webkit-animation: unified-spin 14s linear infinite;
      animation: unified-spin 14s linear infinite;
    }
    
    /* Limit compositing fixes to animated elements only */
    html.is-safari .animate-pulse,
    html.is-safari .animate-spin,
    html.is-safari .animate-bounce,
    html.is-safari .animate-ping {
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
    
    /* Safari legacy fixes (< 15): softened blur fallback */
    html.safari-legacy .backdrop-blur-2xl,
    html.safari-legacy .backdrop-blur-xl,
    html.safari-legacy .backdrop-blur-lg {
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
      background-color: rgba(0, 0, 0, 0.85);
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
    
    /* Keep viewport stable without forcing extra layout padding */
    html.is-ios-safari main {
      min-height: 100dvh;
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
  if (!info.isSafari && !info.isIOSWebKit) return;
  
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
  const ua = navigator.userAgent;
  const isSamsungInternet = /SamsungBrowser/i.test(ua);
  const isAndroidBrowser = /Android/i.test(ua);
  const shouldRunGpuManager = info.isSafari || info.isIOSWebKit || info.isInAppBrowser || isSamsungInternet || isAndroidBrowser;
  const shouldApplySafariLikeTuning = info.isSafari || info.isIOSWebKit;

  if (!shouldApplySafariLikeTuning) {
    if (shouldRunGpuManager) {
      setupSafariGpuMemoryManager();
      console.log('[SafariOptimizations] GPU memory manager enabled for Android/Samsung browser');
    }
    return;
  }
  
  // Safari has aggressive memory limits, especially on iOS
  // Reduce animation complexity preemptively
  const root = document.documentElement;
  
  if (info.isMobileSafari || info.isIOSWebKit) {
    // On mobile Safari, be aggressive with optimizations - NO BLUR
    root.classList.add('reduce-blur');
    root.style.setProperty('--blur-amount', '0px');  // NO BLUR ever
    
    // Reduce animation duration significantly
    root.style.setProperty('--animation-duration-multiplier', '0.3');
    
    if (info.isLegacyIOS) {
      root.classList.add('reduce-animations', 'reduce-shadows');
      root.style.setProperty('--animation-duration-multiplier', '0.2');
      console.log('[SafariOptimizations] Legacy iOS memory profile enabled');
    } else {
      console.log('[SafariOptimizations] Mobile Safari/iOS WebKit memory optimizations applied');
    }
  }

  // Non-destructive GPU memory manager:
  // pauses hidden/offscreen canvas/spline/map rendering and auto-resumes on activity.
  setupSafariGpuMemoryManager();
  
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
  
  if (!info.isSafari && !info.isIOSWebKit && !info.isInAppBrowser) {
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
