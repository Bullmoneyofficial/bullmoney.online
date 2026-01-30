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
  useMemo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

// --- IMPORT CONTEXT ---
import { useStudio } from "@/context/StudioContext";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useCacheContext } from "@/components/CacheManagerProvider";
import { useMobileMenu, useNavbarModals } from "@/contexts/UIStateContext";
import { useMobileLazyRender } from "@/hooks/useMobileLazyRender";
import { createSupabaseClient } from "@/lib/supabase";

// ✅ MOBILE DETECTION - For conditional lazy loading
import { isMobileDevice } from "@/lib/mobileDetection";

// ✅ LOADING FALLBACKS - Mobile optimized
import { MinimalFallback } from "@/components/MobileLazyLoadingFallback";

// --- LAZY LOADED MODAL SYSTEM - All modals lazy loaded for mobile ---
import { 
  LazyAdminModal, 
  LazyAffiliateModal, 
  LazyFaqModal,
  LazyAccountManagerModal,
} from "./navbar/LazyModalSystem";

// --- IMPORT SOUND EFFECTS ---
import { SoundEffects } from "@/app/hooks/useSoundEffects";

// --- IMPORT SCROLL OPTIMIZATION ---
import { useScrollOptimization } from "@/hooks/useScrollOptimization";

// --- LAZY LOADED MODULAR NAVBAR COMPONENTS ---
const DesktopNavbar = dynamic(
  () => import("./navbar/DesktopNavbar").then((mod) => ({ default: mod.DesktopNavbar })),
  { ssr: false, loading: () => <MinimalFallback /> }
);


const MobileDropdownMenu = dynamic(
  () => import("./navbar/MobileDropdownMenu").then((mod) => ({ default: mod.MobileDropdownMenu })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

const MovingTradingTip = dynamic(
  () => import("./navbar/MovingTradingTip").then((mod) => ({ default: mod.MovingTradingTip })),
  { ssr: false }
);

const ThemeSelectorModal = dynamic(
  () => import("./navbar/ThemeSelectorModal").then((mod) => ({ default: mod.ThemeSelectorModal })),
  { ssr: false, loading: () => <MinimalFallback /> }
);

import { NAVBAR_TRADING_TIPS } from "./navbar/navbar.utils";
import { useAudioSettings } from "@/contexts/AudioSettingsProvider";

// --- IMPORT UNIFIED SHIMMER SYSTEM ---
import { ShimmerLine, ShimmerBorder, useOptimizedShimmer } from "@/components/ui/UnifiedShimmer";
import { useFpsOptimizer } from "@/lib/FpsOptimizer";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";
import { useComponentTracking } from "@/lib/CrashTracker";

// --- IMPORT NAVBAR CSS ---
import "./navbar.css";

// Detect if a pagemode session exists locally (used to persist Account Manager access)
const getStoredAccountManagerAccess = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem("bullmoney_session");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.email);
  } catch (err) {
    console.error("[Navbar] Failed to parse bullmoney_session", err);
    return false;
  }
};

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
  skipHeavyEffects = false,
}: any) => (
  <motion.div 
    animate={skipHeavyEffects ? {} : {
      y: [0, -8, 0],
      scale: [1, 1.02, 1],
    }}
    transition={skipHeavyEffects ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    className="relative group rounded-full overflow-visible z-50 flex items-center flex-grow"
    data-theme-aware
    data-navbar
    style={{ 
      height: isScrollMinimized ? 32 : 'auto',
      maxWidth: isScrollMinimized ? '7rem' : 'none',
      transition: 'border-color 0.4s ease-out, box-shadow 0.4s ease-out, filter 0.4s ease-out, height 0.4s ease-out, max-width 0.4s ease-out',
      transitionDelay: '0.35s',
      filter: skipHeavyEffects ? 'none' : 'drop-shadow(0 0 12px rgba(255, 255, 255,1)) drop-shadow(0 0 24px rgba(255, 255, 255,0.8)) drop-shadow(0 0 36px rgba(255, 255, 255,0.6))',
    }}
  >
    {/* UNIFIED SHIMMER - Border glow effect, theme-aware via CSS variables */}
    {shimmerEnabled && !isScrollMinimized && !skipHeavyEffects && <ShimmerBorder />}
    
    {/* UNIFIED SHIMMER - Background glow effect */}
    {shimmerEnabled && !isScrollMinimized && !skipHeavyEffects && (
      <div className="shimmer-glow shimmer-gpu absolute inset-0 rounded-full pointer-events-none" />
    )}

    {/* Neon Inner Content Container - Theme-aware borders and shadows */}
    <motion.div 
      className={cn(
        "relative h-full w-full bg-black/95 rounded-full flex items-center justify-center gap-0.5 sm:gap-1 transition-all duration-200 z-10",
        isScrollMinimized ? "p-[1px] px-1" : "p-[2px] px-1 xs:px-1.5 sm:px-2"
      )}
      style={{
        border: '2px solid rgba(255, 255, 255, 0.9)',
        boxShadow: skipHeavyEffects ? 'none' : '0 0 10px rgba(255, 255, 255, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.3)',
      }}
    >
      {/* Theme Selector Button - With text label */}
      <motion.button
        onClick={() => { SoundEffects.click(); onThemeClick(); }}
        onMouseEnter={() => SoundEffects.hover()}
        onTouchStart={() => SoundEffects.click()}
        whileHover={skipHeavyEffects ? {} : { scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "rounded-full transition-colors flex items-center justify-center gap-1",
          isScrollMinimized
            ? "p-1 min-w-[44px] min-h-[44px]"
            : "p-1 xs:p-1.5 sm:p-2 min-w-[44px] xs:min-w-[44px] sm:min-w-[48px] min-h-[44px] xs:min-h-[44px] sm:min-h-[48px]"
        )}
        style={{ color: 'var(--accent-color, #ffffff)' }}
        title="Theme Selector"
      >
        <IconPalette className={isScrollMinimized ? "h-4 w-4" : "h-5 w-5 xs:h-6 xs:w-6 sm:h-6 sm:w-6"} />
        <span className="text-[11px] xs:text-xs sm:text-base font-bold whitespace-nowrap">Theme</span>
      </motion.button>

      {/* Divider - Theme-aware */}
      <div 
        className={cn(isScrollMinimized ? "h-4 w-[1px]" : "h-6 xs:h-7 w-[1px]")}
        style={{ background: 'linear-gradient(to bottom, rgba(var(--accent-rgb, 255, 255, 255), 0.2), rgba(var(--accent-rgb, 255, 255, 255), 0.5), rgba(var(--accent-rgb, 255, 255, 255), 0.2))' }}
      />

      {/* Menu Toggle Button - With text label */}
      <motion.button
        onClick={() => { SoundEffects.click(); onToggle(); }}
        onMouseEnter={() => SoundEffects.hover()}
        onTouchStart={() => SoundEffects.click()}
        whileHover={skipHeavyEffects ? {} : { scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "rounded-full transition-colors flex items-center justify-center gap-1",
          isScrollMinimized
            ? "p-1 min-w-[44px] min-h-[44px]"
            : "p-1 xs:p-1.5 sm:p-2 min-w-[44px] xs:min-w-[44px] sm:min-w-[48px] min-h-[44px] xs:min-h-[44px] sm:min-h-[48px]"
        )}
        style={{ color: 'var(--accent-color, #ffffff)' }}
        title={open ? 'Close menu' : 'Open menu'}
      >
        <div className="relative flex items-center justify-center">
          {open ? (
            <IconX className={isScrollMinimized ? "h-4 w-4" : "h-5 w-5 xs:h-6 xs:w-6 sm:h-6 sm:w-6"} />
          ) : (
            <IconMenu2 className={isScrollMinimized ? "h-4 w-4" : "h-5 w-5 xs:h-6 xs:w-6 sm:h-6 sm:w-6"} />
          )}
          {hasReward && !open && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", skipHeavyEffects ? "" : "shimmer-ping")} style={{ backgroundColor: 'var(--accent-color, #ffffff)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--accent-color, #ffffff)' }}></span>
            </span>
          )}
        </div>
        <span className="text-[11px] xs:text-xs sm:text-base font-bold whitespace-nowrap">{open ? 'Close' : 'Menu'}</span>
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
  const { shouldRender: allowMobileLazy } = useMobileLazyRender(200);
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  
  // Unified UI State - handles mutual exclusion between mobile menu, modals, audio widget, etc.
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const { 
    isAdminOpen, 
    isFaqOpen, 
    isAffiliateOpen, 
    isThemeSelectorOpen,
    isAccountManagerOpen,
    openAdminModal,
    openFaqModal,
    openAffiliateModal,
    openThemeSelectorModal,
    openAccountManagerModal,
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
  const { userProfile } = state;
 
  // Admin visibility based on Supabase session email matching env
  const adminEmailEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() || "";
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [pagemodeAdminAuthorized, setPagemodeAdminAuthorized] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem("bullmoney_session");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const email = (parsed?.email || "").toLowerCase();
      const isAdminFlag = Boolean(parsed?.isAdmin);
      return Boolean(adminEmailEnv) && (isAdminFlag || email === adminEmailEnv);
    } catch (err) {
      console.error("Navbar pagemode session parse error (init)", err);
      return false;
    }
  });
  const [hasAccountManagerAccess, setHasAccountManagerAccess] = useState<boolean>(() => getStoredAccountManagerAccess());
 
  useEffect(() => {
    let mounted = true;
    const evaluate = (email?: string | null) => {
      if (!mounted) return;
      setAdminAuthorized(Boolean(adminEmailEnv) && email?.toLowerCase() === adminEmailEnv);
    };
    const run = async () => {
      if (!adminEmailEnv) {
        setAdminAuthorized(false);
        setAdminChecked(true);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Navbar auth session error", error.message);
      evaluate(data?.session?.user?.email || null);
      setAdminChecked(true);
    };
    run();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      evaluate(session?.user?.email || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [adminEmailEnv, supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const evaluate = () => {
      try {
        const raw = localStorage.getItem("bullmoney_session");
        if (!raw) {
          setPagemodeAdminAuthorized(false);
          return;
        }
        const parsed = JSON.parse(raw);
        const email = (parsed?.email || "").toLowerCase();
        const isAdminFlag = Boolean(parsed?.isAdmin);
        setPagemodeAdminAuthorized(Boolean(adminEmailEnv) && (isAdminFlag || email === adminEmailEnv));
      } catch (err) {
        console.error("Navbar pagemode session parse error", err);
        setPagemodeAdminAuthorized(false);
      }
    };

    evaluate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bullmoney_session") evaluate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [adminEmailEnv]);

  useEffect(() => {
    let isMounted = true;

    const syncAccountAccess = async () => {
      const localAccess = getStoredAccountManagerAccess();
      if (localAccess) {
        if (isMounted) setHasAccountManagerAccess(true);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("[Navbar] Account manager session error", error.message);
        }
        if (!isMounted) return;
        setHasAccountManagerAccess(Boolean(data?.session?.user?.email));
      } catch (err) {
        if (!isMounted) return;
        console.error("[Navbar] Failed to check account manager access", err);
        setHasAccountManagerAccess(getStoredAccountManagerAccess());
      }
    };

    syncAccountAccess();

    const { data: accountManagerSub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasAccountManagerAccess(getStoredAccountManagerAccess() || Boolean(session?.user?.email));
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "bullmoney_session") {
        setHasAccountManagerAccess(getStoredAccountManagerAccess());
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      isMounted = false;
      accountManagerSub?.subscription?.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, [supabase]);

  const profileMatchesAdmin = (userProfile?.email || "").toLowerCase() === adminEmailEnv;
  const isAdmin = profileMatchesAdmin || pagemodeAdminAuthorized || (adminChecked && adminAuthorized);

  const handleAdminClick = useCallback(() => {
    if (!isAdmin) return;
    openAdminModal();
  }, [isAdmin, openAdminModal]);

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
    // Disable scroll-based minimization on mobile completely
    return;
  }, [isMobile, open, scrollDirection]);

  // Desktop scroll minimization - more responsive
  useEffect(() => {
    if (isMobile) return;
    
    // Direct scroll listener for immediate response
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastDesktopScrollY.current;
      
      // Minimize immediately when scrolling down past 50px
      if (currentScrollY > 50 && scrollDelta > 5) {
        if (!isDesktopScrollMinimized) {
          setIsDesktopScrollMinimized(true);
        }
        
        // Reset timeout on continued scrolling
        if (desktopScrollTimeoutRef.current) {
          clearTimeout(desktopScrollTimeoutRef.current);
        }
        
        desktopScrollTimeoutRef.current = setTimeout(() => {
          setIsDesktopScrollMinimized(false);
        }, 1500);
      }
      
      // Immediately expand when scrolled back to top or scrolling up significantly
      if (currentScrollY < 30 || (scrollDelta < -20 && currentScrollY < 200)) {
        setIsDesktopScrollMinimized(false);
        if (desktopScrollTimeoutRef.current) {
          clearTimeout(desktopScrollTimeoutRef.current);
        }
      }
      
      lastDesktopScrollY.current = currentScrollY;
    };
    
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
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
      }, 150);
    }, 4000);
    
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
      <LazyAccountManagerModal isOpen={isAccountManagerOpen} onClose={closeNavbarModal} />
      {(!isMobile || allowMobileLazy) && (
        <ThemeSelectorModal isOpen={isThemeSelectorOpen} onClose={closeNavbarModal} />
      )}
      
      {/* Desktop Moving Trading Tips */}
      {mounted && showTip && !isDockHovered && (
        <MovingTradingTip 
          key={`desktop-tip-${currentTipIndex}`}
          tip={NAVBAR_TRADING_TIPS[currentTipIndex]} 
          buttonRefs={buttonRefs}
          dockRef={dockRef}
          isVisible={showTip} 
        />
      )}
      

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
          hasReward={hasReward}
          dockRef={dockRef}
          buttonRefs={buttonRefs}
          onHoverChange={handleDockHoverChange}
          onAffiliateClick={openAffiliateModal}
          onFaqClick={openFaqModal}
          onThemeClick={openThemeSelectorModal}
          onAdminClick={handleAdminClick}
          onAccountManagerClick={() => {
            trackClick('account_manager_nav', { source: 'desktop_dock' });
            openAccountManagerModal();
          }}
          showAccountManager={hasAccountManagerAccess}
          mounted={mounted}
          isScrollMinimized={isDesktopScrollMinimized}
          onExpandClick={() => setIsDesktopScrollMinimized(false)}
        />

        {/* MOBILE NAVBAR */}
        <div className="lg:hidden flex flex-col items-center w-full gap-2 pointer-events-auto">
          {/* Floating Glowing BULLMONEY Logo + Text - Mobile Only */}
          <motion.div
            animate={shouldSkipHeavyEffects ? {} : { y: [0, -8, 0] }}
            transition={shouldSkipHeavyEffects ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2 justify-center"
          >
            {/* Logo */}
            <Link href="/" className="relative flex-shrink-0 w-12 h-12 block">
              <Image
                src="/ONcc2l601.svg"
                alt="BullMoney"
                fill
                className="object-cover"
                priority
              />
            </Link>
            
            {/* BULLMONEY Text */}
            <motion.h1
              animate={shouldSkipHeavyEffects ? {} : { 
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={shouldSkipHeavyEffects ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="text-3xl font-black tracking-wider bg-gradient-to-r from-white via-white to-white bg-clip-text text-transparent pointer-events-none"
              style={{
                textShadow: shouldSkipHeavyEffects ? 'none' : '0 0 20px rgba(255, 255, 255, 1), 0 0 40px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.6)',
                filter: shouldSkipHeavyEffects ? 'none' : 'drop-shadow(0 0 10px rgba(255, 255, 255,0.9)) drop-shadow(0 0 20px rgba(255, 255, 255,0.6))',
              }}
            >
              BULLMONEY
            </motion.h1>
          </motion.div>

          {/* Mobile Navbar Controls Container */}
          <div className={cn("flex flex-row items-center w-full px-2 sm:px-4 pointer-events-auto gap-2", isScrollMinimized ? "justify-center" : "justify-between")}>
          {/* Logo + Brand Name - Hidden on mobile */}
          <div className="hidden flex items-center gap-2 flex-shrink-0">
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
                  src="/ONcc2l601.svg"
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
                      className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-white to-white bg-clip-text text-transparent"
                      style={{
                        textShadow: shouldSkipHeavyEffects ? 'none' : '0 0 20px rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      BULLMONEY
                    </span>
                    {/* Shimmer overlay */}
                    {!shouldSkipHeavyEffects && (
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
                    )}
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
            skipHeavyEffects={shouldSkipHeavyEffects}
          />
          </div>
        </div>
      </motion.div>
      
      {/* Mobile Dropdown Menu */}
      {isMobile && allowMobileLazy && (
        <MobileDropdownMenu
          open={open}
          onClose={() => setOpen(false)}
          isXMUser={isXMUser}
          hasReward={hasReward}
          isAdmin={isAdmin}
          showAccountManager={hasAccountManagerAccess}
          onAffiliateClick={() => { trackClick('affiliate_nav', { source: 'mobile_menu' }); openAffiliateModal(); }}
          onFaqClick={() => { trackClick('faq_nav', { source: 'mobile_menu' }); openFaqModal(); }}
          onAdminClick={() => { 
            if (!isAdmin) return;
            trackClick('admin_nav', { source: 'mobile_menu' }); 
            handleAdminClick(); 
          }}
          onThemeClick={() => { trackClick('theme_nav', { source: 'mobile_menu' }); openThemeSelectorModal(); }}
          onAccountManagerClick={() => { trackClick('account_manager_nav', { source: 'mobile_menu' }); openAccountManagerModal(); }}
        />
      )}
    </>
  );
});
Navbar.displayName = 'Navbar';
