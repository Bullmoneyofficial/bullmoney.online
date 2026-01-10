"use client";
import Link from "next/link";
import React from "react";
import { Logo } from "./logo";
import { motion } from "framer-motion";
import { FaInstagram } from "react-icons/fa"; 

export function Footer() {
  const currentYear = new Date().getFullYear();
  const instagramUrl = "https://www.instagram.com/bullmoney.online/";

  // Headline to shimmer
  const footerHeadline = "Bull Money"; 

  return (
    <>
      {/* Global styles for the shimmer effect */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer { animation: shimmer 3s linear infinite; }
      `}</style>

      <div className="border-t border-neutral-100 dark:border-white/[0.1] px-8 py-10 bg-white dark:bg-neutral-950 w-full relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Left: Logo & Copyright (Centered on Mobile) */}
          <div className="flex flex-col items-center md:items-start gap-4 md:order-1">
            {/* Scaled Wrapper for Logo */}
            <div className="scale-125 md:scale-150 origin-center md:origin-left p-1"> 
              <Logo />
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light tracking-wide text-center md:text-left">
              &copy; {currentYear} BullMoney. All rights reserved.
            </p>
          </div>

          {/* Center: Shimmer Headline */}
          <div className="flex flex-col items-center justify-center w-full md:order-2">
            <h2 className="text-3xl md:text-5xl font-serif font-black leading-tight tracking-tighter text-center">
              {footerHeadline.split(" ").map((word: string, i: number) => (
                <span
                    key={i}
                    className="inline-block mr-3 text-transparent bg-clip-text
                               bg-[linear-gradient(110deg,#000000,45%,#3b82f6,55%,#000000)]
                               dark:bg-[linear-gradient(110deg,#FFFFFF,45%,#3b82f6,55%,#FFFFFF)]
                               bg-[length:250%_100%] animate-shimmer"
                >
                  {word}
                </span>
              ))}
            </h2>
          </div>
          
          {/* Right: Instagram Link */}
          <div className="flex items-center gap-4 md:order-3">
              <Link href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-#3b82f6 dark:hover:text-#60a5fa transition-colors"
                  >
                      <FaInstagram size={24} />
                  </motion.div>
              </Link>
          </div>

        </div>

        {/* Subtle Background Glow - Green for Bull Market */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[100px] bg-#3b82f6/10 blur-[100px] pointer-events-none" />
      </div>
    </>
  );
}