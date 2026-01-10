"use client";

import React from "react";
import Link from "next/link";

export interface NavbarProps {
  setShowConfigurator?: (show: boolean) => void;
  activeThemeId?: string;
  onThemeChange?: (themeId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setShowConfigurator, activeThemeId, onThemeChange }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-white">
            BullMoney
          </Link>
          <div className="flex items-center space-x-6">
            <Link
              href="/about"
              className="text-white/80 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/shop"
              className="text-white/80 hover:text-white transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/contact"
              className="text-white/80 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
