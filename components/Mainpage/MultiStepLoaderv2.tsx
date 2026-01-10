"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingState {
  text: string;
}

interface MultiStepLoaderV2Props {
  loadingStates?: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
}

export const MultiStepLoaderV2 = ({
  loadingStates = [
    { text: "Initializing..." },
    { text: "Loading resources..." },
    { text: "Finalizing..." },
  ],
  loading = false,
  duration = 2000,
  loop = true,
}: MultiStepLoaderV2Props) => {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-sm"
        >
          <div className="text-center">
            <motion.div
              key={currentState}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-white text-2xl font-bold mb-4"
            >
              {loadingStates[currentState]?.text}
            </motion.div>
            <div className="flex justify-center space-x-2">
              {loadingStates.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`h-3 w-3 rounded-full ${
                    index === currentState ? "bg-blue-500" : "bg-white/30"
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

export default MultiStepLoaderV2;
