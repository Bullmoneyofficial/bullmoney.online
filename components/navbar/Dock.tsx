"use client";
import React, { useCallback, useRef, useState, memo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { DockIcon } from './DockIcon';
import './Dock.css';

interface DockItemData {
  icon: React.ReactNode;
  label: string;
  tips?: string[];
  onClick?: () => void;
  href?: string;
  triggerComponent?: React.ReactNode;
  showShine?: boolean;
  isXMHighlight?: boolean;
}

interface DockProps {
  items: DockItemData[];
  className?: string;
  baseItemSize?: number;
  magnification?: number;
  spring?: any;
  distance?: number;
  dockRef?: React.RefObject<HTMLDivElement | null>;
  buttonRefs?: React.RefObject<(HTMLDivElement | null)[]>;
  onHoverChange?: (isHovered: boolean) => void;
  isXMUser?: boolean;
}

// --- DOCK LABEL COMPONENT (STATIC CSS VERSION) ---
const DockLabelInline = memo(({ 
  children, 
  tips, 
  className = "", 
  isVisible,
  position,
  isXMUser = false 
}: {
  children: React.ReactNode;
  tips?: string[];
  className?: string;
  isVisible: boolean;
  position: { x: number; y: number };
  isXMUser?: boolean;
}) => {
  const effectiveColor = isXMUser ? '#ef4444' : '#ffffff';
  const currentTip = tips?.[0] || '';

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "dock-tooltip fixed w-max min-w-[140px] rounded-xl bg-black px-3 py-2 z-[150] pointer-events-none",
        className
      )}
      role="tooltip"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
        border: `2px solid ${effectiveColor}`,
        boxShadow: `0 0 4px ${effectiveColor}, 0 0 8px ${effectiveColor}`,
      }}
    >
      {/* Arrow pointing up */}
      <div 
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px]"
        style={{ borderBottomColor: effectiveColor }}
      />
      
      <div className="flex items-center gap-2 relative z-10">
        <span 
          className="relative inline-flex rounded-full h-2 w-2" 
          style={{ backgroundColor: effectiveColor }}
        />
        <span 
          className="text-[10px] uppercase tracking-widest font-bold"
          style={{ color: effectiveColor }}
        >
          {children}
        </span>
        {currentTip && (
          <>
            <div className="w-[1px] h-3" style={{ backgroundColor: `${effectiveColor}40` }} />
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: isXMUser ? '#fca5a5' : '#ffffff' }}>
              {currentTip}
            </span>
          </>
        )}
      </div>
    </div>
  );
});

DockLabelInline.displayName = 'DockLabelInline';

// --- DOCK ITEM COMPONENT (STATIC) ---
const DockItem = memo(({
  item,
  index,
  baseItemSize,
  buttonRefs,
}: {
  item: DockItemData;
  index: number;
  baseItemSize: number;
  buttonRefs?: React.RefObject<(HTMLDivElement | null)[]>;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const setRefs = useCallback((el: HTMLDivElement | null) => {
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (buttonRefs?.current) {
      buttonRefs.current[index] = el;
    }
  }, [buttonRefs, index]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    SoundEffects.hover();
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!item.triggerComponent && item.onClick) {
      e.preventDefault();
      e.stopPropagation();
      SoundEffects.click();
      item.onClick();
    }
  }, [item]);

  const content = (
    <div
      ref={setRefs}
      className="dock-item relative flex flex-col items-center justify-center cursor-pointer"
      style={{ width: baseItemSize, height: baseItemSize }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      <div className={cn("w-full h-full flex items-center justify-center", item.triggerComponent && "pointer-events-none")}>
        <DockIcon label={item.label} showShine={item.showShine} isXMUser={item.isXMHighlight}>
          {item.icon}
        </DockIcon>
      </div>
      
      <DockLabelInline 
        tips={item.tips} 
        isVisible={isHovered} 
        position={tooltipPosition}
        isXMUser={item.isXMHighlight}
      >
        {item.label}
      </DockLabelInline>

      {item.triggerComponent && (
        <div className="absolute inset-0 z-[100]" style={{ pointerEvents: 'auto' }}>
          {item.triggerComponent}
        </div>
      )}
    </div>
  );

  if (item.triggerComponent) return content;
  if (item.href) return <Link href={item.href}>{content}</Link>;
  return content;
});

DockItem.displayName = 'DockItem';

// --- MAIN DOCK COMPONENT (STATIC CSS VERSION) ---
export const Dock = memo(React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      items,
      className = "",
      baseItemSize = 70,
      dockRef,
      buttonRefs,
      onHoverChange,
    },
    ref
  ) => {
    return (
      <div
        ref={dockRef || ref}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        className={cn("dock-container mx-auto flex h-16 items-center gap-3 rounded-3xl px-6", className)}
        data-navbar
        data-theme-aware
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            item={item}
            index={index}
            baseItemSize={baseItemSize}
            buttonRefs={buttonRefs}
          />
        ))}
      </div>
    );
  }
));

Dock.displayName = 'Dock';
