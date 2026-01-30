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
  isRefresh?: boolean;
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
  isRefresh = false,
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
          className="fixed top-0 left-0 right-0 bottom-0 z-[999999] flex items-center justify-center select-none overflow-visible pointer-events-none bg-transparent"
          style={{
            width: "100vw",
            height: "100vh",
            margin: 0,
            padding: 0,
            background: "none",
            boxShadow: "none"
          }}
        >
          <div className="text-center w-full px-4" style={{ background: "none" }}>
            <motion.div
              key={currentState}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="text-white text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold"
              style={{
                textShadow: '0 0 10px #ffffff, 0 0 20px #ffffff, 0 0 30px #ffffff',
                background: "none"
              }}
            >
              {isRefresh && currentState === totalSteps - 1
                ? "WEBSITE REFRESHED"
                : safeLoadingStates[currentState]?.text}
            </motion.div>
            <div className="mt-4 flex justify-center space-x-2">
              {safeLoadingStates.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 md:h-3 md:w-3 rounded-full transition-all duration-300 ${
                    index === currentState
                      ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8),_0_0_20px_rgba(255,255,255,0.6)]"
                      : "bg-white/40"
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
