"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Volume2, Music, X } from 'lucide-react';

// --- COMPONENT IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import RegisterPage from "./register/pagemode"; 
import BullMoneyGate from "@/components/TradingHoldUnlock"; 
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2"; 

// --- DYNAMIC IMPORTS ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false,
  loading: () => <div className="hidden">Loading Cursor...</div> 
});

// Import Theme Data & Configurator
import { ALL_THEMES as THEME_DATA, Theme } from '@/components/Mainpage/ThemeComponents';

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { 
        ssr: false,
        loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Loading Config...</div> 
    }
);

// --- MAIN SITE COMPONENTS ---
import { Features } from "@/components/Mainpage/features";
import { Pricing } from "../components/Mainpage/pricing"; 
import Shopmain from "../components/Mainpage/ShopMainpage"; 
import Socialsfooter from "../components/Mainpage/Socialsfooter";
import Heromain from "../app/VIP/heromain"; 
import ShopFunnel from "../app/shop/ShopFunnel"; 
import Chartnews from "@/app/Blogs/Chartnews";

// --- AUDIO SYSTEM (Spotify Style) ---
const useBackgroundLoop = (url: string) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
  
    useEffect(() => {
        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0.05; 
        audioRef.current = audio;
        return () => { audio.pause(); audio.src = ""; };
    }, [url]);
  
    const start = useCallback(() => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    }, []);
  
    const toggle = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
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
      transition-all duration-500 border border-blue-500/30 backdrop-blur-md transform-gpu
      ${isPlaying ? 'bg-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-900/80 grayscale'}`}
    >
      <div className="relative z-10">
        {isPlaying ? <Volume2 className="w-4 h-4 text-blue-50" /> : <Music className="w-4 h-4 text-gray-400" />}
      </div>
    </button>
);

export default function Home() {
  // --- STAGE MANAGEMENT ---
  // Default to "v2" so it shows immediately on refresh/nav for existing users
  // We check for "register" status in useEffect
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false); // To prevent hydration mismatch
  
  // Theme State
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('user_theme_id') || 't01';
    return 't01';
  }); 
  const [showConfigurator, setShowConfigurator] = useState(false); 

  // Audio
  const { isPlaying, start: startBgMusic, toggle: toggleBgMusic } = useBackgroundLoop('/background.mp3');

  const activeTheme: Theme = useMemo(() => {
    return THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[0];
  }, [activeThemeId]);

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsClient(true);
    const hasRegistered = localStorage.getItem('vip_user_registered') === 'true';

    // LOGIC: 
    // 1. Not Registered? -> Go to Register Page
    // 2. Registered? -> Stay on "v2" (which is default) to show loader every time
    if (!hasRegistered) {
      setCurrentStage("register");
    } else {
      setCurrentStage("v2");
    }
  }, []);

  // --- TRANSITION HANDLERS ---

  // 1. Registration Done -> Go to "Hold" Gate
  const handleRegisterComplete = useCallback(() => {
    localStorage.setItem('vip_user_registered', 'true'); 
    setCurrentStage("hold"); 
  }, []);

  // 2. Hold Gate Unlocked -> Go to Content
  const handleHoldComplete = useCallback(() => {
    startBgMusic();
    setCurrentStage("content");
  }, [startBgMusic]);

  // 3. V2 Loader Finished (Runs on every refresh/nav for reg users) -> Go to Content
  const handleV2Complete = useCallback(() => {
    startBgMusic();
    setCurrentStage("content");
  }, [startBgMusic]);

  // Theme Handler
  const handleThemeChange = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    if (typeof window !== 'undefined') localStorage.setItem('user_theme_id', themeId);
    setShowConfigurator(false); 
  }, []);

  // Prevent hydration mismatch on initial render
  if (!isClient) return null;

  return (
    <>
      <style jsx global>{`
        html, body {
          background-color: black; 
          transition: filter 0.5s ease;
          filter: ${activeTheme.filter};
          overflow-x: hidden;
        }
        @media (max-width: 1024px) {
            html, body { filter: ${activeTheme.mobileFilter}; }
        }
        .profit-reveal {
          animation: profitReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes profitReveal {
          0% { transform: scale(1.05); opacity: 0; filter: blur(15px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px); }
        }
      `}</style>

      <Analytics />
      <SpeedInsights />

      {/* --- STAGE 1: REGISTER PAGE --- */}
      {currentStage === "register" && (
        <div className="fixed inset-0 z-[100000] bg-black">
           <RegisterPage onUnlock={handleRegisterComplete} />
        </div>
      )}

      {/* --- STAGE 1.5: HOLD GATE (First time only) --- */}
      {currentStage === "hold" && (
        <div className="fixed inset-0 z-[100000]">
          <BullMoneyGate onUnlock={handleHoldComplete}>
            <></> 
          </BullMoneyGate>
        </div>
      )}

      {/* --- STAGE 2: V2 LOADER (Every refresh/nav) --- */}
      {currentStage === "v2" && (
        <MultiStepLoaderV2 onFinished={handleV2Complete} />
      )}

      {/* --- STAGE 3: MAIN CONTENT --- */}
      {/* Hidden until 'content' stage to ensure SEO presence but visual hiding */}
      <div className={currentStage === 'content' ? 'profit-reveal' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
        
        {/* Navbar inside Page to control Theme */}
        <Navbar 
            setShowConfigurator={setShowConfigurator} 
            activeThemeId={activeThemeId}
            onThemeChange={handleThemeChange}
        />

        <main onClick={startBgMusic} className="relative min-h-screen">
          <TargetCursor spinDuration={2} hideDefaultCursor={true} targetSelector=".cursor-target, a, button" />
          
          {currentStage === 'content' && ( 
            <div className="relative z-10">
              {/* Music Floating Button */}
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
      </div>

      {/* --- THEME CONFIGURATOR MODAL --- */}
      {showConfigurator && (
        <div 
          className="fixed inset-0 z-[100001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          style={{ filter: activeTheme.filter }}
        >
          <div className="relative w-full max-w-6xl h-[80vh] bg-[#020617] rounded-3xl border border-white/10 overflow-hidden">
            <button 
                onClick={() => setShowConfigurator(false)}
                className="absolute top-6 right-6 z-[10] p-2 text-white/50 hover:text-white transition-colors"
            >
                <X size={28} />
            </button>
            <FixedThemeConfigurator 
                initialThemeId={activeThemeId}
                onThemeChange={handleThemeChange} 
            />
          </div>
        </div>
      )}
    </>
  );
}