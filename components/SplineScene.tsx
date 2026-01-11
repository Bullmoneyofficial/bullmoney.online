"use client";

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect, memo } from 'react';

interface SplineWrapperProps {
  scene: string;
  className?: string;
  placeholder?: string | null; 
  onLoad?: () => void;
  onError?: (error: Error) => void;
  withSparkles?: boolean;
  optimizeForMobile?: boolean;
}

// Dynamic import for the heavy Spline runtime - ultra lightweight
const Spline = dynamic<SplineWrapperProps>(() => import('@/lib/spline-wrapper') as any, { 
  ssr: false,
  loading: () => null 
});

// Lightweight sparkles - only load on high-end devices
const Sparkle = dynamic(() => import('react-sparkle'), {
  ssr: false,
  loading: () => null
});

// Device tier detection (lightweight version)
const getDeviceTier = (): 'high' | 'medium' | 'low' => {
  if (typeof window === 'undefined') return 'high';
  
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    return memory >= 4 && cores >= 4 ? 'medium' : 'low';
  }
  return memory >= 8 && cores >= 8 ? 'high' : 'medium';
};

function SplineSceneComponent({ 
  scene, 
  className = "", 
  onLoad, 
  onError,
  placeholder,
  withSparkles = true,
  optimizeForMobile = true
}: SplineWrapperProps) {
  
  const [isInteractive, setIsInteractive] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [deviceTier, setDeviceTier] = useState<'high' | 'medium' | 'low'>('medium');
  const [isVisible, setIsVisible] = useState(false);

  // Detect device tier once
  useEffect(() => {
    setDeviceTier(getDeviceTier());
  }, []);

  // Only show sparkles on high-end desktop devices
  const showSparkles = withSparkles && deviceTier === 'high' && !hasError;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Handle spline loading errors gracefully
  const handleError = (error: Error) => {
    console.error(`❌ Spline load failed for ${scene}:`, error);
    setHasError(true);
    if (onError) onError(error);
  };

  const handleLoad = () => {
    setIsVisible(true);
    if (onLoad) onLoad();
  };

  // Show fallback if error occurred
  if (hasError) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-black/40 ${className}`}>
        {deviceTier !== 'low' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-blue-200/40">3D optimized for your device</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative group ${className}`}>
      
      {/* Sparkles Layer - Only on high-end devices */}
      {showSparkles && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden rounded-xl">
          <Suspense fallback={null}>
            <Sparkle 
              color="#fff" 
              count={15}
              minSize={2} 
              maxSize={5} 
              overflowPx={0} 
              fadeOutSpeed={20} 
              flicker={false} 
            />
          </Suspense>
        </div>
      )}

      {/* The 3D Scene Layer */}
      <div 
        className={`w-full h-full transition-opacity duration-500 ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <Suspense fallback={
          <div className="w-full h-full bg-gradient-to-br from-slate-950 to-neutral-950 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        }>
          <Spline 
            scene={scene} 
            onLoad={handleLoad} 
            onError={handleError} 
            placeholder={placeholder}
            className="w-full h-full"
          />
        </Suspense>
      </div>

      {/* Interaction Toggle Overlay - Simplified for performance */}
      {!isInteractive && !hasError && isVisible && (
        <button
          onClick={() => setIsInteractive(true)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-transparent hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Interact with 3D Scene"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="bg-black/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
            <span>🖐️ Interact</span>
          </div>
        </button>
      )}

      {/* Exit Interaction Button */}
      {isInteractive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsInteractive(false);
          }}
          className="absolute top-3 right-3 z-50 bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
          style={{ touchAction: 'manipulation' }}
          aria-label="Exit interaction"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(SplineSceneComponent);