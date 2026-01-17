"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { UI_Z_INDEX } from "@/contexts/UIStateContext";
import { AboutContent } from "@/components/AboutContent";
import { Pricing } from "@/components/Mainpage/pricing";
import VipHeroMain from "@/app/VIP/heromain";
import { ShopProvider } from "@/app/VIP/ShopContext";
import { cn } from "@/lib/utils";
import Orb from "@/components/Mainpage/Orb";
import { Features } from "@/components/Mainpage/features";
import ProductsSection from "@/app/VIP/ProductsSection";
import GameBoyPacman from "@/app/shop/ShopScrollFunnel";
import { AboutContent as Testimonial } from "@/app/Testimonial";
import { Footer } from "@/components/Mainpage/footer";

interface ServicesShowcaseModalProps {
  btnText?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export default function ServicesShowcaseModal({
  btnText = "View Services",
  isOpen,
  onOpenChange,
  showTrigger = true,
}: ServicesShowcaseModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const open = isOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open, mounted]);

  const modalContent = useMemo(() => {
    return (
      <div className="relative z-10 flex flex-col gap-10 px-3 py-6 sm:px-5 sm:py-8 md:px-8">
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-black">
          <ShopProvider>
            <VipHeroMain embedded />
          </ShopProvider>
        </div>
        <AboutContent />
        <Pricing />
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/50 p-6 min-h-[400px] h-[50vh] max-h-[600px]">
          <Orb hue={0} hoverIntensity={0.3} rotateOnHover={true} />
        </div>
        <Features />
        <ShopProvider>
          <ProductsSection />
        </ShopProvider>
        <GameBoyPacman />
        <Testimonial />
        <Footer />
      </div>
    );
  }, []);


  if (!mounted || typeof window === "undefined") return null;

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "relative inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold",
            "bg-white text-black shadow-lg transition-transform hover:-translate-y-0.5",
            "dark:bg-white dark:text-black"
          )}
        >
          {btnText}
        </button>
      )}

      {createPortal(
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="services-showcase-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
              style={{ zIndex: UI_Z_INDEX.MODAL_BACKDROP }}
              onClick={() => setOpen(false)}
            >
              <motion.div
                key="services-showcase-modal"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="relative w-[95vw] max-w-6xl rounded-3xl border border-white/10 bg-neutral-950 text-white shadow-2xl"
                style={{ zIndex: UI_Z_INDEX.MODAL_CONTENT }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                >
                  <X size={18} />
                </button>

                <div className="max-h-[85dvh] overflow-y-auto overscroll-contain">
                  {modalContent}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
