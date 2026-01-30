"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import {
  IconMusic,
  IconPlayerPlay,
  IconPlayerPause,
  IconChevronUp,
  IconInfoCircle,
  IconVolume,
  IconX,
  IconGripVertical,
  IconVolumeOff,
  IconVolume2,
  IconVolume3,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";
import { BlueShimmer, Slider, GameOverScreen, GameControls, GameShimmer, BounceDots, StatusBadge, QuickGameTutorial, QuickGameTutorialDemo } from "@/components/audio-widget/ui";
import { ShimmerLine } from "@/components/ui/UnifiedShimmer";
import { sourceLabel, streamingOptions, sourceIcons } from "./constants";
import { useAudioWidgetUI } from "@/contexts/UIStateContext";
import { useDeviceVolumeDetector } from "@/hooks/useDeviceVolumeDetector";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

/**
 * Animated Music Wave Bars - Trading ticker style
 * Shows animated equalizer bars next to music icon
 * THEME-AWARE: Uses CSS variables for dynamic theming
 */
function MusicWaveBars({ isPlaying, isActive = false }: { isPlaying: boolean; isActive?: boolean }) {
  // Mobile performance optimization
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  
  // When active/playing, use a brighter green, otherwise use theme accent color
  const barStyle = isActive 
    ? { backgroundColor: '#34d399', boxShadow: '0 0 4px rgba(52, 211, 153, 0.6)' }
    : { backgroundColor: 'var(--accent-color, #ffffff)', boxShadow: '0 0 4px rgba(var(--accent-rgb, 255, 255, 255), 0.6)' };
  
  // Skip infinite animation on mobile for battery savings
  const shouldAnimate = isPlaying && !shouldSkipHeavyEffects;
  
  return (
    <div className="flex items-end gap-[2px] h-[14px]">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full origin-bottom"
          style={barStyle}
          animate={shouldAnimate ? {
            height: [
              4 + Math.random() * 4,
              8 + Math.random() * 6,
              3 + Math.random() * 5,
              10 + Math.random() * 4,
              5 + Math.random() * 3,
            ],
          } : { height: isPlaying ? 8 : 4 }}
          transition={shouldAnimate ? {
            duration: 0.4 + i * 0.05,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.08,
          } : { duration: 0.2 }}
        />
      ))}
    </div>
  );
}

interface MainWidgetProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  widgetX: any;
  widgetOpacity: any;
  handleWidgetDragEnd: (event: any, info: any) => void;
  widgetHidden: boolean;
  setWidgetHidden: (v: boolean) => void;
  shimmerEnabled: boolean;
  shimmerSettings: { intensity: string; speed: string };
  isScrollMinimized: boolean;
  setIsScrollMinimized: (v: boolean) => void;
  
  // Audio state
  musicSource: MusicSource;
  isStreamingSource: boolean;
  streamingActive: boolean;
  setStreamingActive: (v: boolean) => void;
  streamingEmbedUrl: string | null;
  musicEnabled: boolean;
  setMusicEnabled: (v: boolean) => void;
  isMusicPlaying: boolean;
  toggleMusic: () => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  // Separate iframe volume
  iframeVolume: number;
  setIframeVolume: (v: number) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  tipsMuted: boolean;
  setTipsMuted: (v: boolean) => void;
  
  // Handlers
  handleStreamingSelect: (source: MusicSource) => void;
  handleStartCatchGame: () => void;
  handleStopGame: () => void;
  setMusicEmbedOpen: (v: boolean) => void;
  setShowTipsOverlay: (v: boolean) => void;
  
  // UI state
  showReturnUserHint: boolean;
  showFirstTimeHelp: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  
  // Game state
  isWandering: boolean;
  gameStats: { gamesPlayed: number; currentScore: number; highScore: number; totalCatches: number };
  gameState: string;
  
  // iPhone Player control
  setPlayerMinimized?: (v: boolean) => void;
}

export const MainWidget = React.memo(function MainWidget(props: MainWidgetProps) {
  const {
    open, setOpen, widgetRef, widgetX, widgetOpacity, handleWidgetDragEnd,
    widgetHidden, setWidgetHidden, shimmerEnabled, shimmerSettings,
    isScrollMinimized, setIsScrollMinimized,
    musicSource, isStreamingSource, streamingActive, setStreamingActive,
    streamingEmbedUrl, musicEnabled, setMusicEnabled, isMusicPlaying, toggleMusic,
    musicVolume, setMusicVolume, iframeVolume, setIframeVolume, 
    sfxVolume, setSfxVolume, tipsMuted, setTipsMuted,
    handleStreamingSelect, handleStartCatchGame, handleStopGame,
    setMusicEmbedOpen, setShowTipsOverlay, showReturnUserHint, showFirstTimeHelp,
    iframeRef, isWandering, gameStats, gameState,
    setPlayerMinimized,
  } = props;
  
  // Mobile performance optimization
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();

  // Handler to open iPhone player (expand from minimized state)
  const handleOpenIPhonePlayer = useCallback(() => {
    if (setPlayerMinimized) {
      SoundEffects.click();
      setPlayerMinimized(false);
    }
  }, [setPlayerMinimized]);

  // Get UI state to hide widget when modals/menus are open
  const { shouldMinimizeAudioWidget, isWelcomeScreenActive } = useAudioWidgetUI();
  
  // Z-index: Must be above welcome screen (z-99999999) but below max safe integer
  // Use 11 digits to ensure visibility above all other elements
  const MAIN_WIDGET_Z_INDEX = isWelcomeScreenActive ? 99999999999 : 99999999999;
  const ACCENT_COLOR = '#ffffff';
  const SURFACE_BG = 'rgba(0, 0, 0, 0.9)';
  const SURFACE_BORDER = 'rgba(255, 255, 255, 0.14)';
  const SURFACE_SHADOW = shouldSkipHeavyEffects
    ? '0 10px 30px rgba(0, 0, 0, 0.45)'
    : '0 20px 55px rgba(0, 0, 0, 0.65)';

  // Scroll detection for auto-minimizing
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  const isMinimizedRef = useRef(false);
  
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
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pulltabUnpinTimeoutRef.current) {
        clearTimeout(pulltabUnpinTimeoutRef.current);
      }
    };
  }, []);
  
  // Track if we're on mobile
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<'music' | 'volume' | 'game' | 'actions'>('music');
  
  // Device volume detection - opens widget when user presses device volume buttons
  const [showDeviceVolumePopup, setShowDeviceVolumePopup] = useState(false);
  const [deviceVolumeDirection, setDeviceVolumeDirection] = useState<'up' | 'down' | null>(null);
  const deviceVolumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Callback for device volume button press - defined before hook to avoid reference issues
  const handleDeviceVolumePress = useCallback((direction: 'up' | 'down') => {
    // When device volume button is pressed, show the volume popup and open widget
    setShowDeviceVolumePopup(true);
    setDeviceVolumeDirection(direction);
    
    // If widget is not open, open it to the volume panel
    if (!open) {
      setOpen(true);
      setActiveMobilePanel('volume');
      trackEvent('feature_used', { component: 'main_widget', action: 'device_volume_opened' });
    }
    
    // Hide popup after 2.5 seconds
    if (deviceVolumeTimeoutRef.current) {
      clearTimeout(deviceVolumeTimeoutRef.current);
    }
    deviceVolumeTimeoutRef.current = setTimeout(() => {
      setShowDeviceVolumePopup(false);
      setDeviceVolumeDirection(null);
    }, 2500);
  }, [open, setOpen]);
  
  // Activate audio context on first user interaction for iOS compatibility
  const { activateAudioContext } = useDeviceVolumeDetector({
    onVolumeButtonPress: handleDeviceVolumePress,
  });
  
  // Activate audio context on any user interaction for iOS
  useEffect(() => {
    const handleInteraction = () => activateAudioContext();
    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
    window.addEventListener('click', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [activateAudioContext]);
  
  // Cleanup device volume timeout
  useEffect(() => {
    return () => {
      if (deviceVolumeTimeoutRef.current) {
        clearTimeout(deviceVolumeTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    const checkMobile = () => setIsMobileDevice(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // DISABLED on mobile - no scroll minimization to prevent size changes
    if (isMobileDevice) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      
      // Trigger minimization on significant scroll when widget is not open (whether hidden or visible)
      // Use ref to prevent multiple setState calls
      if (scrollDelta > 15 && !open && !isMinimizedRef.current) {
        isMinimizedRef.current = true;
        setIsScrollMinimized(true);
        lastScrollY.current = currentScrollY;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Set timeout to expand back after scroll stops
        scrollTimeoutRef.current = setTimeout(() => {
          isMinimizedRef.current = false;
          setIsScrollMinimized(false);
        }, 1200); // Expand back 1.2s after scroll stops
      } else if (scrollDelta > 15) {
        // Update lastScrollY even if already minimized
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [open, setIsScrollMinimized, isMobileDevice]);

  // Reset minimized state when widget opens
  useEffect(() => {
    if (open) {
      setIsScrollMinimized(false);
    }
  }, [open, setIsScrollMinimized]);

  // Auto-hide widget when modals/menus open
  useEffect(() => {
    if (shouldMinimizeAudioWidget && !widgetHidden) {
      setWidgetHidden(true);
    }
  }, [shouldMinimizeAudioWidget, widgetHidden, setWidgetHidden]);

  // Auto-show widget on welcome screen (override any hidden state)
  useEffect(() => {
    if (isWelcomeScreenActive && widgetHidden) {
      setWidgetHidden(false);
    }
  }, [isWelcomeScreenActive, widgetHidden, setWidgetHidden]);

  const currentStreamingIcon = React.useMemo(() => {
    const SourceIcon = sourceIcons[musicSource];
    if (isStreamingSource && SourceIcon) {
      return <SourceIcon className="h-5 w-5" style={{ color: ACCENT_COLOR }} />;
    }
    return <IconMusic className="h-5 w-5" style={{ color: ACCENT_COLOR }} />;
  }, [isStreamingSource, musicSource]);

  return (
    <>
        {/* Device Volume Detection Popup - Shows when user presses device volume buttons */}
        <AnimatePresence>
          {showDeviceVolumePopup && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[999999999999] pointer-events-auto"
            >
              <div className="relative px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Animated background shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                
                <div className="relative flex items-center gap-3">
                  {/* Volume Icon with direction indicator */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: deviceVolumeDirection === 'up' ? [0, -10, 0] : [0, 10, 0]
                    }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    {deviceVolumeDirection === 'up' ? (
                      <IconVolume3 className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))' }} />
                    ) : (
                      <IconVolume2 className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))' }} />
                    )}
                    
                    {/* Direction arrow */}
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 flex items-center justify-center"
                      animate={{ y: deviceVolumeDirection === 'up' ? [-2, 0] : [0, 2] }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-[8px] text-white font-bold">
                        {deviceVolumeDirection === 'up' ? '▲' : '▼'}
                      </span>
                    </motion.div>
                  </motion.div>
                  
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
                      Device Volume Detected
                    </span>
                    <span className="text-[9px] text-white/80">
                      Control app volume below ↓
                    </span>
                  </div>
                  
                  {/* Quick volume bars visualization */}
                  <div className="flex items-end gap-[2px] h-4 ml-2">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full bg-gradient-to-t from-white to-white/70"
                        initial={{ height: 4 }}
                        animate={{ 
                          height: deviceVolumeDirection === 'up' 
                            ? [4, 8 + i * 2, 4 + i * 1.5]
                            : [8 + i * 2, 4, 4 + i * 0.5]
                        }}
                        transition={{ 
                          duration: 0.4, 
                          delay: i * 0.05,
                          ease: 'easeOut'
                        }}
                        style={{ 
                          boxShadow: '0 0 4px rgba(255, 255, 255, 0.6)',
                          minHeight: '4px',
                          maxHeight: '16px'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pull tab to show widget when hidden - minimizes/maximizes on scroll */}
        <AnimatePresence mode="wait">
        {widgetHidden && !isScrollMinimized && (
          <motion.div
            className="fixed bottom-[70px] pointer-events-none"
            style={{
              zIndex: MAIN_WIDGET_Z_INDEX,
              // Mobile: RIGHT, Desktop: LEFT
              ...(isMobileDevice
                ? { right: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
                : { left: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
              ),
            }}
          >
            <motion.button
              key="normal-pull-tab"
              initial={{ x: 60, opacity: 0 }}
              animate={
                isPulltabPinned 
                  ? { x: 0, scale: 1, opacity: 1 }
                  : {
                      x: [60, 0, 0, 60],
                      opacity: [0, 1, 1, 0],
                      scale: [0.95, 1, 1, 0.95],
                    }
              }
              transition={
                shouldSkipHeavyEffects ? {} :
                isPulltabPinned 
                  ? { duration: 0.2 }
                  : { 
                      duration: 2.5,
                      repeat: Infinity, 
                      ease: "easeInOut",
                      repeatDelay: 0.5,
                      times: [0, 0.2, 0.8, 1]
                    }
              }
              onClick={() => {
                SoundEffects.click();
                handlePulltabInteraction();
                setWidgetHidden(false);
              }}
              onHoverStart={handlePulltabInteraction}
              onTap={handlePulltabInteraction}
              className="relative flex items-center justify-center h-11 w-11 min-w-[44px] min-h-[44px] rounded-l-full transition-all pointer-events-auto"
              data-theme-aware
              style={{
                background: SURFACE_BG,
                backdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(10px)',
                WebkitBackdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(10px)',
                border: `1px solid ${SURFACE_BORDER}`,
                boxShadow: SURFACE_SHADOW,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconMusic className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: ACCENT_COLOR, filter: shouldSkipHeavyEffects ? 'none' : 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.4))' }} />
            </motion.button>
          </motion.div>
        )}

        {/* Minimized pull tab on scroll when widget is hidden */}
        {widgetHidden && isScrollMinimized && (
          <motion.div
            className="fixed bottom-[70px] pointer-events-none"
            style={{
              zIndex: MAIN_WIDGET_Z_INDEX,
              // Welcome screen: position on RIGHT, Normal: position on LEFT
              ...(isWelcomeScreenActive 
                ? { right: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
                : { left: 'clamp(0px, 12px, 100px)' }
              ),
            }}
          >
            <motion.button
              key="minimized-pull-tab"
              initial={{ x: 60, opacity: 0 }}
              animate={
                isPulltabPinned 
                  ? { x: 0, scale: 1, opacity: 1 }
                  : {
                      x: [60, 0, 0, 60],
                      opacity: [0, 1, 1, 0],
                      scale: [0.95, 1, 1, 0.95],
                    }
              }
              transition={
                shouldSkipHeavyEffects ? {} :
                isPulltabPinned 
                  ? { duration: 0.2 }
                  : { 
                      duration: 2.5,
                      repeat: Infinity, 
                      ease: "easeInOut",
                      repeatDelay: 0.5,
                      times: [0, 0.2, 0.8, 1]
                    }
              }
              onClick={() => {
                SoundEffects.click();
                handlePulltabInteraction();
                setIsScrollMinimized(false);
              }}
              onHoverStart={handlePulltabInteraction}
              onTap={handlePulltabInteraction}
              className="relative flex items-center justify-center h-11 w-11 min-w-[44px] min-h-[44px] rounded-l-full transition-all pointer-events-auto"
              data-theme-aware
              style={{
                background: SURFACE_BG,
                backdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(10px)',
                WebkitBackdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(10px)',
                border: `1px solid ${SURFACE_BORDER}`,
                boxShadow: SURFACE_SHADOW,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={isMusicPlaying || streamingActive ? { 
                  scale: [1, 1.1, 1],
                } : {}}
                transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <IconMusic 
                  className="w-4 h-4"
                  style={{ 
                    color: isMusicPlaying || streamingActive ? ACCENT_COLOR : 'rgba(255, 255, 255, 0.7)',
                    filter: shouldSkipHeavyEffects ? 'none' : 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.35))'
                  }}
                />
                {(isMusicPlaying || streamingActive) && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={shouldSkipHeavyEffects ? {} : { duration: 1, repeat: Infinity }}
                    className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-green-400"
                    style={{ boxShadow: shouldSkipHeavyEffects ? 'none' : "0 0 3px rgba(74, 222, 128, 0.8)" }}
                  />
                )}
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!widgetHidden && (
          <>
            {/* MINIMIZED PILL STATE - Cool Music icon with animated wave bars */}
            {isScrollMinimized && !open && (
              <motion.div
                className="fixed bottom-[70px] pointer-events-none"
                style={{
                  zIndex: MAIN_WIDGET_Z_INDEX,
                  // Mobile: RIGHT, Desktop: LEFT
                  ...(isMobileDevice
                    ? { right: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
                    : { left: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
                  ),
                }}
              >
                <motion.button
                  key="minimized-audio"
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
                    shouldSkipHeavyEffects ? {} :
                    isPulltabPinned 
                      ? { duration: 0.2 }
                      : { 
                          duration: 2.5,
                          repeat: Infinity, 
                          ease: "easeInOut",
                          repeatDelay: 0.5,
                          times: [0, 0.2, 0.8, 1]
                        }
                  }
                  onClick={() => {
                    SoundEffects.click();
                    handlePulltabInteraction();
                    setIsScrollMinimized(false);
                  }}
                  onHoverStart={handlePulltabInteraction}
                  onTap={handlePulltabInteraction}
                  className="relative flex items-center justify-center h-11 w-11 min-w-[44px] min-h-[44px] rounded-full transition-all pointer-events-auto"
                  data-theme-aware
                  style={{
                    background: SURFACE_BG,
                    backdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(10px)',
                    WebkitBackdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(10px)',
                    border: `1px solid ${SURFACE_BORDER}`,
                    boxShadow: shouldSkipHeavyEffects ? 'none' : SURFACE_SHADOW,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Music Icon with pulse - Theme-aware */}
                  <motion.div
                    animate={isMusicPlaying || streamingActive ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    <IconMusic 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                      style={{ 
                        color: isMusicPlaying || streamingActive ? ACCENT_COLOR : 'rgba(255, 255, 255, 0.7)',
                        filter: shouldSkipHeavyEffects ? 'none' : (isMusicPlaying || streamingActive ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))' : 'none')
                      }}
                    />
                    {/* Playing indicator dot */}
                    {(isMusicPlaying || streamingActive) && (
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                        transition={shouldSkipHeavyEffects ? {} : { duration: 1, repeat: Infinity }}
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400"
                        style={{ boxShadow: shouldSkipHeavyEffects ? 'none' : "0 0 4px rgba(74, 222, 128, 0.8)" }}
                      />
                    )}
                  </motion.div>
                </motion.button>
              </motion.div>
            )}

            {/* FULL WIDGET STATE */}
            {!isScrollMinimized && (
              <motion.div 
                key="full-audio"
                ref={widgetRef}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="fixed bottom-[70px] pointer-events-auto"
                drag="x"
                dragConstraints={{ left: 0, right: 150 }}
                dragElastic={0.1}
                onDragEnd={handleWidgetDragEnd}
                style={{ 
                  x: widgetX, 
                  opacity: widgetOpacity,
                  zIndex: MAIN_WIDGET_Z_INDEX,
                  // Mobile: RIGHT, Desktop: LEFT
                  ...(isMobileDevice
                    ? { right: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
                    : { left: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
                  ),
                }}
              >

            {/* Return User "Click Play" Helper */}
            <AnimatePresence>
              {!open && showReturnUserHint && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-0 bottom-[calc(100%+8px)] z-50 pointer-events-none"
                >
                  <div className={`relative p-2.5 rounded-xl bg-gradient-to-br from-black/80 to-black/60 border border-white/15 shadow-xl ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-md'}`}>
                    <div className="absolute -bottom-2 right-6 w-3 h-3 bg-black/70 rotate-45 border-b border-r border-white/15" />
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1] }} 
                        transition={shouldSkipHeavyEffects ? {} : { repeat: Infinity, duration: 1.5 }}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20"
                      >
                        <IconPlayerPlay className="w-4 h-4 text-white fill-white" />
                      </motion.div>
                      <div>
                        <p className="text-xs font-bold text-white">Welcome back!</p>
                        <p className="text-[10px] text-white/70">Tap to resume</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Widget Container - Compact */}
            <motion.div
              layout
              data-audio-widget
              data-theme-aware
              className={cn(
                "relative rounded-2xl shadow-2xl",
                "text-white overflow-hidden audio-shimmer",
                !shouldSkipHeavyEffects && "backdrop-blur-2xl",
                open ? "w-[252px] sm:w-[320px]" : "w-auto"
              )}
              style={{
                background: SURFACE_BG,
                border: `1px solid ${SURFACE_BORDER}`,
                boxShadow: SURFACE_SHADOW,
                transition: 'border-color 0.4s ease-out, box-shadow 0.4s ease-out',
                transitionDelay: '0.05s',
                zIndex: 2147483700,
              }}
            >
              {shimmerEnabled && <ShimmerLine color="white" intensity={shimmerSettings.intensity as any} speed={shimmerSettings.speed as any} />}

              {/* Single Mono Button - Trading Hub Style */}
              <div className="relative p-1.5 sm:p-2">
                <motion.button
                  onClick={() => {
                    SoundEffects.click();
                    if (!open) trackEvent('feature_used', { component: 'audio_widget', action: 'expand' });
                    setOpen(!open);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-2.5 sm:px-3 h-6 sm:h-7 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 transition-all"
                  style={{
                    background: SURFACE_BG,
                    backdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(10px)',
                    WebkitBackdropFilter: shouldSkipHeavyEffects ? 'none' : 'blur(10px)',
                    border: `1px solid ${SURFACE_BORDER}`,
                    boxShadow: shouldSkipHeavyEffects ? 'none' : SURFACE_SHADOW,
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <IconMusic 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                      style={{ 
                        color: ACCENT_COLOR,
                        filter: shouldSkipHeavyEffects ? 'none' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))'
                      }}
                    />
                    <motion.div 
                      animate={{ rotate: open ? 180 : 0 }} 
                      transition={{ duration: 0.3 }}
                      style={{ color: ACCENT_COLOR, filter: shouldSkipHeavyEffects ? 'none' : 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))' }}
                    >
                      <IconChevronUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </motion.div>
                  </div>
                </motion.button>
              </div>

              {/* Body */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-3 pb-3 overflow-hidden"
                  >
                    {/* Mobile panel selector */}
                    {isMobileDevice && (
                      <div className="mb-3 grid grid-cols-4 gap-2">
                        {[
                          { key: 'music' as const, label: 'Music', icon: <IconMusic className="w-4 h-4" /> },
                          { key: 'volume' as const, label: 'Volume', icon: <IconVolume className="w-4 h-4" /> },
                          { key: 'game' as const, label: 'Game', icon: <IconPlayerPlay className="w-4 h-4" /> },
                          { key: 'actions' as const, label: 'More', icon: <IconInfoCircle className="w-4 h-4" /> },
                        ].map((tab) => {
                          const isActive = activeMobilePanel === tab.key;
                          return (
                            <button
                              key={tab.key}
                              onClick={() => { SoundEffects.click(); setActiveMobilePanel(tab.key); }}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[9px] font-semibold transition-all",
                                isActive
                                  ? "border-white/40 text-white shadow-[0_10px_24px_rgba(0,0,0,0.6)] bg-white/10"
                                  : "border-white/20 text-white/80 hover:border-white/40 bg-black/40"
                              )}
                              style={isActive ? undefined : {}}
                            >
                              <span className="text-white">
                                {tab.icon}
                              </span>
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Streaming Status - Theme-aware */}
                    {(!isMobileDevice || activeMobilePanel === 'music') && isStreamingSource && streamingEmbedUrl && streamingActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          "mb-2 px-2 py-1.5 rounded-lg flex items-center justify-between bg-black/70 border border-white/15",
                          isMobileDevice && "bg-black/70"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 h-3 items-end">
                            <motion.div className="w-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-color, #ffffff)' }} animate={{ height: [4, 12, 4] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.5, repeat: Infinity }} />
                            <motion.div className="w-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-color, #ffffff)' }} animate={{ height: [10, 5, 10] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                            <motion.div className="w-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-color, #ffffff)' }} animate={{ height: [6, 10, 6] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.5, repeat: Infinity, delay: 0.2 }} />
                          </div>
                          <span className="text-[10px] text-white/80 font-medium">{sourceLabel[musicSource]}</span>
                        </div>
                        <button
                          onClick={() => { SoundEffects.click(); setStreamingActive(false); setMusicEnabled(false); }}
                          className="text-[9px] font-medium text-white hover:text-white/80 transition-colors"
                        >
                          Stop
                        </button>
                      </motion.div>
                    )}

                    {/* Music Service Selection - Theme-aware */}
                    {(!isMobileDevice || activeMobilePanel === 'music') && (
                    <div className={cn("mb-3", isMobileDevice && "rounded-xl border border-white/15 bg-black/70 p-2") }>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-white/80 font-medium">🎧 Music Service</span>
                        {!streamingActive && <span className="text-[9px] shimmer-pulse text-white">Tap one</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {streamingOptions.map((opt) => {
                          const isActive = musicSource === opt.value && streamingActive;
                          return (
                            <motion.button
                              key={opt.value}
                              onClick={() => { SoundEffects.click(); handleStreamingSelect(opt.value); }}
                              className={cn(
                                "relative h-12 rounded-lg flex flex-col items-center justify-center gap-1 text-[9px] font-medium transition-all overflow-hidden",
                                !isActive && "bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 hover:text-white"
                              )}
                              style={isActive ? {
                                background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1))',
                                border: `1px solid ${SURFACE_BORDER}`,
                                color: ACCENT_COLOR,
                              } : {}}
                              whileTap={{ scale: 0.95 }}
                            >
                              {opt.icon}
                              <span>{opt.label}</span>
                              {isActive && (
                                <motion.div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current" animate={{ scale: [1, 1.3, 1] }} transition={shouldSkipHeavyEffects ? {} : { duration: 1, repeat: Infinity }} />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    {/* Volume Controls */}
                    {(!isMobileDevice || activeMobilePanel === 'volume') && (
                    <div className={cn("mb-2 space-y-2", isMobileDevice && "rounded-xl border border-white/15 bg-black/70 p-2") }>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/80 font-medium">🔊 Volume</span>
                        <motion.button
                          onClick={() => { SoundEffects.click(); setTipsMuted(!tipsMuted); }}
                          className={cn("px-2 py-0.5 rounded text-[8px] font-medium transition-colors", tipsMuted ? "bg-white/10 text-white/70" : "")}
                          style={!tipsMuted ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.18)',
                            color: ACCENT_COLOR,
                          } : {}}
                        >
                          Tips: {tipsMuted ? "OFF" : "ON"}
                        </motion.button>
                      </div>
                      <Slider label="🎵 Music" value={musicVolume} onChange={(v) => setMusicVolume(v)} />
                      <Slider label="📺 Iframe" value={iframeVolume} onChange={(v) => { 
                        setIframeVolume(v); 
                        // Immediately broadcast volume to iframe
                        if (iframeRef.current?.contentWindow) { 
                          const win = iframeRef.current.contentWindow; 
                          const vol0to100 = Math.floor(v * 100);
                          // YouTube API
                          if (musicSource === 'YOUTUBE') {
                            win.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
                            win.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [vol0to100] }), '*');
                          }
                          // Generic protocols
                          win.postMessage({ method: 'setVolume', value: v }, '*');
                          win.postMessage({ method: 'setVolume', value: vol0to100 }, '*');
                          win.postMessage(JSON.stringify({ method: 'setVolume', value: vol0to100 }), '*');
                        } 
                      }} />
                      <Slider label="✨ SFX" value={sfxVolume} onChange={(v) => setSfxVolume(v)} />
                    </div>
                    )}

                    {/* Game Stats */}
                    {(!isMobileDevice || activeMobilePanel === 'game') && gameStats.gamesPlayed > 0 && (
                      <div className={cn("mb-2 p-2 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/15 relative overflow-hidden", isMobileDevice && "shadow-[0_10px_24px_rgba(0,0,0,0.5)]") }>
                        <GameShimmer colors="blue" />
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-white/80 font-medium">🎮 Catch Game</span>
                            {isWandering && <BounceDots active={true} color="blue" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {gameStats.currentScore > 0 && gameStats.currentScore >= gameStats.highScore && (
                              <motion.span animate={{ scale: [1, 1.1, 1] }} transition={shouldSkipHeavyEffects ? {} : { duration: 1, repeat: Infinity }} className="text-sky-300 font-bold text-[9px]">🏆 Best!</motion.span>
                            )}
                            <StatusBadge status={isWandering ? "playing" : gameState === "caught" ? "caught" : gameState === "escaped" ? "escaped" : "idle"} animate={isWandering} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="text-center p-1.5 rounded bg-white/5 relative overflow-hidden border border-white/15">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/70">High Score</div>
                            <div className="text-sm font-bold text-white tabular-nums">{gameStats.highScore}</div>
                          </div>
                          <div className="text-center p-1.5 rounded bg-white/5 relative overflow-hidden border border-white/15">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/70">Catches</div>
                            <div className="text-sm font-bold text-white tabular-nums">{gameStats.totalCatches}</div>
                          </div>
                          <div className="text-center p-1.5 rounded bg-white/5 relative overflow-hidden border border-white/15">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/70">Games</div>
                            <div className="text-sm font-bold text-white tabular-nums">{gameStats.gamesPlayed}</div>
                          </div>
                        </div>
                        <GameControls isPlaying={isWandering} onStart={handleStartCatchGame} onStop={handleStopGame} className="mt-2" />
                      </div>
                    )}

                    {/* Quick game start if no games played */}
                    {(!isMobileDevice || activeMobilePanel === 'game') && gameStats.gamesPlayed === 0 && streamingActive && (
                      <div className={cn("mb-2 p-2 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/15 relative overflow-hidden", isMobileDevice && "shadow-[0_10px_24px_rgba(0,0,0,0.5)]") }>
                        <GameShimmer colors="blue" />
                        <div className="text-[10px] text-white/80 mb-1.5 text-center">Try the catch game</div>
                        <GameControls isPlaying={isWandering} onStart={handleStartCatchGame} onStop={handleStopGame} />
                      </div>
                    )}

                    {/* Bottom actions - Theme-aware */}
                    {(!isMobileDevice || activeMobilePanel === 'actions') && (
                    <div className={cn("flex items-center justify-between pt-2 border-t border-white/10", isMobileDevice && "rounded-xl border border-white/15 bg-black/70 p-2") }>
                      <button onClick={() => { SoundEffects.click(); setMusicEnabled(false); setMusicEmbedOpen(true); setOpen(false); }} className="text-[9px] font-medium text-white hover:text-white/80 transition-colors">🎵 Full Library</button>
                      {streamingActive && (
                        <button onClick={handleOpenIPhonePlayer} className="text-[9px] font-medium text-white hover:text-white/80 transition-colors flex items-center gap-1">
                          📱 iPhone Player
                        </button>
                      )}
                      <button onClick={() => setShowTipsOverlay(true)} className="text-[9px] text-white/60 hover:text-white/80 transition-colors flex items-center gap-1">
                        <IconInfoCircle className="w-3 h-3" />Help
                      </button>
                    </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            </motion.div>
            )}

            {/* Swipe hint */}
            <AnimatePresence>
              {!open && !isScrollMinimized && showFirstTimeHelp && !streamingActive && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap">
                    <span className="text-[9px] text-slate-600">← Swipe to hide</span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
