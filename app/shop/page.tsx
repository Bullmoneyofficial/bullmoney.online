"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle, Volume2, VolumeX, X } from 'lucide-react';

// --- STATIC IMPORTS (Core Layout/Context) ---
import { ShopProvider } from "@/app/VIP/ShopContext";
import RecruitPage from "@/app/register/pageVip";
import Socials from "@/components/Mainpage/Socialsfooter";

// --- NEW IMPORTS FOR THEME SUPPORT ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import { ALL_THEMES as THEME_DATA, Theme } from '@/components/Mainpage/ThemeComponents';

// --- DYNAMIC IMPORTS (Main Content) ---
const HeroShop = dynamic(() => import("@/app/shop/ShopHero"), { ssr: false });
const ProductsSection = dynamic(() => import("@/app/VIP/ProductsSection"), { ssr: false });
const ShopFunnel = dynamic(() => import("@/app/shop/ShopFunnel"), { ssr: false });
const Shopmain = dynamic(() => import("@/components/Mainpage/ShopMainpage"), { ssr: false });

// --- DYNAMIC THEME CONFIGURATOR ---
const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { 
        ssr: false,
        loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Loading Config...</div> 
    }
);

// --- DYNAMIC CURSOR IMPORT ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false,
  loading: () => <div className="hidden">Loading Cursor...</div> 
});

// =========================================
// 1. AUDIO LOGIC (RETAINING FIXES)
// =========================================

const useLoaderAudio = (url: string, isVisible: boolean) => {
    useEffect(() => {
        if (!isVisible) return;
        const audio = new Audio(url);
        audio.volume = 1.0;
        
        const unlock = () => { audio.play().catch(() => {}); cleanup(); };
        const cleanup = () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };

        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        audio.play().catch(() => {});

        const timer = setTimeout(() => {
            audio.pause();
            cleanup(); 
        }, 4800);

        return () => { audio.pause(); clearTimeout(timer); cleanup(); };
    }, [url, isVisible]);
};

const useOneTimeTrack = (url: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tune = new Audio(url);
      tune.loop = false; 
      tune.volume = 0.4; 
      audioRef.current = tune;
      
      const handleEnded = () => { 
          setIsPlaying(false); 
          setIsFinished(true); 
      };
      tune.addEventListener('ended', handleEnded);

      return () => {
        tune.pause();
        tune.src = "";
        tune.removeEventListener('ended', handleEnded);
      };
    }
  }, [url]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isFinished) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, isFinished]); 

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isPlaying && !isFinished) { 
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  }, [isPlaying, isFinished]);

  return { isPlaying, isFinished, toggle, play }; 
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

// =========================================
// 2. UI COMPONENTS
// =========================================

const MusicController = ({ isPlaying, onToggle }: { isPlaying: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`fixed bottom-8 left-8 z-[9999] group flex items-center justify-center w-12 h-12 rounded-full 
    transition-all duration-500 border border-[#66b3ff]/30 backdrop-blur-md
    ${isPlaying ? 'bg-[#0066ff]/20 shadow-[0_0_15px_rgba(0,102,255,0.5)]' : 'bg-gray-900/50 grayscale'}`}
  >
    {isPlaying && (
      <div className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-50">
          {[1,2,3,4].map(i => (
            <div key={i} className="w-[3px] bg-blue-400 rounded-full animate-pulse" 
                style={{ height: '60%', animationDuration: `${0.5 + i * 0.1}s` }} />
          ))}
      </div>
    )}
    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
      {isPlaying ? <Volume2 className="w-5 h-5 text-blue-100" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
    </div>
  </button>
);

const SupportWidget = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { setTimeout(() => setIsVisible(true), 500); }, []);
  return (
    <div className={`fixed bottom-8 right-8 z-[9999] transition-all duration-700 ease-out transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
    }`}>
      <a
        href="https://t.me/+dlP_A0ebMXs3NTg0"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1"
      >
        <div className="absolute inset-0 rounded-full bg-[#0066ff] blur-[20px] opacity-40 animate-pulse group-hover:opacity-80 group-hover:scale-110 transition-all duration-500" />
        <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-[#0033cc] via-[#0066ff] to-[#3399ff] rounded-full shadow-inner border border-[#66b3ff]/50 overflow-hidden z-10">
            <MessageCircle className="w-7 h-7 text-white relative z-30" strokeWidth={2.5} />
            <span className="absolute top-3.5 right-3.5 flex h-3 w-3 z-40">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white/20"></span>
            </span>
        </div>
      </a>
    </div>
  );
};


// =========================================
// 4. SHOP PAGE MAIN COMPONENT
// =========================================
export default function ShopPage() {
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // --- THEME STATE MANAGEMENT ---
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('user_theme_id') || 't01';
    }
    return 't01';
  });

  // Calculate active theme
  const activeTheme: Theme = useMemo(() => {
    return THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[0];
  }, [activeThemeId]);

  // Handle Theme Change
  const handleThemeChange = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_theme_id', themeId);
    }
    setShowConfigurator(false); 
  }, []);
  
  // --- AUDIO LOGIC ---
  const { 
    isPlaying: isTrackPlaying, 
    isFinished: isTrackFinished, 
    toggle: toggleOneTimeTrack, 
    play: playOneTimeTrack 
  } = useOneTimeTrack('/shop.mp3'); 

  const {
    isPlaying: isLooping, 
    start: startBgLoop, 
    toggle: toggleBgLoop 
  } = useBackgroundLoop('/background.mp3'); 

  const isAnyAudioPlaying = isTrackPlaying || isLooping;

  useLoaderAudio('/modals.mp3', !isUnlocked);

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
    playOneTimeTrack();
  }, [playOneTimeTrack]);

  useEffect(() => {
    if (isTrackFinished && !isLooping) {
      startBgLoop(); 
    }
  }, [isTrackFinished, isLooping, startBgLoop]);

  const handleMusicToggle = useCallback(() => {
    if (isTrackPlaying) toggleOneTimeTrack(); 
    else if (!isTrackFinished) toggleOneTimeTrack();
    else toggleBgLoop(); 
  }, [isTrackPlaying, isTrackFinished, toggleOneTimeTrack, toggleBgLoop]);


  // --- GLOBAL THEME STYLES ---
  const GlobalStyles = () => (
    <style jsx global>{`
      html, body, #__next {
        scroll-behavior: smooth;
        background-color: black; 
        transition: filter 0.5s ease-in-out; 
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
      
      /* Cursor Styles embedded here */
      .target-cursor-wrapper { pointer-events: none; position: fixed; top: 0; left: 0; z-index: 10000; mix-blend-mode: difference; }
      .target-cursor-dot { width: 6px; height: 6px; background-color: #0066ff; border-radius: 50%; position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); box-shadow: 0 0 10px #0066ff, 0 0 20px rgba(0, 102, 255, 0.5); will-change: transform, scale; }
      .target-cursor-corner { position: absolute; width: 12px; height: 12px; border: 3px solid #0066ff; opacity: 1; will-change: transform, opacity, border-color; }
      .corner-tl { border-right: none; border-bottom: none; }
      .corner-tr { border-left: none; border-bottom: none; }
      .corner-br { border-left: none; border-top: none; }
      .corner-bl { border-right: none; border-top: none; }
    `}</style>
  );

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <RecruitPage onUnlock={handleUnlock} />
      </main>
    );
  }

  return (
    <ShopProvider>
      <GlobalStyles />
      
      {/* THEME CONFIGURATOR OVERLAY 
          CRITICAL FIX: 'pointer-events-none' when hidden prevents blocking clicks 
      */}
      <div 
          className={`fixed inset-0 z-[9000] transition-opacity duration-300 
              ${showConfigurator ? 'opacity-100 pointer-events-auto backdrop-blur-sm bg-black/80' : 'opacity-0 pointer-events-none'}`}
          style={{ filter: activeTheme.filter }} 
      >
        <div className="flex items-center justify-center w-full h-full p-4 md:p-8">
            <button 
                onClick={() => setShowConfigurator(false)}
                className="absolute top-4 right-4 z-[9001] p-3 text-white rounded-full bg-black/50 hover:bg-black/80 transition-colors"
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

      {/* NAVBAR (Required to open theme settings) */}
      <Navbar 
          setShowConfigurator={setShowConfigurator} 
          activeThemeId={activeThemeId}
          onThemeChange={handleThemeChange}
      />

      <div className="relative min-h-screen bg-slate-950 text-white animate-in fade-in duration-1000">
        <TargetCursor
          spinDuration={2}
          hideDefaultCursor={true}
          targetSelector=".cursor-target, a, button"
        />
        
        <MusicController isPlaying={isAnyAudioPlaying} onToggle={handleMusicToggle} />
        <SupportWidget />

        <div className="relative z-10 pt-20"> {/* Added pt-20 for Navbar spacing */}
          <Socials />
          
          <HeroShop />
          
          <div ref={productsRef}>
            <ProductsSection />
            <ShopFunnel />
            <Shopmain />
          </div>
        </div>

      </div>
    </ShopProvider>
  );
}