"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";

// Utility function
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// TrueFocus Animation Component
interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
}

const TrueFocus: React.FC<TrueFocusProps> = ({
  sentence = 'True Focus',
  separator = ' ',
  blurAmount = 5,
  borderColor = '#ffffff',
  glowColor = 'rgba(255, 255, 255, 0.6)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1
}) => {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % words.length);
    }, (animationDuration + pauseBetweenAnimations) * 1000);
    return () => clearInterval(interval);
  }, [animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;

    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height
    });
  }, [currentIndex, words.length]);

  return (
    <div className="flex flex-wrap gap-3 relative" ref={containerRef}>
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        return (
          <span
            key={index}
            ref={el => { if (el) wordRefs.current[index] = el; }}
            className="relative inline-block px-2 py-1 transition-all"
            style={{
              filter: isActive ? `blur(0px)` : `blur(${blurAmount}px)`,
              opacity: isActive ? 1 : 0.3,
              transition: `filter ${animationDuration}s ease, opacity ${animationDuration}s ease`,
              color: isActive ? '#fff' : '#aaa'
            }}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className="absolute pointer-events-none rounded-lg -z-10"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0
        }}
        transition={{ duration: animationDuration }}
        style={{
          border: `1px solid ${borderColor}`,
          boxShadow: `0 0 20px ${glowColor}`,
          background: `${borderColor}10`
        }}
      >
        <span className="absolute top-[-1px] left-[-1px] w-2.5 h-2.5 border-t-2 border-l-2" style={{ borderColor }} />
        <span className="absolute top-[-1px] right-[-1px] w-2.5 h-2.5 border-t-2 border-r-2" style={{ borderColor }} />
        <span className="absolute bottom-[-1px] left-[-1px] w-2.5 h-2.5 border-b-2 border-l-2" style={{ borderColor }} />
        <span className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 border-b-2 border-r-2" style={{ borderColor }} />
      </motion.div>
    </div>
  );
};

// FAQ Data Structure
interface FAQItemData {
  name: string;
  answer: string | React.ReactNode;
}

interface FAQCategoryData {
  category: string;
  items: FAQItemData[];
}

// Your FAQ Content
const FAQ_CONTENT: FAQCategoryData[] = [
  {
    category: "General Info",
    items: [
      { 
        name: "Where can I see real results?", 
        answer: "We value discretion and results over words. We encourage you to visit our social media channels to witness our community culture."
      },
      { 
        name: "Are there country restrictions?", 
        answer: "BullMoney operates globally. However, it is your responsibility to ensure compliance with your local laws regarding financial trading."
      },
    ],
  },
  {
    category: "Methodology",
    items: [
      { 
        name: "Do you provide Trade Setups?", 
        answer: "BullMoney is strictly an educational and mentorship community. We share high-probability setups and market analysis to help you make your own informed decisions, not blind copy trades."
      },
      { 
        name: "Is this financial advice?", 
        answer: "Absolutely not. All content provided by BullMoney is for educational purposes only. Trading involves high risk and you should consult a professional."
      },
    ],
  },
  {
    category: "Membership",
    items: [
      { 
        name: "Free vs VIP Access", 
        answer: (
          <div className="space-y-2">
             <p><strong>Free Access:</strong> Provides a glimpse into our world with Public Chat and occasional streams.</p>
             <p className="text-white"><strong>VIP Access:</strong> Includes Daily Live Trading, Daily Premium Setups, and a Private Mentor.</p>
          </div>
        )
      },
      { 
        name: "How do I join?", 
        answer: "Click the 'Open Support Chat' button below to get started with our onboarding process."
      },
    ],
  },
];

const InlineFaq = () => {
  const [openId, setOpenId] = useState<string | null>(FAQ_CONTENT[0]?.items?.[0]?.name || null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  return (
    <div className="w-full max-w-6xl mx-auto relative pointer-events-auto">
      {/* Animated Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-2xl opacity-20"
        animate={{
          background: [
            "radial-gradient(circle at 0% 0%, #ffffff 0%, transparent 50%)",
            "radial-gradient(circle at 100% 100%, #ffffff 0%, transparent 50%)",
            "radial-gradient(circle at 0% 100%, #ffffff 0%, transparent 50%)",
            "radial-gradient(circle at 100% 0%, #ffffff 0%, transparent 50%)",
            "radial-gradient(circle at 0% 0%, #ffffff 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_0_50px_rgba(255, 255, 255,0.1)]"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 pb-6 border-b border-white/10"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="h-[1px] w-8 bg-linear-to-r from-white to-transparent" />
            <Sparkles className="w-3 h-3 text-white" />
            <p className="text-xs uppercase text-white/80 font-mono tracking-[0.25em]">
              About Us
            </p>
          </motion.div>
          
          <div className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase">
            <TrueFocus 
              sentence="Frequently Asked Questions"
              borderColor="#ffffff"
              glowColor="rgba(255, 255, 255, 0.6)"
              blurAmount={4}
              animationDuration={0.5}
              pauseBetweenAnimations={1.5}
            />
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm md:text-base text-white/60 mt-4"
          >
            Answers for newcomers right on the page.
          </motion.p>
        </motion.div>

        {/* FAQ Grid - Desktop */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 md:gap-8">
          {FAQ_CONTENT.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * categoryIndex, duration: 0.5 }}
              className="space-y-3"
            >
              {/* Category Label */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + 0.1 * categoryIndex }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="h-[2px] w-8 bg-linear-to-r from-white to-transparent" />
                <p className="text-[11px] uppercase text-white/80 font-mono tracking-[0.2em]">
                  {category.category}
                </p>
              </motion.div>

              {/* FAQ Items */}
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => {
                  const isOpen = openId === item.name;
                  const uniqueId = `${category.category}-${item.name}`;

                  return (
                    <motion.div
                      key={uniqueId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + 0.1 * categoryIndex + 0.05 * itemIndex }}
                      className="group"
                    >
                      <motion.div
                        className="relative rounded-2xl overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {/* Shimmer Effect on Hover */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
                          }}
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />

                        {/* Card Background */}
                        <div className="relative border border-white/10 bg-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                          {/* Question Button */}
                          <button
                            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/10 transition-all duration-300 group/btn"
                            onClick={() => setOpenId(isOpen ? null : item.name)}
                          >
                            <span className="text-sm font-semibold text-white/90 group-hover/btn:text-white transition-colors pr-2">
                              {item.name}
                            </span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <ChevronDown className="w-4 h-4 text-white/80 flex-shrink-0" />
                            </motion.div>
                          </button>

                          {/* Answer Content */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <motion.div
                                  initial={{ y: -10 }}
                                  animate={{ y: 0 }}
                                  exit={{ y: -10 }}
                                  className="px-4 pb-4 pt-1"
                                >
                                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="text-sm text-white/70 leading-relaxed">
                                      {typeof item.answer === "string" ? (
                                        <p>{item.answer}</p>
                                      ) : (
                                        item.answer
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scrollable Mobile View */}
        <div className="md:hidden">
          {/* Category Indicators */}
          <div className="flex justify-center gap-2 mb-4">
            {FAQ_CONTENT.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  const scrollContainer = document.getElementById('faq-scroll-container');
                  if (scrollContainer) {
                    const scrollWidth = scrollContainer.scrollWidth / FAQ_CONTENT.length;
                    scrollContainer.scrollTo({
                      left: scrollWidth * index,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentCategoryIndex 
                    ? 'w-10 bg-white shadow-[0_0_10px_rgba(255, 255, 255,0.5)]' 
                    : 'w-2 bg-white/30'
                }`}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to category ${index + 1}`}
              />
            ))}
          </div>

          {/* Scroll Hint */}
          <AnimatePresence>
            {currentCategoryIndex === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center text-xs text-white/50 mb-4 font-mono flex items-center justify-center gap-2"
              >
                <motion.span
                  animate={{ x: [-3, 0, -3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  ←
                </motion.span>
                <span>Scroll to explore</span>
                <motion.span
                  animate={{ x: [3, 0, 3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Title */}
          <motion.div
            key={currentCategoryIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4 px-2"
          >
            <div className="h-[2px] flex-1 bg-linear-to-r from-white to-transparent" />
            <p className="text-xs uppercase text-white/80 font-mono tracking-[0.2em] whitespace-nowrap">
              {FAQ_CONTENT[currentCategoryIndex]?.category}
            </p>
            <div className="h-[2px] flex-1 bg-linear-to-l from-white to-transparent" />
          </motion.div>

          {/* Horizontal Scroll Container */}
          <div className="relative">
            {/* Left Edge Indicator */}
            <AnimatePresence>
              {currentCategoryIndex > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-black via-black/50 to-transparent z-10 pointer-events-none flex items-center justify-start pl-1"
                >
                  <motion.div
                    animate={{ x: [-2, 2, -2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/80 rotate-90" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Right Edge Indicator */}
            <AnimatePresence>
              {currentCategoryIndex < FAQ_CONTENT.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-black via-black/50 to-transparent z-10 pointer-events-none flex items-center justify-end pr-1"
                >
                  <motion.div
                    animate={{ x: [2, -2, 2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/80 -rotate-90" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable Content */}
            <div
              id="faq-scroll-container"
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
              onScroll={(e) => {
                const container = e.currentTarget;
                const scrollLeft = container.scrollLeft;
                const itemWidth = container.scrollWidth / FAQ_CONTENT.length;
                const newIndex = Math.round(scrollLeft / itemWidth);
                if (newIndex !== currentCategoryIndex) {
                  setCurrentCategoryIndex(newIndex);
                }
              }}
            >
              {FAQ_CONTENT.map((category, categoryIndex) => (
                <div
                  key={category.category}
                  className="flex-shrink-0 w-full snap-center px-2"
                >
                  <AnimatePresence mode="wait">
                    {Math.abs(currentCategoryIndex - categoryIndex) <= 1 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        {category.items.map((item, itemIndex) => {
                          const isOpen = openId === item.name;
                          const uniqueId = `mobile-${category.category}-${item.name}`;

                          return (
                            <motion.div
                              key={uniqueId}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                delay: 0.05 * itemIndex,
                                duration: 0.3 
                              }}
                            >
                              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg">
                                {/* Question Button */}
                                <button
                                  className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-white/10 transition-all duration-200 touch-manipulation"
                                  onClick={() => setOpenId(isOpen ? null : item.name)}
                                >
                                  <span className="text-sm font-semibold text-white/90 pr-3 leading-snug">
                                    {item.name}
                                  </span>
                                  <motion.div
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="flex-shrink-0"
                                  >
                                    <ChevronDown className="w-5 h-5 text-white/80" />
                                  </motion.div>
                                </button>

                                {/* Answer Content */}
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: "easeInOut" }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-4 pt-1">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                          <div className="text-sm text-white/70 leading-relaxed">
                                            {typeof item.answer === "string" ? (
                                              <p>{item.answer}</p>
                                            ) : (
                                              item.answer
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Hide scrollbar CSS */}
            <style jsx>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-between items-center mt-6 gap-3 px-2">
            <motion.button
              onClick={() => {
                const scrollContainer = document.getElementById('faq-scroll-container');
                if (scrollContainer && currentCategoryIndex > 0) {
                  const scrollWidth = scrollContainer.scrollWidth / FAQ_CONTENT.length;
                  scrollContainer.scrollTo({
                    left: scrollWidth * (currentCategoryIndex - 1),
                    behavior: 'smooth'
                  });
                }
              }}
              disabled={currentCategoryIndex === 0}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all touch-manipulation",
                currentCategoryIndex === 0
                  ? "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                  : "bg-white/20 border border-white/30 text-white/80 active:bg-white/30 shadow-[0_0_15px_rgba(255, 255, 255,0.2)]"
              )}
              whileTap={currentCategoryIndex > 0 ? { scale: 0.95 } : {}}
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              <span>Previous</span>
            </motion.button>
            
            <div className="text-xs text-white/40 font-mono">
              {currentCategoryIndex + 1} / {FAQ_CONTENT.length}
            </div>
            
            <motion.button
              onClick={() => {
                const scrollContainer = document.getElementById('faq-scroll-container');
                if (scrollContainer && currentCategoryIndex < FAQ_CONTENT.length - 1) {
                  const scrollWidth = scrollContainer.scrollWidth / FAQ_CONTENT.length;
                  scrollContainer.scrollTo({
                    left: scrollWidth * (currentCategoryIndex + 1),
                    behavior: 'smooth'
                  });
                }
              }}
              disabled={currentCategoryIndex === FAQ_CONTENT.length - 1}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all touch-manipulation",
                currentCategoryIndex === FAQ_CONTENT.length - 1
                  ? "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                  : "bg-white/20 border border-white/30 text-white/80 active:bg-white/30 shadow-[0_0_15px_rgba(255, 255, 255,0.2)]"
              )}
              whileTap={currentCategoryIndex < FAQ_CONTENT.length - 1 ? { scale: 0.95 } : {}}
            >
              <span>Next</span>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </motion.button>
          </div>
        </div>

        {/* Decorative Bottom Glow */}
        <motion.div
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-1/2 h-40 bg-white/20 blur-[100px] rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
};

export default InlineFaq;