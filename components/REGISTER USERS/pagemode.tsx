"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import { gsap } from 'gsap';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Dynamic import for Spline component (used for local .splinecode files)
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});
import { trackEvent, BullMoneyAnalytics } from '@/lib/analytics';
import {
  Check, Mail, Hash, Lock,
  ArrowRight, ChevronLeft, ExternalLink, AlertCircle,
  Copy, Plus, Eye, EyeOff, FolderPlus, Loader2, ShieldCheck, Clock, User, Send, Sparkles
} from 'lucide-react';

import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { persistSession } from '@/lib/sessionPersistence';

// --- THERMAL OPTIMIZATION (prevent phone overheating) ---
import { getGlobalThermalState } from '@/hooks/useThermalOptimization';

// --- UNIFIED SHIMMER SYSTEM ---
import { ShimmerLine, ShimmerBorder, ShimmerSpinner, ShimmerRadialGlow } from '@/components/ui/UnifiedShimmer';

// --- UI STATE CONTEXT ---
import { useUIState, UI_Z_INDEX } from "@/contexts/UIStateContext";
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// --- IMPORT SEPARATE LOADER COMPONENT ---
const MultiStepLoader = dynamic(() => import("@/components/Mainpage/MultiStepLoader").then(m => ({ default: m.MultiStepLoader })), { ssr: false, loading: () => null });
const TelegramConfirmationResponsive = dynamic(() => import("./TelegramConfirmationResponsive").then(m => ({ default: m.TelegramConfirmationResponsive })), { ssr: false, loading: () => null });

// --- IMPORT LEGAL DISCLAIMER MODAL ---
const LegalDisclaimerModal = dynamic(() => import("@/components/Mainpage/footer/LegalDisclaimerModal").then(m => ({ default: m.LegalDisclaimerModal })), { ssr: false, loading: () => null });

// --- DESKTOP WELCOME SCREEN (separate layout for larger screens) ---
const WelcomeScreenDesktop = dynamic(() => import("./WelcomeScreenDesktop").then(m => ({ default: m.WelcomeScreenDesktop })), { ssr: false, loading: () => null });

// --- ULTIMATE HUB COMPONENTS (for mobile welcome screen to match desktop) ---
const UnifiedFpsPill = dynamic(() => import('@/components/ultimate-hub/pills/UnifiedFpsPill').then(m => ({ default: m.UnifiedFpsPill })), { ssr: false, loading: () => null });
const UnifiedHubPanel = dynamic(() => import('@/components/ultimate-hub/panel/UnifiedHubPanel').then(m => ({ default: m.UnifiedHubPanel })), { ssr: false, loading: () => null });
import { useLivePrices } from '@/components/ultimate-hub/hooks/useAccess';
import { createPortal } from 'react-dom';

// Available Spline scenes - scene1 is preloaded in layout.tsx for fastest first load
const SPLINE_SCENES = ['/scene1.splinecode', '/scene.splinecode', '/scene2.splinecode', '/scene4.splinecode', '/scene5.splinecode', '/scene6.splinecode'];

type RuntimeProfile = {
  isIOS: boolean;
  isSafari: boolean;
  isInAppBrowser: boolean;
  isWebView: boolean;
  isOldAndroid: boolean;
  isLowRAM: boolean;
  isLowCPU: boolean;
  isLowMemory: boolean;
  deviceMemory?: number;
};

const getRuntimeProfile = (): RuntimeProfile => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isSafari: false,
      isInAppBrowser: false,
      isWebView: false,
      isOldAndroid: false,
      isLowRAM: true,
      isLowCPU: true,
      isLowMemory: true,
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios/.test(ua);
  const isInAppBrowser = /fban|fbav|instagram|twitter|linkedin|snapchat|tiktok|wechat|line|telegram/i.test(ua);
  const isWebView = /wv|webview|; wv\)|instagram|fb_iab|line\//i.test(ua) || (isIOS && !isSafari && !/crios|fxios|edgios/.test(ua));
  const isOldAndroid = /android [1-7]\./i.test(ua);

  const rawDeviceMemory = (navigator as any).deviceMemory;
  const deviceMemory = typeof rawDeviceMemory === 'number' ? rawDeviceMemory : undefined;
  const isLowRAM = deviceMemory !== undefined ? deviceMemory <= 4 : isIOS;

  const hardwareConcurrency = navigator.hardwareConcurrency;
  const isLowCPU = hardwareConcurrency !== undefined && hardwareConcurrency < 4;

  return {
    isIOS,
    isSafari,
    isInAppBrowser,
    isWebView,
    isOldAndroid,
    isLowRAM,
    isLowCPU,
    isLowMemory: isLowRAM || isLowCPU || isOldAndroid,
    deviceMemory,
  };
};

// Detect low memory / constrained environments
const isLowMemoryDevice = (): boolean => {
  const profile = getRuntimeProfile();
  return (
    (profile.isIOS && profile.isSafari) ||
    profile.isInAppBrowser ||
    profile.isWebView ||
    profile.isLowMemory
  );
};

// =============================================================================
// THERMAL-AWARE QUALITY HELPERS (prevent phone overheating)
// Everything ALWAYS renders - just at reduced quality when device is hot
// =============================================================================
function getThermalQualityMultiplier(): number {
  const state = getGlobalThermalState();
  if (!state.isPageVisible) return 0.3;
  switch (state.thermalLevel) {
    case 'critical': return 0.4;
    case 'hot': return 0.6;
    case 'warm': return 0.8;
    default: return 1.0;
  }
}

// --- SIMPLE SPLINE BACKGROUND COMPONENT (MOBILE) ---
// Preloaded scene, interactive, loads fast - z-index 0 so menus overlay properly
// THERMAL-AWARE: Reduces canvas quality when device is hot
const WelcomeSplineBackground = memo(function WelcomeSplineBackground() {
  const runtimeProfile = useMemo(() => getRuntimeProfile(), []);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const splineRef = useRef<any>(null);
  const retryTimeoutRef = useRef<number | null>(null);

  const scene = SPLINE_SCENES[sceneIndex] || SPLINE_SCENES[0];
  const maxRetries = runtimeProfile.isLowMemory ? 5 : 4;
  const retryDelayMs = runtimeProfile.isLowMemory ? 700 : 450;
  const loadTimeoutMs = runtimeProfile.isLowMemory ? 12000 : 9000;
  
  const scheduleRetry = useCallback((reason: 'timeout' | 'error' | 'visibility' | 'contextlost') => {
    if (retryCount >= maxRetries) {
      setLoadTimeout(true);
      return;
    }

    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    retryTimeoutRef.current = window.setTimeout(() => {
      console.warn(`[WelcomeSpline] Retry #${retryCount + 1} (${reason})`);
      setRetryCount((count) => count + 1);
      setRetryKey((key) => key + 1);
      setSceneIndex((index) => (index + 1) % SPLINE_SCENES.length);
      setHasError(false);
      setLoadTimeout(false);
      setIsLoaded(false);
    }, retryDelayMs);
  }, [maxRetries, retryCount, retryDelayMs]);

  // Preload Spline runtime + scene for faster first paint and reliable reloads
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('@splinetool/react-spline').catch(() => undefined);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = scene;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    const controller = new AbortController();
    fetch(scene, { cache: 'force-cache', signal: controller.signal }).catch(() => undefined);

    return () => {
      controller.abort();
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [scene]);

  // Timeout fallback - if Spline doesn't load in time, rotate scene and retry
  useEffect(() => {
    if (isLoaded) return;

    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.warn('[WelcomeSpline] Load timeout - showing fallback');
        setLoadTimeout(true);
        scheduleRetry('timeout');
      }
    }, loadTimeoutMs);

    return () => clearTimeout(timer);
  }, [isLoaded, loadTimeoutMs, scheduleRetry]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !isLoaded) {
        scheduleRetry('visibility');
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isLoaded, scheduleRetry]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const canvas = document.querySelector('.welcome-spline-canvas-host canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setIsLoaded(false);
      setHasError(true);
      scheduleRetry('contextlost');
    };

    canvas.addEventListener('webglcontextlost', onContextLost, false);
    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost, false);
    };
  }, [isLoaded, retryKey, scheduleRetry]);

  const handleLoad = useCallback((splineApp: any) => {
    splineRef.current = splineApp;
    setIsLoaded(true);
    setHasError(false);
    setLoadTimeout(false);
    
    // THERMAL-AWARE: Reduce canvas resolution based on device heat
    // Always renders but at reduced quality when device is warm/hot
    if (splineApp) {
      try {
        const canvas = splineApp.canvas as HTMLCanvasElement | undefined;
        if (canvas) {
          const thermalMultiplier = getThermalQualityMultiplier();
          const baseFactor = runtimeProfile.isLowMemory ? 0.5 : 0.7;
          const scaleFactor = Math.max(0.3, baseFactor * thermalMultiplier);
          const w = Math.round(canvas.clientWidth * scaleFactor);
          const h = Math.round(canvas.clientHeight * scaleFactor);
          splineApp.setSize(w, h);
          console.log(`[WelcomeSpline] Thermal-adjusted canvas to ${w}x${h} (${Math.round(scaleFactor * 100)}% quality)`);
        }
      } catch (e) {
        console.warn('[WelcomeSpline] Could not reduce canvas size:', e);
      }
    }
  }, [runtimeProfile.isLowMemory]);

  const handleError = useCallback((error: any) => {
    console.error('[WelcomeSpline] Load error:', error);
    setHasError(true);
    scheduleRetry('error');
  }, [scheduleRetry]);

  // Show animated gradient fallback if Spline fails or times out
  const showFallback = hasError || (!isLoaded && loadTimeout);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{
        zIndex: 0,
        touchAction: 'pan-y pinch-zoom',
        backgroundColor: '#000',
      }}
    >
      {/* CSS animated background — visible while Spline loads/retries, fades when Spline is ready */}
      <style>{`
        @keyframes welcomeBgDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(2%, -3%) scale(1.05); }
          66% { transform: translate(-2%, 2%) scale(1.02); }
        }
        @keyframes welcomeBgPulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.55; }
        }
        @keyframes welcomeBgSweep {
          0% { transform: translateX(-100%) rotate(-15deg); }
          100% { transform: translateX(200%) rotate(-15deg); }
        }
      `}</style>
      {/* Layered ambient gradients */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 40% 30%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 50%, transparent 80%)',
          opacity: isLoaded ? 0.15 : 1,
          transition: 'opacity 600ms ease-out',
          animation: 'welcomeBgDrift 12s ease-in-out infinite',
          willChange: 'transform',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 70% 75%, rgba(255,255,255,0.12) 0%, transparent 60%)',
          opacity: isLoaded ? 0.1 : 1,
          transition: 'opacity 600ms ease-out',
          animation: 'welcomeBgDrift 16s ease-in-out infinite reverse',
        }}
      />
      {/* Animated glow pulse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.2) 0%, transparent 55%)',
          animation: 'welcomeBgPulse 5s ease-in-out infinite',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 600ms ease-out',
        }}
      />
      {/* Light sweep — visible while Spline is loading or failed */}
      {(showFallback || !isLoaded) && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ opacity: 0.08 }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              animation: 'welcomeBgSweep 8s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Spline — always rendered on all devices including low-memory */}
      <div
        className="absolute inset-0 welcome-spline-canvas-host"
      >
        <Spline
          key={`welcome-spline-${retryKey}`}
          scene={scene}
          renderOnDemand={false}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            opacity: isLoaded ? 1 : 0.6,
            transition: 'opacity 400ms ease-out',
            willChange: 'opacity',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          } as React.CSSProperties}
        />
      </div>


    </div>
  );
});

// --- 1. SUPABASE SETUP ---
const TELEGRAM_GROUP_LINK = "https://t.me/addlist/uswKuwT2JUQ4YWI8";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ MISSING SUPABASE KEYS in .env.local file");
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// --- UTILS: MOBILE DETECTION HOOK ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isTouch && (window.innerWidth <= 768 || isMobileUA));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

// --- UTILS: DESKTOP DETECTION HOOK (for welcome screen layout) ---
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkDesktop = () => {
      // Desktop: 1024px+ width AND not a touch-primary device
      const isLargeScreen = window.innerWidth >= 1024;
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      // Consider it desktop if large screen and not a mobile user agent
      setIsDesktop(isLargeScreen && !isMobileUA);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  return isDesktop;
};

// --- 2. APPLE-STYLE ANIMATIONS & CLEAN CSS ---
const APPLE_GLOBAL_STYLES = `
  /* Apple-style smooth animations */
  @keyframes apple-fade-up {
    from { opacity: 0; transform: translateY(20px) translateZ(0); }
    to { opacity: 1; transform: translateY(0) translateZ(0); }
  }

  @keyframes apple-scale-in {
    from { opacity: 0; transform: scale(0.92) translateZ(0); }
    to { opacity: 1; transform: scale(1) translateZ(0); }
  }

  @keyframes apple-slide-in {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes apple-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }

  /* 3D Card entrance - perspective lift */
  @keyframes card-3d-enter {
    0% {
      opacity: 0;
      transform: perspective(1200px) rotateX(8deg) translateY(40px) scale(0.92);
      filter: blur(4px);
    }
    60% {
      opacity: 1;
      transform: perspective(1200px) rotateX(-2deg) translateY(-4px) scale(1.01);
      filter: blur(0px);
    }
    100% {
      opacity: 1;
      transform: perspective(1200px) rotateX(0deg) translateY(0) scale(1);
      filter: blur(0px);
    }
  }

  /* 3D Button press */
  @keyframes btn-3d-press {
    0% { transform: perspective(600px) translateZ(0) scale(1); }
    50% { transform: perspective(600px) translateZ(-8px) scale(0.97); }
    100% { transform: perspective(600px) translateZ(0) scale(1); }
  }

  /* Staggered fade-up for children */
  @keyframes stagger-fade-up {
    from { opacity: 0; transform: translateY(16px) translateZ(0); }
    to { opacity: 1; transform: translateY(0) translateZ(0); }
  }

  /* Subtle float animation */
  @keyframes subtle-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
  }

  /* Progress bar fill animation */
  @keyframes progress-segment-fill {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  /* Shimmer sweep on buttons */
  @keyframes btn-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Input focus glow pulse */
  @keyframes input-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
    50% { box-shadow: 0 0 0 4px rgba(0,0,0,0.06); }
  }

  /* Checkbox pop */
  @keyframes check-pop {
    0% { transform: scale(0.6); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  /* Apple button hover effect - 3D */
  .apple-button {
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
  }

  .apple-button:hover {
    transform: perspective(600px) translateY(-2px) translateZ(8px);
    box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.3);
  }

  .apple-button:active {
    transform: perspective(600px) translateY(0) translateZ(-4px) scale(0.98);
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.15);
    transition-duration: 0.1s;
  }

  /* Card animation - 3D entrance */
  .apple-card {
    animation: card-3d-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    transform-style: preserve-3d;
  }

  /* Text fade in */
  .apple-text-fade {
    animation: apple-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Input focus effect - 3D lift + glow */
  .apple-input {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
  }

  .apple-input:focus {
    transform: perspective(600px) translateZ(4px) scale(1.01);
    box-shadow: 0 0 0 3px rgba(0,0,0,0.06), 0 4px 16px -4px rgba(0,0,0,0.08);
    border-color: rgba(0,0,0,0.2) !important;
  }

  /* Stagger animation helpers */
  .stagger-1 { animation: stagger-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
  .stagger-2 { animation: stagger-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
  .stagger-3 { animation: stagger-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
  .stagger-4 { animation: stagger-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both; }
  .stagger-5 { animation: stagger-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both; }
  .stagger-6 { animation: stagger-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both; }

  /* 3D primary button with shimmer */
  .btn-3d-primary {
    background: linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%);
    background-size: 200% 200%;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
    position: relative;
    overflow: hidden;
  }

  .btn-3d-primary::after {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    transition: left 0.5s ease;
  }

  .btn-3d-primary:hover::after {
    left: 100%;
  }

  .btn-3d-primary:hover {
    transform: perspective(600px) translateY(-2px) translateZ(12px);
    box-shadow: 0 16px 48px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05) inset;
  }

  .btn-3d-primary:active {
    transform: perspective(600px) translateY(1px) translateZ(-4px) scale(0.97);
    transition-duration: 0.1s;
  }

  /* 3D secondary button */
  .btn-3d-secondary {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
  }

  .btn-3d-secondary:hover {
    transform: perspective(600px) translateY(-1px) translateZ(6px);
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.12);
    border-color: rgba(0,0,0,0.2) !important;
  }

  .btn-3d-secondary:active {
    transform: perspective(600px) translateY(0) translateZ(-2px) scale(0.98);
    transition-duration: 0.1s;
  }

  /* Progress bar segment with animation */
  .progress-segment-active {
    animation: progress-segment-fill 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    transform-origin: left;
  }

  /* Floating subtle animation for icons */
  .icon-float {
    animation: subtle-float 3s ease-in-out infinite;
  }

  .gpu-layer {
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }
`;

const GlobalStyles = () => (
  <style jsx global>{`
    /* Input autofill styling override - Apple style */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active{
        -webkit-box-shadow: 0 0 0 30px rgb(255, 255, 255) inset !important;
        -webkit-text-fill-color: rgb(0, 0, 0) !important;
        transition: background-color 5000s ease-in-out 0s;
    }

    /* === ADDED GLOBAL SCROLL LOCK CLASS === */
    body.loader-lock {
        overflow: hidden !important;
        height: 100vh !important;
        height: 100dvh !important; /* Dynamic viewport height for mobile Safari */
        width: 100vw !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
    }

    /* === REGISTER container - layout only (background set via Tailwind classes) === */
    .register-container {
      min-height: calc(var(--pagemode-vh, 1vh) * 100);
      min-height: 100vh;
      min-height: 100dvh; /* Dynamic viewport for iOS Safari */
      min-height: -webkit-fill-available;
      height: auto;
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    /* Fix for iOS Safari address bar */
    @supports (-webkit-touch-callout: none) {
      .register-container {
        min-height: -webkit-fill-available;
      }
    }

    /* Safe area insets for notched devices */
    .register-container {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    }

    /* Fix viewport units on mobile */
    @supports (height: 100dvh) {
      .register-container {
        min-height: 100dvh;
      }
    }

    /* In-app browser fixes */
    .register-card {
      max-height: none;
      overflow-y: visible;
      -webkit-overflow-scrolling: touch;
      margin-left: auto !important;
      margin-right: auto !important;
      width: 100%;
      max-width: 28rem; /* max-w-md */
    }

    /* Step container centering for Safari */
    [data-motion-component],
    .step-container {
      display: -webkit-box !important;
      display: -webkit-flex !important;
      display: flex !important;
      -webkit-box-align: center !important;
      -webkit-align-items: center !important;
      align-items: center !important;
      -webkit-box-pack: center !important;
      -webkit-justify-content: center !important;
      justify-content: center !important;
      width: 100% !important;
    }

    /* Prevent zoom on input focus in iOS */
    @media screen and (max-width: 768px) {
      input, select, textarea {
        font-size: 16px !important;
      }
    }

    /* === SAFARI FLEXBOX CENTERING FIX (Mac & iOS) === */
    .register-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: calc(var(--pagemode-vh, 1vh) * 100) !important;
      height: 100vh !important;
      height: 100dvh !important;
      display: -webkit-box !important;
      display: -webkit-flex !important;
      display: flex !important;
      -webkit-box-orient: vertical !important;
      -webkit-box-direction: normal !important;
      -webkit-flex-direction: column !important;
      flex-direction: column !important;
      -webkit-box-align: center !important;
      -webkit-align-items: center !important;
      align-items: center !important;
      -webkit-box-pack: center !important;
      -webkit-justify-content: center !important;
      justify-content: center !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    /* Mac Safari specific media query */
    @media not all and (min-resolution: 0.001dpcm) {
      @supports (-webkit-appearance: none) {
        .register-container {
          display: -webkit-box !important;
          display: -webkit-flex !important;
          display: flex !important;
          -webkit-box-align: center !important;
          -webkit-align-items: center !important;
          align-items: center !important;
          -webkit-box-pack: center !important;
          -webkit-justify-content: center !important;
          justify-content: center !important;
        }
      }
    }
  `}</style>
);

// --- LOADING STATES DATA ---
const loadingStates = [
  { text: "INITIALIZING BULLMONEY" },
  { text: "RESTORING SESSION" }, 
  { text: "VERIFYING CREDENTIALS" },
  { text: "UNLOCKING TRADES" },
  { text: "WELCOME BACK" },
];

// --- PREMIUM CELEBRATION STATES (POST-V3) ---
const celebrationStates = [
  { text: "ACTIVATING ELITE ACCESS" },
  { text: "UNLOCKING PREMIUM SETUPS" },
  { text: "CONNECTING TO PRO NETWORK" },
  { text: "GRANTING MENTOR ACCESS" },
  { text: "WELCOME TO THE INNER CIRCLE" },
];

interface RegisterPageProps {
  onUnlock: () => void;
}

export default function RegisterPage({ onUnlock }: RegisterPageProps) {
  const router = useRouter();
  
  // --- STATE ---
  // IMPORTANT: Start with loading=false so welcome screen shows immediately
  // The MultiStepLoader should ONLY show during form submissions, NOT on initial load
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState(-1); // Start at -1 for welcome screen
  const [activeBroker, setActiveBroker] = useState<'Vantage' | 'XM'>('Vantage');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms');
  const [isRefresh, setIsRefresh] = useState(false);
  const [isCelebration, setIsCelebration] = useState(false);
  const [confirmationClicked, setConfirmationClicked] = useState(false);
  
  // Check if user came from Account Manager
  const [returnToAccountManager, setReturnToAccountManager] = useState(false);
  
  useEffect(() => {
    const shouldReturn = localStorage.getItem('return_to_account_manager');
    if (shouldReturn === 'true') {
      setReturnToAccountManager(true);
      setStep(0); // Start directly at step 0 (broker registration)
    }
  }, []);

  useEffect(() => {
    const shouldStartLogin = localStorage.getItem('bullmoney_pagemode_login_view');
    if (shouldStartLogin === 'true') {
      setViewMode('login');
      setStep(0);
      localStorage.removeItem('bullmoney_pagemode_login_view');
    }
  }, []);
  
  // --- DESKTOP DETECTION FOR WELCOME SCREEN ---
  const isDesktop = useIsDesktop();

  // --- MOBILE PERFORMANCE PROFILE ---
  const { isMobile, shouldSkipHeavyEffects, shouldDisableBackdropBlur } = useMobilePerformance();
  const isLowMemoryRuntime = useMemo(() => isLowMemoryDevice(), []);
  const shouldReduceEffects = isMobile || shouldSkipHeavyEffects || isLowMemoryRuntime;
  const disableBackdropBlur = shouldDisableBackdropBlur || isLowMemoryRuntime;

  // --- iOS / In-App viewport shield (match Android/Samsung visual sizing + centering) ---
  const [iosInAppScale, setIosInAppScale] = useState(1);
  const [isIOSInAppShield, setIsIOSInAppShield] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const rootStyle = document.documentElement.style;
    const runtimeProfile = getRuntimeProfile();

    const updateViewportMetrics = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();

      rootStyle.setProperty('--pagemode-vh', `${Math.max(1, viewportHeight) * 0.01}px`);

      const isVeryNarrowPhone = viewportWidth <= 390;
      const isNarrowPhone = viewportWidth <= 430;
      const isCompactPhone = viewportWidth <= 480;
      const isInstagramInApp = /instagram/.test(userAgent);
      const isInAppRuntime = runtimeProfile.isInAppBrowser || runtimeProfile.isWebView;
      const shouldShield = runtimeProfile.isIOS && (isInAppRuntime || isNarrowPhone);

      let scale = 1;
      if (shouldShield) {
        if (isVeryNarrowPhone) {
          scale = 0.86;
        } else if (isNarrowPhone) {
          scale = 0.89;
        } else if (isCompactPhone) {
          scale = 0.92;
        } else {
          scale = 0.95;
        }

        if (isInAppRuntime) {
          scale -= 0.03;
        }

        if (isInstagramInApp) {
          scale -= 0.01;
        }

        if (runtimeProfile.isSafari && isNarrowPhone) {
          scale -= 0.01;
        }

        if (runtimeProfile.deviceMemory !== undefined && runtimeProfile.deviceMemory <= 2) {
          scale -= 0.01;
        }

        scale = Math.min(0.96, Math.max(0.82, scale));
      }

      setIsIOSInAppShield(shouldShield);
      setIosInAppScale(scale);
      rootStyle.setProperty('--pagemode-ios-ui-scale', `${scale}`);
    };

    updateViewportMetrics();

    window.addEventListener('resize', updateViewportMetrics);
    window.addEventListener('orientationchange', updateViewportMetrics);
    window.visualViewport?.addEventListener('resize', updateViewportMetrics);
    window.visualViewport?.addEventListener('scroll', updateViewportMetrics);

    return () => {
      window.removeEventListener('resize', updateViewportMetrics);
      window.removeEventListener('orientationchange', updateViewportMetrics);
      window.visualViewport?.removeEventListener('resize', updateViewportMetrics);
      window.visualViewport?.removeEventListener('scroll', updateViewportMetrics);
      rootStyle.removeProperty('--pagemode-vh');
      rootStyle.removeProperty('--pagemode-ios-ui-scale');
    };
  }, []);

  const iosInAppShieldStyle = isIOSInAppShield && iosInAppScale < 1
    ? ({
        transform: `scale(${iosInAppScale})`,
        transformOrigin: 'top center',
      } as React.CSSProperties)
    : undefined;

  // --- ULTIMATE HUB STATE (for mobile welcome screen) ---
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isHubMinimized, setIsHubMinimized] = useState(false);
  const prices = useLivePrices();

  // --- GHOST ANIMATION STATE (for welcome screen card) ---
  // Card fades in/out like a ghost until user interacts, then stays visible
  const [isGhostMode, setIsGhostMode] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  // Handle any user interaction to stop ghost mode
  const handleUserInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
      setIsGhostMode(false);
    }
  }, [userInteracted]);

  const [formData, setFormData] = useState({
    email: '',
    mt5Number: '',
    password: '',
    referralCode: ''
  });

  // --- REFERRAL ATTRIBUTION STATE (populated from URL params / localStorage) ---
  const [referralAttribution, setReferralAttribution] = useState({
    affiliateId: '',
    affiliateName: '',
    affiliateEmail: '',
    affiliateCode: '',
    source: '',
    medium: '',
    campaign: '',
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // --- INJECT GLOBAL APPLE STYLES ---
  useEffect(() => {
    const styleId = 'apple-glow-styles-pagemode';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = APPLE_GLOBAL_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  // --- EXTRACT REFERRAL CODE & AFFILIATE DETAILS FROM URL PARAMS ---
  // When users scan QR codes from the affiliate dashboard, the URL contains
  // ref, aff_code, aff_id, aff_name, aff_email, utm_source, utm_medium, utm_campaign
  // This auto-fills the referral code and tracks attribution
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const affCode = urlParams.get('aff_code');
    const affiliateCode = (refCode || affCode || '').trim();
    const brokerParam = (urlParams.get('broker') || urlParams.get('partner') || urlParams.get('aff_broker') || '').trim().toLowerCase();

    // Auto-select broker if specified in URL
    if (brokerParam === 'xm') {
      setActiveBroker('XM');
    } else if (brokerParam === 'vantage') {
      setActiveBroker('Vantage');
    }

    // Extract full affiliate attribution from URL
    const affiliateId = (urlParams.get('aff_id') || '').trim();
    const affiliateName = (urlParams.get('aff_name') || '').trim();
    const affiliateEmail = (urlParams.get('aff_email') || '').trim();
    const source = (urlParams.get('utm_source') || '').trim();
    const medium = (urlParams.get('utm_medium') || '').trim();
    const campaign = (urlParams.get('utm_campaign') || '').trim();

    // Also check localStorage for previously stored referral context
    let storedContext: any = null;
    try {
      const rawStoredContext = localStorage.getItem('bullmoney_referral_context');
      if (rawStoredContext) {
        storedContext = JSON.parse(rawStoredContext);
      }
    } catch {}

    // Resolve values: URL params take priority over stored context
    const resolvedAffiliateCode = affiliateCode || String(storedContext?.affiliateCode || '').trim();
    const resolvedAffiliateId = affiliateId || String(storedContext?.affiliateId || '').trim();
    const resolvedAffiliateName = affiliateName || String(storedContext?.affiliateName || '').trim();
    const resolvedAffiliateEmail = affiliateEmail || String(storedContext?.affiliateEmail || '').trim();
    const resolvedSource = source || String(storedContext?.source || '').trim();
    const resolvedMedium = medium || String(storedContext?.medium || '').trim();
    const resolvedCampaign = campaign || String(storedContext?.campaign || '').trim();

    if (resolvedAffiliateCode) {
      console.log('[PageMode] 🎯 Referral attribution detected:', {
        affiliateCode: resolvedAffiliateCode,
        affiliateId: resolvedAffiliateId,
        affiliateName: resolvedAffiliateName,
        affiliateEmail: resolvedAffiliateEmail,
      });

      // Auto-fill referral code in form
      setFormData(prev => ({ ...prev, referralCode: resolvedAffiliateCode }));
      setReferralAttribution({
        affiliateId: resolvedAffiliateId,
        affiliateName: resolvedAffiliateName,
        affiliateEmail: resolvedAffiliateEmail,
        affiliateCode: resolvedAffiliateCode,
        source: resolvedSource,
        medium: resolvedMedium,
        campaign: resolvedCampaign,
      });

      // Persist referral context in localStorage for session continuity
      try {
        localStorage.setItem('bullmoney_referral_context', JSON.stringify({
          affiliateId: resolvedAffiliateId,
          affiliateName: resolvedAffiliateName,
          affiliateEmail: resolvedAffiliateEmail,
          affiliateCode: resolvedAffiliateCode,
          source: resolvedSource,
          medium: resolvedMedium,
          campaign: resolvedCampaign,
          capturedAt: new Date().toISOString(),
        }));
      } catch {}

      // Track referral click (once per session per code)
      const clickTrackKey = `bm_ref_click_tracked_${resolvedAffiliateCode}`;
      const hasQueryCode = Boolean(affiliateCode);
      if (hasQueryCode && !sessionStorage.getItem(clickTrackKey)) {
        fetch('/api/affiliate/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            affiliateCode: resolvedAffiliateCode,
            affiliateId: resolvedAffiliateId,
            source: resolvedSource || 'affiliate',
            medium: resolvedMedium || 'qr_code',
            campaign: resolvedCampaign || 'partner_link',
          }),
        })
          .then(() => sessionStorage.setItem(clickTrackKey, '1'))
          .catch((error) => console.error('[PageMode] Referral click track failed:', error));
      }

      // Clean URL params after extraction (keeps URL clean)
      if (affiliateCode) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // --- WELCOME AUDIO: Play once on page load (no loop) ---
  useEffect(() => {
    const audioKey = 'bullmoney_welcome_audio_played';
    const hasPlayed = sessionStorage.getItem(audioKey);
    if (hasPlayed) return; // Already played this session

    const audio = new Audio('/luvvoice.com-20260201-ByklU8.mp3');
    audio.loop = false;
    audio.volume = 0.7;

    const playAudio = () => {
      audio.play()
        .then(() => {
          sessionStorage.setItem(audioKey, 'true');
        })
        .catch(() => {
          // Autoplay blocked - wait for user interaction
          const playOnInteraction = () => {
            audio.play()
              .then(() => {
                sessionStorage.setItem(audioKey, 'true');
              })
              .catch(() => {});
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
          };
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          document.addEventListener('keydown', playOnInteraction, { once: true });
        });
    };

    playAudio();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);
  
  // --- UI STATE CONTEXT: Signal to minimize audio widget when pagemode is active ---
  const { setPagemodeOpen, setWelcomeScreenActive } = useUIState();
  
  // Use useLayoutEffect to set state BEFORE browser paint - ensures AudioWidget sees it on first render
  useLayoutEffect(() => {
    // Open the pagemode state to signal audio widget to hide
    // Use SYNCHRONOUS layout effect so AudioWidget sees this on initial render
    setPagemodeOpen(true);
    
    // Cleanup: close the pagemode state when component unmounts
    return () => {
      setPagemodeOpen(false);
      setWelcomeScreenActive(false);
    };
  }, [setPagemodeOpen, setWelcomeScreenActive]);
  
  // Track welcome screen state for AudioWidget visibility
  // Welcome screen is step -1 (main welcome) or step -2 (guest intermediate)
  const isWelcomeScreenStep = step === -1 || step === -2;
  
  useEffect(() => {
    // Set welcome screen active based on current step
    // This allows AudioWidget/FloatingPlayer to show on welcome screens
    setWelcomeScreenActive(isWelcomeScreenStep);
  }, [isWelcomeScreenStep, setWelcomeScreenActive]);
  
  const isVantage = activeBroker === 'Vantage';
  const isXM = activeBroker === 'XM';
  const brokerCode = isVantage ? "BULLMONEY" : "X3R7P";
  
  // Helper to get neon classes based on active broker
  const neonTextClass = isXM ? "neon-red-text" : "neon-blue-text";
  const neonBorderClass = isXM ? "neon-red-border" : "neon-blue-border";
  const neonIconClass = isXM ? "neon-red-icon" : "neon-blue-icon";

  // --- PAUSE LOADER ON STEP 4 - BUTTON STAYS VISIBLE ---
  // No auto-advance, button stays clickable indefinitely
  useEffect(() => {
    // Step 4 just pauses - button needs to be clicked to continue
  }, [step]);

  // --- DRAFT SAVER (Auto-Save partial progress) ---
  useEffect(() => {
    // Only save if we have data and are not logged in
    if (step > 0 && step < 5 && (formData.email || formData.mt5Number)) {
        const draft = {
            step,
            formData,
            activeBroker,
            timestamp: Date.now()
        };
        localStorage.setItem("bullmoney_draft", JSON.stringify(draft));
    }
  }, [step, formData, activeBroker]);


  // --- INITIAL LOAD & AUTO-LOGIN CHECK ---
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      // Check if this is a celebration loader after V3 completion
      const showCelebration = localStorage.getItem("bullmoney_show_celebration_loader");

      if (showCelebration === "true") {
        console.log("Showing premium celebration loader after V3 completion");
        localStorage.removeItem("bullmoney_show_celebration_loader");
        localStorage.setItem("bullmoney_loader_completed", "true");
        setIsRefresh(false);
        setIsCelebration(true); // Flag for premium celebration mode
        setLoading(true); // Only show loader for celebration mode

        if (mounted) {
          // 5 seconds premium celebration experience, then show Telegram confirmation
          setTimeout(() => {
            setLoading(false);
            setStep(4); // Go to Telegram confirmation instead of auto-unlocking
          }, 5000);
        }
        return;
      }

      // Welcome screen (step -1) shows immediately - no loading delay needed
      // loading is already false by default, so welcome screen appears instantly
    };

    initSession();
    return () => { mounted = false; };
  }, [onUnlock, step]);

  // --- KEYBOARD SHORTCUT: CTRL+SHIFT+RIGHT ARROW TO SKIP TO STEP 4 ---
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        setStep(4);
        setLoading(true); // Keep loading screen visible
        console.log('Keyboard shortcut: Jumped to step 4');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // --- KEEP STEP 4 VISIBLE (PREVENT AUTO-EXIT) ---
  useEffect(() => {
    if (step === 4 && !confirmationClicked) {
      setLoading(true); // Ensure step 4 screen stays visible until button clicked
    } else if (confirmationClicked) {
      setLoading(false); // Allow exit only after confirmation
      setConfirmationClicked(false); // Reset for next time
    }
  }, [step, confirmationClicked]);

  // === ADDED SCROLL LOCK/UNLOCK EFFECT ===
  useEffect(() => {
    if (loading) {
      document.body.classList.add("loader-lock");
    } else {
      document.body.classList.remove("loader-lock");
    }
    // Cleanup ensures scroll lock is removed on unmount
    return () => {
      document.body.classList.remove("loader-lock");
    };
  }, [loading]);
  // =======================================


  const handleBrokerSwitch = (newBroker: 'Vantage' | 'XM') => {
    if (activeBroker === newBroker) return;
    setActiveBroker(newBroker);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'mt5Number' && !/^\d*$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null);
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (pass: string) => pass.length >= 6;
  const isValidMT5 = (id: string) => id.length >= 5;

  const handleNext = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);

    // INTRO -> STEP 1
    if (step === 0) {
      setStep(1);
    }
    // STEP 1 -> STEP 2
    else if (step === 1) {
      setStep(2);
    }
    // STEP 2 -> STEP 3
    else if (step === 2) {
      if (!isValidMT5(formData.mt5Number)) {
        setSubmitError("Please enter a valid MT5 ID (min 5 digits).");
        return;
      }
      setStep(3);
    }
    // STEP 3 -> SUBMIT
    else if (step === 3) {
      if (!isValidEmail(formData.email)) {
        setSubmitError("Please enter a valid email address.");
        return;
      }
      if (!isValidPassword(formData.password)) {
        setSubmitError("Password must be at least 6 characters.");
        return;
      }
      if (!acceptedTerms) {
        setSubmitError("You must agree to the Terms & Conditions.");
        return;
      }
      handleRegisterSubmit();
    }
  };

  const handleBack = () => {
    if (step > -1) {
      setStep(step - 1);
      setSubmitError(null);
    }
  };

  const toggleViewMode = () => {
    if (viewMode === 'register') {
      setViewMode('login');
      setStep(0); 
    } else {
      setViewMode('register');
      setStep(0);
    }
    setSubmitError(null);
    setLoading(false);
    setShowPassword(false);
    setAcceptedTerms(false);
  };

  // Robust clipboard copy with fallback for production environments
  const copyCode = async (code: string) => {
    if (!code) return;
    
    try {
      // Method 1: Try modern Clipboard API (works in HTTPS)
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1100);
          return;
        } catch (clipboardErr) {
          console.warn('Clipboard API failed, trying fallback:', clipboardErr);
        }
      }

      // Method 2: Fallback using textarea (works in most environments)
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;z-index:-1;';
      document.body.appendChild(textarea);
      
      // iOS Safari specific handling
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, textarea.value.length);
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1100);
      } else {
        setSubmitError('Failed to copy code. Please copy manually: ' + code);
        setTimeout(() => setSubmitError(null), 3000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      setSubmitError('Failed to copy code. Please copy manually: ' + code);
      setTimeout(() => setSubmitError(null), 3000);
    }
  };

  const handleBrokerClick = () => {
    const link = activeBroker === 'Vantage' ? "https://vigco.co/iQbe2u" : "https://affs.click/t5wni";
    // Track broker affiliate click
    BullMoneyAnalytics.trackAffiliateClick(activeBroker, 'pagemode');
    window.open(link, '_blank');
  };

  const handleRegisterSubmit = async () => {
    setSubmitError(null);
    setLoading(true); // Show loading during Supabase operation
    
    // Track registration attempt
    trackEvent('checkout_start', { 
      broker: activeBroker, 
      source: 'pagemode',
      hasReferralCode: !!formData.referralCode 
    });

    try {
      const hasAffiliateAttribution = Boolean(referralAttribution?.affiliateCode);
      const res = await fetch('/api/recruit-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          mt5_id: formData.mt5Number,
          referred_by_code: formData.referralCode || null,
          referral_attribution: hasAffiliateAttribution
            ? {
                affiliate_id: referralAttribution.affiliateId || null,
                affiliate_name: referralAttribution.affiliateName || null,
                affiliate_email: referralAttribution.affiliateEmail || null,
                affiliate_code: referralAttribution.affiliateCode || formData.referralCode,
                source: referralAttribution.source || 'affiliate',
                medium: referralAttribution.medium || 'qr_code',
                campaign: referralAttribution.campaign || 'partner_link',
              }
            : null,
          used_code: true,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result?.success || !result?.recruit) {
        if (res.status === 409) {
          throw new Error('This email is already registered. Please Login.');
        }
        throw new Error(result?.error || 'Connection failed. Please check your internet.');
      }

      const newUser = result.recruit;
      persistSession({
        recruitId: newUser.id,
        email: newUser.email,
        mt5Id: newUser.mt5_id || formData.mt5Number,
        isVip: newUser.is_vip === true,
        timestamp: Date.now(),
      });

      // Dispatch event so other components (like TradingJournal) can detect session change
      window.dispatchEvent(new Event('bullmoney_session_changed'));

      // Clear draft
      localStorage.removeItem("bullmoney_draft");

      // Track successful signup
      BullMoneyAnalytics.trackAffiliateSignup(formData.referralCode || 'direct');
      trackEvent('signup', { 
        method: 'email', 
        broker: activeBroker,
        source: 'pagemode' 
      });

      setLoading(false);
      setStep(4); // Move to Telegram confirmation

    } catch (err: any) {
      console.error("Submission Error:", err);
      // Track registration error
      trackEvent('error', { 
        type: 'registration_failed', 
        code: err.code || 'unknown',
        source: 'pagemode' 
      });
      if (err.code === '23505') {
        setSubmitError("This email is already registered.");
      } else {
        setSubmitError(err.message || "Connection failed. Please check your internet.");
      }
      setStep(3); // Go back to auth step
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);
    
    // Track login attempt
    trackEvent('login_attempt', { source: 'pagemode' });

    try {
      const res = await fetch('/api/recruit-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const result = await res.json();
      if (!res.ok || !result?.success || !result?.recruit) {
        await new Promise(r => setTimeout(r, 800));
        throw new Error(result?.error || 'Invalid email or password.');
      }

      const recruit = result.recruit;
      persistSession({
        recruitId: recruit.id,
        email: recruit.email,
        mt5Id: recruit.mt5_id,
        isVip: recruit.is_vip === true,
        timestamp: Date.now(),
      });

      // Dispatch event so other components (like TradingJournal) can detect session change
      window.dispatchEvent(new Event('bullmoney_session_changed'));

      // Mark telegram as confirmed for existing users logging in
      // This ensures Telegram screen NEVER shows for login route, only for new signups
      localStorage.setItem("bullmoney_telegram_confirmed", "true");
      
      // Track successful login
      trackEvent('login', { method: 'email', source: 'pagemode' });

      setLoading(false);
      // For login, skip Telegram confirmation and go directly to unlock
      // (Telegram confirmation is only for new sign-ups)
      onUnlock(); 

    } catch (err: any) {
      setLoading(false);
      // Track login error
      trackEvent('error', { type: 'login_failed', source: 'pagemode' });
      setSubmitError(err.message || "Invalid credentials.");
    }
  };

  const getStepProps = (currentStep: number) => {
    return isVantage ? { number2: currentStep } : { number: currentStep };
  };

  // --- RENDER: LOADING (SCREEN 4 AFTER SUBMIT) ---
  if (step === 4) {
    return (
      <TelegramConfirmationResponsive 
        onUnlock={onUnlock}
        onConfirmationClicked={() => setConfirmationClicked(true)}
        isXM={isXM}
        neonIconClass={neonIconClass}
      />
    );
  }

  const isWelcomeScreen = step === -1 || step === -2;

  // --- RENDER: MAIN INTERFACE ---
  return (
        <div className={cn(
        "register-container font-sans",
        isWelcomeScreen ? "bg-transparent p-0" : "bg-white px-4 py-6 md:p-4",
        !isWelcomeScreen && "md:overflow-hidden md:h-screen",
        isIOSInAppShield && "pagemode-ios-shield"
         )}
          style={{ 
            position: 'relative', 
            minHeight: 'calc(var(--pagemode-vh, 1vh) * 100)',
            backgroundColor: isWelcomeScreen ? 'transparent' : '#fff',
          }}>
      <GlobalStyles />

      {/* Shared Spline background for welcome/guest to survive resizes */}
      {/* INTERACTIVE: Touch and mouse events pass through to Spline 3D scene */}
      {isWelcomeScreen && !loading && (
        <div
          className="fixed inset-0 w-full h-full overflow-hidden"
          style={{
            zIndex: 0,
            pointerEvents: 'auto',
            touchAction: 'pan-y pinch-zoom',
            width: '100vw',
            minWidth: '100vw',
            height: 'calc(var(--pagemode-vh, 1vh) * 100)',
            minHeight: '100dvh',
            cursor: 'default',
            backgroundColor: 'transparent',
          }}
        >
          <WelcomeSplineBackground />
        </div>
      )}
      
      {/* Blue shimmer background - left to right */}
      {!shouldReduceEffects && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 shimmer-ltr opacity-10" />
        </div>
      )}
      
      {/* === FIX: HIGH Z-INDEX WRAPPER FOR LOADER === */}
      {/* This fixed container ensures the loader covers the entire viewport and overlays native browser bars. */}
      {loading && (
          <div 
             // CRITICAL: Fixed, full coverage, max z-index to overlay native browser UI
             className="fixed inset-0 z-[99999999] w-screen bg-black"
             style={{ height: '100dvh', minHeight: '-webkit-fill-available' }}
             // We render the loader component inside this wrapper
          >
            <MultiStepLoader 
              loadingStates={isCelebration ? celebrationStates : loadingStates} 
              loading={loading} 
              duration={isCelebration ? 1000 : 300} 
              loop={false} 
              isRefresh={isRefresh} 
            />
          </div>
      )}
      {/* =========================================== */}

      {/* HEADER - BULLMONEY FREE TITLE */}
      {!loading && step !== -1 && step !== -2 && (
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 20,
          paddingBottom: 12,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          marginBottom: 24,
          zIndex: 100,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#000', letterSpacing: '-0.02em', animation: 'apple-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            BullMoney <span style={{ color: 'rgba(0,0,0,0.4)', fontWeight: 400 }}>Free</span>
          </h1>
        </div>
      )}

      {/* RENDER CONTENT ONLY IF NOT LOADING */}
      <div className={cn(
        // Opacity transition for a smooth reveal after loading is done
        "transition-opacity duration-500 w-full max-w-xl mx-auto flex flex-col items-center md:pt-32 lg:pt-36",
        loading ? "opacity-0 pointer-events-none" : "opacity-100"
      )} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: isWelcomeScreen ? 'transparent' : '#fff' }}>

        {/* Existing background elements */}
        <div className={cn("absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 gpu-accel -z-10", isXM ? "bg-red-900/10" : "bg-white/10")} />

        {/* ================= WELCOME SCREEN (Step -1) ================= */}
        {step === -1 && (
          isDesktop ? (
            // Desktop Welcome Screen - Split layout with branding
            <WelcomeScreenDesktop
              onSignUp={() => {
                setViewMode('register');
                setStep(0);
              }}
              onGuest={() => {
                setStep(-2);
              }}
              onLogin={() => {
                setViewMode('login');
                setStep(0);
              }}
              hideBackground
            />
          ) : (
            // Mobile Welcome Screen - Minimalistic Apple-style design
            <>
              <motion.div
                key="welcome-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 flex flex-col"
                style={{
                  minHeight: '100dvh',
                  width: '100vw',
                  height: 'calc(var(--pagemode-vh, 1vh) * 100)',
                  pointerEvents: 'none',
                  zIndex: UI_Z_INDEX.PAGEMODE,
                  backgroundColor: 'transparent',
                  // No iosInAppShieldStyle scale on welcome screen — it creates visible
                  // edges around the content. The Spline bg fills the viewport independently.
                }}
              >
                {/* Minimalistic Branding Header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ position: 'relative', zIndex: 10, paddingTop: 40, paddingBottom: 20, textAlign: 'center', pointerEvents: 'none' }}
                >
                  <motion.h1
                    style={{
                      position: 'relative',
                      fontSize: 'clamp(1.8rem,6vw,2.4rem)',
                      fontWeight: 600,
                      color: '#fff',
                      textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                      letterSpacing: '-0.03em',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                    }}
                  >
                    BullMoney
                  </motion.h1>
                </motion.div>

                {/* Main Content Area */}
                <div
                  style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', width: '100%', paddingBottom: 24, zIndex: 10, pointerEvents: 'auto' }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="apple-card"
                    style={{
                      width: '100%',
                      maxWidth: 208,
                      borderRadius: 12,
                      padding: 16,
                      background: '#fff',
                      boxShadow: '0 1px 12px rgba(0, 0, 0, 0.06)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}
                    >
                      <img src="/IMG_2921.PNG" alt="BullMoney" className="icon-float" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
                    </motion.div>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#000', marginBottom: 2, textAlign: 'center', letterSpacing: '-0.02em' }}>
                      BullMoney
                    </h2>
                    <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: 10, marginBottom: 16, textAlign: 'center', fontWeight: 400 }}>
                      Free trading tools & community
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <motion.button
                        onClick={() => { setViewMode('login'); setStep(0); }}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-3d-primary"
                        style={{ width: '100%', padding: '8px 0', borderRadius: 10, fontWeight: 600, fontSize: 11, background: '#000', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 3px 12px -3px rgba(0,0,0,0.3)' }}
                      >
                        Sign In
                      </motion.button>

                      <motion.button
                        onClick={() => { setViewMode('register'); setStep(0); }}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-3d-secondary"
                        style={{ width: '100%', padding: '8px 0', borderRadius: 10, fontWeight: 600, fontSize: 11, color: '#000', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer' }}
                      >
                        Create Account
                      </motion.button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0' }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />
                        <span style={{ color: 'rgba(0,0,0,0.25)', fontSize: 9, fontWeight: 400 }}>or</span>
                        <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />
                      </div>

                      <motion.button
                        onClick={() => setStep(-2)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ width: '100%', padding: '6px 0', borderRadius: 10, fontWeight: 400, fontSize: 10, color: 'rgba(0,0,0,0.5)', backgroundColor: 'rgba(0,0,0,0.03)', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      >
                        Browse as Guest
                      </motion.button>
                    </div>

                    <p style={{ textAlign: 'center', color: 'rgba(0,0,0,0.25)', fontSize: 9, marginTop: 12, fontWeight: 400, lineHeight: 1.6 }}>
                      By continuing, you agree to our{' '}
                      <button type="button" onClick={() => { setLegalModalTab('terms'); setIsLegalModalOpen(true); }} style={{ color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 9 }}>Terms</button>
                      {' & '}
                      <button type="button" onClick={() => { setLegalModalTab('privacy'); setIsLegalModalOpen(true); }} style={{ color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 9 }}>Privacy</button>
                    </p>
                  </motion.div>
                </div>

                {/* Ultimate Hub Pill - Positioned below header+subheading from top */}
                <UnifiedFpsPill
                  fps={60}
                  deviceTier="high"
                  prices={prices}
                  isMinimized={isHubMinimized}
                  onToggleMinimized={() => setIsHubMinimized(!isHubMinimized)}
                  onOpenPanel={() => setIsHubOpen(true)}
                  topOffsetMobile="calc(env(safe-area-inset-top, 0px) + 100px)"
                  topOffsetDesktop="calc(env(safe-area-inset-top, 0px) + 110px)"
                  mobileAlignment="center"
                />
              </motion.div>

              {/* Ultimate Hub Panel - Portal for z-index */}
              {typeof window !== 'undefined' && createPortal(
                <UnifiedHubPanel
                  isOpen={isHubOpen}
                  onClose={() => setIsHubOpen(false)}
                  fps={60}
                  deviceTier="high"
                  isAdmin={false}
                  isVip={false}
                  userId={undefined}
                  userEmail={undefined}
                  prices={prices}
                />,
                document.body
              )}
            </>
          )
        )}

        {/* ================= GUEST INTERMEDIATE SCREEN (Step -2) ================= */}
        {step === -2 && (
          <>
            <motion.div
              key="guest-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="fixed inset-0 flex flex-col"
              style={{ 
                minHeight: '100dvh',
                height: 'calc(var(--pagemode-vh, 1vh) * 100)',
                pointerEvents: 'none', // Allow Spline interaction, UI elements override
                zIndex: UI_Z_INDEX.PAGEMODE,
                backgroundColor: 'transparent',
                color: '#000',
                ...(iosInAppShieldStyle ?? {}),
              }}
            >
              {/* Back Button */}
              <button
                onClick={() => setStep(-1)}
                className="apple-button cursor-target"
                style={{ position: 'fixed', top: 20, right: 16, display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: 500, padding: '8px 12px', borderRadius: 12, zIndex: 50, backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', pointerEvents: 'auto' }}
              >
                <ChevronLeft style={{ width: 16, height: 16 }} /> Back
              </button>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'relative', zIndex: 10, paddingTop: 56, paddingBottom: 24, textAlign: 'center', pointerEvents: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
              >
                <h1 style={{ fontSize: 24, fontWeight: 600, color: '#000', letterSpacing: '-0.03em' }}>
                  BullMoney
                </h1>
              </motion.div>

              {/* Card */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', width: '100%', paddingBottom: 40, position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="apple-card"
                  style={{ borderRadius: 16, padding: 24, textAlign: 'center', width: '100%', maxWidth: 320, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}
                  >
                    <img src="/IMG_2921.PNG" alt="BullMoney" className="icon-float" style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
                  </motion.div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: '#000', marginBottom: 4, letterSpacing: '-0.02em' }}>Guest Access</h2>
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 20, lineHeight: 1.6, fontWeight: 400 }}>
                    Browse freely. Some features are limited.
                  </p>
                  <motion.button
                    onClick={() => { setStep(99); onUnlock(); }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.96, y: 1 }}
                    className="btn-3d-primary"
                    style={{ width: '100%', padding: '12px 0', borderRadius: 14, fontWeight: 600, fontSize: 15, background: '#fff', color: '#000', border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.12)' }}
                  >
                    Continue
                  </motion.button>
                </motion.div>
              </div>

              {/* Ultimate Hub Pill - Positioned below header from top */}
              <UnifiedFpsPill
                fps={60}
                deviceTier="high"
                prices={prices}
                isMinimized={isHubMinimized}
                onToggleMinimized={() => setIsHubMinimized(!isHubMinimized)}
                onOpenPanel={() => setIsHubOpen(true)}
                topOffsetMobile="calc(env(safe-area-inset-top, 0px) + 100px)"
                topOffsetDesktop="calc(env(safe-area-inset-top, 0px) + 110px)"
                mobileAlignment="left"
              />
            </motion.div>

            {/* Ultimate Hub Panel - Portal for z-index */}
            {typeof window !== 'undefined' && createPortal(
              <UnifiedHubPanel
                isOpen={isHubOpen}
                onClose={() => setIsHubOpen(false)}
                fps={60}
                deviceTier="high"
                isAdmin={false}
                isVip={false}
                userId={undefined}
                userEmail={undefined}
                prices={prices}
              />,
              document.body
            )}
          </>
        )}

       {/* ================= LOGIN VIEW - APPLE STYLE ================= */}
        {step !== -1 && step !== -2 && viewMode === 'login' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{ minHeight: '100dvh', height: 'calc(var(--pagemode-vh, 1vh) * 100)', backgroundColor: '#fff', zIndex: 99999998, ...(iosInAppShieldStyle ?? {}) }}
          >
             {/* Back Button */}
             <motion.button
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
               onClick={() => setStep(-1)}
               className="btn-3d-secondary cursor-target"
               style={{ position: 'fixed', top: 56, left: 16, display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: 500, padding: '8px 12px', borderRadius: 12, backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)', zIndex: 2147483646, cursor: 'pointer' }}
             >
               <ChevronLeft style={{ width: 16, height: 16 }} /> Back
             </motion.button>

             <motion.div
               initial={{ opacity: 0, rotateX: 10, y: 50, scale: 0.9 }}
               animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
               style={{
                 backgroundColor: '#fff',
                 padding: 24,
                 borderRadius: 20,
                 position: 'relative',
                 overflow: 'hidden',
                 width: '100%',
                 maxWidth: 384,
                 marginLeft: 16,
                 marginRight: 16,
                 border: '1px solid rgba(0,0,0,0.08)',
                 boxShadow: '0 8px 32px -8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.04)',
                 fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                 perspective: 1200,
                 transformStyle: 'preserve-3d' as any,
               }}
             >
                {/* Top edge highlight */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', zIndex: 20, pointerEvents: 'none' }} />

                <motion.div
                  initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, position: 'relative', zIndex: 10 }}
                >
                  <img src="/IMG_2921.PNG" alt="BullMoney" className="icon-float" style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: '#000', letterSpacing: '-0.02em' }}
                >
                  Sign In
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ marginBottom: 20, fontSize: 13, color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}
                >
                  Welcome back to BullMoney
                </motion.p>

                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 10 }} autoComplete="on">
                   <motion.div
                     initial={{ opacity: 0, y: 16 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.35, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                   >
                     <input
                       autoFocus
                       type="email"
                       name="email"
                       id="login-email"
                       autoComplete="username"
                       value={loginEmail}
                       onChange={(e) => setLoginEmail(e.target.value)}
                       placeholder="Email"
                       className="apple-input"
                       style={{ width: '100%', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: '14px 16px', color: '#000', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                     />
                   </motion.div>

                   <motion.div
                     initial={{ opacity: 0, y: 16 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.45, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                     style={{ position: 'relative' }}
                   >
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="login-password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="apple-input"
                        style={{ width: '100%', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: '14px 16px', paddingRight: 44, color: '#000', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="cursor-target"
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                      </button>
                    </motion.div>

                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: 12, backgroundColor: '#fef2f2', padding: 10, borderRadius: 12, border: '1px solid #fee2e2' }}
                      >
                        <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} /> {submitError}
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={!loginEmail || !loginPassword}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={(loginEmail && loginPassword) ? { scale: 1.02, y: -2 } : {}}
                      whileTap={(loginEmail && loginPassword) ? { scale: 0.96, y: 1 } : {}}
                      className="btn-3d-primary cursor-target"
                      style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', border: 'none', cursor: (loginEmail && loginPassword) ? 'pointer' : 'not-allowed', opacity: (!loginEmail || !loginPassword) ? 0.4 : 1, boxShadow: (loginEmail && loginPassword) ? '0 4px 20px -4px rgba(0,0,0,0.3)' : 'none' }}
                    >
                      Sign In
                    </motion.button>
                </form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  style={{ marginTop: 16, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}
                >
                  <button onClick={toggleViewMode} className="btn-3d-secondary cursor-target" style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)', fontWeight: 400, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                    Don't have an account? <span style={{ color: '#000', fontWeight: 500 }}>Create one</span>
                  </button>
                </motion.div>
             </motion.div>
          </motion.div>
        ) : (
          /* ================= UNLOCK FLOW VIEW ================= */
          <>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}
              >
                {(["Vantage", "XM"] as const).map((partner) => {
                  const isActive = activeBroker === partner;
                  return (
                    <motion.button
                      key={partner}
                      onClick={() => handleBrokerSwitch(partner)}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      className="cursor-target"
                      style={{
                        position: 'relative',
                        padding: '7px 18px',
                        borderRadius: 9999,
                        fontWeight: 500,
                        fontSize: 13,
                        zIndex: 20,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
                        color: isActive ? '#fff' : 'rgba(0,0,0,0.5)',
                        backgroundColor: isActive ? '#000' : 'rgba(0,0,0,0.04)',
                        boxShadow: isActive ? '0 4px 16px -4px rgba(0,0,0,0.25)' : 'none',
                      }}
                    >
                      {partner}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            <AnimatePresence mode="wait">

              {/* --- SCREEN 1: ENTRY GATE (Step 0) - APPLE STYLE --- */}
              {step === 0 && (
                 <motion.div
                  key="step0-apple"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 flex flex-col items-center justify-center"
                  style={{ minHeight: '100dvh', height: 'calc(var(--pagemode-vh, 1vh) * 100)', backgroundColor: '#fff', zIndex: 99999998, ...(iosInAppShieldStyle ?? {}) }}
                 >
                   {/* Back Button */}
                   <motion.button
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                     onClick={() => {
                       if (returnToAccountManager) {
                         localStorage.removeItem('return_to_account_manager');
                         router.push('/?openAccountManager=true');
                       } else {
                         setStep(-1);
                       }
                     }}
                     className="btn-3d-secondary cursor-target"
                     style={{ position: 'fixed', top: 56, left: 16, display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: 500, padding: '8px 12px', borderRadius: 12, backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)', zIndex: 2147483646, cursor: 'pointer' }}
                   >
                     <ChevronLeft style={{ width: 16, height: 16 }} /> {returnToAccountManager ? 'Account Manager' : 'Back'}
                   </motion.button>

                   <motion.div
                     initial={{ opacity: 0, rotateX: 10, y: 50, scale: 0.9 }}
                     animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
                     transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                     style={{
                       backgroundColor: '#fff',
                       padding: 24,
                       borderRadius: 20,
                       position: 'relative',
                       overflow: 'hidden',
                       textAlign: 'center',
                       width: '100%',
                       maxWidth: 384,
                       marginLeft: 16,
                       marginRight: 16,
                       border: '1px solid rgba(0,0,0,0.08)',
                       boxShadow: '0 8px 32px -8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.04)',
                       zIndex: 1,
                       fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                       perspective: 1200,
                       transformStyle: 'preserve-3d' as any,
                     }}
                   >
                      {/* Top edge highlight */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', zIndex: 20, pointerEvents: 'none' }} />

                      {/* Logo */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}
                      >
                        <img src="/IMG_2921.PNG" alt="BullMoney" style={{ width: 48, height: 48, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }} />
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: '#000', letterSpacing: '-0.02em' }}
                      >
                        Get Free Access
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ fontSize: 13, marginBottom: 20, color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}
                      >
                        3 steps · 2 minutes · No payment needed
                      </motion.p>

                      {/* 3-Step Preview - staggered animated */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ position: 'relative', zIndex: 10, marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 14, padding: 14, border: '1px solid rgba(0,0,0,0.05)' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[
                            { n: '1', text: 'Open a free broker account' },
                            { n: '2', text: 'Enter your trading ID' },
                            { n: '3', text: 'Create your login' },
                          ].map((s, i) => (
                            <motion.div
                              key={s.n}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.45 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}
                            >
                              <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#000', color: '#fff', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{s.n}</span>
                              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>{s.text}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      <motion.button
                        onClick={handleNext}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.96, y: 1 }}
                        className="btn-3d-primary cursor-target"
                        style={{ position: 'relative', zIndex: 10, width: '100%', padding: '14px 0', borderRadius: 14, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#000', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.3)' }}
                      >
                        Get Started <ArrowRight style={{ width: 16, height: 16 }} />
                      </motion.button>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 10 }}
                      >
                         <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)' }}><Lock style={{ width: 12, height: 12, display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />No credit card required</p>
                         <button
                           onClick={toggleViewMode}
                           className="btn-3d-secondary"
                           style={{ fontSize: 13, fontWeight: 400, color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
                         >
                            Already registered? <span style={{ color: '#000', fontWeight: 500 }}>Sign in</span>
                         </button>
                      </motion.div>
                   </motion.div>
                 </motion.div>
              )}

              {/* --- SCREEN 2: OPEN ACCOUNT (Step 1) --- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                >
                  <StepCard
                    {...getStepProps(1)}
                    title="Open a Free Broker Account"
                    className="register-card"
                    isXM={isXM}
                    disableEffects={true}
                    disableBackdropBlur={disableBackdropBlur}
                    actions={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <motion.button
                          onClick={() => copyCode(brokerCode)}
                          whileHover={{ scale: 1.01, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          className="btn-3d-secondary cursor-target"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 14, padding: '12px 16px', fontSize: 13, fontWeight: 600, width: '100%', justifyContent: 'center', color: '#000', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }}
                        >
                          {copied ? <Check style={{ height: 16, width: 16 }} /> : <Copy style={{ height: 16, width: 16 }} />}
                          <span>{copied ? "Copied!" : `Copy Code: ${brokerCode}`}</span>
                        </motion.button>

                        <motion.button
                          onClick={handleBrokerClick}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.96, y: 1 }}
                          className="btn-3d-primary cursor-target"
                          style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#000', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.3)' }}
                        >
                          Open {activeBroker} Account <ExternalLink style={{ height: 16, width: 16 }} />
                        </motion.button>

                        <motion.button
                          onClick={handleNext}
                          whileHover={{ scale: 1.01, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          className="btn-3d-secondary cursor-target"
                          style={{ width: '100%', padding: '12px 0', borderRadius: 14, fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#000', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }}
                        >
                          I've Opened My Account <ArrowRight style={{ width: 16, height: 16 }} />
                        </motion.button>
                      </div>
                    }
                  >
                    <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16, color: 'rgba(0,0,0,0.5)' }}>
                      We partner with regulated brokers so you get free access. Use the code below when signing up.
                    </p>

                    {/* Broker code display - compact */}
                    <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 12, backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                      <div>
                        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(0,0,0,0.3)', fontWeight: 500, display: 'block' }}>Partner Code</span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#000', letterSpacing: '0.02em' }}>{brokerCode}</span>
                      </div>
                      <button onClick={() => copyCode(brokerCode)} style={{ color: 'rgba(0,0,0,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        {copied ? <Check style={{ height: 16, width: 16 }} /> : <Copy style={{ height: 16, width: 16 }} />}
                      </button>
                    </div>

                    {/* How-to steps inline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                      <p><span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>1.</span> Copy the code above</p>
                      <p><span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>2.</span> Open the broker link & paste it when signing up</p>
                      <p><span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>3.</span> Come back and tap "I've Opened My Account"</p>
                    </div>
                  </StepCard>
                </motion.div>
              )}

              {/* --- SCREEN 3: VERIFY ID (Step 2) --- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-col items-center justify-center"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                >
                  <StepCard
                    {...getStepProps(2)}
                    title="Enter Your Trading ID"
                    className="register-card"
                    isXM={isXM}
                    disableEffects={shouldReduceEffects}
                    disableBackdropBlur={disableBackdropBlur}
                    actions={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <motion.button
                          onClick={handleNext}
                          disabled={!formData.mt5Number}
                          whileHover={formData.mt5Number ? { scale: 1.02, y: -2 } : {}}
                          whileTap={formData.mt5Number ? { scale: 0.96, y: 1 } : {}}
                          className="btn-3d-primary cursor-target"
                          style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#000', color: '#fff', border: 'none', cursor: formData.mt5Number ? 'pointer' : 'not-allowed', opacity: !formData.mt5Number ? 0.4 : 1, boxShadow: formData.mt5Number ? '0 4px 20px -4px rgba(0,0,0,0.3)' : 'none' }}
                        >
                          Continue <ArrowRight style={{ width: 16, height: 16 }} />
                        </motion.button>
                        <motion.button
                          onClick={handleBack}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="cursor-target"
                          style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'rgba(0,0,0,0.4)', margin: '0 auto', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <ChevronLeft style={{ width: 14, height: 14, marginRight: 2 }} /> Back
                        </motion.button>
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                      <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', lineHeight: 1.6 }}>
                        After signing up with {activeBroker}, check your email for your <span style={{ fontWeight: 600, color: 'rgba(0,0,0,0.7)' }}>MT5 Trading ID</span> (a number like 12345678).
                      </p>

                      <div style={{ position: 'relative' }}>
                        <Hash style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.25)', width: 18, height: 18 }} className="icon-float" />
                        <input
                          autoFocus
                          type="tel"
                          name="mt5Number"
                          value={formData.mt5Number}
                          onChange={handleChange}
                          placeholder="e.g. 12345678"
                          className="apple-input cursor-target"
                          style={{ width: '100%', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 14, paddingLeft: 40, paddingRight: 16, paddingTop: 14, paddingBottom: 14, color: '#000', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}><Lock style={{ width: 12, height: 12 }}/> Only used to verify access — never shared</p>
                    </div>
                  </StepCard>
                </motion.div>
              )}

              {/* --- SCREEN 4: CREATE LOGIN (Step 3) --- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-col items-center justify-center"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                >
                  <StepCard
                    {...getStepProps(3)}
                    title="Create Your Login"
                    className="register-card"
                    isXM={isXM}
                    disableEffects={true}
                    disableBackdropBlur={disableBackdropBlur}
                    actions={
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <motion.button
                          onClick={handleNext}
                          disabled={!formData.email || !formData.password || !acceptedTerms}
                          whileHover={(formData.email && formData.password && acceptedTerms) ? { scale: 1.02, y: -2 } : {}}
                          whileTap={(formData.email && formData.password && acceptedTerms) ? { scale: 0.96, y: 1 } : {}}
                          className="btn-3d-primary cursor-target"
                          style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#000', color: '#fff', border: 'none', cursor: (formData.email && formData.password && acceptedTerms) ? 'pointer' : 'not-allowed', opacity: (!formData.email || !formData.password || !acceptedTerms) ? 0.4 : 1, boxShadow: (formData.email && formData.password && acceptedTerms) ? '0 4px 20px -4px rgba(0,0,0,0.3)' : 'none' }}
                        >
                          Finish &amp; Get Access <ShieldCheck style={{ width: 16, height: 16 }} />
                        </motion.button>
                        <motion.button
                          onClick={handleBack}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="cursor-target"
                          style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'rgba(0,0,0,0.4)', margin: '0 auto', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <ChevronLeft style={{ width: 14, height: 14, marginRight: 2 }} /> Back
                        </motion.button>
                      </div>
                    }
                  >
                    <p style={{ fontSize: 13, marginBottom: 16, color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>Last step — set up your email and password.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <input
                          autoFocus
                          type="email"
                          name="email"
                          autoComplete="username"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Email address"
                          className="apple-input cursor-target"
                          style={{ width: '100%', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '14px 16px', color: '#000', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Password (min 6 characters)"
                          className="apple-input cursor-target"
                          style={{ width: '100%', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '14px 16px', paddingRight: 44, color: '#000', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                        </button>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          name="referralCode"
                          value={formData.referralCode}
                          onChange={handleChange}
                          placeholder="BullMoney Affiliate Code (optional)"
                          readOnly={!!referralAttribution.affiliateCode}
                          className="apple-input cursor-target"
                          style={{
                            width: '100%',
                            backgroundColor: referralAttribution.affiliateCode ? 'rgba(240,253,244,0.3)' : '#fff',
                            border: referralAttribution.affiliateCode ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(0,0,0,0.1)',
                            borderRadius: 12,
                            padding: '14px 16px',
                            paddingRight: referralAttribution.affiliateCode ? 44 : 16,
                            color: '#000',
                            fontSize: 16,
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        {referralAttribution.affiliateCode && (
                          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                            <Check style={{ width: 16, height: 16, color: '#16a34a' }} />
                          </div>
                        )}
                        {referralAttribution.affiliateCode && (
                          <p style={{ fontSize: 11, marginTop: 4, marginLeft: 4, color: 'rgba(22,163,74,0.7)' }}>
                            Referred by {referralAttribution.affiliateName || referralAttribution.affiliateEmail || 'a BullMoney partner'}
                          </p>
                        )}
                      </div>

                      {/* Terms checkbox - compact */}
                      <div
                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.02)', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)' }}
                      >
                        <div
                          style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', background: acceptedTerms ? '#000' : 'transparent' }}
                        >
                          {acceptedTerms && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
                        </div>
                        <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', lineHeight: 1.6, fontWeight: 400, flex: 1 }}>
                          I agree to the{' '}
                          <button type="button" onClick={(e) => { e.stopPropagation(); setLegalModalTab('terms'); setIsLegalModalOpen(true); }} style={{ color: 'rgba(0,0,0,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11 }}>Terms</button>
                          {', '}
                          <button type="button" onClick={(e) => { e.stopPropagation(); setLegalModalTab('privacy'); setIsLegalModalOpen(true); }} style={{ color: 'rgba(0,0,0,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11 }}>Privacy</button>
                          {' & '}
                          <button type="button" onClick={(e) => { e.stopPropagation(); setLegalModalTab('disclaimer'); setIsLegalModalOpen(true); }} style={{ color: 'rgba(0,0,0,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11 }}>Disclaimer</button>
                        </p>
                      </div>
                    </div>

                    {submitError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', backgroundColor: '#fef2f2', padding: 10, borderRadius: 12, border: '1px solid #fee2e2', marginTop: 12 }}>
                        <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 400 }}>{submitError}</span>
                      </div>
                    )}
                  </StepCard>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      
      {/* Legal Disclaimer Modal */}
      <LegalDisclaimerModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
        initialTab={legalModalTab}
      />
    </div>
  );
}

// --- SUB-COMPONENTS (MEMOIZED CARDS) ---

const StepCard = memo(({ number, number2, title, children, actions, className, isXM, disableEffects, disableBackdropBlur }: any) => {
  const useRed = typeof number2 === "number";
  const n = useRed ? number2 : number;
  return (
    <motion.div
      className={cn("apple-card", className)}
      initial={{ opacity: 0, rotateX: 8, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
        perspective: 1200,
        transformStyle: 'preserve-3d' as any,
      }}
    >
      {/* Subtle top-edge highlight for 3D depth */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', zIndex: 20, pointerEvents: 'none' }} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotateY: -20 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, position: 'relative', zIndex: 10 }}
      >
        <img src="/IMG_2921.PNG" alt="BullMoney" className="icon-float" style={{ width: 40, height: 40, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
      </motion.div>

      {/* Animated progress bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, position: 'relative', zIndex: 10 }}
      >
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {[1, 2, 3].map((dot) => (
            <div
              key={dot}
              style={{
                height: 4,
                borderRadius: 9999,
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.08)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {dot <= n && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 + dot * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#000',
                    borderRadius: 9999,
                    transformOrigin: 'left',
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontWeight: 500, letterSpacing: '0.02em' }}
        >
          {n}/3
        </motion.span>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, position: 'relative', zIndex: 10, color: '#000', letterSpacing: '-0.02em' }}
      >
        {title}
      </motion.h3>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ flex: 1, position: 'relative', zIndex: 10 }}
      >
        {children}
      </motion.div>
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', position: 'relative', zIndex: 10 }}
        >
          {actions}
        </motion.div>
      )}
    </motion.div>
  );
});
StepCard.displayName = "StepCard";

function IconPlusCorners() {
  return (
    <>
      <Plus className="absolute h-4 w-4 -top-2 -left-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -bottom-2 -left-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -top-2 -right-2 text-white/70" />
      <Plus className="absolute h-4 w-4 -bottom-2 -right-2 text-white/70" />
    </>
  );
}

const characters = "BULLMONEY";
const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// --- XM Card (Red Neon Glow) ---
export const EvervaultCard = memo(({ text }: { text?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  useEffect(() => { setRandomString(generateRandomString(1500)); }, []);
  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }
  return (
    <div className="p-0.5 bg-transparent aspect-square flex items-center justify-center w-full h-full relative">
      <div 
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center border border-black/[0.2] dark:border-white/[0.2]"
      >
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-44 w-44 rounded-full flex items-center justify-center text-white font-bold text-4xl">
            <div className="absolute w-full h-full bg-white/[0.8] dark:bg-black/[0.8] blur-sm rounded-full" />
            <span className="dark:text-white text-black z-20">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
EvervaultCard.displayName = "EvervaultCard";

function CardPattern({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div 
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" 
        style={style}
      />
      <motion.div className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
};

// --- Vantage Card (Blue Neon Glow) ---
export const EvervaultCardRed = memo(({ text }: { text?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");
  useEffect(() => { setRandomString(generateRandomString(1500)); }, []);
  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }
  return (
    <div className="p-0.5 bg-transparent aspect-square flex items-center justify-center w-full h-full relative">
      <div 
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center border border-black/[0.2] dark:border-white/[0.2]"
      >
        <CardPatternRed mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-44 w-44 rounded-full flex items-center justify-center text-white font-bold text-4xl">
            <div className="absolute w-full h-full bg-white/[0.8] dark:bg-black/[0.8] blur-sm rounded-full" />
            <span className="dark:text-white text-black z-20">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
EvervaultCardRed.displayName = "EvervaultCardRed";

function CardPatternRed({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div 
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500" 
        style={style}
      />
      <motion.div className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100" style={style}>
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">{randomString}</p>
      </motion.div>
    </div>
  );
}
