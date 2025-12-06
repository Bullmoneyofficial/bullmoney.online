"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import Image from "next/image";
import createGlobe from "cobe";
import { TextGenerateEffect } from "./text-generate-effect";

/* =====================================================================================
   Features
===================================================================================== */

export function Features() {
  const [copied, setCopied] = React.useState(false);

  const copyPartnerCode = async () => {
    try {
      await navigator.clipboard.writeText("BM15");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback if clipboard blocked
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
      className="w-full mx-auto bg-black dark:bg-black py-20 px-4 md:px-8"
    >
      <Header>
        <h2
          className={cn(
            "font-sans text-bold text-xl text-center md:text-4xl w-fit mx-auto font-bold tracking-tight",
            "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)] bg-clip-text text-transparent"
          )}
        >
          Bullmoney Prop Firms
        </h2>
      </Header>

      <p className="max-w-lg text-sm text-neutral-300 text-center mx-auto mt-4">
        Trade With The Bull, Funded By The Goats.
      </p>

      <div className="mt-20 grid cols-1 md:grid-cols-5 gap-4 md:auto-rows-[25rem] max-w-7xl mx-auto">
        {/* Left – 3 cols :: JOIN US (keep content; now black & your gold gradient) */}
        <Card className="flex flex-col justify-between md:col-span-3 bg-gradient-to-br from-black via-neutral-950 to-black border border-[#B8983A]/60">
          <CardSkeletonBody>
            <SkeletonOne />
          </CardSkeletonBody>

          <CardContent className="h-40 [&_*]:font-extrabold">
            <h3
              className={cn(
                "font-sans text-base md:text-lg font-extrabold tracking-tight",
                "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)] bg-clip-text text-transparent"
              )}
            >
              JOIN US ON GOAT FUNDED
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-neutral-200 font-extrabold">
              Trade With Our Community Using Partner Code{" "}
              <button
                type="button"
                onClick={copyPartnerCode}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs md:text-sm font-bold",
                  "ring-1 ring-inset ring-[#B8983A]/40 text-black transition",
                  "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)]",
                  "hover:ring-[#B8983A]/60"
                )}
                aria-live="polite"
              >
                BM15
                <span
                  className={`ml-1 inline-block h-2 w-2 rounded-full ${
                    copied ? "bg-emerald-400" : "bg-[#B8983A]"
                  }`}
                />
              </button>
              .
            </p>

            <div className="mt-3 flex items-center gap-3">
              {/* Primary CTA: opens link */}
              <a
                href="https://checkout.goatfundedtrader.com/aff/Bullmoney/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Goat Funded partner code BM15"
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-black shadow",
                  "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)]",
                  "hover:shadow-lg active:scale-[0.98] transition"
                )}
              >
                Open with code <span className="font-mono font-semibold">BM15</span>
              </a>

              {/* Secondary: explicit copy button */}
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

        {/* Top-right – 2 cols :: Goat Funded info (replaces "Learn the skill") */}
        <Card className="flex flex-col justify-between md:col-span-2 bg-gradient-to-br from-black via-neutral-950 to-black border border-[#B8983A]/60">
          <CardContent className="h-40">
            <CardTitle
              className={cn(
                "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)] bg-clip-text text-transparent"
              )}
            >
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

                {/* animated underline */}
                <span
                  className="mt-1 block h-[2px] w-0 rounded-full
                             bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)]
                             transition-all duration-500 group-hover/line:w-full"
                />
              </div>
            </CardDescription>
          </CardContent>

          <CardSkeletonBody>
            <div className="w-full h-full p-4 rounded-lg bg-neutral-950 border border-[#B8983A]/60 ml-6 mt-2 flex items-center justify-center">
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

        {/* Bottom-left – 2 cols :: Community links -> Goat Funded & FTMO */}
        <Card className="flex flex-col justify-between md:col-span-2 bg-gradient-to-br from-black via-neutral-950 to-black border border-[#B8983A]/60">
          <CardContent className="h-40">
            <h3
              className={cn(
                "font-sans text-base md:text-lg font-extrabold tracking-tight",
                "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)] bg-clip-text text-transparent"
              )}
            >
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
                  href: "https://www.goatfundedtrader.com", // replace with your link if needed
                  icon: (
                    <Image
                      src="/GTFLOGO.png"
                      alt="Goat Funded"
                      width={20}
                      height={20}
                    />
                  ),
                  // custom gradient class for the button block
                  gradient:
                    "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)] text-black",
                },
                {
                  label: "FTMO",
                  href: "https://trader.ftmo.com/?affiliates=fGDPMCcFOXviWzowTyxV", // replace with your link if needed
                  icon: (
                    <Image
                      src="/FTMO_LOGOB.png"
                      alt="FTMO"
                      width={20}
                      height={20}
                    />
                  ),
                  gradient:
                    "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)] text-black",
                },
              ]}
            />
          </CardContent>

          <CardSkeletonBody>
            <SkeletonTwo />
          </CardSkeletonBody>
        </Card>

        {/* Bottom-right – 3 cols :: FTMO info (replaces USD ⇄ ZAR Converter) */}
        <Card className="flex flex-col justify-between md:col-span-3 bg-gradient-to-br from-black via-neutral-950 to-black border border-[#B8983A]/60">
          <CardContent className="h-auto">
            <CardTitle
              className={cn(
                "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)] bg-clip-text text-transparent"
              )}
            >
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

                <span
                  className="mt-1 block h-[2px] w-0 rounded-full
                             bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)]
                             transition-all duration-500 group-hover/line:w-full"
                />
              </div>
            </CardDescription>
          </CardContent>

          <CardSkeletonBody>
            <div className="w-full h-full p-4 rounded-lg bg-neutral-950 border border-[#B8983A]/60 ml-6 mt-2 flex items-center justify-center">
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
        <div className="w-full h-full bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)]" />
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
   SkeletonOne (3 tiles inside) — first tile uses local EvervaultCard + Icon
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
      {/* decorative paths (now gold gradient stroke) */}
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
        {/* 1) Partner code — Evervault-style card */}
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
      {/* Globe sits visually above, but all events pass through */}
      <Globe className="absolute -right-0 md:-right-10 -bottom-80 md:-bottom-72 z-10" />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
      // subtle gold tones
      baseColor: [0.85, 0.78, 0.55], // ~ #D9BD6A normalized
      markerColor: [0.72, 0.60, 0.23], // ~ #B8983A normalized
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => globe.destroy();
  }, []);

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
    <p
      className={cn(
        "font-sans max-w-xs text-base font-normal tracking-tight mt-2 text-neutral-300",
        className
      )}
    >
      {children}
    </p>
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
      // your exact gradient
      "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)]",
      "bg-[length:200%_100%]",
      className
    )}
    animate={{ backgroundPositionX: ["0%", "100%"] }}
    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
  >
    {children}
  </motion.span>
);

/* Fancy dropdown with framer-motion — full-click blocks (no hardcoded bg-gradient-to-r now) */
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
      {/* Trigger */}
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

      {/* Content */}
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

              {/* sheen on right edge */}
              <span className="pointer-events-none absolute inset-y-0 right-0 w-1/4 rounded-xl bg-white/10 blur-md" />

              {/* enhanced bottom fade toward globe */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2
                           bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.10)_25%,rgba(0,0,0,0.30)_100%)]"
              />

              {/* subtle radial fade from bottom-right (matches globe area) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -bottom-2 h-32 w-40
                           bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.15)_45%,transparent_75%)]
                           blur-[2px] opacity-90"
              />
            </motion.a>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* Icons */
const TelegramIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 240 240" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="tggrad" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    <circle cx="120" cy="120" r="120" fill="url(#tggrad)" />
    <path
      fill="#fff"
      d="M178.3 72.2c2.7-1 4.9.7 4.3 4.1l-20 94.3c-.7 3.3-2.7 4.1-5.6 2.6l-31-22.9-15 14.5c-1.7 1.7-3.1 3.1-6.4 3.1l2.3-32.5 59.2-53.3c2.6-2.3-.6-3.6-3.9-1.3l-73.2 46.1-31.5-9.9c-3.3-1-3.4-3.3.7-4.8l116.1-39.9z"
    />
  </svg>
);

const YouTubeIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      fill="#FF0033"
      d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41 41 0 0 0 0 12a41 41 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8 41 41 0 0 0 .5-5.8 41 41 0 0 0-.5-5.8Z"
    />
    <path fill="#fff" d="M9.75 8.5v7l6-3.5-6-3.5Z" />
  </svg>
);

/* Simple chevron + sparkle glyphs */
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

/* =====================================================================================
   (Optional legacy) CurrencyConverter — kept here to preserve your file's default export.
   Not used on the page after replacing the tile with FTMO info.
===================================================================================== */

const CurrencyConverter = () => {
  const [amount, setAmount] = React.useState<number>(100);
  const [from, setFrom] = React.useState<"USD" | "ZAR">("USD");
  const [to, setTo] = React.useState<"USD" | "ZAR">("ZAR");
  const [rate, setRate] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);

  const fetchRate = React.useCallback(
    async (base: "USD" | "ZAR", sym: "USD" | "ZAR") => {
      if (base === sym) {
        setRate(1);
        setUpdatedAt(new Date());
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `https://api.exchangerate.host/latest?base=${base}&symbols=${sym}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        const r = data?.rates?.[sym];
        if (typeof r === "number") {
          setRate(r);
          setUpdatedAt(new Date());
        } else {
          throw new Error("Bad rate");
        }
      } catch {
        // safe fallback
        const fallback = base === "USD" && sym === "ZAR" ? 18.0 : 1 / 18.5;
        setRate(fallback);
        setError(" ");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchRate(from, to);
    const id = setInterval(() => fetchRate(from, to), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [from, to, fetchRate]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const refresh = () => fetchRate(from, to);

  const fmt = (ccy: "USD" | "ZAR", val: number) =>
    new Intl.NumberFormat(ccy === "USD" ? "en-US" : "en-ZA", {
      style: "currency",
      currency: ccy,
      maximumFractionDigits: 2,
    }).format(val);

  const converted = rate ? amount * rate : 0;

  return (
    <div
      className={cn(
        "relative rounded-2xl p-4 md:p-5",
        "ring-1 ring-inset ring-[#B8983A]/25",
        "bg-[linear-gradient(90deg,rgba(246,231,182,0.10),rgba(217,189,106,0.10)_35%,rgba(184,152,58,0.10)_65%,rgba(246,231,182,0.10))]"
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "linear-gradient(120deg, rgba(246,231,182,0.25), rgba(217,189,106,0.18), rgba(184,152,58,0.25))",
          maskImage: "linear-gradient(#000, transparent 60%)",
          WebkitMaskImage: "linear-gradient(#000, transparent 60%)",
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs md:text-sm text-[#D9BD6A]">
          <span className="h-2 w-2 rounded-full bg-[#D9BD6A]/80 shadow-[0_0_12px_rgba(217,189,106,0.65)]" />
          {loading ? "Loading rate…" : `1 ${from} = ${rate?.toFixed(3)} ${to}`}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="text-xs rounded-md px-2 py-1 ring-1 ring-[#B8983A]/40 text-[#D9BD6A] hover:bg-[#F6E7B6]/10 focus:outline-none focus:ring-2 focus:ring-[#B8983A]/60 transition"
          >
            Refresh
          </button>
          <button
            onClick={swap}
            className={cn(
              "text-xs rounded-md px-2 py-1 text-black focus:outline-none focus:ring-2 focus:ring-[#B8983A]/60 transition",
              "bg-[linear-gradient(90deg,#F6E7B6,#D9BD6A_35%,#B8983A_65%,#F6E7B6)]"
            )}
          >
            Swap
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-white/10 backdrop-blur-md dark:bg-neutral-900/70 ring-1 ring-[#B8983A]/30">
          <label className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-300">From</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value as "USD" | "ZAR")}
              className={cn(
                "bg-neutral-900 text-white text-[13px] md:text-sm font-semibold rounded-md",
                "px-2 py-1 outline-none border border-neutral-700/70",
                "hover:border-[#B8983A]/60 focus:ring-2 focus:ring-[#B8983A]/60 focus:border-[#B8983A]",
                "transition-colors"
              )}
            >
              <option value="USD" className="dark:bg-neutral-900 bg-white">
                USD — US Dollar
              </option>
              <option value="ZAR" className="dark:bg-neutral-900 bg-white">
                ZAR — South African Rand
              </option>
            </select>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-1 rounded-md ring-1 ring-[#B8983A]/40 text-[#B8983A] bg-[#B8983A]/5">
              {from}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value || 0))}
              className="w-full bg-transparent dark:text-white text-neutral-100 text-lg md:text-xl font-semibold outline-none"
              min={0}
            />
          </div>
        </div>

        <div className="relative rounded-xl p-3 bg-white/10 backdrop-blur-md dark:bg-neutral-900/70 ring-1 ring-[#B8983A]/30 overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-4 -bottom-6 h-40 w-56
                       bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.15)_45%,transparent_75%)]"
          />
          <label className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-300">To</span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value as "USD" | "ZAR")}
              className={cn(
                "bg-neutral-900 text-white text-[13px] md:text-sm font-semibold rounded-md",
                "px-2 py-1 outline-none border border-neutral-700/70",
                "hover:border-[#B8983A]/60 focus:ring-2 focus:ring-[#B8983A]/60 focus:border-[#B8983A]",
                "transition-colors"
              )}
            >
              <option value="ZAR" className="dark:bg-neutral-900 bg-white">
                ZAR — South African Rand
              </option>
              <option value="USD" className="dark:bg-neutral-900 bg-white">
                USD — US Dollar
              </option>
            </select>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-1 rounded-md ring-1 ring-[#B8983A]/40 text-[#B8983A] bg-[#B8983A]/5">
              {to}
            </span>
            <output className="w-full text-lg md:text-xl font-semibold dark:text-white">
              {loading || rate === null ? "—" : fmt(to, converted)}
            </output>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span className={cn(error ? "text-rose-400" : undefined)}>
          {error ? error : "Live rates via exchangerate.host"}
        </span>
        <span>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : ""}</span>
      </div>

      <style jsx global>{`
        select option {
          background-color: #0a0a0a; /* dark panel */
          color: #ffffff;
        }
        @media (prefers-color-scheme: light) {
          select option {
            background-color: #ffffff;
            color: #0a0a0a;
          }
        }
      `}</style>
    </div>
  );
};

export default CurrencyConverter;
