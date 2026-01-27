"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* ============================================================
   🔵 EncryptedText Component
============================================================ */

export function EncryptedText({
  text,
  encryptedClassName = "text-neutral-500",
  revealedClassName = "text-white",
  revealDelayMs = 40,
}: {
  text: string;
  encryptedClassName?: string;
  revealedClassName?: string;
  revealDelayMs?: number;
}) {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    let interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, revealDelayMs);

    return () => clearInterval(interval);
  }, [text, revealDelayMs]);

  return (
    <span>
      {text.split("").map((char, i) => {
        const isRevealed = i < revealedCount;
        return (
          <span
            key={i}
            className={cn(isRevealed ? revealedClassName : encryptedClassName)}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

/* ============================================================
   🔮 CardSpotlight (3D interactive glow card)
============================================================ */

export function CardSpotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [0, 400], [10, -10]);
  const rotateY = useTransform(mouseX, [0, 400], [-10, 10]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;

    mouseX.set(e.clientX - bounds.left);
    mouseY.set(e.clientY - bounds.top);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-3xl p-6 bg-neutral-900/70 shadow-xl border border-white/10",
        "transition-all duration-300 hover:shadow-[0_0_45px_rgba(150,70,255,0.5)]",
        "overflow-hidden",
        className
      )}
    >
      {/* Spotlight Glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at center, rgba(150,70,255,0.35), transparent 70%)",
        }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ============================================================
   🟣 GlareCard (gradient sweep + glow)
============================================================ */

export function GlareCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 160, damping: 18 });
  const springY = useSpring(y, { stiffness: 160, damping: 18 });

  const rotateX = useTransform(springY, [0, 300], [8, -8]);
  const rotateY = useTransform(springX, [0, 300], [-8, 8]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;

    x.set(e.clientX - bounds.left);
    y.set(e.clientY - bounds.top);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-2xl p-6 bg-neutral-900/60 backdrop-blur-lg border border-white/10 shadow-2xl",
        "transition-all duration-300 hover:shadow-[0_0_70px_rgba(80,110,255,0.4)]",
        "overflow-hidden",
        className
      )}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(255,255,255,0.15), transparent 70%)",
        }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-70"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "linear",
        }}
        style={{
          background:
            "linear-gradient(135deg, rgba(150,70,255,0.25), rgba(0,150,255,0.25), rgba(255,255,255,0.1))",
          backgroundSize: "200% 200%",
        }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ============================================================
   🔥 MultiStepLoader (modal-style animated loader)
============================================================ */

export function MultiStepLoader({
  loading,
  loadingStates,
  duration = 2000,
}: {
  loading: boolean;
  loadingStates: { text: string }[];
  duration?: number;
}) {
  const [step, setStep] = useState(0);
  const safeLoadingStates = loadingStates.length
    ? loadingStates
    : [{ text: "Loading..." }];
  const totalSteps = safeLoadingStates.length;

  useEffect(() => {
    if (step > totalSteps - 1) {
      setStep(Math.max(0, totalSteps - 1));
    }
  }, [step, totalSteps]);

  useEffect(() => {
    if (!loading) {
      setStep(0);
      return;
    }

    if (totalSteps <= 1) {
      return;
    }

    let index = 0;

    const interval = setInterval(() => {
      index++;
      if (index >= totalSteps) {
        clearInterval(interval);
        return;
      }
      setStep(index);
    }, duration / totalSteps);

    return () => clearInterval(interval);
  }, [loading, duration, totalSteps]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="px-8 py-6 rounded-2xl bg-neutral-900/80 border border-white/10 shadow-2xl text-white text-lg font-medium"
          >
            {safeLoadingStates[step]?.text || "Loading..."}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
