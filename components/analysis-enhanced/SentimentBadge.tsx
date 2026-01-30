"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Direction } from '@/types/feed';

interface SentimentBadgeProps {
  direction: Direction;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  interactive?: boolean;
  className?: string;
}

const directionConfig = {
  bullish: {
    label: 'LONG',
    shortLabel: 'L',
    icon: TrendingUp,
    bgColor: 'bg-white/20',
    borderColor: 'border-white/50',
    textColor: 'text-white',
    hoverBg: 'hover:bg-white/30',
    glowColor: 'shadow-white/20',
  },
  bearish: {
    label: 'SHORT',
    shortLabel: 'S',
    icon: TrendingDown,
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-400',
    hoverBg: 'hover:bg-red-500/30',
    glowColor: 'shadow-red-500/20',
  },
  neutral: {
    label: 'NEUTRAL',
    shortLabel: 'N',
    icon: Minus,
    bgColor: 'bg-neutral-500/20',
    borderColor: 'border-neutral-500/50',
    textColor: 'text-neutral-400',
    hoverBg: 'hover:bg-neutral-500/30',
    glowColor: 'shadow-neutral-500/20',
  },
};

const sizeClasses = {
  sm: {
    container: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'px-3 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    container: 'px-4 py-2 text-base gap-2',
    icon: 'w-5 h-5',
  },
};

export const SentimentBadge = memo(({
  direction,
  size = 'md',
  showLabel = true,
  interactive = false,
  className = '',
}: SentimentBadgeProps) => {
  const config = directionConfig[direction];
  const sizeConfig = sizeClasses[size];
  const Icon = config.icon;

  const Component = interactive ? motion.button : motion.div;
  const interactiveProps = interactive ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  } : {};

  return (
    <Component
      {...interactiveProps}
      className={`
        inline-flex items-center font-bold uppercase rounded-md border
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        ${interactive ? `cursor-pointer ${config.hoverBg}` : ''}
        ${sizeConfig.container}
        shadow-lg ${config.glowColor}
        transition-colors
        ${className}
      `}
    >
      <Icon className={sizeConfig.icon} />
      {showLabel && <span>{size === 'sm' ? config.shortLabel : config.label}</span>}
    </Component>
  );
});

SentimentBadge.displayName = 'SentimentBadge';

// Pair of LONG/SHORT buttons for header
interface SentimentButtonsProps {
  direction: Direction;
  onSelect?: (direction: Direction) => void;
  disabled?: boolean;
}

export const SentimentButtons = memo(({
  direction,
  onSelect,
  disabled = false,
}: SentimentButtonsProps) => {
  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={() => !disabled && onSelect?.('bullish')}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2
          border transition-all
          ${direction === 'bullish'
            ? 'bg-white text-black border-white shadow-lg shadow-white/30'
            : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <TrendingUp className="w-4 h-4" />
        LONG
      </motion.button>

      <motion.button
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={() => !disabled && onSelect?.('bearish')}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2
          border transition-all
          ${direction === 'bearish'
            ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
            : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <TrendingDown className="w-4 h-4" />
        SHORT
      </motion.button>
    </div>
  );
});

SentimentButtons.displayName = 'SentimentButtons';

export default SentimentBadge;
