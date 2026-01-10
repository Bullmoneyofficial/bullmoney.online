"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FaqItem {
  question: string;
  answer: string;
}

const defaultFaqs: FaqItem[] = [
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and cryptocurrency.",
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 5-7 business days. Express shipping is 2-3 business days.",
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day money-back guarantee on all products.",
  },
];

export const Faq = ({ faqs = defaultFaqs }: { faqs?: FaqItem[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-3xl font-bold text-white mb-8">
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
    </div>
  );
};

export default Faq;
