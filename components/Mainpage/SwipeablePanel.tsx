"use client";

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';

interface SwipeablePanelProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  position?: 'bottom' | 'top';
  maxHeight?: string;
  minHeight?: string;
  className?: string;
  accentColor?: string;
  onOpenChange?: (isOpen: boolean) => void;
  zIndex?: number;
}

/**
 * SwipeablePanel - Apple-style swipeable panel component
 * Works on both mobile and desktop with smooth animations
 */
export const SwipeablePanel: React.FC<SwipeablePanelProps> = ({
  children,
  title,
  icon,
  defaultOpen = false,
  open,
  position = 'bottom',
  maxHeight = '80vh',
  minHeight = '28px',
  className = '',
  accentColor = '#3b82f6',
  onOpenChange,
  zIndex
}) => {
  const isControlled = typeof open === 'boolean';
  const [isOpen, setIsOpen] = useState(isControlled ? open : defaultOpen);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState((isControlled ? open : defaultOpen) ? maxHeight : minHeight);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState(false);

  const toPx = (value: string) => {
    if (typeof window === 'undefined') return parseFloat(value) || 0;
    const v = value.trim();
    if (v.endsWith('vh')) return (window.innerHeight * parseFloat(v)) / 100;
    if (v.endsWith('vw')) return (window.innerWidth * parseFloat(v)) / 100;
    return parseFloat(v) || 0;
  };

  const isCollapsed = !isOpen && !isDragging;

  useEffect(() => {
    if (!isControlled) return;
    setIsOpen(open);
    setCurrentHeight(open ? maxHeight : minHeight);
  }, [isControlled, maxHeight, minHeight, open]);

  const toggleOpen = () => {
    const newState = !isOpen;
    if (!isControlled) setIsOpen(newState);
    setCurrentHeight(newState ? maxHeight : minHeight);
    onOpenChange?.(newState);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !panelRef.current) return;

    const currentY = e.touches[0].clientY;
    const deltaY = dragStartY - currentY;

    if (position === 'bottom') {
      // Dragging up = opening, dragging down = closing
      if (deltaY > 0 && !isOpen) {
        // Opening
        const newHeight = Math.min(
          toPx(minHeight) + deltaY,
          toPx(maxHeight)
        );
        setCurrentHeight(`${newHeight}px`);
      } else if (deltaY < 0 && isOpen) {
        // Closing
        const newHeight = Math.max(
          toPx(maxHeight) + deltaY,
          toPx(minHeight)
        );
        setCurrentHeight(`${newHeight}px`);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const currentHeightPx = toPx(currentHeight);
    const maxHeightPx = toPx(maxHeight);
    const minHeightPx = toPx(minHeight);
    const threshold = (maxHeightPx - minHeightPx) / 2;

    // Determine if we should snap open or closed
    if (currentHeightPx > minHeightPx + threshold) {
      if (!isControlled) setIsOpen(true);
      setCurrentHeight(maxHeight);
      onOpenChange?.(true);
    } else {
      if (!isControlled) setIsOpen(false);
      setCurrentHeight(minHeight);
      onOpenChange?.(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;

    const currentY = e.clientY;
    const deltaY = dragStartY - currentY;

    if (position === 'bottom') {
      if (deltaY > 0 && !isOpen) {
        const newHeight = Math.min(
          toPx(minHeight) + deltaY,
          toPx(maxHeight)
        );
        setCurrentHeight(`${newHeight}px`);
      } else if (deltaY < 0 && isOpen) {
        const newHeight = Math.max(
          toPx(maxHeight) + deltaY,
          toPx(minHeight)
        );
        setCurrentHeight(`${newHeight}px`);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const currentHeightPx = toPx(currentHeight);
    const maxHeightPx = toPx(maxHeight);
    const minHeightPx = toPx(minHeight);
    const threshold = (maxHeightPx - minHeightPx) / 2;

    if (currentHeightPx > minHeightPx + threshold) {
      if (!isControlled) setIsOpen(true);
      setCurrentHeight(maxHeight);
      onOpenChange?.(true);
    } else {
      if (!isControlled) setIsOpen(false);
      setCurrentHeight(minHeight);
      onOpenChange?.(false);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStartY]);

  // Discreet “peek” affordance on first visit
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'bm_control_center_peeked_v1';
    if (window.localStorage.getItem(key) === 'true') return;
    const t = window.setTimeout(() => {
      setPeek(true);
      window.setTimeout(() => {
        setPeek(false);
        window.localStorage.setItem(key, 'true');
      }, 1400);
    }, 1100);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      ref={panelRef}
      className={`fixed ${position === 'bottom' ? 'bottom-0' : 'top-0'} left-0 right-0 ${className}`}
      style={{
        height: currentHeight,
        transition: isDragging ? 'none' : 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex,
      }}
    >
      {/* Apple Glass Effect Background */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-2xl border-t border-white/10 transition-opacity duration-300"
        style={{
          opacity: isCollapsed ? 0.12 : 1,
          pointerEvents: isCollapsed ? 'none' : 'auto',
        }}
      />

      {/* Drag Handle */}
      <div
        className={`
          relative z-10 flex flex-col items-center justify-center py-2 cursor-grab active:cursor-grabbing pointer-events-auto
          ${isDragging ? 'bg-white/10' : 'hover:bg-white/5'}
          transition-colors
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={toggleOpen}
      >
        {/* Drag Indicator */}
        <div
          className="w-12 h-1.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: isDragging ? accentColor : 'rgba(255,255,255,0.3)',
            boxShadow: isDragging ? `0 0 20px ${accentColor}` : 'none',
            animation: isCollapsed && peek ? 'bmPeek 700ms ease-in-out 2' : undefined,
          }}
        />
        {isCollapsed && (
          <div className="mt-1 text-[10px] tracking-[0.28em] uppercase text-white/55">
            {title || 'Control Center'}
          </div>
        )}
      </div>

      {/* Header */}
      <div
        className={`relative z-10 px-6 pb-4 items-center justify-between cursor-pointer ${isOpen ? 'flex' : 'hidden'}`}
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <div style={{ color: accentColor }}>
                {icon}
              </div>
            </div>
          )}
          {title && (
            <h3 className="text-lg font-semibold text-white tracking-tight">
              {title}
            </h3>
          )}
        </div>

        <button
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          style={{ color: accentColor }}
        >
          {isOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
        </button>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className={`
          relative z-10 px-6 pb-6 overflow-y-auto overflow-x-hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        style={{
          maxHeight: `calc(${maxHeight} - 120px)`,
          scrollbarWidth: 'thin',
          scrollbarColor: `${accentColor} transparent`
        }}
      >
        {children}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: ${accentColor};
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: ${accentColor}dd;
        }
        @keyframes bmPeek {
          0% { transform: translateY(0); }
          45% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SwipeablePanel;
