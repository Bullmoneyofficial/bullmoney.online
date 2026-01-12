"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// ULTRA-FAST HERO LOADING - Preload runtime at module import time
// ============================================================================
let runtimePromise = null;
let runtimeModule = null;
let sceneCache = new Map(); // In-memory scene cache for instant re-renders

// IMMEDIATELY start loading the runtime when this module is imported
if (typeof window !== 'undefined') {
  runtimePromise = import('@splinetool/runtime').then(mod => {
    runtimeModule = mod;
    console.log('🚀 Spline runtime preloaded!');
    return mod;
  });
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
const getDeviceTier = () => {
  if (typeof window === 'undefined') return 'high';
  
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

// ============================================================================
// QUALITY PROFILES - Optimized for 120Hz across all device sizes
// ============================================================================
const getQualityProfile = (tier, isHero = false) => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const nativeHz = getNativeRefreshRate();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Hero scenes get maximum priority - instant load
  if (isHero) {
    return {
      dpr: isMobile ? Math.min(dpr, 1.5) : Math.min(dpr, 2),
      antialias: !isMobile, // Disable on mobile for speed
      powerPreference: 'high-performance',
      maxTextureSize: isMobile ? 2048 : 4096,
      frameRateLimit: nativeHz,
      loadDelay: 0,
      rootMargin: '9999px', // Always in view
      instant: true,
    };
  }
  
  const profiles = {
    high: {
      dpr: isMobile ? Math.min(dpr, 2) : Math.min(dpr, 2.5),
      antialias: true,
      powerPreference: 'high-performance',
      maxTextureSize: 4096,
      frameRateLimit: nativeHz,
      loadDelay: 0,
      rootMargin: '800px',
      instant: false,
    },
    medium: {
      dpr: Math.min(dpr, 1.5),
      antialias: true,
      powerPreference: 'high-performance',
      maxTextureSize: 2048,
      frameRateLimit: Math.min(nativeHz, 90),
      loadDelay: 0,
      rootMargin: '600px',
      instant: false,
    },
    low: {
      dpr: 1,
      antialias: false,
      powerPreference: 'default',
      maxTextureSize: 1024,
      frameRateLimit: Math.min(nativeHz, 60),
      loadDelay: 0,
      rootMargin: '400px',
      instant: false,
    }
  };
  
  return profiles[tier] || profiles.medium;
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
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const limiterRef = useRef(null);
  const loadStartTime = useRef(null);
  
  // For hero, start loading immediately (no intersection observer wait)
  const shouldLoadInstantly = priority || isHero;
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(shouldLoadInstantly);
  const [deviceTier, setDeviceTier] = useState('medium');
  const [loadError, setLoadError] = useState(false);
  const [qualityProfile, setQualityProfile] = useState(() => getQualityProfile('medium', shouldLoadInstantly));

  // Track load time for performance monitoring
  useEffect(() => {
    if (shouldLoad && !loadStartTime.current) {
      loadStartTime.current = performance.now();
    }
  }, [shouldLoad]);

  // Detect device tier on mount
  useEffect(() => {
    const tier = getDeviceTier();
    setDeviceTier(tier);
    setQualityProfile(getQualityProfile(tier, shouldLoadInstantly));
    console.log(`🎮 Spline Quality: ${tier.toUpperCase()} tier ${shouldLoadInstantly ? '(HERO MODE - INSTANT)' : ''}`);
    
    // For hero scenes, preload the scene URL immediately
    if (shouldLoadInstantly && scene) {
      preloadScene(scene);
    }
  }, [shouldLoadInstantly, scene]);

  // 1. LAZY TRIGGER with tier-aware root margin (SKIP for hero/priority)
  useEffect(() => {
    // Hero scenes load instantly - skip intersection observer
    if (shouldLoadInstantly) {
      setShouldLoad(true);
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
  }, [qualityProfile.rootMargin, qualityProfile.loadDelay, shouldLoadInstantly]);

  // 2. ULTRA-FAST LOADER with quality scaling and hero optimization
  useEffect(() => {
    if (!shouldLoad || !canvasRef.current) return;
    let isMounted = true;

    const init = async () => {
      const initStart = performance.now();
      
      try {
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
          stencil: deviceTier === 'high',
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
          if (!rect || rect.width === 0 || rect.height === 0) {
            // Container not ready, use fallback dimensions
            return { width: 400, height: 400 };
          }
          // Constrain to viewport to prevent blowup
          const maxWidth = Math.min(rect.width, window.innerWidth);
          const maxHeight = Math.min(rect.height, window.innerHeight);
          return { width: maxWidth, height: maxHeight };
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
        canvasRef.current.style.width = '100%';
        canvasRef.current.style.height = '100%';
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
        const width = Math.min(Math.max(rect.width, 100), window.innerWidth); // Constrain to viewport
        const height = Math.min(Math.max(rect.height, 100), window.innerHeight); // Constrain to viewport
        
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

    // Also listen to window resize for orientation changes and browser resize
    const windowResizeHandler = () => {
      handleResize([{ contentRect: containerRef.current?.getBoundingClientRect() }]);
    };
    window.addEventListener('resize', windowResizeHandler);
    window.addEventListener('orientationchange', windowResizeHandler);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', windowResizeHandler);
      window.removeEventListener('orientationchange', windowResizeHandler);
    };
  }, [isLoaded, deviceTier, qualityProfile.dpr]);

  // 4. VISIBILITY HANDLING - Pause when off-screen to save resources
  useEffect(() => {
    if (!appRef.current || !isLoaded) return;

    const handleVisibility = () => {
      if (document.hidden && limiterRef.current) {
        limiterRef.current.stop();
      } else if (!document.hidden && limiterRef.current) {
        limiterRef.current.start(appRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isLoaded]);

  // Detect if on mobile for touch handling
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
  const [isInteracting, setIsInteracting] = useState(false);

  // Handle touch/click to enable interaction
  const handleInteractionStart = useCallback(() => {
    if (isMobile) {
      setIsInteracting(true);
    }
  }, [isMobile]);

  const handleInteractionEnd = useCallback(() => {
    // Reset after a delay to allow gesture completion
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
      }}
    >
      {/* PLACEHOLDER with gradient fallback - FASTER transition for hero */}
      <div 
        className={`absolute inset-0 bg-cover bg-center ease-out ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          backgroundImage: placeholder ? `url(${placeholder})` : 'none',
          backgroundColor: 'rgba(0,0,0,0.1)',
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
      
      {/* 3D CANVAS - Mobile: pointer-events-none by default to allow scrolling */}
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
          touchAction: isMobile && !isInteracting ? 'pan-y' : 'none',
          pointerEvents: isMobile && !isInteracting ? 'none' : 'auto',
          transition: shouldLoadInstantly ? 'opacity 100ms' : 'opacity 700ms',
        }}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
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
