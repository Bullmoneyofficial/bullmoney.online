"use client";

import { Suspense, lazy, useState, useEffect, useRef } from "react";
import Hero from "@/components/hero";
import CTA from "@/components/Chartnews";
import { Features } from "@/components/features";
import { detectBrowser } from "@/lib/browserDetection";

// ==========================================
// KEYFRAMES STYLES (Injected once)
// ==========================================
const PageStyles = () => (
  <style jsx global>{`
    @keyframes page-shimmer-ltr {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes page-pulse-glow {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
    @keyframes page-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes page-dot-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.3); }
    }
    @keyframes page-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .page-shimmer-ltr {
      animation: page-shimmer-ltr 3s linear infinite;
    }
    .page-spin {
      animation: page-spin 4s linear infinite;
    }
    .page-pulse-glow {
      animation: page-pulse-glow 3s ease-in-out infinite;
    }
    .page-dot-pulse {
      animation: page-dot-pulse 1.5s ease-in-out infinite;
    }
    .page-float {
      animation: page-float 3s ease-in-out infinite;
    }
    
    /* Respect user preference for reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .page-shimmer-ltr,
      .page-spin,
      .page-pulse-glow,
      .page-dot-pulse,
      .page-float {
        animation: none;
      }
    }
    
    /* Reduce animations on mobile to save battery and prevent jank */
    @media (max-width: 768px) {
      .page-shimmer-ltr {
        animation-duration: 6s;
      }
      .page-spin {
        animation-duration: 8s;
      }
    }
  `}</style>
);
// Use optimized ticker for 120Hz performance
import { LiveMarketTickerOptimized as LiveMarketTicker } from "@/components/LiveMarketTickerOptimized";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import HiddenYoutubePlayer from "@/components/Mainpage/HiddenYoutubePlayer";
import { ALL_THEMES } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";

import MobileSwipeNavigator from "@/components/navigation/MobileSwipeNavigator";
import DesktopKeyNavigator from "@/components/navigation/DesktopKeyNavigator";

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
  const [showFallback, setShowFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if device can handle 3D at mount
  useEffect(() => {
    const checkDevice = () => {
      // Check browser capabilities first
      const browserInfo = detectBrowser();
      if (browserInfo.isInAppBrowser || !browserInfo.canHandle3D) {
        console.log('[LazySpline] Disabled for:', browserInfo.browserName);
        setCanRender(false);
        setShowFallback(true);
        return;
      }
      
      const isSmallScreen = window.innerWidth < 480;
      const isMobile = window.innerWidth < 768;
      const memory = (navigator as any).deviceMemory || 4;
      
      // Disable on very small screens or low memory mobile devices
      if (isSmallScreen || (isMobile && memory < 3)) {
        setCanRender(false);
        setShowFallback(true);
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
      <div className="w-full h-full min-h-[300px] relative bg-black rounded-2xl overflow-hidden group" style={{ touchAction: 'pan-y' }}>
        {/* Spinning Conic Gradient Shimmer Border */}
        <span className="absolute inset-[-2px] page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#60a5fa_50%,#3b82f6_75%,#00000000_100%)] opacity-50 rounded-2xl" />
        
        {/* Inner container */}
        <div className="relative z-10 h-full w-full bg-black rounded-2xl m-[1px] border border-blue-500/30 overflow-hidden">
          {/* Top Shimmer Line - Left to Right */}
          <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden rounded-t-2xl">
            <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500 to-transparent page-shimmer-ltr" />
          </div>
          
          {/* Radial Glow Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />
          
          {/* Pulse glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 page-pulse-glow pointer-events-none" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {/* BullMoney logo with enhanced styling */}
            <div className="relative w-20 h-20 page-float">
              {/* Spinning border ring */}
              <span className="absolute inset-[-3px] page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-60 rounded-full" />
              <div className="relative w-full h-full rounded-full bg-neutral-900 border border-blue-500/40 flex items-center justify-center overflow-hidden">
                <Image 
                  src="/BULL.svg" 
                  alt="BullMoney" 
                  width={48} 
                  height={48} 
                  className="opacity-90 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  priority
                />
              </div>
            </div>
            <p className="text-xs text-blue-400 font-bold tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">3D View</p>
            <p className="text-[10px] text-blue-400/60 font-medium">Optimized for your device</p>
            
            {/* Decorative dots */}
            <div className="flex justify-center gap-1.5 mt-2">
              <span className="w-1 h-1 rounded-full bg-blue-500/60 page-dot-pulse" />
              <span className="w-1 h-1 rounded-full bg-blue-400/80 page-dot-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1 h-1 rounded-full bg-blue-500/60 page-dot-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
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
          <div className="absolute inset-0 flex items-center justify-center bg-black rounded-xl overflow-hidden">
            {/* Radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] pointer-events-none" />
            {/* Shimmer line */}
            <div className="absolute inset-x-0 top-0 h-[1px] overflow-hidden">
              <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500 to-transparent page-shimmer-ltr" />
            </div>
            {/* Spinner with conic gradient */}
            <div className="relative w-10 h-10">
              <span className="absolute inset-0 page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] rounded-full" />
              <div className="absolute inset-[2px] bg-black rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500/60 page-dot-pulse" />
              </div>
            </div>
          </div>
        }>
          <div className="absolute inset-0 pointer-events-none md:pointer-events-auto" style={{ touchAction: 'pan-y' }}>
            <SplineScene scene={scene} />
          </div>
        </Suspense>
      ) : (
        // Placeholder when scrolled away (saves FPS by unmounting the heavy 3D canvas)
        <div className={`absolute inset-0 bg-black rounded-xl transition-opacity duration-500 overflow-hidden ${hasLoadedOnce ? 'opacity-100' : 'opacity-0'}`}>
          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent page-shimmer-ltr" style={{ animationDuration: '5s' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-8 h-8">
              <span className="absolute inset-0 page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_30%,#00000000_60%)] opacity-40 rounded-full" />
              <div className="absolute inset-[2px] bg-black rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 page-pulse-glow" />
              </div>
            </div>
          </div>
          {/* Border */}
          <div className="absolute inset-0 rounded-xl border border-blue-500/20 pointer-events-none" />
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
        <PageStyles />
        <style jsx global>{`
          nav, footer, header {
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center">
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />
          {/* Loading spinner */}
          <div className="relative w-12 h-12">
            <span className="absolute inset-0 page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] rounded-full opacity-60" />
            <div className="absolute inset-[2px] bg-black rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500/60 page-dot-pulse" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Inject keyframes once */}
      <PageStyles />

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
            <div id="top" />

            <section id="hero" className="w-full" data-allow-scroll>
              <Hero />
            </section>

            <section id="cta" className="w-full" data-allow-scroll>
              <CTA />
            </section>

            <section id="features" className="w-full" data-allow-scroll>
              <Features />
            </section>

            {/* 3D Spline Section - Hidden on small screens, show Testimonials instead */}
            <section id="experience" className="w-full max-w-7xl mx-auto px-4 py-16 hidden md:block" data-allow-scroll style={{ touchAction: 'pan-y' }}>
              {/* Section Header */}
              <div className="relative text-center mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-white drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  Interactive 3D Experience
                </h2>
                <p className="text-xs text-blue-400/60 mt-2 uppercase tracking-widest font-medium">Drag to explore</p>
                {/* Decorative line */}
                <div className="flex justify-center mt-4">
                  <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                </div>
              </div>
              
              <div className="relative w-full h-[800px] rounded-2xl overflow-hidden">
                {/* Spinning shimmer border */}
                <span className="absolute inset-[-2px] page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#60a5fa_50%,#3b82f6_75%,#00000000_100%)] opacity-30 rounded-2xl pointer-events-none" />
                
                {/* Inner container */}
                <div className="relative z-10 w-full h-full bg-black rounded-2xl border border-blue-500/20 overflow-hidden">
                  {/* Top shimmer line */}
                  <div className="absolute inset-x-0 top-0 h-[1px] overflow-hidden z-20">
                    <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500 to-transparent page-shimmer-ltr" />
                  </div>
                  
                <Suspense fallback={<div className="w-full h-full bg-black rounded-2xl flex items-center justify-center"><div className="w-10 h-10 relative"><span className="absolute inset-0 page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] rounded-full" /><div className="absolute inset-[2px] bg-black rounded-full" /></div></div>}>
                  <DraggableSplit>
                    {/* The Scenes */}
                    <LazySplineContainer scene="/scene4.splinecode" />
                    <LazySplineContainer scene="/scene3.splinecode" />
                  </DraggableSplit>
                </Suspense>
                </div>
              </div>
            </section>

            {/* Mobile-only Testimonials Section - Shows on small devices instead of heavy 3D */}
            <section id="testimonials" className="w-full max-w-5xl mx-auto px-4 py-12 md:hidden" data-allow-scroll style={{ touchAction: 'pan-y' }}>
              {/* Section Header */}
              <div className="relative text-center mb-6">
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  What Traders Say
                </h2>
                <div className="flex justify-center gap-1 mt-3">
                  <span className="w-1 h-1 rounded-full bg-blue-500/60 page-dot-pulse" />
                  <span className="w-1 h-1 rounded-full bg-blue-400/80 page-dot-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1 h-1 rounded-full bg-blue-500/60 page-dot-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden">
                {/* Shimmer border */}
                <span className="absolute inset-[-1px] page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-30 rounded-2xl pointer-events-none" style={{ animationDuration: '6s' }} />
                
                <div className="relative z-10 bg-black rounded-2xl border border-blue-500/20 overflow-hidden">
                  <Suspense fallback={
                    <div className="w-full h-[320px] bg-black rounded-2xl flex items-center justify-center">
                      <div className="w-8 h-8 relative">
                        <span className="absolute inset-0 page-spin bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] rounded-full" />
                        <div className="absolute inset-[2px] bg-black rounded-full" />
                      </div>
                    </div>
                  }>
                    <TestimonialsCarousel />
                  </Suspense>
                </div>
              </div>
            </section>

            <section id="ticker" className="w-full" data-allow-scroll>
              <LiveMarketTicker />
            </section>
          </main>

          <MobileSwipeNavigator />
          <DesktopKeyNavigator />

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