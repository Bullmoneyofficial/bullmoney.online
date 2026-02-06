"use client";

import React from "react";
import { motion } from "framer-motion";

interface TradingHoldUnlockProps {
  onUnlock?: () => void;
}

export const TradingHoldUnlock = ({ onUnlock }: TradingHoldUnlockProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-8 bg-linear-to-br from-gray-900 to-black rounded-lg"
    >
      <h2 className="text-2xl font-bold text-white mb-4">Trading Locked</h2>
      <p className="text-gray-400 mb-6 text-center">
        Hold to unlock trading features
      </p>
      <button
        onClick={onUnlock}
        className="px-8 py-3 bg-white text-black rounded-lg hover:bg-white transition-colors"
      >
        Unlock Trading
      </button>
    </motion.div>
  );
};

export default TradingHoldUnlock;
