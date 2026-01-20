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
          {/* Neon blue glow styles */}
          <style jsx global>{`
            @keyframes neon-pulse {
              0%, 100% { 
                text-shadow: 0 0 10px #1e3a8a, 0 0 20px #1e3a8a, 0 0 30px #1e40af;
                filter: brightness(1);
              }
              50% { 
                text-shadow: 0 0 15px #1e3a8a, 0 0 30px #1e3a8a, 0 0 45px #1e40af;
                filter: brightness(1.2);
              }
            }
            @keyframes neon-refresh-burst {
              0% { 
                text-shadow: 0 0 5px #1e3a8a, 0 0 10px #1e3a8a;
                transform: scale(0.9);
                filter: brightness(0.8);
              }
              50% { 
                text-shadow: 0 0 20px #1e3a8a, 0 0 40px #1e3a8a, 0 0 60px #1e40af, 0 0 80px #1e40af;
                transform: scale(1.1);
                filter: brightness(1.5);
              }
              100% { 
                text-shadow: 0 0 10px #1e3a8a, 0 0 20px #1e3a8a, 0 0 30px #1e40af;
                transform: scale(1);
                filter: brightness(1);
              }
            }
            .neon-blue-text {
              color: #1e40af;
            }
          `}</style>
          
          {/* Blue shimmer background like navbar */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="absolute inset-[-100%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#1e3a8a_50%,#00000000_100%)] opacity-15" />
          </div>
          
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/40 via-transparent to-transparent pointer-events-none" />
          
          <div className="text-center relative z-10">
            <motion.div
              key={currentState}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="text-blue-700 text-2xl md:text-3xl lg:text-4xl font-bold neon-blue-text"
              style={{ 
                textShadow: '0 0 10px #1e3a8a, 0 0 20px #1e3a8a, 0 0 30px #1e40af',
                animation: (currentState === loadingStates.length - 1) 
                  ? 'neon-refresh-burst 1s ease-out infinite' 
                  : 'neon-pulse 2s ease-in-out infinite'
              }}
            >
              {isRefresh && currentState === loadingStates.length - 1 
                ? "WEBSITE REFRESHED" 
                : loadingStates[currentState]?.text}
            </motion.div>
            <div className="mt-4 flex justify-center space-x-2">
              {loadingStates.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentState 
                      ? "bg-blue-700 shadow-[0_0_10px_rgba(30,58,138,0.8),_0_0_20px_rgba(30,64,175,0.6)]" 
                      : "bg-blue-900/40"
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
