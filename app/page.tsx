"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Volume2, VolumeX, Music, Settings, X } from 'lucide-react';

// --- IMPORT NAVBAR (Using named import) ---
import { Navbar } from "@/components/Mainpage/navbar"; 

// --- DYNAMIC IMPORTS ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false,
  loading: () => <div className="hidden">Loading Cursor...</div> 
});

// Assuming FixedThemeConfigurator and ALL_THEMES are defined and exported 
// in the same ThemeComponents file. We need to import the data it defines.
import { ALL_THEMES as THEME_DATA, Theme, ThemeCategory } from '@/components/Mainpage/ThemeComponents';

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { 
        ssr: false,
        loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Loading Config...</div> 
    }
);

// --- OTHER COMPONENTS (No Change) ---
import { Features } from "@/components/Mainpage/features";
import { Hero } from "../components/Mainpage/hero";
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
  
  // FIX 1A: Initialize state from localStorage 
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('user_theme_id') || 't01';
    }
    return 't01';
  }); 

  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [contentReady, setContentReady] = useState(false); 
  const minTimeRef = useRef(false);

  // FIX 1B: Correct theme lookup using the imported THEME_DATA
  const activeTheme: Theme = useMemo(() => {
    // FIX: Use the imported theme data (now named THEME_DATA) for lookup.
    return THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[0];
  }, [activeThemeId]);


  // FIX 4: Correct dependency array for useCallback (No change needed here from the previous step, but kept for clarity)
  const { isPlaying, start: startBgMusic, toggle: toggleBgMusic } = useBackgroundLoop('/background.mp3');
  
  const handleManualUnlock = useCallback(() => {
    minTimeRef.current = true;
    setContentReady(true);
    setLoading(false);
    setShowContent(true); 
    startBgMusic(); 
  }, [startBgMusic]); 

  // FIX 2: Theme change handler now saves to localStorage 
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

  // FIX 3: Dynamic GlobalStyles (No change needed here, as the lookup uses the correctly imported theme object)
  const GlobalStyles = () => (
    <style jsx global>{`
      html, body, #__next {
        scroll-behavior: smooth; 
        min-height: 100vh;
        background-color: black; 
        transition: filter 0.5s ease-in-out; 
        
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