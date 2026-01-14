import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';

interface DockIconProps {
  children: React.ReactNode;
  label: string;
  className?: string;
  showShine?: boolean;
  isXMUser?: boolean;
}

export const DockIcon = memo(React.forwardRef<HTMLDivElement, DockIconProps>(
  ({ children, label, className = "", showShine = false, isXMUser = false }, ref) => {
    const { accentColor } = useGlobalTheme();
    
    // Use theme accent or fallback to XM red, default to blue
    const effectiveColor = isXMUser ? '#ef4444' : (accentColor || '#3b82f6');
    
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -5, scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "flex flex-col h-full w-full items-center justify-center rounded-2xl backdrop-blur-2xl shadow-lg transition-all duration-300 relative overflow-hidden group/icon icon-glass",
          className
        )}
        style={{
          border: showShine 
            ? `2px solid rgba(59, 130, 246, 0.7)` 
            : `2px solid rgba(59, 130, 246, 0.3)`,
          backgroundColor: showShine 
            ? `rgba(59, 130, 246, 0.15)` 
            : `rgba(59, 130, 246, 0.08)`
        }}
      >
        {/* Shimmer Background - Left to Right Gradient - Always visible */}
        <motion.div 
          animate={{ x: ['0%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 left-[-100%] w-[100%] z-0"
          style={{
            background: showShine 
              ? `linear-gradient(to right, transparent, rgba(59, 130, 246, 0.6), transparent)`
              : `linear-gradient(to right, transparent, rgba(59, 130, 246, 0.3), transparent)`,
            opacity: 1
          }}
        />

        {/* Gradient Overlay */}
        <motion.div
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-20 z-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1), transparent)`
          }}
        />

        {/* Hover glow effect */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-2xl pointer-events-none blur-lg"
          style={{ backgroundColor: `rgba(59, 130, 246, 0.2)` }}
        />

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full w-full items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, type: "spring" }}
            className="flex-shrink-0 mb-1 z-10 pointer-events-none relative"
            style={{ color: isXMUser ? '#f87171' : '#60a5fa' }}
          >
            {children}
            {/* Notification Dot if Shining */}
            {showShine && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                className="absolute -top-1 -right-1 flex h-2.5 w-2.5"
              >
                <span 
                  className="shimmer-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: '#3b82f6' }}
                />
                <span 
                  className="relative inline-flex rounded-full h-2.5 w-2.5 shadow-lg"
                  style={{ backgroundColor: '#3b82f6' }}
                />
              </motion.span>
            )}
          </motion.div>
          
          <motion.span 
            initial={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-[9px] uppercase tracking-widest font-semibold z-10 pointer-events-none transition-colors"
            style={{ 
              color: isXMUser ? '#fca5a5' : (showShine ? '#93c5fd' : '#60a5fa'),
              fontWeight: showShine ? 'bold' : 'normal'
            }}
          >
            {label}
          </motion.span>
        </div>
      </motion.div>
    );
  }
));

DockIcon.displayName = 'DockIcon';
