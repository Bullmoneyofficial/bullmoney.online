"use client";
import { cn } from "@/lib/utils";
import {
  IconBuildingStore,
  IconCalendarTime,
  IconCreditCard,
  IconHelp,
  IconMenu2,
  IconMoon,
  IconSparkles,
  IconSun,
  IconX,
  IconUsersGroup,
  IconLock,
  IconSettings,
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
import { useTheme } from "next-themes";

// --- IMPORT CONTEXT ---
import { useStudio } from "@/context/StudioContext";

// --- IMPORT MODAL COMPONENTS ---
import SocialsModal from "@/components/ui/Socials";
import ServicesModal from "@/components/ui/SeviceModal";
import { LoyaltyModal } from "@/components/LoyaltyCard";
import AdminModal from "@/components/AdminModal";
import BullMoneyModal from "@/components/Faq";

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
}: any) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

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
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
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

function DockLabel({ children, tips, className = "", isHovered, ...rest }: any) {
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
            "absolute top-full left-1/2 -translate-x-1/2 w-max min-w-[140px] text-center rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950 z-50 pointer-events-none",
            className
          )}
          role="tooltip"
        >
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1 block">
            {children}
          </span>

          {tips && tips.length > 0 && (
             <div className="h-4 relative w-full overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs text-neutral-500 dark:text-neutral-400 absolute inset-x-0 truncate block"
                >
                  💡 {tips[currentIndex]}
                </motion.span>
              </AnimatePresence>
             </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, label, className = "", showShine = false }: any) {
  return (
    <div
      className={cn(
        "flex flex-col h-full w-full items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 border shadow-sm transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 relative overflow-hidden",
        showShine
            ? "border-#60a5fa/60 shadow-[0_0_15px_rgba(59,130,246,0.3)] dark:border-#3b82f6/60"
            : "border-neutral-200 dark:border-neutral-800",
        className
      )}
    >
      <div className="flex-shrink-0 mb-1 z-10 pointer-events-none relative">
        {children}
        {/* Little Notification Dot if Shining */}
        {showShine && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-#60a5fa opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-#3b82f6"></span>
            </span>
        )}
      </div>
      
      <span className={cn(
          "text-[9px] uppercase tracking-widest font-semibold opacity-60 z-10 pointer-events-none transition-colors",
          showShine ? "text-#3b82f6 dark:text-#60a5fa font-bold" : "text-neutral-400 dark:text-neutral-500"
      )}>
        {label}
      </span>

      {/* SHINE ANIMATION LAYER */}
      {showShine && (
          <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 -translate-x-[150%] animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-#93c5fd/20 to-transparent skew-x-12" />
          </div>
      )}
    </div>
  );
}

function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 100,
  distance = 150,
  baseItemSize = 70,
}: DockProps & {
  spring?: any;
  distance?: number;
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  return (
    <motion.div
      onMouseMove={({ pageX }) => {
        isHovered.set(1);
        mouseX.set(pageX);
      }}
      onMouseLeave={() => {
        isHovered.set(0);
        mouseX.set(Infinity);
      }}
      className={cn(
        "mx-auto flex h-24 items-center gap-5 rounded-3xl border border-neutral-200 bg-white/95 dark:bg-neutral-950/95 px-6 shadow-2xl backdrop-blur-xl dark:border-neutral-800",
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
          >
            {/* Pass showShine to DockIcon */}
            <DockIcon label={item.label} showShine={item.showShine}>
                {item.icon}
            </DockIcon>
            <DockLabel tips={item.tips}>{item.label}</DockLabel>

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

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  // 👇 STATE TO PREVENT HYDRATION MISMATCH
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Set to true once the component mounts on the client
  }, []);

  // --- USE STUDIO TO CHECK IF REAL ADMIN & STAMPS ---
  const { state } = useStudio();
  const { isAdmin, isAuthenticated, userProfile } = state;

  // CHECK FOR REWARD (5 stamps)
  const hasReward = (userProfile?.stamps || 0) >= 5;

  const { setTheme, theme } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

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

  // 1. Theme Icon
  const safeThemeIcon = mounted ? (
      theme === 'dark' ?
          <IconSun className="h-6 w-6 text-neutral-200" stroke={1.5} /> :
          <IconMoon className="h-6 w-6 text-neutral-700" stroke={1.5} />
  ) : (
      <IconMoon className="h-6 w-6 text-neutral-700" stroke={1.5} />
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
      label: "Trading Setups",
      tips: ["Daily Trading Setups", "Crypto & Forex Analysis", "Premium Alerts"],
      triggerComponent: <div className="w-full h-full flex items-center justify-center pointer-events-auto"><ServicesModal /></div>,
    },
    {
        icon: <IconUsersGroup className="h-6 w-6 text-neutral-700 dark:text-neutral-200" stroke={1.5} />,
        label: "Socials",
        tips: ["Join our Discord", "Follow on Instagram", "Connect with traders"],
        href: "/socials",
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
      onClick: toggleTheme,
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

    <div className="fixed top-8 inset-x-0 z-50 w-full px-4 pointer-events-none">
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
          <Dock items={desktopNavItems} />
        </div>
      </div>

      {/* --- MOBILE NAVBAR (SPLIT LAYOUT) --- */}
      <div className="lg:hidden flex flex-row items-center justify-between w-full px-6 pointer-events-auto">

        {/* 1. BIGGER LOGO (LEFT) */}
        <div className="relative flex items-center justify-center overflow-hidden h-24 w-24 z-50">
             <Link href="/" className="relative w-full h-full block">
                                 <Image
                                  src="/BULL.svg"
                                  alt="BullMoney"
                                  fill
                                  className="object-cover"
                                  priority
                                />             </Link>
        </div>

        {/* 2. COMPACT GOLD SHIMMER CONTROLS (RIGHT) */}
        <div className="relative group rounded-full overflow-hidden shadow-xl z-50 h-12 flex items-center">
            {/* Shimmer Background */}
            <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#000000_50%,#3b82f6_100%)] opacity-80" />

            {/* Inner Content Container */}
            <div className="relative h-full w-full bg-white/90 dark:bg-neutral-950/90 backdrop-blur-3xl rounded-full p-[2px] flex items-center justify-center gap-2 px-4 border border-neutral-200/50 dark:border-#3b82f6/50">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-neutral-800 dark:text-neutral-200 hover:text-#3b82f6 transition-colors"
                >
                    {safeThemeIcon}
                </button>

                {/* Divider */}
                <div className="h-5 w-[1px] bg-neutral-200 dark:bg-neutral-800"></div>

                {/* Menu Toggle Button */}
                <button
                    onClick={() => setOpen(!open)}
                    className="p-2 rounded-full text-neutral-800 dark:text-neutral-200 hover:text-#3b82f6 transition-colors"
                >
                    {/* If reward is unlocked, add a little dot to the menu icon */}
                    <div className="relative">
                        {open ? <IconX className="h-5 w-5" /> : <IconMenu2 className="h-5 w-5" />}
                        {hasReward && !open && (
                             <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-#60a5fa opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-#3b82f6"></span>
                            </span>
                        )}
                    </div>
                </button>
            </div>
        </div>

        {/* 3. MOBILE DROPDOWN MENU */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-28 left-4 right-4 z-40 rounded-3xl border border-neutral-200 bg-white/95 p-6 shadow-2xl dark:bg-neutral-950/95 dark:border-neutral-800 backdrop-blur-lg"
            >
              <div className="flex flex-col gap-6 items-center text-center">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="text-lg font-semibold text-neutral-800 dark:text-neutral-200"
                >
                  Home
                </Link>

                <div className="relative">
                    <span className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 pointer-events-none">Trading Setups</span>
                    <div className="absolute inset-0 opacity-0"><ServicesModal /></div>
                </div>

                <Link
                  href="/socials"
                  onClick={() => setOpen(false)}
                  className="text-lg font-semibold text-neutral-800 dark:text-neutral-200"
                >
                  Socials
                </Link>

                <div className="relative" onClick={() => { setIsFaqOpen(true); setOpen(false); }}>
                    <span className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">FAQ</span>
                </div>

                <div className="relative">
                    <span className={cn(
                        "text-lg font-semibold pointer-events-none flex items-center gap-2",
                        hasReward ? "text-#3b82f6 font-bold animate-pulse" : "text-neutral-800 dark:text-neutral-200"
                    )}>
                        {hasReward ? "🎁 Reward Unlocked!" : "Rewards Card"}
                    </span>
                    <div className="absolute inset-0 opacity-0"><LoyaltyModal /></div>
                </div>

                <Link
                  href="/products"
                  onClick={() => setOpen(false)}
                  className="w-full max-w-xs rounded-full bg-#3b82f6 text-white px-6 py-3 text-sm font-bold shadow-md hover:bg-#60a5fa transition-all transform hover:scale-105"
                >
                  Products
                </Link>

                {mounted && (!isAuthenticated || isAdmin) && (
                    <button
                      onClick={() => { setOpen(false); setIsAdminOpen(true); }}
                      className={cn(
                        "flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors mt-4",
                        isAdmin ? "text-#3b82f6 hover:text-#60a5fa" : "text-neutral-400 hover:text-black dark:hover:text-white"
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