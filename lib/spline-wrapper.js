"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// ULTRA-FAST HERO LOADING - Preload runtime at module import time
// Target: 100ms load time on ALL browsers and devices
// LCP FIX: Start loading immediately for <2.5s LCP
// ============================================================================
let runtimePromise = null;
let runtimeModule = null;
let sceneCache = new Map(); // In-memory scene cache for instant re-renders
let heroScenePreloaded = false;
let splineErrorHandlerInstalled = false;

// ULTRA-AGGRESSIVE HERO PRELOADING - Target: 50ms load time
// Start loading immediately on module import for instant hero
if (typeof window !== 'undefined') {
  // Suppress Spline viewer internal errors (position undefined during animation frames)
  // These are harmless and occur when scene objects aren't fully initialized yet
  if (!splineErrorHandlerInstalled) {
    splineErrorHandlerInstalled = true;
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      // Suppress known Spline viewer errors
      if (typeof message === 'string' && 
          (message.includes("Cannot read properties of undefined (reading 'position')") ||
           (source && source.includes('spline-viewer')))) {
        // Silently ignore Spline animation frame errors
        return true; // Prevent default handling
      }
      // Call original handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };
  }
  
  // LCP FIX: Start runtime import immediately on module load
  runtimePromise = import('@splinetool/runtime').then(mod => {
    runtimeModule = mod;
    console.log('🚀 Spline runtime preloaded for 50ms target!');
    return mod;
  }).catch(err => {
    console.warn('⚠️ Spline runtime preload failed:', err.message);
    return null;
  });
  
  // HERO SCENE: Ultra-aggressive preloading for 50ms target
  if (!heroScenePreloaded) {
    heroScenePreloaded = true;
    
    // Method 1: Preload link with highest priority
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = '/scene1.splinecode';
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    link.fetchPriority = 'high'; // Highest priority
    document.head.appendChild(link);
    
    // Method 2: Immediate fetch with cache warming
    fetch('/scene1.splinecode', { 
      method: 'GET', 
      mode: 'cors',
      cache: 'force-cache',
      priority: 'high'
    }).then(response => {
      if (response.ok && 'caches' in window) {
        // Cache in multiple storage layers for instant access
        caches.open('bullmoney-spline-hero-v4').then(cache => {
          cache.put('/scene1.splinecode', response.clone());
        });
        // Also store in memory
        response.clone().arrayBuffer().then(buffer => {
          sceneCache.set('/scene1.splinecode', buffer);
        });
      }
    }).catch(() => {});
    
    // Method 3: Service Worker caching if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'PRELOAD_SCENE',
            url: '/scene1.splinecode'
          });
        }
      });
    }
    
    console.log('⚡ Hero scene ultra-preload initiated for 50ms target');
  }
}

// Preload and cache scene blob
const preloadScene = async (sceneUrl) => {
  if (sceneCache.has(sceneUrl)) return sceneCache.get(sceneUrl);
  
  try {
    // Try Cache API first for instant loading
    if ('caches' in window) {
      const cache = await caches.open('bullmoney-spline-hero-v3');
      const cachedResponse = await cache.match(sceneUrl);
      if (cachedResponse) {
        console.log('⚡ Scene loaded from cache!');
        sceneCache.set(sceneUrl, sceneUrl);
        return sceneUrl;
      }
      
      // Prefetch and cache for next time
      fetch(sceneUrl).then(response => {
        if (response.ok) cache.put(sceneUrl, response.clone());
      }).catch(() => {});
    }
  } catch (e) {
    // Cache API not available, continue with direct load
  }
  
  sceneCache.set(sceneUrl, sceneUrl);
  return sceneUrl;
};

// ============================================================================
// 120Hz DETECTION - Real-time frame rate measurement
// ============================================================================
let cachedRefreshRate = null;
let frameRateMeasured = false;

const measureActualRefreshRate = () => {
  return new Promise((resolve) => {
    if (frameRateMeasured && cachedRefreshRate) {
      resolve(cachedRefreshRate);
      return;
    }
    
    let frames = 0;
    let startTime = performance.now();
    const targetFrames = 20; // Measure 20 frames for accuracy
    
    const countFrame = (timestamp) => {
      frames++;
      if (frames < targetFrames) {
        requestAnimationFrame(countFrame);
      } else {
        const elapsed = timestamp - startTime;
        const measuredFps = Math.round((frames / elapsed) * 1000);
        // Round to nearest common refresh rate
        if (measuredFps >= 110) cachedRefreshRate = 120;
        else if (measuredFps >= 80) cachedRefreshRate = 90;
        else cachedRefreshRate = 60;
        frameRateMeasured = true;
        resolve(cachedRefreshRate);
      }
    };
    
    requestAnimationFrame(countFrame);
  });
};

const getNativeRefreshRate = () => {
  if (typeof window === 'undefined') return 60;
  
  // Method 1: Screen API (Chrome 110+)
  if ('refreshRate' in window.screen) {
    return Math.min(window.screen.refreshRate, 120);
  }
  
  // Method 2: Check for ProMotion/high-refresh devices
  const ua = navigator.userAgent.toLowerCase();
  const w = window.screen.width;
  const dpr = window.devicePixelRatio;
  
  // iPhone Pro (13/14/15/16 Pro)
  if (/iphone/.test(ua) && dpr >= 3) {
    if (w === 393 || w === 430 || w === 390 || w === 428 || w === 402 || w === 440) {
      return 120;
    }
  }
  
  // iPad Pro (all support 120Hz)
  if (/ipad/.test(ua) && dpr >= 2 && w >= 1024) {
    return 120;
  }
  
  // Samsung Galaxy S/Note high-refresh
  if (/samsung|sm-g|sm-n|sm-s/i.test(ua) && dpr >= 2.5) {
    return 120;
  }
  
  // OnePlus, Xiaomi, high-end Android
  if (/oneplus|xiaomi|redmi|poco|oppo|realme/i.test(ua) && dpr >= 2.5) {
    return 120;
  }
  
  // Desktop gaming monitors (1440p+ usually 144Hz+)
  if (w >= 2560 && !(/mobi|android|iphone|ipad/i.test(ua))) {
    return 120;
  }
  
  // Use cached measured rate if available
  if (cachedRefreshRate) return cachedRefreshRate;
  
  return 60;
};

// ============================================================================
// DEVICE TIER DETECTION - Fast & lightweight with 120Hz awareness
// ============================================================================
const getTierFromRootClass = () => {
  if (typeof document === 'undefined') return null;
  const root = document.documentElement;
  if (root.classList.contains('device-ultra')) return 'ultra';
  if (root.classList.contains('device-high')) return 'high';
  if (root.classList.contains('device-medium')) return 'medium';
  if (root.classList.contains('device-low') || root.classList.contains('device-minimal')) return 'low';
  return null;
};

const tryGetDeviceMonitorInfo = () => {
  try {
    return window.deviceMonitor?.getInfo?.();
  } catch (e) {
    return null;
  }
};

const getDeviceTier = (forceLoad = false) => {
  if (typeof window === 'undefined') return 'high';
  
  // UPDATED 2026.1.22: Never disable - always render with quality reduction
  const browserInfo = typeof window.detectBrowser === 'function' ? window.detectBrowser() : null;
  
  // For hero scenes, always load with appropriate quality
  if (forceLoad) {
    // CHANGED: Never return 'minimal' as disabled, use 'low' instead
    if (browserInfo?.gpuTier === 'minimal') {
      return 'low'; // Render with extreme quality reduction instead of blocking
    }
    return browserInfo?.gpuTier || 'high';
  }
  
  // For non-hero scenes, check browser and device capabilities
  const ua = navigator.userAgent.toLowerCase();
  
  // Use enhanced browser detection if available
  if (browserInfo) {
    switch (browserInfo.gpuTier) {
      case 'high': return 'ultra';
      case 'medium': return 'high';
      case 'low': return 'medium';
      case 'minimal': return 'low';
      default: return 'high';
    }
  }
  
  // FALLBACK: Legacy detection for when enhanced detection isn't available
  // UPDATED 2026: Detect Apple devices and Instagram for premium experience
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isMac = /macintosh|mac os x/i.test(ua);
  const isAppleDevice = isIOS || isMac;
  const isInstagram = ua.includes('instagram') || ua.includes('ig_');
  
  // Apple devices and Instagram get at least 'high' tier
  if (isAppleDevice || isInstagram) {
    const memory = navigator.deviceMemory || 8;
    if (memory >= 8) return 'ultra';
    return 'high';
  }
  
  const isInAppBrowser = ua.includes('tiktok') || 
                          ua.includes('fban') || ua.includes('fbav') || 
                          ua.includes('twitter') || ua.includes('snapchat') ||
                          ua.includes('linkedin') || ua.includes('pinterest');
  
  // Non-Apple/non-Instagram in-app browsers get 'low' tier for non-hero scenes
  if (isInAppBrowser) {
    return 'low';
  }

  // Prefer device manager tier if present (hydrated by UnifiedPerformance)
  const rootTier = getTierFromRootClass();
  if (rootTier) return rootTier;

  // Prefer DeviceMonitor hardware info if available
  const info = tryGetDeviceMonitorInfo();
  if (info?.performance?.gpu?.tier && info?.performance?.memory?.total && info?.performance?.cpu?.cores) {
    const gpuTier = info.performance.gpu.tier;
    const memory = info.performance.memory.total;
    const cores = info.performance.cpu.cores;
    const isMobile = info.device?.type === 'mobile' || (window.innerWidth < 768);
    // UPDATED 2026: Mobile can also get ultra quality
    if (gpuTier === 'high' && memory >= 8 && cores >= 4) return 'ultra';
    if (gpuTier === 'high' || memory >= 4) return 'high';
    if (gpuTier === 'medium' || (memory >= 2 && cores >= 2)) return 'medium';
    return 'low';
  }
  
  const memory = navigator.deviceMemory || 4; // GB
  const cores = navigator.hardwareConcurrency || 4;
  const connection = navigator.connection || {};
  const effectiveType = connection.effectiveType || '4g';
  const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const nativeHz = getNativeRefreshRate();
  
  // Check WebGL capability
  let webglTier = 'high';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        // Apple GPU = high tier (A14+, M1+ are very powerful)
        if (renderer.includes('apple')) {
          webglTier = 'high';
        } else if (renderer.includes('intel') || renderer.includes('mali-4') || renderer.includes('adreno 3')) {
          webglTier = 'low';
        } else if (renderer.includes('mali') || renderer.includes('adreno 5')) {
          webglTier = 'medium';
        }
      }
    } else {
      webglTier = 'low';
    }
  } catch (e) {
    webglTier = 'medium';
  }

  // Scoring system with 120Hz bonus
  let score = 0;
  
  // Memory: 0-3 points
  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else if (memory >= 2) score += 1;
  
  // Cores: 0-2 points  
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  
  // Connection: 0-2 points
  if (effectiveType === '4g') score += 2;
  else if (effectiveType === '3g') score += 1;
  
  // GPU: 0-3 points
  if (webglTier === 'high') score += 3;
  else if (webglTier === 'medium') score += 1;
  
  // 120Hz device bonus - if device supports 120Hz, it's likely high-end
  if (nativeHz >= 120) score += 2;
  else if (nativeHz >= 90) score += 1;
  
  // Mobile penalty (reduced for 120Hz devices)
  if (isMobile && nativeHz < 120) score -= 1;
  
  // Determine tier
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
};

const getGlobalSplineQuality = () => {
  if (typeof document === 'undefined') return 'high';
  const root = document.documentElement;
  if (root.classList.contains('spline-quality-low')) return 'low';
  if (root.classList.contains('spline-quality-medium')) return 'medium';
  return 'high';
};

const isReduceAnimations = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-animations');

// ============================================================================
// QUALITY PROFILES - Optimized for 120Hz across all device sizes
// ============================================================================
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const getQualityProfile = (tier, isHero = false, overrides = {}) => {
  const info = tryGetDeviceMonitorInfo();
  const rawDpr = typeof window !== 'undefined'
    ? (info?.screen?.pixelRatio || window.devicePixelRatio || 1)
    : 1;
  const nativeHz = getNativeRefreshRate();
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const longEdge = Math.max(screenWidth, screenHeight);
  
  // ============================================================================
  // SCREEN SIZE CATEGORIES - iPhone 4 (320px) to 8K TV (7680px)
  // ============================================================================
  const isVerySmallScreen = screenWidth <= 320 || screenHeight <= 480; // iPhone 4
  const isSmallMobile = screenWidth < 375; // iPhone SE 1st gen
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isLaptop = screenWidth >= 1024 && screenWidth < 1440;
  const isDesktop = screenWidth >= 1440 && longEdge < 2560;
  const isQHD = longEdge >= 2560 && longEdge < 3840;
  const is4K = longEdge >= 3840 && longEdge < 5120;
  const is5K = longEdge >= 5120 && longEdge < 7680;
  const is8K = longEdge >= 7680;
  
  const reduceAnimations = isReduceAnimations();
  const splineQuality = getGlobalSplineQuality();
  const gpuTier = info?.performance?.gpu?.tier || 'medium';

  const minDpr = typeof overrides.minDpr === 'number' ? overrides.minDpr : 0.5;
  const maxDpr = typeof overrides.maxDpr === 'number' ? overrides.maxDpr : rawDpr;

  const applySplineQuality = (profile) => {
    let nextDpr = profile.dpr;
    let nextFps = profile.frameRateLimit;
    let nextAntialias = profile.antialias;
    let nextTextureSize = profile.maxTextureSize;

    // Check for FPS-based classes for more granular control
    const root = typeof document !== 'undefined' ? document.documentElement : null;
    const isFpsMinimal = root?.classList.contains('fps-minimal');
    const isFpsLow = root?.classList.contains('fps-low');
    const isFpsMedium = root?.classList.contains('fps-medium');

    // AGGRESSIVE quality reduction when FPS is struggling
    if (isFpsMinimal) {
      nextDpr = Math.max(minDpr, Math.min(nextDpr * 0.5, 0.75));
      nextFps = Math.min(nextFps, 30);
      nextAntialias = false;
      nextTextureSize = Math.min(nextTextureSize, 512);
    } else if (isFpsLow) {
      nextDpr = Math.max(minDpr, Math.min(nextDpr * 0.6, 0.85));
      nextFps = Math.min(nextFps, 45);
      nextAntialias = false;
      nextTextureSize = Math.min(nextTextureSize, 1024);
    } else if (isFpsMedium) {
      nextDpr = Math.max(minDpr, Math.min(nextDpr * 0.75, 1.0));
      nextFps = Math.min(nextFps, 60);
      nextTextureSize = Math.min(nextTextureSize, 2048);
    } else if (splineQuality === 'medium') {
      nextDpr = Math.max(minDpr, Math.min(nextDpr, nextDpr * 0.85));
      nextFps = Math.min(nextFps, 60);
    } else if (splineQuality === 'low') {
      nextDpr = Math.max(minDpr, Math.min(nextDpr, nextDpr * 0.7));
      nextFps = Math.min(nextFps, 45);
    }

    nextDpr = clamp(nextDpr, minDpr, maxDpr);

    return {
      ...profile,
      dpr: nextDpr,
      frameRateLimit: nextFps,
      antialias: nextAntialias,
      maxTextureSize: nextTextureSize,
    };
  };
  
  // 'Disabled' tier - CHANGED: Still render with EXTREME quality reduction instead of not rendering
  // This ensures Spline always appears, even on very low-end devices
  if (tier === 'disabled' || tier === 'minimal') {
    return {
      dpr: 0.5, // Very low resolution
      antialias: false,
      powerPreference: 'low-power', // Save battery
      maxTextureSize: 256, // Minimal textures
      frameRateLimit: 20, // Very low FPS but still animating
      loadDelay: 0,
      rootMargin: '0px',
      instant: false,
      disabled: false, // CHANGED: Never disabled
    };
  }
  
  // ============================================================================
  // HERO SCENE QUALITY - Optimized per screen size
  // ============================================================================
  if (isHero) {
    let baseCap, baseTexture, baseFps;
    
    // Very small screens (iPhone 4 / 320px)
    if (isVerySmallScreen) {
      baseCap = 0.75;
      baseTexture = 512;
      baseFps = 30;
    }
    // Small mobile (< 375px)
    else if (isSmallMobile) {
      baseCap = 0.85;
      baseTexture = 1024;
      baseFps = 30;
    }
    // Standard mobile
    else if (isMobile) {
      baseCap = 1.0;
      baseTexture = 1536;
      baseFps = 45;
    }
    // Tablet
    else if (isTablet) {
      baseCap = 1.25;
      baseTexture = 2048;
      baseFps = 60;
    }
    // Laptop
    else if (isLaptop) {
      baseCap = 1.5;
      baseTexture = 2048;
      baseFps = 60;
    }
    // Standard desktop
    else if (isDesktop) {
      baseCap = 1.75;
      baseTexture = 3072;
      baseFps = 90;
    }
    // QHD / 1440p
    else if (isQHD) {
      baseCap = 2.0;
      baseTexture = 4096;
      baseFps = 90;
    }
    // 4K display
    else if (is4K) {
      baseCap = Math.min(2.0, rawDpr);
      baseTexture = 4096;
      baseFps = 60; // Cap at 60 for 4K
    }
    // 5K display
    else if (is5K) {
      baseCap = Math.min(1.75, rawDpr);
      baseTexture = 4096;
      baseFps = 60;
    }
    // 8K display
    else if (is8K) {
      baseCap = Math.min(1.5, rawDpr); // Conservative for 8K
      baseTexture = 4096;
      baseFps = 60;
    }
    // Fallback
    else {
      baseCap = 1.5;
      baseTexture = 2048;
      baseFps = 60;
    }
    
    const gpuCap = gpuTier === 'low' ? Math.min(baseCap, 0.85) : gpuTier === 'high' ? baseCap : Math.min(baseCap, 1.25);
    const qualityScale = splineQuality === 'low' ? 0.7 : splineQuality === 'medium' ? 0.85 : 1;
    const dpr = clamp(Math.min(rawDpr, gpuCap, maxDpr) * qualityScale, minDpr, baseCap);
    const frameRateLimit = typeof overrides.targetFPS === 'number' 
      ? Math.min(overrides.targetFPS, nativeHz)
      : Math.min(baseFps, nativeHz);
    
    return {
      dpr: reduceAnimations ? Math.min(dpr, 1.0) : dpr,
      antialias: !isVerySmallScreen && !isSmallMobile, // Disable AA on very small screens
      powerPreference: 'high-performance',
      maxTextureSize: baseTexture,
      frameRateLimit: splineQuality === 'low'
        ? Math.min(frameRateLimit, 30)
        : splineQuality === 'medium'
          ? Math.min(frameRateLimit, 45)
          : frameRateLimit,
      loadDelay: 0,
      rootMargin: '9999px',
      instant: true,
      disabled: false,
    };
  }
  
  // ============================================================================
  // NON-HERO QUALITY PROFILES
  // ============================================================================
  const profiles = {
    ultra: {
      dpr: clamp(Math.min(rawDpr, isMobile ? 1.25 : (is4K || is5K || is8K) ? 2.0 : 1.75, maxDpr), minDpr, isMobile ? 1.25 : 2.0),
      antialias: true,
      powerPreference: 'high-performance',
      maxTextureSize: is4K || is5K || is8K ? 4096 : 4096,
      frameRateLimit: Math.min(nativeHz, (typeof overrides.targetFPS === 'number' ? overrides.targetFPS : nativeHz)),
      loadDelay: 0,
      rootMargin: '1600px',
      instant: false,
      disabled: false,
    },
    high: {
      dpr: clamp(Math.min(rawDpr, isMobile ? 1.1 : 1.45, maxDpr), minDpr, isMobile ? 1.1 : 1.45),
      antialias: true,
      powerPreference: 'high-performance',
      maxTextureSize: 3072,
      frameRateLimit: Math.min(nativeHz, (typeof overrides.targetFPS === 'number' ? overrides.targetFPS : 90)),
      loadDelay: 0,
      rootMargin: '1400px',
      instant: false,
      disabled: false,
    },
    medium: {
      dpr: clamp(Math.min(rawDpr, 1.0, maxDpr), minDpr, 1.0),
      antialias: true,
      powerPreference: 'high-performance',
      maxTextureSize: 2048,
      frameRateLimit: Math.min(nativeHz, (typeof overrides.targetFPS === 'number' ? overrides.targetFPS : 60)),
      loadDelay: 0,
      rootMargin: '1100px',
      instant: false,
      disabled: false,
    },
    low: {
      // Low: aggressively reduce DPR and cap FPS.
      dpr: clamp(Math.min(rawDpr, 0.85, maxDpr), minDpr, 0.85),
      antialias: false,
      powerPreference: 'default',
      maxTextureSize: 1024,
      frameRateLimit: Math.min(nativeHz, (typeof overrides.targetFPS === 'number' ? overrides.targetFPS : 45)),
      loadDelay: 0,
      rootMargin: '800px',
      instant: false,
      disabled: false,
    }
  };

  const picked = applySplineQuality(profiles[tier] || profiles.medium);
  if (!reduceAnimations) return picked;

  return applySplineQuality({
    ...picked,
    dpr: Math.min(picked.dpr, 1.0),
    frameRateLimit: Math.min(picked.frameRateLimit, 60),
  });
};

// ============================================================================
// FRAME RATE LIMITER - Saves battery & reduces heat on low-end
// ============================================================================
class FrameRateLimiter {
  constructor(targetFps = 120) {
    this.targetFps = targetFps;
    this.frameInterval = 1000 / targetFps;
    this.lastFrameTime = 0;
    this.isActive = false;
    this.rafId = null;
  }

  start(app) {
    // Skip limiting for 120Hz displays - let browser handle native vsync
    if (!app || this.targetFps >= 120) return;
    
    this.isActive = true;
    const originalRender = app.render?.bind(app);
    
    if (originalRender) {
      const limitedRender = (time) => {
        if (!this.isActive) return;
        
        if (time - this.lastFrameTime >= this.frameInterval) {
          this.lastFrameTime = time;
          originalRender();
        }
        this.rafId = requestAnimationFrame(limitedRender);
      };
      
      this.rafId = requestAnimationFrame(limitedRender);
    }
  }

  stop() {
    this.isActive = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// ============================================================================
// MAIN COMPONENT - Ultra-fast hero loading with 200ms target
// ============================================================================
export default function SplineWrapper({ 
  scene, 
  placeholder,
  className,
  onLoad,
  onError,
  priority = false, // NEW: Set true for hero/above-fold content
  isHero = false,   // NEW: Alias for priority, optimizes for hero section
  targetFPS,
  maxDpr,
  minDpr,
  onSplineApp, // NEW: Callback to expose Spline app instance for external control
  animationProgress, // NEW: 0-1 value to control animation timeline externally
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const limiterRef = useRef(null);
  const loadStartTime = useRef(null);
  const loadedSceneRef = useRef(null);
  
  // For hero, start loading immediately (no intersection observer wait)
  const shouldLoadInstantly = priority || isHero;
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(shouldLoadInstantly);
  const [deviceTier, setDeviceTier] = useState('medium');
  const [loadError, setLoadError] = useState(false);
  const [qualityProfile, setQualityProfile] = useState(() => getQualityProfile('medium', shouldLoadInstantly, { targetFPS, maxDpr, minDpr }));
  const [isDisabled, setIsDisabled] = useState(false);
  const [emergencyShutdown, setEmergencyShutdown] = useState(false);
  const [isBatterySaving, setIsBatterySaving] = useState(false); // NEW: Battery saver state
  const performanceHistory = useRef([]);
  const emergencyCheckInterval = useRef();

  // ========================================
  // BATTERY SAVER - Dispose/restore on screensaver
  // ========================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDispose = () => {
      console.log('[SplineWrapper] 🔋 Battery saver: disposing WebGL context NOW');
      setIsBatterySaving(true);
      
      // Stop frame limiter FIRST
      if (limiterRef.current) {
        console.log('[SplineWrapper] Stopping frame limiter');
        limiterRef.current.stop();
        limiterRef.current = null;
      }
      
      // Cancel any pending animation frames globally
      if (typeof window !== 'undefined') {
        // Cancel any tracked RAF IDs
        if (window.__splineRAFIds) {
          window.__splineRAFIds.forEach(id => cancelAnimationFrame(id));
          window.__splineRAFIds = [];
        }
      }
      
      // Pause/stop the app
      if (appRef.current) {
        console.log('[SplineWrapper] Disposing Spline app');
        try {
          // Stop all animations first
          if (appRef.current.stop) appRef.current.stop();
          if (appRef.current.pause) appRef.current.pause();
          
          // Force WebGL context loss on renderer
          if (appRef.current._renderer) {
            try {
              const gl = appRef.current._renderer.getContext?.();
              if (gl) {
                const ext = gl.getExtension('WEBGL_lose_context');
                if (ext) {
                  ext.loseContext();
                  console.log('[SplineWrapper] Lost renderer WebGL context');
                }
              }
            } catch (e) {}
            
            // Dispose renderer
            if (appRef.current._renderer.dispose) {
              appRef.current._renderer.dispose();
            }
          }
          
          // Dispose the app itself
          if (appRef.current.dispose) {
            appRef.current.dispose();
            console.log('[SplineWrapper] Disposed Spline app');
          }
        } catch (e) {
          console.warn('[SplineWrapper] Dispose error:', e);
        }
        appRef.current = null;
      }
      
      // Also lose context on the canvas directly
      if (canvasRef.current) {
        try {
          const gl = canvasRef.current.getContext('webgl2') || canvasRef.current.getContext('webgl');
          if (gl) {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) {
              ext.loseContext();
              console.log('[SplineWrapper] Lost canvas WebGL context');
            }
          }
        } catch (e) {}
      }
      
      console.log('[SplineWrapper] ✅ Battery saver: disposal complete');
    };

    const handleRestore = () => {
      console.log('[SplineWrapper] ⚡ Battery saver: signaling restore');
      setIsBatterySaving(false);
      // Reset loaded state to trigger re-initialization
      setIsLoaded(false);
      loadedSceneRef.current = null;
    };
    
    // Also handle the freeze event (screensaver showing)
    const handleFreeze = () => {
      console.log('[SplineWrapper] ❄️ Freeze event received');
      handleDispose();
    };
    
    // Handle unfreeze (screensaver dismissed)
    const handleUnfreeze = () => {
      console.log('[SplineWrapper] 🔥 Unfreeze event received');
      handleRestore();
    };

    window.addEventListener('bullmoney-spline-dispose', handleDispose);
    window.addEventListener('bullmoney-spline-restore', handleRestore);
    window.addEventListener('bullmoney-freeze', handleFreeze);
    window.addEventListener('bullmoney-unfreeze', handleUnfreeze);

    return () => {
      window.removeEventListener('bullmoney-spline-dispose', handleDispose);
      window.removeEventListener('bullmoney-spline-restore', handleRestore);
      window.removeEventListener('bullmoney-freeze', handleFreeze);
      window.removeEventListener('bullmoney-unfreeze', handleUnfreeze);
    };
  }, []);

  // Emergency shutdown monitor - DISABLED FOR HERO to ensure it always shows
  useEffect(() => {
    // HERO OVERRIDE: Never shutdown hero scenes to ensure they always show
    // BATTERY SAVER: Skip if in battery saving mode
    if (!isLoaded || emergencyShutdown || shouldLoadInstantly || isBatterySaving) return;
    
    const monitorPerformance = () => {
      if (!appRef.current) return;
      
      // Simple frame time check - if renderer exists
      try {
        const now = performance.now();
        performanceHistory.current.push(now);
        
        // Keep only recent history (last 60 readings ≈ 1 second)
        if (performanceHistory.current.length > 60) {
          performanceHistory.current.shift();
        }
        
        // Check for consistent poor performance after we have enough samples
        if (performanceHistory.current.length >= 30) {
          const recentFrames = performanceHistory.current.slice(-30);
          let frameTimeSum = 0;
          for (let i = 1; i < recentFrames.length; i++) {
            frameTimeSum += recentFrames[i] - recentFrames[i-1];
          }
          const avgFrameTime = frameTimeSum / (recentFrames.length - 1);
          const estimatedFPS = 1000 / avgFrameTime;
          
          // Emergency shutdown if consistently below 10 FPS
          if (estimatedFPS < 10 && !emergencyShutdown) {
            console.warn(`[SplineWrapper] Emergency shutdown triggered: ${estimatedFPS.toFixed(1)}fps`);
            setEmergencyShutdown(true);
            
            // Cleanup immediately to free resources
            if (appRef.current) {
              appRef.current.dispose();
              appRef.current = null;
            }
            if (limiterRef.current) {
              limiterRef.current.stop();
              limiterRef.current = null;
            }
          }
        }
      } catch (err) {
        // Performance monitoring failed, but don't crash the component
        console.warn('[SplineWrapper] Performance monitoring error:', err.message);
      }
    };
    
    // Monitor every ~16ms (60fps) to catch performance issues quickly
    emergencyCheckInterval.current = setInterval(monitorPerformance, 16);
    
    return () => {
      if (emergencyCheckInterval.current) {
        clearInterval(emergencyCheckInterval.current);
      }
    };
  }, [isLoaded, emergencyShutdown]);

  // Track load time for performance monitoring
  useEffect(() => {
    if (shouldLoad && !loadStartTime.current) {
      loadStartTime.current = performance.now();
    }
  }, [shouldLoad]);

  // Detect device tier on mount - HERO ALWAYS LOADS IN 50MS
  useEffect(() => {
    // MOBILE CRASH PREVENTION: Check for problematic mobile conditions
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|mobile/i.test(ua);
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const width = window.innerWidth;
    const isLowEndMobile = isMobile && (memory < 3 || cores < 4 || width < 375);
    const isInAppBrowser = ua.includes('instagram') || ua.includes('tiktok') || 
                           ua.includes('fban') || ua.includes('fbav') || 
                           ua.includes('twitter') || ua.includes('snapchat');
    
    // Check for WebGL support - but NEVER block rendering
    // Updated 2026.1.22: Always attempt to render, even without WebGL2
    let hasWebGL = true;
    let webglContext = null;
    try {
      const testCanvas = document.createElement('canvas');
      webglContext = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      hasWebGL = !!webglContext;
      // Clean up test context
      if (webglContext) {
        const ext = webglContext.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    } catch (e) {
      hasWebGL = false;
      console.warn('[SplineWrapper] WebGL check failed:', e.message);
    }
    
    // CHANGED: Log warning but DON'T disable - let it try anyway
    // Some browsers report no WebGL but can still render
    if (!hasWebGL) {
      console.warn('[SplineWrapper] WebGL not detected - attempting render anyway');
      // setIsDisabled(true); // REMOVED - never disable
      // setLoadError(true);  // REMOVED - don't set error
      // return;              // REMOVED - continue loading
    }
    
    // REMOVED: Low-end mobile in-app browser fallback check
    // All devices must attempt to render Spline
    
    // HERO OVERRIDE: Ultra-aggressive optimization for 50ms load
    if (shouldLoadInstantly) {
      // Hero loads with mobile-safe settings
      let heroTier = 'high';
      
      // MOBILE CRASH FIX: Use very conservative settings for mobile
      if (isMobile) {
        if (width < 375 || memory < 2) {
          heroTier = 'low'; // Ultra-conservative for tiny/low-mem devices
        } else if (width < 768 || memory < 4) {
          heroTier = 'low'; // CHANGED: Mobile always gets low tier to prevent crashes
        } else if (memory >= 6 && cores >= 6) {
          heroTier = 'medium'; // CHANGED: Even high-end mobile gets medium max
        }
      } else {
        // Desktop tier selection
        if (memory >= 8 && cores >= 8) {
          heroTier = 'ultra';
        } else if (memory >= 4) {
          heroTier = 'high';
        }
      }
      
      setDeviceTier(heroTier);
      setQualityProfile(getQualityProfile(heroTier, true, { 
        targetFPS: isMobile ? Math.min(targetFPS, 30) : targetFPS, // Cap mobile FPS
        maxDpr: isMobile ? Math.min(maxDpr, 1.0) : maxDpr, // Cap mobile DPR
        minDpr: isMobile ? 0.5 : minDpr 
      }));
      console.log(`🚀 HERO Spline: ${heroTier.toUpperCase()} tier ${isMobile ? '(MOBILE SAFE MODE)' : '(50MS TARGET)'}`);
      
      // Instant load trigger - no delays for hero
      setShouldLoad(true);
      return;
    }
    
    // Non-hero scenes use full tier detection
    const tier = getDeviceTier(false);
    setDeviceTier(tier);
    
    // REMOVED: Disabled tier check - always render with quality reduction
    // tier === 'disabled' now becomes 'low' with extreme quality reduction
    
    setQualityProfile(getQualityProfile(tier, false, { targetFPS, maxDpr, minDpr }));
    console.log(`🎮 Spline Quality: ${tier.toUpperCase()} tier (ALWAYS RENDERING)`);
    
    if (scene) {
      preloadScene(scene);
    }
  }, [shouldLoadInstantly, scene, targetFPS, maxDpr, minDpr]);

  // React to global FPS-driven quality changes (updates root classes)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    let lastQuality = getGlobalSplineQuality();
    let lastReduce = isReduceAnimations();

    const handleQualityChange = () => {
      const nextQuality = getGlobalSplineQuality();
      const nextReduce = isReduceAnimations();
      if (nextQuality === lastQuality && nextReduce === lastReduce) return;
      lastQuality = nextQuality;
      lastReduce = nextReduce;

      setQualityProfile(prev => {
        const nextProfile = getQualityProfile(deviceTier, shouldLoadInstantly, { targetFPS, maxDpr, minDpr });
        const unchanged = prev &&
          prev.dpr === nextProfile.dpr &&
          prev.antialias === nextProfile.antialias &&
          prev.frameRateLimit === nextProfile.frameRateLimit &&
          prev.powerPreference === nextProfile.powerPreference &&
          prev.maxTextureSize === nextProfile.maxTextureSize &&
          prev.disabled === nextProfile.disabled;
        return unchanged ? prev : nextProfile;
      });
    };

    // Use MutationObserver only - no polling interval needed (saves CPU)
    // FPS-driven class changes trigger the observer automatically
    const observer = new MutationObserver(handleQualityChange);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
    };
  }, [deviceTier, shouldLoadInstantly, targetFPS, maxDpr, minDpr]);

  // 1. LAZY TRIGGER with tier-aware root margin (SKIP for hero/priority)
  useEffect(() => {
    // Hero scenes load IMMEDIATELY - no waiting
    if (shouldLoadInstantly) {
      setShouldLoad(true);
      return;
    }
    
    // REMOVED: Skip disabled check - always load
    // Spline must render on ALL devices
    
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          setShouldLoad(true);
        }, qualityProfile.loadDelay);
        observer.disconnect();
      }
    }, { rootMargin: qualityProfile.rootMargin });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [qualityProfile.rootMargin, qualityProfile.loadDelay, shouldLoadInstantly]);

  // 2. ULTRA-FAST LOADER with quality scaling and hero optimization
  // UPDATED 2026.1.22: Always load - never skip
  useEffect(() => {
    if (!shouldLoad || !canvasRef.current) return;
    
    // REMOVED: All disabled/fallback checks
    // Spline MUST render on ALL devices - use quality reduction instead of skipping
    
    let isMounted = true;

    const init = async () => {
      const initStart = performance.now();
      
      // CRITICAL: Verify canvas still exists (may have unmounted)
      if (!canvasRef.current) {
        console.warn('[SplineWrapper] Canvas unmounted before init could run');
        return;
      }
      
      try {
        // If already loaded this scene, just apply updated quality (DPR/FPS) without reloading.
        if (appRef.current && isLoaded && loadedSceneRef.current === scene) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect && rect.width > 0 && rect.height > 0) {
            const width = Math.max(rect.width, 100);
            const height = Math.max(rect.height, 100);
            const scaledWidth = Math.floor(width * qualityProfile.dpr);
            const scaledHeight = Math.floor(height * qualityProfile.dpr);
            if (appRef.current.setSize) {
              appRef.current.setSize(scaledWidth, scaledHeight);
            }
            canvasRef.current.width = scaledWidth;
            canvasRef.current.height = scaledHeight;
          }

          // Update frame limiter based on quality.
          if (limiterRef.current) {
            limiterRef.current.stop();
            limiterRef.current = null;
          }
          if (qualityProfile.frameRateLimit < 90) {
            limiterRef.current = new FrameRateLimiter(qualityProfile.frameRateLimit);
            limiterRef.current.start(appRef.current);
          }
          return;
        }

        // Use pre-loaded runtime if available (instant for hero)
        let Application;
        if (runtimeModule) {
          Application = runtimeModule.Application;
          console.log(`⚡ Using preloaded runtime (${Math.round(performance.now() - initStart)}ms)`);
        } else {
          // Fallback: start loading if not preloaded
          if (!runtimePromise) {
            runtimePromise = import('@splinetool/runtime');
          }
          const mod = await runtimePromise;
          runtimeModule = mod;
          Application = mod.Application;
          console.log(`📦 Runtime loaded (${Math.round(performance.now() - initStart)}ms)`);
        }
        
        if (!isMounted) return;

        // Cleanup old instances to free GPU memory
        if (appRef.current) {
          appRef.current.dispose();
          appRef.current = null;
        }
        if (limiterRef.current) {
          limiterRef.current.stop();
          limiterRef.current = null;
        }

        // MOBILE CRASH FIX: Detect mobile and use conservative WebGL settings
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /iphone|ipad|ipod|android|mobile/i.test(ua);
        const isIOS = /iphone|ipad|ipod/.test(ua);
        
        // CRITICAL: Check if canvas is available before initializing
        if (!canvasRef.current) {
          console.warn('[SplineWrapper] Canvas not ready, aborting init');
          return;
        }
        
        // Initialize with mobile-safe settings to prevent crashes
        const webglOptions = {
          antialias: isMobile ? false : qualityProfile.antialias, // DISABLE on mobile
          alpha: true,
          powerPreference: isMobile ? 'default' : qualityProfile.powerPreference, // Conservative on mobile
          preserveDrawingBuffer: false,
          stencil: !isMobile && (deviceTier === 'high' || deviceTier === 'ultra'), // DISABLE on mobile
          depth: true,
          failIfMajorPerformanceCaveat: false, // Don't fail, just degrade
          desynchronized: !isIOS, // iOS doesn't support desynchronized well
        };
        
        console.log('[SplineWrapper] WebGL options:', isMobile ? 'MOBILE SAFE MODE' : 'FULL QUALITY');
        
        let app;
        try {
          // Double check canvas is still available
          if (!canvasRef.current) {
            console.warn('[SplineWrapper] Canvas became null, aborting');
            return;
          }
          app = new Application(canvasRef.current, webglOptions);
        } catch (initError) {
          console.error('[SplineWrapper] WebGL init failed, trying fallback:', initError.message);
          // Try with minimal settings
          try {
            // Check canvas again before fallback attempt
            if (!canvasRef.current) {
              console.warn('[SplineWrapper] Canvas null during fallback, aborting');
              setLoadError(true);
              return;
            }
            app = new Application(canvasRef.current, {
              antialias: false,
              alpha: true,
              powerPreference: 'default',
              preserveDrawingBuffer: false,
              stencil: false,
              depth: true,
            });
          } catch (fallbackError) {
            // UPDATED 2026.1.22: Even if WebGL fails, try one more time with WebGL1 only
            console.error('[SplineWrapper] Fallback init also failed, trying WebGL1:', fallbackError.message);
            try {
              if (!canvasRef.current) {
                console.warn('[SplineWrapper] Canvas null during WebGL1 attempt');
                return;
              }
              // Force WebGL1 context with absolute minimal settings
              const gl1 = canvasRef.current.getContext('webgl', { 
                antialias: false, 
                alpha: true, 
                depth: true,
                powerPreference: 'low-power',
                failIfMajorPerformanceCaveat: false 
              });
              if (gl1) {
                // Try to create app with this context
                app = new Application(canvasRef.current, {
                  antialias: false,
                  alpha: true,
                  powerPreference: 'low-power',
                  stencil: false,
                  depth: true,
                });
                console.log('[SplineWrapper] WebGL1 fallback succeeded!');
              } else {
                throw new Error('WebGL1 context creation failed');
              }
            } catch (webgl1Error) {
              // Only now do we give up, but still don't disable future attempts
              console.error('[SplineWrapper] All WebGL attempts failed:', webgl1Error.message);
              setLoadError(true);
              // CHANGED: Don't set isDisabled - allow retry on next mount
              // setIsDisabled(true); // REMOVED
              if (onError) onError(webgl1Error);
              return;
            }
          }
        }

        appRef.current = app;

        // Load the scene with timeout for slow connections
        const loadPromise = app.load(scene);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Scene load timeout')), deviceTier === 'low' ? 30000 : 20000)
        );
        
        try {
          await Promise.race([loadPromise, timeoutPromise]);
        } catch (loadErr) {
          // Handle scene load errors gracefully
          console.warn('[SplineWrapper] Scene load issue:', loadErr?.message || loadErr);
          // If it's just a position error during init, continue - scene may still work
          if (loadErr?.message?.includes('position') || loadErr?.message?.includes('undefined')) {
            console.log('[SplineWrapper] Continuing despite init warning...');
          } else {
            throw loadErr;
          }
        }

        if (!isMounted) return;

        // MOBILE/IN-APP FIX: Get stable container dimensions - wait for layout if needed
        // Use visualViewport for accurate mobile sizing (handles in-app browser chrome)
        const getStableRect = () => {
          const rect = containerRef.current?.getBoundingClientRect();
          
          // Use visualViewport on mobile for accurate sizing (handles browser chrome, keyboard, etc.)
          const viewportWidth = window.visualViewport?.width || window.innerWidth || 960;
          const viewportHeight = window.visualViewport?.height || window.innerHeight || 640;
          
          // Check if we're in an in-app browser (smaller viewport due to app chrome)
          const isInAppBrowser = /instagram|fban|fbav|twitter|tiktok|snapchat|linkedin/i.test(navigator.userAgent.toLowerCase());
          
          // If container not ready, use viewport with conservative defaults
          if (!rect || rect.width === 0 || rect.height === 0) {
            const parentRect = containerRef.current?.parentElement?.getBoundingClientRect?.();
            // MOBILE FIX: Use actual viewport, not window.innerWidth which can be wrong in in-app browsers
            const fallbackWidth = parentRect?.width || viewportWidth;
            const fallbackHeight = parentRect?.height || viewportHeight;
            return {
              width: Math.max(240, Math.min(fallbackWidth, viewportWidth)),
              height: Math.max(200, Math.min(fallbackHeight, viewportHeight)),
            };
          }
          
          // MOBILE/IN-APP FIX: Clamp to actual visual viewport, not window dimensions
          // In-app browsers often report wrong window.innerWidth/Height
          const maxWidth = isInAppBrowser ? viewportWidth : Math.min(viewportWidth, window.innerWidth * 0.98);
          const maxHeight = isInAppBrowser ? viewportHeight : Math.min(viewportHeight, window.innerHeight * 0.98);
          
          return {
            width: Math.max(200, Math.min(rect.width, maxWidth)),
            height: Math.max(200, Math.min(rect.height, maxHeight)),
          };
        };
        
        // MOBILE FIX: Wait for layout to stabilize before measuring
        // This prevents wrong sizing on initial load in mobile/in-app browsers
        const waitForStableLayout = () => new Promise(resolve => {
          // Double RAF ensures layout is stable
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
        
        await waitForStableLayout();
        
        // Re-check canvas is still valid after waiting
        if (!canvasRef.current || !containerRef.current) {
          console.warn('[SplineWrapper] Canvas/container unmounted during layout wait');
          return;
        }
        
        const rect = getStableRect();
        const scaledWidth = Math.floor(rect.width * qualityProfile.dpr);
        const scaledHeight = Math.floor(rect.height * qualityProfile.dpr);
        
        if (app.setSize) {
          app.setSize(scaledWidth, scaledHeight);
        }
        
        // Apply canvas size - use 100% CSS to fill container properly
        canvasRef.current.width = scaledWidth;
        canvasRef.current.height = scaledHeight;
        // MOBILE FIX: Use 100% CSS sizing to properly fill container on all devices
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = '100%';
        canvasRef.current.style.maxWidth = '100%';
        canvasRef.current.style.maxHeight = '100%';
        canvasRef.current.style.objectFit = 'contain';

        // MOBILE CRASH FIX: Detect mobile for safe mode
        const uaCheck = navigator.userAgent.toLowerCase();
        const isMobileDevice = /iphone|ipad|ipod|android|mobile/i.test(uaCheck);
        
        // MOBILE CRASH FIX: Always limit FPS on mobile to prevent overheating/crashes
        const mobileFpsLimit = isMobileDevice ? Math.min(qualityProfile.frameRateLimit, 30) : qualityProfile.frameRateLimit;
        
        // Apply frame rate limiting (always on mobile, conditional on desktop)
        if (isMobileDevice || mobileFpsLimit < 90) {
          limiterRef.current = new FrameRateLimiter(mobileFpsLimit);
          limiterRef.current.start(app);
          console.log(`⚡ Frame rate limited to ${mobileFpsLimit}fps for ${deviceTier} tier ${isMobileDevice ? '(MOBILE SAFE)' : ''}`);
        } else {
          console.log(`🚀 Running at native ${qualityProfile.frameRateLimit}fps (${deviceTier} tier)`);
        }
        
        // MOBILE CRASH FIX: Set up memory pressure monitoring
        if (isMobileDevice) {
          const checkMemoryPressure = () => {
            try {
              // Check if we should reduce quality due to memory pressure
              if ('memory' in performance) {
                const memInfo = performance.memory;
                if (memInfo && memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.85) {
                  console.warn('[SplineWrapper] High memory pressure detected, reducing quality');
                  if (app && app.setSize) {
                    const currentWidth = canvasRef.current?.width || 320;
                    const currentHeight = canvasRef.current?.height || 240;
                    app.setSize(Math.floor(currentWidth * 0.7), Math.floor(currentHeight * 0.7));
                  }
                }
              }
            } catch (e) { /* ignore memory check errors */ }
          };
          // Check memory every 5 seconds on mobile
          const memoryCheckInterval = setInterval(checkMemoryPressure, 5000);
          // Store interval for cleanup
          window._splineMemoryIntervals = window._splineMemoryIntervals || [];
          window._splineMemoryIntervals.push(memoryCheckInterval);
        }

        if (isMounted) {
          const totalLoadTime = loadStartTime.current ? performance.now() - loadStartTime.current : 0;
          console.log(`✅ Spline loaded in ${Math.round(totalLoadTime)}ms ${shouldLoadInstantly ? '(HERO - TARGET: 200ms)' : ''}`);
          
          // Log warning if hero load exceeds 200ms target
          if (shouldLoadInstantly && totalLoadTime > 200) {
            console.warn(`⚠️ Hero load exceeded 200ms target: ${Math.round(totalLoadTime)}ms`);
          }
          
          setIsLoaded(true);
          loadedSceneRef.current = scene;
          setLoadError(false);
          if (onLoad) onLoad();
          
          // NEW: Expose Spline app instance for external animation control
          if (onSplineApp && app) {
            onSplineApp(app);
          }
          
          // MOBILE/IN-APP SIZE CORRECTION: Re-measure and fix size after load completes
          // This catches cases where initial measurement was wrong due to layout shifts
          setTimeout(() => {
            if (!canvasRef.current || !containerRef.current || !appRef.current) return;
            
            const viewportWidth = window.visualViewport?.width || window.innerWidth;
            const viewportHeight = window.visualViewport?.height || window.innerHeight;
            const isInApp = /instagram|fban|fbav|twitter|tiktok|snapchat|linkedin/i.test(navigator.userAgent.toLowerCase());
            
            const finalRect = containerRef.current.getBoundingClientRect();
            const maxW = isInApp ? viewportWidth : Math.min(viewportWidth, window.innerWidth * 0.98);
            const maxH = isInApp ? viewportHeight : Math.min(viewportHeight, window.innerHeight * 0.98);
            
            const correctWidth = Math.max(100, Math.min(finalRect.width, maxW));
            const correctHeight = Math.max(100, Math.min(finalRect.height, maxH));
            const scaledW = Math.floor(correctWidth * qualityProfile.dpr);
            const scaledH = Math.floor(correctHeight * qualityProfile.dpr);
            
            // Only apply correction if dimensions changed significantly
            const currentW = canvasRef.current.width;
            const currentH = canvasRef.current.height;
            if (Math.abs(scaledW - currentW) > 10 || Math.abs(scaledH - currentH) > 10) {
              console.log(`🔧 Size correction applied: ${currentW}x${currentH} → ${scaledW}x${scaledH}`);
              canvasRef.current.width = scaledW;
              canvasRef.current.height = scaledH;
              if (appRef.current.setSize) {
                appRef.current.setSize(scaledW, scaledH);
              }
            }
          }, 100); // Small delay to ensure DOM has settled
        }

      } catch (err) {
        // UPDATED 2026.1.22: Don't give up on first error - retry with reduced settings
        console.warn("Spline load issue:", err.message);
        if (isMounted) {
          // If we haven't retried yet, try one more time with minimal settings
          if (!window._splineRetryCount) {
            window._splineRetryCount = 0;
          }
          window._splineRetryCount++;
          
          if (window._splineRetryCount <= 2) {
            console.log(`[SplineWrapper] Retry attempt ${window._splineRetryCount}/2 with reduced quality`);
            // Reduce quality profile for retry
            setQualityProfile(prev => ({
              ...prev,
              dpr: Math.max(0.5, prev.dpr * 0.5),
              frameRateLimit: Math.min(prev.frameRateLimit, 20),
              antialias: false,
              maxTextureSize: 256,
            }));
            // Re-trigger load on next frame
            setTimeout(() => {
              setIsLoaded(false);
              setShouldLoad(false);
              requestAnimationFrame(() => setShouldLoad(true));
            }, 100);
          } else {
            // After 2 retries, accept the error but keep component visible
            // The loadError state will show a gradient placeholder but won't remove the canvas
            setLoadError(true);
            if (onError) onError(err);
          }
        }
      }
    };

    // Hero scenes: load IMMEDIATELY, no delays
    // Others: use requestAnimationFrame for smooth loading
    if (shouldLoadInstantly) {
      // Micro-task for absolute minimum delay
      queueMicrotask(init);
    } else if (deviceTier === 'low' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => init(), { timeout: 2000 });
    } else {
      requestAnimationFrame(init);
    }

    return () => {
      isMounted = false;
      if (limiterRef.current) {
        limiterRef.current.stop();
        limiterRef.current = null;
      }
      if (appRef.current) {
        appRef.current.dispose();
        appRef.current = null;
      }
    };
  }, [shouldLoad, scene, deviceTier, qualityProfile, onLoad, onError]);

  // 3. RESIZE HANDLER with debouncing for low-end - FIXED for stable window resizing
  useEffect(() => {
    if (!appRef.current || !containerRef.current || !isLoaded) return;

    let resizeTimeout = null;
    let lastWidth = 0;
    let lastHeight = 0;
    const debounceMs = deviceTier === 'low' ? 300 : deviceTier === 'medium' ? 150 : 50;

    const handleResize = (entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!appRef.current || !canvasRef.current || !containerRef.current) return;
        
        // MOBILE/IN-APP FIX: Use visualViewport for accurate mobile sizing
        const viewportWidth = window.visualViewport?.width || window.innerWidth;
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const isInAppBrowser = /instagram|fban|fbav|twitter|tiktok|snapchat|linkedin/i.test(navigator.userAgent.toLowerCase());
        
        // Get fresh dimensions from container, constrained to visual viewport
        const rect = containerRef.current.getBoundingClientRect();
        const maxWidth = isInAppBrowser ? viewportWidth : Math.min(viewportWidth, window.innerWidth * 0.98);
        const maxHeight = isInAppBrowser ? viewportHeight : Math.min(viewportHeight, window.innerHeight * 0.98);
        
        const width = Math.max(100, Math.min(rect.width, maxWidth));
        const height = Math.max(100, Math.min(rect.height, maxHeight));
        
        // Only resize if dimensions actually changed significantly (> 2px)
        if (Math.abs(width - lastWidth) < 2 && Math.abs(height - lastHeight) < 2) {
          return;
        }
        
        lastWidth = width;
        lastHeight = height;
        
        const scaledWidth = Math.floor(width * qualityProfile.dpr);
        const scaledHeight = Math.floor(height * qualityProfile.dpr);
        
        // Update canvas intrinsic size
        canvasRef.current.width = scaledWidth;
        canvasRef.current.height = scaledHeight;
        
        // MOBILE FIX: Use 100% CSS sizing to properly fill container
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = '100%';
        canvasRef.current.style.maxWidth = '100%';
        canvasRef.current.style.maxHeight = '100%';
        
        // Update Spline app size
        if (appRef.current.setSize) {
          appRef.current.setSize(scaledWidth, scaledHeight);
        }
      }, debounceMs);
    };

    // Use ResizeObserver for container-based resize
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    // Trigger an immediate measurement on mount to avoid first-frame blowup.
    handleResize([{ contentRect: containerRef.current.getBoundingClientRect() }]);

    // Desktop heartbeat removed - ResizeObserver handles this efficiently
    // The 1s interval was causing unnecessary work on every Spline instance

    // Also listen to window resize for orientation changes and browser resize
    const windowResizeHandler = () => {
      handleResize([{ contentRect: containerRef.current?.getBoundingClientRect() }]);
    };
    window.addEventListener('resize', windowResizeHandler);
    window.addEventListener('orientationchange', windowResizeHandler);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', windowResizeHandler);
      window.visualViewport.addEventListener('scroll', windowResizeHandler);
    }

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', windowResizeHandler);
      window.removeEventListener('orientationchange', windowResizeHandler);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', windowResizeHandler);
        window.visualViewport.removeEventListener('scroll', windowResizeHandler);
      }
    };
  }, [isLoaded, deviceTier, qualityProfile.dpr]);

  // 4. VISIBILITY HANDLING - Pause when off-screen to save resources
  // ENHANCED: Also pauses when container is not in viewport
  useEffect(() => {
    if (!appRef.current || !isLoaded) return;

    let isPaused = false;

    const pauseRendering = () => {
      if (isPaused) return;
      isPaused = true;
      if (limiterRef.current) {
        limiterRef.current.stop();
      }
      // Also try to pause the Spline app if it has a pause method
      if (appRef.current?.pause) {
        try { appRef.current.pause(); } catch {}
      }
    };

    const resumeRendering = () => {
      if (!isPaused) return;
      isPaused = false;
      if (limiterRef.current) {
        limiterRef.current.start(appRef.current);
      }
      // Resume if possible
      if (appRef.current?.play) {
        try { appRef.current.play(); } catch {}
      }
    };

    // Tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        pauseRendering();
      } else {
        resumeRendering();
      }
    };

    // Container visibility via IntersectionObserver
    let containerObserver = null;
    if (containerRef.current) {
      containerObserver = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            pauseRendering();
          } else if (!document.hidden) {
            resumeRendering();
          }
        },
        { rootMargin: '100px' } // Small margin to avoid flicker at edges
      );
      containerObserver.observe(containerRef.current);
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (containerObserver) {
        containerObserver.disconnect();
      }
    };
  }, [isLoaded]);

  // Animation progress prop - for future use if Spline exposes timeline control
  // Currently we use CSS transforms in SplineWithAudio for visual rotation control
  useEffect(() => {
    if (!appRef.current || animationProgress === undefined) return;
    
    // Try setting Spline variables that might affect the scene
    // This allows Spline scenes with bound variables to respond to external control
    try {
      const app = appRef.current;
      const normalizedProgress = animationProgress / 100;
      
      // Set variables that scene might use for control
      if (app.setVariable) {
        app.setVariable('rotation', (normalizedProgress - 0.5) * 360);
        app.setVariable('progress', normalizedProgress);
        app.setVariable('dragX', (normalizedProgress - 0.5) * 200);
      }
    } catch (e) {
      // Variables not bound in this scene
    }
  }, [animationProgress]);

  // Detect if on mobile for touch handling
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  const isInAppBrowser = typeof window !== 'undefined' && /instagram|fban|fbav|twitter|tiktok|snapchat|linkedin/i.test(navigator.userAgent.toLowerCase());
  const [isInteracting, setIsInteracting] = useState(false);

  // UPDATED 2026: Enable pointer events on mobile for full interaction
  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setTimeout(() => setIsInteracting(false), 300);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full isolate overflow-hidden ${className || ''}`}
      style={{ 
        contain: 'layout style', // Less strict for hero
        minHeight: shouldLoadInstantly ? '400px' : '200px', // HERO: Larger min height
        minWidth: '200px',
        // MOBILE/IN-APP FIX: Use viewport units for better sizing in in-app browsers
        maxWidth: '100vw',
        maxHeight: '100dvh', // Dynamic viewport height for in-app browsers
        width: '100%',
        height: '100%',
        position: 'relative',
        touchAction: 'manipulation', // UPDATED: Allow both scroll and interaction
        pointerEvents: 'auto', // Always interactive
        WebkitOverflowScrolling: 'touch', // Smooth iOS scrolling
        // IN-APP FIX: Remove any aspect ratio constraints
        aspectRatio: 'unset',
      }}
      data-allow-scroll
      data-hero-spline={shouldLoadInstantly ? 'true' : 'false'}
      data-in-app={isInAppBrowser ? 'true' : 'false'}
      data-interactive="true"
    >
      {/* PLACEHOLDER with gradient fallback - FASTER transition for hero */}
      <div 
        className={`absolute inset-0 bg-cover bg-center ease-out ${isLoaded && !emergencyShutdown && !isBatterySaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          backgroundImage: placeholder ? `url(${placeholder})` : 'none',
          backgroundColor: placeholder ? 'rgba(0,0,0,0.1)' : 'transparent',
          transition: shouldLoadInstantly ? 'opacity 150ms' : 'opacity 700ms',
        }}
      >
        {/* Loading indicator for non-placeholder - skip for hero (instant load) */}
        {!placeholder && !isLoaded && !loadError && !shouldLoadInstantly && !emergencyShutdown && !isBatterySaving && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
        
        {/* Emergency shutdown indicator */}
        {emergencyShutdown && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-black/40 flex items-center justify-center">
            <div className="text-center text-white/60">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-xs">Performance Mode</div>
            </div>
          </div>
        )}
        
        {/* Battery saver indicator - shown when screensaver disposed Spline */}
        {isBatterySaving && !emergencyShutdown && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-black/30 flex items-center justify-center">
            <div className="text-center text-white/40">
              <div className="text-2xl mb-2">🔋</div>
              <div className="text-xs">Battery Saver</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Error fallback - still show gradient */}
      {loadError && !emergencyShutdown && !isBatterySaving && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-black/40" />
      )}
      
      {/* 3D CANVAS - ALWAYS INTERACTIVE on mobile and desktop */}
      {/* Ultra-fast opacity transition for hero mode */}
      {/* BATTERY SAVER: Don't render canvas when in battery saving mode */}
      {!emergencyShutdown && !isBatterySaving && (
        <canvas
          ref={canvasRef}
          className={`block outline-none ease-out ${isLoaded && !loadError ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            touchAction: 'manipulation', // UPDATED: Allow both scroll and interaction
            pointerEvents: 'auto', // ALWAYS interactive
            transition: shouldLoadInstantly ? 'opacity 50ms' : 'opacity 700ms',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        />
      )}
      
      {/* Dev indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && isLoaded && !emergencyShutdown && !isBatterySaving && (
        <div className="absolute bottom-2 left-2 text-[10px] text-white/40 bg-black/20 px-1 rounded">
          {deviceTier} | {qualityProfile.frameRateLimit}fps | {qualityProfile.dpr}x {shouldLoadInstantly ? '| HERO' : ''}
        </div>
      )}
      
      {/* Emergency shutdown indicator in dev */}
      {process.env.NODE_ENV === 'development' && emergencyShutdown && (
        <div className="absolute bottom-2 left-2 text-[10px] text-red-400 bg-red-900/20 px-1 rounded">
          EMERGENCY SHUTDOWN
        </div>
      )}
      
      {/* Battery saver indicator in dev */}
      {process.env.NODE_ENV === 'development' && isBatterySaving && (
        <div className="absolute bottom-2 left-2 text-[10px] text-green-400 bg-green-900/20 px-1 rounded">
          🔋 BATTERY SAVER
        </div>
      )}
    </div>
  );
}
