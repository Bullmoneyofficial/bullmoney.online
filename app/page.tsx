"use client";

import React, { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { installCrashTelemetry, safeMark } from '@/lib/telemetry';

// Interaction utilities
import { playClick } from '@/lib/interactionUtils';

// Component imports
const FullScreenSection = dynamic(() => import('@/components/Mainpage/PageScenes').then((mod) => mod.FullScreenSection), { ssr: false, loading: () => <section className="h-[100dvh] w-full bg-black" /> });
const DraggableSplitSection = dynamic(() => import('@/components/Mainpage/PageScenes').then((mod) => mod.DraggableSplitSection), { ssr: false, loading: () => <section className="h-[100dvh] w-full bg-black" /> });
const Navbar = dynamic(() => import('@/components/Mainpage/navbar').then((mod) => mod.Navbar), { ssr: false, loading: () => null });
const RegisterPage = dynamic(() => import('./register/pagemode'), { ssr: false, loading: () => <div className="fixed inset-0 bg-black" /> });
const BullMoneyGate = dynamic(() => import('@/components/Mainpage/TradingHoldUnlock'), { ssr: false, loading: () => <div className="fixed inset-0 bg-black" /> });
const MultiStepLoaderV2 = dynamic(() => import('@/components/Mainpage/MultiStepLoaderv2'), { ssr: false, loading: () => <div className="fixed inset-0 bg-black" /> });
const Footer = dynamic(() => import('@/components/Mainpage/footer').then((mod) => mod.Footer), { ssr: false, loading: () => <div className="h-24" /> });
const ParticleEffect = dynamic(() => import('@/components/Mainpage/PageElements').then((mod) => mod.ParticleEffect), { ssr: false, loading: () => null });
const OrientationOverlay = dynamic(() => import('@/components/Mainpage/PageElements').then((mod) => mod.OrientationOverlay), { ssr: false, loading: () => null });
const InfoPanel = dynamic(() => import('@/components/Mainpage/PageElements').then((mod) => mod.InfoPanel), { ssr: false, loading: () => null });
const BackgroundMusicSystem = dynamic(() => import('@/components/Mainpage/PageElements').then((mod) => mod.BackgroundMusicSystem), { ssr: false, loading: () => null });
const CustomCursor = dynamic(() => import('@/components/Mainpage/PageElements').then((mod) => mod.CustomCursor), { ssr: false, loading: () => null });
const HeroLoaderOverlay = dynamic(() => import('@/components/Mainpage/PageElements').then((mod) => mod.HeroLoaderOverlay), { ssr: false, loading: () => null });
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { ssr: false, loading: () => <div className="hidden">Loading...</div> });
const LiveMarketTicker = dynamic(() => import('@/components/Mainpage/LiveMarketTicker').then(mod => mod.LiveMarketTicker), { ssr: false, loading: () => <div className="h-10 bg-black border-b border-white/10" /> });
const VerticalPageScroll = dynamic(() => import('@/components/Mainpage/VerticalPageScroll'), { ssr: false, loading: () => null });
const ThreeDHintIcon = dynamic(() => import('@/components/Mainpage/ThreeDHintIcon'), { ssr: false, loading: () => null });
const FixedThemeConfigurator = dynamic(() => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), { ssr: false });

// Extracted UI components
const QuickThemePicker = dynamic(() => import('@/components/Mainpage/QuickThemePicker').then(m => m.QuickThemePicker), { ssr: false });
const MobileQuickActions = dynamic(() => import('@/components/Mainpage/MobileQuickActions').then(m => m.MobileQuickActions), { ssr: false });
const PerformancePrompt = dynamic(() => import('@/components/Mainpage/PerformancePrompt').then(m => m.PerformancePrompt), { ssr: false });
const ProgressBar = dynamic(() => import('@/components/Mainpage/ProgressBar').then(m => m.ProgressBar), { ssr: false });
const FAQOverlay = dynamic(() => import('@/components/Mainpage/FAQOverlay').then(m => m.FAQOverlay), { ssr: false });
const PerfToast = dynamic(() => import('@/components/Mainpage/PerfToast').then(m => m.PerfToast), { ssr: false });

// Configuration and utilities
import { useDeviceProfile } from '@/lib/deviceProfile';
import { PAGE_CONFIG } from '@/lib/pageConfig';
import { useOptimizations } from '@/lib/useOptimizations';
import { userStorage, devicePrefs } from '@/lib/smartStorage';
import '@/styles/unified-ui.css';
import { createSwipeHandlers } from '@/lib/interactionUtils';

// Custom hooks
import { usePageState } from '@/hooks/usePageState';
import { useUIState } from '@/hooks/useUIState';
import { useThemeState } from '@/hooks/useThemeState';
import { useMusicState } from '@/hooks/useMusicState';
import { usePerformanceState } from '@/hooks/usePerformanceState';
import { usePageInitialization } from '@/hooks/usePageInitialization';
import { useScrollManagement } from '@/hooks/useScrollManagement';

export default function Home() {
  const deviceProfile = useDeviceProfile();

  // State management hooks
  const pageState = usePageState();
  const uiState = useUIState();
  const themeState = useThemeState();
  const musicState = useMusicState();
  const performanceState = usePerformanceState();

  const prefersReducedMotionRef = React.useRef(false);
  const isTouchRef = React.useRef(false);
  const telemetryContextRef = React.useRef<Record<string, unknown>>({});

  // Initialize page
  usePageInitialization({
    setIsClient: pageState.setIsClient,
    setIsTouch: performanceState.setIsTouch,
    setIsSafari: performanceState.setIsSafari,
    setIsSafeMode: performanceState.setIsSafeMode,
    setDisableSpline: performanceState.setDisableSpline,
    setActiveThemeId: themeState.setActiveThemeId,
    setIsMuted: musicState.setIsMuted,
    setVolume: musicState.setVolume,
    setHasSeenIntro: pageState.setHasSeenIntro,
    setHasSeenHold: pageState.setHasSeenHold,
    setHasRegistered: pageState.setHasRegistered,
    setCurrentStage: pageState.setCurrentStage,
    setIsCompactViewport: performanceState.setIsCompactViewport,
    isTouchRef,
    prefersReducedMotionRef,
    deviceProfile,
  });

  // Scroll management
  useScrollManagement({
    scrollContainerRef: pageState.scrollContainerRef,
    setParallaxOffset: performanceState.setParallaxOffset,
    setShowOrientationWarning: pageState.setShowOrientationWarning,
    orientationDismissedRef: pageState.orientationDismissedRef,
    prefersReducedMotionRef,
    isTouchRef,
    isTouch: performanceState.isTouch,
    contentMounted: pageState.contentMounted,
  });

  // Telemetry tracking
  React.useEffect(() => {
    telemetryContextRef.current = {
      stage: pageState.currentStage,
      activePage: pageState.activePage,
      isTouch: performanceState.isTouch,
      disableSpline: performanceState.disableSpline,
      isSafeMode: performanceState.isSafeMode,
      isSafari: performanceState.isSafari,
      deviceProfile: {
        isMobile: deviceProfile.isMobile,
        isWebView: deviceProfile.isWebView,
        isHighEndDevice: deviceProfile.isHighEndDevice,
        prefersReducedData: deviceProfile.prefersReducedData,
        connectionType: deviceProfile.connectionType,
      },
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }, [pageState.activePage, pageState.currentStage, deviceProfile, performanceState]);

  React.useEffect(() => {
    const uninstall = installCrashTelemetry(() => telemetryContextRef.current);
    return () => uninstall();
  }, []);

  React.useEffect(() => {
    safeMark(`bm_active_page:${pageState.activePage}`);
  }, [pageState.activePage]);

  React.useEffect(() => {
    safeMark(`bm_stage:${pageState.currentStage}`);
  }, [pageState.currentStage]);

  React.useEffect(() => {
    if (pageState.currentStage === 'content') {
      pageState.setContentMounted(true);
    }
  }, [pageState.currentStage]);

  // Computed values
  // FIXED: Ensure all devices can load 3D splines - no restrictions based on device type
  const prioritizedSplineScenes = useMemo(() => {
    if (performanceState.disableSpline) return [];
    const baseScenes = ["/scene1.splinecode", "/scene.splinecode", "/scene2.splinecode", "/scene3.splinecode", "/scene4.splinecode", "/scene5.splinecode", "/scene6.splinecode"];
    // Mobile: Load all scenes but with memory management
    // Desktop: Load all scenes
    // Low-end devices: Still load all scenes with crash-safe loaders
    return baseScenes;
  }, [performanceState.disableSpline]);

  const criticalSplineScenes = useMemo(() => prioritizedSplineScenes.slice(0, 2), [prioritizedSplineScenes]);

  // Initialize optimization system
  useOptimizations({
    enableServiceWorker: true,
    criticalScenes: criticalSplineScenes.length ? criticalSplineScenes : ['/scene1.splinecode'],
    preloadScenes: performanceState.disableSpline ? [] : prioritizedSplineScenes.slice(1)
  });

  const visiblePages = useMemo(() => {
    if (performanceState.disableSpline) {
      const firstPage = PAGE_CONFIG.find(page => page.id === 1);
      const tsxPages = PAGE_CONFIG.filter(page => page.type === 'tsx');
      return firstPage ? [firstPage, ...tsxPages] : tsxPages;
    }
    return PAGE_CONFIG;
  }, [performanceState.disableSpline]);

  const isMobileLike = deviceProfile.isMobile || performanceState.isTouch || performanceState.isCompactViewport;
  const showMobileQuickActions = useMemo(
    () => pageState.currentStage === 'content' && isMobileLike && !uiState.showConfigurator && !uiState.faqOpen && !uiState.controlCenterOpen && !uiState.showPerfPrompt && !uiState.showThemeQuickPick,
    [uiState, pageState.currentStage, isMobileLike]
  );

  const safeAreaInlinePadding = useMemo(() => ({
    paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 10px)',
    paddingRight: 'calc(env(safe-area-inset-right, 0px) + 10px)',
  }), []);
  const safeAreaBottom = 'calc(env(safe-area-inset-bottom, 0px) + 10px)';

  const shouldRenderContent = pageState.currentStage === 'content' || pageState.contentMounted;
  const showHeroLoaderOverlay = pageState.currentStage === 'content' && !performanceState.heroSceneReady && !performanceState.heroLoaderHidden;
  const heroLoaderMessage = deviceProfile.isMobile ? 'Optimizing for Mobile Trading' : 'Loading Premium Trading Experience';

  // Handlers
  const handleOrientationDismiss = useCallback(() => {
    pageState.setShowOrientationWarning(false);
    pageState.orientationDismissedRef.current = true;
  }, [pageState]);

  const handleRegisterComplete = useCallback(() => {
    userStorage.set('vip_user_registered', 'true');
    pageState.setHasRegistered(true);
    const holdShown = pageState.hasSeenHold || userStorage.get('bm_hold_seen') === 'true';
    if (holdShown) {
      pageState.setCurrentStage("content");
    } else {
      userStorage.set('bm_hold_seen', 'true');
      pageState.setHasSeenHold(true);
      pageState.setCurrentStage("hold");
    }
  }, [pageState]);

  const handleHoldComplete = useCallback(() => pageState.setCurrentStage("content"), [pageState]);

  const handleV2Complete = useCallback(() => {
    musicState.safePlay();
    if (!pageState.hasSeenIntro) {
      userStorage.set('bm_intro_seen', 'true');
      pageState.setHasSeenIntro(true);
    }
    themeState.setParticleTrigger(prev => prev + 1);
    if (pageState.hasRegistered) {
      pageState.setCurrentStage("content");
    } else {
      pageState.setCurrentStage("register");
    }
  }, [pageState, musicState, themeState]);

  const handleHeroReady = useCallback(() => {
    performanceState.setHeroSceneReady(true);
    performanceState.setHeroLoaderHidden(true);
  }, [performanceState]);

  const applyPerformanceChoice = useCallback((mode: 'high' | 'balanced') => {
    if (uiState.perfPromptTimeoutRef.current) {
      window.clearTimeout(uiState.perfPromptTimeoutRef.current);
      uiState.perfPromptTimeoutRef.current = null;
    }
    const enable3D = mode === 'high';
    performanceState.setDisableSpline(!enable3D);
    devicePrefs.set('spline_enabled', enable3D ? 'true' : 'false');
    devicePrefs.set('spline_pref_v2', 'true');
    devicePrefs.set('perf_choice', mode);
    uiState.setShowPerfPrompt(false);
  }, [uiState, performanceState]);

  // FIXED: Default to high performance (3D enabled) for all devices
  // Users can switch to balanced mode if needed via performance toggle
  const defaultPerfMode = useMemo(() => {
    // Only use balanced mode if user explicitly prefers reduced data or motion
    if (deviceProfile.prefersReducedData || deviceProfile.prefersReducedMotion) return 'balanced';
    // Default to high performance (3D enabled) for all other devices
    return 'high';
  }, [deviceProfile]);

  // Swipe navigation
  const navigateToNextPage = useCallback(() => {
    const maxPages = performanceState.disableSpline ? visiblePages.length : PAGE_CONFIG.length;
    if (pageState.activePage < maxPages) {
      playClick();
      pageState.pageRefs.current[pageState.activePage]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pageState, performanceState, visiblePages]);

  const navigateToPrevPage = useCallback(() => {
    if (pageState.activePage > 1) {
      playClick();
      pageState.pageRefs.current[pageState.activePage - 2]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pageState]);

  const swipeHandlers = useMemo(() => createSwipeHandlers({
    onSwipeLeft: navigateToNextPage,
    onSwipeRight: navigateToPrevPage,
    threshold: 80,
    velocityThreshold: 0.4,
    preventScroll: false,
  }), [navigateToNextPage, navigateToPrevPage]);

  if (!pageState.isClient) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />

      {/* Background Music */}
      {shouldRenderContent && (
        <BackgroundMusicSystem
          themeId={themeState.activeThemeId}
          onReady={musicState.handlePlayerReady}
          volume={musicState.volume}
          trackKey={themeState.musicKey}
        />
      )}

      {/* Particle Effects */}
      {shouldRenderContent && !performanceState.isSafeMode && !deviceProfile.prefersReducedMotion && deviceProfile.isHighEndDevice && !deviceProfile.isMobile && !performanceState.isTouch && (
        <ParticleEffect trigger={themeState.particleTrigger} />
      )}

      {/* Custom Cursor */}
      {shouldRenderContent && !deviceProfile.isMobile && !deviceProfile.prefersReducedMotion && !performanceState.isTouch && !performanceState.isSafari && (
        <CustomCursor accentColor={themeState.accentColor} />
      )}

      {/* Mobile Quick Actions */}
      <MobileQuickActions
        isVisible={showMobileQuickActions}
        disableSpline={performanceState.disableSpline}
        isPlaying={!musicState.isMuted}
        volume={musicState.volume}
        safeAreaInlinePadding={safeAreaInlinePadding}
        safeAreaBottom={safeAreaBottom}
        onPerformanceToggle={() => performanceState.handlePerformanceToggle(uiState.setPerfToast, themeState.setParticleTrigger)}
        onMusicToggle={musicState.toggleMusic}
        onThemeClick={() => {
          uiState.setControlCenterOpen(false);
          uiState.setShowThemeQuickPick(true);
        }}
        onHelpClick={() => uiState.setFaqOpen(true)}
      />

      {/* Quick Theme Picker */}
      <QuickThemePicker
        isOpen={uiState.showThemeQuickPick}
        onClose={() => uiState.setShowThemeQuickPick(false)}
        activeThemeId={themeState.activeThemeId}
        onThemeChange={(themeId) => themeState.handleQuickThemeChange(themeId, musicState.isMuted, musicState.safePlay)}
      />

      {/* Info Panel */}
      {shouldRenderContent && (
        <InfoPanel
          config={PAGE_CONFIG[pageState.activePage - 1]}
          isOpen={uiState.infoPanelOpen}
          onClose={() => uiState.setInfoPanelOpen(false)}
          accentColor={themeState.accentColor}
        />
      )}

      {/* FAQ Overlay */}
      <FAQOverlay isOpen={uiState.faqOpen} onClose={() => uiState.setFaqOpen(false)} />

      {/* Progress Bar */}
      <ProgressBar isVisible={pageState.currentStage === 'content'} activePage={pageState.activePage} totalPages={visiblePages.length} />

      {/* Performance Toast */}
      <PerfToast toast={uiState.perfToast} />

      {/* Performance Prompt */}
      <PerformancePrompt
        isVisible={uiState.showPerfPrompt && pageState.currentStage === 'content'}
        accentColor={themeState.accentColor}
        deviceProfile={deviceProfile}
        defaultPerfMode={defaultPerfMode}
        onChoose={applyPerformanceChoice}
      />

      {/* Theme Configurator - Z-Index 300,000 (Below Navbar) */}
      {uiState.showConfigurator && (
        <div className="fixed inset-0 z-[300000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-6xl h-[80vh] bg-[#020617] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <button onClick={() => uiState.setShowConfigurator(false)} className="absolute top-6 right-6 z-[10] p-2 text-white/50 hover:text-white transition-all">
              ✕
            </button>
            {/* @ts-ignore */}
            <FixedThemeConfigurator
              initialThemeId={themeState.activeThemeId}
              onThemeChange={(themeId: string, sound: any, muted: boolean) => themeState.handleThemeChange(themeId, sound, muted, musicState.safePlay)}
            />
          </div>
        </div>
      )}

      {/* Gating Screens - Z-Index 100,000 (Below Everything) */}
      {pageState.currentStage === "register" && (
        <div className="fixed inset-0 z-[100000] bg-black transition-all duration-500" style={{ filter: themeState.activeTheme?.filter || 'none' }}>
          {/* @ts-ignore */}
          <RegisterPage onUnlock={handleRegisterComplete} theme={themeState.activeTheme} />
        </div>
      )}

      {pageState.currentStage === "hold" && (
        <div className="fixed inset-0 z-[100000] transition-all duration-500" style={{ filter: themeState.activeTheme?.filter || 'none' }}>
          {/* @ts-ignore */}
          <BullMoneyGate onUnlock={handleHoldComplete} theme={themeState.activeTheme}><></></BullMoneyGate>
        </div>
      )}

      {pageState.currentStage === "v2" && (
        <div className="fixed inset-0 z-[100000] transition-all duration-500" style={{ filter: themeState.activeTheme?.filter || 'none' }}>
          {/* @ts-ignore */}
          <MultiStepLoaderV2 onFinished={handleV2Complete} theme={themeState.activeTheme} />
        </div>
      )}

      {showHeroLoaderOverlay && <HeroLoaderOverlay visible={showHeroLoaderOverlay} message={heroLoaderMessage} accentColor={themeState.accentColor} />}

      {/* ✅ FIXED HEADER - Z-Index 250,000 (Between Lens and Configurator)
          Positioned at top of everything to unravel properly like shop page
          FIXED: LiveMarketTicker now positioned correctly below navbar
      */}
      {pageState.currentStage === 'content' && (
        <>
          <header className="fixed top-0 left-0 right-0 z-[250000] w-full transition-all duration-300">
            <Navbar
              setShowConfigurator={uiState.setShowConfigurator}
              activeThemeId={themeState.activeThemeId}
              accentColor={themeState.accentColor}
              onThemeChange={(themeId) => themeState.handleQuickThemeChange(themeId, musicState.isMuted, musicState.safePlay)}
              isMuted={musicState.isMuted}
              onMuteToggle={musicState.toggleMusic}
              disableSpline={performanceState.disableSpline}
              onPerformanceToggle={() => performanceState.handlePerformanceToggle(uiState.setPerfToast, themeState.setParticleTrigger)}
              infoPanelOpen={uiState.infoPanelOpen}
              onInfoToggle={() => uiState.setInfoPanelOpen((prev) => !prev)}
              onFaqClick={() => uiState.setFaqOpen(true)}
              onControlCenterToggle={() => uiState.setControlCenterOpen((prev) => !prev)}
            />
          </header>
          {/* LiveMarketTicker positioned below navbar */}
          <div
            className="fixed left-0 right-0 z-[249000] w-full transition-all duration-300"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + var(--navbar-height, 128px))',
            }}
          >
            <style jsx>{`
              @media (min-width: 1024px) {
                div {
                  --navbar-height: 96px;
                }
              }
              @media (max-width: 1023px) {
                div {
                  --navbar-height: 128px;
                }
              }
            `}</style>
            <LiveMarketTicker />
          </div>
        </>
      )}

      {/* Main Content */}
      {shouldRenderContent && (
        <div className={pageState.currentStage === 'content' ? 'w-full h-[100dvh] relative' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
          {!performanceState.isTouch && <TargetCursor spinDuration={2} hideDefaultCursor={false} targetSelector=".cursor-target, a, button" />}

          {!isMobileLike && <VerticalPageScroll currentPage={pageState.activePage} totalPages={visiblePages.length} onPageChange={(idx) => pageState.pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })} accentColor={themeState.accentColor} disabled={pageState.currentStage !== 'content'} />}

          {/* FIXED: 3D Hint Icon now serves as the main control center access point */}
          <ThreeDHintIcon onClick={() => uiState.setControlCenterOpen(true)} accentColor={themeState.accentColor} disableSpline={performanceState.disableSpline} showHint={!pageState.hasSeenIntro} />

          {/* Scroll Container - Enhanced for Mobile */}
          <main
            ref={pageState.scrollContainerRef}
            data-scroll-container
            className={`profit-reveal w-full h-full flex flex-col overflow-y-scroll overflow-x-hidden unified-scroll ${performanceState.isTouch ? 'touch-device' : 'non-touch-device snap-y snap-mandatory scroll-smooth'} bg-black no-scrollbar text-white relative`}
            onTouchStart={swipeHandlers.onTouchStart}
            onTouchMove={swipeHandlers.onTouchMove}
            onTouchEnd={swipeHandlers.onTouchEnd}
            style={{
              WebkitOverflowScrolling: 'touch',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'pan-y',
              maxWidth: '100vw',
              maxHeight: '100dvh',
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)',
              scrollbarGutter: 'stable both-edges',
              // Mobile-specific improvements
              scrollPaddingTop: isMobileLike ? '100px' : '0px',
              paddingBottom: isMobileLike ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : '0px'
            }}
          >
            {pageState.showOrientationWarning && <OrientationOverlay onDismiss={handleOrientationDismiss} />}

            {/* Scroll Pages */}
            {visiblePages.map((page) => (
              <React.Fragment key={page.id}>
                {page.type === 'split' ? (
                  <DraggableSplitSection
                    config={page}
                    activePage={pageState.activePage}
                    onVisible={(el: HTMLElement | null) => { pageState.pageRefs.current[page.id - 1] = el; }}
                    parallaxOffset={performanceState.parallaxOffset}
                    disableSpline={performanceState.disableSpline}
                    useCrashSafeSpline={true}
                    forceLiteSpline={false}
                    eagerRenderSplines={performanceState.splinesEnabled}
                    deviceProfile={deviceProfile}
                  />
                ) : (
                  <FullScreenSection
                    config={page}
                    activePage={pageState.activePage}
                    onVisible={(el: HTMLElement | null) => { pageState.pageRefs.current[page.id - 1] = el; }}
                    parallaxOffset={performanceState.parallaxOffset}
                    disableSpline={performanceState.disableSpline}
                    useCrashSafeSpline={true}
                    forceLiteSpline={false}
                    eagerRenderSplines={performanceState.splinesEnabled}
                    onSceneReady={page.id === 1 ? handleHeroReady : undefined}
                    deviceProfile={deviceProfile}
                  />
                )}
              </React.Fragment>
            ))}

            <div className="w-full mt-10">
              <Footer />
            </div>
          </main>
        </div>
      )}
    </>
  );
}
