"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesCore } from "./sparkles"; 
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import {
  Instagram, Youtube, MessageCircle, Send,
  X, ChevronRight, ExternalLink, ShieldAlert, AlertTriangle, CheckCircle2,
  XSquareIcon
} from "lucide-react";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

// ==========================================
// STYLES (Using unified shimmer from UnifiedShimmer.tsx)
// Keyframes removed - now in UnifiedShimmer.tsx for performance
// ==========================================
const FooterStyles = () => (
  <style jsx global>{`
    /* Scrollbar styles only - shimmer animations come from UnifiedShimmer.tsx */
    .footer-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .footer-scrollbar::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.3);
      border-radius: 3px;
    }
    .footer-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.4);
      border-radius: 3px;
    }
    .footer-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(59, 130, 246, 0.6);
    }
  `}</style>
);

// ==========================================
// 1. REUSABLE "ENHANCED MODAL" COMPONENT
// ==========================================

interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

const EnhancedModal = ({ isOpen, onClose, title, children, maxWidth = "max-w-3xl" }: EnhancedModalProps) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-2 xs:p-3 sm:p-4 md:p-6"
        >
          {/* Backdrop */}
          <div 
            onClick={onClose}
            className="absolute inset-0 bg-black/90"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className={cn(
              "relative w-full overflow-hidden rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl shadow-2xl shadow-blue-500/30",
              maxWidth
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Spinning Shimmer Border */}
            <div className="absolute inset-[-2px] overflow-hidden rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl pointer-events-none">
              <div className="absolute inset-0 shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#60a5fa_50%,#3b82f6_75%,#00000000_100%)] opacity-80" />
            </div>

            {/* Inner Content Area */}
            <div className="relative z-10 m-[2px] flex max-h-[90vh] xs:max-h-[88vh] sm:max-h-[85vh] md:max-h-[82vh] lg:max-h-[80vh] flex-col rounded-xl xs:rounded-2xl sm:rounded-2xl md:rounded-3xl bg-black overflow-hidden">
              
              {/* Header */}
              <div className="relative flex items-center justify-between border-b border-blue-500/30 px-3 xs:px-4 sm:px-5 md:px-6 py-2.5 xs:py-3 sm:py-3.5 md:py-4 bg-neutral-950 shrink-0">
                {/* Header shimmer effect - left to right */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/15 to-transparent shimmer-line shimmer-gpu" />
                </div>
                
                {/* Top glow line */}
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
                
                <div className="relative text-sm xs:text-base sm:text-lg md:text-xl font-semibold tracking-wide text-white truncate pr-3">
                  {title}
                </div>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="relative z-[9999999] p-1.5 xs:p-2 sm:p-2 md:p-2.5 rounded-full bg-neutral-900 border border-blue-500/40 hover:border-blue-400/70 text-neutral-400 hover:text-white hover:bg-blue-500/20 transition-all duration-300 min-w-[36px] min-h-[36px] xs:min-w-[40px] xs:min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center group flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-90 duration-300" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-4 sm:py-5 md:py-6 footer-scrollbar relative bg-neutral-950">
                {/* Radial Gradient Background */}
                <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1)_0%,transparent_60%)] pointer-events-none" />
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 2. PIXEL CARD & SOCIALS LOGIC (Optimized)
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
  const isMountedRef = useRef(true);
  const [isVisible, setIsVisible] = useState(false);
  
  const reducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = useCallback(() => {
    if (!containerRef.current || !canvasRef.current || !isMountedRef.current) return;

    try {
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      
      if (width <= 0 || height <= 0) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      canvasRef.current.width = width;
      canvasRef.current.height = height;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;

      const colorsArray = finalColors.split(',');
      const pxs = [];
      const gapValue = Math.max(1, parseInt(finalGap.toString(), 10));
      
      for (let x = 0; x < width; x += gapValue) {
        for (let y = 0; y < height; y += gapValue) {
          const color = colorsArray[Math.floor(Math.random() * colorsArray.length)] || "#FFFFFF";
          const dx = x - width / 2;
          const dy = y - height / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const delay = reducedMotion ? 0 : distance;
          pxs.push(new Pixel(canvasRef.current, ctx, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotion), delay));
        }
      }
      pixelsRef.current = pxs;
    } catch (error) {
      console.warn('PixelCard initPixels error:', error);
    }
  }, [finalColors, finalGap, finalSpeed, reducedMotion]);

  const doAnimate = useCallback((fnName: keyof Pixel) => {
    if (!isMountedRef.current) return;
    
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
    
    try {
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
        if (!pixel) continue;
        // @ts-ignore
        pixel[fnName]();
        if (!pixel.isIdle) {
          allIdle = false;
        }
      }
      if (allIdle && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    } catch (error) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, []);

  const handleAnimation = useCallback((name: keyof Pixel) => {
    if (!isMountedRef.current) return;
    
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(() => doAnimate(name));
  }, [doAnimate]);

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
    isMountedRef.current = true;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { rootMargin: '50px', threshold: 0 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      isMountedRef.current = false;
      observer.disconnect();
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      initPixels();
    }
    
    const resizeObserver = new ResizeObserver(() => {
      if (isVisible && isMountedRef.current) {
        initPixels();
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [isVisible, initPixels]);

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
      {isVisible && (
        <canvas className="absolute inset-0 z-0 h-full w-full pointer-events-none" ref={canvasRef} />
      )}
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
  const socials = useMemo(() => [
    { href: "https://www.tiktok.com/@bullmoney.shop?_r=1&_t=ZP-91yqeZbNosA", icon: <TikTokIcon className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "TikTok" },
    { href: "https://www.instagram.com/bullmoney.shop", icon: <Instagram className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "Instagram" },
    { href: "https://x.com/BULLMONEYFX", icon: <XIcon className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "Twitter" },
    { href: "https://affs.click/t5wni", icon: <XSquareIcon className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "XM" },
    { href: "https://www.youtube.com/@bullmoney.online", icon: <Youtube className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "YouTube" },
    { href: "https://discord.com/invite/9vVB44ZrNA", icon: <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "Discord" },
    { href: "https://t.me/Bullmoneyshop", icon: <Send className="w-6 h-6 sm:w-7 sm:h-7" />, alt: "Telegram" },
  ], []);

  const marqueeSocials = useMemo(() => [...socials, ...socials, ...socials], [socials]);

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-4 sm:py-6">
      <div className="flex w-full overflow-hidden mask-image-fade">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-33.33%" }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          className="flex min-w-full items-center gap-3 sm:gap-6 px-2 sm:px-4"
        >
          {marqueeSocials.map((s, i) => (
            <SocialIcon key={`${s.alt}-${i}`} {...s} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

const SocialIcon = ({ href, icon, alt: _alt }: { href: string; icon: React.ReactNode; alt: string }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group block shrink-0">
      <motion.div 
        whileHover={{ scale: 1.05, y: -2 }} 
        whileTap={{ scale: 0.95 }}
        className="relative flex h-12 w-16 sm:h-14 sm:w-20 md:h-16 md:w-24 shrink-0 items-center justify-center rounded-xl overflow-hidden"
      >
        {/* Solid dark background - NO blur */}
        <div className="absolute inset-0 bg-neutral-900 border border-blue-500/30 group-hover:border-blue-400/60 transition-all duration-300 rounded-xl" />
        
        {/* Shimmer effect - left to right */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 shimmer-line shimmer-gpu transition-opacity duration-300" />
        </div>
        
        {/* Top glow line on hover */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 text-neutral-400 group-hover:text-blue-400 transition-colors duration-300">
          {icon}
        </div>
      </motion.div>
    </a>
  );
};

// ==========================================
// 3. DISCLAIMER HELPER COMPONENT
// ==========================================

const DisclaimerSection = ({ number, title, text }: { number: string; title: string; text: string }) => (
  <div className="group relative rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl overflow-hidden transition-all duration-300">
    {/* Solid black background with blue border */}
    <div className="absolute inset-0 bg-black border border-blue-500/20 group-hover:border-blue-500/40 rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl transition-all duration-300" />
    
    {/* Shimmer on hover - left to right */}
    <div className="absolute inset-0 overflow-hidden rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl pointer-events-none">
      <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 shimmer-line shimmer-gpu transition-opacity duration-300" />
    </div>
    
    <div className="relative p-2 xs:p-2.5 sm:p-3 md:p-4">
      <h3 className="flex items-center gap-1.5 xs:gap-2 sm:gap-2 md:gap-3 font-semibold text-white mb-1.5 xs:mb-2 sm:mb-2 md:mb-2 text-xs xs:text-sm sm:text-sm md:text-base">
        <span className="flex h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 items-center justify-center rounded text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-400 font-mono border border-blue-500/30 bg-blue-500/20 flex-shrink-0">
          {number}
        </span>
        <span className="line-clamp-2">{title}</span>
      </h3>
      <p className="text-neutral-400 text-[9px] xs:text-[10px] sm:text-xs md:text-sm pl-5 xs:pl-6 sm:pl-6 md:pl-7 leading-relaxed">
        {text}
      </p>
    </div>
  </div>
);

// ==========================================
// 4. NAVBAR-STYLE BUTTON COMPONENT
// ==========================================

interface FooterButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}

const FooterButton = ({ onClick, children, variant = 'secondary', icon }: FooterButtonProps) => {
  const isPrimary = variant === 'primary';
  
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => { SoundEffects.click(); onClick(); }}
      onMouseEnter={() => SoundEffects.hover()}
      className={cn(
        "relative group h-10 sm:h-11 inline-flex items-center justify-center rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden min-w-[44px]",
        isPrimary && "text-white",
        !isPrimary && "text-neutral-300 hover:text-white"
      )}
    >
      {/* Spinning shimmer border for primary */}
      {isPrimary && (
        <span className="absolute inset-[-2px] shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-80 rounded-xl" />
      )}
      
      {/* Solid background - NO blur */}
      <span className={cn(
        "absolute inset-[1px] rounded-xl transition-all duration-300",
        isPrimary 
          ? "bg-neutral-900 border border-blue-500/50 group-hover:border-blue-400/70 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
          : "bg-neutral-900/90 border-2 border-blue-500/30 group-hover:border-blue-400/60 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
      )} />
      
      {/* Shimmer effect on hover */}
      <span className="absolute inset-0 overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent shimmer-line shimmer-gpu" />
      </span>
      
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="text-blue-400">{icon}</span>}
        {children}
      </span>
    </motion.button>
  );
};

// ==========================================
// 5. MAIN FOOTER COMPONENT - Navbar-Style Design
// ==========================================

export function Footer() {
  const [openDisclaimer, setOpenDisclaimer] = useState(false);
  const [openApps, setOpenApps] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const apps = useMemo(() => [
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
  ], []);

  return (
    <>
      {/* Inject keyframes once */}
      <FooterStyles />
    
      <footer id="footer" className="relative w-full overflow-hidden" data-allow-scroll style={{ touchAction: 'pan-y' }}>
        {/* === FULL GLASS SHIMMER CONTAINER - Like Navbar === */}
        <div className="relative group">
          
          {/* Spinning Conic Gradient Shimmer Border */}
          <span className="absolute inset-[-2px] shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_25%,#60a5fa_50%,#3b82f6_75%,#00000000_100%)] opacity-50 rounded-t-2xl sm:rounded-t-3xl" />
          
          {/* Solid Background Container */}
          <div className="relative bg-black border-t-2 border-blue-500/40 hover:border-blue-400/60 transition-all duration-500 rounded-t-2xl sm:rounded-t-3xl">
            
            {/* Top Shimmer Line - Left to Right */}
            <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
              <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500 to-transparent shimmer-line shimmer-gpu" />
            </div>
            
            {/* Subtle Blue Glow - Top */}
            <div className="absolute inset-x-0 top-0 h-32 sm:h-40 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent pointer-events-none rounded-t-2xl sm:rounded-t-3xl" />
            
            {/* Radial Glow Effect */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none" />
            
            {/* SPARKLES BACKGROUND */}
            {isMounted && (
              <div className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-30">
                <SparklesCore
                  id="tsparticlesfooter"
                  background="transparent"
                  minSize={0.3}
                  maxSize={0.8}
                  particleDensity={30}
                  className="w-full h-full"
                  particleColor="#3b82f6"
                />
              </div>
            )}
      
            {/* Content Wrapper */}
            <div 
              className="max-w-7xl mx-auto relative z-10 flex flex-col gap-6 sm:gap-8 pt-8 sm:pt-12 pb-6 sm:pb-8 px-3 sm:px-4 md:px-6" 
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              
              {/* Infinite Socials Row - Solid Container */}
              <div className="relative w-full pb-6 sm:pb-8 border-b border-blue-500/20">
                {/* Section Container - NO blur */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-neutral-900/80 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
                  {/* Inner shimmer effect - Left to Right */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl">
                    <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent shimmer-line shimmer-gpu" style={{ animationDuration: '4s' }} />
                  </div>
                  
                  <p className="relative text-center text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-bold text-blue-400 mb-4 sm:mb-6 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    Join the Community
                  </p>
                  <SocialsRow />
                </div>
              </div>

              {/* Main Footer Layout - Responsive */}
              <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6 lg:gap-8">
                
                {/* Brand & Copyright - Solid Container */}
                <div className="relative w-full lg:w-auto flex flex-col items-center lg:items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-neutral-900/80 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 overflow-hidden">
                  {/* Pulse glow effect */}
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 shimmer-pulse pointer-events-none" />
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl">
                    <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/5 to-transparent shimmer-line shimmer-gpu" style={{ animationDuration: '5s' }} />
                  </div>
                  
                  <div className="relative">
                    <Logo />
                  </div>
                  <div className="relative text-neutral-400 text-[10px] sm:text-xs text-center lg:text-left font-medium">
                    &copy; {new Date().getFullYear()} BullMoney. All rights reserved.
                  </div>
                </div>

                {/* Controls - Solid Dock-style Container */}
                <div className="relative w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-900/80 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 shadow-[0_0_25px_rgba(59,130,246,0.08)] overflow-hidden">
                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/8 to-transparent shimmer-line shimmer-gpu" style={{ animationDuration: '5s' }} />
                  </div>
                  
                  {/* Apps Button */}
                  <FooterButton 
                    onClick={() => setOpenApps(true)} 
                    variant="primary"
                    icon={<ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  >
                    Apps & Tools
                  </FooterButton>

                  {/* Disclaimer Button */}
                  <FooterButton 
                    onClick={() => setOpenDisclaimer(true)}
                    icon={<ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  >
                    Legal Disclaimer
                  </FooterButton>
                </div>
              </div>

              {/* Bottom Bar - Solid Container */}
              <div className="relative text-center pt-4 sm:pt-6 border-t border-blue-500/20">
                {/* Solid container for bottom section */}
                <div className="relative inline-block p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-neutral-900/60 overflow-hidden">
                  {/* Subtle glow behind text */}
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />
                  
                  {/* Shimmer text effect */}
                  <p className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-tight">
                    <span className="relative inline-block">
                      {/* Text with shimmer */}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-400 to-white bg-[length:200%_100%] drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" style={{ animation: 'shimmer-line shimmer-gpu 3s linear infinite', backgroundPosition: '0% 0%' }}>
                        Bull Money
                      </span>
                    </span>
                  </p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-blue-400/70 mt-2 sm:mt-3 font-bold">
                    Elite Trading Community
                  </p>
                  
                  {/* Decorative dots */}
                  <div className="flex justify-center gap-1 sm:gap-1.5 mt-3 sm:mt-4">
                    <span className="w-1 h-1 rounded-full bg-blue-500/60 shimmer-dot-pulse" />
                    <span className="w-1 h-1 rounded-full bg-blue-400/80 shimmer-dot-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1 h-1 rounded-full bg-blue-500/60 shimmer-dot-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========= ENHANCED APPS MODAL ========= */}
        <EnhancedModal 
          isOpen={openApps} 
          onClose={() => setOpenApps(false)} 
          title={
            <div className="flex items-center gap-2 text-white">
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span>Apps & Tools</span>
            </div>
          }
        >
          <div className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-7 lg:space-y-8">
            {apps.map((app, idx) => (
              <motion.section 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4"
              >
                <h3 className="text-center text-[11px] xs:text-xs sm:text-sm md:text-sm font-bold uppercase tracking-widest text-blue-400/80">
                  {app.title}
                </h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
                  {app.links.map((link, i) => (
                    <Link
                      key={i}
                      href={link.href}
                      target="_blank"
                      className="group relative flex items-center justify-between rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl overflow-hidden p-2 xs:p-2.5 sm:p-3 md:p-4 text-[10px] xs:text-xs sm:text-sm md:text-sm text-neutral-300 transition-all duration-300 hover:scale-105"
                    >
                      {/* Solid dark background - NO blur */}
                      <div className="absolute inset-0 bg-neutral-900 border border-blue-500/20 group-hover:border-blue-500/50 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl transition-all duration-300" />
                      
                      {/* Shimmer on hover - left to right */}
                      <div className="absolute inset-0 overflow-hidden rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl">
                        <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 shimmer-line shimmer-gpu transition-opacity duration-300" />
                      </div>
                      
                      {/* Top glow line on hover */}
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 rounded-t-lg sm:rounded-t-xl transition-opacity duration-300" />
                      
                      <span className="relative z-10 group-hover:text-white transition-colors truncate">{link.label}</span>
                      <ExternalLink className="relative z-10 h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 opacity-0 transition-all group-hover:opacity-100 text-blue-400 flex-shrink-0 ml-1.5" />
                    </Link>
                  ))}
                  {app.title === "Bullmoney Indicators" && (
                    <Link
                      href="https://drive.google.com/drive/folders/1aVKPzJAkUqiZqVQnYIZ7M4E0lNOQ2kIi"
                      target="_blank"
                      className="group relative col-span-1 xs:col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2 md:gap-2 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl overflow-hidden p-2 xs:p-2.5 sm:p-3 md:p-4 text-[10px] xs:text-xs sm:text-sm md:text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
                    >
                      {/* Spinning shimmer border */}
                      <span className="absolute inset-[-2px] shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-80 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
                      
                      {/* Solid gradient background - NO blur */}
                      <span className="absolute inset-[1px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
                      
                      <span className="relative z-10 flex items-center gap-1.5 xs:gap-2 sm:gap-2 md:gap-2">
                        Premium PDFs
                        <ChevronRight className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  )}
                </div>
              </motion.section>
            ))}
          </div>
        </EnhancedModal>

      {/* ========= ENHANCED DISCLAIMER MODAL ========= */}
      <EnhancedModal 
        isOpen={openDisclaimer} 
        onClose={() => setOpenDisclaimer(false)} 
        maxWidth="max-w-2xl"
        title={
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2 text-white">
            <ShieldAlert className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="text-xs xs:text-sm sm:text-base truncate">Legal & Financial Disclaimer</span>
          </div>
        }
      >
        <div className="flex flex-col h-full">
          
          {/* SCROLLABLE CONTENT AREA */}
          <div className="space-y-4 sm:space-y-6 text-sm leading-relaxed text-neutral-400">
            
            {/* ALERT BANNER */}
            <div className="relative overflow-hidden rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl border border-red-500/30 bg-red-950/50 p-2.5 xs:p-3 sm:p-4 md:p-5">
              {/* Subtle glow - no blur */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 bg-red-500/20 rounded-full pointer-events-none" />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 overflow-hidden rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl">
                <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-red-500/10 to-transparent shimmer-line shimmer-gpu" style={{ animationDuration: '4s' }} />
              </div>
              
              <div className="relative flex gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
                <div className="shrink-0 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-bold text-white tracking-wide uppercase mb-0.5 xs:mb-1">Critical Legal Notice</h2>
                  <p className="text-[8px] xs:text-[9px] sm:text-xs md:text-xs text-red-200/70 leading-tight">
                    This agreement affects your legal rights. Please read extensively before using our Shop or Services.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-neutral-300 text-[10px] xs:text-xs sm:text-sm md:text-base">
              By accessing <span className="font-semibold text-white">Bullmoney</span> (the “Site”), purchasing products from the Shop, or using our services, you acknowledge and agree to the following terms without reservation.
            </p>

            {/* EXTENDED SECTIONS */}
            <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4">
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

            <div className="py-1 xs:py-1.5 sm:py-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            </div>

            <p className="italic text-neutral-500 text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-center px-1 xs:px-2 sm:px-4">
              By clicking &quot;I Agree &amp; Understand&quot; below, you legally confirm that you have read, understood, and accepted full responsibility for your actions on this platform.
            </p>
          </div>

          {/* FIXED ACTION FOOTER */}
          <div className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 pt-3 xs:pt-3.5 sm:pt-4 md:pt-4 border-t border-blue-500/20 flex justify-end shrink-0">
            <motion.button 
              onClick={() => setOpenDisclaimer(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center gap-2 px-3 xs:px-4 sm:px-5 md:px-6 py-1.5 xs:py-1.75 sm:py-2 md:py-2.5 overflow-hidden rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl text-[10px] xs:text-xs sm:text-sm md:text-sm font-semibold transition-all active:scale-95"
            >
              {/* Spinning shimmer border */}
              <span className="absolute inset-[-2px] shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#22c55e_50%,#00000000_100%)] opacity-80 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
              
              {/* Glass background */}
              <span className="absolute inset-[1px] bg-white rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
              
              <span className="relative z-10 flex items-center gap-1.5 xs:gap-2 sm:gap-2 text-black whitespace-nowrap">
                I Agree & Understand
                <CheckCircle2 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
              </span>
            </motion.button>
          </div>

        </div>
      </EnhancedModal>

    </footer>
    </>
  );
}
