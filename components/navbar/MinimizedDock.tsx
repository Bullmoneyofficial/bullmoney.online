"use client";
import React, { memo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { IconChevronDown, IconDots } from '@tabler/icons-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

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

// --- MINIMIZED DOCK ICON - Compact version with hover animation ---
const MinimizedIcon = memo(({
  item,
  index,
  totalItems,
  isHovered,
}: {
  item: MinimizedDockItemData;
  index: number;
  totalItems: number;
  isHovered: boolean;
}) => {
  const [localHover, setLocalHover] = useState(false);
  
  // Stagger delay for entrance animation
  const staggerDelay = index * 0.05;
  
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.1 : 1, 
        y: isHovered && localHover ? -5 : 0,
      }}
      exit={{ opacity: 0, scale: 0.6, y: 10 }}
      transition={{ 
        type: 'spring', 
        damping: 28, 
        stiffness: 500,
        delay: staggerDelay * 0.6,
        opacity: { duration: 0.08 }
      }}
      onHoverStart={() => {
        setLocalHover(true);
        SoundEffects.hover();
      }}
      onHoverEnd={() => setLocalHover(false)}
      onClick={(e) => {
        if (!item.triggerComponent && item.onClick) {
          SoundEffects.click();
          item.onClick();
        }
      }}
      className={cn(
        "relative flex items-center justify-center cursor-pointer",
        "w-10 h-10 rounded-xl",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border border-blue-500/30 hover:border-blue-400/60",
        "shadow-lg hover:shadow-blue-500/30",
        "transition-colors duration-150",
        item.isXMHighlight && "border-red-500/30 hover:border-red-400/60 hover:shadow-red-500/30"
      )}
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
      }}
    >
      {/* Icon with scaling */}
      <motion.div 
        className="flex items-center justify-center"
        animate={{ scale: localHover ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      >
        <div className={cn(
          "w-5 h-5 [&>svg]:w-5 [&>svg]:h-5",
          localHover ? "[&>svg]:text-blue-300" : "[&>svg]:text-blue-400/80",
          item.isXMHighlight && (localHover ? "[&>svg]:text-red-300" : "[&>svg]:text-red-400/80")
        )}>
          {item.icon}
        </div>
      </motion.div>
      
      {/* Hover glow effect */}
      <AnimatePresence>
        {localHover && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "absolute inset-0 rounded-xl pointer-events-none",
              item.isXMHighlight 
                ? "bg-red-500/20" 
                : "bg-blue-500/20"
            )}
            style={{
              boxShadow: item.isXMHighlight 
                ? '0 0 20px rgba(239, 68, 68, 0.4)' 
                : '0 0 20px rgba(59, 130, 246, 0.4)'
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Tooltip on hover */}
      <AnimatePresence>
        {localHover && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className={cn(
              "absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap",
              "px-2 py-1 rounded-lg text-[10px] font-bold",
              "bg-black/90 backdrop-blur-xl",
              item.isXMHighlight 
                ? "text-red-300 border border-red-500/40" 
                : "text-blue-300 border border-blue-500/40"
            )}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal trigger overlay */}
      {item.triggerComponent && (
        <div className="absolute inset-0 z-[100] rounded-xl overflow-hidden" style={{ pointerEvents: 'auto' }}>
          {item.triggerComponent}
        </div>
      )}
    </motion.div>
  );

  if (item.triggerComponent) {
    return content;
  }

  if (item.href) {
    return (
      <Link href={item.href}>
        {content}
      </Link>
    );
  }
  
  return content;
});

MinimizedIcon.displayName = 'MinimizedIcon';

// --- MAIN MINIMIZED DOCK COMPONENT ---
export const MinimizedDock = memo(({
  items,
  onExpandClick,
  isXMUser = false,
}: MinimizedDockProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2",
        "rounded-2xl backdrop-blur-2xl",
        "bg-gradient-to-br from-black/70 via-slate-900/70 to-black/70",
        "border-2 border-blue-500/40 hover:border-blue-400/60",
        "shadow-2xl",
        "transition-colors duration-200"
      )}
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        boxShadow: isHovered 
          ? '0 0 50px rgba(59, 130, 246, 0.35), 0 12px 45px rgba(0,0,0,0.5)'
          : '0 0 25px rgba(59, 130, 246, 0.18), 0 10px 30px rgba(0,0,0,0.4)'
      }}
    >
      {/* Animated shimmer background - simplified for performance */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-y-0 w-[200%] bg-gradient-to-r from-transparent via-blue-500/15 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Logo pill */}
      <motion.div
        animate={{ 
          scale: isHovered ? 1.05 : 1,
          rotate: isHovered ? [0, -5, 5, 0] : 0,
        }}
        transition={{ 
          scale: { type: 'spring', stiffness: 400, damping: 20 },
          rotate: { duration: 0.5, ease: 'easeInOut' }
        }}
        className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-blue-500/30"
      >
        <Link href="/" className="relative w-full h-full block">
          <Image
            src="/BULL.svg"
            alt="BullMoney"
            fill
            className="object-cover"
            priority
          />
        </Link>
        {/* Pulse effect */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-blue-500/20 rounded-xl pointer-events-none"
        />
      </motion.div>

      {/* Divider with glow */}
      <motion.div 
        animate={{ 
          height: isHovered ? 32 : 24,
          opacity: isHovered ? 1 : 0.6,
        }}
        className="w-[2px] rounded-full bg-gradient-to-b from-blue-500/20 via-blue-400/60 to-blue-500/20"
      />

      {/* Icon grid - compact version of dock items */}
      <motion.div 
        className="flex items-center gap-1.5"
        animate={{ gap: isHovered ? 6 : 6 }}
      >
        {items.slice(0, 6).map((item, index) => (
          <MinimizedIcon
            key={index}
            item={item}
            index={index}
            totalItems={items.length}
            isHovered={isHovered}
          />
        ))}
        
        {/* More items indicator if there are more than 6 */}
        {items.length > 6 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "flex items-center justify-center",
              "w-10 h-10 rounded-xl",
              "bg-gradient-to-br from-slate-700/80 to-slate-800/80",
              "border border-blue-500/20",
              "text-blue-400/60"
            )}
          >
            <IconDots className="w-4 h-4" />
          </motion.div>
        )}
      </motion.div>

      {/* Divider */}
      <motion.div 
        animate={{ 
          height: isHovered ? 32 : 24,
          opacity: isHovered ? 1 : 0.6,
        }}
        className="w-[2px] rounded-full bg-gradient-to-b from-blue-500/20 via-blue-400/60 to-blue-500/20"
      />

      {/* Expand button */}
      <motion.button
        onClick={onExpandClick}
        onMouseEnter={() => SoundEffects.hover()}
        animate={{ 
          scale: isHovered ? 1.1 : 1,
          backgroundColor: isHovered ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center justify-center",
          "w-10 h-10 rounded-xl",
          "border border-blue-500/30 hover:border-blue-400/60",
          "transition-colors duration-200"
        )}
      >
        <motion.div
          animate={{ 
            y: isHovered ? [0, 2, 0] : 0,
          }}
          transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0, ease: 'easeInOut' }}
        >
          <IconChevronDown 
            className={cn(
              "w-5 h-5 transition-colors",
              isHovered ? "text-blue-300" : "text-blue-400/70"
            )} 
          />
        </motion.div>
        
        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-bold bg-black/90 backdrop-blur-xl text-blue-300 border border-blue-500/40"
            >
              Expand
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating particles effect on hover - reduced for performance */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.2, 0],
                  x: (Math.random() - 0.5) * 80,
                  y: -25 - Math.random() * 30,
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1.2 + Math.random() * 0.4,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 0.3,
                }}
                className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-blue-400 pointer-events-none"
                style={{
                  willChange: 'transform, opacity',
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.9)',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

MinimizedDock.displayName = 'MinimizedDock';
