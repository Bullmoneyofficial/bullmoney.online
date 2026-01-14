"use client";

import React, { useEffect, useMemo, useState, useCallback, memo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls, PanInfo, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import {
  IconMusic,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolume,
  IconVolumeOff,
  IconChevronUp,
  IconBrandSpotify,
  IconBrandApple,
  IconBrandYoutube,
  IconInfoCircle,
  IconX,
  IconGripVertical,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { useAudioSettings, type MusicSource, STREAMING_SOURCES } from "@/contexts/AudioSettingsProvider";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { MusicEmbedModal } from "@/components/MusicEmbedModal";
import { BlueShimmer, Slider, TouchIndicator, GameOverScreen, EnergyBar, CompactGameHUD, BoredPopup, GameControls, GameShimmer, SparkleBurst, FloatingParticles, PulseRing, ConfettiBurst, BounceDots, StatusBadge, QuickGameTutorial, QuickGameTutorialDemo } from "@/components/audio-widget/ui";
import { useWanderingGame } from "@/components/audio-widget/useWanderingGame";
import { useCacheContext } from "@/components/CacheManagerProvider";
import { ShimmerBorder, ShimmerSpinner, ShimmerLine } from "@/components/ui/UnifiedShimmer";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking } from "@/lib/CrashTracker";

const sourceLabel: Record<MusicSource, string> = {
  THEME: "Theme",
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  YOUTUBE: "YouTube",
};

// Only show streaming options in the dropdown
const streamingOptions: { value: MusicSource; label: string; icon: React.ReactNode; color: string; recommended?: boolean }[] = [
  { value: "SPOTIFY", label: "Spotify", icon: <IconBrandSpotify className="w-5 h-5" />, color: "blue" },
  { value: "APPLE_MUSIC", label: "Apple", icon: <IconBrandApple className="w-5 h-5" />, color: "blue" },
  { value: "YOUTUBE", label: "YouTube", icon: <IconBrandYoutube className="w-5 h-5" />, color: "blue", recommended: true },
];

const sourceIcons: Partial<Record<MusicSource, React.ReactNode>> = {
  SPOTIFY: <IconBrandSpotify className="w-5 h-5 text-sky-300" />,
  APPLE_MUSIC: <IconBrandApple className="w-5 h-5 text-sky-300" />,
  YOUTUBE: <IconBrandYoutube className="w-5 h-5 text-sky-300" />,
};


const AudioWidget = React.memo(function AudioWidget() {
  const prefersReducedMotion = useReducedMotion();
  const { deviceTier, isSafari } = useCacheContext();
  const isLowEndDevice = deviceTier === 'low' || deviceTier === 'minimal';
  
  // Use unified performance system for lifecycle & shimmer optimization
  const perf = useComponentLifecycle('audioWidget', 7);
  const shimmerEnabled = perf.shimmerEnabled;
  const shimmerSettings = perf.shimmerSettings;
  
  // Crash tracking for all audio widget interactions
  const { trackClick, trackError, trackCustom } = useComponentTracking('audioWidget');
  
  const [hasStartedCatchGame, setHasStartedCatchGame] = useState(false);
  const [showCatchGameTutorial, setShowCatchGameTutorial] = useState(false);
  const [showCatchGameDemo, setShowCatchGameDemo] = useState(false);
  const [isTutorialHovered, setIsTutorialHovered] = useState(false);
  const catchGameTutorialTimerRef = useRef<number | null>(null);
  const {
    musicEnabled,
    setMusicEnabled,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    musicSource,
    setMusicSource,
    isMusicPlaying,
    toggleMusic,

    tipsMuted,
    setTipsMuted,
    
    streamingEmbedUrl,
    isStreamingSource,
  } = useAudioSettings();

  const [open, setOpen] = useState(false);
  const [musicEmbedOpen, setMusicEmbedOpen] = useState(false);
  const [streamingActive, setStreamingActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [playerHidden, setPlayerHidden] = useState(false);
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0); // 0 = not started, 1-4 = steps
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const [showPlayerHint, setShowPlayerHint] = useState(true);
  const [showReturnUserHint, setShowReturnUserHint] = useState(false);
  const [showTipsOverlay, setShowTipsOverlay] = useState(false);
  const [widgetHidden, setWidgetHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const {
    miniPlayerRef,
    isWandering,
    setIsWandering,
    setHasInteracted,
    wanderPosition,
    morphPhase,
    isHovering,
    setIsHovering,
    isNearPlayer,
    isFleeing,
    isReturning,
    movementStyle,
    speedMultiplier,
    fleeDirection,
    handlePlayerInteraction,
    // New game features
    gameState,
    gameStats,
    energy,
    combo,
    isTouching,
    touchPosition,
    startGame,
    getTirednessLevel,
  } = useWanderingGame({ isMobile });
  
  // Game over modal state
  const [showGameOver, setShowGameOver] = useState(false);
  // Bored popup state - shows first time game starts to educate users
  const [showBoredPopup, setShowBoredPopup] = useState(false);
  const [hasSeenBoredPopup, setHasSeenBoredPopup] = useState(false);
  // Sparkle trigger for catch animation
  const [showCatchSparkle, setShowCatchSparkle] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Refs
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // Motion values for swipe gesture on main widget
  const widgetX = useMotionValue(0);
  const widgetOpacity = useTransform(widgetX, [-150, 0], [0.3, 1]);
  
  // Draggable position for floating mini player
  const [floatingPosition, setFloatingPosition] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();
  
  // Handle widget swipe to hide
  const handleWidgetDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80) {
      setWidgetHidden(true);
      widgetX.set(0);
    } else {
      widgetX.set(0);
    }
  }, [widgetX]);

  // Detect mobile/touch device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Check localStorage for tutorial completion and saved preference
  useEffect(() => {
    // Tutorial Check
    const completed = localStorage.getItem('audioWidgetTutorialComplete');
    if (completed === 'true') {
      setHasCompletedTutorial(true);
      setShowFirstTimeHelp(false);

      // Persistence Check for returning users
      const savedSource = localStorage.getItem('audioWidgetSavedSource');
      
      if (savedSource && ['SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE'].includes(savedSource)) {
        // Restore their preferred source
        setMusicSource(savedSource as MusicSource);
        setStreamingActive(true);
        setMusicEnabled(true);
        setPlayerHidden(false);

        // Do not auto-start the catch game; require explicit Play.
        setShowReturnUserHint(true);
        
        // Auto-hide the return user hint after 10s
        setTimeout(() => setShowReturnUserHint(false), 10000);
      }
    }
  }, [setMusicSource, setMusicEnabled]);


  // Hide first time help after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowFirstTimeHelp(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  // Start tutorial when menu opens for first time
  useEffect(() => {
    if (open && !hasCompletedTutorial && tutorialStep === 0) {
      setTutorialStep(1);
    }
  }, [open, hasCompletedTutorial, tutorialStep]);

  // Catch game starts only via explicit Play
  const handleStartCatchGame = useCallback(() => {
    setHasStartedCatchGame(true);
    setHasInteracted(false);
    startGame();
  }, [startGame, setHasInteracted]);

  const dismissCatchGameTutorial = useCallback(() => {
    setShowCatchGameTutorial(false);
    if (catchGameTutorialTimerRef.current != null) {
      window.clearTimeout(catchGameTutorialTimerRef.current);
      catchGameTutorialTimerRef.current = null;
    }
  }, []);

  const dismissCatchGameDemo = useCallback(() => {
    setShowCatchGameDemo(false);
  }, []);

  const handleWatchCatchGameDemo = useCallback(() => {
    // Close the small tooltip and open the full visual demo
    dismissCatchGameTutorial();
    setShowCatchGameDemo(true);
  }, [dismissCatchGameTutorial]);

  const maybeShowCatchGameTutorial = useCallback(() => {
    if (typeof window === "undefined") return;

    // If no games have been played, show on hover every time (until the user starts the game).
    if (gameStats.gamesPlayed === 0 && !hasStartedCatchGame) {
      setShowCatchGameTutorial(true);
      return;
    }

    if (localStorage.getItem("audioWidgetCatchGameTutorialSeen") === "true") return;
    localStorage.setItem("audioWidgetCatchGameTutorialSeen", "true");
    setShowCatchGameTutorial(true);
    if (catchGameTutorialTimerRef.current != null) {
      window.clearTimeout(catchGameTutorialTimerRef.current);
    }
    // 5–10 seconds
    catchGameTutorialTimerRef.current = window.setTimeout(() => {
      setShowCatchGameTutorial(false);
      catchGameTutorialTimerRef.current = null;
    }, 7500);
  }, [gameStats.gamesPlayed, hasStartedCatchGame]);

  useEffect(() => {
    return () => {
      if (catchGameTutorialTimerRef.current != null) {
        window.clearTimeout(catchGameTutorialTimerRef.current);
      }
    };
  }, []);

  // Show bored popup when game starts to educate users
  useEffect(() => {
    if (isWandering && !hasSeenBoredPopup) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setShowBoredPopup(true);
        setHasSeenBoredPopup(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setShowBoredPopup(false), 5000);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isWandering, hasSeenBoredPopup]);

  // Check localStorage for seen bored popup
  useEffect(() => {
    const seen = localStorage.getItem('audioWidgetSeenBoredPopup');
    if (seen === 'true') {
      setHasSeenBoredPopup(true);
    }
  }, []);

  // Save seen bored popup to localStorage
  useEffect(() => {
    if (hasSeenBoredPopup) {
      localStorage.setItem('audioWidgetSeenBoredPopup', 'true');
    }
  }, [hasSeenBoredPopup]);

  // Show game over modal when game ends
  useEffect(() => {
    if (gameState === "caught" || gameState === "escaped") {
      setShowGameOver(true);
      // Trigger sparkle and confetti on catch
      if (gameState === "caught") {
        setShowCatchSparkle(true);
        setShowConfetti(true);
        setTimeout(() => {
          setShowCatchSparkle(false);
          setShowConfetti(false);
        }, 600);
      }
    }
  }, [gameState]);

  // Handle stopping the game manually
  const handleStopGame = useCallback(() => {
    if (isWandering) {
      handlePlayerInteraction();
    }
  }, [isWandering, handlePlayerInteraction]);

  const handleTutorialNext = useCallback(() => {
    if (tutorialStep >= 4) {
      setTutorialStep(0);
      setHasCompletedTutorial(true);
      localStorage.setItem('audioWidgetTutorialComplete', 'true');
    } else {
      setTutorialStep(prev => prev + 1);
    }
  }, [tutorialStep]);

  const handleTutorialSkip = useCallback(() => {
    setTutorialStep(0);
    setHasCompletedTutorial(true);
    localStorage.setItem('audioWidgetTutorialComplete', 'true');
  }, []);

  // Tutorial content - Memoized
  const tutorialSteps = useMemo(() => [
    {
      title: "🎧 Choose Your Music Service",
      description: "Tap Spotify, Apple Music, or YouTube to select where your music comes from. A player will appear so you can start playing.",
    },
    {
      title: "▶️ Start Playing Music",
      description: "After selecting a service, close this menu to see the player. Then tap the play button inside the player to start your music!",
    },
    {
      title: "◀️ Hide the Player",
      description: "Want to hide the player? Just tap the arrow on its edge. Your music keeps playing! Tap again to show it.",
    },
    {
      title: "🔊 Adjust Your Experience",
      description: "Use the sliders to control music volume and interaction sounds. Toggle navbar tips on/off as needed.",
    },
  ], []);

  // "The Room" Hack: Broadcast volume commands in every known protocol
  // regarding the user's "imagining them in a room" metaphor - we treat the iframe 
  // as a black box and send signals to it in every language we know.
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    const win = iframeRef.current.contentWindow;
    const vol0to100 = Math.floor(musicVolume * 100);
    const vol0to1 = musicVolume;

    // 1. YouTube Protocol
    if (musicSource === 'YOUTUBE') {
      win.postMessage(JSON.stringify({
        event: 'command',
        func: 'setVolume',
        args: [vol0to100]
      }), '*');
    }

    // 2. Spotify / SoundCloud / Generic Protocol 
    // (Sending "setVolume" commands blindly to catch any listeners)
    const messages = [
      // Standard PlayerJS
      { method: 'setVolume', value: vol0to1 },
      { method: 'setVolume', value: vol0to100 },
      // Spotify Legacy / SC
      { command: 'set_volume', args: [vol0to100] },
      { command: 'setVolume', value: vol0to100 },
      // Apple Music Kit / Possible variations
      { event: 'setVolume', volume: vol0to1 },
      { type: 'setVolume', volume: vol0to1 },
    ];

    messages.forEach(msg => {
      // Send as object
      win.postMessage(msg, '*');
      // Send as stringified (some parsers require this)
      win.postMessage(JSON.stringify(msg), '*');
    });

  }, [musicVolume, musicSource, iframeKey]);

  // When user selects a streaming source, activate it
  const handleStreamingSelect = useCallback((newSource: MusicSource) => {
    // Only change key if source changes (to preserve playback)
    if (newSource !== musicSource) {
      setIframeKey((k) => k + 1);
      setMusicSource(newSource);
    }
    
    setStreamingActive(true);
    setMusicEnabled(true);
    setPlayerHidden(false);
    setShowFirstTimeHelp(false); // Hide help after first action
    
    // Save preference
    localStorage.setItem('audioWidgetSavedSource', newSource);
  }, [musicSource, setMusicSource, setMusicEnabled]);

  // Handle drag end - detect swipe to hide
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If swiped left more than 100px, hide the player
    if (info.offset.x < -100) {
      setPlayerHidden(true);
      setFloatingPosition({ x: 0, y: 0 }); // Reset position
    } else {
      setFloatingPosition(prev => ({
        x: prev.x + info.offset.x,
        y: prev.y + info.offset.y,
      }));
    }
  }, []);

  // Also activate when musicEnabled is toggled on for streaming source
  useEffect(() => {
    if (isStreamingSource && musicEnabled && streamingEmbedUrl) {
      setStreamingActive(true);
    } else if (!musicEnabled) {
      setStreamingActive(false);
    }
  }, [isStreamingSource, musicEnabled, streamingEmbedUrl]);

  const musicIcon = useMemo(() => {
    if (!musicEnabled || musicVolume <= 0.001) return IconVolumeOff;
    return IconVolume;
  }, [musicEnabled, musicVolume]);

  const MusicVolIcon = musicIcon;
  
  // Get icon for current streaming source
  const currentStreamingIcon = useMemo(() => {
    if (isStreamingSource && sourceIcons[musicSource]) {
      return sourceIcons[musicSource];
    }
    return <IconMusic className="h-5 w-5 text-blue-200/90" />;
  }, [isStreamingSource, musicSource]);

  return (
    <>
      {/* Mobile touch indicator */}
      <AnimatePresence>
        {isMobile && isWandering && !open && (
          <TouchIndicator position={touchPosition} isActive={isTouching} />
        )}
      </AnimatePresence>

      {/* One-time catch game tutorial (first hover) */}
      <QuickGameTutorial
        show={showCatchGameTutorial && !open && !playerHidden}
        onDone={dismissCatchGameTutorial}
        durationMs={gameStats.gamesPlayed === 0 && !hasStartedCatchGame ? 0 : 7500}
        onStart={() => {
          dismissCatchGameTutorial();
          handleStartCatchGame();
        }}
        onWatchDemo={handleWatchCatchGameDemo}
        onHoverChange={setIsTutorialHovered}
      />

      <QuickGameTutorialDemo
        show={showCatchGameDemo}
        onDone={dismissCatchGameDemo}
        onStart={() => {
          dismissCatchGameDemo();
          handleStartCatchGame();
        }}
      />

      {/* Game Over Modal */}
      <AnimatePresence>
        {showGameOver && (
          <GameOverScreen
            score={gameStats.currentScore}
            highScore={gameStats.highScore}
            isNewHighScore={gameStats.currentScore >= gameStats.highScore && gameStats.currentScore > 0}
            wasCaught={gameState === "caught"}
            onPlayAgain={() => {
              setShowGameOver(false);
              handleStartCatchGame();
            }}
            onClose={() => setShowGameOver(false)}
          />
        )}
      </AnimatePresence>

      {/* Pull tab to show widget when hidden */}
      <AnimatePresence>
        {widgetHidden && (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            onClick={() => {
              SoundEffects.click();
              setWidgetHidden(false);
            }}
            className="fixed left-0 bottom-16 z-[100200] flex items-center gap-1 pl-1 pr-3 py-3 rounded-r-xl bg-blue-500/20 border border-l-0 border-blue-400/30 backdrop-blur-md hover:bg-blue-500/30 transition-colors group pointer-events-auto"
          >
            <IconGripVertical className="w-4 h-4 text-blue-300/60 group-hover:text-blue-300" />
            <IconMusic className="w-4 h-4 text-blue-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tips Overlay - Floating above widget */}
      <AnimatePresence>
        {showTipsOverlay && open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed left-3 bottom-[280px] z-[100210] w-[280px] sm:w-[320px] pointer-events-auto"
          >
            <div className="relative p-3 rounded-xl bg-black/90 border border-blue-400/30 backdrop-blur-xl shadow-2xl">
              {/* Close button */}
              <button
                onClick={() => setShowTipsOverlay(false)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <IconX className="w-3.5 h-3.5 text-white/60" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <IconInfoCircle className="w-4 h-4 text-blue-300" />
                <span className="text-[11px] font-medium text-white">Quick Tips</span>
              </div>
              
              {!streamingActive ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/70">1️⃣ Pick a music service above</p>
                  <p className="text-[10px] text-white/50">2️⃣ Close menu to see player</p>
                  <p className="text-[10px] text-white/50">3️⃣ Press play in the player</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-blue-300">✅ Music service active!</p>
                  <p className="text-[10px] text-white/60">← Swipe left to hide widget</p>
                  <p className="text-[10px] text-white/60">🎵 Music plays when hidden</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!widgetHidden && (
          <motion.div 
            ref={widgetRef}
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: -200, opacity: 0 }}
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
                "relative rounded-2xl border border-blue-500/30 bg-black/70 backdrop-blur-2xl shadow-2xl",
                "text-white/90 overflow-hidden audio-shimmer",
                open ? "w-[280px] sm:w-[320px]" : "w-auto"
              )}
            >
              {/* Unified Shimmer - LEFT TO RIGHT using CSS animation */}
              {shimmerEnabled && <ShimmerLine color="blue" intensity={shimmerSettings.intensity} speed={shimmerSettings.speed} />}

              {/* Header - More compact */}
              <div className="relative flex items-center gap-2 p-2">
                {/* Expand/Collapse Button */}
                <motion.button
                  onClick={() => {
                    SoundEffects.click();
                    setOpen((v) => !v);
                  }}
                  className={cn(
                    "relative h-10 w-10 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
                    "hover:from-blue-500/30 hover:to-blue-600/20",
                    "border border-blue-400/30 transition-all duration-200"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BlueShimmer />
                  <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-blue-300"
                  >
                    <IconChevronUp className="h-4 w-4" />
                  </motion.div>
                </motion.button>

                {/* Audio Icon & Status */}
                <div className={cn("flex items-center gap-2", open ? "flex-1" : "")}>
                  <motion.div
                    className={cn(
                      "relative h-10 w-10 rounded-xl flex items-center justify-center border",
                      isStreamingSource && streamingActive
                        ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/15 border-blue-400/40" 
                        : "bg-white/5 border-white/10"
                    )}
                    animate={isStreamingSource && streamingActive ? { 
                      boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0)", "0 0 15px 3px rgba(59, 130, 246, 0.15)", "0 0 0 0 rgba(59, 130, 246, 0)"]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {currentStreamingIcon}
                  </motion.div>

                  {open && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="min-w-0 flex-1"
                    >
                      <div className="text-[12px] font-semibold leading-tight text-white">
                        {isStreamingSource && streamingActive
                          ? sourceLabel[musicSource]
                          : "🎵 Audio"
                        }
                      </div>
                      <div className="text-[10px] text-blue-300/70 leading-tight">
                        {isStreamingSource && streamingActive
                          ? "Playing"
                          : "Choose service"
                        }
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Play/Pause & Close Buttons */}
                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => {
                      SoundEffects.click();
                      toggleMusic();
                    }}
                    className={cn(
                      "relative h-10 w-10 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br from-white/10 to-white/5",
                      "hover:from-white/15 hover:to-white/10",
                      "border border-white/15 transition-all"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isMusicPlaying ? (
                      <IconPlayerPause className="h-4 w-4 text-blue-300" />
                    ) : (
                      <IconPlayerPlay className="h-4 w-4 text-blue-300" />
                    )}
                  </motion.button>

                  {/* Obvious Close Button */}
                  {open && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        SoundEffects.click();
                        setOpen(false);
                      }}
                      className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconX className="h-4 w-4 text-sky-200" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Body - Compact, no bottom tips */}
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-3 pb-3 overflow-hidden"
                  >
                    {/* STREAMING STATUS - Compact */}
                    {isStreamingSource && streamingEmbedUrl && streamingActive && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5 h-3 items-end">
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity }} />
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [10, 5, 10] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [6, 10, 6] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
                          </div>
                          <span className="text-[10px] text-white/80 font-medium">{sourceLabel[musicSource]}</span>
                        </div>
                        <button
                          onClick={() => {
                            SoundEffects.click();
                            setStreamingActive(false);
                            setMusicEnabled(false);
                          }}
                          className="text-[9px] text-sky-200 hover:text-sky-100"
                        >
                          Stop
                        </button>
                      </motion.div>
                    )}

                    {/* Section: Choose Music Service - Compact */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-white/70 font-medium">🎧 Music Service</span>
                        {!streamingActive && (
                          <span className="text-[9px] text-blue-400 shimmer-pulse">Tap one</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1.5">
                        {streamingOptions.map((opt, idx) => {
                          const isActive = musicSource === opt.value && streamingActive;
                          return (
                            <motion.button
                              key={opt.value}
                              onClick={() => {
                                SoundEffects.click();
                                handleStreamingSelect(opt.value);
                              }}
                              className={cn(
                                "relative h-12 rounded-lg flex flex-col items-center justify-center gap-1 text-[9px] font-medium transition-all overflow-hidden",
                                isActive
                                  ? "bg-gradient-to-br from-blue-500/25 via-sky-500/20 to-blue-600/25 border-blue-400/50 text-sky-100 border"
                                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                              )}
                              whileTap={{ scale: 0.95 }}
                            >
                              {opt.icon}
                              <span>{opt.label}</span>
                              {isActive && (
                                <motion.div
                                  className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current"
                                  animate={{ scale: [1, 1.3, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section: Volume Controls - Compact */}
                    <div className="mb-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/70 font-medium">🔊 Volume</span>
                        <motion.button
                          onClick={() => {
                            SoundEffects.click();
                            setTipsMuted(!tipsMuted);
                          }}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-medium transition-colors",
                            tipsMuted
                              ? "bg-white/5 text-white/40"
                              : "bg-blue-500/20 text-blue-200"
                          )}
                        >
                          Tips: {tipsMuted ? "OFF" : "ON"}
                        </motion.button>
                      </div>
                      
                      <Slider
                        label="🎵 Music"
                        value={musicVolume}
                        onChange={(v) => {
                          setMusicVolume(v);
                          if (iframeRef.current?.contentWindow) {
                            const win = iframeRef.current.contentWindow;
                            if (musicSource === 'YOUTUBE') {
                              win.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
                            }
                            win.postMessage({ method: 'play' }, '*');
                            win.postMessage({ method: 'setVolume', value: 1 }, '*');
                          }
                        }}
                      />
                      <Slider
                        label="✨ SFX"
                        value={sfxVolume}
                        onChange={(v) => setSfxVolume(v)}
                      />
                    </div>

                    {/* Game Stats Section - Shows high score and catch count */}
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
                              <motion.span 
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-sky-300 font-bold text-[9px]"
                              >
                                🏆 Best!
                              </motion.span>
                            )}
                            <StatusBadge 
                              status={isWandering ? "playing" : gameState === "caught" ? "caught" : gameState === "escaped" ? "escaped" : "idle"} 
                              animate={isWandering}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="text-center p-1.5 rounded bg-white/5 relative overflow-hidden">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/40">High Score</div>
                            <div className="text-sm font-bold text-sky-300 tabular-nums">{gameStats.highScore}</div>
                          </div>
                          <div className="text-center p-1.5 rounded bg-white/5 relative overflow-hidden">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/40">Catches</div>
                            <div className="text-sm font-bold text-blue-300 tabular-nums">{gameStats.totalCatches}</div>
                          </div>
                          <div className="text-center p-1.5 rounded bg-white/5 relative overflow-hidden">
                            <GameShimmer colors="blue" speed="slow" />
                            <div className="text-[9px] text-white/40">Games</div>
                            <div className="text-sm font-bold text-blue-400 tabular-nums">{gameStats.gamesPlayed}</div>
                          </div>
                        </div>
                        
                        {/* Game Controls */}
                        <GameControls
                          isPlaying={isWandering}
                          onStart={handleStartCatchGame}
                          onStop={handleStopGame}
                          className="mt-2"
                        />
                      </div>
                    )}

                    {/* Quick game start if no games played yet */}
                    {gameStats.gamesPlayed === 0 && streamingActive && (
                      <div className="mb-2 p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 relative overflow-hidden">
                        <GameShimmer colors="blue" />
                        <div className="text-[10px] text-white/60 mb-1.5 text-center">Try the catch game</div>
                        <GameControls
                          isPlaying={isWandering}
                          onStart={handleStartCatchGame}
                          onStop={handleStopGame}
                        />
                      </div>
                    )}

                    {/* Bottom actions row */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          SoundEffects.click();
                          setMusicEnabled(false);
                          setMusicEmbedOpen(true);
                          setOpen(false);
                        }}
                        className="text-[9px] text-blue-300/70 hover:text-blue-200 transition-colors"
                      >
                        🎵 Full Library
                      </button>
                      <button
                        onClick={() => setShowTipsOverlay(true)}
                        className="text-[9px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
                      >
                        <IconInfoCircle className="w-3 h-3" />
                        Help
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Swipe hint on first load */}
            <AnimatePresence>
              {!open && showFirstTimeHelp && !streamingActive && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap"
                >
                  <span className="text-[9px] text-white/40">← Swipe to hide</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING SWIPEABLE PLAYER - Always rendered when streaming (never destroyed to preserve playback) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isStreamingSource && streamingEmbedUrl && streamingActive && (
              <>
                {/* Pull tab when player is hidden */}
                {playerHidden && !open && (
                  <motion.button
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -30, opacity: 0 }}
                    onClick={() => {
                      SoundEffects.click();
                      setPlayerHidden(false);
                    }}
                    className={cn(
                      "fixed z-[100220] left-0 flex items-center py-6 pl-0.5 pr-2 rounded-r-lg backdrop-blur-sm transition-colors",
                      "bg-blue-500/20 hover:bg-blue-500/30 border-r border-y border-blue-400/30"
                    )}
                    style={{ bottom: 220 }}
                  >
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <IconGripVertical className="w-4 h-4 text-white/60" />
                    </motion.div>
                  </motion.button>
                )}
                
                {/* Main floating player - slides in/out from left edge with genie morph */}
                <motion.div
                  ref={miniPlayerRef}
                  initial={{ x: -280 }}
                  animate={{ 
                    x: open ? -280 : (playerHidden ? -280 : wanderPosition.x),
                    y: isWandering ? wanderPosition.y : 0,
                    opacity: open ? 0 : 1,
                    // Enhanced game-style morph effects based on phase, movement style, and energy
                    scaleX: prefersReducedMotion ? 1 : (isHovering || isNearPlayer) ? 1 : (
                      isFleeing ? 0.45 :
                      isReturning ? 1.1 :
                      morphPhase === 'morphing-out' ? (movementStyle === 'dash' ? 0.2 : movementStyle === 'tired' ? 0.7 : movementStyle === 'sleepy' ? 0.9 : 0.3) : 
                      morphPhase === 'moving' ? (movementStyle === 'dash' ? 1.4 : movementStyle === 'bounce' ? 0.9 : movementStyle === 'tired' ? 0.95 : movementStyle === 'sleepy' ? 0.98 : 0.6) : 
                      morphPhase === 'morphing-in' ? 1.1 : 1
                    ),
                    scaleY: prefersReducedMotion ? 1 : (isHovering || isNearPlayer) ? 1 : (
                      isFleeing ? 1.35 :
                      isReturning ? 0.9 :
                      morphPhase === 'morphing-out' ? (movementStyle === 'dash' ? 0.6 : movementStyle === 'tired' ? 1.1 : movementStyle === 'sleepy' ? 1.02 : 1.5) : 
                      morphPhase === 'moving' ? (movementStyle === 'dash' ? 0.7 : movementStyle === 'bounce' ? 1.2 : movementStyle === 'tired' ? 1.02 : movementStyle === 'sleepy' ? 1.01 : 0.8) : 
                      morphPhase === 'morphing-in' ? 0.95 : 1
                    ),
                    rotate: prefersReducedMotion ? 0 : (isHovering || isNearPlayer) ? 0 : (
                      isFleeing ? 14 * fleeDirection.x :
                      isReturning ? -10 * fleeDirection.x :
                      morphPhase === 'morphing-out' ? (movementStyle === 'spiral' ? 25 : movementStyle === 'tired' ? 3 : movementStyle === 'sleepy' ? 1 : 8) * fleeDirection.x : 
                      morphPhase === 'moving' ? (movementStyle === 'zigzag' ? 15 : movementStyle === 'spiral' ? -15 : movementStyle === 'tired' ? 2 : movementStyle === 'sleepy' ? 0.5 : -5) * fleeDirection.x : 
                      morphPhase === 'morphing-in' ? 3 : 
                      (isWandering && morphPhase === 'idle' ? [0, 3 * speedMultiplier, -3 * speedMultiplier, 0] : 0)
                    ),
                    skewX: prefersReducedMotion ? 0 : (isHovering || isNearPlayer) ? 0 : (
                      isFleeing ? 16 * fleeDirection.x :
                      isReturning ? -5 * fleeDirection.x :
                      morphPhase === 'morphing-out' ? (movementStyle === 'dash' ? 25 : movementStyle === 'tired' ? 5 : movementStyle === 'sleepy' ? 1 : 15) * fleeDirection.x : 
                      morphPhase === 'moving' ? (movementStyle === 'dash' ? -15 : movementStyle === 'tired' ? -3 : movementStyle === 'sleepy' ? 0 : -8) * fleeDirection.x : 
                      morphPhase === 'morphing-in' ? 5 : 0
                    ),
                    skewY: prefersReducedMotion ? 0 : (isHovering || isNearPlayer) ? 0 : (
                      isFleeing ? -10 :
                      isReturning ? 5 :
                      morphPhase === 'morphing-out' ? -5 : morphPhase === 'moving' ? 3 : 0
                    ),
                    borderRadius: (isHovering || isNearPlayer) ? '0 12px 12px 0' : (
                      isFleeing ? '60% 12px 60% 12px' :
                      isReturning ? '20% 12px 20% 12px' :
                      morphPhase === 'morphing-out' ? (movementStyle === 'spiral' ? '50%' : '50% 12px 50% 12px') : 
                      morphPhase === 'moving' ? (movementStyle === 'dash' ? '8px' : '30% 12px 30% 12px') : 
                      '0 12px 12px 0'
                    ),
                    // Energy-based filter effect (gets darker/desaturated when tired)
                    filter: prefersReducedMotion ? 'none' : (energy > 50 ? 'none' : energy > 25 ? 'brightness(0.9) saturate(0.85)' : 'brightness(0.78) saturate(0.6)'),
                  }}
                  exit={{ x: -280, opacity: 0, scale: 0.5, rotate: -20 }}
                  transition={{ 
                    type: "spring", 
                    damping: (isHovering || isNearPlayer) ? 25 : (
                      isFleeing ? 5 :
                      isReturning ? 15 :
                      morphPhase === 'moving' ? (movementStyle === 'dash' ? 8 : movementStyle === 'tired' ? 25 : movementStyle === 'sleepy' ? 30 : 12) : 20
                    ), 
                    stiffness: (isHovering || isNearPlayer) ? 300 : (
                      isFleeing ? 200 :
                      isReturning ? 100 :
                      morphPhase === 'moving' ? (movementStyle === 'dash' ? 150 : movementStyle === 'tired' ? 40 : movementStyle === 'sleepy' ? 20 : 80) * speedMultiplier : 200
                    ),
                    rotate: { 
                      duration: (isWandering && morphPhase === 'idle' && !isHovering && !isNearPlayer) ? 1.5 / speedMultiplier : 0.3, 
                      repeat: (isWandering && morphPhase === 'idle' && !isHovering && !isNearPlayer) ? Infinity : 0 
                    },
                  }}
                  className="fixed z-[100230] pointer-events-auto"
                  style={{ 
                    left: 0, 
                    bottom: 160,
                    pointerEvents: (open || playerHidden) ? 'none' : 'auto',
                    transformOrigin: 'left center',
                  }}
                  onClick={handlePlayerInteraction}
                  onTouchStart={() => {
                    // On mobile, any touch immediately pins the player
                    if (isMobile && isWandering) {
                      handlePlayerInteraction();
                    }
                  }}
                  onMouseEnter={() => {
                    setIsHovering(true);
                    // First hover: educate, and do not auto-start movement.
                    if (!hasStartedCatchGame) {
                      maybeShowCatchGameTutorial();
                    }
                  }}
                  onMouseLeave={(e) => {
                    // Expanded hover area - only dismiss if mouse is far from player
                    const rect = e.currentTarget.getBoundingClientRect();
                    const mouseX = e.clientX;
                    const mouseY = e.clientY;
                    
                    // Give 80px padding around the player for hover detection
                    const padding = 80;
                    const isNearby = (
                      mouseX >= rect.left - padding &&
                      mouseX <= rect.right + padding &&
                      mouseY >= rect.top - padding &&
                      mouseY <= rect.bottom + padding
                    );
                    
                    setIsHovering(false);
                    // If the user has never played, keep it hover-based (not sticky).
                    // But don't dismiss if they're still nearby or hovering the tutorial.
                    if (gameStats.gamesPlayed === 0 && !hasStartedCatchGame && !isTutorialHovered && !isNearby) {
                      dismissCatchGameTutorial();
                    }
                  }}
                >
                  <div className={cn(
                    "relative rounded-r-xl border-r border-y backdrop-blur-md shadow-xl overflow-hidden flex",
                    "bg-black/85",
                    "border-blue-400/30",
                    // Enhanced ring effects for game states
                    isFleeing && "ring-4 ring-sky-300/95 ring-offset-2 ring-offset-transparent shadow-[0_0_45px_rgba(56,189,248,0.55)]",
                    isReturning && "ring-3 ring-blue-300/80 ring-offset-2 ring-offset-transparent shadow-[0_0_28px_rgba(59,130,246,0.35)]",
                    !isFleeing && !isReturning && isWandering && !isHovering && !isNearPlayer && morphPhase === 'idle' && (
                      energy > 70 ? "ring-2 ring-sky-300/55 ring-offset-2 ring-offset-transparent" :
                      energy > 40 ? "ring-2 ring-sky-300/45 ring-offset-2 ring-offset-transparent" :
                      energy > 20 ? "ring-2 ring-blue-300/40 ring-offset-2 ring-offset-transparent" :
                      "ring-1 ring-blue-300/30"
                    ),
                    !isFleeing && !isReturning && isWandering && !isHovering && !isNearPlayer && morphPhase === 'morphing-out' && "ring-4 ring-sky-300/60",
                    !isFleeing && !isReturning && isWandering && !isHovering && !isNearPlayer && morphPhase === 'moving' && "ring-3 ring-sky-300/45",
                    !isFleeing && !isReturning && isWandering && !isHovering && !isNearPlayer && morphPhase === 'morphing-in' && "ring-3 ring-blue-300/60",
                    isWandering && (isHovering || isNearPlayer) && "ring-4 ring-sky-300/80 ring-offset-2 ring-offset-transparent shadow-[0_0_32px_rgba(56,189,248,0.35)]"
                  )}>
                    {/* Attached HUD so game UI stays near the wandering player (not on the navbar) */}
                    {isWandering && !open && !playerHidden && (
                      <div className="absolute left-2 -top-11 z-50 pointer-events-none">
                        <CompactGameHUD
                          score={gameStats.currentScore}
                          highScore={gameStats.highScore}
                          energy={energy}
                          combo={combo}
                          isFleeing={isFleeing}
                          isReturning={isReturning}
                          tirednessLevel={getTirednessLevel()}
                          variant="attached"
                          isVisible={true}
                        />
                      </div>
                    )}

                    {/* Glow effect - color changes based on energy */}
                    <div className={cn(
                      "absolute inset-0 pointer-events-none transition-opacity duration-300",
                      energy > 70 ? "opacity-15" : energy > 40 ? "opacity-10" : "opacity-5",
                      "bg-blue-500"
                    )} />

                    {/* Wandering attention grabber with genie sparkles */}
                    {isWandering && (
                      <>
                        {/* Flee particles - speed trails when fleeing */}
                        {isFleeing && !isHovering && !isNearPlayer && !prefersReducedMotion && (
                          <>
                            {[...Array(6)].map((_, i) => (
                              <motion.div
                                key={`flee-${i}`}
                                className={cn(
                                  "absolute rounded-full",
                                  i % 3 === 0 ? "bg-sky-300" : i % 3 === 1 ? "bg-blue-300" : "bg-cyan-300"
                                )}
                                style={{
                                  width: 4 - (i * 0.3),
                                  height: 4 - (i * 0.3),
                                  top: `${30 + ((i * 11) % 40)}%`,
                                  left: fleeDirection.x > 0 ? '100%' : '0%',
                                }}
                                initial={{ opacity: 0, x: 0 }}
                                animate={{
                                  opacity: [0.9, 0],
                                  x: [0, -40 * fleeDirection.x * (i + 1) * 0.3],
                                  y: [((i % 2 === 0) ? -6 : 6), (((i * 7) % 30) - 15)],
                                }}
                                transition={{
                                  duration: 0.3 + i * 0.05,
                                  delay: i * 0.03,
                                  repeat: Infinity,
                                  repeatDelay: 0.1,
                                }}
                              />
                            ))}
                          </>
                        )}

                        {/* Return sparkles - welcoming effect when returning */}
                        {isReturning && !isHovering && !isNearPlayer && (
                          <>
                            {[...Array(6)].map((_, i) => (
                              <motion.div
                                key={`return-${i}`}
                                className="absolute w-2 h-2 rounded-full bg-sky-300"
                                style={{
                                  top: '50%',
                                  left: '50%',
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                  opacity: [0, 1, 0],
                                  scale: [0, 1, 0],
                                  x: Math.cos((i * 60) * Math.PI / 180) * 40,
                                  y: Math.sin((i * 60) * Math.PI / 180) * 40,
                                }}
                                transition={{
                                  duration: 0.6,
                                  delay: i * 0.08,
                                  repeat: Infinity,
                                  repeatDelay: 0.3,
                                }}
                              />
                            ))}
                          </>
                        )}

                        {/* Tired particles - slow floating Zzz */}
                        {(movementStyle === 'tired' || movementStyle === 'sleepy') && !isFleeing && !isReturning && (
                          <>
                            <motion.div
                              className="absolute -top-4 right-2 text-[10px] text-blue-300/70"
                              animate={{
                                y: [-5, -15],
                                x: [0, 10],
                                opacity: [0.8, 0],
                                scale: [0.8, 1.2],
                              }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                            >
                              z
                            </motion.div>
                            <motion.div
                              className="absolute -top-6 right-4 text-[8px] text-blue-300/50"
                              animate={{
                                y: [-3, -12],
                                x: [0, 8],
                                opacity: [0.6, 0],
                                scale: [0.6, 1],
                              }}
                              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.8, delay: 0.5 }}
                            >
                              z
                            </motion.div>
                            {movementStyle === 'sleepy' && (
                              <motion.div
                                className="absolute -top-8 right-6 text-[6px] text-blue-300/30"
                                animate={{
                                  y: [-2, -10],
                                  x: [0, 6],
                                  opacity: [0.4, 0],
                                }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 1, delay: 1 }}
                              >
                                z
                              </motion.div>
                            )}
                          </>
                        )}

                        {/* Sparkle particles during morph - enhanced for game feel */}
                        {!isHovering && !isNearPlayer && !isFleeing && !isReturning && (morphPhase === 'morphing-out' || morphPhase === 'morphing-in' || (morphPhase === 'moving' && movementStyle === 'dash')) && (
                          <>
                            <motion.div
                              className={cn("absolute -top-2 -right-2 w-2 h-2 rounded-full", movementStyle === 'dash' ? "bg-sky-400" : "bg-blue-400")}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: [0, 1, 0], scale: [0, 1.5 * speedMultiplier, 0], x: [0, 20 * fleeDirection.x, 40 * fleeDirection.x], y: [0, -15, -30] }}
                              transition={{ duration: 0.6 / speedMultiplier }}
                            />
                            <motion.div
                              className={cn("absolute -top-1 left-1/4 w-1.5 h-1.5 rounded-full", movementStyle === 'spiral' ? "bg-cyan-400" : "bg-sky-400")}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: [0, 1, 0], scale: [0, 1.2 * speedMultiplier, 0], x: [0, -10 * fleeDirection.x, -20 * fleeDirection.x], y: [0, -20, -35] }}
                              transition={{ duration: 0.5 / speedMultiplier, delay: 0.05 }}
                            />
                            <motion.div
                              className={cn("absolute bottom-0 right-1/4 w-1 h-1 rounded-full", movementStyle === 'bounce' ? "bg-blue-400" : "bg-cyan-400")}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: [0, 15 * fleeDirection.x, 25 * fleeDirection.x], y: [0, 10, 20] }}
                              transition={{ duration: 0.4 / speedMultiplier, delay: 0.1 }}
                            />
                            {/* Extra particles when dashing */}
                            {movementStyle === 'dash' && (
                              <>
                                <motion.div
                                  className="absolute top-1/2 -right-1 w-3 h-1 rounded-full bg-sky-400"
                                  initial={{ opacity: 0, scaleX: 0 }}
                                  animate={{ opacity: [0, 1, 0], scaleX: [0, 3, 0], x: [0, 30, 60] }}
                                  transition={{ duration: 0.4 }}
                                />
                                <motion.div
                                  className="absolute top-1/3 -right-1 w-2 h-0.5 rounded-full bg-blue-400"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: [0, 1, 0], x: [0, 40, 80] }}
                                  transition={{ duration: 0.35, delay: 0.05 }}
                                />
                              </>
                            )}
                          </>
                        )}
                        
                        {/* Main label - enhanced with energy and game states */}
                        <motion.div
                          className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
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
                            (isHovering || isNearPlayer)
                              ? "bg-gradient-to-r from-sky-500/90 via-cyan-500/90 to-sky-500/90"
                              : isFleeing
                              ? "bg-gradient-to-r from-blue-600/90 via-sky-500/90 to-blue-600/90"
                              : isReturning
                              ? "bg-gradient-to-r from-blue-600/90 via-cyan-500/90 to-blue-600/90"
                              : energy <= 20
                              ? "bg-gradient-to-r from-slate-700/90 via-slate-600/90 to-slate-700/90"
                              : energy <= 40
                              ? "bg-gradient-to-r from-blue-700/90 via-sky-600/90 to-blue-700/90"
                              : "bg-gradient-to-r from-blue-600/90 via-cyan-500/90 to-blue-600/90"
                          )}>
                            <motion.span
                              animate={{ 
                                scale: (isHovering || isNearPlayer) ? 1 : isFleeing ? [1, 1.5, 1] : [1, 1.3, 1],
                                rotate: isFleeing ? [0, -20, 20, 0] : (!(isHovering || isNearPlayer) && morphPhase !== 'idle') ? [0, 360] : 0,
                              }}
                              transition={{ 
                                scale: { duration: isFleeing ? 0.3 : 0.5, repeat: (isHovering || isNearPlayer) ? 0 : Infinity },
                                rotate: { duration: isFleeing ? 0.2 : 0.5 },
                              }}
                            >
                              {(isHovering || isNearPlayer) ? '🎵' : isFleeing ? '💨' : isReturning ? '🔄' : energy <= 20 ? '😴' : energy <= 40 ? '😓' : '✨'}
                            </motion.span>
                            {(isHovering || isNearPlayer) 
                              ? '🎯 Caught! Tap to play!' 
                              : isFleeing
                              ? 'Too fast!'
                              : isReturning
                              ? 'Coming back...'
                              : isMobile 
                                ? (energy <= 20 ? '😴 So sleepy...' : energy <= 40 ? 'Getting tired...' : 'Tap to catch!')
                                : energy <= 20 
                                  ? '😴 Zzz... catch me now!'
                                  : energy <= 40
                                  ? '😓 Getting tired...'
                                  : speedMultiplier > 1.3 
                                    ? (movementStyle === 'dash' ? '💨 Zoom!' : movementStyle === 'zigzag' ? '⚡ Zig-zag!' : '🏃 Catch me!')
                                    : (morphPhase === 'idle' ? '🎮 Catch me!' : morphPhase === 'moving' ? (movementStyle === 'spiral' ? '🌀 Whee!' : movementStyle === 'bounce' ? '🦘 Boing!' : '~whoosh~') : '✧･ﾟ')
                            }
                          </div>
                        </motion.div>

                        {/* Flee trail effect */}
                        {isFleeing && (
                          <>
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-400/60"
                                initial={{ opacity: 0, x: 0 }}
                                animate={{ 
                                  opacity: [0.8, 0],
                                  x: [-10 * (i + 1) * fleeDirection.x, -30 * (i + 1) * fleeDirection.x],
                                  scale: [1, 0.3],
                                }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                style={{ left: fleeDirection.x > 0 ? '100%' : 0 }}
                              />
                            ))}
                          </>
                        )}

                        {/* Return glow effect */}
                        {isReturning && (
                          <motion.div
                            className="absolute inset-0 rounded-xl bg-sky-400/20 pointer-events-none"
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          />
                        )}

                        {/* Energy low warning pulse */}
                        {energy <= 25 && !isFleeing && !isReturning && (
                          <motion.div
                            className="absolute inset-0 rounded-xl bg-blue-500/10 pointer-events-none"
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </>
                    )}

                    {/* Main player content - Compact */}
                    <div className="flex-1 relative" style={{ width: '240px' }}>
                      {/* Minimal header */}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            SoundEffects.click();
                            handlePlayerInteraction();
                            setStreamingActive(false);
                            setMusicEnabled(false);
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 transition-colors"
                        >
                          <IconX className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Embed player - Compact */}
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

                    {/* Pull handle to hide - Simple icon */}
                    <motion.button
                      onClick={() => {
                        SoundEffects.click();
                        handlePlayerInteraction();
                        setPlayerHidden(true);
                      }}
                      className="w-5 flex flex-col items-center justify-center border-l border-white/5 hover:bg-white/10 transition-colors"
                      title="Hide player"
                    >
                      <IconGripVertical className="w-3.5 h-3.5 text-white/40" />
                    </motion.button>
                  </div>
                  
                  {/* Bored Popup - educational popup */}
                  <BoredPopup
                    show={showBoredPopup}
                    onDismiss={() => setShowBoredPopup(false)}
                  />

                  {/* Catch effects - sparkle and confetti burst */}
                  <SparkleBurst trigger={showCatchSparkle} />
                  <ConfettiBurst trigger={showConfetti} />
                  
                  {/* Pulse ring when hovering/near player */}
                  <PulseRing 
                    active={isHovering || isNearPlayer} 
                    color="blue" 
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Music Modal - portaled to body for proper fullscreen overlay */}
      {typeof document !== "undefined" &&
        createPortal(
          <MusicEmbedModal
            open={musicEmbedOpen}
            onClose={() => {
              SoundEffects.click();
              setMusicEmbedOpen(false);
            }}
          />,
          document.body
        )}
    </>
  );
});

export default AudioWidget;
