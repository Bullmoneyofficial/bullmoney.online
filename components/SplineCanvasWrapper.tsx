"use client";

import React, { Suspense, useState, useEffect, memo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

/**
 * High-Performance Spline Canvas Wrapper
 * 
 * Key optimizations:
 * 1. React.memo to prevent re-renders from parent state changes
 * 2. Isolated state - UI interactions don't trigger 3D re-renders
 * 3. IntersectionObserver for visibility-based loading/unloading
 * 4. GPU compositing hints via CSS
 * 5. Touch action passthrough for scroll
 */

// Dynamic import with zero-weight loading state
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

interface SplineCanvasProps {
  scene: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Device capability detection (runs once)
const getDeviceCapability = (): 'high' | 'medium' | 'low' => {
  if (typeof window === 'undefined') return 'medium';
  
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = window.innerWidth < 768;
  const isSmallScreen = window.innerWidth < 480;
  
  // Disable 3D on very small screens
  if (isSmallScreen) return 'low';
  
  // Mobile with low specs
  if (isMobile && (memory < 4 || cores < 4)) return 'low';
  
  // Desktop or high-end mobile
  if (memory >= 8 && cores >= 8) return 'high';
  
  return 'medium';
};

/**
 * Memoized Canvas Container - NEVER re-renders from parent changes
 * This is the core of the isolation pattern
 */
const MemoizedSplineCanvas = memo(function MemoizedSplineCanvas({
  scene,
  onLoadComplete,
  onLoadError,
}: {
  scene: string;
  onLoadComplete: () => void;
  onLoadError: (e: Error) => void;
}) {
  const handleLoad = useCallback(() => {
    onLoadComplete();
  }, [onLoadComplete]);

  const handleError = useCallback((e: any) => {
    onLoadError(new Error(e?.message || 'Spline load failed'));
  }, [onLoadError]);

  return (
    <Spline
      scene={scene}
      onLoad={handleLoad}
      onError={handleError}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'pan-y',
      }}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if scene URL changes
  return prevProps.scene === nextProps.scene;
});

/**
 * Fallback component for low-end devices or errors
 */
const SplineFallback = memo(function SplineFallback() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-black via-blue-950/30 to-black rounded-xl overflow-hidden relative">
      {/* Animated gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute opacity-20 animate-spin-gpu"
          style={{
            top: '50%',
            left: '50%',
            width: '200%',
            height: '200%',
            transform: 'translate(-50%, -50%)',
            background: 'conic-gradient(from 90deg at 50% 50%, transparent 0deg, rgba(59,130,246,0.4) 120deg, transparent 240deg)',
          }}
        />
      </div>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
          <span className="text-2xl">🚀</span>
        </div>
        <p className="text-xs text-blue-300/60 text-center px-4">3D View</p>
        <p className="text-[10px] text-blue-400/40">Optimized for your device</p>
      </div>
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-xl border border-blue-500/20" />
    </div>
  );
});

/**
 * Loading spinner
 */
const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black via-blue-950/20 to-black rounded-xl">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin-gpu" />
    </div>
  );
});

/**
 * Main Spline Canvas Wrapper Component
 * 
 * Features:
 * - Visibility-based loading (IntersectionObserver)
 * - Device capability detection
 * - Memoized canvas isolation
 * - GPU compositing optimization
 */
export const SplineCanvasWrapper = memo(function SplineCanvasWrapper({
  scene,
  className = '',
  onLoad,
  onError,
}: SplineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [capability, setCapability] = useState<'high' | 'medium' | 'low'>('medium');

  // Detect device capability once
  useEffect(() => {
    setCapability(getDeviceCapability());
  }, []);

  // Visibility observer - load when in viewport, unload when away
  useEffect(() => {
    if (!containerRef.current || capability === 'low') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '200px', // Preload 200px before viewport
        threshold: 0,
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [capability]);

  // Callbacks (stable references)
  const handleLoadComplete = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleLoadError = useCallback((error: Error) => {
    console.error('Spline load error:', error);
    setHasError(true);
    onError?.(error);
  }, [onError]);

  // Low capability or error - show fallback
  if (capability === 'low' || hasError) {
    return (
      <div 
        ref={containerRef}
        className={`w-full h-full relative ${className}`}
        style={{ contain: 'strict', touchAction: 'pan-y' }}
      >
        <SplineFallback />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${className}`}
      style={{
        contain: 'strict',
        isolation: 'isolate',
        touchAction: 'pan-y',
        transform: 'translateZ(0)',
      }}
    >
      {isVisible ? (
        <Suspense fallback={<LoadingSpinner />}>
          <div 
            className="absolute inset-0"
            style={{
              touchAction: 'pan-y',
              transform: 'translateZ(0)',
            }}
          >
            <MemoizedSplineCanvas
              scene={scene}
              onLoadComplete={handleLoadComplete}
              onLoadError={handleLoadError}
            />
          </div>
        </Suspense>
      ) : (
        // Placeholder when not visible - saves GPU memory
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-950/10 to-black rounded-xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-blue-500/20" />
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isVisible && !isLoaded && !hasError && <LoadingSpinner />}
    </div>
  );
});

export default SplineCanvasWrapper;
