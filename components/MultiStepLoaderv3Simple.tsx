"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
} from "framer-motion";
import {
  Lock,
  Unlock,
  Keyboard,
  Key,
  Timer,
  TrendingUp,
  Settings,
  Shield,
  Eye,
  Search,
  Loader2,
  DollarSign,
  BarChart2,
  Target,
} from "lucide-react";

// ============================================================================
// NEON BLUE GLOW THEME - OLED BLACK BACKGROUND
// ============================================================================
const NEON_BLUE = "#ffffff";
const NEON_CYAN = "#ffffff";

const NEON_STYLES = `
  @keyframes vault-unlock {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  @keyframes key-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes keyboard-pulse {
    0%, 100% { box-shadow: 0 0 5px #ffffff; }
    50% { box-shadow: 0 0 20px #ffffff, 0 0 40px #ffffff; }
  }

  @keyframes prank-shake {
    0%, 100% { transform: translateX(0); }
    10% { transform: translateX(-8px); }
    20% { transform: translateX(8px); }
    30% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    50% { transform: translateX(-4px); }
    60% { transform: translateX(4px); }
    70% { transform: translateX(-2px); }
    80% { transform: translateX(2px); }
    90% { transform: translateX(-1px); }
  }

  @keyframes prank-glitch {
    0%, 100% { clip-path: inset(0 0 0 0); filter: hue-rotate(0deg); }
    20% { clip-path: inset(20% 0 30% 0); filter: hue-rotate(90deg); }
    40% { clip-path: inset(60% 0 10% 0); filter: hue-rotate(180deg); }
    60% { clip-path: inset(10% 0 50% 0); filter: hue-rotate(270deg); }
    80% { clip-path: inset(40% 0 20% 0); filter: hue-rotate(360deg); }
  }

  @keyframes prank-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.02); }
  }

  @keyframes prank-scan {
    0% { top: 0%; }
    100% { top: 100%; }
  }

  @keyframes confetti-fall {
    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  @keyframes tap-pulse {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }

  @keyframes circle-draw {
    0% { stroke-dashoffset: 283; }
    100% { stroke-dashoffset: 0; }
  }

  .neon-text {
    color: #fff;
    text-shadow: 
      0 0 4px #fff,
      0 0 8px #fff,
      0 0 12px #ffffff,
      0 0 20px #ffffff;
  }

  .neon-glow {
    box-shadow: 
      0 0 10px #ffffff,
      0 0 20px #ffffff;
  }

  .prank-scanline::after {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
    animation: prank-scan 2s linear infinite;
  }
`;

// ============================================================================
// TYPES & CONFIG
// ============================================================================
type GameMode =
  // Unified Games (same for mobile and desktop)
  | "passwordVault"     // Type "buy gold" → draggable key → vault → unlock
  | "keyboardChallenge" // Virtual keyboard BUYGOLD → tap space 10x in 2s → unlock
  | "holdPrank";        // Hold 2s → prank → unlock

interface LoaderProps {
  onFinished?: () => void;
}

interface GameConfig {
  mode: GameMode;
  label: string;
  instruction: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

// DESKTOP GAMES - 3 Only (Trading Themed)
const DESKTOP_GAMES: GameConfig[] = [
  {
    mode: "passwordVault",
    label: "TRADING KEY",
    instruction: "Type 'buy gold' to unlock your trade",
    icon: DollarSign,
  },
  {
    mode: "keyboardChallenge",
    label: "EXECUTE TRADE",
    instruction: "Enter your position",
    icon: BarChart2,
  },
  {
    mode: "holdPrank",
    label: "HOLD POSITION",
    instruction: "Hold for profit target",
    icon: Target,
  },
];

// UNIFIED: Mobile now uses DESKTOP_GAMES for consistency

// PRANKS for desktop hold game - Trading themed messages
const PRANKS: { type: string; message: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { type: "shake", message: "ANALYZING MARKET...", icon: BarChart2 },
  { type: "glitch", message: "CHECKING LIQUIDITY...", icon: Shield },
  { type: "scan", message: "SCANNING CHARTS...", icon: Eye },
  { type: "pulse", message: "CONFIRMING TRADE...", icon: Search },
  { type: "fade", message: "PROFIT TARGET HIT...", icon: TrendingUp },
];

// Detect device type
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);
};

// ============================================================================
// MOBILE PERFORMANCE HOOK
// ============================================================================
const useMobilePerformance = () => {
  const [shouldSkipHeavyEffects, setShouldSkipHeavyEffects] = useState(false);

  useEffect(() => {
    // Check device memory or user agent for performance decisions
    if (typeof navigator !== 'undefined') {
      const deviceMemory = (navigator as any).deviceMemory;
      const isSlowDevice = isMobileDevice() && 
        (deviceMemory === undefined || deviceMemory <= 4);
      setShouldSkipHeavyEffects(isSlowDevice);
    }
  }, []);

  return { shouldSkipHeavyEffects };
};

// ============================================================================
// AUDIO ENGINE
// ============================================================================
const useAudioEngine = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = AudioContextClass ? new AudioContextClass() : null;
      } catch {
        return null;
      }
    }
    const ctx = audioCtxRef.current;
    if (ctx?.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }, []);

  const playTick = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }, [initAudio]);

  const playKey = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }, [initAudio]);

  const playSuccess = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);
      const delay = i * 0.04;
      const volume = 0.12 - (i * 0.02);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + 0.6);
    });
  }, [initAudio]);

  return { playTick, playKey, playSuccess };
};

// ============================================================================
// HAPTICS
// ============================================================================
const useHaptics = () => {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch {}
    }
  }, []);

  return {
    lightTap: useCallback(() => vibrate(10), [vibrate]),
    mediumTap: useCallback(() => vibrate(25), [vibrate]),
    heavyTap: useCallback(() => vibrate(50), [vibrate]),
    successPattern: useCallback(() => vibrate([50, 100, 50, 100, 100]), [vibrate]),
  };
};

// ============================================================================
// VIRTUAL KEYBOARD COMPONENT - Mobile responsive with theme support
// ============================================================================
const VirtualKeyboard = ({
  targetKeys,
  pressedKeys,
  onKeyPress,
  compact = false,
  themeColor = '#ffffff'
}: {
  targetKeys: string[];
  pressedKeys: Set<string>;
  onKeyPress: (key: string) => void;
  compact?: boolean;
  themeColor?: string;
}) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ['SPACE'],
  ];

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
      {rows.map((row, i) => (
        <div key={i} className={`flex ${compact ? 'gap-0.5' : 'gap-1'}`}>
          {row.map((key) => {
            const isTarget = targetKeys.includes(key);
            const isPressed = pressedKeys.has(key);
            const isSpace = key === 'SPACE';

            return (
              <motion.button
                key={key}
                onClick={() => onKeyPress(key)}
                className={`
                  ${isSpace
                    ? compact ? 'w-28 xs:w-32' : 'w-32 sm:w-40'
                    : compact ? 'w-7 xs:w-8' : 'w-8 sm:w-9'
                  }
                  ${compact ? 'h-8' : 'h-8 sm:h-9'}
                  rounded-md sm:rounded-lg font-bold
                  ${compact ? 'text-xs' : 'text-xs sm:text-sm'}
                  flex items-center justify-center
                  transition-all duration-150
                  border sm:border-2
                `}
                style={{
                  backgroundColor: isPressed
                    ? themeColor
                    : isTarget
                      ? `${themeColor}50`
                      : 'rgba(0,0,0,0.5)',
                  color: isPressed
                    ? '#000'
                    : isTarget
                      ? themeColor
                      : `${themeColor}80`,
                  borderColor: isPressed || isTarget
                    ? themeColor
                    : `${themeColor}33`,
                  boxShadow: isTarget && !isPressed
                    ? `0 0 10px ${themeColor}, 0 0 20px ${themeColor}`
                    : isPressed
                      ? `0 0 10px ${themeColor}`
                      : 'none',
                  animation: isTarget && !isPressed ? 'pulse 1s infinite' : undefined,
                }}
                whileTap={{ scale: 0.95 }}
              >
                {isSpace ? (compact ? 'SPACE' : '⎵ SPACE') : key}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// DRAGGABLE KEY COMPONENT - Fixed for mobile touch, responsive sizing with theme
// ============================================================================
const DraggableKey = ({
  onDrop,
  vaultPosition,
  compact = false,
  themeColor = '#ffffff'
}: {
  onDrop: () => void;
  vaultPosition: { x: number; y: number };
  compact?: boolean;
  themeColor?: string;
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNearVault, setIsNearVault] = useState(false);
  const keyRef = useRef<HTMLDivElement>(null);
  const hasDroppedRef = useRef(false);
  const keySize = compact ? 30 : 40;

  // Handle drag start - set initial position
  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    hasDroppedRef.current = false;
    setIsDragging(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({ x: clientX - keySize, y: clientY - keySize });
  }, [keySize]);

  // Check distance to vault
  const checkDistance = useCallback((clientX: number, clientY: number) => {
    if (vaultPosition.x === 0 && vaultPosition.y === 0) return Infinity;
    return Math.sqrt(
      Math.pow(clientX - vaultPosition.x, 2) +
      Math.pow(clientY - vaultPosition.y, 2)
    );
  }, [vaultPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (hasDroppedRef.current) return;

      let clientX: number;
      let clientY: number;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }

      setPosition({ x: clientX - keySize, y: clientY - keySize });

      // Check if near vault - use larger detection radius for mobile (150px)
      const distance = checkDistance(clientX, clientY);
      setIsNearVault(distance < 150);

      // Drop when very close (120px for easier mobile targeting)
      if (distance < 120 && !hasDroppedRef.current) {
        hasDroppedRef.current = true;
        setIsDragging(false);
        setIsNearVault(false);
        onDrop();
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();

      // On touch end, check final position for drop
      if (!hasDroppedRef.current && 'changedTouches' in e && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const distance = checkDistance(touch.clientX, touch.clientY);
        if (distance < 150) {
          hasDroppedRef.current = true;
          onDrop();
        }
      }

      setIsDragging(false);
      setIsNearVault(false);
    };

    // Use passive: false to allow preventDefault on touch events
    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd, { passive: false });
    window.addEventListener('touchend', handleEnd, { passive: false });
    window.addEventListener('touchcancel', handleEnd, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, vaultPosition, onDrop, checkDistance, keySize]);

  return (
    <motion.div
      ref={keyRef}
      className={`fixed ${compact ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'} rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing z-[100] touch-none select-none`}
      style={{
        left: position?.x ?? '50%',
        top: position?.y ?? (compact ? 150 : 200),
        transform: position === null ? 'translateX(-50%) translateZ(0)' : 'translateZ(0)',
        background: isNearVault
          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
          : `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
        animation: !isDragging ? 'key-float 2s ease-in-out infinite' : undefined,
        willChange: 'transform',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        boxShadow: isNearVault
          ? '0 0 30px rgba(34, 197, 94, 0.8)'
          : `0 0 20px ${themeColor}80`,
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Key size={compact ? 28 : 32} className={isNearVault ? "text-white" : "text-black"} />
    </motion.div>
  );
};

// ============================================================================
// MAIN LOADER COMPONENT
// ============================================================================
export default function MultiStepLoaderV3Simple({ onFinished }: LoaderProps) {
  const { shouldSkipHeavyEffects } = useMobilePerformance();
  const audio = useAudioEngine();
  const haptics = useHaptics();

  // Core states
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [gateVisible, setGateVisible] = useState(true);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Game-specific states
  const [typedPassword, setTypedPassword] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [vaultPosition, setVaultPosition] = useState({ x: 0, y: 0 });
  
  // Random password selection - ALL CAPS trading themed options
  // X3R7P = XM Broker Code (RED theme)
  // BULLMONEY = Vantage Broker Code (BLUE theme)
  const PASSWORD_OPTIONS = useMemo(() => ['X3R7P', 'BULLMONEY', 'BUY GOLD', 'BUY BTC', 'SELL GOLD', 'SELL BTC'], []);
  const [targetPassword] = useState(() => PASSWORD_OPTIONS[Math.floor(Math.random() * PASSWORD_OPTIONS.length)]);
  
  // Broker code detection for theming
  const isXMBrokerCode = targetPassword === 'X3R7P';
  const isVantageBrokerCode = targetPassword === 'BULLMONEY';
  const isBrokerCode = isXMBrokerCode || isVantageBrokerCode;
  
  // Theme colors based on broker code
  const themeColor = isXMBrokerCode ? '#ef4444' : isVantageBrokerCode ? '#3b82f6' : '#ffffff';
  const themeName = isXMBrokerCode ? 'XM' : isVantageBrokerCode ? 'Vantage' : null;
  
  // Keyboard challenge states
  const [keyboardPhase, setKeyboardPhase] = useState<'typing' | 'tapping'>('typing');
  const [keyboardTargetIndex, setKeyboardTargetIndex] = useState(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [spaceTapCount, setSpaceTapCount] = useState(0);
  const [spaceTapStartTime, setSpaceTapStartTime] = useState(0);
  
  // Hold prank states
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [prankActive, setPrankActive] = useState<typeof PRANKS[0] | null>(null);
  const [prankComplete, setPrankComplete] = useState(false);

  // Mobile game states removed - now using unified desktop games

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const vaultRef = useRef<HTMLDivElement>(null);
  const progressSpring = useSpring(0, { stiffness: 100, damping: 20 });

  // Input refs for mobile keyboard focus
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const keyboardInputRef = useRef<HTMLInputElement>(null);

  // Keyboard target sequence - Trading themed
  const TRADE_KEYS = ['B', 'U', 'Y', 'G', 'O', 'L', 'D'];

  // UNIFIED: Use same games for both mobile and desktop
  const games = useMemo(() => DESKTOP_GAMES, []);
  const currentGame = games[currentGameIndex];

  // Auto-focus inputs for mobile keyboard popup
  useEffect(() => {
    if (isTransitioning) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (currentGame?.mode === 'passwordVault' && !hasKey && passwordInputRef.current) {
        passwordInputRef.current.focus();
      } else if (currentGame?.mode === 'keyboardChallenge' && keyboardPhase === 'typing' && keyboardInputRef.current) {
        keyboardInputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentGame?.mode, hasKey, keyboardPhase, isTransitioning]);

  // Initialize
  useEffect(() => {
    setIsMobile(isMobileDevice());

    const styleId = 'neon-loader-v3-simple-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = NEON_STYLES;
      document.head.appendChild(style);
    }

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // --- V3 LOADER AUDIO: Play once on page load (no loop) ---
  useEffect(() => {
    const audioKey = 'bullmoney_v3loader_audio_played';
    const hasPlayed = sessionStorage.getItem(audioKey);
    if (hasPlayed) return; // Already played this session

    const audio = new Audio('/luvvoice.com-20260201-TWfAQU.mp3');
    audio.loop = false;
    audio.volume = 0.7;

    const playAudio = () => {
      audio.play()
        .then(() => {
          sessionStorage.setItem(audioKey, 'true');
        })
        .catch(() => {
          // Autoplay blocked - wait for user interaction
          const playOnInteraction = () => {
            audio.play()
              .then(() => {
                sessionStorage.setItem(audioKey, 'true');
              })
              .catch(() => {});
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
          };
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          document.addEventListener('keydown', playOnInteraction, { once: true });
        });
    };

    playAudio();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update vault position - with delay and continuous updates for mobile
  useEffect(() => {
    if (!hasKey) return;

    const updateVaultPosition = () => {
      if (vaultRef.current) {
        const rect = vaultRef.current.getBoundingClientRect();
        setVaultPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    };

    // Initial delay to ensure vault is rendered
    const initialTimer = setTimeout(updateVaultPosition, 100);

    // Keep updating position in case of layout changes
    const interval = setInterval(updateVaultPosition, 200);

    // Also update on resize
    window.addEventListener('resize', updateVaultPosition);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener('resize', updateVaultPosition);
    };
  }, [hasKey]);

  // Update progress spring
  useEffect(() => {
    progressSpring.set(progress);
  }, [progress, progressSpring]);

  // Completion handler
  const handleGameComplete = useCallback(() => {
    if (completedRef.current || isTransitioning) return;
    
    setIsTransitioning(true);
    audio.playSuccess();
    haptics.successPattern();

    // Brief delay then move to next game or finish
    setTimeout(() => {
      // Move to next game or finish
      if (currentGameIndex < games.length - 1) {
        // Reset all game states (unified desktop games only)
        setTypedPassword("");
        setHasKey(false);
        setKeyboardPhase('typing');
        setKeyboardTargetIndex(0);
        setPressedKeys(new Set());
        setSpaceTapCount(0);
        setSpaceTapStartTime(0);
        setHoldProgress(0);
        setIsHolding(false);
        setPrankActive(null);
        setPrankComplete(false);
        
        // Move to next game after reset
        setTimeout(() => {
          setProgress(0);
          setCurrentGameIndex(prev => prev + 1);
          setIsTransitioning(false);
        }, 100);
      } else {
        completedRef.current = true;
        setIsUnlocked(true);
        
        setTimeout(() => {
          setGateVisible(false);
          onFinished?.();
        }, 2000);
      }
    }, 500);
  }, [audio, haptics, currentGameIndex, games.length, onFinished, isTransitioning]);

  // Check progress completion
  useEffect(() => {
    if (progress >= 100 && !completedRef.current) {
      handleGameComplete();
    }
  }, [progress, handleGameComplete]);

  // ============================================================================
  // DESKTOP GAME HANDLERS
  // ============================================================================

  // Password Vault - Type random trading phrase (ALL CAPS)
  const handlePasswordType = useCallback((e: React.KeyboardEvent) => {
    if (!currentGame || currentGame.mode !== 'passwordVault' || hasKey) return;
    
    const key = e.key.toUpperCase();
    const nextChar = targetPassword[typedPassword.length];
    
    if (key === nextChar) {
      const newTyped = typedPassword + key;
      setTypedPassword(newTyped);
      audio.playKey();
      haptics.lightTap();
      
      if (newTyped === targetPassword) {
        setHasKey(true);
        setProgress(50);
      }
    }
  }, [currentGame, typedPassword, hasKey, audio, haptics, targetPassword]);

  // Key dropped in vault
  const handleKeyDrop = useCallback(() => {
    if (!currentGame || currentGame.mode !== 'passwordVault' || isTransitioning || progress >= 100) return;
    setProgress(100);
  }, [currentGame, isTransitioning, progress]);

  // Keyboard Challenge
  const handleKeyboardPress = useCallback((key: string) => {
    if (!currentGame || currentGame.mode !== 'keyboardChallenge') return;
    
    if (keyboardPhase === 'typing') {
      const targetKey = TRADE_KEYS[keyboardTargetIndex];
      if (key === targetKey) {
        audio.playKey();
        haptics.lightTap();
        setPressedKeys(prev => new Set([...prev, `${key}-${keyboardTargetIndex}`]));
        
        if (keyboardTargetIndex >= TRADE_KEYS.length - 1) {
          setKeyboardPhase('tapping');
          setProgress(50);
        } else {
          setKeyboardTargetIndex(prev => prev + 1);
          setProgress((keyboardTargetIndex + 1) / TRADE_KEYS.length * 50);
        }
      }
    } else if (keyboardPhase === 'tapping' && key === 'SPACE') {
      const now = Date.now();
      
      if (spaceTapCount === 0 || now - spaceTapStartTime > 2000) {
        setSpaceTapStartTime(now);
        setSpaceTapCount(1);
      } else {
        const newCount = spaceTapCount + 1;
        setSpaceTapCount(newCount);
        audio.playTick();
        haptics.mediumTap();
        
        if (newCount >= 10) {
          setProgress(100);
        } else {
          setProgress(50 + (newCount / 10) * 50);
        }
      }
    }
  }, [currentGame, keyboardPhase, keyboardTargetIndex, spaceTapCount, spaceTapStartTime, audio, haptics]);

  // Physical keyboard listener for keyboard challenge
  useEffect(() => {
    if (!currentGame || currentGame.mode !== 'keyboardChallenge' || isTransitioning) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      
      const key = e.key.toUpperCase();
      if (key === ' ') {
        e.preventDefault();
        handleKeyboardPress('SPACE');
      } else if (/^[A-Z]$/.test(key)) {
        handleKeyboardPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGame, handleKeyboardPress, isTransitioning]);

  // Physical keyboard listener for password vault - IMMEDIATE typing support (ALL CAPS)
  useEffect(() => {
    if (!currentGame || currentGame.mode !== 'passwordVault' || hasKey || isTransitioning) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with dragging
      if (hasKey) return;
      
      const key = e.key.toUpperCase();
      const nextChar = targetPassword[typedPassword.length];
      
      if (key === nextChar) {
        e.preventDefault();
        const newTyped = typedPassword + key;
        setTypedPassword(newTyped);
        audio.playKey();
        haptics.lightTap();
        
        if (newTyped === targetPassword) {
          setHasKey(true);
          setProgress(50);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGame, typedPassword, hasKey, audio, haptics, isTransitioning, targetPassword]);

  // Hold Prank
  const handleHoldStart = useCallback(() => {
    if (!currentGame || currentGame.mode !== 'holdPrank' || prankComplete) return;
    
    setIsHolding(true);
    haptics.heavyTap();
    
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(p => {
        const next = Math.min(p + 5, 100);
        if (next % 20 === 0) audio.playTick();
        
        if (next >= 100 && !prankActive && !prankComplete) {
          // Trigger prank!
          const prank = PRANKS[Math.floor(Math.random() * PRANKS.length)];
          setPrankActive(prank);
          
          // After prank, unlock
          setTimeout(() => {
            setPrankComplete(true);
            setProgress(100);
          }, 1500 + Math.random() * 1000); // 1.5-2.5 seconds
        }
        
        return next;
      });
    }, 40);
  }, [currentGame, prankActive, prankComplete, audio, haptics]);

  const handleHoldEnd = useCallback(() => {
    setIsHolding(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (!prankActive && !prankComplete) {
      setHoldProgress(0);
    }
  }, [prankActive, prankComplete]);

  // Mobile game handlers removed - now using unified desktop games for both platforms

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!gateVisible) return null;
  if (!currentGame) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none"
        style={{ backgroundColor: "#000", touchAction: isMobile ? 'manipulation' : 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onKeyDown={handlePasswordType}
        tabIndex={0}
        autoFocus
      >
        {/* Prank effects - Clean dark theme */}
        {prankActive && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ backgroundColor: '#000' }}
          >
            {/* Scan line effect */}
            {prankActive.type === 'scan' && (
              <div className="absolute inset-0 prank-scanline overflow-hidden" />
            )}

            {/* Glitch effect overlay */}
            {prankActive.type === 'glitch' && (
              <div
                className="absolute inset-0"
                style={{
                  animation: 'prank-glitch 0.3s infinite',
                  background: 'linear-gradient(0deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
                }}
              />
            )}

            {/* Shake wrapper */}
            <motion.div
              className="flex flex-col items-center gap-4 sm:gap-6"
              animate={prankActive.type === 'shake' ? { x: [-8, 8, -6, 6, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.5, repeat: prankActive.type === 'shake' ? Infinity : 0 }}
            >
              {/* Prank icon */}
              <motion.div
                className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
                }}
                animate={prankActive.type === 'pulse' ? { scale: [1, 1.05, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <prankActive.icon size={isMobile ? 28 : 40} className="text-white" />
              </motion.div>

              {/* Message */}
              <div className="text-center">
                <motion.p
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2"
                  animate={prankActive.type === 'fade' ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {prankActive.message}
                </motion.p>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-white/50 mt-3 sm:mt-4">Please wait...</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Game indicator */}
        <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
          {games.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                i < currentGameIndex
                  ? 'bg-white'
                  : i === currentGameIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Main content area */}
        <div className="flex flex-col items-center gap-4 sm:gap-6 lg:gap-8 z-10 px-4 w-full max-w-md mx-auto">
          {/* Transition loading state */}
          {isTransitioning && (
            <motion.div
              className="flex flex-col items-center gap-3 sm:gap-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <p className="text-white text-xs sm:text-sm">Loading next challenge...</p>
            </motion.div>
          )}

          {/* Game icon */}
          {!isTransitioning && currentGame && (
            <motion.div
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${themeColor}30, ${themeColor}30)`,
                border: isMobile ? `2px solid ${themeColor}` : `3px solid ${themeColor}`,
                transform: 'translateZ(0)',
                willChange: 'transform',
                color: themeColor,
              }}
              animate={isHolding ? { scale: 0.95 } : { scale: 1 }}
            >
              <currentGame.icon size={isMobile ? 32 : 48} />
            </motion.div>
          )}

          {/* Game label */}
          {!isTransitioning && currentGame && (
            <div className="text-center px-2">
              {/* Broker badge for broker codes */}
              {isBrokerCode && (
                <div 
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
                  style={{ 
                    backgroundColor: `${themeColor}20`, 
                    color: themeColor,
                    border: `1px solid ${themeColor}50`
                  }}
                >
                  {themeName} BROKER CODE
                </div>
              )}
              <h2 
                className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2"
                style={{ 
                  color: themeColor,
                  textShadow: `0 0 4px ${themeColor}, 0 0 8px ${themeColor}, 0 0 12px ${themeColor}40`
                }}
              >
                {currentGame.label}
              </h2>
              <p style={{ color: `${themeColor}99` }} className="text-xs sm:text-sm">
                {currentGame.mode === 'passwordVault' 
                  ? `Type '${targetPassword}' to unlock` 
                  : currentGame.instruction}
              </p>
            </div>
          )}

          {/* Progress bar */}
          {!isTransitioning && (
            <div className="w-48 sm:w-56 lg:w-64 h-1.5 sm:h-2 rounded-full overflow-hidden" style={{ background: `${themeColor}33` }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${themeColor}, ${themeColor})`,
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}

          {/* Game-specific UI */}
          {!isTransitioning && currentGame?.mode === 'passwordVault' && !hasKey && (
            <div className="text-center flex flex-col items-center gap-2 sm:gap-3 w-full">
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                {targetPassword.split('').map((char, i) => (
                  <span
                    key={i}
                    className={`text-lg sm:text-xl lg:text-2xl font-mono`}
                    style={{
                      color: i < typedPassword.length
                        ? themeColor
                        : i === typedPassword.length
                          ? themeColor
                          : `${themeColor}50`,
                      animation: i === typedPassword.length ? 'pulse 1s infinite' : undefined,
                    }}
                  >
                    {char === ' ' ? '␣' : char.toUpperCase()}
                  </span>
                ))}
              </div>
              {/* Mobile input field - triggers keyboard popup */}
              <input
                ref={passwordInputRef}
                type="text"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                enterKeyHint="done"
                className="w-full max-w-[240px] sm:max-w-[280px] px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-center text-base sm:text-lg font-mono focus:outline-none focus:ring-2 uppercase"
                style={{
                  background: `${themeColor}15`,
                  border: `2px solid ${themeColor}50`,
                  caretColor: themeColor,
                  color: themeColor,
                }}
                placeholder="Tap here to type..."
                value={typedPassword}
                onClick={() => passwordInputRef.current?.focus()}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const input = e.target.value.toUpperCase();
                  // Only accept if the input matches the target so far
                  if (targetPassword.startsWith(input)) {
                    if (input.length > typedPassword.length) {
                      audio.playKey();
                      haptics.lightTap();
                    }
                    setTypedPassword(input);
                    if (input === targetPassword) {
                      setHasKey(true);
                      setProgress(50);
                    }
                  }
                }}
              />
              <p style={{ color: `${themeColor}80` }} className="text-[10px] sm:text-xs mb-1 sm:mb-2">
                Type: {targetPassword} {isBrokerCode && `(${themeName} Broker Code)`}
              </p>
              {/* Virtual Keyboard for touch and visual support */}
              <VirtualKeyboard
                targetKeys={(() => {
                  const nextChar = targetPassword[typedPassword.length];
                  if (!nextChar) return [];
                  return nextChar === ' ' ? ['SPACE'] : [nextChar.toUpperCase()];
                })()}
                pressedKeys={new Set(
                  typedPassword.split('').map((char, i) =>
                    char === ' ' ? `SPACE-${i}` : `${char.toUpperCase()}-${i}`
                  )
                )}
                onKeyPress={(key) => {
                  const nextChar = targetPassword[typedPassword.length];
                  if (!nextChar) return;

                  const expectedKey = nextChar === ' ' ? 'SPACE' : nextChar.toUpperCase();
                  if (key === expectedKey) {
                    const newTyped = typedPassword + (key === 'SPACE' ? ' ' : key.toUpperCase());
                    audio.playKey();
                    haptics.lightTap();
                    setTypedPassword(newTyped);

                    if (newTyped === targetPassword) {
                      setHasKey(true);
                      setProgress(50);
                    }
                  }
                }}
                compact={isMobile}
                themeColor={themeColor}
              />
            </div>
          )}

          {!isTransitioning && currentGame?.mode === 'passwordVault' && hasKey && (
            <>
              <DraggableKey onDrop={handleKeyDrop} vaultPosition={vaultPosition} compact={isMobile} themeColor={themeColor} />
              {/* Trade Terminal - larger target area for mobile */}
              <motion.div
                ref={vaultRef}
                className="w-24 h-20 sm:w-28 sm:h-24 lg:w-32 lg:h-28 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center"
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  border: isMobile ? `3px dashed ${themeColor}` : `4px dashed ${themeColor}`,
                  boxShadow: `0 0 40px ${themeColor}50, inset 0 0 20px ${themeColor}20`,
                }}
                animate={{
                  y: [0, -6, 0],
                  scale: [1, 1.02, 1],
                }}
                transition={shouldSkipHeavyEffects ? {} : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <BarChart2 size={isMobile ? 28 : 40} style={{ color: themeColor }} className="mb-1" />
                <span style={{ color: `${themeColor}99` }} className="text-[10px] sm:text-xs">EXECUTE</span>
              </motion.div>
              <p style={{ color: `${themeColor}99` }} className="text-xs sm:text-sm mt-2 sm:mt-4">Drag the key to execute trade!</p>
            </>
          )}

          {!isTransitioning && currentGame?.mode === 'keyboardChallenge' && (
            <div className="flex flex-col items-center gap-2 sm:gap-3 lg:gap-4 w-full">
              {keyboardPhase === 'typing' && (
                <>
                  {/* Progress display */}
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                    {TRADE_KEYS.map((char, i) => (
                      <span
                        key={i}
                        className={`text-lg sm:text-xl lg:text-2xl font-mono`}
                        style={{
                          color: i < keyboardTargetIndex
                            ? themeColor
                            : i === keyboardTargetIndex
                              ? themeColor
                              : `${themeColor}50`,
                          animation: i === keyboardTargetIndex ? 'pulse 1s infinite' : undefined,
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                  <p style={{ color: themeColor }} className="text-xs sm:text-sm mb-1 sm:mb-2">
                    Type: <span className="font-bold">{TRADE_KEYS[keyboardTargetIndex]}</span>
                  </p>
                  {/* Mobile input field - triggers keyboard popup */}
                  <input
                    ref={keyboardInputRef}
                    type="text"
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    enterKeyHint="done"
                    className="w-full max-w-[240px] sm:max-w-[280px] px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-center text-base sm:text-lg font-mono focus:outline-none focus:ring-2 uppercase"
                    style={{
                      background: `${themeColor}15`,
                      border: `2px solid ${themeColor}50`,
                      caretColor: themeColor,
                      color: themeColor,
                    }}
                    placeholder="Tap here to type..."
                    value={TRADE_KEYS.slice(0, keyboardTargetIndex).join('')}
                    onClick={() => keyboardInputRef.current?.focus()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      const key = e.key.toUpperCase();
                      if (key === TRADE_KEYS[keyboardTargetIndex]) {
                        e.preventDefault();
                        handleKeyboardPress(key);
                      }
                    }}
                    onChange={(e) => {
                      // Handle mobile keyboard input
                      const input = e.target.value.toUpperCase();
                      const lastChar = input[input.length - 1];
                      if (lastChar === TRADE_KEYS[keyboardTargetIndex]) {
                        handleKeyboardPress(lastChar);
                      }
                    }}
                  />
                  {/* Also keep virtual keyboard for tap support */}
                  <VirtualKeyboard
                    targetKeys={[TRADE_KEYS[keyboardTargetIndex]]}
                    pressedKeys={pressedKeys}
                    onKeyPress={handleKeyboardPress}
                    compact={isMobile}
                    themeColor={themeColor}
                  />
                </>
              )}
              {keyboardPhase === 'tapping' && (
                <>
                  <p style={{ color: themeColor }} className="text-base sm:text-lg mb-1 sm:mb-2">
                    CONFIRM ORDER! {spaceTapCount}/10
                  </p>
                  <p style={{ color: `${themeColor}80` }} className="text-[10px] sm:text-xs">10 taps to confirm trade</p>
                  <VirtualKeyboard
                    targetKeys={['SPACE']}
                    pressedKeys={new Set()}
                    onKeyPress={handleKeyboardPress}
                    compact={isMobile}
                    themeColor={themeColor}
                  />
                </>
              )}
            </div>
          )}

          {!isTransitioning && currentGame?.mode === 'holdPrank' && (
            <motion.button
              className="w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full flex flex-col items-center justify-center cursor-pointer touch-manipulation"
              style={{
                background: prankComplete
                  ? `linear-gradient(135deg, ${themeColor}, ${themeColor})`
                  : `linear-gradient(135deg, ${themeColor}${Math.round((0.3 + holdProgress * 0.007) * 255).toString(16).padStart(2, '0')}, ${themeColor}${Math.round((0.3 + holdProgress * 0.007) * 255).toString(16).padStart(2, '0')})`,
                border: isMobile ? `3px solid ${themeColor}` : `4px solid ${themeColor}`,
                transform: 'translateZ(0)',
                willChange: 'transform',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={(e) => { e.preventDefault(); handleHoldStart(); }}
              onTouchEnd={(e) => { e.preventDefault(); handleHoldEnd(); }}
              animate={isHolding ? { scale: 0.95 } : { scale: 1 }}
            >
              <Target size={isMobile ? 32 : 48} style={{ color: prankComplete ? '#000' : themeColor }} className="mb-1 sm:mb-2" />
              <span style={{ color: prankComplete ? '#000' : themeColor }} className="font-bold text-sm sm:text-base">{Math.floor(holdProgress)}%</span>
              <span style={{ color: prankComplete ? '#000000aa' : `${themeColor}80` }} className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">{isMobile ? 'Hold for TP' : 'Hold for Profit'}</span>
            </motion.button>
          )}

          {/* Mobile games removed - now using unified desktop games for both platforms */}
        </div>

        {/* Success overlay */}
        <AnimatePresence>
          {isUnlocked && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-50 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
            >
              <motion.div
                className="flex flex-col items-center gap-4 sm:gap-6"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* Broker badge on success */}
                {isBrokerCode && (
                  <div 
                    className="px-4 py-2 rounded-full text-sm font-bold"
                    style={{ 
                      backgroundColor: `${themeColor}30`, 
                      color: themeColor,
                      border: `2px solid ${themeColor}`
                    }}
                  >
                    {themeName} BROKER ACTIVATED
                  </div>
                )}
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center"
                  style={{
                    border: isMobile ? `2px solid ${themeColor}` : `3px solid ${themeColor}`,
                    transform: 'translateZ(0)',
                  }}
                >
                  <TrendingUp size={isMobile ? 32 : 48} style={{ color: themeColor }} />
                </div>
                <h2 
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ 
                    color: themeColor,
                    textShadow: `0 0 4px ${themeColor}, 0 0 8px ${themeColor}, 0 0 12px ${themeColor}40`
                  }}
                >
                  TRADE EXECUTED
                </h2>
                <p style={{ color: `${themeColor}99` }} className="text-sm sm:text-base">Welcome to Bull Money Trading</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
