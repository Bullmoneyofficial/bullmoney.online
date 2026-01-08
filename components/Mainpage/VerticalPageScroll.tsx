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
  // BUG FIX #13: Detect if desktop for keyboard hints
  const [isDesktop, setIsDesktop] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  // BUG FIX #13: Detect desktop vs mobile
  useEffect(() => {
    const checkDevice = () => {
      const isDesktopDevice = window.innerWidth >= 1024 && !('ontouchstart' in window);
      setIsDesktop(isDesktopDevice);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Hide hint after first interaction or 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
      // BUG FIX #13: Show keyboard hint on desktop after main hint fades
      if (isDesktop) {
        setTimeout(() => setShowKeyboardHint(true), 500);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isDesktop]);

  // BUG FIX #13: Add keyboard navigation for desktop (Arrow keys, Page Up/Down)
  useEffect(() => {
    if (!isDesktop || disabled) return;

    const handleKeyboard = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          if (currentPage > 1) {
            onPageChange(currentPage - 1);
            if (navigator.vibrate) navigator.vibrate(10);
            setShowKeyboardHint(false); // Hide hint after first use
          }
          break;
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
            if (navigator.vibrate) navigator.vibrate(10);
            setShowKeyboardHint(false); // Hide hint after first use
          }
          break;
        case 'Home':
          e.preventDefault();
          onPageChange(1);
          setShowKeyboardHint(false);
          break;
        case 'End':
          e.preventDefault();
          onPageChange(totalPages);
          setShowKeyboardHint(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isDesktop, disabled, currentPage, totalPages, onPageChange]);

  const handleHoldStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;

    setShowHint(false); // Hide hint on first interaction
    setIsHolding(true);
    holdStartTimeRef.current = Date.now();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientY === undefined) return;
    const relativeY = clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, relativeY / rect.height));

    setHoldPosition(percentage);

    if (navigator.vibrate) navigator.vibrate(10);
  }, [disabled]);

  const handleHoldMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isHolding || disabled) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientY === undefined) return;
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

  // BUG FIX #8: Auto-scroll when holding - properly clean up interval
  useEffect(() => {
    // Always clean up any existing interval first
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

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
    }

    // BUG FIX #8: Always clean up interval on effect cleanup
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isHolding, holdPosition, currentPage, totalPages, onPageChange, disabled]);

  // BUG FIX #8: Additional cleanup on unmount as safety net
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
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
    return undefined;
  }, [isHolding, handleHoldMove, handleHoldEnd]);

  // BUG FIX #13: Adaptive sizing based on number of pages AND device
  const getScrollbarHeight = () => {
    // Mobile-first: smaller, more compact
    if (!isDesktop) {
      if (totalPages <= 5) return 'min(45vh, 240px)';
      if (totalPages <= 7) return 'min(40vh, 220px)';
      if (totalPages <= 10) return 'min(35vh, 200px)';
      return 'min(32vh, 180px)';
    }
    // Desktop: larger, more comfortable
    if (totalPages <= 5) return 'min(55vh, 320px)';
    if (totalPages <= 7) return 'min(50vh, 280px)';
    if (totalPages <= 10) return 'min(45vh, 250px)';
    return 'min(40vh, 220px)';
  };

  const getDotSize = (index: number) => {
    const baseSize = totalPages > 8 ? 1.5 : 2;
    const activeSize = totalPages > 8 ? 2 : 2.5;
    if (index === currentPage - 1) return `w-${activeSize} h-${activeSize}`;
    return `w-${baseSize} h-${baseSize}`;
  };

  const getGapSize = () => {
    if (totalPages > 10) return 'gap-1';
    if (totalPages > 7) return 'gap-1.5';
    return 'gap-2';
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
          className="absolute inset-[-1.5px] rounded-full opacity-60"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            background: `conic-gradient(from 90deg at 50% 50%, transparent 0%, ${accentColor} 50%, transparent 100%)`,
            filter: 'blur(3px)',
          }}
        />

        <motion.div
          className={`
            relative rounded-full border
            backdrop-blur-xl shadow-2xl
            flex flex-col items-center py-3 px-1.5
            transition-all duration-200
            ${isHolding ? 'bg-black/95 scale-105' : 'bg-black/75'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${getGapSize()}
          `}
          style={{
            height: getScrollbarHeight(),
            width: '36px',
            borderColor: isHolding ? accentColor : `${accentColor}30`,
            boxShadow: isHolding
              ? `0 0 30px ${accentColor}70, 0 0 60px ${accentColor}30, inset 0 0 15px ${accentColor}15`
              : `0 8px 30px rgba(0,0,0,0.6), inset 0 0 8px ${accentColor}08`,
          }}
        >
        {/* Scroll Up Arrow */}
        {/* BUG FIX #11: Fixed page navigation - should go to previous page, not -2 */}
        <motion.button
          onClick={() => {
            if (currentPage > 1) {
              onPageChange(currentPage - 1);
              if (navigator.vibrate) navigator.vibrate(10);
            }
          }}
          className="w-5 h-5 flex items-center justify-center rounded-full"
          style={{
            backgroundColor: currentPage === 1 ? `${accentColor}10` : `${accentColor}35`,
            opacity: currentPage === 1 ? 0.3 : 1,
            cursor: currentPage === 1 ? 'default' : 'pointer',
          }}
          whileHover={currentPage > 1 ? { scale: 1.3, backgroundColor: `${accentColor}50` } : {}}
          whileTap={currentPage > 1 ? { scale: 0.85 } : {}}
          disabled={currentPage === 1}
        >
          <ChevronUp
            size={12}
            style={{ color: currentPage === 1 ? '#444' : accentColor }}
          />
        </motion.button>

        {/* Hold Indicator */}
        <AnimatePresence>
          {isScrolling && (
            <motion.div
              initial={{ opacity: 0, x: -15, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -15, scale: 0.8 }}
              className="absolute -left-16 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded-lg border backdrop-blur-xl"
              style={{
                backgroundColor: 'rgba(0,0,0,0.95)',
                borderColor: accentColor,
                boxShadow: `0 0 15px ${accentColor}50`,
              }}
            >
              <div className="text-[10px] font-bold text-white whitespace-nowrap flex items-center gap-1.5">
                <Hand size={12} style={{ color: accentColor }} />
                Scroll
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Dots */}
        <div className={`flex-1 flex flex-col justify-center items-center relative ${getGapSize()}`}>
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
                rounded-full transition-all duration-200
                ${getDotSize(index)}
                ${disabled ? 'cursor-not-allowed' : 'hover:scale-150 active:scale-75'}
              `}
              style={{
                backgroundColor: page === currentPage ? accentColor : `${accentColor}40`,
                boxShadow: page === currentPage ? `0 0 10px ${accentColor}, 0 0 5px ${accentColor}` : `0 0 3px ${accentColor}30`,
                WebkitTapHighlightColor: 'transparent',
                border: page === currentPage ? `1px solid ${accentColor}` : `1px solid ${accentColor}20`,
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
                className="absolute left-0 right-0 h-1 rounded-full"
                style={{
                  backgroundColor: accentColor,
                  top: `${holdPosition * 100}%`,
                  boxShadow: `0 0 12px ${accentColor}, 0 0 24px ${accentColor}50`,
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Scroll Down Arrow */}
        {/* BUG FIX #11: Fixed page navigation - should go to next page, not current */}
        <motion.button
          onClick={() => {
            if (currentPage < totalPages) {
              onPageChange(currentPage + 1);
              if (navigator.vibrate) navigator.vibrate(10);
            }
          }}
          className="w-5 h-5 flex items-center justify-center rounded-full"
          style={{
            backgroundColor: currentPage === totalPages ? `${accentColor}10` : `${accentColor}35`,
            opacity: currentPage === totalPages ? 0.3 : 1,
            cursor: currentPage === totalPages ? 'default' : 'pointer',
          }}
          whileHover={currentPage < totalPages ? { scale: 1.3, backgroundColor: `${accentColor}50` } : {}}
          whileTap={currentPage < totalPages ? { scale: 0.85 } : {}}
          disabled={currentPage === totalPages}
        >
          <ChevronDown
            size={12}
            style={{ color: currentPage === totalPages ? '#444' : accentColor }}
          />
        </motion.button>

        {/* Touch Hint - Shows on first load (mobile/touch devices) */}
        <AnimatePresence>
          {showHint && !isHolding && !isDesktop && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -left-28 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg border backdrop-blur-xl pointer-events-none"
              style={{
                backgroundColor: 'rgba(0,0,0,0.95)',
                borderColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}30`,
                maxWidth: '140px',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Hand size={12} style={{ color: accentColor, flexShrink: 0 }} />
                <div className="text-[10px] font-bold text-white">Navigate</div>
              </div>
              <div className="text-[9px] text-white/60 leading-snug space-y-0.5">
                <div>• <span style={{ color: accentColor }}>Tap</span> dots</div>
                <div>• <span style={{ color: accentColor }}>Hold</span> & drag</div>
              </div>
              <motion.div
                className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
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

        {/* BUG FIX #13: Keyboard Hint - Desktop only */}
        <AnimatePresence>
          {showKeyboardHint && !isHolding && isDesktop && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.5 }}
              className="absolute -left-32 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg border backdrop-blur-xl pointer-events-none"
              style={{
                backgroundColor: 'rgba(0,0,0,0.95)',
                borderColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}30`,
                maxWidth: '160px',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="text-[10px] font-bold text-white">⌨️ Keyboard</div>
              </div>
              <div className="text-[9px] text-white/60 leading-snug space-y-0.5">
                <div>• <span style={{ color: accentColor }}>↑/↓</span> arrows</div>
                <div>• <span style={{ color: accentColor }}>PgUp/PgDn</span></div>
                <div>• <span style={{ color: accentColor }}>Home/End</span></div>
              </div>
              <motion.div
                className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
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
          className="absolute -left-12 top-2 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: `1px solid ${accentColor}30`,
          }}
        >
          <div className="text-[9px] font-bold whitespace-nowrap" style={{ color: accentColor }}>
            {currentPage}/{totalPages}
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default VerticalPageScroll;
