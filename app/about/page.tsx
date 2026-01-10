"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { redirect } from "next/navigation";
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; 
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Volume2, Volume1, VolumeX, X, Palette, Sparkles, MessageCircle } from 'lucide-react'; 

// --- MASTER COMPONENT IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import RecruitPage from "@/app/register/pagemode"; // Stage 1
import BullMoneyGate from "@/components/Mainpage/TradingHoldUnlock"; // Stage 2
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2"; // Stage 3

// --- THEME & MUSIC DATA ---
import { ALL_THEMES, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';
import { safeGetItem, safeSetItem } from '@/lib/localStorage';

// --- DYNAMIC IMPORTS ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false, 
  loading: () => <div className="hidden">Loading...</div> 
});

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { ssr: false }
);

// --- PAGE SPECIFIC CONTENT IMPORTS ---
import { AboutContent } from "./AboutContent";
import { Pricing } from "@/app/shop/pricing"; 
import { Features as Why } from "@/components/Mainpage/features"; 
import Socials from "@/components/Mainpage/Socialsfooter";
import Shopmain from "@/components/Mainpage/ShopMainpage";

// --- FALLBACK THEME ---
const FALLBACK_THEME: Partial<Theme> = {
    id: 't01',
    name: 'Default',
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
            className="fixed inset-0 z-[2147483646] bg-black/60 backdrop-blur-[2px] cursor-pointer animate-in fade-in duration-700"
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
  volume: _
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
      enablejsapi: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  };

  return (
    <div className="fixed bottom-0 left-0 opacity-0 pointer-events-none z-[-1] overflow-hidden w-px h-px">
      <YouTube 
        videoId={videoId} 
        opts={opts} 
        onReady={(event: YouTubeEvent) => { 
            if(event.target) onReady(event.target);
        }}
        onStateChange={(event: YouTubeEvent) => { 
            if (event.data === -1 || event.data === 2) {}
        }}
      />
    </div>
  );
};

// ----------------------------------------------------------------------
// --- BOTTOM CONTROLS (THEME AWARE) ---
// ----------------------------------------------------------------------
const BottomControls = ({ 
    isPlaying, 
    onToggleMusic, 
    onOpenTheme,
    themeName, 
    volume, 
    onVolumeChange,
    visible,
    theme // NEW: Receives Theme Object
}: { 
    isPlaying: boolean; 
    onToggleMusic: () => void, 
    onOpenTheme: () => void,
    themeName: string,
    volume: number,
    onVolumeChange: (val: number) => void,
    visible: boolean,
    theme: Theme
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showHelper, setShowHelper] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowHelper(false), 8000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div 
            className="pointer-events-auto flex flex-col items-start gap-4 transition-all duration-700 ease-in-out absolute bottom-8 left-8"
            style={{ 
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)' 
            }}
            onMouseEnter={() => {
                setIsHovered(true);
                setShowHelper(false);
            }}
            onMouseLeave={() => setIsHovered(false)}
        >
            {showHelper && (
                <div className="absolute -top-12 left-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl animate-pulse flex items-center gap-2 whitespace-nowrap border border-white/20">
                    <Sparkles size={12} />
                    Customize your vibe here!
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-blue-600 rotate-45" />
                </div>
            )}

            {/* MAIN WIDGET PILL - THEME FILTER APPLIED */}
            <div 
                className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-white/20 transition-all duration-300"
                style={{ filter: theme.filter, WebkitFilter: theme.filter }}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenTheme(); }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400 transition-all duration-300 border border-transparent hover:border-purple-500/50 group relative"
                >
                    <Palette size={18} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                <button
                    onClick={(e) => { e.stopPropagation(); onToggleMusic(); }} 
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 relative
                    ${isPlaying ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-800 text-gray-500'}`}
                >
                    {isPlaying ? (volume > 50 ? <Volume2 size={18}/> : <Volume1 size={18}/>) : <VolumeX size={18}/>}
                    {isPlaying && <span className="absolute inset-0 rounded-full border border-blue-400 animate-ping opacity-20" />}
                </button>

                <div className={`flex items-center transition-all duration-500 overflow-hidden ${isHovered ? 'w-24 px-2 opacity-100' : 'w-0 opacity-0'}`}>
                    <input 
                        type="range" min="0" max="100" value={volume}
                        onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                        className="w-full h-1 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
            
            {/* TEXT BUBBLE - THEME FILTER APPLIED */}
            <div 
                className={`hidden md:flex flex-col overflow-hidden transition-all duration-500 pl-2 ${isPlaying ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}
                style={{ filter: theme.filter, WebkitFilter: theme.filter }}
            >
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Now Streaming</span>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-white truncate font-mono">{themeName} Radio</span>
                    <div className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 h-full bg-blue-500 animate-music-bar-1"/>
                        <span className="w-0.5 h-full bg-blue-500 animate-music-bar-2"/>
                        <span className="w-0.5 h-full bg-blue-500 animate-music-bar-3"/>
                    </div>
                </div>
            </div>
        </div>
    );
}

const SupportWidget = ({ theme }: { theme: Theme }) => {
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => { setTimeout(() => setIsVisible(true), 500); }, []);
    return (
      <div 
        className={`absolute bottom-8 right-8 z-[9999] pointer-events-auto transition-all duration-700 ease-out transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
        style={{ filter: theme.filter, WebkitFilter: theme.filter }}
      >
        <a
          href="https://t.me/+dlP_A0ebMXs3NTg0"
          target="_blank" rel="noopener noreferrer"
          className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute inset-0 rounded-full bg-[#0066ff] blur-[20px] opacity-40 animate-pulse group-hover:opacity-80 group-hover:scale-110 transition-all duration-500" />
          <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-[#0033cc] via-[#0066ff] to-[#3399ff] rounded-full shadow-inner border border-[#66b3ff]/50 overflow-hidden z-10">
              <MessageCircle className="w-7 h-7 text-white relative z-30" strokeWidth={2.5} />
          </div>
        </a>
      </div>
    );
};

// ----------------------------------------------------------------------
// --- MAIN PAGE COMPONENT ---
// ----------------------------------------------------------------------
export default function Page({
  searchParams,
}: {
  searchParams?: { src?: string };
}) {
  // Master Gating Logic
  if (searchParams?.src !== "nav") {
    redirect("/");
  }

  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('t01'); 
  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [isMuted, setIsMuted] = useState(false); 
  const [volume, setVolume] = useState(25);
  const playerRef = useRef<any>(null);
  
  // State to track if user is hovering a theme preview (to pause BG music)
  const [isPreviewing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  const activeTheme = useMemo(() => {
    return ALL_THEMES.find(t => t.id === activeThemeId) || (FALLBACK_THEME as Theme);
  }, [activeThemeId]);
    
  const isPlaying = useMemo(() => !isMuted, [isMuted]);

  useEffect(() => {
    setIsClient(true);
    const storedTheme = safeGetItem('user_theme_id');
    const storedMute = safeGetItem('user_is_muted');
    const storedVol = safeGetItem('user_volume');
    const hasRegistered = safeGetItem('vip_user_registered') === 'true';
    const hasSeenHelper = safeGetItem('has_seen_theme_onboarding');
    
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
  }, []);

  const dismissHelper = () => {
    setShowHelper(false);
    safeSetItem('has_seen_theme_onboarding', 'true');
  };

  const handleOpenTheme = () => {
      setShowConfigurator(true);
      if(showHelper) dismissHelper();
  };

  const safePlay = useCallback(() => {
      if (isMuted || showConfigurator || isPreviewing || !playerRef.current) return;
      try {
          if(typeof playerRef.current.unMute === 'function') playerRef.current.unMute();
          if(typeof playerRef.current.setVolume === 'function') playerRef.current.setVolume(volume);
          if(typeof playerRef.current.playVideo === 'function') playerRef.current.playVideo();
      } catch (e) { console.warn("Audio Player: Interaction prevented", e); }
  }, [isMuted, showConfigurator, isPreviewing, volume]);

  const safePause = useCallback(() => {
      try { playerRef.current?.pauseVideo?.(); } catch (e) {}
  }, []);

  useEffect(() => {
    const unlockAudio = () => { if(playerRef.current) safePlay(); };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
  }, [safePlay]);

  const handleVolumeChange = (newVol: number) => {
      setVolume(newVol);
      safeSetItem('user_volume', newVol.toString());
      if(playerRef.current) {
        playerRef.current.setVolume(newVol);
        if (newVol > 0) playerRef.current.unMute?.();
      }
      if (newVol > 0 && isMuted) {
          setIsMuted(false);
          safeSetItem('user_is_muted', 'false');
          safePlay(); 
      }
  };

  const handlePlayerReady = useCallback((player: any) => {
      playerRef.current = player;
      if (isMuted) player.mute?.();
      else {
          player.unMute?.();
          player.setVolume?.(volume);
      }
      if (!isMuted && !showConfigurator && !isPreviewing) player.playVideo?.();
  }, [isMuted, showConfigurator, isPreviewing, volume]);

  useEffect(() => {
      if (!playerRef.current) return;
      if (showConfigurator || isPreviewing) safePause();
      else if (!isMuted) safePlay();
  }, [showConfigurator, isPreviewing, isMuted, safePause, safePlay]);

  const toggleMusic = useCallback(() => {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      safeSetItem('user_is_muted', String(newMutedState));
      if (newMutedState) safePause();
      else if (!showConfigurator && !isPreviewing) safePlay();
  }, [isMuted, showConfigurator, isPreviewing, safePlay, safePause]);

  const handleRegisterComplete = useCallback(() => {
    safeSetItem('vip_user_registered', 'true');
    setCurrentStage("hold"); 
  }, []);

  const handleThemeChange = useCallback((themeId: string, _sound: SoundProfile, muted: boolean) => {
    setIsTransitioning(true);
    setTimeout(() => {
        setActiveThemeId(themeId);
        setIsMuted(muted); 
        safeSetItem('user_theme_id', themeId);
        safeSetItem('user_is_muted', String(muted));
        setShowConfigurator(false); 
        setTimeout(() => setIsTransitioning(false), 100);
    }, 300);
  }, []);

  const handleHoldComplete = useCallback(() => setCurrentStage("content"), []);
  const handleV2Complete = useCallback(() => {
      setCurrentStage("content");
      const hasSeenHelper = safeGetItem('has_seen_theme_onboarding');
      if (!hasSeenHelper) setShowHelper(true);
      safePlay();
  }, [safePlay]);

  if (!isClient) return null;

  return (
    <>
      <style jsx global>{`
        html, body { background-color: black; overflow-x: hidden; }
        .profit-reveal { animation: profitReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes profitReveal {
          0% { transform: scale(1.05); opacity: 0; filter: blur(15px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px); }
        }
        @keyframes music-bar-1 { 0%, 100% { height: 33%; } 50% { height: 100%; } }
        @keyframes music-bar-2 { 0%, 100% { height: 66%; } 50% { height: 33%; } }
        @keyframes music-bar-3 { 0%, 100% { height: 100%; } 50% { height: 66%; } }
        .animate-music-bar-1 { animation: music-bar-1 0.8s ease-in-out infinite; }
        .animate-music-bar-2 { animation: music-bar-2 1.1s ease-in-out infinite; }
        .animate-music-bar-3 { animation: music-bar-3 0.9s ease-in-out infinite; }
      `}</style>

      <Analytics />
      <SpeedInsights />

      {/* AUDIO SYSTEM */}
      <BackgroundMusicSystem 
        themeId={activeThemeId} 
        onReady={handlePlayerReady} 
        volume={volume}
      />

      {/* FIXED WIDGETS (Z-Index 400,000) - Now Receiving Theme */}
      <div className="fixed inset-0 z-[400000] pointer-events-none">
          <BottomControls 
              visible={currentStage === 'content'}
              isPlaying={isPlaying} 
              onToggleMusic={toggleMusic} 
              onOpenTheme={handleOpenTheme}
              themeName={activeTheme.name} 
              volume={volume}
              onVolumeChange={handleVolumeChange}
              theme={activeTheme}
          />
          <SupportWidget theme={activeTheme} />
      </div>

      {showHelper && currentStage === 'content' && (
          <OnboardingHelper onDismiss={handleOpenTheme} />
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="relative w-full min-h-screen" onClick={safePlay}>
        
        {/* CONFIGURATOR MODAL - Z-Index 300,000 */}
        {showConfigurator && (
            <div className="fixed inset-0 z-[300000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="relative w-full max-w-6xl h-[80vh] bg-[#020617] rounded-3xl border border-white/10 overflow-hidden">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowConfigurator(false); }}
                        className="absolute top-6 right-6 z-[10] p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={28} />
                    </button>
                    {/* @ts-ignore */}
                    <FixedThemeConfigurator 
                        initialThemeId={activeThemeId}
                        onThemeChange={handleThemeChange} 
                    />
                </div>
            </div>
        )}

        {/* GLOBAL THEME LENS - Z-Index 200,000 */}
        <div 
            id="global-theme-lens"
            className="fixed inset-0 pointer-events-none w-screen h-screen z-[200000]"
            style={{ 
                backdropFilter: activeTheme.filter,
                WebkitBackdropFilter: activeTheme.filter, 
                transition: 'backdrop-filter 0.5s ease' 
            }}
        />

        {/* LOADING & GATING - Z-Index 100,000 */}
        {currentStage === "register" && (
            <div 
                className="fixed inset-0 z-[100000] bg-black transition-all duration-500"
                style={{ 
                    filter: activeTheme.filter,
                    WebkitFilter: activeTheme.filter,
                    transform: 'translateZ(0)' 
                }}
            >
                {/* @ts-ignore */}
                <RecruitPage onUnlock={handleRegisterComplete} theme={activeTheme} />
            </div>
        )}
        {currentStage === "hold" && (
            <div 
                className="fixed inset-0 z-[100000] transition-all duration-500"
                style={{ 
                    filter: activeTheme.filter,
                    WebkitFilter: activeTheme.filter,
                    transform: 'translateZ(0)'
                }}
            >
                {/* @ts-ignore */}
                <BullMoneyGate onUnlock={handleHoldComplete} theme={activeTheme}>
                    <div className="hidden" /> 
                </BullMoneyGate>
            </div>
        )}
        {currentStage === "v2" && (
            <div 
                className="fixed inset-0 z-[100000] transition-all duration-500"
                style={{ 
                    filter: activeTheme.filter,
                    WebkitFilter: activeTheme.filter,
                    transform: 'translateZ(0)'
                }}
            >
                 {/* @ts-ignore */}
                <MultiStepLoaderV2 onFinished={handleV2Complete} theme={activeTheme} />
            </div>
        )}

        {/* PAGE CONTENT */}
        <div className={currentStage === 'content' ? 'profit-reveal' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
            
            <Navbar 
                setShowConfigurator={setShowConfigurator} 
                activeThemeId={activeThemeId}
                onThemeChange={(themeId) => handleThemeChange(themeId, 'MECHANICAL' as SoundProfile, isMuted)}
            />

            <main className="relative min-h-screen pt-20 px-6 z-10">
                <TargetCursor spinDuration={2} hideDefaultCursor={true} targetSelector="a, button" />
                
                {/* CONTENT SPECIFIC TO THIS PAGE */}
                <Socials />
                {/* @ts-ignore */}
                <Pricing themeId={activeThemeId} theme={activeTheme} />
                {/* @ts-ignore */}
                <Shopmain themeId={activeThemeId} theme={activeTheme} />
                <Why />
                <AboutContent />
            </main>
        </div>
      </div>
      
      {/* FIXED BACKGROUND FADE - Z-Index 500,000 */}
      <div className={`fixed inset-0 z-[500000] bg-black pointer-events-none transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
    </>
  );
}
