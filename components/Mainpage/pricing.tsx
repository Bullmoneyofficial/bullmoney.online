"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconClipboard,
  IconClipboardCheck,
  IconExternalLink,
  IconDownload,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { SparklesCore } from "./sparkles"; 



// =========================================
// 2. PRICING SECTION
// =========================================

export function Pricing() {
  const [copied, setCopied] = React.useState(false);
  const [activePartner, setActivePartner] = React.useState<"Vantage broker" | "XM">(
    "Vantage broker"
  );

  const copyPartnerCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {}
  };

  return (
    <section
      id="pricing"
      className="relative isolate w-full bg-blue dark:bg-neutral-950 px-4 py-12 sm:py-16 lg:px-4 overflow-hidden"
    >
   

      {/* --- SPARKLES BACKGROUND (Middle Layer) --- */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none mix-blend-screen">
        <SparklesCore
          id="tsparticlespricing"
          background="transparent"
          minSize={0.8}
          maxSize={2.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        <LuxeCardReactive
          variant={activePartner === "Vantage broker" ? "vantage" : "xm"}
          className="mx-auto mt-12 max-w-7xl"
        >
          <header className="flex flex-col items-center text-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase",
                activePartner === "Vantage broker"
                  ? "text-blue-300/70"
                  : "text-blue-300/70"
              )}
            >
              <span
                className={cn(
                  "h-[6px] w-[6px] rounded-full shadow-[0_0_18px_rgba(233,215,168,0.45)]",
                  activePartner === "Vantage broker"
                    ? "bg-gradient-to-r from-blue-400 to-blue-500 shadow-[0_0_18px_rgba(168,85,247,0.45)]"
                    : "bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_18px_rgba(56,189,248,0.45)]"
                )}
              />
              BENEFITS • COMMUNITY
            </span>

            <h3 className="mt-1 text-2xl md:text-3xl font-black leading-tight">
              <span
                className={cn(
                  "bg-clip-text text-transparent",
                  activePartner === "Vantage broker"
                    ? "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"
                    : "bg-gradient-to-r from-sky-400 via-blue-500 to-blue-400"
                )}
              >
                WHAT YOU GET
              </span>
            </h3>
          </header>

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            {[
              "Live Trade Streams: Watch my personal trades unfold in real-time",
              "Daily/weekly Market Analysis: Stay updated with market trends and trade ideas",
              "Live stream Mentorship and Support:  mentorship from me, with access to one-on-one guidance on live streams",
              "A Growing Trading Community: Join a community of traders who are committed to trading the right way",
              "Smart Risk Management & Trading Strategy: Learn proven trading strategies and risk management techniques",
              "Trading-focused environment with rules & accountability.",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 text-[15px] text-neutral-200"
              >
                <span
                  className={cn(
                    "relative inline-grid place-items-center h-5 w-5 rounded-full ring-1",
                    activePartner === "Vantage broker"
                      ? "bg-[#0E0F12] ring-blue-500/25"
                      : "bg-[#0E0F12] ring-sky-500/25"
                  )}
                >
                  <span
                    className={cn(
                      "h-[9px] w-[9px] rotate-45 rounded-[2px] shadow-[0_0_14px]",
                      activePartner === "Vantage broker"
                        ? "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-400 shadow-[0_0_14px_rgba(168,85,247,0.4)]"
                        : "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-400 shadow-[0_0_14px_rgba(56,189,248,0.4)]"
                    )}
                  />
                </span>

                <span className="font-semibold tracking-wide">{f}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[13px] md:text-sm text-neutral-300/85 leading-relaxed text-center">
            Expect{" "}
            <span
              className={cn(
                "font-semibold",
                activePartner === "Vantage broker"
                  ? "text-blue-300"
                  : "text-sky-300"
              )}
            >
              Elite Mentorship
            </span>
            ,{" "}
            <span
              className={cn(
                "font-semibold",
                activePartner === "Vantage broker"
                  ? "text-blue-300"
                  : "text-sky-300"
              )}
            >
              High Trade Setups
            </span>{" "}
            and powerful tools tailored for you.{" "}
            <span
              className={cn(
                "font-semibold",
                activePartner === "Vantage broker"
                  ? "text-blue-300"
                  : "text-sky-300"
              )}
            >
              Free Access is a preview of us but VIP is the full experience.
            </span>
          </p>
        </LuxeCardReactive>
      </div>
    </section>
  );
}

/* ============================================================================
   VIP panel with mouse-follow shimmer
============================================================================ */

function ShimmerPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  const glow = useMotionTemplate`radial-gradient(220px at ${mx}px ${my}px, rgba(56,189,248,.20), transparent 30%)`;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/10",
        "bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm",
        "shadow-[0_1px_1px_rgba(0,0,0,0.05),0_12px_60px_rgba(2,6,23,0.35)]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl p-[1px]"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, rgba(56,189,248,.25), rgba(34, 37, 236, 1), rgba(129,140,248,.3), rgba(56,189,248,.25))",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />
      {children}
    </div>
  );
}

/* ============================================================================
   INLINE Evervault-style Card (reactive code badge)
============================================================================ */

export const EvervaultCard = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = React.useState("");

  React.useEffect(() => {
    setRandomString(generateRandomString(1500));
  }, []);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
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
        className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-40 w-40 sm:h-44 sm:w-44 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-white/80 dark:bg-black/80 blur-md" />
            <span className="relative z-20 font-extrabold text-3xl sm:text-4xl text-black dark:text-white select-none">
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function CardPattern({
  mouseX,
  mouseY,
  randomString,
}: {
  mouseX: any;
  mouseY: any;
  randomString: string;
}) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50" />
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500 to-blue-700 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-white font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

export const EvervaultCardRed = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = React.useState("");

  React.useEffect(() => {
    setRandomString(generateRandomString(1500));
  }, []);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
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
        className="group/card rounded-3xl w-full h-full relative overflow-hidden bg-transparent flex items-center justify-center"
      >
        <CardPatternRed
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative h-40 w-40 sm:h-44 sm:w-44 rounded-full flex items-center justify-center">
            {/* subtle glass behind the code */}
            <div className="absolute inset-0 rounded-full bg-white/85 dark:bg-black/80 blur-md" />
            <span className="relative z-20 font-extrabold text-3xl sm:text-4xl text-black dark:text-white select-none">
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function CardPatternRed({
  mouseX,
  mouseY,
  randomString,
}: {
  mouseX: any;
  mouseY: any;
  randomString: string;
}) {
  const maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage as unknown as string };

  return (
    <div className="pointer-events-none">
      <div className="absolute inset-0 rounded-2xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50" />
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover/card:opacity-100 backdrop-blur-xl transition duration-500"
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 mix-blend-overlay group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 p-2 text-[10px] leading-4 h-full whitespace-pre-wrap break-words text-violet-50/90 dark:text-violet-100/90 font-mono font-bold transition duration-500">
          {randomString}
        </p>
      </motion.div>
      <div className="absolute inset-0 rounded-2xl ring-1 ring-blue-500/20" />
    </div>
  );
}

const characters = "BULLMONEY";
export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/* ============================================================================
   LuxeCardReactive
============================================================================ */

export function LuxeCardReactive({
  children,
  className,
  variant = "vantage", 
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "vantage" | "xm" | "neutral";
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const theme = {
    vantage: {
      glow1: "rgba(30, 34, 253, 0.23)", 
      glow2: "rgba(42, 45, 241, 0.22)",
      ring: "rgba(51, 54, 234, 0.35)",
      border: "rgba(168,85,247,0.25)",
      particle1: "#5570f7ff",
      particle2: "#3355eaff",
      conic:
        "conic-gradient(from 180deg, rgba(85, 101, 247, 0.22), rgba(60, 51, 234, 0.22), rgba(126,34,206,.22), rgba(85, 115, 247, 0.22))",
    },
    xm: {
      glow1: "rgba(16,185,129,0.20)", 
      glow2: "rgba(5,150,105,0.10)",
      ring: "rgba(5,150,105,0.35)",
      border: "rgba(16,185,129,0.25)",
      particle1: "#10B981",
      particle2: "#059669",
      conic:
        "conic-gradient(from 180deg, rgba(16,185,129,.22), rgba(5,150,105,.22), rgba(4,120,87,.22), rgba(16,185,129,.22))",
    },
    neutral: {
      glow1: "rgba(62, 68, 222, 0.38)",
      glow2: "rgba(65, 62, 254, 0.38)",
      ring: "rgba(32, 27, 190, 0.31)",
      border: "rgba(150,150,150,0.20)",
      particle1: "#0c0eb1ff",
      particle2: "#3b4fc0ff",
      conic:
        "conic-gradient(from 180deg, rgba(59, 75, 220, 0.12), rgba(33, 47, 241, 0.12), rgrgba(29, 45, 214, 0.12)rgba(87, 73, 213, 0.12))",
    },
  }[variant];

  const mx = useSpring(useMotionValue(0), {
    stiffness: 220,
    damping: 26,
    mass: 0.6,
  });
  const my = useSpring(useMotionValue(0), {
    stiffness: 220,
    damping: 26,
    mass: 0.6,
  });

  const tiltX = useSpring(0, { stiffness: 180, damping: 18 });
  const tiltY = useSpring(0, { stiffness: 180, damping: 18 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    mx.set(x);
    my.set(y);

    const dx = (x / r.width) * 2 - 1;
    const dy = (y / r.height) * 2 - 1;
    tiltX.set(dy * 6);
    tiltY.set(-dx * 6);
  };

  const onLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const glow = useMotionTemplate`
    radial-gradient(220px at ${mx}px ${my}px,
      ${theme.glow1},
      ${theme.glow2} 45%,
      transparent 70%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "relative overflow-hidden rounded-[22px] p-6 md:p-8",
        "bg-[linear-gradient(180deg,#0A0B0E_0%,#0D0F13_100%)]",
        `ring-1`,
        className
      )}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: `0 2px 12px rgba(0,0,0,0.35), 0 40px 120px rgba(0,0,0,0.65), 0 0 25px ${theme.ring}`,
      }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 180, damping: 17 }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[22px]">
        <div className="absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/5"></div>
        <div
          className="absolute inset-[1px] rounded-[21px] ring-1 ring-inset"
          style={{ borderColor: theme.border }}
        ></div>
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px]"
        style={{
          background: theme.conic,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: 1,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-x-1 -top-1 h-[120%] rotate-12 
        bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]"
        initial={{ x: "-120%" }}
        whileHover={{ x: "120%" }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, ${theme.particle1} 0.5px, transparent 1.5px),
              radial-gradient(circle at 80% 70%, ${theme.particle2} 0.5px, transparent 1.5px)
            `,
            backgroundSize: "20px 20px, 22px 22px",
          }}
        />
      </div>

      <motion.div
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}