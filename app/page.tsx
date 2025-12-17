"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; 
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Volume2, Volume1, VolumeX, X, Palette } from 'lucide-react'; 

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
// --- ONBOARDING HELPER ---
// ----------------------------------------------------------------------
const OnboardingHelper = ({ onDismiss }: { onDismiss: () => void }) => {
    return (
        <div 
            onClick={onDismiss}
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-[2px] cursor-pointer animate-in fade-in duration-700"
        >
            <div className="relative w-full h-full">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter drop-shadow-[0_0_25px_rgba(59,130,246,0.6)] animate-pulse">
                        Customize Your Vibe
                    </h2>
                    <p className="text-blue-200 text-lg md:text-xl font-mono opacity-90">
                        Choose a Theme & Soundtrack
                    </p>
                    <div className="mt-4 text-xs text-white/40 uppercase tracking-widest">Click anywhere to start</div>
                </div>
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
                        </marker>
                    </defs>
                    <path 
                        d="M 50% 55% Q 30% 70% 80 90%" 
                        fill="none" 
                        stroke="#60a5fa" 
                        strokeWidth="3" 
                        strokeDasharray="12,12"
                        markerEnd="url(#arrowhead)"
                        className="opacity-80 drop-shadow-[0_0_10px_#60a5fa]"
                    >
                         <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="2s" fill="freeze" />
                    </path>
                </svg>
            </div>
        </div>
    );
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
      playlist: videoId, // Required for loop to work
      modestbranding: 1,
      playsinline: 1,
      enablejsapi: 1, // Explicitly enable API
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
                onReady(event.target);
            }
        }}
        onStateChange={(event: YouTubeEvent) => { 
            // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
            if (event.data === -1 || event.data === 2) {
               // Optional: could retry play here if needed
            }
        }}
      />
    </div>
  );
};

// ----------------------------------------------------------------------
// --- BOTTOM CONTROLS (MUSIC + THEME) ---
// ----------------------------------------------------------------------
const BottomControls = ({ 
    isPlaying, 
    onToggleMusic, 
    onOpenTheme,
    themeName, 
    volume, 
    onVolumeChange,
    visible
}: { 
    isPlaying: boolean; 
    onToggleMusic: () => void, 
    onOpenTheme: () => void,
    themeName: string,
    volume: number,
    onVolumeChange: (val: number) => void,
    visible: boolean
}) => {
    const [isHovered, setIsHovered] = React.useState(false);

    if (!visible) return null;

    return (
        <div 
            className="fixed bottom-8 left-8 z-[9998] flex flex-col items-start gap-4 transition-opacity duration-500 ease-in-out"
            style={{ opacity: visible ? 1 : 0 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Control Bar Container */}
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl">
                
                {/* THEME WIDGET BUTTON */}
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenTheme(); }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-300 border border-transparent hover:border-purple-500/50 group relative"
                >
                    <Palette size={18} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black border border-white/10 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        Change Theme
                    </span>
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* MUSIC BUTTON */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleMusic(); }} 
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
            
            {/* NOW PLAYING TEXT */}
            <div className={`
                hidden md:flex flex-col overflow-hidden transition-all duration-500 pl-2
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
    
  // Transition & Helper State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

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

        // Helper Logic
        const hasSeenHelper = localStorage.getItem('has_seen_theme_onboarding');
        
        if (storedTheme) setActiveThemeId(storedTheme);
        if (storedMute !== null) setIsMuted(storedMute === 'true');
        if (storedVol) setVolume(parseInt(storedVol));
        if (!hasRegistered) setCurrentStage("register");
        else {
            setCurrentStage("v2");
            if (!hasSeenHelper) {
                setTimeout(() => setShowHelper(true), 4000);
            }
        }
    }
  }, []);

  const dismissHelper = () => {
    setShowHelper(false);
    localStorage.setItem('has_seen_theme_onboarding', 'true');
  };

  const handleOpenTheme = () => {
      setShowConfigurator(true);
      if(showHelper) dismissHelper();
  };

  // --- AUDIO CONTROL LOGIC ---

  const safePlay = useCallback(() => {
      if (isMuted || showConfigurator || !playerRef.current) return;
      try {
          // Force unmute first - browsers often start hidden videos as muted
          if(typeof playerRef.current.unMute === 'function') {
             playerRef.current.unMute();
          }
          if(typeof playerRef.current.setVolume === 'function') {
             playerRef.current.setVolume(volume);
          }
          if(typeof playerRef.current.playVideo === 'function') {
             playerRef.current.playVideo();
          }
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

  // GLOBAL CLICK LISTENER: Forces audio to wake up on first interaction
  useEffect(() => {
    const unlockAudio = () => {
        if(playerRef.current) {
            safePlay();
        }
    };
    // Add one-time listener to window to catch ANY click
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
  }, [safePlay]);

  const handleVolumeChange = (newVol: number) => {
      setVolume(newVol);
      localStorage.setItem('user_volume', newVol.toString());
      
      if(playerRef.current) {
        playerRef.current.setVolume(newVol);
        if (newVol > 0) {
            // Explicitly unmute if volume is raised
            playerRef.current.unMute?.();
        }
      }

      if (newVol > 0 && isMuted) {
          setIsMuted(false);
          localStorage.setItem('user_is_muted', 'false');
          safePlay(); 
      }
  };

  const handlePlayerReady = useCallback((player: any) => {
      playerRef.current = player;
      // Initialize mute/volume state
      if (isMuted) {
          player.mute?.();
      } else {
          player.unMute?.();
          player.setVolume?.(volume);
      }
      
      // Attempt play (might be blocked by browser until interaction)
      if (!isMuted && !showConfigurator) {
          player.playVideo?.();
      }
  }, [isMuted, showConfigurator, volume]);

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
          safePause();
      } else if (!showConfigurator) {
          safePlay();
      }
  }, [isMuted, showConfigurator, safePlay, safePause]);

  const handleRegisterComplete = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem('vip_user_registered', 'true'); 
    setCurrentStage("hold"); 
  }, []);

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
        setTimeout(() => setIsTransitioning(false), 100);
    }, 300);
  }, []);

  const handleHoldComplete = useCallback(() => setCurrentStage("content"), []);
  const handleV2Complete = useCallback(() => {
      setCurrentStage("content");
      const hasSeenHelper = localStorage.getItem('has_seen_theme_onboarding');
      if (!hasSeenHelper) setShowHelper(true);
      // Try to play audio when loading finishes
      safePlay();
  }, [safePlay]);

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

      {/* ONBOARDING HELPER (First Load Only) */}
      {showHelper && currentStage === 'content' && (
          <OnboardingHelper onDismiss={handleOpenTheme} />
      )}

      {/* TRANSITION OVERLAY */}
      <div 
        className={`fixed inset-0 z-[100002] bg-black pointer-events-none transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      />

      <BackgroundMusicSystem 
        themeId={activeThemeId} 
        onReady={handlePlayerReady} 
        volume={volume}
      />

      {/* MOVED OUTSIDE OF #theme-wrapper 
        This prevents CSS filters from breaking 'fixed' positioning 
      */}
      <BottomControls 
          visible={currentStage === 'content'}
          isPlaying={isPlaying} 
          onToggleMusic={toggleMusic} 
          onOpenTheme={handleOpenTheme}
          themeName={activeTheme.name} 
          volume={volume}
          onVolumeChange={handleVolumeChange}
      />

      {/* Main wrapper onClick acts as a fallback for audio unlocking */}
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