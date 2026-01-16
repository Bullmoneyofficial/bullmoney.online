"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

/**
 * Animated Music Wave Bars - Trading ticker style
 * Shows animated equalizer bars next to music icon
 */
function MusicWaveBars({ isPlaying, color = "blue" }: { isPlaying: boolean; color?: "blue" | "green" }) {
  const barColors = color === "green" 
    ? { bar: "#34d399", glow: "rgba(52, 211, 153, 0.6)" }
    : { bar: "#60a5fa", glow: "rgba(96, 165, 250, 0.6)" };
  
  return (
    <div className="flex items-end gap-[2px] h-[14px]">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full origin-bottom"
          style={{ 
            backgroundColor: barColors.bar,
            boxShadow: `0 0 4px ${barColors.glow}`,
          }}
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
  } = props;

  // Scroll detection for auto-minimizing
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      
      // Trigger minimization on significant scroll when widget is not open (whether hidden or visible)
      if (scrollDelta > 15 && !open) {
        setIsScrollMinimized(true);
        lastScrollY.current = currentScrollY;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Set timeout to expand back after scroll stops
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrollMinimized(false);
        }, 1200); // Expand back 1.2s after scroll stops
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

  const currentStreamingIcon = React.useMemo(() => {
    const SourceIcon = sourceIcons[musicSource];
    if (isStreamingSource && SourceIcon) {
      return <SourceIcon className="h-5 w-5 text-blue-200/90" />;
    }
    return <IconMusic className="h-5 w-5 text-blue-200/90" />;
  }, [isStreamingSource, musicSource]);

  return (
    <>
      {/* Pull tab to show widget when hidden - minimizes/maximizes on scroll */}
      <AnimatePresence mode="wait">
        {widgetHidden && !isScrollMinimized && (
          <motion.button
            key="normal-pull-tab"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              SoundEffects.click();
              setWidgetHidden(false);
            }}
            className="fixed left-0 bottom-16 z-[100200] flex items-center gap-1 pl-1 pr-3 py-3 rounded-r-xl bg-blue-500/40 border border-l-0 border-blue-400/50 backdrop-blur-md hover:bg-blue-500/50 transition-colors group pointer-events-auto"
          >
            <IconGripVertical className="w-4 h-4 text-blue-300/60 group-hover:text-blue-300" />
            <IconMusic className="w-4 h-4 text-blue-300" />
          </motion.button>
        )}

        {/* Minimized pull tab on scroll when widget is hidden */}
        {widgetHidden && isScrollMinimized && (
          <motion.button
            key="minimized-pull-tab"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => {
              SoundEffects.click();
              setIsScrollMinimized(false);
            }}
            onMouseEnter={() => {
              SoundEffects.hover?.();
              // Expand on hover (desktop)
              if (window.matchMedia('(hover: hover)').matches) {
                setIsScrollMinimized(false);
              }
            }}
            className={cn(
              "fixed left-0 bottom-16 z-[100200] flex items-center gap-1 px-1.5 py-2 rounded-r-lg",
              "bg-gradient-to-r from-blue-600/40 via-blue-500/25 to-slate-900/50",
              "backdrop-blur-2xl border border-l-0 border-blue-500/50",
              "shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
              "hover:border-blue-400/70 transition-all duration-200",
              "pointer-events-auto group"
            )}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconGripVertical className="w-3 h-3 text-blue-300/60 group-hover:text-blue-300" />
            <motion.div
              animate={isMusicPlaying || streamingActive ? { 
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <IconMusic 
                className={cn(
                  "w-3 h-3",
                  isMusicPlaying || streamingActive ? "text-blue-300" : "text-blue-400/70"
                )} 
                style={isMusicPlaying || streamingActive ? {
                  filter: "drop-shadow(0 0 4px rgba(96, 165, 250, 0.8))"
                } : {}}
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
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!widgetHidden && (
          <>
            {/* MINIMIZED PILL STATE - Cool Music icon with animated wave bars */}
            {isScrollMinimized && !open && (
              <motion.button
                key="minimized-audio"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                onClick={() => {
                  SoundEffects.click();
                  setIsScrollMinimized(false);
                }}
                onMouseEnter={() => {
                  SoundEffects.hover?.();
                  // Expand on hover (desktop)
                  if (window.matchMedia('(hover: hover)').matches) {
                    setIsScrollMinimized(false);
                  }
                }}
                className={cn(
                  "fixed left-3 bottom-14 z-[100200] flex items-center gap-1.5 px-2.5 py-2 rounded-xl",
                  "bg-gradient-to-br from-blue-600/40 via-blue-500/25 to-slate-900/50",
                  "backdrop-blur-2xl border border-blue-500/50",
                  "shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30",
                  "hover:border-blue-400/70 transition-all duration-200",
                  "pointer-events-auto"
                )}
                whileHover={{ scale: 1.05, x: 2 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Music Icon with pulse */}
                <motion.div
                  animate={isMusicPlaying || streamingActive ? { 
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <IconMusic 
                    className={cn(
                      "w-4 h-4",
                      isMusicPlaying || streamingActive ? "text-blue-300" : "text-blue-400/70"
                    )} 
                    style={isMusicPlaying || streamingActive ? {
                      filter: "drop-shadow(0 0 6px rgba(96, 165, 250, 0.8))"
                    } : {}}
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
                
                {/* Animated Music Wave Bars */}
                <MusicWaveBars isPlaying={isMusicPlaying || streamingActive} color={isMusicPlaying || streamingActive ? "green" : "blue"} />
              </motion.button>
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
                className="fixed left-3 bottom-14 z-[100200] pointer-events-auto"
                drag="x"
                dragConstraints={{ left: -150, right: 0 }}
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
                  className="absolute left-0 bottom-[calc(100%+8px)] z-50 pointer-events-none"
                >
                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-600/90 to-blue-800/90 border border-blue-400/50 shadow-xl backdrop-blur-md">
                    <div className="absolute -bottom-2 left-6 w-3 h-3 bg-blue-700/90 rotate-45 border-b border-r border-blue-400/50" />
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
              className={cn(
                "relative rounded-2xl border border-blue-500/30 bg-black/95 backdrop-blur-2xl shadow-2xl",
                "text-white/90 overflow-hidden audio-shimmer",
                open ? "w-[280px] sm:w-[320px]" : "w-auto"
              )}
            >
              {shimmerEnabled && <ShimmerLine color="blue" intensity={shimmerSettings.intensity as any} speed={shimmerSettings.speed as any} />}

              {/* Header */}
              <div className="relative flex items-center gap-2 p-2">
                <motion.button
                  onClick={() => {
                    SoundEffects.click();
                    setOpen(!open);
                  }}
                  className={cn(
                    "relative h-10 w-10 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br from-blue-500/40 to-blue-600/30",
                    "hover:from-blue-500/50 hover:to-blue-600/40",
                    "border border-blue-400/50 transition-all duration-200"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BlueShimmer />
                  <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-blue-300">
                    <IconChevronUp className="h-4 w-4" />
                  </motion.div>
                </motion.button>

                <div className={cn("flex items-center gap-2", open ? "flex-1" : "")}>
                  <motion.div
                    className={cn(
                      "relative h-10 w-10 rounded-xl flex items-center justify-center border",
                      isStreamingSource && streamingActive
                        ? "bg-gradient-to-br from-blue-500/40 to-cyan-500/30 border-blue-400/60" 
                        : "bg-white/15 border-white/25"
                    )}
                    animate={isStreamingSource && streamingActive ? { 
                      boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0)", "0 0 15px 3px rgba(59, 130, 246, 0.15)", "0 0 0 0 rgba(59, 130, 246, 0)"]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentStreamingIcon}
                  </motion.div>

                  {open && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold leading-tight text-white">
                        {isStreamingSource && streamingActive ? sourceLabel[musicSource] : "🎵 Audio"}
                      </div>
                      <div className="text-[10px] text-blue-300/70 leading-tight">
                        {isStreamingSource && streamingActive ? "Playing" : "Choose service"}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => { SoundEffects.click(); toggleMusic(); }}
                    className={cn(
                      "relative h-10 w-10 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br from-white/25 to-white/15",
                      "hover:from-white/35 hover:to-white/25",
                      "border border-white/30 transition-all"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isMusicPlaying ? <IconPlayerPause className="h-4 w-4 text-blue-300" /> : <IconPlayerPlay className="h-4 w-4 text-blue-300" />}
                  </motion.button>

                  {open && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => { SoundEffects.click(); setOpen(false); }}
                      className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-500/40 hover:bg-blue-500/50 border border-blue-400/50 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconX className="h-4 w-4 text-sky-200" />
                    </motion.button>
                  )}
                </div>
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
                    {/* Streaming Status */}
                    {isStreamingSource && streamingEmbedUrl && streamingActive && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 px-2 py-1.5 rounded-lg bg-white/15 border border-white/25 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 h-3 items-end">
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity }} />
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [10, 5, 10] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [6, 10, 6] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
                          </div>
                          <span className="text-[10px] text-white/80 font-medium">{sourceLabel[musicSource]}</span>
                        </div>
                        <button onClick={() => { SoundEffects.click(); setStreamingActive(false); setMusicEnabled(false); }} className="text-[9px] text-sky-200 hover:text-sky-100">Stop</button>
                      </motion.div>
                    )}

                    {/* Music Service Selection */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-white/70 font-medium">🎧 Music Service</span>
                        {!streamingActive && <span className="text-[9px] text-blue-400 shimmer-pulse">Tap one</span>}
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
                                isActive
                                  ? "bg-gradient-to-br from-blue-500/25 via-sky-500/20 to-blue-600/25 border-blue-400/50 text-sky-100 border"
                                  : "bg-white/15 border border-white/25 text-white/80 hover:bg-white/25 hover:text-white"
                              )}
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
                          className={cn("px-2 py-0.5 rounded text-[8px] font-medium transition-colors", tipsMuted ? "bg-white/15 text-white/60" : "bg-blue-500/40 text-blue-200")}
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

                    {/* Bottom actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button onClick={() => { SoundEffects.click(); setMusicEnabled(false); setMusicEmbedOpen(true); setOpen(false); }} className="text-[9px] text-blue-300/70 hover:text-blue-200 transition-colors">🎵 Full Library</button>
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
