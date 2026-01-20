"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DisclaimerSectionProps {
  number: string;
  title: string;
  text: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

export const DisclaimerSection = ({ number, title, text, isOpen, onToggle }: DisclaimerSectionProps) => {
  const contentId = `disclaimer-${number}`;
  const isCollapsed = !isOpen;

  return (
    <div 
      className="group relative rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: 'black',
        border: '1px solid #3b82f6',
        boxShadow: isOpen ? '0 0 8px rgba(59, 130, 246, 0.5), 0 0 16px rgba(59, 130, 246, 0.3)' : '0 0 4px rgba(59, 130, 246, 0.3)'
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(number)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        title={title}
        className={cn(
          "relative flex w-full items-center justify-between text-left",
          isCollapsed
            ? "gap-1.5 xs:gap-2 sm:gap-2 md:gap-2.5 p-1.5 xs:p-2 sm:p-2.5 md:p-3 min-h-[34px]"
            : "gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 p-2 xs:p-2.5 sm:p-3 md:p-4"
        )}
      >
        <div className={cn("flex items-center", isCollapsed ? "gap-1.5 xs:gap-2" : "gap-1.5 xs:gap-2 sm:gap-2 md:gap-3") }>
          <span 
            className="flex h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 items-center justify-center rounded text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] font-bold font-mono flex-shrink-0"
            style={{
              color: '#3b82f6',
              textShadow: '0 0 4px #3b82f6',
              border: '1px solid #3b82f6',
              boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)',
              background: 'rgba(59, 130, 246, 0.1)'
            }}
          >
            {number}
          </span>
          <span 
            className="line-clamp-2 text-xs xs:text-sm sm:text-sm md:text-base font-semibold"
            style={{ color: '#ffffff', textShadow: '0 0 4px rgba(255, 255, 255, 0.5)' }}
          >
            {title}
          </span>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5 transition-transform duration-300",
            isOpen ? "rotate-90" : "rotate-0"
          )}
          style={{ 
            color: '#3b82f6',
            filter: 'drop-shadow(0 0 4px #3b82f6)'
          }}
        />
      </button>

      <div
        className={cn("relative z-10 pb-1 xs:pb-1.5 sm:pb-2 md:pb-2.5", isCollapsed ? "px-3 xs:px-3.5 sm:px-4" : "px-3 xs:px-3.5 sm:px-4 md:px-5")}
      >
        <p
          className={cn(
            "font-semibold leading-tight",
            isCollapsed ? "text-[10px] xs:text-xs sm:text-sm" : "text-[10px] xs:text-xs sm:text-sm md:text-base"
          )}
          style={{ color: '#ffffff', textShadow: '0 0 4px rgba(255, 255, 255, 0.3)' }}
        >
          {title}
        </p>
      </div>

      <motion.div
        id={contentId}
        aria-hidden={!isOpen}
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative z-10 px-2 pb-2 xs:px-2.5 xs:pb-2.5 sm:px-3 sm:pb-3 md:px-4 md:pb-4 overflow-hidden"
      >
        <div className="space-y-1.5" aria-hidden={!isOpen}>
          <p 
            className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm pl-5 xs:pl-6 sm:pl-6 md:pl-7 leading-relaxed"
            style={{ color: '#9ca3af', textShadow: '0 0 2px rgba(156, 163, 175, 0.3)' }}
          >
            {text}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DisclaimerSection;
