"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

class Pixel {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSizeInteger: number;
  maxSize: number;
  delay: number;
  counter: number;
  counterStep: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;

  constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, x: number, y: number, color: string, speed: number, delay: number) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }
    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    }
    this.size -= 0.1;
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    if (this.isReverse) {
      this.size -= this.speed;
    } else {
      this.size += this.speed;
    }
  }
}

function getEffectiveSpeed(value: number, reducedMotion: boolean) {
  const min = 0;
  const max = 100;
  const throttle = 0.001;

  if (value <= min || reducedMotion) {
    return min;
  }
  if (value >= max) {
    return max * throttle;
  }
  return value * throttle;
}

const VARIANTS = {
  default: {
    activeColor: null,
    gap: 5,
    speed: 35,
    colors: "#f8fafc,#f1f5f9,#cbd5e1",
    noFocus: false,
  },
  blue: {
    activeColor: "#e0f2fe",
    gap: 10,
    speed: 25,
    colors: "#ffffff,#ffffff,#ffffff",
    noFocus: false,
  },
};

export interface PixelCardProps {
  variant?: keyof typeof VARIANTS;
  gap?: number;
  speed?: number;
  colors?: string;
  noFocus?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PixelCard = ({
  variant = "default",
  gap,
  speed,
  colors,
  noFocus,
  className = "",
  children,
}: PixelCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number | null>(null);
  const timePreviousRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const isMountedRef = useRef(true);
  const [isVisible, setIsVisible] = useState(false);

  const reducedMotion = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = useCallback(() => {
    if (!containerRef.current || !canvasRef.current || !isMountedRef.current) return;

    try {
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      if (width <= 0 || height <= 0) return;

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      canvasRef.current.width = width;
      canvasRef.current.height = height;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;

      const colorsArray = finalColors.split(",");
      const pxs = [] as Pixel[];
      const gapValue = Math.max(1, parseInt(finalGap.toString(), 10));

      for (let x = 0; x < width; x += gapValue) {
        for (let y = 0; y < height; y += gapValue) {
          const color = colorsArray[Math.floor(Math.random() * colorsArray.length)] || "#FFFFFF";
          const dx = x - width / 2;
          const dy = y - height / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const delay = reducedMotion ? 0 : distance;
          pxs.push(new Pixel(canvasRef.current, ctx, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotion), delay));
        }
      }
      pixelsRef.current = pxs;
    } catch (error) {
      console.warn("PixelCard initPixels error:", error);
    }
  }, [finalColors, finalGap, finalSpeed, reducedMotion]);

  const doAnimate = useCallback(
    (fnName: keyof Pixel) => {
      if (!isMountedRef.current) return;
      animationRef.current = requestAnimationFrame(() => doAnimate(fnName));

      try {
        const timeNow = performance.now();
        const timePassed = timeNow - timePreviousRef.current;
        const timeInterval = 1000 / 60;
        if (timePassed < timeInterval) return;
        timePreviousRef.current = timeNow - (timePassed % timeInterval);

        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        let allIdle = true;
        for (let i = 0; i < pixelsRef.current.length; i++) {
          const pixel = pixelsRef.current[i];
          if (!pixel) continue;
          // @ts-ignore
          pixel[fnName]();
          if (!pixel.isIdle) {
            allIdle = false;
          }
        }
        if (allIdle && animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      } catch (error) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
    },
    []
  );

  const handleAnimation = useCallback(
    (name: keyof Pixel) => {
      if (!isMountedRef.current) return;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(() => doAnimate(name));
    },
    [doAnimate]
  );

  const onMouseEnter = () => handleAnimation("appear");
  const onMouseLeave = () => handleAnimation("disappear");
  const onFocus: React.FocusEventHandler<HTMLDivElement> = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    handleAnimation("appear");
  };
  const onBlur: React.FocusEventHandler<HTMLDivElement> = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    handleAnimation("disappear");
  };

  useEffect(() => {
    isMountedRef.current = true;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => setIsVisible(entry.isIntersecting));
    }, { rootMargin: "50px", threshold: 0 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      isMountedRef.current = false;
      observer.disconnect();
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      initPixels();
    }

    const resizeObserver = new ResizeObserver(() => {
      if (isVisible && isMountedRef.current) {
        initPixels();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [isVisible, initPixels]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={finalNoFocus ? undefined : onFocus}
      onBlur={finalNoFocus ? undefined : onBlur}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      {isVisible && <canvas className="absolute inset-0 z-0 h-full w-full pointer-events-none" ref={canvasRef} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default PixelCard;
