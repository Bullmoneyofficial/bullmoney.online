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
  const [randomDelay] = useState(() => Math.random() * 5 + 5); // Random 5-10 seconds
  const [tipIndex, setTipIndex] = useState(0); // Rotating helper tips
  const [tipVisible, setTipVisible] = useState(true); // For fade animation
  const [tickerIndex, setTickerIndex] = useState(0);
  const unpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const isMobile = useResponsiveIsMobile();
  
  // Currency formatting - subscribe to store for reactivity
  const { formatPrice } = useCurrencyLocaleStore();
  
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
  
  // Handle scroll - collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = currentScrollY;
      lastScrollTime.current = Date.now();
      
      setScrollY(currentScrollY);
      setIsScrolling(true);
      
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
      }, 200);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isExpanded, handleHoverEnd]);
  
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
    </motion.div>
  );
});
UnifiedFpsPill.displayName = 'UnifiedFpsPill';
