"use client";

import React from "react";
import Link from "next/link";

export const Socialsfooter = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-md border-t border-white/10 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <p className="text-white/60 text-sm">
              © 2024 BullMoney. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              Twitter
            </Link>
            <Link
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              Discord
            </Link>
            <Link
              href="https://telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors"
            >
              Telegram
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Socialsfooter;
