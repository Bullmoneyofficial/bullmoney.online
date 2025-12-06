"use client";
import React, { useState, useEffect, useRef, useMemo, JSX, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Clock, Copy, Check } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

// ==========================================
// 1. UTILS & HOOKS
// ==========================================

// Shared hook to detect mobile/low-power mode
const usePerformanceMode = () => {
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      // Treat mobile (<768px) or reduced motion as "Performance Mode"
      const isMobile = window.innerWidth < 768;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsPerformanceMode(isMobile || reducedMotion);
    };
    
    checkPerformance();
    // Debounce resize listener for performance
    let timeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(checkPerformance, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isPerformanceMode;
};

// ==========================================
// 2. PIXEL CARD LOGIC
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
  green: {
    activeColor: '#dcfce7',
    gap: 6,
    speed: 20,
    colors: '#4ade80,#22c55e,#86efac', 
    noFocus: true
  }
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

const PixelCard = ({
  variant = 'default',
  gap,
  speed,
  colors,
  noFocus,
  className = '',
  children
}: PixelCardProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number | null>(null);
  const timePreviousRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  
  // OPTIMIZATION: Check if we are on mobile/performance mode
  const isPerformanceMode = usePerformanceMode();

  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = useCallback(() => {
    // CRITICAL: Abort if on mobile or canvas not ready
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
    
    // Safety: Ensure gap isn't too small causing infinite loops
    const safeGap = Math.max(4, parseInt(finalGap.toString(), 10));

    for (let x = 0; x < width; x += safeGap) {
      for (let y = 0; y < height; y += safeGap) {
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
    
    // FPS Cap: 30FPS is plenty for this effect and saves battery
    const timeInterval = 1000 / 30; 

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
    // Don't animate on mobile
    if (isPerformanceMode) return;
    
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
    // Only init logic if not in performance mode
    if (!isPerformanceMode) {
      initPixels();
      const observer = new ResizeObserver(() => {
        // Debounce resize
        setTimeout(initPixels, 100);
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
    }
  }, [initPixels, isPerformanceMode]);

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
      {/* Conditionally render canvas to save DOM weight on mobile */}
      {!isPerformanceMode && (
        <canvas 
          className="absolute inset-0 z-0 h-full w-full pointer-events-none" 
          ref={canvasRef} 
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

const ShopMarketingSection = () => {
  return (
    <div className="relative flex min-h-[600px] w-full flex-col overflow-hidden bg-neutral-950 text-white selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background: Deep Radial Gradient for depth */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-neutral-950 to-neutral-950" />
      
      {/* Background Grids */}
      <BackgroundGrids />

      {/* Full Page Sparkles */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <SparklesCore
          id="shop-fullpage-sparkles"
          background="transparent"
          minSize={1}
          maxSize={3}
          // Dynamic density controlled inside SparklesCore
          className="h-full w-full"
          particleColor="#60a5fa"
        />
      </div>

      {/* Promo Strip */}
      <PromoBanner />
      
      <div className="relative z-10 flex w-full flex-col items-center justify-center py-16 sm:py-24">
        
        {/* Infinite Socials */}
        <div className="mb-12 w-full">
           <SocialsRow />
        </div>

        {/* Shop Extras (Interactive Cards) */}
        <div className="flex flex-col flex-wrap items-center justify-center gap-6 px-4 sm:flex-row sm:gap-8">
          <LiveViewers />
          <DealTimer />
        </div>
      </div>
    </div>
  );
};

export default ShopMarketingSection;

// ==========================================
// 3. SUB-COMPONENTS
// ==========================================

export const PromoBanner = () => {
  // Static element, PixelCard is fine (it will auto-disable on mobile)
  return (
    <PixelCard 
      variant="blue" 
      gap={6} 
      speed={20}
      noFocus={true}
      className="group relative z-50 w-full border-b border-blue-500/20 bg-blue-950/30 py-3 backdrop-blur-md transition-colors hover:bg-blue-900/40"
    >
      <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
      
      <div className="relative flex w-full items-center">
        <div className="pointer-events-none absolute left-0 z-10 h-full w-20 bg-gradient-to-r from-neutral-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 z-10 h-full w-20 bg-gradient-to-l from-neutral-950 to-transparent" />

        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "-50%" }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]"
        >
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
    <div 
      onClick={handleCopy}
      className="mx-6 flex cursor-pointer items-center gap- rounded-lg border border-transparent px-40 py-1 transition-all hover:border-blue-500/30 hover:bg-blue-500/10"
    >
      <span className="text-xs font-medium uppercase tracking-widest text-blue-200/80 sm:text-sm">
        Use Code
      </span>
      <div className="relative flex items-center gap-2 rounded bg-white/10 px-2 py-0.5 font-mono text-sm font-bold text-white shadow-sm backdrop-blur-sm">
        {code}
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-blue-300" />}
      </div>
      <span className="text-xs font-bold text-blue-100 sm:text-sm">for {label}</span>
    </div>
  );
};

const Separator = () => (
  <div className="h-1 w-1 rounded-full bg-blue-500/50 shadow-[0_0_5px_#3b82f6]" />
);

export const SocialsRow = () => {
  const socials = [
    { href: "https://www.youtube.com/@bullmoney.online", icon: "/youtube-app-white-icon.svg", alt: "YouTube" },
    { href: "https://www.instagram.com/bullmoney.shop", icon: "/instagram-white-icon.svg", alt: "Instagram" },
    { href: "https://discord.com/invite/9vVB44ZrNA", icon: "/discord-white-icon.svg", alt: "Discord" },
    { href: "https://t.me/Bullmoneyshop", icon: "/telegram-white-icon.svg", alt: "Telegram" },
  ];

  const marqueeSocials = useMemo(() => [...socials, ...socials, ...socials], [socials]);

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-0">
      <div className="flex w-full overflow-hidden mask-image-fade">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-33.33%" }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          className="flex min-w-full min-h-full items-center gap-20 px-10 sm:gap-40 will-change-transform"
        >
          {marqueeSocials.map((s, i) => (
            <SocialIcon key={`${s.alt}-${i}`} {...s} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// ==========================================
// OPTIMIZATION: Removed PixelCard from here
// Moving Canvases in a marquee = LAG
// Replaced with CSS-only lookalike
// ==========================================
const SocialIcon = ({ href, icon, alt }: { href: string; icon: string; alt: string }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block shrink-0"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* REPLACED: CSS Only Div instead of Canvas PixelCard */}
        <div className="flex h-32 w-40 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-neutral-900/50 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.4)]">
           <div className="relative h-10 w-10 transition-transform duration-300 sm:h-10 sm:w-10">
              <Image 
                 src={icon} 
                 alt={alt} 
                 fill
                 className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
           </div>
        </div>
      </motion.div>
    </a>
  );
};

const MiniTradingChart = ({ width = 60, height = 24 }: { width?: number; height?: number }) => {
  const [path, setPath] = useState("");
  const [areaPath, setAreaPath] = useState("");
  const dataPointsRef = useRef([20, 30, 25, 35, 30, 45, 40, 50, 45, 60]);

  // Memoized path generator
  const generatePaths = useCallback((data: number[]) => {
    const max = 70;
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (val / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return {
      line: `M${points}`,
      area: `M0,${height} L${points} L${width},${height} Z`
    };
  }, [width, height]);

  useEffect(() => {
    // Init
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

    const interval = setInterval(updateChart, 1000); // 1s interval is sufficient
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
        <motion.path 
          d={areaPath} 
          fill="url(#chartFill)" 
          stroke="none"
          animate={{ d: areaPath }}
          transition={{ duration: 1, ease: "linear" }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="#4ade80"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ d: path }}
          transition={{ duration: 1, ease: "linear" }}
          style={{ filter: "drop-shadow(0 0 2px rgba(74, 222, 128, 0.5))" }}
        />
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
    <motion.div
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <PixelCard
        variant="green"
        gap={5} 
        speed={20}
        className="group relative flex items-center gap-6 rounded-xl border border-green-500/20 bg-neutral-900/80 px-8 py-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-[0_0_40px_-5px_rgba(34,197,94,0.3)]"
        noFocus={true}
      >
        <div className="flex flex-col items-center justify-center">
          <MiniTradingChart width={70} height={32} />
        </div>

        <div className="h-10 w-[1px] bg-white/10"></div>

        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
            </span>
            <span className="text-2xl font-bold text-green-400 tabular-nums shadow-green-500/50 drop-shadow-sm">
               {viewers}
            </span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Live Traders
          </span>
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
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <PixelCard 
        variant="blue" 
        gap={5} 
        speed={20}
        noFocus={true}
        className="group relative flex items-center gap-4 rounded-xl border border-white/5 bg-neutral-900/50 px-8 py-4 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_40px_-5px_rgba(59,130,246,0.3)]"
      >
         <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
         
         <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
           <Clock className="h-5 w-5 text-blue-400" />
         </div>
         
         <div className="flex flex-col">
           <span className="text-xs font-medium text-blue-200">Whop Code: <span className="font-bold text-white">BULL</span></span>
           <span className="font-mono text-xl font-bold leading-none text-white tabular-nums tracking-wider drop-shadow-sm">
             {timeLeft}
           </span>
         </div>
      </PixelCard>
    </motion.div>
  );
};

// Memoized to prevent re-renders
const BackgroundGrids = React.memo(() => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-20">
       <div className="absolute left-1/2 top-0 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />
       <div className="absolute bottom-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    </div>
  );
});
BackgroundGrids.displayName = "BackgroundGrids";

export const SparklesCore = (props: {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}) => {
  const {
    id = "tsparticles",
    className,
    background = "transparent",
    minSize = 0.6,
    maxSize = 1.4,
    speed = 1,
    particleColor = "#ffffff",
    particleDensity = 100,
  } = props;
  
  const [init, setInit] = useState(false);
  const isPerformanceMode = usePerformanceMode();
  
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(() => {
    // Drastically reduce particles on mobile
    const densityValue = isPerformanceMode ? 30 : particleDensity;

    return {
      background: { color: { value: background } },
      fullScreen: { enable: false, zIndex: 1 },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: { enable: !isPerformanceMode, mode: "push" }, // Disable click on mobile
          onHover: { enable: !isPerformanceMode, mode: "bubble" }, // Disable hover on mobile
          resize: { enable: true },
        },
        modes: {
          push: { quantity: 4 },
          bubble: { distance: 200, size: maxSize * 1.5, duration: 2, opacity: 0.8, speed: 3 },
        },
      },
      particles: {
        bounce: { horizontal: { value: 1 }, vertical: { value: 1 } },
        color: { value: particleColor },
        move: {
          enable: true,
          speed: speed,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        number: {
          density: { enable: true, width: 1920, height: 1080 },
          value: densityValue,
        },
        opacity: {
          value: { min: 0.1, max: 0.5 },
          animation: { enable: true, speed: speed * 0.5, sync: false },
        },
        shape: { type: "circle" },
        size: {
          value: { min: minSize, max: maxSize },
        },
      },
      detectRetina: true,
    }
  }, [background, particleColor, speed, particleDensity, minSize, maxSize, isPerformanceMode]);

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000", init && "opacity-100", className)}>
      {init && (
        <Particles id={id} className={cn("h-full w-full")} options={options as any} />
      )}
    </div>
  );
};