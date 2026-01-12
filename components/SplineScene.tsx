"use client";

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect, memo } from 'react';
import { detectRefreshRate } from '@/lib/use120Hz';

interface SplineWrapperProps {
  scene: string;
  className?: string;
  placeholder?: string | null; 
  onLoad?: () => void;
  onError?: (error: Error) => void;
  withSparkles?: boolean;
  optimizeForMobile?: boolean;
  targetFPS?: number; // New: Allow custom FPS target (up to 120)
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

// Device tier detection (enhanced for 120Hz support on ALL devices)
const getDeviceTier = (): 'ultra' | 'high' | 'medium' | 'low' => {
  if (typeof window === 'undefined') return 'high';
  
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const isMobile = window.innerWidth < 768;
  const isSmallScreen = window.innerWidth < 480;
  const isVeryLowMemory = memory < 4;
  const isLowCores = cores < 4;
  const refreshRate = detectRefreshRate();
  const ua = navigator.userAgent.toLowerCase();
  
  // ENHANCED: Apple Silicon detection for Macs
  const isMac = /macintosh|mac os x/i.test(ua);
  let isAppleSilicon = false;
  if (isMac && !isMobile) {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          isAppleSilicon = renderer.includes('apple') && (renderer.includes('gpu') || /m[1-9]/.test(renderer));
        }
      }
    } catch (e) {}
    // Fallback: 8+ core Mac is likely Apple Silicon
    if (!isAppleSilicon && cores >= 8) {
      isAppleSilicon = true;
    }
  }
  
  // High-refresh mobile devices (iPhone Pro, iPad Pro) get tier upgrade
  const isHighRefreshMobile = isMobile && refreshRate >= 120;
  
  // Force low tier for very small screens or low specs to prevent crashes
  if (isSmallScreen || (isMobile && !isHighRefreshMobile && (isVeryLowMemory || isLowCores))) {
    return 'low';
  }
  
  // ENHANCED: Apple Silicon Macs get ULTRA tier
  if (isAppleSilicon) {
    console.log('[SplineScene] 🍎 Apple Silicon detected - ULTRA tier');
    return 'ultra';
  }
  
  // High-end desktop with discrete GPU or lots of RAM
  if (!isMobile) {
    // Check for discrete GPU
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          const hasDiscreteGPU = renderer.includes('nvidia') || renderer.includes('geforce') || 
                                  renderer.includes('radeon') || renderer.includes('amd') ||
                                  renderer.includes('rtx') || renderer.includes('gtx');
          if (hasDiscreteGPU && memory >= 8) {
            console.log('[SplineScene] 🎮 Discrete GPU detected - ULTRA tier');
            return 'ultra';
          }
        }
      }
    } catch (e) {}
    
    // High-spec desktop: 16GB+ RAM, 8+ cores
    if (memory >= 16 && cores >= 8) {
      return 'ultra';
    }
    
    // Good desktop: 8GB+ RAM, 4+ cores
    if (memory >= 8 && cores >= 4) {
      return 'high';
    }
    
    // Basic desktop
    return memory >= 4 ? 'medium' : 'low';
  }
  
  // ProMotion devices get medium or high based on specs
  if (isHighRefreshMobile) {
    return memory >= 4 && cores >= 4 ? 'high' : 'medium';
  }
  
  if (isMobile) {
    return memory >= 6 && cores >= 6 ? 'medium' : 'low';
  }
  return memory >= 8 && cores >= 8 ? 'high' : 'medium';
};

// Check if device can handle 3D scenes safely
const canRender3D = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const memory = (navigator as any).deviceMemory || 4;
  const isSmallScreen = window.innerWidth < 480;
  const isMobile = window.innerWidth < 768;
  
  // Disable 3D on very small screens or very low memory devices
  if (isSmallScreen) return false;
  if (isMobile && memory < 3) return false;
  
  return true;
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
  const [deviceTier, setDeviceTier] = useState<'ultra' | 'high' | 'medium' | 'low'>('medium');
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Detect device tier and rendering capability once
  useEffect(() => {
    const tier = getDeviceTier();
    setDeviceTier(tier);
    
    // Skip 3D rendering only on LOW tier devices
    // ENHANCED: Ultra and High tier always render
    const canRender = canRender3D();
    setShouldRender(canRender && tier !== 'low');
    
    if (!canRender || tier === 'low') {
      console.log('🔒 3D scenes disabled for device protection');
    } else {
      console.log(`✅ 3D scenes enabled - Device tier: ${tier.toUpperCase()}`);
    }
  }, []);

  // ENHANCED: Show sparkles on ultra AND high-end devices
  const showSparkles = withSparkles && (deviceTier === 'ultra' || deviceTier === 'high') && !hasError;
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

  // Show fallback if error occurred OR device can't handle 3D
  if (hasError || !shouldRender) {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-black via-blue-950/30 to-black rounded-xl overflow-hidden relative ${className}`}>
        {/* Animated gradient background fallback */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent animate-pulse" />
        
        {/* Shimmer effect like navbar */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#00000000_50%)] opacity-20" />
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

      {/* The 3D Scene Layer - pointer-events-none by default on mobile to allow scrolling */}
      <div 
        className={`w-full h-full transition-opacity duration-500 ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ touchAction: isInteractive ? 'none' : 'pan-y' }}
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

      {/* Interaction Toggle Overlay - Tap to interact on mobile */}
      {!isInteractive && !hasError && isVisible && (
        <button
          onClick={() => setIsInteractive(true)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-transparent hover:bg-black/5 transition-colors cursor-pointer"
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