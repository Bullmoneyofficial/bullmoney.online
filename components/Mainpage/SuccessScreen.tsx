"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SuccessScreenProps {
  message?: string;
  onClose?: () => void;
  onUnlock?: () => void;
}

export const SuccessScreen = ({
  message = "Success!",
  onClose,
  onUnlock,
}: SuccessScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {message}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-white text-black rounded-lg hover:bg-white transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SuccessScreen;
