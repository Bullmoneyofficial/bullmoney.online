"use client";

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect, memo, useRef, useCallback } from 'react';
import { detectBrowser } from '@/lib/browserDetection';
import { ShimmerSpinner, ShimmerRadialGlow, ShimmerBorder } from '@/components/ui/UnifiedShimmer';
import { useUnifiedPerformance } from '@/lib/UnifiedPerformanceSystem';
import { useSplineAudio, useSplineAudioHandlers, SplineAudioProfile } from '@/app/hooks/useSplineAudio';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // UPDATED 2026.1.22: Start interactive by default on all devices
  const [isInteractive, setIsInteractive] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [interactionHint, setInteractionHint] = useState<string>('');
  const perf = useUnifiedPerformance();
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

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

  // Visual feedback handlers
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setIsHovering(true);
    setInteractionHint('👆 Click to interact');
    audioHandlers.onMouseEnter(e);
  }, [audioHandlers]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    setIsHovering(false);
    setIsDragging(false);
    setInteractionHint('');
    audioHandlers.onMouseLeave(e);
  }, [audioHandlers]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    // Create ripple effect at click position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      rippleIdRef.current += 1;
      setClickRipple({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        id: rippleIdRef.current
      });
      // Clear ripple after animation
      setTimeout(() => setClickRipple(null), 600);
    }
    setInteractionHint('🔄 Drag to rotate');
    audioHandlers.onMouseDown(e);
  }, [audioHandlers]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setIsDragging(false);
    setInteractionHint(isHovering ? '👆 Click to interact' : '');
    audioHandlers.onMouseUp(e);
  }, [audioHandlers, isHovering]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setInteractionHint('🔄 Drag to rotate');
    // Create ripple at touch position
    if (e.touches[0] && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      rippleIdRef.current += 1;
      setClickRipple({
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
        id: rippleIdRef.current
      });
      setTimeout(() => setClickRipple(null), 600);
    }
    audioHandlers.onTouchStart(e);
  }, [audioHandlers]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsDragging(false);
    setInteractionHint('');
    audioHandlers.onTouchEnd(e);
  }, [audioHandlers]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    setInteractionHint('🔍 Scrolling to zoom');
    audioHandlers.onWheel(e);
    // Clear hint after a delay
    setTimeout(() => setInteractionHint(''), 1000);
  }, [audioHandlers]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    setInteractionHint('⚡ Double-clicked!');
    audioHandlers.onDoubleClick(e);
    setTimeout(() => setInteractionHint(''), 1000);
  }, [audioHandlers]);

  // HERO MODE: Always render on ALL devices - NO FALLBACKS EVER
  // Updated 2026.1.22: Removed all fallback conditions
  useEffect(() => {
    const browserInfo = detectBrowser();
    
    // FORCE RENDER: Always render Spline on ALL devices
    // Quality will be automatically reduced for low-end devices
    console.log('[SplineScene] FORCE RENDER MODE: Spline enabled on ALL devices', {
      browserName: browserInfo.browserName,
      gpuTier: browserInfo.gpuTier,
      recommendedQuality: browserInfo.recommendedSplineQuality,
      deviceMemory: browserInfo.deviceMemory,
    });
    
    setShouldRender(true); // ALWAYS render - no fallbacks
    setHasError(false); // Reset any previous error state
  }, [perf.enable3D, perf.deviceTier]);

  const showSparkles =
    withSparkles &&
    (perf.deviceTier === 'ultra' || perf.deviceTier === 'high') &&
    !perf.isMobile &&
    !hasError;

  // Handle spline loading errors gracefully - but DON'T stop rendering
  // UPDATED 2026.1.22: Log error but keep trying to render
  const handleError = (error: Error) => {
    console.error(`❌ Spline load issue for ${scene}:`, error);
    // DON'T set hasError - let spline-wrapper handle retries
    // setHasError(true); // REMOVED - keep rendering
    if (onError) onError(error);
  };

  const handleLoad = () => {
    setIsVisible(true);
    setHasError(false); // Clear any previous error state on successful load
    if (onLoad) onLoad();
  };

  // UPDATED 2026.1.22: NEVER show fallback - always attempt to render Spline
  // Even if error occurs, we retry with reduced quality instead of showing fallback
  // Only show fallback if we explicitly catch an unrecoverable WebGL error
  const showFallback = false; // NEVER show fallback
  
  if (showFallback) {
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
              backgroundColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.1)', 
              borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
          >
            <span className="text-2xl">🚀</span>
          </div>
          <p className="text-xs text-center px-4 theme-accent" style={{ color: 'rgba(var(--accent-rgb, 255, 255, 255), 0.6)' }}>3D View</p>
          <p className="text-[10px]" style={{ color: 'rgba(var(--accent-rgb, 255, 255, 255), 0.4)' }}>Optimized for your device</p>
        </div>

        {/* Border glow - theme aware */}
        <div 
          className="absolute inset-0 rounded-xl" 
          style={{ borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} 
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full relative group spline-container ${className}`}
      data-spline-scene
      data-interactive="true"
      style={{ 
        minHeight: '300px',
        height: '100%',
        contain: 'layout',
        touchAction: 'manipulation',
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      // Enhanced event handlers with visual feedback
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={audioHandlers.onMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={audioHandlers.onTouchMove}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={audioHandlers.onContextMenu}
    >
      
      {/* INTERACTION VISUAL FEEDBACK LAYER */}
      
      {/* Hover glow effect */}
      <AnimatePresence>
        {isHovering && !isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[2] pointer-events-none rounded-xl"
            style={{
              background: 'radial-gradient(circle at center, rgba(var(--accent-rgb, 255, 255, 255), 0.1) 0%, transparent 70%)',
              boxShadow: 'inset 0 0 30px rgba(var(--accent-rgb, 255, 255, 255), 0.15)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Drag/Active glow effect */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-[2] pointer-events-none rounded-xl"
            style={{
              background: 'radial-gradient(circle at center, rgba(var(--accent-rgb, 255, 255, 255), 0.2) 0%, transparent 60%)',
              boxShadow: 'inset 0 0 50px rgba(var(--accent-rgb, 255, 255, 255), 0.25), 0 0 20px rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Click ripple effect */}
      <AnimatePresence>
        {clickRipple && (
          <motion.div
            key={clickRipple.id}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute z-[3] pointer-events-none rounded-full"
            style={{
              left: clickRipple.x - 25,
              top: clickRipple.y - 25,
              width: 50,
              height: 50,
              background: 'radial-gradient(circle, rgba(var(--accent-rgb, 255, 255, 255), 0.6) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Interaction hint tooltip */}
      <AnimatePresence>
        {interactionHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[20] pointer-events-none"
          >
            <div 
              className="px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium shadow-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.4)',
                color: 'rgba(var(--accent-rgb, 255, 255, 255), 1)',
              }}
            >
              {interactionHint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner interaction indicators */}
      <div className="absolute top-3 left-3 z-[15] pointer-events-none">
        <AnimatePresence>
          {isVisible && !hasError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
              }}
            >
              <motion.div
                animate={{ 
                  scale: isDragging ? [1, 1.2, 1] : [1, 1.1, 1],
                  rotate: isDragging ? [0, 10, -10, 0] : 0
                }}
                transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                className="text-sm"
              >
                {isDragging ? '🔄' : isHovering ? '👆' : '🎮'}
              </motion.div>
              <span 
                className="text-xs font-medium"
                style={{ color: 'rgba(var(--accent-rgb, 255, 255, 255), 0.9)' }}
              >
                {isDragging ? 'Rotating' : isHovering ? 'Interactive' : '3D Scene'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
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

      {/* The 3D Scene Layer - ALWAYS interactive on mobile and desktop */}
      <div 
        className="w-full h-full transition-opacity duration-500 pointer-events-auto"
        style={{ touchAction: 'manipulation', cursor: isDragging ? 'grabbing' : 'grab' }}
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

      {/* Interaction Toggle Overlay - Only shown if isInteractive is false (no longer the default) */}
      {!isInteractive && !hasError && isVisible && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          onClick={() => setIsInteractive(true)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-transparent transition-colors cursor-pointer"
          aria-label="Interact with 3D Scene"
          style={{ touchAction: 'manipulation' }}
        >
          {/* Pulsing interaction prompt - always visible on mobile, hover on desktop */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="md:opacity-0 md:group-hover:opacity-100 transition-all duration-300"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 0 20px rgba(var(--accent-rgb, 255, 255, 255), 0.3)',
                  '0 0 40px rgba(var(--accent-rgb, 255, 255, 255), 0.5)',
                  '0 0 20px rgba(var(--accent-rgb, 255, 255, 255), 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="px-6 py-3 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid rgba(var(--accent-rgb, 255, 255, 255), 0.5)',
              }}
            >
              <motion.span 
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-2xl"
              >
                🖐️
              </motion.span>
              <div className="flex flex-col">
                <span 
                  className="font-bold text-base"
                  style={{ color: 'rgba(var(--accent-rgb, 255, 255, 255), 1)' }}
                >
                  Interact with 3D
                </span>
                <span className="text-xs text-white/60">
                  Click & drag to explore
                </span>
              </div>
            </motion.div>
          </motion.div>
        </motion.button>
      )}

      {/* Exit Interaction Button - More visible */}
      <AnimatePresence>
        {isInteractive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsInteractive(false);
            }}
            className="absolute top-3 right-3 z-50 backdrop-blur-xl text-white px-4 py-2 rounded-full hover:scale-105 transition-all flex items-center gap-2 shadow-2xl"
            style={{ 
              touchAction: 'manipulation',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '2px solid rgba(var(--accent-rgb, 255, 255, 255), 0.5)',
            }}
            aria-label="Exit interaction"
          >
            <span className="text-sm font-medium" style={{ color: 'rgba(var(--accent-rgb, 255, 255, 255), 1)' }}>Exit</span>
            <span>✕</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(SplineSceneComponent);
