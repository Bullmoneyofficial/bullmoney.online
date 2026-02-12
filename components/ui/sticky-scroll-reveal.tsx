"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import Image from "next/image";
// cobe dynamically imported inside globe components

// Mini Globe for sticky scroll right panel
const MiniGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;
    let globe: any = null;
    let canceled = false;

    import("cobe").then(({ default: createGlobe }) => {
      if (canceled || !canvasRef.current) return;
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: 400,
        height: 400,
        phi: 0,
        theta: 0,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 8000,
        mapBrightness: 6,
        baseColor: [1, 1, 1],
        markerColor: [1, 1, 1],
        glowColor: [1, 1, 1],
        markers: [
          { location: [37.7595, -122.4367], size: 0.03 },
          { location: [40.7128, -74.006], size: 0.1 },
          { location: [51.5074, -0.1278], size: 0.08 },
          { location: [35.6762, 139.6503], size: 0.07 },
        ],
        onRender: (state) => {
          state.phi = phi;
          phi += 0.003;
        },
      });
    });

    return () => {
      canceled = true;
      if (globe) globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 200, height: 200, maxWidth: "100%", aspectRatio: 1 }}
    />
  );
};

// Background Globe for signup section - large and behind text
const BackgroundGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;
    let globe: any = null;
    let canceled = false;

    import("cobe").then(({ default: createGlobe }) => {
      if (canceled || !canvasRef.current) return;
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: 1000,
      height: 1000,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 12000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: [1, 1, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
        { location: [51.5074, -0.1278], size: 0.08 },
        { location: [35.6762, 139.6503], size: 0.07 },
        { location: [-33.8688, 151.2093], size: 0.05 },
        { location: [1.3521, 103.8198], size: 0.06 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.003;
      },
    });
    });

    return () => {
      canceled = true;
      if (globe) globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 500, height: 500, maxWidth: "100%", aspectRatio: 1 }}
    />
  );
};

const backgroundColors = [
  "#000000", // black
  "#0a0a0a", // near-black
  "#0f0f0f", // dark
  "#000000", // black
  "#0a0a0a", // near-black
];

export const StickyScroll = ({
  content,
  contentClassName,
  onSignupClick,
}: {
  content: {
    title: string;
    description: string;
    logo?: string;
    content?: React.ReactNode | string | any;
  }[];
  contentClassName?: string;
  onSignupClick?: () => void;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0,
    );
    setActiveCard(closestBreakpointIndex);
  });

  return (
    <motion.div
      animate={{
        backgroundColor: backgroundColors[activeCard % backgroundColors.length],
      }}
      className="relative flex h-[40rem] justify-between gap-6 lg:gap-10 overflow-y-auto rounded-2xl p-6 lg:p-10 border border-white/10"
      ref={ref}
    >
      {/* Left side - Text items scroll, user scrolls through them */}
      <div className="div relative flex min-w-0 flex-1 items-start px-2 lg:px-4">
        <div className="max-w-xl">
          {content.map((item, index) => (
            <div key={item.title + index} className="my-20 relative">
              {/* Background globe for signup section */}
              {item.content === "signup" && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: activeCard === index ? 0.4 : 0.1 }}
                  className="absolute -top-20 -left-20 z-0 pointer-events-none"
                >
                  <BackgroundGlobe />
                </motion.div>
              )}
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                className="text-3xl font-black text-white uppercase tracking-tight relative z-10"
                style={{ fontFamily: "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif" }}
              >
                {item.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                className="text-lg mt-6 max-w-md text-white/70 leading-relaxed relative z-10"
              >
                {item.description}
              </motion.p>
              {/* Show logo for non-signup content */}
              {item.content !== "signup" && item.logo && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: activeCard === index ? 1 : 0.3 }}
                  className="mt-6 w-28 h-28 rounded-2xl overflow-hidden bg-white/10 p-3 border border-white/20 relative z-10"
                >
                  <Image
                    src={item.logo}
                    alt={item.title}
                    width={112}
                    height={112}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              )}
            </div>
          ))}
          <div className="h-40" />
        </div>
      </div>
      
      {/* Right side - Content panel is sticky */}
      <div
        className={cn(
          "sticky top-6 hidden h-80 w-80 overflow-hidden rounded-2xl bg-black md:block lg:top-10 lg:w-96 border border-white/10 shrink-0",
          contentClassName,
        )}
      >
        {content[activeCard].content === "signup" ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-black rounded-2xl relative overflow-hidden">
            {/* Globe background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-60">
              <MiniGlobe />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
            {/* Content overlay */}
            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <span className="text-2xl font-black text-white uppercase tracking-tight mb-1" style={{ fontFamily: "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif" }}>
                10,000+ TRADERS
              </span>
              <span className="text-white/60 text-xs mb-4">Join our global community</span>
              <button
                onClick={onSignupClick}
                className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-all hover:scale-105"
              >
                Join Free →
              </button>
            </div>
          </div>
        ) : (
          content[activeCard].content ?? null
        )}
      </div>
    </motion.div>
  );
};
