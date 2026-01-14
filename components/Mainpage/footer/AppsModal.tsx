"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ChevronRight } from "lucide-react";
import { EnhancedModal } from "./EnhancedModal";

export interface AppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps?: {
    title: string;
    links: { label: string; href: string }[];
  }[];
}

const defaultApps: AppsModalProps["apps"] = [
  {
    title: "MetaTrader 5",
    links: [
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5&pcampaignid=web_share" },
      { label: "App Store (ZA)", href: "https://apps.apple.com/za/app/metatrader-5/id413251709" },
      { label: "App Store (SC)", href: "https://apps.apple.com/sc/app/metatrader-5/id413251709" },
    ],
  },
  {
    title: "TradingView",
    links: [
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.tradingview.tradingviewapp&pcampaignid=web_share" },
      { label: "App Store", href: "https://apps.apple.com/us/app/tradingview-track-all-markets/id1205990992" },
      { label: "Windows (.msix)", href: "https://tvd-packages.tradingview.com/stable/latest/win32/TradingView.msix" },
      { label: "macOS (.dmg)", href: "https://tvd-packages.tradingview.com/stable/latest/darwin/TradingView.dmg" },
    ],
  },
  {
    title: "Bullmoney Indicators",
    links: [
      { label: "Premium", href: "https://www.tradingview.com/script/OCrInl1O-BULLMONEY-PREMIUM/" },
      { label: "Free", href: "https://www.tradingview.com/script/CaYXTswS-BULLMONEY/" },
    ],
  },
];

export const AppsModal = ({ isOpen, onClose, apps = defaultApps }: AppsModalProps) => (
  <EnhancedModal
    isOpen={isOpen}
    onClose={onClose}
    title={
      <div className="flex items-center gap-2 text-white">
        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
        <span>Apps & Tools</span>
      </div>
    }
  >
    <div className="space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-7 lg:space-y-8">
      {apps?.map((app, idx) => (
        <motion.section
          key={app.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4"
        >
          <h3 className="text-center text-[11px] xs:text-xs sm:text-sm md:text-sm font-bold uppercase tracking-widest text-blue-400/80">
            {app.title}
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
            {app.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                title={link.label}
                className="group relative flex items-center justify-between rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl overflow-hidden p-2 xs:p-2.5 sm:p-3 md:p-4 text-[10px] xs:text-xs sm:text-sm md:text-sm text-neutral-300 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-neutral-900 border border-blue-500/20 group-hover:border-blue-500/50 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl transition-all duration-300" />
                <div className="absolute inset-0 overflow-hidden rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl">
                  <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 shimmer-line shimmer-gpu transition-opacity duration-300" />
                </div>
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 rounded-t-lg sm:rounded-t-xl transition-opacity duration-300" />
                <span className="relative z-10 group-hover:text-white transition-colors truncate">{link.label}</span>
                <ExternalLink className="relative z-10 h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 opacity-0 transition-all group-hover:opacity-100 text-blue-400 flex-shrink-0 ml-1.5" />
              </Link>
            ))}
            {app.title === "Bullmoney Indicators" && (
              <Link
                href="https://drive.google.com/drive/folders/1aVKPzJAkUqiZqVQnYIZ7M4E0lNOQ2kIi"
                target="_blank"
                className="group relative col-span-1 xs:col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2 md:gap-2 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl overflow-hidden p-2 xs:p-2.5 sm:p-3 md:p-4 text-[10px] xs:text-xs sm:text-sm md:text-sm font-semibold text-white transition-all duration-300 hover:scale-105"
              >
                <span className="absolute inset-[-2px] shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#3b82f6_50%,#00000000_100%)] opacity-80 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
                <span className="absolute inset-[1px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
                <span className="relative z-10 flex items-center gap-1.5 xs:gap-2 sm:gap-2 md:gap-2">
                  Premium PDFs
                  <ChevronRight className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            )}
          </div>
        </motion.section>
      ))}
    </div>
  </EnhancedModal>
);

export default AppsModal;
