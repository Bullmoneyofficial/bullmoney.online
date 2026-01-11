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
    { text: "Loading..." },
    { text: "Preparing your content..." },
    { text: "Almost there..." },
  ],
  loading = false,
  duration = 2000,
  loop = true,
}: MultiStepLoaderProps) => {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
        >
          {/* Blue shimmer background like navbar */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="absolute inset-[-100%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-15" />
          </div>
          
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none" />
          
          <div className="text-center relative z-10">
            <motion.div
              key={currentState}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-blue-300 text-2xl font-bold"
            >
              {loadingStates[currentState]?.text}
            </motion.div>
            <div className="mt-4 flex justify-center space-x-2">
              {loadingStates.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentState 
                      ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
                      : "bg-blue-500/30"
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

export default MultiStepLoader;
