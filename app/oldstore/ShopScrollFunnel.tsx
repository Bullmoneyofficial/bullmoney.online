import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Make sure lucide-react is installed: npm install lucide-react
import { Trophy, Heart, Zap, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  id: string;
  x: number;
  y: number;
  color: string;
  startX: number;
  startY: number;
}

interface Direction {
  dx: number;
  dy: number;
}

// Audio context for game sounds
const createAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
};

const playTone = (audioContext: AudioContext | null, frequency: number, duration: number, volume: number = 0.3) => {
  if (!audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

// Background music loop
const startBackgroundMusic = (audioContext: AudioContext | null, bgMusicRef: React.MutableRefObject<OscillatorNode | null>, bgGainRef: React.MutableRefObject<GainNode | null>) => {
  if (!audioContext || bgMusicRef.current) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'square';
  oscillator.frequency.value = 330; // E note
  gainNode.gain.value = 0.05; // Low volume for background
  
  oscillator.start();
  
  bgMusicRef.current = oscillator;
  bgGainRef.current = gainNode;
  
  // Melody pattern
  const melody = [330, 349, 392, 440, 392, 349, 330, 294];
  let index = 0;
  
  const changeTone = () => {
    if (oscillator && bgMusicRef.current) {
      const freq = melody[index];
      if (freq !== undefined) {
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      }
      index = (index + 1) % melody.length;
    }
  };
  
  const intervalId = setInterval(changeTone, 400);
  (oscillator as any).intervalId = intervalId;
};

const stopBackgroundMusic = (bgMusicRef: React.MutableRefObject<OscillatorNode | null>) => {
  if (bgMusicRef.current) {
    const intervalId = (bgMusicRef.current as any).intervalId;
    if (intervalId) clearInterval(intervalId);
    bgMusicRef.current.stop();
    bgMusicRef.current = null;
  }
};


const PAC_MAP = [
  "#####################",
  "#.........#.........#",
  "#.###.###.#.###.###.#",
  "#o###.###.#.###.###o#",
  "#...................#",
  "#.###.#.#####.#.###.#",
  "#.....#...#...#.....#",
  "#####.### # ###.#####",
  "    #.#       #.#    ",
  "#####.# ##### #.#####",
  "#.....  #####   ....#",
  "#####.# ##### #.#####",
  "    #.#       #.#    ",
  "#####.# ##### #.#####",
  "#.........#.........#",
  "#.###.###.#.###.###.#",
  "#o..#.........#..#.o#",
  "###.#.#.#####.#.#.###",
  "#.....#...#...#.....#",
  "#.#######.#.#######.#",
  "#...................#",
  "#####################",
];

const WIDTH = PAC_MAP[0]?.length || 0;
const HEIGHT = PAC_MAP.length;

// Difficulty configurations
const DIFFICULTY_CONFIG = {
  easy: { pacSpeed: 150, ghostSpeed: 250, ghostAggression: 0.70 },
  normal: { pacSpeed: 120, ghostSpeed: 160, ghostAggression: 0.90 },
  hard: { pacSpeed: 100, ghostSpeed: 120, ghostAggression: 0.95 },
  insane: { pacSpeed: 80, ghostSpeed: 90, ghostAggression: 0.98 }
};

// Theme color configurations
const THEMES = {
  blue: {
    shell: 'from-white to-white',
    border: 'border-white',
    screen: 'from-gray-900 via-slate-900 to-black',
    accent: 'text-white',
    glow: 'rgba(255, 255, 255,0.8)',
    wall: 'from-white/90 to-white/80',
    wallBorder: 'border-white/40'
  },
  green: {
    shell: 'from-white to-white',
    border: 'border-white',
    screen: 'from-gray-900 via-white to-black',
    accent: 'text-white',
    glow: 'rgba(255,255,255,0.8)',
    wall: 'from-white/90 to-white/80',
    wallBorder: 'border-white/40'
  },
  purple: {
    shell: 'from-white to-white',
    border: 'border-white',
    screen: 'from-gray-900 via-white to-black',
    accent: 'text-white',
    glow: 'rgba(255, 255, 255,0.8)',
    wall: 'from-white/90 to-white/80',
    wallBorder: 'border-white/40'
  },
  red: {
    shell: 'from-red-400 to-red-600',
    border: 'border-red-800',
    screen: 'from-gray-900 via-red-900 to-black',
    accent: 'text-red-400',
    glow: 'rgba(239,68,68,0.8)',
    wall: 'from-red-600/90 to-red-700/80',
    wallBorder: 'border-red-500/40'
  }
};
const POWER_DURATION = 8000;

// Main wrapper component with lazy loading
const GameBoyPacman = () => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && !isLoaded) {
          setIsInView(true);
          setIsLoaded(true);
        }
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoaded]);

  if (!isInView) {
    return (
      <div 
        ref={containerRef}
        className="min-h-screen bg-black flex items-center justify-center p-1 sm:p-4"
        style={{ minHeight: '600px' }}
      >
        <div className="relative w-full max-w-[300px] sm:max-w-md lg:max-w-lg">
          <div className="relative bg-linear-to-b from-white to-white rounded-xl sm:rounded-3xl p-2 sm:p-4 lg:p-6 shadow-2xl border-2 sm:border-4 lg:border-8 border-white">
            <div className="bg-black rounded-lg p-20 flex items-center justify-center">
              <div className="text-white text-lg sm:text-xl font-bold animate-pulse">
                🎮 Loading...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <GameBoyPacmanGame />;
};

// Actual game component
const GameBoyPacmanGame = () => {
  const [pacmanPos, setPacmanPos] = useState<Position>({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [pellets, setPellets] = useState<Set<string>>(new Set());
  const [powerPellets, setPowerPellets] = useState<Set<string>>(new Set());
  const [powerModeUntil, setPowerModeUntil] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>({ dx: 1, dy: 0 });
  const [nextDirection, setNextDirection] = useState<Direction>({ dx: 1, dy: 0 });
  const [lives, setLives] = useState<number>(3);
  const [mouthOpen, setMouthOpen] = useState<boolean>(true);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [eatenGhosts, setEatenGhosts] = useState<Set<string>>(new Set());
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const [showHighScore, setShowHighScore] = useState<boolean>(false);
  const [isEating, setIsEating] = useState<boolean>(false);
  const [showPacmanEye, setShowPacmanEye] = useState<boolean>(true);
  const [joystickPos, setJoystickPos] = useState<Position>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);
  const [, setGhostsScared] = useState<boolean>(false);
  const [combo, setCombo] = useState<number>(0);
  const [showCombo, setShowCombo] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [scorePulse, setScorePulse] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [dangerLevel, setDangerLevel] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard' | 'insane'>('normal');
  const [theme, setTheme] = useState<'blue' | 'green' | 'purple' | 'red'>('blue');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [ghostMode, setGhostMode] = useState<'scatter' | 'chase'>('chase');
  const [level, setLevel] = useState<number>(1);
  const [ready, setReady] = useState<boolean>(false);
  const [fruit, setFruit] = useState<{x: number, y: number, points: number, emoji: string} | null>(null);
  const [showFruitScore, setShowFruitScore] = useState<{x: number, y: number, points: number} | null>(null);
  const fpsTimeRef = useRef<number>(0);
  const fpsCountRef = useRef<number>(0);
  const modeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fruitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const gameStartTimeRef = useRef<number>(0);
  const bgMusicRef = useRef<OscillatorNode | null>(null);
  const bgGainRef = useRef<GainNode | null>(null);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ghostModeRef = useRef<'scatter' | 'chase'>('chase');
  const readyRef = useRef<boolean>(false);
  const pelletsRef = useRef<Set<string>>(new Set());

  const lastPacmanMoveRef = useRef<number>(0);
  const lastGhostMoveRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const pacmanPosRef = useRef<Position>(pacmanPos);
  const ghostsRef = useRef<Ghost[]>(ghosts);
  const directionRef = useRef<Direction>(direction);
  const nextDirectionRef = useRef<Direction>(nextDirection);
  const gameStateRef = useRef<'playing' | 'won' | 'lost'>(gameState);
  const powerModeRef = useRef<number>(powerModeUntil);
  const eatenGhostsRef = useRef<Set<string>>(eatenGhosts);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('pacman-highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Save high score to localStorage when it changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('pacman-highscore', score.toString());
      if (soundOn && audioContextRef.current) {
        // Play high score achievement sound
        playTone(audioContextRef.current, 880, 0.1, 0.2);
        setTimeout(() => playTone(audioContextRef.current, 1108, 0.2, 0.2), 100);
      }
    }
  }, [score, highScore, soundOn]);

  // Initialize audio context
  useEffect(() => {
    if (soundOn && !audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
  }, [soundOn]);

  // Background music control
  useEffect(() => {
    if (soundOn && audioContextRef.current && gameState === 'playing') {
      startBackgroundMusic(audioContextRef.current, bgMusicRef, bgGainRef);
    } else {
      stopBackgroundMusic(bgMusicRef);
    }
    
    return () => {
      stopBackgroundMusic(bgMusicRef);
    };
  }, [soundOn, gameState]);

  // Sync refs
  useEffect(() => { pacmanPosRef.current = pacmanPos; }, [pacmanPos]);
  useEffect(() => { ghostsRef.current = ghosts; }, [ghosts]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { nextDirectionRef.current = nextDirection; }, [nextDirection]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { powerModeRef.current = powerModeUntil; }, [powerModeUntil]);
  useEffect(() => { eatenGhostsRef.current = eatenGhosts; }, [eatenGhosts]);

  const isWall = useCallback((x: number, y: number): boolean => {
    if (y < 0 || y >= HEIGHT || x < 0 || x >= WIDTH) return true;
    const cell = PAC_MAP[y]?.[x];
    return cell === "#" || cell === " ";
  }, []);

  const resetBoard = useCallback(() => {
    const pelletsSet = new Set<string>();
    const powerSet = new Set<string>();

    PAC_MAP.forEach((row, y) => {
      row.split("").forEach((cell, x) => {
        if (cell === ".") pelletsSet.add(`${x},${y}`);
        if (cell === "o") powerSet.add(`${x},${y}`);
      });
    });

    setPellets(pelletsSet);
    setPowerPellets(powerSet);
    setPacmanPos({ x: 10, y: 17 });
    setGhosts([
      { id: "red", x: 10, y: 7, color: '#ff0000', startX: 10, startY: 7 },
      { id: "cyan", x: 9, y: 7, color: '#00ffff', startX: 9, startY: 7 },
      { id: "pink", x: 11, y: 7, color: '#ffb8ff', startX: 11, startY: 7 },
      { id: "orange", x: 10, y: 9, color: '#ffb847', startX: 10, startY: 9 }
    ]);
    setScore(0);
    setDirection({ dx: 1, dy: 0 });
    setNextDirection({ dx: 1, dy: 0 });
    setLives(3);
    setPowerModeUntil(0);
    setGameState('playing');
    setEatenGhosts(new Set());
    setShowPacmanEye(true);
    setGhostMode('scatter');
    setReady(true); // Start immediately
    lastPacmanMoveRef.current = 0;
    lastGhostMoveRef.current = 0;
    gameStartTimeRef.current = Date.now();
    
    // Ghost mode cycling - FAST cycles
    if (modeTimerRef.current) clearInterval(modeTimerRef.current);
    
    setGhostMode('chase'); // Start in chase mode
    setTimeout(() => setGhostMode('scatter'), 15000); // 15sec chase, 5sec scatter
    
    modeTimerRef.current = setInterval(() => {
      setGhostMode('chase');
      setTimeout(() => setGhostMode('scatter'), 15000);
    }, 20000); // Cycle every 20 seconds
    
    // Spawn fruit - FASTER
    if (fruitTimerRef.current) clearTimeout(fruitTimerRef.current);
    fruitTimerRef.current = setTimeout(() => {
      const fruits = [
        { emoji: '🍒', points: 100 },
        { emoji: '🍓', points: 300 },
        { emoji: '🍊', points: 500 },
        { emoji: '🍎', points: 700 },
        { emoji: '🍇', points: 1000 },
        { emoji: '🔔', points: 2000 },
        { emoji: '🔑', points: 5000 }
      ];
      const fruitIndex = Math.min(level - 1, fruits.length - 1);
      const selectedFruit = fruits[fruitIndex];
      if (selectedFruit) {
        setFruit({ x: 10, y: 14, ...selectedFruit });
      }
      setTimeout(() => setFruit(null), 8000); // 8 seconds to collect
    }, 5000); // Appears after 5 seconds
  }, [level]);

  useEffect(() => {
    ghostModeRef.current = ghostMode;
  }, [ghostMode]);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    pelletsRef.current = pellets;
  }, [pellets]);

  useEffect(() => {
    resetBoard();
    return () => {
      if (modeTimerRef.current) clearInterval(modeTimerRef.current);
      if (fruitTimerRef.current) clearTimeout(fruitTimerRef.current);
    };
  }, [resetBoard]);

  // Hide Pacman eye after 10 seconds
  useEffect(() => {
    if (gameState === 'playing' && gameStartTimeRef.current > 0) {
      const timer = setTimeout(() => {
        setShowPacmanEye(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      
      const keyMap: Record<string, Direction> = {
        'ArrowUp': { dx: 0, dy: -1 }, 'w': { dx: 0, dy: -1 }, 'W': { dx: 0, dy: -1 },
        'ArrowDown': { dx: 0, dy: 1 }, 's': { dx: 0, dy: 1 }, 'S': { dx: 0, dy: 1 },
        'ArrowLeft': { dx: -1, dy: 0 }, 'a': { dx: -1, dy: 0 }, 'A': { dx: -1, dy: 0 },
        'ArrowRight': { dx: 1, dy: 0 }, 'd': { dx: 1, dy: 0 }, 'D': { dx: 1, dy: 0 }
      };

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        setNextDirection(direction);
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetBoard();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [resetBoard]);

  // Main game loop with requestAnimationFrame
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (gameStateRef.current !== 'playing') {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // FPS calculation - less frequent updates
      fpsCountRef.current++;
      if (timestamp - fpsTimeRef.current >= 2000) { // Update every 2 seconds instead of 1
        setFps(Math.round(fpsCountRef.current / 2));
        fpsCountRef.current = 0;
        fpsTimeRef.current = timestamp;
      }

      // Pacman movement
      if (timestamp - lastPacmanMoveRef.current >= DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG].pacSpeed) {
        lastPacmanMoveRef.current = timestamp;

        setPacmanPos((prev: Position) => {
          const testX = prev.x + nextDirectionRef.current.dx;
          const testY = prev.y + nextDirectionRef.current.dy;
          
          let newX = prev.x;
          let newY = prev.y;

          if (!isWall(testX, testY)) {
            setDirection(nextDirectionRef.current);
            newX = testX;
            newY = testY;
          } else {
            const currX = prev.x + directionRef.current.dx;
            const currY = prev.y + directionRef.current.dy;
            if (!isWall(currX, currY)) {
              newX = currX;
              newY = currY;
            }
          }

          if (newX < 0) newX = WIDTH - 1;
          if (newX >= WIDTH) newX = 0;

          setMouthOpen((m: boolean) => !m);
          
          // Trail disabled for performance
          // Particles disabled for performance

          const key = `${newX},${newY}`;
          
          // Check fruit collection
          if (fruit && newX === fruit.x && newY === fruit.y) {
            setScore(s => s + fruit.points);
            setShowFruitScore({ x: fruit.x, y: fruit.y, points: fruit.points });
            setFruit(null);
            setTimeout(() => setShowFruitScore(null), 2000);
            
            if (soundOn && audioContextRef.current) {
              playTone(audioContextRef.current, 659, 0.1, 0.15);
              setTimeout(() => playTone(audioContextRef.current, 784, 0.1, 0.15), 100);
              setTimeout(() => playTone(audioContextRef.current, 880, 0.15, 0.15), 200);
            }
          }
          
          setPellets((prev: Set<string>) => {
            if (prev.has(key)) {
              const newPellets = new Set(prev);
              newPellets.delete(key);
              
              // Combo system
              setCombo((c: number) => {
                const newCombo = c + 1;
                const bonusPoints = newCombo > 1 ? newCombo * 5 : 0;
                setScore((s: number) => s + 10 + bonusPoints);
                
                // Score pulse effect
                setScorePulse(true);
                setTimeout(() => setScorePulse(false), 300);
                
                if (newCombo > 1) {
                  setShowCombo(true);
                  setTimeout(() => setShowCombo(false), 1000);
                }
                
                return newCombo;
              });
              
              // Reset combo after 2 seconds
              if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
              comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000);
              
              setIsEating(true);
              setTimeout(() => setIsEating(false), 150);
              
              // Particles disabled for performance
              
              if (soundOn && audioContextRef.current) {
                playTone(audioContextRef.current, 440 + (combo * 20), 0.05, 0.1);
              }
              if (newPellets.size === 0) {
                setGameState('won');
                setLevel((l: number) => l + 1);
                if (soundOn && audioContextRef.current) {
                  // Victory sound
                  playTone(audioContextRef.current, 523, 0.15, 0.2);
                  setTimeout(() => playTone(audioContextRef.current, 659, 0.15, 0.2), 150);
                  setTimeout(() => playTone(audioContextRef.current, 784, 0.3, 0.2), 300);
                }
                // Restart level after 3 seconds
                setTimeout(() => {
                  resetBoard();
                }, 3000);
              }
              return newPellets;
            }
            return prev;
          });

          setPowerPellets((prev: Set<string>) => {
            if (prev.has(key)) {
              const newPowers = new Set(prev);
              newPowers.delete(key);
              setScore((s: number) => s + 50);
              setPowerModeUntil(Date.now() + POWER_DURATION);
              setIsEating(true);
              setGhostsScared(true);
              setTimeout(() => setIsEating(false), 200);
              setTimeout(() => setGhostsScared(false), POWER_DURATION);
              
              if (soundOn && audioContextRef.current) {
                // Power pellet sound
                playTone(audioContextRef.current, 330, 0.1, 0.15);
                setTimeout(() => playTone(audioContextRef.current, 440, 0.1, 0.15), 100);
                setTimeout(() => playTone(audioContextRef.current, 554, 0.2, 0.15), 200);
              }
              return newPowers;
            }
            return prev;
          });

          return { x: newX, y: newY };
        });
      }

      // Ghost movement - ADVANCED AI WITH PATHFINDING
      if (timestamp - lastGhostMoveRef.current >= DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG].ghostSpeed) {
        lastGhostMoveRef.current = timestamp;

        setGhosts((prev: Ghost[]) => prev.map((ghost: Ghost) => {
          if (eatenGhostsRef.current.has(ghost.id)) return ghost;

          const isPowerActive = powerModeRef.current > Date.now();
          const pacPos = pacmanPosRef.current;
          const pacDir = directionRef.current;
          
          // Get valid moves
          const moves = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
          ].filter(({ dx, dy }) => {
            const newX = ghost.x + dx;
            const newY = ghost.y + dy;
            return !isWall(newX, newY);
          });

          if (moves.length === 0) return ghost;

          let targetX = pacPos.x;
          let targetY = pacPos.y;

          // BLINKY (RED) - The Chaser - Direct pursuit
          if (ghost.id === 'red') {
            if (ghostModeRef.current === 'scatter' && !isPowerActive) {
              targetX = 18; targetY = 1;
            } else if (isPowerActive) {
              targetX = ghost.x - (pacPos.x - ghost.x) * 2;
              targetY = ghost.y - (pacPos.y - ghost.y) * 2;
            } else {
              // Direct chase with speed boost when close
              targetX = pacPos.x;
              targetY = pacPos.y;
            }
          }
          
          // PINKY (PINK) - The Ambusher - Targets 4 tiles ahead
          else if (ghost.id === 'pink') {
            if (ghostModeRef.current === 'scatter' && !isPowerActive) {
              targetX = 1; targetY = 1;
            } else if (isPowerActive) {
              targetX = ghost.x - (pacPos.x - ghost.x) * 2;
              targetY = ghost.y - (pacPos.y - ghost.y) * 2;
            } else {
              // Ambush ahead of Pacman
              const aheadDist = difficulty === 'insane' ? 6 : difficulty === 'hard' ? 5 : 4;
              targetX = pacPos.x + (pacDir.dx * aheadDist);
              targetY = pacPos.y + (pacDir.dy * aheadDist);
              
              // Clamp to valid positions
              targetX = Math.max(0, Math.min(WIDTH - 1, targetX));
              targetY = Math.max(0, Math.min(HEIGHT - 1, targetY));
            }
          }
          
          // INKY (CYAN) - The Bashful - Complex flanking with Blinky
          else if (ghost.id === 'cyan') {
            if (ghostModeRef.current === 'scatter' && !isPowerActive) {
              targetX = 18; targetY = 20;
            } else if (isPowerActive) {
              targetX = ghost.x - (pacPos.x - ghost.x) * 2;
              targetY = ghost.y - (pacPos.y - ghost.y) * 2;
            } else {
              // Find Blinky for coordination
              const blinky = prev.find((g: Ghost) => g.id === 'red');
              if (blinky) {
                // Target based on vector from Blinky through Pacman
                const vectorX = (pacPos.x + pacDir.dx * 2) - blinky.x;
                const vectorY = (pacPos.y + pacDir.dy * 2) - blinky.y;
                targetX = blinky.x + vectorX * 2;
                targetY = blinky.y + vectorY * 2;
              } else {
                targetX = pacPos.x + pacDir.dx * 2;
                targetY = pacPos.y + pacDir.dy * 2;
              }
              
              targetX = Math.max(0, Math.min(WIDTH - 1, targetX));
              targetY = Math.max(0, Math.min(HEIGHT - 1, targetY));
            }
          }
          
          // CLYDE (ORANGE) - The Stupid - Gets shy when close
          else if (ghost.id === 'orange') {
            if (ghostModeRef.current === 'scatter' && !isPowerActive) {
              targetX = 1; targetY = 20;
            } else if (isPowerActive) {
              targetX = ghost.x - (pacPos.x - ghost.x) * 2;
              targetY = ghost.y - (pacPos.y - ghost.y) * 2;
            } else {
              const dist = Math.abs(ghost.x - pacPos.x) + Math.abs(ghost.y - pacPos.y);
              
              if (dist < 8) {
                // Run to scatter corner when close
                targetX = 1; targetY = 20;
              } else {
                // Chase when far
                targetX = pacPos.x;
                targetY = pacPos.y;
              }
            }
          }

          // Manhattan distance pathfinding (FAST & OPTIMIZED)
          let bestMove = moves[0];
          let bestDist = isPowerActive ? -999 : 999;
          
          for (const move of moves) {
            const newX = ghost.x + move.dx;
            const newY = ghost.y + move.dy;
            const dist = Math.abs(newX - targetX) + Math.abs(newY - targetY);
            
            if (isPowerActive) {
              if (dist > bestDist) {
                bestDist = dist;
                bestMove = move;
              }
            } else {
              if (dist < bestDist) {
                bestDist = dist;
                bestMove = move;
              }
            }
          }

          if (!bestMove) return ghost;

          return {
            ...ghost,
            x: ghost.x + bestMove.dx,
            y: ghost.y + bestMove.dy
          };
        }));
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isWall, difficulty, resetBoard]);

  // Collision detection - OPTIMIZED (less frequent)
  useEffect(() => {
    if (gameState !== 'playing' || !ghosts.length) return;

    const checkInterval = setInterval(() => {
      const isPowerActive = powerModeUntil > Date.now();
      
      // Calculate danger level efficiently (only if not in power mode)
      if (!isPowerActive) {
        let minDist = Infinity;
        for (const ghost of ghosts) {
          const dist = Math.abs(ghost.x - pacmanPos.x) + Math.abs(ghost.y - pacmanPos.y);
          if (dist < minDist) minDist = dist;
        }
        setDangerLevel(minDist < 3 ? 3 : minDist < 5 ? 2 : minDist < 8 ? 1 : 0);
      } else {
        setDangerLevel(0);
      }
      
      // Check collisions
      for (const ghost of ghosts) {
        if (ghost.x === pacmanPos.x && ghost.y === pacmanPos.y) {
          if (isPowerActive && !eatenGhosts.has(ghost.id)) {
            setScore((s: number) => s + 200);
            setEatenGhosts((prev: Set<string>) => new Set([...prev, ghost.id]));

            // Screen shake effect
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 300);

            if (soundOn && audioContextRef.current) {
              // Eating ghost sound
              playTone(audioContextRef.current, 220, 0.1, 0.15);
              setTimeout(() => playTone(audioContextRef.current, 330, 0.1, 0.15), 100);
              setTimeout(() => playTone(audioContextRef.current, 440, 0.15, 0.15), 200);
            }

            setTimeout(() => {
              setGhosts((prev: Ghost[]) => prev.map((g: Ghost) =>
                g.id === ghost.id ? { ...g, x: g.startX, y: g.startY } : g
              ));
              setEatenGhosts((prev: Set<string>) => {
                const newSet = new Set(prev);
                newSet.delete(ghost.id);
                return newSet;
              });
            }, 3000);
          } else if (!isPowerActive) {
            if (soundOn && audioContextRef.current) {
              // Death sound
              playTone(audioContextRef.current, 262, 0.15, 0.2);
              setTimeout(() => playTone(audioContextRef.current, 196, 0.15, 0.2), 150);
              setTimeout(() => playTone(audioContextRef.current, 147, 0.3, 0.2), 300);
            }

            // Screen shake on death
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 500);

            setLives((l: number) => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameState('lost');
                if (soundOn && audioContextRef.current) {
                  // Game over sound
                  setTimeout(() => playTone(audioContextRef.current, 196, 0.2, 0.2), 400);
                  setTimeout(() => playTone(audioContextRef.current, 147, 0.4, 0.2), 600);
                }
              } else {
                setPacmanPos({ x: 1, y: 1 });
                setDirection({ dx: 1, dy: 0 });
                setNextDirection({ dx: 1, dy: 0 });
                setGhosts((prev: Ghost[]) => prev.map((g: Ghost) => ({
                  ...g, x: g.startX, y: g.startY
                })));
              }
              return newLives;
            });
          }
        }
      }
    }, 50);

    return () => clearInterval(checkInterval);
  }, [ghosts, pacmanPos, powerModeUntil, gameState, eatenGhosts, soundOn]);

  const getPacmanRotation = useMemo(() => {
    if (direction.dx === 1) return '0deg';
    if (direction.dx === -1) return '180deg';
    if (direction.dy === -1) return '-90deg';
    if (direction.dy === 1) return '90deg';
    return '0deg';
  }, [direction]);

  // Joystick handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickRef.current) return;
    setIsJoystickActive(true);
    const touch = 'touches' in e ? e.touches[0] : e;
    if (!touch) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isJoystickActive || !joystickRef.current) return;
    e.preventDefault();
    const touch = 'touches' in e ? e.touches[0] : e;
    if (!touch) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
  }, [isJoystickActive]);

  const handleJoystickEnd = useCallback(() => {
    setIsJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
  }, []);

  const updateJoystick = useCallback((dx: number, dy: number) => {
    const maxDist = 35;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const limitedDx = dist > maxDist ? (dx / dist) * maxDist : dx;
    const limitedDy = dist > maxDist ? (dy / dist) * maxDist : dy;
    
    setJoystickPos({ x: limitedDx, y: limitedDy });

    const angle = Math.atan2(limitedDy, limitedDx);
    const deg = angle * 180 / Math.PI;
    
    if (deg >= -45 && deg < 45) {
      setNextDirection({ dx: 1, dy: 0 });
    } else if (deg >= 45 && deg < 135) {
      setNextDirection({ dx: 0, dy: 1 });
    } else if (deg >= -135 && deg < -45) {
      setNextDirection({ dx: 0, dy: -1 });
    } else {
      setNextDirection({ dx: -1, dy: 0 });
    }
  }, []);

  const isPowerActive = powerModeUntil > Date.now();
  const currentTheme = THEMES[theme as keyof typeof THEMES];

  // Memoized grid cells with optimized rendering
  const gridCells = useMemo(() => {
    const cells = [];
    for (let y = 0; y < HEIGHT; y++) {
      const row = PAC_MAP[y];
      if (!row) continue;
      for (let x = 0; x < WIDTH; x++) {
        const cell = row[x];
        const isPacman = pacmanPos.x === x && pacmanPos.y === y;
        const ghost = ghosts.find(g => g.x === x && g.y === y);
        const key = `${x},${y}`;
        const hasPellet = pellets.has(key);
        const hasPower = powerPellets.has(key);
        const wall = cell === "#";
        const isEmpty = cell === " ";
        const isGhostEaten = ghost && eatenGhosts.has(ghost.id);
        const hasFruit = fruit && fruit.x === x && fruit.y === y;

        cells.push(
          <div 
            key={key}
            className={`flex items-center justify-center ${
              wall ? `bg-linear-to-br ${currentTheme.wall} border ${currentTheme.wallBorder} rounded-sm shadow-[inset_0_0_8px_rgba(255, 255, 255,0.5),0_0_4px_rgba(255, 255, 255,0.3)]` : 
              isEmpty ? 'bg-black' : 'bg-black/60'
            }`}
            style={{ aspectRatio: '1/1' }}
          >
            {hasFruit && (
              <div className="text-lg sm:text-xl animate-bounce">
                {fruit.emoji}
              </div>
            )}
            {hasPellet && (
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-300 animate-pulse" style={{
                boxShadow: '0 0 8px rgba(253,224,71,1), 0 0 4px rgba(253,224,71,0.8)'
              }} />
            )}
            {hasPower && (
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white animate-pulse" style={{
                boxShadow: '0 0 15px rgba(255,255,255,1), 0 0 8px rgba(255, 255, 255,0.8)',
                animation: 'pulse 0.5s ease-in-out infinite'
              }} />
            )}
            {ghost && !isGhostEaten && (
              <div className="w-full h-full flex items-center justify-center p-0.5">
                <div 
                  className="relative w-full h-full rounded-t-full"
                  style={{ 
                    backgroundColor: isPowerActive ? '#4444ff' : ghost.color,
                    boxShadow: isPowerActive 
                      ? '0 0 12px #4444ff, inset 0 2px 4px rgba(255,255,255,0.3)' 
                      : `0 0 10px ${ghost.color}, inset 0 2px 4px rgba(255,255,255,0.2)`,
                    filter: isPowerActive ? 'brightness(0.8)' : 'brightness(1)'
                  }}
                >
                  {/* Ghost wave bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-[25%] flex justify-around">
                    {[0,1,2,3].map(i => (
                      <div 
                        key={i}
                        className="w-[20%] h-full rounded-b-full"
                        style={{
                          backgroundColor: isPowerActive ? '#3333cc' : ghost.color,
                          filter: 'brightness(0.9)'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Eyes with better styling */}
                  <div className="absolute top-[20%] left-[25%] w-[20%] h-[28%] bg-white rounded-full shadow-inner" />
                  <div className="absolute top-[20%] right-[25%] w-[20%] h-[28%] bg-white rounded-full shadow-inner" />
                  
                  {/* Pupils */}
                  {!isPowerActive ? (
                    <>
                      <div className="absolute top-[28%] left-[30%] w-[12%] h-[16%] bg-white rounded-full" />
                      <div className="absolute top-[28%] right-[30%] w-[12%] h-[16%] bg-white rounded-full" />
                    </>
                  ) : (
                    <>
                      <div className="absolute top-[26%] left-[28%] w-[16%] h-[8%] bg-white rounded-full transform rotate-12" />
                      <div className="absolute top-[26%] right-[28%] w-[16%] h-[8%] bg-white rounded-full transform -rotate-12" />
                      <div className="absolute top-[36%] left-[27%] w-[18%] h-[6%] bg-white rounded-full transform -rotate-12" />
                      <div className="absolute top-[36%] right-[27%] w-[18%] h-[6%] bg-white rounded-full transform rotate-12" />
                    </>
                  )}
                  
                  {/* Ghost ID indicator (debug) */}
                  {difficulty === 'easy' && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white text-[6px] font-bold opacity-50">
                      {ghost.id[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            )}
            {isPacman && (
              <div 
                className="w-full h-full flex items-center justify-center p-0.5"
                style={{ 
                  transform: `rotate(${getPacmanRotation}) scale(${isEating ? 1.3 : 1})`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <div 
                  className="relative w-full h-full rounded-full bg-yellow-400 transition-all duration-150 shadow-[0_0_12px_rgba(250,204,21,1)]"
                  style={{ 
                    clipPath: mouthOpen 
                      ? 'polygon(50% 50%, 0% 0%, 0% 100%, 50% 50%, 100% 25%, 100% 75%)' 
                      : 'circle(50%)',
                    boxShadow: isEating ? '0 0 20px rgba(250,204,21,1)' : '0 0 12px rgba(250,204,21,1)'
                  }}
                >
                  {showPacmanEye && (
                    <div 
                      className="absolute top-[20%] left-[50%] w-[15%] h-[15%] -translate-x-1/2 rounded-full bg-black transition-opacity duration-1000"
                      style={{ opacity: showPacmanEye ? 1 : 0 }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  }, [pacmanPos.x, pacmanPos.y, ghosts, pellets, powerPellets, isPowerActive, eatenGhosts, mouthOpen, getPacmanRotation, isEating, showPacmanEye, currentTheme, fruit]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-1 sm:p-4">
      <div className="relative w-full max-w-[300px] sm:max-w-md lg:max-w-lg">
        <div className={`relative bg-linear-to-b ${THEMES[theme as keyof typeof THEMES].shell} rounded-xl sm:rounded-3xl p-2 sm:p-4 lg:p-6 shadow-2xl border-2 sm:border-4 lg:border-8 ${THEMES[theme as keyof typeof THEMES].border}`}>
          {/* Enhanced shimmer effect */}
          <div className="absolute inset-0 rounded-xl sm:rounded-3xl opacity-60 pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s infinite'
          }} />
          
          {/* Pulsing glow effect */}
          <div className="absolute inset-0 rounded-xl sm:rounded-3xl opacity-30 pointer-events-none" style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.4), transparent)',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          
          <div className="relative mb-2 sm:mb-4 lg:mb-6">
            <div className="absolute -inset-0.5 sm:-inset-1 bg-linear-to-r from-white via-white to-white rounded-lg sm:rounded-xl blur opacity-75" style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite'
            }} />
            <div className={`relative bg-linear-to-br ${THEMES[theme as keyof typeof THEMES].screen} rounded-lg sm:rounded-xl p-1.5 sm:p-3 lg:p-4 border border-white sm:border-2 lg:border-4 shadow-inner`}>
              <div className="flex justify-between items-center mb-1 sm:mb-2 px-1 sm:px-2">
                <div className="flex gap-0.5 sm:gap-1 lg:gap-2">
                  {[...Array(lives)].map((_, i) => (
                    <Heart key={i} className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 fill-cyan-400 text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]" />
                  ))}
                </div>
                <div className="flex flex-col items-center">
                  <div 
                    className={`text-white font-bold text-[9px] sm:text-xs lg:text-sm drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)] transition-all ${
                      scorePulse ? 'scale-125 drop-shadow-[0_0_15px_rgba(255, 255, 255,1)]' : ''
                    }`}
                  >
                    {score}
                  </div>
                  {highScore > 0 && (
                    <div className="text-white text-[7px] sm:text-[10px] flex items-center gap-0.5">
                      <Trophy className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                      {highScore}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSoundOn(!soundOn)}
                  className="p-0.5 sm:p-1 rounded hover:bg-white/30 transition-all touch-manipulation"
                >
                  {soundOn ? (
                    <Volume2 className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]" />
                  ) : (
                    <VolumeX className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]" />
                  )}
                </button>
              </div>

              <div 
                className={`relative bg-black rounded-md sm:rounded-lg p-0.5 sm:p-1.5 lg:p-2 overflow-hidden sm:border-2 transition-all ${screenShake ? 'animate-shake' : ''}`}
                style={{
                  border: dangerLevel === 0 ? '1px solid rgba(255, 255, 255,0.5)' : 
                          dangerLevel === 1 ? '2px solid rgba(234,179,8,0.6)' :
                          dangerLevel === 2 ? '2px solid rgba(249,115,22,0.8)' :
                          '2px solid rgba(239,68,68,1)',
                  boxShadow: dangerLevel === 0 ? 'inset 0 0 20px rgba(255, 255, 255,0.3)' :
                             dangerLevel === 1 ? 'inset 0 0 25px rgba(234,179,8,0.4), 0 0 10px rgba(234,179,8,0.3)' :
                             dangerLevel === 2 ? 'inset 0 0 30px rgba(249,115,22,0.5), 0 0 15px rgba(249,115,22,0.4)' :
                             'inset 0 0 35px rgba(239,68,68,0.6), 0 0 20px rgba(239,68,68,0.5)',
                  animation: dangerLevel >= 2 ? 'pulse 0.5s ease-in-out infinite' : 'none'
                }}
              >
                <div 
                  className="grid gap-0"
                  style={{ 
                    gridTemplateColumns: `repeat(${WIDTH}, 1fr)`,
                    aspectRatio: `${WIDTH} / ${HEIGHT}`
                  }}
                >
                  {gridCells}
                </div>

                {/* Particles and trails disabled for performance */}

                {/* Combo counter */}
                {showCombo && combo > 1 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                    <div className="bg-linear-to-r from-yellow-400 to-orange-500 text-white font-bold px-3 py-1 rounded-full shadow-[0_0_20px_rgba(250,204,21,1)] animate-bounce text-sm sm:text-base">
                      {combo}x COMBO! +{combo * 5}
                    </div>
                  </div>
                )}

                {/* Level indicator */}
                {level > 1 && gameState === 'playing' && ready && (
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-yellow-400 text-xs font-bold pointer-events-none">
                    LEVEL {level}
                  </div>
                )}

                {/* Fruit score popup */}
                {showFruitScore && (
                  <div 
                    className="absolute pointer-events-none z-30 animate-bounce"
                    style={{
                      left: `${(showFruitScore.x / WIDTH) * 100}%`,
                      top: `${(showFruitScore.y / HEIGHT) * 100}%`
                    }}
                  >
                    <div className="text-white font-bold text-sm sm:text-base drop-shadow-[0_0_10px_rgba(255, 255, 255,1)]">
                      +{showFruitScore.points}
                    </div>
                  </div>
                )}

                {gameState !== 'playing' && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-3xl sm:text-4xl mb-2 animate-bounce">
                        {gameState === 'won' ? '🎉' : '💀'}
                      </div>
                      <h3 className="text-white font-bold text-lg sm:text-xl mb-2 drop-shadow-[0_0_10px_rgba(255, 255, 255,1)]">
                        {gameState === 'won' ? 'YOU WIN!' : 'GAME OVER'}
                      </h3>
                      <p className="text-white mb-4 text-sm sm:text-base drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]">Score: {score}</p>
                      {score === highScore && highScore > 0 && (
                        <p className="text-yellow-400 mb-2 text-xs sm:text-sm animate-pulse drop-shadow-[0_0_10px_rgba(250,204,21,1)]">
                          🏆 NEW HIGH SCORE! 🏆
                        </p>
                      )}
                      <button
                        onClick={resetBoard}
                        className="px-4 sm:px-6 py-2 bg-linear-to-r from-white to-white hover:from-white hover:to-white text-white rounded-lg font-bold shadow-[0_0_20px_rgba(255, 255, 255,0.6)] transition-all touch-manipulation active:scale-95"
                      >
                        PLAY AGAIN
                      </button>
                    </div>
                  </div>
                )}
                
                {showHighScore && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-sm z-10">
                    <div className="text-center bg-linear-to-br from-white to-indigo-900 p-6 rounded-xl border-2 border-white shadow-[0_0_30px_rgba(255, 255, 255,0.6)]">
                      <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
                      <h3 className="text-white font-bold text-xl mb-3 drop-shadow-[0_0_10px_rgba(255, 255, 255,1)]">
                        HIGH SCORE
                      </h3>
                      <div className="text-6xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,1)]">
                        {highScore}
                      </div>
                      <p className="text-white text-sm mb-4">Current Score: {score}</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setShowHighScore(false)}
                          className="px-6 py-2 bg-linear-to-r from-white to-white hover:from-white hover:to-white text-white rounded-lg font-bold shadow-[0_0_20px_rgba(255, 255, 255,0.6)] transition-all touch-manipulation active:scale-95"
                        >
                          CLOSE
                        </button>
                        {highScore > 0 && (
                          <button
                            onClick={() => {
                              setHighScore(0);
                              localStorage.removeItem('pacman-highscore');
                              setShowHighScore(false);
                            }}
                            className="px-4 py-2 bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all touch-manipulation active:scale-95"
                          >
                            RESET
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Settings Modal */}
                {showSettings && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-sm z-20">
                    <div className="bg-linear-to-br from-gray-800 to-gray-900 p-4 sm:p-6 rounded-xl border-2 border-white shadow-[0_0_30px_rgba(255, 255, 255,0.6)] max-w-xs w-full mx-4">
                      <h3 className="text-white font-bold text-lg sm:text-xl mb-4 text-center drop-shadow-[0_0_10px_rgba(255, 255, 255,1)]">
                        SETTINGS
                      </h3>
                      
                      {/* Difficulty Selection */}
                      <div className="mb-4">
                        <p className="text-white text-sm mb-2 font-bold">DIFFICULTY</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(['easy', 'normal', 'hard', 'insane'] as const).map((diff) => (
                            <button
                              key={diff}
                              onClick={() => setDifficulty(diff)}
                              className={`py-2 px-3 rounded-lg font-bold text-xs transition-all touch-manipulation ${
                                difficulty === diff
                                  ? 'bg-linear-to-r from-white to-pink-500 text-white shadow-[0_0_15px_rgba(255, 255, 255,0.8)]'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {diff.toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <p className="text-gray-400 text-[10px] mt-1">
                          {difficulty === 'easy' && '🟢 Slow ghosts, basic AI, smooth 60 FPS'}
                          {difficulty === 'normal' && '🟡 Balanced speed, optimized AI, 60 FPS'}
                          {difficulty === 'hard' && '🟠 Fast ghosts, smart AI, high performance'}
                          {difficulty === 'insane' && '🔴 Ultra-fast! Advanced AI, maximum FPS!'}
                        </p>
                      </div>
                      
                      {/* Theme Selection */}
                      <div className="mb-4">
                        <p className="text-white text-sm mb-2 font-bold">GAME BOY THEME</p>
                        <div className="grid grid-cols-4 gap-2">
                          {(['blue', 'green', 'purple', 'red'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTheme(t)}
                              className={`h-10 rounded-lg transition-all touch-manipulation ${
                                theme === t
                                  ? 'ring-2 ring-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                                  : 'opacity-70 hover:opacity-100'
                              }`}
                              style={{
                                background: t === 'blue' ? 'linear-gradient(to bottom, #ffffff, #ffffff)' :
                                           t === 'green' ? 'linear-gradient(to bottom, #ffffff, #ffffff)' :
                                           t === 'purple' ? 'linear-gradient(to bottom, #ffffff, #ffffff)' :
                                           'linear-gradient(to bottom, #f87171, #dc2626)'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setShowSettings(false)}
                        className="w-full py-2 bg-linear-to-r from-white to-pink-600 hover:from-white hover:to-pink-500 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(255, 255, 255,0.6)] transition-all touch-manipulation active:scale-95"
                      >
                        CLOSE
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isPowerActive && (
                <div className="mt-0.5 sm:mt-2 flex items-center justify-center gap-1 sm:gap-2">
                  <Zap className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-white animate-pulse drop-shadow-[0_0_8px_rgba(255, 255, 255,1)]" />
                  <span className="text-white text-[7px] sm:text-[10px] lg:text-xs font-bold drop-shadow-[0_0_8px_rgba(255, 255, 255,0.8)]">POWER MODE!</span>
                </div>
              )}
              
              {/* FPS and stats indicator */}
              {gameState === 'playing' && (
                <div className="mt-1 flex items-center justify-center gap-2 text-[6px] sm:text-[8px] text-white/70">
                  <span>FPS: {fps}</span>
                  <span>•</span>
                  <span>Pellets: {pellets.size}</span>
                  <span>•</span>
                  <span className={combo > 1 ? 'text-yellow-400 font-bold' : ''}>
                    {combo > 1 ? `${combo}x COMBO` : 'NO COMBO'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-end mb-1.5 sm:mb-3 lg:mb-4">
            {/* Enhanced Joystick */}
            <div 
              ref={joystickRef}
              className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-2 border-white shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] flex items-center justify-center touch-manipulation transition-all"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6))',
                boxShadow: isJoystickActive 
                  ? '0 0 25px rgba(255, 255, 255, 0.6), inset 0 4px 8px rgba(0,0,0,0.3)' 
                  : '0 0 15px rgba(255, 255, 255, 0.4), inset 0 4px 8px rgba(0,0,0,0.3)'
              }}
              onMouseDown={handleJoystickStart}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              onMouseLeave={handleJoystickEnd}
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
            >
              {/* Animated base rings */}
              <div className="absolute inset-2 rounded-full border-2 border-white/30 animate-pulse" />
              <div className="absolute inset-4 rounded-full border border-white/20" />
              
              {/* Joystick stick with enhanced 3D effect */}
              <div 
                className="absolute w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full shadow-[0_4px_8px_rgba(0,0,0,0.4)] transition-all duration-100"
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px) ${isJoystickActive ? 'scale(1.05)' : 'scale(1)'}`,
                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 1), rgba(255, 255, 255, 1))',
                  boxShadow: isJoystickActive 
                    ? '0 0 30px rgba(255, 255, 255,1), 0 4px 12px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.5)' 
                    : '0 0 20px rgba(255, 255, 255,0.8), 0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4)'
                }}
              >
                {/* Enhanced highlight */}
                <div className="absolute top-1 left-1 w-4 h-4 sm:w-5 sm:h-5 bg-white/50 rounded-full blur-sm" />
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-inner" />
              </div>
              
              {/* Direction indicators with glow */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(255, 255, 255,0.8)]" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(255, 255, 255,0.8)]" />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(255, 255, 255,0.8)]" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_4px_rgba(255, 255, 255,0.8)]" />
            </div>

            <div className="flex gap-1.5 sm:gap-3 lg:gap-4">
              <button
                onClick={resetBoard}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-linear-to-br from-white to-white hover:from-white hover:to-white rounded-full shadow-[0_0_20px_rgba(255, 255, 255,0.6)] flex items-center justify-center active:scale-95 transition-all border-2 border-white touch-manipulation hover:shadow-[0_0_30px_rgba(255, 255, 255,0.9)]"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </button>
              <button
                onClick={() => setShowHighScore(!showHighScore)}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-linear-to-br from-white to-indigo-600 hover:from-white hover:to-indigo-500 rounded-full shadow-[0_0_20px_rgba(255, 255, 255,0.6)] flex items-center justify-center active:scale-95 transition-all border-2 border-white touch-manipulation hover:shadow-[0_0_30px_rgba(255, 255, 255,0.9)]"
                title="High Score"
              >
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-linear-to-br from-white to-pink-600 hover:from-white hover:to-pink-500 rounded-full shadow-[0_0_20px_rgba(255, 255, 255,0.6)] flex items-center justify-center active:scale-95 transition-all border-2 border-white touch-manipulation hover:shadow-[0_0_30px_rgba(255, 255, 255,0.9)]"
                title="Settings"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="text-center">
            <div className="text-white font-bold text-[9px] sm:text-xs tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              PAC-BOY™
            </div>
            <div className="text-white text-[7px] sm:text-[10px] mt-0.5 hidden sm:block">
              WASD or Arrow Keys • R to Restart
            </div>
            <div className="text-white text-[7px] mt-0.5 sm:hidden">
              Use Joystick to Play
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        
        @keyframes particleFade {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(0, -20px) scale(0.5);
          }
        }
        
        @keyframes trailFade {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        @media (max-width: 640px) {
          body {
            touch-action: pan-x pan-y;
            overscroll-behavior: none;
          }
          
          html {
            font-size: 14px;
          }
        }
        
        @media (min-width: 640px) and (max-width: 1024px) {
          html {
            font-size: 15px;
          }
        }
        
        @media (min-width: 1024px) {
          html {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default GameBoyPacman;