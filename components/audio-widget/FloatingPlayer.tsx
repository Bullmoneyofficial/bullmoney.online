"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, useDragControls, PanInfo } from "framer-motion";
import { IconX, IconGripVertical, IconVolume, IconVolumeOff, IconLock, IconCamera, IconInfoCircle, IconChevronUp, IconPlayerPlay, IconPlayerPause, IconBrandSpotify, IconBrandApple, IconBrandYoutube, IconFlare, IconSwitchHorizontal, IconChevronLeft, IconChevronRight, IconMusic } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { CompactGameHUD, BoredPopup, SparkleBurst, ConfettiBurst, PulseRing } from "@/components/audio-widget/ui";
import { sourceLabel, sourceIcons } from "./constants";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

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
}

// iPhone Button Tooltip Component
const ButtonTooltip = React.memo(function ButtonTooltip({ 
  show, 
  text, 
  position = "right",
  color = "blue"
}: { 
  show: boolean; 
  text: string; 
  position?: "right" | "left" | "top" | "bottom";
  color?: "blue" | "purple" | "red" | "green" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-600/95 via-cyan-500/95 to-blue-600/95 border-blue-400/50 shadow-blue-500/30",
    purple: "from-purple-600/95 via-pink-500/95 to-purple-600/95 border-purple-400/50 shadow-purple-500/30",
    red: "from-red-600/95 via-rose-500/95 to-red-600/95 border-red-400/50 shadow-red-500/30",
    green: "from-green-600/95 via-emerald-500/95 to-green-600/95 border-green-400/50 shadow-green-500/30",
    orange: "from-orange-600/95 via-amber-500/95 to-orange-600/95 border-orange-400/50 shadow-orange-500/30"
  };

  const positionClasses = {
    right: "left-full ml-3 top-1/2 -translate-y-1/2",
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2"
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: position === "right" ? -10 : position === "left" ? 10 : 0, y: position === "top" ? 10 : position === "bottom" ? -10 : 0 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn("absolute whitespace-nowrap pointer-events-none", positionClasses[position])}
          style={{ zIndex: Z_INDEX.TOOLTIPS }}
        >
          <div className={cn(
            "px-3 py-2 rounded-xl text-white text-[10px] font-semibold shadow-xl backdrop-blur-md border bg-gradient-to-r",
            colorClasses[color]
          )}>
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {text}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Camera Modal with Reflective Effect
const CameraModal = React.memo(function CameraModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [filter, setFilter] = useState<'none' | 'sepia' | 'grayscale' | 'invert' | 'hue'>('none');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const animationRef = useRef<number | null>(null);

  // Liquid animation effect
  useEffect(() => {
    if (!isOpen) return;
    
    const animate = () => {
      if (turbulenceRef.current) {
        const time = Date.now() / 3000;
        const val = 0.006 + Math.sin(time) * 0.003;
        turbulenceRef.current.setAttribute('baseFrequency', `${val} ${val}`);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isOpen]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode } 
      }).then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }).catch(console.error);
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setFlashActive(true);
    SoundEffects.success();
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
    }
    
    setTimeout(() => setFlashActive(false), 150);
  }, [facingMode]);

  const filterStyles: Record<string, string> = {
    none: '',
    sepia: 'sepia(100%)',
    grayscale: 'grayscale(100%)',
    invert: 'invert(100%)',
    hue: 'hue-rotate(180deg) saturate(200%)'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md"
          style={{ zIndex: Z_INDEX.CAMERA_MODAL }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, rotateY: -30 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0.8, rotateY: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="relative w-[85vw] max-w-[340px] aspect-[9/16] rounded-[45px] overflow-hidden"
            style={{ perspective: 1000 }}
          >
            {/* SVG Liquid Filter */}
            <svg className="absolute w-0 h-0">
              <defs>
                <filter id="camera-liquid-distortion">
                  <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency="0.008" numOctaves="3" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
            </svg>

            {/* iPhone Frame */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1f] via-[#0f0f12] to-[#1a1a1f] rounded-[45px] border-[4px] border-slate-700/60 shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_2px_2px_rgba(255,255,255,0.05)]">
              {/* Titanium Edge */}
              <div className="absolute inset-[2px] rounded-[41px] border border-slate-600/30" />
              
              {/* Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                <div className="bg-black rounded-full px-6 py-2 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-slate-600">
                    <motion.div className="w-full h-full rounded-full bg-green-500/40" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">Recording</span>
                </div>
              </div>

              {/* Camera View with Reflective Effect */}
              <div className="absolute inset-[6px] rounded-[39px] overflow-hidden bg-black">
                {/* Reflective shimmer overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-transparent z-20 pointer-events-none"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Video Feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ 
                    filter: `url(#camera-liquid-distortion) ${filterStyles[filter]}`,
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Flash Effect */}
                <AnimatePresence>
                  {flashActive && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 bg-white z-50"
                    />
                  )}
                </AnimatePresence>

                {/* Camera UI Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 z-30">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mt-8">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10"
                    >
                      <IconX className="w-5 h-5 text-white" />
                    </motion.button>
                    
                    <div className="flex gap-2">
                      {(['none', 'sepia', 'grayscale', 'hue'] as const).map((f) => (
                        <motion.button
                          key={f}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setFilter(f)}
                          className={cn(
                            "w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center text-[7px] font-bold uppercase border",
                            filter === f 
                              ? "bg-blue-500 text-white border-blue-400" 
                              : "bg-black/60 text-white/70 border-white/10"
                          )}
                        >
                          {f === 'none' ? '○' : f.slice(0, 2)}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Center Focus Ring */}
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.03, 1],
                        borderColor: ['rgba(255,255,255,0.2)', 'rgba(59,130,246,0.5)', 'rgba(255,255,255,0.2)']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-40 h-40 rounded-full border-2 flex items-center justify-center"
                    >
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white/60"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>

                  {/* Bottom Controls */}
                  <div className="flex items-center justify-center gap-6 mb-4">
                    {/* Switch Camera */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}
                      className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10"
                    >
                      <IconSwitchHorizontal className="w-5 h-5 text-white" />
                    </motion.button>

                    {/* Capture Button */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={capturePhoto}
                      className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                      <motion.div 
                        className="w-16 h-16 rounded-full border-4 border-black/20"
                        whileHover={{ borderColor: 'rgba(0,0,0,0.4)' }}
                      />
                    </motion.button>

                    {/* Flash Toggle */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10"
                    >
                      <IconFlare className="w-5 h-5 text-yellow-400" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Main iPhone 17 Floating Player
export const FloatingPlayer = React.memo(function FloatingPlayer(props: FloatingPlayerProps) {
  const {
    miniPlayerRef, open, playerHidden, setPlayerHidden,
    isStreamingSource, streamingEmbedUrl, streamingActive, setStreamingActive,
    musicSource, setMusicEnabled, iframeRef, iframeKey,
    isWandering, wanderPosition, morphPhase, isHovering, setIsHovering,
    isNearPlayer, isFleeing, isReturning,
    handlePlayerInteraction, energy, combo, getTirednessLevel, gameStats,
    isMobile, hasStartedCatchGame, maybeShowCatchGameTutorial, dismissCatchGameTutorial,
    isTutorialHovered, showBoredPopup, setShowBoredPopup, showCatchSparkle, showConfetti,
    showCatchGameTutorial, tutorialContent,
  } = props;

  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();
  
  // iPhone UI States
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Position state - left or right side of screen
  const [playerSide, setPlayerSide] = useState<'left' | 'right'>('left');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Button hover states for tooltips
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(true);

  // Auto-hide first time help
  useEffect(() => {
    const timer = setTimeout(() => setShowFirstTimeHelp(false), 8000);
    return () => clearTimeout(timer);
  }, []);

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

  // Handle swipe/drag to change sides - bidirectional
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 80; // Lower threshold for easier swipe
    const velocity = info.velocity.x;
    const velocityThreshold = 300; // Also trigger on fast swipes
    
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
    handlePlayerInteraction();
  }, [handlePlayerInteraction]);

  // Camera button
  const handleCamera = useCallback(() => {
    SoundEffects.click();
    setShowCameraModal(true);
  }, []);

  if (!isStreamingSource || !streamingEmbedUrl || !streamingActive) return null;

  const SourceIcon = musicSource === 'SPOTIFY' ? IconBrandSpotify : 
                     musicSource === 'APPLE_MUSIC' ? IconBrandApple : IconBrandYoutube;

  const playerHeight = musicSource === 'YOUTUBE' ? 480 : 400;

  return (
    <>
      {/* Camera Modal */}
      <CameraModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} />

      {/* Minimized iPod Pull Tab - Audio persists like Apple Music! */}
      <AnimatePresence>
        {isMinimized && !open && (
          <motion.button
            initial={{ opacity: 0, x: playerSide === 'left' ? -100 : 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: playerSide === 'left' ? -100 : 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            onClick={handleExpandPlayer}
            onMouseEnter={() => setHoveredButton('expand')}
            onMouseLeave={() => setHoveredButton(null)}
            className={cn(
              "fixed flex items-center gap-3 py-3.5 backdrop-blur-2xl transition-all duration-300",
              "bg-gradient-to-br from-slate-900/98 via-gray-900/98 to-black/98",
              "border-2 border-slate-500/60 shadow-2xl",
              "hover:shadow-green-500/40 hover:border-green-400/60 hover:scale-105",
              "active:scale-95",
              // Pulsing glow animation when playing
              isPlaying && "animate-pulse-subtle",
              playerSide === 'left' 
                ? "left-0 pl-3 pr-5 rounded-r-3xl border-l-0" 
                : "right-0 pr-3 pl-5 rounded-l-3xl border-r-0"
            )}
            style={{ 
              bottom: 140, 
              zIndex: Z_INDEX.PULL_TAB,
              boxShadow: isPlaying 
                ? '0 0 30px rgba(34, 197, 94, 0.3), 0 10px 40px rgba(0,0,0,0.5)' 
                : '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Icon order depends on side */}
            {playerSide === 'right' && (
              <motion.div
                animate={{ x: [-3, 0, -3] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconChevronLeft className="w-5 h-5 text-white/70" />
              </motion.div>
            )}
            
            {/* Pulsing indicator that music is playing */}
            <div className="relative">
              {/* Glow effect */}
              <motion.div
                className="absolute -inset-2 bg-green-500/25 rounded-2xl blur-lg"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className={cn(
                "relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden",
                "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800",
                "border border-slate-500/50 shadow-inner"
              )}>
                {/* Source icon */}
                <SourceIcon className="w-6 h-6 text-white/95" />
                
                {/* Audio wave animation at bottom */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[3px]">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-[3px] bg-green-400 rounded-full origin-bottom"
                      animate={{ scaleY: isPlaying ? [0.3, 1, 0.3] : 0.3 }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity, 
                        delay: i * 0.08,
                        ease: "easeInOut"
                      }}
                      style={{ height: 10 }}
                    />
                  ))}
                </div>
                
                {/* Reflective shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
            
            {/* Text label */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/90">{sourceLabel[musicSource]}</span>
              <span className="text-[8px] text-green-400/80 font-medium">♪ Playing</span>
            </div>
            
            {/* Pull arrow for left side */}
            {playerSide === 'left' && (
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconChevronRight className="w-5 h-5 text-white/70" />
              </motion.div>
            )}
            
            <ButtonTooltip 
              show={hoveredButton === 'expand'} 
              text="🎵 Tap to Expand" 
              position={playerSide === 'left' ? 'right' : 'left'} 
              color="green" 
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 
        SINGLE PERSISTENT IFRAME - The ONLY iframe for audio
        This is ALWAYS in DOM. When expanded, it's visible in the iPhone.
        When minimized, it shrinks and hides behind the pull tab but keeps playing.
        
        KEY: Same iframe element = same audio context = continuous playback
      */}
      <div
        className="fixed transition-all duration-300 ease-out"
        style={{
          position: 'fixed',
          // Position: When minimized, behind pull tab. When expanded, inside iPhone visual area
          bottom: isMinimized ? 125 : (60 + 180), // Adjust for iPhone player position
          [playerSide]: isMinimized ? 5 : (playerSide === 'left' ? 8 : 8),
          // Size: Full size when expanded, small when minimized but valid for SDK
          width: isMinimized ? 150 : 254,
          height: isMinimized ? 80 : (musicSource === 'YOUTUBE' ? 180 : 110),
          overflow: 'hidden',
          // Opacity: Nearly invisible when minimized, full when expanded
          opacity: isMinimized ? 0.01 : 1,
          // Z-index: Behind pull tab when minimized, above content when expanded
          zIndex: isMinimized ? (Z_INDEX.PULL_TAB - 1) : (Z_INDEX.PLAYER_BASE + 5),
          pointerEvents: isMinimized ? 'none' : 'auto',
          borderRadius: isMinimized ? '12px' : '0 0 16px 16px',
          // Hide behind pull tab when minimized
          transform: isMinimized ? 'scale(0.5)' : 'scale(1)',
          transformOrigin: playerSide === 'left' ? 'left center' : 'right center',
        }}
        aria-hidden={isMinimized}
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
            "fixed left-0 flex items-center py-8 pl-0.5 pr-2 rounded-r-2xl backdrop-blur-md transition-colors",
            "bg-gradient-to-r from-slate-800/95 to-slate-700/95 hover:from-slate-700/95 hover:to-slate-600/95",
            "border-r border-y border-slate-500/40 shadow-xl"
          )}
          style={{ bottom: 180, zIndex: Z_INDEX.PULL_TAB }}
        >
          <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <IconGripVertical className="w-4 h-4 text-white/70" />
          </motion.div>
        </motion.button>
      )}
      
      {/* Main iPhone 17 Floating Player */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            ref={miniPlayerRef}
            initial={{ x: playerSide === 'left' ? -300 : 300, opacity: 0 }}
            animate={{ 
              x: open ? (playerSide === 'left' ? -300 : 300) : (playerHidden ? (playerSide === 'left' ? -300 : 300) : (isWandering ? wanderPosition.x : 0)),
              y: isWandering ? wanderPosition.y : 0,
              opacity: open ? 0 : 1,
              scale: isLocked ? 0.98 : 1,
            }}
            exit={{ x: playerSide === 'left' ? -300 : 300, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: -200, right: 200 }}
            dragElastic={0.4}
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
                  <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-900/95 via-gray-800/95 to-slate-900/95 backdrop-blur-xl border border-white/25 shadow-xl shadow-black/40 text-[10px] text-white/90 font-semibold flex items-center gap-2">
                    <motion.div animate={{ x: [-4, 4, -4] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                      <IconChevronLeft className="w-4 h-4 text-blue-400" />
                    </motion.div>
                    <span>Swipe to minimize</span>
                    <motion.div animate={{ x: [4, -4, 4] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
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
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
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
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
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
                            className="w-[2px] bg-green-400 rounded-full"
                            animate={{ height: [3, 10, 3] }}
                            transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.08 }}
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
                  className="absolute inset-0 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center rounded-[36px]"
                  style={{ zIndex: Z_INDEX.LOCK_SCREEN }}
                  onClick={(e) => { e.stopPropagation(); handlePower(); }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
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
                    <div className="absolute inset-[1px] rounded-[2px] bg-green-400" style={{ width: '75%' }} />
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
                    {sourceIcons[musicSource]}
                  </div>
                  <div>
                    <span className="text-[10px] text-white/90 font-semibold block">{sourceLabel[musicSource]}</span>
                    <span className="text-[8px] text-white/50">Now Playing</span>
                  </div>
                  <div className="flex gap-[2px] ml-1">
                    <motion.div className="w-[2px] h-2 bg-blue-400 rounded-full" animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.35, repeat: Infinity }} />
                    <motion.div className="w-[2px] h-2.5 bg-cyan-400 rounded-full" animate={{ scaleY: [1, 0.4, 1] }} transition={{ duration: 0.35, repeat: Infinity, delay: 0.1 }} />
                    <motion.div className="w-[2px] h-2 bg-blue-400 rounded-full" animate={{ scaleY: [1, 1.6, 1] }} transition={{ duration: 0.35, repeat: Infinity, delay: 0.2 }} />
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
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
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
              <ButtonTooltip show={hoveredButton === 'home'} text="🏠 Tap to Interact" position="top" color="green" />
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
        
        {/* Tutorial Slot - ABOVE the iPhone player with highest priority */}
        <AnimatePresence>
          {showCatchGameTutorial && tutorialContent && (
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
              <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl border border-white/30 shadow-xl text-[9px] text-white font-medium flex items-center gap-2">
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
