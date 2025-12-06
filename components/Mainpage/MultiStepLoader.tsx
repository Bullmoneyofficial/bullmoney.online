import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for cleaner classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type LoadingState = {
  text: string;
};

interface MultiStepLoaderProps {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
}

export const MultiStepLoader: React.FC<MultiStepLoaderProps> = ({
  loadingStates,
  loading = false,
  duration = 2000,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentStep(0);
      return;
    }

    const timeout = setTimeout(() => {
      setCurrentStep((prev) =>
        prev === loadingStates.length - 1 ? prev : prev + 1
      );
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentStep, loading, duration, loadingStates.length]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex h-full w-full items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="relative h-96 w-full max-w-lg overflow-hidden rounded-2xl bg-white p-4 shadow-2xl dark:bg-neutral-900">
            <div className="relative flex h-full flex-col justify-center px-4">
              
              {/* Title Header */}
              <h3 className="mb-8 text-center text-xl font-bold text-neutral-800 dark:text-neutral-200">
                Processing Request
              </h3>

              {loadingStates.map((state, index) => {
                // Calculate distance from current step for visual focus
                const distance = Math.abs(index - currentStep);
                const opacity = Math.max(1 - distance * 0.2, 0.2); // Fade out distant items
                const isCurrent = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: opacity, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "mb-4 flex items-center gap-4 text-lg",
                      isCurrent ? "font-semibold text-black dark:text-white" : "text-neutral-500"
                    )}
                  >
                    {/* Status Icons */}
                    <div className="flex h-6 w-6 items-center justify-center">
                      {isCompleted ? (
                        <CheckIcon className="h-6 w-6 text-green-500" />
                      ) : isCurrent ? (
                        <CheckFilled className="h-6 w-6 text-blue-500 animate-pulse" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                      )}
                    </div>
                    
                    {state.text}
                  </motion.div>
                );
              })}
            </div>
            
            {/* Subtle Gradient overlay at bottom to mask long lists */}
            <div className="absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-white to-transparent dark:from-neutral-900" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Simple SVG Components to keep it dependency-free regarding icons
const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
};