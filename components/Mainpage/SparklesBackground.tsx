// src/components/effects/SparklesBackground.tsx

"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";

// --- Sparkles Core Component ---
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


// --- Wrapper for the Full-Page Sparkles Background ---
const FullSparklesBackground = () => {
  return (
    <div className="absolute inset-0 z-10 h-full w-full pointer-events-none">
      <SparklesCore
        id="shop-fullpage-sparkles"
        background="transparent"
        minSize={1.6}
        maxSize={3.9}
        particleDensity={50}
        className="h-full w-full"
        particleColor="#FFFFFF"
      />
    </div>
  )
}

export default FullSparklesBackground;