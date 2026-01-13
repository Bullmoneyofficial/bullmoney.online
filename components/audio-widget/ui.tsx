"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconHandFinger, IconArrowLeft, IconArrowRight, IconPlayerPlay, IconInfoCircle, IconVolume, IconChevronUp, IconMusic, IconTrophy, IconFlame, IconBolt, IconZzz } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// Blue shimmer border effect
export const BlueShimmer = React.memo(function BlueShimmer({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={cn("absolute inset-0 overflow-hidden rounded-xl pointer-events-none", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
      />
    </motion.div>
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
    success: "bg-green-500/15 border-green-400/30 text-green-200",
    warning: "bg-amber-500/15 border-amber-400/30 text-amber-200",
    numbered: "bg-purple-500/15 border-purple-400/30 text-purple-200",
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
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/10 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3, delay }}
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
      className="relative p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-400/30 overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
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
    if (percentage > 70) return "from-green-400 to-emerald-500";
    if (percentage > 40) return "from-yellow-400 to-orange-500";
    if (percentage > 20) return "from-orange-400 to-red-500";
    return "from-red-500 to-red-700";
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
            percentage > 70 ? "text-green-400" :
            percentage > 40 ? "text-yellow-400" :
            percentage > 20 ? "text-orange-400" : "text-red-400"
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
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
          />
        )}
        {/* Pulse when low energy */}
        {percentage <= 20 && (
          <motion.div
            className="absolute inset-0 bg-red-500/20"
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
          <IconTrophy className="w-3 h-3 text-yellow-400" />
          <span className="text-white/60">Best:</span>
          <span className="font-bold text-yellow-400 tabular-nums">{highScore}</span>
        </div>
        {combo > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1"
          >
            <IconFlame className="w-3 h-3 text-orange-400" />
            <span className="font-bold text-orange-400">x{combo}</span>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/20 backdrop-blur-sm"
    >
      {/* Current Score with animation */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-white/60">Current Score</div>
        <motion.div
          key={currentScore}
          initial={{ scale: 1.2, color: "#60a5fa" }}
          animate={{ scale: 1, color: isNewHighScore ? "#fbbf24" : "#ffffff" }}
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
            className="mb-3 py-2 px-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 text-center"
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-[11px] font-bold text-yellow-300"
            >
              🎉 NEW HIGH SCORE! 🎉
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <IconTrophy className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
          <div className="text-[9px] text-white/50">Best</div>
          <div className="text-sm font-bold text-yellow-400 tabular-nums">{highScore}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <IconHandFinger className="w-4 h-4 mx-auto mb-1 text-green-400" />
          <div className="text-[9px] text-white/50">Catches</div>
          <div className="text-sm font-bold text-green-400 tabular-nums">{totalCatches}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/5 text-center">
          <IconFlame className="w-4 h-4 mx-auto mb-1 text-orange-400" />
          <div className="text-[9px] text-white/50">Combo</div>
          <div className="text-sm font-bold text-orange-400 tabular-nums">x{combo}</div>
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
  const statusEmoji = isFleeing ? "💨" : isReturning ? "🔄" : 
    tirednessLevel === "fresh" ? "⚡" :
    tirednessLevel === "active" ? "🏃" :
    tirednessLevel === "tired" ? "😓" : "😴";

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
        isFleeing ? "bg-orange-500/20 border-orange-400/40" :
        isReturning ? "bg-purple-500/20 border-purple-400/40" :
        "bg-black/70 border-white/20"
      )}>
        <div className={cn("p-3", isMobile ? "flex flex-col gap-2" : "flex items-center gap-4 px-4")}>
          {/* Status */}
          <div className="flex items-center gap-2">
            <motion.span
              animate={isFleeing || isReturning ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3, repeat: isFleeing || isReturning ? Infinity : 0 }}
              className="text-lg"
            >
              {statusEmoji}
            </motion.span>
            <span className={cn(
              "text-[11px] font-medium",
              isFleeing ? "text-orange-300" :
              isReturning ? "text-purple-300" : "text-white/70"
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
                className="px-2 py-1 rounded-lg bg-orange-500/30 border border-orange-400/40"
              >
                <span className="text-[10px] font-bold text-orange-300">x{combo}</span>
              </motion.div>
            )}

            {score >= highScore && score > 0 && (
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <IconTrophy className="w-4 h-4 text-yellow-400" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress bar at bottom */}
        <div className="h-1 bg-black/30">
          <motion.div
            className={cn(
              "h-full",
              energy > 70 ? "bg-green-400" :
              energy > 40 ? "bg-yellow-400" :
              energy > 20 ? "bg-orange-400" : "bg-red-400"
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
        className="relative w-[280px] p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 shadow-2xl"
      >
        {/* Confetti for high score */}
        {isNewHighScore && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full",
                  i % 4 === 0 ? "bg-yellow-400" :
                  i % 4 === 1 ? "bg-blue-400" :
                  i % 4 === 2 ? "bg-green-400" : "bg-pink-400"
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
            className="text-4xl mb-2"
          >
            {wasCaught ? "🎯" : "💨"}
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
              isNewHighScore ? "text-yellow-400" : "text-white"
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
              className="mb-4 py-2 px-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <IconTrophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-300">New High Score!</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Previous high score */}
        {!isNewHighScore && (
          <div className="mb-4 text-center text-[11px] text-white/50">
            High Score: <span className="text-yellow-400 font-bold">{highScore}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlayAgain}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm hover:from-blue-400 hover:to-purple-400 transition-all"
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
