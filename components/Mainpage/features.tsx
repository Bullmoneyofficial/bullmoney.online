"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";
import Image from "next/image";
import createGlobe from "cobe";

// --- THEME CONSTANTS ---
const GOLD_SHIMMER_GRADIENT = "conic-gradient(from 90deg at 50% 50%, #00000000 0%, #D9BD6A 50%, #00000000 100%)";
const GOLD_TEXT_GRADIENT = "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)]";

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
    <div className="relative p-[1.5px] overflow-hidden rounded-full shadow-lg shadow-[#B8983A]/20">
        <motion.div 
            className="absolute inset-[-100%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ background: GOLD_SHIMMER_GRADIENT }}
        />
        <div className="relative z-10 px-3 py-1 bg-[#0a0a0a] rounded-full flex items-center justify-center border border-[#B8983A]/40">
            <span className={cn("bg-clip-text text-transparent text-[10px] font-bold whitespace-nowrap", GOLD_TEXT_GRADIENT)}>
                {label}
            </span>
        </div>
    </div>
    {/* The Triangle Pointer (pointing down) */}
    <div className="w-2 h-2 bg-[#0a0a0a] rotate-45 -translate-y-[4px] relative z-10 border-b border-r border-[#B8983A]/40" />
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
  };

  return (
    <div
      id="features"
      className="w-full full-bleed viewport-full mx-auto bg-black dark:bg-black py-20 px-4 md:px-8"
    >
      <Header>
        <h2
          className={cn(
            "font-sans text-bold text-xl text-center md:text-4xl w-fit mx-auto font-bold tracking-tight",
            GOLD_TEXT_GRADIENT, "bg-clip-text text-transparent"
          )}
        >
          Bullmoney Prop Firms
        </h2>
      </Header>

      <p className="max-w-lg text-sm text-neutral-300 text-center mx-auto mt-4">
        Trade With The Bull, Funded By The Goats.
      </p>

      <div className="mt-20 grid cols-1 md:grid-cols-5 gap-4 md:auto-rows-[25rem] max-w-7xl mx-auto">
        
        {/* Left – 3 cols :: JOIN US */}
        <Card className="flex flex-col justify-between md:col-span-3 bg-gradient-to-br from-black via-neutral-950 to-black border border-[#B8983A]/60">
          <CardSkeletonBody>
            <SkeletonOne />
          </CardSkeletonBody>

          <CardContent className="h-40 [&_*]:font-extrabold relative">
            <h3
              className={cn(
                "font-sans text-base md:text-lg font-extrabold tracking-tight",
                GOLD_TEXT_GRADIENT, "bg-clip-text text-transparent"
              )}
            >
              JOIN US ON GOAT FUNDED
            </h3>

            <div className="mt-2 text-sm leading-relaxed text-neutral-200 font-extrabold">
              Trade With Our Community Using Partner Code{" "}
              <span className="relative inline-block">
                  {/* TIP 0: Partner Code */}
                  <AnimatePresence>
                    {activeTipIndex === 0 && (
                        <HelperTip label="Click to Copy" className="-top-10 left-1/2 -translate-x-1/2" />
                    )}
                  </AnimatePresence>
                  
                  <button
                    type="button"
                    onClick={copyPartnerCode}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs md:text-sm font-bold",
                      "ring-1 ring-inset ring-[#B8983A]/40 text-black transition",
                      GOLD_TEXT_GRADIENT,
                      "hover:ring-[#B8983A]/60"
                    )}
                  >
                    BM15
                    <span
                      className={`ml-1 inline-block h-2 w-2 rounded-full ${
                        copied ? "bg-white" : "bg-[#B8983A]"
                      }`}
                    />
                  </button>
              </span>
              .
            </div>

            <div className="mt-3 flex items-center gap-3">
              <a
                href="https://checkout.goatfundedtrader.com/aff/Bullmoney/"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-black shadow",
                  GOLD_TEXT_GRADIENT,
                  "hover:shadow-lg active:scale-[0.98] transition"
                )}
              >
                Open with code <span className="font-mono font-semibold">BM15</span>
              </a>

              <button
                type="button"
                onClick={copyPartnerCode}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#D9BD6A] ring-1 ring-inset ring-[#B8983A]/40 hover:bg-[#F6E7B6]/10 hover:ring-[#B8983A]/60 active:scale-[0.98] transition"
              >
                {copied ? "Copied!" : "Copy code"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Top-right – 2 cols :: Goat Funded info */}
        <Card className="flex flex-col justify-between md:col-span-2 bg-gradient-to-br from-black via-neutral-950 to-black border border-[#B8983A]/60">
          <CardContent className="h-40">
            <CardTitle className={cn(GOLD_TEXT_GRADIENT, "bg-clip-text text-transparent")}>
              Goat Funded Trader
            </CardTitle>

            <CardDescription className="!max-w-none text-neutral-200">
              <div className="group/line inline-block font-semibold">
                <motion.p
                  whileHover={{ scale: 1.01, filter: "brightness(1.08)" }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="text-sm md:text-[15px] leading-snug"
                >
                  <ShimmerText className="font-extrabold">
                    Become a funded trader with Goat Funded
                  </ShimmerText>{" "}
                  pass a multi‑step challenge, trade company capital, and keep a high profit
                  split with flexible trading conditions.
                </motion.p>
                <span className={cn("mt-1 block h-[2px] w-0 rounded-full transition-all duration-500 group-hover/line:w-full", GOLD_TEXT_GRADIENT)} />
              </div>
            </CardDescription>
          </CardContent>

          <CardSkeletonBody>
            <div className="w-full h-full p-4 rounded-lg bg-neutral-950 border border-[#B8983A]/60 ml-6 mt-2 flex items-center justify-center relative">
               {/* TIP 1: Goat Logo */}
               <AnimatePresence>
                    {activeTipIndex === 1 && (
                        <HelperTip label="Our Partner" className="top-2" />
                    )}
                </AnimatePresence>
              <Image
                src="/GTFLOGO.png"
                alt="Goat Funded Trader Logo"
                width={220}
                height={220}
                className="object-contain rounded-lg"
              />
            </div>
          </CardSkeletonBody>
        </Card>

        {/* Bottom-left – 2 cols :: Community links */}
        <Card className="flex flex-col justify-between md:col-span-2 bg-gradient-to-br from-black via-neutral-950 to-black border border-[#B8983A]/60">
          <CardContent className="h-40">
            <h3 className={cn("font-sans text-base md:text-lg font-extrabold tracking-tight", GOLD_TEXT_GRADIENT, "bg-clip-text text-transparent")}>
              Find Our Links Below
            </h3>

            <p className="mt-2 text-sm leading-snug text-neutral-200 font-semibold">
              Explore official communities, updates and live content from Goat Funded and FTMO.
            </p>

            <SocialsDropdown
              triggerClassName="mt-3"
              items={[
                {
                  label: "Goat Funded Trader",
                  href: "https://www.goatfundedtrader.com", 
                  icon: (<Image src="/GTFLOGO.png" alt="Goat Funded" width={20} height={20} />),
                  gradient: cn(GOLD_TEXT_GRADIENT, "text-black"),
                },
                {
                  label: "FTMO",
                  href: "https://trader.ftmo.com/?affiliates=fGDPMCcFOXviWzowTyxV", 
                  icon: (<Image src="/FTMO_LOGOB.png" alt="FTMO" width={20} height={20} />),
                  gradient: cn(GOLD_TEXT_GRADIENT, "text-black"),
                },
              ]}
            />
          </CardContent>

          <CardSkeletonBody>
            <SkeletonTwo />
          </CardSkeletonBody>
        </Card>

        {/* Bottom-right – 3 cols :: FTMO info */}
        <Card className="flex flex-col justify-between md:col-span-3 bg-gradient-to-br from-black via-neutral-950 to-black border border-[#B8983A]/60">
          <CardContent className="h-auto">
            <CardTitle className={cn(GOLD_TEXT_GRADIENT, "bg-clip-text text-transparent")}>
              FTMO
            </CardTitle>

            <CardDescription className="!max-w-none text-neutral-200">
              <div className="group/line inline-block font-semibold">
                <motion.p
                  whileHover={{ scale: 1.01, filter: "brightness(1.08)" }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="text-sm md:text-[15px] leading-snug"
                >
                  <ShimmerText className="font-extrabold">
                    Take the FTMO Challenge 
                  </ShimmerText>{" "}
                  validate your trading strategy, access funded company capital, and earn profit shares while using advanced professional tools trusted by a global community of successful traders.
                </motion.p>
                <span className={cn("mt-1 block h-[2px] w-0 rounded-full transition-all duration-500 group-hover/line:w-full", GOLD_TEXT_GRADIENT)} />
              </div>
            </CardDescription>
          </CardContent>

          <CardSkeletonBody>
            <div className="w-full h-full p-4 rounded-lg bg-neutral-950 border border-[#B8983A]/60 ml-6 mt-2 flex items-center justify-center relative">
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
        style={{ transformOrigin: "top-left" }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="absolute inset-0 h-full border border-[#B8983A]/60 w-full"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute -top-1 -left-1 h-2 w-2 bg-neutral-900"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute -top-1 -right-1 h-2 w-2 bg-neutral-900"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute -bottom-1 -left-1 h-2 w-2 bg-neutral-900"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute -bottom-1 -right-1 h-2 w-2 bg-neutral-900"
        />
      </motion.div>
      {children}
    </div>
  );
};

/* =====================================================================================
   Local Evervault-style Card (no external imports)
===================================================================================== */

const EvervaultCard = ({ text, className }: { text?: string; className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");

  useEffect(() => setRandomString(generateRandomString(1200)), []);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
    // optional: mutate text cloud on hover
    setRandomString(generateRandomString(1200));
  }

  return (
    <div className={cn("p-0.5 bg-transparent w-full h-full relative", className)}>
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center"
      >
        <CardPattern mouseX={mouseX} mouseY={mouseY} randomString={randomString} />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/80 dark:bg-black/80 blur-md" />
            <span className="relative z-20 font-extrabold text-2xl md:text-3xl text-black dark:text-white">
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CardPattern = ({ mouseX, mouseY, randomString }: any) => {
  const mask = useMotionTemplate`radial-gradient(200px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage: mask as any, WebkitMaskImage: mask as any };

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50" />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      >
        <div className={cn("w-full h-full", GOLD_TEXT_GRADIENT)} />
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-white/80 font-mono font-bold">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
};

const Icon = ({ className, ...rest }: any) => (
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

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateRandomString = (length: number) =>
  Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join("");

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
            <stop stopColor="#F6E7B6" stopOpacity={`0`} />
            <stop offset="1" stopColor="#B8983A" />
            <stop offset="1" stopColor="#B8983A" stopOpacity="0" />
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
            <stop stopColor="#F6E7B6" stopOpacity={`0`} />
            <stop offset="1" stopColor="#B8983A" />
            <stop offset="1" stopColor="#B8983A" stopOpacity="0" />
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
            <div className="relative w-full h-full rounded-lg border border-[#B8983A]/60 overflow-hidden flex items-center justify-center bg-black">
              <Icon className="absolute h-4 w-4 -top-2 -left-2 text-[#B8983A]" />
              <Icon className="absolute h-4 w-4 -bottom-2 -left-2 text-[#B8983A]" />
              <Icon className="absolute h-4 w-4 -top-2 -right-2 text-[#B8983A]" />
              <Icon className="absolute h-4 w-4 -bottom-2 -right-2 text-[#B8983A]" />
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
  const [isBatterySaving, setIsBatterySaving] = useState(false);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  useEffect(() => {
    const handleFreeze = () => {
      console.log('[Globe] 🔋 Battery saver active');
      setIsBatterySaving(true);
      if (globeRef.current) {
        try {
          globeRef.current.destroy();
          globeRef.current = null;
        } catch (e) {
          console.error('[Globe] Error destroying globe:', e);
        }
      }
    };
    const handleUnfreeze = () => {
      console.log('[Globe] ⚡ Battery saver off');
      setIsBatterySaving(false);
    };
    
    window.addEventListener('bullmoney-freeze', handleFreeze);
    window.addEventListener('bullmoney-unfreeze', handleUnfreeze);
    return () => {
      window.removeEventListener('bullmoney-freeze', handleFreeze);
      window.removeEventListener('bullmoney-unfreeze', handleUnfreeze);
    };
  }, []);

  useEffect(() => {
    if (isBatterySaving) return;
    
    let phi = 0;
    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.85, 0.78, 0.55], // ~ #D9BD6A
      markerColor: [0.72, 0.60, 0.23], // ~ #B8983A
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.015;
      },
    });
    globeRef.current = globe;

    return () => {
      if (globe) {
        try {
          globe.destroy();
          globeRef.current = null;
        } catch (e) {
          // Ignore destroy errors
        }
      }
    };
  }, [isBatterySaving]);

  return (
    <>
      {!isBatterySaving && (
        <canvas
          ref={canvasRef}
          style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
          className={cn("pointer-events-none", className)}
        />
      )}
      {isBatterySaving && (
        <div
          style={{ width: 600, height: 600, maxWidth: "100%", aspectRatio: 1 }}
          className={cn("pointer-events-none flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black rounded-full", className)}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">🔋</div>
            <div className="text-xs text-neutral-500">Battery Saver</div>
          </div>
        </div>
      )}
    </>
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
      GOLD_TEXT_GRADIENT,
      "bg-[length:200%_100%]",
      className
    )}
    animate={{ backgroundPositionX: ["0%", "100%"] }}
    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group inline-flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold",
          "ring-1 ring-inset ring-[#B8983A]/30 text-black hover:ring-[#B8983A]/50 transition",
          "bg-[linear-gradient(90deg,#F6E7B6_0%,#D9BD6A_35%,#B8983A_65%,#F6E7B6_100%)]"
        )}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <Sparkle className="h-4 w-4" />
          Official links
        </span>
        <Chevron className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

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
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative block w-full rounded-xl px-3 py-2 text-sm font-semibold shadow",
                "ring-1 ring-white/10 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8983A]",
                it.gradient
              )}
            >
              <span className="inline-flex items-center gap-2">
                {it.icon}
                <span>{it.label}</span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 w-1/4 rounded-xl bg-white/10 blur-md" />
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