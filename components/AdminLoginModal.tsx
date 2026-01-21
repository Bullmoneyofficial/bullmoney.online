"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, type TargetAndTransition } from "framer-motion";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";

export interface AdminLoginModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onLogin?: (username: string, password: string) => void;
}

export const AdminLoginModal = ({
  isOpen,
  open,
  onClose,
  onLogin,
}: AdminLoginModalProps) => {
  const modalOpen = isOpen ?? open ?? false;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { isMobile, animations, shouldDisableBackdropBlur } = useMobilePerformance();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      onLogin(username, password);
    }
  };

  return (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          initial={animations.modalBackdrop.initial}
          animate={animations.modalBackdrop.animate as TargetAndTransition}
          exit={animations.modalBackdrop.exit}
          transition={animations.modalBackdrop.transition}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 ${
            shouldDisableBackdropBlur ? '' : 'backdrop-blur-sm'
          }`}
          onClick={onClose}
        >
          <motion.div
            initial={animations.modalContent.initial}
            animate={animations.modalContent.animate as TargetAndTransition}
            exit={animations.modalContent.exit}
            transition={animations.modalContent.transition}
            className={`bg-gray-900 rounded-lg p-8 max-w-md w-full mx-4 ${
              isMobile ? '' : 'shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Admin Login</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-white mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-white mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminLoginModal;
