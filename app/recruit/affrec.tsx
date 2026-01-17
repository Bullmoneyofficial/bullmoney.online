"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube'; 
import { Volume2, Volume1, VolumeX, X, Palette, Sparkles, MessageCircle } from 'lucide-react'; 

// --- CORE STATIC IMPORTS ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import { ALL_THEMES, Theme, THEME_SOUNDTRACKS, SoundProfile } from '@/components/Mainpage/ThemeComponents';

// --- LOADER IMPORTS ---
import { MultiStepLoader } from "@/components/Mainpage/MultiStepLoaderAffiliate"; 
import MultiStepLoaderV2 from "@/components/Mainpage/MultiStepLoaderv2";         
import BullMoneyGate from "@/components/Mainpage/TradingHoldUnlock";                      

// --- PAGE CONTENT IMPORTS ---
import RecruitPage from "@/app/register/New"; 
import RegisterPage from "@/app/recruit/RecruitPage";
import Socials from "@/components/Mainpage/Socialsfooter"; 

// --- DYNAMIC IMPORTS ---
const Shopmain = dynamic(() => import("@/components/Mainpage/ShopMainpage"), { ssr: false });
const AffiliateAdmin = dynamic(() => import("@/app/register/AffiliateAdmin"), { ssr: false });
const AffiliateRecruitsDashboard = dynamic(() => import("@/app/recruit/AffiliateRecruitsDashboard"), { ssr: false });

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.ThemeSelector), 
    { ssr: false }
);

const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false,
  loading: () => <div className="hidden"></div> 
});

// --- FALLBACK THEME ---
const FALLBACK_THEME: Partial<Theme> = {
    id: 'default',
    name: 'Loading...',
    filter: 'none',
    mobileFilter: 'none',
};

// --- HELPER: GET THEME COLOR ---
// Maps theme IDs to colors if primaryColor isn't explicitly in your Theme type
const getThemeColor = (theme: Partial<Theme> | any) => {
    if (theme?.primaryColor) return theme.primaryColor;
    
    // Fallback mapping based on common theme IDs
    const colorMap: Record<string, string> = {
        't01': '#3b82f6', // Blue (Default)
        't02': '#22c55e', // Green (Matrix)
        't03': '#ef4444', // Red (Sith)
        't04': '#a855f7', // Purple (Neon)
        't05': '#eab308', // Gold
        't06': '#ec4899', // Pink
    };
    return colorMap[theme?.id] || '#3b82f6';
};

// =========================================
// 1. ONBOARDING HELPER
// =========================================
const OnboardingHelper = ({ onDismiss, theme }: { onDismiss: () => void, theme: any }) => {
    const color = getThemeColor(theme);
    return (
        <div 
            onClick={onDismiss}
            className="fixed inset-0 z-[500000] bg-black/60 backdrop-blur-[2px] cursor-pointer animate-in fade-in duration-700"
        >
            <div className="relative w-full h-full">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <h2 
                        className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter animate-pulse"
                        style={{ textShadow: `0 0 25px ${color}99` }}
                    >
                        Customize Your Vibe
                    </h2>
                    <p className="text-white/80 text-lg md:text-xl font-mono opacity-90">
                        Choose a Theme & Soundtrack
                    </p>
                    <div className="mt-4 text-xs text-white/40 uppercase tracking-widest">Click anywhere to start</div>
                </div>
            </div>
        </div>
    );
};

// =========================================
// 2. AUDIO ARCHITECTURE
// =========================================
const BackgroundMusicSystem = ({ 
  themeId, 
  onReady,
  volume 
}: { 
  themeId: string;
  onReady: (player: any) => void;
  volume: number;
}) => {
  const soundProfile = THEME_SOUNDTRACKS?.[themeId];
  const videoId = typeof soundProfile === 'object' && 'name' in soundProfile 
    ? soundProfile.name 
    : (typeof soundProfile === 'string' ? soundProfile : 'jfKfPfyJRdk');
    
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

// =========================================
// 3. UI CONTROLS (STICKY)
// =========================================
const BottomControls = ({ 
    isPlaying, 
    onToggleMusic, 
    onOpenTheme,
    theme, 
    volume, 
    onVolumeChange,
    visible
}: { 
    isPlaying: boolean; 
    onToggleMusic: () => void, 
    onOpenTheme: () => void,
    theme: any,
    volume: number,
    onVolumeChange: (val: number) => void,
    visible: boolean
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showHelper, setShowHelper] = useState(true);
    const color = getThemeColor(theme);

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
                <div 
                    className="absolute -top-12 left-0 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl animate-pulse flex items-center gap-2 whitespace-nowrap border border-white/20"
                    style={{ background: `linear-gradient(90deg, ${color}, #000000)` }}
                >
                    <Sparkles size={12} />
                    Customize your vibe here!
                    <div className="absolute -bottom-1 left-4 w-2 h-2 rotate-45" style={{ backgroundColor: color }} />
                </div>
            )}

            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-white/20 transition-colors">
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenTheme(); }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-gray-400 transition-all duration-300 border border-transparent group relative hover:text-white"
                    style={{
                        // Dynamic Hover logic is hard in inline styles without state, keeping clean using active state styling below
                    }}
                >   
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: color }} />
                    <Palette size={18} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                <button
                    onClick={(e) => { e.stopPropagation(); onToggleMusic(); }} 
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 relative`}
                    style={{
                        backgroundColor: isPlaying ? `${color}33` : '#1f2937', // 33 is approx 20% opacity
                        color: isPlaying ? color : '#6b7280',
                        boxShadow: isPlaying ? `0 0 15px ${color}4d` : 'none'
                    }}
                >
                    {isPlaying ? (volume > 50 ? <Volume2 size={18}/> : <Volume1 size={18}/>) : <VolumeX size={18}/>}
                    {isPlaying && <span className="absolute inset-0 rounded-full border animate-ping opacity-20" style={{ borderColor: color }} />}
                </button>

                <div className={`flex items-center transition-all duration-500 overflow-hidden ${isHovered ? 'w-24 px-2 opacity-100' : 'w-0 opacity-0'}`}>
                    <input 
                        type="range" min="0" max="100" value={volume}
                        onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                        className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: color, backgroundColor: `${color}33` }}
                    />
                </div>
            </div>
            
            <div className={`hidden md:flex flex-col overflow-hidden transition-all duration-500 pl-2 ${isPlaying ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Now Streaming</span>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-white truncate font-mono">{theme.name} Radio</span>
                    <div className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 h-full animate-music-bar-1" style={{ backgroundColor: color }}/>
                        <span className="w-0.5 h-full animate-music-bar-2" style={{ backgroundColor: color }}/>
                        <span className="w-0.5 h-full animate-music-bar-3" style={{ backgroundColor: color }}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

const SupportWidget = ({ theme }: { theme: any }) => {
  const [isVisible, setIsVisible] = useState(false);
  const color = getThemeColor(theme);
  
  useEffect(() => { setTimeout(() => setIsVisible(true), 500); }, []);
  
  return (
    <div className={`absolute bottom-8 right-8 z-[9999] pointer-events-auto transition-all duration-700 ease-out transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
    }`}>
      <a
        href="https://t.me/+dlP_A0ebMXs3NTg0"
        target="_blank" rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1"
      >
        <div 
            className="absolute inset-0 rounded-full blur-[20px] opacity-40 animate-pulse group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
            style={{ backgroundColor: color }} 
        />
        <div 
            className="relative flex items-center justify-center w-full h-full rounded-full shadow-inner border overflow-hidden z-10"
            style={{
                background: `linear-gradient(135deg, ${color}dd, ${color}, ${color}aa)`,
                borderColor: `${color}88`
            }}
        >
            <div className="absolute inset-0 bg-white/20 group-hover:bg-white/0 transition-colors" />
            <MessageCircle className="w-7 h-7 text-white relative z-30 drop-shadow-md" strokeWidth={2.5} />
        </div>
      </a>
    </div>
  );
};

// =========================================
// 4. MAIN PAGE COMPONENT
// =========================================

const affiliateLoadingStates = [
  { text: "ESTABLISHING SECURE CONNECTION" },
  { text: "VERIFYING AFFILIATE PROTOCOLS" },
  { text: "SYNCING RECRUIT DATABASE" },
  { text: "DECRYPTING DASHBOARD ACCESS" },
  { text: "WELCOME, ADMIN" },
];

export default function AffiliatePage({ searchParams }: { searchParams?: { src?: string } }) {
  const router = useRouter();
  
  const [currentStage, setCurrentStage] = useState<"recruit" | "affiliate" | "v2" | "hold" | "content">("recruit");
  
  const [isClient, setIsClient] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('t01'); 
  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [isMuted, setIsMuted] = useState(false); 
  const [volume, setVolume] = useState(25);
  const playerRef = useRef<any>(null);
  
  const [isPreviewing, setIsPreviewing] = useState(false);
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
        const hasSeenHelper = localStorage.getItem('has_seen_theme_onboarding');
        const hasCompletedRecruit = sessionStorage.getItem('affiliate_recruit_complete');
        
        if (storedTheme) setActiveThemeId(storedTheme);
        if (storedMute !== null) setIsMuted(storedMute === 'true');
        if (storedVol) setVolume(parseInt(storedVol));
        
        if (searchParams?.src !== "nav") {
             router.push("/");
        } else {
            // If user already completed recruit, skip to affiliate loader
            if (hasCompletedRecruit) {
                setCurrentStage("affiliate");
            } else {
                setCurrentStage("recruit");
            }
            if (!hasSeenHelper) {
                setTimeout(() => setShowHelper(true), 4000);
            }
        }
    }
  }, [searchParams, router]);

  // Handle recruit completion -> move to affiliate loader
  const handleRecruitComplete = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('affiliate_recruit_complete', 'true');
    }
    setCurrentStage("affiliate");
  }, []);

  // --- LOGIC: Affiliate -> V2 (Refresh) OR Hold (1st Load) ---
  useEffect(() => {
    if (currentStage === "affiliate") {
        const timer = setTimeout(() => {
            const hasVisited = sessionStorage.getItem('affiliate_unlock_complete');
            if (hasVisited) {
                setCurrentStage("v2");
            } else {
                setCurrentStage("hold");
            }
        }, 5000); 
        return () => clearTimeout(timer);
    }
  }, [currentStage]);

  // Scroll Lock
  useEffect(() => {
    if (currentStage !== "content") {
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
  }, [currentStage]);


  const dismissHelper = () => {
    setShowHelper(false);
    localStorage.setItem('has_seen_theme_onboarding', 'true');
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
      localStorage.setItem('user_volume', newVol.toString());
      if(playerRef.current) {
        playerRef.current.setVolume(newVol);
        if (newVol > 0) playerRef.current.unMute?.();
      }
      if (newVol > 0 && isMuted) {
          setIsMuted(false);
          localStorage.setItem('user_is_muted', 'false');
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
      if (!isMuted && !showConfigurator && !isPreviewing && currentStage === 'content') player.playVideo?.();
  }, [isMuted, showConfigurator, isPreviewing, volume, currentStage]);

  useEffect(() => {
      if (!playerRef.current) return;
      if (showConfigurator || isPreviewing) safePause();
      else if (!isMuted) safePlay();
  }, [showConfigurator, isPreviewing, isMuted, safePause, safePlay]);

  const toggleMusic = useCallback(() => {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      localStorage.setItem('user_is_muted', String(newMutedState));
      if (newMutedState) safePause();
      else if (!showConfigurator && !isPreviewing) safePlay();
  }, [isMuted, showConfigurator, isPreviewing, safePlay, safePause]);

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

  const handleV2Complete = useCallback(() => {
      setCurrentStage("content");
      safePlay();
  }, [safePlay]);

  const handleHoldComplete = useCallback(() => {
      sessionStorage.setItem('affiliate_unlock_complete', 'true');
      setCurrentStage("content");
      safePlay(); 
  }, [safePlay]);

  if (!isClient || searchParams?.src !== "nav") return null;

  return (
    <>
      <style jsx global>{`
        html, body {
          background-color: black; 
          overflow-x: hidden;
        }
        .profit-reveal {
          animation: profitReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
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

      {/* AUDIO SYSTEM */}
      <BackgroundMusicSystem 
        themeId={activeThemeId} 
        onReady={handlePlayerReady} 
        volume={volume}
      />

      {/* FIXED WIDGETS (Z-Index 400,000) */}
      <div className="fixed inset-0 z-[400000] pointer-events-none">
          <BottomControls 
              visible={currentStage === 'content'}
              isPlaying={isPlaying} 
              onToggleMusic={toggleMusic} 
              onOpenTheme={handleOpenTheme}
              theme={activeTheme} 
              volume={volume}
              onVolumeChange={handleVolumeChange}
          />
          <SupportWidget theme={activeTheme} />
      </div>

      {showHelper && currentStage === 'content' && (
          <OnboardingHelper onDismiss={handleOpenTheme} theme={activeTheme} />
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="relative w-full min-h-screen" onClick={safePlay}>
        
        {/* CONFIGURATOR MODAL (Z-Index 300,000) */}
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

        {/* GLOBAL THEME LENS (Z-Index 200,000) - Tints everything below */}
        <div 
            id="global-theme-lens"
            className="fixed inset-0 pointer-events-none w-screen h-screen z-[200000]"
            style={{ 
                backdropFilter: currentStage !== 'recruit' ? activeTheme.filter : 'none',
                WebkitBackdropFilter: currentStage !== 'recruit' ? activeTheme.filter : 'none', 
                transition: 'backdrop-filter 0.5s ease' 
            }}
        />

        {/* RECRUIT STAGE - Registration Form (Shows First) */}
        {currentStage === "recruit" && (
            <div className="fixed inset-0 z-[100000] bg-[#050B14] overflow-auto">
                <RegisterPage onUnlock={handleRecruitComplete} />
            </div>
        )}

        {/* LOADER STACK (Z-Index 100,000) - Below Lens */}
        {currentStage === "affiliate" && (
             <div 
                className="fixed inset-0 z-[100000] bg-black transition-all duration-500"
                style={{ 
                    filter: activeTheme.filter,
                    WebkitFilter: activeTheme.filter,
                    transform: 'translateZ(0)'
                }}
            >
                 <MultiStepLoader 
                    loadingStates={affiliateLoadingStates} 
                    loading={true} 
                  />
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
                    <></> 
                </BullMoneyGate>
            </div>
        )}

        {/* PAGE CONTENT (Default Z-Index) */}
        <div className={currentStage === 'content' ? 'profit-reveal' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
            
            <Navbar 
                setShowConfigurator={setShowConfigurator} 
                activeThemeId={activeThemeId}
                onThemeChange={(themeId) => handleThemeChange(themeId, { name: 'MECHANICAL', volume: 50 }, isMuted)}
            />

            <main className="relative min-h-screen z-10">
                <TargetCursor spinDuration={2} hideDefaultCursor={true} targetSelector=".cursor-target, a, button" />
                
                {currentStage === 'content' && ( 
                    <div className="relative pt-20">
                         {/* @ts-ignore */}
                        <Socials themeId={activeThemeId} theme={activeTheme} />
                        {/* @ts-ignore */}
                        <Shopmain themeId={activeThemeId} theme={activeTheme} /> 
                        
                        {/* RecruitPage already shown in recruit stage - now show dashboard */}
                        <AffiliateRecruitsDashboard onBack={() => router.push("/")} /> 
                        <AffiliateAdmin /> 
                    </div>
                )}
            </main>
        </div>
      </div>
      
      {/* FIXED BACKGROUND FADE - Z-Index 500,000 */}
      <div className={`fixed inset-0 z-[500000] bg-black pointer-events-none transition-opacity duration-300 ease-in-out ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
    </>
  );
}