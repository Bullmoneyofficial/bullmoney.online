"use client";

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion } from "framer-motion";
import { ArrowRight, User } from 'lucide-react';
import { UI_Z_INDEX } from "@/contexts/UIStateContext";
import type { SplineWrapperProps } from '@/lib/spline-wrapper';

const UnifiedFpsPill = dynamic(
  () => import('@/components/ultimate-hub/pills/UnifiedFpsPill').then(m => ({ default: m.UnifiedFpsPill })),
  { ssr: false, loading: () => null }
);
const UnifiedHubPanel = dynamic(
  () => import('@/components/ultimate-hub/panel/UnifiedHubPanel').then(m => ({ default: m.UnifiedHubPanel })),
  { ssr: false, loading: () => null }
);
import { useLivePrices } from '@/components/ultimate-hub/hooks/useAccess';

const LegalDisclaimerModal = dynamic(
  () => import("@/components/Mainpage/footer/LegalDisclaimerModal").then(m => ({ default: m.LegalDisclaimerModal })),
  { ssr: false, loading: () => null }
);

// --- DYNAMIC SPLINE IMPORT (ultra-optimized wrapper) ---
const Spline = dynamic<SplineWrapperProps>(
  () => import(/* webpackChunkName: "spline-wrapper" */ '@/lib/spline-wrapper') as any,
  {
    ssr: false,
    loading: () => null,
  }
);

// Available Spline scenes - scene1 is preloaded in layout.tsx for fastest first load
const SPLINE_SCENES = ['/scene1.splinecode', '/scene.splinecode', '/scene2.splinecode', '/scene4.splinecode', '/scene5.splinecode', '/scene6.splinecode'];

// --- SPLINE LOAD LOCK (matches store page pattern for smooth loading) ---
function getSplineLoadLock() {
  const w = window as typeof window & { __BM_SPLINE_LOAD_LOCK__?: { active: boolean; queue: Array<() => void> } };
  if (!w.__BM_SPLINE_LOAD_LOCK__) {
    w.__BM_SPLINE_LOAD_LOCK__ = { active: false, queue: [] };
  }
  return w.__BM_SPLINE_LOAD_LOCK__;
}

function waitForSplineSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const lock = getSplineLoadLock();
    const grant = () => {
      lock.active = true;
      resolve(() => {
        lock.active = false;
        const next = lock.queue.shift();
        if (next) next();
      });
    };
    if (!lock.active) grant();
    else lock.queue.push(grant);
  });
}

// --- SIMPLE SPLINE BACKGROUND COMPONENT (DESKTOP) ---
// Uses same load-lock pattern as store page hero for smooth, lag-free loading
const WelcomeSplineBackground = memo(function WelcomeSplineBackground() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [allowLoad, setAllowLoad] = useState(false);
  const releaseRef = useRef<null | (() => void)>(null);

  const scene = SPLINE_SCENES[0]; // Always use scene1 for fastest cold start

  // Acquire load lock — only one Spline loads at a time (prevents GPU contention)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection || {};
    const saveData = !!conn.saveData;
    const effectiveType = String(conn.effectiveType || '');
    const isSlowNet = effectiveType === '2g' || effectiveType === 'slow-2g';
    const preloadPriority: 'high' | 'low' = (!saveData && !isSlowNet) ? 'high' : 'low';

    // Preload the runtime in parallel
    import(/* webpackChunkName: "spline-wrapper" */ '@/lib/spline-wrapper').catch(() => undefined);

    // Preconnect to Spline asset origins so scene subresources start faster
    const preconnectOrigins = ['https://prod.spline.design', 'https://cdn.spline.design'] as const;
    preconnectOrigins.forEach((href) => {
      if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
      const l = document.createElement('link');
      l.rel = 'preconnect';
      l.href = href;
      l.crossOrigin = 'anonymous';
      document.head.appendChild(l);
    });

    // Preload the scene file
    let link: HTMLLinkElement | null = null;
    const existing = document.querySelector(`link[rel="preload"][as="fetch"][href="${scene}"]`) as HTMLLinkElement | null;
    if (!existing) {
      link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'fetch';
      link.href = scene;
      link.crossOrigin = 'anonymous';
      // fetchPriority isn't in TS DOM typings everywhere yet
      (link as any).fetchPriority = preloadPriority;
      link.setAttribute('fetchpriority', preloadPriority);
      document.head.appendChild(link);
    }
    fetch(scene, { cache: 'force-cache', priority: preloadPriority as RequestPriority }).catch(() => undefined);

    // Wait for exclusive GPU slot
    waitForSplineSlot().then((release) => {
      if (cancelled) { release(); return; }
      releaseRef.current = release;
      setAllowLoad(true);
    });

    return () => {
      cancelled = true;
      if (link && link.parentNode) link.parentNode.removeChild(link);
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
      setAllowLoad(false);
    };
  }, [scene]);

  // Safety timeout — release lock after 15s even if Spline never fires onLoad
  useEffect(() => {
    if (!allowLoad || !releaseRef.current) return;
    const timeout = setTimeout(() => {
      if (releaseRef.current) {
        releaseRef.current();
        releaseRef.current = null;
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [allowLoad]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    // Release the load lock so other Spline instances can load
    if (releaseRef.current) {
      releaseRef.current();
      releaseRef.current = null;
    }
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{
        zIndex: 0,
        backgroundColor: '#000',
      }}
    >
      {/* Gradient fallback — always visible until Spline is loaded, then fades out */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,15,1) 0%, rgba(30,30,30,1) 50%, rgba(10,10,10,1) 100%)',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 700ms ease-out',
        }}
      />

      {/* Spline — only mounts after acquiring load lock (prevents GPU contention) */}
      {allowLoad && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            filter: 'grayscale(100%) saturate(0)',
            WebkitFilter: 'grayscale(100%) saturate(0)',
          } as React.CSSProperties}
        >
          <Spline
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

  .neon-title-desktop {
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
`;

interface WelcomeScreenDesktopProps {
  onSignUp: () => void;
  onGuest: () => void;
  onLogin: () => void;
  hideBackground?: boolean;
}

export function WelcomeScreenDesktop({ onSignUp, onGuest, onLogin, hideBackground = false }: WelcomeScreenDesktopProps) {
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms');

  // Ghost animation state - card pulses gently until user interacts
  const [userInteracted, setUserInteracted] = useState(false);

  // Use live prices from UltimateHub
  const prices = useLivePrices();

  // Handle user interaction to stop ghost mode; keep it local to the card to avoid auto-disabling from background mouse moves
  const handleUserInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
    }
  }, [userInteracted]);
  
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
            <WelcomeSplineBackground />
          </div>
        )}

        {/* ========== ULTIMATE HUB PILL - Positioned below header from top ========== */}
        <UnifiedFpsPill
          fps={60}
          deviceTier="high"
          prices={prices}
          isMinimized={isMinimized}
          onToggleMinimized={() => setIsMinimized(!isMinimized)}
          onOpenPanel={() => setIsHubOpen(true)}
          topOffsetMobile="calc(env(safe-area-inset-top, 0px) + 100px)"
          topOffsetDesktop="calc(env(safe-area-inset-top, 0px) + 110px)"
          mobileAlignment="center"
        />

        {/* Desktop Layout: Centered */}
        <div className="relative z-10 h-full w-full flex" style={{ pointerEvents: 'none' }}>
          {/* Centered Action Buttons */}
          {/* Full area touch/click handler to detect interaction */}
          <div
            className="w-full h-full flex flex-col justify-center items-center px-6 lg:px-10 xl:px-12"
            style={{ pointerEvents: 'none' }}
          >
            {/* Card Container - Gentle pulse animation until interaction (ultra-transparent glass) */}
            <motion.div
              initial={{ opacity: 0.6, scale: 0.98 }}
              animate={
                userInteracted
                  ? { opacity: 1, scale: 1 }
                  : {
                      // Smoother animation - never fully invisible to prevent black flash
                      opacity: [0.4, 0.85, 0.4],
                      scale: [0.97, 1, 0.97],
                    }
              }
              transition={
                userInteracted
                  ? { duration: 0.3, ease: 'easeOut' }
                  : {
                      duration: 4.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
                className="w-full max-w-[22rem] rounded-2xl p-6 xl:p-7 border border-white/10"
                onMouseEnter={handleUserInteraction}
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
              }}
            >
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
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Legal Disclaimer Modal */}
      <LegalDisclaimerModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
        initialTab={legalModalTab}
      />
      
      {/* ========== ULTIMATE HUB PANEL - Rendered via Portal to ensure it's on top ========== */}
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
  );
}

export default WelcomeScreenDesktop;
