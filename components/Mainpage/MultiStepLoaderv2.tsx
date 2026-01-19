"use client";

import React, { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIState } from "@/contexts/UIStateContext";
import { isMobileDevice } from "@/lib/mobileDetection";

interface LoadingState {
  text: string;
}

interface MultiStepLoaderV2Props {
  loadingStates?: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  onFinished?: () => void;
  reducedAnimations?: boolean; // Mobile optimization flag
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
  onFinished = () => {},
  reducedAnimations = false,
}: MultiStepLoaderV2Props) => {
  const [currentState, setCurrentState] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // --- UI STATE CONTEXT: Signal to minimize audio widget while loader is active ---
  const { setLoaderv2Open } = useUIState();
  
  // ✅ MOBILE DETECTION - Detect once on mount to avoid re-renders
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);
  
  // ✅ OPTIMIZED DURATION FOR MOBILE
  const optimizedDuration = useMemo(() => {
    if (isMobile) {
      return Math.max(duration, 2500); // Slightly longer on mobile for stability
    }
    return duration;
  }, [duration, isMobile]);
  
  // Use useLayoutEffect to set state BEFORE browser paint - ensures AudioWidget sees it on first render
  // When loading is true, set isLoaderv2Open to true. When loading is false, set it to false.
  useLayoutEffect(() => {
    setLoaderv2Open(loading);
  }, [loading, setLoaderv2Open]);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentState((prev) => {
        if (prev === loadingStates.length - 1) {
          if (!loop) {
            onFinished();
            return prev;
          }
          return loop ? 0 : prev;
        }
        return prev + 1;
      });
    }, optimizedDuration);

    return () => clearInterval(interval);
  }, [loading, loadingStates.length, optimizedDuration, loop]);

  // ✅ ANIMATION CONFIG - Reduced animations on mobile for better FPS
  const animationConfig = useMemo(() => ({
    useReducedMotion: isMobile || reducedAnimations,
  }), [isMobile, reducedAnimations]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: animationConfig.useReducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={animationConfig.useReducedMotion ? { duration: 0 } : { duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-sm"
        >
          <div className="text-center">
            <motion.div
              key={currentState}
              initial={{ opacity: 0, y: animationConfig.useReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: animationConfig.useReducedMotion ? 0 : -20 }}
              transition={animationConfig.useReducedMotion ? { duration: 0 } : { duration: 0.2 }}
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
                  transition={animationConfig.useReducedMotion ? { duration: 0 } : { duration: 0.2 }}
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
