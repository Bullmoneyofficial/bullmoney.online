"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, memo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { SplineWrapperProps } from '@/lib/spline-wrapper';

// Dynamic import for Spline component (ultra-optimized wrapper)
const Spline = dynamic<SplineWrapperProps>(
  () => import(/* webpackChunkName: "spline-wrapper" */ '@/lib/spline-wrapper') as any,
  {
    ssr: false,
    loading: () => null,
  }
);
import { trackEvent, BullMoneyAnalytics } from '@/lib/analytics';
import { Check, Hash, Lock, ArrowRight, ChevronLeft, ExternalLink, AlertCircle, Copy, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { cn } from "@/lib/utils";
import { persistSession, restoreSession, persistFullSession } from '@/lib/sessionPersistence';

// ---------------------------------------------------------------------------
// Turbopack HMR stability + faster desktop paint
// ---------------------------------------------------------------------------
// framer-motion occasionally triggers a Turbopack HMR bug:
//   "motion-template.mjs ... module factory is not available"
// on hot updates, crashing PageMode during module evaluation.
//
// For the welcome/pagemode screen we can safely degrade animations to CSS,
// rendering plain DOM elements and stripping motion-only props.
//
// NOTE: This affects dev + prod equally (no framer-motion runtime here).
// If you want animations back later, we can re-introduce them behind a
// runtime-loaded wrapper once Turbopack is stable.
type MotionLikeProps = {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  variants?: any;
  whileHover?: any;
  whileTap?: any;
  whileInView?: any;
  viewport?: any;
  layout?: any;
  layoutId?: any;
  onAnimationStart?: any;
  onAnimationComplete?: any;
  onUpdate?: any;
};

const MOTION_PROP_KEYS: Record<string, true> = {
  initial: true,
  animate: true,
  exit: true,
  transition: true,
  variants: true,
  whileHover: true,
  whileTap: true,
  whileInView: true,
  viewport: true,
  layout: true,
  layoutId: true,
  onAnimationStart: true,
  onAnimationComplete: true,
  onUpdate: true,
};

function stripMotionProps<T extends Record<string, any>>(props: T): Omit<T, keyof MotionLikeProps> {
  const next: Record<string, any> = {};
  for (const key of Object.keys(props)) {
    if (MOTION_PROP_KEYS[key]) continue;
    next[key] = props[key];
  }
  return next as any;
}

const _motionComponentCache = new Map<string, React.ComponentType<any>>();
const motion = new Proxy(
  {},
  {
    get(_target, tagName) {
      if (typeof tagName !== 'string') return undefined;
      const cached = _motionComponentCache.get(tagName);
      if (cached) return cached;

      const Component = React.forwardRef<any, any>(function MotionShim(props, ref) {
        const { children, ...rest } = props || {};
        return React.createElement(tagName, { ref, ...stripMotionProps(rest) }, children);
      });
      Component.displayName = `MotionShim(${tagName})`;
      _motionComponentCache.set(tagName, Component);
      return Component;
    },
  }
) as any;

function AnimatePresence({ children }: { children: React.ReactNode; [key: string]: any }) {
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// SafePortal — lazy-load react-dom.createPortal to avoid Turbopack HMR crashes
// ---------------------------------------------------------------------------
type PortalCreator = (children: React.ReactNode, container: Element) => React.ReactPortal;
let _createPortal: PortalCreator | null = null;

function SafePortal({
  children,
  container,
}: {
  children: React.ReactNode;
  container?: Element | null;
}) {
  const [portalCreator, setPortalCreator] = useState<PortalCreator | null>(() => _createPortal);

  useEffect(() => {
    if (portalCreator) return;
    let alive = true;

    import('react-dom')
      .then((mod: any) => {
        const creator = (mod && mod.createPortal) as PortalCreator | undefined;
        if (!creator) return;
        _createPortal = creator;
        if (alive) setPortalCreator(() => creator);
      })
      .catch(() => {
        // Ignore — portals are optional for this screen.
      });

    return () => {
      alive = false;
    };
  }, [portalCreator]);

  const target = container ?? (typeof document !== 'undefined' ? document.body : null);
  if (!portalCreator || !target) return null;
  return portalCreator(children, target);
}

// --- UI STATE CONTEXT ---
import { useUIState, UI_Z_INDEX } from "@/contexts/UIStateContext";
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

import { WelcomeStep } from "./pagemode/steps/WelcomeStep";
import { WelcomeStepMobile } from "./pagemode/steps/WelcomeStepMobile";
import { WelcomeStepGuest } from "./pagemode/steps/WelcomeStepGuest";
import { MatrixTerminalBg } from "./pagemode/MatrixTerminalBg";

// --- IMPORT SEPARATE LOADER COMPONENT (lazy, event-driven) ---
const TelegramConfirmationResponsive = dynamic(() => import("./TelegramConfirmationResponsive").then(m => ({ default: m.TelegramConfirmationResponsive })), { ssr: false, loading: () => null });

// --- EXTRACTED STEPS (code-split to reduce first-load bundle + dev compile graph) ---
const BrokerSelector = dynamic(() => import("./pagemode/steps/BrokerSelector"), { ssr: false, loading: () => null });
const Step0EntryGate = dynamic(() => import("./pagemode/steps/Step0EntryGate"), { ssr: false, loading: () => null });
const Step1OpenAccount = dynamic(() => import("./pagemode/steps/Step1OpenAccount"), { ssr: false, loading: () => null });
const Step2VerifyId = dynamic(() => import("./pagemode/steps/Step2VerifyId"), { ssr: false, loading: () => null });
const Step3CreateLogin = dynamic(() => import("./pagemode/steps/Step3CreateLogin"), { ssr: false, loading: () => null });
const LoginView = dynamic(() => import("./pagemode/steps/LoginView"), { ssr: false, loading: () => null });

// --- DESKTOP WELCOME SCREEN (separate layout for larger screens) ---
const WelcomeScreenDesktop = dynamic(
  () => import("./WelcomeScreenDesktop").then(m => ({ default: m.WelcomeScreenDesktop })),
  {
    ssr: false, // Avoid server-rendering the heavy desktop hero to reduce prod compile + TTFB
    loading: () => null,
  }
);
import { useLivePrices } from '@/components/ultimate-hub/hooks/useAccess';

// Spline scene for welcome background (preloaded in layout.tsx for fastest first load)
const SPLINE_SCENE = '/scene1.splinecode';

// Pre-compiled RegExp patterns (avoids re-creation per call)
const RE_MOBILE_UA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
const RE_INSTAGRAM = /instagram/i;
const RE_IOS_DEVICE = /iphone|ipad|ipod/;
const RE_SAFARI_ONLY = /safari/;
const RE_NON_SAFARI_BROWSERS = /chrome|crios|fxios|edgios/;
const RE_INAPP_BROWSER = /fban|fbav|instagram|twitter|linkedin|snapchat|tiktok|wechat|line|telegram/i;
const RE_WEBVIEW = /wv|webview|; wv\)|instagram|fb_iab|line\//i;
const RE_OLD_ANDROID = /android [1-7]\./i;

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
  const isIOS = RE_IOS_DEVICE.test(ua) || (platform === 'macintel' && navigator.maxTouchPoints > 1);
  const isSafari = RE_SAFARI_ONLY.test(ua) && !RE_NON_SAFARI_BROWSERS.test(ua);
  const isInAppBrowser = RE_INAPP_BROWSER.test(ua);
  const isWebView = RE_WEBVIEW.test(ua) || (isIOS && !isSafari && !RE_NON_SAFARI_BROWSERS.test(ua));
  const isOldAndroid = RE_OLD_ANDROID.test(ua);

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

// Cache runtime profile (computed once, stable for session lifetime)
let _cachedRuntimeProfile: RuntimeProfile | null = null;
const getCachedRuntimeProfile = (): RuntimeProfile => {
  if (!_cachedRuntimeProfile) _cachedRuntimeProfile = getRuntimeProfile();
  return _cachedRuntimeProfile;
};

// Detect low memory / constrained environments (cached)
let _cachedIsLowMemory: boolean | null = null;
const isLowMemoryDevice = (): boolean => {
  if (_cachedIsLowMemory !== null) return _cachedIsLowMemory;
  const profile = getCachedRuntimeProfile();
  _cachedIsLowMemory = (
    (profile.isIOS && profile.isSafari) ||
    profile.isInAppBrowser ||
    profile.isWebView ||
    profile.isLowMemory
  );
  return _cachedIsLowMemory;
};

// --- SIMPLE SPLINE BACKGROUND COMPONENT (MOBILE) ---
// No load-lock needed here — this is the only Spline on the register screen.
// Locking only adds queuing overhead; skipping it means Spline starts immediately.
const WelcomeSplineBackground = memo(function WelcomeSplineBackground({ isDesktop }: { isDesktop: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [allowLoad, setAllowLoad] = useState(false);
  // Covers Spline with the terminal whenever it may have gone black (tab switch / context loss)
  const [splineCovered, setSplineCovered] = useState(false);
  const coverTimerRef = useRef<number | null>(null);
  const splineWrapRef = useRef<HTMLDivElement>(null);

  // 50/50 per page-load: either show Spline or keep the terminal as the background
  const useSpline = useRef(Math.random() < 0.5).current;

  const scene = SPLINE_SCENE;

  // When tab becomes visible again, briefly re-show terminal while Spline's WebGL context recovers
  useEffect(() => {
    if (!useSpline) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') return;
      // Tab came back — cover Spline until it resumes rendering (~1.5 s is enough)
      if (!isLoaded) return; // already covered by normal loading state
      setSplineCovered(true);
      if (coverTimerRef.current) window.clearTimeout(coverTimerRef.current);
      coverTimerRef.current = window.setTimeout(() => setSplineCovered(false), 1500);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (coverTimerRef.current) window.clearTimeout(coverTimerRef.current);
    };
  }, [useSpline, isLoaded]);

  // If the GPU context is permanently lost, keep the terminal up
  useEffect(() => {
    const el = splineWrapRef.current;
    if (!el) return;
    const canvas = el.querySelector('canvas');
    if (!canvas) return;
    const onLost = () => {
      setSplineCovered(true);
      if (coverTimerRef.current) window.clearTimeout(coverTimerRef.current);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    return () => canvas.removeEventListener('webglcontextlost', onLost);
  });

  // Kick off preloading immediately — only when Spline was chosen this session
  useEffect(() => {
    if (!useSpline || typeof window === 'undefined') return;
    let cancelled = false;
    const delay = 0; // start immediately on all devices for faster Spline paint
    let link: HTMLLinkElement | null = null;
    const timer = window.setTimeout(() => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection || {};
      const saveData = !!conn.saveData;
      const effectiveType = String(conn.effectiveType || '');
      const isSlowNet = effectiveType === '2g' || effectiveType === 'slow-2g';
      const preloadPriority: 'high' | 'low' = (!saveData && !isSlowNet) ? 'high' : 'low';

      import(/* webpackChunkName: "spline-wrapper" */ '@/lib/spline-wrapper').catch(() => undefined);

      const preconnectOrigins = ['https://prod.spline.design', 'https://cdn.spline.design'] as const;
      preconnectOrigins.forEach((href) => {
        if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
        const l = document.createElement('link');
        l.rel = 'preconnect';
        l.href = href;
        l.crossOrigin = 'anonymous';
        document.head.appendChild(l);
      });

      const existing = document.querySelector(`link[rel="preload"][as="fetch"][href="${scene}"]`) as HTMLLinkElement | null;
      if (!existing) {
        link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'fetch';
        link.href = scene;
        link.crossOrigin = 'anonymous';
        (link as any).fetchPriority = preloadPriority;
        link.setAttribute('fetchpriority', preloadPriority);
        document.head.appendChild(link);
      }
      fetch(scene, { cache: 'force-cache', priority: preloadPriority as RequestPriority }).catch(() => undefined);

      if (!cancelled) setAllowLoad(true);
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (link && link.parentNode) link.parentNode.removeChild(link);
    };
  }, [scene, isDesktop, useSpline]);

  const handleLoad = useCallback((_splineApp?: any) => {
    setIsLoaded(true);
    // Signal the splash controller that Spline has rendered — dismisses the splash.
    try { window.dispatchEvent(new CustomEvent('bm-spline-ready')); } catch (_) {}
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{
        zIndex: 0,
        touchAction: 'pan-y pinch-zoom',
        backgroundColor: '#000',
      }}
    >
      {/* Matrix terminal — shown while loading OR whenever Spline goes black (tab switch / context loss) */}
      <MatrixTerminalBg visible={!isLoaded || splineCovered} />

      {/* Spline — only mounts on the 50% of sessions where it was chosen */}
      {useSpline && allowLoad && (
        <div
          ref={splineWrapRef}
          className={`absolute inset-0 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <Spline
            scene={scene}
            onLoad={handleLoad}
            priority
            isHero
            neverDisable
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
});

// --- CONSTANTS ---
const TELEGRAM_GROUP_LINK = "https://t.me/addlist/uswKuwT2JUQ4YWI8";

// --- UTILS: DESKTOP DETECTION HOOK (for welcome screen layout) ---
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const checkDesktop = () => {
      // Desktop: 1024px+ width AND not a touch-primary device
      const isLargeScreen = window.innerWidth >= 1024;
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = RE_MOBILE_UA.test(userAgent);
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

// --- HOISTED STYLE CONSTANTS (prevents object re-creation per render) ---
const FONT_FAMILY_FULL = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' as const;
const FONT_FAMILY_SHORT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' as const;

const STYLE_TOP_EDGE: React.CSSProperties = Object.freeze({
  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
  zIndex: 20, pointerEvents: 'none' as const,
});

const STYLE_BACK_BTN: React.CSSProperties = Object.freeze({
  position: 'fixed', top: 56, left: 16, display: 'flex', alignItems: 'center', gap: 4,
  color: 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: 500, padding: '8px 12px',
  borderRadius: 12, backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)',
  zIndex: 2147483646, cursor: 'pointer',
});

const STYLE_FORM_CARD: React.CSSProperties = Object.freeze({
  backgroundColor: '#fff', padding: 24, borderRadius: 20,
  position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 384,
  marginLeft: 16, marginRight: 16,
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 8px 32px -8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.04)',
  fontFamily: FONT_FAMILY_FULL, perspective: 1200,
  transformStyle: 'preserve-3d' as any,
});

const STYLE_PRIMARY_BTN: React.CSSProperties = Object.freeze({
  width: '100%', padding: '14px 0', borderRadius: 14,
  fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 8, background: '#000', color: '#fff',
  border: 'none', cursor: 'pointer',
  boxShadow: '0 4px 20px -4px rgba(0,0,0,0.3)',
});

const STYLE_INPUT: React.CSSProperties = Object.freeze({
  width: '100%', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 14, padding: '14px 16px', color: '#000', fontSize: 16,
  outline: 'none', boxSizing: 'border-box' as const,
});

const STYLE_LOGO_IMG: React.CSSProperties = Object.freeze({
  objectFit: 'contain' as const,
  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))',
});

// Common framer-motion transition presets (frozen to prevent re-allocation)
const EASE_APPLE = Object.freeze([0.16, 1, 0.3, 1]);
const TRANSITION_STEP = Object.freeze({ duration: 0.5, ease: EASE_APPLE });
const TRANSITION_CARD = Object.freeze({ duration: 0.8, ease: EASE_APPLE });

// --- LOADING STATES DATA (frozen — immutable) ---
const loadingStates = Object.freeze([
  Object.freeze({ text: "INITIALIZING BULLMONEY" }),
  Object.freeze({ text: "RESTORING SESSION" }),
  Object.freeze({ text: "VERIFYING CREDENTIALS" }),
  Object.freeze({ text: "UNLOCKING TRADES" }),
  Object.freeze({ text: "WELCOME BACK" }),
]);

// --- PREMIUM CELEBRATION STATES (frozen — immutable) ---
const celebrationStates = Object.freeze([
  Object.freeze({ text: "ACTIVATING ELITE ACCESS" }),
  Object.freeze({ text: "UNLOCKING PREMIUM SETUPS" }),
  Object.freeze({ text: "CONNECTING TO PRO NETWORK" }),
  Object.freeze({ text: "GRANTING MENTOR ACCESS" }),
  Object.freeze({ text: "WELCOME TO THE INNER CIRCLE" }),
]);

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
  
  // --- IP SESSION AUTO-LOGIN STATE ---
  const [checkingIPSession, setCheckingIPSession] = useState(true); // Start with checking

  // Lazy-loaded heavy components — imported only after user interaction/loading
  const [MultiStepLoaderComp, setMultiStepLoaderComp] = useState<React.ComponentType<any> | null>(null);
  const [LegalDisclaimerModalComp, setLegalDisclaimerModalComp] = useState<React.ComponentType<any> | null>(null);
  const [UnifiedFpsPillComp, setUnifiedFpsPillComp] = useState<React.ComponentType<any> | null>(null);
  const [UnifiedHubPanelComp, setUnifiedHubPanelComp] = useState<React.ComponentType<any> | null>(null);
  const [hubReady, setHubReady] = useState(false);
  
  // --- INIT: Read localStorage flags on mount (single effect) ---
  useEffect(() => {
    const shouldReturn = localStorage.getItem('return_to_account_manager');
    if (shouldReturn === 'true') {
      setReturnToAccountManager(true);
      setStep(0);
    }

    const shouldStartLogin = localStorage.getItem('bullmoney_pagemode_login_view');
    if (shouldStartLogin === 'true') {
      setViewMode('login');
      setStep(0);
      localStorage.removeItem('bullmoney_pagemode_login_view');
    }
  }, []);

  // Load loader component only when we actually enter a loading state
  useEffect(() => {
    if (!loading || MultiStepLoaderComp) return;
    let cancelled = false;
    import("@/components/Mainpage/MultiStepLoader")
      .then(m => {
        if (!cancelled) setMultiStepLoaderComp(() => m.MultiStepLoader);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [loading, MultiStepLoaderComp]);

  // Load legal modal only when the modal is requested
  useEffect(() => {
    if (!isLegalModalOpen || LegalDisclaimerModalComp) return;
    let cancelled = false;
    import("@/components/Mainpage/footer/LegalDisclaimerModal")
      .then(m => { if (!cancelled) setLegalDisclaimerModalComp(() => m.LegalDisclaimerModal); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLegalModalOpen, LegalDisclaimerModalComp]);

  // User interaction gate for hub widgets
  const ensureHubReady = useCallback(() => setHubReady(true), []);

  useEffect(() => {
    if (hubReady) return;
    const handler = () => setHubReady(true);
    const opts = { once: true } as AddEventListenerOptions;
    window.addEventListener('pointerdown', handler, opts);
    window.addEventListener('touchstart', handler, opts);
    window.addEventListener('keydown', handler, opts);
    return () => {
      window.removeEventListener('pointerdown', handler, opts as any);
      window.removeEventListener('touchstart', handler, opts as any);
      window.removeEventListener('keydown', handler, opts as any);
    };
  }, [hubReady]);

  // Load hub components once user has interacted
  useEffect(() => {
    if (!hubReady) return;
    if (!UnifiedFpsPillComp) {
      import('@/components/ultimate-hub/pills/UnifiedFpsPill')
        .then(m => setUnifiedFpsPillComp(() => m.UnifiedFpsPill))
        .catch(() => {});
    }
    if (!UnifiedHubPanelComp) {
      import('@/components/ultimate-hub/panel/UnifiedHubPanel')
        .then(m => setUnifiedHubPanelComp(() => m.UnifiedHubPanel))
        .catch(() => {});
    }
  }, [hubReady, UnifiedFpsPillComp, UnifiedHubPanelComp]);

  // --- IP-BASED SESSION CHECK: Auto-login if session exists by IP ---
  useEffect(() => {
    let cancelled = false;

    async function checkForIPSession() {
      // DEV: skip IP auto-login when ?dev_reset=1 was used this tab session.
      try {
        if (sessionStorage.getItem('bm_dev_skip_ip_session') === '1') {
          console.log('[PageMode] Dev mode: skipping IP session auto-login');
          setCheckingIPSession(false);
          return;
        }
      } catch (_) {}

      // Skip IP auto-login when there is no prior local session indicator.
      // The bm_auth cookie and localStorage keys are only present in a browser
      // context that has previously authenticated here. Incognito/private windows
      // start with none of these, so they always see the registration flow instead
      // of being silently logged in via the device fingerprint API.
      try {
        const hasCookie = document.cookie.includes('bm_auth=');
        const hasLocalAuth =
          localStorage.getItem('bullmoney_recruit_auth') !== null ||
          localStorage.getItem('bullmoney_session') !== null;
        if (!hasCookie && !hasLocalAuth) {
          setCheckingIPSession(false);
          return;
        }
      } catch (_) {}

      try {
        // Try to restore session (checks IP first, then local storage)
        const session = await restoreSession();
        
        if (cancelled) return;
        
        if (session && session.recruitId && session.email) {
          console.log('[PageMode] IP session found, auto-unlocking for:', session.email);
          // Returning user — mark telegram as confirmed so they skip the Telegram screen.
          // (Telegram confirmation is only required for brand-new sign-ups, not returning users.)
          try { localStorage.setItem('bullmoney_telegram_confirmed', 'true'); } catch (_) {}
          // Session found - trigger unlock after brief delay for smooth UX
          window.dispatchEvent(new Event('bullmoney_session_changed'));
          setTimeout(() => {
            if (!cancelled) {
              onUnlock();
            }
          }, 100);
          return;
        }
      } catch (error) {
        console.warn('[PageMode] IP session check failed:', error);
      }
      
      // No session found - allow normal login flow
      if (!cancelled) {
        setCheckingIPSession(false);
      }
    }

    checkForIPSession();

    return () => {
      cancelled = true;
    };
  }, [onUnlock]);
  
  // --- DESKTOP DETECTION FOR WELCOME SCREEN ---
  const isDesktop = useIsDesktop();

  // --- MOBILE PERFORMANCE PROFILE ---
  const { isMobile, shouldSkipHeavyEffects, shouldDisableBackdropBlur } = useMobilePerformance();
  const isLowMemoryRuntime = useMemo(() => isLowMemoryDevice(), []);
  const shouldReduceEffects = isMobile || shouldSkipHeavyEffects || isLowMemoryRuntime;
  const disableBackdropBlur = shouldDisableBackdropBlur || isLowMemoryRuntime;

  // Idle-load desktop-only assets after first paint to keep TTFB low
  useEffect(() => {
    if (!isDesktop || isMobile) return;
    const timer = window.setTimeout(() => {
      import('./WelcomeScreenDesktop').catch(() => undefined);
      import('@/lib/spline-wrapper').catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [isDesktop, isMobile]);

  // Idle-prefetch the register step chunks so the first click feels instant
  // while keeping the initial JS graph smaller.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only prefetch while still on the welcome/early flow.
    if (step > 1) return;

    const schedule = (cb: () => void) => {
      const ric = (window as any).requestIdleCallback as ((fn: () => void, opts?: any) => any) | undefined;
      if (typeof ric === 'function') return ric(cb, { timeout: 1500 });
      return window.setTimeout(cb, 900);
    };

    const id = schedule(() => {
      import('./pagemode/steps/BrokerSelector').catch(() => undefined);
      import('./pagemode/steps/Step0EntryGate').catch(() => undefined);
      import('./pagemode/steps/Step1OpenAccount').catch(() => undefined);
      import('./pagemode/steps/Step2VerifyId').catch(() => undefined);
      import('./pagemode/steps/Step3CreateLogin').catch(() => undefined);
      import('./pagemode/steps/LoginView').catch(() => undefined);
    });

    return () => {
      const cic = (window as any).cancelIdleCallback as ((id: any) => void) | undefined;
      if (typeof cic === 'function') {
        try { cic(id); } catch (_) {}
      } else {
        window.clearTimeout(id);
      }
    };
  }, [step]);

  // --- iOS / In-App viewport shield (match Android/Samsung visual sizing + centering) ---
  const [iosInAppScale, setIosInAppScale] = useState(1);
  const [isIOSInAppShield, setIsIOSInAppShield] = useState(false);

  // --- LOGIN FORM STATE ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- REGISTRATION FORM STATE ---
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mt5Number: '',
    referralCode: '',
  });

  // --- AFFILIATE / REFERRAL URL PARAMS ---
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [resolvedAffiliateCode, setResolvedAffiliateCode] = useState<string | null>(null);
  const [resolvedAffiliateId, setResolvedAffiliateId] = useState<string | null>(null);
  const [resolvedSource, setResolvedSource] = useState<string | null>(null);
  const [resolvedMedium, setResolvedMedium] = useState<string | null>(null);
  const [resolvedCampaign, setResolvedCampaign] = useState<string | null>(null);
  const [referralAttribution, setReferralAttribution] = useState<{
    affiliateCode: string | null;
    affiliateId: string | null;
    affiliateName: string | null;
    affiliateEmail: string | null;
    source: string | null;
    medium: string | null;
    campaign: string | null;
  } | null>(null);

  // --- HUB PANEL STATE ---
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isHubMinimized, setIsHubMinimized] = useState(false);
  const closeHubPanel = useCallback(() => setIsHubOpen(false), []);
  const openHubPanel = useCallback(() => setIsHubOpen(true), []);
  const toggleHubMinimized = useCallback(() => setIsHubMinimized(prev => !prev), []);

  // --- iOS SHIELD STYLE (computed from scale) ---
  const iosInAppShieldStyle: React.CSSProperties | undefined = isIOSInAppShield
    ? { transform: `scale(${iosInAppScale})`, transformOrigin: 'top center' }
    : undefined;

  // --- LIVE PRICES (for hub panel tickers) ---
  const prices = useLivePrices();

  // --- REFERRAL ATTRIBUTION: Extract URL params & track affiliate click ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref') || params.get('affiliate') || params.get('code');
    const src = params.get('utm_source') || params.get('source');
    const med = params.get('utm_medium') || params.get('medium');
    const cam = params.get('utm_campaign') || params.get('campaign');

    if (!code) return;

    setAffiliateCode(code);
    setResolvedSource(src);
    setResolvedMedium(med);
    setResolvedCampaign(cam);

    // Resolve affiliate details from API
    fetch(`/api/affiliate/resolve?code=${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setResolvedAffiliateCode(data.affiliateCode ?? code);
        setResolvedAffiliateId(data.affiliateId ?? null);
        setReferralAttribution({
          affiliateCode: data.affiliateCode ?? code,
          affiliateId: data.affiliateId ?? null,
          affiliateName: data.affiliateName ?? null,
          affiliateEmail: data.affiliateEmail ?? null,
          source: src,
          medium: med,
          campaign: cam,
        });

        // Track referral click (once per session per code)
        const clickTrackKey = `bm_ref_click_tracked_${data.affiliateCode ?? code}`;
        if (!sessionStorage.getItem(clickTrackKey)) {
          fetch('/api/affiliate/track-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              affiliateCode: data.affiliateCode ?? code,
              affiliateId: data.affiliateId ?? null,
              source: src || 'affiliate',
              medium: med || 'qr_code',
              campaign: cam || 'partner_link',
            }),
          })
            .then(() => sessionStorage.setItem(clickTrackKey, '1'))
            .catch((error) => console.error('[PageMode] Referral click track failed:', error));
        }
      })
      .catch(() => {
        // Fallback: use the raw code without full resolution
        setResolvedAffiliateCode(code);
        setReferralAttribution({
          affiliateCode: code,
          affiliateId: null,
          affiliateName: null,
          affiliateEmail: null,
          source: src,
          medium: med,
          campaign: cam,
        });
      });

    // Clean URL params after extraction (keeps URL clean)
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const rootStyle = document.documentElement.style;
    const runtimeProfile = getCachedRuntimeProfile();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const cachedUA = navigator.userAgent.toLowerCase(); // Cache UA — never changes during session

    const updateViewportMetrics = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const viewportWidth = window.visualViewport?.width || window.innerWidth;

      rootStyle.setProperty('--pagemode-vh', `${Math.max(1, viewportHeight) * 0.01}px`);

      const isVeryNarrowPhone = viewportWidth <= 390;
      const isNarrowPhone = viewportWidth <= 430;
      const isCompactPhone = viewportWidth <= 480;
      const isInstagramInApp = RE_INSTAGRAM.test(cachedUA);
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
    };

    updateViewportMetrics();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateViewportMetrics);
    } else {
      window.addEventListener('resize', updateViewportMetrics);
    }

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateViewportMetrics);
      } else {
        window.removeEventListener('resize', updateViewportMetrics);
      }
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  // --- WELCOME AUDIO: Play once on page load (deferred to avoid blocking initial render) ---
  useEffect(() => {
    const audioKey = 'bullmoney_welcome_audio_played';
    const hasPlayed = sessionStorage.getItem(audioKey);
    if (hasPlayed) return; // Already played this session

    let audio: HTMLAudioElement | null = null;
    let cancelled = false;

    // Defer audio creation to avoid blocking main thread during initial load
    const scheduleAudio = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 200);

    const idleId = scheduleAudio(() => {
      if (cancelled) return;
      audio = new Audio('/luvvoice.com-20260201-ByklU8.mp3');
      audio.loop = false;
      audio.volume = 0.7;
      audio.preload = 'none'; // Don't preload until play() is called

      const markPlayed = () => sessionStorage.setItem(audioKey, 'true');

      audio.play()
        .then(markPlayed)
        .catch(() => {
          // Autoplay blocked - wait for user interaction
          const playOnInteraction = () => {
            audio?.play().then(markPlayed).catch(() => {});
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
          };
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          document.addEventListener('keydown', playOnInteraction, { once: true });
        });
    });

    return () => {
      cancelled = true;
      if (typeof cancelIdleCallback !== 'undefined' && typeof idleId === 'number') {
        cancelIdleCallback(idleId);
      }
      if (audio) {
        audio.pause();
        audio.src = '';
      }
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
  
  // Helper to get neon icon class based on active broker
  const neonIconClass = isXM ? "neon-red-icon" : "neon-blue-icon";

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
          referral_attribution: hasAffiliateAttribution && referralAttribution
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
      await persistFullSession({
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
      await persistFullSession({
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
          <WelcomeSplineBackground isDesktop={isDesktop} />
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
      {loading && MultiStepLoaderComp && (
          <div 
             // CRITICAL: Fixed, full coverage, max z-index to overlay native browser UI
             className="fixed inset-0 z-99999999 w-screen"
             style={{ height: '100dvh', minHeight: '-webkit-fill-available', backgroundColor: '#ffffff' }}
             // We render the loader component inside this wrapper
          >
        <MultiStepLoaderComp 
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
          fontFamily: FONT_FAMILY_SHORT,
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
        <div className={cn("absolute bottom-0 right-0 w-75 md:w-125 h-75 md:h-125 rounded-full blur-[80px] pointer-events-none transition-colors duration-500 gpu-accel -z-10", isXM ? "bg-red-900/10" : "bg-white/10")} />

        {/* ================= WELCOME SCREEN (Step -1) ================= */}
        {step === -1 && (
          <WelcomeStep
            isDesktop={isDesktop}
            WelcomeScreenDesktop={WelcomeScreenDesktop as any}
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
            mobile={
              <WelcomeStepMobile
                motion={motion}
                onLogin={() => { setViewMode('login'); setStep(0); }}
                onSignUp={() => { setViewMode('register'); setStep(0); }}
                onGuest={() => setStep(-2)}
                onOpenLegal={(tab) => { setLegalModalTab(tab); setIsLegalModalOpen(true); }}
                SafePortal={SafePortal as any}
                UnifiedFpsPillComp={UnifiedFpsPillComp as any}
                UnifiedHubPanelComp={UnifiedHubPanelComp as any}
                isHubOpen={isHubOpen}
                closeHubPanel={closeHubPanel}
                isHubMinimized={isHubMinimized}
                toggleHubMinimized={toggleHubMinimized}
                openHubPanel={openHubPanel}
                prices={prices}
                UI_Z_INDEX={UI_Z_INDEX as any}
                FONT_FAMILY_SHORT={FONT_FAMILY_SHORT}
                FONT_FAMILY_FULL={FONT_FAMILY_FULL}
              />
            }
          />
        )}

        {/* ================= GUEST INTERMEDIATE SCREEN (Step -2) ================= */}
        {step === -2 && (
          <WelcomeStepGuest
            motion={motion}
            onBack={() => setStep(-1)}
            onContinue={() => { setStep(99); onUnlock(); }}
            SafePortal={SafePortal as any}
            UnifiedFpsPillComp={UnifiedFpsPillComp as any}
            UnifiedHubPanelComp={UnifiedHubPanelComp as any}
            isHubOpen={isHubOpen}
            closeHubPanel={closeHubPanel}
            isHubMinimized={isHubMinimized}
            toggleHubMinimized={toggleHubMinimized}
            openHubPanel={openHubPanel}
            prices={prices}
            UI_Z_INDEX={UI_Z_INDEX as any}
            iosInAppShieldStyle={iosInAppShieldStyle}
            FONT_FAMILY_SHORT={FONT_FAMILY_SHORT}
            FONT_FAMILY_FULL={FONT_FAMILY_FULL}
          />
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
               style={STYLE_BACK_BTN}
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
                 fontFamily: FONT_FAMILY_FULL,
                 perspective: 1200,
                 transformStyle: 'preserve-3d' as any,
               }}
             >
                {/* Top edge highlight */}
                <div style={STYLE_TOP_EDGE} />

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
              <BrokerSelector motion={motion} activeBroker={activeBroker} onSwitch={handleBrokerSwitch} />
            )}

            <AnimatePresence mode="wait">

              {/* --- SCREEN 1: ENTRY GATE (Step 0) - APPLE STYLE --- */}
              {step === 0 && (
                <Step0EntryGate
                  motion={motion}
                  iosInAppShieldStyle={iosInAppShieldStyle}
                  returnToAccountManager={returnToAccountManager}
                  onBackToWelcome={() => setStep(-1)}
                  onBackToAccountManager={() => {
                    localStorage.removeItem('return_to_account_manager');
                    router.push('/?openAccountManager=true');
                  }}
                  onGetStarted={handleNext}
                  onToggleViewMode={toggleViewMode}
                  STYLE_BACK_BTN={STYLE_BACK_BTN}
                  STYLE_TOP_EDGE={STYLE_TOP_EDGE}
                  FONT_FAMILY_FULL={FONT_FAMILY_FULL}
                />
              )}

              {/* --- SCREEN 2: OPEN ACCOUNT (Step 1) --- */}
              {step === 1 && (
                <Step1OpenAccount
                  motion={motion}
                  StepCard={StepCard as any}
                  getStepProps={getStepProps}
                  isXM={isXM}
                  disableBackdropBlur={disableBackdropBlur}
                  activeBroker={activeBroker}
                  brokerCode={brokerCode}
                  copied={copied}
                  copyCode={copyCode}
                  onOpenBrokerLink={handleBrokerClick}
                  onNext={handleNext}
                />
              )}

              {/* --- SCREEN 3: VERIFY ID (Step 2) --- */}
              {step === 2 && (
                <Step2VerifyId
                  motion={motion}
                  StepCard={StepCard as any}
                  getStepProps={getStepProps}
                  isXM={isXM}
                  shouldReduceEffects={shouldReduceEffects}
                  disableBackdropBlur={disableBackdropBlur}
                  activeBroker={activeBroker}
                  mt5Number={formData.mt5Number}
                  onChangeMt5={handleChange}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}

              {/* --- SCREEN 4: CREATE LOGIN (Step 3) --- */}
              {step === 3 && (
                <Step3CreateLogin
                  motion={motion}
                  StepCard={StepCard as any}
                  getStepProps={getStepProps}
                  isXM={isXM}
                  disableBackdropBlur={disableBackdropBlur}
                  formData={formData}
                  onChange={handleChange}
                  acceptedTerms={acceptedTerms}
                  onToggleAcceptedTerms={() => setAcceptedTerms(!acceptedTerms)}
                  showPassword={showPassword}
                  onToggleShowPassword={() => setShowPassword(!showPassword)}
                  referralAttribution={
                    (referralAttribution ?? { affiliateCode: '', affiliateName: '', affiliateEmail: '' }) as { affiliateCode: string; affiliateName: string; affiliateEmail: string }
                  }
                  submitError={submitError}
                  onNext={handleNext}
                  onBack={handleBack}
                  onOpenLegal={(tab) => { setLegalModalTab(tab); setIsLegalModalOpen(true); }}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      
      {/* Legal Disclaimer Modal */}
      {LegalDisclaimerModalComp && (
        <LegalDisclaimerModalComp
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />
      )}
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
        fontFamily: FONT_FAMILY_FULL,
        perspective: 1200,
        transformStyle: 'preserve-3d' as any,
      }}
    >
      {/* Subtle top-edge highlight for 3D depth */}
      <div style={STYLE_TOP_EDGE} />

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
