"use client";

import { Suspense, lazy, useState, useEffect, useRef } from "react";
import Hero from "@/components/hero";
import CTA from "@/components/Chartnews";
import { Features } from "@/components/features";
import { LiveMarketTicker } from "@/components/LiveMarketTicker";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";
import { SwipeablePanel } from "@/components/Mainpage/SwipeablePanel";
import { ThemeSelector } from "@/components/Mainpage/ThemeSelector";
import HiddenYoutubePlayer from "@/components/Mainpage/HiddenYoutubePlayer";
import { ALL_THEMES } from "@/constants/theme-data";
import type { SoundProfile } from "@/constants/theme-data";
import { Settings } from "lucide-react";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";

// Import the sequential loaders
import PageMode from "@/components/REGISTER USERS/pagemode";
import MultiStepLoaderv2 from "@/components/MultiStepLoaderv2";

const DraggableSplit = lazy(() => import('@/components/DraggableSplit'));
const SplineScene = lazy(() => import('@/components/SplineScene'));

function LazySplineContainer({ scene }: { scene: string }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {shouldLoad ? (
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-full bg-black/5 animate-pulse rounded">
            <span className="text-white/40 text-sm">Loading scene...</span>
          </div>
        }>
          <SplineScene scene={scene} />
        </Suspense>
      ) : (
        <div className="w-full h-full bg-black/5 rounded" />
      )}
    </div>
  );
}

function HomeContent() {
  // State to control what's showing
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState('t01');
  const [activeCategory, setActiveCategory] = useState<'SPECIAL' | 'SENTIMENT' | 'ASSETS' | 'CRYPTO' | 'HISTORICAL' | 'OPTICS' | 'GLITCH' | 'EXOTIC' | 'LOCATION' | 'ELEMENTAL' | 'CONCEPTS' | 'MEME' | 'SEASONAL'>('SPECIAL');
  const [currentSound, setCurrentSound] = useState<SoundProfile>('MECHANICAL');
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoverThemeId, setHoverThemeId] = useState<string | null>(null);

  // Audio engine
  const audioProfile = currentSound === 'MECHANICAL' || currentSound === 'SOROS' || currentSound === 'SCI-FI' || currentSound === 'SILENT'
    ? currentSound
    : 'MECHANICAL';
  const sfx = useAudioEngine(!isMuted, audioProfile);

  // Initialize on mount - check if user has session
  useEffect(() => {
    const checkSession = () => {
      const hasSession = localStorage.getItem("bullmoney_session");
      
      if (hasSession) {
        // Returning user - skip PageMode, go straight to loader
        console.log("Has session - showing loader");
        setCurrentView('loader');
      } else {
        // New user - show PageMode
        console.log("No session - showing PageMode");
        setCurrentView('pagemode');
      }
      
      setIsInitialized(true);
    };

    checkSession();
  }, []);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('user_theme_id');
    if (saved) {
      setActiveThemeId(saved);
    }
  }, []);

  useEffect(() => {
    const theme = ALL_THEMES.find(t => t.id === activeThemeId);
    if (theme && typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.filter = isMobile ? theme.mobileFilter : theme.filter;
      root.style.setProperty('--accent-color', theme.accentColor || '#3b82f6');
    }
  }, [activeThemeId, isMobile]);

  const handleSaveTheme = (themeId: string) => {
    setActiveThemeId(themeId);
    localStorage.setItem('user_theme_id', themeId);
    sfx.confirm();
    setPanelOpen(false);
  };

  const handleExit = () => {
    sfx.click();
    setPanelOpen(false);
  };

  const handleHover = (id: string | null) => {
    setHoverThemeId(id);
  };

  // When PageMode is unlocked (user registered/logged in)
  const handlePageModeUnlock = () => {
    console.log("PageMode unlocked - showing loader");
    setCurrentView('loader');
  };

  // Monitor loader completion - auto-advance after loader animation
  useEffect(() => {
    if (currentView === 'loader') {
      // Wait for the loader to complete its full cycle
      // Adjust this duration based on your MultiStepLoaderv2's animation length
      const timer = setTimeout(() => {
        console.log("Loader animation complete - showing content");
        setCurrentView('content');
      }, 5000); // 5 seconds - adjust based on your loader's duration
      
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  const currentTheme = ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  const displayTheme = hoverThemeId ? ALL_THEMES.find(t => t.id === hoverThemeId) : currentTheme;

  // Don't render anything until initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* STEP 1: PageMode - Only for first-time users */}
      {currentView === 'pagemode' && (
        <div className="fixed inset-0 z-[99999]">
          <PageMode onUnlock={handlePageModeUnlock} />
        </div>
      )}

      {/* STEP 2: MultiStepLoader - Shows after PageMode OR on every reload for returning users */}
      {currentView === 'loader' && (
        <div className="fixed inset-0 z-[99999]">
          <MultiStepLoaderv2 />
        </div>
      )}

      {/* STEP 3: Main Content - Only shows after loader completes */}
      {currentView === 'content' && (
        <>
          <main className="min-h-screen flex flex-col" data-allow-scroll data-scrollable>
            <Hero />
            <CTA />
            <Features />

            <section className="w-full max-w-7xl mx-auto px-4 py-16" data-allow-scroll>
              <Suspense fallback={
                <div className="w-full h-[800px] bg-black/5 rounded-lg animate-pulse" />
              }>
                <DraggableSplit>
                  <LazySplineContainer scene="/scene4.splinecode" />
                  <LazySplineContainer scene="/scene3.splinecode" />
                </DraggableSplit>
              </Suspense>
            </section>

            <LiveMarketTicker />
          </main>

          {displayTheme?.youtubeId && (
            <HiddenYoutubePlayer
              videoId={displayTheme.youtubeId}
              isPlaying={!isMuted}
              volume={isMuted ? 0 : 15}
            />
          )}

          <SwipeablePanel
            title="Theme & Music Control"
            icon={<Settings size={20} />}
            position="bottom"
            maxHeight="85vh"
            minHeight="32px"
            open={panelOpen}
            onOpenChange={setPanelOpen}
            accentColor={currentTheme?.accentColor || '#3b82f6'}
            zIndex={9999}
          >
            <ThemeSelector
              activeThemeId={activeThemeId}
              setActiveThemeId={setActiveThemeId}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              isMobile={isMobile}
              currentSound={currentSound}
              setCurrentSound={setCurrentSound}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              onSave={handleSaveTheme}
              onExit={handleExit}
              onHover={handleHover}
            />
          </SwipeablePanel>
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