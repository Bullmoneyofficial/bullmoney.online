"use client";

import React, { useState, useEffect, useRef, Suspense, memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Crash-Safe Spline Loader
 * Prevents mobile crashes by:
 * 1. Detecting device capabilities BEFORE loading
 * 2. Using fallback images on low-end devices
 * 3. Progressive loading with error boundaries
 * 4. Memory-safe scene management
 */

interface CrashSafeSplineLoaderProps {
  sceneUrl: string;
  fallbackImage?: string;
  isVisible: boolean;
  allowInput?: boolean;
  className?: string;
  onError?: (error: Error) => void;
}

// Device capability thresholds
const DEVICE_THRESHOLDS = {
  MIN_MEMORY: 1, // GB (looser; we already limit to one active scene on mobile)
  MIN_CORES: 2,
  MIN_WIDTH: 320,
  SAFE_CONCURRENT_SCENES: 1,
};

// BUG FIX #14: Remove global counter - use memoryManager instead (single source of truth)
// BUG FIX #17: Add mutex for Spline module loading
let globalSplineModule: any = null;
let splineModuleLoading = false;

export const CrashSafeSplineLoader = memo<CrashSafeSplineLoaderProps>(({
  sceneUrl,
  fallbackImage,
  isVisible,
  allowInput = true,
  className = '',
  onError,
}) => {
  const [loadState, setLoadState] = useState<'checking' | 'safe' | 'fallback' | 'error'>('checking');
  const [canLoadSpline, setCanLoadSpline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isMounted = useRef(true);

  // Step 1: Check device capabilities
  useEffect(() => {
    isMounted.current = true;

    const checkDeviceCapabilities = async () => {
      try {
        // Check if we're in browser
        if (typeof window === 'undefined') {
          setLoadState('fallback');
          return;
        }

        // Get device info
        const isMobile = window.innerWidth < 768;
        // @ts-ignore
        const memory = navigator.deviceMemory || 4;
        // @ts-ignore
        const cores = navigator.hardwareConcurrency || 4;
        // @ts-ignore
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const isSlowConnection = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';

        // Check if device is capable
        const isCapable =
          memory >= DEVICE_THRESHOLDS.MIN_MEMORY &&
          cores >= DEVICE_THRESHOLDS.MIN_CORES &&
          !isSlowConnection &&
          window.innerWidth >= DEVICE_THRESHOLDS.MIN_WIDTH;

        // BUG FIX #14: Use memoryManager for scene counting (single source of truth)
        const memStatus = (window as any).memoryManager?.canLoadScene(sceneUrl, 'normal');
        const canLoadMore = memStatus?.canLoadMore ?? true;

        if (isMobile && !isCapable) {
          console.log('[Spline] Using fallback: Device below threshold', {
            memory,
            cores,
            isSlowConnection,
            width: window.innerWidth
          });
          if (isMounted.current) setLoadState('fallback');
          return;
        }

        if (!canLoadMore && isMobile) {
          console.log('[Spline] Using fallback: Memory manager blocked -', memStatus?.reason);
          if (isMounted.current) setLoadState('fallback');
          return;
        }

        // Device is capable - proceed to load
        if (isMounted.current) {
          setCanLoadSpline(true);
          setLoadState('safe');
        }

      } catch (error) {
        console.error('[Spline] Capability check failed:', error);
        if (isMounted.current) setLoadState('fallback');
      }
    };

    checkDeviceCapabilities();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Step 2: Load Spline module only when safe and visible
  useEffect(() => {
    if (!canLoadSpline || !isVisible || loadState !== 'safe') return;

    let mounted = true;

    const loadSplineModule = async () => {
      try {
        // BUG FIX #17: Load Spline module with mutex to prevent race conditions
        if (!globalSplineModule && !splineModuleLoading) {
          splineModuleLoading = true;
          try {
            const module = await import('@splinetool/react-spline');
            globalSplineModule = module.default;
            console.log('[Spline] Module loaded globally');
          } finally {
            splineModuleLoading = false;
          }
        } else if (splineModuleLoading) {
          // Wait for module to finish loading
          await new Promise(resolve => {
            const checkInterval = setInterval(() => {
              if (!splineModuleLoading) {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 50);
          });
        }

        if (!mounted) return;

        // BUG FIX #14: Register with memoryManager instead of global counter
        if ((window as any).memoryManager) {
          (window as any).memoryManager.registerScene(sceneUrl);
        }

        // Cleanup function
        cleanupRef.current = () => {
          if ((window as any).memoryManager) {
            (window as any).memoryManager.unregisterScene(sceneUrl);
          }
          console.log('[Spline] Scene cleanup:', sceneUrl);
        };

      } catch (error: any) {
        console.error('[Spline] Load error:', error);
        if (mounted && isMounted.current) {
          setLoadState('error');
          setErrorMessage(error.message || 'Failed to load 3D scene');
          if (onError) onError(error);
        }
      }
    };

    loadSplineModule();

    return () => {
      mounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [canLoadSpline, isVisible, loadState, sceneUrl, onError]);

  // Step 3: Render based on state
  if (loadState === 'checking') {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-black ${className}`} ref={containerRef}>
        <CheckingAnimation />
      </div>
    );
  }

  if (loadState === 'fallback' || loadState === 'error') {
    return (
      <FallbackView
        sceneUrl={sceneUrl}
        fallbackImage={fallbackImage}
        errorMessage={errorMessage}
        className={className}
      />
    );
  }

  // Safe to load Spline
  return (
    <div className={`w-full h-full relative ${className}`} ref={containerRef}>
      <ErrorBoundary
        fallback={
          <FallbackView
            sceneUrl={sceneUrl}
            fallbackImage={fallbackImage}
            errorMessage="3D scene failed to load"
            className={className}
          />
        }
      >
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-black">
              <LoadingAnimation />
            </div>
          }
        >
          {globalSplineModule && isVisible && (
            <SplineSceneWrapper
              Spline={globalSplineModule}
              sceneUrl={sceneUrl}
              allowInput={allowInput}
            />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});
CrashSafeSplineLoader.displayName = 'CrashSafeSplineLoader';

// Spline Scene Wrapper with error handling
const SplineSceneWrapper = memo<{ Spline: any; sceneUrl: string; allowInput: boolean }>(
  ({ Spline, sceneUrl, allowInput }) => {
    const [hasError, setHasError] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const handleError = (error: any) => {
      console.error('[Spline] Runtime error:', error);
      setHasError(true);
    };

    useEffect(() => {
      const canvas = wrapperRef.current?.querySelector('canvas');
      if (!canvas) return;

      const handleLost = (e: Event) => {
        // @ts-ignore
        if (e?.preventDefault) e.preventDefault();
        console.warn('[Spline] WebGL context lost:', sceneUrl);
        setHasError(true);
      };

      canvas.addEventListener('webglcontextlost', handleLost as any, { passive: false } as any);
      return () => {
        canvas.removeEventListener('webglcontextlost', handleLost as any);
      };
    }, [sceneUrl]);

    if (hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-950 to-black">
          <div className="text-center text-white/40 p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <div className="text-sm">3D scene unavailable</div>
          </div>
        </div>
      );
    }

    return (
      <div ref={wrapperRef} className="w-full h-full">
        <Spline
          scene={sceneUrl}
          className={`w-full h-full block ${allowInput ? '' : 'pointer-events-none'}`}
          onError={handleError}
        />
      </div>
    );
  }
);
SplineSceneWrapper.displayName = 'SplineSceneWrapper';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Spline] Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Fallback View Component
const FallbackView = memo<{
  sceneUrl: string;
  fallbackImage?: string;
  errorMessage?: string | null;
  className: string;
}>(({ sceneUrl, fallbackImage, errorMessage, className }) => {
  // Generate a preview image from scene URL
  const previewUrl = fallbackImage || generatePreviewUrl(sceneUrl);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full h-full relative bg-gradient-to-br from-neutral-950 via-black to-neutral-900 ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Preview Image or Placeholder */}
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="3D Scene Preview"
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-8xl opacity-10">🎨</div>
        </div>
      )}

      {/* Overlay Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md"
        >
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {errorMessage || 'Optimized for Your Device'}
          </h3>
          <p className="text-sm text-white/60 leading-relaxed">
            {errorMessage
              ? 'Using static preview for stability'
              : 'Using lightweight preview to ensure smooth performance on your device'}
          </p>

          {/* Decorative Elements */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse animation-delay-200" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse animation-delay-400" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
FallbackView.displayName = 'FallbackView';

// Checking Animation Component
const CheckingAnimation = memo(() => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center gap-4"
  >
    <div className="relative w-16 h-16">
      <motion.div
        className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
    <div className="text-sm text-white/40 font-mono">Checking device...</div>
  </motion.div>
));
CheckingAnimation.displayName = 'CheckingAnimation';

// Loading Animation Component
const LoadingAnimation = memo(() => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center gap-6"
  >
    <div className="relative w-20 h-20">
      <motion.div
        className="absolute inset-0 border-4 border-blue-500/20 rounded-full"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 border-4 border-blue-500/40 border-t-blue-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
    <div className="text-center">
      <div className="text-white/80 font-medium mb-1">Loading 3D Scene</div>
      <div className="text-xs text-white/40 font-mono">Please wait...</div>
    </div>
  </motion.div>
));
LoadingAnimation.displayName = 'LoadingAnimation';

// Helper: Generate preview URL from scene URL
function generatePreviewUrl(sceneUrl: string): string | null {
  // Extract scene ID and generate thumbnail
  // This is a placeholder - adjust based on your Spline CDN structure
  try {
    const match = sceneUrl.match(/\/([^\/]+)\.splinecode$/);
    if (match && match[1]) {
      return `/previews/${match[1]}.jpg`;
    }
  } catch (error) {
    console.warn('Could not generate preview URL:', error);
  }
  return null;
}

// CSS for animation delays (injected lazily on client)
let animationStyleInjected = false;
const ensureAnimationStyle = () => {
  if (animationStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    .animation-delay-200 {
      animation-delay: 200ms;
    }
    .animation-delay-400 {
      animation-delay: 400ms;
    }
  `;
  document.head.appendChild(style);
  animationStyleInjected = true;
};

// Ensure the animation helper styles are available when the component mounts
if (typeof window !== 'undefined') {
  ensureAnimationStyle();
}
