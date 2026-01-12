import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';

interface MovingTradingTipProps {
  tip: { target: string; text: string; buttonIndex: number };
  buttonRefs: React.RefObject<(HTMLDivElement | null)[]>;
  dockRef: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
}

export const MovingTradingTip = ({ 
  tip, 
  buttonRefs,
  dockRef,
  isVisible 
}: MovingTradingTipProps) => {
  const { activeTheme, isMobile, accentColor } = useGlobalTheme();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  
  // Get theme filter for consistency with navbar
  const themeFilter = isMobile 
    ? (activeTheme?.mobileFilter || 'none') 
    : (activeTheme?.filter || 'none');
  
  useEffect(() => {
    const updatePosition = () => {
      if (!buttonRefs.current || !dockRef.current) return;
      
      const button = buttonRefs.current[tip.buttonIndex];
      const dock = dockRef.current;
      
      if (button && dock) {
        const buttonRect = button.getBoundingClientRect();
        const dockRect = dock.getBoundingClientRect();
        
        setPosition({
          x: buttonRect.left + buttonRect.width / 2,
          y: dockRect.bottom + 16
        });
        setIsReady(true);
      }
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [tip.buttonIndex, buttonRefs, dockRef]);
  
  if (!isVisible || !isReady) return null;
  
  return (
    <motion.div
      key={tip.buttonIndex}
      initial={{ opacity: 0, scale: 0.75, y: position.y + 15 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: position.x - 120,
        y: position.y,
        transition: {
          type: "spring",
          stiffness: 380,
          damping: 35,
          mass: 0.5
        }
      }}
      exit={{ opacity: 0, scale: 0.75, y: position.y + 15 }}
      transition={{ 
        opacity: { duration: 0.2, ease: "easeOut" },
        scale: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
        default: {
          type: "spring",
          stiffness: 380,
          damping: 35,
          mass: 0.5
        }
      }}
      className="fixed z-30 pointer-events-none hidden lg:block gpu-accelerated"
      style={{ 
        left: 0,
        top: 0,
        filter: themeFilter,
        transition: 'filter 0.5s ease-in-out'
      }}
    >
      <motion.div 
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        {/* Arrow pointing up */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px]" 
          style={{ borderBottomColor: `color-mix(in srgb, ${accentColor} 50%, transparent)` }}
        />
        
        {/* Tip container */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          className="px-4 py-2.5 rounded-xl bg-black/85 backdrop-blur-xl tooltip-optimized"
          style={{
            border: '1px solid var(--theme-accent-border, rgba(59, 130, 246, 0.5))',
            boxShadow: `0 0 40px var(--theme-accent-glow, rgba(59, 130, 246, 0.4)), inset 0 0 20px var(--theme-accent-subtle, rgba(59, 130, 246, 0.1))`
          }}
        >
          <div className="flex items-center gap-3">
            {/* Pulse indicator */}
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.25 }}
              className="relative flex h-2 w-2 shrink-0"
            >
              <span 
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" 
                style={{ backgroundColor: accentColor }}
              />
              <span 
                className="relative inline-flex rounded-full h-2 w-2 shadow-lg" 
                style={{ backgroundColor: accentColor }}
              />
            </motion.div>
            
            {/* Target label */}
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.25 }}
              className="text-[10px] uppercase tracking-widest font-bold shrink-0"
              style={{ color: accentColor }}
            >
              {tip.target}
            </motion.span>
            
            {/* Divider */}
            <motion.div 
              initial={{ opacity: 0, scaleY: 0.5 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.14, duration: 0.2 }}
              className="w-[1px] h-4 shrink-0 origin-center"
              style={{ 
                background: `linear-gradient(to bottom, color-mix(in srgb, ${accentColor} 40%, transparent), color-mix(in srgb, ${accentColor} 20%, transparent), color-mix(in srgb, ${accentColor} 40%, transparent))` 
              }}
            />
            
            {/* Tip text */}
            <motion.span 
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16, duration: 0.25 }}
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: `color-mix(in srgb, ${accentColor} 80%, white)` }}
            >
              {tip.text}
            </motion.span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
