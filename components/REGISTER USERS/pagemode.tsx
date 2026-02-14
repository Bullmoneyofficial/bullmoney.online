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

// --- SIMPLE SPLINE BACKGROUND COMPONENT (MOBILE) ---
// Preloaded scene, interactive, loads fast - z-index 0 so menus overlay properly
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
  const useSafeSplineFilters = runtimeProfile.isInAppBrowser || runtimeProfile.isWebView || runtimeProfile.isLowMemory;
  
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
  }, []);

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
      {!useSafeSplineFilters && (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="grayscale-filter-mobile">
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.1" />
                <feFuncG type="linear" slope="1.1" />
                <feFuncB type="linear" slope="1.1" />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      )}
      <div
        className="absolute inset-0 welcome-spline-canvas-host"
        style={{
          filter: useSafeSplineFilters
            ? 'grayscale(100%) saturate(0)'
            : 'url(#grayscale-filter-mobile) grayscale(100%) saturate(0) contrast(1.1)',
          WebkitFilter: useSafeSplineFilters
            ? 'grayscale(100%) saturate(0)'
            : 'grayscale(100%) saturate(0) contrast(1.1)',
        } as React.CSSProperties}
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
            filter: 'grayscale(100%) saturate(0)',
            WebkitFilter: 'grayscale(100%) saturate(0)',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          } as React.CSSProperties}
        />
      </div>

      {!useSafeSplineFilters ? (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              backgroundColor: 'rgb(128, 128, 128)',
              mixBlendMode: 'color',
              WebkitMixBlendMode: 'color',
            } as React.CSSProperties}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              zIndex: 1,
              backgroundColor: 'rgba(128, 128, 128, 0.3)',
              mixBlendMode: 'saturation',
              WebkitMixBlendMode: 'saturation',
            } as React.CSSProperties}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            backgroundColor: 'rgba(110, 110, 110, 0.16)',
          }}
        />
      )}
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
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes apple-scale-in {
    from {
      opacity: 0;
      transform: scale(0.94);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes apple-slide-in {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes apple-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.85;
    }
  }

  /* Apple button hover effect */
  .apple-button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .apple-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.25);
  }

  .apple-button:active {
    transform: translateY(0);
  }

  /* Card animation */
  .apple-card {
    animation: apple-scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Text fade in */
  .apple-text-fade {
    animation: apple-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* Input focus effect */
  .apple-input {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .apple-input:focus {
    transform: scale(1.01);
  }

  /* Progress indicator */
  @keyframes progress-fill {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
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
      const res = await fetch('/api/recruit-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          mt5_id: formData.mt5Number,
          referred_by_code: formData.referralCode || null,
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
        isWelcomeScreen ? "bg-black p-0" : "bg-white px-4 py-6 md:p-4",
        !isWelcomeScreen && "md:overflow-hidden md:h-screen",
        isIOSInAppShield && "pagemode-ios-shield"
         )}
          style={{ position: 'relative', minHeight: 'calc(var(--pagemode-vh, 1vh) * 100)' }}>
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
        <div className="w-full md:fixed md:top-6 lg:top-8 md:left-0 md:right-0 flex flex-col items-center pt-6 md:pt-8 pb-4 md:pb-6 bg-white/95 backdrop-blur-md mb-8 md:mb-0 z-50 border-b border-black/[0.08]" style={{ zIndex: 100 }}>
          <div className="mb-3 md:mb-4 text-center w-full">
             <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white" style={{ animation: 'apple-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              BULLMONEY <span className="text-white" style={{ fontWeight: 900 }}>FREE</span>
            </h1>
          </div>
          <div className="w-full max-w-xl h-1 bg-black/[0.08] opacity-70 transition-all duration-500 rounded-full" />
        </div>
      )}

      {/* RENDER CONTENT ONLY IF NOT LOADING */}
      <div className={cn(
        // Opacity transition for a smooth reveal after loading is done
        "transition-opacity duration-500 w-full max-w-xl mx-auto flex flex-col items-center md:pt-32 lg:pt-36",
        loading ? "opacity-0 pointer-events-none" : "opacity-100"
      )} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

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
                {/* Minimalistic Branding Header - Clean Apple-style */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 pt-10 pb-5 text-center pointer-events-none"
                >
                  <motion.h1
                    className="relative text-[clamp(1.8rem,6vw,2.4rem)] font-semibold tracking-tight"
                    style={{
                      color: 'rgb(255, 255, 255)',
                      textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    BullMoney
                  </motion.h1>
                </motion.div>

                {/* Main Content Area - Apple-style centered card */}
                <div
                  className="relative flex-1 flex flex-col items-center justify-center px-4 w-full pb-6"
                  style={{ zIndex: 10, pointerEvents: 'auto' }}
                >
                  {/* Clean Card Container - Apple-style minimal (35% smaller on mobile) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[13rem] rounded-xl p-4 sm:max-w-[20rem] sm:rounded-2xl sm:p-7 border border-black/[0.08] apple-card"
                    style={{
                      background: 'rgb(255, 255, 255)',
                      boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    {/* Clean title */}
                    <h2 className="text-base sm:text-xl font-semibold text-black mb-1.5 sm:mb-2 text-center">
                      Get Started
                    </h2>
                    <p className="text-black/50 text-xs sm:text-sm mb-5 sm:mb-8 text-center font-normal">
                      Choose how to continue
                    </p>

                    {/* Clean Button Stack - 35% smaller on mobile */}
                    <div className="flex flex-col gap-2 sm:gap-3">
                      {/* Primary Button - Black solid (Sign In First) */}
                      <motion.button
                        onClick={() => {
                          setViewMode('login');
                          setStep(0);
                        }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all apple-button text-white"
                        style={{
                          background: 'rgb(0, 0, 0)',
                          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
                        }}
                      >
                        Sign In
                      </motion.button>

                      {/* Secondary Button - Black border */}
                      <motion.button
                        onClick={() => {
                          setViewMode('register');
                          setStep(0);
                        }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all text-black bg-white border border-black/20 hover:border-black/40"
                      >
                        Create Account
                      </motion.button>

                      {/* Minimal Divider */}
                      <div className="flex items-center gap-2 sm:gap-3 my-1 sm:my-2">
                        <div className="flex-1 h-[0.5px] bg-black/[0.08]" />
                        <span className="text-black/30 text-[10px] sm:text-xs font-normal">or</span>
                        <div className="flex-1 h-[0.5px] bg-black/[0.08]" />
                      </div>

                      {/* Guest Button - Light gray */}
                      <motion.button
                        onClick={() => setStep(-2)}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl font-normal text-[11px] sm:text-[13px] transition-all text-black/70 hover:text-black bg-gray-100 hover:bg-gray-200"
                      >
                        Continue as Guest
                      </motion.button>
                    </div>

                    {/* Clean Footer */}
                    <p className="text-center text-black/30 text-[10px] sm:text-xs mt-4 sm:mt-6 font-normal leading-relaxed">
                      By continuing, you agree to our{' '}
                      <button 
                        type="button"
                        onClick={() => { setLegalModalTab('terms'); setIsLegalModalOpen(true); }}
                        className="text-black/50 hover:text-black/70 transition-colors"
                      >
                        Terms
                      </button>
                      {' and '}
                      <button 
                        type="button"
                        onClick={() => { setLegalModalTab('privacy'); setIsLegalModalOpen(true); }}
                        className="text-black/50 hover:text-black/70 transition-colors"
                      >
                        Privacy Policy
                      </button>
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
                ...(iosInAppShieldStyle ?? {}),
              }}
            >
              {/* Back Button - Apple Style */}
              <button
                onClick={() => setStep(-1)}
                className="fixed top-5 right-4 flex items-center gap-2 text-black text-sm font-medium transition-all cursor-target py-2 px-3.5 rounded-xl z-50 apple-button"
                style={{
                  pointerEvents: 'auto',
                  background: 'rgb(255, 255, 255)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 pt-16 pb-8 text-center"
                style={{ pointerEvents: 'none' }}
              >
                <h1 className="text-[2.5rem] font-semibold tracking-tight text-black" style={{ letterSpacing: '-0.04em' }}>
                  BullMoney
                </h1>
                <p className="text-base text-black/50 mt-2 font-normal">
                  Trading Excellence
                </p>
              </motion.div>

              {/* Card */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 w-full pb-12 relative z-10" style={{ pointerEvents: 'auto' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-3xl p-8 text-center w-full max-w-sm border border-black/[0.06] shadow-lg apple-card"
                  style={{ background: 'rgb(255, 255, 255)' }}
                >
                  <div className="mb-6 flex justify-center">
                    <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                      <User className="w-7 h-7 text-black/40" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-black mb-2 tracking-tight">Guest Access</h2>
                  <p className="text-sm text-black/50 mb-8 leading-relaxed font-normal">
                    Browse without an account.<br />
                    Some features may be limited.
                  </p>
                  <motion.button
                    onClick={() => { setStep(99); onUnlock(); }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl font-semibold text-base transition-all apple-button"
                    style={{ background: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)' }}
                  >
                    Continue to Site
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[99999998] apple-card"
            style={{ minHeight: '100dvh', height: 'calc(var(--pagemode-vh, 1vh) * 100)', ...(iosInAppShieldStyle ?? {}) }}
          >
             {/* Back Button - Apple Style */}
             <button 
               onClick={() => setStep(-1)} 
               className="fixed top-20 left-4 lg:top-24 lg:left-6 flex items-center gap-2 text-black hover:text-black/70 text-sm lg:text-base font-semibold transition-all cursor-target py-2.5 px-4 rounded-xl bg-white border border-black/10 hover:border-black/20 shadow-sm z-[2147483646] apple-button"
             >
               <ChevronLeft className="w-5 h-5" /> Back
             </button>
             
             <div className="bg-white p-8 md:p-10 rounded-3xl relative overflow-hidden w-full max-w-md mx-4 border border-black/[0.06] shadow-lg">
                
                <h2 className="text-2xl md:text-3xl font-semibold mb-2 relative z-10 text-black tracking-tight">Sign In</h2>
                    <p className="mb-8 relative z-10 text-sm md:text-base text-black/50 font-normal">Access your account</p>

                <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10" autoComplete="on">
                   <div className="relative group">
                      <input
                        autoFocus
                        type="email"
                        name="email"
                        id="login-email"
                        autoComplete="username"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full bg-white border border-black/[0.1] rounded-xl px-4 py-4 !text-black transition-all focus:outline-none focus:border-black/30 text-base placeholder-black/30 apple-input"
                        style={{ color: 'rgb(0, 0, 0)' }}
                      />
                    </div>

                   <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="login-password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-white border border-black/[0.1] rounded-xl px-4 py-4 pr-12 !text-black transition-all focus:outline-none focus:border-black/30 text-base placeholder-black/30 apple-input"
                        style={{ color: 'rgb(0, 0, 0)' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors cursor-target text-black/30 hover:text-black/60"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {submitError && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl flex items-center gap-2 border border-red-100">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!loginEmail || !loginPassword}
                      className="relative z-10 w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-target text-base apple-button"
                      style={{
                        background: 'rgb(0, 0, 0)', 
                        color: 'rgb(255, 255, 255)',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      Sign In
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-black/[0.06] pt-6"> 
                  <button onClick={toggleViewMode} className="text-sm transition-colors cursor-target text-black/50 hover:text-black/70 font-normal">
                    Don&apos;t have an account? <span className="text-black">Create one</span>
                  </button>
                </div>
             </div>
          </motion.div>
        ) : (
          /* ================= UNLOCK FLOW VIEW ================= */
          <>
            {step === 1 && (
              <div className="flex justify-center gap-2 md:gap-3 mb-6 md:mb-8">
                {(["Vantage", "XM"] as const).map((partner) => {
                  const isActive = activeBroker === partner;
                  const isPartnerXM = partner === 'XM';
                  return (
                    <button
                      key={partner}
                      onClick={() => handleBrokerSwitch(partner)}
                      className={cn(
                        "relative px-5 md:px-6 py-2 rounded-full font-semibold transition-all duration-300 z-20 cursor-target text-sm md:text-base apple-button",
                        isActive 
                          ? "text-black bg-white shadow-md" 
                          : "bg-white/70 border border-black/10 text-black/60 hover:bg-white/90"
                      )}
                    >
                      {partner}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* --- SCREEN 1: ENTRY GATE (Step 0) - APPLE STYLE --- */}
              {step === 0 && (
                 <motion.div
                  key="step0-apple"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[99999998] apple-card"
                  style={{ minHeight: '100dvh', height: 'calc(var(--pagemode-vh, 1vh) * 100)', ...(iosInAppShieldStyle ?? {}) }}
                 >
                   {/* Back Button - Apple Style */}
                   <button 
                     onClick={() => {
                       if (returnToAccountManager) {
                         localStorage.removeItem('return_to_account_manager');
                         router.push('/?openAccountManager=true');
                       } else {
                         setStep(-1);
                       }
                     }} 
                     className="fixed top-20 left-4 lg:top-24 lg:left-6 flex items-center gap-2 text-black hover:text-black/70 text-sm lg:text-base font-semibold transition-all cursor-target py-2.5 px-4 rounded-xl bg-white border border-black/10 hover:border-black/20 shadow-sm z-[2147483646] apple-button"
                   >
                     <ChevronLeft className="w-5 h-5" /> {returnToAccountManager ? 'Back to Account Manager' : 'Back'}
                   </button>
                   
                   <div className="bg-white p-8 md:p-10 rounded-3xl relative overflow-hidden text-center w-full max-w-md mx-4 border border-black/[0.06] shadow-lg" style={{ zIndex: 1 }}>
                      
                      {/* Icon */}
                      <div className="mb-6 flex justify-center">
                         <div className="h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                           <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-black/40" />
                         </div>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-semibold mb-3 relative z-10 text-black tracking-tight">Free Access</h2>
                       <p className="text-sm md:text-base mb-8 max-w-sm mx-auto leading-relaxed relative z-10 text-black/50 font-normal"> 
                        Trading setups and community access.<br/>
                        <span className="text-black/40">No payment required.</span>
                      </p>

                      <motion.button 
                        onClick={handleNext}
                        whileTap={{ scale: 0.98 }}
                        className="relative z-10 w-full py-4 md:py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center cursor-target apple-button"
                        style={{ background: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)' }}
                      >
                        Get Started
                      </motion.button>
                      
                      <div className="mt-6 space-y-3 relative z-10">
                         <div className="flex items-center justify-center gap-2 text-xs text-black/40">
                             <Lock className="w-3 h-3" /> No credit card required
                         </div>

                         <motion.button 
                           onClick={toggleViewMode}
                           whileTap={{ scale: 0.98 }}
                          className="w-full py-3 rounded-xl text-sm font-normal transition-all text-black/50 hover:text-black/70"
                          style={{ background: 'transparent' }}
                         >
                            Already have an account? Sign in
                         </motion.button>
                      </div>
                   </div>
                 </motion.div>
              )}

              {/* --- SCREEN 2: OPEN ACCOUNT (Step 1) --- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col items-center justify-center"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                >
                  <StepCard
                    {...getStepProps(1)}
                    title="Open Free Account"
                    className="register-card w-full max-w-md mx-auto"
                    isXM={isXM}
                    disableEffects={true}
                    disableBackdropBlur={disableBackdropBlur}
                    actions={
                      <div className="flex flex-col gap-3 md:gap-4">
                        <p className="text-xs text-center flex items-center justify-center gap-1.5 text-black/40">
                          <Clock className="w-3.5 h-3.5" /> Takes 1 minute · No deposit required
                        </p>
                        
                        <div className="flex flex-col items-center justify-center gap-2.5 md:gap-3">
                           {/* Copy button - Apple style */}
                          <button
                            onClick={() => copyCode(brokerCode)}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 md:py-4 text-sm font-semibold transition cursor-target w-full justify-center text-black apple-button bg-white border border-black/10"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span>{copied ? "Copied" : `Copy Code: ${brokerCode}`}</span>
                          </button>

                           {/* Primary action button - Black */}
                          <button
                            onClick={handleBrokerClick}
                            className="w-full py-4 md:py-4 rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-target text-base apple-button text-white"
                            style={{ 
                              background: 'rgb(0, 0, 0)', 
                              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)' 
                            }}
                          >
                            <span>Open Free Account</span>
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Secondary button */}
                        <button 
                            onClick={handleNext}
                            className="w-full py-3.5 md:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-target text-base apple-button text-white"
                            style={{
                              background: 'rgb(0, 0, 0)',
                              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)'
                            }}
                        >
                            Sign In
                        </button>
                      </div>
                    }
                  >
                    <p className="text-sm md:text-[15px] leading-relaxed mb-4 text-center text-black/60">
                      BullMoney works with regulated brokers. <br className="hidden md:block" />
                      This free account lets us verify your access.
                    </p>
                    
                    {/* Simple broker icon */}
                    <div className="relative mx-auto w-full max-w-[240px] md:max-w-[280px] h-28 md:h-32 rounded-2xl overflow-hidden mb-2 bg-black/[0.03] border border-black/[0.06] flex items-center justify-center">
                      <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-black/20" />
                      <span className="absolute text-lg md:text-xl font-semibold text-black/30">{brokerCode}</span>
                    </div>

                  </StepCard>
                </motion.div>
              )}

              {/* --- SCREEN 3: VERIFY ID (Step 2) --- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col items-center justify-center"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                >
                  <StepCard
                    {...getStepProps(2)}
                    title="Confirm Your Account ID"
                    className="register-card w-full max-w-md mx-auto"
                    isXM={isXM}
                    disableEffects={shouldReduceEffects}
                    disableBackdropBlur={disableBackdropBlur}
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.mt5Number}
                        className="w-full py-3 md:py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-target text-base apple-button disabled:opacity-40 disabled:cursor-not-allowed text-white"
                        style={{ background: 'rgb(0, 0, 0)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)' }}
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </button>
                    }
                  >
                    <div className="space-y-3 md:space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                          <p className="text-black/60 text-sm">After opening your account, you&apos;ll receive an email with your trading ID (MT5 ID).</p>
                      </div>
                      
                      <div className="relative group">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30 w-5 h-5 group-focus-within:text-black/60 transition-colors" />
                        <input
                          autoFocus
                          type="tel"
                          name="mt5Number"
                          value={formData.mt5Number}
                          onChange={handleChange}
                          placeholder="Enter MT5 ID (numbers only)"
                          className="w-full bg-white border border-black/10 rounded-xl pl-10 pr-4 py-3.5 md:py-4 !text-black placeholder-black/30 focus:outline-none focus:border-black/30 transition-all cursor-target text-base apple-input"
                          style={{ color: 'rgb(0, 0, 0)' }}
                        />
                      </div>
                      <p className="text-xs text-black/40 flex items-center gap-1"><Lock className="w-3 h-3"/> Used only to verify access</p>
                    </div>
                  </StepCard>
                  <button onClick={handleBack} className="mt-3 md:mt-4 flex items-center text-black/50 hover:text-black/70 text-sm mx-auto transition-colors cursor-target">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                </motion.div>
              )}

              {/* --- SCREEN 4: CREATE LOGIN (Step 3) --- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col items-center justify-center"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                >
                  <StepCard
                    {...getStepProps(3)}
                    title="Create Account"
                    className="register-card w-full max-w-md mx-auto"
                    isXM={isXM}
                    disableEffects={true}
                    disableBackdropBlur={disableBackdropBlur}
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.email || !formData.password || !acceptedTerms}
                        className="w-full py-4 md:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-target text-base text-white disabled:opacity-40 disabled:cursor-not-allowed apple-button"
                        style={{ background: 'rgb(0, 0, 0)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)' }}
                      >
                        Complete Registration
                      </button>
                    }
                  >
                     <p className="text-xs md:text-sm mb-6 text-black/50 font-normal">Access setups, tools, and the community.</p>
                    <div className="space-y-4 md:space-y-4 pt-1">
                      <div>
                        <div className="relative group">
                          <input
                            autoFocus
                            type="email"
                            name="email"
                            autoComplete="username"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email address"
                            className="w-full bg-white border border-black/[0.1] rounded-xl px-4 py-4 !text-black transition-all cursor-target text-base placeholder-black/30 focus:outline-none focus:border-black/30 apple-input"
                            style={{ color: 'rgb(0, 0, 0)' }}
                          />
                        </div>
                        <p className="text-[10px] mt-1.5 ml-1 text-black/40">We&apos;ll send your login details here.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create password (min 6 chars)"
                            className="w-full bg-white border border-black/[0.1] rounded-xl px-4 pr-12 py-4 !text-black transition-all cursor-target text-base placeholder-black/30 focus:outline-none focus:border-black/30 apple-input"
                            style={{ color: 'rgb(0, 0, 0)' }}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors cursor-target text-black/30 hover:text-black/60"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] mt-1.5 ml-1 text-black/40">Must be at least 6 characters.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <input
                            type="text"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleChange}
                            placeholder="Referral Code (Optional)"
                            className="w-full bg-white border border-black/[0.1] rounded-xl px-4 py-4 !text-black transition-all cursor-target text-base placeholder-black/30 focus:outline-none focus:border-black/30 apple-input"
                            style={{ color: 'rgb(0, 0, 0)' }}
                          />
                        </div>
                        <p className="text-[10px] mt-1.5 ml-1 text-black/40">Leave blank if you don&apos;t have one.</p>
                      </div>

                        <div
                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                        className="flex items-start gap-3 p-4 rounded-xl bg-black/[0.02] cursor-pointer transition-colors cursor-target border border-black/[0.06]"
                      >
                        <div 
                          onClick={() => setAcceptedTerms(!acceptedTerms)}
                          className="w-5 h-5 rounded border border-black/20 flex items-center justify-center mt-0.5 transition-colors shrink-0 cursor-pointer"
                          style={{ background: acceptedTerms ? 'rgb(0, 0, 0)' : 'transparent' }}
                        >
                          {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-black/50 leading-relaxed font-normal">
                            I agree to the{' '}
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLegalModalTab('terms'); setIsLegalModalOpen(true); }}
                              className="text-black hover:text-black/70 transition-colors"
                            >
                              Terms of Service
                            </button>
                            {', '}
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLegalModalTab('privacy'); setIsLegalModalOpen(true); }}
                              className="text-black hover:text-black/70 transition-colors"
                            >
                              Privacy Policy
                            </button>
                            {', and '}
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLegalModalTab('disclaimer'); setIsLegalModalOpen(true); }}
                              className="text-black hover:text-black/70 transition-colors"
                            >
                              Disclaimer
                            </button>
                            . I understand this is educational content only.
                          </p>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 mt-4">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-normal">{submitError}</span>
                      </div>
                    )}
                  </StepCard>

                  <button onClick={handleBack} className="mt-4 md:mt-5 flex items-center text-sm mx-auto transition-colors cursor-target text-white/50 hover:text-white/70 font-normal"> 
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
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
    <div className={cn(
      "group relative overflow-hidden rounded-3xl p-6 md:p-10 apple-card bg-white border border-black/[0.06] shadow-lg",
      className
    )}>
      
      <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
        <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-black/[0.03] border border-black/[0.06] text-black/40 font-normal">
          Step {n} of 3
        </span>
      </div>
      <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 relative z-10 text-black tracking-tight">{title}</h3>
      <div className="flex-1 relative z-10">{children}</div>
      {actions && <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-black/[0.06] relative z-10">{actions}</div>}
    </div>
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
