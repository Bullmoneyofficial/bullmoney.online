"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "./logo";
import { DesktopFooter } from "./footer/DesktopFooter";
import { SocialsRow } from "./footer/SocialsRow";
import AdminModal from "@/components/AdminModal";
import BullMoneyModal from "@/components/Faq";
import AffiliateModal from "@/components/AffiliateModal";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isAffiliateOpen, setIsAffiliateOpen] = useState(false);

  return (
    <>
      {/* Modal Components */}
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <BullMoneyModal isOpen={isDisclaimerOpen} onClose={() => setIsDisclaimerOpen(false)} />
      <AffiliateModal isOpen={isAffiliateOpen} onClose={() => setIsAffiliateOpen(false)} />

      <motion.div
        className="relative w-full px-8 py-10 overflow-hidden shimmer-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Gradient Shimmer Background Layer */}
        <motion.div
          animate={{ x: ['0%', '200%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 left-[-100%] w-[100%] bg-gradient-to-r from-blue-600/0 via-blue-500/20 to-blue-600/0 opacity-50"
        />

        {/* Inner Content Container */}
        <div className="relative max-w-7xl mx-auto flex flex-col items-center gap-8 bg-black/20 dark:bg-black/20 backdrop-blur-2xl rounded-2xl p-6 border border-blue-500/30">
          
          {/* Top: Logo */}
          <div className="scale-125 md:scale-150 origin-center p-1">
            <Logo />
          </div>

          {/* Center: Desktop Footer Items */}
          <DesktopFooter
            onDisclaimerClick={() => setIsDisclaimerOpen(true)}
            onAppsAndToolsClick={() => alert("Apps & Tools clicked!")}
            onSocialsClick={() => {
              // This is a placeholder. The socials are now displayed in the SocialsRow.
              // You might want to scroll to the socials row or open a modal with more social links.
            }}
          />

          {/* Bottom: Socials Row */}
          <div className="mt-4">
            <SocialsRow />
          </div>

          {/* Copyright */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light tracking-wide text-center mt-6">
            &copy; {currentYear} BullMoney. All rights reserved.
          </p>
        </div>
      </motion.div>
    </>
  );
}