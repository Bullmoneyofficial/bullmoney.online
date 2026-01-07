"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Hand } from 'lucide-react';

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
  const [showHint, setShowHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  // Hide hint after first interaction or 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleHoldStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;

    setShowHint(false); // Hide hint on first interaction
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
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[250] pointer-events-auto group"
      style={{
        right: 'max(1rem, env(safe-area-inset-right, 0.5rem))',
      }}
      onTouchStart={handleHoldStart}
      onMouseDown={handleHoldStart}
    >
      {/* Shimmer Border Effect */}
      <div className="relative">
        <motion.div
          className="absolute inset-[-2px] rounded-full opacity-75"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            background: `conic-gradient(from 90deg at 50% 50%, transparent 0%, ${accentColor} 50%, transparent 100%)`,
            filter: 'blur(4px)',
          }}
        />

        <motion.div
          className={`
            relative rounded-full border-2
            backdrop-blur-xl shadow-2xl
            flex flex-col items-center gap-3 py-5 px-2.5
            transition-all duration-300
            ${isHolding ? 'bg-black/95 scale-110' : 'bg-black/70'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{
            height: 'min(65vh, 450px)',
            width: '48px',
            borderColor: isHolding ? accentColor : `${accentColor}40`,
            boxShadow: isHolding
              ? `0 0 40px ${accentColor}80, 0 0 80px ${accentColor}40, inset 0 0 20px ${accentColor}20`
              : `0 10px 40px rgba(0,0,0,0.5), inset 0 0 10px ${accentColor}10`,
          }}
        >
        {/* Scroll Up Arrow */}
        <motion.div
          className="w-6 h-6 flex items-center justify-center rounded-full mb-1"
          style={{
            backgroundColor: currentPage === 1 ? `${accentColor}20` : `${accentColor}40`,
            opacity: currentPage === 1 ? 0.3 : 1,
          }}
          whileHover={currentPage > 1 ? { scale: 1.2 } : {}}
          whileTap={currentPage > 1 ? { scale: 0.9 } : {}}
        >
          <ChevronUp
            size={14}
            style={{ color: currentPage === 1 ? '#666' : accentColor }}
          />
        </motion.div>

        {/* Hold Indicator */}
        <AnimatePresence>
          {isScrolling && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.8 }}
              className="absolute -left-20 top-1/2 -translate-y-1/2 px-3 py-2 rounded-full border-2 backdrop-blur-xl"
              style={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                borderColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}60`,
              }}
            >
              <div className="text-xs font-bold text-white whitespace-nowrap flex items-center gap-2">
                <Hand size={14} style={{ color: accentColor }} />
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-0 right-0 h-1.5 rounded-full"
                style={{
                  backgroundColor: accentColor,
                  top: `${holdPosition * 100}%`,
                  boxShadow: `0 0 15px ${accentColor}, 0 0 30px ${accentColor}60`,
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Scroll Down Arrow */}
        <motion.div
          className="w-6 h-6 flex items-center justify-center rounded-full mt-1"
          style={{
            backgroundColor: currentPage === totalPages ? `${accentColor}20` : `${accentColor}40`,
            opacity: currentPage === totalPages ? 0.3 : 1,
          }}
          whileHover={currentPage < totalPages ? { scale: 1.2 } : {}}
          whileTap={currentPage < totalPages ? { scale: 0.9 } : {}}
        >
          <ChevronDown
            size={14}
            style={{ color: currentPage === totalPages ? '#666' : accentColor }}
          />
        </motion.div>

        {/* Hint - Shows on first load */}
        <AnimatePresence>
          {showHint && !isHolding && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -left-32 top-1/2 -translate-y-1/2 px-4 py-3 rounded-xl border-2 backdrop-blur-xl pointer-events-none"
              style={{
                backgroundColor: 'rgba(0,0,0,0.95)',
                borderColor: accentColor,
                boxShadow: `0 0 30px ${accentColor}40`,
                maxWidth: '200px',
              }}
            >
              <div className="flex items-start gap-2 mb-2">
                <Hand size={16} style={{ color: accentColor, flexShrink: 0 }} />
                <div className="text-xs font-bold text-white">Scroll Navigation</div>
              </div>
              <div className="text-[10px] text-white/70 leading-relaxed space-y-1">
                <div>• <span style={{ color: accentColor }}>Tap</span> dots to jump</div>
                <div>• <span style={{ color: accentColor }}>Hold</span> to scroll</div>
                <div>• <span style={{ color: accentColor }}>Drag</span> for control</div>
              </div>
              <motion.div
                className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ backgroundColor: accentColor }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Counter */}
        <div
          className="absolute -left-14 top-4 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: `1px solid ${accentColor}40`,
          }}
        >
          <div className="text-[10px] font-bold whitespace-nowrap" style={{ color: accentColor }}>
            {currentPage}/{totalPages}
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default VerticalPageScroll;
