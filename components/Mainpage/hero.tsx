"use client";
import React, { useRef, useEffect, useState } from "react";
import { 
  AnimatePresence, 
  motion, 
} from "framer-motion";
import Image from "next/image";
import Balancer from "react-wrap-balancer";
import { getCalApi } from "@calcom/embed-react";
import { FlipWords } from "./flip-words";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Russo_One } from "next/font/google";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";

// Component Imports
import { ContainerScroll } from "./container-scroll-animation";
import { EncryptedText } from "./encrypted-text";
import { SparklesCore } from "./sparkles"; 

dayjs.extend(duration);
dayjs.extend(utc);

const russo = Russo_One({ weight: "400", subsets: ["latin"] });

// ===== Types =====
type Trade = {
  active: boolean;
  deadlineISO?: string | null;
  title?: string;
  reason?: string;
  imageUrls?: string[];
};

// ========== MEDIA CAROUSEL ==========
interface Slide {
  type: "image" | "video" | "youtube";
  src: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface MediaCarouselProps {
  slides: Slide[];
  height?: number;
  autoSlideInterval?: number;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  slides,
  height = 540,
  autoSlideInterval = 8000,
}) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoSlideInterval]);

  const slide = slides[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px] bg-neutral-900/30"
      style={{ aspectRatio: "16 / 9", height: "100%", minHeight: 320 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] via-[#0c0c0c] to-[#1a1a1a]"
        >
          {slide.type === "image" && (
            <Image
              src={slide.src}
              alt={slide.title || "Slide image"}
              fill
              className="object-cover object-center"
              priority
            />
          )}
          {slide.type === "video" && (
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={slide.src} type="video/mp4" />
            </video>
          )}
          {slide.type === "youtube" && (
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                className="absolute inset-0 w-full h-full object-cover"
                src={`https://www.youtube-nocookie.com/embed/${
                  slide.src.includes("youtube.com") || slide.src.includes("youtu.be")
                    ? new URL(slide.src).searchParams.get("v") ||
                      slide.src.split("/").pop()?.split("?")[0]
                    : slide.src
                }?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&fs=0&disablekb=1&loop=1&iv_load_policy=3&playsinline=1&playlist=${
                  new URL(slide.src).searchParams.get("v") ||
                  slide.src.split("/").pop()?.split("?")[0]
                }`}
                title={slide.title || "YouTube video"}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <button
        onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 z-20"
      >
        <ChevronLeft className="text-white w-6 h-6" />
      </button>
      <button
        onClick={() => setCurrent((p) => (p + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 p-2 rounded-full hover:bg-black/60 z-20"
      >
        <ChevronRight className="text-white w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === current ? "bg-white w-4" : "bg-neutral-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// --- Roll digits (single-card 3D roll) ---
const RollDigit = ({ value }: { value: string }) => {
  const [prev, setPrev] = React.useState(value);
  const [animKey, setAnimKey] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);

  React.useEffect(() => {
    if (value !== prev) setAnimating(true);
  }, [value, prev]);

  return (
    <div
      className="
        relative rounded-md overflow-hidden
        bg-black text-white border border-white/10
        shadow-[0_10px_16px_rgba(0,0,0,0.35)] [perspective:900px]
      "
      style={{
        width: "var(--digit-w, 56px)",
        height: "var(--digit-h, 72px)",
      }}
    >
      {!animating && (
        <div
          className="absolute inset-0 flex items-center justify-center font-bold tabular-nums"
          style={{ fontSize: "var(--digit-f, 44px)", lineHeight: 1 }}
        >
          {prev}
        </div>
      )}

      {animating && (
        <motion.div
          key={animKey}
          initial={{ rotateX: 0 }}
          animate={{ rotateX: -180 }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          className="absolute inset-0"
          onAnimationComplete={() => {
            setPrev(value);
            setAnimating(false);
            setAnimKey((k) => k + 1);
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center font-bold tabular-nums [backface-visibility:hidden]"
            style={{ fontSize: "var(--digit-f, 44px)", lineHeight: 1 }}
          >
            {prev}
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center font-bold tabular-nums [backface-visibility:hidden]"
            style={{
              fontSize: "var(--digit-f, 44px)",
              lineHeight: 1,
              transform: "rotateX(180deg) translateZ(0.01px)",
            }}
          >
            {value}
          </div>
        </motion.div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_45%,transparent_55%,rgba(0,0,0,0.28))]" />
    </div>
  );
};

//Helpers
const pad2 = (n: number) => n.toString().padStart(2, "0");
type Parts = { totalMs: number; d: number; h: number; m: number; s: number };

const calcParts = (deadlineISO: string): Parts => {
  const end = dayjs.utc(deadlineISO);
  const now = dayjs.utc();
  const diffMs = Math.max(0, end.diff(now));
  const total = Math.floor(diffMs / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { totalMs: diffMs, d, h, m, s };
};

// ========== HERO ==========
export function Hero() {
  
  const parentRef = useRef<HTMLDivElement>(null);

  const [trade, setTrade] = useState<Trade | null>(null);
  const [parts, setParts] = useState<Parts>({ totalMs: 0, d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "15min" });
      cal("ui", { theme: "dark", hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        const res = await fetch(`/api/trade?t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        setTrade(data);
      } catch (err) {
        console.error("Error fetching trade:", err);
      }
    };
    fetchTrade();

    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<Trade>).detail;
      if (detail) setTrade(detail);
      else fetchTrade();
    };

    window.addEventListener("trade:updated", onUpdated);
    return () => window.removeEventListener("trade:updated", onUpdated);
  }, []);

  useEffect(() => {
    if (!trade?.active || !trade.deadlineISO) {
      setParts({ totalMs: 0, d: 0, h: 0, m: 0, s: 0 });
      return;
    }

    const tick = () => setParts(calcParts(trade.deadlineISO!));
    tick(); 
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [trade?.active, trade?.deadlineISO]);

  return (
    <div
      ref={parentRef}
      className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-neutral-950 w-full"
    >
    
  
      {/* SPARKLES BACKGROUND */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={2.0} 
          maxSize={.5}
          particleDensity={70}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* CONTAINER SCROLL ANIMATION with MediaCarousel & Title */}
      <div className="relative z-20 w-full -mt-20 md:-mt-10 lg:-mt-0">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center mb-4 sm:mb-10 w-full">
              
              {/* MAIN HEADER INSIDE SCROLL CONTAINER */}
              <div className="relative w-full overflow-hidden mb-6 sm:mb-8 px-4">
                <div
                  className="grid items-center gap-3
                  grid-cols-[minmax(64px,1fr)_auto_minmax(64px,1fr)]
                  sm:grid-cols-[minmax(96px,1fr)_auto_minmax(96px,1fr)]
                  md:grid-cols-[minmax(140px,1fr)_auto_minmax(140px,1fr)]"
                >
                  {/* LEFT BARS */}
                  <motion.div
                    initial={{ x: "-110%" }}
                    animate={{ x: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="justify-self-end flex flex-col gap-2 sm:gap-3 md:gap-4 pointer-events-none"
                  >
                    <div className="bg-white h-[6px] sm:h-[8px] md:h-[10px] w-[clamp(90px,22vw,320px)] skew-x-[-25deg]" />
                    <div className="bg-white h-[6px] sm:h-[8px] md:h-[10px] w-[clamp(90px,22vw,320px)] skew-x-[-25deg]" />
                  </motion.div>

                  {/* TITLE WITH ENCRYPTED TEXT */}
                  <div className="text-center max-w-[90vw] sm:max-w-4xl text-xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                    <Balancer>
                      <h2
                        className={`${russo.className} uppercase leading-none text-white text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[0.08em] drop-shadow-[0_2px_10px_rgba(255,255,255,0.12)]`}
                      >
                        <EncryptedText 
                          text="Built for those who want more than trades." 
                          interval={40}
                          className="whitespace-normal" 
                        />
                      </h2>
                    </Balancer>
                  </div>

                  {/* RIGHT BARS */}
                  <motion.div
                    initial={{ x: "110%" }}
                    animate={{ x: 0 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="justify-self-start flex flex-col gap-2 sm:gap-3 md:gap-4 pointer-events-none"
                  >
                    <div className="bg-white h-[6px] sm:h-[8px] md:h-[10px] w-[clamp(90px,22vw,320px)] skew-x-[25deg]" />
                    <div className="bg-white h-[6px] sm:h-[8px] md:h-[10px] w-[clamp(90px,22vw,320px)] skew-x-[25deg]" />
                  </motion.div>
                </div>
              </div>

              {/* SUBTITLE */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.5 }}
                className="relative z-20 mx-auto mt-0 max-w-2xl px-4 text-center text-xs sm:text-base/6 text-gray-200 uppercase"
              >
                MASTER{" "}
                <FlipWords words={["CHARTS", "PRICE ACTION", "ORDER FLOW", "PATTERNS"]} duration={4000} className="px-0 font-bold text-blue-500" />
                , SHARPEN YOUR{" "}
                <FlipWords words={["PSYCHOLOGY", "DISCIPLINE", "PATIENCE", "RISK CONTROL"]} duration={4000} className="px-0 font-bold text-blue-500" />
                , AND TRADE{" "}
                <FlipWords words={["CRYPTO", "GOLD", "INDICES", "FOREX"]} duration={4000} className="px-0 font-bold text-blue-500" />
                WITH CONFIDENCE.
              </motion.p>
            </div>
          }
        >
          <MediaCarousel
            slides={[
              { type: "video", src: "/newhero.mp4" },
              { type: "image", src: "/Fvfront.png" },
              { type: "youtube", src: "https://www.youtube.com/watch?v=wWB_SeA15dU" },
              { type: "youtube", src: "https://youtu.be/ZWKp63JTvgE?si=wgEIY6alRVwG-ZJl&t=38" },
              { type: "image", src: "/bullmoneyvantage.png" },
            ]}
          />
        </ContainerScroll>
      </div>

    </div>
  );
}