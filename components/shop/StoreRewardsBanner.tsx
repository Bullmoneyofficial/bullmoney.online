"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Gift, ArrowRight, X } from "lucide-react";

// ============================================================================
// STORE REWARDS BANNER — Static compact rewards card shown above hero
// Compact, premium, non-intrusive — shows loyalty points / promo teaser
// ============================================================================

export function StoreRewardsBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [points] = useState(5000);

  // Check if already dismissed this session
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("rewards-banner-dismissed")) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rewards-banner-dismissed", "1");
    }
  };

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative w-full overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.04),transparent_60%)]" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Left — Rewards Card Mini */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Mini card icon */}
            <div className="relative shrink-0">
              <div className="w-10 h-7 sm:w-12 sm:h-8 rounded-md bg-linear-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                <span className="text-[8px] sm:text-[9px] font-black text-white/40 tracking-tighter">BULL</span>
                <div className="absolute top-0.5 right-0.5">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white/50" />
                </div>
              </div>
              {/* Glow */}
              <div className="absolute -inset-1 bg-white/5 rounded-lg blur-md -z-10" />
            </div>

            {/* Text content */}
            <div className="min-w-0 flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-white/90 text-xs font-semibold">Bull Rewards</span>
                <span className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-bold text-white/70 uppercase tracking-wider">VIP</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-white/60 text-[11px] sm:text-xs">
                <span className="sm:hidden font-semibold text-white/80">Bull Rewards</span>
                <span className="hidden sm:inline">·</span>
                <span>Earn points on every purchase</span>
              </div>
              
              {/* Points badge */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                <span className="text-[10px] text-white/70 font-medium">
                  <span className="text-white font-bold">{points.toLocaleString()}</span> pts available
                </span>
              </div>
            </div>
          </div>

          {/* Right — CTA + Dismiss */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Use code BULL promo */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group">
              <Gift className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors" />
              <span className="text-[10px] text-white/60 group-hover:text-white/80 transition-colors">Use code</span>
              <span className="text-[10px] font-mono font-bold text-white/90">BULL</span>
              <span className="text-[10px] text-white/60 group-hover:text-white/80 transition-colors">for 10% off</span>
            </div>
            
            {/* Mobile promo */}
            <div className="sm:hidden flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
              <span className="text-[9px] font-mono font-bold text-white/80">BULL = 10% OFF</span>
            </div>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="p-1 text-white/30 hover:text-white/70 transition-colors rounded"
              aria-label="Dismiss rewards banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
}
