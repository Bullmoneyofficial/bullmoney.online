"use client";

import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { gsap } from "gsap";

// --- EXISTING IMPORTS ---
import Shopmain from "@/components/Mainpage/ShopMainpage";
import RecruitPage from "@/app/register/New";
import Socials from "@/components/Mainpage/Socialsfooter";
import AffiliateAdmin from "@/app/register/AffiliateAdmin";
import AffiliateRecruitsDashboard from "@/app/recruit/AffiliateRecruitsDashboard";

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
// 1. STYLES (Optimized Blue Brackets)
// =========================================
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

    /* Hide Default Cursor only when custom one is active */
    body.custom-cursor-active {
      cursor: none !important;
    }
  `}</style>
);

// =========================================
// 2. TARGET CURSOR LOGIC
// =========================================

interface TargetCursorProps {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
}

const TargetCursorComponent: React.FC<TargetCursorProps> = ({ 
    targetSelector = 'button, a, input, [role="button"], .cursor-target', 
    spinDuration = 2,
    hideDefaultCursor = true,
    hoverDuration = 0.2,
    parallaxOn = true
}) => {
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

    // Handle cursor visibility
    if (hideDefaultCursor && !isMobile) {
      document.body.classList.add('custom-cursor-active');
    }

    // Get refs
    cornersRef.current = cursorRef.current.querySelectorAll('.target-cursor-corner');

    const ctx = gsap.context(() => {
        const cursor = cursorRef.current!;
        const corners = cornersRef.current!;

        // ----------------------------------------------------
        // MOBILE LOGIC: SYSTEMATIC SCANNER
        // ----------------------------------------------------
        if (isMobile) {
            // Init
            gsap.set(cursor, { x: window.innerWidth/2, y: window.innerHeight/2, opacity: 0, scale: 1.3 });
            gsap.to(cursor, { opacity: 1, duration: 0.5 });

            // Visual Pulse
            const tapEffect = () => {
                gsap.to(corners, { scale: 1.6, borderColor: '#00ffff', duration: 0.15, yoyo: true, repeat: 1 });
                gsap.to(dotRef.current, { scale: 2, backgroundColor: '#ffffff', duration: 0.15, yoyo: true, repeat: 1 });
            };

            const runScanner = async () => {
                // Find all clickable elements inside Shopmain, RecruitPage, etc.
                const allElements = Array.from(document.querySelectorAll(targetSelector));

                const targets = allElements.filter(el => {
                    const r = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return (
                        style.display !== 'none' && 
                        style.visibility !== 'hidden' && 
                        style.opacity !== '0' &&
                        r.width > 20 && r.height > 20 && 
                        r.top >= 0 && r.left >= 0 
                    );
                }).sort((a, b) => {
                    const ra = a.getBoundingClientRect();
                    const rb = b.getBoundingClientRect();
                    return ra.top - rb.top || ra.left - rb.left;
                });

                if (targets.length > 0) {
                    for (const target of targets) {
                        const r = target.getBoundingClientRect();
                        if (r.top < -50 || r.bottom > window.innerHeight + 50) continue; 

                        await new Promise<void>(resolve => {
                            gsap.to(cursor, {
                                x: r.left + r.width / 2,
                                y: r.top + r.height / 2,
                                duration: 0.8,
                                ease: "power2.inOut",
                                onComplete: () => {
                                    tapEffect(); 
                                    setTimeout(resolve, 600); 
                                }
                            });
                        });
                    }
                    runScanner(); 
                } else {
                    // Fallback roaming
                    gsap.to(cursor, {
                        x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
                        y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
                        duration: 2,
                     onComplete: () => { runScanner(); }
                    });
                }
            };

            setTimeout(runScanner, 1000);
        }

        // ----------------------------------------------------
        // DESKTOP LOGIC: MAGNETIC + ANIMATED
        // ----------------------------------------------------
        else {
            gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

            const spinTl = gsap.timeline({ repeat: -1 })
                .to(cursor, { rotation: 360, duration: spinDuration, ease: 'none' });

            const moveCursor = (e: MouseEvent) => {
                gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power3.out', force3D: true });
            };
            window.addEventListener('mousemove', moveCursor);

            // Clicks
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

            // Magnetic Ticker
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
                    
                    gsap.to(corner, { x: finalX, y: finalY, duration: 0.1, overwrite: 'auto', force3D: true });
                });
            });

            // Hover Events
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
        document.body.classList.remove('custom-cursor-active');
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

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

export default function Page({ searchParams }: { searchParams?: { src?: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Check access logic
    if (searchParams?.src !== "nav") {
      router.push("/");
    }
  }, [searchParams, router]);

  // Authorization Check
  if (searchParams?.src !== "nav") {
    return null; 
  }

  return (
    <>
      <CursorStyles />
      <TargetCursor 
        hideDefaultCursor={true}
        spinDuration={2}
        parallaxOn={true}
        targetSelector="button, a, input, [role='button'], .cursor-target"
      />
      
      <Socials />
      <Shopmain />
      
      <RecruitPage onUnlock={() => {}} />
      <AffiliateRecruitsDashboard onBack={() => router.push("/")} />
      <AffiliateAdmin />
    </>
  );
}