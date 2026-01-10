"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SparklesProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  particleColor?: string;
}

export const SparklesCore = ({
  children,
  className = "",
  id,
  background,
  minSize,
  maxSize,
  particleDensity,
  particleColor
}: SparklesProps) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

export default SparklesCore;
