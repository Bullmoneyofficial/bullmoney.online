"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

// type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };
const pad = (n: number) => n.toString().padStart(2, "0");

const Unit = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-20 h-24 bg-black text-white rounded-lg border border-white/30 overflow-hidden shadow-[0_0_10px_rgba(255,255,255,0.05)]">
      <motion.div
        key={value}
        initial={{ rotateX: 90, opacity: 0, transformOrigin: "top center" }}
        animate={{ rotateX: 0, opacity: 1 }}
        exit={{ rotateX: -90, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center text-4xl font-extrabold"
      >
        {value}
      </motion.div>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/20" />
    </div>
    <div className="mt-2 text-xs uppercase tracking-widest text-white/70">
      {label}
    </div>
  </div>
);

export const FlipCountdown = ({
  deadlineISO,
  onComplete,
}: {
  deadlineISO: string;
  onComplete?: () => void;
}) => {
  const target = useMemo(() => new Date(deadlineISO), [deadlineISO]);
  const [timeLeft, setTimeLeft] = useState(() => calc(target));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(calc(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  useEffect(() => {
    if (timeLeft.total <= 0 && onComplete) onComplete();
  }, [timeLeft, onComplete]);

  return (
    <div className="flex gap-4 justify-center">
      <Unit label="Days" value={pad(timeLeft.days)} />
      <Unit label="Hours" value={pad(timeLeft.hours)} />
      <Unit label="Minutes" value={pad(timeLeft.minutes)} />
      <Unit label="Seconds" value={pad(timeLeft.seconds)} />
    </div>
  );
};

function calc(target: Date) {
  const diff = target.getTime() - new Date().getTime();
  return {
    total: diff,
    days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
    hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
    minutes: Math.max(0, Math.floor((diff / (1000 * 60)) % 60)),
    seconds: Math.max(0, Math.floor((diff / 1000) % 60)),
  };
}
