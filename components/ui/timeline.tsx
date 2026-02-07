"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

interface TimelineEntry {
  title: React.ReactNode;
  content: React.ReactNode;
}

interface TimelineProps {
  data: TimelineEntry[];
  /** Optional header title */
  headerTitle?: string;
  /** Optional header subtitle */
  headerSubtitle?: string;
  /** Hide the header section */
  hideHeader?: boolean;
}

export const Timeline = ({ data, headerTitle, headerSubtitle, hideHeader = false }: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const currentHeightRef = useRef(0);
  const targetHeightRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Calculate height after mount and on data change
  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        setHeight(ref.current.scrollHeight);
      }
    };
    const timer = setTimeout(updateHeight, 100);
    window.addEventListener('resize', updateHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateHeight);
    };
  }, [data]);

  // Scroll-driven progress — throttled to rAF to avoid layout thrash
  const scrollRafRef = useRef<number | null>(null);
  const updateProgress = useCallback(() => {
    if (!containerRef.current || !lineRef.current || height === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    const anchorY = windowH * 0.6;
    const contentTop = rect.top;
    const contentHeight = rect.bottom - contentTop;
    const anchorProgress = anchorY - contentTop;
    const progress = Math.min(1, Math.max(0, anchorProgress / contentHeight));
    targetHeightRef.current = Math.round(progress * height);
  }, [height]);

  // Smooth animation loop with lerping
  useEffect(() => {
    const animate = () => {
      if (!lineRef.current) return;
      const current = currentHeightRef.current;
      const target = targetHeightRef.current;
      const lerp = 0.15;
      const diff = target - current;
      if (Math.abs(diff) > 0.5) {
        const newHeight = current + diff * lerp;
        currentHeightRef.current = newHeight;
        lineRef.current.style.height = `${Math.round(newHeight)}px`;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    updateProgress();
    const onScroll = () => {
      // Coalesce scroll events into a single rAF
      if (!scrollRafRef.current) {
        scrollRafRef.current = requestAnimationFrame(() => {
          updateProgress();
          scrollRafRef.current = null;
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [updateProgress]);

  return (
    <div
      className="w-full bg-black font-sans px-3 md:px-10"
      ref={containerRef}
    >
      {!hideHeader && (
        <div className="w-full mx-auto py-4 md:py-12 px-0 md:px-8 lg:px-10">
          <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Focus</p>
          <h2 className="text-base md:text-3xl mb-1 text-white font-bold max-w-4xl">
            {headerTitle || "Featured Products"}
          </h2>
          {headerSubtitle && (
            <p className="text-neutral-400 text-xs md:text-base max-w-sm">
              {headerSubtitle}
            </p>
          )}
        </div>
      )}

      <div ref={ref} className="relative w-full mx-auto pb-6 md:pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="relative flex pt-6 md:pt-16"
          >
            {/* Dot */}
            <div className="absolute left-2 md:left-3 top-7 md:top-[72px] w-6 md:w-10 flex items-center justify-center z-10">
              <div 
                className="h-2.5 w-2.5 md:h-4 md:w-4 rounded-full border border-cyan-400/60" 
                style={{ 
                  background: 'linear-gradient(135deg, #0070f3 0%, #00c6ff 100%)',
                  boxShadow: '0 0 8px rgba(0, 112, 243, 0.5)'
                }}
              />
            </div>

            {/* Content */}
            <div className="pl-10 md:pl-20 pr-2 md:pr-4 w-full">
              <h3 className="text-sm md:text-2xl font-bold text-neutral-500 mb-1 md:mb-2">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}
        {/* Background track line - dimmer ahead portion */}
        <div
          style={{ height: height > 0 ? `${height}px` : '100%' }}
          className="absolute md:left-8 left-5 top-0 w-[2px] md:w-[3px] bg-neutral-800/30 rounded-full"
        />
        {/* Animated progress line with subtle glow */}
        <div
          ref={lineRef}
          className="absolute md:left-8 left-5 top-0 w-[3px] md:w-[4px] rounded-full"
          style={{ 
            height: 0,
            background: 'linear-gradient(180deg, rgba(0, 112, 243, 0.2) 0%, #0070f3 40%, #00c6ff 100%)',
            boxShadow: '0 0 12px rgba(0, 112, 243, 0.6), 0 0 30px rgba(0, 198, 255, 0.3)',
            willChange: 'height',
            transform: 'translateZ(0)'
          }}
        />
      </div>
    </div>
  );
};
