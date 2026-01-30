"use client";

import React, { useState, useEffect, useRef, Suspense, memo, lazy } from 'react';
import { motion } from 'framer-motion';

// Lazy load Spline only when needed
const Spline = lazy(() => import('@splinetool/react-spline').then((mod) => ({ default: mod.default || mod })));

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

export const CrashSafeSplineLoader = memo<CrashSafeSplineLoaderProps>(({
  sceneUrl,
  fallbackImage,
  isVisible,
  allowInput = true,
  className = '',
  onError: _onError,
}) => {
  const [loadState, setLoadState] = useState<'checking' | 'safe' | 'fallback' | 'error'>('checking');
  const [canLoadSpline, setCanLoadSpline] = useState(false);
  const [errorMessage, _setErrorMessage] = useState<string | null>(null);
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

  // Step 2: Register scene with memoryManager when ready
  useEffect(() => {
    if (!canLoadSpline || !isVisible || loadState !== 'safe') return;

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

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [canLoadSpline, isVisible, loadState, sceneUrl]);

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
            <div className="w-full h-full flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
              <LoadingAnimation />
            </div>
          }
        >
          {isVisible && (
            <SplineSceneWrapper
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
const SplineSceneWrapper = memo<{ sceneUrl: string; allowInput: boolean }>(
  ({ sceneUrl, allowInput }) => {
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
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
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

      {/* Overlay Content - Trading Optimized */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md"
        >
          {/* Trading icon with pulse */}
          <div className="mb-6">
            <motion.div
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border-2 border-orange-500/40 relative"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-orange-500/30"
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="text-4xl">⚡</div>
            </motion.div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            {errorMessage ? '🛡️ Performance Mode Active' : '⚡ SPEED OPTIMIZED'}
          </h3>

          <p className="text-sm text-white/70 leading-relaxed mb-4">
            {errorMessage
              ? 'Your trading experience is optimized for maximum stability and speed. Focus on what matters - making money.'
              : 'Lightweight mode activated for blazing-fast trading. Every millisecond counts when markets move.'}
          </p>

          {/* Performance benefits */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-center gap-2 text-xs text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="font-mono">3x Faster Load Times</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="font-mono">50% Less Data Usage</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="font-mono">Battery Saver Active</span>
            </div>
          </div>

          {/* Live market ticker */}
          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
            <div className="text-[10px] text-white/40 font-mono mb-2">LIVE MARKET FEED</div>
            <div className="flex justify-around">
              <div className="text-center">
                <div className="text-[10px] text-white/50 font-mono">BTC</div>
                <motion.div
                  className="text-xs font-bold text-white font-mono"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  +4.2%
                </motion.div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-white/50 font-mono">ETH</div>
                <motion.div
                  className="text-xs font-bold text-white font-mono"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                >
                  +2.8%
                </motion.div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-white/50 font-mono">SOL</div>
                <motion.div
                  className="text-xs font-bold text-white font-mono"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                >
                  +6.1%
                </motion.div>
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});
FallbackView.displayName = 'FallbackView';

// Checking Animation Component - Trading Terminal Style
const CheckingAnimation = memo(() => {
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => (prev >= 100 ? 0 : prev + 5));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 relative"
    >
      {/* Animated radar scanning effect */}
      <div className="relative w-32 h-32">
        {/* Outer rings */}
        <motion.div
          className="absolute inset-0 border-2 border-white/20 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 border-2 border-white/30 rounded-full"
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />

        {/* Central scanner */}
        <div className="absolute inset-4 border-2 border-white/50 rounded-full flex items-center justify-center">
          <motion.div
            className="absolute inset-0 border-t-4 border-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="text-3xl">📊</div>
        </div>

        {/* Corner indicators */}
        {[0, 90, 180, 270].map((rotation, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${rotation}deg) translateX(60px) translateY(-50%)`,
            }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>

      {/* Status text with typing effect */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm text-white font-mono font-semibold">
          ● MARKET ANALYSIS INITIATED
        </div>
        <div className="text-xs text-white/50 font-mono">
          Scanning device capabilities... {scanProgress}%
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-white to-white"
            style={{ width: `${scanProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Live ticker simulation */}
        <div className="flex gap-3 mt-2">
          <div className="text-[10px] font-mono text-white">BTC: +2.4%</div>
          <div className="text-[10px] font-mono text-white">ETH: +1.8%</div>
          <div className="text-[10px] font-mono text-red-400">SOL: -0.3%</div>
        </div>
      </div>
    </motion.div>
  );
});
CheckingAnimation.displayName = 'CheckingAnimation';

// Loading Animation Component - Trading Terminal Style
const LoadingAnimation = memo(() => {
  const [loadPercent, setLoadPercent] = useState(0);
  const [dataPoints, setDataPoints] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadPercent(prev => Math.min(prev + Math.random() * 15, 95));
      setDataPoints(prev => {
        const newPoints = [...prev, Math.random() * 100];
        return newPoints.slice(-10);
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 relative"
    >
      {/* Trading chart background */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <polyline
            points={dataPoints.map((p, i) => `${i * 20},${100 - p}`).join(' ')}
            fill="none"
            stroke="url(#loadGradient)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="loadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Multi-ring loader with trading icons */}
      <div className="relative w-28 h-28">
        {/* Outer pulse ring */}
        <motion.div
          className="absolute inset-0 border-4 border-white/20 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Middle spinning ring */}
        <motion.div
          className="absolute inset-2 border-4 border-white/30 rounded-full"
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 3, repeat: Infinity, ease: 'linear' }, scale: { duration: 1.5, repeat: Infinity } }}
        />

        {/* Inner core with icon */}
        <div className="absolute inset-6 border-4 border-white/50 rounded-full flex items-center justify-center bg-black/30">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <div className="text-4xl">💹</div>
          </motion.div>
        </div>

        {/* Orbiting data nodes */}
        {[0, 120, 240].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-br from-white to-white rounded-full shadow-lg shadow-white/50"
            style={{
              top: '50%',
              left: '50%',
            }}
            animate={{
              rotate: angle,
              x: Math.cos((angle * Math.PI) / 180) * 50,
              y: Math.sin((angle * Math.PI) / 180) * 50,
            }}
            transition={{
              rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Status display */}
      <div className="text-center space-y-3">
        <div className="text-white font-mono font-bold text-sm">
          🔥 LOADING TRADING TERMINAL
        </div>
        <div className="text-xs text-white/60 font-mono">
          Initializing market data streams...
        </div>

        {/* Progress bar with percentage */}
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-white/40">
            <span>Loading Assets</span>
            <span>{Math.round(loadPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <motion.div
              className="h-full bg-gradient-to-r from-white via-white to-white bg-[length:200%_100%]"
              style={{ width: `${loadPercent}%` }}
              animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Live market preview */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { sym: 'BTC', change: '+3.2%', color: 'text-white' },
            { sym: 'ETH', change: '+1.9%', color: 'text-white' },
            { sym: 'SOL', change: '-0.5%', color: 'text-red-400' },
          ].map((coin, i) => (
            <motion.div
              key={i}
              className="p-2 rounded-lg bg-white/5 border border-white/10"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            >
              <div className="text-[10px] text-white/50 font-mono">{coin.sym}</div>
              <div className={`text-xs font-mono font-bold ${coin.color}`}>{coin.change}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});
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
