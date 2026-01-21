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
  IconX,
  IconGripVertical,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { BlueShimmer, Slider, GameOverScreen, GameControls, GameShimmer, BounceDots, StatusBadge, QuickGameTutorial, QuickGameTutorialDemo } from "@/components/audio-widget/ui";
import { ShimmerLine } from "@/components/ui/UnifiedShimmer";
import { sourceLabel, streamingOptions, sourceIcons } from "./constants";
import { useAudioWidgetUI } from "@/contexts/UIStateContext";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

/**
 * Animated Music Wave Bars - Trading ticker style
 * Shows animated equalizer bars next to music icon
 * THEME-AWARE: Uses CSS variables for dynamic theming
 */
function MusicWaveBars({ isPlaying, isActive = false }: { isPlaying: boolean; isActive?: boolean }) {
  // When active/playing, use a brighter green, otherwise use theme accent color
  const barStyle = isActive 
    ? { backgroundColor: '#34d399', boxShadow: '0 0 4px rgba(52, 211, 153, 0.6)' }
    : { backgroundColor: 'var(--accent-color, #60a5fa)', boxShadow: '0 0 4px rgba(var(--accent-rgb, 96, 165, 250), 0.6)' };
  
  return (
    <div className="flex items-end gap-[2px] h-[14px]">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full origin-bottom"
          style={barStyle}
          animate={isPlaying ? {
            height: [
              4 + Math.random() * 4,
              8 + Math.random() * 6,
              3 + Math.random() * 5,
              10 + Math.random() * 4,
              5 + Math.random() * 3,
            ],
          } : { height: 4 }}
          transition={isPlaying ? {
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
    musicVolume, setMusicVolume, sfxVolume, setSfxVolume, tipsMuted, setTipsMuted,
    handleStreamingSelect, handleStartCatchGame, handleStopGame,
    setMusicEmbedOpen, setShowTipsOverlay, showReturnUserHint, showFirstTimeHelp,
    iframeRef, isWandering, gameStats, gameState,
    setPlayerMinimized,
  } = props;
  
  // Handler to open iPhone player (expand from minimized state)
  const handleOpenIPhonePlayer = useCallback(() => {
    if (setPlayerMinimized) {
      SoundEffects.click();
      setPlayerMinimized(false);
    }
  }, [setPlayerMinimized]);

  // Get UI state to hide widget when modals/menus are open
  const { shouldMinimizeAudioWidget } = useAudioWidgetUI();

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
  
  useEffect(() => {
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
  }, [open, setIsScrollMinimized]);

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

  const currentStreamingIcon = React.useMemo(() => {
    const SourceIcon = sourceIcons[musicSource];
    if (isStreamingSource && SourceIcon) {
      return <SourceIcon className="h-5 w-5" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.9)' }} />;
    }
    return <IconMusic className="h-5 w-5" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.9)' }} />;
  }, [isStreamingSource, musicSource]);

  return (
    <>
        {/* Pull tab to show widget when hidden - minimizes/maximizes on scroll */}
        <AnimatePresence mode="wait">
        {widgetHidden && !isScrollMinimized && (
          <motion.div
            className="fixed bottom-[70px] z-[100200] pointer-events-none left-[max(0px,12px)] md:left-3 md:right-auto"
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
              className="relative flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-l-full transition-all pointer-events-auto"
              data-theme-aware
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid #0066ff',
                boxShadow: '0 0 5px #0066ff, 0 0 10px #0066ff, 0 0 20px #0066ff, inset 0 0 10px rgba(0, 102, 255, 0.3)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconMusic className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: '#0066ff', filter: 'drop-shadow(0 0 5px #0066ff) drop-shadow(0 0 10px #0066ff)' }} />
            </motion.button>
          </motion.div>
        )}

        {/* Minimized pull tab on scroll when widget is hidden */}
        {widgetHidden && isScrollMinimized && (
          <motion.div
            className="fixed bottom-[70px] z-[100200] pointer-events-none left-[clamp(0px,12px,100px)] md:left-3 md:right-auto"
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
              className="relative flex items-center justify-center h-7 w-7 rounded-l-full transition-all pointer-events-auto"
              data-theme-aware
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid #0066ff',
                boxShadow: '0 0 5px #0066ff, 0 0 10px #0066ff, 0 0 20px #0066ff, inset 0 0 10px rgba(0, 102, 255, 0.3)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={isMusicPlaying || streamingActive ? { 
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <IconMusic 
                  className="w-4 h-4"
                  style={{ 
                    color: isMusicPlaying || streamingActive ? 'var(--accent-color, #93c5fd)' : 'rgba(var(--accent-rgb, 59, 130, 246), 0.7)',
                    filter: isMusicPlaying || streamingActive ? 'drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6)' : 'drop-shadow(0 0 4px #3b82f6)'
                  }}
                />
                {(isMusicPlaying || streamingActive) && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-green-400"
                    style={{ boxShadow: "0 0 3px rgba(74, 222, 128, 0.8)" }}
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
                className="fixed bottom-[70px] z-[100200] pointer-events-none right-[clamp(12px,calc((100vw-1600px)/2+12px),112px)] md:left-3 md:right-auto"
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
                  className="relative flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full transition-all pointer-events-auto"
                  data-theme-aware
                  style={{
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid #0066ff',
                    boxShadow: '0 0 5px #0066ff, 0 0 10px #0066ff, 0 0 20px #0066ff, inset 0 0 10px rgba(0, 102, 255, 0.3)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Music Icon with pulse - Theme-aware */}
                  <motion.div
                    animate={isMusicPlaying || streamingActive ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    <IconMusic 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                      style={{ 
                        color: isMusicPlaying || streamingActive ? '#0066ff' : 'rgba(0, 102, 255, 0.7)',
                        filter: isMusicPlaying || streamingActive ? 'drop-shadow(0 0 5px #0066ff) drop-shadow(0 0 10px #0066ff)' : 'none'
                      }}
                    />
                    {/* Playing indicator dot */}
                    {(isMusicPlaying || streamingActive) && (
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400"
                        style={{ boxShadow: "0 0 4px rgba(74, 222, 128, 0.8)" }}
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
                className="fixed bottom-[70px] z-[100200] pointer-events-auto right-[clamp(12px,calc((100vw-1600px)/2+12px),112px)] md:left-3 md:right-auto"
                drag="x"
                dragConstraints={{ left: 0, right: 150 }}
                dragElastic={0.1}
                onDragEnd={handleWidgetDragEnd}
                style={{ x: widgetX, opacity: widgetOpacity }}
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
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-600/90 to-blue-800/90 border border-blue-400/50 shadow-xl backdrop-blur-md">
                    <div className="absolute -bottom-2 right-6 w-3 h-3 bg-blue-700/90 rotate-45 border-b border-r border-blue-400/50" />
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1] }} 
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20"
                      >
                        <IconPlayerPlay className="w-4 h-4 text-white fill-white" />
                      </motion.div>
                      <div>
                        <p className="text-xs font-bold text-white">Welcome back!</p>
                        <p className="text-[10px] text-blue-100">Tap to resume</p>
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
                "relative rounded-2xl backdrop-blur-2xl shadow-2xl",
                "text-white/90 overflow-hidden audio-shimmer",
                open ? "w-[252px] sm:w-[320px]" : "w-auto"
              )}
              style={{
                background: 'rgba(0, 0, 0, 0.85)',
                border: '1px solid #0066ff',
                boxShadow: '0 0 5px #0066ff, 0 0 10px #0066ff, 0 0 20px #0066ff, inset 0 0 10px rgba(0, 102, 255, 0.3)',
                transition: 'border-color 0.4s ease-out, box-shadow 0.4s ease-out',
                transitionDelay: '0.05s',
                zIndex: 2147483700,
              }}
            >
              {shimmerEnabled && <ShimmerLine color="blue" intensity={shimmerSettings.intensity as any} speed={shimmerSettings.speed as any} />}

              {/* Single Neon Blue Button - Trading Hub Style */}
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
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid #0066ff',
                    boxShadow: '0 0 5px #0066ff, 0 0 10px #0066ff, 0 0 20px #0066ff, inset 0 0 10px rgba(0, 102, 255, 0.3)',
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <IconMusic 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                      style={{ 
                        color: '#0066ff',
                        filter: 'drop-shadow(0 0 5px #0066ff) drop-shadow(0 0 10px #0066ff)'
                      }}
                    />
                    <motion.div 
                      animate={{ rotate: open ? 180 : 0 }} 
                      transition={{ duration: 0.3 }}
                      style={{ color: '#0066ff', filter: 'drop-shadow(0 0 5px #0066ff)' }}
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
                    {/* Streaming Status - Theme-aware */}
                    {isStreamingSource && streamingEmbedUrl && streamingActive && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 px-2 py-1.5 rounded-lg bg-white/15 border border-white/25 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 h-3 items-end">
                            <motion.div className="w-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-color, #60a5fa)' }} animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity }} />
                            <motion.div className="w-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-color, #60a5fa)' }} animate={{ height: [10, 5, 10] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                            <motion.div className="w-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-color, #60a5fa)' }} animate={{ height: [6, 10, 6] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
                          </div>
                          <span className="text-[10px] text-white/80 font-medium">{sourceLabel[musicSource]}</span>
                        </div>
                        <button onClick={() => { SoundEffects.click(); setStreamingActive(false); setMusicEnabled(false); }} className="text-[9px] hover:opacity-80 transition-opacity" style={{ color: 'var(--accent-color, #e0f2fe)' }}>Stop</button>
                      </motion.div>
                    )}

                    {/* Music Service Selection - Theme-aware */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-white/70 font-medium">🎧 Music Service</span>
                        {!streamingActive && <span className="text-[9px] shimmer-pulse" style={{ color: 'var(--accent-color, #60a5fa)' }}>Tap one</span>}
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
                                !isActive && "bg-white/15 border border-white/25 text-white/80 hover:bg-white/25 hover:text-white"
                              )}
                              style={isActive ? {
                                background: 'linear-gradient(to bottom right, rgba(var(--accent-rgb, 59, 130, 246), 0.25), rgba(14, 165, 233, 0.2), rgba(var(--accent-rgb, 59, 130, 246), 0.25))',
                                border: '1px solid rgba(var(--accent-rgb, 59, 130, 246), 0.5)',
                                color: 'var(--accent-color, #e0f2fe)',
                              } : {}}
                              whileTap={{ scale: 0.95 }}
                            >
                              {opt.icon}
                              <span>{opt.label}</span>
                              {isActive && (
                                <motion.div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Volume Controls */}
                    <div className="mb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/70 font-medium">🔊 Volume</span>
                        <motion.button
                          onClick={() => { SoundEffects.click(); setTipsMuted(!tipsMuted); }}
                          className={cn("px-2 py-0.5 rounded text-[8px] font-medium transition-colors", tipsMuted ? "bg-white/15 text-white/60" : "")}
                          style={!tipsMuted ? {
                            backgroundColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.4)',
                            color: 'var(--accent-color, #bfdbfe)',
                          } : {}}
                        >
                          Tips: {tipsMuted ? "OFF" : "ON"}
                        </motion.button>
                      </div>
                      <Slider label="🎵 Music" value={musicVolume} onChange={(v) => { setMusicVolume(v); if (iframeRef.current?.contentWindow) { const win = iframeRef.current.contentWindow; if (musicSource === 'YOUTUBE') win.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*'); win.postMessage({ method: 'play' }, '*'); win.postMessage({ method: 'setVolume', value: 1 }, '*'); } }} />
                      <Slider label="✨ SFX" value={sfxVolume} onChange={(v) => setSfxVolume(v)} />
                    </div>

                    {/* Game Stats */}
                    {gameStats.gamesPlayed > 0 && (
                      <div className="mb-2 p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 relative overflow-hidden">
                        <GameShimmer colors="blue" />
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-white/60 font-medium">🎮 Catch Game</span>
                            {isWandering && <BounceDots active={true} color="blue" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {gameStats.currentScore > 0 && gameStats.currentScore >= gameStats.highScore && (
                              <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="text-sky-300 font-bold text-[9px]">🏆 Best!</motion.span>
                            )}
                            <StatusBadge status={isWandering ? "playing" : gameState === "caught" ? "caught" : gameState === "escaped" ? "escaped" : "idle"} animate={isWandering} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="text-center p-1.5 rounded bg-white/15 relative overflow-hidden">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/60">High Score</div>
                            <div className="text-sm font-bold text-sky-300 tabular-nums">{gameStats.highScore}</div>
                          </div>
                          <div className="text-center p-1.5 rounded bg-white/15 relative overflow-hidden">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/60">Catches</div>
                            <div className="text-sm font-bold text-blue-300 tabular-nums">{gameStats.totalCatches}</div>
                          </div>
                          <div className="text-center p-1.5 rounded bg-white/15 relative overflow-hidden">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/60">Games</div>
                            <div className="text-sm font-bold text-blue-400 tabular-nums">{gameStats.gamesPlayed}</div>
                          </div>
                        </div>
                        <GameControls isPlaying={isWandering} onStart={handleStartCatchGame} onStop={handleStopGame} className="mt-2" />
                      </div>
                    )}

                    {/* Quick game start if no games played */}
                    {gameStats.gamesPlayed === 0 && streamingActive && (
                      <div className="mb-2 p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 relative overflow-hidden">
                        <GameShimmer colors="blue" />
                        <div className="text-[10px] text-white/60 mb-1.5 text-center">Try the catch game</div>
                        <GameControls isPlaying={isWandering} onStart={handleStartCatchGame} onStop={handleStopGame} />
                      </div>
                    )}

                    {/* Bottom actions - Theme-aware */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button onClick={() => { SoundEffects.click(); setMusicEnabled(false); setMusicEmbedOpen(true); setOpen(false); }} className="text-[9px] hover:opacity-80 transition-opacity" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.7)' }}>🎵 Full Library</button>
                      {streamingActive && (
                        <button onClick={handleOpenIPhonePlayer} className="text-[9px] hover:opacity-80 transition-opacity flex items-center gap-1" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.7)' }}>
                          📱 iPhone Player
                        </button>
                      )}
                      <button onClick={() => setShowTipsOverlay(true)} className="text-[9px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-1">
                        <IconInfoCircle className="w-3 h-3" />Help
                      </button>
                    </div>
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
                  <span className="text-[9px] text-white/40">← Swipe to hide</span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
