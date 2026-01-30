"use client";

import React from "react";
import { motion } from "framer-motion";

export interface VorbProps {
  className?: string;
  size?: number;
  hoverIntensity?: number;
  rotateOnHover?: boolean;
  hue?: number;
  forceHoverState?: boolean;
  onButtonClick?: () => void;
  buttonLabel?: string;
}

export const Vorb = ({
  className = "",
  size = 100,
  hoverIntensity,
  rotateOnHover,
  hue,
  forceHoverState,
  onButtonClick,
  buttonLabel
}: VorbProps) => {
  return (
    <motion.div
      className={`rounded-full bg-gradient-to-br from-white to-white ${className}`}
      style={{ width: size, height: size }}
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

export default Vorb;
