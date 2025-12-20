"use client";

import React, { useState, useEffect, useRef, Suspense, memo, lazy } from 'react';
import { Loader2, Play } from 'lucide-react';
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
  const [userConsent, setUserConsent] = useState<boolean | null>(null);
  const [cachedBlob, setCachedBlob] = useState<string | null>(null);
  const splineRef = useRef<any>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = deviceProfile?.isMobile ?? false;
  const isWebView = deviceProfile?.isWebView ?? false;
  const isHighEnd = deviceProfile?.isHighEndDevice ?? true;
  const prefersReducedData = deviceProfile?.prefersReducedData ?? false;
  const connectionType = deviceProfile?.connectionType ?? '4g';

  // Determine loading strategy
  const shouldAutoLoad = React.useMemo(() => {
    // Critical scenes always load
    if (priority === 'critical') return true;

    // Desktop high-end devices: auto-load everything
    if (!isMobile && isHighEnd && !prefersReducedData) return true;

    // Mobile or WebView: require consent for non-critical scenes
    if (isMobile || isWebView) {
      // Check saved preference
      const savedPref = devicePrefs.get(`spline_autoload_${scene}`);
      if (savedPref !== null) return savedPref;

      // Auto-load only on good connections for high priority
      if (priority === 'high' && ['4g', '5g'].includes(connectionType)) {
        return true;
      }

      return false;
    }

    return true;
  }, [priority, isMobile, isWebView, isHighEnd, prefersReducedData, connectionType, scene]);

  // Load from cache or network with smart detection for Safari, Chrome, WebView
  const loadSpline = async () => {
    if (loadState === 'loading' || loadState === 'loaded') return;

    setLoadState('loading');

    try {
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
        // Show loader immediately - no delays for hero scenes
        console.log('[SmartSplineLoader] CRITICAL scene - loading immediately');
      }

      // Set timeout for slow loads (longer for WebView)
      const timeoutDuration = isWebViewBrowser ? 10000 : 5000;
      loadTimeoutRef.current = setTimeout(() => {
        console.warn(`[SmartSplineLoader] Slow load detected for ${scene} (${timeoutDuration}ms)`);
      }, timeoutDuration);

      // Try to load from cache first (faster for repeat visits)
      if ('caches' in window) {
        try {
          const cacheName = isWebViewBrowser ? 'bullmoney-webview-v1' : 'bullmoney-spline-v2';
          const cache = await caches.open(cacheName);
          const cachedResponse = await cache.match(scene);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            setCachedBlob(blobUrl);
            console.log(`[SmartSplineLoader] Loaded ${scene} from ${cacheName} cache`);
          } else {
            // Fetch and cache for next time
            console.log(`[SmartSplineLoader] Fetching ${scene} from network...`);
            const response = await fetch(scene, {
              priority: priority === 'critical' ? 'high' : 'auto',
              cache: 'force-cache'
            } as any);

            if (response.ok) {
              // Cache in background (don't block rendering)
              cache.put(scene, response.clone()).catch(err => {
                console.warn('[SmartSplineLoader] Failed to cache:', err);
              });
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
      }
    } catch (error) {
      console.error('[SmartSplineLoader] Load failed:', error);
      setLoadState('error');
      onError?.(error as Error);
    }
  };

  useEffect(() => {
    // Check user consent on mount
    const savedConsent = devicePrefs.get(`spline_consent_${scene}`);
    if (savedConsent !== null) {
      setUserConsent(savedConsent);
    } else if (shouldAutoLoad) {
      setUserConsent(true);
    }
  }, [scene, shouldAutoLoad]);

  useEffect(() => {
    if (userConsent && loadState === 'idle') {
      // CRITICAL: No delays for critical priority scenes (hero/first loader)
      // Ensure first loader shows up on ALL devices with no delays
      const delay = priority === 'critical' ? 0 : (isWebView ? 300 : 0);

      if (delay === 0) {
        loadSpline();
      } else {
        setTimeout(() => loadSpline(), delay);
      }
    }
  }, [userConsent, loadState, isWebView, priority]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (cachedBlob) {
        URL.revokeObjectURL(cachedBlob);
      }
    };
  }, [cachedBlob]);

  const handleSplineLoad = (spline: any) => {
    splineRef.current = spline;
    setLoadState('loaded');
    onLoad?.();

    // Save preference
    devicePrefs.set(`spline_consent_${scene}`, true);
    devicePrefs.set(`spline_autoload_${scene}`, true);
  };

  const handleSplineError = (error: any) => {
    console.error('[SmartSplineLoader] Spline error:', error);
    setLoadState('error');
    onError?.(error);
  };

  const handleUserOptIn = () => {
    setUserConsent(true);
    devicePrefs.set(`spline_consent_${scene}`, true);
  };

  // Show opt-in prompt for mobile/WebView non-critical scenes
  if (userConsent === false || (userConsent === null && !shouldAutoLoad)) {
    return (
      <div className={`flex items-center justify-center w-full h-full bg-black/50 backdrop-blur-sm ${className}`}>
        <div className="text-center space-y-4 p-6 rounded-2xl bg-white/5 border border-white/10 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Load 3D Scene?</h3>
          <p className="text-sm text-white/70">
            {isMobile
              ? 'This will load a 3D interactive scene. May use extra data on mobile.'
              : 'Enable 3D scene for an enhanced experience.'
            }
          </p>
          <button
            onClick={handleUserOptIn}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:scale-105 active:scale-95 transition-transform"
          >
            Load 3D Scene
          </button>
          {fallback && (
            <button
              onClick={() => setUserConsent(false)}
              className="block w-full text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loadState === 'loading') {
    return (
      <div className={`flex items-center justify-center w-full h-full ${className}`}>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-white/60">Loading 3D scene...</p>
          {isWebView && (
            <p className="text-xs text-white/40">
              In-app browser detected. This may take a moment.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (loadState === 'error') {
    return (
      <div className={`flex items-center justify-center w-full h-full ${className}`}>
        <div className="text-center space-y-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Failed to Load</h3>
          <p className="text-sm text-white/70">
            The 3D scene couldn't be loaded. This might be due to network issues or browser restrictions.
          </p>
          <button
            onClick={() => {
              setLoadState('idle');
              loadSpline();
            }}
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Try Again
          </button>
          {fallback && (
            <div className="mt-4 pt-4 border-t border-white/10">
              {fallback}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Spline
  return (
    <div className={`w-full h-full ${className}`}>
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
            pointerEvents: enableInteraction ? 'auto' : 'none'
          }}
        />
      </Suspense>
    </div>
  );
});

SmartSplineLoader.displayName = 'SmartSplineLoader';

export default SmartSplineLoader;
