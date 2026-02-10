"use client";
import React, { useState, useEffect, useRef } from "react";

import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

// Global registry for auto-highlight rotation (mobile + desktop)
let highlightInstances: Set<(active: boolean) => void> = new Set();
let highlightRotationStarted = false;

function startHighlightRotation() {
  if (highlightRotationStarted) return;
  highlightRotationStarted = true;

  const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 768;

  let timer: ReturnType<typeof setTimeout> | null = null;

  const rotate = () => {
    if (highlightInstances.size === 0) {
      timer = setTimeout(rotate, 1000);
      return;
    }

    const arr = Array.from(highlightInstances);
    // Desktop: highlight 2-4 random cards; Mobile: 1-2
    const maxCount = isDesktop() ? Math.min(arr.length, 2 + Math.floor(Math.random() * 3)) : Math.min(arr.length, Math.random() < 0.5 ? 1 : 2);
    const picked = new Set<number>();
    while (picked.size < maxCount) {
      picked.add(Math.floor(Math.random() * arr.length));
    }

    // Deactivate all, then activate picked
    arr.forEach((fn) => fn(false));
    picked.forEach((idx) => arr[idx](true));

    // Hold highlight for 1.5-3s then rotate
    const holdTime = 1500 + Math.random() * 1500;
    timer = setTimeout(() => {
      picked.forEach((idx) => arr[idx]?.(false));
      setTimeout(rotate, 300 + Math.random() * 500);
    }, holdTime);
  };

  // Start after a short delay
  setTimeout(rotate, 500);
}

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [autoActive, setAutoActive] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  // Register for auto-highlight rotation (mobile + desktop)
  useEffect(() => {
    const setter = (active: boolean) => setAutoActive(active);
    highlightInstances.add(setter);
    startHighlightRotation();
    return () => { highlightInstances.delete(setter); };
  }, []); 

  const isHighlighted = hovered || autoActive;

  const rotateDirection = (currentDirection: Direction): Direction => {
    const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
    const currentIndex = directions.indexOf(currentDirection);
    const nextIndex = clockwise
      ? (currentIndex - 1 + directions.length) % directions.length
      : (currentIndex + 1) % directions.length;
    return directions[nextIndex];
  };

  const movingMap: Record<Direction, string> = {
    TOP: "radial-gradient(20.7% 50% at 50% 0%, rgba(50,117,248,0.7) 0%, rgba(50,117,248,0) 100%)",
    LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, rgba(50,117,248,0.7) 0%, rgba(50,117,248,0) 100%)",
    BOTTOM:
      "radial-gradient(20.7% 50% at 50% 100%, rgba(50,117,248,0.7) 0%, rgba(50,117,248,0) 100%)",
    RIGHT:
      "radial-gradient(16.2% 41.199999999999996% at 100% 50%, rgba(50,117,248,0.7) 0%, rgba(50,117,248,0) 100%)",
  };

  const highlight =
    "radial-gradient(75% 181.15942028985506% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)";

  useEffect(() => {
    if (!isHighlighted) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [isHighlighted]);
  
  const Component = Tag as any;
  return (
    <Component
      onMouseEnter={(event: React.MouseEvent<HTMLDivElement>) => {
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex rounded-full border  content-center bg-black/20 hover:bg-black/10 transition duration-500 dark:bg-white/20 items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "w-auto text-white px-4 py-2 rounded-[inherit]",
          className
        )}
        style={{ position: 'relative', zIndex: 20 }}
      >
        {children}
      </div>
      <motion.div
        className={cn(
          "flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit]"
        )}
        style={{
          filter: "blur(3px)",
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: isHighlighted
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: "linear", duration: duration ?? 1 }}
      />
      <div className="bg-black/80 absolute z-1 flex-none inset-[2px] rounded-[inherit]" />
    </Component>
  );
}
