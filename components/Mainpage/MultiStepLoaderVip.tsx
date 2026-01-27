"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingState {
  text: string;
}

interface MultiStepLoaderProps {
  loadingStates?: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}

export const MultiStepLoader = ({
  loadingStates = [
    { text: "Loading VIP content..." },
    { text: "Preparing your experience..." },
    { text: "Almost ready..." },
  ],
  loading = false,
  duration = 2000,
  loop = true,
}: MultiStepLoaderProps) => {
  const [currentState, setCurrentState] = useState(0);
  const safeLoadingStates = loadingStates.length
    ? loadingStates
    : [{ text: "Loading..." }];
  const totalSteps = safeLoadingStates.length;

  useEffect(() => {
    if (currentState > totalSteps - 1) {
      setCurrentState(Math.max(0, totalSteps - 1));
    }
  }, [currentState, totalSteps]);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }

    if (totalSteps <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentState((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          if (loop) {
            return 0;
          }
          clearInterval(interval);
          return totalSteps - 1;
        }
        return next;
      });
    }, duration);

    return () => clearInterval(interval);
  }, [loading, totalSteps, duration, loop]);

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
export { MultiStepLoader as MultiStepLoaderVip };
export default MultiStepLoader;
