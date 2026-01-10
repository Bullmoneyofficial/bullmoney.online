"use client";

import React from "react";
import { motion } from "framer-motion";

interface AdminReflectiveCardProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export const AdminReflectiveCard = ({
  title,
  children,
  className = "",
}: AdminReflectiveCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-2xl ${className}`}
    >
      {title && (
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      )}
      {children}
    </motion.div>
  );
};

export default AdminReflectiveCard;
