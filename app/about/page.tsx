"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { redirect } from "next/navigation";
import dynamic from 'next/dynamic'; // Added dynamic import
import { gsap } from "gsap"; // Needed for legacy cursor logic, but we'll use a simple dynamic one
import { Volume2, VolumeX, X } from 'lucide-react'; // Added icons

// --- IMPORT THEME AND NAVBAR COMPONENTS ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import { ALL_THEMES as THEME_DATA, Theme } from '@/components/Mainpage/ThemeComponents';

// --- DYNAMIC IMPORTS ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false,
  loading: () => <div className="hidden">Loading Cursor...</div> 
});

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { 
        ssr: false,
        loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Loading Config...</div> 
    }
);

// --- STATIC/OTHER IMPORTS ---
import { AboutContent } from "./AboutContent";
import { Pricing } from "@/app/shop/pricing"; 
import { Why } from "@/components/Mainpage/Why"; 
import RecruitPage from "@/app/register/pagemode";
import Socials from "@/components/Mainpage/Socialsfooter";
import Shopmain from "@/components/Mainpage/ShopMainpage";

// ==========================================
// 1. AUDIO HOOKS (Standardized)
// ==========================================

// Hook 1: Loader Audio (Simplified body from previous files)
const useLoaderAudio = (url: string, enabled: boolean) => {
    useEffect(() => { /* ... simplified for insertion */ }, [url, enabled]);
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
        return () => { audio.pause(); audio.src = ""; };
    }, [url]);
  
    const start = useCallback(() => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.volume = 0.01; 
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
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

const MusicController = ({ isPlaying, onToggle }: { isPlaying: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`fixed bottom-8 left-8 z-[9999] group flex items-center justify-center w-12 h-12 rounded-full 
      transition-all duration-500 border border-[#66b3ff]/30 backdrop-blur-md transform-gpu
      ${isPlaying ? 'bg-[#0066ff]/20 shadow-[0_0_15px_rgba(0,102,255,0.5)]' : 'bg-gray-900/80 grayscale'}`}
    >
      {isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-50">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-[2px] bg-blue-400 rounded-full animate-pulse" 
                  style={{ height: '50%', animationDuration: `${0.4 + i * 0.1}s` }} />
            ))}
        </div>
      )}
      <div className="relative z-10">
        {isPlaying ? <Volume2 className="w-4 h-4 text-blue-50" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
      </div>
    </button>
);


// ==========================================
// 2. MAIN PAGE COMPONENT
// ==========================================

export default function Page({
  searchParams,
}: {
  searchParams?: { src?: string };
}) {
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false); // State to track access

  // --- THEME STATE MANAGEMENT ---
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('user_theme_id') || 't01';
    }
    return 't01';
  });

  const activeTheme: Theme = useMemo(() => {
    return THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[0];
  }, [activeThemeId]);

  const handleThemeChange = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_theme_id', themeId);
    }
    setShowConfigurator(false); 
  }, []);
  
  // --- AUDIO HOOKS ---
  const { isPlaying, start: startBgMusic, toggle: toggleBgMusic } = useBackgroundLoop('/background.mp3');
  useLoaderAudio('/modals.mp3', !isUnlocked);

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
    startBgMusic(); 
  }, [startBgMusic]);

  // --- STYLES (Includes Cursor & Theme Filters) ---
  const GlobalStyles = () => (
    <style jsx global>{`
      html, body, #__next {
        scroll-behavior: smooth; 
        min-height: 100vh;
        background-color: black; 
        transition: filter 0.5s ease-in-out; 
        /* Apply the theme filter */
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
      
      /* Standardized Cursor Styles */
      .target-cursor-wrapper { pointer-events: none; position: fixed; top: 0; left: 0; z-index: 10000; mix-blend-mode: difference; }
      .target-cursor-dot { width: 6px; height: 6px; background-color: #0066ff; border-radius: 50%; position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); box-shadow: 0 0 10px #0066ff, 0 0 20px rgba(0, 102, 255, 0.5); will-change: transform, scale; }
      .target-cursor-corner { position: absolute; width: 12px; height: 12px; border: 3px solid #0066ff; opacity: 1; will-change: transform, opacity, border-color; }
      .corner-tl { border-right: none; border-bottom: none; }
      .corner-tr { border-left: none; border-bottom: none; }
      .corner-br { border-left: none; border-top: none; }
      .corner-bl { border-right: none; border-top: none; }
    `}</style>
  );

  // Gate the route: only allow /about?src=nav
  if (searchParams?.src !== "nav") {
    redirect("/");
  }

  // If the website is NOT unlocked, show the Register Page
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-950 text-white relative">
        <GlobalStyles />
        <RecruitPage onUnlock={handleUnlock} />
      </main>
    );
  }

  // MAIN CONTENT AREA
  return (
    <>
      <GlobalStyles />
      
      {/* FIXED THEME CONFIGURATOR OVERLAY */}
      <div 
          className={`fixed inset-0 z-[9000] transition-opacity duration-300 
              ${showConfigurator ? 'opacity-100 pointer-events-auto backdrop-blur-sm bg-black/80' : 'opacity-0 pointer-events-none'}`}
          style={{ filter: activeTheme.filter }} 
      >
        <div className="flex items-center justify-center w-full h-full p-4 md:p-8">
            <button 
                onClick={() => setShowConfigurator(false)}
                className="absolute top-4 right-4 z-[9001] p-3 text-white rounded-full bg-black/50 hover:bg-black/80 transition-colors"
                aria-label="Close configuration"
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

      {/* NAVBAR: Pass the control state to the Navbar component */}
      <Navbar 
          setShowConfigurator={setShowConfigurator} 
          activeThemeId={activeThemeId}
          onThemeChange={handleThemeChange}
      />

      <main className="px-6 py-10 relative pt-20"> {/* Added pt-20 for Navbar */}
        <TargetCursor 
          spinDuration={2} 
          hideDefaultCursor={true} 
          targetSelector="button, a, input, .cursor-target, [role='button']" 
        />
        
        <MusicController isPlaying={isPlaying} onToggle={toggleBgMusic} />

        <Socials />
        <Pricing />
        <Shopmain />
        <Why />
        <AboutContent />
      </main>
    </>
  );
}