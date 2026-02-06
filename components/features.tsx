"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Image from "next/image";
import createGlobe from "cobe";
import { detectBrowser } from "@/lib/browserDetection";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import ShinyText from "@/components/ShinyText";
import ScrollReveal from "@/components/ScrollReveal";
import TrueFocus from "@/components/TrueFocus";
import TextType from "@/components/TextType";

// Minimalist Apple-inspired design system
const APPLE_STYLES = `
  .apple-text-gradient {
    background: linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .apple-card {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .apple-card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .apple-card-hover:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }

  .apple-button {
    background: rgba(255, 255, 255, 0.95);
    color: #000;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .apple-button:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.02);
  }

  .apple-button:active {
    transform: scale(0.98);
  }
  
  .broker-poster-font {
    font-family: 'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }
`;

// Sticky Scroll Content for Features - Enhanced Broker Showcase
const getStickyScrollContent = (
  copyCode: (code: string, broker: "goatfunded" | "vantage" | "xm") => void,
  copiedCodes: CopiedCodesState,
  justCopied: string | null
) => [
  {
    title: "GOAT FUNDED TRADER",
    logo: "/GTFLOGO.png",
    description:
      "15% OFF with BM15 • Instant funding up to $200K • 90% profit split • Fast payouts in 24-48hrs • No time limits on challenges • BullMoney's #1 recommended prop firm for beginners and pros alike.",
    content: (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-center mb-4">
            <span className="broker-poster-font text-3xl text-white block mb-2">GOAT FUNDED</span>
            <span className="text-white/60 text-sm">Prop Firm Partner</span>
          </div>
          <button
            onClick={() => copyCode("BM15", "goatfunded")}
            className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-all hover:scale-105 flex items-center gap-3 mb-4"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                copiedCodes.goatfunded ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
              }`}
            />
            <span className="font-mono tracking-wider">BM15</span>
            <span>{justCopied === "goatfunded" ? "✓ COPIED" : "COPY"}</span>
          </button>
          <a
            href="https://checkout.goatfundedtrader.com/aff/Bullmoney/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 text-sm hover:text-white transition-colors font-semibold"
          >
            GET FUNDED →
          </a>
        </div>
      </div>
    ),
  },
  {
    title: "FTMO",
    logo: "/FTMO_LOGOB.png",
    description:
      "The World's #1 Prop Firm • Paid out $100M+ to traders • Scale up to $400K accounts • 80% profit split • Professional trading conditions • The ultimate test for serious traders.",
    content: (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-center mb-4">
            <span className="broker-poster-font text-3xl text-white block mb-2">FTMO</span>
            <span className="text-white/60 text-sm">Elite Prop Firm</span>
          </div>
          <a
            href="https://trader.ftmo.com/?affiliates=fGDPMCcFOXviWzowTyxV"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-white font-bold text-sm hover:bg-white/90 transition-all hover:scale-105"
            style={{ color: '#000000' }}
          >
            START CHALLENGE →
          </a>
        </div>
      </div>
    ),
  },
  {
    title: "VANTAGE BROKER",
    logo: "/Vantage-logo.jpg",
    description:
      "Use code BULLMONEY • RAW spreads from 0.0 pips • Lightning-fast execution • MT4/MT5 supported • Regulated & trusted • The broker BullMoney traders use for live funded accounts.",
    content: (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-center mb-4">
            <span className="broker-poster-font text-3xl text-white block mb-2">VANTAGE</span>
            <span className="text-white/60 text-sm">Premium Broker</span>
          </div>
          <button
            onClick={() => copyCode("BULLMONEY", "vantage")}
            className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-all hover:scale-105 flex items-center gap-3 mb-4"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                copiedCodes.vantage ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
              }`}
            />
            <span className="font-mono tracking-wider">BULLMONEY</span>
            <span>{justCopied === "vantage" ? "✓" : "COPY"}</span>
          </button>
          <a
            href="https://vigco.co/iQbe2u"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 text-sm hover:text-white transition-colors font-semibold"
          >
            OPEN ACCOUNT →
          </a>
        </div>
      </div>
    ),
  },
  {
    title: "XM GLOBAL",
    logo: "/xm-logo.png",
    description:
      "Use code X3R7P • Trusted by 10M+ traders • Ultra-competitive spreads • 24/7 support • Multi-asset trading • Perfect for forex, indices, commodities and crypto CFDs.",
    content: (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-center mb-4">
            <span className="broker-poster-font text-3xl text-white block mb-2">XM GLOBAL</span>
            <span className="text-white/60 text-sm">Global Broker</span>
          </div>
          <button
            onClick={() => copyCode("X3R7P", "xm")}
            className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-all hover:scale-105 flex items-center gap-3 mb-4"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                copiedCodes.xm ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
              }`}
            />
            <span className="font-mono tracking-wider">X3R7P</span>
            <span>{justCopied === "xm" ? "✓" : "COPY"}</span>
          </button>
          <a
            href="https://affs.click/t5wni"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 text-sm hover:text-white transition-colors font-semibold"
          >
            OPEN ACCOUNT →
          </a>
        </div>
      </div>
    ),
  },
  {
    title: "JOIN 10,000+ TRADERS",
    logo: "/ONcc2l601.svg",
    description:
      "The only trading community with a custom platform • Live trade calls daily • Expert analysis • Mentorship from funded traders • Active Discord • Traders worldwide • Your path to funded trading starts here.",
    content: "signup",
  },
];

// Type for copied codes state
type CopiedCodesState = {
  goatfunded: boolean;
  ftmo: boolean;
  vantage: boolean;
  xm: boolean;
};

export function Features() {
  const [copiedCodes, setCopiedCodes] = useState<CopiedCodesState>({
    goatfunded: false,
    ftmo: false,
    vantage: false,
    xm: false,
  });
  const [justCopied, setJustCopied] = useState<string | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { isMobile, shouldSkipHeavyEffects } = useUnifiedPerformance();

  // Load copied states from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bullmoney-copied-codes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCopiedCodes(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save to localStorage whenever copiedCodes changes
  useEffect(() => {
    localStorage.setItem('bullmoney-copied-codes', JSON.stringify(copiedCodes));
  }, [copiedCodes]);

  useEffect(() => {
    const styleId = 'apple-features-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = APPLE_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  const copyCode = async (code: string, broker: keyof CopiedCodesState) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    
    // Update state and localStorage
    setCopiedCodes(prev => ({ ...prev, [broker]: true }));
    setJustCopied(broker);
    setTimeout(() => setJustCopied(null), 2000);
  };

  // Generate sticky scroll content with current state
  const stickyScrollContent = getStickyScrollContent(
    copyCode,
    copiedCodes,
    justCopied
  );

  return (
    <div className="w-full min-h-screen bg-black py-12 md:py-20 px-4 md:px-8">
      {/* Header with TrueFocus Effect */}
      <header className="max-w-7xl mx-auto text-center mb-8 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <TrueFocus 
            sentence="TRUSTED TRADING PARTNERS"
            manualMode={false}
            blurAmount={4}
            borderColor="#ffffff"
            glowColor="rgba(255, 255, 255, 0.4)"
            animationDuration={0.5}
            pauseBetweenAnimations={1.5}
          />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <TextType
            text={[
              "Get funded faster with exclusive codes",
              "BullMoney verified brokers & prop firms",
              "Join 10,000+ successful traders"
            ]}
            typingSpeed={60}
            pauseDuration={2000}
            deletingSpeed={40}
            showCursor
            cursorCharacter="_"
            cursorBlinkDuration={0.5}
            loop
            className="text-lg md:text-2xl text-white/70"
          />
        </motion.div>
      </header>

      {/* Sticky Scroll Section - Desktop only */}
      <div className="hidden md:block max-w-7xl mx-auto mb-12">
        <StickyScroll 
          content={stickyScrollContent} 
          contentClassName="rounded-2xl"
          onSignupClick={() => setShowSignupModal(true)}
        />
      </div>

      {/* Mobile Cards - Shown only on mobile */}
      <div className="md:hidden max-w-7xl mx-auto grid grid-cols-1 gap-3">
        
        {/* Goat Funded Card - Compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="apple-card apple-card-hover rounded-3xl p-6 flex flex-col justify-between min-h-[300px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/5 p-2">
                <Image
                  src="/GTFLOGO.png"
                  alt="Goat Funded"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <ShinyText
                text="Goat Funded"
                speed={2}
                color="#b5b5b5"
                shineColor="#ffffff"
                spread={90}
                className="text-xl font-semibold"
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              BullMoney traders get 15% off. Start your funded journey today.
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => copyCode("BM15", "goatfunded")}
              className="apple-button px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-2"
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  copiedCodes.goatfunded ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                }`}
              />
              <span className="font-mono font-semibold">BM15</span>
              {justCopied === "goatfunded" ? "✓" : "Copy"}
            </button>
            <a
              href="https://checkout.goatfundedtrader.com/aff/Bullmoney/"
              target="_blank"
              rel="noopener noreferrer"
              className="apple-button px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 w-full justify-center"
            >
              Get Started →
            </a>
          </div>
        </motion.div>

        {/* FTMO Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="apple-card apple-card-hover rounded-3xl p-6 flex flex-col justify-between min-h-[280px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/5 p-2">
                <Image
                  src="/FTMO_LOGOB.png"
                  alt="FTMO"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <ShinyText
                text="FTMO"
                speed={2}
                color="#b5b5b5"
                shineColor="#ffffff"
                spread={90}
                className="text-xl font-semibold"
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Prove your skills. Get funded by the world&apos;s top prop firm.
            </p>
          </div>
          <a
            href="https://trader.ftmo.com/?affiliates=fGDPMCcFOXviWzowTyxV"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-button px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 w-full justify-center"
          >
            Start Challenge →
          </a>
        </motion.div>

        {/* Vantage Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="apple-card apple-card-hover rounded-3xl p-6 flex flex-col justify-between min-h-[280px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/5 p-2">
                <img src="/Vantage-logo.jpg" alt="Vantage" className="w-full h-full object-contain" />
              </div>
              <ShinyText
                text="Vantage"
                speed={2}
                color="#b5b5b5"
                shineColor="#ffffff"
                spread={90}
                className="text-xl font-semibold"
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Ultra-low spreads. Code: <span className="font-mono font-semibold text-white">BULLMONEY</span>
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => copyCode("BULLMONEY", "vantage")}
              className="apple-button px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 w-full justify-center"
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  copiedCodes.vantage ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                }`}
              />
              {justCopied === "vantage" ? "Copied! ✓" : "Copy Code"}
            </button>
            <a
              href="https://vigco.co/iQbe2u"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full text-sm font-medium text-white border border-white/20 hover:border-white/40 transition-colors inline-flex items-center gap-2 w-full justify-center"
            >
              Open Account
            </a>
          </div>
        </motion.div>

        {/* XM Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="apple-card apple-card-hover rounded-3xl p-6 flex flex-col justify-between min-h-[280px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/5 p-2">
                <img src="/xm-logo.png" alt="XM" className="w-full h-full object-contain" />
              </div>
              <ShinyText
                text="XM"
                speed={2}
                color="#b5b5b5"
                shineColor="#ffffff"
                spread={90}
                className="text-xl font-semibold"
              />
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Global broker. Code: <span className="font-mono font-semibold text-white">X3R7P</span>
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => copyCode("X3R7P", "xm")}
              className="apple-button px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 w-full justify-center"
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  copiedCodes.xm ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                }`}
              />
              {justCopied === "xm" ? "Copied! ✓" : "Copy Code"}
            </button>
            <a
              href="https://affs.click/t5wni"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full text-sm font-medium text-white border border-white/20 hover:border-white/40 transition-colors inline-flex items-center gap-2 w-full justify-center"
            >
              Open Account
            </a>
          </div>
        </motion.div>
      </div>

      {/* Globe Section - Visible on all devices */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mt-8 md:mt-12"
      >
        <div className="apple-card rounded-3xl p-8 md:p-10 flex items-center justify-center min-h-[400px] md:min-h-[500px] overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center min-h-[350px] md:min-h-[450px]">
            <Globe reducedMotion={shouldSkipHeavyEffects} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4 px-4">
                <ShinyText
                  text="10,000+ Traders Worldwide"
                  speed={4}
                  color="#b5b5b5"
                  shineColor="#ffffff"
                  spread={90}
                  yoyo={true}
                  className="text-2xl md:text-4xl font-semibold"
                />
                <div className="max-w-lg mx-auto">
                  <ScrollReveal
                    baseOpacity={0.2}
                    enableBlur
                    baseRotation={1}
                    blurStrength={2}
                    textClassName="text-base md:text-lg text-white/60"
                  >
                    The only trading community with a custom platform. Trade smarter.
                  </ScrollReveal>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Desktop Grid for additional features - hide broker cards since sticky scroll shows them */}
      <div className="hidden max-w-7xl mx-auto grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mt-8">
        
        {/* Goat Funded Card - Compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="apple-card apple-card-hover rounded-3xl p-6 md:p-10 flex flex-col justify-between min-h-[300px] md:min-h-[400px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden bg-white/5 p-2">
                <Image
                  src="/GTFLOGO.png"
                  alt="Goat Funded"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl md:text-3xl font-semibold text-white">
                Goat Funded
              </h3>
            </div>

            <p className="text-white/70 text-sm md:text-lg leading-relaxed mb-4 md:mb-6">
              BullMoney traders get 15% off. Start your funded journey today.
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs md:text-sm">Code:</span>
              <button
                onClick={() => copyCode("BM15", "goatfunded")}
                className="apple-button px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium inline-flex items-center gap-2"
              >
                <span
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    copiedCodes.goatfunded ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                  }`}
                />
                <span className="font-mono font-semibold">BM15</span>
                {justCopied === "goatfunded" ? (
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            <a
              href="https://checkout.goatfundedtrader.com/aff/Bullmoney/"
              target="_blank"
              rel="noopener noreferrer"
              className="apple-button px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium inline-flex items-center gap-2 w-full justify-center"
            >
              Get Started
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </motion.div>

        {/* FTMO Card - Compact on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="apple-card apple-card-hover rounded-3xl p-6 md:p-10 flex flex-col justify-between min-h-[300px] md:min-h-[400px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden bg-white/5 p-2">
                <Image
                  src="/FTMO_LOGOB.png"
                  alt="FTMO"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl md:text-3xl font-semibold text-white">
                FTMO
              </h3>
            </div>

            <p className="text-white/70 text-sm md:text-lg leading-relaxed">
              Prove your skills. Get funded by the world&apos;s top prop firm.
            </p>
          </div>

          <a
            href="https://trader.ftmo.com/?affiliates=fGDPMCcFOXviWzowTyxV"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-button px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium inline-flex items-center gap-2 w-full justify-center"
          >
            Start Challenge
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>

        {/* Vantage Broker Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="apple-card apple-card-hover rounded-3xl p-6 md:p-10 flex flex-col justify-between min-h-[300px] md:min-h-[400px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden bg-white/5 p-2" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))' }}>
                <img
                  src="/Vantage-logo.jpg"
                  alt="Vantage"
                  className="w-full h-full object-contain"
                  style={{ filter: 'brightness(1.2)' }}
                />
              </div>
              <h3 className="text-xl md:text-3xl font-semibold text-white">
                Vantage
              </h3>
            </div>

            <p className="text-white/70 text-sm md:text-lg leading-relaxed mb-4 md:mb-6">
              Ultra-low spreads. Our traders&apos; go-to broker. Code: <span className="font-mono font-semibold text-white">BULLMONEY</span>
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <button
              onClick={() => copyCode("BULLMONEY", "vantage")}
              className="apple-button px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium inline-flex items-center gap-2 w-full justify-center"
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  copiedCodes.vantage ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                }`}
              />
              {justCopied === "vantage" ? "Copied!" : "Copy Code"}
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <a
              href="https://vigco.co/iQbe2u"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium text-white border border-white/20 hover:border-white/40 transition-colors inline-flex items-center gap-2 w-full justify-center"
            >
              Open Account
            </a>
          </div>
        </motion.div>

        {/* XM Broker Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="apple-card apple-card-hover rounded-3xl p-6 md:p-10 flex flex-col justify-between min-h-[300px] md:min-h-[400px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden bg-white/5 p-2" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))' }}>
                <img
                  src="/xm-logo.png"
                  alt="XM"
                  className="w-full h-full object-contain"
                  style={{ filter: 'brightness(1.2)' }}
                />
              </div>
              <h3 className="text-xl md:text-3xl font-semibold text-white">
                XM
              </h3>
            </div>

            <p className="text-white/70 text-sm md:text-lg leading-relaxed mb-4 md:mb-6">
              Global broker, trusted worldwide. Code: <span className="font-mono font-semibold text-white">X3R7P</span>
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <button
              onClick={() => copyCode("X3R7P", "xm")}
              className="apple-button px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium inline-flex items-center gap-2 w-full justify-center"
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  copiedCodes.xm ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                }`}
              />
              {justCopied === "xm" ? "Copied!" : "Copy Code"}
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <a
              href="https://affs.click/t5wni"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium text-white border border-white/20 hover:border-white/40 transition-colors inline-flex items-center gap-2 w-full justify-center"
            >
              Open Account
            </a>
          </div>
        </motion.div>

        {/* Mobile only - compact feature cards */}
        {isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="apple-card rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Fast Funding</h3>
                  <p className="text-white/60 text-sm leading-relaxed">Get funded in days, not months.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="apple-card rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">High Splits</h3>
                  <p className="text-white/60 text-sm leading-relaxed">Keep up to 90% of profits.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Shared feature cards with globe - visible on all devices */}
        <>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="apple-card rounded-3xl p-8 md:p-10"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-white">
                Fast Funding
              </h3>
              <ScrollReveal
                baseOpacity={0.2}
                enableBlur
                baseRotation={1}
                blurStrength={2}
                textClassName="text-base text-white/60 leading-relaxed"
              >
                Get funded in days, not months. Start trading with real capital quickly and efficiently.
              </ScrollReveal>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="apple-card rounded-3xl p-8 md:p-10"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-white">
                High Profit Split
              </h3>
              <ScrollReveal
                baseOpacity={0.2}
                enableBlur
                baseRotation={1}
                blurStrength={2}
                textClassName="text-base text-white/60 leading-relaxed"
              >
                Keep up to 90% of your profits. Industry-leading splits for successful traders.
              </ScrollReveal>
            </div>
          </motion.div>
        </>
      </div>

      {/* Bottom CTA Section - Visible on all devices */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mt-6 md:mt-8"
      >
        <div className="apple-card rounded-3xl p-6 md:p-12 text-center">
          <ShinyText
            text="✨ Start Your Trading Journey"
            speed={3}
            delay={1}
            color="#b5b5b5"
            shineColor="#ffffff"
            spread={120}
            direction="left"
            yoyo={true}
            className="text-xl md:text-4xl font-semibold mb-3 md:mb-4"
          />
          <div className="max-w-2xl mx-auto mb-6 md:mb-8">
            <ScrollReveal
              baseOpacity={0.2}
              enableBlur
              baseRotation={2}
              blurStrength={3}
              textClassName="text-sm md:text-lg text-white/60"
            >
              Live trade calls, daily analysis, mentorship from funded traders. Since 2024.
            </ScrollReveal>
          </div>
          <button
            onClick={() => setShowSignupModal(true)}
            className="apple-button px-6 py-3 md:px-8 md:py-4 rounded-full text-sm md:text-base font-medium inline-flex items-center gap-2 mx-auto"
          >
            Join Free
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Signup Modal */}
      <SignupModal open={showSignupModal} onClose={() => setShowSignupModal(false)} />
    </div>
  );
}

// Globe Component
const Globe = ({ reducedMotion = false }: { reducedMotion?: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showFallback, setShowFallback] = useState(false);
  const size = reducedMotion ? 480 : 600;
  const mapSamples = reducedMotion ? 8000 : 16000;
  const rotationSpeed = reducedMotion ? 0.008 : 0.015;

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;

    setShowFallback(false);

    try {
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: size * 2,
        height: size * 2,
        phi: 0,
        theta: 0,
        dark: 1,
        diffuse: 1.2,
        mapSamples,
        mapBrightness: 6,
        baseColor: [1, 1, 1],
        markerColor: [1, 1, 1],
        glowColor: [1, 1, 1],
        markers: [
          { location: [37.7595, -122.4367], size: 0.03 },
          { location: [40.7128, -74.006], size: 0.1 },
        ],
        onRender: (state) => {
          state.phi = phi;
          phi += rotationSpeed;
        },
      });
    } catch (e) {
      console.error('[Globe] Failed to create:', e);
      setShowFallback(true);
      return;
    }

    return () => {
      if (globe) {
        try {
          globe.destroy();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [mapSamples, reducedMotion, rotationSpeed, size]);

  if (showFallback) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-6xl">🌍</div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        maxWidth: "100%",
        aspectRatio: 1,
      }}
      className="pointer-events-none opacity-50"
    />
  );
};

// Signup Modal Component
const SignupModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [mt5Number, setMt5Number] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidMT5 = mt5Number.length >= 5;
    const isValidPassword = password.length >= 6;

    if (!isValidEmail) {
      setLoading(false);
      setError("Please enter a valid email address.");
      return;
    }

    if (!isValidMT5) {
      setLoading(false);
      setError("Please enter a valid MT5 ID (min 5 digits).");
      return;
    }

    if (!isValidPassword) {
      setLoading(false);
      setError("Password must be at least 6 characters.");
      return;
    }
    
    // Simulate signup - you can integrate with your actual signup system
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSuccess(true);
    setLoading(false);
    setEmail("");
    setMt5Number("");
    setPassword("");
    setReferralCode("");
    
    setTimeout(() => {
      onClose();
      setSuccess(false);
      setEmail("");
    }, 2000);
  };

  if (!mounted || !open) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="apple-card rounded-3xl p-8 md:p-10 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {!success ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl md:text-3xl font-semibold text-white">
                    Get Started
                  </h3>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-white/60 text-base mb-6">
                  Join thousands of traders and start your funded trading journey today.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      MT5 ID
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={mt5Number}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!/^\d*$/.test(value)) return;
                        setMt5Number(value);
                      }}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="Enter your MT5 ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors pr-12"
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M1 1l22 22" />
                            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                            <path d="M9.88 9.88a2 2 0 0 1 2.84 0L12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-white/40 text-xs mt-1">Minimum 6 characters.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Referral Code (optional)
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="Enter referral or partner code"
                    />
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-950/30 border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="apple-button px-6 py-3 rounded-full text-base font-medium inline-flex items-center gap-2 w-full justify-center disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <p className="text-white/40 text-xs mt-6 text-center">
                  By continuing, you agree to our Terms & Privacy Policy
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Welcome!
                </h3>
                <p className="text-white/60">
                  Check your email to complete registration.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};