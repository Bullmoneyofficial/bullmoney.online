"use client";

import { useRef, useState, useEffect, useCallback } from 'react';

// GLOBAL CACHE: reuse the runtime import to avoid re-downloading 3MB JS on every spline
let runtimePromise = null;

// ============================================================================
// DEVICE TIER DETECTION - Fast & lightweight
// ============================================================================
const getDeviceTier = () => {
  if (typeof window === 'undefined') return 'high';
  
  const memory = navigator.deviceMemory || 4; // GB
  const cores = navigator.hardwareConcurrency || 4;
  const connection = navigator.connection || {};
  const effectiveType = connection.effectiveType || '4g';
  const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  
  // Check WebGL capability
  let webglTier = 'high';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        // Detect integrated/low-end GPUs
        if (renderer.includes('intel') || renderer.includes('mali-4') || renderer.includes('adreno 3')) {
          webglTier = 'low';
        } else if (renderer.includes('mali') || renderer.includes('adreno 5') || renderer.includes('apple gpu')) {
          webglTier = 'medium';
        }
      }
    } else {
      webglTier = 'low';
    }
  } catch (e) {
    webglTier = 'medium';
  }

  // Scoring system
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
  
  // Mobile penalty
  if (isMobile) score -= 1;
  
  // Determine tier
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
};

// ============================================================================
// QUALITY PROFILES - Optimized for each tier
// ============================================================================
const getQualityProfile = (tier) => {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  
  const profiles = {
    high: {
      dpr: Math.min(dpr, 2),
      antialias: true,
      powerPreference: 'high-performance',
      maxTextureSize: 4096,
      frameRateLimit: 60,
      loadDelay: 0,
      rootMargin: '500px',
    },
    medium: {
      dpr: Math.min(dpr, 1.5),
      antialias: true,
      powerPreference: 'default',
      maxTextureSize: 2048,
      frameRateLimit: 45,
      loadDelay: 100,
      rootMargin: '300px',
    },
    low: {
      dpr: 1,
      antialias: false,
      powerPreference: 'low-power',
      maxTextureSize: 1024,
      frameRateLimit: 30,
      loadDelay: 200,
      rootMargin: '150px',
    }
  };
  
  return profiles[tier] || profiles.medium;
};

// ============================================================================
// FRAME RATE LIMITER - Saves battery & reduces heat on low-end
// ============================================================================
class FrameRateLimiter {
  constructor(targetFps = 60) {
    this.targetFps = targetFps;
    this.frameInterval = 1000 / targetFps;
    this.lastFrameTime = 0;
    this.isActive = false;
    this.rafId = null;
  }

  start(app) {
    if (!app || this.targetFps >= 60) return;
    
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
// MAIN COMPONENT
// ============================================================================
export default function SplineWrapper({ 
  scene, 
  placeholder,
  className,
  onLoad,
  onError 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const limiterRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [deviceTier, setDeviceTier] = useState('medium');
  const [loadError, setLoadError] = useState(false);
  const [qualityProfile, setQualityProfile] = useState(() => getQualityProfile('medium'));

  // Detect device tier on mount
  useEffect(() => {
    const tier = getDeviceTier();
    setDeviceTier(tier);
    setQualityProfile(getQualityProfile(tier));
    console.log(`🎮 Spline Quality: ${tier.toUpperCase()} tier detected`);
  }, []);

  // 1. LAZY TRIGGER with tier-aware root margin
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Add delay for low-end devices to prevent jank
        setTimeout(() => {
          setShouldLoad(true);
        }, qualityProfile.loadDelay);
        observer.disconnect();
      }
    }, { rootMargin: qualityProfile.rootMargin });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [qualityProfile.rootMargin, qualityProfile.loadDelay]);

  // 2. OPTIMIZED LOADER with quality scaling
  useEffect(() => {
    if (!shouldLoad || !canvasRef.current) return;
    let isMounted = true;

    const init = async () => {
      try {
        // Start pre-fetching the runtime only once globally
        if (!runtimePromise) {
          runtimePromise = import('@splinetool/runtime');
        }

        const { Application } = await runtimePromise;
        
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

        // Set size with DPR scaling
        const rect = containerRef.current.getBoundingClientRect();
        const scaledWidth = Math.floor(rect.width * qualityProfile.dpr);
        const scaledHeight = Math.floor(rect.height * qualityProfile.dpr);
        
        if (app.setSize) {
          app.setSize(scaledWidth, scaledHeight);
        }
        
        // Apply canvas size directly for proper resolution
        canvasRef.current.width = scaledWidth;
        canvasRef.current.height = scaledHeight;
        canvasRef.current.style.width = `${rect.width}px`;
        canvasRef.current.style.height = `${rect.height}px`;

        // Apply frame rate limiting for low/medium tier
        if (qualityProfile.frameRateLimit < 60) {
          limiterRef.current = new FrameRateLimiter(qualityProfile.frameRateLimit);
          limiterRef.current.start(app);
          console.log(`⚡ Frame rate limited to ${qualityProfile.frameRateLimit}fps for ${deviceTier} tier`);
        }

        if (isMounted) {
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

    // Use requestIdleCallback for low-end devices, immediate for high-end
    if (deviceTier === 'low' && 'requestIdleCallback' in window) {
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

  // 3. RESIZE HANDLER with debouncing for low-end
  useEffect(() => {
    if (!appRef.current || !containerRef.current || !isLoaded) return;

    let resizeTimeout = null;
    const debounceMs = deviceTier === 'low' ? 250 : deviceTier === 'medium' ? 100 : 16;

    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!appRef.current || !canvasRef.current) return;
        
        const { width, height } = entries[0].contentRect;
        const scaledWidth = Math.floor(width * qualityProfile.dpr);
        const scaledHeight = Math.floor(height * qualityProfile.dpr);
        
        if (appRef.current.setSize) {
          appRef.current.setSize(scaledWidth, scaledHeight);
        }
        
        canvasRef.current.width = scaledWidth;
        canvasRef.current.height = scaledHeight;
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
      }, debounceMs);
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
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

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full isolate overflow-hidden ${className || ''}`}
    >
      {/* PLACEHOLDER with gradient fallback */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ 
          backgroundImage: placeholder ? `url(${placeholder})` : 'none',
          backgroundColor: 'rgba(0,0,0,0.1)',
        }}
      >
        {/* Loading indicator for non-placeholder */}
        {!placeholder && !isLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      {/* Error fallback - still show gradient */}
      {loadError && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-black/40" />
      )}
      
      {/* 3D CANVAS */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block outline-none transition-opacity duration-700 ease-out ${isLoaded && !loadError ? 'opacity-100' : 'opacity-0'}`}
        style={{ touchAction: 'none' }}
      />
      
      {/* Dev indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && isLoaded && (
        <div className="absolute bottom-2 left-2 text-[10px] text-white/40 bg-black/20 px-1 rounded">
          {deviceTier} | {qualityProfile.frameRateLimit}fps | {qualityProfile.dpr}x
        </div>
      )}
    </div>
  );
}
