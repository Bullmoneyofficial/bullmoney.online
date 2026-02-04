"use client";

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion } from "framer-motion";
import { ArrowRight, User } from 'lucide-react';
import { UI_Z_INDEX } from "@/contexts/UIStateContext";

// Import the actual UnifiedFpsPill and UnifiedHubPanel from UltimateHub
import { UnifiedFpsPill, UnifiedHubPanel, useLivePrices } from '@/components/UltimateHub';

// Import Legal Disclaimer Modal
import { LegalDisclaimerModal } from "@/components/Mainpage/footer/LegalDisclaimerModal";

// --- DYNAMIC SPLINE IMPORT ---
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

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

// --- SIMPLE SPLINE BACKGROUND COMPONENT (DESKTOP) ---
// Preloaded scene, interactive, loads fast - z-index 0 so menus overlay properly
const WelcomeSplineBackground = memo(function WelcomeSplineBackground() {
  const [isLoaded, setIsLoaded] = useState(false);
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

  const handleLoad = useCallback((splineApp: any) => {
    splineRef.current = splineApp;
    setIsLoaded(true);
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('[WelcomeSplineDesktop] Load error:', error);
    setIsLoaded(false);
  }, []);

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ 
        zIndex: 0,
        backgroundColor: '#000',
      }}
    >
      {/* SVG Filter for maximum in-app browser compatibility (Facebook, Instagram, TikTok, etc.) */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="grayscale-filter">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.1" />
              <feFuncG type="linear" slope="1.1" />
              <feFuncB type="linear" slope="1.1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Animated gradient fallback - always visible as base layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 40% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 35%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 45%), #000',
          opacity: !isLoaded ? 1 : 0.2,
          transition: 'opacity 600ms ease-out',
        }}
      />

      {/* Spline container with forced black & white - works in all browsers including in-app */}
      <div
        className="absolute inset-0"
        style={{
          filter: 'url(#grayscale-filter) grayscale(100%) saturate(0) contrast(1.1)',
          WebkitFilter: 'grayscale(100%) saturate(0) contrast(1.1)',
        } as React.CSSProperties}
      >
        <Spline
          scene={scene}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            opacity: isLoaded ? 1 : 0.6,
            transition: 'opacity 500ms ease-out',
            willChange: 'opacity',
            filter: 'grayscale(100%) saturate(0)',
            WebkitFilter: 'grayscale(100%) saturate(0)',
          } as React.CSSProperties}
        />
      </div>

      {/* Color-kill overlay - mix-blend-mode: color with gray removes ALL remaining color */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundColor: '#808080',
          mixBlendMode: 'color',
          WebkitMixBlendMode: 'color',
        } as React.CSSProperties}
      />

      {/* Extra fallback: semi-transparent grayscale overlay for stubborn in-app browsers */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundColor: 'rgba(128, 128, 128, 0.3)',
          mixBlendMode: 'saturation',
          WebkitMixBlendMode: 'saturation',
        } as React.CSSProperties}
      />
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
  const [mounted, setMounted] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms');

  // Ghost animation state - card pulses gently until user interacts
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
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="fixed inset-0 overflow-hidden"
        style={{ 
          minHeight: '100dvh', 
          width: '100vw', 
          height: '100vh',
          // Allow pointer events to pass through to Spline, but UI elements capture them
          pointerEvents: 'none',
          backgroundColor: hideBackground ? 'transparent' : '#000', // Prevent white flash unless parent provides background
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
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 0 60px rgba(255, 255, 255, 0.12)',
              }}
            >
              {/* Card Header - Only show on smaller desktop */}
              <div className="lg:hidden text-center mb-6">
                <h1 className="text-2xl font-black tracking-tight neon-title-desktop">
                  BULLMONEY
                </h1>
                <p className="text-xs text-white/50 mt-1.5">
                  The Ultimate Trading Hub
                </p>
              </div>

              {/* Action Header */}
              <div className="text-center mb-6 lg:mb-8">
                <h2 className="text-xl xl:text-2xl font-bold text-white mb-1.5">
                  Get Started
                </h2>
                <p className="text-white/50 text-xs xl:text-sm">
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
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.6) 100%)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 30px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
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
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                >
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5 xl:w-6 xl:h-6" />
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-1">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-white/20 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Guest Button - Tertiary glass */}
                <motion.button
                  onClick={handleGuestClick}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-medium text-sm xl:text-base tracking-wide transition-all flex items-center justify-center gap-2 text-white/50"
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
              <p className="text-center text-white/30 text-[11px] mt-5 xl:mt-6">
                By continuing, you agree to our{' '}
                <button 
                  type="button"
                  onClick={() => { setLegalModalTab('terms'); setIsLegalModalOpen(true); }}
                  className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Terms of Service
                </button>
                {', '}
                <button 
                  type="button"
                  onClick={() => { setLegalModalTab('privacy'); setIsLegalModalOpen(true); }}
                  className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </button>
                {' & '}
                <button 
                  type="button"
                  onClick={() => { setLegalModalTab('disclaimer'); setIsLegalModalOpen(true); }}
                  className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
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
