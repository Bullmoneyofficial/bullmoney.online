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
  const [loadState, setLoadState] = useState<'idle' | 'loaded' | 'error'>('idle');
  const [hasSplineLoaded, setHasSplineLoaded] = useState(false);
  const [cachedBlob, setCachedBlob] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const splineRef = useRef<any>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedRef = useRef(false);
  // BUG FIX #2: Track all blob URLs created so we can revoke them on unmount
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const MAX_RETRIES = 3;

  const isMobile = deviceProfile?.isMobile ?? false;
  const isWebView = deviceProfile?.isWebView ?? false;
  const isHighEnd = deviceProfile?.isHighEndDevice ?? true;
  const prefersReducedData = deviceProfile?.prefersReducedData ?? false;
  const connectionType = deviceProfile?.connectionType ?? '4g';

  // Load from cache or network with smart detection for Safari, Chrome, WebView
  const loadSpline = async () => {
    if (loadState === 'loaded' || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    try {
      try {
        performance.mark(`bm_spline_load_start:${scene}`);
      } catch {}

      // Detect browser type for optimized loading
      const ua = typeof window !== 'undefined' ? navigator.userAgent : '';
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isChrome = /chrome|crios/i.test(ua);
      const isWebViewBrowser = isWebView || /Instagram|FBAN|FBAV|Line|TikTok|Twitter/i.test(ua);

      console.log(`[SmartSplineLoader] Loading ${scene}`, {
        isSafari,
        isChrome,
        isWebViewBrowser,
        priority,
        isMobile
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
            }
          }
        } catch (cacheError) {
          console.warn('[SmartSplineLoader] Cache access failed, loading directly:', cacheError);
          // Fallback: load directly without cache
        }
      }

      // Clear timeout on success
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    } catch (error) {
      console.error(`[SmartSplineLoader] Load failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

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
    // Always warm caches / telemetry; never gate loading on "consent".
    const delay = priority === 'critical' ? 0 : (isWebView ? 200 : 0);
    const t = window.setTimeout(() => {
      loadSpline();
    }, delay);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, priority, isWebView]);

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

    // OPTIMIZATION: Reduce Spline quality on mobile for better performance
    if (isMobile && spline) {
      try {
        // Lower rendering quality on mobile
        if (spline.setQuality) {
          spline.setQuality(isHighEnd ? 'medium' : 'low');
        }
        // Reduce shadow quality
        if (spline.setShadowQuality) {
          spline.setShadowQuality(isHighEnd ? 'low' : 'none');
        }
        console.log('[SmartSplineLoader] Applied mobile optimizations:', isHighEnd ? 'medium' : 'low');
      } catch (e) {
        console.warn('[SmartSplineLoader] Could not apply mobile optimizations:', e);
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
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {!hasSplineLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black via-gray-900/50 to-black">
          <div className="text-center space-y-4 max-w-sm px-6">
            {/* Trading-themed loader */}
            <div className="relative w-16 h-16 mx-auto">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              {priority === 'critical' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl">📈</div>
                </div>
              )}
            </div>

            {/* Priority-specific messages */}
            {priority === 'critical' ? (
              <>
                <h3 className="text-lg font-bold text-white">
                  Initializing Trading View
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Preparing your premium trading environment with real-time market visualization...
                </p>
                {retryCount > 0 && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30">
                    <p className="text-[10px] text-orange-300 font-semibold">
                      Retry attempt {retryCount}/{MAX_RETRIES} - Optimizing connection...
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-white">
                  Loading Experience
                </h3>
                {isWebView && (
                  <p className="text-[11px] text-white/50">
                    In-app browser detected — optimizing for your device…
                  </p>
                )}
                {isMobile && !isHighEnd && (
                  <p className="text-[11px] text-white/50">
                    Loading performance-optimized version for smooth trading…
                  </p>
                )}
                {retryCount > 0 && (
                  <p className="text-[10px] text-orange-400 mt-2">
                    Reconnecting... ({retryCount}/{MAX_RETRIES})
                  </p>
                )}
              </>
            )}

            {/* Trading-style progress indicators */}
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
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
            pointerEvents: enableInteraction ? 'auto' : 'none',
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
  );
});

SmartSplineLoader.displayName = 'SmartSplineLoader';

export default SmartSplineLoader;
