import React, { useEffect, useState, useRef, useMemo, memo, useCallback } from 'react';
import { MOBILE_HELPER_TIPS } from './navbar.utils';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';
import { useAudioSettings } from '@/contexts/AudioSettingsProvider';
import { useComponentLifecycle } from '@/lib/UnifiedPerformanceSystem';
import './MobileStaticHelper.css';

export const MobileStaticHelper = memo(() => {
  const { activeTheme } = useGlobalTheme();
  const { tipsMuted } = useAudioSettings();
  
  // Use unified performance system for shimmer optimization
  const perf = useComponentLifecycle('staticTip', 3);
  const shimmerEnabled = perf.shimmerEnabled;
  
  const [tipIndex, setTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrollMinimized, setIsScrollMinimized] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [topPosition, setTopPosition] = useState(192); // Default ~12rem in px
  const soundPlayedRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Space-aware positioning - detect UltimateHub pill and position below it
  useEffect(() => {
    let positionTimeout: NodeJS.Timeout | null = null;
    
    const calculatePosition = () => {
      // Find the UltimateHub pill element
      const ultimateHubPill = document.querySelector('.ultimate-hub-scroll-effect');
      
      if (ultimateHubPill) {
        const rect = ultimateHubPill.getBoundingClientRect();
        // Position 32px below the UltimateHub pill (extra spacing)
        const newTop = rect.bottom + 32;
        // Only update if position changed significantly (prevents micro-flickering)
        setTopPosition(prev => Math.abs(prev - newTop) > 2 ? newTop : prev);
      } else {
        // Fallback: position at 15% + estimated pill height + gap
        const viewportHeight = window.innerHeight;
        const fallbackTop = (viewportHeight * 0.15) + 80 + 32; // 15% + pill height + gap
        setTopPosition(fallbackTop);
      }
    };
    
    // Initial calculation with slight delay to ensure DOM is ready
    const initialTimeout = setTimeout(calculatePosition, 100);
    
    // Debounced recalculation on resize only (not scroll - too frequent)
    const handleResize = () => {
      if (positionTimeout) clearTimeout(positionTimeout);
      positionTimeout = setTimeout(calculatePosition, 150);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      clearTimeout(initialTimeout);
      if (positionTimeout) clearTimeout(positionTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle interaction to pin the helper, then unpin after random delay
  const handleInteraction = useCallback(() => {
    setIsPinned(true);
    
    // Clear any existing timeout
    if (unpinTimeoutRef.current) {
      clearTimeout(unpinTimeoutRef.current);
    }
    
    // Unpin after random 1-10 seconds
    const unpinDelay = Math.random() * 9000 + 1000;
    unpinTimeoutRef.current = setTimeout(() => {
      setIsPinned(false);
    }, unpinDelay);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (unpinTimeoutRef.current) {
        clearTimeout(unpinTimeoutRef.current);
      }
    };
  }, []);
  
  // Scroll detection - sync with navbar scroll behavior
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      
      // Only trigger minimization on significant scroll
      if (scrollDelta > 10) {
        setIsScrollMinimized(true);
        lastScrollY = currentScrollY;
        
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
  const themeFilter = useMemo(() => activeTheme?.mobileFilter || 'none', [activeTheme?.mobileFilter]);
  
  // Rotate tips with sound
  useEffect(() => {
    if (tipsMuted) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    
    intervalId = setInterval(() => {
      setIsVisible(false);
      timeoutId = setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % MOBILE_HELPER_TIPS.length);
        setIsVisible(true);
        // Play sound only after first render
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
    <div
      className={`mobile-static-tip lg:hidden ${isScrollMinimized ? 'mobile-tip-scrolling' : ''}`}
      style={{ 
        filter: themeFilter,
        top: `${topPosition}px`,
      }}
    >
      <div
        className={`mobile-static-tip-container ${isPinned ? 'mobile-tip-pinned' : 'mobile-tip-animate'} ${isVisible ? '' : 'mobile-tip-hidden'}`}
        onMouseEnter={handleInteraction}
        onClick={handleInteraction}
        data-theme-aware
      >
        {/* Shimmer effect */}
        {shimmerEnabled && (
          <div className="mobile-static-tip-shimmer" />
        )}
        
        <div className="mobile-static-tip-content">
          {/* Pulse indicator */}
          <div className="mobile-static-tip-pulse">
            <span className="mobile-static-tip-pulse-ring" />
            <span className="mobile-static-tip-pulse-dot" />
          </div>
          
          {/* Tip text - neon glow */}
          <span 
            key={tipIndex}
            className={`mobile-static-tip-text ${isVisible ? '' : 'tip-fade-out'}`}
          >
            {MOBILE_HELPER_TIPS[tipIndex]}
          </span>
        </div>
      </div>
    </div>
  );
});

MobileStaticHelper.displayName = 'MobileStaticHelper';
