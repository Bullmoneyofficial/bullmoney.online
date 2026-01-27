"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, memo, lazy, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import { gsap } from 'gsap';
import dynamic from 'next/dynamic';

// Dynamic import for Spline component (used for local .splinecode files)
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});
import { trackEvent, BullMoneyAnalytics } from '@/lib/analytics';
import {
  Check, Mail, Hash, Lock,
  ArrowRight, ChevronLeft, ExternalLink, AlertCircle,
  Copy, Plus, Eye, EyeOff, FolderPlus, Loader2, ShieldCheck, Clock, User, Send
} from 'lucide-react';

import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

// --- UNIFIED SHIMMER SYSTEM ---
import { ShimmerLine, ShimmerBorder, ShimmerSpinner, ShimmerRadialGlow } from '@/components/ui/UnifiedShimmer';

// --- UI STATE CONTEXT ---
import { useUIState, UI_Z_INDEX } from "@/contexts/UIStateContext";

// --- IMPORT SEPARATE LOADER COMPONENT ---
import { MultiStepLoader} from "@/components/Mainpage/MultiStepLoader";
import { TelegramConfirmationResponsive } from "./TelegramConfirmationResponsive";

// --- DESKTOP WELCOME SCREEN (separate layout for larger screens) ---
import { WelcomeScreenDesktop } from "./WelcomeScreenDesktop";

// --- ULTIMATE HUB COMPONENTS (for mobile welcome screen to match desktop) ---
import { UnifiedFpsPill, UnifiedHubPanel, useLivePrices } from '@/components/UltimateHub';
import { createPortal } from 'react-dom';

// Available Spline scenes - scene1 is preloaded in layout.tsx for fastest first load
const SPLINE_SCENES = ['/scene1.splinecode', '/scene.splinecode', '/scene2.splinecode', '/scene4.splinecode', '/scene5.splinecode', '/scene6.splinecode'];

// Detect low memory / constrained environments
const isLowMemoryDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  
  const ua = navigator.userAgent.toLowerCase();
  
  // iOS Safari and in-app browsers (Facebook, Instagram, TikTok, Twitter, LinkedIn, etc.)
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
  const isInAppBrowser = /fban|fbav|instagram|twitter|linkedin|snapchat|tiktok|wechat|line|telegram/i.test(ua);
  
  // Check for low device memory (Chrome/Edge expose this)
  const deviceMemory = (navigator as any).deviceMemory;
  const isLowRAM = deviceMemory !== undefined && deviceMemory < 4;
  
  // Check for low CPU cores
  const hardwareConcurrency = navigator.hardwareConcurrency;
  const isLowCPU = hardwareConcurrency !== undefined && hardwareConcurrency < 4;
  
  // Older/budget Android devices
  const isOldAndroid = /android [1-7]\./i.test(ua);
  
  // WebView detection (apps embedding browsers)
  const isWebView = /wv|webview/i.test(ua) || (isIOS && !/safari/i.test(ua));
  
  return (
    (isIOS && isSafari) || // iOS Safari has strict memory limits
    isInAppBrowser ||       // In-app browsers are very constrained
    isWebView ||            // WebViews have limited resources
    isLowRAM ||             // Low RAM devices
    isLowCPU ||             // Low CPU devices
    isOldAndroid            // Old Android versions
  );
};

// --- SIMPLE SPLINE BACKGROUND COMPONENT (MOBILE) ---
// Preloaded scene, interactive, loads fast - z-index 0 so menus overlay properly
const WelcomeSplineBackground = memo(function WelcomeSplineBackground() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const splineRef = useRef<any>(null);
  
  // Always use scene1 for fastest cold start and reliable reloads
  const [scene] = useState(() => {
    if (typeof window === 'undefined') return SPLINE_SCENES[0];
    return SPLINE_SCENES[0];
  });

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

    fetch(scene, { cache: 'force-cache' }).catch(() => undefined);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [scene]);

  // Timeout fallback - if Spline doesn't load in 10 seconds, show fallback and retry
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.warn('[WelcomeSpline] Load timeout - showing fallback');
        setLoadTimeout(true);
        if (retryCount < 2) {
          const retryTimer = setTimeout(() => {
            setRetryCount((count) => count + 1);
            setRetryKey((key) => key + 1);
            setHasError(false);
            setLoadTimeout(false);
          }, 400);
          return () => clearTimeout(retryTimer);
        }
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isLoaded, retryCount]);

  const handleLoad = useCallback((splineApp: any) => {
    splineRef.current = splineApp;
    setIsLoaded(true);
    setHasError(false);
    setLoadTimeout(false);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('[WelcomeSpline] Load error:', error);
    setHasError(true);
    if (retryCount < 2) {
      setTimeout(() => {
        setRetryCount((count) => count + 1);
        setRetryKey((key) => key + 1);
        setHasError(false);
        setLoadTimeout(false);
        setIsLoaded(false);
      }, 500);
    }
  }, []);

  // Show animated gradient fallback if Spline fails or times out
  const showFallback = hasError || (!isLoaded && loadTimeout);

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ 
        zIndex: 0,
        touchAction: 'pan-y pinch-zoom', // Allow scrolling but let Spline handle other gestures
        backgroundColor: '#000',
      }}
    >
      {/* Animated gradient fallback - always visible as base layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 30%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(147, 51, 234, 0.08) 0%, transparent 40%), #000',
          opacity: showFallback || !isLoaded ? 1 : 0.2,
          transition: 'opacity 500ms ease-out',
        }}
      >
        {/* Subtle animated glow for visual interest when no Spline */}
        {showFallback && (
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Spline scene - always render, fallback stays visible until loaded */}
      <Spline
        key={`welcome-spline-${retryKey}`}
        scene={scene}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          opacity: isLoaded ? 1 : 0.6,
          transition: 'opacity 400ms ease-out',
          willChange: 'opacity',
        }}
      />
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

// --- 2. INTERNAL CSS FOR SCROLL LOCK & SHIMMER ANIMATION & NEON STYLES ---
const NEON_GLOBAL_STYLES = `
  @keyframes neon-pulse {
    0%, 100% { 
      text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
      filter: brightness(1);
    }
    50% { 
      text-shadow: 0 0 6px #3b82f6, 0 0 12px #3b82f6;
      filter: brightness(1.1);
    }
  }

  @keyframes neon-glow {
    0%, 100% { 
      box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6;
    }
    50% { 
      box-shadow: 0 0 6px #3b82f6, 0 0 12px #3b82f6, inset 0 0 6px #3b82f6;
    }
  }

  .neon-blue-text {
    color: #3b82f6;
    text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
    animation: neon-pulse 2s ease-in-out infinite;
  }

  .neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }

  .neon-white-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }

  .neon-blue-icon {
    filter: drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6);
  }

  .neon-red-icon {
    filter: drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 8px #ef4444);
  }

  .neon-blue-border {
    border: 2px solid #3b82f6;
    box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px #3b82f6;
    animation: neon-glow 2s ease-in-out infinite;
  }

  .neon-blue-bg {
    background: #3b82f6;
    box-shadow: 0 0 8px #3b82f6, 0 0 16px #3b82f6;
  }

  /* Pulse animation for Spline fallback */
  @keyframes pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.02); }
  }

  .neon-red-text {
    color: #ef4444;
    text-shadow: 0 0 4px #ef4444, 0 0 8px #ef4444;
    animation: neon-pulse-red 2s ease-in-out infinite;
  }

  .neon-red-border {
    border: 2px solid #ef4444;
    box-shadow: 0 0 4px #ef4444, 0 0 8px #ef4444, inset 0 0 4px #ef4444;
    animation: neon-glow-red 2s ease-in-out infinite;
  }

  @keyframes neon-pulse-red {
    0%, 100% { 
      text-shadow: 0 0 4px #ef4444, 0 0 8px #ef4444;
      filter: brightness(1);
    }
    50% { 
      text-shadow: 0 0 6px #ef4444, 0 0 12px #ef4444;
      filter: brightness(1.1);
    }
  }

  @keyframes neon-glow-red {
    0%, 100% { 
      box-shadow: 0 0 4px #ef4444, 0 0 8px #ef4444, inset 0 0 4px #ef4444;
    }
    50% { 
      box-shadow: 0 0 6px #ef4444, 0 0 12px #ef4444, inset 0 0 6px #ef4444;
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
    /* Input autofill styling override */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active{
        -webkit-box-shadow: 0 0 0 30px #171717 inset !important;
        -webkit-text-fill-color: white !important;
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

    /* === SHIMMER ANIMATIONS - Using unified system from UnifiedShimmer.tsx === */
    /* These are fallback styles - prefer using ShimmerLine component directly */
    
    .shimmer-ltr {
      position: relative;
      overflow: hidden;
    }

    .shimmer-ltr::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(59, 130, 246, 0.15) 25%,
        rgba(59, 130, 246, 0.3) 50%,
        rgba(59, 130, 246, 0.15) 75%,
        transparent 100%
      );
      animation: unified-shimmer-ltr 2.5s ease-in-out infinite;
      pointer-events: none;
      z-index: 1;
      will-change: transform;
      transform: translateZ(0);
    }

    .shimmer-text {
      background: linear-gradient(
        90deg,
        #60a5fa 0%,
        #93c5fd 25%,
        #dbeafe 50%,
        #93c5fd 75%,
        #60a5fa 100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer-text 3s ease-in-out infinite;
      will-change: background-position;
    }
    
    @keyframes shimmer-text {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    
    /* FPS-aware quality control integration */
    html.shimmer-quality-low .shimmer-ltr::before,
    html.shimmer-quality-disabled .shimmer-ltr::before {
      animation: none !important;
    }
    
    html.shimmer-quality-low .shimmer-text {
      animation-duration: 6s;
    }
    
    html.is-scrolling .shimmer-ltr::before {
      animation-play-state: paused;
    }

    /* === MOBILE VIEWPORT FIXES FOR SAFARI & IN-APP BROWSERS === */
    .register-container {
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
    /* Safari has issues with flexbox centering on full viewport height */
    /* This ensures content is properly centered in the middle of the view */
    .register-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
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
  const [isRefresh, setIsRefresh] = useState(false);
  const [isCelebration, setIsCelebration] = useState(false);
  const [confirmationClicked, setConfirmationClicked] = useState(false);
  
  // --- DESKTOP DETECTION FOR WELCOME SCREEN ---
  const isDesktop = useIsDesktop();

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
  
  // --- INJECT GLOBAL NEON STYLES ---
  useEffect(() => {
    const styleId = 'neon-glow-styles-pagemode';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = NEON_GLOBAL_STYLES;
      document.head.appendChild(style);
    }
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

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
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
      const { data: existingUser } = await supabase
        .from("recruits")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error("This email is already registered. Please Login.");
      }

      const insertPayload = {
        email: formData.email,
        mt5_id: formData.mt5Number,
        password: formData.password, 
        referred_by_code: formData.referralCode || null,
        used_code: true,
      };

      const { data: newUser, error } = await supabase
        .from("recruits")
        .insert([insertPayload])
        .select()
        .single();
      
      if (error) throw error;

      if (newUser) {
        // Save persistent session (both storage keys for compatibility)
        // Include is_vip status (false by default for new users)
        localStorage.setItem("bullmoney_session", JSON.stringify({
          id: newUser.id,
          email: formData.email,
          mt5_id: formData.mt5Number, // Save MT5 ID for affiliate modal persistence
          is_vip: newUser.is_vip || false, // Store VIP status for auto-unlock
          timestamp: Date.now()
        }));
        
        // Also save to recruit auth storage key for immediate auth context detection
        localStorage.setItem("bullmoney_recruit_auth", JSON.stringify({
          recruitId: newUser.id,
          email: formData.email
        }));
        
        // Mark pagemode as completed - user should NEVER see pagemode again
        localStorage.setItem("bullmoney_pagemode_completed", "true");
        
        // Clear draft
        localStorage.removeItem("bullmoney_draft");
        
        // Track successful signup
        BullMoneyAnalytics.trackAffiliateSignup(formData.referralCode || 'direct');
        trackEvent('signup', { 
          method: 'email', 
          broker: activeBroker,
          source: 'pagemode' 
        });
      }

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
      const { data, error } = await supabase
        .from("recruits")
        .select("id, mt5_id, is_vip") 
        .eq("email", loginEmail)
        .eq("password", loginPassword) 
        .maybeSingle();

      if (error) throw new Error(error.message);

      if (!data) {
        await new Promise(r => setTimeout(r, 800));
        throw new Error("Invalid email or password.");
      }

      // Save persistent session (both storage keys for compatibility)
      // Include is_vip status for auto-unlocking VIP content in UltimateHub
      localStorage.setItem("bullmoney_session", JSON.stringify({
        id: data.id,
        email: loginEmail,
        mt5_id: data.mt5_id, // Save MT5 ID for affiliate modal persistence
        is_vip: data.is_vip || false, // Store VIP status for auto-unlock
        timestamp: Date.now()
      }));
      
      // Also save to recruit auth storage key for immediate auth context detection
      localStorage.setItem("bullmoney_recruit_auth", JSON.stringify({
        recruitId: data.id,
        email: loginEmail
      }));
      
      // Mark pagemode as completed - user should NEVER see pagemode again
      localStorage.setItem("bullmoney_pagemode_completed", "true");
      
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
    <div className={cn("register-container px-4 py-6 md:p-4 md:overflow-hidden md:h-screen font-sans", isWelcomeScreen ? "bg-transparent" : "bg-black")}
         style={{ position: 'relative' }}>
      <GlobalStyles />

      {/* Shared Spline background for welcome/guest to survive resizes */}
      {/* INTERACTIVE: Touch and mouse events pass through to Spline 3D scene */}
      {isWelcomeScreen && (
        <div
          className="fixed inset-0 w-full h-full overflow-hidden"
          style={{
            zIndex: 0,
            pointerEvents: 'auto',
            touchAction: 'pan-y pinch-zoom',
            width: '100vw',
            minWidth: '100vw',
            height: '100vh',
            minHeight: '100dvh',
            cursor: 'default',
            backgroundColor: '#000', // Prevent white flash during load
          }}
        >
          <WelcomeSplineBackground />
        </div>
      )}
      
      {/* Blue shimmer background - left to right */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 shimmer-ltr opacity-10" />
      </div>
      
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
        <div className="w-full md:fixed md:top-6 lg:top-8 md:left-0 md:right-0 flex flex-col items-center pt-6 md:pt-8 pb-4 md:pb-6 md:bg-black/60 md:backdrop-blur-md mb-8 md:mb-0 z-50" style={{ zIndex: 100 }}>
          <div className="mb-3 md:mb-4 text-center w-full">
             <h1 className={cn("text-3xl md:text-5xl lg:text-6xl font-black tracking-tight", neonTextClass)} style={{ animation: isXM ? 'neon-pulse-red 2s ease-in-out infinite' : 'neon-pulse 2s ease-in-out infinite' }}>
              BULLMONEY <span className={neonTextClass} style={{ animation: isXM ? 'neon-pulse-red 2s ease-in-out infinite' : 'neon-pulse 2s ease-in-out infinite' }}>FREE</span>
            </h1>
          </div>
          <div className={cn("w-full max-w-xl h-1 opacity-70 transition-all duration-500", neonBorderClass)} />
        </div>
      )}

      {/* RENDER CONTENT ONLY IF NOT LOADING */}
      <div className={cn(
        // Opacity transition for a smooth reveal after loading is done
        "transition-opacity duration-500 w-full max-w-xl mx-auto flex flex-col items-center md:pt-32 lg:pt-36",
        loading ? "opacity-0 pointer-events-none" : "opacity-100"
      )} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        {/* Existing background elements */}
        <div className={cn("absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 gpu-accel -z-10", isXM ? "bg-red-900/10" : "bg-blue-900/10")} />

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
            // Mobile Welcome Screen - Glassy transparent design
            <>
              <motion.div
                key="welcome-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="fixed inset-0 flex flex-col"
                style={{ 
                  minHeight: '100dvh', 
                  width: '100vw', 
                  height: '100vh',
                  // Allow touch events to pass through to Spline but capture on UI elements
                  pointerEvents: 'none',
                  zIndex: UI_Z_INDEX.PAGEMODE,
                }}
              >
                {/* Branding Header - Neon Sign Style */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="relative z-10 pt-8 pb-4 text-center pointer-events-none"
                >
                  {/* Neon glow backdrop effect */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)',
                      filter: 'blur(20px)',
                    }}
                  />
                  <motion.h1
                    className="relative text-4xl font-black tracking-wider uppercase"
                    style={{
                      color: '#60a5fa',
                      textShadow: `
                        0 0 5px #3b82f6,
                        0 0 10px #3b82f6,
                        0 0 20px #3b82f6,
                        0 0 40px #3b82f6,
                        0 0 80px #2563eb
                      `,
                      letterSpacing: '0.15em',
                    }}
                    animate={{
                      textShadow: [
                        '0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 40px #3b82f6, 0 0 80px #2563eb',
                        '0 0 8px #60a5fa, 0 0 15px #60a5fa, 0 0 30px #3b82f6, 0 0 60px #3b82f6, 0 0 100px #2563eb',
                        '0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 40px #3b82f6, 0 0 80px #2563eb',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    BULLMONEY
                  </motion.h1>
                  <motion.p
                    className="relative text-sm text-blue-200/80 mt-2 font-semibold tracking-[0.2em] uppercase"
                    style={{
                      textShadow: '0 0 10px rgba(147, 197, 253, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
                    }}
                    animate={{
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    The Ultimate Trading Hub
                  </motion.p>
                </motion.div>

                {/* Main Content Area - Centered (40% smaller for mobile) */}
                <div
                  className="relative flex-1 flex flex-col items-center justify-center gap-2 px-3 w-full max-w-[220px] mx-auto pb-4"
                  style={{ zIndex: 10, pointerEvents: 'auto' }}
                >
                  {/* Ultra-transparent Card Container - Gentle pulse animation until interaction */}
                  <motion.div
                    initial={{ opacity: 0.7, scale: 0.98 }}
                    animate={
                      userInteracted
                        ? { opacity: 1, scale: 1 }
                        : {
                            // Smoother animation - never fully invisible to prevent black flash
                            opacity: [0.5, 0.9, 0.5],
                            scale: [0.97, 1, 0.97],
                          }
                    }
                    transition={
                      userInteracted
                        ? { duration: 0.25, ease: 'easeOut' }
                        : {
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                    }
                    className="w-full rounded-xl p-3 border border-white/10"
                    onMouseEnter={handleUserInteraction}
                    onTouchStart={handleUserInteraction}
                    onClick={handleUserInteraction}
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      // Use simpler blur for better mobile performance
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {/* Action Header */}
                    <div className="text-center mb-3">
                      <h2 className="text-sm font-bold text-white/80 mb-0.5">
                        Get Started
                      </h2>
                      <p className="text-white/30 text-[10px]">
                        Choose how you want to continue
                      </p>
                    </div>

                    {/* Buttons Stack */}
                    <div className="flex flex-col gap-1.5">
                      {/* Sign Up Button - Primary with transparent glass */}
                      <motion.button
                        onClick={() => {
                          setViewMode('register');
                          setStep(0);
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2 rounded-lg font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 text-white"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.6) 100%)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(96, 165, 250, 0.3)',
                        }}
                      >
                        <span>Create Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </motion.button>

                      {/* Login Button - Very transparent glass */}
                      <motion.button
                        onClick={() => {
                          setViewMode('login');
                          setStep(0);
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2 rounded-lg font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 text-blue-300"
                        style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        <span>Login</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </motion.button>

                      {/* Divider */}
                      <div className="flex items-center gap-2 my-0.5">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-white/20 text-[8px]">or</span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>

                      {/* Guest Button - Near invisible glass */}
                      <motion.button
                        onClick={() => {
                          setStep(-2);
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-1.5 rounded-lg font-medium text-[11px] tracking-wide transition-all flex items-center justify-center gap-1.5 text-white/40"
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <User className="w-3 h-3" />
                        <span>Continue as Guest</span>
                      </motion.button>
                    </div>

                    {/* Footer Note */}
                    <p className="text-center text-white/15 text-[7px] mt-2">
                      By continuing, you agree to our Terms of Service
                    </p>
                  </motion.div>
                </div>

                {/* Ultimate Hub Pill - Uses its own fixed positioning (matching desktop) */}
                <UnifiedFpsPill
                  fps={60}
                  deviceTier="high"
                  prices={prices}
                  isMinimized={isHubMinimized}
                  onToggleMinimized={() => setIsHubMinimized(!isHubMinimized)}
                  onOpenPanel={() => setIsHubOpen(true)}
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
                pointerEvents: 'none', // Allow Spline interaction, UI elements override
                zIndex: UI_Z_INDEX.PAGEMODE,
              }}
            >
              {/* Ultra-transparent Back Button - Top Right (UltimateHub is on left) */}
              <button
                onClick={() => setStep(-1)}
                className="fixed top-5 right-4 flex items-center gap-2 text-blue-300 text-sm font-medium transition-all cursor-target py-2 px-3.5 rounded-xl z-50"
                style={{
                  pointerEvents: 'auto',
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {/* Branding Header - Top Center */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 pt-6 pb-2 text-center"
                style={{ pointerEvents: 'none' }}
              >
                <h1
                  className="text-2xl font-black tracking-tight"
                  style={{
                    color: '#3b82f6',
                    textShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6, 0 0 16px #3b82f6',
                  }}
                >
                  BULLMONEY
                </h1>
                <p className="text-xs text-white/30 mt-1 font-medium tracking-wide">
                  The Ultimate Trading Hub
                </p>
              </motion.div>

              {/* Centered Content - Ultra-transparent Card */}
              <div 
                className="flex-1 flex flex-col items-center justify-center gap-6 px-5 w-full max-w-sm mx-auto pb-20 relative z-10"
                style={{ pointerEvents: 'auto' }}
              >
                <motion.div
                  initial={{ opacity: 0.7, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
                  className="rounded-2xl p-6 text-center w-full border border-white/10"
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="mb-4 flex justify-center">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <User className="w-6 h-6 text-white/60" />
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-white/85 mb-2">Continue as Guest</h2>
                  <p className="text-xs text-white/40 mb-5 leading-relaxed">
                    Browse the site without an account.<br />
                    <span className="text-white/25">Some features may be limited.</span>
                  </p>

                  {/* Continue Button - Ultra-transparent */}
                  <motion.button
                    onClick={() => {
                      setStep(99);
                      onUnlock();
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2 text-white/75"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <span>Continue to Site</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Ultimate Hub Pill - Uses its own fixed positioning (matching welcome screen) */}
              <UnifiedFpsPill
                fps={60}
                deviceTier="high"
                prices={prices}
                isMinimized={isHubMinimized}
                onToggleMinimized={() => setIsHubMinimized(!isHubMinimized)}
                onOpenPanel={() => setIsHubOpen(true)}
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

        {/* ================= LOGIN VIEW ================= */}
        {step !== -1 && step !== -2 && viewMode === 'login' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-[99999998]"
            style={{ minHeight: '100dvh' }}
          >
             {/* Back Button - Fixed Left Side Like Ultimate Hub */}
             <button 
               onClick={() => setStep(-1)} 
               className="fixed top-20 left-4 lg:top-24 lg:left-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm lg:text-base font-semibold transition-all cursor-target py-2.5 px-4 rounded-xl bg-black/90 backdrop-blur-xl border border-blue-500/40 hover:border-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] z-[2147483646]"
             >
               <ChevronLeft className="w-5 h-5" /> Back
             </button>
             
             <div className={cn("register-card bg-black/80 backdrop-blur-xl p-5 md:p-8 rounded-2xl relative overflow-hidden w-full max-w-md mx-4", neonBorderClass)}>
                {/* Shimmer overlay effect */}
                <div className="absolute inset-0 shimmer-ltr opacity-20 pointer-events-none" />
                
                <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 z-0">
                    <Lock className={cn("w-24 h-24 md:w-32 md:h-32", isXM ? "text-red-400" : "text-blue-400", neonIconClass)} />
                </div>
                
                <h2 className={cn("text-xl md:text-2xl font-bold shimmer-text mb-2 relative z-10", neonTextClass)}>Member Login</h2>
                <p className={cn("mb-5 md:mb-6 relative z-10 text-sm md:text-base neon-white-text", isXM ? "text-red-200/60" : "text-blue-200/60")}>Sign in to access the platform.</p>

                <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10" autoComplete="on">
                   <div className="relative group">
                      <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", isXM ? "text-red-400/50 group-focus-within:text-red-400" : "text-blue-400/50 group-focus-within:text-blue-400", neonIconClass)} />
                      <input
                        autoFocus
                        type="email"
                        name="email"
                        id="login-email"
                        autoComplete="username"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Email Address"
                        className={cn("w-full bg-black/60 border-2 rounded-xl pl-10 pr-4 py-3 md:py-4 text-white transition-all cursor-target text-base", 
                          isXM 
                            ? "border-red-500/30 placeholder-red-300/30 focus:border-red-500/60 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                            : "border-blue-500/30 placeholder-blue-300/30 focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
                          "focus:outline-none"
                        )}
                      />
                    </div>

                   <div className="relative group">
                      <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", isXM ? "text-red-400/50 group-focus-within:text-red-400" : "text-blue-400/50 group-focus-within:text-blue-400", neonIconClass)} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="login-password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className={cn("w-full bg-black/60 border-2 rounded-xl pl-10 pr-12 py-3 md:py-4 text-white transition-all cursor-target text-base",
                          isXM 
                            ? "border-red-500/30 placeholder-red-300/30 focus:border-red-500/60 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                            : "border-blue-500/30 placeholder-blue-300/30 focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
                          "focus:outline-none"
                        )}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-target", 
                          isXM ? "text-red-400/50 hover:text-red-400" : "text-blue-400/50 hover:text-blue-400",
                          neonIconClass
                        )}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {submitError && (
                      <div className="text-red-400 text-sm bg-red-950/30 p-3 rounded-lg flex items-center gap-2 border border-red-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!loginEmail || !loginPassword}
                      className={cn("relative z-10 w-full py-3 md:py-4 bg-black rounded-xl font-bold tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-target text-base overflow-hidden", neonBorderClass, neonTextClass)}
                    >
                      <span className={cn("relative z-20 flex items-center gap-2 shimmer-text", neonTextClass)}>
                        LOGIN
                        <ArrowRight className={cn("w-4 h-4", neonIconClass)} />
                      </span>
                    </button>
                </form>

                <div className={cn("mt-5 md:mt-6 text-center border-t pt-4", isXM ? "border-red-500/40" : "border-blue-500/40")}>
                  <button onClick={toggleViewMode} className={cn("text-sm transition-colors cursor-target", isXM ? "text-red-300/60 hover:text-red-300 neon-red-text" : "text-blue-300/60 hover:text-blue-300 neon-blue-text")}>
                    Don&apos;t have a password? <span className={cn("underline", isXM ? "text-red-400 neon-red-text" : "text-blue-400 neon-blue-text")}>Register Now</span>
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
                        "relative px-5 md:px-6 py-2 rounded-full font-semibold transition-all duration-300 z-20 cursor-target text-sm md:text-base",
                        isActive 
                          ? cn("shimmer-text", isPartnerXM ? "text-red-400 neon-red-text" : "text-blue-400 neon-blue-text")
                          : cn("bg-black/60 border-2", isPartnerXM ? "border-red-500/20 text-red-300/60 hover:border-red-500/40" : "border-blue-500/20 text-blue-300/60 hover:border-blue-500/40")
                      )}
                    >
                      {partner}
                      {isActive && (
                        <motion.span
                          layoutId="tab-pill"
                          className={cn("absolute inset-0 -z-10 rounded-full bg-black border-2", isPartnerXM ? "border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.4)]" : "border-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.4)]")}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* --- SCREEN 1: ENTRY GATE (Step 0) --- */}
              {step === 0 && (
                 <motion.div
                  key="step0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-[99999998]"
                  style={{ minHeight: '100dvh' }}
                 >
                   {/* Back Button - Fixed Left Side Like Ultimate Hub */}
                   <button 
                     onClick={() => setStep(-1)} 
                     className="fixed top-20 left-4 lg:top-24 lg:left-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm lg:text-base font-semibold transition-all cursor-target py-2.5 px-4 rounded-xl bg-black/90 backdrop-blur-xl border border-blue-500/40 hover:border-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] z-[2147483646]"
                   >
                     <ChevronLeft className="w-5 h-5" /> Back
                   </button>
                   
                   <div className={cn("register-card bg-black/80 backdrop-blur-xl p-5 md:p-8 rounded-2xl relative overflow-hidden text-center w-full max-w-md mx-4", neonBorderClass)} style={{ zIndex: 1 }}>
                      {/* Shimmer overlay effect */}
                      <div className="absolute inset-0 shimmer-ltr opacity-20 pointer-events-none" />
                      
                      <div className="absolute top-0 right-0 p-3 md:p-4 opacity-5 z-0">
                        <Lock className={cn("w-24 h-24 md:w-32 md:h-32", isXM ? "text-red-400" : "text-blue-400", neonIconClass)} />
                      </div>

                      <div className="mb-5 md:mb-6 flex justify-center">
                         <div className={cn("h-14 w-14 md:h-16 md:w-16 rounded-full bg-black flex items-center justify-center", neonBorderClass)}>
                            <ShieldCheck className={cn("w-7 h-7 md:w-8 md:h-8", isXM ? "text-red-400" : "text-blue-400", neonIconClass)} />
                         </div>
                      </div>

                      <h2 className={cn("text-xl md:text-3xl font-extrabold shimmer-text mb-3 relative z-10", neonTextClass)}>Unlock Free BullMoney Access</h2>
                      <p className={cn("text-sm md:text-base mb-6 md:mb-8 max-w-sm mx-auto leading-relaxed relative z-10 neon-white-text", isXM ? "text-red-200/70" : "text-blue-200/70")}>
                        Get free trading setups and community access. <br/>
                        <span className={cn("text-blue-300/60", isXM ? "text-red-300/60" : "text-blue-300/60", neonTextClass)}>No payment. Takes about 2 minutes.</span>
                      </p>

                      <motion.button 
                        onClick={handleNext}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn("relative z-10 w-full py-3 md:py-4 bg-black rounded-xl font-bold text-base md:text-lg tracking-wide transition-all flex items-center justify-center cursor-target overflow-hidden", neonBorderClass, neonTextClass)}
                      >
                        <span className={cn("relative z-10 flex items-center shimmer-text", neonTextClass)}>
                          Start Free Access <ArrowRight className={cn("w-5 h-5 ml-2", neonIconClass)} />
                        </span>
                      </motion.button>
                      
                      <div className="mt-4 space-y-3 relative z-10">
                         <div className={cn("flex items-center justify-center gap-2 text-xs", isXM ? "text-red-400/60" : "text-blue-400/60", neonTextClass)}>
                             <Lock className={cn("w-3 h-3", neonIconClass)} /> No credit card required
                         </div>

                         {/* DYNAMIC BUTTON FOR EXISTING USERS */}
                         <motion.button 
                           onClick={toggleViewMode}
                           whileHover={{ scale: 1.01 }}
                           className={cn("w-full py-3 rounded-lg text-sm font-semibold transition-all mt-2 bg-black/60", neonBorderClass, neonTextClass)}
                         >
                            Already a member? Login here
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
                    className="bg-black/80 register-card w-full max-w-md mx-auto"
                    isXM={isXM}
                    actions={
                      <div className="flex flex-col gap-2 md:gap-4">
                        <p className={cn("text-xs text-center flex items-center justify-center gap-1", neonTextClass)}>
                          <Clock className={cn("w-3 h-3", neonIconClass)} /> Takes about 1 minute • No deposit required
                        </p>
                        
                        <div className="flex flex-col items-center justify-center gap-2 md:gap-3">
                           {/* COPY CODE BUTTON */}
                          <button
                            onClick={() => copyCode(brokerCode)}
                            className={cn("inline-flex items-center gap-2 rounded-lg px-3 py-2.5 md:py-3 text-sm font-semibold transition cursor-target w-full justify-center mb-1", neonBorderClass, neonTextClass)}
                          >
                            {copied ? <Check className={cn("h-4 w-4", neonIconClass)} /> : <Copy className={cn("h-4 w-4", neonIconClass)} />}
                            <span className={cn("shimmer-text", neonTextClass)}>{copied ? "Copied" : `Copy Code: ${brokerCode}`}</span>
                          </button>

                           {/* EXTERNAL LINK BUTTON */}
                          <button
                            onClick={handleBrokerClick}
                            className={cn("w-full py-3 md:py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-target text-base bg-black relative overflow-hidden", neonBorderClass, neonTextClass)}
                          >
                            <span className={cn("relative z-10 flex items-center gap-2 shimmer-text", neonTextClass)}>
                              Open Free Account
                              <ExternalLink className={cn("h-4 w-4", neonIconClass)} />
                            </span>
                          </button>
                        </div>
                        
                        {/* DYNAMIC SECONDARY BUTTON FOR "ALREADY HAVE ACCOUNT" */}
                        <button 
                            onClick={handleNext}
                            className={cn("w-full py-2.5 md:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-1 bg-black/60", neonBorderClass, neonTextClass)}
                        >
                            I already have an account
                        </button>
                      </div>
                    }
                  >
                    <p className={cn("text-sm md:text-[15px] leading-relaxed mb-4 text-center neon-white-text", isXM ? "text-red-200/70" : "text-blue-200/70")}>
                      BullMoney works with regulated brokers. <br className="hidden md:block" />
                      This free account lets us verify your access.
                    </p>
                    
                    {/* VISUAL ELEMENT (CARD) */}
                    <div className={cn(
                      "relative mx-auto w-full max-w-[240px] md:max-w-[280px] h-28 md:h-40 rounded-3xl overflow-visible mb-2 opacity-80 hover:opacity-100 transition-opacity",
                      neonBorderClass
                    )} style={{ filter: isXM ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.6)) drop-shadow(0 0 40px rgba(220, 38, 38, 0.4))' : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 40px rgba(147, 51, 234, 0.4))' }}>
                      <IconPlusCorners />
                      <div className="absolute inset-0 p-2 overflow-hidden rounded-3xl">
                        {isVantage ? <EvervaultCardRed text="VANTAGE" /> : <EvervaultCard text="X3R7P" />}
                      </div>
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
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.mt5Number}
                        className={cn(
                          "w-full py-3 md:py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-target text-base relative overflow-hidden",
                          !formData.mt5Number 
                            ? `opacity-50 cursor-not-allowed bg-black/60 border-2 ${isXM ? 'border-red-500/20 text-red-300/50' : 'border-blue-500/20 text-blue-300/50'}` 
                            : cn("bg-black", neonBorderClass, neonTextClass)
                        )}
                      >
                        <span className={cn("relative z-10 flex items-center gap-2", formData.mt5Number && cn("shimmer-text", neonTextClass))}>
                          Continue <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    }
                  >
                    <div className="space-y-3 md:space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                          <p className="text-slate-300 text-sm">After opening your account, you’ll receive an email with your trading ID (MT5 ID).</p>
                      </div>
                      
                      <div className="relative group">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-white transition-colors" />
                        <input
                          autoFocus
                          type="tel"
                          name="mt5Number"
                          value={formData.mt5Number}
                          onChange={handleChange}
                          placeholder="Enter MT5 ID (numbers only)"
                          className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3.5 md:py-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-black/40 transition-all cursor-target text-base"
                        />
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3"/> Used only to verify access</p>
                    </div>
                  </StepCard>
                  <button onClick={handleBack} className="mt-3 md:mt-4 flex items-center text-slate-500 hover:text-slate-300 text-sm mx-auto transition-colors cursor-target">
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
                    title="Create BullMoney Login"
                    className="register-card w-full max-w-md mx-auto"
                    isXM={isXM}
                    actions={
                      <button
                        onClick={handleNext}
                        disabled={!formData.email || !formData.password || !acceptedTerms}
                        className={cn(
                          "w-full py-3 md:py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-target text-base relative overflow-hidden",
                          (!formData.email || !formData.password || !acceptedTerms) 
                            ? cn("opacity-50 cursor-not-allowed bg-black/60 border-2", isXM ? "border-red-500/20 text-red-300/50" : "border-blue-500/20 text-blue-300/50")
                            : cn("bg-black", isXM ? "neon-red-border text-red-400 neon-red-text" : "neon-blue-border text-blue-400 neon-blue-text")
                        )}
                      >
                        <span className={cn("relative z-10 flex items-center gap-2", (formData.email && formData.password && acceptedTerms) && cn("shimmer-text", isXM ? "neon-red-text" : "neon-blue-text"))}>
                          Unlock My Access <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    }
                  >
                     <p className={cn("text-xs md:text-sm mb-3 md:mb-4 neon-white-text", isXM ? "text-red-200/60" : "text-blue-200/60")}>This lets you access <span className={cn("shimmer-text font-medium", isXM ? "neon-red-text" : "neon-blue-text")}>setups</span>, tools, and the community.</p>
                    <div className="space-y-3 md:space-y-4 pt-1">
                      <div>
                        <div className="relative group">
                          <Mail className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", isXM ? "text-red-400/50 group-focus-within:text-red-400" : "text-blue-400/50 group-focus-within:text-blue-400", neonIconClass)} />
                          <input
                            autoFocus
                            type="email"
                            name="email"
                            autoComplete="username" // Enables browser autofill
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email address"
                            className={cn("w-full bg-black/60 border-2 rounded-lg pl-10 pr-4 py-3.5 text-white transition-all cursor-target text-base",
                              isXM 
                                ? "border-red-500/30 placeholder-red-300/30 focus:border-red-500/60 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                                : "border-blue-500/30 placeholder-blue-300/30 focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
                              "focus:outline-none"
                            )}
                          />
                        </div>
                        <p className={cn("text-[10px] mt-1 ml-1", isXM ? "text-red-300/40 neon-red-text" : "text-blue-300/40 neon-blue-text")}>We&apos;ll send your login details here.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", isXM ? "text-red-400/50 group-focus-within:text-red-400" : "text-blue-400/50 group-focus-within:text-blue-400", neonIconClass)} />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete="new-password" // Enables browser to save this password
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create password (min 6 chars)"
                            className={cn("w-full bg-black/60 border-2 rounded-lg pl-10 pr-12 py-3.5 text-white transition-all cursor-target text-base",
                              isXM 
                                ? "border-red-500/30 placeholder-red-300/30 focus:border-red-500/60 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                                : "border-blue-500/30 placeholder-blue-300/30 focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
                              "focus:outline-none"
                            )}
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-target",
                              isXM ? "text-red-400/50 hover:text-red-400" : "text-blue-400/50 hover:text-blue-400",
                              neonIconClass
                            )}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className={cn("text-[10px] mt-1 ml-1", isXM ? "text-red-300/40 neon-red-text" : "text-blue-300/40 neon-blue-text")}>Must be at least 6 characters.</p>
                      </div>

                      <div>
                        <div className="relative group">
                          <User className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", isXM ? "text-red-400/50 group-focus-within:text-red-400" : "text-blue-400/50 group-focus-within:text-blue-400", neonIconClass)} />
                          <input
                            type="text"
                            name="referralCode"
                            value={formData.referralCode}
                            onChange={handleChange}
                            placeholder="Referral Code (Optional)"
                            className={cn("w-full bg-black/60 border-2 rounded-lg pl-10 pr-4 py-3.5 text-white transition-all cursor-target text-base",
                              isXM 
                                ? "border-red-500/30 placeholder-red-300/30 focus:border-red-500/60 focus:shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                                : "border-blue-500/30 placeholder-blue-300/30 focus:border-blue-500/60 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
                              "focus:outline-none"
                            )}
                          />
                        </div>
                        <p className={cn("text-[10px] mt-1 ml-1", isXM ? "text-red-300/40 neon-red-text" : "text-blue-300/40 neon-blue-text")}>Leave blank if you don&apos;t have one.</p>
                      </div>

                        <div
                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                        className={cn("flex items-start gap-3 p-3 rounded-lg bg-black/60 cursor-pointer transition-colors cursor-target", isXM ? "neon-red-border" : "neon-blue-border")}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors shrink-0",
                          acceptedTerms 
                            ? cn("border-blue-600", isXM ? "neon-red-bg" : "neon-blue-bg")
                            : isXM ? "border-red-500/60" : "border-blue-500/60"
                        )}>
                          {acceptedTerms && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-200/70 leading-tight neon-white-text">
                            I agree to the Terms of Service and understand this is educational content.
                          </p>
                        </div>
                      </div>
                    </div>

                    {submitError && (
                      <div className="flex items-center gap-2 text-red-400 bg-red-950/20 p-3 rounded-lg border border-red-900/50 mt-4 animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-medium">{submitError}</span>
                      </div>
                    )}
                  </StepCard>

                  <button onClick={handleBack} className={cn("mt-3 md:mt-4 flex items-center text-sm mx-auto transition-colors cursor-target", isXM ? "text-red-300/60 hover:text-red-300 neon-red-text" : "text-blue-300/60 hover:text-blue-300 neon-blue-text")}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (MEMOIZED CARDS) ---

const StepCard = memo(({ number, number2, title, children, actions, className, isXM }: any) => {
  const useRed = typeof number2 === "number";
  const n = useRed ? number2 : number;
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl p-5 md:p-8",
      cn("bg-black/80 backdrop-blur-xl", isXM ? "neon-red-border" : "neon-blue-border"),
      className
    )}>
      {/* Shimmer overlay effect */}
      <div className="absolute inset-0 shimmer-ltr opacity-20 pointer-events-none rounded-2xl" />
      
      <div className="pointer-events-none absolute -top-12 right-0 h-24 w-2/3 blur-2xl z-0" style={{background: isXM ? 'linear-gradient(to left, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1), transparent)' : 'linear-gradient(to left, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1), transparent)'}} />
      <div className={cn("pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset z-0", isXM ? "ring-red-500/10" : "ring-blue-500/10")} />
      <div className="flex items-center justify-between mb-3 md:mb-6 relative z-10">
        <span className={cn("inline-flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-[0.18em] px-2 py-1 rounded-md bg-black/60", isXM ? "neon-red-border text-red-300/90 neon-red-text" : "neon-blue-border text-blue-300/90 neon-blue-text")}>
          <span className="shimmer-text">Step {n} of 3</span>
        </span>
      </div>
      <h3 className={cn("text-lg md:text-2xl font-extrabold shimmer-text mb-3 md:mb-4 relative z-10", isXM ? "neon-red-text" : "neon-blue-text")}>{title}</h3>
      <div className="flex-1 relative z-10">{children}</div>
      {actions && <div className={cn("mt-5 md:mt-8 pt-5 md:pt-6 border-t relative z-10", isXM ? "border-red-500/40" : "border-blue-500/40")}>{actions}</div>}
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
    <div className="w-full h-full flex items-center justify-center bg-transparent" onMouseMove={onMouseMove}>
      <div className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-black/40 flex items-center justify-center" 
           style={{ 
             boxShadow: '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(220, 38, 38, 0.6), inset 0 0 40px rgba(239, 68, 68, 0.3)'
           }}>
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center">
          <span className="relative z-20 font-extrabold text-3xl md:text-4xl text-white select-none" 
                style={{
                  textShadow: '0 0 15px #ffffff, 0 0 30px #ffffff, 0 0 45px #ffffff, 0 0 60px #ffffff, 0 0 75px #ffffff',
                  filter: 'drop-shadow(0 0 10px #ffffff) drop-shadow(0 0 20px #ffffff)'
                }}>{text}</span>
        </div>
      </div>
    </div>
  );
});
EvervaultCard.displayName = "EvervaultCard";

function CardPattern({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(300px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-rose-700 opacity-30 group-hover/card:opacity-90 backdrop-blur-xl transition duration-500" 
        style={{
          ...style,
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.9), 0 0 80px rgba(220, 38, 38, 0.8), 0 0 120px rgba(225, 29, 72, 0.7), inset 0 0 50px rgba(239, 68, 68, 0.6)'
        }} 
      />
      <motion.div className="absolute inset-0 opacity-20 mix-blend-screen group-hover/card:opacity-60" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words font-mono font-bold transition duration-500" 
           style={{
             color: '#fca5a5',
             textShadow: '0 0 8px #ef4444, 0 0 16px #dc2626, 0 0 24px #e11d48'
           }}>{randomString}</p>
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
    <div className="w-full h-full flex items-center justify-center bg-transparent" onMouseMove={onMouseMove}>
      <div className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-black/40 flex items-center justify-center" 
           style={{ 
             boxShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(37, 99, 235, 0.6), inset 0 0 40px rgba(59, 130, 246, 0.3)'
           }}>
        <CardPatternRed mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center">
          <span className="relative z-20 font-extrabold text-3xl md:text-4xl text-white select-none" 
                style={{
                  textShadow: '0 0 15px #ffffff, 0 0 30px #ffffff, 0 0 45px #ffffff, 0 0 60px #ffffff, 0 0 75px #ffffff',
                  filter: 'drop-shadow(0 0 10px #ffffff) drop-shadow(0 0 20px #ffffff)'
                }}>{text}</span>
        </div>
      </div>
    </div>
  );
});
EvervaultCardRed.displayName = "EvervaultCardRed";

function CardPatternRed({ mouseX, mouseY, randomString }: any) {
  const maskImage = useMotionTemplate`radial-gradient(300px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-600 to-blue-700 opacity-30 group-hover/card:opacity-90 backdrop-blur-xl transition duration-500" 
        style={{
          ...style,
          boxShadow: '0 0 40px rgba(34, 211, 238, 0.9), 0 0 80px rgba(59, 130, 246, 0.8), 0 0 120px rgba(37, 99, 235, 0.7), inset 0 0 50px rgba(59, 130, 246, 0.6)'
        }} 
      />
      <motion.div className="absolute inset-0 opacity-20 mix-blend-screen group-hover/card:opacity-60" style={style}>
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words font-mono font-bold transition duration-500" 
           style={{
             color: '#93c5fd',
             textShadow: '0 0 8px #3b82f6, 0 0 16px #2563eb, 0 0 24px #1d4ed8'
           }}>{randomString}</p>
      </motion.div>
    </div>
  );
}