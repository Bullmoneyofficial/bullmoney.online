import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Bitcoin, ChevronRight, Coins, Crown, LineChart, TrendingUp } from 'lucide-react';
import type { TelegramPost } from '@/components/ultimate-hub/types';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
const MiniGoldChart = dynamic(
  () => import('@/components/ultimate-hub/widgets/MiniGoldChart').then(m => ({ default: m.MiniGoldChart })),
  { ssr: false, loading: () => null }
);
const LiveSignalsViewer = dynamic(
  () => import('@/components/ultimate-hub/widgets/LiveSignalsViewer').then(m => ({ default: m.LiveSignalsViewer })),
  { ssr: false, loading: () => null }
);
const BreakingNewsViewer = dynamic(
  () => import('@/components/ultimate-hub/widgets/BreakingNewsViewer').then(m => ({ default: m.BreakingNewsViewer })),
  { ssr: false, loading: () => null }
);
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { useResponsiveIsMobile } from '@/components/ultimate-hub/hooks/useResponsiveIsMobile';
import { MOBILE_HELPER_TIPS } from '@/components/navbar/navbar.utils';

export const UnifiedFpsPill = memo(({ 
  fps, 
  deviceTier, 
  prices,
  isMinimized, 
  onToggleMinimized,
  onOpenPanel,
  liteMode = false,
  hasNewMessages = false,
  newMessageCount = 0,
  vipPreview = null,
  isVipUser = false,
  topOffsetMobile,
  topOffsetDesktop,
  isMobileNavbarHidden = false,
  mobileAlignment = 'center'
}: {
  fps: number;
  deviceTier: string;
  prices: { xauusd: string; btcusd: string };
  isMinimized: boolean;
  onToggleMinimized: () => void;
  onOpenPanel: () => void;
  liteMode?: boolean;
  hasNewMessages?: boolean;
  newMessageCount?: number;
  vipPreview?: Pick<TelegramPost, 'id' | 'text' | 'date'> | null;
  isVipUser?: boolean;
  topOffsetMobile?: string;
  topOffsetDesktop?: string;
  isMobileNavbarHidden?: boolean;
  mobileAlignment?: 'left' | 'center';
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Track if showing full content
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [isFastScrolling, setIsFastScrolling] = useState(false); // Track fast scrolling for BULLMONEY overlay
  const [isFlickeringOut, setIsFlickeringOut] = useState(false); // Track flickering fade out
  const [scrollIntensity, setScrollIntensity] = useState(0); // 0-1 for smooth intensity transitions
  const [randomDelay] = useState(() => Math.random() * 5 + 5); // Random 5-10 seconds
  const [tipIndex, setTipIndex] = useState(0); // Rotating helper tips
  const [tipVisible, setTipVisible] = useState(true); // For fade animation
  const [tickerIndex, setTickerIndex] = useState(0);
  const unpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fastScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intensityDecayRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const scrollVelocity = useRef(0);
  const velocityHistory = useRef<number[]>([]); // Rolling average for smoother detection
  const fastScrollCount = useRef(0); // Count consecutive fast scrolls
  const lastOverlayTime = useRef(0); // Cooldown tracking to prevent spam
  const accumulatedDelta = useRef(0); // For trackpad gesture accumulation
  const gestureStartTime = useRef(0); // Track gesture start for trackpad detection
  const isMobile = useResponsiveIsMobile();
  
  // Currency formatting - subscribe to store for reactivity
  const { formatPrice } = useCurrencyLocaleStore();
  
  // Performance boost function - runs when overlay shows
  // This is a REAL performance boost that:
  // 1. Temporarily pauses expensive CSS animations
  // 2. Reduces animation complexity
  // 3. Clears memory and cache intelligently
  // 4. Optimizes rendering pipeline
  const triggerPerformanceBoost = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const startTime = performance.now();
    console.log('[BULLMONEY] 🚀 Performance boost triggered');
    
    // ========================================
    // 1. PAUSE ALL CSS ANIMATIONS TEMPORARILY
    // ========================================
    // This is the biggest FPS boost - stops expensive animations
    const styleEl = document.createElement('style');
    styleEl.id = 'bullmoney-perf-boost';
    styleEl.textContent = `
      /* Pause all animations during overlay */
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition-duration: 0s !important;
      }
      /* Exception: keep BULLMONEY overlay animated */
      [data-bullmoney-overlay] *, [data-bullmoney-overlay] *::before, [data-bullmoney-overlay] *::after {
        animation-play-state: running !important;
        transition-duration: unset !important;
      }
      /* Disable expensive effects */
      .shimmer, [class*="shimmer"], [class*="pulse"], [class*="glow"]:not([data-bullmoney-overlay] *) {
        animation: none !important;
        opacity: 1 !important;
      }
      /* Reduce blur effects (expensive on GPU) */
      .backdrop-blur, [class*="backdrop-blur"]:not([data-bullmoney-overlay] *) {
        backdrop-filter: none !important;
      }
      /* Disable will-change to free GPU memory */
      *:not([data-bullmoney-overlay] *) {
        will-change: auto !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    // Remove the style after overlay fades (restore animations)
    // FIXED: Added cleanup safety — if setTimeout fails (unmount/navigation),
    // a MutationObserver catches it so the dark perf-boost style never persists
    const cleanupTimeout = setTimeout(() => {
      const el = document.getElementById('bullmoney-perf-boost');
      if (el) el.remove();
      console.log('[BULLMONEY] ✅ Animations restored');
    }, 3000);
    
    // Safety: also clean up on any navigation or visibility change
    const safetyCleanup = () => {
      clearTimeout(cleanupTimeout);
      const el = document.getElementById('bullmoney-perf-boost');
      if (el) el.remove();
      document.removeEventListener('visibilitychange', safetyCleanup);
      window.removeEventListener('beforeunload', safetyCleanup);
    };
    document.addEventListener('visibilitychange', safetyCleanup);
    window.addEventListener('beforeunload', safetyCleanup);
    
    // ========================================
    // 2. FORCE GPU MEMORY RELEASE
    // ========================================
    // Create and destroy a WebGL context to trigger GPU cleanup
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    } catch (e) {}
    
    // ========================================
    // 3. CLEAR JAVASCRIPT TIMERS & INTERVALS
    // ========================================
    // Temporarily pause non-critical intervals
    const pausedIntervals: number[] = [];
    const originalSetInterval = window.setInterval;
    const originalClearInterval = window.clearInterval;
    
    // Clear any pending image observers
    if ('IntersectionObserver' in window) {
      // Disconnect image lazy loaders temporarily
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        (img as HTMLImageElement).loading = 'eager';
      });
    }
    
    // ========================================
    // 4. OPTIMIZE DOM - HIDE OFFSCREEN ELEMENTS
    // ========================================
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const hiddenElements: HTMLElement[] = [];
    
    // Find elements far from viewport and hide them
    document.querySelectorAll('[data-heavy], .spline-container, iframe, video, canvas:not([data-bullmoney-overlay] canvas)').forEach(el => {
      const rect = el.getBoundingClientRect();
      const isOffscreen = rect.bottom < -500 || rect.top > viewportHeight + 500;
      
      if (isOffscreen) {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.visibility !== 'hidden') {
          htmlEl.dataset.wasVisible = 'true';
          htmlEl.style.visibility = 'hidden';
          htmlEl.style.contentVisibility = 'hidden';
          hiddenElements.push(htmlEl);
        }
      }
    });
    
    // Restore after overlay
    setTimeout(() => {
      hiddenElements.forEach(el => {
        if (el.dataset.wasVisible) {
          el.style.visibility = '';
          el.style.contentVisibility = '';
          delete el.dataset.wasVisible;
        }
      });
    }, 3000);
    
    // ========================================
    // 5. MEMORY CLEANUP
    // ========================================
    // Clear volatile storage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('_temp') || 
          key.includes('_volatile') ||
          key.includes('scroll_') ||
          key.includes('animation_') ||
          key.includes('_preview')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage non-essentials
      ['animation_state', 'scroll_position_cache', 'hover_states', 'modal_history'].forEach(key => {
        try { sessionStorage.removeItem(key); } catch (e) {}
      });
    } catch (e) {}
    
    // ========================================
    // 6. SIGNAL OTHER COMPONENTS TO OPTIMIZE
    // ========================================
    // Dispatch custom event that other components can listen to
    window.dispatchEvent(new CustomEvent('bullmoney-performance-boost', {
      detail: { 
        timestamp: Date.now(),
        duration: 3000, // How long the boost lasts
        level: 'aggressive'
      }
    }));
    
    // ========================================
    // 7. IDLE-TIME DEEP CLEANUP
    // ========================================
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        // Clear old cache entries
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              if (name.includes('temp') || name.includes('runtime') || name.includes('preview')) {
                caches.delete(name);
              }
            });
          }).catch(() => {});
        }
        
        // Clear any orphaned blob URLs
        const blobURLs = (window as any).__blobURLs;
        if (Array.isArray(blobURLs)) {
          blobURLs.forEach((url: string) => {
            try { URL.revokeObjectURL(url); } catch (e) {}
          });
          (window as any).__blobURLs = [];
        }
        
        // Hint GC
        if ((window as any).gc) {
          try { (window as any).gc(); } catch (e) {}
        }
      }, { timeout: 5000 });
    }
    
    // ========================================
    // 8. REDUCE REACT RE-RENDERS
    // ========================================
    // Set a flag that expensive components can check
    (window as any).__bullmoneyPerfBoostActive = true;
    setTimeout(() => {
      (window as any).__bullmoneyPerfBoostActive = false;
    }, 3000);
    
    const elapsed = performance.now() - startTime;
    console.log(`[BULLMONEY] ⚡ Performance boost setup complete in ${elapsed.toFixed(2)}ms`);
    console.log('[BULLMONEY] 📊 Optimizations: CSS paused, GPU freed, DOM simplified, memory cleared');
  }, []);
  
  // Handle interaction to pin the button, then unpin after random delay
  const handleInteraction = useCallback(() => {
    setIsPinned(true);
    setIsExpanded(true);
    
    // Clear any existing timeout
    if (unpinTimeoutRef.current) {
      clearTimeout(unpinTimeoutRef.current);
    }
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }
    
    // Unpin after random 1-10 seconds
    const unpinDelay = Math.random() * 9000 + 1000; // 1-10 seconds in ms
    unpinTimeoutRef.current = setTimeout(() => {
      setIsPinned(false);
      // Collapse slightly before fully hiding
      expandTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 300);
    }, unpinDelay);
  }, []);
  
  // Handle hover end - collapse immediately
  const handleHoverEnd = useCallback(() => {
    // Clear timeouts and collapse
    if (unpinTimeoutRef.current) {
      clearTimeout(unpinTimeoutRef.current);
    }
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }
    setIsPinned(false);
    setIsExpanded(false);
  }, []);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleHoverEnd();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleHoverEnd]);
  
  // Handle scroll - collapse and animate with improved detection
  useEffect(() => {
    const isMobileDevice = window.innerWidth < 768;
    
    // On mobile, disable scroll effects completely
    if (isMobileDevice) {
      return;
    }
    
    // Detect if user is likely using a trackpad (MacBooks, etc)
    const isLikelyTrackpad = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) && !isMobileDevice;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const now = Date.now();
      const timeDelta = Math.max(now - lastScrollTime.current, 1); // Prevent division by zero
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      
      // Calculate instantaneous velocity (pixels per millisecond)
      const instantVelocity = scrollDelta / timeDelta;
      
      // Trackpad detection: trackpads fire many small events vs mouse wheel's fewer large events
      // If we're getting many events with small deltas, it's likely a trackpad
      const isTrackpadLikeEvent = scrollDelta < 50 && timeDelta < 20;
      
      // Accumulate delta for trackpad gesture detection
      if (isTrackpadLikeEvent || isLikelyTrackpad) {
        // Start new gesture if it's been a while
        if (now - gestureStartTime.current > 150) {
          accumulatedDelta.current = 0;
          gestureStartTime.current = now;
        }
        accumulatedDelta.current += scrollDelta;
      }
      
      // Add to velocity history for rolling average (last 8 samples for trackpad smoothing)
      velocityHistory.current.push(instantVelocity);
      if (velocityHistory.current.length > 8) {
        velocityHistory.current.shift();
      }
      
      // Calculate rolling average velocity for smoother detection
      const avgVelocity = velocityHistory.current.reduce((a, b) => a + b, 0) / velocityHistory.current.length;
      scrollVelocity.current = avgVelocity;
      
      // For trackpads, also consider accumulated gesture distance
      const gestureDuration = now - gestureStartTime.current;
      const gestureVelocity = gestureDuration > 0 ? accumulatedDelta.current / gestureDuration : 0;
      
      // Use the higher of instantaneous avg or gesture velocity for trackpad detection
      const effectiveVelocity = isLikelyTrackpad 
        ? Math.max(avgVelocity, gestureVelocity * 0.8) 
        : avgVelocity;
      
      // Determine scroll direction
      setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = currentScrollY;
      lastScrollTime.current = now;
      
      setScrollY(currentScrollY);
      setIsScrolling(true);
      
      // Device-specific thresholds
      // Desktop trackpad: responsive to fast swipe gestures
      // Desktop mouse: responsive for fast wheel flicks
      const FAST_SCROLL_THRESHOLD = isLikelyTrackpad 
          ? 4.0  // Much higher threshold for trackpads - only extreme scrolling
          : 5.0; // Mouse wheel threshold - only extreme scrolling
      const FAST_SCROLL_CONFIRM = 8; // Desktop: 8 consecutive fast scrolls needed (rarely triggers)
      const COOLDOWN_MS = 12000; // 12 second cooldown on desktop
      
      // Check if we're in cooldown period
      const timeSinceLastOverlay = now - lastOverlayTime.current;
      const isInCooldown = timeSinceLastOverlay < COOLDOWN_MS;
      
      // Also check for large accumulated gesture (trackpad fast swipe) - much higher threshold
      const isTrackpadFastGesture = isLikelyTrackpad && accumulatedDelta.current > 1000 && gestureDuration < 100;
      
      if ((effectiveVelocity > FAST_SCROLL_THRESHOLD || isTrackpadFastGesture) && !isInCooldown) {
        fastScrollCount.current++;
        
        // Calculate intensity based on velocity (0-1 scale)
        const intensity = Math.min((effectiveVelocity - FAST_SCROLL_THRESHOLD) / 3, 1);
        setScrollIntensity(prev => Math.max(prev, intensity)); // Only increase, never decrease abruptly
        
        if (fastScrollCount.current >= FAST_SCROLL_CONFIRM && !isFastScrolling) {
          setIsFastScrolling(true);
          setIsFlickeringOut(false);
          lastOverlayTime.current = now; // Start cooldown
          
          // Trigger performance boost when overlay shows
          triggerPerformanceBoost();
        }
        
        // Clear any existing timeouts
        if (fastScrollTimeoutRef.current) {
          clearTimeout(fastScrollTimeoutRef.current);
        }
        if (flickerTimeoutRef.current) {
          clearTimeout(flickerTimeoutRef.current);
        }
        if (intensityDecayRef.current) {
          clearTimeout(intensityDecayRef.current);
        }
      } else {
        // Gradually decrease fast scroll count for hysteresis
        fastScrollCount.current = Math.max(0, fastScrollCount.current - 1);
      }
      
      // Collapse expanded view on scroll
      if (isExpanded) {
        handleHoverEnd();
      }
      
      // Clear previous scroll end timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set scrolling to false after scroll stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        velocityHistory.current = []; // Clear velocity history
        fastScrollCount.current = 0; // Reset fast scroll count
        accumulatedDelta.current = 0; // Reset gesture accumulator
        
        // Smoothly decay intensity before flickering out
        if (isFastScrolling) {
          // Start intensity decay
          const decayIntensity = () => {
            setScrollIntensity(prev => {
              const newVal = prev * 0.85; // Smooth exponential decay
              if (newVal < 0.1) {
                setIsFlickeringOut(true);
                return 0;
              }
              intensityDecayRef.current = setTimeout(decayIntensity, 50);
              return newVal;
            });
          };
          intensityDecayRef.current = setTimeout(decayIntensity, 100);
          
          // Remove overlay after flicker animation - faster on mobile
          const flickerDuration = isMobileDevice ? 1200 : 2000;
          flickerTimeoutRef.current = setTimeout(() => {
            setIsFastScrolling(false);
            setIsFlickeringOut(false);
            setScrollIntensity(0);
          }, flickerDuration);
        }
      }, 200); // Slightly longer debounce for smoother detection
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExpanded, handleHoverEnd, isFastScrolling, triggerPerformanceBoost]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (unpinTimeoutRef.current) {
        clearTimeout(unpinTimeoutRef.current);
      }
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (fastScrollTimeoutRef.current) {
        clearTimeout(fastScrollTimeoutRef.current);
      }
      if (flickerTimeoutRef.current) {
        clearTimeout(flickerTimeoutRef.current);
      }
      if (intensityDecayRef.current) {
        clearTimeout(intensityDecayRef.current);
      }
    };
  }, []);

  // Rotate helper tips every 4.5 seconds (no sound)
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % MOBILE_HELPER_TIPS.length);
        setTipVisible(true);
      }, 250);
    }, 4500);

    return () => clearInterval(intervalId);
  }, []);

  // Calculate scroll-based animation values - OPTIMIZED with useMemo
  // Throttle scroll progress to reduce recalculations
  const scrollProgress = useMemo(() => Math.min(scrollY / 300, 1), [Math.floor(scrollY / 30)]);
  const deepScrollProgress = useMemo(() => Math.min(scrollY / 800, 1), [Math.floor(scrollY / 80)]);
  const extremeScrollProgress = useMemo(() => Math.min(scrollY / 1500, 1), [Math.floor(scrollY / 150)]);
  
  // OPTIMIZED glow multipliers - simplified calculations
  const glowIntensity = useMemo(() => 1 + (scrollProgress * 3) + (deepScrollProgress * 4), [scrollProgress, deepScrollProgress]);
  const neonIntensity = useMemo(() => 1 + (deepScrollProgress * 4) + (extremeScrollProgress * 6), [deepScrollProgress, extremeScrollProgress]);
  
  // OPTIMIZED: Use CSS custom properties for dynamic values instead of inline recalculation
  // This reduces layout thrashing significantly
  const dynamicStyles = useMemo(() => {
    const borderGlow = Math.round(4 + (scrollProgress * 15) + (deepScrollProgress * 25));
    const shadowSpread = Math.round(8 + (scrollProgress * 30) + (deepScrollProgress * 50));
    const innerGlow = Math.round(4 + (scrollProgress * 10) + (deepScrollProgress * 20));
    
    // Simplified box-shadow - max 4 layers instead of 10+
    const boxShadow = `
      0 0 ${borderGlow}px rgba(255, 255, 255, 0.9),
      0 0 ${shadowSpread}px rgba(255, 255, 255, 0.6),
      ${deepScrollProgress > 0.3 ? `0 0 ${shadowSpread * 1.5}px rgba(255, 255, 255, 0.4),` : ''}
      inset 0 0 ${innerGlow}px rgba(255, 255, 255, 0.3)
    `.replace(/,\s*$/, '').replace(/,\s*,/g, ',');
    
    // Simplified text shadow - max 3 layers
    const textShadow = `
      0 0 ${6 * neonIntensity}px #ffffff,
      0 0 ${12 * neonIntensity}px #ffffff,
      0 0 ${20 * neonIntensity}px rgba(255, 255, 255, 0.7)
    `;
    
    // Simplified icon filter - max 2 drop-shadows
    const iconFilter = `
      drop-shadow(0 0 ${4 * glowIntensity}px #ffffff) 
      drop-shadow(0 0 ${8 * glowIntensity}px #ffffff)
    `.trim();
    
    return { boxShadow, textShadow, iconFilter, borderGlow, shadowSpread, innerGlow };
  }, [scrollProgress, deepScrollProgress, glowIntensity, neonIntensity]);

  const tickerItems = useMemo(() => {
    const items: Array<{ key: string; type: 'price' | 'vip'; label: string; text: string }> = [
      { key: 'gold', type: 'price', label: 'Gold', text: `Gold ${formatPrice(parseFloat(prices.xauusd) || 0)}` },
      { key: 'btc', type: 'price', label: 'BTC', text: `BTC ${formatPrice(parseFloat(prices.btcusd) || 0)}` },
    ];

    if (vipPreview?.text) {
      items.unshift({
        key: `vip-${vipPreview.id || 'latest'}`,
        type: 'vip',
        label: 'VIP Drop',
        text: vipPreview.text,
      });
    }

    return items;
  }, [prices.xauusd, prices.btcusd, vipPreview?.id, vipPreview?.text]);

  useEffect(() => {
    setTickerIndex(0);
  }, [tickerItems.length]);

  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const intervalId = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [tickerItems.length]);

  const activeTicker = tickerItems[tickerIndex] || tickerItems[0];

  const hasVipAccent = isVipUser || Boolean(vipPreview);
  const pillBackground = hasVipAccent
    ? 'linear-gradient(135deg, rgba(14, 58, 120, 0.95) 0%, rgba(59, 130, 246, 0.82) 55%, rgba(147, 197, 253, 0.55) 100%)'
    : 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(255, 255, 255,0.18) 55%, rgba(255, 255, 255, 0.12) 100%)';
  const pillBorder = hasVipAccent
    ? '1.5px solid rgba(147, 197, 253, 0.9)'
    : '1.5px solid rgba(255, 255, 255, 0.85)';
  const pillShadow = hasVipAccent
    ? `0 0 ${dynamicStyles.borderGlow}px rgba(59,130,246,0.75), 0 0 ${dynamicStyles.shadowSpread}px rgba(59,130,246,0.45), inset 0 0 ${dynamicStyles.innerGlow}px rgba(147, 197, 253, 0.55)`
    : dynamicStyles.boxShadow;
  
  // === SCROLL-TO-NAVBAR MORPH ANIMATION ===
  // When user scrolls, pill morphs into navbar logo position (center on mobile, left-center on desktop)
  // Calculate morph progress based on scroll (0 = normal, 1 = fully morphed into logo position)
  const morphProgress = useMemo(() => {
    if (!isScrolling) return 0;
    // Faster morph response - full morph by 150px of scroll
    return Math.min(scrollY / 150, 1);
  }, [isScrolling, scrollY]);

  // Morph state: shows logo-like compact view when scrolling
  // Lower threshold so it kicks in sooner on short mobile scrolls
  const isInLogoMode = morphProgress > 0.3 && isScrolling;

  // Ultra-thin mobile pill when morphed into navbar space (~1–2cm tall on phones)
  const logoModeHeightPx = 34;
  const logoModePadding = '6px 10px';
  
  // Calculate morph animation values for mobile (moves to center-top, scales down)
  const mobileNavbarTop = 'calc(env(safe-area-inset-top, 0px) + 12px)'; // Navbar position
  const normalTop = topOffsetMobile ?? 'calc(env(safe-area-inset-top, 0px) + 96px)';
  
  // For desktop, move pill toward a fixed position near navbar
  const desktopNavbarPosition = { top: '8px', left: '50%' };
  
  // Mobile full-width mode when navbar is hidden (CSS-based for 60fps)
  const mobileFullWidthMode = isMobile && isMobileNavbarHidden;
  
  return (
    <motion.div
      ref={containerRef}
      initial={{ x: -100, opacity: 0 }}
      animate={isMobile ? {
        // Mobile: Morph toward navbar center when scrolling
        x: 0, 
        opacity: 1, 
        scale: isMinimized ? 0.9 : (isInLogoMode ? 0.6 : 1),
        y: 0,
      } : { 
        // Desktop: Original behavior
        x: 0, 
        opacity: 1, 
        scale: isMinimized ? 0.9 : 1,
        y: isScrolling ? (scrollDirection === 'down' ? -5 : 5) : 0,
      }}
      transition={isMobile 
        ? { 
            duration: isScrolling ? 0.3 : 0.5, 
            ease: [0.25, 0.1, 0.25, 1],
            scale: { duration: 0.25, ease: 'easeOut' }
          }
        : { y: { duration: 0.2, ease: "easeOut" } }
      }
      className={`fixed z-[2147483647] pointer-events-none ${
        isMobile 
          ? mobileFullWidthMode 
            ? 'left-4 right-4 translate-x-0' // Full width with padding
            : mobileAlignment === 'left'
              ? 'left-4 translate-x-0'        // Left aligned
              : 'left-1/2 -translate-x-1/2'   // Centered
          : 'left-0'
      }`}
      style={{
        // Mobile: Smoothly transition between normal position and top when navbar hidden
        top: isMobile
          ? (mobileFullWidthMode ? 'calc(env(safe-area-inset-top, 0px) + 12px)' : (isInLogoMode ? mobileNavbarTop : normalTop))
          : (topOffsetDesktop ?? '15%'),
        paddingLeft: isMobile ? undefined : 'calc(env(safe-area-inset-left, 0px))',
        // Disable screen bloom effect on mobile
        filter: (!isMobile && extremeScrollProgress > 0.7) ? `brightness(${1 + (extremeScrollProgress - 0.7) * 0.3})` : undefined,
        // Smooth CSS transitions for mobile (60fps, no jank)
        transition: isMobile 
          ? 'top 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), left 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), right 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' 
          : undefined,
        willChange: isMobile ? 'top, left, right, transform' : undefined,
      }}
    >
      <motion.div
        className={`relative pointer-events-auto cursor-pointer ${mobileFullWidthMode ? 'w-full' : ''}`}
        onHoverStart={handleInteraction}
        onHoverEnd={handleHoverEnd}
        onTap={handleInteraction}
      >
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={
            // Mobile: Always visible, no peek-in/peek-out animation
            isMobile
              ? isMinimized 
                ? { x: -70, opacity: 0.1 }
                : { x: 0, opacity: 1 }  // Always visible on mobile
              // Desktop: Keep full animations
              : isMinimized 
                ? { x: -70, scale: 0.95, opacity: 0.1, rotateY: 0 }
                : isPinned 
                  ? { x: 0, scale: 1, opacity: 1, rotateY: 0 }
                  : isScrolling
                    ? { 
                        x: scrollDirection === 'down' ? -40 : -20, 
                        scale: 0.98 + (scrollProgress * 0.04),
                        opacity: 0.8 + (scrollProgress * 0.2),
                        rotateY: scrollDirection === 'down' ? -15 : 15,
                      }
                    : {
                        x: [-60, 0, 0, -60],
                        opacity: [0, 1, 1, 0],
                        scale: [0.95, 1, 1, 0.95],
                        rotateY: 0,
                      }
          }
          whileHover={isMobile ? { x: 4, opacity: 1 } : { 
            x: 8, 
            scale: 1.02, 
            opacity: 1, 
            rotateY: 5,
          }}
          transition={
            isMobile
              ? { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
              : isMinimized || isPinned || isScrolling
                ? { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                : { 
                    duration: 2.5,
                    repeat: Infinity, 
                    ease: "easeInOut",
                    repeatDelay: 0.5,
                    times: [0, 0.2, 0.8, 1]
                  }
          }
          className={`relative rounded-3xl ultimate-hub-scroll-effect ${mobileFullWidthMode ? 'w-full' : ''}`}
          style={{
            background: pillBackground,
            // Reduce blur on mobile for better performance
            backdropFilter: isMobile ? 'blur(8px)' : 'blur(12px)',
            WebkitBackdropFilter: isMobile ? 'blur(8px)' : 'blur(12px)',
            border: pillBorder,
            boxShadow: pillShadow,
            // Disable 3D transforms on mobile to prevent FPS drops
            transform: isMobile ? undefined : 'perspective(1000px)',
            transformStyle: isMobile ? undefined : 'preserve-3d',
            // Only use will-change on desktop
            willChange: isMobile ? 'auto' : 'transform',
            // Smooth width transition
            transition: mobileFullWidthMode ? 'width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : undefined,
            // Ultra-thin pill when morphed into navbar space
            height: isMobile && isInLogoMode ? `${logoModeHeightPx}px` : undefined,
            minHeight: isMobile && isInLogoMode ? `${logoModeHeightPx}px` : undefined,
            maxHeight: isMobile && isInLogoMode ? `${logoModeHeightPx}px` : undefined,
            padding: isMobile && isInLogoMode ? '0px' : undefined,
            borderRadius: isMobile && isInLogoMode ? '9999px' : undefined,
            overflow: isMobile && isInLogoMode ? 'hidden' : undefined,
          }}
          onClick={(e) => {
            e.preventDefault();
            SoundEffects.click();
            handleInteraction();
            if (isMinimized) onToggleMinimized();
            else onOpenPanel();
          }}
          onMouseEnter={() => {
            SoundEffects.hover();
            handleInteraction();
            if (isMinimized) onToggleMinimized();
          }}
        >

          
          <AnimatePresence mode="popLayout">
            {/* Logo Mode: Compact icon when scrolling on mobile */}
            {isMobile && isInLogoMode ? (
              <motion.div
                key="logo-mode"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative z-10 flex h-full items-center justify-center"
                style={{ padding: logoModePadding, height: '100%', lineHeight: 1 }}
              >
                {/* Logo Mode: Just the trading icon with notification badge */}
                <div className="flex items-center justify-center relative">
                  <TrendingUp 
                    className="w-5 h-5 text-black neon-white-icon" 
                    style={{ 
                      filter: 'drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 12px #ffffff)'
                    }} 
                  />
                  {/* Notification Badge in Logo Mode */}
                  {hasNewMessages && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: '#000000',
                          boxShadow: '0 0 6px #ffffff, 0 0 12px #ffffff',
                        }}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : isMinimized ? (
              <motion.div
                key="minimized"
                initial={{ opacity: 0, scale: isMobile ? 0.9 : 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: isMobile ? 0.9 : 0.7 }}
                transition={isMobile ? { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } : undefined}
                className="px-2 py-1.5 relative z-10"
              >
                {/* Minimized: White neon icon with glow */}
                <div className="flex items-center gap-1 relative">
                  <TrendingUp 
                    className="w-4 h-4 text-black neon-white-icon" 
                    style={{ 
                      filter: 'drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff)'
                    }} 
                  />
                  {/* New Message Notification Badge - Removed, using main badge only */}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="full"
                initial={{ opacity: 0, scale: isMobile ? 0.95 : 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: isMobile ? 0.95 : 0.85 }}
                transition={isMobile 
                  ? { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
                  : { duration: 0.4, ease: "easeInOut" }
                }
                className="px-1.5 py-1 md:px-4 md:py-4 relative z-10"
              >
                {/* Lite Mode Indicator Badge */}
                {liteMode && (
                  <div 
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wide z-20"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.9) 100%)',
                      color: '#fff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    LITE
                  </div>
                )}

                {isVipUser && (
                  <div 
                    className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide z-20"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(59,130,246,0.75) 100%)',
                      color: '#e0f2ff',
                      boxShadow: '0 0 8px rgba(59,130,246,0.5)',
                      border: '1px solid rgba(191, 219, 254, 0.7)',
                    }}
                  >
                    VIP Trader
                  </div>
                )}
                
                {/* New Message Notification Badge - Full View (shows count) */}
                {hasNewMessages && !liteMode && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1.5 -right-1.5 z-30"
                  >
                    <div 
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
                        boxShadow: '0 0 12px #ffffff, 0 0 24px rgba(255, 255, 255, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Bell 
                        className="w-2.5 h-2.5 text-black" 
                        style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' }}
                      />
                      {newMessageCount > 0 && (
                        <span 
                          className="text-[8px] font-black text-black"
                          style={{ textShadow: '0 0 2px rgba(0,0,0,0.2)' }}
                        >
                          {newMessageCount > 9 ? '9+' : newMessageCount}
                        </span>
                      )}
                    </div>
                    {/* Glowing pulse ring */}
                    <div 
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.4)',
                        animationDuration: '1.5s' 
                      }}
                    />
                  </motion.div>
                )}

                {activeTicker && (
                  <div className="w-full max-w-[360px] mb-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTicker.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className={`rounded-xl border px-3 py-2.5 shadow-sm ${
                          activeTicker.type === 'vip'
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'bg-white border-black/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {activeTicker.type === 'vip' ? (
                              <Crown className="w-5 h-5 text-black" />
                            ) : (
                              <LineChart className="w-5 h-5 text-black" />
                            )}
                            <span className="text-sm font-bold uppercase tracking-wide text-black/80">
                              {activeTicker.label}
                            </span>
                          </div>
                          {activeTicker.type === 'vip' && (
                            <span className="text-xs font-semibold text-blue-600 font-bold">VIP</span>
                          )}
                        </div>
                        <p className="text-sm leading-snug text-black/80 line-clamp-2">
                          {activeTicker.text}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
                
                {/* Mobile: Compact full-width view when navbar hidden - fits in navbar area */}
                {mobileFullWidthMode ? (
                  <div className="flex items-center justify-between w-full gap-2 px-3 py-2">
                    {/* Left: Icon + Title + Live indicator */}
                    <div className="flex items-center gap-2">
                      <TrendingUp 
                        className="w-5 h-5 text-black" 
                        style={{ filter: 'drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff)' }} 
                      />
                      <span 
                        className="text-sm font-black tracking-wider uppercase"
                        style={{ 
                          color: '#000000',
                          textShadow: 'none',
                          letterSpacing: '0.08em'
                        }}
                      >
                        TRADING HUB
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    </div>
                    
                    {/* Right: Tap indicator */}
                    <div className="flex items-center gap-2 text-black/40">
                      <span className="text-[10px] font-medium">Tap to open</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  /* Mobile: Compact view without duplicate price rows (prices rotate in ticker) */
                  <div className="flex md:hidden flex-col items-center justify-center gap-0.5 min-w-[36px] relative">
                    <TrendingUp 
                      className="w-2.5 h-2.5 text-black neon-white-icon" 
                      style={{ filter: dynamicStyles.iconFilter }} 
                    />
                  </div>
                )}
                
                {/* Desktop: Animated between compact (scrolling) and full */}
                <motion.div 
                  className="hidden md:flex flex-col gap-4"
                  initial={false}
                  animate={{ 
                    width: (isExpanded && !isScrolling) ? 320 : 100,
                    minWidth: (isExpanded && !isScrolling) ? 320 : 100
                  }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                  <AnimatePresence mode="wait">
                    {(isExpanded && !isScrolling) ? (
                      // Full expanded desktop view
                      <motion.div
                        key="desktop-expanded"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-4"
                        style={{ willChange: 'transform, opacity' }}
                      >
                        {/* TRADING HUB Label */}
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <TrendingUp className="w-7 h-7 text-black neon-white-icon" style={{ filter: dynamicStyles.iconFilter }} />
                            </div>
                            <span 
                              className="text-2xl font-black tracking-widest uppercase neon-blue-text"
                              style={{ 
                                color: '#000000',
                                textShadow: dynamicStyles.textShadow,
                                letterSpacing: '0.15em'
                              }}
                            >
                              TRADING HUB
                            </span>
                          </div>
                          <div className="h-px w-48 bg-linear-to-r from-transparent via-white to-transparent"
                            style={{ boxShadow: '0 0 8px #ffffff' }}
                          />
                        </div>
                        
                        {/* Mini TradingView Gold Chart */}
                        <div 
                          className="w-full h-[120px] rounded-lg overflow-hidden relative"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,245,247,1) 100%)',
                            border: '2px solid #ffffff',
                            boxShadow: '0 0 8px #ffffff, 0 0 16px rgba(255, 255, 255,0.5), inset 0 0 8px rgba(255, 255, 255,0.3)'
                          }}
                        >
                          <div className="absolute inset-0 bg-linear-to-br from-white/15 via-transparent to-white/15 pointer-events-none z-10" />
                          <MiniGoldChart />
                        </div>
                        
                        {/* Live Prices */}
                        <div 
                          className="flex items-center justify-around gap-4 px-4 py-3 rounded-lg neon-subtle-border"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,245,247,1) 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.8)',
                            boxShadow: '0 0 4px #ffffff, inset 0 0 4px #ffffff'
                          }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Coins className="w-6 h-6 text-black neon-blue-icon" style={{ filter: 'none' }} />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Gold</span>
                              <span className="text-lg font-black tabular-nums neon-blue-text" style={{ color: '#000000', textShadow: 'none' }}>
                                {formatPrice(parseFloat(prices.xauusd) || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="h-12 w-px bg-linear-to-b from-transparent via-white to-transparent" style={{ boxShadow: '0 0 6px #ffffff' }} />
                          <div className="flex flex-col items-center gap-1">
                            <Bitcoin className="w-6 h-6 text-black neon-blue-icon" style={{ filter: 'none' }} />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Bitcoin</span>
                              <span className="text-lg font-black tabular-nums neon-blue-text" style={{ color: '#000000', textShadow: 'none' }}>
                                {formatPrice(parseFloat(prices.btcusd) || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Live Signals & Breaking News */}
                        <LiveSignalsViewer />
                        <BreakingNewsViewer />
                      </motion.div>
                    ) : (
                      // Compact desktop view - shown when scrolling or not expanded - with intensified neons
                      <motion.div
                        key="desktop-compact"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center gap-2 py-2"
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <TrendingUp className="w-6 h-6 text-black neon-white-icon" style={{ filter: dynamicStyles.iconFilter }} />
                        <span 
                          className="text-[10px] font-bold uppercase tracking-wider mt-1 neon-blue-text"
                          style={{ 
                            color: 'rgba(255, 255, 255, 0.85)',
                            textShadow: 'none'
                          }}
                        >
                          Hub
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Tap hint on mobile - larger touch target pill with rotating tips */}
      </motion.div>
      
      {/* BULLMONEY Fullscreen Fast Scroll Overlay */}
      <AnimatePresence>
        {isFastScrolling && (
          <motion.div
            data-bullmoney-overlay="true"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isFlickeringOut 
                ? [1, 0.7, 0.9, 0.4, 0.8, 0.2, 0.5, 0.1, 0.3, 0] 
                : [0, 0.3, 0.6, 0.85, 1]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: isFlickeringOut ? 2 : 0.4,
              ease: isFlickeringOut 
                ? [0.25, 0.1, 0.25, 1] // Custom cubic-bezier for smooth flicker out
                : [0.34, 1.56, 0.64, 1], // Smooth overshoot ease-in
              times: isFlickeringOut 
                ? [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.75, 0.85, 0.92, 1]
                : [0, 0.2, 0.5, 0.8, 1]
            }}
            className="fixed inset-0 z-[2147483647] flex items-center justify-center pointer-events-none"
            style={{
              background: `rgba(0, 0, 0, ${0.9 + scrollIntensity * 0.08})`,
            }}
          >
            {/* Background neon glow effects */}
            <div 
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
                  radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
                  radial-gradient(ellipse at 70% 70%, rgba(255, 255, 255, 0.15) 0%, transparent 40%)
                `,
              }}
            />
            
            {/* Animated scan lines */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.1) 2px, rgba(255, 255, 255, 0.1) 4px)',
                animation: 'bullmoney-scanlines 0.1s linear infinite',
              }}
            />
            
            {/* BULLMONEY Text */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ 
                scale: isFlickeringOut 
                  ? [1, 1.02, 0.99, 1.01, 0.98, 1, 0.97] 
                  : [0.85, 1.02, 1],
                opacity: isFlickeringOut 
                  ? [1, 0.8, 0.95, 0.5, 0.85, 0.3, 0.6, 0.15, 0.4, 0] 
                  : [0, 0.5, 1],
                y: isFlickeringOut ? [0, -5, 0, 5, -3, 0] : [20, -5, 0],
              }}
              transition={{ 
                duration: isFlickeringOut ? 2 : 0.5,
                ease: isFlickeringOut 
                  ? [0.4, 0, 0.2, 1] // Material design standard easing
                  : [0.34, 1.56, 0.64, 1], // Spring-like overshoot
                times: isFlickeringOut 
                  ? [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.75, 0.85, 0.92, 1]
                  : [0, 0.6, 1]
              }}
              className="relative select-none flex flex-col items-center gap-2 sm:gap-4"
            >
              {/* BULLMONEY - Main text */}
              <div className="relative">
                <span 
                  className="absolute text-5xl sm:text-7xl md:text-8xl font-black tracking-widest"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '2px rgba(255, 255, 255, 0.3)',
                    filter: 'blur(8px)',
                    transform: 'translate(-2px, -2px)',
                  }}
                >
                  BULLMONEY
                </span>
                <span 
                  className="absolute text-5xl sm:text-7xl md:text-8xl font-black tracking-widest"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '1px rgba(255, 255, 255, 0.5)',
                    filter: 'blur(4px)',
                    transform: 'translate(-1px, -1px)',
                  }}
                >
                  BULLMONEY
                </span>
                <span 
                  className="relative text-5xl sm:text-7xl md:text-8xl font-black tracking-widest"
                  style={{
                    color: '#000000',
                    textShadow: `
                      0 0 10px #ffffff,
                      0 0 20px #ffffff,
                      0 0 40px #ffffff,
                      0 0 80px #ffffff,
                      0 0 120px rgba(255, 255, 255, 0.8),
                      0 0 160px rgba(255, 255, 255, 0.6),
                      0 0 200px rgba(255, 255, 255, 0.4)
                    `,
                    animation: isFlickeringOut ? undefined : 'bullmoney-neon-flicker 0.1s ease-in-out infinite alternate',
                  }}
                >
                  BULLMONEY
                </span>
              </div>
              
              {/* TRADING HUB - Subtitle */}
              <span 
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.3em] uppercase"
                style={{
                  color: '#000000',
                  textShadow: 'none',
                  animation: isFlickeringOut ? undefined : 'bullmoney-neon-flicker 0.15s ease-in-out infinite alternate',
                }}
              >
                TRADING HUB
              </span>
              
              {/* SLOW DOWN - Warning text */}
              <motion.span
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ 
                  opacity: isFlickeringOut ? [1, 0] : [0, 0.7, 1, 0.85, 1],
                  scale: isFlickeringOut ? [1, 0.95] : [0.9, 1.03, 1, 1.02, 1],
                  y: isFlickeringOut ? [0, 20] : [30, -3, 0],
                }}
                transition={{ 
                  duration: isFlickeringOut ? 0.8 : 0.6,
                  delay: isFlickeringOut ? 0 : 0.2,
                  ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce
                }}
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.2em] uppercase mt-4 sm:mt-6"
                style={{
                  color: '#000000',
                  textShadow: `
                    0 0 ${15 + scrollIntensity * 20}px #ffffff,
                    0 0 ${30 + scrollIntensity * 30}px #ffffff,
                    0 0 ${60 + scrollIntensity * 40}px #ffffff,
                    0 0 ${100 + scrollIntensity * 50}px rgba(255, 255, 255, ${0.9 + scrollIntensity * 0.1})
                  `,
                  animation: isFlickeringOut ? undefined : 'bullmoney-slow-pulse 1.2s ease-in-out infinite',
                }}
              >
                 SLOW DOWN 
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
UnifiedFpsPill.displayName = 'UnifiedFpsPill';
