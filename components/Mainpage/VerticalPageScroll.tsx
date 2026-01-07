"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VerticalPageScrollProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  accentColor?: string;
  disabled?: boolean;
}

export const VerticalPageScroll: React.FC<VerticalPageScrollProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  accentColor = '#3b82f6',
  disabled = false
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [holdPosition, setHoldPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  const handleHoldStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;

    setIsHolding(true);
    holdStartTimeRef.current = Date.now();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relativeY = clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, relativeY / rect.height));

    setHoldPosition(percentage);

    if (navigator.vibrate) navigator.vibrate(10);
  }, [disabled]);

  const handleHoldMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isHolding || disabled) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relativeY = clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, relativeY / rect.height));

    setHoldPosition(percentage);
  }, [isHolding, disabled]);

  const handleHoldEnd = useCallback(() => {
    const holdDuration = Date.now() - holdStartTimeRef.current;

    // If held for less than 200ms, treat as a tap
    if (holdDuration < 200) {
      const targetPage = Math.round(holdPosition * (totalPages - 1)) + 1;
      onPageChange(targetPage);
      if (navigator.vibrate) navigator.vibrate(15);
    }

    setIsHolding(false);
    setIsScrolling(false);

    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, [holdPosition, totalPages, onPageChange]);

  // Auto-scroll when holding
  useEffect(() => {
    if (isHolding && !disabled) {
      const holdDuration = Date.now() - holdStartTimeRef.current;

      // Start auto-scroll after 200ms hold
      if (holdDuration >= 200) {
        setIsScrolling(true);

        scrollIntervalRef.current = setInterval(() => {
          const targetPage = Math.round(holdPosition * (totalPages - 1)) + 1;
          if (targetPage !== currentPage) {
            onPageChange(targetPage);
            if (navigator.vibrate) navigator.vibrate(5);
          }
        }, 150);
      }

      return () => {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
        }
      };
    }
  }, [isHolding, holdPosition, currentPage, totalPages, onPageChange, disabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Global event listeners for hold
  useEffect(() => {
    if (isHolding) {
      const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
        handleHoldMove(e as any);
      };
      const handleGlobalEnd = () => {
        handleHoldEnd();
      };

      window.addEventListener('touchmove', handleGlobalMove, { passive: true });
      window.addEventListener('touchend', handleGlobalEnd);
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);

      return () => {
        window.removeEventListener('touchmove', handleGlobalMove);
        window.removeEventListener('touchend', handleGlobalEnd);
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalEnd);
      };
    }
  }, [isHolding, handleHoldMove, handleHoldEnd]);

  const dotSize = (index: number) => {
    if (index === currentPage - 1) return 'w-3 h-3';
    return 'w-2 h-2';
  };

  return (
    <div
      ref={containerRef}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[250] pointer-events-auto"
      style={{
        right: 'max(0.5rem, env(safe-area-inset-right, 0px))',
      }}
      onTouchStart={handleHoldStart}
      onMouseDown={handleHoldStart}
    >
      <motion.div
        className={`
          relative rounded-full border border-white/20
          backdrop-blur-xl shadow-2xl
          flex flex-col items-center gap-2 py-4 px-2
          transition-all duration-300
          ${isHolding ? 'bg-black/90 scale-110' : 'bg-black/60'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        style={{
          height: 'min(60vh, 400px)',
          width: '40px',
          boxShadow: isHolding ? `0 0 30px ${accentColor}60` : '0 10px 30px rgba(0,0,0,0.3)',
        }}
      >
        {/* Hold Indicator */}
        <AnimatePresence>
          {isScrolling && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-black/80 border border-white/20 backdrop-blur-xl"
            >
              <div className="text-[10px] font-bold text-white whitespace-nowrap">
                Scrolling
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Dots */}
        <div className="flex-1 flex flex-col justify-center items-center gap-2 relative">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page, index) => (
            <button
              key={page}
              onClick={() => {
                if (!disabled) {
                  onPageChange(page);
                  if (navigator.vibrate) navigator.vibrate(10);
                }
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isHolding) {
                  e.currentTarget.style.transform = 'scale(1.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
              }}
              className={`
                rounded-full transition-all duration-300
                ${dotSize(index)}
                ${disabled ? 'cursor-not-allowed' : 'hover:scale-125 active:scale-90'}
              `}
              style={{
                backgroundColor: page === currentPage ? accentColor : 'rgba(255,255,255,0.3)',
                boxShadow: page === currentPage ? `0 0 12px ${accentColor}` : 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
              aria-label={`Go to page ${page}`}
            />
          ))}

          {/* Hold Position Indicator */}
          <AnimatePresence>
            {isHolding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 right-0 h-1 rounded-full"
                style={{
                  backgroundColor: accentColor,
                  top: `${holdPosition * 100}%`,
                  boxShadow: `0 0 10px ${accentColor}`,
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        {!isHolding && (
          <div className="absolute -left-24 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-black/60 border border-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="text-[9px] font-semibold text-white/80 whitespace-nowrap">
              Tap or Hold to Scroll
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerticalPageScroll;
