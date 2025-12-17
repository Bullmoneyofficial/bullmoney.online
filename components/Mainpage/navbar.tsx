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
  MessageCircle,
  Layers,
  ScanFace, // <--- Added Icon for ID
  X // <--- Added for closing modal
} from "lucide-react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import BullLogo from "@/public/BULL.svg"; 
import Faq from "@/app/shop/Faq";

// --- IMPORT YOUR CARD ---
import ReflectiveCard, { ReflectiveCardHandle } from '@/components/ReflectiveCard';

// --- TYPE DEFINITION ---
type ThemeControlProps = {
  setShowConfigurator?: (show: boolean) => void; 
  activeThemeId?: string;
  onThemeChange?: (themeId: string) => void;
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

// --- MAIN NAVBAR COMPONENT ---
export const Navbar = ({ 
  setShowConfigurator = () => {} 
}: ThemeControlProps) => {
  // State for the Identity Card Modal
  const [showIdModal, setShowIdModal] = useState(false);

  return (
    <>
      <style jsx global>{GLOBAL_STYLES}</style>

      {/* Navbar Container */}
      <div className="fixed top-0 inset-x-0 z-[1000] pointer-events-none select-none h-32 lg:h-24">
        
        {/* --- DESKTOP LAYOUT --- */}
        <div className="hidden lg:block">
            <div className="absolute left-10 top-6 z-[1010] pointer-events-auto">
                <AnimatedLogoWrapper>
                    <Image 
                      src={BullLogo} 
                      alt="Bull Logo" 
                      width={55}
                      height={55}
                      className="object-contain drop-shadow-sm"
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
                />
            </div>
        </div>

        {/* --- MOBILE/TAB LAYOUT --- */}
        <div className="lg:hidden flex justify-between items-start w-full px-4 pt-4 z-[1010]">
            <div className="pointer-events-auto pt-2 shrink-0 relative z-50">
               <AnimatedLogoWrapper>
                   <Image 
                      src={BullLogo} 
                      alt="Bull Logo" 
                      width={45} 
                      height={45} 
                      className="object-contain drop-shadow-sm"
                      priority
                   />
                   <span className="font-black text-xl tracking-tighter text-neutral-900 dark:text-white">
                      BULLMONEY
                   </span>
               </AnimatedLogoWrapper>
            </div>

            <div className="pointer-events-auto ml-2 flex justify-end min-w-0 flex-1 relative z-50">
               <MobileNav 
                 setShowConfigurator={setShowConfigurator} 
                 setShowIdModal={setShowIdModal}
               />
            </div>
        </div>
      </div>

      <div className="w-full h-32 lg:h-24" aria-hidden="true" />
      <SupportWidget />

      {/* --- ID CARD MODAL --- */}
      <IdModal isOpen={showIdModal} onClose={() => setShowIdModal(false)} />
    </>
  );
};

// --- ID MODAL COMPONENT ---
const IdModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  // Ref to trigger the card's verification
  const cardRef = useRef<ReflectiveCardHandle>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Trigger verification automatically when modal opens? 
  // Or let user click button. Let's let them click the button on the card.

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
                onClick={onClose}
                className="absolute -right-12 top-0 p-2 text-white/50 hover:text-white transition-colors"
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
{/* External Trigger Button */}
{!isVerified && (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }} // delay removed from here
    transition={{ delay: 0.2 }}    // moved to transition prop
    onClick={() => cardRef.current?.triggerVerify()}
    className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-transform"
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
const DesktopNav = memo(({ setShowConfigurator, setShowIdModal }: { setShowConfigurator: (show: boolean) => void, setShowIdModal: (show: boolean) => void }) => {
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
      />
      
      <div className="flex justify-end ml-2 gap-2 items-center border-l border-neutral-200 dark:border-white/10 pl-4">
        <div className="hidden md:block">
            <Faq />
        </div>
      </div>
    </motion.div>
  );
});
DesktopNav.displayName = "DesktopNav";

// --- DOCK COMPONENT ---
const Dock = memo(({ items, setShowConfigurator, setShowIdModal }: any) => {
  const mouseX = useMotionValue(Infinity);
  // Total items is NAV_ITEMS.length + 2 (Theme + ID)
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % (items.length + 2));
    }, 4000); 
    return () => clearInterval(intervalId);
  }, [items.length]);

  const themeItemData = {
    name: "THEME",
    icon: <Layers className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
    link: null
  };

  const idItemData = {
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
      {items.map((item: any, i: number) => (
        <DockItem 
          key={i} 
          mouseX={mouseX} 
          item={item} 
          isTipActive={i === activeTipIndex} 
        />
      ))}

      {/* ID Button */}
      <DockItem 
        mouseX={mouseX}
        item={idItemData}
        isTipActive={activeTipIndex === items.length}
        onClick={() => setShowIdModal(true)}
      />

      {/* Theme Button */}
      <DockItem 
        mouseX={mouseX}
        item={themeItemData}
        isTipActive={activeTipIndex === items.length + 1}
        onClick={() => setShowConfigurator(true)}
      />
    </div>
  );
});
Dock.displayName = "Dock";

// --- DOCK ITEM ---
const DockItem = memo(({ mouseX, item, isTipActive, onClick }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-120, 0, 120], [45, 70, 45]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 180, damping: 12 });
  const [hovered, setHovered] = useState(false);

  const content = (
    <>
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
    </>
  );

  if (onClick) {
    return (
        <button onClick={onClick} className="relative group flex flex-col items-center justify-end outline-none">
            {content}
        </button>
    );
  }

  return (
    <Link href={item.link} className="no-underline relative group flex flex-col items-center justify-end">
      {content}
    </Link>
  );
});
DockItem.displayName = "DockItem";

// --- MOBILE NAV ---
const MobileNav = memo(({ setShowConfigurator, setShowIdModal }: { setShowConfigurator: (show: boolean) => void, setShowIdModal: (show: boolean) => void }) => {
  const [open, setOpen] = useState(false);
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  const themeItem = { 
    name: "THEME", 
    icon: <Layers className="h-full w-full text-neutral-500 dark:text-neutral-300" /> 
  };
  
  const idItem = { 
    name: "ID", 
    icon: <ScanFace className="h-full w-full text-neutral-500 dark:text-neutral-300" /> 
  };

  useEffect(() => {
    // Length + 2 for Theme & ID
    const intervalId = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % (NAV_ITEMS.length + 2));
    }, 4000); 
    return () => clearInterval(intervalId);
  }, []);

  // ... (Keep scrolling logic same as before, just account for extra items) ...
  
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
         <div 
            ref={scrollRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pr-1 pb-8 mb-[-32px] max-w-[50vw] sm:max-w-[60vw] md:max-w-none"
         >
            {/* 1. Loop standard items */}
            {NAV_ITEMS.map((item, i) => (
               <Link 
                 key={i} 
                 href={item.link as any} 
                 ref={(el) => { itemsRef.current[i] = el; }}
                 className="relative flex-shrink-0 flex flex-col items-center group pt-1" 
               >
                  <MobileNavItemContent item={item} />
                  {/* Tip Logic... */}
               </Link>
            ))}

            {/* 2. Add ID Button */}
            <button
                onClick={handleOpenId}
                ref={(el) => { itemsRef.current[NAV_ITEMS.length] = el; }}
                className="relative flex-shrink-0 flex flex-col items-center group pt-1"
            >
                <MobileNavItemContent item={idItem} />
            </button>

            {/* 3. Add Theme Button */}
            <button
                onClick={handleOpenConfigurator}
                ref={(el) => { itemsRef.current[NAV_ITEMS.length + 1] = el; }}
                className="relative flex-shrink-0 flex flex-col items-center group pt-1"
            >
                <MobileNavItemContent item={themeItem} />
            </button>
         </div>

         {/* ... Menu Toggle Button ... */}
         <div className="flex-shrink-0 flex items-center pl-1 border-l border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 z-30 h-8 self-start mt-1">
            <button onClick={() => setOpen(!open)} className="p-1 ml-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                {open ? <IconX className="w-5 h-5 dark:text-white" /> : <IconMenu2 className="w-5 h-5 dark:text-white" />}
            </button>
         </div>
      </div>

      {/* ... Expanded Menu (Keep same) ... */}
      <AnimatePresence>
        {open && (
           <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full min-w-[200px] overflow-hidden rounded-b-2xl relative z-40" 
          >
            {/* Same expanded list logic */}
            <div className="px-4 pb-4 pt-2 flex flex-col gap-3 border-t border-neutral-100 dark:border-white/5 w-full bg-white/95 dark:bg-neutral-950/95">
               {/* Add ID button to expanded list if desired, or keep it in the top row */}
               {[...FOOTER_NAV_ITEMS, ...NAV_ITEMS].map((item, i) => (
                  <Link key={i} href={item.link as any} onClick={() => setOpen(false)} className="relative group block rounded-xl overflow-hidden">
                     {/* ... Item Design ... */}
                     <div className="relative m-[1px] bg-white dark:bg-neutral-900 rounded-xl flex items-center gap-4 p-2">
                        <div className="w-8 h-8 p-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-md">{item.icon}</div>
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
const MobileNavItemContent = ({ item }: { item: any }) => (
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
);

const HelperTip = ({ item, isMobile = false }: { item: any, isMobile?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: -5, scale: 0.8 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -5, scale: 0.8 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="hover:scale-105 transition-transform duration-200 active:scale-95 cursor-pointer flex items-center gap-2 lg:gap-3"
  >
    {children}
  </motion.div>
);