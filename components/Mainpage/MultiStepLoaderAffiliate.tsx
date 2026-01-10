"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingState {
  text: string;
}

interface MultiStepLoaderAffiliateProps {
  loadingStates?: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}

export const MultiStepLoaderAffiliate = ({
  loadingStates = [
    { text: "Loading affiliate dashboard..." },
    { text: "Fetching your data..." },
    { text: "Preparing analytics..." },
  ],
  loading = false,
  duration = 2000,
  loop = true,
}: MultiStepLoaderAffiliateProps) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentState((prev) => {
        if (prev === loadingStates.length - 1) {
          return loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, duration);

    return () => clearInterval(interval);
  }, [loading, loadingStates.length, duration, loop]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <div className="text-center">
            <motion.div
              key={currentState}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-white text-2xl font-bold"
            >
              {loadingStates[currentState]?.text}
            </motion.div>
            <div className="mt-4 flex justify-center space-x-2">
              {loadingStates.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentState ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Export with both names for backward compatibility
export { MultiStepLoaderAffiliate as MultiStepLoader };
export default MultiStepLoaderAffiliate;
