"use client";
import React, { useState, useEffect, useRef, useMemo, JSX, useCallback } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock, Copy, Check } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

// ==========================================
// 1. UTILS & HOOKS
// ==========================================

const usePerformanceMode = () => {
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      const isMobile = window.innerWidth < 768;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsPerformanceMode(isMobile || reducedMotion);
    };
    
    checkPerformance();
    window.addEventListener('resize', checkPerformance);
    return () => window.removeEventListener('resize', checkPerformance);
  }, []);

  return isPerformanceMode;
};

// ==========================================
// 2. PIXEL CARD LOGIC (Canvas - Desktop Only)
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

const VARIANTS = {
  default: { activeColor: null, gap: 5, speed: 35, colors: '#f8fafc,#f1f5f9,#cbd5e1', noFocus: false },
  blue: { activeColor: '#e0f2fe', gap: 10, speed: 25, colors: '#60a5fa,#3b82f6,#2563eb', noFocus: false },
  green: { activeColor: '#dcfce7', gap: 6, speed: 20, colors: '#4ade80,#22c55e,#86efac', noFocus: true }
};

interface PixelCardProps {
  variant?: 'default' | 'blue' | 'green';
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  className?: string;
  children: React.ReactNode;
}

const PixelCard = ({ variant = 'default', gap, speed, colors, noFocus, className = '', children }: PixelCardProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number | null>(null);
  const timePreviousRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const isPerformanceMode = usePerformanceMode();

  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = useCallback(() => {
    if (!containerRef.current || !canvasRef.current || isPerformanceMode) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;
    const colorsArray = finalColors.split(',');
    const pxs = [];
    const effGap = parseInt(finalGap.toString(), 10); 
    for (let x = 0; x < width; x += effGap) {
      for (let y = 0; y < height; y += effGap) {
        const color = colorsArray[Math.floor(Math.random() * colorsArray.length)];
        const dx = x - width / 2;
        const dy = y - height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delay = distance;
        pxs.push(new Pixel(canvasRef.current, ctx, x, y, color, finalSpeed * 0.001, delay));
      }
    }
    pixelsRef.current = pxs;
  }, [finalColors, finalGap, finalSpeed, isPerformanceMode]);

  const doAnimate = (fnName: keyof Pixel) => {
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
    const timeNow = performance.now();
    const timePassed = timeNow - timePreviousRef.current;
    const timeInterval = 1000 / 30; // Cap at 30FPS for performance
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
      if (!pixel.isIdle) allIdle = false;
    }
    if (allIdle && animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const handleAnimation = (name: keyof Pixel) => {
    if (isPerformanceMode) return;
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(() => doAnimate(name));
  };

  const onMouseEnter = () => handleAnimation('appear');
  const onMouseLeave = () => handleAnimation('disappear');
  const onFocus: React.FocusEventHandler<HTMLDivElement> = e => { if (!e.currentTarget.contains(e.relatedTarget)) handleAnimation('appear'); };
  const onBlur: React.FocusEventHandler<HTMLDivElement> = e => { if (!e.currentTarget.contains(e.relatedTarget)) handleAnimation('disappear'); };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => initPixels(), 200);
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
      initPixels();
    }
    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [initPixels]);

  return (
    <div
      ref={containerRef}
      // Added background styles here for when canvas is disabled on mobile
      className={cn("relative overflow-hidden bg-neutral-900/40 backdrop-blur-sm border border-white/5", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={finalNoFocus ? undefined : onFocus}
      onBlur={finalNoFocus ? undefined : onBlur}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      {!isPerformanceMode && <canvas className="absolute inset-0 z-0 h-full w-full pointer-events-none" ref={canvasRef} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

const ShopMarketingSection = () => {
  return (
    <div className="relative flex min-h-[600px] w-full flex-col overflow-hidden bg-neutral-950 text-white selection:bg-blue-500/30 selection:text-blue-200">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-neutral-950 to-neutral-950" />
      <BackgroundGrids />
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <SparklesCore id="shop-fullpage-sparkles" background="transparent" minSize={1} maxSize={3} className="h-full w-full" particleColor="#60a5fa" />
      </div>
      
      <PromoBanner />
      
      <div className="relative z-10 flex w-full flex-col items-center justify-center py-16 sm:py-24">
        {/* Dashboard / Stats Row */}
        {/* MOBILE OPTIMIZATION: flex-col on mobile, flex-row on desktop. w-full on mobile. */}
        <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-4 px-4 mb-16 sm:flex-row sm:gap-8">
          <div className="w-full sm:w-auto">
             <LiveViewers /> 
          </div>
          <div className="w-full sm:w-auto">
             <DealTimer />
          </div>
        </div>
         
        {/* Socials Row (Optimized Evervault Style) */}
        <div className="w-full">
           <SocialsRow />
        </div>
      </div>
    </div>
  );
};

export default ShopMarketingSection;

// ==========================================
// 4. SUB-COMPONENTS
// ==========================================

export const PromoBanner = () => {
  return (
    <PixelCard variant="blue" gap={6} speed={20} noFocus={true} className="group relative z-50 w-full border-b border-blue-500/20 bg-blue-950/30 py-3 backdrop-blur-md transition-colors hover:bg-blue-900/40">
      <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
      <div className="relative flex w-full items-center overflow-hidden">
        <div className="pointer-events-none absolute left-0 z-10 h-full w-20 bg-gradient-to-r from-neutral-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 z-10 h-full w-20 bg-gradient-to-l from-neutral-950 to-transparent" />
        <motion.div initial={{ x: "0%" }} animate={{ x: "-50%" }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="flex whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center">
              <PromoItem code="BULLMONEY" label="Vantage" />
              <Separator />
              <PromoItem code="X3R7P" label="XM Markets" />
              <Separator />
            </div>
          ))}
        </motion.div>
      </div>
    </PixelCard>
  );
};

const PromoItem = ({ code, label }: { code: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div onClick={handleCopy} className="mx-6 flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 transition-all hover:border-blue-500/30 hover:bg-blue-500/10 active:scale-95">
      <span className="text-xs font-medium uppercase tracking-widest text-blue-200/80 sm:text-sm">Use Code</span>
      <div className="relative flex items-center gap-2 rounded bg-white/10 px-2 py-0.5 font-mono text-sm font-bold text-white shadow-sm backdrop-blur-sm">
        {code}
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-blue-300" />}
      </div>
      <span className="text-xs font-bold text-blue-100 sm:text-sm">for {label}</span>
    </div>
  );
};

const Separator = () => (<div className="h-1 w-1 rounded-full bg-blue-500/50 shadow-[0_0_5px_#3b82f6]" />);

// ==========================================
// NEW: Evervault Social Components
// Optimized for mobile & missing images
// ==========================================

const BrandIcons = {
  Youtube: (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  ),
  Instagram: (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
  ),
  Discord: (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z"/></svg>
  ),
  Telegram: (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.46-1.901-.903-1.056-.692-1.653-1.123-2.678-1.8-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.022.251.012.352z"/></svg>
  )
};

export const SocialsRow = () => {
  const socials = [
    { href: "https://youtube.com/@bullmoney.online", Icon: BrandIcons.Youtube, color: "text-red-500", label: "YouTube" },
    { href: "https://www.instagram.com/bullmoney.shop", Icon: BrandIcons.Instagram, color: "text-pink-500", label: "Instagram" },
    { href: "https://discord.com/invite/9vVB44ZrNA", Icon: BrandIcons.Discord, color: "text-indigo-500", label: "Discord" },
    { href: "https://t.me/bullmoneyfx", Icon: BrandIcons.Telegram, color: "text-blue-400", label: "Telegram" },
  ];

  // Increase array size to ensure seamless loop
  const marqueeSocials = useMemo(() => [...socials, ...socials, ...socials, ...socials], [socials]);

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-0">
      <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-25%" }} // Adjusted for 4 sets of items
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          className="flex min-w-full items-center gap-6 px-4 sm:gap-10 will-change-transform"
        >
          {marqueeSocials.map((s, i) => (
            <LightweightEvervaultCard key={`${s.label}-${i}`} {...s} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// CSS-Only Evervault Replica (No Canvas, SVG Icons, Works on Mobile)
const LightweightEvervaultCard = ({ href, Icon, color, label }: { href: string; Icon: any; color: string; label: string }) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group relative block h-28 w-28 shrink-0 sm:h-32 sm:w-32" onMouseMove={onMouseMove}>
      {/* Container */}
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-neutral-950 border border-white/10">
        
        {/* Mobile: Radar Sweep Effect (CSS Only - Low CPU) */}
        <div className="absolute inset-0 block sm:hidden">
            <div className="absolute inset-0 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(59,130,246,0.2)_360deg)] opacity-50" />
        </div>

        {/* Desktop: Mouse Follow Gradient */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100 hidden sm:block"
          style={{
            background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.15), transparent 80%)`,
          }}
        />
        
        {/* Content */}
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2">
            {/* Icon Wrapper with Glow */}
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className={cn("h-8 w-8 transition-all duration-300 group-hover:scale-110", color)} />
            </div>
            {/* Label (Reveals on hover) */}
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 transition-colors group-hover:text-white">
                {label}
            </span>
        </div>

        {/* The "Evervault" Matrix Grid (CSS Pattern) */}
        <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
        {/* Optional: Add a subtle grid overlay for that "tech" feel */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px]" />
      </div>
    </a>
  );
};

// ==========================================
// 5. OTHER CHARTS & TIMERS
// ==========================================

const MiniTradingChart = ({ width = 60, height = 24 }: { width?: number; height?: number }) => {
  const [path, setPath] = useState("");
  const [areaPath, setAreaPath] = useState("");
  const dataPointsRef = useRef([20, 30, 25, 35, 30, 45, 40, 50, 45, 60]);

  const generatePaths = useCallback((data: number[]) => {
    const max = 70;
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (val / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return { line: `M${points}`, area: `M0,${height} L${points} L${width},${height} Z` };
  }, [width, height]);

  useEffect(() => {
    const initialPaths = generatePaths(dataPointsRef.current);
    setPath(initialPaths.line);
    setAreaPath(initialPaths.area);
    const updateChart = () => {
      const currentData = dataPointsRef.current;
      const last = currentData[currentData.length - 1];
      const change = (Math.random() - 0.45) * 15;
      let newValue = Math.max(10, Math.min(65, last + change));
      const newData = [...currentData.slice(1), newValue];
      dataPointsRef.current = newData;
      const paths = generatePaths(newData);
      setPath(paths.line);
      setAreaPath(paths.area);
    };
    const interval = setInterval(updateChart, 1000);
    return () => clearInterval(interval);
  }, [generatePaths]);

  if (!path) return <div style={{ width, height }} className="animate-pulse bg-green-500/10 rounded" />;

  return (
    <div style={{ width, height }} className="relative overflow-hidden">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path d={areaPath} fill="url(#chartFill)" stroke="none" animate={{ d: areaPath }} transition={{ duration: 1, ease: "linear" }} />
        <motion.path d={path} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" animate={{ d: path }} transition={{ duration: 1, ease: "linear" }} style={{ filter: "drop-shadow(0 0 2px rgba(74, 222, 128, 0.5))" }} />
      </svg>
    </div>
  );
}

export const LiveViewers = () => {
  const [viewers, setViewers] = useState<number | null>(42);
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => {
        if (!prev) return 42;
        const change = Math.floor(Math.random() * 7) - 3;
        return Math.max(35, Math.min(150, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <PixelCard variant="green" gap={5} speed={20} className="group relative flex items-center justify-between gap-6 rounded-xl px-8 py-4 shadow-xl transition-all duration-300 hover:shadow-[0_0_40px_-5px_rgba(34,197,94,0.3)]" noFocus={true}>
        <div className="flex flex-col items-center justify-center">
          <MiniTradingChart width={70} height={32} />
        </div>
        <div className="h-10 w-[1px] bg-white/10"></div>
        <div className="flex flex-col leading-none items-end">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
            </span>
            <span className="text-2xl font-bold text-green-400 tabular-nums shadow-green-500/50 drop-shadow-sm">{viewers}</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Live Traders</span>
        </div>
      </PixelCard>
    </motion.div>
  );
};

export const DealTimer = () => {
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(24, 0, 0, 0);
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) return "00:00:00";
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    setTimeLeft(calculateTime());
    const interval = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <PixelCard variant="blue" gap={5} speed={20} noFocus={true} className="group relative flex items-center justify-between gap-4 rounded-xl px-8 py-4 shadow-xl transition-all duration-300 hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.3)]">
        <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><Clock className="h-5 w-5 text-blue-400" /></div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-blue-200">Whop Code: <span className="font-bold text-white">BULL</span></span>
          <span className="font-mono text-xl font-bold leading-none text-white tabular-nums tracking-wider drop-shadow-sm">{timeLeft}</span>
        </div>
      </PixelCard>
    </motion.div>
  );
};

const BackgroundGrids = React.memo(() => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-20">
      <div className="absolute left-1/2 top-0 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="absolute bottom-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    </div>
  );
});
BackgroundGrids.displayName = "BackgroundGrids";

export const SparklesCore = (props: { id?: string; className?: string; background?: string; minSize?: number; maxSize?: number; speed?: number; particleColor?: string; particleDensity?: number; }) => {
  const { id = "tsparticles", className, background = "transparent", minSize = 0.6, maxSize = 1.4, speed = 1, particleColor = "#ffffff", particleDensity = 100 } = props;
  const [init, setInit] = useState(false);
  const isPerformanceMode = usePerformanceMode();

  useEffect(() => { initParticlesEngine(async (engine: Engine) => { await loadSlim(engine); }).then(() => { setInit(true); }); }, []);

  const options = useMemo(() => {
    const densityValue = isPerformanceMode ? 30 : particleDensity;
    return {
      background: { color: { value: background } },
      fullScreen: { enable: false, zIndex: 1 },
      fpsLimit: 60,
      interactivity: {
        events: { onClick: { enable: !isPerformanceMode, mode: "push" }, onHover: { enable: !isPerformanceMode, mode: "bubble" }, resize: { enable: true } },
        modes: { push: { quantity: 4 }, bubble: { distance: 200, size: maxSize * 1.5, duration: 2, opacity: 0.8, speed: 3 } },
      },
      particles: {
        bounce: { horizontal: { value: 1 }, vertical: { value: 1 } },
        color: { value: particleColor },
        move: { enable: true, speed: speed, direction: "none", random: true, straight: false, outModes: { default: "out" } },
        number: { density: { enable: true, width: 1920, height: 1080 }, value: densityValue },
        opacity: { value: { min: 0.1, max: 0.5 }, animation: { enable: true, speed: speed * 0.5, sync: false } },
        shape: { type: "circle" },
        size: { value: { min: minSize, max: maxSize } },
      },
      detectRetina: true,
    }
  }, [background, particleColor, speed, particleDensity, minSize, maxSize, isPerformanceMode]);

  return <div className={cn("opacity-0 transition-opacity duration-1000", init && "opacity-100", className)}>{init && <Particles id={id} className={cn("h-full w-full")} options={options as any} />}</div>;
};