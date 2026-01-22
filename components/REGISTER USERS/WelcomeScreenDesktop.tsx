"use client";

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion } from "framer-motion";
import { ArrowRight, User, Sparkles, Shield, TrendingUp } from 'lucide-react';

// Import the actual UnifiedFpsPill and UnifiedHubPanel from UltimateHub
import { UnifiedFpsPill, UnifiedHubPanel, useLivePrices } from '@/components/UltimateHub';

// --- DYNAMIC SPLINE IMPORT ---
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => null,
});

// --- WELCOME SCREEN SPLINE BACKGROUND COMPONENT ---
// Optimized with aggressive caching, preloading, and error recovery
const WelcomeSplineBackground = memo(function WelcomeSplineBackground() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const splineRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const MAX_RETRIES = 2;

  // Preload the spline scene on mount for faster loading
  useEffect(() => {
    mountedRef.current = true;

    // Aggressive preloading - cache the spline file
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = '/scene1.splinecode';
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      if (!document.querySelector('link[href="/scene1.splinecode"]')) {
        document.head.appendChild(link);
      }

      // Also fetch to warm the cache
      fetch('/scene1.splinecode', {
        method: 'GET',
        cache: 'force-cache',
        priority: 'high'
      } as RequestInit).catch(() => {});
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

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
        setHasError(true);
      }
    }
  }, [retryCount]);

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
          key={`spline-desktop-${retryCount}`}
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
            scene="/scene1.splinecode"
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
}

export function WelcomeScreenDesktop({ onSignUp, onGuest, onLogin }: WelcomeScreenDesktopProps) {
  const [mounted, setMounted] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Use live prices from UltimateHub
  const prices = useLivePrices();

  useEffect(() => {
    setMounted(true);
  }, []);
  
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
        {/* Spline Background - Full screen */}
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

        {/* ========== ULTIMATE HUB PILL - Using actual component from UltimateHub ========== */}
        <UnifiedFpsPill
          fps={60}
          deviceTier="high"
          prices={prices}
          isMinimized={isMinimized}
          onToggleMinimized={() => setIsMinimized(!isMinimized)}
          onOpenPanel={() => setIsHubOpen(true)}
        />

        {/* Desktop Layout: Split View */}
        <div className="relative z-10 h-full w-full flex">
          
          {/* Left Side - Branding & Info (60% width) */}
          <div className="hidden lg:flex w-[60%] h-full flex-col justify-center items-start pl-16 xl:pl-24 2xl:pl-32 pr-8">
            {/* Logo/Brand */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-black tracking-tight neon-title-desktop">
                BULLMONEY
              </h1>
              <p className="text-lg xl:text-xl text-white/60 mt-3 font-medium tracking-wide">
                The Ultimate Trading Hub
              </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4 max-w-lg"
            >
              <FeatureCard 
                icon={<TrendingUp className="w-5 h-5" />}
                title="Live Trade Setups"
                description="Real-time callouts from professional traders"
                delay={0}
              />
              <FeatureCard 
                icon={<Sparkles className="w-5 h-5" />}
                title="Premium Signals"
                description="Access exclusive trading strategies and alerts"
                delay={0.1}
              />
              <FeatureCard 
                icon={<Shield className="w-5 h-5" />}
                title="Elite Community"
                description="Join 10,000+ traders sharing winning setups"
                delay={0.2}
              />
            </motion.div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 flex items-center gap-8"
            >
              <StatItem value="10K+" label="Active Traders" />
              <StatItem value="500+" label="Daily Signals" />
              <StatItem value="24/7" label="Live Support" />
            </motion.div>
          </div>

          {/* Right Side - Action Buttons (40% width on large, full on medium) */}
          <div className="w-full lg:w-[40%] h-full flex flex-col justify-center items-center px-8 lg:px-12 xl:px-16">
            {/* Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full max-w-md bg-black/70 backdrop-blur-xl rounded-3xl p-8 xl:p-10 neon-border-desktop"
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
              <div className="flex flex-col gap-4">
                {/* Sign Up Button - Primary */}
                <motion.button
                  onClick={onSignUp}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(59,130,246,0.6)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 xl:py-5 bg-blue-600 hover:bg-blue-500 border-2 border-blue-400 rounded-xl font-bold text-lg xl:text-xl tracking-wide transition-all flex items-center justify-center gap-3 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5 xl:w-6 xl:h-6" />
                </motion.button>

                {/* Login Button - Secondary */}
                <motion.button
                  onClick={onLogin}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 xl:py-5 bg-transparent border-2 border-blue-500/60 rounded-xl font-bold text-lg xl:text-xl tracking-wide transition-all flex items-center justify-center gap-3 text-blue-400 hover:border-blue-400 hover:text-blue-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5 xl:w-6 xl:h-6" />
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-sm">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Guest Button - Tertiary - Fast transition */}
                <button
                  onClick={handleGuestClick}
                  className="w-full py-3 xl:py-4 bg-transparent border border-white/20 rounded-xl font-medium text-base xl:text-lg tracking-wide transition-all flex items-center justify-center gap-2 text-white/60 hover:border-white/40 hover:text-white/80 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <User className="w-4 h-4 xl:w-5 xl:h-5" />
                  <span>Continue as Guest</span>
                </button>
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

// Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 + delay }}
      className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/30 transition-all group"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/30 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-base">{title}</h3>
        <p className="text-white/50 text-sm mt-0.5">{description}</p>
      </div>
    </motion.div>
  );
}

// Stat Item Component
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl xl:text-3xl font-bold text-blue-400" style={{ textShadow: '0 0 10px rgba(59,130,246,0.5)' }}>
        {value}
      </div>
      <div className="text-xs xl:text-sm text-white/40 mt-1">{label}</div>
    </div>
  );
}

export default WelcomeScreenDesktop;
