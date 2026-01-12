"use client";
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { DockIcon } from './DockIcon';
import { useRotatingIndex } from './navbar.utils';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';

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
  dockRef?: React.RefObject<HTMLDivElement>;
  buttonRefs?: React.RefObject<(HTMLDivElement | null)[]>;
  onHoverChange?: (isHovered: boolean) => void;
  isXMUser?: boolean;
}

// --- DOCK LABEL COMPONENT (INLINE FOR PROPER HOVER STATE) ---
const DockLabelInline = memo(({ 
  children, 
  tips, 
  className = "", 
  isHovered, 
  isXMUser = false 
}: {
  children: React.ReactNode;
  tips?: string[];
  className?: string;
  isHovered: any;
  isXMUser?: boolean;
}) => {
  const { accentColor } = useGlobalTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const currentIndex = useRotatingIndex(tips?.length || 0);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on("change", (latest: number) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  useEffect(() => {
    if (!isVisible || !parentRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const parentRect = parentRef.current?.getBoundingClientRect();
      if (parentRect) {
        setPosition({
          x: parentRect.left + parentRect.width / 2,
          y: parentRect.bottom + 8,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isVisible]);

  // Use theme accent or fallback to XM red / default blue
  const effectiveColor = isXMUser ? '#ef4444' : '#3b82f6';

  return (
    <>
      <div ref={parentRef} className="absolute inset-0" />
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.80 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              duration: 0.35, 
              ease: [0.34, 1.56, 0.64, 1],
              opacity: { duration: 0.25 }
            }}
            className={cn(
              "fixed w-max min-w-[160px] rounded-xl bg-black/75 backdrop-blur-2xl px-4 py-2.5 z-[150] pointer-events-none shadow-2xl tooltip-optimized overflow-hidden",
              className
            )}
            role="tooltip"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translateX(-50%)',
              border: isXMUser ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)',
              boxShadow: isXMUser 
                ? '0 0 40px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.1)'
                : '0 0 40px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)'
            }}
          >
            {/* Shimmer Background - Left to Right Gradient */}
            <motion.div 
              animate={{ x: ['0%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-y-0 left-[-100%] w-[100%] z-0"
              style={{
                background: isXMUser 
                  ? 'linear-gradient(to right, transparent, rgba(239, 68, 68, 0.4), transparent)'
                  : 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.4), transparent)'
              }}
            />
            {/* Arrow pointing up */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] z-10"
              style={{ borderBottomColor: isXMUser ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)' }}
            />
            
            <div className="flex items-center gap-3 relative z-10">
              {/* Pulse indicator */}
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.25 }}
                className="relative flex h-2 w-2 shrink-0"
              >
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" 
                  style={{ backgroundColor: effectiveColor }}
                />
                <span 
                  className="relative inline-flex rounded-full h-2 w-2 shadow-lg" 
                  style={{ backgroundColor: effectiveColor }}
                />
              </motion.div>
              
              {/* Label */}
              <motion.span 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.25 }}
                className="text-[10px] uppercase tracking-widest font-bold shrink-0"
                style={{ color: effectiveColor }}
              >
                {children}
              </motion.span>
              
              {/* Divider */}
              <motion.div 
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.12, duration: 0.2 }}
                className="w-[1px] h-4 shrink-0"
                style={{ 
                  background: isXMUser 
                    ? 'linear-gradient(to bottom, rgba(239, 68, 68, 0.4), rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.4))'
                    : 'linear-gradient(to bottom, rgba(59, 130, 246, 0.4), rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.4))' 
                }}
              />
              
              {/* Rotating tip text */}
              {tips && tips.length > 0 && (
                <div className="relative overflow-hidden min-w-fit">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentIndex}
                      initial={{ opacity: 0, y: 8, x: 5 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      exit={{ opacity: 0, y: -8, x: -5 }}
                      transition={{ 
                        duration: 0.3,
                        ease: [0.34, 1.56, 0.64, 1]
                      }}
                      className="text-xs font-medium whitespace-nowrap block"
                      style={{ color: isXMUser ? '#fca5a5' : '#93c5fd' }}
                    >
                      {tips[currentIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

DockLabelInline.displayName = 'DockLabelInline';

// --- DOCK ITEM COMPONENT ---
const DockItem = memo(({
  item,
  index,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  buttonRefs,
}: {
  item: DockItemData;
  index: number;
  mouseX: any;
  spring: any;
  distance: number;
  magnification: number;
  baseItemSize: number;
  buttonRefs?: React.RefObject<(HTMLDivElement | null)[]>;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const setRefs = (el: HTMLDivElement | null) => {
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (buttonRefs?.current) {
      buttonRefs.current[index] = el;
    }
  };

  const mouseDistance = useTransform(mouseX, (val: number) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  
  const size = useSpring(targetSize, {
    ...spring,
    stiffness: 300,
    damping: 25,
    mass: 0.1,
  });

  const content = (
    <motion.div
      ref={setRefs}
      style={{
        width: size,
        height: size,
        transform: 'translateZ(0)',
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={item.onClick}
      onMouseEnter={() => {
        SoundEffects.hover();
      }}
      onMouseDown={() => {
        SoundEffects.click();
      }}
      onTouchStart={() => {
        SoundEffects.click();
      }}
      className={cn(
        "relative flex flex-col items-center justify-center cursor-pointer mb-2 dock-item-optimized",
      )}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {/* DockIcon with icon and label */}
      <DockIcon label={item.label} showShine={item.showShine} isXMUser={item.isXMHighlight}>
        {item.icon}
      </DockIcon>
      
      {/* DockLabel with tooltip */}
      <DockLabelInline tips={item.tips} isHovered={isHovered} isXMUser={item.isXMHighlight}>
        {item.label}
      </DockLabelInline>

      {/* INVISIBLE OVERLAY TRIGGER FOR MODALS */}
      {item.triggerComponent && (
        <div className="absolute inset-0 z-20 opacity-0 cursor-pointer">
          {item.triggerComponent}
        </div>
      )}
    </motion.div>
  );

  if (item.href) {
    return (
      <Link href={item.href}>
        {content}
      </Link>
    );
  }
  
  return content;
});

DockItem.displayName = 'DockItem';

// --- MAIN DOCK COMPONENT ---
export const Dock = memo(React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      items,
      className = "",
      spring = { mass: 0.1, stiffness: 150, damping: 12 },
      magnification = 100,
      distance = 150,
      baseItemSize = 70,
      dockRef,
      buttonRefs,
      onHoverChange,
      isXMUser = false,
    },
    ref
  ) => {
    const { accentColor } = useGlobalTheme();
    const mouseX = useMotionValue(Infinity);
    const lastMouseX = useRef(0);
    const rafId = useRef<number | null>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
      const pageX = e.pageX;
      
      if (Math.abs(pageX - lastMouseX.current) < 2) return;
      lastMouseX.current = pageX;
      
      if (rafId.current) cancelAnimationFrame(rafId.current);
      
      rafId.current = requestAnimationFrame(() => {
        mouseX.set(pageX);
      });
    }, [mouseX]);

    useEffect(() => {
      return () => {
        if (rafId.current) cancelAnimationFrame(rafId.current);
      };
    }, []);

    return (
      <motion.div
        ref={dockRef || ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          onHoverChange?.(true);
        }}
        onMouseLeave={() => {
          mouseX.set(Infinity);
          onHoverChange?.(false);
          if (rafId.current) cancelAnimationFrame(rafId.current);
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "mx-auto flex h-24 items-center gap-5 rounded-3xl px-6 shadow-2xl backdrop-blur-3xl transition-all duration-300 transform translateZ-0 dock-glass",
          className
        )}
        style={{ 
          transform: 'translateZ(0)',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '2px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)'
        }}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            item={item}
            index={index}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            buttonRefs={buttonRefs}
          />
        ))}
      </motion.div>
    );
  }
));

Dock.displayName = 'Dock';
