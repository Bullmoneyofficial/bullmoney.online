"use client";

import React, { useEffect, useMemo, useState, useCallback, memo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls, PanInfo, useMotionValue, useTransform } from "framer-motion";
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
  IconHandFinger,
  IconArrowLeft,
  IconArrowRight,
  IconInfoCircle,
  IconX,
  IconGripVertical,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { useAudioSettings, type MusicSource, STREAMING_SOURCES } from "@/contexts/AudioSettingsProvider";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { MusicEmbedModal } from "@/components/MusicEmbedModal";

const sourceLabel: Record<MusicSource, string> = {
  THEME: "Theme",
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  YOUTUBE: "YouTube",
};

// Only show streaming options in the dropdown
const streamingOptions: { value: MusicSource; label: string; icon: React.ReactNode; color: string; recommended?: boolean }[] = [
  { value: "SPOTIFY", label: "Spotify", icon: <IconBrandSpotify className="w-5 h-5" />, color: "green" },
  { value: "APPLE_MUSIC", label: "Apple", icon: <IconBrandApple className="w-5 h-5" />, color: "pink" },
  { value: "YOUTUBE", label: "YouTube", icon: <IconBrandYoutube className="w-5 h-5" />, color: "red", recommended: true },
];

const sourceIcons: Partial<Record<MusicSource, React.ReactNode>> = {
  SPOTIFY: <IconBrandSpotify className="w-5 h-5 text-green-400" />,
  APPLE_MUSIC: <IconBrandApple className="w-5 h-5 text-pink-400" />,
  YOUTUBE: <IconBrandYoutube className="w-5 h-5 text-red-400" />,
};

// Blue shimmer animation component - Memoized
const BlueShimmer = React.memo(function BlueShimmer({ className = "" }: { className?: string }) {
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

// Animated helper tip component - Memoized
const AnimatedTip = React.memo(function AnimatedTip({ 
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
  const icons = useMemo(() => ({
    "tap": <IconHandFinger className="w-3.5 h-3.5" />,
    "swipe-left": <IconArrowLeft className="w-3.5 h-3.5" />,
    "swipe-right": <IconArrowRight className="w-3.5 h-3.5" />,
    "play": <IconPlayerPlay className="w-3.5 h-3.5" />,
    "info": <IconInfoCircle className="w-3.5 h-3.5" />,
    "drag": <IconVolume className="w-3.5 h-3.5" />,
    "close": <IconChevronUp className="w-3.5 h-3.5 rotate-180" />,
    "step": <IconMusic className="w-3.5 h-3.5" />,
  }), []);

  const variants = {
    default: "bg-blue-500/15 border-blue-400/30 text-blue-200",
    success: "bg-green-500/15 border-green-400/30 text-green-200",
    warning: "bg-amber-500/15 border-amber-400/30 text-amber-200",
    numbered: "bg-purple-500/15 border-purple-400/30 text-purple-200",
  };

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
        {/* Blue shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-300/10 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3, delay }}
        />
      </motion.div>
    </motion.div>
  );
});

// Step-by-step tutorial overlay - Memoized
const StepGuide = React.memo(function StepGuide({ 
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
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Step indicator */}
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
      
      {/* Content */}
      <div className="relative">
        <h4 className="text-[12px] font-semibold text-white mb-1">{title}</h4>
        <p className="text-[10px] text-white/60 leading-relaxed mb-3">{description}</p>
      </div>
      
      {/* Progress dots & Next button */}
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

// Floating action hint that points to elements - Memoized
const ActionHint = React.memo(function ActionHint({ 
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
  };
  
  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-blue-400/30",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-blue-400/30",
    left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-blue-400/30",
    right: "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-blue-400/30",
  };
  
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

// Enhanced Slider with blue styling - Memoized
const Slider = React.memo(function Slider({
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
    <div className={cn("flex flex-col gap-1.5 group", disabled && "opacity-50 pointer-events-none")}>
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

const AudioWidget = React.memo(function AudioWidget() {
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
  const [isWandering, setIsWandering] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [wanderPosition, setWanderPosition] = useState({ x: 0, y: 0 });
  const [morphPhase, setMorphPhase] = useState<'idle' | 'morphing-out' | 'moving' | 'morphing-in'>('idle');
  
  // Refs
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const miniPlayerRef = React.useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const wanderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Check localStorage for tutorial completion and saved preference
  useEffect(() => {
    // Tutorial Check
    const completed = localStorage.getItem('audioWidgetTutorialComplete');
    if (completed === 'true') {
      setHasCompletedTutorial(true);
      setShowFirstTimeHelp(false);

      // Persistence Check for returning users
      const savedSource = localStorage.getItem('audioWidgetSavedSource');
      const savedInteracted = localStorage.getItem('audioWidgetHasInteracted');
      
      if (savedSource && ['SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE'].includes(savedSource)) {
        // Restore their preferred source
        setMusicSource(savedSource as MusicSource);
        setStreamingActive(true);
        setMusicEnabled(true);
        setPlayerHidden(false);
        
        // If user hasn't interacted before, start wandering animation
        if (savedInteracted !== 'true') {
          setIsWandering(true);
          setShowReturnUserHint(true);
        } else {
          setHasInteracted(true);
          setPlayerHidden(true); // Start hidden for returning users who've interacted
        }
        
        // Auto-hide the return user hint after 10s
        setTimeout(() => setShowReturnUserHint(false), 10000);
      }
    }
  }, [setMusicSource, setMusicEnabled]);

  // Wandering animation - player floats around with genie morph effect until user interacts or 15 seconds pass
  useEffect(() => {
    if (!isWandering || hasInteracted) {
      if (wanderIntervalRef.current) {
        clearInterval(wanderIntervalRef.current);
        wanderIntervalRef.current = null;
      }
      setWanderPosition({ x: 0, y: 0 });
      setMorphPhase('idle');
      return;
    }

    const getRandomPosition = () => {
      // Move right (positive X) and up (negative Y since bottom-positioned)
      return {
        x: 80 + Math.random() * 180, // Move 80-260px to the right
        y: -(60 + Math.random() * 120), // Move 60-180px up
      };
    };

    // Genie animation sequence
    const runGenieSequence = () => {
      // Phase 1: Morph out (squish and swirl)
      setMorphPhase('morphing-out');
      
      setTimeout(() => {
        // Phase 2: Move to new position
        setMorphPhase('moving');
        setWanderPosition(getRandomPosition());
        
        setTimeout(() => {
          // Phase 3: Morph back in (expand and settle)
          setMorphPhase('morphing-in');
          
          setTimeout(() => {
            // Phase 4: Idle wobble
            setMorphPhase('idle');
          }, 600);
        }, 800);
      }, 500);
    };

    // Initial genie sequence
    runGenieSequence();

    // Run genie sequence every 3 seconds for dramatic effect
    wanderIntervalRef.current = setInterval(() => {
      runGenieSequence();
    }, 3500);

    // Auto-stop after 15 seconds and smoothly return to home position
    const autoStopTimer = setTimeout(() => {
      // Final morph back home
      setMorphPhase('morphing-out');
      setTimeout(() => {
        setWanderPosition({ x: 0, y: 0 });
        setMorphPhase('morphing-in');
        setTimeout(() => {
          setIsWandering(false);
          setHasInteracted(true);
          setMorphPhase('idle');
          localStorage.setItem('audioWidgetHasInteracted', 'true');
        }, 600);
      }, 500);
    }, 15000);

    return () => {
      if (wanderIntervalRef.current) {
        clearInterval(wanderIntervalRef.current);
      }
      clearTimeout(autoStopTimer);
    };
  }, [isWandering, hasInteracted]);

  // Stop wandering when user interacts
  const handlePlayerInteraction = useCallback(() => {
    if (isWandering) {
      setIsWandering(false);
      setHasInteracted(true);
      localStorage.setItem('audioWidgetHasInteracted', 'true');
    }
  }, [isWandering]);

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

  // Trigger wandering when menu closes with active streaming (to grab attention)
  useEffect(() => {
    if (!open && streamingActive && !hasInteracted && !playerHidden) {
      // Small delay to let the menu close animation finish
      const timer = setTimeout(() => {
        setIsWandering(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, streamingActive, hasInteracted, playerHidden]);

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
            className="fixed left-0 bottom-16 z-[60] flex items-center gap-1 pl-1 pr-3 py-3 rounded-r-xl bg-blue-500/20 border border-l-0 border-blue-400/30 backdrop-blur-md hover:bg-blue-500/30 transition-colors group"
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
            className="fixed left-3 bottom-[280px] z-[65] w-[280px] sm:w-[320px] pointer-events-auto"
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
                  <p className="text-[10px] text-green-300">✅ Music service active!</p>
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
            className="fixed left-3 bottom-14 z-[60] pointer-events-auto"
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
                "text-white/90 overflow-hidden",
                open ? "w-[280px] sm:w-[320px]" : "w-auto"
              )}
            >
              {/* Blue shimmer border effect */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                />
              </div>

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
                        ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/40" 
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
                      className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconX className="h-4 w-4 text-red-300" />
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
                          className="text-[9px] text-red-300 hover:text-red-200"
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
                          <span className="text-[9px] text-blue-400 animate-pulse">Tap one</span>
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
                                  ? opt.color === "green" 
                                    ? "bg-gradient-to-br from-green-500/30 to-green-600/20 border-green-400/50 text-green-200 border"
                                    : opt.color === "pink"
                                    ? "bg-gradient-to-br from-pink-500/30 to-pink-600/20 border-pink-400/50 text-pink-200 border"
                                    : "bg-gradient-to-br from-red-500/30 to-red-600/20 border-red-400/50 text-red-200 border"
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
                      "fixed z-[9998] left-0 flex items-center py-6 pl-0.5 pr-2 rounded-r-lg backdrop-blur-sm transition-colors",
                      musicSource === 'SPOTIFY' 
                        ? "bg-green-500/20 hover:bg-green-500/30 border-r border-y border-green-400/30"
                        : musicSource === 'APPLE_MUSIC'
                        ? "bg-pink-500/20 hover:bg-pink-500/30 border-r border-y border-pink-400/30"
                        : "bg-red-500/20 hover:bg-red-500/30 border-r border-y border-red-400/30"
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
                    // Genie morph effects based on phase
                    scaleX: morphPhase === 'morphing-out' ? 0.3 : morphPhase === 'moving' ? 0.6 : morphPhase === 'morphing-in' ? 1.1 : 1,
                    scaleY: morphPhase === 'morphing-out' ? 1.5 : morphPhase === 'moving' ? 0.8 : morphPhase === 'morphing-in' ? 0.95 : 1,
                    rotate: morphPhase === 'morphing-out' ? 8 : morphPhase === 'moving' ? -5 : morphPhase === 'morphing-in' ? 3 : (isWandering ? [0, 2, -2, 0] : 0),
                    skewX: morphPhase === 'morphing-out' ? 15 : morphPhase === 'moving' ? -8 : morphPhase === 'morphing-in' ? 5 : 0,
                    skewY: morphPhase === 'morphing-out' ? -5 : morphPhase === 'moving' ? 3 : 0,
                    borderRadius: morphPhase === 'morphing-out' ? '50% 12px 50% 12px' : morphPhase === 'moving' ? '30% 12px 30% 12px' : '0 12px 12px 0',
                  }}
                  exit={{ x: -280, opacity: 0, scale: 0.5, rotate: -20 }}
                  transition={{ 
                    type: "spring", 
                    damping: morphPhase === 'moving' ? 12 : 20, 
                    stiffness: morphPhase === 'moving' ? 80 : 200,
                    rotate: { duration: isWandering && morphPhase === 'idle' ? 2 : 0.4, repeat: isWandering && morphPhase === 'idle' ? Infinity : 0 },
                  }}
                  className="fixed z-[9999] pointer-events-auto"
                  style={{ 
                    left: 0, 
                    bottom: 160,
                    pointerEvents: (open || playerHidden) ? 'none' : 'auto',
                    transformOrigin: 'left center',
                  }}
                  onClick={handlePlayerInteraction}
                >
                  <div className={cn(
                    "relative rounded-r-xl border-r border-y backdrop-blur-md shadow-xl overflow-hidden flex",
                    "bg-black/85",
                    musicSource === 'SPOTIFY' 
                      ? "border-green-500/30"
                      : musicSource === 'APPLE_MUSIC'
                      ? "border-pink-500/30"
                      : "border-red-500/30",
                    isWandering && morphPhase === 'idle' && "ring-2 ring-blue-400/50 ring-offset-2 ring-offset-transparent",
                    isWandering && morphPhase === 'morphing-out' && "ring-4 ring-purple-400/70",
                    isWandering && morphPhase === 'moving' && "ring-2 ring-cyan-400/40",
                    isWandering && morphPhase === 'morphing-in' && "ring-3 ring-blue-300/60"
                  )}>
                    {/* Glow effect */}
                    <div className={cn(
                      "absolute inset-0 opacity-10 pointer-events-none",
                      musicSource === 'SPOTIFY' 
                        ? "bg-green-500"
                        : musicSource === 'APPLE_MUSIC'
                        ? "bg-pink-500"
                        : "bg-red-500"
                    )} />

                    {/* Wandering attention grabber with genie sparkles */}
                    {isWandering && (
                      <>
                        {/* Sparkle particles during morph */}
                        {(morphPhase === 'morphing-out' || morphPhase === 'morphing-in') && (
                          <>
                            <motion.div
                              className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-blue-400"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], x: [0, 20, 40], y: [0, -15, -30] }}
                              transition={{ duration: 0.8 }}
                            />
                            <motion.div
                              className="absolute -top-1 left-1/4 w-1.5 h-1.5 rounded-full bg-purple-400"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], x: [0, -10, -20], y: [0, -20, -35] }}
                              transition={{ duration: 0.7, delay: 0.1 }}
                            />
                            <motion.div
                              className="absolute bottom-0 right-1/4 w-1 h-1 rounded-full bg-cyan-400"
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: [0, 15, 25], y: [0, 10, 20] }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                            />
                          </>
                        )}
                        
                        {/* Main label */}
                        <motion.div
                          className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
                          animate={{ 
                            y: morphPhase === 'idle' ? [0, -5, 0] : 0,
                            scale: morphPhase === 'morphing-out' ? 0.8 : morphPhase === 'morphing-in' ? 1.1 : 1,
                            opacity: morphPhase === 'moving' ? 0.5 : 1,
                          }}
                          transition={{ duration: 1.5, repeat: morphPhase === 'idle' ? Infinity : 0 }}
                        >
                          <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/90 via-purple-500/90 to-blue-500/90 text-white text-[10px] font-bold shadow-lg flex items-center gap-1.5 border border-white/20">
                            <motion.span
                              animate={{ 
                                scale: [1, 1.3, 1],
                                rotate: morphPhase !== 'idle' ? [0, 360] : 0,
                              }}
                              transition={{ 
                                scale: { duration: 0.5, repeat: Infinity },
                                rotate: { duration: 0.5 },
                              }}
                            >
                              ✨
                            </motion.span>
                            {morphPhase === 'idle' ? 'Click to pin!' : morphPhase === 'moving' ? '~whoosh~' : '✧･ﾟ'}
                          </div>
                        </motion.div>
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
                          className="w-5 h-5 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
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
