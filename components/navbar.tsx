"use client";
import { cn } from "@/lib/utils";
import {
  IconBuildingStore,
  IconCalendarTime,
  IconCreditCard,
  IconHelp,
  IconMenu2,
  IconSparkles,
  IconX,
  IconUsersGroup,
  IconLock,
  IconSettings,
  IconPalette,
} from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import React, {
  Children,
  cloneElement,
  useEffect,
  useRef,
  useState,
  isValidElement,
} from "react";

import { useCalEmbed } from "@/app/hooks/useCalEmbed";
import { CONSTANTS } from "@/constants/links";

// --- IMPORT CONTEXT ---
import { useStudio } from "@/context/StudioContext";
import { useGlobalTheme } from "@/contexts/GlobalThemeProvider";

// --- IMPORT MODAL COMPONENTS ---
import SocialsModal from "@/components/ui/Socials";
import ServicesModal from "@/components/ui/SeviceModal";
import { LoyaltyModal } from "@/components/LoyaltyCard";
import AdminModal from "@/components/AdminModal";
import BullMoneyModal from "@/components/Faq";
import AffiliateModal from "@/components/AffiliateModal";

// --- IMPORT THEME SELECTOR ---
import { ThemeSelector } from "@/components/Mainpage/ThemeSelector";
import { ThemeCategory, SoundProfile } from "@/constants/theme-data";

// --- IMPORT SOUND EFFECTS ---
import { SoundEffects } from "@/app/hooks/useSoundEffects";

// --- IMPORT NAVBAR CSS ---
import "./navbar.css";

// --- THEME CSS FILTER MAP ---
/**
 * Map theme IDs to CSS filter values for navbar color transformation
 */
const NAVBAR_THEME_FILTER_MAP: Record<string, string> = {
  // CRYPTO THEMES
  'BITCOIN': 'hue-rotate(0deg) saturate(1) brightness(1)',
  'ETHEREUM': 'hue-rotate(-30deg) saturate(1.2) brightness(1.05)',
  'RIPPLE': 'hue-rotate(200deg) saturate(1.1) brightness(0.95)',
  'DOGE': 'hue-rotate(45deg) saturate(1.15) brightness(1.1)',
  'CARDANO': 'hue-rotate(270deg) saturate(1.1) brightness(0.98)',
  'SOLANA': 'hue-rotate(-20deg) saturate(1.3) brightness(1.08)',
  'POLKADOT': 'hue-rotate(280deg) saturate(1.2) brightness(1.02)',
  'STELLAR': 'hue-rotate(190deg) saturate(1.15) brightness(0.97)',
  
  // MARKET THEMES
  'BULLISH': 'hue-rotate(100deg) saturate(1.3) brightness(1.15)',
  'BEARISH': 'hue-rotate(0deg) saturate(1.2) brightness(0.9)',
  'NEUTRAL': 'hue-rotate(0deg) saturate(0.8) brightness(1)',
  'VOLATILE': 'hue-rotate(-40deg) saturate(1.4) brightness(1.2)',
  
  // SPECIAL THEMES
  'MIDNIGHT': 'hue-rotate(0deg) saturate(0.7) brightness(0.85)',
  'NEON': 'hue-rotate(0deg) saturate(1.5) brightness(1.3)',
  'RETRO': 'hue-rotate(30deg) saturate(1.1) brightness(1.05)',
  'CYBERPUNK': 'hue-rotate(-50deg) saturate(1.8) brightness(1.25)',
  'MATRIX': 'hue-rotate(120deg) saturate(1.2) brightness(0.95)',
  'OCEAN': 'hue-rotate(200deg) saturate(1.1) brightness(1)',
  'DESERT': 'hue-rotate(40deg) saturate(1.15) brightness(1.1)',
  
  // DEFAULT
  'DEFAULT': 'hue-rotate(0deg) saturate(1) brightness(1)',
};

// --- HELPER HOOK FOR ROTATING TIPS ---
function useRotatingIndex(length: number, interval: number = 5000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!length || length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % length);
    }, interval);
    return () => clearInterval(timer);
  }, [length, interval]);
  return index;
}

// --- DOCK COMPONENTS ---

interface DockProps {
  items: {
    icon: React.ReactNode;
    label: string;
    tips?: string[];
    onClick?: () => void;
    href?: string;
    triggerComponent?: React.ReactNode;
    showShine?: boolean; // Added prop for shine effect
    isXMHighlight?: boolean; // 🎉 XM Easter Egg - individual button highlight
  }[];
  className?: string;
  baseItemSize?: number;
  magnification?: number;
}

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  itemRef,
}: any) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  // Combine refs - internal ref and external itemRef
  const setRefs = (el: HTMLDivElement | null) => {
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (itemRef) itemRef(el);
  };

  const mouseDistance = useTransform(mouseX, (val: number) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={setRefs}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      onMouseEnter={() => {
        SoundEffects.hover();
      }}
      onMouseDown={() => {
        SoundEffects.click();
      }}
      onTouchStart={() => {
        SoundEffects.click();
      }}
      className={cn(
        "relative flex flex-col items-center justify-center cursor-pointer mb-2",
        className
      )}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child) => {
        if (isValidElement(child)) {
          return cloneElement(child as React.ReactElement<any>, {
            ...(child.type === DockLabel ? { isHovered } : {}),
          });
        }
        return child;
      })}
    </motion.div>
  );
}

function DockLabel({ children, tips, className = "", isHovered, isXMUser = false, ...rest }: any) {
  const [isVisible, setIsVisible] = useState(false);
  const currentIndex = useRotatingIndex(tips?.length || 0);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest: number) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, x: "-50%", scale: 0.9 }}
          animate={{ opacity: 1, y: 20, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: 10, x: "-50%", scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 w-max min-w-[160px] rounded-xl border bg-black/70 backdrop-blur-xl px-4 py-2.5 z-[150] pointer-events-none",
            isXMUser
              ? "border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.4)]"
              : "border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.4)]",
            className
          )}
          role="tooltip"
        >
          {/* Arrow pointing up */}
          <div className={cn(
            "absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px]",
            isXMUser ? "border-b-red-500/40" : "border-b-blue-500/40"
          )} />
          
          <div className="flex items-center gap-3">
            {/* Pulse indicator */}
            <div className="relative flex h-2 w-2 shrink-0">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isXMUser ? "bg-red-400" : "bg-blue-400")} />
              <span className={cn("relative inline-flex rounded-full h-2 w-2", isXMUser ? "bg-red-500" : "bg-blue-500")} />
            </div>
            
            {/* Label */}
            <span className={cn("text-[10px] uppercase tracking-widest font-bold shrink-0", isXMUser ? "text-red-400" : "text-blue-400")}>
              {children}
            </span>
            
            {/* Divider */}
            <div className={cn("w-[1px] h-4 shrink-0", isXMUser ? "bg-red-500/30" : "bg-blue-500/30")} />
            
            {/* Rotating tip text */}
            {tips && tips.length > 0 && (
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className={cn("text-xs font-medium whitespace-nowrap block", isXMUser ? "text-red-100/90" : "text-blue-100/90")}
                  >
                    {tips[currentIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, label, className = "", showShine = false, isXMUser = false }: any) {
  return (
    <div
      className={cn(
        "flex flex-col h-full w-full items-center justify-center rounded-2xl bg-black/40 dark:bg-black/40 backdrop-blur-xl border-2 shadow-sm transition-all duration-200 hover:bg-black/50 dark:hover:bg-black/50 relative overflow-hidden group/icon",
        showShine
            ? (isXMUser ? "border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.5)] dark:border-red-400/80" : "border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.5)] dark:border-blue-400/80")
            : (isXMUser ? "border-red-500/30 dark:border-red-500/30 hover:border-red-400/60" : "border-blue-500/30 dark:border-blue-500/30 hover:border-blue-400/60"),
        className
      )}
    >
      {/* Shimmer Background - Dynamic based on XM Easter Egg */}
      {showShine && (
        <span className={cn(
          "absolute inset-[-100%] animate-[spin_3s_linear_infinite] opacity-100 z-0",
          isXMUser 
            ? "bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ef4444_50%,#00000000_100%)]"
            : "bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)]"
        )} />
      )}

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col h-full w-full items-center justify-center">
        <div className="flex-shrink-0 mb-1 z-10 pointer-events-none relative">
          {children}
          {/* Little Notification Dot if Shining */}
          {showShine && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isXMUser ? "bg-red-400" : "bg-blue-400")}></span>
                  <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isXMUser ? "bg-red-500" : "bg-blue-500")}></span>
              </span>
          )}
        </div>
        
        <span className={cn(
            "text-[9px] uppercase tracking-widest font-semibold opacity-60 z-10 pointer-events-none transition-colors group-hover/icon:opacity-100",
            showShine 
              ? (isXMUser ? "text-red-300 dark:text-red-300 font-bold" : "text-blue-300 dark:text-blue-300 font-bold")
              : (isXMUser ? "text-red-200/80 dark:text-red-200/80" : "text-blue-200/80 dark:text-blue-200/80")
        )}>
          {label}
        </span>
      </div>
    </div>
  );
}

interface DockWithRefsProps extends DockProps {
  spring?: any;
  distance?: number;
  dockRef?: React.RefObject<HTMLDivElement>;
  buttonRefs?: React.RefObject<(HTMLDivElement | null)[]>;
  onHoverChange?: (isHovered: boolean) => void;
  isXMUser?: boolean; // 🎉 XM Easter Egg prop
}

function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 100,
  distance = 150,
  baseItemSize = 70,
  dockRef,
  buttonRefs,
  onHoverChange,
  isXMUser = false, // 🎉 XM Easter Egg
}: DockWithRefsProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  return (
    <motion.div
      ref={dockRef}
      onMouseMove={({ pageX }) => {
        isHovered.set(1);
        mouseX.set(pageX);
      }}
      onMouseEnter={() => {
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        isHovered.set(0);
        mouseX.set(Infinity);
        onHoverChange?.(false);
      }}
      className={cn(
        "mx-auto flex h-24 items-center gap-5 rounded-3xl border-2 bg-black/40 dark:bg-black/40 px-6 shadow-2xl backdrop-blur-xl transition-all duration-300",
        "border-blue-500/30 dark:border-blue-500/30 hover:border-blue-400/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]",
        className
      )}
    >
      {items.map((item, index) => {
        const content = (
          <DockItem
            key={index}
            onClick={item.onClick}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            itemRef={(el: HTMLDivElement | null) => {
              if (buttonRefs?.current) {
                buttonRefs.current[index] = el;
              }
            }}
          >
            {/* Pass showShine and isXMHighlight to DockIcon */}
            <DockIcon label={item.label} showShine={item.showShine} isXMUser={item.isXMHighlight}>
                {item.icon}
            </DockIcon>
            <DockLabel tips={item.tips} isXMUser={item.isXMHighlight}>{item.label}</DockLabel>

            {/* INVISIBLE OVERLAY TRIGGER FOR MODALS */}
            {item.triggerComponent && (
                <div className="absolute inset-0 z-20 opacity-0 cursor-pointer">
                    {item.triggerComponent}
                </div>
            )}
          </DockItem>
        );

        if (item.href) {
          return (
            <Link key={index} href={item.href}>
              {content}
            </Link>
          );
        }
        return <React.Fragment key={index}>{content}</React.Fragment>;
      })}
    </motion.div>
  );
}

// --- MAIN NAVBAR ---

// Trading tips for rotating helper - each maps to a button index
const NAVBAR_TRADING_TIPS = [
  { target: 'Home', text: 'Market overview & latest updates', buttonIndex: 0 },
  { target: 'Setups', text: 'Daily signals & chart analysis', buttonIndex: 1 },
  { target: 'Affiliates', text: 'Join our affiliate program', buttonIndex: 2 },
  { target: 'FAQ', text: 'Trading guides & support', buttonIndex: 3 },
  { target: 'Rewards', text: 'Earn points on every trade', buttonIndex: 4 },
  { target: 'Products', text: 'Pro tools & indicators', buttonIndex: 5 },
  { target: 'Theme', text: 'Customize your interface', buttonIndex: 6 },
];

// Animated floating tip that moves between button positions (Desktop only)
const MovingTradingTip = ({ 
  tip, 
  buttonRefs,
  dockRef,
  isVisible 
}: { 
  tip: { target: string; text: string; buttonIndex: number }; 
  buttonRefs: React.RefObject<(HTMLDivElement | null)[]>;
  dockRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const updatePosition = () => {
      if (!buttonRefs.current || !dockRef.current) return;
      
      const button = buttonRefs.current[tip.buttonIndex];
      const dock = dockRef.current;
      
      if (button && dock) {
        const buttonRect = button.getBoundingClientRect();
        const dockRect = dock.getBoundingClientRect();
        
        // Position below the button, centered
        setPosition({
          x: buttonRect.left + buttonRect.width / 2,
          y: dockRect.bottom + 16
        });
        setIsReady(true);
      }
    };
    
    // Initial position
    updatePosition();
    
    // Update on resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [tip.buttonIndex, buttonRefs, dockRef]);
  
  if (!isVisible || !isReady) return null;
  
  return (
    <motion.div
      key={tip.buttonIndex}
      initial={{ opacity: 0, scale: 0.85, y: position.y - 10 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: position.x - 120, // Center the tooltip (approx half width)
        y: position.y
      }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ 
        type: "spring",
        stiffness: 350,
        damping: 30,
        opacity: { duration: 0.15 }
      }}
      className="fixed z-[100] pointer-events-none hidden lg:block"
      style={{ 
        left: 0,
        top: 0,
      }}
    >
      <div className="relative">
        {/* Arrow pointing up */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-blue-500/40" />
        
        {/* Tip container */}
        <div className="px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-xl border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.4)]">
          <div className="flex items-center gap-3">
            {/* Pulse indicator */}
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </div>
            
            {/* Target label */}
            <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400 shrink-0">
              {tip.target}
            </span>
            
            {/* Divider */}
            <div className="w-[1px] h-4 bg-blue-500/30 shrink-0" />
            
            {/* Tip text */}
            <span className="text-xs text-blue-100/90 font-medium whitespace-nowrap">
              {tip.text}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Mobile helper tips - trading facts, button info, and BullMoney facts
const MOBILE_HELPER_TIPS = [
  // Button info
  "Home: Market overview & updates",
  "Setups: Daily trading signals",
  "Socials: Join 10k+ traders",
  "FAQ: Trading guides & help",
  "Rewards: Earn points on trades",
  "Products: Pro tools & indicators",
  "Theme: Customize your view",
  // Trading facts
  "90% of traders fail - be the 10%",
  "Risk only 1-2% per trade",
  "The trend is your friend",
  "Cut losses, let winners run",
  "Always use stop losses",
  "Paper trade before going live",
  "Patience beats impulse trading",
  "Volume confirms price action",
  // BullMoney facts
  "BullMoney: Elite trading community",
  "10k+ active traders worldwide",
  "Daily setups for Crypto & Forex",
  "Join our Discord community",
  "Premium signals available 24/7",
  "Learn from pro traders daily",
];

// Mobile static helper with rotating tips
const MobileStaticHelper = () => {
  const [tipIndex, setTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % MOBILE_HELPER_TIPS.length);
        setIsVisible(true);
      }, 200);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div
      className="fixed right-3 left-3 z-[100] pointer-events-none lg:hidden"
      style={{ top: 'calc(6.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -3 }}
        transition={{ duration: 0.2 }}
        className="mx-auto w-fit max-w-[90%] px-3 py-2 rounded-xl bg-black/70 backdrop-blur-xl border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
      >
        <div className="flex items-center gap-2.5 justify-center">
          {/* Pulse indicator */}
          <div className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
          </div>
          
          {/* Rotating tip text */}
          <span className="text-[10px] tracking-wide font-medium text-blue-200/90 text-center">
            {MOBILE_HELPER_TIPS[tipIndex]}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

// Theme Selector Modal Component
const ThemeSelectorModal = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void 
}) => {
  // Use global theme context for proper theme application
  const { activeThemeId: globalThemeId, setTheme } = useGlobalTheme();
  
  const [activeThemeId, setActiveThemeId] = useState(globalThemeId || 'BITCOIN');
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('CRYPTO');
  const [currentSound, setCurrentSound] = useState<SoundProfile>('SILENT');
  const [isMuted, setIsMuted] = useState(true);
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);

  // Sync with global theme on mount
  useEffect(() => {
    if (globalThemeId) {
      setActiveThemeId(globalThemeId);
    }
  }, [globalThemeId, isOpen]);

  const handleSave = (themeId: string) => {
    // Use global theme context - applies CSS overlay across entire app
    setTheme(themeId);
    
    // Save theme preference to all storage locations (backup)
    localStorage.setItem('bullmoney-theme', themeId);
    localStorage.setItem('user_theme_id', themeId);
    
    // Dispatch custom event for components that need to react
    window.dispatchEvent(new CustomEvent('bullmoney-theme-change', { 
      detail: { themeId } 
    }));
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        {/* Modal container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-blue-500/30 shadow-[0_0_60px_rgba(59,130,246,0.3)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-black/90 border-b border-blue-500/30">
            <div className="flex items-center gap-3">
              <IconPalette className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-blue-400">
                Theme Selector
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <IconX className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Theme Selector Content */}
          <div className="h-[70vh] overflow-auto">
            <ThemeSelector
              activeThemeId={activeThemeId}
              setActiveThemeId={setActiveThemeId}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              isMobile={false}
              currentSound={currentSound}
              setCurrentSound={setCurrentSound}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              onSave={handleSave}
              onExit={onClose}
              onHover={setPreviewThemeId}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isAffiliateOpen, setIsAffiliateOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  // 👇 STATE TO PREVENT HYDRATION MISMATCH
  const [mounted, setMounted] = useState(false);
  
  // 🎉 XM EASTER EGG: Get XM user status from global theme
  const { isXMUser, activeThemeId } = useGlobalTheme();
  
  // Get CSS filter for current theme to apply to navbar
  const themeFilter = NAVBAR_THEME_FILTER_MAP[activeThemeId || 'DEFAULT'] || NAVBAR_THEME_FILTER_MAP['DEFAULT'];
  
  // Rotating tips state
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTip, setShowTip] = useState(true);
  
  // Track if dock is being hovered (to hide 5-second tip)
  const [isDockHovered, setIsDockHovered] = useState(false);
  
  // Refs for tracking button positions
  const dockRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // --- USE STUDIO TO CHECK IF REAL ADMIN & STAMPS ---
  const { state } = useStudio();
  const { isAdmin, isAuthenticated, userProfile } = state;

  // CHECK FOR REWARD (5 stamps)
  const hasReward = (userProfile?.stamps || 0) >= 5;

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

  // --- SAFE ICONS (Resolve hydration issue) ---

  // 1. Theme Icon - Now uses palette icon for theme selector
  const safeThemeIcon = (
    <IconSparkles className="h-6 w-6 text-blue-400" stroke={1.5} />
  );

  // 2. Admin Icon
  const safeAdminIcon = isAdmin ? (
      <IconSettings className="h-5 w-5 text-#3b82f6" stroke={1.5} />
  ) : (
      <IconLock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" stroke={1.5} />
  );

  // 3. Loyalty Icon (Dynamic color if reward)
  const safeLoyaltyIcon = hasReward ? (
      <IconCreditCard className="h-6 w-6 text-#3b82f6 animate-pulse" stroke={1.5} />
  ) : (
      <IconCreditCard className="h-6 w-6 text-neutral-700 dark:text-neutral-200" stroke={1.5} />
  );


  const desktopNavItems = [
    {
      icon: <IconBuildingStore className="h-6 w-6 text-neutral-700 dark:text-neutral-200" stroke={1.5} />,
      label: "Home",
      tips: ["Welcome to BullMoney!", "Explore our platform", "Check what's new"],
      href: "/",
    },
    {
      icon: <IconSparkles className="h-6 w-6 text-neutral-700 dark:text-neutral-200" stroke={1.5} />,
      label: "Setups",
      tips: ["Daily Trading Setups", "Crypto & Forex Analysis", "Premium Alerts"],
      triggerComponent: <div className="w-full h-full flex items-center justify-center pointer-events-auto"><ServicesModal /></div>,
    },
    {
        icon: isXMUser 
          ? <IconUsersGroup className="h-6 w-6 text-red-400" stroke={1.5} />
          : <IconUsersGroup className="h-6 w-6 text-neutral-700 dark:text-neutral-200" stroke={1.5} />,
        label: "Affiliates",
        tips: ["Join our affiliate program", "Earn commissions", "Grow with us"],
        onClick: () => setIsAffiliateOpen(true),
        isXMHighlight: isXMUser, // 🎉 XM Easter Egg - only this button turns red
    },
    {
        icon: <IconHelp className="h-6 w-6 text-neutral-700 dark:text-neutral-200" stroke={1.5} />,
        label: "FAQ",
        tips: ["Got questions?", "Find your answers here", "Support center"],
        onClick: () => setIsFaqOpen(true),
    },
    {
        icon: safeLoyaltyIcon,
        label: hasReward ? "REWARD!" : "Rewards",
        tips: hasReward ? ["REWARD UNLOCKED!", "Click to redeem", "10% OFF"] : ["Digital rewards card", "Earn points", "Get exclusive perks"],
        triggerComponent: <div className="w-full h-full flex items-center justify-center pointer-events-auto"><LoyaltyModal /></div>,
        showShine: hasReward, // <--- TRIGGERS THE SHINE EFFECT
    },
    {
      icon: <IconCalendarTime className="h-6 w-6 text-neutral-700 dark:text-neutral-200" stroke={1.5} />,
      label: "Products",
      tips: ["Browse our products", "Find the best tools for you", "Check out our latest offers"],
      href: "/products",
    },
    {
      icon: safeThemeIcon,
      label: "Theme",
      tips: ["Customize your interface", "Multiple themes available", "Save your preferences"],
      onClick: () => setIsThemeSelectorOpen(true),
    },
  ];

  // --- CONDITIONAL ADMIN BUTTON (DESKTOP) ---
  if (mounted && (!isAuthenticated || isAdmin)) {
    desktopNavItems.push({
      icon: safeAdminIcon,
      label: isAdmin ? "Dashboard" : "Admin",
      tips: isAdmin ? ["Manage Site", "Logout", "View Orders"] : ["Team Access", "Admin Login"],
      onClick: () => setIsAdminOpen(true),
      triggerComponent: undefined,
      href: undefined
    });
  }


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

    <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    <BullMoneyModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
    <AffiliateModal isOpen={isAffiliateOpen} onClose={() => setIsAffiliateOpen(false)} />
    <ThemeSelectorModal isOpen={isThemeSelectorOpen} onClose={() => setIsThemeSelectorOpen(false)} />
    
    {/* Desktop Moving Trading Tips - follows buttons, hidden when hovering dock */}
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
    
    {/* Mobile Static Helper - small and always visible */}
    {mounted && <MobileStaticHelper />}

    <div 
      className="fixed top-8 inset-x-0 z-40 w-full px-4 pointer-events-none navbar-themed"
      style={{
        filter: themeFilter,
        transition: 'filter 0.5s ease-in-out, opacity 0.3s ease-in-out'
      }}
      data-navbar-container
    >
       {/* Hidden trigger for Cal.com modal */}
      <button
        id="cal-trigger-btn"
        className="hidden pointer-events-auto"
        data-cal-namespace={calOptions.namespace}
        data-cal-link={CONSTANTS.CALCOM_LINK}
        data-cal-config={`{"layout":"${calOptions.layout}"}`}
      />

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex w-full max-w-7xl mx-auto items-center h-24 relative">
        <div className="pointer-events-auto z-50 flex items-center justify-center h-23 w-23 overflow-hidden relative">
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
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto z-40">
          <Dock 
            items={desktopNavItems} 
            dockRef={dockRef}
            buttonRefs={buttonRefs}
            onHoverChange={setIsDockHovered}
            isXMUser={isXMUser}
          />
        </div>
      </div>

      {/* --- MOBILE NAVBAR (SPLIT LAYOUT) --- */}
      <div className="lg:hidden flex flex-row items-center justify-between w-full px-2 sm:px-4 pointer-events-auto gap-2">

        {/* 1. LOGO (LEFT) */}
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

        {/* 2. PREMIUM GLASS SHIMMER CONTROLS (RIGHT) */}
        <div className="relative group rounded-full overflow-hidden shadow-lg z-50 h-12 sm:h-14 flex items-center flex-grow max-w-xs">
            {/* Shimmer Background - Blue */}
            <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-100" />

            {/* Inner Content Container - Black Glass */}
            <div className="relative h-full w-full bg-black/40 dark:bg-black/40 backdrop-blur-3xl rounded-full p-[2px] flex items-center justify-center gap-1 px-2 sm:px-3 border-2 border-blue-500/30 dark:border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                {/* Theme Selector Button - Centered */}
                <button
                    onClick={() => { SoundEffects.click(); setIsThemeSelectorOpen(true); }}
                    onMouseEnter={() => SoundEffects.hover()}
                    onTouchStart={() => SoundEffects.click()}
                    className="p-1.5 rounded-full text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                    title="Theme Selector"
                >
                    <IconPalette className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Divider */}
                <div className="h-4 w-[1px] bg-blue-500/20 dark:bg-blue-500/20"></div>

                {/* Menu Toggle Button - Centered */}
                <button
                    onClick={() => { SoundEffects.click(); setOpen(!open); }}
                    onMouseEnter={() => SoundEffects.hover()}
                    onTouchStart={() => SoundEffects.click()}
                    className="p-1.5 rounded-full text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
                    style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                    title={open ? 'Close menu' : 'Open menu'}
                >
                    {/* If reward is unlocked, add a little dot to the menu icon */}
                    <div className="relative flex items-center justify-center">
                        {open ? <IconX className="h-4 w-4 sm:h-5 sm:w-5" /> : <IconMenu2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                        {hasReward && !open && (
                             <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                        )}
                    </div>
                </button>
            </div>
        </div>

        {/* 3. MOBILE DROPDOWN MENU - Premium Glass Style */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute top-20 sm:top-24 left-2 sm:left-3 right-2 sm:right-3 z-40 rounded-2xl border-2 bg-black/40 dark:bg-black/40 p-3 sm:p-4 shadow-2xl backdrop-blur-xl transition-all",
                isXMUser
                  ? "border-red-500/30 dark:border-red-500/30 hover:border-red-400/60"
                  : "border-blue-500/30 dark:border-blue-500/30 hover:border-blue-400/60"
              )}
            >
              <div className="flex flex-col gap-2 sm:gap-3 items-center text-center">
                <Link
                  href="/"
                  onClick={() => { SoundEffects.click(); setOpen(false); }}
                  onMouseEnter={() => SoundEffects.hover()}
                  onTouchStart={() => SoundEffects.click()}
                  className="text-sm sm:text-base font-semibold text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 transition-colors w-full py-2 rounded-lg hover:bg-blue-500/10"
                >
                  Home
                </Link>

                <div className="relative w-full" onMouseEnter={() => SoundEffects.hover()} onTouchStart={() => SoundEffects.click()}>
                    <span className="text-sm sm:text-base font-semibold text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 pointer-events-none block py-2 rounded-lg hover:bg-blue-500/10 cursor-pointer transition-colors">Setups</span>
                    <div className="absolute inset-0 opacity-0"><ServicesModal /></div>
                </div>

                {/* 🎉 AFFILIATES BUTTON - RED WHEN XM USER */}
                <div 
                  className="relative w-full" 
                  onClick={() => { SoundEffects.click(); setIsAffiliateOpen(true); setOpen(false); }} 
                  onMouseEnter={() => SoundEffects.hover()} 
                  onTouchStart={() => SoundEffects.click()}
                >
                    <span className={cn(
                      "text-sm sm:text-base font-semibold cursor-pointer block py-2 rounded-lg transition-colors",
                      isXMUser
                        ? "text-red-300 hover:text-red-200 hover:bg-red-500/10 font-bold"
                        : "text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 hover:bg-blue-500/10"
                    )}>Affiliates {isXMUser && "🔴"}</span>
                </div>

                <div className="relative w-full" onClick={() => { SoundEffects.click(); setIsFaqOpen(true); setOpen(false); }} onMouseEnter={() => SoundEffects.hover()} onTouchStart={() => SoundEffects.click()}>
                    <span className="text-sm sm:text-base font-semibold text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 cursor-pointer block py-2 rounded-lg hover:bg-blue-500/10 transition-colors">FAQ</span>
                </div>

                <div className="relative w-full" onMouseEnter={() => SoundEffects.hover()} onTouchStart={() => SoundEffects.click()}>
                    <span className={cn(
                        "text-sm sm:text-base font-semibold pointer-events-none flex items-center justify-center gap-2 py-2 rounded-lg transition-colors",
                        hasReward ? "text-blue-300 font-bold animate-pulse bg-blue-500/10" : "text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 hover:bg-blue-500/10"
                    )}>
                        {hasReward ? "🎁 Reward Unlocked!" : "Rewards Card"}
                    </span>
                    <div className="absolute inset-0 opacity-0"><LoyaltyModal /></div>
                </div>

                <Link
                  href="/products"
                  onClick={() => { SoundEffects.click(); setOpen(false); }}
                  onMouseEnter={() => SoundEffects.hover()}
                  onTouchStart={() => SoundEffects.click()}
                  className="w-full rounded-lg bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-md hover:bg-blue-600 transition-all transform hover:scale-105 border-2 border-blue-400/30 hover:border-blue-300/60 flex items-center justify-center min-h-[40px]"
                >
                  Products
                </Link>

                {/* Theme Selector Button for Mobile */}
                <button
                  onClick={() => { SoundEffects.click(); setOpen(false); setIsThemeSelectorOpen(true); }}
                  onMouseEnter={() => SoundEffects.hover()}
                  onTouchStart={() => SoundEffects.click()}
                  className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-blue-200/80 dark:text-blue-200/80 hover:text-blue-300 transition-colors w-full py-2 rounded-lg hover:bg-blue-500/10"
                >
                  <IconPalette size={16} /> Theme
                </button>

                {mounted && (!isAuthenticated || isAdmin) && (
                    <button
                      onClick={() => { SoundEffects.click(); setOpen(false); setIsAdminOpen(true); }}
                      onMouseEnter={() => SoundEffects.hover()}
                      onTouchStart={() => SoundEffects.click()}
                      className={cn(
                        "flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest transition-colors mt-1 py-2 rounded-lg w-full",
                        isAdmin ? "text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 font-bold" : "text-blue-200/60 hover:text-blue-300 hover:bg-blue-500/10"
                      )}
                    >
                       {isAdmin ? (
                           <><IconSettings size={12} /> Admin Dashboard</>
                       ) : (
                           <><IconLock size={12} /> Team Access</>
                       )}
                    </button>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
};