"use client";

import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
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
const streamingOptions: { value: MusicSource; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "SPOTIFY", label: "Spotify", icon: <IconBrandSpotify className="w-5 h-5" />, color: "green" },
  { value: "APPLE_MUSIC", label: "Apple", icon: <IconBrandApple className="w-5 h-5" />, color: "pink" },
  { value: "YOUTUBE", label: "YouTube", icon: <IconBrandYoutube className="w-5 h-5" />, color: "red" },
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
  
  // Refs
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const miniPlayerRef = React.useRef<HTMLDivElement>(null);
  
  // Draggable position for floating mini player
  const [floatingPosition, setFloatingPosition] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();

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
        setPlayerHidden(true); // Start hidden to be unobtrusive
        setShowReturnUserHint(true); // Show the helper to say "Click Play"
        
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
    setMusicSource((prevSource) => {
       if (newSource !== prevSource) {
         setIframeKey((k) => k + 1);
       }
       return newSource;
    });
    
    setStreamingActive(true);
    setMusicEnabled(true);
    setPlayerHidden(false);
    setShowFirstTimeHelp(false); // Hide help after first action
    
    // Save preference
    localStorage.setItem('audioWidgetSavedSource', newSource);
  }, [setMusicSource, setMusicEnabled]);

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
    <div className="fixed left-3 bottom-3 z-[60] pointer-events-auto">
      {/* Return User "Click Play" Helper */}
      <AnimatePresence>
        {!open && showReturnUserHint && (
           <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.8 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, scale: 0.8 }}
             className="absolute left-0 bottom-[calc(100%+12px)] z-50 pointer-events-none"
           >
             <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-600/90 to-blue-800/90 border border-blue-400/50 shadow-xl backdrop-blur-md">
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-blue-700/90 rotate-45 border-b border-r border-blue-400/50" />
                <div className="flex items-center gap-3 whitespace-nowrap">
                   <motion.div 
                     animate={{ scale: [1, 1.2, 1] }} 
                     transition={{ repeat: Infinity, duration: 1.5 }}
                     className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20"
                   >
                      <IconPlayerPlay className="w-5 h-5 text-white fill-white" />
                   </motion.div>
                   <div>
                      <p className="text-sm font-bold text-white">Welcome back!</p>
                      <p className="text-xs text-blue-100">Tap to resume your music</p>
                   </div>
                </div>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Main Widget Container */}
      <motion.div
        layout
        className={cn(
          "relative rounded-2xl border border-blue-500/30 bg-black/60 backdrop-blur-2xl shadow-2xl",
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

        {/* Header */}
        <div className="relative flex items-center gap-2 p-2.5">
          {/* Expand/Collapse Button */}
          <motion.button
            onClick={() => {
              SoundEffects.click();
              setOpen((v) => !v);
            }}
            className={cn(
              "relative h-12 w-12 rounded-xl flex items-center justify-center",
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
              <IconChevronUp className="h-5 w-5" />
            </motion.div>
          </motion.button>

          {/* Audio Icon & Status */}
          <div className={cn("flex items-center gap-2.5", open ? "flex-1" : "")}>
            <motion.div
              className={cn(
                "relative h-12 w-12 rounded-xl flex items-center justify-center border",
                isStreamingSource && streamingActive
                  ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/40" 
                  : "bg-white/5 border-white/10"
              )}
              animate={isStreamingSource && streamingActive ? { 
                boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0)", "0 0 20px 5px rgba(59, 130, 246, 0.15)", "0 0 0 0 rgba(59, 130, 246, 0)"]
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
                <div className="text-[13px] font-semibold leading-tight text-white">
                  {isStreamingSource && streamingActive
                    ? sourceLabel[musicSource]
                    : "🎵 Audio Settings"
                  }
                </div>
                <div className="text-[11px] text-blue-300/70 leading-tight">
                  {isStreamingSource && streamingActive
                    ? "Now playing • Close menu to see player"
                    : "Tap a service below to play music"
                  }
                </div>
              </motion.div>
            )}
          </div>

          {/* Play/Pause Button */}
          <motion.button
            onClick={() => {
              SoundEffects.click();
              toggleMusic();
            }}
            className={cn(
              "relative h-12 w-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-white/10 to-white/5",
              "hover:from-white/15 hover:to-white/10",
              "border border-white/15 transition-all"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMusicPlaying ? (
              <IconPlayerPause className="h-5 w-5 text-blue-300" />
            ) : (
              <IconPlayerPlay className="h-5 w-5 text-blue-300" />
            )}
          </motion.button>
        </div>

        {/* First-time Helper - Collapsed State */}
        <AnimatePresence>
          {!open && showFirstTimeHelp && !streamingActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-2.5 pb-2.5 overflow-hidden"
            >
              <motion.div 
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-purple-500/10 border border-blue-400/25"
                animate={{ scale: [1, 1.01, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <motion.div
                    animate={{ rotate: [0, -15, 15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <IconHandFinger className="w-4 h-4 text-blue-300" />
                  </motion.div>
                  <span className="text-[11px] font-medium text-white">New here?</span>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Tap the <span className="text-blue-300">▲ arrow</span> to open settings and choose your music service!
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Streaming Collapsed Hint */}
        <AnimatePresence>
          {!open && streamingActive && !playerHidden && showPlayerHint && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-2.5 pb-2.5 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <AnimatedTip 
                  text="Player is on the left →" 
                  icon="swipe-left" 
                  variant="success"
                />
                <button
                  onClick={() => setShowPlayerHint(false)}
                  className="text-[9px] text-white/30 hover:text-white/60"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="px-3.5 pb-4 overflow-hidden"
            >
              {/* Tutorial Guide - Mobile Overlay */}
              <AnimatePresence>
                {tutorialStep > 0 && tutorialStep <= 4 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-x-3.5 top-2 z-50 sm:hidden"
                  >
                    <div className="bg-black/80 backdrop-blur-xl rounded-xl shadow-2xl border border-blue-500/30 overflow-hidden">
                       <StepGuide
                        step={tutorialStep}
                        totalSteps={4}
                        title={tutorialSteps[tutorialStep - 1].title}
                        description={tutorialSteps[tutorialStep - 1].description}
                        onNext={handleTutorialNext}
                        onSkip={handleTutorialSkip}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* STREAMING STATUS - Compact */}
              {isStreamingSource && streamingEmbedUrl && streamingActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                       {/* Animated bars */}
                        <div className="flex gap-0.5 h-3 items-end">
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity }} />
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [10, 5, 10] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                            <motion.div className="w-0.5 bg-blue-400" animate={{ height: [6, 10, 6] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
                        </div>
                        <span className="text-[10px] text-white/80 font-medium">{sourceLabel[musicSource]} Active</span>
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

              {/* Section: Choose Music Service */}
              <div className={cn("mb-4", tutorialStep === 1 && "ring-2 ring-blue-400/50 ring-offset-2 ring-offset-black/50 rounded-xl")}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-[12px] text-white/70 font-medium flex items-center gap-2">
                    <span>🎧</span>
                    <span>Choose Music Service</span>
                  </div>
                  <AnimatePresence>
                    {!streamingActive && (
                      <AnimatedTip text="Tap one!" icon="tap" variant="default" pulse />
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Explanation for first-timers */}
                {!streamingActive && !hasCompletedTutorial && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-2.5 p-2 rounded-lg bg-blue-500/10 border border-blue-400/20"
                  >
                    <p className="text-[10px] text-blue-200/80 leading-relaxed">
                      <strong>Step 1:</strong> Pick your favorite music service below. 
                      This will open a player where you can browse and play music!
                    </p>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-3 gap-2">
                  {streamingOptions.map((opt, idx) => {
                    const isActive = musicSource === opt.value && streamingActive;
                    return (
                      <motion.button
                        key={opt.value}
                        onClick={() => {
                          SoundEffects.click();
                          handleStreamingSelect(opt.value);
                          if (tutorialStep === 1) setTutorialStep(2);
                        }}
                        className={cn(
                          "relative h-16 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[10px] font-medium transition-all overflow-hidden",
                          isActive
                            ? opt.color === "green" 
                              ? "bg-gradient-to-br from-green-500/30 to-green-600/20 border-green-400/50 text-green-200 border-2"
                              : opt.color === "pink"
                              ? "bg-gradient-to-br from-pink-500/30 to-pink-600/20 border-pink-400/50 text-pink-200 border-2"
                              : "bg-gradient-to-br from-red-500/30 to-red-600/20 border-red-400/50 text-red-200 border-2"
                            : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20"
                        )}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        {isActive && <BlueShimmer className="!bg-gradient-to-r !from-transparent !via-white/10 !to-transparent" />}
                        <motion.div
                          animate={!streamingActive ? { y: [0, -2, 0] } : {}}
                          transition={{ duration: 1, repeat: Infinity, delay: idx * 0.2 }}
                        >
                          {opt.icon}
                        </motion.div>
                        <span>{opt.label}</span>
                        {isActive && (
                          <motion.div
                            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-current"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute bottom-1 text-[8px] opacity-70"
                          >
                            Playing
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                
                {/* Next step hint after selecting */}
                <AnimatePresence>
                  {streamingActive && !hasCompletedTutorial && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5"
                    >
                      <AnimatedTip 
                        text="Great! Now close menu (▲) to see the player" 
                        icon="close" 
                        variant="success"
                        pulse
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section: Volume Controls & Tips */}
              <div className={cn("mb-4 space-y-3", tutorialStep === 4 && "ring-2 ring-blue-400/50 ring-offset-2 ring-offset-black/50 rounded-xl p-2 -m-2")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[12px] text-white/70 font-medium flex items-center gap-2">
                    <span>🔊</span>
                    <span>Audio & Tips</span>
                  </div>
                   {/* Navbar Tips Toggle - Merged into header */}
                   <motion.button
                    onClick={() => {
                      SoundEffects.click();
                      setTipsMuted(!tipsMuted);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-medium transition-colors",
                       tipsMuted
                        ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                        : "bg-blue-500/20 border-blue-400/40 text-blue-200"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Navbar Tips: {tipsMuted ? "OFF" : "ON"}</span>
                  </motion.button>
                </div>
                
                <Slider
                  label="🎵 Music"
                  hint={musicSource === 'YOUTUBE' ? "Adjusts player volume" : "Attempts to adjust embed volume"}
                  value={musicVolume}
                  onChange={(v) => {
                     setMusicVolume(v);
                     // Unmute hack for all types
                     if (iframeRef.current?.contentWindow) {
                        const win = iframeRef.current.contentWindow;
                        if (musicSource === 'YOUTUBE') {
                          win.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
                        }
                        // Try generic unmutes
                        win.postMessage({ method: 'play' }, '*');
                        win.postMessage({ method: 'setVolume', value: 1 }, '*');
                     }
                  }}
                />
                <Slider
                  label="✨ Interactions"
                  hint="All site sounds (except active music)"
                  value={sfxVolume}
                  onChange={(v) => setSfxVolume(v)}
                />
              </div>

              {/* Music Library Link - Merged below volume */}
               <motion.button
                onClick={() => {
                  SoundEffects.click();
                  setMusicEnabled(false);
                  setMusicEmbedOpen(true);
                  setOpen(false);
                }}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-[10px] text-blue-300/80 hover:text-blue-200 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5"
              >
                <IconMusic className="w-3 h-3" />
                <span>Open Full Music Library</span>
              </motion.button>

              {/* Helper Tips Section - Context-aware guidance */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 pt-3 border-t border-white/10"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-[10px] text-white/50 flex items-center gap-1.5">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <IconInfoCircle className="w-3.5 h-3.5" />
                    </motion.div>
                    <span className="font-medium">How it works</span>
                  </div>
                  {hasCompletedTutorial && (
                    <button
                      onClick={() => {
                        setHasCompletedTutorial(false);
                        setTutorialStep(1);
                        localStorage.removeItem('audioWidgetTutorialComplete');
                      }}
                      className="text-[9px] text-blue-400/60 hover:text-blue-300 transition-colors"
                    >
                      Restart tutorial
                    </button>
                  )}
                </div>
                
                {/* Dynamic tips based on state */}
                <div className="space-y-2">
                  {!streamingActive ? (
                    // Not playing - show getting started tips
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-400/10">
                        <motion.span
                          className="text-[14px] mt-0.5"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          1️⃣
                        </motion.span>
                        <div>
                          <p className="text-[10px] text-white/70 font-medium">Choose a service</p>
                          <p className="text-[9px] text-white/40">Tap Spotify, Apple, or YouTube above</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-[14px] mt-0.5 opacity-50">2️⃣</span>
                        <div>
                          <p className="text-[10px] text-white/50">Close menu to see player</p>
                          <p className="text-[9px] text-white/30">The player appears on the left side</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                        <span className="text-[14px] mt-0.5 opacity-50">3️⃣</span>
                        <div>
                          <p className="text-[10px] text-white/50">Press play in the player</p>
                          <p className="text-[9px] text-white/30">Click inside the embed to start music</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    // Playing - show player control tips
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border border-green-400/20">
                        <motion.span
                          className="text-[14px] mt-0.5"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          ✅
                        </motion.span>
                        <div>
                          <p className="text-[10px] text-green-200/90 font-medium">Music service active!</p>
                          <p className="text-[9px] text-green-200/50">Close this menu to see your player</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                          <IconArrowLeft className="w-3.5 h-3.5 text-blue-300/70" />
                          <div>
                            <p className="text-[9px] text-white/60">Swipe left</p>
                            <p className="text-[8px] text-white/30">Hide player</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                          <IconArrowRight className="w-3.5 h-3.5 text-blue-300/70" />
                          <div>
                            <p className="text-[9px] text-white/60">Tap edge</p>
                            <p className="text-[8px] text-white/30">Show player</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] text-white/40 text-center pt-1">
                        🎵 Music keeps playing even when hidden!
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Side Tutorial Guide - Floating to the right of menu (Desktop Only) */}
      <AnimatePresence>
        {open && tutorialStep > 0 && tutorialStep <= 4 && (
          <motion.div 
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className="hidden sm:block absolute left-[calc(100%+16px)] top-0 w-[260px] z-[55]"
          >
            <StepGuide
              step={tutorialStep}
              totalSteps={4}
              title={tutorialSteps[tutorialStep - 1].title}
              description={tutorialSteps[tutorialStep - 1].description}
              onNext={handleTutorialNext}
              onSkip={handleTutorialSkip}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING SWIPEABLE PLAYER - Always rendered when streaming (never destroyed to preserve playback) */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isStreamingSource && streamingEmbedUrl && streamingActive && (
              <>
                {/* Main floating player - slides in/out from left edge, hides when menu open */}
                <motion.div
                  ref={miniPlayerRef}
                  initial={{ x: -320 }}
                  animate={{ 
                    x: open ? -320 : (playerHidden ? -260 : 0),
                    opacity: open ? 0 : 0.95,
                  }}
                  whileHover={{ opacity: 1 }}
                  exit={{ x: -320, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed z-[9999] pointer-events-auto"
                  style={{ 
                    left: 0, 
                    bottom: 110,
                    pointerEvents: open ? 'none' : 'auto',
                  }}
                >
                  <div className={cn(
                    "relative rounded-r-xl border-r border-y backdrop-blur-md shadow-xl overflow-hidden flex",
                    "bg-black/80",
                    musicSource === 'SPOTIFY' 
                      ? "border-green-500/30"
                      : musicSource === 'APPLE_MUSIC'
                      ? "border-pink-500/30"
                      : "border-red-500/30"
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

                    {/* Main player content */}
                    <div className="flex-1 relative">
                      {/* Header Compact */}
                      <div className={cn(
                        "relative flex items-center justify-between px-3 py-2 border-b border-white/5",
                      )}>
                        <div className="relative flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 flex items-center justify-center opacity-80"
                          >
                            {sourceIcons[musicSource]}
                          </motion.div>
                          
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/90 font-medium">{sourceLabel[musicSource]}</span>
                              <div className="flex gap-0.5 ml-1">
                                <motion.div className="w-0.5 h-1.5 bg-blue-400 rounded-full" animate={{ scaleY: [1, 1.5, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
                                <motion.div className="w-0.5 h-2 bg-blue-400 rounded-full" animate={{ scaleY: [1, 0.6, 1] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                              </div>
                            </div>
                        </div>
                         {/* Stop button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              SoundEffects.click();
                              setStreamingActive(false);
                              setMusicEnabled(false);
                            }}
                            className="w-5 h-5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                          >
                            <span className="text-[10px]">✕</span>
                          </button>
                      </div>
                      
                      {/* Embed player - Scale down slightly for less intrusion */}
                      <div className="relative origin-top-left transition-transform duration-300 scale-95 hover:scale-100" style={{ width: '260px', height: musicSource === 'YOUTUBE' ? '146px' : '140px' }}>
                        <iframe
                          ref={iframeRef}
                          key={`streaming-persistent-${musicSource}-${iframeKey}`}
                          title={`${sourceLabel[musicSource]} player`}
                          src={streamingEmbedUrl}
                          width="100%"
                          height="100%"
                          loading="eager"
                          style={{ border: 0, display: 'block' }}
                        />
                         {/* Play hint overlay */}
                         {!hasCompletedTutorial && <div className="absolute inset-0 pointer-events-none bg-transparent" /> }
                      </div>
                    </div>

                    {/* Edge toggle button - Slim profile */}
                    <motion.button
                      onClick={() => {
                        SoundEffects.click();
                        setPlayerHidden(!playerHidden);
                      }}
                      className="relative w-6 flex flex-col items-center justify-center border-l border-white/5 hover:bg-white/5 transition-colors"
                      title={playerHidden ? "Show" : "Hide"}
                    >
                      <motion.div
                        animate={{ rotate: playerHidden ? 0 : 180 }}
                        className="text-[10px] text-white/50"
                      >
                         <IconChevronUp className="w-3 h-3 rotate-90" />
                      </motion.div>
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
    </div>
  );
});

export default AudioWidget;
