"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  question: string;
  answer: string;
}

const defaultFaqs: FaqItem[] = [
  {
    question: "What is BullMoney?",
    answer: "BullMoney is a trading community since 2024 offering live trade calls, daily analysis, mentorship, and the only custom platform built for traders. We help beginners and experienced traders succeed.",
  },
  {
    question: "How do I join the trading community?",
    answer: "Join our free Telegram group or subscribe to VIP for full access to live streams, trade setups, charts, and 1-on-1 mentorship from funded traders.",
  },
  {
    question: "Do you offer trading education?",
    answer: "Yes. We provide structured courses, daily market breakdowns, live stream sessions, and personal mentorship covering forex, gold, crypto, and stocks.",
  },
  {
    question: "What markets do you cover?",
    answer: "We analyze forex pairs, gold (XAUUSD), major cryptocurrencies, and US stocks. Our analysis includes technicals, fundamentals, and live trade ideas.",
  },
  {
    question: "How is BullMoney different from other groups?",
    answer: "We're the only trading community with a custom web platform. Real transparency, real results, real mentorship - not just signals.",
  },
];

export const Faq = ({ faqs = defaultFaqs }: { faqs?: FaqItem[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="max-w-3xl mx-auto py-12" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-3xl font-bold text-white mb-8">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between"
            >
              <span className="text-white font-medium">{faq.question}</span>
              <motion.span
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                className="text-white"
              >
                ▼
              </motion.span>
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-4 text-gray-400">{faq.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Faq;
