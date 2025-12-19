import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const GameBoyPacman: React.FC = () => {
  const [pacmanPos, setPacmanPos] = useState<Position>({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [pellets, setPellets] = useState<Set<string>>(new Set());
  const [powerPellets, setPowerPellets] = useState<Set<string>>(new Set());
  const [powerModeUntil, setPowerModeUntil] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>({ dx: 1, dy: 0 });
  const [nextDirection, setNextDirection] = useState<Direction>({ dx: 1, dy: 0 });
  const [lives, setLives] = useState<number>(3);
  const [mouthOpen, setMouthOpen] = useState<boolean>(true);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [eatenGhosts, setEatenGhosts] = useState<Set<string>>(new Set());
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const [joystickPos, setJoystickPos] = useState<Position>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);
  const joystickRef = useRef<HTMLDivElement>(null);

  const PAC_MAP: string[] = [
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

  const width = PAC_MAP[0].length;
  const height = PAC_MAP.length;

  const isWall = useCallback((x: number, y: number): boolean => {
    if (y < 0 || y >= height || x < 0 || x >= width) return true;
    const cell = PAC_MAP[y]?.[x];
    return cell === "#" || cell === " ";
  }, [height, width]);

  const resetBoard = useCallback(() => {
    const pelletsSet = new Set<string>();
    const powerSet = new Set<string>();
    let startPos: Position = { x: 1, y: 1 };

    PAC_MAP.forEach((row, y) => {
      row.split("").forEach((cell, x) => {
        if (cell === ".") pelletsSet.add(`${x},${y}`);
        if (cell === "o") powerSet.add(`${x},${y}`);
        if (cell === "P") startPos = { x, y };
      });
    });

    setPellets(pelletsSet);
    setPowerPellets(powerSet);
    setPacmanPos(startPos);
    setGhosts([
      { id: "red", x: 9, y: 8, color: '#ff0000', startX: 9, startY: 8 },
      { id: "cyan", x: 10, y: 8, color: '#00ffff', startX: 10, startY: 8 },
      { id: "pink", x: 11, y: 8, color: '#ffb8ff', startX: 11, startY: 8 },
      { id: "orange", x: 9, y: 10, color: '#ffb847', startX: 9, startY: 10 }
    ]);
    setScore(0);
    setDirection({ dx: 1, dy: 0 });
    setNextDirection({ dx: 1, dy: 0 });
    setLives(3);
    setPowerModeUntil(0);
    setGameState('playing');
    setEatenGhosts(new Set());
  }, []);

  useEffect(() => {
    resetBoard();
  }, [resetBoard]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      
      const keyMap: Record<string, Direction> = {
        'ArrowUp': { dx: 0, dy: -1 },
        'w': { dx: 0, dy: -1 },
        'W': { dx: 0, dy: -1 },
        'ArrowDown': { dx: 0, dy: 1 },
        's': { dx: 0, dy: 1 },
        'S': { dx: 0, dy: 1 },
        'ArrowLeft': { dx: -1, dy: 0 },
        'a': { dx: -1, dy: 0 },
        'A': { dx: -1, dy: 0 },
        'ArrowRight': { dx: 1, dy: 0 },
        'd': { dx: 1, dy: 0 },
        'D': { dx: 1, dy: 0 }
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        setNextDirection(keyMap[e.key]);
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetBoard();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [resetBoard]);

  // Pac-Man movement
  useEffect(() => {
    if (gameState !== 'playing') return;

    const moveInterval = setInterval(() => {
      setPacmanPos(prev => {
        const testX = prev.x + nextDirection.dx;
        const testY = prev.y + nextDirection.dy;
        
        let newX = prev.x;
        let newY = prev.y;

        if (!isWall(testX, testY)) {
          setDirection(nextDirection);
          newX = testX;
          newY = testY;
        } else {
          const currX = prev.x + direction.dx;
          const currY = prev.y + direction.dy;
          if (!isWall(currX, currY)) {
            newX = currX;
            newY = currY;
          }
        }

        if (newX < 0) newX = width - 1;
        if (newX >= width) newX = 0;

        setMouthOpen(m => !m);

        const key = `${newX},${newY}`;
        
        setPellets(prev => {
          if (prev.has(key)) {
            const newPellets = new Set(prev);
            newPellets.delete(key);
            setScore(s => s + 10);
            if (newPellets.size === 0) {
              setGameState('won');
            }
            return newPellets;
          }
          return prev;
        });

        setPowerPellets(prev => {
          if (prev.has(key)) {
            const newPowers = new Set(prev);
            newPowers.delete(key);
            setScore(s => s + 50);
            setPowerModeUntil(Date.now() + 8000);
            return newPowers;
          }
          return prev;
        });

        return { x: newX, y: newY };
      });
    }, 180);

    return () => clearInterval(moveInterval);
  }, [gameState, direction, nextDirection, isWall, width]);

  // Ghost AI
  useEffect(() => {
    if (gameState !== 'playing') return;

    const ghostInterval = setInterval(() => {
      setGhosts(prev => prev.map(ghost => {
        if (eatenGhosts.has(ghost.id)) return ghost;

        const isPowerActive = powerModeUntil > Date.now();
        const possibleMoves = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 }
        ].filter(({ dx, dy }) => !isWall(ghost.x + dx, ghost.y + dy));

        if (possibleMoves.length === 0) return ghost;

        const scored = possibleMoves.map(({ dx, dy }) => {
          const newX = ghost.x + dx;
          const newY = ghost.y + dy;
          const dist = Math.sqrt(
            Math.pow(newX - pacmanPos.x, 2) + 
            Math.pow(newY - pacmanPos.y, 2)
          );
          return { dx, dy, dist };
        });

        scored.sort((a, b) => isPowerActive ? b.dist - a.dist : a.dist - b.dist);
        const move = Math.random() < 0.8 ? scored[0] : scored[Math.floor(Math.random() * scored.length)];
        
        return {
          ...ghost,
          x: ghost.x + move.dx,
          y: ghost.y + move.dy
        };
      }));
    }, 300);

    return () => clearInterval(ghostInterval);
  }, [gameState, pacmanPos, powerModeUntil, eatenGhosts, isWall]);

  // Collision detection
  useEffect(() => {
    if (gameState !== 'playing') return;

    const isPowerActive = powerModeUntil > Date.now();
    
    ghosts.forEach(ghost => {
      if (ghost.x === pacmanPos.x && ghost.y === pacmanPos.y) {
        if (isPowerActive && !eatenGhosts.has(ghost.id)) {
          setScore(s => s + 200);
          setEatenGhosts(prev => new Set([...prev, ghost.id]));
          
          setTimeout(() => {
            setGhosts(prev => prev.map(g => 
              g.id === ghost.id 
                ? { ...g, x: g.startX, y: g.startY }
                : g
            ));
            setEatenGhosts(prev => {
              const newSet = new Set(prev);
              newSet.delete(ghost.id);
              return newSet;
            });
          }, 3000);
        } else if (!isPowerActive) {
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState('lost');
            } else {
              setPacmanPos({ x: 1, y: 1 });
              setDirection({ dx: 1, dy: 0 });
              setNextDirection({ dx: 1, dy: 0 });
              setGhosts(prev => prev.map(g => ({
                ...g,
                x: g.startX,
                y: g.startY
              })));
            }
            return newLives;
          });
        }
      }
    });
  }, [ghosts, pacmanPos, powerModeUntil, gameState, eatenGhosts]);

  // Joystick handlers
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickRef.current) return;
    setIsJoystickActive(true);
    const touch = 'touches' in e ? e.touches[0] : e;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isJoystickActive || !joystickRef.current) return;
    e.preventDefault();
    const touch = 'touches' in e ? e.touches[0] : e;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    updateJoystick(touch.clientX - centerX, touch.clientY - centerY);
  };

  const handleJoystickEnd = () => {
    setIsJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
  };

  const updateJoystick = (dx: number, dy: number) => {
    const maxDist = 40;
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
  };

  const getPacmanRotation = (): string => {
    if (direction.dx === 1) return '0deg';
    if (direction.dx === -1) return '180deg';
    if (direction.dy === -1) return '-90deg';
    if (direction.dy === 1) return '90deg';
    return '0deg';
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Game Boy Shell */}
        <div className="relative bg-gradient-to-b from-blue-400 to-blue-600 rounded-3xl p-6 shadow-2xl border-8 border-blue-800">
          {/* Shimmer effect */}
          <div className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none" style={{
            background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s infinite'
          }} />
          {/* Screen with shimmer border */}
          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-xl blur opacity-75" style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite'
            }} />
            <div className="relative bg-gradient-to-br from-gray-900 via-slate-900 to-black rounded-xl p-4 border-4 border-blue-900 shadow-inner">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-2 px-2">
              <div className="flex gap-2">
                {[...Array(lives)].map((_, i) => (
                  <Heart key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                ))}
              </div>
              <div className="text-cyan-400 font-bold text-sm drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                {score}
              </div>
              <button
                onClick={() => setSoundOn(!soundOn)}
                className="p-1 rounded hover:bg-blue-500/30 transition-all"
              >
                {soundOn ? (
                  <Volume2 className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
              </button>
            </div>

            {/* Game Grid */}
            <div className="relative bg-black rounded-lg p-2 overflow-hidden border-2 border-blue-900/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]">
              <div 
                className="grid gap-0"
                style={{ 
                  gridTemplateColumns: `repeat(${width}, 1fr)`,
                  aspectRatio: `${width} / ${height}`
                }}
              >
                {PAC_MAP.map((row, y) => row.split("").map((cell, x) => {
                  const isPacman = pacmanPos.x === x && pacmanPos.y === y;
                  const ghost = ghosts.find(g => g.x === x && g.y === y);
                  const key = `${x},${y}`;
                  const hasPellet = pellets.has(key);
                  const hasPower = powerPellets.has(key);
                  const wall = cell === "#";
                  const isEmpty = cell === " ";
                  const isPowerActive = powerModeUntil > Date.now();
                  const isGhostEaten = ghost && eatenGhosts.has(ghost.id);

                  return (
                    <div 
                      key={key}
                      className={`flex items-center justify-center ${
                        wall ? 'bg-blue-600/80 border border-cyan-500/30 rounded-sm shadow-[inset_0_0_6px_rgba(34,211,238,0.4)]' : 
                        isEmpty ? 'bg-black' :
                        'bg-black/60'
                      }`}
                      style={{ aspectRatio: '1/1' }}
                    >
                      {hasPellet && (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,1)]" />
                      )}
                      {hasPower && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_12px_rgba(255,255,255,1)]" />
                      )}
                      {ghost && !isGhostEaten && (
                        <div className="w-full h-full flex items-center justify-center p-0.5">
                          <div 
                            className="w-full h-full rounded-t-full transition-all duration-300"
                            style={{ 
                              backgroundColor: isPowerActive ? '#4444ff' : ghost.color,
                              boxShadow: `0 0 10px ${isPowerActive ? '#4444ff' : ghost.color}`
                            }}
                          >
                            <div className="absolute top-[20%] left-[25%] w-[20%] h-[25%] bg-white rounded-full" />
                            <div className="absolute top-[20%] right-[25%] w-[20%] h-[25%] bg-white rounded-full" />
                            <div className="absolute top-[25%] left-[30%] w-[12%] h-[15%] bg-blue-900 rounded-full" />
                            <div className="absolute top-[25%] right-[30%] w-[12%] h-[15%] bg-blue-900 rounded-full" />
                          </div>
                        </div>
                      )}
                      {isPacman && (
                        <div 
                          className="w-full h-full flex items-center justify-center p-0.5"
                          style={{ 
                            transform: `rotate(${getPacmanRotation()})`,
                            transition: 'transform 0.1s'
                          }}
                        >
                          <div 
                            className="relative w-full h-full rounded-full bg-yellow-400 transition-all duration-150 shadow-[0_0_12px_rgba(250,204,21,1)]"
                            style={{ 
                              clipPath: mouthOpen 
                                ? 'polygon(50% 50%, 0% 0%, 0% 100%, 50% 50%, 100% 25%, 100% 75%)' 
                                : 'circle(50%)'
                            }}
                          >
                            <div className="absolute top-[20%] left-[50%] w-[15%] h-[15%] -translate-x-1/2 rounded-full bg-black" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }))}
              </div>

              {/* Game Over Overlay */}
              {gameState !== 'playing' && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-4xl mb-2 animate-bounce">
                      {gameState === 'won' ? '🎉' : '💀'}
                    </div>
                    <h3 className="text-cyan-400 font-bold text-xl mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,1)]">
                      {gameState === 'won' ? 'YOU WIN!' : 'GAME OVER'}
                    </h3>
                    <p className="text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">Score: {score}</p>
                    <button
                      onClick={resetBoard}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all"
                    >
                      PLAY AGAIN
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Power Mode Indicator */}
            {powerModeUntil > Date.now() && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,1)]" />
                <span className="text-cyan-400 text-xs font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">POWER MODE!</span>
              </div>
            )}
          </div>
        </div>

          {/* D-Pad */}
          <div className="flex justify-between items-end mb-4">
            {/* Left: D-Pad */}
            <div className="relative w-32 h-32">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-blue-900 rounded shadow-inner" />
              
              {/* Up */}
              <button
                onMouseDown={() => setNextDirection({ dx: 0, dy: -1 })}
                onTouchStart={() => setNextDirection({ dx: 0, dy: -1 })}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-900 hover:bg-blue-800 rounded shadow-lg flex items-center justify-center active:scale-95 transition border-2 border-blue-700"
              >
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
              </button>

              {/* Right */}
              <button
                onMouseDown={() => setNextDirection({ dx: 1, dy: 0 })}
                onTouchStart={() => setNextDirection({ dx: 1, dy: 0 })}
                className="absolute top-1/2 right-0 -translate-y-1/2 w-12 h-12 bg-blue-900 hover:bg-blue-800 rounded shadow-lg flex items-center justify-center active:scale-95 transition border-2 border-blue-700"
              >
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
              </button>

              {/* Down */}
              <button
                onMouseDown={() => setNextDirection({ dx: 0, dy: 1 })}
                onTouchStart={() => setNextDirection({ dx: 0, dy: 1 })}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-blue-900 hover:bg-blue-800 rounded shadow-lg flex items-center justify-center active:scale-95 transition border-2 border-blue-700"
              >
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
              </button>

              {/* Left */}
              <button
                onMouseDown={() => setNextDirection({ dx: -1, dy: 0 })}
                onTouchStart={() => setNextDirection({ dx: -1, dy: 0 })}
                className="absolute top-1/2 left-0 -translate-y-1/2 w-12 h-12 bg-blue-900 hover:bg-blue-800 rounded shadow-lg flex items-center justify-center active:scale-95 transition border-2 border-blue-700"
              >
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]" />
              </button>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetBoard}
                className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.6)] flex items-center justify-center active:scale-95 transition border-2 border-cyan-400"
                title="Restart"
              >
                <RotateCcw className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </button>
              <button
                className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center justify-center active:scale-95 transition border-2 border-blue-400"
                title="High Score"
              >
                <Trophy className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              </button>
            </div>
          </div>

          {/* Game Boy Text */}
          <div className="text-center">
            <div className="text-blue-900 font-bold text-xs tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              PAC-BOY™
            </div>
            <div className="text-blue-800 text-[10px] mt-1">
              WASD or Arrow Keys • R to Restart
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};

export default GameBoyPacman;