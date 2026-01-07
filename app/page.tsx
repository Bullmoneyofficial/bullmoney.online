"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useTheme as useNextTheme } from 'next-themes';
import {
  Volume2, Volume1, VolumeX, X, Palette, MessageCircle,
  Info, Smartphone, Monitor,
  Layers, Lock, Unlock, Zap, ChevronLeft, ChevronRight, SunMoon
} from 'lucide-react';
import { installCrashTelemetry, safeMark } from '@/lib/telemetry';

// --- INTERACTION UTILITIES ---
import { playClick, playHover, playSwipe, createSwipeHandlers } from '@/lib/interactionUtils';

// --- COMPONENT IMPORTS ---
// Component imports are dynamically loaded below to keep the main bundle lean.
const FullScreenSection = dynamic(
  () => import('@/components/Mainpage/PageScenes').then((mod) => mod.FullScreenSection),
  { ssr: false, loading: () => <section className="h-[100dvh] w-full bg-black" /> }
);
const DraggableSplitSection = dynamic(
  () => import('@/components/Mainpage/PageScenes').then((mod) => mod.DraggableSplitSection),
  { ssr: false, loading: () => <section className="h-[100dvh] w-full bg-black" /> }
);

// --- THEME & MUSIC DATA ---
import { ALL_THEMES, Theme, SoundProfile } from '@/components/Mainpage/ThemeComponents';
import { useDeviceProfile, DeviceProfile, DEFAULT_DEVICE_PROFILE } from '@/lib/deviceProfile';
import { PAGE_CONFIG, CRITICAL_SPLINE_SCENES, CRITICAL_SCENE_BLOB_MAP, FALLBACK_THEME, getThemeColor } from '@/lib/pageConfig';

// --- OPTIMIZATION IMPORTS ---
import { useOptimizations } from '@/lib/useOptimizations';
import { userStorage, devicePrefs, sessionPrefs } from '@/lib/smartStorage';

// --- UNIFIED UI IMPORTS ---
import { UI_LAYERS } from '@/lib/uiLayers';
import '@/styles/unified-ui.css';
import { GLOBAL_STYLES } from '@/styles/globalStyles';

// --- TSX PAGE IMPORTS ---

// --- DYNAMIC IMPORTS ---
const Navbar = dynamic(
  () => import('@/components/Mainpage/navbar').then((mod) => mod.Navbar),
  { ssr: false, loading: () => null }
);
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
const InlineFaq = dynamic(() => import('@/components/Mainpage/InlineFaq'), {
  ssr: false,
  loading: () => <div className="p-6 text-white/60 text-center">Loading help...</div>
});
const Footer = dynamic(() => import('@/components/Mainpage/footer').then((mod) => mod.Footer), {
  ssr: false,
  loading: () => <div className="h-24" />
});
const ParticleEffect = dynamic(
  () => import('@/components/Mainpage/PageElements').then((mod) => mod.ParticleEffect),
  { ssr: false, loading: () => null }
);
const OrientationOverlay = dynamic(
  () => import('@/components/Mainpage/PageElements').then((mod) => mod.OrientationOverlay),
  { ssr: false, loading: () => null }
);
const InfoPanel = dynamic(
  () => import('@/components/Mainpage/PageElements').then((mod) => mod.InfoPanel),
  { ssr: false, loading: () => null }
);
const BackgroundMusicSystem = dynamic(
  () => import('@/components/Mainpage/PageElements').then((mod) => mod.BackgroundMusicSystem),
  { ssr: false, loading: () => null }
);
const CustomCursor = dynamic(
  () => import('@/components/Mainpage/PageElements').then((mod) => mod.CustomCursor),
  { ssr: false, loading: () => null }
);
const HeroLoaderOverlay = dynamic(
  () => import('@/components/Mainpage/PageElements').then((mod) => mod.HeroLoaderOverlay),
  { ssr: false, loading: () => null }
);
const TargetCursor = dynamic(() => import('@/components/Mainpage/TargertCursor'), { 
  ssr: false, 
  loading: () => <div className="hidden">Loading...</div> 
});
const UnifiedNavigation = dynamic(() => import('@/components/Mainpage/UnifiedNavigation'), {
  ssr: false,
  loading: () => null
});
const UnifiedControls = dynamic(() => import('@/components/Mainpage/UnifiedControls'), {
  ssr: false,
  loading: () => null
});
const VerticalPageScroll = dynamic(() => import('@/components/Mainpage/VerticalPageScroll'), {
  ssr: false,
  loading: () => null
});
const ThreeDHintIcon = dynamic(() => import('@/components/Mainpage/ThreeDHintIcon'), {
  ssr: false,
  loading: () => null
});
const SwipeablePanel = dynamic(() => import('@/components/Mainpage/SwipeablePanel'), {
  ssr: false,
  loading: () => null
});
const MobileScrollIndicator = dynamic(() => import('@/components/Mainpage/MobileScrollIndicator'), {
  ssr: false,
  loading: () => null
});

const FixedThemeConfigurator = dynamic(
    () => import('@/components/Mainpage/ThemeComponents').then((mod) => mod.default), 
    { ssr: false }
);

// Legacy sound effect helper (deprecated - use playClick from interactionUtils instead)
const playClickSound = playClick;

// ----------------------------------------------------------------------
// 7. MAIN COMPONENT
// ----------------------------------------------------------------------
export default function Home() {
  const { resolvedTheme, setTheme: setNextTheme } = useNextTheme();
  const [currentStage, setCurrentStage] = useState<"register" | "hold" | "v2" | "content">("v2");
  const [isClient, setIsClient] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState<string>('t01'); 
  const [showConfigurator, setShowConfigurator] = useState(false); 
  const [isMuted, setIsMuted] = useState(false); 
  const [volume, setVolume] = useState(25);
  const playerRef = useRef<any>(null);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [heroSceneReady, setHeroSceneReady] = useState(false);
  const [heroLoaderHidden, setHeroLoaderHidden] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [hasSeenHold, setHasSeenHold] = useState(false);
  const [showPerfPrompt, setShowPerfPrompt] = useState(false);
  
  // File 1 States
  const [activePage, setActivePage] = useState<number>(1);
  const [modalData, setModalData] = useState<any>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  // isMobileView removed - unified UI for both mobile and desktop
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);
   
  const [_, startTransition] = useTransition();
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const assetsWarmedRef = useRef(false);
  const sessionRestoredRef = useRef(false);
  const parallaxRafRef = useRef<number>(0);
  const prefersReducedMotionRef = useRef(false);
  const orientationDismissedRef = useRef(false);
  const touchStartRef = useRef(0);
  const [isTouch, setIsTouch] = useState(false);
  const isTouchRef = useRef(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [musicKey, setMusicKey] = useState(0);
  const [disableSpline, setDisableSpline] = useState(false);
  const [showThemeQuickPick, setShowThemeQuickPick] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [showEdgeSwipeHints, setShowEdgeSwipeHints] = useState(false);
  const edgeHintsShownRef = useRef(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const controlCenterThemeRef = useRef<HTMLDivElement | null>(null);
  const heroLoaderFallbackRef = useRef<number | null>(null);
  const deviceProfile = useDeviceProfile();
  const colorMode = (resolvedTheme === 'light' || resolvedTheme === 'dark') ? resolvedTheme : 'dark';
  const telemetryContextRef = useRef<Record<string, unknown>>({});
  const perfPromptTimeoutRef = useRef<number | null>(null);

  // Initialize optimization system
  const { isReady: optimizationsReady, serviceWorkerReady, storage } = useOptimizations({
    enableServiceWorker: true,
    criticalScenes: ['/scene1.splinecode'], // Hero scene
    preloadScenes: ['/scene.splinecode', '/scene2.splinecode'] // Other scenes
  });

  useEffect(() => {
    telemetryContextRef.current = {
      stage: currentStage,
      activePage,
      isTouch,
      disableSpline,
      isSafeMode,
      isSafari,
      deviceProfile: {
        isMobile: deviceProfile.isMobile,
        isWebView: deviceProfile.isWebView,
        isHighEndDevice: deviceProfile.isHighEndDevice,
        prefersReducedData: deviceProfile.prefersReducedData,
        connectionType: deviceProfile.connectionType,
      },
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }, [activePage, currentStage, deviceProfile, disableSpline, isSafeMode, isSafari, isTouch]);

  useEffect(() => {
    const uninstall = installCrashTelemetry(() => telemetryContextRef.current);
    return () => uninstall();
  }, []);

  useEffect(() => {
    console.log('[nav] activePage', activePage);
    safeMark(`bm_active_page:${activePage}`);
  }, [activePage]);

  useEffect(() => {
    safeMark(`bm_stage:${currentStage}`);
  }, [currentStage]);

  useEffect(() => {
    if (showConfigurator) setControlCenterOpen(false);
  }, [showConfigurator]);

  useEffect(() => {
    if (currentStage === 'content') {
      setContentMounted(true);
    }
  }, [currentStage]);

  const handleOrientationDismiss = useCallback(() => {
    setShowOrientationWarning(false);
    orientationDismissedRef.current = true;
  }, []);

  useEffect(() => {
    prefersReducedMotionRef.current = deviceProfile.prefersReducedMotion;
  }, [deviceProfile.prefersReducedMotion]);

  const toggleColorMode = useCallback(() => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(10);
    setNextTheme(colorMode === 'dark' ? 'light' : 'dark');
  }, [colorMode, setNextTheme]);

  useEffect(() => {
    if (heroSceneReady) {
      if (heroLoaderFallbackRef.current) {
        window.clearTimeout(heroLoaderFallbackRef.current);
        heroLoaderFallbackRef.current = null;
      }
      setHeroLoaderHidden(true);
      return;
    }

    if (currentStage !== 'content') return;

    if (heroLoaderFallbackRef.current) {
      window.clearTimeout(heroLoaderFallbackRef.current);
    }

    heroLoaderFallbackRef.current = window.setTimeout(() => {
      setHeroLoaderHidden(true);
    }, 7500);

    return () => {
      if (heroLoaderFallbackRef.current) {
        window.clearTimeout(heroLoaderFallbackRef.current);
        heroLoaderFallbackRef.current = null;
      }
    };
  }, [heroSceneReady, currentStage]);

  const activeTheme = useMemo(() => {
    if (!ALL_THEMES || ALL_THEMES.length === 0) return FALLBACK_THEME as Theme;
    return ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  }, [activeThemeId]);
    
  const accentColor = useMemo(() => getThemeColor(activeThemeId), [activeThemeId]);
  const isPlaying = useMemo(() => !isMuted, [isMuted]);
  const defaultPerfMode = useMemo(
    () =>
      deviceProfile.isHighEndDevice && !deviceProfile.prefersReducedData && !isSafari && !isSafeMode
        ? 'high'
        : 'balanced',
    [deviceProfile.isHighEndDevice, deviceProfile.prefersReducedData, isSafari, isSafeMode]
  );

  // --- INIT ---
  useEffect(() => {
    setIsClient(true);

    // Inject Styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = GLOBAL_STYLES;
    document.head.appendChild(styleSheet);

    const touch = !!(matchMedia && matchMedia('(pointer: coarse)').matches);
    isTouchRef.current = touch;
    setIsTouch(touch);

    // Auto-disable Spline by default; preserve user preference when available
    const savedSplinePref = devicePrefs.get('spline_enabled');
    const splinePrefV2 = devicePrefs.get('spline_pref_v2');
    const splinePrefFix = devicePrefs.get('spline_pref_v2_fix');
    const ua = navigator.userAgent || '';
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
    setIsSafari(isSafariBrowser);
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isInApp =
      /Instagram|FBAN|FBAV|FB_IAB|FBIOS|FB4A|Line|TikTok|Twitter|Snapchat|LinkedInApp/i.test(ua);
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    const effectiveType = connection?.effectiveType || connection?.type || '4g';
    const prefersReducedData = connection?.saveData === true || ['slow-2g', '2g', '3g'].includes(effectiveType);
    const shouldSafeMode = isIOS || isInApp || prefersReducedData;
    setIsSafeMode(shouldSafeMode);
    const prefersPerformanceMode =
      shouldSafeMode ||
      deviceProfile.prefersReducedData ||
      !deviceProfile.isHighEndDevice ||
      deviceProfile.isMobile;
    if (splinePrefV2 === 'true') {
      if (savedSplinePref === 'false' && splinePrefFix !== 'true') {
        // Recover from legacy inverted preference.
        setDisableSpline(false);
        devicePrefs.set('spline_enabled', 'true');
        devicePrefs.set('spline_pref_v2_fix', 'true');
      } else if (savedSplinePref === null && prefersPerformanceMode) {
        setDisableSpline(true);
        devicePrefs.set('spline_enabled', 'false');
      } else {
        const splineEnabled = savedSplinePref !== null ? savedSplinePref === 'true' : !prefersPerformanceMode;
        setDisableSpline(!splineEnabled);
      }
    } else {
      // Migrate legacy pref and default to performance-first on constrained devices.
      const defaultSplineEnabled = !prefersPerformanceMode;
      setDisableSpline(!defaultSplineEnabled);
      devicePrefs.set('spline_enabled', defaultSplineEnabled ? 'true' : 'false');
      devicePrefs.set('spline_pref_v2', 'true');
    }

    // Check for reduced motion preference via native API
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };

    if (mediaQuery) {
      prefersReducedMotionRef.current = mediaQuery.matches;
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMotionChange);
      } else {
        (mediaQuery as any).addListener(handleMotionChange);
      }
    }

    // ========================================
    // CRITICAL: Prevent page reloads on mobile browsers
    // ========================================
    const handleTouchStart = (e: TouchEvent) => {
      const scrollable = (e.target as HTMLElement)?.closest('.mobile-scroll');
      if (scrollable && e.touches.length > 0) {
        touchStartRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollable = (e.target as HTMLElement)?.closest('.mobile-scroll');
      if (!scrollable || e.touches.length === 0) return;

      const currentY = e.touches[0].clientY;
      const isPullingDown = currentY - touchStartRef.current > 0;
      if (scrollable.scrollTop <= 0 && isPullingDown) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Disable pull-to-refresh on the body
    document.body.style.overscrollBehavior = 'contain';

    // ULTRA-OPTIMIZED: 60fps scroll with advanced RAF throttling
    // CRITICAL FIX: Disabled parallax on mobile to prevent crashes
    let rafId: number | null = null;
    let lastScrollTime = 0;
    let ticking = false;

    const handleScroll = () => {
      if (prefersReducedMotionRef.current) return;
      // CRITICAL FIX: Disable parallax completely on touch devices to prevent crashes
      if (isTouchRef.current || touch) return;

      const now = performance.now();

      // Advanced throttling: Only update on actual frame boundaries
      if (now - lastScrollTime < 16.67) return;

      lastScrollTime = now;

      // Use RAF ticking pattern for guaranteed 60fps
      if (!ticking) {
        if (rafId !== null) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const scrollTop = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : window.scrollY;

          // Batch state update to reduce re-renders
          setParallaxOffset(scrollTop);

          ticking = false;
          rafId = null;
        });

        ticking = true;
      }
    };

    const scrollElement = scrollContainerRef.current || window;
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollElement !== window) window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial Layout Check
    const checkLayout = () => {
        const isNarrow = window.innerWidth < 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isNarrow && isPortrait) {
            // isMobileView removed - unified UI handles mobile/desktop automatically
            if (!orientationDismissedRef.current) {
              setShowOrientationWarning(true);
            }
        } else {
            // isMobileView removed - unified UI handles mobile/desktop automatically
            setShowOrientationWarning(false);
        }
    };
    
    checkLayout();
    handleScroll();
    window.addEventListener('resize', checkLayout);
    
    // Load User Prefs from smart storage (WebView compatible)
    const storedTheme = userStorage.get('user_theme_id');
    const storedMute = userStorage.get('user_is_muted');
    const storedVol = userStorage.get('user_volume');
    const hasRegisteredUser = userStorage.get('vip_user_registered') === 'true';
    const introSeenFlag = userStorage.get('bm_intro_seen') === 'true';
    const holdSeenFlag = userStorage.get('bm_hold_seen') === 'true';

    if (storedTheme) setActiveThemeId(storedTheme);
    if (storedMute !== null) setIsMuted(storedMute === 'true');
    if (storedVol) setVolume(parseInt(storedVol));
    setHasSeenIntro(introSeenFlag);
    setHasSeenHold(holdSeenFlag);
    setHasRegistered(hasRegisteredUser);
    setCurrentStage("v2");
    
    // Cleanup
    return () => {
      document.head.removeChild(styleSheet);
      window.removeEventListener('resize', checkLayout);
      scrollElement.removeEventListener('scroll', handleScroll);
      if (scrollElement !== window) window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      if (parallaxRafRef.current) cancelAnimationFrame(parallaxRafRef.current);
      
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMotionChange);
        } else {
          (mediaQuery as any).removeListener(handleMotionChange);
        }
      }
    };
  }, []);

  // OPTIMIZED: Aggressive parallel preloading of ALL Spline scenes for instant loading
  useEffect(() => {
    if (!isClient || disableSpline || currentStage !== 'content') return;

    // Preload ALL scenes in parallel for instant switching
    const allScenes = [
      "/scene1.splinecode",  // Hero - Critical
      "/scene.splinecode",   // Showcase - High priority
      "/scene2.splinecode",  // Final
      "/scene3.splinecode",  // Concept
      "/scene4.splinecode",  // Prototype (split)
      "/scene5.splinecode",  // Wireframe (split)
      "/scene6.splinecode",  // Interactive
    ];

    // Use high-priority preload for critical scenes, prefetch for others
    allScenes.forEach((scene, index) => {
      const link = document.createElement("link");
      // First 2 scenes are critical - use preload
      if (index < 2) {
        link.rel = "preload";
        link.as = "fetch";
        link.crossOrigin = "anonymous";
      } else {
        // Others use prefetch for background loading
        link.rel = "prefetch";
        link.as = "fetch";
      }
      link.href = scene;
      document.head.appendChild(link);
    });

    // Also start parallel background fetch for instant cache
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheName = 'bullmoney-spline-instant-v1';
      caches.open(cacheName).then(cache => {
        // Fetch all scenes in parallel
        Promise.all(
          allScenes.map(scene =>
            fetch(scene, { cache: 'force-cache' })
              .then(res => res.ok ? cache.put(scene, res) : null)
              .catch(() => null)
          )
        ).then(() => {
          console.log('[Performance] All Spline scenes preloaded and cached');
        });
      }).catch(() => {});
    }
  }, [isClient, disableSpline, currentStage]);

  // Warm key assets once to keep subsequent visits snappy
  useEffect(() => {
    if (!isClient || assetsWarmedRef.current || isSafari || disableSpline || currentStage !== 'content') return;
    assetsWarmedRef.current = true;

    const warmAssets = async () => {
      const sceneUrls = PAGE_CONFIG.flatMap((page) => {
        if (page.type === 'full') return [page.scene];
        if (page.type === 'split') return [page.sceneA, page.sceneB];
        return [];
      }).filter(Boolean) as string[];

      const uniqueScenes = Array.from(new Set(sceneUrls));
      try {
        const cache = typeof window !== 'undefined' && 'caches' in window ? await caches.open('bullmoney-prewarm-v1') : null;
        await Promise.all(uniqueScenes.map(async (url) => {
          try {
            const req = new Request(url, { cache: 'force-cache' });
            if (cache) {
              const match = await cache.match(req);
              if (match) return;
              const res = await fetch(req);
              if (res.ok) await cache.put(req, res.clone());
            } else {
              await fetch(req);
            }
          } catch (e) {}
        }));
      } catch (e) {}
    };

    const scheduleWarm = () => { warmAssets().catch(() => {}); };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(scheduleWarm, { timeout: 2000 });
    } else {
      setTimeout(scheduleWarm, 800);
    }
  }, [isClient, isSafari, disableSpline, currentStage]);

  // Force-warm critical spline scenes even in safe/in-app browsers to avoid first-load failures
  useEffect(() => {
    if (!isClient || currentStage !== 'content' || disableSpline) return;
    let cancelled = false;

    const prefetchWithRetry = async (url: string) => {
      // Already cached as blob
      if (CRITICAL_SCENE_BLOB_MAP[url]) return;

      for (let attempt = 0; attempt < 2; attempt++) {
        if (cancelled) return;
        try {
          const req = new Request(url, { cache: 'force-cache', mode: 'cors' });
          const res = await fetch(req);
          if (cancelled) return;
          if (!res.ok) throw new Error(`Bad status ${res.status}`);

          // Cache to browser cache for next visits
          if (typeof window !== 'undefined' && 'caches' in window) {
            const cache = await caches.open('bullmoney-critical-splines');
            await cache.put(req, res.clone());
          }

          // Create local blob URL so Spline can load without another network hop (in-app browsers often block)
          const blob = await res.clone().blob();
          const objectUrl = URL.createObjectURL(blob);
          CRITICAL_SCENE_BLOB_MAP[url] = objectUrl;
          return;
        } catch (err) {
          await new Promise((resolve) => setTimeout(resolve, 180));
        }
      }
    };

    const prefetchAll = async () => {
      for (const scene of CRITICAL_SPLINE_SCENES) {
        await prefetchWithRetry(scene);
      }
    };

    const schedule = () => { prefetchAll().catch(() => {}); };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(schedule, { timeout: 800 });
    } else {
      setTimeout(schedule, 400);
    }

    return () => { cancelled = true; };
  }, [isClient, isSafari, currentStage, disableSpline]);

  useEffect(() => {
    if (!isClient || currentStage !== 'content' || !contentMounted || sessionRestoredRef.current) return;

    const restoreSession = () => {
      const scrollContainer = scrollContainerRef.current;
      const storedScroll = userStorage.get('scroll_position');
      if (scrollContainer && storedScroll) {
        scrollContainer.scrollTo({ top: parseInt(storedScroll, 10), behavior: 'auto' });
      }
      const storedPage = userStorage.get('scroll_page');
      if (storedPage) {
        const pageIndex = Number(storedPage);
        if (!Number.isNaN(pageIndex) && pageIndex >= 1 && pageIndex <= PAGE_CONFIG.length) {
          setActivePage(pageIndex);
          pageRefs.current[pageIndex - 1]?.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }
      sessionRestoredRef.current = true;
    };

    const timer = window.setTimeout(restoreSession, 60);
    return () => window.clearTimeout(timer);
  }, [isClient, currentStage, contentMounted]);

  useEffect(() => {
    if (!isClient || !contentMounted) return;

    const persistState = () => {
      const scrollContainer = scrollContainerRef.current;
      userStorage.set('scroll_position', String(scrollContainer?.scrollTop ?? 0));
      userStorage.set('scroll_page', String(activePage));
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        persistState();
      }
    };

    window.addEventListener('beforeunload', persistState);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', persistState);
      document.removeEventListener('visibilitychange', handleVisibility);
      persistState();
    };
  }, [isClient, activePage, contentMounted]);

  useEffect(() => {
    if (currentStage !== 'content' || !isTouch || edgeHintsShownRef.current) return;
    edgeHintsShownRef.current = true;
    setShowEdgeSwipeHints(true);
    const timer = setTimeout(() => setShowEdgeSwipeHints(false), 4500);
    return () => clearTimeout(timer);
  }, [currentStage, isTouch]);

  // --- SCROLL OBSERVER ---
  // ULTRA-OPTIMIZED: Debounced intersection observer to prevent excessive updates
  useEffect(() => {
    if(currentStage !== 'content') return;

    const isMobile = window.innerWidth < 768;
    let debounceTimer: NodeJS.Timeout | null = null;

    // Multiple thresholds for more accurate detection
    const thresholds = isMobile
      ? [0.5, 0.75]  // Fewer thresholds on mobile for better performance
      : [0.5, 0.7];    // Optimized thresholds on desktop

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // PERFORMANCE: Debounce rapid intersection changes
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
          entries.forEach((entry) => {
            // Only trigger on primary threshold crossing (50%)
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              const index = pageRefs.current.indexOf(entry.target as HTMLElement);
              if (index !== -1 && index + 1 !== activePage) {
                // Use transition for smooth state updates
                startTransition(() => {
                  setActivePage(index + 1);
                  setParticleTrigger(prev => prev + 1);
                  // Subtle haptic feedback on page change
                  if (navigator.vibrate) navigator.vibrate(8);
                });
              }
            }
          });
        }, isMobile ? 50 : 16); // 50ms on mobile, 16ms on desktop
      },
      {
        threshold: thresholds,
        root: scrollContainerRef.current || null,
        rootMargin: isMobile ? '0px' : '-10% 0px'  // Trigger slightly before on desktop
      }
    );

    pageRefs.current.forEach((ref) => { if (ref) observerRef.current?.observe(ref); });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observerRef.current?.disconnect();
    };
  }, [currentStage, activePage]);

  const handleRef = useCallback((el: HTMLElement | null, index: number) => {
    pageRefs.current[index] = el;
    if (el && observerRef.current) observerRef.current.observe(el);
  }, []);

  // Filter pages based on performance mode (must be before navigation functions)
  const visiblePages = useMemo(() => {
    if (disableSpline) {
      // Only show TSX pages when splines are disabled
      return PAGE_CONFIG.filter(page => page.type === 'tsx');
    }
    return PAGE_CONFIG;
  }, [disableSpline]);

  // FIX #4: Improved page navigation with haptic feedback
  const scrollToPage = (index: number) => {
    const maxPages = disableSpline ? visiblePages.length : PAGE_CONFIG.length;
    if(index < 0 || index >= maxPages) return;
    setIsMobileNavOpen(false);
    playClickSound();
    if (navigator.vibrate) navigator.vibrate(10);
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // OPTIMIZED: Swipe navigation between pages
  const [swipeIndicator, setSwipeIndicator] = useState<'left' | 'right' | null>(null);

  const navigateToNextPage = useCallback(() => {
    const maxPages = disableSpline ? visiblePages.length : PAGE_CONFIG.length;
    if (activePage < maxPages) {
      playSwipe();
      scrollToPage(activePage); // activePage is 1-indexed, scrollToPage expects 0-indexed
      setSwipeIndicator('left');
      setTimeout(() => setSwipeIndicator(null), 500);
    }
  }, [activePage, disableSpline, visiblePages.length]);

  const navigateToPrevPage = useCallback(() => {
    if (activePage > 1) {
      playSwipe();
      scrollToPage(activePage - 2); // activePage is 1-indexed, scrollToPage expects 0-indexed
      setSwipeIndicator('right');
      setTimeout(() => setSwipeIndicator(null), 500);
    }
  }, [activePage]);

  // Create swipe handlers for page navigation
  const swipeHandlers = useMemo(() =>
    createSwipeHandlers({
      onSwipeLeft: navigateToNextPage,
      onSwipeRight: navigateToPrevPage,
      threshold: 80,
      velocityThreshold: 0.4,
      preventScroll: false,
    }),
    [navigateToNextPage, navigateToPrevPage]
  );

  // FIX #4: Add hold-to-switch functionality for page buttons
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  const handlePageButtonHoldStart = (index: number) => {
    setIsHolding(true);
    const timer = setTimeout(() => {
      scrollToPage(index);
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]); // Double vibration for hold action
      setIsHolding(false);
    }, 500); // 500ms hold time
    setHoldTimer(timer);
  };

  const handlePageButtonHoldEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    setIsHolding(false);
  };

  // --- MUSIC HANDLERS ---
  const safePlay = useCallback(() => {
      if (isMuted || showConfigurator || !playerRef.current) return;
      try {
          if(typeof playerRef.current.unMute === 'function') playerRef.current.unMute();
          if(typeof playerRef.current.setVolume === 'function') playerRef.current.setVolume(volume);
          if(typeof playerRef.current.playVideo === 'function') playerRef.current.playVideo();
      } catch (e) { }
  }, [isMuted, showConfigurator, volume]);

  const safePause = useCallback(() => { 
    try { 
      playerRef.current?.pauseVideo?.(); 
    } catch (e) {} 
  }, []);

  const handlePlayerReady = useCallback((player: any) => {
      playerRef.current = player;
      if (isMuted) player.mute?.();
      else { player.unMute?.(); player.setVolume?.(volume); }
      if (!isMuted && !showConfigurator) player.playVideo?.();
  }, [isMuted, showConfigurator, volume]);

  const toggleMusic = useCallback(() => {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      userStorage.set('user_is_muted', String(newMutedState));
      if (newMutedState) safePause(); else safePlay();
  }, [isMuted, safePlay, safePause]);

  // FEATURE: Auto-play music on first user interaction
  useEffect(() => {
    if (!isClient || currentStage !== 'content') return;

    const hasInteracted = sessionPrefs.get('user_has_interacted');
    if (hasInteracted) return;

    const handleFirstInteraction = () => {
      sessionPrefs.set('user_has_interacted', 'true');

      // Auto-start music if not explicitly muted
      const savedMuted = userStorage.get('user_is_muted');
      if (savedMuted !== 'true' && isMuted) {
        setTimeout(() => {
          setIsMuted(false);
          safePlay();
        }, 150);
      }
    };

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'scroll', 'keydown'];
    events.forEach(event => {
      window.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [isClient, currentStage, isMuted, safePlay]);

  const handleVolumeChange = (newVol: number) => {
      setVolume(newVol);
      userStorage.set('user_volume', newVol.toString());
      if(playerRef.current) playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) { setIsMuted(false); safePlay(); }
  };

  const handlePerformanceToggle = useCallback(() => {
      playClickSound();
      if (navigator.vibrate) navigator.vibrate(12);
      const nextDisabled = !disableSpline;
      setDisableSpline(nextDisabled);
      devicePrefs.set('spline_enabled', String(!nextDisabled));
      devicePrefs.set('spline_pref_v2', 'true');
  }, [disableSpline]);
  
  const applyPerformanceChoice = useCallback((mode: 'high' | 'balanced') => {
    if (perfPromptTimeoutRef.current) {
      window.clearTimeout(perfPromptTimeoutRef.current);
      perfPromptTimeoutRef.current = null;
    }
    const enable3D = mode === 'high';
    setDisableSpline(!enable3D);
    devicePrefs.set('spline_enabled', enable3D ? 'true' : 'false');
    devicePrefs.set('spline_pref_v2', 'true');
    devicePrefs.set('perf_choice', mode);
    setShowPerfPrompt(false);
  }, []);

  const requestControlCenterOpen = useCallback(() => {
    setControlCenterOpen(true);
  }, []);

  // --- GATING HANDLERS ---
  const handleRegisterComplete = useCallback(() => {
    userStorage.set('vip_user_registered', 'true');
    setHasRegistered(true);
    const holdShown = hasSeenHold || userStorage.get('bm_hold_seen') === 'true';
    if (holdShown) {
      setCurrentStage("content");
    } else {
      userStorage.set('bm_hold_seen', 'true');
      setHasSeenHold(true);
      setCurrentStage("hold");
    }
  }, [hasSeenHold]);
  
  const handleHoldComplete = useCallback(() => setCurrentStage("content"), []);
  
  const handleV2Complete = useCallback(() => { 
    safePlay(); 
    if (!hasSeenIntro) {
      userStorage.set('bm_intro_seen', 'true');
      setHasSeenIntro(true);
    }
    setParticleTrigger(prev => prev + 1);
    if (hasRegistered) {
      setCurrentStage("content"); 
    } else {
      setCurrentStage("register");
    }
  }, [hasRegistered, safePlay, hasSeenIntro]);

  // Safety net: auto-advance the intro loader so users never get stuck
  useEffect(() => {
    if (!isClient || currentStage !== 'v2') return;
    const timer = window.setTimeout(() => handleV2Complete(), 12000);
    return () => window.clearTimeout(timer);
  }, [isClient, currentStage, handleV2Complete]);

  useEffect(() => {
    if (!isClient || !optimizationsReady || currentStage !== 'v2') return;
    handleV2Complete();
  }, [isClient, optimizationsReady, currentStage, handleV2Complete]);

  // Ask user for device capability to adapt 3D loading (auto-select after timeout/skip)
  useEffect(() => {
    if (!isClient) return;

    const savedChoice = devicePrefs.get('perf_choice');
    if (currentStage !== 'content') {
      setShowPerfPrompt(false);
      if (perfPromptTimeoutRef.current) {
        window.clearTimeout(perfPromptTimeoutRef.current);
        perfPromptTimeoutRef.current = null;
      }
      return;
    }

    if (savedChoice) return;

    setShowPerfPrompt(true);
    if (perfPromptTimeoutRef.current) {
      window.clearTimeout(perfPromptTimeoutRef.current);
    }
    perfPromptTimeoutRef.current = window.setTimeout(() => {
      applyPerformanceChoice(defaultPerfMode);
    }, 8000);

    return () => {
      if (perfPromptTimeoutRef.current) {
        window.clearTimeout(perfPromptTimeoutRef.current);
        perfPromptTimeoutRef.current = null;
      }
    };
  }, [isClient, currentStage, applyPerformanceChoice, defaultPerfMode]);
   
  const handleThemeChange = useCallback((themeId: string, sound: SoundProfile, muted: boolean) => {
    console.log('[Theme] Changing theme to:', themeId, 'muted:', muted);
    setActiveThemeId(themeId);
    setIsMuted(muted);
    // Use smart storage for better WebView compatibility
    userStorage.set('user_theme_id', themeId);
    userStorage.set('user_is_muted', String(muted));
    setShowConfigurator(false);
    setParticleTrigger(prev => prev + 1);
    // Force music player reload with new theme
    setMusicKey(prev => prev + 1);

    // If not muted, play the new theme's music
    if (!muted) {
      setTimeout(() => {
        safePlay();
      }, 100);
    }
  }, [safePlay]);

  const handleQuickThemeChange = useCallback((themeId: string) => {
    console.log('[Theme] Quick changing theme to:', themeId);
    setActiveThemeId(themeId);
    // Use smart storage for better WebView compatibility
    userStorage.set('user_theme_id', themeId);
    setParticleTrigger(prev => prev + 1);
    // Force music player reload with new theme
    setMusicKey(prev => prev + 1);

    // If not muted, play the new theme's music
    if (!isMuted) {
      setTimeout(() => {
        safePlay();
      }, 100);
    }
    playClickSound();
  }, [isMuted, safePlay]);

  const heroLoaderMessage = deviceProfile.isMobile ? 'Mobile-friendly hero warming' : 'Cinematic hero loading';
  const showHeroLoaderOverlay = currentStage === 'content' && !heroSceneReady && !heroLoaderHidden;
  const handleHeroReady = useCallback(() => {
    setHeroSceneReady(true);
    setHeroLoaderHidden(true);
  }, []);

  const splinesEnabled = !disableSpline;
  const useCrashSafeSpline = isSafeMode || isTouch || isSafari || deviceProfile.prefersReducedData;
  const forceLiteSpline = isSafari || deviceProfile.prefersReducedData;
  const eagerRenderSplines = splinesEnabled && deviceProfile.isHighEndDevice && !deviceProfile.prefersReducedData && !isSafeMode;
  const shouldRenderContent = currentStage === 'content' || contentMounted;

  if (!isClient) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      {shouldRenderContent && (
        <BackgroundMusicSystem
          themeId={activeThemeId}
          onReady={handlePlayerReady}
          volume={volume}
          trackKey={musicKey}
        />
      )}
      {shouldRenderContent && !isSafeMode && !deviceProfile.prefersReducedMotion && deviceProfile.isHighEndDevice && <ParticleEffect trigger={particleTrigger} />}
      {shouldRenderContent && !deviceProfile.isMobile && !deviceProfile.prefersReducedMotion && !isTouch && !isSafari && (
        <CustomCursor accentColor={accentColor} />
      )}

      {/* Quick Theme Picker */}
      {/* FIX #3: Add swipe-to-close to Quick Theme Picker */}
      {showThemeQuickPick && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-hidden"
          style={{
            zIndex: UI_LAYERS.THEME_PICKER,
            maxWidth: '100vw',
            maxHeight: '100dvh'
          }}
          onClick={() => {
            playClick();
            setShowThemeQuickPick(false);
          }}
          onDoubleClick={() => setShowThemeQuickPick(false)}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._swipeStartY = touch.clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._swipeStartY;
            if (startY) {
              const endY = e.changedTouches[0].clientY;
              if (Math.abs(endY - startY) > 120) {
                playSwipe();
                setShowThemeQuickPick(false);
              }
            }
          }}
        >
          <div className="max-w-4xl w-full max-h-[min(80vh,calc(100dvh-2rem))] overflow-y-auto bg-black/80 rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Quick Theme Switch</h2>
              <button 
                onClick={() => {
                  playClick();
                  setShowThemeQuickPick(false);
                }} 
                onDoubleClick={() => setShowThemeQuickPick(false)} 
                onMouseEnter={() => playHover()}
                className="text-white/50 hover:text-white p-2"
                aria-label="Close quick theme picker"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {ALL_THEMES.filter(t => t.status === 'AVAILABLE').slice(0, 16).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => {
                    handleQuickThemeChange(theme.id);
                    setShowThemeQuickPick(false);
                  }}
                  className={`p-3 sm:p-4 rounded-xl border transition-all hover:scale-105 active:scale-95 min-h-[60px] ${
                    theme.id === activeThemeId
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={{
                    filter: theme.filter,
                    WebkitFilter: theme.filter,
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div className="text-xs sm:text-sm font-bold text-white mb-1 break-words">{theme.name}</div>
                  <div className="text-[9px] sm:text-[10px] text-white/60 break-words">{theme.category}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- INFO PANEL --- */}
      {shouldRenderContent && (
        <InfoPanel
          config={PAGE_CONFIG[activePage - 1]}
          isOpen={infoPanelOpen}
          onClose={() => setInfoPanelOpen(false)}
          accentColor={accentColor}
        />
      )}

      {/* FIX #10: Add edge peeker for Info Panel (left edge) */}
      {!infoPanelOpen && currentStage === 'content' && (
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 w-1 h-32 bg-gradient-to-r from-blue-500/50 to-transparent cursor-pointer hover:w-2 transition-all"
          style={{ zIndex: UI_LAYERS.INFO_PEEKER, background: `linear-gradient(to right, ${accentColor}80, transparent)` }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._swipeStartX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._swipeStartX;
            if (startX !== undefined && startX < 50) {
              const endX = e.changedTouches[0].clientX;
              if (endX - startX > 50) {
                playSwipe();
                setInfoPanelOpen(true);
              }
            }
          }}
          onClick={() => {
            playClick();
            setInfoPanelOpen(true);
          }}
          onMouseEnter={() => playHover()}
        >
          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <Info size={12} className="text-white" />
          </div>
        </div>
      )}
      
      {/* --- FAQ OVERLAY --- */}
      {/* FIX #3: Add swipe-to-close to FAQ overlay */}
      {faqOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden"
          style={{
            zIndex: UI_LAYERS.FAQ_OVERLAY,
            maxWidth: '100vw',
            maxHeight: '100dvh'
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._swipeStartY = touch.clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._swipeStartY;
            if (startY) {
              const endY = e.changedTouches[0].clientY;
              if (Math.abs(endY - startY) > 100) {
                setFaqOpen(false);
                if (navigator.vibrate) navigator.vibrate(15);
              }
            }
          }}
        >
          <div className="relative w-full max-w-5xl max-h-[min(90vh,calc(100dvh-2rem))] overflow-hidden">
            <button
              onClick={() => {
                playClick();
                if (navigator.vibrate) navigator.vibrate(10);
                setFaqOpen(false);
              }}
              onDoubleClick={() => setFaqOpen(false)}
              onTouchStart={(e) => {
                playHover();
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = '';
              }}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label="Close FAQ"
            >
              <X size={22} />
            </button>
            <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-black/80 shadow-[0_10px_60px_rgba(0,0,0,0.5)] overflow-y-auto max-h-full">
              <InlineFaq />
            </div>
          </div>
        </div>
      )}

      {/* Progress bar showing scroll position through all pages */}
      {currentStage === 'content' && (
        <div
          className="fixed top-0 left-0 right-0 h-1 sm:h-1.5 md:h-2 bg-black/50 pointer-events-none overflow-hidden"
          style={{
            zIndex: UI_LAYERS.PROGRESS_BAR,
            top: 'env(safe-area-inset-top, 0px)',
            maxWidth: '100vw'
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${visiblePages.length > 1 ? ((activePage - 1) / (visiblePages.length - 1)) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* --- SWIPEABLE CONTROL CENTER --- */}
      {currentStage === 'content' && (
        <SwipeablePanel
          title="Control Center"
          icon={<Layers size={20} />}
          position="bottom"
          defaultOpen={false}
          open={controlCenterOpen}
          accentColor={accentColor}
          maxHeight="min(70vh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)))"
          minHeight="28px"
          zIndex={UI_LAYERS.PANELS_BOTTOM}
          onOpenChange={(isOpen) => setControlCenterOpen(isOpen)}
        >
          <div className="space-y-6">
            {/* Theme */}
            <div ref={controlCenterThemeRef} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SunMoon size={18} style={{ color: accentColor }} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-[10px] uppercase tracking-[0.35em] text-white/60">Theme</span>
                    <span className="text-sm font-semibold text-white">Light / Night</span>
                  </div>
                </div>
                <button
                  onClick={toggleColorMode}
                  className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold text-white/80 hover:bg-black/50 transition-colors active:scale-95"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {colorMode === 'dark' ? 'Night' : 'Light'}
                </button>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Switch the UI shell (persists). Use Themes below for scene styling.
              </p>
            </div>

            {/* Device Status */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                {deviceProfile.isMobile ? <Smartphone size={18} style={{ color: accentColor }} /> : <Monitor size={18} style={{ color: accentColor }} />}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/60">Device Mode</span>
                <span className="text-sm font-semibold text-white">{deviceProfile.isMobile ? 'Mobile Balanced' : 'Desktop Fidelity'}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={(e) => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate(10);
                  const isDouble = (e?.detail ?? 1) >= 2;
                  if (showConfigurator || isDouble) {
                    setShowConfigurator(false);
                    return;
                  }
                  setControlCenterOpen(false);
                  setShowConfigurator(true);
                  setParticleTrigger(prev => prev + 1);
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Palette size={24} style={{ color: accentColor }} />
                <span className="text-xs text-white/80">Themes</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate(12);
                  handlePerformanceToggle();
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all active:scale-95 ${
                  disableSpline
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Zap size={24} style={{ color: disableSpline ? accentColor : '#fff' }} />
                <span className={`text-xs ${disableSpline ? 'text-black' : 'text-white/80'}`}>
                  {disableSpline ? 'Full 3D' : 'Performance'}
                </span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate(10);
                  toggleMusic();
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all active:scale-95"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  backgroundColor: isPlaying ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                  borderColor: isPlaying ? `${accentColor}55` : 'rgba(255,255,255,0.1)',
                }}
              >
                {isPlaying ? (volume > 50 ? <Volume2 size={24} style={{ color: accentColor }} /> : <Volume1 size={24} style={{ color: accentColor }} />) : <VolumeX size={24} className="text-white/80" />}
                <span className="text-xs text-white/80">Audio</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate(10);
                  setInfoPanelOpen((prev) => !prev);
                }}
                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {infoPanelOpen ? <Unlock size={18} className="text-green-400" /> : <Lock size={18} className="text-blue-400" />}
                <span className="text-xs text-white/80">{infoPanelOpen ? 'Close Info' : 'Page Info'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate(10);
                  setFaqOpen((prev) => !prev);
                }}
                className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Info size={18} style={{ color: accentColor }} />
                <span className="text-xs text-white/80">{faqOpen ? 'Close Help' : 'Help'}</span>
              </button>
            </div>

            {/* Volume Control */}
            {isPlaying && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/60">Volume</span>
                  <span className="text-xs font-semibold text-white">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${volume}%, rgba(255,255,255,0.1) ${volume}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
              </div>
            )}

            {/* Theme Info */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-white/60">Active Theme</span>
                  <p className="text-sm font-semibold text-white">{activeTheme.name}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg border-2"
                  style={{
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}20`
                  }}
                />
              </div>
            </div>

            {/* Support Section */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}55` }}>
                  <MessageCircle className="w-7 h-7" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Support</p>
                  <p className="text-lg font-semibold text-white">Need Help?</p>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Our support team is standing by so you can stay focused on the markets.
              </p>
              <a
                href="https://t.me/+dlP_A0ebMXs3NTg0"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate([15, 5, 15]);
                }}
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: accentColor,
                  color: '#000',
                  boxShadow: `0 8px 24px ${accentColor}40`
                }}
              >
                <MessageCircle size={20} />
                <span>Open Telegram Support</span>
                <ChevronRight size={20} />
              </a>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="text-[10px] text-white/60 mb-1">Response Time</div>
                  <div className="text-sm font-semibold text-white">~5 minutes</div>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                  <div className="text-[10px] text-white/60 mb-1">Availability</div>
                  <div className="text-sm font-semibold text-white">24/7</div>
                </div>
              </div>
            </div>
          </div>
        </SwipeablePanel>
      )}

      {/* --- LAYER 2: CONFIGURATOR --- */}
      {/* FIX #3: Add swipe-to-close to Theme Configurator */}
      {showConfigurator && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          style={{ zIndex: UI_LAYERS.MODAL_BACKDROP }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._swipeStartY = touch.clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._swipeStartY;
            if (startY) {
              const endY = e.changedTouches[0].clientY;
              if (Math.abs(endY - startY) > 100) {
                setShowConfigurator(false);
                if (navigator.vibrate) navigator.vibrate(15);
              }
            }
          }}
        >
            <div className="relative w-full max-w-6xl h-[80vh] bg-[#020617] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    if (navigator.vibrate) navigator.vibrate(10);
                    setShowConfigurator(false);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setShowConfigurator(false);
                  }}
                  onTouchStart={(e) => {
                    playHover();
                    e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                  className="absolute top-6 right-6 z-[10] p-2 text-white/50 hover:text-white transition-all hover-lift min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                    <X size={28} />
                </button>
                {/* @ts-ignore */}
                <FixedThemeConfigurator initialThemeId={activeThemeId} onThemeChange={handleThemeChange} />
            </div>
        </div>
      )}

      {/* --- LAYER 3: GLOBAL THEME LENS (OPTIMIZED FOR PERFORMANCE) --- */}
      {/* PERFORMANCE: Removed backdrop-filter entirely for better mobile stability and 60fps */}
      {/* Theme effects applied directly to content instead of as overlay */}
      <div
        className="fixed inset-0 pointer-events-none w-screen h-screen"
        style={{
          zIndex: UI_LAYERS.SCROLL_INDICATOR,
          opacity: 0,
          pointerEvents: 'none'
        }}
      />

      {/* --- LAYER 4: LOADING / GATING SCREENS --- */}
      {currentStage === "register" && (
         <div className="fixed inset-0 bg-black" style={{ zIndex: UI_LAYERS.THEME_LENS, filter: activeTheme.filter, WebkitFilter: activeTheme.filter, transform: 'translateZ(0)' }}>
             {/* @ts-ignore */}
             <RegisterPage onUnlock={handleRegisterComplete} theme={activeTheme} />
         </div>
      )}
      {currentStage === "hold" && (
         <div className="fixed inset-0" style={{ zIndex: UI_LAYERS.THEME_LENS, filter: activeTheme.filter, WebkitFilter: activeTheme.filter, transform: 'translateZ(0)' }}>
             {/* @ts-ignore */}
             <BullMoneyGate onUnlock={handleHoldComplete} theme={activeTheme}><></></BullMoneyGate>
         </div>
      )}
      {currentStage === "v2" && (
         <div className="fixed inset-0" style={{ zIndex: UI_LAYERS.THEME_LENS, filter: activeTheme.filter, WebkitFilter: activeTheme.filter, transform: 'translateZ(0)' }}>
             {/* @ts-ignore */}
             <MultiStepLoaderV2 onFinished={handleV2Complete} theme={activeTheme} />
         </div>
      )}

      {showHeroLoaderOverlay && (
        <HeroLoaderOverlay
          visible={showHeroLoaderOverlay}
          message={heroLoaderMessage}
          accentColor={accentColor}
        />
      )}

      {/* Device capability prompt for adaptable spline */}
      {showPerfPrompt && currentStage === 'content' && (
        <div
          className="fixed inset-0 flex items-center justify-center px-4"
          style={{ zIndex: UI_LAYERS.MODAL_BACKDROP + 5, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
          onClick={() => applyPerformanceChoice(defaultPerfMode)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-black/85 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs uppercase tracking-[0.35em] text-white/60">Adaptive 3D</div>
              <span className="text-[11px] text-white/50">Auto picks if you skip</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Is your device high-end?</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Choose full 3D for cinematic visuals or stay in performance mode. If you do nothing, we’ll auto-select based on your device.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => applyPerformanceChoice('high')}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white font-semibold hover:border-blue-400 hover:bg-white/15 transition-all"
                style={{ boxShadow: `0 10px 40px ${accentColor}30` }}
              >
                High-end (Full 3D)
              </button>
              <button
                onClick={() => applyPerformanceChoice('balanced')}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white font-semibold hover:border-blue-300 hover:bg-white/10 transition-all"
              >
                Balanced (Performance)
              </button>
              <button
                onClick={() => applyPerformanceChoice(defaultPerfMode)}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white/80 font-semibold hover:text-white hover:border-white/20 transition-all"
              >
                Skip (Auto pick)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LAYER 5: NAVBAR WITH CONTROLS --- */}
      {currentStage === 'content' && (
        <div style={{ zIndex: UI_LAYERS.NAVBAR }}>
          <Navbar
            setShowConfigurator={setShowConfigurator}
            activeThemeId={activeThemeId}
            accentColor={accentColor}
            onThemeChange={handleQuickThemeChange}
            isMuted={isMuted}
            onMuteToggle={toggleMusic}
            disableSpline={disableSpline}
            onPerformanceToggle={handlePerformanceToggle}
            infoPanelOpen={infoPanelOpen}
            onInfoToggle={() => setInfoPanelOpen((prev) => !prev)}
            onFaqClick={() => setFaqOpen(true)}
            onControlCenterToggle={() => setControlCenterOpen((prev) => !prev)}
          />
        </div>
      )}


      {/* --- LAYER 6: MAIN CONTENT (3D SCROLL LAYOUT) --- */}
      {shouldRenderContent && (
        <div className={currentStage === 'content' ? 'w-full h-[100dvh] relative' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}>
        {!isTouch && <TargetCursor spinDuration={2} hideDefaultCursor={false} targetSelector=".cursor-target, a, button" />}

        {/* FIX: Fixed UI must NOT live inside a transformed/scrolling container on iOS (breaks taps + fixed positioning) */}
        {/* UNIFIED NAVIGATION - PERMANENTLY DISABLED - Using VerticalPageScroll instead */}
        {/* Bottom page navigation removed to prevent duplicate scroll viewers */}
        {/* <UnifiedNavigation
          currentPage={activePage}
          totalPages={visiblePages.length}
          pages={visiblePages}
          onPageChange={scrollToPage}
          accentColor={accentColor}
          disabled={currentStage !== 'content'}
        /> */}

        {/* UNIFIED CONTROLS - HIDDEN (Controls moved to Navbar) */}
        {/* Keeping this component but hidden for backward compatibility */}
        <div className="hidden">
          <UnifiedControls
            isMuted={isMuted}
            onMuteToggle={toggleMusic}
            disableSpline={disableSpline}
            onPerformanceToggle={handlePerformanceToggle}
            infoPanelOpen={infoPanelOpen}
            onInfoToggle={() => setInfoPanelOpen((prev) => !prev)}
            onFaqClick={() => setFaqOpen((prev) => !prev)}
            onThemePanelOpen={() => {
              setControlCenterOpen(true);
              window.setTimeout(() => controlCenterThemeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
            }}
            onControlCenterToggle={() => setControlCenterOpen((prev) => !prev)}
            onSettingsClick={toggleColorMode}
            isMobile={deviceProfile.isMobile || isTouch}
            controlCenterOpen={controlCenterOpen}
            accentColor={accentColor}
            disabled={currentStage !== 'content'}
          />
        </div>

        {/* VERTICAL PAGE SCROLL - Right side scroll UI */}
        <VerticalPageScroll
          currentPage={activePage}
          totalPages={visiblePages.length}
          onPageChange={scrollToPage}
          accentColor={accentColor}
          disabled={currentStage !== 'content'}
        />

        {/* 3D HINT ICON - Glowing hint for 3D controls */}
        <ThreeDHintIcon
          onClick={() => setControlCenterOpen(true)}
          accentColor={accentColor}
          disableSpline={disableSpline}
          showHint={!hasSeenIntro}
        />

        {/* --- SCROLL CONTAINER --- */}
        <main
          ref={scrollContainerRef}
          data-scroll-container
          className={`profit-reveal w-full h-full flex flex-col overflow-y-scroll overflow-x-hidden unified-scroll ${isTouch ? 'touch-device' : 'non-touch-device snap-y snap-mandatory scroll-smooth'} bg-black no-scrollbar text-white relative`}
          onTouchStart={swipeHandlers.onTouchStart}
          onTouchMove={swipeHandlers.onTouchMove}
          onTouchEnd={swipeHandlers.onTouchEnd}
          onMouseDown={swipeHandlers.onMouseDown}
          onMouseMove={swipeHandlers.onMouseMove}
          onMouseUp={swipeHandlers.onMouseUp}
          style={{
            WebkitOverflowScrolling: 'touch',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'pan-y',
            maxWidth: '100vw',
            maxHeight: '100dvh',
          }}
        >
            
            {showOrientationWarning && (
              <OrientationOverlay 
                onDismiss={handleOrientationDismiss} 
              />
            )}

            {/* INFO MODAL (Legacy - kept for compatibility) */}
            <div
              className={`fixed inset-0 flex items-center justify-center px-4 transition-all duration-300 ${!!modalData ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              style={{ zIndex: UI_LAYERS.MODAL_CONTENT }}
            >
                <div 
                  className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                  onClick={() => setModalData(null)} 
                />
                {modalData && (
                    <div className="relative w-full max-w-lg bg-black/90 border border-blue-500/30 rounded-xl p-8 shadow-[0_0_50px_rgba(0,100,255,0.2)] scale-100">
                        <button 
                          onClick={() => {
                            playClickSound();
                            setModalData(null);
                          }} 
                          className="absolute top-4 right-4 text-white/50 hover:text-white hover-lift"
                        >
                          <X size={24} />
                        </button>
                        
                        <h3 className="text-blue-400 text-sm font-mono tracking-widest mb-2">
                          PAGE {String(modalData.id).padStart(2, '0')} ANALYSIS
                        </h3>
                        <h2 className="text-3xl font-bold text-white mb-6">{modalData.infoTitle}</h2>
                        <p className="text-white/80 leading-relaxed text-lg font-light">{modalData.infoDesc}</p>
                    </div>
                )}
            </div>

            {/* SCROLL PAGES */}
            {visiblePages.map((page) => (
                <React.Fragment key={page.id}>
                {page.type === 'split' ? (
                    <DraggableSplitSection
                      config={page}
                      activePage={activePage}
                      onVisible={handleRef}
                      parallaxOffset={parallaxOffset}
                      disableSpline={disableSpline}
                      useCrashSafeSpline={useCrashSafeSpline}
                      forceLiteSpline={forceLiteSpline}
                      eagerRenderSplines={eagerRenderSplines}
                      deviceProfile={deviceProfile}
                    />
                ) : (
                    <FullScreenSection
                      config={page}
                      activePage={activePage}
                      onVisible={handleRef}
                      parallaxOffset={parallaxOffset}
                      disableSpline={disableSpline}
                      useCrashSafeSpline={useCrashSafeSpline}
                      forceLiteSpline={forceLiteSpline}
                      eagerRenderSplines={eagerRenderSplines}
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

        {/* Mobile Scroll Indicator - DISABLED to prevent duplicate scrollbars */}
        {/* The VerticalPageScroll component handles all scrolling UI */}
        {/* <MobileScrollIndicator
          scrollContainerRef={scrollContainerRef}
          accentColor={accentColor}
          position="right"
          showOnDesktop={false}
        /> */}

        {/* SWIPE NAVIGATION INDICATORS */}
        {showEdgeSwipeHints && (
          <>
            <div
              className="fixed left-0 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ zIndex: UI_LAYERS.NAV_ARROWS, color: accentColor }}
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-r-full bg-black/60 border border-white/10 backdrop-blur animate-pulse">
                <ChevronRight size={18} />
                <span className="text-[10px] font-mono tracking-widest text-white/70">SWIPE</span>
              </div>
            </div>
            <div
              className="fixed right-0 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ zIndex: UI_LAYERS.NAV_ARROWS, color: accentColor }}
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-l-full bg-black/60 border border-white/10 backdrop-blur animate-pulse">
                <span className="text-[10px] font-mono tracking-widest text-white/70">SWIPE</span>
                <ChevronLeft size={18} />
              </div>
            </div>
          </>
        )}
        {swipeIndicator && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center" style={{ zIndex: UI_LAYERS.MODAL_BACKDROP }}>
            <div
              className={`text-white/40 text-6xl font-bold animate-pulse transition-all duration-300 ${
                swipeIndicator === 'left' ? 'animate-slideOutLeft' : 'animate-slideOutRight'
              }`}
              style={{ textShadow: `0 0 20px ${accentColor}` }}
            >
              {swipeIndicator === 'left' ? <ChevronLeft size={80} /> : <ChevronRight size={80} />}
            </div>
          </div>
        )}

        {/* SWIPE HELPER - Shows on first load */}
        {currentStage === 'content' && activePage === 1 && visiblePages.length > 1 && (
          <div className="hidden md:block fixed bottom-32 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce" style={{ zIndex: UI_LAYERS.CONTENT }}>
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20">
            <ChevronLeft size={16} className="text-white/60" />
            <span className="text-xs text-white/60 font-medium">
              {disableSpline ? 'Navigate static pages' : 'Swipe to navigate'}
            </span>
            <ChevronRight size={16} className="text-white/60" />
          </div>
        </div>
        )}
      </div>
      )}
    </>
  );
}
