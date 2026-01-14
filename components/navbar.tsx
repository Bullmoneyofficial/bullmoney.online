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
} from "react";
import Link from "next/link";
import Image from "next/image";

import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";

// --- IMPORT CONTEXT ---
import { useStudio } from "@/context/StudioContext";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";
import { useCacheContext } from "@/components/CacheManagerProvider";

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
  shimmerSettings = { intensity: 'medium' as const, speed: 'normal' as const }
}: any) => (
  <div 
    className="relative group rounded-full overflow-hidden shadow-2xl z-50 h-12 sm:h-14 flex items-center flex-grow max-w-xs mobile-controls-glass navbar-shimmer"
  >
    {/* Unified Shimmer Border - GPU accelerated, LEFT TO RIGHT */}
    {shimmerEnabled && <ShimmerBorder color="blue" intensity={shimmerSettings.intensity} speed={shimmerSettings.speed} />}

    {/* Inner Content Container */}
    <div 
      className="relative h-full w-full bg-black/95 dark:bg-black/95 backdrop-blur-xl rounded-full p-[2px] flex items-center justify-center gap-1 px-2 sm:px-3 border-2 border-blue-500/60 dark:border-blue-500/60 transition-all duration-300 group-hover:border-blue-400/80 group-hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] z-10"
    >
      {/* Theme Selector Button */}
      <motion.button
        onClick={() => { SoundEffects.click(); onThemeClick(); }}
        onMouseEnter={() => SoundEffects.hover()}
        onTouchStart={() => SoundEffects.click()}
        whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.15)" }}
        whileTap={{ scale: 0.95 }}
        className="p-1.5 rounded-full text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
        title="Theme Selector"
      >
        <IconPalette className="h-4 w-4 sm:h-5 sm:w-5" />
      </motion.button>

      {/* Divider */}
      <div className="h-4 w-[1px] bg-gradient-to-b from-blue-500/20 via-blue-500/40 to-blue-500/20 dark:bg-blue-500/20" />

      {/* Menu Toggle Button */}
      <motion.button
        onClick={() => { SoundEffects.click(); onToggle(); }}
        onMouseEnter={() => SoundEffects.hover()}
        onTouchStart={() => SoundEffects.click()}
        whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.15)" }}
        whileTap={{ scale: 0.95 }}
        className="p-1.5 rounded-full text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
        title={open ? 'Close menu' : 'Open menu'}
      >
        <div className="relative flex items-center justify-center">
          {open ? <IconX className="h-4 w-4 sm:h-5 sm:w-5" /> : <IconMenu2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          {hasReward && !open && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="shimmer-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
        </div>
      </motion.button>
    </div>
  </div>
));
MobileMenuControls.displayName = 'MobileMenuControls';

// --- MAIN NAVBAR COMPONENT ---
export const Navbar = memo(() => {
  // --- ALL HOOKS AT TOP LEVEL (REQUIRED BY REACT) ---
  const { isXMUser, activeTheme, isAppLoading, isMobile } = useGlobalTheme();
  const { tipsMuted } = useAudioSettings();
  const { deviceTier, isSafari } = useCacheContext();
  
  // Unified Performance System - single source for lifecycle & shimmer
  const navbarPerf = useComponentLifecycle('navbar', 10); // Priority 10 (highest)
  
  // Crash tracking for all navbar interactions
  const { trackClick, trackError, trackCustom } = useComponentTracking('navbar');
  
  // FPS Optimizer integration for component lifecycle tracking (legacy support)
  const { registerComponent, unregisterComponent, shouldEnableShimmer } = useFpsOptimizer();
  const shimmerSettings = useOptimizedShimmer();
  
  // Check if shimmer should be enabled for navbar - use unified system
  const shimmerEnabled = navbarPerf.shimmerEnabled && !shimmerSettings.disabled;
  
  // Modal states
  const [open, setOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isAffiliateOpen, setIsAffiliateOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  
  // Hydration
  const [mounted, setMounted] = useState(false);
  
  // Rotating tips state
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);
  
  // Dock hover state
  const [isDockHovered, setIsDockHovered] = useState(false);
  
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
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <BullMoneyModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
      <AffiliateModal isOpen={isAffiliateOpen} onClose={() => setIsAffiliateOpen(false)} />
      <ThemeSelectorModal isOpen={isThemeSelectorOpen} onClose={() => setIsThemeSelectorOpen(false)} />
      
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
          onHoverChange={setIsDockHovered}
          onAffiliateClick={() => setIsAffiliateOpen(true)}
          onFaqClick={() => setIsFaqOpen(true)}
          onThemeClick={() => setIsThemeSelectorOpen(true)}
          onAdminClick={() => setIsAdminOpen(true)}
          mounted={mounted}
        />

        {/* MOBILE NAVBAR */}
        <div className="lg:hidden flex flex-row items-center justify-between w-full px-2 sm:px-4 pointer-events-auto gap-2">
          {/* Logo */}
          <div className="relative flex items-center justify-center overflow-hidden h-16 w-16 sm:h-20 sm:w-20 z-50 flex-shrink-0">
            <Link href="/" className="relative w-full h-full block">
              <Image
                src="/BULL.svg"
                alt="BullMoney"
                fill
                className="object-cover"
                priority
              />
            </Link>
          </div>

          {/* Mobile Controls */}
          <MobileMenuControls 
            open={open} 
            onToggle={() => setOpen(!open)}
            onThemeClick={() => { setOpen(false); setIsThemeSelectorOpen(true); }}
            hasReward={hasReward}
            isXMUser={isXMUser}
            shimmerEnabled={shimmerEnabled}
            shimmerSettings={shimmerSettings}
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
        onAffiliateClick={() => setIsAffiliateOpen(true)}
        onFaqClick={() => setIsFaqOpen(true)}
        onAdminClick={() => setIsAdminOpen(true)}
        onThemeClick={() => setIsThemeSelectorOpen(true)}
      />
    </>
  );
});
Navbar.displayName = 'Navbar';
