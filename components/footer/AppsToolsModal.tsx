"use client";

import React, { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X, ExternalLink } from "lucide-react";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

interface AppsToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppsToolsContent = memo(function AppsToolsContent() {
  const apps = [
    { name: "TradingView", icon: "📊", url: "https://tradingview.com", desc: "Advanced charting platform" },
    { name: "MetaTrader 4", icon: "📈", url: "https://metatrader4.com", desc: "Forex trading platform" },
    { name: "MetaTrader 5", icon: "📉", url: "https://metatrader5.com", desc: "Multi-asset platform" },
    { name: "Discord", icon: "💬", url: "https://discord.gg/bullmoney", desc: "Community chat" },
    { name: "Telegram", icon: "✈️", url: "https://t.me/bullmoneyonline", desc: "Updates & setups" },
  ];

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <a
          key={app.name}
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => SoundEffects.click()}
          className="flex items-center gap-4 p-4 bg-black rounded-xl transition-all hover:brightness-110 group neon-blue-border"
        >
          <span className="text-2xl">{app.icon}</span>
          <div className="flex-1">
            <p className="font-medium transition-all neon-blue-text">
              {app.name}
            </p>
            <p className="text-xs text-gray-400">
              {app.desc}
            </p>
          </div>
          <ExternalLink className="w-4 h-4 neon-blue-icon" style={{ color: "#ffffff" }} />
        </a>
      ))}
    </div>
  );
});

const AppsToolsModal = memo(function AppsToolsModal({ isOpen, onClose }: AppsToolsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex flex-col bg-black"
          style={{ zIndex: 2147483647 }}
        >
          <div
            className="flex items-center justify-between p-4 shrink-0"
            style={{
              borderBottom: "2px solid #ffffff",
              boxShadow: "0 2px 8px #ffffff, 0 4px 16px rgba(255, 255, 255, 0.4)",
            }}
          >
            <h2 className="text-lg font-bold neon-blue-text">Apps & Tools</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                SoundEffects.click();
                onClose();
              }}
              className="p-2 rounded-full bg-black transition-all neon-blue-border"
              style={{ zIndex: 2147483647 }}
            >
              <X className="w-5 h-5 neon-white-icon" style={{ color: "#ffffff" }} />
            </motion.button>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto p-4"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
          >
            <AppsToolsContent />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

export { AppsToolsModal };
export default AppsToolsModal;
