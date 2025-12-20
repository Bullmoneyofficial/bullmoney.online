"use client";

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronUp, ChevronDown, GripHorizontal } from 'lucide-react';

interface SwipeablePanelProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  position?: 'bottom' | 'top';
  maxHeight?: string;
  minHeight?: string;
  className?: string;
  accentColor?: string;
  onOpenChange?: (isOpen: boolean) => void;
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
  position = 'bottom',
  maxHeight = '80vh',
  minHeight = '60px',
  className = '',
  accentColor = '#3b82f6',
  onOpenChange
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(defaultOpen ? maxHeight : minHeight);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
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
          parseInt(minHeight) + deltaY,
          parseInt(maxHeight)
        );
        setCurrentHeight(`${newHeight}px`);
      } else if (deltaY < 0 && isOpen) {
        // Closing
        const newHeight = Math.max(
          parseInt(maxHeight) + deltaY,
          parseInt(minHeight)
        );
        setCurrentHeight(`${newHeight}px`);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const currentHeightPx = parseInt(currentHeight);
    const maxHeightPx = parseInt(maxHeight);
    const minHeightPx = parseInt(minHeight);
    const threshold = (maxHeightPx - minHeightPx) / 2;

    // Determine if we should snap open or closed
    if (currentHeightPx > minHeightPx + threshold) {
      setIsOpen(true);
      setCurrentHeight(maxHeight);
      onOpenChange?.(true);
    } else {
      setIsOpen(false);
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
          parseInt(minHeight) + deltaY,
          parseInt(maxHeight)
        );
        setCurrentHeight(`${newHeight}px`);
      } else if (deltaY < 0 && isOpen) {
        const newHeight = Math.max(
          parseInt(maxHeight) + deltaY,
          parseInt(minHeight)
        );
        setCurrentHeight(`${newHeight}px`);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const currentHeightPx = parseInt(currentHeight);
    const maxHeightPx = parseInt(maxHeight);
    const minHeightPx = parseInt(minHeight);
    const threshold = (maxHeightPx - minHeightPx) / 2;

    if (currentHeightPx > minHeightPx + threshold) {
      setIsOpen(true);
      setCurrentHeight(maxHeight);
      onOpenChange?.(true);
    } else {
      setIsOpen(false);
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

  return (
    <div
      ref={panelRef}
      className={`fixed ${position === 'bottom' ? 'bottom-0' : 'top-0'} left-0 right-0 z-[100000] ${className}`}
      style={{
        height: currentHeight,
        transition: isDragging ? 'none' : 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Apple Glass Effect Background */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl border-t border-white/10" />

      {/* Drag Handle */}
      <div
        className={`
          relative z-10 flex items-center justify-center py-3 cursor-grab active:cursor-grabbing
          ${isDragging ? 'bg-white/10' : 'hover:bg-white/5'}
          transition-colors
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Drag Indicator */}
        <div
          className="w-12 h-1.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: isDragging ? accentColor : 'rgba(255,255,255,0.3)',
            boxShadow: isDragging ? `0 0 20px ${accentColor}` : 'none'
          }}
        />
      </div>

      {/* Header */}
      <div
        className="relative z-10 px-6 pb-4 flex items-center justify-between cursor-pointer"
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
      `}</style>
    </div>
  );
};

export default SwipeablePanel;
