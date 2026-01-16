"use client";
import { cn } from "@/lib/utils";
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

// --- IMPORT MODAL COMPONENTS ---
import AdminModal from "@/components/AdminModal";
import BullMoneyModal from "@/components/Faq";
import AffiliateModal from "@/components/AffiliateModal";

// --- IMPORT SOUND EFFECTS ---
import { SoundEffects } from "@/app/hooks/useSoundEffects";

// --- IMPORT MODULAR NAVBAR COMPONENTS ---
import { DesktopNavbar } from "./navbar/DesktopNavbar";
import { MobileStaticHelper } from "./navbar/MobileStaticHelper";
import { MobileDropdownMenu } from "./navbar/MobileDropdownMenu";
import { MovingTradingTip } from "./navbar/MovingTradingTip";
import { ThemeSelectorModal } from "./navbar/ThemeSelectorModal";
import { NAVBAR_TRADING_TIPS } from "./navbar/navbar.utils";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";

// --- IMPORT UNIFIED SHIMMER SYSTEM ---
import { ShimmerLine, ShimmerBorder, useOptimizedShimmer } from "@/components/ui/UnifiedShimmer";
import { useFpsOptimizer } from "@/lib/FpsOptimizer";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking } from "@/lib/CrashTracker";

// --- IMPORT NAVBAR CSS ---
import "./navbar.css";

// --- MOBILE MENU CONTROLS COMPONENT (Optimized with Unified Shimmer) ---
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
    className="relative group rounded-full overflow-hidden shadow-2xl z-50 flex items-center flex-grow navbar-shimmer"
    animate={{
      height: isScrollMinimized ? 36 : undefined,
      maxWidth: isScrollMinimized ? '7rem' : '12rem',
      scale: isScrollMinimized ? 0.9 : 1,
    }}
    transition={{ type: 'spring', damping: 25, stiffness: 450, mass: 0.6 }}
    style={{ 
      height: isScrollMinimized ? 36 : 'auto',
    }}
  >
    {/* Unified Shimmer Border - GPU accelerated, LEFT TO RIGHT */}
    {shimmerEnabled && !isScrollMinimized && <ShimmerBorder color="blue" intensity={shimmerSettings.intensity} speed={shimmerSettings.speed} />}

    {/* Inner Content Container */}
    <motion.div 
      className={cn(
        "relative h-full w-full bg-black/95 dark:bg-black/95 backdrop-blur-xl rounded-full flex items-center justify-center border-2 border-blue-500/60 dark:border-blue-500/60 transition-all duration-200 group-hover:border-blue-400/80 group-hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] z-10",
        isScrollMinimized ? "p-[1px] gap-0.5 px-1.5" : "p-[2px] gap-1 px-2 sm:px-3"
      )}
    >
      {/* Theme Selector Button */}
      <motion.button
        onClick={() => { SoundEffects.click(); onThemeClick(); }}
        onMouseEnter={() => SoundEffects.hover()}
        onTouchStart={() => SoundEffects.click()}
        whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.15)" }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "rounded-full text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 transition-colors flex items-center justify-center",
          isScrollMinimized 
            ? "p-1 min-w-[28px] min-h-[28px]" 
            : "p-1.5 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
        )}
        title="Theme Selector"
      >
        <IconPalette className={isScrollMinimized ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-5 sm:w-5"} />
      </motion.button>

      {/* Divider */}
      <div className={cn(
        "bg-gradient-to-b from-blue-500/20 via-blue-500/40 to-blue-500/20 dark:bg-blue-500/20",
        isScrollMinimized ? "h-3 w-[1px]" : "h-4 w-[1px]"
      )} />

      {/* Menu Toggle Button */}
      <motion.button
        onClick={() => { SoundEffects.click(); onToggle(); }}
        onMouseEnter={() => SoundEffects.hover()}
        onTouchStart={() => SoundEffects.click()}
        whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.15)" }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "rounded-full text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 transition-colors flex items-center justify-center",
          isScrollMinimized 
            ? "p-1 min-w-[28px] min-h-[28px]" 
            : "p-1.5 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
        )}
        title={open ? 'Close menu' : 'Open menu'}
      >
        <div className="relative flex items-center justify-center">
          {open ? (
            <IconX className={isScrollMinimized ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-5 sm:w-5"} />
          ) : (
            <IconMenu2 className={isScrollMinimized ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-5 sm:w-5"} />
          )}
          {hasReward && !open && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="shimmer-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
        </div>
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
    closeNavbarModal,
  } = useNavbarModals();
  
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

  // Scroll detection for mobile navbar minimization
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);
      
      // Only trigger minimization on significant scroll when menu is closed
      if (scrollDelta > 15 && !open) {
        setIsScrollMinimized(true);
        lastScrollY.current = currentScrollY;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Set timeout to expand back after scroll stops
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrollMinimized(false);
        }, 1000); // Expand back 1s after scroll stops
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isMobile, open]);

  // Scroll detection for DESKTOP navbar minimization (icon mode)
  useEffect(() => {
    if (isMobile) return;
    
    const handleDesktopScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastDesktopScrollY.current);
      
      // Minimize on scroll down past 100px threshold
      if (currentScrollY > 100 && scrollDelta > 10) {
        if (!isDesktopScrollMinimized) {
          setIsDesktopScrollMinimized(true);
        }
        lastDesktopScrollY.current = currentScrollY;
        
        // Clear existing timeout
        if (desktopScrollTimeoutRef.current) {
          clearTimeout(desktopScrollTimeoutRef.current);
        }
        
        // Set timeout to expand back after scroll stops
        desktopScrollTimeoutRef.current = setTimeout(() => {
          setIsDesktopScrollMinimized(false);
        }, 2000); // Expand back 2s after scroll stops
      }
      
      // Immediately expand when scrolled back to top
      if (currentScrollY < 50) {
        setIsDesktopScrollMinimized(false);
        if (desktopScrollTimeoutRef.current) {
          clearTimeout(desktopScrollTimeoutRef.current);
        }
      }
    };

    window.addEventListener('scroll', handleDesktopScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleDesktopScroll);
      if (desktopScrollTimeoutRef.current) {
        clearTimeout(desktopScrollTimeoutRef.current);
      }
    };
  }, [isMobile, isDesktopScrollMinimized]);

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

      {/* Modal Components */}
      <AdminModal isOpen={isAdminOpen} onClose={closeNavbarModal} />
      <BullMoneyModal isOpen={isFaqOpen} onClose={closeNavbarModal} />
      <AffiliateModal isOpen={isAffiliateOpen} onClose={closeNavbarModal} />
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
        className="fixed top-8 inset-x-0 z-40 w-full px-4 pointer-events-none navbar-themed"
        style={{
          filter: themeFilter,
          transition: 'filter 0.5s ease-in-out, opacity 0.3s ease-in-out'
        }}
        data-navbar-container
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
            onToggle={() => setOpen(!open)}
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
        onAffiliateClick={openAffiliateModal}
        onFaqClick={openFaqModal}
        onAdminClick={openAdminModal}
        onThemeClick={openThemeSelectorModal}
      />
    </>
  );
});
Navbar.displayName = 'Navbar';
