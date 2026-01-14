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
    <div className="group relative rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl overflow-hidden transition-all duration-300">
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
          <span className="flex h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 items-center justify-center rounded text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-400 font-mono border border-blue-500/30 bg-blue-500/20 flex-shrink-0">
            {number}
          </span>
          <span className="line-clamp-2 text-xs xs:text-sm sm:text-sm md:text-base font-semibold text-white">
            {title}
          </span>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 xs:h-5 xs:w-5 sm:h-5 sm:w-5 text-blue-400 transition-transform duration-300",
            isOpen ? "rotate-90" : "rotate-0"
          )}
        />
      </button>

      <div className="pointer-events-none absolute inset-0 bg-black border border-blue-500/20 group-hover:border-blue-500/40 rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl transition-all duration-300" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl">
        <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 shimmer-line shimmer-gpu transition-opacity duration-300" />
      </div>

      <div
        className={cn("relative z-10 pb-1 xs:pb-1.5 sm:pb-2 md:pb-2.5", isCollapsed ? "px-3 xs:px-3.5 sm:px-4" : "px-3 xs:px-3.5 sm:px-4 md:px-5")}
      >
        <p
          className={cn(
            "text-white font-semibold leading-tight",
            isCollapsed ? "text-[10px] xs:text-xs sm:text-sm" : "text-[10px] xs:text-xs sm:text-sm md:text-base"
          )}
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
          <p className="text-neutral-400 text-[9px] xs:text-[10px] sm:text-xs md:text-sm pl-5 xs:pl-6 sm:pl-6 md:pl-7 leading-relaxed">
            {text}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DisclaimerSection;
