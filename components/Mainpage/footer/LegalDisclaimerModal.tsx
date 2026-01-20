"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EnhancedModal } from "./EnhancedModal";
import { DisclaimerSection } from "./DisclaimerSection";

// Neon styles for legal disclaimer modal
const LEGAL_NEON_STYLES = `
  .legal-neon-blue-text {
    color: #3b82f6;
    text-shadow: 0 0 4px #3b82f6, 0 0 8px #3b82f6;
  }
  .legal-neon-white-text {
    color: #ffffff;
    text-shadow: 0 0 4px #ffffff, 0 0 8px #ffffff;
  }
  .legal-neon-red-text {
    color: #ef4444;
    text-shadow: 0 0 4px #ef4444, 0 0 8px #ef4444;
  }
  .legal-neon-red-icon {
    filter: drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 8px #ef4444);
  }
  .legal-neon-green-icon {
    filter: drop-shadow(0 0 4px #22c55e) drop-shadow(0 0 8px #22c55e);
  }
`;

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
    text: "Under no circumstances shall Bullmoney, its owners, or affiliates be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our website, shop products, or setups. You assume full responsibility for your trading results.",
  },
];

export const LegalDisclaimerModal = ({ isOpen, onClose }: LegalDisclaimerModalProps) => {
  const [openSection, setOpenSection] = useState<string | null>("01");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LEGAL_NEON_STYLES }} />
      <EnhancedModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-3xl"
        title={
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2">
            <ShieldAlert className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 legal-neon-red-icon flex-shrink-0" style={{ color: '#ef4444' }} />
            <span className="text-xs xs:text-sm sm:text-base truncate legal-neon-white-text">Legal & Financial Disclaimer</span>
          </div>
        }
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto footer-scrollbar space-y-4 sm:space-y-6 text-sm leading-relaxed pr-1 sm:pr-2 pb-24 sm:pb-20">
            {/* Critical Legal Notice - Neon styled */}
            <div 
              className="relative overflow-hidden rounded-lg xs:rounded-xl sm:rounded-xl md:rounded-xl p-2.5 xs:p-3 sm:p-4 md:p-5 bg-black"
              style={{
                border: '2px solid #ef4444',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5), 0 0 16px rgba(239, 68, 68, 0.3), inset 0 0 8px rgba(239, 68, 68, 0.1)'
              }}
            >
              <div className="relative flex gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
                <div className="shrink-0 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 legal-neon-red-icon" style={{ color: '#ef4444' }} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-bold legal-neon-white-text tracking-wide uppercase mb-0.5 xs:mb-1">Critical Legal Notice</h2>
                  <p className="text-[8px] xs:text-[9px] sm:text-xs md:text-xs leading-tight" style={{ color: '#fca5a5', textShadow: '0 0 4px rgba(252, 165, 165, 0.5)' }}>
                    This agreement affects your legal rights. Please read extensively before using our Shop or Services.
                  </p>
                </div>
              </div>
            </div>

            <p className="legal-neon-white-text text-[10px] xs:text-xs sm:text-sm md:text-base">
              By accessing <span className="font-semibold legal-neon-blue-text">Bullmoney</span> (the &quot;Site&quot;), purchasing products from the Shop, or using our services, you acknowledge and agree to the following terms without reservation.
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

            {/* Neon divider */}
            <div className="py-1 xs:py-1.5 sm:py-2">
              <div 
                className="h-px w-full"
                style={{
                  background: '#3b82f6',
                  boxShadow: '0 0 4px #3b82f6, 0 0 8px #3b82f6'
                }}
              />
            </div>

            <p className="italic text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-center px-1 xs:px-2 sm:px-4" style={{ color: '#9ca3af', textShadow: '0 0 2px rgba(156, 163, 175, 0.5)' }}>
              By clicking &quot;I Agree &amp; Understand&quot; below, you legally confirm that you have read, understood, and accepted full responsibility for your actions on this platform.
            </p>
          </div>

          {/* Footer button - Neon styled */}
          <div 
            className="sticky bottom-0 z-10 bg-black mt-3 xs:mt-4 sm:mt-5 md:mt-6 pt-3 xs:pt-3.5 sm:pt-4 md:pt-4 pb-[env(safe-area-inset-bottom,0px)] px-3 xs:px-4 sm:px-5 md:px-6 flex justify-center sm:justify-end shrink-0"
            style={{
              borderTop: '1px solid #3b82f6',
              boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.8), 0 -1px 0 0 rgba(59, 130, 246, 0.5)'
            }}
          >
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex w-full sm:w-auto items-center justify-center gap-2 px-3 xs:px-4 sm:px-5 md:px-6 py-1.5 xs:py-1.75 sm:py-2 md:py-2.5 overflow-hidden rounded-lg xs:rounded-lg sm:rounded-xl md:rounded-xl text-[10px] xs:text-xs sm:text-sm md:text-sm font-semibold transition-all active:scale-95"
              style={{
                border: '2px solid #22c55e',
                boxShadow: '0 0 8px #22c55e, 0 0 16px rgba(34, 197, 94, 0.5)',
                background: 'black'
              }}
            >
              <span className="relative z-10 flex items-center gap-1.5 xs:gap-2 sm:gap-2 whitespace-nowrap" style={{ color: '#22c55e', textShadow: '0 0 4px #22c55e, 0 0 8px #22c55e' }}>
                I Agree & Understand
                <CheckCircle2 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 legal-neon-green-icon opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" style={{ color: '#22c55e' }} />
              </span>
            </motion.button>
          </div>
        </div>
      </EnhancedModal>
    </>
  );
};

export default LegalDisclaimerModal;
