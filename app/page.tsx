"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode, CSSProperties } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { detectBrowser } from "@/lib/browserDetection";
import { trackEvent, BullMoneyAnalytics } from "@/lib/analytics";

// ✅ MOBILE DETECTION - Conditional lazy loading for mobile optimization
import { isMobileDevice } from "@/lib/mobileDetection";

// ✅ LOADING FALLBACKS - Mobile-optimized loading states
import {
  HeroSkeleton,
  FeaturesSkeleton,
  MinimalFallback,
  ContentSkeleton,
  CardSkeleton,
} from "@/components/MobileLazyLoadingFallback";

// ==========================================
// ✅ MOBILE-OPTIMIZED LAZY LOADING - All components lazy loaded for mobile performance
// ==========================================
const Hero = dynamic(
  () => import("@/components/hero"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

// Desktop-optimized Hero with new layout
const HeroDesktop = dynamic(
  () => import("@/components/HeroDesktop"),
  { ssr: false, loading: () => <HeroSkeleton /> }
);

const CTA = dynamic(
  () => import("@/components/Chartnews"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

import { Features } from "@/components/features";

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

const SplineSkeleton = dynamic(
  () => import("@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.SplineSkeleton })),
  { ssr: true }
);

const LoadingSkeleton = dynamic(
  () => import("@/components/ui/LoadingSkeleton").then(mod => ({ default: mod.LoadingSkeleton })),
  { ssr: true }
);

import { useCacheContext } from "@/components/CacheManagerProvider";
import { useUnifiedPerformance, useVisibility, useObserver, useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking, useCrashTracker } from "@/lib/CrashTracker";
import { useScrollOptimization } from "@/hooks/useScrollOptimization";
import { useBigDeviceScrollOptimizer } from "@/lib/bigDeviceScrollOptimizer";

// Use optimized ticker for 120Hz performance - lazy load
const LiveMarketTicker = dynamic(
  () => import("@/components/LiveMarketTickerOptimized").then(mod => ({ default: mod.LiveMarketTickerOptimized })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useUIState } from "@/contexts/UIStateContext";

const HiddenYoutubePlayer = dynamic(
  () => import("@/components/Mainpage/HiddenYoutubePlayer"),
  { ssr: false }
);

import { ALL_THEMES } from "@/constants/theme-data";
import { useAudioEngine } from "@/app/hooks/useAudioEngine";
import Image from "next/image";

const MobileSwipeNavigator = dynamic(
  () => import("@/components/navigation/MobileSwipeNavigator"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

const DesktopKeyNavigator = dynamic(
  () => import("@/components/navigation/DesktopKeyNavigator"),
  { ssr: false }
);

// Import loaders - lazy
const PageMode = dynamic(
  () => import("@/components/REGISTER USERS/pagemode"),
  { ssr: false, loading: () => <MinimalFallback /> }
);

// ✅ MOBILE LAZY LOAD - MultiStepLoaderv2 deferred on mobile for better FPS
const MultiStepLoaderv2 = dynamic(
  () => import("@/components/MultiStepLoaderv2"),
  { 
    ssr: false, 
    loading: () => <MinimalFallback />,
    // Don't preload on mobile to save resources
  }
);

// Lazy imports for heavy 3D components - LOADED IMMEDIATELY for better scene performance
const DraggableSplit = dynamic(
  () => import('@/components/DraggableSplit'),
  { ssr: true, loading: () => <ContentSkeleton lines={5} /> }
);

const SplineScene = dynamic(
  () => import('@/components/SplineScene'),
  { ssr: true, loading: () => <ContentSkeleton lines={4} /> }
);

const TestimonialsCarousel = dynamic(
  () => import('@/components/Testimonial').then(mod => ({ default: mod.TestimonialsCarousel })),
  { ssr: true, loading: () => <CardSkeleton /> }
);

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

type SlotMission = {
  code: string;
  reward: number;
  description: string;
  goalType: 'combos' | 'taps' | 'jackpots';
  goalValue: number;
  unlockColor: string;
};

type SlotProfile = {
  credits: number;
  boosts: number;
  highCombo: number;
  missionsCompleted: number;
  missionCode: string;
  missionProgress: number;
  tapCount: number;
  colors: string[];
  activeColor: string;
  claimedVipCodes: string[];
  vipCode?: string;
  vipDuration?: string;
  lifetimeUnlocked?: boolean;
};

type VipRewardTier = {
  minTaps: number;
  maxTaps: number;
  code: string;
  duration: string;
};

type PspModalView = 'terminal' | 'missions' | 'vip' | 'themes' | null;

const PSP_SLOT_CODES = [
  'BULLMONEY',
  'BULLMONEY STREAMS',
  'X3R7P ACCESS KEY',
  'TELEGRAM VIP',
  'DISCORD HQ',
  'XM PARTNER',
  'VANTAGE SIGNALS',
  'LIVE COPY ROOM',
  'AI TRADE LAB',
  'VIP FUNDING',
  'MARKET RAID',
  'SCALP SQUAD',
];

const PSP_SLOT_REWARD_TABLE: Record<string, number> = {
  'BULLMONEY': 15,
  'BULLMONEY STREAMS': 10,
  'X3R7P ACCESS KEY': 9,
  'TELEGRAM VIP': 8,
  'DISCORD HQ': 8,
  'XM PARTNER': 6,
  'VANTAGE SIGNALS': 6,
  'LIVE COPY ROOM': 5,
  'AI TRADE LAB': 5,
  'VIP FUNDING': 7,
  'MARKET RAID': 4,
  'SCALP SQUAD': 4,
};

const PSP_SLOT_TICKER_SEGMENTS = [
  'JOIN BULLMONEY DISCORD',
  'CLAIM X3R7P ACCESS KEY',
  'STREAM SIGNALS TO XM',
  'REQUEST TELEGRAM VIP',
  'SYNC WITH VANTAGE PARTNERS',
  'BULLMONEY PSP TERMINAL LIVE',
  'GRAB WEEKLY PLAYBOOK DROPS',
];

const PSP_SLOT_HIGHLIGHTS = new Set([
  'BULLMONEY',
  'BULLMONEY STREAMS',
  'X3R7P ACCESS KEY',
  'TELEGRAM VIP',
  'DISCORD HQ',
  'XM PARTNER',
  'VANTAGE SIGNALS',
]);

const DEFAULT_PSP_COLOR = 'neoDefault';

const PSP_COLOR_THEMES: Record<string, { label: string; shell: string; border: string; glow: string; inner: string; accent: string }> = {
  [DEFAULT_PSP_COLOR]: {
    label: 'Neo Default',
    shell: 'radial-gradient(circle at 30% 20%, rgba(14, 165, 233, 0.25), rgba(2, 8, 23, 0.95))',
    border: 'rgba(14, 165, 233, 0.8)',
    glow: 'rgba(14, 165, 233, 0.25)',
    inner: 'rgba(14, 165, 233, 0.15)',
    accent: '#38bdf8',
  },
  neonAzure: {
    label: 'Neon Azure',
    shell: 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3), rgba(2, 8, 38, 0.95))',
    border: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.35)',
    inner: 'rgba(59, 130, 246, 0.2)',
    accent: '#60a5fa',
  },
  magentaFlux: {
    label: 'Magenta Flux',
    shell: 'radial-gradient(circle at 40% 20%, rgba(244, 114, 182, 0.3), rgba(29, 7, 27, 0.96))',
    border: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.4)',
    inner: 'rgba(244, 114, 182, 0.2)',
    accent: '#fb7185',
  },
  emeraldWire: {
    label: 'Emerald Wire',
    shell: 'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.28), rgba(4, 24, 21, 0.95))',
    border: '#22c55e',
    glow: 'rgba(16, 185, 129, 0.35)',
    inner: 'rgba(34, 197, 94, 0.2)',
    accent: '#86efac',
  },
  obsidianPulse: {
    label: 'Obsidian Pulse',
    shell: 'radial-gradient(circle at 60% 30%, rgba(147, 197, 253, 0.25), rgba(3, 7, 18, 0.98))',
    border: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.35)',
    inner: 'rgba(148, 163, 184, 0.18)',
    accent: '#c7d2fe',
  },
};

const PSP_SLOT_MISSIONS: SlotMission[] = [
  {
    code: 'BULLMONEY',
    reward: 45,
    description: 'Match BULLMONEY 12 times to trigger homepage spotlight.',
    goalType: 'combos',
    goalValue: 12,
    unlockColor: 'neonAzure',
  },
  {
    code: 'BULLMONEY STREAMS',
    reward: 30,
    description: 'Chain 80 boost taps to sync streams banner.',
    goalType: 'taps',
    goalValue: 80,
    unlockColor: 'magentaFlux',
  },
  {
    code: 'X3R7P ACCESS KEY',
    reward: 35,
    description: 'Score 4 jackpots to refresh vault handoff.',
    goalType: 'jackpots',
    goalValue: 4,
    unlockColor: 'emeraldWire',
  },
  {
    code: 'TELEGRAM VIP',
    reward: 28,
    description: 'Land 10 perfect combos for Telegram push.',
    goalType: 'combos',
    goalValue: 10,
    unlockColor: 'obsidianPulse',
  },
  {
    code: 'DISCORD HQ',
    reward: 28,
    description: 'Rack up 120 taps to flash Discord HQ invites.',
    goalType: 'taps',
    goalValue: 120,
    unlockColor: 'neonAzure',
  },
  {
    code: 'XM PARTNER',
    reward: 24,
    description: 'Hit 3 jackpots to route XM partner traffic.',
    goalType: 'jackpots',
    goalValue: 3,
    unlockColor: 'emeraldWire',
  },
  {
    code: 'VANTAGE SIGNALS',
    reward: 24,
    description: 'Maintain combo streak of 8 for Vantage widgets.',
    goalType: 'combos',
    goalValue: 8,
    unlockColor: 'magentaFlux',
  },
];

const PSP_SPIN_COST = 2;
const PSP_PROFILE_KEY = 'bullmoney_slot_profile';
const PSP_VIP_REWARD_TIERS: VipRewardTier[] = [
  { minTaps: 250, maxTaps: 499, code: 'VIP-PSP-7', duration: '7-day VIP' },
  { minTaps: 500, maxTaps: 1499, code: 'VIP-PSP-14', duration: '14-day VIP' },
  { minTaps: 1500, maxTaps: 4999, code: 'VIP-PSP-30', duration: '30-day VIP' },
  { minTaps: 5000, maxTaps: 20000, code: 'VIP-PSP-90', duration: '90-day VIP' },
];
const MIN_VIP_TAPS = PSP_VIP_REWARD_TIERS[0]?.minTaps ?? 250;
const SLOT_MATCH_HARD_MODE_CHANCE = 0.05; // 5% chance to naturally align reels
const SLOT_LOTTO_MATCH_CHANCE = 0.015; // 1.5% chance to trigger forced lotto match

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
  const performanceCheckInterval = useRef<any>(null);

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

function SlotMachinePromo() {
  const slotTexts = PSP_SLOT_CODES;
  const tickerText = `${PSP_SLOT_TICKER_SEGMENTS.join('  •  ')}  •  `;
  const shellRef = useRef<HTMLDivElement | null>(null);
  const lifetimeAnimationTimeoutRef = useRef<any>(null);
  const [activeIndices, setActiveIndices] = useState<number[]>([0, 3, 6]);
  const [turboMode, setTurboMode] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [boostPresses, setBoostPresses] = useState(0);
  const [bullCredits, setBullCredits] = useState(120);
  const [missionLog, setMissionLog] = useState('Hold Boost to charge the PSP slot shell.');
  const [boostMeter, setBoostMeter] = useState(0);
  const [isHoldingBoost, setIsHoldingBoost] = useState(false);
  const [jackpotFlash, setJackpotFlash] = useState(false);
  const [highCombo, setHighCombo] = useState(0);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [activeMission, setActiveMission] = useState<SlotMission>(() => PSP_SLOT_MISSIONS[Math.floor(Math.random() * PSP_SLOT_MISSIONS.length)]);
  const [missionProgress, setMissionProgress] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [unlockedColors, setUnlockedColors] = useState<string[]>([DEFAULT_PSP_COLOR]);
  const [activeColor, setActiveColor] = useState(DEFAULT_PSP_COLOR);
  const [claimedVipCodes, setClaimedVipCodes] = useState<string[]>([]);
  const [vipReward, setVipReward] = useState<{ code: string; duration: string } | null>(null);
  const [lifetimeUnlocked, setLifetimeUnlocked] = useState(false);
  const [isLifetimeCelebrationVisible, setIsLifetimeCelebrationVisible] = useState(false);
  const spinSpeed = turboMode ? Math.max(60, 220 - boostMeter * 1.4) : 210;
  const centerCode = slotTexts.length ? slotTexts[activeIndices[1] % slotTexts.length] : '';
  const activeColorTheme = PSP_COLOR_THEMES[activeColor] ?? PSP_COLOR_THEMES[DEFAULT_PSP_COLOR];
  const totalColorThemes = Object.keys(PSP_COLOR_THEMES).length;
  const missionGoalUnit = activeMission.goalType === 'taps' ? 'taps' : activeMission.goalType === 'jackpots' ? 'jackpots' : 'combos';
  const missionProgressPercent = Math.round((missionProgress / activeMission.goalValue) * 100);
  const missionProgressLabel = `${missionProgress}/${activeMission.goalValue} ${missionGoalUnit}`;
  const nextVipTier = PSP_VIP_REWARD_TIERS.find(tier => tapCount < tier.minTaps);
  const vipStatusText = vipReward
    ? vipReward.duration
    : nextVipTier
    ? `${Math.max(0, nextVipTier.minTaps - tapCount)} taps to ${nextVipTier.duration}`
    : 'All VIP tiers unlocked';
  const slotThemeVariables = {
    '--psp-shell-bg': activeColorTheme.shell,
    '--psp-shell-border': activeColorTheme.border,
    '--psp-shell-glow': activeColorTheme.glow,
    '--psp-shell-inner': activeColorTheme.inner,
    '--psp-accent': activeColorTheme.accent,
  } as CSSProperties;
  const [activeModal, setActiveModal] = useState<PspModalView>(null);
  const closeModal = useCallback(() => setActiveModal(null), []);
  const isTerminalOpen = activeModal === 'terminal';
  const [autoThemeMode, setAutoThemeMode] = useState(true);
  const hasVipAccess = tapCount >= MIN_VIP_TAPS;
  const safeVipCode = hasVipAccess && vipReward ? vipReward.code : 'LOCKED';
  const vipUnlockCountdown = Math.max(0, MIN_VIP_TAPS - tapCount);
  const vipDetailMessage = hasVipAccess ? vipStatusText : `${vipUnlockCountdown} taps to unlock VIP rewards`;
  const lifetimeStatusText = lifetimeUnlocked ? 'Lifetime VIP unlocked' : 'Match 3 words for lifetime access';
  const quickGuideSteps = [
    'Tap and hold Boost to keep the reels moving.',
    'Random lotto matches line up words — that is how you win.',
    'Match all three words to grab the 1-year lifetime access code.',
    'Hit 250 taps for VIP codes and clear missions for new shell colors.'
  ];

  const pickNextMission = useCallback((previousCode?: string) => {
    const filtered = PSP_SLOT_MISSIONS.filter(mission => mission.code !== previousCode || PSP_SLOT_MISSIONS.length === 1);
    const unlockable = filtered.filter(mission => !unlockedColors.includes(mission.unlockColor));
    const source = unlockable.length > 0 ? unlockable : filtered;
    return source[Math.floor(Math.random() * source.length)];
  }, [unlockedColors]);

  const assignNewMission = useCallback((previousCode?: string) => {
    const next = pickNextMission(previousCode);
    setMissionProgress(0);
    setActiveMission(next);
  }, [pickNextMission]);

  const handleMissionComplete = useCallback((mission: SlotMission) => {
    setMissionLog(`Mission complete • ${mission.description} Color unlocked!`);
    setMissionsCompleted(prev => Math.min(99, prev + 1));
    setBullCredits(prev => Math.min(999, prev + mission.reward));
    setUnlockedColors(prev => {
      if (prev.includes(mission.unlockColor)) return prev;
      const updated = [...prev, mission.unlockColor];
      setActiveColor(mission.unlockColor);
      return updated;
    });
    assignNewMission(mission.code);
  }, [assignNewMission]);

  const evaluateVipReward = useCallback((nextTapCount: number) => {
    setClaimedVipCodes(prevClaimed => {
      const tier = PSP_VIP_REWARD_TIERS.find(t => nextTapCount >= t.minTaps && nextTapCount <= t.maxTaps && !prevClaimed.includes(t.code));
      if (!tier) return prevClaimed;
      setVipReward({ code: tier.code, duration: tier.duration });
      setMissionLog(`VIP unlocked • ${tier.duration} • Code ${tier.code}`);
      return [...prevClaimed, tier.code];
    });
  }, []);

  const advanceMissionProgress = useCallback((event: { type: 'combos' | 'jackpot' | 'tap'; value?: number }) => {
    let completed = false;
    setMissionProgress(prev => {
      const { goalType, goalValue } = activeMission;
      let next = prev;
      if (goalType === 'combos' && event.type === 'combos' && typeof event.value === 'number') {
        next = Math.min(goalValue, event.value);
      } else if (goalType === 'jackpots' && event.type === 'jackpot') {
        next = Math.min(goalValue, prev + 1);
      } else if (goalType === 'taps' && event.type === 'tap') {
        next = Math.min(goalValue, prev + 1);
      }
      if (!completed && next >= goalValue && prev < goalValue) {
        completed = true;
      }
      return next;
    });
    if (completed) {
      handleMissionComplete(activeMission);
    }
  }, [activeMission, handleMissionComplete]);

  const handleTapIncrement = useCallback(() => {
    advanceMissionProgress({ type: 'tap' });
    setTapCount(prev => {
      const next = Math.min(20000, prev + 1);
      evaluateVipReward(next);
      return next;
    });
  }, [advanceMissionProgress, evaluateVipReward]);

  const handleColorSelect = useCallback((colorKey: string) => {
    if (!unlockedColors.includes(colorKey)) {
      setMissionLog('Complete missions to unlock this shell palette.');
      return;
    }
    setAutoThemeMode(false);
    setActiveColor(colorKey);
    const themeLabel = PSP_COLOR_THEMES[colorKey]?.label ?? colorKey;
    setMissionLog(`Shell synced • ${themeLabel}`);
  }, [unlockedColors, setMissionLog]);

  const toggleAutoThemeMode = useCallback(() => {
    setAutoThemeMode(prev => {
      const next = !prev;
      setMissionLog(next ? 'Auto color party enabled. Sit back and watch the PSP glow.' : 'Manual color mode enabled. Tap a tile to pick a shell.');
      return next;
    });
  }, [setMissionLog]);

  const triggerLifetimeUnlock = useCallback((reason: string) => {
    let alreadyUnlocked = false;
    setLifetimeUnlocked(prev => {
      alreadyUnlocked = prev;
      return true;
    });
    setMissionLog(alreadyUnlocked ? 'Lifetime VIP celebration replayed.' : `Lifetime VIP unlocked • ${reason}`);
    setIsLifetimeCelebrationVisible(true);
    if (typeof window !== 'undefined' && lifetimeAnimationTimeoutRef.current) {
      window.clearTimeout(lifetimeAnimationTimeoutRef.current);
    }
    if (typeof window !== 'undefined') {
      lifetimeAnimationTimeoutRef.current = window.setTimeout(() => {
        setIsLifetimeCelebrationVisible(false);
      }, 3200);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(PSP_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SlotProfile>;
        if (typeof parsed.credits === 'number') setBullCredits(parsed.credits);
        if (typeof parsed.boosts === 'number') setBoostPresses(parsed.boosts);
        if (typeof parsed.highCombo === 'number') setHighCombo(parsed.highCombo);
        if (typeof parsed.missionsCompleted === 'number') setMissionsCompleted(parsed.missionsCompleted);
        if (typeof parsed.missionProgress === 'number') setMissionProgress(parsed.missionProgress);
        if (typeof parsed.tapCount === 'number') setTapCount(parsed.tapCount);
        if (Array.isArray(parsed.colors) && parsed.colors.length > 0) {
          setUnlockedColors(Array.from(new Set([DEFAULT_PSP_COLOR, ...parsed.colors])));
        }
        if (typeof parsed.activeColor === 'string') {
          setActiveColor(parsed.activeColor);
        }
        if (Array.isArray(parsed.claimedVipCodes)) {
          setClaimedVipCodes(parsed.claimedVipCodes);
        }
        if (parsed.vipCode && parsed.vipDuration) {
          setVipReward({ code: parsed.vipCode, duration: parsed.vipDuration });
        }
        if (typeof parsed.lifetimeUnlocked === 'boolean') {
          setLifetimeUnlocked(parsed.lifetimeUnlocked);
        }
        if (parsed.missionCode) {
          const storedMission = PSP_SLOT_MISSIONS.find(m => m.code === parsed.missionCode);
          if (storedMission) setActiveMission(storedMission);
        }
      }
    } catch (error) {
      console.warn('Slot profile load failed', error);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!profileLoaded || typeof window === 'undefined') return;
    const payload: SlotProfile = {
      credits: bullCredits,
      boosts: boostPresses,
      highCombo,
      missionsCompleted,
      missionCode: activeMission.code,
      missionProgress,
      tapCount,
      colors: unlockedColors,
      activeColor,
      claimedVipCodes,
      vipCode: vipReward?.code,
      vipDuration: vipReward?.duration,
      lifetimeUnlocked,
    };
    try {
      localStorage.setItem(PSP_PROFILE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Slot profile persist failed', error);
    }
  }, [profileLoaded, bullCredits, boostPresses, highCombo, missionsCompleted, activeMission.code, missionProgress, tapCount, unlockedColors, activeColor, claimedVipCodes, vipReward, lifetimeUnlocked]);

  useEffect(() => {
    if (!isTerminalOpen) return;
    const interval = window.setInterval(() => {
      setActiveIndices(prev => {
        let next = prev.map((idx, reelIndex) => {
          const baseStep = turboMode ? 2 + Math.floor(boostMeter / 50) : 1;
          const jitter = Math.floor(Math.random() * (reelIndex + 3));
          return (idx + baseStep + jitter) % slotTexts.length;
        });

        const triggerNaturalMatch = Math.random() < SLOT_MATCH_HARD_MODE_CHANCE;
        const triggerLottoMatch = !triggerNaturalMatch && Math.random() < SLOT_LOTTO_MATCH_CHANCE;
        let matchReason: 'lotto' | 'natural' | null = null;
        if (triggerNaturalMatch || triggerLottoMatch) {
          const luckyIndex = Math.floor(Math.random() * slotTexts.length);
          next = next.map(() => luckyIndex);
          matchReason = triggerLottoMatch ? 'lotto' : 'natural';
        }

        const symbols = next.map(index => slotTexts[index]);
        const centerSymbol = symbols[1];
        const uniqueSymbols = new Set(symbols);
        let creditGain = symbols.reduce((sum, label) => sum + (PSP_SLOT_REWARD_TABLE[label] ?? 0), 0) - PSP_SPIN_COST;
        let newMissionLog: string | null = null;
        let computedCombo = 0;
        let jackpotTriggered = false;
        let lifetimeAwardedNow = false;

        setComboCount(prevCombo => {
          let updated = prevCombo;
          if (uniqueSymbols.size === 1) {
            updated = Math.min(99, prevCombo + 1);
            jackpotTriggered = true;
            lifetimeAwardedNow = true;
            newMissionLog = matchReason === 'lotto'
              ? 'Lotto hit • Lifetime access code minted!'
              : `Perfect match • ${centerSymbol} invite ready + lifetime code unlocked.`;
          } else if (symbols.some(code => PSP_SLOT_HIGHLIGHTS.has(code))) {
            updated = Math.min(99, prevCombo + 1);
            newMissionLog = `Signal lock • ${centerSymbol} synced for clients.`;
          } else {
            updated = Math.max(0, prevCombo - 1);
          }
          computedCombo = updated;
          return updated;
        });

        setHighCombo(prev => Math.max(prev, computedCombo));
        if (newMissionLog) {
          setMissionLog(newMissionLog);
        }

        advanceMissionProgress({ type: 'combos', value: computedCombo });

        if (jackpotTriggered) {
          setJackpotFlash(true);
          setTurboMode(true);
          window.setTimeout(() => setJackpotFlash(false), 900);
          advanceMissionProgress({ type: 'jackpot' });
        }

        if (lifetimeAwardedNow) {
          const reasonLabel = matchReason === 'lotto'
            ? 'slot lotto match'
            : matchReason === 'natural'
            ? 'guided triple match'
            : 'perfect triple match';
          triggerLifetimeUnlock(reasonLabel);
        }

        if (creditGain !== 0) {
          setBullCredits(prevCredits => Math.max(0, Math.min(999, prevCredits + creditGain)));
        }

        return next;
      });
    }, spinSpeed);

    return () => window.clearInterval(interval);
  }, [isTerminalOpen, spinSpeed, slotTexts, turboMode, boostMeter, advanceMissionProgress, triggerLifetimeUnlock]);

  useEffect(() => {
    if (!isTerminalOpen || !shellRef.current) return;
    const shell = shellRef.current;

    const handleMove = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      const percentX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const percentY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      shell.style.setProperty('--tilt-x', `${percentX * 6}deg`);
      shell.style.setProperty('--tilt-y', `${percentY * -6}deg`);
    };

    const resetTilt = () => {
      shell.style.setProperty('--tilt-x', '0deg');
      shell.style.setProperty('--tilt-y', '0deg');
    };

    shell.addEventListener('pointermove', handleMove);
    shell.addEventListener('pointerleave', resetTilt);

    return () => {
      shell.removeEventListener('pointermove', handleMove);
      shell.removeEventListener('pointerleave', resetTilt);
    };
  }, [isTerminalOpen]);

  useEffect(() => {
    if (!isHoldingBoost) return;
    const interval = window.setInterval(() => {
      setBoostMeter(prev => Math.min(100, prev + 3));
    }, 45);
    return () => window.clearInterval(interval);
  }, [isHoldingBoost]);

  useEffect(() => {
    if (!isHoldingBoost) return;
    const tapInterval = window.setInterval(() => {
      handleTapIncrement();
    }, 320);
    return () => window.clearInterval(tapInterval);
  }, [isHoldingBoost, handleTapIncrement]);

  useEffect(() => {
    if (isHoldingBoost || boostMeter === 0) return;
    const interval = window.setInterval(() => {
      setBoostMeter(prev => Math.max(0, prev - 2));
    }, 70);
    return () => window.clearInterval(interval);
  }, [isHoldingBoost, boostMeter]);

  useEffect(() => {
    return () => {
      if (lifetimeAnimationTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(lifetimeAnimationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pressed = new Set<string>();

    const handleKeyDown = (event: KeyboardEvent) => {
      pressed.add(event.key.toLowerCase());
      if (event.shiftKey && pressed.has('b') && pressed.has('m') && pressed.has('t')) {
        triggerLifetimeUnlock('Shift+B+M+T easter egg');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressed.delete(event.key.toLowerCase());
    };

    const handleWindowBlur = () => pressed.clear();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      pressed.clear();
    };
  }, [triggerLifetimeUnlock]);
  useEffect(() => {
    if (boostMeter > 8 || isHoldingBoost) {
      setTurboMode(true);
      return;
    }
    const timeout = window.setTimeout(() => setTurboMode(false), 800);
    return () => window.clearTimeout(timeout);
  }, [boostMeter, isHoldingBoost]);

  useEffect(() => {
    if (!autoThemeMode || unlockedColors.length <= 1) return;
    const rotation = window.setInterval(() => {
      setActiveColor(prev => {
        const currentIndex = unlockedColors.indexOf(prev);
        const nextIndex = (currentIndex + 1) % unlockedColors.length;
        return unlockedColors[nextIndex];
      });
    }, 4500);
    return () => window.clearInterval(rotation);
  }, [autoThemeMode, unlockedColors, setActiveColor]);

  const startBoostHold = () => {
    if (isHoldingBoost) return;
    setIsHoldingBoost(true);
    setBoostPresses(prev => prev + 1);
    handleTapIncrement();
    setTurboMode(true);
    try {
      trackEvent?.('slot_machine_boost_start', { turbo: true });
    } catch (error) {
      console.warn('Slot boost analytics failed', error);
    }
  };

  const stopBoostHold = () => {
    setIsHoldingBoost(false);
  };

  const highlightStats = [
    { label: 'Total Taps', value: tapCount.toString().padStart(4, '0'), helper: 'All PSP games combined' },
    { label: 'Bull Credits', value: bullCredits.toString().padStart(3, '0'), helper: 'Spend on boosts' },
    { label: 'Combo Peak', value: highCombo.toString().padStart(2, '0'), helper: 'Best match streak' },
    { label: 'Missions Cleared', value: missionsCompleted.toString().padStart(2, '0'), helper: 'Finished tasks' },
    { label: 'Lifetime Jackpot', value: lifetimeUnlocked ? 'UNLOCKED' : 'LOCKED', helper: lifetimeStatusText },
  ];

  const actionButtons: Array<{ id: Exclude<PspModalView, null>; badge: string; title: string; metric: string; detail: string }> = [
    {
      id: 'terminal',
      badge: 'Terminal',
      title: 'Play PSP Slot',
      metric: centerCode || 'BULLMONEY',
      detail: turboMode ? 'Turbo mode ON — keep holding Boost!' : 'Tap Boost to start spinning',
    },
    {
      id: 'missions',
      badge: 'Mission Log',
      title: `${missionProgressPercent}% complete`,
      metric: activeMission.code,
      detail: activeMission.description,
    },
    {
      id: 'vip',
      badge: 'VIP Rewards',
      title: lifetimeUnlocked ? 'Lifetime VIP unlocked' : hasVipAccess ? (vipReward?.code ?? 'Ready to claim') : 'VIP Locked',
      metric: lifetimeUnlocked ? '1-year code ready' : hasVipAccess ? vipDetailMessage : `${vipUnlockCountdown} taps left`,
      detail: lifetimeUnlocked
        ? 'Share the lifetime code with your squad.'
        : hasVipAccess
        ? claimedVipCodes.length
          ? `${claimedVipCodes.length} reward${claimedVipCodes.length === 1 ? '' : 's'} unlocked`
          : 'Finish missions to reveal more bonuses'
        : `Reach ${MIN_VIP_TAPS} taps and match words to reveal promo + lifetime codes`,
    },
    {
      id: 'themes',
      badge: 'Shell Colors',
      title: `${unlockedColors.length}/${totalColorThemes} shells`,
      metric: autoThemeMode ? 'Auto color party' : activeColorTheme.label,
      detail: autoThemeMode ? 'Sit back and watch colors change' : 'Tap a tile to set your color',
    },
  ];

  const missionModalContent = (
    <div className="space-y-5 text-slate-100">
      <div className="rounded-3xl border border-sky-500/30 bg-slate-950/70 p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Active Mission</p>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="text-2xl font-black text-white tracking-[0.2em]">{activeMission.code}</h4>
              <p className="text-sm text-slate-300 mt-1">{activeMission.description}</p>
            </div>
            <span className="px-4 py-1.5 rounded-full border border-sky-400/60 text-sky-200 font-mono text-sm">+{activeMission.reward} CR</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Missions', value: missionsCompleted.toString().padStart(2, '0') },
          { label: 'Boost Taps', value: boostPresses.toString().padStart(2, '0') },
          { label: 'Combo', value: comboCount.toString().padStart(2, '0') },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
          <span>Goal Tracking</span>
          <span>{missionProgressLabel}</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-900 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-fuchsia-400" style={{ width: `${missionProgressPercent}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-300">{missionProgressPercent}% synced • {missionGoalUnit}</p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Mission Feed</p>
        <p className="mt-3 text-base text-white">{missionLog}</p>
      </div>
    </div>
  );

  const vipModalContent = (
    <div className="space-y-5 text-slate-100">
      <div className="rounded-3xl border border-emerald-400/30 bg-emerald-950/40 p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Active VIP</p>
        <h4 className="text-3xl font-black text-white mt-3">{safeVipCode}</h4>
        <p className="text-sm text-emerald-100/80 mt-2">{vipDetailMessage}</p>
        <p className="text-xs text-emerald-100/60 mt-3 uppercase tracking-[0.3em]">Total Taps • {tapCount.toString().padStart(4, '0')}</p>
        <p className="text-xs text-emerald-100/70 mt-2">{lifetimeStatusText}</p>
      </div>

      <div className="space-y-3">
        {PSP_VIP_REWARD_TIERS.map(tier => {
          const unlocked = tapCount >= tier.minTaps;
          const showTierCode = hasVipAccess && unlocked;
          return (
            <div
              key={tier.code}
              className={`rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${unlocked ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-50' : 'border-slate-800 bg-slate-900/60 text-slate-200'}`}
            >
              <div className="text-xs uppercase tracking-[0.35em]">{tier.duration}</div>
              <div className="font-mono text-lg">{showTierCode ? tier.code : '????'}</div>
              <div className="text-xs tracking-[0.25em]">{tier.minTaps}-{tier.maxTaps} taps</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Claim Log</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hasVipAccess ? (
            claimedVipCodes.length ? (
              claimedVipCodes.map(code => (
                <span key={code} className="px-3 py-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 font-mono text-xs">
                  {code}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No claims yet</span>
            )
          ) : (
            <span className="text-sm text-slate-500">Reach {MIN_VIP_TAPS} taps to reveal promo codes</span>
          )}
        </div>
        {!hasVipAccess && (
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-400">
            Tap {MIN_VIP_TAPS} times to unlock VIP
          </p>
        )}
      </div>
    </div>
  );

  const themeModalContent = (
    <div className="space-y-5 text-slate-100">
      <div className="rounded-3xl border border-sky-500/30 bg-slate-950/70 p-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Active Shell</p>
        <h4 className="text-3xl font-black text-white mt-3">{activeColorTheme.label}</h4>
        <p className="text-sm text-slate-300 mt-2">{unlockedColors.length}/{totalColorThemes} unlocked</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex-1 h-14 rounded-2xl border border-white/10" style={{ background: activeColorTheme.shell }} />
          <div className="flex-1 h-14 rounded-2xl border border-white/10" style={{ background: activeColorTheme.inner }} />
        </div>
      </div>

      <button
        type="button"
        onClick={toggleAutoThemeMode}
        className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-400 hover:text-sky-200"
      >
        {autoThemeMode ? 'Auto color on – tap to pause' : 'Turn auto color back on'}
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(PSP_COLOR_THEMES).map(([colorKey, theme]) => {
          const unlocked = unlockedColors.includes(colorKey);
          const active = activeColor === colorKey;
          return (
            <button
              type="button"
              key={`${colorKey}-modal`}
              className={`slot-color ${unlocked ? 'slot-color--unlocked' : 'slot-color--locked'} ${active ? 'slot-color--active' : ''}`}
              onClick={() => handleColorSelect(colorKey)}
              aria-pressed={active}
              aria-disabled={!unlocked}
            >
              <span className="slot-color__swatch" style={{ background: theme.accent }} />
              <small>{theme.label}</small>
              {!unlocked && <em>Locked</em>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <section className="w-full px-4 py-12 md:py-16" aria-label="BullMoney PSP control center">
        <div className="relative max-w-6xl mx-auto overflow-hidden rounded-[32px] border border-sky-500/20 bg-[#020b1a]">
          <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.25), transparent 55%)' }} />
          <div className="relative z-10 grid gap-10 p-6 md:p-10 lg:grid-cols-[320px,1fr]">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.35em] text-sky-300 font-semibold">PSP ACCESS</p>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">BullMoney PSP Mission Console</h2>
              <p className="text-sm text-slate-300">
                Launch the PSP experiences inside focused modals so the homepage stays punchy on both desktop and mobile.
                Match all three words during a spin to mint a 1-year lifetime access code — the reels now behave like a lotto.
              </p>
              <div className="grid grid-cols-2 gap-3 text-white/90">
                {highlightStats.map(stat => (
                  <div key={stat.label} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-3">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
                    {stat.helper && <p className="text-xs text-slate-400 mt-1">{stat.helper}</p>}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-300">How to Play</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200 list-decimal list-inside">
                  {quickGuideSteps.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-400">
                  Matching words is tough on purpose — the reel acts like a lotto. When it hits, you keep the lifetime code forever.
                </p>
                <p className="mt-2 text-[11px] text-sky-300/80">
                  Secret: hold Shift and tap B + M + T together to trigger the easter-egg lifetime unlock.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {actionButtons.map(action => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setActiveModal(action.id)}
                  className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/60 p-5 text-left transition hover:border-sky-400/60 hover:shadow-[0_0_30px_rgba(56,189,248,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80"
                  aria-label={action.title}
                >
                  <span className="text-[10px] uppercase tracking-[0.35em] text-sky-300">{action.badge}</span>
                  <h3 className="mt-3 text-xl font-semibold text-white">{action.title}</h3>
                  <p className="text-3xl font-black text-white tracking-[0.15em] mt-2">{action.metric}</p>
                  <p className="text-sm text-slate-300 mt-4">{action.detail}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ModalShell
        open={activeModal === 'terminal'}
        onClose={closeModal}
        title="PSP Slot Terminal"
        subtitle={centerCode ? `Active signal • ${centerCode}` : undefined}
        contentAspectRatio={null}
      >
        <div className="slot-modal-scroll">
          <section className="slot-machine-stage slot-machine-stage--modal" aria-label="PSP inspired slot machine">
            <div className="slot-machine-glow" />
            <div
              className={`slot-psp ${jackpotFlash ? 'slot-psp--jackpot' : ''}`}
              ref={shellRef}
              style={slotThemeVariables}
            >
              <div className="slot-psp__side slot-psp__side--left" />
              <div className="slot-psp__side slot-psp__side--right" />

              {isLifetimeCelebrationVisible && (
                <div className="slot-lifetime-celebration" aria-live="polite">
                  <div className="slot-lifetime-celebration__glow" />
                  <div className="slot-lifetime-celebration__content">
                    <span className="slot-lifetime-celebration__tag">VIP REWARD</span>
                    <p>You've unlocked VIP access!</p>
                    <strong>1-Year Lifetime Code</strong>
                    <em>Share it with your crew.</em>
                  </div>
                </div>
              )}

              <div className="slot-psp__header">
                <span>PSP MARKET EDITION</span>
                <span className="slot-psp__status">{turboMode ? 'TURBO STREAMING' : 'AUTO STREAMING'}</span>
                <span>FPS OPTIMIZED</span>
              </div>

              <div className="slot-screen">
                <div className="slot-screen__sheen" />
                <div className="slot-screen__grid">
                  {[0, 1, 2].map(position => {
                    const currentCode = slotTexts[activeIndices[position] % slotTexts.length];
                    return (
                      <div key={`reel-${position}`} className="slot-reel">
                        <div className="slot-reel__depth" />
                        <div className="slot-reel__value-wrapper">
                          <span className="slot-reel__ghost">{slotTexts[(activeIndices[position] - 1 + slotTexts.length) % slotTexts.length]}</span>
                          <span
                            className={`slot-reel__value ${turboMode ? 'slot-reel__value--turbo' : ''} ${PSP_SLOT_HIGHLIGHTS.has(currentCode) ? 'slot-reel__value--highlight' : ''}`}
                          >
                            {currentCode}
                          </span>
                          <span className="slot-reel__ghost">{slotTexts[(activeIndices[position] + 1) % slotTexts.length]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="slot-screen__hud">
                  <div>
                    <p>Bull Credits</p>
                    <strong>{bullCredits.toString().padStart(3, '0')}</strong>
                  </div>
                  <div>
                    <p>Active Signal</p>
                    <strong>{centerCode}</strong>
                  </div>
                  <div>
                    <p>High Combo</p>
                    <strong>{highCombo.toString().padStart(2, '0')}</strong>
                  </div>
                  <div>
                    <p>Missions</p>
                    <strong>{missionsCompleted.toString().padStart(2, '0')}</strong>
                  </div>
                  <div>
                    <p>Total Taps</p>
                    <strong>{tapCount.toString().padStart(4, '0')}</strong>
                  </div>
                  <div>
                    <p>VIP Access</p>
                    <strong>{safeVipCode}</strong>
                    <small>{vipDetailMessage}</small>
                  </div>
                  <div>
                    <p>Lifetime Lotto</p>
                    <strong>{lifetimeUnlocked ? 'WINNER' : 'LOCKED'}</strong>
                    <small>{lifetimeStatusText}</small>
                  </div>
                </div>

                <div className="slot-ticker" aria-hidden="true">
                  <span>{tickerText}</span>
                  <span>{tickerText}</span>
                </div>
              </div>

              <div className="slot-mission">
                <div className="slot-mission__active">
                  <div>
                    <p>Active Mission</p>
                    <strong>{activeMission.code}</strong>
                    <span>{activeMission.description}</span>
                  </div>
                  <span className="slot-mission__reward">+{activeMission.reward} CR</span>
                </div>

                <div className="slot-mission__stats">
                  <div>
                    <p>Missions Cleared</p>
                    <strong>{missionsCompleted.toString().padStart(2, '0')}</strong>
                  </div>
                  <div>
                    <p>Boost Taps</p>
                    <strong>{boostPresses.toString().padStart(2, '0')}</strong>
                  </div>
                  <div>
                    <p>Current Combo</p>
                    <strong>{comboCount.toString().padStart(2, '0')}</strong>
                  </div>
                </div>

                <div className="slot-mission__progress">
                  <div className="slot-mission__progress-head">
                    <p>Goal Tracking</p>
                    <strong>{missionProgressLabel}</strong>
                  </div>
                  <div className="slot-mission__progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={missionProgressPercent}>
                    <div className="slot-mission__progress-fill" style={{ width: `${missionProgressPercent}%` }} />
                  </div>
                  <small>{missionProgressPercent}% synced</small>
                </div>

                <div className="slot-mission__palette">
                  <div className="slot-mission__palette-head">
                    <p>Shell Themes</p>
                    <span>{unlockedColors.length}/{totalColorThemes} unlocked</span>
                  </div>
                  <div className="slot-mission__palette-grid">
                    {Object.entries(PSP_COLOR_THEMES).map(([colorKey, theme]) => {
                      const unlocked = unlockedColors.includes(colorKey);
                      const active = activeColor === colorKey;
                      return (
                        <button
                          type="button"
                          key={colorKey}
                          className={`slot-color ${unlocked ? 'slot-color--unlocked' : 'slot-color--locked'} ${active ? 'slot-color--active' : ''}`}
                          onClick={() => handleColorSelect(colorKey)}
                          aria-pressed={active}
                          aria-disabled={!unlocked}
                        >
                          <span className="slot-color__swatch" style={{ background: theme.accent }} />
                          <small>{theme.label}</small>
                          {!unlocked && <em>Locked</em>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="slot-mission__vip">
                  <div>
                    <p>Active VIP</p>
                    <strong>{safeVipCode}</strong>
                    <small>{vipDetailMessage}</small>
                  </div>
                  <div>
                    <p>Total Taps</p>
                    <strong>{tapCount.toString().padStart(4, '0')}</strong>
                    <small>
                      {hasVipAccess
                        ? nextVipTier
                          ? `${nextVipTier.code} @ ${nextVipTier.minTaps} taps`
                          : 'All tiers cleared'
                        : `Tap ${MIN_VIP_TAPS} times to unlock VIP`}
                    </small>
                  </div>
                  <div>
                    <p>Claim Log</p>
                    <div className="slot-mission__vip-codes">
                      {hasVipAccess ? (
                        claimedVipCodes.length > 0 ? (
                          claimedVipCodes.map(code => (
                            <span key={code}>{code}</span>
                          ))
                        ) : (
                          <span className="slot-mission__vip-empty">No claims yet</span>
                        )
                      ) : (
                        <span className="slot-mission__vip-empty">Tap 250 times to reveal codes</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p>Lifetime Lotto</p>
                    <strong>{lifetimeUnlocked ? 'UNLOCKED' : 'LOCKED'}</strong>
                    <small>{lifetimeStatusText}</small>
                  </div>
                </div>

                <div className="slot-mission__brief">
                  <p>Mission Feed</p>
                  <span>{missionLog}</span>
                </div>

                <div className="slot-boost-meter">
                  <p>Boost Charge</p>
                  <div className="slot-boost-meter__bar">
                    <div className="slot-boost-meter__fill" style={{ width: `${boostMeter}%` }} />
                  </div>
                  <small>Hold Boost to accelerate spins. Progress auto-saves to BullMoney profile storage.</small>
                </div>
              </div>

              <div className="slot-controls">
                <div className="slot-dpad" aria-hidden="true">
                  <span />
                  <span />
                </div>

                <button
                  type="button"
                  className={`slot-boost ${turboMode ? 'slot-boost--active' : ''}`}
                  onMouseDown={startBoostHold}
                  onMouseUp={stopBoostHold}
                  onMouseLeave={stopBoostHold}
                  onTouchStart={startBoostHold}
                  onTouchEnd={stopBoostHold}
                  onTouchCancel={stopBoostHold}
                >
                  Boost Spin
                </button>

                <div className="slot-stick" aria-hidden="true">
                  <div className="slot-stick__nub" />
                </div>
              </div>
            </div>

            <p className="slot-caption">
              1) Hold Boost. 2) Match the same words to win the 1-year lifetime access code. 3) Hit 250 taps to reveal all VIP codes. Easy!
            </p>
          </section>
        </div>
      </ModalShell>

      <ModalShell
        open={activeModal === 'missions'}
        onClose={closeModal}
        title="Mission Tracker"
        subtitle={`${missionProgressLabel} • ${activeMission.code}`}
        contentAspectRatio={null}
      >
        <div className="slot-modal-scroll slot-modal-scroll--compact">
          {missionModalContent}
        </div>
      </ModalShell>

      <ModalShell
        open={activeModal === 'vip'}
        onClose={closeModal}
        title="VIP Reward Matrix"
        subtitle={vipStatusText}
        contentAspectRatio={null}
      >
        <div className="slot-modal-scroll slot-modal-scroll--compact">
          {vipModalContent}
        </div>
      </ModalShell>

      <ModalShell
        open={activeModal === 'themes'}
        onClose={closeModal}
        title="Shell Theme Lab"
        subtitle={`${unlockedColors.length}/${totalColorThemes} palettes unlocked`}
        contentAspectRatio={null}
      >
        <div className="slot-modal-scroll slot-modal-scroll--compact">
          {themeModalContent}
        </div>
      </ModalShell>

      <style jsx global>{`
        .slot-modal-scroll {
          max-height: calc(92vh - 220px);
          overflow-y: auto;
          padding: 1.25rem;
        }

        .slot-modal-scroll--compact {
          padding: 1rem;
        }

        .slot-machine-stage--modal {
          padding: 2rem 0;
        }

        @media (max-width: 640px) {
          .slot-modal-scroll {
            padding: 0.75rem;
          }
        }

        .slot-machine-stage {
          position: relative;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
        }

        .slot-machine-glow {
          position: absolute;
          inset: 1rem;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.3), transparent 60%);
          filter: blur(50px);
          z-index: 0;
        }

        .slot-psp {
          position: relative;
          z-index: 1;
          border-radius: 48px;
          padding: 2.5rem 2rem;
          background: var(--psp-shell-bg, radial-gradient(circle at 30% 20%, rgba(14, 165, 233, 0.25), rgba(2, 8, 23, 0.95)));
          border: 2px solid var(--psp-shell-border, rgba(14, 165, 233, 0.8));
          box-shadow: 0 20px 60px var(--psp-shell-glow, rgba(14, 165, 233, 0.25)), inset 0 0 25px var(--psp-shell-inner, rgba(14, 165, 233, 0.15));
          transform: perspective(1200px) rotateX(var(--tilt-y, 0deg)) rotateY(var(--tilt-x, 0deg));
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }

        .slot-psp--jackpot {
          box-shadow: 0 30px 90px rgba(248, 250, 252, 0.35), inset 0 0 35px var(--psp-accent, rgba(251, 191, 36, 0.3));
        }

        .slot-psp::after {
          content: '';
          position: absolute;
          inset: 1.2rem;
          border-radius: 36px;
          border: 1px solid var(--psp-shell-border, rgba(94, 234, 212, 0.3));
          pointer-events: none;
        }

        .slot-psp__side {
          position: absolute;
          top: 50%;
          width: 48px;
          height: 120px;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(8, 47, 73, 0.9), rgba(3, 7, 18, 0.9));
          border: 1px solid var(--psp-shell-border, rgba(14, 165, 233, 0.4));
          transform: translateY(-50%);
          box-shadow: inset 0 0 12px rgba(14, 165, 233, 0.15);
        }

        .slot-psp__side--left {
          left: -12px;
        }

        .slot-psp__side--right {
          right: -12px;
        }

        .slot-lifetime-celebration {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 20;
          animation: slotLifetimeFade 3.2s ease forwards;
        }

        .slot-lifetime-celebration__glow {
          position: absolute;
          inset: 8%;
          border-radius: 40px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.35), transparent 70%);
          filter: blur(25px);
          opacity: 0.7;
          animation: slotLifetimePulse 1.4s ease-in-out infinite;
        }

        .slot-lifetime-celebration__content {
          position: relative;
          padding: 1.5rem 2.5rem;
          border-radius: 28px;
          background: rgba(2, 10, 23, 0.9);
          border: 1px solid rgba(56, 189, 248, 0.8);
          box-shadow: 0 0 45px rgba(56, 189, 248, 0.45), inset 0 0 20px rgba(8, 47, 73, 0.8);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          color: #e0f2fe;
          animation: slotLifetimeShimmer 1.8s linear infinite;
        }

        .slot-lifetime-celebration__content strong {
          font-size: 1.4rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #f8fafc;
        }

        .slot-lifetime-celebration__content em {
          font-style: normal;
          font-size: 0.85rem;
          color: rgba(148, 197, 253, 0.9);
        }

        .slot-lifetime-celebration__tag {
          font-size: 0.7rem;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(56, 189, 248, 0.9);
        }

        .slot-psp__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          font-size: 0.75rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(224, 242, 254, 0.7);
          border-bottom: 1px solid rgba(14, 165, 233, 0.3);
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }

        .slot-psp__status {
          color: var(--psp-accent, #38bdf8);
          animation: hudPulse 2s ease-in-out infinite;
        }

        .slot-screen {
          position: relative;
          border-radius: 30px;
          padding: 2rem;
          background: radial-gradient(circle at 20% 20%, rgba(15, 118, 110, 0.2), rgba(0, 0, 0, 0.9));
          border: 1px solid var(--psp-shell-border, rgba(14, 165, 233, 0.4));
          overflow: hidden;
        }

        .slot-screen__sheen {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(94, 234, 212, 0.15), transparent 55%);
          mix-blend-mode: screen;
          pointer-events: none;
        }

        .slot-screen__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
        }

        .slot-reel {
          position: relative;
          height: 120px;
          border-radius: 18px;
          padding: 0.75rem;
          background: rgba(2, 6, 23, 0.8);
          border: 1px solid var(--psp-shell-border, rgba(14, 165, 233, 0.4));
          box-shadow: inset 0 -10px 30px rgba(14, 165, 233, 0.2);
          overflow: hidden;
        }

        .slot-reel__depth {
          position: absolute;
          inset: 8px;
          border-radius: 14px;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.2), transparent 70%);
          filter: blur(18px);
          pointer-events: none;
        }

        .slot-reel__value-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .slot-reel__value {
          font-size: 0.85rem;
          color: #e0f2fe;
          text-align: center;
          animation: slotFlip 0.35s ease-out;
          text-shadow: 0 0 10px var(--psp-accent, rgba(14, 165, 233, 0.8));
        }

        .slot-reel__value--turbo {
          color: var(--psp-accent, #fbbf24);
          text-shadow: 0 0 14px var(--psp-accent, rgba(251, 191, 36, 0.9));
        }

        .slot-reel__value--highlight {
          color: var(--psp-accent, #a5b4fc);
          letter-spacing: 0.18em;
        }

        .slot-reel__ghost {
          font-size: 0.65rem;
          color: rgba(148, 163, 184, 0.4);
          text-align: center;
        }

        .slot-screen__hud {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--psp-shell-border, rgba(14, 165, 233, 0.25));
        }

        .slot-screen__hud p {
          margin: 0;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: rgba(148, 163, 184, 0.8);
          text-transform: uppercase;
        }

        .slot-screen__hud strong {
          display: block;
          margin-top: 0.2rem;
          font-size: 1.05rem;
          color: var(--psp-accent, #67e8f9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .slot-screen__hud small {
          display: block;
          font-size: 0.65rem;
          color: rgba(148, 163, 184, 0.8);
          margin-top: 0.1rem;
        }

        .slot-ticker {
          position: absolute;
          left: 1.5rem;
          right: 1.5rem;
          bottom: 1.25rem;
          display: flex;
          gap: 2rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.4em;
          color: rgba(226, 232, 240, 0.6);
          overflow: hidden;
        }

        .slot-ticker span {
          white-space: nowrap;
          animation: tickerFlow 11s linear infinite;
        }

        .slot-mission {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 20px;
          background: rgba(2, 6, 23, 0.8);
          border: 1px solid var(--psp-shell-border, rgba(14, 165, 233, 0.2));
        }

        .slot-mission__active {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(14, 165, 233, 0.2);
        }

        .slot-mission__active strong {
          display: block;
          font-size: 1.2rem;
          letter-spacing: 0.2em;
          margin-bottom: 0.2rem;
          color: #e0f2fe;
        }

        .slot-mission__active span {
          color: rgba(148, 163, 184, 0.9);
        }

        .slot-mission__reward {
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          color: var(--psp-accent, #fbbf24);
        }

        .slot-mission__stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(14, 165, 233, 0.2);
        }

        .slot-mission__stats div {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--psp-shell-border, rgba(14, 165, 233, 0.2));
          border-radius: 12px;
          padding: 0.75rem;
        }

        .slot-mission__stats p {
          margin: 0;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: rgba(148, 163, 184, 0.8);
        }

        .slot-mission__stats strong {
          display: block;
          margin-top: 0.2rem;
          font-size: 1.2rem;
          color: #67e8f9;
        }

        .slot-mission__progress {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(14, 165, 233, 0.2);
        }

        .slot-mission__progress-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.8);
        }

        .slot-mission__progress-bar {
          width: 100%;
          height: 8px;
          border-radius: 999px;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(15, 118, 110, 0.5);
          overflow: hidden;
        }

        .slot-mission__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #f472b6);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.7);
        }

        .slot-mission__palette {
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(14, 165, 233, 0.2);
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .slot-mission__palette-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.8);
        }

        .slot-mission__palette-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.5rem;
        }

        .slot-color {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.3rem;
          padding: 0.65rem;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(15, 23, 42, 0.6);
          text-align: left;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }

        .slot-color--unlocked {
          border-color: rgba(56, 189, 248, 0.5);
        }

        .slot-color--locked {
          opacity: 0.6;
        }

        .slot-color--active {
          border-color: #f472b6;
          transform: translateY(-2px);
        }

        .slot-color__swatch {
          width: 100%;
          height: 24px;
          border-radius: 8px;
        }

        .slot-color small {
          display: block;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(226, 232, 240, 0.8);
        }

        .slot-color em {
          font-size: 0.65rem;
          color: rgba(248, 113, 113, 0.8);
        }

        .slot-mission__vip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(14, 165, 233, 0.2);
        }

        .slot-mission__vip div {
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(14, 165, 233, 0.2);
          border-radius: 12px;
          padding: 0.75rem;
        }

        .slot-mission__vip-codes {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: rgba(148, 163, 184, 0.9);
        }

        .slot-mission__vip-codes span {
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.2);
          border: 1px solid rgba(56, 189, 248, 0.4);
        }

        .slot-mission__vip-empty {
          color: rgba(148, 163, 184, 0.6);
        }

        .slot-mission__brief p {
          margin: 0 0 0.35rem 0;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: rgba(148, 163, 184, 0.8);
        }

        .slot-mission__brief span {
          font-size: 0.95rem;
          color: rgba(224, 242, 254, 0.85);
        }

        .slot-boost-meter p {
          margin: 0 0 0.5rem 0;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          color: rgba(148, 163, 184, 0.8);
        }

        .slot-boost-meter__bar {
          width: 100%;
          height: 14px;
          border-radius: 999px;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid var(--psp-shell-border, rgba(14, 165, 233, 0.4));
          overflow: hidden;
        }

        .slot-boost-meter__fill {
          height: 100%;
          background: linear-gradient(90deg, #fbbf24, #e879f9);
          box-shadow: 0 0 15px rgba(248, 250, 252, 0.5);
        }

        .slot-boost-meter small {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.7rem;
          color: rgba(148, 163, 184, 0.8);
        }

        .slot-controls {
          margin-top: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .slot-dpad {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          background: linear-gradient(145deg, #020617, #0f172a);
          border: 1px solid var(--psp-shell-border, rgba(148, 163, 184, 0.3));
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 15px rgba(14, 165, 233, 0.2);
        }

        .slot-dpad span:first-of-type,
        .slot-dpad span:last-of-type {
          position: absolute;
          background: rgba(226, 232, 240, 0.8);
          border-radius: 6px;
        }

        .slot-dpad span:first-of-type {
          width: 14px;
          height: 46px;
        }

        .slot-dpad span:last-of-type {
          width: 46px;
          height: 14px;
        }

        .slot-boost {
          flex: 1;
          padding: 1rem 1.5rem;
          border-radius: 999px;
          border: 2px solid var(--psp-accent, rgba(251, 191, 36, 0.9));
          color: #fffbeb;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.3em;
          background: linear-gradient(120deg, var(--psp-accent, rgba(251, 191, 36, 0.2)), rgba(0, 0, 0, 0.1));
          box-shadow: 0 10px 30px var(--psp-accent, rgba(251, 191, 36, 0.3));
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .slot-boost--active {
          transform: translateY(2px) scale(0.99);
          box-shadow: 0 4px 14px rgba(251, 191, 36, 0.4);
        }

        .slot-stick {
          width: 78px;
          height: 78px;
          border-radius: 50%;
          border: 1px solid rgba(148, 163, 184, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.9));
          box-shadow: inset 0 0 20px rgba(14, 165, 233, 0.2);
        }

        .slot-stick__nub {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(145deg, #94a3b8, #475569);
        }

        .slot-caption {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.95rem;
          color: rgba(226, 232, 240, 0.78);
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
        }

        @keyframes slotFlip {
          0% {
            transform: translateY(20%) scaleY(0.8);
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(0) scaleY(1);
            opacity: 1;
          }
        }

        @keyframes hudPulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes tickerFlow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes slotLifetimeFade {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes slotLifetimePulse {
          0% {
            transform: scale(0.95);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.85;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.4;
          }
        }

        @keyframes slotLifetimeShimmer {
          0% {
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.35), inset 0 0 10px rgba(56, 189, 248, 0.35);
          }
          50% {
            box-shadow: 0 0 45px rgba(14, 165, 233, 0.55), inset 0 0 20px rgba(14, 165, 233, 0.4);
          }
          100% {
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.35), inset 0 0 10px rgba(56, 189, 248, 0.35);
          }
        }

        @media (max-width: 768px) {
          .slot-machine-stage {
            padding: 3rem 1rem;
          }

          .slot-psp {
            padding: 1.35rem;
            border-radius: 32px;
          }

          .slot-psp__header {
            flex-direction: column;
            letter-spacing: 0.18em;
            text-align: center;
            gap: 0.5rem;
          }

          .slot-screen {
            padding: 1.25rem;
          }

          .slot-screen__grid {
            grid-template-columns: 1fr;
          }

          .slot-screen__hud {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.75rem;
          }

          .slot-ticker {
            letter-spacing: 0.25em;
            gap: 1rem;
          }

          .slot-mission__active {
            flex-direction: column;
            align-items: flex-start;
          }

          .slot-mission__stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .slot-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .slot-boost,
          .slot-dpad,
          .slot-stick {
            width: 100%;
            max-width: 320px;
            margin: 0 auto;
          }

          .slot-dpad,
          .slot-stick {
            max-width: 110px;
          }
        }

        @media (max-width: 420px) {
          .slot-machine-stage {
            padding: 2.5rem 0.75rem;
          }

          .slot-mission__palette-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .slot-psp {
            padding: 1rem;
          }

          .slot-screen__hud,
          .slot-mission__stats {
            grid-template-columns: 1fr;
          }

          .slot-mission__reward {
            align-self: flex-start;
          }

          .slot-mission__palette-grid {
            grid-template-columns: 1fr;
          }

          .slot-mission__vip {
            grid-template-columns: 1fr;
          }

          .slot-boost {
            letter-spacing: 0.2em;
          }
        }
      `}</style>
    </>
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

  // ✅ MOBILE LOADER DEFERRAL - Improve FPS by deferring heavy animations on mobile
  useEffect(() => {
    if (isMobile && currentView === 'loader' && typeof window !== 'undefined') {
      // On mobile, use requestIdleCallback if available to schedule loader updates
      // This allows the browser to handle other critical tasks first
      if ('requestIdleCallback' in window) {
        const id = (window as any).requestIdleCallback(() => {
          // Loader will be mounted but animations are reduced
          console.log('[Page] Mobile loader deferred with requestIdleCallback');
        }, { timeout: 1000 });
        return () => (window as any).cancelIdleCallback(id);
      }
    }
  }, [isMobile, currentView]);

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
          <MultiStepLoaderv2 
            onFinished={handleLoaderComplete}
            reducedAnimations={isMobile}
          />
        </div>
      )}

      {currentView === 'content' && (
        <>
          <main className="min-h-screen flex flex-col w-full" data-allow-scroll data-scrollable data-content data-theme-aware style={{ overflow: 'visible', height: 'auto' }}>
            <div id="top" />

            <section id="hero" className="w-full full-bleed viewport-full" data-allow-scroll data-content data-theme-aware>
              <HeroDesktop />
            </section>

            <section id="cta" className="w-full full-bleed viewport-full" data-allow-scroll data-content data-theme-aware>
              <CTA />
            </section>

            <section id="features" className="w-full full-bleed viewport-full" data-allow-scroll data-content data-theme-aware>
              <Features />
            </section>

            {/* Slot Machine Promo Section */}
            <SlotMachinePromo />

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
              className="w-full full-bleed viewport-full mx-auto px-4 pb-16"
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
