import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOBILE_HELPER_TIPS } from './navbar.utils';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';
import { useAudioSettings } from '@/contexts/AudioSettingsProvider';
import { useComponentLifecycle } from '@/lib/UnifiedPerformanceSystem';
import { useComponentTracking } from '@/lib/CrashTracker';

export const MobileStaticHelper = memo(() => {
  const { activeTheme } = useGlobalTheme();
  const { tipsMuted } = useAudioSettings();
  
  // Use unified performance system for lifecycle & shimmer optimization
  const perf = useComponentLifecycle('staticTip', 3);
  const shimmerEnabled = perf.shimmerEnabled;
  const shimmerSettings = perf.shimmerSettings;
  
  const [tipIndex, setTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrollMinimized, setIsScrollMinimized] = useState(false);
  const soundPlayedRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Scroll detection - sync with navbar scroll behavior
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY && currentScrollY > 15;
      
      if (isScrollingDown) {
        setIsScrollMinimized(true);
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        // Set timeout to restore after 1.5s of no scrolling
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrollMinimized(false);
        }, 1500);
      }
      
      // Restore immediately when at top
      if (currentScrollY < 15) {
        setIsScrollMinimized(false);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      }
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Get theme filter for consistency with navbar
  // Use mobileFilter for both mobile and desktop to ensure consistent theming
  const themeFilter = useMemo(() => activeTheme?.mobileFilter || 'none', [activeTheme?.mobileFilter]);
  
  useEffect(() => {
    if (tipsMuted) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    
    intervalId = setInterval(() => {
      setIsVisible(false);
      timeoutId = setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % MOBILE_HELPER_TIPS.length);
        setIsVisible(true);
        // Play sound only after first render and prevent double play
        if (soundPlayedRef.current) {
          if (!tipsMuted) SoundEffects.tipChange();
        } else {
          soundPlayedRef.current = true;
        }
      }, 250);
    }, 4500);
    
    return () => {
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [tipsMuted]);

  if (tipsMuted) return null;
  
  return (
    <motion.div
      className="fixed z-30 pointer-events-none lg:hidden mobile-helper-optimized"
      animate={{
        top: isScrollMinimized ? 'calc(3.5rem + env(safe-area-inset-top, 0px))' : 'calc(5.5rem + env(safe-area-inset-top, 0px))',
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 450, mass: 0.6 }}
      style={{ 
        right: '1.5rem',
        filter: themeFilter,
        transition: 'filter 0.5s ease-in-out'
      }}
    >
      <motion.div 
        initial={{ opacity: 0, x: 20, scale: 0.9 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20, scale: isVisible ? 1 : 0.9 }}
        transition={{ 
          duration: 0.3,
          ease: [0.34, 1.56, 0.64, 1]
        }}
        className="relative w-fit max-w-[160px] px-2 py-1.5 rounded-lg bg-black/85 backdrop-blur-xl gpu-accelerated overflow-hidden static-tip-shimmer"
        style={{
          border: '1px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.08)'
        }}
      >
        {/* Unified Shimmer - Left to Right using ShimmerLine component */}
        {shimmerEnabled && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div 
              className="shimmer-line shimmer-gpu absolute inset-y-0 left-[-100%] w-[100%]"
              style={{
                background: 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.3), transparent)',
                animationDuration: shimmerSettings.speed === 'slow' ? '5s' : '3s',
              }}
            />
          </div>
        )}
        
        <motion.div 
          className="flex items-center gap-1.5 justify-end relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          {/* Pulse indicator */}
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className="relative flex h-1.5 w-1.5 shrink-0"
          >
            <span 
              className="shimmer-ping absolute inline-flex h-full w-full rounded-full opacity-75" 
              style={{ backgroundColor: '#3b82f6' }}
            />
            <span 
              className="relative inline-flex rounded-full h-1.5 w-1.5" 
              style={{ backgroundColor: '#3b82f6' }}
            />
          </motion.div>
          
          {/* Rotating tip text */}
          <AnimatePresence mode="wait">
            <motion.span 
              key={tipIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ 
                duration: 0.25,
                ease: [0.34, 1.56, 0.64, 1]
              }}
              className="text-[9px] tracking-wide font-medium text-right leading-tight"
              style={{ color: '#93c5fd' }}
            >
              {MOBILE_HELPER_TIPS[tipIndex]}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

MobileStaticHelper.displayName = 'MobileStaticHelper';
