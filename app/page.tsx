"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; // Added YouTubeEvent import
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Volume2, Music, X, SkipForward } from 'lucide-react';

// --- COMPONENT IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import RegisterPage from "./register/pagemode"; 
import BullMoneyGate from "@/components/TradingHoldUnlock"; 
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2"; 

// --- THEME & MUSIC DATA ---
import { ALL_THEMES as THEME_DATA, Theme, THEME_SOUNDTRACKS } from '@/components/Mainpage/ThemeComponents';

// --- DYNAMIC IMPORTS ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false, 
  loading: () => <div className="hidden">Loading...</div> 
});

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { ssr: false }
);

// --- MAIN SITE COMPONENTS ---
import { Features } from "@/components/Mainpage/features";
import { Pricing } from "../components/Mainpage/pricing"; 
import Shopmain from "../components/Mainpage/ShopMainpage"; 
import Socialsfooter from "../components/Mainpage/Socialsfooter";
import Heromain from "../app/VIP/heromain"; 
import ShopFunnel from "../app/shop/ShopFunnel"; 
import Chartnews from "@/app/Blogs/Chartnews";

// ----------------------------------------------------------------------
// --- NEW YOUTUBE MUSIC SYSTEM ---
// ----------------------------------------------------------------------
const BackgroundMusicSystem = ({ 
  isPlaying, 
  themeId, 
  onReady 
}: { 
  isPlaying: boolean; 
  themeId: string;
  onReady: (player: any) => void;
}) => {
  const videoId = THEME_SOUNDTRACKS[themeId] || THEME_SOUNDTRACKS['default'];
  
  const opts: YouTubeProps['opts'] = {
    height: '0', // Hidden
    width: '0',  // Hidden
    playerVars: {
      autoplay: 1,
      controls: 0,
      loop: 1,
      modestbranding: 1,
      playsinline: 1,
    },
  };

  return (
    <div className="fixed bottom-0 left-0 opacity-0 pointer-events-none z-[-1]">
      <YouTube 
        videoId={videoId} 
        opts={opts} 
        onReady={(event: YouTubeEvent) => { // Fixed type here
            event.target.setVolume(15); 
            onReady(event.target);
        }}
        onStateChange={(event: YouTubeEvent) => { // Fixed type here
            // Ensure it loops effectively if it's a playlist or video ends
            if (event.data === 0) event.target.playVideo(); 
        }}
      />
    </div>
  );
};

// ----------------------------------------------------------------------
// --- MUSIC CONTROLLER UI ---
// ----------------------------------------------------------------------
const MusicController = ({ isPlaying, onToggle, themeName }: { isPlaying: boolean; onToggle: () => void, themeName: string }) => (
    <div className="fixed bottom-8 left-8 z-[9999] flex items-center gap-3">
        <button
        onClick={onToggle}
        className={`group flex items-center justify-center w-12 h-12 rounded-full 
        transition-all duration-500 border backdrop-blur-md transform-gpu
        ${isPlaying 
            ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
            : 'bg-gray-900/80 border-white/10 grayscale'}`}
        >
        <div className="relative z-10">
            {isPlaying 
                ? <Volume2 className="w-4 h-4 text-blue-50" /> 
                : <Music className="w-4 h-4 text-gray-400" />
            }
        </div>
        </button>
        
        {/* Track Info Popout */}
        <div className={`
            hidden md:flex flex-col overflow-hidden transition-all duration-500
            ${isPlaying ? 'w-32 opacity-100' : 'w-0 opacity-0'}
        `}>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Now Streaming</span>
            <div className="flex items-center gap-1">
                <span className="text-xs text-white truncate font-mono">{themeName} Radio</span>
                <div className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 h-full bg-blue-500 animate-pulse"/>
                    <span className="w-0.5 h-2/3 bg-blue-500 animate-pulse delay-75"/>
                    <span className="w-0.5 h-1/3 bg-blue-500 animate-pulse delay-150"/>
                </div>
            </div>
        </div>
    </div>
);

export default function Home() {
  // --- STAGE MANAGEMENT ---
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  
  // Theme State
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('user_theme_id') || 't01';
    return 't01';
  }); 
  const [showConfigurator, setShowConfigurator] = useState(false); 

  // --- AUDIO STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null); // Reference to YouTube Player Instance

  const activeTheme: Theme = useMemo(() => {
    return THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[0];
  }, [activeThemeId]);

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsClient(true);
    const hasRegistered = localStorage.getItem('vip_user_registered') === 'true';
    if (!hasRegistered) {
      setCurrentStage("register");
    } else {
      setCurrentStage("v2");
    }
  }, []);

  // --- AUDIO LOGIC ---
  const handlePlayerReady = (player: any) => {
      playerRef.current = player;
      // We don't auto-play here to respect browser policies, 
      // we wait for the user to click "Unlock" or interact with site.
  };

  const toggleMusic = () => {
      if (!playerRef.current) return;
      
      if (isPlaying) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
      } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
      }
  };

  // Ensure music switches when theme changes (if already playing)
  useEffect(() => {
      if(playerRef.current && isPlaying) {
          // React-Youtube handles the prop change of 'videoId' automatically, 
          // but we ensure status is correct here.
          setIsPlaying(true); 
      }
  }, [activeThemeId, isPlaying]);

  // --- TRANSITION HANDLERS ---

  const handleRegisterComplete = useCallback(() => {
    localStorage.setItem('vip_user_registered', 'true'); 
    setCurrentStage("hold"); 
  }, []);

  const handleHoldComplete = useCallback(() => {
    // Attempt to start music when gate opens
    if(playerRef.current) {
        playerRef.current.playVideo();
        setIsPlaying(true);
    }
    setCurrentStage("content");
  }, []);

  const handleV2Complete = useCallback(() => {
    // Attempt start music on load complete
    // Note: Browsers might block this until a click happens.
    // The "Enter" button on the loader usually counts as interaction.
    if(playerRef.current) {
        playerRef.current.playVideo();
        setIsPlaying(true);
    }
    setCurrentStage("content");
  }, []);

  const handleThemeChange = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    if (typeof window !== 'undefined') localStorage.setItem('user_theme_id', themeId);
    setShowConfigurator(false); 
  }, []);

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

      {/* --- BACKGROUND MUSIC ENGINE --- */}
      <BackgroundMusicSystem 
        isPlaying={isPlaying} 
        themeId={activeThemeId} 
        onReady={handlePlayerReady} 
      />

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
      <div className={currentStage === 'content' ? 'profit-reveal' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
        
        <Navbar 
            setShowConfigurator={setShowConfigurator} 
            activeThemeId={activeThemeId}
            onThemeChange={handleThemeChange}
        />

        <main className="relative min-h-screen">
          
          <TargetCursor spinDuration={2} hideDefaultCursor={true} targetSelector=".cursor-target, a, button" />
          
          {currentStage === 'content' && ( 
            <div className="relative z-10">
              {/* Updated Music Controller */}
              <MusicController 
                isPlaying={isPlaying} 
                onToggle={toggleMusic} 
                themeName={activeTheme.name}
              />

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