"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { Volume2, VolumeX, X } from 'lucide-react'; 

// --- CORE STATIC IMPORTS ---
import { MultiStepLoader } from "@/components/Mainpage/MultiStepLoaderAffiliate"; 
import RecruitPage from "@/app/register/New"; 
import Socials from "@/components/Mainpage/Socialsfooter"; 

// --- NEW IMPORTS FOR THEME SUPPORT ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import { ALL_THEMES as THEME_DATA, Theme } from '@/components/Mainpage/ThemeComponents';

// --- DYNAMIC IMPORTS ---
const Shopmain = dynamic(() => import("@/components/Mainpage/ShopMainpage"), { ssr: false });
const AffiliateAdmin = dynamic(() => import("@/app/register/AffiliateAdmin"), { ssr: false });
const AffiliateRecruitsDashboard = dynamic(() => import("@/app/recruit/AffiliateRecruitsDashboard"), { ssr: false });

// --- DYNAMIC THEME CONFIGURATOR ---
const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { 
        ssr: false,
        loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Loading Config...</div> 
    }
);

// --- DYNAMIC CURSOR IMPORT (Standardized) ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false,
  loading: () => <div className="hidden">Loading Cursor...</div> 
});

// =========================================
// 1. CUSTOM HOOKS (Audio)
// =========================================

// Hook 1: Loader Audio
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
            } catch (err) { /* Play blocked */ }
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

// Hook 2: Background Loop
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

  // --- THEME STATE ---
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('user_theme_id') || 't01';
    }
    return 't01';
  });

  // Calculate active theme
  const activeTheme: Theme = useMemo(() => {
    return THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[0];
  }, [activeThemeId]);

  // Handle Theme Change
  const handleThemeChange = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_theme_id', themeId);
    }
    setShowConfigurator(false); 
  }, []);

  // --- AUDIO LOGIC ---
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

  // Navigation Logic
  useEffect(() => {
    if (searchParams?.src !== "nav") {
      router.push("/");
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
        startBgLoop(); 
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, startBgLoop]);

  // --- GLOBAL STYLES (Includes Themes + Cursor) ---
  const GlobalStyles = () => (
    <style jsx global>{`
      /* Core Theme Styles */
      html, body, #__next {
        scroll-behavior: smooth;
        background-color: black; 
        transition: filter 0.5s ease-in-out; 
        filter: ${activeTheme.filter};
      }
      @media (max-width: 1024px) {
        html, body, #__next {
            filter: ${activeTheme.mobileFilter};
        }
      }
      :root {
          --theme-accent-color: ${activeTheme.accentColor || '#0066ff'};
      }

      /* Loader Overlay */
      .loader-overlay-wrapper {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        z-index: 999999; pointer-events: all; background-color: black;
      }

      /* Cursor Styles (Merged) */
      .target-cursor-wrapper { pointer-events: none; position: fixed; top: 0; left: 0; z-index: 10000; mix-blend-mode: difference; }
      .target-cursor-dot { width: 6px; height: 6px; background-color: #0066ff; border-radius: 50%; position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); box-shadow: 0 0 10px #0066ff, 0 0 20px rgba(0, 102, 255, 0.5); will-change: transform, scale; }
      .target-cursor-corner { position: absolute; width: 12px; height: 12px; border: 3px solid #0066ff; opacity: 1; will-change: transform, opacity, border-color; }
      .corner-tl { border-right: none; border-bottom: none; }
      .corner-tr { border-left: none; border-bottom: none; }
      .corner-br { border-left: none; border-top: none; }
      .corner-bl { border-right: none; border-top: none; }
    `}</style>
  );

  if (searchParams?.src !== "nav") return null; 

  return (
    <>
      <GlobalStyles />
      
      {/* THEME CONFIGURATOR OVERLAY */}
      <div 
          className={`fixed inset-0 z-[9000] transition-opacity duration-300 
              ${showConfigurator ? 'opacity-100 pointer-events-auto backdrop-blur-sm bg-black/80' : 'opacity-0 pointer-events-none'}`}
          style={{ filter: activeTheme.filter }} 
      >
        <div className="flex items-center justify-center w-full h-full p-4 md:p-8">
            <button 
                onClick={() => setShowConfigurator(false)}
                className="absolute top-4 right-4 z-[9001] p-3 text-white rounded-full bg-black/50 hover:bg-black/80 transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-7xl h-full max-h-[850px]">
                <FixedThemeConfigurator 
                    initialThemeId={activeThemeId}
                    onThemeChange={handleThemeChange} 
                />
            </div>
        </div>
      </div>

      {/* NAVBAR */}
      <Navbar 
          setShowConfigurator={setShowConfigurator} 
          activeThemeId={activeThemeId}
          onThemeChange={handleThemeChange}
      />

      {/* Loader Wrapper */}
      {loading && (
        <div className="loader-overlay-wrapper">
          <MultiStepLoader 
            loadingStates={affiliateLoadingStates} 
            loading={loading} 
          />
        </div>
      )}

      {/* CURSOR */}
      <TargetCursor 
        hideDefaultCursor={true}
        spinDuration={2}
        targetSelector="button, a, input, [role='button'], .cursor-target"
      />
      
      {/* AUDIO CONTROLLER */}
      {!loading && (
        <MusicController isPlaying={isPlaying} onToggle={toggleBgLoop} />
      )}
      
      {/* MAIN CONTENT */}
      <div 
        className="pt-20" /* Added spacing for navbar */
        style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.5s ease' }}
      >
        <Socials />
        <Shopmain /> 
        <RecruitPage onUnlock={() => {}} /> 
        <AffiliateRecruitsDashboard onBack={() => router.push("/")} /> 
        <AffiliateAdmin /> 
      </div>
    </>
  );
}