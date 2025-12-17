"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; 
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Volume2, Volume1, VolumeX, X } from 'lucide-react'; 

// --- COMPONENT IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import RegisterPage from "./register/pagemode"; 
import BullMoneyGate from "@/components/TradingHoldUnlock"; 
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2"; 

// --- THEME & MUSIC DATA ---
import { ALL_THEMES, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';

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
  onReady,
  volume 
}: { 
  themeId: string;
  onReady: (player: any) => void;
  volume: number;
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
      playlist: videoId,
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
                try { 
                    if(typeof event.target.setVolume === 'function') {
                        event.target.setVolume(volume); 
                    }
                } catch(e) {}
                onReady(event.target);
            }
        }}
        onStateChange={(event: YouTubeEvent) => { 
            // Auto-recover if it pauses unexpectedly
            if ((event.data === -1 || event.data === 2) && event.target?.playVideo) {
                // optional: event.target.playVideo(); 
            }
        }}
      />
    </div>
  );
};

// ----------------------------------------------------------------------
// --- MUSIC CONTROLLER UI ---
// ----------------------------------------------------------------------
const MusicController = ({ 
    isPlaying, 
    onToggle, 
    themeName, 
    volume, 
    onVolumeChange 
}: { 
    isPlaying: boolean; 
    onToggle: () => void, 
    themeName: string,
    volume: number,
    onVolumeChange: (val: number) => void
}) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div 
            className="fixed bottom-8 left-8 z-[9999] flex items-center gap-3"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }} 
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500
                    ${isPlaying ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}
                >
                    {isPlaying ? (volume > 50 ? <Volume2 size={18}/> : <Volume1 size={18}/>) : <VolumeX size={18}/>}
                </button>

                {/* VOLUME SLIDER */}
                <div className={`flex items-center transition-all duration-300 overflow-hidden ${isHovered ? 'w-24 px-2' : 'w-0'}`}>
                    <input 
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                        className="w-full h-1 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
            
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
}

// ----------------------------------------------------------------------
// --- MAIN HOME COMPONENT ---
// ----------------------------------------------------------------------
export default function Home() {
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('t01'); 
  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [isMuted, setIsMuted] = useState(false); 
  const [volume, setVolume] = useState(25);
  const playerRef = useRef<any>(null);
  
  // Transition Effect State
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Active Theme Memo
  const activeTheme = useMemo(() => {
    if (!ALL_THEMES || ALL_THEMES.length === 0) return FALLBACK_THEME as Theme;
    return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  }, [activeThemeId]);
  
  const isPlaying = useMemo(() => !isMuted, [isMuted]);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('user_theme_id');
        const storedMute = localStorage.getItem('user_is_muted');
        const storedVol = localStorage.getItem('user_volume');
        const hasRegistered = localStorage.getItem('vip_user_registered') === 'true';

        if (storedTheme) setActiveThemeId(storedTheme);
        if (storedMute !== null) setIsMuted(storedMute === 'true');
        if (storedVol) setVolume(parseInt(storedVol));
        if (!hasRegistered) setCurrentStage("register");
        else setCurrentStage("v2");
    }
  }, []);

  // --- SAFE AUDIO METHODS (CRASH FIX APPLIED HERE) ---

  const safePlay = useCallback(() => {
      // 🛑 FIX: Use Optional Chaining (?.) for crash safety
      if (isMuted || showConfigurator) return;

      try {
          // Check if setVolume exists safely before calling
          playerRef.current?.setVolume?.(volume);
          // Check if playVideo exists safely before calling
          playerRef.current?.playVideo?.();
      } catch (e) {
          console.warn("Audio Player: Interaction prevented", e);
      }
  }, [isMuted, showConfigurator, volume]);

  const safePause = useCallback(() => {
      try {
          playerRef.current?.pauseVideo?.();
      } catch (e) {
          console.warn("Audio Player: Pause prevented", e);
      }
  }, []);

  // --- AUDIO LOGIC HANDLERS ---

  const handleVolumeChange = (newVol: number) => {
      setVolume(newVol);
      localStorage.setItem('user_volume', newVol.toString());
      
      // 🛑 FIX: Safe Set Volume with Optional Chaining
      playerRef.current?.setVolume?.(newVol);
      
      // Auto-unmute if volume is dragged up
      if (newVol > 0 && isMuted) {
          setIsMuted(false);
          localStorage.setItem('user_is_muted', 'false');
          safePlay(); // Resume if unmuted via slider
      }
  };

  const handlePlayerReady = useCallback((player: any) => {
      playerRef.current = player;
      // 🛑 FIX: Safe init with Optional Chaining
      player?.setVolume?.(isMuted ? 0 : volume);
      
      if (!isMuted && !showConfigurator) {
          // Delay play slightly to ensure player is ready
          setTimeout(() => safePlay(), 500);
      }
  }, [isMuted, showConfigurator, safePlay, volume]);

  // Audio Ducking for Configurator
  useEffect(() => {
      if (!playerRef.current) return;
      if (showConfigurator) {
          safePause();
      } else if (!isMuted) {
          safePlay();
      }
  }, [showConfigurator, isMuted, safePause, safePlay]);

  const toggleMusic = useCallback(() => {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      localStorage.setItem('user_is_muted', String(newMutedState));
      
      if (newMutedState) {
          // 🛑 FIX: Safe access
          playerRef.current?.setVolume?.(0);
          safePause();
      } else if (!showConfigurator) {
          // 🛑 FIX: Safe access
          playerRef.current?.setVolume?.(volume);
          safePlay();
      }
  }, [isMuted, showConfigurator, safePlay, safePause, volume]);

  // --- STAGE & THEME HANDLERS ---

  const handleRegisterComplete = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem('vip_user_registered', 'true'); 
    setCurrentStage("hold"); 
  }, []);

  // Theme Change with Transition Effect
  const handleThemeChange = useCallback((themeId: string, sound: SoundProfile, muted: boolean) => {
    setIsTransitioning(true);

    setTimeout(() => {
        setActiveThemeId(themeId);
        setIsMuted(muted); 
        
        if (typeof window !== 'undefined') {
            localStorage.setItem('user_theme_id', themeId);
            localStorage.setItem('user_is_muted', String(muted));
        }

        setShowConfigurator(false); 

        setTimeout(() => {
            setIsTransitioning(false);
        }, 100);
    }, 300);
  }, []);

  const handleHoldComplete = useCallback(() => setCurrentStage("content"), []);
  const handleV2Complete = useCallback(() => setCurrentStage("content"), []);

  if (!isClient) return null;

  return (
    <>
      <style jsx global>{`
        html, body {
          background-color: black; 
          overflow-x: hidden;
        }
        #theme-wrapper {
            transition: filter 0.5s ease;
            filter: ${activeTheme.filter};
        }
        @media (max-width: 1024px) {
            #theme-wrapper { filter: ${activeTheme.mobileFilter}; }
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

      {/* TRANSITION OVERLAY */}
      <div 
        className={`fixed inset-0 z-[100002] bg-black pointer-events-none transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      />

      <BackgroundMusicSystem 
        themeId={activeThemeId} 
        onReady={handlePlayerReady} 
        volume={volume}
      />

      <div className="relative w-full min-h-screen" onClick={safePlay}>
        {currentStage === "register" && (
            <div className="fixed inset-0 z-[100000] bg-black">
                <RegisterPage onUnlock={handleRegisterComplete} />
            </div>
        )}

        {currentStage === "hold" && (
            <div className="fixed inset-0 z-[100000]">
                <BullMoneyGate onUnlock={handleHoldComplete}>
                    <></> 
                </BullMoneyGate>
            </div>
        )}

        {currentStage === "v2" && <MultiStepLoaderV2 onFinished={handleV2Complete} />}

        <div 
            id="theme-wrapper" 
            className={currentStage === 'content' ? 'profit-reveal' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}
        >
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
                            volume={volume}
                            onVolumeChange={handleVolumeChange}
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

        {showConfigurator && (
            <div className="fixed inset-0 z-[100001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
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