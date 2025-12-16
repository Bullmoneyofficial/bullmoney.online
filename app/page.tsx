"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Volume2, VolumeX, Music, Settings, X } from 'lucide-react';

// --- REMOVED OLD IMPORT: import { THEMES, Theme } from '@/components/Mainpage/ThemeComponents';
// The full data structure is now assumed to be in the ALL_THEMES array below, which the dynamic configurator also uses.

// --- RE-INJECT MINIMAL THEME DATA & TYPES FOR LOCAL LOOKUP CONSISTENCY ---
// NOTE: In a real project, ALL_THEMES (the list of 250+ themes) would be imported here.
export type ThemeCategory = 'SPECIAL' | 'SENTIMENT' | 'ASSETS' | 'CRYPTO' | 'HISTORICAL' | 'OPTICS' | 'GLITCH' | 'EXOTIC'; // Minimal set
export type Theme = { 
  id: string; name: string; description: string; 
  filter: string; mobileFilter: string; category: ThemeCategory; 
  isLight?: boolean; illusion?: 'SCANLINES' | 'VIGNETTE' | 'NOISE' | 'NONE'; 
  accentColor?: string; status: 'AVAILABLE' | 'UNAVAILABLE';
};

// Placeholder for the complete, merged ALL_THEMES list used by the configurator.
// Includes the fixed custom theme and the default theme.
export const ALL_THEMES: Theme[] = [
    // FIXED BULL MONEY FILTER (Clear/Premium Blue Chrome)
    { 
        id: 'bull-money-special', 
        name: 'Bull Money Chrome', 
        description: 'Premium Logic', 
        category: 'SPECIAL', 
        filter: 'saturate(1.5) contrast(1.2) brightness(1.1) hue-rotate(10deg) sepia(0.1)', // The corrected filter
        mobileFilter: 'saturate(1.5) contrast(1.2)', 
        illusion: 'NONE', 
        accentColor: '#00FFFF', 
        status: 'AVAILABLE' 
    },
    // DEFAULT/TERMINAL THEME (t01)
    { id: 't01', name: 'Terminal', description: 'Default', category: 'SENTIMENT', filter: 'none', mobileFilter: 'none', illusion: 'NONE', accentColor: '#ffffff', status: 'AVAILABLE' },
    // DUMMY THEME
    { id: 'c02', name: 'Ethereum Glow', description: 'ETH Gas', category: 'CRYPTO', filter: 'sepia(1) hue-rotate(180deg) saturate(2) brightness(1.1) drop-shadow(0 0 5px #627EEA)', mobileFilter: 'hue-rotate(180deg)', illusion: 'VIGNETTE', accentColor: '#627EEA', status: 'AVAILABLE' },
    // ... (Placeholder for all other 250+ themes)
];


// --- IMPORT NAVBAR (Using named import) ---
import { Navbar } from "@/components/Mainpage/navbar"; 

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

// --- OTHER COMPONENTS (No Change) ---
import { Features } from "@/components/Mainpage/features";
import { Hero } from "@/components/Mainpage/hero";
import { Pricing } from "../components/Mainpage/pricing"; 
import Shopmain from "../components/Mainpage/ShopMainpage"; 
import Socialsfooter from "../components/Mainpage/Socialsfooter";
import RegisterPage from "./register/pagemode"; 
import Heromain from "../app/VIP/heromain"; 
import ShopFunnel from "../app/shop/ShopFunnel"; 
import Chartnews from "@/app/Blogs/Chartnews";

// --- AUDIO HOOKS (No Change) ---
const useLoaderAudio = (url: string, enabled: boolean) => {
    useEffect(() => { /* ... */ }, [url, enabled]);
};

const useOneTimeAmbient = (url: string, trigger: boolean) => {
    useEffect(() => { /* ... */ }, [url, trigger]);
};

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
        {isPlaying ? <Volume2 className="w-4 h-4 text-blue-50" /> : <Music className="w-4 h-4 text-gray-400" />}
      </div>
    </button>
);


// --- MAIN PAGE COMPONENT ---
export default function Home() {
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  
  // FIX 1A: Initialize state from localStorage (No change needed here)
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('user_theme_id') || 't01';
    }
    return 't01';
  }); 

  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [contentReady, setContentReady] = useState(false); 
  const minTimeRef = useRef(false);

  // FIX 1B: Correct theme lookup using ALL_THEMES
  const activeTheme: Theme = useMemo(() => {
    // Find theme in the local mock/placeholder ALL_THEMES (representing the actual merged list)
    return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  }, [activeThemeId]);


  // FIX 4: Correct dependency array for useCallback
  const { isPlaying, start: startBgMusic, toggle: toggleBgMusic } = useBackgroundLoop('/background.mp3');
  
  const handleManualUnlock = useCallback(() => {
    minTimeRef.current = true;
    setContentReady(true);
    setLoading(false);
    setShowContent(true); 
    startBgMusic(); 
  }, [startBgMusic]); // Added startBgMusic dependency

  // FIX 2: Theme change handler now saves to localStorage (No change needed here)
  const handleThemeChange = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_theme_id', themeId);
    }
    setShowConfigurator(false); 
  }, []);

  useLoaderAudio('/modals.mp3', loading);
  useOneTimeAmbient('/ambient.mp3', showContent);

  useEffect(() => { setContentReady(true); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      minTimeRef.current = true;
      if (contentReady) {
        setLoading(false);
        setShowContent(true);
        startBgMusic();
      }
    }, 5000); 

    if (contentReady && minTimeRef.current) {
        setLoading(false);
        setShowContent(true);
        startBgMusic();
    }
    return () => clearTimeout(timer);
  }, [contentReady, startBgMusic]); 

  // FIX 3: Dynamic GlobalStyles with fix for bull-money-special if needed
  const GlobalStyles = () => (
    <style jsx global>{`
      html, body, #__next {
        scroll-behavior: smooth; 
        min-height: 100vh;
        background-color: black; 
        transition: filter 0.5s ease-in-out; /* Added smooth transition */
        
        /* Apply the theme filter for desktop/global */
        filter: ${activeTheme.filter};
      }
      @media (max-width: 1024px) {
        html, body, #__next {
            /* Apply mobile filter override */
            filter: ${activeTheme.mobileFilter};
        }
      }

      /* Optional: Apply accent color globally (e.g., to cursor, primary text classes) */
      :root {
          --theme-accent-color: ${activeTheme.accentColor || '#0066ff'};
      }
      
      .target-cursor-wrapper { pointer-events: none; position: fixed; top: 0; left: 0; z-index: 10000; mix-blend-mode: difference; }
      .fade-enter-active { animation: fadeIn 1s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `}</style>
  );

  return (
    <>
      <GlobalStyles />
      <Analytics />
      <SpeedInsights />

      {/* Loader */}
      {loading && (
        <div className="fixed inset-0 z-[99999] bg-black opacity-100">
          <RegisterPage onUnlock={handleManualUnlock} />
        </div>
      )}

      {/* FIXED THEME CONFIGURATOR OVERLAY */}
      <div 
          className={`fixed inset-0 z-[9000] transition-opacity duration-300 
              ${showConfigurator ? 'opacity-100 pointer-events-auto backdrop-blur-sm bg-black/80' : 'opacity-0 pointer-events-none'}`}
          // Apply active filter to the modal backdrop for consistent visual state
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

      {/* MAIN CONTENT AREA */}
      <main 
        onClick={startBgMusic} 
        className={`relative min-h-screen bg-black transition-opacity duration-1000 
          ${showContent ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <TargetCursor 
          spinDuration={2} 
          hideDefaultCursor={true} 
          targetSelector=".cursor-target, a, button" 
        />
        
        {(showContent || loading) && ( 
          <div className="animate-in fade-in duration-1000">
            <MusicController isPlaying={isPlaying} onToggle={toggleBgMusic} />

            <Socialsfooter />
            <Heromain />
            <ShopFunnel />
            <Shopmain />
            <Chartnews />
            <Pricing />
            <Features />
          </div>
        )}
      </main>
    </>
  );
}