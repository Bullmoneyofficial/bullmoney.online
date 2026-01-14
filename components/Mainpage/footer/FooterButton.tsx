"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

export interface FooterButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
}

export const FooterButton = ({ onClick, children, variant = "secondary", icon }: FooterButtonProps) => {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        SoundEffects.click();
        onClick();
      }}
      onMouseEnter={() => SoundEffects.hover()}
      className={cn(
        "relative group h-10 sm:h-11 inline-flex items-center justify-center rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-semibold transition-all duration-300 overflow-hidden min-w-[44px]",
        isPrimary && "text-white",
        !isPrimary && "text-neutral-300 hover:text-white"
      )}
    >
      {isPrimary && (
        <span className="absolute inset-[-2px] shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-80 rounded-xl" />
      )}

      <span
        className={cn(
          "absolute inset-[1px] rounded-xl transition-all duration-300",
          isPrimary
            ? "bg-neutral-900 border border-blue-500/50 group-hover:border-blue-400/70 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
            : "bg-neutral-900/90 border-2 border-blue-500/30 group-hover:border-blue-400/60 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        )}
      />

      <span className="absolute inset-0 overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent shimmer-line shimmer-gpu" />
      </span>

      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="text-blue-400">{icon}</span>}
        {children}
      </span>
    </motion.button>
  );
};

export default FooterButton;
