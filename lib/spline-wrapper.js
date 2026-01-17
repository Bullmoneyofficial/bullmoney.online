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

// IMMEDIATELY preload Spline runtime - no checks, no delays
if (typeof window !== 'undefined') {
  // LCP FIX: Start runtime import immediately on module load
  runtimePromise = import('@splinetool/runtime').then(mod => {
    runtimeModule = mod;
    console.log('🚀 Spline runtime preloaded!');
    return mod;
  }).catch(err => {
    console.warn('⚠️ Spline runtime preload failed:', err.message);
    return null;
  });
  
  // LCP FIX: Preload hero scene immediately for desktop (don't wait for component mount)
  if (!heroScenePreloaded && window.innerWidth >= 768) {
    heroScenePreloaded = true;
    // Use link preload for fastest possible scene fetch
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = '/scene1.splinecode';
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    console.log('⚡ Hero scene preload initiated');
    
    // Also start fetching immediately for cache warmup
    fetch('/scene1.splinecode', { 
      method: 'GET', 
      mode: 'cors',
      cache: 'force-cache'
    }).then(response => {
      if (response.ok && 'caches' in window) {
        caches.open('bullmoney-spline-hero-v3').then(cache => {
          cache.put('/scene1.splinecode', response.clone());
        });
      }
    }).catch(() => {});
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
  
  // If forceLoad is true (hero scene), return tier based only on device specs
  // Hero MUST load on all devices - no browser blocking
  if (forceLoad) {
    const memory = navigator.deviceMemory || 4;
    const isMobile = window.innerWidth < 768;
    if (isMobile && memory < 3) return 'low';
    if (isMobile) return 'medium';
    return 'high';
  }
  
  // For non-hero scenes, check browser and device capabilities
  const ua = navigator.userAgent.toLowerCase();
  
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
    if (!isMobile && gpuTier === 'high' && memory >= 16 && cores >= 8) return 'ultra';
    if (gpuTier === 'high' && memory >= 8) return 'high';
    if (gpuTier === 'medium' || (memory >= 4 && cores >= 4)) return 'medium';
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const reduceAnimations = isReduceAnimations();
  const splineQuality = getGlobalSplineQuality();
  const gpuTier = info?.performance?.gpu?.tier || 'medium';

  const minDpr = typeof overrides.minDpr === 'number' ? overrides.minDpr : 0.75;
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
      // Emergency mode: absolute minimum quality
      nextDpr = Math.max(minDpr, Math.min(nextDpr * 0.5, 0.75));
      nextFps = Math.min(nextFps, 30);
      nextAntialias = false;
      nextTextureSize = Math.min(nextTextureSize, 512);
    } else if (isFpsLow) {
      // Low FPS: significant reduction
      nextDpr = Math.max(minDpr, Math.min(nextDpr * 0.6, 0.85));
      nextFps = Math.min(nextFps, 45);
      nextAntialias = false;
      nextTextureSize = Math.min(nextTextureSize, 1024);
    } else if (isFpsMedium) {
      // Medium FPS: moderate reduction
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

    // Also clamp to overrides.
    nextDpr = clamp(nextDpr, minDpr, maxDpr);

    return {
      ...profile,
      dpr: nextDpr,
      frameRateLimit: nextFps,
      antialias: nextAntialias,
      maxTextureSize: nextTextureSize,
    };
  };
  
  // Disabled tier - no rendering, show fallback immediately
  if (tier === 'disabled') {
    return {
      dpr: 1,
      antialias: false,
      powerPreference: 'default',
      maxTextureSize: 0,
      frameRateLimit: 0,
      loadDelay: 0,
      rootMargin: '0px',
      instant: false,
      disabled: true, // Flag to skip rendering entirely
    };
  }
  
  // Hero scenes get maximum priority - instant load
  if (isHero) {
    const baseCap = isMobile ? 1.2 : 1.6;
    const gpuCap = gpuTier === 'low' ? 1.0 : gpuTier === 'high' ? baseCap : Math.min(baseCap, 1.35);
    const qualityScale = splineQuality === 'low' ? 0.7 : splineQuality === 'medium' ? 0.85 : 1;
    const dpr = clamp(Math.min(rawDpr, gpuCap, maxDpr) * qualityScale, minDpr, gpuCap);
    const baseFrameLimit = Math.min(
      nativeHz,
      typeof overrides.targetFPS === 'number' ? overrides.targetFPS : (isMobile ? 60 : 90)
    );
    const frameRateLimit =
      splineQuality === 'low'
        ? Math.min(baseFrameLimit, 45)
        : splineQuality === 'medium'
          ? Math.min(baseFrameLimit, 60)
          : baseFrameLimit;
    return {
      dpr: reduceAnimations ? Math.min(dpr, 1.0) : dpr,
      antialias: splineQuality !== 'low' && !isMobile, // Disable when FPS is struggling or on mobile
      powerPreference: splineQuality === 'high' && !isMobile ? 'high-performance' : 'default',
      maxTextureSize: splineQuality === 'low'
        ? (isMobile ? 1024 : 1536)
        : splineQuality === 'medium'
          ? (isMobile ? 1536 : 3072)
          : (isMobile ? 2048 : 4096),
      frameRateLimit,
      loadDelay: 0,
      rootMargin: '9999px', // Always in view
      instant: true,
      disabled: false,
    };
  }
  
  const profiles = {
    ultra: {
      // Ultra: keep crisp but avoid overdraw; clamp DPR hard.
      dpr: clamp(Math.min(rawDpr, isMobile ? 1.25 : 1.75, maxDpr), minDpr, isMobile ? 1.25 : 1.75),
      antialias: !isMobile,
      powerPreference: 'high-performance',
      maxTextureSize: 4096,
      frameRateLimit: Math.min(nativeHz, (typeof overrides.targetFPS === 'number' ? overrides.targetFPS : nativeHz)),
      loadDelay: 0,
      rootMargin: '1600px',
      instant: false,
      disabled: false,
    },
    high: {
      // High: prioritize stable FPS; slightly reduced DPR.
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
      // Medium: keep resolution close to 1x for fill-rate wins.
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

  // Track load time for performance monitoring
  useEffect(() => {
    if (shouldLoad && !loadStartTime.current) {
      loadStartTime.current = performance.now();
    }
  }, [shouldLoad]);

  // Detect device tier on mount - HERO ALWAYS LOADS
  useEffect(() => {
    // For hero scenes, skip all checks and use optimized tier
    if (shouldLoadInstantly) {
      // Hero ALWAYS loads - determine best quality without blocking
      const isMobile = window.innerWidth < 768;
      const memory = navigator.deviceMemory || 4;
      const heroTier = (isMobile && memory < 3) ? 'low' : (isMobile ? 'medium' : 'high');
      setDeviceTier(heroTier);
      setQualityProfile(getQualityProfile(heroTier, true, { targetFPS, maxDpr, minDpr }));
      console.log(`🎮 HERO Spline: ${heroTier.toUpperCase()} tier (INSTANT LOAD)`);
      return;
    }
    
    // Non-hero scenes use full tier detection
    const tier = getDeviceTier(false);
    setDeviceTier(tier);
    
    if (tier === 'disabled') {
      setIsDisabled(true);
      setLoadError(true);
      console.log('🔒 3D disabled for this browser - showing fallback');
      return;
    }
    
    setQualityProfile(getQualityProfile(tier, false, { targetFPS, maxDpr, minDpr }));
    console.log(`🎮 Spline Quality: ${tier.toUpperCase()} tier`);
    
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

  // 1. LAZY TRIGGER with tier-aware root margin (SKIP for hero/priority or disabled)
  useEffect(() => {
    // Hero scenes load IMMEDIATELY - no waiting
    if (shouldLoadInstantly) {
      setShouldLoad(true);
      return;
    }
    
    // Skip for disabled browsers (non-hero only)
    if (isDisabled || qualityProfile.disabled) {
      return;
    }
    
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
  }, [qualityProfile.rootMargin, qualityProfile.loadDelay, shouldLoadInstantly, isDisabled, qualityProfile.disabled]);

  // 2. ULTRA-FAST LOADER with quality scaling and hero optimization
  useEffect(() => {
    if (!shouldLoad || !canvasRef.current) return;
    
    // For hero, NEVER skip - always try to load
    // For non-hero, skip if browser is disabled
    if (!shouldLoadInstantly && (isDisabled || qualityProfile.disabled)) {
      console.log('🔒 Spline loading skipped - browser cannot handle 3D');
      return;
    }
    let isMounted = true;

    const init = async () => {
      const initStart = performance.now();
      
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

        // Initialize with tier-specific settings
        const app = new Application(canvasRef.current, {
          antialias: qualityProfile.antialias,
          alpha: true,
          powerPreference: qualityProfile.powerPreference,
          preserveDrawingBuffer: false,
          stencil: deviceTier === 'high' || deviceTier === 'ultra',
          depth: true,
        });

        appRef.current = app;

        // Load the scene with timeout for slow connections
        const loadPromise = app.load(scene);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Scene load timeout')), deviceTier === 'low' ? 30000 : 20000)
        );
        
        await Promise.race([loadPromise, timeoutPromise]);

        if (!isMounted) return;

        // Get stable container dimensions - wait for layout if needed
        const getStableRect = () => {
          const rect = containerRef.current?.getBoundingClientRect();
          // If container not ready, use parent/viewport with conservative defaults to avoid blow-up on desktop/Mac.
          if (!rect || rect.width === 0 || rect.height === 0) {
            const parentRect = containerRef.current?.parentElement?.getBoundingClientRect?.();
            const fallbackWidth = parentRect?.width || window.innerWidth || 960;
            const fallbackHeight = parentRect?.height || window.innerHeight || 640;
            return {
              width: Math.max(240, fallbackWidth),
              height: Math.max(200, fallbackHeight),
            };
          }
          // Use actual container dimensions to avoid letterboxing, but cap close to viewport to prevent blow-up on large desktop monitors.
          return {
            width: Math.max(200, Math.min(rect.width, window.innerWidth * 0.98)),
            height: Math.max(200, Math.min(rect.height, window.innerHeight * 0.98)),
          };
        };
        
        const rect = getStableRect();
        const scaledWidth = Math.floor(rect.width * qualityProfile.dpr);
        const scaledHeight = Math.floor(rect.height * qualityProfile.dpr);
        
        if (app.setSize) {
          app.setSize(scaledWidth, scaledHeight);
        }
        
        // Apply canvas size directly for proper resolution - use percentage for CSS
        canvasRef.current.width = scaledWidth;
        canvasRef.current.height = scaledHeight;
        canvasRef.current.style.width = `${rect.width}px`;
        canvasRef.current.style.height = `${rect.height}px`;
        canvasRef.current.style.maxWidth = '100%';
        canvasRef.current.style.maxHeight = '100%';

        // Apply frame rate limiting for low/medium tier (skip for 90Hz+ to enable smooth ProMotion)
        if (qualityProfile.frameRateLimit < 90) {
          limiterRef.current = new FrameRateLimiter(qualityProfile.frameRateLimit);
          limiterRef.current.start(app);
          console.log(`⚡ Frame rate limited to ${qualityProfile.frameRateLimit}fps for ${deviceTier} tier`);
        } else {
          console.log(`🚀 Running at native ${qualityProfile.frameRateLimit}fps (${deviceTier} tier)`);
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
        }

      } catch (err) {
        console.warn("Spline load issue:", err.message);
        if (isMounted) {
          setLoadError(true);
          if (onError) onError(err);
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
        
        // Get fresh dimensions from container, constrained to viewport
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.max(100, Math.min(rect.width, window.innerWidth * 0.98));
        const height = Math.max(100, Math.min(rect.height, window.innerHeight * 0.98));
        
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
        
        // Update canvas display size (CSS) - use percentage to prevent blowup
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
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

  // Detect if on mobile for touch handling
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  const [isInteracting, setIsInteracting] = useState(false);

  // On mobile, we ALWAYS disable pointer events to allow scrolling
  // Users can still view the 3D scene, but cannot interact with it
  const handleInteractionStart = useCallback(() => {
    // Disabled on mobile to prioritize scrolling
    if (!isMobile) {
      setIsInteracting(true);
    }
  }, [isMobile]);

  const handleInteractionEnd = useCallback(() => {
    setTimeout(() => setIsInteracting(false), 300);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full isolate overflow-hidden ${className || ''}`}
      style={{ 
        contain: 'strict',
        minHeight: '200px',
        minWidth: '200px',
        maxWidth: '100%',
        maxHeight: '100%',
        position: 'relative',
        touchAction: 'pan-y', // Always allow vertical scrolling on container
        pointerEvents: isMobile ? 'none' : 'auto', // Disable on mobile
      }}
      data-allow-scroll
    >
      {/* PLACEHOLDER with gradient fallback - FASTER transition for hero */}
      <div 
        className={`absolute inset-0 bg-cover bg-center ease-out ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          backgroundImage: placeholder ? `url(${placeholder})` : 'none',
          backgroundColor: placeholder ? 'rgba(0,0,0,0.1)' : 'transparent',
          transition: shouldLoadInstantly ? 'opacity 150ms' : 'opacity 700ms',
        }}
      >
        {/* Loading indicator for non-placeholder - skip for hero (instant load) */}
        {!placeholder && !isLoaded && !loadError && !shouldLoadInstantly && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* Error fallback - still show gradient */}
      {loadError && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-black/40" />
      )}
      
      {/* 3D CANVAS - Mobile: pointer-events-none to allow scrolling */}
      {/* FASTER opacity transition for hero mode */}
      <canvas
        ref={canvasRef}
        className={`block outline-none ease-out ${isLoaded && !loadError ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          touchAction: 'pan-y',
          pointerEvents: isMobile ? 'none' : 'auto',
          transition: shouldLoadInstantly ? 'opacity 100ms' : 'opacity 700ms',
        }}
      />
      
      {/* Dev indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && isLoaded && (
        <div className="absolute bottom-2 left-2 text-[10px] text-white/40 bg-black/20 px-1 rounded">
          {deviceTier} | {qualityProfile.frameRateLimit}fps | {qualityProfile.dpr}x {shouldLoadInstantly ? '| HERO' : ''}
        </div>
      )}
    </div>
  );
}
