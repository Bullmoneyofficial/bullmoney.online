"use client";

import React, { useState } from "react";
import { FAQ_CONTENT } from "@/app/shop/Faq";
import { ChevronDown, HelpCircle } from "lucide-react";

const InlineFaq = () => {
  const [openId, setOpenId] = useState<string | null>(FAQ_CONTENT[0]?.items?.[0]?.name || null);

  return (
    <div className="w-full max-w-5xl mx-auto bg-black/70 border border-white/10 rounded-3xl p-6 md:p-8 text-white shadow-2xl backdrop-blur-lg pointer-events-auto">
      <div className="flex items-center gap-3 mb-4">
        <HelpCircle className="text-blue-400" />
        <div>
          <p className="text-xs uppercase text-blue-300 font-mono tracking-[0.25em]">About Us</p>
          <p className="text-base text-white/70">Answers for newcomers right on the page.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {FAQ_CONTENT.map((category) => (
          <div key={category.category} className="space-y-2">
            <p className="text-[11px] uppercase text-blue-400 font-mono tracking-[0.2em]">{category.category}</p>
            {category.items.map((item) => {
              const isOpen = openId === item.name;
              return (
                <div key={item.name} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors"
                    onClick={() => setOpenId(isOpen ? null : item.name)}
                  >
                    <span className="text-sm font-semibold text-white/90">{item.name}</span>
                    <ChevronDown className={`w-4 h-4 text-blue-300 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`px-4 pb-4 text-sm text-white/70 transition-all duration-300 ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
                    {typeof item.answer === "string" ? <p>{item.answer}</p> : item.answer}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InlineFaq;
