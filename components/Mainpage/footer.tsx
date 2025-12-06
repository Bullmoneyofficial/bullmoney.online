"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesCore } from "./sparkles"; 
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { 
  Instagram, Youtube, Twitter, MessageCircle, Send, MonitorPlay, 
  X, ChevronRight, ExternalLink, ShieldAlert, AlertTriangle, CheckCircle2, 
  XSquareIcon
} from "lucide-react";

// ==========================================
// 1. REUSABLE "ENHANCED MODAL" COMPONENT
// ==========================================

interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode; // Updated to allow ReactNode for custom headers
  children: React.ReactNode;
  maxWidth?: string;
}

const EnhancedModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-3xl" }: EnhancedModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* 1. Backdrop with blur and fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all"
          />

          {/* 2. Modal Container with "Expand" Spring Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { type: "spring", duration: 0.5, bounce: 0.3 }
            }}
            exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }}
            className={cn(
              "relative w-full overflow-hidden rounded-2xl bg-neutral-950 shadow-2xl shadow-blue-500/10",
              maxWidth
            )}
          >
            {/* 3. The "Shimmer" Border Beam Effect */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
              <div className="absolute top-[50%] left-[50%] h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_50%,#3b82f6_100%)] opacity-20" />
            </div>

            {/* 4. Inner Content Area (Masks the border beam) */}
            <div className="relative z-10 m-[1px] flex max-h-[85vh] flex-col rounded-2xl bg-neutral-950">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
                <div className="text-lg font-semibold tracking-wide text-white drop-shadow-md">
                  {title}
                </div>
                <button
                  onClick={onClose}
                  className="group rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10 hover:text-white text-neutral-400"
                >
                  <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700">
                {/* Subtle Radial Gradient Background inside */}
                <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-neutral-950 to-neutral-950 pointer-events-none" />
                {children}
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end border-t border-white/10 bg-neutral-900/50 px-6 py-4 backdrop-blur-sm">
                <button
                  onClick={onClose}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 px-4 text-sm font-medium text-neutral-300 shadow-sm transition-all hover:bg-neutral-700 hover:text-white focus:ring-2 focus:ring-blue-500/40"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 2. PIXEL CARD & SOCIALS LOGIC
// ==========================================

class Pixel {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInteger: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;

  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    speed: number,
    delay: number
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }
    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    } else {
      this.size -= 0.1;
    }
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    if (this.isReverse) {
      this.size -= this.speed;
    } else {
      this.size += this.speed;
    }
  }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
  const min = 0;
  const max = 100;
  const throttle = 0.001;

  if (value <= min || reducedMotion) {
    return min;
  } else if (value >= max) {
    return max * throttle;
  } else {
    return value * throttle;
  }
}

const VARIANTS = {
  default: {
    activeColor: null,
    gap: 5,
    speed: 35,
    colors: '#f8fafc,#f1f5f9,#cbd5e1',
    noFocus: false
  },
  blue: {
    activeColor: '#e0f2fe',
    gap: 10,
    speed: 25,
    colors: '#60a5fa,#3b82f6,#2563eb', 
    noFocus: false
  },
};

interface PixelCardProps {
  variant?: 'default' | 'blue';
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  className?: string;
  children: React.ReactNode;
}

const PixelCard = ({
  variant = 'default',
  gap,
  speed,
  colors,
  noFocus,
  className = '',
  children
}: PixelCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number | null>(null);
  const timePreviousRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  
  const reducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    const ctx = canvasRef.current.getContext('2d');

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;

    const colorsArray = finalColors.split(',');
    const pxs = [];
    for (let x = 0; x < width; x += parseInt(finalGap.toString(), 10)) {
      for (let y = 0; y < height; y += parseInt(finalGap.toString(), 10)) {
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)];
        const dx = x - width / 2;
        const dy = y - height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delay = reducedMotion ? 0 : distance;
        if (!ctx) return;
        pxs.push(new Pixel(canvasRef.current, ctx, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotion), delay));
      }
    }
    pixelsRef.current = pxs;
  };

  const doAnimate = (fnName: keyof Pixel) => {
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
    const timeNow = performance.now();
    const timePassed = timeNow - timePreviousRef.current;
    const timeInterval = 1000 / 60;

    if (timePassed < timeInterval) return;
    timePreviousRef.current = timeNow - (timePassed % timeInterval);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let allIdle = true;
    for (let i = 0; i < pixelsRef.current.length; i++) {
      const pixel = pixelsRef.current[i];
      // @ts-ignore
      pixel[fnName]();
      if (!pixel.isIdle) {
        allIdle = false;
      }
    }
    if (allIdle) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  };

  const handleAnimation = (name: keyof Pixel) => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(() => doAnimate(name));
  };

  const onMouseEnter = () => handleAnimation('appear');
  const onMouseLeave = () => handleAnimation('disappear');
  const onFocus: React.FocusEventHandler<HTMLDivElement> = e => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    handleAnimation('appear');
  };
  const onBlur: React.FocusEventHandler<HTMLDivElement> = e => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    handleAnimation('disappear');
  };

  useEffect(() => {
    initPixels();
    const observer = new ResizeObserver(() => {
      initPixels();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [finalGap, finalSpeed, finalColors, finalNoFocus]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={finalNoFocus ? undefined : onFocus}
      onBlur={finalNoFocus ? undefined : onBlur}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      <canvas className="absolute inset-0 z-0 h-full w-full pointer-events-none" ref={canvasRef} />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Custom Icons for TikTok/X
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.373 6.373 0 0 0-5.394 10.637 6.354 6.354 0 0 0 5.212-1.936V23h3.445v-4.03a7.276 7.276 0 0 0 7.397-7.397v-4.887z" /></svg>
);
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);

const SocialsRow = () => {
  const socials = [
    { href: "https://www.tiktok.com/@bullmoney.shop?_r=1&_t=ZP-91yqeZbNosA", icon: <TikTokIcon className="w-8 h-8" />, alt: "TikTok" },
    { href: "https://www.instagram.com/bullmoney.shop", icon: <Instagram className="w-8 h-8" />, alt: "Instagram" },
    { href: "https://x.com/BULLMONEYFX", icon: <XIcon className="w-8 h-8" />, alt: "Twitter" },
    { href: "https://affs.click/t5wni", icon: <XSquareIcon className="w-8 h-8" />, alt: "XM" },
    { href: "https://www.youtube.com/@bullmoney.online", icon: <Youtube className="w-8 h-8" />, alt: "YouTube" },
    { href: "https://discord.com/invite/9vVB44ZrNA", icon: <MessageCircle className="w-8 h-8" />, alt: "Discord" },
    { href: "https://t.me/Bullmoneyshop", icon: <Send className="w-8 h-8" />, alt: "Telegram" },
  ];

  const marqueeSocials = useMemo(() => [...socials, ...socials, ...socials], [socials]);

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-6">
      <div className="flex w-full overflow-hidden mask-image-fade">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-33.33%" }}
          transition={{ duration: 35, ease: "linear", repeat: Infinity }}
          className="flex min-w-full items-center gap-6 px-4"
        >
          {marqueeSocials.map((s, i) => (
            <SocialIcon key={`${s.alt}-${i}`} {...s} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const SocialIcon = ({ href, icon, alt }: { href: string; icon: React.ReactNode; alt: string }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group block shrink-0">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <PixelCard
          variant="blue"
          gap={4}
          speed={30}
          noFocus={true}
          className="flex h-20 w-32 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-neutral-900/50 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.4)]"
        >
          <div className="text-neutral-300 group-hover:text-blue-400 transition-colors duration-300">
            {icon}
          </div>
        </PixelCard>
      </motion.div>
    </a>
  );
};

// ==========================================
// 3. DISCLAIMER HELPER COMPONENT
// ==========================================

const DisclaimerSection = ({ number, title, text }: { number: string; title: string; text: string }) => (
  <div className="group rounded-lg border border-white/5 bg-neutral-900/50 p-4 hover:border-white/10 transition-colors">
    <h3 className="flex items-center gap-3 font-semibold text-white mb-2">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10 text-[10px] font-bold text-blue-400 font-mono">
        {number}
      </span>
      {title}
    </h3>
    <p className="text-neutral-400 text-sm pl-9">
      {text}
    </p>
  </div>
);

// ==========================================
// 4. MAIN FOOTER COMPONENT
// ==========================================

export function Footer() {
  const [openDisclaimer, setOpenDisclaimer] = useState(false);
  const [openApps, setOpenApps] = useState(false);

  // Button Styles
  const btnBase = "h-10 inline-flex items-center justify-center rounded-md px-3 text-sm font-medium transition duration-200";
  const btnOutline = `${btnBase} border border-neutral-700 hover:bg-neutral-800 text-neutral-300`;
  const btnPrimary = `${btnBase} bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 hover:brightness-110 active:scale-[0.98]`;

  const apps = [
    {
      title: "MetaTrader 5",
      links: [
        { label: "Google Play", href: "https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5&pcampaignid=web_share" },
        { label: "App Store (ZA)", href: "https://apps.apple.com/za/app/metatrader-5/id413251709" },
        { label: "App Store (SC)", href: "https://apps.apple.com/sc/app/metatrader-5/id413251709" },
      ],
    },
    {
      title: "TradingView",
      links: [
        { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.tradingview.tradingviewapp&pcampaignid=web_share" },
        { label: "App Store", href: "https://apps.apple.com/us/app/tradingview-track-all-markets/id1205990992" },
        { label: "Windows (.msix)", href: "https://tvd-packages.tradingview.com/stable/latest/win32/TradingView.msix" },
        { label: "macOS (.dmg)", href: "https://tvd-packages.tradingview.com/stable/latest/darwin/TradingView.dmg" },
      ],
    },
    {
      title: "Bullmoney Indicators",
      links: [
        { label: "Premium", href: "https://www.tradingview.com/script/OCrInl1O-BULLMONEY-PREMIUM/" },
        { label: "Free", href: "https://www.tradingview.com/script/CaYXTswS-BULLMONEY/" },
      ],
    },
  ];

  return (
    <div className="border-t border-neutral-100 dark:border-white/10 pt-16 pb-8 bg-black text-neutral-300 w-full relative overflow-hidden">
      
      {/* SPARKLES BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <SparklesCore
          id="tsparticlesfooter"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Top gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-sky-500/10 to-transparent z-0" />
      
      {/* Content Wrapper */}
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col gap-10">
        
        {/* Infinite Socials Row */}
        <div className="w-full border-b border-white/5 pb-8">
            <p className="text-center text-sm text-neutral-500 mb-4 font-semibold uppercase tracking-widest">Join the Community</p>
            <SocialsRow />
        </div>

        {/* Main Footer Layout */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 px-8">
          
          {/* Brand & Copyright */}
          <div className="flex-shrink-0">
            <div className="mb-4">
              <Logo />
            </div>
            <div className="text-neutral-400 text-sm">
              &copy; copyright Bullmoney 2024.<br/>All rights reserved.
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-8 w-full md:justify-end">
            <div className="space-y-3">
              <p className="font-semibold text-neutral-200 text-sm">Apps &amp; Tools</p>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpenApps(true)}
                className={btnPrimary + " w-56"}
              >
                View Apps &amp; Tools
              </motion.button>
            </div>
            
            <div className="space-y-3">
              <p className="font-semibold text-neutral-200 text-sm">Legal</p>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpenDisclaimer(true)}
                className={btnOutline + " w-56"}
              >
                View Financial Disclaimer
              </motion.button>
            </div>

            
            
          </div>
        </div>
      </div>

      {/* ========= ENHANCED APPS MODAL ========= */}
      <EnhancedModal 
        isOpen={openApps} 
        onClose={() => setOpenApps(false)} 
        title="Apps & Tools"
      >
        <div className="space-y-8">
          {apps.map((app, idx) => (
            <motion.section 
              key={idx} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-center text-sm font-bold uppercase tracking-widest text-blue-400/80">
                {app.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {app.links.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    target="_blank"
                    className="group relative flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 px-4 text-sm text-neutral-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-blue-400" />
                  </Link>
                ))}
                {app.title === "Bullmoney Indicators" && (
                  <Link
                    href="https://drive.google.com/drive/folders/1aVKPzJAkUqiZqVQnYIZ7M4E0lNOQ2kIi"
                    target="_blank"
                    className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Premium PDFs
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.section>
          ))}
        </div>
      </EnhancedModal>

      {/* ========= ENHANCED DISCLAIMER MODAL (EXTENDED) ========= */}
      <EnhancedModal 
        isOpen={openDisclaimer} 
        onClose={() => setOpenDisclaimer(false)} 
        title={
          <div className="flex items-center gap-2 text-white">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <span>Legal & Financial Disclaimer</span>
          </div>
        }
      >
        <div className="flex flex-col h-full max-h-[70vh]">
          
          {/* SCROLLABLE CONTENT AREA */}
          <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 text-sm leading-relaxed text-neutral-400">
            
            {/* ALERT BANNER */}
            <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-red-500/5 p-5">
               <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 bg-red-500/10 blur-xl rounded-full pointer-events-none"></div>
               <div className="flex gap-4">
                 <div className="mt-1 shrink-0">
                   <AlertTriangle className="h-5 w-5 text-red-500" />
                 </div>
                 <div>
                   <h2 className="text-sm font-bold text-white tracking-wide uppercase mb-1">Critical Legal Notice</h2>
                   <p className="text-xs text-red-200/70">
                     This agreement affects your legal rights. Please read extensively before using our Shop or Services.
                   </p>
                 </div>
               </div>
            </div>

            <p className="text-neutral-300">
              By accessing <span className="font-semibold text-white">Bullmoney</span> (the “Site”), purchasing products from the Shop, or using our services, you acknowledge and agree to the following terms without reservation.
            </p>

            {/* EXTENDED SECTIONS */}
            <div className="space-y-4">
              <DisclaimerSection 
                number="01" 
                title="No Financial Advice & Education Only" 
                text="Bullmoney is strictly an educational platform and software provider. We are NOT financial advisors, brokers, or registered investment analysts. No content herein constitutes a recommendation to buy or sell any specific asset. You are solely responsible for your own investment decisions."
              />
              
              <DisclaimerSection 
                number="02" 
                title="Extreme Risk Warning" 
                text="Trading Foreign Exchange (Forex) and Contracts for Difference (CFDs) on margin carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. There is a possibility that you may sustain a loss of some or all of your initial investment."
              />

              <DisclaimerSection 
                number="03" 
                title="Shop Policy: Digital Goods & Refunds" 
                text="All products sold via the Bullmoney Shop (including Indicators, PDFs, software, and courses) are intangible digital goods. Due to the nature of digital content, ALL SALES ARE FINAL. We do not offer refunds once the product has been accessed or downloaded. These tools are technical aids and do not guarantee profitability."
              />

              <DisclaimerSection 
                number="04" 
                title="Affiliate Disclosure" 
                text="Bullmoney may contain affiliate links to third-party brokerage services. We may receive a commission if you sign up through our links. This does not impact the cost to you. We do not own, operate, or control these third-party brokers and are not liable for their solvency or actions."
              />

              <DisclaimerSection 
                number="05" 
                title="Jurisdictional Restrictions" 
                text="Services and products are not intended for distribution to any person in any country where such distribution or use would be contrary to local law or regulation. It is the responsibility of the visitor to ascertain the terms of and comply with any local law or regulation to which they are subject."
              />

               <DisclaimerSection 
                number="06" 
                title="Limitation of Liability" 
                text="Under no circumstances shall Bullmoney, its owners, or affiliates be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our website, shop products, or signals. You assume full responsibility for your trading results."
              />
            </div>

            <div className="py-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
            </div>

            <p className="italic text-neutral-500 text-xs text-center px-4">
              By clicking "I Agree & Understand" below, you legally confirm that you have read, understood, and accepted full responsibility for your actions on this platform.
            </p>
          </div>

          {/* FIXED ACTION FOOTER */}
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
            <button 
              onClick={() => setOpenDisclaimer(false)}
              className="group flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-all active:scale-95 text-sm"
            >
              <span>I Agree & Understand</span>
              <CheckCircle2 className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
            </button>
          </div>

        </div>
      </EnhancedModal>

    </div>
  );
}