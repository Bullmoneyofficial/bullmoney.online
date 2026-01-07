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
import Faq from "@/app/shop/Faq";

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
        className="fixed top-0 inset-x-0 z-[1000] pointer-events-none select-none h-32 lg:h-24"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)'
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
        <div className="lg:hidden flex justify-between items-start w-full px-2 sm:px-4 pt-2 sm:pt-4 z-[1010]">
            <div className="pointer-events-auto pt-2 shrink-0 relative z-50">
               <AnimatedLogoWrapper accentColor={accentColor}>
                   <Image
                      src={BullLogo}
                      alt="Bull Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                      priority
                   />
                   <span className="font-black text-base sm:text-xl tracking-tighter text-neutral-900 dark:text-white whitespace-nowrap">
                      BULLMONEY
                   </span>
               </AnimatedLogoWrapper>
            </div>

            <div className="pointer-events-auto ml-2 flex justify-end min-w-0 flex-1 relative z-50">
               <MobileNav
                 setShowConfigurator={setShowConfigurator}
                 setShowIdModal={setShowIdModal}
                 {...controlsProps}
               />
            </div>
        </div>
      </div>

      <div className="w-full h-32 lg:h-24" aria-hidden="true" />

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
      className="flex items-center gap-4 pointer-events-auto px-6 py-2 rounded-2xl transition-colors duration-300 bg-white/95 dark:bg-neutral-950/95 border border-neutral-200 dark:border-white/10 shadow-xl"
    >
      <Dock
        items={NAV_ITEMS}
        setShowConfigurator={setShowConfigurator}
        setShowIdModal={setShowIdModal}
        accentColor={accentColor}
      />

      <div className="flex justify-end ml-2 gap-2 items-center border-l border-neutral-200 dark:border-white/10 pl-4">
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
        <div className="hidden md:block ml-2 pl-2 border-l border-neutral-200 dark:border-white/10">
            <Faq />
        </div>
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % (items.length + 2));
    }, 4000); 
    return () => clearInterval(intervalId);
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
        style={{ width, height: width }}
        onHoverStart={handleHoverStart}
        onHoverEnd={() => setHovered(false)}
        onTouchStart={handleHoverStart}
        className="mac-gpu-accelerate relative flex items-center justify-center rounded-full shadow-sm overflow-hidden z-20 cursor-pointer active:scale-90 transition-transform touch-manipulation"
      >
        {/* THEMED SHIMMER GRADIENT */}
        <motion.div
            className="absolute inset-[-100%]" 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: getShimmerGradient(accentColor) }}
        />
        <div className="absolute inset-[1.5px] rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center z-10">
            <div className="w-5 h-5 relative flex items-center justify-center">
                {item.icon}
            </div>
        </div>
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
      onClick={(e) => {
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
const MobileNav = memo(({ setShowConfigurator, setShowIdModal, accentColor, isMuted, onMuteToggle, disableSpline, onPerformanceToggle, infoPanelOpen, onInfoToggle, onFaqClick, onControlCenterToggle }: any) => {
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
      name: "3D",
      icon: <Zap className="h-full w-full" />,
      onClick: onPerformanceToggle,
      color: disableSpline ? accentColor : 'rgba(255,255,255,0.9)'
    },
    {
      name: "HELP",
      icon: <HelpCircle className="h-full w-full" />,
      onClick: onFaqClick,
      color: accentColor
    }
  ];

  useEffect(() => {
    // Total items: NAV_ITEMS + controlItems + Theme + ID
    const totalItems = NAV_ITEMS.length + controlItems.length + 2;
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % totalItems);
    }, 4000);
    return () => clearInterval(intervalId);
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
      className="flex flex-col items-end bg-white/95 dark:bg-neutral-950/95 border border-neutral-200 dark:border-white/10 shadow-lg rounded-2xl relative max-w-full"
    >
      <div className="flex items-center gap-1.5 p-1.5 relative z-20 max-w-full">
         {/* Scroll indicator for mobile nav */}
         <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-white/10 md:hidden">
           <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
         </div>
         <div
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto scroll-smooth pr-1 pb-2 max-w-[45vw] sm:max-w-[55vw] md:max-w-none no-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
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
      <AnimatePresence>
        {open && (
           <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full min-w-[200px] overflow-hidden rounded-b-2xl relative z-40" 
          >
            <div className="px-4 pb-4 pt-2 flex flex-col gap-3 border-t border-neutral-100 dark:border-white/5 w-full bg-white/95 dark:bg-neutral-950/95">
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
               <div className="mt-2 flex justify-center gap-4 flex-wrap"><Faq /></div>
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
    className={`absolute ${isMobile ? 'top-[36px]' : 'top-full mt-2'} left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none`}
  >
    <div className="w-2 h-2 bg-neutral-900 dark:bg-white rotate-45 translate-y-[4px] relative z-10 border-t border-l border-transparent" />
    <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-lg">
        <motion.div 
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: getShimmerGradient(accentColor) }}
        />
        <div className="relative z-10 px-2.5 py-0.5 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center">
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
const ControlButtons = memo(({ isMuted, onMuteToggle, disableSpline, onPerformanceToggle, infoPanelOpen, onInfoToggle, onFaqClick, onControlCenterToggle, accentColor }: any) => {
  const controlButtons = [
    {
      icon: infoPanelOpen ? Unlock : Lock,
      onClick: () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(15);
        onInfoToggle();
      },
      label: infoPanelOpen ? 'Close page info' : 'Open page info',
      color: accentColor,
    },
    {
      icon: isMuted ? VolumeX : Volume2,
      onClick: () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(10);
        onMuteToggle();
      },
      label: isMuted ? 'Unmute' : 'Mute',
      color: isMuted ? 'rgba(239, 68, 68, 1)' : accentColor,
    },
    {
      icon: Zap,
      onClick: () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(15);
        onPerformanceToggle();
      },
      label: disableSpline ? 'Enable Full 3D' : 'Performance Mode',
      color: disableSpline ? accentColor : 'rgba(255,255,255,0.9)',
    },
    {
      icon: HelpCircle,
      onClick: () => {
        playClick();
        if (navigator.vibrate) navigator.vibrate(15);
        onFaqClick();
      },
      label: 'Help & FAQ',
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
          className="relative w-9 h-9 rounded-full overflow-hidden shadow-sm hover:scale-110 active:scale-95 transition-all touch-manipulation group"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          aria-label={button.label}
          title={button.label}
        >
          <motion.div
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: getShimmerGradient(button.color) }}
          />
          <div className="absolute inset-[1.5px] rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center z-10">
            <button.icon size={16} style={{ color: button.color }} />
          </div>
          {/* Tooltip */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[9px] font-bold rounded shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {button.label}
          </div>
        </button>
      ))}
    </div>
  );
});
ControlButtons.displayName = "ControlButtons";