'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [pacmanPos, setPacmanPos] = useState({ x: 2, y: 2 });
  const [pacmanPellets, setPacmanPellets] = useState<Array<{ x: number; y: number }>>([]);
  const [pacmanScore, setPacmanScore] = useState(0);
  const [direction, setDirection] = useState<{ dx: number; dy: number }>({ dx: 1, dy: 0 });
  const pacmanSoundRef = useRef<HTMLAudioElement | null>(null);

  const GRID_SIZE = 5;
  const clampGrid = (v: number) => Math.max(0, Math.min(GRID_SIZE - 1, v));
  const makePellets = useCallback(() => {
    const seeds: Array<{ x: number; y: number }> = [];
    while (seeds.length < 6) {
      const spot = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
      if (!seeds.some((s) => s.x === spot.x && s.y === spot.y)) seeds.push(spot);
    }
    return seeds;
  }, [GRID_SIZE]);
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

  useEffect(() => {
    const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
    audio.volume = 0.25;
    pacmanSoundRef.current = audio;
    setPacmanPellets(makePellets());
  }, [makePellets]);

  useEffect(() => {
    if (isUnlocked) {
      setPacmanPellets(makePellets());
      setPacmanPos({ x: 2, y: 2 });
      setPacmanScore(0);
      setDirection({ dx: 1, dy: 0 });
    }
  }, [isUnlocked, makePellets]);

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

  const movePacman = useCallback((dx: number, dy: number) => {
    setPacmanPos((prev) => {
      const next = { x: clampGrid(prev.x + dx), y: clampGrid(prev.y + dy) };
      setPacmanPellets((prevPellets) => {
        const remaining = prevPellets.filter((p) => !(p.x === next.x && p.y === next.y));
        if (remaining.length !== prevPellets.length) {
          setPacmanScore((s) => s + 1);
          if (navigator.vibrate) navigator.vibrate(10);
          try {
            if (pacmanSoundRef.current) {
              pacmanSoundRef.current.currentTime = 0;
              pacmanSoundRef.current.play().catch(() => {});
            }
          } catch (e) {}
        }
        return remaining.length ? remaining : makePellets();
      });
      return next;
    });
  }, [clampGrid, makePellets]);

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
    }, 450);
    return () => clearInterval(id);
  }, [direction, isUnlocked, movePacman]);

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
            <div className="w-full h-full min-h-[260px] rounded-3xl overflow-hidden border border-white/10 bg-black/50 shadow-xl backdrop-blur-lg">
              <EvervaultCard text={isUnlocked ? "ACCESS" : "VAULT"} className="w-full h-full" />
            </div>

            <div className="p-4 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-lg text-white shadow-[0_0_30px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-300 text-[10px] font-mono uppercase border border-yellow-500/30">Pac-Guard</span>
                  <span className="text-xs text-white/60">Tap dots or use arrows</span>
                </div>
                <span className="text-xs font-mono text-blue-300">Score {pacmanScore}</span>
              </div>
              <div 
                className="grid grid-cols-5 gap-1 p-2 rounded-xl bg-gradient-to-br from-slate-900/80 to-black border border-white/5 focus:outline-none"
                tabIndex={0}
                onKeyDown={handlePacmanKeyDown}
                aria-label="Pacman mini grid"
              >
                {Array.from({ length: GRID_SIZE }).map((_, y) => (
                  Array.from({ length: GRID_SIZE }).map((_, x) => {
                    const isPacman = pacmanPos.x === x && pacmanPos.y === y;
                    const hasPellet = pacmanPellets.some((p) => p.x === x && p.y === y);
                    return (
                      <div 
                        key={`${x}-${y}`} 
                        className="relative aspect-square rounded-md bg-white/5 border border-white/5 flex items-center justify-center"
                        onClick={() => movePacman(x - pacmanPos.x, y - pacmanPos.y)}
                      >
                        {hasPellet && <span className="w-2 h-2 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.8)]" />}
                        {isPacman && (
                          <div className="relative w-6 h-6 rounded-full bg-yellow-400 border-2 border-black shadow-[0_0_12px_rgba(234,179,8,0.5)]">
                            <div className="absolute inset-0 bg-black/60" style={{ clipPath: 'polygon(50% 50%, 110% 10%, 110% 90%)' }} />
                            <span className="absolute top-1 left-1 w-1 h-1 rounded-full bg-black" />
                          </div>
                        )}
                      </div>
                    );
                  })
                ))}
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
