"use client";

import { Suspense, lazy, useState, useEffect, useRef } from "react";
import Hero from "@/components/hero";
import CTA from "@/components/Chartnews";
import { Features } from "@/components/features";
import { detectBrowser } from "@/lib/browserDetection";

// ==========================================
// UNIFIED SHIMMER SYSTEM - Import from single source
// ==========================================
import { 
  ShimmerBorder, 
  ShimmerLine, 
  ShimmerSpinner, 
  ShimmerDot,
  ShimmerFloat,
  ShimmerRadialGlow,
  ShimmerContainer 
} from "@/components/ui/UnifiedShimmer";
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
        <ShimmerBorder color="blue" intensity="medium" speed="normal" />
        
        {/* Inner container */}
        <div className="relative z-10 h-full w-full bg-black rounded-2xl m-[1px] border border-blue-500/30 overflow-hidden">
          {/* Top Shimmer Line */}
          <ShimmerLine color="blue" />
          
          {/* Radial Glow Effect */}
          <ShimmerRadialGlow color="blue" intensity="medium" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {/* BullMoney logo with floating effect */}
            <ShimmerFloat className="relative w-20 h-20">
              {/* Spinning border ring */}
              <ShimmerBorder color="blue" intensity="medium" className="inset-[-3px] rounded-full" />
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
            </ShimmerFloat>
            <p className="text-xs text-blue-400 font-bold tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">3D View</p>
            <p className="text-[10px] text-blue-400/60 font-medium">Optimized for your device</p>
            
            {/* Decorative dots */}
            <div className="flex justify-center gap-1.5 mt-2">
              <ShimmerDot color="blue" delay={0} />
              <ShimmerDot color="blue" delay={0.2} />
              <ShimmerDot color="blue" delay={0.4} />
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
            <ShimmerRadialGlow color="blue" intensity="medium" />
            <ShimmerLine color="blue" />
            <ShimmerSpinner size={40} color="blue" />
          </div>
        }>
          <div className="absolute inset-0 pointer-events-none md:pointer-events-auto" style={{ touchAction: 'pan-y' }}>
            <SplineScene scene={scene} />
          </div>
        </Suspense>
      ) : (
        // Placeholder when scrolled away (saves FPS by unmounting the heavy 3D canvas)
        <div className={`absolute inset-0 bg-black rounded-xl transition-opacity duration-500 overflow-hidden ${hasLoadedOnce ? 'opacity-100' : 'opacity-0'}`}>
          <ShimmerLine color="blue" speed="slow" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="blue" speed="slow" />
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
        <style jsx global>{`
          nav, footer, header {
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center">
          <ShimmerRadialGlow color="blue" intensity="low" />
          <ShimmerSpinner size={48} color="blue" />
        </div>
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
                <ShimmerBorder color="blue" intensity="low" speed="normal" />
                
                {/* Inner container */}
                <div className="relative z-10 w-full h-full bg-black rounded-2xl border border-blue-500/20 overflow-hidden">
                  {/* Top shimmer line */}
                  <ShimmerLine color="blue" className="z-20" />
                  
                <Suspense fallback={<div className="w-full h-full bg-black rounded-2xl flex items-center justify-center"><ShimmerSpinner size={40} color="blue" /></div>}>
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
                  <ShimmerDot color="blue" delay={0} />
                  <ShimmerDot color="blue" delay={0.2} />
                  <ShimmerDot color="blue" delay={0.4} />
                </div>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden">
                {/* Shimmer border */}
                <ShimmerBorder color="blue" intensity="low" speed="slow" />
                
                <div className="relative z-10 bg-black rounded-2xl border border-blue-500/20 overflow-hidden">
                  <Suspense fallback={
                    <div className="w-full h-[320px] bg-black rounded-2xl flex items-center justify-center">
                      <ShimmerSpinner size={32} color="blue" />
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