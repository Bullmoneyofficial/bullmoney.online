import type { MusicSource } from "@/contexts/AudioSettingsProvider";

export interface FloatingPlayerProps {
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
