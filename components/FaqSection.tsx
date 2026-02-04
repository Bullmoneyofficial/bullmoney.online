"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShimmerBorder, ShimmerDot } from "@/components/ui/UnifiedShimmer";

interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FaqCategory {
  category: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    category: "General Info",
    items: [
      { 
        question: "Where can I see real results?", 
        answer: "We value discretion and results over words. We encourage you to visit our social media channels to witness our community culture."
      },
      { 
        question: "Are there country restrictions?", 
        answer: "BullMoney operates globally. However, it is your responsibility to ensure compliance with your local laws regarding financial trading."
      },
    ],
  },
  {
    category: "Methodology",
    items: [
      { 
        question: "Do you provide Trade Setups?", 
        answer: "BullMoney is strictly an educational and mentorship community. We share high-probability setups and market analysis to help you make your own informed decisions, not blind copy trades."
      },
      { 
        question: "Is this financial advice?", 
        answer: "Absolutely not. All content provided by BullMoney is for educational purposes only. Trading involves high risk and you should consult a professional."
      },
    ],
  },
  {
    category: "Membership",
    items: [
      { 
        question: "Free vs VIP Access", 
        answer: (
          <div className="space-y-2">
             <p><strong>Free Access:</strong> Provides a glimpse into our world with Public Chat and occasional streams.</p>
             <p className="text-white"><strong>VIP Access:</strong> Includes Daily Live Trading, Daily Premium Setups, and a Private Mentor.</p>
          </div>
        )
      },
      { 
        question: "How do I join?", 
        answer: "Click the 'Get Started' button to begin with our onboarding process."
      },
    ],
  },
  {
    category: "Support",
    items: [
      { 
        question: "How can I contact support?", 
        answer: "You can reach our support team through our Telegram channel or Discord server. We typically respond within 24 hours."
      },
      { 
        question: "What payment methods do you accept?", 
        answer: "We accept credit cards, PayPal, and cryptocurrency payments for maximum convenience."
      },
    ],
  },
];

interface FaqItemProps {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

const FaqItemComponent = ({ item, isOpen, onToggle }: FaqItemProps) => {
  return (
    <div className="relative mb-3">
      <ShimmerBorder color="white" intensity="low" speed="slow" />
      <div
        className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <button
          onClick={onToggle}
          className="w-full px-6 py-4 flex items-center justify-between text-left transition-all hover:bg-white/5"
          aria-expanded={isOpen}
        >
          <span className="text-white font-medium text-sm md:text-base pr-4">
            {item.question}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5 text-white/70 flex-shrink-0" />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-4 text-white/80 text-sm md:text-base">
                {item.answer}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export function FaqSection() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div className="relative text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, white, var(--accent-color, #ffffff), white)', 
              filter: 'drop-shadow(0 0 15px rgba(var(--accent-rgb, 255, 255, 255), 0.5))' 
            }}>
          Frequently Asked Questions
        </h2>
        <div className="flex justify-center gap-1 mt-4">
          <ShimmerDot color="white" delay={0} />
          <ShimmerDot color="white" delay={0.2} />
          <ShimmerDot color="white" delay={0.4} />
        </div>
      </div>

      <div className="space-y-8">
        {FAQ_DATA.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h3 className="text-lg md:text-xl font-bold text-white mb-4 px-2">
              {category.category}
            </h3>
            <div className="space-y-3">
              {category.items.map((item, itemIndex) => (
                <FaqItemComponent
                  key={itemIndex}
                  item={item}
                  isOpen={openItems.has(`${categoryIndex}-${itemIndex}`)}
                  onToggle={() => toggleItem(categoryIndex, itemIndex)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
