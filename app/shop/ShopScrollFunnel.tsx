'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import GlassSurface from './GlassSurface'; 
import './ShopScrollFunnel.css';
import { EvervaultCard } from '@/components/Mainpage/evervault-card';

// 1. Define Props to accept the state from your parent/layout
interface ShopScrollFunnelProps {
  isMenuOpen?: boolean; // Default to false if not passed
}

const ShopScrollFunnel: React.FC<ShopScrollFunnelProps> = ({ isMenuOpen = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [magnetOffset, setMagnetOffset] = useState({ x: 0, y: 0 });
  const [pacmanPos, setPacmanPos] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [ghosts, setGhosts] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [pellets, setPellets] = useState<Set<string>>(new Set());
  const [powerPellets, setPowerPellets] = useState<Set<string>>(new Set());
  const [powerModeUntil, setPowerModeUntil] = useState<number>(0);
  const [pacmanScore, setPacmanScore] = useState(0);
  const [direction, setDirection] = useState<{ dx: number; dy: number }>({ dx: 1, dy: 0 });
  const [lives, setLives] = useState(3);
  const [mouthOpen, setMouthOpen] = useState(true);
  const pacmanSoundRef = useRef<HTMLAudioElement | null>(null);
  const ghostSoundRef = useRef<HTMLAudioElement | null>(null);

  const PAC_MAP = useMemo(() => ([
    "###########",
    "#P.o#....G#",
    "#.#.#.##..#",
    "#.#..o...##",
    "#...##.#..#",
    "#.##.#.#G.#",
    "#....#o...#",
    "#G#..#..#.#",
    "###########",
  ]), []);

  const width = PAC_MAP[0].length;
  const height = PAC_MAP.length;

  const coordKey = (x: number, y: number) => `${x},${y}`;
  const isUnlocked = progress > 0.75;

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalDistance = rect.height - windowHeight;
      const scrolled = -rect.top;

      let scrollProgress = scrolled / totalDistance;
      scrollProgress = Math.max(0, Math.min(1, scrollProgress));
      
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setProgress(scrollProgress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Initialize sounds
  useEffect(() => {
    const eat = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
    const power = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
    eat.volume = 0.25;
    power.volume = 0.25;
    pacmanSoundRef.current = eat;
    ghostSoundRef.current = power;
  }, []);

  const resetBoard = useCallback(() => {
    const pelletsSet = new Set<string>();
    const powerSet = new Set<string>();
    const ghostList: Array<{ id: string; x: number; y: number }> = [];
    let start = { x: 1, y: 1 };

    PAC_MAP.forEach((row, y) => {
      row.split("").forEach((cell, x) => {
        if (cell === ".") pelletsSet.add(coordKey(x, y));
        if (cell === "o") powerSet.add(coordKey(x, y));
        if (cell === "P") start = { x, y };
        if (cell === "G") ghostList.push({ id: `g-${x}-${y}`, x, y });
      });
    });

    setPellets(pelletsSet);
    setPowerPellets(powerSet);
    setGhosts(ghostList.length ? ghostList : [{ id: "g-1", x: width - 2, y: 1 }]);
    setPacmanPos(start);
    setPacmanScore(0);
    setDirection({ dx: 1, dy: 0 });
    setLives(3);
    setPowerModeUntil(0);
  }, [PAC_MAP, coordKey, width]);

  // Build map on unlock
  useEffect(() => {
    if (!isUnlocked) return;
    resetBoard();
  }, [isUnlocked, resetBoard]);

  const distortion = -150 + (progress * 150); 
  const colorOffset = 30 - (progress * 30);   
  const blurAmount = 15 - (progress * 15);    
  const scale = 0.85 + (progress * 0.15);     
  
  // Unlocks at 75% scroll
  
  // 2. Logic: Only show if scrolled AND menu is closed
  const shouldShowButton = isUnlocked && !isMenuOpen;

  const handleMagnetMove = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const offsetX = ((clientX - rect.left) / rect.width - 0.5) * 14;
    const offsetY = ((clientY - rect.top) / rect.height - 0.5) * 14;
    setMagnetOffset({ x: offsetX, y: offsetY });
  };

  const resetMagnet = () => setMagnetOffset({ x: 0, y: 0 });

  const isWall = useCallback((x: number, y: number) => {
    const row = PAC_MAP[y];
    if (!row) return true;
    return row[x] === "#";
  }, [PAC_MAP]);

  const movePacman = useCallback((dx: number, dy: number) => {
    setPacmanPos((prev) => {
      const nx = prev.x + dx;
      const ny = prev.y + dy;
      if (isWall(nx, ny)) return prev;
      const next = { x: nx, y: ny };
      const key = coordKey(nx, ny);
      setMouthOpen((m) => !m);

      setPellets((prevPellets) => {
        const newPellets = new Set(prevPellets);
        if (newPellets.has(key)) {
          newPellets.delete(key);
          setPacmanScore((s) => s + 10);
          pacmanSoundRef.current?.play().catch(() => {});
        }
        return newPellets;
      });

      setPowerPellets((prevPowers) => {
        if (prevPowers.has(key)) {
          const updated = new Set(prevPowers);
          updated.delete(key);
          setPacmanScore((s) => s + 50);
          setPowerModeUntil(Date.now() + 6000);
          ghostSoundRef.current?.play().catch(() => {});
          return updated;
        }
        return prevPowers;
      });

      return next;
    });
  }, [coordKey, isWall]);

  const handlePacmanKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (['ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); setDirection({ dx: 0, dy: -1 }); movePacman(0, -1); }
    if (['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); setDirection({ dx: 0, dy: 1 }); movePacman(0, 1); }
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) { e.preventDefault(); setDirection({ dx: -1, dy: 0 }); movePacman(-1, 0); }
    if (['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); setDirection({ dx: 1, dy: 0 }); movePacman(1, 0); }
  };

  useEffect(() => {
    if (!isUnlocked) return;
    const id = setInterval(() => {
      movePacman(direction.dx, direction.dy);
    }, 240);
    return () => clearInterval(id);
  }, [direction, isUnlocked, movePacman]);

  // Ghost movement + collision
  const ghostStep = useCallback(() => {
    setGhosts((prevGhosts) => prevGhosts.map((g) => {
      const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ].filter(({ dx, dy }) => !isWall(g.x + dx, g.y + dy));
      const targetX = pacmanPos.x;
      const targetY = pacmanPos.y;
      const powerActive = powerModeUntil > Date.now();
      const scored = dirs
        .map(({ dx, dy }) => {
          const nx = g.x + dx;
          const ny = g.y + dy;
          const dist = Math.abs(nx - targetX) + Math.abs(ny - targetY);
          return { dx, dy, dist };
        })
        .sort((a, b) => powerActive ? b.dist - a.dist : a.dist - b.dist);
      const choice = scored[0] || { dx: 0, dy: 0 };
      return { ...g, x: g.x + choice.dx, y: g.y + choice.dy };
    }));
  }, [isWall]);

  useEffect(() => {
    if (!isUnlocked) return;
    const id = setInterval(() => {
      ghostStep();
    }, 420);
    return () => clearInterval(id);
  }, [ghostStep, isUnlocked]);

  // Resolve collisions
  useEffect(() => {
    const powerActive = powerModeUntil > Date.now();
    ghosts.forEach((g) => {
      if (g.x === pacmanPos.x && g.y === pacmanPos.y) {
        if (powerActive) {
          setPacmanScore((s) => s + 200);
          setGhosts((prev) => prev.map((ghost) => ghost.id === g.id ? { ...ghost, x: width - 2, y: 1 } : ghost));
        } else {
          setLives((l) => Math.max(0, l - 1));
          setPacmanPos({ x: 1, y: 1 });
          setDirection({ dx: 1, dy: 0 });
        }
      }
    });
  }, [ghosts, pacmanPos, powerModeUntil, width]);

  useEffect(() => {
    if (lives <= 0 && isUnlocked) {
      resetBoard();
    }
  }, [isUnlocked, lives, resetBoard]);

  return (
    <div className="funnel-scroll-container" ref={containerRef}>
      <div className="funnel-sticky-wrapper">
        
      <div className="bg-text" style={{ 
        transform: `translate(-50%, calc(-50% + ${progress * 150}px))`,
        color: `rgba(255, 215, 0, ${0.1 + (progress * 0.1)})`,
        pointerEvents: 'none'
      }}>
        MEMBERS<br />ONLY
      </div>

        <div className="w-full grid gap-6 md:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="glass-wrapper" style={{ transform: `scale(${scale})` }}>
            <GlassSurface
              width="100%"
              height="min(55vh, 520px)"
              borderRadius={30}
              borderWidth={0.5}
              distortionScale={distortion}
              redOffset={colorOffset}
              blueOffset={-colorOffset}
              blur={blurAmount}
              opacity={0.5 + (progress * 0.5)}
              mixBlendMode="hard-light"
              className="border-white/20 w-full"
            >
              <div className="funnel-content">
                <div className="flex items-center justify-between mb-4">
                  <span className="label" style={{ 
                    opacity: 0.7 + (progress * 0.3),
                    color: isUnlocked ? '#4ade80' : '#fff'
                  }}>
                    {isUnlocked ? 'ACCESS GRANTED' : 'ENCRYPTED CONNECTION'}
                  </span>
                  <span className="text-[10px] font-mono text-white/60 uppercase">Scroll {Math.round(progress * 100)}%</span>
                </div>
                
                <h1 className="headline" style={{ 
                  letterSpacing: `${12 - (progress * 12)}px`,
                  filter: `blur(${blurAmount / 3}px)`,
                  opacity: isUnlocked ? 0 : 1, 
                  transition: 'opacity 0.3s ease',
                }}>
                  LOCKED
                </h1>

                <div className="mt-6 grid gap-3 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                    <span className="font-mono uppercase tracking-[0.2em] text-xs">Controller Ready</span>
                  </div>
                  <p className="text-white/60">
                    Navigate with arrows / WASD. On mobile, tap the pads. Hover the vault or drag the slider to feel the magnetic pull.
                  </p>
                </div>

                {/* 3. Updated Style Logic */}
                <div 
                  className="action-area mt-8"
                  style={{ 
                    opacity: shouldShowButton ? 1 : 0, 
                    transform: `translateY(${(1 - progress) * 30}px)`,
                    pointerEvents: shouldShowButton ? 'auto' : 'none', 
                    position: 'relative',
                    zIndex: 100,
                    transition: 'opacity 0.3s ease'
                  }}
                  onMouseMove={(e) => handleMagnetMove(e.clientX, e.clientY, e.currentTarget)}
                  onMouseLeave={resetMagnet}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    if (touch) handleMagnetMove(touch.clientX, touch.clientY, e.currentTarget);
                  }}
                  onTouchEnd={resetMagnet}
                >
                  <Link 
                    href="/shop" 
                    className="enter-shop-btn"
                    style={{ transform: `translate(${magnetOffset.x}px, ${magnetOffset.y}px)` }}
                  >
                      VIP ACCESS
                  </Link>
                </div>
              </div>
            </GlassSurface>
          </div>

          <div className="w-full flex flex-col gap-4 md:gap-6">
            <div className="w-full h-full min-h-[180px] md:min-h-[220px] rounded-3xl overflow-hidden border border-white/10 bg-black/60 shadow-xl backdrop-blur-lg">
              <EvervaultCard text={isUnlocked ? "ACCESS" : "VAULT"} className="w-full h-full scale-90 md:scale-95" />
            </div>

              <div className="p-4 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-lg text-white shadow-[0_0_30px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-300 text-[10px] font-mono uppercase border border-yellow-500/30">Pac-Guard</span>
                    <span className="text-xs text-white/60">Tap dots or use arrows</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-blue-300">Score {pacmanScore}</span>
                    <span className="text-red-300">Lives {lives}</span>
                    <span className={powerModeUntil > Date.now() ? 'text-emerald-300' : 'text-neutral-400'}>
                      {powerModeUntil > Date.now() ? 'POWER' : 'NORMAL'}
                    </span>
                  </div>
                </div>
              <div 
                className="grid grid-cols-11 gap-1 p-2 rounded-xl bg-gradient-to-br from-slate-900/80 to-black border border-white/5 focus:outline-none"
                tabIndex={0}
                onKeyDown={handlePacmanKeyDown}
                aria-label="Pacman mini grid"
              >
                {PAC_MAP.map((row, y) => row.split("").map((cell, x) => {
                  const isPacman = pacmanPos.x === x && pacmanPos.y === y;
                  const isGhost = ghosts.some((g) => g.x === x && g.y === y);
                  const pelletKey = `${x},${y}`;
                  const hasPellet = pellets.has(pelletKey);
                  const hasPower = powerPellets.has(pelletKey);
                  const wall = cell === "#";
                  return (
                    <div 
                      key={`${x}-${y}`} 
                      className={`relative aspect-square rounded-md border flex items-center justify-center transition-colors ${
                        wall ? 'bg-neutral-800 border-neutral-700' : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        if (!wall) movePacman(x - pacmanPos.x, y - pacmanPos.y);
                      }}
                    >
                      {hasPellet && <span className="w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.8)]" />}
                      {hasPower && <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />}
                      {isGhost && (
                        <div className="relative w-6 h-6 rounded-b-md rounded-t-full bg-pink-500 border-2 border-pink-200 animate-pulse">
                          <div className="absolute inset-0 flex justify-around px-1 pt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                      {isPacman && (
                        <div className="relative w-7 h-7 rounded-full bg-yellow-400 border-2 border-black shadow-[0_0_12px_rgba(234,179,8,0.5)] transition-transform duration-150" style={{ transform: mouthOpen ? 'scale(1.02)' : 'scale(0.98)' }}>
                          <div className="absolute inset-0 bg-black/60" style={{ clipPath: `polygon(50% 50%, 110% ${mouthOpen ? 35 : 48}%, 110% ${mouthOpen ? 65 : 52}%) rotate(${direction.dx === 0 && direction.dy === -1 ? '-90deg' : direction.dx === 0 && direction.dy === 1 ? '90deg' : direction.dx === -1 ? '180deg' : '0deg'})` }} />
                          <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-black" />
                        </div>
                      )}
                    </div>
                  );
                }))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button onClick={() => movePacman(0, -1)} className="rounded-lg border border-white/10 bg-white/5 py-2 text-xs hover:bg-white/10">Up</button>
                <button onClick={() => movePacman(0, 1)} className="rounded-lg border border-white/10 bg-white/5 py-2 text-xs hover:bg-white/10">Down</button>
                <button onClick={() => movePacman(0, 0)} className="rounded-lg border border-white/10 bg-white/5 py-2 text-xs hover:bg-white/10">Stay</button>
                <button onClick={() => movePacman(-1, 0)} className="rounded-lg border border-white/10 bg-white/5 py-2 text-xs hover:bg-white/10 col-span-1">Left</button>
                <button onClick={() => movePacman(1, 0)} className="rounded-lg border border-white/10 bg-white/5 py-2 text-xs hover:bg-white/10 col-span-2">Right</button>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator" style={{ opacity: 1 - progress }}>
          <span>SCROLL TO UNLOCK</span>
          <div className="line"></div>
        </div>

      </div>
    </div>
  );
};

export default ShopScrollFunnel;
