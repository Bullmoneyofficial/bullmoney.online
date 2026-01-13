"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MorphPhase = "idle" | "morphing-out" | "moving" | "morphing-in" | "fleeing" | "returning";
export type MovementStyle = "float" | "zigzag" | "bounce" | "spiral" | "dash" | "tired" | "sleepy";
export type GameState = "playing" | "paused" | "caught" | "escaped";

// Local storage keys
const STORAGE_KEYS = {
  HIGH_SCORE: "wanderGame_highScore",
  TOTAL_CATCHES: "wanderGame_totalCatches",
  LONGEST_FLEE: "wanderGame_longestFlee",
  GAMES_PLAYED: "wanderGame_gamesPlayed",
} as const;

interface WanderingGameOptions {
  isMobile: boolean;
}

interface GameStats {
  highScore: number;
  totalCatches: number;
  longestFlee: number;
  gamesPlayed: number;
  currentScore: number;
  currentEnergy: number;
  currentStreak: number;
}

// Load stats from localStorage
function loadStats(): GameStats {
  if (typeof window === "undefined") {
    return {
      highScore: 0,
      totalCatches: 0,
      longestFlee: 0,
      gamesPlayed: 0,
      currentScore: 0,
      currentEnergy: 100,
      currentStreak: 0,
    };
  }
  
  return {
    highScore: parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || "0", 10),
    totalCatches: parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_CATCHES) || "0", 10),
    longestFlee: parseInt(localStorage.getItem(STORAGE_KEYS.LONGEST_FLEE) || "0", 10),
    gamesPlayed: parseInt(localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || "0", 10),
    currentScore: 0,
    currentEnergy: 100,
    currentStreak: 0,
  };
}

// Save stats to localStorage
function saveStats(stats: Partial<GameStats>) {
  if (typeof window === "undefined") return;
  
  if (stats.highScore !== undefined) {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, stats.highScore.toString());
  }
  if (stats.totalCatches !== undefined) {
    localStorage.setItem(STORAGE_KEYS.TOTAL_CATCHES, stats.totalCatches.toString());
  }
  if (stats.longestFlee !== undefined) {
    localStorage.setItem(STORAGE_KEYS.LONGEST_FLEE, stats.longestFlee.toString());
  }
  if (stats.gamesPlayed !== undefined) {
    localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, stats.gamesPlayed.toString());
  }
}

export function useWanderingGame({ isMobile }: WanderingGameOptions) {
  const miniPlayerRef = useRef<HTMLDivElement>(null);
  const wanderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fleeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const returnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const energyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const fleeStartTimeRef = useRef<number>(0);

  const [isWandering, setIsWandering] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [wanderPosition, setWanderPosition] = useState({ x: 0, y: 0 });
  const [morphPhase, setMorphPhase] = useState<MorphPhase>("idle");
  const [isHovering, setIsHovering] = useState(false);
  const [isNearPlayer, setIsNearPlayer] = useState(false);
  const [isFleeing, setIsFleeing] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [fleeDirection, setFleeDirection] = useState({ x: 1, y: -1 });
  const [movementStyle, setMovementStyle] = useState<MovementStyle>("float");
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [gameStats, setGameStats] = useState<GameStats>(loadStats);
  
  // Energy system - decreases over time, affects speed
  const [energy, setEnergy] = useState(100);
  const [combo, setCombo] = useState(0);
  const [lastFleeTime, setLastFleeTime] = useState(0);
  
  // Mobile touch tracking
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTouching, setIsTouching] = useState(false);

  // Load stats on mount
  useEffect(() => {
    setGameStats(loadStats());
  }, []);

  // Score tracking - increments while wandering
  useEffect(() => {
    if (!isWandering || hasInteracted || gameState !== "playing") {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
        scoreIntervalRef.current = null;
      }
      return;
    }

    gameStartTimeRef.current = Date.now();

    scoreIntervalRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      const energyBonus = Math.max(0.5, energy / 100);
      const comboBonus = 1 + (combo * 0.1);
      const score = Math.floor(elapsedSeconds * energyBonus * comboBonus);
      
      setGameStats(prev => ({
        ...prev,
        currentScore: score,
      }));
    }, 100);

    return () => {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
      }
    };
  }, [isWandering, hasInteracted, gameState, energy, combo]);

  // Energy depletion system - the longer it wanders, the more tired it gets
  useEffect(() => {
    if (!isWandering || hasInteracted) {
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
        energyIntervalRef.current = null;
      }
      return;
    }

    // Energy depletes faster on mobile (shorter games)
    const depletionRate = isMobile ? 2 : 1;
    
    energyIntervalRef.current = setInterval(() => {
      setEnergy(prev => {
        const newEnergy = Math.max(5, prev - depletionRate);
        
        // Update movement style based on energy
        if (newEnergy <= 15) {
          setMovementStyle("sleepy");
          setSpeedMultiplier(0.3);
        } else if (newEnergy <= 35) {
          setMovementStyle("tired");
          setSpeedMultiplier(0.5);
        }
        
        return newEnergy;
      });
    }, 1000);

    return () => {
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
      }
    };
  }, [isWandering, hasInteracted, isMobile]);

  // Flee and return mechanic - runs away when near, comes back after 1-3 seconds
  const triggerFlee = useCallback(() => {
    if (isFleeing || isReturning || !isWandering) return;

    fleeStartTimeRef.current = Date.now();
    setIsFleeing(true);
    setMorphPhase("fleeing");
    setCombo(prev => prev + 1);
    
    // Quick flee animation
    const fleeDistance = isMobile ? 150 : 250;
    setWanderPosition(prev => ({
      x: Math.max(0, Math.min(window.innerWidth - 300, prev.x + fleeDistance * fleeDirection.x)),
      y: Math.max(-window.innerHeight + 200, Math.min(0, prev.y - 80)),
    }));

    // Clear any existing timeouts
    if (fleeTimeoutRef.current) clearTimeout(fleeTimeoutRef.current);
    if (returnTimeoutRef.current) clearTimeout(returnTimeoutRef.current);

    // Flee duration (random 1-3 seconds)
    const fleeDuration = 1000 + Math.random() * 2000;
    
    fleeTimeoutRef.current = setTimeout(() => {
      setIsFleeing(false);
      setIsReturning(true);
      setMorphPhase("returning");
      
      // Update longest flee time
      const fleeTime = Date.now() - fleeStartTimeRef.current;
      if (fleeTime > lastFleeTime) {
        setLastFleeTime(fleeTime);
      }

      // Return to a position near mouse/touch
      const returnPosition = {
        x: touchPosition?.x ?? 100,
        y: touchPosition?.y ?? -80,
      };

      // Animate return
      setWanderPosition({
        x: Math.max(0, Math.min(returnPosition.x + 50, window.innerWidth - 300)),
        y: Math.max(-window.innerHeight + 200, Math.min(returnPosition.y - 50, 0)),
      });

      returnTimeoutRef.current = setTimeout(() => {
        setIsReturning(false);
        setMorphPhase("idle");
        
        // Regain some energy when returning
        setEnergy(prev => Math.min(100, prev + 10));
      }, 500);
    }, fleeDuration);
  }, [isFleeing, isReturning, isWandering, fleeDirection, isMobile, touchPosition, lastFleeTime]);

  // Track mouse proximity for desktop flee behavior
  useEffect(() => {
    if (isMobile || !isWandering || isFleeing || isReturning) return;

    const handleMouseMove = (e: MouseEvent) => {
      const player = miniPlayerRef.current;
      if (!player) return;

      const rect = player.getBoundingClientRect();
      const playerCenterX = rect.left + rect.width / 2;
      const playerCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - playerCenterX;
      const dy = e.clientY - playerCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const nearPadding = energy > 50 ? 100 : energy > 25 ? 150 : 200; // Easier to catch when tired
      const chasePadding = 250;

      const near = distance < nearPadding;
      const chasing = distance < chasePadding && distance >= nearPadding;

      setIsNearPlayer(near);

      if (near && !isFleeing && energy > 20) {
        // Trigger flee when cursor gets too close
        const fleeX = dx > 0 ? -1 : 1;
        const fleeY = dy > 0 ? -1 : 1;
        setFleeDirection({ x: fleeX, y: fleeY });
        triggerFlee();
      } else if (chasing && !near) {
        const fleeX = dx > 0 ? -1 : 1;
        const fleeY = dy > 0 ? -1 : 1;
        setFleeDirection({ x: fleeX, y: fleeY });
        
        // Speed up based on proximity and energy
        const proximityFactor = 1 - (distance / chasePadding);
        const energyFactor = energy / 100;
        setSpeedMultiplier(1 + proximityFactor * energyFactor);
      } else if (!near) {
        // Reset speed based on energy
        const baseSpeed = energy > 50 ? 1 : energy > 25 ? 0.6 : 0.4;
        setSpeedMultiplier(baseSpeed);
      }

      // Store position for return behavior
      setTouchPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile, isWandering, isFleeing, isReturning, energy, triggerFlee]);

  // Mobile touch tracking
  useEffect(() => {
    if (!isMobile || !isWandering || isFleeing || isReturning) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      setIsTouching(true);
      setTouchPosition({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      setTouchPosition({ x: touch.clientX, y: touch.clientY });

      const player = miniPlayerRef.current;
      if (!player) return;

      const rect = player.getBoundingClientRect();
      const playerCenterX = rect.left + rect.width / 2;
      const playerCenterY = rect.top + rect.height / 2;

      const dx = touch.clientX - playerCenterX;
      const dy = touch.clientY - playerCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const nearPadding = energy > 50 ? 80 : energy > 25 ? 120 : 160;
      const near = distance < nearPadding;

      setIsNearPlayer(near);

      if (near && !isFleeing && energy > 15) {
        const fleeX = dx > 0 ? -1 : 1;
        const fleeY = dy > 0 ? -1 : 1;
        setFleeDirection({ x: fleeX, y: fleeY });
        triggerFlee();
      }
    };

    const handleTouchEnd = () => {
      setIsTouching(false);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, isWandering, isFleeing, isReturning, energy, triggerFlee]);

  // Main wandering animation - game mode with energy system
  useEffect(() => {
    if (!isWandering || hasInteracted || isFleeing || isReturning) {
      if (wanderIntervalRef.current) {
        clearInterval(wanderIntervalRef.current);
        wanderIntervalRef.current = null;
      }
      if (!isWandering) {
        setWanderPosition({ x: 0, y: 0 });
        setMorphPhase("idle");
        setMovementStyle("float");
        setEnergy(100);
        setCombo(0);
      }
      return;
    }

    const shouldPause = isHovering || (!isMobile && isNearPlayer);

    if (shouldPause) {
      if (wanderIntervalRef.current) {
        clearInterval(wanderIntervalRef.current);
        wanderIntervalRef.current = null;
      }
      setMorphPhase("idle");
      return;
    }

    const movementPatterns: Record<MovementStyle, () => { x: number; y: number }> = {
      float: () => {
        const maxX = isMobile ? 100 : 200;
        const maxY = isMobile ? 60 : 150;
        return {
          x: 60 + Math.random() * maxX * fleeDirection.x,
          y: -(40 + Math.random() * maxY) * (fleeDirection.y > 0 ? 1 : 0.5),
        };
      },
      zigzag: () => {
        const step = 80 + Math.random() * 60;
        const prevX = wanderPosition.x || 100;
        return {
          x: prevX + (Math.random() > 0.5 ? step : -step) * fleeDirection.x,
          y: wanderPosition.y + (Math.random() > 0.5 ? -40 : 40),
        };
      },
      bounce: () => {
        const bounceHeight = 100 + Math.random() * 80;
        return {
          x: 80 + Math.random() * 180 * fleeDirection.x,
          y: -bounceHeight,
        };
      },
      spiral: () => {
        const angle = Date.now() / 500;
        const radius = 80 + Math.random() * 100;
        return {
          x: 120 + Math.cos(angle) * radius,
          y: -80 + Math.sin(angle) * radius * 0.6,
        };
      },
      dash: () => ({
        x: (150 + Math.random() * 100) * fleeDirection.x,
        y: -(60 + Math.random() * 100) * (fleeDirection.y > 0 ? 1 : 0.3),
      }),
      tired: () => ({
        // Slow, small movements when tired
        x: wanderPosition.x + (Math.random() - 0.5) * 40,
        y: wanderPosition.y + (Math.random() - 0.5) * 20,
      }),
      sleepy: () => ({
        // Barely moving, slight wobble
        x: wanderPosition.x + (Math.random() - 0.5) * 15,
        y: wanderPosition.y + (Math.random() - 0.5) * 10,
      }),
    };

    const getRandomPosition = () => {
      const pos = movementPatterns[movementStyle]();
      const clampedX = Math.max(0, Math.min(pos.x, window.innerWidth - 300));
      const clampedY = Math.max(-window.innerHeight + 300, Math.min(pos.y, 0));
      return { x: clampedX, y: clampedY };
    };

    const pickRandomStyle = (): MovementStyle => {
      // Style selection based on energy
      if (energy <= 15) return "sleepy";
      if (energy <= 35) return "tired";
      
      const styles: MovementStyle[] = ["float", "zigzag", "bounce", "spiral", "dash"];
      if (speedMultiplier > 1.2) {
        return Math.random() > 0.4 ? "dash" : styles[Math.floor(Math.random() * styles.length)];
      }
      return styles[Math.floor(Math.random() * styles.length)];
    };

    const runGenieSequence = () => {
      if (isHovering || isNearPlayer || isFleeing || isReturning) return;

      if (Math.random() > 0.6) {
        setMovementStyle(pickRandomStyle());
      }

      setMorphPhase("morphing-out");

      const energyFactor = Math.max(0.3, energy / 100);
      const morphOutTime = Math.max(200, 400 / (speedMultiplier * energyFactor));
      
      setTimeout(() => {
        if (isHovering || isNearPlayer || isFleeing || isReturning) return;
        setMorphPhase("moving");
        setWanderPosition(getRandomPosition());

        const moveTime = Math.max(300, 700 / (speedMultiplier * energyFactor));
        setTimeout(() => {
          if (isHovering || isNearPlayer || isFleeing || isReturning) return;
          setMorphPhase("morphing-in");

          const morphInTime = Math.max(200, 500 / (speedMultiplier * energyFactor));
          setTimeout(() => {
            if (isHovering || isNearPlayer || isFleeing || isReturning) return;
            setMorphPhase("idle");
          }, morphInTime);
        }, moveTime);
      }, morphOutTime);
    };

    runGenieSequence();

    // Interval based on energy - tired = slower intervals
    const baseInterval = isMobile ? 2500 : 2800;
    const energyFactor = Math.max(0.3, energy / 100);
    const intervalTime = Math.max(800, baseInterval / (speedMultiplier * energyFactor));
    
    wanderIntervalRef.current = setInterval(() => {
      if (!isHovering && !isNearPlayer && !isFleeing && !isReturning) {
        runGenieSequence();
      }
    }, intervalTime);

    // Auto-stop when energy is critically low
    const autoStopTime = energy <= 15 ? 3000 : (isMobile ? 8000 : 25000);
    const autoStopTimer = setTimeout(() => {
      if (isHovering || isNearPlayer) return;
      
      setMovementStyle("sleepy");
      setMorphPhase("morphing-out");
      
      setTimeout(() => {
        setWanderPosition({ x: 0, y: 0 });
        setMorphPhase("morphing-in");
        
        setTimeout(() => {
          // Game ended - update stats
          const finalScore = gameStats.currentScore;
          const newStats = {
            ...gameStats,
            highScore: Math.max(gameStats.highScore, finalScore),
            gamesPlayed: gameStats.gamesPlayed + 1,
            longestFlee: Math.max(gameStats.longestFlee, lastFleeTime),
          };
          
          setGameStats(newStats);
          saveStats(newStats);
          
          setIsWandering(false);
          setHasInteracted(true);
          setMorphPhase("idle");
          setGameState("escaped");
        }, 600);
      }, 500);
    }, autoStopTime);

    return () => {
      if (wanderIntervalRef.current) {
        clearInterval(wanderIntervalRef.current);
      }
      clearTimeout(autoStopTimer);
    };
  }, [
    energy,
    fleeDirection,
    gameStats,
    hasInteracted,
    isFleeing,
    isHovering,
    isMobile,
    isNearPlayer,
    isReturning,
    isWandering,
    lastFleeTime,
    movementStyle,
    speedMultiplier,
    wanderPosition.x,
    wanderPosition.y,
  ]);

  // Handle catching the player
  const handlePlayerInteraction = useCallback(() => {
    if (isWandering) {
      // Calculate catch bonus based on energy left
      const energyBonus = Math.floor(energy / 10);
      const comboBonus = combo * 5;
      const catchBonus = 10 + energyBonus + comboBonus;
      
      const finalScore = gameStats.currentScore + catchBonus;
      
      // Update stats
      const newStats = {
        ...gameStats,
        highScore: Math.max(gameStats.highScore, finalScore),
        totalCatches: gameStats.totalCatches + 1,
        gamesPlayed: gameStats.gamesPlayed + 1,
        longestFlee: Math.max(gameStats.longestFlee, lastFleeTime),
        currentScore: finalScore,
        currentStreak: gameStats.currentStreak + 1,
      };
      
      setGameStats(newStats);
      saveStats(newStats);
      
      setIsWandering(false);
      setHasInteracted(true);
      setMorphPhase("idle");
      setWanderPosition({ x: 0, y: 0 });
      setGameState("caught");
      
      // Clear all timeouts
      if (fleeTimeoutRef.current) clearTimeout(fleeTimeoutRef.current);
      if (returnTimeoutRef.current) clearTimeout(returnTimeoutRef.current);
    }
  }, [isWandering, energy, combo, gameStats, lastFleeTime]);

  // Start a new game
  const startGame = useCallback(() => {
    setEnergy(100);
    setCombo(0);
    setLastFleeTime(0);
    setGameState("playing");
    setHasInteracted(false);
    setIsWandering(true);
    setGameStats(prev => ({ ...prev, currentScore: 0 }));
  }, []);

  // Reset stats (for testing)
  const resetStats = useCallback(() => {
    if (typeof window === "undefined") return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    setGameStats(loadStats());
  }, []);

  // Get tiredness level for UI
  const getTirednessLevel = useCallback((): "fresh" | "active" | "tired" | "exhausted" => {
    if (energy > 70) return "fresh";
    if (energy > 40) return "active";
    if (energy > 20) return "tired";
    return "exhausted";
  }, [energy]);

  return {
    miniPlayerRef,
    isWandering,
    setIsWandering,
    hasInteracted,
    setHasInteracted,
    wanderPosition,
    setWanderPosition,
    morphPhase,
    setMorphPhase,
    isHovering,
    setIsHovering,
    isNearPlayer,
    setIsNearPlayer,
    isFleeing,
    isReturning,
    movementStyle,
    speedMultiplier,
    fleeDirection,
    setMovementStyle,
    setSpeedMultiplier,
    setFleeDirection,
    handlePlayerInteraction,
    
    // New game features
    gameState,
    gameStats,
    energy,
    combo,
    isTouching,
    touchPosition,
    startGame,
    resetStats,
    getTirednessLevel,
  };
}
