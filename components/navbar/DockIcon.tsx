import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import './DockIcon.css';

interface DockIconProps {
  children: React.ReactNode;
  label: string;
  className?: string;
  showShine?: boolean;
  isXMUser?: boolean;
}

export const DockIcon = memo(React.forwardRef<HTMLDivElement, DockIconProps>(
  ({ children, label, className = "", showShine = false, isXMUser = false }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "dock-icon-static flex flex-col h-full w-full items-center justify-center rounded-2xl relative overflow-hidden pointer-events-none",
          className
        )}
      >
        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full w-full items-center justify-center">
          <div 
            className={cn(
              "dock-icon-content flex-shrink-0 mb-1 z-10 pointer-events-none relative",
              isXMUser ? "text-red-400" : "text-white"
            )}
          >
            {children}
            {/* Notification Dot if Shining */}
            {showShine && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 bg-white" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
            )}
          </div>
          
          <span 
            className={cn(
              "dock-icon-label text-[9px] uppercase tracking-widest font-bold z-10 pointer-events-none",
              isXMUser ? "text-red-400" : "text-white"
            )}
          >
            {label}
          </span>
        </div>
      </div>
    );
  }
));

DockIcon.displayName = 'DockIcon';
