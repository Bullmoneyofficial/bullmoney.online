"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export interface TargetCursorProps {
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  targetSelector?: string;
}

export const TargetCursor: React.FC<TargetCursorProps> = ({
  spinDuration = 2,
  hideDefaultCursor = true,
  targetSelector = "a, button",
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches(targetSelector)) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches(targetSelector)) {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    if (hideDefaultCursor) {
      document.body.style.cursor = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      if (hideDefaultCursor) {
        document.body.style.cursor = "auto";
      }
    };
  }, [hideDefaultCursor, targetSelector]);

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999] mix-blend-difference"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <motion.div
        animate={{
          scale: isHovering ? 1.5 : 1,
          rotate: 360,
        }}
        transition={{
          scale: { duration: 0.3 },
          rotate: { duration: spinDuration, repeat: Infinity, ease: "linear" },
        }}
        className="w-8 h-8 border-2 border-white rounded-full"
      />
    </motion.div>
  );
};

export default TargetCursor;
