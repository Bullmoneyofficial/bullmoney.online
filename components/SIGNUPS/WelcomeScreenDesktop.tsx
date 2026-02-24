"use client";

import { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, User } from 'lucide-react';
import { UI_Z_INDEX } from "@/contexts/UIStateContext";
import type { SplineWrapperProps } from '@/lib/spline-wrapper';
import { MatrixTerminalBg } from "@/components/signups/pagemode/MatrixTerminalBg";

// Lazy-load heavy pieces only when needed
const LegalDisclaimerModal = dynamic(
  () => import("@/components/Mainpage/footer/LegalDisclaimerModal").then(m => ({ default: m.LegalDisclaimerModal })),
  { ssr: false, loading: () => null }
);

// Available Spline scenes - use scene1 only; load lazily to keep first paint fast
const SPLINE_SCENES = ['/scene1.splinecode'];

// --- SIMPLE SPLINE BACKGROUND COMPONENT (DESKTOP) ---
// No load-lock — mounting Spline immediately is faster than waiting in a queue.
const WelcomeSplineBackground = memo(function WelcomeSplineBackground({ enable }: { enable: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [allowLoad, setAllowLoad] = useState(false);
  const [SplineComp, setSplineComp] = useState<React.ComponentType<SplineWrapperProps> | null>(null);
  // Covers Spline with the terminal whenever it may have gone black (tab switch / context loss)
  const [splineCovered, setSplineCovered] = useState(false);
  const coverTimerRef = useRef<number | null>(null);
  const splineWrapRef = useRef<HTMLDivElement>(null);

  // 50/50 per page-load: either show Spline or keep the terminal as the background
  const useSpline = useRef(Math.random() < 0.5).current;

  const scene = SPLINE_SCENES[0]; // Always use scene1 for fastest cold start

  // When tab becomes visible again, briefly re-show terminal while Spline's WebGL context recovers
  useEffect(() => {
    if (!useSpline) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') return;
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

  // Preload immediately — only when Spline was chosen this session
  useEffect(() => {
    if (!enable || !useSpline || typeof window === 'undefined') return;
    let cancelled = false;
    let link: HTMLLinkElement | null = null;
    const timer = window.setTimeout(() => {
      const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection || {};
      const saveData = !!conn.saveData;
      const effectiveType = String(conn.effectiveType || '');
      const isSlowNet = effectiveType === '2g' || effectiveType === 'slow-2g';
      const preloadPriority: 'high' | 'low' = (!saveData && !isSlowNet) ? 'high' : 'low';

      import('@/lib/spline-wrapper')
        .then(mod => { if (!cancelled) setSplineComp(() => mod.default as any); })
        .catch(() => {});

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
    }, 0); // start immediately — no delay for fastest Spline paint

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (link && link.parentNode) link.parentNode.removeChild(link);
    };
  }, [scene, enable, useSpline]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    // Signal the splash controller that Spline has rendered — dismisses the splash.
    try { window.dispatchEvent(new CustomEvent('bm-spline-ready')); } catch (_) {}
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{
        zIndex: 0,
        backgroundColor: '#000',
      }}
    >
      {/* Matrix terminal — shown while loading OR whenever Spline goes black (tab switch / context loss) */}
      <MatrixTerminalBg visible={!isLoaded || splineCovered} />

      {/* Spline — only mounts on the 50% of sessions where it was chosen */}
      {useSpline && allowLoad && SplineComp && (
        <div
          ref={splineWrapRef}
          className={`absolute inset-0 transition-opacity duration-700 ${isLoaded && !splineCovered ? 'opacity-100' : 'opacity-0'}`}
          style={{
            filter: 'grayscale(100%) saturate(0)',
            WebkitFilter: 'grayscale(100%) saturate(0)',
          } as React.CSSProperties}
        >
          <SplineComp
            scene={scene}
            onLoad={handleLoad}
            priority
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
});

// --- NEON STYLES ---
const NEON_STYLES = `
  @keyframes neon-pulse-desktop {
    0%, 100% { 
      text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, 0 0 16px #ffffff;
      filter: brightness(1);
    }
    50% { 
      text-shadow: 0 0 6px #ffffff, 0 0 12px #ffffff, 0 0 20px #ffffff;
      filter: brightness(1.1);
    }
  }

  @keyframes neon-glow-desktop {
    0%, 100% { 
      box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px rgba(255, 255, 255,0.3);
    }
    50% { 
      box-shadow: 0 0 8px #ffffff, 0 0 16px #ffffff, inset 0 0 6px rgba(255, 255, 255,0.4);
    }
  }

  @keyframes float-up {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

                     <WelcomeSplineBackground enable={enableSpline} />
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, 0 0 16px #ffffff;
    animation: neon-pulse-desktop 2s ease-in-out infinite;
  }

  .neon-border-desktop {
    border: 2px solid #ffffff;
    box-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff, inset 0 0 4px rgba(255, 255, 255,0.2);
    animation: neon-glow-desktop 2s ease-in-out infinite;
  }

  .float-animation {
    animation: float-up 3s ease-in-out infinite;
  }

  .welcome-pull-tab {
    overflow: hidden;
  }
`;

type PullEdge = 'left' | 'right' | 'top' | 'bottom';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickOne<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

interface WelcomeScreenDesktopProps {
  onSignUp: () => void;
  onGuest: () => void;
  onLogin: () => void;
  hideBackground?: boolean;
}

export function WelcomeScreenDesktop({ onSignUp, onGuest, onLogin, hideBackground = false }: WelcomeScreenDesktopProps) {
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms');
  const [legalModalReady, setLegalModalReady] = useState(false);

  // Ghost animation state - card pulses gently until user interacts
  const [userInteracted, setUserInteracted] = useState(false);

  // Bubble animation pauses on interaction, then resumes after inactivity.
  const [bubblePaused, setBubblePaused] = useState(false);
  const resumeBubbleTimerRef = useRef<number | null>(null);

  // Enable heavy visuals only after first interaction
  const [enableSpline, setEnableSpline] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const lastGlobalActivityRef = useRef(0);

  const prefersReducedMotion = useReducedMotion();

  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [pullTabEdge, setPullTabEdge] = useState<PullEdge | null>(null);
  const [bubblePose, setBubblePose] = useState({ x: 0, y: 0, scale: 1 });
  const bubbleTimersRef = useRef<number[]>([]);

  const bubbleEnabled = useMemo(() => {
    if (prefersReducedMotion) return false;
    return !bubblePaused;
  }, [prefersReducedMotion, bubblePaused]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    bubbleTimersRef.current.forEach((t) => window.clearTimeout(t));
    bubbleTimersRef.current = [];

    if (!bubbleEnabled) {
      // Bubble loop is paused; keep current pose/pull-tab state (other handlers may control it).
      return;
    }

    const edges: readonly PullEdge[] = ['left', 'right'] as const;

    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      bubbleTimersRef.current.push(id);
    };

    const computeBounds = () => {
      // Approximate card size to keep it on-screen while moving.
      // It doesn’t need to be perfect; it just prevents drifting off-canvas.
      const margin = 18;
      const approxCardW = 360;
      const approxCardH = 480;
      const safeX = Math.max(0, viewport.width / 2 - approxCardW / 2 - margin);
      const safeY = Math.max(0, viewport.height / 2 - approxCardH / 2 - margin);
      return { safeX, safeY };
    };

    const moveToRandomInterior = () => {
      const { safeX, safeY } = computeBounds();
      const x = clamp((Math.random() * 2 - 1) * safeX * 0.85, -safeX, safeX);
      const y = clamp((Math.random() * 2 - 1) * safeY * 0.75, -safeY, safeY);
      const edgeFactor = Math.max(safeX ? Math.abs(x) / safeX : 0, safeY ? Math.abs(y) / safeY : 0);
      const scale = clamp(1.05 - edgeFactor * 0.25, 0.82, 1.06);

      setPullTabEdge(null);
      setBubblePose({ x, y, scale });
    };

    const dockAsPullTab = () => {
      const { safeX, safeY } = computeBounds();
      const edge = pickOne(edges);

      const x = edge === 'left' ? -safeX : safeX;
      const y = clamp((Math.random() * 2 - 1) * safeY * 0.65, -safeY, safeY);

      setPullTabEdge(edge);
      setBubblePose({ x, y, scale: 0.78 });
    };

    const loop = () => {
      // 1) Float around to a new spot
      moveToRandomInterior();

      // 2) Occasionally “dock” as a pull tab, pause for ~2s, then move again
      schedule(() => {
        // ~60% chance to dock each cycle so it feels like it “hits” the edges regularly
        if (Math.random() < 0.6) {
          dockAsPullTab();
          schedule(() => {
            moveToRandomInterior();
            schedule(loop, 2600);
          }, 2000);
        } else {
          schedule(loop, 3200);
        }
      }, 2400);
    };

    // Start quickly so it feels alive on load
    schedule(loop, 450);

    return () => {
      bubbleTimersRef.current.forEach((t) => window.clearTimeout(t));
      bubbleTimersRef.current = [];
    };
  }, [bubbleEnabled, viewport.height, viewport.width]);

  // First user interaction enables heavy assets (Spline + legal modal import trigger)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const enableHeavy = () => {
      setUserInteracted(true);
      setEnableSpline(true);
      setLegalModalReady(true);
    };
    const opts = { once: true } as AddEventListenerOptions;
    window.addEventListener('pointerdown', enableHeavy, opts);
    window.addEventListener('keydown', enableHeavy, opts);
    return () => {
      window.removeEventListener('pointerdown', enableHeavy, opts as any);
      window.removeEventListener('keydown', enableHeavy, opts as any);
    };
  }, []);

  // Handle user interaction to stop ghost mode; keep it local to the card to avoid auto-disabling from background mouse moves
  const handleUserInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
      setEnableSpline(true);
      setLegalModalReady(true);
    }

    // If we're currently docked as a pull-tab, interacting with it should pull it open.
    if (pullTabEdge) {
      setPullTabEdge(null);
    }

    // Pause the bubble while the user is active, then resume after a short idle period.
    setBubblePaused(true);
    if (resumeBubbleTimerRef.current) window.clearTimeout(resumeBubbleTimerRef.current);
    resumeBubbleTimerRef.current = window.setTimeout(() => {
      setBubblePaused(false);
    }, 4500);
  }, [pullTabEdge, userInteracted]);

  const computeSafeBounds = useCallback(() => {
    const margin = 18;
    const approxCardW = 360;
    const approxCardH = 480;
    const safeX = Math.max(0, viewport.width / 2 - approxCardW / 2 - margin);
    const safeY = Math.max(0, viewport.height / 2 - approxCardH / 2 - margin);
    return { safeX, safeY };
  }, [viewport.height, viewport.width]);

  const dockAsAccessWebsiteTab = useCallback(
    (clientY: number) => {
      // Dock as a small tab — compute bounds using tab-like dimensions so it can sit closer
      // to the screen edge than the full card.
      const margin = 16;
      const approxTabW = 240;
      const approxTabH = 64;
      const safeX = Math.max(0, viewport.width / 2 - approxTabW / 2 - margin);
      const safeY = Math.max(0, viewport.height / 2 - approxTabH / 2 - margin);

      // Keep it in the lower half so it doesn't cover the bot's face.
      const yFromPointer = clientY - viewport.height / 2 + 220;
      const minLower = safeY * 0.25;
      const y = clamp(Math.max(yFromPointer, minLower), -safeY, safeY);

      setPullTabEdge('right');
      setBubblePose({ x: safeX, y, scale: 0.78 });
      setBubblePaused(true);
      if (resumeBubbleTimerRef.current) window.clearTimeout(resumeBubbleTimerRef.current);
      resumeBubbleTimerRef.current = window.setTimeout(() => {
        setBubblePaused(false);
      }, 4500);
    },
    [viewport.height, viewport.width]
  );

  useEffect(() => {
    return () => {
      if (resumeBubbleTimerRef.current) window.clearTimeout(resumeBubbleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof window === 'undefined') return;

    const onPointerMove = (ev: PointerEvent) => {
      // Throttle: we only need occasional checks.
      const now = Date.now();
      if (now - lastGlobalActivityRef.current < 250) return;
      lastGlobalActivityRef.current = now;

      const target = ev.target as Node | null;
      // Ignore movement that’s already over the card itself (card handlers cover that).
      const overCard = !!(target && cardRef.current && cardRef.current.contains(target));
      if (overCard) {
        return;
      }

      // Pointer is over background/Spline area => become a pull tab that says ACCESS WEBSITE
      if (!userInteracted) setUserInteracted(true);
      dockAsAccessWebsiteTab(ev.clientY);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [dockAsAccessWebsiteTab, prefersReducedMotion, userInteracted]);
  
  // Handle guest click - immediate transition, no animation delay
  const handleGuestClick = useCallback(() => {
    // Immediately call onGuest without animation delays
    onGuest();
  }, [onGuest]);

  return (
    <>
      <style>{NEON_STYLES}</style>
      <motion.div
        key="welcome-screen-desktop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed inset-0 overflow-hidden"
        style={{ 
          minHeight: '100dvh', 
          width: '100vw', 
          height: '100vh',
          // Allow pointer events to pass through to Spline, but UI elements capture them
          pointerEvents: 'none',
          backgroundColor: hideBackground ? 'transparent' : '#000',
          color: hideBackground ? '#000' : '#fff',
          zIndex: UI_Z_INDEX.PAGEMODE,
        }}
      >
        {/* Spline Background - Full screen (can be suppressed if parent provides shared background) */}
        {!hideBackground && (
          <div 
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              minHeight: '100dvh',
              zIndex: 0,
              pointerEvents: 'auto',
              touchAction: 'auto',
              backgroundColor: '#000',
            }}
          >
            <WelcomeSplineBackground enable />
          </div>
        )}

        {/* Desktop Layout: Centered */}
        <div className="relative z-10 h-full w-full flex" style={{ pointerEvents: 'none' }}>
          {/* Centered Action Buttons */}
          {/* Full area touch/click handler to detect interaction */}
          <div
            className="w-full h-full flex flex-col justify-center items-center px-6 lg:px-10 xl:px-12"
            style={{ pointerEvents: 'none' }}
          >
            {/* Floating wrapper (desktop welcome menu “bubbles” around until user interacts) */}
            <motion.div
              initial={{ x: 0, y: 0, scale: 1 }}
              animate={pullTabEdge ? bubblePose : bubbleEnabled ? bubblePose : { x: 0, y: 0, scale: 1 }}
              transition={{ duration: pullTabEdge ? 0.9 : 1.15, ease: 'easeInOut' }}
              style={{ pointerEvents: 'none' }}
            >
              {/* Card Container - Gentle opacity pulse until interaction (ultra-transparent glass) */}
              <motion.div
                initial={{ opacity: 0.6 }}
                animate={
                  userInteracted
                    ? { opacity: 1 }
                    : {
                        // Never fully invisible to prevent black flash
                        opacity: [0.45, 0.9, 0.45],
                      }
                }
                transition={
                  userInteracted
                    ? { duration: 0.25, ease: 'easeOut' }
                    : {
                        duration: 4.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                }
                className={
                  pullTabEdge
                    ? "welcome-pull-tab inline-flex rounded-full border border-white/10"
                    : "w-full max-w-[22rem] rounded-2xl p-6 xl:p-7 border border-white/10"
                }
                ref={cardRef}
                onMouseEnter={handleUserInteraction}
                onMouseMove={handleUserInteraction}
                onFocus={handleUserInteraction}
                onTouchStart={handleUserInteraction}
                onClick={handleUserInteraction}
                style={{
                  pointerEvents: 'auto',
                  background: hideBackground ? '#fff' : 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: hideBackground ? undefined : 'blur(16px)',
                  WebkitBackdropFilter: hideBackground ? undefined : 'blur(16px)',
                  boxShadow: hideBackground
                    ? '0 8px 40px rgba(0, 0, 0, 0.10), inset 0 0 0 1px rgba(0, 0, 0, 0.06)'
                    : '0 8px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 0 60px rgba(255, 255, 255, 0.12)',
                  border: hideBackground ? '1px solid rgba(0,0,0,0.10)' : undefined,
                  // Pull-tab presentation (briefly docks to an edge)
                  padding:
                    pullTabEdge
                      ? '12px 14px'
                      : undefined,
                  display: pullTabEdge ? 'inline-flex' : undefined,
                  alignItems: pullTabEdge ? 'center' : undefined,
                  justifyContent: pullTabEdge ? 'center' : undefined,
                  minHeight: pullTabEdge ? 52 : undefined,
                  // Keep the tab readable; let content define width/height.
                  width: pullTabEdge ? 'auto' : undefined,
                  height: pullTabEdge ? 'auto' : undefined,
                }}
              >
                {pullTabEdge ? (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      minHeight: 52,
                    }}
                  >
                    <div
                      className="flex items-center justify-center gap-2"
                      style={{
                        color: hideBackground ? '#000' : '#fff',
                        letterSpacing: '0.12em',
                        fontWeight: 900,
                        fontSize: 12,
                        lineHeight: 1,
                        opacity: hideBackground ? 0.88 : 0.95,
                        userSelect: 'none',
                      }}
                    >
                      <span>ACCESS WEBSITE</span>
                      <span style={{ transform: pullTabEdge === 'right' ? 'rotate(180deg)' : undefined, display: 'inline-flex' }}>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Card Header - Only show on smaller desktop */}
                    <div className="lg:hidden text-center mb-6">
                      <h1
                        className="text-2xl font-black tracking-tight neon-title-desktop"
                        style={{ color: hideBackground ? '#000' : undefined, textShadow: hideBackground ? 'none' : undefined, animation: hideBackground ? 'none' : undefined }}
                      >
                        BULLMONEY
                      </h1>
                      <p className="text-xs text-white/50 mt-1.5" style={{ color: hideBackground ? 'rgba(0,0,0,0.55)' : undefined }}>
                        The Ultimate Trading Hub
                      </p>
                    </div>

              {/* Action Header */}
              <div className="text-center mb-6 lg:mb-8">
                <h2 className="text-xl xl:text-2xl font-bold text-white mb-1.5" style={{ color: hideBackground ? '#000' : '#fff' }}>
                  Get Started
                </h2>
                <p className="text-white/50 text-xs xl:text-sm" style={{ color: hideBackground ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.5)' }}>
                  Choose how you want to continue
                </p>
              </div>

              {/* Buttons Stack */}
              <div className="flex flex-col gap-3" style={{ pointerEvents: 'auto' }}>
                {/* Sign Up Button - Primary glass */}
                <motion.button
                  onClick={onSignUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 xl:py-4 rounded-xl font-bold text-base xl:text-lg tracking-wide transition-all flex items-center justify-center gap-3 text-white"
                  style={{
                    color: hideBackground ? '#000' : '#fff',
                    background: hideBackground
                      ? '#fff'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.6) 100%)',
                    backdropFilter: hideBackground ? undefined : 'blur(8px)',
                    boxShadow: hideBackground
                      ? '0 6px 24px rgba(0, 0, 0, 0.10)'
                      : '0 4px 30px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: hideBackground ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5 xl:w-6 xl:h-6" />
                </motion.button>

                {/* Login Button - Secondary glass */}
                <motion.button
                  onClick={onLogin}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 xl:py-4 rounded-xl font-bold text-base xl:text-lg tracking-wide transition-all flex items-center justify-center gap-3 text-white"
                  style={{
                    color: hideBackground ? '#000' : '#fff',
                    background: hideBackground ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: hideBackground ? undefined : 'blur(6px)',
                    border: hideBackground ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                >
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5 xl:w-6 xl:h-6" />
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-1">
                  <div className="flex-1 h-px bg-white/5" style={{ backgroundColor: hideBackground ? 'rgba(0,0,0,0.08)' : undefined }} />
                  <span className="text-white/20 text-xs" style={{ color: hideBackground ? 'rgba(0,0,0,0.35)' : undefined }}>or</span>
                  <div className="flex-1 h-px bg-white/5" style={{ backgroundColor: hideBackground ? 'rgba(0,0,0,0.08)' : undefined }} />
                </div>

                {/* Guest Button - Tertiary glass */}
                <motion.button
                  onClick={handleGuestClick}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-medium text-sm xl:text-base tracking-wide transition-all flex items-center justify-center gap-2 text-white/50"
                  style={{
                    color: hideBackground ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.5)',
                    background: hideBackground ? '#fff' : 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: hideBackground ? undefined : 'blur(4px)',
                    border: hideBackground ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <User className="w-4 h-4 xl:w-5 xl:h-5" />
                  <span>Continue as Guest</span>
                </motion.button>
              </div>

              {/* Footer Note */}
              <p
                className="text-center text-white/30 text-[11px] mt-5 xl:mt-6"
                style={{ color: hideBackground ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.3)' }}
              >
                By continuing, you agree to our{' '}
                <button 
                  type="button"
                  onClick={() => { setLegalModalTab('terms'); setIsLegalModalOpen(true); }}
                  className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
                  style={{ color: hideBackground ? 'rgba(0,0,0,0.70)' : undefined }}
                >
                  Terms of Service
                </button>
                {', '}
                <button 
                  type="button"
                  onClick={() => { setLegalModalTab('privacy'); setIsLegalModalOpen(true); }}
                  className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
                  style={{ color: hideBackground ? 'rgba(0,0,0,0.70)' : undefined }}
                >
                  Privacy Policy
                </button>
                {' & '}
                <button 
                  type="button"
                  onClick={() => { setLegalModalTab('disclaimer'); setIsLegalModalOpen(true); }}
                  className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
                  style={{ color: hideBackground ? 'rgba(0,0,0,0.70)' : undefined }}
                >
                  Disclaimer
                </button>
              </p>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Legal Disclaimer Modal */}
      {legalModalReady && (
        <LegalDisclaimerModal 
          isOpen={isLegalModalOpen} 
          onClose={() => setIsLegalModalOpen(false)} 
          initialTab={legalModalTab}
        />
      )}
    </>
  );
}

export default WelcomeScreenDesktop;
