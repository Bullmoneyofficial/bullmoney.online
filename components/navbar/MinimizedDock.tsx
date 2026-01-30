"use client";
import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { IconChevronDown, IconDots } from '@tabler/icons-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import './MinimizedDock.css';

interface MinimizedDockItemData {
  icon: React.ReactNode;
  label: string;
  tips?: string[];
  onClick?: () => void;
  href?: string;
  triggerComponent?: React.ReactNode;
  showShine?: boolean;
  isXMHighlight?: boolean;
}

interface MinimizedDockProps {
  items: MinimizedDockItemData[];
  onExpandClick?: () => void;
  isXMUser?: boolean;
}

// --- MINIMIZED DOCK ICON - Static CSS version ---
const MinimizedIcon = memo(({
  item,
  index,
}: {
  item: MinimizedDockItemData;
  index: number;
}) => {
  const [localHover, setLocalHover] = useState(false);

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
      className={cn(
        "minimized-icon relative flex items-center justify-center cursor-pointer w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl",
        item.isXMHighlight && "minimized-icon--xm"
      )}
      onMouseEnter={() => { setLocalHover(true); SoundEffects.hover(); }}
      onMouseLeave={() => setLocalHover(false)}
      onClick={handleClick}
    >
      <div className={cn(
        "minimized-icon-content w-5 h-5 [&>svg]:w-5 [&>svg]:h-5",
        item.isXMHighlight ? "[&>svg]:text-red-400" : "[&>svg]:text-white"
      )}
      style={{
        filter: item.isXMHighlight 
          ? 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.6))' 
          : 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.6))'
      }}
      >
        {item.icon}
      </div>
      
      {/* Tooltip on hover */}
      {localHover && (
        <div className={cn(
          "minimized-tooltip absolute -bottom-10 left-1/2 whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-bold bg-black z-50",
          item.isXMHighlight ? "text-red-400" : "text-white"
        )}
        style={{
          textShadow: item.isXMHighlight 
            ? '0 0 4px #ef4444' 
            : '0 0 4px #ffffff'
        }}
        >
          {item.label}
        </div>
      )}

      {item.triggerComponent && (
        <div className="absolute inset-0 z-[100] rounded-xl overflow-hidden" style={{ pointerEvents: 'auto' }}>
          {item.triggerComponent}
        </div>
      )}
    </div>
  );

  if (item.triggerComponent) return content;
  if (item.href) return <Link href={item.href}>{content}</Link>;
  return content;
});

MinimizedIcon.displayName = 'MinimizedIcon';

// --- MAIN MINIMIZED DOCK COMPONENT (STATIC CSS VERSION) ---
export const MinimizedDock = memo(({
  items,
  onExpandClick,
}: MinimizedDockProps) => {
  return (
    <div className="minimized-dock-container relative flex items-center gap-2 px-3 py-2 rounded-2xl">
      {/* Logo pill */}
      <div className="minimized-logo relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
        <Link href="/" className="relative w-full h-full block">
          <Image
            src="/ONcc2l601.svg"
            alt="BullMoney"
            fill
            className="object-cover"
            priority
          />
        </Link>
      </div>

      {/* Divider */}
      <div className="minimized-divider w-[2px] h-6 rounded-full" />

      {/* Icon grid */}
      <div className="flex items-center gap-1.5">
        {items.slice(0, 6).map((item, index) => (
          <MinimizedIcon key={index} item={item} index={index} />
        ))}
        
        {items.length > 6 && (
          <div className="minimized-icon flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl">
            <IconDots className="w-4 h-4 text-white" style={{ filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.6))' }} />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="minimized-divider w-[2px] h-6 rounded-full" />

      {/* Expand button */}
      <button
        onClick={() => { SoundEffects.click(); onExpandClick?.(); }}
        onMouseEnter={() => SoundEffects.hover()}
        className="minimized-expand relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl"
      >
        <IconChevronDown 
          className="w-5 h-5 text-white" 
          style={{ filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.6))' }} 
        />
      </button>
    </div>
  );
});

MinimizedDock.displayName = 'MinimizedDock';
