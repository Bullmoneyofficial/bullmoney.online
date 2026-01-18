"use client";

import React, { useRef, useCallback, useEffect, useState, memo } from 'react';
import dynamic from 'next/dynamic';
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

  // Combined handlers that include both audio and interaction tracking
  const combinedHandlers = {
    onMouseDown: (e: React.MouseEvent) => {
      handleInteractionStart();
      audioHandlers.onMouseDown(e);
    },
    onMouseUp: (e: React.MouseEvent) => {
      handleInteractionEnd();
      audioHandlers.onMouseUp(e);
    },
    onMouseEnter: audioHandlers.onMouseEnter,
    onMouseLeave: (e: React.MouseEvent) => {
      handleInteractionEnd();
      audioHandlers.onMouseLeave(e);
    },
    onMouseMove: audioHandlers.onMouseMove,
    onTouchStart: (e: React.TouchEvent) => {
      handleInteractionStart();
      audioHandlers.onTouchStart(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      handleInteractionEnd();
      audioHandlers.onTouchEnd(e);
    },
    onTouchMove: audioHandlers.onTouchMove,
    onWheel: audioHandlers.onWheel,
    onDoubleClick: audioHandlers.onDoubleClick,
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
      <SplineBase
        scene={scene}
        placeholder={placeholder}
        className="w-full h-full"
        onLoad={onLoad}
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
