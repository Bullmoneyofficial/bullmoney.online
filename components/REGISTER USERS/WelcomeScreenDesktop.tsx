"use client";

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion } from "framer-motion";
import { ArrowRight, User } from 'lucide-react';

// Import the actual UnifiedFpsPill and UnifiedHubPanel from UltimateHub
import { UnifiedFpsPill, UnifiedHubPanel, useLivePrices } from '@/components/UltimateHub';

// --- DYNAMIC SPLINE IMPORT ---
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

const SPLINE_SCENES = [
  '/scene1.splinecode',
  '/scene2.splinecode',
  '/scene3.splinecode',
  '/scene4.splinecode',
  '/scene5.splinecode',
  '/scene6.splinecode',
  '/scene.splinecode',
];

const SPLINE_ROTATION_KEY = 'bullmoney_spline_rotation_v2';

const warmSplineRuntime = (() => {
  let warmed = false;
  return () => {
    if (warmed) return;
    warmed = true;
    if (typeof window !== 'undefined') {
      import('@splinetool/react-spline').catch(() => {});
    }
  };
})();

// --- WELCOME SCREEN SPLINE BACKGROUND COMPONENT ---
// Optimized with aggressive caching, preloading, and error recovery
const WelcomeSplineBackground = memo(function WelcomeSplineBackground() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sceneToLoad, setSceneToLoad] = useState<string>(SPLINE_SCENES[0]);
  const splineRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const MAX_RETRIES = 2;
  const ROTATE_INTERVAL_MS = 60000;

  const ensurePreload = useCallback((scenePath: string, rel: 'preload' | 'prefetch' = 'preload') => {
    if (typeof window === 'undefined') return;
    const existing = document.querySelector(`link[data-spline="${scenePath}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = rel;
      link.as = 'fetch';
      link.href = scenePath;
      link.crossOrigin = 'anonymous';
      link.dataset.spline = scenePath;
      document.head.appendChild(link);
    }
    fetch(scenePath, {
      method: 'GET',
      cache: 'force-cache',
      priority: rel === 'preload' ? 'high' : 'low'
    } as RequestInit).catch(() => {});
  }, []);

  const pickNextScene = useCallback(() => {
    try {
      const raw = localStorage.getItem(SPLINE_ROTATION_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      let queue: string[] = Array.isArray(parsed.queue) ? parsed.queue : [];
      if (!queue.length) {
        queue = [...SPLINE_SCENES];
        for (let i = queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [queue[i], queue[j]] = [queue[j], queue[i]];
        }
      }
      const next = queue.shift() || SPLINE_SCENES[0];
      localStorage.setItem(SPLINE_ROTATION_KEY, JSON.stringify({ queue, lastUsed: next, updated: Date.now() }));
      return next;
    } catch {
      return SPLINE_SCENES[0];
    }
  }, []);

  const setScene = useCallback((scene: string) => {
    setIsLoaded(false);
    setHasError(false);
    setRetryCount(0);
    setSceneToLoad(scene);
  }, []);

  // Preload the spline scene on mount for faster loading
  useEffect(() => {
    mountedRef.current = true;
    if (typeof window !== 'undefined') {
      warmSplineRuntime();
      const chosen = pickNextScene();
      setScene(chosen);
      ensurePreload(chosen, 'preload');

      const preloadOthers = () => {
        SPLINE_SCENES.filter((scene) => scene !== chosen).forEach((scene) => ensurePreload(scene, 'prefetch'));
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(preloadOthers, { timeout: 1200 });
      } else {
        setTimeout(preloadOthers, 500);
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [ensurePreload, pickNextScene, setScene]);

  // Rotate scenes every ROTATE_INTERVAL_MS to keep visuals fresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setInterval(() => {
      const next = pickNextScene();
      ensurePreload(next, 'preload');
      setScene(next);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [ensurePreload, pickNextScene, setScene]);

  // Handle successful load
  const handleLoad = useCallback((spline: any) => {
    if (mountedRef.current) {
      splineRef.current = spline;
      setIsLoaded(true);
      setHasError(false);
    }
  }, []);

  // Handle error with retry logic
  const handleError = useCallback(() => {
    if (mountedRef.current) {
      if (retryCount < MAX_RETRIES) {
        // Retry after a short delay
        setTimeout(() => {
          if (mountedRef.current) {
            setRetryCount(prev => prev + 1);
            setHasError(false);
          }
        }, 500);
      } else {
        const fallback = SPLINE_SCENES[0];
        setScene(fallback);
        setHasError(true);
      }
    }
  }, [retryCount, setScene]);

  return (
    <div
      className="absolute inset-0 w-full h-full"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000',
        contain: 'layout style paint',
      }}
    >
      {/* Spline Scene - with retry key to force remount on retry */}
      {!hasError && (
        <div
          key={`spline-desktop-${sceneToLoad}-${retryCount}`}
          className={`absolute inset-0 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'auto',
            pointerEvents: 'auto',
            willChange: isLoaded ? 'auto' : 'opacity',
          }}
        >
          <Spline
            scene={sceneToLoad}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              touchAction: 'auto',
            }}
          />
        </div>
      )}

      {/* Subtle gradient fallback while loading or on error */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${isLoaded && !hasError ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 40%), #000',
        }}
      />
    </div>
  );
});

// --- NEON STYLES ---
const NEON_STYLES = `
  @keyframes neon-pulse-desktop {
    0%, 100% { 
      text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, 0 0 16px #3b82f6;
      filter: brightness(1);
    }
    50% { 
      text-shadow: 0 0 6px #3b82f6, 0 0 12px #3b82f6, 0 0 20px #3b82f6;
      filter: brightness(1.1);
    }
  }

  @keyframes neon-glow-desktop {
    0%, 100% { 
      box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px rgba(59,130,246,0.3);
    }
    50% { 
      box-shadow: 0 0 8px #3b82f6, 0 0 16px #3b82f6, inset 0 0 6px rgba(59,130,246,0.4);
    }
  }

  @keyframes float-up {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .neon-title-desktop {
    color: #3b82f6;
    text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, 0 0 16px #3b82f6;
    animation: neon-pulse-desktop 2s ease-in-out infinite;
  }

  .neon-border-desktop {
    border: 2px solid #3b82f6;
    box-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6, inset 0 0 4px rgba(59,130,246,0.2);
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
  const [mounted, setMounted] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Ghost animation state - card fades until user interacts
  const [userInteracted, setUserInteracted] = useState(false);

  // Use live prices from UltimateHub
  const prices = useLivePrices();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return (
    <>
      <style>{NEON_STYLES}</style>
      <motion.div
        key="welcome-screen-desktop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[99999999] overflow-hidden"
        style={{ minHeight: '100dvh', width: '100vw', height: '100vh' }}
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
              touchAction: 'auto'
            }}
          >
            <WelcomeSplineBackground />
          </div>
        )}

        {/* ========== ULTIMATE HUB PILL - Using actual component from UltimateHub ========== */}
        <UnifiedFpsPill
          fps={60}
          deviceTier="high"
          prices={prices}
          isMinimized={isMinimized}
          onToggleMinimized={() => setIsMinimized(!isMinimized)}
          onOpenPanel={() => setIsHubOpen(true)}
        />

        {/* Desktop Layout: Centered */}
        <div className="relative z-10 h-full w-full flex" style={{ pointerEvents: 'none' }}>
          {/* Centered Action Buttons */}
          {/* Full area touch/click handler to detect interaction */}
          <div
            className="w-full h-full flex flex-col justify-center items-center px-8 lg:px-12 xl:px-16"
            style={{ pointerEvents: 'none' }}
          >
            {/* Card Container - Ghost animation until interaction (ultra-transparent glass) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={
                userInteracted
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: [0, 1, 0],
                      scale: [0.96, 1, 0.96],
                    }
              }
              transition={
                userInteracted
                  ? { duration: 0.3, ease: 'easeOut' }
                  : {
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
                className="w-full max-w-md rounded-2xl p-8 xl:p-10 border border-white/5"
                onMouseEnter={handleUserInteraction}
                onTouchStart={handleUserInteraction}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 0 40px rgba(59, 130, 246, 0.1)',
              }}
            >
              {/* Card Header - Only show on smaller desktop */}
              <div className="lg:hidden text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight neon-title-desktop">
                  BULLMONEY
                </h1>
                <p className="text-sm text-white/50 mt-2">
                  The Ultimate Trading Hub
                </p>
              </div>

              {/* Action Header */}
              <div className="text-center mb-8 lg:mb-10">
                <h2 className="text-2xl xl:text-3xl font-bold text-white mb-2">
                  Get Started
                </h2>
                <p className="text-white/50 text-sm xl:text-base">
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
                  className="w-full py-4 xl:py-5 rounded-xl font-bold text-lg xl:text-xl tracking-wide transition-all flex items-center justify-center gap-3 text-white"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.6) 100%)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 30px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
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
                  className="w-full py-4 xl:py-5 rounded-xl font-bold text-lg xl:text-xl tracking-wide transition-all flex items-center justify-center gap-3 text-blue-300"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5 xl:w-6 xl:h-6" />
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-1">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-white/20 text-sm">or</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Guest Button - Tertiary glass */}
                <motion.button
                  onClick={handleGuestClick}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 xl:py-4 rounded-xl font-medium text-base xl:text-lg tracking-wide transition-all flex items-center justify-center gap-2 text-white/50"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <User className="w-4 h-4 xl:w-5 xl:h-5" />
                  <span>Continue as Guest</span>
                </motion.button>
              </div>

              {/* Footer Note */}
              <p className="text-center text-white/30 text-xs mt-6 xl:mt-8">
                By continuing, you agree to our Terms of Service
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
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
