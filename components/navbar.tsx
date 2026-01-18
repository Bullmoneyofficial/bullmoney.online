"use client";
import { cn } from "@/lib/utils";
import { trackEvent, trackClick } from "@/lib/analytics";
import {
  IconMenu2,
  IconX,
  IconPalette,
} from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import React, {
  useEffect,
  useRef,
  useState,
  memo,
  useCallback,
} from "react";
import Link from "next/link";
import Image from "next/image";

import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";

// --- IMPORT CONTEXT ---
import { useStudio } from "@/context/StudioContext";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useCacheContext } from "@/components/CacheManagerProvider";
import { useMobileMenu, useNavbarModals } from "@/contexts/UIStateContext";

// --- IMPORT LAZY MODAL SYSTEM (optimized loading/unloading like ServicesModal) ---
import { 
  LazyAdminModal, 
  LazyAffiliateModal, 
  LazyFaqModal 
} from "./navbar/LazyModalSystem";

// --- IMPORT SOUND EFFECTS ---
import { SoundEffects } from "@/app/hooks/useSoundEffects";

// --- IMPORT SCROLL OPTIMIZATION ---
import { useScrollOptimization } from "@/hooks/useScrollOptimization";

// --- IMPORT MODULAR NAVBAR COMPONENTS ---
import { DesktopNavbar } from "./navbar/DesktopNavbar";
import { MobileStaticHelper } from "./navbar/MobileStaticHelper";
import { MobileDropdownMenu } from "./navbar/MobileDropdownMenu";
import { MovingTradingTip } from "./navbar/MovingTradingTip";
import { ThemeSelectorModal } from "./navbar/ThemeSelectorModal";
// LazyThemeSelectorModal available but ThemeSelectorModal is lightweight enough to use directly
import { NAVBAR_TRADING_TIPS } from "./navbar/navbar.utils";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";

// --- IMPORT UNIFIED SHIMMER SYSTEM ---
import { ShimmerLine, ShimmerBorder, useOptimizedShimmer } from "@/components/ui/UnifiedShimmer";
import { useFpsOptimizer } from "@/lib/FpsOptimizer";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking } from "@/lib/CrashTracker";

// --- IMPORT NAVBAR CSS ---
import "./navbar.css";

// --- MOBILE MENU CONTROLS COMPONENT (Optimized with Unified Shimmer + Theme-Aware) ---
const MobileMenuControls = memo(({ 
  open, 
  onToggle, 
  onThemeClick, 
  hasReward,
  isXMUser,
  shimmerEnabled = true,
  shimmerSettings = { intensity: 'medium' as const, speed: 'normal' as const },
  isScrollMinimized = false,
}: any) => (
  <motion.div 
    className="relative group rounded-full overflow-hidden shadow-2xl z-50 flex items-center flex-grow"
    data-theme-aware
    data-navbar
    animate={{
      height: isScrollMinimized ? 32 : undefined,
      maxWidth: isScrollMinimized ? '7rem' : '100%',
      scale: isScrollMinimized ? 0.85 : 1,
    }}
    transition={{ type: 'spring', damping: 25, stiffness: 450, mass: 0.6 }}
    style={{ 
      height: isScrollMinimized ? 32 : 'auto',
      maxWidth: isScrollMinimized ? '7rem' : 'none',
      transition: 'border-color 0.4s ease-out, box-shadow 0.4s ease-out',
      transitionDelay: '0.35s',
    }}
  >
    {/* UNIFIED SHIMMER - Border glow effect, theme-aware via CSS variables */}
    {shimmerEnabled && !isScrollMinimized && <ShimmerBorder />}
    
    {/* UNIFIED SHIMMER - Background glow effect */}
    {shimmerEnabled && !isScrollMinimized && (
      <div className="shimmer-glow shimmer-gpu absolute inset-0 rounded-full pointer-events-none" />
    )}

    {/* Inner Content Container - Theme-aware borders and shadows */}
    <motion.div 
      className={cn(
        "relative h-full w-full bg-black/95 rounded-full flex items-center justify-center gap-0.5 sm:gap-1 transition-all duration-200 z-10",
        isScrollMinimized ? "p-[1px] px-1" : "p-[2px] px-1 xs:px-1.5 sm:px-2"
      )}
      style={{
        border: '2px solid rgba(var(--accent-rgb, 59, 130, 246), 0.6)',
        boxShadow: '0 0 25px rgba(var(--accent-rgb, 59, 130, 246), 0.3)',
      }}
    >
      {/* Theme Selector Button - With text label */}
      <motion.button
        onClick={() => { SoundEffects.click(); onThemeClick(); }}
        onMouseEnter={() => SoundEffects.hover()}
        onTouchStart={() => SoundEffects.click()}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "rounded-full transition-colors flex items-center justify-center gap-0.5",
          isScrollMinimized 
            ? "p-0.5 min-w-[26px] min-h-[26px]" 
            : "p-0.5 xs:p-1 sm:p-1.5 min-w-[32px] xs:min-w-[36px] sm:min-w-[40px] min-h-[32px] xs:min-h-[36px] sm:min-h-[40px]"
        )}
        style={{ color: 'var(--accent-color, #93c5fd)' }}
        title="Theme Selector"
      >
        <IconPalette className={isScrollMinimized ? "h-2.5 w-2.5" : "h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4"} />
        <span className="text-[7px] xs:text-[8px] sm:text-xs font-bold whitespace-nowrap">Theme</span>
      </motion.button>

      {/* Divider - Theme-aware */}
      <div 
        className={cn(isScrollMinimized ? "h-3 w-[1px]" : "h-4 xs:h-5 w-[1px]")}
        style={{ background: 'linear-gradient(to bottom, rgba(var(--accent-rgb, 59, 130, 246), 0.2), rgba(var(--accent-rgb, 59, 130, 246), 0.5), rgba(var(--accent-rgb, 59, 130, 246), 0.2))' }}
      />

      {/* Menu Toggle Button - With text label */}
      <motion.button
        onClick={() => { SoundEffects.click(); onToggle(); }}
        onMouseEnter={() => SoundEffects.hover()}
        onTouchStart={() => SoundEffects.click()}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "rounded-full transition-colors flex items-center justify-center gap-0.5",
          isScrollMinimized 
            ? "p-0.5 min-w-[26px] min-h-[26px]" 
            : "p-0.5 xs:p-1 sm:p-1.5 min-w-[32px] xs:min-w-[36px] sm:min-w-[40px] min-h-[32px] xs:min-h-[36px] sm:min-h-[40px]"
        )}
        style={{ color: 'var(--accent-color, #93c5fd)' }}
        title={open ? 'Close menu' : 'Open menu'}
      >
        <div className="relative flex items-center justify-center">
          {open ? (
            <IconX className={isScrollMinimized ? "h-2.5 w-2.5" : "h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4"} />
          ) : (
            <IconMenu2 className={isScrollMinimized ? "h-2.5 w-2.5" : "h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4"} />
          )}
          {hasReward && !open && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="shimmer-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--accent-color, #3b82f6)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--accent-color, #3b82f6)' }}></span>
            </span>
          )}
        </div>
        <span className="text-[7px] xs:text-[8px] sm:text-xs font-bold whitespace-nowrap">{open ? 'Close' : 'Menu'}</span>
      </motion.button>
    </motion.div>
  </motion.div>
));
MobileMenuControls.displayName = 'MobileMenuControls';

// --- MAIN NAVBAR COMPONENT ---
export const Navbar = memo(() => {
  // --- ALL HOOKS AT TOP LEVEL (REQUIRED BY REACT) ---
  const { isXMUser, activeTheme, isAppLoading, isMobile } = useGlobalTheme();
  const { tipsMuted } = useAudioSettings();
  const { deviceTier, isSafari } = useCacheContext();
  
  // Unified UI State - handles mutual exclusion between mobile menu, modals, audio widget, etc.
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const { 
    isAdminOpen, 
    isFaqOpen, 
    isAffiliateOpen, 
    isThemeSelectorOpen,
    openAdminModal,
    openFaqModal,
    openAffiliateModal,
    openThemeSelectorModal,
    openAnalysisModal: openAnalysisModalBase,
    closeNavbarModal,
  } = useNavbarModals();
  
  // Wrap openAnalysisModal with logging
  const openAnalysisModal = useCallback(() => {
    console.log('[Navbar] openAnalysisModal called');
    openAnalysisModalBase();
  }, [openAnalysisModalBase]);
  
  // Unified Performance System - single source for lifecycle & shimmer
  const navbarPerf = useComponentLifecycle('navbar', 10); // Priority 10 (highest)
  
  // Crash tracking for all navbar interactions
  const { trackClick, trackError, trackCustom } = useComponentTracking('navbar');
  
  // FPS Optimizer integration for component lifecycle tracking (legacy support)
  const { registerComponent, unregisterComponent, shouldEnableShimmer } = useFpsOptimizer();
  const shimmerSettings = useOptimizedShimmer();
  
  // Check if shimmer should be enabled for navbar - use unified system
  const shimmerEnabled = navbarPerf.shimmerEnabled && !shimmerSettings.disabled;
  
  // Mobile menu uses context, alias for backwards compatibility
  const open = isMobileMenuOpen;
  const setOpen = setIsMobileMenuOpen;
  
  // Hydration
  const [mounted, setMounted] = useState(false);
  
  // Rotating tips state
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);
  
  // Dock hover state
  const [isDockHovered, setIsDockHovered] = useState(false);
  
  // Scroll minimization state for mobile navbar
  const [isScrollMinimized, setIsScrollMinimized] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  
  // Scroll minimization state for DESKTOP navbar (icon mode)
  const [isDesktopScrollMinimized, setIsDesktopScrollMinimized] = useState(false);
  const desktopScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDesktopScrollY = useRef(0);
  
  // Handle dock hover - expand minimized navbar on hover
  const handleDockHoverChange = useCallback((isHovered: boolean) => {
    setIsDockHovered(isHovered);
    // If hovering the minimized dock, expand it after a brief moment
    if (isHovered && isDesktopScrollMinimized) {
      // Small delay so it doesn't expand accidentally on quick passes
      const expandTimer = setTimeout(() => {
        setIsDesktopScrollMinimized(false);
      }, 150);
      return () => clearTimeout(expandTimer);
    }
  }, [isDesktopScrollMinimized]);
  
  // Refs
  const dockRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- USE STUDIO FOR ADMIN CHECK ---
  const { state } = useStudio();
  const { isAdmin, isAuthenticated, userProfile } = state;

  // Cal embed hook
  const calOptions = useCalEmbed({
    namespace: CONSTANTS.CALCOM_NAMESPACE,
    styles: {
      branding: {
        brandColor: CONSTANTS.CALCOM_BRAND_COLOR,
      },
    },
    hideEventTypeDetails: CONSTANTS.CALCOM_HIDE_EVENT_TYPE_DETAILS,
    layout: CONSTANTS.CALCOM_LAYOUT,
  });

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll detection using optimized hook with RAF throttling
  const { isScrolling, scrollDirection } = useScrollOptimization({
    throttleMs: 16.67, // 60fps
    enableVisibilityTracking: false,
    enableMemoryOptimizations: false,
  });

  // Mobile scroll minimization
  useEffect(() => {
    if (!isMobile) return;
    
    // Only minimize when scrolling DOWN and menu is closed
    if (scrollDirection === 'down' && !open) {
      setIsScrollMinimized(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to expand back after scroll stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrollMinimized(false);
      }, 1000); // Expand back 1s after scroll stops
    } else if (scrollDirection === 'up' || scrollDirection === 'idle') {
      // Expand on scroll up
      setIsScrollMinimized(false);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    }
  }, [isMobile, open, scrollDirection]);

  // Desktop scroll minimization
  useEffect(() => {
    if (isMobile) return;
    
    // Get current scroll position from window
    const currentScrollY = window.scrollY;
    
    // Minimize on scroll down past 100px
    if (currentScrollY > 100 && scrollDirection === 'down') {
      if (!isDesktopScrollMinimized) {
        setIsDesktopScrollMinimized(true);
      }
      
      if (desktopScrollTimeoutRef.current) {
        clearTimeout(desktopScrollTimeoutRef.current);
      }
      
      desktopScrollTimeoutRef.current = setTimeout(() => {
        setIsDesktopScrollMinimized(false);
      }, 2000);
    }
    
    // Immediately expand when scrolled back to top
    if (currentScrollY < 50) {
      setIsDesktopScrollMinimized(false);
      if (desktopScrollTimeoutRef.current) {
        clearTimeout(desktopScrollTimeoutRef.current);
      }
    }
  }, [isMobile, scrollDirection]);

  // Reset minimized state when menu opens
  useEffect(() => {
    if (open) {
      setIsScrollMinimized(false);
    }
  }, [open]);

  // Note: Component lifecycle is now managed by useComponentLifecycle hook above
  // No need for separate registerComponent/unregisterComponent calls

  // Rotate tips every 10 seconds
  const soundPlayedRef = useRef(false);
  
  useEffect(() => {
    if (!mounted) return;
    
    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    
    intervalId = setInterval(() => {
      setShowTip(false);
      timeoutId = setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % NAVBAR_TRADING_TIPS.length);
        setShowTip(true);
        // Play sound only after first render and prevent double play
        if (soundPlayedRef.current) {
          if (!tipsMuted) SoundEffects.tipChange();
        } else {
          soundPlayedRef.current = true;
        }
      }, 300);
    }, 10000);
    
    return () => {
      clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mounted, tipsMuted]);

  // Early return if app is still loading
  if (isAppLoading) {
    return null;
  }
  
  // Get CSS filter for current theme - use actual theme filter from GlobalThemeProvider
  // This ensures navbar theme matches the rest of the app
  // Use mobileFilter for both mobile and desktop to ensure consistent theming
  const themeFilter = activeTheme?.mobileFilter || 'none';

  // Check for reward
  const hasReward = (userProfile?.stamps || 0) >= 5;

  return (
    <>
      {/* All keyframes now in UnifiedShimmer.tsx - no duplicate definitions */}

      {/* Modal Components - Using Lazy Modal System (load/unload like ServicesModal) */}
      {/* These modals now: 
          1. Don't load until first opened
          2. Fully unmount when closed (freeing memory)
          3. Freeze animations during scroll
          4. Use content-visibility for off-screen sections
      */}
      <LazyAdminModal isOpen={isAdminOpen} onClose={closeNavbarModal} />
      <LazyFaqModal isOpen={isFaqOpen} onClose={closeNavbarModal} />
      <LazyAffiliateModal isOpen={isAffiliateOpen} onClose={closeNavbarModal} />
      <ThemeSelectorModal isOpen={isThemeSelectorOpen} onClose={closeNavbarModal} />
      
      {/* Desktop Moving Trading Tips */}
      <AnimatePresence mode="wait">
        {mounted && showTip && !isDockHovered && (
          <MovingTradingTip 
            key={`desktop-tip-${currentTipIndex}`}
            tip={NAVBAR_TRADING_TIPS[currentTipIndex]} 
            buttonRefs={buttonRefs}
            dockRef={dockRef}
            isVisible={showTip} 
          />
        )}
      </AnimatePresence>
      
      {/* Mobile Static Helper */}
      {mounted && <MobileStaticHelper />}

      {/* Main Navbar Container */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : -20 }}
        transition={{ duration: 0.5 }}
        className="fixed top-8 inset-x-0 z-40 w-full px-4 pointer-events-none navbar-themed navbar"
        style={{
          filter: themeFilter,
          transition: 'filter 0.5s ease-in-out, opacity 0.3s ease-in-out, border-color 0.4s ease-out, box-shadow 0.4s ease-out',
          transitionDelay: '0.35s', // Navbar transitions last (top element in bottom-to-top)
        }}
        data-navbar-container
        data-navbar
        data-theme-aware
      >
        {/* Cal.com Hidden Trigger */}
        <button
          id="cal-trigger-btn"
          className="hidden pointer-events-auto"
          data-cal-namespace={calOptions.namespace}
          data-cal-link={CONSTANTS.CALCOM_LINK}
          data-cal-config={`{"layout":"${calOptions.layout}"}`}
        />

        {/* DESKTOP LAYOUT */}
        <DesktopNavbar
          ref={dockRef}
          isXMUser={isXMUser}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          hasReward={hasReward}
          dockRef={dockRef}
          buttonRefs={buttonRefs}
          onHoverChange={handleDockHoverChange}
          onAffiliateClick={openAffiliateModal}
          onFaqClick={openFaqModal}
          onThemeClick={openThemeSelectorModal}
          onAdminClick={openAdminModal}
          onAnalysisClick={openAnalysisModal}
          mounted={mounted}
          isScrollMinimized={isDesktopScrollMinimized}
          onExpandClick={() => setIsDesktopScrollMinimized(false)}
        />

        {/* MOBILE NAVBAR */}
        <div className="lg:hidden flex flex-row items-center justify-between w-full px-2 sm:px-4 pointer-events-auto gap-2">
          {/* Logo + Brand Name */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Logo - shrinks on scroll */}
            <motion.div 
              className="relative flex items-center justify-center overflow-hidden z-50 flex-shrink-0"
              animate={{
                height: isScrollMinimized ? 36 : undefined,
                width: isScrollMinimized ? 36 : undefined,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 450, mass: 0.6 }}
              style={{
                height: isScrollMinimized ? 36 : 56,
                width: isScrollMinimized ? 36 : 56,
              }}
            >
              <Link href="/" className="relative w-full h-full block">
                <Image
                  src="/BULL.svg"
                  alt="BullMoney"
                  fill
                  className="object-cover"
                  priority
                />
              </Link>
            </motion.div>

            {/* BULLMONEY Text with Shimmer */}
            <AnimatePresence>
              {!isScrollMinimized && (
                <motion.div
                  initial={{ opacity: 0, x: -10, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -10, width: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.6 }}
                  className="relative overflow-hidden"
                >
                  <Link href="/" className="relative block">
                    <span 
                      className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent"
                      style={{
                        textShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                      }}
                    >
                      BULLMONEY
                    </span>
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div
                        className="absolute inset-y-0 w-[60%] bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: 'easeInOut',
                        }}
                      />
                    </div>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Controls */}
          <MobileMenuControls 
            open={open} 
            onToggle={() => { 
              if (!open) trackEvent('menu_toggle', { type: 'mobile_menu', action: 'open' });
              setOpen(!open);
            }}
            onThemeClick={openThemeSelectorModal}
            hasReward={hasReward}
            isXMUser={isXMUser}
            shimmerEnabled={shimmerEnabled}
            shimmerSettings={shimmerSettings}
            isScrollMinimized={isScrollMinimized}
          />
        </div>
      </motion.div>
      
      {/* Mobile Dropdown Menu */}
      <MobileDropdownMenu
        open={open}
        onClose={() => setOpen(false)}
        isXMUser={isXMUser}
        hasReward={hasReward}
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        onAffiliateClick={() => { trackClick('affiliate_nav', { source: 'mobile_menu' }); openAffiliateModal(); }}
        onFaqClick={() => { trackClick('faq_nav', { source: 'mobile_menu' }); openFaqModal(); }}
        onAdminClick={() => { trackClick('admin_nav', { source: 'mobile_menu' }); openAdminModal(); }}
        onThemeClick={() => { trackClick('theme_nav', { source: 'mobile_menu' }); openThemeSelectorModal(); }}
        onAnalysisClick={() => { trackClick('analysis_nav', { source: 'mobile_menu' }); openAnalysisModal(); }}
      />
    </>
  );
});
Navbar.displayName = 'Navbar';
