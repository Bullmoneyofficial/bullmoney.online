import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Z_INDEX } from "../constants/zIndex";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";

interface ButtonTooltipProps {
  show: boolean;
  text: string;
  position?: "right" | "left" | "top" | "bottom";
  color?: "blue" | "purple" | "red" | "green" | "orange";
}

export const ButtonTooltip = React.memo(function ButtonTooltip({ 
  show, 
  text, 
  position = "right",
  color = "blue"
}: ButtonTooltipProps) {
  const { shouldSkipHeavyEffects } = useMobilePerformance();
  const colorClasses = {
    blue: "from-blue-600/95 via-cyan-500/95 to-blue-600/95 border-blue-400/50 shadow-blue-500/30",
    purple: "from-purple-600/95 via-pink-500/95 to-purple-600/95 border-purple-400/50 shadow-purple-500/30",
    red: "from-red-600/95 via-rose-500/95 to-red-600/95 border-red-400/50 shadow-red-500/30",
    green: "from-green-600/95 via-emerald-500/95 to-green-600/95 border-green-400/50 shadow-green-500/30",
    orange: "from-orange-600/95 via-amber-500/95 to-orange-600/95 border-orange-400/50 shadow-orange-500/30"
  };

  const positionClasses = {
    right: "left-full ml-3 top-1/2 -translate-y-1/2",
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2"
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: position === "right" ? -10 : position === "left" ? 10 : 0, y: position === "top" ? 10 : position === "bottom" ? -10 : 0 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={cn("absolute whitespace-nowrap pointer-events-none", positionClasses[position])}
          style={{ zIndex: Z_INDEX.TOOLTIPS }}
        >
          <div className={cn(
            "px-3 py-2 rounded-xl text-white text-[10px] font-semibold shadow-xl border bg-gradient-to-r",
            shouldSkipHeavyEffects ? '' : 'backdrop-blur-md',
            colorClasses[color]
          )}>
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity }}
            >
              {text}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
