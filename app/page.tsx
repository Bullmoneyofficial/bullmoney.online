"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MessageCircle, Volume2, VolumeX, Music } from 'lucide-react';

// =========================================
// 1. IMPORT TARGET CURSOR
// =========================================
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false,
  loading: () => <div className="hidden">Loading Cursor...</div> 
});

// --- COMPONENTS ---
import { Features } from "@/components/Mainpage/features";
import { Hero } from "@/components/Mainpage/hero";
import { Pricing } from "../components/Mainpage/pricing"; 
import Shopmain from "../components/Mainpage/ShopMainpage"; 
import Socialsfooter from "../components/Mainpage/Socialsfooter";

// I'M ASSUMING RegisterPage is your visual LOADER/Splash Screen
import RegisterPage from "./register/pagemode"; 

import Heromain from "../app/VIP/heromain"; 
import  ShopFunnel  from "../app/shop/ShopFunnel"; 
import Chartnews from "@/app/Blogs/Chartnews";

// =========================================
// 2. AUDIO MANAGERS (Audio Hooks remain unchanged)
// =========================================

// Hook 1: Loader Audio (modals.mp3)
const useLoaderAudio = (url: string, enabled: boolean) => {
    useEffect(() => {
        if (!enabled) return;
        const audio = new Audio(url);
        audio.volume = 1.0; 
        
        const unlock = () => { audio.play().catch(() => {}); removeListeners(); };
        const removeListeners = () => {
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        };
    
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        
        audio.play().catch(() => {});
    
        const timer = setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
            removeListeners();
        }, 4800);
    
        return () => {
          audio.pause();
          audio.currentTime = 0;
          clearTimeout(timer);
          removeListeners();
        };
      }, [url, enabled]);
};

// Hook 2: Ambient (ambient.mp3)
const useOneTimeAmbient = (url: string, trigger: boolean) => {
    useEffect(() => {
        if (!trigger) return;
    
        const hasPlayed = typeof window !== 'undefined' ? localStorage.getItem('ambient_played_v1') : 'true';
        if (hasPlayed === 'true') return; 
    
        const audio = new Audio(url);
        audio.volume = 1.0; 
        audio.loop = false;
        
        audio.play()
          .then(() => localStorage.setItem('ambient_played_v1', 'true'))
          .catch((e) => console.log("Ambient autoplay blocked", e));
    
      }, [url, trigger]);
};

// Hook 3: Background Music (background.mp3) - FIXED VOLUME LOGIC
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
// 3. UI COMPONENTS (MusicController remains unchanged)
// =========================================

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

// =========================================
// 4. MAIN PAGE LOGIC - MODIFIED
// =========================================

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  
  // Tracks if the main content structure has mounted
  const [contentReady, setContentReady] = useState(false); 

  // Ref to track if the 5-second minimum time has elapsed
  const minTimeRef = useRef(false);

  // Function to manually unlock/load the content immediately
  const handleManualUnlock = useCallback(() => {
    // Override both conditions
    minTimeRef.current = true;
    setContentReady(true);
    setLoading(false);
    setShowContent(true); 
    startBgMusic(); 
  }, []);

  useLoaderAudio('/modals.mp3', loading);
  const { isPlaying, start: startBgMusic, toggle: toggleBgMusic } = useBackgroundLoop('/background.mp3');
  useOneTimeAmbient('/ambient.mp3', showContent);

  // 1. Hook to signal that the content has loaded/mounted
  useEffect(() => {
    setContentReady(true);
  }, []);


  // 2. Combined Logic: Wait for BOTH minimum time AND content readiness
  useEffect(() => {
    // A. Minimum Time Timer (5 seconds)
    const timer = setTimeout(() => {
      minTimeRef.current = true;
      
      // If content is already ready, flip the switch now.
      if (contentReady) {
        setLoading(false);
        setShowContent(true);
        startBgMusic();
      }
    }, 5000); 

    // B. Content Ready Trigger
    // If content becomes ready and the minimum time has elapsed, flip the switch.
    if (contentReady && minTimeRef.current) {
        setLoading(false);
        setShowContent(true);
        startBgMusic();
    }

    return () => clearTimeout(timer);
  }, [contentReady, startBgMusic]); 

  const GlobalStyles = () => (
    <style jsx global>{`
      /* ... (Your Global Styles remain unchanged) ... */
      html { scroll-behavior: smooth; }
      
      .target-cursor-wrapper { 
        pointer-events: none; 
        will-change: transform; 
        position: fixed; 
        top: 0; 
        left: 0; 
        z-index: 10000;
        mix-blend-mode: difference; 
      }
      .target-cursor-dot {
        width: 6px; 
        height: 6px; 
        background-color: #0066ff; 
        border-radius: 50%;
        position: absolute; 
        top: 0; 
        left: 0; 
        transform: translate(-50%, -50%); 
        box-shadow: 0 0 10px #0066ff, 0 0 20px rgba(0, 102, 255, 0.5);
        will-change: transform, scale;
      }
      .target-cursor-corner {
        position: absolute; 
        width: 12px; 
        height: 12px; 
        border: 3px solid #0066ff; 
        opacity: 1;
        will-change: transform, opacity, border-color;
      }
      
      .corner-tl { border-right: none; border-bottom: none; }
      .corner-tr { border-left: none; border-bottom: none; }
      .corner-br { border-left: none; border-top: none; }
      .corner-bl { border-right: none; border-top: none; }

      .fade-enter-active { animation: fadeIn 1s ease-out forwards; }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    `}</style>
  );

  return (
    <>
      <GlobalStyles />
      <Analytics />
      <SpeedInsights />

      {/* ✅ THE LOADER IMPLEMENTATION FIX: Ensuring the background is solid and on top */}
      {loading && (
        <div className="fixed inset-0 z-[99999] bg-black opacity-100">
          {/* CRITICAL: Ensure RegisterPage's internal root element has w-full h-full and a solid background color */}
          <RegisterPage onUnlock={handleManualUnlock} />
        </div>
      )}

      {/* ✅ MAIN CONTENT AREA FIX: Use pointer-events-none and opacity-0 to completely hide content when not ready */}
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
        
        {/* Render content when it's ready OR loading (to allow background mounting) */}
        {(showContent || loading) && ( 
          <div className="animate-in fade-in duration-1000">
            <MusicController isPlaying={isPlaying} onToggle={toggleBgMusic} />
          
            {/* The rest of your page components */}
            <Socialsfooter />
                <Heromain />
               <ShopFunnel />
                <Shopmain />
            <Chartnews />
      
          
         
        
            <div className="py-10">
     
            </div>
            <Pricing />
            <Features />
          </div>
        )}
      </main>
    </>
  );
}