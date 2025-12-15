"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { MessageCircle, Volume2, VolumeX } from 'lucide-react';

// --- EXISTING IMPORTS ---
import { ShopProvider } from "@/app/VIP/ShopContext"; // Adjusted path for clarity
import HeroShop from "@/app/shop/ShopHero"; 
import ProductsSection from "@/app/VIP/ProductsSection"; 
import RecruitPage from "@/app/register/pageVip";
import Socials from "@/components/Mainpage/Socialsfooter";
import ShopFunnel from "@/app/shop/ShopFunnel"; 
import Shopmain from "@/components/Mainpage/ShopMainpage";

// --- DYNAMIC IMPORTS (Assuming TargetCursorComponent is correctly defined elsewhere or kept here) ---

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmall = window.innerWidth <= 768;
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile((hasTouch && isSmall) || mobileRegex.test(userAgent.toLowerCase()));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

// Placeholder/Inlined TargetCursorComponent
const TargetCursorComponent: React.FC<any> = ({ targetSelector, spinDuration, hideDefaultCursor, hoverDuration, parallaxOn }) => {
    // NOTE: This large component logic is kept as a placeholder from your original input.
    // In a real project, this should be imported from '@/components/Mainpage/TargertCursor'.
    const isMobile = useIsMobile();
    const cursorRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
    
    const state = useRef({
        isActive: false,
        targetPositions: null as { x: number; y: number }[] | null,
        activeStrength: { val: 0 },
        activeTarget: null as Element | null
    });

    useEffect(() => {
      if (!cursorRef.current || typeof window === 'undefined') return;

      const originalCursor = document.body.style.cursor;
      if (hideDefaultCursor && !isMobile) document.body.style.cursor = 'none';
      
      cornersRef.current = cursorRef.current.querySelectorAll('.target-cursor-corner');

      const ctx = gsap.context(() => {
          const cursor = cursorRef.current!;
          const corners = cornersRef.current!;

          if (isMobile) {
              gsap.set(cursor, { x: window.innerWidth/2, y: window.innerHeight/2, opacity: 0, scale: 1.3 });
              gsap.to(cursor, { opacity: 1, duration: 0.5 });
          }
          else {
              gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
              const spinTl = gsap.timeline({ repeat: -1 })
                  .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });
              const moveCursor = (e: MouseEvent) => {
                  gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power3.out', force3D: true });
              };
              window.addEventListener('mousemove', moveCursor);
              
              const handleDown = () => {
                  gsap.to(dotRef.current, { scale: 0.5, duration: 0.2 });
                  gsap.to(corners, { scale: 1.2, borderColor: '#00ffff', duration: 0.2 });
              };
              const handleUp = () => {
                  gsap.to(dotRef.current, { scale: 1, duration: 0.2 });
                  gsap.to(corners, { scale: 1, borderColor: '#0066ff', duration: 0.2 });
              };
              window.addEventListener('mousedown', handleDown);
              window.addEventListener('mouseup', handleUp);
              
              const handleHover = (e: MouseEvent) => {
                  const target = (e.target as Element).closest(targetSelector);
                  if (target && target !== state.current.activeTarget) {
                      state.current.activeTarget = target;
                      state.current.isActive = true;
                      spinTl.pause();
                      gsap.to(cursor, { rotation: 0, duration: 0.3 });

                      const rect = target.getBoundingClientRect();
                      const borderWidth = 4; const cornerSize = 16;

                      state.current.targetPositions = [
                          { x: rect.left - borderWidth, y: rect.top - borderWidth },
                          { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
                          { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
                          { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
                      ];

                      gsap.to(state.current.activeStrength, { val: 1, duration: hoverDuration, ease: 'power2.out' });

                      const handleLeave = () => {
                          target.removeEventListener('mouseleave', handleLeave);
                          state.current.activeTarget = null;
                          state.current.isActive = false;
                          state.current.targetPositions = null;
                          gsap.to(state.current.activeStrength, { val: 0, duration: 0.2, overwrite: true });
                          corners.forEach((c) => gsap.to(c, { x: 0, y: 0, duration: 0.3 }));
                          spinTl.restart();
                      };
                      target.addEventListener('mouseleave', handleLeave);
                  }
              };
              window.addEventListener('mouseover', handleHover);
          }

      }, cursorRef); 

      return () => {
          if (!isMobile) document.body.style.cursor = originalCursor;
          ctx.revert();
          window.removeEventListener('mousemove', () => {}); 
          window.removeEventListener('mousedown', () => {});
          window.removeEventListener('mouseup', () => {});
      };
    }, [isMobile, hideDefaultCursor, spinDuration, targetSelector, hoverDuration, parallaxOn]);

    return (
      <div ref={cursorRef} className="target-cursor-wrapper">
        <div ref={dotRef} className="target-cursor-dot" />
        <div className="target-cursor-corner corner-tl" />
        <div className="target-cursor-corner corner-tr" />
        <div className="target-cursor-corner corner-br" />
        <div className="target-cursor-corner corner-bl" />
      </div>
    );
};
const TargetCursor = dynamic(() => Promise.resolve(TargetCursorComponent), { ssr: false });


// =========================================
// 1. AUDIO HOOKS
// =========================================

// Loader Audio Hook (Aggressive, 4.8s limit)
const useLoaderAudio = (url: string, isVisible: boolean) => {
    useEffect(() => {
        if (!isVisible) return;
        const audio = new Audio(url);
        audio.volume = 1.0;
        const AUDIO_DURATION_MS = 4800; 
        let timer: NodeJS.Timeout | null = null;

        const unlock = () => { audio.play().catch(() => {}); cleanupListeners(); };
        const cleanupListeners = () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        window.addEventListener('keydown', unlock);

        audio.play().catch(() => {});

        timer = setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            cleanupListeners(); 
        }, AUDIO_DURATION_MS);

        return () => {
            audio.pause();
            audio.currentTime = 0;
            if (timer) clearTimeout(timer);
            cleanupListeners();
        };
    }, [url, isVisible]);
};


// Shop Music Hook (Play Once Only)
const useBackgroundMusic = (url: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tune = new Audio(url);
      tune.loop = false; 
      tune.volume = 0.4; 
      audioRef.current = tune;
      
      const handleEnded = () => { setIsPlaying(false); };
      tune.addEventListener('ended', handleEnded);

      return () => {
        tune.pause();
        tune.src = "";
        tune.removeEventListener('ended', handleEnded);
      };
    }
  }, [url]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || hasPlayedOnce) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(e => console.error("Playback failed:", e));
      setIsPlaying(true);
      setHasPlayedOnce(true);
    }
  }, [isPlaying, hasPlayedOnce]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isPlaying && !hasPlayedOnce) {
      audio.play()
        .then(() => {
            setIsPlaying(true);
            setHasPlayedOnce(true);
        })
        .catch(e => console.log("Autoplay prevented by browser:", e));
    }
  }, [isPlaying, hasPlayedOnce]);

  return { isPlaying, toggle, play };
};

// =========================================
// 2. UI COMPONENTS (MusicController & SupportWidget)
// =========================================

const MusicController = ({ isPlaying, onToggle }: { isPlaying: boolean; onToggle: () => void }) => {
  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-8 left-8 z-[9999] group flex items-center justify-center w-12 h-12 rounded-full 
      transition-all duration-500 border border-[#66b3ff]/30 backdrop-blur-md
      ${isPlaying ? 'bg-[#0066ff]/20 shadow-[0_0_15px_rgba(0,102,255,0.5)]' : 'bg-gray-900/50 grayscale'}`}
    >
      {isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-50">
           {[1,2,3,4].map(i => (
             <div key={i} className="w-[3px] bg-blue-400 rounded-full animate-pulse" 
                  style={{ height: '60%', animationDuration: `${0.5 + i * 0.1}s` }} />
           ))}
        </div>
      )}
      <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
        {isPlaying ? ( <Volume2 className="w-5 h-5 text-blue-100" /> ) : ( <VolumeX className="w-5 h-5 text-gray-400" /> )}
      </div>
    </button>
  );
};

const SupportWidget = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const telegramLink = "https://t.me/+dlP_A0ebMXs3NTg0";

  return (
    <div 
      id="support-widget-container" 
      className={`fixed bottom-8 right-8 z-[9999] transition-all duration-700 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`absolute bottom-full right-0 mb-4 whitespace-nowrap px-5 py-2.5 
        bg-[#001a33]/90 backdrop-blur-xl border border-[#0066ff]/30 text-white text-sm font-medium rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] 
        transition-all duration-300 origin-bottom-right flex items-center gap-3
        ${isHovered ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0099ff] shadow-[0_0_10px_rgba(0,153,255,0.8)]"></span>
        </span>
        <span className="tracking-wide text-blue-50 font-sans">Chat Support</span>
      </div>

      <a
        href={telegramLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Support"
        className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1"
      >
        <div className={`absolute inset-0 rounded-full bg-[#0066ff] blur-[20px] transition-all duration-500 
          ${isHovered ? 'opacity-80 scale-125' : 'opacity-40 scale-110 animate-pulse'}`} 
        />
        <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-[#0033cc] via-[#0066ff] to-[#3399ff] rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_6px_rgba(0,0,0,0.3)] overflow-hidden z-10 border border-[#66b3ff]/50">
            <div className="absolute inset-0 -translate-x-[150%] animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-15deg] z-20 pointer-events-none" />
            <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none z-20" />
            <div className={`relative z-30 transition-transform duration-500 ease-spring ${isHovered ? 'rotate-12 scale-110' : 'rotate-0'}`}>
                <MessageCircle className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" strokeWidth={2.5} />
            </div>
            <span className="absolute top-3.5 right-3.5 flex h-3 w-3 z-40">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white/20 shadow-sm"></span>
            </span>
        </div>
      </a>
    </div>
  );
};

const CursorStyles = () => (
  <style jsx global>{`
    .target-cursor-wrapper {
      position: fixed; top: 0; left: 0; z-index: 10000; pointer-events: none;
      will-change: transform;
    }
    .target-cursor-dot {
      width: 8px; height: 8px; 
      background-color: #0066ff; 
      border-radius: 50%;
      position: absolute; top: 0; left: 0; 
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px #0066ff;
    }
    .target-cursor-corner {
      position: absolute; width: 16px; height: 16px; 
      border: 2px solid #0066ff;
      box-shadow: 0 0 4px rgba(0, 102, 255, 0.4);
      will-change: transform;
    }
    .corner-tl { top: -10px; left: -10px; border-right: none; border-bottom: none; }
    .corner-tr { top: -10px; right: -10px; border-left: none; border-bottom: none; }
    .corner-br { bottom: -10px; right: -10px; border-left: none; border-top: none; }
    .corner-bl { bottom: -10px; left: -10px; border-right: none; border-top: none; }

    @keyframes shimmer {
      0% { transform: translateX(-150%) skewX(-15deg); }
      50%, 100% { transform: translateX(150%) skewX(-15deg); }
    }
    .animate-shimmer {
      animation: shimmer 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
  `}</style>
);

// =========================================
// 5. MAIN PAGE COMPONENT
// =========================================
export default function ShopPage() {
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // 1. Audio Hooks
  const { isPlaying, toggle, play } = useBackgroundMusic('/shop.mp3');
  useLoaderAudio('/modals.mp3', !isUnlocked);

  // 2. Unlock Handler - The critical point for initiating main audio playback
  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
    // CRITICAL: Call play() here, authorized by the user's interaction
    play(); 
  }, [play]);

  // If the website is NOT unlocked, show the Recruit Page (Loader)
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        {/* RecruitPage handles the visual loading and the user click to unlock */}
        <RecruitPage onUnlock={handleUnlock} />
      </main>
    );
  }

  // Once unlocked, show the Shop content
  return (
    <ShopProvider>
      <div className="relative min-h-screen bg-slate-950 text-white animate-in fade-in duration-1000">

        {/* 1. STYLES & CURSOR */}
        <CursorStyles />
        <TargetCursor
          hideDefaultCursor={true}
          spinDuration={2}
          parallaxOn={true}
        />

        {/* 2. MUSIC CONTROLLER */}
        <MusicController isPlaying={isPlaying} onToggle={toggle} />

        {/* 3. SUPPORT WIDGET */}
        <SupportWidget />

        {/* 4. CONTENT */}
        <div className="relative z-10">
          <Socials />
          
          <HeroShop />

          <div ref={productsRef}>
            <ProductsSection />
            <ShopFunnel />
            <Shopmain />
          </div>
        </div>

      </div>
    </ShopProvider>
  );
}