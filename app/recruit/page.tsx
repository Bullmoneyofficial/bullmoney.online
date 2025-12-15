"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { gsap } from "gsap";
import { Volume2, VolumeX } from 'lucide-react'; // Required for the controller

// --- CORE STATIC IMPORTS ---
import { MultiStepLoader } from "@/components/Mainpage/MultiStepLoaderAffiliate"; 
import RecruitPage from "@/app/register/New"; 
import Socials from "@/components/Mainpage/Socialsfooter"; 

// --- DYNAMIC IMPORTS ---
const Shopmain = dynamic(() => import("@/components/Mainpage/ShopMainpage"), { ssr: false });
const AffiliateAdmin = dynamic(() => import("@/app/register/AffiliateAdmin"), { ssr: false });
const AffiliateRecruitsDashboard = dynamic(() => import("@/app/recruit/AffiliateRecruitsDashboard"), { ssr: false });


// =========================================
// 0. CURSOR LOGIC & UTILITIES
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

const TargetCursorComponent: React.FC<any> = ({ targetSelector, spinDuration, hideDefaultCursor, hoverDuration = 0.3, parallaxOn }) => {
    const isMobile = useIsMobile();
    const cursorRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null);
    
    const state = useRef({ isActive: false, activeTarget: null as Element | null });

    useEffect(() => {
      if (!cursorRef.current || typeof window === 'undefined') return;

      if (hideDefaultCursor && !isMobile) {
        document.body.classList.add('custom-cursor-active');
      }
      
      cornersRef.current = cursorRef.current.querySelectorAll('.target-cursor-corner');

      const ctx = gsap.context(() => {
          const cursor = cursorRef.current!;
          const corners = cornersRef.current!;
          const dot = dotRef.current!; 

          if (isMobile) {
              gsap.set(cursor, { x: window.innerWidth/2, y: window.innerHeight/2, opacity: 0, scale: 1.3 });
              gsap.to(cursor, { opacity: 1, duration: 0.5 });
          }
          else {
              gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
              
              const spinTl = gsap.timeline({ repeat: -1 })
                  .to(cursor, { rotation: spinDuration ? 360 : 0, duration: spinDuration || 1, ease: 'none' });

              const moveCursor = (e: MouseEvent) => {
                  if (state.current.isActive) return;
                  gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: 'power3.out', force3D: true });
              };
              window.addEventListener('mousemove', moveCursor);
              
              const handleDown = () => {
                  gsap.to(dot, { scale: 0.5, duration: 0.2 });
                  gsap.to(corners, { scale: 1.2, borderColor: '#00ffff', duration: 0.2 });
              };
              const handleUp = () => {
                  gsap.to(dot, { scale: 1, duration: 0.2 });
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
                      
                      gsap.to(cursor, { 
                          x: rect.left + rect.width / 2, 
                          y: rect.top + rect.height / 2, 
                          duration: 0.3 
                      });
                      
                      const padding = 10;
                      const width = rect.width + padding;
                      const height = rect.height + padding;

                      gsap.to(corners[0], { x: -width/2, y: -height/2, duration: 0.3 }); // TL
                      gsap.to(corners[1], { x: width/2, y: -height/2, duration: 0.3 });  // TR
                      gsap.to(corners[2], { x: width/2, y: height/2, duration: 0.3 });   // BR
                      gsap.to(corners[3], { x: -width/2, y: height/2, duration: 0.3 });  // BL

                      const handleLeave = () => {
                          target.removeEventListener('mouseleave', handleLeave);
                          state.current.activeTarget = null;
                          state.current.isActive = false;
                          
                          gsap.to(corners, { x: 0, y: 0, duration: 0.3 });
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
          window.removeEventListener('mousedown', () => {});
          window.removeEventListener('mouseup', () => {});
          window.removeEventListener('mouseover', () => {});
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
// 1. CUSTOM HOOKS (Audio)
// =========================================

// Hook 1: Loader Audio (Fixed 4.8s duration)
const useLoaderAudio = (url: string, isVisible: boolean) => {
    useEffect(() => {
        if (!isVisible) return;
        const audio = new Audio(url);
        audio.loop = false;
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

        const attemptPlay = async () => {
            try {
                await audio.play();
                cleanupListeners();
            } catch (err) { /* Play blocked, listeners are waiting */ }
        };
        attemptPlay();

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

// Hook 2: Background Loop (Starts manually or via effect)
const useBackgroundLoop = (url: string) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
  
    useEffect(() => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.01; 
      audioRef.current = audio;
  
      return () => {
        audio.pause();
        audio.src = "";
      };
    }, [url]);
  
    const start = useCallback(() => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.volume = 0.01; 
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }, []);
  
    const toggle = useCallback(() => {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.volume = 0.01; 
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, [isPlaying]);
  
    return { isPlaying, start, toggle };
};

// =========================================
// 2. UI COMPONENTS
// =========================================

const MusicController = ({ isPlaying, onToggle }: { isPlaying: boolean; onToggle: () => void }) => (
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
        {isPlaying ? <Volume2 className="w-5 h-5 text-blue-100" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
      </div>
    </button>
);

// =========================================
// 3. STYLES
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

    body.custom-cursor-active { cursor: none !important; }
    
    .loader-overlay-wrapper {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        z-index: 999999; pointer-events: all; background-color: black;
    }
  `}</style>
);

// ==========================================
// 4. MAIN PAGE COMPONENT
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

  // 1. Initialize Audio Hooks
  useLoaderAudio('/modals.mp3', loading); 
  const { isPlaying, start: startBgLoop, toggle: toggleBgLoop } = useBackgroundLoop('/background.mp3');

  // Scroll Lock
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [loading]);

  // Navigation & Audio Transition Logic
  useEffect(() => {
    if (searchParams?.src !== "nav") {
      router.push("/");
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
        // 2. Start the ambient loop immediately after loader finishes
        startBgLoop(); 
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, startBgLoop]);

  if (searchParams?.src !== "nav") return null; 

  return (
    <>
      <CursorStyles />
      
      {/* Loader Wrapper */}
      {loading && (
        <div className="loader-overlay-wrapper">
          <MultiStepLoader 
            loadingStates={affiliateLoadingStates} 
            loading={loading} 
            duration={1000} 
          />
        </div>
      )}

      <TargetCursor 
        hideDefaultCursor={true}
        spinDuration={2}
        parallaxOn={true}
        targetSelector="button, a, input, [role='button'], .cursor-target"
      />
      
      {/* 3. Audio Controller (Only visible when dashboard is live) */}
      {!loading && (
        <MusicController isPlaying={isPlaying} onToggle={toggleBgLoop} />
      )}
      
      {/* Content */}
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