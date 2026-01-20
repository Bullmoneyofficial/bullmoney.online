"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ChevronRight } from "lucide-react";
import { EnhancedModal } from "./EnhancedModal";

// Neon styles for apps modal
const APPS_NEON_STYLES = `
  .apps-neon-blue-text {
    color: #3b82f6;
    text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
  }
  .apps-neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }
  .apps-neon-blue-icon {
    filter: drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6);
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
  <>
    <style dangerouslySetInnerHTML={{ __html: APPS_NEON_STYLES }} />
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 apps-neon-blue-icon" style={{ color: '#3b82f6' }} />
          <span className="apps-neon-white-text">Apps & Tools</span>
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
            <h3 className="text-center text-[11px] xs:text-xs sm:text-sm md:text-sm font-bold uppercase tracking-widest apps-neon-blue-text">
              {app.title}
            </h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3">
              {app.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  title={link.label}
                  className="group relative flex items-center justify-between rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl overflow-hidden p-2 xs:p-2.5 sm:p-3 md:p-4 text-[10px] xs:text-xs sm:text-sm md:text-sm transition-all duration-300 hover:scale-105"
                >
                  {/* Static neon border */}
                  <div 
                    className="absolute inset-0 bg-black rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl transition-all duration-300"
                    style={{
                      border: '1px solid #3b82f6',
                      boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)'
                    }}
                  />
                  {/* Hover state - brighter neon */}
                  <div 
                    className="absolute inset-0 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      border: '1px solid #3b82f6',
                      boxShadow: '0 0 8px #3b82f6, 0 0 16px rgba(59, 130, 246, 0.5), inset 0 0 4px rgba(59, 130, 246, 0.2)'
                    }}
                  />
                  <span className="relative z-10 apps-neon-white-text truncate">{link.label}</span>
                  <ExternalLink className="relative z-10 h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 opacity-0 transition-all group-hover:opacity-100 apps-neon-blue-icon flex-shrink-0 ml-1.5" style={{ color: '#3b82f6' }} />
                </Link>
              ))}
              {app.title === "Bullmoney Indicators" && (
                <Link
                  href="https://drive.google.com/drive/folders/1aVKPzJAkUqiZqVQnYIZ7M4E0lNOQ2kIi"
                  target="_blank"
                  className="group relative col-span-1 xs:col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2 md:gap-2 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl overflow-hidden p-2 xs:p-2.5 sm:p-3 md:p-4 text-[10px] xs:text-xs sm:text-sm md:text-sm font-semibold transition-all duration-300 hover:scale-105"
                >
                  {/* Static neon border for premium button */}
                  <span 
                    className="absolute inset-0 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl"
                    style={{
                      border: '2px solid #3b82f6',
                      boxShadow: '0 0 8px #3b82f6, 0 0 16px #3b82f6, inset 0 0 8px rgba(59, 130, 246, 0.3)'
                    }}
                  />
                  <span className="absolute inset-[2px] bg-black rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
                  <span className="relative z-10 flex items-center gap-1.5 xs:gap-2 sm:gap-2 md:gap-2 apps-neon-white-text">
                    Premium PDFs
                    <ChevronRight className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform apps-neon-blue-icon" style={{ color: '#3b82f6' }} />
                  </span>
                </Link>
              )}
            </div>
          </motion.section>
        ))}
      </div>
    </EnhancedModal>
  </>
);

export default AppsModal;
