"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PremiumShimmerBorder, PremiumButton } from "./PremiumUIComponents";

export interface NavbarProps {
  setShowConfigurator?: (show: boolean) => void;
  activeThemeId?: string;
  onThemeChange?: (themeId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setShowConfigurator, activeThemeId, onThemeChange }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-blue-500/20 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-neutral-950/80">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between h-16">
          {/* Logo with shimmer */}
          <PremiumShimmerBorder className="w-12 h-12 rounded-full">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center hover:bg-slate-900 transition-colors">
              <Link href="/" className="font-black text-blue-400 text-lg">BM</Link>
            </div>
          </PremiumShimmerBorder>

          {/* Navigation links */}
          <div className="hidden md:flex gap-8">
            {["About", "Shop", "Contact"].map((link) => (
              <Link key={link} href={`/${link.toLowerCase()}`}>
                <motion.span
                  whileHover={{ color: "#3b82f6", textShadow: "0 0 10px rgba(59, 130, 246, 0.5)" }}
                  className="text-sm uppercase font-bold tracking-wider text-white/80 transition-all cursor-pointer"
                >
                  {link}
                </motion.span>
              </Link>
            ))}
          </div>

          {/* Action button */}
          <div className="flex gap-3">
            <PremiumButton className="w-32 h-12" size="md">
              Connect
            </PremiumButton>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
