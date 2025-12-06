"use client";

import React, {
  Children,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
  type SpringOptions,
} from "framer-motion";
import {
  Gift,
  ShoppingCart,
  Radio,
  Users,
  TrendingUp,
  Home,
  Banknote,
  MessageCircle, // Added for Support Button
} from "lucide-react";

import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/Mainpage/button";
import { Logo } from "./logo";

// --- TYPES ---

type NextLinkType = string | { pathname: string; query?: Record<string, string> };

interface NavItem {
  name: string;
  link: NextLinkType;
  icon?: React.ReactNode;
}

interface NavbarProps {
  navItems: NavItem[];
}

// --- UTILITIES ---

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- MAIN

export const Navbar = () => {
  const navItems: NavItem[] = [
    {
      name: "FREE",
      link: { pathname: "/about", query: { src: "nav" } },
      icon: <Gift className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    },
    {
      name: "VIP SHOP",
      link: { pathname: "/shop", query: { src: "nav" } },
      icon: <ShoppingCart className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    },
    {
      name: "NEWS & LIVES",
      link: { pathname: "/Blogs", query: { src: "nav" } },
      icon: <Radio className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    },
    {
      name: "AFFILIATE",
      link: { pathname: "/recruit", query: { src: "nav" } },
      icon: <Users className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    },
    {
      name: "PROP",
      link: { pathname: "/Prop", query: { src: "nav" } },
      icon: <TrendingUp className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    },
  ];

  const footerNavItems: NavItem[] = [
    {
      name: "Home",
      link: "/",
      icon: <Home className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    },
  ];

  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <>
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Top Navbar */}
      <motion.div
        ref={ref}
        className="w-full fixed top-0 inset-x-0 z-50 pointer-events-none pt-6"
      >
        <div className="flex justify-center w-full">
          <DesktopNav navItems={navItems} />
          <MobileNav navItems={navItems} footerNavItems={footerNavItems} />
        </div>
      </motion.div>

      {/* Spacing for content below navbar */}
      <div className="w-full p-4 mt-24">
        {/* <SkeletonSocials /> */}
      </div>

      {/* Floating Support Button */}
      <SupportWidget />
    </>
  );
};

// --- SUPPORT WIDGET COMPONENT ---

const SupportWidget = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const telegramLink = "https://t.me/+dlP_A0ebMXs3NTg0";

  // Renamed keyframes to 'support-shimmer' to avoid conflict with Navbar 'shimmer'
  const supportStyles = `
    @keyframes support-shimmer {
      0% { transform: translateX(-150%) skewX(-12deg); }
      100% { transform: translateX(150%) skewX(-12deg); }
    }
    .animate-support-shimmer {
      animation: support-shimmer 3s infinite;
    }
  `;

  return (
    <>
      <style>{supportStyles}</style>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-[9999] transition-all duration-700 transform pointer-events-auto",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tooltip Label (Dark Tech Style) */}
        <div
          className={cn(
            "absolute bottom-full right-0 mb-4 whitespace-nowrap px-4 py-2 bg-slate-900 border border-blue-500/30 text-blue-50 text-sm font-medium rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-md transition-all duration-300 origin-bottom-right",
            isHovered
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-90 opacity-0 translate-y-2 pointer-events-none"
          )}
        >
          SUPPORT CHAT 
          {/* Tiny triangle pointer */}
          <div className="absolute top-full right-6 -mt-1.5 w-3 h-3 bg-slate-900 border-r border-b border-blue-500/30 rotate-45"></div>
        </div>

        {/* The Button Container */}
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact Support"
          className="group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 hover:-translate-y-1 hover:scale-105"
        >
          {/* 1. OUTER GLOW (Static + Hover intensity) */}
          <div className="absolute inset-0 rounded-full bg-blue-500 blur-md opacity-40 group-hover:opacity-75 group-hover:blur-lg transition-all duration-500"></div>

          {/* 2. MAIN BUTTON BACKGROUND (Gradient) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-700 shadow-[0_0_0_1px_rgba(255,255,255,0.1)] overflow-hidden">
            {/* 3. SHIMMER EFFECT (The light beam) */}
            <div className="absolute top-0 left-0 w-full h-full animate-support-shimmer">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm"></div>
            </div>

            {/* 4. INNER SHADOW for depth */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"></div>
          </div>

          {/* 5. PULSE RING (Subtle Ripple) */}
          <span className="absolute inline-flex h-full w-full rounded-full border border-blue-400 opacity-0 group-hover:animate-ping duration-[1.5s]"></span>

          {/* Icon Layer */}
          <div className="relative z-10 drop-shadow-md">
            <MessageCircle
              className={cn(
                "w-7 h-7 text-white transition-transform duration-500 ease-out",
                isHovered ? "rotate-[-10deg] scale-110" : "rotate-0"
              )}
              fill="currentColor"
              fillOpacity={0.1}
              strokeWidth={2}
            />

            {/* Notification Dot (Glowing Red/Pink for contrast) */}
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-r from-red-500 to-pink-600 border border-white shadow-sm"></span>
            </span>
          </div>
        </a>
      </div>
    </>
  );
};

// --- DESKTOP COMPONENTS ---

const DesktopNav = ({ navItems }: NavbarProps) => {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      className={cn(
        "hidden lg:flex items-center gap-4 pointer-events-auto",
        "px-6 py-2 rounded-2xl transition-all duration-300",
        "bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md shadow-lg border border-neutral-200 dark:border-white/10"
      )}
    >
      <AnimatedLogoWrapper>
        <Logo />
      </AnimatedLogoWrapper>

      <Dock
        items={navItems.map((item) => ({
          icon: item.icon,
          label: item.name,
          link: item.link,
        }))}
        panelHeight={60}
        baseItemSize={45}
        magnification={70}
      />

      <div className="flex items-center gap-3">
        {/* UPDATED: Desktop Button */}
        <ShimmerButton
          href="/shop"
          className="hidden md:block"
          buttonText="VIP SHOP"
          icon={<Banknote className="w-4 h-4 mr-1 text-purple-200" />} // Banknote icon
        />
      </div>
    </motion.div>
  );
};

// --- DOCK IMPLEMENTATION ---

type DockProps = {
  items: {
    icon: React.ReactNode;
    label: string;
    link: NextLinkType;
    onClick?: () => void;
  }[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  spring?: SpringOptions;
};

function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [isUserHovering, setIsUserHovering] = useState(false);

  useEffect(() => {
    if (isUserHovering) {
      setHighlightedIndex(null);
      return;
    }

    const interval = setInterval(() => {
      setHighlightedIndex((prev) => {
        if (prev === null) return 0;
        return (prev + 1) % items.length;
      });

      setTimeout(() => {
        setHighlightedIndex(null);
      }, 2000);
    }, 5000);

    return () => clearInterval(interval);
  }, [isUserHovering, items.length]);

  const maxHeight = useMemo(
    () => Math.max(panelHeight, magnification + magnification / 2 + 4),
    [magnification, panelHeight]
  );

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div
      style={{ height: panelHeight, scrollbarWidth: "none" }}
      className={cn("mx-2 flex items-center", className)}
    >
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
          setIsUserHovering(true);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
          setIsUserHovering(false);
        }}
        className="flex items-end gap-2 px-2"
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            link={item.link}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            label={item.label}
            forceLabelVisible={highlightedIndex === index}
          >
            <DockIcon>{item.icon}</DockIcon>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  link?: NextLinkType;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  label: string;
  forceLabelVisible?: boolean;
};

function DockItem({
  children,
  className = "",
  onClick,
  link,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  forceLabelVisible = false,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
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

  const Content = (
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
        "relative flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 border border-black/5 dark:border-white/5 shadow-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors",
        className
      )}
      tabIndex={0}
      role="button"
      aria-label={label}
    >
      {children}
      <DockLabel isHovered={isHovered} forceVisible={forceLabelVisible}>
        {label}
      </DockLabel>
    </motion.div>
  );

  if (link) {
    return (
      <Link href={link as any} className="no-underline">
        {Content}
      </Link>
    );
  }

  return Content;
}

function DockLabel({
  children,
  className = "",
  isHovered,
  forceVisible = false,
}: {
  children: React.ReactNode;
  className?: string;
  isHovered?: MotionValue<number>;
  forceVisible?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forceVisible) {
      setIsVisible(true);
      return;
    }

    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered, forceVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -10, x: "-50%" }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute top-full mt-2 left-1/2 px-3 py-1 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold whitespace-nowrap pointer-events-none z-50 shadow-xl",
            className
          )}
        >
          {children}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-neutral-900 dark:border-b-white" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center w-6 h-6", className)}>
      {children}
    </div>
  );
}

// --- MOBILE NAV ---

interface MobileNavProps extends NavbarProps {
  footerNavItems: NavItem[];
}

const MobileNav = ({ navItems, footerNavItems }: MobileNavProps) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      animate={{
        y: 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 50 }}
      className={cn(
        "flex pointer-events-auto relative flex-col lg:hidden w-[95%] justify-between items-center mx-auto px-4 py-3 rounded-2xl z-50 transition-all duration-300",
        "bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md shadow-lg border border-neutral-200 dark:border-white/10"
      )}
    >
      <div className="flex flex-row justify-between items-center w-full">
        <AnimatedLogoWrapper>
          <Logo />
        </AnimatedLogoWrapper>
        <div className="flex items-center gap-2">
          {/* UPDATED: Mobile Top Button */}
          <div className="hidden sm:block">
            <ShimmerButton
              href="/shop"
              buttonText="VIP SHOP"
              className="w-full text-sm"
              icon={<Banknote className="w-4 h-4 mr-1 text-purple-200" />}
            />
          </div>

          {open ? (
            <IconX
              className="text-black dark:text-white cursor-pointer w-6 h-6"
              onClick={() => setOpen(!open)}
              aria-controls="mobile-nav-panel"
              aria-expanded={open}
              aria-label="Close mobile menu"
            />
          ) : (
            <IconMenu2
              className="text-black dark:text-white cursor-pointer w-6 h-6"
              onClick={() => setOpen(!open)}
              aria-controls="mobile-nav-panel"
              aria-expanded={open}
              aria-label="Open mobile menu"
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-start justify-start gap-4 w-full pt-4 overflow-hidden"
          >
            {/* NEW: Extra Links (Home) */}
            {footerNavItems.map((item, idx) => (
              <Link
                key={`link-footer-${idx}`}
                href={item.link as any}
                onClick={() => setOpen(false)}
                className="group relative flex items-center gap-4 text-neutral-600 dark:text-neutral-300 w-full hover:text-black dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 font-bold"
              >
                <div className="w-8 h-8 p-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-md group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <motion.span className="block text-lg font-bold">
                  {item.name}
                </motion.span>
              </Link>
            ))}

            <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800 my-2" />

            {/* Main Nav Items */}
            {navItems.map((item, idx) => (
              <Link
                key={`link-${idx}`}
                href={item.link as any}
                onClick={() => setOpen(false)}
                className="group relative flex items-center gap-4 text-neutral-600 dark:text-neutral-300 w-full hover:text-black dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                <div className="w-8 h-8 p-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-md group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <motion.span className="block text-lg font-bold">
                  {item.name}
                </motion.span>
              </Link>
            ))}

            <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800 my-2" />

            {/* UPDATED: Menu Internal Button */}
            <ShimmerButton
              href="/shop"
              onClick={() => setOpen(false)}
              buttonText="VIP SHOP"
              className="w-full"
              icon={<Banknote className="w-5 h-5 mr-2 text-purple-200" />}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- HELPER COMPONENTS ---

const AnimatedLogoWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, rotate: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="cursor-pointer"
    >
      {children}
    </motion.div>
  );
};

// --- UPDATED SHIMMER BUTTON (Replaces Cal.com logic with Next.js Link) ---

const ShimmerButton = ({
  href,
  className,
  onClick,
  buttonText,
  icon,
}: {
  href: string; // Made href mandatory for this use case
  className?: string;
  onClick?: () => void;
  buttonText: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn("relative group overflow-hidden rounded-md", className)}
    >
      {/* MODIFIED: 
        1. Removed 'group-hover:' to make the glow persistent.
        2. Increased opacity to 70% to make the purple obvious by default.
      */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-70 transition duration-200" />

      <Link href={href} onClick={onClick} className="block w-full">
        <Button
          as="span"
          variant="primary"
          className="relative flex items-center justify-center w-full overflow-hidden bg-neutral-950 text-white border border-neutral-800 hover:bg-neutral-900 cursor-pointer"
        >
          {icon}
          <span className="relative z-10 font-semibold tracking-wide">
            {buttonText}
          </span>

          {/* MODIFIED: 
            1. Removed 'group-hover:' to make the shimmer animation constant.
            2. Changed 'via-white/20' to 'via-purple-300/40' to make the shimmer beam purple.
          */}
          <div className="absolute inset-0 z-0 flex transform -translate-x-full animate-shimmer w-full h-full pointer-events-none">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-purple-300/40 to-transparent skew-x-[-20deg]"></div>
          </div>
        </Button>
      </Link>
    </div>
  );
};

// --- SKELETON COMPONENTS FOR SOCIALS (Unchanged) ---

const SkeletonCircle = ({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) => (
  <div
    style={{ width: size, height: size }}
    className={cn(
      "rounded-full bg-neutral-800 relative overflow-hidden",
      className
    )}
  >
    <div className="absolute inset-0 z-0 flex transform -translate-x-full animate-shimmer w-full h-full pointer-events-none">
      <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"></div>
    </div>
  </div>
);

export const SkeletonSocials = ({ iconSize = 48 }: { iconSize?: number }) => {
  const iconCount = 8;
  const skeletons = Array.from({ length: iconCount });

  return (
    <div className="flex justify-center flex-wrap gap-4 py-8 pointer-events-none">
      {skeletons.map((_, index) => (
        <SkeletonCircle key={index} size={iconSize} />
      ))}
    </div>
  );
};

export default Navbar;