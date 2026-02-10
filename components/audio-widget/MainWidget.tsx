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
  liveStreamVolume: number;
  setLiveStreamVolume: (v: number) => void;
  // Separate iframe volume
  iframeVolume: number;
  setIframeVolume: (v: number) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  tipsMuted: boolean;
  setTipsMuted: (v: boolean) => void;
  setAllowedChannel: (channel: "all" | "music" | "iframe" | "live") => void;
  masterMuted: boolean;
  setMasterMuted: (v: boolean) => void;
  
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
    musicVolume, setMusicVolume, liveStreamVolume, setLiveStreamVolume,
    iframeVolume, setIframeVolume, 
    sfxVolume, setSfxVolume, tipsMuted, setTipsMuted, setAllowedChannel,
    masterMuted, setMasterMuted,
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
  
  // Z-index: Use max 32-bit int (2147483647) — browsers clamp higher values
  // This ensures visibility above ALL other elements on the page
  const MAIN_WIDGET_Z_INDEX = 2147483647;
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

  // Scroll-minimize disabled — widget should stay visible during scrolling
  // Previously this would minimize the widget on scroll which caused it to stay minimized
  useEffect(() => {
    // Ensure widget is never stuck in scroll-minimized state
    setIsScrollMinimized(false);
    isMinimizedRef.current = false;
  }, [setIsScrollMinimized]);

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
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[2147483647] pointer-events-auto"
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
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
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
                        className="w-[3px] rounded-full bg-linear-to-t from-white to-white/70"
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

        {/* Minimized circular wave icon on scroll when widget is hidden */}
        {widgetHidden && isScrollMinimized && (
          <motion.div
            className="fixed bottom-[70px] pointer-events-none"
            style={{
              zIndex: MAIN_WIDGET_Z_INDEX,
              ...(isMobileDevice
                ? { right: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
                : { left: 'clamp(12px, calc((100vw - 1600px) / 2 + 12px), 112px)' }
              ),
            }}
          >
            <motion.button
              key="minimized-pull-tab"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', damping: 20, stiffness: 400, mass: 0.5 }}
              onClick={() => {
                SoundEffects.click();
                handlePulltabInteraction();
                setIsScrollMinimized(false);
                setWidgetHidden(false);
              }}
              onHoverStart={handlePulltabInteraction}
              onTap={handlePulltabInteraction}
              className="relative flex items-center justify-center h-14 w-14 min-w-[56px] min-h-[56px] rounded-full transition-all pointer-events-auto border"
              data-theme-aware
              style={{
                background: '#0c0c0c',
                borderColor: 'rgba(255,255,255,0.15)',
                boxShadow: '0 8px 26px rgba(0,0,0,0.55)',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Animated Wave Bars inside circle */}
              <div className="flex items-end justify-center gap-[3px] h-[18px]">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full origin-bottom"
                    style={{ 
                      backgroundColor: "#ffffff",
                      boxShadow: shouldSkipHeavyEffects ? undefined : "0 0 4px #ffffff, 0 0 8px #ffffff",
                    }}
                    animate={(isMusicPlaying || streamingActive) && !shouldSkipHeavyEffects ? {
                      height: [4 + i * 2, 12 + (3 - i) * 2, 6 + i, 14 - i, 4 + i * 2],
                    } : { height: 6 }}
                    transition={(isMusicPlaying || streamingActive) && !shouldSkipHeavyEffects ? {
                      duration: 0.5 + i * 0.08,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1,
                    } : { duration: 0.2 }}
                  />
                ))}
              </div>
              {/* Outer pulse ring glow effect */}
              {(isMusicPlaying || streamingActive) && !shouldSkipHeavyEffects && (
                <motion.div
                  className="absolute inset-0 rounded-full border border-white/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0, 0.35] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  style={{ boxShadow: '0 0 8px rgba(255, 255, 255, 0.18)' }}
                />
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!widgetHidden && (
          <>
            {/* MINIMIZED CIRCULAR ICON - White glow circle with animated waves */}
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
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 400, mass: 0.5 }}
                  onClick={() => {
                    SoundEffects.click();
                    handlePulltabInteraction();
                    setIsScrollMinimized(false);
                  }}
                  onHoverStart={handlePulltabInteraction}
                  onTap={handlePulltabInteraction}
                className="relative flex items-center justify-center h-14 w-14 min-w-[56px] min-h-[56px] rounded-full transition-all pointer-events-auto border"
                data-theme-aware
                style={{
                  background: '#0c0c0c',
                  borderColor: 'rgba(255,255,255,0.15)',
                  boxShadow: '0 8px 26px rgba(0,0,0,0.55)',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                  {/* Animated Wave Bars inside circle */}
                  <div className="flex items-end justify-center gap-[3px] h-[18px]">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full origin-bottom"
                        style={{ 
                          backgroundColor: "#ffffff",
                          boxShadow: shouldSkipHeavyEffects ? undefined : "0 0 4px #ffffff, 0 0 8px #ffffff",
                        }}
                        animate={(isMusicPlaying || streamingActive) && !shouldSkipHeavyEffects ? {
                          height: [4 + i * 2, 12 + (3 - i) * 2, 6 + i, 14 - i, 4 + i * 2],
                        } : { height: 6 }}
                        transition={(isMusicPlaying || streamingActive) && !shouldSkipHeavyEffects ? {
                          duration: 0.5 + i * 0.08,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.1,
                        } : { duration: 0.2 }}
                      />
                    ))}
                  </div>
                  {/* Outer pulse ring glow effect */}
                  {(isMusicPlaying || streamingActive) && !shouldSkipHeavyEffects && (
                    <motion.div
                      className="absolute inset-0 rounded-full border border-white/30"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      style={{ boxShadow: '0 0 12px rgba(255, 255, 255, 0.3)' }}
                    />
                  )}
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
                  <div className={`relative p-2.5 rounded-xl bg-linear-to-br from-black/80 to-black/60 border border-white/15 shadow-xl ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-md'}`}>
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

            {/* Main Widget Container - Apple Minimalistic Style */}
            <motion.div
              layout
              data-audio-widget
              data-theme-aware
              className={cn(
                "relative rounded-3xl shadow-2xl",
                "text-white overflow-hidden",
                open ? "w-[280px] sm:w-[320px]" : "w-auto"
              )}
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: shouldSkipHeavyEffects 
                  ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                  : '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 2147483700,
              }}
            >
              {/* Subtle top highlight */}
              <div 
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                }}
              />

              {/* Minimalistic Header Button - Apple Style */}
              <div className="relative p-3">
                <motion.button
                  onClick={() => {
                    SoundEffects.click();
                    if (!open) trackEvent('feature_used', { component: 'audio_widget', action: 'expand' });
                    setOpen(!open);
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="flex items-center justify-center">
                    <IconMusic 
                      className="w-5 h-5"
                      strokeWidth={2}
                      style={{ 
                        color: '#ffffff',
                      }}
                    />
                  </div>
                  <motion.div 
                    animate={{ rotate: open ? 180 : 0 }} 
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{ color: '#ffffff' }}
                  >
                    <IconChevronUp className="h-5 w-5" strokeWidth={2} />
                  </motion.div>
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
                    {/* Mobile panel selector - Apple minimalistic style */}
                    {isMobileDevice && (
                      <div className="mb-3 grid grid-cols-4 gap-1.5">
                        {[
                          { key: 'music' as const, label: 'Music', icon: <IconMusic className="w-4 h-4" strokeWidth={2} /> },
                          { key: 'volume' as const, label: 'Volume', icon: <IconVolume className="w-4 h-4" strokeWidth={2} /> },
                          { key: 'game' as const, label: 'Game', icon: <IconPlayerPlay className="w-4 h-4" strokeWidth={2} /> },
                          { key: 'actions' as const, label: 'More', icon: <IconInfoCircle className="w-4 h-4" strokeWidth={2} /> },
                        ].map((tab) => {
                          const isActive = activeMobilePanel === tab.key;
                          return (
                            <button
                              key={tab.key}
                              onClick={() => { SoundEffects.click(); setActiveMobilePanel(tab.key); }}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[10px] font-medium transition-all",
                              )}
                              style={{
                                background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
                                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                              }}
                            >
                              <span style={{ color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)' }}>
                                {tab.icon}
                              </span>
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Streaming Status - Minimalistic */}
                    {(!isMobileDevice || activeMobilePanel === 'music') && isStreamingSource && streamingEmbedUrl && streamingActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-2.5 px-3 py-2 rounded-2xl flex items-center justify-between"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 h-3 items-end">
                            <motion.div className="w-0.5 rounded-full bg-white" animate={{ height: [4, 12, 4] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.5, repeat: Infinity }} />
                            <motion.div className="w-0.5 rounded-full bg-white" animate={{ height: [10, 5, 10] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                            <motion.div className="w-0.5 rounded-full bg-white" animate={{ height: [6, 10, 6] }} transition={shouldSkipHeavyEffects ? {} : { duration: 0.5, repeat: Infinity, delay: 0.2 }} />
                          </div>
                          <span className="text-xs text-white/90 font-medium">{sourceLabel[musicSource]}</span>
                        </div>
                        <button
                          onClick={() => { SoundEffects.click(); setStreamingActive(false); setMusicEnabled(false); }}
                          className="text-xs font-medium text-white/70 hover:text-white transition-colors"
                        >
                          Stop
                        </button>
                      </motion.div>
                    )}
                    {/* Apple minimalistic */}
                    {(!isMobileDevice || activeMobilePanel === 'music') && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs text-white/70 font-medium">Music Service</span>
                        {!streamingActive && <span className="text-[10px] text-white/50">Select one</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {streamingOptions.map((opt) => {
                          const isActive = musicSource === opt.value && streamingActive;
                          return (
                            <motion.button
                              key={opt.value}
                              onClick={() => { SoundEffects.click(); handleStreamingSelect(opt.value); }}
                              className="relative h-14 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all overflow-hidden"
                              style={{
                                background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                                border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div style={{ color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)' }}>
                                {opt.icon}
                              </div>
                              <span>{opt.label}</span>
                              {isActive && (
                                <motion.div 
                                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white" 
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }} 
                                  transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity }} 
                                />
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-white/80 font-medium">🔊 Volume</span>
                        <div className="flex items-center gap-1">
                          <motion.button
                            onClick={() => { SoundEffects.click(); setMasterMuted(!masterMuted); }}
                            className={cn("px-2 py-0.5 rounded text-[9px] font-semibold transition-colors border border-white/20",
                              masterMuted ? "bg-white/15 text-white" : "bg-white/5 text-white/80")}
                          >
                            {masterMuted ? "Mute: ON" : "Mute: OFF"}
                          </motion.button>
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
                      </div>
                      <Slider label="Music" value={musicVolume} onChange={(v) => { setAllowedChannel("music"); setMusicVolume(v);} } />
                      <Slider label="Iframe" value={iframeVolume} onChange={(v) => { 
                        setAllowedChannel("iframe");
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
                      <Slider label="Live TV" value={liveStreamVolume} onChange={(v) => { setAllowedChannel("live"); setLiveStreamVolume(v); }} />
                      <Slider label="SFX" value={sfxVolume} onChange={(v) => setSfxVolume(v)} />
                    </div>
                    )}

                    {/* Game Stats */}
                    {(!isMobileDevice || activeMobilePanel === 'game') && gameStats.gamesPlayed > 0 && (
                      <div className={cn("mb-2 p-2 rounded-lg bg-linear-to-br from-white/10 to-white/5 border border-white/15 relative overflow-hidden", isMobileDevice && "shadow-[0_10px_24px_rgba(0,0,0,0.5)]") }>
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
                      <div className={cn("mb-2 p-2 rounded-lg bg-linear-to-br from-white/10 to-white/5 border border-white/15 relative overflow-hidden", isMobileDevice && "shadow-[0_10px_24px_rgba(0,0,0,0.5)]") }>
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
