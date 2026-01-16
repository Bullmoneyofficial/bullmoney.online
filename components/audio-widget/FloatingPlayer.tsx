"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { IconX, IconGripVertical } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { CompactGameHUD, BoredPopup, SparkleBurst, ConfettiBurst, PulseRing } from "@/components/audio-widget/ui";
import { sourceLabel, sourceIcons } from "./constants";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

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
}

export const FloatingPlayer = React.memo(function FloatingPlayer(props: FloatingPlayerProps) {
  const {
    miniPlayerRef, open, playerHidden, setPlayerHidden,
    isStreamingSource, streamingEmbedUrl, streamingActive, setStreamingActive,
    musicSource, setMusicEnabled, iframeRef, iframeKey,
    isWandering, wanderPosition, morphPhase, isHovering, setIsHovering,
    isNearPlayer, isFleeing, isReturning, movementStyle, speedMultiplier, fleeDirection,
    handlePlayerInteraction, energy, combo, getTirednessLevel, gameStats, gameState,
    isMobile, hasStartedCatchGame, maybeShowCatchGameTutorial, dismissCatchGameTutorial,
    isTutorialHovered, showBoredPopup, setShowBoredPopup, showCatchSparkle, showConfetti,
  } = props;

  const prefersReducedMotion = useReducedMotion();

  if (!isStreamingSource || !streamingEmbedUrl || !streamingActive) return null;

  return (
    <>
      {/* Pull tab when hidden */}
      {playerHidden && !open && (
        <motion.button
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          onClick={() => { SoundEffects.click(); setPlayerHidden(false); }}
          className={cn(
            "fixed z-[100220] left-0 flex items-center py-6 pl-0.5 pr-2 rounded-r-lg backdrop-blur-sm transition-colors",
            "bg-blue-500/40 hover:bg-blue-500/50 border-r border-y border-blue-400/50"
          )}
          style={{ bottom: 220 }}
        >
          <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <IconGripVertical className="w-4 h-4 text-white/60" />
          </motion.div>
        </motion.button>
      )}
      
      {/* Main floating player */}
      <motion.div
        ref={miniPlayerRef}
        initial={{ x: -280 }}
        animate={{ 
          x: open ? -280 : (playerHidden ? -280 : wanderPosition.x),
          y: isWandering ? wanderPosition.y : 0,
          opacity: open ? 0 : 1,
          scaleX: prefersReducedMotion ? 1 : getScaleX(isHovering, isNearPlayer, isFleeing, isReturning, morphPhase, movementStyle, energy),
          scaleY: prefersReducedMotion ? 1 : getScaleY(isHovering, isNearPlayer, isFleeing, isReturning, morphPhase, movementStyle, energy),
          rotate: prefersReducedMotion ? 0 : getRotation(isHovering, isNearPlayer, isFleeing, isReturning, morphPhase, movementStyle, fleeDirection, isWandering, speedMultiplier),
          skewX: prefersReducedMotion ? 0 : getSkewX(isHovering, isNearPlayer, isFleeing, isReturning, morphPhase, movementStyle, fleeDirection),
          skewY: prefersReducedMotion ? 0 : getSkewY(isHovering, isNearPlayer, isFleeing, isReturning, morphPhase),
          borderRadius: getBorderRadius(isHovering, isNearPlayer, isFleeing, isReturning, morphPhase, movementStyle),
          filter: prefersReducedMotion ? 'none' : (energy > 50 ? 'none' : energy > 25 ? 'brightness(0.9) saturate(0.85)' : 'brightness(0.78) saturate(0.6)'),
        }}
        exit={{ x: -280, opacity: 0, scale: 0.5, rotate: -20 }}
        transition={{ 
          type: "spring", 
          damping: getDamping(isHovering, isNearPlayer, isFleeing, isReturning, morphPhase, movementStyle), 
          stiffness: getStiffness(isHovering, isNearPlayer, isFleeing, isReturning, morphPhase, movementStyle, speedMultiplier),
          rotate: { 
            duration: (isWandering && morphPhase === 'idle' && !isHovering && !isNearPlayer) ? 1.5 / speedMultiplier : 0.3, 
            repeat: (isWandering && morphPhase === 'idle' && !isHovering && !isNearPlayer) ? Infinity : 0 
          },
        }}
        className="fixed z-[100230] pointer-events-auto"
        style={{ left: 0, bottom: 160, pointerEvents: (open || playerHidden) ? 'none' : 'auto', transformOrigin: 'left center' }}
        onClick={handlePlayerInteraction}
        onTouchStart={() => { if (isMobile && isWandering) handlePlayerInteraction(); }}
        onMouseEnter={() => { setIsHovering(true); if (!hasStartedCatchGame) maybeShowCatchGameTutorial(hasStartedCatchGame); }}
        onMouseLeave={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const padding = 80;
          const isNearby = e.clientX >= rect.left - padding && e.clientX <= rect.right + padding && e.clientY >= rect.top - padding && e.clientY <= rect.bottom + padding;
          setIsHovering(false);
          if (gameStats.gamesPlayed === 0 && !hasStartedCatchGame && !isTutorialHovered && !isNearby) dismissCatchGameTutorial();
        }}
      >
        <div className={cn(
          "relative rounded-r-xl border-r border-y backdrop-blur-md shadow-xl overflow-hidden flex bg-black/95 border-blue-400/30",
          getPlayerRingClasses(isFleeing, isReturning, isWandering, isHovering, isNearPlayer, morphPhase, energy)
        )}>
          {/* Attached HUD */}
          {isWandering && !open && !playerHidden && (
            <div className="absolute left-2 -top-11 z-50 pointer-events-none">
              <CompactGameHUD score={gameStats.currentScore} highScore={gameStats.highScore} energy={energy} combo={combo} isFleeing={isFleeing} isReturning={isReturning} tirednessLevel={getTirednessLevel()} variant="attached" isVisible={true} />
            </div>
          )}

          {/* Glow effect */}
          <div className={cn("absolute inset-0 pointer-events-none transition-opacity duration-300", energy > 70 ? "opacity-15" : energy > 40 ? "opacity-10" : "opacity-5", "bg-blue-500")} />

          {/* Wandering effects */}
          {isWandering && <WanderingEffects {...{ isFleeing, isReturning, morphPhase, movementStyle, fleeDirection, speedMultiplier, energy, isHovering, isNearPlayer, isMobile, prefersReducedMotion }} />}

          {/* Main player content */}
          <div className="flex-1 relative" style={{ width: '240px' }}>
            <div className="relative flex items-center justify-between px-2 py-1.5 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                {sourceIcons[musicSource]}
                <span className="text-[9px] text-white/80 font-medium">{sourceLabel[musicSource]}</span>
                <div className="flex gap-0.5 ml-1">
                  <motion.div className="w-0.5 h-1.5 bg-blue-400 rounded-full" animate={{ scaleY: [1, 1.5, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
                  <motion.div className="w-0.5 h-2 bg-blue-400 rounded-full" animate={{ scaleY: [1, 0.6, 1] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); SoundEffects.click(); handlePlayerInteraction(); setStreamingActive(false); setMusicEnabled(false); }}
                className="w-5 h-5 flex items-center justify-center rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 transition-colors"
              >
                <IconX className="w-3 h-3" />
              </button>
            </div>

            <div className="relative" style={{ width: '240px', height: musicSource === 'YOUTUBE' ? '135px' : '80px' }}>
              <iframe
                ref={iframeRef}
                key={`streaming-persistent-${musicSource}-${iframeKey}`}
                title={`${sourceLabel[musicSource]} player`}
                src={streamingEmbedUrl}
                width="100%"
                height="100%"
                loading="eager"
                style={{ border: 0, display: 'block' }}
                onLoad={handlePlayerInteraction}
              />
            </div>
          </div>

          <motion.button
            onClick={() => { SoundEffects.click(); handlePlayerInteraction(); setPlayerHidden(true); }}
            className="w-5 flex flex-col items-center justify-center border-l border-white/5 hover:bg-white/10 transition-colors"
            title="Hide player"
          >
            <IconGripVertical className="w-3.5 h-3.5 text-white/40" />
          </motion.button>
        </div>
        
        <BoredPopup show={showBoredPopup} onDismiss={() => setShowBoredPopup(false)} />
        <SparkleBurst trigger={showCatchSparkle} />
        <ConfettiBurst trigger={showConfetti} />
        <PulseRing active={isHovering || isNearPlayer} color="blue" />
      </motion.div>
    </>
  );
});

// Helper functions for animation values
function getScaleX(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, morphPhase: string, movementStyle: string, energy: number) {
  if (isHovering || isNearPlayer) return 1;
  if (isFleeing) return 0.45;
  if (isReturning) return 1.1;
  if (morphPhase === 'morphing-out') return movementStyle === 'dash' ? 0.2 : movementStyle === 'tired' ? 0.7 : movementStyle === 'sleepy' ? 0.9 : 0.3;
  if (morphPhase === 'moving') return movementStyle === 'dash' ? 1.4 : movementStyle === 'bounce' ? 0.9 : movementStyle === 'tired' ? 0.95 : movementStyle === 'sleepy' ? 0.98 : 0.6;
  if (morphPhase === 'morphing-in') return 1.1;
  return 1;
}

function getScaleY(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, morphPhase: string, movementStyle: string, energy: number) {
  if (isHovering || isNearPlayer) return 1;
  if (isFleeing) return 1.35;
  if (isReturning) return 0.9;
  if (morphPhase === 'morphing-out') return movementStyle === 'dash' ? 0.6 : movementStyle === 'tired' ? 1.1 : movementStyle === 'sleepy' ? 1.02 : 1.5;
  if (morphPhase === 'moving') return movementStyle === 'dash' ? 0.7 : movementStyle === 'bounce' ? 1.2 : movementStyle === 'tired' ? 1.02 : movementStyle === 'sleepy' ? 1.01 : 0.8;
  if (morphPhase === 'morphing-in') return 0.95;
  return 1;
}

function getRotation(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, morphPhase: string, movementStyle: string, fleeDirection: { x: number }, isWandering: boolean, speedMultiplier: number) {
  if (isHovering || isNearPlayer) return 0;
  if (isFleeing) return 14 * fleeDirection.x;
  if (isReturning) return -10 * fleeDirection.x;
  if (morphPhase === 'morphing-out') return (movementStyle === 'spiral' ? 25 : movementStyle === 'tired' ? 3 : movementStyle === 'sleepy' ? 1 : 8) * fleeDirection.x;
  if (morphPhase === 'moving') return (movementStyle === 'zigzag' ? 15 : movementStyle === 'spiral' ? -15 : movementStyle === 'tired' ? 2 : movementStyle === 'sleepy' ? 0.5 : -5) * fleeDirection.x;
  if (morphPhase === 'morphing-in') return 3;
  if (isWandering && morphPhase === 'idle') return [0, 3 * speedMultiplier, -3 * speedMultiplier, 0] as any;
  return 0;
}

function getSkewX(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, morphPhase: string, movementStyle: string, fleeDirection: { x: number }) {
  if (isHovering || isNearPlayer) return 0;
  if (isFleeing) return 16 * fleeDirection.x;
  if (isReturning) return -5 * fleeDirection.x;
  if (morphPhase === 'morphing-out') return (movementStyle === 'dash' ? 25 : movementStyle === 'tired' ? 5 : movementStyle === 'sleepy' ? 1 : 15) * fleeDirection.x;
  if (morphPhase === 'moving') return (movementStyle === 'dash' ? -15 : movementStyle === 'tired' ? -3 : movementStyle === 'sleepy' ? 0 : -8) * fleeDirection.x;
  if (morphPhase === 'morphing-in') return 5;
  return 0;
}

function getSkewY(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, morphPhase: string) {
  if (isHovering || isNearPlayer) return 0;
  if (isFleeing) return -10;
  if (isReturning) return 5;
  if (morphPhase === 'morphing-out') return -5;
  if (morphPhase === 'moving') return 3;
  return 0;
}

function getBorderRadius(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, morphPhase: string, movementStyle: string) {
  if (isHovering || isNearPlayer) return '0 12px 12px 0';
  if (isFleeing) return '60% 12px 60% 12px';
  if (isReturning) return '20% 12px 20% 12px';
  if (morphPhase === 'morphing-out') return movementStyle === 'spiral' ? '50%' : '50% 12px 50% 12px';
  if (morphPhase === 'moving') return movementStyle === 'dash' ? '8px' : '30% 12px 30% 12px';
  return '0 12px 12px 0';
}

function getDamping(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, morphPhase: string, movementStyle: string) {
  if (isHovering || isNearPlayer) return 25;
  if (isFleeing) return 5;
  if (isReturning) return 15;
  if (morphPhase === 'moving') return movementStyle === 'dash' ? 8 : movementStyle === 'tired' ? 25 : movementStyle === 'sleepy' ? 30 : 12;
  return 20;
}

function getStiffness(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, morphPhase: string, movementStyle: string, speedMultiplier: number) {
  if (isHovering || isNearPlayer) return 300;
  if (isFleeing) return 200;
  if (isReturning) return 100;
  if (morphPhase === 'moving') return (movementStyle === 'dash' ? 150 : movementStyle === 'tired' ? 40 : movementStyle === 'sleepy' ? 20 : 80) * speedMultiplier;
  return 200;
}

function getPlayerRingClasses(isFleeing: boolean, isReturning: boolean, isWandering: boolean, isHovering: boolean, isNearPlayer: boolean, morphPhase: string, energy: number) {
  if (isFleeing) return "ring-4 ring-sky-300/95 ring-offset-2 ring-offset-transparent shadow-[0_0_45px_rgba(56,189,248,0.55)]";
  if (isReturning) return "ring-3 ring-blue-300/80 ring-offset-2 ring-offset-transparent shadow-[0_0_28px_rgba(59,130,246,0.35)]";
  if (isWandering && (isHovering || isNearPlayer)) return "ring-4 ring-sky-300/80 ring-offset-2 ring-offset-transparent shadow-[0_0_32px_rgba(56,189,248,0.35)]";
  if (isWandering && !isHovering && !isNearPlayer) {
    if (morphPhase === 'idle') {
      if (energy > 70) return "ring-2 ring-sky-300/55 ring-offset-2 ring-offset-transparent";
      if (energy > 40) return "ring-2 ring-sky-300/45 ring-offset-2 ring-offset-transparent";
      if (energy > 20) return "ring-2 ring-blue-300/40 ring-offset-2 ring-offset-transparent";
      return "ring-1 ring-blue-300/30";
    }
    if (morphPhase === 'morphing-out') return "ring-4 ring-sky-300/60";
    if (morphPhase === 'moving') return "ring-3 ring-sky-300/45";
    if (morphPhase === 'morphing-in') return "ring-3 ring-blue-300/60";
  }
  return "";
}

// Wandering visual effects component
const WanderingEffects = React.memo(function WanderingEffects({ 
  isFleeing, isReturning, morphPhase, movementStyle, fleeDirection, speedMultiplier, 
  energy, isHovering, isNearPlayer, isMobile, prefersReducedMotion 
}: any) {
  return (
    <>
      {/* Flee particles */}
      {isFleeing && !isHovering && !isNearPlayer && !prefersReducedMotion && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div key={`flee-${i}`} className={cn("absolute rounded-full", i % 3 === 0 ? "bg-sky-300" : i % 3 === 1 ? "bg-blue-300" : "bg-cyan-300")}
              style={{ width: 4 - (i * 0.3), height: 4 - (i * 0.3), top: `${30 + ((i * 11) % 40)}%`, left: fleeDirection.x > 0 ? '100%' : '0%' }}
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: [0.9, 0], x: [0, -40 * fleeDirection.x * (i + 1) * 0.3], y: [((i % 2 === 0) ? -6 : 6), (((i * 7) % 30) - 15)] }}
              transition={{ duration: 0.3 + i * 0.05, delay: i * 0.03, repeat: Infinity, repeatDelay: 0.1 }}
            />
          ))}
        </>
      )}

      {/* Return sparkles */}
      {isReturning && !isHovering && !isNearPlayer && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div key={`return-${i}`} className="absolute w-2 h-2 rounded-full bg-sky-300"
              style={{ top: '50%', left: '50%' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: Math.cos((i * 60) * Math.PI / 180) * 40, y: Math.sin((i * 60) * Math.PI / 180) * 40 }}
              transition={{ duration: 0.6, delay: i * 0.08, repeat: Infinity, repeatDelay: 0.3 }}
            />
          ))}
        </>
      )}

      {/* Tired Zzz */}
      {(movementStyle === 'tired' || movementStyle === 'sleepy') && !isFleeing && !isReturning && (
        <>
          <motion.div className="absolute -top-4 right-2 text-[10px] text-blue-300/70" animate={{ y: [-5, -15], x: [0, 10], opacity: [0.8, 0], scale: [0.8, 1.2] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}>z</motion.div>
          <motion.div className="absolute -top-6 right-4 text-[8px] text-blue-300/50" animate={{ y: [-3, -12], x: [0, 8], opacity: [0.6, 0], scale: [0.6, 1] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.8, delay: 0.5 }}>z</motion.div>
          {movementStyle === 'sleepy' && <motion.div className="absolute -top-8 right-6 text-[6px] text-blue-300/30" animate={{ y: [-2, -10], x: [0, 6], opacity: [0.4, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 1, delay: 1 }}>z</motion.div>}
        </>
      )}

      {/* Main label */}
      <motion.div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
        animate={{ 
          y: (morphPhase === 'idle' && !isHovering && !isNearPlayer && !isFleeing && !isReturning) ? [0, -5, 0] : (isFleeing ? -10 : 0),
          scale: (isHovering || isNearPlayer) ? 1.1 : (isFleeing ? 1.2 : isReturning ? 0.9 : morphPhase === 'morphing-out' ? 0.8 : morphPhase === 'morphing-in' ? 1.1 : 1),
          opacity: morphPhase === 'moving' && !isFleeing && !isReturning ? 0.5 : 1,
          x: isFleeing ? 20 * fleeDirection.x : 0,
        }}
        transition={{ duration: isFleeing ? 0.2 : 1.5, repeat: (morphPhase === 'idle' && !isHovering && !isNearPlayer && !isFleeing && !isReturning) ? Infinity : 0 }}
      >
        <div className={cn(
          "px-3 py-1.5 rounded-full text-white text-[10px] font-bold shadow-lg flex items-center gap-1.5 border border-white/20",
          getLabelGradient(isHovering, isNearPlayer, isFleeing, isReturning, energy)
        )}>
          <motion.span animate={{ scale: (isHovering || isNearPlayer) ? 1 : isFleeing ? [1, 1.5, 1] : [1, 1.3, 1], rotate: isFleeing ? [0, -20, 20, 0] : (!(isHovering || isNearPlayer) && morphPhase !== 'idle') ? [0, 360] : 0 }}
            transition={{ scale: { duration: isFleeing ? 0.3 : 0.5, repeat: (isHovering || isNearPlayer) ? 0 : Infinity }, rotate: { duration: isFleeing ? 0.2 : 0.5 } }}>
            {getLabelEmoji(isHovering, isNearPlayer, isFleeing, isReturning, energy)}
          </motion.span>
          {getLabelText(isHovering, isNearPlayer, isFleeing, isReturning, isMobile, energy, speedMultiplier, movementStyle, morphPhase)}
        </div>
      </motion.div>
    </>
  );
});

function getLabelGradient(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, energy: number) {
  if (isHovering || isNearPlayer) return "bg-gradient-to-r from-sky-500/90 via-cyan-500/90 to-sky-500/90";
  if (isFleeing) return "bg-gradient-to-r from-blue-600/90 via-sky-500/90 to-blue-600/90";
  if (isReturning) return "bg-gradient-to-r from-blue-600/90 via-cyan-500/90 to-blue-600/90";
  if (energy <= 20) return "bg-gradient-to-r from-slate-700/90 via-slate-600/90 to-slate-700/90";
  if (energy <= 40) return "bg-gradient-to-r from-blue-700/90 via-sky-600/90 to-blue-700/90";
  return "bg-gradient-to-r from-blue-600/90 via-cyan-500/90 to-blue-600/90";
}

function getLabelEmoji(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, energy: number) {
  if (isHovering || isNearPlayer) return '🎵';
  if (isFleeing) return '💨';
  if (isReturning) return '🔄';
  if (energy <= 20) return '😴';
  if (energy <= 40) return '😓';
  return '✨';
}

function getLabelText(isHovering: boolean, isNearPlayer: boolean, isFleeing: boolean, isReturning: boolean, isMobile: boolean, energy: number, speedMultiplier: number, movementStyle: string, morphPhase: string) {
  if (isHovering || isNearPlayer) return '🎯 Caught! Tap to play!';
  if (isFleeing) return 'Too fast!';
  if (isReturning) return 'Coming back...';
  if (isMobile) return energy <= 20 ? '😴 So sleepy...' : energy <= 40 ? 'Getting tired...' : 'Tap to catch!';
  if (energy <= 20) return '😴 Zzz... catch me now!';
  if (energy <= 40) return '😓 Getting tired...';
  if (speedMultiplier > 1.3) return movementStyle === 'dash' ? '💨 Zoom!' : movementStyle === 'zigzag' ? '⚡ Zig-zag!' : '🏃 Catch me!';
  if (morphPhase === 'idle') return '🎮 Catch me!';
  if (morphPhase === 'moving') return movementStyle === 'spiral' ? '🌀 Whee!' : movementStyle === 'bounce' ? '🦘 Boing!' : '~whoosh~';
  return '✧･ﾟ';
}
