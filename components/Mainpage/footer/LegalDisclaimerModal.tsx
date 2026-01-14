"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EnhancedModal } from "./EnhancedModal";
import { DisclaimerSection } from "./DisclaimerSection";

export interface LegalDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    number: "01",
    title: "No Financial Advice & Education Only",
    text: "Bullmoney is strictly an educational platform and software provider. We are NOT financial advisors, brokers, or registered investment analysts. No content herein constitutes a recommendation to buy or sell any specific asset. You are solely responsible for your own investment decisions.",
  },
  {
    number: "02",
    title: "Extreme Risk Warning",
    text: "Trading Foreign Exchange (Forex) and Contracts for Difference (CFDs) on margin carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. There is a possibility that you may sustain a loss of some or all of your initial investment.",
  },
  {
    number: "03",
    title: "Shop Policy: Digital Goods & Refunds",
    text: "All products sold via the Bullmoney Shop (including Indicators, PDFs, software, and courses) are intangible digital goods. Due to the nature of digital content, ALL SALES ARE FINAL. We do not offer refunds once the product has been accessed or downloaded. These tools are technical aids and do not guarantee profitability.",
  },
  {
    number: "04",
    title: "Affiliate Disclosure",
    text: "Bullmoney may contain affiliate links to third-party brokerage services. We may receive a commission if you sign up through our links. This does not impact the cost to you. We do not own, operate, or control these third-party brokers and are not liable for their solvency or actions.",
  },
  {
    number: "05",
    title: "Jurisdictional Restrictions",
    text: "Services and products are not intended for distribution to any person in any country where such distribution or use would be contrary to local law or regulation. It is the responsibility of the visitor to ascertain the terms of and comply with any local law or regulation to which they are subject.",
  },
  {
    number: "06",
    title: "Limitation of Liability",
    text: "Under no circumstances shall Bullmoney, its owners, or affiliates be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our website, shop products, or signals. You assume full responsibility for your trading results.",
  },
];

export const LegalDisclaimerModal = ({ isOpen, onClose }: LegalDisclaimerModalProps) => {
  const [openSection, setOpenSection] = useState<string | null>("01");

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title={
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2 text-white">
          <ShieldAlert className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
          <span className="text-xs xs:text-sm sm:text-base truncate">Legal & Financial Disclaimer</span>
        </div>
      }
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto footer-scrollbar space-y-4 sm:space-y-6 text-sm leading-relaxed text-neutral-400 pr-1 sm:pr-2 pb-24 sm:pb-20">
          <div className="relative overflow-hidden rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl border border-red-500/30 bg-red-950/50 p-2.5 xs:p-3 sm:p-4 md:p-5">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 bg-red-500/20 rounded-full pointer-events-none" />
            <div className="absolute inset-0 overflow-hidden rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl">
              <div className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-transparent via-red-500/10 to-transparent shimmer-line shimmer-gpu" style={{ animationDuration: "4s" }} />
            </div>
            <div className="relative flex gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-bold text-white tracking-wide uppercase mb-0.5 xs:mb-1">Critical Legal Notice</h2>
                <p className="text-[8px] xs:text-[9px] sm:text-xs md:text-xs text-red-200/70 leading-tight">
                  This agreement affects your legal rights. Please read extensively before using our Shop or Services.
                </p>
              </div>
            </div>
          </div>

          <p className="text-neutral-300 text-[10px] xs:text-xs sm:text-sm md:text-base">
            By accessing <span className="font-semibold text-white">Bullmoney</span> (the “Site”), purchasing products from the Shop, or using our services, you acknowledge and agree to the following terms without reservation.
          </p>

          <div className="space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4">
            {SECTIONS.map((section) => (
              <DisclaimerSection
                key={section.number}
                number={section.number}
                title={section.title}
                text={section.text}
                isOpen={openSection === section.number}
                onToggle={(id) => setOpenSection((prev) => (prev === id ? null : id))}
              />
            ))}
          </div>

          <div className="py-1 xs:py-1.5 sm:py-2">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          </div>

          <p className="italic text-neutral-500 text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-center px-1 xs:px-2 sm:px-4">
            By clicking &quot;I Agree &amp; Understand&quot; below, you legally confirm that you have read, understood, and accepted full responsibility for your actions on this platform.
          </p>
        </div>

        <div className="sticky bottom-0 z-10 bg-neutral-950 mt-3 xs:mt-4 sm:mt-5 md:mt-6 pt-3 xs:pt-3.5 sm:pt-4 md:pt-4 pb-[env(safe-area-inset-bottom,0px)] px-3 xs:px-4 sm:px-5 md:px-6 border-t border-blue-500/20 flex justify-center sm:justify-end shrink-0 shadow-[0_-8px_20px_rgba(0,0,0,0.6)]">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex w-full sm:w-auto items-center justify-center gap-2 px-3 xs:px-4 sm:px-5 md:px-6 py-1.5 xs:py-1.75 sm:py-2 md:py-2.5 overflow-hidden rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl text-[10px] xs:text-xs sm:text-sm md:text-sm font-semibold transition-all active:scale-95"
          >
            <span className="absolute inset-[-2px] shimmer-spin shimmer-gpu bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_0%,#22c55e_50%,#00000000_100%)] opacity-80 rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
            <span className="absolute inset-[1px] bg-white rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl" />
            <span className="relative z-10 flex items-center gap-1.5 xs:gap-2 sm:gap-2 text-black whitespace-nowrap">
              I Agree & Understand
              <CheckCircle2 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
            </span>
          </motion.button>
        </div>
      </div>
    </EnhancedModal>
  );
};

export default LegalDisclaimerModal;
