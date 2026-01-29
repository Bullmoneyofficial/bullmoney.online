"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
} from "framer-motion";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";
import {
  Lock,
  Unlock,
  Keyboard,
  Key,
  Target,
  Timer,
  FingerprintPattern,
  Hand,
  Zap,
  Star,
  Circle,
  Sparkles,
  Settings,
  Shield,
  Eye,
  Search,
  Loader2,
  Laugh,
  DollarSign,
  Type,
} from "lucide-react";

// ============================================================================
// NEON BLUE GLOW THEME - OLED BLACK BACKGROUND
// ============================================================================
const NEON_BLUE = "#3b82f6";
const NEON_CYAN = "#22d3ee";

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
    0%, 100% { box-shadow: 0 0 5px #3b82f6; }
    50% { box-shadow: 0 0 20px #3b82f6, 0 0 40px #22d3ee; }
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
      0 0 12px #3b82f6,
      0 0 20px #3b82f6;
  }

  .neon-glow {
    box-shadow: 
      0 0 10px #3b82f6,
      0 0 20px #3b82f6;
  }

  .prank-scanline::after {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
    animation: prank-scan 2s linear infinite;
  }
`;

// ============================================================================
// TYPES & CONFIG
// ============================================================================
type GameMode = 
  // Desktop Games
  | "passwordVault"   // Type "bull money" → draggable key → vault → white heaven
  | "keyboardChallenge" // Virtual keyboard BULLMONEY → tap space 10x in 2s → blue heaven
  | "holdPrank"       // Hold 2s → prank → unlock
  // Mobile Games
  | "mobileHold"      // Hold 3s → neon blue unlock
  | "typingPrank"     // Impossible typing challenge → laugh → unlock
  | "mobileTapFast";  // Tap 20x in 10s

interface LoaderProps {
  onFinished?: () => void;
}

interface GameConfig {
  mode: GameMode;
  label: string;
  instruction: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

// DESKTOP GAMES - 3 Only
const DESKTOP_GAMES: GameConfig[] = [
  {
    mode: "passwordVault",
    label: "PASSWORD VAULT",
    instruction: "Type 'bull money' to get the key",
    icon: Key,
  },
  {
    mode: "keyboardChallenge",
    label: "KEYBOARD MASTER",
    instruction: "Press the highlighted keys",
    icon: Keyboard,
  },
  {
    mode: "holdPrank",
    label: "HOLD TO UNLOCK",
    instruction: "Hold for 2 seconds",
    icon: Timer,
  },
];

// MOBILE GAMES - 3 Only  
const MOBILE_GAMES: GameConfig[] = [
  {
    mode: "mobileHold",
    label: "HOLD TO UNLOCK",
    instruction: "Hold for 3 seconds",
    icon: FingerprintPattern,
  },
  {
    mode: "typingPrank",
    label: "WIN $1,000",
    instruction: "Type the text in 10 seconds to win!",
    icon: DollarSign,
  },
  {
    mode: "mobileTapFast",
    label: "TAP FAST",
    instruction: "Tap 20 times in 10 seconds",
    icon: Zap,
  },
];

// PRANKS for desktop hold game - Clean dark theme with Lucide icons
const PRANKS: { type: string; message: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { type: "shake", message: "SYSTEM CALIBRATING...", icon: Settings },
  { type: "glitch", message: "DECRYPTING ACCESS...", icon: Shield },
  { type: "scan", message: "SCANNING BIOMETRICS...", icon: Eye },
  { type: "pulse", message: "VERIFYING IDENTITY...", icon: Search },
  { type: "fade", message: "ALMOST THERE...", icon: Loader2 },
];

// Detect device type
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);
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
// VIRTUAL KEYBOARD COMPONENT
// ============================================================================
const VirtualKeyboard = ({ 
  targetKeys, 
  pressedKeys, 
  onKeyPress 
}: { 
  targetKeys: string[]; 
  pressedKeys: Set<string>;
  onKeyPress: (key: string) => void;
}) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    ['SPACE'],
  ];

  return (
    <div className="flex flex-col items-center gap-1.5">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-1">
          {row.map((key) => {
            const isTarget = targetKeys.includes(key);
            const isPressed = pressedKeys.has(key);
            const isSpace = key === 'SPACE';
            
            return (
              <motion.button
                key={key}
                onClick={() => onKeyPress(key)}
                className={`
                  ${isSpace ? 'w-40' : 'w-9'} h-9 rounded-lg font-bold text-sm
                  flex items-center justify-center
                  transition-all duration-150
                  ${isPressed 
                    ? 'bg-green-500 text-white border-green-400' 
                    : isTarget 
                      ? 'bg-blue-500/30 text-white border-blue-400 animate-pulse' 
                      : 'bg-black/50 text-blue-300/50 border-blue-500/20'
                  }
                  border-2
                `}
                style={{
                  boxShadow: isTarget && !isPressed 
                    ? '0 0 15px #3b82f6, 0 0 30px #3b82f6' 
                    : isPressed 
                      ? '0 0 15px #22c55e' 
                      : 'none',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {isSpace ? '⎵ SPACE' : key}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// DRAGGABLE KEY COMPONENT
// ============================================================================
const DraggableKey = ({ 
  onDrop, 
  vaultPosition 
}: { 
  onDrop: () => void;
  vaultPosition: { x: number; y: number };
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const keyRef = useRef<HTMLDivElement>(null);

  const handleDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setPosition({ x: clientX - 40, y: clientY - 40 });

    // Check if near vault
    const distance = Math.sqrt(
      Math.pow(clientX - vaultPosition.x, 2) + 
      Math.pow(clientY - vaultPosition.y, 2)
    );
    
    if (distance < 80) {
      onDrop();
    }
  }, [isDragging, vaultPosition, onDrop]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setPosition({ x: clientX - 40, y: clientY - 40 });
      
      const distance = Math.sqrt(
        Math.pow(clientX - vaultPosition.x, 2) + 
        Math.pow(clientY - vaultPosition.y, 2)
      );
      if (distance < 80) onDrop();
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, vaultPosition, onDrop]);

  return (
    <motion.div
      ref={keyRef}
      className="fixed w-20 h-20 rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing z-50"
      style={{
        left: position.x || '50%',
        top: position.y || 200,
        transform: position.x === 0 ? 'translateX(-50%) translateZ(0)' : 'translateZ(0)',
        background: 'linear-gradient(135deg, #3b82f6, #22d3ee)',
        animation: !isDragging ? 'key-float 2s ease-in-out infinite' : undefined,
        willChange: 'transform',
      }}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Key size={40} className="text-white" />
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

  // Mobile game states
  const [mobileHoldProgress, setMobileHoldProgress] = useState(0);
  const [mobileTapCount, setMobileTapCount] = useState(0);
  const [mobileTapStartTime, setMobileTapStartTime] = useState(0);
  const [mobileTapTimeLeft, setMobileTapTimeLeft] = useState(10);
  
  // Typing prank states
  const [typingPrankText, setTypingPrankText] = useState("");
  const [typingPrankTimer, setTypingPrankTimer] = useState(10);
  const [typingPrankStarted, setTypingPrankStarted] = useState(false);
  const [typingPrankFailed, setTypingPrankFailed] = useState(false);
  const [showLaughScreen, setShowLaughScreen] = useState(false);
  const typingPrankTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // The impossible paragraph to type
  const IMPOSSIBLE_TEXT = "The quick brown fox jumps over the lazy dog while simultaneously calculating quantum physics equations and reciting the complete works of Shakespeare backwards in ancient Greek.";

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const vaultRef = useRef<HTMLDivElement>(null);
  const progressSpring = useSpring(0, { stiffness: 100, damping: 20 });

  // Keyboard target sequence
  const BULLMONEY_KEYS = ['B', 'U', 'L', 'L', 'M', 'O', 'N', 'E', 'Y'];

  // Determine games based on device
  const games = useMemo(() => isMobile ? MOBILE_GAMES : DESKTOP_GAMES, [isMobile]);
  const currentGame = games[currentGameIndex];

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

  // Update vault position
  useEffect(() => {
    if (vaultRef.current) {
      const rect = vaultRef.current.getBoundingClientRect();
      setVaultPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
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
        // Reset all game states
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
        setMobileHoldProgress(0);
        setMobileTapCount(0);
        setMobileTapStartTime(0);
        setMobileTapTimeLeft(10);
        setTypingPrankText("");
        setTypingPrankTimer(10);
        setTypingPrankStarted(false);
        setTypingPrankFailed(false);
        setShowLaughScreen(false);
        
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

  // Password Vault - Type "bull money"
  const handlePasswordType = useCallback((e: React.KeyboardEvent) => {
    if (!currentGame || currentGame.mode !== 'passwordVault' || hasKey) return;
    
    const key = e.key.toLowerCase();
    const targetPassword = "bull money";
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
  }, [currentGame, typedPassword, hasKey, audio, haptics]);

  // Key dropped in vault
  const handleKeyDrop = useCallback(() => {
    if (!currentGame || currentGame.mode !== 'passwordVault' || isTransitioning || progress >= 100) return;
    setProgress(100);
  }, [currentGame, isTransitioning, progress]);

  // Keyboard Challenge
  const handleKeyboardPress = useCallback((key: string) => {
    if (!currentGame || currentGame.mode !== 'keyboardChallenge') return;
    
    if (keyboardPhase === 'typing') {
      const targetKey = BULLMONEY_KEYS[keyboardTargetIndex];
      if (key === targetKey) {
        audio.playKey();
        haptics.lightTap();
        setPressedKeys(prev => new Set([...prev, `${key}-${keyboardTargetIndex}`]));
        
        if (keyboardTargetIndex >= BULLMONEY_KEYS.length - 1) {
          setKeyboardPhase('tapping');
          setProgress(50);
        } else {
          setKeyboardTargetIndex(prev => prev + 1);
          setProgress((keyboardTargetIndex + 1) / BULLMONEY_KEYS.length * 50);
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

  // Physical keyboard listener for password vault - IMMEDIATE typing support
  useEffect(() => {
    if (!currentGame || currentGame.mode !== 'passwordVault' || hasKey || isTransitioning) return;
    
    const targetPassword = "bull money";
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with dragging
      if (hasKey) return;
      
      const key = e.key.toLowerCase();
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
  }, [currentGame, typedPassword, hasKey, audio, haptics, isTransitioning]);

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

  // ============================================================================
  // MOBILE GAME HANDLERS
  // ============================================================================

  // Mobile Hold (3 seconds)
  const handleMobileHoldStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentGame || currentGame.mode !== 'mobileHold') return;
    
    setIsHolding(true);
    haptics.heavyTap();
    
    holdIntervalRef.current = setInterval(() => {
      setMobileHoldProgress(p => {
        const next = Math.min(p + (100 / 30), 100); // 3 seconds
        if (Math.floor(next / 20) > Math.floor(p / 20)) audio.playTick();
        setProgress(next);
        return next;
      });
    }, 100);
  }, [currentGame, audio, haptics]);

  const handleMobileHoldEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsHolding(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (mobileHoldProgress < 100) {
      setMobileHoldProgress(0);
      setProgress(0);
    }
  }, [mobileHoldProgress]);

  // Mobile Tap Fast
  const handleMobileTap = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentGame || currentGame.mode !== 'mobileTapFast') return;
    
    const now = Date.now();
    
    if (mobileTapCount === 0 || now - mobileTapStartTime > 10000) {
      setMobileTapStartTime(now);
      setMobileTapCount(1);
      setMobileTapTimeLeft(10);
      audio.playTick();
      haptics.lightTap();
      setProgress(5);
    } else {
      const newCount = mobileTapCount + 1;
      setMobileTapCount(newCount);
      audio.playTick();
      haptics.lightTap();
      
      setProgress((newCount / 20) * 100);
    }
  }, [currentGame, mobileTapCount, mobileTapStartTime, audio, haptics]);

  // Mobile tap timer countdown
  useEffect(() => {
    if (!currentGame || currentGame.mode !== 'mobileTapFast' || mobileTapStartTime === 0) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - mobileTapStartTime) / 1000);
      const remaining = Math.max(0, 10 - elapsed);
      setMobileTapTimeLeft(remaining);
      
      if (remaining === 0 && mobileTapCount < 20) {
        // Time's up, reset
        setMobileTapCount(0);
        setMobileTapStartTime(0);
        setProgress(0);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentGame, mobileTapStartTime, mobileTapCount]);

  // Typing Prank - Start typing to begin timer
  const handleTypingPrankStart = useCallback(() => {
    if (!currentGame || currentGame.mode !== 'typingPrank' || typingPrankStarted) return;
    
    setTypingPrankStarted(true);
    audio.playTick();
    
    // Start the countdown
    typingPrankTimerRef.current = setInterval(() => {
      setTypingPrankTimer(prev => {
        if (prev <= 1) {
          // Time's up! Show laugh screen
          if (typingPrankTimerRef.current) {
            clearInterval(typingPrankTimerRef.current);
            typingPrankTimerRef.current = null;
          }
          setTypingPrankFailed(true);
          setShowLaughScreen(true);
          haptics.heavyTap();
          
          // After laughing, let them through
          setTimeout(() => {
            setShowLaughScreen(false);
            setProgress(100);
          }, 4000);
          
          return 0;
        }
        if (prev <= 3) audio.playTick();
        return prev - 1;
      });
    }, 1000);
  }, [currentGame, typingPrankStarted, audio, haptics]);

  const handleTypingPrankChange = useCallback((text: string) => {
    if (!currentGame || currentGame.mode !== 'typingPrank') return;
    
    // Start timer on first keystroke
    if (!typingPrankStarted) {
      handleTypingPrankStart();
    }
    
    setTypingPrankText(text);
    
    // Calculate progress (they'll never finish in time!)
    const progressPercent = Math.min((text.length / IMPOSSIBLE_TEXT.length) * 100, 99);
    setProgress(progressPercent);
    
    // Check if they somehow typed it all (impossible but just in case)
    if (text.toLowerCase() === IMPOSSIBLE_TEXT.toLowerCase()) {
      if (typingPrankTimerRef.current) {
        clearInterval(typingPrankTimerRef.current);
        typingPrankTimerRef.current = null;
      }
      setProgress(100);
    }
  }, [currentGame, typingPrankStarted, handleTypingPrankStart, IMPOSSIBLE_TEXT]);

  // Cleanup typing prank timer
  useEffect(() => {
    return () => {
      if (typingPrankTimerRef.current) {
        clearInterval(typingPrankTimerRef.current);
      }
    };
  }, []);

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
            className="absolute inset-0 z-30 flex items-center justify-center"
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
                  background: 'linear-gradient(0deg, transparent 0%, rgba(59,130,246,0.03) 50%, transparent 100%)',
                }}
              />
            )}
            
            {/* Shake wrapper */}
            <motion.div
              className="flex flex-col items-center gap-6"
              animate={prankActive.type === 'shake' ? { x: [-8, 8, -6, 6, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.5, repeat: prankActive.type === 'shake' ? Infinity : 0 }}
            >
              {/* Prank icon */}
              <motion.div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(34,211,238,0.1))',
                  border: '2px solid rgba(59, 130, 246, 0.5)',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
                }}
                animate={prankActive.type === 'pulse' ? { scale: [1, 1.05, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <prankActive.icon size={40} className="text-blue-400" />
              </motion.div>
              
              {/* Message */}
              <div className="text-center">
                <motion.p 
                  className="text-2xl font-bold text-white mb-2"
                  animate={prankActive.type === 'fade' ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {prankActive.message}
                </motion.p>
                
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-blue-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                
                <p className="text-sm text-blue-400/50 mt-4">Please wait...</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Game indicator */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {games.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < currentGameIndex 
                  ? 'bg-green-500' 
                  : i === currentGameIndex 
                    ? 'bg-blue-500 scale-125' 
                    : 'bg-blue-500/30'
              }`}
            />
          ))}
        </div>

        {/* Main content area */}
        <div className="flex flex-col items-center gap-8 z-10">
          {/* Transition loading state */}
          {isTransitioning && (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-blue-500"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <p className="text-blue-400 text-sm">Loading next challenge...</p>
            </motion.div>
          )}
          
          {/* Game icon */}
          {!isTransitioning && currentGame && (
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(34,211,238,0.3))',
                border: '3px solid #3b82f6',
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
              animate={isHolding ? { scale: 0.95 } : { scale: 1 }}
            >
              <currentGame.icon size={48} className="text-blue-400" />
            </motion.div>
          )}

          {/* Game label */}
          {!isTransitioning && currentGame && (
            <div className="text-center">
              <h2 className="text-2xl font-bold neon-text mb-2">{currentGame.label}</h2>
              <p className="text-blue-400/70 text-sm">{currentGame.instruction}</p>
            </div>
          )}

          {/* Progress bar */}
          {!isTransitioning && (
            <div className="w-64 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(59,130,246,0.2)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  background: 'linear-gradient(90deg, #3b82f6, #22d3ee)',
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}

          {/* Game-specific UI */}
          {!isTransitioning && currentGame?.mode === 'passwordVault' && !hasKey && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-4">
                {"bull money".split('').map((char, i) => (
                  <span 
                    key={i} 
                    className={`text-2xl font-mono ${
                      i < typedPassword.length 
                        ? 'text-green-400' 
                        : 'text-blue-400/30'
                    }`}
                  >
                    {char === ' ' ? '␣' : char.toUpperCase()}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-400/50">Type the password on your keyboard</p>
            </div>
          )}

          {!isTransitioning && currentGame?.mode === 'passwordVault' && hasKey && (
            <>
              <DraggableKey onDrop={handleKeyDrop} vaultPosition={vaultPosition} />
              <motion.div
                ref={vaultRef}
                className="w-24 h-20 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '3px dashed #3b82f6',
                }}
                animate={{ y: [0, -5, 0] }}
                transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity }}
              >
                <Lock size={32} className="text-blue-400" />
              </motion.div>
              <p className="text-xs text-blue-400/50">Drag the key to the vault!</p>
            </>
          )}

          {!isTransitioning && currentGame?.mode === 'keyboardChallenge' && (
            <div className="flex flex-col items-center gap-4">
              {keyboardPhase === 'typing' && (
                <>
                  <p className="text-sm text-blue-400 mb-2">
                    Press: <span className="font-bold">{BULLMONEY_KEYS[keyboardTargetIndex]}</span>
                  </p>
                  <VirtualKeyboard
                    targetKeys={[BULLMONEY_KEYS[keyboardTargetIndex]]}
                    pressedKeys={pressedKeys}
                    onKeyPress={handleKeyboardPress}
                  />
                </>
              )}
              {keyboardPhase === 'tapping' && (
                <>
                  <p className="text-lg text-blue-400 mb-2">
                    TAP SPACE! {spaceTapCount}/10
                  </p>
                  <p className="text-xs text-blue-400/50">10 taps in 2 seconds</p>
                  <VirtualKeyboard
                    targetKeys={['SPACE']}
                    pressedKeys={new Set()}
                    onKeyPress={handleKeyboardPress}
                  />
                </>
              )}
            </div>
          )}

          {!isTransitioning && currentGame?.mode === 'holdPrank' && (
            <motion.button
              className="w-40 h-40 rounded-full flex flex-col items-center justify-center cursor-pointer"
              style={{
                background: prankComplete 
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                  : `linear-gradient(135deg, rgba(59,130,246,${0.3 + holdProgress * 0.007}), rgba(34,211,238,${0.3 + holdProgress * 0.007}))`,
                border: '4px solid #3b82f6',
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              animate={isHolding ? { scale: 0.95 } : { scale: 1 }}
            >
              <FingerprintPattern size={48} className="text-white mb-2" />
              <span className="text-white font-bold">{Math.floor(holdProgress)}%</span>
              <span className="text-xs text-blue-400/50 mt-1">Click & Hold</span>
            </motion.button>
          )}

          {/* MOBILE GAMES */}
          {!isTransitioning && currentGame?.mode === 'mobileHold' && (
            <motion.button
              className="w-48 h-48 rounded-full flex flex-col items-center justify-center touch-manipulation"
              style={{
                background: `linear-gradient(135deg, rgba(59,130,246,${0.3 + mobileHoldProgress * 0.007}), rgba(34,211,238,${0.3 + mobileHoldProgress * 0.007}))`,
                border: '4px solid #3b82f6',
                transform: 'translateZ(0)',
                willChange: 'transform',
                WebkitTapHighlightColor: 'transparent',
              }}
              onTouchStart={handleMobileHoldStart}
              onTouchEnd={handleMobileHoldEnd}
              animate={isHolding ? { scale: 0.95 } : { scale: 1 }}
            >
              <FingerprintPattern size={56} className="text-white mb-2" />
              <span className="text-white font-bold text-2xl">{Math.floor(mobileHoldProgress)}%</span>
              <span className="text-sm text-blue-400/50 mt-1">Touch & Hold</span>
            </motion.button>
          )}

          {!isTransitioning && currentGame?.mode === 'mobileTapFast' && (
            <motion.button
              className="w-48 h-48 rounded-full flex flex-col items-center justify-center touch-manipulation"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(34,211,238,0.3))',
                border: '4px solid #3b82f6',
                transform: 'translateZ(0)',
                willChange: 'transform',
                WebkitTapHighlightColor: 'transparent',
              }}
              onTouchStart={handleMobileTap}
              whileTap={{ scale: 0.9 }}
            >
              <Zap size={56} className="text-white mb-2" />
              <span className="text-white font-bold text-2xl">{mobileTapCount}/20</span>
              {mobileTapStartTime > 0 && (
                <span className="text-blue-400 text-sm">
                  {mobileTapTimeLeft}s left
                </span>
              )}
              <span className="text-sm text-blue-400/50 mt-1">Tap Fast!</span>
            </motion.button>
          )}

          {/* TYPING PRANK GAME */}
          {!isTransitioning && currentGame?.mode === 'typingPrank' && !showLaughScreen && (
            <div className="flex flex-col items-center gap-4 w-full max-w-md px-4">
              {/* Prize announcement */}
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))',
                  border: '2px solid #22c55e',
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <DollarSign size={24} className="text-green-400" />
                <span className="text-green-400 font-bold text-lg">WIN $1,000!</span>
              </motion.div>

              {/* Timer */}
              <motion.div
                className="text-5xl font-bold"
                style={{ color: typingPrankTimer <= 3 ? '#ef4444' : '#3b82f6' }}
                animate={typingPrankTimer <= 3 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: typingPrankTimer <= 3 ? Infinity : 0 }}
              >
                {typingPrankTimer}s
              </motion.div>

              {/* Text to type */}
              <div 
                className="p-4 rounded-xl w-full"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <p className="text-sm text-blue-400/70 mb-2">Type this exactly:</p>
                <p className="text-white text-sm leading-relaxed">
                  {IMPOSSIBLE_TEXT.split('').map((char, i) => (
                    <span
                      key={i}
                      className={
                        i < typingPrankText.length
                          ? typingPrankText[i]?.toLowerCase() === char.toLowerCase()
                            ? 'text-green-400'
                            : 'text-red-400'
                          : 'text-white/50'
                      }
                    >
                      {char}
                    </span>
                  ))}
                </p>
              </div>

              {/* Input field */}
              <textarea
                className="w-full p-3 rounded-xl text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
                placeholder="Start typing to begin..."
                value={typingPrankText}
                onChange={(e) => handleTypingPrankChange(e.target.value)}
                rows={3}
                autoFocus
              />

              <p className="text-xs text-blue-400/50">
                {typingPrankText.length}/{IMPOSSIBLE_TEXT.length} characters
              </p>
            </div>
          )}

          {/* LAUGH SCREEN - You failed! */}
          {!isTransitioning && showLaughScreen && (
            <motion.div
              className="flex flex-col items-center gap-6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {/* Laughing icons */}
              <div className="flex items-center gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      rotate: [0, -10, 10, -10, 10, 0],
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 0.5, 
                      repeat: Infinity, 
                      delay: i * 0.1,
                    }}
                    style={{
                      transform: 'translateZ(0)',
                      willChange: 'transform',
                    }}
                  >
                    <Laugh 
                      size={i === 2 ? 64 : 40} 
                      className="text-blue-400" 
                    />
                  </motion.div>
                ))}
              </div>

              {/* Message */}
              <motion.div
                className="text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold text-white mb-2">Nice try!</h2>
                <p className="text-blue-400 text-lg mb-1">Nobody can type that fast</p>
                <p className="text-blue-400/50 text-sm">You got {typingPrankText.length} characters</p>
              </motion.div>

              {/* Fake prize crossed out */}
              <motion.div
                className="relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full opacity-50">
                  <DollarSign size={20} className="text-red-400" />
                  <span className="text-red-400 font-bold line-through">$1,000</span>
                </div>
              </motion.div>

              {/* Continue message */}
              <motion.p
                className="text-blue-400/70 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
              >
                Unlocking anyway...
              </motion.p>
            </motion.div>
          )}
        </div>

        {/* Success overlay */}
        <AnimatePresence>
          {isUnlocked && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
            >
              <motion.div
                className="flex flex-col items-center gap-6"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    border: '3px solid #3b82f6',
                    transform: 'translateZ(0)',
                  }}
                >
                  <Unlock size={48} className="text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold neon-text">UNLOCKED</h2>
                <p className="text-blue-400/70">Welcome to Bull Money</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
