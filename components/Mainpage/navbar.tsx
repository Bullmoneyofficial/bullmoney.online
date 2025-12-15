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
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
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

const SHIMMER_GRADIENT = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #3b82f6 50%, #00000000 100%)";

// --- MAIN NAVBAR ---
export const Navbar = () => {
  return (
    <>
      <style jsx global>{GLOBAL_STYLES}</style>

      {/* Navbar Container */}
      <div className="fixed top-0 inset-x-0 z-[1000] pointer-events-none select-none h-32 lg:h-24">
        
        {/* --- DESKTOP LAYOUT --- */}
        <div className="hidden lg:block">
            <div className="absolute left-10 top-8 z-[1010] pointer-events-auto">
                <AnimatedLogoWrapper>
                    <div className="scale-150 origin-top-left min-w-max whitespace-nowrap">
                        <Logo />
                    </div>
                </AnimatedLogoWrapper>
            </div>
            <div className="flex justify-center w-full relative pt-6">
                <DesktopNav />
            </div>
        </div>

        {/* --- MOBILE/TAB LAYOUT --- */}
        <div className="lg:hidden flex justify-between items-start w-full px-4 pt-4 z-[1010]">
            
            {/* 1. Mobile Logo (Left) */}
            <div className="pointer-events-auto pt-2 shrink-0 relative z-50">
               <AnimatedLogoWrapper>
                  <div className="scale-110 origin-top-left min-w-max whitespace-nowrap">
                     <Logo />
                  </div>
               </AnimatedLogoWrapper>
            </div>

            {/* 2. Mobile Nav Pill (Right) */}
            {/* Added md:max-w-md to allow more space on tablets */}
            <div className="pointer-events-auto ml-2 flex justify-end min-w-0 flex-1 relative z-50">
               <MobileNav />
            </div>
        </div>
      </div>

      <div className="w-full h-32 lg:h-24" aria-hidden="true" />
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
      className="flex items-center gap-4 pointer-events-auto px-6 py-2 rounded-2xl transition-colors duration-300 bg-white/95 dark:bg-neutral-950/95 border border-neutral-200 dark:border-white/10 shadow-xl"
    >
      <Dock items={NAV_ITEMS} />
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

const DockItem = memo(({ mouseX, item, isTipActive }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-120, 0, 120], [45, 70, 45]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 12 });
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={item.link} className="no-underline relative group flex flex-col items-center justify-end">
      <motion.div
        ref={ref}
        style={{ width, height: width }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="mac-gpu-accelerate relative flex items-center justify-center rounded-full shadow-sm overflow-hidden z-20"
      >
        <motion.div
            className="absolute inset-[-100%]" 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: SHIMMER_GRADIENT }}
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
          <HelperTip item={item} />
        )}
      </AnimatePresence>
    </Link>
  );
});
DockItem.displayName = "DockItem";

// --- MOBILE NAV (FIXED HELPERS) ---
const MobileNav = memo(() => {
  const [open, setOpen] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  // Cycle Tips
  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % NAV_ITEMS.length);
    }, 4000); 
    return () => clearInterval(intervalId);
  }, []);

  // Auto-Scroll to Active Tip
  useEffect(() => {
    const container = scrollRef.current;
    const activeItem = itemsRef.current[activeTipIndex];

    if (container && activeItem) {
      const containerWidth = container.offsetWidth;
      const itemLeft = activeItem.offsetLeft;
      const itemWidth = activeItem.offsetWidth;
      const scrollLeft = itemLeft - (containerWidth / 2) + (itemWidth / 2);

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [activeTipIndex]);

  return (
    <motion.div 
      animate={{ width: "auto" }}
      // REMOVED 'overflow-hidden' here to let tips breathe if needed, handled by inner containers
      className="flex flex-col items-end bg-white/95 dark:bg-neutral-950/95 border border-neutral-200 dark:border-white/10 shadow-lg rounded-2xl relative max-w-full"
    >
      
      {/* 1. HEADER ROW */}
      <div className="flex items-center gap-1.5 p-1.5 relative z-20 max-w-full"> 
         
         {/* CRITICAL FIX: 
            1. Added 'pb-8' to give vertical space for the tooltip inside the scroll container.
            2. Added 'md:max-w-none' so on tablets (small tabs) it expands fully and doesn't scroll unnecessarily.
         */}
         <div 
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pr-1 pb-8 mb-[-32px] max-w-[50vw] sm:max-w-[60vw] md:max-w-none"
         >
            {NAV_ITEMS.map((item, i) => (
               <Link 
                 key={i} 
                 href={item.link as any} 
                 ref={(el) => { itemsRef.current[i] = el; }}
                 className="relative flex-shrink-0 flex flex-col items-center group pt-1" // Added pt-1
               >
                  <div className="w-8 h-8 relative flex items-center justify-center rounded-full overflow-hidden shadow-sm z-20">
                      <motion.div
                        className="absolute inset-[-100%]" 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        style={{ background: SHIMMER_GRADIENT }}
                      />
                      <div className="absolute inset-[1.5px] rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center z-10">
                         <div className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-300">
                           {item.icon}
                         </div>
                      </div>
                  </div>

                  {/* Helper Tip (Mobile) */}
                  {/* Positioned slightly higher (top-9) to fit within the pb-8 padding */}
                  <AnimatePresence mode="wait">
                    {activeTipIndex === i && !open && (
                      <HelperTip item={item} isMobile={true} />
                    )}
                  </AnimatePresence>
               </Link>
            ))}
         </div>

         {/* FIXED SEPARATOR & MENU BUTTON */}
         <div className="flex-shrink-0 flex items-center pl-1 border-l border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 z-30 h-8 self-start mt-1">
            <button onClick={() => setOpen(!open)} className="p-1 ml-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                {open ? <IconX className="w-5 h-5 dark:text-white" /> : <IconMenu2 className="w-5 h-5 dark:text-white" />}
            </button>
         </div>
      </div>

      {/* 2. EXPANDABLE LIST */}
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
                  onClick={() => setOpen(false)}
                  className="relative group block rounded-xl overflow-hidden"
                >
                    <motion.div
                        className="absolute inset-[-100%]" 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        style={{ background: SHIMMER_GRADIENT }}
                    />
                    <div className="relative m-[1px] bg-white dark:bg-neutral-900 rounded-xl flex items-center gap-4 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <div className="w-8 h-8 p-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-md">
                            {item.icon}
                        </div>
                        <span className="font-bold text-neutral-600 dark:text-neutral-300">
                            {item.name}
                        </span>
                    </div>
                </Link>
              ))}
              <div className="mt-2 flex justify-center"><Faq /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
MobileNav.displayName = "MobileNav";

// --- REUSABLE COMPONENT: HELPER TIP ---
const HelperTip = ({ item, isMobile = false }: { item: any, isMobile?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: -5, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -5, scale: 0.8 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    // Fixed: Adjusted top position to sit tightly under the icon inside the padding area
    className={`absolute ${isMobile ? 'top-[36px]' : 'top-full mt-2'} left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none`}
  >
    <div className="w-2 h-2 bg-neutral-900 rotate-45 translate-y-[4px] relative z-10 border-t border-l border-transparent" />
    <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-lg">
        <motion.div 
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: SHIMMER_GRADIENT }}
        />
        <div className="relative z-10 px-2.5 py-0.5 bg-neutral-900 rounded-full flex items-center justify-center">
            <span className="text-white text-[9px] font-bold whitespace-nowrap">
                Click {item.name}
            </span>
        </div>
    </div>
  </motion.div>
);

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