"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Image from "next/image";
import createGlobe from "cobe";
import { detectBrowser } from "@/lib/browserDetection";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

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
`;

export function Features() {
  const [copied, setCopied] = useState(false);
  const [copiedBroker, setCopiedBroker] = useState<string | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { isMobile, shouldSkipHeavyEffects } = useUnifiedPerformance();

  useEffect(() => {
    const styleId = 'apple-features-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = APPLE_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  const copyPartnerCode = async () => {
    try {
      await navigator.clipboard.writeText("BM15");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = "BM15";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyBrokerCode = async (code: string, broker: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedBroker(broker);
      setTimeout(() => setCopiedBroker(null), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedBroker(broker);
      setTimeout(() => setCopiedBroker(null), 2000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black py-12 md:py-20 px-4 md:px-8">
      {/* Header - Apple minimalist style */}
      <div className="max-w-7xl mx-auto text-center mb-8 md:mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-6xl font-semibold mb-3 md:mb-4 apple-text-gradient"
        >
          Get Funded
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-xl text-white/60 max-w-2xl mx-auto"
        >
          Trade with the best. Funded by the best.
        </motion.p>
      </div>

      {/* Grid Layout - Mobile optimized and compact */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        
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
              Join our community with exclusive partner code.
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-xs md:text-sm">Code:</span>
              <button
                onClick={copyPartnerCode}
                className="apple-button px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium inline-flex items-center gap-2"
              >
                <span className="font-mono font-semibold">BM15</span>
                {copied ? (
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
              Take the FTMO Challenge. Validate your strategy, access capital.
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
                  src="https://www.vantagemarkets.com/wp-content/themes/vantage/images/logos/vantage_logo_white.svg"
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
              Trade with ultra-low spreads. Partner code: <span className="font-mono font-semibold text-white">BULLMONEY</span>
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <button
              onClick={() => copyBrokerCode("BULLMONEY", "vantage")}
              className="apple-button px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium inline-flex items-center gap-2 w-full justify-center"
            >
              {copiedBroker === "vantage" ? "Copied!" : "Copy Code"}
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
                  src="https://www.xm.com/images/logo/xm-logo-white.svg"
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
              Trade with global broker. Partner code: <span className="font-mono font-semibold text-white">X3R7P</span>
            </p>
          </div>

          <div className="space-y-2 md:space-y-3">
            <button
              onClick={() => copyBrokerCode("X3R7P", "xm")}
              className="apple-button px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-medium inline-flex items-center gap-2 w-full justify-center"
            >
              {copiedBroker === "xm" ? "Copied!" : "Copy Code"}
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

        {/* Desktop only - Globe and feature cards */}
        {!isMobile && (
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
                <p className="text-white/60 text-base leading-relaxed">
                  Get funded in days, not months. Start trading with real capital quickly and efficiently.
                </p>
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
                <p className="text-white/60 text-base leading-relaxed">
                  Keep up to 90% of your profits. Industry-leading splits for successful traders.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="apple-card rounded-3xl p-8 md:p-10 md:col-span-2 flex items-center justify-center min-h-[400px] overflow-hidden"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <Globe />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center space-y-4">
                    <h3 className="text-3xl md:text-4xl font-semibold text-white">
                      Global Trading Network
                    </h3>
                    <p className="text-white/60 text-lg max-w-lg mx-auto">
                      Join thousands of traders worldwide. Trade from anywhere, anytime.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Bottom CTA Section - More compact */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto mt-6 md:mt-8"
      >
        <div className="apple-card rounded-3xl p-6 md:p-12 text-center">
          <h3 className="text-xl md:text-4xl font-semibold text-white mb-3 md:mb-4">
            Ready to get funded?
          </h3>
          <p className="text-white/60 text-sm md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
            Start your journey today with exclusive benefits.
          </p>
          <button
            onClick={() => setShowSignupModal(true)}
            className="apple-button px-6 py-3 md:px-8 md:py-4 rounded-full text-sm md:text-base font-medium inline-flex items-center gap-2 mx-auto"
          >
            Sign Up Now
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
const Globe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;

    try {
      globe = createGlobe(canvasRef.current, {
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        width: 600 * 2,
        height: 600 * 2,
        phi: 0,
        theta: 0,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16000,
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
          phi += 0.005;
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
  }, []);

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
        width: 600,
        height: 600,
        maxWidth: "100%",
        aspectRatio: 1,
      }}
      className="pointer-events-none opacity-30"
    />
  );
};

// Signup Modal Component
const SignupModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate signup - you can integrate with your actual signup system
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSuccess(true);
    setLoading(false);
    
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