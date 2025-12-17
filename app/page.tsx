"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; 
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Volume2, Music, X } from 'lucide-react'; 

// --- COMPONENT IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import RegisterPage from "./register/pagemode"; 
import BullMoneyGate from "@/components/TradingHoldUnlock"; 
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2"; 

// --- THEME & MUSIC DATA ---
import { ALL_THEMES as THEME_DATA, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';

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
import Chartnews from "@/app/Blogs/Chartnews"; // This is the TradingView component

// --- CONSTANTS ---
const BASE_VOLUME = 20; 

// --- FALLBACK THEME ---
const FALLBACK_THEME: Partial<Theme> = {
    id: 'default',
    name: 'Loading...',
    filter: 'none',
    mobileFilter: 'none',
};

// ----------------------------------------------------------------------
// --- YOUTUBE MUSIC SYSTEM ---
// ----------------------------------------------------------------------
const BackgroundMusicSystem = ({ 
  themeId, 
  onReady 
}: { 
  themeId: string;
  onReady: (player: any) => void;
}) => {
  const videoId = (THEME_SOUNDTRACKS && THEME_SOUNDTRACKS[themeId]) 
    ? THEME_SOUNDTRACKS[themeId] 
    : 'jfKfPfyJRdk';
  
  const opts: YouTubeProps['opts'] = {
    height: '1', 
    width: '1', 
    playerVars: {
      autoplay: 1,
      controls: 0,
      loop: 1,
      modestbranding: 1,
      playsinline: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  };

  return (
    <div className="fixed bottom-0 left-0 opacity-0 pointer-events-none z-[-1] overflow-hidden w-px h-px">
      <YouTube 
        videoId={videoId} 
        opts={opts} 
        onReady={(event: YouTubeEvent) => { 
            if(event.target) {
                try { event.target.setVolume(BASE_VOLUME); } catch(e) {}
                onReady(event.target);
            }
        }}
        onStateChange={(event: YouTubeEvent) => { 
            if (event.data === 0 && event.target?.playVideo) {
                event.target.playVideo(); 
            }
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
        onClick={(e) => { e.stopPropagation(); onToggle(); }} 
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
  const [activeThemeId, setActiveThemeId] = useState<string>('t01'); 
  const [showConfigurator, setShowConfigurator] = useState(false); 

  // --- AUDIO STATE ---
  const [isMuted, setIsMuted] = useState(false); 
  const playerRef = useRef<any>(null);

  const activeTheme: Theme = useMemo(() => {
    if (!THEME_DATA || THEME_DATA.length === 0) return FALLBACK_THEME as Theme;
    return THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[0];
  }, [activeThemeId]);
  
  const isPlaying = useMemo(() => !isMuted, [isMuted]);

  // --- INITIALIZATION ---
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('user_theme_id');
        const storedMute = localStorage.getItem('user_is_muted');
        const hasRegistered = localStorage.getItem('vip_user_registered') === 'true';

        if (storedTheme) setActiveThemeId(storedTheme);
        if (storedMute !== null) setIsMuted(storedMute === 'true');

        if (!hasRegistered) {
          setCurrentStage("register");
        } else {
          setCurrentStage("v2");
        }
    }
  }, []);

  // --- SAFE AUDIO METHODS ---
  const safePlay = useCallback(() => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function' && !isMuted) {
          playerRef.current.setVolume(BASE_VOLUME);
          playerRef.current.playVideo();
      }
  }, [isMuted]);

  const safePause = useCallback(() => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
      }
  }, []);

  const safeSetVolume = useCallback((vol: number) => {
      if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(vol);
      }
  }, []);

  // --- AUDIO LOGIC ---
  const handlePlayerReady = useCallback((player: any) => {
      playerRef.current = player;
      safeSetVolume(isMuted ? 0 : BASE_VOLUME);
      
      if (!isMuted) {
          safePlay();
      }
  }, [isMuted, safePlay, safeSetVolume]);

  const toggleMusic = useCallback(() => {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      localStorage.setItem('user_is_muted', String(newMutedState));

      if (newMutedState) {
          safeSetVolume(0);
          safePause();
      } else {
          safeSetVolume(BASE_VOLUME);
          safePlay();
      }
  }, [isMuted, safePlay, safePause, safeSetVolume]);

  // Sync Player with React State
  useEffect(() => {
      if (!playerRef.current) return;
      
      if (isMuted) {
          safeSetVolume(0);
          safePause();
      } else {
          safeSetVolume(BASE_VOLUME);
          if (playerRef.current.getPlayerState && playerRef.current.getPlayerState() !== 1) { 
              safePlay();
          }
      }
  }, [activeThemeId, isMuted, safePlay, safePause, safeSetVolume]);

  // --- TRANSITION HANDLERS ---

  const handleRegisterComplete = useCallback(() => {
    // FIX: Ensure storage is set before changing stage
    if (typeof window !== 'undefined') localStorage.setItem('vip_user_registered', 'true'); 
    setCurrentStage("hold"); 
    // safePlay will run because of the global click handler
  }, []);

  const handleHoldComplete = useCallback(() => {
    setCurrentStage("content");
    // safePlay will run because of the global click handler
  }, []);

  const handleV2Complete = useCallback(() => {
    setCurrentStage("content");
    // safePlay will run because of the global click handler
  }, []);

  const handleThemeChange = useCallback((themeId: string, sound: SoundProfile, muted: boolean) => {
    setActiveThemeId(themeId);
    setIsMuted(muted); 
    
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_theme_id', themeId);
        localStorage.setItem('user_is_muted', String(muted));
    }
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

      {/* --- BACKGROUND MUSIC ENGINE (Always Rendered) --- */}
      <BackgroundMusicSystem 
        themeId={activeThemeId} 
        onReady={handlePlayerReady} 
      />

      {/* GLOBAL CLICK WRAPPER (Handles Audio Unlock and prevents Register page block) */}
      <div className="relative w-full min-h-screen" onClick={safePlay}>

        {/* --- STAGE 1: REGISTER PAGE --- */}
        {currentStage === "register" && (
            // FIX: Ensure register page is visible and handles its own unlock button correctly
            <div className="fixed inset-0 z-[100000] bg-black">
                <RegisterPage onUnlock={handleRegisterComplete} />
            </div>
        )}

        {/* --- STAGE 1.5: HOLD GATE --- */}
        {currentStage === "hold" && (
            <div className="fixed inset-0 z-[100000]">
                <BullMoneyGate onUnlock={handleHoldComplete}>
                    <></> 
                </BullMoneyGate>
            </div>
        )}

        {/* --- STAGE 2: V2 LOADER --- */}
        {currentStage === "v2" && (
            <MultiStepLoaderV2 onFinished={handleV2Complete} />
        )}

        {/* --- STAGE 3: MAIN CONTENT --- */}
        <div className={currentStage === 'content' ? 'profit-reveal' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
            
            <Navbar 
                setShowConfigurator={setShowConfigurator} 
                activeThemeId={activeThemeId}
                onThemeChange={(themeId) => handleThemeChange(themeId, 'MECHANICAL' as SoundProfile, isMuted)}
            />

            <main className="relative min-h-screen">
                <TargetCursor spinDuration={2} hideDefaultCursor={true} targetSelector=".cursor-target, a, button" />
                
                {currentStage === 'content' && ( 
                    <div className="relative z-10">
                    <MusicController 
                        isPlaying={isPlaying} 
                        onToggle={toggleMusic} 
                        themeName={activeTheme.name}
                    />

                    <Socialsfooter />
                    <Heromain />
                    <ShopFunnel />
                    <Shopmain />
                    {/* FIX: Trading View component is here */}
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
                    onClick={(e) => { e.stopPropagation(); setShowConfigurator(false); }}
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
      </div>
    </>
  );
}