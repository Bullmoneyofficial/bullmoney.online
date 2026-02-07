"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    onSelect,
  }: {
    card: CardType;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    onSelect: (card: CardType) => void;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onSelect(card)}
      className={cn(
        "rounded-lg md:rounded-lg relative bg-neutral-900 overflow-hidden aspect-[3/2] md:aspect-[4/5] w-full transition-all duration-300 ease-out cursor-pointer",
        hovered !== null && hovered !== index && "blur-[32px] scale-[0.97] opacity-35"
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="object-cover absolute inset-0 h-full w-full"
      />
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          hovered !== null && hovered !== index
            ? "opacity-100 bg-neutral-900/85"
            : "opacity-0"
        )}
      />
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-300",
          hovered === index ? "opacity-100" : "opacity-65"
        )}
      >
        <div className="absolute inset-0 rounded-lg bg-linear-to-br from-white/30 via-white/10 to-transparent" />
        <div className="absolute -top-1/3 -left-1/3 h-[120%] w-[120%] bg-linear-to-br from-white/45 via-white/10 to-transparent rotate-12" />
        <div className="absolute left-0 top-[10%] h-1/3 w-[140%] -skew-y-6 bg-linear-to-r from-white/0 via-white/60 to-white/0" />
        <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
      </div>

      {/* Always-visible bottom gradient + details */}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/50 to-transparent pt-8 pb-2 px-2 sm:pb-3 sm:px-3 md:pb-4 md:px-4 z-10">
        {card.comingSoon && (
          <span className="inline-block mb-1 px-1.5 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-semibold uppercase tracking-wider bg-white/15 text-white/80 rounded-full border border-white/10">
            Coming Soon
          </span>
        )}
        <h3 className="text-[11px] sm:text-xs md:text-lg font-medium text-white truncate leading-tight">
          {card.title}
        </h3>
        {card.price != null && (
          <p className="text-[10px] sm:text-xs md:text-base font-semibold text-white/90 mt-0.5">
            ${card.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
        )}
        {card.description && (
          <p className="hidden md:block text-white/50 text-xs mt-1 line-clamp-2">
            {card.description}
          </p>
        )}
      </div>
    </div>
  )
);

Card.displayName = "Card";

/* ── Expanded Product Modal ── */
function ProductModal({
  card,
  onClose,
}: {
  card: CardType;
  onClose: () => void;
}) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="focus-modal-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          key="focus-modal-content"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full h-full max-w-7xl max-h-full overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="fixed top-6 right-6 z-50">
            <div className="relative w-12 h-12 rounded-full overflow-hidden">
              <div className="absolute inset-0 rounded-full p-[1px] overflow-hidden z-[1]">
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-20"
                  style={{ width: "100%", filter: "blur(20px)" }}
                  animate={{ x: ["-50%", "50%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-[1px] bg-transparent rounded-full" />
              </div>
              <div className="absolute inset-0 border border-white/20 rounded-full pointer-events-none z-[2]" />
              <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent z-10 pointer-events-none" />
              <motion.button
                onClick={onClose}
                className="relative w-full h-full rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="min-h-full p-6 md:p-12 flex items-center justify-center bg-black">
            <div className="w-full max-w-6xl bg-black">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 bg-black">
                {/* Product Image */}
                <div className="relative w-full aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-black border border-white/20">
                  <img
                    src={card.src}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {card.comingSoon && (
                    <div className="absolute top-4 left-4 px-4 py-2 text-white text-sm font-bold rounded-full bg-white/15 border border-white/20">
                      Coming Soon
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex flex-col space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm uppercase tracking-wider font-semibold" style={{ color: "rgb(25, 86, 180)" }}>
                      VIP Product
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                      {card.title}
                    </h1>
                    {card.description && (
                      <p className="text-lg text-white/70 leading-relaxed">
                        {card.description}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  {card.price != null && (
                    <div className="flex items-center gap-4 py-4 border-y border-white/10">
                      <span className="text-5xl font-bold text-white">
                        ${card.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-3 p-4 bg-black rounded-xl border border-white/20">
                    <div className={`w-3 h-3 rounded-full ${card.comingSoon ? "bg-yellow-500 animate-pulse" : "bg-green-500 animate-pulse"}`} />
                    <span className={`text-base font-semibold ${card.comingSoon ? "text-yellow-400" : "text-green-400"}`}>
                      {card.comingSoon ? "⏳ Coming Soon" : "✓ Available Now"}
                    </span>
                  </div>

                  {/* Buy Button */}
                  <div className="space-y-4 pt-6 bg-black">
                    <p className="text-white text-base font-semibold">Secure Checkout:</p>

                    {card.buyUrl && !card.comingSoon ? (
                      <a
                        href={card.buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="relative w-full overflow-hidden rounded-xl">
                          <div className="absolute inset-0 rounded-xl p-[1px] overflow-hidden z-[1]">
                            <motion.div
                              className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-20"
                              style={{ width: "100%", filter: "blur(20px)" }}
                              animate={{ x: ["-50%", "50%"] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <div className="absolute inset-[1px] bg-transparent rounded-xl" />
                          </div>
                          <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none z-[2]" />
                          <motion.div
                            style={{ backgroundColor: "rgb(25, 86, 180)" }}
                            className="relative w-full py-5 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg hover:opacity-90 transition-opacity"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <CreditCard className="w-5 h-5" />
                            <span>Buy Now</span>
                            <ExternalLink className="w-4 h-4 opacity-60" />
                          </motion.div>
                        </div>
                      </a>
                    ) : (
                      <div className="relative w-full overflow-hidden rounded-xl">
                        <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none z-[2]" />
                        <div
                          style={{ backgroundColor: "rgb(75, 75, 75)" }}
                          className="relative w-full py-5 opacity-60 text-white text-lg font-bold rounded-xl flex items-center justify-center gap-3 cursor-not-allowed"
                        >
                          <CreditCard className="w-5 h-5" />
                          <span>Coming Soon</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-3 text-white/40 text-xs pt-2">
                      <span>🔒 Secure Payment</span>
                      <span>•</span>
                      <span>💳 All Cards Accepted</span>
                      <span>•</span>
                      <span>📱 Apple & Google Pay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

type CardType = {
  title: string;
  src: string;
  price?: number;
  description?: string;
  comingSoon?: boolean;
  buyUrl?: string;
};

export function FocusCards({
  cards,
  mobileColumns = 2,
  desktopColumns = 2,
  maxItems,
}: {
  cards: CardType[];
  mobileColumns?: 1 | 2 | 3;
  desktopColumns?: 1 | 2 | 3;
  maxItems?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelect = useCallback((card: CardType) => {
    setSelectedCard(card);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCard(null);
  }, []);

  const gridColsBase =
    {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
    }[mobileColumns] || "grid-cols-1";

  const gridColsMd =
    {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
    }[desktopColumns] || "md:grid-cols-3";

  const visibleCards = maxItems ? cards.slice(0, maxItems) : cards;

  return (
    <>
      <div
        className={cn(
          "grid gap-0.5 sm:gap-1 md:gap-3 w-full h-full md:h-auto",
          gridColsBase,
          gridColsMd
        )}
      >
        {visibleCards.map((card, index) => (
          <Card
            key={card.title}
            card={card}
            index={index}
            hovered={hovered}
            setHovered={setHovered}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {mounted && selectedCard && (
        <ProductModal card={selectedCard} onClose={handleClose} />
      )}
    </>
  );
}
