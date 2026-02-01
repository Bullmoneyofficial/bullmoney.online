"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ChevronRight } from "lucide-react";
import { EnhancedModal } from "./EnhancedModal";

// Neon styles for apps modal
const APPS_NEON_STYLES = `
  .apps-neon-blue-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }
  .apps-neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }
  .apps-neon-blue-icon {
    filter: drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ffffff);
  }
`;

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
    maxWidth="max-w-4xl"
    title={
      <div className="flex items-center gap-2">
        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" />
        <span className="text-white font-medium">Apps & Tools</span>
      </div>
    }
  >
    <div className="space-y-3">
      {apps?.map((app, idx) => (
        <motion.section
          key={app.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="space-y-1.5"
        >
          <h3 className="text-center text-[10px] md:text-xs font-medium uppercase tracking-wider text-white/50">
            {app.title}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {app.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  title={link.label}
                  className="group relative flex items-center justify-between rounded-lg overflow-hidden px-2.5 py-2 text-[11px] md:text-xs bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <span className="relative text-white/90 truncate">{link.label}</span>
                  <ExternalLink className="relative h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1.5 text-white" />
                </Link>
              ))}
              {app.title === "Bullmoney Indicators" && (
                <Link
                  href="https://drive.google.com/drive/folders/1aVKPzJAkUqiZqVQnYIZ7M4E0lNOQ2kIi"
                  target="_blank"
                  className="group relative col-span-2 sm:col-span-3 lg:col-span-2 flex items-center justify-center gap-2 rounded-lg overflow-hidden px-3 py-2 text-xs md:text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all duration-200"
                >
                  <span className="relative flex items-center gap-2">
                    Premium PDFs
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
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
