"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

// --- Import the separated effects ---
// Ensure these paths match where you saved the files
import GhostCursor from "@/components/Mainpage/GhostCursor"; 
import { SparklesCore } from "@/components/Mainpage/SparklesBackground"; 

// --- MAIN COMPONENT ---
const ShopMarketingSection = () => {
  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-neutral-950 text-white min-h-[500px] border-t border-white/5">
      
      {/* 1. Ghost Cursor Layer (Z-0) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <GhostCursor />
      </div>

      {/* 2. Promo Strip */}
      <PromoBanner />
      
      <div className="relative flex w-full flex-col items-center justify-center py-16 sm:py-24 z-10">
        
        {/* Background Grids */}
        <BackgroundGrids />

        {/* 3. Sparkles Background */}
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
            <SparklesCore
                id="shop-sparkles"
                background="transparent"
                minSize={0.4}
                maxSize={1.2}
                particleDensity={40}
                className="h-full w-full"
                particleColor="#FFFFFF"
            />
        </div>
        
        {/* 4. Socials Content (Using TSX Icons) */}
        <div className="z-20 w-full mb-12">
           <SocialsRow />
        </div>

        {/* 5. Stats & Timer */}
        <div className="z-30 mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
          <LiveViewers />
          <DealTimer />
        </div>
      </div>
    </div>
  );
};

export default ShopMarketingSection;


// --------------------------------------------------------------------------------
// --- UTILITY COMPONENTS ---
// --------------------------------------------------------------------------------

// --- PROMO BANNER ---
export const PromoBanner = () => {
  return (
    <div className="relative z-50 w-full overflow-hidden bg-white/10/50 backdrop-blur-sm py-3 text-white shadow-[0_4px_30px_-5px_rgba(255, 255, 255,0.4)] border-y border-white/20">
      <div className="absolute inset-0 z-0 h-full w-full opacity-30">
        <SparklesCore
          id="promo-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={70}
          className="h-full w-full"
          particleColor="#ffffff"
        />
      </div>

      <div className="relative z-30 flex w-full items-center">
        <motion.div
          initial={{ x: "0%" }}
          animate={{ x: "-100%" }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap will-change-transform"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="mx-8 flex items-center gap-8 text-sm font-bold uppercase tracking-widest sm:text-base text-white">
              <span className="flex items-center gap-3">
                 Code <span className="rounded bg-white px-2 py-0.5 text-black shadow-[0_0_10px_rgba(255, 255, 255,0.5)]">BULLMONEY</span> for Vantage
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
              <span className="flex items-center gap-3">
                 Code <span className="rounded bg-white px-2 py-0.5 text-black shadow-[0_0_10px_rgba(255, 255, 255,0.5)]">X3R7P</span> for XM
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// --- ICONS (SVG PATHS) ---
// Using raw SVGs to avoid needing external image assets
const Icons = {
    YouTube: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
    ),
    Instagram: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
             <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
    ),
    Discord: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
    ),
    Telegram: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
    )
}

// --- INFINITE SOCIALS MARQUEE ---
export const SocialsRow = () => {
  const socials = [
    { href: "https://www.youtube.com/@fxbullmoney", Icon: Icons.YouTube, alt: "YouTube" },
    { href: "https://www.instagram.com/bullmoneyglobal?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==", Icon: Icons.Instagram, alt: "Instagram" },
    { href: "https://discord.com/invite/9vVB44ZrNA", Icon: Icons.Discord, alt: "Discord" },
    { href: "https://t.me/Bullmoneyshop", Icon: Icons.Telegram, alt: "Telegram" },
  ];

  const marqueeSocials = [...socials, ...socials, ...socials, ...socials, ...socials, ...socials];

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-12">
      {/* Side Fade Gradients */}
      <div className="absolute left-0 top-0 z-30 h-full w-32 bg-linear-to-r from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none"></div>
      <div className="absolute right-0 top-0 z-30 h-full w-32 bg-linear-to-l from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none"></div>

      <div className="flex w-full overflow-hidden select-none">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity }}
          className="flex min-w-full items-center gap-20 sm:gap-32 px-4 will-change-transform hover:[animation-play-state:paused]"
        >
          {marqueeSocials.map((s, i) => (
            <a
              key={`${s.alt}-${i}`}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            >
              {/* Sparkles on Hover */}
              <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                 <SimpleSparkle delay={0} top="-30%" left="50%" />
                 <SimpleSparkle delay={0.5} top="50%" left="-30%" />
                 <SimpleSparkle delay={0.2} top="90%" left="100%" />
              </div>

              {/* Icon Container */}
              <div className="relative h-12 w-12 sm:h-16 sm:w-16">
                 {/* Glow behind icon */}
                 <div className="absolute inset-0 rounded-full bg-white/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-2xl"></div>
                 
                 <div className="relative w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.8)] text-neutral-400 group-hover:text-white transition-colors duration-300">
                    <s.Icon />
                 </div>
              </div>
            </a>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// Simple Sparkle Component
const SimpleSparkle = ({ delay, top, left }: { delay: number, top: string, left: string }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: [0, 45, 90] }}
    transition={{ duration: 1.5, repeat: Infinity, delay: delay, ease: "easeInOut" }}
    className="absolute h-5 w-5 text-white"
    style={{ top, left }}
  >
    <svg viewBox="0 0 24 24" fill="currentColor" className="drop-shadow-[0_0_8px_rgba(255,255,255,1)]">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  </motion.div>
);

// --- LIVE VIEWERS ---

// Mini Live Trading Chart Component
const MiniTradingChart = () => {
  const [dataPoints, setDataPoints] = useState<number[]>([
    20, 25, 22, 28, 35, 30, 40, 38, 45, 42, 50, 48, 55, 60, 58
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints((prev) => {
        const last = prev[prev.length - 1] ?? 30;
        const change = Math.floor(Math.random() * 13) - 5;
        let newValue = last + change;
        if (newValue < 10) newValue = 15;
        if (newValue > 70) newValue = 65;
        return [...prev.slice(1), newValue];
      });
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const width = 60;
  const height = 24;
  const max = 75;
  
  const points = dataPoints.map((val, i) => {
    const x = (i / (dataPoints.length - 1)) * width;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  }).join(" ");

  const areaPath = `M0,${height} L${points} L${width},${height} Z`;
  const linePath = `M${dataPoints.map((val, i) => {
    const x = (i / (dataPoints.length - 1)) * width;
    const y = height - (val / max) * height;
    return `${x},${y}`;
  }).join(" L")}`;

  return (
    <div className="relative h-6 w-[60px] overflow-hidden">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <motion.path 
          d={areaPath} 
          fill="url(#chartGradient)" 
          stroke="none"
          initial={false}
          animate={{ d: areaPath }}
          transition={{ duration: 0.6, ease: "linear" }}
        />
        
        <motion.path
          d={linePath}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ d: linePath }}
          transition={{ duration: 0.6, ease: "linear" }}
        />
      </svg>
    </div>
  );
}

export const LiveViewers = () => {
  const [viewers, setViewers] = useState(42);

  useEffect(() => {
    const updateViewers = () => {
      const change = Math.floor(Math.random() * 11) - 5;
      setViewers(prev => {
        const next = prev + change;
        return next < 35 ? 35 : next > 120 ? 120 : next;
      });
    };

    const interval = setInterval(updateViewers, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="group relative flex items-center gap-4 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.6)]">
      <div className="flex flex-col items-center justify-center">
        <MiniTradingChart />
      </div>

      <div className="h-8 w-[1px] bg-white/30"></div>

      <div className="flex flex-col leading-none">
        <span className="text-xl font-bold text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
          {viewers}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
          Traders Online
        </span>
      </div>
    </div>
  );
};

// --- DEAL TIMER ---
export const DealTimer = () => {
  const [timeLeft, setTimeLeft] = useState("24:00:00");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const resetTime = new Date(now);
      resetTime.setHours(24, 0, 0, 0); 
      
      const diff = resetTime.getTime() - now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="group relative flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 shadow-[0_0_30px_-5px_rgba(255, 255, 255,0.3)] backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_50px_-10px_rgba(255, 255, 255,0.6)]">
      <Clock className="h-6 w-6 text-white animate-pulse drop-shadow-[0_0_8px_rgba(255, 255, 255,0.6)]" />
      <span className="text-sm font-semibold text-white">
        Code <span className="text-lg font-bold text-white drop-shadow-[0_0_8px_rgba(255, 255, 255,0.5)]">BULL</span> on Whop expires in <span className="font-mono text-lg font-bold text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{timeLeft}</span>
      </span>
    </div>
  );
};

// --- BACKGROUND GRIDS ---
const BackgroundGrids = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 grid h-full w-full -rotate-45 transform select-none grid-cols-2 gap-10 opacity-40 md:grid-cols-5">
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full bg-linear-to-b from-transparent via-white/10 to-transparent">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
    </div>
  );
};

const GridLineVertical = ({ className, offset }: { className?: string; offset?: string }) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(255, 255, 255, 0.1)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          "--color-dark": "rgba(255, 255, 255, 0.1)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        className
      )}
    ></div>
  );
};