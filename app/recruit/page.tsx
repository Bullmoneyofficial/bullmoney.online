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

// --- LOADER IMPORT ---
import { MultiStepLoader } from "@/components/Mainpage/MultiStepLoaderAffiliate"; 

// --- DYNAMIC IMPORTS ---
const TargetCursorComponent: React.FC<any> = ({ targetSelector, spinDuration, hideDefaultCursor, hoverDuration, parallaxOn }) => {
  const isMobile = useIsMobile();
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
  
  // Omitted cursor logic for brevity, keeping structure...
  useEffect(() => {
    if (!cursorRef.current || typeof window === 'undefined') return;

    if (hideDefaultCursor && !isMobile) {
      document.body.classList.add('custom-cursor-active');
    }

    cornersRef.current = cursorRef.current.querySelectorAll('.target-cursor-corner');

    const ctx = gsap.context(() => {
        const cursor = cursorRef.current!;
        const corners = cornersRef.current!;

        if (isMobile) {
            gsap.set(cursor, { x: window.innerWidth/2, y: window.innerHeight/2, opacity: 0, scale: 1.3 });
            // ... mobile logic ...
        }
        else {
            gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
            const moveCursor = (e: MouseEvent) => {
                gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power3.out', force3D: true });
            };
            window.addEventListener('mousemove', moveCursor);
            // ... desktop logic ...
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

// *** AUDIO HOOK: PLAYS ONCE PER APPEARANCE ***
const useLoaderAudio = (url: string, isVisible: boolean) => {
    useEffect(() => {
        // Stop everything if the modal/loader is not showing
        if (!isVisible) return;

        // 1. Initialize Audio
        const audio = new Audio(url);
        audio.loop = false; // CRITICAL: Ensures it only plays once
        audio.volume = 1.0;
        
        const AUDIO_DURATION_MS = 4800; // Duration of your loader sound
        let timer: NodeJS.Timeout | null = null;

        // 2. Interaction Listener (Fallback if autoplay fails)
        const unlock = () => {
            audio.play().catch(() => {});
            cleanupListeners(); // Remove listeners immediately after first interaction
        };

        // 3. Cleanup Listeners Helper
        const cleanupListeners = () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('keydown', unlock);
        };

        // 4. Attach listeners IMMEDIATELY (Race Condition)
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        window.addEventListener('keydown', unlock);

        // 5. Attempt Instant Autoplay
        const attemptPlay = async () => {
            try {
                await audio.play();
                // If autoplay succeeded, we don't need the interaction listeners anymore
                cleanupListeners();
            } catch (err) {
                // If blocked, the listeners in step #4 are already waiting.
            }
        };

        attemptPlay();

        // 6. Hard stop after 4.8 seconds (prevents looping/trailing audio)
        timer = setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            cleanupListeners(); 
        }, AUDIO_DURATION_MS);

        // 7. Cleanup on Unmount OR when isVisible becomes false
        // This ensures if the modal closes, audio cuts instantly.
        return () => {
            audio.pause();
            audio.currentTime = 0;
            if (timer) clearTimeout(timer);
            cleanupListeners();
        };
    }, [url, isVisible]); // Re-runs every time 'isVisible' toggles to true
};
// **********************************

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
    
    /* ADDED: Loader Overlay Class */
    .loader-overlay-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 999999; /* Forces it above NavBar */
        pointer-events: all; /* Captures all clicks/scrolls */
        background-color: black; /* Optional: ensures no content bleed-through */
    }
  `}</style>
);

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================

const affiliateLoadingStates = [
  { text: "ESTABLISHING SECURE CONNECTION" },
  { text: "VERIFYING AFFILIATE PROTOCOLS" },
  { text: "SYNCING RECRUIT DATABASE" },
  { text: "DECRYPTING DASHBOARD ACCESS" },
  { text: "WELCOME, ADMIN" },
];

export default function Page({ searchParams }: { searchParams?: { src?: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // *** ACTIVATE AUDIO HOOK ***
  // Logic: When 'loading' is true, play modals.mp3 instantly.
  // It handles autoplay restrictions and stops after 4.8s.
  useLoaderAudio('/modals.mp3', loading);

  // ----------------------------------------------------
  // ADDED: SCROLL LOCK EFFECT
  // ----------------------------------------------------
  useEffect(() => {
    if (loading) {
      // Disable scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh'; // Ensures mobile browsers don't collapse UI
    } else {
      // Re-enable scrolling
      document.body.style.overflow = '';
      document.body.style.height = '';
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [loading]);

  useEffect(() => {
    if (searchParams?.src !== "nav") {
      router.push("/");
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  if (searchParams?.src !== "nav") {
    return null; 
  }

  return (
    <>
      <CursorStyles />
      
      {/* ADDED: Wrapper Div for Loader */}
      {loading && (
        <div className="loader-overlay-wrapper">
          <MultiStepLoader 
            loadingStates={affiliateLoadingStates} 
            loading={loading} 
            duration={1000} 
          />
        </div>
      )}

      {/* Target Cursor Component */}
      <TargetCursor 
        hideDefaultCursor={true}
        spinDuration={2}
        parallaxOn={true}
        targetSelector="button, a, input, [role='button'], .cursor-target"
      />
      
      {/* Content under loader */}
      <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
        <Socials />
        <Shopmain />
        <RecruitPage onUnlock={() => {}} />
        <AffiliateRecruitsDashboard onBack={() => router.push("/")} />
        <AffiliateAdmin />
      </div>
    </>
  );
}