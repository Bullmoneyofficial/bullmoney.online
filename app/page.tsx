"use client";

import { Suspense, lazy, useState, useEffect, useRef } from "react";
import Hero from "@/components/hero";
import CTA from "@/components/Chartnews";
import { Features } from "@/components/features";
import { LiveMarketTicker } from "@/components/LiveMarketTicker";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";
import HiddenYoutubePlayer from "@/components/Mainpage/HiddenYoutubePlayer";
import { ALL_THEMES } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";

// Import loaders
import PageMode from "@/components/REGISTER USERS/pagemode";
import MultiStepLoaderv2 from "@/components/MultiStepLoaderv2";

// Lazy imports
const DraggableSplit = lazy(() => import('@/components/DraggableSplit'));
const SplineScene = lazy(() => import('@/components/SplineScene'));

// --- SMART CONTAINER: Handles Preloading & FPS Saving ---
function LazySplineContainer({ scene }: { scene: string }) {
  const [isInView, setIsInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        
        // Mark as loaded once it hits the buffer zone
        if (entry.isIntersecting && !hasLoadedOnce) {
          setHasLoadedOnce(true);
        }
      },
      { 
        // Load 600px before it hits the screen, Unload when 600px away
        rootMargin: '600px' 
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasLoadedOnce]);

  return (
    // 'isolate' is crucial here so the Interaction Button in SplineScene works correctly with z-index
    <div ref={containerRef} className="w-full h-full relative isolate transition-opacity duration-700">
      {isInView ? (
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-black/5 rounded">
             <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        }>
          <SplineScene scene={scene} />
        </Suspense>
      ) : (
        // Placeholder when scrolled away (saves FPS by unmounting the heavy 3D canvas)
        <div className={`w-full h-full bg-neutral-900/5 rounded transition-opacity duration-500 ${hasLoadedOnce ? 'opacity-100' : 'opacity-0'}`} />
      )}
    </div>
  );
}

function HomeContent() {
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState('t01'); // Ensure this matches your theme logic
  const [isMobile, setIsMobile] = useState(false);
  const [isMuted] = useState(false);
  
  // Theme & Audio setup
  const theme = ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  useAudioEngine(!isMuted, 'MECHANICAL');

  // 1. STEALTH PRE-LOADER
  useEffect(() => {
    const preloadSplineEngine = async () => {
      try {
        await import('@splinetool/runtime'); 
        console.log("3D Engine pre-cached in background");
      } catch (e) {
        console.warn("Preload failed", e);
      }
    };
    const t = setTimeout(preloadSplineEngine, 2000);
    return () => clearTimeout(t);
  }, []);

  // 2. Session Check
  useEffect(() => {
    const hasSession = localStorage.getItem("bullmoney_session");
    if (hasSession) {
      setCurrentView('loader');
    } else {
      setCurrentView('pagemode');
    }
    setIsInitialized(true);
  }, []);

  // 3. Mobile Check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 4. Theme Application
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.filter = isMobile ? theme.mobileFilter : theme.filter;
      root.style.setProperty('--accent-color', theme.accentColor || '#3b82f6');
    }
  }, [theme, isMobile]);

  const handlePageModeUnlock = () => {
    setCurrentView('loader');
  };

  useEffect(() => {
    if (currentView === 'loader') {
      const timer = setTimeout(() => {
        setCurrentView('content');
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  if (!isInitialized) return null;

  return (
    <>
      {currentView === 'pagemode' && (
        <div className="fixed inset-0 z-[99999]">
          <PageMode onUnlock={handlePageModeUnlock} />
        </div>
      )}

      {currentView === 'loader' && (
        <div className="fixed inset-0 z-[99999]">
          <MultiStepLoaderv2 />
        </div>
      )}

      {currentView === 'content' && (
        <>
          <main className="min-h-screen flex flex-col w-full overflow-x-hidden" data-allow-scroll data-scrollable>
            <Hero />
            <CTA />
            <Features />

            <section className="w-full max-w-7xl mx-auto px-4 py-16" data-allow-scroll>
              <div className="w-full h-[800px]">
                <Suspense fallback={<div className="w-full h-full bg-black/5 rounded-lg" />}>
                  <DraggableSplit>
                    {/* The Scenes */}
                    <LazySplineContainer scene="/scene4.splinecode" />
                    <LazySplineContainer scene="/scene3.splinecode" />
                  </DraggableSplit>
                </Suspense>
              </div>
            </section>

            <LiveMarketTicker />
          </main>

          {theme.youtubeId && (
            <HiddenYoutubePlayer
              videoId={theme.youtubeId}
              isPlaying={!isMuted}
              volume={isMuted ? 0 : 15}
            />
          )}
        </>
      )}
    </>
  );
}

export default function Home() {
  return (
    <GlobalThemeProvider>
      <HomeContent />
    </GlobalThemeProvider>
  );
}