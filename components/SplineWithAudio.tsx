"use client";

import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSplineAudio, useSplineAudioHandlers, SplineAudioProfile } from '@/app/hooks/useSplineAudio';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';

// Dynamic import for the heavy Spline runtime
const SplineBase = dynamic(() => import('@/lib/spline-wrapper'), { 
  ssr: false,
  loading: () => null 
});

interface SplineWithAudioProps {
  scene: string;
  className?: string;
  placeholder?: string | null;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  priority?: boolean;
  isHero?: boolean;
  targetFPS?: number;
  maxDpr?: number;
  minDpr?: number;
  // Audio-specific props
  audioEnabled?: boolean;
  audioProfile?: SplineAudioProfile;
  audioVolume?: number;
}

/**
 * SplineWithAudio - Spline 3D component with 20 unique interaction sounds
 * 
 * Interaction Types:
 * - Click sounds (click, doubleClick, longPress)
 * - Hover sounds (hover, hoverExit)
 * - Drag sounds (drag, dragStart, dragEnd)
 * - Scroll/Zoom sounds (scroll, zoom, rotate)
 * - Touch sounds (touch, touchEnd)
 * - Swipe sounds (swipeLeft, swipeRight, swipeUp, swipeDown)
 * - Multi-touch sounds (pinch, spread)
 * - Object interaction (objectSelect)
 * 
 * Audio Profiles:
 * - CYBER: Futuristic electronic sounds
 * - ORGANIC: Natural, soft sounds
 * - MECHANICAL: Industrial, mechanical sounds
 * - SILENT: No audio
 */
function SplineWithAudioComponent({
  scene,
  className = '',
  placeholder,
  onLoad,
  onError,
  priority = false,
  isHero = false,
  targetFPS,
  maxDpr,
  minDpr,
  audioEnabled = true,
  audioProfile = 'CYBER',
  audioVolume = 0.4,
}: SplineWithAudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clickRipples, setClickRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [interactionHint, setInteractionHint] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const rippleIdRef = useRef(0);
  
  // Get global theme for potential audio profile syncing
  const { activeTheme } = useGlobalTheme();
  
  // Determine audio profile based on theme or prop
  const effectiveAudioProfile: SplineAudioProfile = (() => {
    if (!audioEnabled) return 'SILENT';
    if (audioProfile !== 'CYBER') return audioProfile;
    
    // Auto-sync with theme categories
    const category = activeTheme?.category?.toLowerCase() || '';
    if (category.includes('nature') || category.includes('organic')) return 'ORGANIC';
    if (category.includes('industrial') || category.includes('mechanical')) return 'MECHANICAL';
    return 'CYBER';
  })();
  
  // Initialize Spline audio engine
  const audioPlayer = useSplineAudio({
    enabled: audioEnabled,
    profile: effectiveAudioProfile,
    volume: audioVolume,
  });
  
  // Get all audio event handlers
  const audioHandlers = useSplineAudioHandlers(audioPlayer, containerRef);

  // Initialize audio on first user interaction
  useEffect(() => {
    if (!audioEnabled) return;
    
    const initAudio = () => {
      audioPlayer.init();
    };
    
    // Try to init immediately (may fail without user gesture)
    audioPlayer.init();
    
    // Also listen for first interaction
    const container = containerRef.current;
    if (container) {
      container.addEventListener('pointerdown', initAudio, { once: true });
      container.addEventListener('touchstart', initAudio, { once: true });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('pointerdown', initAudio);
        container.removeEventListener('touchstart', initAudio);
      }
    };
  }, [audioEnabled, audioPlayer]);

  // Track interaction state for touch handling
  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setTimeout(() => setIsInteracting(false), 300);
  }, []);

  // Add ripple effect at position
  const addRipple = useCallback((x: number, y: number) => {
    rippleIdRef.current += 1;
    const newRipple = { x, y, id: rippleIdRef.current };
    setClickRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setClickRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 700);
  }, []);

  // Handle load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Combined handlers that include both audio and interaction tracking + visual feedback
  const combinedHandlers = {
    onMouseDown: (e: React.MouseEvent) => {
      handleInteractionStart();
      setIsDragging(true);
      setInteractionHint('🔄 Drag to rotate');
      // Add ripple at click position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        addRipple(e.clientX - rect.left, e.clientY - rect.top);
      }
      audioHandlers.onMouseDown(e);
    },
    onMouseUp: (e: React.MouseEvent) => {
      handleInteractionEnd();
      setIsDragging(false);
      setInteractionHint(isHovering ? '👆 Click & drag' : '');
      audioHandlers.onMouseUp(e);
    },
    onMouseEnter: (e: React.MouseEvent) => {
      setIsHovering(true);
      setInteractionHint('👆 Click & drag to explore');
      audioHandlers.onMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleInteractionEnd();
      setIsHovering(false);
      setIsDragging(false);
      setInteractionHint('');
      audioHandlers.onMouseLeave(e);
    },
    onMouseMove: audioHandlers.onMouseMove,
    onTouchStart: (e: React.TouchEvent) => {
      handleInteractionStart();
      setIsDragging(true);
      setInteractionHint('🔄 Drag to rotate');
      // Add ripple at touch position
      if (e.touches[0] && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        addRipple(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      }
      audioHandlers.onTouchStart(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      handleInteractionEnd();
      setIsDragging(false);
      setInteractionHint('');
      audioHandlers.onTouchEnd(e);
    },
    onTouchMove: audioHandlers.onTouchMove,
    onWheel: (e: React.WheelEvent) => {
      setInteractionHint('🔍 Zooming');
      audioHandlers.onWheel(e);
      setTimeout(() => setInteractionHint(''), 800);
    },
    onDoubleClick: (e: React.MouseEvent) => {
      setInteractionHint('⚡ Double tap!');
      audioHandlers.onDoubleClick(e);
      setTimeout(() => setInteractionHint(''), 800);
    },
    onContextMenu: audioHandlers.onContextMenu,
  };

  return (
    <div
      ref={containerRef}
      className={`spline-audio-container relative w-full h-full ${className}`}
      style={{
        touchAction: isHero ? 'pan-y' : (isInteracting ? 'none' : 'pan-y'),
      }}
      {...combinedHandlers}
    >
      {/* VISUAL INTERACTION FEEDBACK LAYER */}
      
      {/* Hover glow effect - subtle edge glow on hover */}
      <AnimatePresence>
        {isHovering && !isDragging && isHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[5] pointer-events-none rounded-xl"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(var(--accent-rgb, 59, 130, 246), 0.08) 0%, transparent 70%)',
              boxShadow: 'inset 0 0 60px rgba(var(--accent-rgb, 59, 130, 246), 0.1)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Active/Dragging glow effect - more intense */}
      <AnimatePresence>
        {isDragging && isHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-[5] pointer-events-none rounded-xl"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(var(--accent-rgb, 59, 130, 246), 0.15) 0%, transparent 60%)',
              boxShadow: 'inset 0 0 80px rgba(var(--accent-rgb, 59, 130, 246), 0.2), 0 0 40px rgba(var(--accent-rgb, 59, 130, 246), 0.15)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Click/Touch ripple effects */}
      {isHero && clickRipples.map((ripple) => (
        <motion.div
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 5, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute z-[6] pointer-events-none rounded-full"
          style={{
            left: ripple.x - 30,
            top: ripple.y - 30,
            width: 60,
            height: 60,
            background: 'radial-gradient(circle, rgba(var(--accent-rgb, 59, 130, 246), 0.5) 0%, transparent 70%)',
          }}
        />
      ))}

      {/* Interaction hint tooltip */}
      <AnimatePresence>
        {interactionHint && isHero && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-24 md:bottom-32 left-1/2 transform -translate-x-1/2 z-[20] pointer-events-none"
          >
            <div 
              className="px-5 py-2.5 rounded-full backdrop-blur-xl text-sm font-semibold shadow-2xl flex items-center gap-2"
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1.5px solid rgba(var(--accent-rgb, 59, 130, 246), 0.5)',
                color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.2)',
              }}
            >
              {interactionHint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner status indicator */}
      {isHero && isLoaded && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="absolute top-4 left-4 z-[15] pointer-events-none"
        >
          <div 
            className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.35)',
            }}
          >
            <motion.div
              animate={isDragging ? { 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: 0.4, repeat: isDragging ? Infinity : 0 }}
              className="text-base"
            >
              {isDragging ? '🔄' : isHovering ? '👆' : '🎮'}
            </motion.div>
            <span 
              className="text-xs font-medium"
              style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.9)' }}
            >
              {isDragging ? 'Rotating' : isHovering ? 'Interactive' : '3D Scene'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Initial interaction prompt - shows briefly after load on mobile */}
      <AnimatePresence>
        {isHero && isLoaded && !isHovering && !isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 4, times: [0, 0.1, 0.8, 1], delay: 1.5 }}
            className="absolute inset-0 z-[10] pointer-events-none flex items-center justify-center md:hidden"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: 2, ease: 'easeInOut' }}
              className="px-6 py-3 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid rgba(var(--accent-rgb, 59, 130, 246), 0.6)',
                boxShadow: '0 0 40px rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
              }}
            >
              <motion.span 
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl"
              >
                🖐️
              </motion.span>
              <div className="flex flex-col">
                <span 
                  className="font-bold text-sm"
                  style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 1)' }}
                >
                  Touch to interact
                </span>
                <span className="text-xs text-white/60">
                  Drag to explore 3D
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The actual Spline scene */}
      <SplineBase
        scene={scene}
        placeholder={placeholder}
        className="w-full h-full"
        onLoad={handleLoad}
        onError={onError}
        priority={priority}
        isHero={isHero}
        targetFPS={targetFPS}
        maxDpr={maxDpr}
        minDpr={minDpr}
      />
      
      {/* Audio feedback indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && audioPlayer.isInitialized && (
        <div className="absolute top-2 right-2 text-[10px] text-white/40 bg-black/20 px-1 rounded pointer-events-none">
          🔊 {effectiveAudioProfile}
        </div>
      )}
    </div>
  );
}

export const SplineWithAudio = memo(SplineWithAudioComponent);
export default SplineWithAudio;
