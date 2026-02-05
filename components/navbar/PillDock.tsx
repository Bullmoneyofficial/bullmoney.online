"use client";
import React, { useCallback, useRef, useState, memo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

// ============================================================================
// PILL DOCK - Modern Pill-Style Navigation for Desktop
// Same functionality as Dock but with pill design from StorePillNav
// ============================================================================

interface PillDockItemData {
  icon?: React.ReactNode;
  label: string;
  tips?: string[];
  onClick?: () => void;
  href?: string;
  triggerComponent?: React.ReactNode;
  showShine?: boolean;
  isXMHighlight?: boolean;
}

interface PillDockProps {
  items: PillDockItemData[];
  className?: string;
  dockRef?: React.RefObject<HTMLDivElement | null>;
  buttonRefs?: React.RefObject<(HTMLDivElement | null)[]>;
  onHoverChange?: (isHovered: boolean) => void;
  isXMUser?: boolean;
  activeLabel?: string;
}

// --- PILL DOCK TOOLTIP ---
const PillDockTooltip = memo(({ 
  children, 
  tips, 
  isVisible,
  position,
  isXMUser = false 
}: {
  children: React.ReactNode;
  tips?: string[];
  isVisible: boolean;
  position: { x: number; y: number };
  isXMUser?: boolean;
}) => {
  const effectiveColor = isXMUser ? '#ef4444' : '#ffffff';
  const currentTip = tips?.[0] || '';

  if (!isVisible) return null;

  return (
    <div
      className="fixed w-max min-w-[140px] rounded-xl bg-black px-3 py-2 z-[150] pointer-events-none"
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

PillDockTooltip.displayName = 'PillDockTooltip';

// --- PILL DOCK ITEM ---
const PillDockItem = memo(({
  item,
  index,
  buttonRefs,
  isActive,
}: {
  item: PillDockItemData;
  index: number;
  buttonRefs?: React.RefObject<(HTMLDivElement | null)[]>;
  isActive?: boolean;
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

  const pillClasses = cn(
    "relative flex items-center justify-center h-full px-4 rounded-full",
    "text-xs font-semibold uppercase tracking-wide",
    "transition-all duration-200 cursor-pointer",
    isActive 
      ? "bg-white text-black" 
      : item.isXMHighlight 
        ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
        : "text-white/70 hover:text-white hover:bg-white/10"
  );

  const content = (
    <div
      ref={setRefs}
      className={cn(pillClasses, item.triggerComponent && "pointer-events-none")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {item.label}
      
      <PillDockTooltip 
        tips={item.tips} 
        isVisible={isHovered && !!item.tips?.length} 
        position={tooltipPosition}
        isXMUser={item.isXMHighlight}
      >
        {item.label}
      </PillDockTooltip>

      {item.triggerComponent && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center" style={{ pointerEvents: 'auto' }}>
          {item.triggerComponent}
        </div>
      )}
    </div>
  );

  if (item.triggerComponent) return <li className="flex h-full">{content}</li>;
  if (item.href) return <li className="flex h-full"><Link href={item.href}>{content}</Link></li>;
  return <li className="flex h-full">{content}</li>;
});

PillDockItem.displayName = 'PillDockItem';

// --- MAIN PILL DOCK COMPONENT ---
export const PillDock = memo(React.forwardRef<HTMLDivElement, PillDockProps>(
  (
    {
      items,
      className = "",
      dockRef,
      buttonRefs,
      onHoverChange,
      activeLabel,
    },
    ref
  ) => {
    return (
      <div
        ref={dockRef || ref}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        className={cn(
          "hidden lg:flex items-center h-10 bg-black rounded-full border border-white/10",
          className
        )}
        data-navbar
        data-theme-aware
      >
        <ul className="flex items-stretch gap-0.5 h-full p-1">
          {items.map((item, index) => (
            <PillDockItem
              key={index}
              item={item}
              index={index}
              buttonRefs={buttonRefs}
              isActive={activeLabel === item.label}
            />
          ))}
        </ul>
      </div>
    );
  }
));

PillDock.displayName = 'PillDock';

export default PillDock;
