"use client";

import { Suspense, lazy, useState, useEffect, useRef } from "react";
import Hero from "@/components/hero";
import CTA from "@/components/Chartnews";
import { Features } from "@/components/features";
import { LiveMarketTicker } from "@/components/LiveMarketTicker";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import HiddenYoutubePlayer from "@/components/Mainpage/HiddenYoutubePlayer";
import { ALL_THEMES } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";

// Import loaders
import PageMode from "@/components/REGISTER USERS/pagemode";
import MultiStepLoaderv2 from "@/components/MultiStepLoaderv2";

// Lazy imports
const DraggableSplit = lazy(() => import('@/components/DraggableSplit'));
const SplineScene = lazy(() => import('@/components/SplineScene'));
const TestimonialsCarousel = lazy(() => import('@/components/Testimonial').then(mod => ({ default: mod.TestimonialsCarousel })));

// --- SMART CONTAINER: Handles Preloading & FPS Saving ---
function LazySplineContainer({ scene }: { scene: string }) {
  const [isInView, setIsInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [canRender, setCanRender] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if device can handle 3D at mount
  useEffect(() => {
    const checkDevice = () => {
      const isSmallScreen = window.innerWidth < 480;
      const isMobile = window.innerWidth < 768;
      const memory = (navigator as any).deviceMemory || 4;
      
      // Disable on very small screens or low memory mobile devices
      if (isSmallScreen || (isMobile && memory < 3)) {
        setCanRender(false);
      }
    };
    checkDevice();
  }, []);

  // Track container size to prevent layout shifts
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canRender) return;
    
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
  }, [hasLoadedOnce, canRender]);

  // Show optimized fallback on devices that can't handle 3D
  if (!canRender) {
    return (
      <div className="w-full h-full min-h-[300px] relative bg-gradient-to-br from-black via-blue-950/30 to-black rounded-xl overflow-hidden" style={{ touchAction: 'pan-y' }}>
        {/* Shimmer effect like navbar */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
          <div 
            className="absolute animate-[spin_8s_linear_infinite] opacity-20" 
            style={{
              top: '50%',
              left: '50%',
              width: '300%',
              height: '300%',
              transform: 'translate(-50%, -50%)',
              background: 'conic-gradient(from 90deg at 50% 50%, transparent 0deg, rgba(59,130,246,0.4) 60deg, rgba(59,130,246,0.6) 120deg, rgba(59,130,246,0.4) 180deg, transparent 240deg, transparent 360deg)'
            }}
          />
        </div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {/* Use BullMoney logo instead of rocket emoji */}
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center overflow-hidden">
            <Image 
              src="/BULL.svg" 
              alt="BullMoney" 
              width={48} 
              height={48} 
              className="opacity-80"
              priority
            />
          </div>
          <p className="text-xs text-blue-300/60 font-semibold">3D View</p>
          <p className="text-[10px] text-blue-400/40">Optimized for your device</p>
        </div>
        
        <div className="absolute inset-0 rounded-xl border border-blue-500/20 pointer-events-none" />
      </div>
    );
  }

  return (
    // 'isolate' is crucial here so the Interaction Button in SplineScene works correctly with z-index
    // Use fixed height and contain:strict to prevent resize issues
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[300px] relative isolate overflow-hidden rounded-xl pointer-events-none md:pointer-events-auto"
      style={{ 
        contain: 'strict',
        touchAction: 'pan-y', // Allow vertical scrolling on touch devices
        position: 'relative'
      }}
    >
      {isInView ? (
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black via-blue-950/20 to-black rounded-xl">
             <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        }>
          <div className="absolute inset-0 pointer-events-none md:pointer-events-auto" style={{ touchAction: 'pan-y' }}>
            <SplineScene scene={scene} />
          </div>
        </Suspense>
      ) : (
        // Placeholder when scrolled away (saves FPS by unmounting the heavy 3D canvas)
        <div className={`absolute inset-0 bg-gradient-to-br from-black via-blue-950/10 to-black rounded-xl transition-opacity duration-500 ${hasLoadedOnce ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}

function HomeContent() {
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Use global theme context - syncs with hero.tsx and entire app
  const { activeThemeId, activeTheme, setAppLoading } = useGlobalTheme();
  
  // Fallback theme lookup if context not ready
  const theme = activeTheme || ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  useAudioEngine(!isMuted, 'MECHANICAL');
  
  useEffect(() => {
    if (currentView === 'content') {
      setAppLoading(false);
    } else {
      setAppLoading(true);
    }
  }, [currentView, setAppLoading]);

  // Load muted preference from localStorage
  useEffect(() => {
    const savedMuted = localStorage.getItem('bullmoney_muted');
    if (savedMuted === 'true') setIsMuted(true);
  }, []);

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

  // Theme is now applied by GlobalThemeProvider automatically

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

  if (!isInitialized) {
    // Show solid black screen while initializing to prevent any flash of content
    return (
      <>
        <style jsx global>{`
          nav, footer, header {
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
        <div className="fixed inset-0 z-[99999] bg-black" />
      </>
    );
  }

  return (
    <>


      {currentView === 'pagemode' && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <PageMode onUnlock={handlePageModeUnlock} />
        </div>
      )}

      {currentView === 'loader' && (
        <div className="fixed inset-0 z-[99999] bg-black">
          <MultiStepLoaderv2 />
        </div>
      )}

      {currentView === 'content' && (
        <>
          <main className="min-h-screen flex flex-col w-full overflow-x-hidden" data-allow-scroll data-scrollable>
            <Hero />
            <CTA />
            <Features />

            {/* 3D Spline Section - Hidden on small screens, show Testimonials instead */}
            <section className="w-full max-w-7xl mx-auto px-4 py-16 hidden md:block" data-allow-scroll style={{ touchAction: 'pan-y' }}>
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

            {/* Mobile-only Testimonials Section - Shows on small devices instead of heavy 3D */}
            <section className="w-full max-w-5xl mx-auto px-4 py-12 md:hidden" data-allow-scroll style={{ touchAction: 'pan-y' }}>
              <Suspense fallback={<div className="w-full h-[320px] bg-neutral-900/60 rounded-3xl animate-pulse" />}>
                <TestimonialsCarousel />
              </Suspense>
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

// Removed duplicate GlobalThemeProvider - already wrapped in layout.tsx
export default function Home() {
  return <HomeContent />;
}