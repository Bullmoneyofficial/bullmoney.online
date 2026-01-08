"use client";

import React, { useState, useEffect, useRef } from 'react';

interface MobileScrollIndicatorProps {
  scrollContainerRef: React.RefObject<HTMLElement>;
  accentColor?: string;
  position?: 'right' | 'left';
  showOnDesktop?: boolean;
}

/**
 * MobileScrollIndicator - Apple-style glowing scroll indicator
 * Shows scroll position with a glowing blue bar when held
 */
export const MobileScrollIndicator: React.FC<MobileScrollIndicatorProps> = ({
  scrollContainerRef,
  accentColor = '#3b82f6',
  position = 'right',
  showOnDesktop = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // Update scroll percentage with RAF for performance
  const updateScrollPercentage = () => {
    if (!scrollContainerRef.current) return;

    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use RAF for smooth 60fps updates
    rafRef.current = requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      setScrollPercentage(Math.min(Math.max(percentage, 0), 100));
    });
  };

  // Show indicator temporarily
  const showIndicator = () => {
    setIsVisible(true);

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      if (!isHolding && !isDragging) {
        setIsVisible(false);
      }
    }, 2000);
  };

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollPercentage();
      showIndicator();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Initial update
    updateScrollPercentage();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scrollContainerRef, isHolding, isDragging]);

  // Handle touch/mouse drag on indicator
  const handleDragStart = (_clientY: number) => {
    setIsDragging(true);
    setIsHolding(true);
    setIsVisible(true);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging || !indicatorRef.current || !scrollContainerRef.current) return;

    // Use RAF for smooth dragging at 60fps
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!indicatorRef.current || !scrollContainerRef.current) return;

      const indicator = indicatorRef.current;
      const container = scrollContainerRef.current;
      const rect = indicator.getBoundingClientRect();

      // Calculate position relative to indicator track
      const relativeY = clientY - rect.top;
      const percentage = Math.min(Math.max(relativeY / rect.height, 0), 1) * 100;

      // Scroll container to match
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const targetScroll = (percentage / 100) * scrollHeight;

      container.scrollTo({
        top: targetScroll,
        behavior: 'auto'
      });
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsHolding(false);

    // Hide after delay
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      handleDragStart(touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      handleDragMove(touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Hide on desktop unless specified
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (!isMobile && !showOnDesktop) return null;

  return (
    <div
      ref={indicatorRef}
      className={`
        fixed ${position === 'right' ? 'right-2' : 'left-2'} top-20 bottom-20 z-[200000]
        w-1.5 rounded-full
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${isDragging ? 'w-3' : 'w-1.5'}
      `}
      style={{
        background: `linear-gradient(180deg,
          ${accentColor}10 0%,
          ${accentColor}20 ${scrollPercentage}%,
          ${accentColor}10 ${scrollPercentage}%,
          transparent 100%
        )`,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Thumb */}
      <div
        className={`
          absolute ${position === 'right' ? 'right-0' : 'left-0'}
          rounded-full transition-all duration-200
          ${isHolding || isDragging ? 'w-6 -mr-2.5' : 'w-1.5'}
        `}
        style={{
          top: `${scrollPercentage}%`,
          height: isHolding || isDragging ? '60px' : '40px',
          transform: 'translateY(-50%)',
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
          boxShadow: isHolding || isDragging
            ? `0 0 30px ${accentColor}, 0 0 60px ${accentColor}88, 0 4px 20px rgba(0,0,0,0.5)`
            : `0 0 15px ${accentColor}88, 0 2px 10px rgba(0,0,0,0.3)`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Glow effect when holding */}
        {(isHolding || isDragging) && (
          <>
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle, ${accentColor}88, transparent 70%)`,
                filter: 'blur(10px)'
              }}
            />
            {/* Page number indicator */}
            <div
              className="absolute left-full ml-4 top-1/2 -translate-y-1/2
                        px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-sm
                        border border-white/20 whitespace-nowrap"
              style={{
                boxShadow: `0 4px 20px ${accentColor}40`
              }}
            >
              <span className="text-xs font-semibold text-white">
                {Math.round(scrollPercentage)}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Touch target area (invisible) */}
      <div
        className="absolute inset-y-0 -inset-x-4"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export default MobileScrollIndicator;
