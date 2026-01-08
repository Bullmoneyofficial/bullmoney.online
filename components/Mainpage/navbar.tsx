"use client";

import React, {
  useEffect,
  useRef,
  useState,
  memo,
  useCallback,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Gift,
  ShoppingCart,
  Radio,
  Users,
  TrendingUp,
  Home,
  Layers,
  ScanFace,
  X,
  Volume2,
  VolumeX,
  Zap,
  Lock,
  Unlock,
  HelpCircle
} from "lucide-react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
// Ensure these paths exist in your project
import BullLogo from "@/public/BULL.svg";

// --- IMPORT YOUR CARD ---
import ReflectiveCard, { ReflectiveCardHandle } from '@/components/ReflectiveCard';

// --- IMPORT SOUND & HAPTIC UTILITIES ---
import { playClick, playHover, playSuccess } from '@/lib/interactionUtils';

// --- TYPE DEFINITIONS ---
type ThemeControlProps = {
  setShowConfigurator?: (show: boolean) => void;
  activeThemeId?: string;
  onThemeChange?: (themeId: string) => void;
  accentColor?: string;
  isMuted?: boolean;
  onMuteToggle?: () => void;
  disableSpline?: boolean;
  onPerformanceToggle?: () => void;
  infoPanelOpen?: boolean;
  onInfoToggle?: () => void;
  onFaqClick?: () => void;
  onControlCenterToggle?: () => void;
  showLayoutSpacer?: boolean;
};

type NavItem = {
  name: string;
  link: { pathname: string; query?: { src: string } } | string | null;
  icon: React.ReactNode;
};

// --- GLOBAL STYLES ---
const GLOBAL_STYLES = `
  .mac-gpu-accelerate {
    transform: translateZ(0);
    will-change: transform, width, height;
    backface-visibility: hidden;
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Premium shimmer animation for navbar */
  @keyframes premium-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .navbar-premium-shimmer {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(59, 130, 246, 0.15) 25%,
      rgba(59, 130, 246, 0.3) 50%,
      rgba(59, 130, 246, 0.15) 75%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: premium-shimmer 3s ease-in-out infinite;
  }

  /* Glass morphism effect */
  .navbar-glass {
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    background: rgba(255, 255, 255, 0.97);
  }

  .dark .navbar-glass {
    background: rgba(2, 6, 23, 0.97);
  }

  /* Glow effect for active states */
  @keyframes navbar-glow-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  .navbar-glow {
    animation: navbar-glow-pulse 2s ease-in-out infinite;
  }
`;

// --- DATA ---
const NAV_ITEMS: NavItem[] = [
  { name: "FREE", link: { pathname: "/about", query: { src: "nav" } }, icon: <Gift className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
  { name: "VIP SHOP", link: { pathname: "/shop", query: { src: "nav" } }, icon: <ShoppingCart className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
  { name: "NEWS & LIVES", link: { pathname: "/Blogs", query: { src: "nav" } }, icon: <Radio className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
  { name: "AFFILIATE", link: { pathname: "/recruit", query: { src: "nav" } }, icon: <Users className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
  { name: "PROP", link: { pathname: "/Prop", query: { src: "nav" } }, icon: <TrendingUp className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
];

const FOOTER_NAV_ITEMS: NavItem[] = [
  { name: "Home", link: "/", icon: <Home className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
];

// Helper to generate gradient based on current theme color
const getShimmerGradient = (color: string) => 
  `conic-gradient(from 90deg at 50% 50%, #00000000 0%, ${color} 50%, #00000000 100%)`;

// --- MAIN NAVBAR COMPONENT ---
export const Navbar = ({
  setShowConfigurator = () => {},
  accentColor = "#3b82f6",
  isMuted = false,
  onMuteToggle = () => {},
  disableSpline = false,
  onPerformanceToggle = () => {},
  infoPanelOpen = false,
  onInfoToggle = () => {},
  onFaqClick = () => {},
  onControlCenterToggle = () => {}
  , showLayoutSpacer = true
}: ThemeControlProps) => {
  // State for the Identity Card Modal
  const [showIdModal, setShowIdModal] = useState(false);

  const controlsProps = {
    isMuted,
    onMuteToggle,
    disableSpline,
    onPerformanceToggle,
    infoPanelOpen,
    onInfoToggle,
    onFaqClick,
    onControlCenterToggle,
    accentColor
  };

  return (
    <>
      <style jsx global>{GLOBAL_STYLES}</style>

      {/* Navbar Container */}
      <div
        className="relative inset-x-0 pointer-events-none select-none h-32 lg:h-24 w-full"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >

        {/* --- DESKTOP LAYOUT --- */}
        <div className="hidden lg:block">
            <div className="absolute left-10 top-6 z-[1010] pointer-events-auto">
                <AnimatedLogoWrapper accentColor={accentColor}>
                    <Image
                      src={BullLogo}
                      alt="Bull Logo"
                      width={55}
                      height={55}
                      className="object-contain"
                      priority
                    />
                    <span className="font-black text-2xl tracking-tighter text-neutral-900 dark:text-white">
                      BULLMONEY
                    </span>
                </AnimatedLogoWrapper>
            </div>
            <div className="flex justify-center w-full relative pt-6">
                <DesktopNav
                  setShowConfigurator={setShowConfigurator}
                  setShowIdModal={setShowIdModal}
                  {...controlsProps}
                />
            </div>
        </div>

        {/* --- MOBILE/TAB LAYOUT --- */}
        {/* Enhanced mobile layout with premium styling */}
        <div className="lg:hidden flex flex-col w-full px-2 sm:px-3 pt-2 sm:pt-3 z-[1010] relative gap-2">
            {/* Mobile Header Row */}
            <div className="flex justify-between items-center w-full gap-2">
              {/* Logo Section */}
              <div className="pointer-events-auto shrink-0 relative z-[60]">
                 <Link href="/" className="no-underline">
                   <AnimatedLogoWrapper accentColor={accentColor}>
                       <Image
                          src={BullLogo}
                          alt="Bull Logo"
                          width={36}
                          height={36}
                          className="object-contain shrink-0"
                          priority
                       />
                       <span className="font-black text-sm sm:text-base tracking-tighter text-neutral-900 dark:text-white whitespace-nowrap">
                          BULLMONEY
                       </span>
                   </AnimatedLogoWrapper>
                 </Link>
              </div>

              {/* Mobile Nav Section */}
              <div className="pointer-events-auto flex justify-end min-w-0 flex-1 relative z-[60] overflow-visible">
                 <MobileNav
                   setShowConfigurator={setShowConfigurator}
                   setShowIdModal={setShowIdModal}
                   {...controlsProps}
                 />
              </div>
            </div>
        </div>
      </div>

      {showLayoutSpacer && <div className="w-full h-32 lg:h-24" aria-hidden="true" />}

      {/* --- ID CARD MODAL --- */}
      <IdModal isOpen={showIdModal} onClose={() => setShowIdModal(false)} accentColor={accentColor} />
    </>
  );
};

// --- ID MODAL COMPONENT ---
const IdModal = ({ isOpen, onClose, accentColor }: { isOpen: boolean, onClose: () => void, accentColor: string }) => {
  const cardRef = useRef<ReflectiveCardHandle>(null);
  const [isVerified, setIsVerified] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[2001] flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto relative">
              {/* Close Button */}
              <button
                onClick={() => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate(10);
                  onClose();
                }}
                onTouchStart={(e) => {
                  playHover();
                  e.currentTarget.style.transform = 'scale(0.9)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = '';
                }}
                className="absolute -right-12 top-0 p-2 text-white/50 hover:text-white transition-all z-50 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation active:scale-90"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <X size={32} />
              </button>

              {/* The Reflective Card */}
              <ReflectiveCard 
                ref={cardRef}
                onVerificationComplete={() => setIsVerified(true)}
                blurStrength={10}
                style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}
              />

              {/* External Trigger Button (Colored) */}
              {!isVerified && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => {
                    playSuccess();
                    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                    cardRef.current?.triggerVerify();
                  }}
                  onTouchStart={(e) => {
                    playHover();
                    e.currentTarget.style.transform = 'translateX(-50%) scale(0.95)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                  }}
                  style={{
                    backgroundColor: accentColor,
                    boxShadow: `0 0 20px ${accentColor}60`,
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer touch-manipulation min-h-[44px]"
                >
                  <ScanFace size={20} />
                  <span>START VERIFICATION</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- DESKTOP NAV ---
const DesktopNav = memo(({ setShowConfigurator, setShowIdModal, accentColor, isMuted, onMuteToggle, disableSpline, onPerformanceToggle, infoPanelOpen, onInfoToggle, onFaqClick, onControlCenterToggle }: any) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative flex items-center gap-4 pointer-events-auto px-6 py-2 rounded-2xl transition-all duration-300 navbar-glass border border-neutral-200/50 dark:border-white/20 shadow-2xl overflow-hidden group"
      style={{
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px ${accentColor}20, 0 0 20px ${accentColor}10`
      }}
    >
      {/* Premium shimmer overlay */}
      <div className="absolute inset-0 navbar-premium-shimmer pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Accent glow line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] navbar-glow"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          boxShadow: `0 0 8px ${accentColor}`
        }}
      />

      <Dock
        items={NAV_ITEMS}
        setShowConfigurator={setShowConfigurator}
        setShowIdModal={setShowIdModal}
        accentColor={accentColor}
      />

      <div className="flex justify-end ml-2 gap-2 items-center border-l border-neutral-200/50 dark:border-white/20 pl-4">
        {/* Control Buttons */}
        <ControlButtons
          isMuted={isMuted}
          onMuteToggle={onMuteToggle}
          disableSpline={disableSpline}
          onPerformanceToggle={onPerformanceToggle}
          infoPanelOpen={infoPanelOpen}
          onInfoToggle={onInfoToggle}
          onFaqClick={onFaqClick}
          onControlCenterToggle={onControlCenterToggle}
          accentColor={accentColor}
        />
      </div>
    </motion.div>
  );
});
DesktopNav.displayName = "DesktopNav";

// --- DOCK COMPONENT ---
const Dock = memo(({ items, setShowConfigurator, setShowIdModal, accentColor }: { items: NavItem[], setShowConfigurator: (s: boolean) => void, setShowIdModal: (s: boolean) => void, accentColor: string }) => {
  const mouseX = useMotionValue(Infinity);
  // Total items = NAV_ITEMS + ID + Theme
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  // BUG FIX #9: Properly clean up interval on unmount
  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % (items.length + 2));
    }, 4000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [items.length]);

  const themeItemData: NavItem = {
    name: "THEME",
    icon: <Layers className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    link: null
  };

  const idItemData: NavItem = {
    name: "DIGITAL ID",
    icon: <ScanFace className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    link: null
  };

  return (
    <div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-2 flex h-[50px] items-end gap-3 px-2"
    >
      {/* Standard Items */}
      {items.map((item, i) => (
        <DockItem 
          key={i} 
          mouseX={mouseX} 
          item={item} 
          isTipActive={i === activeTipIndex} 
          accentColor={accentColor}
        />
      ))}

      {/* ID Button */}
      <DockItem 
        mouseX={mouseX}
        item={idItemData}
        isTipActive={activeTipIndex === items.length}
        onClick={() => setShowIdModal(true)}
        accentColor={accentColor}
      />

      {/* Theme Button */}
      <DockItem 
        mouseX={mouseX}
        item={themeItemData}
        isTipActive={activeTipIndex === items.length + 1}
        onClick={() => setShowConfigurator(true)}
        accentColor={accentColor}
      />
    </div>
  );
});
Dock.displayName = "Dock";

// --- DOCK ITEM ---
interface DockItemProps {
    mouseX: any;
    item: NavItem;
    isTipActive: boolean;
    onClick?: () => void;
    accentColor: string;
}

const DockItem = memo(({ mouseX, item, isTipActive, onClick, accentColor }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-120, 0, 120], [45, 70, 45]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 12 });
  const [hovered, setHovered] = useState(false);

  const handleHoverStart = () => {
    setHovered(true);
    playHover();
  };

  const handleClick = (e: React.MouseEvent) => {
    playClick();
    if (navigator.vibrate) navigator.vibrate(10);
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const content = (
    <>
      <motion.div
        ref={ref}
        style={{
          width,
          height: width,
          ...(( item as any).glow && { filter: `drop-shadow(0 0 6px ${(item as any).color || accentColor})` })
        }}
        onHoverStart={handleHoverStart}
        onHoverEnd={() => setHovered(false)}
        onTouchStart={handleHoverStart}
        className={`mac-gpu-accelerate relative flex items-center justify-center rounded-full shadow-sm overflow-hidden z-20 cursor-pointer active:scale-90 transition-transform touch-manipulation ${
          (item as any).glow ? 'shadow-[0_0_12px_currentColor]' : ''
        }`}
      >
        {/* THEMED SHIMMER GRADIENT */}
        <motion.div
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: (item as any).glow ? 2 : 3, repeat: Infinity, ease: "linear" }}
            style={{ background: getShimmerGradient((item as any).color || accentColor) }}
        />
        <div className="absolute inset-[1.5px] rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center z-10">
            <div className="w-5 h-5 relative flex items-center justify-center" style={{ color: (item as any).color || 'inherit' }}>
                {item.icon}
            </div>
        </div>

        {/* Badge for performance indicators */}
        {(item as any).badge && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center z-30 animate-pulse"
               style={{ backgroundColor: (item as any).color || accentColor }}>
            <span className="text-[10px]">{(item as any).badge}</span>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="absolute -top-10 left-1/2 px-2 py-0.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-bold rounded shadow-sm whitespace-nowrap z-30"
          >
            {item.name}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!hovered && isTipActive && (
          <HelperTip item={item} accentColor={accentColor} />
        )}
      </AnimatePresence>
    </>
  );

  if (onClick) {
    return (
        <button
          onClick={handleClick}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.9)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = '';
          }}
          className="relative group flex flex-col items-center justify-end outline-none min-w-[44px] min-h-[44px] touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            {content}
        </button>
    );
  }

  // Handle link correctly if link is null (fallback)
  if (!item.link) return <button className="relative group flex flex-col items-center justify-end min-w-[44px] min-h-[44px]">{content}</button>;

  return (
    <Link
      href={item.link as any}
      onClick={() => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(10);
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = '';
      }}
      className="no-underline relative group flex flex-col items-center justify-end min-w-[44px] min-h-[44px] touch-manipulation active:scale-90 transition-transform"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {content}
    </Link>
  );
});
DockItem.displayName = "DockItem";

// --- MOBILE NAV ---
const MobileNav = memo(({ setShowConfigurator, setShowIdModal, accentColor, isMuted, onMuteToggle, disableSpline, onPerformanceToggle, infoPanelOpen, onInfoToggle, onFaqClick, onControlCenterToggle: _onControlCenterToggle }: any) => {
  const [open, setOpen] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  const themeItem: NavItem = {
    name: "THEME",
    link: null,
    icon: <Layers className="h-full w-full text-neutral-500 dark:text-neutral-300" />
  };

  const idItem: NavItem = {
    name: "ID",
    link: null,
    icon: <ScanFace className="h-full w-full text-neutral-500 dark:text-neutral-300" />
  };

  // Control items for mobile nav
  const controlItems = [
    {
      name: "INFO",
      icon: infoPanelOpen ? <Unlock className="h-full w-full" /> : <Lock className="h-full w-full" />,
      onClick: onInfoToggle,
      color: accentColor
    },
    {
      name: isMuted ? "UNMUTE" : "MUTE",
      icon: isMuted ? <VolumeX className="h-full w-full" /> : <Volume2 className="h-full w-full" />,
      onClick: onMuteToggle,
      color: isMuted ? 'rgba(239, 68, 68, 1)' : accentColor
    },
    {
      name: disableSpline ? "PERF" : "3D",
      icon: <Zap className="h-full w-full" />,
      onClick: () => {
        playSuccess();
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        onPerformanceToggle();
      },
      color: disableSpline ? '#f97316' : '#3b82f6',
      badge: disableSpline ? '⚡' : '✨',
      glow: true
    },
    {
      name: "HELP",
      icon: <HelpCircle className="h-full w-full" />,
      onClick: onFaqClick,
      color: accentColor
    }
  ];

  // BUG FIX #9: Properly clean up interval on unmount
  useEffect(() => {
    // Total items: NAV_ITEMS + controlItems + Theme + ID
    const totalItems = NAV_ITEMS.length + controlItems.length + 2;
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % totalItems);
    }, 4000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [controlItems.length]);

  const handleOpenConfigurator = useCallback(() => {
    setOpen(false);
    setShowConfigurator(true);
  }, [setShowConfigurator]);

  const handleOpenId = useCallback(() => {
    setOpen(false);
    setShowIdModal(true);
  }, [setShowIdModal]);

  return (
    <motion.div
      animate={{ width: "auto" }}
      className="relative flex flex-col items-end navbar-glass border border-neutral-200/50 dark:border-white/20 shadow-2xl rounded-2xl max-w-full group"
      style={{
        maxWidth: 'min(100vw - 12px, 680px)',
        marginRight: 'env(safe-area-inset-right, 0px)',
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px ${accentColor}20, 0 0 20px ${accentColor}10`,
        // FIXED: Allow overflow so expanded menu is visible
        overflow: open ? 'visible' : 'hidden'
      }}
    >
      {/* Premium shimmer overlay for mobile */}
      <div className="absolute inset-0 navbar-premium-shimmer pointer-events-none opacity-0 group-active:opacity-100 transition-opacity duration-300" />

      {/* Accent glow line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] navbar-glow"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          boxShadow: `0 0 8px ${accentColor}`
        }}
      />
      <div className="flex items-center gap-1.5 p-1.5 relative z-20 max-w-full">
         {/* Enhanced scroll indicator for mobile nav */}
         <div className="absolute left-0 right-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent md:hidden overflow-hidden">
           <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" style={{
             boxShadow: `0 0 8px ${accentColor}`
           }} />
         </div>
         {/* BUG FIX #10: Fixed scrollable area width calculation */}
         <div
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto scroll-smooth pr-1 pb-2 no-scrollbar max-w-full"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              // Adaptive max width based on viewport
              maxWidth: 'min(calc(100vw - 32px), 620px)',
            }}
         >
            {/* 1. Loop standard items */}
            {NAV_ITEMS.map((item, i) => (
               <Link
                 key={i}
                 href={item.link as any}
                 ref={(el) => { itemsRef.current[i] = el; }}
                 onClick={() => {
                   playClick();
                   if (navigator.vibrate) navigator.vibrate(10);
                 }}
                 onTouchStart={(e) => {
                   playHover();
                   e.currentTarget.style.transform = 'scale(0.9)';
                 }}
                 onTouchEnd={(e) => {
                   e.currentTarget.style.transform = '';
                 }}
                 className="relative flex-shrink-0 flex flex-col items-center group pt-1 min-w-[44px] touch-manipulation active:scale-90 transition-transform"
                 style={{ WebkitTapHighlightColor: 'transparent' }}
               >
                  <MobileNavItemContent item={item} accentColor={accentColor} />
                  <AnimatePresence>
                     {activeTipIndex === i && <HelperTip item={item} isMobile accentColor={accentColor} />}
                  </AnimatePresence>
               </Link>
            ))}

            {/* 2. Add Control Buttons */}
            {controlItems.map((item, i) => {
              const currentIndex = NAV_ITEMS.length + i;
              return (
                <button
                  key={`control-${i}`}
                  onClick={() => {
                    playClick();
                    if (navigator.vibrate) navigator.vibrate(15);
                    item.onClick();
                  }}
                  onTouchStart={(e) => {
                    playHover();
                    e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                  ref={(el) => { itemsRef.current[currentIndex] = el; }}
                  className="relative flex-shrink-0 flex flex-col items-center group pt-1 min-w-[44px] touch-manipulation active:scale-90 transition-transform"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <MobileNavItemContent
                    item={{ name: item.name, icon: item.icon, link: null }}
                    accentColor={item.color}
                  />
                  <AnimatePresence>
                    {activeTipIndex === currentIndex && (
                      <HelperTip
                        item={{ name: item.name, icon: item.icon, link: null }}
                        isMobile
                        accentColor={item.color}
                      />
                    )}
                  </AnimatePresence>
                </button>
              );
            })}

            {/* 3. Add ID Button */}
            <button
                onClick={() => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate(15);
                  handleOpenId();
                }}
                onTouchStart={(e) => {
                  playHover();
                  e.currentTarget.style.transform = 'scale(0.9)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = '';
                }}
                ref={(el) => { itemsRef.current[NAV_ITEMS.length + controlItems.length] = el; }}
                className="relative flex-shrink-0 flex flex-col items-center group pt-1 min-w-[44px] touch-manipulation active:scale-90 transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <MobileNavItemContent item={idItem} accentColor={accentColor} />
                <AnimatePresence>
                     {activeTipIndex === NAV_ITEMS.length + controlItems.length && <HelperTip item={idItem} isMobile accentColor={accentColor} />}
                </AnimatePresence>
            </button>

            {/* 4. Add Theme Button */}
            <button
                onClick={() => {
                  playClick();
                  if (navigator.vibrate) navigator.vibrate(15);
                  handleOpenConfigurator();
                }}
                onTouchStart={(e) => {
                  playHover();
                  e.currentTarget.style.transform = 'scale(0.9)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = '';
                }}
                ref={(el) => { itemsRef.current[NAV_ITEMS.length + controlItems.length + 1] = el; }}
                className="relative flex-shrink-0 flex flex-col items-center group pt-1 min-w-[44px] touch-manipulation active:scale-90 transition-transform"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <MobileNavItemContent item={themeItem} accentColor={accentColor} />
                <AnimatePresence>
                     {activeTipIndex === NAV_ITEMS.length + controlItems.length + 1 && <HelperTip item={themeItem} isMobile accentColor={accentColor} />}
                </AnimatePresence>
            </button>
         </div>

         {/* ... Menu Toggle Button ... */}
         <div className="flex-shrink-0 flex items-center pl-1 border-l border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 z-30 h-8 self-start mt-1">
            <button
              onClick={() => {
                playClick();
                if (navigator.vibrate) navigator.vibrate(15);
                setOpen(!open);
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
                playHover();
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = '';
              }}
              className="p-1 ml-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-90 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                {open ? <IconX className="w-5 h-5 dark:text-white" /> : <IconMenu2 className="w-5 h-5 dark:text-white" />}
            </button>
         </div>
      </div>

      {/* ... Expanded Menu ... */}
      {/* FIXED: Enhanced mobile menu expansion with better visibility and z-index */}
      <AnimatePresence>
        {open && (
           <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute top-full left-0 right-0 mt-1 min-w-[200px] max-w-full overflow-visible rounded-2xl shadow-2xl"
            style={{
              // FIXED: Much higher z-index to ensure visibility above all content
              zIndex: 999999,
              // Ensure it doesn't overflow viewport
              maxHeight: 'calc(100vh - 120px)',
            }}
          >
            <div className="px-4 pb-4 pt-2 flex flex-col gap-3 border-t border-neutral-100 dark:border-white/5 w-full bg-white/98 dark:bg-neutral-950/98 backdrop-blur-xl overflow-y-auto max-h-[70vh] shadow-2xl rounded-2xl"
                 style={{
                   // Additional shadow for visibility
                   boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 }}>
               {[...FOOTER_NAV_ITEMS, ...NAV_ITEMS].map((item, i) => (
                  <Link
                    key={i}
                    href={item.link as any}
                    onClick={() => {
                      playClick();
                      if (navigator.vibrate) navigator.vibrate(12);
                      setOpen(false);
                    }}
                    onTouchStart={(e) => {
                      playHover();
                      e.currentTarget.style.transform = 'scale(0.97)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = '';
                    }}
                    className="relative group block rounded-xl overflow-hidden touch-manipulation active:scale-95 transition-transform"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                     <div className="relative m-[1px] bg-white dark:bg-neutral-900 rounded-xl flex items-center gap-4 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <div className="w-8 h-8 p-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-md group-hover:scale-110 transition-transform">{item.icon}</div>
                        <span className="font-bold text-neutral-600 dark:text-neutral-300">{item.name}</span>
                     </div>
                  </Link>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
MobileNav.displayName = "MobileNav";

// --- SUB COMPONENTS (Helpers) ---
const MobileNavItemContent = ({ item, accentColor }: { item: NavItem, accentColor: string }) => (
    <div className="w-8 h-8 relative flex items-center justify-center rounded-full overflow-hidden shadow-sm z-20">
        <motion.div
        className="absolute inset-[-100%]" 
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ background: getShimmerGradient(accentColor) }}
        />
        <div className="absolute inset-[1.5px] rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center z-10">
            <div className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-300">
                {item.icon}
            </div>
        </div>
    </div>
);

const HelperTip = ({ item, isMobile = false, accentColor }: { item: NavItem, isMobile?: boolean, accentColor: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -5, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -5, scale: 0.8 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    className={`${isMobile ? 'fixed' : 'absolute'} ${
      isMobile
        ? 'top-[calc(env(safe-area-inset-top,0px)+9rem)]'
        : 'top-full mt-2'
    } ${
      isMobile
        ? 'left-1/2 -translate-x-1/2'
        : 'left-1/2 -translate-x-1/2'
    } ${
      isMobile ? 'z-[999999]' : 'z-[60]'
    } flex flex-col items-center pointer-events-none`}
    style={isMobile ? {
      position: 'fixed',
      maxWidth: 'calc(100vw - 32px)',
    } : undefined}
  >
    <div className="w-2 h-2 bg-neutral-900 dark:bg-white rotate-45 translate-y-[4px] relative z-10 border-t border-l border-transparent" />
    <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-2xl">
        <motion.div
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: getShimmerGradient(accentColor) }}
        />
        <div className="relative z-10 px-2.5 py-0.5 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-white dark:text-neutral-900 text-[9px] font-bold whitespace-nowrap">
                Click {item.name}
            </span>
        </div>
    </div>
  </motion.div>
);

const AnimatedLogoWrapper = ({ children, accentColor }: { children: React.ReactNode, accentColor: string }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    style={{ filter: `drop-shadow(0 0 10px ${accentColor}40)` }}
    className="hover:scale-105 transition-transform duration-200 active:scale-95 cursor-pointer flex items-center gap-2 lg:gap-3"
  >
    {children}
  </motion.div>
);

// --- CONTROL BUTTONS COMPONENT ---
const ControlButtons = memo(({ isMuted, onMuteToggle, disableSpline, onPerformanceToggle, infoPanelOpen, onInfoToggle, onFaqClick, onControlCenterToggle: _onControlCenterToggle, accentColor }: any) => {
  const controlButtons = [
    {
      icon: infoPanelOpen ? Unlock : Lock,
      onClick: () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(15);
        onInfoToggle();
      },
      label: infoPanelOpen ? '🔓 Page Info Unlocked' : '🔒 Unlock Page Info',
      color: accentColor,
      isActive: infoPanelOpen,
    },
    {
      icon: isMuted ? VolumeX : Volume2,
      onClick: () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(10);
        onMuteToggle();
      },
      label: isMuted ? '🔇 Audio Muted (Click to Unmute)' : '🔊 Audio Playing',
      color: isMuted ? 'rgba(239, 68, 68, 1)' : accentColor,
      isActive: !isMuted,
    },
    {
      icon: Zap,
      onClick: () => {
        playClick();
        playSuccess(); // Added success sound for mode toggle
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]); // Double pulse for mode change
        onPerformanceToggle();
      },
      label: disableSpline ? '⚡ Performance Mode → Click for Full 3D Experience' : '✨ Full 3D Mode → Click for Maximum Performance',
      color: disableSpline ? '#f97316' : '#10b981', // Orange for performance, Green for 3D
      badge: disableSpline ? '⚡' : '✨',
      glowEffect: true,
      isPremium: true,
    },
    {
      icon: HelpCircle,
      onClick: () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(15);
        onFaqClick();
      },
      label: '❓ Help & FAQ',
      color: accentColor,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {controlButtons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          onMouseEnter={() => playHover()}
          onTouchStart={(e) => {
            playHover();
            e.currentTarget.style.transform = 'scale(0.9)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = '';
          }}
          className={`relative w-9 h-9 rounded-full overflow-hidden shadow-sm hover:scale-110 active:scale-95 transition-all touch-manipulation group ${
            button.glowEffect ? 'shadow-[0_0_20px_currentColor]' : ''
          } ${button.isActive ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900' : ''}`}
          style={{
            WebkitTapHighlightColor: 'transparent',
            color: button.color,
            ...(button.glowEffect && { filter: `drop-shadow(0 0 12px ${button.color})` }),
            ...(button.isActive && { ringColor: button.color })
          }}
          aria-label={button.label}
          title={button.label}
        >
          <motion.div
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{
              duration: button.isPremium ? 1.5 : (button.glowEffect ? 2 : 3),
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ background: getShimmerGradient(button.color) }}
          />
          <div className={`absolute inset-[1.5px] rounded-full flex items-center justify-center z-10 transition-all ${
            button.isActive ? 'bg-gray-50 dark:bg-neutral-700' : 'bg-gray-100 dark:bg-neutral-800'
          }`}>
            <button.icon
              size={16}
              style={{ color: button.color }}
              className={`${button.glowEffect ? 'drop-shadow-[0_0_6px_currentColor]' : ''} ${button.isActive ? 'scale-110' : ''} transition-transform`}
            />
          </div>

          {/* Badge for performance modes */}
          {button.badge && (
            <div
              className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full z-20 animate-pulse"
              style={{
                backgroundColor: button.color,
                boxShadow: `0 0 10px ${button.color}`
              }}
            >
              <span className="text-[9px] font-black text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {button.badge}
              </span>
            </div>
          )}

          {/* Active indicator ring */}
          {button.isActive && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 pointer-events-none"
              style={{ borderColor: button.color }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Enhanced Tooltip with premium styling */}
          <div
            className="absolute -bottom-14 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 border max-w-[200px]"
            style={{
              background: `linear-gradient(135deg, ${button.color}15, ${button.color}05)`,
              borderColor: `${button.color}40`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-neutral-900 dark:text-white block">
                {button.label}
              </span>
            </div>
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
              style={{
                background: `linear-gradient(135deg, ${button.color}15, ${button.color}05)`,
                borderLeft: `1px solid ${button.color}40`,
                borderTop: `1px solid ${button.color}40`
              }}
            />
          </div>
        </button>
      ))}
    </div>
  );
});
ControlButtons.displayName = "ControlButtons";
