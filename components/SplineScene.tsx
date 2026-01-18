"use client";

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect, memo, useRef, useCallback } from 'react';
import { detectBrowser } from '@/lib/browserDetection';
import { ShimmerSpinner, ShimmerRadialGlow, ShimmerBorder } from '@/components/ui/UnifiedShimmer';
import { useUnifiedPerformance } from '@/lib/UnifiedPerformanceSystem';
import { useSplineAudio, useSplineAudioHandlers, SplineAudioProfile } from '@/app/hooks/useSplineAudio';

interface SplineWrapperProps {
  scene: string;
  className?: string;
  placeholder?: string | null; 
  onLoad?: () => void;
  onError?: (error: Error) => void;
  withSparkles?: boolean;
  optimizeForMobile?: boolean;
  targetFPS?: number;
  maxDpr?: number;
  minDpr?: number;
}

// Dynamic import for the heavy Spline runtime - ultra lightweight
const Spline = dynamic<SplineWrapperProps>(() => import('@/lib/spline-wrapper') as any, { 
  ssr: false,
  loading: () => null 
});

// Lightweight sparkles - only load on high-end devices
const Sparkle = dynamic(() => import('@/components/ui/Sparkle'), {
  ssr: false,
  loading: () => null
});

function SplineSceneComponent({ 
  scene, 
  className = "", 
  onLoad, 
  onError,
  placeholder,
  withSparkles = true,
  optimizeForMobile: _optimizeForMobile = true,
  targetFPS,
}: SplineWrapperProps) {
  
  const [isInteractive, setIsInteractive] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const perf = useUnifiedPerformance();
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Spline audio with 20 unique interaction sounds
  // Profiles: CYBER (futuristic), ORGANIC (natural), MECHANICAL (industrial), SILENT
  const audioPlayer = useSplineAudio({
    enabled: true,
    profile: 'CYBER',
    volume: 0.35,
  });
  
  // Get all audio event handlers for interactions
  const audioHandlers = useSplineAudioHandlers(audioPlayer, containerRef);
  
  // Initialize audio on first user interaction
  useEffect(() => {
    audioPlayer.init();
  }, [audioPlayer]);

  // HERO MODE: Always render on ALL devices, optimize quality instead of blocking
  useEffect(() => {
    const browserInfo = detectBrowser();
    
    // For hero, never disable - always find a way to render
    const canBrowserRender = true; // HERO: Override all restrictions
    const canDeviceRender = true; // HERO: Override all restrictions
    
    console.log('[SplineScene] HERO MODE: Enabled on ALL devices', {
      browserName: browserInfo.browserName,
      gpuTier: browserInfo.gpuTier,
      recommendedQuality: browserInfo.recommendedSplineQuality,
      deviceMemory: browserInfo.deviceMemory,
    });
    
    setShouldRender(true); // HERO: Always render
  }, [perf.enable3D, perf.deviceTier]);

  const showSparkles =
    withSparkles &&
    (perf.deviceTier === 'ultra' || perf.deviceTier === 'high') &&
    !perf.isMobile &&
    !hasError;

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

  // Show fallback if error occurred OR device can't handle 3D
  // CLS FIX: Fallback has same dimensions as actual content
  if (hasError || !shouldRender) {
    return (
      <div 
        className={`w-full h-full bg-gradient-to-br from-black via-neutral-950/30 to-black rounded-xl overflow-hidden relative spline-container ${className}`}
        data-spline-scene
        style={{ 
          minHeight: '300px',
          height: '100%',
          contain: 'strict',
        }}
      >
        {/* Unified Shimmer Border */}
        <ShimmerBorder color="blue" intensity="low" speed="slow" />

        {/* Radial glow background - theme aware */}
        <ShimmerRadialGlow color="blue" intensity="low" />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.1)', 
              borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <span className="text-2xl">🚀</span>
          </div>
          <p className="text-xs text-center px-4 theme-accent" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.6)' }}>3D View</p>
          <p className="text-[10px]" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.4)' }}>Optimized for your device</p>
        </div>

        {/* Border glow - theme aware */}
        <div 
          className="absolute inset-0 rounded-xl" 
          style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} 
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative group spline-container ${className}`}
      data-spline-scene
      style={{ 
        minHeight: '300px',
        height: '100%',
        contain: 'layout',
      }}
      // Audio event handlers for 20 unique interaction sounds
      onMouseDown={audioHandlers.onMouseDown}
      onMouseUp={audioHandlers.onMouseUp}
      onMouseEnter={audioHandlers.onMouseEnter}
      onMouseLeave={audioHandlers.onMouseLeave}
      onMouseMove={audioHandlers.onMouseMove}
      onTouchStart={audioHandlers.onTouchStart}
      onTouchEnd={audioHandlers.onTouchEnd}
      onTouchMove={audioHandlers.onTouchMove}
      onWheel={audioHandlers.onWheel}
      onDoubleClick={audioHandlers.onDoubleClick}
      onContextMenu={audioHandlers.onContextMenu}
    >
      
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

      {/* The 3D Scene Layer - pointer-events-none by default on mobile to allow scrolling */}
      <div 
        className={`w-full h-full transition-opacity duration-500 ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ touchAction: isInteractive ? 'none' : 'pan-y' }}
      >
        <Suspense fallback={
          <div className="w-full h-full bg-gradient-to-br from-slate-950 to-neutral-950 flex items-center justify-center relative overflow-hidden">
            <ShimmerRadialGlow color="blue" intensity="medium" />
            <ShimmerSpinner size={32} color="blue" />
          </div>
        }>
          <Spline 
            scene={scene} 
            onLoad={handleLoad} 
            onError={handleError} 
            placeholder={placeholder}
            className="w-full h-full"
            targetFPS={targetFPS ?? (() => {
              // MOBILE CRASH FIX: Cap FPS much lower on mobile
              const isMobile = typeof window !== 'undefined' && /iphone|ipad|ipod|android|mobile/i.test(navigator.userAgent.toLowerCase());
              if (isMobile) return 30; // MOBILE: Always cap at 30fps to prevent crashes
              return perf.deviceTier === 'ultra' ? perf.refreshRate : 
                perf.deviceTier === 'high' ? Math.min(90, perf.refreshRate) : 
                perf.deviceTier === 'medium' ? 60 : 
                45;
            })()}
            maxDpr={(() => {
              const browserInfo = detectBrowser();
              // MOBILE CRASH FIX: Much more conservative DPR on mobile
              const isMobile = typeof window !== 'undefined' && /iphone|ipad|ipod|android|mobile/i.test(navigator.userAgent.toLowerCase());
              const memory = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory || 4 : 4;
              
              if (isMobile) {
                // Very conservative on mobile to prevent crashes
                if (memory < 3) return 0.5;
                if (memory < 4) return 0.75;
                return 1.0; // Max 1.0 on mobile
              }
              
              if (browserInfo.isSmallViewport) return 0.75;
              if (browserInfo.isTinyViewport) return 0.5;
              if (browserInfo.gpuTier === 'low') return 0.8;
              return perf.deviceTier === 'ultra' ? 1.75 : 
                     perf.deviceTier === 'high' ? 1.45 : 
                     perf.deviceTier === 'medium' ? 1.0 : 0.85;
            })()}
            minDpr={0.5}
          />
        </Suspense>
      </div>

      {/* Interaction Toggle Overlay - Tap to interact on mobile */}
      {!isInteractive && !hasError && isVisible && (
        <button
          onClick={() => setIsInteractive(true)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-transparent transition-colors cursor-pointer"
          aria-label="Interact with 3D Scene"
          style={{ touchAction: 'pan-y' }} // Allow scrolling to pass through
        >
          <div className="bg-black/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-2 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity text-sm pointer-events-none">
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
          className="absolute top-3 right-3 z-50 bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg border border-white/20"
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
