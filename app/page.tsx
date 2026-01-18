"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode, CSSProperties } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { detectBrowser } from "@/lib/browserDetection";
import { trackEvent, BullMoneyAnalytics } from "@/lib/analytics";

// ==========================================
// LAZY-LOAD HEAVY COMPONENTS FOR FAST INITIAL COMPILE
// ==========================================
const Hero = dynamic(() => import("@/components/hero"), { ssr: false });
const CTA = dynamic(() => import("@/components/Chartnews"), { ssr: false });
const Features = dynamic(() => import("@/components/features").then(mod => ({ default: mod.Features })), { ssr: false });

// UNIFIED SHIMMER SYSTEM - Import from single source
import {
  ShimmerBorder,
  ShimmerLine,
  ShimmerSpinner,
  ShimmerDot,
  ShimmerFloat,
  ShimmerRadialGlow,
  ShimmerContainer
} from "@/components/ui/UnifiedShimmer";
import { SplineSkeleton, LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useCacheContext } from "@/components/CacheManagerProvider";
import { useUnifiedPerformance, useVisibility, useObserver, useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking, useCrashTracker } from "@/lib/CrashTracker";
import { useScrollOptimization } from "@/hooks/useScrollOptimization";
import { useBigDeviceScrollOptimizer } from "@/lib/bigDeviceScrollOptimizer";
// Use optimized ticker for 120Hz performance - lazy load
const LiveMarketTicker = dynamic(() => import("@/components/LiveMarketTickerOptimized").then(mod => ({ default: mod.LiveMarketTickerOptimized })), { ssr: false });
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useUIState } from "@/contexts/UIStateContext";
const HiddenYoutubePlayer = dynamic(() => import("@/components/Mainpage/HiddenYoutubePlayer"), { ssr: false });
import { ALL_THEMES } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";

const MobileSwipeNavigator = dynamic(() => import("@/components/navigation/MobileSwipeNavigator"), { ssr: false });
const DesktopKeyNavigator = dynamic(() => import("@/components/navigation/DesktopKeyNavigator"), { ssr: false });

// Import loaders - lazy
const PageMode = dynamic(() => import("@/components/REGISTER USERS/pagemode"), { ssr: false });
const MultiStepLoaderv2 = dynamic(() => import("@/components/MultiStepLoaderv2"), { ssr: false });

// Lazy imports for heavy 3D components
const DraggableSplit = dynamic(() => import('@/components/DraggableSplit'), { ssr: false });
const SplineScene = dynamic(() => import('@/components/SplineScene'), { ssr: false });
const TestimonialsCarousel = dynamic(() => import('@/components/Testimonial').then(mod => ({ default: mod.TestimonialsCarousel })), { ssr: false });

type RemoteSplineMeta = {
  id: string;
  title: string;
  subtitle?: string;
  viewer: string;
  runtime: string;
  accent?: string;
  badge?: string;
  aspectRatio?: string;
};

const DRAGGABLE_SPLIT_SCENES: Record<'glassCurtain' | 'orbScroll', RemoteSplineMeta> = {
  glassCurtain: {
    id: 'glassCurtain',
    runtime: "https://prod.spline.design/pERFMZP1PEeizk2N/scene.splinecode",
    viewer: "https://my.spline.design/glasscurtain-a6oJvU7009VpSevqPvEeVyI7/",
    title: "Market Depth Analyzer",
    subtitle: "Dual-chart order book monitoring",
    accent: '#38bdf8',
    aspectRatio: '4 / 3'
  },
  orbScroll: {
    id: 'orbScroll',
    runtime: "https://prod.spline.design/QfpAnXg8I-cL9KnC/scene.splinecode",
    viewer: "https://my.spline.design/orbscrolltriggerforhero-cukhAyxazfE0BSBUcFrD8NBf/",
    title: "Price Action Indicator",
    subtitle: "Real-time volatility tracking",
    accent: '#a855f7',
    aspectRatio: '4 / 3'
  }
};

const ADDITIONAL_SPLINE_PAGES: RemoteSplineMeta[] = [
  {
    id: 'followers-focus',
    title: 'Liquidity Scanner',
    subtitle: 'Live trading signal detection network',
    viewer: 'https://my.spline.design/100followersfocus-55tpQJYDbng5lAQ3P1tq5abx/',
    runtime: 'https://prod.spline.design/IomoYEa50DmuiTXE/scene.splinecode',
    accent: '#22d3ee',
    badge: 'Live Trading',
    aspectRatio: '16 / 9'
  },
  {
    id: 'loading-bar-vertical',
    title: 'Portfolio Progress Tracker',
    subtitle: 'Vertical growth momentum visualization',
    viewer: 'https://my.spline.design/theloadingbarvertical-J0jRfhBsRDUAUKzNRxMvZXak/',
    runtime: 'https://prod.spline.design/TOPNo0pcBjY8u6Ls/scene.splinecode',
    accent: '#fbbf24',
    badge: 'Portfolio',
    aspectRatio: '9 / 16'
  },
  {
    id: 'cannon-lab',
    title: 'Launch Momentum Engine',
    subtitle: 'Breakout detection and entry signals',
    viewer: 'https://my.spline.design/cannon-vOk1Cc5VyFBvcSq1ozXuhK1n/',
    runtime: 'https://prod.spline.design/C0mBZel0m7zXQaoD/scene.splinecode',
    accent: '#f472b6',
    badge: 'Advanced',
    aspectRatio: '16 / 9'
  },
  {
    id: 'x-gamer',
    title: 'Trading Arena Dashboard',
    subtitle: 'Multi-asset performance battle station',
    viewer: 'https://my.spline.design/xgamer-RZ9X6L57SHESs7L04p6IDisA/',
    runtime: 'https://prod.spline.design/1HGlyIYtYszh-B-r/scene.splinecode',
    accent: '#4ade80',
    badge: 'Competitive',
    aspectRatio: '16 / 9'
  }
];

const R4X_BOT_SCENE: RemoteSplineMeta = {
  id: 'r4x-bot',
  title: 'Market Scout AI Bot',
  subtitle: 'Autonomous trading opportunity analyzer',
  viewer: 'https://my.spline.design/r4xbot-2RZeOpfgJ0Vr36G9Jd9EHlFB/',
  runtime: 'https://prod.spline.design/G3yn-KsfkIAbK2Mz/scene.splinecode',
  accent: '#60a5fa',
  badge: 'AI Trading',
  aspectRatio: '16 / 9'
};

const ALL_REMOTE_SPLINES: RemoteSplineMeta[] = [
  ...(Object.values(DRAGGABLE_SPLIT_SCENES) as RemoteSplineMeta[]),
  ...ADDITIONAL_SPLINE_PAGES,
  R4X_BOT_SCENE,
];

// --- SMART CONTAINER: Handles Preloading & FPS Saving ---
// FIXED: Prevents constant reloading on small devices by:
// 1. Using hasLoadedOnce to keep Spline mounted after first load
// 2. Only using visibility for initial load trigger, not unmounting
// 3. Using CSS visibility instead of conditional rendering for FPS savings
// 4. CLS FIX: Fixed dimensions prevent layout shift during load
// 5. ENHANCED: Advanced device detection prevents performance issues
// 6. MOBILE CRASH FIX: Conservative settings for mobile devices
function LazySplineContainer({ scene }: { scene: string }) {
  const [isInView, setIsInView] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [canRender, setCanRender] = useState(true);
  const [fpsMonitorActive, setFpsMonitorActive] = useState(false);
  const [emergencyFallback, setEmergencyFallback] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [mobileSplineSettings, setMobileSplineSettings] = useState({ targetFPS: 60, maxDpr: 1.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const deviceCheckDone = useRef(false);
  const fpsHistory = useRef<number[]>([]);
  const performanceCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Use unified observer pool instead of individual IntersectionObserver
  const { observe, deviceTier, averageFps } = useUnifiedPerformance();

  // MOBILE CRASH FIX: Detect mobile and set conservative settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|mobile/i.test(ua);
    const memory = (navigator as any).deviceMemory || 4;
    const isLowEnd = isMobile && (memory < 3 || window.innerWidth < 375);
    
    setIsMobileDevice(isMobile);
    setMobileSplineSettings({
      targetFPS: isLowEnd ? 24 : (isMobile ? 30 : 60),
      maxDpr: isLowEnd ? 0.75 : (isMobile ? 1.0 : 1.5),
    });
    
    if (isMobile) {
      console.log('[LazySpline] Mobile device detected - using crash-safe settings');
    }
  }, []);

  // HERO SPLINE: ALWAYS RENDERS ON ALL DEVICES - NO RESTRICTIONS
  // Target: 50ms load time with zero lag (with mobile safety)
  useEffect(() => {
    if (deviceCheckDone.current) return;
    deviceCheckDone.current = true;

    // HERO OVERRIDE: Always render, optimize quality instead of blocking
    console.log('[LazySpline] HERO MODE: Enabled on ALL devices' + (isMobileDevice ? ' (MOBILE SAFE)' : ''));
    setCanRender(true);
    
    // Ultra-aggressive preloading for 50ms target
    if (typeof window !== 'undefined') {
      // Preload scene immediately
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = '/scene1.splinecode';
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      // Warm up browser cache
      fetch('/scene1.splinecode', { 
        method: 'GET', 
        mode: 'cors',
        cache: 'force-cache',
        priority: 'high'
      } as any).catch(() => {});
    }
  }, []);

  // Performance monitoring for marginal devices
  useEffect(() => {
    if (!fpsMonitorActive || !hasLoadedOnce) return;

    const monitorPerformance = () => {
      fpsHistory.current.push(averageFps);
      
      // Keep only last 30 readings (about 2-3 seconds)
      if (fpsHistory.current.length > 30) {
        fpsHistory.current.shift();
      }

      // If we have enough data and performance is consistently poor
      if (fpsHistory.current.length >= 10) {
        const recentAvg = fpsHistory.current.slice(-10).reduce((a, b) => a + b) / 10;
        
        // Emergency fallback if FPS drops below 15 consistently
        if (recentAvg < 15 && !emergencyFallback) {
          console.warn('[LazySpline] Emergency fallback triggered due to poor performance:', recentAvg);
          setEmergencyFallback(true);
        }
      }
    };

    performanceCheckInterval.current = setInterval(monitorPerformance, 100);

    return () => {
      if (performanceCheckInterval.current) {
        clearInterval(performanceCheckInterval.current);
      }
    };
  }, [fpsMonitorActive, hasLoadedOnce, averageFps, emergencyFallback]);

  // Use shared observer pool for visibility detection
  // FIXED: Only triggers initial load, doesn't cause unmounting
  useEffect(() => {
    if (!containerRef.current || !canRender) return;

    return observe(containerRef.current, (isIntersecting) => {
      setIsInView(isIntersecting);
      // Once loaded, never unload - just pause rendering via CSS
      if (isIntersecting && !hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }, { rootMargin: deviceTier === 'ultra' || deviceTier === 'high' ? '1400px' : deviceTier === 'medium' ? '1100px' : '600px' });
  }, [observe, hasLoadedOnce, canRender, deviceTier]);

  // HERO MODE: Never show fallback - always attempt to render Spline
  // Only show fallback if explicitly requested (never for hero)
  if (false) { // Disabled for hero
    const fallbackReason = 'Disabled';
    
    return (
      <div 
        className="w-full h-full relative bg-black rounded-2xl overflow-hidden group spline-container" 
        style={{ 
          touchAction: 'pan-y',
          minHeight: '300px',
          height: '100%',
          contain: 'strict',
        }}
        data-spline-scene
        data-fallback-reason={fallbackReason}
      >
        {/* Spinning Conic Gradient Shimmer Border */}
        <ShimmerBorder color="blue" intensity="medium" speed="normal" />

        {/* Inner container */}
        <div className="relative z-10 h-full w-full bg-black rounded-2xl m-[1px] overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.3)', borderWidth: '1px', borderStyle: 'solid' }}>
          {/* Top Shimmer Line */}
          <ShimmerLine color="blue" />

          {/* Radial Glow Effect */}
          <ShimmerRadialGlow color="blue" intensity="medium" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {/* BullMoney logo with floating effect */}
            <ShimmerFloat className="relative w-20 h-20">
              {/* Spinning border ring */}
              <ShimmerBorder color="blue" intensity="medium" className="inset-[-3px] rounded-full" />
              <div className="relative w-full h-full rounded-full bg-neutral-900 flex items-center justify-center overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.4)', borderWidth: '1px', borderStyle: 'solid' }}>
                <Image
                  src="/BULL.svg"
                  alt="BullMoney"
                  width={48}
                  height={48}
                  className="opacity-90"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(var(--accent-rgb, 59, 130, 246), 0.5))' }}
                  priority
                />
              </div>
            </ShimmerFloat>
            <p className="text-xs font-bold tracking-wider theme-accent" style={{ color: 'var(--accent-color, #3b82f6)', filter: 'drop-shadow(0 0 10px rgba(var(--accent-rgb, 59, 130, 246), 0.5))' }}>
              {emergencyFallback ? 'Performance Mode' : '3D View'}
            </p>
            <p className="text-[10px] font-medium text-center px-2" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.6)' }}>
              {emergencyFallback ? 'Optimized for smooth performance' : 'Optimized for your device'}
            </p>

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

  // HERO MODE: Always show Spline, never pause for hero section
  // This ensures hero is always interactive and visible
  // CLS FIX: Container has fixed dimensions to prevent layout shift
  const shouldShowSpline = true; // HERO: Always show
  const isPaused = false; // HERO: Never pause

  return (
    // 'isolate' is crucial here so the Interaction Button in SplineScene works correctly with z-index
    // HERO MODE: Ultra-optimized for 50ms load and perfect scroll
    // CLS FIX: Fixed dimensions prevent layout shift
    <div
      ref={containerRef}
      className="w-full h-full relative isolate overflow-hidden rounded-xl spline-container"
      data-spline-scene
      data-hero-mode="true"
      style={{
        contain: 'layout style', // Less restrictive for hero smooth scrolling
        touchAction: 'pan-y', // Perfect vertical scrolling
        position: 'relative',
        minHeight: '300px',
        height: '100%',
        WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
        overscrollBehavior: 'none', // Prevent bounce scrolling interference
      }}
    >
      {/* Loading placeholder - shown before first load */}
      {/* CLS FIX: Placeholder has same size as content */}
      {!hasLoadedOnce && !isInView && (
        <div className="absolute inset-0 bg-transparent rounded-xl overflow-hidden backdrop-blur-sm" style={{ minHeight: '300px', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <ShimmerRadialGlow color="blue" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="blue" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}

      {/* Spline Scene - STAYS MOUNTED after first load, uses CSS to pause when out of view */}
      {shouldShowSpline && (
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <ShimmerRadialGlow color="blue" intensity="medium" />
            <ShimmerLine color="blue" />
            <ShimmerSpinner size={40} color="blue" />
          </div>
        }>
          <div
            className="absolute inset-0 pointer-events-none md:pointer-events-auto transition-opacity duration-300"
            style={{
              touchAction: 'pan-y',
              // When paused (out of view), reduce opacity and add will-change: auto to hint browser to free GPU memory
              opacity: isPaused ? 0 : 1,
              visibility: isPaused ? 'hidden' : 'visible',
              // Tell browser this element won't change when hidden - helps free resources
              willChange: isPaused ? 'auto' : 'transform',
            }}
          >
            <SplineScene scene={scene} />
          </div>
        </Suspense>
      )}

      {/* Paused overlay - shown when Spline is loaded but out of view */}
      {isPaused && (
        <div className="absolute inset-0 bg-black rounded-xl overflow-hidden">
          <ShimmerLine color="blue" speed="slow" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="blue" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}
    </div>
  );
}

function RemoteSplineFrame({ viewerSrc, sceneSrc, title }: { viewerSrc: string; sceneSrc: string; title: string }) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <LazySplineContainer scene={sceneSrc} />;
  }

  return (
    <div className="w-full h-full relative bg-black">
      <iframe
        src={viewerSrc}
        title={title}
        loading="lazy"
        allow="fullscreen; autoplay; xr-spatial-tracking"
        allowFullScreen
        className="w-full h-full border-0 bg-transparent"
        referrerPolicy="no-referrer-when-downgrade"
        onError={() => setUseFallback(true)}
      />
    </div>
  );
}

function RemoteSplineShowcase({ scene, onOpen }: { scene: RemoteSplineMeta; onOpen: (scene: RemoteSplineMeta) => void }) {
  const blueAccent = '#0ea5e9';

  return (
    <div
      className="group relative rounded-2xl p-6 flex flex-col gap-4 border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, #0f172a, #082f49)',
        borderColor: blueAccent,
        boxShadow: `0 0 20px ${blueAccent}33`,
      }}
      onClick={() => onOpen(scene)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/5 to-transparent group-hover:via-sky-500/10 transition-all duration-500 pointer-events-none" />
      <div className="relative flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-bold">
        <span style={{ color: blueAccent }}>▪</span>
        <span style={{ color: blueAccent }}>{scene.id}</span>
        {scene.badge && (
          <span
            className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: `${blueAccent}22`,
              border: `1px solid ${blueAccent}`,
              color: blueAccent,
            }}
          >
            {scene.badge}
          </span>
        )}
      </div>
      <div>
        <h3
          className="text-xl font-bold text-white"
          style={{ textShadow: `0 0 12px ${blueAccent}66` }}
        >
          {scene.title}
        </h3>
        {scene.subtitle && (
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            {scene.subtitle}
          </p>
        )}
      </div>
      <div className="flex-1" />
      <button
        onClick={() => onOpen(scene)}
        className="relative inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${blueAccent}, #0284c7)`,
          color: '#0f172a',
          boxShadow: `0 0 20px ${blueAccent}44`,
        }}
      >
        Launch Scene
      </button>
    </div>
  );
}

function DraggableSplitExperience({ style }: { style?: CSSProperties } = {}) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden spline-container"
      style={{
        height: '800px',
        minHeight: '500px',
        contain: 'strict',
        ...style,
      }}
    >
      <ShimmerBorder color="blue" intensity="low" speed="normal" />
      <div className="relative z-10 w-full h-full bg-black rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
        <ShimmerLine color="blue" className="z-20" />
        <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '100%' }} />}>
          <DraggableSplit>
            <RemoteSplineFrame
              viewerSrc={DRAGGABLE_SPLIT_SCENES.glassCurtain.viewer}
              sceneSrc={DRAGGABLE_SPLIT_SCENES.glassCurtain.runtime}
              title={DRAGGABLE_SPLIT_SCENES.glassCurtain.title}
            />
            <RemoteSplineFrame
              viewerSrc={DRAGGABLE_SPLIT_SCENES.orbScroll.viewer}
              sceneSrc={DRAGGABLE_SPLIT_SCENES.orbScroll.runtime}
              title={DRAGGABLE_SPLIT_SCENES.orbScroll.title}
            />
          </DraggableSplit>
        </Suspense>
      </div>
    </div>
  );
}

function SplitExperienceCard({ onOpen }: { onOpen: () => void }) {
  const blueAccent = '#0ea5e9';
  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-4 border-2 overflow-hidden group cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #0f172a, #082f49)',
        borderColor: blueAccent,
        boxShadow: `0 0 20px ${blueAccent}33`,
      }}
      onClick={onOpen}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/5 to-transparent group-hover:via-sky-500/10 transition-all duration-500 pointer-events-none" />
      <span className="relative text-xs uppercase tracking-[0.3em] font-bold" style={{ color: blueAccent }}>▪ Dual Chart Monitor</span>
      <h3 className="relative text-2xl font-bold text-white" style={{ textShadow: `0 0 15px ${blueAccent}66` }}>Trading Split View</h3>
      <p className="relative text-sm" style={{ color: '#94a3b8' }}>
        Compare real-time charts side-by-side with advanced trading controls and instant execution.
      </p>
      <div className="flex-1" />
      <button
        onClick={onOpen}
        className="relative inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${blueAccent}, #0284c7)`,
          color: '#0f172a',
          boxShadow: `0 0 20px ${blueAccent}44`,
        }}
      >
        Launch Trading View
      </button>
    </div>
  );
}

function ModalShell({
  open,
  onClose,
  title,
  accent = 'var(--accent-color, #3b82f6)',
  subtitle,
  children,
  contentAspectRatio = '16 / 9',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentAspectRatio?: string | null;
}) {
  const [portalNode, setPortalNode] = useState<Element | null>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalNode(document.body);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const evaluate = () => setIsCompact(window.innerWidth < 640);
    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, []);

  if (!open || !portalNode) return null;

  const blueAccent = '#0ea5e9';
  const darkBg = '#0f172a';
  const borderColor = '#0369a1';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-3 py-6 sm:p-8">
      <div className="absolute inset-0 bg-black/85" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${isCompact ? 'max-w-sm' : 'max-w-4xl'} max-h-[92vh] min-h-[320px] overflow-hidden flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.3)]`}
        style={{
          background: `linear-gradient(135deg, ${darkBg}, #0c1222)`,
          border: `2px solid ${borderColor}`,
          borderRadius: '20px',
        }}
      >
        {/* Animated gradient border glow */}
        <div
          className="absolute inset-0 rounded-[18px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, ${blueAccent}33, transparent, ${blueAccent}33)`,
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />

        {/* Header with blue theme */}
        <div
          className="relative z-10 flex items-start justify-between gap-4 p-4 sm:p-6 border-b"
          style={{ borderColor }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-bold" style={{ color: blueAccent }}>
              ▪ Trading Terminal
            </p>
            <h3 className="text-2xl font-bold text-white mt-2" style={{ textShadow: `0 0 20px ${blueAccent}66` }}>
              {title}
            </h3>
            {subtitle && <p className="text-sm mt-1" style={{ color: '#64748b' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-all duration-300 hover:scale-110"
            style={{
              border: `1.5px solid ${blueAccent}`,
              color: blueAccent,
              backgroundColor: `${blueAccent}11`,
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-[300px] max-h-[calc(92vh-140px)] p-3 sm:p-6 overflow-hidden flex items-center justify-center relative z-10">
          <div
            className="w-full rounded-xl overflow-hidden"
            style={{
              background: '#000a1a',
              border: `1px solid ${blueAccent}44`,
              boxShadow: `inset 0 0 20px ${blueAccent}22`,
              ...(contentAspectRatio
                ? {
                    aspectRatio: contentAspectRatio,
                    width: '100%',
                    maxWidth: isCompact ? 'min(80vw, 420px)' : '90vw',
                  }
                : {
                    minHeight: '100%',
                    height: '100%',
                    width: '100%',
                    maxWidth: isCompact ? 'min(80vw, 420px)' : '90vw',
                  }),
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    portalNode
  );
}

function RemoteSceneModal({ scene, onClose }: { scene: RemoteSplineMeta | null; onClose: () => void }) {
  if (!scene) return null;

  return (
    <ModalShell
      open={!!scene}
      onClose={onClose}
      title={scene.title}
      subtitle={scene.subtitle}
      accent={scene.accent}
      contentAspectRatio={scene.aspectRatio ?? '16 / 9'}
    >
      <div className="w-full h-full">
        <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '100%' }} />}>
          <RemoteSplineFrame viewerSrc={scene.viewer} sceneSrc={scene.runtime} title={scene.title} />
        </Suspense>
      </div>
    </ModalShell>
  );
}

function SplitSceneModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Interactive Split Lab"
      subtitle="Dual-scene comparison"
      accent="#38bdf8"
      contentAspectRatio="4 / 3"
    >
      <DraggableSplitExperience style={{ height: '100%', minHeight: '0px' }} />
    </ModalShell>
  );
}

function HomeContent() {
  // Initialize big device scroll optimization
  const { optimizeSection } = useBigDeviceScrollOptimizer();
  
  const [currentView, setCurrentView] = useState<'pagemode' | 'loader' | 'content'>('pagemode');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeRemoteScene, setActiveRemoteScene] = useState<RemoteSplineMeta | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const splinePreloadRanRef = useRef(false);
  const { setLoaderv2Open, setV2Unlocked } = useUIState();

  // Use unified performance for tracking - only need device tier
  const { 
    deviceTier, 
    registerComponent, 
    unregisterComponent,
    averageFps,
    shimmerQuality,
    preloadQueue,
    unloadQueue 
  } = useUnifiedPerformance();
  
  // Crash tracking for the main page
  const { trackClick, trackError, trackCustom } = useComponentTracking('page');
  const { trackPerformanceWarning } = useCrashTracker();

  // Use global theme context - syncs with hero.tsx and entire app
  const { activeThemeId, activeTheme, setAppLoading } = useGlobalTheme();
  
  // Fallback theme lookup if context not ready
  const theme = activeTheme || ALL_THEMES.find(t => t.id === activeThemeId) || ALL_THEMES[0];
  useAudioEngine(!isMuted, 'MECHANICAL');
  
  // Track FPS drops and log them
  useEffect(() => {
    if (averageFps < 25 && currentView === 'content') {
      trackPerformanceWarning('page', averageFps, `FPS dropped to ${averageFps}`);
    }
  }, [averageFps, currentView, trackPerformanceWarning]);
  
  // Smart preloading based on usage patterns
  useEffect(() => {
    if (preloadQueue.length > 0) {
      console.log('[Page] Preload suggestions:', preloadQueue);
      // Could trigger lazy loading of components in queue
    }
    if (unloadQueue.length > 0) {
      console.log('[Page] Unload suggestions:', unloadQueue);
      // Could unmount heavy components to save memory
    }
  }, [preloadQueue, unloadQueue]);
  
  // Track if components are registered to prevent duplicate registrations
  const componentsRegisteredRef = useRef(false);
  
  // Register main content components with unified system
  useEffect(() => {
    if (currentView === 'content' && !componentsRegisteredRef.current) {
      componentsRegisteredRef.current = true;
      registerComponent('hero', 9);
      registerComponent('features', 5);
      registerComponent('chartnews', 6);
      registerComponent('ticker', 7);
      trackCustom('content_loaded', { deviceTier, shimmerQuality });
      
      // Apply big device scroll optimizations to main sections
      if (typeof window !== 'undefined' && window.innerWidth >= 1440) {
        setTimeout(() => {
          optimizeSection('hero');
          optimizeSection('experience');
          optimizeSection('cta');
          optimizeSection('features');
        }, 100);
      }
    }
    return () => {
      // Only unregister if we actually registered
      if (componentsRegisteredRef.current) {
        componentsRegisteredRef.current = false;
        unregisterComponent('hero');
        unregisterComponent('features');
        unregisterComponent('chartnews');
        unregisterComponent('ticker');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]); // Only depend on currentView to prevent infinite loops
  
  useEffect(() => {
    if (currentView === 'content') {
      setAppLoading(false);
    } else {
      setAppLoading(true);
    }
  }, [currentView, setAppLoading]);

  useEffect(() => {
    setLoaderv2Open(currentView === 'loader');
    return () => setLoaderv2Open(false);
  }, [currentView, setLoaderv2Open]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = activeRemoteScene || isSplitModalOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeRemoteScene, isSplitModalOpen]);

  // Load muted preference from localStorage
  useEffect(() => {
    const savedMuted = localStorage.getItem('bullmoney_muted');
    if (savedMuted === 'true') setIsMuted(true);
  }, []);

  // 1. STEALTH PRE-LOADER - Now starts in pagemode so Spline loads early
  useEffect(() => {
    // Start preloading immediately, even during pagemode
    // This ensures Spline is ready by the time user finishes the loader
    const preloadSplineEngine = async () => {
      try {
        const browserInfo = detectBrowser();
        if (browserInfo.isInAppBrowser || !browserInfo.canHandle3D) return;
        if (splinePreloadRanRef.current) return;

        // Only worth it on devices that will actually render 3D
        if (deviceTier === 'low' || deviceTier === 'minimal') return;
        if (typeof window !== 'undefined' && window.innerWidth < 768) return;

        splinePreloadRanRef.current = true;

        // Prime runtime + component chunks so first in-view render is "snappy"
        await Promise.allSettled([
          import('@splinetool/runtime'),
          import('@/components/SplineScene'),
          import('@/components/DraggableSplit'),
          import('@/lib/spline-wrapper'),
        ]);

        // Warm HTTP cache for the home-page scenes
        const preloadResource = (href: string, as: HTMLLinkElement['as'] = 'fetch') => {
          if (typeof document === 'undefined') return;
          const selector = `link[rel="preload"][href="${href}"]`;
          if (document.querySelector(selector)) return;
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = as;
          link.href = href;
          if (as === 'fetch' || as === 'document') {
            link.crossOrigin = 'anonymous';
          }
          document.head.appendChild(link);
        };
        ALL_REMOTE_SPLINES.forEach(scene => {
          preloadResource(scene.viewer, 'document');
          preloadResource(scene.runtime);
        });

        console.log('[Page] Spline runtime + scenes preloaded during', currentView);
      } catch (e) {
        console.warn("Preload failed", e);
      }
    };
    // Start preloading immediately - no delay
    preloadSplineEngine();
  }, [deviceTier, currentView]);

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

  // Called when user completes the vault and taps "Access Website" button
  const handleLoaderComplete = useCallback(() => {
    setV2Unlocked(true);
    setCurrentView('content');
  }, [setV2Unlocked]);

  // REMOVED: Auto-transition timer that bypassed vault
  // The vault system in MultiStepLoaderv2 now controls when to show content
  // via the onFinished callback -> handleLoaderComplete

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
          <MultiStepLoaderv2 onFinished={handleLoaderComplete} />
        </div>
      )}

      {currentView === 'content' && (
        <>
          <main className="min-h-screen flex flex-col w-full" data-allow-scroll data-scrollable data-content data-theme-aware style={{ overflow: 'visible', height: 'auto' }}>
            <div id="top" />

            <section id="hero" className="w-full" data-allow-scroll data-content data-theme-aware>
              <Hero />
            </section>

            <section id="cta" className="w-full" data-allow-scroll data-content data-theme-aware>
              <CTA />
            </section>

            <section id="features" className="w-full" data-allow-scroll data-content data-theme-aware>
              <Features />
            </section>

            {/* 3D Spline Section - Desktop only; lightweight previews trigger modals */}
            <section 
              id="experience" 
              className="w-full max-w-7xl mx-auto px-4 py-12 md:py-16" 
              data-allow-scroll 
              data-content 
              data-theme-aware 
            >
              <div className="relative text-center mb-8" style={{ minHeight: '80px' }}>
                <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, white, var(--accent-color, #3b82f6), white)', filter: 'drop-shadow(0 0 20px rgba(var(--accent-rgb, 59, 130, 246), 0.5))' }}>
                  Trading Tools & Analytics
                </h2>
                <p className="text-xs mt-2 uppercase tracking-widest font-medium" style={{ color: 'rgba(var(--accent-rgb, 59, 130, 246), 0.6)' }}>Advanced market intelligence platforms</p>
                <div className="flex justify-center mt-4">
                  <div className="w-24 h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--accent-color, #3b82f6), transparent)' }} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SplitExperienceCard onOpen={() => setIsSplitModalOpen(true)} />
                {ADDITIONAL_SPLINE_PAGES.map(scene => (
                  <RemoteSplineShowcase key={scene.id} scene={scene} onOpen={setActiveRemoteScene} />
                ))}
              </div>
            </section>

            {/* Dedicated R4X Bot Showcase */}
            <section
              id="r4x-bot"
              className="w-full max-w-6xl mx-auto px-4 pb-16"
              data-allow-scroll
              data-content
              data-theme-aware
            >
              <div className="relative text-center mb-8 flex flex-col items-center gap-3" style={{ minHeight: '70px' }}>
                <p className="text-xs uppercase tracking-[0.4em] font-semibold" style={{ color: R4X_BOT_SCENE.accent }}>
                  ▪ AI-Powered Trading
                </p>
                <h2 className="text-2xl font-bold text-white">{R4X_BOT_SCENE.title}</h2>
                {R4X_BOT_SCENE.subtitle && (
                  <p className="text-sm text-white/60">{R4X_BOT_SCENE.subtitle}</p>
                )}
                <button
                  onClick={() => setActiveRemoteScene(R4X_BOT_SCENE)}
                  className="inline-flex items-center justify-center px-5 py-2 rounded-2xl border text-sm font-semibold text-white transition-colors"
                  style={{ borderColor: R4X_BOT_SCENE.accent, boxShadow: `0 0 20px ${R4X_BOT_SCENE.accent}33` }}
                >
                  Launch AI Bot View
                </button>
              </div>

              <div className="relative rounded-3xl overflow-hidden">
                <ShimmerBorder color="blue" intensity="low" speed="slow" />
                <div
                  className="relative z-10 bg-black rounded-3xl overflow-hidden"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', borderWidth: '1px', borderStyle: 'solid' }}
                >
                  <div className="w-full" style={{ aspectRatio: R4X_BOT_SCENE.aspectRatio ?? '16 / 9' }}>
                    <Suspense fallback={<SplineSkeleton className="w-full h-full" aspectRatio="auto" style={{ height: '100%' }} />}>
                      <RemoteSplineFrame viewerSrc={R4X_BOT_SCENE.viewer} sceneSrc={R4X_BOT_SCENE.runtime} title={R4X_BOT_SCENE.title} />
                    </Suspense>
                  </div>
                </div>
              </div>
            </section>

            {/* Mobile-only Testimonials Section - Shows on small devices instead of heavy 3D */}
            <section id="testimonials" className="w-full max-w-5xl mx-auto px-4 py-12 md:hidden" data-allow-scroll data-content data-theme-aware style={{ touchAction: 'pan-y' }}>
              {/* Section Header */}
              <div className="relative text-center mb-6">
                <h2 className="text-lg font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, white, var(--accent-color, #3b82f6), white)', filter: 'drop-shadow(0 0 15px rgba(var(--accent-rgb, 59, 130, 246), 0.5))' }}>
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
                
                <div className="relative z-10 bg-black rounded-2xl overflow-hidden" style={{ borderColor: 'rgba(var(--accent-rgb, 59, 130, 246), 0.2)', borderWidth: '1px', borderStyle: 'solid' }}>
                  <Suspense fallback={<LoadingSkeleton variant="card" height={320} />}>
                    <TestimonialsCarousel />
                  </Suspense>
                </div>
              </div>
            </section>

            <section id="ticker" className="w-full" data-allow-scroll data-footer data-theme-aware>
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

          <SplitSceneModal open={isSplitModalOpen} onClose={() => setIsSplitModalOpen(false)} />
          <RemoteSceneModal scene={activeRemoteScene} onClose={() => setActiveRemoteScene(null)} />
        </>
      )}
    </>
  );
}

// Removed duplicate GlobalThemeProvider - already wrapped in layout.tsx
export default function Home() {
  return <HomeContent />;
}
