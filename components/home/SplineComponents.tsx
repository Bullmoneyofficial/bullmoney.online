import { Suspense, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useUnifiedPerformance } from "@/lib/UnifiedPerformanceSystem";
import {
  ShimmerRadialGlow,
  ShimmerLine,
  ShimmerSpinner,
} from "@/components/ui/UnifiedShimmer";

const SplineScene = dynamic(
  () => import('@/components/SplineScene'),
  { ssr: true }
);

export function DesktopHeroFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-linear-to-b from-black via-[#0a0a0a] to-black">
      <div className="w-full max-w-6xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-4">
        <p
          className="font-mono text-[10px] tracking-[0.2em] uppercase glass-text-gray"
        >
          EST. 2024 • TRADING MENTORSHIP
        </p>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight glass-text">
          Master <span className="glass-text">trading</span> with us
        </h1>
        <p className="text-sm md:text-base max-w-3xl glass-text-gray">
          Live trade calls, daily analysis, funded trader mentorship. Join 10,000+ traders learning forex, gold & crypto.
        </p>
        <div className="mt-4 inline-flex items-center gap-3">
          <span className="px-6 py-3 rounded-full text-sm font-bold glass-button">
            Loading your experience…
          </span>
        </div>
      </div>
    </div>
  );
}

export function LazySplineContainer({ scene }: { scene: string }) {
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

  const { observe, deviceTier, averageFps } = useUnifiedPerformance();

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

  useEffect(() => {
    if (deviceCheckDone.current) return;
    deviceCheckDone.current = true;

    if (isMobileDevice) {
      console.log('[LazySpline] MOBILE DETECTED: Skipping Spline to prevent lag');
      setCanRender(false);
      return;
    }

    console.log('[LazySpline] HERO MODE: Enabled on DESKTOP only');
    setCanRender(true);
    
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = '/scene1.splinecode';
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      fetch('/scene1.splinecode', { 
        method: 'GET', 
        mode: 'cors',
        cache: 'force-cache',
        priority: 'high'
      } as any).catch(() => {});
    }
  }, [isMobileDevice]);

  useEffect(() => {
    if (!fpsMonitorActive || !hasLoadedOnce) return;

    const monitorPerformance = () => {
      fpsHistory.current.push(averageFps);
      
      if (fpsHistory.current.length > 30) {
        fpsHistory.current.shift();
      }

      if (fpsHistory.current.length >= 10) {
        const recentAvg = fpsHistory.current.slice(-10).reduce((a, b) => a + b) / 10;
        
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

  useEffect(() => {
    if (!containerRef.current || !canRender) return;

    return observe(containerRef.current, (isIntersecting) => {
      setIsInView(isIntersecting);
      if (isIntersecting && !hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    }, { rootMargin: deviceTier === 'ultra' || deviceTier === 'high' ? '1400px' : deviceTier === 'medium' ? '1100px' : '600px' });
  }, [observe, hasLoadedOnce, canRender, deviceTier]);

  const shouldShowSpline = canRender && !isMobileDevice;
  const isPaused = false;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative isolate overflow-hidden rounded-xl spline-container"
      data-spline-scene
      data-hero-mode="true"
      style={{
        contain: 'layout style',
        touchAction: 'pan-y',
        position: 'relative',
        minHeight: '300px',
        height: '100%',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'auto',
      }}
    >
      {!hasLoadedOnce && !isInView && (
        <div className="absolute inset-0 bg-transparent rounded-xl overflow-hidden backdrop-blur-sm" style={{ minHeight: '300px', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <ShimmerRadialGlow color="white" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="white" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}

      {shouldShowSpline && (
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <ShimmerRadialGlow color="white" intensity="medium" />
            <ShimmerLine color="white" />
            <ShimmerSpinner size={40} color="white" />
          </div>
        }>
          <div
            className="absolute inset-0 pointer-events-auto transition-opacity duration-300"
            style={{
              touchAction: 'manipulation',
              opacity: isPaused ? 0 : 1,
              visibility: isPaused ? 'hidden' : 'visible',
              willChange: isPaused ? 'auto' : 'transform',
              transform: 'translateZ(0)',
            }}
          >
            <SplineScene scene={scene} />
          </div>
        </Suspense>
      )}

      {isPaused && (
        <div className="absolute inset-0 bg-black rounded-xl overflow-hidden">
          <ShimmerLine color="white" speed="slow" intensity="low" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShimmerSpinner size={32} color="white" speed="slow" />
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ borderColor: 'rgba(var(--accent-rgb, 255, 255, 255), 0.2)', borderWidth: '1px', borderStyle: 'solid' }} />
        </div>
      )}
    </div>
  );
}
