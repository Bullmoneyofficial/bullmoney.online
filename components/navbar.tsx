"use client";
import { cn } from "@/lib/utils";
import { trackEvent, trackClick } from "@/lib/analytics";
import {
  IconMenu2,
  IconX,
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
import { usePathname } from "next/navigation";

import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";
import { useAdminAuth } from "@/hooks/useAdminAuth";

// --- IMPORT CONTEXT ---
import { useStudio } from "@/context/StudioContext";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useCacheContext } from "@/components/CacheManagerProvider";
import { useMobileMenu, useNavbarModals, useUIState } from "@/contexts/UIStateContext";
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

// --- MOBILE MENU CONTROLS COMPONENT (Apple Minimalistic Style) ---
const MobileMenuControls = memo(({ 
  open, 
  onToggle, 
  hasReward,
  isXMUser,
  shimmerEnabled = true,
  shimmerSettings = { intensity: 'medium' as const, speed: 'normal' as const },
  isScrollMinimized = false,
  skipHeavyEffects = false,
  disableAnimations = false,
}: any) => (
  <motion.div 
    className="relative group rounded-xl overflow-hidden"
    data-navbar
    style={{ 
      height: isScrollMinimized ? 36 : 44,
      width: isScrollMinimized ? 80 : 'auto',
      minWidth: isScrollMinimized ? 80 : 96,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 50,
      willChange: 'transform',
    }}
  >
    {/* Apple-style glass background */}
    <div 
      className="absolute inset-0"
      style={{
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: skipHeavyEffects ? 'none' : 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
      }}
    />

    {/* Subtle shimmer border */}
    {shimmerEnabled && !skipHeavyEffects && !disableAnimations && (
      <div 
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent 50%, rgba(255, 255, 255, 0.04))',
          opacity: 0.45,
        }}
      />
    )}

    {/* Menu Toggle Button */}
    <motion.button
      onClick={() => { SoundEffects.click(); onToggle(); }}
      onMouseEnter={() => SoundEffects.hover()}
      onTouchStart={() => SoundEffects.click()}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full h-full flex items-center justify-center gap-2 px-4"
      style={{ color: '#ffffff', letterSpacing: '0.08em', fontSize: isScrollMinimized ? 12 : 13 }}
      title={open ? 'Close menu' : 'Open menu'}
    >
      <div className="relative flex items-center justify-center">
        {open ? (
          <IconX className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <IconMenu2 className="h-5 w-5" strokeWidth={1.5} />
        )}
        {hasReward && !open && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        )}
      </div>
      {!isScrollMinimized && (
        <span className="font-semibold tracking-[0.08em]">{open ? 'Close' : 'Menu'}</span>
      )}
    </motion.button>
  </motion.div>
));
MobileMenuControls.displayName = 'MobileMenuControls';

// --- MAIN NAVBAR COMPONENT ---
export const Navbar = memo(() => {
  // --- ALL HOOKS AT TOP LEVEL (REQUIRED BY REACT) ---
  const { isXMUser, isAppLoading, isMobile } = useGlobalTheme();
  const { tipsMuted } = useAudioSettings();
  const { deviceTier, isSafari } = useCacheContext();
  const { shouldRender: allowMobileLazy } = useMobileLazyRender(200);
  const { shouldSkipHeavyEffects } = useUnifiedPerformance();
  
  // Unified UI State - handles mutual exclusion between mobile menu, modals, audio widget, etc.
  const { isMobileMenuOpen, setMobileMenuOpen: setIsMobileMenuOpen, setMobileNavbarHidden } = useUIState();
  const { 
    isAdminOpen, 
    isFaqOpen, 
    isAffiliateOpen, 
    isAccountManagerOpen,
    openAdminModal,
    openFaqModal,
    openAffiliateModal,
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
  
  // Use admin auth hook for centralized admin checking
  const { isAdmin } = useAdminAuth();

  const isDev = process.env.NODE_ENV === 'development';
  // Dev toggle: allows admin to preview the site as a non-admin user
  const [devAdminEnabled, setDevAdminEnabled] = useState(true);
  const effectiveAdmin = isDev ? (isAdmin && devAdminEnabled) : false;

  const supabase = useMemo(() => createSupabaseClient(), []);
  const [hasAccountManagerAccess, setHasAccountManagerAccess] = useState<boolean>(() => getStoredAccountManagerAccess());

  // Account Manager check based on Supabase auth OR localStorage
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

  const handleAdminClick = useCallback(() => {
    if (!effectiveAdmin) return;
    openAdminModal();
  }, [effectiveAdmin, openAdminModal]);

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

  // Track pathname for resetting state on navigation (including back button)
  const pathname = usePathname();

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset scroll minimization and mobile navbar hidden state on route change
  // This fixes the bug where back-button navigation leaves the navbar in a hidden/minimized state
  useEffect(() => {
    setIsScrollMinimized(false);
    setIsDesktopScrollMinimized(false);
    setMobileNavbarHidden(false);
    lastScrollY.current = 0;
    lastDesktopScrollY.current = 0;
    // Also close mobile menu on navigation
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll detection using optimized hook with RAF throttling
  const { isScrolling, scrollDirection } = useScrollOptimization({
    throttleMs: 16.67, // 60fps
    enableVisibilityTracking: false,
    enableMemoryOptimizations: false,
  });

  // Mobile scroll minimization - hide navbar and notify context for UltimateHub expansion
  useEffect(() => {
    if (!isMobile) return;
    
    // Direct scroll listener for immediate response
    const handleScroll = () => {
      if (open) return; // Don't hide navbar if menu is open
      
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      
      // Hide navbar when scrolling down past 60px
      if (currentScrollY > 60 && scrollDelta > 8) {
        if (!isScrollMinimized) {
          setIsScrollMinimized(true);
          setMobileNavbarHidden(true);
        }
        
        // Reset timeout on continued scrolling
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrollMinimized(false);
          setMobileNavbarHidden(false);
        }, 2000);
      }
      
      // Show navbar when scrolled back to top or scrolling up significantly
      if (currentScrollY < 40 || scrollDelta < -25) {
        setIsScrollMinimized(false);
        setMobileNavbarHidden(false);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      }
      
      lastScrollY.current = currentScrollY;
    };
    
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isMobile, open, isScrollMinimized, setMobileNavbarHidden]);

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
      {effectiveAdmin && <LazyAdminModal isOpen={isAdminOpen} onClose={closeNavbarModal} />}
      <LazyFaqModal isOpen={isFaqOpen} onClose={closeNavbarModal} />
      <LazyAffiliateModal isOpen={isAffiliateOpen} onClose={closeNavbarModal} />
      <LazyAccountManagerModal isOpen={isAccountManagerOpen} onClose={closeNavbarModal} />
      
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
        className="fixed top-0 inset-x-0 z-40 w-full px-4 pointer-events-none navbar"
        style={{
          transition: 'opacity 0.3s ease-in-out, border-color 0.4s ease-out, box-shadow 0.4s ease-out',
          transitionDelay: '0.35s', // Navbar transitions last (top element in bottom-to-top)
        }}
        data-navbar-container
        data-navbar
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
        {!isMobile && (
          <DesktopNavbar
            ref={dockRef}
            isXMUser={isXMUser}
            isAdmin={effectiveAdmin}
            hasReward={hasReward}
            dockRef={dockRef}
            buttonRefs={buttonRefs}
            onHoverChange={handleDockHoverChange}
            onAffiliateClick={openAffiliateModal}
            onFaqClick={openFaqModal}
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
        )}

        {/* MOBILE NAVBAR - CSS-based hide on scroll for smooth 60fps animation */}
        <div 
          className={`lg:hidden flex flex-col items-center w-full gap-2 pointer-events-auto transition-all duration-300 ease-out ${
            isScrollMinimized ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Mobile Nav Logo and Pill - Full width */}
          <div className="flex items-center justify-between w-full">
            {/* Logo on left */}
            <Link href="/" className="relative flex-shrink-0 w-10 h-10 block mr-2">
              <Image
                src="/ONcc2l601.svg"
                alt="BullMoney"
                fill
                className="object-cover"
                priority
              />
            </Link>
            {/* Pill - full width for mobile */}
            <div className="flex-1 flex justify-end">
              <div className="w-full" style={{ transform: 'scale(1)', transformOrigin: 'center' }}>
                <MobileMenuControls 
                  open={open} 
                  onToggle={() => { 
                    if (!open) trackEvent('menu_toggle', { type: 'mobile_menu', action: 'open' });
                    setOpen(!open);
                  }}
                  hasReward={hasReward}
                  isXMUser={isXMUser}
                  shimmerEnabled={shimmerEnabled}
                  shimmerSettings={shimmerSettings}
                  isScrollMinimized={isScrollMinimized}
                  skipHeavyEffects={shouldSkipHeavyEffects}
                  disableAnimations={isMobile}
                />
              </div>
            </div>
          </div>

          {/* ...existing code... (Mobile Nav Logo and Pill now above) */}
        </div>
      </motion.div>
      
      {/* Mobile Dropdown Menu */}
      {/* DEV ONLY: Admin visibility toggle */}
      {isDev && isAdmin && (
        <button
          onClick={() => setDevAdminEnabled(prev => !prev)}
          style={{
            position: 'fixed',
            bottom: 12,
            left: 12,
            zIndex: 9999,
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid',
            borderColor: devAdminEnabled ? '#a855f7' : '#666',
            background: devAdminEnabled ? 'rgba(168,85,247,0.15)' : 'rgba(50,50,50,0.9)',
            color: devAdminEnabled ? '#c084fc' : '#999',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          title={devAdminEnabled ? 'Click to view as non-admin' : 'Click to restore admin view'}
        >
          <span style={{ fontSize: 13 }}>{devAdminEnabled ? '🛡️' : '👤'}</span>
          {devAdminEnabled ? 'Admin ON' : 'Admin OFF'}
        </button>
      )}

      {isMobile && allowMobileLazy && open && (
        <MobileDropdownMenu
          open={open}
          onClose={() => setOpen(false)}
          isXMUser={isXMUser}
          hasReward={hasReward}
          isAdmin={effectiveAdmin}
          showAccountManager={hasAccountManagerAccess}
          onAffiliateClick={() => { trackClick('affiliate_nav', { source: 'mobile_menu' }); openAffiliateModal(); }}
          onFaqClick={() => { trackClick('faq_nav', { source: 'mobile_menu' }); openFaqModal(); }}
          onAdminClick={() => { 
            if (!effectiveAdmin) return;
            trackClick('admin_nav', { source: 'mobile_menu' }); 
            handleAdminClick(); 
          }}
          onAccountManagerClick={() => { trackClick('account_manager_nav', { source: 'mobile_menu' }); openAccountManagerModal(); }}
        />
      )}
    </>
  );
});
Navbar.displayName = 'Navbar';
