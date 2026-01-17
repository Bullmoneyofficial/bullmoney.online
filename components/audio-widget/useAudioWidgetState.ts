"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { MusicSource } from "@/contexts/AudioSettingsProvider";

export interface UseAudioWidgetStateReturn {
  // UI state
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  musicEmbedOpen: boolean;
  setMusicEmbedOpen: React.Dispatch<React.SetStateAction<boolean>>;
  streamingActive: boolean;
  setStreamingActive: React.Dispatch<React.SetStateAction<boolean>>;
  iframeKey: number;
  setIframeKey: React.Dispatch<React.SetStateAction<number>>;
  playerHidden: boolean;
  setPlayerHidden: React.Dispatch<React.SetStateAction<boolean>>;
  showFirstTimeHelp: boolean;
  setShowFirstTimeHelp: React.Dispatch<React.SetStateAction<boolean>>;
  tutorialStep: number;
  setTutorialStep: React.Dispatch<React.SetStateAction<number>>;
  hasCompletedTutorial: boolean;
  setHasCompletedTutorial: React.Dispatch<React.SetStateAction<boolean>>;
  showPlayerHint: boolean;
  setShowPlayerHint: React.Dispatch<React.SetStateAction<boolean>>;
  showReturnUserHint: boolean;
  setShowReturnUserHint: React.Dispatch<React.SetStateAction<boolean>>;
  showTipsOverlay: boolean;
  setShowTipsOverlay: React.Dispatch<React.SetStateAction<boolean>>;
  widgetHidden: boolean;
  setWidgetHidden: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  setIsMobile: React.Dispatch<React.SetStateAction<boolean>>;
  isScrollMinimized: boolean;
  setIsScrollMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  playerMinimized: boolean;
  setPlayerMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Game state
  hasStartedCatchGame: boolean;
  setHasStartedCatchGame: React.Dispatch<React.SetStateAction<boolean>>;
  showCatchGameTutorial: boolean;
  setShowCatchGameTutorial: React.Dispatch<React.SetStateAction<boolean>>;
  showCatchGameDemo: boolean;
  setShowCatchGameDemo: React.Dispatch<React.SetStateAction<boolean>>;
  isTutorialHovered: boolean;
  setIsTutorialHovered: React.Dispatch<React.SetStateAction<boolean>>;
  showGameOver: boolean;
  setShowGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  showBoredPopup: boolean;
  setShowBoredPopup: React.Dispatch<React.SetStateAction<boolean>>;
  hasSeenBoredPopup: boolean;
  setHasSeenBoredPopup: React.Dispatch<React.SetStateAction<boolean>>;
  showCatchSparkle: boolean;
  setShowCatchSparkle: React.Dispatch<React.SetStateAction<boolean>>;
  showConfetti: boolean;
  setShowConfetti: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Refs
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  catchGameTutorialTimerRef: React.MutableRefObject<number | null>;
  
  // Motion values
  widgetX: ReturnType<typeof useMotionValue<number>>;
  widgetOpacity: ReturnType<typeof useTransform<number, number>>;
  floatingPosition: { x: number; y: number };
  setFloatingPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  
  // Handlers
  handleWidgetDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  handleDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

export function useAudioWidgetState(): UseAudioWidgetStateReturn {
  // UI state
  const [open, setOpen] = useState(false);
  const [musicEmbedOpen, setMusicEmbedOpen] = useState(false);
  const [streamingActive, setStreamingActive] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [playerHidden, setPlayerHidden] = useState(false);
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const [showPlayerHint, setShowPlayerHint] = useState(true);
  const [showReturnUserHint, setShowReturnUserHint] = useState(false);
  const [showTipsOverlay, setShowTipsOverlay] = useState(false);
  const [widgetHidden, setWidgetHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrollMinimized, setIsScrollMinimized] = useState(false);
  // Start minimized by default - will be set to false for new users after localStorage check
  const [playerMinimized, setPlayerMinimized] = useState(true);
  
  // Game state
  const [hasStartedCatchGame, setHasStartedCatchGame] = useState(false);
  const [showCatchGameTutorial, setShowCatchGameTutorial] = useState(false);
  const [showCatchGameDemo, setShowCatchGameDemo] = useState(false);
  const [isTutorialHovered, setIsTutorialHovered] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showBoredPopup, setShowBoredPopup] = useState(false);
  const [hasSeenBoredPopup, setHasSeenBoredPopup] = useState(false);
  const [showCatchSparkle, setShowCatchSparkle] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const catchGameTutorialTimerRef = useRef<number | null>(null);
  
  // Motion values
  const widgetX = useMotionValue(0);
  const widgetOpacity = useTransform(widgetX, [-150, 0], [0.3, 1]);
  const [floatingPosition, setFloatingPosition] = useState({ x: 0, y: 0 });
  
  // Handlers
  const handleWidgetDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -80) {
      setWidgetHidden(true);
      widgetX.set(0);
    } else {
      widgetX.set(0);
    }
  }, [widgetX]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      setPlayerHidden(true);
      setFloatingPosition({ x: 0, y: 0 });
    } else {
      setFloatingPosition(prev => ({
        x: prev.x + info.offset.x,
        y: prev.y + info.offset.y,
      }));
    }
  }, []);
  
  return {
    open, setOpen,
    musicEmbedOpen, setMusicEmbedOpen,
    streamingActive, setStreamingActive,
    iframeKey, setIframeKey,
    playerHidden, setPlayerHidden,
    showFirstTimeHelp, setShowFirstTimeHelp,
    tutorialStep, setTutorialStep,
    hasCompletedTutorial, setHasCompletedTutorial,
    showPlayerHint, setShowPlayerHint,
    showReturnUserHint, setShowReturnUserHint,
    showTipsOverlay, setShowTipsOverlay,
    widgetHidden, setWidgetHidden,
    isMobile, setIsMobile,
    isScrollMinimized, setIsScrollMinimized,
    playerMinimized, setPlayerMinimized,
    hasStartedCatchGame, setHasStartedCatchGame,
    showCatchGameTutorial, setShowCatchGameTutorial,
    showCatchGameDemo, setShowCatchGameDemo,
    isTutorialHovered, setIsTutorialHovered,
    showGameOver, setShowGameOver,
    showBoredPopup, setShowBoredPopup,
    hasSeenBoredPopup, setHasSeenBoredPopup,
    showCatchSparkle, setShowCatchSparkle,
    showConfetti, setShowConfetti,
    iframeRef, widgetRef, catchGameTutorialTimerRef,
    widgetX, widgetOpacity,
    floatingPosition, setFloatingPosition,
    handleWidgetDragEnd, handleDragEnd,
  };
}

export function useAudioWidgetEffects(
  state: UseAudioWidgetStateReturn,
  audioSettings: {
    musicSource: MusicSource;
    setMusicSource: (source: MusicSource) => void;
    setMusicEnabled: (enabled: boolean) => void;
    musicEnabled: boolean;
    isStreamingSource: boolean;
    streamingEmbedUrl: string | null;
    musicVolume: number;
  },
  gameHook: {
    isWandering: boolean;
    gameState: string;
    setHasInteracted: (v: boolean) => void;
    startGame: () => void;
    gameStats: { gamesPlayed: number; currentScore: number; highScore: number };
    handlePlayerInteraction: () => void;
  }
) {
  const {
    setIsMobile, open, hasCompletedTutorial, tutorialStep, setTutorialStep,
    setShowFirstTimeHelp, hasSeenBoredPopup, setShowBoredPopup, setHasSeenBoredPopup,
    showGameOver, setShowGameOver, setShowCatchSparkle, setShowConfetti,
    setHasCompletedTutorial, setStreamingActive, setPlayerHidden,
    setShowReturnUserHint, catchGameTutorialTimerRef, setPlayerMinimized,
  } = state;
  
  const { musicSource, setMusicSource, setMusicEnabled, musicEnabled, isStreamingSource, streamingEmbedUrl } = audioSettings;
  const { isWandering, gameState, gameStats } = gameHook;

  // Show pull tab on mount (minimize player on page reload)
  useEffect(() => {
    setPlayerHidden(true);
  }, [setPlayerHidden]);

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
  }, [setIsMobile]);

  // Check localStorage for tutorial completion and saved preference
  // On reload: restore music source but keep player MINIMIZED (pull tab only)
  useEffect(() => {
    const completed = localStorage.getItem('audioWidgetTutorialComplete');
    if (completed === 'true') {
      setHasCompletedTutorial(true);
      setShowFirstTimeHelp(false);

      const savedSource = localStorage.getItem('audioWidgetSavedSource');
      if (savedSource && ['SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE'].includes(savedSource)) {
        setMusicSource(savedSource as MusicSource);
        setStreamingActive(true);
        setMusicEnabled(true);
        // Keep player minimized on reload - only show pull tab
        // User can expand by clicking the pull tab
        setPlayerMinimized(true);
        setShowReturnUserHint(true);
        setTimeout(() => setShowReturnUserHint(false), 10000);
      } else {
        // No saved source - new user, allow full player to show
        setPlayerMinimized(false);
      }
    } else {
      // New user - hasn't completed tutorial, allow full player to show
      setPlayerMinimized(false);
    }
  }, [setMusicSource, setMusicEnabled, setHasCompletedTutorial, setShowFirstTimeHelp, setStreamingActive, setPlayerMinimized, setShowReturnUserHint]);

  // Hide first time help after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowFirstTimeHelp(false), 15000);
    return () => clearTimeout(timer);
  }, [setShowFirstTimeHelp]);

  // Start tutorial when menu opens for first time
  useEffect(() => {
    if (open && !hasCompletedTutorial && tutorialStep === 0) {
      setTutorialStep(1);
    }
  }, [open, hasCompletedTutorial, tutorialStep, setTutorialStep]);

  // Bored popup effect
  useEffect(() => {
    if (isWandering && !hasSeenBoredPopup) {
      const timer = setTimeout(() => {
        setShowBoredPopup(true);
        setHasSeenBoredPopup(true);
        setTimeout(() => setShowBoredPopup(false), 5000);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isWandering, hasSeenBoredPopup, setShowBoredPopup, setHasSeenBoredPopup]);

  // localStorage for bored popup
  useEffect(() => {
    const seen = localStorage.getItem('audioWidgetSeenBoredPopup');
    if (seen === 'true') setHasSeenBoredPopup(true);
  }, [setHasSeenBoredPopup]);

  useEffect(() => {
    if (hasSeenBoredPopup) localStorage.setItem('audioWidgetSeenBoredPopup', 'true');
  }, [hasSeenBoredPopup]);

  // Game over modal
  useEffect(() => {
    if (gameState === "caught" || gameState === "escaped") {
      setShowGameOver(true);
      if (gameState === "caught") {
        setShowCatchSparkle(true);
        setShowConfetti(true);
        setTimeout(() => {
          setShowCatchSparkle(false);
          setShowConfetti(false);
        }, 600);
      }
    }
  }, [gameState, setShowGameOver, setShowCatchSparkle, setShowConfetti]);

  // Streaming sync
  useEffect(() => {
    if (isStreamingSource && musicEnabled && streamingEmbedUrl) {
      setStreamingActive(true);
    } else if (!musicEnabled) {
      setStreamingActive(false);
    }
  }, [isStreamingSource, musicEnabled, streamingEmbedUrl, setStreamingActive]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (catchGameTutorialTimerRef.current != null) {
        window.clearTimeout(catchGameTutorialTimerRef.current);
      }
    };
  }, [catchGameTutorialTimerRef]);
}
