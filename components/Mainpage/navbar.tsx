"use client";

import React, {
  useEffect,
  useRef,
  useState,
  memo,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import {
  Gift,
  ShoppingCart,
  Radio,
  Users,
  TrendingUp,
  Home,
  MessageCircle,
} from "lucide-react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import { Logo } from "./logo";
import Faq from "@/app/shop/Faq";

// --- GLOBAL STYLES ---
const GLOBAL_STYLES = `
  .mac-gpu-accelerate {
    transform: translateZ(0);
    will-change: transform, width, height;
    backface-visibility: hidden;
  }
`;

// --- DATA ---
const NAV_ITEMS = [
  { name: "FREE", link: { pathname: "/about", query: { src: "nav" } }, icon: <Gift className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
  { name: "VIP SHOP", link: { pathname: "/shop", query: { src: "nav" } }, icon: <ShoppingCart className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
  { name: "NEWS & LIVES", link: { pathname: "/Blogs", query: { src: "nav" } }, icon: <Radio className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
  { name: "AFFILIATE", link: { pathname: "/recruit", query: { src: "nav" } }, icon: <Users className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
  { name: "PROP", link: { pathname: "/Prop", query: { src: "nav" } }, icon: <TrendingUp className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
];

const FOOTER_NAV_ITEMS = [
  { name: "Home", link: "/", icon: <Home className="h-full w-full text-neutral-500 dark:text-neutral-300" /> },
];

// --- MAIN NAVBAR ---
export const Navbar = () => {
  return (
    <>
      <style jsx global>{GLOBAL_STYLES}</style>

      {/* Navbar Container */}
      <div className="fixed top-0 inset-x-0 z-[1000] pointer-events-none pt-6 select-none h-24">
        
        {/* 1. SEPARATE LOGO (Far Left, Big, No Background) */}
        <div className="hidden lg:flex absolute left-10 top-8 z-[1010] pointer-events-auto">
           <AnimatedLogoWrapper>
              {/* Scaled to 150%, min-w-max forces one line if logo is flex-based */}
              <div className="scale-150 origin-top-left min-w-max whitespace-nowrap">
                 <Logo />
              </div>
           </AnimatedLogoWrapper>
        </div>

        {/* 2. CENTERED NAV PILL */}
        <div className="flex justify-center w-full relative">
          <DesktopNav />
          <MobileNav />
        </div>
      </div>

      <div className="w-full h-24" aria-hidden="true" />
      <SupportWidget />
    </>
  );
};

// --- DESKTOP NAV ---
const DesktopNav = memo(() => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="hidden lg:flex items-center gap-4 pointer-events-auto px-6 py-2 rounded-2xl transition-colors duration-300 bg-white/95 dark:bg-neutral-950/95 border border-neutral-200 dark:border-white/10 shadow-xl"
    >
      {/* REMOVED: Logo container from here */}

      {/* 1. The Dock */}
      <Dock items={NAV_ITEMS} />

      {/* 2. Locked Width Container for FAQ (Optional: keep or move out) */}
      {/* Kept here to maintain the right-side button functionality */}
      <div className="flex justify-end ml-4">
        <div className="hidden md:block">
            <Faq />
        </div>
      </div>
    </motion.div>
  );
});
DesktopNav.displayName = "DesktopNav";

// --- DOCK ---
const Dock = memo(({ items }: { items: typeof NAV_ITEMS }) => {
  const mouseX = useMotionValue(Infinity);
   
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % items.length);
    }, 5000); 

    return () => clearInterval(intervalId);
  }, [items.length]);

  return (
    <div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-2 flex h-[50px] items-end gap-3 px-2"
    >
      {items.map((item, i) => (
        <DockItem 
          key={i} 
          mouseX={mouseX} 
          item={item} 
          isTipActive={i === activeTipIndex} 
        />
      ))}
    </div>
  );
});
Dock.displayName = "Dock";

const DockItem = memo(({ 
  mouseX, 
  item, 
  isTipActive 
}: { 
  mouseX: MotionValue<number>; 
  item: typeof NAV_ITEMS[0];
  isTipActive: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
   
  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-120, 0, 120], [45, 70, 45]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 12 });

  const [hovered, setHovered] = useState(false);

  // Common Gradient for both Button and Tip (Sharp Beam)
  const shimmerGradient = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #3b82f6 50%, #00000000 100%)";

  return (
    <Link href={item.link as any} className="no-underline relative group flex flex-col items-center justify-end">
       
      {/* 1. Main Button Container (with Shimmer) */}
      <motion.div
        ref={ref}
        style={{ width, height: width }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="mac-gpu-accelerate relative flex items-center justify-center rounded-full shadow-sm overflow-hidden z-20"
      >
        {/* A. Rotating Shimmer Gradient (The Border) */}
        <motion.div
            className="absolute inset-[-100%]" 
            animate={{ rotate: 360 }}
            transition={{ 
                duration: 3, // Faster spin for better "glint"
                repeat: Infinity, 
                ease: "linear" 
            }}
            style={{ background: shimmerGradient }}
        />

        {/* B. Inner Mask (The actual button background) */}
        <div className="absolute inset-[1.5px] rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center z-10">
            <div className="w-5 h-5 relative flex items-center justify-center">
                {item.icon}
            </div>
        </div>
      </motion.div>

      {/* 2. Hover Label (Top) */}
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

      {/* 3. Auto Helper Tip (Bottom) */}
      <AnimatePresence mode="wait">
        {!hovered && isTipActive && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
          >
            {/* Pointer */}
            <div className="w-2 h-2 bg-neutral-900 rotate-45 translate-y-[4px] relative z-10 border-t border-l border-transparent" />
             
            {/* Tip Container */}
            <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-lg">
                {/* Rotating Gradient */}
                <motion.div 
                    className="absolute inset-[-100%]"
                    animate={{ rotate: 360 }}
                    transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    style={{ background: shimmerGradient }}
                />
                {/* Inner Content */}
                <div className="relative z-10 px-3 py-1 bg-neutral-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold whitespace-nowrap">
                        Click {item.name}
                    </span>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
});
DockItem.displayName = "DockItem";

// --- MOBILE NAV ---
const MobileNav = memo(() => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex pointer-events-auto relative flex-col lg:hidden w-[95%] mx-auto rounded-2xl z-50 bg-white/95 dark:bg-neutral-950/95 border border-neutral-200 dark:border-white/10 shadow-lg">
      <div className="flex justify-between items-center w-full px-4 py-3">
        {/* Scale logo slightly in mobile too if needed */}
        <div className="scale-110 origin-left">
           <Logo />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><Faq /></div>
          <button onClick={() => setOpen(!open)} className="p-1">
            {open ? <IconX className="w-6 h-6 dark:text-white" /> : <IconMenu2 className="w-6 h-6 dark:text-white" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-1">
              {[...FOOTER_NAV_ITEMS, ...NAV_ITEMS].map((item, i) => (
                <Link
                  key={i}
                  href={item.link as any}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <div className="w-8 h-8 p-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-md">
                    {item.icon}
                  </div>
                  <span className="font-bold text-neutral-600 dark:text-neutral-300">
                    {item.name}
                  </span>
                </Link>
              ))}
              <div className="mt-2 flex justify-center"><Faq /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
MobileNav.displayName = "MobileNav";

// --- SUPPORT WIDGET ---
const SupportWidget = memo(() => {
  const [visible, setVisible] = useState(false);
   
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto group">
      <a
        href="https://t.me/+dlP_A0ebMXs3NTg0"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:scale-105 transition-transform duration-200 shadow-xl"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-black" />
      </a>
    </div>
  );
});
SupportWidget.displayName = "SupportWidget";

const AnimatedLogoWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="hover:scale-105 transition-transform duration-200 active:scale-95 cursor-pointer flex items-center">
    {children}
  </div>
);

export default Navbar;