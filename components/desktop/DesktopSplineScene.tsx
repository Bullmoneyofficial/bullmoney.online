"use client";

/**
 * DESKTOP SPLINE SCENE
 * Enhanced Spline scene for desktop with full-quality rendering
 * Supports screens from 1024px to 8K (7680px)
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnifiedPerformance } from '@/lib/UnifiedPerformanceSystem';

// Use the same SplineWithAudio component for consistency
const SplineWithAudio = dynamic(() => import('@/components/SplineWithAudio'), { 
  ssr: false,
  loading: () => null
}) as any;

// Calculate optimal DPR based on screen resolution
function getOptimalDpr(): number {
  if (typeof window === 'undefined') return 1.5;
  
  const width = window.screen.width;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  if (width >= 7680) return Math.min(devicePixelRatio, 2.5); // 8K
  if (width >= 5120) return Math.min(devicePixelRatio, 2.25); // 5K
  if (width >= 3840) return Math.min(devicePixelRatio, 2.0); // 4K
  if (width >= 2560) return Math.min(devicePixelRatio, 1.75); // 2.5K
  if (width >= 1920) return Math.min(devicePixelRatio, 1.5); // 1080p
  return Math.min(devicePixelRatio, 1.25); // 1024px+
}

interface DesktopSplineSceneProps {
  scene: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  heroMode?: boolean;
  audioEnabled?: boolean;
  audioProfile?: 'CYBER' | 'ORGANIC' | 'MECHANICAL' | 'SILENT';
  audioVolume?: number;
}

function DesktopSplineSceneComponent({
  scene,
  className = '',
  placeholder,
  onLoad,
  onError,
  heroMode = false,
  audioEnabled = true,
  audioProfile = 'CYBER',
  audioVolume = 0.4,
}: DesktopSplineSceneProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isBatterySaving, setIsBatterySaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { deviceTier, averageFps } = useUnifiedPerformance();
  const optimalDpr = getOptimalDpr();
  
  // Listen for battery saver events
  useEffect(() => {
    const handleFreeze = () => {
      console.log('[DesktopSplineScene] 🔋 Battery saver active');
      setIsBatterySaving(true);
    };
    const handleUnfreeze = () => {
      console.log('[DesktopSplineScene] ⚡ Battery saver off');
      setIsBatterySaving(false);
    };
    
    window.addEventListener('bullmoney-freeze', handleFreeze);
    window.addEventListener('bullmoney-unfreeze', handleUnfreeze);
    return () => {
      window.removeEventListener('bullmoney-freeze', handleFreeze);
      window.removeEventListener('bullmoney-unfreeze', handleUnfreeze);
    };
  }, []);
  
  // Preload the scene
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Add preload link
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = scene;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    // Warm cache
    fetch(scene, { 
      method: 'GET', 
      mode: 'cors',
      cache: 'force-cache',
    }).catch(() => {});
    
    return () => {
      link.remove();
    };
  }, [scene]);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
    console.log(`[DesktopSplineScene] Loaded: ${scene}`);
  }, [scene, onLoad]);
  
  const handleError = useCallback((error: any) => {
    const errorMsg = error?.message || String(error);
    if (errorMsg.includes('buffer') || errorMsg.includes('deserialize')) {
      console.warn(`[DesktopSplineScene] Buffer warning (handled):`, errorMsg);
      return;
    }
    console.error(`[DesktopSplineScene] Error:`, errorMsg);
    setHasError(true);
    onError?.(error);
  }, [onError]);
  
  // Error fallback
  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={`desktop-spline-error relative w-full h-full ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/15 to-black/50 flex items-center justify-center">
          <div className="text-center text-white/60">
            <div className="text-4xl mb-4">🎮</div>
            <div className="text-sm">3D Scene Loading...</div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`desktop-spline-scene relative w-full h-full ${className}`}
      style={{
        contain: heroMode ? 'none' : 'layout style',
        touchAction: 'pan-y pinch-zoom',
        overflow: 'visible',
        pointerEvents: 'auto',
      }}
    >
      {/* Loading indicator */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <div className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Spline Scene - Hidden during battery save mode */}
      {!isBatterySaving && (
        <SplineWithAudio
          scene={scene}
          placeholder={placeholder}
          onLoad={handleLoad}
          onError={handleError}
          className="!w-full !h-full"
          priority={heroMode}
          isHero={heroMode}
          targetFPS={60}
          maxDpr={optimalDpr}
          minDpr={1.0}
          audioEnabled={audioEnabled}
          audioProfile={audioProfile}
          audioVolume={audioVolume}
        />
      )}
      
      {/* Battery saver placeholder */}
      {isBatterySaving && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">🔋</div>
            <div className="text-xs text-neutral-500">Battery Saver</div>
          </div>
        </div>
      )}
    </div>
  );
}

export const DesktopSplineScene = memo(DesktopSplineSceneComponent);
export default DesktopSplineScene;
