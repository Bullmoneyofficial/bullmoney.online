"use client";

import React, { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconHandFinger, IconArrowLeft, IconArrowRight, IconPlayerPlay, IconInfoCircle, IconVolume, IconChevronUp, IconMusic, IconTrophy, IconFlame, IconBolt, IconZzz, IconPlayerPause, IconPlayerStop, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ShimmerLine } from "@/components/ui/UnifiedShimmer";

// Game color palette - BLUE ONLY (per design requirement)
const GAME_COLORS = {
  primary: "from-blue-500 via-cyan-400 to-blue-600",
  secondary: "from-blue-600 via-sky-400 to-blue-700",
  accent: "from-cyan-400 via-blue-500 to-sky-400",
  shimmer: "from-transparent via-sky-400/30 to-transparent",
};

// Optimized shimmer effect - uses unified shimmer system for better performance
export const GameShimmer = React.memo(function GameShimmer({ 
  className = "",
  speed = "normal",
  colors = "purple"
}: { 
  className?: string;
  speed?: "slow" | "normal" | "fast";
  colors?: "blue" | "purple" | "red" | "rainbow";
}) {
  return (
    <ShimmerLine 
      color="blue" 
      speed={speed as 'slow' | 'normal' | 'fast'}
      intensity="medium"
      className={className}
    />
  );
});

// Blue shimmer border effect - using unified shimmer
export const BlueShimmer = React.memo(function BlueShimmer({ className = "" }: { className?: string }) {
  return (
    <ShimmerLine 
      color="blue" 
      speed="normal"
      intensity="medium"
      className={className}
    />
  );
});

// "I'm Bored" popup that educates users about the game
export const BoredPopup = React.memo(function BoredPopup({
  show,
  onDismiss,
  onStartGame,
}: {
  show: boolean;
  onDismiss: () => void;
  onStartGame?: () => void;
}) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20, rotate: -5 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        rotate: [0, 2, -2, 0],
      }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 15,
        rotate: { duration: 2, repeat: Infinity, repeatDelay: 1 }
      }}
      className="absolute -top-16 left-0 right-0 mx-auto w-max z-20 pointer-events-auto"
    >
      <div className="relative">
        {/* Main bubble */}
        <div className="relative px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-700/95 via-sky-500/95 to-blue-700/95 border border-sky-400/50 shadow-xl shadow-sky-500/30 backdrop-blur-sm">
          {/* Shimmer */}
          <GameShimmer colors="rainbow" speed="fast" />
          
          {/* Content */}
          <div className="relative flex items-center gap-3">
            <motion.div
              className="p-1.5 rounded-xl bg-white/5 border border-white/10"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              <IconZzz className="w-6 h-6 text-sky-200" />
            </motion.div>
            <div>
              <p className="text-[11px] font-bold text-white">I&apos;m bored... catch me!</p>
              <p className="text-[9px] text-sky-100/80">This is a mini-game! Chase me around</p>
            </div>
            <button
              onClick={onDismiss}
              className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <IconX className="w-3 h-3 text-white/60" />
            </button>
          </div>
        </div>
        
        {/* Speech bubble tail */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-blue-700/95 to-sky-600/95 rotate-45 border-r border-b border-sky-400/50" />
      </div>
    </motion.div>
  );
});

// Quick 5–10s tutorial bubble (shown on first hover)
export const QuickGameTutorial = React.memo(function QuickGameTutorial({
  show,
  onDone,
  onStart,
  onWatchDemo,
  durationMs = 7500,
  className = "",
  onHoverChange,
}: {
  show: boolean;
  onDone: () => void;
  onStart?: () => void;
  onWatchDemo?: () => void;
  durationMs?: number;
  className?: string;
  onHoverChange?: (isHovering: boolean) => void;
}) {
  React.useEffect(() => {
    if (!show) return;
    if (durationMs <= 0) return;
    const t = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(t);
  }, [show, durationMs, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={cn(
            "fixed left-0 bottom-[200px] z-[10002] w-[300px] pointer-events-auto",
            className
          )}
          style={{ paddingLeft: '12px', paddingBottom: '20px' }}
          onMouseEnter={() => onHoverChange?.(true)}
          onMouseLeave={() => onHoverChange?.(false)}
        >
          <div className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-gradient-to-br from-blue-950/92 via-slate-900/95 to-blue-950/92 backdrop-blur-xl shadow-2xl">
            <GameShimmer colors="blue" speed="fast" />

            <button
              onClick={onDone}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Dismiss tutorial"
              type="button"
            >
              <IconX className="w-3.5 h-3.5 text-white/60" />
            </button>

            <div className="relative p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-xl bg-sky-500/10 border border-sky-300/15">
                  <IconInfoCircle className="w-4 h-4 text-sky-200" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-white">How to play</div>
                  <div className="text-[9px] text-white/55">Catch it before it escapes</div>
                </div>
              </div>

              <div className="space-y-1.5 text-[10px] text-white/75">
                <div className="flex items-start gap-2">
                  <span className="mt-[3px] inline-block w-1.5 h-1.5 rounded-full bg-sky-200/80" />
                  <span>Press Start to begin.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-[3px] inline-block w-1.5 h-1.5 rounded-full bg-sky-200/80" />
                  <span>Move your cursor near it to make it run.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-[3px] inline-block w-1.5 h-1.5 rounded-full bg-sky-200/80" />
                  <span>Click it to catch and score.</span>
                </div>
              </div>

              {(onStart || onWatchDemo) && (
                <div className="mt-3 flex items-center gap-2">
                  {onStart && (
                    <button
                      type="button"
                      onClick={onStart}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl",
                        "bg-sky-500/15 hover:bg-sky-500/20 border border-sky-300/25 hover:border-sky-300/40",
                        "text-[10px] font-semibold text-sky-100 transition-colors"
                      )}
                    >
                      <IconPlayerPlay className="w-4 h-4" />
                      Start
                    </button>
                  )}
                  {onWatchDemo && (
                    <button
                      type="button"
                      onClick={onWatchDemo}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl",
                        "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15",
                        "text-[10px] font-semibold text-white/80 transition-colors"
                      )}
                    >
                      <IconInfoCircle className="w-4 h-4" />
                      Watch demo
                    </button>
                  )}
                </div>
              )}

              {/* Tiny simulated chase bar */}
              <div className="mt-3 relative h-8 rounded-xl bg-black/40 border border-white/10 overflow-hidden">
                <motion.div
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60"
                  animate={{ x: [0, 210, 40, 210] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                />
                <motion.div
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-300"
                  animate={{ x: [30, 150, 10, 170] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                  aria-hidden
                />
                <div className="absolute inset-x-2 bottom-1 text-[9px] text-white/45">Try to catch it before it escapes</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const QuickGameTutorialDemo = React.memo(function QuickGameTutorialDemo({
  show,
  onDone,
  onStart,
  durationMs = 8000,
}: {
  show: boolean;
  onDone: () => void;
  onStart?: () => void;
  durationMs?: number;
}) {
  React.useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(t);
  }, [show, durationMs, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10003] bg-black/55 backdrop-blur-sm pointer-events-auto"
          onClick={onDone}
        >
          <motion.div
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-[320px] max-w-[92vw] rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-blue-950/92 via-slate-900/95 to-blue-950/92",
              "border border-sky-400/25 shadow-2xl"
            )}
          >
            <GameShimmer colors="blue" speed="fast" />

            <button
              onClick={onDone}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Close demo"
              type="button"
            >
              <IconX className="w-4 h-4 text-white/60" />
            </button>

            <div className="relative p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-300/15">
                  <IconInfoCircle className="w-4 h-4 text-sky-200" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-white">Quick visual demo</div>
                  <div className="text-[10px] text-white/55">Start → chase → click to catch</div>
                </div>
              </div>

              {/* Simulated scene */}
              <div className="relative h-28 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
                {/* Target */}
                <motion.div
                  className="absolute top-6 left-6 w-4 h-4 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(56,189,248,0.45)]"
                  animate={{ x: [0, 220, 80, 240], y: [0, 10, 40, 20] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                />

                {/* Cursor */}
                <motion.div
                  className="absolute top-14 left-10 w-3 h-3 rounded-full bg-white/75"
                  animate={{ x: [0, 170, 110, 200], y: [0, -10, 20, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                  aria-hidden
                />

                {/* Click pulse */}
                <motion.div
                  className="absolute top-14 left-10 w-10 h-10 rounded-full border border-white/25"
                  animate={{ opacity: [0, 0, 0.8, 0], scale: [0.8, 0.8, 1.6, 2.1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeOut", times: [0, 0.55, 0.7, 1] }}
                  aria-hidden
                />

                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 text-[10px] text-white/60">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-300" />
                  Target
                </div>
                <div className="absolute left-3 top-8 inline-flex items-center gap-1.5 text-[10px] text-white/60">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/70" />
                  Cursor
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-[10px] text-white/60">Then click to catch and score</div>
                {onStart && (
                  <button
                    type="button"
                    onClick={onStart}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl",
                      "bg-sky-500/15 hover:bg-sky-500/20 border border-sky-300/25 hover:border-sky-300/40",
                      "text-[10px] font-semibold text-sky-100 transition-colors"
                    )}
                  >
                    <IconPlayerPlay className="w-4 h-4" />
                    Start
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Compact Game HUD that stays near the player
export const CompactGameHUD = React.memo(function CompactGameHUD({
  energy = 100,
  score = 0,
  combo = 0,
  highScore = 0,
  isFleeing = false,
  isReturning = false,
  tirednessLevel = "fresh",
  isPlaying = true,
  isVisible = true,
  onPause,
  onStop,
  variant = "panel",
}: {
  energy?: number;
  score?: number;
  combo?: number;
  highScore?: number;
  isFleeing?: boolean;
  isReturning?: boolean;
  tirednessLevel?: "fresh" | "active" | "tired" | "exhausted";
  isPlaying?: boolean;
  isVisible?: boolean;
  onPause?: () => void;
  onStop?: () => void;
  variant?: "panel" | "attached";
}) {
  const getEnergyGradient = useCallback(() => {
    // Blue-only gradient: energy just shifts brightness
    if (energy > 70) return "from-sky-300 to-blue-500";
    if (energy > 40) return "from-sky-400 to-blue-600";
    return "from-blue-500 to-blue-700";
  }, [energy]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      className={cn(
        "relative overflow-hidden rounded-xl border backdrop-blur-md shadow-lg",
        "bg-black/80 border-blue-400/30",
        variant === "attached" && "bg-black/85 border-blue-300/35 shadow-2xl",
        isFleeing && "border-sky-300/70 shadow-[0_0_32px_rgba(56,189,248,0.45)]",
        isReturning && "border-blue-300/60 shadow-[0_0_22px_rgba(59,130,246,0.28)]"
      )}
    >
      {/* Shimmer overlay */}
      <GameShimmer colors="blue" speed={variant === "attached" ? "fast" : "normal"} />
      {/* Extra border shimmer for attached mode */}
      {variant === "attached" && <BlueShimmer className={cn(isFleeing ? "opacity-100" : "opacity-70")} />}
      
      <div className={cn("relative space-y-1.5", variant === "attached" ? "p-2" : "p-2")}>
        {/* Top row - score and controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Score */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-sky-200/75">Score</span>
              <motion.span 
                key={score}
                initial={{ scale: 1.15, color: "#38bdf8" }}
                animate={{ scale: 1, color: "#e0f2fe" }}
                className="text-sm font-bold tabular-nums"
              >
                {score}
              </motion.span>
            </div>
            
            {/* Combo */}
            {combo > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/25 border border-sky-300/40"
              >
                <IconFlame className="w-3 h-3 text-sky-300" />
                <span className="text-[10px] font-bold text-sky-200">x{combo}</span>
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {score >= highScore && score > 0 && (
              <motion.div
                animate={variant === "attached" ? {} : { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={variant === "attached" ? { duration: 0 } : { duration: 1, repeat: Infinity, repeatDelay: 2 }}
              >
                <IconTrophy className="w-3.5 h-3.5 text-sky-200" />
              </motion.div>
            )}
            {onStop && (
              <button
                onClick={onStop}
                className="p-1 rounded hover:bg-blue-500/25 transition-colors group"
                title="Stop game"
              >
                <IconPlayerStop className="w-3 h-3 text-sky-200/70 group-hover:text-sky-200" />
              </button>
            )}
          </div>
        </div>

        {/* Energy bar */}
        <div className="relative h-1.5 rounded-full bg-black/50 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", getEnergyGradient())}
            animate={{ width: `${energy}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
          {/* Shimmer on energy bar */}
          {variant !== "attached" && energy > 50 && (
            <div
              className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ animationDuration: "3s" }}
            />
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between text-[8px]">
          <motion.span
            className={cn(
              "font-semibold tracking-wide",
              isFleeing ? "text-sky-200 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]" :
              isReturning ? "text-blue-200" :
              tirednessLevel === "exhausted" ? "text-blue-200/75" :
              tirednessLevel === "tired" ? "text-sky-200/75" : "text-sky-200/70"
            )}
            animate={isFleeing ? { scale: [1, 1.06, 1] } : {}}
            transition={isFleeing ? { duration: 0.8, repeat: Infinity } : { duration: 0 }}
          >
            {isFleeing ? "Fleeing" :
             isReturning ? "Returning" :
             tirednessLevel === "exhausted" ? "Too sleepy" :
             tirednessLevel === "tired" ? "Getting tired" :
             "Catch me"}
          </motion.span>
          <span className="text-white/40 tabular-nums">{Math.round(energy)}%</span>
        </div>
      </div>
    </motion.div>
  );
});

// Game control buttons for the widget
export const GameControls = React.memo(function GameControls({
  isPlaying,
  onStart,
  onStop,
  disabled = false,
  className = "",
}: {
  isPlaying: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {isPlaying ? (
        <motion.button
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={onStop}
          disabled={disabled}
          className={cn(
            "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg overflow-hidden",
            "bg-gradient-to-r from-blue-500/20 via-sky-500/15 to-blue-600/20",
            "border border-blue-400/30 hover:border-sky-300/60",
            "text-[10px] font-medium text-sky-200 hover:text-sky-100",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <GameShimmer colors="blue" speed="fast" />
          <IconPlayerStop className="w-3 h-3" />
          <span>Stop Game</span>
        </motion.button>
      ) : (
        <motion.button
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={onStart}
          disabled={disabled}
          className={cn(
            "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg overflow-hidden",
            "bg-gradient-to-r from-blue-500/20 via-sky-500/15 to-blue-500/20",
            "border border-blue-400/30 hover:border-sky-300/60",
            "text-[10px] font-medium text-sky-200 hover:text-sky-100",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <GameShimmer colors="blue" speed="normal" />
          <IconPlayerPlay className="w-3 h-3" />
          <span>Play Game</span>
        </motion.button>
      )}
    </div>
  );
});

// Sparkle burst animation - lightweight version
export const SparkleBurst = React.memo(function SparkleBurst({
  trigger,
  colors = ["#8b5cf6", "#3b82f6", "#ef4444"],
}: {
  trigger: boolean;
  colors?: string[];
}) {
  if (!trigger) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ 
            backgroundColor: colors[i % colors.length],
            left: '50%',
            top: '50%',
          }}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{ 
            scale: [0, 1, 0],
            x: Math.cos((i * 60) * Math.PI / 180) * 30,
            y: Math.sin((i * 60) * Math.PI / 180) * 30,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      ))}
    </div>
  );
});

// Floating particles background - very lightweight
export const FloatingParticles = React.memo(function FloatingParticles({
  count = 3,
  color = "purple",
}: {
  count?: number;
  color?: "blue" | "purple" | "red";
}) {
  const colorClass = {
    blue: "bg-sky-400/30",
    purple: "bg-sky-400/30",
    red: "bg-sky-400/30",
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={cn("absolute w-1 h-1 rounded-full", colorClass[color])}
          style={{
            left: `${20 + i * 30}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
          animate={{
            y: [-5, 5, -5],
            x: [-3, 3, -3],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
});

// ============================================
// Additional Game Animations (5-10 new ideas)
// ============================================

// 1. Pulse Ring Animation - expanding rings effect
export const PulseRing = React.memo(function PulseRing({
  active = false,
  color = "purple",
  size = "md",
}: {
  active?: boolean;
  color?: "blue" | "purple" | "red";
  size?: "sm" | "md" | "lg";
}) {
  if (!active) return null;
  
  const colorMap = {
    blue: "border-sky-300",
    purple: "border-sky-300",
    red: "border-sky-300",
  };
  
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn("absolute rounded-full border-2", colorMap[color], sizeMap[size])}
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
});

// 2. Trail Effect - motion blur trail behind moving objects
export const MotionTrail = React.memo(function MotionTrail({
  show = false,
  direction = 1, // 1 for right, -1 for left
  color = "purple",
}: {
  show?: boolean;
  direction?: number;
  color?: "blue" | "purple" | "red";
}) {
  if (!show) return null;
  
  const colorMap = {
    blue: "from-sky-300/60 to-transparent",
    purple: "from-sky-300/60 to-transparent",
    red: "from-sky-300/60 to-transparent",
  };

  return (
    <motion.div
      className={cn(
        "absolute inset-y-0 w-16 bg-gradient-to-r pointer-events-none",
        colorMap[color],
        direction > 0 ? "-left-16" : "-right-16"
      )}
      style={{ transform: direction > 0 ? "scaleX(1)" : "scaleX(-1)" }}
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: [0.8, 0], scaleX: [0, 1] }}
      transition={{ duration: 0.3, repeat: Infinity }}
    />
  );
});

// 3. Bounce Dot Indicator - shows game activity
export const BounceDots = React.memo(function BounceDots({
  active = false,
  color = "purple",
}: {
  active?: boolean;
  color?: "blue" | "purple" | "red";
}) {
  if (!active) return null;
  
  const colorMap = {
    blue: "bg-sky-300",
    purple: "bg-sky-300",
    red: "bg-sky-300",
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn("w-1.5 h-1.5 rounded-full", colorMap[color])}
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});

// 4. Score Pop Animation - shows when score increases
export const ScorePop = React.memo(function ScorePop({
  show = false,
  value = "+1",
  color = "purple",
}: {
  show?: boolean;
  value?: string;
  color?: "blue" | "purple" | "red";
}) {
  const colorMap = {
    blue: "text-sky-300",
    purple: "text-sky-300",
    red: "text-sky-300",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className={cn("absolute -top-4 left-1/2 font-bold text-sm", colorMap[color])}
          initial={{ opacity: 1, y: 0, x: "-50%", scale: 0.5 }}
          animate={{ opacity: 0, y: -20, scale: 1.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {value}
        </motion.span>
      )}
    </AnimatePresence>
  );
});

// 5. Glitch Effect - quick visual glitch for impacts
export const GlitchEffect = React.memo(function GlitchEffect({
  trigger = false,
}: {
  trigger?: boolean;
}) {
  if (!trigger) return null;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0, 1, 0] }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 bg-sky-500/20"
        animate={{ x: [-2, 2, -2, 0], scaleY: [1, 1.02, 0.98, 1] }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        className="absolute inset-0 bg-blue-500/20"
        animate={{ x: [2, -2, 2, 0], scaleY: [0.98, 1.02, 1, 1] }}
        transition={{ duration: 0.15, delay: 0.05 }}
      />
    </motion.div>
  );
});

// 6. Energy Wave - ripple effect from center
export const EnergyWave = React.memo(function EnergyWave({
  active = false,
  color = "purple",
}: {
  active?: boolean;
  color?: "blue" | "purple" | "red";
}) {
  if (!active) return null;
  
  const colorMap = {
    blue: "bg-sky-400/30",
    purple: "bg-sky-400/30",
    red: "bg-sky-400/30",
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <motion.div
        className={cn("absolute w-full h-full rounded-full", colorMap[color])}
        initial={{ scale: 0.5, opacity: 0.6 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
      />
    </div>
  );
});

// 7. Confetti Burst - celebration effect
export const ConfettiBurst = React.memo(function ConfettiBurst({
  trigger = false,
}: {
  trigger?: boolean;
}) {
  if (!trigger) return null;

  const colors = ["#38bdf8", "#60a5fa", "#0ea5e9", "#3b82f6", "#93c5fd"];
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2"
          style={{
            backgroundColor: colors[i % colors.length],
            left: "50%",
            top: "50%",
            borderRadius: i % 2 === 0 ? "50%" : "2px",
          }}
          initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            scale: [0, 1, 0.5],
            x: Math.cos((i * 30) * Math.PI / 180) * (40 + Math.random() * 20),
            y: Math.sin((i * 30) * Math.PI / 180) * (40 + Math.random() * 20) - 20,
            rotate: Math.random() * 360,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </div>
  );
});

// 8. Loading Spinner with game colors
export const GameSpinner = React.memo(function GameSpinner({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <motion.div
      className={cn(
        "rounded-full border-2 border-transparent border-t-sky-400 border-r-blue-500",
        sizeMap[size]
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
});

// 9. Status Badge - shows game state
export const StatusBadge = React.memo(function StatusBadge({
  status,
  animate = true,
}: {
  status: "playing" | "paused" | "idle" | "caught" | "escaped";
  animate?: boolean;
}) {
  const statusConfig = {
    playing: { color: "bg-blue-600", text: "Playing" },
    paused: { color: "bg-blue-700", text: "Paused" },
    idle: { color: "bg-blue-950/60", text: "Idle" },
    caught: { color: "bg-sky-600", text: "Caught" },
    escaped: { color: "bg-blue-600", text: "Escaped" },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium text-white",
        config.color,
        status === "escaped" && "ring-1 ring-sky-300/40"
      )}
      animate={animate ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {status === "escaped" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          animate={{ x: ["-120%", "220%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear", repeatDelay: 0.6 }}
          aria-hidden
        />
      )}
      <span className="relative inline-block w-1.5 h-1.5 rounded-full bg-white/80" aria-hidden />
      <span>{config.text}</span>
    </motion.div>
  );
});

// 10. Orbit Animation - particles orbiting around element
export const OrbitParticles = React.memo(function OrbitParticles({
  active = false,
  count = 3,
}: {
  active?: boolean;
  count?: number;
}) {
  if (!active) return null;

  const colors = ["bg-sky-300", "bg-blue-300", "bg-cyan-300"];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={cn("absolute w-1.5 h-1.5 rounded-full", colors[i % colors.length])}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            transformOrigin: "center center",
            left: "calc(50% - 3px)",
            top: `calc(50% - ${12 + i * 8}px)`,
          }}
        >
          <motion.div
            className={cn("w-1.5 h-1.5 rounded-full", colors[i % colors.length])}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.2 }}
          />
        </motion.div>
      ))}
    </div>
  );
});

// Animated helper tip component
export const AnimatedTip = React.memo(function AnimatedTip({
  text,
  icon = "tap",
  delay = 0,
  show = true,
  variant = "default",
  pulse = false,
}: {
  text: string;
  icon?: "tap" | "swipe-left" | "swipe-right" | "play" | "info" | "drag" | "close" | "step";
  delay?: number;
  show?: boolean;
  variant?: "default" | "success" | "warning" | "numbered";
  pulse?: boolean;
}) {
  const icons = useMemo(
    () => ({
      tap: <IconHandFinger className="w-3.5 h-3.5" />,
      "swipe-left": <IconArrowLeft className="w-3.5 h-3.5" />,
      "swipe-right": <IconArrowRight className="w-3.5 h-3.5" />,
      play: <IconPlayerPlay className="w-3.5 h-3.5" />,
      info: <IconInfoCircle className="w-3.5 h-3.5" />,
      drag: <IconVolume className="w-3.5 h-3.5" />,
      close: <IconChevronUp className="w-3.5 h-3.5 rotate-180" />,
      step: <IconMusic className="w-3.5 h-3.5" />,
    }),
    []
  );

  const variants = {
    default: "bg-blue-500/15 border-blue-400/30 text-blue-200",
    success: "bg-blue-500/15 border-blue-400/30 text-blue-200",
    warning: "bg-blue-500/15 border-blue-400/30 text-blue-200",
    numbered: "bg-blue-500/15 border-blue-400/30 text-blue-200",
  } as const;

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      transition={{ delay, duration: 0.3, type: "spring", stiffness: 200 }}
      className="relative overflow-hidden"
    >
      <motion.div
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium",
          variants[variant]
        )}
        animate={pulse ? { scale: [1, 1.02, 1] } : {}}
        transition={pulse ? { duration: 2, repeat: Infinity } : {}}
      >
        <motion.span
          animate={{
            scale: [1, 1.15, 1],
            rotate: icon === "tap" ? [0, -10, 10, 0] : 0,
          }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
        >
          {icons[icon as keyof typeof icons] || icons.tap}
        </motion.span>
        <span>{text}</span>
        <div
          className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-300/10 to-transparent"
          style={{ animationDuration: "5s", animationDelay: `${delay}s` }}
        />
      </motion.div>
    </motion.div>
  );
});

// Step-by-step tutorial overlay
export const StepGuide = React.memo(function StepGuide({
  step,
  totalSteps,
  title,
  description,
  onNext,
  onSkip,
}: {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-400/30 overflow-hidden"
    >
      <div
        className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
        style={{ animationDuration: "5s" }}
      />

      <div className="relative flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-6 h-6 rounded-full bg-blue-500/30 border border-blue-400/50 flex items-center justify-center text-[11px] font-bold text-blue-200"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {step}
          </motion.div>
          <span className="text-[10px] text-blue-300/70">of {totalSteps}</span>
        </div>
        <button
          onClick={onSkip}
          className="text-[9px] text-white/40 hover:text-white/70 transition-colors"
        >
          Skip tutorial
        </button>
      </div>

      <div className="relative">
        <h4 className="text-[12px] font-semibold text-white mb-1">{title}</h4>
        <p className="text-[10px] text-white/60 leading-relaxed mb-3">{description}</p>
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i + 1 === step ? "bg-blue-400" : i + 1 < step ? "bg-blue-400/50" : "bg-white/20"
              )}
              animate={i + 1 === step ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>
        <motion.button
          onClick={onNext}
          className="px-3 py-1.5 rounded-lg bg-blue-500/30 border border-blue-400/40 text-[10px] font-medium text-blue-200 hover:bg-blue-500/40 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {step === totalSteps ? "Got it!" : "Next →"}
        </motion.button>
      </div>
    </motion.div>
  );
});

// Floating action hint that points to elements
export const ActionHint = React.memo(function ActionHint({
  text,
  position = "bottom",
  show = true,
}: {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  show?: boolean;
}) {
  if (!show) return null;

  const positionClasses = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  } as const;

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-blue-400/30",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-blue-400/30",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-blue-400/30",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-blue-400/30",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn("absolute z-50 pointer-events-none", positionClasses[position])}
    >
      <motion.div
        animate={{ y: position === "top" || position === "bottom" ? [0, -3, 0] : 0, x: position === "left" || position === "right" ? [0, -3, 0] : 0 }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="relative"
      >
        <div className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm text-[9px] text-blue-200 font-medium whitespace-nowrap">
          {text}
        </div>
        <div className={cn("absolute w-0 h-0 border-4", arrowClasses[position])} />
      </motion.div>
    </motion.div>
  );
});

// Enhanced Slider with blue styling
export const Slider = React.memo(function Slider({
  value,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className={cn("flex flex-col gap-1.5 group", disabled && "opacity-50 pointer-events-none")}
    >
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-white/80 font-medium">{label}</span>
          {hint && (
            <span className="text-[9px] text-blue-400/60 opacity-0 group-hover:opacity-100 transition-opacity">
              {hint}
            </span>
          )}
        </div>
        <span className="tabular-nums text-blue-300/80 font-medium">{pct}%</span>
      </div>
      <div className="relative">
        <input
          aria-label={label}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 
                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/30
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-300/50
                     [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.5) ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`
          }}
        />
      </div>
    </div>
  );
});

// Energy Bar component for the wandering game
export const EnergyBar = React.memo(function EnergyBar({
  energy,
  maxEnergy = 100,
  showLabel = true,
  size = "md",
  variant = "default",
}: {
  energy: number;
  maxEnergy?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "game";
}) {
  const percentage = Math.max(0, Math.min(100, (energy / maxEnergy) * 100));
  
  const getEnergyColor = () => {
    if (percentage > 70) return "from-sky-400 to-cyan-500";
    if (percentage > 40) return "from-blue-400 to-sky-500";
    if (percentage > 20) return "from-blue-500 to-blue-600";
    return "from-blue-600 to-blue-800";
  };

  const getEnergyIcon = () => {
    if (percentage > 70) return <IconBolt className="w-3 h-3" />;
    if (percentage > 40) return <IconFlame className="w-3 h-3" />;
    return <IconZzz className="w-3 h-3" />;
  };

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className="flex flex-col gap-1">
      {showLabel && (
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5 text-white/70">
            {getEnergyIcon()}
            <span className="font-medium">Energy</span>
          </div>
          <span className={cn(
            "tabular-nums font-bold",
            percentage > 70 ? "text-cyan-300" :
            percentage > 40 ? "text-sky-300" :
            percentage > 20 ? "text-blue-300" : "text-blue-200"
          )}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={cn(
        "relative w-full rounded-full overflow-hidden",
        sizeClasses[size],
        variant === "game" ? "bg-black/40 border border-white/10" : "bg-white/10"
      )}>
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getEnergyColor())}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        />
        {/* Shimmer effect when high energy */}
        {percentage > 70 && (
          <div
            className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{ animationDuration: "3s" }}
          />
        )}
        {/* Pulse when low energy */}
        {percentage <= 20 && (
          <motion.div
            className="absolute inset-0 bg-blue-500/20"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
});

// Game Stats display component
export const GameStats = React.memo(function GameStats({
  highScore,
  currentScore,
  totalCatches,
  combo,
  gamesPlayed,
  compact = false,
}: {
  highScore: number;
  currentScore: number;
  totalCatches: number;
  combo: number;
  gamesPlayed: number;
  compact?: boolean;
}) {
  const isNewHighScore = currentScore > 0 && currentScore >= highScore;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-[9px]">
        <div className="flex items-center gap-1">
          <IconTrophy className="w-3 h-3 text-sky-300" />
          <span className="text-white/60">Best:</span>
          <span className="font-bold text-sky-300 tabular-nums">{highScore}</span>
        </div>
        {combo > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1"
          >
            <IconFlame className="w-3 h-3 text-cyan-300" />
            <span className="font-bold text-cyan-300">x{combo}</span>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 backdrop-blur-sm"
    >
      {/* Current Score with animation */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-white/60">Current Score</div>
        <motion.div
          key={currentScore}
          initial={{ scale: 1.2, color: "#60a5fa" }}
          animate={{ scale: 1, color: isNewHighScore ? "#7dd3fc" : "#ffffff" }}
          className="text-xl font-bold tabular-nums"
        >
          {currentScore}
        </motion.div>
      </div>

      {/* New High Score indicator */}
      <AnimatePresence>
        {isNewHighScore && currentScore > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 py-2 px-3 rounded-lg bg-gradient-to-r from-sky-500/20 to-cyan-500/20 border border-sky-400/30 text-center"
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-[11px] font-bold text-sky-200"
            >
              NEW HIGH SCORE
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <IconTrophy className="w-4 h-4 mx-auto mb-1 text-sky-300" />
          <div className="text-[9px] text-white/50">Best</div>
          <div className="text-sm font-bold text-sky-300 tabular-nums">{highScore}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <IconHandFinger className="w-4 h-4 mx-auto mb-1 text-blue-300" />
          <div className="text-[9px] text-white/50">Catches</div>
          <div className="text-sm font-bold text-blue-300 tabular-nums">{totalCatches}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <IconFlame className="w-4 h-4 mx-auto mb-1 text-cyan-300" />
          <div className="text-[9px] text-white/50">Combo</div>
          <div className="text-sm font-bold text-cyan-300 tabular-nums">x{combo}</div>
        </div>
      </div>

      {/* Games played footer */}
      <div className="mt-2 pt-2 border-t border-white/5 text-center text-[9px] text-white/40">
        {gamesPlayed} games played
      </div>
    </motion.div>
  );
});

// Floating Game HUD for when the game is active
export const GameHUD = React.memo(function GameHUD({
  energy,
  score,
  combo,
  highScore,
  isFleeing,
  isReturning,
  tirednessLevel,
  isMobile,
}: {
  energy: number;
  score: number;
  combo: number;
  highScore: number;
  isFleeing: boolean;
  isReturning: boolean;
  tirednessLevel: "fresh" | "active" | "tired" | "exhausted";
  isMobile: boolean;
}) {
  const statusText = isFleeing ? "Fleeing!" : isReturning ? "Coming back..." :
    tirednessLevel === "fresh" ? "Full energy!" :
    tirednessLevel === "active" ? "Active" :
    tirednessLevel === "tired" ? "Getting tired..." : "So sleepy...";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={cn(
        "fixed z-[10000] pointer-events-none",
        isMobile ? "top-20 left-3 right-3" : "top-4 left-1/2 -translate-x-1/2"
      )}
    >
      <div className={cn(
        "backdrop-blur-xl rounded-2xl border shadow-2xl overflow-hidden",
        isFleeing ? "bg-blue-500/20 border-blue-400/40" :
        isReturning ? "bg-sky-500/20 border-sky-400/40" :
        "bg-black/70 border-white/20"
      )}>
        <div className={cn("p-3", isMobile ? "flex flex-col gap-2" : "flex items-center gap-4 px-4")}>
          {/* Status */}
          <div className="flex items-center gap-2">
            <motion.span
              className={cn(
                "inline-block w-2 h-2 rounded-full",
                isFleeing ? "bg-sky-300" : isReturning ? "bg-cyan-300" : "bg-white/40"
              )}
              animate={isFleeing || isReturning ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1, repeat: isFleeing || isReturning ? Infinity : 0 }}
              aria-hidden
            />
            <span className={cn(
              "text-[11px] font-medium",
              isFleeing ? "text-sky-200" :
              isReturning ? "text-cyan-200" : "text-white/70"
            )}>
              {statusText}
            </span>
          </div>

          {/* Energy bar */}
          <div className={cn("flex-1", isMobile ? "w-full" : "w-32")}>
            <EnergyBar energy={energy} showLabel={false} size="sm" variant="game" />
          </div>

          {/* Score */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-[9px] text-white/50">Score</div>
              <motion.div
                key={score}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-sm font-bold text-white tabular-nums"
              >
                {score}
              </motion.div>
            </div>
            
            {combo > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="px-2 py-1 rounded-lg bg-blue-500/30 border border-blue-400/40"
              >
                <span className="text-[10px] font-bold text-sky-200">x{combo}</span>
              </motion.div>
            )}

            {score >= highScore && score > 0 && (
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <IconTrophy className="w-4 h-4 text-sky-300" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="h-1 bg-black/30">
          <motion.div
            className={cn(
              "h-full",
              energy > 70 ? "bg-cyan-400" :
              energy > 40 ? "bg-sky-400" :
              energy > 20 ? "bg-blue-400" : "bg-blue-600"
            )}
            animate={{ width: `${energy}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>
    </motion.div>
  );
});

// Mobile-specific touch indicator
export const TouchIndicator = React.memo(function TouchIndicator({
  position,
  isActive,
}: {
  position: { x: number; y: number } | null;
  isActive: boolean;
}) {
  if (!position || !isActive) return null;

  return (
    <motion.div
      className="fixed z-[9995] pointer-events-none"
      style={{ left: position.x - 30, top: position.y - 30 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      <motion.div
        className="w-[60px] h-[60px] rounded-full border-2 border-blue-400/50"
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-blue-400/60"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
    </motion.div>
  );
});

// Game over screen
export const GameOverScreen = React.memo(function GameOverScreen({
  score,
  highScore,
  isNewHighScore,
  wasCaught,
  onPlayAgain,
  onClose,
}: {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  wasCaught: boolean;
  onPlayAgain: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-[280px] p-6 rounded-2xl border shadow-2xl overflow-hidden",
          "bg-gradient-to-br from-blue-950/90 via-slate-900/95 to-blue-950/90",
          wasCaught ? "border-white/10" : "border-sky-400/25"
        )}
      >
        {!wasCaught && <GameShimmer colors="blue" speed="fast" />}
        {/* Confetti for high score */}
        {isNewHighScore && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full",
                  i % 4 === 0 ? "bg-sky-300" :
                  i % 4 === 1 ? "bg-blue-300" :
                  i % 4 === 2 ? "bg-cyan-300" : "bg-sky-400"
                )}
                initial={{ 
                  x: 140,
                  y: 80,
                  scale: 0,
                }}
                animate={{ 
                  x: 140 + Math.cos(i * 30 * Math.PI / 180) * 120,
                  y: 80 + Math.sin(i * 30 * Math.PI / 180) * 80 - 20,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.05,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            ))}
          </>
        )}

        {/* Title */}
        <div className="text-center mb-4">
          <motion.div
            animate={wasCaught ? { rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="mb-2 flex items-center justify-center"
          >
            <div className={cn(
              "p-3 rounded-2xl border",
              wasCaught ? "bg-white/5 border-white/10" : "bg-sky-500/10 border-sky-300/20"
            )}>
              {wasCaught ? (
                <IconHandFinger className="w-8 h-8 text-white/80" />
              ) : (
                <IconZzz className="w-8 h-8 text-sky-200" />
              )}
            </div>
          </motion.div>
          <h3 className="text-xl font-bold text-white">
            {wasCaught ? "Caught!" : "Escaped!"}
          </h3>
          <p className="text-sm text-white/60">
            {wasCaught ? "Nice reflexes!" : "Too sleepy to continue..."}
          </p>
        </div>

        {/* Score display */}
        <div className="text-center mb-4">
          <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Final Score</div>
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className={cn(
              "text-4xl font-bold tabular-nums",
              isNewHighScore ? "text-sky-300" : "text-white"
            )}
          >
            {score}
          </motion.div>
        </div>

        {/* New high score badge */}
        <AnimatePresence>
          {isNewHighScore && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 py-2 px-4 rounded-xl bg-gradient-to-r from-sky-500/20 to-cyan-500/20 border border-sky-400/30 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <IconTrophy className="w-5 h-5 mx-auto mb-1 text-sky-300" />
                <span className="text-sm font-bold text-sky-200">New High Score!</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previous high score */}
        {!isNewHighScore && (
          <div className="mb-4 text-center text-[11px] text-white/50">
            High Score: <span className="text-sky-300 font-bold">{highScore}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-sm hover:from-blue-400 hover:to-cyan-400 transition-all"
          >
            Play Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-white/10 text-white/70 font-medium text-sm hover:bg-white/20 transition-all"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
});
