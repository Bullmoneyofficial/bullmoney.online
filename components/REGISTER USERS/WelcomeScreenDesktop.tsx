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
  
  // On low memory devices, always use scene1 (preloaded, most optimized)
  // Otherwise, use scene1 on first visit, random on return visits
  const [scene] = useState(() => {
    if (typeof window === 'undefined') return SPLINE_SCENES[0];
    
    // Low memory device = always scene1
    if (isLowMemoryDevice()) {
      return SPLINE_SCENES[0];
    }
    
    // Normal device: scene1 on first visit, random after
    const visited = sessionStorage.getItem('spline_visited_desktop');
    if (!visited) {
      sessionStorage.setItem('spline_visited_desktop', '1');
      return SPLINE_SCENES[0]; // scene1 - preloaded for fast first load
    }
    return SPLINE_SCENES[Math.floor(Math.random() * SPLINE_SCENES.length)];
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden bg-black"
      style={{ zIndex: 0 }}
    >
      <Spline
        scene={scene}
        onLoad={handleLoad}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 400ms ease-out',
        }}
      />
      {/* Loading placeholder - non-interactive */}
      {!isLoaded && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), #000',
          }}
        />
      )}
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
        className="fixed inset-0 z-10 overflow-hidden pointer-events-none"
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
