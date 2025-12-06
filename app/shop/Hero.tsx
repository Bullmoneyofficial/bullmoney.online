"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "../VIP/ShopContext"; // Ensure this path is correct for your project structure
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// --- PARTICLE IMPORTS ---
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";

// --- TYPES FOR CAROUSEL ---
interface Slide {
  type: "image" | "video" | "youtube";
  src: string;
  title?: string;
}

interface MediaCarouselProps {
  slides: Slide[];
  autoSlideInterval?: number;
}

// --- MEDIA CAROUSEL COMPONENT ---
const MediaCarousel: React.FC<MediaCarouselProps> = ({
  slides,
  autoSlideInterval = 6000,
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
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[4/3] overflow-hidden rounded-[32px] border border-neutral-800 bg-neutral-800/30 shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center bg-black"
        >
          {slide.type === "image" && (
            <div className="relative w-full h-full">
               {/* Using standard img for broad compatibility */}
               <img
                src={slide.src}
                alt={slide.title || "Slide"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            </div>
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
            <iframe
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              src={`https://www.youtube-nocookie.com/embed/${
                slide.src.includes("youtube.com") || slide.src.includes("youtu.be")
                  ? new URL(slide.src).searchParams.get("v") ||
                    slide.src.split("/").pop()?.split("?")[0]
                  : slide.src
              }?autoplay=1&mute=1&controls=0&loop=1&playlist=${
                 new URL(slide.src).searchParams.get("v") ||
                 slide.src.split("/").pop()?.split("?")[0]
              }`}
              title="YouTube"
              frameBorder="0"
              allow="autoplay; encrypted-media"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-sky-500/80 p-2 rounded-full backdrop-blur-md transition-colors border border-white/10 z-20"
      >
        <ChevronLeft className="text-white w-5 h-5" />
      </button>
      <button
        onClick={() => setCurrent((p) => (p + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-sky-500/80 p-2 rounded-full backdrop-blur-md transition-colors border border-white/10 z-20"
      >
        <ChevronRight className="text-white w-5 h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === current ? "bg-sky-500 w-6" : "bg-white/30 w-1.5 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// --- SPARKLES CORE COMPONENT ---
const SparklesCore = (props: {
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
    minSize = 1.6,
    maxSize = 4.4,
    speed = 1,
    particleColor = "#ffffff",
    particleDensity = 100,
  } = props;
  const [init, setInit] = useState(false);
  
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <div className={cn("opacity-0 transition-opacity duration-1000", init && "opacity-100", className)}>
      {init && (
        <Particles
          id={id}
          className={cn("h-full w-full")}
          options={{
            background: { color: { value: background } },
            fullScreen: { enable: false, zIndex: 1 },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: false, mode: "repulse" },
                resize: { enable: true },
              },
              modes: {
                push: { quantity: 4 },
                repulse: { distance: 200, duration: 0.4 },
              },
            },
            particles: {
              bounce: { horizontal: { value: 1 }, vertical: { value: 1 } },
              color: { value: particleColor },
              move: {
                enable: true,
                speed: speed,
                direction: "none",
                random: false,
                straight: false,
                outModes: { default: "out" },
              },
              number: {
                density: { enable: true, width: 1920, height: 1080 },
                value: particleDensity,
              },
              opacity: {
                value: { min: 0.1, max: 0.5 },
                animation: { enable: true, speed: speed, sync: false },
              },
              shape: { type: "circle" },
              size: {
                value: { min: minSize, max: maxSize },
              },
            },
            detectRetina: true,
          } as any}
        />
      )}
    </div>
  );
};

// --- MAIN HERO SHOP COMPONENT ---
type HeroShopProps = {
  onScrollToProducts?: () => void;
};

export default function HeroShop({ onScrollToProducts }: HeroShopProps) {
  const {
    state: { hero },
  } = useShop();

  const fallbackScroll = () => {
    const el = document.getElementById("products-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToProducts = onScrollToProducts || fallbackScroll;

  // Construct slides from Shop Context + Defaults to make the carousel active
  const carouselSlides: Slide[] = [
    {
      type: "image",
      src: hero.featuredImageUrl || "https://images.pexels.com/photos/7671169/pexels-photo-7671169.jpeg",
      title: hero.featuredTitle,
    },
    {
      type: "video",
      src: "/newhero.mp4", // Using your asset
    },
    {
      type: "image",
      src: "/bullmoneyvantage.png", // Using your asset
    },
    {
       type: "youtube", 
       src: "https://www.youtube.com/watch?v=wWB_SeA15dU" 
    }
  ];

  return (
    <section
    
      // Changed bg to black
      className="relative overflow-hidden flex items-center justify-center px-6 py-20 sm:py-28 bg-black"
    >
      {/* --- SPARKLES BACKGROUND --- */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <SparklesCore
          id="hero-sparkles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={50}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Background Ambience (Subtle Gradients over black) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,#1e293b_0%,transparent_45%,transparent_100%)] opacity-40" />
      
      {/* Glow orbs */}
      <motion.div
        className="pointer-events-none absolute -top-24 -left-10 h-72 w-72 rounded-full bg-blue-900/20 blur-[100px]"
        animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 8 }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-900/20 blur-[100px]"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 10 }}
      />

      <div className="relative z-10 max-w-7xl w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* --- LEFT CONTENT --- */}
        <div className="flex flex-col items-start text-left">
          {!!hero.badge && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-900/10 border border-sky-900/30 backdrop-blur-sm mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-900 animate-pulse"/>
              <span className="text-sky-700 text-xs font-bold tracking-widest uppercase">
                {hero.badge}
              </span>
            </motion.div>
          )}

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight"
          >
            {hero.title}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <button
              onClick={scrollToProducts}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm hover:shadow-[0_0_25px_rgba(14,165,233,0.4)] transition-all transform hover:scale-105"
            >
              {hero.primaryCtaLabel || "Shop Now"}
            </button>

            {!!hero.secondaryCtaLabel && (
              <button
                onClick={scrollToProducts}
                className="px-8 py-3.5 rounded-full border border-neutral-800 bg-neutral-900/50 text-white font-bold text-sm hover:border-sky-500 hover:text-sky-400 transition-all"
              >
                {hero.secondaryCtaLabel}
              </button>
            )}
          </motion.div>

          {/* Trust/Stats Small Row */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 pt-6 border-t border-white/5 w-full flex gap-8"
          >
             <div>
                <p className="text-2xl font-bold text-white">2.5k+</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Traders</p>
             </div>
             <div>
                <p className="text-2xl font-bold text-white">4.9/5</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Rating</p>
             </div>
          </motion.div>
        </div>

        {/* --- RIGHT: 3D MEDIA CAROUSEL --- */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative group"
        >
          {/* Decorative glow behind carousel */}
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-[34px] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000" />
          
          <div className="relative">
             <div className="absolute -top-4 -right-4 z-20">
                <span className="px-4 py-1.5 bg-sky-500 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg rotate-3 border border-sky-400">
                  {hero.featuredTagLabel || "New Drop"}
                </span>
             </div>
             
             {/* The Integrated Scroll Component */}
             <MediaCarousel slides={carouselSlides} />

             {/* Caption Overlay */}
             <div className="mt-4 flex items-center justify-between px-2">
                <div>
                   <h3 className="text-lg font-bold text-white">{hero.featuredTitle}</h3>
                   <p className="text-xs text-neutral-400">{hero.featuredSubtitle}</p>
                </div>
                <div className="text-right">
                   <p className="text-xl font-bold text-sky-400">{hero.featuredPriceLabel}</p>
                   <p className="text-[10px] text-neutral-500 uppercase">{hero.featuredNote}</p>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
      
    </section>
  );
}