"use client";

import React, { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconHandFinger, IconArrowLeft, IconArrowRight, IconPlayerPlay, IconInfoCircle, IconVolume, IconChevronUp, IconMusic, IconTrophy, IconFlame, IconBolt, IconZzz, IconPlayerPause, IconPlayerStop, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// Game color palette - blue, red, purple only
const GAME_COLORS = {
  primary: "from-blue-500 via-purple-500 to-blue-600",
  secondary: "from-purple-500 via-red-500 to-purple-600",
  accent: "from-red-500 via-purple-500 to-blue-500",
  shimmer: "from-transparent via-purple-400/30 to-transparent",
};

// Optimized shimmer effect - uses CSS animation for better performance
export const GameShimmer = React.memo(function GameShimmer({ 
  className = "",
  speed = "normal",
  colors = "purple"
}: { 
  className?: string;
  speed?: "slow" | "normal" | "fast";
  colors?: "blue" | "purple" | "red" | "rainbow";
}) {
  const colorMap = {
    blue: "via-blue-400/25",
    purple: "via-purple-400/25",
    red: "via-red-400/25",
    rainbow: "via-purple-400/25",
  };
  
  const speedMap = {
    slow: 3,
    normal: 2,
    fast: 1.2,
  };

  return (
    <motion.div
      className={cn("absolute inset-0 overflow-hidden rounded-xl pointer-events-none", className)}
    >
      <motion.div
        className={cn("absolute inset-0 bg-gradient-to-r from-transparent to-transparent", colorMap[colors])}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ 
          duration: speedMap[speed], 
          repeat: Infinity, 
          ease: "linear", 
          repeatDelay: 0.5 
        }}
      />
    </motion.div>
  );
});

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
        <div className="relative px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600/95 via-blue-600/95 to-purple-600/95 border border-purple-400/50 shadow-xl shadow-purple-500/30 backdrop-blur-sm">
          {/* Shimmer */}
          <GameShimmer colors="rainbow" speed="fast" />
          
          {/* Content */}
          <div className="relative flex items-center gap-3">
            <motion.span 
              className="text-2xl"
              animate={{ 
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            >
              😴
            </motion.span>
            <div>
              <p className="text-[11px] font-bold text-white">I'm bored... catch me!</p>
              <p className="text-[9px] text-purple-200/80">This is a mini-game! Chase me around</p>
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
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-purple-600/95 to-blue-600/95 rotate-45 border-r border-b border-purple-400/50" />
      </div>
    </motion.div>
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
    if (energy > 70) return "from-blue-400 to-purple-500";
    if (energy > 40) return "from-purple-400 to-red-500";
    return "from-red-400 to-red-600";
  }, [energy]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      className={cn(
        "relative overflow-hidden rounded-xl border backdrop-blur-sm shadow-lg",
        variant === "attached"
          ? "bg-black/85 border-white/15 shadow-2xl"
          : "bg-black/80 border-purple-500/30"
      )}
    >
      {/* Shimmer overlay */}
      {variant !== "attached" && <GameShimmer colors="purple" speed="normal" />}
      
      <div className={cn("relative space-y-1.5", variant === "attached" ? "p-2" : "p-2")}>
        {/* Top row - score and controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Score */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-purple-300/70">Score</span>
              <motion.span 
                key={score}
                initial={{ scale: 1.2, color: "#c084fc" }}
                animate={{ scale: 1, color: "#ffffff" }}
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
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/30 border border-red-400/40"
              >
                <IconFlame className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-bold text-red-300">x{combo}</span>
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
                <IconTrophy className="w-3.5 h-3.5 text-yellow-400" />
              </motion.div>
            )}
            {onStop && (
              <button
                onClick={onStop}
                className="p-1 rounded hover:bg-red-500/30 transition-colors group"
                title="Stop game"
              >
                <IconPlayerStop className="w-3 h-3 text-red-400/70 group-hover:text-red-300" />
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
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            />
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between text-[8px]">
          <span className={cn(
            "font-medium",
            isFleeing ? "text-red-400" :
            isReturning ? "text-purple-400" :
            tirednessLevel === "exhausted" ? "text-red-400/70" :
            tirednessLevel === "tired" ? "text-yellow-400/70" : "text-blue-400/70"
          )}>
            {isFleeing ? "💨 Fleeing!" :
             isReturning ? "↩️ Returning..." :
             tirednessLevel === "exhausted" ? "😴 So sleepy..." :
             tirednessLevel === "tired" ? "😓 Getting tired" :
             "🎮 Catch me!"}
          </span>
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
            "bg-gradient-to-r from-red-500/20 to-purple-500/20",
            "border border-red-400/30 hover:border-red-400/50",
            "text-[10px] font-medium text-red-300 hover:text-red-200",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <GameShimmer colors="red" speed="fast" />
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
            "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20",
            "border border-purple-400/30 hover:border-purple-400/50",
            "text-[10px] font-medium text-purple-300 hover:text-purple-200",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <GameShimmer colors="purple" speed="normal" />
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
    blue: "bg-blue-400/30",
    purple: "bg-purple-400/30",
    red: "bg-red-400/30",
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
    blue: "border-blue-400",
    purple: "border-purple-400",
    red: "border-red-400",
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
    blue: "from-blue-400/60 to-transparent",
    purple: "from-purple-400/60 to-transparent",
    red: "from-red-400/60 to-transparent",
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
    blue: "bg-blue-400",
    purple: "bg-purple-400",
    red: "bg-red-400",
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
    blue: "text-blue-400",
    purple: "text-purple-400",
    red: "text-red-400",
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
        className="absolute inset-0 bg-red-500/20"
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
    blue: "bg-blue-400/30",
    purple: "bg-purple-400/30",
    red: "bg-red-400/30",
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

  const colors = ["#8b5cf6", "#3b82f6", "#ef4444", "#a855f7", "#6366f1"];
  
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
        "rounded-full border-2 border-transparent border-t-purple-500 border-r-blue-500",
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
    playing: { color: "bg-purple-500", text: "Playing", icon: "🎮" },
    paused: { color: "bg-blue-500", text: "Paused", icon: "⏸️" },
    idle: { color: "bg-gray-500", text: "Idle", icon: "💤" },
    caught: { color: "bg-green-500", text: "Caught!", icon: "🎯" },
    escaped: { color: "bg-red-500", text: "Escaped", icon: "💨" },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-medium text-white",
        config.color
      )}
      animate={animate ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span>{config.icon}</span>
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

  const colors = ["bg-blue-400", "bg-purple-400", "bg-red-400"];

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
