'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import GlassSurface from './GlassSurface'; 
import './ShopScrollFunnel.css';
import { EvervaultCard } from '@/components/Mainpage/evervault-card';

interface ShopScrollFunnelProps {
  isMenuOpen?: boolean;
}

const ShopScrollFunnel: React.FC<ShopScrollFunnelProps> = ({ isMenuOpen = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [magnetOffset, setMagnetOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalDistance = rect.height - windowHeight;
      const scrolled = -rect.top;

      const scrollProgress = Math.max(0, Math.min(1, scrolled / totalDistance));
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setProgress(scrollProgress);
      });
    };

    const target = (containerRef.current?.closest('[data-scroll-container]') as HTMLElement | null) || window;
    target.addEventListener('scroll', handleScroll, { passive: true });
    if (target !== window) window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    
    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (target !== window) window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const distortion = -150 + (progress * 150); 
  const colorOffset = 30 - (progress * 30);   
  const blurAmount = 15 - (progress * 15);    
  const scale = 0.85 + (progress * 0.15);     
  const isUnlocked = progress > 0.75;
  const shouldShowButton = isUnlocked && !isMenuOpen;

  const handleMagnetMove = useCallback((clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const offsetX = ((clientX - rect.left) / rect.width - 0.5) * 14;
    const offsetY = ((clientY - rect.top) / rect.height - 0.5) * 14;
    setMagnetOffset({ x: offsetX, y: offsetY });
  }, []);

  const resetMagnet = useCallback(() => setMagnetOffset({ x: 0, y: 0 }), []);

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
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                    <span className="font-mono uppercase tracking-[0.2em] text-xs">Controller Ready</span>
                  </div>
                  <p className="text-white/60">
                    Scroll to 75% to unlock VIP access. Hover the vault or drag the slider to feel the magnetic pull.
                  </p>
                  <p className="text-white/50">
                    The Pac-Guard preview has been removed to keep frame rates high—jump into the full Pac-Man challenge further down the page.
                  </p>
                </div>

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
            <div className="w-full flex items-center justify-center">
              <div className="evervault-float relative w-full max-w-md min-h-[150px] md:min-h-[190px] rounded-3xl overflow-hidden border border-white/10 bg-black/60 shadow-xl backdrop-blur-lg">
                <EvervaultCard text={isUnlocked ? "ACCESS" : "VAULT"} className="w-full h-full scale-90 md:scale-95" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-lg text-white shadow-[0_0_30px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 text-[10px] font-mono uppercase border border-blue-500/30">FPS Safe</span>
                  <span className="text-xs text-white/60">Pac-Guard removed</span>
                </div>
                <span className="text-xs font-mono text-blue-300">Stable</span>
              </div>
              <p className="text-sm text-white/70">
                This funnel stays lightweight for mobile—no extra mini-game overhead. The full Pac-Man experience is still available below without slowing down the entry flow.
              </p>
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
