"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBlog } from "./BlogContext"; // Ensure path matches where you saved BlogContext

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AdminLoginModal({ open, onClose }: Props) {
  const { state, login, logout } = useBlog();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isAdmin) {
      logout();
      setUsername("");
      setPassword("");
      setError(null);
      onClose();
      return;
    }

    const success = login(username.trim(), password.trim());
    if (!success) {
      setError("Invalid credentials.");
    } else {
      setError(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md mx-4 rounded-3xl overflow-hidden border border-sky-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-[0_0_45px_rgba(255, 255, 255,0.45)] p-[1px]"
          >
            <div className="rounded-3xl bg-slate-950 py-6 px-5 sm:px-7">
              <h3 className="text-lg font-semibold mb-1">
                {state.isAdmin ? "Sign out admin" : "Admin login"}
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Login to manage blog posts and categories.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!state.isAdmin && (
                  <>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1.5">
                        Username
                      </label>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl bg-slate-900/80 border border-slate-700 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs px-3 py-2 rounded-full border border-slate-700 bg-slate-900/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-5 py-2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 font-semibold shadow-[0_0_25px_rgba(255, 255, 255,0.45)]"
                  >
                    {state.isAdmin ? "Logout" : "Login"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}