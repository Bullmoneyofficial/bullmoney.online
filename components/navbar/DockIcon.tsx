import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DockIconProps {
  children: React.ReactNode;
  label: string;
  className?: string;
  showShine?: boolean;
  isXMUser?: boolean;
}

export const DockIcon = React.forwardRef<HTMLDivElement, DockIconProps>(
  ({ children, label, className = "", showShine = false, isXMUser = false }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -5, scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "flex flex-col h-full w-full items-center justify-center rounded-2xl backdrop-blur-2xl border-2 shadow-lg transition-all duration-300 relative overflow-hidden group/icon icon-glass",
          showShine
            ? (isXMUser ? "border-red-500/70 bg-red-950/30" : "border-blue-500/70 bg-blue-950/20")
            : (isXMUser ? "border-red-500/30 bg-red-950/10" : "border-blue-500/30 bg-blue-950/10"),
          className
        )}
      >
        {/* Shimmer Background */}
        {showShine && (
          <motion.span 
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute inset-[-100%] opacity-100 z-0",
              isXMUser 
                ? "bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#ef4444_50%,#00000000_100%)]"
                : "bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)]"
            )} 
          />
        )}

        {/* Gradient Overlay */}
        <motion.div
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className={cn(
            "absolute inset-0 opacity-20 z-0 pointer-events-none",
            isXMUser
              ? "bg-gradient-to-r from-red-500/30 via-red-500/10 to-transparent"
              : "bg-gradient-to-r from-blue-500/30 via-blue-500/10 to-transparent"
          )}
        />

        {/* Hover glow effect */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "absolute inset-0 rounded-2xl pointer-events-none blur-lg",
            isXMUser ? "bg-red-500/20" : "bg-blue-500/20"
          )}
        />

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full w-full items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, type: "spring" }}
            className="flex-shrink-0 mb-1 z-10 pointer-events-none relative"
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
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isXMUser ? "bg-red-400" : "bg-blue-400")}></span>
                <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5 shadow-lg", isXMUser ? "bg-red-500" : "bg-blue-500")}></span>
              </motion.span>
            )}
          </motion.div>
          
          <motion.span 
            initial={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "text-[9px] uppercase tracking-widest font-semibold z-10 pointer-events-none transition-colors",
              showShine 
                ? (isXMUser ? "text-red-300 dark:text-red-300 font-bold" : "text-blue-300 dark:text-blue-300 font-bold")
                : (isXMUser ? "text-red-200/80 dark:text-red-200/80" : "text-blue-200/80 dark:text-blue-200/80")
            )}
          >
            {label}
          </motion.span>
        </div>
      </motion.div>
    );
  }
);

DockIcon.displayName = 'DockIcon';
