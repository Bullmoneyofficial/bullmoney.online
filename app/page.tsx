"use client";

import React, { useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { installCrashTelemetry, safeMark } from '@/lib/telemetry';
import { playClick } from '@/lib/interactionUtils';
import { useDeviceProfile } from '@/lib/deviceProfile';
import { PAGE_CONFIG } from '@/lib/pageConfig';
import { useOptimizations } from '@/lib/useOptimizations';
import { userStorage, devicePrefs } from '@/lib/smartStorage';
import { createSwipeHandlers } from '@/lib/interactionUtils';
import { getCacheName, isValidSplineBlob } from '@/lib/splineCache';
import { scheduleSceneStorageSave } from '@/lib/sceneStorage';
// @ts-ignore - Required for side effects (input manager initialization)
import '@/lib/inputManager';
import '@/styles/unified-ui.css';
import '@/styles/performance-optimizations.css';
import '@/styles/mobile-optimizations.css';

// Custom hooks
import { usePageState } from '@/hooks/usePageState';
import { useUIState } from '@/hooks/useUIState';
import { useThemeState } from '@/hooks/useThemeState';
import { useMusicState } from '@/hooks/useMusicState';
import { usePerformanceState } from '@/hooks/usePerformanceState';
import { usePageInitialization } from '@/hooks/usePageInitialization';
import { useScrollManagement } from '@/hooks/useScrollManagement';

// ============================================================================
// DYNAMIC IMPORTS - Organized by priority and usage
// ============================================================================

// Critical UI Components (Load immediately)
const Navbar = dynamic(() => import('@/components/Mainpage/navbar').then(m => m.Navbar), {
  ssr: false,
  loading: () => null
});

const LiveMarketTicker = dynamic(() => import('@/components/Mainpage/LiveMarketTicker').then(m => m.LiveMarketTicker), {
  ssr: false,
  loading: () => <div className="h-10 bg-black border-b border-white/10" />
});

// Page Scene Components
const FullScreenSection = dynamic(() => import('@/components/Mainpage/PageScenes').then(m => m.FullScreenSection), {
  ssr: false,
  loading: () => <section className="h-[100dvh] w-full bg-black" />
});

const DraggableSplitSection = dynamic(() => import('@/components/Mainpage/PageScenes').then(m => m.DraggableSplitSection), {
  ssr: false,
  loading: () => <section className="h-[100dvh] w-full bg-black" />
});

// Gate/Flow Components
const RegisterPage = dynamic(() => import('./register/pagemode'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" />
});

const BullMoneyGate = dynamic(() => import('@/components/Mainpage/TradingHoldUnlock'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" />
});

const MultiStepLoaderV2 = dynamic(() => import('@/components/Mainpage/MultiStepLoaderv2'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" />
});

// Interactive Elements
const MobileQuickActions = dynamic(() => import('@/components/Mainpage/MobileQuickActions').then(m => m.MobileQuickActions), {
  ssr: false
});

const QuickThemePicker = dynamic(() => import('@/components/Mainpage/QuickThemePicker').then(m => m.QuickThemePicker), {
  ssr: false
});

const ThreeDHintIcon = dynamic(() => import('@/components/Mainpage/ThreeDHintIcon'), {
  ssr: false,
  loading: () => null
});

const VerticalPageScroll = dynamic(() => import('@/components/Mainpage/VerticalPageScroll'), {
  ssr: false,
  loading: () => null
});
const UltimateControlPanel = dynamic(
  () => import('@/components/Mainpage/UltimateControlPanel').then(m => m.UltimateControlPanel),
  { ssr: false }
);

// UI Overlays
const FAQOverlay = dynamic(() => import('@/components/Mainpage/FAQOverlay').then(m => m.FAQOverlay), {
  ssr: false
});

const PerformancePrompt = dynamic(() => import('@/components/Mainpage/PerformancePrompt').then(m => m.PerformancePrompt), {
  ssr: false
});

const InfoPanel = dynamic(() => import('@/components/Mainpage/PageElements').then(m => m.InfoPanel), {
  ssr: false,
  loading: () => null
});

const OrientationOverlay = dynamic(() => import('@/components/Mainpage/PageElements').then(m => m.OrientationOverlay), {
  ssr: false,
  loading: () => null
});

const HeroLoaderOverlay = dynamic(() => import('@/components/Mainpage/PageElements').then(m => m.HeroLoaderOverlay), {
  ssr: false,
  loading: () => null
});

// Visual Effects (Non-critical)
const ParticleEffect = dynamic(() => import('@/components/Mainpage/PageElements').then(m => m.ParticleEffect), {
  ssr: false,
  loading: () => null
});

const CustomCursor = dynamic(() => import('@/components/Mainpage/PageElements').then(m => m.CustomCursor), {
  ssr: false,
  loading: () => null
});

const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), {
  ssr: false,
  loading: () => null
});

// System Components
const BackgroundMusicSystem = dynamic(() => import('@/components/Mainpage/PageElements').then(m => m.BackgroundMusicSystem), {
  ssr: false,
  loading: () => null
});

const ProgressBar = dynamic(() => import('@/components/Mainpage/ProgressBar').then(m => m.ProgressBar), {
  ssr: false,
  loading: () => null
});

const PerfToast = dynamic(() => import('@/components/Mainpage/PerfToast').then(m => m.PerfToast), {
  ssr: false,
  loading: () => null
});

const Footer = dynamic(() => import('@/components/Mainpage/footer').then(m => m.Footer), {
  ssr: false,
  loading: () => <div className="h-24" />
});

const FixedThemeConfigurator = dynamic(() => import('@/components/Mainpage/ThemeComponents'), {
  ssr: false
});

const MobileStaticContent = dynamic(() => import('@/components/Mainpage/MobileStaticContent'), {
  ssr: false,
  loading: () => <div className="min-h-[100dvh] w-full bg-black" />
});

// ============================================================================
// CONSTANTS
// ============================================================================

const SPLINE_SCENES = [
  "/scene1.splinecode",
  "/scene.splinecode",
  "/scene2.splinecode",
  "/scene3.splinecode",
  "/scene4.splinecode",
  "/scene5.splinecode",
  "/scene6.splinecode"
] as const;

const NAVBAR_HEIGHT_DESKTOP = 96;
const NAVBAR_HEIGHT_MOBILE = 128;
const PERF_TOAST_DURATION = 2500;
const CRITICAL_SPLINE_COUNT = 2;

// Network-based optimization thresholds
const NETWORK_THRESHOLDS = {
  'slow-2g': { maxScenes: 0, enableEffects: false, preloadDelay: 5000 },
  '2g': { maxScenes: 1, enableEffects: false, preloadDelay: 3000 },
  '3g': { maxScenes: 2, enableEffects: false, preloadDelay: 2000 },
  '4g': { maxScenes: 7, enableEffects: true, preloadDelay: 1000 },
  'wifi': { maxScenes: 7, enableEffects: true, preloadDelay: 500 },
} as const;

// Mobile layout constants
const MOBILE_LAYOUT = {
  minTouchTarget: 44, // iOS minimum
  safeAreaPadding: 16,
  bottomNavHeight: 80,
  quickActionSize: 56,
  compactBreakpoint: 768,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const calculateNavbarHeight = (isMobile: boolean) =>
  `calc(env(safe-area-inset-top, 0px) + ${isMobile ? NAVBAR_HEIGHT_MOBILE : NAVBAR_HEIGHT_DESKTOP}px)`;

// Network-aware loading strategy
const getNetworkOptimizations = (connectionType: string, isMobile: boolean) => {
  const networkType = connectionType as keyof typeof NETWORK_THRESHOLDS;
  const defaults = NETWORK_THRESHOLDS['4g'];
  const thresholds = NETWORK_THRESHOLDS[networkType] || defaults;
  
  return {
    ...thresholds,
    // Mobile gets more aggressive optimizations
    maxScenes: isMobile ? Math.min(thresholds.maxScenes, 2) : thresholds.maxScenes,
    enableEffects: isMobile ? false : thresholds.enableEffects,
    preloadDelay: isMobile ? thresholds.preloadDelay * 1.5 : thresholds.preloadDelay,
  };
};

// Detect if device should use mobile-optimized layout
const shouldUseMobileLayout = (deviceProfile: any, isTouch: boolean, isCompactViewport: boolean) => {
  return deviceProfile.isMobile || 
         deviceProfile.isWebView || 
         isTouch || 
         isCompactViewport ||
         (typeof window !== 'undefined' && window.innerWidth < MOBILE_LAYOUT.compactBreakpoint);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function Home() {
  const deviceProfile = useDeviceProfile();

  // ===== State Management =====
  const pageState = usePageState();
  const uiState = useUIState();
  const themeState = useThemeState();
  const musicState = useMusicState();
  const performanceState = usePerformanceState();

  // ===== Refs =====
  const prefersReducedMotionRef = React.useRef(false);
  const isTouchRef = React.useRef(false);
  const telemetryContextRef = React.useRef<Record<string, unknown>>({});

  // ===== Initialize Page =====
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

  // ===== Scroll Management =====
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

  // ===== Computed Values =====
  const isMobileLike = useMemo(
    () => shouldUseMobileLayout(deviceProfile, performanceState.isTouch, performanceState.isCompactViewport),
    [deviceProfile, performanceState.isTouch, performanceState.isCompactViewport]
  );

  const networkOptimizations = useMemo(
    () => getNetworkOptimizations(deviceProfile.connectionType ?? '4g', isMobileLike),
    [deviceProfile.connectionType, isMobileLike]
  );

  // Mobile devices always get the optimized mobile layout
  const shouldUseMobileOnlyStatic = useMemo(
    () => isMobileLike,
    [isMobileLike]
  );

  const useMobileStaticContent = useMemo(
    () => shouldUseMobileOnlyStatic || deviceProfile.prefersReducedData || networkOptimizations.maxScenes === 0,
    [shouldUseMobileOnlyStatic, deviceProfile.prefersReducedData, networkOptimizations.maxScenes]
  );

  // For non-critical Splines only - hero Spline always renders
  const effectiveDisableSpline = useMemo(
    () => performanceState.disableSpline,
    [performanceState.disableSpline]
  );

  const shouldUseSplines = useMemo(
    () => !useMobileStaticContent && !performanceState.disableSpline && networkOptimizations.maxScenes > 0,
    [useMobileStaticContent, performanceState.disableSpline, networkOptimizations.maxScenes]
  );

  const prioritizedSplineScenes = useMemo(() => {
    if (!shouldUseSplines) {
      console.log(
        useMobileStaticContent
          ? '[App] Mobile static mode - splines disabled'
          : '[App] Splines disabled via performance toggle'
      );
      return [];
    }
    
    // Network-aware scene loading
    const maxScenes = networkOptimizations.maxScenes;
    const scenesToLoad = SPLINE_SCENES.slice(0, maxScenes);
    
    console.log(`[App] Loading ${scenesToLoad.length}/${SPLINE_SCENES.length} scenes for ${deviceProfile.connectionType} connection`);
    return scenesToLoad;
  }, [shouldUseSplines, useMobileStaticContent, networkOptimizations.maxScenes, deviceProfile.connectionType]);

  const criticalSplineScenes = useMemo(
    () => prioritizedSplineScenes.slice(0, CRITICAL_SPLINE_COUNT),
    [prioritizedSplineScenes]
  );

  const visiblePages = useMemo(() => {
    if (effectiveDisableSpline) {
      const firstPage = PAGE_CONFIG.find(page => page.id === 1);
      const tsxPages = PAGE_CONFIG.filter(page => page.type === 'tsx');
      return firstPage ? [firstPage, ...tsxPages] : tsxPages;
    }
    return PAGE_CONFIG;
  }, [effectiveDisableSpline]);

  const showMobileQuickActions = useMemo(
    () =>
      pageState.currentStage === 'content' &&
      isMobileLike &&
      !uiState.showConfigurator &&
      !uiState.faqOpen &&
      !uiState.showPerfPrompt &&
      !uiState.showThemeQuickPick,
    [uiState, pageState.currentStage, isMobileLike]
  );

  const safeAreaBottom = useMemo(() => 'calc(env(safe-area-inset-bottom, 0px) + 10px)', []);

  const shouldRenderContent = useMemo(
    () => pageState.currentStage === 'content' || pageState.contentMounted,
    [pageState.currentStage, pageState.contentMounted]
  );

  const prefetchedScenesRef = React.useRef<Set<string>>(new Set());
  type TimerHandle = ReturnType<typeof setTimeout>;
  const prefetchIdleHandleRef = React.useRef<TimerHandle | null>(null);
  const splineLibraryWarmRef = React.useRef(false);

  const shouldAllowScenePrefetch = useMemo(
    () =>
      shouldUseSplines &&
      performanceState.heroSceneReady &&
      !deviceProfile.prefersReducedData &&
      networkOptimizations.maxScenes > CRITICAL_SPLINE_COUNT &&
      pageState.currentStage === 'content',
    [
      shouldUseSplines,
      performanceState.heroSceneReady,
      deviceProfile.prefersReducedData,
      networkOptimizations.maxScenes,
      pageState.currentStage,
    ]
  );

  const prefetchSceneAsset = useCallback(
    async (scene: string) => {
      if (prefetchedScenesRef.current.has(scene)) return;
      if (typeof window === 'undefined') return;

      // Honor data-saver modes
      const connection = (navigator as any)?.connection;
      if (connection?.saveData) {
        console.log('[App] Skipping scene prefetch due to Save-Data preference');
        return;
      }

      if (!('caches' in window)) return;

      try {
        const cacheName = getCacheName({ prefetch: true, webview: deviceProfile.isWebView });
        const cache = await caches.open(cacheName);

        const cachedResponse = await cache.match(scene);
        if (cachedResponse) {
          const cachedBlob = await cachedResponse.clone().blob();
          if (isValidSplineBlob(cachedBlob)) {
            prefetchedScenesRef.current.add(scene);
            return;
          }
          await cache.delete(scene);
          console.log('[App] Removed invalid cached blob for scene', scene);
        }

        const response = await fetch(scene, {
          cache: 'force-cache',
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`prefetch failed: ${response.status}`);
        }

        const blobForValidation = await response.clone().blob();
        if (!isValidSplineBlob(blobForValidation)) {
          throw new Error('Invalid scene blob received during prefetch');
        }

        scheduleSceneStorageSave(scene, blobForValidation, {
          deviceProfile,
          priority: 'prefetch',
          blobSize: blobForValidation.size,
        });

        await cache.put(scene, response);

        prefetchedScenesRef.current.add(scene);
        console.log(`[App] Prefetched spline scene for warm cache: ${scene}`);
      } catch (error) {
        console.warn('[App] Scene prefetch failed', scene, error);
      }
    },
    [deviceProfile.isWebView]
  );

  React.useEffect(() => {
    if (!shouldUseSplines || splineLibraryWarmRef.current) return;
    if (typeof window === 'undefined') return;
    splineLibraryWarmRef.current = true;
    import('@splinetool/react-spline')
      .then(() => {
        console.log('[App] Spline library preloaded');
      })
      .catch(err => {
        console.warn('[App] Failed to preload Spline library', err);
      });
  }, [shouldUseSplines]);

  React.useEffect(() => {
    if (!shouldAllowScenePrefetch) return;
    if (prioritizedSplineScenes.length <= CRITICAL_SPLINE_COUNT) return;

    const limit = isMobileLike ? 1 : 3;
    const scenesToPrefetch = prioritizedSplineScenes
      .slice(CRITICAL_SPLINE_COUNT, CRITICAL_SPLINE_COUNT + limit)
      .filter(scene => !prefetchedScenesRef.current.has(scene));

    if (!scenesToPrefetch.length) return;

    const runPrefetch = () => {
      scenesToPrefetch.forEach(scene => {
        prefetchSceneAsset(scene);
      });
    };

    if (typeof window !== 'undefined') {
      const hasRIC = typeof (globalThis as any).requestIdleCallback === 'function';
      if (hasRIC) {
        prefetchIdleHandleRef.current = (globalThis as any).requestIdleCallback(runPrefetch, {
          timeout: 2000,
        });
      } else {
        prefetchIdleHandleRef.current = globalThis.setTimeout(runPrefetch, 1200);
      }
    } else {
      runPrefetch();
    }

    return () => {
      if (prefetchIdleHandleRef.current !== null && typeof window !== 'undefined') {
        const hasCancel = typeof (globalThis as any).cancelIdleCallback === 'function';
        if (hasCancel) {
          (globalThis as any).cancelIdleCallback(prefetchIdleHandleRef.current);
        } else {
        globalThis.clearTimeout(prefetchIdleHandleRef.current);
        }
        prefetchIdleHandleRef.current = null;
      }
    };
  }, [shouldAllowScenePrefetch, prioritizedSplineScenes, prefetchSceneAsset, isMobileLike]);

  const [deferredUIReady, setDeferredUIReady] = React.useState(false);
  React.useEffect(() => {
    if (!shouldRenderContent) {
      setDeferredUIReady(false);
      return;
    }

    let idleHandle: TimerHandle | null = null;
    let usedIdleAPI = false;
    let cancelled = false;

    const activateDeferredUI = () => {
      if (!cancelled) {
        setDeferredUIReady(true);
      }
    };

    if (typeof window !== 'undefined') {
      const hasRIC = typeof (globalThis as any).requestIdleCallback === 'function';
      if (hasRIC) {
        usedIdleAPI = true;
        idleHandle = (globalThis as any).requestIdleCallback(activateDeferredUI, { timeout: 1200 });
      } else {
        idleHandle = globalThis.setTimeout(activateDeferredUI, 600);
      }
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null && typeof window !== 'undefined') {
        const hasCancel = typeof (globalThis as any).cancelIdleCallback === 'function';
        if (usedIdleAPI && hasCancel) {
          (globalThis as any).cancelIdleCallback(idleHandle);
        } else {
          globalThis.clearTimeout(idleHandle);
        }
      }
    };
  }, [shouldRenderContent]);

  const renderDeferredUI = shouldRenderContent && deferredUIReady;

  const showHeroLoaderOverlay = useMemo(
    () =>
      pageState.currentStage === 'content' &&
      shouldUseSplines &&
      !performanceState.heroSceneReady &&
      !performanceState.heroLoaderHidden,
    [pageState.currentStage, shouldUseSplines, performanceState.heroSceneReady, performanceState.heroLoaderHidden]
  );

  const heroLoaderMessage = useMemo(
    () => (deviceProfile.isMobile ? 'Optimizing for Mobile Trading' : 'Loading Premium Trading Experience'),
    [deviceProfile.isMobile]
  );

  const renderAllScenes = useMemo(
    () => deviceProfile.isDesktop && !effectiveDisableSpline,
    [deviceProfile.isDesktop, effectiveDisableSpline]
  );

  const defaultPerfMode = useMemo(() => {
    if (deviceProfile.prefersReducedMotion) return 'balanced';
    if (deviceProfile.prefersReducedData && deviceProfile.connectionType === 'slow-2g') return 'balanced';
    console.log('[App] Default performance mode: high (3D enabled)');
    return 'high';
  }, [deviceProfile]);

  const shouldShowParticles = useMemo(
    () =>
      shouldRenderContent &&
      !performanceState.isSafeMode &&
      !deviceProfile.prefersReducedMotion &&
      deviceProfile.isHighEndDevice &&
      !isMobileLike &&
      networkOptimizations.enableEffects,
    [shouldRenderContent, performanceState, deviceProfile, isMobileLike, networkOptimizations.enableEffects]
  );

  const shouldShowCustomCursor = useMemo(
    () =>
      shouldRenderContent &&
      !isMobileLike &&
      !deviceProfile.prefersReducedMotion &&
      !performanceState.isSafari &&
      networkOptimizations.enableEffects,
    [shouldRenderContent, isMobileLike, deviceProfile, performanceState, networkOptimizations.enableEffects]
  );

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const className = 'use-custom-cursor';
    const root = document.documentElement;
    const body = document.body;
    const enableCustom = shouldShowCustomCursor && renderDeferredUI && !performanceState.isTouch;

    if (enableCustom) {
      root.classList.add(className);
      body.classList.add(className);
    } else {
      root.classList.remove(className);
      body.classList.remove(className);
    }

    return () => {
      root.classList.remove(className);
      body.classList.remove(className);
    };
  }, [shouldShowCustomCursor, renderDeferredUI, performanceState.isTouch]);


  // ===== Initialize Optimization System =====
  useOptimizations({
    enableServiceWorker: !isMobileLike || deviceProfile.connectionType !== 'slow-2g',
    criticalScenes: shouldUseSplines
      ? criticalSplineScenes.length
        ? criticalSplineScenes
        : ['/scene1.splinecode']
      : [],
    preloadScenes: shouldUseSplines ? prioritizedSplineScenes.slice(1) : [],
  });

  // ===== Delayed Preloading for Slow Networks =====
  React.useEffect(() => {
    if (!shouldUseSplines || prioritizedSplineScenes.length === 0) return;

    const delay = networkOptimizations.preloadDelay;
    const timer = setTimeout(() => {
      console.log(`[App] Starting scene preload after ${delay}ms delay`);
      // Preload trigger - the useOptimizations hook handles actual preloading
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldUseSplines, prioritizedSplineScenes, networkOptimizations.preloadDelay]);

  // ===== Telemetry Tracking =====
  React.useEffect(() => {
    telemetryContextRef.current = {
      stage: pageState.currentStage,
      activePage: pageState.activePage,
      isTouch: performanceState.isTouch,
      disableSpline: effectiveDisableSpline,
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
  }, [pageState, deviceProfile, performanceState, effectiveDisableSpline]);

  React.useEffect(() => {
    const uninstall = installCrashTelemetry(() => telemetryContextRef.current);
    return uninstall;
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
  }, [pageState.currentStage, pageState]);

  // ===== Event Handlers =====
  const handleOrientationDismiss = useCallback(() => {
    pageState.setShowOrientationWarning(false);
    pageState.orientationDismissedRef.current = true;
  }, [pageState]);

  const handleRegisterComplete = useCallback(() => {
    userStorage.set('vip_user_registered', 'true');
    pageState.setHasRegistered(true);
    const holdShown = pageState.hasSeenHold || userStorage.get('bm_hold_seen') === 'true';
    if (holdShown) {
      pageState.setCurrentStage('content');
    } else {
      userStorage.set('bm_hold_seen', 'true');
      pageState.setHasSeenHold(true);
      pageState.setCurrentStage('hold');
    }
  }, [pageState]);

  const handleHoldComplete = useCallback(() => {
    pageState.setCurrentStage('content');
  }, [pageState]);

  const handleV2Complete = useCallback(() => {
    musicState.safePlay();
    if (!pageState.hasSeenIntro) {
      userStorage.set('bm_intro_seen', 'true');
      pageState.setHasSeenIntro(true);
    }
    themeState.setParticleTrigger(prev => prev + 1);
    if (pageState.hasRegistered) {
      pageState.setCurrentStage('content');
    } else {
      pageState.setCurrentStage('register');
    }
  }, [pageState, musicState, themeState]);

  const handleHeroReady = useCallback(() => {
    performanceState.setHeroSceneReady(true);
    performanceState.setHeroLoaderHidden(true);
  }, [performanceState]);

  const applyPerformanceChoice = useCallback(
    (mode: 'high' | 'balanced') => {
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
    },
    [uiState, performanceState]
  );

  const handlePerformanceToggle = useCallback(() => {
    if (useMobileStaticContent) {
      uiState.setPerfToast({ message: 'Mobile static mode - 3D disabled', type: 'info' });
      setTimeout(() => uiState.setPerfToast(null), PERF_TOAST_DURATION);
      return;
    }
    performanceState.handlePerformanceToggle(uiState.setPerfToast, themeState.setParticleTrigger);
  }, [useMobileStaticContent, uiState, performanceState, themeState]);

  const handleThemeQuickPickOpen = useCallback(() => {
    uiState.setControlCenterOpen(false);
    uiState.setShowThemeQuickPick(true);
  }, [uiState]);

  const handleThemeQuickPickClose = useCallback(() => {
    uiState.setShowThemeQuickPick(false);
  }, [uiState]);

  const handleThemeChange = useCallback(
    (themeId: string) => {
      themeState.handleQuickThemeChange(themeId, musicState.isMuted, musicState.safePlay);
    },
    [themeState, musicState]
  );

  const handleFaqOpen = useCallback(() => {
    uiState.setFaqOpen(true);
  }, [uiState]);

  const handleFaqClose = useCallback(() => {
    uiState.setFaqOpen(false);
  }, [uiState]);

  const handleInfoPanelToggle = useCallback(() => {
    uiState.setInfoPanelOpen(prev => !prev);
  }, [uiState]);

  const handleInfoPanelClose = useCallback(() => {
    uiState.setInfoPanelOpen(false);
  }, [uiState]);

  const handleControlCenterToggle = useCallback(() => {
    uiState.setShowThemeQuickPick(false);
    uiState.setControlCenterOpen(prev => !prev);
  }, [uiState]);

  const handleConfiguratorClose = useCallback(() => {
    uiState.setShowConfigurator(false);
  }, [uiState]);


  const navigateToNextPage = useCallback(() => {
    const maxPages = effectiveDisableSpline ? visiblePages.length : PAGE_CONFIG.length;
    if (pageState.activePage < maxPages) {
      playClick();
      pageState.pageRefs.current[pageState.activePage]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [pageState, effectiveDisableSpline, visiblePages]);

  const navigateToPrevPage = useCallback(() => {
    if (pageState.activePage > 1) {
      playClick();
      pageState.pageRefs.current[pageState.activePage - 2]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [pageState]);

  const swipeHandlers = useMemo(
    () =>
      createSwipeHandlers({
        onSwipeLeft: navigateToNextPage,
        onSwipeRight: navigateToPrevPage,
        threshold: 80,
        velocityThreshold: 0.4,
        preventScroll: false,
      }),
    [navigateToNextPage, navigateToPrevPage]
  );

  const handlePageChange = useCallback(
    (idx: number) => {
      pageState.pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [pageState]
  );

  // ===== Early Return =====
  if (!pageState.isClient) return null;

  // ===== Render =====
  return (
    <>
      <Analytics />
      <SpeedInsights />

      {/* ===== Background Music ===== */}
      {shouldRenderContent && (
        <BackgroundMusicSystem
          themeId={themeState.activeThemeId}
          onReady={musicState.handlePlayerReady}
          volume={musicState.volume}
          trackKey={themeState.musicKey}
        />
      )}

      {/* ===== Particle Effects ===== */}
      {shouldShowParticles && renderDeferredUI && (
        <ParticleEffect trigger={themeState.particleTrigger} />
      )}

      {/* ===== Custom Cursor ===== */}
      {shouldShowCustomCursor && renderDeferredUI && (
        <CustomCursor accentColor={themeState.accentColor} />
      )}

      {/* ===== Quick Theme Picker ===== */}
      <QuickThemePicker
        isOpen={uiState.showThemeQuickPick}
        onClose={handleThemeQuickPickClose}
        activeThemeId={themeState.activeThemeId}
        onThemeChange={handleThemeChange}
      />

      {/* ===== Info Panel ===== */}
      {shouldRenderContent && !useMobileStaticContent && (
        <InfoPanel
          config={PAGE_CONFIG[pageState.activePage - 1]}
          isOpen={uiState.infoPanelOpen}
          onClose={handleInfoPanelClose}
          accentColor={themeState.accentColor}
        />
      )}

      {/* ===== FAQ Overlay ===== */}
      <FAQOverlay isOpen={uiState.faqOpen} onClose={handleFaqClose} />

      {/* ===== Progress Bar ===== */}
      {!useMobileStaticContent && (
        <ProgressBar
          isVisible={pageState.currentStage === 'content'}
          activePage={pageState.activePage}
          totalPages={visiblePages.length}
        />
      )}

      {/* ===== Performance Toast ===== */}
      <PerfToast toast={uiState.perfToast} />

      {/* ===== Performance Prompt ===== */}
      <PerformancePrompt
        isVisible={
          !useMobileStaticContent && uiState.showPerfPrompt && pageState.currentStage === 'content'
        }
        accentColor={themeState.accentColor}
        deviceProfile={deviceProfile}
        defaultPerfMode={defaultPerfMode}
        onChoose={applyPerformanceChoice}
      />

      {/* ===== Theme Configurator ===== */}
      {uiState.showConfigurator && (
        <div className="fixed inset-0 z-[300000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-6xl h-[80vh] bg-[#020617] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <button
              onClick={handleConfiguratorClose}
              className="absolute top-6 right-6 z-[10] p-2 text-white/50 hover:text-white transition-all"
              aria-label="Close theme configurator"
            >
              ✕
            </button>
            {/* @ts-ignore */}
            <FixedThemeConfigurator
              initialThemeId={themeState.activeThemeId}
              onThemeChange={(themeId: string, sound: any, muted: boolean) =>
                themeState.handleThemeChange(themeId, sound, muted, musicState.safePlay)
              }
            />
          </div>
        </div>
      )}

      {/* ===== Gating Screens ===== */}
      {pageState.currentStage === 'register' && (
        <div
          className="fixed inset-0 z-[100000] bg-black transition-all duration-500"
          style={{ filter: themeState.activeTheme?.filter || 'none' }}
        >
          {/* @ts-ignore */}
          <RegisterPage onUnlock={handleRegisterComplete} theme={themeState.activeTheme} />
        </div>
      )}

      {pageState.currentStage === 'hold' && (
        <div
          className="fixed inset-0 z-[100000] transition-all duration-500"
          style={{ filter: themeState.activeTheme?.filter || 'none' }}
        >
          {/* @ts-ignore */}
          <BullMoneyGate onUnlock={handleHoldComplete} theme={themeState.activeTheme}>
            <></>
          </BullMoneyGate>
        </div>
      )}

      {pageState.currentStage === 'v2' && (
        <div
          className="fixed inset-0 z-[100000] transition-all duration-500"
          style={{ filter: themeState.activeTheme?.filter || 'none' }}
        >
          {/* @ts-ignore */}
          <MultiStepLoaderV2 onFinished={handleV2Complete} theme={themeState.activeTheme} />
        </div>
      )}

      {/* ===== Hero Loader Overlay ===== */}
      {showHeroLoaderOverlay && (
        <HeroLoaderOverlay
          visible={showHeroLoaderOverlay}
          message={heroLoaderMessage}
          accentColor={themeState.accentColor}
        />
      )}

      {/* ===== Ultimate Control Panel ===== */}
      {shouldRenderContent && (
        <UltimateControlPanel
          isOpen={uiState.controlCenterOpen}
          onOpenChange={(isOpen) => uiState.setControlCenterOpen(isOpen)}
          userEmail="user@bullmoney.online"
          userName="Trader"
          accentColor={themeState.accentColor}
        />
      )}

      {/* ===== Fixed Header ===== */}
      {pageState.currentStage === 'content' && (
        <>
          <header className="fixed top-0 left-0 right-0 z-[250000] w-full transition-all duration-300">
            <Navbar
              setShowConfigurator={uiState.setShowConfigurator}
              activeThemeId={themeState.activeThemeId}
              accentColor={themeState.accentColor}
              onThemeChange={handleThemeChange}
              isMuted={musicState.isMuted}
              onMuteToggle={musicState.toggleMusic}
              disableSpline={effectiveDisableSpline}
              onPerformanceToggle={handlePerformanceToggle}
              infoPanelOpen={useMobileStaticContent ? false : uiState.infoPanelOpen}
              onInfoToggle={useMobileStaticContent ? undefined : handleInfoPanelToggle}
              onFaqClick={handleFaqOpen}
              onControlCenterToggle={handleControlCenterToggle}
            />
          </header>

          {/* ===== Live Market Ticker ===== */}
          <div
            className="fixed left-0 right-0 z-[249000] w-full transition-all duration-300"
            style={{
              top: calculateNavbarHeight(isMobileLike),
            }}
          >
            <LiveMarketTicker />
          </div>
        </>
      )}

      {/* ===== Main Content ===== */}
      {shouldRenderContent && (
        <div
          className={
            pageState.currentStage === 'content'
              ? 'w-full h-[100dvh] relative'
              : 'opacity-0 pointer-events-none h-0 overflow-hidden'
          }
        >
          {/* ===== Target Cursor ===== */}
          {!performanceState.isTouch && renderDeferredUI && (
            <TargetCursor
              spinDuration={2}
              hideDefaultCursor={false}
              targetSelector=".cursor-target, a, button"
            />
          )}

          {/* ===== Vertical Page Scroll ===== */}
          {!isMobileLike && renderDeferredUI && (
            <VerticalPageScroll
              currentPage={pageState.activePage}
              totalPages={visiblePages.length}
              onPageChange={handlePageChange}
              accentColor={themeState.accentColor}
              disabled={pageState.currentStage !== 'content'}
            />
          )}

          {/* ===== 3D Hint Icon / Control Center ===== */}
          {renderDeferredUI && (
            <ThreeDHintIcon
              accentColor={themeState.accentColor}
              disableSpline={effectiveDisableSpline}
              showHint={!pageState.hasSeenIntro}
              isPanelOpen={uiState.controlCenterOpen}
              dockSide={isMobileLike ? 'left' : 'right'}
              onTogglePanel={handleControlCenterToggle}
            />
          )}

          {/* ===== Mobile Quick Actions ===== */}
          {showMobileQuickActions && (
            <MobileQuickActions
              isVisible={showMobileQuickActions}
              disableSpline={effectiveDisableSpline}
              isPlaying={!musicState.isMuted}
              volume={musicState.volume}
              safeAreaBottom={safeAreaBottom}
              accentColor={themeState.accentColor}
              onPerformanceToggle={handlePerformanceToggle}
              onMusicToggle={musicState.toggleMusic}
              onThemeClick={handleThemeQuickPickOpen}
              onHelpClick={handleFaqOpen}
              onControlCenterToggle={handleControlCenterToggle}
            />
          )}

          {/* ===== Scroll Container - Mobile Static Content ===== */}
          {useMobileStaticContent ? (
            <main
              ref={pageState.scrollContainerRef}
              data-scroll-container
              className="profit-reveal w-full min-h-[100dvh] overflow-y-auto overflow-x-hidden unified-scroll mobile-scroll bg-black no-scrollbar text-white relative"
              style={{
                WebkitOverflowScrolling: 'touch',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'pan-y',
                maxWidth: '100vw',
                maxHeight: '100dvh',
                paddingLeft: 'max(env(safe-area-inset-left, 0px), 8px)',
                paddingRight: 'max(env(safe-area-inset-right, 0px), 8px)',
                scrollbarGutter: 'stable both-edges',
                // Mobile-optimized layout
                paddingTop: isMobileLike ? calculateNavbarHeight(true) : '0px',
                paddingBottom: isMobileLike
                  ? `calc(${MOBILE_LAYOUT.bottomNavHeight}px + env(safe-area-inset-bottom, 0px) + ${MOBILE_LAYOUT.safeAreaPadding}px)`
                  : '0px',
                // Improve scroll performance
                willChange: 'scroll-position',
                transform: 'translateZ(0)', // Force GPU acceleration
                backfaceVisibility: 'hidden',
                // Better mobile interaction
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'auto',
              }}
            >
              {/* Orientation Warning */}
              {pageState.showOrientationWarning && (
                <OrientationOverlay onDismiss={handleOrientationDismiss} />
              )}

              {/* Mobile Content */}
              <MobileStaticContent
                disableSpline={effectiveDisableSpline}
              />

              {/* Footer */}
              <div className="w-full mt-10">
                <Footer />
              </div>
            </main>
          ) : (
            /* ===== Scroll Container - Desktop/Interactive Content ===== */
            <main
              ref={pageState.scrollContainerRef}
              data-scroll-container
              className={`profit-reveal w-full h-full flex flex-col overflow-y-scroll overflow-x-hidden unified-scroll ${
                performanceState.isTouch
                  ? 'touch-device'
                  : 'non-touch-device snap-y snap-mandatory scroll-smooth'
              } bg-black no-scrollbar text-white relative`}
              onTouchStart={swipeHandlers.onTouchStart}
              onTouchMove={swipeHandlers.onTouchMove}
              onTouchEnd={swipeHandlers.onTouchEnd}
              style={{
                WebkitOverflowScrolling: 'touch',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'pan-y',
                maxWidth: '100vw',
                maxHeight: '100dvh',
                paddingLeft: 'max(env(safe-area-inset-left, 0px), 8px)',
                paddingRight: 'max(env(safe-area-inset-right, 0px), 8px)',
                scrollbarGutter: 'stable both-edges',
                scrollPaddingTop: isMobileLike ? calculateNavbarHeight(true) : '0px',
                paddingBottom: isMobileLike
                  ? `calc(${MOBILE_LAYOUT.bottomNavHeight}px + env(safe-area-inset-bottom, 0px))`
                  : '0px',
                // Performance optimizations
                willChange: 'scroll-position',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                // Better mobile interaction
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'auto',
              }}
            >
              {/* Orientation Warning */}
              {pageState.showOrientationWarning && (
                <OrientationOverlay onDismiss={handleOrientationDismiss} />
              )}

              {/* Scroll Pages */}
              {visiblePages.map((page) => (
                <React.Fragment key={page.id}>
                  {page.type === 'split' ? (
                    <DraggableSplitSection
                      config={page}
                      activePage={pageState.activePage}
                      onVisible={(el: HTMLElement | null) => {
                        pageState.pageRefs.current[page.id - 1] = el;
                      }}
                      parallaxOffset={performanceState.parallaxOffset}
                      disableSpline={effectiveDisableSpline}
                      useCrashSafeSpline={true}
                      forceLiteSpline={isMobileLike || !networkOptimizations.enableEffects}
                      eagerRenderSplines={performanceState.splinesEnabled && networkOptimizations.enableEffects}
                      renderAllScenes={renderAllScenes}
                      deviceProfile={deviceProfile}
                    />
                  ) : (
                    <FullScreenSection
                      config={page}
                      activePage={pageState.activePage}
                      onVisible={(el: HTMLElement | null) => {
                        pageState.pageRefs.current[page.id - 1] = el;
                      }}
                      parallaxOffset={performanceState.parallaxOffset}
                      disableSpline={effectiveDisableSpline}
                      useCrashSafeSpline={true}
                      forceLiteSpline={isMobileLike || !networkOptimizations.enableEffects}
                      eagerRenderSplines={performanceState.splinesEnabled && networkOptimizations.enableEffects}
                      renderAllScenes={renderAllScenes}
                      onSceneReady={page.id === 1 ? handleHeroReady : undefined}
                      deviceProfile={deviceProfile}
                    />
                  )}
                </React.Fragment>
              ))}

              {/* Footer */}
              <div className="w-full mt-10">
                <Footer />
              </div>
            </main>
          )}
        </div>
      )}
    </>
  );
}

export default memo(Home);
