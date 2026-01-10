"use client";

import React from "react";
import { motion } from "framer-motion";

export const EvervaultCard = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  return (
    <div className={className}>
      <div className="relative h-full w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {text && (
            <span className="text-white text-xl font-bold">{text}</span>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EvervaultCard;
