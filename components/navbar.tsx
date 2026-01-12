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
} from "react";
import Link from "next/link";
import Image from "next/image";

import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";

// --- IMPORT CONTEXT ---
import { useStudio } from "@/context/StudioContext";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";

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
import { NAVBAR_THEME_FILTER_MAP, NAVBAR_TRADING_TIPS } from "./navbar/navbar.utils";

// --- IMPORT NAVBAR CSS ---
import "./navbar.css";

// --- MOBILE MENU CONTROLS COMPONENT ---
const MobileMenuControls = ({ 
  open, 
  onToggle, 
  onThemeClick, 
  hasReward,
  isXMUser
}: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.2 }}
    className="relative group rounded-full overflow-hidden shadow-2xl z-50 h-12 sm:h-14 flex items-center flex-grow max-w-xs mobile-controls-glass shimmer-border"
  >
    {/* Gradient Shimmer Background Layer */}
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      className="absolute inset-[-100%] bg-gradient-to-r from-blue-600/0 via-blue-500/30 to-blue-600/0 opacity-100"
    />

    {/* Inner Content Container */}
    <motion.div 
      className="relative h-full w-full bg-black/40 dark:bg-black/40 backdrop-blur-3xl rounded-full p-[2px] flex items-center justify-center gap-1 px-2 sm:px-3 border border-blue-500/40 dark:border-blue-500/40 transition-all duration-300 group-hover:border-blue-400/70"
      whileHover={{ boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="h-4 w-[1px] bg-gradient-to-b from-blue-500/20 via-blue-500/40 to-blue-500/20 dark:bg-blue-500/20"
      />

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
        <motion.div 
          className="relative flex items-center justify-center"
          whileHover={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.3 }}
        >
          {open ? <IconX className="h-4 w-4 sm:h-5 sm:w-5" /> : <IconMenu2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          {hasReward && !open && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="absolute -top-0.5 -right-0.5 flex h-2 w-2"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </motion.span>
          )}
        </motion.div>
      </motion.button>
    </motion.div>
  </motion.div>
);

// --- MAIN NAVBAR COMPONENT ---
export const Navbar = () => {
  // --- ALL HOOKS AT TOP LEVEL (REQUIRED BY REACT) ---
  const { isXMUser, activeThemeId, isAppLoading } = useGlobalTheme();
  
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

  // Rotate tips every 5 seconds
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setShowTip(false);
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % NAVBAR_TRADING_TIPS.length);
        setShowTip(true);
      }, 300);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [mounted]);

  // Early return if app is still loading
  if (isAppLoading) {
    return null;
  }
  
  // Get CSS filter for current theme
  const themeFilter = NAVBAR_THEME_FILTER_MAP[activeThemeId || 'DEFAULT'] || NAVBAR_THEME_FILTER_MAP['DEFAULT'];

  // Check for reward
  const hasReward = (userProfile?.stamps || 0) >= 5;

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          100% { transform: translateX(150%); }
        }
      `}</style>

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
};
