"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MessageCircle } from 'lucide-react';

// --- COMPONENTS ---
import { Features } from "@/components/Mainpage/features";
import { Hero } from "@/components/Mainpage/hero";
import { Pricing } from "../components/Mainpage/pricing"; 
import Shopmain from "../components/Mainpage/ShopMainpage"; 
import Socialsfooter from "../components/Mainpage/Socialsfooter";
import RegisterPage from "./register/pagemode"; 
import Heromain from "../app/VIP/heromain"; 
import ShopFunnel from "../app/shop/ShopFunnel"; 
import Chartnews from "@/app/Blogs/Chartnews";

// --- DYNAMIC IMPORTS ---
const TargetCursor = dynamic(() => Promise.resolve(TargetCursorComponent), { 
  ssr: false 
});

// =========================================
// 0. CUSTOM HOOKS
// =========================================

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

// =========================================
// 1. SUPPORT WIDGET
// =========================================
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

// =========================================
// 2. STYLES (UPDATED FOR MOBILE TARGET LOOK)
// =========================================
const CursorStyles = () => (
  <style jsx global>{`
    /* --- DESKTOP STYLES --- */
    .target-cursor-wrapper {
      position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none;
    }
    .target-cursor-dot {
      width: 8px; height: 8px; background-color: #0066ff; border-radius: 50%;
      position: absolute; top: 0; left: 0; transform: translate(-50%, -50%);
    }
    .target-cursor-corner {
      position: absolute; width: 12px; height: 12px; border: 2px solid #0066ff;
    }
    .corner-tl { top: -6px; left: -6px; border-right: none; border-bottom: none; }
    .corner-tr { top: -6px; right: -6px; border-left: none; border-bottom: none; }
    .corner-br { bottom: -6px; right: -6px; border-left: none; border-top: none; }
    .corner-bl { bottom: -6px; left: -6px; border-right: none; border-top: none; }

    /* --- MOBILE TARGET STYLES --- */
    .mobile-target-container {
        pointer-events: none;
        position: fixed;
        top: 0; left: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .mobile-target-ring {
        position: absolute;
        width: 32px; height: 32px;
        border: 1px dashed #0088ff;
        border-radius: 50%;
        animation: spin-slow 4s linear infinite;
    }
    .mobile-target-inner-dot {
        width: 4px; height: 4px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 10px #0066ff;
    }
    .mobile-target-crosshair {
        position: absolute;
        background: #0066ff;
        opacity: 0.5;
    }
    .mt-h { width: 40px; height: 1px; }
    .mt-v { width: 1px; height: 40px; }

    /* --- ANIMATIONS --- */
    @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
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
// 3. TARGET CURSOR LOGIC (FIXED MOBILE)
// =========================================

// --- A. Mobile Auto Pilot (Visual & Logic Fix) ---
const MobileAutoPilotCursor = () => {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 1. Safety Check & Initial Positioning
        if (!cursorRef.current || typeof window === 'undefined') return;

        const ctx = gsap.context(() => {
            // Start at center, hidden, then fade in
            gsap.set(cursorRef.current, { 
                x: window.innerWidth / 2, 
                y: window.innerHeight / 2, 
                opacity: 0,
                scale: 0.5
            });
            gsap.to(cursorRef.current, { opacity: 1, scale: 1, duration: 0.8, delay: 0.5 });

            const autoPilot = () => {
                // 2. Find Valid Targets
                const allTargets = Array.from(document.querySelectorAll('button, a, input, [role="button"], .cursor-target'));
                
                // 3. Strict Filtering (Prevents getting stuck on hidden menu items)
                const visibleTargets = allTargets.filter((el) => {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    
                    return (
                        style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        style.opacity !== '0' &&
                        rect.width > 10 &&       
                        rect.height > 10 &&
                        rect.top >= 60 &&        // Buffer from top (nav bar)
                        rect.left >= 0 &&
                        rect.bottom <= (window.innerHeight - 60) && // Buffer from bottom
                        rect.right <= window.innerWidth
                    );
                });

                if (visibleTargets.length > 0) {
                    // --- MODE A: LOCK ON TARGET ---
                    const randomTarget = visibleTargets[Math.floor(Math.random() * visibleTargets.length)];
                    const rect = randomTarget.getBoundingClientRect();
                    const targetX = rect.left + rect.width / 2;
                    const targetY = rect.top + rect.height / 2;

                    // Sequence: Move -> Pause/Pulse -> Next
                    const tl = gsap.timeline({
                        onComplete: () => { setTimeout(autoPilot, 600); }
                    });

                    tl.to(cursorRef.current, {
                        x: targetX,
                        y: targetY,
                        duration: 1.2 + Math.random(), // Variable speed
                        ease: "power2.inOut"
                    })
                    // "Locked On" Effect
                    .to(cursorRef.current, { scale: 1.5, duration: 0.2, yoyo: true, repeat: 1 }, "-=0.2") 
                    .to(".mobile-target-ring", { borderColor: "#00ffff", duration: 0.2 }, "<")
                    .to(".mobile-target-ring", { borderColor: "#0088ff", duration: 0.2 });

                } else {
                    // --- MODE B: ROAMING (No targets found) ---
                    // Moves to a random spot within the central 60% of the screen
                    const roamX = (window.innerWidth * 0.2) + (Math.random() * window.innerWidth * 0.6);
                    const roamY = (window.innerHeight * 0.2) + (Math.random() * window.innerHeight * 0.6);

                    gsap.to(cursorRef.current, {
                        x: roamX,
                        y: roamY,
                        duration: 2.5,
                        ease: "sine.inOut",
                        onComplete: autoPilot
                    });
                }
            };

            autoPilot();
        }, cursorRef); 

        return () => ctx.revert();
    }, []);

    // New Visuals: A Crosshair / Target Reticle
    return (
        <div ref={cursorRef} className="mobile-target-container">
            <div className="mobile-target-ring" />
            <div className="mobile-target-crosshair mt-h" />
            <div className="mobile-target-crosshair mt-v" />
            <div className="mobile-target-inner-dot" />
        </div>
    );
};

// --- B. Desktop & Main Component ---
interface TargetCursorProps {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
}

const TargetCursorComponent: React.FC<TargetCursorProps> = ({ 
    targetSelector = 'button, a, .cursor-target', 
    spinDuration = 2,
    hideDefaultCursor = true,
    hoverDuration = 0.2,
    parallaxOn = true
}) => {
  const isMobile = useIsMobile();
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  
  const state = useRef({
      isActive: false,
      targetPositions: null as { x: number; y: number }[] | null,
      activeStrength: { val: 0 },
      activeTarget: null as Element | null
  });

  // --- DESKTOP LOGIC ---
  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) document.body.style.cursor = 'none';

    const ctx = gsap.context(() => {
        const cursor = cursorRef.current!;
        const corners = cursor.querySelectorAll('.target-cursor-corner');

        gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

        const spinTl = gsap.timeline({ repeat: -1 })
            .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });

        const moveCursor = (e: MouseEvent) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power3.out' });
        };
        window.addEventListener('mousemove', moveCursor);

        const handleDown = () => {
            gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 });
            gsap.to(cursor, { scale: 0.9, duration: 0.2 });
        };
        const handleUp = () => {
            gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
            gsap.to(cursor, { scale: 1, duration: 0.2 });
        };
        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);

        gsap.ticker.add(() => {
            if (!state.current.isActive || !state.current.targetPositions) return;
            const strength = state.current.activeStrength.val;
            if (strength <= 0) return;

            const cursorX = gsap.getProperty(cursor, 'x') as number;
            const cursorY = gsap.getProperty(cursor, 'y') as number;

            corners.forEach((corner, i) => {
                const currentX = gsap.getProperty(corner, 'x') as number;
                const currentY = gsap.getProperty(corner, 'y') as number;
                const targetX = state.current.targetPositions![i].x - cursorX;
                const targetY = state.current.targetPositions![i].y - cursorY;
                const finalX = currentX + (targetX - currentX) * strength;
                const finalY = currentY + (targetY - currentY) * strength;
                const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;
                
                gsap.to(corner, {
                    x: finalX, y: finalY, duration: duration,
                    ease: duration === 0 ? 'none' : 'power1.out', overwrite: 'auto'
                });
            });
        });

        const handleHover = (e: MouseEvent) => {
             const target = (e.target as Element).closest(targetSelector);
             if (target && target !== state.current.activeTarget) {
                 state.current.activeTarget = target;
                 state.current.isActive = true;
                 spinTl.pause();
                 gsap.to(cursor, { rotation: 0, duration: 0.3 });

                 const rect = target.getBoundingClientRect();
                 const borderWidth = 3; 
                 const cornerSize = 12;

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
                     
                     const cSize = 12;
                     const pos = [
                        { x: -cSize * 1.5, y: -cSize * 1.5 }, { x: cSize * 0.5, y: -cSize * 1.5 },
                        { x: cSize * 0.5, y: cSize * 0.5 }, { x: -cSize * 1.5, y: cSize * 0.5 }
                     ];
                     corners.forEach((c, i) => gsap.to(c, { ...pos[i], duration: 0.3, ease: 'power3.out' }));
                     spinTl.restart();
                 };
                 target.addEventListener('mouseleave', handleLeave);
             }
        };
        window.addEventListener('mouseover', handleHover);

    }, cursorRef); 

    return () => {
        document.body.style.cursor = originalCursor;
        ctx.revert();
        window.removeEventListener('mousemove', () => {}); 
    };
  }, [isMobile, hideDefaultCursor, spinDuration, targetSelector, hoverDuration, parallaxOn]);

  if (isMobile) return <MobileAutoPilotCursor />;

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


// =========================================
// 4. MAIN APP COMPONENT
// =========================================
export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  // If the website is NOT unlocked, show the Register Page
  if (!isUnlocked) {
    return (
      <main>
        <Analytics/>
        <SpeedInsights />
        <RegisterPage onUnlock={() => setIsUnlocked(true)} />
      </main>
    );
  }

  // Once unlocked, show the rest of the website
  return (
    <main className="animate-in fade-in duration-1000 relative">
      <CursorStyles />
      <TargetCursor hideDefaultCursor={true} spinDuration={2} parallaxOn={true} />
      <SupportWidget />
      <div className="relative z-10">
        <Analytics/>
        <SpeedInsights />
        <Socialsfooter />
        <Heromain />
        <ShopFunnel />
        <Shopmain />
        <Pricing />
        <Chartnews />
        <Features />
      </div>
    </main>
  );
}