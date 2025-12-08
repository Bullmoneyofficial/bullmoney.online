"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MessageCircle } from 'lucide-react';

// --- COMPONENTS (Keep your existing imports) ---
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
      // Robust mobile detection
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
// 1. SUPPORT WIDGET (With ID for targeting)
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
      id="support-widget-container" // ID Added for Cursor Targeting
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
// 2. STYLES (Unified Blue Square Look)
// =========================================
const CursorStyles = () => (
  <style jsx global>{`
    .target-cursor-wrapper {
      position: fixed; 
      top: 0; left: 0; 
      z-index: 10000; 
      pointer-events: none;
      will-change: transform; /* Performance Boost */
    }
    .target-cursor-dot {
      width: 6px; height: 6px; 
      background-color: #0066ff; 
      border-radius: 50%;
      position: absolute; top: 0; left: 0; 
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px #0066ff;
    }
    .target-cursor-corner {
      position: absolute; 
      width: 14px; height: 14px; 
      border: 2px solid #0066ff;
      box-shadow: 0 0 4px rgba(0, 102, 255, 0.4);
      will-change: transform;
    }
    /* Corner Positioning */
    .corner-tl { top: -8px; left: -8px; border-right: none; border-bottom: none; }
    .corner-tr { top: -8px; right: -8px; border-left: none; border-bottom: none; }
    .corner-br { bottom: -8px; right: -8px; border-left: none; border-top: none; }
    .corner-bl { bottom: -8px; left: -8px; border-right: none; border-top: none; }

    /* Shimmer for Support Button */
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
// 3. TARGET CURSOR LOGIC (Dual Mode)
// =========================================

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
  const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
  
  // Logic State
  const state = useRef({
      isActive: false,
      targetPositions: null as { x: number; y: number }[] | null,
      activeStrength: { val: 0 },
      activeTarget: null as Element | null
  });

  useEffect(() => {
    if (!cursorRef.current || typeof window === 'undefined') return;

    // --- SETUP VISUALS ---
    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) document.body.style.cursor = 'none';
    
    // Cache corner refs
    cornersRef.current = cursorRef.current.querySelectorAll('.target-cursor-corner');

    const ctx = gsap.context(() => {
        const cursor = cursorRef.current!;
        const corners = cornersRef.current!;

        // ------------------------------------------
        // MODE A: MOBILE AUTO-PILOT (Screenshot Path)
        // ------------------------------------------
        if (isMobile) {
            // Start center
            gsap.set(cursor, { x: window.innerWidth / 2, y: window.innerHeight / 2, opacity: 0, scale: 0.5 });
            gsap.to(cursor, { opacity: 1, scale: 1, duration: 0.8 });

            // Helper to expand/contract corners (Pulse Effect)
            const pulseCorners = () => {
                const tl = gsap.timeline();
                tl.to(corners, { x: (i) => [ -5, 5, 5, -5 ][i], y: (i) => [ -5, -5, 5, 5 ][i], duration: 0.2 })
                  .to(corners, { x: 0, y: 0, duration: 0.2 });
                return tl;
            };

            const autoPilotTour = () => {
                // 1. Define High Value Targets based on Screenshot
                // Try to find the Nav, The Center, and The Support Button
                const navTarget = document.querySelector('nav') || document.querySelector('header');
                const supportTarget = document.querySelector('#support-widget-container');
                const centerButtons = Array.from(document.querySelectorAll('button, a.btn-primary'));
                
                // Find a visible center button
                const mainTarget = centerButtons.find(el => {
                    const r = el.getBoundingClientRect();
                    return r.top > 100 && r.top < window.innerHeight / 2 + 100;
                }) || { getBoundingClientRect: () => ({ left: window.innerWidth/2 - 20, top: window.innerHeight/2 - 20, width: 40, height: 40 }) };

                // Build the Tour Timeline
                const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });

                // PATH 1: Go to Nav (Top)
                if (navTarget) {
                    const r = navTarget.getBoundingClientRect();
                    masterTl.to(cursor, { 
                        x: r.left + r.width - 50, // Top Right (Menu area)
                        y: r.top + (r.height / 2) + 20, 
                        duration: 1.5, 
                        ease: "power2.inOut",
                        force3D: true
                    })
                    .add(pulseCorners()); // Scan effect
                }

                // PATH 2: Go to Center Content (VIP/Hero)
                if (mainTarget) {
                    const r = (mainTarget as Element).getBoundingClientRect();
                    masterTl.to(cursor, { 
                        x: r.left + r.width / 2, 
                        y: r.top + r.height / 2, 
                        duration: 1.2, 
                        ease: "power2.inOut",
                        force3D: true
                    })
                    .add(pulseCorners()); // Lock-on effect
                }

                // PATH 3: Go to Support (Bottom Right)
                if (supportTarget) {
                    const r = supportTarget.getBoundingClientRect();
                    masterTl.to(cursor, { 
                        x: r.left + r.width / 2, 
                        y: r.top + r.height / 2, 
                        duration: 1.5, 
                        ease: "power2.inOut",
                        force3D: true
                    })
                    .add(pulseCorners()); // Lock-on effect
                }

                // PATH 4: Return to Center (Loop smoothly)
                masterTl.to(cursor, { 
                    x: window.innerWidth / 2, 
                    y: window.innerHeight / 2, 
                    duration: 1.5, 
                    ease: "sine.inOut" 
                });
            };

            // Start Tour
            setTimeout(autoPilotTour, 1000);
        }

        // ------------------------------------------
        // MODE B: DESKTOP MOUSE FOLLOW (Interactive)
        // ------------------------------------------
        else {
            // Initial positioning
            gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

            // 1. Spin Animation (Only corners spin for bracket effect)
            const spinTl = gsap.timeline({ repeat: -1 })
                .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });

            // 2. Mouse Movement
            const moveCursor = (e: MouseEvent) => {
                gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power3.out', force3D: true });
            };
            window.addEventListener('mousemove', moveCursor);

            // 3. Click Effects
            const handleDown = () => {
                gsap.to(dotRef.current, { scale: 0.5, duration: 0.2 });
                gsap.to(corners, { scale: 0.8, duration: 0.2 });
            };
            const handleUp = () => {
                gsap.to(dotRef.current, { scale: 1, duration: 0.2 });
                gsap.to(corners, { scale: 1, duration: 0.2 });
            };
            window.addEventListener('mousedown', handleDown);
            window.addEventListener('mouseup', handleUp);

            // 4. Magnetic/Targeting Logic
            gsap.ticker.add(() => {
                if (!state.current.isActive || !state.current.targetPositions) return;
                const strength = state.current.activeStrength.val;
                if (strength <= 0) return;

                const cursorX = gsap.getProperty(cursor, 'x') as number;
                const cursorY = gsap.getProperty(cursor, 'y') as number;

                // Move corners to target
                corners.forEach((corner, i) => {
                    const currentX = gsap.getProperty(corner, 'x') as number;
                    const currentY = gsap.getProperty(corner, 'y') as number;
                    const targetX = state.current.targetPositions![i].x - cursorX;
                    const targetY = state.current.targetPositions![i].y - cursorY;

                    const finalX = currentX + (targetX - currentX) * strength;
                    const finalY = currentY + (targetY - currentY) * strength;
                    
                    gsap.to(corner, { x: finalX, y: finalY, duration: 0.1, overwrite: 'auto', force3D: true });
                });
            });

            // 5. Hover Events
            const handleHover = (e: MouseEvent) => {
                const target = (e.target as Element).closest(targetSelector);
                if (target && target !== state.current.activeTarget) {
                    state.current.activeTarget = target;
                    state.current.isActive = true;
                    spinTl.pause();
                    gsap.to(cursor, { rotation: 0, duration: 0.3 }); // Reset rotation

                    const rect = target.getBoundingClientRect();
                    const borderWidth = 4; const cornerSize = 14;

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
                        
                        // Reset corners to square
                        const cSize = 14;
                        const pos = [
                            { x: -8, y: -8 }, { x: -8, y: -8 }, // Offsets handled by CSS, reset transforms
                            { x: -8, y: -8 }, { x: -8, y: -8 }
                        ];
                        // Reset transforms
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
        document.body.style.cursor = originalCursor;
        ctx.revert();
        window.removeEventListener('mousemove', () => {}); 
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