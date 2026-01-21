"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, useDragControls, PanInfo } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { IconX, IconGripVertical, IconVolume, IconVolumeOff, IconLock, IconCamera, IconInfoCircle, IconChevronUp, IconPlayerPlay, IconPlayerPause, IconBrandSpotify, IconBrandApple, IconBrandYoutube, IconFlare, IconSwitchHorizontal, IconChevronLeft, IconChevronRight, IconMusic } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { CompactGameHUD, BoredPopup, SparkleBurst, ConfettiBurst, PulseRing } from "@/components/audio-widget/ui";
import { MinimizedPlayer } from "@/components/audio-widget/MinimizedPlayer";
import { sourceLabel, sourceIcons } from "./constants";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";

// Z-Index Constants - Centralized for consistency
// Using very high values to ensure ALL elements render ABOVE everything else
// Hierarchy: Base < Controls < HUD < Effects < Hints < Helpers < Tutorial < Tooltips < Modal
const Z_INDEX = {
  PULL_TAB: 2147483600,        // Minimized pull tab - high priority
  PLAYER_BASE: 2147483610,     // Main iPhone container
  PLAYER_CONTROLS: 2147483620, // Volume, power buttons
  VOLUME_SLIDER: 2147483630,   // Volume overlay
  LOCK_SCREEN: 2147483640,     // Lock screen overlay
  GAME_HUD: 2147483650,        // Game score HUD
  EFFECTS: 2147483660,         // Sparkles, confetti
  SWIPE_HINT: 2147483670,      // "Swipe to minimize" hint
  HELPERS: 2147483680,         // First time help tips
  TUTORIAL: 2147483690,        // Game tutorial - MUST be above iPhone
  TOOLTIPS: 2147483695,        // Button tooltips - highest UI element
  CAMERA_MODAL: 2147483647,    // Camera modal - max safe integer
} as const;

// Export for external components (like QuickGameTutorial)
export { Z_INDEX };

interface FloatingPlayerProps {
  miniPlayerRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  playerHidden: boolean;
  setPlayerHidden: (v: boolean) => void;
  isStreamingSource: boolean;
  streamingEmbedUrl: string | null;
  streamingActive: boolean;
  setStreamingActive: (v: boolean) => void;
  musicSource: MusicSource;
  setMusicEnabled: (v: boolean) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeKey: number;
  
  // Game state
  isWandering: boolean;
  wanderPosition: { x: number; y: number };
  morphPhase: string;
  isHovering: boolean;
  setIsHovering: (v: boolean) => void;
  isNearPlayer: boolean;
  isFleeing: boolean;
  isReturning: boolean;
  movementStyle: string;
  speedMultiplier: number;
  fleeDirection: { x: number; y: number };
  handlePlayerInteraction: () => void;
  energy: number;
  combo: number;
  getTirednessLevel: () => "tired" | "fresh" | "active" | "exhausted";
  gameStats: { currentScore: number; highScore: number; gamesPlayed: number; totalCatches: number };
  gameState: string;
  
  // Mobile
  isMobile: boolean;
  
  // Tutorial
  hasStartedCatchGame: boolean;
  maybeShowCatchGameTutorial: (hasStarted: boolean) => void;
  dismissCatchGameTutorial: () => void;
  isTutorialHovered: boolean;
  
  // Effects
  showBoredPopup: boolean;
  setShowBoredPopup: (v: boolean) => void;
  showCatchSparkle: boolean;
  showConfetti: boolean;
  
  // Tutorial
  showCatchGameTutorial?: boolean;
  tutorialContent?: React.ReactNode;
  
  // Optional callbacks for external state sync
  onPlayerSideChange?: (side: 'left' | 'right') => void;
  onMinimizedChange?: (minimized: boolean) => void;
  onPlayerPositionUpdate?: (position: { x: number; y: number; width: number; height: number }) => void;

  // Force minimize from parent (UIStateContext) - used when other UI components open
  // This minimizes the player (hides iframe behind pull tab) but keeps it mounted for audio persistence
  forceMinimize?: boolean;

  // Parent-controlled minimized state (for reload persistence)
  playerMinimized?: boolean;
  setPlayerMinimized?: (v: boolean) => void;
}

function CameraModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md"
        style={{ zIndex: Z_INDEX.CAMERA_MODAL }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[85vw] max-w-[340px] aspect-[9/16] rounded-[45px] overflow-hidden bg-black"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-slate-900" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10"
          >
            <IconX className="w-5 h-5 text-white" />
          </button>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white/70">Camera unavailable</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const ButtonTooltip = React.memo(function ButtonTooltip({
  show,
  text,
  position = "right",
  color = "blue",
}: {
  show: boolean;
  text: string;
  position?: "right" | "left" | "top" | "bottom";
  color?: "blue" | "purple" | "red" | "green" | "orange";
}) {
  if (!show) return null;

  const colorClasses = {
    blue: "from-blue-600/95 via-cyan-500/95 to-blue-600/95 border-blue-400/50 shadow-blue-500/30",
    purple: "from-purple-600/95 via-pink-500/95 to-purple-600/95 border-purple-400/50 shadow-purple-500/30",
    red: "from-red-600/95 via-rose-500/95 to-red-600/95 border-red-400/50 shadow-red-500/30",
    green: "from-green-600/95 via-emerald-500/95 to-green-600/95 border-green-400/50 shadow-green-500/30",
    orange: "from-orange-600/95 via-amber-500/95 to-orange-600/95 border-orange-400/50 shadow-orange-500/30",
  };

  const positionClasses = {
    right: "left-full ml-3 top-1/2 -translate-y-1/2",
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={cn("absolute whitespace-nowrap pointer-events-none", positionClasses[position])}
      style={{ zIndex: Z_INDEX.TOOLTIPS }}
    >
      <div
        className={cn(
          "px-3 py-2 rounded-xl text-white text-[10px] font-semibold shadow-xl backdrop-blur-md border bg-gradient-to-r",
          colorClasses[color]
        )}
      >
        {text}
      </div>
    </motion.div>
  );
});

// Main iPhone 17 Floating Player
export const FloatingPlayer = React.memo(function FloatingPlayer(props: FloatingPlayerProps) {
  const {
    miniPlayerRef, open, playerHidden, setPlayerHidden,
    isStreamingSource, streamingEmbedUrl, streamingActive, setStreamingActive,
    musicSource, setMusicEnabled, iframeRef, iframeKey,
    isWandering, wanderPosition, morphPhase, isHovering, setIsHovering,
    isNearPlayer, isFleeing, isReturning, movementStyle, speedMultiplier, fleeDirection,
    handlePlayerInteraction, energy, combo, getTirednessLevel, gameStats,
    isMobile, hasStartedCatchGame, maybeShowCatchGameTutorial, dismissCatchGameTutorial,
    isTutorialHovered, showBoredPopup, setShowBoredPopup, showCatchSparkle, showConfetti,
    showCatchGameTutorial, tutorialContent,
    forceMinimize = false, playerMinimized = false, setPlayerMinimized,
  } = props;

  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();
  const { shouldSkipHeavyEffects } = useMobilePerformance();
  
  // iPhone UI States
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Position state - left or right side of screen
  const [playerSide, setPlayerSide] = useState<'left' | 'right'>('left');
  // Initialize from parent's playerMinimized prop (true on reload for pull-tab-only behavior)
  const [isMinimized, setIsMinimizedInternal] = useState(playerMinimized);
  const [isDragging, setIsDragging] = useState(false);

  // Wrapper to sync minimized state with parent
  const setIsMinimized = useCallback((value: boolean) => {
    setIsMinimizedInternal(value);
    setPlayerMinimized?.(value);
  }, [setPlayerMinimized]);
  
  // Button hover states for tooltips
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(true);
  
  // Scroll-based minimization for mobile - separates iframe from main player
  const [isScrollMinimized, setIsScrollMinimized] = useState(false);
  // Scroll-based compacting for pull tab when minimized
  const [isPullTabCompact, setIsPullTabCompact] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pullTabScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  
  // Pin state for pull tab animations (matching UnifiedFpsPill behavior)
  const [isPulltabPinned, setIsPulltabPinned] = useState(false);
  const pulltabUnpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle interaction to pin the pull tabs, then unpin after random delay
  const handlePulltabInteraction = useCallback(() => {
    setIsPulltabPinned(true);
    
    // Clear any existing timeout
    if (pulltabUnpinTimeoutRef.current) {
      clearTimeout(pulltabUnpinTimeoutRef.current);
    }
    
    // Unpin after random 1-10 seconds
    const unpinDelay = Math.random() * 9000 + 1000;
    pulltabUnpinTimeoutRef.current = setTimeout(() => {
      setIsPulltabPinned(false);
    }, unpinDelay);
  }, []);

  // Sync with parent's playerMinimized prop (e.g., on reload when localStorage sets it true)
  useEffect(() => {
    if (playerMinimized && !isMinimized) {
      setIsMinimizedInternal(true);
    }
  }, [playerMinimized, isMinimized]);

  // Auto-hide first time help
  useEffect(() => {
    const timer = setTimeout(() => setShowFirstTimeHelp(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pulltabUnpinTimeoutRef.current) {
        clearTimeout(pulltabUnpinTimeoutRef.current);
      }
    };
  }, []);

  // Scroll detection for iframe auto-minimizing on mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      
      // Only trigger minimization on significant scroll when player is not hidden or open
      if (scrollDelta > 15 && !open && !playerHidden && !isMinimized) {
        setIsScrollMinimized(true);
        lastScrollY.current = currentScrollY;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Auto-expand after scroll stops
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrollMinimized(false);
        }, 1200); // Expand back 1.2s after scroll stops
      }
      
      // Also compact the pull tab when minimized (internal or parent state) and scrolling
      if (scrollDelta > 15 && !open && !playerHidden && (isMinimized || playerMinimized) && !forceMinimize) {
        setIsPullTabCompact(true);
        lastScrollY.current = currentScrollY;

        // Clear existing timeout
        if (pullTabScrollTimeoutRef.current) {
          clearTimeout(pullTabScrollTimeoutRef.current);
        }

        // Auto-expand pull tab after scroll stops
        pullTabScrollTimeoutRef.current = setTimeout(() => {
          setIsPullTabCompact(false);
        }, 1200); // Expand back 1.2s after scroll stops
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (pullTabScrollTimeoutRef.current) {
        clearTimeout(pullTabScrollTimeoutRef.current);
      }
    };
  }, [open, playerHidden, isMinimized, playerMinimized, forceMinimize]);

  // Reset minimized state when player opens or is manually minimized
  useEffect(() => {
    if (open || isMinimized || playerMinimized) {
      setIsScrollMinimized(false);
    }
    // Reset pull tab compact when fully unminimized (both internal and parent)
    if (!isMinimized && !playerMinimized) {
      setIsPullTabCompact(false);
    }
  }, [open, isMinimized, playerMinimized]);

  // Handle forceMinimize from UIStateContext - this is the key to audio persistence!
  // When other UI components open (mobile menu, modals, etc.), we minimize the player
  // (hide iframe behind pull tab) instead of unmounting, preserving audio playback.
  // When they close, we restore the player to its previous state.
  useEffect(() => {
    if (forceMinimize && !isMinimized) {
      // Modals/menus opened - minimize the player
      setIsMinimized(true);
      props.onMinimizedChange?.(true);
    } else if (!forceMinimize && isMinimized && !playerMinimized) {
      // Modals/menus closed AND player wasn't manually minimized - restore player
      setIsMinimized(false);
      props.onMinimizedChange?.(false);
    }
  }, [forceMinimize, isMinimized, playerMinimized, props]);

  // Report player position for external tutorial positioning
  useEffect(() => {
    if (miniPlayerRef.current && props.onPlayerPositionUpdate) {
      const rect = miniPlayerRef.current.getBoundingClientRect();
      props.onPlayerPositionUpdate({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [isMinimized, playerSide, open, playerHidden, props]);

  // Handle swipe/drag to change sides - bidirectional with smooth physics
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 50; // Lower threshold for smoother swipe detection
    const velocity = info.velocity.x;
    const velocityThreshold = 200; // More sensitive to fast swipes
    
    // Swipe right (from left side OR anywhere with right velocity)
    if (info.offset.x > threshold || velocity > velocityThreshold) {
      SoundEffects.click();
      setIsMinimized(true);
      setPlayerSide('right');
      props.onPlayerSideChange?.('right');
      props.onMinimizedChange?.(true);
    }
    // Swipe left (from right side OR anywhere with left velocity)  
    else if (info.offset.x < -threshold || velocity < -velocityThreshold) {
      SoundEffects.click();
      setIsMinimized(true);
      setPlayerSide('left');
      props.onPlayerSideChange?.('left');
      props.onMinimizedChange?.(true);
    }
  }, [props]);

  // Expand from minimized state - keeps the player on the same side
  const handleExpandPlayer = useCallback(() => {
    SoundEffects.click();
    setIsMinimized(false);
    props.onMinimizedChange?.(false);
  }, [props]);

  // Volume control
  const handleVolumeUp = useCallback(() => {
    SoundEffects.click();
    setVolume(v => Math.min(100, v + 10));
    setIsMuted(false);
    setShowVolumeSlider(true);
    setTimeout(() => setShowVolumeSlider(false), 2000);
  }, []);

  const handleVolumeDown = useCallback(() => {
    SoundEffects.click();
    setVolume(v => Math.max(0, v - 10));
    if (volume <= 10) setIsMuted(true);
    setShowVolumeSlider(true);
    setTimeout(() => setShowVolumeSlider(false), 2000);
  }, [volume]);

  // Power button
  const handlePower = useCallback(() => {
    SoundEffects.click();
    setIsLocked(!isLocked);
    setBrightness(isLocked ? 100 : 5);
  }, [isLocked]);

  // Home button / Navigation
  const handleHome = useCallback(() => {
    SoundEffects.click();
    trackEvent('feature_used', { component: 'floating_player', action: 'home_button' });
    handlePlayerInteraction();
  }, [handlePlayerInteraction]);

  // Camera button
  const handleCamera = useCallback(() => {
    SoundEffects.click();
    trackEvent('feature_used', { component: 'floating_player', action: 'camera' });
    setShowCameraModal(true);
  }, []);

  if (!isStreamingSource || !streamingEmbedUrl) return null;

  const SourceIcon = musicSource === 'SPOTIFY' ? IconBrandSpotify : 
                     musicSource === 'APPLE_MUSIC' ? IconBrandApple : IconBrandYoutube;

  const playerHeight = musicSource === 'YOUTUBE' ? 480 : 400;
  const minimizedActive = isMinimized || playerMinimized;

  return (
    <>
      {/* Camera Modal */}
      <CameraModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} />

      {/* Minimized iPod Pull Tab - Audio persists like Apple Music! */}
      {/* When forceMinimize is true (other UI is open), shows a compact circular wave indicator */}
      {/* Shows when either internal isMinimized OR parent playerMinimized is true */}
      <AnimatePresence mode="wait">
        {(isMinimized || playerMinimized) && !open && (
          forceMinimize ? (
            /* Compact pill button when modals/UI is open - matches scroll-minimized design */
            <motion.div
              key="compact-pill-div"
              className="fixed bottom-[70px] pointer-events-none"
              style={{ zIndex: 100201, right: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }}
            >
              <motion.button
                initial={{ x: 100, opacity: 0 }}
                animate={
                  isPulltabPinned 
                    ? { x: 0, scale: 1, opacity: 1 }
                    : {
                        x: [100, 0, 0, 100],
                        opacity: [0, 1, 1, 0],
                        scale: [0.95, 1, 1, 0.95],
                      }
                }
                transition={
                  shouldSkipHeavyEffects ? {} : (isPulltabPinned 
                    ? { duration: 0.2 }
                    : { 
                        duration: 2.5,
                        repeat: Infinity, 
                        ease: "easeInOut",
                        repeatDelay: 0.5,
                        times: [0, 0.2, 0.8, 1]
                      })
                }
                onClick={() => {
                  SoundEffects.click();
                  handlePulltabInteraction();
                  handleExpandPlayer();
                }}
                onHoverStart={() => {
                  setHoveredButton('expand');
                  handlePulltabInteraction();
                }}
                onTap={handlePulltabInteraction}
                onMouseLeave={() => setHoveredButton(null)}
                className="relative flex items-center justify-center h-10 w-10 rounded-full transition-all pointer-events-auto"
                data-theme-aware
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(59,130,246,0.1) 100%)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '2px solid #3b82f6',
                  boxShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Music Icon with pulse - Theme-aware */}
                <motion.div
                  animate={isPlaying && !shouldSkipHeavyEffects ? { scale: [1, 1.1, 1] } : {}}
                  transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <IconMusic 
                    className="w-4 h-4"
                    style={{ 
                      color: isPlaying ? 'var(--accent-color, #93c5fd)' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.7)',
                      filter: shouldSkipHeavyEffects ? undefined : (isPlaying ? 'drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6)' : 'drop-shadow(0 0 4px #3b82f6)')
                    }}
                  />
                  {/* Playing indicator dot */}
                  {isPlaying && (
                    <motion.div
                      animate={shouldSkipHeavyEffects ? {} : { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                      transition={shouldSkipHeavyEffects ? {} : { duration: 1, repeat: Infinity }}
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400"
                      style={{ boxShadow: shouldSkipHeavyEffects ? undefined : "0 0 4px rgba(74, 222, 128, 0.8)" }}
                    />
                  )}
                </motion.div>
              </motion.button>
            </motion.div>
          ) : isPullTabCompact ? (
            /* Compact pill version when scrolling - same as forceMinimize pill */
            <motion.div
              key="scroll-compact-pill-div"
              className="fixed bottom-[70px] pointer-events-none"
              style={{ zIndex: 100201, right: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }}
            >
              <motion.button
                initial={{ x: 100, opacity: 0 }}
                animate={
                  isPulltabPinned 
                    ? { x: 0, scale: 1, opacity: 1 }
                    : {
                        x: [100, 0, 0, 100],
                        opacity: [0, 1, 1, 0],
                        scale: [0.95, 1, 1, 0.95],
                      }
                }
                transition={
                  shouldSkipHeavyEffects ? {} : (isPulltabPinned 
                    ? { duration: 0.2 }
                    : { 
                        duration: 2.5,
                        repeat: Infinity, 
                        ease: "easeInOut",
                        repeatDelay: 0.5,
                        times: [0, 0.2, 0.8, 1]
                      })
                }
                onClick={() => {
                  SoundEffects.click();
                  handlePulltabInteraction();
                  handleExpandPlayer();
                }}
                onHoverStart={() => {
                  setHoveredButton('expand');
                  handlePulltabInteraction();
                  // Expand on hover for desktop
                  if (window.matchMedia('(hover: hover)').matches) {
                    setIsPullTabCompact(false);
                  }
                }}
                onTap={handlePulltabInteraction}
                onMouseLeave={() => setHoveredButton(null)}
                className="relative flex items-center justify-center h-10 w-10 rounded-full transition-all pointer-events-auto"
                data-theme-aware
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(59,130,246,0.1) 100%)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '2px solid #3b82f6',
                  boxShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Music Icon with pulse - Theme-aware */}
                <motion.div
                  animate={isPlaying && !shouldSkipHeavyEffects ? { scale: [1, 1.1, 1] } : {}}
                  transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <IconMusic 
                    className="w-4 h-4"
                    style={{ 
                      color: isPlaying ? 'var(--accent-color, #93c5fd)' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.7)',
                      filter: shouldSkipHeavyEffects ? undefined : (isPlaying ? 'drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6)' : 'drop-shadow(0 0 4px #3b82f6)')
                    }}
                  />
                  {/* Playing indicator dot */}
                  {isPlaying && (
                    <motion.div
                      animate={shouldSkipHeavyEffects ? {} : { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                      transition={shouldSkipHeavyEffects ? {} : { duration: 1, repeat: Infinity }}
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400"
                      style={{ boxShadow: shouldSkipHeavyEffects ? undefined : "0 0 4px rgba(74, 222, 128, 0.8)" }}
                    />
                  )}
                </motion.div>
              </motion.button>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      {/* SCROLL-MINIMIZED PULL TAB - Cool pill design for scroll-based minimization */}
      <AnimatePresence>
        {isScrollMinimized && !open && !playerHidden && !isMinimized && (
          <motion.button
            key="scroll-minimized-tab"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 500, mass: 0.6 }}
            onClick={() => {
              SoundEffects.click();
              setIsScrollMinimized(false);
            }}
            onMouseEnter={() => {
              SoundEffects.hover?.();
              if (window.matchMedia('(hover: hover)').matches) {
                setIsScrollMinimized(false);
              }
            }}
            className={cn(
              "fixed bottom-[70px] flex items-center gap-1.5 px-2.5 py-2 rounded-xl",
              "bg-gradient-to-br from-blue-600/40 via-blue-500/25 to-slate-900/50",
              "backdrop-blur-2xl border border-blue-500/50",
              "shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
              "hover:border-blue-400/70 transition-all duration-200",
              "pointer-events-auto"
            )}
            style={{
              zIndex: 100201, // Just above MainWidget z-[100200]
              right: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)',
            }}
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Music Icon with pulse */}
            <motion.div
              animate={isPlaying && !shouldSkipHeavyEffects ? { scale: [1, 1.1, 1] } : {}}
              transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <IconMusic 
                className={cn(
                  "w-4 h-4",
                  isPlaying ? "text-blue-300" : "text-blue-400/70"
                )} 
                style={isPlaying && !shouldSkipHeavyEffects ? {
                  filter: "drop-shadow(0 0 6px rgba(96, 165, 250, 0.8))"
                } : {}}
              />
              {/* Playing indicator dot */}
              {isPlaying && (
                <motion.div
                  animate={shouldSkipHeavyEffects ? {} : { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={shouldSkipHeavyEffects ? {} : { duration: 1, repeat: Infinity }}
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400"
                  style={{ boxShadow: shouldSkipHeavyEffects ? undefined : "0 0 4px rgba(74, 222, 128, 0.8)" }}
                />
              )}
            </motion.div>
            
            {/* Animated Music Wave Bars */}
            <div className="flex items-end gap-[2px] h-[14px]">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full origin-bottom"
                  style={{ 
                    backgroundColor: isPlaying ? "#34d399" : "#60a5fa",
                    boxShadow: shouldSkipHeavyEffects ? undefined : (isPlaying 
                      ? "0 0 4px rgba(52, 211, 153, 0.6)"
                      : "0 0 4px rgba(96, 165, 250, 0.6)"),
                  }}
                  animate={isPlaying && !shouldSkipHeavyEffects ? {
                    height: [
                      4 + Math.random() * 4,
                      8 + Math.random() * 6,
                      3 + Math.random() * 5,
                      10 + Math.random() * 4,
                      5 + Math.random() * 3,
                    ],
                  } : { height: 4 }}
                  transition={isPlaying && !shouldSkipHeavyEffects ? {
                    duration: 0.4 + i * 0.05,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: i * 0.08,
                  } : { duration: 0.2 }}
                />
              ))}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/*
        SINGLE PERSISTENT IFRAME - The ONLY iframe for audio
        This is ALWAYS in DOM. When expanded, it's visible in the iPhone.
        When minimized, it shrinks and hides behind the pull tab but keeps playing.
        When forceMinimize is true, it pushes further off-screen so modals have more visible area.

        KEY: Same iframe element = same audio context = continuous playback

        NOTE: We check both isMinimized (internal state) AND playerMinimized (parent prop) to handle
        the race condition on reload where the prop updates after initial render.
      */}
      <div
        className="fixed transition-all duration-300 ease-out"
        style={minimizedActive ? {
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          overflow: 'hidden',
          opacity: 0,
          zIndex: -1,
          pointerEvents: 'none',
          borderRadius: '12px',
          transform: 'scale(0)',
          transformOrigin: playerSide === 'left' ? 'left center' : 'right center',
        } : {
          position: 'fixed',
          // Position: When expanded, sits above content. When scroll minimized, hide above.
          bottom: isScrollMinimized ? (60 + 200) : (60 + 180),
          [playerSide]: isScrollMinimized ? 8 : (playerSide === 'left' ? 8 : 8),
          // Size: Full size when expanded, minimal when scroll minimized
          width: isScrollMinimized ? 0.01 : 254,
          height: isScrollMinimized ? 0.01 : (musicSource === 'YOUTUBE' ? 180 : 110),
          overflow: 'hidden',
          // Opacity: Full when expanded, hidden when scroll minimized
          opacity: isScrollMinimized ? 0 : 1,
          // Z-index: Above content when expanded
          zIndex: isScrollMinimized ? (Z_INDEX.PULL_TAB - 10) : (Z_INDEX.PLAYER_BASE + 5),
          pointerEvents: isScrollMinimized ? 'none' : 'auto',
          borderRadius: isScrollMinimized ? '12px' : '0 0 16px 16px',
          transform: isScrollMinimized ? 'scale(0)' : 'scale(1)',
          transformOrigin: playerSide === 'left' ? 'left center' : 'right center',
        }}
        aria-hidden={isScrollMinimized || minimizedActive}
      >
        <iframe
          ref={iframeRef}
          key={`streaming-single-${musicSource}-${iframeKey}`}
          title={`${sourceLabel[musicSource]} player`}
          src={streamingEmbedUrl}
          width="100%"
          height="100%"
          loading="eager"
          style={{ 
            border: 'none', 
            display: 'block',
            borderRadius: 'inherit',
          }}
          onLoad={handlePlayerInteraction}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        />
      </div>

      {/* Pull tab when hidden (original hide feature) */}
      {playerHidden && !open && !isMinimized && (
        <motion.button
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          onClick={() => { SoundEffects.click(); setPlayerHidden(false); }}
          className={cn(
            "fixed flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-lg backdrop-blur-md transition-colors",
            "bg-gradient-to-br from-blue-600/60 via-blue-500/40 to-cyan-500/30 hover:from-blue-500/70 hover:to-cyan-500/50",
            "border border-blue-400/70 shadow-lg hover:shadow-blue-500/50"
          )}
          style={{ bottom: 200, zIndex: Z_INDEX.PULL_TAB, left: '8px' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div animate={shouldSkipHeavyEffects ? {} : { y: [0, 2, 0] }} transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity }}>
            <IconGripVertical className="w-3 h-3 text-white/80" style={{ filter: shouldSkipHeavyEffects ? undefined : 'drop-shadow(0 0 3px #3b82f6)' }} />
          </motion.div>
          <span className="text-[7px] font-bold text-blue-100 whitespace-nowrap" style={{ textShadow: shouldSkipHeavyEffects ? undefined : '0 0 4px #3b82f6' }}>iPhone</span>
        </motion.button>
      )}
      
      {/* Main iPhone 17 Floating Player - hidden when minimized (either internal state or parent prop) */}
      <AnimatePresence>
        {!isMinimized && !playerMinimized && (
          <motion.div
            ref={miniPlayerRef}
            initial={{ x: playerSide === 'left' ? -300 : 300, opacity: 0 }}
            animate={{ 
              x: open ? (playerSide === 'left' ? -300 : 300) : (playerHidden ? (playerSide === 'left' ? -300 : 300) : (isWandering ? wanderPosition.x : 0)),
              y: isWandering ? wanderPosition.y : 0,
              opacity: open ? 0 : 1,
              scale: isLocked ? 0.98 : isDragging ? 1.03 : 1,
              rotateZ: isDragging ? 0 : 0,
            }}
            exit={{ x: playerSide === 'left' ? -300 : 300, opacity: 0, scale: 0.9 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 300,
              mass: 0.8,
              velocity: 2
            }}
            drag="x"
            dragConstraints={{ left: -150, right: 150 }}
            dragElastic={0.2}
            dragMomentum={true}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="fixed pointer-events-auto"
            style={{ 
              [playerSide]: 0, 
              bottom: 60, 
              pointerEvents: (open || playerHidden) ? 'none' : 'auto',
              filter: `brightness(${brightness / 100})`,
              zIndex: Z_INDEX.PLAYER_BASE,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onClick={handlePlayerInteraction}
            onMouseEnter={() => { setIsHovering(true); if (!hasStartedCatchGame) maybeShowCatchGameTutorial(hasStartedCatchGame); }}
            onMouseLeave={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const padding = 80;
              const isNearby = e.clientX >= rect.left - padding && e.clientX <= rect.right + padding && e.clientY >= rect.top - padding && e.clientY <= rect.bottom + padding;
              setIsHovering(false);
              if (gameStats.gamesPlayed === 0 && !hasStartedCatchGame && !isTutorialHovered && !isNearby) dismissCatchGameTutorial();
            }}
          >
            {/* Swipe Hint Overlay - ABOVE iPhone */}
            <AnimatePresence>
              {isHovering && !isDragging && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                  style={{ zIndex: Z_INDEX.SWIPE_HINT }}
                >
                  <div className={cn(
                    "px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-900/95 via-gray-800/95 to-slate-900/95 border border-white/25 shadow-xl shadow-black/40 text-[10px] text-white/90 font-semibold flex items-center gap-2",
                    shouldSkipHeavyEffects ? "" : "backdrop-blur-xl"
                  )}>
                    <motion.div animate={shouldSkipHeavyEffects ? {} : { x: [-4, 4, -4] }} transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                      <IconChevronLeft className="w-4 h-4 text-blue-400" />
                    </motion.div>
                    <span>Swipe to minimize</span>
                    <motion.div animate={shouldSkipHeavyEffects ? {} : { x: [4, -4, 4] }} transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                      <IconChevronRight className="w-4 h-4 text-blue-400" />
                    </motion.div>
                  </div>
                  {/* Arrow pointing down to iPhone */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-gray-800/95 to-slate-900/95 rotate-45 border-r border-b border-white/25" />
                </motion.div>
              )}
            </AnimatePresence>
        {/* iPhone 17 Frame */}
        <div className="relative">
          {/* Main iPhone Body */}
          <div 
            className={cn(
              "relative rounded-[40px] overflow-hidden transition-all duration-500",
              "bg-gradient-to-b from-[#2d2d32] via-[#1c1c21] to-[#0c0c10]",
              "shadow-[0_0_80px_rgba(0,0,0,0.9),0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)]",
              "border-[4px] border-slate-600/40",
              isLocked && "opacity-60"
            )}
            style={{ width: '270px', height: `${playerHeight}px` }}
          >
            {/* Titanium Frame Edge Effects */}
            <div className="absolute inset-0 rounded-[36px] border border-slate-500/15 pointer-events-none" />
            <div className="absolute inset-[1px] rounded-[35px] border border-white/5 pointer-events-none" />
            
            {/* Reflective shimmer on frame */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/3 pointer-events-none rounded-[36px]"
              animate={shouldSkipHeavyEffects ? {} : { opacity: [0.5, 0.8, 0.5] }}
              transition={shouldSkipHeavyEffects ? {} : { duration: 3, repeat: Infinity }}
            />
            
            {/* Dynamic Island / Notch */}
            <div 
              className="absolute top-3 left-1/2 -translate-x-1/2"
              style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
            >
              <motion.div 
                className="relative bg-black rounded-full flex items-center justify-center gap-2 px-4 py-2 overflow-hidden cursor-pointer shadow-lg"
                animate={{ width: isPlaying ? 130 : 90, height: 30 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Camera Lens in Dynamic Island */}
                <div 
                  className="relative w-3 h-3 rounded-full bg-gradient-to-br from-slate-800 to-black ring-1 ring-slate-600/50 cursor-pointer group"
                  onClick={(e) => { e.stopPropagation(); handleCamera(); }}
                  onMouseEnter={() => setHoveredButton('camera')}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-blue-900/60 to-purple-900/60" />
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-blue-400/30"
                    animate={shouldSkipHeavyEffects ? {} : { opacity: [0.2, 0.5, 0.2] }}
                    transition={shouldSkipHeavyEffects ? {} : { duration: 2, repeat: Infinity }}
                  />
                  <ButtonTooltip show={hoveredButton === 'camera'} text="📷 Open Camera" position="bottom" color="purple" />
                </div>
                
                {/* Now Playing Indicator */}
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-1.5 overflow-hidden"
                    >
                      <SourceIcon className="w-3 h-3 text-white/80" />
                      <div className="flex gap-[2px]">
                        {[1, 2, 3, 4].map(i => (
                          <motion.div
                            key={i}
                            className="w-[2px] bg-blue-400 rounded-full"
                            animate={shouldSkipHeavyEffects ? { height: 6 } : { height: [3, 10, 3] }}
                            transition={shouldSkipHeavyEffects ? {} : { duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Volume Buttons (Left Side) */}
            <div 
              className="absolute -left-[5px] top-20 flex flex-col gap-2"
              style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
            >
              {/* Mute/Silent Switch */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredButton('mute')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <motion.button
                  whileTap={{ x: -2 }}
                  onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); SoundEffects.click(); }}
                  className={cn(
                    "w-[5px] h-7 rounded-l-sm transition-all shadow-lg",
                    isMuted 
                      ? "bg-gradient-to-b from-orange-400 to-orange-600 shadow-orange-500/40" 
                      : "bg-gradient-to-b from-slate-500 to-slate-600"
                  )}
                />
                <ButtonTooltip show={hoveredButton === 'mute'} text={isMuted ? "🔇 Tap to Unmute" : "🔊 Tap to Mute"} position="right" color="orange" />
              </div>
              
              {/* Volume Up */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredButton('volUp')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <motion.button
                  whileTap={{ x: -2, scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); handleVolumeUp(); }}
                  className="w-[5px] h-10 rounded-l-sm bg-gradient-to-b from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500 transition-all shadow-lg"
                />
                <ButtonTooltip show={hoveredButton === 'volUp'} text="🔊 Volume Up (+10)" position="right" color="blue" />
              </div>
              
              {/* Volume Down */}
              <div
                className="relative"
                onMouseEnter={() => setHoveredButton('volDown')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <motion.button
                  whileTap={{ x: -2, scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); handleVolumeDown(); }}
                  className="w-[5px] h-10 rounded-l-sm bg-gradient-to-b from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500 transition-all shadow-lg"
                />
                <ButtonTooltip show={hoveredButton === 'volDown'} text="🔉 Volume Down (-10)" position="right" color="blue" />
              </div>
            </div>

            {/* Power/Side Button (Right Side) */}
            <div
              className="absolute -right-[5px] top-28"
              style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
              onMouseEnter={() => setHoveredButton('power')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <motion.button
                whileTap={{ x: 2, scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); handlePower(); }}
                className={cn(
                  "w-[5px] h-14 rounded-r-sm transition-all shadow-lg",
                  isLocked 
                    ? "bg-gradient-to-b from-red-400 to-red-600 shadow-red-500/40" 
                    : "bg-gradient-to-b from-slate-500 to-slate-600 hover:from-slate-400 hover:to-slate-500"
                )}
              />
              <ButtonTooltip show={hoveredButton === 'power'} text={isLocked ? "🔓 Tap to Wake" : "🔒 Sleep/Wake"} position="left" color="red" />
            </div>

            {/* Volume Slider Overlay */}
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ zIndex: Z_INDEX.VOLUME_SLIDER }}
                >
                  <div className="bg-black/90 backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/10 shadow-2xl">
                    {isMuted ? (
                      <IconVolumeOff className="w-5 h-5 text-white" />
                    ) : (
                      <IconVolume className="w-5 h-5 text-white" />
                    )}
                    <div className="w-28 h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${isMuted ? 0 : volume}%` }}
                      />
                    </div>
                    <span className="text-white text-xs font-semibold w-8">{isMuted ? 0 : volume}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lock Screen Overlay */}
            <AnimatePresence>
              {isLocked && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[36px]",
                    shouldSkipHeavyEffects ? "" : "backdrop-blur-lg"
                  )}
                  style={{ zIndex: Z_INDEX.LOCK_SCREEN }}
                  onClick={(e) => { e.stopPropagation(); handlePower(); }}
                >
                  <motion.div
                    animate={shouldSkipHeavyEffects ? {} : { y: [0, -8, 0] }}
                    transition={shouldSkipHeavyEffects ? {} : { duration: 2, repeat: Infinity }}
                  >
                    <IconLock className="w-14 h-14 text-white/50 mb-4" />
                  </motion.div>
                  <p className="text-white/60 text-sm font-medium">Tap to Wake</p>
                  <p className="text-white/30 text-xs mt-1">or press Power button</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Screen Content */}
            <div className="relative h-full pt-12 pb-6 px-2">
              {/* Status Bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-11 flex items-end justify-between px-7 pb-1 text-white/80 text-[9px] font-semibold"
                style={{ zIndex: Z_INDEX.PLAYER_CONTROLS - 10 }}
              >
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-[2px]">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={cn("w-[3px] rounded-[1px]", i <= 3 ? "h-[9px] bg-white" : "h-[6px] bg-white/40")} />
                    ))}
                  </div>
                  <span className="ml-0.5">5G</span>
                  <div className="ml-1.5 w-6 h-[10px] border border-white/50 rounded-[3px] relative">
                    <div className="absolute inset-[1px] rounded-[2px] bg-blue-400" style={{ width: '75%' }} />
                    <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[5px] bg-white/50 rounded-r-sm" />
                  </div>
                </div>
              </div>

              {/* Game HUD */}
              {isWandering && !open && !playerHidden && (
                <div 
                  className="absolute left-2 top-14 pointer-events-none"
                  style={{ zIndex: Z_INDEX.GAME_HUD }}
                >
                  <CompactGameHUD score={gameStats.currentScore} highScore={gameStats.highScore} energy={energy} combo={combo} isFleeing={isFleeing} isReturning={isReturning} tirednessLevel={getTirednessLevel()} variant="attached" isVisible={true} />
                </div>
              )}

              {/* Player Header */}
              <div className="relative flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-t-2xl border-b border-white/5 backdrop-blur-sm mt-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 shadow-inner">
                    {sourceIcons[musicSource] && React.createElement(sourceIcons[musicSource]!, { className: "w-5 h-5 text-sky-300" })}
                  </div>
                  <div>
                    <span className="text-[10px] text-white/90 font-semibold block">{sourceLabel[musicSource]}</span>
                    <span className="text-[8px] text-white/50">Now Playing</span>
                  </div>
                  <div className="flex gap-[2px] ml-1">
                    <motion.div className="w-[2px] h-2 bg-blue-400 rounded-full" animate={shouldSkipHeavyEffects ? {} : { scaleY: [1, 2, 1] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.35, repeat: Infinity }} />
                    <motion.div className="w-[2px] h-2.5 bg-cyan-400 rounded-full" animate={shouldSkipHeavyEffects ? {} : { scaleY: [1, 0.4, 1] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.35, repeat: Infinity, delay: 0.1 }} />
                    <motion.div className="w-[2px] h-2 bg-blue-400 rounded-full" animate={shouldSkipHeavyEffects ? {} : { scaleY: [1, 1.6, 1] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.35, repeat: Infinity, delay: 0.2 }} />
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); SoundEffects.click(); handlePlayerInteraction(); setStreamingActive(false); setMusicEnabled(false); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
                >
                  <IconX className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* Embedded Player Area - Visual placeholder, actual iframe is persistent and positioned here when expanded */}
              <div 
                className="relative bg-black rounded-b-2xl overflow-hidden"
                style={{ height: musicSource === 'YOUTUBE' ? '180px' : '110px' }}
              >
                {/* Reflective Shimmer on player */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-10"
                  animate={shouldSkipHeavyEffects ? {} : { x: ['-100%', '200%'] }}
                  transition={shouldSkipHeavyEffects ? {} : { duration: 5, repeat: Infinity, ease: "linear" }}
                />
                {/* The persistent iframe floats above this area when not minimized */}
              </div>

              {/* Media Controls */}
              <div className="mt-3 px-1">
                <div className="flex items-center justify-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <IconChevronUp className="w-4 h-4 text-white/70 rotate-[-90deg]" />
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); SoundEffects.click(); }}
                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/20"
                  >
                    {isPlaying ? (
                      <IconPlayerPause className="w-6 h-6 text-black" />
                    ) : (
                      <IconPlayerPlay className="w-6 h-6 text-black ml-0.5" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <IconChevronUp className="w-4 h-4 text-white/70 rotate-90" />
                  </motion.button>
                </div>

                {/* Volume Bar */}
                <div className="mt-2.5 flex items-center gap-2 px-1">
                  <IconVolumeOff className="w-3 h-3 text-white/40" />
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white/80 rounded-full"
                      animate={{ width: `${isMuted ? 0 : volume}%` }}
                    />
                  </div>
                  <IconVolume className="w-3 h-3 text-white/40" />
                </div>
              </div>

              {/* Usage Tips Section */}
              <AnimatePresence>
                {showFirstTimeHelp && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mt-3 mx-1 p-2.5 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 border border-white/10 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <IconInfoCircle className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[9px] text-white/80 font-semibold">iPhone Controls</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowFirstTimeHelp(false); }}
                        className="text-white/40 hover:text-white/60"
                      >
                        <IconX className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-1 text-[8px] text-white/60">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-orange-400" />
                        <span>Orange switch = Mute toggle</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-400" />
                        <span>Left buttons = Volume Up/Down</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-red-400" />
                        <span>Right button = Sleep/Wake</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-purple-400" />
                        <span>Dynamic Island camera = Selfie!</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Home Indicator */}
            <div 
              className="absolute bottom-2 left-1/2 -translate-x-1/2 cursor-pointer"
              style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
              onClick={(e) => { e.stopPropagation(); handleHome(); }}
              onMouseEnter={() => setHoveredButton('home')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <motion.div 
                className="w-28 h-1 bg-white/50 rounded-full"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.7)' }}
                whileTap={{ scale: 0.95 }}
              />
              <ButtonTooltip show={hoveredButton === 'home'} text="🏠 Tap to Interact" position="top" color="blue" />
            </div>

            {/* Hide/Minimize Tab - Dynamic position based on side */}
            <motion.button
              onClick={(e) => { e.stopPropagation(); SoundEffects.click(); setIsMinimized(true); }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-14 flex flex-col items-center justify-center bg-slate-700/90 border-slate-500/40 hover:bg-slate-600/90 transition-colors shadow-lg",
                playerSide === 'left' 
                  ? "-right-4 rounded-r-lg border-r border-y" 
                  : "-left-4 rounded-l-lg border-l border-y"
              )}
              style={{ zIndex: Z_INDEX.PLAYER_CONTROLS }}
              title="Minimize player (audio continues)"
              whileHover={{ x: playerSide === 'left' ? 2 : -2 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredButton('minimize')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <IconGripVertical className="w-2.5 h-2.5 text-white/50" />
              <ButtonTooltip 
                show={hoveredButton === 'minimize'} 
                text="📱 Minimize (audio plays)" 
                position={playerSide === 'left' ? 'right' : 'left'} 
                color="purple" 
              />
            </motion.button>
          </div>
        </div>
        
        {/* Tutorial Slot - ABOVE the iPhone player with highest priority - Desktop only */}
        <AnimatePresence>
          {!isMobile && showCatchGameTutorial && tutorialContent && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute -top-36 left-1/2 -translate-x-1/2 pointer-events-auto"
              style={{ zIndex: Z_INDEX.TUTORIAL, width: 280 }}
            >
              {tutorialContent}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Effects - positioned ABOVE the iPhone player */}
        <div 
          className="absolute -top-20 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: Z_INDEX.EFFECTS, width: 300 }}
        >
          <BoredPopup show={showBoredPopup} onDismiss={() => setShowBoredPopup(false)} />
        </div>
        
        {/* Sparkle and confetti effects */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ zIndex: Z_INDEX.EFFECTS }}
        >
          <SparkleBurst trigger={showCatchSparkle} />
          <ConfettiBurst trigger={showConfetti} />
          <PulseRing active={isHovering || isNearPlayer} color="blue" />
        </div>

        {/* Helper Overlay - appears on first interaction */}
        <AnimatePresence>
          {showFirstTimeHelp && !isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
              style={{ zIndex: Z_INDEX.HELPERS }}
            >
              <div className={cn(
                "px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/90 to-purple-600/90 border border-white/30 shadow-xl text-[9px] text-white font-medium flex items-center gap-2",
                shouldSkipHeavyEffects ? "" : "backdrop-blur-xl"
              )}>
                <IconInfoCircle className="w-3.5 h-3.5" />
                <span>Try the side buttons! 🎮</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default FloatingPlayer;
