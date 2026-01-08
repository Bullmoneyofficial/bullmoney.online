"use client";

import React, { useState, useEffect, useRef, Suspense, memo, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { devicePrefs } from '@/lib/smartStorage';

// Lazy load Spline only when needed
const Spline = lazy(() => import('@splinetool/react-spline').then((mod) => ({ default: mod.default || mod })));

interface SmartSplineLoaderProps {
  scene: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  enableInteraction?: boolean;
  deviceProfile?: {
    isMobile: boolean;
    isWebView: boolean;
    isHighEndDevice: boolean;
    prefersReducedData: boolean;
    connectionType: string | null;
  };
}

/**
 * Smart Spline Loader
 * Intelligently loads Spline scenes based on device capabilities,
 * network conditions, and browser type (including WebView detection)
 */
export const SmartSplineLoader = memo(({
  scene,
  fallback,
  onLoad,
  onError,
  className = '',
  priority = 'normal',
  enableInteraction = true,
  deviceProfile
}: SmartSplineLoaderProps) => {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [hasSplineLoaded, setHasSplineLoaded] = useState(false);
  const [cachedBlob, setCachedBlob] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [_loadProgress, _setLoadProgress] = useState(0);
  const splineRef = useRef<any>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false); // FIXED: Prevent concurrent load attempts
  // BUG FIX #2: Track all blob URLs created so we can revoke them on unmount
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const MAX_RETRIES = 3;

  const isMobile = deviceProfile?.isMobile ?? false;
  const isWebView = deviceProfile?.isWebView ?? false;
  const isHighEnd = deviceProfile?.isHighEndDevice ?? true;

  // Load from cache or network with smart detection for Safari, Chrome, WebView
  const loadSpline = async () => {
    // FIXED: Prevent concurrent load attempts, but allow retries on error
    if ((loadState === 'loaded' || hasLoadedRef.current) && loadState !== 'error') {
      console.log(`[SmartSplineLoader] Skipping duplicate load for ${scene}`);
      return;
    }

    if (isLoadingRef.current) {
      console.log(`[SmartSplineLoader] Load already in progress for ${scene}`);
      return;
    }

    hasLoadedRef.current = true;
    isLoadingRef.current = true;
    setLoadState('loading');

    try {
      try {
        performance.mark(`bm_spline_load_start:${scene}`);
      } catch {}

      // Detect browser type for optimized loading
      const ua = typeof window !== 'undefined' ? navigator.userAgent : '';
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isChrome = /chrome|crios/i.test(ua);
      const isWebViewBrowser = isWebView || /Instagram|FBAN|FBAV|Line|TikTok|Twitter/i.test(ua);

      console.log(`[SmartSplineLoader] ${priority === 'critical' ? '⚡ CRITICAL' : '📦'} Loading: ${scene.split('/').pop()}`, {
        browser: isSafari ? 'Safari' : isChrome ? 'Chrome' : isWebViewBrowser ? 'WebView' : 'Other',
        priority,
        device: isMobile ? '📱 Mobile' : '🖥️ Desktop',
        cached: cachedBlob ? '✅ Yes' : '⏳ Fetching'
      });

      // CRITICAL: For first loader (priority=critical), ensure immediate visibility
      if (priority === 'critical') {
        // HERO SCENE: Maximum priority loading with trading-optimized settings
        console.log('[SmartSplineLoader] ⚡ CRITICAL HERO scene - loading with maximum priority');

        // Preconnect to Spline CDN for faster loading
        if (!document.querySelector('link[rel="preconnect"][href*="spline"]')) {
          const preconnect = document.createElement('link');
          preconnect.rel = 'preconnect';
          preconnect.href = 'https://prod.spline.design';
          document.head.appendChild(preconnect);
        }
      }

      // Set timeout for slow loads (longer for WebView and mobile, shorter for critical)
      const timeoutDuration = priority === 'critical'
        ? 5000 // Critical scenes get 5s before warning
        : isWebViewBrowser ? 15000 : isMobile ? 10000 : 7000;
      loadTimeoutRef.current = setTimeout(() => {
        if (priority === 'critical') {
          console.warn(`[SmartSplineLoader] ⚠️ Hero scene loading slowly (${timeoutDuration}ms) - checking network...`);
        } else {
          console.warn(`[SmartSplineLoader] Slow load detected for ${scene} (${timeoutDuration}ms)`);
        }
      }, timeoutDuration);

      // OPTIMIZED: Multi-tiered caching strategy for instant hero scene loading
      if ('caches' in window) {
        try {
          // Use priority-specific cache names for better organization
          const cacheName = priority === 'critical'
            ? 'bullmoney-hero-instant-v1'  // Dedicated hero cache for instant loading
            : isWebViewBrowser ? 'bullmoney-webview-v1' : 'bullmoney-spline-v2';

          const cache = await caches.open(cacheName);
          const cachedResponse = await cache.match(scene);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            // BUG FIX #2: Track the blob URL for cleanup
            blobUrlsRef.current.add(blobUrl);
            setCachedBlob(blobUrl);

            if (priority === 'critical') {
              console.log(`[SmartSplineLoader] ✅ Hero scene loaded from instant cache (${(blob.size / 1024).toFixed(2)}KB)`);
            } else {
              console.log(`[SmartSplineLoader] Loaded ${scene} from ${cacheName} cache`);
            }
          } else {
            // Fetch and cache for next time with optimized settings
            console.log(`[SmartSplineLoader] ${priority === 'critical' ? '🚀 Fetching hero scene' : 'Fetching'} ${scene} from network...`);
            const response = await fetch(scene, {
              priority: priority === 'critical' ? 'high' : 'auto',
              cache: 'force-cache',
              credentials: 'same-origin' // Optimize for same-origin requests
            } as any);

            if (response.ok) {
              const blob = await response.clone().blob();
              const blobUrl = URL.createObjectURL(blob);
              blobUrlsRef.current.add(blobUrl);
              setCachedBlob(blobUrl);

              // For critical scenes, cache immediately (blocking)
              // For others, cache in background
              if (priority === 'critical') {
                await cache.put(scene, response.clone());
                console.log('[SmartSplineLoader] ✅ Hero scene cached for instant future loads');
              } else {
                cache.put(scene, response.clone()).catch(err => {
                  console.warn('[SmartSplineLoader] Failed to cache:', err);
                });
              }
            } else {
              console.error(`[SmartSplineLoader] Failed to fetch scene: ${response.status} ${response.statusText}`);
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          }
        } catch (cacheError) {
          console.warn('[SmartSplineLoader] Cache access failed, will try loading directly from URL:', cacheError);
          // Don't set error state - let Spline try to load directly from URL
          // setCachedBlob will remain null and Spline will use the original scene URL
        }
      }

      // Clear timeout on success
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    } catch (error) {
      console.error(`[SmartSplineLoader] Load failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

      // FIXED: Reset loading flag on error
      isLoadingRef.current = false;

      // Retry logic for critical scenes
      if (retryCount < MAX_RETRIES && priority === 'critical') {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff: 1s, 2s, 4s
        console.log(`[SmartSplineLoader] Retrying in ${retryDelay}ms...`);

        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          hasLoadedRef.current = false;
          setLoadState('idle');
          loadSpline();
        }, retryDelay);
      } else {
        hasLoadedRef.current = false;
        setLoadState('error');
        onError?.(error as Error);
      }
    }
  };

  useEffect(() => {
    // CRITICAL FIX: Remove ALL delays - load immediately on all devices
    // The memory manager and device profile handle safety, not delays
    console.log('[SmartSplineLoader] 🔍 useEffect triggered - starting load', {
      scene: scene.split('/').pop(),
      priority,
      isMobile,
      isWebView,
      loadState,
      deviceProfile: deviceProfile ? {
        isMobile: deviceProfile.isMobile,
        isHighEndDevice: deviceProfile.isHighEndDevice
      } : 'undefined'
    });
    loadSpline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, priority, isWebView, isMobile]);

  // BUG FIX #2: Cleanup - revoke ALL blob URLs created during the component's lifetime
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      // Revoke all blob URLs created by this component
      blobUrlsRef.current.forEach(blobUrl => {
        try {
          URL.revokeObjectURL(blobUrl);
          console.log('[SmartSplineLoader] Revoked blob URL:', blobUrl);
        } catch (e) {
          console.warn('[SmartSplineLoader] Failed to revoke blob URL:', e);
        }
      });
      blobUrlsRef.current.clear();
    };
  }, []); // Empty deps = only on unmount

  // BUG FIX #5: WebGL context loss guard with proper cleanup
  useEffect(() => {
    // Use a ref to track if we've attached listeners
    let canvas: HTMLCanvasElement | null = null;

    const handleLost = (e: Event) => {
      // @ts-ignore
      if (e?.preventDefault) e.preventDefault();
      console.warn('[SmartSplineLoader] WebGL context lost:', scene);
      setLoadState('error');
      onError?.(new Error('WebGL context lost'));
    };

    const handleRestored = () => {
      console.log('[SmartSplineLoader] WebGL context restored:', scene);
    };

    // Try to attach listeners after a short delay to ensure canvas exists
    const attachListeners = () => {
      canvas = containerRef.current?.querySelector('canvas') || null;
      if (canvas) {
        canvas.addEventListener('webglcontextlost', handleLost as any, { passive: false } as any);
        canvas.addEventListener('webglcontextrestored', handleRestored as any);
        console.log('[SmartSplineLoader] WebGL context listeners attached');
      }
    };

    // Attach immediately and also after a delay (in case canvas renders late)
    attachListeners();
    const timer = setTimeout(attachListeners, 100);

    return () => {
      clearTimeout(timer);
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleLost as any);
        canvas.removeEventListener('webglcontextrestored', handleRestored as any);
        console.log('[SmartSplineLoader] WebGL context listeners removed');
      }
      // BUG FIX #5: Properly dispose of Spline instance
      if (splineRef.current) {
        try {
          // Try to dispose/cleanup the Spline instance if it has cleanup methods
          if (typeof splineRef.current.dispose === 'function') {
            splineRef.current.dispose();
          }
          splineRef.current = null;
          console.log('[SmartSplineLoader] Spline instance disposed');
        } catch (e) {
          console.warn('[SmartSplineLoader] Error disposing Spline instance:', e);
        }
      }
    };
  }, [onError, scene, hasSplineLoaded]); // Re-run when scene loads

  const handleSplineLoad = (spline: any) => {
    splineRef.current = spline;
    setLoadState('loaded');
    setHasSplineLoaded(true);

    // BUG FIX #14 & #21: Register scene with memoryManager
    if ((window as any).memoryManager) {
      // Check if already registered (e.g., by PageScenes for split views)
      const status = (window as any).memoryManager.canLoadScene(scene, priority);
      const alreadyRegistered = status.reason === 'Scene already active';

      if (!alreadyRegistered) {
        (window as any).memoryManager.registerScene(scene);
        console.log('[SmartSplineLoader] Registered scene with memoryManager:', scene);
      } else {
        console.log('[SmartSplineLoader] Scene already registered (managed by PageScenes)');
      }
    }

    onLoad?.();

    try {
      performance.mark(`bm_spline_load_end:${scene}`);
      performance.measure(
        `bm_spline_load:${scene}`,
        `bm_spline_load_start:${scene}`,
        `bm_spline_load_end:${scene}`
      );
    } catch {}

    // Save preference
    devicePrefs.set(`spline_consent_${scene}`, true);
    devicePrefs.set(`spline_autoload_${scene}`, true);

    // ENHANCED: Optimize Spline quality based on device capabilities
    if (spline) {
      try {
        // Detect device performance level
        const isLowEnd = !isHighEnd && isMobile;
        const isMidRange = isHighEnd && isMobile;
        const isDesktop = !isMobile;

        // ENHANCED: Gradual quality degradation based on device tier
        // Goal: Make it work everywhere, just with different quality levels

        if (isLowEnd) {
          // Low-end mobile: Ultra-conservative settings
          console.log('[SmartSplineLoader] ⚡ Low-end device detected - applying performance mode', {
            deviceMemory: (navigator as any).deviceMemory || 'unknown',
            tier: 'low-end',
            quality: 'low',
            pixelRatio: '1.0x'
          });

          if (spline.setQuality) spline.setQuality('low');
          if (spline.setShadowQuality) spline.setShadowQuality('none');
          if (spline.setPixelRatio) {
            // Very low pixel ratio for smooth performance
            spline.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
          }

          // Disable expensive effects if possible
          if (spline.setAntialias) spline.setAntialias(false);
          if (spline.setPostProcessing) spline.setPostProcessing(false);
          if (spline.setReflections) spline.setReflections(false);

          console.log('[SmartSplineLoader] Applied ultra-performance optimizations');

        } else if (isMidRange) {
          // Mid-range mobile: Balanced quality
          console.log('[SmartSplineLoader] 📱 Mid-range device detected - applying balanced mode', {
            deviceMemory: (navigator as any).deviceMemory || 'unknown',
            tier: 'mid-range',
            quality: 'medium',
            pixelRatio: '1.5x'
          });

          if (spline.setQuality) spline.setQuality('medium');
          if (spline.setShadowQuality) spline.setShadowQuality('low');
          if (spline.setPixelRatio) {
            // Moderate pixel ratio
            spline.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
          }

          // Some effects enabled with reduced quality
          if (spline.setAntialias) spline.setAntialias(true);
          if (spline.setPostProcessing) spline.setPostProcessing(false);

          console.log('[SmartSplineLoader] Applied balanced optimizations');

        } else if (isDesktop) {
          // Desktop: High quality
          console.log('[SmartSplineLoader] 🖥️ Desktop device detected - applying high quality mode', {
            deviceMemory: (navigator as any).deviceMemory || 'unknown',
            tier: 'desktop',
            quality: 'high',
            pixelRatio: '2.0x'
          });

          if (spline.setQuality) spline.setQuality('high');
          if (spline.setShadowQuality) spline.setShadowQuality('high');
          if (spline.setPixelRatio) {
            // Full pixel ratio on desktop
            spline.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
          }

          // All effects enabled
          if (spline.setAntialias) spline.setAntialias(true);
          if (spline.setPostProcessing) spline.setPostProcessing(true);

          console.log('[SmartSplineLoader] Applied high-quality settings');
        }

        // Universal optimizations for ALL devices
        // These are safe and improve performance everywhere
        if (spline.setFrustumCulling) spline.setFrustumCulling(true);
        if (spline.setOcclusionCulling) spline.setOcclusionCulling(true);

        console.log('[SmartSplineLoader] ✅ Device-specific optimizations complete');

      } catch (e) {
        console.warn('[SmartSplineLoader] Could not apply device optimizations:', e);
      }
    }
  };

  const handleSplineError = (error: any) => {
    console.error('[SmartSplineLoader] Spline error:', error);
    setLoadState('error');
    onError?.(error);
  };

  useEffect(() => {
    setHasSplineLoaded(false);
    setLoadState('idle');
    hasLoadedRef.current = false;
    isLoadingRef.current = false; // FIXED: Reset loading flag when scene changes

    // BUG FIX #14 & #21: Unregister old scene when scene changes (works on both mobile and desktop now)
    return () => {
      if (splineRef.current && (window as any).memoryManager) {
        (window as any).memoryManager.unregisterScene(scene);
        console.log('[SmartSplineLoader] Unregistered scene:', scene);
      }
    };
  }, [scene, isMobile]);

  // Show error state with smart retry
  if (loadState === 'error') {
    const canRetry = retryCount < MAX_RETRIES;
    return (
      <div className={`flex items-center justify-center w-full h-full bg-gradient-to-br from-black via-gray-900/50 to-black ${className}`}>
        <div className="text-center space-y-4 p-8 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-md backdrop-blur-sm">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping"></div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Scene Load Failed</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              {priority === 'critical'
                ? 'Critical trading scene failed to load. This may affect your experience.'
                : 'The 3D scene couldn\'t be loaded due to network or browser restrictions.'}
            </p>
            {retryCount > 0 && (
              <div className="text-xs text-orange-400 bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                Tried {retryCount} time{retryCount > 1 ? 's' : ''} - Connection issues detected
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {canRetry ? (
              <button
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                  setLoadState('idle');
                  hasLoadedRef.current = false;
                  loadSpline();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95"
              >
                🔄 Retry Loading ({MAX_RETRIES - retryCount} attempts left)
              </button>
            ) : (
              <button
                onClick={() => {
                  setRetryCount(0);
                  setLoadState('idle');
                  hasLoadedRef.current = false;
                  loadSpline();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-all active:scale-95"
              >
                🔄 Start Fresh
              </button>
            )}

            {priority !== 'critical' && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/70 text-sm hover:bg-white/10 transition-colors"
              >
                Reload Page
              </button>
            )}
          </div>

          {fallback && (
            <div className="mt-4 pt-4 border-t border-white/10">
              {fallback}
            </div>
          )}

          <p className="text-[10px] text-white/40 mt-4">
            💡 Tip: Check your internet connection or try switching to Performance Mode
          </p>
        </div>
      </div>
    );
  }

  // Render Spline with trading-themed loading
  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`} style={{ minHeight: '100%', minWidth: '100%' }}>
      {!hasSplineLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#050814] via-[#0b1226]/80 to-[#04060f] overflow-hidden z-10">
          {/* Subtle market chart background */}
          <div className="absolute inset-0 opacity-[0.08]">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <polyline
                points="0,100 50,80 100,120 150,60 200,90 250,50 300,70 350,40 400,60"
                fill="none"
                stroke="url(#gradient1)"
                strokeWidth="3"
                className="animate-pulse"
              />
              <polyline
                points="0,150 50,130 100,170 150,110 200,140 250,100 300,120 350,90 400,110"
                fill="none"
                stroke="url(#gradient2)"
                strokeWidth="2"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e40af" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Floating trading symbols */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-[10px] font-mono text-blue-200/20 animate-float"
                style={{
                  left: `${(i * 12.5) + 5}%`,
                  top: `${20 + Math.sin(i) * 30}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${3 + i * 0.5}s`
                }}
              >
                {['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'LINK', 'DOT'][i]}
              </div>
            ))}
          </div>

          <div className="text-center space-y-4 max-w-[20rem] px-6 relative z-10">
            {/* Minimal, blue-toned loader */}
            <div className="relative w-20 h-20 mx-auto">
              <div
                className="absolute inset-0 rounded-full border border-blue-500/30 bg-blue-500/10 animate-pulse"
                style={{ animationDuration: '2.4s' }}
              />
              <div className="absolute inset-2 rounded-full border border-blue-400/30" />
              <Loader2
                className="absolute inset-0 m-auto h-8 w-8 text-blue-300 animate-spin"
                style={{ animationDuration: '1.6s' }}
              />
            </div>

            {/* Priority-specific messages with FOMO and urgency */}
            {priority === 'critical' ? (
              <>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Live market access</span>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-100">
                    Connecting to Trading Terminal
                  </h3>
                  <p className="text-xs text-blue-100/70 leading-relaxed">
                    Syncing real-time market data and analytics for a smooth launch...
                  </p>
                </div>

                {/* Live stats simulation */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                    <div className="text-blue-100 text-xs font-mono">+24.3%</div>
                    <div className="text-[10px] text-blue-200/60">BTC</div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                    <div className="text-blue-100 text-xs font-mono">+18.7%</div>
                    <div className="text-[10px] text-blue-200/60">ETH</div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                    <div className="text-blue-100 text-xs font-mono">+31.2%</div>
                    <div className="text-[10px] text-blue-200/60">SOL</div>
                  </div>
                </div>

                {retryCount > 0 && (
                  <div className="mt-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-400/30 animate-pulse">
                    <p className="text-xs text-blue-200 font-semibold">
                      Reconnecting to market feed... ({MAX_RETRIES - retryCount} attempts left)
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30">
                    <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Premium content</span>
                  </div>
                  <h3 className="text-base font-semibold text-blue-100">
                    {isMobile ? 'Mobile Trading Terminal' : 'Advanced Market View'}
                  </h3>
                  <p className="text-xs text-blue-100/70 leading-relaxed">
                    {isWebView
                      ? 'Optimizing for in-app browser — Your competitive edge is loading...'
                      : isMobile && !isHighEnd
                      ? 'Lightning-fast mobile experience — No lag, pure profits!'
                      : 'Loading institutional-grade trading tools and analytics...'}
                  </p>
                </div>

                {retryCount > 0 && (
                  <p className="text-xs text-blue-200 mt-2 font-semibold">
                    Reconnecting... ({retryCount}/{MAX_RETRIES})
                  </p>
                )}
              </>
            )}

            {/* Trading candlestick progress indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-1 rounded-sm ${i % 2 === 0 ? 'bg-blue-400' : 'bg-blue-200/70'} animate-pulse`}
                    style={{
                      height: `${12 + i * 4}px`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Loading percentage simulation */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-blue-100/60">
                <span>Market Data</span>
                <span className="text-blue-200">SYNCING</span>
              </div>
              <div className="w-full h-1 bg-blue-100/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-500 animate-pulse rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={`absolute inset-0 w-full h-full ${hasSplineLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center w-full h-full">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
          }
        >
          <Spline
            scene={cachedBlob || scene}
            onLoad={handleSplineLoad}
            onError={handleSplineError}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: enableInteraction ? 'auto' : 'none',
              touchAction: enableInteraction ? 'none' : 'auto',
              // OPTIMIZATION: Reduce rendering complexity on mobile
              ...(isMobile && !isHighEnd ? {
                imageRendering: 'auto',
                transform: 'translateZ(0)', // Force GPU acceleration
                willChange: 'auto' // Prevent excessive layer creation
              } : {})
            }}
          />
        </Suspense>
      </div>
    </div>
  );
});

SmartSplineLoader.displayName = 'SmartSplineLoader';

export default SmartSplineLoader;
