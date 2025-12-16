"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import { MessageCircle, Volume2, VolumeX, X } from 'lucide-react';

// --- STATIC IMPORTS ---
import { ShopProvider } from "../VIP/ShopContext"; 
import { BlogProvider } from "@/app/Blogs/BlogContext"; 
import RecruitPage from "@/app/register/pageVip";
import Socials from "@/components/Mainpage/Socialsfooter";

// --- NEW IMPORTS FOR THEME SUPPORT ---
import { Navbar } from "@/components/Mainpage/navbar"; 
import { ALL_THEMES as THEME_DATA, Theme } from '@/components/Mainpage/ThemeComponents';

// --- DYNAMIC IMPORTS ---
const HeroShop = dynamic(() => import("@/app/Blogs/BlogHero"), { ssr: false });
const BlogPage = dynamic(() => import("@/app/Blogs/BlogPage"), { ssr: false });
const Chartnews = dynamic(() => import("@/app/Blogs/Chartnews"), { ssr: false });
const Shopmain = dynamic(() => import("@/components/Mainpage/ShopMainpage"), { ssr: false });
// Note: Livestreams was imported but not used in your return, kept it out to clean up warnings, add back if needed.

// --- DYNAMIC THEME CONFIGURATOR ---
const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { 
        ssr: false,
        loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">Loading Config...</div> 
    }
);

// --- DYNAMIC CURSOR IMPORT (Standardized) ---
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false,
  loading: () => <div className="hidden">Loading Cursor...</div> 
});

// =========================================
// 0. AUDIO HOOKS
// =========================================

// Hook 1: Loader Audio
const useLoaderAudio = (url: string, isVisible: boolean) => {
    useEffect(() => {
        if (!isVisible) return;
        const audio = new Audio(url);
        audio.loop = false;
        audio.volume = 1.0;
        const AUDIO_DURATION_MS = 4800;
        let timer: NodeJS.Timeout | null = null;

        const unlock = () => { audio.play().catch(() => {}); cleanupListeners(); };
        const cleanupListeners = () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        window.addEventListener('keydown', unlock);

        const attemptPlay = async () => {
            try {
                await audio.play();
                cleanupListeners();
            } catch (err) { /* Autoplay blocked */ }
        };
        attemptPlay();

        timer = setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            cleanupListeners(); 
        }, AUDIO_DURATION_MS);

        return () => {
            audio.pause();
            audio.currentTime = 0;
            if (timer) clearTimeout(timer);
            cleanupListeners();
        };
    }, [url, isVisible]);
};

// Hook 2: One-Time Track (News)
const useOneTimeTrack = (url: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false); 
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
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else if (!hasPlayedOnce || audio.currentTime > 0) {
      audio.play().catch(e => console.error("Playback failed:", e));
      setIsPlaying(true);
      setHasPlayedOnce(true); 
    }
  }, [isPlaying, hasPlayedOnce]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isPlaying && audio.currentTime === 0 && !hasPlayedOnce) {
      audio.play()
        .then(() => {
            setIsPlaying(true);
            setHasPlayedOnce(true);
        })
        .catch(e => console.log("Autoplay prevented:", e));
    }
  }, [isPlaying, hasPlayedOnce]);

  return { isPlaying, isFinished, toggle, play };
};

// Hook 3: Background Loop (Ambient)
const useBackgroundLoop = (url: string) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
  
    useEffect(() => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.01; 
      audioRef.current = audio;
  
      return () => {
        audio.pause();
        audio.src = "";
      };
    }, [url]);
  
    const start = useCallback(() => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.volume = 0.01; 
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
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
// 1. WIDGETS
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
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const telegramLink = "https://t.me/+dlP_A0ebMXs3NTg0";

  return (
    <div 
      className={`fixed bottom-8 right-8 z-[9999] transition-all duration-700 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute bottom-full right-0 mb-4 whitespace-nowrap px-5 py-2.5 bg-[#001a33]/90 backdrop-blur-xl border border-[#0066ff]/30 text-white text-sm font-medium rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 origin-bottom-right flex items-center gap-3 ${isHovered ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4 pointer-events-none'}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0099ff] shadow-[0_0_10px_rgba(0,153,255,0.8)]"></span>
        </span>
        <span className="tracking-wide text-blue-50 font-sans">Chat Support</span>
      </div>

      <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1">
        <div className={`absolute inset-0 rounded-full bg-[#0066ff] blur-[20px] transition-all duration-500 ${isHovered ? 'opacity-80 scale-125' : 'opacity-40 scale-110 animate-pulse'}`} />
        <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-[#0033cc] via-[#0066ff] to-[#3399ff] rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_6px_rgba(0,0,0,0.3)] overflow-hidden z-10 border border-[#66b3ff]/50">
            <div className="absolute inset-0 -translate-x-[150%] animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-15deg] z-20 pointer-events-none" />
            <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-full pointer-events-none z-20" />
            <div className={`relative z-30 transition-transform duration-500 ease-spring ${isHovered ? 'rotate-12 scale-110' : 'rotate-0'}`}>
                <MessageCircle className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" strokeWidth={2.5} />
            </div>
            <span className="absolute top-3.5 right-3.5 flex h-3 w-3 z-40">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white/20 shadow-sm"></span>
            </span>
        </div>
      </a>
    </div>
  );
};

// =========================================
// 4. MAIN PAGE COMPONENT
// =========================================
export default function Page({ searchParams }: { searchParams?: { src?: string }; }) {
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // --- THEME STATE ---
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('user_theme_id') || 't01';
    }
    return 't01';
  });

  const activeTheme: Theme = useMemo(() => {
    return THEME_DATA.find(t => t.id === activeThemeId) || THEME_DATA[0];
  }, [activeThemeId]);

  const handleThemeChange = useCallback((themeId: string) => {
    setActiveThemeId(themeId);
    if (typeof window !== 'undefined') {
        localStorage.setItem('user_theme_id', themeId);
    }
    setShowConfigurator(false); 
  }, []);

  // --- AUDIO LOGIC ---
  useLoaderAudio('/modals.mp3', !isUnlocked);

  const { 
    isPlaying: isNewsPlaying, 
    isFinished: isNewsFinished, 
    play: playNews, 
    toggle: toggleNews 
  } = useOneTimeTrack('/news.mp3');

  const { 
    isPlaying: isLoopPlaying, 
    start: startLoop, 
    toggle: toggleLoop 
  } = useBackgroundLoop('/background.mp3');

  // Logic: Unlock triggers News
  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
    playNews();
  }, [playNews]);

  // Logic: News Finish triggers Loop
  useEffect(() => {
    if (isNewsFinished && !isLoopPlaying) {
        startLoop();
    }
  }, [isNewsFinished, isLoopPlaying, startLoop]);

  // Logic: Smart Toggle
  const handleMusicToggle = useCallback(() => {
    if (isNewsPlaying) {
        toggleNews();
    } else {
        toggleLoop();
    }
  }, [isNewsPlaying, toggleNews, toggleLoop]);

  const isAnyAudioPlaying = isNewsPlaying || isLoopPlaying;

  // --- GLOBAL STYLES ---
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

      .target-cursor-wrapper { pointer-events: none; position: fixed; top: 0; left: 0; z-index: 10000; mix-blend-mode: difference; }
      .target-cursor-dot { width: 6px; height: 6px; background-color: #0066ff; border-radius: 50%; position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); box-shadow: 0 0 10px #0066ff, 0 0 20px rgba(0, 102, 255, 0.5); will-change: transform, scale; }
      .target-cursor-corner { position: absolute; width: 12px; height: 12px; border: 3px solid #0066ff; opacity: 1; will-change: transform, opacity, border-color; }
      .corner-tl { border-right: none; border-bottom: none; }
      .corner-tr { border-left: none; border-bottom: none; }
      .corner-br { border-left: none; border-top: none; }
      .corner-bl { border-right: none; border-top: none; }
      
      @keyframes shimmer { 0% { transform: translateX(-150%) skewX(-15deg); } 50%, 100% { transform: translateX(150%) skewX(-15deg); } }
      .animate-shimmer { animation: shimmer 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
    `}</style>
  );

  // Loader State
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <RecruitPage onUnlock={handleUnlock} />
      </main>
    );
  }

  return (
    <BlogProvider>
      <GlobalStyles />
      
      {/* THEME CONFIGURATOR OVERLAY */}
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

      {/* NAVBAR */}
      <Navbar 
          setShowConfigurator={setShowConfigurator} 
          activeThemeId={activeThemeId}
          onThemeChange={handleThemeChange}
      />

      <div className="relative animate-in fade-in duration-1000 pt-20"> {/* Added pt-20 for Navbar */}
        
        <TargetCursor 
            hideDefaultCursor={true} 
            spinDuration={2} 
            targetSelector="button, a, input, [role='button'], .cursor-target"
        />
        
        {/* Unified Audio Controller */}
        <MusicController isPlaying={isAnyAudioPlaying} onToggle={handleMusicToggle} />
        <SupportWidget />

        {/* CONTENT */}
        <Socials />
        
        <ShopProvider>
          <div className="min-h-screen bg-slate-950 text-white">
            <HeroShop />
            <BlogPage />
            <Shopmain />
            <Chartnews />
            
            <div ref={productsRef} />
          </div>
        </ShopProvider>
        
      </div>
    </BlogProvider>
  );
}