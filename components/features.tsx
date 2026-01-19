"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";
import Image from "next/image";
import createGlobe from "cobe";
import { detectBrowser } from "@/lib/browserDetection";
import { useComponentTracking } from "@/lib/CrashTracker";
import { useComponentLifecycle } from "@/lib/UnifiedPerformanceSystem";

// ✅ MOBILE DETECTION - For conditional lazy loading
import { isMobileDevice } from "@/lib/mobileDetection";

// ✅ LOADING FALLBACKS - Mobile optimized
import { MinimalFallback, CardSkeleton } from "@/components/MobileLazyLoadingFallback";

// --- THEME CONSTANTS - NEON BLUE EDITION ---
const NEON_SHIMMER_GRADIENT = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #3b82f6 50%, #00000000 100%)";
const NEON_TEXT_GRADIENT = "bg-[linear-gradient(90deg,#93c5fd,#60a5fa_35%,#3b82f6_65%,#93c5fd)]";
const NEON_GLOW = "0 0 5px #60a5fa, 0 0 10px #60a5fa, 0 0 20px #3b82f6";
const NEON_BORDER_GLOW = "0 0 10px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)";

/* =====================================================================================
   HELPER TIP COMPONENT (GOLD EDITION)
===================================================================================== */

const HelperTip = ({ label, className }: { label: string; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 5, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 5, scale: 0.9 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={cn("absolute z-50 flex flex-col items-center pointer-events-none", className)}
  >
    {/* The Bubble */}
    <div className="relative p-[1.5px] overflow-hidden rounded-full" style={{ boxShadow: NEON_BORDER_GLOW }}>
        <motion.div 
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: NEON_SHIMMER_GRADIENT }}
        />
        <div className="relative z-10 px-3 py-1 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-blue-500/50" style={{ boxShadow: 'inset ' + NEON_BORDER_GLOW }}>
            <span className={cn("bg-clip-text text-transparent text-[10px] font-bold whitespace-nowrap", NEON_TEXT_GRADIENT)} style={{ textShadow: NEON_GLOW }}>
                {label}
            </span>
        </div>
    </div>
    {/* The Triangle Pointer (pointing down) */}
    <div className="w-2 h-2 bg-[#0a0a0a] rotate-45 -translate-y-[4px] relative z-10 border-b border-r border-blue-500/50" style={{ boxShadow: NEON_BORDER_GLOW }} />
  </motion.div>
);

/* =====================================================================================
   Features
===================================================================================== */

export function Features() {
  const [copied, setCopied] = React.useState(false);
  
  // --- TIP LOGIC ---
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  // Cycle tips every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
        setActiveTipIndex(prev => (prev + 1) % 3);
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  const copyPartnerCode = async () => {
    try {
      await navigator.clipboard.writeText("BM15");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const el = document.createElement("textarea");
      el.value = "BM15";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div
      id="features"
      className="w-full full-bleed viewport-full mx-auto bg-black dark:bg-black py-20 px-4 md:px-8"
    >
      <Header>
        <motion.h2
          className={cn(
            "font-sans text-bold text-xl text-center md:text-4xl w-fit mx-auto font-bold tracking-tight",
            NEON_TEXT_GRADIENT, "bg-clip-text text-transparent"
          )}
          style={{
            textShadow: NEON_GLOW,
          }}
          animate={{
            textShadow: [
              NEON_GLOW,
              "0 0 2px #60a5fa, 0 0 5px #60a5fa, 0 0 10px #3b82f6",
              NEON_GLOW,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          Bullmoney Prop Firms
        </motion.h2>
      </Header>

      <p className="max-w-lg text-sm text-neutral-300 text-center mx-auto mt-4">
        Trade With The Bull, Funded By The Goats.
      </p>

      <div className="mt-20 grid cols-1 md:grid-cols-5 gap-4 md:auto-rows-[25rem] max-w-7xl mx-auto">
        
        {/* Left – 3 cols :: JOIN US */}
        <Card className="flex flex-col justify-between md:col-span-3 bg-gradient-to-br from-black via-neutral-950 to-black border border-blue-500/50" style={{ boxShadow: NEON_BORDER_GLOW }}>
          <CardSkeletonBody>
            <SkeletonOne />
          </CardSkeletonBody>

          <CardContent className="h-40 [&_*]:font-extrabold relative">
            <motion.h3
              className={cn(
                "font-sans text-base md:text-lg font-extrabold tracking-tight",
                NEON_TEXT_GRADIENT, "bg-clip-text text-transparent"
              )}
              style={{ textShadow: NEON_GLOW }}
              animate={{
                textShadow: [
                  NEON_GLOW,
                  "0 0 2px #60a5fa, 0 0 5px #60a5fa, 0 0 10px #3b82f6",
                  NEON_GLOW,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              JOIN US ON GOAT FUNDED
            </motion.h3>

            <div className="mt-2 text-sm leading-relaxed font-extrabold" style={{ color: '#fff', textShadow: '0 0 5px #fff, 0 0 10px #93c5fd' }}>
              Trade With Our Community Using Partner Code{" "}
              <span className="relative inline-block">
                  {/* TIP 0: Partner Code */}
                  <AnimatePresence>
                    {activeTipIndex === 0 && (
                        <HelperTip label="Click to Copy" className="-top-10 left-1/2 -translate-x-1/2" />
                    )}
                  </AnimatePresence>
                  
                  <motion.button
                    type="button"
                    onClick={copyPartnerCode}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs md:text-sm font-bold",
                      "ring-1 ring-inset ring-blue-500/50 text-black transition",
                      NEON_TEXT_GRADIENT
                    )}
                    style={{ boxShadow: NEON_BORDER_GLOW }}
                    whileHover={{ boxShadow: "0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)" }}
                  >
                    BM15
                    <span
                      className={`ml-1 inline-block h-2 w-2 rounded-full ${
                        copied ? "bg-green-400" : "bg-blue-400"
                      }`}
                      style={{ boxShadow: copied ? '0 0 5px #4ade80' : '0 0 5px #60a5fa' }}
                    />
                  </motion.button>
              </span>
              .
            </div>

            <div className="mt-3 flex items-center gap-3">
              <motion.a
                href="https://checkout.goatfundedtrader.com/aff/Bullmoney/"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-black",
                  NEON_TEXT_GRADIENT
                )}
                style={{ boxShadow: NEON_BORDER_GLOW }}
                whileHover={{ 
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                  scale: 1.02
                }}
                whileTap={{ scale: 0.98 }}
              >
                Open with code <span className="font-mono font-semibold">BM15</span>
              </motion.a>

              <motion.button
                type="button"
                onClick={copyPartnerCode}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ring-blue-500/50 hover:bg-blue-500/10 transition"
                style={{ 
                  color: '#60a5fa', 
                  textShadow: NEON_GLOW,
                  boxShadow: NEON_BORDER_GLOW 
                }}
                whileHover={{ 
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)",
                  scale: 1.02
                }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? "Copied!" : "Copy code"}
              </motion.button>
            </div>
          </CardContent>
        </Card>

        {/* Top-right – 2 cols :: Goat Funded info */}
        <Card className="flex flex-col justify-between md:col-span-2 bg-gradient-to-br from-black via-neutral-950 to-black border border-blue-500/50" style={{ boxShadow: NEON_BORDER_GLOW }}>
          <CardContent className="h-40">
            <motion.div
              style={{ textShadow: NEON_GLOW }}
              animate={{
                textShadow: [
                  NEON_GLOW,
                  "0 0 2px #60a5fa, 0 0 5px #60a5fa, 0 0 10px #3b82f6",
                  NEON_GLOW,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CardTitle className={cn(NEON_TEXT_GRADIENT, "bg-clip-text text-transparent")}>
                Goat Funded Trader
              </CardTitle>
            </motion.div>

            <CardDescription className="!max-w-none">
              <div className="group/line inline-block font-semibold">
                <motion.span
                  whileHover={{ scale: 1.01, filter: "brightness(1.08)" }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="text-sm md:text-[15px] leading-snug"
                  style={{ color: '#fff', textShadow: '0 0 5px #fff, 0 0 10px #93c5fd' }}
                >
                  <ShimmerText className="font-extrabold">
                    Become a funded trader with Goat Funded
                  </ShimmerText>{" "}
                  pass a multi‑step challenge, trade company capital, and keep a high profit
                  split with flexible trading conditions.
                </motion.span>
                <motion.span 
                  className={cn("mt-1 block h-[2px] w-0 rounded-full transition-all duration-500 group-hover/line:w-full", NEON_TEXT_GRADIENT)} 
                  style={{ boxShadow: '0 0 5px #60a5fa' }}
                />
              </div>
            </CardDescription>
          </CardContent>

          <CardSkeletonBody>
            <div className="w-full h-full p-4 rounded-lg bg-neutral-950 border border-blue-500/50 ml-6 mt-2 flex items-center justify-center relative" style={{ boxShadow: NEON_BORDER_GLOW }}>
               {/* TIP 1: Goat Logo */}
               <AnimatePresence>
                    {activeTipIndex === 1 && (
                        <HelperTip label="Our Partner" className="top-2" />
                    )}
                </AnimatePresence>
              <Image
                src="/GTFLOGO.png"
                alt="Goat Funded Trader Logo"
                height={220}
                width={220}
                className="object-contain rounded-lg"
              />
            </div>
          </CardSkeletonBody>
        </Card>

        {/* Bottom-left – 2 cols :: Community links */}
        <Card className="flex flex-col justify-between md:col-span-2 bg-gradient-to-br from-black via-neutral-950 to-black border border-blue-500/50" style={{ boxShadow: NEON_BORDER_GLOW }}>
          <CardContent className="h-40">
            <motion.h3 
              className={cn("font-sans text-base md:text-lg font-extrabold tracking-tight", NEON_TEXT_GRADIENT, "bg-clip-text text-transparent")}
              style={{ textShadow: NEON_GLOW }}
              animate={{
                textShadow: [
                  NEON_GLOW,
                  "0 0 2px #60a5fa, 0 0 5px #60a5fa, 0 0 10px #3b82f6",
                  NEON_GLOW,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Find Our Links Below
            </motion.h3>

            <p className="mt-2 text-sm leading-snug font-semibold" style={{ color: '#fff', textShadow: '0 0 5px #fff, 0 0 10px #93c5fd' }}>
              Explore official communities, updates and live content from Goat Funded and FTMO.
            </p>

            <SocialsDropdown
              triggerClassName="mt-3"
              items={[
                {
                  label: "Goat Funded Trader",
                  href: "https://www.goatfundedtrader.com",
                  icon: (<Image src="/GTFLOGO.png" alt="Goat Funded" width={20} height={20} />),
                  gradient: cn(NEON_TEXT_GRADIENT, "text-black"),
                },
                {
                  label: "FTMO",
                  href: "https://trader.ftmo.com/?affiliates=fGDPMCcFOXviWzowTyxV",
                  icon: (<Image src="/FTMO_LOGOB.png" alt="FTMO" width={20} height={20} />),
                  gradient: cn(NEON_TEXT_GRADIENT, "text-black"),
                },
              ]}
            />
          </CardContent>

          <CardSkeletonBody>
            <SkeletonTwo />
          </CardSkeletonBody>
        </Card>

        {/* Bottom-right – 3 cols :: FTMO info */}
        <Card className="flex flex-col justify-between md:col-span-3 bg-gradient-to-br from-black via-neutral-950 to-black border border-blue-500/50" style={{ boxShadow: NEON_BORDER_GLOW }}>
          <CardContent className="h-auto">
            <motion.div
              style={{ textShadow: NEON_GLOW }}
              animate={{
                textShadow: [
                  NEON_GLOW,
                  "0 0 2px #60a5fa, 0 0 5px #60a5fa, 0 0 10px #3b82f6",
                  NEON_GLOW,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CardTitle className={cn(NEON_TEXT_GRADIENT, "bg-clip-text text-transparent")}>
                FTMO
              </CardTitle>
            </motion.div>

            <CardDescription className="!max-w-none">
              <div className="group/line inline-block font-semibold">
                <motion.span
                  whileHover={{ scale: 1.01, filter: "brightness(1.08)" }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="text-sm md:text-[15px] leading-snug"
                  style={{ color: '#fff', textShadow: '0 0 5px #fff, 0 0 10px #93c5fd' }}
                >
                  <ShimmerText className="font-extrabold">
                    Take the FTMO Challenge 
                  </ShimmerText>{" "}
                  validate your trading strategy, access funded company capital, and earn profit shares while using advanced professional tools trusted by a global community of successful traders.
                </motion.span>
                <motion.span 
                  className={cn("mt-1 block h-[2px] w-0 rounded-full transition-all duration-500 group-hover/line:w-full", NEON_TEXT_GRADIENT)} 
                  style={{ boxShadow: '0 0 5px #60a5fa' }}
                />
              </div>
            </CardDescription>
          </CardContent>

          <CardSkeletonBody>
            <div className="w-full h-full p-4 rounded-lg bg-neutral-950 border border-blue-500/50 ml-6 mt-2 flex items-center justify-center relative" style={{ boxShadow: NEON_BORDER_GLOW }}>
               {/* TIP 2: FTMO Logo */}
               <AnimatePresence>
                    {activeTipIndex === 2 && (
                        <HelperTip label="Top Tier Firm" className="top-2" />
                    )}
                </AnimatePresence>
              <Image
                src="/FTMO_LOGO.png"
                alt="FTMO Logo"
                width={260}
                height={260}
                className="object-contain rounded-lg"
              />
            </div>
          </CardSkeletonBody>
        </Card>
      </div>
    </div>
  );
}

/* =====================================================================================
   Header
===================================================================================== */

const Header = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative w-fit mx-auto p-4 flex items-center justify-center">
      <motion.div
        initial={{ width: 0, height: 0, borderRadius: 0 }}
        whileInView={{ width: "100%", height: "100%" }}
        style={{ transformOrigin: "top-left", boxShadow: NEON_BORDER_GLOW }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute inset-0 h-full border border-blue-500/50 w-full"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute -top-1 -left-1 h-2 w-2 bg-neutral-900 rounded-full"
          style={{ boxShadow: '0 0 8px #60a5fa' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute -top-1 -right-1 h-2 w-2 bg-neutral-900 rounded-full"
          style={{ boxShadow: '0 0 8px #60a5fa' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute -bottom-1 -left-1 h-2 w-2 bg-neutral-900 rounded-full"
          style={{ boxShadow: '0 0 8px #60a5fa' }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute -bottom-1 -right-1 h-2 w-2 bg-neutral-900 rounded-full"
          style={{ boxShadow: '0 0 8px #60a5fa' }}
        />
      </motion.div>
      {children}
    </div>
  );
};

/* =====================================================================================
   Local Evervault-style Card (no external imports)
===================================================================================== */

const EvervaultCard = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    let str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    const str = generateRandomString(1500);
    setRandomString(str);
  }

  return (
    <div
      className={cn(
        "p-0.5 bg-transparent aspect-square flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full relative overflow-hidden bg-transparent flex items-center justify-center h-full"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-44 w-44 rounded-full flex items-center justify-center text-white font-bold text-4xl">
            <div className="absolute w-full h-full bg-white/[0.8] dark:bg-black/[0.8] blur-sm rounded-full" />
            <span className="dark:text-white text-black z-20">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function CardPattern({ mouseX, mouseY, randomString }: any) {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 text-xs h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/* =====================================================================================
   SkeletonOne
===================================================================================== */

export const SkeletonOne = () => {
  const Container = ({
    children,
    ...props
  }: { children: React.ReactNode } & React.ComponentProps<typeof motion.div>) => {
    return (
      <motion.div
        {...props}
        className={cn(
          "w-full h-14 md:h-40 p-2 rounded-lg relative shadow-lg flex items-center bg-gradient-to-b from-neutral-900 to-black justify-center",
          props.className
        )}
      >
        {children}
      </motion.div>
    );
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* decorative paths */}
      <svg
        width="128"
        height="69"
        viewBox="0 0 128 69"
        fill="none"
        className="absolute left-1/2 -translate-x-[90%] -top-2 text-neutral-800"
      >
        <path
          d="M1.00002 0.5L1.00001 29.5862C1 36.2136 6.37259 41.5862 13 41.5862H115C121.627 41.5862 127 46.9588 127 53.5862L127 75"
          stroke="currentColor"
          strokeWidth="1"
        />
        <motion.path
          d="M1.00002 0.5L1.00001 29.5862C1 36.2136 6.37259 41.5862 13 41.5862H115C121.627 41.5862 127 46.9588 127 53.5862L127 75"
          stroke="url(#gradient-2)"
          strokeWidth="1"
        />
        <defs>
          <motion.linearGradient
            initial={{ x1: "0%", y1: "0%", x2: "0%", y2: "0%" }}
            animate={{ x1: "100%", y1: "90%", x2: "120%", y2: "120%" }}
            id="gradient-2"
            transition={{ duration: Math.random() * (7 - 2) + 2, ease: "linear", repeat: Infinity }}
          >
            <stop stopColor="#93c5fd" stopOpacity={`0`} />
            <stop offset="1" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
          </motion.linearGradient>
        </defs>
      </svg>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="62"
        height="105"
        viewBox="0 0 62 105"
        fill="none"
        className="absolute left-1/2 -translate-x-0 -bottom-2 text-neutral-800"
      >
        <path
          d="M1.00001 -69L1 57.5C1 64.1274 6.37258 69.5 13 69.5H49C55.6274 69.5 61 74.8726 61 81.5L61 105"
          stroke="currentColor"
          strokeWidth="1"
        />
        <motion.path
          d="M1.00001 -69L1 57.5C1 64.1274 6.37258 69.5 13 69.5H49C55.6274 69.5 61 74.8726 61 81.5L61 105"
          stroke="url(#gradient-1)"
          strokeWidth="1"
        />
        <defs>
          <motion.linearGradient
            initial={{ x1: "0%", y1: "0%", x2: "0%", y2: "0%" }}
            animate={{ x1: "100%", y1: "90%", x2: "120%", y2: "120%" }}
            id="gradient-1"
            transition={{ duration: Math.random() * (7 - 2) + 2, ease: "linear", repeat: Infinity }}
          >
            <stop stopColor="#93c5fd" stopOpacity={`0`} />
            <stop offset="1" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
          </motion.linearGradient>
        </defs>
      </svg>

      {/* The three tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto w-full relative z-30 [perspective:1000px] [transform-style:preserve-3d] p-8 sm:p-0">
        {/* 1) Partner code */}
        <Container
          initial={{ y: 0 }}
          animate={{ y: [0, -10, 0], rotateX: [0, 10, 0] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 6 }}
          className="p-0 overflow-hidden rounded-lg"
        >
          <a
            href="https://checkout.goatfundedtrader.com/aff/Bullmoney/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <div className="relative w-full h-full rounded-lg border border-blue-500/50 overflow-hidden flex items-center justify-center bg-black" style={{ boxShadow: NEON_BORDER_GLOW }}>
              <Icon className="absolute h-6 w-6 -top-3 -left-3 text-blue-400" />
              <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-blue-400" />
              <Icon className="absolute h-6 w-6 -top-3 -right-3 text-blue-400" />
              <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-blue-400" />
              <div className="w-full h-full flex items-center justify-center">
                <EvervaultCard text="BM15" />
              </div>
              <span className="sr-only">Open Goat funded Challenge code BM15</span>
            </div>
          </a>
        </Container>

        {/* 2) Goat Funded logo */}
        <Container
          initial={{ y: 0 }}
          animate={{ y: [0, -10, 0], rotateX: [0, 10, 0] }}
          transition={{ duration: 2, delay: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 6 }}
          className="flex items-center justify-center p-2"
        >
          <Image
            src="/GTFLOGO.png"
            alt="GTF Logo"
            width={256}
            height={256}
            className="w-full h-full max-w-[92%] max-h-[92%] object-contain rounded-lg"
          />
        </Container>

        {/* 3) Bullmoney logo */}
        <Container
          initial={{ y: 0 }}
          animate={{ y: [0, -10, 0], rotateX: [0, 10, 0] }}
          transition={{ duration: 2, delay: 4, ease: "easeInOut", repeat: Infinity, repeatDelay: 6 }}
          className="flex items-center justify-center p-2"
        >
          <Image
            src="/bullmoney-logo.png"
            alt="Bullmoney Logo"
            width={256}
            height={256}
            className="w-full h-full max-w-[92%] max-h-[92%] object-contain rounded-lg"
          />
        </Container>
      </div>
    </div>
  );
};

/* =====================================================================================
   SkeletonTwo / Globe
===================================================================================== */

export const SkeletonTwo = () => {
  return (
    <div className="h-60 md:h-60 flex flex-col items-center relative bg-transparent dark:bg-transparent mt-10">
      <Globe className="absolute -right-0 md:-right-10 -bottom-80 md:-bottom-72 z-10" />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let phi = 0;
    if (!canvasRef.current) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    
    // Get browser info for optimizations only (not for blocking)
    const browserInfo = detectBrowser();
    const isLowEnd = browserInfo.isLowMemoryDevice || browserInfo.isVeryLowMemoryDevice;
    
    try {
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, isLowEnd ? 1 : 2), // Cap DPR for performance
        width: 600 * 2,
        height: 600 * 2,
        phi: 0,
        theta: 0,
        dark: 1,
        diffuse: 1.2,
        mapSamples: isLowEnd ? 6000 : 16000, // Reduce for low-end devices
        mapBrightness: 6,
        baseColor: [0.38, 0.65, 0.96], // ~ #60a5fa (neon blue)
        markerColor: [0.23, 0.51, 0.96], // ~ #3b82f6 (deeper blue)
        glowColor: [0.58, 0.77, 0.99], // ~ #93c5fd (light blue glow)
        markers: [
          { location: [37.7595, -122.4367], size: 0.03 },
          { location: [40.7128, -74.006], size: 0.1 },
        ],
        onRender: (state) => {
          state.phi = phi;
          phi += 0.01;
        },
      });
      console.log('[Globe] Created successfully');
    } catch (e) {
      console.error('[Globe] Failed to create globe:', e);
      setShowFallback(true);
      return;
    }

    return () => {
      if (globe) {
        try {
          globe.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
      }
    };
  }, []);

  // Fallback only shown if WebGL creation actually failed
  if (showFallback) {
    return (
      <div 
        className={cn("pointer-events-none flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black rounded-full", className)}
        style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
      >
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-400/30 to-blue-600/20 border border-blue-500/40 flex items-center justify-center" style={{ boxShadow: NEON_BORDER_GLOW }}>
          <span className="text-blue-400 text-4xl" style={{ filter: 'drop-shadow(0 0 10px #60a5fa)' }}>🌍</span>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
      className={cn("pointer-events-none", className)}
    />
  );
};

/* =====================================================================================
   Card helpers
===================================================================================== */

const CardSkeletonBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("overflow-hidden relative w-full h-full", className)}>{children}</div>;
};

const CardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("p-6", className)}>{children}</div>;
};

const CardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3
      className={cn(
        "font-sans text-base font-semibold tracking-tight text-neutral-100",
        className
      )}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "font-sans max-w-xs text-base font-normal tracking-tight mt-2 text-neutral-300",
        className
      )}
    >
      {children}
    </div>
  );
};

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      whileHover="animate"
      className={cn(
        "group isolate flex flex-col rounded-2xl bg-neutral-950 shadow-[0_1px_1px_rgba(0,0,0,0.25),0_8px_24px_rgba(0,0,0,0.35)] overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

const ShimmerText = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.span
    className={cn(
      "bg-clip-text text-transparent",
      NEON_TEXT_GRADIENT,
      "bg-[length:200%_100%]",
      className
    )}
    style={{ textShadow: NEON_GLOW }}
    animate={{ 
      backgroundPositionX: ["0%", "100%"],
      textShadow: [
        NEON_GLOW,
        "0 0 2px #60a5fa, 0 0 5px #60a5fa, 0 0 10px #3b82f6",
        NEON_GLOW,
      ],
    }}
    transition={{ 
      backgroundPositionX: { duration: 8, repeat: Infinity, ease: "linear" },
      textShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    }}
  >
    {children}
  </motion.span>
);

/* Fancy dropdown with framer-motion */
const SocialsDropdown = ({
  items,
  triggerClassName = "",
}: {
  items: { label: string; href: string; icon: React.ReactNode; gradient: string }[];
  triggerClassName?: string;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("w-full max-w-sm relative z-30", triggerClassName)}>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group inline-flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold",
          "ring-1 ring-inset ring-blue-500/50 text-black transition",
          NEON_TEXT_GRADIENT
        )}
        style={{ boxShadow: NEON_BORDER_GLOW }}
        whileHover={{ boxShadow: "0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)" }}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <Sparkle className="h-4 w-4" style={{ filter: 'drop-shadow(0 0 3px #000)' }} />
          Official links
        </span>
        <Chevron className={cn("h-4 w-4 transition-transform", open && "rotate-180")} style={{ filter: 'drop-shadow(0 0 3px #000)' }} />
      </motion.button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        style={{ overflow: "hidden" }}
        className="mt-2"
      >
        <div className="grid grid-cols-1 gap-2">
          {items.map((it, i) => (
            <motion.a
              key={it.label + i}
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ 
                scale: 1.015,
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.3)"
              }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative block w-full rounded-xl px-3 py-2 text-sm font-semibold",
                "ring-1 ring-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                it.gradient
              )}
              style={{ boxShadow: NEON_BORDER_GLOW }}
            >
              <span className="inline-flex items-center gap-2">
                {it.icon}
                <span>{it.label}</span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 w-1/4 rounded-xl bg-blue-400/10 blur-md" />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.10)_25%,rgba(0,0,0,0.30)_100%)]"
              />
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const Sparkle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16zm14 0l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
  </svg>
);